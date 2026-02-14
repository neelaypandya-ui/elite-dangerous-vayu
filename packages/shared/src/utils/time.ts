/**
 * @vayu/shared — Time & Date Utilities
 *
 * Helpers for parsing, formatting, and comparing Elite Dangerous timestamps.
 * The game writes timestamps in ISO 8601 format: "2024-08-15T18:03:22Z".
 *
 * All functions accept either a Date object or an ISO string and handle
 * both gracefully.
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Coerce a Date | string to a Date, returning an invalid Date on failure. */
function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

/** Month abbreviations for display formatting. */
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse an Elite Dangerous timestamp string into a Date.
 *
 * Elite uses standard ISO 8601 UTC format: `"2024-08-15T18:03:22Z"`.
 * This is natively parseable by the Date constructor, but this function
 * provides a named entry point and guards against invalid input.
 *
 * @param timestamp - The ISO 8601 timestamp string from a journal event.
 * @returns A Date object (may be invalid if the string is unparseable).
 */
export function parseEliteTimestamp(timestamp: string): Date {
  return new Date(timestamp);
}

/**
 * Format a Date to the timestamp format used by Elite Dangerous.
 *
 * Output format: `"2024-08-15T18:03:22Z"` (always UTC, whole seconds).
 *
 * @param date - The Date to format.
 */
export function toEliteTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

/**
 * Return a human-readable "time ago" string.
 *
 * Examples: "just now", "2 minutes ago", "3 hours ago", "5 days ago".
 *
 * Uses the system clock as "now".
 *
 * @param date - A Date or ISO string to compare against the current time.
 */
export function timeAgo(date: Date | string): string {
  const d = toDate(date);
  const now = Date.now();
  const diffMs = now - d.getTime();

  // Future dates or essentially "now".
  if (diffMs < 0 || diffMs < 30_000) {
    return 'just now';
  }

  const diffSec = Math.floor(diffMs / 1_000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffYear >= 1) {
    return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
  }
  if (diffMonth >= 1) {
    return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
  }
  if (diffWeek >= 1) {
    return diffWeek === 1 ? '1 week ago' : `${diffWeek} weeks ago`;
  }
  if (diffDay >= 1) {
    return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
  }
  if (diffHr >= 1) {
    return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`;
  }
  if (diffMin >= 1) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  }
  return `${diffSec} seconds ago`;
}

// ---------------------------------------------------------------------------
// Duration formatting
// ---------------------------------------------------------------------------

/**
 * Format a duration in seconds to a compact human-readable string.
 *
 * Examples:
 *   - 90     -> "1m 30s"
 *   - 3661   -> "1h 1m 1s"
 *   - 86400  -> "1d 0h 0m 0s"
 *   - 0      -> "0s"
 *   - 45     -> "45s"
 *
 * Negative values are treated as zero.
 *
 * @param seconds - Duration in whole seconds.
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';

  const s = Math.floor(seconds);
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3_600);
  const minutes = Math.floor((s % 3_600) / 60);
  const secs = s % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Display formatting
// ---------------------------------------------------------------------------

/**
 * Format a date and time for display.
 *
 * Output: `"Aug 15, 2024 6:03 PM"` (local time).
 *
 * @param date - A Date or ISO string.
 */
export function formatDateTime(date: Date | string): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const month = MONTH_NAMES[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();

  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
}

/**
 * Format a date for display (no time component).
 *
 * Output: `"Aug 15, 2024"` (local time).
 *
 * @param date - A Date or ISO string.
 */
export function formatDate(date: Date | string): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const month = MONTH_NAMES[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();

  return `${month} ${day}, ${year}`;
}

// ---------------------------------------------------------------------------
// Session duration
// ---------------------------------------------------------------------------

/**
 * Calculate and format the duration from a session start time to now.
 *
 * Equivalent to `formatDuration((now - startTime) / 1000)`.
 *
 * @param startTime - When the session started (Date or ISO string).
 */
export function sessionDuration(startTime: Date | string): string {
  const start = toDate(startTime);
  const elapsedSec = Math.max(0, (Date.now() - start.getTime()) / 1_000);
  return formatDuration(elapsedSec);
}

// ---------------------------------------------------------------------------
// Date comparison helpers
// ---------------------------------------------------------------------------

/**
 * Check if a timestamp falls on today (local time).
 *
 * @param date - A Date or ISO string.
 */
export function isToday(date: Date | string): boolean {
  const d = toDate(date);
  if (isNaN(d.getTime())) return false;

  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Check if a timestamp falls within the current week (local time).
 *
 * The week starts on Monday (ISO standard). A date is "this week" if it
 * falls between Monday 00:00:00 and the current moment.
 *
 * @param date - A Date or ISO string.
 */
export function isThisWeek(date: Date | string): boolean {
  const d = toDate(date);
  if (isNaN(d.getTime())) return false;

  const now = new Date();

  // Calculate Monday at 00:00:00 of the current week.
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysSinceMonday,
    0, 0, 0, 0,
  );

  return d.getTime() >= monday.getTime() && d.getTime() <= now.getTime();
}
