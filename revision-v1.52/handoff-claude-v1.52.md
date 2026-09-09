# Handoff — BTMM · Reporte Mantenimiento Senderos PNLQ (v1.52)

> Copiá y pegá este documento completo como primer mensaje. Está escrito para que puedas tomar el
> relevo sin contexto previo. Al final está lo que se te pide concretamente.

---

## 1. Tu rol y tu misión

Tomás el relevo temporal de un trabajo ya avanzado. Otro asistente hizo una auditoría técnica del
repositorio y aplicó un primer lote de correcciones más dos cambios de interfaz pedidos por el dueño
del proyecto. Todo está en una rama sin publicar.

Tu misión, en este orden:

1. **Formarte una opinión independiente.** No des por bueno lo que está hecho: leelo, criticalo y
   decí dónde discrepás, qué riesgo ves y qué habrías hecho distinto. Se busca una segunda opinión
   real, no una validación.
2. **Consultar antes de suponer.** Si algo es ambiguo, si un cambio parece contradecir la intención
   del proyecto, o si vas a tocar algo que afecte datos ya guardados por los usuarios: **preguntá
   primero**. Es preferible una pregunta a tiempo que un cambio silencioso que rompa un borrador de
   campo.
3. **Proponer el siguiente paso**, no ejecutarlo de entrada.

El dueño del proyecto es funcionario del parque, no desarrollador: explicá en lenguaje llano y señalá
siempre el impacto en el trabajo de campo.

---

## 2. Qué es la herramienta

**Reporte Mantenimiento Senderos — PNLQ** (MINAE · SINAC · Área de Conservación Central · Bloque
Tapantí Macizo de la Muerte · Parque Nacional Los Quetzales, Costa Rica).

Es una **PWA de campo**: un formulario guiado de 12 pasos (A–M, **no existe la sección F**) con el que
un funcionario documenta una jornada de mantenimiento de senderos y genera el informe oficial en
**Word (.docx)** desde el propio navegador, con membrete institucional, mapa del tramo intervenido y
evidencia fotográfica incrustada.

- **Sitio:** https://psforestal-rgb.github.io/BTMM-Senderos-PNLQ/
- **Repo:** https://github.com/psforestal-rgb/BTMM-Senderos-PNLQ (rama de publicación: `main`)
- **Uso real:** teléfonos Android de gama media, en sendero, **frecuentemente sin señal**. La
  tolerancia a cortes y el modo offline no son un extra: son el requisito central.
- **Flujo:** A datos de la jornada → B equipo y horario → C tramos atendidos (mapa) → D problemas
  observados → E trabajo realizado → G seguridad y visitantes → H recursos → I resultados →
  J evidencia fotográfica → K pendientes y seguimiento → L conclusión → M responsable y oficio.

### Forma técnica (importante: no es un proyecto convencional)

- Sitio **estático publicado con GitHub Pages desde la raíz** del repo. No hay backend propio.
- **`index.html` es React 18 compilado por Babel y autocontenido**: ~11.300 líneas, 1,5 MB, **sin
  minificar**. No hay carpeta `src/`, no hay `package.json`, no hay JSX ni proceso de build. Se edita
  el bundle compilado directamente. Los helpers de Babel (`_objectSpread`, `_slicedToArray`,
  `_regenerator`…) están al principio del archivo y se usan en todo el código.
- `vendor/` trae `react.production.min.js`, `react-dom.production.min.js` y `jszip.min.js` locales
  (sin CDN: tiene que funcionar offline).
- El **.docx se genera en el cliente**: el membrete completo (XML de Word + logos en base64) vive en
  un objeto dentro de `index.html`, y hay funciones `docxPara`, `docxHeading`, `docxTable`,
  `docxImage` y `xmlEscape` que arman el `document.xml`, empaquetado con JSZip.
- `responsive.css` (~5.900 líneas) lleva los estilos; una parte de los estilos también va **inline en
  los `React.createElement`**, así que hay que buscar en los dos lados.
- `sw.js` es el service worker: estrategia *network-first* con precarga de un `APP_SHELL` de 114
  recursos. `manifest.webmanifest` hace la app instalable (`es-CR`, `standalone`).
