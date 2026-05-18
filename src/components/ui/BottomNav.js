import { html } from '../../h.js';
import { haptic } from '../../utils/telegram.js';

const ITEMS = [
  { key: 'home',    label: 'Сегодня',   icon: '🌿' },
  { key: 'history', label: 'История',   icon: '📅' },
  { key: 'profile', label: 'Профиль',   icon: '🤍' },
];

export function BottomNav({ active, onChange }) {
  return html`
    <nav class="bottom-nav" aria-label="Главная навигация">
      ${ITEMS.map(it => html`
        <button
          key=${it.key}
          class=${`bottom-nav__item ${active === it.key ? 'bottom-nav__item--active' : ''}`}
          onClick=${() => { haptic('select'); onChange(it.key); }}
          aria-current=${active === it.key ? 'page' : undefined}
        >
          <span class="bottom-nav__icon">${it.icon}</span>
          <span>${it.label}</span>
        </button>
      `)}
    </nav>
  `;
}
