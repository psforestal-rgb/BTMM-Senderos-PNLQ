# Continuidad para Perplexity — rediseño de B.1

## Proyecto

- Repositorio: https://github.com/psforestal-rgb/BTMM-Senderos-PNLQ
- Rama de publicación: main
- Sitio: https://psforestal-rgb.github.io/BTMM-Senderos-PNLQ/
- Carpeta local: C:\Users\psfor\OneDrive\Documents\SENDEROS
- Versión preparada: 1.16; caché del service worker: senderos-pnlq-v6.
- La aplicación es un React compilado y autocontenido dentro de index.html; no hay proceso npm ni archivos JSX fuente.

## Solicitud funcional

Rediseñar B.1, Registro diario de participantes, con esta jerarquía:

1. Selector de fecha sin registros iniciales, pero con la fecha actual preseleccionada.
2. Botón **Adicionar día**.
3. Una tarjeta colapsable por fecha.
4. Dentro de cada día, botón **Adicionar persona**.
5. Una subtarjeta colapsable por persona con nombre, tipo cuando corresponde, inicio, fin y horas.
6. Opción para bloquear/desbloquear la edición de cada persona.
7. Alerta si dos registros de la misma persona se traslapan total o parcialmente en la misma fecha.

## Implementación aplicada

### Estado y compatibilidad

- rows continúa siendo el formato plano histórico consumido por B.2, B.3, borradores, vista previa y DOCX.
- Los registros iniciales cambiaron de seis filas vacías a una lista vacía.
- mkRow(fecha) asigna la fecha del día y conserva los valores iniciales 08:00–16:00.
- Se agregó dias para conservar jornadas todavía sin personas.
- Los días se guardan/restauran mediante el colector b_days.
- Los bloqueos se guardan/restauran mediante b_locked.
- Los borradores antiguos siguen funcionando porque las fechas también se derivan de b_rows.
- App conserva restauraciones pendientes por sección y las aplica cuando el componente se monta. Esto corrige el caso en que se restaura el borrador desde A antes de abrir B.

### Traslapes

- Se normaliza el nombre con trim y minúsculas en español.
- Solo se comparan registros de igual nombre e igual fecha.
- La condición es: inicioA < finB y inicioB < finA.
- Detecta coincidencia total y traslape parcial.
- Horarios contiguos, por ejemplo 08:00–12:00 y 12:00–16:00, no generan alerta.
- Los dos registros implicados reciben borde rojo, insignia y mensaje con role=alert.

### Nombre y tipo

- El selector de nombre siempre aparece.
- Si se escoge un funcionario predefinido, el tipo se fija automáticamente como funcionario y no se muestra el selector de tipo.
- Si se elige ingreso manual, aparece el campo de texto.
- Las opciones **SINAC / Externo** aparecen solamente después de escribir un nombre manual.
- Ambas opciones se mantienen en una sola fila.

### Bloqueo

- **Bloquear edición** deshabilita el fieldset de nombre, tipo y horas.
- También deshabilita la eliminación de esa persona.
- El botón queda fuera del fieldset para permitir **Desbloquear edición**.
- La tarjeta muestra la insignia de bloqueo.

### Responsive

- Las tarjetas funcionan en escritorio y móvil.
- Bajo 780 px, encabezados y acciones se reorganizan a una columna legible.
- Fecha, nombre y horas conservan controles táctiles de al menos 44 px.
- Los campos Inicio y Fin se apilan en teléfono para impedir recortes.

## Archivos modificados

- index.html
  - Estado y lógica de B.1.
  - Detección de traslapes.
  - Nueva interfaz día → persona.
  - Persistencia de días y bloqueos.
- responsive.css
  - Estilos b1-* para tarjetas, alertas, bloqueo y layouts móviles.
- sw.js
  - Debe incrementarse el nombre de caché si hay cambios posteriores.

## Verificación ya realizada

En 375 px:

- B.1 inicia con cero días y cero personas.
- El selector muestra la fecha local actual.
- **Adicionar día** crea una tarjeta de jornada.
- **Adicionar persona** crea una subtarjeta.
- Inicio y Fin miden aproximadamente 47 px de alto y no se recortan.
- El tipo no aparece antes del nombre manual.
- Después de escribir un nombre manual aparecen SINAC y Externo en una fila, con 44 px de alto.
- Dos registros 08:00–16:00 con el mismo nombre generan dos alertas y dos insignias.
- Bloquear edición deshabilita el fieldset y el botón de eliminar, y permite desbloquear.
- Un borrador restaurado desde A recuperó al abrir B: un día, una persona y su estado bloqueado.
- No se observaron errores de consola.

## Comandos de comprobación

    node -e 'const fs=require("fs"),s=fs.readFileSync("index.html","utf8"),a=s.indexOf("<body><div id=\"root\"></div><script>")+42,b=s.indexOf("</script>",a); new Function(s.slice(a,b)); console.log("JavaScript principal: sintaxis válida")'
    git diff --check
    python -m http.server 8765 --bind 127.0.0.1

## Si falta finalizar

1. Confirmar visualmente 390, 430, 768 y escritorio.
2. Probar horarios contiguos para confirmar que no alertan.
3. Repetir guardar/restaurar un borrador con un día vacío y una persona bloqueada si se modifica la infraestructura de borradores.
4. Si realiza cambios adicionales, actualizar la versión visible y CACHE_NAME en sw.js.
5. Ejecutar validación de sintaxis y git diff --check.
6. Hacer commit, push a main y esperar el workflow pages build and deployment.
7. Verificar en la URL pública usando un parámetro de caché.

## Precauciones

- No convertir index.html a un proyecto npm durante esta tarea.
- No cambiar el esquema plano de b_rows; B.2, B.3 y el DOCX dependen de él.
- No eliminar compatibilidad con borradores previos.
- No resolver traslapes sumando horas: la validación debe usar intervalos reales.
