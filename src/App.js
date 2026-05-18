import { html, useEffect, useMemo, useState } from './h.js';

import { useStore } from './store/useStore.js';
import { getState, setState, uid, upsertDay, upsertHabit, removeHabit } from './store/storage.js';
import { recomputeAll, milestoneFor } from './utils/streak.js';
import { todayKey } from './utils/date.js';
import { isNegativeEmotion } from './data/emotions.js';
import { haptic, showBackButton } from './utils/telegram.js';

import { BottomNav } from './components/ui/BottomNav.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { HabitEditScreen } from './screens/HabitEditScreen.js';
import { CloseDayScreen } from './screens/CloseDayScreen.js';
import { EmotionsScreen } from './screens/EmotionsScreen.js';
import { BreathingScreen } from './screens/BreathingScreen.js';
import { FinalScreen } from './screens/FinalScreen.js';
import { HistoryScreen } from './screens/HistoryScreen.js';
import { DayDetailScreen } from './screens/DayDetailScreen.js';
import { ProfileScreen } from './screens/ProfileScreen.js';

// Маршрутизация — простая, in-memory. Достаточно для Mini App.
const ROUTES = {
  HOME: 'home',
  HABIT_EDIT: 'habit-edit',
  CLOSE_DAY: 'close-day',
  EMOTIONS: 'emotions',
  HISTORY: 'history',
  PROFILE: 'profile',
  DAY_DETAIL: 'day-detail',
};

