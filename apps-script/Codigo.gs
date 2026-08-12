/*
 * MIO/IONM — Reconstrucción del Google Sheet desde el repositorio de datos
 * ==========================================================================
 *
 * Qué hace: lee los catálogos y los casos del repositorio privado de datos,
 * y RECONSTRUYE ENTERAS las hojas Casos, Tecnicas_long, Material_long,
 * Listas y Meta. Nunca actualiza fila a fila.
 *
 * De ahí salen gratis tres cosas:
 *   - Una técnica nueva crea su columna TEC_<etiqueta> sola.
 *   - Renombrar una técnica se propaga a todo el histórico, porque las
 *     columnas se generan resolviendo el id contra el catálogo actual.
 *   - El Sheet es desechable: si algo se rompe, se borra y se reconstruye.
 *
 * Instalación: ver el mensaje que acompaña a este archivo. Resumen: pega
 * esto en Extensiones → Apps Script del Google Sheet, rellena las tres
 * Script Properties (GITHUB_TOKEN, REPO_DATOS, REPO_CODIGO) y ejecuta
 * crearDisparadorDiario() una vez.
 */

/* ------------------------------------------------------------------ *
 * Configuración
 * ------------------------------------------------------------------ */

// Nombre de las hojas que este script posee por completo. Cualquier otra
// hoja del documento (por ejemplo, las que construyas tú en Looker) no se
// toca nunca.
var HOJAS = {
  CASOS: "Casos",
  TECNICAS_LONG: "Tecnicas_long",
  MATERIAL_LONG: "Material_long",
  LISTAS: "Listas",
  META: "Meta"
};

function obtenerConfig_() {
  var p = PropertiesService.getScriptProperties();
  var token = p.getProperty("GITHUB_TOKEN");
  var repoDatos = p.getProperty("REPO_DATOS");
  var repoCodigo = p.getProperty("REPO_CODIGO") || "paniaguadediego-bit/checklist-mio-ionm";
  var ramaCodigo = p.getProperty("REPO_CODIGO_RAMA") || "main";
  if (!token) throw new Error("Falta la Script Property GITHUB_TOKEN. Ve a Configuración del proyecto → Script Properties.");
  if (!repoDatos) throw new Error("Falta la Script Property REPO_DATOS (formato usuario/repositorio).");
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
  return {
    tecnicas: t.lista, TECS: t.indice,
    servicios: s.lista, SERV: s.indice,
    intervenciones: i.lista, INTERV: i.indice
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
function columnasTecnicas_(cat) {
  var vistas = {};
  return cat.tecnicas.map(function (t) {
    var etiqueta = t.etiqueta || t.id;
    var clave = "TEC_" + etiqueta;
    if (vistas[clave]) clave = "TEC_" + etiqueta + " (" + t.id + ")";
    vistas[clave] = true;
    return { id: t.id, columna: clave };
  });
}

function aFecha_(iso) {
  if (!iso) return "";
  // Se construye a mediodía UTC para que el redondeo de zona horaria de
  // Sheets/Looker nunca la haga caer en el día anterior o siguiente.
  var partes = iso.split("-");
  if (partes.length !== 3) return iso;
  return new Date(Date.UTC(+partes[0], +partes[1] - 1, +partes[2], 12, 0, 0));
}

function comoNumero01_(bool) { return bool ? 1 : 0; }

// String(unaFecha) da "Thu Jun 01 2026 12:00:00 GMT+..." -no ordena
// cronológicamente-, así que las columnas de fecha se comparan por su
// valor numérico y el resto por texto.
function compararColumna_(a, b) {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b));
}

