/**
 * Prueba de humo de la aplicación real (jsdom + el React/JSZip del repo).
 * Verifica la Fase 1 de la auditoría y los dos cambios pedidos:
 *   · Sección C: botón activo, limpiar selección, distancia acumulada en vivo.
 *   · Sección L: carrusel giratorio de condición final (imágenes intactas).
 *
 * React vuelca el estado en un macrotask en jsdom (no hay MessageChannel),
 * así que cada interacción espera un tick antes de afirmar.
 *
 * Ejecutar desde la carpeta que contiene este archivo.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Localiza el repositorio buscándolo hacia arriba desde esta carpeta: sirve tanto si
// está al lado de smoke/ como si está al lado del paquete entero. Se reconoce por
// contenido, no por nombre (repo-btmm/, BTMM-Senderos-PNLQ/ o cualquier otro).
function encontrarRepo() {
  const esRepo = (p) => ['index.html', 'sw.js', 'responsive.css', 'vendor']
    .every((x) => fs.existsSync(p + x));
  const candidatos = ['repo-btmm', 'BTMM-Senderos-PNLQ'];
  let dir = process.cwd();
  for (let nivel = 0; nivel < 4; nivel++) {
    for (const c of candidatos) {
      const p = path.join(dir, c) + path.sep;
      if (esRepo(p)) return p;
    }
    for (const d of fs.readdirSync(dir)) {
      const p = path.join(dir, d) + path.sep;
      try { if (fs.statSync(p).isDirectory() && esRepo(p)) return p; } catch (e) { /* no es carpeta */ }
    }
    const sube = path.resolve(dir, '..');
    if (sube === dir) break;
    dir = sube;
  }
  throw new Error('No se encontró el repositorio (index.html + sw.js + responsive.css + vendor/) '
    + 'buscando hacia arriba desde ' + process.cwd());
}
const REPO = encontrarRepo();
console.log('Repositorio bajo prueba:', REPO);
const html = fs.readFileSync(REPO + 'index.html', 'utf8');
const bundle = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  .reduce((a, b) => (b.length > a.length ? b : a), '');

const dom = new JSDOM('<!doctype html><html lang="es"><body><div id="root"></div></body></html>', {
  url: 'https://psforestal-rgb.github.io/BTMM-Senderos-PNLQ/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const w = dom.window;

// APIs que jsdom no implementa y la app usa en flujos secundarios (fotos, DOCX).
w.matchMedia = w.matchMedia || ((q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
w.Element.prototype.scrollIntoView = function () {};
w.URL.createObjectURL = () => 'blob:stub';
w.URL.revokeObjectURL = () => {};
w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t, k) => (k === 'canvas' ? { width: 0, height: 0 } : () => {}), set: () => true });

const errores = [];
w.console.error = (...a) => errores.push(String(a[0]).slice(0, 300));
w.console.warn = () => {};
w.addEventListener('error', (e) => errores.push((e.error && e.error.stack) || e.message));
const alertas = [];
w.alert = (m) => alertas.push(String(m));
w.confirm = () => true;

for (const f of ['vendor/react.production.min.js', 'vendor/react-dom.production.min.js', 'vendor/jszip.min.js', 'respaldo-config.js']) {
  w.eval(fs.readFileSync(REPO + f, 'utf8'));
}
w.eval(bundle);

const $ = (s) => w.document.querySelector(s);
const $$ = (s) => [...w.document.querySelectorAll(s)];
const texto = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
const porTexto = (sel, frag) => $$(sel).find((e) => texto(e).toLowerCase().includes(frag.toLowerCase()));
const tick = () => new Promise((r) => setTimeout(r, 30));
async function clic(el) {
  if (!el) return false;
  el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w, detail: 1, button: 0 }));
  await tick();
  return true;
}
async function tecla(el, key) {
  if (!el) return false;
  el.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  await tick();
  return true;
}

