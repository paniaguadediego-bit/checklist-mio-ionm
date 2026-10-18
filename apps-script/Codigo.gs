/*
 * MIO-Check — Reconstrucción del Google Sheet desde el repositorio de datos
 * ==========================================================================
 *
 * Qué hace: lee los catálogos y los casos del repositorio privado de datos,
 * y RECONSTRUYE ENTERAS las hojas Casos, Tecnicas_long, Material_long,
 * Correlacion_long, Listas y Meta. Nunca actualiza fila a fila.
 *
 * De ahí salen gratis tres cosas:
 *   - Una técnica nueva crea su columna TEC_<etiqueta> sola, con su hermana
 *     "TEC_<etiqueta> - alteración" (1 si esa técnica tuvo algún cambio o
 *     aviso durante la cirugía, marcado a mano al cerrar el caso).
 *   - Renombrar una técnica se propaga a todo el histórico, porque las
 *     columnas se generan resolviendo el id contra el catálogo actual.
 *   - El Sheet es desechable: si algo se rompe, se borra y se reconstruye.
 *
 * ---------------------------------------------------------------------
 * CAMBIOS DE LA VERSIÓN SEUDÓNIMA (18-10-2026, esquema 2)
 * ---------------------------------------------------------------------
 * Por qué: desde el esquema 2 la app ya no sube al repositorio el nombre del
 * caso, el supervisor, el texto del centro, el personal de quirófano, la
 * firma, las imágenes ni la fecha/hora reales: sube el mes, la edad en
 * tramos de 5 y el tiempo en minutos desde la incisión. Este Sheet tiene que
 * ser homogéneo y NO enseñar más de lo que enseña un caso nuevo, aunque el
 * repositorio todavía tenga casos antiguos (esquema 1, congelados, con fecha
 * y edad exactas y horas HH:MM). Por eso este script lee los DOS esquemas y
 * lo reduce todo al volcarlo:
 *   - Fecha de todas las hojas = mes y año (se escribe como fecha del día 1
 *     con formato aaaa-mm, para que Looker la siga tratando como fecha).
 *   - edad = tramo ("45-49", "90+"); el esquema 1 se convierte aquí.
 *   - Horas = minutos desde la incisión (min_inicio, min_fin; en
 *     Correlacion_long, Min_inicio y Min_fin). Un caso antiguo (HH:MM) solo
 *     se puede convertir si tiene marcado el hito "Incisión"; si no, la celda
 *     queda vacía, igual que en el CSV de la app.
 *   - Fuera: nombre_caso, supervisor, texto del centro (ahora centro_id y
 *     centro_codigo), guardado_en y ultima_edicion reales (ahora
 *     guardado_mes y ultima_edicion_mes, solo el mes) y la hora de la última
 *     sincronización (ahora solo el mes de la reconstrucción).
 *   - Nuevo: rev (contador de guardados), centro_id/centro_codigo, y en Meta
 *     el espacio (espacio_id del estado.json), el recuento por esquema y un
 *     AVISO si un caso de esquema 2 trae algún dato exacto (no se vuelca).
 *   - CONGELADO = 1 (más abajo) para un hospital archivado: no reconstruye ni
 *     reprograma nada y el Sheet se queda tal cual.
 *   - Se quita el valor por defecto de REPO_CODIGO: el destino va SOLO en las
 *     Script Properties.
 *   Se conserva todo lo demás: evolucion_postop, Magnitud_pct, equipo
 *   Inomed/Cadwell/Genérico, Tecnicas_long, Material_long, Correlacion_long,
 *   Listas y Meta. La lógica de la correlación de alarmas NO se repite aquí:
 *   la deja ya calculada la app en correlato_filas.
 *   Ojo: cambian los nombres de algunas columnas (nombre_caso, supervisor,
 *   centro, hora_inicio, hora_fin, ultima_edicion, guardado_en,
 *   Hora_inicio, Hora_fin). Si un informe de Looker las usaba, hay que
 *   reconectarlo con las nuevas.
 *
 * CÓMO PEGARLO: en el Sheet, Extensiones → Apps Script; borrar TODO el
 * contenido del editor, pegar este archivo entero, guardar, ejecutar
 * crearDisparadorDiario() una vez (▶) y luego menú "MIO-Check →
 * Reconstruir ahora". Las tres Script Properties (GITHUB_TOKEN, REPO_DATOS,
 * REPO_CODIGO) deben estar rellenas.
 */

/* ------------------------------------------------------------------ *
 * Configuración
 * ------------------------------------------------------------------ */

// 1 = hospital archivado: no reconstruye ni reprograma nada (el Sheet queda
// como está) y crearDisparadorDiario() solo quita el disparador que hubiera.
// Para congelar un Sheet: poner 1, guardar y ejecutar crearDisparadorDiario().
var CONGELADO = 0;

// Versión del modelo de columnas de este Sheet (aparece en Meta).
var ESQUEMA_SHEET = 2;

// Nombre de las hojas que este script posee por completo. Cualquier otra
// hoja del documento (por ejemplo, las que construyas tú en Looker) no se
// toca nunca.
var HOJAS = {
  CASOS: "Casos",
  TECNICAS_LONG: "Tecnicas_long",
  MATERIAL_LONG: "Material_long",
  CORRELACION_LONG: "Correlacion_long",
  LISTAS: "Listas",
  META: "Meta"
};

function obtenerConfig_() {
  var p = PropertiesService.getScriptProperties();
  var token = p.getProperty("GITHUB_TOKEN");
  var repoDatos = p.getProperty("REPO_DATOS");
  var repoCodigo = p.getProperty("REPO_CODIGO");
  var ramaCodigo = p.getProperty("REPO_CODIGO_RAMA") || "main";
  if (!token) throw new Error("Falta la Script Property GITHUB_TOKEN. Ve a Configuración del proyecto → Script Properties.");
  if (!repoDatos) throw new Error("Falta la Script Property REPO_DATOS (formato usuario/repositorio).");
  if (!repoCodigo) throw new Error("Falta la Script Property REPO_CODIGO (formato usuario/repositorio del código público).");
  return { token: token, repoDatos: repoDatos, repoCodigo: repoCodigo, ramaCodigo: ramaCodigo };
}

