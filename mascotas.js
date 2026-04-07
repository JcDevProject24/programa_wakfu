
// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const RECOLECCION = [
  { nombre: "Geist", stats: { "Campesino %": 50 }, tipo: "Recolección", alternativas: [] },
  { nombre: "Noxina", stats: { "Campesino %": 25, "Leñador %": 25, "Herbolario %": 25, "Minero %": 25, "Peletero %": 25, "Pescador %": 25 }, tipo: "Recolección", alternativas: [] },
  { nombre: "Snoofle", stats: { "Minero %": 50 }, tipo: "Recolección", alternativas: [] },
  { nombre: "Prespicar", stats: { "Leñador %": 50 }, tipo: "Recolección", alternativas: [] },
  { nombre: "Sako", stats: { "Herbolario %": 50 }, tipo: "Recolección", alternativas: [] },
  { nombre: "Jamajam", stats: { "Peletero %": 50 }, tipo: "Recolección", alternativas: [] },
  { nombre: "Kalipsor", stats: { "Pescador %": 50 }, tipo: "Recolección", alternativas: [] },
];

// Optimal combat pets (after dominance filtering, Jalrogín corrected, "de oro" corrected)
// Optimal combat pets — dominance with soft PdV (≤30 diff ignored), Jalrogín & "de oro" corrected
const OPTIMAS = [
  { nombre: "Miaumiau atigrado", stats: { "PdV": 180 }, tipo: "Supervivencia", alternativas: [] },
  { nombre: "Arakna", stats: { "PdV": 30, "Armadura %": 10 }, tipo: "Defensa", alternativas: [] },
  { nombre: "Cangrobot", stats: { "PdV": 30, "Dom. elemental": 30, "Res. elemental": 15 }, tipo: "Elemental", alternativas: ["Gongón comedido", "Wauwau"] },
  { nombre: "Escaramosca", stats: { "Dom. fuego": 106 }, tipo: "Elemental", alternativas: ["Krosmunster de fuego", "Horno"] },
  { nombre: "Crum", stats: { "PdV": 30, "Res. elemental": 20, "Golpe crít. %": 3 }, tipo: "Defensa", alternativas: [] },
  { nombre: "Miaumiau de oro", stats: { "PdV": 30, "Iniciativa": 20, "Dom. agua": 62, "Dom. tierra": 62 }, tipo: "Elemental", alternativas: [] },
  { nombre: "Calabazado", stats: { "PdV": 30, "Dom. elemental": 60 }, tipo: "Elemental", alternativas: ["Tofu", "Miaumiau comedido", "Yugofu, el Tofugo", "Fénix", "Papagucán", "Miaumiau bontariano"] },
  { nombre: "Tofu bontariano", stats: { "Dom. cura": 100, "Golpe crít. %": 3 }, tipo: "Cura", alternativas: ["Dragunga loragrán"] },
  { nombre: "Bun tripudo", stats: { "PdV": 60, "Res. aire": 50 }, tipo: "Defensa", alternativas: ["Rafal"] },
  { nombre: "Bun brakmariano", stats: { "PdV": 60, "Res. fuego": 50 }, tipo: "Defensa", alternativas: ["Salar"] },
  { nombre: "Jalrogín", stats: { "PdV": 40, "Res. fuego": 30, "Res. tierra": 30, "Res. aire": 30 }, tipo: "Defensa", alternativas: [] },
  { nombre: "Borrasca", stats: { "Dom. aire": 106 }, tipo: "Elemental", alternativas: ["Krosmunster de aire", "Jabatillo"] },
  { nombre: "Miaumiau angora", stats: { "PdV": 90, "Iniciativa": 60 }, tipo: "Supervivencia", alternativas: [] },
  { nombre: "Miaumiau de las nieves", stats: { "PdV": 60, "Dom. cura": 100 }, tipo: "Cura", alternativas: [] },
  { nombre: "Yech'Ti'Wawa", stats: { "PdV": 60, "Dom. crítico": 90 }, tipo: "Crítico", alternativas: [] },
  { nombre: "Jabatillo de oro", stats: { "PdV": 30, "Iniciativa": 20, "Dom. agua": 62, "Dom. aire": 62 }, tipo: "Elemental", alternativas: [] },
  { nombre: "Wauwau de oro", stats: { "PdV": 30, "Iniciativa": 20, "Dom. fuego": 62, "Dom. agua": 62 }, tipo: "Elemental", alternativas: [] },
  { nombre: "Murciego", stats: { "Golpe crít. %": 3, "Dom. distancia": 60 }, tipo: "Distancia", alternativas: ["Tofu encantador", "Kralupido"] },
  { nombre: "Dog", stats: { "Golpe crít. %": 3, "Dom. berserker": 100 }, tipo: "Berserker", alternativas: ["Tofu tripudo", "Ratanalla"] },
  { nombre: "Tofu comedido", stats: { "Dom. melé": 60, "Golpe crít. %": 3 }, tipo: "Melé", alternativas: ["Pulguita", "Gerbichón"] },
  { nombre: "Tofu brakmariano", stats: { "PdV": 90, "Placaje": 100 }, tipo: "Defensa", alternativas: [] },
  { nombre: "Bun comedido", stats: { "PdV": 60, "Res. crítica": 50 }, tipo: "Defensa", alternativas: ["Mikhal"] },
  { nombre: "Bun bontariano", stats: { "PdV": 60, "Res. agua": 50 }, tipo: "Defensa", alternativas: ["Brial"] },
  { nombre: "Dentito", stats: { "PdV": 60, "PW": 1 }, tipo: "General", alternativas: ["Miaumiau encantador"] },
  { nombre: "Chaparrón", stats: { "Dom. agua": 106 }, tipo: "Elemental", alternativas: ["Krosmunster de agua", "Surimi"] },
  { nombre: "Kuakuá", stats: { "PdV": 60, "Dom. espalda": 100 }, tipo: "Espalda", alternativas: ["Miaumiau brakmariano"] },
  { nombre: "Minimaxilubo", stats: { "PdV": 60, "Res. elemental": 20, "Anticipación %": 5 }, tipo: "Defensa", alternativas: [] },
  { nombre: "Krosmunster de tierra", stats: { "Dom. tierra": 106 }, tipo: "Elemental", alternativas: ["Guijarro", "Mampuesto"] },
  { nombre: "Araknomeka", stats: { "PdV": 60, "Placaje": 50, "Anticipación %": 5 }, tipo: "Defensa", alternativas: [] },
  { nombre: "Bilby", stats: { "Golpe crít. %": 3, "Voluntad": 20 }, tipo: "General", alternativas: [] },
  { nombre: "Jalatín", stats: { "PdV": 60, "Dom. elemental": 40, "Placaje": 20 }, tipo: "Elemental", alternativas: [] },
  { nombre: "Tofu pringoso", stats: { "PdV": 90, "Esquiva": 100 }, tipo: "Defensa", alternativas: [] },
  { nombre: "Miaumiau pringoso", stats: { "PdV": 60, "Voluntad": 20 }, tipo: "General", alternativas: ["Pequeñiestro"] },
  { nombre: "Bun pringoso", stats: { "PdV": 60, "Res. tierra": 50 }, tipo: "Defensa", alternativas: ["Dakal"] },
  { nombre: "Bun encantador", stats: { "PdV": 60, "Res. espalda": 50 }, tipo: "Defensa", alternativas: ["Kurial"] },
  { nombre: "Gongón pringoso", stats: { "PdV": 30, "Dom. melé": 60, "Esquiva": 30 }, tipo: "Melé", alternativas: [] },
  { nombre: "Teleflix", stats: { "Dom. espalda": 60, "Golpe crít. %": 3 }, tipo: "Espalda", alternativas: ["Cuerbok", "Cascawabias"] },
  { nombre: "Fab'huritu menor", stats: { "PdV": 30, "Dom. melé": 75 }, tipo: "Melé", alternativas: ["Drathrosk"] },
  { nombre: "Lokulto", stats: { "Anticipación %": 5, "Voluntad": 20 }, tipo: "General", alternativas: [] },
  { nombre: "Bebé pandawa", stats: { "Golpe crít. %": 3, "Dom. crítico": 60, "Dom. distancia": 30 }, tipo: "Crítico", alternativas: [] },
  { nombre: "Bebé brizlón", stats: { "Placaje": 60, "Esquiva": 60 }, tipo: "Defensa", alternativas: [] },
  { nombre: "Piernas de chafer", stats: { "PdV": 60, "Iniciativa": 20, "Golpe crít. %": 3 }, tipo: "General", alternativas: [] },
  { nombre: "Guijarro de oro", stats: { "PdV": 30, "Iniciativa": 20, "Dom. tierra": 62, "Dom. aire": 62 }, tipo: "Elemental", alternativas: [] },
  { nombre: "Escaramosca de oro", stats: { "PdV": 30, "Iniciativa": 20, "Dom. fuego": 62, "Dom. aire": 62 }, tipo: "Elemental", alternativas: [] },
  { nombre: "Surimi de oro", stats: { "PdV": 30, "Iniciativa": 20, "Dom. fuego": 62, "Dom. tierra": 62 }, tipo: "Elemental", alternativas: [] },
  { nombre: "Miaumiau tripudo", stats: { "Dom. elemental": 30, "Voluntad": 20 }, tipo: "Elemental", alternativas: ["Dragún"] },
  { nombre: "Gongón tripudo", stats: { "PdV": 30, "Dom. melé": 60, "Placaje": 30 }, tipo: "Melé", alternativas: [] },
  { nombre: "Cocodrilo", stats: { "Golpe crít. %": 3, "Dom. crítico": 80 }, tipo: "Crítico", alternativas: [] },
  { nombre: "Kometa", stats: { "PdV": 30, "Dom. distancia": 75 }, tipo: "Distancia", alternativas: [] },
  { nombre: "Pekatcham", stats: { "Dom. cura": 40, "Voluntad": 20 }, tipo: "Cura", alternativas: [] },
  { nombre: "Drakolega", stats: { "PdV": 60, "Anticipación %": 10 }, tipo: "Defensa", alternativas: [] },
  { nombre: "Abún", stats: { "Placaje": 60, "Res. elemental": 20 }, tipo: "Defensa", alternativas: [] },
  { nombre: "Pingwii", stats: { "PdV": 60, "Dom. elemental": 30, "Esquiva": 40 }, tipo: "Elemental", alternativas: [] },
  { nombre: "Minithar", stats: { "Golpe crít. %": 3, "Dom. crítico": 60, "Dom. melé": 30 }, tipo: "Crítico", alternativas: [] },
  { nombre: "Gárghula", stats: { "Dom. elemental": 55, "Golpe crít. %": 3 }, tipo: "Elemental", alternativas: [] },
];

