# Material de revisión de la versión 1.52

Esta carpeta guarda el paquete de relevo y los arneses de prueba de la versión 1.52.
**No forma parte del sitio publicado.** Antes de fusionar esta rama en `main` hay que
borrarla, porque GitHub Pages sirve todo lo que esté en el repositorio y estos archivos
quedarían accesibles en la dirección pública del parque.

## Qué hay aquí

| Archivo | Para qué sirve |
| --- | --- |
| `handoff-claude-v1.52.md` | El documento de relevo que describe el estado del trabajo. |
| `auditoria-btmm-senderos-pnlq.md` | Los 16 hallazgos de la auditoría, con detalle. |
| `vista-previa-v1.52.html` | Réplica autónoma de las dos piezas cambiadas, para verlas sin desplegar. |
| `smoke/prueba.js` | 64 comprobaciones sobre la aplicación real, con jsdom. |
| `smoke/previa.js` | 29 comprobaciones sobre la vista previa. |

## Cómo ejecutar las pruebas

```bash
cd revision-v1.52/smoke
npm install jsdom     # una sola vez
node prueba.js        # 64/64 sobre la aplicación real
node previa.js        # 29/29 sobre la vista previa
```

`prueba.js` busca el repositorio hacia arriba desde su propia carpeta, así que funciona
desde aquí sin configurar rutas. `previa.js` espera encontrar `vista-previa-v1.52.html`
en la carpeta superior, es decir, en `revision-v1.52/`.

## Dos trampas del entorno de prueba

- En jsdom no existe `MessageChannel`, así que React 18 vuelca el estado en un macrotask.
  Los arneses esperan un tick tras cada interacción antes de comprobar nada. No es un
  comportamiento de la aplicación.
- Los arneses resuelven rutas con `process.cwd()` porque algunos entornos de trabajo
  reescriben las rutas absolutas que aparecen dentro de los archivos de script.

## Lo que estas pruebas no cubren

El aspecto en un teléfono Android real. La revisión se hizo con Chromium de escritorio
emulando anchos de 375, 390, 430, 768 y 1280 px, que verifica la geometría, los estilos
calculados y el comportamiento del puntero, pero no el motor ni la pantalla de un equipo
de gama media en el sendero.
