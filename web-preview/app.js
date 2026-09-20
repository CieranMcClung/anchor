const ENERGY_COPY = {
  GREEN: "Scheduled floats and the pool are all here.",
  AMBER: "Core anchors and lighter floats. The rest can wait.",
  RED: "Essentials only. That is plenty.",
};

const ANCHORS = [
  {
    id: 1,
    title: "Morning landing",
    clock: "08:00",
    minutes: 8 * 60,
    isCore: true,
    isSurvival: true,
    hint: "Feel both feet on the floor. Unclench your jaw if it is tight.",
  },
  {
    id: 2,
    title: "Work shift",
    clock: "09:00",
    minutes: 9 * 60,
    isCore: true,
    isSurvival: false,
    hint: "A slow stretch, then look at the first surface you will use.",
  },
  {
    id: 3,
    title: "Lunch",
    clock: "13:00",
    minutes: 13 * 60,
    isCore: true,
    isSurvival: true,
    hint: "Something to eat. Sitting down counts.",
  },
  {
    id: 4,
    title: "Wind-down",
    clock: "18:00",
    minutes: 18 * 60,
    isCore: false,
    isSurvival: false,
    hint: "Dim a light, or put a hand on your chest for two breaths.",
  },
];

const seedFloats = () => [
  { id: 1, title: "Drink a glass of water", note: "That’s a full step.", anchorId: 1, slot: "BEFORE", essential: true, light: true, high: false, status: "PENDING" },
  { id: 2, title: "Take morning meds, if you use them", note: "No rush. Log it in your own way.", anchorId: 1, slot: "BEFORE", essential: true, light: true, high: false, status: "PENDING" },
  { id: 3, title: "Put both feet on the floor", note: "Just that.", anchorId: 1, slot: "AFTER", essential: false, light: true, high: false, status: "PENDING" },
  { id: 4, title: "Open the laptop lid", note: "Opening it is enough to start.", anchorId: 2, slot: "BEFORE", essential: false, light: true, high: false, status: "PENDING" },
  { id: 5, title: "The one message that actually matters", note: "High-stakes, not urgent-red. Send or park — both are fine.", anchorId: 2, slot: "AFTER", essential: false, light: false, high: true, status: "PENDING" },
  { id: 6, title: "Tidy the desktop icons — optional", note: "Nice-to-have. Hidden when energy is lower.", anchorId: 2, slot: "AFTER", essential: false, light: false, high: false, status: "PENDING" },
  { id: 7, title: "Refill water on the way", note: "Between work and lunch. No clock on this.", anchorId: 2, slot: "BETWEEN", essential: true, light: true, high: false, status: "PENDING" },
  { id: 8, title: "Eat something with a bit of protein", note: "A snack counts.", anchorId: 3, slot: "BEFORE", essential: true, light: true, high: false, status: "PENDING" },
  { id: 9, title: "Step outside for a minute", note: "If you can. The doorway counts.", anchorId: 3, slot: "AFTER", essential: false, light: true, high: false, status: "PENDING" },
  { id: 10, title: "Plug in the phone", note: "A quiet close. Flow-only.", anchorId: 4, slot: "AFTER", essential: false, light: false, high: false, status: "PENDING" },
  { id: 11, title: "Sort the junk drawer", note: "In the pool. Not on a clock.", anchorId: null, slot: "POOL", essential: false, light: false, high: false, status: "PENDING" },
  { id: 12, title: "Text the dentist back", note: "High-consequence, no due-date shame. Whenever you can.", anchorId: null, slot: "POOL", essential: false, light: false, high: true, status: "PENDING" },
  { id: 13, title: "Lay out tomorrow’s clothes", note: "Optional. Skip without comment.", anchorId: null, slot: "POOL", essential: false, light: false, high: false, status: "PENDING" },
];

const state = {
  energy: "GREEN",
  floats: seedFloats(),
  focusedId: 1,
  selectedAnchorId: null,
  rampDismissed: false,
  nextId: 100,
};

const isOpen = (task) => task.status !== "DONE";
const isOnBoard = (task) => task.anchorId != null;
const isPool = (task) => task.anchorId == null || task.slot === "POOL";

function isTaskVisible(task) {
  if (!isOpen(task)) return false;
  if (state.energy === "GREEN") return true;
  if (state.energy === "AMBER") {
    const lightOrNeeded = task.light || task.essential || task.high;
    return (isOnBoard(task) && lightOrNeeded) || (isPool(task) && task.essential);
  }
  return task.essential || task.high;
}

function isAnchorVisible(anchor, children) {
  if (state.energy === "GREEN") return true;
  if (state.energy === "AMBER") return anchor.isCore || children.length > 0;
  return children.length > 0 || anchor.isSurvival;
}

