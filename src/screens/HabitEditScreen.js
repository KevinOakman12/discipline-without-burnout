import { html, useState } from '../h.js';
import { ScreenHeader } from '../components/ui/ScreenHeader.js';
import { Button } from '../components/ui/Button.js';
import { HABIT_ICONS, DEFAULT_ICON } from '../data/icons.js';
import { haptic } from '../utils/telegram.js';

export function HabitEditScreen({ habit, onSave, onDelete, onBack }) {
  const isEditing = !!habit;
  const [title, setTitle] = useState(habit?.title || '');
  const [icon, setIcon] = useState(habit?.icon || DEFAULT_ICON);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({ ...habit, title: trimmed, icon });
  };

  return html`
    <div class="fade-in">
      <${ScreenHeader}
        title=${isEditing ? 'Привычка' : 'Новая привычка'}
        onBack=${onBack}
      />

      <div class="app__scroll" style="padding-top:0">
        <div class="stack-6">
          <div>
            <label class="label">Название</label>
            <input
              class="input"
              type="text"
              placeholder="Например: 10 минут чтения"
              value=${title}
              onInput=${(e) => setTitle(e.target.value)}
              autoFocus=${!isEditing}
              maxLength=${80}
            />
          </div>

          <div>
            <label class="label">Иконка (необязательно)</label>
            <div class="icon-picker">
              ${HABIT_ICONS.map(em => html`
                <button
                  key=${em}
                  class=${`icon-picker__item ${icon === em ? 'icon-picker__item--active' : ''}`}
                  onClick=${() => { haptic('select'); setIcon(em); }}
                  aria-label=${`Иконка ${em}`}
                >${em}</button>
              `)}
            </div>
          </div>

          <${Button}
            variant="primary"
            size="lg"
            full
            disabled=${!title.trim()}
            onClick=${handleSave}
            hapticType="success"
          >Сохранить</>

          ${isEditing && html`
            <div style="text-align:center;padding-top:var(--sp-4)">
              ${confirmingDelete
                ? html`
                  <div class="stack-3">
                    <div class="text-muted text-sm">Удалить привычку и её историю?</div>
                    <div class="btn-row">
                      <${Button} variant="ghost" onClick=${() => setConfirmingDelete(false)}>Оставить</>
                      <${Button} variant="soft" onClick=${() => onDelete(habit.id)} hapticType="warning">Удалить</>
                    </div>
                  </div>
                `
                : html`
                  <button
                    class="btn btn--ghost"
                    style="color: var(--text-muted)"
                    onClick=${() => { haptic('light'); setConfirmingDelete(true); }}
                  >Удалить привычку</button>
                `}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}