- **Respaldo opcional a Google Sheets** vía Apps Script (`respaldo/apps-script/Codigo.gs`, 16 pestañas,
  cola local con backoff exponencial). Viene **desactivado** en `respaldo-config.js` hasta que el
  parque lo instale. El cliente vive en un módulo `Respaldo` al principio de `index.html`.
- El estado del formulario se persiste en **`localStorage`** (claves `pnlq_form_draft`,
  `pnlq_form_draft_ts`, `senderos_pnlq_b1_memory_v1`, `pnlq_jornada_id_v1`, `pnlq_respaldo_cola_v1`).
  Cada sección registra un *collector* y un *restorer* en un contexto común (`registerCollector` /
  `registerRestorer`), y `getReportData()` los recorre todos.
- `CONTINUIDAD_PERPLEXITY_B1.md` documenta las decisiones versión por versión. **Es la memoria del
  proyecto: si cambiás algo, actualizala con el mismo formato.**

---

## 3. Estado actual del repositorio

| | |
|---|---|
| Rama de trabajo | `mejoras-v1.52` (**local, nunca se hizo push**) |
| Commits sobre la base | 2 |
| Tag de restauración | `restore-v1.51` |
| Versión visible en la app | `1.52` (antes `1.51`) |
| `CACHE_NAME` del service worker | `senderos-pnlq-v44` (antes `v43`) |
| Cache-busting del CSS | `responsive.css?v=1452` (antes `?v=1451`) |
| Árbol de trabajo | limpio, sin cambios sin confirmar |

⚠️ **La rama no está en GitHub.** El trabajo se transfirió como parche: **`v1.52.patch`** (41 KB,
4 archivos, +437/−93). Aplica limpio sobre `restore-v1.51` (`git apply --check` verificado). Si no
tenés el parche a mano, pedilo antes de intentar reconstruir los cambios: la sección 4 los describe,
pero no al nivel de detalle necesario para reimplementarlos a ciegas.

Para publicar (solo con aprobación explícita del dueño):

```bash
git checkout main && git merge mejoras-v1.52 && git push origin main
# esperar el workflow "pages build and deployment" y comprobar la URL con un parámetro anticaché
```

---

## 4. Qué se hizo y por qué

### 4.1 La auditoría previa

Se auditaron `index.html`, `responsive.css`, `sw.js`, `manifest.webmanifest`, `respaldo-config.js` y
`Codigo.gs`. Salieron **16 hallazgos**: 1 crítico, 4 altos, 6 medios, 5 bajos. El informe completo
está en `auditoria-btmm-senderos-pnlq.md`.

El hallazgo crítico, **que sigue abierto**, es el que deberías mirar primero:

> **Las fotografías no se persisten.** En `performSave` se retira el base64 de `sections.j_fotos`
> antes de escribir en `localStorage` (decisión correcta: la cuota es ~5 MB y una foto a 1600 px son
> ~250-400 KB, ~1,3× en base64). Pero el restaurador de `j_fotos` filtra por `f.url`, así que al
> recargar la app **todas las fotos desaparecen** y el mensaje dice «✓ Borrador restaurado
> correctamente». En Android el navegador mata y recarga pestañas por presión de memoria: es un
> escenario esperable, y se pierde justamente lo irrepetible (la evidencia de una jornada terminada).
>
> En v1.52 solo se **mitigó con avisos**, no se resolvió. La solución de fondo es IndexedDB
> (guardando `Blob`, sin el inflado del base64, con clave `jornada_id + foto_id`).

Los otros hallazgos relevantes que **quedaron pendientes**:

- **Peso de arranque:** 606 KB gzip por carga (medido contra GitHub Pages). Las líneas ~100-101 de
  `index.html` son dos JPEG del membrete en base64 (~924 KB, el **62 % del archivo**) que solo se
  necesitan al generar el Word. El `image1.jpeg` arrastra metadatos XMP de Illustrator **con
  miniatura embebida**: 358 KB para un logo de colores planos. Se puede optimizar y/o mover a un
  módulo de carga perezosa.
- **Fallas silenciosas de `localStorage`:** `Respaldo.escribir()` devuelve `false` y nadie lo
  comprueba; `performSave` solo hace `console.warn`. La cola admite 20 payloads con geometría de
  tramos, así que puede rozar la cuota justo cuando más importa.
