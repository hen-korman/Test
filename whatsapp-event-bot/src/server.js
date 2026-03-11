/**
 * server.js
 * Express webhook server — receives event data from Make.com and
 * delegates to the Puppeteer WhatsApp module.
 *
 * Start:  node src/server.js
 * Env:    copy .env.example → .env and fill in values
 */

require("dotenv").config();
const express = require("express");
const wa = require("./whatsapp");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

// ─── Auth middleware ──────────────────────────────────────────────────────────
// Make.com sends: Authorization: Bearer <WEBHOOK_SECRET>
function requireAuth(req, res, next) {
  if (!WEBHOOK_SECRET) return next(); // skip if not configured (dev mode)

  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (token !== WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  next();
}

// ─── Input validation ─────────────────────────────────────────────────────────
function validatePayload(body) {
  const required = ["groupName", "title", "date", "time"];
  const missing = required.filter((k) => !body[k]);
  if (missing.length) {
    return `Missing required fields: ${missing.join(", ")}`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return 'Field "date" must be in YYYY-MM-DD format';
  }
  if (!/^\d{2}:\d{2}$/.test(body.time)) {
    return 'Field "time" must be in HH:MM (24-hour) format';
  }
  return null;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/** Health check — Make.com can ping this to verify the server is up. */
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

/**
 * POST /create-event
 *
 * Expected JSON body:
 * {
 *   "groupName":   "חימום מספרים לוואצאפ",   // exact WhatsApp group name
 *   "title":       "מפגש זום",
 *   "description": "סקירה שבועית",            // optional
 *   "date":        "2026-03-15",               // YYYY-MM-DD
 *   "time":        "17:30",                    // HH:MM (24h)
 *   "location":    "Zoom"                      // optional
 * }
 */
app.post("/create-event", requireAuth, async (req, res) => {
  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({ ok: false, error: validationError });
  }

  const { groupName, title, description, date, time, location } = req.body;

  console.log(`[Server] Received event request: "${title}" → "${groupName}" on ${date} ${time}`);

  try {
    await wa.createEvent({ groupName, title, description, date, time, location });
    return res.json({ ok: true, message: `Event "${title}" created in "${groupName}"` });
  } catch (err) {
    console.error("[Server] createEvent failed:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Startup ──────────────────────────────────────────────────────────────────

async function start() {
  try {
    await wa.init();
  } catch (err) {
    console.error("[Server] Failed to initialise WhatsApp session:", err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[Server] Listening on http://localhost:${PORT}`);
    console.log(`[Server] Webhook endpoint: POST http://localhost:${PORT}/create-event`);
  });
}

process.on("SIGTERM", async () => {
  console.log("[Server] Shutting down...");
  await wa.close();
  process.exit(0);
});

start();
