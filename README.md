# מנהל משימות חכם

מערכת לניהול משימות עם לכידה מהירה מ-Telegram, WhatsApp, ואתר אינטרנט.
Claude AI מסווג כל משימה אוטומטית לקטגוריה ועדיפות.

---

## תכונות

- **לכידה מהירה** — שלח מחשבה ב-Telegram ותוך שנייה היא נשמרת כמשימה
- **AI חכם** — Claude מנתח את הטקסט ומסווג קטגוריה, עדיפות וסיכום
- **Dashboard** — ממשק ווב מסודר עם פילטרים וחיפוש
- **WhatsApp** — דרך Twilio Sandbox (ראה הגדרה)
- **SQLite** — בסיס נתונים קל, ללא צורך בשרת חיצוני

---

## התקנה מהירה

```bash
# שכפל / הורד את הקוד
cd task-manager

# צור סביבה וירטואלית
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# התקן תלויות
pip install -r requirements.txt

# הגדר משתני סביבה
cp .env.example .env
# ערוך את .env עם המפתחות שלך
```

---

## הגדרת משתני סביבה (`.env`)

| משתנה | תיאור | חובה? |
|---|---|---|
| `ANTHROPIC_API_KEY` | מפתח Claude API מ-console.anthropic.com | כן (לAI) |
| `TELEGRAM_BOT_TOKEN` | מפתח בוט מ-@BotFather ב-Telegram | לבוט Telegram |
| `TWILIO_ACCOUNT_SID` | Account SID מ-twilio.com | ל-WhatsApp |
| `TWILIO_AUTH_TOKEN` | Auth Token מ-twilio.com | ל-WhatsApp |
| `APP_PORT` | פורט לשרת הווב (ברירת מחדל: 8000) | לא |

---

## הרצה

### רק שרת ווב
```bash
python run.py
```
גש ל: http://localhost:8000

### רק בוט Telegram
```bash
python run.py bot
```

### שניהם יחד
```bash
python run.py both
```

---

## הגדרת Telegram Bot

1. פתח Telegram ושלח `/newbot` ל-@BotFather
2. בחר שם ושם משתמש לבוט
3. העתק את ה-Token לתוך `.env` כ-`TELEGRAM_BOT_TOKEN`
4. הרץ `python run.py bot` והתחל לשלוח הודעות לבוט

**פקודות בבוט:**
- כל הודעת טקסט → נשמרת כמשימה
- `/list` → הצג 10 משימות פתוחות
- `/done 5` → סמן משימה #5 כהושלמה
- `/search טקסט` → חיפוש משימות

---

## הגדרת WhatsApp (Twilio)

1. צור חשבון ב-[twilio.com](https://twilio.com)
2. עבור ל-Messaging → WhatsApp → Sandbox
3. הגדר Webhook URL: `https://your-domain.com/api/whatsapp/webhook`
4. מלא `TWILIO_ACCOUNT_SID` ו-`TWILIO_AUTH_TOKEN` ב-`.env`
5. שלח ממספר הווטסאפ שלך להצטרפות ל-Sandbox

> הערה: לשרת ציבורי ניתן להשתמש ב-[ngrok](https://ngrok.com) בפיתוח:
> ```bash
> ngrok http 8000
> ```

---

## מבנה הקוד

```
.
├── run.py                  # נקודת כניסה ראשית
├── requirements.txt
├── .env.example
├── app/
│   ├── main.py             # FastAPI app
│   ├── database.py         # SQLAlchemy models + SQLite
│   ├── ai_helper.py        # Claude AI classification
│   ├── api/
│   │   ├── tasks.py        # CRUD API למשימות
│   │   ├── quick_capture.py # לכידה מהירה עם AI
│   │   └── whatsapp.py     # Twilio WhatsApp webhook
│   └── bot/
│       └── telegram_bot.py # Telegram bot
└── frontend/
    ├── index.html          # Dashboard
    ├── style.css
    └── app.js
```

---

## API Endpoints

| Method | Path | תיאור |
|---|---|---|
| `GET` | `/api/tasks/` | רשימת משימות עם פילטרים |
| `POST` | `/api/tasks/` | יצירת משימה ידנית |
| `GET` | `/api/tasks/{id}` | משימה לפי ID |
| `PATCH` | `/api/tasks/{id}` | עדכון משימה |
| `DELETE` | `/api/tasks/{id}` | מחיקת משימה |
| `GET` | `/api/tasks/stats/summary` | סטטיסטיקות |
| `POST` | `/api/capture/` | לכידה מהירה עם AI |
| `POST` | `/api/whatsapp/webhook` | Twilio WhatsApp webhook |
