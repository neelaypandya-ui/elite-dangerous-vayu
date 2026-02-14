/**
 * Personal logbook service.
 * Supports voice-dictated and text-based log entries with auto-tagging.
 */

import { gameStateManager } from '../../core/game-state.js';
import { resolveShipName } from '@vayu/shared';

interface LogEntry {
  id: string;
  content: string;
  timestamp: string;
  system: string;
  body: string | null;
  station: string | null;
  ship: string;
  shipName: string;
  tags: string[];
  source: 'text' | 'voice';
}

class LogbookService {
  private entries: LogEntry[] = [];
  private entryCounter = 0;

  addEntry(content: string, source: 'text' | 'voice' = 'text', tags: string[] = []): LogEntry {
    const state = gameStateManager.getState();
    const entry: LogEntry = {
      id: `log-${++this.entryCounter}-${Date.now()}`,
      content,
      timestamp: new Date().toISOString(),
      system: state.location.system,
      body: state.location.body || null,
      station: state.location.station || null,
      ship: resolveShipName(state.ship.ship),
      shipName: state.ship.shipName,
      tags: [...tags, state.location.system],
      source,
    };
    this.entries.push(entry);
    return entry;
  }

  getEntries(limit = 50, offset = 0): LogEntry[] {
    return this.entries.slice().reverse().slice(offset, offset + limit);
  }

  getEntry(id: string): LogEntry | null {
    return this.entries.find((e) => e.id === id) ?? null;
  }

  updateEntry(id: string, content: string, tags?: string[]): LogEntry | null {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry) return null;
    entry.content = content;
    if (tags) entry.tags = tags;
    return entry;
  }

  deleteEntry(id: string): boolean {
    const idx = this.entries.findIndex((e) => e.id === id);
    if (idx < 0) return false;
    this.entries.splice(idx, 1);
    return true;
  }

  searchEntries(query: string): LogEntry[] {
    const lower = query.toLowerCase();
    return this.entries.filter((e) =>
      e.content.toLowerCase().includes(lower) ||
      e.system.toLowerCase().includes(lower) ||
      e.tags.some((t) => t.toLowerCase().includes(lower))
    );
  }

  getEntriesBySystem(system: string): LogEntry[] {
    return this.entries.filter((e) => e.system.toLowerCase() === system.toLowerCase());
  }

  getStats(): object {
    return {
      totalEntries: this.entries.length,
      voiceEntries: this.entries.filter((e) => e.source === 'voice').length,
      textEntries: this.entries.filter((e) => e.source === 'text').length,
      systemsCovered: new Set(this.entries.map((e) => e.system)).size,
    };
  }
}

export const logbookService = new LogbookService();
