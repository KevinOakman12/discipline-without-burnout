import { html, useState, useEffect, useRef } from '../h.js';
import { Modal } from '../components/ui/Modal.js';
import { Button } from '../components/ui/Button.js';
import { haptic } from '../utils/telegram.js';

// Box Breathing 4-4-4-4, ~30 секунд = ~2 цикла.
const PHASES = [
  { key: 'inhale',   label: 'Вдох',     ms: 4000 },
  { key: 'hold-in',  label: 'Задержка', ms: 4000 },
  { key: 'exhale',   label: 'Выдох',    ms: 4000 },
  { key: 'hold-out', label: 'Задержка', ms: 4000 },
];
const TOTAL_CYCLES = 2;

export function BreathingScreen({ open, onClose, onCompleted }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [count, setCount] = useState(4);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const phaseTimerRef = useRef(null);
  const countTimerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setPhaseIdx(0);
    setCycle(0);
    setCount(4);
    setConfirming(false);
    setDone(false);
  }, [open]);

  useEffect(() => {
    if (!open || done) return;
    haptic('soft');
    setCount(4);
    let c = 4;
    countTimerRef.current = setInterval(() => {
      c -= 1;
      setCount(Math.max(0, c));
      if (c <= 0) clearInterval(countTimerRef.current);
    }, 1000);

    phaseTimerRef.current = setTimeout(() => {
      const nextIdx = (phaseIdx + 1) % PHASES.length;
      if (nextIdx === 0) {
        const nextCycle = cycle + 1;
        if (nextCycle >= TOTAL_CYCLES) {
          setDone(true);
          haptic('success');
          return;
        }
        setCycle(nextCycle);
      }
      setPhaseIdx(nextIdx);
    }, PHASES[phaseIdx].ms);

    return () => {
      clearTimeout(phaseTimerRef.current);
      clearInterval(countTimerRef.current);
    };
  }, [open, phaseIdx, cycle, done]);

  if (!open) return null;

  const phase = PHASES[phaseIdx];

  const tryClose = () => {
    if (done) {
      finishAndClose();
    } else {
      setConfirming(true);
    }
  };

  const finishAndClose = () => {
    clearTimeout(phaseTimerRef.current);
    clearInterval(countTimerRef.current);
    onCompleted?.();
    onClose?.();
  };

  if (done) {
    return html`
      <${Modal} open=${true} onClose=${finishAndClose} centered>
        <div class="final-card" style="background:transparent;border:none;padding:var(--sp-5) 0">
          <div class="final-card__icon">🌿</div>
          <div class="final-card__title">День завершён.</div>
          <div class="final-card__text">
            Всё, что можно было сделать сегодня — уже сделано.<br/>
            Завтра новый день.
          </div>
          <div style="margin-top:var(--sp-6)">
            <${Button} variant="primary" full size="lg" onClick=${finishAndClose}>Закрыть</>
          </div>
        </div>
      </>
    `;
  }

  if (confirming) {
    return html`
      <${Modal} open=${true} onClose=${() => setConfirming(false)} centered dismissable=${false}>
        <div class="confirm-stop">
          <div class="confirm-stop__title">Ты точно хочешь остановить дыхательную практику?</div>
          <div class="btn-row">
            <${Button} variant="ghost" onClick=${() => setConfirming(false)} hapticType="light">Продолжить</>
            <${Button} variant="soft" onClick=${finishAndClose} hapticType="light">Остановить</>
          </div>
        </div>
      </>
    `;
  }

  return html`
    <${Modal} open=${true} onClose=${tryClose} dismissable=${true}>
      <div class="breathing">
        <div class="breathing__title">Короткая пауза</div>
        <div class="breathing__hint">
          Дыши вместе с кругом.
          Это всего полминуты — она правда помогает.
        </div>

        <div class="breathing__visual" aria-live="polite">
          <div class=${`breathing__bubble breathing__bubble--${phase.key}`}></div>
          <div class="breathing__phase">${phase.label}</div>
        </div>

        <div class="breathing__count">${count}</div>

        <div style="margin-top:var(--sp-6);width:100%">
          <${Button} variant="ghost" full onClick=${tryClose} hapticType="light">Остановить</>
        </div>
      </div>
    </>
  `;
}
