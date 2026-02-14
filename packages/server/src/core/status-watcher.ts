/**
 * @vayu/server — Status.json Watcher
 *
 * Watches the Elite Dangerous Status.json file for real-time ship state.
 *
 * Status.json is updated by the game approximately once per second during
 * gameplay. It contains a Flags bitfield indicating the current ship state
 * (docked, landed, in supercruise, etc.), system pips, fire group, GUI
 * focus, fuel levels, cargo mass, legal state, and when applicable
 * latitude/longitude/altitude/heading and a destination.
 *
 * This watcher:
 *   - Monitors Status.json for changes using chokidar
 *   - Only emits when the content has actually changed (deduplication)
 *   - Gracefully handles the file not existing yet
 *   - Emits updates through the central event bus
 */

import chokidar from 'chokidar';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

import { eventBus } from './event-bus.js';

// ---------------------------------------------------------------------------
// Logger prefix
// ---------------------------------------------------------------------------

const LOG_PREFIX = '[status-watcher]';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape of the Status.json file as written by Elite Dangerous.
 *
 * We keep this as a loose record because the schema varies between
 * Horizons and Odyssey, and new fields are added over time.
 */
interface StatusData {
  timestamp: string;
  event: string;
  Flags: number;
  Flags2?: number;
  Pips?: [number, number, number];
  FireGroup?: number;
  GuiFocus?: number;
  Fuel?: { FuelMain: number; FuelReservoir: number };
  Cargo?: number;
  LegalState?: string;
  Latitude?: number;
  Longitude?: number;
  Altitude?: number;
  Heading?: number;
  BodyName?: string;
  PlanetRadius?: number;
  Balance?: number;
  Destination?: {
    System: number;
    Body: number;
    Name: string;
  };
  Oxygen?: number;
  Health?: number;
  Temperature?: number;
  SelectedWeapon?: string;
  SelectedWeapon_Localised?: string;
  Gravity?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Status Watcher
// ---------------------------------------------------------------------------

/**
 * Watches Status.json for real-time ship/player state changes.
 *
 * Usage:
 * ```ts
 * await statusWatcher.start(config.paths.journalDir);
 * // ... status updates flow through eventBus ...
 * statusWatcher.stop();
 * ```
 */
class StatusWatcher {
  /** The chokidar watcher instance. */
  private watcher: chokidar.FSWatcher | null = null;

  /** Last successfully parsed status data (used for dedup). */
  private lastStatus: StatusData | null = null;

  /** Last raw JSON string (used for efficient dedup — compare strings first). */
  private lastRawContent: string = '';

  /** Full path to Status.json. */
  private statusPath: string | null = null;

  /** Whether the watcher is active. */
  private watching = false;

  /** Number of status updates emitted. */
  private updatesEmitted = 0;

  /**
   * Start watching Status.json.
   *
   * @param journalDir - The directory containing Status.json.
   */
  async start(journalDir: string): Promise<void> {
    if (this.watching) {
      console.warn(`${LOG_PREFIX} Already watching — call stop() first.`);
      return;
    }

    this.statusPath = path.join(journalDir, 'Status.json');
    console.log(`${LOG_PREFIX} Starting status watcher on: ${this.statusPath}`);

    // Try to read the initial status if the file already exists.
    if (existsSync(this.statusPath)) {
      await this.readAndEmit(this.statusPath);
    } else {
      console.log(`${LOG_PREFIX} Status.json does not exist yet — waiting for game to create it.`);
    }

    // Watch just the Status.json file.
    this.watcher = chokidar.watch(this.statusPath, {
      usePolling: false,
      // awaitWriteFinish is important here because ED overwrites the file
      // very frequently and we need to ensure we read a complete write.
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 25,
      },
      ignoreInitial: true,
      disableGlobbing: true,
    });

    this.watcher.on('change', () => {
      void this.readAndEmit(this.statusPath!);
    });

    this.watcher.on('add', () => {
      console.log(`${LOG_PREFIX} Status.json created by game.`);
      void this.readAndEmit(this.statusPath!);
    });

    this.watcher.on('error', (error: Error) => {
      console.error(`${LOG_PREFIX} Watcher error:`, error.message);
      eventBus.emitWatcherEvent('error', {
        watcher: 'status',
        message: error.message,
        error,
      });
    });

    this.watching = true;
    eventBus.emitWatcherEvent('started', {
      watcher: 'status',
      message: `Watching ${this.statusPath}`,
    });

    console.log(`${LOG_PREFIX} Watcher active.`);
  }

  /**
   * Stop watching Status.json.
   */
  stop(): void {
    if (this.watcher) {
      void this.watcher.close();
      this.watcher = null;
    }

    this.watching = false;
    this.lastStatus = null;
    this.lastRawContent = '';

    eventBus.emitWatcherEvent('stopped', {
      watcher: 'status',
      message: 'Status watcher stopped',
    });

    console.log(`${LOG_PREFIX} Stopped. Emitted ${this.updatesEmitted} updates total.`);
  }

  /**
   * Get the most recently read status data.
   */
  getStatus(): StatusData | null {
    return this.lastStatus;
  }

  /**
   * Get watcher diagnostics.
   */
  getDiagnostics(): {
    watching: boolean;
    statusPath: string | null;
    updatesEmitted: number;
    hasStatus: boolean;
  } {
    return {
      watching: this.watching,
      statusPath: this.statusPath,
      updatesEmitted: this.updatesEmitted,
      hasStatus: this.lastStatus !== null,
    };
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  /**
   * Read Status.json, check if it changed, and emit if so.
   */
  private async readAndEmit(filePath: string): Promise<void> {
    try {
      const rawContent = await readFile(filePath, 'utf-8');
      const trimmed = rawContent.trim();

      // Fast dedup: if the raw string hasn't changed, skip parsing.
      if (trimmed === this.lastRawContent) {
        return;
      }

      // Status.json can be empty or invalid if ED is mid-write.
      if (trimmed.length === 0) {
        return;
      }

      let parsed: StatusData;
      try {
        parsed = JSON.parse(trimmed) as StatusData;
      } catch {
        // Invalid JSON — ED may be mid-write. Skip this read.
        return;
      }

      // Validate minimal shape — must have Flags at minimum.
      if (typeof parsed.Flags !== 'number') {
        return;
      }

      this.lastRawContent = trimmed;
      this.lastStatus = parsed;
      this.updatesEmitted++;

      eventBus.emitStatusUpdate(parsed as unknown as Record<string, unknown>);
    } catch (err) {
      // File may have been deleted or locked. This is expected during
      // game startup/shutdown transitions.
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      console.error(
        `${LOG_PREFIX} Error reading Status.json:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/** Global status watcher instance. */
export const statusWatcher = new StatusWatcher();