function visibleFloats() {
  return state.floats.filter(isTaskVisible);
}

function focusedTask() {
  return visibleFloats().find((t) => t.id === state.focusedId) || visibleFloats()[0] || null;
}

function unstuckCopy(task) {
  const name = task?.title?.trim() || "";
  if (state.energy === "GREEN") {
    return {
      title: "One quiet start",
      body: name
        ? `Open “${name}” and stay with it for two minutes. Stopping is allowed.`
        : "Pick the nearest float and just open it. Two minutes is a full start.",
    };
  }
  if (state.energy === "AMBER") {
    return {
      title: "The lightest next step",
      body: name
        ? `You don’t have to finish “${name}”. Touch it once, or swap to something lighter.`
        : "Touch the next light float, or swap. Either is a complete move.",
    };
  }
  return {
    title: "Just this",
    body: task?.essential
      ? `Do “${name}” if you can. If not: sip water. That is the whole list.`
      : "Sip water, or eat a little something. Nothing else is required.",
  };
}

function smallerTitle(task) {
  const trimmed = task.title.trim();
  if (task.essential) return `Just the first sip or bite — “${trimmed}”`;
  if (trimmed.length <= 22) return `Open “${trimmed}” — one minute only`;
  return `Just open it: ${trimmed.slice(0, 28).trim()}…`;
}

function chipKind(task) {
  if (task.essential) return "essential";
  if (task.high) return "high";
  if (task.light) return "light";
  return "float";
}

function chipLabel(task) {
  if (task.essential) return "Essential";
  if (task.high) return "High-stakes";
  if (task.light) return "Light";
  return "Float";
}

function formatToday() {
  const formatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `Today · ${formatted}`;
}

function nearestAnchor() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return (
    ANCHORS.find((a) => a.minutes - minutes >= 1 && a.minutes - minutes <= 15) ||
    ANCHORS.find((a) => a.minutes > minutes) ||
    ANCHORS[0]
  );
}

