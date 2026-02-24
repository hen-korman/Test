import os
import json
import anthropic
from datetime import datetime
from typing import Optional


client: Optional[anthropic.AsyncAnthropic] = None


def get_client() -> Optional[anthropic.AsyncAnthropic]:
    global client
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    if client is None:
        client = anthropic.AsyncAnthropic(api_key=api_key)
    return client


def _strip_json(content: str) -> str:
    content = content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    return content.strip()


async def classify_task(text: str) -> dict:
    """
    Use Claude to classify a free-text task.
    Returns title, category, priority, ai_summary, and due_date (ISO string or None).
    """
    cl = get_client()
    if not cl:
        return {"title": text[:300], "category": "other", "priority": "medium",
                "ai_summary": None, "due_date": None}

    today = datetime.now().strftime("%Y-%m-%d")
    prompt = f"""You are a smart task manager. Analyze this raw input and extract structured info.

Input (any language, including Hebrew):
"{text}"

Today's date: {today}

Reply with JSON only — no explanation:
- title: concise task title (max 100 chars, same language as input)
- category: one of: work, personal, idea, reminder, shopping, health, finance, other
- priority: one of: low, medium, high, urgent
- ai_summary: 1-sentence description (same language as input)
- due_date: ISO 8601 datetime if a specific date/time is mentioned (e.g. "מחר ב-15:00" → "{today[:8]}XXThh:00:00"), otherwise null

Example: {{"title": "לסיים דוח", "category": "work", "priority": "high", "ai_summary": "יש לסיים את הדוח לפגישה.", "due_date": null}}"""

    try:
        message = await cl.messages.create(
            model="claude-haiku-4-5",
            max_tokens=350,
            messages=[{"role": "user", "content": prompt}],
        )
        result = json.loads(_strip_json(message.content[0].text))
        return {
            "title": result.get("title", text[:300]),
            "category": result.get("category", "other"),
            "priority": result.get("priority", "medium"),
            "ai_summary": result.get("ai_summary"),
            "due_date": result.get("due_date"),
        }
    except Exception:
        return {"title": text[:300], "category": "other", "priority": "medium",
                "ai_summary": None, "due_date": None}


async def check_duplicate(new_title: str, new_id: int, db) -> Optional[dict]:
    """
    Ask Claude if the new task is similar to any recent open tasks.
    Returns {"id": X, "title": "..."} or None.
    """
    cl = get_client()
    if not cl:
        return None

    from app.database import Task, Status
    recent = (
        db.query(Task)
        .filter(Task.status == Status.open, Task.id != new_id)
        .order_by(Task.id.desc())
        .limit(25)
        .all()
    )
    if not recent:
        return None

    tasks_list = "\n".join(f"{t.id}: {t.title}" for t in recent)
    prompt = f"""New task: "{new_title}"

Existing open tasks:
{tasks_list}

Is the new task a clear duplicate or near-identical to any existing task?
Reply with JSON only: {{"duplicate": true, "task_id": 5}} or {{"duplicate": false}}
Only flag obvious duplicates, not loosely related tasks."""

    try:
        message = await cl.messages.create(
            model="claude-haiku-4-5",
            max_tokens=60,
            messages=[{"role": "user", "content": prompt}],
        )
        result = json.loads(_strip_json(message.content[0].text))
        if result.get("duplicate") and result.get("task_id"):
            match = next((t for t in recent if t.id == result["task_id"]), None)
            if match:
                return {"id": match.id, "title": match.title}
    except Exception:
        pass
    return None
