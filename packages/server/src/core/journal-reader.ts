/**
 * @vayu/server — Journal File Reader
 *
 * Functions for reading and parsing Elite Dangerous journal files from disk.
 * These are used both for initial state loading (reading the current session's
 * journal) and for historical queries (reading past journals).
 *
 * Journal files are line-delimited JSON files named like:
 *   `Journal.2024-08-15T180322.01.log`
 *
 * Each line is a self-contained JSON object with `timestamp` and `event` fields.
 */

import { readFile, readdir, stat, open } from 'fs/promises';
import path from 'path';
import type { AnyJournalEvent } from '@vayu/shared';
import {
  parseJournalLine,
  parseJournalFile,
  parseJournalFilename,
  sortJournalFiles,
  isJournalFile,
} from '@vayu/shared';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read a single journal file and return all parsed events.
 *
 * Invalid lines are silently skipped. The returned array preserves the
 * order of events as they appear in the file.
 *
 * @param filePath - Absolute path to a journal .log file.
 * @returns Array of parsed journal events.
 */
export async function readJournalFile(filePath: string): Promise<AnyJournalEvent[]> {
  const content = await readFile(filePath, 'utf-8');
  return parseJournalFile(content) as AnyJournalEvent[];
}

/**
 * Find all journal files in a directory, sorted by date (newest first).
 *
 * Only files matching the `Journal.YYYY-MM-DDTHHMMSS.NN.log` pattern are
 * returned. Non-journal files are ignored.
 *
 * @param journalDir - Directory containing journal files.
 * @returns Array of full paths, newest journal first.
 */
export async function findJournalFiles(journalDir: string): Promise<string[]> {
  const entries = await readdir(journalDir);
  const journalNames = entries.filter(isJournalFile);
  const sorted = sortJournalFiles(journalNames);
  return sorted.map((name) => path.join(journalDir, name));
}

/**
 * Read the most recent journal file and return its events.
 *
 * This is the primary way to load the current game session's state at
 * server startup — the latest journal file contains all events since
 * the player last launched the game.
 *
 * @param journalDir - Directory containing journal files.
 * @returns Array of parsed events from the most recent journal, or empty
 *          array if no journal files exist.
 */
export async function readLatestJournal(journalDir: string): Promise<AnyJournalEvent[]> {
  const files = await findJournalFiles(journalDir);
  if (files.length === 0) {
    return [];
  }

  // files[0] is the newest journal
  return readJournalFile(files[0]);
}

/**
 * Read all journal files from the last N days, merged and sorted by timestamp.
 *
 * Events across multiple files are merged into a single chronologically
 * sorted array. This is useful for building historical context (e.g. trade
 * analytics over the past week).
 *
 * @param journalDir - Directory containing journal files.
 * @param days - Number of days into the past to include (default 1).
 * @returns Merged array of events, sorted oldest-first by timestamp.
 */
export async function readRecentJournals(
  journalDir: string,
  days: number = 1,
): Promise<AnyJournalEvent[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffTime = cutoff.getTime();

  const allFiles = await findJournalFiles(journalDir);
  const allEvents: AnyJournalEvent[] = [];

  for (const filePath of allFiles) {
    const basename = path.basename(filePath);
    const parsed = parseJournalFilename(basename);

    // If we can parse the filename, skip files older than the cutoff.
    // sortJournalFiles returns newest first, so once we hit a file
    // older than the cutoff, all remaining files are also older.
    if (parsed && parsed.date.getTime() < cutoffTime) {
      break;
    }

    const events = await readJournalFile(filePath);
    allEvents.push(...events);
  }

  // Sort oldest-first by timestamp for chronological replay.
  allEvents.sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return ta - tb;
  });

  return allEvents;
}

/**
 * Get basic metadata about a journal file without reading the entire thing.
 *
 * Reads the first and last lines to determine the event names and reads
 * the file size from the filesystem. Line count is estimated by scanning
 * for newlines.
 *
 * @param filePath - Absolute path to a journal .log file.
 * @returns Object with file size, line count, and first/last event names.
 */
export async function getJournalInfo(filePath: string): Promise<{
  size: number;
  lines: number;
  firstEvent?: string;
  lastEvent?: string;
}> {
  const stats = await stat(filePath);
  const size = stats.size;

  if (size === 0) {
    return { size, lines: 0 };
  }

  const content = await readFile(filePath, 'utf-8');
  const allLines = content.split('\n').filter((l) => l.trim().length > 0);
  const lines = allLines.length;

  let firstEvent: string | undefined;
  let lastEvent: string | undefined;

  if (allLines.length > 0) {
    const first = parseJournalLine(allLines[0]);
    if (first) {
      firstEvent = first.event;
    }
  }

  if (allLines.length > 1) {
    const last = parseJournalLine(allLines[allLines.length - 1]);
    if (last) {
      lastEvent = last.event;
    }
  } else if (firstEvent) {
    lastEvent = firstEvent;
  }

  return { size, lines, firstEvent, lastEvent };
}

/**
 * Read new bytes from a journal file starting at a given byte offset.
 *
 * This is the core primitive for tail-following: the watcher tracks how
 * many bytes it has already read, and on each change notification calls
 * this function to read only the new content.
 *
 * @param filePath - Absolute path to the journal file.
 * @param fromByte - Byte offset to start reading from.
 * @returns Object with the new text content and the new byte offset.
 */
export async function readJournalTail(
  filePath: string,
  fromByte: number,
): Promise<{ content: string; newOffset: number }> {
  const stats = await stat(filePath);
  const fileSize = stats.size;

  if (fileSize <= fromByte) {
    return { content: '', newOffset: fromByte };
  }

  const handle = await open(filePath, 'r');
  try {
    const bytesToRead = fileSize - fromByte;
    const buffer = Buffer.alloc(bytesToRead);
    const { bytesRead } = await handle.read(buffer, 0, bytesToRead, fromByte);
    const content = buffer.slice(0, bytesRead).toString('utf-8');
    return { content, newOffset: fromByte + bytesRead };
  } finally {
    await handle.close();
  }
}

/**
 * Parse new lines from a tail-read content string into journal events.
 *
 * Handles the edge case where a partial line may be at the end of the
 * read (i.e. the game is in the middle of writing a line). Only complete
 * lines (ending with newline) are parsed; the remainder is returned so
 * the caller can prepend it to the next read.
 *
 * @param content - Raw text content from a tail read.
 * @returns Object with parsed events and any trailing incomplete line.
 */
export function parseTailContent(content: string): {
  events: AnyJournalEvent[];
  remainder: string;
} {
  const events: AnyJournalEvent[] = [];

  // If the content does not end with a newline, the last piece may be
  // an incomplete line — keep it as remainder for the next read.
  const endsWithNewline = content.endsWith('\n') || content.endsWith('\r\n');
  const lines = content.split('\n');

  // If the last element is empty (from a trailing \n), remove it.
  // If the content does NOT end with newline, the last element is incomplete.
  let remainder = '';
  if (!endsWithNewline && lines.length > 0) {
    remainder = lines.pop() ?? '';
  } else if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  for (const line of lines) {
    const event = parseJournalLine(line);
    if (event !== null) {
      events.push(event as AnyJournalEvent);
    }
  }

  return { events, remainder };
}