- **Rendimiento:** `findBlockingRequirement` llama a `getReportData()` (los 12 colectores) **en cada
  render**, y además corre cada 10 s y 1,5 s después de cada input o clic. `Respaldo.encolar` hace un
  `JSON.stringify` completo y un hash carácter por carácter en cada vuelta.
- **Apps Script:** `texto()` escribe el input del usuario tal cual con `setValues()`, así que una
  cadena que empiece con `=`, `+`, `-`, `@` se convierte en **fórmula viva** en la hoja. Y el `TOKEN`
  por defecto es `'CAMBIE-ESTE-TOKEN'`, público en el repo: si quien instala olvida cambiarlo,
  cualquiera puede escribir en la hoja del parque.
- **Mantenibilidad:** la exportación del borrador `.json` está duplicada (en `InformeModal` y en
  `App`) y ya divergen; hay 17 `alert()`/`confirm()` nativos; y el repo no tiene fuentes JSX ni build,
  así que todo se edita sobre código compilado.
- **Numeración:** no existe la sección **F**. Parece intencional (no hay assets `ui-f-*`), pero nadie
  lo documentó. Conviene confirmarlo con el dueño y dejarlo escrito.

### 4.2 Fase 1 aplicada en v1.52 (seis correcciones)

1. **`xmlEscape` filtra caracteres de control C0** (`U+0000-U+0008`, `U+000B`, `U+000C`,
   `U+000E-U+001F`, `U+007F`) antes de escapar. XML 1.0 los prohíbe: un texto pegado desde WhatsApp o
   un PDF con uno de ellos generaba un `document.xml` inválido y Word respondía «archivo dañado» sin
   recuperación posible. Era el arreglo más barato de toda la auditoría.
2. **`sw.js`**: `caches.match(event.request, { ignoreSearch: true })` y el fallback a `index.html`
   solo cuando `event.request.mode === 'navigate'`; en el resto, `Response.error()`. Antes, el HTML
   pedía `responsive.css?v=1451` pero el `APP_SHELL` precargaba `./responsive.css` **sin query**: si
   alguien visitaba el sitio una sola vez, lo instalaba y lo abría sin señal, el CSS no coincidía y el
   fallback devolvía HTML para una petición de CSS → app funcional pero **sin estilos**.
3. **Fechas locales:** los nombres de archivo del `.docx` y de los dos exportadores `.json` usaban
   `new Date().toISOString().slice(0, 10)`, que es **UTC**. Costa Rica es UTC−6: entre las 00:00 y las
   05:59 el archivo salía con el día anterior. Ahora usan `TODAY`, que ya compensaba la zona desde
   antes. (El resto del manejo de fechas estaba bien: `fmtDia` ancla a mediodía local.)
4. **Estado `final` en la hoja:** `Respaldo.marcarFinal()` solo cambiaba una variable interna, así que
   el estado llegaba a Google Sheets únicamente si había otro autoguardado después o si se disparaba
   `beforeunload` —poco fiable en iOS y cuando Android descarta el proceso—. Ahora `buildDocx` hace
   `encolar()` + `enviar(true)` tras generar el Word. **Ojo:** el payload se encola **sin** el base64
   de las fotos, igual que el autoguardado, para no reventar la cola.
5. **Avisos sobre fotografías:** el restaurador cuenta las fotos que vienen sin imagen y lo dice
   («Las N fotografía(s) de la sección J no se guardan en este navegador…»), se agregó una nota
   permanente en la galería de J (`.photo-persistence-note`) y el `confirm` de «Nuevo informe»
   menciona que las fotos también se pierden.
6. **Contraste:** el texto «Cargando formulario…» pasó de `#7a756a` a `#4B5563` sobre `#F4F6F8`:
   de 4,23:1 a 6,97:1 (WCAG AA).

Además se retiró el CSS muerto del deslizador anterior (`.condition-slider-scale`,
`.section-body .condition-slider`, `.condition-danta-face.is-inline`).

### 4.3 Cambio pedido 1 — Sección C (tramos atendidos)

Lo pidió el dueño del proyecto:

- **Botón «Agregar sendero completo» con estado activo.** Pasa de azul `G.mid` (`#002E7A`) a **amarillo
  fluor `#FFEA00`** con borde `#B79E00`, texto `G.dark`, halo `rgba(183,158,0,.22)` y
  `aria-pressed="true"`; clase `is-active`. Se eligió ese amarillo a propósito: **ya es el color del
  modo secciones y del resaltado de tramos en el mapa**, así que en toda la app el amarillo fluor
  significa «selección activa».
- **Botón «Limpiar selección»** (`.trail-clear-button`, rojo `#B42318` sobre `#FFF5F4`), visible solo
  cuando hay algo seleccionado. Llama a `handleLimpiarSeleccion`, que vacía `tramos`, sale del modo
  secciones, cancela la captura manual y reinicia `activeTramoGroup` a 1. **No pide confirmación**
  (decisión discutible: si te parece que debería confirmar cuando hay tramos capturados a mano con
  coordenadas GPS, plantealo).
- **Indicador «Distancia acumulada»** (`.trail-accumulated`, `role="status"`, `aria-live="polite"`),
  visible desde que se elige el sendero y actualizado en vivo. Muestra metros, número de tramos y
  porcentaje respecto de `activeTrail.total_m`. Reutiliza el `totalM` que ya alimentaba
  `updCalcC({ totalMetros })`, así que también refleja tramos manuales y sendero completo. Sin
  selección muestra una guía en vez de ocultarse.
- **Detalle que se corrigió sobre la marcha:** el conteo de tramos usaba `tramos.length`, que cuenta
  **una entrada por sección**, así que dos secciones contiguas decían «2 tramos» mientras el panel de
  abajo (que agrupa) decía «1 tramo». Se agregó el derivado `totalTramos =
  selectedSectionGroups.length + tramos manuales` y ahora ambos textos coinciden.

### 4.4 Cambio pedido 2 — Sección L (condición final)

El pedido original era sustituir las caras de danta por elementos de un archivo vectorial. **El dueño
lo corrigió sobre la marcha: «no modifiques las imágenes de la escala gráfica, solo el método de
selección».** Así que:

- **Las imágenes NO se tocaron.** Sigue el mismo sprite `assets/icons-ui/l-danta-expresiones.webp`
  (33 KB, 5 caras en fila) con las mismas posiciones `0% / 25% / 50% / 75% / 100%` vía
  `background-position`.
- Fuera la escala estática de cinco caras y el `input[type=range]`. Entra un **carrusel giratorio**
  (`.condition-carousel`): la cara elegida va **grande al centro** (84 px; 68 px en móvil) y las demás
  quedan a los lados en tamaño decreciente (54 px y 40 px; 46 px y 34 px en móvil) con opacidad 0,85
  y 0,5. Ranura de `--condition-slot: 92px` (74 px en móvil).
- El giro es un `translateX(calc(N * var(--condition-slot)))` sobre la pista, con relleno lateral
  `calc(50% - var(--condition-slot) / 2)` para llevar la primera cara al centro. Transición de
  0,34 s con `cubic-bezier(.22,.61,.36,1)`, anulada bajo `prefers-reduced-motion: reduce`.
- **Cuatro formas de seleccionar:** tocar cualquier cara, flechas ‹ › a los lados, arrastre horizontal
  (umbral 28 px, con `setPointerCapture`) y teclado.
- **Accesibilidad:** contenedor `role="radiogroup"`, cada cara `role="radio"` con `aria-checked`,
  `id="condition-face-N"` y **tabindex itinerante** (solo el centro es alcanzable con Tab). ←/→/↑/↓,
  `Home` y `End` mueven la selección **y el foco** (`moveCondition` hace `focus()`); por eso `onClick`
  llama a `moveCondition` y no a `setConditionRating` a secas. Las flechas ‹ › son `aria-hidden` con
  `tabindex="-1"` para no duplicar controles en la tabulación.
- **Etiqueta cualitativa bajo la cara central** con `aria-live="polite"`: «Excelente · 5 de 5». Sin
  calificar: «Toque una cara o gire con las flechas» y ninguna cara figura como elegida (igual que
  antes: el centro por defecto es 3 pero no puntúa hasta que el usuario elige).
- **El modelo de datos NO cambia:** `condFinal` y `condFinalRating` siguen saliendo del mismo
  `conditionRating` (1-5). Colector, restaurador, vista previa, DOCX y borradores antiguos funcionan
  igual, incluida la migración por etiqueta de texto.

