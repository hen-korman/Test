"""Extract calendar events from a screenshot using Claude vision."""

import base64
import json
import os
from dataclasses import dataclass
from pathlib import Path

import anthropic


@dataclass
class CalendarEvent:
    title: str
    date: str          # e.g. "2024-03-15"
    time: str          # e.g. "14:00" or "" if all-day
    end_time: str      # e.g. "15:30" or ""
    description: str   # any extra notes visible in the screenshot


def extract_events(image_path: str) -> list[CalendarEvent]:
    """Send a calendar screenshot to Claude and get back structured events."""
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    # Detect MIME type from extension
    ext = path.suffix.lower()
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
                ".gif": "image/gif", ".webp": "image/webp"}
    media_type = mime_map.get(ext, "image/png")

    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    prompt = """You are a calendar parser. Examine this calendar screenshot carefully.

Extract every visible event/meeting and return them as a JSON array.
Each object must have these exact fields:
  - "title":       event name (string)
  - "date":        date in YYYY-MM-DD format (string). If you only see "March 15" and the year is visible elsewhere in the image, infer it. If the year cannot be determined, use the current year 2026.
  - "time":        start time in HH:MM 24-hour format, or "" if all-day (string)
  - "end_time":    end time in HH:MM 24-hour format, or "" if unknown (string)
  - "description": any extra text visible for this event, or "" (string)

Return ONLY a valid JSON array — no markdown, no explanation, no code fences.
Example: [{"title":"Team standup","date":"2026-03-11","time":"09:00","end_time":"09:15","description":""}]"""

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_data,
                    },
                },
                {"type": "text", "text": prompt},
            ],
        }],
    ) as stream:
        final = stream.get_final_message()

    # Extract the text block (thinking blocks are separate)
    raw_text = next(
        block.text for block in final.content if block.type == "text"
    )

    events_data = json.loads(raw_text.strip())

    return [
        CalendarEvent(
            title=e["title"],
            date=e["date"],
            time=e.get("time", ""),
            end_time=e.get("end_time", ""),
            description=e.get("description", ""),
        )
        for e in events_data
    ]
