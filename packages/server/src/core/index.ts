/**
 * @vayu/server — Core Module Barrel Export
 *
 * Re-exports all core subsystems: event bus, journal reader, file system
 * watchers, game state manager, and bindings parser.
 */

export { eventBus } from './event-bus.js';

export {
  readJournalFile,
  readLatestJournal,
  findJournalFiles,
  readRecentJournals,
  getJournalInfo,
  readJournalTail,
  parseTailContent,
} from './journal-reader.js';

export { journalWatcher } from './journal-watcher.js';
export { statusWatcher } from './status-watcher.js';
export { companionWatcher } from './companion-watcher.js';
export { gameStateManager } from './game-state.js';
export { bindingsParser } from './bindings-parser.js';
