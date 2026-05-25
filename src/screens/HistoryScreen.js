import { html, useState, useMemo } from '../h.js';
import { Button } from '../components/ui/Button.js';
import { MONTH_NAMES, WEEKDAY_SHORT, todayKey, toKey, fromKey, weekdayIdx, formatDateLong } from '../utils/date.js';
import { findEmotion } from '../data/emotions.js';
import { haptic } from '../utils/telegram.js';

export function HistoryScreen({ state, onOpenDay }) {
  const today = todayKey();
  const todayDate = fromKey(today);
  const [cursor, setCursor] = useState({ y: todayDate.getFullYear(), m: todayDate.getMonth() });

  const cells = useMemo(() => buildMonth(cursor.y, cursor.m), [cursor]);

  const goPrev = () => {
    haptic('select');
    let { y, m } = cursor;
    m -= 1; if (m < 0) { m = 11; y -= 1; }
    setCursor({ y, m });
  };
  const goNext = () => {
    haptic('select');
    let { y, m } = cursor;
    if (y > todayDate.getFullYear() || (y === todayDate.getFullYear() && m >= todayDate.getMonth())) return;
    m += 1; if (m > 11) { m = 0; y += 1; }
    setCursor({ y, m });
  };

  const cellStatus = (dateKey) => {
    const day = state.days[dateKey];
    const habits = state.habits;
    const completed = day?.completedHabits?.length || 0;
    const total = habits.length;
    // Зелёная подсветка только при реальных выполненных привычках.
    // Закрытый день без выполненных привычек обозначается только точкой (.calendar__cell--reflected),
    // а не зелёным фоном — чтобы удалённые привычки не оставляли ложной окраски.
    if (total > 0 && completed >= total && day?.closed) return 'completed';
    if (completed > 0) return 'partial';
    return 'empty';
  };

  return html`
    <div class="fade-in stack-5">
      <header class="app-header" style="padding:var(--sp-3) 0">
        <div class="app-header__greeting">История</div>
        <div class="app-header__date">Любой день можно открыть и изменить</div>
      </header>

      <div class="calendar">
        <div class="calendar__head">
          <button class="calendar__nav" onClick=${goPrev} aria-label="Предыдущий месяц">‹</button>
          <div class="calendar__month">${MONTH_NAMES[cursor.m]} ${cursor.y}</div>
          <button class="calendar__nav" onClick=${goNext} aria-label="Следующий месяц">›</button>
        </div>

        <div class="calendar__grid">
          ${WEEKDAY_SHORT.map(w => html`<div key=${w} class="calendar__wd">${w}</div>`)}
          ${cells.map((c, i) => {
            if (!c) return html`<div key=${i} class="calendar__cell calendar__cell--empty"></div>`;
            const status = cellStatus(c.key);
            const isToday = c.key === today;
            const isFuture = fromKey(c.key) > todayDate;
            const reflected = !!state.days[c.key]?.closed;
            const cls = [
              'calendar__cell',
              isToday && 'calendar__cell--today',
              status === 'completed' && 'calendar__cell--completed',
              status === 'partial' && 'calendar__cell--partial',
              reflected && 'calendar__cell--reflected',
              isFuture && 'calendar__cell--future',
            ].filter(Boolean).join(' ');
            return html`
              <button
                key=${c.key}
                class=${cls}
                onClick=${() => { haptic('light'); onOpenDay(c.key); }}
                disabled=${isFuture}
              >${c.d}</button>
            `;
          })}
        </div>
      </div>

      <div class="legend">
        <div><span class="legend__dot" style="background:var(--accent)"></span>Все выполнено</div>
        <div><span class="legend__dot" style="background:var(--accent-faint);border:1px solid var(--accent-soft)"></span>Частично</div>
        <div><span class="legend__dot" style="background:var(--warm);border-radius:50%"></span>Рефлексия</div>
      </div>

      <${RecentDaysList} state=${state} onOpenDay=${onOpenDay} />
    </div>
  `;
}

function buildMonth(y, m) {
  const first = new Date(y, m, 1);
  const offset = weekdayIdx(first); // dni от пн
  const last = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= last; d++) {
    cells.push({ d, key: toKey(new Date(y, m, d)) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function RecentDaysList({ state, onOpenDay }) {
  const entries = Object.values(state.days)
    .filter(d => d.closed)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  if (!entries.length) return null;
  return html`
    <div class="stack-3">
      <div class="section-title">Последние закрытые дни</div>
      ${entries.map(d => {
        // Обратная совместимость: emotion (одиночное) → emotions (массив)
        const emotions = d.emotions?.length ? d.emotions : (d.emotion ? [d.emotion] : []);
        const firstEm = emotions[0] ? findEmotion(emotions[0].id) : null;
        const extraCount = emotions.length > 1 ? `+${emotions.length - 1}` : '';
        return html`
          <button
            key=${d.date}
            class="card card--flat"
            style="text-align:left;width:100%;display:flex;align-items:center;gap:var(--sp-3);background:var(--bg-elevated);border:1px solid var(--border)"
            onClick=${() => onOpenDay(d.date)}
          >
            <div style="font-size:24px">${firstEm?.emoji || '🌿'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600">${formatDateLong(d.date)}</div>
              <div class="text-muted text-sm" style="margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${emotions.length
                  ? emotions.map(e => findEmotion(e.id)?.label || e.label).join(', ')
                  : 'без эмоции'}
                ${extraCount && html` <span>${extraCount}</span>`}
                ${d.reflectionAnswers?.[1] ? ` · ${d.reflectionAnswers[1].slice(0, 30)}` : ''}
              </div>
            </div>
            <div class="text-subtle">›</div>
          </button>
        `;
      })}
    </div>
  `;
}
