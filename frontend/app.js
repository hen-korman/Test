/* ===== State ===== */
let filters = { status: "", priority: "", search: "" };
let viewMode = "list";
let searchTimer = null;
let currentTaskId = null;
let allTasks = [];  // cached for Kanban

const CATEGORY_LABELS = {
  work: "עבודה", personal: "אישי", idea: "רעיון",
  reminder: "תזכורת", shopping: "קניות", health: "בריאות",
  finance: "כספים", other: "אחר",
};
const SOURCE_LABELS = { web: null, telegram: "Telegram", whatsapp: "WhatsApp" };

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  loadStats();
  document.getElementById("captureInput").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); captureTask(); }
  });
});

/* ===== View toggle ===== */
function setView(mode) {
  viewMode = mode;
  document.getElementById("btnList").classList.toggle("active", mode === "list");
  document.getElementById("btnKanban").classList.toggle("active", mode === "kanban");
  document.getElementById("filters").classList.toggle("hidden", mode === "kanban");
  document.getElementById("taskList").classList.toggle("hidden", mode === "kanban");
  document.getElementById("kanbanBoard").classList.toggle("hidden", mode === "list");
  if (mode === "kanban") renderKanban(allTasks);
}

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
    if (!res.ok) throw new Error();
    const task = await res.json();
    input.value = "";

    let msg = `נשמר: "${task.title}" | ${CATEGORY_LABELS[task.category] || task.category} | ${priorityLabel(task.priority)}`;
    if (task.due_date) msg += ` | ⏰ ${formatDue(task.due_date)}`;
    showCaptureResult(msg, "success");

    if (task.duplicate_warning) {
      const d = task.duplicate_warning;
      setTimeout(() => showCaptureResult(`⚠️ משימה דומה קיימת: #${d.id} "${d.title}"`, "warning"), 3500);
    }
    loadTasks();
    loadStats();
  } catch {
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
  setTimeout(() => el.classList.add("hidden"), 5000);
}

/* ===== Filters ===== */
function setFilter(type, value, btn) {
  if (filters[type] === value && value !== "") {
    filters[type] = "";
    document.querySelectorAll(`[data-filter="${type}"]`).forEach(b => b.classList.remove("active"));
  } else {
    filters[type] = value;
    document.querySelectorAll(`[data-filter="${type}"]`).forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
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
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.search) params.set("search", filters.search);

  try {
    const res = await fetch(`/api/tasks/?${params}`);
    allTasks = await res.json();
    if (viewMode === "list") renderList(allTasks);
    else renderKanban(allTasks);
  } catch {
    document.getElementById("taskList").innerHTML = '<div class="empty">שגיאה בטעינת משימות</div>';
  }
}

/* ===== List Render ===== */
function renderList(tasks) {
  const list = document.getElementById("taskList");
  if (!tasks.length) {
    list.innerHTML = '<div class="empty">אין משימות. כתוב משהו למעלה!</div>';
    return;
  }
  list.innerHTML = tasks.map(t => taskCardHtml(t, false)).join("");
}

