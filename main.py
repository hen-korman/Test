#!/usr/bin/env python3
"""
WhatsApp Calendar Event Creator
--------------------------------
Given a screenshot of a calendar month, extract all events with Claude vision
and send each one as a formatted WhatsApp message via Green API.

Usage:
    python main.py --screenshot /path/to/calendar.png --chat-id 972501234567@c.us

Required environment variables:
    ANTHROPIC_API_KEY       – Anthropic API key
    GREENAPI_INSTANCE_ID    – Green API instance ID
    GREENAPI_API_TOKEN      – Green API token
"""

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

from extractor import extract_events
from sender import send_events


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract calendar events from a screenshot and send them to WhatsApp."
    )
    parser.add_argument(
        "--screenshot",
        required=True,
        help="Path to the calendar screenshot (PNG, JPG, WEBP, GIF).",
    )
    parser.add_argument(
        "--chat-id",
        required=True,
        help=(
            "WhatsApp chat ID to send events to.\n"
            "  Personal: 972501234567@c.us\n"
            "  Group:    120363XXXXXXXX@g.us"
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Extract events and print them without sending to WhatsApp.",
    )
    return parser.parse_args()


def main() -> None:
    load_dotenv()
    args = parse_args()

    screenshot = args.screenshot
    if not Path(screenshot).exists():
        print(f"Error: screenshot not found: {screenshot}", file=sys.stderr)
        sys.exit(1)

    print(f"📸 Extracting events from: {screenshot}")
    try:
        events = extract_events(screenshot)
    except Exception as exc:
        print(f"Error during extraction: {exc}", file=sys.stderr)
        sys.exit(1)

    if not events:
        print("No events found in the screenshot.")
        return

    print(f"\n✅ Found {len(events)} event(s):\n")
    for ev in events:
        time_str = f"  ⏰ {ev.time}" + (f" – {ev.end_time}" if ev.end_time else "") if ev.time else "  (all day)"
        print(f"  • {ev.date}{time_str}  —  {ev.title}")
        if ev.description:
            print(f"      {ev.description}")

    if args.dry_run:
        print("\n[Dry run] — no messages sent.")
        return

    print(f"\n📤 Sending to WhatsApp chat: {args.chat_id}\n")
    try:
        results = send_events(events, args.chat_id)
    except Exception as exc:
        print(f"Error sending messages: {exc}", file=sys.stderr)
        sys.exit(1)

    sent = sum(1 for r in results if r.get("idMessage"))
    print(f"✅ Sent {sent}/{len(events)} message(s) successfully.")


if __name__ == "__main__":
    main()
