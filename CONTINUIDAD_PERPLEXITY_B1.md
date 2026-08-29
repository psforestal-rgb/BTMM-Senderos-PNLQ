# Continuidad para Perplexity — formulario diario de participantes

## Proyecto

- Repositorio: https://github.com/psforestal-rgb/BTMM-Senderos-PNLQ
- Rama de publicación: `main`
- Sitio: https://psforestal-rgb.github.io/BTMM-Senderos-PNLQ/
- Carpeta local: `C:\Users\psfor\OneDrive\Documents\SENDEROS`
- Punto de restauración anterior: tag `restore-v1.18`, commit `fd6ef68`.
- Versión preparada: `1.28`; caché: `senderos-pnlq-v18`.
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
12. Cada tarjeta tiene **Guardar cambios** antes de eliminar; guarda B.1 en `localStorage` y contrae la tarjeta.

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
- Al colapsarse, la tarjeta dorada del encargado muestra su nombre con la misma jerarquía que los participantes.
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

## Sección C — selección cartográfica por tramos (versión 1.23)

- Se eliminó del mapa la escala numérica `1:N`.
- La flecha norte conserva su función, pero usa un recuadro pequeño, translúcido y sin sombra.
- Bajo **Agregar sendero completo** se añadió **Seleccionar tramos**.
- El sendero activo se divide con `round(total_m / 100)`; así todos los tramos tienen exactamente la misma longitud geométrica y quedan aproximadamente en 100 m.
- Los límites se interpolan sobre la polilínea mediante `stationRangePts`, aunque no coincidan con un vértice original.
- Al tocar un tramo se agrega o retira un registro `c_tramos` con `autoSegment`, estaciones, coordenadas e índices; el informe final continúa consumiendo el mismo colector.
- Los tramos elegidos se resaltan en dorado, se muestran en tarjetas numeradas bajo el mapa y alimentan un total destacado.
- La esquina inferior derecha del mapa muestra `Cada tramo ≈ N m`, sin decimales.
- Cambiar de sendero limpia la selección anterior para impedir mezclar geometrías distintas.
- **Agregar sendero completo** sustituye cualquier selección parcial y conserva el flujo manual existente.
- Verificado en 375, 390, 430, 768 y 1280 px: toque real sobre el trazado, eliminación desde tarjeta, ausencia de escala numérica, cero desbordamiento horizontal y cero errores de JavaScript.

### Nomenclatura desde la versión 1.24

- **Sección:** cada subdivisión básica del sendero, de longitud uniforme y cercana a 100 m.
- **Tramo:** una sección aislada o un grupo de secciones consecutivas seleccionadas.
- Las selecciones consecutivas amplían el tramo activo; una sección no seleccionada interrumpe el grupo y hace que la siguiente selección inicie un nuevo tramo.
- **Iniciar otro tramo** permite separar dos tramos aunque sus secciones sean contiguas (por ejemplo, Tramo 1 = secciones 1–4 y Tramo 2 = sección 5).
- Las tarjetas y los informes enumeran los tramos y detallan las secciones que los componen.
- El resaltado cartográfico usa amarillo fluorescente con contorno azul oscuro para mantener contraste sobre el mapa.

## Paneles ilustrados D y E (versión 1.25)

- Los checklists visibles de D.1, E.1, E.2 y E.3 se sustituyeron por paneles de tarjetas ilustradas.
- La implementación temporal usa emojis definidos en `ITEM_VISUALS`; cada entrada ya tiene un identificador estable para sustituirlo posteriormente por un SVG.
- Cada tarjeta presenta icono, nombre corto, casilla **Observado** (D) o **Ejecutado** (E) y selector de severidad.
- D conserva su estructura `d_data.activeProbs` y `d_data.sevs`, por lo que no se altera el informe existente.
- E amplía `e_data` con `sevs`; las labores seleccionadas incorporan la severidad en la vista previa y el informe.
- El panel usa 2 columnas en móvil, 3 en tableta y 4 en escritorio, sin desplazamiento horizontal.
- El prompt para generar los SVG y PNG definitivos está en `PROMPT_PAQUETE_ICONOS_D_E.md`.

## Simplificación de la Sección C (versión 1.26)

- El mapa queda como única vía de captura: **sendero completo** o **seleccionar secciones**.
- Se retiraron de la interfaz la tabla y los ingresos manuales por estación, coordenadas, superficie y pendiente.
- También se retiraron el bloque de instrucciones de captura manual, el botón **Agregar tramo** y el resumen visible de longitud.
- Las estaciones, coordenadas y distancias se continúan calculando internamente desde la geometría del mapa.
- La vista previa y el DOCX conservan tramo, estaciones, longitud, coordenadas y total intervenido.
- Superficie y pendiente se retiraron también de las tablas del informe porque ya no existe captura para esos campos.

