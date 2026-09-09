# Auditoría técnica — BTMM · Reporte Mantenimiento Senderos PNLQ

**Sitio:** https://psforestal-rgb.github.io/BTMM-Senderos-PNLQ/
**Repo:** https://github.com/psforestal-rgb/BTMM-Senderos-PNLQ (`main`, último push 2026-09-09 15:49 UTC)
**Versión auditada:** 1.51 · caché SW `senderos-pnlq-v43` · `responsive.css?v=1451`
**Fecha del análisis:** 9 de setiembre de 2026
**Alcance:** `index.html` (11.142 líneas / 1,50 MB), `responsive.css` (5.762 líneas / 112 KB), `sw.js`, `manifest.webmanifest`, `respaldo-config.js`, `respaldo/apps-script/Codigo.gs` (775 líneas), `vendor/`, `assets/`.

---

## 1. Resumen ejecutivo

La herramienta está **muy por encima del promedio** de una app institucional de campo: es una PWA real, funciona sin señal, genera el `.docx` con membrete oficial en el propio navegador, tiene cola de respaldo tolerante a cortes, validación progresiva con mensajes accionables y un nivel de accesibilidad poco común (roles ARIA, `aria-live`, `prefers-reduced-motion`, `prefers-contrast`, objetivos táctiles de 44 px). No encontré **ningún error de sintaxis** (verificado con `node --check` sobre el bundle extraído) ni **ningún riesgo de XSS** (cero `innerHTML`, cero `dangerouslySetInnerHTML`, cero `eval`).

Los problemas reales se concentran en **dos puntos donde se puede perder trabajo de campo** y en **cuatro detalles de robustez** que solo aparecen en condiciones límite (recarga del navegador, texto pegado con caracteres raros, primera apertura sin señal, hoja de cálculo recién instalada). Ninguno exige rehacer la aplicación: todos son arreglos acotados, y los dos más importantes caben en pocas decenas de líneas.

| # | Hallazgo | Severidad | Esfuerzo |
|---|---|---|---|
| 1 | Las fotografías **no se guardan** en el borrador: se pierden al recargar | 🔴 Crítico | Medio |
| 2 | Un `.docx` puede generarse **dañado** si el texto trae caracteres de control | 🟠 Alto | 5 minutos |
| 3 | En una ventana concreta, la app abre **sin estilos** cuando no hay señal | 🟠 Alto | 10 minutos |
| 4 | 606 KB comprimidos por carga; el 62 % son logos que solo usa el Word | 🟠 Alto | Medio |
| 5 | El estado «final» puede **no llegar nunca** a la hoja de cálculo | 🟠 Alto | Bajo |
| 6 | Fallas de espacio en `localStorage` pasan **en silencio** | 🟡 Medio | Bajo |
| 7 | El informe completo se recalcula en cada render y cada 10 s | 🟡 Medio | Medio |
| 8 | Nombres de archivo con fecha **UTC** (madrugada en Costa Rica) | 🟡 Medio | 5 minutos |
| 9 | Apps Script: sin protección contra inyección de fórmulas | 🟡 Medio | Bajo |
| 10 | Apps Script: token por defecto público si se olvida cambiarlo | 🟡 Medio | Bajo |
| 11 | El repo no tiene fuentes JSX ni proceso de build | 🟡 Medio | Alto |
| 12 | Lógica de exportar borrador duplicada en dos componentes | 🟢 Bajo | Bajo |
| 13 | 17 `alert()` / `confirm()` nativos | 🟢 Bajo | Medio |
| 14 | Salto de numeración: no existe la sección **F** | 🟢 Bajo | Decisión |
| 15 | Tres numeraciones de versión independientes y un `<meta>` de caché inerte | 🟢 Bajo | Bajo |
| 16 | Contraste 4,23:1 en el texto «Cargando formulario…» | 🟢 Bajo | 2 minutos |

---

