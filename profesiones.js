// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────
const API     = 'api_profesiones.php';
const API_MAT = 'api_materiales.php';

const PROFESIONES_CRAFTEO     = ['Armero','Joyero','Cocinero','Marroquinero','Peletero','Ebanista','Maestro de armas','Sastre'];
const PROFESIONES_RECOLECCION = ['Herbolario','Minero','Campesino','Leñador','Pescador','Peletero'];
const SUBTIPOS_EQUIP = ['Amuleto','Anillo','Botas','Capa','Casco','Cinturón','Escudo','Hombreras','Pecho','Arma de 1 mano','Arma de 2 manos','Segunda mano','Emblema'];
const RAREZAS        = ['Raro','Mítico','Legendario','Épico','Reliquia'];

// ─── SUFIJOS DE NIVEL ──────────────────────────────────────────
// Un tier cada 10 niveles desde el 0. Primarios empiezan en 0, secundarios en 5.
const SUFIJOS_NIVEL = [
  'Tosca',         // tier  0 → primario lvl   0 / secundario lvl   5
  'Rudimentaria',  // tier  1 → primario lvl  10 / secundario lvl  15
  'Imperfecta',    // tier  2 → primario lvl  20 / secundario lvl  25
  'Frágil',        // tier  3 → primario lvl  30 / secundario lvl  35
  'Rústica',       // tier  4 → primario lvl  40 / secundario lvl  45
  'Bruta',         // tier  5 → primario lvl  50 / secundario lvl  55
  'Sólida',        // tier  6 → primario lvl  60 / secundario lvl  65
  'Duradera',      // tier  7 → primario lvl  70 / secundario lvl  75
  'Refinada',      // tier  8 → primario lvl  80 / secundario lvl  85
  'Preciosa',      // tier  9 → primario lvl  90 / secundario lvl  95
  'Exquisita',     // tier 10 → primario lvl 100 / secundario lvl 105
  'Mística',       // tier 11 → primario lvl 110 / secundario lvl 115
  'Eterna',        // tier 12 → primario lvl 120 / secundario lvl 125
  'Divina',        // tier 13 → primario lvl 130 / secundario lvl 135
  'Infernal',      // tier 14 → primario lvl 140 / secundario lvl 145
  'Ancestral',     // tier 15 → primario lvl 150 / secundario lvl 155
];

// Sufijos en forma masculina (Superglú es masculino)
const SUFIJOS_NIVEL_MASC = [
  'Tosco','Rudimentario','Imperfecto','Frágil','Rústico',
  'Bruto','Sólido','Duradero','Refinado','Precioso',
  'Exquisito','Místico','Eterno','Divino','Infernal','Ancestral'
];
function getSufijoMasc(nivelItem) {
  const t = getSufijoTier(nivelItem);
  return SUFIJOS_NIVEL_MASC[Math.min(t, SUFIJOS_NIVEL_MASC.length - 1)] || '';
}
function getSupergluNombre(nivelItem) {
  const sufijo = getSufijoMasc(nivelItem);
  return sufijo ? `Superglú ${sufijo}` : 'Superglú';
}

// Materiales secundarios que usan las profesiones de crafteo (empiezan en lvl 5, suben de 10 en 10)
const MAT_SECUNDARIO_BASE = {
  'Herbolario': 'Hilo',
  'Minero':     'Acero',
  'Campesino':  'Harina',
  'Leñador':    'Tabla',
  'Pescador':   'Encantártaro',
  'Peletero':   'Esencia',
  'Panadero':   'Aceite',
};

// ─── FÓRMULAS DE NIVEL → TIER ──────────────────────────────────
// Primario: tier = floor((max(1,lvl) - 1) / 10)
// Secundario: mismo tier pero nivel del material = tier*10 + 5
function getSufijoTier(nivelItem) {
  return Math.floor(Math.max(0, nivelItem - 1) / 10);
}
function getSufijo(nivelItem) {
  const t = getSufijoTier(nivelItem);
  return SUFIJOS_NIVEL[Math.min(t, SUFIJOS_NIVEL.length - 1)] || '';
}
function getMatBaseNombre(profesion, nivelItem) {
  const base = PROF_MAT_BASE[profesion];
  if (!base) return null;
  const sufijo = base.masc ? getSufijoMasc(nivelItem) : getSufijo(nivelItem);
  return sufijo ? `${base.nombre} ${sufijo}` : base.nombre;
}
// Devuelve todos los materiales base aplicables a la profesión y nivel (incluye extras de Ebanista).
// nivelMinCheck: nivel que se usa para decidir si un extra está disponible (por defecto = nivelItem).
// Permite usar nivel_item para la elegibilidad mientras el sufijo se calcula con nivel_prof.
function getMatBaseNombresAll(profesion, nivelItem, nivelMinCheck = null) {
  const base = PROF_MAT_BASE[profesion];
  if (!base) return [];
  const sufijo    = base.masc ? getSufijoMasc(nivelItem) : getSufijo(nivelItem);
  const result    = [{ nombre: sufijo ? `${base.nombre} ${sufijo}` : base.nombre, base }];
  const nivelCheck = nivelMinCheck ?? nivelItem;
  for (const ex of (base.extras || [])) {
    if (nivelCheck < (ex.nivelMin || 0)) continue;
    const sufijoEx = ex.masc ? getSufijoMasc(nivelItem) : getSufijo(nivelItem);
    result.push({ nombre: sufijoEx ? `${ex.nombre} ${sufijoEx}` : ex.nombre, base: ex });
  }
  return result;
}
function getMatSecNombres(nivelItem) {
  const sufijo = getSufijo(nivelItem);
  if (!sufijo) return [];
  return Object.entries(MAT_SECUNDARIO_BASE).map(([prof, base]) => ({
    nombre:    `${base} ${sufijo}`,
    profesion: PROFESIONES_RECOLECCION.includes(prof) ? prof : null,
  }));
}

// Tipos de equipo que puede craftear cada profesión
const PROF_TIPOS = {
  'Sastre':           ['Casco', 'Capa'],
  'Maestro de armas': ['Arma de 1 mano', 'Arma de 2 manos', 'Segunda mano'],
  'Marroquinero':     ['Cinturón', 'Botas', 'Bolsa'],
  'Joyero':           ['Anillo', 'Amuleto'],
  'Armero':           ['Escudo', 'Pecho', 'Hombreras'],
};

// Material base típico por profesión (escala con el nivel: tosco → rudimentario → … hasta lvl 160)
// Útil para autocompletado y como referencia al añadir materiales a una receta
const PROF_MAT_BASE = {
  'Sastre':           { nombre: 'Fibra',      recProf: 'Campesino', ejemplo: 'Fibra tosca, Fibra rudimentaria…' },
  'Maestro de armas': { nombre: 'Mango',      recProf: 'Leñador',   ejemplo: 'Mango tosco, Mango rudimentario…' },
  'Marroquinero':     { nombre: 'Cuero',      recProf: 'Peletero',  ejemplo: 'Cuero tosco, Cuero rudimentario…' },
  'Joyero':           { nombre: 'Gema',       recProf: 'Minero',    ejemplo: 'Gema tosca, Gema rudimentaria…'   },
  'Armero':           { nombre: 'Placa',      recProf: 'Minero',    ejemplo: 'Placa tosca, Placa rudimentaria…' },
  'Cocinero':         { nombre: 'Especia',    recProf: 'Pescador',  ejemplo: 'Especia tosca, Especia rudimentaria…' },
  'Peletero':         { nombre: 'Esencia',    recProf: 'Peletero',  ejemplo: 'Esencia tosca (nv.5), Esencia rudimentaria (nv.15)…' },
  // Ebanista tiene dos materiales base: Escuadrita (femenino, nv.0+) y Orbe (masculino, nv.45+)
  'Ebanista':         { nombre: 'Escuadrita', recProf: 'Leñador',   ejemplo: 'Escuadrita tosca, Escuadrita rudimentaria…',
                        extras: [{ nombre: 'Orbe', masc: true, nivelMin: 45, recProf: 'Leñador', ejemplo: 'Orbe rústico (nv.45), Orbe bruto (nv.55)…' }] },
};

const PROF_EMOJI = {
  'Armero':'🛡','Joyero':'💎','Cocinero':'🍳','Marroquinero':'👜',
  'Peletero':'🧥','Ebanista':'🪵','Maestro de armas':'⚔','Sastre':'🧵',
  'Herbolario':'🌿','Minero':'⛏','Campesino':'🌾','Leñador':'🪓','Pescador':'🎣'
};

// ─────────────────────────────────────────────
// HISTORIAL DE STOCK DE MATERIALES (localStorage)
// ─────────────────────────────────────────────
const LS_STOCK_HIST = 'wf_stock_hist';

function _addStockHist(nombre, cantidad) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_STOCK_HIST) || '{}');
    const key = normName(nombre);
    if (!all[key]) all[key] = [];
    all[key].push({ c: cantidad, t: Date.now() });
    if (all[key].length > 60) all[key] = all[key].slice(-60);
    localStorage.setItem(LS_STOCK_HIST, JSON.stringify(all));
  } catch {}
}

function _getStockAvg(nombre) {
  try {
    const hist = (JSON.parse(localStorage.getItem(LS_STOCK_HIST) || '{}'))[normName(nombre)] || [];
    if (hist.length < 5) return null; // sin suficiente historial, no alertar
    return hist.reduce((s, e) => s + e.c, 0) / hist.length;
  } catch { return null; }
}

function isStockLow(item) {
  if (item.categoria !== 'material' && item.categoria !== 'recoleccion') return false;
  const avg = _getStockAvg(item.nombre);
  if (avg === null || avg < 2) return false;
  const k = normName(item.nombre);
  const usedInRecipe = items.some(i => {
    if (i.categoria !== 'crafteo') return false;
    const todasRecetas = [i.materiales, ...(i.recetas_alt || [])].filter(r => r?.length);
    return todasRecetas.some(r => r.some(m => normName(m.nombre) === k));
  });
  return usedInRecipe && (item.comprados || 0) < avg * 0.4;
}

// ─────────────────────────────────────────────
// PRECIOS — FRESCURA (6 h de cooldown, solo si precio ≥ 100)
// ─────────────────────────────────────────────
const STALE_MS        = 6 * 60 * 60 * 1000; // 6 horas
const STALE_MIN_PRICE = 100;                 // precios menores no se marcan como obsoletos
const TAX_RATE        = 0.0166;              // impuesto de venta del mercado (1,66%)

function getMatFecha(nombre) {
  try { return (JSON.parse(localStorage.getItem('wf_mat_fechas') || '{}'))[normName(nombre)] || 0; }
  catch { return 0; }
}
function setMatFecha(nombre) {
  try {
    const f = JSON.parse(localStorage.getItem('wf_mat_fechas') || '{}');
    f[normName(nombre)] = Date.now();
    localStorage.setItem('wf_mat_fechas', JSON.stringify(f));
  } catch {}
}
// Precio de material obsoleto: si hay precio ≥ STALE_MIN_PRICE en catálogo y fecha > STALE_MS
function isMatStale(nombre) {
  if (!nombre) return false;
  const precio = getCatalogPrice(nombre);
  if (!precio || precio < STALE_MIN_PRICE) return false;
  const fecha = getMatFecha(nombre);
  return !fecha || Date.now() - fecha > STALE_MS;
}
// Precio de venta obsoleto: precio ≥ STALE_MIN_PRICE y última entrada > STALE_MS
function isPriceStale(item) {
  const hist = item.historial_precios || [];
  if (!hist.length) return false;
  const last = hist.reduce((a, b) => b.fecha > a.fecha ? b : a);
  if (last.precio < STALE_MIN_PRICE) return false;
  return Date.now() - last.fecha > STALE_MS;
}

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────
let items           = [];
let catalog         = {};     // normName → precio  (fuente de verdad para precios de materiales)
let catalogNames    = {};     // normName → nombre original (para el datalist)
let editingId       = null;
let searchText      = '';
let categoriaFilter = 'todo';
let activeProfesiones = new Set();
let activeRarezas   = new Set();
let activeTipos     = new Set();
let soloRentables   = false;
let nivelMin        = null;
let nivelMax        = null;
let sortBy          = 'profit';
let sortSecondary   = 'vendidos';
let matCount        = 0;
let reponerMode       = false;
let publicarMode      = false;
let reponerSortAsc    = true;          // orden de "Qué voy a craftear": true=ascendente por nivel
let _reponerHiddenIds  = new Set(JSON.parse(localStorage.getItem('reponerHiddenIds') || '[]')); // IDs de crafteos ocultados con el ojo
let _reponerCraftSelIds = new Set(); // IDs marcados para craftear
let reponerProfFilter   = new Set(); // profesiones activas en el filtro del panel reponer
let _reponerQty         = new Map(); // item.id → cantidad a craftear (defecto 1)
let _pubSearchText    = '';            // filtro del buscador del panel publicar
let _pendSearchText   = '';            // filtro del buscador de pendientes de vender
let craftearPreview = null; // null | { crafteos: [...items], mats: Map<matItem.id, qty> }

// ─────────────────────────────────────────────
// CATÁLOGO DE MATERIALES (precios compartidos)
// ─────────────────────────────────────────────
const normName = s => (s || '').toLowerCase().trim();

// Busca un item por nombre, incluyendo nombre_alternativo
function findMatItem(nombre) {
  const k = normName(nombre);
  return items.find(i => normName(i.nombre) === k || normName(i.nombre_alternativo || '') === k);
}

function getCatalogPrice(nombre) {
  return catalog[normName(nombre)] ?? 0;
}

// Actualiza catálogo en memoria + persiste en BD + sincroniza historial de items material/recolección + re-renderiza
// rareza: si se indica, solo sincroniza crafteos con esa rareza (evita contaminar el historial de venta
//         de un item con el precio de compra del mismo nombre pero distinta rareza)
async function updateCatalogPrice(nombre, precio, rareza = null) {
  const key = normName(nombre);
  const val = Math.max(0, parseInt(precio, 10) || 0);
  if (catalog[key] === val) return;
  catalog[key]      = val;
  catalogNames[key] = nombre.trim();
  setMatFecha(nombre);

  // Sincronizar historial_precios:
  // - material/recoleccion: siempre
  // - crafteo sin rareza (materiales intermedios): siempre
  // - crafteo con rareza: solo si el rareza pasado coincide exactamente
  const now = Date.now();
  const toSync = items.filter(i => {
    if (normName(i.nombre) !== key) return false;
    if (i.categoria === 'material' || i.categoria === 'recoleccion') return true;
    if (i.categoria === 'crafteo') {
      if (!i.rareza) return true;
      return rareza !== null && i.rareza === rareza;
    }
    return false;
  });
  toSync.forEach(i => {
    if (!i.historial_precios) i.historial_precios = [];
    i.historial_precios.push({ precio: val, fecha: now, vendido: false });
  });

  // Actualizar historial del catálogo en localStorage (para cards virtuales sin item real)
  addCatHist(nombre.trim(), val);

  try {
    const ps = [
      fetch(API_MAT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), precio: val }) }),
      ...toSync.map(i => pushItem(i))
    ];
    await Promise.all(ps);
  } catch(e) { console.error('Error al guardar precio:', e); }
  render();
}

async function loadCatalog() {
  try {
    const res = await fetch(API_MAT);
    if (!res.ok) return;
    const rows = await res.json();
    catalog     = {};
    catalogNames = {};
    (Array.isArray(rows) ? rows : []).forEach(r => {
      const k = normName(r.nombre);
      catalog[k]      = parseInt(r.precio, 10) || 0;
      catalogNames[k] = r.nombre;
    });
  } catch(e) { /* catálogo vacío, no crítico */ }
}

// Migración: si items antiguos tenían {nombre, cantidad, precio} en materiales,
// vuelca esos precios al catálogo (solo los que aún no estén)
async function autoMigrate() {
  const toAdd = [];
  items.forEach(item => {
    (item.materiales || []).forEach(m => {
      if (!m.nombre) return;
      const k = normName(m.nombre);
      if (m.precio > 0 && !(k in catalog)) {
        catalog[k]      = m.precio;
        catalogNames[k] = m.nombre;
        toAdd.push({ nombre: m.nombre, precio: m.precio });
      }
    });
  });
  if (toAdd.length) {
    toAdd.forEach(m => fetch(API_MAT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m)
    }).catch(() => {}));
  }
}

// Todos los nombres de materiales conocidos (catálogo + usados en recetas + items de recolección)
function getAllMatNames() {
  const names = new Set(Object.values(catalogNames));
  items.forEach(item => {
    if (item.categoria === 'recoleccion') {
      names.add(item.nombre);
      if (item.nombre_alternativo) names.add(item.nombre_alternativo);
    }
    const todasRecetas = [item.materiales, ...(item.recetas_alt || [])].filter(r => r?.length);
    todasRecetas.forEach(r => r.forEach(m => { if (m.nombre) names.add(m.nombre); }));
  });
  return [...names].sort((a, b) => a.localeCompare(b, 'es'));
}

function updateMatDatalist() {
  const dl = document.getElementById('mat-names-dl');
  if (!dl) return;
  dl.innerHTML = getAllMatNames()
    .map(n => `<option value="${n.replace(/"/g, '&quot;')}">`)
    .join('');
}

// ─────────────────────────────────────────────
// DB — ITEMS
// ─────────────────────────────────────────────
async function loadAll() {
  try {
    const [itemsRes, catRes] = await Promise.all([fetch(API), fetch(API_MAT)]);
    if (!itemsRes.ok) throw new Error(itemsRes.status);
    items       = await itemsRes.json();
    catalog     = {};
    catalogNames = {};
    if (catRes.ok) {
      (await catRes.json() || []).forEach(r => {
        const k = normName(r.nombre);
        catalog[k]      = parseInt(r.precio, 10) || 0;
        catalogNames[k] = r.nombre;
      });
    }
    await autoMigrate();
  } catch(e) {
    document.getElementById('results-text').innerHTML =
      '<span style="color:var(--red)">⚠ No se puede conectar. ¿Está XAMPP activo?</span>';
    document.getElementById('empty').style.display = 'block';
    return;
  }
  await checkCaducados();
  render();
}

async function pushItem(item) {
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  } catch(e) { console.error(e); }
}