/* ------------------------------------------------------------------ *
 * GitHub: lectura
 * ------------------------------------------------------------------ */

function cabecerasGitHub_(token) {
  var h = { "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (token) h["Authorization"] = "Bearer " + token;
  return h;
}

function decodificarBase64Utf8_(b64) {
  var bytes = Utilities.base64Decode(b64.replace(/\n/g, ""));
  return Utilities.newBlob(bytes).getDataAsString("UTF-8");
}

// GET de un archivo del repositorio PRIVADO vía Contents API, autenticado.
function leerArchivo_(repo, ruta, token) {
  var url = "https://api.github.com/repos/" + repo + "/contents/" + ruta;
  var resp = UrlFetchApp.fetch(url, { headers: cabecerasGitHub_(token), muteHttpExceptions: true });
  var code = resp.getResponseCode();
  if (code === 404) return null;
  if (code !== 200) throw new Error("GitHub respondió " + code + " leyendo " + ruta + ": " + resp.getContentText());
  var json = JSON.parse(resp.getContentText());
  return decodificarBase64Utf8_(json.content);
}

/* GET de un archivo del repositorio PÚBLICO vía raw.githubusercontent.com,
   sin pasar por la API ni por el token.
   Esto no es una elección arbitraria: la API de contenidos SIN autenticar
   tiene un límite de 60 peticiones/hora que comparten TODOS los scripts de
   Apps Script que salen por la misma IP de Google -no solo los tuyos-, así
   que se agota con muy poco uso y da "403 API rate limit exceeded" sin
   avisar. El token de solo lectura tampoco vale aquí: está circunscrito
   solo al repositorio de datos, no al del código. raw.githubusercontent.com
   es un reparto de contenido aparte, con un límite mucho más alto y no
   compartido por ese motivo. */
function leerArchivoPublicoRaw_(repo, rama, ruta) {
  var url = "https://raw.githubusercontent.com/" + repo + "/" + rama + "/" + ruta;
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var code = resp.getResponseCode();
  if (code === 404) return null;
  if (code !== 200) throw new Error("GitHub respondió " + code + " leyendo " + ruta + " de " + repo + ": " + resp.getContentText());
  return resp.getContentText();
}

// Lista el contenido de una carpeta. Devuelve [] si la carpeta no existe
// todavía (repositorio recién creado, o casos/ antes del primer caso).
function listarCarpeta_(repo, ruta, token) {
  var url = "https://api.github.com/repos/" + repo + "/contents/" + ruta;
  var resp = UrlFetchApp.fetch(url, { headers: cabecerasGitHub_(token), muteHttpExceptions: true });
  var code = resp.getResponseCode();
  if (code === 404) return [];
  if (code !== 200) throw new Error("GitHub respondió " + code + " listando " + ruta + ": " + resp.getContentText());
  return JSON.parse(resp.getContentText());
}

/* data/surgeries.js no es JSON puro: lleva comentarios de bloque entre las
   propiedades, porque está pensado para cargarse con una etiqueta <script>,
   no con fetch+JSON.parse (así lo explica su propia cabecera). Se evalúa
   como el código JS que es -exactamente igual que hace el navegador- en vez
   de intentar limpiar los comentarios a mano, que sería frágil ante
   cualquier comentario que no se haya previsto. */
function evaluarSurgeriesJs_(codigoJs) {
  var falsoWindow = {};
  var fn = new Function("window", codigoJs + "\nreturn window.SURGERIES_DATA;");
  return fn(falsoWindow);
}

/* ------------------------------------------------------------------ *
 * Catálogos: misma fusión que hace app.js (base + propios + orden,
 * respetando los borrados), para que el Sheet vea los catálogos
 * exactamente como los ve la persona que los edita en la web.
 * ------------------------------------------------------------------ */

function fusionarCatalogo_(base, meta) {
  meta = meta || {};
  var propios = meta.propios || [];
  var orden = meta.orden || [];
  var borrados = meta.borrados || [];

  var lista = [];
  var indice = {};
  base.forEach(function (e) {
    if (borrados.indexOf(e.id) !== -1) return;
    var copia = clonarObjeto_(e);
    indice[copia.id] = copia;
    lista.push(copia);
  });
  propios.forEach(function (e) {
    if (borrados.indexOf(e.id) !== -1) return;
    var copia = clonarObjeto_(e);
    copia.propio = true;
    var previo = indice[copia.id];
    if (previo) lista[lista.indexOf(previo)] = copia;
    else lista.push(copia);
    indice[copia.id] = copia;
  });

  if (orden.length) {
    var posBase = {};
    lista.forEach(function (e, i) { posBase[e.id] = i; });
    lista.sort(function (a, b) {
      var ia = orden.indexOf(a.id), ib = orden.indexOf(b.id);
      if (ia === -1) ia = orden.length + posBase[a.id];
      if (ib === -1) ib = orden.length + posBase[b.id];
      return ia - ib;
    });
  }
  return { lista: lista, indice: indice };
}

function clonarObjeto_(o) {
  var c = {};
  for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) c[k] = o[k];
  return c;
}

function construirCatalogos_(baseData, catalogosGuardados) {
  catalogosGuardados = catalogosGuardados || {};
  var t = fusionarCatalogo_(baseData.tecnicas || [], catalogosGuardados.tecnicas);
  var s = fusionarCatalogo_(baseData.servicios || [], catalogosGuardados.servicios);
  var i = fusionarCatalogo_(baseData.intervenciones || [], catalogosGuardados.intervenciones);
  // Centros (estudio multicéntrico): vacío de fábrica, solo los propios del
  // estado.json. Del catálogo solo se vuelcan id y código, nunca el nombre.
  var ce = fusionarCatalogo_(baseData.centros || [], catalogosGuardados.centros);
  return {
    tecnicas: t.lista, TECS: t.indice,
    servicios: s.lista, SERV: s.indice,
    intervenciones: i.lista, INTERV: i.indice,
    centros: ce.lista, CENTS: ce.indice
  };
}

/* ------------------------------------------------------------------ *
 * Casos: descarga en lote y validación de cada archivo
 * ------------------------------------------------------------------ */

