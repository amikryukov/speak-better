const test = require('node:test');
const assert = require('node:assert');
const { DRILLS } = require('../src/drills.js');

test('DRILLS has exactly 15 drills, 5 per track', () => {
  assert.strictEqual(DRILLS.length, 15);
  for (const track of ['brevity', 'vocabulary', 'warmth']) {
    assert.strictEqual(DRILLS.filter(d => d.track === track).length, 5);
  }
});

test('every drill has a unique id and required fields', () => {
  const ids = DRILLS.map(d => d.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  for (const d of DRILLS) {
    assert.strictEqual(typeof d.id, 'string');
    assert.strictEqual(typeof d.title, 'string');
    assert.strictEqual(typeof d.description, 'string');
    assert.strictEqual(typeof d.minutes, 'number');
  }
});
