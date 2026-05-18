import { html } from '../../h.js';
import { haptic } from '../../utils/telegram.js';

export function Button({
  children,
  onClick,
  variant = 'primary',   // 'primary' | 'soft' | 'ghost'
  size,                  // 'sm' | 'lg' | undefined
  full,
  disabled,
  hapticType = 'light',
  type = 'button',
}) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size && `btn--${size}`,
    full && 'btn--full',
  ].filter(Boolean).join(' ');

  const handle = (e) => {
    if (disabled) return;
    haptic(hapticType);
    onClick?.(e);
  };

  return html`
    <button class=${cls} type=${type} disabled=${disabled} onClick=${handle}>
      ${children}
    </button>
  `;
}
