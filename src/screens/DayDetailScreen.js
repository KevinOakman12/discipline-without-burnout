// Экран просмотра/редактирования конкретного (прошедшего или сегодняшнего) дня.
// Любой день остаётся открытым для редактирования всегда — это критическая фича.

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
    date, completedHabits: [], reflectionAnswers: ['', '', ''],
    emotion: null, emotionNote: '', closed: false, breathingCompleted: false,
  };
  const habits = state.habits;
  const completed = new Set(day.completedHabits);
  const [editingEmotion, setEditingEmotion] = useState(false);
  const [draftEmotion, setDraftEmotion] = useState(day.emotion);
  const [draftNote, setDraftNote] = useState(day.emotionNote);

  const saveAnswer = (i, val) => {
    const next = [...day.reflectionAnswers];
    next[i] = val;
    onUpdate({ reflectionAnswers: next });
  };

  const saveEmotion = () => {
    onUpdate({ emotion: draftEmotion, emotionNote: draftNote, closed: true });
    setEditingEmotion(false);
  };

  const clearEmotion = () => {
    setDraftEmotion(null);
    setDraftNote('');
    onUpdate({ emotion: null, emotionNote: '' });
  };

  const em = day.emotion ? findEmotion(day.emotion.id) : null;

  return html`
    <div class="fade-in">
      <${ScreenHeader} title=${formatDateLong(date)} onBack=${onBack} />

      <div class="app__scroll" style="padding-top:0">
        <div class="stack-6">
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

          <div class="stack-3">
            <div class="section-title">Рефлексия</div>
            ${Q_LABELS.map((label, i) => html`
              <div key=${i} class="card card--flat" style="background:var(--bg-elevated);border:1px solid var(--border)">
                <div class="text-muted text-sm" style="margin-bottom:var(--sp-2)">${label}</div>
                <textarea
                  class="textarea"
                  style="background:transparent;border:none;padding:0;min-height:60px"
                  placeholder="Можно оставить пустым"
                  value=${day.reflectionAnswers[i] || ''}
                  onInput=${(e) => saveAnswer(i, e.target.value)}
                ></textarea>
              </div>
            `)}
          </div>

          <div class="stack-3">
            <div class="section-title">Эмоция</div>
            ${em
              ? html`
                <div class="card card--flat" style="background:var(--bg-elevated);border:1px solid var(--border)">
                  <div class="row row-gap-3">
                    <div style="font-size:28px">${em.emoji}</div>
                    <div style="flex:1">
                      <div style="font-weight:600">${em.label}</div>
                      ${day.emotionNote && html`<div class="text-muted text-sm" style="margin-top:4px">${day.emotionNote}</div>`}
                    </div>
                    <button class="chip" onClick=${() => { haptic('light'); setEditingEmotion(true); setDraftEmotion(day.emotion); setDraftNote(day.emotionNote); }}>Изменить</button>
                  </div>
                </div>
              `
              : html`
                <${Button} variant="soft" full onClick=${() => { setEditingEmotion(true); setDraftEmotion(null); setDraftNote(''); }}>
                  Отметить эмоцию
                </>
              `}
          </div>
        </div>
      </div>

      <${Modal} open=${editingEmotion} onClose=${() => setEditingEmotion(false)}>
        <div class="stack-5">
          <div class="h2">Эмоция</div>
          ${EMOTION_GROUPS.map(g => html`
            <div class="emotion-group" key=${g.key}>
              <div class="emotion-group__label">${g.label}</div>
              <div class="emotion-chips">
                ${g.items.map(e => html`
                  <button
                    key=${e.id}
                    class=${`emotion-chip emotion-chip--${g.key} ${draftEmotion?.id === e.id ? 'emotion-chip--active' : ''}`}
                    onClick=${() => { haptic('select'); setDraftEmotion({ id: e.id, label: e.label, group: g.key }); }}
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
            <${Button} variant="primary" onClick=${saveEmotion} disabled=${!draftEmotion}>Сохранить</>
          </div>
          ${day.emotion && html`
            <button class="btn btn--ghost text-muted" onClick=${clearEmotion}>Удалить эмоцию</button>
          `}
        </div>
      </>
    </div>
  `;
}
