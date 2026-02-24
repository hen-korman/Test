"""
Quick capture endpoint — receives raw text, uses AI to classify it, saves as task.
Used by the web quick-add bar. The Telegram/WhatsApp bots call task_service directly.
"""
from fastapi import APIRouter
from pydantic import BaseModel

from app.task_service import capture_task

router = APIRouter(prefix="/api/capture", tags=["capture"])


class CaptureRequest(BaseModel):
    text: str
    source: str = "web"


@router.post("/")
async def capture(req: CaptureRequest):
    return await capture_task(req.text, req.source)
