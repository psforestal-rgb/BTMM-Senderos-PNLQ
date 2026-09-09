/**
 * Respaldo de informes de mantenimiento de senderos — Parque Nacional Los Quetzales.
 *
 * Recibe el informe completo que genera la aplicación web y lo normaliza en varias
 * pestañas relacionadas, para poder analizarlo en el tiempo y entre áreas protegidas.
 *
 * Instalación: ver respaldo/README.md en el repositorio.
 */

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
// Debe coincidir con el valor de "token" en backup-config.js de la aplicación.
var TOKEN = 'CAMBIE-ESTE-TOKEN';

// Solo se aceptan envíos que declaren esta aplicación.
var APP_ESPERADA = 'PNLQ-Mantenimiento-Senderos';

// Área y sector que se asumen cuando el informe no los declara (versiones viejas).
var AREA_POR_DEFECTO = 'Parque Nacional Los Quetzales';
var SECTOR_POR_DEFECTO = 'Los Quetzales';

// Tamaño de cada trozo del JSON original. El límite de una celda es 50 000 caracteres.
var TROZO_JSON = 40000;

// ─── ESQUEMA ─────────────────────────────────────────────────────────────────
// Cada pestaña con sus columnas. Agregar una columna al final es seguro:
// ejecute configurar() y las filas existentes conservan su contenido.
var ESQUEMA = {
  areas: ['area_id', 'nombre', 'codigo', 'creada_en'],

  sectores: ['sector_id', 'area_id', 'nombre', 'creado_en'],

  senderos: ['sendero_id', 'sector_id', 'area_id', 'nombre', 'longitud_m', 'epsg', 'estado', 'creado_en'],

  geometria_senderos: ['sendero_id', 'seq', 'x', 'y', 'lat', 'lon'],

  jornadas: ['jornada_id', 'recibido_en', 'actualizado_en', 'estado', 'envios', 'app_version', 'dispositivo',
    'area', 'sector', 'sendero', 'sendero_id', 'fecha_ini', 'fecha_fin', 'hora_ini', 'hora_fin',
    'oficio', 'oficio_num', 'tipo_intervencion', 'origen', 'clima', 'restriccion', 'restriccion_detalle',
    'dias_efectivos', 'participantes_n', 'horas_persona_min', 'total_metros', 'tramos_n', 'puntos_n',
    'hallazgos_n', 'acciones_n', 'pendientes_n', 'fotos_n',
    'condicion_final', 'condicion_final_texto', 'justificacion', 'recomendacion',
    'responsable', 'responsable_oficio', 'incidente', 'incidente_tipo', 'incidente_persona',
    'incidente_atencion', 'incidente_reporte', 'seguimiento', 'recursos_comentario',
    'k_cierre', 'k_senal', 'k_compra', 'k_detalle_compra',
    'raw_1', 'raw_2', 'raw_3'],

  participantes: ['jornada_id', 'fila', 'fecha', 'nombre', 'tipo', 'encargado', 'hora_ini', 'hora_fin',
    'parcial', 'horas_parciales'],

  tramos: ['jornada_id', 'fila', 'nombre', 'seccion_auto', 'seccion_numero', 'est_ini_m', 'est_fin_m',
    'longitud_m', 'x_ini', 'y_ini', 'lat_ini', 'lon_ini', 'x_fin', 'y_fin', 'lat_fin', 'lon_fin',
    'superficie', 'pendiente'],

  // Puntos georreferenciados. Se llena a partir de la etapa 3 de la aplicación;
  // la pestaña se crea desde ya para no migrar datos después.
  puntos: ['punto_id', 'jornada_id', 'sendero_id', 'sendero', 'tipo', 'codigo', 'categoria',
    'estacion_m', 'x', 'y', 'lat', 'lon', 'precision_m', 'desvio_m', 'metodo_captura',
    'severidad', 'estado', 'descripcion', 'punto_padre', 'creado_en', 'cerrado_en'],

  hallazgos: ['jornada_id', 'codigo', 'problema', 'severidad', 'detalle_otro'],

  acciones: ['jornada_id', 'codigo', 'accion', 'nivel', 'detalle_otro'],

  recursos: ['jornada_id', 'recurso', 'cantidad', 'unidad', 'estado', 'observacion', 'personalizado'],

  resultados: ['jornada_id', 'indicador', 'cantidad', 'detalle'],

  seguridad: ['jornada_id', 'item', 'cumplido', 'detalle'],

  pendientes: ['jornada_id', 'fila', 'identificador', 'situacion', 'severidad', 'accion',
    'viene_de_diagnostico', 'codigo_diagnostico', 'critico', 'estado'],

  fotos: ['jornada_id', 'fila', 'nombre', 'descripcion', 'categoria', 'drive_url'],

  bitacora: ['recibido_en', 'jornada_id', 'estado', 'sendero', 'caracteres', 'resultado', 'detalle']
};