## 2. Hallazgos críticos y altos

### 🔴 1. Las fotografías no sobreviven a una recarga (pérdida de evidencia)

**Dónde.** `index.html:10123-10130` (guardado) y `index.html:6935-6942` (restauración).

El autoguardado **elimina deliberadamente** el contenido de las fotos antes de escribir en `localStorage`:

```js
// Para localStorage: quitar base64 de fotos (puede exceder la cuota del navegador).
// Las fotos se conservan en memoria, en el DOCX y en el JSON exportado.
if (Array.isArray(sections.j_fotos)) {
  sections.j_fotos = sections.j_fotos.map(function (f) {
    return { nombre: f.nombre, desc: f.desc, categoria: f.categoria || '' };
  });
}
```

La decisión técnica es correcta (una foto a 1600 px y calidad 0,82 pesa ~250-400 KB; en base64 son ~1,3× más y la cuota de `localStorage` es de ~5 MB). El problema es lo que pasa del otro lado: el restaurador descarta toda entrada sin `url`…

```js
rrJ('j_fotos', function (saved) {
  if (Array.isArray(saved)) setFotos(saved.filter(function (f) { return f.url; }) ...
```

…y el mensaje que recibe el funcionario es **`✓ Borrador restaurado correctamente.`** (`index.html:10282`). Verifiqué que no hay ningún otro aviso en toda la app sobre este comportamiento (búsqueda de «no se guardan», «las fotos», «vuelva a cargar»: sin resultados), y que no existe `IndexedDB`, `sessionStorage` ni ninguna otra clave donde se persistan las imágenes.

**Por qué importa.** En Android, el navegador mata y recarga pestañas por presión de memoria con total normalidad; en un teléfono de gama media con 12 secciones, mapa SVG y 15 fotos en memoria, es un escenario **esperable, no exótico**. El resultado es el peor posible: se recupera todo el formulario menos lo único que no se puede volver a hacer —la evidencia fotográfica de una jornada que ya terminó— y el sistema dice que todo salió bien.

**Cómo arreglarlo.**

*Solución de fondo (recomendada):* mover las imágenes a **IndexedDB**, que no tiene la cuota de 5 MB (Chrome/Android ofrece cientos de MB o más; Safari ~1 GB) y guarda `Blob` directamente, sin el inflado del base64.

```js
// Al agregar la foto: guardar el Blob en IndexedDB y conservar solo la referencia.
// Estructura sugerida: store 'fotos', clave `${jornadaId}:${fotoId}` → { blob, nombre, desc, categoria }
// En el collector j_fotos: leer los blobs y generar objectURL/base64 solo al armar el DOCX.
// En performSave: persistir en localStorage únicamente { id, nombre, desc, categoria }.
```

*Mitigación inmediata (si no se toca el almacenamiento todavía), tres cambios pequeños:*

1. **Aviso permanente en la sección J**, junto al botón de galería:
   > «Las fotografías se conservan mientras la aplicación permanezca abierta. Antes de cerrarla, genere el Word o exporte el borrador (.json): así la evidencia queda guardada.»
2. **Aviso honesto al restaurar.** En `handleRestoreDraft`, contar las fotos del borrador y decirlo:
   ```js
   var fotosPerdidas = ((data.sections || {}).j_fotos || []).length;
   alert(fotosPerdidas
     ? '✓ Borrador restaurado. Las ' + fotosPerdidas + ' fotografía(s) no se guardan en el borrador local: vuelva a agregarlas.'
     : '✓ Borrador restaurado correctamente.');
   ```
3. **Freno antes de limpiar memoria.** En `handleDiscardDraft` (`index.html:10287`) el `confirm` actual no menciona las fotos; conviene añadirlo al texto.

---

### 🟠 2. Un `.docx` puede generarse dañado e irrecuperable

**Dónde.** `index.html:8151-8153`.

```js
var xmlEscape = function xmlEscape(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
```

