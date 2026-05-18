// Smart Streak — поддерживающая логика серий привычек.
//
// Правила:
//   1. Бесплатная защита: 1 раз в неделю можно пропустить день без потери серии.
//      Хранится в user.weeklyProtection (weekKey + used).
//   2. Защита выходных: пропуск в субботу/воскресенье не сбрасывает серию.
//   3. Мягкая потеря: если защита уже использована и пропущен будний день — серия сбрасывается.
//      Сообщение пользователю при этом — поддерживающее.
//
// Эти правила применяются при каждом обновлении состояния (через recomputeStreaks),
// чтобы серии оставались согласованными, даже если пользователь редактирует прошлые дни.

import { addDays, dayDiff, fromKey, isoWeekKey, isWeekend, todayKey, toKey } from './date.js';

// Вычисляет состояние одной привычки на основе её completedDates и текущего user.weeklyProtection.
// Возвращает { currentStreak, bestStreak, lastEvent } — где lastEvent описывает последнее изменение
// (использование защиты или потеря серии) для показа поддерживающего сообщения.
export function computeHabitStreak(habit, today = todayKey()) {
  const completed = new Set(habit.completedDates || []);
  const startKey = habit.createdAt ? toKey(fromKey(habit.createdAt)) : Object.keys(completed)[0] || today;
  const startDate = fromKey(startKey);
  const endDate = fromKey(today);
  if (endDate < startDate) {
    return { currentStreak: 0, bestStreak: habit.bestStreak || 0, events: [], usedProtection: false };
  }

  let current = 0;
  let best = 0;
  let usedProtectionInWeek = {}; // weekKey -> bool
  const events = [];

  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    const key = toKey(d);
    const done = completed.has(key);

    if (done) {
      current += 1;
      if (current > best) best = current;
      continue;
    }

    // Не выполнено
    if (isWeekend(d)) {
      // Защита выходных — серия сохраняется, но не растёт
      events.push({ date: key, type: 'weekend' });
      continue;
    }

    const wk = isoWeekKey(d);
    if (!usedProtectionInWeek[wk]) {
      // Бесплатная еженедельная защита
      usedProtectionInWeek[wk] = true;
      events.push({ date: key, type: 'weekly-protection' });
      continue;
    }

    // Мягкая потеря — серия сбрасывается
    if (current > 0) {
      events.push({ date: key, type: 'streak-lost', wasLength: current });
    }
    current = 0;
  }

  best = Math.max(best, habit.bestStreak || 0);

  return {
    currentStreak: current,
    bestStreak: best,
    events,
    usedProtection: !!usedProtectionInWeek[isoWeekKey(endDate)],
  };
}

// Обновляет все привычки + user.weeklyProtection для текущей недели.
// Возвращает { habits, user, latestEvents } — latestEvents это события за СЕГОДНЯ
// для показа баннеров.
export function recomputeAll(state, today = todayKey()) {
  const habits = [];
  const todaysEvents = [];
  let weekProtectionUsed = false;
  const todayWeek = isoWeekKey(today);

  for (const h of state.habits) {
    const res = computeHabitStreak(h, today);
    habits.push({ ...h, currentStreak: res.currentStreak, bestStreak: res.bestStreak });
    for (const ev of res.events) {
      if (ev.date === today) todaysEvents.push({ habitId: h.id, ...ev });
      // Защита засчитывается на той неделе, к которой относится событие
      if (ev.type === 'weekly-protection' && isoWeekKey(ev.date) === todayWeek) {
        weekProtectionUsed = true;
      }
    }
  }

  const user = {
    ...state.user,
    weeklyProtection: { weekKey: todayWeek, used: weekProtectionUsed },
  };

  // Пересчитать totalClosedDays
  const totalClosedDays = Object.values(state.days).filter(d => d.closed).length;
  user.totalClosedDays = totalClosedDays;

  return { habits, user, todaysEvents };
}

// Поддерживающие сообщения для виджета баннера
export function eventMessage(event) {
  switch (event.type) {
    case 'weekly-protection':
      return {
        tone: 'warm',
        text:
          'Сегодня ты пропустил, но мы сохранили твою серию ❤️\n' +
          'Использована бесплатная защита этой недели.',
      };
    case 'weekend':
      return {
        tone: 'soft',
        text: 'Сегодня день отдыха. Твоя серия сохранена.',
      };
    case 'streak-lost':
      return {
        tone: 'rose',
        text:
          'Серия завершилась, но твой прогресс никуда не исчез.\n' +
          'Ты уже доказал себе, что можешь это делать.\n' +
          'Завтра начинается новая серия.',
      };
    default:
      return null;
  }
}

// Майлстоуны серии — мягкие, поддерживающие
export function milestoneFor(streak) {
  switch (streak) {
    case 3:  return 'Ты уже начал выстраивать ритм.';
    case 7:  return 'Целая неделя. Это уже не случайность.';
    case 14: return 'Ты строишь более сильную версию себя.';
    case 30: return 'Это становится частью твоей личности.';
    case 60: return 'Два месяца — это очень глубокая работа над собой.';
    case 100:return 'Сто дней. Это уже твой характер.';
    default: return null;
  }
}
