/**
 * Screenshot manager service.
 * Monitors Elite's screenshot directory, tags with journal metadata.
 */

import { config } from '../../config.js';
import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';
import * as fs from 'fs';
import * as path from 'path';

interface ScreenshotMeta {
  filename: string;
  path: string;
  timestamp: string;
  system: string;
  body: string | null;
  ship: string;
  event: string | null;
  size: number;
}

class ScreenshotsService {
  private screenshots: ScreenshotMeta[] = [];
  private watcher: fs.FSWatcher | null = null;

  constructor() {
    eventBus.onJournalEvent('Screenshot', (evt) => {
      const raw = evt as any;
      const filename = raw.Filename ? path.basename(raw.Filename) : '';
      if (filename) {
        const state = gameStateManager.getState();
        this.screenshots.push({
          filename,
          path: path.join(config.paths.screenshotsDir, filename),
          timestamp: evt.timestamp,
          system: raw.System || state.location.system,
          body: raw.Body || state.location.body || null,
          ship: state.ship.shipName || state.ship.ship,
          event: 'Screenshot',
          size: 0,
        });
      }
    });
  }

  async scanDirectory(): Promise<number> {
    const dir = config.paths.screenshotsDir;
    if (!fs.existsSync(dir)) return 0;

    const files = fs.readdirSync(dir)
      .filter((f) => /\.(bmp|png|jpg|jpeg)$/i.test(f))
      .map((f) => {
        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        return { filename: f, path: fullPath, mtime: stat.mtimeMs, size: stat.size };
      })
      .sort((a, b) => b.mtime - a.mtime);

    const existing = new Set(this.screenshots.map((s) => s.filename));
    for (const file of files) {
      if (!existing.has(file.filename)) {
        this.screenshots.push({
          filename: file.filename,
          path: file.path,
          timestamp: new Date(file.mtime).toISOString(),
          system: 'Unknown',
          body: null,
          ship: 'Unknown',
          event: null,
          size: file.size,
        });
      }
    }

    return files.length;
  }

  getScreenshots(limit = 50, offset = 0): ScreenshotMeta[] {
    return this.screenshots.slice(offset, offset + limit);
  }

  getScreenshotsBySystem(system: string): ScreenshotMeta[] {
    return this.screenshots.filter((s) => s.system.toLowerCase() === system.toLowerCase());
  }

  search(query: string): ScreenshotMeta[] {
    const lower = query.toLowerCase();
    return this.screenshots.filter((s) =>
      s.system.toLowerCase().includes(lower) ||
      s.filename.toLowerCase().includes(lower) ||
      (s.ship && s.ship.toLowerCase().includes(lower))
    );
  }

  getStats(): object {
    return {
      total: this.screenshots.length,
      directory: config.paths.screenshotsDir,
      recentCount: this.screenshots.filter((s) => {
        const age = Date.now() - new Date(s.timestamp).getTime();
        return age < 7 * 24 * 60 * 60 * 1000;
      }).length,
    };
  }
}

export const screenshotsService = new ScreenshotsService();