// Descarga todos los casos de una vez con fetchAll. Un fallo de RED o de la
// API (código distinto de 200) aborta la reconstrucción entera sin tocar el
// Sheet: es justo la situación de "descarga a mitad" que no debe dejar nada
// a medias. Un archivo que sí llega pero no se puede interpretar (JSON roto,
// sin caso_uid) no aborta: se guarda como aviso en Meta y se ignora ese caso,
// porque es un problema del dato, no de la descarga.
function descargarCasos_(repo, token) {
  var listado = listarCarpeta_(repo, "casos", token)
    .filter(function (f) { return f.type === "file" && /\.json$/.test(f.name); });

  if (!listado.length) return { casos: [], malformados: [] };

  var peticiones = listado.map(function (f) {
    return { url: f.url, headers: cabecerasGitHub_(token), muteHttpExceptions: true };
  });
  var respuestas = UrlFetchApp.fetchAll(peticiones);

  var casos = [];
  var malformados = [];
  for (var i = 0; i < respuestas.length; i++) {
    var nombre = listado[i].name;
    var resp = respuestas[i];
    if (resp.getResponseCode() !== 200) {
      // Esto sí es un fallo de descarga: se aborta todo.
      throw new Error("La descarga de casos falló en " + nombre + " (código " + resp.getResponseCode() + "). No se toca el Sheet.");
    }
    try {
      var json = JSON.parse(resp.getContentText());
      var contenido = decodificarBase64Utf8_(json.content);
      var caso = JSON.parse(contenido);
      if (!caso || !caso.caso_uid) throw new Error("sin caso_uid");
      casos.push(caso);
    } catch (e) {
      malformados.push({ archivo: nombre, motivo: e.message });
    }
  }
  return { casos: casos, malformados: malformados };
}

/* ------------------------------------------------------------------ *
 * Seudonimización al volcar: mes, tramo de edad y minutos desde la
 * incisión. Son funciones puras (sin APIs de Google). Hacen lo mismo que
 * mesDe(), tramoEdad() y tMinRelCaso() de app.js, que es lo que usa el CSV
 * de la app; si cambia una, hay que revisar la otra. Se aplican SIEMPRE, a
 * los dos esquemas: así un caso antiguo no enseña más que uno nuevo, y si
 * un caso nuevo trajera por error un dato exacto, tampoco llega a las hojas.
 * ------------------------------------------------------------------ */

// 1 = antiguo (congelado: fecha y edad exactas, horas HH:MM); 2 = seudónimo.
function esquemaDe_(c) {
  return c && typeof c.version_esquema === "number" ? c.version_esquema : 1;
}

// "2026-10-05" o "2026-10-05T10:22:00Z" -> "2026-10"; vacío si no es una fecha.
function mesDe_(v) {
  var m = /^(\d{4})-(\d{2})/.exec(String(v == null ? "" : v));
  return m ? m[1] + "-" + m[2] : "";
}

// El mes como fecha (día 1, a mediodía UTC para que el redondeo de zona
// horaria de Sheets/Looker nunca la haga caer en otro mes). Se escribe con
// formato aaaa-mm, así que en pantalla solo se ve el mes.
function aMes_(v) {
  var mes = mesDe_(v);
  if (!mes) return "";
  var p = mes.split("-");
  return new Date(Date.UTC(+p[0], +p[1] - 1, 1, 12, 0, 0));
}

function esTramoEdad_(e) {
  return typeof e === "string" && /^\s*\d+\s*[-+]\s*\d*\s*$/.test(e);
}

// Edad exacta -> tramo de 5 ("40-44"); desde 90, "90+"; un tramo ya hecho
// se deja como está; lo que no se entiende queda vacío (nunca se copia).
function tramoEdad_(e) {
  if (esTramoEdad_(e)) return e.replace(/\s+/g, "");
  if (e === "" || e == null) return "";
  var n = Number(e);
  if (!isFinite(n) || n < 0) return "";
  if (n >= 90) return "90+";
  var lo = Math.floor(n / 5) * 5;
  return lo + "-" + (lo + 4);
}

function esNumero_(v) { return typeof v === "number" && isFinite(v); }

// "HH:MM" -> minutos del día; null si no es una hora.
function minutosDelDia_(v) {
  var m = /^(\d{1,2}):(\d{2})/.exec(typeof v === "string" ? v : "");
  return m ? (+m[1]) * 60 + (+m[2]) : null;
}

// Minutos desde la incisión de un valor de tiempo: un número ya es eso (esquema
// 2); un "HH:MM" antiguo se convierte con la hora de la incisión del propio
// caso (hito h_incision del Registro) y, sin ella, queda vacío. 0 es un valor
// válido, por eso se comprueba el tipo y no si es "verdadero".
function minRelValor_(c, raw) {
  if (esNumero_(raw)) return raw;
  var m = minutosDelDia_(raw);
  if (m === null) return "";
  var v = c && c.registro_intraop && c.registro_intraop.v ? c.registro_intraop.v : null;
  // Solo una incisión en HH:MM sirve de referencia: si ya es un número, es el 0.
  var r = v && !esNumero_(v.h_incision_min) ? minutosDelDia_(v.h_incision) : null;
  if (r === null) return "";
  var x = m - r;
  while (x < -360) x += 1440;
  while (x >= 1080) x -= 1440;
  return x;
}

// Campo de tiempo de un objeto: el hermano numérico "<campo>_min" si existe;
// si no, el HH:MM antiguo.
function minRelCampo_(c, obj, campo) {
  if (!obj) return "";
  var n = obj[campo + "_min"];
  return minRelValor_(c, esNumero_(n) ? n : (obj[campo] || ""));
}

