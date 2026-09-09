const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/home/user/BTMM-Senderos-PNLQ';
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  if (p === '/apps-script') { res.writeHead(500); return res.end('caido'); }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const est = () => ({
  centro: (document.querySelector('.condition-carousel-item.is-center') || {}).id,
  scrollLeft: document.querySelector('.condition-carousel-viewport').scrollLeft,
  desvio: (() => { const v = document.querySelector('.condition-carousel-viewport'), c = document.querySelector('.condition-carousel-item.is-center');
    const a = v.getBoundingClientRect(), b = c.getBoundingClientRect(); return Math.round((b.left + b.width / 2) - (a.left + a.width / 2)); })()
});
(async () => {
  await new Promise(r => server.listen(8091, r));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });

  console.log('1) Sección L: centrado, tirón y arrastre en cinco anchos');
  for (const W of [375, 390, 430, 768, 1280]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://localhost:8091/index.html');
    await p.waitForSelector('.condition-carousel', { state: 'attached', timeout: 20000 }); await p.waitForTimeout(1300);
    await p.addStyleTag({ content: '#section-panel-L{display:block !important}' });
    await p.locator('.condition-carousel').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    const inicial = await p.evaluate(est);
    const bx = await p.locator('.condition-carousel-viewport').boundingBox();
    const cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2;
    await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx - 40, cy, { steps: 5 }); await p.mouse.move(cx - 80, cy, { steps: 5 }); await p.mouse.up();
    await p.waitForTimeout(700); const trasArrastre = await p.evaluate(est);
    await p.evaluate(() => document.querySelector('.condition-carousel-item.is-center').focus());
    await p.keyboard.press('End'); const sl = (await p.evaluate(est)).scrollLeft; await p.waitForTimeout(700);
    const final = await p.evaluate(est);
    console.log(`   ${String(W).padEnd(5)} centrado inicial=${inicial.desvio}px  arrastre 3→${trasArrastre.centro.slice(-1)}  scrollLeft tras Fin=${sl}  centrado final=${final.desvio}px` + (errs.length ? '  ERRORES:' + errs : ''));
    await ctx.close();
  }

  console.log('\n2) Sección C: sendero completo y limpiar');
  {
    const ctx = await b.newContext({ viewport: { width: 375, height: 900 } });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://localhost:8091/index.html');
    await p.waitForSelector('#section-panel-A', { state: 'attached', timeout: 20000 }); await p.waitForTimeout(1300);
    await p.addStyleTag({ content: '#section-panel-A,#section-panel-C{display:block !important}' });
    await p.evaluate(() => { const x = [...document.querySelectorAll('#section-panel-A button')].find(y => /Los Quetzales/.test(y.textContent)); if (x) x.click(); });
    await p.waitForTimeout(600);
    await p.evaluate(() => { const x = [...document.querySelectorAll('#section-panel-A button')].find(y => /Ojo de Agua/i.test(y.textContent)); if (x) x.click(); });
    await p.waitForTimeout(900);
    const leer = () => { const i = document.querySelector('.trail-accumulated'); const bs = [...document.querySelectorAll('.trail-mode-button')].find(x => /sendero completo/i.test(x.textContent));
      return { indicador: i ? i.textContent : null, fondo: bs ? getComputedStyle(bs).backgroundColor : null, pressed: bs ? bs.getAttribute('aria-pressed') : null, limpiar: !!document.querySelector('.trail-clear-button') }; };
    console.log('   sin selección   :', JSON.stringify(await p.evaluate(leer)));
    await p.evaluate(() => { const x = [...document.querySelectorAll('.trail-mode-button')].find(y => /sendero completo/i.test(y.textContent)); if (x) x.click(); });
    await p.waitForTimeout(800);
    console.log('   sendero completo:', JSON.stringify(await p.evaluate(leer)));
    await p.evaluate(() => document.querySelector('.trail-clear-button').click());
    await p.waitForTimeout(800);
    console.log('   tras limpiar    :', JSON.stringify(await p.evaluate(leer)));
    console.log('   errores:', JSON.stringify(errs));
    await ctx.close();
  }

  console.log('\n3) Service worker: lo que devuelve la caché sin señal');
  {
    const p = await (await b.newContext()).newPage();
    await p.goto('http://localhost:8091/index.html');
    await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForTimeout(2500);
    console.log('   ', JSON.stringify(await p.evaluate(async () => {
      const ks = await caches.keys(); const c = await caches.open(ks[0]);
      const url = 'http://localhost:8091/responsive.css?v=1453';
      const tipo = r => r ? r.headers.get('content-type') : 'NO HAY';
      return { cache: ks[0], exacta: tipo(await c.match(url)), ignoreSearch: tipo(await c.match(url, { ignoreSearch: true })), recursos: (await c.keys()).length };
    })));
    await p.context().close();
  }

  console.log('\n4) Cola de respaldo sin señal tras generar el Word');
  {
    const p = await (await b.newContext()).newPage();
    await p.goto('http://localhost:8091/index.html');
    await p.waitForSelector('#section-panel-A', { state: 'attached', timeout: 20000 }); await p.waitForTimeout(1400);
    await p.evaluate(() => { window.PNLQ_RESPALDO = { activo: true, url: 'http://localhost:8091/apps-script', token: 'x', autoMinutos: 99 };
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true }); });
    for (let i = 1; i <= 4; i++) { await p.evaluate((n) => { Respaldo.encolar({ app: 'a', version: '1.0', timestamp: new Date().toISOString(), context: {}, sections: { a: { n } } }); return Respaldo.enviar(navigator.onLine !== false); }, i); await p.waitForTimeout(500); }
    console.log('   ', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('pnlq_respaldo_cola_v1') || '[]').map(e => ({ intentos: e.intentos })))));
    await p.context().close();
  }
  await b.close(); server.close();
})();
