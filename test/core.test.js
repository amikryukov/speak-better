const test = require('node:test');
const assert = require('node:assert');
const c = require('../src/core.js');

function addDays(dateISO, n) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

test('createState defaults goal to 3 and empty sessions', () => {
  assert.deepStrictEqual(c.createState(), { goal: 3, sessions: [] });
});

test('createState accepts a custom goal', () => {
  assert.strictEqual(c.createState(5).goal, 5);
});

test('logSession appends and does not mutate the input', () => {
  const s = c.createState();
  const s2 = c.logSession(s, '2026-11-05', 'brevity-01', 15);
  assert.strictEqual(s.sessions.length, 0);
  assert.deepStrictEqual(s2.sessions, [{ date: '2026-11-05', drillId: 'brevity-01', minutes: 15 }]);
});

test('sessionsOnDate counts sessions on a given day', () => {
  const sessions = [
    { date: '2026-11-05', drillId: 'a', minutes: 10 },
    { date: '2026-11-05', drillId: 'b', minutes: 15 },
    { date: '2026-11-06', drillId: 'c', minutes: 15 },
  ];
  assert.strictEqual(c.sessionsOnDate(sessions, '2026-11-05'), 2);
});

test('computeStreak counts consecutive days ending today', () => {
  const sessions = [
    { date: '2026-11-03', drillId: 'a', minutes: 15 },
    { date: '2026-11-04', drillId: 'b', minutes: 15 },
    { date: '2026-11-05', drillId: 'c', minutes: 15 },
  ];
  assert.strictEqual(c.computeStreak(sessions, '2026-11-05'), 3);
});

test('computeStreak survives a day not yet practiced (counts from yesterday)', () => {
  const sessions = [
    { date: '2026-11-03', drillId: 'a', minutes: 15 },
    { date: '2026-11-04', drillId: 'b', minutes: 15 },
  ];
  assert.strictEqual(c.computeStreak(sessions, '2026-11-05'), 2);
});

test('computeStreak breaks after a genuinely missed day', () => {
  const sessions = [
    { date: '2026-11-02', drillId: 'a', minutes: 15 },
    { date: '2026-11-04', drillId: 'b', minutes: 15 },
  ];
  assert.strictEqual(c.computeStreak(sessions, '2026-11-04'), 1);
});

test('computeStreak counts a day once even with multiple sessions', () => {
  const sessions = [
    { date: '2026-11-05', drillId: 'a', minutes: 10 },
    { date: '2026-11-05', drillId: 'b', minutes: 15 },
  ];
  assert.strictEqual(c.computeStreak(sessions, '2026-11-05'), 1);
});

test('computeStreak is 0 for an empty history', () => {
  assert.strictEqual(c.computeStreak([], '2026-11-05'), 0);
});

test('sessionsThisWeek counts only the Mon-Sun week of today', () => {
  const sessions = [
    { date: '2026-11-01', drillId: 'a', minutes: 15 }, // prev week (Sunday)
    { date: '2026-11-02', drillId: 'b', minutes: 15 }, // Monday
    { date: '2026-11-05', drillId: 'c', minutes: 15 }, // Thursday
    { date: '2026-11-08', drillId: 'd', minutes: 15 }, // Sunday
  ];
  assert.strictEqual(c.sessionsThisWeek(sessions, '2026-11-05'), 3);
});

test('sessionsThisWeek counts each session, including same-day duplicates', () => {
  const sessions = [
    { date: '2026-11-05', drillId: 'a', minutes: 10 },
    { date: '2026-11-05', drillId: 'b', minutes: 15 },
    { date: '2026-11-03', drillId: 'c', minutes: 15 },
  ];
  assert.strictEqual(c.sessionsThisWeek(sessions, '2026-11-05'), 3);
});

test('pickDrillForDate is deterministic and rotates across the library', () => {
  const drills = Array.from({ length: 15 }, (_, i) => ({ id: `d${i}` }));
  const d = '2026-11-02';
  assert.strictEqual(c.pickDrillForDate(drills, d).id, c.pickDrillForDate(drills, d).id);
  const ids = new Set();
  for (let i = 0; i < 15; i++) ids.add(c.pickDrillForDate(drills, addDays(d, i)).id);
  assert.strictEqual(ids.size, 15);
});

test('setGoal returns a new state with the new goal, preserving sessions', () => {
  const s = { goal: 3, sessions: [{ date: '2026-11-05', drillId: 'a', minutes: 15 }] };
  const s2 = c.setGoal(s, 5);
  assert.strictEqual(s.goal, 3);
  assert.strictEqual(s2.goal, 5);
  assert.deepStrictEqual(s2.sessions, s.sessions);
});