async function removeItemFromDb(id) {
  try { await fetch(`${API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); }
  catch(e) { console.error(e); }
}

// ─────────────────────────────────────────────
// CÁLCULOS
// ─────────────────────────────────────────────

// Para un material de receta devuelve: precio efectivo, modo usado y ambas opciones
// Si el material está vinculado a un crafteo, compara coste de creación vs precio de compra
function getMatInfo(m) {
  if (!m.item_id) {
    const precio = getCatalogPrice(m.nombre);
    return { precio, modo: 'compra', precioCompra: precio, precioCreacion: null };
  }
  const ref = items.find(i => i.id === m.item_id);
  if (!ref) {
    const precio = getCatalogPrice(m.nombre);
    return { precio, modo: 'compra', precioCompra: precio, precioCreacion: null };
  }

  // Precio de compra: primero precio de mercado del historial, luego catálogo de materiales
  const precioCompra   = getPrecioActual(ref) || getCatalogPrice(m.nombre);
  const precioCreacion = calcCoste(ref);   // coste de los ingredientes del material base

  // Elegir la opción más barata (si ambas disponibles)
  let precio, modo;
  if (precioCreacion > 0 && precioCompra > 0) {
    if (precioCreacion <= precioCompra) { precio = precioCreacion; modo = 'crafteo'; }
    else                                { precio = precioCompra;   modo = 'compra';  }
  } else if (precioCreacion > 0) { precio = precioCreacion; modo = 'crafteo'; }
  else                           { precio = precioCompra;   modo = 'compra';  }

  return { precio, modo, precioCompra, precioCreacion };
}

function _calcCosteReceta(mats) {
  return (mats || []).reduce((s, m) => {
    const { precio } = getMatInfo(m);
    return s + precio * (m.cantidad || 0);
  }, 0);
}

function calcCoste(item) {
  const recetas = [item.materiales, ...(item.recetas_alt || [])].filter(r => r?.length);
  if (!recetas.length) return item.coste_base || 0;
  return Math.min(...recetas.map(_calcCosteReceta));
}

// Devuelve los materiales de la receta más barata (principal o alternativa)
function getCheapestReceta(item) {
  const recetas = [item.materiales, ...(item.recetas_alt || [])].filter(r => r?.length);
  if (!recetas.length) return item.materiales || [];
  let best = recetas[0], bestCoste = _calcCosteReceta(best);
  for (let i = 1; i < recetas.length; i++) {
    const c = _calcCosteReceta(recetas[i]);
    if (c < bestCoste) { best = recetas[i]; bestCoste = c; }
  }
  return best;
}

function getPrecioActual(item) {
  if (!item.historial_precios?.length) return null;
  return item.historial_precios.reduce((latest, e) =>
    e.fecha > latest.fecha ? e : latest
  ).precio;
}

function calcProfit(item) {
  if (item.categoria === 'recoleccion' || item.categoria === 'material') return null;
  const coste  = calcCoste(item);
  const precio = getPrecioActual(item);
  if (precio === null) return null;
  const neto      = Math.round(precio * (1 - TAX_RATE));
  const profit    = neto - coste;
  const profitPct = coste > 0 ? (profit / coste * 100) : null;
  return { profit, profitPct, coste, precio, neto };
}

function fmtK(n)   { return Math.round(n).toLocaleString('es-ES'); }
function fmtPct(n) { return (n >= 0 ? '+' : '') + n.toFixed(1) + '%'; }

function rarezaClass(r) {
  if (!r) return '';
  return 'rareza-' + r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ─────────────────────────────────────────────
// AGRUPACIÓN DE RECOLECCIÓN
// Profesiones con un único recurso por tier (común + raro del mismo nodo)
// Peletero excluido: tiene múltiples esencias distintas por nivel, sin versión rara
const PROFS_TIER_GROUPING = new Set(['Herbolario', 'Minero', 'Campesino', 'Leñador']);

// Clave de grupo: tier+profesion para profesiones con un recurso único por tier
// Resto: grupo_recoleccion || nombre + profesion
function grupoKey(item) {
  if (PROFS_TIER_GROUPING.has(item.profesion) && item.nivel_item != null)
    return `tier${getSufijoTier(item.nivel_item)}||${item.profesion}`;
  return `${item.grupo_recoleccion || item.nombre}||${item.profesion}`;
}

// Devuelve los grupos de recolección: [{key, grupoNombre, profesion, lugar, nivel_item, nivel_profesion, variantes: {normal, raro, semilla}}]
// y la lista de items crafteo sin cambios
function getDisplayUnits() {
  const crafteos = items.filter(i => i.categoria === 'crafteo' || i.categoria === 'material');
  const recolItems = items.filter(i => i.categoria === 'recoleccion');

  const gruposMap = new Map();
  recolItems.forEach(item => {
    const k = grupoKey(item);
    if (!gruposMap.has(k)) {
      gruposMap.set(k, {
        key:            k,
        grupoNombre:    item.grupo_recoleccion || item.nombre,
        profesion:      item.profesion,
        lugar:          item.lugar,
        nivel_item:     item.nivel_item,
        nivel_profesion:item.nivel_profesion,
        variantes:      {}
      });
    }
    const g = gruposMap.get(k);
    const v = item.rareza_mat || 'normal';
    g.variantes[v] = item;
    // prefer the normal variant's meta for the group
    if (v === 'normal') {
      g.grupoNombre    = item.grupo_recoleccion || item.nombre;
      g.lugar          = item.lugar || g.lugar;
      g.nivel_item     = item.nivel_item || g.nivel_item;
    }
  });

  return { crafteos, grupos: [...gruposMap.values()] };
}

// ─────────────────────────────────────────────
// FILTROS
// ─────────────────────────────────────────────
function matchesItem(item) {
  const q = searchText.toLowerCase();
  if (q) {
    const inNombre = item.nombre.toLowerCase().includes(q);
    const inAlt    = item.nombre_alternativo && item.nombre_alternativo.toLowerCase().includes(q);
    const inProf   = (item.profesion || '').toLowerCase().includes(q);
    const inTipo   = item.tipo && item.tipo.toLowerCase().includes(q);
    if (!inNombre && !inAlt && !inProf && !inTipo) return false;
  }
  if (categoriaFilter !== 'todo' && item.categoria !== categoriaFilter) return false;
  if (activeProfesiones.size > 0 && !activeProfesiones.has(item.profesion)) return false;
  if (activeRarezas.size > 0 && !activeRarezas.has(item.rareza)) return false;
  if (activeTipos.size > 0 && !activeTipos.has(item.tipo)) return false;
  if (soloRentables) {
    const p = calcProfit(item);
    if (!p || p.profit <= 0) return false;
  }
  const nivelItem = item.nivel_item || null;
  if (nivelMin !== null && (nivelItem === null || nivelItem < nivelMin)) return false;
  if (nivelMax !== null && (nivelItem === null || nivelItem > nivelMax)) return false;
  return true;
}

function matchesGrupo(g) {
  const q = searchText.toLowerCase();
  if (q) {
    const inNombre    = g.grupoNombre.toLowerCase().includes(q);
    const inVariantes = Object.values(g.variantes).some(v => v && v.nombre.toLowerCase().includes(q));
    const inProf      = g.profesion.toLowerCase().includes(q);
    const inLugar     = g.lugar && g.lugar.toLowerCase().includes(q);
    if (!inNombre && !inVariantes && !inProf && !inLugar) return false;
  }
  if (categoriaFilter !== 'todo' && categoriaFilter !== 'recoleccion') return false;
  if (activeProfesiones.size > 0 && !activeProfesiones.has(g.profesion)) return false;
  const nivelGrupo = g.nivel_item || null;
  if (nivelMin !== null && (nivelGrupo === null || nivelGrupo < nivelMin)) return false;
  if (nivelMax !== null && (nivelGrupo === null || nivelGrupo > nivelMax)) return false;
  return true;
}

function _sortVal(item, key) {
  if (key === 'profit')     return calcProfit(item)?.profit     ?? -Infinity;
  if (key === 'profit_pct') return calcProfit(item)?.profitPct  ?? -Infinity;
  if (key === 'vendidos')   return item.vendidos  || 0;
  if (key === 'nivel')      return item.nivel_item || 0;
  return 0;
}

function sortItems(list) {
  return list.slice().sort((a, b) => {
    if (sortBy === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
    const c1 = _sortVal(b, sortBy) - _sortVal(a, sortBy);
    if (c1 !== 0) return c1;
    if (sortSecondary === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
    if (!sortSecondary || sortSecondary === sortBy) return 0;
    return _sortVal(b, sortSecondary) - _sortVal(a, sortSecondary);
  });
}

function setSortBy(val)        { sortBy = val;        render(); }
function setSortSecondary(val) { sortSecondary = val; render(); }

// ─────────────────────────────────────────────
// STOCK INLINE
// ─────────────────────────────────────────────
function _onEnVentaChange(item, oldVal, newVal) {
  if (newVal > 0 && oldVal === 0) item.fecha_en_venta = Date.now();
  if (newVal === 0)               delete item.fecha_en_venta;
}

async function setStock(id, field, value) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  const old = item[field] || 0;
  const val = Math.max(0, parseInt(value, 10) || 0);
  item[field] = val;
  if (field === 'en_venta') _onEnVentaChange(item, old, val);
  if (field === 'comprados' && (item.categoria === 'material' || item.categoria === 'recoleccion'))
    _addStockHist(item.nombre, val);
  render();
  await pushItem(item);
}

function _stockField(eid, field, val, lbl) {
  const w = Math.max(1, String(val).length);
  return `<span class="stock-field">
    <span class="stock-lbl">${lbl}</span>
    <button class="stk-btn" onclick="updateStock('${eid}','${field}',-1)">−</button>
    <input class="stk-val-input" type="number" min="0" value="${val}" style="width:${w}ch"
      oninput="this.style.width=Math.max(1,this.value.length)+'ch'"
      onchange="setStock('${eid}','${field}',this.value);this.style.width=Math.max(1,String(parseInt(this.value)||0).length)+'ch'"
      onkeydown="if(event.key==='Enter')this.blur()"
      title="Editable directamente">
    <button class="stk-btn" onclick="updateStock('${eid}','${field}',1)">+</button>
  </span>`;
}

async function updateStock(id, field, delta) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  const old = item[field] || 0;
  item[field] = Math.max(0, old + delta);
  // Cascada: vendidos+ descuenta en_venta; en_venta+ descuenta comprados
  if (field === 'vendidos' && delta > 0)
    item.en_venta = Math.max(0, (item.en_venta || 0) - 1);
  else if (field === 'en_venta' && delta > 0)
    item.comprados = Math.max(0, (item.comprados || 0) - 1);
  if (field === 'en_venta') _onEnVentaChange(item, old, item.en_venta);
  // Historial de stock para materiales y recolección
  if (field === 'comprados' && (item.categoria === 'material' || item.categoria === 'recoleccion'))
    _addStockHist(item.nombre, item.comprados);
  render();
  await pushItem(item);
}

const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

async function checkCaducados() {
  const now     = Date.now();
  const vencidos = items.filter(i =>
    i.categoria === 'crafteo' &&
    (i.en_venta || 0) > 0 &&
    i.fecha_en_venta &&
    now - i.fecha_en_venta > SEMANA_MS
  );
  if (!vencidos.length) return;
  for (const item of vencidos) {
    item.comprados  = (item.comprados || 0) + (item.en_venta || 0);
    item.caducados  = (item.caducados || 0) + (item.en_venta || 0);
    item.en_venta   = 0;
    delete item.fecha_en_venta;
  }
  render();
  await Promise.all(vencidos.map(i => pushItem(i)));
}

// ─────────────────────────────────────────────
// OPORTUNIDADES DE COMPRA
// ─────────────────────────────────────────────

// Devuelve el historial de precios de un material (real o virtual)
function _getPriceHist(nombre) {
  const realItem = items.find(i =>
    normName(i.nombre) === normName(nombre) &&
    (i.categoria === 'material' || i.categoria === 'recoleccion')
  );
  if (realItem?.historial_precios?.length)
    return realItem.historial_precios.map(e => e.precio).filter(p => p > 0);
  return getCatHist(nombre).map(e => e.precio).filter(p => p > 0);
}

function calcOportunidades() {
  const result = [];
  for (const [key, nombre] of Object.entries(catalogNames)) {
    const precioActual = catalog[key] || 0;
    if (precioActual <= 0) continue;

    const hist = _getPriceHist(nombre);
    if (hist.length < 3) continue;

    const avg = hist.reduce((s, p) => s + p, 0) / hist.length;
    if (avg <= 0) continue;
    const pct = precioActual / avg;
    if (pct >= 0.75) continue;

    // Solo si se usa en crafteos rentables
    const recetas = items.filter(i => {
      if (i.categoria !== 'crafteo') return false;
      const p = calcProfit(i);
      if (!p || p.profit <= 0) return false;
      return getCheapestReceta(i).some(m => normName(m.nombre) === key);
    });
    if (!recetas.length) continue;

    // Cantidad total necesaria por ciclo completo (1× cada receta)
    const qtyPorCiclo = recetas.reduce((s, i) => {
      const m = getCheapestReceta(i).find(m => normName(m.nombre) === key);
      return s + (m?.cantidad || 0);
    }, 0);

    // Multiplicador según descuento
    let mult;
    if      (pct < 0.10) mult = 40;
    else if (pct < 0.25) mult = 20;
    else if (pct < 0.50) mult = 8;
    else                 mult = 3; // < 0.75

    result.push({
      nombre, key, precioActual, avg, pct,
      recetas: recetas.length, qtyPorCiclo,
      sugerido: Math.max(qtyPorCiclo, qtyPorCiclo * mult),
      ahorro: Math.round((avg - precioActual) * qtyPorCiclo * mult),
    });
  }
  return result.sort((a, b) => a.pct - b.pct);
}

function _filterRslList(q) {
  const list = document.getElementById('rsl-list-inner');
  if (!list) return;
  const ql = q.toLowerCase().trim();
  list.querySelectorAll('.rsl-row').forEach(row => {
    const nombre = row.querySelector('.rsl-nombre-txt')?.textContent || '';
    row.style.display = (!ql || nombre.toLowerCase().includes(ql)) ? '' : 'none';
  });
}

// ─────────────────────────────────────────────
// MODO REPONER
// ─────────────────────────────────────────────

// Items crafteo sin nada en venta Y con profit ≥ 50% y > 6.000 netos
function calcReponerItems() {
  return items.filter(i => {
    if (i.categoria !== 'crafteo') return false;
    if (reponerProfFilter.size > 0 && !reponerProfFilter.has(i.profesion)) return false;
    if ((i.comprados || 0) > 0) return false;
    if ((i.en_venta || 0) > 0) return false;
    const p = calcProfit(i);
    if (!p || p.profitPct === null) return false;
    return p.profitPct >= 50 && p.profit > 6000;
  });
}

function toggleReponerMode() {
  reponerMode = !reponerMode;
  if (reponerMode) { publicarMode = false; document.getElementById('toggle-publicar')?.classList.remove('on'); }
  document.getElementById('toggle-reponer')?.classList.toggle('on', reponerMode);
  render();
}

function togglePublicarMode() {
  publicarMode = !publicarMode;
  if (publicarMode) { reponerMode = false; document.getElementById('toggle-reponer')?.classList.remove('on'); }
  document.getElementById('toggle-publicar')?.classList.toggle('on', publicarMode);
  render();
}

function toggleReponerSort() {
  reponerSortAsc = !reponerSortAsc;
  const el = document.getElementById('reponer-panel');
  if (el) el.innerHTML = _buildReponerPanelHtml(calcReponerItems());
}

function toggleReponerHidden(id) {
  if (_reponerHiddenIds.has(id)) _reponerHiddenIds.delete(id);
  else _reponerHiddenIds.add(id);
  localStorage.setItem('reponerHiddenIds', JSON.stringify([..._reponerHiddenIds]));
  const el = document.getElementById('reponer-panel');
  if (el) el.innerHTML = _buildReponerPanelHtml(calcReponerItems());
}

function toggleReponerProfFilter(p) {
  reponerProfFilter.has(p) ? reponerProfFilter.delete(p) : reponerProfFilter.add(p);
  const el = document.getElementById('reponer-panel');
  if (el) el.innerHTML = _buildReponerPanelHtml(calcReponerItems());
}

function setReponerQty(id, delta) {
  const next = Math.max(1, (_reponerQty.get(id) || 1) + delta);
  if (next === 1) _reponerQty.delete(id); else _reponerQty.set(id, next);
  const el = document.getElementById('reponer-panel');
  if (el) el.innerHTML = _buildReponerPanelHtml(calcReponerItems());
}

function highlightMats(id) {
  clearMatHighlights();
  const item = items.find(i => i.id === id);
  if (!item) return;
  const usedKeys = new Set();
  const usedSubIds = new Set();
  function _collect(mats, depth) {
    if (depth > 6) return;
    for (const m of (mats || [])) {
      const info = getMatInfo(m);
      if (info.modo === 'crafteo' && m.item_id) {
        const sub = items.find(i => i.id === m.item_id);
        if (sub) {
          usedSubIds.add(m.item_id);
          _collect(getCheapestReceta(sub), depth + 1);
          continue;
        }
      }
      const ref   = m.item_id ? items.find(i => i.id === m.item_id) : null;
      const label = ref ? (ref.rareza ? `${ref.nombre} [${ref.rareza}]` : ref.nombre) : m.nombre;
      usedKeys.add(normName(label));
    }
  }
  _collect(getCheapestReceta(item), 0);

  document.querySelectorAll('#rsl-list-inner .rsl-row').forEach(row => {
    if (usedKeys.has(row.dataset.nombreKey)) row.classList.add('rsl-row-highlight');
  });
  document.querySelectorAll('.rsl-crafteos-list .rsl-c-row[data-item-id]').forEach(row => {
    if (usedSubIds.has(row.dataset.itemId)) row.classList.add('rsl-row-highlight');
  });
}

function clearMatHighlights() {
  document.querySelectorAll('.rsl-row-highlight')
    .forEach(row => row.classList.remove('rsl-row-highlight'));
}

function _filterPubList(val) {
  _pubSearchText = val;
  const q = val.toLowerCase();
  document.querySelectorAll('#pub-list-inner .rsl-c-row').forEach(row => {
    row.style.display = (!q || (row.dataset.nombre || '').includes(q)) ? '' : 'none';
  });
}

function _filterPendList(val) {
  _pendSearchText = val;
  const q = val.toLowerCase();
  document.querySelectorAll('#pend-list-inner .rsl-c-row').forEach(row => {
    row.style.display = (!q || (row.dataset.nombre || '').includes(q)) ? '' : 'none';
  });
}

// Items crafteo con algo comprado pero nada en venta Y con profit ≥ 50% y > 8.000 netos
function calcPublicarItems() {
  return items.filter(i => {
    if (i.categoria !== 'crafteo') return false;
    if ((i.comprados || 0) === 0) return false;
    if ((i.en_venta || 0) > 0) return false;
    const p = calcProfit(i);
    if (!p || p.profitPct === null) return false;
    return p.profitPct >= 50 && p.profit > 6000;
  });
} 

function calcPendientesVender() {
  return items.filter(i => i.categoria === 'crafteo' && (i.en_venta || 0) > 0);
}

async function publicarUno(id) {
  const item = items.find(i => i.id === id);
  if (!item || (item.comprados || 0) === 0) return;
  const oldEV = item.en_venta || 0;
  item.comprados = (item.comprados || 0) - 1;
  item.en_venta  = oldEV + 1;
  _onEnVentaChange(item, oldEV, item.en_venta);
  render();
  await pushItem(item);
}

async function publicarTodosPublicar() {
  const toPub = calcPublicarItems();
  if (!toPub.length) return;
  for (const item of toPub) {
    const oldEV   = item.en_venta || 0;
    item.en_venta  = oldEV + (item.comprados || 0);
    item.comprados = 0;
    _onEnVentaChange(item, oldEV, item.en_venta);
  }
  render();
  await Promise.all(toPub.map(i => pushItem(i)));
}

function _buildPublicarPanelHtml(pubItems) {
  const totalUnits = pubItems.reduce((s, i) => s + (i.comprados || 0), 0);
  const rows = pubItems.map(i => {
    const p          = calcProfit(i);
    const rClass     = rarezaClass(i.rareza);
    const emoji      = PROF_EMOJI[i.profesion] || '🔨';
    const eid        = i.id.replace(/'/g, "\\'");
    const profitStr  = p ? `<span class="rsl-c-profit profit-pos">+${fmtK(p.profit)}</span><span class="rsl-c-pct">${fmtPct(p.profitPct)}</span>` : '';
    const stale      = isPriceStale(i);
    const lastPrecio = i.historial_precios?.length ? i.historial_precios.reduce((a,b) => b.fecha > a.fecha ? b : a).precio : 0;
    const pw         = Math.max(2, String(lastPrecio || '').length);
    const priceHtml  = `<span class="rsl-c-price-wrap">
      <input class="rsl-precio-input" type="number" min="0" placeholder="—" value="${lastPrecio || ''}"
        style="width:${pw}ch" oninput="this.style.width=Math.max(2,this.value.length)+'ch'"
        onkeydown="if(event.key==='Enter')addPriceRsl('${eid}',this)"
        onblur="if(this.value)addPriceRsl('${eid}',this)"
        title="Precio de venta">
      ${stale ? `<span class="stale-icon rsl-stale" title="Precio desactualizado (>6h)">⏱</span>` : ''}
    </span>`;
    return `<div class="rsl-c-row" data-nombre="${i.nombre.toLowerCase()}">
      <span class="rsl-c-emoji">${emoji}</span>
      <span class="rsl-c-nombre" onclick="openModal('${eid}')" style="cursor:pointer">${i.nombre}</span>
      ${i.rareza ? `<span class="loot-rareza-badge ${rClass}" style="font-size:0.6rem;padding:0 5px;flex-shrink:0">${i.rareza}</span>` : ''}
      <span class="pub-comprados">🔨 ${i.comprados}</span>
      <span class="rsl-c-spacer"></span>
      ${priceHtml}
      ${profitStr}
      <button class="reponer-btn reponer-btn-pub pub-btn" onclick="publicarUno('${eid}')">🏷 +1</button>
    </div>`;
  }).join('');
  const totalProfit = pubItems.reduce((s, i) => { const p = calcProfit(i); return s + (p ? p.profit : 0); }, 0);

  // Sección pendientes de vender
  const pendientes = calcPendientesVender();
  const pendientesRows = pendientes.map(i => {
    const p          = calcProfit(i);
    const rClass     = rarezaClass(i.rareza);
    const emoji      = PROF_EMOJI[i.profesion] || '🔨';
    const eid        = i.id.replace(/'/g, "\\'");
    const profitStr  = p ? `<span class="rsl-c-profit profit-pos">+${fmtK(p.profit)}</span><span class="rsl-c-pct">${fmtPct(p.profitPct)}</span>` : '';
    const stale      = isPriceStale(i);
    const lastPrecio = i.historial_precios?.length ? i.historial_precios.reduce((a,b) => b.fecha > a.fecha ? b : a).precio : 0;
    const pw         = Math.max(2, String(lastPrecio || '').length);
    const priceHtml  = `<span class="rsl-c-price-wrap">
      <input class="rsl-precio-input" type="number" min="0" placeholder="—" value="${lastPrecio || ''}"
        style="width:${pw}ch" oninput="this.style.width=Math.max(2,this.value.length)+'ch'"
        onkeydown="if(event.key==='Enter')addPriceRsl('${eid}',this)"
        onblur="if(this.value)addPriceRsl('${eid}',this)"
        title="Precio de venta">
      ${stale ? `<span class="stale-icon rsl-stale" title="Precio desactualizado (>6h)">⏱</span>` : ''}
    </span>`;
    const diasEnVenta = i.fecha_en_venta ? Math.floor((Date.now() - i.fecha_en_venta) / 86400000) : null;
    const diasHtml = diasEnVenta !== null
      ? `<span class="pub-dias ${diasEnVenta >= 6 ? 'pub-dias-caduca' : ''}" title="${diasEnVenta >= 6 ? 'Caduca pronto' : ''}">⏳ ${diasEnVenta}d</span>`
      : '';
    return `<div class="rsl-c-row" data-nombre="${i.nombre.toLowerCase()}">
      <span class="rsl-c-emoji">${emoji}</span>
      <span class="rsl-c-nombre" onclick="openModal('${eid}')" style="cursor:pointer">${i.nombre}</span>
      ${i.rareza ? `<span class="loot-rareza-badge ${rClass}" style="font-size:0.6rem;padding:0 5px;flex-shrink:0">${i.rareza}</span>` : ''}
      <span class="pub-comprados" style="color:var(--gold)">🏷 ${i.en_venta}</span>
      <span class="rsl-c-spacer"></span>
      ${diasHtml}
      ${priceHtml}
      ${profitStr}
      <button class="reponer-btn reponer-btn-confirm pub-btn" onclick="updateStock('${eid}','vendidos',1)" title="Marcar 1 como vendido">✓ Vendido</button>
    </div>`;
  }).join('');

  const totalBeneficio = pendientes.reduce((s, i) => {
    const p = calcProfit(i);
    return s + (p ? p.profit * (i.en_venta || 0) : 0);
  }, 0);
  const pendientesSection = pendientes.length ? `
    <div class="rsl-crafteos-head" style="color:var(--gold);display:flex;align-items:center;justify-content:space-between;padding-right:14px">
      <span>🏷 Pendientes de vender (${pendientes.length})</span>
      ${totalBeneficio > 0 ? `<span style="font-family:'Cinzel',serif;font-size:0.7rem;color:var(--green)">Beneficio esperado: +${fmtK(totalBeneficio)}</span>` : ''}
    </div>
    <div class="rsl-search-wrap">
      <input class="rsl-search" type="text" placeholder="⌕ Buscar item…" value="${_pendSearchText.replace(/"/g,'&quot;')}"
        oninput="_filterPendList(this.value)">
    </div>
    <div class="rsl-crafteos-list" id="pend-list-inner">${pendientesRows}</div>` : '';

  return `<div class="publicar-panel-inner">
    <div class="reponer-panel-head">
      <span>🏷 <strong>${pubItems.length}</strong> items · <strong>${totalUnits}</strong> unidades · profit estimado: <strong style="color:var(--green);font-family:'Cinzel',serif">+${fmtK(totalProfit)}</strong></span>
      <div class="reponer-btns">
        <button class="reponer-btn reponer-btn-pub" onclick="publicarTodosPublicar()">🏷 Publicar todos</button>
      </div>
    </div>
    <div class="rsl-search-wrap">
      <input class="rsl-search" type="text" placeholder="⌕ Buscar item…" value="${_pubSearchText.replace(/"/g,'&quot;')}"
        oninput="_filterPubList(this.value)">
    </div>
    ${pubItems.length ? `<div class="pub-list" id="pub-list-inner">${rows}</div>` : `<div class="reponer-empty">Sin items crafteados sin publicar con profit ≥ 50% y &gt; 8.000 netos.</div>`}
    ${pendientesSection}
  </div>`;
}

// Descuenta materiales recursivamente igual que _agregarMats: expande sub-crafteos en modo 'crafteo'
// stockUsed: Map<item_id, qty> para rastrear stock de sub-crafteos ya asignado (solo en flujo reponer)
function _descontarMats(materiales, multiplicador, resultMap, depth = 0, stockUsed = null) {
  if (depth > 6) return;
  for (const m of (materiales || [])) {
    const qty  = (m.cantidad || 1) * multiplicador;
    const info = getMatInfo(m);
    if (info.modo === 'crafteo' && m.item_id) {
      const subItem = items.find(i => i.id === m.item_id);
      const subReceta = subItem ? getCheapestReceta(subItem) : null;
      if (subReceta?.length) {
        if (stockUsed !== null) {
          const stockItem = subItem.rareza
            ? (items.find(i => normName(i.nombre) === normName(subItem.nombre) && i.rareza === subItem.rareza) || subItem)
            : (findMatItem(subItem.nombre) || subItem);
          const used      = stockUsed.get(stockItem.id) || 0;
          const avail     = Math.max(0, (stockItem.comprados || 0) - used);
          const fromStock = Math.min(qty, avail);
          const toCraft   = qty - fromStock;
          if (fromStock > 0) {
            stockUsed.set(stockItem.id, used + fromStock);
            resultMap.set(stockItem.id, (resultMap.get(stockItem.id) || 0) + fromStock);
          }
          if (toCraft > 0) _descontarMats(subReceta, toCraft, resultMap, depth + 1, stockUsed);
        } else {
          _descontarMats(subReceta, qty, resultMap, depth + 1, null);
        }
        continue;
      }
    }
    const matItem = m.item_id ? items.find(i => i.id === m.item_id) : findMatItem(m.nombre);
    if (!matItem) continue;
    resultMap.set(matItem.id, (resultMap.get(matItem.id) || 0) + qty);
  }
}

// Calcula qué se consumiría al craftear los items dados (matItem.id → qty)
function _calcCraftearMats(itemsToCraft) {
  const mats = new Map();
  for (const item of itemsToCraft) _descontarMats(getCheapestReceta(item), 1, mats);
  return mats;
}

// Entra en modo preview mostrando el consumo antes de confirmar
function previewCraftear(itemsToCraft) {
  if (!itemsToCraft.length) return;
  craftearPreview = { crafteos: itemsToCraft, mats: _calcCraftearMats(itemsToCraft) };
  render();
}

function previewCraftearUno(id) {
  const item = items.find(i => i.id === id);
  if (item) previewCraftear([item]);
}

function cancelCraftear() {
  craftearPreview = null;
  render();
}

async function confirmCraftear() {
  if (!craftearPreview) return;
  const { crafteos, qtyMap } = craftearPreview;
  craftearPreview = null;
  // Calcular consumo expandiendo sub-crafteos igual que _agregarMats
  const matMap = new Map(); // matItem.id → qty a descontar
  const stockUsed = qtyMap ? new Map() : null; // solo en flujo reponer: usa stock de sub-crafteos
  for (const item of crafteos) _descontarMats(getCheapestReceta(item), qtyMap?.get(item.id) || 1, matMap, 0, stockUsed);
  // Aplicar descuentos y actualizar stock
  const matModificados = new Map();
  for (const [id, qty] of matMap) {
    const matItem = items.find(i => i.id === id);
    if (!matItem) continue;
    matItem.comprados = Math.max(0, (matItem.comprados || 0) - qty);
    if (matItem.categoria === 'material' || matItem.categoria === 'recoleccion')
      _addStockHist(matItem.nombre, matItem.comprados);
    matModificados.set(id, matItem);
  }
  for (const item of crafteos) item.comprados = (item.comprados || 0) + (qtyMap?.get(item.id) || 1);
  render();
  await Promise.all([
    ...crafteos.map(i => pushItem(i)),
    ...[...matModificados.values()].map(i => pushItem(i))
  ]);
}

function craftearTodosReponer() {
  const todos = calcReponerItems().filter(i => !_reponerHiddenIds.has(i.id));
  todos.forEach(i => _reponerCraftSelIds.add(i.id));
  const el = document.getElementById('reponer-panel');
  if (el) el.innerHTML = _buildReponerPanelHtml(calcReponerItems());
}

function toggleReponerCraftSel(id) {
  if (_reponerCraftSelIds.has(id)) _reponerCraftSelIds.delete(id);
  else _reponerCraftSelIds.add(id);
  const el = document.getElementById('reponer-panel');
  if (el) el.innerHTML = _buildReponerPanelHtml(calcReponerItems());
}

function cancelarSelReponer() {
  _reponerCraftSelIds.clear();
  const el = document.getElementById('reponer-panel');
  if (el) el.innerHTML = _buildReponerPanelHtml(calcReponerItems());
}

async function confirmarReponerSel() {
  const crafteos = items.filter(i => _reponerCraftSelIds.has(i.id));
  const qtyMap = new Map(crafteos.map(i => [i.id, _reponerQty.get(i.id) || 1]));
  _reponerCraftSelIds.clear();
  if (!crafteos.length) return;
  craftearPreview = { crafteos, mats: new Map(), qtyMap };
  await confirmCraftear();
}

// Mueve 1 de comprados → en_venta en todos los que tienen stock sin listar
async function publicarReponer() {
  const toPub = items.filter(i =>
    i.categoria === 'crafteo' && (i.comprados || 0) > 0 && (i.en_venta || 0) === 0
  );
  if (!toPub.length) return;
  for (const item of toPub) {
    item.en_venta  = (item.en_venta  || 0) + 1;
    item.comprados = Math.max(0, (item.comprados || 0) - 1);
  }
  render();
  await Promise.all(toPub.map(i => pushItem(i)));
}

// Devuelve { equipoHtml, basicoHtml } separando equipos (rareza/tipo) de materiales básicos
function _renderSubCrafteos(subCrafteos, reponerItems) {
  const reponerIds = new Set(reponerItems.map(i => i.id));
  const subList = [...subCrafteos.values()]
    .filter(sc => !reponerIds.has(sc.item?.id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  if (!subList.length) return { equipoHtml: '', basicoHtml: '' };

  const equipos = subList.filter(sc => sc.item?.rareza || sc.item?.tipo);
  const basicos = subList.filter(sc => !sc.item?.rareza && !sc.item?.tipo);

  function _scRow(sc) {
    const emoji = PROF_EMOJI[sc.item?.profesion] || '🔨';
    const p     = calcProfit(sc.item);
    const profitStr = p
      ? `<span class="rsl-c-profit profit-pos">+${fmtK(p.profit)}</span><span class="rsl-c-pct">${fmtPct(p.profitPct)}</span>`
      : '';
    const eid   = sc.item?.id.replace(/'/g, "\\'") || '';
    const stale = sc.item ? isPriceStale(sc.item) : false;
    const lastPrecio = sc.item?.historial_precios?.length ? sc.item.historial_precios.reduce((a,b) => b.fecha > a.fecha ? b : a).precio : 0;
    const pw    = Math.max(2, String(lastPrecio || '').length);
    const priceHtml = eid ? `<span class="rsl-c-price-wrap">
      <input class="rsl-precio-input" type="number" min="0" placeholder="—" value="${lastPrecio || ''}"
        style="width:${pw}ch" oninput="this.style.width=Math.max(2,this.value.length)+'ch'"
        onkeydown="if(event.key==='Enter')addPriceRsl('${eid}',this)"
        onblur="if(this.value)addPriceRsl('${eid}',this)"
        title="Precio de venta">
      ${stale ? `<span class="stale-icon rsl-stale" title="Precio desactualizado (>6h)">⏱</span>` : ''}
    </span>` : '';
    return [emoji, p, profitStr, eid, priceHtml];
  }

  const equipoHtml = equipos.map(sc => {
    const [emoji, , profitStr, eid, priceHtml] = _scRow(sc);
    const rClass = rarezaClass(sc.item?.rareza);
    const toCraft = sc.qty - (sc.qtyFromStock || 0);
    const stockTotal = sc.stockItemId ? (items.find(i => i.id === sc.stockItemId)?.comprados || 0) : (sc.item?.comprados || 0);
    const sidEsc = (sc.stockItemId || sc.item?.id || '').replace(/'/g, "\\'");
    const stockInfo = sidEsc ? `<span class="rsl-tienes-wrap">📦<input class="rsl-stock-input rsl-tienes-input" type="number" min="0" value="${stockTotal}" style="width:${Math.max(1,String(stockTotal).length)}ch" oninput="this.style.width=Math.max(1,this.value.length)+'ch'" onchange="setStock('${sidEsc}','comprados',this.value)" onkeydown="if(event.key==='Enter')this.blur()" title="Tienes en almacén"></span>` : '';
    const qtyHtml = toCraft > 0
      ? `<span class="rsl-c-qty">×${toCraft}</span>${stockInfo}`
      : `<span class="rsl-stock-badge rsl-stock-badge-full" title="Cubierto por almacén — ir a recoger">×${sc.qtyFromStock} recoger</span>${stockInfo}`;
    return `<div class="rsl-c-row"${eid ? ` data-item-id="${sc.item?.id}" onmouseenter="highlightMats('${eid}')" onmouseleave="clearMatHighlights()"` : ''}>
      <span class="rsl-c-emoji">${emoji}</span>
      <span class="rsl-c-nombre" ${eid ? `onclick="openModal('${eid}')" style="cursor:pointer"` : ''}>${sc.nombre}<span class="rsl-ingrediente-sub">(ingrediente)</span></span>
      ${sc.item?.rareza ? `<span class="loot-rareza-badge ${rClass}" style="font-size:0.6rem;padding:0 5px;flex-shrink:0">${sc.item.rareza}</span>` : ''}
      ${qtyHtml}
      <span class="rsl-c-spacer"></span>
      ${priceHtml}
      ${profitStr}
      <button class="rsl-c-craft-btn" style="opacity:0;pointer-events:none" aria-hidden="true">🔨</button>
    </div>`;
  }).join('');

  const basicoHtml = basicos.length
    ? `<div class="rsl-sub-crafteos-head">🧱 Crafteos básicos</div>` + basicos.map(sc => {
        const [emoji, , profitStr, eid, priceHtml] = _scRow(sc);
        const toCraft = sc.qty - (sc.qtyFromStock || 0);
        const stockTotal = sc.stockItemId ? (items.find(i => i.id === sc.stockItemId)?.comprados || 0) : (sc.item?.comprados || 0);
        const sidEsc = (sc.stockItemId || sc.item?.id || '').replace(/'/g, "\\'");
        const stockInfo = sidEsc ? `<span class="rsl-tienes-wrap">📦<input class="rsl-stock-input rsl-tienes-input" type="number" min="0" value="${stockTotal}" style="width:${Math.max(1,String(stockTotal).length)}ch" oninput="this.style.width=Math.max(1,this.value.length)+'ch'" onchange="setStock('${sidEsc}','comprados',this.value)" onkeydown="if(event.key==='Enter')this.blur()" title="Tienes en almacén"></span>` : '';
        const qtyHtml = toCraft > 0
          ? `<span class="rsl-c-qty">×${toCraft}</span>${stockInfo}`
          : `<span class="rsl-stock-badge rsl-stock-badge-full" title="Cubierto por almacén — ir a recoger">×${sc.qtyFromStock} recoger</span>${stockInfo}`;
        return `<div class="rsl-c-row"${eid ? ` data-item-id="${sc.item?.id}" onmouseenter="highlightMats('${eid}')" onmouseleave="clearMatHighlights()"` : ''}>
          <span class="rsl-c-emoji">${emoji}</span>
          <span class="rsl-c-nombre">${sc.nombre}</span>
          ${qtyHtml}
          <span class="rsl-c-spacer"></span>
          ${priceHtml}
          ${profitStr}
        </div>`;
      }).join('')
    : '';

  return { equipoHtml, basicoHtml };
}

function _buildReponerPanelHtml(reponerItems) {
  const profFilterHtml = `<div class="rsl-prof-filter">
    ${PROFESIONES_CRAFTEO.map(p => `<button class="rsl-prof-btn${reponerProfFilter.has(p) ? ' rsl-prof-btn-active' : ''}" onclick="toggleReponerProfFilter('${p.replace(/'/g,"\\'")}')" title="${p}">${PROF_EMOJI[p] || p}</button>`).join('')}
  </div>`;
  if (!reponerItems.length) {
    return `<div class="reponer-panel-inner">${profFilterHtml}<div class="reponer-empty">Sin items a reponer con profit ≥ 50% y &gt; 8.000 netos sin stock en venta.</div></div>`;
  }

  // Agrega materiales a comprar de forma recursiva:
  // si un ingrediente tiene item_id y craftearlo es más barato, expande sus propios ingredientes
  const mats = new Map();
  const subCrafteos = new Map(); // item_id → {nombre, qty, qtyFromStock, item}
  const _subStockUsed = new Map(); // item_id → qty de comprados ya asignados a reponer
  function _agregarMats(materiales, multiplicador, depth) {
    if (depth > 6) return; // seguridad ante ciclos
    for (const m of (materiales || [])) {
      const qty  = (m.cantidad || 1) * multiplicador;
      const info = getMatInfo(m);
      if (info.modo === 'crafteo' && m.item_id) {
        // más barato craftear → usar stock existente primero, luego expandir ingredientes
        const subItem = items.find(i => i.id === m.item_id);
        const subReceta = subItem ? getCheapestReceta(subItem) : null;
        if (subReceta?.length) {
          const stockItem = subItem.rareza
            ? (items.find(i => normName(i.nombre) === normName(subItem.nombre) && i.rareza === subItem.rareza) || subItem)
            : (findMatItem(subItem.nombre) || subItem);
          const used      = _subStockUsed.get(stockItem.id) || 0;
          const avail     = Math.max(0, (stockItem.comprados || 0) - used);
          const fromStock = Math.min(qty, avail);
          const toCraft   = qty - fromStock;
          if (fromStock > 0) _subStockUsed.set(stockItem.id, used + fromStock);
          if (!subCrafteos.has(m.item_id)) subCrafteos.set(m.item_id, { nombre: subItem.nombre, qty: 0, qtyFromStock: 0, item: subItem, stockItemId: stockItem.id });
          const sc = subCrafteos.get(m.item_id);
          sc.qty += qty;
          sc.qtyFromStock += fromStock;
          if (toCraft > 0) _agregarMats(subReceta, toCraft, depth + 1);
          continue;
        }
      }
      // comprar: añadir con nombre + rareza si aplica
      const ref    = m.item_id ? items.find(i => i.id === m.item_id) : null;
      const label  = ref
        ? (ref.rareza ? `${ref.nombre} [${ref.rareza}]` : ref.nombre)
        : m.nombre;
      const k      = normName(label);
      const precio = info.precio;
      if (!mats.has(k)) mats.set(k, { nombre: label, qty: 0, precio: 0, nombreBase: ref?.nombre || m.nombre });
      const entry  = mats.get(k);
      entry.qty   += qty;
      if (precio > 0) entry.precio = precio;
    }
  }
  for (const item of reponerItems) {
    if (!_reponerHiddenIds.has(item.id)) _agregarMats(getCheapestReceta(item), _reponerQty.get(item.id) || 1, 0);
  }
  const matList   = [...mats.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const stockCost = [...subCrafteos.values()].reduce((s, sc) => {
    if (!sc.qtyFromStock || !sc.item) return s;
    const pc = getPrecioActual(sc.item) || getCatalogPrice(sc.nombre);
    const pf = calcCoste(sc.item);
    const p  = (pf > 0 && pc > 0) ? Math.min(pf, pc) : (pf > 0 ? pf : pc);
    return s + p * sc.qtyFromStock;
  }, 0);
  const totalCost = matList.reduce((s, m) => s + m.precio * m.qty, 0) + stockCost;

  // Mapa de consumo para items seleccionados (para mostrar −qty en la lista de materiales)
  const selMats = (() => {
    if (!_reponerCraftSelIds.size) return new Map();
    const m = new Map();
    for (const i of items.filter(i => _reponerCraftSelIds.has(i.id)))
      _descontarMats(getCheapestReceta(i), _reponerQty.get(i.id) || 1, m);
    return m;
  })();

  // Auto-crear items de 'material' para Superglú que aún no tengan entrada en items
  for (const m of matList) {
    const nombre = (m.nombreBase || m.nombre).trim();
    const info = _inferMatBase(nombre);
    if (info?.isSuperglu && !findMatItem(nombre)) {
      const precioCat = getCatalogPrice(nombre);
      const newItem = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        nombre, rareza_mat: null, grupo_recoleccion: null, lugar: null,
        profesion: '', categoria: 'material',
        nivel_item: null, nivel_profesion: null, tipo: null, rareza: null,
        materiales: [], comprados: 0, en_venta: 0, vendidos: 0,
        historial_precios: precioCat > 0 ? [{ precio: precioCat, fecha: Date.now(), vendido: false }] : [],
        coste_base: null
      };
      items.push(newItem);
      pushItem(newItem).catch(e => console.error(e));
    }
  }

  // Items crafteados sin publicar (para mostrar botón publicar)
  const pendingPub = items.filter(i =>
    i.categoria === 'crafteo' && (i.comprados || 0) > 0 && (i.en_venta || 0) === 0
  );

  const matRows = matList.map(m => {
    const matItem  = findMatItem(m.nombreBase || m.nombre);
    const crafteoRef = items.find(i => i.categoria === 'crafteo' && normName(i.nombre) === normName(m.nombreBase || m.nombre));
    const precioCreacion = crafteoRef ? calcCoste(crafteoRef) : 0;
    const stockAct = matItem ? (matItem.comprados || 0) : 0;
    const falta    = Math.max(0, m.qty - stockAct);
    const midEsc   = matItem ? matItem.id.replace(/'/g, "\\'") : '';
    const nEsc     = (m.nombreBase || m.nombre).replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const stockInput = matItem
      ? `<input class="rsl-stock-input" type="number" min="0" value="${stockAct}"
           style="width:${Math.max(1,String(stockAct).length)}ch"
           oninput="this.style.width=Math.max(1,this.value.length)+'ch'"
           onchange="setStock('${midEsc}','comprados',this.value)"
           onkeydown="if(event.key==='Enter')this.blur()">`
      : `<span class="rsl-stock-input" style="color:var(--muted)">${stockAct}</span>`;
    const faltaHtml = falta > 0
      ? `<span class="rsl-falta">faltan ${falta}</span>`
      : `<span class="rsl-ok">✓</span>`;
    const precioW = Math.max(1, String(m.precio || '').length);
    const precioInput = `<input class="rsl-precio-input" type="number" min="0"
      value="${m.precio || ''}" placeholder="—"
      style="width:${precioW}ch"
      oninput="this.style.width=Math.max(1,this.value.length)+'ch'"
      onchange="updateCatalogPrice('${nEsc}',this.value);this.style.width=Math.max(1,String(parseInt(this.value)||0).length)+'ch'"
      onkeydown="if(event.key==='Enter')this.blur()"
      title="Precio unitario · actualiza catálogo e historial">`;
    return `<div class="rsl-row" data-nombre-key="${normName(m.nombreBase || m.nombre)}">
      <span class="rsl-nombre"><button class="rsl-copy-btn" onclick="navigator.clipboard.writeText('${m.nombre.replace(/'/g,"\\'")}');this.textContent='✅';setTimeout(()=>this.textContent='📋',1200)" title="Copiar nombre">📋</button><span class="rsl-nombre-txt"${matItem ? ` onclick="openModal('${matItem.id.replace(/'/g,"\\'")}')" style="cursor:pointer"` : ''}>${m.nombre}</span></span>
      <span class="rsl-qty">×${m.qty}</span>
      <span class="rsl-stock ${falta > 0 ? 'rsl-low' : 'rsl-ok'}">${matItem && stockAct === 0 ? `<button class="rsl-stock-icon-btn" onclick="setStock('${midEsc}','comprados',${m.qty})" title="Poner stock a ${m.qty}">📦</button>` : '📦'} ${stockInput} ${faltaHtml}${(() => { const c = matItem ? (selMats.get(matItem.id) || 0) : 0; return c > 0 ? `<span class="rsl-consume">−${c}</span>` : ''; })()}</span>
      <span class="rsl-precio-wrap">🏷 ${precioInput}${precioCreacion > 0 ? `<span class="rsl-crafteo-dim" title="Coste de craftear (vs comprar)">⚒ ${fmtK(precioCreacion)}</span>` : ''}</span>
      ${m.precio > 0 ? `<span class="rsl-coste">${fmtK(m.precio * m.qty)}${precioCreacion > 0 ? `<span class="rsl-crafteo-dim"> / ${fmtK(precioCreacion * m.qty)}</span>` : ''}</span>` : '<span class="rsl-coste" style="color:var(--muted)">—</span>'}
    </div>`;
  }).join('');

  return `<div class="reponer-panel-inner">
    <div class="reponer-panel-head">
      <span>↺ <strong>${reponerItems.length}</strong> items a reponer · coste estimado: <strong class="reponer-coste">${totalCost > 0 ? fmtK(totalCost) : '—'}</strong></span>
      <div class="reponer-btns">
        <button class="reponer-btn" onclick="craftearTodosReponer()" title="Marca todos los items para craftear">🔨 Craftear todos</button>
        ${_reponerCraftSelIds.size > 0 ? `<button class="reponer-btn reponer-btn-cancel" onclick="cancelarSelReponer()">✕ Cancelar</button>` : ''}
        ${pendingPub.length ? `<button class="reponer-btn reponer-btn-pub" onclick="publicarReponer()" title="Mueve 1 de Crafteados a En Venta en los ${pendingPub.length} items pendientes">🏷 Publicar (${pendingPub.length})</button>` : ''}
      </div>
    </div>
    ${profFilterHtml}
    <div class="rsl-search-wrap">
      <input class="rsl-search" type="text" placeholder="⌕ Filtrar material…"
        oninput="_filterRslList(this.value)">
    </div>
    <div class="rsl-list" id="rsl-list-inner">
      ${matRows}
      ${totalCost > 0 ? `<div class="rsl-total">Total materiales: <strong>${fmtK(totalCost)}</strong></div>` : ''}
    </div>
    ${_reponerCraftSelIds.size > 0 ? `<button class="reponer-btn reponer-btn-confirm rsl-confirm-btn" onclick="confirmarReponerSel()">✅ Confirmar crafteo (${_reponerCraftSelIds.size})</button>` : ''}
    <div class="rsl-crafteos-head">🔨 Qué voy a craftear
      <button class="rsl-sort-btn" onclick="toggleReponerSort()" title="Cambiar orden por nivel">
        ${reponerSortAsc ? '↑ Nivel' : '↓ Nivel'}
      </button>
    </div>
    <div class="rsl-crafteos-list">
      ${[...reponerItems].sort((a, b) => {
          const d = ((a.nivel_item || 0) - (b.nivel_item || 0)) || ((a.nivel_profesion || 0) - (b.nivel_profesion || 0));
          return reponerSortAsc ? d : -d;
        }).map(i => {
        const p      = calcProfit(i);
        const rClass = rarezaClass(i.rareza);
        const emoji  = PROF_EMOJI[i.profesion] || '🔨';
        const profitStr = p ? `<span class="rsl-c-profit profit-pos">+${fmtK(p.profit)}</span><span class="rsl-c-pct">${fmtPct(p.profitPct)}</span>` : '';
        const eid    = i.id.replace(/'/g, "\\'");
        const hidden = _reponerHiddenIds.has(i.id);

        // Cuántas unidades de este item necesitan otros reponerItems como ingrediente (modo crafteo)
        let qtyIngrediente = 0;
        for (const other of reponerItems) {
          if (other.id === i.id) continue;
          for (const m of (other.materiales || [])) {
            if (m.item_id === i.id && getMatInfo(m).modo === 'crafteo')
              qtyIngrediente += (m.cantidad || 1);
          }
        }
        const userQty = _reponerQty.get(i.id) || 1;
        const totalCraftear = userQty + qtyIngrediente;
        const qtyHtml = `<span class="rsl-c-qty-wrap">
          <button class="rsl-qty-btn" onclick="event.stopPropagation();setReponerQty('${eid}',-1)">−</button>
          <span class="rsl-c-qty">×${totalCraftear}</span>
          <button class="rsl-qty-btn" onclick="event.stopPropagation();setReponerQty('${eid}',1)">+</button>
          ${qtyIngrediente > 0 ? `<span class="rsl-c-usado">(×${userQty} craftear · ×${qtyIngrediente} ing.)</span>` : ''}
        </span>`;

        const stale = isPriceStale(i);
        const lastPrecio = i.historial_precios?.length ? i.historial_precios.reduce((a,b) => b.fecha > a.fecha ? b : a).precio : 0;
        const pw = Math.max(2, String(lastPrecio || '').length);
        const priceHtml = `<span class="rsl-c-price-wrap">
          <input class="rsl-precio-input" type="number" min="0" placeholder="—" value="${lastPrecio || ''}"
            style="width:${pw}ch" oninput="this.style.width=Math.max(2,this.value.length)+'ch'"
            onkeydown="if(event.key==='Enter')addPriceRsl('${eid}',this)"
            onblur="if(this.value)addPriceRsl('${eid}',this)"
            title="Precio de venta">
          ${stale ? `<span class="stale-icon rsl-stale" title="Precio desactualizado (>6h)">⏱</span>` : ''}
        </span>`;

        const isSel = _reponerCraftSelIds.has(i.id);
        return `<div class="rsl-c-row${isSel ? ' rsl-c-row-preview' : ''}${hidden ? ' rsl-c-row-hidden' : ''}"
          onmouseenter="highlightMats('${eid}')" onmouseleave="clearMatHighlights()">
          <button class="rsl-c-eye-btn${hidden ? ' rsl-c-eye-off' : ''}" onclick="toggleReponerHidden('${eid}')" title="${hidden ? 'Activar (suma materiales)' : 'Desactivar (quita materiales)'}">${hidden ? '🙈' : '👁'}</button>
          <span class="rsl-c-emoji">${emoji}</span>
          <span class="rsl-c-nombre">${i.nombre}</span>
          ${i.rareza ? `<span class="loot-rareza-badge ${rClass}" style="font-size:0.6rem;padding:0 5px;flex-shrink:0">${i.rareza}</span>` : ''}
          ${qtyHtml}
          <span class="rsl-c-spacer"></span>
          ${priceHtml}
          ${profitStr}
          <button class="rsl-c-craft-btn${_reponerCraftSelIds.has(i.id) ? ' rsl-c-craft-btn-sel' : ''}" onclick="toggleReponerCraftSel('${eid}')" title="${_reponerCraftSelIds.has(i.id) ? 'Deseleccionar' : 'Marcar para craftear'}">🔨</button>
        </div>`;
      }).join('')}
      ${(() => { const { equipoHtml, basicoHtml } = _renderSubCrafteos(subCrafteos, reponerItems); return equipoHtml + basicoHtml; })()}
      ${(() => {
        const totalProfit = reponerItems.reduce((s, i) => {
          if (_reponerHiddenIds.has(i.id)) return s;
          const p = calcProfit(i);
          return s + (p ? p.profit : 0);
        }, 0);
        return totalProfit > 0
          ? `<div class="rsl-total rsl-total-profit"><span class="rsl-tax-note">Tasa: ${(TAX_RATE * 100).toFixed(2)}%</span> Beneficio estimado: <strong class="profit-pos">+${fmtK(totalProfit)}</strong></div>`
          : '';
      })()}
    </div>
  </div>`;
}

// Añade precio de venta desde el panel reponer (sin getElementById, evita conflicto de IDs)
async function addPriceRsl(id, inputEl) {
  const precio = parseInt(inputEl.value, 10);
  if (isNaN(precio) || precio <= 0) { inputEl.focus(); return; }
  inputEl.value = '';
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (!item.historial_precios) item.historial_precios = [];
  item.historial_precios.push({ precio, fecha: Date.now(), vendido: false });
  // Actualizar catálogo directamente para no activar el guard "mismo precio" ni duplicar el push
  const key = normName(item.nombre);
  catalog[key] = precio;
  catalogNames[key] = item.nombre.trim();
  setMatFecha(item.nombre);
  addCatHist(item.nombre.trim(), precio);
  render();
  await Promise.all([
    pushItem(item),
    fetch(API_MAT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: item.nombre.trim(), precio }) })
  ]);
}

// ─────────────────────────────────────────────
// HISTORIAL DE PRECIOS
// ─────────────────────────────────────────────
async function addPriceFromCard(id) {
  const input  = document.getElementById(`pa-${id}`);
  const precio = parseInt(input.value, 10);
  if (isNaN(precio) || precio <= 0) { input.focus(); return; }
  input.value = '';
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (!item.historial_precios) item.historial_precios = [];
  item.historial_precios.push({ precio, fecha: Date.now(), vendido: false });

  // Actualizar catálogo para cualquier categoría: permite que los crafteos que usen
  // este item como material reflejen el precio de compra/subasta actualizado
  {
    const k = normName(item.nombre);
    catalog[k]      = precio;
    catalogNames[k] = item.nombre;
    fetch(API_MAT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: item.nombre, precio })
    }).catch(() => {});
  }

  render();
  await pushItem(item);
}

// Versión de addPriceFromCard para cards virtuales (material básico con item real)
// Lee el input por inputId (vpa-...) en lugar de pa-{id}
async function addVirtualPriceFromCard(nombre, id) {
  const inputId = `vpa-${normName(nombre).replace(/\s/g,'_')}`;
  const input   = document.getElementById(inputId);
  const precio  = parseInt(input?.value, 10);
  if (!precio || precio <= 0) { input?.focus(); return; }
  input.value = '';
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (!item.historial_precios) item.historial_precios = [];
  item.historial_precios.push({ precio, fecha: Date.now(), vendido: false });
  const k = normName(item.nombre);
  catalog[k]      = precio;
  catalogNames[k] = item.nombre;
  fetch(API_MAT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: item.nombre, precio }) }).catch(() => {});
  render();
  await pushItem(item);
}

async function toggleVendido(id, idx) {
  const item = items.find(i => i.id === id);
  if (!item?.historial_precios?.[idx]) return;
  item.historial_precios[idx].vendido = !item.historial_precios[idx].vendido;
  render();
  await pushItem(item);
}

async function deletePrice(id, idx) {
  const item = items.find(i => i.id === id);
  if (!item?.historial_precios) return;
  item.historial_precios.splice(idx, 1);
  render();
  await pushItem(item);
}

// ─────────────────────────────────────────────
// TIEMPO
// ─────────────────────────────────────────────
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(diff / 86400000);
  return days < 7 ? `hace ${days}d` : new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

// ─────────────────────────────────────────────
// CARD RECOLECCIÓN (muestra las 3 variantes juntas)
// ─────────────────────────────────────────────
function buildVarianteHtml(item, label, colorClass) {
  if (!item) {
    // Placeholder — variante no creada aún
    return `<div class="rec-variante rec-empty">
      <div class="rec-var-label ${colorClass}">${label}</div>
      <div class="rec-var-precio muted">—</div>
      <div class="rec-var-stock muted">Sin datos</div>
    </div>`;
  }
  const eid    = item.id.replace(/'/g, "\\'");
  const precio = getPrecioActual(item);

  // historial compacto (solo último precio + botón añadir)
  const hist   = (item.historial_precios || []).map((e,i) => ({...e,_i:i})).sort((a,b)=>b.fecha-a.fecha);
  const histRows = hist.slice(0,3).map(e => `
    <div class="ph-row">
      <span class="ph-fecha">${timeAgo(e.fecha)}</span>
      <span class="ph-precio">${fmtK(e.precio)}</span>
      <button class="ph-vendido-btn ${e.vendido?'active':''}" onclick="toggleVendido('${eid}',${e._i})">${e.vendido?'✅':'❌'}</button>
      <button class="ph-del-btn" onclick="deletePrice('${eid}',${e._i})">🗑</button>
    </div>`).join('');

  return `<div class="rec-variante">
    <div class="rec-var-label ${colorClass}">${label}</div>
    <div class="rec-var-nombre" style="font-size:0.78rem;color:var(--text2);font-style:italic;margin-bottom:2px">${item.nombre}</div>
    <div class="rec-var-precio">${precio ? `<strong>${fmtK(precio)}</strong>` : '<span class="muted">Sin precio</span>'}</div>
    <div class="stock-section" style="margin:4px 0">
      ${_stockField(eid, 'comprados', item.comprados || 0, '🌿')}
      ${_stockField(eid, 'en_venta',  item.en_venta  || 0, '🏷')}
      ${_stockField(eid, 'vendidos',  item.vendidos  || 0, '💸')}
    </div>
    <details class="rec-hist">
      <summary class="ph-summary" style="font-size:0.72rem">📈 Historial <span class="ph-count">(${hist.length})</span></summary>
      <div class="ph-add-row">
        <input type="number" class="form-input ph-input" id="pa-${item.id}" placeholder="Precio" min="0"
          onkeydown="if(event.key==='Enter')addPriceFromCard('${eid}')">
        <button class="ph-add-btn" onclick="addPriceFromCard('${eid}')">+</button>
      </div>
      ${hist.length ? `<div class="ph-list">${histRows}</div>` : '<div class="ph-empty">Sin entradas</div>'}
    </details>
    <div class="rec-var-actions">
      <button class="action-btn" onclick="openModal('${eid}')" title="Editar">✏</button>
      <button class="action-btn danger" onclick="deleteItem('${eid}')" title="Eliminar">🗑</button>
    </div>
  </div>`;
}

function buildCardRecoleccion(grupo) {
  const emoji    = PROF_EMOJI[grupo.profesion] || '🌿';
  const nivelStr = grupo.nivel_item ? `<span class="item-nivel">Nv.${grupo.nivel_item}</span>` : '';
  const lugarStr = grupo.lugar ? `<span class="mat-lugar-badge">📍 ${grupo.lugar}</span>` : '';

  // Solo renderizar variantes que existen
  const varNormal  = grupo.variantes.normal  ? buildVarianteHtml(grupo.variantes.normal,  'Normal',     'var-normal')  : '';
  const varRaro    = grupo.variantes.raro    ? buildVarianteHtml(grupo.variantes.raro,    '★ Raro',     'var-raro')    : '';
  const varSemilla = grupo.variantes.semilla ? buildVarianteHtml(grupo.variantes.semilla, '🌱 Semilla', 'var-semilla') : '';

  // Botones para crear variantes faltantes
  const gEsc  = grupo.grupoNombre.replace(/'/g,"\\'");
  const pEsc  = grupo.profesion.replace(/'/g,"\\'");
  const nvl   = grupo.nivel_item || '';
  const addBtns = [
    !grupo.variantes.normal  && `<button class="rec-add-var-btn" onclick="crearVarianteRec('${gEsc}','${pEsc}',${nvl},'normal')">＋ Normal</button>`,
    !grupo.variantes.raro    && `<button class="rec-add-var-btn var-raro" onclick="crearVarianteRec('${gEsc}','${pEsc}',${nvl},'raro')">＋ ★ Raro</button>`,
    !grupo.variantes.semilla && `<button class="rec-add-var-btn var-semilla" onclick="crearVarianteRec('${gEsc}','${pEsc}',${nvl},'semilla')">＋ 🌱 Semilla</button>`,
  ].filter(Boolean).join('');

  return `<div class="card card-recoleccion">
    <div class="card-head">
      <div class="card-emoji">${emoji}</div>
      <div style="flex:1;min-width:0">
        <div class="card-name">${grupo.grupoNombre}</div>
        <div class="archi-meta">
          <span class="prof-badge" style="color:var(--green)">${grupo.profesion}</span>
          ${nivelStr}${lugarStr}
        </div>
      </div>
    </div>
    <div class="rec-variantes-grid">
      ${varNormal}${varRaro}${varSemilla}
    </div>
    ${addBtns ? `<div class="rec-add-btns">${addBtns}</div>` : ''}
  </div>`;
}

// ─────────────────────────────────────────────
// CARD BUILDER (crafteo)
// ─────────────────────────────────────────────
function buildCard(item) {
  const eid        = item.id.replace(/'/g, "\\'");
  const isCrafteo  = item.categoria === 'crafteo';
  const isMaterial = item.categoria === 'material';
  const showRecipe = isCrafteo || isMaterial;
  const p          = calcProfit(item);
  const emoji      = PROF_EMOJI[item.profesion] || (isMaterial ? '📦' : '🔨');
  const profColor  = isCrafteo ? 'var(--teal)' : (isMaterial ? 'var(--orange)' : 'var(--green)');

  // ── Badges del header ──
  let badges = '';
  if (item.nivel_item)      badges += `<span class="item-nivel">Nv.${item.nivel_item}</span>`;
  if (item.nivel_profesion) badges += `<span class="item-nivel" style="color:var(--purple);border-color:rgba(155,114,207,.3)">Prof.${item.nivel_profesion}</span>`;
  if (item.tipo)   badges += `<span class="loot-tipo-badge">${item.tipo}</span>`;
  if (item.rareza) badges += `<span class="loot-rareza-badge ${rarezaClass(item.rareza)}">${item.rareza}</span>`;

  // Lugar de recolección
  if (!isCrafteo && item.lugar) {
    badges += `<span class="mat-lugar-badge" title="Lugar de recolección">📍 ${item.lugar}</span>`;
  }

  // Badge rareza del material (solo recolección)
  if (item.rareza_mat) {
    const isRaro = item.rareza_mat === 'raro';
    badges += `<span class="rareza-mat-badge ${isRaro ? 'rareza-mat-raro' : 'rareza-mat-normal'}">${isRaro ? '★ Raro' : 'Normal'}</span>`;
  }
  // Nombre alternativo
  if (item.nombre_alternativo) {
    badges += `<span class="alt-nombre-badge" title="También conocido como: ${item.nombre_alternativo}">≈ ${item.nombre_alternativo}</span>`;
  }

  // ── Materiales (crafteo + material) ──
  let matHtml = '';
  if (showRecipe && item.materiales?.length) {
    const coste    = calcCoste(item);
    const receta   = getCheapestReceta(item);
    const rows  = receta.map(m => {
      const refItem = m.item_id ? items.find(i => i.id === m.item_id) : null;
      const esc     = m.nombre.replace(/'/g, "\\'").replace(/"/g, '&quot;');

      if (refItem) {
        const info   = getMatInfo(m);
        const qty    = m.cantidad || 0;
        const total  = info.precio * qty;
        const rClass = rarezaClass(refItem.rareza);
        const rLabel = refItem.rareza || '';

        // Comparativa compra vs crafteo
        // Cuando el modo activo es 'compra', el precio de subasta es editable inline
        const compraBadge = (isActive) => {
          const cls      = isActive ? 'mat-opt-active' : 'mat-opt-dim';
          const title    = isActive ? 'Precio subasta · editable' : 'Precio subasta · editable (tachado = más caro que craftear)';
          const rarezaArg = refItem.rareza ? `,'${refItem.rareza.replace(/'/g,"\\'")}' ` : '';
          return `<span class="mat-opt ${cls}" title="${title}">🛒 <input class="mat-opt-input${isActive ? '' : ' mat-opt-input-dim'}" type="number" value="${info.precioCompra || ''}" min="0" placeholder="—" onkeydown="if(event.key==='Enter'){updateCatalogPrice('${esc}',this.value${rarezaArg});this.blur();}" onchange="updateCatalogPrice('${esc}',this.value${rarezaArg})"></span>`;
        };
        let comparHtml = '';
        if (info.precioCreacion > 0 && info.precioCompra > 0) {
          const crafteoCls = info.modo === 'crafteo' ? 'mat-opt-active' : 'mat-opt-dim';
          comparHtml = `
            ${compraBadge(info.modo === 'compra')}
            <span class="mat-opt-sep">vs</span>
            <span class="mat-opt ${crafteoCls}" title="Coste de fabricación${info.modo === 'crafteo' ? ' (más barato)' : ''}">⚒ ${fmtK(info.precioCreacion)}</span>`;
        } else if (info.precioCreacion > 0) {
          comparHtml = `<span class="mat-opt mat-opt-active" title="Coste de fabricación">⚒ ${fmtK(info.precioCreacion)}</span>
            <span class="mat-opt mat-opt-dim" title="Sin precio de compra definido">🛒 —</span>`;
        } else {
          comparHtml = compraBadge(true);
        }

        return `<div class="mat-row mat-row-linked">
          <span class="mat-nombre">
            <span class="mat-nombre-text" onclick="openModal('${refItem.id.replace(/'/g,"\\'")}')" title="Clic para editar">${m.nombre}</span>
            ${rLabel ? `<span class="loot-rareza-badge ${rClass}" style="font-size:0.6rem;padding:0 4px">${rLabel}</span>` : ''}
            <button class="copy-name-btn" onclick="navigator.clipboard.writeText('${esc}')" title="Copiar nombre">⎘</button>
          </span>
          <span class="mat-qty">×${qty}</span>
          <div class="mat-opt-wrap">${comparHtml}</div>
          <span class="mat-total">${total > 0 ? (info.modo === 'compra' ? '🛒' : '⚒') + ' ' + fmtK(total) : ''}</span>
        </div>`;
      }

      const precioCat = getCatalogPrice(m.nombre);
      const total     = precioCat * (m.cantidad || 0);
      const stale     = isMatStale(m.nombre);

      return `<div class="mat-row${stale ? ' mat-row-stale' : ''}">
        <span class="mat-nombre">
          <span class="mat-nombre-text">${m.nombre}${stale ? ' <span class="stale-icon" title="Precio posiblemente desactualizado (>6h)">⏱</span>' : ''}</span>
          <button class="copy-name-btn" onclick="navigator.clipboard.writeText('${esc}')" title="Copiar nombre">⎘</button>
        </span>
        <span class="mat-qty">×${m.cantidad}</span>
        <div class="mat-precio-wrap">
          <input class="mat-price-inline" type="number" value="${precioCat || ''}"
            placeholder="—" min="0"
            onkeydown="if(event.key==='Enter'){updateCatalogPrice('${esc}',this.value);this.blur();}"
            onchange="updateCatalogPrice('${esc}', this.value)"
            title="⟳ Precio compartido — al cambiar aquí se actualiza en TODOS los ítems que usan '${m.nombre}'">
          <span class="mat-shared-icon" title="Precio compartido con el catálogo">⟳</span>
        </div>
        <span class="mat-total">${total > 0 ? '= ' + fmtK(total) : ''}</span>
      </div>`;
    }).join('');
    matHtml = `<div class="mat-section">
      <div class="mat-header">📦 Materiales <span class="mat-shared-note">· precios compartidos</span></div>
      ${rows}
      ${coste > 0 ? `<div class="mat-coste-total">Coste total: <strong>${fmtK(coste)}</strong></div>` : ''}
    </div>`;
  }

  // ── Profit / Precio de venta ──
  let profitHtml;
  if (isCrafteo || isMaterial) {
    if (isCrafteo && p) {
      const cls  = p.profit >= 0 ? 'profit-pos' : 'profit-neg';
      const sign = p.profit >= 0 ? '+' : '';
      profitHtml = `<div class="profit-section">
        <span class="profit-precio">💰 Precio: <strong>${fmtK(p.precio)}</strong></span>
        <span class="profit-val ${cls}">${sign}${fmtK(p.profit)}</span>
        ${p.profitPct !== null ? `<span class="profit-pct ${cls}">${fmtPct(p.profitPct)}</span>` : ''}
      </div>`;
    } else if (isMaterial) {
      const coste     = calcCoste(item);
      const pc        = getCatalogPrice(item.nombre); // siempre live desde catálogo
      const escNombre = item.nombre.replace(/'/g,"\\'" ).replace(/"/g,'&quot;');
      const staleMat  = isMatStale(item.nombre);
      profitHtml = `<div class="profit-section" style="flex-wrap:wrap;gap:6px">
        ${coste > 0 ? `<span class="profit-precio">⚒ Coste: <strong>${fmtK(coste)}</strong></span>` : ''}
        <span class="profit-precio">💰 Precio catálogo:
          <input class="mat-price-inline" type="number" value="${pc || ''}" min="0"
            placeholder="—" style="width:80px"
            onkeydown="if(event.key==='Enter'){updateCatalogPrice('${escNombre}',this.value);this.blur();}"
            onchange="updateCatalogPrice('${escNombre}', this.value)"
            title="Precio compartido · se actualiza en todas las recetas que usen '${item.nombre}'">
          <span class="mat-shared-icon${staleMat ? ' stale-icon' : ''}" title="${staleMat ? 'Precio posiblemente desactualizado (>6h) · haz clic en el input para actualizarlo' : 'Precio compartido'}">⟳${staleMat ? '⏱' : ''}</span>
        </span>
      </div>`;
    } else {
      profitHtml = `<div class="profit-section"><span style="color:var(--muted);font-style:italic;font-size:0.84rem">Sin precio de venta — añade uno abajo</span></div>`;
    }
  } else {
    // Recolección: precio del material (para que otros crafteos lo usen)
    const precioMat = getPrecioActual(item);
    profitHtml = precioMat
      ? `<div class="profit-section">
          <span class="profit-precio">💎 Precio material: <strong>${fmtK(precioMat)}</strong></span>
          <span style="color:var(--muted);font-size:0.76rem;font-style:italic">· usado en recetas que lo contienen</span>
        </div>`
      : `<div class="profit-section"><span style="color:var(--muted);font-style:italic;font-size:0.84rem">Sin precio — añade uno en el historial</span></div>`;
  }

  // ── Oportunidad de compra (solo material/recolección) ──
  let opHtml = '';
  if (!isCrafteo) {
    const hist = _getPriceHist(item.nombre);
    if (hist.length >= 3) {
      const avg  = hist.reduce((s, p) => s + p, 0) / hist.length;
      const pc   = getCatalogPrice(item.nombre);
      const pct  = avg > 0 && pc > 0 ? pc / avg : null;
      if (pct !== null && pct < 0.75) {
        const recetas = items.filter(i => {
          if (i.categoria !== 'crafteo') return false;
          const p = calcProfit(i);
          return p && p.profit > 0 && (i.materiales||[]).some(m => normName(m.nombre) === normName(item.nombre));
        });
        if (recetas.length) {
          const pctStr = Math.round(pct * 100);
          const cls    = pctStr < 25 ? 'op-exc' : (pctStr < 50 ? 'op-great' : 'op-good');
          const mult   = pct < 0.10 ? 40 : pct < 0.25 ? 20 : pct < 0.50 ? 8 : 3;
          const qpc    = recetas.reduce((s, i) => {
            const m = (i.materiales||[]).find(m => normName(m.nombre) === normName(item.nombre));
            return s + (m?.cantidad || 0);
          }, 0);
          const sugerido = Math.max(qpc, qpc * mult);
          opHtml = `<div class="op-card-banner ${cls}">
            🛒 Precio bajo: <strong>${pctStr}%</strong> de la media (${fmtK(Math.round(avg))})
            · sugerido comprar <strong>×${sugerido}</strong>
            <span style="color:var(--muted);font-size:0.75rem">· usado en ${recetas.length} receta${recetas.length>1?'s':''}</span>
          </div>`;
        }
      }
    }
  }

  // ── Stock interactivo ──
  const stockLabel = isCrafteo ? '🔨' : (isMaterial ? '📦' : '🌿');
  const pendienteListing = isCrafteo && (item.comprados || 0) > 0 && (item.en_venta || 0) === 0;
  const necesitaReponer  = (item.vendidos || 0) > 0 && (item.en_venta || 0) === 0;
  const stockBajoHtml = !isCrafteo && isStockLow(item)
    ? `<span class="stock-bajo-badge" title="Stock bajo respecto al promedio histórico · promedio ≈ ${Math.round(_getStockAvg(item.nombre) || 0)}">⚠ Bajo</span>`
    : '';
  const pendienteHtml = pendienteListing
    ? `<span class="stock-pendiente" title="Items crafteados sin listar">⚠ Listar</span>`
    : (necesitaReponer ? `<span class="stock-reponer" onclick="toggleReponerMode()" title="Pulsa para ver todos los items a reponer">↺ Reponer</span>` : '');
  const diasEnVenta = item.fecha_en_venta ? Math.floor((Date.now() - item.fecha_en_venta) / 86400000) : null;
  const enVentaTitle = diasEnVenta !== null ? `title="En venta hace ${diasEnVenta}d · caduca en ${Math.max(0,7-diasEnVenta)}d"` : '';
  const caducadosHtml = (item.caducados || 0) > 0
    ? `<span class="stock-field stock-caducados" title="Veces que volvió al almacén por no venderse en 7 días">
        <span class="stock-lbl">↩</span>
        <span class="stk-val-input" style="width:${String(item.caducados).length}ch;cursor:default">${item.caducados}</span>
      </span>`
    : '';
  const stockHtml = `<div class="stock-section">
    ${_stockField(eid, 'comprados', item.comprados || 0, stockLabel)}
    <span ${enVentaTitle}>${_stockField(eid, 'en_venta', item.en_venta || 0, '🏷')}</span>
    ${_stockField(eid, 'vendidos',  item.vendidos  || 0, '💸')}
    ${caducadosHtml}
    ${pendienteHtml}${stockBajoHtml}
  </div>`;

  // ── Historial de precios ──
  const hist = (item.historial_precios || [])
    .map((e, i) => ({ ...e, _i: i }))
    .sort((a, b) => b.fecha - a.fecha);

  const histRows = hist.map(e => `
    <div class="ph-row">
      <span class="ph-fecha">${timeAgo(e.fecha)}</span>
      <span class="ph-precio">${fmtK(e.precio)}</span>
      <button class="ph-vendido-btn ${e.vendido ? 'active' : ''}"
        onclick="toggleVendido('${eid}',${e._i})"
        title="${e.vendido ? 'Vendido ✅ — click para desmarcar' : 'Marcar como vendido'}">
        ${e.vendido ? '✅' : '❌'}
      </button>
      <button class="ph-del-btn" onclick="deletePrice('${eid}',${e._i})" title="Eliminar">🗑</button>
    </div>`).join('');

  const precioStr    = getPrecioActual(item) ? ` · <span style="color:var(--gold2)">${fmtK(getPrecioActual(item))}</span>` : '';
  const histLabel    = isCrafteo ? '📈 Historial de precios' : '💎 Precio del material';
  const priceStale   = isPriceStale(item);
  const staleLabel   = priceStale ? ' <span class="stale-icon price-stale-icon" title="Precio de venta posiblemente desactualizado (>6h)">⏱ Actualizar precio</span>' : '';
  const histHtml   = `<details class="price-history${priceStale ? ' ph-stale' : ''}">
    <summary class="ph-summary">
      ${histLabel}${precioStr}${staleLabel}
      <span class="ph-count">(${hist.length})</span>
    </summary>
    <div class="ph-add-row">
      <input type="number" class="form-input ph-input" id="pa-${item.id}"
        placeholder="${isCrafteo ? 'Nuevo precio k' : 'Precio material k'}" min="0"
        onkeydown="if(event.key==='Enter')addPriceFromCard('${eid}')">
      <button class="ph-add-btn" onclick="addPriceFromCard('${eid}')">+ Añadir</button>
    </div>
    ${hist.length ? `<div class="ph-list">${histRows}</div>` : '<div class="ph-empty">Sin entradas — introduce un precio arriba</div>'}
  </details>`;

  return `<div class="card" data-id="${item.id}">
    <div class="card-head">
      <div class="card-emoji">${emoji}</div>
      <div style="flex:1;min-width:0">
        <div class="card-name">
          <span class="card-name-text" onclick="openModal('${eid}')" title="Clic para editar">${item.nombre}</span>
          <button class="copy-name-btn" onclick="navigator.clipboard.writeText('${item.nombre.replace(/'/g,"\\'")}')" title="Copiar nombre">⎘</button>
        </div>
        <div class="archi-meta">
          <span class="prof-badge" style="color:${profColor}">${item.profesion}</span>
          ${badges}
        </div>
      </div>
      <div class="card-actions">
        <button class="action-btn" onclick="openModal('${eid}')" title="Editar">✏</button>
        <button class="action-btn danger" onclick="deleteItem('${eid}')" title="Eliminar">🗑</button>
      </div>
    </div>
    ${matHtml}
    ${profitHtml}
    ${opHtml}
    ${stockHtml}
    ${histHtml}
  </div>`;
}