// Obsolete pets — dominated with soft PdV rule (≤30 diff tolerated)
const OBSOLETAS = [
  { nombre: "Fotasma", stats: { "Esquiva": 100 }, tipo: "Defensa", superadoPor: "Tofu pringoso" },
  { nombre: "Gongón encantador", stats: { "PdV": 30, "Dom. melé": 60, "Dom. cura": 50 }, tipo: "Melé", superadoPor: "Calabazado" },
  { nombre: "Gelutín guerrero", stats: { "PdV": 50, "Dom. melé": 20, "Res. elemental": 10 }, tipo: "Melé", superadoPor: "Cangrobot" },
  { nombre: "Gelutín sanador", stats: { "PdV": 60, "Dom. cura": 60 }, tipo: "Cura", superadoPor: "Miaumiau de las nieves" },
  { nombre: "Gelutín cazador", stats: { "PdV": 20, "Dom. crítico": 20, "Dom. distancia": 30 }, tipo: "Distancia", superadoPor: "Bebé pandawa" },
  { nombre: "Gelutín berserker", stats: { "PdV": 20, "Dom. berserker": 50 }, tipo: "Berserker", superadoPor: "Dog / Ratanalla" },
  { nombre: "Muuumusca", stats: { "Golpe crít. %": 3, "Dom. elemental": 40 }, tipo: "Elemental", superadoPor: "Gárghula" },
  { nombre: "Abominación domesticada", stats: { "PdV": 60, "Dom. elemental": 35 }, tipo: "Elemental", superadoPor: "Calabazado" },
  { nombre: "Gongón brakmariano", stats: { "PdV": 30, "Dom. melé": 60, "Dom. berserker": 50 }, tipo: "Melé", superadoPor: "Calabazado" },
  { nombre: "Gongón bontariano", stats: { "PdV": 30, "Dom. distancia": 60 }, tipo: "Distancia", superadoPor: "Kometa" },
  { nombre: "Gelutín aventurero", stats: { "PdV": 20, "Dom. elemental": 20, "Res. elemental": 10 }, tipo: "Elemental", superadoPor: "Cangrobot" },
  { nombre: "Miaumiau", stats: { "PdV": 90, "Placaje": 60 }, tipo: "Defensa", superadoPor: "Tofu brakmariano" },
  { nombre: "Tofu pompón", stats: { "PdV": 90, "Esquiva": 60 }, tipo: "Defensa", superadoPor: "Tofu pringoso" },
  { nombre: "Bebé perforatroz", stats: { "Placaje": 100 }, tipo: "Defensa", superadoPor: "Tofu brakmariano" },
  { nombre: "Wonejo", stats: { "PdV": 140 }, tipo: "Supervivencia", superadoPor: "Miaumiau atigrado" },
  { nombre: "Kerubebé", stats: { "PdV": 30, "Dom. elemental": 30 }, tipo: "Elemental", superadoPor: "Cangrobot" },
  { nombre: "Tofu mediomuerto", stats: { "PdV": 30, "Dom. berserker": 100 }, tipo: "Berserker", superadoPor: "Dog / Ratanalla" },
];

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let showObsolete = false;
let activeTipos = new Set();
let activeStats = new Set();
let searchText = '';