// Campos de un caso de esquema 2 que traen algún dato exacto (no debería
// pasar). Solo sirve para avisar en Meta: nada de esto se vuelca a las hojas.
function camposExactosEsquema2_(c) {
  var malos = [];
  if (esquemaDe_(c) < 2) return malos;
  ["nombre_caso", "supervisor", "centro"].forEach(function (k) { if (c[k]) malos.push(k); });
  if (c.fecha && /^\d{4}-\d{2}-\d{2}/.test(String(c.fecha))) malos.push("fecha");
  if (c.edad !== "" && c.edad != null && !esTramoEdad_(c.edad)) malos.push("edad");
  if (typeof c.hora_inicio === "string" && c.hora_inicio) malos.push("hora_inicio");
  if (typeof c.hora_fin === "string" && c.hora_fin) malos.push("hora_fin");
  if (c.guardado_en && String(c.guardado_en).length > 7) malos.push("guardado_en");
  if ((c.editado_en || []).some(function (m) { return String(m).length > 7; })) malos.push("editado_en");
  var v = c.registro_intraop && c.registro_intraop.v;
  if (v) {
    ["quirofano", "cirujano", "anestesista", "neurofisiologo", "cierre_firma"].forEach(function (k) {
      if (v[k]) malos.push("registro." + k);
    });
  }
  return malos;
}

/* ------------------------------------------------------------------ *
 * Construcción de las filas de cada hoja
 * ------------------------------------------------------------------ */

function nombreTecnica_(cat, id) {
  var t = cat.TECS[id];
  return t ? t.etiqueta : null;
}

// Cabeceras TEC_<etiqueta>, una por técnica del catálogo fusionado (activas
// e inactivas: una técnica desactivada no deja de tener historial). Si dos
// técnicas compartieran etiqueta -no debería pasar, la interfaz lo impide-
// se desambigua con el id para no mezclar sus recuentos.
// Cada técnica trae además su columna "- alteración" hermana, para el caso
// en que esa técnica concreta tuvo algún cambio o aviso durante la cirugía
// (marcado a mano al cerrar el caso, ver tecnicas_alteradas).
function columnasTecnicas_(cat) {
  var vistas = {};
  return cat.tecnicas.map(function (t) {
    var etiqueta = t.etiqueta || t.id;
    var clave = "TEC_" + etiqueta;
    if (vistas[clave]) clave = "TEC_" + etiqueta + " (" + t.id + ")";
    vistas[clave] = true;
    return { id: t.id, columna: clave, columnaAlteracion: clave + " - alteración" };
  });
}

function comoNumero01_(bool) { return bool ? 1 : 0; }

// Navegación: "si" -> 1, "no" -> 0, sin registrar -> celda vacía. Un true
// antiguo (cuando era una casilla) cuenta como "si"; un false antiguo no
// distingue "no" de "no anotado", así que queda vacío.
// Equipo de cajas del caso (25-09-2026): "inomed"/"cadwell"/"generico"; sin
// el campo, Inomed (todo lo anterior a ese día). Sustituye al texto libre
// "equipo", retirado de la ficha: la columna conserva su nombre. Mismos
// rótulos que "equipos" en data/surgeries.js.
function nombreEquipo_(id) {
  var nombres = { inomed: "Inomed", cadwell: "Cadwell", generico: "Genérico" };
  return nombres[id || "inomed"] || id;
}

function comoSiNo01_(v) {
  if (v === true || v === "si") return 1;
  if (v === "no") return 0;
  return "";
}

// Código del centro: el del catálogo; si no, el prefijo del ID_Caso
// ("H1-2026-003" -> "H1"). Nunca el nombre del centro.
function codigoCentroDe_(c, cat) {
  var ent = c.centro_id ? cat.CENTS[c.centro_id] : null;
  if (ent && ent.codigo) return ent.codigo;
  var m = /^([A-Z0-9]{1,6})-\d{4}-\d+$/.exec(c.ID_Caso || "");
  return m ? m[1] : "";
}

// String(unaFecha) da "Thu Jun 01 2026 12:00:00 GMT+..." -no ordena
// cronológicamente-, así que las columnas de fecha se comparan por su
// valor numérico y el resto por texto.
function compararColumna_(a, b) {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b));
}