// ─────────────────────────────────────────────
// HISTORIAL DE CATÁLOGO (localStorage) — para cards virtuales
// ─────────────────────────────────────────────
const LS_CAT_HIST = 'wf_cat_historial';

function getCatHist(nombre) {
  try { return (JSON.parse(localStorage.getItem(LS_CAT_HIST) || '{}'))[normName(nombre)] || []; }
  catch { return []; }
}
function addCatHist(nombre, precio) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_CAT_HIST) || '{}');
    const key = normName(nombre);
    if (!all[key]) all[key] = [];
    all[key].push({ precio, fecha: Date.now() });
    localStorage.setItem(LS_CAT_HIST, JSON.stringify(all));
  } catch {}
}
function delCatHist(nombre, idx) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_CAT_HIST) || '{}');
    const key = normName(nombre);
    if (all[key]) { all[key].splice(idx, 1); localStorage.setItem(LS_CAT_HIST, JSON.stringify(all)); }
  } catch {}
  render();
}
function addCatPriceFromCard(nombre) {
  const inputId = `vpa-${normName(nombre).replace(/\s/g,'_')}`;
  const input   = document.getElementById(inputId);
  const precio  = parseInt(input?.value, 10);
  if (!precio || precio <= 0) { input?.focus(); return; }
  input.value = '';
  updateCatalogPrice(nombre, precio); // addCatHist ya se llama dentro de updateCatalogPrice
}

