import { html, useEffect } from '../h.js';

export function Milestone({ streak, text, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss?.(), 4200);
    return () => clearTimeout(t);
  }, [streak]);

  return html`
    <div class="milestone" role="status" onClick=${onDismiss}>
      <div class="milestone__title">${streak} ${dayWord(streak)} подряд</div>
      <div class="milestone__text">${text}</div>
    </div>
  `;
}

function dayWord(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return 'дней';
  if (m10 === 1) return 'день';
  if (m10 >= 2 && m10 <= 4) return 'дня';
  return 'дней';
}
