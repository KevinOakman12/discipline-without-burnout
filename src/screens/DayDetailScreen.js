// Экран просмотра/редактирования конкретного дня.
// Любой день остаётся открытым для редактирования всегда.

import { html, useState } from '../h.js';
import { ScreenHeader } from '../components/ui/ScreenHeader.js';
import { Button } from '../components/ui/Button.js';
import { findEmotion, EMOTION_GROUPS } from '../data/emotions.js';
import { formatDateLong } from '../utils/date.js';
import { Modal } from '../components/ui/Modal.js';
import { haptic } from '../utils/telegram.js';

const Q_LABELS = [
  'Что было самым тяжёлым',
  'Что получилось',
  'Что оставить в этом дне',
];

export function DayDetailScreen({ state, date, onBack, onToggleHabit, onUpdate }) {
  const day = state.days[date] || {
    date,
    completedHabits: [],
    reflectionAnswers: ['', '', ''],
    emotions: [],
    emotionNote: '',
    closed: false,
    breathingCompleted: false,
  };

  // Обратная совместимость: старое поле emotion (одиночное) → emotions (массив)
  const storedEmotions = day.emotions?.length
    ? day.emotions
    : (day.emotion ? [day.emotion] : []);

  const habits = state.habits;
  const completed = new Set(day.completedHabits);

  const [editingEmotion, setEditingEmotion] = useState(false);
  const [draftIds, setDraftIds] = useState(() => new Set(storedEmotions.map(e => e.id)));
  const [draftNote, setDraftNote] = useState(day.emotionNote || '');

  const saveAnswer = (i, val) => {
    const next = [...(day.reflectionAnswers || ['', '', ''])];
    next[i] = val;
    onUpdate({ reflectionAnswers: next });
  };

  const toggleDraft = (e) => {
    haptic('select');
    setDraftIds(prev => {
      const next = new Set(prev);
      if (next.has(e.id)) next.delete(e.id);
      else next.add(e.id);
      return next;
    });
  };

  const saveEmotion = () => {
    const emotions = EMOTION_GROUPS.flatMap(g =>
      g.items
        .filter(e => draftIds.has(e.id))
        .map(e => ({ id: e.id, label: e.label, group: g.key }))
    );
    onUpdate({ emotions, emotionNote: draftNote, closed: true });
    setEditingEmotion(false);
  };

  const clearEmotions = () => {
    setDraftIds(new Set());
    setDraftNote('');
    onUpdate({ emotions: [], emotionNote: '' });
  };

  const openEdit = () => {
    haptic('light');
    setDraftIds(new Set(storedEmotions.map(e => e.id)));
    setDraftNote(day.emotionNote || '');
    setEditingEmotion(true);
  };

  return html`
    <div class="fade-in">
      <${ScreenHeader} title=${formatDateLong(date)} onBack=${onBack} />

      <div class="app__scroll" style="padding-top:0">
        <div class="stack-6">

          <!-- Привычки -->
          <div class="stack-3">
            <div class="section-title">Привычки</div>
            ${habits.length === 0 && html`
              <div class="empty"><div class="empty__emoji">🌿</div><div>Привычек ещё не было</div></div>
            `}
            ${habits.map(h => html`
              <div key=${h.id} class=${`habit ${completed.has(h.id) ? 'habit--done' : ''}`}>
                <div class="habit__icon">${h.icon || '🌿'}</div>
                <div class="habit__body">
                  <div class="habit__title">${h.title}</div>
                </div>
                <button
                  class=${`habit__check ${completed.has(h.id) ? 'habit__check--done' : ''}`}
                  onClick=${() => { haptic(completed.has(h.id) ? 'light' : 'success'); onToggleHabit(h.id); }}
                  aria-label="Переключить выполнение"
                >${completed.has(h.id) ? '✓' : ''}</button>
              </div>
            `)}
          </div>

          <!-- Рефлексия -->
          <div class="stack-3">
            <div class="section-title">Рефлексия</div>
            ${Q_LABELS.map((label, i) => html`
              <div key=${i} class="card card--flat" style="background:var(--bg-elevated);border:1px solid var(--border)">
                <div class="text-muted text-sm" style="margin-bottom:var(--sp-2)">${label}</div>
                <textarea
                  class="textarea"
                  style="background:transparent;border:none;padding:0;min-height:60px"
                  placeholder="Можно оставить пустым"
                  value=${(day.reflectionAnswers || [])[i] || ''}
                  onInput=${(e) => saveAnswer(i, e.target.value)}
                ></textarea>
              </div>
            `)}
          </div>

          <!-- Эмоции -->
          <div class="stack-3">
            <div class="section-title">Эмоции</div>
            ${storedEmotions.length > 0
              ? html`
                <div class="card card--flat" style="background:var(--bg-elevated);border:1px solid var(--border)">
                  <div class="stack-3">
                    <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
                      ${storedEmotions.map(em => {
                        const info = findEmotion(em.id);
                        return info ? html`
                          <span key=${em.id} class="chip">
                            <span>${info.emoji}</span>${info.label}
                          </span>
                        ` : null;
                      })}
                    </div>
                    ${day.emotionNote && html`
                      <div class="text-muted text-sm">${day.emotionNote}</div>
                    `}
                    <button class="btn btn--soft btn--sm" onClick=${openEdit}>Изменить</button>
                  </div>
                </div>
              `
              : html`
                <${Button} variant="soft" full onClick=${openEdit}>
                  Отметить эмоцию
                </>
              `}
          </div>

        </div>
      </div>

      <!-- Модальное редактирование эмоций -->
      <${Modal} open=${editingEmotion} onClose=${() => setEditingEmotion(false)}>
        <div class="stack-5">
          <div class="h2">Эмоции</div>
          <div class="text-muted text-sm">Можно выбрать несколько</div>

          ${EMOTION_GROUPS.map(g => html`
            <div class="emotion-group" key=${g.key}>
              <div class="emotion-group__label">${g.label}</div>
              <div class="emotion-chips">
                ${g.items.map(e => html`
                  <button
                    key=${e.id}
                    class=${`emotion-chip emotion-chip--${g.key} ${draftIds.has(e.id) ? 'emotion-chip--active' : ''}`}
                    onClick=${() => toggleDraft(e)}
                  ><span style="margin-right:6px">${e.emoji}</span>${e.label}</button>
                `)}
              </div>
            </div>
          `)}

          <textarea
            class="textarea"
            placeholder="Почему ты так себя чувствуешь?"
            value=${draftNote}
            onInput=${(e) => setDraftNote(e.target.value)}
          ></textarea>

          <div class="btn-row">
            <${Button} variant="ghost" onClick=${() => setEditingEmotion(false)}>Отмена</>
            <${Button} variant="primary" onClick=${saveEmotion} disabled=${draftIds.size === 0}>Сохранить</>
          </div>

          ${storedEmotions.length > 0 && html`
            <button class="btn btn--ghost text-muted" style="width:100%" onClick=${clearEmotions}>
              Удалить эмоции
            </button>
          `}
        </div>
      </>
    </div>
  `;
}