// ─────────────────────────────────────────────
// CARDS VIRTUALES — Superglú y materiales básicos
// ─────────────────────────────────────────────
function _buildCardMatVirtual(nombre, nivelMin, nivelMax) {
  const precio  = getCatalogPrice(nombre);
  const stale   = isMatStale(nombre);
  const esc     = nombre.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const inputId = `vpa-${normName(nombre).replace(/\s/g,'_')}`;

  // Si existe un item real con ese nombre, usar su historial de BD (fuente de verdad)
  const realItem = findMatItem(nombre);
  let hist, addFn, delFn;
  if (realItem) {
    const eid = realItem.id.replace(/'/g, "\\'");
    hist   = (realItem.historial_precios || []).map((e, i) => ({ ...e, _i: i })).sort((a, b) => b.fecha - a.fecha);
    addFn  = `addVirtualPriceFromCard('${esc}','${eid}')`;
    delFn  = (i) => `deletePrice('${eid}',${hist[i]._i})`;
  } else {
    const catHist = getCatHist(nombre).slice().reverse();
    hist   = catHist.map((e, i) => ({ ...e, _i: catHist.length - 1 - i }));
    addFn  = `addCatPriceFromCard('${esc}')`;
    delFn  = (i) => `delCatHist('${esc}',${hist[i]._i})`;
  }

  const histRows = hist.slice(0, 5).map((e, i) => `
    <div class="ph-row">
      <span class="ph-fecha">${timeAgo(e.fecha)}</span>
      <span class="ph-precio">${fmtK(e.precio)}</span>
      <button class="ph-del-btn" onclick="${delFn(i)}" title="Eliminar">🗑</button>
    </div>`).join('');

  const openAction = realItem
    ? `openModal('${realItem.id.replace(/'/g,"\\'")}')`
    : `openMatBaseModal('${esc}')`;

  const eid = realItem ? realItem.id.replace(/'/g, "\\'") : '';
  const stockHtml = realItem
    ? `<div class="stock-section" style="margin-top:6px">
        ${_stockField(eid, 'comprados', realItem.comprados || 0, '🔨')}
        ${_stockField(eid, 'en_venta',  realItem.en_venta  || 0, '🏷')}
        ${_stockField(eid, 'vendidos',  realItem.vendidos  || 0, '💸')}
      </div>`
    : `<div style="font-size:0.75rem;color:var(--muted);font-style:italic;margin-top:4px">Clic en el nombre para crear</div>`;

  return `<div class="card card-superglu">
    <div class="card-head">
      <div class="card-emoji">📦</div>
      <div style="flex:1;min-width:0">
        <div class="card-name">
          <button class="card-name-btn" onclick="${openAction}" title="Editar">${nombre}</button>
          <button class="copy-name-btn" onclick="navigator.clipboard.writeText('${esc}')" title="Copiar nombre">⎘</button>
        </div>
        <div class="archi-meta">
          <span class="item-nivel">Nv.${nivelMin}–${nivelMax}</span>
        </div>
      </div>
    </div>
    <div class="profit-section" style="gap:8px">
      <span class="profit-precio">💰 Precio actual:${stale ? ' <span class="stale-icon" title="Posiblemente desactualizado (>6h)">⏱</span>' : ''}</span>
      <strong style="color:var(--gold2);font-family:'Cinzel',serif">${precio ? fmtK(precio) : '—'}</strong>
      <span class="mat-shared-icon" title="Precio compartido con el catálogo">⟳</span>
    </div>
    <details class="price-history${stale ? ' ph-stale' : ''}">
      <summary class="ph-summary">
        💎 Historial de precios <span class="ph-count">(${hist.length})</span>
      </summary>
      <div class="ph-add-row">
        <input type="number" class="form-input ph-input" id="${inputId}"
          placeholder="Nuevo precio" min="0"
          onkeydown="if(event.key==='Enter')${addFn}">
        <button class="ph-add-btn" onclick="${addFn}">+ Añadir</button>
      </div>
      ${hist.length ? `<div class="ph-list">${histRows}</div>` : '<div class="ph-empty">Sin entradas — introduce un precio arriba</div>'}
    </details>
    ${stockHtml}
  </div>`;
}
function buildCardSuperglu(tier) {
  const nivelItem = tier * 10 + 1;
  const nombre    = getSupergluNombre(nivelItem);
  return _buildCardMatVirtual(nombre, tier * 10, tier * 10 + 9);
}

function buildCardsMatProf(prof) {
  const data = PROF_MAT_BASE[prof];
  if (!data) return '';
  const allMats = [data, ...(data.extras || [])];
  return allMats.map(mat => {
    return SUFIJOS_NIVEL.map((_, tier) => {
      const nivelItem = tier * 10 + 1;
      if (mat.nivelMin !== undefined && nivelItem < mat.nivelMin) return '';
      const sufijo = mat.masc ? getSufijoMasc(nivelItem) : getSufijo(nivelItem);
      const nombre = sufijo ? `${mat.nombre} ${sufijo}` : mat.nombre;
      return _buildCardMatVirtual(nombre, tier * 10, tier * 10 + 9);
    }).join('');
  }).join('');
}

// Cards para materiales secundarios (Hilo, Acero, Tabla…) de una profesión de recolección
function buildCardsMatSecundario(prof) {
  const base = MAT_SECUNDARIO_BASE[prof];
  if (!base) return '';
  return SUFIJOS_NIVEL.map((sufijo, tier) => {
    const nombre = `${base} ${sufijo}`;
    return _buildCardMatVirtual(nombre, tier * 10, tier * 10 + 9);
  }).join('');
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
function render() {
  const container   = document.getElementById('cards');
  const empty       = document.getElementById('empty');
  const resultsText = document.getElementById('results-text');

  updateSidebar();
  updateMatDatalist();
  renderCatalog();
  renderIngredienteSearch();
  renderMatBase();
  renderSuperglu();

  // Reponer panel
  const reponerPanelEl = document.getElementById('reponer-panel');
  if (reponerPanelEl) {
    if (reponerMode && !matBaseFilter) {
      const _rslScroll = document.getElementById('rsl-list-inner')?.scrollTop ?? 0;
      reponerPanelEl.innerHTML = _buildReponerPanelHtml(calcReponerItems());
      const _rslEl = document.getElementById('rsl-list-inner');
      if (_rslEl) _rslEl.scrollTop = _rslScroll;
      reponerPanelEl.style.display = '';
    } else {
      reponerPanelEl.style.display = 'none';
    }
  }

  // Publicar panel
  const publicarPanelEl = document.getElementById('publicar-panel');
  if (publicarPanelEl) {
    if (publicarMode && !matBaseFilter) {
      publicarPanelEl.innerHTML = _buildPublicarPanelHtml(calcPublicarItems());
      publicarPanelEl.style.display = '';
    } else {
      publicarPanelEl.style.display = 'none';
    }
  }

  // ── Vista virtual: Superglú o material base de profesión ──
  if (matBaseFilter) {
    let html, label;
    if (matBaseFilter === 'superglu') {
      html  = SUFIJOS_NIVEL_MASC.map((_, tier) => buildCardSuperglu(tier)).join('');
      label = `<strong>${SUFIJOS_NIVEL_MASC.length}</strong> Superglú`;
    } else if (matBaseFilter.startsWith('sec:')) {
      const prof = matBaseFilter.slice(4);
      html  = buildCardsMatSecundario(prof);
      label = `Secundarios · <strong>${prof}</strong> · ${MAT_SECUNDARIO_BASE[prof] || ''}`;
    } else {
      html  = buildCardsMatProf(matBaseFilter);
      label = `Materiales básicos · <strong>${matBaseFilter}</strong>`;
    }
    container.innerHTML = html;
    empty.style.display = 'none';
    resultsText.innerHTML = label;
    return;
  }

  const { crafteos, grupos } = getDisplayUnits();

  // Filtrar crafteos (en modo reponer/publicar, solo items del modo activo)
  const filteredCrafteos = sortItems(
    (reponerMode ? calcReponerItems() : publicarMode ? calcPublicarItems() : crafteos).filter(matchesItem)
  );
  // Filtrar grupos recolección (ocultos en modo reponer/publicar)
  const filteredGrupos = (reponerMode || publicarMode) ? [] : grupos.filter(matchesGrupo)
    .sort((a, b) => a.grupoNombre.localeCompare(b.grupoNombre, 'es'));

  const totalCards = filteredCrafteos.length + filteredGrupos.length;

  if (totalCards === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    resultsText.innerHTML = items.length === 0
      ? 'Sin items — pulsa <strong>+ Añadir</strong> para empezar'
      : 'No hay resultados con esos filtros.';
    return;
  }

  empty.style.display = 'none';

  // Botón contextual de materiales básicos en el results-bar cuando hay una sola profesión activa
  const ctxWrap = document.getElementById('matbase-ctx-wrap');
  if (ctxWrap) {
    let ctxHtml = '';
    if (activeProfesiones.size === 1) {
      const prof   = [...activeProfesiones][0];
      const matKey = PROF_MAT_BASE[prof] ? prof : (MAT_SECUNDARIO_BASE[prof] ? `sec:${prof}` : null);
      if (matKey) {
        const btnLabel = PROF_MAT_BASE[prof] ? PROF_MAT_BASE[prof].nombre : MAT_SECUNDARIO_BASE[prof];
        ctxHtml = `<button class="matbase-ctx-btn" onclick="setMatBase('${matKey.replace(/'/g,"\\'")}')" title="Ver materiales básicos de ${prof}">📦 ${btnLabel}</button>`;
      }
    }
    ctxWrap.innerHTML = ctxHtml;
  }

  // Crafteos primero si no estamos en filtro recoleccion
  let html = '';
  if (categoriaFilter !== 'recoleccion') html += filteredCrafteos.map(buildCard).join('');
  if (categoriaFilter !== 'crafteo')     html += filteredGrupos.map(buildCardRecoleccion).join('');
  container.innerHTML = html;

  const rentables = filteredCrafteos.filter(i => { const p = calcProfit(i); return p && p.profit > 0; }).length;
  const rentStr   = rentables > 0
    ? ` · <span style="color:var(--green);font-weight:600">${rentables} rentables</span>` : '';
  const recStr    = filteredGrupos.length > 0
    ? ` · <span style="color:var(--teal)">${filteredGrupos.length} recursos</span>` : '';
  resultsText.innerHTML = `Mostrando <strong>${totalCards}</strong> items${rentStr}${recStr}`;
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function updateSidebar() {
  ['todo','crafteo','recoleccion','material'].forEach(cat => {
    document.getElementById(`cat-${cat}`)?.classList.toggle('active', categoriaFilter === cat);
  });

  const profGrid = document.getElementById('prof-grid');
  if (profGrid) {
    let profs;
    if (categoriaFilter === 'crafteo')          profs = PROFESIONES_CRAFTEO;
    else if (categoriaFilter === 'recoleccion') profs = PROFESIONES_RECOLECCION;
    else if (categoriaFilter === 'material')    profs = PROFESIONES_CRAFTEO;
    else profs = [...new Set([...PROFESIONES_CRAFTEO, ...PROFESIONES_RECOLECCION])];
    // Reconstruir solo si cambia la lista de profesiones mostradas
    if (profGrid.dataset.cat !== categoriaFilter) {
      profGrid.dataset.cat = categoriaFilter;
      profGrid.innerHTML = profs.map(p => {
        const pid = 'pbtn-' + p.toLowerCase().replace(/\s+/g,'-').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        return `<button class="tipo-btn" id="${pid}" onclick="toggleProfesion('${p.replace(/'/g,"\\'")}')">
          ${PROF_EMOJI[p] || ''} ${p}</button>`;
      }).join('');
    }
    // Actualizar estado activo sin tocar el DOM innecesariamente
    profs.forEach(p => {
      const pid = 'pbtn-' + p.toLowerCase().replace(/\s+/g,'-').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      document.getElementById(pid)?.classList.toggle('active', activeProfesiones.has(p));
    });
  }

  const rarezaGrid = document.getElementById('rareza-grid');
  if (rarezaGrid && !rarezaGrid.dataset.built) {
    rarezaGrid.dataset.built = '1';
    rarezaGrid.innerHTML = RAREZAS.map(r =>
      `<button class="tipo-btn rareza-btn ${rarezaClass(r)}" id="rbtn-${rarezaClass(r)}" onclick="toggleRareza('${r}')">${r}</button>`
    ).join('');
  }
  RAREZAS.forEach(r => {
    document.getElementById(`rbtn-${rarezaClass(r)}`)?.classList.toggle('active', activeRarezas.has(r));
  });

  const tipoGrid = document.getElementById('tipo-grid');
  if (tipoGrid) {
    const tipos    = [...new Set(items.map(i => i.tipo).filter(Boolean))].sort();
    const tiposKey = tipos.join('|');
    if (tipoGrid.dataset.tipos !== tiposKey) {
      tipoGrid.dataset.tipos = tiposKey;
      tipoGrid.innerHTML = tipos.length
        ? tipos.map(t => {
            const tid = 'tbtn-' + t.toLowerCase().replace(/\s+/g,'-').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
            return `<button class="tipo-btn" id="${tid}" onclick="toggleTipo('${t.replace(/'/g,"\\'")}'">${t}</button>`;
          }).join('')
        : `<span style="font-size:0.8rem;color:var(--muted);font-style:italic">Sin tipos aún</span>`;
    }
    tipos.forEach(t => {
      const tid = 'tbtn-' + t.toLowerCase().replace(/\s+/g,'-').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      document.getElementById(tid)?.classList.toggle('active', activeTipos.has(t));
    });
  }

  // Sección oportunidades de compra
  const opSection = document.getElementById('oportunidades-section');
  const opList    = document.getElementById('oportunidades-list');
  if (opSection && opList) {
    const ops = calcOportunidades();
    opSection.style.display = ops.length ? '' : 'none';
    if (ops.length) {
      opList.innerHTML = ops.map(o => {
        const pctStr  = Math.round(o.pct * 100);
        const cls     = pctStr < 25 ? 'op-exc' : (pctStr < 50 ? 'op-great' : 'op-good');
        const stockAct = items.find(i => normName(i.nombre) === o.key)?.comprados || 0;
        return `<div class="op-row">
          <div class="op-nombre-row">
            <span class="op-nombre">${o.nombre}</span>
            <span class="op-pct ${cls}">${pctStr}%</span>
          </div>
          <div class="op-detail">
            <span class="op-precio">🏷 ${fmtK(o.precioActual)} <span class="op-avg">· media ${fmtK(Math.round(o.avg))}</span></span>
            <span class="op-sugerido">🛒 ×${o.sugerido} <span class="op-avg">(${o.recetas} receta${o.recetas>1?'s':''})</span></span>
            ${stockAct > 0 ? `<span class="op-avg">📦 stock: ${stockAct}</span>` : ''}
          </div>
        </div>`;
      }).join('');
    }
  }

  // Sección stock bajo
  const sbajoSection = document.getElementById('stock-bajo-section');
  const sbajoList    = document.getElementById('stock-bajo-list');
  if (sbajoSection && sbajoList) {
    const lowItems = items.filter(isStockLow);
    sbajoSection.style.display = lowItems.length ? '' : 'none';
    if (lowItems.length) {
      sbajoList.innerHTML = lowItems.map(i => {
        const avg = Math.round(_getStockAvg(i.nombre) || 0);
        return `<div class="sbajo-row">
          <span class="sbajo-nombre" title="${i.nombre}">${i.nombre}</span>
          <span class="sbajo-val"><span style="color:var(--red)">${i.comprados || 0}</span><span style="color:var(--muted)"> / ~${avg}</span></span>
        </div>`;
      }).join('');
    }
  }
}

// ─────────────────────────────────────────────
// CATÁLOGO DE MATERIALES (panel sidebar)
// ─────────────────────────────────────────────
let catalogOpen = false;
// ─────────────────────────────────────────────
// MATERIALES BÁSICOS
// ─────────────────────────────────────────────
let matbaseOpen   = false;
let matBaseFilter = null; // null | 'superglu' | profName

function toggleMatBase() {
  matbaseOpen = !matbaseOpen;
  document.getElementById('matbase-body').style.display = matbaseOpen ? '' : 'none';
  document.getElementById('matbase-toggle-icon').textContent = matbaseOpen ? '▾' : '▸';
  if (matbaseOpen) renderMatBase();
}

function setMatBase(key) {
  matBaseFilter = (matBaseFilter === key) ? null : key;
  renderMatBase();
  render();
}

function renderMatBase() {
  const list = document.getElementById('matbase-list');
  if (!list || !matbaseOpen) return;

  const sgActive = matBaseFilter === 'superglu' ? ' matbase-btn-active' : '';
  let html = `<button class="matbase-btn${sgActive}" onclick="setMatBase('superglu')">🔧 Superglú</button>`;

  // Materiales primarios (por profesión de crafteo)
  html += `<div class="matbase-sep-label">Primarios</div>`;
  for (const [prof, data] of Object.entries(PROF_MAT_BASE)) {
    const emoji  = PROF_EMOJI[prof] || '📦';
    const active = matBaseFilter === prof ? ' matbase-btn-active' : '';
    const pEsc   = prof.replace(/'/g, "\\'");
    const label  = data.extras ? `${data.nombre} / ${data.extras.map(e => e.nombre).join(' / ')}` : data.nombre;
    html += `<button class="matbase-btn${active}" onclick="setMatBase('${pEsc}')" title="${label}">${emoji} ${prof}</button>`;
  }

  // Materiales secundarios (Hilo, Acero, Tabla… — por profesión de recolección)
  html += `<div class="matbase-sep-label">Secundarios</div>`;
  for (const [prof, base] of Object.entries(MAT_SECUNDARIO_BASE)) {
    const emoji  = PROF_EMOJI[prof] || '📦';
    const key    = `sec:${prof}`;
    const active = matBaseFilter === key ? ' matbase-btn-active' : '';
    const pEsc   = prof.replace(/'/g, "\\'");
    html += `<button class="matbase-btn${active}" onclick="setMatBase('sec:${pEsc}')" title="${base}">${emoji} ${base}</button>`;
  }
  list.innerHTML = html;
}

// ─────────────────────────────────────────────
// SUPERGLÚ
// ─────────────────────────────────────────────
let supergluOpen = false;
function toggleSuperglu() {
  supergluOpen = !supergluOpen;
  document.getElementById('superglu-body').style.display = supergluOpen ? '' : 'none';
  document.getElementById('superglu-toggle-icon').textContent = supergluOpen ? '▾' : '▸';
  if (supergluOpen) renderSuperglu();
}

function renderSuperglu() {
  const list = document.getElementById('superglu-list');
  if (!list || !supergluOpen) return;
  // Un Superglú por tier (0-15); nivel = tier*10+1 da el sufijo correcto
  const rows = SUFIJOS_NIVEL_MASC.map((_, tier) => {
    const nivelItem = tier * 10 + 1;
    const nombre    = getSupergluNombre(nivelItem);
    const precio    = getCatalogPrice(nombre);
    const stale     = isMatStale(nombre);
    const esc       = nombre.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `<div class="catalog-row${stale ? ' mat-row-stale' : ''}">
      <span class="catalog-nombre" title="${nombre}">${nombre}${stale ? ' <span class="stale-icon" title="Desactualizado (>6h)">⏱</span>' : ''}</span>
      <input class="mat-price-inline catalog-price-input" type="number" value="${precio || ''}"
        placeholder="—" min="0"
        onkeydown="if(event.key==='Enter'){updateCatalogPrice('${esc}',this.value);this.blur();renderSuperglu();}"
        onchange="updateCatalogPrice('${esc}',this.value);renderSuperglu();">
    </div>`;
  }).join('');
  list.innerHTML = rows;
}

function toggleCatalog() {
  catalogOpen = !catalogOpen;
  document.getElementById('catalog-body').style.display = catalogOpen ? '' : 'none';
  document.getElementById('catalog-toggle-icon').textContent = catalogOpen ? '▾' : '▸';
  if (catalogOpen) renderCatalog('');
}

function renderCatalog(filterText) {
  const list = document.getElementById('catalog-list');
  if (!list || !catalogOpen) return;
  const q = ((filterText !== undefined ? filterText : document.getElementById('catalog-search')?.value) || '').toLowerCase().trim();
  const entries = Object.entries(catalogNames)
    .filter(([, n]) => !q || n.toLowerCase().includes(q))
    .sort(([,a],[,b]) => a.localeCompare(b, 'es'));
  if (!entries.length) { list.innerHTML = '<div class="cat-empty">Catálogo vacío</div>'; return; }
  list.innerHTML = entries.map(([key, nombre]) => {
    const precio  = catalog[key] || 0;
    const esc     = nombre.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const recItem = items.find(i => i.categoria === 'recoleccion' && normName(i.nombre) === key);
    const icon    = recItem ? `<span title="${recItem.profesion}" style="color:var(--green);font-size:0.75rem">🌿</span>` : '';
    return `<div class="catalog-row">
      ${icon}<span class="catalog-nombre" title="${nombre}">${nombre}</span>
      <input class="mat-price-inline catalog-price-input" type="number" value="${precio || ''}"
        placeholder="—" min="0" onchange="updateCatalogPrice('${esc}', this.value)">
      <button class="ph-del-btn" title="Eliminar del catálogo" onclick="deleteCatalogEntry('${esc}')">🗑</button>
    </div>`;
  }).join('');
}

let ingredienteOpen = false;

function toggleIngrediente() {
  ingredienteOpen = !ingredienteOpen;
  document.getElementById('ingrediente-body').style.display = ingredienteOpen ? '' : 'none';
  document.getElementById('ingrediente-toggle-icon').textContent = ingredienteOpen ? '▾' : '▸';
  if (ingredienteOpen) renderIngredienteSearch('');
}

// Devuelve si el ingrediente `q` aparece en la receta de `item` (directa o transitivamente)
// `directo` sale true solo si aparece como ingrediente directo
function _ingredienteUsadoEn(q, item, visited = new Set()) {
  if (visited.has(item.id)) return { usado: false, directo: false };
  visited.add(item.id);
  const allMats = [...(item.materiales || []), ...(item.recetas_alt || []).flat()];
  let directo = false;
  for (const m of allMats) {
    if (normName(m.nombre).includes(q)) { directo = true; break; }
  }
  if (directo) return { usado: true, directo: true };
  // Búsqueda transitiva: seguir item_id de sub-items
  for (const m of allMats) {
    if (!m.item_id) continue;
    const sub = items.find(i => i.id === m.item_id);
    if (sub && _ingredienteUsadoEn(q, sub, visited).usado) return { usado: true, directo: false };
  }
  return { usado: false, directo: false };
}

function renderIngredienteSearch(query) {
  const list = document.getElementById('ingrediente-list');
  if (!list || !ingredienteOpen) return;
  const q = normName(query !== undefined ? query : (document.getElementById('ingrediente-search')?.value || ''));
  if (!q) {
    list.innerHTML = '<div class="cat-empty" style="font-style:italic">Escribe un nombre de ingrediente</div>';
    return;
  }
  const crafteos = items
    .filter(i => i.categoria === 'crafteo')
    .map(i => ({ item: i, res: _ingredienteUsadoEn(q, i) }))
    .filter(({ res }) => res.usado);

  if (!crafteos.length) { list.innerHTML = '<div class="cat-empty">Sin resultados</div>'; return; }
  list.innerHTML = crafteos.map(({ item: i, res }) => {
    const emoji  = PROF_EMOJI[i.profesion] || '🔨';
    const nombre = i.nombre.replace(/</g, '&lt;');
    const idEsc  = i.id.replace(/"/g, '&quot;');
    const tag    = res.directo
      ? ''
      : `<span style="color:var(--muted);font-size:0.7rem;font-style:italic">vía sub-item</span>`;
    return `<div class="catalog-row" style="cursor:pointer;gap:4px" onclick="scrollToItem('${idEsc}')">
      <span style="font-size:0.75rem">${emoji}</span>
      <span class="catalog-nombre" title="${nombre}">${nombre}</span>
      <span style="margin-left:auto;flex-shrink:0">${tag}</span>
    </div>`;
  }).join('');
}

function scrollToItem(id) {
  const el = document.querySelector(`#cards [data-id="${id.replace(/"/g, '\\"')}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('card-highlight');
  setTimeout(() => el.classList.remove('card-highlight'), 2000);
}

async function deleteCatalogEntry(nombre) {
  const key = normName(nombre);
  delete catalog[key];
  delete catalogNames[key];
  renderCatalog();
  updateMatDatalist();
  fetch(`${API_MAT}?nombre=${encodeURIComponent(nombre)}`, { method: 'DELETE' }).catch(() => {});
}

function setCategoria(cat) { categoriaFilter = cat; matBaseFilter = null; activeProfesiones.clear(); renderMatBase(); render(); }
function toggleProfesion(p) { activeProfesiones.has(p) ? activeProfesiones.delete(p) : activeProfesiones.add(p); render(); }
function toggleRareza(r)    { activeRarezas.has(r) ? activeRarezas.delete(r) : activeRarezas.add(r); render(); }
function toggleTipo(t)      { activeTipos.has(t) ? activeTipos.delete(t) : activeTipos.add(t); render(); }

function toggleSoloRentables() {
  soloRentables = !soloRentables;
  document.getElementById('toggle-rent').classList.toggle('on', soloRentables);
  render();
}

function setNivelRange() {
  const minVal = parseInt(document.getElementById('nivel-min').value);
  const maxVal = parseInt(document.getElementById('nivel-max').value);
  nivelMin = isNaN(minVal) ? null : minVal;
  nivelMax = isNaN(maxVal) ? null : maxVal;
  render();
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
async function deleteItem(id) {
  const _allMats = i => [...(i.materiales || []), ...(i.recetas_alt || []).flat()];
  const dependientes = items.filter(i => _allMats(i).some(m => m.item_id === id));
  let msg = '¿Eliminar este item?';
  if (dependientes.length) {
    const lista = dependientes.map(i => `· ${i.nombre}`).join('\n');
    msg = `Este item está vinculado como ingrediente en ${dependientes.length} crafteo${dependientes.length > 1 ? 's' : ''}:\n${lista}\n\n¿Eliminar y desvincular automáticamente?`;
  }
  if (!confirm(msg)) return;
  if (dependientes.length) {
    const _unlink = mats => mats.map(m => m.item_id === id ? { ...m, item_id: null } : m);
    for (const dep of dependientes) {
      dep.materiales  = _unlink(dep.materiales  || []);
      dep.recetas_alt = (dep.recetas_alt || []).map(r => _unlink(r));
    }
    await Promise.all(dependientes.map(i => pushItem(i)));
  }
  items = items.filter(i => i.id !== id);
  render();
  await removeItemFromDb(id);
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
// Actualiza el botón "Usar versión X como ingrediente" según la rareza actual del form
// Abre el modal pre-rellenado para crear una variante faltante de un grupo de recolección
function crearVarianteRec(grupoNombre, profesion, nivelItem, rareza_mat) {
  openModal(null);
  document.getElementById('f-profesion').value  = profesion;
  document.getElementById('f-categoria').value  = 'recoleccion';
  onCategoriaChange();
  document.getElementById('f-grupo-rec').value  = grupoNombre;
  document.getElementById('f-rareza-mat').value = rareza_mat;
  if (nivelItem) document.getElementById('f-nivel-item-rec').value = nivelItem;
  document.getElementById('f-grupo-rec').focus();
}

function updateVersionPrevBtn() {
  const wrap = document.getElementById('version-prev-wrap');
  if (!wrap) return;
  const rareza = document.getElementById('f-rareza')?.value;
  const nombre = document.getElementById('f-nombre')?.value.trim();
  const cat    = document.getElementById('f-categoria')?.value;
  if (!rareza || !nombre || cat !== 'crafteo') { wrap.innerHTML = ''; return; }

  const idx = RAREZAS.indexOf(rareza);
  const prev = idx > 0 ? RAREZAS[idx - 1] : null;
  const next = idx >= 0 && idx < RAREZAS.length - 1 ? RAREZAS[idx + 1] : null;

  let html = '';
  if (prev) {
    const exists = items.find(i => i.categoria === 'crafteo' && normName(i.nombre) === normName(nombre) && i.rareza === prev);
    html += `<button type="button" class="ver-prev-btn" onclick="addVersionComoIngrediente('${prev.replace(/'/g,"\\'")}')">
      ↓ Añadir ${prev} como ingrediente${exists ? '' : ' (crear)'}
    </button>`;
  }
  if (next) {
    const exists = items.find(i => i.categoria === 'crafteo' && normName(i.nombre) === normName(nombre) && i.rareza === next);
    html += `<button type="button" class="ver-prev-btn ver-next-btn" onclick="addVersionComoIngrediente('${next.replace(/'/g,"\\'")}')">
      ↑ Añadir ${next} como ingrediente${exists ? '' : ' (crear)'}
    </button>`;
  }
  wrap.innerHTML = html;
}

async function addVersionComoIngrediente(rareza) {
  const nombre = document.getElementById('f-nombre')?.value.trim();
  if (!nombre) return;

  // Buscar si ya existe
  let refItem = items.find(i =>
    i.categoria === 'crafteo' &&
    normName(i.nombre) === normName(nombre) &&
    i.rareza === rareza
  );

  if (!refItem) {
    // Crear stub con esa rareza
    const profesion = document.getElementById('f-profesion')?.value || '';
    const stub = {
      id:                Date.now().toString(36) + Math.random().toString(36).slice(2),
      nombre,
      nombre_alternativo: null,
      profesion,
      categoria:         'crafteo',
      rareza_mat:        null,
      grupo_recoleccion: null,
      lugar:             null,
      nivel_item:        parseInt(document.getElementById('f-nivel-item')?.value, 10) || null,
      nivel_profesion:   null,
      tipo:              document.getElementById('f-tipo')?.value || null,
      rareza,
      materiales:        [],
      historial_precios: [],
      comprados:         0, en_venta: 0, vendidos: 0,
    };
    items.push(stub);
    await pushItem(stub);
    render();
    refItem = stub;
  }

  // Añadir fila de material vinculada
  addMaterialRow(nombre, 1, '', refItem.id);
}

// ─────────────────────────────────────────────
// DETECCIÓN Y SIMPLIFICACIÓN DE MODALES PARA MATERIALES BASE
// ─────────────────────────────────────────────

// Devuelve { profesion, nivel, isSecundario, isSuperglu } si el nombre es un mat base conocido, o null
function _inferMatBase(nombre) {
  const n = normName(nombre);
  // Superglú: item de compra, sin receta
  if (n.startsWith('superglú') || n.startsWith('superglu')) {
    return { profesion: null, nivel: null, isSecundario: false, isSuperglu: true };
  }
  // Secundarios (MAT_SECUNDARIO_BASE): Hilo, Acero, Tabla, Harina, Encantártaro, Esencia, Aceite
  for (const [prof, base] of Object.entries(MAT_SECUNDARIO_BASE)) {
    const b = normName(base);
    if (n === b || n.startsWith(b + ' ')) {
      const sufijoStr = n.length > b.length ? n.slice(b.length + 1) : '';
      const tier      = sufijoStr ? SUFIJOS_NIVEL.findIndex(s => normName(s) === sufijoStr) : 0;
      return { profesion: prof, nivel: tier >= 0 ? tier * 10 + 5 : null, isSecundario: true, isSuperglu: false };
    }
  }
  // Primarios (PROF_MAT_BASE): Fibra, Mango, Cuero, Placa, Gema, Escuadrita, Orbe, Especia, Esencia
  for (const [prof, data] of Object.entries(PROF_MAT_BASE)) {
    const allMats = [
      { mat: data,                 isExtra: false },
      ...(data.extras || []).map(e => ({ mat: e, isExtra: true })),
    ];
    for (const { mat, isExtra } of allMats) {
      const b = normName(mat.nombre);
      if (n === b || n.startsWith(b + ' ')) {
        const sufijoStr = n.length > b.length ? n.slice(b.length + 1) : '';
        const sufArr    = mat.masc ? SUFIJOS_NIVEL_MASC : SUFIJOS_NIVEL;
        const tier      = sufijoStr ? sufArr.findIndex(s => normName(s) === sufijoStr) : 0;
        return { profesion: prof, nivel: tier >= 0 ? tier * 10 + 1 : null, isSecundario: false, isSuperglu: false, isExtra };
      }
    }
  }
  return null;
}

// Oculta campos irrelevantes cuando el modal se abre para un material base o superglú
function _applyMatBaseFormSimplify(info) {
  if (!info) return;
  // Siempre: ocultar profesion/cat, equip-fields completo, hint, planificador y sugerencias
  document.getElementById('prof-cat-row')?.style.setProperty('display', 'none');
  document.getElementById('equip-fields')?.style.setProperty('display', 'none');
  document.getElementById('mat-base-hint')?.style.setProperty('display', 'none');
  document.getElementById('plan-craftear-wrap')?.style.setProperty('display', 'none');
  document.getElementById('mat-suggestions')?.style.setProperty('display', 'none');
  // Superglú: también ocultar receta (no se craftea) y nombre (ya se muestra en el título)
  if (info.isSuperglu) {
    document.getElementById('mat-section-wrap')?.style.setProperty('display', 'none');
    document.getElementById('nombre-group')?.style.setProperty('display', 'none');
  } else if (info.profesion === 'Peletero' || (info.profesion === 'Ebanista' && info.isExtra)) {
    // Esencias (Peletero) y Orbes (Ebanista extras) pueden tener recetas alternativas
    const sec = document.getElementById('recetas-alt-section');
    if (sec) sec.style.display = '';
  }
}

// Restaura el modal a su estado normal
function _resetMatBaseFormSimplify() {
  ['prof-cat-row','equip-fields','mat-section-wrap','plan-craftear-wrap','nombre-group']
    .forEach(id => document.getElementById(id)?.style.removeProperty('display'));
  const sec = document.getElementById('recetas-alt-section');
  if (sec) { sec.style.display = 'none'; }
  _clearRecetasAlt();
}

// ─── RECETAS ALTERNATIVAS ──────────────────────────────────────────────────
let recetaAltCount = 0;

function addRecetaAlt(materiales = []) {
  const idx = recetaAltCount++;
  const label = String.fromCharCode(66 + idx); // B, C, D…
  const group = document.createElement('div');
  group.className = 'receta-alt-group';
  group.id = `receta-alt-group-${idx}`;
  group.innerHTML = `
    <div class="receta-alt-header">
      <span class="receta-alt-label">Receta ${label}</span>
      <button type="button" class="receta-alt-remove" onclick="removeRecetaAlt(${idx})">✕</button>
    </div>
    <div class="receta-alt-mats" id="receta-alt-mats-${idx}"></div>
    <button type="button" class="add-mat-btn receta-alt-add-btn"
      onclick="addMaterialRow('','','','','',null,'receta-alt-mats-${idx}')">+ Material</button>`;
  document.getElementById('recetas-alt-list').appendChild(group);
  materiales.forEach(m =>
    addMaterialRow(m.nombre, m.cantidad, m.profesion || '', m.item_id || '', m.nivel_rec || null, m.rareza_mat || null, `receta-alt-mats-${idx}`)
  );
  if (!materiales.length) {
    // Default: inferir recProf del item editado, cantidad 5
    addMaterialRow('', '', '', '', null, null, `receta-alt-mats-${idx}`);
  }
}

function removeRecetaAlt(idx) {
  document.getElementById(`receta-alt-group-${idx}`)?.remove();
}

function _clearRecetasAlt() {
  recetaAltCount = 0;
  const list = document.getElementById('recetas-alt-list');
  if (list) list.innerHTML = '';
}

function getRecetasAltFromForm() {
  const list = document.getElementById('recetas-alt-list');
  if (!list) return [];
  return Array.from(list.querySelectorAll('.receta-alt-group')).map(group => {
    const containerId = group.querySelector('.receta-alt-mats')?.id;
    if (!containerId) return [];
    return Array.from(document.getElementById(containerId).querySelectorAll('.loot-form-row'))
      .map(row => {
        const c        = row.id.replace('mat-row-', '');
        const rarezaRow = document.getElementById(`mr-row-${c}`);
        const isRaro    = !!(rarezaRow?.querySelector('.mat-rr-raro.active'));
        const nivelRecEl = document.getElementById(`mr-nivel-${c}`);
        const m = {
          nombre:    row.querySelector('.mf-nombre').value.trim(),
          cantidad:  Math.max(1, parseInt(row.querySelector('.mf-cantidad').value, 10) || 1),
          profesion: row.querySelector('.mf-profesion')?.value || null,
          item_id:   row.querySelector('.mf-item-id')?.value   || null,
          rareza_mat: isRaro ? 'raro' : null,
          nivel_rec:  parseInt(nivelRecEl?.value, 10) || null,
        };
        return m;
      })
      .filter(m => m.nombre)
      .map(m => ({
        nombre:   m.nombre,
        cantidad: m.cantidad,
        ...(m.profesion  ? { profesion:  m.profesion  } : {}),
        ...(m.item_id    ? { item_id:    m.item_id    } : {}),
        ...(m.rareza_mat ? { rareza_mat: m.rareza_mat } : {}),
        ...(m.nivel_rec  ? { nivel_rec:  m.nivel_rec  } : {}),
      }));
  }).filter(r => r.length);
}

// Si un material base (primario) no tiene ingredientes, busca un hermano del mismo tier
// y misma familia de recolección (recProf) que sí los tenga y copia su receta.
function _prefillFromSiblingBase(profesion, nivel) {
  const matData = PROF_MAT_BASE[profesion];
  if (!matData) return;
  const recProf = matData.recProf;
  const tier    = getSufijoTier(nivel);

  // Nivel representativo del tier para calcular nombres de hermanos
  const nivelTier = tier * 10 + 1;

  // Recoger todos los nombres de base materials del mismo recProf (excluye la profesión actual)
  for (const [prof, data] of Object.entries(PROF_MAT_BASE)) {
    if (prof === profesion) continue;
    // Comprobar recProf del entry principal y sus extras
    const candidatos = [data, ...(data.extras || [])].filter(d => d.recProf === recProf);
    for (const cand of candidatos) {
      const sufijo   = cand.masc ? getSufijoMasc(nivelTier) : getSufijo(nivelTier);
      const nombre   = sufijo ? `${cand.nombre} ${sufijo}` : cand.nombre;
      const sibItem  = items.find(i =>
        i.categoria === 'crafteo' &&
        normName(i.nombre) === normName(nombre) &&
        (i.materiales || []).length > 0
      );
      if (!sibItem) continue;
      // Hermano encontrado con receta: copiar sus ingredientes al formulario
      // Resolver item_id por nombre si el hermano no lo tenía enlazado
      sibItem.materiales.forEach(m => {
        const resolvedId = (m.item_id && items.find(i => i.id === m.item_id))
          ? m.item_id
          : (items.find(i => normName(i.nombre) === normName(m.nombre))?.id || '');
        addMaterialRow(m.nombre, m.cantidad, m.profesion || '', resolvedId, m.nivel_rec || null, m.rareza_mat || null);
      });
      return; // Solo necesitamos uno
    }
  }
}

// Abre el modal simplificado para un material base o superglú (stock / receta / precio)
function openMatBaseModal(nombre) {
  const info = _inferMatBase(nombre);
  openModal(null);
  document.getElementById('modal-title').textContent = nombre;
  document.getElementById('f-nombre').value    = nombre;
  document.getElementById('f-categoria').value = 'crafteo';
  onCategoriaChange();
  if (info?.profesion) {
    document.getElementById('f-profesion').value = info.profesion;
    _updateTipoSelect(info.profesion);
  }
  if (info?.nivel != null) {
    document.getElementById('f-nivel-item').value = info.nivel;
    updateMatSuggestions();
  }
  _applyMatBaseFormSimplify(info);
  // Pre-rellenar desde hermano del mismo tier y recProf si existe
  if (info?.profesion && info?.nivel != null && !info.isSecundario && !info.isSuperglu) {
    _prefillFromSiblingBase(info.profesion, info.nivel);
  }
}

function openModal(id) {
  editingId = id || null;
  matCount  = 0;
  document.getElementById('item-form').reset();
  document.getElementById('mat-container').innerHTML = '';
  document.getElementById('modal-title').textContent = id ? 'Editar Item' : 'Añadir Item';
  const varBtnsEl = document.getElementById('rec-var-btns');
  if (varBtnsEl) { varBtnsEl.style.display = 'none'; varBtnsEl.innerHTML = ''; }
  _resetMatBaseFormSimplify();
  onCategoriaChange();

  if (id) {
    const item = items.find(i => i.id === id);
    if (item) {
      document.getElementById('f-profesion').value  = item.profesion;
      document.getElementById('f-categoria').value  = item.categoria;
      onCategoriaChange();
      _updateTipoSelect(item.profesion);
      document.getElementById('f-comprados').value  = item.comprados  || 0;
      document.getElementById('f-en-venta').value   = item.en_venta   || 0;
      document.getElementById('f-vendidos').value   = item.vendidos   || 0;
      document.getElementById('f-coste-base').value = item.coste_base || '';
      if (item.categoria === 'recoleccion') {
        const grupoRec = item.grupo_recoleccion || item.nombre;
        document.getElementById('f-grupo-rec').value      = grupoRec;
        document.getElementById('f-rareza-mat').value     = item.rareza_mat || 'normal';
        document.getElementById('f-lugar').value          = item.lugar || '';
        document.getElementById('f-nivel-item-rec').value = item.nivel_item || '';

        // Mini-formularios inline para variantes faltantes del grupo
        _buildRecVarForms(grupoRec, item.profesion, item.nivel_item || null, item.lugar || '');
      } else {
        document.getElementById('f-nombre').value      = item.nombre;
        document.getElementById('f-nivel-item').value  = item.nivel_item      || '';
        document.getElementById('f-nivel-prof').value  = item.nivel_profesion || '';
        document.getElementById('f-tipo').value        = item.tipo   || '';
        document.getElementById('f-rareza').value      = item.rareza || '';
        setTimeout(updateMatSuggestions, 0);
        setTimeout(updateVersionPrevBtn, 0);
        (item.materiales || []).forEach(m => addMaterialRow(m.nombre, m.cantidad, m.profesion || '', m.item_id || '', m.nivel_rec || null, m.rareza_mat || null));
        // Simplificar modal si es un material base (primario o secundario)
        setTimeout(() => {
          const infoBase = _inferMatBase(item.nombre);
          _applyMatBaseFormSimplify(infoBase);
          if (infoBase?.isSuperglu) document.getElementById('modal-title').textContent = item.nombre;
          (item.recetas_alt || []).forEach(r => addRecetaAlt(r));
          // Si es un primario sin ingredientes aún, intentar copiar de hermano del mismo tier
          if (infoBase?.profesion && infoBase?.nivel != null && !infoBase.isSecundario && !infoBase.isSuperglu
              && (item.materiales || []).length === 0) {
            _prefillFromSiblingBase(infoBase.profesion, infoBase.nivel);
          }
        }, 0);
      }
    }
  }
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('f-nombre').focus();
}

// Construye mini-formularios inline para las variantes faltantes de un grupo de recolección
function _buildRecVarForms(grupoNombre, profesion, nivelBase, lugarBase) {
  const varBtnsEl = document.getElementById('rec-var-btns');
  if (!varBtnsEl) return;

  // Usar grupoKey para agrupar por tier cuando hay nivel (igual que getDisplayUnits)
  const refKey = nivelBase != null
    ? `tier${getSufijoTier(nivelBase)}||${profesion}`
    : `${grupoNombre}||${profesion}`;
  const grupoItems = items.filter(i =>
    i.categoria === 'recoleccion' && grupoKey(i) === refKey
  );
  const hasNormal  = grupoItems.some(i => !i.rareza_mat || i.rareza_mat === 'normal');
  const hasRaro    = grupoItems.some(i => i.rareza_mat === 'raro');
  const hasSemilla = grupoItems.some(i => i.rareza_mat === 'semilla');

  const DEFS = [
    { key: 'normal',  label: 'Normal',      cls: '',            has: hasNormal  },
    { key: 'raro',    label: '★ Raro',      cls: 'var-raro',    has: hasRaro    },
    { key: 'semilla', label: '🌱 Semilla',   cls: 'var-semilla', has: hasSemilla },
  ];
  const faltantes = DEFS.filter(d => !d.has);
  if (!faltantes.length) { varBtnsEl.style.display = 'none'; varBtnsEl.innerHTML = ''; return; }

  const gEsc  = grupoNombre.replace(/"/g, '&quot;').replace(/'/g, "\\'");
  const pEsc  = profesion.replace(/'/g, "\\'");

  const formsHtml = faltantes.map(d => {
    return `<div class="rec-var-mini-form">
      <div class="rec-var-mini-header ${d.cls}">${d.label}</div>
      <div class="rec-var-mini-row">
        <input type="text" class="form-input" id="rv-nombre-${d.key}" placeholder="Nombre del recurso"
          style="flex:2">
        <input type="number" class="form-input" id="rv-nivel-${d.key}" placeholder="Nivel"
          value="${nivelBase || ''}" min="1" max="160" style="width:70px">
        <input type="text" class="form-input" id="rv-lugar-${d.key}" placeholder="Lugar (opcional)"
          value="${lugarBase || ''}" style="flex:1">
        <button type="button" class="rec-var-mini-save ${d.cls}"
          onclick="guardarVarianteInline('${gEsc}','${pEsc}','${d.key}')">Guardar</button>
      </div>
    </div>`;
  }).join('');

  varBtnsEl.innerHTML = `<div class="rec-var-btns-label">📎 Variantes del grupo — faltan:</div>${formsHtml}`;
  varBtnsEl.style.display = '';
}

// Guarda una variante nueva de un grupo de recolección desde el mini-formulario inline
async function guardarVarianteInline(grupoNombre, profesion, rareza) {
  const nombreInput = document.getElementById(`rv-nombre-${rareza}`);
  const nivelInput  = document.getElementById(`rv-nivel-${rareza}`);
  const lugarInput  = document.getElementById(`rv-lugar-${rareza}`);
  const nombre      = nombreInput?.value.trim();
  const nivel       = parseInt(nivelInput?.value, 10) || null;
  const lugar       = lugarInput?.value.trim() || null;

  if (!nombre) { nombreInput?.focus(); return; }

  // Evitar duplicados
  if (items.find(i => i.categoria === 'recoleccion' && normName(i.nombre) === normName(nombre) && i.profesion === profesion)) return;

  const newItem = {
    id:                Date.now().toString(36) + Math.random().toString(36).slice(2),
    nombre, rareza_mat: rareza, grupo_recoleccion: grupoNombre,
    profesion, categoria: 'recoleccion',
    nivel_item: nivel, nivel_profesion: null, tipo: null, rareza: null, lugar,
    materiales: [], historial_precios: [],
    comprados: 0, en_venta: 0, vendidos: 0,
  };
  items.push(newItem);
  catalogNames[normName(nombre)] = nombre;
  await pushItem(newItem);
  render();

  // Actualizar los mini-formularios para que desaparezca el que acabamos de guardar
  const grupoActual  = document.getElementById('f-grupo-rec')?.value;
  const profActual   = document.getElementById('f-profesion')?.value;
  const nivelActual  = parseInt(document.getElementById('f-nivel-item-rec')?.value, 10) || null;
  const lugarActual  = document.getElementById('f-lugar')?.value.trim() || '';
  if (grupoActual === grupoNombre && profActual === profesion) {
    _buildRecVarForms(grupoNombre, profActual, nivelActual, lugarActual);
  }
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  editingId = null;
}

function onProfesionChange() {
  const prof     = document.getElementById('f-profesion').value;
  const catSel   = document.getElementById('f-categoria');
  const onlyCraft   = PROFESIONES_CRAFTEO.includes(prof)     && !PROFESIONES_RECOLECCION.includes(prof);
  const onlyRecolec = PROFESIONES_RECOLECCION.includes(prof) && !PROFESIONES_CRAFTEO.includes(prof);
  if (onlyCraft)   catSel.value = 'crafteo';
  if (onlyRecolec) catSel.value = 'recoleccion';
  onCategoriaChange();
  _updateTipoSelect(prof);
  updateMatSuggestions();
}

// Muestra botones de sugerencia de materiales base según profesión + nivel de profesión
function updateMatSuggestions() {
  const sugEl = document.getElementById('mat-suggestions');
  if (!sugEl) return;
  // El tier de los materiales básicos lo determina el nivel de profesión (no el nivel del item)
  const nivel = parseInt(document.getElementById('f-nivel-prof')?.value, 10)
             || parseInt(document.getElementById('f-nivel-item')?.value, 10);
  const prof  = document.getElementById('f-profesion')?.value;
  const cat   = document.getElementById('f-categoria')?.value;

  if (cat !== 'crafteo' || !nivel || !prof) { sugEl.style.display = 'none'; return; }

  // Para los extras (Orbe de Ebanista), el nivelMin se comprueba contra el máximo de ambos
  // campos de nivel, no solo nivel_prof, para no ocultar el Orbe si nivel_prof < 45.
  const nivelProf = parseInt(document.getElementById('f-nivel-prof')?.value, 10) || 0;
  const nivelItem = parseInt(document.getElementById('f-nivel-item')?.value, 10) || 0;
  const matBases = getMatBaseNombresAll(prof, nivel, Math.max(nivelProf, nivelItem));
  const matSecs  = getMatSecNombres(nivel);
  const tier     = getSufijoTier(nivel);
  const sufijo   = getSufijo(nivel);
  const nivelPrimario   = tier * 10;
  const nivelSecundario = tier * 10 + 5;

  let html = `<span class="sug-tier-label">Tier ${tier} · sufijo <strong>${sufijo}</strong> · primario lvl ${nivelPrimario} / secundario lvl ${nivelSecundario}</span>`;

  for (const { nombre: matBase } of matBases) {
    const esc       = matBase.replace(/'/g, "\\'");
    const baseCraft = items.find(i => i.categoria === 'crafteo' && normName(i.nombre) === normName(matBase));
    const baseId    = baseCraft ? baseCraft.id.replace(/'/g,"\\'") : '';
    const baseTitle = baseCraft
      ? `Material base de ${prof} · ya tienes receta → coste enlazado`
      : `Material base de ${prof} · sin receta propia aún (créala para calcular coste exacto)`;
    html += `<button type="button" class="sug-btn sug-btn-base ${baseCraft ? 'sug-btn-known' : ''}"
      onclick="addMaterialRow('${esc}', 1, '', '${baseId}')"
      title="${baseTitle}">
      + ${matBase}${baseCraft ? ' 🔗' : ''}
    </button>`;
  }

  if (matSecs.length) {
    html += `<span class="sug-sep">· Secundarios:</span>`;
    matSecs.forEach(m => {
      const enCatalog = normName(m.nombre) in catalog;
      const esc       = m.nombre.replace(/'/g, "\\'");
      const profArg   = m.profesion ? m.profesion.replace(/'/g, "\\'") : '';
      html += `<button type="button" class="sug-btn ${enCatalog ? 'sug-btn-known' : ''}"
        onclick="addMaterialRow('${esc}', 5, '${profArg}', '')"
        title="${m.profesion || 'Material secundario'}${enCatalog ? ' · ya en catálogo' : ''}">
        + ${m.nombre}×5${enCatalog ? ' ✓' : ''}
      </button>`;
    });
  }

  // Superglú (material base universal, nivel determinado por tier del item)
  const sgNombre  = getSupergluNombre(nivel);
  const sgInCat   = normName(sgNombre) in catalog;
  const sgEsc     = sgNombre.replace(/'/g, "\\'");
  html += `<span class="sug-sep">·</span>
    <button type="button" class="sug-btn sug-btn-superglu ${sgInCat ? 'sug-btn-known' : ''}"
      onclick="addMaterialRow('${sgEsc}', 1, '__superglu__', '')"
      title="Material base universal · ${sgNombre}">
      🔧 ${sgNombre}${sgInCat ? ' ✓' : ''}
    </button>`;

  // Botón de plantilla completa: añade base + secundarios + superglú de una vez
  html += `<span class="sug-sep">·</span>
    <button type="button" class="sug-btn sug-btn-plantilla"
      onclick="addPlantillaBasica('${prof.replace(/'/g,"\\'")}',${ nivel })"
      title="Añade todos los ingredientes estándar de un crafteo de ${prof} nivel ${nivel}: base + secundarios + superglú">
      ⚡ Plantilla completa
    </button>`;

  sugEl.innerHTML = html;
  sugEl.style.display = '';
}

function addPlantillaBasica(prof, nivel) {
  const sufijo  = getSufijo(nivel);
  const recProf = PROF_MAT_BASE[prof]?.recProf;
  const secBase = recProf ? MAT_SECUNDARIO_BASE[recProf] : null;
  if (secBase && sufijo) {
    const profArg = PROFESIONES_RECOLECCION.includes(recProf) ? recProf : '';
    addMaterialRow(`${secBase} ${sufijo}`, 5, profArg, '');
  }
  addMaterialRow('Polvo', 1, '', '');
  addMaterialRow(getSupergluNombre(nivel), 1, '__superglu__', '');
}

function _updateTipoSelect(prof) {
  const tipoSel = document.getElementById('f-tipo');
  if (!tipoSel) return;
  const tipoGroup = tipoSel.closest('.form-group');

  // Profesiones conocidas que NO fabrican equipo equipable → ocultar tipo
  if (PROFESIONES_CRAFTEO.includes(prof) && !(prof in PROF_TIPOS)) {
    tipoSel.value = '';
    if (tipoGroup) tipoGroup.style.display = 'none';
    // Continuar para actualizar el hint de material base
  } else {
    if (tipoGroup) tipoGroup.style.display = '';
    const tiposDisp  = PROF_TIPOS[prof] || SUBTIPOS_EQUIP;
    const valorActual = tipoSel.value;
    tipoSel.innerHTML = `<option value="">— Ninguno —</option>` +
      tiposDisp.map(t => `<option value="${t}" ${t === valorActual ? 'selected' : ''}>${t}</option>`).join('');
  }

  // Hint de material base típico
  const hintEl = document.getElementById('mat-base-hint');
  if (!hintEl) return;
  const matBase = PROF_MAT_BASE[prof];
  if (matBase) {
    const extras   = (matBase.extras || []).map(e => `<strong>${e.nombre}</strong> <span class="mat-base-ej">(${e.ejemplo})</span>`).join(' · ');
    const extrasHtml = extras ? ` &nbsp;+&nbsp; ${extras}` : '';
    hintEl.innerHTML = `<span class="mat-base-icon">📦</span> Material base: <strong>${matBase.nombre}</strong> <span class="mat-base-ej">(${matBase.ejemplo})</span>${extrasHtml}`;
    hintEl.style.display = '';
  } else {
    hintEl.style.display = 'none';
  }
}

function copyMatName(c) {
  const input = document.querySelector(`#mat-row-${c} .mf-nombre`);
  if (!input || !input.value) return;
  navigator.clipboard?.writeText(input.value);
}

function _updateCosteBaseVisibility() {
  const wrap = document.getElementById('coste-base-wrap');
  if (!wrap) return;
  const cat        = document.getElementById('f-categoria')?.value;
  const matRows    = document.getElementById('mat-container')?.querySelectorAll('.loot-form-row').length || 0;
  wrap.style.display = (cat === 'crafteo' && matRows === 0) ? '' : 'none';
}

function onCategoriaChange() {
  const cat       = document.getElementById('f-categoria').value;
  const isCrafteo = cat === 'crafteo' || cat === 'material';
  document.getElementById('mat-section-wrap').style.display = isCrafteo ? '' : 'none';
  document.getElementById('equip-fields').style.display     = isCrafteo ? '' : 'none';
  document.getElementById('recolec-fields').style.display   = isCrafteo ? 'none' : '';
  document.getElementById('plan-craftear-wrap').style.display = isCrafteo ? '' : 'none';

  // Nombre del item solo visible en crafteo (recolección usa f-grupo-rec)
  const nombreGroup = document.getElementById('f-nombre')?.closest('.form-group');
  if (nombreGroup) nombreGroup.style.display = isCrafteo ? '' : 'none';

  // Etiqueta stock
  const lbl = document.querySelector('#stock-comprados-group .form-label');
  if (lbl) lbl.textContent = isCrafteo ? 'Crafteados' : 'Farmeados';

  _updateCosteBaseVisibility();
}

// ── Fila de material en el formulario ──
function addMaterialRow(nombre = '', cantidad = '', profesionMat = '', itemId = '', nivelRec = null, rarezaMat = null, containerId = 'mat-container') {
  matCount++;
  const c       = matCount;
  const refItem = itemId ? items.find(i => i.id === itemId) : null;

  if (!profesionMat && !itemId && nombre) {
    const rec = items.find(i =>
      i.categoria === 'recoleccion' &&
      (normName(i.nombre) === normName(nombre) || normName(i.nombre_alternativo || '') === normName(nombre))
    );
    if (rec) profesionMat = rec.profesion;
  }
  if (!profesionMat) {
    const editingNombre = document.getElementById('f-nombre')?.value.trim();
    if (editingNombre) {
      const info = _inferMatBase(editingNombre);
      if (info?.profesion) {
        const recProf = PROF_MAT_BASE[info.profesion]?.recProf;
        if (recProf) { profesionMat = recProf; if (!cantidad) cantidad = 5; }
      }
    }
  }

  const profOpts = PROFESIONES_RECOLECCION.map(p =>
    `<option value="${p}" ${p === profesionMat ? 'selected' : ''}>${PROF_EMOJI[p] || ''} ${p}</option>`
  ).join('');

  const precioCat = refItem
    ? (getPrecioActual(refItem) || 0)
    : (nombre ? getCatalogPrice(nombre) : 0);
  const qty = parseInt(cantidad, 10) || 1;

  const row = document.createElement('div');
  row.className = 'loot-form-row';
  row.id = `mat-row-${c}`;
  row.innerHTML = `
    <div class="loot-form-top">
      <input type="text" class="form-input mf-nombre" placeholder="Nombre del material"
        value="${nombre.replace(/"/g, '&quot;')}" style="flex:2;min-width:0"
        list="mat-names-dl" oninput="onMatNombreInput(this, ${c})">
      <input type="number" class="form-input mf-cantidad" placeholder="×"
        value="${cantidad || ''}" min="1" style="width:52px" title="Cantidad"
        oninput="updateMatTotalPreview(${c})">
      ${refItem ? '' : `<input type="number" class="form-input mf-precio" placeholder="Precio/u"
        value="${precioCat || ''}" min="0" style="width:88px" title="Precio unitario (actualiza catálogo compartido)"
        oninput="onMatPrecioInput(this,${c})"
        onkeydown="if(event.key==='Enter'){_flushMatPrecio(this,${c});this.blur();}"
        onblur="_flushMatPrecio(this,${c})">`}
      <span class="mat-price-preview" id="mp-prev-${c}">
        ${refItem ? _matPrevHtml(refItem, precioCat) : _matTotalHtml(precioCat, qty)}
      </span>
      <input type="hidden" class="mf-item-id" value="${itemId}">
      <button type="button" class="action-btn danger"
        onclick="document.getElementById('mat-row-${c}').remove(); _updateCosteBaseVisibility(); updateShoppingList()">✕</button>
    </div>
    <div class="mat-prof-row" id="mp-extra-${c}">
      ${_matExtraHtml(c, nombre, profesionMat, profOpts, itemId, refItem, nivelRec, rarezaMat)}
    </div>`;

  document.getElementById(containerId).appendChild(row);
  if (containerId === 'mat-container') { _updateCosteBaseVisibility(); updateShoppingList(); }
}

function _matTotalHtml(precio, cantidad) {
  const total = (precio || 0) * (cantidad || 1);
  return total > 0
    ? `<span class="mp-val">= ${fmtK(total)}</span>`
    : `<span class="mp-empty">—</span>`;
}

function updateMatTotalPreview(c) {
  const row    = document.getElementById(`mat-row-${c}`);
  if (!row) return;
  const itemId = row.querySelector('.mf-item-id')?.value;
  if (itemId) return; // vinculado, no tocar
  const precio   = parseInt(row.querySelector('.mf-precio')?.value, 10) || 0;
  const cantidad = parseInt(row.querySelector('.mf-cantidad')?.value, 10) || 1;
  const prev     = document.getElementById(`mp-prev-${c}`);
  if (prev) prev.innerHTML = _matTotalHtml(precio, cantidad);
  updateShoppingList();
}

const _matPrecioTimers = {};
function onMatPrecioInput(input, c) {
  const row    = document.getElementById(`mat-row-${c}`);
  if (!row) return;
  const nombre   = row.querySelector('.mf-nombre')?.value.trim();
  const cantidad = parseInt(row.querySelector('.mf-cantidad')?.value, 10) || 1;
  const precio   = parseInt(input.value, 10) || 0;

  // Preview y lista de compra: inmediatos
  const prev = document.getElementById(`mp-prev-${c}`);
  if (prev) prev.innerHTML = _matTotalHtml(precio, cantidad);
  updateShoppingList();

  // Catálogo (→ historial): espera 4 s sin escribir o Enter/blur para confirmar
  if (!nombre) return;
  clearTimeout(_matPrecioTimers[c]);
  _matPrecioTimers[c] = setTimeout(() => { if (nombre) updateCatalogPrice(nombre, precio); }, 4000);
}
function _flushMatPrecio(input, c) {
  clearTimeout(_matPrecioTimers[c]);
  const nombre = document.getElementById(`mat-row-${c}`)?.querySelector('.mf-nombre')?.value.trim();
  const precio = parseInt(input.value, 10) || 0;
  if (nombre) updateCatalogPrice(nombre, precio);
}

function onMatTipoChange(select, c) {
  const val  = select.value;
  const row  = document.getElementById(`mat-row-${c}`);
  if (!row) return;
  const hint = row.querySelector('.mat-prof-hint');
  if (val === '__superglu__') {
    const nivel = parseInt(document.getElementById('f-nivel-item')?.value, 10);
    if (nivel) {
      const sgNombre    = getSupergluNombre(nivel);
      const nombreInput = row.querySelector('.mf-nombre');
      if (nombreInput) nombreInput.value = sgNombre;
      const precio      = getCatalogPrice(sgNombre);
      const precioInput = row.querySelector('.mf-precio');
      if (precioInput) precioInput.value = precio > 0 ? precio : '';
      updateMatTotalPreview(c);
      if (hint) hint.textContent = `✓ ${sgNombre}`;
    } else {
      if (hint) hint.textContent = '⚠ Fija el nivel del item primero';
    }
  } else if (val) {
    if (hint) hint.textContent = '✓ Se vincula con recolección';
  } else {
    if (hint) hint.textContent = '';
  }
  // Mostrar/ocultar toggle Común / ★ Raro
  const rarezaRow = document.getElementById(`mr-row-${c}`);
  if (rarezaRow) {
    const isRec = val && val !== '__superglu__';
    rarezaRow.style.display = isRec ? 'flex' : 'none';
    if (!isRec) {
      // Limpiar "(Raro)" del nombre si se cambia a otro tipo
      const nombreInput = row.querySelector('.mf-nombre');
      if (nombreInput) nombreInput.value = nombreInput.value.replace(/\s*\(Raro\)$/, '');
      const infoEl = document.getElementById(`mr-info-${c}`);
      if (infoEl) infoEl.textContent = '';
      // Resetear botones al estado Común
      rarezaRow.querySelectorAll('.mat-rr-btn').forEach(b => b.classList.remove('active'));
      const btnComun = rarezaRow.querySelector('.mat-rr-btn:not(.mat-rr-raro)');
      if (btnComun) btnComun.classList.add('active');
    }
  }
}

function setMatRareza(c, rareza) {
  const row = document.getElementById(`mat-row-${c}`);
  if (!row) return;
  const nombreInput = row.querySelector('.mf-nombre');
  if (!nombreInput) return;

  // Actualizar estado visual de los botones
  const rarezaRow = document.getElementById(`mr-row-${c}`);
  if (rarezaRow) {
    rarezaRow.querySelectorAll('.mat-rr-btn').forEach(b => b.classList.remove('active'));
    const target = rareza === 'raro'
      ? rarezaRow.querySelector('.mat-rr-raro')
      : rarezaRow.querySelector('.mat-rr-btn:not(.mat-rr-raro)');
    if (target) target.classList.add('active');
  }

  // Info de versión común (solo cuando rareza === 'raro')
  const infoEl = document.getElementById(`mr-info-${c}`);
  if (!infoEl) return;
  if (rareza === 'raro') {
    const profSel  = document.getElementById(`mp-prof-${c}`);
    const prof     = profSel?.value;
    const nivelRec = parseInt(document.getElementById(`mr-nivel-${c}`)?.value, 10) || null;
    // Buscar común por tier si la profesión usa tier-grouping y hay nivel
    const commonItem = (PROFS_TIER_GROUPING.has(prof) && nivelRec != null)
      ? items.find(i =>
          i.categoria === 'recoleccion' &&
          i.profesion === prof &&
          (i.rareza_mat === 'normal' || !i.rareza_mat) &&
          i.nivel_item != null &&
          getSufijoTier(i.nivel_item) === getSufijoTier(nivelRec)
        )
      : null;
    if (commonItem) {
      const pc = getPrecioActual(commonItem) || getCatalogPrice(commonItem.nombre) || 0;
      infoEl.innerHTML = `↳ Común: <strong>${commonItem.nombre}</strong>${pc > 0 ? ` · <span class="mr-precio">${fmtK(pc)}</span>` : ''}`;
    } else {
      infoEl.innerHTML = nivelRec
        ? `↳ <span style="color:var(--muted)">Sin común en tier ${getSufijoTier(nivelRec)} — se creará nuevo</span>`
        : `↳ <span style="color:var(--muted)">Pon el nivel para detectar el común</span>`;
    }
  } else {
    infoEl.textContent = '';
  }
}

function _matPrevHtml(refItem, precio) {
  if (refItem) {
    const esc = refItem.nombre.replace(/'/g, "\\'");
    return `<span class="mp-val mp-linked">
      🔗 <input class="form-input mf-precio-linked" type="number" min="0" placeholder="—"
        value="${precio || ''}" size="${Math.max(4, String(precio||'').length + 1)}"
        oninput="this.size=Math.max(4,this.value.length+1)"
        onchange="updateCatalogPrice('${esc}',this.value)"
        onkeydown="if(event.key==='Enter')this.blur()"
        title="Precio de ${refItem.nombre} · actualiza catálogo">
    </span>`;
  }
  return precio > 0 ? `<span class="mp-val">${fmtK(precio)}</span>` : `<span class="mp-empty">—</span>`;
}

// Botones de vinculación para una fila de material.
// Solo muestra rarezas cuando el item ya existe con rareza en la BD.
// Para materiales básicos (sin rareza) muestra simplemente el botón de vincular.
// Solo muestra botones de vincular cuando ya existe un item crafteo/material con ese nombre.
// Para materiales básicos sin item registrado → no muestra nada (el catálogo gestiona el precio).
// Buscador para vincular cualquier crafteo existente, independientemente del nombre.
// Solo se muestra cuando no hay match automático por nombre.
function _matSearchLinkHtml(c) {
  const opts = items
    .filter(i => i.categoria === 'crafteo')
    .map(i => {
      const label = i.rareza ? `${i.nombre} [${i.rareza}]` : i.nombre;
      return `<option value="${label.replace(/"/g, '&quot;')}">`;
    }).join('');
  return `<span class="mat-search-link">
    <input class="mat-search-input" list="msl-dl-${c}" id="msl-${c}"
      placeholder="🔍 Vincular cualquier item…"
      oninput="_linkBySearch(${c}, this.value)">
    <datalist id="msl-dl-${c}">${opts}</datalist>
  </span>`;
}

function _linkBySearch(c, val) {
  if (!val.trim()) return;
  const rarezaMatch = val.match(/\[(.+?)\]$/);
  const rareza      = rarezaMatch ? rarezaMatch[1] : null;
  const nombreBusq  = normName(val.replace(/\s*\[.*?\]$/, '').trim());
  const found = items.find(i =>
    i.categoria === 'crafteo' &&
    normName(i.nombre) === nombreBusq &&
    (!rareza || i.rareza === rareza)
  );
  if (!found) return;
  document.getElementById(`msl-${c}`).value = '';
  linkMaterial(c, found.id);
}

function _matRarezaBtns(c, existingMatches) {
  if (!existingMatches.length) return ''; // material básico: precio vía catálogo, sin stub

  const tieneRareza = existingMatches.some(i => i.rareza);
  if (!tieneRareza) {
    const found = existingMatches[0];
    return `<span class="mat-link-label">🔗 Vincular:</span>
      <button type="button" class="mat-link-btn"
        onclick="linkMaterial(${c},'${found.id.replace(/'/g,"\\'")}')">
        ${found.nombre}</button>`;
  }
  return `<span class="mat-link-label">🔗 Vincular:</span>` +
    existingMatches.map(i => {
      const rClass = rarezaClass(i.rareza);
      return `<button type="button" class="mat-link-btn ${rClass}"
        onclick="linkMaterial(${c},'${i.id.replace(/'/g,"\\'")}')">
        ${i.rareza || 'Sin rareza'}</button>`;
    }).join('');
}

function _matExtraHtml(c, nombre, profesionMat, profOpts, itemId, refItem, nivelRec = null, rarezaMat = null) {
  if (itemId && refItem) {
    const rClass  = rarezaClass(refItem.rareza);
    const rLabel  = RAREZAS.includes(refItem.rareza) ? refItem.rareza : null;
    const eid     = refItem.id.replace(/'/g, "\\'");
    return `<span class="mat-linked-info">
      🔗 Vinculado ·
      ${rLabel ? `<span class="loot-rareza-badge ${rClass}" style="font-size:0.62rem;padding:0 5px">${rLabel}</span>` : ''}
      <span class="mat-linked-nombre" onclick="closeModal();setTimeout(()=>openModal('${eid}'),50)" title="Clic para editar este item">${refItem.nombre}</span>
    </span>
    <button type="button" class="mat-unlink-btn" onclick="unlinkMaterial(${c})">✕ Desvincular</button>`;
  }

  const crafteoMatches = nombre ? items.filter(i =>
    i.categoria === 'crafteo' && normName(i.nombre) === normName(nombre)
  ) : [];

  const crafteoLinks   = nombre ? _matRarezaBtns(c, crafteoMatches) : '';
  // Buscador libre solo cuando no hay match por nombre (caso equipables con nombre distinto)
  const searchLink = !crafteoLinks ? _matSearchLinkHtml(c) : '';

  const hintText = profesionMat === '__superglu__'
    ? `✓ Superglú (escala por nivel)`
    : (profesionMat ? '✓ Se vincula con recolección' : '');

  const isRecProf = profesionMat && profesionMat !== '__superglu__';
  const isRaro    = rarezaMat === 'raro';

  return `<select class="mf-profesion mat-prof-select" id="mp-prof-${c}"
      title="Tipo de material" onchange="onMatTipoChange(this, ${c})">
      <option value="">📦 Material común</option>
      <option value="__superglu__" ${profesionMat === '__superglu__' ? 'selected' : ''}>🔧 Superglú</option>
      ${profOpts}
    </select>
    <span class="mat-link-suggestions" id="mp-links-${c}">${crafteoLinks}</span>
    ${searchLink}
    <span class="mat-prof-hint">${hintText}</span>
    <div class="mat-rareza-row" id="mr-row-${c}" style="display:${isRecProf ? 'flex' : 'none'}">
      <input type="number" class="form-input mf-nivel-rec" id="mr-nivel-${c}" placeholder="Nivel" min="1" max="200" style="width:68px" title="Nivel del recurso (obligatorio)" value="${nivelRec || ''}" oninput="setMatRareza(${c}, document.getElementById('mr-row-${c}')?.querySelector('.mat-rr-raro.active') ? 'raro' : 'comun')">
      <button type="button" class="mat-rr-btn${!isRaro ? ' active' : ''}" onclick="setMatRareza(${c},'comun')">Común</button>
      <button type="button" class="mat-rr-btn mat-rr-raro${isRaro ? ' active' : ''}" onclick="setMatRareza(${c},'raro')">★ Raro</button>
      <span class="mat-rr-info" id="mr-info-${c}"></span>
    </div>`;
}

function linkMaterial(c, itemId) {
  const row = document.getElementById(`mat-row-${c}`);
  if (!row) return;
  const refItem = items.find(i => i.id === itemId);
  if (!refItem) return;
  row.querySelector('.mf-item-id').value = itemId;
  const prev = document.getElementById(`mp-prev-${c}`);
  if (prev) prev.innerHTML = _matPrevHtml(refItem, getPrecioActual(refItem) || 0);
  const extra = document.getElementById(`mp-extra-${c}`);
  if (extra) extra.innerHTML = _matExtraHtml(c, row.querySelector('.mf-nombre').value, '', '', itemId, refItem);
}

function unlinkMaterial(c) {
  const row = document.getElementById(`mat-row-${c}`);
  if (!row) return;
  row.querySelector('.mf-item-id').value = '';
  const nombre   = row.querySelector('.mf-nombre').value.trim();
  const precio   = nombre ? getCatalogPrice(nombre) : 0;
  const prev     = document.getElementById(`mp-prev-${c}`);
  if (prev) prev.innerHTML = _matPrevHtml(null, precio);
  const profOpts = PROFESIONES_RECOLECCION.map(p =>
    `<option value="${p}">${PROF_EMOJI[p] || ''} ${p}</option>`
  ).join('');
  const extra = document.getElementById(`mp-extra-${c}`);
  if (extra) extra.innerHTML = _matExtraHtml(c, nombre, '', profOpts, '', null);
}

async function createStubAndLink(c, rareza = null) {
  const row = document.getElementById(`mat-row-${c}`);
  if (!row) return;
  const nombre = row.querySelector('.mf-nombre')?.value.trim();
  if (!nombre) return;

  // Detectar tipo según el selector de profesión de la fila
  const profSel = document.getElementById(`mp-prof-${c}`);
  const matProf = profSel?.value || '';
  const esRecoleccion = matProf && matProf !== '__superglu__' && PROFESIONES_RECOLECCION.includes(matProf);

  let categoria, profesion, rareza_mat, grupo_recoleccion;
  let nivel_item_stub = null, lugar_stub = null;
  if (esRecoleccion) {
    // Leer si el toggle Común / ★ Raro está en "raro"
    const rarezaRow  = document.getElementById(`mr-row-${c}`);
    const toggleRaro = rarezaRow?.querySelector('.mat-rr-raro.active');
    rareza_mat        = toggleRaro ? 'raro' : 'normal';
    categoria         = 'recoleccion';
    profesion         = matProf;

    // Nivel obligatorio para recolección
    const nivelInput = document.getElementById(`mr-nivel-${c}`);
    nivel_item_stub  = parseInt(nivelInput?.value, 10) || null;
    if (!nivel_item_stub) { nivelInput?.focus(); return; }

    // Para profesiones con tier-grouping: buscar hermano en el mismo tier para heredar lugar
    // y usar el nombre del COMÚN como grupo_recoleccion (fuente de verdad del grupo)
    let commonItem = null;
    if (PROFS_TIER_GROUPING.has(matProf)) {
      commonItem = items.find(i =>
        i.categoria === 'recoleccion' &&
        i.profesion === matProf &&
        (i.rareza_mat === 'normal' || !i.rareza_mat) &&
        i.nivel_item != null &&
        getSufijoTier(i.nivel_item) === getSufijoTier(nivel_item_stub)
      );
      if (commonItem) lugar_stub = commonItem.lugar || null;
    }
    // grupo_recoleccion = nombre del común si existe, sino nombre del propio item
    grupo_recoleccion = commonItem ? commonItem.nombre : nombre;
  } else {
    // Material secundario (tabla, acero, gema…) o sin profesión
    categoria         = 'material';
    profesion         = document.getElementById('f-profesion')?.value || '';
    rareza_mat        = null;
    grupo_recoleccion = null;
  }

  const stub = {
    id:                Date.now().toString(36) + Math.random().toString(36).slice(2),
    nombre,
    nombre_alternativo: null,
    profesion,
    categoria,
    rareza_mat,
    grupo_recoleccion,
    lugar:             lugar_stub,
    nivel_item:        nivel_item_stub,
    nivel_profesion:   null,
    tipo:              null,
    rareza:            rareza || null,
    materiales:        [],
    historial_precios: [],
    comprados:         0,
    en_venta:          0,
    vendidos:          0,
  };
  items.push(stub);
  await pushItem(stub);

  // Migración: hermanos de la misma profesión sin nivel_item → asignar mismo nivel
  if (PROFS_TIER_GROUPING.has(profesion) && nivel_item_stub != null) {
    const siblingsToFix = items.filter(i =>
      i.id !== stub.id &&
      i.categoria === 'recoleccion' &&
      i.profesion === profesion &&
      i.nivel_item == null
    );
    await Promise.all(siblingsToFix.map(s => {
      s.nivel_item = nivel_item_stub;
      return pushItem(s);
    }));
  }

  render();
  linkMaterial(c, stub.id);
}

// Al escribir el nombre de un material: actualizar preview y sugerencias de vinculación
function onMatNombreInput(input, c) {
  const nombre = input.value.trim();
  const row    = document.getElementById(`mat-row-${c}`);
  if (!row) return;

  const itemId = row.querySelector('.mf-item-id')?.value;
  if (itemId) return; // ya vinculado, ignorar

  const precio      = nombre ? getCatalogPrice(nombre) : 0;
  const precioInput = document.getElementById(`mat-row-${c}`)?.querySelector('.mf-precio');
  if (precioInput) precioInput.value = precio > 0 ? precio : '';
  const cantidad    = parseInt(document.getElementById(`mat-row-${c}`)?.querySelector('.mf-cantidad')?.value, 10) || 1;
  const prev        = document.getElementById(`mp-prev-${c}`);
  if (prev) prev.innerHTML = _matTotalHtml(precio, cantidad);
  updateShoppingList();

  // Auto-detectar profesión recolección
  const profSel = document.getElementById(`mp-prof-${c}`);
  if (profSel && nombre) {
    const rec = items.find(i =>
      i.categoria === 'recoleccion' &&
      (normName(i.nombre) === normName(nombre) || normName(i.nombre_alternativo || '') === normName(nombre))
    );
    if (rec) {
      profSel.value = rec.profesion;
      const hint = row.querySelector('.mat-prof-hint');
      if (hint) hint.textContent = '✓ Ya existe en recolección';
    }
  }

  // Actualizar botones de vinculación a items crafteados
  const linksEl = document.getElementById(`mp-links-${c}`);
  if (linksEl) {
    const matches = nombre ? items.filter(i =>
      i.categoria === 'crafteo' && normName(i.nombre) === normName(nombre)
    ) : [];
    linksEl.innerHTML = nombre ? _matRarezaBtns(c,matches) : '';
  }
}

function _markError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = 'var(--red)';
  el.focus();
  el.title = msg;
  setTimeout(() => { el.style.borderColor = ''; el.title = ''; }, 2500);
}

function getMaterialesFromForm() {
  return Array.from(document.getElementById('mat-container').querySelectorAll('.loot-form-row'))
    .map(row => {
      const c         = row.id.replace('mat-row-', '');
      const rarezaRow  = document.getElementById(`mr-row-${c}`);
      const isRaro     = !!(rarezaRow?.querySelector('.mat-rr-raro.active'));
      const nivelRecEl = document.getElementById(`mr-nivel-${c}`);
      return {
        nombre:     row.querySelector('.mf-nombre').value.trim(),
        cantidad:   Math.max(1, parseInt(row.querySelector('.mf-cantidad').value, 10) || 1),
        profesion:  row.querySelector('.mf-profesion')?.value || null,
        item_id:    row.querySelector('.mf-item-id')?.value   || null,
        rareza_mat: isRaro ? 'raro' : null,
        nivel_rec:  parseInt(nivelRecEl?.value, 10) || null,
      };
    })
    .filter(m => m.nombre)
    .map(m => ({
      nombre:    m.nombre,
      cantidad:  m.cantidad,
      ...(m.profesion  ? { profesion:  m.profesion  } : {}),
      ...(m.item_id    ? { item_id:    m.item_id    } : {}),
      ...(m.rareza_mat ? { rareza_mat: m.rareza_mat } : {}),
      ...(m.nivel_rec  ? { nivel_rec:  m.nivel_rec  } : {}),
    }));
}

// ── Helpers: detectar si un nombre de material es secundario crafteable o base crafteable ──
// Secundarios: Tabla, Acero, Harina, Hilo, Encantártaro, Esencia, Aceite  (crafteados por profes recolección)
// Base: Fibra, Mango, Cuero, Placa, Gema  (material propio de cada profes crafteo)
function _stubCategoria(m) {
  const n = normName(m.nombre);
  // ¿Coincide con un material secundario crafteable?
  for (const [prof, base] of Object.entries(MAT_SECUNDARIO_BASE)) {
    const b = normName(base);
    if (n === b || n.startsWith(b + ' ')) {
      return { categoria: 'crafteo', profesion: prof };
    }
  }
  // ¿Coincide con un material base de crafteo (Mango, Fibra, Orbe…)?
  for (const [prof, data] of Object.entries(PROF_MAT_BASE)) {
    const nombres = [data.nombre, ...(data.extras || []).map(e => e.nombre)];
    for (const nb of nombres) {
      const b = normName(nb);
      if (n === b || n.startsWith(b + ' ')) return { categoria: 'crafteo', profesion: prof };
    }
  }
  // ¿Es recurso recolectado bruto?
  const profEsRec = m.profesion && PROFESIONES_RECOLECCION.includes(m.profesion);
  if (profEsRec) return { categoria: 'recoleccion', profesion: m.profesion };
  // Resto: material genérico (polvo, etc.)
  return { categoria: 'material', profesion: m.profesion || '' };
}

async function saveItem(e) {
  e.preventDefault();
  // Cuando el modal está simplificado (prof-cat-row oculto), la profesión puede no estar
  // en el <select> (e.g. 'Panadero' para aceites) → tomar del item existente como fallback
  const profRowHidden = document.getElementById('prof-cat-row')?.style.display === 'none';
  const profesion = document.getElementById('f-profesion').value
    || (profRowHidden && editingId ? (items.find(i => i.id === editingId)?.profesion || '') : '');
  const categoria = document.getElementById('f-categoria').value;

  // Validación manual (el form tiene novalidate para evitar bloqueos del navegador)
  if (!profesion) {
    _markError('f-profesion', 'Selecciona una profesión');
    return;
  }
  if (categoria === 'crafteo' && !document.getElementById('f-nombre').value.trim()) {
    _markError('f-nombre', 'Escribe el nombre del item');
    return;
  }
  if (categoria === 'recoleccion' && !document.getElementById('f-grupo-rec').value.trim()) {
    _markError('f-grupo-rec', 'Escribe el nombre del recurso');
    return;
  }
  const lugar           = document.getElementById('f-lugar')?.value.trim() || null;
  const nivelItemId     = categoria === 'recoleccion' ? 'f-nivel-item-rec' : 'f-nivel-item';
  const nivel_item      = parseInt(document.getElementById(nivelItemId)?.value, 10) || null;
  const nivel_profesion = parseInt(document.getElementById('f-nivel-prof')?.value, 10) || null;
  const tipo            = document.getElementById('f-tipo')?.value   || null;
  const rareza          = document.getElementById('f-rareza')?.value || null;
  const comprados       = parseInt(document.getElementById('f-comprados').value, 10) || 0;
  const en_venta        = parseInt(document.getElementById('f-en-venta').value, 10)  || 0;
  const vendidos        = parseInt(document.getElementById('f-vendidos').value, 10)  || 0;
  const materiales      = categoria === 'crafteo' ? getMaterialesFromForm() : [];
  const recetas_alt     = categoria === 'crafteo' ? getRecetasAltFromForm() : [];
  const coste_base      = materiales.length === 0
    ? (parseInt(document.getElementById('f-coste-base')?.value, 10) || null)
    : null;

  let nombre, rareza_mat, grupo_recoleccion;
  if (categoria === 'recoleccion') {
    grupo_recoleccion = document.getElementById('f-grupo-rec').value.trim() || null;
    rareza_mat        = document.getElementById('f-rareza-mat').value || 'normal';
    // nombre = "{grupo} (Raro)" / "{grupo} (Semilla)" / "{grupo}"
    const sufijosNombre = { normal: '', raro: ' (Raro)', semilla: ' (Semilla)' };
    nombre = (grupo_recoleccion || '') + (sufijosNombre[rareza_mat] || '');
    if (!nombre.trim()) { alert('Escribe el nombre del recurso.'); return; }
    // Registrar en catálogo
    catalogNames[normName(nombre)] = nombre;
    updateMatDatalist();
  } else {
    nombre            = document.getElementById('f-nombre').value.trim();
    rareza_mat        = null;
    grupo_recoleccion = null;
  }

  if (categoria === 'crafteo') {
    const todasMats = [materiales, ...recetas_alt].flatMap(r => r || []);
    const esSelfRef = editingId
      ? todasMats.some(m => m.item_id === editingId)
      : todasMats.some(m => {
          if (normName(m.nombre) !== normName(nombre)) return false;
          if (m.item_id) {
            const ref = items.find(i => i.id === m.item_id);
            return !ref || ref.rareza === rareza;
          }
          return true;
        });
    if (esSelfRef) {
      alert(`❌ Un item no puede usarse a sí mismo como ingrediente.`);
      return;
    }
  }

  let item;
  if (editingId) {
    item = items.find(i => i.id === editingId);
    if (item) Object.assign(item, {
      nombre, rareza_mat, grupo_recoleccion, lugar,
      profesion, categoria, nivel_item, nivel_profesion,
      tipo, rareza, materiales, recetas_alt, comprados, en_venta, vendidos, coste_base
    });
  } else {
    item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      nombre, rareza_mat, grupo_recoleccion, lugar,
      profesion, categoria, nivel_item, nivel_profesion,
      tipo, rareza, materiales, recetas_alt, comprados, en_venta, vendidos, coste_base,
      historial_precios: []
    };
    items.push(item);
  }

  closeModal();

  // Auto-crear stubs para materiales de la receta que no existan aún como items
  if (categoria === 'crafteo') {
    const created = [];
    const todasRecetasMats = [materiales, ...recetas_alt].flatMap(r => r || []);
    for (const m of todasRecetasMats) {
      if (m.item_id) continue; // ya vinculado
      if (m.profesion === '__superglu__') {
        // Crear item de 'material' para Superglú si no existe
        const sgYaExiste = findMatItem(m.nombre);
        if (!sgYaExiste && m.nombre) {
          const precioCat = getCatalogPrice(m.nombre);
          const sgItem = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            nombre: m.nombre.trim(), rareza_mat: null, grupo_recoleccion: null, lugar: null,
            profesion: '', categoria: 'material',
            nivel_item: null, nivel_profesion: null, tipo: null, rareza: null,
            materiales: [], comprados: 0, en_venta: 0, vendidos: 0,
            historial_precios: precioCat > 0 ? [{ precio: precioCat, fecha: Date.now(), vendido: false }] : [],
            coste_base: null
          };
          items.push(sgItem);
          created.push(sgItem);
        }
        continue;
      }
      // ¿Ya existe algún item con ese nombre?
      if (findMatItem(m.nombre)) continue;

      // Transferir precio del catálogo al historial del nuevo stub
      const precioCat = getCatalogPrice(m.nombre);
      const historial = precioCat > 0
        ? [{ precio: precioCat, fecha: Date.now(), vendido: false }]
        : [];

      const sc = _stubCategoria(m);
      let newItem;
      if (sc.categoria === 'recoleccion') {
        const rareza_mat  = m.rareza_mat || 'normal';
        const nivel_item  = m.nivel_rec || null;
        // Buscar el común del mismo tier para heredar grupo_recoleccion y lugar
        let grupo_recoleccion_stub = m.nombre;
        let lugar_stub = null;
        if (PROFS_TIER_GROUPING.has(sc.profesion) && nivel_item != null) {
          const commonItem = items.find(i =>
            i.categoria === 'recoleccion' &&
            i.profesion === sc.profesion &&
            (i.rareza_mat === 'normal' || !i.rareza_mat) &&
            i.nivel_item != null &&
            getSufijoTier(i.nivel_item) === getSufijoTier(nivel_item)
          );
          if (commonItem) {
            grupo_recoleccion_stub = commonItem.nombre;
            lugar_stub = commonItem.lugar || null;
          }
        }
        newItem = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2) + created.length,
          nombre: m.nombre, rareza_mat, grupo_recoleccion: grupo_recoleccion_stub,
          profesion: sc.profesion, categoria: 'recoleccion',
          nivel_item, nivel_profesion: null, tipo: null, rareza: null,
          materiales: [], comprados: 0, en_venta: 0, vendidos: 0,
          historial_precios: historial, lugar: lugar_stub,
        };
      } else {
        // 'crafteo' (Tabla, Acero, Mango…) o 'material' genérico
        newItem = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2) + created.length,
          nombre: m.nombre, rareza_mat: null, grupo_recoleccion: null,
          profesion: sc.profesion, categoria: sc.categoria,
          nivel_item: null, nivel_profesion: null, tipo: null, rareza: null,
          materiales: [], comprados: 0, en_venta: 0, vendidos: 0,
          historial_precios: historial, lugar: null,
        };
      }
      items.push(newItem);
      created.push(newItem);
      catalogNames[normName(m.nombre)] = m.nombre;
      setMatFecha(m.nombre); // marcar como recién actualizado

      // Migración: si hay hermanos de la misma profesión sin nivel_item, asignarles el mismo nivel
      // para que grupoKey coincida y se agrupen en la misma card
      if (PROFS_TIER_GROUPING.has(sc.profesion) && nivel_item != null) {
        items.filter(i =>
          i.id !== newItem.id &&
          i.categoria === 'recoleccion' &&
          i.profesion === sc.profesion &&
          i.nivel_item == null
        ).forEach(s => {
          s.nivel_item = nivel_item;
          created.push(s);
        });
      }
    }
    if (created.length) await Promise.all(created.map(i => pushItem(i)));

    // Auto-linkear materiales del item padre: stubs recién creados + crafteos/materiales/recoleccion ya existentes
    // También repara item_ids huérfanos (apuntan a un item ya borrado)
    const _autolink = mats => mats.map(m => {
      if (m.item_id && items.find(i => i.id === m.item_id)) return m;
      const ref = items.find(i =>
        (i.categoria === 'crafteo' || i.categoria === 'material' || i.categoria === 'recoleccion') &&
        normName(i.nombre) === normName(m.nombre)
      );
      return ref ? { ...m, item_id: ref.id } : { ...m, item_id: null };
    });
    let linked = false;
    const linkedMats = _autolink(item.materiales);
    if (linkedMats.some((m, i) => m.item_id !== item.materiales[i]?.item_id)) { item.materiales = linkedMats; linked = true; }
    const linkedAlts = (item.recetas_alt || []).map(r => _autolink(r));
    if (linkedAlts.some((r, ri) => r.some((m, mi) => m.item_id !== item.recetas_alt[ri]?.[mi]?.item_id))) { item.recetas_alt = linkedAlts; linked = true; }
    if (linked) await pushItem(item); // re-guardar con los links actualizados
  }

  // Al crear un item nuevo: vincular ingredientes sin link o con link roto que coincidan por nombre
  if (!editingId) {
    const key = normName(item.nombre);
    const _needsLink = m =>
      normName(m.nombre) === key &&
      (!m.item_id || !items.find(j => j.id === m.item_id));
    const toRepair = items.filter(i =>
      i.id !== item.id &&
      [...(i.materiales || []), ...(i.recetas_alt || []).flat()].some(_needsLink)
    );
    if (toRepair.length) {
      const _repair = mats => mats.map(m => _needsLink(m) ? { ...m, item_id: item.id } : m);
      for (const dep of toRepair) {
        dep.materiales  = _repair(dep.materiales  || []);
        dep.recetas_alt = (dep.recetas_alt || []).map(r => _repair(r));
      }
      await Promise.all(toRepair.map(i => pushItem(i)));
    }
  }

  render();
  await pushItem(item);

  // Toast post-guardado (solo crafteo)
  if (categoria === 'crafteo') showPostSaveToast(item);
}

