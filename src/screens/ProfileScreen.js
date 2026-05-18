import { html, useState } from '../h.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { clearAll } from '../store/storage.js';
import { getUser } from '../utils/telegram.js';

export function ProfileScreen({ state }) {
  const habits = state.habits;
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.bestStreak || 0), 0);
  const currentStreak = habits.reduce((m, h) => Math.max(m, h.currentStreak || 0), 0);
  const totalClosed = state.user.totalClosedDays || 0;
  const tgUser = getUser();
  const [confirmReset, setConfirmReset] = useState(false);

  return html`
    <div class="fade-in stack-5">
      <header class="app-header" style="padding:var(--sp-3) 0;text-align:center">
        <div class="app-header__greeting">${tgUser?.first_name || 'Привет'}</div>
        <div class="app-header__date">
          ${habits.length} ${pluralRu(habits.length, ['привычка','привычки','привычек'])}
        </div>
      </header>

      <div class="stats-grid">
        <div class="stat">
          <div class="stat__value">${currentStreak}</div>
          <div class="stat__label">текущая серия</div>
        </div>
        <div class="stat">
          <div class="stat__value">${bestStreak}</div>
          <div class="stat__label">лучший рекорд</div>
        </div>
        <div class="stat">
          <div class="stat__value">${totalClosed}</div>
          <div class="stat__label">закрытых дней</div>
        </div>
      </div>

      <div class="banner">
        Это твой личный пространство.
        Никаких сравнений, никакой гонки.
        Только мягкое движение вперёд.
      </div>

      ${state.user.weeklyProtection?.used && html`
        <div class="banner banner--warm">
          На этой неделе ты уже использовал бесплатную защиту серии.
          Следующая обновится в понедельник.
        </div>
      `}

      <div class="stack-3">
        <div class="section-title">Привычки</div>
        ${habits.length === 0
          ? html`<div class="empty"><div class="empty__emoji">🤍</div><div>Пока ни одной привычки</div></div>`
          : habits.map(h => html`
            <div key=${h.id} class="card card--flat" style="background:var(--bg-elevated);border:1px solid var(--border)">
              <div class="row row-gap-3">
                <div style="font-size:22px">${h.icon || '🌿'}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h.title}</div>
                  <div class="text-muted text-sm">Серия ${h.currentStreak} · рекорд ${h.bestStreak}</div>
                </div>
              </div>
            </div>
          `)}
      </div>

      <div style="padding-top:var(--sp-7);text-align:center">
        ${confirmReset
          ? html`
            <div class="stack-3">
              <div class="text-muted text-sm">Очистить все данные? Это нельзя отменить.</div>
              <div class="btn-row">
                <${Button} variant="ghost" onClick=${() => setConfirmReset(false)}>Оставить</>
                <${Button} variant="soft" onClick=${() => { clearAll(); setConfirmReset(false); }} hapticType="warning">Очистить</>
              </div>
            </div>
          `
          : html`
            <button class="btn btn--ghost text-muted text-sm" onClick=${() => setConfirmReset(true)}>
              Очистить все данные
            </button>
          `}
      </div>
    </div>
  `;
}

function pluralRu(n, [one, few, many]) {
  const n10 = Math.abs(n) % 10;
  const n100 = Math.abs(n) % 100;
  if (n100 >= 11 && n100 <= 14) return many;
  if (n10 === 1) return one;
  if (n10 >= 2 && n10 <= 4) return few;
  return many;
}
