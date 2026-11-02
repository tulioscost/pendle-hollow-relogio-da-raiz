const MODULE_ID = "pendle-hollow-final-clock";
const SOCKET = `module.${MODULE_ID}`;

const WEEKDAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo"
];

const DEFAULT_STATE = Object.freeze({
  weekday: "Quinta-feira",
  stayDay: 4,
  hour: 8,
  minute: 0
});

let currentState = { ...DEFAULT_STATE };

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | inicializando`);

  game.settings.register(MODULE_ID, "clockStateJson", {
    name: "Estado do Relógio de Pendle Hollow",
    hint: "Estado sincronizado do relógio diegético. A edição normal é feita diretamente no relógio pelo GM.",
    scope: "world",
    config: false,
    type: String,
    default: JSON.stringify(DEFAULT_STATE),
    onChange: value => {
      currentState = parseStoredState(value);
      renderState(currentState);
    }
  });
});

Hooks.once("ready", async () => {
  currentState = parseStoredState(game.settings.get(MODULE_ID, "clockStateJson"));
  injectClock();
  renderState(currentState);

  game.socket?.on(SOCKET, payload => {
    if (!payload || payload.type !== "clockState") return;
    currentState = sanitizeState(payload.state);
    renderState(currentState);
  });

  const mod = game.modules.get(MODULE_ID);
  if (mod) {
    mod.api = {
      getState: () => ({ ...currentState }),
      setState: async state => {
        if (!game.user?.isGM) throw new Error("Apenas o GM pode alterar o Relógio da Raiz.");
        return persistState({ ...currentState, ...state });
      },
      setTime: async (hour, minute = 0) => {
        if (!game.user?.isGM) throw new Error("Apenas o GM pode alterar o Relógio da Raiz.");
        return persistState({ ...currentState, hour, minute });
      },
      setDay: async (stayDay, weekday = currentState.weekday) => {
        if (!game.user?.isGM) throw new Error("Apenas o GM pode alterar o Relógio da Raiz.");
        return persistState({ ...currentState, stayDay, weekday });
      }
    };
  }
});

function parseStoredState(value) {
  if (typeof value === "string") {
    try {
      return sanitizeState(JSON.parse(value));
    } catch (err) {
      console.warn(`${MODULE_ID} | estado salvo inválido; usando padrão`, err);
      return { ...DEFAULT_STATE };
    }
  }
  return sanitizeState(value);
}

function sanitizeState(value = {}) {
  let weekday = WEEKDAYS.includes(value.weekday) ? value.weekday : DEFAULT_STATE.weekday;
  let stayDay = Number.parseInt(value.stayDay ?? DEFAULT_STATE.stayDay, 10);
  let hour = Number.parseInt(value.hour ?? DEFAULT_STATE.hour, 10);
  let minute = Number.parseInt(value.minute ?? DEFAULT_STATE.minute, 10);

  if (!Number.isFinite(stayDay)) stayDay = DEFAULT_STATE.stayDay;
  if (!Number.isFinite(hour)) hour = DEFAULT_STATE.hour;
  if (!Number.isFinite(minute)) minute = DEFAULT_STATE.minute;

  stayDay = Math.min(6, Math.max(1, stayDay));
  hour = ((hour % 24) + 24) % 24;
  minute = ((minute % 60) + 60) % 60;

  return { weekday, stayDay, hour, minute };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function injectClock() {
  document.getElementById("ph-root-clock")?.remove();

  const root = document.createElement("section");
  root.id = "ph-root-clock";
  root.className = game.user?.isGM ? "ph-clock ph-is-gm" : "ph-clock";
  root.setAttribute("aria-label", "Relógio de Pendle Hollow");

  root.innerHTML = `
    <div class="ph-branch ph-branch-left" aria-hidden="true"></div>
    <div class="ph-branch ph-branch-right" aria-hidden="true"></div>
    <div class="ph-bone ph-bone-left" aria-hidden="true"></div>
    <div class="ph-bone ph-bone-right" aria-hidden="true"></div>

    <div class="ph-clock-inner">
      <div class="ph-drag-handle" title="Arraste para reposicionar">
        <span class="ph-knot"></span>
        <span class="ph-town">PENDLE HOLLOW</span>
        <span class="ph-knot"></span>
      </div>

      <div class="ph-weekday" data-ph="weekday">QUINTA-FEIRA</div>
      <div class="ph-time" data-ph="time">08:00</div>
      <div class="ph-day-row">
        <span class="ph-day-name" data-ph="day-name">QUARTO DIA</span>
        <span class="ph-day-count" data-ph="day-count">4 / 6</span>
      </div>
      <div class="ph-countdown" data-ph="countdown">A FESTA EM 2 DIAS</div>

      ${game.user?.isGM ? `
        <button class="ph-control-toggle" type="button" title="Controles do Guardião" aria-label="Abrir controles do Guardião">
          <i class="fa-solid fa-skull"></i>
        </button>
      ` : ""}
    </div>

    ${game.user?.isGM ? buildControlsHtml() : ""}
  `;

  document.body.appendChild(root);
  restorePosition(root);
  enableDragging(root);

  if (game.user?.isGM) bindGMControls(root);
}

function buildControlsHtml() {
  const weekdayOptions = WEEKDAYS.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join("");

  return `
    <div class="ph-gm-controls" hidden>
      <div class="ph-controls-title">
        <i class="fa-solid fa-key"></i>
        CONTROLE DO GUARDIÃO
      </div>

      <div class="ph-control-grid">
        <label>
          <span>Dia da semana</span>
          <select data-control="weekday">${weekdayOptions}</select>
        </label>

        <label>
          <span>Dia da estadia</span>
          <select data-control="stayDay">
            <option value="1">Dia 1</option>
            <option value="2">Dia 2</option>
            <option value="3">Dia 3</option>
            <option value="4">Dia 4</option>
            <option value="5">Dia 5</option>
            <option value="6">Dia 6 — Festa</option>
          </select>
        </label>

        <label class="ph-time-input-label">
          <span>Horário</span>
          <input data-control="time" type="time" step="60" value="08:00">
        </label>
      </div>

      <div class="ph-quick-controls">
        <button type="button" data-step="-1440"><i class="fa-solid fa-backward-step"></i> 1 dia</button>
        <button type="button" data-step="-60">−1h</button>
        <button type="button" data-step="-10">−10m</button>
        <button type="button" data-step="10">+10m</button>
        <button type="button" data-step="60">+1h</button>
        <button type="button" data-step="1440">1 dia <i class="fa-solid fa-forward-step"></i></button>
      </div>

      <div class="ph-control-actions">
        <button type="button" class="ph-save" data-action="save">
          <i class="fa-solid fa-floppy-disk"></i> ATUALIZAR PARA TODOS
        </button>
        <button type="button" class="ph-reset" data-action="reset" title="Voltar para Dia 4, quinta-feira, 08:00">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
      </div>

      <div class="ph-gm-note">As alterações são persistidas no mundo e sincronizadas imediatamente com os jogadores conectados.</div>
    </div>
  `;
}

function bindGMControls(root) {
  const panel = root.querySelector(".ph-gm-controls");
  const toggle = root.querySelector(".ph-control-toggle");

  toggle?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    panel.hidden = !panel.hidden;
    toggle.classList.toggle("active", !panel.hidden);
    syncControlInputs(root, currentState);
  });

  root.querySelectorAll("[data-step]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      const delta = Number.parseInt(button.dataset.step, 10) || 0;
      await advanceMinutes(delta);
      syncControlInputs(root, currentState);
    });
  });

  root.querySelector('[data-action="save"]')?.addEventListener("click", async event => {
    event.preventDefault();

    const weekday = root.querySelector('[data-control="weekday"]')?.value;
    const stayDay = Number.parseInt(root.querySelector('[data-control="stayDay"]')?.value, 10);
    const rawTime = root.querySelector('[data-control="time"]')?.value || "08:00";
    const [hour, minute] = rawTime.split(":").map(n => Number.parseInt(n, 10));

    await persistState({ weekday, stayDay, hour, minute });
    ui.notifications?.info("Pendle Hollow: relógio atualizado para todos os jogadores.");
  });

  root.querySelector('[data-action="reset"]')?.addEventListener("click", async event => {
    event.preventDefault();
    await persistState({ ...DEFAULT_STATE });
    syncControlInputs(root, currentState);
    ui.notifications?.warn("Pendle Hollow: relógio restaurado para o início do Dia 4.");
  });

  syncControlInputs(root, currentState);
}

function syncControlInputs(root, state) {
  const weekday = root.querySelector('[data-control="weekday"]');
  const stayDay = root.querySelector('[data-control="stayDay"]');
  const time = root.querySelector('[data-control="time"]');

  if (weekday) weekday.value = state.weekday;
  if (stayDay) stayDay.value = String(state.stayDay);
  if (time) time.value = `${pad(state.hour)}:${pad(state.minute)}`;
}

async function advanceMinutes(delta) {
  if (!game.user?.isGM) return;

  let total = currentState.hour * 60 + currentState.minute + delta;
  let dayShift = 0;

  while (total < 0) {
    total += 1440;
    dayShift -= 1;
  }
  while (total >= 1440) {
    total -= 1440;
    dayShift += 1;
  }

  let stayDay = currentState.stayDay;
  let weekday = currentState.weekday;

  if (dayShift !== 0) {
    const oldIndex = Math.max(0, WEEKDAYS.indexOf(weekday));
    const targetDay = Math.min(6, Math.max(1, stayDay + dayShift));
    const appliedShift = targetDay - stayDay;
    stayDay = targetDay;
    weekday = WEEKDAYS[(oldIndex + appliedShift + WEEKDAYS.length * 8) % WEEKDAYS.length];
  }

  await persistState({
    weekday,
    stayDay,
    hour: Math.floor(total / 60),
    minute: total % 60
  });
}

async function persistState(nextState) {
  if (!game.user?.isGM) return;

  const state = sanitizeState(nextState);
  currentState = state;
  renderState(state);

  await game.settings.set(MODULE_ID, "clockStateJson", JSON.stringify(state));
  game.socket?.emit(SOCKET, { type: "clockState", state });
  return { ...state };
}

function renderState(state) {
  const root = document.getElementById("ph-root-clock");
  if (!root) return;

  currentState = sanitizeState(state);

  root.dataset.day = String(currentState.stayDay);
  root.classList.toggle("ph-day-five", currentState.stayDay === 5);
  root.classList.toggle("ph-day-six", currentState.stayDay >= 6);

  setText(root, "weekday", currentState.weekday.toUpperCase());
  setText(root, "time", `${pad(currentState.hour)}:${pad(currentState.minute)}`);
  setText(root, "day-name", dayName(currentState.stayDay));
  setText(root, "day-count", `${currentState.stayDay} / 6`);
  setText(root, "countdown", countdownText(currentState.stayDay));

  if (game.user?.isGM) syncControlInputs(root, currentState);
}

function setText(root, key, value) {
  const element = root.querySelector(`[data-ph="${key}"]`);
  if (element) element.textContent = value;
}

function dayName(day) {
  const names = ["PRIMEIRO DIA", "SEGUNDO DIA", "TERCEIRO DIA", "QUARTO DIA", "QUINTO DIA", "SEXTO DIA"];
  return names[Math.max(0, Math.min(5, day - 1))];
}

function countdownText(day) {
  const remaining = Math.max(0, 6 - day);
  if (remaining === 0) return "A FESTA É HOJE";
  if (remaining === 1) return "A FESTA É AMANHÃ";
  return `A FESTA EM ${remaining} DIAS`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function enableDragging(root) {
  const handle = root.querySelector(".ph-drag-handle");
  if (!handle) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    dragging = true;
    const rect = root.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    handle.setPointerCapture?.(event.pointerId);
    root.classList.add("ph-dragging");
  });

  handle.addEventListener("pointermove", event => {
    if (!dragging) return;

    const maxX = Math.max(8, window.innerWidth - root.offsetWidth - 8);
    const maxY = Math.max(8, window.innerHeight - root.offsetHeight - 8);
    const left = Math.min(maxX, Math.max(8, event.clientX - offsetX));
    const top = Math.min(maxY, Math.max(8, event.clientY - offsetY));

    root.style.left = `${left}px`;
    root.style.top = `${top}px`;
    root.style.right = "auto";
    root.style.transform = "none";
  });

  const finish = event => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove("ph-dragging");
    handle.releasePointerCapture?.(event.pointerId);
    savePosition(root);
  };

  handle.addEventListener("pointerup", finish);
  handle.addEventListener("pointercancel", finish);
}

function savePosition(root) {
  const rect = root.getBoundingClientRect();
  try {
    localStorage.setItem(`${MODULE_ID}.position`, JSON.stringify({ left: rect.left, top: rect.top }));
  } catch (err) {
    console.warn(`${MODULE_ID} | não foi possível salvar posição`, err);
  }
}

function restorePosition(root) {
  try {
    const raw = localStorage.getItem(`${MODULE_ID}.position`);
    if (!raw) return;
    const pos = JSON.parse(raw);
    if (!Number.isFinite(pos.left) || !Number.isFinite(pos.top)) return;

    const left = Math.min(Math.max(8, pos.left), Math.max(8, window.innerWidth - 320));
    const top = Math.min(Math.max(8, pos.top), Math.max(8, window.innerHeight - 180));

    root.style.left = `${left}px`;
    root.style.top = `${top}px`;
    root.style.right = "auto";
    root.style.transform = "none";
  } catch (err) {
    console.warn(`${MODULE_ID} | posição salva inválida`, err);
  }
}
