"""
WhatsApp webhook via Twilio.

Setup:
1. Create a Twilio account at twilio.com
2. Enable WhatsApp Sandbox at console.twilio.com/messaging/whatsapp/sandbox
3. Set the webhook URL to: https://your-server.com/api/whatsapp/webhook
4. Fill in TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in .env
"""
import os
import hmac
import hashlib
import urllib.parse
import logging
from fastapi import APIRouter, Request, Form, HTTPException, Header
from fastapi.responses import PlainTextResponse

from app.database import SessionLocal, Task
from app.ai_helper import classify_task

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
PRIORITY_EMOJI = {
    "urgent": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢",
}


def validate_twilio_signature(request_url: str, params: dict, signature: str) -> bool:
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    if not auth_token:
        return True  # Skip validation if not configured
    s = request_url + "".join(f"{k}{v}" for k, v in sorted(params.items()))
    expected = hmac.new(auth_token.encode(), s.encode(), hashlib.sha1).digest()
    import base64
    expected_b64 = base64.b64encode(expected).decode()
    return hmac.compare_digest(expected_b64, signature)


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

    # Commands
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
                prio = PRIORITY_EMOJI.get(t.priority, "")
                lines.append(f"{prio} #{t.id} {t.title}")
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
    classified = await classify_task(text)
    db = SessionLocal()
    try:
        task = Task(
            title=classified["title"],
            category=classified["category"],
            priority=classified["priority"],
            ai_summary=classified["ai_summary"],
            source="whatsapp",
            status="open",
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        cat = CATEGORY_LABELS.get(task.category, task.category)
        prio = PRIORITY_EMOJI.get(task.priority, "")
        reply = f"נשמר! {prio}\n#{task.id} {task.title}\nקטגוריה: {cat}"
        if task.ai_summary:
            reply += f"\n{task.ai_summary}"
        return twiml_reply(reply)
    finally:
        db.close()


def twiml_reply(msg: str) -> str:
    safe = msg.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>{safe}</Message>
</Response>"""