## Resaltado y barras de nivel en D/E (versión 1.27)

- Se eliminaron las casillas **Observado/Ejecutado** y los selectores desplegables de severidad.
- El icono y el nombre funcionan como un botón accesible con `aria-pressed`; al tocarlo, toda la tarjeta se resalta en amarillo.
- Cada tarjeta incorpora una barra segmentada táctil **Baja · Media · Alta**.
- La barra permanece deshabilitada hasta seleccionar la tarjeta y usa verde, naranja o rojo para el nivel activo.
- La estructura de datos sigue usando los mismos conjuntos y valores `Baja`, `Media` y `Alta`, conservando compatibilidad con borradores e informes.

## Ajustes de G.1 (versión 1.28)

- Se retiraron **Condiciones meteorológicas aptas** y **No se dejaron obstáculos bloqueando cauces o drenajes**.
- **Visitantes informados de restricciones o desvíos** se reemplazó por **Rotulación o información al visitante**.
- Al restaurar borradores anteriores, el texto antiguo se migra al nuevo y los dos controles eliminados se descartan.

## Ilustraciones definitivas de D/E (versión 1.29)

- Los 39 emojis temporales se sustituyeron por las ilustraciones finales generadas en Recraft.
- Los archivos locales están optimizados como WebP transparente de 200 × 200 px en `assets/icons-d-e/` y pesan aproximadamente 832 KB en conjunto.
- `ITEM_VISUALS` conserva los identificadores estables y `CbSec` construye la ruta local correspondiente; el emoji permanece solamente como respaldo si una imagen no puede cargarse.
- Las imágenes se cargan de forma diferida, mantienen proporción y aumentan a 92 px en móvil y 100 px en pantallas amplias.
- Los 39 recursos se incluyen en el `APP_SHELL` del service worker para conservar el funcionamiento sin conexión.

## Compatibilidad del informe Word (versión 1.30)

- La interfaz mantiene oculto el control de MyOffice, pero el informe Word recupera la fila **Número de oficio** en A. Control del reporte.
- Si no existe un número guardado, la celda de valor queda vacía y editable para completarla en Word antes de firmar el PDF.
- El documento no aplica protección de edición; la celda y el resto del informe continúan siendo editables.

## Experiencia de cierre de jornada (versión 1.31)

- La interfaz móvil se reorganizó como un recorrido guiado para completar el reporte al regresar a la infraestructura.
- Incluye encabezado compacto, ruta de 12 pasos, confirmaciones de avance y una mesa de revisión antes de generar el informe.
- A, G y H usan selecciones visuales más grandes; los valores internos y su salida al Word no cambiaron.
- J permite clasificar fotografías como vista general, problema, trabajo realizado o resultado final. La categoría se conserva en el borrador exportado, pero no altera la sección J del Word.
- La mesa final es exclusivamente una vista de control: el generador DOCX y el machote institucional permanecen intactos.

## Familia visual ilustrada (versión 1.32)

- Se sustituyeron los emojis ilustrativos por 63 imágenes Recraft coherentes con los paneles D y E.
- El paquete cubre navegación, intervención, origen, clima, restricciones, G.1, recursos H.1 y categorías fotográficas J.
- Los símbolos funcionales mínimos (flechas, guardar, eliminar y estados) continúan simples para preservar claridad táctil.
- Los valores internos, recolectores y el generador DOCX no fueron modificados por este cambio visual.

## Escala homogénea de iconos (versión 1.33)

- Las ilustraciones principales de las tarjetas usan una medida estándar de 84 px en A, G, H, D y E.
- Navegación, revisión y fotografías usan escalas compactas diferenciadas, pero coherentes entre sí.
- El icono de bienvenida también utiliza la familia Recraft; los símbolos funcionales conservan tamaño reducido.

## Legibilidad móvil híbrida (versión 1.34)

- A y G presentan las opciones ilustradas como filas amplias con texto de 16 px.
- D y E conservan el mosaico de dos columnas; una tarjeta seleccionada se expande y entonces muestra la escala de nivel.
- H conserva dos columnas para evitar una lista excesivamente larga, con nombres operativos mayores.
- Se corrigieron cuatro abreviaturas `font` inválidas, el límite inclusivo de 700 px y varios objetivos táctiles inferiores a 44 px.
- Se consolidaron las reglas ilustradas móviles en consultas de contenedor; los datos y el DOCX permanecen sin cambios.

## Registro operativo de cierre (versión 1.35)