El escapado de `& < > "` está bien y se usa de forma consistente en `docxPara`, `docxTable` y `docxImage` (verificado). Falta lo otro: **XML 1.0 prohíbe los caracteres de control C0**. Si un funcionario pega en «Observaciones» o en la descripción de una foto un texto que traiga un salto de página vertical (U+000B), un carácter de campana (U+0007) o cualquier control entre U+0000-U+001F —algo que ocurre al copiar desde WhatsApp, PDF o Word en el teléfono—, el `document.xml` resultante es XML inválido y **Word muestra «el archivo está dañado» y no lo abre**. No hay forma de recuperarlo: el usuario ya cerró la jornada.

**Arreglo (una línea).**

```js
var xmlEscape = function xmlEscape(s) {
  return String(s || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // controles ilegales en XML
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
```

Es el cambio con mejor relación beneficio/costo de toda la auditoría.

---

### 🟠 3. La app puede abrir sin estilos cuando no hay señal

**Dónde.** `sw.js:4` y `sw.js:134-146` frente a `index.html:21`.

El HTML pide el CSS **con query string**:

```html
<link rel="stylesheet" href="./responsive.css?v=1451"/>
<script src="./respaldo-config.js?v=1"></script>
```

Pero la precarga del service worker lista las URLs **sin** query:

```js
const APP_SHELL = [ './', './index.html', './manifest.webmanifest', './responsive.css', ... ];
```

`caches.match()` distingue la query por defecto, así que el manejador `fetch` no encuentra coincidencia y cae en el respaldo genérico, que devuelve **`index.html` para una petición de CSS**:

```js
.catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
```

El navegador rechaza HTML como hoja de estilo → la aplicación queda **funcional pero completamente sin formato**: tarjetas apiladas, sin colores institucionales, botones sin área táctil. En campo, eso hace la herramienta casi inutilizable aunque siga «funcionando».

**Ventana exacta de fallo** (la describo con precisión para no exagerar el riesgo): la primera carga de una página no la intercepta el SW, así que el CSS con query solo entra en la caché en tiempo de ejecución a partir de la **segunda** carga controlada. Si alguien visita el sitio una sola vez, lo instala como app y lo abre por primera vez sin señal, obtiene la versión sin estilos. Con una recarga previa estando en línea, el problema no aparece. Es estrecho, pero es justamente el flujo «lo instalo en la oficina y lo uso en el sendero».

Verifiqué además que **el resto de la precarga es impecable**: las 114 rutas de `APP_SHELL` existen todas en disco y cubren el 100 % de los `assets/`, `icons/` y `vendor/` del repo. Eso importa porque `cache.addAll()` falla **en bloque** si una sola URL devuelve 404, y aquí no pasa.

**Arreglo (dos líneas en `sw.js`).**

```js
.catch(() => caches.match(event.request, { ignoreSearch: true }).then((cached) => {
  if (cached) return cached;
  // Solo devolver el HTML cuando la petición era de navegación.
  if (event.request.mode === 'navigate') return caches.match('./index.html');
  return Response.error();          // mejor un recurso faltante que un CSS falso
}))
```

Complemento opcional: al instalar, precargar también las URLs con query leyendo `?v=` del propio `index.html`, o eliminar el query y dejar que `CACHE_NAME` haga todo el versionado.

---

### 🟠 4. Peso de arranque: 606 KB comprimidos, y el 62 % son logos del membrete

**Medido, no estimado.**

| Recurso | En disco | Transferido |
|---|---|---|
| `index.html` | 1.497.581 B | **620.936 B (606 KB) con gzip** — verificado contra GitHub Pages |
| `responsive.css` | 111.918 B | ~19 KB con gzip |

Dentro de `index.html`, las líneas 100 y 101 contienen dos JPEG en base64 (`image1.jpeg` = 478.059 caracteres, `image2.jpeg` = 420.055) más `image3.png` (25.901): **~924 KB, el 62 % del archivo**. Son los logos de la hoja membretada del DOCX.

