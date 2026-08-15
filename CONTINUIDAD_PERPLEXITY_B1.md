# Continuidad para Perplexity — formulario diario de participantes

## Proyecto

- Repositorio: https://github.com/psforestal-rgb/BTMM-Senderos-PNLQ
- Rama de publicación: `main`
- Sitio: https://psforestal-rgb.github.io/BTMM-Senderos-PNLQ/
- Carpeta local: `C:\Users\psfor\OneDrive\Documents\SENDEROS`
- Punto de restauración anterior: tag `restore-v1.18`, commit `fd6ef68`.
- Versión preparada: `1.21`; caché: `senderos-pnlq-v11`.
- La aplicación es React compilado y autocontenido dentro de `index.html`; no hay fuentes JSX ni proceso npm.

## Modelo funcional vigente

Cada formulario corresponde a una única jornada:

1. Fecha de jornada, con la fecha actual como valor inicial.
2. Barra de horario de doble marcador entre `08:00` y `16:00`.
3. Los marcadores de inicio y final avanzan en pasos exactos de 30 minutos y actualizan la duración en vivo.
4. Botón **Adicionar persona**.
5. Una tarjeta colapsable por participante.
6. Nombre desde la lista SINAC o ingreso manual.
7. El tipo **SINAC / Externo** aparece solo para un nombre ingresado manualmente.
8. Cada persona cuenta la jornada completa de forma predeterminada.
9. Al marcar **Participó parcialmente**, aparece un campo numérico para indicar sus horas.
10. Un botón independiente crea una tarjeta de **Encargado de cuadrilla** antes de las tarjetas de participantes.
11. El nombre elegido como encargado desaparece del selector de participantes, y los participantes elegidos desaparecen del selector del encargado.

Ya no se muestran ni se usan en B.1:

- Adicionar o eliminar días.
- Horas de inicio y fin por persona.
- Bloquear/desbloquear edición.
- Alertas de traslape entre intervalos personales.
- Las vistas B.2 y B.3 ni sus filas de resumen.

## Compatibilidad y cálculos

- `b_rows` se conserva como formato de persistencia para no romper borradores, cálculos, vista previa ni DOCX.
- Cada fila mantiene `fecha`, `ini` y `fin`, pero ahora estos valores provienen del horario general de la jornada.
- Nuevos campos por persona: `parcial`, `horasParciales` y `encargado`.
- `calcParticipantMin(r)` devuelve las horas parciales cuando corresponde; en los demás casos calcula la duración general.
- B.2 y B.3 siguen calculándose internamente y se conservan en el DOCX final, aunque no se renderizan en la sección B.
- El resumen diario del DOCX obtiene el encargado desde la persona marcada; mantiene compatibilidad con el antiguo campo `b_b3x` como respaldo.
- Solo puede existir un encargado: marcar uno nuevo desmarca el anterior.
- Al restaurar un borrador anterior, la primera fecha y horario se adoptan como jornada única y se aplican a sus participantes.

## Sección A e informe

- Se retiraron de la interfaz **Período del mantenimiento** y **Área de Conservación**.
- La vista previa y el DOCX tampoco muestran esas filas.
- El encabezado del informe usa **Fecha de jornada**.
- El detalle de participantes del informe muestra fecha, nombre, tipo, participación completa/parcial, horas y encargado.

## Responsive

- La fecha y la barra horaria se distribuyen sin comprimir los controles tanto en móvil como en escritorio.
- El horario usa una barra táctil con tramo seleccionado y marcadores diferenciados para inicio y final.
- Los controles tienen altura táctil mínima de 44 px.
- Las tarjetas no requieren desplazamiento horizontal.
- El encargado tiene un flujo de adición separado y una tarjeta visualmente diferenciada.
- La participación parcial y sus horas tienen jerarquía clara y mensajes de apoyo.

## Verificación realizada

Se probó con Chrome/Playwright en `375`, `390`, `430`, `768` y `1280` px:

- Fecha actual, inicio `08:00` y final `16:00` correctos.
- Ambos marcadores se pueden arrastrar y también operar con teclado; cada movimiento queda redondeado a pasos de 30 minutos.
- Los marcadores no pueden cruzarse y mantienen al menos 30 minutos de duración.
- Sin desbordamiento horizontal.
- Adición y edición de participantes correctas.
- `4.5` horas parciales se computan como `4:30`.
- Solo se permite crear una tarjeta de encargado; al eliminarla, el botón vuelve a habilitarse.
- No se muestra el bloque de horas computadas en las tarjetas, aunque las horas siguen guardándose para el informe.
- B.2 y B.3 no aparecen en la sección B.
- La vista previa usa el nuevo detalle y no muestra Área de Conservación ni Período.
- Sin errores de JavaScript en ejecución.

## Para finalizar o continuar

1. Ejecutar validación de sintaxis del script principal y `git diff --check`.
2. Si hay más cambios, incrementar la versión visible y `CACHE_NAME`.
3. Hacer commit y push a `main`.
4. Esperar `pages build and deployment` y comprobar la URL pública con un parámetro de caché.
5. Si es necesario volver al estado anterior, usar el tag `restore-v1.18`.

## Precauciones

- No convertir `index.html` a un proyecto npm durante esta etapa.
- No eliminar `b_rows`, B.2 o B.3 de la generación DOCX: deben permanecer como resultados internos del informe final.
- Mantener una sola fecha y un solo horario general por formulario.