function construirFilasCasos_(casos, cat, columnasTec) {
  var cabecera = [
    "caso_uid", "ID_Caso", "estado", "Fecha", "centro", "hora_inicio", "hora_fin",
    "escenario_nombre", "perfil",
    "edad", "sexo", "antecedentes_relevantes",
    "intervencion", "codigo_intervencion", "servicio", "region_nivel", "diagnostico", "posicion",
    "pares_craneales_cuales", "cambios_respecto_al_plan",
    "n_cajas", "n_canales_ocupados", "avisos_preparacion",
    "tipo_anestesia", "tipo_anestesia_detalle", "relajante_nm", "relajante_cual",
    "tof_monitorizado", "incidencias_anestesicas",
    "basales_obtenidas", "alerta", "tipo_alerta", "criterio_alarma",
    "medida_correctora", "recuperacion_senal", "deficit_postoperatorio", "concordancia",
    "incidencias_tecnicas", "equipo",
    "rol", "supervisor", "dificultad_1a5", "aprendizaje_clave", "caso_destacado",
    "notas", "version_esquema", "n_ediciones", "ultima_edicion", "guardado_en"
  ].concat(columnasTec.map(function (c) { return c.columna; }));

  var filas = casos.map(function (c) {
    var interv = cat.INTERV[c.intervencion_id];
    var serv = cat.SERV[c.servicio_id];
    var marcadas = {};
    (c.tecnicas_realizadas || []).forEach(function (id) { marcadas[id] = true; });

    var base = [
      c.caso_uid, c.ID_Caso, c.estado, aFecha_(c.fecha), c.centro, c.hora_inicio, c.hora_fin,
      c.escenario_nombre, c.perfil,
      c.edad, c.sexo, c.antecedentes_relevantes,
      interv ? interv.nombre : "", interv ? (interv.codigo || "") : "", serv ? serv.nombre : "",
      c.region_nivel, c.diagnostico, c.posicion,
      c.pares_craneales_cuales, c.cambios_respecto_al_plan,
      c.n_cajas || 0, c.n_canales_ocupados || 0, (c.avisos_preparacion || []).join(" · "),
      c.tipo_anestesia, c.tipo_anestesia_detalle, c.relajante_nm, c.relajante_cual,
      c.tof_monitorizado, c.incidencias_anestesicas,
      c.basales_obtenidas, comoNumero01_(c.alerta), c.tipo_alerta, c.criterio_alarma,
      c.medida_correctora, c.recuperacion_senal, c.deficit_postoperatorio, c.concordancia,
      c.incidencias_tecnicas, c.equipo,
      c.rol, c.supervisor, c.dificultad_1a5, c.aprendizaje_clave, comoNumero01_(c.caso_destacado),
      c.notas, c.version_esquema, (c.editado_en || []).length,
      (c.editado_en || []).length ? c.editado_en[c.editado_en.length - 1] : "",
      c.guardado_en
    ];
    var tec = columnasTec.map(function (col) { return marcadas[col.id] ? 1 : 0; });
    return base.concat(tec);
  });

  // Orden determinista: el mismo contenido produce siempre el mismo Sheet,
  // ejecutarlo diez veces seguidas no reordena ni una fila.
  filas.sort(function (a, b) {
    return compararColumna_(a[3], b[3]) || compararColumna_(a[1], b[1]);
  });

  return { cabecera: cabecera, filas: filas };
}

function construirTecnicasLong_(casos, cat) {
  var filas = [];
  var idsDesconocidos = {};
  casos.forEach(function (c) {
    var serv = cat.SERV[c.servicio_id];
    (c.tecnicas_realizadas || []).forEach(function (id) {
      var nombre = nombreTecnica_(cat, id);
      if (!nombre) { idsDesconocidos[id] = (idsDesconocidos[id] || 0) + 1; return; }
      filas.push([c.ID_Caso, aFecha_(c.fecha), serv ? serv.nombre : "", nombre]);
    });
  });
  filas.sort(function (a, b) {
    return compararColumna_(a[1], b[1]) || compararColumna_(a[0], b[0]) || compararColumna_(a[3], b[3]);
  });
  return {
    cabecera: ["ID_Caso", "Fecha", "Servicio", "Tecnica"],
    filas: filas,
    idsDesconocidos: idsDesconocidos
  };
}

// Hoja añadida sobre la especificación mínima: sin ella, "material consumido
// acumulado" (fase 4) no tiene de dónde sacar un total por tipo, porque
// material_previsto/material_real son mapas de clave variable y Looker no
// puede sumar dentro de un mapa incrustado en una celda.
function construirMaterialLong_(casos) {
  var filas = [];
  casos.forEach(function (c) {
    var tipos = {};
    Object.keys(c.material_previsto || {}).forEach(function (t) { tipos[t] = true; });
    Object.keys(c.material_real || {}).forEach(function (t) { tipos[t] = true; });
    Object.keys(tipos).forEach(function (tipo) {
      filas.push([
        c.ID_Caso, aFecha_(c.fecha), tipo,
        (c.material_previsto || {})[tipo] || 0,
        (c.material_real || {})[tipo] || 0
      ]);
    });
  });
  filas.sort(function (a, b) {
    return compararColumna_(a[1], b[1]) || compararColumna_(a[0], b[0]) || compararColumna_(a[2], b[2]);
  });
  return { cabecera: ["ID_Caso", "Fecha", "Tipo", "Cantidad_prevista", "Cantidad_real"], filas: filas };
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
  // Tres bloques uno al lado del otro, con una columna en blanco de por
  // medio, para que quepan en una sola hoja fácil de mirar de un vistazo.
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
  return { titulos: bloques.map(function (b) { return b.titulo; }), filas: filas };
}

