# Дисциплина без выгорания

Telegram Mini App, который ощущается как **спокойный личный коуч**:
мягкий трекер привычек со «спасательной» серией + вечерняя рефлексия,
работа с эмоциями и короткая дыхательная практика.

```
day_done/
├── index.html              ← точка входа Mini App
├── styles/                 ← дизайн-токены и компонентные стили
│   ├── tokens.css
│   ├── base.css
│   ├── components.css
│   └── screens.css
├── src/
│   ├── main.js             ← bootstrap (Telegram theme + render)
│   ├── App.js              ← роутинг и связывание сценариев
│   ├── h.js                ← Preact + htm (React-совместимый API без сборки)
│   ├── store/              ← localStorage-стор, готовый к замене на backend
│   ├── utils/              ← date / streak / telegram-SDK обёртка
│   ├── data/               ← каталог эмоций и иконок привычек
│   ├── components/         ← UI-примитивы и HabitCard / Milestone
│   └── screens/            ← все экраны (Home, CloseDay, Emotions, Breathing, History, Profile, DayDetail, HabitEdit)
├── bot.py                  ← Telegram-бот (long-polling, без зависимостей)
├── serve.py                ← локальный HTTPS-сервер для разработки
├── .env                    ← BOT_TOKEN + WEBAPP_URL
└── README.md
```

## Стек

- **Preact 10** (React-совместимый, 3KB) + **htm** — JSX-подобный синтаксис без build-step;
- ES-модули прямо из браузера, никакого npm/Vite для запуска;
- localStorage с абстрактным интерфейсом — легко заменить на backend;
- Telegram WebApp SDK: тема, haptics, BackButton, безопасные зоны.

Архитектура осознанно повторяет React+TS-проект и легко переносится на Vite+TS,
если позже захочется собрать pipeline.

## Что внутри

- **Трекер привычек со Smart Streak** — 1 бесплатная защита в неделю,
  защита выходных, мягкое сообщение при потере серии.
- **Дневной progress bar** — простой процент без перегруза.
- **«Закрыть день»** — 3 вопроса рефлексии → выбор эмоции → опционально дыхание.
- **30-секундная дыхательная практика** (Box Breathing 4-4-4-4) с подтверждением остановки.
- **История** — календарь, любой прошедший день можно открыть и отредактировать (привычки, ответы, эмоция).
- **Профиль** — текущая серия, лучший рекорд, число закрытых дней.
- **Telegram-нативность** — реакция на тему, haptics, BackButton.

## Запуск

### 1. Захостить статику по HTTPS

Telegram открывает Mini App **только по HTTPS**. Подойдёт любой статический хостинг.

**Вариант A — GitHub Pages (бесплатно, проще всего):**
```
1. Создай репозиторий, залей содержимое папки day_done.
2. Settings → Pages → Deploy from branch → main / root.
3. Получишь адрес вида https://<user>.github.io/<repo>/
```

**Вариант B — Cloudflare Pages / Netlify / Vercel:**
```
Просто перетащи папку в их UI. Получишь HTTPS-URL мгновенно.
```

**Вариант C — локальная разработка через туннель:**
```bash
python serve.py            # https://localhost:8443
# отдельным окном:
cloudflared tunnel --url https://localhost:8443
# или: ngrok http https://localhost:8443
```
Возьми публичный HTTPS-URL из вывода туннеля.

### 2. Указать URL и привязать к боту

```bash
# в .env:
WEBAPP_URL=https://<твой-домен>/index.html
```

Опционально — закрепить кнопку «открыть приложение» в меню бота через @BotFather:
```
/setmenubutton  →  выбрать бота  →  ввести URL → ввести подпись «Открыть»
```

### 3. Запустить бота

```bash
cp .env.example .env       # Windows: copy .env.example .env
# открой .env и впиши BOT_TOKEN + WEBAPP_URL
python bot.py
```

После этого `/start` в чате с ботом покажет приветствие и кнопку WebApp.

## Замена localStorage на backend

Весь стейт инкапсулирован в `src/store/storage.js`. Чтобы перейти на API:

1. Замени `read()` / `write()` на `fetch()`-вызовы (например, к Supabase или своему API).
2. Авторизация — через `initDataUnsafe` из Telegram WebApp + проверка HMAC на сервере.
3. Подписка `subscribe()` уже есть — компоненты подхватят обновления автоматически.

## UX-философия

> Не «ты провалился». А «продолжим завтра».

- Без агрессивной геймификации.
- Без красных предупреждений.
- Большие touch-зоны, мягкие анимации.
- Mobile-first.
- Поддерживающий язык во всех краевых случаях.