function construirFilasCasos_(casos, cat, columnasTec) {
  var cabecera = [
    "caso_uid", "ID_Caso", "estado", "motivo_cancelacion", "Fecha", "centro_id", "centro_codigo", "min_inicio", "min_fin",
    "perfil",
    "edad", "sexo", "antecedentes_relevantes",
    "intervencion", "servicio", "diagnostico",
    "posicion", "posicion_detalle", "navegacion", "anatomia_patologica", "otros_datos_quirurgicos",
    "notas_montaje_tecnicas", "hubo_cambios_plan", "cambios_respecto_al_plan", "umbral_tornillos_pediculares",
    "n_cajas", "n_canales_ocupados", "avisos_preparacion",
    "coste_material", "coste_completo",
    "tipo_anestesia", "tipo_anestesia_detalle",
    "tof_monitorizado", "incidencias_anestesicas",
    "resumen_monitorizacion", "alerta", "tipo_alerta",
    "medida_correctora", "recuperacion_senal", "resultado_esperable",
    "deficit_postoperatorio", "evolucion_postop", "concordancia",
    "incidencias_tecnicas", "equipo",
    "rol", "dificultad_1a5", "aprendizaje_clave", "caso_destacado", "hacer_seguimiento",
    "notas", "version_esquema", "rev", "n_ediciones", "ultima_edicion_mes", "guardado_mes"
  ].concat(columnasTec.reduce(function (acc, c) {
    return acc.concat([c.columna, c.columnaAlteracion]);
  }, []));

  var filas = casos.map(function (c) {
    // La intervención es texto libre desde este cambio; un caso de antes
    // solo tiene intervencion_id apuntando al catálogo, y se resuelve por
    // ahí como respaldo para no perder de vista lo que ya tenía. El código
    // de hospital ya no se propaga solo -dependía del enlace al catálogo,
    // que se ha quitado a propósito-, así que esa columna desaparece.
    var interv = cat.INTERV[c.intervencion_id];
    var intervTexto = c.intervencion || (interv ? interv.nombre : "");
    var serv = cat.SERV[c.servicio_id];
    var marcadas = {};
    (c.tecnicas_realizadas || []).forEach(function (id) { marcadas[id] = true; });
    var marcadasAlteracion = {};
    (c.tecnicas_alteradas || []).forEach(function (id) { marcadasAlteracion[id] = true; });

    // Igual que arriba con la intervención: un caso de antes de este cambio
    // tiene los campos sueltos, y se juntan como respaldo para que el Sheet
    // no se quede con la celda en blanco.
    var resumenMonitorizacion = c.resumen_monitorizacion;
    if (!resumenMonitorizacion) {
      var partesMon = [];
      if (c.basales_obtenidas) partesMon.push(c.basales_obtenidas);
      if (c.basales_cierre) partesMon.push("CL BSL: " + c.basales_cierre);
      resumenMonitorizacion = partesMon.join("\n\n");
    }
    var tipoAlerta = c.tipo_alerta || "";
    if (c.criterio_alarma) {
      tipoAlerta = tipoAlerta
        ? tipoAlerta + "\n\nCriterio de alarma: " + c.criterio_alarma
        : c.criterio_alarma;
    }
    var editado = c.editado_en || [];

    var base = [
      c.caso_uid, c.ID_Caso, c.estado, c.motivo_cancelacion, aMes_(c.fecha), c.centro_id || "", codigoCentroDe_(c, cat),
      minRelCampo_(c, c, "hora_inicio"), minRelCampo_(c, c, "hora_fin"),
      c.perfil,
      tramoEdad_(c.edad), c.sexo, c.antecedentes_relevantes,
      intervTexto, serv ? serv.nombre : "",
      c.diagnostico, c.posicion, c.posicion_detalle, comoSiNo01_(c.navegacion), c.anatomia_patologica, c.otros_datos_quirurgicos,
      c.notas_montaje_tecnicas, comoNumero01_(c.hubo_cambios_plan), c.cambios_respecto_al_plan, c.umbral_tornillos_pediculares,
      c.n_cajas || 0, c.n_canales_ocupados || 0, (c.avisos_preparacion || []).join(" · "),
      typeof c.coste_material === "number" ? c.coste_material : "", comoNumero01_(c.coste_completo),
      c.tipo_anestesia, c.tipo_anestesia_detalle,
      c.tof_monitorizado, c.incidencias_anestesicas,
      resumenMonitorizacion, comoNumero01_(c.alerta), tipoAlerta,
      c.medida_correctora, c.recuperacion_senal, c.resultado_esperable,
      c.deficit_postoperatorio, c.evolucion_postop, c.concordancia,
      c.incidencias_tecnicas, nombreEquipo_(c.equipo_id),
      c.rol, c.dificultad_1a5, c.aprendizaje_clave, comoNumero01_(c.caso_destacado),
      comoNumero01_(c.hacer_seguimiento),
      c.notas, esquemaDe_(c), c.rev || 0, editado.length,
      editado.length ? aMes_(editado[editado.length - 1]) : "",
      aMes_(c.guardado_en)
    ];
    var tec = columnasTec.reduce(function (acc, col) {
      return acc.concat([marcadas[col.id] ? 1 : 0, marcadasAlteracion[col.id] ? 1 : 0]);
    }, []);
    return base.concat(tec);
  });

  // Orden determinista: el mismo contenido produce siempre el mismo Sheet,
  // ejecutarlo diez veces seguidas no reordena ni una fila. Se busca la
  // columna por su NOMBRE, no por un índice fijo (0, 1, 3...): un índice
  // fijo se rompe en silencio -sin ningún error- el día que se añada una
  // columna en medio de la cabecera. Ya pasó una vez con "nombre_caso".
  var iFecha = cabecera.indexOf("Fecha"), iIdCaso = cabecera.indexOf("ID_Caso");
  filas.sort(function (a, b) {
    return compararColumna_(a[iFecha], b[iFecha]) || compararColumna_(a[iIdCaso], b[iIdCaso]);
  });

  return {
    cabecera: cabecera, filas: filas,
    columnasMes: ["Fecha", "ultima_edicion_mes", "guardado_mes"],
    columnasTexto: ["edad"]   // "10-14" no debe leerse como una fecha
  };
}

function construirTecnicasLong_(casos, cat) {
  // Mismo nombre "servicio" que en Casos -no "Servicio"-: un filtro de
  // Looker Studio solo cruza de una fuente de datos a otra si el campo se
  // llama exactamente igual en las dos.
  var cabecera = ["ID_Caso", "Fecha", "servicio", "Tecnica"];
  var iFecha = cabecera.indexOf("Fecha"), iIdCaso = cabecera.indexOf("ID_Caso"), iTec = cabecera.indexOf("Tecnica");

  var filas = [];
  var idsDesconocidos = {};
  // Un caso cancelado no llegó a hacerse: sus técnicas (si las tenía, de
  // cuando estaba en preparación) no cuentan como técnicas realmente
  // usadas. Solo cuenta para trazabilidad y paciente, que viven en Casos.
  casos.filter(function (c) { return c.estado !== "cancelado"; }).forEach(function (c) {
    var serv = cat.SERV[c.servicio_id];
    (c.tecnicas_realizadas || []).forEach(function (id) {
      var nombre = nombreTecnica_(cat, id);
      if (!nombre) { idsDesconocidos[id] = (idsDesconocidos[id] || 0) + 1; return; }
      filas.push([c.ID_Caso, aMes_(c.fecha), serv ? serv.nombre : "", nombre]);
    });
  });
  // Igual que en Casos: se busca la columna por nombre, no por índice fijo.
  filas.sort(function (a, b) {
    return compararColumna_(a[iFecha], b[iFecha]) || compararColumna_(a[iIdCaso], b[iIdCaso]) || compararColumna_(a[iTec], b[iTec]);
  });
  return { cabecera: cabecera, filas: filas, idsDesconocidos: idsDesconocidos, columnasMes: ["Fecha"], columnasTexto: [] };
}

