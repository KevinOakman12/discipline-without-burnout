import { html, useState, useEffect } from '../h.js';
import { ScreenHeader } from '../components/ui/ScreenHeader.js';
import { Button } from '../components/ui/Button.js';

const QUESTIONS = [
  'Что сегодня было для тебя самым тяжёлым?',
  'Что сегодня получилось, даже если это мелочь?',
  'Что ты хочешь оставить в сегодняшнем дне\nи не брать с собой в завтра?',
];

export function CloseDayScreen({ initial = ['', '', ''], onComplete, onBack }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(initial);

  useEffect(() => {
    // Сохраним любые ответы при размонтировании — для черновика
  }, []);

  const setAnswer = (val) => {
    const next = [...answers];
    next[step] = val;
    setAnswers(next);
  };

  const next = () => {
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else onComplete(answers);
  };

  const back = () => {
    if (step === 0) onBack();
    else setStep(step - 1);
  };

  return html`
    <div class="fade-in" key=${step}>
      <${ScreenHeader} title="Закрыть день" onBack=${back} />

      <div class="reflection-progress">
        ${QUESTIONS.map((_, i) => html`
          <div key=${i} class=${`reflection-progress__dot ${i <= step ? 'reflection-progress__dot--active' : ''}`}></div>
        `)}
      </div>

      <div class="app__scroll" style="padding-top:0">
        <div class="reflection-step slide-up">
          <div class="reflection-question" style="white-space:pre-line">
            ${QUESTIONS[step]}
          </div>

          <textarea
            class="textarea reflection-textarea"
            placeholder="Пиши свободно — это только для тебя"
            value=${answers[step]}
            onInput=${(e) => setAnswer(e.target.value)}
            autoFocus
          ></textarea>

          <${Button}
            variant="primary"
            size="lg"
            full
            onClick=${next}
            hapticType="light"
          >${step < QUESTIONS.length - 1 ? 'Дальше' : 'Перейти к эмоциям'}</>

          <div class="text-muted text-sm" style="text-align:center">
            Можно пропустить и оставить пустым
          </div>
        </div>
      </div>
    </div>
  `;
}
