const test = require('node:test');
const assert = require('node:assert');

const core = require('../src/core.js');
const { DRILLS } = require('../src/drills.js');
const { RESOURCES } = require('../src/resources.js');

global.createState = core.createState;
global.logSession = core.logSession;
global.computeStreak = core.computeStreak;
global.sessionsThisWeek = core.sessionsThisWeek;
global.pickDrillForDate = core.pickDrillForDate;
global.setGoal = core.setGoal;
global.DRILLS = DRILLS;
global.RESOURCES = RESOURCES;

function makeElement(id) {
  const el = {
    id: id || '',
    textContent: '',
    className: '',
    href: '',
    target: '',
    rel: '',
    children: [],
    listeners: {},
    attrs: {}
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return this._innerHTML || ''; },
    set(v) { this._innerHTML = v; if (v === '') this.children = []; }
  });
  el.appendChild = function (child) { this.children.push(child); };
  el.addEventListener = function (ev, fn) { this.listeners[ev] = fn; };
  el.getAttribute = function (name) { return this.attrs[name] || null; };
  el.classList = { toggle(cls, force) { this['_cls_' + cls] = force; } };
  return el;
}

const byId = {};
function getById(id) {
  if (!byId[id]) byId[id] = makeElement(id);
  return byId[id];
}

const tabButtons = ['today', 'history', 'resources', 'settings'].map(name => {
  const el = makeElement();
  el.attrs['data-tab'] = name;
  return el;
});
const tabSections = ['tab-today', 'tab-history', 'tab-resources', 'tab-settings'].map(id => makeElement(id));

global.document = {
  getElementById: getById,
  createElement: () => makeElement(),
  querySelectorAll: (sel) => {
    if (sel === '.tab-btn') return tabButtons;
    if (sel === '.tab') return tabSections;
    return [];
  }
};

const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

const main = require('../src/main.js');

test('app boots empty, logs a session, and recovers from corrupt state', () => {
  // empty render
  assert.strictEqual(getById('streak').textContent, 0);
  assert.strictEqual(getById('week-count').textContent, '0/3');
  assert.ok(getById('drill-title').textContent && getById('drill-title').textContent !== '—');
  assert.strictEqual(getById('history-list').innerHTML, '<li>Пока нет записей.</li>');
  assert.strictEqual(getById('resources-list').children.length, 3);

  // log a session
  getById('done-button').listeners.click();
  assert.strictEqual(getById('streak').textContent, 1);
  assert.strictEqual(getById('week-count').textContent, '1/3');
  assert.strictEqual(getById('history-list').children.length, 1);
  assert.strictEqual(JSON.parse(store['speakBetter.v1']).sessions.length, 1);

  // corrupt state recovery
  store['speakBetter.v1'] = '{"goal":3,"sessions":[null,{}]}';
  main.boot();
  assert.strictEqual(getById('streak').textContent, 0, 'recovers to empty streak');
  assert.strictEqual(getById('week-count').textContent, '0/3');
  assert.strictEqual(typeof getById('done-button').listeners.click, 'function', 'done button wired after recovery');
});
