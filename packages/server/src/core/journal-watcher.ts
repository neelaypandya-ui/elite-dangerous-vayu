/**
 * @vayu/server — Journal File Watcher
 *
 * Watches the Elite Dangerous journal directory for new events using
 * chokidar file system watching. Implements tail-following: when the
 * game appends a new line to the journal file, we read only the new
 * bytes and parse them.
 *
 * Key behaviors:
 *   - On startup, finds the latest journal file and reads existing events
 *   - Watches for file modifications (new lines appended)
 *   - Watches for new journal files (new game session started)
 *   - Tracks per-file byte offsets for efficient incremental reads
 *   - Emits parsed events through the central event bus
 *   - Handles partial lines (game may be mid-write when we read)
 */

import chokidar from 'chokidar';
import path from 'path';
import { stat } from 'fs/promises';
import { isJournalFile } from '@vayu/shared';
import type { AnyJournalEvent } from '@vayu/shared';

import { eventBus } from './event-bus.js';
import {
  findJournalFiles,
  readJournalFile,
  readJournalTail,
  parseTailContent,
} from './journal-reader.js';

// ---------------------------------------------------------------------------
// Logger prefix
// ---------------------------------------------------------------------------

const LOG_PREFIX = '[journal-watcher]';

// ---------------------------------------------------------------------------
// Journal Watcher
// ---------------------------------------------------------------------------

/**
 * Watches Elite Dangerous journal files for new events in real-time.
 *
 * Usage:
 * ```ts
 * await journalWatcher.start(config.paths.journalDir);
 * // ... events flow through eventBus ...
 * journalWatcher.stop();
 * ```
 */
class JournalWatcher {
  /** The chokidar watcher instance (null when not watching). */
  private watcher: chokidar.FSWatcher | null = null;

  /** The full path to the current (most recent) journal file. */
  private currentFile: string | null = null;

  /** Byte offset tracking for each journal file we are tailing. */
  private filePositions: Map<string, number> = new Map();

  /** Incomplete line remainder from the last tail read per file. */
  private fileRemainders: Map<string, string> = new Map();

  /** Total number of journal events processed since start. */
  private eventsProcessed = 0;

  /** Whether the watcher is actively watching. */
  private watching = false;

  /** The journal directory being watched. */
  private journalDir: string | null = null;

  /**
   * Start watching the journal directory for new events.
   *
   * 1. Finds the most recent journal file.
   * 2. Reads all existing events from it (to populate initial state).
   * 3. Sets up chokidar to watch for changes and new files.
   *
   * @param journalDir - Directory where ED writes journal files.
   */
  async start(journalDir: string): Promise<void> {
    if (this.watching) {
      console.warn(`${LOG_PREFIX} Already watching — call stop() first.`);
      return;
    }

    this.journalDir = journalDir;
    console.log(`${LOG_PREFIX} Starting journal watcher on: ${journalDir}`);

    // -- Step 1: Find the latest journal file --
    const files = await findJournalFiles(journalDir);

    if (files.length > 0) {
      this.currentFile = files[0];
      console.log(`${LOG_PREFIX} Latest journal: ${path.basename(this.currentFile)}`);

      // -- Step 2: Read existing events for initial state --
      try {
        const existingEvents = await readJournalFile(this.currentFile);
        console.log(
          `${LOG_PREFIX} Loaded ${existingEvents.length} existing events from current journal`,
        );

        // Set the file position to the end so we only tail new content.
        const fileStat = await stat(this.currentFile);
        this.filePositions.set(this.currentFile, fileStat.size);

        // Emit existing events so downstream state builders can initialize.
        for (const event of existingEvents) {
          eventBus.emitJournalEvent(event);
          this.eventsProcessed++;
        }
      } catch (err) {
        console.error(
          `${LOG_PREFIX} Error reading existing journal:`,
          err instanceof Error ? err.message : err,
        );
      }
    } else {
      console.log(`${LOG_PREFIX} No existing journal files found — waiting for new ones.`);
    }

    // -- Step 3: Set up chokidar watcher --
    this.watcher = chokidar.watch(journalDir, {
      // Watch only journal .log files using a glob pattern.
      // We only care about Journal.*.log files in this watcher.
      // Companion files are handled by StatusWatcher and CompanionWatcher.
      ignored: (filePath: string) => {
        const basename = path.basename(filePath);
        // Allow the directory itself to pass through.
        if (basename === path.basename(journalDir)) return false;
        // Only watch journal files.
        return !isJournalFile(basename);
      },

      // Performance tuning for Windows:
      usePolling: false,
      // awaitWriteFinish helps ensure we read complete lines on Windows.
      // ED writes one line at a time, but NTFS change notifications can
      // fire before the write is fully flushed.
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
      // Do not emit events for the initial scan (we already read the file).
      ignoreInitial: true,
      // Only watch the top-level directory.
      depth: 0,
    });

    this.watcher.on('change', (filePath: string) => {
      void this.handleFileChange(filePath);
    });

    this.watcher.on('add', (filePath: string) => {
      void this.handleNewFile(filePath);
    });

    this.watcher.on('error', (error: Error) => {
      console.error(`${LOG_PREFIX} Watcher error:`, error.message);
      eventBus.emitWatcherEvent('error', {
        watcher: 'journal',
        message: error.message,
        error,
      });
    });

    this.watching = true;
    eventBus.emitWatcherEvent('started', {
      watcher: 'journal',
      message: `Watching ${journalDir}`,
    });

    console.log(`${LOG_PREFIX} Watcher active — listening for new journal events.`);
  }