const resultados = [];
const ok = (nombre, cond, extra = '') => resultados.push({ nombre, pasa: !!cond, extra: String(extra) });

(async () => {
  await tick();
  await tick();

  // ── arranque ──────────────────────────────────────────────────────────────
  const root = $('#root');
  ok('La aplicación renderiza', root && root.children.length > 0, `${root ? root.innerHTML.length : 0} caracteres de DOM`);
  ok('Las 12 secciones están en el DOM', $$('[id^="section-panel-"]').length === 12, $$('[id^="section-panel-"]').map((e) => e.id.replace('section-panel-', '')).join(''));
  ok('Sin errores de React ni excepciones', errores.length === 0, errores.slice(0, 2).join(' | '));
  ok('Versión visible actualizada a 1.52', /1\.52/.test(texto(root)), (texto(root).match(/Versión\s*([\d.]+)/) || [])[1] || '');

  // ── Sección A: sector y sendero (requisito para que exista la sección C) ───
  await clic(porTexto('button', 'Elegir'));
  await clic(porTexto('button', 'Barajas'));
  ok('Sector y sendero seleccionables', !!porTexto('body *', 'Barajas'));

  // ── CAMBIO 1 · Sección C ──────────────────────────────────────────────────
  const acc = $('.trail-accumulated');
  ok('C1 · Indicador de distancia acumulada presente', !!acc, acc ? texto(acc) : '');
  ok('C1 · Empieza en 0 m', acc && /^0 m$/.test(texto($('.trail-accumulated-value'))), texto($('.trail-accumulated-value')));
  ok('C1 · Mensaje guía sin selección', acc && /Toque secciones/.test(texto(acc)), texto($('.trail-accumulated-detail')));
  ok('C1 · Anunciado a lectores de pantalla', acc && acc.getAttribute('aria-live') === 'polite' && acc.getAttribute('role') === 'status');

  const btnCompleto = porTexto('button', 'Agregar sendero completo');
  ok('C1 · Botón «Agregar sendero completo» existe', !!btnCompleto);
  ok('C1 · Sin seleccionar: fondo azul institucional', btnCompleto && btnCompleto.style.background !== 'rgb(255, 234, 0)', btnCompleto ? btnCompleto.style.background : '');
  await clic(btnCompleto);
  const activo = $('.trail-mode-button.is-active');
  ok('C1 · Al activarse cambia de color (amarillo fluor)', !!activo && activo.style.background === 'rgb(255, 234, 0)', activo ? activo.style.background : '');
  ok('C1 · El botón activo expone aria-pressed', activo && activo.getAttribute('aria-pressed') === 'true');
  ok('C1 · El texto del botón confirma la selección', activo && /Sendero completo seleccionado/.test(texto(activo)), activo ? texto(activo) : '');
  const total = parseInt(texto($('.trail-accumulated-value')), 10);
  ok('C1 · La distancia acumulada refleja el sendero completo', total > 0, `${total} m`);
  ok('C1 · El detalle muestra tramos y porcentaje del sendero', /tramo/.test(texto($('.trail-accumulated-detail'))) && /%/.test(texto($('.trail-accumulated-detail'))), texto($('.trail-accumulated-detail')));

  const limpiar = porTexto('button', 'Limpiar selección');
  ok('C1 · Botón «Limpiar selección» aparece al haber selección', !!limpiar);
  await clic(limpiar);
  ok('C1 · «Limpiar selección» vacía la distancia', parseInt(texto($('.trail-accumulated-value')), 10) === 0, texto($('.trail-accumulated-value')));
  ok('C1 · «Limpiar selección» quita el estado activo del botón', !$('.trail-mode-button.is-active'));
  ok('C1 · «Limpiar selección» oculta el panel de tramos', !$('.trail-selected-card'));
  ok('C1 · Sin selección no se ofrece limpiar', !porTexto('button', 'Limpiar selección'));

  // selección por secciones: la distancia debe acumularse paso a paso
  await clic(porTexto('button', 'Seleccionar secciones'));
  const modoSecciones = porTexto('body *', 'Toque las secciones');
  ok('C1 · Entra en modo de selección de secciones', !!modoSecciones || !!$('.trail-selected-panel'));
  const lineas = $$('polyline[data-segment-id]');
  if (lineas.length) {
    await clic(lineas[0]);
    const d1 = parseInt(texto($('.trail-accumulated-value')), 10);
    await clic(lineas[1]);
    const d2 = parseInt(texto($('.trail-accumulated-value')), 10);
    ok('C1 · La distancia acumulada crece al marcar secciones', d2 > d1 && d1 > 0, `${d1} m → ${d2} m`);
    ok('C1 · Dos secciones contiguas cuentan como un solo tramo', /1 tramo ·/.test(texto($('.trail-accumulated-detail'))), texto($('.trail-accumulated-detail')));
    ok('C1 · Coincide con el encabezado del panel de tramos', /1 tramo/.test(texto($('.trail-selected-heading'))), texto($('.trail-selected-heading')));
  } else {
    ok('C1 · La distancia acumulada crece al marcar secciones', false, 'no se localizaron las secciones clicables en jsdom (SVG)');
  }

  // ── CAMBIO 2 · Sección L: carrusel ────────────────────────────────────────
  const car = $('.condition-carousel');
  ok('C2 · Carrusel de condición final presente', !!car, car ? `role=${car.getAttribute('role')}` : '');
  const caras = $$('.condition-carousel-item');
  ok('C2 · Cinco caras conservadas', caras.length === 5, `${caras.length}`);
  ok('C2 · Las imágenes siguen siendo el sprite de danta', caras.every((c) => {
    const f = c.querySelector('.condition-danta-face');
    return f && /% center/.test(f.getAttribute('style') || '');
  }), caras.map((c) => (c.querySelector('.condition-danta-face') || {}).style && c.querySelector('.condition-danta-face').style.backgroundPosition).join(' '));
  ok('C2 · Las cinco posiciones del sprite son distintas', new Set(caras.map((c) => c.querySelector('.condition-danta-face').style.backgroundPosition)).size === 5);
  ok('C2 · Patrón radiogroup con aria-checked', car.getAttribute('role') === 'radiogroup' && caras.every((c) => c.getAttribute('role') === 'radio' && c.hasAttribute('aria-checked')));
  ok('C2 · Centro inicial en la posición 3', caras.findIndex((c) => c.classList.contains('is-center')) === 2);
  ok('C2 · Vecinas marcadas como cercanas y lejanas', $$('.condition-carousel-item.is-near').length === 2 && $$('.condition-carousel-item.is-far').length === 2,
    `cercanas=${$$('.condition-carousel-item.is-near').length} lejanas=${$$('.condition-carousel-item.is-far').length}`);
  ok('C2 · Sin calificar: nada marcado como elegido', !$('.condition-carousel-item.is-chosen') && /Toque una cara/.test(texto($('.condition-rating-label'))), texto($('.condition-rating-label')));
  ok('C2 · Tabindex itinerante (solo el centro)', caras.filter((c) => c.getAttribute('tabindex') === '0').length === 1);
  ok('C2 · Desplazamiento inicial del carrusel', /translateX\(calc\(-2 \* var\(--condition-slot\)\)\)/.test($('.condition-carousel-track').getAttribute('style') || ''), $('.condition-carousel-track').style.transform);

  await clic($$('.condition-carousel-arrow')[1]);
  ok('C2 · Flecha derecha gira a Bueno', /Bueno · 4 de 5/.test(texto($('.condition-rating-label'))) && $$('.condition-carousel-item').findIndex((c) => c.classList.contains('is-center')) === 3, texto($('.condition-rating-label')));
  ok('C2 · El desplazamiento acompaña al centro', /translateX\(calc\(-3 \* var\(--condition-slot\)\)\)/.test($('.condition-carousel-track').style.transform), $('.condition-carousel-track').style.transform);

  await clic($$('.condition-carousel-item')[0]);
  ok('C2 · Toque en cara lateral la lleva al centro', $$('.condition-carousel-item')[0].classList.contains('is-center') && /Muy malo · 1 de 5/.test(texto($('.condition-rating-label'))), texto($('.condition-rating-label')));
  ok('C2 · La cara central queda elegida (aria-checked)', $('.condition-carousel-item.is-chosen') && $('.condition-carousel-item.is-chosen').getAttribute('aria-checked') === 'true');
  ok('C2 · El foco viaja a la cara seleccionada', w.document.activeElement && w.document.activeElement.id === 'condition-face-1', (w.document.activeElement || {}).id);

  await tecla($('#condition-face-1'), 'ArrowRight');
  ok('C2 · Tecla → gira a la derecha', /Malo · 2 de 5/.test(texto($('.condition-rating-label'))), texto($('.condition-rating-label')));
  await tecla($('#condition-face-2'), 'Home');
  ok('C2 · Tecla Home lleva al mínimo', /Muy malo · 1 de 5/.test(texto($('.condition-rating-label'))), texto($('.condition-rating-label')));
  ok('C2 · Flecha izquierda deshabilitada en el extremo', $$('.condition-carousel-arrow')[0].disabled === true);
  await tecla($('#condition-face-1'), 'End');
  ok('C2 · Tecla End lleva al máximo', /Excelente · 5 de 5/.test(texto($('.condition-rating-label'))), texto($('.condition-rating-label')));
  ok('C2 · Flecha derecha deshabilitada en el extremo', $$('.condition-carousel-arrow')[1].disabled === true);
  ok('C2 · Etiqueta cualitativa bajo el centro', !!$('.condition-carousel .condition-rating-label'));
  ok('C2 · Deslizador y escala estática eliminados', !$('.condition-slider') && !$('.condition-slider-scale'));

  // giro por arrastre (simula el gesto en el teléfono)
  await tecla($('#condition-face-5'), 'End');
  await tecla($('#condition-face-5'), 'Home');
  const inicio = /Muy malo/.test(texto($('.condition-rating-label')));
  const vp = $('.condition-carousel-viewport');
  const puntero = (tipo, x) => (typeof w.PointerEvent === 'function'
    ? new w.PointerEvent(tipo, { bubbles: true, cancelable: true, clientX: x, pointerId: 7, isPrimary: true })
    : new w.MouseEvent(tipo, { bubbles: true, cancelable: true, clientX: x }));
  vp.dispatchEvent(puntero('pointerdown', 300));
  await tick();
  vp.dispatchEvent(puntero('pointerup', 210));
  await tick();
  ok('C2 · Arrastre hacia la izquierda avanza una posición', inicio && /Malo · 2 de 5/.test(texto($('.condition-rating-label'))), texto($('.condition-rating-label')));

  // ── FASE 1 · xmlEscape y DOCX ─────────────────────────────────────────────
  const malo = 'Texto con \u0007campana, \u000Bsalto vertical, \u0000nulo & < > "fin"';
  const escapado = w.eval(`xmlEscape(${JSON.stringify(malo)})`);
  ok('F1 · xmlEscape elimina controles ilegales', !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(escapado), JSON.stringify(escapado));
  ok('F1 · xmlEscape sigue escapando & < > "', escapado.includes('&amp;') && escapado.includes('&lt;') && escapado.includes('&gt;') && escapado.includes('&quot;'));
  const parrafo = w.eval(`docxPara(${JSON.stringify('Aviso \u000B con control & <etiqueta>')})`);
  ok('F1 · docxPara genera XML sin caracteres ilegales', !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(parrafo) && parrafo.startsWith('<w:p>') && parrafo.endsWith('</w:p>'), parrafo.slice(0, 90));

  // ── FASE 1 · fechas locales en nombres de archivo ─────────────────────────
  ok('F1 · Sin fechas UTC en los nombres de archivo', !/toISOString\(\)\.slice\(0, 10\)/.test(html.replace(/var TODAY[\s\S]{0,140}/, '')),
    `${(html.match(/toISOString\(\)\.slice\(0, 10\)/g) || []).length} uso(s), todos dentro de TODAY`);

  // ── FASE 1 · aviso de fotos al restaurar ──────────────────────────────────
  ok('F1 · Aviso de fotos perdidas al restaurar borrador', /fotografía\(s\) de la sección J no se guardan/.test(html));
  ok('F1 · Nota permanente en la sección J', !!$('.photo-persistence-note') && /se conservan mientras la aplicación permanezca abierta/.test(texto($('.photo-persistence-note'))), texto($('.photo-persistence-note')).slice(0, 70));
  ok('F1 · confirm de borrado menciona las fotografías', /las fotografías cargadas en la sección J también se pierden/.test(html));

  // ── FASE 1 · respaldo del estado final ────────────────────────────────────
  const bloqueFinal = html.slice(html.indexOf('Respaldo.marcarFinal();'), html.indexOf('Respaldo.marcarFinal();') + 1400);
  ok('F1 · Tras generar el Word se encola el informe final', /Respaldo\.encolar\(\{/.test(bloqueFinal) && /Respaldo\.enviar\(true\)/.test(bloqueFinal));
  ok('F1 · El envío final no incluye el base64 de las fotos', /j_fotos: rd\.j_fotos\.map/.test(bloqueFinal) && !/url: f\.url/.test(bloqueFinal));

  // ── FASE 1 · service worker ───────────────────────────────────────────────
  const sw = fs.readFileSync(REPO + 'sw.js', 'utf8');
  ok('F1 · sw.js busca en caché ignorando el query string', /ignoreSearch: true/.test(sw));
  ok('F1 · sw.js solo devuelve HTML en navegaciones', /request\.mode === 'navigate'/.test(sw) && /Response\.error\(\)/.test(sw));
  ok('F1 · Caché del service worker incrementada', /senderos-pnlq-v44/.test(sw), (sw.match(/senderos-pnlq-v\d+/) || [])[0]);

  // ── coherencia general ────────────────────────────────────────────────────
  const css = fs.readFileSync(REPO + 'responsive.css', 'utf8');
  const clasesJs = new Set([...html.matchAll(/className: "([a-z0-9\- ]+)"/g)].flatMap((m) => m[1].split(' ')).filter((c) => /^(condition-carousel|trail-accumulated|trail-clear|photo-persistence)/.test(c)));
  const sinEstilo = [...clasesJs].filter((c) => !css.includes('.' + c));
  ok('Toda clase nueva tiene su regla CSS', sinEstilo.length === 0, sinEstilo.join(', ') || `${clasesJs.size} clases`);
  ok('Sin CSS muerto del deslizador anterior', !/condition-slider-scale|condition-slider\b/.test(css));
  ok('CSS con llaves balanceadas', (() => { const t = css.replace(/\/\*[\s\S]*?\*\//g, ''); return (t.match(/{/g) || []).length === (t.match(/}/g) || []).length; })());

  // ── informe ───────────────────────────────────────────────────────────────
  let pasan = 0;
  console.log('');
  for (const r of resultados) {
    if (r.pasa) pasan++;
    console.log(` ${r.pasa ? '[ OK ]' : '[FALLO]'} ${r.nombre}${r.extra ? '\n           ' + r.extra.slice(0, 150) : ''}`);
  }
  console.log(`\n${pasan}/${resultados.length} comprobaciones superadas`);
  if (alertas.length) console.log('alert() emitidos: ' + alertas.length);
  if (errores.length) console.log('\nErrores capturados:\n' + errores.slice(0, 5).join('\n'));
  process.exit(pasan === resultados.length ? 0 : 1);
})();