Dos consecuencias:

1. **Se descargan y se parsean en cada arranque**, aunque el funcionario nunca llegue a generar el Word. En un gama media con 4G débil son segundos de pantalla en blanco y datos móviles consumidos todos los días.
2. **Los JPEG están sobredimensionados para lo que son.** El `image1.jpeg` incluye metadatos XMP completos de Adobe Illustrator 27.8 **con una miniatura embebida** (se ve `xmp:Thumbnails` en el propio base64). Un logotipo institucional de colores planos no debería pesar 358 KB; reexportado a PNG optimizado o a JPEG sin metadatos debería quedar por debajo de 60-80 KB.

**Arreglo, en dos pasos independientes.**

*Paso A — optimizar las imágenes (sin tocar arquitectura):* decodificar los base64, reexportar los logos (PNG optimizado / `mozjpeg`, sin XMP ni miniatura) y volver a incrustar. Ganancia esperada: 500-700 KB menos en el HTML **y** en cada Word generado.

*Paso B — carga perezosa:* mover `MEMBRETE`/`DOCX_BASE` a un `membrete.js` aparte que se descargue solo al pulsar «Generar Word», y añadirlo a `APP_SHELL` para que siga disponible sin señal.

```js
// En buildDocx, antes de armar el zip:
if (!window.MEMBRETE) {
  await import('./membrete.js');        // o fetch + eval controlado / <script> dinámico
}
```

Con ambos pasos, `index.html` bajaría de 1,50 MB a ~330 KB en disco (~180 KB gzip), y el DOCX de cada informe se alivianaría ~600 KB.

*Nota de contexto:* el bundle **no está minificado** (es salida de Babel legible, con comentarios en español). Eso es una ventaja real para depurar en campo y no lo cambiaría; el peso viene de los datos, no del formato del código.

---

### 🟠 5. El estado «final» puede no llegar nunca a la hoja de cálculo

**Dónde.** `index.html:~230` y `index.html:8616-8620`.

```js
function marcarFinal() { estadoJornada = 'final'; }      // solo cambia la variable
```

Al generar el Word, `buildDocx` llama a `Respaldo.marcarFinal()`, pero **no encola ni envía nada**. El informe con estado `final` solo llega a la hoja si después ocurre otro autoguardado (el intervalo de 10 s o el `debounce` de 1,5 s ante un nuevo input) o si se dispara `beforeunload` al cerrar.

Ese último es el eslabón débil: **`beforeunload` no es fiable en iOS Safari** y en Android se omite cuando el sistema mata el proceso. El escenario típico —generar el Word y cerrar la app de inmediato— puede dejar la jornada registrada como `borrador` en la hoja para siempre, justo el dato que se usa para saber qué informes ya están cerrados.

**Arreglo.** Hacer explícito lo que hoy depende de la suerte:

```js
Respaldo.marcarFinal();
Respaldo.encolar({                        // mismo payload del autoguardado
  app: 'PNLQ-Mantenimiento-Senderos',
  version: '1.0',
  timestamp: new Date().toISOString(),
  context: { sendero: sendero },
  sections: getReportData()               // o reutilizar rd, que ya está calculado
});
Respaldo.enviar(true);                    // forzar intento inmediato
```

Como la huella (`firma()`) incluye el `estado`, el cambio `borrador → final` genera una firma distinta y el reenvío no se descarta como duplicado: el mecanismo ya está preparado para esto, solo falta dispararlo.

---

## 3. Hallazgos medios

### 🟡 6. Las fallas de espacio en `localStorage` no se ven

