"""Send calendar events to a WhatsApp chat via Green API."""

import os
import time

import requests

from extractor import CalendarEvent


def _format_event(event: CalendarEvent) -> str:
    """Format a CalendarEvent into a readable WhatsApp message."""
    lines = [f"📅 *{event.title}*"]

    date_part = event.date
    if event.time:
        time_part = event.time
        if event.end_time:
            time_part += f" – {event.end_time}"
        lines.append(f"🗓 {date_part}  ⏰ {time_part}")
    else:
        lines.append(f"🗓 {date_part}  (all day)")

    if event.description:
        lines.append(f"📝 {event.description}")

    return "\n".join(lines)


def send_events(events: list[CalendarEvent], chat_id: str) -> list[dict]:
    """
    Send each event as a separate WhatsApp message via Green API.

    Args:
        events:  List of CalendarEvent objects to send.
        chat_id: WhatsApp chat ID, e.g. "972501234567@c.us" for a contact
                 or "120363XXXXXXXX@g.us" for a group.

    Returns:
        List of Green API response dicts (one per event).
    """
    instance_id = os.environ["GREENAPI_INSTANCE_ID"]
    api_token = os.environ["GREENAPI_API_TOKEN"]

    base_url = (
        f"https://api.green-api.com/waInstance{instance_id}"
        f"/sendMessage/{api_token}"
    )

    results = []
    for i, event in enumerate(events):
        message = _format_event(event)
        payload = {"chatId": chat_id, "message": message}

        resp = requests.post(base_url, json=payload, timeout=30)
        resp.raise_for_status()
        results.append(resp.json())

        # Green API recommends a small delay between messages
        if i < len(events) - 1:
            time.sleep(1)

    return results
