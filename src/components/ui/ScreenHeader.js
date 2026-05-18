import { html } from '../../h.js';
import { haptic } from '../../utils/telegram.js';

export function ScreenHeader({ title, onBack, right }) {
  return html`
    <div class="screen-header">
      ${onBack && html`
        <button
          class="screen-header__back"
          onClick=${() => { haptic('light'); onBack(); }}
          aria-label="Назад"
        >‹</button>
      `}
      <div class="screen-header__title">${title}</div>
      <div style="margin-left:auto">${right}</div>
    </div>
  `;
}