- `Respaldo.escribir()` (`index.html:157-164`) devuelve `false` si falla y **nadie lo comprueba**: `guardarCola()` ignora el resultado, así que un informe puede quedarse fuera de la cola sin ningún indicio.
- `performSave` (`index.html:10153-10157`) hace `console.warn('AutoSave:', e)` y devuelve `false`. El único reflejo visible es que la etiqueta «Guardado HH:MM» (`index.html:10728`) deja de actualizarse — una señal demasiado sutil en campo.
- La cola admite `MAX_COLA = 20` payloads completos. Cada uno incluye la geometría de los tramos atendidos (coordenadas CRTM05), así que con jornadas largas se puede rozar la cuota, y entonces **falla justo el mecanismo diseñado para no perder datos**.

**Arreglo.** (a) Propagar el fallo: si `escribir` devuelve `false`, mostrar un aviso visible y persistente («No se pudo guardar: almacenamiento lleno. Exporte el borrador .json»); (b) recortar del payload en cola lo que la hoja reconstruye igual (por ejemplo, limitar los puntos de geometría por tramo a los extremos); (c) considerar `navigator.storage.estimate()` para avisar antes de llegar al límite. Bien hecho, en cambio, el aviso de la sección B.1 (`index.html:2388`: «No fue posible guardar los cambios en este navegador.»): es exactamente el patrón que falta en el guardado general.

### 🟡 7. El informe completo se recalcula demasiadas veces

`findBlockingRequirement()` llama a `getReportData()`, que recorre **los 12 colectores** y ejecuta sus funciones (`index.html:10051-10064`). Y se invoca:

- en **cada render** del componente principal (`index.html:10473`, para decidir si el botón «Siguiente» va bloqueado);
- cada **10 s** por el `setInterval` de autoguardado (`index.html:10163`);
- **1,5 s después de cada `input`, `change` o clic** dentro de `.app-content` (`index.html:10171-10179`, listeners en fase de captura sobre `document`);
- en `beforeunload`.

Cada vuelta implica además, dentro de `Respaldo.encolar()`, un `JSON.stringify` del informe completo y un hash carácter por carácter (`firma()`, `index.html:175-179`). Con fotos en memoria y un teléfono de gama media, es trabajo repetido que compite con el teclado y con el mapa.

**Arreglo.** Los bloqueos de navegación solo dependen de cuatro campos (`a_data`, `b_rows`, `d_data.activeProbs`, `e_data.checked`): calcular `nextBlock` con un `useMemo` sobre esos estados concretos elimina la recorrida completa por render. Para el autoguardado, conviene además sustituir la escucha global de `click` sobre `document` por llamadas explícitas tras las acciones que mutan datos.

### 🟡 8. Nombres de archivo con fecha UTC

`index.html:8610`, `8820` y `10208` usan `new Date().toISOString().slice(0, 10)`, que es la fecha **UTC**. Costa Rica está en UTC−6, así que entre las 00:00 y las 05:59 el nombre sale con el día anterior. Afecta a todos los `.json` exportados y al `.docx` cuando `fechaIni` viene vacío.

El proyecto ya tiene la solución escrita: `TODAY` (`index.html:1856-1861`) compensa la zona correctamente con `d.setMinutes(d.getMinutes() - d.getTimezoneOffset())`. Basta con reutilizarlo en esos tres puntos. (El resto de fechas está bien: `fmtDia` usa `T12:00:00` local para evitar el corrimiento al mostrar, y `fmtHoy` construye el `DD/MM/AAAA` con componentes locales.)

### 🟡 9. Apps Script: inyección de fórmulas en la hoja

`texto()` (`Codigo.gs:302-306`) escribe el valor del usuario tal cual, y se vuelca con `setValues()`. Google Sheets **interpreta como fórmula viva** cualquier cadena que empiece por `=`, `+`, `-`, `@`, tab o retorno de carro. Un texto copiado accidentalmente —o uno malintencionado, si el token trasciende— puede dejar en la hoja del parque un `=IMPORTRANGE(...)` o un `=HYPERLINK(...)` que se ejecuta al abrir.