- H muestra cantidad y controles `− / +` inmediatamente debajo de cada recurso seleccionado; el DOCX conserva recurso, unidad, cantidad y comentario.
- I ya no contiene componentes de resultados automáticos en pantalla; todos los indicadores calculados siguen incorporándose al Word.
- K inicia sin filas y permite agregar pendientes individualmente mediante `+ Agregar pendiente`.
- L usa una barra de cinco estados con apoyo visual y admite varias justificaciones simultáneas; el Word recibe la categoría, todas las justificaciones y las observaciones/recomendaciones.
- M elimina la línea de firma, captura el número de oficio junto al acceso a MyOffice y lo coloca en el informe Word.

## Recursos contraíbles (versión 1.36)

- En H, el primer toque selecciona el recurso y abre sus controles de cantidad; otro toque sobre la ilustración contrae el panel sin borrar la selección.
- Toda cantidad mayor que cero se muestra como una insignia pequeña en la esquina inferior derecha de la tarjeta; con cantidad cero o vacía no aparece insignia.
- La acción `Quitar` permite deseleccionar explícitamente el recurso y evita que un segundo toque lo elimine por accidente.
- El recolector `h_data` y la salida de recursos al informe Word permanecen sin cambios.

## Contadores estables y niveles contraíbles (versión 1.37)

- Los botones `− / +` de cantidad preservan la posición vertical y evitan acciones predeterminadas que podían desplazar la pantalla al inicio.
- Los contadores manuales de I ya no se remontan como componentes nuevos después de cada cambio de cantidad.
- En D y E, el segundo toque contrae la tarjeta sin borrar el elemento ni su nivel; al contraerse aparece un semáforo pequeño con Baja en verde, Media en ámbar o Alta en rojo.
- La acción `Quitar` deselecciona explícitamente un elemento. Los recolectores de D/E y el generador Word permanecen sin cambios.

## Chapia, acciones visibles y otro dato manual (versión 1.38)

- E.1 usa `Chapia lateral de vegetación` tanto en pantalla como en el Word; los borradores que guardaron el nombre anterior se migran al restaurarse.
- Las tarjetas expandidas de D y E presentan `Minimizar` y `Quitar` juntos en una sola fila.
- I permite agregar un dato de campo adicional con detalle libre y cantidad; se guarda en `i_fields` y aparece en la tabla de resultados del Word.
- El dato adicional puede minimizarse sin perder información o quitarse para limpiar ambos campos.

## Recursos y conclusión simplificados (versión 1.39)

- Las tarjetas abiertas de H presentan `Comentario`, `Minimizar` y `Quitar` en una sola fila; minimizar conserva cantidad y comentario.
- Se retiró de la vista de L el campo redundante `Síntesis de labores ejecutadas`.
- El Word conserva la síntesis automática con las labores seleccionadas en E, por lo que el machote y la información final no se pierden.

## Correspondencia formulario–Word (versión 1.40)

- B conserva de forma independiente la fecha y el horario general de la jornada, incluso antes de agregar participantes, y los muestra en el Word y su vista previa.
- D incorpora en el diagnóstico del informe el detalle escrito cuando se selecciona `Otro`.
- G.1 informa tanto las verificaciones cumplidas como las no cumplidas; `Otro` solo se incluye cuando el usuario lo selecciona y detalla.
- J identifica cada fotografía con su categoría en el Word y en la vista previa, además de conservar su descripción.
- Se auditó la correspondencia de A, B, C, D, E, G, H, I, J, K, L y M sin retirar tablas, cálculos ni campos del machote institucional.

## Terminología y formato institucional del Word (versión 1.41)

- D denomina **Gravedad** a la escala Baja · Media · Alta; E denomina la misma escala **Dificultad percibida**. Los valores internos se conservan para mantener compatibilidad con borradores.
- I usa la etiqueta **Árboles / ramas grandes retiradas** en formulario, vista previa e informe.
- Se eliminó la sección duplicada **Síntesis de labores ejecutadas** de la vista previa y del Word; las labores siguen documentadas una sola vez en E.
- El contenido generado del Word usa Arial, texto normal de 11 pt y azul marino oscuro `#0B1F3A` en títulos y encabezados de tablas.
- La estructura gráfica, relaciones, logos y geometría del membrete institucional se mantienen; su texto también se normaliza a Arial.

## Limpieza segura de borradores (versión 1.42)