const TIPOS = ["Melé","Distancia","Berserker","Espalda","Crítico","Elemental","Cura","Supervivencia","Defensa","Recolección","General"];
const STAT_FILTERS = [
  "PdV","PW","Iniciativa","Voluntad","Dom. elemental",
  "Dom. fuego","Dom. agua","Dom. tierra","Dom. aire",
  "Dom. melé","Dom. distancia","Dom. berserker","Dom. espalda","Dom. crítico","Dom. cura",
  "Res. elemental","Res. fuego","Res. agua","Res. tierra","Res. aire","Res. espalda","Res. crítica",
  "Placaje","Esquiva","Golpe crít. %","Anticipación %","Armadura %"
];

// ─────────────────────────────────────────────
// STAT CHIP HELPERS
// ─────────────────────────────────────────────
function statClass(key) {
  if (key === "PdV") return "c-pdv";
  if (key.startsWith("Dom.") || key.includes("dom")) return "c-dom";
  if (key.startsWith("Res.") || key === "Placaje" || key === "Esquiva" || key === "Armadura %") return "c-res";
  if (key === "Golpe crít. %" || key === "Anticipación %") return "c-gc";
  if (key.includes("%")) return "c-rec";
  return "c-misc";
}

function statIcon(key) {
  if (key === "PdV") return "❤";
  if (key === "PW") return "⚡";
  if (key === "Iniciativa") return "🎯";
  if (key === "Voluntad") return "🧠";
  if (key.includes("cura")) return "💚";
  if (key.includes("melé") || key.includes("mele")) return "⚔";
  if (key.includes("distancia")) return "🏹";
  if (key.includes("berserker")) return "🔥";
  if (key.includes("espalda")) return "🗡";
  if (key.includes("crítico") || key.includes("critico")) return "💥";
  if (key.includes("Dom.")) return "✨";
  if (key.includes("Res.")) return "🛡";
  if (key === "Placaje") return "🪤";
  if (key === "Esquiva") return "💨";
  if (key === "Golpe crít. %") return "⚡";
  if (key === "Anticipación %") return "👁";
  if (key === "Armadura %") return "🛡";
  if (key.includes("%")) return "🌿";
  return "•";
}