```js
function texto(v) {
  if (v === undefined || v === null) return '';
  var s = Object.prototype.toString.call(v) === '[object Array]' ? v.filter(String).join(', ') : String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;      // el apóstrofo fuerza texto literal
}
```

### 🟡 10. Apps Script: el token por defecto es público

`Codigo.gs:12` trae `var TOKEN = 'CAMBIE-ESTE-TOKEN';` y la validación es `if (TOKEN && p.token !== TOKEN)`. Como la cadena es pública y está en el repo, si quien instala olvida el paso 3 del README, **cualquiera que lea el código puede escribir en la hoja**. El propio `respaldo-config.js` documenta con honestidad que el token no detiene a una persona decidida; aquí se trata de otro riesgo distinto: el olvido.

```js
if (!TOKEN || TOKEN === 'CAMBIE-ESTE-TOKEN') {
  return respuesta({ ok: false, error: 'sin_configurar',
    mensaje: 'Falta definir TOKEN en el script.' });
}
```

*Lo que sí está muy bien en este backend, y conviene no tocar:* `LockService` con espera de 30 s y respuesta `{error:'ocupado'}`; bitácora de cada recepción incluso en excepción; actualización por `jornada_id` con contador de `envios` (nunca duplica); reescritura limpia de las tablas hijas; y sobre todo que el **truncado del JSON original está detectado, marcado y registrado** (`_truncado` → columna `detalle` de `bitacora` y campo `truncado` en la respuesta). Ese es el patrón correcto y contrasta con los silencios del punto 6.

### 🟡 11. El repositorio no contiene las fuentes

`index.html` es **salida de Babel** (`_regenerator`, `_objectSpread`, `_slicedToArray`…) sin minificar. No hay carpeta `src/`, ni `package.json`, ni ningún script de build; `CONTINUIDAD_PERPLEXITY_B1.md` lo confirma: «La aplicación es React compilado y autocontenido dentro de `index.html`; no hay fuentes JSX ni proceso npm». Eso significa que cualquier cambio —incluidos los de esta auditoría— se hace **editando código compilado de 11 mil líneas**.

Funciona, y el archivo de continuidad demuestra que hay un método disciplinado detrás. Pero es el mayor riesgo estructural del proyecto: depende de una sola persona y de una carpeta local (`C:\Users\psfor\OneDrive\Documents\SENDEROS`) que no está versionada.

**Recomendación.** Recuperar los `.jsx` en `src/` y montar un build mínimo con Vite o esbuild (`npm run build` → `index.html` + `membrete.js`). Es una migración de un día y devuelve el proyecto a un mantenimiento normal: diff legibles en GitHub, posibilidad de pruebas, y cualquiera —persona o asistente— puede continuar sin riesgo de romper el bundle.

### 🟡 12-16. Detalle breve

- **12 · Código duplicado.** La exportación del borrador `.json` está escrita dos veces, casi idéntica: `index.html:8805-8825` (dentro de `InformeModal`) y `index.html:10190-10212` (en `App`). Ya divergen en un punto (la segunda incluye `jornada_id`). Extraer una función `descargarBorrador(ctx)` compartida.
- **13 · Diálogos nativos.** 15 `alert()` y 2 `confirm()`. Son bloqueantes, rompen la estética institucional y en iOS se atribuyen a «la página». El proyecto ya tiene modales propios con `role="dialog"` y `aria-modal`: reutilizarlos.
- **14 · Sección F inexistente.** `SCHEMA` (`index.html:1113-1191`) va A, B, C, D, E, **G**, H, I, J, K, L, M: 12 pasos, sin F. Los assets del SW confirman que nunca existió un `ui-f-*`. Si el formato oficial SINAC/ACC contempla una F, el informe queda desalineado con la plantilla; si se retiró a propósito, conviene documentarlo en el README para que nadie lo «corrija» más adelante.
- **15 · Versionado triple y meta inerte.** Conviven `Versión 1.51` (visible), `CACHE_NAME = 'senderos-pnlq-v43'` y `responsive.css?v=1451`. Derivar las tres de una sola constante evita olvidos. Aparte, `<meta http-equiv="Cache-Control" content="no-cache...">` (`index.html:6-8`) **no tiene efecto**: verifiqué que GitHub Pages responde `Cache-Control: max-age=600` y los navegadores ignoran esos meta para la caché HTTP. Da una falsa sensación de control; mejor eliminarlo o sustituirlo por una nota.
- **16 · Contraste.** El texto «Cargando formulario…» usa `#7a756a` sobre `#F4F6F8`: **4,23:1**, por debajo del 4,5:1 que exige WCAG AA para texto normal a 15 px. Oscurecer a `#6E695F` (~5:1) o a `G.muted` `#4B5563` (~7,9:1) lo resuelve.

