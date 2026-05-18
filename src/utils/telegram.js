// Тонкая обёртка над Telegram WebApp SDK.
// При запуске вне Telegram (в обычном браузере) превращается в no-op,
// чтобы UX не ломался при разработке.

const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

export function initTelegram() {
  if (!tg) return null;
  try {
    tg.ready();
    tg.expand();
    // disableVerticalSwipes доступен с v7.7+ — оборачиваем в try
    try { tg.disableVerticalSwipes?.(); } catch (_) {}
    return tg;
  } catch (_) {
    return null;
  }
}

export function getColorScheme() {
  return tg?.colorScheme || (
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
}

export function onThemeChange(cb) {
  if (!tg) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => cb(mq.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }
  tg.onEvent('themeChanged', () => cb(tg.colorScheme));
  return () => tg.offEvent?.('themeChanged');
}

export function applyHeaderColor() {
  if (!tg) return;
  try {
    tg.setHeaderColor?.('bg_color');
    tg.setBackgroundColor?.(
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
    );
  } catch (_) {}
}

// Haptic helpers — тихие, мягкие
export function haptic(type = 'light') {
  if (!tg?.HapticFeedback) return;
  try {
    if (type === 'success' || type === 'error' || type === 'warning') {
      tg.HapticFeedback.notificationOccurred(type);
    } else if (type === 'select') {
      tg.HapticFeedback.selectionChanged();
    } else {
      tg.HapticFeedback.impactOccurred(type); // 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
    }
  } catch (_) {}
}

export function showBackButton(visible, onClick) {
  if (!tg?.BackButton) return () => {};
  try {
    if (visible) {
      tg.BackButton.show();
      tg.BackButton.onClick(onClick);
      return () => {
        try { tg.BackButton.offClick(onClick); tg.BackButton.hide(); } catch (_) {}
      };
    }
    tg.BackButton.hide();
  } catch (_) {}
  return () => {};
}

export function getUser() {
  return tg?.initDataUnsafe?.user || null;
}

export function isTelegram() {
  return !!tg;
}