// Correlación de cada alarma con la evolución postquirúrgica (29-09-2026):
// una fila por grupo de alarmas (misma técnica y mismo criterio). La app deja
// cada grupo ya calculado en c.correlato_filas al guardar el caso, así que
// aquí solo se copia: la lógica (agrupar, concordancia) vive en un solo sitio.
// Listas en id, como en Casos. Los casos cancelados no cuentan.
// El inicio y el fin del grupo llegan en minutos desde la incisión (esquema 2)
// o como HH:MM (esquema 1): se pasan a minutos, ver minRelValor_().
function construirCorrelacionLong_(casos, cat) {
  // Magnitud_pct (30-09-2026): el mayor cambio del grupo respecto a la basal,
  // en %, ya calculado en la app (correlato_filas); vacío si no se apuntó.
  var cabecera = ["ID_Caso", "Fecha", "servicio", "Alarmas", "N_alarmas", "Tecnica", "Criterio", "Magnitud_pct",
    "Min_inicio", "Min_fin", "Recuperacion", "Evolucion", "Valorado", "Concordancia_grupo", "Concordancia_caso"];
  var iFecha = cabecera.indexOf("Fecha"), iIdCaso = cabecera.indexOf("ID_Caso"), iAl = cabecera.indexOf("Alarmas");
  var filas = [];
  casos.filter(function (c) { return c.estado !== "cancelado"; }).forEach(function (c) {
    var serv = cat.SERV[c.servicio_id];
    (c.correlato_filas || []).forEach(function (f) {
      filas.push([c.ID_Caso, aMes_(c.fecha), serv ? serv.nombre : "", f.alarmas, f.n_alarmas, f.tecnica, f.criterio,
        f.magnitud_pct === "" || f.magnitud_pct == null ? "" : Number(f.magnitud_pct),
        minRelValor_(c, f.hora_inicio), minRelValor_(c, f.hora_fin), f.recuperacion, f.evolucion, f.valorado, f.concordancia, c.concordancia || ""]);
    });
  });
  filas.sort(function (a, b) {
    return compararColumna_(a[iFecha], b[iFecha]) || compararColumna_(a[iIdCaso], b[iIdCaso]) || compararColumna_(a[iAl], b[iAl]);
  });
  return { cabecera: cabecera, filas: filas, columnasMes: ["Fecha"], columnasTexto: [] };
}

// Hoja añadida sobre la especificación mínima: sin ella, "material consumido
// acumulado" (fase 4) no tiene de dónde sacar un total por tipo, porque
// material_previsto/material_real son mapas de clave variable y Looker no
// puede sumar dentro de un mapa incrustado en una celda.
function construirMaterialLong_(casos) {
  var cabecera = ["ID_Caso", "Fecha", "Tipo", "Cantidad_prevista", "Cantidad_real"];
  var iFecha = cabecera.indexOf("Fecha"), iIdCaso = cabecera.indexOf("ID_Caso"), iTipo = cabecera.indexOf("Tipo");

  var filas = [];
  // Mismo criterio que en Tecnicas_long: un caso cancelado no cuenta para el
  // material consumido, aunque tuviera material previsto de cuando se
  // preparó.
  casos.filter(function (c) { return c.estado !== "cancelado"; }).forEach(function (c) {
    var tipos = {};
    Object.keys(c.material_previsto || {}).forEach(function (t) { tipos[t] = true; });
    Object.keys(c.material_real || {}).forEach(function (t) { tipos[t] = true; });
    Object.keys(tipos).forEach(function (tipo) {
      filas.push([
        c.ID_Caso, aMes_(c.fecha), tipo,
        (c.material_previsto || {})[tipo] || 0,
        (c.material_real || {})[tipo] || 0
      ]);
    });
  });
  filas.sort(function (a, b) {
    return compararColumna_(a[iFecha], b[iFecha]) || compararColumna_(a[iIdCaso], b[iIdCaso]) || compararColumna_(a[iTipo], b[iTipo]);
  });
  return { cabecera: cabecera, filas: filas, columnasMes: ["Fecha"], columnasTexto: [] };
}

function construirListas_(cat) {
  var bloques = [
    { titulo: "Tecnicas", cabecera: ["id", "etiqueta", "grupo", "activa"],
      filas: cat.tecnicas.map(function (t) { return [t.id, t.etiqueta, t.grupo, comoNumero01_(t.activa !== false)]; }) },
    { titulo: "Servicios", cabecera: ["id", "nombre", "activa"],
      filas: cat.servicios.map(function (s) { return [s.id, s.nombre, comoNumero01_(s.activa !== false)]; }) },
    { titulo: "Intervenciones", cabecera: ["id", "nombre", "codigo", "servicio", "activa"],
      filas: cat.intervenciones.map(function (i) {
        var serv = cat.SERV[i.servicio];
        return [i.id, i.nombre, i.codigo || "", serv ? serv.nombre : "", comoNumero01_(i.activa !== false)];
      }) }
  ];
  // Centros: solo id y código (el nombre del centro no se vuelca). Último
  // bloque, para no mover los de antes; solo si hay centros dados de alta.
  if (cat.centros && cat.centros.length) {
    bloques.push({ titulo: "Centros", cabecera: ["id", "codigo", "activa"],
      filas: cat.centros.map(function (e) { return [e.id, e.codigo || "", comoNumero01_(e.activa !== false)]; }) });
  }
  // Tres bloques (cuatro con centros) uno al lado del otro, con una columna
  // en blanco de por medio, para que quepan en una sola hoja fácil de mirar
  // de un vistazo.
  var anchoMax = Math.max.apply(null, bloques.map(function (b) { return b.filas.length; })) + 1;
  var filas = [];
  for (var f = 0; f < anchoMax; f++) {
    var fila = [];
    bloques.forEach(function (b, bi) {
      var origen = f === 0 ? b.cabecera : b.filas[f - 1];
      fila = fila.concat(origen || new Array(b.cabecera.length).fill(""));
      if (bi < bloques.length - 1) fila.push("");
    });
    filas.push(fila);
  }

  // Posición de cada bloque (columna donde empieza, cuántas columnas ocupa,
  // cuántas filas de datos tiene de verdad -sin contar el relleno vacío
  // hasta anchoMax-), para poder aplicar el franjeado a cada bloque por
  // separado y no a la hoja entera de un tirón.
  var colActual = 1;
  var bloquesInfo = bloques.map(function (b) {
    var info = { titulo: b.titulo, columnas: b.cabecera.length, filas: b.filas.length, inicioCol: colActual };
    colActual += b.cabecera.length + 1;
    return info;
  });

  return { filas: filas, bloques: bloquesInfo };
}