// ─────────────────────────────────────────────
// POST-SAVE TOAST: profit + crear versión
// ─────────────────────────────────────────────
function showPostSaveToast(item) {
  const toast   = document.getElementById('postsave-toast');
  const content = document.getElementById('postsave-content');
  if (!toast || !content) return;

  const p    = calcProfit(item);
  const rIdx = RAREZAS.indexOf(item.rareza);

  let html = `<div class="pst-name">${item.nombre}</div>`;

  if (p) {
    const cls  = p.profit >= 0 ? 'profit-pos' : 'profit-neg';
    const sign = p.profit >= 0 ? '+' : '';
    html += `<div class="pst-profit">
      Coste: <strong style="color:var(--orange)">${fmtK(p.coste)}</strong>
      · Precio: <strong style="color:var(--gold2)">${fmtK(p.precio)}</strong><br>
      Profit: <span class="profit-val ${cls}">${sign}${fmtK(p.profit)}</span>
      ${p.profitPct !== null ? `<span class="profit-pct ${cls}">${fmtPct(p.profitPct)}</span>` : ''}
    </div>`;
  } else {
    html += `<div class="pst-profit" style="color:var(--muted);font-style:italic;font-size:0.82rem">
      Sin precio de venta aún — añádelo en la card
    </div>`;
  }

  // Botones de versión
  let verHtml = '<div class="pst-versions">';
  if (item.rareza) {
    if (rIdx > 0) {
      const r = RAREZAS[rIdx - 1];
      verHtml += `<button class="pst-btn" onclick="crearVersion('${item.id.replace(/'/g,"\\'")}','${r}')">↓ ${r}</button>`;
    }
    if (rIdx >= 0 && rIdx < RAREZAS.length - 1) {
      const r = RAREZAS[rIdx + 1];
      verHtml += `<button class="pst-btn pst-btn-sup" onclick="crearVersion('${item.id.replace(/'/g,"\\'")}','${r}')">↑ ${r}</button>`;
    }
  } else {
    verHtml += `<span class="pst-hint">Crear versión:</span>` +
      RAREZAS.slice(0, 3).map(r =>
        `<button class="pst-btn" onclick="crearVersion('${item.id.replace(/'/g,"\\'")}','${r}')">${r}</button>`
      ).join('');
  }
  verHtml += '</div>';
  html += verHtml;

  content.innerHTML = html;
  toast.style.display = '';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 12000);
}

