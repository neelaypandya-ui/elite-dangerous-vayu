/**
 * AGNI — Unit tests for time.ts
 *
 * Tests all time utility functions: parsing, formatting, relative time,
 * duration formatting, and date comparison helpers.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
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

// ---------------------------------------------------------------------------
// parseEliteTimestamp
// ---------------------------------------------------------------------------

describe('parseEliteTimestamp()', () => {
  it('should parse a standard Elite Dangerous timestamp', () => {
    const date = parseEliteTimestamp('2024-08-15T18:03:22Z');
    expect(date).toBeInstanceOf(Date);
    expect(date.getUTCFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(7); // August = 7 (0-indexed)
    expect(date.getUTCDate()).toBe(15);
    expect(date.getUTCHours()).toBe(18);
    expect(date.getUTCMinutes()).toBe(3);
    expect(date.getUTCSeconds()).toBe(22);
  });

  it('should return an Invalid Date for garbage input', () => {
    const date = parseEliteTimestamp('not-a-date');
    expect(isNaN(date.getTime())).toBe(true);
  });

  it('should handle empty string', () => {
    const date = parseEliteTimestamp('');
    expect(isNaN(date.getTime())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toEliteTimestamp
// ---------------------------------------------------------------------------

describe('toEliteTimestamp()', () => {
  it('should format a Date to Elite timestamp without milliseconds', () => {
    const date = new Date('2024-08-15T18:03:22.456Z');
    expect(toEliteTimestamp(date)).toBe('2024-08-15T18:03:22Z');
  });

  it('should handle dates with zero milliseconds', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    expect(toEliteTimestamp(date)).toBe('2024-01-01T00:00:00Z');
  });

  it('should preserve UTC timezone', () => {
    const date = new Date(Date.UTC(2025, 11, 31, 23, 59, 59));
    expect(toEliteTimestamp(date)).toBe('2025-12-31T23:59:59Z');
  });
});

// ---------------------------------------------------------------------------
// timeAgo
// ---------------------------------------------------------------------------

describe('timeAgo()', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "just now" for future dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T12:00:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:05:00Z'))).toBe('just now');
  });

  it('should return "just now" for very recent dates (< 30 seconds)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T12:00:30Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:05Z'))).toBe('just now');
  });

  it('should return seconds ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T12:01:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('1 minute ago');
  });

  it('should return "45 seconds ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T12:00:45Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('45 seconds ago');
  });

  it('should return singular "1 minute ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T12:01:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('1 minute ago');
  });

  it('should return plural "5 minutes ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T12:05:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('5 minutes ago');
  });

  it('should return singular "1 hour ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T13:00:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('1 hour ago');
  });

  it('should return plural "3 hours ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T15:00:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('3 hours ago');
  });

  it('should return singular "1 day ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-16T12:00:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('1 day ago');
  });

  it('should return plural "5 days ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-20T12:00:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('5 days ago');
  });

  it('should return singular "1 week ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-22T12:00:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('1 week ago');
  });

  it('should return plural "2 weeks ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-29T12:00:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('2 weeks ago');
  });

  it('should return singular "1 month ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-09-15T12:00:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('1 month ago');
  });

  it('should return plural "3 months ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-11-15T12:00:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('3 months ago');
  });

  it('should return singular "1 year ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-08-15T12:00:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('1 year ago');
  });

  it('should return plural "2 years ago"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-15T12:00:00Z'));

    expect(timeAgo(new Date('2024-08-15T12:00:00Z'))).toBe('2 years ago');
  });

  it('should accept ISO string input', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T15:00:00Z'));

    expect(timeAgo('2024-08-15T12:00:00Z')).toBe('3 hours ago');
  });
});

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe('formatDuration()', () => {
  it('should format 0 seconds', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('should format negative values as 0s', () => {
    expect(formatDuration(-10)).toBe('0s');
  });

  it('should format seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s');
  });

  it('should format hours, minutes, and seconds', () => {
    expect(formatDuration(3661)).toBe('1h 1m 1s');
  });

  it('should format full day', () => {
    expect(formatDuration(86400)).toBe('1d 0h 0m 0s');
  });

  it('should format complex duration', () => {
    // 2 days, 3 hours, 15 minutes, 42 seconds
    const total = 2 * 86400 + 3 * 3600 + 15 * 60 + 42;
    expect(formatDuration(total)).toBe('2d 3h 15m 42s');
  });

  it('should format exactly 1 minute', () => {
    expect(formatDuration(60)).toBe('1m 0s');
  });

  it('should format exactly 1 hour', () => {
    expect(formatDuration(3600)).toBe('1h 0m 0s');
  });

  it('should handle fractional seconds by truncating', () => {
    expect(formatDuration(90.7)).toBe('1m 30s');
  });
});

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------

describe('formatDateTime()', () => {
  it('should format a Date object', () => {
    // Use a specific UTC time and check the local formatting
    const date = new Date(2024, 7, 15, 18, 3, 22); // Aug 15, 2024 6:03 PM local
    const result = formatDateTime(date);

    expect(result).toContain('Aug');
    expect(result).toContain('15');
    expect(result).toContain('2024');
    expect(result).toContain('6:03 PM');
  });

  it('should handle midnight (12 AM)', () => {
    const date = new Date(2024, 0, 1, 0, 0, 0); // Jan 1, 2024 midnight
    const result = formatDateTime(date);

    expect(result).toContain('12:00 AM');
  });

  it('should handle noon (12 PM)', () => {
    const date = new Date(2024, 0, 1, 12, 0, 0);
    const result = formatDateTime(date);

    expect(result).toContain('12:00 PM');
  });

  it('should accept ISO string input', () => {
    const result = formatDateTime('2024-08-15T18:03:22Z');
    // The exact output depends on the local timezone, but it should contain the date components
    expect(result).toContain('2024');
    expect(result).not.toBe('Invalid Date');
  });

  it('should return "Invalid Date" for invalid input', () => {
    expect(formatDateTime('garbage')).toBe('Invalid Date');
  });

  it('should pad minutes with leading zero', () => {
    const date = new Date(2024, 0, 1, 9, 5, 0);
    const result = formatDateTime(date);
    expect(result).toContain('9:05');
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate()', () => {
  it('should format a Date without time component', () => {
    const date = new Date(2024, 7, 15);
    expect(formatDate(date)).toBe('Aug 15, 2024');
  });

  it('should accept ISO string input', () => {
    const result = formatDate('2024-01-01T00:00:00Z');
    expect(result).toContain('2024');
    expect(result).not.toBe('Invalid Date');
  });

  it('should return "Invalid Date" for invalid input', () => {
    expect(formatDate('not-a-date')).toBe('Invalid Date');
  });

  it('should handle December correctly', () => {
    const date = new Date(2024, 11, 25);
    expect(formatDate(date)).toBe('Dec 25, 2024');
  });

  it('should handle January correctly', () => {
    const date = new Date(2024, 0, 1);
    expect(formatDate(date)).toBe('Jan 1, 2024');
  });
});

// ---------------------------------------------------------------------------
// sessionDuration
// ---------------------------------------------------------------------------

describe('sessionDuration()', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate duration from start time to now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T12:01:30Z'));

    const result = sessionDuration('2024-08-15T12:00:00Z');
    expect(result).toBe('1m 30s');
  });

  it('should return 0s when start time is in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T12:00:00Z'));

    const result = sessionDuration('2024-08-15T13:00:00Z');
    expect(result).toBe('0s');
  });

  it('should handle Date object as input', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-15T13:00:00Z'));

    const result = sessionDuration(new Date('2024-08-15T12:00:00Z'));
    expect(result).toBe('1h 0m 0s');
  });
});

// ---------------------------------------------------------------------------
// isToday
// ---------------------------------------------------------------------------

describe('isToday()', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for the current date', () => {
    expect(isToday(new Date())).toBe(true);
  });

  it('should return false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });

  it('should return false for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isToday(tomorrow)).toBe(false);
  });

  it('should accept ISO string input', () => {
    // Today in local time
    const now = new Date();
    const isoStr = now.toISOString();
    // This may or may not be "today" depending on timezone offset,
    // but the function should not throw
    expect(typeof isToday(isoStr)).toBe('boolean');
  });

  it('should return false for invalid date', () => {
    expect(isToday('not-a-date')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isThisWeek
// ---------------------------------------------------------------------------

describe('isThisWeek()', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for the current moment', () => {
    expect(isThisWeek(new Date())).toBe(true);
  });

  it('should return false for a date far in the past', () => {
    expect(isThisWeek(new Date('2020-01-01T00:00:00Z'))).toBe(false);
  });

  it('should return false for a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    expect(isThisWeek(future)).toBe(false);
  });

  it('should return false for invalid date', () => {
    expect(isThisWeek('garbage')).toBe(false);
  });

  it('should handle Monday boundary correctly', () => {
    vi.useFakeTimers();
    // Set to Wednesday Aug 14, 2024
    vi.setSystemTime(new Date(2024, 7, 14, 12, 0, 0));

    // Monday of this week: Aug 12, 2024
    expect(isThisWeek(new Date(2024, 7, 12, 1, 0, 0))).toBe(true);

    // Sunday before (Aug 11) — previous week
    expect(isThisWeek(new Date(2024, 7, 11, 23, 0, 0))).toBe(false);
  });

  it('should treat Sunday as the last day of the week', () => {
    vi.useFakeTimers();
    // Set to Sunday Aug 18, 2024
    vi.setSystemTime(new Date(2024, 7, 18, 12, 0, 0));

    // Monday of this week: Aug 12, 2024
    expect(isThisWeek(new Date(2024, 7, 12, 0, 0, 0))).toBe(true);
    expect(isThisWeek(new Date(2024, 7, 18, 11, 0, 0))).toBe(true);
  });
});
