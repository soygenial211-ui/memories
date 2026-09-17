// ⚠️ Pega aquí la URL de tu Apps Script (termina en /exec)
const API_URL = "https://script.google.com/macros/s/AKfycbx0w9ugl_De3p81E6l1NnOsRxUfiLU8EF0i0Z1SRvg1Ubs8fYiB8d5Fy6Qk5cmjOC70/exec";

let lugares = [];
let recuerdos = [];
let currentLock = null; // { kind: 'lugar'|'recuerdo', item }

const ICONS = { locked: "🔒", unlocked: "✓", unknown: "?", complete: "✪" };

// ---------- Navegación entre pantallas ----------
function mostrarPantalla(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// ---------- Modal de carga / error ----------
function mostrarCargando(activo) {
  if (activo) {
    document.getElementById("modal-loading").classList.remove("hidden");
  } else {
    document.getElementById("modal-loading").classList.add("hidden");
  }
}

function mostrarError(mensaje) {
  document.getElementById("error-text").textContent = mensaje;
  document.getElementById("modal-error").classList.remove("hidden");
}

// ---------- Bienvenida ----------
function entrarAApp() {
  document.getElementById("welcome-text").textContent = (typeof BIENVENIDA_TEXTO !== "undefined" ? BIENVENIDA_TEXTO : "").trim();
  mostrarPantalla("screen-welcome");
}

document.getElementById("btnRecordar").addEventListener("click", () => {
  mostrarPantalla("screen-map");
  document.getElementById("pathNodes").innerHTML = `
    <div class="path-loading">
      <div class="spinner"></div>
      <p class="loading-text">Cargando recuerdos...</p>
    </div>`;
  cargarDatos();
});

document.getElementById("btnInfo").addEventListener("click", () => {
  mostrarPantalla("screen-welcome");
});

document.getElementById("btnBackMap").addEventListener("click", () => {
  mostrarPantalla("screen-map");
});

// ---------- Datos ----------
async function cargarDatos() {
  const nodesEl = document.getElementById("pathNodes");
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    lugares = data.lugares || [];
    recuerdos = data.recuerdos || [];
  } catch (err) {
    console.error(err);
    nodesEl.innerHTML = `<p style="color:#C97A6B;padding:20px;text-align:center">No se pudo cargar el camino. Revisa tu conexión.</p>`;
    return;
  }
  dibujarPines();
}

function estaDesbloqueado(item) {
  return String(item.desbloqueado).toUpperCase() === "TRUE";
}

function fechaYaListo(item) {
  if (item.tipo === "fecha" || item.tipo === "ambos") {
    return new Date() >= new Date(item.fechaObjetivo);
  }
  return true;
}

function lugarCompleto(lugar) {
  const propios = recuerdos.filter((r) => r.lugarId === lugar.id && r.tipo !== "desconocido");
  if (propios.length === 0) return false;
  return propios.every((r) => estaDesbloqueado(r));
}

function iconoDe(item, esLugarCompleto) {
  if (item.tipo === "desconocido") return ICONS.unknown;
  if (esLugarCompleto) return ICONS.complete;
  if (estaDesbloqueado(item)) return ICONS.unlocked;
  return ICONS.locked;
}

// ---------- Camino de lugares (zigzag) ----------
function dibujarPines() {
  const nodesEl = document.getElementById("pathNodes");
  nodesEl.innerHTML = "";

  const ordenados = [...lugares].sort((a, b) => Number(a.orden) - Number(b.orden));

  ordenados.forEach((l, i) => {
    const row = document.createElement("div");
    const lado = i % 2 === 0 ? "left" : "right";
    row.className = `node-row ${lado}`;

    const card = document.createElement("div");
    card.className = "node-card";

    if (l.tipo === "desconocido") {
      card.classList.add("unknown");
      card.innerHTML = `<div class="node-icon">${ICONS.unknown}</div><div class="node-name">${l.textoDesconocido || "Aún un misterio..."}</div>`;
    } else {
      const desbloqueado = estaDesbloqueado(l);
      const completo = desbloqueado && lugarCompleto(l);
      card.classList.add(completo ? "complete" : (desbloqueado ? "unlocked" : (fechaYaListo(l) ? "ready" : "locked")));
      card.innerHTML = `<div class="node-icon">${iconoDe(l, completo)}</div><div class="node-name">${l.nombre}</div>`;
      card.addEventListener("click", () => onLugarClick(l, desbloqueado));
    }

    const dot = document.createElement("div");
    dot.className = "node-dot";
    card.appendChild(dot);

    row.appendChild(card);
    nodesEl.appendChild(row);
  });
}