  /**
   * Stop watching the journal directory.
   */
  stop(): void {
    if (this.watcher) {
      void this.watcher.close();
      this.watcher = null;
    }

    this.watching = false;
    this.currentFile = null;
    this.filePositions.clear();
    this.fileRemainders.clear();

    eventBus.emitWatcherEvent('stopped', {
      watcher: 'journal',
      message: 'Watcher stopped',
    });

    console.log(`${LOG_PREFIX} Stopped. Processed ${this.eventsProcessed} events total.`);
  }

  /**
   * Get current watcher status for diagnostics.
   */
  getStatus(): {
    watching: boolean;
    currentFile: string | null;
    eventsProcessed: number;
    journalDir: string | null;
    trackedFiles: number;
  } {
    return {
      watching: this.watching,
      currentFile: this.currentFile,
      eventsProcessed: this.eventsProcessed,
      journalDir: this.journalDir,
      trackedFiles: this.filePositions.size,
    };
  }

  // -------------------------------------------------------------------------
  // Private: file change handlers
  // -------------------------------------------------------------------------

  /**
   * Handle a file modification event (new lines appended to existing journal).
   *
   * Reads only the bytes since our last known position, parses any complete
   * lines into journal events, and emits them on the event bus.
   */
  private async handleFileChange(filePath: string): Promise<void> {
    try {
      const currentOffset = this.filePositions.get(filePath) ?? 0;
      const { content, newOffset } = await readJournalTail(filePath, currentOffset);

      if (content.length === 0) {
        return;
      }

      // Prepend any remainder from the last read (partial line).
      const remainder = this.fileRemainders.get(filePath) ?? '';
      const fullContent = remainder + content;

      const result = parseTailContent(fullContent);

      // Store the new offset and any incomplete line.
      this.filePositions.set(filePath, newOffset);
      if (result.remainder.length > 0) {
        this.fileRemainders.set(filePath, result.remainder);
      } else {
        this.fileRemainders.delete(filePath);
      }

      // Emit each parsed event.
      for (const event of result.events) {
        eventBus.emitJournalEvent(event);
        this.eventsProcessed++;
      }

      if (result.events.length > 0) {
        const eventNames = result.events.map((e) => e.event).join(', ');
        console.log(
          `${LOG_PREFIX} +${result.events.length} event(s): ${eventNames}`,
        );
      }
    } catch (err) {
      console.error(
        `${LOG_PREFIX} Error tailing ${path.basename(filePath)}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  /**
   * Handle a new journal file being created (new game session).
   *
   * When Elite Dangerous starts a new session, it creates a new journal
   * file. We switch our tracking to the new file and start tailing from
   * byte 0.
   */
  private async handleNewFile(filePath: string): Promise<void> {
    const basename = path.basename(filePath);

    // Only handle actual journal files (chokidar ignore may not catch everything).
    if (!isJournalFile(basename)) {
      return;
    }

    console.log(`${LOG_PREFIX} New journal file detected: ${basename}`);

    // Update the current file reference.
    this.currentFile = filePath;

    // Start tracking from the beginning of the new file.
    this.filePositions.set(filePath, 0);
    this.fileRemainders.delete(filePath);

    // Give the game a moment to write the initial header events, then
    // read whatever is there so far.
    await delay(200);
    await this.handleFileChange(filePath);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/** Global journal watcher instance. */
export const journalWatcher = new JournalWatcher();
