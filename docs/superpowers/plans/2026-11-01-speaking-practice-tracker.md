# Speaking Practice Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, offline PWA that nudges and records daily speaking practice (brevity, vocabulary, warmth/humor) with a streak and a built-in drill library, in Russian.

**Architecture:** A static page with no build step or dependencies. Pure logic (state, streak, week counting, drill rotation) lives in dependency-free `.js` files that run in the browser as plain `<script>` globals and are unit-tested under Node via `node:test`. A thin `main.js` glues the pure logic to the DOM and `localStorage`. PWA support comes from a `manifest.webmanifest` and a `sw.js`.

**Tech Stack:** Vanilla HTML/CSS/JS (ES5-style plain scripts, no modules, no framework), `localStorage`, Node's built-in `node:test` + `assert` for tests, no external CDN.

**Spec:** `docs/superpowers/specs/2026-11-01-speaking-practice-tracker-design.md`

## Global Constraints

- No build step, no framework, no external dependency, no CDN (must work fully offline once cached).
- Works both when served over HTTP (required for PWA/service worker) and when opened via `file://` (plain scripts, no ES modules).
- UI copy in Russian; resources include an English section.
- State persisted in `localStorage` under key `speakBetter.v1`.
- Weekly goal default is 3 sessions; sessions are 10–15 min, solo.
- Logging a session must be a single tap.

## Review Focus

1. **Streak across day boundaries / missed days** — a streak must survive a day you simply haven't practiced *yet* (count from yesterday), but break after a genuinely missed day. Tested in Task 1.
2. **Week boundary (Sunday → Monday)** — sessions in the previous week must not count toward the current week's goal. Tested in Task 1.
3. **First launch / empty state** — app renders with streak 0 and week 0 without throwing. Tested in Task 1 (empty state) and Task 4 (render).
4. **Multiple sessions on the same day** — the day counts once toward the streak, but each session counts toward the weekly total. Tested in Task 1.
5. **Missing/corrupt `localStorage`** — `main.js` falls back to a fresh state instead of crashing. Verified in Task 4.

---

### Task 1: Core state logic

**Files:**
- Create: `src/core.js`
- Create: `test/core.test.js`

**Interfaces:**
- Produces (consumed by Task 4 and its own tests):
  - `createState(goal = 3) -> { goal: number, sessions: Array<{ date: string, drillId: string, minutes: number }> }`
  - `logSession(state, dateISO, drillId, minutes) -> State` (immutable; appends a session)
  - `sessionsOnDate(sessions, dateISO) -> number`
  - `computeStreak(sessions, todayISO) -> number` (counts consecutive days ending today, or yesterday if today has none)
  - `sessionsThisWeek(sessions, todayISO) -> number` (Mon–Sun week containing `todayISO`)
  - `pickDrillForDate(drills, dateISO) -> drill` (deterministic: `daysSinceEpochUTC(dateISO) % drills.length`)

- [ ] **Step 1: Initialize the repository and scaffold files**

Create `src/core.js` and `test/core.test.js` as empty files, then:
```bash
git init -q
git add -A && git commit -q -m "chore: scaffold project"
```
(If `git` is unavailable, skip the commit and note it.)

- [ ] **Step 2: Write the failing tests**

In `test/core.test.js`, using `const test = require('node:test'); const assert = require('node:assert'); const c = require('../src/core.js');`:

```js
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

test('pickDrillForDate is deterministic and rotates across the library', () => {
  const drills = Array.from({ length: 15 }, (_, i) => ({ id: `d${i}` }));
  const d = '2026-11-02';
  assert.strictEqual(c.pickDrillForDate(drills, d).id, c.pickDrillForDate(drills, d).id);
  const ids = new Set();
  for (let i = 0; i < 15; i++) ids.add(c.pickDrillForDate(drills, addDays(d, i)).id);
  assert.strictEqual(ids.size, 15);
});
```

Also add a local helper in the test file:
```js
function addDays(dateISO, n) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --test test/`
Expected: FAIL (functions not defined).

- [ ] **Step 4: Implement the functions in `src/core.js`**

