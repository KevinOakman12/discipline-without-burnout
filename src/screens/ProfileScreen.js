import { html, useState } from '../h.js';
import { Button } from '../components/ui/Button.js';
import { clearAll } from '../store/storage.js';
import { getUser } from '../utils/telegram.js';
import { haptic } from '../utils/telegram.js';

const RESET_IDLE  = 0;
const RESET_STEP1 = 1;
const RESET_STEP2 = 2;

export function ProfileScreen({ state, streaks = {}, weeklyProtectionUsed = false }) {
  const habits       = state.habits;
  const tgUser       = getUser();
  const totalClosed  = state.user?.totalClosedDays || 0;
  const [resetStep, setResetStep] = useState(RESET_IDLE);

  // Агрегированные серии из вычисленных (не хранимых) значений
  const bestStreak    = Object.values(streaks).reduce((m, s) => Math.max(m, s.best),    0);
  const currentStreak = Object.values(streaks).reduce((m, s) => Math.max(m, s.current), 0);

  const doReset = () => {
    clearAll();
    setResetStep(RESET_IDLE);
    haptic('warning');
  };

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
        Это твоё личное пространство.
        Никаких сравнений, никакой гонки.
        Только мягкое движение вперёд.
      </div>

      ${weeklyProtectionUsed && html`
        <div class="banner banner--warm">
          На этой неделе ты уже использовал бесплатную защиту серии.
          Следующая обновится в понедельник.
        </div>
      `}

      <div class="stack-3">
        <div class="section-title">Привычки</div>
        ${habits.length === 0
          ? html`<div class="empty"><div class="empty__emoji">🤍</div><div>Пока ни одной привычки</div></div>`
          : habits.map(h => {
              const s = streaks[h.id] || { current: 0, best: 0 };
              return html`
                <div key=${h.id} class="card card--flat" style="background:var(--bg-elevated);border:1px solid var(--border)">
                  <div class="row row-gap-3">
                    <div style="font-size:22px">${h.icon || '🌿'}</div>
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h.title}</div>
                      <div class="text-muted text-sm">
                        Серия ${s.current} · рекорд ${s.best}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            })}
      </div>

      <!-- Двойное подтверждение очистки данных -->
      <div style="padding-top:var(--sp-7);text-align:center">
        ${resetStep === RESET_IDLE && html`
          <button
            class="btn btn--ghost text-muted text-sm"
            onClick=${() => setResetStep(RESET_STEP1)}
          >Очистить все данные</button>
        `}

        ${resetStep === RESET_STEP1 && html`
          <div class="card" style="text-align:left">
            <div style="font-weight:600;margin-bottom:var(--sp-2)">Очистить все данные?</div>
            <div class="text-muted text-sm" style="margin-bottom:var(--sp-5)">
              Все привычки, история, рефлексии и серии будут удалены навсегда.
            </div>
            <div class="btn-row">
              <${Button} variant="ghost" onClick=${() => setResetStep(RESET_IDLE)}>Оставить</>
              <${Button} variant="soft" onClick=${() => { haptic('warning'); setResetStep(RESET_STEP2); }}>
                Да, удалить
              </>
            </div>
          </div>
        `}

        ${resetStep === RESET_STEP2 && html`
          <div class="card" style="text-align:left;border-color:var(--rose);background:var(--rose-faint)">
            <div style="font-weight:700;margin-bottom:var(--sp-2);color:var(--rose-text)">Последнее предупреждение</div>
            <div class="text-muted text-sm" style="margin-bottom:var(--sp-5)">
              Привычки, вся история, серии и рефлексии — всё будет удалено без возможности восстановления.
            </div>
            <div class="btn-row">
              <${Button} variant="ghost" onClick=${() => setResetStep(RESET_IDLE)}>Отмена</>
              <button
                class="btn btn--full"
                style="background:var(--rose);color:#fff;flex:1"
                onClick=${doReset}
              >Удалить всё</button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

function pluralRu(n, [one, few, many]) {
  const m10  = Math.abs(n) % 10;
  const m100 = Math.abs(n) % 100;
  if (m100 >= 11 && m100 <= 14) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}
