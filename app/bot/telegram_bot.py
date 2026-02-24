"""
Telegram Bot — Quick task capture from any device.

Commands:
  /start  — Welcome message
  /list   — Show open tasks (last 10)
  /done   — Mark task done: /done 5
  /help   — Show help

Any plain text message → captured as a task (AI classified).
"""
import os
import logging
import httpx
from telegram import Update, BotCommand
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_BASE = os.getenv("APP_BASE_URL", "http://localhost:8000")

CATEGORY_LABELS = {
    "work": "עבודה", "personal": "אישי", "idea": "רעיון",
    "reminder": "תזכורת", "shopping": "קניות", "health": "בריאות",
    "finance": "כספים", "other": "אחר",
}
PRIORITY_EMOJI = {
    "urgent": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢",
}


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "שלום! אני מנהל המשימות שלך.\n\n"
        "פשוט שלח לי כל מחשבה, רעיון או משימה — ואני אשמור אותה ואסווג אותה.\n\n"
        "/list — רשימת משימות פתוחות\n"
        "/done <מספר> — סמן משימה כהושלמה\n"
        "/help — עזרה"
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "איך להשתמש בבוט:\n\n"
        "• שלח כל טקסט → יישמר כמשימה\n"
        "• /list → רשימת 10 משימות פתוחות אחרונות\n"
        "• /done 5 → סמן משימה 5 כהושלמה\n"
        "• /search <מלל> → חיפוש משימות"
    )


async def capture_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    if not text:
        return

    await update.message.reply_text("שומר...")

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            res = await client.post(
                f"{API_BASE}/api/capture/",
                json={"text": text, "source": "telegram"},
            )
            task = res.json()
            cat = CATEGORY_LABELS.get(task["category"], task["category"])
            prio = PRIORITY_EMOJI.get(task["priority"], "")
            reply = (
                f"נשמר! {prio}\n"
                f"*{task['title']}*\n"
                f"קטגוריה: {cat}\n"
            )
            if task.get("ai_summary"):
                reply += f"_{task['ai_summary']}_\n"
            reply += f"מזהה: `#{task['id']}`"
            await update.message.reply_text(reply, parse_mode="Markdown")
        except Exception as e:
            logger.error(f"Capture error: {e}")
            await update.message.reply_text("שגיאה בשמירה, נסה שוב.")


async def list_tasks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            res = await client.get(f"{API_BASE}/api/tasks/?status=open&limit=10")
            tasks = res.json()
            if not tasks:
                await update.message.reply_text("אין משימות פתוחות!")
                return
            lines = ["*משימות פתוחות:*\n"]
            for t in tasks:
                prio = PRIORITY_EMOJI.get(t["priority"], "")
                cat = CATEGORY_LABELS.get(t["category"], t["category"])
                lines.append(f"{prio} `#{t['id']}` {t['title']} _({cat})_")
            await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
        except Exception as e:
            logger.error(e)
            await update.message.reply_text("שגיאה בטעינת משימות.")


async def done_task(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if not args or not args[0].isdigit():
        await update.message.reply_text("שימוש: /done <מספר משימה>")
        return

    task_id = int(args[0])
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            res = await client.patch(
                f"{API_BASE}/api/tasks/{task_id}",
                json={"status": "done"},
            )
            if res.status_code == 404:
                await update.message.reply_text(f"משימה #{task_id} לא נמצאה.")
                return
            task = res.json()
            await update.message.reply_text(f"משימה #{task_id} סומנה כהושלמה!\n_{task['title']}_", parse_mode="Markdown")
        except Exception as e:
            logger.error(e)
            await update.message.reply_text("שגיאה.")


async def search_tasks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("שימוש: /search <טקסט>")
        return
    query = " ".join(context.args)
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            res = await client.get(f"{API_BASE}/api/tasks/?search={query}&limit=10")
            tasks = res.json()
            if not tasks:
                await update.message.reply_text(f"לא נמצאו משימות עבור: {query}")
                return
            lines = [f"*תוצאות חיפוש: {query}*\n"]
            for t in tasks:
                prio = PRIORITY_EMOJI.get(t["priority"], "")
                status = "✅" if t["status"] == "done" else "⬜"
                lines.append(f"{status} {prio} `#{t['id']}` {t['title']}")
            await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
        except Exception as e:
            logger.error(e)
            await update.message.reply_text("שגיאה בחיפוש.")


def create_bot() -> Application:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN is not set in environment")

    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("list", list_tasks))
    app.add_handler(CommandHandler("done", done_task))
    app.add_handler(CommandHandler("search", search_tasks))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, capture_message))
    return app


def run_bot():
    bot = create_bot()
    logger.info("Starting Telegram bot...")
    bot.run_polling(drop_pending_updates=True)