// Pestañas cuyas filas pertenecen a una jornada y se reescriben en cada envío.
var HIJAS = ['participantes', 'tramos', 'puntos', 'hallazgos', 'acciones', 'recursos',
  'resultados', 'seguridad', 'pendientes', 'fotos'];

// ─── CATÁLOGO DE CÓDIGOS ─────────────────────────────────────────────────────
// El rótulo puede cambiar con el tiempo; el código no. Las series históricas se
// comparan por código, nunca por texto.
var CODIGOS = {
  'Crecimiento vegetal en el sendero': 'd01',
  'Vegetación invade el sendero': 'd01',
  'Árbol caído o ramas bloquean paso': 'd02',
  'Raíces / piedras expuestas con riesgo de caída': 'd03',
  'Huella erosionada o acanalada': 'd04',
  'Cárcavas o pérdida acelerada de suelo': 'd05',
  'Drenaje obstruido, encharcamiento o cuneta colmatada': 'd06',
  'Talud inestable / deslizamiento': 'd07',
  'Puente, pasarela, baranda o escalón dañado': 'd08',
  'Señalización dañada, ausente o confusa': 'd09',
  'Basura, grafiti, residuos o vandalismo': 'd10',
  'Crecimiento de musgo o líquenes en losas y estructuras': 'd11',
  'Evidencia de atajos / ampliación de huella': 'd12',
  'Riesgo por fauna, enjambres u otro factor biológico': 'd13',
  'Daño por evento climático reciente': 'd14',
  'Otro': 'd15',
  'Chapia lateral de vegetación': 'e01',
  'Roza o limpieza lateral de vegetación': 'e01',
  'Poda selectiva de ramas bajas': 'e02',
  'Remoción de árboles/ramas caídas': 'e03',
  'Remoción de árboles/ramas riesgosas': 'e04',
  'Retiro de obstáculos sueltos': 'e05',
  'Recolección de residuos': 'e06',
  'Limpieza de mirador, descanso o área de espera': 'e07',
  'Otro (E.1)': 'e08',
  'Limpieza de cunetas o salidas de agua': 'e09',
  'Reconformación menor de huella': 'e10',
  'Retiro de sedimentos/slough/derrumbes menores': 'e11',
  'Mejora de pendiente transversal / evacuación de agua': 'e12',
  'Establecimiento o reparación menor de drenaje superficial': 'e13',
  'Colocación puntual de material estabilizante autorizado': 'e14',
  'Cierre de atajo': 'e15',
  'Otro (E.2)': 'e16',
  'Reparación menor de escalón': 'e17',
  'Reparación menor de baranda': 'e18',
  'Reparación menor de puente/pasarela': 'e19',
  'Ajuste o reposición de señal temporal': 'e20',
  'Limpieza o enderezado de rótulo existente': 'e21',
  'Colocación de cinta / aviso preventivo': 'e22',
  'Cierre temporal de punto inseguro': 'e23',
  'Otro (E.3)': 'e24'
};

function codigoDe(rotulo) {
  return CODIGOS[String(rotulo || '').trim()] || '';
}

// ─── COORDENADAS ─────────────────────────────────────────────────────────────
/**
 * Convierte CRTM05 (EPSG:5367) a latitud/longitud WGS84.
 * Google Sheets, Looker Studio, My Maps y Earth solo entienden lat/lon; la
 * coordenada original en metros se conserva intacta en sus propias columnas.
 */
