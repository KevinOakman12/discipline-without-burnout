import { html } from '../h.js';
import { Button } from '../components/ui/Button.js';
import { haptic } from '../utils/telegram.js';

export function OnboardingScreen({ onComplete }) {
  const handleStart = () => {
    haptic('success');
    onComplete();
  };

  return html`
    <div class="onboarding fade-in">
      <div class="onboarding__body">
        <div class="onboarding__title">✨ Это не соревнование.</div>

        <div class="onboarding__text">
          Здесь нет идеального результата.
          Есть только ты и твой ритм.
        </div>

        <div class="onboarding__features">
          <div class="onboarding__feature">
            <span class="onboarding__feature-icon">🛡</span>
            <span>Выходные не сбрасывают серию</span>
          </div>
          <div class="onboarding__feature">
            <span class="onboarding__feature-icon">💙</span>
            <span>Один пропуск в неделю — защита серии</span>
          </div>
        </div>

        <div class="onboarding__text">
          Маленький шаг каждый день важнее
          идеального плана, который ты не выполнишь.
        </div>
      </div>

      <div class="onboarding__footer">
        <${Button} variant="primary" size="lg" full onClick=${handleStart}>
          Начать
        </>
      </div>
    </div>
  `;
}