---

## 5. Cómo verificar (ya hay arneses armados)

No hay navegador *headless* en el entorno donde se hizo el trabajo, así que **la validación fue con
jsdom cargando la aplicación real** y el React/JSZip de `vendor/`. Los arneses están en `smoke/`:

```bash
cd smoke && npm install jsdom      # una sola vez
node prueba.js                     # 63/63 comprobaciones sobre la aplicación real
node previa.js                     # 29/29 sobre la vista previa interactiva
```

`prueba.js` cubre: arranque sin errores, las 12 secciones en el DOM, versión visible, sección C
completa (indicador en 0 m; sendero completo → 1373 m y «1 tramo · 100% de los 1373 m»; botón de
`rgb(0,46,122)` a `rgb(255,234,0)` con `aria-pressed`; limpiar selección; dos secciones contiguas →
98 m → 196 m y **1 tramo**, igual que el panel), sección L completa (5 caras con las 5 posiciones del
sprite distintas, radiogroup, tabindex itinerante, transform, flechas, teclado, `Home`/`End`,
arrastre, extremos deshabilitados, deslizador antiguo ausente), las seis correcciones de la Fase 1 y
coherencia JS↔CSS (12 clases nuevas con su regla, sin CSS muerto, llaves balanceadas 883/883).

**Dos trampas del entorno que ya están resueltas en los arneses, por si los tocás:**

1. En jsdom **no hay `MessageChannel`**, así que React 18 vuelca el estado en un *macrotask*: hay que
   esperar un tick tras cada interacción antes de afirmar. No es un comportamiento de la app.
2. El sandbox reescribe las rutas absolutas literales dentro de los archivos de script. Los arneses
   resuelven rutas con `process.cwd()`.

Además hay **`vista-previa-v1.52.html`**: una réplica interactiva y autónoma de las dos piezas
cambiadas, armada con el CSS real de `responsive.css`, el sprite original incrustado en base64 y la
geometría real de los tres senderos extraída de `TRAIL_DATA`. Sirve para ver el comportamiento sin
desplegar. **Es un mock fiel en lógica y estilos, no la aplicación.**

### Punto ciego declarado (importante)

**Nadie miró la interfaz renderizada en un navegador real.** La lógica, el DOM, las clases, los
estilos inline y los atributos ARIA están verificados automáticamente; el **aspecto visual no**: los
tamaños del carrusel, la sensación del giro, el contraste del amarillo sobre el fondo de la tarjeta,
el comportamiento del indicador de distancia en una pantalla de 375 px. Eso hay que mirarlo en un
teléfono antes de publicar. El proyecto venía probando en 375, 390, 430, 768 y 1280 px con
Chrome/Playwright: convendría repetir esa pasada.

---

## 6. Reglas del proyecto que no se deben romper

Salen de `CONTINUIDAD_PERPLEXITY_B1.md` (sección «Precauciones») y del diseño vigente:

- **No convertir `index.html` en un proyecto npm durante esta etapa.** (Es una restricción deliberada
  del dueño. Si creés que hay que levantarla, **proponelo con argumentos**, no lo hagas por tu cuenta.)
- **No eliminar `b_rows`, B.2 ni B.3 de la generación DOCX**: aunque B.2 y B.3 no se renderizan en la
  interfaz, siguen calculándose internamente y van en el informe final.
- **Mantener una sola fecha y un solo horario general por formulario** (jornada única).
- Al editar el bundle compilado: **cuidado con el balance de paréntesis** en las cadenas de
  `React.createElement`. Un bloque JSX compilado suele cerrar varios niveles en un solo `)),`.
  Verificá siempre con `node --check` sobre el script extraído antes de dar por bueno un cambio.
- Los identificadores de ilustración **no se renombran** aunque cambie el rótulo (p. ej.
  `d01-vegetacion-invasora` ahora se llama «Crecimiento vegetal»): el nombre está en el `APP_SHELL`
  del service worker y en la migración de borradores antiguos.
- **Compatibilidad hacia atrás con borradores ya guardados** es un requisito duro: hay funcionarios
  con borradores en `localStorage` y archivos `.json` exportados. Todo cambio de estructura necesita
  migración en el *restorer* correspondiente.

