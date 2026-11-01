const test = require('node:test');
const assert = require('node:assert');

global.createState = require('../src/core.js').createState;

const { loadState, STORAGE_KEY } = require('../src/main.js');

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
