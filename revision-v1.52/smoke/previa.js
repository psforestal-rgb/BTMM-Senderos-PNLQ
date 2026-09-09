/** Comprueba que la vista previa interactiva funciona de punta a punta. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const archivo = path.resolve(process.cwd(), '..', 'vista-previa-v1.52.html');
const dom = new JSDOM(fs.readFileSync(archivo, 'utf8'), {
  runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://x.example/',
});
const w = dom.window;
const errs = [];
w.addEventListener('error', (e) => errs.push((e.error && e.error.stack) || e.message));
w.console.error = (...a) => errs.push(String(a[0]));

const $ = (s) => w.document.querySelector(s);
const $$ = (s) => [...w.document.querySelectorAll(s)];
const texto = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
const clic = async (el) => { el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); await new Promise((r) => setTimeout(r, 20)); };
const tick = () => new Promise((r) => setTimeout(r, 30));
const res = [];
const ok = (n, c, x = '') => res.push({ n, c: !!c, x: String(x) });

(async () => {
  await tick(); await tick();

  ok('Sin errores de JavaScript', errs.length === 0, errs.slice(0, 2).join(' | '));
  ok('Selector de senderos con los 3 oficiales', $$('#switch button').length === 3, $$('#switch button').map(texto).join(' / '));
  ok('Mapa SVG con secciones dibujadas', $$('polyline[data-seccion]').length === 14, `${$$('polyline[data-seccion]').length} secciones`);
  ok('Nota del mapa con la longitud de sección', /Cada sección ≈ 98 m/.test(texto($('#nota-mapa'))), texto($('#nota-mapa')));
  ok('Indicador arranca en 0 m', texto($('#acum-valor')) === '0 m', texto($('#acum-valor')));
  ok('Botón limpiar oculto sin selección', $('#btn-limpiar').hidden === true);

  await clic($$('polyline[data-seccion]')[0]);
  ok('Tocar una sección acumula distancia', texto($('#acum-valor')) === '98 m', texto($('#acum-valor')));
  await clic($$('polyline[data-seccion]')[1]);
  ok('Segunda sección contigua suma y sigue siendo 1 tramo', texto($('#acum-valor')) === '196 m' && /1 tramo ·/.test(texto($('#acum-detalle'))), texto($('#acum-detalle')));
  ok('Panel de tramos visible con tarjeta', !$('#panel').hidden && $$('.trail-selected-card').length === 1, texto($('.trail-selected-heading')));
  ok('Botón limpiar ya aparece', $('#btn-limpiar').hidden === false);
  ok('Sección marcada en amarillo fluor en el mapa', /#FFEA00/i.test($('#mapa').innerHTML));

  await clic($$('polyline[data-seccion]')[4]);
  ok('Sección no contigua abre un segundo tramo', /2 tramos/.test(texto($('#acum-detalle'))) && $$('.trail-selected-card').length === 2, texto($('#acum-detalle')));

  await clic($('#btn-limpiar'));
  ok('Limpiar selección vuelve a 0 m', texto($('#acum-valor')) === '0 m' && $('#btn-limpiar').hidden === true && $('#panel').hidden === true);

  await clic($('#btn-completo'));
  ok('Sendero completo: distancia total', texto($('#acum-valor')) === '1373 m', texto($('#acum-valor')));
  ok('Sendero completo: 100% y 1 tramo', /1 tramo · 100% de los 1373 m/.test(texto($('#acum-detalle'))), texto($('#acum-detalle')));
  ok('Botón completo en estado activo', $('#btn-completo').style.background === 'rgb(255, 234, 0)' && $('#btn-completo').getAttribute('aria-pressed') === 'true', $('#btn-completo').style.background);
  ok('Texto del botón activo', /Sendero completo seleccionado/.test($('#btn-completo').textContent));
  await clic($('#btn-completo'));
  ok('Segundo clic desactiva el sendero completo', texto($('#acum-valor')) === '0 m' && $('#btn-completo').getAttribute('aria-pressed') === 'false');

  await clic($$('#switch button')[1]);
  ok('Cambiar de sendero reinicia la selección y recalcula', texto($('#acum-valor')) === '0 m' && /secciones/.test(texto($('#nota-mapa'))), texto($('#nota-mapa')));
  await clic($('#btn-completo'));
  ok('Ojo de Agua: 1503 m al seleccionar completo', texto($('#acum-valor')) === '1503 m', texto($('#acum-valor')));

  // ── carrusel ──
  ok('Carrusel con 5 caras y sprite original', $$('.condition-carousel-item').length === 5 && $$('.condition-danta-face').every((f) => /% center/.test(f.getAttribute('style'))));
  ok('Centro inicial en la posición 3', $$('.condition-carousel-item').findIndex((c) => c.classList.contains('is-center')) === 2);
  ok('Etiqueta inicial sin calificar', /Toque una cara/.test(texto($('#etiqueta'))), texto($('#etiqueta')));
  await clic($$('.condition-carousel-arrow')[1]);
  ok('Flecha derecha → Bueno', /Bueno · 4 de 5/.test(texto($('#etiqueta'))), texto($('#etiqueta')));
  ok('La pista se desplaza con el centro', /translateX\(calc\(-3 \* var\(--condition-slot\)\)\)/.test($('#pista').style.transform), $('#pista').style.transform);
  await clic($$('.condition-carousel-item')[0]);
  ok('Toque en cara lateral la centra', /Muy malo · 1 de 5/.test(texto($('#etiqueta'))) && $$('.condition-carousel-item')[0].classList.contains('is-chosen'), texto($('#etiqueta')));
  $('#condition-face-1').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
  await tick();
  ok('Tecla End → Excelente', /Excelente · 5 de 5/.test(texto($('#etiqueta'))), texto($('#etiqueta')));
  ok('Flecha derecha deshabilitada en el máximo', $$('.condition-carousel-arrow')[1].disabled === true);
  const vp = $('#visor');
  vp.dispatchEvent(new w.PointerEvent('pointerdown', { bubbles: true, clientX: 300, pointerId: 3, isPrimary: true }));
  await tick();
  vp.dispatchEvent(new w.PointerEvent('pointerup', { bubbles: true, clientX: 380, pointerId: 3, isPrimary: true }));
  await tick();
  ok('Arrastre a la derecha retrocede una posición', /Bueno · 4 de 5/.test(texto($('#etiqueta'))), texto($('#etiqueta')));

  let pasan = 0;
  console.log('');
  for (const r of res) { if (r.c) pasan++; console.log(` ${r.c ? '[ OK ]' : '[FALLO]'} ${r.n}${r.x ? '\n           ' + r.x.slice(0, 130) : ''}`); }
  console.log(`\n${pasan}/${res.length} comprobaciones superadas en la vista previa`);
  if (errs.length) console.log('ERRORES:\n' + errs.slice(0, 4).join('\n'));
  process.exit(pasan === res.length ? 0 : 1);
})();
