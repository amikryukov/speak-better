const test = require('node:test');
const assert = require('node:assert');

global.createState = require('../src/core.js').createState;

const { loadState, saveState, STORAGE_KEY } = require('../src/main.js');

function fakeStorage(value) {
  return { getItem: (k) => (k === STORAGE_KEY ? value : null) };
}

test('loadState returns a fresh state when storage is empty', () => {
  const s = loadState(fakeStorage(null));
  assert.deepStrictEqual(s, { goal: 3, sessions: [] });
});

test('loadState falls back on corrupt JSON', () => {
  const s = loadState(fakeStorage('not-json{{'));
  assert.deepStrictEqual(s, { goal: 3, sessions: [] });
});

test('loadState falls back on an invalid shape', () => {
  const s = loadState(fakeStorage(JSON.stringify({ goal: 'x', sessions: 'nope' })));
  assert.deepStrictEqual(s, { goal: 3, sessions: [] });
});

test('loadState returns a valid persisted state', () => {
  const persisted = { goal: 5, sessions: [{ date: '2026-11-05', drillId: 'a', minutes: 15 }] };
  const s = loadState(fakeStorage(JSON.stringify(persisted)));
  assert.deepStrictEqual(s, persisted);
});

test('loadState drops malformed session entries but keeps valid ones', () => {
  const raw = JSON.stringify({
    goal: 3,
    sessions: [
      null,
      {},
      { date: '2026-11-05', drillId: 'a', minutes: 15 },
      { date: 'not-a-date', drillId: 'b', minutes: 15 }
    ]
  });
  assert.deepStrictEqual(loadState(fakeStorage(raw)), {
    goal: 3,
    sessions: [{ date: '2026-11-05', drillId: 'a', minutes: 15 }]
  });
});

test('loadState falls back when goal is not a positive number', () => {
  assert.deepStrictEqual(loadState(fakeStorage(JSON.stringify({ goal: 0, sessions: [] }))), { goal: 3, sessions: [] });
  assert.deepStrictEqual(loadState(fakeStorage(JSON.stringify({ goal: -2, sessions: [] }))), { goal: 3, sessions: [] });
});

test('loadState falls back when storage getItem throws', () => {
  const s = loadState({ getItem() { throw new Error('denied'); } });
  assert.deepStrictEqual(s, { goal: 3, sessions: [] });
});

test('saveState returns false and does not throw when setItem throws', () => {
  const ok = saveState({ goal: 3, sessions: [] }, { setItem() { throw new Error('quota'); } });
  assert.strictEqual(ok, false);
});

test('saveState persists and returns true', () => {
  let stored = null;
  const ok = saveState({ goal: 3, sessions: [] }, { setItem(k, v) { stored = JSON.parse(v); } });
  assert.strictEqual(ok, true);
  assert.deepStrictEqual(stored, { goal: 3, sessions: [] });
});
