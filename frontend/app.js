/* ===== State ===== */
let filters = { status: "", priority: "", search: "" };
let searchTimer = null;
let currentTaskId = null;

const CATEGORY_LABELS = {
  work: "עבודה", personal: "אישי", idea: "רעיון",
  reminder: "תזכורת", shopping: "קניות", health: "בריאות",
  finance: "כספים", other: "אחר",
};
const SOURCE_LABELS = {
  web: "web", telegram: "Telegram", whatsapp: "WhatsApp",
};

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  loadStats();

  const input = document.getElementById("captureInput");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      captureTask();
    }
  });
});

/* ===== Quick Capture ===== */
async function captureTask() {
  const input = document.getElementById("captureInput");
  const btn = document.getElementById("captureBtn");
  const text = input.value.trim();
  if (!text) return;

  btn.disabled = true;
  document.getElementById("captureBtnText").textContent = "שומר...";

  try {
    const res = await fetch("/api/capture/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source: "web" }),
    });

    if (!res.ok) throw new Error("שגיאה בשמירה");
    const task = await res.json();

    input.value = "";
    showCaptureResult(
      `נשמר: "${task.title}" | ${CATEGORY_LABELS[task.category] || task.category} | ${priorityLabel(task.priority)}`,
      "success"
    );
    loadTasks();
    loadStats();
  } catch (err) {
    showCaptureResult("שגיאה בשמירה, נסה שוב", "error");
  } finally {
    btn.disabled = false;
    document.getElementById("captureBtnText").textContent = "שלח";
  }
}

function showCaptureResult(msg, type) {
  const el = document.getElementById("captureResult");
  el.textContent = msg;
  el.className = `capture-result ${type}`;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 4000);
}

/* ===== Filters ===== */
function setFilter(type, value, btn) {
  // Toggle off if same value
  if (filters[type] === value && value !== "") {
    filters[type] = "";
    document.querySelectorAll(`[data-filter="${type}"]`).forEach(b => b.classList.remove("active"));
  } else {
    filters[type] = value;
    document.querySelectorAll(`[data-filter="${type}"]`).forEach(b => b.classList.remove("active"));
    if (value !== "") btn.classList.add("active");
    else btn.classList.add("active");
  }
  loadTasks();
}

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    filters.search = document.getElementById("searchInput").value.trim();
    loadTasks();
  }, 300);
}

/* ===== Load Tasks ===== */
async function loadTasks() {
  const list = document.getElementById("taskList");
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.search) params.set("search", filters.search);

  try {
    const res = await fetch(`/api/tasks/?${params}`);
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    list.innerHTML = '<div class="empty">שגיאה בטעינת משימות</div>';
  }
}

function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  if (tasks.length === 0) {
    list.innerHTML = '<div class="empty">אין משימות. כתוב משהו למעלה!</div>';
    return;
  }

  list.innerHTML = tasks.map(t => `
    <div class="task-card ${t.status === 'done' ? 'done-card' : ''}" onclick="openModal(${t.id})">
      <div class="task-card-left">
        <div
          class="task-check ${t.status === 'done' ? 'checked' : ''}"
          onclick="event.stopPropagation(); toggleDone(${t.id}, '${t.status}')"
          title="סמן כהושלם"
        ></div>
        <div class="priority-dot ${t.priority}" title="${priorityLabel(t.priority)}"></div>
      </div>
      <div class="task-content">
        <div class="task-title">${escHtml(t.title)}</div>
        ${t.ai_summary ? `<div class="task-summary">${escHtml(t.ai_summary)}</div>` : ""}
        <div class="task-meta">
          <span class="tag tag-category">${CATEGORY_LABELS[t.category] || t.category}</span>
          ${t.source !== "web" ? `<span class="tag tag-source">${SOURCE_LABELS[t.source] || t.source}</span>` : ""}
          ${(t.tags || "").split(",").filter(Boolean).map(tag =>
            `<span class="tag tag-custom">${escHtml(tag.trim())}</span>`
          ).join("")}
          <span class="task-date">${formatDate(t.created_at)}</span>
        </div>
      </div>
    </div>
  `).join("");
}

/* ===== Stats ===== */
async function loadStats() {
  try {
    const res = await fetch("/api/tasks/stats/summary");
    const stats = await res.json();
    document.getElementById("statOpen").textContent = `פתוח: ${stats.by_status.open}`;
    document.getElementById("statInProgress").textContent = `בעבודה: ${stats.by_status.in_progress}`;
    document.getElementById("statDone").textContent = `הושלם: ${stats.by_status.done}`;
  } catch {}
}

/* ===== Toggle Done ===== */
async function toggleDone(taskId, currentStatus) {
  const newStatus = currentStatus === "done" ? "open" : "done";
  await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  loadTasks();
  loadStats();
}

/* ===== Modal ===== */
async function openModal(taskId) {
  currentTaskId = taskId;
  try {
    const res = await fetch(`/api/tasks/${taskId}`);
    const task = await res.json();

    document.getElementById("editId").value = task.id;
    document.getElementById("editTitle").value = task.title;
    document.getElementById("editDescription").value = task.description || "";
    document.getElementById("editStatus").value = task.status;
    document.getElementById("editPriority").value = task.priority;
    document.getElementById("editCategory").value = task.category;
    document.getElementById("editTags").value = task.tags || "";

    document.getElementById("modalOverlay").classList.remove("hidden");
  } catch {}
}

function closeModal() {
  document.getElementById("modalOverlay").classList.add("hidden");
  currentTaskId = null;
}

async function saveTask() {
  if (!currentTaskId) return;
  const data = {
    title: document.getElementById("editTitle").value.trim(),
    description: document.getElementById("editDescription").value.trim() || null,
    status: document.getElementById("editStatus").value,
    priority: document.getElementById("editPriority").value,
    category: document.getElementById("editCategory").value,
    tags: document.getElementById("editTags").value.trim() || null,
  };

  await fetch(`/api/tasks/${currentTaskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  closeModal();
  loadTasks();
  loadStats();
}

async function deleteTask() {
  if (!currentTaskId || !confirm("למחוק את המשימה?")) return;
  await fetch(`/api/tasks/${currentTaskId}`, { method: "DELETE" });
  closeModal();
  loadTasks();
  loadStats();
}

/* ===== Helpers ===== */
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function priorityLabel(p) {
  return { urgent: "דחוף", high: "גבוה", medium: "בינוני", low: "נמוך" }[p] || p;
}
