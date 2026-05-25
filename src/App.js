import { html, useEffect, useMemo, useState } from './h.js';

import { useStore } from './store/useStore.js';
import { getState, uid, upsertDay, upsertHabit, removeHabit } from './store/storage.js';
import { computeHabitStreak, computeTodayState, milestoneFor } from './utils/streak.js';
import { todayKey } from './utils/date.js';
import { hasNegativeEmotion } from './data/emotions.js';
import { haptic, showBackButton } from './utils/telegram.js';

import { BottomNav }         from './components/ui/BottomNav.js';
import { HomeScreen }        from './screens/HomeScreen.js';
import { HabitEditScreen }   from './screens/HabitEditScreen.js';
import { CloseDayScreen }    from './screens/CloseDayScreen.js';
import { EmotionsScreen }    from './screens/EmotionsScreen.js';
import { BreathingScreen }   from './screens/BreathingScreen.js';
import { FinalScreen }       from './screens/FinalScreen.js';
import { HistoryScreen }     from './screens/HistoryScreen.js';
import { DayDetailScreen }   from './screens/DayDetailScreen.js';
import { ProfileScreen }     from './screens/ProfileScreen.js';

const ROUTES = {
  HOME:       'home',
  HABIT_EDIT: 'habit-edit',
  CLOSE_DAY:  'close-day',
  EMOTIONS:   'emotions',
  HISTORY:    'history',
  PROFILE:    'profile',
  DAY_DETAIL: 'day-detail',
};