- El aviso de borrador usa ahora la acción explícita `Descartar`; ya no se limita a ocultar el aviso.
- Al descartar o iniciar un informe nuevo se eliminan solamente `pnlq_form_draft`, `pnlq_form_draft_ts` y `senderos_pnlq_b1_memory_v1`.
- La app se reinicia después de limpiar para retirar también los participantes que ya estaban cargados en el estado de React.
- Una protección temporal suspende el autoguardado durante el reinicio e impide que `beforeunload` recree el informe eliminado.
- El autoguardado vuelve a activarse con la primera interacción real dentro del formulario o mediante `Guardar borrador`.
- La barra lateral incorpora `Nuevo informe · limpiar memoria`, disponible aunque el aviso inicial ya no esté visible.
- Este cambio no modifica recolectores, vista previa ni generación del Word.

## Refinamiento visual de escritorio (versión 1.43)

- El contenido y los metadatos de cabecera pueden ocupar hasta 1280 px en monitores amplios, manteniéndose centrados y alineados entre sí.
- B.1 distribuye las acciones principales y los participantes contraídos en dos columnas; una tarjeta abierta usa el ancho completo para editar sin estrechez.
- D y E usan tarjetas más compactas y cinco columnas en escritorio amplio; una tarjeta abierta ocupa dos columnas para presentar nivel y acciones sin truncar texto.
- H presenta cuatro columnas en pantallas amplias y conserva tres columnas en escritorio compacto.
- La navegación inferior, los radios de las tarjetas, las sombras y los espacios internos se uniformaron para mejorar balance visual.
- Se verificó ausencia de desbordamiento horizontal en 390, 768, 1024, 1280 y 1920 px.
- La variante móvil, los recolectores y el informe Word no cambian.

## Selector de sector (versión 1.47)

- La sección A abre ahora con **1. Seleccione el sector (obligatorio)** y el sendero pasa a ser el paso 2; los pasos guiados siguientes se renumeraron a 3, 4, 5 y 6.
- `SECTORES` ofrece `Los Quetzales`, `Tapantí` y `Rondas Cortafuegos`; solo `SECTOR_ACTIVO` (`Los Quetzales`) habilita el selector de senderos.
- Al elegir `Tapantí` o `Rondas Cortafuegos` se muestra el aviso **En desarrollo**, se oculta el selector de senderos y se limpia cualquier sendero previo para que no llegue al informe.
- `findBlockingRequirement` valida primero el sector: sin sector indica `Falta seleccionar el sector` y con un sector en desarrollo indica `Sector en desarrollo`, de modo que el recorrido guiado no queda sin salida.
- Se retiró de la pantalla el bloque estático **ASP / nombre del área**, que solo mostraba un texto fijo.
- El informe Word y la vista previa **conservan la fila ASP** con `Parque Nacional Los Quetzales` y **añaden** una fila `Sector`; el cambio es aditivo y no retira ninguna fila del machote.
- `a_data` incorpora `sector`. Los borradores anteriores no lo traen: al restaurarlos, un borrador con `sendero` adopta `Los Quetzales`, por lo que no se pierde información guardada.

## Bloqueo total en sectores en desarrollo (versión 1.48)

- Con `Tapantí` o `Rondas Cortafuegos`, la sección A devuelve únicamente el selector de sector y el aviso **En desarrollo**; el resto de la sección (sendero, tipo de intervención, origen, clima, restricción y oficio) no se renderiza.
- Lo único posible es cambiar de sector: el panel de la sección A pasa de 25 controles a los 3 del selector.
- La navegación hacia B–M sigue bloqueada por `findBlockingRequirement`, y `Revisar y generar` queda deshabilitado.
- El aviso lateral muestra `Sector en desarrollo` en lugar de `Seleccione sendero para activar`, que no aplicaba al no existir selector de sendero visible.
- `updateShared` publica ahora `sector` para que la barra lateral pueda consultarlo.

## Guardar y contraer pendientes (versión 1.49)

- Cada fila de K incorpora un botón **Guardar** junto a la **✕** de eliminar; contrae el pendiente a una sola línea con `P-xx`, la situación y la severidad en color.
- La fila contraída conserva la ✕ y se reabre tocando el resumen; los datos no se modifican al contraer ni al reexpandir.
- El botón queda deshabilitado mientras la situación pendiente esté vacía, para no contraer una fila sin describir.
- El estado de contracción vive en `kCerradas`, aparte de las filas: `k_data.rows` no cambia y el informe Word tampoco.
- En móvil los botones muestran la etiqueta `Guardar`; en escritorio la columna de acciones pasa de 28 px a 84 px para alojar ambos.

## Precauciones

- No convertir `index.html` a un proyecto npm durante esta etapa.
- No eliminar `b_rows`, B.2 o B.3 de la generación DOCX: deben permanecer como resultados internos del informe final.
- Mantener una sola fecha y un solo horario general por formulario.