---

## 4. Lo que está bien hecho (y conviene preservar)

Verificado, no asumido:

- **Seguridad del lado cliente.** Cero `innerHTML`, cero `dangerouslySetInnerHTML`, cero `eval()` en 11.142 líneas. Todo el texto de usuario pasa por el escapado de React. No hay superficie de XSS.
- **Integridad del bundle.** `node --check` sobre el script principal extraído: **sintaxis correcta**.
- **Precarga del service worker completa.** Las 114 entradas de `APP_SHELL` existen todas en disco y cubren el 100 % de `assets/`, `icons/` y `vendor/`. Un solo 404 habría hecho fallar `cache.addAll()` entero y roto el modo offline; aquí no ocurre.
- **Estrategia offline sensata.** *Network-first* con respaldo a caché, `skipWaiting()`, `clients.claim()` y purga de cachés anteriores al activar.
- **Cola de respaldo bien pensada.** Backoff exponencial de 30 s hasta 10 min, deduplicación por huella de contenido que ignora la marca de tiempo, reintentos al recuperar señal (`online`), y `Content-Type: text/plain` para esquivar el *preflight* CORS que Apps Script no atiende — detalle fino y correcto.
- **Tratamiento de fotos.** Reescalado a 1600 px, JPEG q0,82, fondo blanco para transparencias, y *fallback* al original si el navegador no decodifica (HEIC de iPhone). Es exactamente lo que hay que hacer.
- **Mapa.** Captura de puntero para que el arrastre no se corte al salir del SVG, umbral de 4 px para distinguir toque de arrastre, coordenadas CRTM05 con la matriz inversa del SVG y `touch-action` correcto. Comentario incluido sobre el dispositivo de prueba real (Galaxy A52): buena práctica.
- **Accesibilidad.** 43 `aria-label`, `aria-live` en 6 puntos, `role="radiogroup"/"radio"/"dialog"/"status"/"alert"`, `aria-expanded`, `aria-pressed`, `aria-valuetext` en los deslizadores, y en CSS `@media (prefers-reduced-motion: reduce)` y `@media (prefers-contrast: more)` además de 25 reglas con altura táctil mínima de 44 px. Muy por encima del estándar institucional.
- **Validación progresiva.** Cuatro requisitos bloqueantes con mensaje largo, mensaje corto y **selector CSS del campo culpable** para llevar al usuario directamente allí (`findBlockingRequirement`, `index.html:10310-10386`). Y la revisión final (`ClosingReview`) muestra un chequeo de esenciales con estado `ready` por sección.
- **Zona horaria.** `TODAY` compensa el offset correctamente y `fmtDia` ancla a mediodía local para evitar corrimientos de fecha.
- **Documentación.** `README.md`, `respaldo/README.md` con instalación paso a paso, `respaldo/ESQUEMA.md`, y sobre todo `CONTINUIDAD_PERPLEXITY_B1.md`: 24 KB de decisiones por versión, incluyendo qué se eliminó y por qué. Eso es patrimonio del proyecto.
- **Honestidad técnica.** El comentario de `respaldo-config.js` explica sin rodeos que el token no protege contra una persona decidida y que la defensa real es que el script nunca borra. Es la clase de nota que evita falsas expectativas.