function formatVal(key, val) {
  if (key.includes("%") || key === "Golpe crít. %" || key === "Anticipación %" || key === "Armadura %") return val + "%";
  return val;
}

function chipHTML(key, val) {
  return `<div class="stat-chip"><span class="sval ${statClass(key)}">${statIcon(key)} ${formatVal(key, val)}</span><span class="sname">${key}</span></div>`;
}

// ─────────────────────────────────────────────
// CARD BUILDERS
// ─────────────────────────────────────────────
function buildCard(pet, isObs) {
  const tipo = pet.tipo || "General";
  const mainType = tipo.split("/")[0];
  let chips = Object.entries(pet.stats).map(([k,v]) => chipHTML(k,v)).join('');

  let altHtml = '';
  if (pet.alternativas && pet.alternativas.length) {
    altHtml = `<div class="alt-section">
      <div class="alt-label">Mismos stats — alternativas válidas:</div>
      <div class="alt-names">${pet.alternativas.map(a=>`<span class="alt-name">${a}</span>`).join('')}</div>
    </div>`;
  }

  let obsBanner = '';
  if (isObs && pet.superadoPor) {
    obsBanner = `<div class="obsolete-banner">⚠ Superada por: <strong>${pet.superadoPor}</strong></div>`;
  }

  return `<div class="card t-${mainType} ${isObs?'obsolete':''}">
    <div class="card-head">
      <div class="card-emoji">${tipoEmoji(mainType)}</div>
      <div class="card-name">${pet.nombre}</div>
      <div class="card-badge badge-${mainType}">${tipo}</div>
    </div>
    <div class="stats-grid">${chips}</div>
    ${altHtml}
    ${obsBanner}
    ${buildPriceHtml(pet.nombre)}
  </div>`;
}

