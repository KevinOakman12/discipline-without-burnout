import { html, useState } from '../h.js';
import { ScreenHeader } from '../components/ui/ScreenHeader.js';
import { Button } from '../components/ui/Button.js';
import { EMOTION_GROUPS } from '../data/emotions.js';
import { haptic } from '../utils/telegram.js';

export function EmotionsScreen({ initialEmotion = null, initialNote = '', onComplete, onBack, ctaLabel = 'Готово' }) {
  const [selectedId, setSelectedId] = useState(initialEmotion?.id || null);
  const [note, setNote] = useState(initialNote);

  const selectedGroup = EMOTION_GROUPS.find(g => g.items.some(e => e.id === selectedId))?.key;
  const selected = selectedId
    ? EMOTION_GROUPS.flatMap(g => g.items).find(e => e.id === selectedId)
    : null;

  const pick = (e) => {
    haptic('select');
    setSelectedId(e.id);
  };

  const finish = () => {
    if (!selected) return;
    onComplete({
      emotion: { id: selected.id, label: selected.label, group: selectedGroup },
      note: note.trim(),
    });
  };

  return html`
    <div class="fade-in">
      <${ScreenHeader} title="Эмоции" onBack=${onBack} />

      <div class="app__scroll" style="padding-top:0">
        <div class="stack-5">
          <div class="reflection-question" style="padding:0 var(--sp-2)">
            Что ты сейчас чувствуешь?
          </div>

          ${EMOTION_GROUPS.map(g => html`
            <div class="emotion-group" key=${g.key}>
              <div class="emotion-group__label">${g.label}</div>
              <div class="emotion-chips">
                ${g.items.map(e => html`
                  <button
                    key=${e.id}
                    class=${`emotion-chip emotion-chip--${g.key} ${selectedId === e.id ? 'emotion-chip--active' : ''}`}
                    onClick=${() => pick(e)}
                  >
                    <span style="margin-right:6px">${e.emoji}</span>${e.label}
                  </button>
                `)}
              </div>
            </div>
          `)}

          ${selected && html`
            <div class="stack-3 slide-up">
              <label class="label">Почему ты так себя чувствуешь?</label>
              <textarea
                class="textarea"
                placeholder="Можно одним словом, можно совсем не отвечать"
                value=${note}
                onInput=${(e) => setNote(e.target.value)}
              ></textarea>
            </div>
          `}

          <${Button}
            variant="primary"
            size="lg"
            full
            disabled=${!selected}
            onClick=${finish}
            hapticType="success"
          >${ctaLabel}</>
        </div>
      </div>
    </div>
  `;
}