export function App() {
  const state = useStore();

  const [route, setRoute]               = useState(ROUTES.HOME);
  const [routeParams, setRouteParams]   = useState({});
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [finalOpen, setFinalOpen]       = useState(false);
  const [suggestBreathing, setSuggestBreathing] = useState(false);
  const [milestone, setMilestone]       = useState(null);

  // ---------- Вычисляемые данные (useMemo — всегда актуальны) ----------

  // Серии для каждой привычки: вычисляются свежо из completedDates.
  // Никакого хранения currentStreak в storage нет.
  const streaks = useMemo(() => {
    const today = todayKey();
    const result = {};
    for (const h of state.habits) {
      const { currentStreak } = computeHabitStreak(h, today);
      result[h.id] = { current: currentStreak, best: h.bestStreak || 0 };
    }
    return result;
  }, [state.habits]);

  // События сегодняшнего дня (для баннеров) и флаг использования защиты недели.
  const { todaysEvents, weeklyProtectionUsed } = useMemo(
    () => computeTodayState(state.habits, todayKey()),
    [state.habits]
  );

  // ---------- Telegram BackButton ----------
  const isOnSubScreen = ![ROUTES.HOME, ROUTES.HISTORY, ROUTES.PROFILE].includes(route);
  useEffect(() => {
    return showBackButton(isOnSubScreen, goHome);
  }, [isOnSubScreen]);

  // ---------- Навигация ----------
  const goTo   = (r, params = {}) => { setRoute(r); setRouteParams(params); };
  const goHome = () => goTo(ROUTES.HOME);

  // ---------- Привычки ----------
  const handleAddHabit  = () => goTo(ROUTES.HABIT_EDIT, { habitId: null });
  const handleEditHabit = (id) => goTo(ROUTES.HABIT_EDIT, { habitId: id });

  const handleSaveHabit = (habit) => {
    const isNew = !habit.id;
    const next = isNew
      ? { id: uid(), title: habit.title, icon: habit.icon, createdAt: todayKey(), bestStreak: 0, completedDates: [] }
      : { ...getState().habits.find(h => h.id === habit.id), title: habit.title, icon: habit.icon };
    upsertHabit(next);
    haptic('success');
    goHome();
  };

  const handleDeleteHabit = (id) => {
    removeHabit(id);
    haptic('warning');
    goHome();
  };

  // Toggle привычки для конкретного дня.
  // Вычисляет новую серию «на лету» и сохраняет bestStreak если вырос.
  const handleToggleHabit = (habitId, dateOverride = null) => {
    const targetDate = dateOverride || todayKey();
    const habit = getState().habits.find(h => h.id === habitId);
    if (!habit) return;

    const wasCompleted = (habit.completedDates || []).includes(targetDate);
    const newCompletedDates = wasCompleted
      ? habit.completedDates.filter(d => d !== targetDate)
      : [...(habit.completedDates || []), targetDate].sort();

    // Вычислить новую серию для обновления bestStreak
    const { currentStreak: newCurrent } = computeHabitStreak(
      { ...habit, completedDates: newCompletedDates },
      todayKey()
    );
    const newBest = Math.max(habit.bestStreak || 0, newCurrent);

    upsertHabit({ ...habit, completedDates: newCompletedDates, bestStreak: newBest });

    // Обновить DayEntry — completedHabits для этой даты
    const currentDay = getState().days[targetDate];
    const dayCompleted = wasCompleted
      ? (currentDay?.completedHabits || []).filter(id => id !== habitId)
      : [...new Set([...(currentDay?.completedHabits || []), habitId])];
    upsertDay(targetDate, { completedHabits: dayCompleted });

    // Майлстоун — только при выполнении в сегодняшний день
    if (!wasCompleted && targetDate === todayKey()) {
      haptic(newCurrent > 1 ? 'success' : 'light');
      const text = milestoneFor(newCurrent);
      if (text) setMilestone({ streak: newCurrent, text });
    }
  };

  // ---------- Закрыть день ----------
  const handleStartCloseDay = () => goTo(ROUTES.CLOSE_DAY);

  const handleReflectionComplete = (answers) => {
    upsertDay(todayKey(), { reflectionAnswers: answers });
    goTo(ROUTES.EMOTIONS);
  };

  const handleEmotionComplete = ({ emotions, note }) => {
    upsertDay(todayKey(), { emotions, emotionNote: note, closed: true });
    haptic('success');
    setSuggestBreathing(hasNegativeEmotion(emotions));
    setFinalOpen(true);
    setRoute(ROUTES.HOME);
  };

  const handleFinalClose    = () => { setFinalOpen(false); setSuggestBreathing(false); };
  const handleStartBreathing = () => { setFinalOpen(false); setBreathingOpen(true); };
  const handleBreathingDone  = () => upsertDay(todayKey(), { breathingCompleted: true });

  // ---------- Вкладки ----------
  const tab = route === ROUTES.HISTORY ? 'history'
            : route === ROUTES.PROFILE ? 'profile'
            : 'home';

  const handleTab = (key) => {
    haptic('select');
    if (key === 'home')    goTo(ROUTES.HOME);
    if (key === 'history') goTo(ROUTES.HISTORY);
    if (key === 'profile') goTo(ROUTES.PROFILE);
  };

  // ---------- Рендер экранов ----------
  let screen = null;

  if (route === ROUTES.HABIT_EDIT) {
    const habit = routeParams.habitId
      ? state.habits.find(h => h.id === routeParams.habitId)
      : null;
    screen = html`
      <${HabitEditScreen}
        habit=${habit}
        onSave=${handleSaveHabit}
        onDelete=${handleDeleteHabit}
        onBack=${goHome}
      />
    `;

  } else if (route === ROUTES.CLOSE_DAY) {
    const d = state.days[todayKey()];
    screen = html`
      <${CloseDayScreen}
        initial=${d?.reflectionAnswers || ['', '', '']}
        onComplete=${handleReflectionComplete}
        onBack=${goHome}
      />
    `;

  } else if (route === ROUTES.EMOTIONS) {
    const d = state.days[todayKey()];
    const initEmotions = d?.emotions?.length ? d.emotions : (d?.emotion ? [d.emotion] : []);
    screen = html`
      <${EmotionsScreen}
        initialEmotions=${initEmotions}
        initialNote=${d?.emotionNote || ''}
        onComplete=${handleEmotionComplete}
        onBack=${() => goTo(ROUTES.CLOSE_DAY)}
        ctaLabel="Завершить день"
      />
    `;

  } else if (route === ROUTES.DAY_DETAIL) {
    screen = html`
      <${DayDetailScreen}
        state=${state}
        date=${routeParams.date}
        onBack=${() => goTo(ROUTES.HISTORY)}
        onToggleHabit=${(id) => handleToggleHabit(id, routeParams.date)}
        onUpdate=${(patch) => upsertDay(routeParams.date, patch)}
      />
    `;

  } else if (route === ROUTES.HISTORY) {
    screen = html`
      <div class="app__scroll">
        <${HistoryScreen}
          state=${state}
          onOpenDay=${(date) => goTo(ROUTES.DAY_DETAIL, { date })}
        />
      </div>
    `;

  } else if (route === ROUTES.PROFILE) {
    screen = html`
      <div class="app__scroll">
        <${ProfileScreen}
          state=${state}
          streaks=${streaks}
          weeklyProtectionUsed=${weeklyProtectionUsed}
        />
      </div>
    `;

  } else {
    screen = html`
      <div class="app__scroll">
        <${HomeScreen}
          state=${state}
          streaks=${streaks}
          todaysEvents=${todaysEvents}
          onToggleHabit=${handleToggleHabit}
          onAddHabit=${handleAddHabit}
          onEditHabit=${handleEditHabit}
          onCloseDay=${handleStartCloseDay}
          recentMilestone=${milestone}
          onDismissMilestone=${() => setMilestone(null)}
        />
      </div>
    `;
  }

  const showNav = [ROUTES.HOME, ROUTES.HISTORY, ROUTES.PROFILE].includes(route);

  return html`
    <div class="app">
      ${screen}
      ${showNav && html`<${BottomNav} active=${tab} onChange=${handleTab} />`}

      <${FinalScreen}
        open=${finalOpen}
        suggestBreathing=${suggestBreathing}
        onClose=${handleFinalClose}
        onBreathing=${handleStartBreathing}
      />

      <${BreathingScreen}
        open=${breathingOpen}
        onClose=${() => setBreathingOpen(false)}
        onCompleted=${handleBreathingDone}
      />
    </div>
  `;
}