Implement the six functions with the exact signatures above. `dateISO` is always `YYYY-MM-DD`. Work in UTC so results are timezone-stable. End the file with a Node export guard:
```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createState, logSession, sessionsOnDate, computeStreak, sessionsThisWeek, pickDrillForDate };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test test/`
Expected: PASS (11 tests).

- [ ] **Step 6: Commit**

```bash
git add src/core.js test/core.test.js
git commit -m "feat: core state logic (streak, week, drill rotation)"
```

---

### Task 2: Drill library

**Files:**
- Create: `src/drills.js`
- Create: `test/drills.test.js`

**Interfaces:**
- Produces: `DRILLS` — an array of 15 objects, each `{ id: string, track: 'brevity'|'vocabulary'|'warmth', title: string, description: string, minutes: number }`, 5 per track, unique ids.

- [ ] **Step 1: Write the failing tests**

In `test/drills.test.js`:
```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/`
Expected: FAIL (DRILLS undefined).

- [ ] **Step 3: Implement `DRILLS` in `src/drills.js`**

Write 15 drills in Russian, 5 per track, per the spec's drill library (brevity: «60→30→15», BLUF/вывод вперёд, правило трёх, пауза вместо слов-паразитов, чтение с паузами; vocabulary: «Скажи иначе», «Слово дня», описание за 30 секунд, пересказ, словарь из вечернего чтения; warmth: история с неожиданным финалом, аналогия, риторический вопрос, теплота/улыбка в голосе, и one more of the builder's choice). `minutes` is 10–15. End with `if (typeof module !== 'undefined' && module.exports) { module.exports = { DRILLS }; }`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/drills.js test/drills.test.js
git commit -m "feat: drill library (brevity, vocabulary, warmth)"
```

---

### Task 3: App shell (HTML + CSS)

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: `src/core.js`, `src/drills.js`, `src/resources.js` (created in Task 4), `src/main.js` (created in Task 4) as plain `<script src=...>` tags in that order.
- Produces: three tab containers `#tab-today`, `#tab-history`, `#tab-resources`; today-tab elements `#streak`, `#week-count`, `#drill-title`, `#drill-desc`, `#done-button`; history element `#history-list`; resources element `#resources-list`; tab buttons with `data-tab` attributes.

- [ ] **Step 1: Write `index.html`**

A single page with: an inline `<style>` block (system font stack, calm minimal styling, mobile-first, `theme-color` meta for Android), a header, a tab bar (Сегодня / История / Ресурсы), the three tab sections with the element ids above, and the four `<script>` tags at the end of `<body>` in order: `src/core.js`, `src/drills.js`, `src/resources.js`, `src/main.js`. All copy in Russian.

- [ ] **Step 2: Verify the page loads**

Run: `python3 -m http.server 8000` in the project root, open `http://localhost:8000`, and confirm the shell renders with three tabs (the tab contents will be empty until Task 4 — that is expected).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: app shell (HTML + CSS)"
```

---

### Task 4: Resources data + app glue

**Files:**
- Create: `src/resources.js`
- Create: `src/main.js`

**Interfaces:**
- Consumes: `createState`, `logSession`, `computeStreak`, `sessionsThisWeek`, `pickDrillForDate` (Task 1); `DRILLS` (Task 2); the element ids from Task 3.
- Produces: `RESOURCES` — array of `{ track, lang: 'ru'|'en', title, url, note }`; a boot function that renders the UI and persists state.

- [ ] **Step 1: Write `src/resources.js`**

Define `RESOURCES` with the curated Russian materials (books: Гандапас «Камасутра для оратора», Шипунов «Харизматичный оратор», Карнеги «Как выступать публично»; channels/videos: «КОРОЛЬ ГОВОРИТ! Школа ораторского искусства», курс Андрея Бурлуцкого, «Техника речи» Елены Ласкавой; articles: reforma-lab «Как увеличить словарный запас», 4brain «Ораторское искусство: упражнения») plus a short English starter set (e.g., the "3-2-1 Speaking Trick" video, BLUF/Pyramid Principle references). Group each by `track` and mark `lang`. End with the same `module.exports` guard exposing `{ RESOURCES }`.

- [ ] **Step 2: Write `src/main.js`**

On load: read `localStorage['speakBetter.v1']`; if missing or unparseable, use `createState()`. Render the Today tab (streak, week count `sessionsThisWeek(sessions, today) / goal`, and the drill from `pickDrillForDate(DRILLS, today)`), the History tab (sessions newest-first with human-readable dates), and the Resources tab (grouped by track, then lang). Wire the `#done-button` to `logSession(state, today, currentDrillId, 15)`, persist to `localStorage`, and re-render. Wire tab switching via `data-tab` clicks. Recompute `today` with `new Date().toISOString().slice(0,10)` (local-date aware is acceptable here).

