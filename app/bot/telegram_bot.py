"""
Telegram Bot — quick task capture from any device.

Commands:
  /start      — Register + welcome
  /list       — Show 10 open tasks
  /done <id>  — Mark task done
  /search     — Search tasks
  /subscribe  — Subscribe to daily digest (default: on)
  /unsubscribe— Stop daily digest
  /help       — Show help

Any text message → captured as task (AI classified + dedup check).
Any voice message → transcribed via Whisper → captured as task.
"""
import os
import io
import logging
from datetime import datetime, time, timedelta
from typing import Optional

import pytz
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

from app.database import SessionLocal, Task, Subscription
from app.task_service import capture_task

logger = logging.getLogger(__name__)

TZ = os.getenv("TZ", "Asia/Jerusalem")

CATEGORY_LABELS = {
    "work": "עבודה", "personal": "אישי", "idea": "רעיון",
    "reminder": "תזכורת", "shopping": "קניות", "health": "בריאות",
    "finance": "כספים", "other": "אחר",
}
PRIORITY_EMOJI = {"urgent": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}
PRIORITY_SORT = {"urgent": 0, "high": 1, "medium": 2, "low": 3}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _ensure_subscribed(chat_id: str):
    db = SessionLocal()
    try:
        if not db.query(Subscription).filter(Subscription.chat_id == chat_id).first():
            db.add(Subscription(chat_id=chat_id, daily_digest=True))
            db.commit()
    finally:
        db.close()


def _format_task_line(t: Task) -> str:
    prio = PRIORITY_EMOJI.get(t.priority, "")
    return f"{prio} `#{t.id}` {t.title}"


def _get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    from openai import AsyncOpenAI
    return AsyncOpenAI(api_key=api_key)


# ── Command handlers ──────────────────────────────────────────────────────────

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    _ensure_subscribed(chat_id)
    await update.message.reply_text(
        "שלום! אני מנהל המשימות שלך.\n\n"
        "שלח לי כל מחשבה, רעיון או משימה — אשמור ואסווג אוטומטית.\n"
        "גם הודעות קוליות עובדות!\n\n"
        "/list — משימות פתוחות\n"
        "/done <מספר> — סמן כהושלם\n"
        "/search <טקסט> — חפש משימות\n"
        "/unsubscribe — הפסק תמצית בוקר\n"
        "/help — עזרה"
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "*איך להשתמש:*\n\n"
        "• שלח טקסט → נשמר כמשימה\n"
        "• שלח הודעה קולית → מתומלל ונשמר\n"
        "• `/list` → 10 משימות פתוחות\n"
        "• `/done 5` → סמן #5 כהושלם\n"
        "• `/search טקסט` → חפש\n"
        "• `/subscribe` → תמצית בוקר ב-8:00\n"
        "• `/unsubscribe` → עצור תמצית",
        parse_mode="Markdown",
    )


async def subscribe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    db = SessionLocal()
    try:
        sub = db.query(Subscription).filter(Subscription.chat_id == chat_id).first()
        if sub:
            sub.daily_digest = True
        else:
            db.add(Subscription(chat_id=chat_id, daily_digest=True))
        db.commit()
    finally:
        db.close()
    await update.message.reply_text("נרשמת לתמצית בוקר יומית בשעה 08:00!")


async def unsubscribe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    db = SessionLocal()
    try:
        sub = db.query(Subscription).filter(Subscription.chat_id == chat_id).first()
        if sub:
            sub.daily_digest = False
            db.commit()
    finally:
        db.close()
    await update.message.reply_text("הוסרת מהתמצית היומית.")


async def list_tasks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    db = SessionLocal()
    try:
        tasks = db.query(Task).filter(Task.status == "open").order_by(Task.id.desc()).limit(10).all()
        if not tasks:
            await update.message.reply_text("אין משימות פתוחות!")
            return
        lines = ["*משימות פתוחות:*\n"]
        for t in tasks:
            cat = CATEGORY_LABELS.get(t.category, t.category)
            lines.append(f"{_format_task_line(t)} _({cat})_")
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
    finally:
        db.close()


