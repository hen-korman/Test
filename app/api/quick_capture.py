"""
Quick capture endpoint — receives raw text, uses AI to classify it, saves as task.
Used by the Telegram bot, WhatsApp webhook, and the web quick-add bar.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db, Task
from app.ai_helper import classify_task

router = APIRouter(prefix="/api/capture", tags=["capture"])


class CaptureRequest(BaseModel):
    text: str
    source: str = "web"  # web / telegram / whatsapp


@router.post("/")
async def capture(req: CaptureRequest, db: Session = Depends(get_db)):
    classified = await classify_task(req.text)

    task = Task(
        title=classified["title"],
        category=classified["category"],
        priority=classified["priority"],
        ai_summary=classified["ai_summary"],
        source=req.source,
        status="open",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return {
        "id": task.id,
        "title": task.title,
        "category": task.category,
        "priority": task.priority,
        "ai_summary": task.ai_summary,
    }