- [ ] **Step 3: Verify end-to-end**

With the server from Task 3 running, reload the page and confirm: empty state shows streak 0 and week 0/3; clicking «Готово» increments the week count to 1/3 and the streak to 1, and the session appears in История; refreshing keeps the data; clearing `localStorage` and reloading recovers to a clean state without errors.

- [ ] **Step 4: Commit**

```bash
git add src/resources.js src/main.js
git commit -m "feat: resources and app glue (render, log, persist)"
```

---

### Task 5: PWA (manifest + service worker)

**Files:**
- Create: `manifest.webmanifest`
- Create: `sw.js`

**Interfaces:**
- Consumes: `index.html` and the `src/*.js` files it references.

- [ ] **Step 1: Write `manifest.webmanifest`**

`name` «Практика речи», `short_name` «Практика», `display: standalone`, `start_url: ./`, a `theme_color` and `background_color` (calm neutral), and `icons` (use a single inline SVG data-URI icon to avoid binary assets).

- [ ] **Step 2: Write `sw.js`**

A minimal service worker that caches `./`, `./index.html`, and `./src/core.js`, `./src/drills.js`, `./src/resources.js`, `./src/main.js` on install and serves them cache-first so the app works offline.

- [ ] **Step 3: Link the PWA pieces**

In `index.html`: add `<link rel="manifest" href="./manifest.webmanifest">` and a `<script>` that registers `./sw.js` on load. Add the icons link.

- [ ] **Step 4: Verify**

Reload over `http://localhost:8000`, confirm DevTools → Application shows the manifest and an active service worker, and that the app still loads after stopping the server (offline).

- [ ] **Step 5: Commit**

```bash
git add manifest.webmanifest sw.js index.html
git commit -m "feat: PWA manifest and offline service worker"
```

---

### Task 6: Supporting docs

**Files:**
- Create: `materials.md`
- Create: `practice-reminder.ics`
- Create: `README.md`

- [ ] **Step 1: Write `materials.md`**

The same curated list as `RESOURCES`, as readable Markdown, organized by the three skills with Russian primary and an English section, with one-line notes on how each helps.

- [ ] **Step 2: Write `practice-reminder.ics`**

A `VCALENDAR`/`VEVENT` with `DTSTART` at a fixed time, `DURATION:PT15M`, and `RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR`, `SUMMARY` «Практика речи», so the user can import a recurring reminder into Google/Outlook.

- [ ] **Step 3: Write `README.md`**

How to run (`python3 -m http.server 8000` or any static server), how to add to Home Screen on Android, how the tracker works (goal, streak, one-tap log), and that practice is 10–15 min × 3–5/week.

- [ ] **Step 4: Commit**

```bash
git add materials.md practice-reminder.ics README.md
git commit -m "docs: materials, calendar reminder, README"
```

---

## Self-Review Notes

- **Spec coverage:** all spec sections map to tasks — state/streak/rotation (Task 1), drill library (Task 2), three tabs (Task 3 + 4), PWA/offline/Add-to-Home-Screen (Task 5), materials + calendar reminder + README (Task 6). Weekly goal default 3 and 10–15 min sessions are enforced in Task 1 defaults and Task 4 rendering.
- **Type consistency:** `createState`, `logSession`, `computeStreak`, `sessionsThisWeek`, `pickDrillForDate` signatures match between Task 1's Interfaces and Task 4's usage; `DRILLS` shape matches Task 2 and Task 4.
- **Review Focus:** each of the five lines is pinned to a test in Task 1 or a verification in Task 4.
