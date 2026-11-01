const STORAGE_KEY = 'speakBetter.v1';

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function loadState(storage) {
  storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  try {
    const raw = storage ? storage.getItem(STORAGE_KEY) : null;
    if (!raw) return createState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.goal !== 'number' || !Array.isArray(parsed.sessions)) {
      return createState();
    }
    return parsed;
  } catch (e) {
    return createState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function trackLabel(track) {
  return { brevity: 'Краткость и темп', vocabulary: 'Словарный запас', warmth: 'Теплота и юмор' }[track] || track;
}

function render(state) {
  const today = todayISO();
  const streak = computeStreak(state.sessions, today);
  const week = sessionsThisWeek(state.sessions, today);
  document.getElementById('streak').textContent = streak;
  document.getElementById('week-count').textContent = week + '/' + state.goal;
  const drill = pickDrillForDate(DRILLS, today);
  document.getElementById('drill-track').textContent = trackLabel(drill.track);
  document.getElementById('drill-title').textContent = drill.title;
  document.getElementById('drill-desc').textContent = drill.description;
  document.getElementById('drill-minutes').textContent = '≈ ' + drill.minutes + ' минут';
  renderHistory(state);
  renderResources();
}

function renderHistory(state) {
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  const items = state.sessions.slice().reverse();
  if (items.length === 0) {
    list.innerHTML = '<li>Пока нет записей.</li>';
    return;
  }
  for (const s of items) {
    const drill = DRILLS.find(d => d.id === s.drillId);
    const li = document.createElement('li');
    li.innerHTML = '<div>' + (drill ? drill.title : s.drillId) + '</div><div class="date">' + s.date + ' · ' + s.minutes + ' мин</div>';
    list.appendChild(li);
  }
}

function renderResources() {
  const container = document.getElementById('resources-list');
  container.innerHTML = '';
  const tracks = [
    { key: 'brevity', label: 'Краткость и темп' },
    { key: 'vocabulary', label: 'Словарный запас' },
    { key: 'warmth', label: 'Теплота и юмор' }
  ];
  for (const t of tracks) {
    const group = document.createElement('div');
    group.className = 'resource-group';
    group.innerHTML = '<h3>' + t.label + '</h3>';
    for (const r of RESOURCES.filter(x => x.track === t.key)) {
      const a = document.createElement('a');
      a.className = 'resource';
      a.href = r.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = '<div class="title">' + r.title + (r.lang === 'en' ? ' (EN)' : '') + '</div><div class="note">' + r.note + '</div>';
      group.appendChild(a);
    }
    container.appendChild(group);
  }
}

function logAndRender(state) {
  const today = todayISO();
  const drill = pickDrillForDate(DRILLS, today);
  const next = logSession(state, today, drill.id, drill.minutes);
  saveState(next);
  render(next);
  return next;
}

function boot() {
  let state = loadState();
  render(state);
  document.getElementById('done-button').addEventListener('click', function () {
    state = logAndRender(state);
  });
  const buttons = document.querySelectorAll('.tab-btn');
  for (const btn of buttons) {
    btn.addEventListener('click', function () {
      const target = btn.getAttribute('data-tab');
      for (const b of document.querySelectorAll('.tab-btn')) b.classList.toggle('active', b === btn);
      for (const t of document.querySelectorAll('.tab')) t.classList.toggle('hidden', t.id !== 'tab-' + target);
    });
  }
}

if (typeof document !== 'undefined' && typeof localStorage !== 'undefined') {
  boot();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STORAGE_KEY, todayISO, loadState, saveState, render, logAndRender, boot };
}
