import { html, useMemo, useState } from '../h.js';
import { HabitCard } from '../components/HabitCard.js';
import { ProgressBar } from '../components/ui/ProgressBar.js';
import { Button } from '../components/ui/Button.js';
import { Milestone } from '../components/Milestone.js';
import { formatGreetingDate, getGreeting, todayKey } from '../utils/date.js';
import { eventMessage, milestoneFor } from '../utils/streak.js';
import { haptic } from '../utils/telegram.js';

export function HomeScreen({ state, onToggleHabit, onAddHabit, onEditHabit, onCloseDay, todaysEvents, recentMilestone, onDismissMilestone }) {
  const today = todayKey();
  const habits = state.habits;
  const day = state.days[today];
  const closed = !!day?.closed;
  const completedHabits = new Set(day?.completedHabits || []);

  const total = habits.length;
  const done = habits.filter(h => completedHabits.has(h.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const banners = useMemo(() => {
    return (todaysEvents || [])
      .map(ev => ({ key: ev.habitId + ev.type, msg: eventMessage(ev) }))
      .filter(b => b.msg)
      // дедуплицируем по типу — одно сообщение на тип в день
      .filter((b, i, arr) => arr.findIndex(x => x.msg.text === b.msg.text) === i);
  }, [todaysEvents]);

  return html`
    <div class="stack-5 fade-in">
      <header class="app-header" style="padding-left:0;padding-right:0;">
        <div class="app-header__greeting">${getGreeting()}</div>
        <div class="app-header__date">${formatGreetingDate()}</div>
      </header>

      <div class="day-summary">
        <div class="day-summary__top">
          <div class="day-summary__title">Сегодняшний прогресс</div>
          <div class="day-summary__pct">${pct}<sup>%</sup></div>
        </div>
        <${ProgressBar} value=${pct} />
        <div class="day-summary__hint">
          ${total === 0
            ? 'Добавь первую привычку, чтобы начать.'
            : done === total
              ? 'Все привычки выполнены. Спокойного вечера.'
              : `${done} из ${total} привычек выполнено`}
        </div>
      </div>

      ${banners.map(b => html`
        <div class=${`banner banner--${b.msg.tone === 'warm' ? 'warm' : b.msg.tone === 'rose' ? 'rose' : ''}`}
             key=${b.key}>${b.msg.text}</div>
      `)}

      <div class="stack-3">
        <div class="section-title">Привычки</div>
        ${habits.length === 0 && html`
          <div class="empty">
            <div class="empty__emoji">🌿</div>
            <div>Пока нет привычек.<br/>Начни с чего-то маленького.</div>
          </div>
        `}
        ${habits.map(h => html`
          <${HabitCard}
            key=${h.id}
            habit=${h}
            done=${completedHabits.has(h.id)}
            onToggle=${() => onToggleHabit(h.id)}
            onEdit=${() => onEditHabit(h.id)}
          />
        `)}
        <button class="add-habit" onClick=${() => { haptic('light'); onAddHabit(); }}>
          <span style="font-size:18px">+</span>
          <span>Добавить привычку</span>
        </button>
      </div>

      <${Button}
        variant="primary"
        size="lg"
        full
        onClick=${onCloseDay}
        hapticType=${closed ? 'light' : 'medium'}
      >
        <span>${closed ? 'День закрыт — посмотреть' : 'Закрыть день'}</span>
      </>

      ${recentMilestone && html`
        <${Milestone}
          streak=${recentMilestone.streak}
          text=${recentMilestone.text}
          onDismiss=${onDismissMilestone}
        />
      `}
    </div>
  `;
}