function tipoEmoji(t) {
  const map = {
    "Melé":"⚔","Distancia":"🏹","Berserker":"🔥","Espalda":"🗡","Crítico":"💥",
    "Elemental":"✨","Cura":"💚","Supervivencia":"❤","Defensa":"🛡",
    "Recolección":"🌿","General":"⭐"
  };
  return map[t] || "🐾";
}

// ─────────────────────────────────────────────
// PRICE TRACKER
// ─────────────────────────────────────────────
function priceKey(nombre) { return 'precio_' + nombre; }

function loadPrice(nombre) {
  try { return JSON.parse(localStorage.getItem(priceKey(nombre))) || null; }
  catch { return null; }
}

function savePrice(nombre, valor) {
  const prev = loadPrice(nombre);
  const entry = {
    actual: valor,
    anterior: prev ? prev.actual : null,
    fechaActual: Date.now(),
    fechaAnterior: prev ? prev.fechaActual : null
  };
  localStorage.setItem(priceKey(nombre), JSON.stringify(entry));
}

function clearPrice(nombre) {
  localStorage.removeItem(priceKey(nombre));
}

function formatKamas(n) {
  return n.toLocaleString('es-ES') + ' k';
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(diff / 86400000);
  return `hace ${days}d`;
}

function buildPriceHtml(nombre) {
  const data = loadPrice(nombre);
  const val = data ? data.actual : '';

  let trendHtml = '';
  if (data && data.anterior !== null) {
    const diff = data.actual - data.anterior;
    if (diff > 0) {
      trendHtml = `<span class="price-trend up">↑ +${formatKamas(diff)}</span>`;
    } else if (diff < 0) {
      trendHtml = `<span class="price-trend down">↓ ${formatKamas(diff)}</span>`;
    } else {
      trendHtml = `<span class="price-trend same">= sin cambio</span>`;
    }
    trendHtml += `<span class="price-date">${timeAgo(data.fechaAnterior)} → ${timeAgo(data.fechaActual)}</span>`;
  } else if (data) {
    trendHtml = `<span class="price-date">${timeAgo(data.fechaActual)}</span>`;
  }

  const escaped = nombre.replace(/'/g, "\\'");
  return `<div class="price-section">
    <span class="price-label">💰</span>
    <input type="number" class="price-input" placeholder="precio kamas" value="${val}" min="0"
      onchange="onPriceChange(this,'${escaped}')"
      onkeydown="if(event.key==='Enter')this.blur()"
      title="Anota el precio de la subasta">
    ${trendHtml}
  </div>`;
}

function onPriceChange(input, nombre) {
  const val = parseInt(input.value, 10);
  if (!isNaN(val) && val > 0) {
    savePrice(nombre, val);
    render();
  } else if (input.value === '') {
    clearPrice(nombre);
    render();
  }
}

// ─────────────────────────────────────────────
// FILTER LOGIC
// ─────────────────────────────────────────────
function matchesPet(pet) {
  const name = pet.nombre.toLowerCase();
  const q = searchText.toLowerCase();
  if (searchText && !name.includes(q) && !(pet.alternativas && pet.alternativas.some(a => a.toLowerCase().includes(q)))) return false;
  if (activeTipos.size > 0) {
    const tipo = pet.tipo || "General";
    const parts = tipo.split("/");
    if (!parts.some(p => activeTipos.has(p))) return false;
  }
  if (activeStats.size > 0) {
    for (const s of activeStats) {
      if (!(s in pet.stats)) return false;
    }
  }
  return true;
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
function render() {
  const container = document.getElementById('cards');
  const empty = document.getElementById('empty');
  const resultsText = document.getElementById('results-text');

  const allPets = [...OPTIMAS, ...RECOLECCION];
  const filtered = allPets.filter(matchesPet);
  const filteredObs = showObsolete ? OBSOLETAS.filter(matchesPet) : [];

  const total = filtered.length + filteredObs.length;

  if (total === 0) {
    container.innerHTML = '';
    empty.style.display = '';
    resultsText.innerHTML = 'Sin resultados';
    return;
  }
  empty.style.display = 'none';

  let html = filtered.map(p => buildCard(p, false)).join('');
  if (filteredObs.length) {
    html += `<div style="grid-column:1/-1;margin-top:8px;padding-top:16px;border-top:1px dashed var(--border2);font-family:'Cinzel',serif;font-size:0.7rem;letter-spacing:.15em;color:var(--red);text-transform:uppercase;">— Mascotas Obsoletas —</div>`;
    html += filteredObs.map(p => buildCard(p, true)).join('');
  }
  container.innerHTML = html;

  const suffix = activeStats.size || activeTipos.size || searchText ? ' (filtradas)' : '';
  resultsText.innerHTML = `Mostrando <strong>${total}</strong> mascotas${suffix}`;
}

// ─────────────────────────────────────────────
// INIT UI
// ─────────────────────────────────────────────
function initTipos() {
  const g = document.getElementById('tipo-grid');
  g.innerHTML = TIPOS.map(t =>
    `<button class="tipo-btn" onclick="toggleTipo('${t}')" id="tbtn-${t}">${tipoEmoji(t)} ${t}</button>`
  ).join('');
}

function initStatFilters() {
  const g = document.getElementById('stat-filter');
  g.innerHTML = STAT_FILTERS.map(s =>
    `<label class="stat-row"><input type="checkbox" onchange="toggleStat('${s}')"><span>${s}</span></label>`
  ).join('');
}

function toggleTipo(t) {
  if (activeTipos.has(t)) activeTipos.delete(t);
  else activeTipos.add(t);
  document.getElementById('tbtn-'+t).classList.toggle('active', activeTipos.has(t));
  render();
}

function toggleStat(s) {
  if (activeStats.has(s)) activeStats.delete(s);
  else activeStats.add(s);
  render();
}

function toggleObs() {
  showObsolete = !showObsolete;
  document.getElementById('tog-obs').classList.toggle('on', showObsolete);
  render();
}

document.getElementById('search').addEventListener('input', e => {
  searchText = e.target.value;
  render();
});

// Header counts
document.getElementById('cnt-opt').textContent = OPTIMAS.length;
document.getElementById('cnt-obs').textContent = OBSOLETAS.length;
document.getElementById('cnt-rec').textContent = RECOLECCION.length;

initTipos();
initStatFilters();
render();