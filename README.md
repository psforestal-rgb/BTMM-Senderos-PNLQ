# Mantenimiento de Senderos PNLQ

Aplicación web progresiva (PWA) para registrar y generar reportes de mantenimiento de senderos del Parque Nacional Los Quetzales.

## Uso

Abra la aplicación publicada en GitHub Pages. En navegadores compatibles puede instalarla desde la opción **Instalar aplicación** o **Agregar a la pantalla principal**. Después de la primera carga, la interfaz y sus dependencias quedan disponibles sin conexión.

Los borradores se guardan localmente en el navegador del dispositivo.

## Respaldo en Google Sheets

Los informes pueden respaldarse además en una hoja de cálculo del parque, donde
quedan repartidos en tablas relacionadas para analizarlos en el tiempo y entre
áreas protegidas. El envío es automático y tolera la falta de señal: lo que no se
pudo mandar queda en una cola y sale solo al recuperar conexión.

Viene desactivado. Para habilitarlo, siga [respaldo/README.md](respaldo/README.md);
la forma de los datos está descrita en [respaldo/ESQUEMA.md](respaldo/ESQUEMA.md).

El botón flotante **Vista móvil / Vista PC** permite alternar temporalmente ambos diseños durante las pruebas realizadas desde una computadora.

## Publicación

El sitio es estático y se publica directamente desde la raíz del repositorio mediante GitHub Pages.
