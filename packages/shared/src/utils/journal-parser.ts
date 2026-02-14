/**
 * @vayu/shared — Journal Parser Utilities
 *
 * Functions for parsing Elite Dangerous journal files. The game writes
 * one JSON object per line into .log files named with a timestamp pattern
 * like `Journal.2024-08-15T180322.01.log`.
 *
 * Companion files (Status.json, Cargo.json, etc.) are standalone JSON
 * files updated in-place by the game.
 */

import type { JournalEvent } from '../types/journal-events.js';

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

/**
 * Matches journal filenames written by Elite Dangerous.
 * Format: `Journal.YYYY-MM-DDTHHMMSS.NN.log`
 *   - Date + time part (no colons — filesystem-safe)
 *   - Two-digit part number
 *
 * Group 1: date-time portion  (e.g. "2024-08-15T180322")
 * Group 2: part number        (e.g. "01")
 */
const JOURNAL_FILENAME_RE =
  /^Journal\.(\d{4}-\d{2}-\d{2}T\d{6})\.(\d{2})\.log$/;

/**
 * Known companion file basenames that ED writes alongside journal files.
 * These are standalone JSON files, not line-delimited logs.
 */
const COMPANION_FILE_NAMES = new Set([
  'Status.json',
  'Cargo.json',
  'Market.json',
  'NavRoute.json',
  'Backpack.json',
  'ModulesInfo.json',
  'Shipyard.json',
  'Outfitting.json',
  'ShipLocker.json',
  'FCMaterials.json',
]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a single journal line (one JSON object) into a typed event.
 *
 * Returns `null` if the line is empty, whitespace-only, or invalid JSON.
 * Does NOT throw on malformed input.
 *
 * @param line - A single line from a journal .log file.
 */
export function parseJournalLine(line: string): JournalEvent | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    // Minimal shape check — must be an object with timestamp + event.
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'timestamp' in parsed &&
      'event' in parsed &&
      typeof (parsed as Record<string, unknown>).timestamp === 'string' &&
      typeof (parsed as Record<string, unknown>).event === 'string'
    ) {
      return parsed as JournalEvent;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse an entire journal file into an array of typed events.
 *
 * Each line is parsed independently; invalid lines are silently skipped.
 * The returned array preserves the order of events in the file.
 *
 * @param content - The full text content of a journal .log file.
 */
export function parseJournalFile(content: string): JournalEvent[] {
  const events: JournalEvent[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const event = parseJournalLine(line);
    if (event !== null) {
      events.push(event);
    }
  }

  return events;
}

/**
 * Extract the date and part number from a journal filename.
 *
 * Expected format: `Journal.2024-08-15T180322.01.log`
 *
 * Returns `null` if the filename does not match the expected pattern.
 *
 * @param filename - The basename (not full path) of the journal file.
 */
export function parseJournalFilename(
  filename: string,
): { date: Date; part: number } | null {
  const match = JOURNAL_FILENAME_RE.exec(filename);
  if (!match) {
    return null;
  }

  const [, dateTimePart, partStr] = match;

  // The time portion is "HHMMSS" — insert colons to make it ISO-parseable.
  // "2024-08-15T180322" -> "2024-08-15T18:03:22Z"
  const isoString =
    dateTimePart.slice(0, 13) +
    ':' +
    dateTimePart.slice(13, 15) +
    ':' +
    dateTimePart.slice(15) +
    'Z';

  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return null;
  }

  return { date, part: parseInt(partStr, 10) };
}

/**
 * Sort journal filenames by date, newest first.
 *
 * Filenames that do not match the journal pattern are placed at the end
 * in their original order.
 *
 * @param filenames - Array of journal filenames (basenames, not full paths).
 * @returns A new sorted array (does not mutate the input).
 */
export function sortJournalFiles(filenames: string[]): string[] {
  return [...filenames].sort((a, b) => {
    const parsedA = parseJournalFilename(a);
    const parsedB = parseJournalFilename(b);

    // Non-journal filenames sink to the end.
    if (!parsedA && !parsedB) return 0;
    if (!parsedA) return 1;
    if (!parsedB) return -1;

    // Newer dates first.
    const timeDiff = parsedB.date.getTime() - parsedA.date.getTime();
    if (timeDiff !== 0) return timeDiff;

    // Same date — higher part number first.
    return parsedB.part - parsedA.part;
  });
}

/**
 * Check whether a filename matches the Elite Dangerous journal pattern.
 *
 * @param filename - The basename to test.
 */
export function isJournalFile(filename: string): boolean {
  return JOURNAL_FILENAME_RE.test(filename);
}

/**
 * Check whether a filename is one of the known companion files
 * (Status.json, Cargo.json, NavRoute.json, etc.).
 *
 * @param filename - The basename to test.
 */
export function isCompanionFile(filename: string): boolean {
  return COMPANION_FILE_NAMES.has(filename);
}
