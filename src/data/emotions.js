// Каталог эмоций. id используется в данных, label — для UI.

export const EMOTION_GROUPS = [
  {
    key: 'positive',
    label: 'Позитивные',
    items: [
      { id: 'joy',         label: 'радость',     emoji: '☀️' },
      { id: 'calm',        label: 'спокойствие', emoji: '🌿' },
      { id: 'inspired',    label: 'вдохновение', emoji: '✨' },
      { id: 'grateful',    label: 'благодарность', emoji: '🌷' },
      { id: 'confident',   label: 'уверенность', emoji: '🌱' },
      { id: 'interested',  label: 'интерес',     emoji: '🔍' },
      { id: 'hopeful',     label: 'надежда',     emoji: '🌅' },
    ],
  },
  {
    key: 'neutral',
    label: 'Нейтральные',
    items: [
      { id: 'tired',       label: 'усталость',   emoji: '🌙' },
      { id: 'bored',       label: 'скука',       emoji: '🫧' },
      { id: 'empty',       label: 'пустота',     emoji: '◯' },
      { id: 'confused',    label: 'растерянность', emoji: '🌫️' },
    ],
  },
  {
    key: 'negative',
    label: 'Тяжёлые',
    items: [
      { id: 'anxiety',     label: 'тревога',     emoji: '🌊' },
      { id: 'stress',      label: 'стресс',      emoji: '⛅' },
      { id: 'anger',       label: 'злость',      emoji: '🔥' },
      { id: 'sadness',     label: 'грусть',      emoji: '🌧️' },
      { id: 'irritation',  label: 'раздражение', emoji: '⚡' },
      { id: 'loneliness',  label: 'одиночество', emoji: '🌑' },
      { id: 'fear',        label: 'страх',       emoji: '🌫' },
      { id: 'guilt',       label: 'вина',        emoji: '🪨' },
      { id: 'disappoint',  label: 'разочарование', emoji: '🍂' },
      { id: 'burnout',     label: 'выгорание',   emoji: '🕯️' },
    ],
  },
];

export const ALL_EMOTIONS = EMOTION_GROUPS.flatMap(g =>
  g.items.map(e => ({ ...e, group: g.key }))
);

export function findEmotion(id) {
  return ALL_EMOTIONS.find(e => e.id === id) || null;
}

export function isNegativeEmotion(id) {
  const e = findEmotion(id);
  return e?.group === 'negative';
}
