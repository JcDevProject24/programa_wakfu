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
  const sufijo = getSufijo(nivelItem);
  return sufijo ? `${base.nombre} ${sufijo}` : base.nombre;
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
  'Sastre':           { nombre: 'Fibra',  ejemplo: 'Fibra tosca, Fibra rudimentaria…' },
  'Maestro de armas': { nombre: 'Mango',  ejemplo: 'Mango tosco, Mango rudimentario…' },
  'Marroquinero':     { nombre: 'Cuero',  ejemplo: 'Cuero tosco, Cuero rudimentario…' },
  'Joyero':           { nombre: 'Gema',   ejemplo: 'Gema tosca, Gema rudimentaria…'   },
  'Armero':           { nombre: 'Placa',  ejemplo: 'Placa tosca, Placa rudimentaria…' },
};

const PROF_EMOJI = {
  'Armero':'🛡','Joyero':'💎','Cocinero':'🍳','Marroquinero':'👜',
  'Peletero':'🧥','Ebanista':'🪵','Maestro de armas':'⚔','Sastre':'🧵',
  'Herbolario':'🌿','Minero':'⛏','Campesino':'🌾','Leñador':'🪓','Pescador':'🎣'
};

// ─────────────────────────────────────────────
// PRECIOS — FRESCURA (5 h de cooldown)
// ─────────────────────────────────────────────
const STALE_MS = 5 * 60 * 60 * 1000; // 5 horas

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
// Precio de material obsoleto: si hay precio en catálogo y fecha desconocida o > STALE_MS
function isMatStale(nombre) {
  if (!nombre) return false;
  const precio = getCatalogPrice(nombre);
  if (!precio) return false;
  const fecha = getMatFecha(nombre);
  return !fecha || Date.now() - fecha > STALE_MS;
}
// Precio de venta obsoleto: última entrada del historial > STALE_MS
function isPriceStale(item) {
  const hist = item.historial_precios || [];
  if (!hist.length) return false;
  const last = hist.reduce((a, b) => b.fecha > a.fecha ? b : a);
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

// ─────────────────────────────────────────────
// CATÁLOGO DE MATERIALES (precios compartidos)
// ─────────────────────────────────────────────
const normName = s => (s || '').toLowerCase().trim();

function getCatalogPrice(nombre) {
  return catalog[normName(nombre)] ?? 0;
}

// Actualiza catálogo en memoria + persiste en BD + sincroniza historial de items material/recolección + re-renderiza
async function updateCatalogPrice(nombre, precio) {
  const key = normName(nombre);
  const val = Math.max(0, parseInt(precio, 10) || 0);
  if (catalog[key] === val) return;
  catalog[key]      = val;
  catalogNames[key] = nombre.trim();
  setMatFecha(nombre);

  // Sincronizar historial_precios de cualquier item material o recolección con ese nombre
  // (son siempre precio de subasta, así que la fuente de verdad es el catálogo)
  const now = Date.now();
  const toSync = items.filter(i =>
    (i.categoria === 'material' || i.categoria === 'recoleccion') &&
    normName(i.nombre) === key
  );
  toSync.forEach(i => {
    if (!i.historial_precios) i.historial_precios = [];
    i.historial_precios.push({ precio: val, fecha: now, vendido: false });
  });

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
    (item.materiales || []).forEach(m => { if (m.nombre) names.add(m.nombre); });
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
  if (!ref) return { precio: 0, modo: 'compra', precioCompra: 0, precioCreacion: null };

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

function calcCoste(item) {
  if (!item.materiales?.length) return 0;
  return item.materiales.reduce((s, m) => {
    const { precio } = getMatInfo(m);
    return s + precio * (m.cantidad || 0);
  }, 0);
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
  const profit    = precio - coste;
  const profitPct = coste > 0 ? (profit / coste * 100) : null;
  return { profit, profitPct, coste, precio };
}

function fmtK(n)   { return Math.round(n).toLocaleString('es-ES'); }
function fmtPct(n) { return (n >= 0 ? '+' : '') + n.toFixed(1) + '%'; }

function rarezaClass(r) {
  if (!r) return '';
  return 'rareza-' + r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ─────────────────────────────────────────────
// AGRUPACIÓN DE RECOLECCIÓN
// ─────────────────────────────────────────────
// Clave de grupo: grupo_recoleccion (o nombre) + profesion
function grupoKey(item) {
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
    const inNombre = g.grupoNombre.toLowerCase().includes(q);
    const inProf   = g.profesion.toLowerCase().includes(q);
    const inLugar  = g.lugar && g.lugar.toLowerCase().includes(q);
    if (!inNombre && !inProf && !inLugar) return false;
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
async function updateStock(id, field, delta) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  item[field] = Math.max(0, (item[field] || 0) + delta);
  render();
  await pushItem(item);
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
    <div class="rec-var-precio">${precio ? `<strong>${fmtK(precio)}</strong>` : '<span class="muted">Sin precio</span>'}</div>
    <div class="rec-var-stock">
      <span title="Farmeados">🌿 ${item.comprados||0}</span>
      <span title="En venta">🏷 ${item.en_venta||0}</span>
      <span title="Vendidos">💸 ${item.vendidos||0}</span>
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
    const coste = calcCoste(item);
    const rows  = item.materiales.map(m => {
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
          const cls = isActive ? 'mat-opt-active' : 'mat-opt-dim';
          if (isActive) {
            return `<span class="mat-opt ${cls}" title="Precio subasta · editable">🛒 <input class="mat-opt-input" type="number" value="${info.precioCompra || ''}" min="0" placeholder="—" onchange="updateCatalogPrice('${esc}',this.value)"></span>`;
          }
          return `<span class="mat-opt ${cls}" title="Precio de compra">🛒 ${info.precioCompra > 0 ? fmtK(info.precioCompra) : '—'}</span>`;
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
            ${m.nombre}
            ${rLabel ? `<span class="loot-rareza-badge ${rClass}" style="font-size:0.6rem;padding:0 4px">${rLabel}</span>` : ''}
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
        <span class="mat-nombre">${m.nombre}${stale ? ' <span class="stale-icon" title="Precio posiblemente desactualizado (>5h)">⏱</span>' : ''}</span>
        <span class="mat-qty">×${m.cantidad}</span>
        <div class="mat-precio-wrap">
          <input class="mat-price-inline" type="number" value="${precioCat || ''}"
            placeholder="—" min="0"
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
            onchange="updateCatalogPrice('${escNombre}', this.value)"
            title="Precio compartido · se actualiza en todas las recetas que usen '${item.nombre}'">
          <span class="mat-shared-icon${staleMat ? ' stale-icon' : ''}" title="${staleMat ? 'Precio posiblemente desactualizado (>5h)' : 'Precio compartido'}">⟳${staleMat ? '⏱' : ''}</span>
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

  // ── Stock interactivo ──
  const stockLabel = isCrafteo ? '🔨' : (isMaterial ? '📦' : '🌿');
  const pendienteListing = isCrafteo && (item.comprados || 0) > 0 && (item.en_venta || 0) === 0;
  const necesitaReponer  = (item.vendidos || 0) > 0 && (item.en_venta || 0) === 0;
  const pendienteHtml = pendienteListing
    ? `<span class="stock-pendiente" title="Items crafteados sin listar">⚠ Listar</span>`
    : (necesitaReponer ? `<span class="stock-reponer" title="Se han vendido todos — es momento de reponer">↺ Reponer</span>` : '');
  const stockHtml = `<div class="stock-section">
    <span class="stock-field">
      <span class="stock-lbl">${stockLabel}</span>
      <button class="stk-btn" onclick="updateStock('${eid}','comprados',-1)">−</button>
      <strong class="stk-val">${item.comprados || 0}</strong>
      <button class="stk-btn" onclick="updateStock('${eid}','comprados',1)">+</button>
    </span>
    <span class="stock-field">
      <span class="stock-lbl">🏷</span>
      <button class="stk-btn" onclick="updateStock('${eid}','en_venta',-1)">−</button>
      <strong class="stk-val">${item.en_venta || 0}</strong>
      <button class="stk-btn" onclick="updateStock('${eid}','en_venta',1)">+</button>
    </span>
    <span class="stock-field">
      <span class="stock-lbl">💸</span>
      <button class="stk-btn" onclick="updateStock('${eid}','vendidos',-1)">−</button>
      <strong class="stk-val">${item.vendidos || 0}</strong>
      <button class="stk-btn" onclick="updateStock('${eid}','vendidos',1)">+</button>
    </span>
    ${pendienteHtml}
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
  const staleLabel   = priceStale ? ' <span class="stale-icon price-stale-icon" title="Precio de venta posiblemente desactualizado (>5h)">⏱ Actualizar precio</span>' : '';
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
        <div class="card-name">${item.nombre}</div>
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
    ${stockHtml}
    ${histHtml}
  </div>`;
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

  const { crafteos, grupos } = getDisplayUnits();

  // Filtrar crafteos
  const filteredCrafteos = sortItems(crafteos.filter(matchesItem));
  // Filtrar grupos recolección
  const filteredGrupos   = grupos.filter(matchesGrupo)
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
}

// ─────────────────────────────────────────────
// CATÁLOGO DE MATERIALES (panel sidebar)
// ─────────────────────────────────────────────
let catalogOpen = false;
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
    </div>`;
  }).join('');
}

function setCategoria(cat) { categoriaFilter = cat; activeProfesiones.clear(); render(); }
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
  if (!confirm('¿Eliminar este item?')) return;
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

function openModal(id) {
  editingId = id || null;
  matCount  = 0;
  document.getElementById('item-form').reset();
  document.getElementById('mat-container').innerHTML = '';
  document.getElementById('modal-title').textContent = id ? 'Editar Item' : 'Añadir Item';
  const varBtnsEl = document.getElementById('rec-var-btns');
  if (varBtnsEl) { varBtnsEl.style.display = 'none'; varBtnsEl.innerHTML = ''; }
  onCategoriaChange();

  if (id) {
    const item = items.find(i => i.id === id);
    if (item) {
      document.getElementById('f-profesion').value  = item.profesion;
      document.getElementById('f-categoria').value  = item.categoria;
      onCategoriaChange();
      _updateTipoSelect(item.profesion);
      document.getElementById('f-comprados').value  = item.comprados || 0;
      document.getElementById('f-en-venta').value   = item.en_venta  || 0;
      document.getElementById('f-vendidos').value   = item.vendidos  || 0;
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
        (item.materiales || []).forEach(m => addMaterialRow(m.nombre, m.cantidad, m.profesion || '', m.item_id || ''));
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

  const grupoItems = items.filter(i =>
    i.categoria === 'recoleccion' &&
    (i.grupo_recoleccion || i.nombre) === grupoNombre &&
    i.profesion === profesion
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
  const sufijos = { normal: '', raro: ' (Raro)', semilla: ' (Semilla)' };

  const formsHtml = faltantes.map(d => {
    const nombreMostrado = grupoNombre + sufijos[d.key];
    return `<div class="rec-var-mini-form">
      <div class="rec-var-mini-header ${d.cls}">${d.label}</div>
      <div class="rec-var-mini-nombre">${nombreMostrado}</div>
      <div class="rec-var-mini-row">
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
  const nivelInput = document.getElementById(`rv-nivel-${rareza}`);
  const lugarInput = document.getElementById(`rv-lugar-${rareza}`);
  const nivel      = parseInt(nivelInput?.value, 10) || null;
  const lugar      = lugarInput?.value.trim() || null;

  const sufijos = { normal: '', raro: ' (Raro)', semilla: ' (Semilla)' };
  const nombre  = grupoNombre + sufijos[rareza];

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

  const matBase = getMatBaseNombre(prof, nivel);
  const matSecs = getMatSecNombres(nivel);
  const tier    = getSufijoTier(nivel);
  const sufijo  = getSufijo(nivel);
  const nivelPrimario   = tier * 10;
  const nivelSecundario = tier * 10 + 5;

  let html = `<span class="sug-tier-label">Tier ${tier} · sufijo <strong>${sufijo}</strong> · primario lvl ${nivelPrimario} / secundario lvl ${nivelSecundario}</span>`;

  if (matBase) {
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
      // Si ya existe en el catálogo o en items, destacarlo
      const enCatalog = normName(m.nombre) in catalog;
      const esc       = m.nombre.replace(/'/g, "\\'");
      const profArg   = m.profesion ? m.profesion.replace(/'/g, "\\'") : '';
      html += `<button type="button" class="sug-btn ${enCatalog ? 'sug-btn-known' : ''}"
        onclick="addMaterialRow('${esc}', 1, '${profArg}', '')"
        title="${m.profesion || 'Material secundario'}${enCatalog ? ' · ya en catálogo' : ''}">
        + ${m.nombre}${enCatalog ? ' ✓' : ''}
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

  sugEl.innerHTML = html;
  sugEl.style.display = '';
}

function _updateTipoSelect(prof) {
  const tipoSel = document.getElementById('f-tipo');
  if (!tipoSel) return;
  const tiposDisp  = PROF_TIPOS[prof] || SUBTIPOS_EQUIP;
  const valorActual = tipoSel.value;
  tipoSel.innerHTML = `<option value="">— Ninguno —</option>` +
    tiposDisp.map(t => `<option value="${t}" ${t === valorActual ? 'selected' : ''}>${t}</option>`).join('');

  // Hint de material base típico
  const hintEl = document.getElementById('mat-base-hint');
  if (!hintEl) return;
  const matBase = PROF_MAT_BASE[prof];
  if (matBase) {
    hintEl.innerHTML = `<span class="mat-base-icon">📦</span> Material base: <strong>${matBase.nombre}</strong> <span class="mat-base-ej">(${matBase.ejemplo})</span>`;
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

function onCategoriaChange() {
  const cat       = document.getElementById('f-categoria').value;
  const isCrafteo = cat === 'crafteo';
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
}

// ── Fila de material en el formulario ──
function addMaterialRow(nombre = '', cantidad = '', profesionMat = '', itemId = '') {
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
      <button type="button" class="mat-copy-btn" title="Copiar nombre"
        onclick="copyMatName(${c})">📋</button>
      <input type="number" class="form-input mf-cantidad" placeholder="×"
        value="${cantidad || ''}" min="1" style="width:52px" title="Cantidad"
        oninput="updateMatTotalPreview(${c})">
      ${refItem ? '' : `<input type="number" class="form-input mf-precio" placeholder="Precio/u"
        value="${precioCat || ''}" min="0" style="width:88px" title="Precio unitario (actualiza catálogo compartido)"
        oninput="onMatPrecioInput(this, ${c})">`}
      <span class="mat-price-preview" id="mp-prev-${c}">
        ${refItem ? _matPrevHtml(refItem, precioCat) : _matTotalHtml(precioCat, qty)}
      </span>
      <input type="hidden" class="mf-item-id" value="${itemId}">
      <button type="button" class="action-btn danger"
        onclick="document.getElementById('mat-row-${c}').remove(); updateShoppingList()">✕</button>
    </div>
    <div class="mat-prof-row" id="mp-extra-${c}">
      ${_matExtraHtml(c, nombre, profesionMat, profOpts, itemId, refItem)}
    </div>`;

  document.getElementById('mat-container').appendChild(row);
  updateShoppingList();
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

function onMatPrecioInput(input, c) {
  const row    = document.getElementById(`mat-row-${c}`);
  if (!row) return;
  const nombre   = row.querySelector('.mf-nombre')?.value.trim();
  const cantidad = parseInt(row.querySelector('.mf-cantidad')?.value, 10) || 1;
  const precio   = parseInt(input.value, 10) || 0;
  const prev     = document.getElementById(`mp-prev-${c}`);
  if (prev) prev.innerHTML = _matTotalHtml(precio, cantidad);
  if (nombre) updateCatalogPrice(nombre, precio);
  updateShoppingList();
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
    const profSel = document.getElementById(`mp-prof-${c}`);
    const prof    = profSel?.value;
    const base    = nombreInput.value.trim();
    const commonItem = items.find(i =>
      i.categoria === 'recoleccion' &&
      i.profesion === prof &&
      (i.rareza_mat === 'normal' || !i.rareza_mat) &&
      (normName(i.nombre) === normName(base) || normName(i.grupo_recoleccion || '') === normName(base))
    );
    if (commonItem) {
      const pc = getPrecioActual(commonItem) || getCatalogPrice(commonItem.nombre) || 0;
      infoEl.innerHTML = `↳ Común: <strong>${commonItem.nombre}</strong>${pc > 0 ? ` · <span class="mr-precio">${fmtK(pc)}</span>` : ''}`;
    } else {
      const precioComun = getCatalogPrice(base);
      infoEl.innerHTML = precioComun > 0
        ? `↳ Común: <em>${base}</em> · <span class="mr-precio">${fmtK(precioComun)}</span>`
        : `↳ Común: <em>${base}</em> <span style="color:var(--muted)">(sin datos)</span>`;
    }
  } else {
    infoEl.textContent = '';
  }
}

function _matPrevHtml(refItem, precio) {
  if (refItem) {
    return `<span class="mp-val mp-linked" title="Precio de ${refItem.nombre} (${refItem.rareza || ''}) — se actualiza automáticamente">
      🔗 ${precio > 0 ? fmtK(precio) : '—'}
    </span>`;
  }
  return precio > 0 ? `<span class="mp-val">${fmtK(precio)}</span>` : `<span class="mp-empty">—</span>`;
}

// Botones de vinculación para una fila de material.
// Solo muestra rarezas cuando el item ya existe con rareza en la BD.
// Para materiales básicos (sin rareza) muestra simplemente el botón de vincular.
// Solo muestra botones de vincular cuando ya existe un item crafteo/material con ese nombre.
// Para materiales básicos sin item registrado → no muestra nada (el catálogo gestiona el precio).
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

function _matExtraHtml(c, nombre, profesionMat, profOpts, itemId, refItem) {
  if (itemId && refItem) {
    const rClass = rarezaClass(refItem.rareza);
    return `<span class="mat-linked-info">
      🔗 Vinculado ·
      <span class="loot-rareza-badge ${rClass}" style="font-size:0.62rem;padding:0 5px">${refItem.rareza || '?'}</span>
      ${refItem.nombre}
    </span>
    <button type="button" class="mat-unlink-btn" onclick="unlinkMaterial(${c})">✕ Desvincular</button>`;
  }

  const crafteoMatches = nombre ? items.filter(i =>
    i.categoria === 'crafteo' && normName(i.nombre) === normName(nombre)
  ) : [];

  const crafteoLinks = nombre ? _matRarezaBtns(c,crafteoMatches) : '';

  const hintText = profesionMat === '__superglu__'
    ? `✓ Superglú (escala por nivel)`
    : (profesionMat ? '✓ Se vincula con recolección' : '');

  const isRecProf = profesionMat && profesionMat !== '__superglu__';
  const isRaro    = false; // el toggle es informativo, no modifica el nombre

  return `<select class="mf-profesion mat-prof-select" id="mp-prof-${c}"
      title="Tipo de material" onchange="onMatTipoChange(this, ${c})">
      <option value="">📦 Material común</option>
      <option value="__superglu__" ${profesionMat === '__superglu__' ? 'selected' : ''}>🔧 Superglú</option>
      ${profOpts}
    </select>
    <span class="mat-link-suggestions" id="mp-links-${c}">${crafteoLinks}</span>
    <span class="mat-prof-hint">${hintText}</span>
    <div class="mat-rareza-row" id="mr-row-${c}" style="display:${isRecProf ? 'flex' : 'none'}">
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
  if (esRecoleccion) {
    // Leer si el toggle Común / ★ Raro está en "raro"
    const rarezaRow  = document.getElementById(`mr-row-${c}`);
    const toggleRaro = rarezaRow?.querySelector('.mat-rr-raro.active');
    rareza_mat        = toggleRaro ? 'raro' : 'normal';
    categoria         = 'recoleccion';
    profesion         = matProf;
    // grupo_recoleccion = nombre base (sin sufijo de rareza en el nombre)
    grupo_recoleccion = nombre;
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
    lugar:             null,
    nivel_item:        null,
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
      const rarezaRow = document.getElementById(`mr-row-${c}`);
      const isRaro    = !!(rarezaRow?.querySelector('.mat-rr-raro.active'));
      return {
        nombre:     row.querySelector('.mf-nombre').value.trim(),
        cantidad:   Math.max(1, parseInt(row.querySelector('.mf-cantidad').value, 10) || 1),
        profesion:  row.querySelector('.mf-profesion')?.value || null,
        item_id:    row.querySelector('.mf-item-id')?.value   || null,
        rareza_mat: isRaro ? 'raro' : null,
      };
    })
    .filter(m => m.nombre)
    .map(m => ({
      nombre:    m.nombre,
      cantidad:  m.cantidad,
      ...(m.profesion  ? { profesion:  m.profesion  } : {}),
      ...(m.item_id    ? { item_id:    m.item_id    } : {}),
      ...(m.rareza_mat ? { rareza_mat: m.rareza_mat } : {}),
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
  // ¿Coincide con un material base de crafteo (Mango, Fibra…)?
  for (const [prof, data] of Object.entries(PROF_MAT_BASE)) {
    const b = normName(data.nombre);
    if (n === b || n.startsWith(b + ' ')) {
      return { categoria: 'crafteo', profesion: prof };
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
  const profesion = document.getElementById('f-profesion').value;
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

  let item;
  if (editingId) {
    item = items.find(i => i.id === editingId);
    if (item) Object.assign(item, {
      nombre, rareza_mat, grupo_recoleccion, lugar,
      profesion, categoria, nivel_item, nivel_profesion,
      tipo, rareza, materiales, comprados, en_venta, vendidos
    });
  } else {
    item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      nombre, rareza_mat, grupo_recoleccion, lugar,
      profesion, categoria, nivel_item, nivel_profesion,
      tipo, rareza, materiales, comprados, en_venta, vendidos,
      historial_precios: []
    };
    items.push(item);
  }

  closeModal();

  // Auto-crear stubs para materiales de la receta que no existan aún como items
  if (categoria === 'crafteo') {
    const created = [];
    for (const m of materiales) {
      if (m.item_id || m.profesion === '__superglu__') continue; // ya vinculado o superglú
      // ¿Ya existe algún item con ese nombre?
      const yaExiste = items.find(i => normName(i.nombre) === normName(m.nombre));
      if (yaExiste) continue;

      // Transferir precio del catálogo al historial del nuevo stub
      const precioCat = getCatalogPrice(m.nombre);
      const historial = precioCat > 0
        ? [{ precio: precioCat, fecha: Date.now(), vendido: false }]
        : [];

      const sc = _stubCategoria(m);
      let newItem;
      if (sc.categoria === 'recoleccion') {
        const rareza_mat = m.rareza_mat || 'normal';
        newItem = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2) + created.length,
          nombre: m.nombre, rareza_mat, grupo_recoleccion: m.nombre,
          profesion: sc.profesion, categoria: 'recoleccion',
          nivel_item: null, nivel_profesion: null, tipo: null, rareza: null,
          materiales: [], comprados: 0, en_venta: 0, vendidos: 0,
          historial_precios: historial, lugar: null,
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
    }
    if (created.length) await Promise.all(created.map(i => pushItem(i)));

    // Auto-linkear materiales del item padre: stubs recién creados + crafteos/materiales ya existentes
    let linked = false;
    item.materiales = item.materiales.map(m => {
      if (m.item_id) return m;
      const ref = items.find(i =>
        (i.categoria === 'crafteo' || i.categoria === 'material') &&
        normName(i.nombre) === normName(m.nombre)
      );
      if (ref) { linked = true; return { ...m, item_id: ref.id }; }
      return m;
    });
    if (linked) await pushItem(item); // re-guardar con los links actualizados
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
