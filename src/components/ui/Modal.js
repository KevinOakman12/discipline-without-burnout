import { html, useEffect } from '../../h.js';

export function Modal({ open, onClose, children, centered, dismissable = true }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && dismissable) onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, dismissable, onClose]);

  if (!open) return null;

  const handleBackdrop = (e) => {
    if (!dismissable) return;
    if (e.target === e.currentTarget) onClose?.();
  };

  return html`
    <div class="modal-backdrop" onClick=${handleBackdrop}>
      <div class=${`modal ${centered ? 'modal--centered' : ''}`}>
        ${!centered && html`<div class="modal__grabber"></div>`}
        ${children}
      </div>
    </div>
  `;
}