function floatCard(task) {
  const kind = chipKind(task);
  const focused = focusedTask()?.id === task.id;
  return `
    <article class="float ${focused ? "is-focused" : ""}" data-task="${task.id}">
      <div class="chip-row">
        <span class="chip ${kind}"></span>
        <span class="meta ${kind}">${chipLabel(task)}</span>
        ${task.status === "IN_PROGRESS" ? '<span class="in-hand">In hand</span>' : ""}
      </div>
      <h3>${escapeHtml(task.title)}</h3>
      ${task.note ? `<p class="note">${escapeHtml(task.note)}</p>` : ""}
      <div class="row-actions">
        <button type="button" data-hold="${task.id}">Hold</button>
        <button type="button" data-done="${task.id}">Done</button>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderBoard() {
  const board = document.getElementById("board");
  const visible = visibleFloats();
  const sections = [];

  ANCHORS.forEach((anchor) => {
    const children = visible.filter((t) => t.anchorId === anchor.id && t.slot !== "POOL");
    if (!isAnchorVisible(anchor, children)) return;
    const before = children.filter((t) => t.slot === "BEFORE");
    const between = children.filter((t) => t.slot === "BETWEEN");
    const after = children.filter((t) => t.slot === "AFTER");
    const selected = state.selectedAnchorId === anchor.id;
    sections.push(`
      <section class="anchor ${selected ? "is-selected" : ""}">
        <button type="button" class="anchor-head" data-anchor="${anchor.id}">
          <span class="dot"></span>
          <span>
            <span class="clock">${anchor.clock}</span>
            <span class="anchor-title">${escapeHtml(anchor.title)}</span>
          </span>
        </button>
        ${before.length ? `<p class="slot">Before</p>${before.map(floatCard).join("")}` : ""}
        ${between.length ? `<p class="slot">Between</p>${between.map(floatCard).join("")}` : ""}
        ${after.length ? `<p class="slot">After</p>${after.map(floatCard).join("")}` : ""}
        ${children.length === 0 ? `<p class="quiet">No floats here. The milestone still stands.</p>` : ""}
      </section>
    `);
  });

  const pool = visible.filter(isPool);
  if (pool.length) {
    sections.push(`
      <div class="pool-head">
        <h2>Pool</h2>
        <p>No clock. Pick one if it helps — or leave it.</p>
      </div>
      ${pool.map(floatCard).join("")}
    `);
  }

  if (!sections.length) {
    const empty = {
      GREEN: "Nothing on the board. That’s fine. Add something when you’re ready, or leave it quiet.",
      AMBER: "Maintenance pace. If the board is empty, you can rest here.",
      RED: "No essentials right now. That’s okay.",
    };
    sections.push(`<p class="empty">${empty[state.energy]}</p>`);
  }

  board.innerHTML = sections.join("");
}

function renderRamp() {
  const ramp = document.getElementById("ramp");
  if (state.rampDismissed) {
    ramp.hidden = true;
    return;
  }
  const anchor = nearestAnchor();
  document.getElementById("ramp-title").textContent = `${anchor.clock}  ·  ${anchor.title}`;
  document.getElementById("ramp-body").textContent = `${anchor.title} is nearby. ${anchor.hint}`;
  ramp.hidden = false;
}

function render() {
  document.getElementById("today-label").textContent = formatToday();
  document.getElementById("energy-copy").textContent = ENERGY_COPY[state.energy];
  document.querySelectorAll(".seg").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.energy === state.energy);
    btn.setAttribute("aria-selected", btn.dataset.energy === state.energy ? "true" : "false");
  });
  renderRamp();
  renderBoard();
}

function openUnstuck() {
  const task = focusedTask();
  if (task) state.focusedId = task.id;
  const copy = unstuckCopy(task);
  const overlay = document.getElementById("overlay");
  document.getElementById("unstuck-kicker").className = `label kicker-${state.energy === "GREEN" ? "flow" : state.energy === "AMBER" ? "amber" : "red"}`;
  document.getElementById("unstuck-title").textContent = copy.title;
  document.getElementById("unstuck-body").textContent = copy.body;
  document.getElementById("unstuck-holding").textContent = task ? `Holding: ${task.title}` : "";
  overlay.hidden = false;
  document.getElementById("unstuck-open").hidden = true;
}

function closeUnstuck() {
  document.getElementById("overlay").hidden = true;
  document.getElementById("unstuck-open").hidden = false;
}

function completeTask(id) {
  const task = state.floats.find((t) => t.id === id);
  if (!task) return;
  task.status = "DONE";
  const next = visibleFloats()[0];
  state.focusedId = next?.id ?? null;
  closeUnstuck();
  render();
}

function holdTask(id) {
  state.floats.forEach((t) => {
    if (t.status === "IN_PROGRESS") t.status = "PENDING";
  });
  const task = state.floats.find((t) => t.id === id);
  if (!task) return;
  task.status = "IN_PROGRESS";
  state.focusedId = id;
  render();
}

function breakSmaller() {
  const task = focusedTask();
  if (!task) return;
  const micro = {
    id: state.nextId++,
    title: smallerTitle(task),
    note: "A smaller piece. Stopping is allowed.",
    anchorId: task.anchorId,
    slot: task.slot,
    essential: task.essential,
    light: true,
    high: false,
    status: "PENDING",
  };
  const index = state.floats.indexOf(task);
  state.floats.splice(index, 0, micro);
  state.focusedId = micro.id;
  closeUnstuck();
  render();
}

function swapTask() {
  const visible = visibleFloats();
  const current = focusedTask();
  if (!current || visible.length < 2) return;
  const index = visible.findIndex((t) => t.id === current.id);
  const next = visible[(index + 1) % visible.length];
  if (current.status === "IN_PROGRESS") current.status = "PENDING";
  next.status = "IN_PROGRESS";
  state.focusedId = next.id;
  openUnstuck();
  render();
}

document.querySelector(".dial-row").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-energy]");
  if (!btn) return;
  state.energy = btn.dataset.energy;
  const still = focusedTask();
  state.focusedId = still?.id ?? null;
  render();
});

document.getElementById("board").addEventListener("click", (event) => {
  const done = event.target.closest("[data-done]");
  const hold = event.target.closest("[data-hold]");
  const anchor = event.target.closest("[data-anchor]");
  const card = event.target.closest("[data-task]");
  if (done) {
    completeTask(Number(done.dataset.done));
    return;
  }
  if (hold) {
    holdTask(Number(hold.dataset.hold));
    return;
  }
  if (anchor) {
    const id = Number(anchor.dataset.anchor);
    state.selectedAnchorId = state.selectedAnchorId === id ? null : id;
    render();
    return;
  }
  if (card) {
    state.focusedId = Number(card.dataset.task);
    render();
  }
});

document.getElementById("unstuck-open").addEventListener("click", openUnstuck);
document.getElementById("unstuck-dismiss").addEventListener("click", closeUnstuck);
document.getElementById("break-smaller").addEventListener("click", breakSmaller);
document.getElementById("swap-task").addEventListener("click", swapTask);
document.getElementById("done-next").addEventListener("click", () => {
  const task = focusedTask();
  if (task) completeTask(task.id);
});
document.getElementById("ramp-dismiss").addEventListener("click", () => {
  state.rampDismissed = true;
  render();
});

render();
