# Speaking Practice Tracker — Design

## Intent & why
A daily speaking practice is being started to fix three things, in order of priority:

1. **Brevity & pace** — talking too much, rushing. Goal: fewer words, deliberate pauses, points that land.
2. **Vocabulary** — a too-simple working lexicon. Goal: a richer active vocabulary.
3. **Warmth & humor** — wanting "jokes or something" to make discussions easier to follow and more engaging.

Practice is in **Russian first**, reusable for **English** later (Canadian client work).

## Goals
- A tracker that nudges practice and records it, with a streak and a weekly count.
- 3–5 sessions/week, 10–15 min each, solo practice.
- A built-in library of drills organized by the three skills above.
- A curated list of external materials (videos, exercises, books) in Russian, plus a starter set for English.

## Non-goals
- No backend, no accounts, no sync, no native Android app.
- No push notifications (calendar events handle reminders).
- Not a speech-coaching product — it's a habit tracker with drills.

## Anti-goals
- Anything that takes more than ~10 seconds to log a session (logging friction would kill the habit).
- A bloated app with build tooling or dependencies. It must stay one static page.

## Constraints
- Runs as a single HTML page, offline-capable, data in `localStorage`.
- "Add to Home Screen" on the user's Android phone (PWA manifest + minimal service worker).
- UI in Russian; English resources included in a secondary section for reuse.
- No build step, no framework, no external CDN dependency (works fully offline).

## Approaches considered
1. **File + calendar events** — zero build, start today, but no streak/nudge; easy to abandon.
2. **Single-page PWA** — one HTML file, one-tap logging, streak, today's drill, offline. Best motivation-per-effort. **→ chosen**
3. **Native Android app** — highest effort, no real benefit here. Rejected.

## Decisions (as agreed)
- Frequency: 10–15 min × 3–5/week (short-and-frequent confirmed as better for speaking skills).
- Practice is solo (recording oneself, reading aloud) to start.
- Evening reading is kept separate from tracked practice (passive input, not a logged drill).
- Tracker = Option 2 (single-page PWA), paired with a recurring calendar reminder.

## The app's shape
- **Today tab**: shows today's drill (rotating through the library), a one-tap "Готово" button, current streak, and this week's count vs goal.
- **History tab**: list of logged sessions (date + drill), total sessions.
- **Resources tab**: curated links organized by the three skills, Russian primary + English section.
- Settings: weekly goal (default 3 sessions), reset data.

## Drill library (three tracks)
- **Краткость и темп**: "60→30→15" squeeze, BLUF (вывод вперёд), правило трёх, пауза вместо слов-паразитов, чтение с паузами.
- **Словарный запас**: «Скажи иначе» (синонимы), «Слово дня», описание за 30 секунд, пересказ, словарь из вечернего чтения.
- **Теплота и юмор**: история с неожиданным финалом, аналогия для сложной идеи, риторический вопрос, теплота и улыбка в голосе.

## Deliverables
1. `index.html` — the app (Russian UI, drills + resources embedded).
2. `manifest.webmanifest` + `sw.js` — PWA offline + Add to Home Screen.
3. `materials.md` — the curated resource list (also embedded in the app's Resources tab).
4. `practice-reminder.ics` — recurring 15-min calendar event, 3×/week.
5. `README.md` — how to open/serve the app and use it.

## Left to the builder
- Exact drill wording and which drills ship first (a full library, but a sensible default rotation).
- Visual style (clean, calm, no clutter).
- Which specific external links go in the materials list (grounded in the research already done).
