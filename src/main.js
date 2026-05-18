// Entry point.
// Bootstraps Telegram theme, mounts Preact app.

import { html, render } from './h.js';
import { App } from './App.js';
import { initTelegram, onThemeChange, getColorScheme, applyHeaderColor } from './utils/telegram.js';

function applyTheme(scheme) {
  document.documentElement.setAttribute('data-theme', scheme === 'dark' ? 'dark' : 'light');
  applyHeaderColor();
}

initTelegram();
applyTheme(getColorScheme());
onThemeChange((scheme) => applyTheme(scheme));

const root = document.getElementById('root');
render(html`<${App} />`, root);
