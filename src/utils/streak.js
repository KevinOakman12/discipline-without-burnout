// Smart Streak — чистая вычислительная логика.
//
// ВАЖНО: currentStreak НИКОГДА не хранится в storage.
// Он всегда вычисляется свежо из completedDates.
// bestStreak хранится в habit.bestStreak и обновляется только при увеличении.
//
// Правила:
//   1. Защита выходных: Сб/Вс не сбрасывают серию.
//   2. Бесплатная защита: 1 будний пропуск в неделю сохраняет серию.
//      Тратится ТОЛЬКО когда current > 0 (есть что защищать).
//   3. Мягкая потеря: после использования защиты — серия сбрасывается.

import { addDays, fromKey, isoWeekKey, isWeekend, todayKey, toKey } from './date.js';

/**
 * Вычисляет текущую серию и события для одной привычки.
 * @returns {{ currentStreak: number, events: Array }}
 */
export function computeHabitStreak(habit, today = todayKey()) {
  const completedDates = habit.completedDates || [];
  const completed = new Set(completedDates);

  // Начало = самая ранняя из дат: createdAt и любая отметка.
  const allDates = [habit.createdAt, ...completedDates].filter(Boolean).sort();
  const startKey  = allDates[0] || today;
  const startDate = fromKey(startKey);
  const endDate   = fromKey(today);

  if (endDate < startDate) {
    return { currentStreak: 0, events: [] };
  }

  let current = 0;
  const usedProtectionInWeek = {}; // weekKey → bool
  const events = [];

  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    const key = toKey(d);

    if (completed.has(key)) {
      current += 1;
      continue;
    }

    // Выходные — серия не сбрасывается (только если есть что хранить)
    if (isWeekend(d)) {
      if (current > 0) events.push({ date: key, type: 'weekend' });
      continue;
    }

    // Сегодняшний день ещё не закончен — не списываем защиту и не сбрасываем серию.
    // Пользователь может ещё отметить привычку сегодня.
    if (key === today) continue;

    const wk = isoWeekKey(d);

    // Бесплатная защита — только когда есть активная серия
    if (current > 0 && !usedProtectionInWeek[wk]) {
      usedProtectionInWeek[wk] = true;
      events.push({ date: key, type: 'weekly-protection' });
      continue;
    }

    // Мягкая потеря
    if (current > 0) {
      events.push({ date: key, type: 'streak-lost', wasLength: current });
    }
    current = 0;
  }

  return { currentStreak: current, events, usedProtectionInWeek };
}

/**
 * Быстрое вычисление только текущей серии (без событий).
 * Используется для отображения в UI.
 */
export function computeCurrentStreak(completedDates, createdAt, today = todayKey()) {
  return computeHabitStreak({ completedDates, createdAt }, today).currentStreak;
}

/**
 * Вычисляет события сегодняшнего дня для всех привычек.
 * Используется для баннеров на главном экране.
 * @returns {{ todaysEvents: Array, weeklyProtectionUsed: boolean }}
 */
export function computeTodayState(habits, today = todayKey()) {
  const todayWeek = isoWeekKey(today);
  const todaysEvents = [];
  let weeklyProtectionUsed = false;

  for (const h of habits) {
    const { events, usedProtectionInWeek } = computeHabitStreak(h, today);
    for (const ev of events) {
      if (ev.date === today) {
        todaysEvents.push({ habitId: h.id, ...ev });
      }
    }
    if (usedProtectionInWeek?.[todayWeek]) {
      weeklyProtectionUsed = true;
    }
  }

  return { todaysEvents, weeklyProtectionUsed };
}

/** Поддерживающие сообщения для баннеров */
export function eventMessage(event) {
  switch (event.type) {
    case 'weekly-protection':
      return {
        tone: 'warm',
        text: 'Сегодня ты пропустил, но мы сохранили твою серию ❤️\nИспользована бесплатная защита этой недели.',
      };
    case 'weekend':
      return {
        tone: 'soft',
        text: 'Сегодня день отдыха. Твоя серия сохранена.',
      };
    case 'streak-lost':
      return {
        tone: 'rose',
        text: 'Серия завершилась, но твой прогресс никуда не исчез.\nТы уже доказал себе, что можешь это делать.\nЗавтра начинается новая серия.',
      };
    default:
      return null;
  }
}

/** Майлстоуны серии */
export function milestoneFor(streak) {
  switch (streak) {
    case 3:   return 'Ты уже начал выстраивать ритм.';
    case 7:   return 'Целая неделя. Это уже не случайность.';
    case 14:  return 'Ты строишь более сильную версию себя.';
    case 30:  return 'Это становится частью твоей личности.';
    case 60:  return 'Два месяца. Это очень глубокая работа.';
    case 100: return 'Сто дней. Это уже твой характер.';
    default:  return null;
  }
}
