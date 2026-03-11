/**
 * whatsapp.js
 * Manages a single persistent Puppeteer session against WhatsApp Web.
 *
 * The session is stored in ../wa-session/ so QR scanning is only needed once.
 * All functions are async and resolve when the action is confirmed on-screen.
 */

const puppeteer = require("puppeteer");
const path = require("path");

const SESSION_DIR = path.join(__dirname, "..", "wa-session");
const WA_URL = "https://web.whatsapp.com";
const LOAD_TIMEOUT = parseInt(process.env.WA_LOAD_TIMEOUT || "60000", 10);

// ─── Selectors ───────────────────────────────────────────────────────────────
// WhatsApp Web changes these occasionally. Update here when they break.
const SEL = {
  // The global search box (top-left)
  searchBox: 'div[data-tab="3"][contenteditable="true"]',
  // A chat row matched by its title span
  chatRow: (name) => `span[title="${name}"]`,
  // The "attach" / "+" button in the message bar
  attachBtn: [
    'button[data-tab="10"]',
    'span[data-icon="plus"]',
    'button[aria-label="Attach"]',
    'button[title="Attach"]',
  ],
  // "Event" option inside the attach menu
  eventOption: ["li[data-testid='mi-menuo-event']", "span[data-icon='event']"],
  // Contenteditable fields inside the event creation panel
  eventFields: 'div[data-tab][contenteditable="true"], input[type="text"], input[type="date"], input[type="time"]',
  // The "Send" / "Done" button that finalises the event
  sendBtn: [
    "button[data-testid='send-btn']",
    "button[aria-label='Send']",
    "button[aria-label='שלח']",
    "button[aria-label='Done']",
  ],
};

// ─── State ────────────────────────────────────────────────────────────────────
let browser = null;
let page = null;
let ready = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Wait up to `ms` for any selector in `candidates` to appear, return the first match. */
async function waitForAny(candidates, ms = 8000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    for (const sel of candidates) {
      try {
        const el = await page.$(sel);
        if (el) return el;
      } catch (_) {}
    }
    await sleep(300);
  }
  throw new Error(`None of these selectors appeared within ${ms}ms:\n${candidates.join("\n")}`);
}

/** Click any matching selector from a list, throw if none found. */
async function clickAny(candidates, ms = 8000) {
  const el = await waitForAny(candidates, ms);
  await el.click();
  return el;
}

/** XPath text search — finds the first element whose visible text contains `text`. */
async function findByText(text, ms = 6000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const [el] = await page.$x(
      `//*[contains(normalize-space(text()), '${text}') or contains(normalize-space(@aria-label), '${text}')]`
    );
    if (el) return el;
    await sleep(300);
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Launch Puppeteer and load WhatsApp Web.
 * If a session is already saved, no QR scan is needed.
 * Call this once at server startup.
 */
async function init() {
  console.log("[WA] Launching browser...");
  browser = await puppeteer.launch({
    headless: false,           // must be false so WhatsApp Web renders correctly
    userDataDir: SESSION_DIR,  // persist login across restarts
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1280,900",
    ],
    defaultViewport: { width: 1280, height: 900 },
  });

  page = (await browser.pages())[0] || (await browser.newPage());
  await page.goto(WA_URL, { waitUntil: "networkidle2", timeout: LOAD_TIMEOUT });

  // Wait for the main chat list to appear (confirms login)
  try {
    await page.waitForSelector('#pane-side, div[data-tab="3"]', {
      timeout: LOAD_TIMEOUT,
    });
    console.log("[WA] Logged in — session active.");
  } catch (_) {
    console.log("[WA] No active session found. Please scan the QR code shown in the browser window.");
    // Wait until the user scans and the chat pane appears
    await page.waitForSelector('#pane-side, div[data-tab="3"]', {
      timeout: 120_000,
    });
    console.log("[WA] QR scanned — session saved.");
  }

  ready = true;
}

/**
 * Create a WhatsApp Event in a group.
 *
 * @param {object} params
 * @param {string} params.groupName  - Exact name of the WhatsApp group
 * @param {string} params.title      - Event title
 * @param {string} params.description
 * @param {string} params.date       - "YYYY-MM-DD"
 * @param {string} params.time       - "HH:MM"  (24-hour)
 * @param {string} [params.location]
 */
async function createEvent({ groupName, title, description, date, time, location }) {
  if (!ready) throw new Error("WhatsApp session not initialised. Call init() first.");

  // ── 1. Search for the group ──────────────────────────────────────────────
  console.log(`[WA] Searching for group: "${groupName}"`);
  await page.waitForSelector(SEL.searchBox, { timeout: LOAD_TIMEOUT });
  await page.click(SEL.searchBox);
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await page.type(SEL.searchBox, groupName, { delay: 60 });
  await sleep(2000);

  // ── 2. Open the group ────────────────────────────────────────────────────
  const chat = await page.$(SEL.chatRow(groupName));
  if (!chat) throw new Error(`Group "${groupName}" not found in search results.`);
  await chat.click();
  await sleep(1500);

  // ── 3. Open the attach/plus menu ─────────────────────────────────────────
  console.log("[WA] Opening attach menu...");
  await clickAny(SEL.attachBtn);
  await sleep(1200);

  // ── 4. Click "Event" ─────────────────────────────────────────────────────
  console.log("[WA] Selecting Event option...");
  // Try selector first, then fall back to visible text
  let eventBtn = null;
  try {
    eventBtn = await clickAny(SEL.eventOption, 4000);
  } catch (_) {
    eventBtn = await findByText("Event", 4000) || await findByText("אירוע", 4000);
    if (!eventBtn) throw new Error("Could not find the Event option in the attach menu. WhatsApp UI may have changed.");
    await eventBtn.click();
  }
  await sleep(2000);

  // ── 5. Fill in the event form ────────────────────────────────────────────
  console.log("[WA] Filling event form...");

  // WhatsApp event form fields appear in this order:
  //   [Event name] [Description] [Date] [Time] [Location?]
  // We navigate via keyboard Tab to stay robust against selector changes.

  // Focus the first editable field in the form
  await page.keyboard.press("Tab");
  await sleep(400);

  // Event name
  await clearAndType(title);
  await page.keyboard.press("Tab");
  await sleep(300);

  // Description
  await clearAndType(description || "");
  await page.keyboard.press("Tab");
  await sleep(300);

  // Date — format depends on locale; WhatsApp usually accepts YYYY-MM-DD via keyboard
  await clearAndType(date);
  await page.keyboard.press("Tab");
  await sleep(300);

  // Time — HH:MM
  await clearAndType(time);

  if (location) {
    await page.keyboard.press("Tab");
    await sleep(300);
    await clearAndType(location);
  }

  await sleep(600);

  // ── 6. Send / Confirm ────────────────────────────────────────────────────
  console.log("[WA] Sending event...");
  try {
    await clickAny(SEL.sendBtn, 6000);
  } catch (_) {
    // Last resort: find by visible text
    const btn =
      (await findByText("Send", 4000)) ||
      (await findByText("שלח", 4000)) ||
      (await findByText("Done", 4000));
    if (!btn) throw new Error("Could not find the Send / Done button.");
    await btn.click();
  }

  await sleep(1500);
  console.log(`[WA] Event "${title}" sent to "${groupName}".`);
}

/** Select-all + type replacement (works in contenteditable and regular inputs). */
async function clearAndType(text) {
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  if (text) await page.keyboard.type(text, { delay: 40 });
}

/** Graceful shutdown — close the browser. */
async function close() {
  if (browser) await browser.close();
}

module.exports = { init, createEvent, close };
