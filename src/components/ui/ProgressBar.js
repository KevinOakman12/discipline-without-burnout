import { html } from '../../h.js';

export function ProgressBar({ value = 0 }) {
  const v = Math.max(0, Math.min(100, value));
  return html`
    <div class="progress" role="progressbar" aria-valuenow=${Math.round(v)} aria-valuemin=${0} aria-valuemax=${100}>
      <div class="progress__fill" style=${`width: ${v}%`}></div>
    </div>
  `;
}
