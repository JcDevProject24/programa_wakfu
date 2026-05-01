// Tests para las optimizaciones de profesiones.js
// Ejecutar con: node profesiones.test.js

// ─────────────────────────────────────────────
// Runner minimalista
// ─────────────────────────────────────────────
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    → ${e.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    → ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'falló la aserción');
}
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `esperaba ${JSON.stringify(b)}, obtuvo ${JSON.stringify(a)}`);
}
function assertNull(a, msg) {
  if (a !== null) throw new Error(msg || `esperaba null, obtuvo ${JSON.stringify(a)}`);
}

// ─────────────────────────────────────────────
// Copia fiel de las funciones optimizadas
// (misma lógica que profesiones.js, sin DOM ni fetch)
// ─────────────────────────────────────────────
const TAX_RATE = 0.0166;

const normName = s => (s || '').toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '');

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

let items = [];
let itemsById       = new Map();
let itemsByNormName = new Map();
let _indexesDirty   = true;
let _dataVersion    = 0;
let _calcCache      = new Map();

function _markItemsDirty() {
  _indexesDirty = true;
  _dataVersion++;
}

function rebuildIndexes() {
  itemsById = new Map(items.map(i => [i.id, i]));
  itemsByNormName = new Map();
  for (const i of items) {
    itemsByNormName.set(normName(i.nombre), i);
    if (i.nombre_alternativo) itemsByNormName.set(normName(i.nombre_alternativo), i);
  }
  _indexesDirty = false;
}

function byId(id) {
  if (id == null) return undefined;
  if (_indexesDirty) rebuildIndexes();
  return itemsById.get(id);
}

function findMatItem(nombre) {
  if (_indexesDirty) rebuildIndexes();
  return itemsByNormName.get(normName(nombre));
}

let catalog = {};

function getCatalogPrice(nombre) {
  return catalog[normName(nombre)] ?? 0;
}

function getMatInfo(m) {
  if (!m.item_id) {
    const precio = getCatalogPrice(m.nombre);
    return { precio, modo: 'compra' };
  }
  const ref = byId(m.item_id);
  if (!ref) {
    const precio = getCatalogPrice(m.nombre);
    return { precio, modo: 'compra' };
  }
  const precioCompra   = getCatalogPrice(m.nombre);
  const precioCreacion = calcCoste(ref);
  let precio, modo;
  if (precioCreacion > 0 && precioCompra > 0) {
    if (precioCreacion <= precioCompra) { precio = precioCreacion; modo = 'crafteo'; }
    else                                { precio = precioCompra;   modo = 'compra';  }
  } else if (precioCreacion > 0) { precio = precioCreacion; modo = 'crafteo'; }
  else                           { precio = precioCompra;   modo = 'compra';  }
  return { precio, modo };
}

function _calcCosteReceta(mats) {
  return (mats || []).reduce((s, m) => s + getMatInfo(m).precio * (m.cantidad || 0), 0);
}

function calcCoste(item) {
  const key = 'c' + item.id;
  if (_calcCache.has(key)) return _calcCache.get(key);
  const recetas = [item.materiales, ...(item.recetas_alt || [])].filter(r => r?.length);
  const result = !recetas.length ? (item.coste_base || 0) : Math.min(...recetas.map(_calcCosteReceta));
  _calcCache.set(key, result);
  return result;
}

function getPrecioActual(item) {
  if (!item.historial_precios?.length) return null;
  return item.historial_precios.reduce((latest, e) => e.fecha > latest.fecha ? e : latest).precio;
}

function calcProfit(item) {
  const key = 'p' + item.id;
  if (_calcCache.has(key)) return _calcCache.get(key);
  let result = null;
  if (item.categoria !== 'recoleccion' && item.categoria !== 'material') {
    const coste  = calcCoste(item);
    const precio = getPrecioActual(item);
    if (precio !== null) {
      const neto      = Math.round(precio * (1 - TAX_RATE));
      const profit    = neto - coste;
      const profitPct = coste > 0 ? (profit / coste * 100) : null;
      result = { profit, profitPct, coste, precio, neto };
    }
  }
  _calcCache.set(key, result);
  return result;
}

// Helper: resetear estado entre bloques de tests
function resetState(newItems = [], newCatalog = {}) {
  items   = newItems;
  catalog = newCatalog;
  _markItemsDirty();
  _calcCache.clear();
}

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

