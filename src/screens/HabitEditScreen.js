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
        title=${isEditing ? 'Редактировать привычку' : 'Новая привычка'}
        onBack=${onBack}
        right=${isEditing && !confirmingDelete && html`
          <button
            style="padding:6px 12px;border-radius:var(--r-pill);background:var(--rose-faint);color:var(--rose);font-size:var(--fs-sm);font-weight:600"
            onClick=${() => { haptic('light'); setConfirmingDelete(true); }}
          >Удалить</button>
        `}
      />

      <div class="app__scroll" style="padding-top:0">
        <div class="stack-6">

          ${confirmingDelete && html`
            <div class="card" style="background:var(--rose-faint);border-color:transparent">
              <div style="font-weight:600;margin-bottom:var(--sp-2)">Удалить привычку?</div>
              <div class="text-muted text-sm" style="margin-bottom:var(--sp-4)">
                История выполнения и вся серия для этой привычки будут удалены.
              </div>
              <div class="btn-row">
                <${Button} variant="ghost" onClick=${() => setConfirmingDelete(false)}>Оставить</>
                <${Button} variant="soft" onClick=${() => onDelete(habit.id)} hapticType="warning">
                  Удалить
                </>
              </div>
            </div>
          `}

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
            <label class="label">Иконка</label>
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

        </div>
      </div>
    </div>
  `;
}