async def done_task(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if not args or not args[0].isdigit():
        await update.message.reply_text("שימוש: /done <מספר>")
        return
    task_id = int(args[0])
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            await update.message.reply_text(f"משימה #{task_id} לא נמצאה.")
            return
        task.status = "done"
        db.commit()
        await update.message.reply_text(
            f"✅ הושלם!\n_{task.title}_", parse_mode="Markdown"
        )
    finally:
        db.close()


async def search_tasks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("שימוש: /search <טקסט>")
        return
    query = " ".join(context.args)
    db = SessionLocal()
    try:
        tasks = (
            db.query(Task)
            .filter(
                Task.title.contains(query)
                | Task.description.contains(query)
                | Task.tags.contains(query)
            )
            .order_by(Task.id.desc())
            .limit(10)
            .all()
        )
        if not tasks:
            await update.message.reply_text(f"לא נמצא: {query}")
            return
        lines = [f"*חיפוש: {query}*\n"]
        for t in tasks:
            status = "✅" if t.status == "done" else "⬜"
            lines.append(f"{status} {_format_task_line(t)}")
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
    finally:
        db.close()


# ── Capture handlers ──────────────────────────────────────────────────────────

async def _send_capture_result(update: Update, result: dict):
    cat = CATEGORY_LABELS.get(result["category"], result["category"])
    prio = PRIORITY_EMOJI.get(result["priority"], "")
    msg = (
        f"נשמר! {prio}\n"
        f"*{result['title']}*\n"
        f"קטגוריה: {cat}"
    )
    if result.get("ai_summary"):
        msg += f"\n_{result['ai_summary']}_"
    if result.get("due_date"):
        msg += f"\n⏰ {result['due_date'][:16].replace('T', ' ')}"
    msg += f"\nID: `#{result['id']}`"
    await update.message.reply_text(msg, parse_mode="Markdown")

    if result.get("duplicate_warning"):
        dup = result["duplicate_warning"]
        await update.message.reply_text(
            f"⚠️ *משימה דומה קיימת:*\n#{dup['id']} {dup['title']}\n"
            f"לסגירה: `/done {dup['id']}`",
            parse_mode="Markdown",
        )


async def capture_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    if not text:
        return
    _ensure_subscribed(str(update.effective_chat.id))
    await update.message.reply_text("שומר...")
    result = await capture_task(text, source="telegram")
    await _send_capture_result(update, result)


async def capture_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    openai_client = _get_openai_client()
    if not openai_client:
        await update.message.reply_text(
            "הודעות קוליות לא זמינות.\nהגדר `OPENAI_API_KEY` ב-.env"
        )
        return

    await update.message.reply_text("מתמלל...")
    try:
        voice_file = await context.bot.get_file(update.message.voice.file_id)
        buf = io.BytesIO()
        await voice_file.download_to_memory(buf)
        buf.seek(0)
        buf.name = "voice.ogg"

        transcript = await openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=buf,
            language="he",
        )
        text = transcript.text.strip()
        if not text:
            await update.message.reply_text("לא הצלחתי לתמלל, נסה שוב.")
            return

        await update.message.reply_text(f"תמלול: _{text}_", parse_mode="Markdown")
        _ensure_subscribed(str(update.effective_chat.id))
        result = await capture_task(text, source="telegram")
        await _send_capture_result(update, result)

    except Exception as e:
        logger.error(f"Voice capture error: {e}")
        await update.message.reply_text("שגיאה בתמלול, נסה שוב.")


# ── Scheduled jobs ────────────────────────────────────────────────────────────

async def daily_digest_job(context: ContextTypes.DEFAULT_TYPE):
    """Send top-5 priority tasks to all subscribed users at 08:00."""
    db = SessionLocal()
    try:
        subs = db.query(Subscription).filter(Subscription.daily_digest == True).all()
        if not subs:
            return

        tasks = (
            db.query(Task)
            .filter(Task.status.in_(["open", "in_progress"]))
            .all()
        )
        tasks = sorted(tasks, key=lambda t: (PRIORITY_SORT.get(t.priority, 4)))[:5]

        if not tasks:
            return

        lines = ["☀️ *תמצית בוקר — 5 המשימות הדחופות:*\n"]
        for t in tasks:
            cat = CATEGORY_LABELS.get(t.category, t.category)
            lines.append(f"{_format_task_line(t)} _({cat})_")
        msg = "\n".join(lines)

        for sub in subs:
            try:
                await context.bot.send_message(sub.chat_id, msg, parse_mode="Markdown")
            except Exception as e:
                logger.warning(f"Failed to send digest to {sub.chat_id}: {e}")
    finally:
        db.close()


async def reminder_check_job(context: ContextTypes.DEFAULT_TYPE):
    """Every 15 min: send reminder for tasks due within the next hour."""
    now = datetime.utcnow()
    soon = now + timedelta(hours=1)

    db = SessionLocal()
    try:
        due_tasks = (
            db.query(Task)
            .filter(
                Task.due_date != None,
                Task.due_date >= now,
                Task.due_date <= soon,
                Task.status != "done",
                Task.reminded_at == None,
            )
            .all()
        )
        if not due_tasks:
            return

        subs = db.query(Subscription).all()
        chat_ids = [s.chat_id for s in subs]

        for task in due_tasks:
            due_str = task.due_date.strftime("%H:%M")
            msg = f"⏰ *תזכורת!*\n#{task.id} {task.title}\nמועד: {due_str}"
            for chat_id in chat_ids:
                try:
                    await context.bot.send_message(chat_id, msg, parse_mode="Markdown")
                except Exception as e:
                    logger.warning(f"Reminder send failed for {chat_id}: {e}")
            task.reminded_at = now

        db.commit()
    finally:
        db.close()


# ── Bot factory ───────────────────────────────────────────────────────────────

async def _post_init(application: Application) -> None:
    tz = pytz.timezone(TZ)
    application.job_queue.run_daily(
        daily_digest_job,
        time=time(8, 0, 0, tzinfo=tz),
    )
    application.job_queue.run_repeating(
        reminder_check_job,
        interval=timedelta(minutes=15),
        first=timedelta(seconds=30),
    )


def create_bot() -> Application:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN is not set")

    app = Application.builder().token(token).post_init(_post_init).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("list", list_tasks))
    app.add_handler(CommandHandler("done", done_task))
    app.add_handler(CommandHandler("search", search_tasks))
    app.add_handler(CommandHandler("subscribe", subscribe))
    app.add_handler(CommandHandler("unsubscribe", unsubscribe))
    app.add_handler(MessageHandler(filters.VOICE, capture_voice))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, capture_message))
    return app


def run_bot():
    bot = create_bot()
    logger.info("Starting Telegram bot...")
    bot.run_polling(drop_pending_updates=True)
