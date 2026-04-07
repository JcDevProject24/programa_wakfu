// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const API = 'api.php';

const SUBTIPOS_EQUIP = [
  'Amuleto','Anillo','Botas','Capa','Casco','Cinturón',
  'Hombreras','Coraza','Arma de 1 mano','Arma de 2 manos','Segunda mano','Emblema'
];
const RAREZAS = ['Raro','Mítico','Legendario','Épico','Reliquia'];

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────
let archis = [];
let editingId           = null;
let searchText          = '';
let activeRegions       = new Set();
let activeRarezas       = new Set();
let activeTipos         = new Set(); // subtipo o tipo efectivo
let soloDisponibles     = false;
let soloBis             = false;
let customRespawnEnabled = false;
let lootCount           = 0;
let sortBy              = 'estado';

// ─────────────────────────────────────────────
// DB — fetch
// ─────────────────────────────────────────────
async function loadArchis() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(res.status);
    archis = await res.json();
  } catch(e) {
    document.getElementById('results-text').innerHTML =
      '<span style="color:var(--red)">⚠ No se puede conectar. ¿Está XAMPP activo y la BD creada?</span>';
    document.getElementById('empty').style.display = 'block';
    return;
  }
  render();
}

async function pushArchi(archi) {
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(archi)
    });
  } catch(e) { console.error('Error al guardar:', e); }
}