function onLugarClick(lugar, desbloqueado) {
  if (desbloqueado) {
    abrirLugar(lugar);
    return;
  }
  if (lugar.tipo === "ninguno") {
    intentarDesbloquear("lugar", lugar.id, null, () => {
      lugar.desbloqueado = "TRUE";
      dibujarPines();
      abrirLugar(lugar);
    });
    return;
  }
  abrirCandado("lugar", lugar);
}

// ---------- Candado genérico (lugar o recuerdo) ----------
function abrirCandado(kind, item) {
  currentLock = { kind, item };
  document.getElementById("lock-title").textContent = item.titulo || item.nombre;

  const dateBlock = document.getElementById("lock-date-block");
  const passBlock = document.getElementById("lock-password-block");
  const necesitaFechaPrimero = (item.tipo === "fecha" || item.tipo === "ambos") && !fechaYaListo(item);

  if (necesitaFechaPrimero) {
    dateBlock.classList.remove("hidden");
    passBlock.classList.add("hidden");
    document.getElementById("lock-date-hint").textContent = item.pistaFecha || "Todavía no se abre.";
  } else {
    dateBlock.classList.add("hidden");
    passBlock.classList.remove("hidden");
    document.getElementById("lock-pass-hint").textContent = item.pistaPassword || "Necesitas la contraseña.";
    const input = document.getElementById("lock-pass-input");
    input.value = "";
    setTimeout(() => input.focus(), 150);
  }
  document.getElementById("modal-lock").classList.remove("hidden");
}

// Normaliza en automático: quita todos los espacios y pasa a mayúsculas
const lockPassInput = document.getElementById("lock-pass-input");
lockPassInput.addEventListener("input", () => {
  const cursorAlFinal = lockPassInput.selectionStart === lockPassInput.value.length;
  const limpio = lockPassInput.value.replace(/\s+/g, "").toUpperCase();
  if (limpio !== lockPassInput.value) {
    lockPassInput.value = limpio;
    if (cursorAlFinal) {
      lockPassInput.selectionStart = lockPassInput.selectionEnd = limpio.length;
    }
  }
});
lockPassInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("lockSubmit").click();
});

document.getElementById("lockSubmit").addEventListener("click", () => {
  if (!currentLock) return;
  const { kind, item } = currentLock;
  const password = document.getElementById("lock-pass-input").value.trim().toUpperCase();

  intentarDesbloquear(kind, item.id, password, () => {
    item.desbloqueado = "TRUE";
    cerrarModal("modal-lock");
    if (kind === "lugar") {
      dibujarPines();
      abrirLugar(item);
    } else {
      dibujarGridLugarActual();
      abrirVista(item);
    }
  }, () => {
    mostrarError("Esa contraseña no es correcta. Intenta de nuevo.");
  });
});

async function intentarDesbloquear(kind, id, password, onOk, onFail) {
  mostrarCargando(true);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ kind, id, password }),
    });
    const data = await res.json();
    mostrarCargando(false);
    if (data.ok) {
      onOk();
    } else if (onFail) {
      onFail();
    }
  } catch (err) {
    console.error(err);
    mostrarCargando(false);
    mostrarError("Hubo un problema de conexión. Intenta de nuevo.");
  }
}

// ---------- Pantalla de lugar (cuadrícula completa) ----------
let lugarActualId = null;

function abrirLugar(lugar) {
  lugarActualId = lugar.id;
  document.getElementById("place-grid-title").textContent = lugar.nombre;
  mostrarPantalla("screen-place");
  dibujarGridLugarActual();
}

