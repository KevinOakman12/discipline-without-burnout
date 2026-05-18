import { html } from '../h.js';
import { haptic } from '../utils/telegram.js';

export function HabitCard({ habit, done, onToggle, onEdit }) {
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
          Серия ${habit.currentStreak}
          ${habit.bestStreak > habit.currentStreak ? html` · рекорд ${habit.bestStreak}` : ''}
        </div>
      </div>

      <button
        class=${`habit__check ${done ? 'habit__check--done' : ''}`}
        onClick=${() => { haptic(done ? 'light' : 'success'); onToggle(); }}
        aria-label=${done ? 'Снять отметку' : 'Отметить выполнение'}
      >
        ${done ? '✓' : ''}
      </button>
    </div>
  `;
}