console.log('\nnormName');
test('minúsculas',           () => assertEqual(normName('MADERA'), 'madera'));
test('trim espacios',        () => assertEqual(normName('  madera  '), 'madera'));
test('tilde á → a',          () => assertEqual(normName('ámbar'), 'ambar'));
test('tilde é → e',          () => assertEqual(normName('Esencia Épica'), 'esencia epica'));
test('tilde ó → o',          () => assertEqual(normName('Decoración'), 'decoracion'));
test('tilde ú → u',          () => assertEqual(normName('Útil'), 'util'));
test('ñ → n',                () => assertEqual(normName('Muñeco'), 'muneco'));
test('buscar con tilde = sin tilde', () => assertEqual(normName('Madera'), normName('Mádera')));
test('cadena vacía',         () => assertEqual(normName(''), ''));
test('null devuelve vacío',  () => assertEqual(normName(null), ''));

console.log('\ndebounce');
await testAsync('ejecuta 1 vez tras N llamadas rápidas', () => new Promise(resolve => {
  let count = 0;
  const fn = debounce(() => count++, 40);
  fn(); fn(); fn();
  setTimeout(() => {
    assert(count === 1, `esperaba 1, obtuvo ${count}`);
    resolve();
  }, 80);
}));
await testAsync('no ejecuta antes del delay', () => new Promise(resolve => {
  let count = 0;
  const fn = debounce(() => count++, 80);
  fn();
  setTimeout(() => {
    assert(count === 0, `no debería haber ejecutado aún, obtuvo ${count}`);
    resolve();
  }, 30);
}));
await testAsync('resetea el timer en cada llamada', () => new Promise(resolve => {
  let count = 0;
  const fn = debounce(() => count++, 60);
  fn();
  setTimeout(fn, 30);
  setTimeout(fn, 55);
  setTimeout(() => {
    assert(count === 0, `timer debería haberse reseteado, obtuvo ${count}`);
    resolve();
  }, 90);
}));

console.log('\nbyId / findMatItem (Maps O(1))');
resetState([
  { id: 'a1', nombre: 'Madera', nombre_alternativo: null, categoria: 'recoleccion' },
  { id: 'b2', nombre: 'Acero',  nombre_alternativo: 'Metal', categoria: 'material' },
  { id: 'c3', nombre: 'Esencia Épica', nombre_alternativo: null, categoria: 'crafteo' },
]);
test('byId encuentra por id',              () => assert(byId('a1')?.nombre === 'Madera'));
test('byId devuelve undefined si no existe',() => assert(byId('zz') === undefined));
test('byId con null devuelve undefined',   () => assert(byId(null) === undefined));
test('findMatItem por nombre exacto',      () => assert(findMatItem('Madera')?.id === 'a1'));
test('findMatItem insensible a mayúsculas',() => assert(findMatItem('madera')?.id === 'a1'));
test('findMatItem insensible a tildes',    () => assert(findMatItem('Esencia Epica')?.id === 'c3'));
test('findMatItem por nombre_alternativo', () => assert(findMatItem('Metal')?.id === 'b2'));
test('findMatItem devuelve undefined si no existe', () => assert(findMatItem('XYZ') === undefined));

console.log('\n_markItemsDirty / rebuildIndexes');
test('markItemsDirty sube _dataVersion',  () => {
  const prev = _dataVersion;
  _markItemsDirty();
  assert(_dataVersion === prev + 1, `esperaba ${prev + 1}, obtuvo ${_dataVersion}`);
});
test('indexes se reconstruyen tras push', () => {
  resetState([{ id: 'x1', nombre: 'Tabla', nombre_alternativo: null }]);
  assert(byId('x1')?.nombre === 'Tabla');
  items.push({ id: 'x2', nombre: 'Piedra', nombre_alternativo: null });
  _markItemsDirty();
  assert(byId('x2')?.nombre === 'Piedra', 'nuevo item no encontrado tras push');
});