*Un apunte de estilo, no un defecto:* `responsive.css` acumula **638 `!important`** en 5.762 líneas (11 %). Es la consecuencia natural de combinar estilos en línea de React con una hoja externa; no rompe nada, pero encarece cada ajuste futuro. Ir retirándolos de a poco, al tocar cada componente, es suficiente.

---

## 5. Plan de acción sugerido

**Fase 1 — Hoy mismo, bajo riesgo, alto impacto (~1 hora).**
1. Filtrar caracteres de control en `xmlEscape` → hallazgo 2.
2. `caches.match(..., { ignoreSearch: true })` + respaldo solo en navegaciones → hallazgo 3.
3. Reutilizar `TODAY` en los tres nombres de archivo → hallazgo 8.
4. Aviso de fotos perdidas al restaurar + nota permanente en la sección J → mitigación del hallazgo 1.
5. Guardar el estado `final` en la hoja tras generar el Word → hallazgo 5.
6. Oscurecer el texto de carga a `#4B5563` → hallazgo 16.

**Fase 2 — Esta semana (~medio día).**
7. Persistir fotos en IndexedDB → solución de fondo del hallazgo 1.
8. Optimizar los dos JPEG del membrete (quitar XMP y miniatura) → parte del hallazgo 4.
9. Avisos visibles cuando falle la escritura en `localStorage` → hallazgo 6.
10. Saneado de fórmulas y rechazo del token por defecto en `Codigo.gs` → hallazgos 9 y 10.

**Fase 3 — Cuando haya aire (~1-2 días).**
11. Separar `MEMBRETE` a un módulo de carga perezosa → resto del hallazgo 4.
12. Memoizar el cálculo de bloqueos → hallazgo 7.
13. Recuperar las fuentes JSX y montar el build → hallazgo 11.
14. Unificar exportación de borrador y sustituir `alert()` por modales propios → hallazgos 12 y 13.
15. Decidir y documentar el salto de la sección F → hallazgo 14.

*Recordatorio del propio método del proyecto:* tras cada cambio, incrementar la versión visible, `CACHE_NAME` y el `?v=` del CSS; hacer commit a `main`; esperar el `pages build and deployment`; y comprobar la URL pública con un parámetro anticaché. Para la Fase 1, crear antes un tag de restauración (`restore-v1.51`).

---

## 6. Metodología y limitaciones

**Cómo se hizo.** Clon del repo en el espacio de trabajo; lectura completa de `sw.js`, `respaldo-config.js`, `manifest.webmanifest` y `Codigo.gs`; análisis dirigido de `index.html` y `responsive.css` por patrones (almacenamiento, red, escape XML, accesibilidad, fechas, validación); extracción del bundle y verificación de sintaxis con Node 20; comprobación de que cada ruta de `APP_SHELL` existe en disco y de que no falta ningún asset; y medición real de la respuesta HTTP de GitHub Pages (cabeceras y bytes transferidos).

**Limitaciones.** El entorno no dispone de navegador *headless*, así que **no ejecuté la aplicación**: los hallazgos provienen de análisis estático y de la respuesta HTTP real del sitio, no de una sesión de prueba. En particular, la ventana de fallo del hallazgo 3 y el impacto en rendimiento del hallazgo 7 están razonados sobre el comportamiento documentado de las API implicadas, no reproducidos en un dispositivo. Si quiere, los verifico con una prueba en navegador antes de tocar nada.

**Nota sobre el hallazgo 1.** Es el único que califico como crítico, y lo hago porque combina tres cosas: probabilidad real en Android, pérdida irreversible (la jornada ya ocurrió) y un mensaje que afirma lo contrario de lo que pasó. Todo lo demás son mejoras.
