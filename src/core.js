function createState(goal = 3) {
  return { goal, sessions: [] };
}

function logSession(state, dateISO, drillId, minutes) {
  return {
    goal: state.goal,
    sessions: state.sessions.concat([{ date: dateISO, drillId, minutes }])
  };
}

function sessionsOnDate(sessions, dateISO) {
  return sessions.filter(s => s.date === dateISO).length;
}

function daysSinceEpochUTC(dateISO) {
  const [y, m, d] = dateISO.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function addDaysUTC(dateISO, n) {
  return new Date((daysSinceEpochUTC(dateISO) + n) * 86400000).toISOString().slice(0, 10);
}

function computeStreak(sessions, todayISO) {
  const dates = new Set(sessions.map(s => s.date));
  let current = dates.has(todayISO) ? todayISO : addDaysUTC(todayISO, -1);
  let streak = 0;
  while (dates.has(current)) {
    streak++;
    current = addDaysUTC(current, -1);
  }
  return streak;
}

function sessionsThisWeek(sessions, todayISO) {
  const todayDays = daysSinceEpochUTC(todayISO);
  const dow = new Date(todayDays * 86400000).getUTCDay(); // 0=Sun..6=Sat
  const offset = dow === 0 ? -6 : 1 - dow;
  const mondayDays = todayDays + offset;
  const monday = new Date(mondayDays * 86400000).toISOString().slice(0, 10);
  const sunday = new Date((mondayDays + 6) * 86400000).toISOString().slice(0, 10);
  return sessions.filter(s => s.date >= monday && s.date <= sunday).length;
}

function pickDrillForDate(drills, dateISO) {
  return drills[daysSinceEpochUTC(dateISO) % drills.length];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createState,
    logSession,
    sessionsOnDate,
    computeStreak,
    sessionsThisWeek,
    pickDrillForDate
  };
}
