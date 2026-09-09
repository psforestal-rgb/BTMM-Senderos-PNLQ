# Esquema de datos

El informe no se guarda como una fila por jornada, sino repartido en tablas
relacionadas. Esa es la diferencia entre tener un archivo de respaldo y tener
datos que se puedan analizar en el tiempo y entre áreas protegidas.

Todas las tablas se relacionan por `jornada_id`. Las de catálogo se relacionan
además por `sendero_id`, `sector_id` y `area_id`.

```
areas ─┬─ sectores ─┬─ senderos ─┬─ geometria_senderos
       │            │            │
       └────────────┴── jornadas ─┼─ participantes
                                  ├─ tramos
                                  ├─ puntos
                                  ├─ hallazgos     (sección D)
                                  ├─ acciones      (sección E)
                                  ├─ recursos      (sección H)
                                  ├─ resultados    (sección I)
                                  ├─ seguridad     (sección G)
                                  ├─ pendientes    (sección K)
                                  └─ fotos         (sección J)
```

## Catálogo

Estas cuatro pestañas son las que permiten crecer sin tocar el código. Hoy los
sectores y senderos están escritos dentro de `index.html`; agregar un área
protegida obliga a editar el archivo y volver a publicar. Con el catálogo en la
hoja, agregar un área es agregar filas.

**`areas`** — `area_id`, `nombre`, `codigo`, `creada_en`

**`sectores`** — `sector_id`, `area_id`, `nombre`, `creado_en`

**`senderos`** — `sendero_id`, `sector_id`, `area_id`, `nombre`, `longitud_m`,
`epsg`, `estado`, `creado_en`

**`geometria_senderos`** — `sendero_id`, `seq`, `x`, `y`, `lat`, `lon`

El trazado de cada sendero como lista ordenada de vértices. Se carga con
`PNLQ_sembrarCatalogo()` desde la consola del navegador.

Las tres primeras se llenan solas: si llega un informe de un sendero que la hoja
no conoce, el script lo registra junto con su sector y su área.

## Registro de jornadas

**`jornadas`** — una fila por informe, la llave es `jornada_id`.

Además de los datos de la sección A (oficio, tipo de intervención, origen, clima,
restricción) lleva:

- `estado` — `borrador` mientras se llena, `final` al descargar el DOCX
- `envios` — cuántas veces se respaldó ese mismo informe
- `dias_efectivos`, `participantes_n`, `horas_persona_min` — esfuerzo de la jornada
- `total_metros`, `tramos_n`, `puntos_n`, `hallazgos_n`, `acciones_n`,
  `pendientes_n`, `fotos_n` — resúmenes para graficar sin cruzar tablas
- `condicion_final` (1 a 5) y `condicion_final_texto`
- `raw_1`, `raw_2`, `raw_3` — el informe original en JSON, partido en trozos que
  quepan en una celda. Es el seguro: si algún día el esquema queda corto, los
  datos completos siguen ahí.

**`participantes`** — `fecha`, `nombre`, `tipo`, `encargado`, `hora_ini`,
`hora_fin`, `parcial`, `horas_parciales`

**`tramos`** — estación inicial y final en metros, longitud, coordenadas de ambos
extremos en CRTM05 (`x`, `y`) y en latitud/longitud, superficie y pendiente.

**`puntos`** — la tabla que hoy nace vacía. Es donde vivirán los puntos
georreferenciados que hoy no existen: la sección D registra *qué* problema hubo,
pero no *dónde*. Sus columnas ya están definidas para no migrar datos después:

`punto_id`, `jornada_id`, `sendero_id`, `sendero`, `tipo`, `codigo`, `categoria`,
`estacion_m`, `x`, `y`, `lat`, `lon`, `precision_m`, `desvio_m`,
`metodo_captura`, `severidad`, `estado`, `descripcion`, `punto_padre`,
`creado_en`, `cerrado_en`

Las dos columnas que le dan sentido en el tiempo:

- `punto_padre` — enlaza el punto con el mismo problema visto en una jornada
  anterior. Permite decir «esta cárcava lleva tres jornadas abierta».
- `desvio_m` — distancia entre la coordenada real y su proyección sobre la
  línea del sendero. Un árbol caído a ocho metros del borde no está sobre la
  huella, y forzarlo a la línea perdería su ubicación verdadera.

**`hallazgos`**, **`acciones`**, **`recursos`**, **`resultados`**, **`seguridad`**,
**`pendientes`**, **`fotos`** — el detalle de cada sección, una fila por elemento.

**`bitacora`** — cada envío recibido con su resultado. Nunca se borra: es el
registro de auditoría y el primer lugar donde mirar si algo falla.

## Dos decisiones que sostienen el análisis

### Códigos, no rótulos

Cada problema y cada acción se guardan con un código estable (`d01`…`d15`,
`e01`…`e24`) además de su texto.

Esto no es teoría. El commit `537262b` renombró «Vegetación invade el sendero»
a «Crecimiento vegetal en el sendero», y por eso `index.html` tiene hoy código
que traduce el rótulo viejo al nuevo para no romper los borradores guardados.
Con el código `d01` como llave, el rótulo puede cambiar las veces que haga falta
y la serie histórica sigue siendo comparable. El script mantiene los dos nombres
apuntando al mismo código.

### Dos sistemas de coordenadas

La coordenada original se conserva en CRTM05 (EPSG:5367), que es lo que usa la
aplicación y lo que entiende el resto de la información oficial. El script agrega
además latitud y longitud en WGS84, porque Google Sheets, Looker Studio,
My Maps y Google Earth solo entienden eso.

La conversión es la inversa de la proyección Transversa de Mercator con los
parámetros de CRTM05: meridiano central −84°, factor de escala 0.9996, falso este
500 000 m. El error de ida y vuelta es de centésimas de milímetro, muy por debajo
de la precisión de cualquier GPS de campo.

## Reglas de escritura

- **La llave es `jornada_id`.** Reenviar un informe actualiza su fila; nunca
  agrega otra. Por eso los reintentos de la cola son inofensivos.
- **Las tablas hijas se reescriben completas** en cada envío: son el detalle de
  la versión vigente de esa jornada.
- **Nada se borra por fuera de eso.** La bitácora y el JSON original permiten
  reconstruir cualquier versión recibida.
- **Agregar una columna al esquema es seguro.** Basta con volver a ejecutar
  `configurar()`: las columnas nuevas se agregan al final y las filas existentes
  quedan intactas.

## Para analizar

Con esta forma, en la propia hoja salen tablas dinámicas por sendero, por tipo de
problema o por mes. Para cuadros de mando, Looker Studio se conecta gratis a la
hoja. Para la capa espacial, `tramos` y `puntos` se exportan como CSV con
latitud y longitud, que es lo que importan Google My Maps y Google Earth.

Si algún día el volumen o las consultas espaciales piden una base de datos de
verdad, este esquema se importa a PostgreSQL con PostGIS sin rediseñarlo.
