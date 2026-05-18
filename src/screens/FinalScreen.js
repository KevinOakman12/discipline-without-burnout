import { html } from '../h.js';
import { Modal } from '../components/ui/Modal.js';
import { Button } from '../components/ui/Button.js';

export function FinalScreen({ open, onClose, suggestBreathing, onBreathing }) {
  if (!open) return null;
  return html`
    <${Modal} open=${true} onClose=${onClose} centered>
      <div class="final-card" style="background:transparent;border:none;padding:var(--sp-5) 0">
        <div class="final-card__icon">🌿</div>
        <div class="final-card__title">День завершён.</div>
        <div class="final-card__text">
          Всё, что можно было сделать сегодня — уже сделано.<br/>
          Завтра новый день.
        </div>

        ${suggestBreathing && html`
          <div style="margin-top:var(--sp-6)" class="stack-3">
            <div class="text-muted text-sm">
              Похоже, короткая пауза сейчас может помочь.
              Хочешь сделать 30-секундную дыхательную практику?
            </div>
            <${Button} variant="primary" full size="lg" onClick=${onBreathing}>Начать</>
            <${Button} variant="ghost" full onClick=${onClose}>Не сейчас</>
          </div>
        `}

        ${!suggestBreathing && html`
          <div style="margin-top:var(--sp-6)">
            <${Button} variant="primary" full size="lg" onClick=${onClose}>Закрыть</>
          </div>
        `}
      </div>
    </>
  `;
}
