"""
Shared task capture logic used by the API, Telegram bot, and WhatsApp webhook.
Avoids HTTP round-trips between bot and server.
"""
from datetime import datetime
from typing import Optional

from app.database import SessionLocal, Task
from app.ai_helper import classify_task, check_duplicate


async def capture_task(text: str, source: str = "web") -> dict:
    classified = await classify_task(text)

    due_date: Optional[datetime] = None
    if classified.get("due_date"):
        try:
            due_date = datetime.fromisoformat(classified["due_date"])
        except Exception:
            pass

    db = SessionLocal()
    try:
        task = Task(
            title=classified["title"],
            category=classified["category"],
            priority=classified["priority"],
            ai_summary=classified["ai_summary"],
            due_date=due_date,
            source=source,
            status="open",
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        duplicate = await check_duplicate(task.title, task.id, db)

        return {
            "id": task.id,
            "title": task.title,
            "category": task.category,
            "priority": task.priority,
            "ai_summary": task.ai_summary,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "duplicate_warning": duplicate,
        }
    finally:
        db.close()
