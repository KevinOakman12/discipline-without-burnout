"""
Telegram-бот «Дисциплина без выгорания».

Минимальный long-polling бот без сторонних зависимостей (только requests).
Его единственная задача — открывать Mini App кнопкой WebApp.

Usage:
    1. Скопируй .env.example в .env и впиши свои значения:
         BOT_TOKEN=<токен из @BotFather>
         WEBAPP_URL=https://<твой-домен>/index.html
    2. Установи requests:    pip install requests
    3. Запусти:              python bot.py

Замечание про WEBAPP_URL:
    Telegram требует, чтобы Mini App открывался по HTTPS.
    Варианты хостинга описаны в README.md.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any

import urllib.error
import urllib.parse
import urllib.request


# ---------- config ----------

def _load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv(Path(__file__).with_name(".env"))

BOT_TOKEN = os.environ.get("BOT_TOKEN", "").strip()
WEBAPP_URL = os.environ.get("WEBAPP_URL", "").strip()

if not BOT_TOKEN:
    raise SystemExit(
        "BOT_TOKEN не задан.\n"
        "Скопируй .env.example в .env и впиши токен бота из @BotFather."
    )

API = f"https://api.telegram.org/bot{BOT_TOKEN}"

WELCOME = (
    "Привет 🌿\n"
    "Это спокойное место для дисциплины без выгорания.\n\n"
    "Здесь ты можешь:\n"
    "• мягко удерживать ежедневные привычки;\n"
    "• закрывать день короткой рефлексией;\n"
    "• замечать свои эмоции;\n"
    "• делать короткую дыхательную паузу, когда тяжело.\n\n"
    "Нажми кнопку ниже, чтобы открыть приложение."
)

HELP = (
    "Команды:\n"
    "/start — открыть приложение\n"
    "/about — что это вообще такое\n"
    "/help — эта подсказка"
)

ABOUT = (
    "«Дисциплина без выгорания» — это маленький личный коуч.\n\n"
    "Внутри:\n"
    "• трекер привычек со «спасательной» серией;\n"
    "• вечерняя рефлексия на 3 вопроса;\n"
    "• работа с эмоциями;\n"
    "• 30-секундная дыхательная практика.\n\n"
    "Тут не за что соревноваться. Это пространство, где можно быть на своей стороне."
)


# ---------- thin HTTP wrapper ----------

def _request(method: str, **params: Any) -> dict:
    url = f"{API}/{method}"
    data = urllib.parse.urlencode(
        {k: (json.dumps(v) if not isinstance(v, (str, int, float, bool)) else v)
         for k, v in params.items() if v is not None}
    ).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        print(f"[bot] HTTP {e.code} on {method}: {body}", file=sys.stderr)
        return {"ok": False, "description": body}
    except Exception as e:
        print(f"[bot] {method} failed: {e}", file=sys.stderr)
        return {"ok": False, "description": str(e)}


def get_updates(offset: int) -> list[dict]:
    res = _request("getUpdates", offset=offset, timeout=50)
    return res.get("result", []) if res.get("ok") else []


def send_message(chat_id: int, text: str, reply_markup: dict | None = None) -> None:
    _request(
        "sendMessage",
        chat_id=chat_id,
        text=text,
        reply_markup=reply_markup,
        parse_mode="HTML",
        disable_web_page_preview=True,
    )


def set_my_commands() -> None:
    _request(
        "setMyCommands",
        commands=[
            {"command": "start", "description": "Открыть приложение"},
            {"command": "about", "description": "О приложении"},
            {"command": "help",  "description": "Помощь"},
        ],
    )


def webapp_keyboard() -> dict | None:
    if not WEBAPP_URL:
        return None
    return {
        "inline_keyboard": [[
            {"text": "🌿 Открыть приложение", "web_app": {"url": WEBAPP_URL}},
        ]],
    }


def reply_keyboard() -> dict | None:
    if not WEBAPP_URL:
        return None
    return {
        "keyboard": [[
            {"text": "🌿 Открыть приложение", "web_app": {"url": WEBAPP_URL}},
        ]],
        "resize_keyboard": True,
        "is_persistent": True,
    }


# ---------- handlers ----------

def handle_message(msg: dict) -> None:
    chat = msg.get("chat", {})
    chat_id = chat.get("id")
    text = (msg.get("text") or "").strip()

    if text.startswith("/start"):
        kb = reply_keyboard()
        if kb is None:
            send_message(
                chat_id,
                WELCOME + "\n\n⚠️ WEBAPP_URL не настроен. См. README.md, раздел «Запуск».",
            )
        else:
            send_message(chat_id, WELCOME, reply_markup=kb)
            # Дополнительно — inline-кнопка, удобная для повторного открытия.
            inline = webapp_keyboard()
            if inline:
                send_message(chat_id, "Открыть мини-приложение:", reply_markup=inline)
    elif text.startswith("/about"):
        send_message(chat_id, ABOUT, reply_markup=webapp_keyboard())
    elif text.startswith("/help"):
        send_message(chat_id, HELP, reply_markup=webapp_keyboard())
    else:
        send_message(
            chat_id,
            "Я простой бот — моя задача открыть приложение.\nНапиши /start.",
            reply_markup=webapp_keyboard(),
        )


# ---------- main loop ----------

def main() -> None:
    if not BOT_TOKEN:
        print("BOT_TOKEN не задан", file=sys.stderr)
        sys.exit(1)

    if not WEBAPP_URL:
        print(
            "[bot] WEBAPP_URL не задан. Бот будет отвечать, но кнопка WebApp не появится.\n"
            "      Укажи WEBAPP_URL в .env (HTTPS-адрес, где захостен index.html).",
            file=sys.stderr,
        )

    set_my_commands()
    print(f"[bot] started. WEBAPP_URL={WEBAPP_URL or '(не задан)'}")

    offset = 0
    while True:
        try:
            updates = get_updates(offset)
            for upd in updates:
                offset = max(offset, upd.get("update_id", 0) + 1)
                if "message" in upd:
                    handle_message(upd["message"])
        except KeyboardInterrupt:
            print("\n[bot] stopped")
            return
        except Exception as e:
            print(f"[bot] loop error: {e}", file=sys.stderr)
            time.sleep(2)


if __name__ == "__main__":
    main()