async function removeArchiFromDb(id) {
  try {
    await fetch(`${API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch(e) { console.error('Error al eliminar:', e); }
}

// ─────────────────────────────────────────────
// RESPAWN
// ─────────────────────────────────────────────
function defaultRespawnMin(nivel) {
  if (nivel < 50)  return 60;
  if (nivel < 140) return 150;
  return 240;
}

function formatRespawn(minutos) {
  const h = Math.floor(minutos / 60), m = minutos % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getStatus(archi) {
  if (!archi.ultimaMuerte) return { estado: 'unknown' };
  const respawnMs  = (archi.respawnMinutos || defaultRespawnMin(archi.nivel)) * 60000;
  const restanteMs = (archi.ultimaMuerte + respawnMs) - Date.now();
  if (restanteMs <= 0) return { estado: 'disponible', restante: 0 };
  return { estado: 'esperando', restante: Math.ceil(restanteMs / 60000) };
}

function horaDisponible(archi) {
  if (!archi.ultimaMuerte) return null;
  const respawnMs = (archi.respawnMinutos || defaultRespawnMin(archi.nivel)) * 60000;
  const ts = archi.ultimaMuerte + respawnMs;
  return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────────────────────────
// DINERO
// ─────────────────────────────────────────────
function calcDinero(archi) {
  if (!archi.loots?.length) return { bruto: 0, real: 0, hasRates: false };
  let bruto = 0, real = 0, hasRates = false;
  archi.loots.forEach(l => {
    if (l.precio) {
      bruto += l.precio;
      if (l.drop_rate != null) { real += Math.round(l.precio * l.drop_rate / 100); hasRates = true; }
    }
  });
  return { bruto, real, hasRates };
}

function fmtK(n) { return n.toLocaleString('es-ES') + ' k'; }

// ─────────────────────────────────────────────
// TIME UTILS
// ─────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'ahora mismo';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24)  return `hace ${hrs}h ${Math.floor((diff % 3600000) / 60000)}m`;
  return `hace ${Math.floor(diff / 86400000)}d`;
}

// ─────────────────────────────────────────────
// AUTOCOMPLETE
// ─────────────────────────────────────────────
function updateDataLists() {
  const regions = [...new Set(archis.map(a => a.region).filter(Boolean))];
  const lugares = [...new Set(archis.map(a => a.lugar).filter(Boolean))];
  const rdl = document.getElementById('region-list');
  const ldl = document.getElementById('lugar-list');
  if (rdl) rdl.innerHTML = regions.map(r => `<option value="${r}">`).join('');
  if (ldl) ldl.innerHTML = lugares.map(l => `<option value="${l}">`).join('');
}

function autoFillRegion(lugarVal) {
  if (!lugarVal) return;
  const match = archis.find(a =>
    a.lugar && a.lugar.toLowerCase() === lugarVal.toLowerCase().trim() && a.region
  );
  if (match) {
    const inp = document.getElementById('f-region');
    if (!inp.value) inp.value = match.region;
  }
}

// ─────────────────────────────────────────────
// FILTER & SORT
// ─────────────────────────────────────────────
// Tipo efectivo de un loot para los filtros de sidebar
function tipoEfectivo(l) {
  if (!l.tipo) return null;
  if (l.tipo === 'equipable')   return l.subtipo    || 'Equipable';
  if (l.tipo === 'componente')  return 'Componente';
  if (l.tipo === 'otro')        return l.tipo_custom || 'Otro';
  return l.tipo;
}

function matchesArchi(archi) {
  // Búsqueda de texto: solo nombres (monstruo, loot, región, lugar)
  const q = searchText.toLowerCase();
  if (q) {
    const inNombre = archi.nombre.toLowerCase().includes(q);
    const inRegion = archi.region && archi.region.toLowerCase().includes(q);
    const inLugar  = archi.lugar  && archi.lugar.toLowerCase().includes(q);
    const inLoot   = archi.loots  && archi.loots.some(l => l.nombre.toLowerCase().includes(q));
    if (!inNombre && !inRegion && !inLugar && !inLoot) return false;
  }
  // Filtros de sidebar (coincidencia exacta en campos estructurados)
  if (activeRegions.size > 0 && !activeRegions.has(archi.region)) return false;
  if (activeRarezas.size > 0) {
    const ok = archi.loots && archi.loots.some(l => l.rareza && activeRarezas.has(l.rareza));
    if (!ok) return false;
  }
  if (activeTipos.size > 0) {
    const ok = archi.loots && archi.loots.some(l => activeTipos.has(tipoEfectivo(l)));
    if (!ok) return false;
  }
  if (soloDisponibles && getStatus(archi).estado !== 'disponible') return false;
  if (soloBis && !archi.loots?.some(l => l.bis)) return false;
  return true;
}

function bisCount(archi)      { return (archi.loots || []).filter(l => l.bis).length; }
function totalVendidos(archi) { return (archi.loots || []).reduce((s, l) => s + (l.vendidos || 0), 0); }

function sortArchis(list) {
  return list.slice().sort((a, b) => {
    if (sortBy === 'dinero_real')   return calcDinero(b).real  - calcDinero(a).real;
    if (sortBy === 'dinero_bruto')  return calcDinero(b).bruto - calcDinero(a).bruto;
    if (sortBy === 'nombre')        return a.nombre.localeCompare(b.nombre, 'es');
    if (sortBy === 'bis')           return bisCount(b) - bisCount(a);
    if (sortBy === 'mas_vendidos')  return totalVendidos(b) - totalVendidos(a);
    // 'estado' default
    const sa = getStatus(a), sb = getStatus(b);
    const order = { disponible: 0, esperando: 1, unknown: 2 };
    if (order[sa.estado] !== order[sb.estado]) return order[sa.estado] - order[sb.estado];
    if (sa.estado === 'esperando') return sa.restante - sb.restante;
    return 0;
  });
}

function setSortBy(val) { sortBy = val; render(); }

// ─────────────────────────────────────────────
// LOOT BADGES (card display)
// ─────────────────────────────────────────────
function rarezaClass(rareza) {
  if (!rareza) return '';
  return 'rareza-' + rareza.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function lootTipoBadge(l) {
  if (!l.tipo) return '';
  let label = '';
  if (l.tipo === 'componente')    label = '📦 Comp.';
  else if (l.tipo === 'equipable') label = l.subtipo || '⚔ Equip.';
  else if (l.tipo === 'otro')      label = l.tipo_custom || 'Otro';
  else                             label = l.tipo;
  return `<span class="loot-tipo-badge">${label}</span>`;
}

// ─────────────────────────────────────────────
// CARD BUILDER
// ─────────────────────────────────────────────
function buildCard(archi) {
  const st         = getStatus(archi);
  const id         = archi.id;
  const eid        = id.replace(/'/g, "\\'");
  const respawnMin = archi.respawnMinutos || defaultRespawnMin(archi.nivel);
  const dinero     = calcDinero(archi);
  const isDisp     = st.estado === 'disponible' ? 'archi-disponible' : '';

  // ── Loots ──
  let lootsHtml = '';
  if (archi.loots && archi.loots.length) {
    const bisTotalStr = bisCount(archi) > 0
      ? `<span class="card-bis-count" title="${bisCount(archi)} objeto(s) BIS">⭐ ${bisCount(archi)} BIS</span>` : '';

    const rows = archi.loots.map((l, i) => {
      const bisStar   = l.bis ? `<span class="loot-bis" title="Best In Slot">⭐</span>` : '';
      const tipoBadge = lootTipoBadge(l);
      const rarezaBadge = l.rareza
        ? `<span class="loot-rareza-badge ${rarezaClass(l.rareza)}">${l.rareza}</span>` : '';
      const dropBadge  = l.drop_rate != null
        ? `<span class="loot-rate">${l.drop_rate}%</span>` : '';
      const priceBadge = l.precio
        ? `<span class="loot-price">💰 ${fmtK(l.precio)}</span>` : '';

      const obtenidos = l.obtenidos || 0;
      const vendidos  = l.vendidos  || 0;
      const enVenta   = l.en_venta  || false;

      return `<div class="loot-block${l.bis ? ' loot-block-bis' : ''}">
        <div class="loot-row">
          ${bisStar}
          <span class="loot-name">${l.nombre}</span>
          ${tipoBadge}${rarezaBadge}${dropBadge}${priceBadge}
        </div>
        <div class="loot-tracking">
          <span class="loot-track-label">📦 Obt.</span>
          <input type="number" class="loot-counter" value="${obtenidos}" min="0"
            onchange="updateLootField('${eid}',${i},'obtenidos',+this.value)">
          <button class="en-venta-btn ${enVenta ? 'active' : ''}"
            onclick="toggleEnVenta('${eid}',${i})"
            title="${enVenta ? 'En subasta — click para quitar' : 'Marcar en subasta'}">
            🏷 ${enVenta ? 'En venta' : 'Vender'}
          </button>
          <span class="loot-track-label">💸 Vend.</span>
          <input type="number" class="loot-counter" value="${vendidos}" min="0"
            onchange="updateLootField('${eid}',${i},'vendidos',+this.value)">
        </div>
      </div>`;
    }).join('');

    let moneyHtml = '';
    if (dinero.bruto > 0) {
      moneyHtml = `<div class="money-summary">`;
      if (dinero.hasRates) moneyHtml += `<span class="money-real">📊 ~${fmtK(dinero.real)} / kill</span>`;
      moneyHtml += `<span class="money-bruto ${dinero.hasRates ? '' : 'money-bruto-solo'}">💰 ${fmtK(dinero.bruto)} bruto</span>`;
      if (bisTotalStr) moneyHtml += bisTotalStr;
      moneyHtml += `</div>`;
    }

    lootsHtml = `<div class="loots-section">${rows}${moneyHtml}</div>`;
  }

  // ── Countdown ──
  let countdownHtml;
  if (st.estado === 'unknown')         countdownHtml = `<div class="countdown unknown">⏳ Sin registro de muerte</div>`;
  else if (st.estado === 'disponible') countdownHtml = `<div class="countdown disponible">✅ ¡Disponible ahora!</div>`;
  else                                 countdownHtml = `<div class="countdown esperando">⏱ Disponible en ${formatRespawn(st.restante)} · <span class="cd-hora">a las ${horaDisponible(archi)}</span></div>`;

  const killInfo      = archi.ultimaMuerte ? `<div class="kill-info">Último kill: ${timeAgo(archi.ultimaMuerte)}</div>` : '';
  const respawnLabel  = archi.respawnCustom
    ? `<span class="respawn-custom">⚙ ${formatRespawn(respawnMin)} (personalizado)</span>`
    : `<span class="respawn-default">${formatRespawn(respawnMin)}</span>`;

  return `<div class="card ${isDisp}" data-id="${id}">
    <div class="card-head">
      <div class="card-emoji">👹</div>
      <div style="flex:1;min-width:0">
        <div class="card-name">${archi.nombre}</div>
        <div class="archi-meta">
          Nv. <strong>${archi.nivel}</strong>
          ${archi.region ? ` · ${archi.region}` : ''}
          ${archi.lugar  ? ` · <em style="color:var(--text2)">${archi.lugar}</em>` : ''}
        </div>
      </div>
      <div class="card-actions">
        <button class="action-btn" onclick="openModal('${eid}')" title="Editar">✏</button>
        <button class="action-btn danger" onclick="deleteArchi('${eid}')" title="Eliminar">🗑</button>
      </div>
    </div>
    ${lootsHtml}
    <div class="respawn-section">
      <div class="respawn-info">Respawn aprox: ${respawnLabel}</div>
      ${countdownHtml}
      ${killInfo}
      <div class="quick-kill">
        <button class="kill-btn" onclick="markKilled('${eid}', 0)">💀 Lo maté ahora</button>
        <button class="kill-mini kill-minus" onclick="adjustKill('${eid}', -5)" title="Lo maté 5 min antes de lo registrado">−5m</button>
        <button class="kill-mini kill-plus"  onclick="adjustKill('${eid}', +5)" title="Lo maté 5 min después de lo registrado">+5m</button>
      </div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// INLINE LOOT UPDATES
// ─────────────────────────────────────────────
async function updateLootField(archiId, lootIdx, field, value) {
  const archi = archis.find(a => a.id === archiId);
  if (!archi || !archi.loots[lootIdx]) return;
  archi.loots[lootIdx][field] = value;
  await pushArchi(archi);
}

async function toggleEnVenta(archiId, lootIdx) {
  const archi = archis.find(a => a.id === archiId);
  if (!archi || !archi.loots[lootIdx]) return;
  archi.loots[lootIdx].en_venta = !archi.loots[lootIdx].en_venta;
  render();
  await pushArchi(archi);
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
function render() {
  const container   = document.getElementById('cards');
  const empty       = document.getElementById('empty');
  const resultsText = document.getElementById('results-text');

  updateRegionButtons();

  const filtered = sortArchis(archis.filter(matchesArchi));

  if (filtered.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    resultsText.innerHTML = archis.length === 0
      ? 'Sin archimonstruos — pulsa <strong>+ Añadir</strong> para empezar'
      : 'No hay resultados con esos filtros.';
    return;
  }

  empty.style.display = 'none';
  container.innerHTML = filtered.map(buildCard).join('');

  const disp = filtered.filter(a => getStatus(a).estado === 'disponible').length;
  const dispStr = disp > 0
    ? ` · <span style="color:var(--green);font-weight:600">${disp} disponibles</span>` : '';
  resultsText.innerHTML = `Mostrando <strong>${filtered.length}</strong> archimonstruos${dispStr}`;

  updateNotifHeader();
}

function updateNotifHeader() {
  const el     = document.getElementById('notif-disponibles');
  const textEl = document.getElementById('notif-text');
  if (!el || !textEl) return;

  const FRESH_MS   = 30 * 60 * 1000;
  const now        = Date.now();
  const disponibles = archis.filter(a => getStatus(a).estado === 'disponible');

  if (disponibles.length === 0) { el.style.display = 'none'; return; }

  const fresh = disponibles.filter(a => {
    const respawnMs      = (a.respawnMinutos || defaultRespawnMin(a.nivel)) * 60000;
    const availableSince = a.ultimaMuerte + respawnMs;
    return (now - availableSince) < FRESH_MS;
  });

  el.style.display = 'flex';
  const isFresh = fresh.length > 0;
  el.className = `notif-disponibles ${isFresh ? 'notif-fresh' : 'notif-old'}`;
  const n = isFresh ? fresh.length : disponibles.length;
  const suffix = n > 1 ? 's' : '';
  textEl.textContent = isFresh
    ? `${n} boss${suffix} disponible${suffix}`
    : `${n} disponible${suffix} — puede que ya muerto${suffix}`;
}

// ─────────────────────────────────────────────
// REGION FILTER
// ─────────────────────────────────────────────
function updateRegionButtons() {
  const regions = [...new Set(archis.map(a => a.region).filter(Boolean))].sort();
  const grid = document.getElementById('region-grid');
  if (grid) {
    grid.innerHTML = regions.length
      ? regions.map(r =>
          `<button class="tipo-btn ${activeRegions.has(r) ? 'active' : ''}" onclick="toggleRegion('${r.replace(/'/g, "\\'")}'">${r}</button>`
        ).join('')
      : `<span style="font-size:0.8rem;color:var(--muted);font-style:italic">Sin regiones aún</span>`;
  }

  // Rareza (estática, siempre se muestran las 5)
  const rarezaGrid = document.getElementById('rareza-grid');
  if (rarezaGrid && !rarezaGrid.dataset.built) {
    rarezaGrid.dataset.built = '1';
    rarezaGrid.innerHTML = RAREZAS.map(r =>
      `<button class="tipo-btn rareza-btn ${rarezaClass(r)}" id="rbtn-${rarezaClass(r)}" onclick="toggleRareza('${r}')">${r}</button>`
    ).join('');
  }
  // Actualiza estado activo de rareza
  RAREZAS.forEach(r => {
    const btn = document.getElementById(`rbtn-${rarezaClass(r)}`);
    if (btn) btn.classList.toggle('active', activeRarezas.has(r));
  });

  // Tipos de loot (dinámico: los que haya en los datos)
  const tipoGrid = document.getElementById('tipo-loot-grid');
  if (tipoGrid) {
    const tipos = [...new Set(
      archis.flatMap(a => (a.loots || []).map(tipoEfectivo).filter(Boolean))
    )].sort();
    tipoGrid.innerHTML = tipos.length
      ? tipos.map(t =>
          `<button class="tipo-btn ${activeTipos.has(t) ? 'active' : ''}" onclick="toggleTipoLoot('${t.replace(/'/g, "\\'")}'">${t}</button>`
        ).join('')
      : `<span style="font-size:0.8rem;color:var(--muted);font-style:italic">Sin tipos aún</span>`;
  }
}

function toggleRegion(r) {
  if (activeRegions.has(r)) activeRegions.delete(r); else activeRegions.add(r);
  render();
}

function toggleRareza(r) {
  if (activeRarezas.has(r)) activeRarezas.delete(r); else activeRarezas.add(r);
  render();
}

function toggleTipoLoot(t) {
  if (activeTipos.has(t)) activeTipos.delete(t); else activeTipos.add(t);
  render();
}

function toggleSoloDisponibles() {
  soloDisponibles = !soloDisponibles;
  document.getElementById('toggle-disp').classList.toggle('on', soloDisponibles);
  render();
}

function toggleSoloBis() {
  soloBis = !soloBis;
  document.getElementById('toggle-bis').classList.toggle('on', soloBis);
  render();
}

// ─────────────────────────────────────────────
// KILL TRACKING
// ─────────────────────────────────────────────
async function markKilled(id, minutosAtras) {
  const archi = archis.find(a => a.id === id);
  if (!archi) return;
  archi.ultimaMuerte = Date.now() - (minutosAtras * 60000);
  render();
  await pushArchi(archi);
}

async function adjustKill(id, minutos) {
  const archi = archis.find(a => a.id === id);
  if (!archi || !archi.ultimaMuerte) return;
  archi.ultimaMuerte += minutos * 60000;
  render();
  await pushArchi(archi);
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
async function deleteArchi(id) {
  if (!confirm('¿Eliminar este archimonstruo?')) return;
  archis = archis.filter(a => a.id !== id);
  render();
  await removeArchiFromDb(id);
}

// ─────────────────────────────────────────────
// MODAL — FORM
// ─────────────────────────────────────────────
function openModal(id) {
  editingId = id || null;
  customRespawnEnabled = false;
  lootCount = 0;

  document.getElementById('archi-form').reset();
  document.getElementById('loots-container').innerHTML = '';
  document.getElementById('f-respawn-wrap').style.display = 'none';
  document.getElementById('custom-toggle').classList.remove('on');
  document.getElementById('modal-title').textContent = id ? 'Editar Archimonstruo' : 'Añadir Archimonstruo';

  updateDataLists();

  if (id) {
    const archi = archis.find(a => a.id === id);
    if (archi) {
      document.getElementById('f-nombre').value = archi.nombre;
      document.getElementById('f-nivel').value  = archi.nivel;
      document.getElementById('f-region').value = archi.region || '';
      document.getElementById('f-lugar').value  = archi.lugar  || '';
      updateRespawnCalc(archi.nivel);
      if (archi.respawnCustom) {
        customRespawnEnabled = true;
        document.getElementById('custom-toggle').classList.add('on');
        document.getElementById('f-respawn-wrap').style.display = 'block';
        document.getElementById('f-respawn').value = archi.respawnMinutos;
      }
      (archi.loots || []).forEach(l =>
        addLootRow(l.nombre, l.precio, l.drop_rate, l.tipo, l.subtipo, l.rareza, l.bis, l.tipo_custom)
      );
    }
  } else {
    updateRespawnCalc('');
  }

  document.getElementById('modal').style.display = 'flex';
  document.getElementById('f-nombre').focus();
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  editingId = null;
}

function updateRespawnCalc(nivel) {
  const n = parseInt(nivel, 10);
  document.getElementById('respawn-calc').textContent =
    isNaN(n) || n < 1 ? '—' : formatRespawn(defaultRespawnMin(n));
}

function toggleCustomRespawn() {
  customRespawnEnabled = !customRespawnEnabled;
  document.getElementById('custom-toggle').classList.toggle('on', customRespawnEnabled);
  document.getElementById('f-respawn-wrap').style.display = customRespawnEnabled ? 'block' : 'none';
}

function addLootRow(nombre = '', precio = '', drop_rate = '', tipo = '', subtipo = '', rareza = '', bis = false, tipo_custom = '') {
  lootCount++;
  const c = lootCount;
  const isEquipable = tipo === 'equipable';
  const isOtro      = tipo === 'otro';

  const subtipoOpts = SUBTIPOS_EQUIP.map(s =>
    `<option value="${s}" ${s === subtipo ? 'selected' : ''}>${s}</option>`).join('');
  const rarezaOpts = RAREZAS.map(r =>
    `<option value="${r}" ${r === rareza ? 'selected' : ''}>${r}</option>`).join('');

  const row = document.createElement('div');
  row.className = 'loot-form-row';
  row.id = `loot-row-${c}`;
  row.innerHTML = `
    <div class="loot-form-top">
      <input type="text"   class="form-input lf-nombre" placeholder="Nombre del loot" value="${nombre}" style="flex:1;min-width:0">
      <input type="number" class="form-input lf-precio" placeholder="Precio k" value="${precio || ''}" min="0" style="width:90px">
      <input type="number" class="form-input lf-drop"   placeholder="% drop"   value="${drop_rate || ''}" min="0" max="100" style="width:65px">
      <label class="bis-label" title="Best In Slot — el mejor objeto posible para ese slot">
        <input type="checkbox" class="lf-bis" ${bis ? 'checked' : ''}> BIS
      </label>
      <button type="button" class="action-btn danger" onclick="removeLootRow(${c})">✕</button>
    </div>
    <div class="loot-form-bottom">
      <select class="form-input lf-tipo" onchange="onTipoChange(this,${c})">
        <option value="">— Tipo —</option>
        <option value="componente" ${tipo === 'componente' ? 'selected' : ''}>📦 Componente</option>
        <option value="equipable"  ${tipo === 'equipable'  ? 'selected' : ''}>⚔ Equipable</option>
        <option value="otro"       ${tipo === 'otro'       ? 'selected' : ''}>✦ Otro…</option>
      </select>
      <input type="text" class="form-input lf-tipo-custom" placeholder="Escribe el tipo"
        value="${tipo_custom || ''}" style="display:${isOtro ? '' : 'none'};flex:1">
      <select class="form-input lf-subtipo" style="display:${isEquipable ? '' : 'none'};flex:1">
        <option value="">— Subtipo —</option>
        ${subtipoOpts}
      </select>
      <select class="form-input lf-rareza" style="display:${isEquipable ? '' : 'none'};flex:1">
        <option value="">— Rareza —</option>
        ${rarezaOpts}
      </select>
    </div>`;
  document.getElementById('loots-container').appendChild(row);
}

function onTipoChange(select, c) {
  const row = document.getElementById(`loot-row-${c}`);
  const isEquipable = select.value === 'equipable';
  const isOtro      = select.value === 'otro';
  row.querySelector('.lf-subtipo').style.display    = isEquipable ? '' : 'none';
  row.querySelector('.lf-rareza').style.display     = isEquipable ? '' : 'none';
  row.querySelector('.lf-tipo-custom').style.display = isOtro     ? '' : 'none';
}

function removeLootRow(c) {
  document.getElementById(`loot-row-${c}`)?.remove();
}

function getLootsFromForm() {
  const existingLoots = editingId
    ? (archis.find(a => a.id === editingId)?.loots || []) : [];
  const exMap = {};
  existingLoots.forEach(l => { if (l.nombre) exMap[l.nombre.toLowerCase()] = l; });

  return Array.from(document.getElementById('loots-container').querySelectorAll('.loot-form-row'))
    .map(row => {
      const nombre    = row.querySelector('.lf-nombre').value.trim();
      const precio    = parseInt(row.querySelector('.lf-precio').value, 10);
      const drop_rate = parseInt(row.querySelector('.lf-drop').value, 10);
      const bis       = row.querySelector('.lf-bis').checked;
      const tipo      = row.querySelector('.lf-tipo').value;
      const subtipo   = row.querySelector('.lf-subtipo').value   || null;
      const rareza    = row.querySelector('.lf-rareza').value    || null;
      const tipo_custom = row.querySelector('.lf-tipo-custom').value.trim() || null;
      const ex        = exMap[nombre.toLowerCase()] || {};
      return {
        nombre,
        precio:     isNaN(precio)    || precio    < 0 ? null : precio,
        drop_rate:  isNaN(drop_rate) || drop_rate < 0 ? null : Math.min(drop_rate, 100),
        tipo:       tipo || null,
        subtipo:    tipo === 'equipable' ? subtipo    : null,
        rareza:     tipo === 'equipable' ? rareza     : null,
        tipo_custom: tipo === 'otro'    ? tipo_custom : null,
        bis,
        obtenidos:  ex.obtenidos || 0,
        en_venta:   ex.en_venta  || false,
        vendidos:   ex.vendidos  || 0
      };
    }).filter(l => l.nombre);
}

async function saveArchi(e) {
  e.preventDefault();
  const nombre = document.getElementById('f-nombre').value.trim();
  const nivel  = parseInt(document.getElementById('f-nivel').value, 10);
  const region = document.getElementById('f-region').value.trim();
  const lugar  = document.getElementById('f-lugar').value.trim();
  const loots  = getLootsFromForm();

  let respawnMinutos = defaultRespawnMin(nivel), respawnCustom = false;
  if (customRespawnEnabled) {
    const custom = parseInt(document.getElementById('f-respawn').value, 10);
    if (!isNaN(custom) && custom > 0) { respawnMinutos = custom; respawnCustom = true; }
  }

  let archi;
  if (editingId) {
    archi = archis.find(a => a.id === editingId);
    if (archi) Object.assign(archi, { nombre, nivel, region, lugar, loots, respawnMinutos, respawnCustom });
  } else {
    archi = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      nombre, nivel, region, lugar, loots, respawnMinutos, respawnCustom, ultimaMuerte: null
    };
    archis.push(archi);
  }
  closeModal();
  render();
  await pushArchi(archi);
}

// ─────────────────────────────────────────────
// EVENTOS
// ─────────────────────────────────────────────
document.getElementById('search').addEventListener('input', e => { searchText = e.target.value; render(); });
document.getElementById('modal').addEventListener('click', e => { if (e.target === document.getElementById('modal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
loadArchis();

setInterval(() => {
  archis.forEach(archi => {
    const card = document.querySelector(`.card[data-id="${archi.id}"]`);
    if (!card) return;
    const st = getStatus(archi);
    const cd = card.querySelector('.countdown');
    if (!cd) return;
    if (st.estado === 'unknown') {
      cd.className = 'countdown unknown'; cd.textContent = '⏳ Sin registro de muerte';
    } else if (st.estado === 'disponible') {
      if (!cd.classList.contains('disponible')) render();
    } else {
      cd.className = 'countdown esperando';
      cd.innerHTML = `⏱ Disponible en ${formatRespawn(st.restante)} · <span class="cd-hora">a las ${horaDisponible(archi)}</span>`;
    }
  });
  updateNotifHeader();
}, 30000);
