/**
 * @vayu/server — Companion File Watcher
 *
 * Watches companion JSON files that Elite Dangerous writes alongside
 * journal files. Unlike Status.json (which updates every second), these
 * files are written more intermittently — typically when the player
 * docks, opens a menu, or triggers specific events.
 *
 * Watched files:
 *   - Cargo.json      — Cargo manifest (written on Cargo journal event)
 *   - Market.json     — Station market data (on docking at a station)
 *   - NavRoute.json   — Plotted route (on NavRoute journal event)
 *   - Backpack.json   — On-foot inventory (Odyssey)
 *   - ModulesInfo.json — Currently fitted ship modules
 *   - Shipyard.json   — Station shipyard listing
 *   - Outfitting.json — Station outfitting listing
 *
 * Each file is watched independently. When a file changes, its content
 * is parsed and emitted through the event bus. A simple string-based
 * dedup prevents emitting identical consecutive updates.
 */

import chokidar from 'chokidar';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

import { eventBus } from './event-bus.js';

// ---------------------------------------------------------------------------
// Logger prefix
// ---------------------------------------------------------------------------

const LOG_PREFIX = '[companion-watcher]';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Companion file definitions.
 * Each entry maps a filename to the event bus emit method to call.
 */
interface CompanionFileDef {
  /** Filename (basename only). */
  filename: string;
  /** Human-readable label for logging. */
  label: string;
  /** Function to emit the parsed data on the event bus. */
  emit: (data: Record<string, unknown>) => void;
}

const COMPANION_FILES: CompanionFileDef[] = [
  {
    filename: 'Cargo.json',
    label: 'cargo',
    emit: (data) => eventBus.emitCargoUpdate(data),
  },
  {
    filename: 'Market.json',
    label: 'market',
    emit: (data) => eventBus.emitMarketUpdate(data),
  },
  {
    filename: 'NavRoute.json',
    label: 'nav route',
    emit: (data) => eventBus.emitNavRouteUpdate(data),
  },
  {
    filename: 'Backpack.json',
    label: 'backpack',
    emit: (data) => eventBus.emitBackpackUpdate(data),
  },
  {
    filename: 'ModulesInfo.json',
    label: 'modules',
    emit: (data) => eventBus.emitModulesUpdate(data),
  },
  {
    filename: 'Shipyard.json',
    label: 'shipyard',
    emit: (data) => eventBus.emitShipyardUpdate(data),
  },
  {
    filename: 'Outfitting.json',
    label: 'outfitting',
    emit: (data) => eventBus.emitOutfittingUpdate(data),
  },
];

// ---------------------------------------------------------------------------
// Companion Watcher
// ---------------------------------------------------------------------------

/**
 * Watches companion JSON files for changes and emits updates via the
 * event bus.
 *
 * Usage:
 * ```ts
 * await companionWatcher.start(config.paths.journalDir);
 * // ... companion updates flow through eventBus ...
 * companionWatcher.stop();
 * ```
 */
class CompanionWatcher {
  /** The chokidar watcher instance. */
  private watcher: chokidar.FSWatcher | null = null;

  /** Last raw content per file — used for deduplication. */
  private lastContent: Map<string, string> = new Map();

  /** Whether the watcher is active. */
  private watching = false;

  /** The journal directory being watched. */
  private journalDir: string | null = null;

  /** Total updates emitted across all companion files. */
  private updatesEmitted = 0;

  /**
   * Start watching companion files.
   *
   * @param journalDir - Directory containing companion JSON files.
   */
  async start(journalDir: string): Promise<void> {
    if (this.watching) {
      console.warn(`${LOG_PREFIX} Already watching — call stop() first.`);
      return;
    }

    this.journalDir = journalDir;
    console.log(`${LOG_PREFIX} Starting companion watcher on: ${journalDir}`);

    // Build full paths and read initial content for files that exist.
    const filePaths: string[] = [];
    for (const def of COMPANION_FILES) {
      const fullPath = path.join(journalDir, def.filename);
      filePaths.push(fullPath);

      if (existsSync(fullPath)) {
        await this.readAndEmit(fullPath, def);
      }
    }

    // Watch all companion files with a single chokidar instance.
    this.watcher = chokidar.watch(filePaths, {
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
      ignoreInitial: true,
      disableGlobbing: true,
    });

    this.watcher.on('change', (filePath: string) => {
      const def = this.findDef(filePath);
      if (def) {
        void this.readAndEmit(filePath, def);
      }
    });

    this.watcher.on('add', (filePath: string) => {
      const def = this.findDef(filePath);
      if (def) {
        console.log(`${LOG_PREFIX} ${def.filename} created by game.`);
        void this.readAndEmit(filePath, def);
      }
    });

    this.watcher.on('error', (error: Error) => {
      console.error(`${LOG_PREFIX} Watcher error:`, error.message);
      eventBus.emitWatcherEvent('error', {
        watcher: 'companion',
        message: error.message,
        error,
      });
    });

    this.watching = true;
    eventBus.emitWatcherEvent('started', {
      watcher: 'companion',
      message: `Watching ${COMPANION_FILES.length} companion files`,
    });

    const existingCount = filePaths.filter((p) => existsSync(p)).length;
    console.log(
      `${LOG_PREFIX} Watcher active — monitoring ${COMPANION_FILES.length} files ` +
        `(${existingCount} currently exist).`,
    );
  }

  /**
   * Stop watching companion files.
   */
  stop(): void {
    if (this.watcher) {
      void this.watcher.close();
      this.watcher = null;
    }

    this.watching = false;
    this.lastContent.clear();

    eventBus.emitWatcherEvent('stopped', {
      watcher: 'companion',
      message: 'Companion watcher stopped',
    });

    console.log(
      `${LOG_PREFIX} Stopped. Emitted ${this.updatesEmitted} updates total.`,
    );
  }

  /**
   * Get watcher diagnostics.
   */
  getDiagnostics(): {
    watching: boolean;
    journalDir: string | null;
    updatesEmitted: number;
    trackedFiles: string[];
  } {
    return {
      watching: this.watching,
      journalDir: this.journalDir,
      updatesEmitted: this.updatesEmitted,
      trackedFiles: Array.from(this.lastContent.keys()).map((p) => path.basename(p)),
    };
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  /**
   * Find the CompanionFileDef that matches a given file path.
   */
  private findDef(filePath: string): CompanionFileDef | undefined {
    const basename = path.basename(filePath);
    return COMPANION_FILES.find((def) => def.filename === basename);
  }

  /**
   * Read a companion file, check for changes, and emit if changed.
   */
  private async readAndEmit(filePath: string, def: CompanionFileDef): Promise<void> {
    try {
      const rawContent = await readFile(filePath, 'utf-8');
      const trimmed = rawContent.trim();

      // Dedup: skip if content is identical to last read.
      if (trimmed === this.lastContent.get(filePath)) {
        return;
      }

      // Empty file — game may be mid-write or clearing it.
      if (trimmed.length === 0) {
        return;
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        // Invalid JSON — game is mid-write. Skip this read.
        return;
      }

      this.lastContent.set(filePath, trimmed);
      this.updatesEmitted++;

      def.emit(parsed);
      console.log(`${LOG_PREFIX} ${def.label} updated`);
    } catch (err) {
      // File deleted or locked — not a real error during gameplay transitions.
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      console.error(
        `${LOG_PREFIX} Error reading ${def.filename}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/** Global companion file watcher instance. */
export const companionWatcher = new CompanionWatcher();