// Meta: clave/valor. Nada de la hora real: la reconstrucción solo lleva su
// mes. "estado" es el estado.json del repositorio (espacio_id, si lo trae).
function construirMeta_(casos, malformados, tecnicasDesconocidas, estado, ahora) {
  estado = estado || {};
  var porIdCaso = {};
  casos.forEach(function (c) { (porIdCaso[c.ID_Caso] = porIdCaso[c.ID_Caso] || []).push(c.caso_uid); });
  var duplicados = Object.keys(porIdCaso).filter(function (id) { return porIdCaso[id].length > 1; }).sort();

  var sinCerrar = casos.filter(function (c) { return c.estado === "preparado"; })
    .sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });

  var cancelados = casos.filter(function (c) { return c.estado === "cancelado"; });

  var porEsquema = {};
  casos.forEach(function (c) {
    var v = esquemaDe_(c);
    porEsquema[v] = (porEsquema[v] || 0) + 1;
  });
  var textoEsquemas = Object.keys(porEsquema).sort().map(function (v) { return v + " (" + porEsquema[v] + ")"; }).join(", ");

  // Casos de esquema 2 con algún dato exacto: no se vuelca, pero se avisa.
  var conExactos = [];
  casos.forEach(function (c) {
    var malos = camposExactosEsquema2_(c);
    if (malos.length) conExactos.push({ id: c.ID_Caso, campos: malos });
  });

  var filas = [
    ["Reconstruido (mes)", aMes_((ahora || new Date()).toISOString())],
    ["Espacio (espacio_id)", estado.espacio_id || "(no consta)"],
    ["Versión de esquema del Sheet (version_esquema)", ESQUEMA_SHEET],
    ["Número de casos", casos.length],
    ["Casos cancelados", cancelados.length],
    ["Casos preparados sin cerrar", sinCerrar.length],
    ["Versiones de esquema en uso", textoEsquemas],
    ["", ""],
    ["Avisos", ""]
  ];
  if (!duplicados.length && !sinCerrar.length && !malformados.length && !Object.keys(tecnicasDesconocidas).length && !conExactos.length) {
    filas.push(["(ninguno)", ""]);
  }
  duplicados.forEach(function (id) {
    filas.push(["Correlativo duplicado", id + " — " + porIdCaso[id].join(", ")]);
  });
  sinCerrar.forEach(function (c) {
    filas.push(["Preparado sin cerrar", c.ID_Caso + " (" + (mesDe_(c.fecha) || "sin fecha") + ")"]);
  });
  conExactos.forEach(function (x) {
    filas.push(["Esquema 2 con datos exactos (no se vuelcan)", x.id + " — " + x.campos.join(", ")]);
  });
  Object.keys(tecnicasDesconocidas).sort().forEach(function (id) {
    filas.push(["Técnica sin catálogo", id + " — usada en " + tecnicasDesconocidas[id] + " caso(s)"]);
  });
  malformados.forEach(function (m) {
    filas.push(["Caso no leído", m.archivo + " — " + m.motivo]);
  });
  return filas;
}

/* ------------------------------------------------------------------ *
 * Escritura y formato en el Sheet
 *
 * El formato se aplica aquí, en el propio script, y no a mano en el Sheet:
 * como las hojas se reescriben ENTERAS en cada pasada, cualquier formato
 * puesto a mano desaparecería en la siguiente reconstrucción. El franjeado
 * (Banding) es un objeto aparte de las celdas -clearContents() no lo
 * toca-, así que hay que quitar el de la vez anterior antes de poner uno
 * nuevo, o la segunda ejecución seguida chocaría con el que ya existe.
 * ------------------------------------------------------------------ */

var TEMA_FRANJAS = SpreadsheetApp.BandingTheme.TEAL;
// El tema TEAL trae de fábrica una cabecera en verde con el texto en negro
// de Sheets, poco legible. Se sobreescribe con el mismo verde de acento que
// usa la propia web (--accent en style.css) y texto blanco.
var COLOR_CABECERA_FONDO = "#14705a";
var COLOR_CABECERA_TEXTO = "#ffffff";
var GRIS_SEPARADOR = "#f1f3f4";
var FORMATO_MES = "yyyy-mm";

function quitarFormatoAnterior_(hoja) {
  hoja.getBandings().forEach(function (b) { b.remove(); });
}

// columnasTexto: nombres de columna que se escriben como texto plano (si no,
// Sheets convertiría un tramo como "10-14" en una fecha). columnasMes:
// columnas de fecha que se enseñan como aaaa-mm. Ambas por NOMBRE.
function escribirHoja_(ss, nombre, filas, columnasTexto, columnasMes) {
  var hoja = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  quitarFormatoAnterior_(hoja);
  hoja.clearContents();
  hoja.clearFormats();
  if (filas.length && filas[0].length) {
    var cab = filas[0];
    (columnasTexto || []).forEach(function (n) {
      var i = cab.indexOf(n);
      if (i !== -1) hoja.getRange(1, i + 1, filas.length, 1).setNumberFormat("@");
    });
    hoja.getRange(1, 1, filas.length, cab.length).setValues(filas);
    (columnasMes || []).forEach(function (n) {
      var i = cab.indexOf(n);
      if (i !== -1 && filas.length > 1) hoja.getRange(2, i + 1, filas.length - 1, 1).setNumberFormat(FORMATO_MES);
    });
    hoja.setFrozenRows(1);
  } else {
    hoja.setFrozenRows(0);
  }
  return hoja;
}

// Cabecera en negrita + franjas alternas por fila, para las hojas con una
// sola tabla de ancho uniforme (Casos, Tecnicas_long, Material_long).
function formatearTabla_(hoja, numFilas, numCols) {
  if (!numFilas || !numCols) return;
  var banding = hoja.getRange(1, 1, numFilas, numCols).applyRowBanding(TEMA_FRANJAS, true, false);
  banding.setHeaderRowColor(COLOR_CABECERA_FONDO);
  hoja.getRange(1, 1, 1, numCols).setFontWeight("bold").setFontColor(COLOR_CABECERA_TEXTO);
  hoja.autoResizeColumns(1, numCols);
}

