import test from 'node:test';
import assert from 'node:assert/strict';
import { startOfWeekUTC } from './dates.js';

test('midweek date maps to the Monday of that week', () => {
  assert.equal(startOfWeekUTC('2026-10-14').toISOString(), '2026-10-12T00:00:00.000Z');
});
test('Sunday belongs to the week that started the previous Monday', () => {
  assert.equal(startOfWeekUTC('2026-10-18').toISOString(), '2026-10-12T00:00:00.000Z');
});
test('Monday maps to itself', () => {
  assert.equal(startOfWeekUTC('2026-10-12').toISOString(), '2026-10-12T00:00:00.000Z');
});
test('invalid input returns null', () => {
  assert.equal(startOfWeekUTC('not-a-date'), null);
});