### Procedimiento de publicación del proyecto

1. Validar sintaxis del script principal y `git diff --check`.
2. Si hay cambios: incrementar **la versión visible** (`['Versión', '1.52']` en `index.html`),
   **`CACHE_NAME`** en `sw.js` y **el `?v=`** de `responsive.css` en el `<link>`. Los tres a la vez.
3. Actualizar `CONTINUIDAD_PERPLEXITY_B1.md` con el formato de las versiones anteriores.
4. Commit y push a `main`; esperar `pages build and deployment`; comprobar la URL pública con un
   parámetro anticaché.
5. Dejar un tag de restauración antes de empezar (ahora existe `restore-v1.51`).

---

## 7. Lo que sigue abierto, en orden de prioridad

**Fase 2 (lo que más protege el trabajo de campo):**

1. **Persistir fotografías en IndexedDB** — el único hallazgo crítico. Guardar `Blob` (no base64),
   clave por `jornada_id` + id de foto; en `localStorage` dejar solo metadatos. Incluye: qué pasa al
   cambiar de jornada, al importar un `.json` con fotos, y al limpiar memoria.
2. **Optimizar los dos JPEG del membrete** y/o moverlos a un módulo de carga perezosa: son ~924 KB del
   HTML y viajan en cada Word generado.
3. **Avisos visibles cuando `localStorage` rechaza una escritura** (autoguardado y cola de respaldo).
4. **Apps Script:** saneado de inyección de fórmulas en `texto()` y rechazo explícito si `TOKEN` sigue
   siendo el placeholder.

**Fase 3:**

5. Memoizar el cálculo de bloqueos (`findBlockingRequirement` → solo los 4 campos que usa).
6. Unificar la exportación de borrador duplicada.
7. Sustituir `alert()`/`confirm()` por los modales propios que la app ya tiene.
8. Decidir y documentar el salto de la sección F.
9. Discutir si vale la pena recuperar las fuentes JSX y montar un build mínimo (Vite/esbuild). Es el
   mayor riesgo estructural del proyecto, pero choca con la precaución explícita del punto 6.

---

## 8. Lo que se te pide ahora

1. **Leé el parche `v1.52.patch` y el código tocado**, y después **`CONTINUIDAD_PERPLEXITY_B1.md`**
   para entender las decisiones históricas.
2. **Emití tu análisis independiente**, explícitamente separado en:
   - qué está bien y no tocarías;
   - qué te parece **incorrecto o riesgoso** (con archivo y fragmento, no en general);
   - qué **habrías hecho distinto** y por qué, distinguiendo gusto personal de defecto real;
   - qué **regresión** podría provocar cada cambio en borradores ya guardados, en el DOCX generado,
     en el modo offline o en el respaldo a Google Sheets.
3. **Prestá atención especial a estos cinco puntos**, que son donde hay más riesgo de que otra mirada
   encuentre algo:
   - el `transform: translateX(calc(N * var(--condition-slot)))` del carrusel y su relleno lateral
     `calc(50% - slot/2)`: ¿se comporta igual en navegadores viejos de Android y con `zoom` o
     `font-size` grande del sistema?
   - el arrastre del carrusel con umbral de 28 px: ¿puede interferir con el scroll vertical de la
     página o con el gesto de retroceso de Android?
   - `totalTramos` en la sección C: ¿es correcto también cuando hay **tramos manuales mezclados** con
     secciones automáticas, y cuando el sendero completo convive con selección previa?
   - el `encolar()` tras generar el Word: ¿puede duplicar o sobrescribir un envío en la hoja, y qué
     pasa si el usuario genera el Word dos veces?
   - el `ignoreSearch: true` del service worker: ¿puede servir un CSS viejo tras un despliegue?
4. **Hacé las preguntas que necesites antes de modificar nada.** En particular, si algo de lo ya
   aplicado te parece mal, decilo y esperá confirmación: el dueño puede preferir ajustar un detalle a
   rehacer el cambio.
5. **Cerrá con una propuesta concreta de siguiente paso** (idealmente la Fase 2 ítem 1, IndexedDB),
   con el alcance acotado, los riesgos y qué habría que probar.

No publiques nada en `main`. No hagas push. No borres el tag `restore-v1.51`.