// Listas tiene tres bloques uno al lado del otro (cuatro con centros): el
// franjeado se aplica a cada bloque por separado, para que no salte por
// encima de la columna en blanco que los separa ni se alargue sobre las
// filas vacías de relleno.
function formatearListas_(hoja, bloquesInfo) {
  bloquesInfo.forEach(function (b) {
    if (!b.filas) return;
    var banding = hoja.getRange(1, b.inicioCol, b.filas + 1, b.columnas).applyRowBanding(TEMA_FRANJAS, true, false);
    banding.setHeaderRowColor(COLOR_CABECERA_FONDO);
    hoja.getRange(1, b.inicioCol, 1, b.columnas).setFontWeight("bold").setFontColor(COLOR_CABECERA_TEXTO);
  });
  var colFinal = bloquesInfo.length
    ? bloquesInfo[bloquesInfo.length - 1].inicioCol + bloquesInfo[bloquesInfo.length - 1].columnas - 1
    : 0;
  if (colFinal) hoja.autoResizeColumns(1, colFinal);
}

// Meta es clave/valor, no una tabla: la columna de etiquetas va en negrita,
// y la fila "Avisos" lleva un fondo suave para separar el resumen de arriba
// de la lista de avisos de abajo. La fecha de reconstrucción (primera fila)
// se enseña como aaaa-mm.
function formatearMeta_(hoja, filasMeta) {
  if (!filasMeta.length) return;
  hoja.getRange(1, 1, filasMeta.length, 1).setFontWeight("bold");
  hoja.getRange(1, 2).setNumberFormat(FORMATO_MES);
  for (var i = 0; i < filasMeta.length; i++) {
    if (filasMeta[i][0] === "Avisos") {
      hoja.getRange(i + 1, 1, 1, 2).setBackground(GRIS_SEPARADOR);
      break;
    }
  }
  hoja.autoResizeColumns(1, 2);
}

// Escribe una tabla construida por construir*_ (cabecera + filas + qué
// columnas son mes o texto) y le da formato.
function volcarTabla_(ss, nombre, t) {
  var h = escribirHoja_(ss, nombre, [t.cabecera].concat(t.filas), t.columnasTexto, t.columnasMes);
  formatearTabla_(h, t.filas.length + 1, t.cabecera.length);
  return h;
}

/* ------------------------------------------------------------------ *
 * Orquestación
 * ------------------------------------------------------------------ */

function reconstruirTodo() {
  // Hospital archivado: no se lee GitHub ni se toca ninguna hoja.
  if (CONGELADO) {
    Logger.log("MIO-Check: CONGELADO = 1, no se reconstruye nada.");
    try { SpreadsheetApp.getActiveSpreadsheet().toast("Sheet congelado (CONGELADO = 1): no se reconstruye.", "MIO-Check"); } catch (e) { /* sin interfaz (disparador) */ }
    return { congelado: true, casos: 0, malformados: 0 };
  }
  var cfg = obtenerConfig_();

  // --- Fase 1: reunir todo en memoria. Si algo falla aquí, no se ha
  // tocado ninguna hoja: el Sheet se queda con el contenido anterior. ---
  var textoSurgeries = leerArchivoPublicoRaw_(cfg.repoCodigo, cfg.ramaCodigo, "data/surgeries.js");
  if (!textoSurgeries) throw new Error("No se encuentra data/surgeries.js en " + cfg.repoCodigo);
  var baseData = evaluarSurgeriesJs_(textoSurgeries);

  var textoEstado = leerArchivo_(cfg.repoDatos, "estado.json", cfg.token);
  var estado = textoEstado ? JSON.parse(textoEstado) : {};
  var cat = construirCatalogos_(baseData, estado.catalogos);

  var descarga = descargarCasos_(cfg.repoDatos, cfg.token);
  var columnasTec = columnasTecnicas_(cat);

  var hojaCasos = construirFilasCasos_(descarga.casos, cat, columnasTec);
  var hojaTecLong = construirTecnicasLong_(descarga.casos, cat);
  var hojaMatLong = construirMaterialLong_(descarga.casos);
  var hojaCorrLong = construirCorrelacionLong_(descarga.casos, cat);
  var hojaListas = construirListas_(cat);
  var filasMeta = construirMeta_(descarga.casos, descarga.malformados, hojaTecLong.idsDesconocidos, estado, new Date());

  // --- Fase 2: todo ha ido bien. Ahora sí se reescriben las hojas. ---
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  volcarTabla_(ss, HOJAS.CASOS, hojaCasos);
  volcarTabla_(ss, HOJAS.TECNICAS_LONG, hojaTecLong);
  volcarTabla_(ss, HOJAS.MATERIAL_LONG, hojaMatLong);
  volcarTabla_(ss, HOJAS.CORRELACION_LONG, hojaCorrLong);

  var hListas = escribirHoja_(ss, HOJAS.LISTAS, hojaListas.filas);
  formatearListas_(hListas, hojaListas.bloques);

  // Meta se escribe la última: si algo de lo anterior fallara a mitad de
  // esta segunda fase, "Reconstruido" no queda mintiendo sobre un Sheet a
  // medio escribir.
  var hMeta = escribirHoja_(ss, HOJAS.META, filasMeta);
  formatearMeta_(hMeta, filasMeta);

  return { casos: descarga.casos.length, malformados: descarga.malformados.length };
}

/* ------------------------------------------------------------------ *
 * Disparador diario y menú manual
 * ------------------------------------------------------------------ */

// Ejecutar una sola vez a mano, desde el editor (▶), para instalar el
// disparador diario. Volver a ejecutarla no duplica el disparador: primero
// quita los que ya hubiera de esta misma función. Con CONGELADO = 1 solo
// los quita y no crea ninguno.
function crearDisparadorDiario() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "reconstruirTodo") ScriptApp.deleteTrigger(t);
  });
  if (CONGELADO) {
    Logger.log("MIO-Check: CONGELADO = 1, no se programa ninguna reconstrucción.");
    return;
  }
  ScriptApp.newTrigger("reconstruirTodo").timeBased().everyDays(1).atHour(4).create();
}

// Añade un menú "MIO-Check" al abrir el Sheet, con la reconstrucción manual.
// No hace falta entrar al editor de Apps Script para forzarla.
function onOpen() {
  SpreadsheetApp.getUi().createMenu("MIO-Check")
    .addItem("Reconstruir ahora", "reconstruirTodo")
    .addToUi();
}
