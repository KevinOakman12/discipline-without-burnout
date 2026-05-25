import { html } from '../h.js';
import { haptic } from '../utils/telegram.js';

export function HabitCard({ habit, streak, done, onToggle, onEdit }) {
  const { current = 0, best = 0 } = streak || {};

  return html`
    <div class=${`habit ${done ? 'habit--done' : ''}`}>
      <button
        class="habit__icon"
        onClick=${onEdit}
        aria-label="Редактировать привычку"
      >${habit.icon || '🌿'}</button>

      <div class="habit__body" onClick=${onEdit}>
        <div class="habit__title">${habit.title}</div>
        <div class="habit__meta">
          ${current > 0
            ? html`<span>🔥 ${current} ${dayWord(current)}</span>`
            : html`<span>Начать серию</span>`}
          ${best > current && best > 0
            ? html`<span style="margin-left:6px;opacity:0.6">· рекорд ${best}</span>`
            : ''}
        </div>
      </div>

      <button
        class=${`habit__check ${done ? 'habit__check--done' : ''}`}
        onClick=${() => { haptic(done ? 'light' : 'success'); onToggle(); }}
        aria-label=${done ? 'Снять отметку' : 'Отметить выполнение'}
      >
        ${done ? html`<span style="font-size:16px">✓</span>` : ''}
      </button>
    </div>
  `;
}

function dayWord(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return 'дн.';
  if (m10 === 1) return 'день';
  if (m10 >= 2 && m10 <= 4) return 'дня';
  return 'дн.';
}
