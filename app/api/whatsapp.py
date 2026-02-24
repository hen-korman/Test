"""
WhatsApp webhook via Twilio.

Setup:
1. Create a Twilio account at twilio.com
2. Enable WhatsApp Sandbox: console.twilio.com/messaging/whatsapp/sandbox
3. Set webhook URL: https://your-server.com/api/whatsapp/webhook
4. Fill TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in .env
"""
import logging
from fastapi import APIRouter, Request, Form, Header
from fastapi.responses import PlainTextResponse

from app.database import SessionLocal, Task
from app.task_service import capture_task

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

COMMANDS_HELP = (
    "פקודות:\n"
    "• כל הודעה → נשמרת כמשימה\n"
    "• רשימה → הצג משימות פתוחות\n"
    "• סיים <מספר> → סמן משימה כהושלמה\n"
    "• עזרה → הצג הודעה זו"
)

CATEGORY_LABELS = {
    "work": "עבודה", "personal": "אישי", "idea": "רעיון",
    "reminder": "תזכורת", "shopping": "קניות", "health": "בריאות",
    "finance": "כספים", "other": "אחר",
}
PRIORITY_EMOJI = {"urgent": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}


@router.post("/webhook", response_class=PlainTextResponse)
async def whatsapp_webhook(
    request: Request,
    Body: str = Form(default=""),
    From: str = Form(default=""),
    x_twilio_signature: str = Header(default=""),
):
    text = Body.strip()
    if not text:
        return ""

    lower = text.lower().strip()

    if lower in ("עזרה", "help", "/help"):
        return twiml_reply(COMMANDS_HELP)

    if lower in ("רשימה", "list", "/list"):
        db = SessionLocal()
        try:
            tasks = db.query(Task).filter(Task.status == "open").order_by(Task.id.desc()).limit(10).all()
            if not tasks:
                return twiml_reply("אין משימות פתוחות!")
            lines = ["משימות פתוחות:"]
            for t in tasks:
                lines.append(f"{PRIORITY_EMOJI.get(t.priority, '')} #{t.id} {t.title}")
            return twiml_reply("\n".join(lines))
        finally:
            db.close()

    if lower.startswith(("סיים ", "done ")):
        parts = text.split(maxsplit=1)
        if len(parts) == 2 and parts[1].isdigit():
            task_id = int(parts[1])
            db = SessionLocal()
            try:
                task = db.query(Task).filter(Task.id == task_id).first()
                if not task:
                    return twiml_reply(f"משימה #{task_id} לא נמצאה.")
                task.status = "done"
                db.commit()
                return twiml_reply(f"סומנה כהושלמה!\n#{task.id} {task.title}")
            finally:
                db.close()

    # Default: capture as task
    result = await capture_task(text, source="whatsapp")
    cat = CATEGORY_LABELS.get(result["category"], result["category"])
    prio = PRIORITY_EMOJI.get(result["priority"], "")
    reply = f"נשמר! {prio}\n#{result['id']} {result['title']}\nקטגוריה: {cat}"
    if result.get("ai_summary"):
        reply += f"\n{result['ai_summary']}"
    if result.get("due_date"):
        reply += f"\n⏰ תאריך יעד: {result['due_date'][:16].replace('T', ' ')}"
    if result.get("duplicate_warning"):
        dup = result["duplicate_warning"]
        reply += f"\n⚠️ משימה דומה: #{dup['id']} {dup['title']}"
    return twiml_reply(reply)


def twiml_reply(msg: str) -> str:
    safe = msg.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>{safe}</Message>
</Response>"""
