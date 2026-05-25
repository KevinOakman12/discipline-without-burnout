// Storage layer — абстракция над хранилищем.
// Сейчас использует localStorage, но интерфейс готов к замене на API.
//
// Контракт данных:
//
// Habit:
//   { id, title, icon, createdAt, bestStreak, completedDates: [YYYY-MM-DD] }
//   NOTE: currentStreak НЕ хранится — всегда вычисляется из completedDates.
//
// DayEntry:
//   { date: YYYY-MM-DD,
//     completedHabits: [habitId],
//     reflectionAnswers: [string, string, string],
//     emotions: [{ id, label, group }],
//     emotionNote: string,
//     breathingCompleted: boolean,
//     closed: boolean }
//
// User:
//   { totalClosedDays: number }

const KEY = 'discipline_v1';
const LISTENERS = new Set();

const defaultState = () => ({
  version: 2,
  habits: [],   // Habit[]  — currentStreak не хранится, только bestStreak
  days: {},     // { [date]: DayEntry }
  user: {
    totalClosedDays: 0,
    onboardedAt: null,
  },
});

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (_) {
    return defaultState();
  }
}

function write(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) {}
}

let state = read();

function notify() {
  for (const fn of LISTENERS) {
    try { fn(state); } catch (_) {}
  }
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  LISTENERS.add(fn);
  return () => LISTENERS.delete(fn);
}

export function setState(updater) {
  const next = typeof updater === 'function' ? updater(state) : updater;
  state = next;
  write(state);
  notify();
  return state;
}

// Удобные мутации
export function patchState(patch) {
  return setState(s => ({ ...s, ...patch }));
}

export function patchUser(patch) {
  return setState(s => ({ ...s, user: { ...s.user, ...patch } }));
}

export function upsertHabit(habit) {
  return setState(s => {
    const habits = [...s.habits];
    const idx = habits.findIndex(h => h.id === habit.id);
    if (idx >= 0) habits[idx] = habit;
    else habits.push(habit);
    return { ...s, habits };
  });
}

export function removeHabit(id) {
  return setState(s => {
    // Удаляем привычку и чистим её id из completedHabits во всех дневных записях.
    const habits = s.habits.filter(h => h.id !== id);
    const days = {};
    for (const [date, day] of Object.entries(s.days)) {
      days[date] = {
        ...day,
        completedHabits: (day.completedHabits || []).filter(hid => hid !== id),
      };
    }
    return { ...s, habits, days };
  });
}

export function getDay(date) {
  return state.days[date] || null;
}

export function upsertDay(date, patch) {
  return setState(s => {
    const prev = s.days[date] || {
      date,
      completedHabits: [],
      reflectionAnswers: ['', '', ''],
      emotions: [],       // массив { id, label, group }
      emotionNote: '',
      breathingCompleted: false,
      closed: false,
    };
    return { ...s, days: { ...s.days, [date]: { ...prev, ...patch } } };
  });
}

export function clearAll() {
  state = defaultState();
  write(state);
  notify();
  return state;
}

// Простой uuid (хватит для локального стора)
export function uid() {
  return 'id_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