export function App() {
  const state = useStore();
  const [route, setRoute] = useState(ROUTES.HOME);
  const [routeParams, setRouteParams] = useState({});
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [finalOpen, setFinalOpen] = useState(false);
  const [suggestBreathing, setSuggestBreathing] = useState(false);
  const [milestone, setMilestone] = useState(null); // { streak, text }
  const [todaysEvents, setTodaysEvents] = useState([]);

  // Перерасчёт серий при каждом изменении состояния.
  useEffect(() => {
    const today = todayKey();
    const { habits, user, todaysEvents: events } = recomputeAll(getState(), today);

    // Применяем только если что-то реально поменялось, чтобы не зацикливаться
    const same = JSON.stringify(habits) === JSON.stringify(getState().habits)
              && JSON.stringify(user) === JSON.stringify(getState().user);
    if (!same) {
      setState(s => ({ ...s, habits, user }));
    }
    setTodaysEvents(events);
    // eslint-disable-next-line
  }, [state.habits.length, state.days, state.habits.map(h => h.completedDates?.length).join(',')]);

  // Telegram BackButton
  const isOnSubScreen = route !== ROUTES.HOME && route !== ROUTES.HISTORY && route !== ROUTES.PROFILE;
  useEffect(() => {
    const cleanup = showBackButton(isOnSubScreen, () => goHome());
    return cleanup;
  }, [isOnSubScreen]);

  const goTo = (r, params = {}) => { setRoute(r); setRouteParams(params); };
  const goHome = () => goTo(ROUTES.HOME);

  // ---------- Привычки ----------
  const handleAddHabit = () => goTo(ROUTES.HABIT_EDIT, { habitId: null });
  const handleEditHabit = (habitId) => goTo(ROUTES.HABIT_EDIT, { habitId });

  const handleSaveHabit = (habit) => {
    const isNew = !habit.id;
    const next = isNew
      ? {
          id: uid(),
          title: habit.title,
          icon: habit.icon,
          createdAt: todayKey(),
          currentStreak: 0,
          bestStreak: 0,
          completedDates: [],
        }
      : { ...state.habits.find(h => h.id === habit.id), ...habit };
    upsertHabit(next);
    haptic('success');
    goHome();
  };

  const handleDeleteHabit = (id) => {
    removeHabit(id);
    haptic('warning');
    goHome();
  };

  // Toggle привычки для указанного дня (по умолчанию — сегодня).
  const handleToggleHabit = (habitId, dateOverride = null) => {
    const today = dateOverride || todayKey();
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;

    const wasCompleted = (habit.completedDates || []).includes(today);
    const completedDates = wasCompleted
      ? habit.completedDates.filter(d => d !== today)
      : [...(habit.completedDates || []), today].sort();

    upsertHabit({ ...habit, completedDates });

    // Обновляем DayEntry
    const dayCompleted = wasCompleted
      ? (state.days[today]?.completedHabits || []).filter(id => id !== habitId)
      : [...new Set([...(state.days[today]?.completedHabits || []), habitId])];
    upsertDay(today, { completedHabits: dayCompleted });

    // Майлстоун — только при выполнении сегодня
    if (!wasCompleted && today === todayKey()) {
      const newStreak = (habit.currentStreak || 0) + 1;
      const text = milestoneFor(newStreak);
      if (text) {
        setMilestone({ streak: newStreak, text });
        haptic('success');
      }
    }
  };

  // ---------- Закрыть день ----------
  const handleStartCloseDay = () => goTo(ROUTES.CLOSE_DAY);

  const handleReflectionComplete = (answers) => {
    const today = todayKey();
    upsertDay(today, { reflectionAnswers: answers });
    goTo(ROUTES.EMOTIONS);
  };

  const handleEmotionComplete = ({ emotion, note }) => {
    const today = todayKey();
    upsertDay(today, { emotion, emotionNote: note, closed: true });
    haptic('success');

    if (isNegativeEmotion(emotion.id)) {
      setSuggestBreathing(true);
      setFinalOpen(true);
    } else {
      setSuggestBreathing(false);
      setFinalOpen(true);
    }
    setRoute(ROUTES.HOME);
  };

  const handleFinalClose = () => {
    setFinalOpen(false);
    setSuggestBreathing(false);
  };

  const handleStartBreathing = () => {
    setFinalOpen(false);
    setBreathingOpen(true);
  };

  const handleBreathingDone = () => {
    const today = todayKey();
    upsertDay(today, { breathingCompleted: true });
  };

  // ---------- Навигация по вкладкам ----------
  const tab = route === ROUTES.HISTORY ? 'history'
            : route === ROUTES.PROFILE ? 'profile'
            : 'home';
  const handleTab = (key) => {
    if (key === 'home')    goTo(ROUTES.HOME);
    if (key === 'history') goTo(ROUTES.HISTORY);
    if (key === 'profile') goTo(ROUTES.PROFILE);
  };

  // ---------- Рендер ----------
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
    const today = todayKey();
    screen = html`
      <${CloseDayScreen}
        initial=${state.days[today]?.reflectionAnswers || ['','','']}
        onComplete=${handleReflectionComplete}
        onBack=${goHome}
      />
    `;
  } else if (route === ROUTES.EMOTIONS) {
    const today = todayKey();
    const d = state.days[today];
    screen = html`
      <${EmotionsScreen}
        initialEmotion=${d?.emotion || null}
        initialNote=${d?.emotionNote || ''}
        onComplete=${handleEmotionComplete}
        onBack=${() => goTo(ROUTES.CLOSE_DAY)}
        ctaLabel="Завершить день"
      />
    `;
  } else if (route === ROUTES.DAY_DETAIL) {
    const date = routeParams.date;
    screen = html`
      <${DayDetailScreen}
        state=${state}
        date=${date}
        onBack=${() => goTo(ROUTES.HISTORY)}
        onToggleHabit=${(id) => handleToggleHabit(id, date)}
        onUpdate=${(patch) => upsertDay(date, patch)}
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
        <${ProfileScreen} state=${state} />
      </div>
    `;
  } else {
    screen = html`
      <div class="app__scroll">
        <${HomeScreen}
          state=${state}
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

  // Нижняя навигация — только на корневых вкладках
  const showNav = route === ROUTES.HOME || route === ROUTES.HISTORY || route === ROUTES.PROFILE;

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
