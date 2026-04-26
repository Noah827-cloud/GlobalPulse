import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldRunScheduledSync } from './schedule.ts';

test('does not run before the first scheduled time', () => {
  const now = new Date('2026-04-26T07:59:00');
  assert.equal(shouldRunScheduledSync(now, null), false);
});

test('runs at the first scheduled time when there is no previous execution', () => {
  const now = new Date('2026-04-26T08:00:00');
  assert.equal(shouldRunScheduledSync(now, null), true);
});

test('runs later in the same window if the page missed the exact minute', () => {
  const now = new Date('2026-04-26T08:23:00');
  assert.equal(shouldRunScheduledSync(now, null), true);
});

test('does not run twice for the same scheduled window on the same day', () => {
  const now = new Date('2026-04-26T08:23:00');
  const lastRunAt = '2026-04-26T08:05:00';
  assert.equal(shouldRunScheduledSync(now, lastRunAt), false);
});

test('runs for the afternoon window after the morning run already completed', () => {
  const now = new Date('2026-04-26T15:10:00');
  const lastRunAt = '2026-04-26T08:05:00';
  assert.equal(shouldRunScheduledSync(now, lastRunAt), true);
});

test('runs again on a new day after a previous day execution', () => {
  const now = new Date('2026-04-27T08:10:00');
  const lastRunAt = '2026-04-26T15:05:00';
  assert.equal(shouldRunScheduledSync(now, lastRunAt), true);
});
