# whatsapp-event-bot

Create real WhatsApp Group **Events** (the native calendar-style feature) via a webhook, triggered from Make.com or any HTTP client.

Uses **Puppeteer** to automate WhatsApp Web — the only way to create Events programmatically, since Meta's Cloud API does not expose this feature.

---

## Architecture

```
Make.com scenario
      │
      │  POST /create-event  (JSON + Bearer token)
      ▼
Express server (Node.js)
      │
      │  calls
      ▼
Puppeteer → WhatsApp Web
      │
      │  opens group → clicks + → Event → fills form → sends
      ▼
Native WhatsApp Event appears in group chat
```

---

## Setup

### 1. Install dependencies

```bash
cd whatsapp-event-bot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable         | Description                                          |
|------------------|------------------------------------------------------|
| `PORT`           | Port the server listens on (default: `3000`)         |
| `WEBHOOK_SECRET` | Token Make.com sends in `Authorization: Bearer ...`  |
| `WA_LOAD_TIMEOUT`| MS to wait for WhatsApp Web to load (default: 60000) |

### 3. First run — scan QR

```bash
npm start
```

A browser window opens. Scan the QR code with your phone once. The session is saved to `wa-session/` — subsequent restarts skip the QR step.

---

## Webhook

### Endpoint

```
POST http://your-server:3000/create-event
Authorization: Bearer <WEBHOOK_SECRET>
Content-Type: application/json
```

### Request body

```json
{
  "groupName":   "חימום מספרים לוואצאפ",
  "title":       "מפגש זום",
  "description": "סקירה שבועית",
  "date":        "2026-03-15",
  "time":        "17:30",
  "location":    "Zoom"
}
```

| Field         | Required | Format       |
|---------------|----------|--------------|
| `groupName`   | yes      | exact group name as it appears in WhatsApp |
| `title`       | yes      | event title  |
| `description` | no       | free text    |
| `date`        | yes      | `YYYY-MM-DD` |
| `time`        | yes      | `HH:MM` (24h)|
| `location`    | no       | free text    |

### Response

```json
{ "ok": true, "message": "Event \"מפגש זום\" created in \"חימום מספרים לוואצאפ\"" }
```

On error:

```json
{ "ok": false, "error": "Group \"X\" not found in search results." }
```

---

## Make.com integration

1. Add an **HTTP → Make a request** module at the end of your scenario
2. URL: `http://your-server:3000/create-event`
3. Method: `POST`
4. Headers: `Authorization: Bearer <your-secret>`
5. Body type: `Raw` / `application/json`
6. Body: map your scenario variables to the JSON fields above

---

## Known limitations & maintenance

- **Selectors break**: WhatsApp Web updates its DOM without notice. When something breaks, inspect the element in Chrome DevTools and update `SEL` in `src/whatsapp.js`.
- **Date/time pickers**: Some WhatsApp Web versions use native `<input type="date">` pickers that require JS injection to set values. The current code uses keyboard input; adjust if your version shows a visual picker.
- **Headless**: `headless: false` is intentional — WhatsApp Web may block headless Chromium.
- **One browser instance**: the server handles one event at a time. Concurrent requests queue naturally via Node's single-threaded async model but may timeout under heavy load.
- **Not officially supported**: this is browser automation, not an API. Use responsibly and not for spam.
