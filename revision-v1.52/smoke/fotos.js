const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/home/user/BTMM-Senderos-PNLQ';
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const galeria = () => ({
  fichas: document.querySelectorAll('.photo-module img').length,
  conImagen: [...document.querySelectorAll('.photo-module img')].filter(i => (i.src || '').startsWith('data:image')).length,
  nombres: [...document.querySelectorAll('.photo-module img')].map(i => i.alt || '').slice(0, 4)
});
const enAlmacen = () => new Promise(r => {
  const pet = indexedDB.open('pnlq_fotos_v1', 1);
  pet.onsuccess = () => { const d = pet.result;
    if (!d.objectStoreNames.contains('fotos')) { d.close(); return r({ registros: 0, jornadas: [] }); }
    const cur = d.transaction('fotos', 'readonly').objectStore('fotos').openCursor();
    const filas = [];
    cur.onsuccess = () => { const c = cur.result; if (!c) { d.close(); return r({ registros: filas.length, jornadas: [...new Set(filas.map(f => f.j))], bytes: filas.reduce((a, b) => a + b.bytes, 0) }); }
      filas.push({ j: c.value.jornada_id, id: c.value.foto_id, bytes: c.value.bytes }); c.continue(); };
  };
  pet.onerror = () => r({ error: String(pet.error) });
});

(async () => {
  await new Promise(r => server.listen(8095, r));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  const alertas = []; page.on('dialog', async d => { alertas.push(d.message()); await d.accept(); });

  const abrir = async () => {
    await page.goto('http://localhost:8095/index.html');
    await page.waitForSelector('#section-panel-J', { state: 'attached', timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.addStyleTag({ content: '#section-panel-J{display:block !important}' });
  };
  await abrir();
  console.log('jornada:', await page.evaluate(() => Respaldo.jornadaId()));
  console.log('IndexedDB disponible:', await page.evaluate(() => FotoStore.disponible()));

  // 1) cargar dos fotos
  await page.setInputFiles('#section-panel-J input[type=file]', ['/tmp/foto1.png', '/tmp/foto2.png']);
  await page.waitForTimeout(1500);
  console.log('\n1) tras cargar dos fotos');
  console.log('   galería :', JSON.stringify(await page.evaluate(galeria)));
  console.log('   almacén :', JSON.stringify(await page.evaluate(enAlmacen)));

  // describir una para comprobar que los datos también sobreviven
  const areas = await page.locator('#section-panel-J textarea, #section-panel-J input[type=text]').all();
  if (areas.length) { await areas[0].fill('Cárcava en la estación 300'); await page.waitForTimeout(200); }

  // forzar el autoguardado y ver qué queda en localStorage
  await page.evaluate(() => document.dispatchEvent(new Event('input', { bubbles: true })));
  await page.waitForTimeout(2200);
  console.log('   borrador en localStorage:', JSON.stringify(await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('pnlq_form_draft') || '{}');
    const f = (d.sections || {}).j_fotos || [];
    return { fotos: f.length, conId: f.filter(x => x.id).length, conBase64: f.filter(x => x.url).length, tamanoKB: Math.round((localStorage.getItem('pnlq_form_draft') || '').length / 1024) };
  })));

  // 2) recargar: la prueba de fuego
  await abrir();
  await page.waitForTimeout(1500);
  console.log('\n2) tras RECARGAR la aplicación');
  console.log('   galería :', JSON.stringify(await page.evaluate(galeria)));
  const banner = await page.locator('button', { hasText: /Restaurar/i }).first();
  if (await banner.count()) {
    await banner.click(); await page.waitForTimeout(2000);
    console.log('   tras pulsar restaurar:', JSON.stringify(await page.evaluate(galeria)));
  }
  console.log('   alertas :', JSON.stringify(alertas));
  console.log('   almacén :', JSON.stringify(await page.evaluate(enAlmacen)));
  console.log('   errores JS:', JSON.stringify(errs));
  await b.close(); server.close();
})();
