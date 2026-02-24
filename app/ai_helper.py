import os
import anthropic
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


async def classify_task(text: str) -> dict:
    """
    Use Claude to classify a free-text task into category, priority, and extract a clean title.
    Returns defaults if AI is not configured.
    """
    cl = get_client()
    if not cl:
        return {
            "title": text[:300],
            "category": "other",
            "priority": "medium",
            "ai_summary": None,
        }

    prompt = f"""You are a smart task manager assistant. Analyze the following raw thought/idea/task and extract structured information.

Raw input (may be in any language):
"{text}"

Respond in JSON only, no explanation, with these fields:
- title: A concise task title (max 100 chars, same language as input)
- category: One of: work, personal, idea, reminder, shopping, health, finance, other
- priority: One of: low, medium, high, urgent
- ai_summary: A brief 1-sentence context or action description (same language as input)

Example response:
{{"title": "Buy milk from supermarket", "category": "shopping", "priority": "low", "ai_summary": "Need to buy milk before it runs out."}}"""

    try:
        message = await cl.messages.create(
            model="claude-haiku-4-5",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        import json
        content = message.content[0].text.strip()
        # Strip markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        result = json.loads(content)
        return {
            "title": result.get("title", text[:300]),
            "category": result.get("category", "other"),
            "priority": result.get("priority", "medium"),
            "ai_summary": result.get("ai_summary"),
        }
    except Exception:
        return {
            "title": text[:300],
            "category": "other",
            "priority": "medium",
            "ai_summary": None,
        }