function crearVersion(baseId, nuevaRareza) {
  const base = items.find(i => i.id === baseId);
  if (!base) return;
  document.getElementById('postsave-toast').style.display = 'none';
  openModal();
  setTimeout(() => {
    document.getElementById('f-profesion').value = base.profesion;
    document.getElementById('f-categoria').value = base.categoria;
    onCategoriaChange();
    _updateTipoSelect(base.profesion);
    document.getElementById('f-nombre').value      = base.nombre;
    document.getElementById('f-nivel-item').value  = base.nivel_item || '';
    document.getElementById('f-nivel-prof').value  = base.nivel_profesion || '';
    document.getElementById('f-tipo').value        = base.tipo || '';
    document.getElementById('f-rareza').value      = nuevaRareza;
    document.getElementById('mat-container').innerHTML = '';
    matCount = 0;
    (base.materiales || []).forEach(m => addMaterialRow(m.nombre, m.cantidad, m.profesion || '', m.item_id || ''));
    updateMatSuggestions();
    updateShoppingList();
  }, 50);
}

// ─────────────────────────────────────────────
// SHOPPING LIST (cuántos craftear)
// ─────────────────────────────────────────────
function updateShoppingList() {
  const slEl = document.getElementById('shopping-list');
  if (!slEl || document.getElementById('plan-craftear-wrap')?.style.display === 'none') return;
  const plan = Math.max(1, parseInt(document.getElementById('f-plan-craftear')?.value, 10) || 1);
  const rows = Array.from(document.getElementById('mat-container')?.querySelectorAll('.loot-form-row') || []);
  if (!rows.length) { slEl.innerHTML = ''; return; }

  let total = 0;
  const matRows = rows.map(row => {
    const nombre   = row.querySelector('.mf-nombre')?.value.trim() || '';
    const cantBase = parseInt(row.querySelector('.mf-cantidad')?.value, 10) || 1;
    const qty      = cantBase * plan;
    const precio   = parseInt(row.querySelector('.mf-precio')?.value, 10) || getCatalogPrice(nombre);
    const coste    = precio * qty;
    total += coste;
    return `<div class="sl-row">
      <span class="sl-nombre">${nombre || '—'}</span>
      <span class="sl-qty">×${qty}</span>
      ${precio > 0 ? `<span class="sl-coste">${fmtK(coste)}</span>` : '<span class="sl-coste muted">sin precio</span>'}
    </div>`;
  }).join('');

  slEl.innerHTML = `
    <div class="sl-header">🛒 Para ${plan} crafteo${plan !== 1 ? 's' : ''}:</div>
    ${matRows}
    ${total > 0 ? `<div class="sl-total">Total materiales: <strong>${fmtK(total)}</strong></div>` : ''}
  `;
}

// ─────────────────────────────────────────────
// EVENTOS
// ─────────────────────────────────────────────
document.getElementById('search').addEventListener('input', e => { searchText = e.target.value; render(); });
document.getElementById('modal').addEventListener('click', e => { if (e.target === document.getElementById('modal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

loadAll();
