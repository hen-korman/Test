#!/usr/bin/env python3
"""
Entry point for the Task Manager.

Usage:
  python run.py          — Start the web server (default)
  python run.py bot      — Start the Telegram bot (separate process)
  python run.py both     — Start both web server and Telegram bot together
"""
import sys
import os
from dotenv import load_dotenv

load_dotenv()


def run_web():
    import uvicorn
    port = int(os.getenv("APP_PORT", 8000))
    print(f"\n Task Manager running at http://localhost:{port}\n")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)


def run_bot():
    from app.bot.telegram_bot import run_bot as _run_bot
    _run_bot()


def run_both():
    import threading
    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()
    run_web()


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "web"

    if mode == "bot":
        run_bot()
    elif mode == "both":
        run_both()
    else:
        run_web()
