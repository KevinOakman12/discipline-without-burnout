// Date helpers. All days are represented as YYYY-MM-DD strings in local time.

export const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export const MONTH_NAMES_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toKey(new Date());
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function dayDiff(a, b) {
  const da = a instanceof Date ? a : fromKey(a);
  const db = b instanceof Date ? b : fromKey(b);
  const ms = 24 * 3600 * 1000;
  return Math.round((da.setHours(0,0,0,0) - db.setHours(0,0,0,0)) / ms);
}

// Monday = 0 ... Sunday = 6
export function weekdayIdx(date) {
  const d = date instanceof Date ? date : fromKey(date);
  const js = d.getDay(); // 0..6 (Sun..Sat)
  return (js + 6) % 7;
}

export function isWeekend(date) {
  const idx = weekdayIdx(date);
  return idx === 5 || idx === 6;
}

// ISO week key (year-W##) — for tracking weekly free protection
export function isoWeekKey(date) {
  const d = date instanceof Date ? new Date(date) : fromKey(date);
  d.setHours(0, 0, 0, 0);
  // Move to Thursday in current week
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNo = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 -
      3 + ((week1.getDay() + 6) % 7)) / 7
  );
  return `${d.getFullYear()}-W${pad(weekNo)}`;
}

export function formatDateLong(date) {
  const d = date instanceof Date ? date : fromKey(date);
  return `${d.getDate()} ${MONTH_NAMES_GEN[d.getMonth()]}`;
}

export function formatGreetingDate(date = new Date()) {
  const d = date instanceof Date ? date : fromKey(date);
  return `${WEEKDAY_SHORT[weekdayIdx(d)]}, ${d.getDate()} ${MONTH_NAMES_GEN[d.getMonth()]}`;
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}