function construirMeta_(casos, malformados, tecnicasDesconocidas) {
  var porIdCaso = {};
  casos.forEach(function (c) { (porIdCaso[c.ID_Caso] = porIdCaso[c.ID_Caso] || []).push(c.caso_uid); });
  var duplicados = Object.keys(porIdCaso).filter(function (id) { return porIdCaso[id].length > 1; }).sort();

  var sinCerrar = casos.filter(function (c) { return c.estado === "preparado"; })
    .sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });

  var versiones = {};
  casos.forEach(function (c) { versiones[c.version_esquema] = true; });

  var filas = [
    ["Última sincronización", new Date()],
    ["Número de casos", casos.length],
    ["Casos preparados sin cerrar", sinCerrar.length],
    ["Versiones de esquema en uso", Object.keys(versiones).sort().join(", ")],
    ["", ""],
    ["Avisos", ""]
  ];
  if (!duplicados.length && !sinCerrar.length && !malformados.length && !Object.keys(tecnicasDesconocidas).length) {
    filas.push(["(ninguno)", ""]);
  }
  duplicados.forEach(function (id) {
    filas.push(["Correlativo duplicado", id + " — " + porIdCaso[id].join(", ")]);
  });
  sinCerrar.forEach(function (c) {
    filas.push(["Preparado sin cerrar", c.ID_Caso + " (" + c.fecha + ")"]);
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
 * Escritura en el Sheet
 * ------------------------------------------------------------------ */

function escribirHoja_(ss, nombre, filas) {
  var hoja = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  hoja.clearContents();
  if (filas.length && filas[0].length) {
    hoja.getRange(1, 1, filas.length, filas[0].length).setValues(filas);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

/* ------------------------------------------------------------------ *
 * Orquestación
 * ------------------------------------------------------------------ */

function reconstruirTodo() {
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
  var hojaListas = construirListas_(cat);
  var filasMeta = construirMeta_(descarga.casos, descarga.malformados, hojaTecLong.idsDesconocidos);

  // --- Fase 2: todo ha ido bien. Ahora sí se reescriben las hojas. ---
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  escribirHoja_(ss, HOJAS.CASOS, [hojaCasos.cabecera].concat(hojaCasos.filas));
  escribirHoja_(ss, HOJAS.TECNICAS_LONG, [hojaTecLong.cabecera].concat(hojaTecLong.filas));
  escribirHoja_(ss, HOJAS.MATERIAL_LONG, [hojaMatLong.cabecera].concat(hojaMatLong.filas));
  escribirHoja_(ss, HOJAS.LISTAS, hojaListas.filas);
  // Meta se escribe la última: si algo de lo anterior fallara a mitad de
  // esta segunda fase, "Última sincronización" no queda mintiendo sobre
  // un Sheet a medio escribir.
  escribirHoja_(ss, HOJAS.META, filasMeta);

  return { casos: descarga.casos.length, malformados: descarga.malformados.length };
}

/* ------------------------------------------------------------------ *
 * Disparador diario y menú manual
 * ------------------------------------------------------------------ */

// Ejecutar una sola vez a mano, desde el editor (▶), para instalar el
// disparador diario. Volver a ejecutarla no duplica el disparador: primero
// quita los que ya hubiera de esta misma función.
function crearDisparadorDiario() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "reconstruirTodo") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("reconstruirTodo").timeBased().everyDays(1).atHour(4).create();
}

// Añade un menú "MIO/IONM" al abrir el Sheet, con la reconstrucción manual.
// No hace falta entrar al editor de Apps Script para forzarla.
function onOpen() {
  SpreadsheetApp.getUi().createMenu("MIO/IONM")
    .addItem("Reconstruir ahora", "reconstruirTodo")
    .addToUi();
}
