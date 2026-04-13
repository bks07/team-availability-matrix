import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { relativeTime } from './time.utils';

describe('relativeTime', () => {
  const NOW = new Date('2026-04-13T12:00:00Z').getTime();

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "just now" for less than 60 seconds ago', () => {
    expect(relativeTime('2026-04-13T11:59:30Z')).toBe('just now');
  });

  it('returns minutes format', () => {
    expect(relativeTime('2026-04-13T11:30:00Z')).toBe('30m ago');
  });

  it('returns hours format', () => {
    expect(relativeTime('2026-04-13T10:00:00Z')).toBe('2h ago');
  });

  it('returns "yesterday" for 1 day ago', () => {
    expect(relativeTime('2026-04-12T12:00:00Z')).toBe('yesterday');
  });

  it('returns days format', () => {
    expect(relativeTime('2026-04-08T12:00:00Z')).toBe('5d ago');
  });

  it('returns months format', () => {
    expect(relativeTime('2026-01-13T12:00:00Z')).toBe('3mo ago');
  });

  it('returns original string for invalid date', () => {
    expect(relativeTime('not-a-date')).toBe('not-a-date');
  });

  it('returns "just now" for future dates', () => {
    expect(relativeTime('2026-04-14T12:00:00Z')).toBe('just now');
  });
});
