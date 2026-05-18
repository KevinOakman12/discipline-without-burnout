// Storage layer — абстракция над хранилищем.
// Сейчас использует localStorage, но интерфейс готов к замене на API.
//
// Контракт данных:
//
// Habit:
//   { id, title, icon, createdAt, archived?, currentStreak, bestStreak, completedDates: [YYYY-MM-DD] }
//
// DayEntry:
//   { date: YYYY-MM-DD,
//     completedHabits: [habitId],        // дублирует habit.completedDates для удобства
//     reflectionAnswers: [string, string, string],
//     emotion: { id, label, group } | null,
//     emotionNote: string,
//     breathingCompleted: boolean,
//     closed: boolean }                  // true если пользователь нажал «Закрыть день»
//
// User:
//   { weeklyProtection: { weekKey, used }, totalClosedDays: number }
//
// Streak state (отдельно от Habit, чтобы не мешать миграциям):
//   { lastProtectedWeek, ... } — пока хранится внутри User

const KEY = 'discipline_v1';
const LISTENERS = new Set();

const defaultState = () => ({
  version: 1,
  habits: [],          // Habit[]
  days: {},            // { [date]: DayEntry }
  user: {
    weeklyProtection: { weekKey: null, used: false },
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
  return setState(s => ({ ...s, habits: s.habits.filter(h => h.id !== id) }));
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
      emotion: null,
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