function crtm05aWgs84(x, y) {
  if (!isFinite(x) || !isFinite(y) || (!x && !y)) return null;
  var a = 6378137.0, f = 1 / 298.257223563;
  var e2 = 2 * f - f * f, ep2 = e2 / (1 - e2);
  var k0 = 0.9996, FE = 500000.0, FN = 0.0, lon0 = -84.0 * Math.PI / 180;
  var M = (y - FN) / k0;
  var mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));
  var e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  var p1 = mu +
    (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) +
    (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu) +
    (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu) +
    (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);
  var sp = Math.sin(p1), cp = Math.cos(p1), tp = Math.tan(p1);
  var C1 = ep2 * cp * cp, T1 = tp * tp;
  var N1 = a / Math.sqrt(1 - e2 * sp * sp);
  var R1 = a * (1 - e2) / Math.pow(1 - e2 * sp * sp, 1.5);
  var D = (x - FE) / (N1 * k0), D2 = D * D;
  var lat = p1 - (N1 * tp / R1) * (D2 / 2 -
    (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D2 * D2 / 24 +
    (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D2 * D2 * D2 / 720);
  var lon = lon0 + (D -
    (1 + 2 * T1 + C1) * D2 * D / 6 +
    (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D2 * D2 * D / 120) / cp;
  return { lat: redondear(lat * 180 / Math.PI, 7), lon: redondear(lon * 180 / Math.PI, 7) };
}

function redondear(v, dec) {
  var m = Math.pow(10, dec);
  return Math.round(v * m) / m;
}

// ─── ACCESO A LA HOJA ────────────────────────────────────────────────────────
function libro() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/** Devuelve la pestaña con sus encabezados al día, creándola si hace falta. */
function hoja(nombre) {
  var cols = ESQUEMA[nombre];
  if (!cols) throw new Error('Pestaña desconocida: ' + nombre);
  var libroActivo = libro();
  var h = libroActivo.getSheetByName(nombre);
  if (!h) {
    h = libroActivo.insertSheet(nombre);
    h.getRange(1, 1, 1, cols.length).setValues([cols]);
    h.setFrozenRows(1);
    h.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#EEF2F8');
    return h;
  }
  // Agrega al final las columnas nuevas del esquema sin tocar los datos existentes.
  var anchoActual = Math.max(1, h.getLastColumn());
  var actuales = h.getRange(1, 1, 1, anchoActual).getValues()[0];
  var faltantes = [];
  for (var i = 0; i < cols.length; i++) {
    if (actuales.indexOf(cols[i]) === -1) faltantes.push(cols[i]);
  }
  if (faltantes.length) {
    h.getRange(1, anchoActual + 1, 1, faltantes.length).setValues([faltantes])
      .setFontWeight('bold').setBackground('#EEF2F8');
  }
  return h;
}

/** Encabezados reales de la pestaña, en su orden actual. */
function encabezados(h) {
  return h.getRange(1, 1, 1, Math.max(1, h.getLastColumn())).getValues()[0];
}

/** Ordena un objeto {columna: valor} según los encabezados reales de la pestaña. */
function aFila(enc, obj) {
  var fila = [];
  for (var i = 0; i < enc.length; i++) {
    var v = obj[enc[i]];
    fila.push(v === undefined || v === null ? '' : v);
  }
  return fila;
}

function agregarFilas(nombre, objetos) {
  if (!objetos || !objetos.length) return;
  var h = hoja(nombre);
  var enc = encabezados(h);
  var filas = objetos.map(function (o) { return aFila(enc, o); });
  h.getRange(h.getLastRow() + 1, 1, filas.length, enc.length).setValues(filas);
}

/** Borra las filas de una jornada en una pestaña hija, de abajo hacia arriba. */
function borrarFilasDeJornada(nombre, jornadaId) {
  var h = libro().getSheetByName(nombre);
  if (!h) return;
  var ultima = h.getLastRow();
  if (ultima < 2) return;
  var enc = encabezados(h);
  var col = enc.indexOf('jornada_id') + 1;
  if (col < 1) return;
  var ids = h.getRange(2, col, ultima - 1, 1).getValues();
  var fin = -1;
  for (var i = ids.length - 1; i >= 0; i--) {
    var coincide = String(ids[i][0]) === String(jornadaId);
    if (coincide && fin === -1) fin = i;
    if (!coincide && fin !== -1) {
      h.deleteRows(i + 3, fin - i);
      fin = -1;
    }
  }
  if (fin !== -1) h.deleteRows(2, fin + 1);
}

/** Busca el número de fila de una llave; 0 si no existe. */
function buscarFila(h, columna, valor) {
  var ultima = h.getLastRow();
  if (ultima < 2) return 0;
  var enc = encabezados(h);
  var col = enc.indexOf(columna) + 1;
  if (col < 1) return 0;
  var vals = h.getRange(2, col, ultima - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === String(valor)) return i + 2;
  }
  return 0;
}

// ─── CATÁLOGO ────────────────────────────────────────────────────────────────
/**
 * Devuelve el identificador del sendero, registrándolo junto con su sector y
 * área si aparece por primera vez. Así, agregar un área protegida nueva no
 * exige tocar el código: basta con que llegue un informe suyo.
 */
function idSendero(area, sector, sendero) {
  area = String(area || AREA_POR_DEFECTO).trim() || AREA_POR_DEFECTO;
  sector = String(sector || SECTOR_POR_DEFECTO).trim() || SECTOR_POR_DEFECTO;
  sendero = String(sendero || '').trim();
  if (!sendero) return '';

  var ahora = new Date();
  var hArea = hoja('areas');
  var areaId = 'AR-' + clave(area);
  if (!buscarFila(hArea, 'area_id', areaId)) {
    agregarFilas('areas', [{ area_id: areaId, nombre: area, codigo: clave(area), creada_en: ahora }]);
  }
  var sectorId = 'SC-' + clave(area) + '-' + clave(sector);
  if (!buscarFila(hoja('sectores'), 'sector_id', sectorId)) {
    agregarFilas('sectores', [{ sector_id: sectorId, area_id: areaId, nombre: sector, creado_en: ahora }]);
  }
  var senderoId = 'SD-' + clave(sector) + '-' + clave(sendero);
  if (!buscarFila(hoja('senderos'), 'sendero_id', senderoId)) {
    agregarFilas('senderos', [{
      sendero_id: senderoId, sector_id: sectorId, area_id: areaId, nombre: sendero,
      longitud_m: '', epsg: 5367, estado: 'activo', creado_en: ahora
    }]);
  }
  return senderoId;
}

/** Convierte un nombre en una clave estable, sin tildes ni espacios. */
function clave(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── NORMALIZACIÓN DEL INFORME ───────────────────────────────────────────────
function texto(v) {
  if (v === undefined || v === null) return '';
  if (Object.prototype.toString.call(v) === '[object Array]') return v.filter(String).join(', ');
  return String(v);
}

function numero(v) {
  var n = parseFloat(v);
  return isFinite(n) ? n : '';
}

function siNo(v) {
  return v === true ? 'Sí' : v === false ? 'No' : texto(v);
}

/** Convierte "07:30" en minutos desde medianoche; -1 si no es una hora válida. */
function minutosReloj(hhmm) {
  var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return -1;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** Horas persona de la jornada, en minutos: base para comparar esfuerzo entre jornadas. */
function minutosPersona(filas) {
  var total = 0;
  for (var i = 0; i < filas.length; i++) {
    var r = filas[i];
    var parciales = parseFloat(r.horasParciales);
    if (r.parcial && isFinite(parciales)) { total += Math.round(parciales * 60); continue; }
    var ini = minutosReloj(r.ini), fin = minutosReloj(r.fin);
    if (ini >= 0 && fin > ini) total += fin - ini;
  }
  return total;
}

/** Parte el JSON original en trozos que quepan en celdas de la hoja. */
function trozos(json) {
  var out = ['', '', ''];
  for (var i = 0; i < 3; i++) {
    out[i] = json.substr(i * TROZO_JSON, TROZO_JSON);
  }
  return out;
}

/**
 * Convierte el informe de la aplicación en las filas de cada pestaña.
 * Devuelve { jornada: {...}, hijas: { participantes: [...], ... } }.
 */
function normalizar(p) {
  var s = p.sections || {};
  var a = s.a_data || {};
  var ctx = p.context || {};
  var ahora = new Date();

  var area = a.area || AREA_POR_DEFECTO;
  var sector = a.sector || SECTOR_POR_DEFECTO;
  var sendero = a.sendero || ctx.sendero || '';
  var senderoId = idSendero(area, sector, sendero);
  var jornadaId = p.jornada_id;
  var hijas = {};

  // B — equipo y horario
  var horario = s.b_schedule || {};
  var filasB = s.b_rows || [];
  hijas.participantes = filasB.map(function (r, i) {
    return {
      jornada_id: jornadaId, fila: i + 1, fecha: texto(r.fecha), nombre: texto(r.nombre),
      tipo: texto(r.tipo), encargado: siNo(r.encargado), hora_ini: texto(r.ini), hora_fin: texto(r.fin),
      parcial: siNo(r.parcial), horas_parciales: numero(r.horasParciales)
    };
  });
  var fechas = {};
  filasB.forEach(function (r) { if (r.fecha) fechas[r.fecha] = true; });
  var listaFechas = Object.keys(fechas).sort();

  // C — tramos atendidos
  var totalMetros = 0;
  hijas.tramos = (s.c_tramos || []).map(function (t, i) {
    var ini = parseFloat(t.estIni), fin = parseFloat(t.estFin);
    var largo = (isFinite(ini) && isFinite(fin)) ? Math.abs(fin - ini) : '';
    if (largo !== '') totalMetros += largo;
    var gi = t.ptIni ? crtm05aWgs84(t.ptIni.x, t.ptIni.y) : null;
    var gf = t.ptFin ? crtm05aWgs84(t.ptFin.x, t.ptFin.y) : null;
    return {
      jornada_id: jornadaId, fila: i + 1, nombre: texto(t.nombre),
      seccion_auto: siNo(!!t.autoSegment), seccion_numero: numero(t.segmentNumber),
      est_ini_m: numero(t.estIni), est_fin_m: numero(t.estFin),
      longitud_m: largo === '' ? '' : Math.round(largo),
      x_ini: t.ptIni ? numero(t.ptIni.x) : '', y_ini: t.ptIni ? numero(t.ptIni.y) : '',
      lat_ini: gi ? gi.lat : '', lon_ini: gi ? gi.lon : '',
      x_fin: t.ptFin ? numero(t.ptFin.x) : '', y_fin: t.ptFin ? numero(t.ptFin.y) : '',
      lat_fin: gf ? gf.lat : '', lon_fin: gf ? gf.lon : '',
      superficie: texto(t.sup), pendiente: texto(t.pend)
    };
  });

  // D — condición encontrada
  var d = s.d_data || {};
  var sevsD = d.sevs || {};
  hijas.hallazgos = (d.activeProbs || []).map(function (prob) {
    return {
      jornada_id: jornadaId, codigo: codigoDe(prob), problema: texto(prob),
      severidad: texto(sevsD[prob]), detalle_otro: prob === 'Otro' ? texto(d.otroText) : ''
    };
  });

  // E — trabajo realizado
  var e = s.e_data || {};
  var otrosE = e.otroTexts || {};
  var sevsE = e.sevs || {};
  hijas.acciones = (e.checked || []).map(function (acc) {
    return {
      jornada_id: jornadaId, codigo: codigoDe(acc), accion: texto(acc),
      nivel: texto(sevsE[acc]), detalle_otro: texto(otrosE[acc])
    };
  });

  // G — seguridad
  var g = s.g1_data || {};
  var incDet = g.incDet || {};
  hijas.seguridad = (g.g1 || []).map(function (item) {
    return {
      jornada_id: jornadaId, item: texto(item), cumplido: 'Sí',
      detalle: item === 'Otro' ? texto(g.otroG1) : ''
    };
  });

  // H — recursos usados
  var h = s.h_data || {};
  var tabla = h.tableData || {};
  hijas.recursos = (h.checked || []).map(function (rec) {
    var fila = tabla[rec] || {};
    return {
      jornada_id: jornadaId, recurso: texto(rec), cantidad: numero(fila.cantidad),
      unidad: texto(fila.unidad), estado: texto(fila.estado),
      observacion: texto(fila.comentario || fila.observacion), personalizado: 'No'
    };
  }).concat((h.custom || []).filter(function (c) { return c && c.nombre; }).map(function (c) {
    return {
      jornada_id: jornadaId, recurso: texto(c.nombre), cantidad: numero(c.cantidad),
      unidad: texto(c.unidad), estado: texto(c.estado),
      observacion: texto(c.comentario || c.observacion), personalizado: 'Sí'
    };
  }));

  // I — resultados, en formato largo para poder graficarlos en el tiempo
  var iF = s.i_fields || {};
  var INDICADORES = [
    ['drenajes', 'Drenajes atendidos'], ['arboles', 'Árboles o ramas retiradas'],
    ['estructuras', 'Estructuras reparadas'], ['senales', 'Señales atendidas'],
    ['residuos', 'Residuos retirados']
  ];
  hijas.resultados = [];
  INDICADORES.forEach(function (par) {
    var v = numero(iF[par[0]]);
    if (v !== '') hijas.resultados.push({
      jornada_id: jornadaId, indicador: par[1], cantidad: v, detalle: ''
    });
  });
  if (iF.otroCantidad || iF.otroDetalle) {
    hijas.resultados.push({
      jornada_id: jornadaId, indicador: 'Otro', cantidad: numero(iF.otroCantidad),
      detalle: texto(iF.otroDetalle)
    });
  }

  // J — evidencia fotográfica (las imágenes llegan en una etapa posterior)
  hijas.fotos = (s.j_fotos || []).map(function (fo, i) {
    return {
      jornada_id: jornadaId, fila: i + 1, nombre: texto(fo.nombre),
      descripcion: texto(fo.desc), categoria: texto(fo.categoria), drive_url: ''
    };
  });

  // K — pendientes de seguimiento
  var k = s.k_data || {};
  var criticos = {};
  (k.crit || []).forEach(function (c) { criticos[c] = true; });
  hijas.pendientes = (k.rows || []).map(function (r, i) {
    return {
      jornada_id: jornadaId, fila: i + 1, identificador: texto(r.idTxt), situacion: texto(r.situacion),
      severidad: texto(r.sev), accion: texto(r.accion), viene_de_diagnostico: siNo(!!r.fromD),
      codigo_diagnostico: codigoDe(r.dKey), critico: siNo(!!criticos[r.id] || !!criticos[r.idTxt]),
      estado: 'abierto'
    };
  });

  // Puntos georreferenciados (etapa 3): se guardan si el informe ya los trae.
  hijas.puntos = (s.puntos || []).map(function (pt) {
    var g2 = (pt.x || pt.y) ? crtm05aWgs84(pt.x, pt.y) : null;
    return {
      punto_id: texto(pt.punto_id || pt.id), jornada_id: jornadaId, sendero_id: senderoId,
      sendero: sendero, tipo: texto(pt.tipo), codigo: texto(pt.codigo || codigoDe(pt.categoria)),
      categoria: texto(pt.categoria), estacion_m: numero(pt.estacion_m),
      x: numero(pt.x), y: numero(pt.y),
      lat: pt.lat !== undefined ? numero(pt.lat) : (g2 ? g2.lat : ''),
      lon: pt.lon !== undefined ? numero(pt.lon) : (g2 ? g2.lon : ''),
      precision_m: numero(pt.precision_m), desvio_m: numero(pt.desvio_m),
      metodo_captura: texto(pt.metodo_captura), severidad: texto(pt.severidad),
      estado: texto(pt.estado || 'abierto'), descripcion: texto(pt.descripcion),
      punto_padre: texto(pt.punto_padre), creado_en: texto(pt.creado_en) || ahora, cerrado_en: ''
    };
  });

  var l = s.l_data || {};
  var m = s.m_data || {};
  var k1 = k.k1 || {};
  var json = JSON.stringify(p);
  var pedazos = trozos(json);

  var jornada = {
    jornada_id: jornadaId,
    actualizado_en: ahora,
    estado: texto(p.estado || 'borrador'),
    app_version: texto(p.version),
    dispositivo: texto(p.dispositivo),
    area: area, sector: sector, sendero: sendero, sendero_id: senderoId,
    fecha_ini: texto(a.fechaIni || horario.fecha || listaFechas[0] || ''),
    fecha_fin: texto(a.fechaFin || listaFechas[listaFechas.length - 1] || ''),
    hora_ini: texto(horario.ini), hora_fin: texto(horario.fin),
    oficio: texto(a.oficio), oficio_num: texto(a.oficioNum),
    tipo_intervencion: texto(a.tipoInterv), origen: texto(a.origen), clima: texto(a.clima),
    restriccion: texto(a.restriccion), restriccion_detalle: texto(a.restrDet),
    dias_efectivos: listaFechas.length,
    participantes_n: hijas.participantes.length,
    horas_persona_min: minutosPersona(filasB),
    total_metros: Math.round(totalMetros),
    tramos_n: hijas.tramos.length,
    puntos_n: hijas.puntos.length,
    hallazgos_n: hijas.hallazgos.length,
    acciones_n: hijas.acciones.length,
    pendientes_n: hijas.pendientes.length,
    fotos_n: hijas.fotos.length,
    condicion_final: numero(l.condFinalRating),
    condicion_final_texto: texto(l.condFinal),
    justificacion: texto(l.justif || l.justifOther),
    recomendacion: texto(l.recom),
    responsable: texto(m.nombre), responsable_oficio: texto(m.oficio),
    incidente: texto(g.incidente),
    incidente_tipo: texto(incDet.tipo),
    incidente_persona: texto(incDet.persona || incDet.personaSel),
    incidente_atencion: texto(incDet.atencion),
    incidente_reporte: texto(incDet.reporte),
    seguimiento: texto(iF.seguimiento),
    recursos_comentario: texto(h.generalComment),
    k_cierre: texto(k1.cierre), k_senal: texto(k1.senal), k_compra: texto(k1.compra),
    k_detalle_compra: texto(k1.detalleCompra),
    raw_1: pedazos[0], raw_2: pedazos[1], raw_3: pedazos[2],
    _caracteres: json.length,
    _truncado: json.length > TROZO_JSON * 3
  };

  return { jornada: jornada, hijas: hijas };
}

// ─── ESCRITURA ───────────────────────────────────────────────────────────────
/**
 * Guarda el informe. La llave es jornada_id: un mismo informe enviado muchas
 * veces (la aplicación respalda cada vez que hay cambios) actualiza su fila en
 * lugar de duplicarla, y por eso reintentar un envío nunca ensucia los datos.
 */
function guardarInforme(p) {
  var normalizado = normalizar(p);
  var j = normalizado.jornada;
  var hJornadas = hoja('jornadas');
  var enc = encabezados(hJornadas);
  var fila = buscarFila(hJornadas, 'jornada_id', j.jornada_id);
  var envios = 1;

  if (fila) {
    var previos = hJornadas.getRange(fila, 1, 1, enc.length).getValues()[0];
    var iRecibido = enc.indexOf('recibido_en'), iEnvios = enc.indexOf('envios');
    if (iRecibido >= 0 && previos[iRecibido]) j.recibido_en = previos[iRecibido];
    if (iEnvios >= 0) envios = (parseInt(previos[iEnvios], 10) || 0) + 1;
    j.envios = envios;
    hJornadas.getRange(fila, 1, 1, enc.length).setValues([aFila(enc, j)]);
  } else {
    j.recibido_en = j.actualizado_en;
    j.envios = 1;
    hJornadas.getRange(hJornadas.getLastRow() + 1, 1, 1, enc.length).setValues([aFila(enc, j)]);
  }

  // Las filas hijas se reescriben completas: son el detalle de esta versión.
  for (var i = 0; i < HIJAS.length; i++) {
    var nombre = HIJAS[i];
    borrarFilasDeJornada(nombre, j.jornada_id);
    agregarFilas(nombre, normalizado.hijas[nombre] || []);
  }

  agregarFilas('bitacora', [{
    recibido_en: new Date(), jornada_id: j.jornada_id, estado: j.estado, sendero: j.sendero,
    caracteres: j._caracteres, resultado: fila ? 'actualizado' : 'nuevo',
    detalle: j._truncado ? 'JSON original truncado' : ''
  }]);

  return {
    ok: true, jornada_id: j.jornada_id, accion: fila ? 'actualizado' : 'nuevo',
    envios: envios, truncado: !!j._truncado
  };
}

/**
 * Carga el catálogo de áreas, sectores, senderos y su geometría.
 * Se envía una sola vez desde la aplicación; a partir de ahí la hoja es la
 * fuente de la verdad y agregar un sendero no exige volver a publicar el sitio.
 */
function guardarCatalogo(p) {
  var ahora = new Date();
  var senderos = p.senderos || [];
  var creados = 0, geometrias = 0;

  for (var i = 0; i < senderos.length; i++) {
    var sd = senderos[i];
    var senderoId = idSendero(sd.area, sd.sector, sd.nombre);
    if (!senderoId) continue;
    creados++;
    var h = hoja('senderos');
    var fila = buscarFila(h, 'sendero_id', senderoId);
    if (fila) {
      var enc = encabezados(h);
      var colLargo = enc.indexOf('longitud_m') + 1;
      if (colLargo > 0 && sd.longitud_m) h.getRange(fila, colLargo).setValue(numero(sd.longitud_m));
      var colEstado = enc.indexOf('estado') + 1;
      if (colEstado > 0 && sd.estado) h.getRange(fila, colEstado).setValue(texto(sd.estado));
    }
    if (sd.puntos && sd.puntos.length) {
      borrarGeometria(senderoId);
      var filas = sd.puntos.map(function (pt, k) {
        var g = crtm05aWgs84(pt.x, pt.y);
        return {
          sendero_id: senderoId, seq: k + 1, x: numero(pt.x), y: numero(pt.y),
          lat: g ? g.lat : '', lon: g ? g.lon : ''
        };
      });
      agregarFilas('geometria_senderos', filas);
      geometrias += filas.length;
    }
  }
  agregarFilas('bitacora', [{
    recibido_en: ahora, jornada_id: '(catálogo)', estado: 'catalogo', sendero: '',
    caracteres: JSON.stringify(p).length, resultado: 'cargado',
    detalle: creados + ' senderos, ' + geometrias + ' vértices'
  }]);
  return { ok: true, senderos: creados, vertices: geometrias };
}

function borrarGeometria(senderoId) {
  var h = libro().getSheetByName('geometria_senderos');
  if (!h) return;
  var ultima = h.getLastRow();
  if (ultima < 2) return;
  var ids = h.getRange(2, 1, ultima - 1, 1).getValues();
  var fin = -1;
  for (var i = ids.length - 1; i >= 0; i--) {
    var coincide = String(ids[i][0]) === String(senderoId);
    if (coincide && fin === -1) fin = i;
    if (!coincide && fin !== -1) { h.deleteRows(i + 3, fin - i); fin = -1; }
  }
  if (fin !== -1) h.deleteRows(2, fin + 1);
}

// ─── PUNTOS DE ENTRADA ───────────────────────────────────────────────────────
function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return respuesta({ ok: false, error: 'ocupado', mensaje: 'Otro envío está en proceso. Reintente.' });
  }
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respuesta({ ok: false, error: 'sin_datos' });
    }
    var p = JSON.parse(e.postData.contents);
    if (TOKEN && p.token !== TOKEN) {
      return respuesta({ ok: false, error: 'token_invalido' });
    }
    if (p.tipo === 'catalogo') {
      return respuesta(guardarCatalogo(p));
    }
    if (p.app !== APP_ESPERADA || !p.sections) {
      return respuesta({ ok: false, error: 'formato_desconocido' });
    }
    if (!p.jornada_id) {
      return respuesta({ ok: false, error: 'sin_jornada_id' });
    }
    return respuesta(guardarInforme(p));
  } catch (err) {
    try {
      agregarFilas('bitacora', [{
        recibido_en: new Date(), jornada_id: '(error)', estado: '', sendero: '',
        caracteres: '', resultado: 'error', detalle: String(err && err.message || err)
      }]);
    } catch (err2) { /* la bitácora nunca debe impedir la respuesta */ }
    return respuesta({ ok: false, error: 'excepcion', mensaje: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var accion = (e && e.parameter && e.parameter.accion) || 'ping';
  if (accion === 'ping') {
    return respuesta({ ok: true, servicio: 'respaldo-senderos', hora: new Date().toISOString() });
  }
  if (accion === 'catalogo') {
    if (TOKEN && (!e.parameter || e.parameter.token !== TOKEN)) {
      return respuesta({ ok: false, error: 'token_invalido' });
    }
    return respuesta({ ok: true, catalogo: leerCatalogo() });
  }
  return respuesta({ ok: false, error: 'accion_desconocida' });
}

/** Catálogo que la aplicación leerá en la etapa 2 para dejar de tenerlo en el código. */
function leerCatalogo() {
  var out = { areas: [], sectores: [], senderos: [] };
  ['areas', 'sectores', 'senderos'].forEach(function (nombre) {
    var h = libro().getSheetByName(nombre);
    if (!h || h.getLastRow() < 2) return;
    var enc = encabezados(h);
    var vals = h.getRange(2, 1, h.getLastRow() - 1, enc.length).getValues();
    out[nombre] = vals.map(function (fila) {
      var o = {};
      for (var i = 0; i < enc.length; i++) o[enc[i]] = fila[i];
      return o;
    });
  });
  return out;
}

// ─── INSTALACIÓN Y PRUEBA ────────────────────────────────────────────────────
/** Crea todas las pestañas con sus encabezados. Ejecutar una vez tras pegar el código. */
function configurar() {
  Object.keys(ESQUEMA).forEach(function (nombre) { hoja(nombre); });
  var predeterminada = libro().getSheetByName('Hoja 1') || libro().getSheetByName('Sheet1');
  if (predeterminada && predeterminada.getLastRow() === 0) libro().deleteSheet(predeterminada);
  SpreadsheetApp.getActive().toast('Pestañas listas: ' + Object.keys(ESQUEMA).length);
}

/** Inserta un informe de prueba para verificar la instalación de punta a punta. */
function probar() {
  var r = guardarInforme({
    jornada_id: 'PRUEBA-0001',
    app: APP_ESPERADA,
    version: 'prueba',
    estado: 'borrador',
    dispositivo: 'editor de Apps Script',
    context: { sendero: 'Barajas' },
    sections: {
      a_data: { sector: 'Los Quetzales', sendero: 'Barajas', fechaIni: '2026-01-15', oficio: 'PRUEBA-001' },
      b_rows: [{ fecha: '2026-01-15', nombre: 'Prueba', tipo: 'funcionario', ini: '08:00', fin: '16:00', encargado: true }],
      c_tramos: [{ estIni: '100', estFin: '350', ptIni: { x: 519964, y: 1062280 }, ptFin: { x: 520038, y: 1062297 }, sup: 'Tierra' }],
      d_data: { activeProbs: ['Cárcavas o pérdida acelerada de suelo'], sevs: { 'Cárcavas o pérdida acelerada de suelo': 'Alta' } },
      e_data: { checked: ['Limpieza de cunetas o salidas de agua'], sevs: {}, otroTexts: {} }
    }
  });
  Logger.log(JSON.stringify(r));
  return r;
}

/** Borra el informe de prueba. */
function borrarPrueba() {
  var h = hoja('jornadas');
  var fila = buscarFila(h, 'jornada_id', 'PRUEBA-0001');
  if (fila) h.deleteRow(fila);
  HIJAS.forEach(function (n) { borrarFilasDeJornada(n, 'PRUEBA-0001'); });
  SpreadsheetApp.getActive().toast('Informe de prueba eliminado.');
}
