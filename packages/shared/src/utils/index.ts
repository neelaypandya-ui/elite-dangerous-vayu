/**
 * @vayu/shared — Utilities Barrel Export
 *
 * Re-exports all utility functions for convenient single-import usage:
 *   import { parseJournalLine, resolveShipName, timeAgo, ... } from '@vayu/shared';
 */

// Journal file parsing
export {
  parseJournalLine,
  parseJournalFile,
  parseJournalFilename,
  sortJournalFiles,
  isJournalFile,
  isCompanionFile,
} from './journal-parser.js';

// Internal name resolution and formatting
export {
  resolveShipName,
  resolveModuleName,
  resolveMaterialName,
  cleanLocalizedString,
  formatCredits,
  formatDistance,
} from './name-resolver.js';

// Time and date utilities
export {
  parseEliteTimestamp,
  toEliteTimestamp,
  timeAgo,
  formatDuration,
  formatDateTime,
  formatDate,
  sessionDuration,
  isToday,
  isThisWeek,
} from './time.js';

// Math and calculation utilities
export {
  systemDistance,
  fuelCost,
  maxJumpRange,
  kelvinToCelsius,
  formatSI,
  profitMargin,
  clamp,
  lerp,
  roundTo,
} from './math.js';
