# Respaldo de informes en Google Sheets

Cada informe de mantenimiento se envía a una hoja de cálculo del parque, además de
guardarse en el teléfono. Así deja de perderse cuando alguien cambia de equipo,
borra los datos del navegador o desinstala la aplicación, y la información queda
en tablas que se pueden filtrar, graficar y comparar entre jornadas.

Mientras no se complete esta instalación la aplicación funciona igual que antes:
sin configuración, no intenta ningún envío.

## Qué se instala

| Pieza | Dónde vive | Para qué |
|---|---|---|
| Hoja de cálculo | Google Drive del parque | Guarda los datos, privada |
| `apps-script/Codigo.gs` | Editor de Apps Script de esa hoja | Recibe los informes y los ordena en tablas |
| `respaldo-config.js` | Raíz del repositorio | Le dice a la aplicación a dónde enviar |

## Instalación

**1. Cree la hoja de cálculo.** En el Drive del parque, una hoja nueva llamada
por ejemplo *Mantenimiento de senderos — datos*. No la comparta con nadie todavía.

**2. Pegue el script.** En esa hoja: menú **Extensiones → Apps Script**. Borre lo
que traiga el editor y pegue el contenido completo de `apps-script/Codigo.gs`.

**3. Cambie el token.** En la primera línea de configuración del script, sustituya
`CAMBIE-ESTE-TOKEN` por una frase propia, por ejemplo `pnlq-senderos-2026-x7k2`.
Guarde con el disquete.

**4. Cree las pestañas.** En el selector de funciones del editor elija
`configurar` y presione **Ejecutar**. Google le pedirá autorizar el script: es
suyo, acepte. Al volver a la hoja verá las 16 pestañas creadas.

**5. Verifique.** Ejecute la función `probar`. Debe aparecer una jornada
`PRUEBA-0001` en la pestaña `jornadas` con sus tramos, hallazgos y acciones.
Cuando lo confirme, ejecute `borrarPrueba` para dejarla limpia.

**6. Publique el script.** Botón azul **Implementar → Nueva implementación**.
Elija tipo **Aplicación web**, y configure:

- Ejecutar como: **Yo** (su cuenta)
- Quién tiene acceso: **Cualquier persona**

Copie la dirección que termina en `/exec`.

> «Cualquier persona» aplica al script que escribe, no a la hoja. La hoja sigue
> siendo privada: nadie puede leer lo guardado.

**7. Conecte la aplicación.** En `respaldo-config.js`, en la raíz del repositorio:

```js
window.PNLQ_RESPALDO = {
  activo: true,
  url: 'https://script.google.com/macros/s/AKfy.../exec',
  token: 'pnlq-senderos-2026-x7k2',
  autoMinutos: 3
};
```

Publique el sitio. En la barra lateral aparecerá el botón **☁ Respaldar en la hoja**
con el estado del último envío.

**8. Cargue el catálogo de senderos (una sola vez).** Abra la aplicación,
presione F12 para ver la consola del navegador y escriba:

```js
PNLQ_sembrarCatalogo()
```

Eso copia a la hoja los senderos con su longitud y su trazado completo en
coordenadas. A partir de ahí la hoja tiene la geometría, no solo el código.

## Cómo se comporta en el campo

- **Se respalda solo.** Cada vez que el informe cambia, queda en una cola local y
  se envía cuando hay señal. No hay que acordarse de nada.
- **Sin señal no se pierde nada.** La cola vive en el teléfono. Al recuperar
  conexión sale sola; también se puede forzar con el botón.
- **Reenviar no duplica.** Cada informe tiene un identificador propio
  (`jornada_id`). El script actualiza esa fila en lugar de agregar otra, así que
  un reintento nunca ensucia los datos.
- **Solo viaja lo que cambió.** Si el informe no se modificó desde el último
  envío, no se manda de nuevo.
- **Al descargar el DOCX** la jornada pasa de `borrador` a `final` en la hoja.
- **Nuevo informe · limpiar memoria** cierra la jornada actual y abre otra con un
  identificador nuevo. Lo que quedó pendiente de enviar se conserva.

## Qué queda fuera por ahora

Las fotografías viajan solo con su nombre, descripción y categoría; las imágenes
todavía no se suben. Subirlas a una carpeta de Drive y dejar el enlace en la
columna `drive_url` de la pestaña `fotos` es la siguiente etapa.

## Límites y costo

Todo esto es gratuito y sin caducidad. Los topes reales quedan muy lejos:

- Una hoja de cálculo admite 10 millones de celdas. A unas 200 jornadas por año,
  el conjunto de tablas crece del orden de 3 000 filas anuales.
- Apps Script permite unos 90 minutos de ejecución diaria por cuenta gratuita.
  Cada envío toma un par de segundos.

## Sobre la seguridad

`respaldo-config.js` se publica junto con el sitio, así que la dirección y el
token quedan a la vista de quien lea el código. Eso significa que el token
detiene rastreadores automáticos, no a una persona decidida.

Lo que sí protege los datos:

- La hoja es privada. El script escribe, nadie lee desde afuera.
- El script no borra jornadas: crea o actualiza por identificador.
- La pestaña `bitacora` registra todos los envíos recibidos, con su resultado.

Si en algún momento eso no basta, el paso siguiente es un intermediario con
secreto real (por ejemplo un Worker de Cloudflare), sin cambiar el esquema.

## Si algo falla

| Señal | Causa probable | Qué hacer |
|---|---|---|
| El botón no aparece | `activo` sigue en `false`, o el sitio quedó en caché | Revise `respaldo-config.js` y recargue con Ctrl+F5 |
| «Pendiente de respaldo · token_invalido» | El token del script y el de la aplicación no coinciden | Iguálelos y vuelva a publicar |
| «Pendiente de respaldo · HTTP 401» o similar | La implementación no quedó abierta a cualquier persona | Repita el paso 6 con **Nueva implementación** |
| Nada llega y no hay error | Se editó el script pero no se creó una implementación nueva | Cada cambio del código exige **Nueva implementación** |

La pestaña `bitacora` es el primer lugar donde mirar: registra cada envío
recibido y, si hubo excepción, su mensaje.