/* ===== Kanban Render ===== */
function renderKanban(tasks) {
  const columns = { open: [], in_progress: [], done: [] };
  tasks.forEach(t => {
    if (columns[t.status] !== undefined) columns[t.status].push(t);
    // cancelled tasks are skipped in kanban
  });

  for (const [status, items] of Object.entries(columns)) {
    const body = document.getElementById(`cards-${status}`);
    const count = document.getElementById(`count${capitalize(status.replace("_", ""))}`);
    if (count) count.textContent = items.length;
    if (!body) continue;
    body.innerHTML = items.length
      ? items.map(t => taskCardHtml(t, true)).join("")
      : `<div class="empty" style="padding:20px;font-size:.85rem">אין</div>`;
  }

  // Update count IDs: open→countOpen, in_progress→countInProgress, done→countDone
  document.getElementById("countOpen").textContent = columns.open.length;
  document.getElementById("countInProgress").textContent = columns.in_progress.length;
  document.getElementById("countDone").textContent = columns.done.length;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function taskCardHtml(t, draggable) {
  const drag = draggable
    ? `draggable="true" ondragstart="onDragStart(event,${t.id})" ondragend="onDragEnd(event)"`
    : "";
  const doneClass = t.status === "done" ? "done-card" : "";
  const dueTag = t.due_date ? `<span class="tag tag-due ${isDueSoon(t.due_date) ? 'soon' : ''}">⏰ ${formatDue(t.due_date)}</span>` : "";
  const srcLabel = SOURCE_LABELS[t.source];
  const customTags = (t.tags || "").split(",").filter(Boolean)
    .map(tag => `<span class="tag tag-custom">${escHtml(tag.trim())}</span>`).join("");

  return `
    <div class="task-card ${doneClass}" ${drag} onclick="openModal(${t.id})">
      <div class="task-card-left">
        <div class="task-check ${t.status === 'done' ? 'checked' : ''}"
             onclick="event.stopPropagation();toggleDone(${t.id},'${t.status}')"
             title="סמן כהושלם"></div>
        <div class="priority-dot ${t.priority}"></div>
      </div>
      <div class="task-content">
        <div class="task-title">${escHtml(t.title)}</div>
        ${t.ai_summary ? `<div class="task-summary">${escHtml(t.ai_summary)}</div>` : ""}
        <div class="task-meta">
          <span class="tag tag-category">${CATEGORY_LABELS[t.category] || t.category}</span>
          ${srcLabel ? `<span class="tag tag-source">${srcLabel}</span>` : ""}
          ${dueTag}
          ${customTags}
          <span class="task-date">${formatDate(t.created_at)}</span>
        </div>
      </div>
    </div>`;
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

/* ===== Drag & Drop (Kanban) ===== */
function onDragStart(e, taskId) {
  e.dataTransfer.setData("text/plain", String(taskId));
  e.dataTransfer.effectAllowed = "move";
  setTimeout(() => e.target.classList.add("dragging"), 0);
}

function onDragEnd(e) {
  e.target.classList.remove("dragging");
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  e.currentTarget.classList.add("drag-over");
}

function onDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

async function onDrop(e, newStatus) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");
  const taskId = e.dataTransfer.getData("text/plain");
  if (!taskId) return;
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
  const res = await fetch(`/api/tasks/${taskId}`);
  const task = await res.json();

  document.getElementById("editId").value = task.id;
  document.getElementById("editTitle").value = task.title;
  document.getElementById("editDescription").value = task.description || "";
  document.getElementById("editStatus").value = task.status;
  document.getElementById("editPriority").value = task.priority;
  document.getElementById("editCategory").value = task.category;
  document.getElementById("editTags").value = task.tags || "";
  document.getElementById("editDueDate").value = task.due_date
    ? task.due_date.slice(0, 16)
    : "";
  document.getElementById("modalOverlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.add("hidden");
  currentTaskId = null;
}

async function saveTask() {
  if (!currentTaskId) return;
  const dueDateVal = document.getElementById("editDueDate").value;
  const data = {
    title: document.getElementById("editTitle").value.trim(),
    description: document.getElementById("editDescription").value.trim() || null,
    status: document.getElementById("editStatus").value,
    priority: document.getElementById("editPriority").value,
    category: document.getElementById("editCategory").value,
    tags: document.getElementById("editTags").value.trim() || null,
    due_date: dueDateVal ? new Date(dueDateVal).toISOString() : null,
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
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function formatDue(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = d - now;
  if (diff < 0) return `באיחור`;
  if (diff < 3600_000) return `בעוד ${Math.round(diff/60_000)} ד'`;
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === new Date(now.getTime()+86400_000).toDateString();
  const timeStr = d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `היום ${timeStr}`;
  if (isTomorrow) return `מחר ${timeStr}`;
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "short" }) + " " + timeStr;
}

function isDueSoon(iso) {
  const diff = new Date(iso) - new Date();
  return diff > 0 && diff < 3600_000;
}

function priorityLabel(p) {
  return { urgent: "דחוף", high: "גבוה", medium: "בינוני", low: "נמוך" }[p] || p;
}