function dibujarGridLugarActual() {
  const lugar = lugares.find((l) => l.id === lugarActualId);
  if (!lugar) return;
  const gridEl = document.getElementById("place-grid");
  gridEl.innerHTML = "";

  const propios = recuerdos
    .filter((r) => r.lugarId === lugar.id)
    .sort((a, b) => Number(a.orden) - Number(b.orden));

  if (propios.length === 0) {
    gridEl.innerHTML = `<p style="color:var(--text-dim)">Aún no hay recuerdos aquí.</p>`;
    return;
  }

  propios.forEach((r) => {
    const tile = document.createElement("div");
    const desbloqueado = estaDesbloqueado(r);
    tile.className = "tile " + (r.tipo === "desconocido" ? "" : (desbloqueado ? "unlocked" : (fechaYaListo(r) ? "ready" : "locked")));

    const icon = document.createElement("div");
    icon.className = "icon";
    icon.textContent = iconoDe(r, false);
    tile.appendChild(icon);

    if (r.tipo === "desconocido") {
      tile.title = r.textoDesconocido || "Aún un misterio...";
    }

    if (r.tipo !== "desconocido") {
      tile.addEventListener("click", () => onRecuerdoClick(r));
    }
    gridEl.appendChild(tile);
  });
}

function onRecuerdoClick(r) {
  const desbloqueado = estaDesbloqueado(r);
  if (desbloqueado) {
    abrirVista(r);
    return;
  }
  if (!r.tipo || r.tipo === "ninguno") {
    intentarDesbloquear("recuerdo", r.id, null, () => {
      r.desbloqueado = "TRUE";
      dibujarGridLugarActual();
      abrirVista(r);
    });
    return;
  }
  abrirCandado("recuerdo", r);
}

// ---------- Vista de recuerdo + animación ----------
function abrirVista(r) {
  document.getElementById("view-img").src = r.imagenUrl;
  document.getElementById("view-img").alt = r.titulo;
  document.getElementById("view-text").textContent = r.texto;

  const card = document.getElementById("view-card");
  card.className = "modal-card";
  if (r.animacion) card.classList.add(`anim-${r.animacion}`);

  document.getElementById("modal-view").classList.remove("hidden");
  lanzarParticulas(r.animacion);
}

const PARTICLE_SETS = {
  "confetti-dorado": { emojis: ["✦", "✧", "●"], behavior: "fall", count: 26 },
  "corazones-flotantes": { emojis: ["💛", "💕", "💗"], behavior: "rise", count: 20 },
  "burbujas": { emojis: ["○", "◌"], behavior: "rise", count: 18 },
  "mariposas": { emojis: ["🦋"], behavior: "drift", count: 8 },
  "chispas-picantes": { emojis: ["🔥", "✨"], behavior: "burst", count: 22 },
};

function lanzarParticulas(animKey) {
  const set = PARTICLE_SETS[animKey];
  if (!set) return;
  const layer = document.getElementById("particle-layer");
  for (let i = 0; i < set.count; i++) {
    const span = document.createElement("span");
    span.className = `particle ${set.behavior}`;
    span.textContent = set.emojis[Math.floor(Math.random() * set.emojis.length)];
    const duration = 1.6 + Math.random() * 1.8;
    span.style.animationDuration = `${duration}s`;
    span.style.animationDelay = `${Math.random() * 0.5}s`;

    if (set.behavior === "fall" || set.behavior === "rise") {
      span.style.left = `${Math.random() * 100}%`;
      span.style.fontSize = `${1 + Math.random() * 0.8}rem`;
    } else if (set.behavior === "drift") {
      span.style.left = `${10 + Math.random() * 80}%`;
      span.style.fontSize = `${1.2 + Math.random() * 0.6}rem`;
    } else if (set.behavior === "burst") {
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 140;
      span.style.setProperty("--bx", `${Math.cos(angle) * dist}px`);
      span.style.setProperty("--by", `${Math.sin(angle) * dist}px`);
      span.style.fontSize = `${1 + Math.random() * 0.7}rem`;
    }
    layer.appendChild(span);
    setTimeout(() => span.remove(), (duration + 0.6) * 1000);
  }
}

// ---------- Cierre de modales ----------
function cerrarModal(id) {
  document.getElementById(id).classList.add("hidden");
}
document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => cerrarModal(btn.dataset.close));
});

// ---------- Arranque ----------
entrarAApp();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