console.log('\ncalcCoste');
resetState(
  [
    { id: 'm1', nombre: 'Fibra',  categoria: 'recoleccion', materiales: [], recetas_alt: [], coste_base: null, historial_precios: [] },
    { id: 'm2', nombre: 'Resina', categoria: 'recoleccion', materiales: [], recetas_alt: [], coste_base: null, historial_precios: [] },
    {
      id: 'c1', nombre: 'Cuerda', categoria: 'crafteo',
      materiales: [{ nombre: 'Fibra', cantidad: 3, item_id: 'm1' }, { nombre: 'Resina', cantidad: 1, item_id: 'm2' }],
      recetas_alt: [], coste_base: null, historial_precios: []
    },
  ],
  { fibra: 100, resina: 200 }
);
test('calcula coste correctamente (3×100 + 1×200 = 500)', () => {
  const item = byId('c1');
  assertEqual(calcCoste(item), 500);
});
test('usa coste_base cuando no hay materiales', () => {
  const item = { id: 'solo', nombre: 'Solo', categoria: 'material', materiales: [], recetas_alt: [], coste_base: 999, historial_precios: [] };
  assertEqual(calcCoste(item), 999);
});
test('devuelve 0 sin materiales ni coste_base', () => {
  const item = { id: 'vacio', nombre: 'Vacio', categoria: 'material', materiales: [], recetas_alt: [], coste_base: null, historial_precios: [] };
  assertEqual(calcCoste(item), 0);
});
test('elige receta_alt si es más barata', () => {
  const item = {
    id: 'dual', nombre: 'Dual', categoria: 'crafteo',
    materiales:   [{ nombre: 'Fibra', cantidad: 5, item_id: 'm1' }],
    recetas_alt:  [[{ nombre: 'Fibra', cantidad: 2, item_id: 'm1' }]],
    coste_base: null, historial_precios: []
  };
  assertEqual(calcCoste(item), 200); // receta_alt: 2×100
});

console.log('\ncalcCoste — caché');
test('segunda llamada devuelve valor cacheado', () => {
  _calcCache.clear();
  const item = byId('c1');
  let calls = 0;
  const origReduce = Array.prototype.reduce;
  calcCoste(item);
  const key = 'c' + item.id;
  assert(_calcCache.has(key), 'debería estar en caché tras primera llamada');
  const cached = _calcCache.get(key);
  assertEqual(calcCoste(item), cached, 'segunda llamada debe devolver mismo valor');
});
test('caché se limpia manualmente', () => {
  _calcCache.clear();
  assert(!_calcCache.has('cc1'), 'caché debe estar vacía tras clear()');
});

console.log('\ncalcProfit');
resetState(
  [
    { id: 'm1', nombre: 'Fibra', categoria: 'recoleccion', materiales: [], recetas_alt: [], coste_base: null, historial_precios: [] },
    {
      id: 'c1', nombre: 'Cuerda', categoria: 'crafteo',
      materiales: [{ nombre: 'Fibra', cantidad: 3, item_id: 'm1' }],
      recetas_alt: [], coste_base: null,
      historial_precios: [{ precio: 500, fecha: 1000 }, { precio: 600, fecha: 2000 }]
    },
  ],
  { fibra: 100 }
);
test('calcula profit correctamente', () => {
  const item = byId('c1');
  const p = calcProfit(item);
  const neto = Math.round(600 * (1 - TAX_RATE)); // precio más reciente
  assertEqual(p.coste, 300);   // 3×100
  assertEqual(p.precio, 600);
  assertEqual(p.neto, neto);
  assertEqual(p.profit, neto - 300);
});
test('devuelve null para recoleccion', () => {
  const item = byId('m1');
  assertNull(calcProfit(item));
});
test('devuelve null si sin historial de precios', () => {
  const item = { id: 'sp', nombre: 'SinPrecio', categoria: 'crafteo', materiales: [], recetas_alt: [], coste_base: 0, historial_precios: [] };
  assertNull(calcProfit(item));
});
test('profit cacheado en segunda llamada', () => {
  const item = byId('c1');
  _calcCache.clear();
  const r1 = calcProfit(item);
  const r2 = calcProfit(item);
  assert(r1 === r2, 'debe devolver la misma referencia cacheada');
});

// ─────────────────────────────────────────────
// Resultado final
// ─────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed + failed} tests: ${passed} pasaron, ${failed} fallaron`);
if (failed === 0) console.log('  Todo correcto ✓');
console.log('');
process.exit(failed > 0 ? 1 : 0);
