(function () {
  "use strict";

  /* ---------------------------------------------------------------- *
   * Modo demostración (25-09-2026): se entra abriendo la app con ?demo en
   * la dirección (p. ej. .../checklist-mio-ionm/?demo). Para enseñarla en
   * un congreso sin tocar ningún dato real:
   * - todo lo que se guarda en el navegador lleva otro prefijo de clave
   *   (DEMO_PREFIJO), así que no se ven ni se pisan los datos normales de
   *   ese mismo navegador; las fotos van a otra base de IndexedDB;
   * - la sincronización con GitHub queda anulada: syncActivo() es siempre
   *   falso y el botón de la nube no abre su configuración;
   * - la primera vez se siembran casos, plantillas y apuntes ficticios
   *   (sembrarDemo()), y "Restablecer demo" (en Inicio) los deja como nuevos.
   * "var localStorage" sombrea al del navegador en todo este archivo: el
   * resto del código sigue usando localStorage.getItem(...) sin saber nada
   * del modo demo. No hay botón para salir a propósito: en el móvil del
   * autor, un visitante no debe poder pasar a los datos reales.
   * ---------------------------------------------------------------- */

  /* Sin teclado al abrir un diálogo en pantalla táctil (26-09-2026). El
   * <dialog> nativo enfoca solo, al abrirse, su primer campo -en el
   * Simulador, el título de la ventana-, y en el móvil eso saca el teclado
   * tapando medio diálogo. Antes se arreglaba diálogo a diálogo (tabindex
   * en dlg-elegir y dlg-elegir-plantilla); ahora, para todos: si tras
   * showModal() el foco cae en un campo de texto, pasa al propio diálogo.
   * Un .focus() puesto a mano después de abrir (p. ej. el nombre de un
   * material nuevo) sigue funcionando, porque va detrás de esto. */
  (function () {
    var proto = window.HTMLDialogElement && HTMLDialogElement.prototype;
    if (!proto || !proto.showModal || !window.matchMedia || !matchMedia("(pointer: coarse)").matches) return;
    var original = proto.showModal;
    proto.showModal = function () {
      original.apply(this, arguments);
      var a = document.activeElement;
      if (a && this.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) {
        if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "-1");
        this.focus();
      }
    };
  })();

  // Pone el cursor en un campo solo si hay teclado físico: en táctil sacaría
  // el teclado en pantalla nada más abrir (28-09-2026, Etiquetas y Material
  // nuevo). En el móvil se toca el campo cuando se quiere escribir.
  function enfocarSinTeclado(el) {
    if (!el) return;
    if (window.matchMedia && matchMedia("(pointer: coarse)").matches) return;
    el.focus();
  }

  var MODO_DEMO = /(^|[?&])demo(=|&|$)/.test(location.search);
  var DEMO_PREFIJO = "mio_ionm_demo__";
  var DEMO_SEMBRADO_KEY = "demo_sembrado";
  // Demo sin red (demo-congreso B5.F3): la sincronización ya está apagada en
  // ?demo (syncActivo()), y además aquí se corta en seco cualquier fetch a
  // otro sitio que no sea el de la propia página, para que el aviso de
  // privacidad de la demo ("no envía nada a ningún servidor") sea literal.
  if (MODO_DEMO && window.fetch) {
    var fetchReal = window.fetch.bind(window);
    window.fetch = function (recurso, opciones) {
      var destino;
      try { destino = new URL(typeof recurso === "string" ? recurso : recurso.url, location.href); } catch (e) { destino = null; }
      if (!destino || destino.origin !== location.origin) {
        return Promise.reject(new Error("Modo demo: sin conexiones externas"));
      }
      return fetchReal(recurso, opciones);
    };
  }
  var localStorage = (function () {
    var real = null;
    try { real = window.localStorage; } catch (e) { real = null; }
    return (MODO_DEMO && real) ? almacenDemo(real) : real;
  })();

  function almacenDemo(real) {
    function claves() {
      var out = [];
      for (var i = 0; i < real.length; i++) {
        var k = real.key(i);
        if (k && k.indexOf(DEMO_PREFIJO) === 0) out.push(k.slice(DEMO_PREFIJO.length));
      }
      return out;
    }
    return {
      getItem: function (k) { return real.getItem(DEMO_PREFIJO + k); },
      setItem: function (k, v) { real.setItem(DEMO_PREFIJO + k, String(v)); },
      removeItem: function (k) { real.removeItem(DEMO_PREFIJO + k); },
      key: function (i) { var c = claves(); return i < c.length ? c[i] : null; },
      get length() { return claves().length; },
      borrarTodo: function () { claves().forEach(function (k) { real.removeItem(DEMO_PREFIJO + k); }); }
    };
  }

  var DATA = window.SURGERIES_DATA || {};
  /* Equipos (25-09-2026): cada plantilla y cada caso llevan un campo
   * "equipo_id" ("inomed", "cadwell"...) y sus cajas salen de ese equipo.
   * El material, las etiquetas y el catálogo son los mismos para todos. Lo
   * que no trae el campo -todo lo anterior a este cambio- es Inomed, así que
   * no hay nada que migrar. Las claves de caja de cada equipo son distintas
   * entre sí (las de Cadwell llevan prefijo), por eso infoCaja()/entradasDe()
   * buscan en CAJAS_TODAS sin necesitar saber el equipo; lo que RECORRE las
   * cajas usa cajasDe(montaje o caso). OJO: el caso ya tenía un campo de texto
   * libre "equipo" (Desarrollo intraoperatorio), que no tiene nada que ver y
   * no se toca. Se llama "equipo" (no "escenario") y no
   * "escenario": esa palabra ya significa otras dos cosas aquí. */
  var EQUIPO_DEFECTO = "inomed";
  var EQUIPOS = DATA.equipos || {};
  if (!EQUIPOS[EQUIPO_DEFECTO]) EQUIPOS[EQUIPO_DEFECTO] = { nombre: "Inomed", corto: "I" };
  var CAJAS_POR_EQUIPO = {};
  var CAJAS_TODAS = {};
  Object.keys(EQUIPOS).forEach(function (eq) {
    var cajas = (eq === EQUIPO_DEFECTO ? DATA.cajas_material : DATA["cajas_" + eq]) || {};
    CAJAS_POR_EQUIPO[eq] = cajas;
    Object.keys(cajas).forEach(function (k) { CAJAS_TODAS[k] = cajas[k]; });
  });
  // Solo lo usa Docencia > Cama de quirófano, que no depende de ningún montaje.
  var CAJAS = CAJAS_POR_EQUIPO[EQUIPO_DEFECTO];
  // Equipo que se propone para lo NUEVO (demo-congreso B4.F1): el marcado
  // "por_defecto" en data/surgeries.js, si tiene cajas y está activo. Es
  // distinto de EQUIPO_DEFECTO, que es lo que se supone para lo que no trae
  // equipo_id (todo lo antiguo es Inomed): así otro servicio puede trabajar
  // con su propio equipo sin migrar nada de lo ya guardado.
  function equipoNuevo() {
    var disponibles = equiposConCajas();
    var marcado = disponibles.filter(function (e) { return EQUIPOS[e].por_defecto; })[0];
    return marcado || (disponibles.indexOf(EQUIPO_DEFECTO) !== -1 ? EQUIPO_DEFECTO : (disponibles[0] || EQUIPO_DEFECTO));
  }

  function equipoDe(obj) {
    var e = obj && obj.equipo_id;
    return CAJAS_POR_EQUIPO[e] ? e : EQUIPO_DEFECTO;
  }
  function cajasDe(obj) { return CAJAS_POR_EQUIPO[equipoDe(obj)]; }
  // Solo cuentan los equipos que ya tienen cajas: mientras solo haya uno,
  // la app se ve exactamente igual que antes (sin preguntar ni rotular).
  function equiposConCajas() {
    // "activo": false deja un equipo configurado pero sin ofrecer -salvo en el
    // modo demo, para poder probarlo antes de usarlo con casos reales-.
    return Object.keys(EQUIPOS).filter(function (e) {
      return Object.keys(CAJAS_POR_EQUIPO[e]).length > 0 && (EQUIPOS[e].activo !== false || MODO_DEMO);
    });
  }
  function hayVariosEquipos() { return equiposConCajas().length > 1; }
  function nombreEquipo(eq) { return campo(EQUIPOS[eq] || {}, "nombre") || eq; }
  function cortoEquipo(eq) { return (EQUIPOS[eq] || {}).corto || eq; }
  // Material que solo existe en algunos equipos (p. ej. el conmutador de la
  // caja TES de Inomed: en Cadwell se conmuta por software). Sin "equipos",
  // vale para todos.
  function itemEnEquipo(item, eq) {
    var lista = item && item.equipos;
    return !lista || !lista.length || lista.indexOf(eq) !== -1;
  }
  var CATALOGO_BASE = DATA.catalogo_material || [];
  var ETIQUETAS_BASE = DATA.etiquetas || [];
  var TECNICAS_BASE = DATA.tecnicas || [];
  var SERVICIOS_BASE = DATA.servicios || [];
  var INTERVENCIONES_BASE = DATA.intervenciones || [];
  var PERFILES_BASE = DATA.perfiles_procedimiento || [];
  // Quién usa la herramienta. Va VACÍO de fábrica y se rellena desde la app:
  // los nombres de personas reales no se escriben en este repositorio, que es
  // público. Creados desde la interfaz viven en estado.json, que es privado.
  var USUARIOS_BASE = [];
  // Solo para la ventana docente: qué músculo depende de qué raíces
  var MIOTOMAS = DATA.miotomas || [];
  // "Cómo se realizó cada técnica" (10-09-2026): campos propios por técnica,
  // en vez de la rejilla fija de 8 genéricos que había antes. Ver la
  // cabecera de data/parametros-tecnicas.js para el porqué de
  // TECPAR_ID_MAP -esta tabla usa sus propios ids, no siempre iguales a los
  // de TECNICAS_BASE- y para el significado de cada "tipo" de campo.
  var PARAMETROS_TECNICAS = (window.PARAMETROS_TECNICAS || {}).tecnicas || [];
  var TECPAR_ID_MAP = window.TECPAR_ID_MAP || {};
  var TECPAR_INDICE = {};
  PARAMETROS_TECNICAS.forEach(function (t) { TECPAR_INDICE[t.id] = t; });
  function definicionTecPar(tecId) {
    return TECPAR_INDICE[TECPAR_ID_MAP[tecId] || tecId] || null;
  }
  var STORAGE_KEY = "mio_ionm_escenarios_v1";

  /* ---------------------------------------------------------------- *
   * Idioma
   *
   * Los textos de la interfaz salen de TEXTOS. Los de los datos
   * (data/surgeries.js) llevan el inglés en un campo paralelo con sufijo
   * "_en": "nombre" / "nombre_en". Lo que escribe el usuario —sus
   * escenarios, etiquetas y material propio— se queda como lo escribió,
   * porque no hay forma de traducirlo solo.
   * ---------------------------------------------------------------- */
  var IDIOMA_KEY = "mio_ionm_idioma";
  var IDIOMAS = ["es", "en"];
  var idioma = "es";

  var TEXTOS = {
    /* --- Barra superior y herramientas --- */
    idioma_titulo:       { es: "Switch to English", en: "Cambiar a español" },
    sync_titulo:         { es: "Sincronizar con GitHub", en: "Sync with GitHub" },
    btn_exportar_casos:  { es: "Informe de casos (PDF)", en: "Cases report (PDF)" },
    btn_exportar_casos_tit: { es: "Abre un informe imprimible de los casos que cumplen los filtros de arriba (Estado/Desde/Hasta/Destacados/Seguimiento) -usa \"Guardar como PDF\" en el diálogo de impresión del navegador. En pruebas: dilo si algo no sale bien.",
                           en: "Opens a printable report of the cases matching the filters above (Status/From/To/Notable/Follow-up) -use \"Save as PDF\" in the browser's print dialog. Still being tested: let me know if something looks off." },
    btn_exportar_casos_csv: { es: "Exportar CSV", en: "Export CSV" },
    btn_exportar_casos_csv_tit: { es: "Descargar en un CSV los casos que cumplen los filtros de arriba (Estado/Desde/Hasta/Destacados/Seguimiento), sin esperar a la sincronización automática con el Sheet",
                           en: "Download as a CSV the cases matching the filters above (Status/From/To/Notable/Follow-up), without waiting for automatic Sheet sync" },
    casos_exportados:    { es: "Casos exportados a CSV.", en: "Cases exported to CSV." },
    btn_exportar_eventos_csv: { es: "Exportar eventos y alarmas (CSV)", en: "Export events and alarms (CSV)" },
    btn_exportar_eventos_csv_tit: { es: "Descargar en un CSV los eventos (F) y las alarmas (G) del Registro intraoperatorio de los casos que cumplen los filtros de arriba: una fila por evento o alarma, con el ID del caso para cruzarlo con el CSV de casos",
                           en: "Download as a CSV the events (F) and alarms (G) from the Intraoperative log of the cases matching the filters above: one row per event or alarm, with the case ID to join it with the cases CSV" },
    eventos_exportados:  { es: "Eventos y alarmas exportados a CSV ({n} filas).", en: "Events and alarms exported to CSV ({n} rows)." },
    eventos_sin_datos:   { es: "Ninguno de los casos filtrados tiene eventos ni alarmas en el Registro intraoperatorio.", en: "None of the filtered cases has events or alarms in the Intraoperative log." },
    caso_pdf_sin_datos:  { es: "Todavía no hay ningún caso que exportar.", en: "There are no cases to export yet." },
    caso_pdf_popup_bloqueado: { es: "El navegador ha bloqueado la pestaña del informe. Permite las ventanas emergentes para esta página e inténtalo de nuevo.",
                           en: "The browser blocked the report tab. Allow pop-ups for this page and try again." },
    caso_pdf_reflejos:   { es: "Reflejos", en: "Reflexes" },
    caso_pdf_cajas:      { es: "Cajas y montaje", en: "Boxes and montage" },
    caso_pdf_titulo_varios: { es: "Informe de casos", en: "Case report" },
    btn_duplicar:        { es: "Duplicar", en: "Duplicate" },
    btn_renombrar:       { es: "Renombrar", en: "Rename" },
    btn_vaciar:          { es: "Vaciar", en: "Empty" },
    btn_borrar:          { es: "Borrar", en: "Delete" },
    btn_guardar_montaje: { es: "Guardar plantilla", en: "Save template" },
    montajes_mas:        { es: "Más acciones", en: "More actions" },
    dlg_guardar_montaje_titulo: { es: "Guardar plantilla", en: "Save template" },
    guardar_montaje_intro: { es: "¿Qué quieres hacer con «{nombre}»?", en: "What do you want to do with “{nombre}”?" },
    guardar_montaje_nuevo: { es: "Guardar como nuevo", en: "Save as new" },
    guardar_montaje_sobrescribir: { es: "Sobrescribir este", en: "Overwrite this one" },
    montaje_guardado:    { es: "Plantilla guardada.", en: "Template saved." },
    btn_exportar:        { es: "Exportar copia", en: "Export backup" },
    btn_importar:        { es: "Importar copia", en: "Import backup" },
    btn_imprimir:        { es: "Imprimir", en: "Print" },
    btn_restablecer:     { es: "Restablecer", en: "Reset" },

    /* --- Estado de guardado y sincronización --- */
    guardado_local:      { es: "Los cambios se guardan solos en este navegador.",
                           en: "Changes are saved automatically in this browser." },
    guardado_nube:       { es: "Los cambios se guardan solos y se suben a GitHub.",
                           en: "Changes are saved automatically and uploaded to GitHub." },
    guardado_en:         { es: "Guardado en este navegador · {hora}", en: "Saved in this browser · {hora}" },
    guardado_error:      { es: "No se ha podido guardar: {error}", en: "Could not save: {error}" },
    guardado_error_caso: { es: "El caso {id} no cabe en la memoria del navegador de este móvil (demasiadas fotos). Se ha intentado subir a GitHub igualmente -no cierres la app hasta ver \"Sinc.\" actualizado arriba-.",
                           en: "Case {id} does not fit in this phone's browser storage (too many photos). It was still uploaded to GitHub -don't close the app until \"Synced\" updates above-." },
    traido_de_github:    { es: "Traído de GitHub · {hora}", en: "Fetched from GitHub · {hora}" },
    sync_sin_conectar:   { es: "Sin conectar", en: "Not connected" },
    sync_conflicto:      { es: "Conflicto", en: "Conflict" },
    sync_sincronizando:  { es: "Sincronizando…", en: "Syncing…" },
    sync_sin_subir:      { es: "Sin subir", en: "Not uploaded" },
    sync_guardando:      { es: "Guardando…", en: "Saving…" },
    sync_conectado:      { es: "Conectado", en: "Connected" },
    sync_fecha:          { es: "Sinc. {fecha}", en: "Synced {fecha}" },
    sync_conflicto_tit:  { es: "En GitHub hay una versión más reciente. Abre para resolverlo.",
                           en: "There is a newer version on GitHub. Open to resolve it." },
    sync_subiendo:       { es: "Subiendo…", en: "Uploading…" },
    sync_bajando:        { es: "Bajando…", en: "Downloading…" },
    sync_subido:         { es: "Subido correctamente.", en: "Uploaded successfully." },
    sync_bajado:         { es: "Descargado correctamente.", en: "Downloaded successfully." },
    sync_faltan_datos:   { es: "Hacen falta el repositorio y el token.", en: "Repository and token are required." },
    sync_formato_repo:   { es: "El repositorio debe tener el formato usuario/repositorio.",
                           en: "The repository must be in the format user/repository." },
    sync_desconectado:   { es: "Desconectado de GitHub.", en: "Disconnected from GitHub." },
    sync_vacio:          { es: "Todavía no hay nada guardado en ese repositorio. Pulsa «Subir» para crearlo.",
                           en: "Nothing saved in that repository yet. Press “Upload” to create it." },
    sync_mal_formato:    { es: "El archivo remoto no tiene el formato esperado.",
                           en: "The remote file is not in the expected format." },
    sync_cancelado_sub:  { es: "Subida cancelada. Pulsa «Bajar» para traer la versión de GitHub.",
                           en: "Upload cancelled. Press “Download” to fetch the GitHub version." },
    sync_cancelado_baj:  { es: "Descarga cancelada.", en: "Download cancelled." },
    sync_error_subir:    { es: "No se ha podido subir.", en: "Could not upload." },
    sync_error_bajar:    { es: "No se ha podido bajar.", en: "Could not download." },
    sync_olvidar_conf:   { es: "¿Olvidar el token y el repositorio en este dispositivo?\nTus escenarios no se borran, y lo guardado en GitHub tampoco.",
                           en: "Forget the token and repository on this device?\nYour scenarios are not deleted, nor is anything stored on GitHub." },
    sync_pisar:          { es: "En GitHub hay una versión más reciente ({fecha}) que no tienes en este dispositivo.\n\nSi subes ahora, la sustituyes y pierdes esos cambios.\nCancela y pulsa «Bajar» si prefieres traértela primero.\n\n¿Subir de todas formas?",
                           en: "There is a newer version on GitHub ({fecha}) that you do not have on this device.\n\nUploading now replaces it and loses those changes.\nCancel and press “Download” if you would rather fetch it first.\n\nUpload anyway?" },
    sync_traer:          { es: "Traer de GitHub la versión del {fecha}:\n· {escenarios} escenario(s)\n· {materiales} material(es) propios\n\nSustituye lo que tengas en este dispositivo. ¿Continuar?",
                           en: "Fetch the GitHub version from {fecha}:\n· {escenarios} scenario(s)\n· {materiales} custom material(s)\n\nThis replaces what you have on this device. Continue?" },
    sync_fecha_desc:     { es: "fecha desconocida", en: "unknown date" },
    err_token:           { es: "Token no válido o caducado.", en: "Invalid or expired token." },
    err_permiso:         { es: "El token no tiene permiso de escritura sobre ese repositorio.",
                           en: "The token has no write permission on that repository." },
    err_no_repo:         { es: "No se encuentra el repositorio. Revisa el nombre y que el token lo incluya.",
                           en: "Repository not found. Check the name and that the token covers it." },
    err_conflicto:       { es: "Conflicto: el archivo remoto ha cambiado.", en: "Conflict: the remote file has changed." },
    err_generico:        { es: "GitHub respondió {codigo}.", en: "GitHub responded {codigo}." },

    /* --- Catálogo --- */
    catalogo_titulo:     { es: "Catálogo", en: "Catalogue" },
    catalogo_buscar:     { es: "Buscar material o tipo…", en: "Search material or type…" },
    catalogo_sin_result: { es: "Ningún material coincide con la búsqueda.", en: "No material matches the search." },
    catalogo_ayuda:      { es: "Pulsa un ítem y luego la entrada donde va. También puedes arrastrarlo. Para quitarlo: ✕ o arrástralo aquí. Con <b>+</b> añades material propio y en <b>Etiquetas</b> defines los tipos físicos.",
                           en: "Tap an item and then the input it goes in. You can also drag it. To remove it: ✕ or drag it here. Use <b>+</b> to add your own material and <b>Labels</b> to define the physical types." },
    btn_etiquetas:       { es: "Etiquetas", en: "Labels" },
    btn_etiquetas_tit:   { es: "Gestionar etiquetas (tipos físicos de material)", en: "Manage labels (physical material types)" },
    btn_nuevo_mat_tit:   { es: "Añadir material nuevo al catálogo", en: "Add new material to the catalogue" },
    chip_tipo:           { es: "Tipo: {tipo}", en: "Type: {tipo}" },
    chip_sin_etiqueta:   { es: "sin etiqueta", en: "no label" },
    chip_editar_tit:     { es: "Editar este material", en: "Edit this material" },
    chip_quitar_tit:     { es: "Quitar de esta entrada", en: "Remove from this input" },
    chip_foto_tit:       { es: "Ver foto", en: "View photo" },
    chip_enlazar_tit:    { es: "Enlazar a un cork de referencia", en: "Link to a reference cork" },
    puente_enlazando:    { es: "Enlazando Puente", en: "Linking Bridge" },
    puente_enlazando_ayuda: { es: "— toca el cork de referencia ya colocado (en cualquier caja)",
                           en: "— tap the reference cork already placed (in any box)" },
    puente_enlace_etiqueta: { es: "→ {canal}", en: "→ {canal}" },
    puente_enlace_tit:   { es: "Enlazado a {canal} en {caja}", en: "Linked to {canal} in {caja}" },
    dlg_elegir_titulo:   { es: "Elegir material", en: "Choose material" },
    elegir_destino:      { es: "Va a la entrada {entrada} de {caja}.", en: "Goes to input {entrada} of {caja}." },
    elegir_ocupada:      { es: "Ahora hay {item}: lo que elijas lo sustituye.",
                           en: "Currently {item}: whatever you pick replaces it." },
    elegir_quitar:       { es: "Dejar la entrada vacía", en: "Leave the input empty" },
    slot_elegir_tit:     { es: "Pulsa para elegir material para esta entrada",
                           en: "Tap to choose material for this input" },
    colocando:           { es: "Colocando", en: "Placing" },
    colocando_ayuda:     { es: "— pulsa una entrada", en: "— tap an input" },
    cancelar:            { es: "Cancelar", en: "Cancel" },

    /* --- Técnicas --- */
    tecnicas_titulo:     { es: "Técnicas", en: "Techniques" },
    grupo_monitorizacion:{ es: "Técnicas de monitorización", en: "Monitoring techniques" },
    grupo_mapeo:         { es: "Técnicas de mapeo", en: "Mapping techniques" },
    tec_desactivada:     { es: "Desactivada: ya no se ofrece para casos nuevos, pero sigue marcada aquí",
                           en: "Deactivated: no longer offered for new cases, but still selected here" },
    perfil_label:        { es: "Perfil", en: "Profile" },
    perfil_elegir:       { es: "— sin resaltar —", en: "— no highlight —" },

    /* --- Cajas --- */
    cajas_titulo:        { es: "Cajas", en: "Boxes" },
    cajas_cuenta:        { es: "{n} de {total} con material", en: "{n} of {total} with material" },

    /* --- Resumen --- */
    resumen_titulo:      { es: "Resumen de técnicas y material", en: "Techniques and material summary" },
    resumen_sin_esc:     { es: "No hay ningún escenario. Crea uno con “+ Nuevo”.",
                           en: "There are no scenarios. Create one with “New”." },
    resumen_vacio:       { es: "Escenario vacío. Arrastra material del catálogo a las entradas de las cajas.",
                           en: "Empty scenario. Drag material from the catalogue onto the box inputs." },
    resumen_material:    { es: "Material a preparar", en: "Material to prepare" },
    resumen_conmutador_nota: { es: "reparte en C1, C2, C3, C4, Cz-1, Cz+6",
                               en: "splits into C1, C2, C3, C4, Cz-1, Cz+6" },
    resumen_coste:       { es: "Coste del material", en: "Material cost" },
    coste_tipo:          { es: "Tipo", en: "Type" },
    coste_cantidad:      { es: "Cantidad", en: "Quantity" },
    coste_unitario:      { es: "Unitario", en: "Unit price" },
    coste_importe:       { es: "Importe", en: "Amount" },
    coste_total:         { es: "Total de la intervención", en: "Surgery total" },
    coste_reutilizable_nota: { es: "No incluye el material reutilizable (sondas, gafas, auriculares): se prepara, pero no se gasta.",
                           en: "Excludes reusable material (probes, goggles, headphones): it is prepared, but not consumed." },
    coste_sin_datos:     { es: "Todavía no hay ningún precio puesto. Se ponen en el botón «Etiquetas», uno por tipo de material.",
                           en: "No prices set yet. Set them in the “Labels” button, one per material type." },
    coste_sin_precio:    { es: "Falta el precio de: {tipos}. Ese material no entra en el total.",
                           en: "Missing price for: {tipos}. That material is not included in the total." },
    resumen_cajas:       { es: "Cajas necesarias ({n})", en: "Boxes needed ({n})" },
    resumen_extra:       { es: "Material extra (no ocupa entrada)", en: "Extra material (no input used)" },
    resumen_avisos:      { es: "Avisos", en: "Warnings" },
    // Revisión del montaje (demo-congreso B3.F1)
    resumen_revision:    { es: "Revisión del montaje", en: "Montage check" },
    resumen_revision_ay: { es: "Avisos orientativos: no impiden nada ni se guardan en el caso.", en: "For guidance only: they do not block anything and are not saved in the case." },
    rev_gnd:             { es: "{caja}: {n} entradas ocupadas y el GND vacío.", en: "{caja}: {n} inputs in use and GND empty." },
    rev_falta:           { es: "{tecnica}: no hay {falta}.", en: "{tecnica}: no {falta} placed." },
    rev_falta_si:        { es: "{tecnica}: hay {cond}, pero no hay {falta}.", en: "{tecnica}: {cond} is placed, but no {falta}." },
    rev_o:               { es: " o ", en: " or " },
    rev_y_mas:           { es: " y {n} más", en: " and {n} more" },
    rev_sobra:           { es: "{items}: ninguna técnica marcada lo usa ({tecnicas}). ¿Falta marcar alguna?", en: "{items}: no ticked technique uses it ({tecnicas}). Is one missing?" },
    rev_sobra_n:         { es: "{items}: ninguna técnica marcada los usa ({tecnicas}). ¿Falta marcar alguna?", en: "{items}: no ticked technique uses them ({tecnicas}). Is one missing?" },
    rev_sobra_sin:       { es: "{items}: ninguna técnica marcada lo usa.", en: "{items}: no ticked technique uses it." },
    rev_sobra_sin_n:     { es: "{items}: ninguna técnica marcada los usa.", en: "{items}: no ticked technique uses them." },
    resumen_entradas:    { es: "{usadas}/{total} entradas", en: "{usadas}/{total} inputs" },
    resumen_redondeo:    { es: "Redondeado hacia arriba: {cantidad} paquetes en uso",
                           en: "Rounded up: {cantidad} packs in use" },
    aviso_pendiente:     { es: "Pendiente de confirmar: {texto}", en: "Pending confirmation: {texto}" },

    /* --- Montajes: acciones --- */
    restablecido:        { es: "Restablecido a los presets del archivo.", en: "Reset to the presets from the file." },
    esc_nuevo_def:       { es: "Cirugía nueva", en: "New surgery" },
    esc_duplicar_prompt: { es: "Nombre de la copia:", en: "Name of the copy:" },
    esc_copia_sufijo:    { es: " (copia)", en: " (copy)" },
    esc_renombrar:       { es: "Nuevo nombre:", en: "New name:" },
    esc_vaciar_conf:     { es: "¿Vaciar “{nombre}”?\nSe quita todo el material colocado, pero el escenario se conserva.",
                           en: "Empty “{nombre}”?\nAll placed material is removed, but the scenario is kept." },
    esc_borrar_conf:     { es: "¿Borrar “{nombre}”?\nEsta acción no se puede deshacer.",
                           en: "Delete “{nombre}”?\nThis cannot be undone." },
    restablecer_conf:    { es: "¿Restablecer todo?\nSe perderán los escenarios creados y las ediciones, volviendo a los presets del archivo data/surgeries.js.",
                           en: "Reset everything?\nCreated scenarios and edits will be lost, returning to the presets in data/surgeries.js." },
    exportado:           { es: "Copia exportada. Guárdala o pásala al otro dispositivo.",
                           en: "Backup exported. Save it or move it to the other device." },
    import_no_json:      { es: "El archivo no es un JSON válido.", en: "The file is not valid JSON." },
    import_no_formato:   { es: "El archivo no parece una copia de esta herramienta.",
                           en: "The file does not look like a backup from this tool." },
    importado:           { es: "Copia importada correctamente.", en: "Backup imported successfully." },
    import_conf:         { es: "Importar esta copia:\n· {escenarios} escenario(s)\n· {materiales} material(es) propios\n\nSustituye lo que tengas en este navegador. ¿Continuar?",
                           en: "Import this backup:\n· {escenarios} scenario(s)\n· {materiales} custom material(s)\n\nThis replaces what you have in this browser. Continue?" },

    /* --- Diálogo de material --- */
    dlg_mat_nuevo:       { es: "Material nuevo", en: "New material" },
    dlg_mat_editar:      { es: "Editar material", en: "Edit material" },
    campo_nombre:        { es: "Nombre", en: "Name" },
    campo_categoria:     { es: "Categoría", en: "Category" },
    catalogo_ampliacion: { es: "Ampliación", en: "More" },
    campo_etiqueta:      { es: "Etiqueta (tipo físico)", en: "Label (physical type)" },
    campo_etiqueta_ay:   { es: "Es lo que se suma en el recuento del resumen y lo que da el aspecto al chip.",
                           en: "This is what gets counted in the summary and what gives the chip its look." },
    campo_gestionar:     { es: "Gestionar…", en: "Manage…" },
    campo_gestionar_t:   { es: "Crear o editar etiquetas", en: "Create or edit labels" },
    grupo_aspecto:       { es: "Aspecto — deja «Como la etiqueta» para heredarlo",
                           en: "Appearance — leave “As the label” to inherit it" },
    campo_borde:         { es: "Borde", en: "Border" },
    campo_color_borde:   { es: "Color del borde", en: "Border colour" },
    campo_fondo:         { es: "Fondo", en: "Background" },
    campo_color_medida:  { es: "Color a medida", en: "Custom colour" },
    como_etiqueta:       { es: "Como la etiqueta", en: "As the label" },
    sin_color:           { es: "Sin color", en: "No colour" },
    sin_fondo:           { es: "Sin fondo", en: "No background" },
    vista_previa:        { es: "Así se verá:", en: "Preview:" },
    ejemplo:             { es: "Ejemplo", en: "Example" },
    campo_sin_entrada:   { es: "No ocupa entrada", en: "Uses no input" },
    campo_precio:        { es: "Precio por unidad (€)", en: "Unit price (€)" },
    campo_fungible:      { es: "Se gasta (fungible)", en: "Consumable" },
    campo_precio_ay:     { es: "Déjalo en blanco si todavía no sabes el precio: en blanco es «sin dato», no cero. Desmarca «se gasta» en lo reutilizable (sondas, gafas, auriculares): sale en el material a preparar, pero no suma al coste.",
                           en: "Leave blank if you do not know the price yet: blank means “no data”, not zero. Untick “consumable” for reusable items (probes, goggles, headphones): they still appear in the material list, but add nothing to the cost." },
    campo_manta:         { es: "Se cobra por manta (no por electrodo)", en: "Charged per mat (not per electrode)" },
    campo_manta_ay:      { es: "Márcalo cuando el material viene en un conjunto que se abre entero de una vez (p. ej. una manta de electrodos GRID): el coste cuenta 1 unidad aunque solo se coloque parte del conjunto.",
                           en: "Tick this when the material comes as a set that is opened whole in one go (e.g. a GRID electrode mat): the cost counts 1 unit even if only part of the set gets placed." },
    campo_doble:         { es: "Cada colocación gasta 2 unidades (activo + referencia)", en: "Each placement uses 2 units (active + reference)" },
    campo_doble_ay:      { es: "Márcalo cuando cada posición necesita dos electrodos sueltos en vez de uno (p. ej. hook-wire: activo y referencia por separado). El material a preparar y el coste cuentan el doble por cada entrada colocada con esta etiqueta.",
                           en: "Tick this when each position needs two separate electrodes instead of one (e.g. hook-wire: active and reference apart). Material to prepare and cost both count double for every entry placed with this label." },
    et_precio_malo:      { es: "El precio tiene que ser un número de 0 en adelante, o quedarse en blanco.",
                           en: "The price must be a number from 0 upwards, or left blank." },
    campo_nota:          { es: "Nota", en: "Note" },
    campo_nota_ph:       { es: "Para qué se usa, aclaraciones…", en: "What it is used for, clarifications…" },
    mat_ph_nombre:       { es: "p. ej. L.Frontalis", en: "e.g. L.Frontalis" },
    mat_ph_categoria:    { es: "p. ej. Músculos craneales (pares craneales)", en: "e.g. Cranial muscles (cranial nerves)" },
    mat_obligatorios:    { es: "Nombre, categoría y etiqueta son obligatorios.",
                           en: "Name, category and label are required." },
    mat_borrar_conf:     { es: "¿Borrar “{nombre}” del catálogo?", en: "Delete “{nombre}” from the catalogue?" },
    mat_borrar_usos:     { es: "\n\nEstá colocado en {n} entrada(s) de tus escenarios; también se quitará de ahí.",
                           en: "\n\nIt is placed in {n} input(s) of your scenarios; it will be removed from there too." },
    guardar:             { es: "Guardar", en: "Save" },
    cerrar:              { es: "Cerrar", en: "Close" },
    btn_cerrar_app:      { es: "Cerrar MIO-Check", en: "Close MIO-Check" },
    confirmar_salir:     { es: "¿Seguro que quieres salir de MIO-Check?", en: "Are you sure you want to exit MIO-Check?" },
    confirmar_salir_pendiente: { es: "Tienes cambios sin sincronizar todavía. Si sales ahora podrías perderlos.",
                           en: "You still have unsynced changes. If you exit now you could lose them." },

    /* --- Diálogo de etiquetas --- */
    dlg_et_titulo:       { es: "Etiquetas — tipos físicos de material", en: "Labels — physical material types" },
    dlg_et_intro:        { es: "Una etiqueta es de qué está hecho el ítem: aguja trenzada, sacacorchos, pegatina… Decide <b>qué se cuenta</b> en el resumen y <b>cómo se ve</b> el chip. Pulsa una para editarla, o rellena el formulario para crear otra.",
                           en: "A label is what the item is made of: twisted-pair needle, corkscrew, sticker… It decides <b>what gets counted</b> in the summary and <b>how the chip looks</b>. Tap one to edit it, or fill in the form to create another." },
    et_nueva:            { es: "Etiqueta nueva", en: "New label" },
    et_editar:           { es: "Editar «{nombre}»", en: "Edit “{nombre}”" },
    et_de_fabrica:       { es: " (de fábrica)", en: " (built-in)" },
    et_nombre_ayuda:     { es: "Es el texto que aparece en «Material a preparar».",
                           en: "This is the text shown under “Material to prepare”." },
    et_ph_nombre:        { es: "p. ej. Electrodo de copa", en: "e.g. Cup electrode" },
    et_sin_nombre:       { es: "La etiqueta necesita un nombre.", en: "The label needs a name." },
    et_repetida:         { es: "Ya existe una etiqueta llamada «{nombre}».", en: "A label called “{nombre}” already exists." },
    et_minimo:           { es: "Tiene que quedar al menos una etiqueta.", en: "At least one label must remain." },
    et_usos_tit:         { es: "{n} material(es) del catálogo usan esta etiqueta", en: "{n} catalogue material(s) use this label" },
    et_es_fabrica_tit:   { es: " · de fábrica", en: " · built-in" },
    et_borrar_conf:      { es: "¿Borrar la etiqueta “{nombre}”?", en: "Delete the label “{nombre}”?" },
    et_borrar_afecta:    { es: "\n\n{materiales} material(es) del catálogo y {colocaciones} colocación(es) pasarán a “{destino}”.",
                           en: "\n\n{materiales} catalogue material(s) and {colocaciones} placement(s) will move to “{destino}”." },
    et_borrar_fabrica:   { es: "\n\nEs una etiqueta de fábrica: volverá si pulsas «Restablecer».",
                           en: "\n\nThis is a built-in label: it will come back if you press “Reset”." },
    et_btn_nueva:        { es: "Nueva", en: "New" },

    /* --- Bordes --- */
    borde_solido:        { es: "Sólido", en: "Solid" },
    borde_punteado:      { es: "Punteado", en: "Dotted" },
    borde_discontinuo:   { es: "Discontinuo", en: "Dashed" },
    borde_doble:         { es: "Doble", en: "Double" },
    borde_grueso:        { es: "Grueso", en: "Thick" },
    borde_ninguno:       { es: "Sin borde", en: "No border" },

    /* --- Colores --- */
    color_rojo:          { es: "Rojo", en: "Red" },
    color_azul:          { es: "Azul", en: "Blue" },
    color_verde:         { es: "Verde", en: "Green" },
    color_amarillo:      { es: "Amarillo", en: "Yellow" },
    color_negro:         { es: "Negro", en: "Black" },
    color_naranja:       { es: "Naranja", en: "Orange" },
    color_morado:        { es: "Morado", en: "Purple" },
    color_turquesa:      { es: "Turquesa", en: "Teal" },
    color_gris:          { es: "Gris", en: "Grey" },
    color_granate:       { es: "Granate", en: "Maroon" },

    /* --- Casos --- */
    casos_nuevo_cero:    { es: "Crear caso", en: "Create case" },
    casos_nuevo_cero_ay: { es: "Te lleva al Organizador de Montajes para construir el montaje de este caso -a mano, o a partir de una plantilla-. Rellenas el resto de la ficha cuando quieras.",
                           en: "Takes you to the Montage Organizer to build this case's montage -from scratch, or from a template-. Fill in the rest of the form whenever you like." },
    casos_filtro_estado: { es: "Estado", en: "Status" },
    casos_filtro_todos:  { es: "Todos", en: "All" },
    casos_filtro_desde:  { es: "Desde", en: "From" },
    casos_filtro_hasta:  { es: "Hasta", en: "To" },
    casos_filtro_orden:  { es: "Ordenar por", en: "Sort by" },
    casos_orden_fecha:   { es: "Fecha (recientes primero)", en: "Date (newest first)" },
    casos_orden_fecha_asc: { es: "Fecha (antiguos primero)", en: "Date (oldest first)" },
    casos_orden_dificultad: { es: "Dificultad (mayor primero)", en: "Difficulty (hardest first)" },
    casos_orden_dificultad_asc: { es: "Dificultad (menor primero)", en: "Difficulty (easiest first)" },
    casos_filtro_destacados: { es: "Destacados", en: "Notable" },
    casos_filtro_seguimiento: { es: "Seguimiento", en: "Follow-up" },
    casos_vacio:         { es: "Todavía no hay ningún caso.", en: "No cases yet." },
    casos_sin_filtro:    { es: "Ningún caso con esos filtros.", en: "No cases match those filters." },
    casos_n:             { es: "{n} caso(s)", en: "{n} case(s)" },
    casos_sin_subir:     { es: "{n} sin subir", en: "{n} not uploaded" },

    /* --- Apuntes (personales, privados): un documento continuo, no una
       lista de notas sueltas -rehecho el 07-09-2026-. */
    tile_apuntes:        { es: "Mis apuntes", en: "My notes" },
    apuntes_intro:       { es: "Tu documento continuo de parámetros, filtros y fotos propias -no lo que ya viene en Técnicas MIO-, como un Word que vas actualizando. Se guarda solo, en tu repositorio privado.",
                           en: "Your running document of your own parameters, filters and photos -not what's already in MIO Techniques-, like a Word file you keep updating. Saves itself, to your private repository." },
    apunte_seccion_titulo_ph: { es: "Título (opcional)", en: "Title (optional)" },
    apunte_secciones_vacio: { es: "Todavía no hay ninguna caja de texto. Añade la primera.",
                           en: "No text box yet. Add the first one." },
    apunte_anadir_seccion: { es: "+ Añadir caja de texto", en: "+ Add text box" },
    apunte_anadir_carpeta: { es: "+ Nueva carpeta", en: "+ New folder" },
    apunte_carpeta_nueva_prompt: { es: "Nombre de la carpeta nueva:", en: "New folder name:" },
    apunte_carpeta_renombrar_prompt: { es: "Nuevo nombre de la carpeta:", en: "New folder name:" },
    apunte_carpeta_renombrar_tit: { es: "Renombrar carpeta", en: "Rename folder" },
    apunte_carpeta_borrar_tit: { es: "Borrar carpeta -las cajas de dentro no se borran, pasan a \"Sin carpeta\"",
                           en: "Delete folder -the boxes inside aren't deleted, they move to \"No folder\"" },
    apunte_carpeta_borrar_conf: { es: "¿Borrar la carpeta \"{nombre}\"? Las cajas de dentro no se borran, pasan a \"Sin carpeta\".",
                           en: "Delete folder \"{nombre}\"? The boxes inside won't be deleted, they'll move to \"No folder\"." },
    apunte_carpeta_sin:  { es: "Sin carpeta", en: "No folder" },
    apunte_carpeta_color_tit: { es: "Cambiar el color de la carpeta", en: "Change the folder colour" },
    apunte_carpeta_subir_tit: { es: "Subir la carpeta", en: "Move folder up" },
    apunte_carpeta_bajar_tit: { es: "Bajar la carpeta", en: "Move folder down" },
    apunte_seccion_subir_tit: { es: "Subir esta caja", en: "Move this box up" },
    apunte_seccion_bajar_tit: { es: "Bajar esta caja", en: "Move this box down" },
    apunte_negrita_tit:  { es: "Negrita (Ctrl+B)", en: "Bold (Ctrl+B)" },
    apunte_cursiva_tit:  { es: "Cursiva (Ctrl+I)", en: "Italic (Ctrl+I)" },
    apunte_foto_anadir_caja: { es: "＋ Añadir foto", en: "＋ Add photo" },
    apunte_guardar:      { es: "Guardar", en: "Save" },
    apunte_guardado_estado: { es: "Guardado en este dispositivo a las {hora}", en: "Saved on this device at {hora}" },
    apunte_estado_pendiente: { es: " · pendiente de subir", en: " · waiting to upload" },
    apunte_estado_subido: { es: " · subido", en: " · uploaded" },
    apunte_editor_ph:    { es: "Escribe aquí…", en: "Write here…" },
    apunte_carpeta_vacia: { es: "Ninguna caja en esta carpeta todavía.", en: "No boxes in this folder yet." },
    apunte_seccion_mover_tit: { es: "Mover esta caja a otra carpeta", en: "Move this box to another folder" },
    apunte_campo_fotos:  { es: "Fotos", en: "Photos" },
    apunte_foto_ver_tit: { es: "Ver a tamaño completo", en: "View full size" },
    apunte_foto_quitar_tit: { es: "Quitar esta foto", en: "Remove this photo" },
    apunte_foto_borrar_conf: { es: "¿Quitar esta foto?", en: "Remove this photo?" },
    apunte_meta_editado: { es: "Última edición: {fecha}", en: "Last edited: {fecha}" },
    btn_exportar_apuntes: { es: "Exportar apuntes", en: "Export notes" },
    apuntes_exportado:   { es: "Apuntes exportados", en: "Notes exported" },
    btn_exportar_apuntes_word: { es: "Exportar como Word", en: "Export as Word" },
    apuntes_exportado_word: { es: "Apuntes exportados a Word (.docx)", en: "Notes exported to Word (.docx)" },
    apuntes_word_fecha:  { es: "Exportado el {fecha}", en: "Exported on {fecha}" },
    apuntes_word_sin_titulo: { es: "(sin título)", en: "(untitled)" },
    apuntes_word_error:  { es: "No se pudo crear el archivo de Word: {error}", en: "Could not create the Word file: {error}" },

    caso_estado_pendiente_planificar: { es: "Pendiente de planificar", en: "Planning pending" },
    caso_estado_preparado: { es: "Preparado", en: "Prepared" },
    caso_estado_cerrado: { es: "Cerrado", en: "Closed" },
    caso_estado_cancelado: { es: "Cancelado", en: "Cancelled" },
    caso_sin_intervencion: { es: "— sin intervención —", en: "— no procedure —" },
    caso_pendiente_subir: { es: "Guardado aquí, pendiente de subir", en: "Saved here, waiting to upload" },

    /* --- Ficha del caso --- */
    dlg_caso_titulo:     { es: "Gestión de casos", en: "Case management" },
    caso_subtitulo_prefijo: { es: "CASO", en: "CASE" },
    // Los 8 apartados de la ficha, cada uno un <details> plegado por
    // defecto: se despliega el que interese según el punto del caso en el
    // que se esté, no hay que rellenar de arriba abajo.
    caso_g_traza:        { es: "Identificación / Trazabilidad", en: "Identification / Traceability" },
    caso_g_paciente:     { es: "Paciente", en: "Patient" },
    caso_g_cirugia:      { es: "Cirugía", en: "Surgery" },
    caso_g_anestesia:    { es: "Anestesia", en: "Anaesthesia" },
    caso_g_montaje:      { es: "Montaje / Material", en: "Montage / Material" },
    caso_g_tecnicas:     { es: "Técnicas", en: "Techniques" },
    caso_g_desarrollo:   { es: "Desarrollo intraoperatorio", en: "Intraoperative course" },
    caso_g_resultado:    { es: "Resultado / Correlación clínica", en: "Outcome / Clinical correlation" },
    caso_g_formacion:    { es: "Docencia / Meta", en: "Teaching / Meta" },
    caso_volver:         { es: "Volver", en: "Back" },
    caso_borrar:         { es: "Borrar caso", en: "Delete case" },
    caso_mas_tit:        { es: "Más acciones", en: "More actions" },
    caso_crear_informe:  { es: "Informe (PDF)", en: "Report (PDF)" },
    caso_cerrar:         { es: "Cerrar caso", en: "Close case" },
    caso_fusionado:      { es: "El caso {id} había cambiado en otro dispositivo: se han juntado los dos sin perder nada.", en: "Case {id} had changed on another device: both versions were merged without losing anything." },
    import_completa_hecho: { es: "Copia completa: se han recuperado {casos} casos y {montajes} plantillas que no estaban en este dispositivo. Los que ya estaban no se han tocado.", en: "Full backup: {casos} cases and {montajes} templates that were not on this device have been restored. Existing ones were left untouched." },
    import_conf_completa: { es: "Es una copia completa: trae {casos} casos y {montajes} plantillas. De esos, solo se añaden los que no estén en este dispositivo.", en: "It is a full backup: it has {casos} cases and {montajes} templates. Only those not already on this device are added." },
    import_completa_apuntes: { es: "También se han recuperado los apuntes (aquí no había ninguno).", en: "Notes were restored too (there were none here)." },
    caso_reabrir:        { es: "Reabrir caso", en: "Reopen case" },
    caso_informe_proximamente: { es: "Crear informe: todavía no hace nada, en camino.", en: "Create report: not wired up yet, coming soon." },
    caso_borrar_conf:    { es: "¿Borrar el caso “{caso}”?\nSe borra también del repositorio en cuanto haya conexión. No se puede deshacer desde la app, aunque queda recuperable en el historial de git.",
                           en: "Delete the case “{caso}”?\nAlso deleted from the repository as soon as there is a connection. This cannot be undone from the app, though it stays recoverable in the git history." },
    caso_borrado:        { es: "Caso borrado.", en: "Case deleted." },
    caso_guardado:       { es: "Caso guardado.", en: "Case saved." },
    caso_falta_fecha:    { es: "La fecha es obligatoria.", en: "The date is required." },
    caso_montaje_res:    { es: "{cajas} caja(s) · {canales} entradas ocupadas", en: "{cajas} box(es) · {canales} inputs used" },
    caso_sin_montaje:    { es: "Sin montaje guardado (caso registrado a mano).",
                           en: "No montage saved (case recorded by hand)." },
    caso_material_real_ay: { es: "Viene relleno con lo previsto. Cambia solo lo que gastaste de más o de menos.",
                             en: "Pre-filled with what was planned. Change only what you used more or less of." },
    caso_editado_veces:  { es: "Editado {n} vez/veces tras el cierre · última: {fecha}",
                           en: "Edited {n} time(s) after closing · last: {fecha}" },
    caso_creado_en:      { es: "Archivo creado {fecha}", en: "File created {fecha}" },

    /* Etiquetas de los campos del caso */
    caso_fecha:          { es: "Fecha de la cirugía", en: "Date of surgery" },
    caso_fecha_ay:       { es: "La que cuenta para las estadísticas. Se puede cambiar siempre, también en un caso ya cerrado.",
                           en: "The one that counts for statistics. Always editable, even on a closed case." },
    caso_nombre_caso:    { es: "Nombre del caso", en: "Case name" },
    caso_nombre_caso_ay: { es: "Para reconocerlo tú de un vistazo en la lista — nunca el nombre del paciente.",
                           en: "So you can recognise it at a glance in the list — never the patient's name." },
    caso_edad:           { es: "Edad", en: "Age" },
    caso_sexo:           { es: "Sexo", en: "Sex" },
    caso_servicio_id:    { es: "Servicio", en: "Specialty" },
    caso_intervencion:   { es: "Intervención", en: "Procedure" },
    caso_tecnicas_realizadas: { es: "Técnicas realizadas", en: "Techniques performed" },
    caso_tecnicas_ay:    { es: "Vienen marcadas las que planificaste. Marca o desmarca lo que cambió.",
                           en: "The ones you planned come pre-selected. Tick or untick what changed." },
    caso_alerta:         { es: "Hubo alerta", en: "There was an alert" },
    caso_tecnicas_alteradas: { es: "Técnicas con alteración", en: "Techniques with an alteration" },
    caso_tecnicas_alteradas_ay: { es: "Marca las técnicas realizadas que tuvieron algún cambio, hallazgo o aviso durante la cirugía.",
                                  en: "Tick the techniques performed that had some change, finding or alert during surgery." },
    caso_sin_tecnicas_alt: { es: "Marca primero las técnicas realizadas, arriba.",
                             en: "First tick the techniques performed, above." },
    caso_rol:            { es: "Mi papel", en: "My role" },
    caso_notas:          { es: "Notas", en: "Notes" },
    caso_ID_Caso:        { es: "Identificador", en: "Identifier" },
    caso_estado:         { es: "Estado", en: "Status" },
    caso_motivo_cancelacion: { es: "Motivo de cancelación", en: "Cancellation reason" },
    caso_centro:         { es: "Centro", en: "Hospital" },
    caso_hora_inicio:    { es: "Hora de inicio", en: "Start time" },
    caso_hora_fin:       { es: "Hora de fin", en: "End time" },
    caso_antecedentes_relevantes: { es: "Resumen de historia clínica", en: "Clinical history summary" },
    caso_antecedentes_relevantes_ay: { es: "Historia clínica relevante, exploración física u otro dato del paciente que quieras dejar anotado.",
                           en: "Relevant clinical history, physical exam findings, or anything else about the patient worth noting." },
    caso_informes_imagenes: { es: "Pruebas de imagen", en: "Imaging tests" },
    caso_informes_imagenes_ay: { es: "Fotos o capturas de informes de imagen (RM, TC…) que te resulten interesantes para este caso. Encuadra solo la imagen o el hallazgo — nunca la cabecera con el nombre, NHC o fecha de nacimiento del paciente. Se comprimen solas al añadirlas.",
                           en: "Photos or screenshots of imaging reports (MRI, CT…) worth keeping for this case. Frame only the image or the finding — never the header with the patient's name, ID or date of birth. They're compressed automatically when added." },
    caso_diagnostico:    { es: "Diagnóstico", en: "Diagnosis" },
    opc_diagnostico_ecc: { es: "ECC — estenosis de canal cervical", en: "ECC — cervical canal stenosis" },
    opc_diagnostico_ecd: { es: "ECD — estenosis de canal dorsal", en: "ECD — dorsal canal stenosis" },
    opc_diagnostico_ecl: { es: "ECL — estenosis de canal lumbar", en: "ECL — lumbar canal stenosis" },
    opc_diagnostico_escoliosis: { es: "Escoliosis (cualquier nivel y edad)", en: "Scoliosis (any level or age)" },
    opc_diagnostico_loe_med: { es: "LOE Med — lesión ocupante de espacio medular (médula y meninges)",
                           en: "SOL — spinal cord (cord and meninges)" },
    opc_diagnostico_loe_st: { es: "LOE ST — LOE supratentorial (intracraneal)", en: "SOL — supratentorial (intracranial)" },
    opc_diagnostico_loe_it: { es: "LOE IT — LOE infratentorial (intracraneal)", en: "SOL — infratentorial (intracranial)" },
    opc_diagnostico_parotida: { es: "Parótida", en: "Parotid" },
    opc_diagnostico_mav: { es: "MAV — malformación arteriovenosa (cualquier lesión vascular)",
                           en: "AVM — arteriovenous malformation (any vascular lesion)" },
    opc_diagnostico_hipofisis: { es: "Hipófisis — endoscopia nasal", en: "Pituitary — transnasal endoscopic" },
    opc_diagnostico_chiari: { es: "Chiari", en: "Chiari" },
    opc_diagnostico_jannetta: { es: "Jannetta — descompresión del trigémino / espasmo hemifacial",
                           en: "Jannetta — trigeminal decompression / hemifacial spasm" },
    opc_diagnostico_fractvert: { es: "FractVert — fractura vertebral", en: "FractVert — vertebral fracture" },
    opc_diagnostico_loe_vert: { es: "LOE Vert — LOE vertebral (columna, cualquier nivel)",
                           en: "SOL — vertebral (spine, any level)" },
    caso_posicion:       { es: "Posición", en: "Position" },
    caso_posicion_detalle: { es: "Detalle de la posición", en: "Position detail" },
    caso_posicion_detalle_ay: { es: "Lo que no cabe en el desplegable: colocación de los brazos, cabezal, almohadillados, lado del lateral/park bench, o en qué momento se volteó.",
                           en: "Whatever the dropdown does not cover: arm placement, head holder, padding, which side for lateral/park bench, or when the patient was turned." },
    opc_posicion_supino: { es: "Supino", en: "Supine" },
    opc_posicion_prono:  { es: "Prono", en: "Prone" },
    opc_posicion_lateral: { es: "Lateral", en: "Lateral" },
    opc_posicion_park_bench: { es: "Park bench", en: "Park bench" },
    opc_posicion_volteo_sp: { es: "Volteo supino → prono", en: "Turned supine → prone" },
    opc_posicion_volteo_ps: { es: "Volteo prono → supino", en: "Turned prone → supine" },
    opc_posicion_volteo_doble_sps: { es: "Volteo doble supino-prono-supino", en: "Double turn supine-prone-supine" },
    opc_posicion_volteo_doble_psp: { es: "Volteo doble prono-supino-prono", en: "Double turn prone-supine-prone" },
    opc_posicion_otros:  { es: "Otros", en: "Other" },
    caso_anatomia_patologica: { es: "Anatomía patológica", en: "Pathology / level" },
    caso_anatomia_patologica_ay: { es: "El resultado de anatomía patológica si lo hay (p. ej. «Meningioma», «GBM»), o el nivel intervenido si es columna (p. ej. «C5-C6-C7»).",
                           en: "The pathology result if there is one (e.g. “Meningioma”, “GBM”), or the operated level if it's a spine case (e.g. “C5-C6-C7”)." },
    caso_otros_datos_quirurgicos: { es: "Otros datos quirúrgicos", en: "Other surgical details" },
    caso_navegacion:     { es: "Navegación", en: "Navigation" },
    caso_navegacion_ay:  { es: "Si se usó navegación (neuronavegador) durante la cirugía.",
                           en: "Whether navigation (neuronavigation) was used during the surgery." },
    caso_notas_montaje_tecnicas: { es: "Notas de las Técnicas", en: "Techniques notes" },
    caso_notas_montaje: { es: "Notas del montaje", en: "Montage notes" },
    caso_notas_material: { es: "Notas del material", en: "Material notes" },
    caso_tecnicas_parametros: { es: "Cómo se realizó cada técnica", en: "How each technique was performed" },
    caso_tecnicas_parametros_ay: { es: "Para cada técnica marcada como realizada arriba: sus propios parámetros reales usados en este caso concreto -cada técnica trae los suyos, no son los mismos para todas-. Queda plegado y vacío hasta que abras una técnica y escribas algo.",
                                    en: "For each technique ticked as performed above: its own actual parameters used in this specific case -each technique has its own set, not the same for all-. Stays collapsed and empty until you open a technique and write something." },
    caso_sin_tecnicas_parametros: { es: "Marca primero las técnicas realizadas, arriba.",
                                     en: "First tick the techniques performed, above." },
    // Estos 9 "tecpar_*" ya no rotulan campos en vivo (10-09-2026: cada
    // técnica trae ahora los suyos propios, ver data/parametros-tecnicas.js)
    // -se quedan solo como etiqueta de "de qué campo venía" cuando
    // migrarTecnicasParametros() no encuentra un sitio claro donde meter un
    // dato ya escrito con la forma vieja-.
    tecpar_intensidad:   { es: "Intensidad", en: "Intensity" },
    tecpar_ancho_pulso:  { es: "Ancho de pulso", en: "Pulse width" },
    tecpar_frecuencia:   { es: "Frecuencia", en: "Frequency" },
    tecpar_num_pulsos:   { es: "Nº de pulsos", en: "Pulse count" },
    tecpar_trenes:       { es: "Trenes (facilitación)", en: "Trains (facilitation)" },
    tecpar_isi:          { es: "ISI", en: "ISI" },
    tecpar_filtros:      { es: "Filtros", en: "Filters" },
    tecpar_promediacion: { es: "Promediación", en: "Averaging" },
    tecpar_barrido:      { es: "Tiempo de barrido", en: "Sweep time" },
    // Notas de la técnica sin definición propia (histórica/desactivada:
    // reflejo_h, jaw jerk, silent period, Material Qx) -las demás usan el
    // campo "Desviaciones o incidencias técnicas" de su propia sección
    // "general", ya traducido dentro de data/parametros-tecnicas.js-.
    tecpar_notas:        { es: "Notas técnicas de esta técnica", en: "Technical notes for this technique" },
    tecpar_si:           { es: "Sí", en: "Yes" },
    tecpar_sec_estimulacion: { es: "Estimulación", en: "Stimulation" },
    tecpar_sec_registro:     { es: "Registro", en: "Recording" },
    tecpar_otro_ph:      { es: "Añadir otro…", en: "Add other…" },
    tecpar_otro_anadir:  { es: "＋", en: "＋" },
    tecpar_quitar_tit:   { es: "Quitar", en: "Remove" },
    caso_imagenes_montaje: { es: "Imágenes del montaje, material y técnicas del caso", en: "Images of the case's montage, material and techniques" },
    caso_imagenes_montaje_ay: { es: "Capturas o fotos de cómo quedó el montaje en el software del equipo (la pantalla del equipo, por ejemplo), para consultarlas si en el futuro te toca un caso parecido. Se comprimen solas al añadirlas.",
                                 en: "Screenshots or photos of how the montage ended up on the equipment's software (e.g. the equipment screen), to look up if a similar case comes up in the future. They get compressed automatically when added." },
    caso_imagen_anadir:  { es: "＋ Añadir imagen", en: "＋ Add image" },
    foto_camara_tit:     { es: "Tomar foto con la cámara", en: "Take a photo with the camera" },
    caso_imagen_quitar_tit: { es: "Quitar esta imagen", en: "Remove this image" },
    caso_imagen_error:   { es: "No se pudo leer esa imagen. Prueba con otro archivo.", en: "Couldn't read that image. Try another file." },
    caso_hubo_cambios_plan: { es: "¿Hubo cambios respecto al plan?", en: "Were there changes from the plan?" },
    caso_cambios_respecto_al_plan: { es: "Detalle de los cambios", en: "Details of the changes" },
    caso_umbral_raices_niveles: { es: "Umbrales EMG por raíz (mapeo de tornillos)", en: "EMG thresholds by root (screw mapping)" },
    caso_umbral_raices_niveles_ay: { es: "Marca los niveles testados durante el mapeo y anota el umbral de cada lado.",
                           en: "Tick the levels tested during mapping and note the threshold on each side." },
    umbral_raices_izq:  { es: "Izquierdo {nivel}", en: "Left {nivel}" },
    umbral_raices_der:  { es: "{nivel} derecho", en: "{nivel} right" },
    umbral_raices_cab_izq:   { es: "Izquierda (mA)", en: "Left (mA)" },
    umbral_raices_cab_der:   { es: "Derecha (mA)", en: "Right (mA)" },
    umbral_raices_cab_nivel: { es: "Nivel", en: "Level" },
    caso_umbral_tornillos_pediculares: { es: "Notas de umbral EMG de tornillos pediculares", en: "Notes on pedicle screw EMG threshold" },
    caso_umbral_tornillos_pediculares_ay: { es: "Cualquier cosa que no encaje en los niveles de arriba: umbrales no testados por raíz, matices, comparaciones entre tornillos, etc.",
                           en: "Anything that doesn't fit the levels above: thresholds not tested by root, nuances, comparisons between screws, etc." },
    caso_material_previsto: { es: "Material (montaje base)", en: "Material (base montage)" },
    caso_material_previsto_ay: { es: "El material que sale del montaje de este caso -de solo lectura aquí-. Si añadiste algo que no estaba previsto, colócalo en su caja desde el Organizador de Montajes y anótalo en «Notas del material».",
                           en: "The material that comes out of this case's montage -read-only here-. If you added something that wasn't planned, place it in its box from the Montage Organizer and note it in “Material notes”." },
    caso_material_real:  { es: "Material realmente usado", en: "Material actually used" },
    caso_tipo_anestesia: { es: "Tipo de anestesia", en: "Type of anaesthesia" },
    caso_tipo_anestesia_detalle: { es: "Detalle", en: "Detail" },
    caso_tipo_anestesia_detalle_ay: { es: "Cualquier otro fármaco que se use, aparte del tipo elegido arriba. Por ejemplo: «+ ketamina en bolo antes de los basales».",
                           en: "Any other drug used, on top of the type chosen above. E.g.: “+ ketamine bolus before baselines”." },
    caso_tof_monitorizado: { es: "TOF monitorizado", en: "TOF monitored" },
    caso_incidencias_anestesicas: { es: "Incidencias anestésicas", en: "Anaesthetic incidents" },
    caso_resumen_monitorizacion: { es: "Resumen de la monitorización", en: "Monitoring summary" },
    caso_resumen_monitorizacion_ay: { es: "De corrido: qué salió al empezar (OP BSL), qué pasó por el camino, y qué salió al cerrar (CL BSL). Por ejemplo: «SEP y MEP normales al inicio (OP BSL) […] descargas de alta frecuencia a las 14.20h, ceden solas […] CL BSL: similares a las de apertura».",
                           en: "In sequence: what came out at the start (OP BSL), what happened along the way, and what came out at closing (CL BSL). E.g.: “SEP and MEP normal at baseline (OP BSL) […] high-frequency discharges at 2:20pm, resolve on their own […] CL BSL: similar to opening”." },
    caso_tipo_alerta:    { es: "Tipo de alerta", en: "Type of alert" },
    caso_medida_correctora: { es: "Medida correctora", en: "Corrective action" },
    caso_recuperacion_senal: { es: "Resultado de la señal", en: "Signal outcome" },
    caso_recuperacion_senal_ay: { es: "Cómo terminó la monitorización. Es el mismo dato que el Resultado del Cierre del Registro intraoperatorio.",
                           en: "How the monitoring ended. It is the same data as the Result in the Closure of the intraoperative record." },
    opc_recuperacion_senal_sin_cambios:  { es: "Sin cambios", en: "No changes" },
    opc_recuperacion_senal_transitorios: { es: "Cambios transitorios recuperados", en: "Transient changes, recovered" },
    opc_recuperacion_senal_persistentes: { es: "Cambios persistentes", en: "Persistent changes" },
    caso_alarmas_registro: { es: "Alarmas", en: "Alarms" },
    caso_alarmas_registro_ay: { es: "Son las alarmas de G · Alarmas del Registro intraoperatorio: lo que escribas aquí sale allí y en la hoja impresa, y al revés. Con ellas se rellenan solos «Tipo de alerta» y «Medida correctora» para el CSV y el Sheet.",
                           en: "These are the alarms in G · Alarms of the intraoperative record: what you enter here appears there and on the printed sheet, and vice versa. They fill in “Type of alert” and “Corrective action” for the CSV and the Sheet." },
    caso_mapeo_registro: { es: "Mapeo", en: "Mapping" },
    caso_mapeo_registro_ay: { es: "Es el E2 · Mapeo del Registro intraoperatorio (el mismo dato, en los dos sitios). Cada bloque aparece si su técnica está marcada.",
                           en: "It is E2 · Mapping of the intraoperative record (the same data, in both places). Each block appears if its technique is ticked." },
    caso_eventos_anestesia: { es: "Eventos de anestesia", en: "Anaesthesia events" },
    caso_eventos_anestesia_ay: { es: "Los eventos «An» del Registro intraoperatorio (hora y qué pasó), en espejo: se apuntan allí o aquí y se ven en los dos sitios.",
                           en: "The “An” events of the intraoperative record (time and what happened), mirrored: enter them there or here and they show in both places." },
    caso_evolucion_postop: { es: "Evolución postquirúrgica", en: "Postoperative evolution" },
    caso_evolucion_postop_ay: { es: "Elige la opción; el detalle (exploración, fechas, grados) va en el cuadro de debajo.",
                           en: "Choose the option; details (examination, dates, grades) go in the box below." },
    opc_evolucion_postop_sin_deficit:        { es: "Sin déficit nuevo", en: "No new deficit" },
    opc_evolucion_postop_deficit_transitorio: { es: "Déficit nuevo transitorio", en: "New transient deficit" },
    opc_evolucion_postop_deficit_permanente:  { es: "Déficit nuevo permanente", en: "New permanent deficit" },
    opc_evolucion_postop_deficit_pendiente:   { es: "Déficit nuevo, evolución pendiente", en: "New deficit, evolution pending" },
    opc_evolucion_postop_no_valorable:       { es: "No valorable", en: "Not assessable" },
    caso_concordancia_propuesta: { es: "Propuesta según alarmas, resultado de la señal y evolución: {v}", en: "Suggested from alarms, signal outcome and evolution: {v}" },
    caso_concordancia_aplicar: { es: "Aplicar", en: "Apply" },
    caso_conc_alerta:     { es: "Hubo alerta", en: "Alert" },
    caso_conc_sin_alerta: { es: "Sin alerta", en: "No alert" },
    caso_salir_guardar:   { es: "Hay cambios sin guardar en la ficha.\n\n¿Guardarlos antes de salir?", en: "There are unsaved changes in the case form.\n\nSave them before leaving?" },
    modelo0_tit:          { es: "Modelo 0 — sin caso: hoja suelta en este dispositivo, sin sincronizar. Elige un caso para que se guarde dentro de él.", en: "Model 0 — no case: a loose sheet on this device, not synced. Choose a case to save it inside that case." },
    caso_autoguardado:    { es: "Guardado.", en: "Saved." },
    caso_cambiado_fuera_auto: { es: "Este caso ha cambiado en otro dispositivo: el guardado automático se ha parado. Pulsa Guardar para decidir.", en: "This case changed on another device: autosave has stopped. Press Save to decide." },
    caso_salir_descartar: { es: "¿Salir sin guardar? Se perderán los cambios.", en: "Leave without saving? The changes will be lost." },
    caso_cambiado_fuera:  { es: "Este caso ha cambiado en otro dispositivo mientras tenías la ficha abierta.\n\nSi guardas, sustituirás esos cambios. ¿Guardar igualmente?", en: "This case changed on another device while you had the form open.\n\nSaving will replace those changes. Save anyway?" },
    caso_resultado_esperable: { es: "Resultado esperable", en: "Expected outcome" },
    caso_resultado_esperable_ay: { es: "Lo que cabría esperar en el postoperatorio respecto al estado previo, dado lo registrado, para compararlo después con la evolución real. Es el mismo dato que el Cierre del Registro intraoperatorio.",
                           en: "What would be expected postoperatively compared with the previous state, given what was recorded, to compare later against the actual evolution. It is the same data as the Closure of the intraoperative record." },
    opc_resultado_esperable_similar:       { es: "Similar al previo", en: "Similar to previous" },
    opc_resultado_esperable_empeoramiento: { es: "Empeoramiento", en: "Worsening" },
    opc_resultado_esperable_mejoria:       { es: "Mejoría", en: "Improvement" },
    opc_resultado_esperable_indeterminado: { es: "Indeterminado", en: "Undetermined" },
    caso_deficit_postoperatorio: { es: "Detalle de la evolución", en: "Evolution details" },
    caso_correlato_alarmas: { es: "Correlación de cada alarma", en: "Correlation of each alarm" },
    caso_correlato_alarmas_ay: { es: "Una fila por técnica y criterio: las alarmas repetidas del mismo sustrato van juntas. Elige cómo evolucionó esa función y cuándo se valoró; la concordancia de la fila se calcula sola con su recuperación en quirófano.",
                           en: "One row per technique and criterion: repeated alarms of the same substrate go together. Choose how that function evolved and when it was assessed; the row's concordance is calculated from its intraoperative recovery." },
    caso_correlato_evol: { es: "Evolución", en: "Evolution" },
    caso_correlato_momento: { es: "Valorado", en: "Assessed" },
    opc_correlato_evol_sin_deficit: { es: "Sin déficit relacionado", en: "No related deficit" },
    opc_correlato_evol_recupera:  { es: "Déficit que recupera", en: "Deficit that recovers" },
    opc_correlato_evol_estable:   { es: "Déficit estable", en: "Stable deficit" },
    opc_correlato_evol_empeora:   { es: "Empeoramiento", en: "Worsening" },
    opc_correlato_evol_pendiente: { es: "Pendiente de valorar", en: "Pending assessment" },
    opc_correlato_evol_no_valorable: { es: "No valorable", en: "Not assessable" },
    opc_correlato_momento_inmediato: { es: "Inmediato", en: "Immediate" },
    opc_correlato_momento_72h:    { es: "72 h", en: "72 h" },
    opc_correlato_momento_alta:   { es: "Al alta", en: "At discharge" },
    opc_correlato_momento_1m:     { es: "1 mes", en: "1 month" },
    opc_correlato_momento_3m:     { es: "3 meses", en: "3 months" },
    opc_correlato_momento_6m:     { es: "6 meses o más", en: "6 months or more" },
    caso_concordancia:   { es: "Concordancia", en: "Concordance" },
    caso_incidencias_tecnicas: { es: "Incidencias técnicas", en: "Technical incidents" },
    caso_equipo:         { es: "Equipo", en: "Equipment" },
    caso_supervisor:     { es: "Supervisor", en: "Supervisor" },
    caso_dificultad_1a5: { es: "Dificultad (1 a 5)", en: "Difficulty (1 to 5)" },
    caso_aprendizaje_clave: { es: "Aprendizaje clave", en: "Key learning" },
    caso_caso_destacado: { es: "Caso destacado", en: "Notable case" },
    caso_hacer_seguimiento: { es: "Hacer seguimiento", en: "Follow up" },
    caso_hacer_seguimiento_ay: { es: "Para acordarte de ver cómo evoluciona el paciente -sale marcado con 👁 en el listado y se puede filtrar aparte.",
                           en: "To remember to check how the patient evolves -shown with 👁 in the list, and can be filtered separately." },

    /* Valores de los desplegables del caso */
    opc_vacio:           { es: "— sin especificar —", en: "— not specified —" },
    opc_sexo_mujer:      { es: "Mujer", en: "Female" },
    opc_sexo_hombre:     { es: "Hombre", en: "Male" },
    opc_sexo_otro:       { es: "Otro", en: "Other" },
    opc_rol_adjunto1:    { es: "Adjunto 1", en: "Attending 1" },
    opc_rol_adjunto2:    { es: "Adjunto 2", en: "Attending 2" },
    opc_rol_residente:   { es: "Residente", en: "Resident" },
    opc_estado_pendiente_planificar: { es: "Pendiente de planificar", en: "Planning pending" },
    opc_estado_preparado:{ es: "Preparado", en: "Prepared" },
    opc_estado_cerrado:  { es: "Cerrado", en: "Closed" },
    opc_estado_cancelado:{ es: "Cancelado", en: "Cancelled" },
    opc_sino_si:         { es: "Sí", en: "Yes" },
    opc_sino_no:         { es: "No", en: "No" },
    opc_anestesia_tiva:  { es: "TIVA (propofol + remifentanilo)", en: "TIVA (propofol + remifentanil)" },
    opc_anestesia_rtiva: { es: "R-TIVA (relajantes toda la cirugía + TIVA)", en: "R-TIVA (relaxants throughout + TIVA)" },
    opc_anestesia_dxm:   { es: "DXM — dexmedetomidina (paciente despierto)", en: "DXM — dexmedetomidine (awake patient)" },
    opc_anestesia_alo:   { es: "ALO — anestesia libre de opioides", en: "ALO — opioid-free anaesthesia" },
    opc_anestesia_gas:   { es: "Gas (inhalatoria toda la cirugía)", en: "Gas (inhalational throughout)" },
    opc_concordancia_VP: { es: "VP — verdadero positivo", en: "TP — true positive" },
    opc_concordancia_FP: { es: "FP — falso positivo", en: "FP — false positive" },
    opc_concordancia_VN: { es: "VN — verdadero negativo", en: "TN — true negative" },
    opc_concordancia_FN: { es: "FN — falso negativo", en: "FN — false negative" },
    opc_concordancia_PR: { es: "PR — positivo reversible", en: "RP — reversible positive" },
    caso_concordancia_ay: { es: "Compara los cambios de la monitorización con el resultado neurológico. PR: hubo un cambio significativo que se recuperó tras actuar y no quedó déficit nuevo.",
                            en: "Compares monitoring changes with the neurological outcome. RP: there was a significant change that recovered after intervention, with no new deficit." },
    casos_filtro_concordancia: { es: "Concordancia", en: "Concordance" },
    opc_dificultad_1:    { es: "1 — muy fácil", en: "1 — very easy" },
    opc_dificultad_2:    { es: "2", en: "2" },
    opc_dificultad_3:    { es: "3", en: "3" },
    opc_dificultad_4:    { es: "4", en: "4" },
    opc_dificultad_5:    { es: "5 — muy difícil", en: "5 — very hard" },

    /* --- Diálogo de catálogos --- */
    btn_catalogos:       { es: "Catálogos", en: "Catalogues" },
    btn_catalogos_tit:   { es: "Editar técnicas, intervenciones, servicios y perfiles",
                           en: "Edit techniques, procedures, specialties and profiles" },
    dlg_cat_titulo:      { es: "Catálogos", en: "Catalogues" },
    tab_tecnicas:        { es: "Técnicas", en: "Techniques" },
    tab_intervenciones:  { es: "Intervenciones", en: "Procedures" },
    tab_servicios:       { es: "Servicios", en: "Specialties" },
    tab_perfiles:        { es: "Perfiles", en: "Profiles" },
    tab_usuarios:        { es: "Usuarios", en: "Users" },
    cat_intro_usuarios:  { es: "Quién usa la herramienta. Sirve para <b>firmar las plantillas</b>: cada una lleva el nombre de quien la creó, y solo su autor puede editarla o borrarla. No es una contraseña ni protege nada — cualquiera puede cambiar de perfil desde la barra de arriba. Estos nombres viven en tu repositorio de datos privado, nunca en el del código.",
                           en: "Who uses the tool. It is used to <b>sign montages</b>: each one carries the name of whoever created it, and only its author can edit or delete it. It is not a password and protects nothing — anyone can switch profile from the top bar. These names live in your private data repository, never in the code one." },
    perfil_usuario_aria: { es: "Quién eres", en: "Who you are" },
    perfil_usuario_sin:  { es: "— quién eres —", en: "— who are you —" },
    perfil_usuario_nuevo: { es: "+ Añadir usuario…", en: "+ Add user…" },
    perfil_usuario_pide:  { es: "¿Cómo te llamas? Aparecerá como autor de las plantillas que crees.",
                           en: "What is your name? It will appear as the author of the montages you create." },
    montaje_sin_autor:   { es: "de fábrica", en: "factory" },
    montaje_autor_ido:   { es: "otro usuario", en: "another user" },
    montaje_no_es_tuyo:  { es: "Esta plantilla es de {autor}, así que no puedes cambiarla.\n\nUsa «Duplicar» para hacerte una copia tuya y trabajar sobre ella.",
                           en: "This template belongs to {autor}, so you cannot change it.\n\nUse “Duplicate” to make your own copy and work on that." },
    montaje_de:          { es: "{nombre} · {autor}", en: "{nombre} · {autor}" },
    caso_sin_id:         { es: "Caso sin número", en: "Case with no number" },
    btn_menu_tit:        { es: "Idioma y guía de uso", en: "Language and user guide" },
    btn_guia:            { es: "Guía de uso", en: "User guide" },
    btn_ayudas_ocultar:  { es: "Ocultar ayudas", en: "Hide help texts" },
    btn_ayudas_mostrar:  { es: "Mostrar ayudas", en: "Show help texts" },
    btn_tema_claro:      { es: "Modo claro", en: "Light mode" },
    btn_tema_oscuro:     { es: "Modo oscuro", en: "Dark mode" },
    btn_guia_tit:        { es: "Cómo se usa MIO-Check, de un vistazo", en: "How to use MIO-Check, at a glance" },
    dlg_guia_titulo:     { es: "Guía de uso", en: "User guide" },
    guia_aviso_en:       { es: "This guide is only written in Spanish for now.", en: "This guide is only written in Spanish for now." },
    // Fase 7 (06-09-2026): pantalla de inicio con 6 tarjetas.
    logo_inicio_tit:     { es: "Volver al inicio", en: "Back to home" },
    btn_inicio_pantalla: { es: "Inicio", en: "Home" },
    tile_organizador:    { es: "Organizador de Montajes", en: "Montage Organizer" },
    tile_casos:          { es: "Gestión de Casos", en: "Case Management" },
    tile_checklist:      { es: "Checklist pre-quirúrgico", en: "Pre-surgical checklist" },
    tile_tecnicas:       { es: "Técnicas IONM", en: "IONM Techniques" },
    tile_docencia:       { es: "Docencia", en: "Teaching" },
    tile_material:       { es: "Material", en: "Material" },
    // Inicio en tres bloques, con una línea bajo cada tarjeta (demo-congreso B2.F1).
    inicio_grupo_antes:   { es: "Antes de quirófano", en: "Before surgery" },
    inicio_grupo_en:      { es: "Quirófano", en: "Operating room" },
    inicio_grupo_despues: { es: "Después / consulta", en: "After / reference" },
    tile_organizador_sub: { es: "Qué electrodo va en cada canal", en: "Which electrode goes in each channel" },
    tile_casos_sub:       { es: "Cada cirugía: planificación, basales, alertas y cierre", en: "Each surgery: planning, baselines, alerts and closure" },
    tile_checklist_sub:   { es: "Que no se olvide nada antes de monitorizar", en: "Nothing forgotten before monitoring starts" },
    tile_material_sub:    { es: "Cada electrodo y sonda, y para qué sirve", en: "Every electrode and probe, and what it is for" },
    tile_registro_sub:    { es: "Hoja de quirófano imprimible: hitos, eventos, alarmas", en: "Printable OR sheet: milestones, events, alarms" },
    tile_tecnicas_sub:    { es: "Parámetros de estímulo y registro, con su fuente", en: "Stimulation and recording parameters, with sources" },
    tile_docencia_sub:    { es: "Miotomas y colocación de cajas en la mesa", en: "Myotomes and box placement on the table" },
    tile_simulador_sub:   { es: "Pantalla de monitorización para practicar alarmas", en: "Monitoring screen to practise alarms" },
    tile_apuntes_sub:     { es: "Tus notas y fotos, en todos tus dispositivos", en: "Your notes and photos, on all your devices" },
    tile_bibliografia_sub: { es: "Libros, guías y artículos en los que se basa", en: "Books, guidelines and papers it is based on" },
    biblio_intro:        { es: "Las fuentes usadas para construir MIO-Check, en estilo Vancouver. Los DOI llevan al artículo.", en: "The sources used to build MIO-Check, in Vancouver style. DOIs link to the article." },
    biblio_libros:       { es: "Libros", en: "Books" },
    biblio_guias:        { es: "Guías y recomendaciones de sociedades", en: "Society guidelines and recommendations" },
    biblio_articulos:    { es: "Artículos", en: "Papers" },
    // Recorrido guiado "Empieza aquí", solo en la demo (demo-congreso B2.F2).
    // Visita guiada opcional (27-09-2026): antes "▶ Empieza aquí", que parecía
    // un paso obligatorio para poder usar la herramienta.
    tour_lanzar:         { es: "Visita guiada (opcional)", en: "Guided tour (optional)" },
    tour_lanzar_nota:    { es: "No hace falta para usar la demo: toca cualquier tarjeta y explora a tu aire.", en: "You don't need it to use the demo: tap any card and explore freely." },
    tour_paso:           { es: "Paso {n} de {total}", en: "Step {n} of {total}" },
    tour_empezar:        { es: "Ver la visita", en: "Take the tour" },
    tour_ahora_no:       { es: "Ahora no", en: "Not now" },
    tour_saltar:         { es: "Salir", en: "Exit" },
    tour_cerrar:         { es: "Cerrar", en: "Close" },
    tour_anterior:       { es: "Anterior", en: "Back" },
    tour_siguiente:      { es: "Siguiente", en: "Next" },
    tour_terminar:       { es: "Terminar", en: "Finish" },
    tour_minimizar:      { es: "Minimizar", en: "Minimise" },
    tour_mostrar:        { es: "Mostrar", en: "Show" },
    tour_t_bienvenida:   { es: "Bienvenida", en: "Welcome" },
    tour_x_bienvenida:   { es: "MIO-Check prepara, registra y documenta la monitorización neurofisiológica intraoperatoria. Esta visita es opcional: en unos minutos te enseña lo que se puede hacer, pero puedes cerrarla y explorar a tu aire, y volver a abrirla desde Inicio. Todo lo que ves es ficticio y se queda en este navegador.",
                           en: "MIO-Check prepares, records and documents intraoperative neurophysiological monitoring. This tour is optional: in a few minutes it shows what you can do, but you can close it and explore freely, and reopen it from Home. Everything you see is fictitious and stays in this browser." },
    tour_t_plantilla:    { es: "Plantilla de montaje", en: "Montage template" },
    tour_x_plantilla:    { es: "En el Organizador de Montajes, una plantilla es el montaje tipo de una cirugía: qué electrodo va en cada entrada de cada caja del equipo. Se prepara una vez y se reutiliza en cada caso.",
                           en: "In the Montage Organiser, a template is the standard montage for a surgery: which electrode goes into each input of each box. You prepare it once and reuse it for every case." },
    tour_t_tecnicas:     { es: "Técnicas", en: "Techniques" },
    tour_x_tecnicas:     { es: "Marca qué se va a monitorizar: SEP, MEP, Onda D, EMG, reflejos, mapeo… Las técnicas deciden qué basales pide el caso, qué técnicas salen en la hoja de registro y qué comprueba el Resumen.",
                           en: "Tick what will be monitored: SEP, MEP, D wave, EMG, reflexes, mapping… The techniques decide which baselines the case asks for, which modalities appear on the recording sheet and what the Summary checks." },
    tour_t_resumen:      { es: "Resumen", en: "Summary" },
    tour_x_resumen:      { es: "El Resumen calcula lo que hay que llevar: material por tipo, cajas y canales ocupados, y los avisos. La Revisión del montaje avisa si una técnica no tiene su material o si sobra material de otra.",
                           en: "The Summary works out what to bring: material by type, boxes and channels in use, and the warnings. The Montage check warns if a technique lacks its material or if there is material for one not ticked." },
    tour_t_caso:         { es: "Caso", en: "Case" },
    tour_x_caso:         { es: "Cada cirugía real es un caso, sin ningún dato identificativo del paciente. Se crea desde una plantilla y la ficha sigue la cirugía en 8 apartados, de la planificación al resultado. Este caso de ejemplo lo tiene todo relleno.",
                           en: "Each real surgery is a case, with no patient-identifying data. It is created from a template and the form follows the surgery in 8 sections, from planning to outcome. This example case has everything filled in." },
    tour_t_caso_montaje: { es: "Montaje y material del caso", en: "Case montage and material" },
    tour_x_caso_montaje: { es: "El montaje real del caso (se corrige en el Organizador) y el material. Las técnicas realizadas, con sus parámetros (intensidad, duración, músculos…), van en su propio apartado, «Técnicas», justo debajo. Admite fotos de la pantalla del equipo para consultarlas en un caso parecido.",
                           en: "The case's actual montage (corrected in the Organiser) and the material. The techniques performed, with their parameters (intensity, duration, muscles…), have their own section, “Techniques”, just below. You can add photos of the machine's screen to look up in a similar case." },
    tour_t_caso_desarrollo: { es: "Desarrollo intraoperatorio", en: "Intraoperative course" },
    tour_x_caso_desarrollo: { es: "Basales de apertura, post-posición y cierre; lo que pasó durante la cirugía; la alerta con su criterio, la medida correctora y si se recuperó la señal; las técnicas que se alteraron y los cambios respecto al plan.",
                           en: "Opening, post-positioning and closing baselines; what happened during surgery; the alert with its criterion, the corrective measure and whether the signal recovered; the techniques that changed and any change from the plan." },
    tour_t_caso_resultado: { es: "Resultado y concordancia", en: "Outcome and concordance" },
    tour_x_caso_resultado: { es: "El déficit postoperatorio y la concordancia de la monitorización con la clínica: VP, FP, VN, FN y PR (positivo reversible: hubo cambio, se recuperó al actuar y no quedó déficit). En Gestión de Casos se filtra por concordancia.",
                           en: "The postoperative deficit and how monitoring matched the clinical outcome: TP, FP, TN, FN and RP (reversible positive: a change that recovered after acting, with no new deficit). Case Management can filter by concordance." },
    tour_t_caso_docencia: { es: "Docencia", en: "Teaching" },
    tour_x_caso_docencia: { es: "Rol, supervisor, dificultad y aprendizaje clave de cada caso. Marca los destacados o los que quieres seguir, y encuéntralos después con los filtros: el registro de casos se convierte en un portafolio formativo.",
                           en: "Role, supervisor, difficulty and key learning point of each case. Flag notable cases or ones to follow up, and find them later with the filters: the case log becomes a training portfolio." },
    tour_t_registro:     { es: "Registro intraoperatorio", en: "Intraoperative log" },
    tour_x_registro:     { es: "En quirófano, arriba de la hoja se apunta con dos toques: la fase una vez, y cada cambio como qué + qué pasa. La hora se pone sola y la alarma se cierra con su recuperación y «Ahora». Más abajo, el resto de la hoja (anestesia, basales, mapeo, cierre).",
                           en: "In the OR, at the top of the sheet you log with two taps: the phase once, and each change as what + what happens. The time is set automatically and the alarm is closed with its recovery and “Now”. Further down, the rest of the sheet (anaesthesia, baselines, mapping, closure)." },
    tour_t_salidas:      { es: "Hoja de registro e informe", en: "Record sheet and report" },
    tour_x_salidas:      { es: "En el menú ⋮ de la ficha, Hoja de registro imprime las dos páginas A4 para quirófano, ya rellenas con lo que sabe el caso, e Informe (PDF) hace el informe del caso. El Checklist pre-quirúrgico también se vincula al caso.",
                           en: "In the case form ⋮ menu, Record sheet prints the two A4 pages for the OR, already filled in with what the case knows, and Create report makes the case report as a PDF. The pre-surgical Checklist can also be linked to the case." },
    tour_t_exportar:     { es: "Exportar y analizar", en: "Export and analyse" },
    tour_x_exportar:     { es: "Con los filtros de arriba eliges casos y los exportas: informe en PDF de varios casos, un CSV con una fila por caso u otro CSV con los eventos y alarmas del registro. Fuera de la demo todo se sincroniza con un repositorio privado. Puedes repetir esta visita desde Inicio.",
                           en: "Use the filters above to choose cases and export them: a PDF report of several cases, a CSV with one row per case, or another CSV with the log's events and alarms. Outside the demo everything syncs to a private repository. You can repeat this tour from Home." },
    casos_quitar_fecha:  { es: "Quitar la fecha", en: "Clear the date" },
    caso_basales_registro: { es: "Basales (OP BSL, PostPos y CL BSL)", en: "Baselines (OP BSL, PostPos and CL BSL)" },
    caso_basales_registro_ay: { es: "Es la misma tabla que la del Registro intraoperatorio: lo que escribas aquí sale allí y en la hoja impresa, y al revés. Las filas de c-SEP, c-MEP, GRID, corticobulbares, Onda D, PEATC y H-R aparecen según las técnicas marcadas.",
                              en: "It is the same table as in the Intraoperative record: whatever you write here appears there and on the printed sheet, and vice versa. The c-SEP, c-MEP, GRID, corticobulbar, D wave, BAEP and H-R rows appear depending on the techniques ticked." },
    caso_basales_grid_estimulo: { es: "GRID: electrodo de estímulo", en: "GRID: stimulating electrode" },
    caso_basales_grid_inversion: { es: "GRID: contacto con inversión de fase", en: "GRID: phase reversal contact" },
    hoja_inversion:      { es: "Inversión de fase", en: "Phase reversal" },
    polo_menos:          { es: "− cátodo (negro)", en: "− cathode (black)" },
    polo_mas:            { es: "+ ánodo (rojo)", en: "+ anode (red)" },
    puerto_base:         { es: "Entrada del módulo base", en: "Base module input" },
    puerto_en_uso:       { es: "Salida {puerto}: en uso ({cajas})", en: "Output {puerto}: in use ({cajas})" },
    puerto_libre:        { es: "Salida {puerto}: sin nada conectado en uso", en: "Output {puerto}: nothing in use connected" },
    conector_activo:     { es: "Activo (negro)", en: "Active (black)" },
    conector_referencia: { es: "Referencia (rojo)", en: "Reference (red)" },
    equipo_elegir_titulo: { es: "¿Con qué equipo?", en: "Which equipment?" },
    equipo_elegir_intro: { es: "Las cajas de conexión dependen del equipo; el material es el mismo.", en: "The connection boxes depend on the equipment; the material is the same." },
    equipo_opcion:       { es: "{corto} · {nombre}", en: "{corto} · {nombre}" },
    equipo_corto:        { es: "Equipo {corto}", en: "Equipment {corto}" },
    caso_equipo_id:      { es: "Equipo", en: "Equipment" },
    caso_equipo_id_ay:      { es: "Se elige al crear el caso y decide qué cajas se usan. Solo se puede cambiar mientras el montaje esté vacío.", en: "Chosen when the case is created; it decides which boxes are used. It can only be changed while the setup is empty." },
    casos_filtro_equipo: { es: "Equipo", en: "Equipment" },
    mat_desc_equipos:    { es: "Solo en el equipo {equipos}.", en: "Only on {equipos} equipment." },
    demo_titulo:         { es: "demo", en: "demo" },
    demo_estado_sync:    { es: "Modo demo · sin nube", en: "Demo mode · no cloud" },
    demo_aviso:          { es: "Modo demostración: datos ficticios, guardados solo en este navegador.", en: "Demo mode: fictitious data, stored only in this browser." },
    demo_sin_sync:       { es: "En el modo demostración no se sincroniza con GitHub: todo se queda en este navegador y no toca ningún dato real.", en: "Demo mode does not sync with GitHub: everything stays in this browser and no real data is touched." },
    demo_inicio_nota:    { es: "Modo demostración: casos, plantillas y apuntes son ficticios.", en: "Demo mode: cases, templates and notes are fictitious." },
    // Privacidad y autoría en la demo (demo-congreso B4.F2 y B4.F3). El
    // contacto es el que dio el autor para la demo (28-09-2026).
    demo_privacidad:     { es: "MIO-Check no guarda número de historia ni etiquetas del paciente. Esta demo, además, no envía nada a ningún servidor: lo que escribas se queda en este navegador y se borra con «Restablecer demo». No introduzcas datos reales de pacientes.",
                           en: "MIO-Check never stores medical record numbers or patient labels. This demo also sends nothing to any server: whatever you type stays in this browser and is erased with “Reset demo”. Do not enter real patient data." },
    demo_autoria:        { es: "© 2026 P. Paniagua. Todos los derechos reservados. Uso solo con autorización. Contacto: paniagua.dediego@gmail.com",
                           en: "© 2026 P. Paniagua. All rights reserved. Use only with permission. Contact: paniagua.dediego@gmail.com" },
    demo_restablecer:    { es: "Restablecer demo", en: "Reset demo" },
    demo_restablecer_conf: { es: "¿Borrar todo lo hecho en la demo y volver a los datos de ejemplo?", en: "Delete everything done in the demo and go back to the sample data?" },
    demo_centro:         { es: "Hospital de demostración", en: "Demo hospital" },
    tile_simulador:      { es: "Simulador", en: "Simulator" },
    tile_bibliografia:   { es: "Bibliografía recomendada", en: "Recommended reading" },
    docente_tab_teoria:  { es: "Teoría básica de IONM", en: "IONM basic theory" },
    en_construccion:     { es: "En construcción.", en: "Under construction." },
    docente_material_intro: { es: "Todo el material del catálogo, agrupado por categoría, con una breve descripción de cada uno. El color y el borde de cada ítem dicen su tipo físico (leyenda de abajo). El icono 📷 abre la foto cuando la hay.",
                              en: "All the material in the catalogue, grouped by category, with a short description of each. Each item's colour and border show its physical type (legend below). The 📷 icon opens the photo when there is one." },
    docente_material_buscar_ph: { es: "Nombre, tipo o descripción…", en: "Name, type or description…" },
    docente_material_cuenta: { es: "{n} de {total} materiales", en: "{n} of {total} items" },
    docente_material_sin: { es: "Ningún material con ese filtro.", en: "No material matches that filter." },
    mat_leyenda:         { es: "Tipos físicos", en: "Physical types" },
    mat_par:             { es: "{par} par", en: "CN {par}" },
    mat_par_tit:         { es: "Par craneal", en: "Cranial nerve" },
    mat_raices_tit:      { es: "Raíces (miotoma, el mismo de Docencia)", en: "Roots (myotome, the same as in Teaching)" },
    mat_leyenda_doble:   { es: "×2", en: "×2" },
    mat_leyenda_doble_tit: { es: "Cada colocación gasta 2 unidades (activo y referencia)", en: "Each placement uses 2 units (active and reference)" },
    mat_leyenda_reutilizable: { es: "reutilizable", en: "reusable" },
    mat_desc_media:      { es: "Sale del mismo paquete que su pareja (Erb1 + Erb2 = 1 paquete).", en: "Comes from the same pack as its pair (Erb1 + Erb2 = 1 pack)." },
    mat_desc_tercio:     { es: "Los tres contactos salen del mismo kit: 1, 2 o 3 colocados cuentan como 1 kit.", en: "All three contacts come from the same kit: 1, 2 or 3 placed count as 1 kit." },
    mat_desc_sin_entrada: { es: "No ocupa entrada en la caja.", en: "Does not take a box input." },
    mat_leyenda_reutilizable_tit: { es: "Se prepara pero no se gasta", en: "Prepared but not consumed" },
    /* --- Simulador --- */
    // Menú "Ventanas" de la barra lateral: cada "+" crea la ventana con la
    // morfología y los parámetros recomendados ya puestos (SIM_PLANTILLAS).
    sim_ventanas:        { es: "Ventanas", en: "Windows" },
    sim_menu_anadir:     { es: "Añadir ventana", en: "Add window" },
    sim_add_sep:         { es: "+ SEP", en: "+ SEP" },
    sim_add_aep:         { es: "+ AEP (PEATC)", en: "+ AEP (BAEP)" },
    sim_add_mep:         { es: "+ MEP", en: "+ MEP" },
    sim_add_reflejo:     { es: "+ Reflejo (blink, TCR, TVcR, LAR…)", en: "+ Reflex (blink, TCR, TVcR, LAR…)" },
    sim_add_hreflex:     { es: "+ H-reflex", en: "+ H-reflex" },
    sim_add_emg:         { es: "+ EMG libre", en: "+ Free-run EMG" },
    sim_add_tof:         { es: "+ TOF", en: "+ TOF" },
    sim_add_eeg:         { es: "+ EEG / ECoG", en: "+ EEG / ECoG" },
    sim_add_ventana:     { es: "+ Genérica", en: "+ Generic" },
    sim_ejemplos:        { es: "Ejemplos", en: "Examples" },
    sim_ejemplo:         { es: "Columna lumbar", en: "Lumbar spine" },
    sim_ejemplo_fosa:    { es: "Fosa posterior (pares craneales)", en: "Posterior fossa (cranial nerves)" },
    sim_repaso:          { es: "Repaso", en: "Practice" },
    sim_repaso_tit:      { es: "Casos de repaso", en: "Practice cases" },
    sim_repaso_intro:    { es: "Pulsa ▶, vigila y responde. ○ sin hacer · ✓ acertado · ✗ fallado.", en: "Press ▶, watch and answer. ○ not done · ✓ right · ✗ wrong." },
    sim_repaso_resultado:{ es: "{a} aciertos de {i} intentos", en: "{a} right out of {i} tries" },
    sim_caso_empezar_conf: { es: "¿Empezar el caso? Sustituye la pantalla actual (guárdala antes como preset si la quieres conservar).",
                           en: "Start the case? It replaces the current screen (save it as a preset first if you want to keep it)." },
    sim_caso_barrida:    { es: "Barrida {n}", en: "Sweep {n}" },
    sim_caso_mediciones: { es: "Mediciones", en: "Measurements" },
    sim_caso_mediciones_tit: { es: "Latencia y amplitud de cada canal, con el cambio respecto a la basal", en: "Latency and amplitude of each channel, with the change from baseline" },
    sim_caso_valorar:    { es: "Valorar", en: "Assess" },
    sim_caso_valorar_tit:{ es: "Parar y decir qué está pasando", en: "Stop and say what is happening" },
    sim_caso_salir:      { es: "Salir del caso", en: "Leave the case" },
    sim_caso_pregunta:   { es: "¿Qué está pasando?", en: "What is happening?" },
    sim_caso_bien:       { es: "✓ Correcto.", en: "✓ Correct." },
    sim_caso_mal:        { es: "✗ No. La respuesta es: {correcta}.", en: "✗ No. The answer is: {correcta}." },
    sim_caso_tiempo:     { es: "Valoraste en la barrida {n}; el cambio empezó en la barrida {ini}.", en: "You assessed at sweep {n}; the change started at sweep {ini}." },
    sim_caso_antes:      { es: "Valoraste en la barrida {n}, antes de que empezara el cambio (barrida {ini}).", en: "You assessed at sweep {n}, before the change started (sweep {ini})." },
    sim_caso_porque:     { es: "Por qué", en: "Why" },
    sim_caso_accion:     { es: "Qué hacer", en: "What to do" },
    sim_caso_repetir:    { es: "Repetir", en: "Repeat" },
    sim_caso_mirar:      { es: "Ver con mediciones", en: "See with measurements" },
    sim_caso_otro:       { es: "Otro caso", en: "Another case" },
    sim_presets:         { es: "Presets", en: "Presets" },
    sim_presets_guardados: { es: "Guardados (se sincronizan)", en: "Saved (synced)" },
    sim_presets_ninguno: { es: "Todavía no hay ninguno.", en: "None yet." },
    sim_preset_guardar_nuevo: { es: "Guardar como nuevo…", en: "Save as new…" },
    sim_preset_guardar_cambios: { es: "Guardar cambios en «{nombre}»", en: "Save changes to “{nombre}”" },
    sim_preset_nombre_pide: { es: "Nombre del preset:", en: "Preset name:" },
    sim_preset_guardado: { es: "Preset «{nombre}» guardado.", en: "Preset “{nombre}” saved." },
    sim_preset_vacio:    { es: "No hay ventanas que guardar.", en: "There are no windows to save." },
    sim_preset_cargar_conf: { es: "¿Cargar «{nombre}»? Sustituye la pantalla actual (guárdala antes como preset si la quieres conservar).",
                           en: "Load “{nombre}”? It replaces the current screen (save it as a preset first if you want to keep it)." },
    sim_preset_descartar_conf: { es: "«{nombre}» tiene cambios sin guardar. ¿Descartarlos y volver a como estaba guardado?",
                           en: "“{nombre}” has unsaved changes. Discard them and go back to the saved version?" },
    sim_preset_borrar_conf: { es: "¿Borrar el preset «{nombre}»?", en: "Delete the preset “{nombre}”?" },
    sim_preset_copia:    { es: "{nombre} (copia)", en: "{nombre} (copy)" },
    sim_preset_cargar_tit: { es: "Cargar este preset", en: "Load this preset" },
    sim_preset_renombrar_tit: { es: "Renombrar", en: "Rename" },
    sim_preset_duplicar_tit: { es: "Duplicar", en: "Duplicate" },
    sim_preset_borrar_tit: { es: "Borrar", en: "Delete" },
    sim_preset_rotulo:   { es: "Preset: {nombre}", en: "Preset: {nombre}" },
    sim_preset_rotulo_mod: { es: "Preset: {nombre} · cambios sin guardar", en: "Preset: {nombre} · unsaved changes" },
    sim_todos:           { es: "TODOS", en: "ALL" },
    sim_sel_tit:         { es: "Lo que controlan ▶ ■ ❚❚. Pulsa dentro de una ventana para elegir solo esa; pulsa aquí para volver a TODOS.",
                           en: "What ▶ ■ ❚❚ control. Tap inside a window to pick just that one; tap here to go back to ALL." },
    sim_grupo_play_tit:  { es: "Poner en marcha todas las ventanas {tipo}", en: "Start all {tipo} windows" },
    sim_grupo_pausa_tit: { es: "Pausar todas las ventanas {tipo}", en: "Pause all {tipo} windows" },
    sim_play_tit:        { es: "Reproducir: nuevas barridas cada segundo", en: "Play: new sweeps every second" },
    sim_pausa_tit:       { es: "Pausa", en: "Pause" },
    sim_stop_tit:        { es: "Parar y volver a la primera barrida", en: "Stop and go back to the first sweep" },
    sim_completa:        { es: "Pantalla completa", en: "Full screen" },
    sim_vaciar:          { es: "Vaciar", en: "Clear" },
    sim_vaciar_conf:     { es: "¿Vaciar el simulador? Se quitan todas las ventanas.",
                           en: "Clear the simulator? All windows are removed." },
    sim_aviso_corto:     { es: "Simulación · trazos de ejemplo, sin señal real", en: "Simulation · example traces, no real signal" },
    sim_girar:           { es: "Gira el móvil: el Simulador se usa en horizontal.", en: "Turn your phone: the Simulator works in landscape." },
    sim_vacio:           { es: "Sin ventanas. Abre «Ventanas» para añadir una o cargar un ejemplo.",
                           en: "No windows. Open “Windows” to add one or load an example." },
    sim_todo_minimizado: { es: "Todas las ventanas están minimizadas: pulsa una abajo para recuperarla.",
                           en: "All windows are minimised: tap one below to bring it back." },
    sim_ventana_nueva:   { es: "Ventana", en: "Window" },
    sim_arrastrar_tit:   { es: "Arrastra por aquí para acoplar la ventana en otro sitio", en: "Drag here to dock the window somewhere else" },
    sim_ajustes_tit:     { es: "Ajustes de la ventana", en: "Window settings" },
    sim_cerrar_tit:      { es: "Quitar la ventana", en: "Remove the window" },
    sim_minimizar_tit:   { es: "Minimizar (queda abajo)", en: "Minimise (kept below)" },
    sim_maximizar_tit:   { es: "Ampliar a toda la pantalla", en: "Expand to the whole screen" },
    sim_restaurar_tit:   { es: "Volver a su sitio", en: "Back to its place" },
    sim_sens_mas_tit:    { es: "Más ganancia (menos µV/Div): trazo más grande", en: "More gain (fewer µV/Div): bigger trace" },
    sim_sens_menos_tit:  { es: "Menos ganancia (más µV/Div): trazo más pequeño", en: "Less gain (more µV/Div): smaller trace" },
    sim_barr_menos_tit:  { es: "Barrido más corto", en: "Shorter sweep" },
    sim_barr_mas_tit:    { es: "Barrido más largo", en: "Longer sweep" },
    sim_cascada_h_tit:   { es: "Cascada en horizontal (barridas una al lado de otra)", en: "Horizontal cascade (sweeps side by side)" },
    sim_cascada_v_tit:   { es: "Cascada en vertical (barridas una debajo de otra)", en: "Vertical cascade (sweeps stacked)" },
    sim_borde_arriba:    { es: "Fila entera arriba", en: "Full row at the top" },
    sim_borde_abajo:     { es: "Fila entera abajo", en: "Full row at the bottom" },
    sim_borde_izq:       { es: "Columna entera a la izquierda", en: "Full column on the left" },
    sim_borde_der:       { es: "Columna entera a la derecha", en: "Full column on the right" },
    sim_sin_canales:     { es: "Sin canales", en: "No channels" },
    sim_dlg_titulo:      { es: "Ajustes de la ventana", en: "Window settings" },
    sim_campo_titulo:    { es: "Título (técnica)", en: "Title (technique)" },
    sim_campo_vista:     { es: "Vista", en: "View" },
    sim_vista_avg:       { es: "Promediado (Avg)", en: "Averaged (Avg)" },
    sim_vista_cascada:   { es: "Cascada", en: "Cascade" },
    sim_campo_morfologia:{ es: "Morfología del trazo", en: "Trace morphology" },
    sim_morf_sep:        { es: "SEP (evocado)", en: "SEP (evoked)" },
    sim_morf_aep:        { es: "AEP / PEATC (ondas I-V)", en: "AEP / BAEP (waves I-V)" },
    sim_morf_mep:        { es: "MEP (polifásico)", en: "MEP (polyphasic)" },
    sim_morf_reflejo:    { es: "Reflejo (blink, TCR, TVcR, LAR, THR según el título)", en: "Reflex (blink, TCR, TVcR, LAR, THR by title)" },
    sim_morf_hreflex:    { es: "H-reflex (onda M y onda H)", en: "H-reflex (M and H waves)" },
    sim_morf_tof:        { es: "TOF (tren de 4)", en: "TOF (train of four)" },
    sim_morf_emg:        { es: "EMG libre", en: "Free-run EMG" },
    sim_morf_eeg:        { es: "EEG / ECoG", en: "EEG / ECoG" },
    sim_morf_generico:   { es: "Genérico", en: "Generic" },
    sim_campo_canales:   { es: "Canales", en: "Channels" },
    sim_canal_ph:        { es: "p. ej. Cz'-C3'", en: "e.g. Cz'-C3'" },
    sim_canal_add:       { es: "Añadir", en: "Add" },
    sim_grupo_estimulo:  { es: "Parámetros de estimulación", en: "Stimulation parameters" },
    sim_grupo_filtros:   { es: "Filtros, barrido y sensibilidad", en: "Filters, sweep and sensitivity" },
    sim_v_borrar:        { es: "Quitar ventana", en: "Remove window" },
    tecnicas_mio_intro:  { es: "Cada parámetro cuantitativo indica su fuente. Cuando dos fuentes dan valores distintos, se muestran ambos por separado: nunca se promedian ni se combinan.",
                           en: "Each quantitative parameter names its source. When two sources give different values, both are shown separately — never averaged or merged." },
    tecnicas_mio_aviso_en: { es: "This section is only written in Spanish for now.", en: "This section is only written in Spanish for now." },
    tecmio_buscar_ph:    { es: "Buscar técnica, sitio, parámetro, cifra…", en: "Search technique, site, parameter, figure…" },
    tecmio_sin_resultados: { es: "Sin resultados para «{texto}».", en: "No results for «{texto}»." },
    tecmio_vista_tarjetas: { es: "Tarjetas", en: "Cards" },
    tecmio_vista_tabla:  { es: "Tabla", en: "Table" },
    tecmio_col_tecnica:  { es: "Técnica", en: "Technique" },
    tecmio_col_estimulacion: { es: "Estimulación", en: "Stimulation" },
    tecmio_col_registro: { es: "Registro", en: "Recording" },
    tecmio_col_filtros_barrido: { es: "Filtros y barrido", en: "Filters and sweep" },
    tecmio_fuentes_titulo: { es: "Fuentes", en: "Sources" },
    docente_titulo:      { es: "Miotomas: qué músculos monitorizar", en: "Myotomes: which muscles to monitor" },
    docente_intro:       { es: "Pulsa en la columna los <b>niveles</b> que abarca la cirugía. A la izquierda aparecen los músculos que dependen de esas raíces; pulsa uno para llevarlo a los <b>monitorizados</b> de la derecha, y pulsa allí para quitarlo. Los rangos son los que se enseñan habitualmente: la inervación se solapa y no todas las escuelas dan los mismos límites, así que están para discutirlos.",
                           en: "Click the <b>levels</b> the surgery covers on the spine. The muscles depending on those roots appear on the left; click one to move it to <b>monitored</b> on the right, and click there to remove it. The ranges are the ones usually taught: innervation overlaps and not every school gives the same limits, so they are there to be discussed." },
    docente_fuentes:      { es: "El detalle al pasar el ratón por un músculo, cuando lo lleva, cita: <b>[TD/L]</b> Toleikis, en Deletis et al., Neurophysiology in Neurosurgery, 2.ª ed., cap. 13, y Leppänen (ASNM) para el músculo y el nivel · <b>[Sch]</b> Schirmer 2011 y <b>[Lon]</b> London 2022 (J Neurosurg Spine) para la frecuencia real de solapamiento entre niveles. Los músculos sin ninguna marca no vienen de esta tabla: son rangos habituales de enseñanza, sin cita concreta detrás.",
                           en: "The tooltip on a muscle, when it has one, cites: <b>[TD/L]</b> Toleikis, in Deletis et al., Neurophysiology in Neurosurgery, 2nd ed., ch. 13, and Leppänen (ASNM) for the muscle and level · <b>[Sch]</b> Schirmer 2011 and <b>[Lon]</b> London 2022 (J Neurosurg Spine) for how often levels actually overlap. Muscles with no mark are not from this table: they are the usual teaching ranges, with no specific citation behind them." },
    docente_posibles:    { es: "Músculos posibles", en: "Possible muscles" },
    docente_columna:     { es: "Columna", en: "Spine" },
    docente_elegidos:    { es: "Monitorizados", en: "Monitored" },
    docente_limpiar:     { es: "Quitar niveles", en: "Clear levels" },
    docente_reiniciar:   { es: "Empezar de cero", en: "Start over" },
    docente_sin_nivel:   { es: "Elige algún nivel en la columna para ver qué músculos dependen de él.",
                           en: "Pick a level on the spine to see which muscles depend on it." },
    docente_nivel_pista: { es: "Niveles elegidos: {niveles}", en: "Levels chosen: {niveles}" },
    docente_sin_musculos: { es: "Ningún músculo de la lista depende de esos niveles.",
                           en: "No muscle in the list depends on those levels." },
    docente_nada_elegido: { es: "Todavía no has elegido ninguno.", en: "You have not chosen any yet." },
    docente_cobertura_ok: { es: "Cubres los {n} niveles elegidos.", en: "You cover all {n} chosen levels." },
    docente_cobertura_falta: { es: "Sin cubrir: {niveles}", en: "Not covered: {niveles}" },
    docente_reiniciar_conf: { es: "¿Empezar el ejercicio de cero?", en: "Start the exercise over?" },
    docente_titulo_gen:  { es: "Docente", en: "Teaching" },
    docente_tab_miotomas: { es: "Miotomas", en: "Myotomes" },
    docente_tab_cama:    { es: "Cama de quirófano", en: "Operating table" },
    cama_intro:          { es: "Elige la <b>posición del paciente</b> y reparte las cajas alrededor de la mesa. Pulsa una caja de abajo y luego la zona donde la pondrías; pulsa una ya colocada para retirarla. Lo que se practica es que el cable llegue: una caja en los pies no sirve para los electrodos de la cabeza.",
                           en: "Choose the <b>patient position</b> and distribute the boxes around the table. Click a box below and then the area where you would put it; click a placed one to take it back. The point is cable reach: a box at the feet is no use for head electrodes." },
    cama_cabecera:       { es: "Cabecera", en: "Head end" },
    cama_izq:            { es: "Lateral izquierdo", en: "Left side" },
    cama_der:            { es: "Lateral derecho", en: "Right side" },
    cama_pies:           { es: "Pies", en: "Foot end" },
    cama_sin_colocar:    { es: "Cajas por repartir", en: "Boxes to place" },
    cama_todas:          { es: "Todas las cajas están repartidas.", en: "All boxes are placed." },
    cama_reparto:        { es: "{repartidas} de {total} cajas repartidas.", en: "{repartidas} of {total} boxes placed." },
    cama_elige_zona:     { es: "«{caja}» elegida: pulsa ahora la zona donde va.",
                           en: "“{caja}” selected: now click the area where it goes." },
    pos_supino:          { es: "Supino", en: "Supine" },
    pos_supino_brazos:   { es: "Supino con brazos extendidos", en: "Supine, arms extended" },
    pos_prono:           { es: "Prono", en: "Prone" },
    pos_sentado:         { es: "Sentado", en: "Sitting" },
    caso_editar_montaje: { es: "Editar montaje", en: "Edit montage" },
    caso_editar_montaje_ay: { es: "Abre las cajas de este caso para cambiar dónde va cada cosa. Lo que cambies se guarda en el caso, no en la plantilla de la que salió.",
                           en: "Opens this case’s boxes to change where each item goes. What you change is saved in the case, not in the montage it came from." },
    caso_cargar_plantilla: { es: "Cargar plantilla…", en: "Load template…" },
    caso_montaje_origen: { es: "Plantilla de origen: {nombre}", en: "Source template: {nombre}" },
    caso_montaje_origen_no_disponible: { es: "plantilla no disponible", en: "template not available" },
    caso_guardar_plantilla: { es: "Guardar este montaje como plantilla…", en: "Save this montage as a template…" },
    caso_guardar_plantilla_ay: { es: "Crea una plantilla nueva a partir de lo que hay ahora en las cajas de este caso. El caso no se modifica.",
                           en: "Creates a new template from what's currently in this case's boxes. The case itself is not changed." },
    plantilla_guardar_prompt: { es: "Nombre de la plantilla nueva:\n\nPara reconocerla luego en la lista — nunca un dato del paciente.",
                           en: "Name of the new template:\n\nSo you can recognise it later in the list — never patient data." },
    plantilla_guardada: { es: "Plantilla «{nombre}» guardada.", en: "Template “{nombre}” saved." },
    barra_caso_texto:    { es: "Corrigiendo el material del caso", en: "Correcting the material of case" },
    barra_caso_ay:       { es: "Se guarda solo, en el caso. La plantilla original no se toca.",
                           en: "Saved automatically, into the case. The original montage is untouched." },
    barra_caso_volver:   { es: "Volver al caso", en: "Back to the case" },
    barra_plantilla_texto: { es: "Plantilla", en: "Template" },
    caso_reconstruccion_parcial: { es: "De este caso solo se han podido recolocar {recuperadas} de {esperadas} entradas.\n\nEs un caso antiguo, de antes de que se guardara el montaje completo, y alguna de sus entradas ya no existe en las cajas de ahora.\n\nSi sigues y cambias algo, el caso se quedará con las {recuperadas} que se ven. ¿Continuar?",
                           en: "Only {recuperadas} of {esperadas} inputs could be restored for this case.\n\nIt is an old case, from before the full montage was stored, and some of its inputs no longer exist in the current boxes.\n\nIf you continue and change anything, the case will keep only the {recuperadas} shown. Continue?" },
    montajes_cuenta:     { es: "{n} de {total}", en: "{n} of {total}" },
    montaje_tuyo:        { es: "tuyo", en: "yours" },
    montaje_modificado:  { es: "modificado {fecha}", en: "modified {fecha}" },
    montaje_creado:      { es: "creado {fecha}", en: "created {fecha}" },

    /* --- Checklist pre-quirúrgico (19/20-09-2026) --- */
    checklist_intro:     { es: "Repaso en 5 momentos antes de empezar. Fuentes: Møller, cap. 18; MacDonald 2013 (ASNM); Deletis et al., 2.ª ed., caps. 19 y 41.",
                           en: "A check in 5 moments before starting. Sources: Møller, ch. 18; MacDonald 2013 (ASNM); Deletis et al., 2nd ed., chs. 19 and 41." },
    checklist_vincular:  { es: "Vincular a un caso", en: "Link to a case" },
    checklist_modelo_cero: { es: "Modelo 0 — sin caso", en: "Model 0 — no case" },
    checklist_progreso:  { es: "{n} de {total} revisados", en: "{n} of {total} checked" },
    checklist_vaciar:    { es: "Vaciar", en: "Clear" },
    checklist_vaciar_conf: { es: "¿Vaciar esta checklist? Se desmarcan todos los ítems.",
                           en: "Clear this checklist? All items will be unchecked." },
    checklist_guardar:   { es: "Guardar", en: "Save" },
    checklist_guardado:  { es: "Checklist guardada.", en: "Checklist saved." },
    tile_registro:       { es: "Registro intraoperatorio", en: "Intraoperative record" },
    registro_intro:      { es: "Hoja de registro intraoperatorio, pensada para imprimirla y tenerla en quirófano: sale prerrellenada con los datos del caso (técnicas, anestesia, montaje, dónde está el Raabe…) y con filas en blanco para basales, mapeo y eventos/alarmas. Elige un caso, rellena lo que quieras aquí y pulsa Imprimir hoja. No se guarda ninguna etiqueta ni nº de historia del paciente.",
                           en: "Intraoperative record sheet, meant to be printed and kept in the OR: it comes pre-filled with the case data (techniques, anaesthesia, setup, where the Raabe is…) and with blank rows for baselines, mapping and events/alarms. Pick a case, fill in whatever you like here and press Print sheet. No patient label or record number is stored." },
    registro_ahora:      { es: "Ahora", en: "Now" },
    registro_ahora_tit:  { es: "Poner la hora actual", en: "Set the current time" },
    registro_tecnicas_caso: { es: "Técnicas del caso:", en: "Case techniques:" },
    registro_sin_tecnicas: { es: "ninguna marcada todavía en el caso", en: "none selected in the case yet" },
    registro_mod_ayuda:  { es: "Las casillas con equivalente exacto en las técnicas del caso se marcan solas; el detalle (nervio, lado) se marca a mano.",
                           en: "Boxes with an exact equivalent in the case techniques tick themselves; the detail (nerve, side) is ticked by hand." },
    registro_montaje:    { es: "Montaje", en: "Setup" },
    registro_otro:       { es: "Otro", en: "Other" },
    registro_sens_otros: { es: "Sensitivos / otros", en: "Sensory / other" },
    registro_tornillos:  { es: "Estimulación de tornillos", en: "Screw stimulation" },
    registro_motores:    { es: "Motores", en: "Motor" },
    registro_corticales: { es: "Corticales / pares", en: "Cortical / cranial" },
    registro_fila_quitar: { es: "Quitar esta fila", en: "Remove this row" },
    reg_p_sin_caso:      { es: "Vincula un caso arriba para ver aquí lo que ya tiene.", en: "Link a case above to see what it already has here." },
    reg_p_tecnicas_ayuda: { es: "Salen de la ficha del caso (Técnicas realizadas) y se cambian allí.", en: "They come from the case form (Techniques performed) and are changed there." },
    reg_p_sin_tecnicas:  { es: "El caso no tiene técnicas marcadas.", en: "The case has no techniques ticked." },
    reg_p_anest_ayuda:   { es: "Es el mismo dato que el apartado Anestesia de la ficha del caso: se escribe aquí o allí y se ve en los dos. Lo que cambie durante la cirugía (bolos, relajante, TAM…) va en los eventos de anestesia, con su hora.", en: "It is the same data as the Anaesthesia section of the case form: write it here or there and it shows in both. Whatever changes during surgery (boluses, relaxant, MAP…) goes in the anaesthesia events, with its time." },
    reg_p_motor:         { es: "Electrodo motor", en: "Motor electrode" },
    reg_p_musculos:      { es: "Músculos registrados", en: "Muscles recorded" },
    reg_p_hora:          { es: "Hora", en: "Time" },
    reg_p_que:           { es: "Qué ha pasado", en: "What happened" },
    reg_p_alarma_nueva:  { es: "+ Alarma (hora actual)", en: "+ Alarm (current time)" },
    reg_p_sin_alarmas:   { es: "Sin alarmas.", en: "No alarms." },
    reg_p_modalidad:     { es: "Técnica · lado", en: "Technique · side" },
    reg_p_criterio:      { es: "Criterio", en: "Criterion" },
    reg_p_medidas:       { es: "Medidas adoptadas", en: "Measures taken" },
    reg_p_recup:         { es: "Recuperación", en: "Recovery" },
    reg_p_h_recup:       { es: "Hora de recuperación", en: "Recovery time" },
    reg_p_recupero_ahora: { es: "Recuperó ahora: pone la hora actual", en: "Recovered now: sets the current time" },
    reg_p_al_duracion:   { es: "{min} min de alarma", en: "{min} min of alarm" },
    reg_p_vaciar_alarma: { es: "¿Vaciar esta alarma?", en: "Clear this alarm?" },
    reg_p_causa_l:       { es: "Causa probable", en: "Probable cause" },
    reg_p_nota:          { es: "Nota breve", en: "Short note" },
    reg_p_an_nuevo:      { es: "+ Evento de anestesia", en: "+ Anaesthesia event" },
    reg_p_alarma_nueva_ficha: { es: "+ Alarma", en: "+ Alarm" },
    reg_p_sin_an:        { es: "Sin eventos de anestesia.", en: "No anaesthesia events." },
    reg_p_quitar_evento: { es: "¿Quitar este evento?", en: "Remove this event?" },
    reg_p_mapeo_nota:    { es: "Cada bloque de mapeo aparece solo si su técnica está marcada en la ficha del caso: c-MEP por GRID, mapeo cortical, mapeo subcortical, mapeo de nervio periférico y estimulación de raíces y tornillos.", en: "Each mapping block only appears if its technique is ticked in the case form: c-MEP by GRID, cortical mapping, subcortical mapping, peripheral nerve mapping and root and screw stimulation." },
    reg_p_mapeo_ninguna: { es: "El caso no tiene ninguna técnica de mapeo marcada.", en: "The case has no mapping technique ticked." },
    reg_p_map_grid:      { es: "c-MEP por GRID", en: "c-MEP by GRID" },
    reg_p_map_cortical:  { es: "Mapeo cortical", en: "Cortical mapping" },
    reg_p_map_subcortical: { es: "Mapeo subcortical", en: "Subcortical mapping" },
    reg_p_map_nervio:    { es: "Mapeo de nervio periférico", en: "Peripheral nerve mapping" },
    reg_p_map_raices:    { es: "Estimulación de raíces y tornillos", en: "Root and screw stimulation" },
    reg_p_punto:         { es: "Punto", en: "Point" },
    reg_p_nervio:        { es: "Nervio / punto", en: "Nerve / point" },
    reg_p_umbral:        { es: "Umbral (mA)", en: "Threshold (mA)" },
    reg_p_intensidad:    { es: "Intensidad (mA)", en: "Intensity (mA)" },
    reg_p_musculo:       { es: "Músculo (respuesta)", en: "Muscle (response)" },
    reg_p_fila_nueva:    { es: "+ Fila", en: "+ Row" },
    reg_p_compartido:    { es: "⇄ = el mismo dato que en la ficha del caso: lo que escribas aquí aparece allí, y al revés.", en: "⇄ = the same data as in the case form: what you type here appears there, and vice versa." },
    reg_p_solo_caso:     { es: "Sale de la ficha del caso; se cambia allí.", en: "Comes from the case form; change it there." },
    registro_fila_quitar_conf: { es: "¿Quitar esta fila? Tiene datos escritos.", en: "Remove this row? It has data." },
    registro_mod_cab:    { es: "Cabecera", en: "Header" },
    registro_mod_fila:   { es: "Fila {n}", en: "Row {n}" },
    registro_mod_mas:    { es: "+ Fila", en: "+ Row" },
    registro_guardar:    { es: "Guardar", en: "Save" },
    registro_guardado:   { es: "Registro guardado.", en: "Record saved." },
    rr_intro:            { es: "Marca la fase una vez y lo que apuntes después la hereda. Un cambio de señal es qué + qué pasa + Apuntar. La hora de cada línea se corrige tocándola; debajo de cada alarma, las medidas adoptadas y la recuperación.",
                           en: "Mark the phase once and whatever you log afterwards inherits it. A signal change is what + what happens + Log. Tap a line's time to correct it; under each alarm, the measures taken and the recovery." },
    rr_fase:             { es: "Fase", en: "Phase" },
    rr_evento_alarma:    { es: "Evento o alarma", en: "Event or alarm" },
    rr_hora_editar:      { es: "Cambiar la hora", en: "Change the time" },
    rr_fase_actual:      { es: "Fase actual: {fase}", en: "Current phase: {fase}" },
    rr_sin_fase:         { es: "Sin fase marcada", en: "No phase marked" },
    rr_fase_otra:        { es: "Otra", en: "Other" },
    rr_fase_detalle:     { es: "Otra fase o detalle (opcional)", en: "Other phase or detail (optional)" },
    rr_otro:             { es: "Otro", en: "Other" },
    rr_que_detalle:      { es: "Otro o detalle (opcional)", en: "Other or detail (optional)" },
    rr_falta_otro:       { es: "Con «Otro», escribe en la caja de debajo qué es.", en: "With “Other”, type what it is in the box below." },
    rr_en_hoja:          { es: "Apuntar fase, evento o alarma", en: "Log phase, event or alarm" },
    rr_al_detalle:       { es: "Causa, medidas y recuperación", en: "Cause, measures and recovery" },
    rr_contexto:         { es: "Contexto quirúrgico (opcional)", en: "Surgical context (optional)" },
    rr_tof_apuntado:     { es: "TOF {v} ({hora}).", en: "TOF {v} ({hora})." },
    rr_grupo_tecnicas:   { es: "Técnicas", en: "Techniques" },
    rr_grupo_factores:   { es: "Factores técnicos", en: "Technical factors" },
    rr_grupo_anestesia:  { es: "Anestesia", en: "Anaesthesia" },
    rr_editar:           { es: "Corregir esta línea", en: "Edit this line" },
    rr_editar_hecho:     { es: "Hecho", en: "Done" },
    rr_detalle:          { es: "Detalle", en: "Detail" },
    rr_nota_l:           { es: "Nota", en: "Note" },
    rr_que:              { es: "Qué", en: "What" },
    rr_que_pasa:         { es: "Qué pasa", en: "What happens" },
    rr_que_anestesia:    { es: "Anestesia", en: "Anaesthesia" },
    rr_que_tecnico:      { es: "Técnico", en: "Technical" },
    rr_nota:             { es: "Otro o nota (opcional)", en: "Other or note (optional)" },
    rr_apuntar_evento:   { es: "Apuntar evento", en: "Log event" },
    rr_apuntar_alarma:   { es: "Apuntar alarma", en: "Log alarm" },
    rr_falta_que:        { es: "Elige primero qué ha cambiado.", en: "First choose what changed." },
    rr_apuntado:         { es: "Apuntado a las {hora}.", en: "Logged at {hora}." },
    rr_alarma_apuntada:  { es: "Alarma {n} apuntada a las {hora}.", en: "Alarm {n} logged at {hora}." },
    rr_alarma_recuperada: { es: "{n} recuperada ({min} min).", en: "{n} recovered ({min} min)." },
    rr_fase_marcada:     { es: "Fase: {fase} ({hora}).", en: "Phase: {fase} ({hora})." },
    rr_apuntado_lista:   { es: "Apuntado", en: "Logged" },
    rr_vacio:            { es: "Todavía no hay nada apuntado.", en: "Nothing logged yet." },
    rr_quitar:           { es: "Quitar esta línea", en: "Remove this line" },
    rr_quitar_conf:      { es: "¿Quitar esta línea? Si era una alarma, se vacía también su fila de alarmas.", en: "Remove this line? If it was an alarm, its alarm row is cleared too." },
    rr_en_fase:          { es: "en {fase}", en: "in {fase}" },
    registro_vaciar:     { es: "Vaciar", en: "Clear" },
    registro_vaciar_conf: { es: "¿Vaciar este registro? Se borra todo lo escrito y las imágenes de la hoja que tengas abierta.",
                            en: "Clear this record? Everything written and the sheet's images will be deleted." },
    hoja_titulo:         { es: "REGISTRO INTRAOPERATORIO · IONM", en: "INTRAOPERATIVE RECORD · IONM" },
    hoja_hoja:           { es: "Hoja {n}", en: "Sheet {n}" },
    hoja_caso:           { es: "Caso", en: "Case" },
    hoja_mantenimiento:  { es: "Mantenimiento", en: "Maintenance" },
    hoja_tiva:           { es: "TIVA", en: "TIVA" },
    hoja_halogenado:     { es: "Halogenado CAM", en: "Volatile MAC" },
    hoja_raabe:          { es: "Sonda de mapeo:", en: "Mapping probe:" },
    hoja_monopolar:      { es: "Monopolar", en: "Monopolar" },
    hoja_nariz:          { es: "NARIZ", en: "NOSE" },
    hoja_inion:          { es: "INION", en: "INION" },
    hoja_grid_motor:     { es: "Electrodo motor", en: "Motor electrode" },
    hoja_musculos:       { es: "Músculos registrados", en: "Muscles recorded" },
    hoja_sensitivos:     { es: "Electrodo/s sensitivo/s", en: "Sensory electrode(s)" },
    registro_otras_tecnicas: { es: "Otras técnicas", en: "Other techniques" },
    registro_tec_monitor:  { es: "Monitorización", en: "Monitoring" },
    registro_tec_reflejos: { es: "Reflejos", en: "Reflexes" },
    registro_tec_mapeo:    { es: "Mapeo", en: "Mapping" },
    hoja_otra_sonda:     { es: "Otra sonda", en: "Other probe" },
    hoja_intensidad:     { es: "Intensidad", en: "Intensity" },
    hoja_montado:        { es: "Montado en el caso", en: "Set up in the case" },
    hoja_extra:          { es: "material extra", en: "extra material" },
    hoja_eventos_alarmas: { es: "Registro de eventos y alarmas", en: "Event and alarm log" },
    hoja_cod:            { es: "Cód.", en: "Code" },
    hoja_cod_txt:        { es: "F fase · E evento · A alarma · M mapeo · An anestesia · T técnico. Aviso: rodear Cir / An.",
                           en: "F phase · E event · A alarm · M mapping · An anaesthesia · T technical. Alert: circle Surg / An." },
    hoja_nrf:            { es: "repetir · ↑ intensidad · electrodos/impedancias · patrón global vs focal",
                           en: "repeat · ↑ intensity · electrodes/impedances · global vs focal pattern" },
    hoja_anest:          { es: "Anest.", en: "Anaesth." },
    hoja_anest_txt:      { es: "bolo/relajante · profundidad · TAM · Hb/Tª/oxigenación · posición miembros",
                           en: "bolus/relaxant · depth · MAP · Hb/temp/oxygenation · limb position" },
    hoja_cir:            { es: "parar/revertir maniobra · liberar tracción/retracción · suelo tibio · implante · sangrado",
                           en: "stop/reverse manoeuvre · release traction/retraction · warm irrigation · implant · bleeding" },
    hoja_sinmejora:      { es: "Si no mejora", en: "If no improvement" },
    hoja_sinmejora_txt:  { es: "↑ TAM · corticoides · wake-up test · valorar suspender (adapt. Acharya 2017)",
                           en: "↑ MAP · corticosteroids · wake-up test · consider aborting (adapted from Acharya 2017)" },
    hoja_recup_txt:      { es: "S sí · P parcial · N no", en: "S yes · P partial · N no" },
    hoja_resp:           { es: "Resp. NRF·An·Cir", en: "Resp. NRF·An·Surg" },
    hoja_resultado:      { es: "Resultado de la señal", en: "Signal outcome" },
    hoja_comunicacion:   { es: "Comunicación final", en: "Final communication" },
    hoja_cirujano:       { es: "Cirujano", en: "Surgeon" },
    hoja_anestesia:      { es: "Anestesia", en: "Anaesthesia" },
    hoja_caso_sesion:    { es: "Caso para sesión", en: "Case for session" },
    hoja_pendientes:     { es: "Pendientes", en: "Pending" },
    hoja_bd:             { es: "Base de datos", en: "Database" },
    hoja_tiempos:        { es: "Registro tiempos", en: "Time log" },
    hoja_cadwell:        { es: "Exportar el registro del {equipo}", en: "Export the {equipo} log" },
    registro_equipo_neutro: { es: "equipo", en: "equipment" },
    hoja_datos_caso:     { es: "Datos del caso (parámetros y notas)", en: "Case data (parameters and notes)" },
    registro_imprimir:   { es: "Imprimir hoja", en: "Print sheet" },
    caso_hoja_registro:  { es: "Hoja de registro", en: "Record sheet" },
    checklist_g_planificacion: { es: "Días antes",
                           en: "Days before" },
    checklist_g_dia_antes: { es: "El día, antes de quirófano",
                           en: "On the day, before the OR" },
    checklist_g_induccion: { es: "Tras la inducción",
                           en: "After induction" },
    checklist_g_posicionamiento: { es: "Tras el posicionamiento",
                           en: "After positioning" },
    checklist_g_comunicacion: { es: "Con el campo abierto",
                           en: "Once the field is open" },
    checklist_hist_clinica: { es: "Historia: diagnóstico, nivel y lado, cirugía previa, neuropatía previa",
                           en: "History: diagnosis, level and side, prior surgery, pre-existing neuropathy" },
    checklist_examen_neuro: { es: "Exploración neurológica preoperatoria documentada",
                           en: "Pre-op neurological exam documented" },
    checklist_contraindicaciones_tes: { es: "Contraindicaciones relativas de TES (epilepsia, defecto craneal, electrodos intracraneales, clips, marcapasos, DBS, implante coclear)",
                           en: "Relative TES contraindications (epilepsy, skull defect, intracranial electrodes, clips, pacemaker, DBS, cochlear implant)" },
    checklist_consentimiento: { es: "Consentimiento de la IONM firmado",
                           en: "IONM consent signed" },
    checklist_definir_modalidades: { es: "Técnicas según estructuras en riesgo; maniobras de riesgo acordadas con el cirujano",
                           en: "Modalities for the structures at risk; high-risk manoeuvres agreed with the surgeon" },
    checklist_plan_anestesico: { es: "Plan anestésico acordado: TIVA, relajante según técnicas, sin N₂O",
                           en: "Anaesthetic plan agreed: TIVA, relaxant according to techniques, no N₂O" },
    checklist_montar_equipo: { es: "Equipo montado y probado con antelación",
                           en: "Equipment set up and tested in advance" },
    checklist_preconfigurar_protocolo: { es: "Protocolo del caso preconfigurado",
                           en: "Case protocol preconfigured" },
    checklist_material_disponible: { es: "Material específico disponible (sondas, GRID, onda D…)",
                           en: "Specific material available (probes, GRID, D wave…)" },
    checklist_electrodos_antes_drapeado: { es: "Todos los electrodos colocados antes del paño",
                           en: "All electrodes placed before draping" },
    checklist_bloque_mordida: { es: "Bloque de mordida (TES)",
                           en: "Bite block (TES)" },
    checklist_impedancias: { es: "Impedancias (<5 kΩ aguja, <2 kΩ superficie)",
                           en: "Impedances (<5 kΩ needle, <2 kΩ surface)" },
    checklist_estado_estable_anestesico: { es: "Anestesia estable antes de la basal",
                           en: "Stable anaesthesia before baseline" },
    checklist_registro_basal_supino: { es: "Basal en supino, antes de mover al paciente",
                           en: "Supine baseline, before moving the patient" },
    checklist_registro_tras_posicionamiento: { es: "Basal tras el posicionamiento (si cae: corregir postura y repetir)",
                           en: "Baseline after positioning (if it drops: correct position and repeat)" },
    checklist_nervios_perifericos_riesgo: { es: "Nervios en riesgo por la posición (cubital, poplíteo, plexo braquial)",
                           en: "Nerves at risk from positioning (ulnar, popliteal, brachial plexus)" },
    checklist_basal_definitiva: { es: "Basal definitiva antes de la incisión",
                           en: "Final baseline before incision" },
    checklist_confirmar_decusacion: { es: "Decusación confirmada si PESS/PEM lateralizados",
                           en: "Decussation confirmed if SEP/MEP are lateralised" },
    checklist_aviso_bolo_anestesia: { es: "Anestesia avisa antes de bolos o cambios de profundidad",
                           en: "Anaesthesia warns before boluses or depth changes" },
    checklist_timing_maniobras_cirujano: { es: "Cirujano avisa antes de las maniobras de riesgo",
                           en: "Surgeon warns before high-risk manoeuvres" },

    /* --- Fase 4.1: biblioteca de montajes --- */
    dlg_montajes_titulo: { es: "Plantillas de montaje", en: "Montage templates" },
    montaje_en_blanco:   { es: "+ Plantilla en blanco", en: "+ Blank template" },

    /* --- Fase 1: cargar una plantilla sobre un caso --- */
    dlg_elegir_plantilla_titulo: { es: "Elegir plantilla", en: "Choose template" },
    plantilla_filtro_buscar: { es: "Buscar", en: "Search" },
    plantilla_buscar_ph: { es: "Nombre o autor…", en: "Name or author…" },
    plantilla_entradas: { es: "{n} entradas", en: "{n} inputs" },
    plantilla_vacio:    { es: "Ninguna plantilla con esos filtros.", en: "No template matches those filters." },
    dlg_aplicar_plantilla_titulo: { es: "Cargar plantilla en el caso", en: "Load template into the case" },
    plantilla_confirmar_estado: { es: "Este caso está en estado «{estado}». ¿Seguro que quieres cargar una plantilla sobre él?",
                           en: "This case is in “{estado}” status. Are you sure you want to load a template onto it?" },
    plantilla_msg_vacio: { es: "El caso está vacío: se colocarán {n} entradas.", en: "The case is empty: {n} inputs will be placed." },
    plantilla_msg_reemplazar: { es: "Reemplazar todo — se sobrescriben {n} entradas.", en: "Replace everything — {n} inputs get overwritten." },
    plantilla_msg_anadir: { es: "Añadir solo lo que falta — se rellenan {rellenables} entradas vacías y se conservan {ocupadas}.",
                           en: "Add only what's missing — {rellenables} empty inputs get filled in and {ocupadas} are kept." },
    plantilla_btn_reemplazar: { es: "Reemplazar todo", en: "Replace everything" },
    plantilla_btn_anadir: { es: "Añadir solo lo que falta", en: "Add only what's missing" },
    plantilla_btn_aplicar: { es: "Aplicar", en: "Apply" },
    cat_intro_tecnicas:  { es: "Lo que ves y puedes cambiar es la <b>etiqueta</b>. Por dentro cada técnica tiene un identificador fijo que no cambia nunca, así que renombrarla actualiza también los casos ya guardados. <b>Desactivar no borra</b>: deja de ofrecerse para casos nuevos, pero sigue existiendo en el histórico.",
                           en: "What you see and can change is the <b>label</b>. Internally each technique has a fixed identifier that never changes, so renaming it also updates cases already saved. <b>Deactivating does not delete</b>: it stops being offered for new cases, but remains in the history." },
    cat_intro_interv:    { es: "El <b>código</b> puede quedarse vacío hasta que tengas la codificación del hospital. Cuando lo rellenes, se aplica solo a todos los casos anteriores de ese tipo.",
                           en: "The <b>code</b> can stay empty until you have the hospital coding. Once filled in, it applies by itself to all previous cases of that type." },
    cat_intro_serv:      { es: "Servicios quirúrgicos con los que trabajas. Los casos guardan el identificador, no el nombre, así que puedes renombrarlos sin perder nada.",
                           en: "Surgical specialties you work with. Cases store the identifier, not the name, so you can rename them without losing anything." },
    cat_intro_perfiles:  { es: "Combinaciones habituales de técnicas. Al aplicar un perfil se marcan sus técnicas de golpe; el material colocado no se toca.",
                           en: "Common combinations of techniques. Applying a profile selects its techniques at once; placed material is untouched." },
    cat_sin_elementos:   { es: "Todavía no hay nada aquí. Usa «Nuevo» para añadir el primero.",
                           en: "Nothing here yet. Use “New” to add the first one." },
    cat_subir:           { es: "Subir", en: "Move up" },
    cat_bajar:           { es: "Bajar", en: "Move down" },
    cat_activar:         { es: "Desactivada — pulsa para volver a ofrecerla",
                           en: "Deactivated — tap to offer it again" },
    cat_desactivar:      { es: "Activa — pulsa para dejar de ofrecerla en casos nuevos",
                           en: "Active — tap to stop offering it for new cases" },
    cat_editar_tit:      { es: "Pulsa para editarlo", en: "Tap to edit" },
    cat_n_tecnicas:      { es: "{n} técnicas", en: "{n} techniques" },
    cat_sin_servicio:    { es: "— sin servicio —", en: "— no specialty —" },
    cat_version:         { es: "Versión {version} · actualizado {fecha}", en: "Version {version} · updated {fecha}" },
    cat_nunca:           { es: "nunca", en: "never" },
    cat_nueva_tecnicas:  { es: "Técnica nueva", en: "New technique" },
    cat_nueva_servicios: { es: "Servicio nuevo", en: "New specialty" },
    cat_nueva_intervenciones: { es: "Intervención nueva", en: "New procedure" },
    cat_nueva_perfiles:  { es: "Perfil nuevo", en: "New profile" },
    cat_editar_tecnicas: { es: "Editar técnica", en: "Edit technique" },
    cat_editar_servicios:{ es: "Editar servicio", en: "Edit specialty" },
    cat_editar_intervenciones: { es: "Editar intervención", en: "Edit procedure" },
    cat_editar_perfiles: { es: "Editar perfil", en: "Edit profile" },
    cat_campo_etiqueta:  { es: "Etiqueta (lo que ves)", en: "Label (what you see)" },
    cat_campo_grupo:     { es: "Grupo", en: "Group" },
    cat_campo_desc:      { es: "Descripción", en: "Description" },
    cat_campo_desc_ay:   { es: "Sale al pasar el ratón por el chip.", en: "Shown when hovering over the chip." },
    cat_campo_activa:    { es: "Se ofrece para casos nuevos", en: "Offered for new cases" },
    cat_campo_codigo:    { es: "Código del hospital", en: "Hospital code" },
    cat_campo_codigo_ay: { es: "Déjalo vacío si todavía no lo tienes.", en: "Leave it empty if you do not have it yet." },
    cat_campo_servicio:  { es: "Servicio", en: "Specialty" },
    cat_campo_nota:      { es: "Nota", en: "Note" },
    cat_campo_nota_ay:   { es: "Aparece en los avisos del resumen al aplicar el perfil.",
                           en: "Appears in the summary warnings when the profile is applied." },
    cat_campo_tecnicas:  { es: "Técnicas del perfil", en: "Techniques in the profile" },
    cat_falta_nombre:    { es: "Hace falta un nombre.", en: "A name is required." },
    cat_repetido:        { es: "Ya existe algo llamado «{nombre}» en esta lista.",
                           en: "Something called “{nombre}” already exists in this list." },
    cat_borrar_perfil:   { es: "¿Borrar el perfil “{nombre}”?\nLos escenarios que lo usaron no se tocan.",
                           en: "Delete the profile “{nombre}”?\nScenarios that used it are untouched." },
    cat_desactivada_tag: { es: "desactivada", en: "deactivated" },

    /* --- Diálogo de sincronización --- */
    dlg_sync_titulo:     { es: "Sincronizar con GitHub", en: "Sync with GitHub" },
    dlg_sync_intro:      { es: "Guarda tus escenarios, etiquetas y material propio en un repositorio privado de GitHub, para tenerlos en el móvil y en el ordenador. Una vez conectado <b>se sincroniza solo</b>: baja lo último al abrir y sube unos segundos después de cada cambio. En <b>Modo quirófano</b> la subida se pausa —no depende de la red durante la cirugía— y se manda al salir. Sin conexión sigue funcionando y reintenta cuando vuelve. Los botones de abajo fuerzan una subida o bajada a mano.",
                           en: "Stores your scenarios, labels and custom material in a private GitHub repository, so you have them on your phone and your computer. Once connected it <b>syncs on its own</b>: it fetches the latest on opening and uploads a few seconds after each change. In <b>Theatre mode</b> uploading is paused —no network dependency during surgery— and is sent on exit. Offline it keeps working and retries when the connection returns. The buttons below force a manual upload or download." },
    dlg_sync_ayuda:      { es: "Cómo preparar esto la primera vez", en: "How to set this up the first time" },
    sync_paso1:          { es: "Crea un repositorio <b>privado</b> nuevo y vacío en GitHub, solo para los datos (p. ej. <code>checklist-mio-datos</code>). No uses el del código: es público y dejaría los escenarios a la vista.",
                           en: "Create a new, empty <b>private</b> repository on GitHub, just for the data (e.g. <code>checklist-mio-datos</code>). Do not use the code one: it is public and would expose your scenarios." },
    sync_paso2:          { es: "Ve a <b>Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token</b>.",
                           en: "Go to <b>Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token</b>." },
    sync_paso3:          { es: "En <b>Repository access</b> elige <i>Only select repositories</i> y marca solo ese repositorio de datos.",
                           en: "Under <b>Repository access</b> choose <i>Only select repositories</i> and tick only that data repository." },
    sync_paso4:          { es: "En <b>Permissions → Repository permissions</b>, pon <b>Contents: Read and write</b>. Nada más.",
                           en: "Under <b>Permissions → Repository permissions</b>, set <b>Contents: Read and write</b>. Nothing else." },
    sync_paso5:          { es: "Genera el token, cópialo y pégalo abajo. Se guarda solo en este navegador; puedes revocarlo desde GitHub cuando quieras.",
                           en: "Generate the token, copy it and paste it below. It is stored only in this browser; you can revoke it from GitHub whenever you like." },
    campo_repo:          { es: "Repositorio de datos", en: "Data repository" },
    campo_repo_ayuda:    { es: "Con el formato <code>usuario/repositorio</code>.", en: "In the format <code>user/repository</code>." },
    campo_token:         { es: "Token", en: "Token" },
    campo_token_ayuda:   { es: "Se guarda solo en este navegador y nunca sale de él salvo hacia GitHub.",
                           en: "Stored only in this browser and never leaves it except towards GitHub." },
    btn_desconectar:     { es: "Desconectar", en: "Disconnect" },
    btn_bajar:           { es: "Bajar", en: "Download" },
    btn_subir:           { es: "Subir", en: "Upload" }
  };

  /* Vuelca data/i18n-<idioma>.js dentro de los objetos de datos como campos
     "_<idioma>". Así surgeries.js se queda limpio y con sus comentarios, y
     campo() no necesita saber de dónde salió cada traducción. */
  function volcarTraducciones() {
    var todos = window.SURGERIES_I18N || {};
    Object.keys(todos).forEach(function (lang) {
      var tr = todos[lang] || {};
      var suf = "_" + lang;

      function fusionar(destino, origen) {
        if (!destino || !origen) return;
        Object.keys(origen).forEach(function (k) {
          if (origen[k]) destino[k + suf] = origen[k];
        });
      }

      Object.keys(tr.cajas || {}).forEach(function (k) {
        fusionar(CAJAS_TODAS[k], tr.cajas[k]);
      });
      Object.keys(CAJAS_TODAS).forEach(function (k) {
        (CAJAS_TODAS[k].especiales || []).forEach(function (esp) {
          fusionar(esp, (tr.especiales || {})[esp.clave]);
        });
      });
      ETIQUETAS_BASE.forEach(function (e) {
        if ((tr.etiquetas || {})[e.id]) e["nombre" + suf] = tr.etiquetas[e.id];
      });
      CATALOGO_BASE.forEach(function (g) {
        if ((tr.categorias || {})[g.categoria]) g["categoria" + suf] = tr.categorias[g.categoria];
        (g.items || []).forEach(function (it) {
          fusionar(it, (tr.items || {})[it.id]);
        });
      });
      TECNICAS_BASE.forEach(function (t) {
        fusionar(t, (tr.tecnicas || {})[t.id]);
      });
      SERVICIOS_BASE.forEach(function (s) {
        fusionar(s, (tr.servicios || {})[s.id]);
      });
      INTERVENCIONES_BASE.forEach(function (i) {
        fusionar(i, (tr.intervenciones || {})[i.id]);
      });
      PERFILES_BASE.forEach(function (p) {
        fusionar(p, (tr.perfiles || {})[p.id]);
      });
      Object.keys(DATA.escenarios || {}).forEach(function (k) {
        fusionar(DATA.escenarios[k], (tr.escenarios || {})[k]);
      });
    });
  }

  /* Los escenarios de fábrica que ya están guardados en el navegador se
     grabaron sin traducciones, y al cargarlos pisan a los del archivo. Se
     les vuelven a poner, salvo que el usuario los haya renombrado: en ese
     caso manda su nombre y se quitan las traducciones viejas. */
  function traducirEscenarios() {
    var todos = window.SURGERIES_I18N || {};
    Object.keys(todos).forEach(function (lang) {
      var tr = (todos[lang] || {}).escenarios || {};
      Object.keys(tr).forEach(function (k) {
        var esc = montajes[k];
        var fabrica = (DATA.escenarios || {})[k];
        if (!esc || !fabrica) return;
        var suyo = esc.nombre !== fabrica.nombre;
        Object.keys(tr[k]).forEach(function (c) {
          if (suyo) delete esc[c + "_" + lang];
          else esc[c + "_" + lang] = tr[k][c];
        });
      });
    });
  }

  // Texto de interfaz. {claves} se sustituyen por los valores dados.
  function T(clave, valores) {
    var entrada = TEXTOS[clave];
    var texto = entrada ? (entrada[idioma] || entrada.es) : clave;
    if (valores) {
      Object.keys(valores).forEach(function (k) {
        texto = texto.split("{" + k + "}").join(valores[k]);
      });
    }
    return texto;
  }

  // Campo traducible de un objeto de datos: "nombre" -> "nombre_en"
  function campo(obj, nombre) {
    if (!obj) return "";
    if (idioma !== "es" && obj[nombre + "_" + idioma]) return obj[nombre + "_" + idioma];
    return obj[nombre] || "";
  }

  function localeActual() {
    return idioma === "en" ? "en-GB" : "es-ES";
  }

  function aplicarTextos() {
    document.documentElement.lang = idioma;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = T(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = T(el.dataset.i18nHtml);
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.placeholder = T(el.dataset.i18nPh);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.title = T(el.dataset.i18nTitle);
    });
    // La guía solo está escrita en castellano por ahora: en inglés se avisa
    // dentro del propio diálogo en vez de dejarla a medio traducir sin decirlo.
    var avisoEn = document.getElementById("guia-aviso-en");
    if (avisoEn) avisoEn.hidden = idioma !== "en";
    var avisoEnTecMio = document.getElementById("tecmio-aviso-en");
    if (avisoEnTecMio) avisoEnTecMio.hidden = idioma !== "en";
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", T(el.dataset.i18nAria));
    });
    var btn = document.getElementById("btn-idioma");
    if (btn) {
      btn.textContent = idioma === "es" ? "EN" : "ES";
      btn.title = T("idioma_titulo");
    }
  }

  /* ---------------------------------------------------------------- *
   * Fase 7 (06-09-2026): pantalla de inicio con 6 tarjetas, cada una
   * llevando a su propia pantalla dedicada -antes era todo una sola
   * página con diálogos colgando de un menú-. Cada pantalla es un
   * elemento de nivel superior con class="pantalla" e id="pantalla-<nombre>";
   * la visible lleva además la clase "activa". Se usan dos clases y no
   * [hidden] a propósito: este proyecto ya se ha topado tres veces con el
   * mismo fallo de especificidad (.campo[hidden], .barra-caso-acciones[hidden],
   * .menu-lista[hidden] -ver más abajo en este archivo y en CLAUDE.md-) donde
   * una clase con su propio "display" gana a un [hidden] si va después en la
   * hoja. Dos clases (.pantalla.activa) le ganan siempre a una (.pantalla),
   * sin depender del orden del CSS, así que este patrón evita el bug entero
   * en vez de tener que acotarlo cada vez.
   * ---------------------------------------------------------------- */
  var PANTALLAS = ["inicio", "organizador", "casos", "checklist", "registro", "material", "tecnicas-mio", "docente", "simulador", "bibliografia", "apuntes"];

  function irAPantalla(nombre) {
    // Registro intraoperatorio guarda con retardo mientras se escribe: al
    // cambiar de pantalla se vuelca lo pendiente.
    if (typeof registroVaciarPendiente === "function") registroVaciarPendiente();
    PANTALLAS.forEach(function (p) {
      var el = document.getElementById("pantalla-" + p);
      if (el) el.classList.toggle("activa", p === nombre);
    });
    window.scrollTo(0, 0);
    actualizarHistorialPantalla(nombre);
  }

  // Para el patrón "si esta pantalla está visible ahora mismo, repinta" -antes
  // dlgCasos.open, con dlg-casos ya convertido de <dialog> a <div> ese booleano
  // nativo deja de existir, hace falta esta comprobación explícita.
  function pantallaActiva(nombre) {
    var el = document.getElementById("pantalla-" + nombre);
    return !!(el && el.classList.contains("activa"));
  }

  /* ---------------------------------------------------------------- *
   * Atrás del teléfono (07-09-2026): en una PWA "standalone" no hay barra
   * de navegador ni botón atrás propio -el gesto/tecla atrás de Android es
   * lo único que hay-, y sin nada de esto una app de una sola página no
   * tiene ningún historial que recorrer: el primer atrás la cierra
   * directamente, sin avisar, aunque haya algo sin sincronizar. Se arma un
   * historial de dos escalones con el History API para poder interceptarlo:
   *
   *   NIVEL_SUELO (0) - un escalón por debajo de Inicio, que solo existe
   *     para que SÍ haya algo que "hacer pop" la primera vez que se pulsa
   *     atrás estando en Inicio -si no, un PWA recién abierto no tiene
   *     nada previo en el historial y el atrás cierra sin disparar ningún
   *     evento que se pueda interceptar-.
   *   NIVEL_INICIO (1) - el escalón "de descanso": aquí se está siempre
   *     que la pantalla visible es Inicio.
   *   NIVEL_SUBPANTALLA (2) - se añade al entrar en cualquiera de las 7
   *     pantallas principales.
   *
   * Atrás desde NIVEL_SUBPANTALLA -> NIVEL_INICIO: no se pregunta nada,
   * solo se refleja Inicio (mismo destino que el logo).
   * Atrás desde NIVEL_INICIO -> NIVEL_SUELO: es el intento real de salir;
   * se pregunta, y si se cancela se vuelve a poner NIVEL_INICIO para
   * "atrapar" el siguiente atrás igual que el primero.
   * ---------------------------------------------------------------- */
  var NIVEL_SUELO = 0, NIVEL_INICIO = 1, NIVEL_SUBPANTALLA = 2;

  function nivelHistorialActual() {
    return (history.state && typeof history.state.nivelMio === "number") ? history.state.nivelMio : null;
  }

  function fijarNivelHistorial(nivel, empujar) {
    var estado = { nivelMio: nivel };
    if (empujar) history.pushState(estado, "", location.href);
    else history.replaceState(estado, "", location.href);
  }

  // Se llama desde irAPantalla() en cada cambio de pantalla: mantiene el
  // historial en el escalón que toca sin que el resto del código tenga que
  // saber nada de esto.
  function actualizarHistorialPantalla(nombre) {
    var nivelActual = nivelHistorialActual();
    if (nombre === "inicio") {
      // Si veníamos de una subpantalla, hay que deshacer ese escalón -atrás
      // en vez de un pushState nuevo, para que el historial no crezca cada
      // vez que se entra y se sale de una pantalla desde el propio botón
      // Inicio-. El popstate que dispara lo resuelve el listener de abajo
      // sin preguntar nada (nivel NIVEL_INICIO).
      if (nivelActual === NIVEL_SUBPANTALLA) history.back();
    } else if (nivelActual !== NIVEL_SUBPANTALLA) {
      fijarNivelHistorial(NIVEL_SUBPANTALLA, true);
    }
  }

  function hayPendienteSinSincronizar() {
    return syncActivo() && (sync.pendiente || casosPendientes().length || borradosPendientes().length ||
      montajesPendientes().length || montajesBorradosPend().length || apunteDocPendiente() || simPresetsPendientes());
  }

  function confirmarSalidaApp() {
    var msg = T("confirmar_salir");
    if (hayPendienteSinSincronizar()) msg += "\n\n" + T("confirmar_salir_pendiente");
    return confirm(msg);
  }

  // Arranque: dos escalones fijos por debajo de cualquier pantalla -"suelo"
  // e "inicio"-, ver el porqué en el comentario de arriba. replaceState
  // para el primero (no añade entrada al historial real del navegador,
  // solo etiqueta la que ya había) y pushState para el segundo.
  fijarNivelHistorial(NIVEL_SUELO, false);
  fijarNivelHistorial(NIVEL_INICIO, true);

  window.addEventListener("popstate", function (e) {
    var nivel = e.state && typeof e.state.nivelMio === "number" ? e.state.nivelMio : null;
    if (nivel === NIVEL_INICIO) {
      // Pedido del usuario (19-09-2026): si el atrás llega hasta aquí
      // estando en "Editar montaje" de un caso (Organizador con
      // body.editando-caso -ver abrirMontajeDeCaso()-), no debe saltar a
      // Inicio como con cualquier otra subpantalla: debe volver "a donde
      // estaba", la ficha del caso dentro de Gestión de Casos, igual que el
      // botón "Volver al caso" de la barra fija. `irAPantalla("organizador")`
      // no empuja un escalón propio al entrar aquí desde "casos" -ver
      // actualizarHistorialPantalla(), no añade nivel si ya se venía de otra
      // subpantalla-, así que sin este caso especial el único escalón que
      // hay por encima de Inicio es genérico y no sabe distinguir de dónde
      // se vino. Se vuelve a empujar NIVEL_SUBPANTALLA para que el próximo
      // atrás -ya sin estar editando- siga saliendo hacia Inicio con
      // normalidad, igual que el "Cancelado" de más abajo repone NIVEL_INICIO
      // para atrapar el siguiente atrás.
      if (document.body.classList.contains("editando-caso")) {
        fijarNivelHistorial(NIVEL_SUBPANTALLA, true);
        cerrarMontajeDeCaso(true);
        return;
      }
      // Atrás desde una subpantalla normal: solo hay que reflejar Inicio,
      // sin preguntar nada -es exactamente lo mismo que pulsar el logo-.
      if (!pantallaActiva("inicio")) irAPantalla("inicio");
      return;
    }
    if (nivel === NIVEL_SUBPANTALLA) {
      // No debería pasar con este router -solo se llega aquí navegando
      // hacia alante, y aquí nunca se navega hacia alante a mano-, pero
      // por si acaso no se hace nada especial.
      return;
    }
    // Sin marca "nivelMio": el atrás ha bajado por debajo de "inicio" -el
    // intento real de salir de la herramienta-.
    if (confirmarSalidaApp()) {
      // Confirmado: se intenta cerrar. window.close() solo funciona de
      // verdad en algunos navegadores/PWA -no hay forma de forzarlo desde
      // una página web sin más-, así que es el mejor esfuerzo posible; si
      // no hace nada visible, el usuario cierra la app a mano como siempre.
      window.close();
    } else {
      // Cancelado: se vuelve a poner el escalón de "inicio" para atrapar
      // el siguiente atrás igual que este.
      fijarNivelHistorial(NIVEL_INICIO, true);
    }
  });

  document.getElementById("btn-cerrar-app").addEventListener("click", function () {
    if (confirmarSalidaApp()) window.close();
  });

  document.getElementById("btn-inicio").addEventListener("click", function () { irAPantalla("inicio"); });
  // Botón "Inicio" junto al título de cada pantalla (pedido el 06-09-2026):
  // mismo destino que el logo, para no obligar a subir hasta la cabecera.
  document.querySelectorAll(".btn-pantalla-inicio").forEach(function (btn) {
    btn.addEventListener("click", function () { irAPantalla("inicio"); });
  });
  document.getElementById("tile-organizador").addEventListener("click", function () { irAPantalla("organizador"); });
  document.getElementById("tile-simulador").addEventListener("click", function () { abrirSimulador(); });
  /* Bibliografía recomendada (27-09-2026, pedido del usuario): las fuentes
     usadas para construir la herramienta, en estilo Vancouver y numeradas de
     seguido. Referencias preparadas por el usuario; los DOI se comprobaron en
     PubMed (volumen, número y páginas; el año es el de la versión impresa),
     salvo Álvarez 2023, cuya revista no está indexada. Solo la cita: nada de
     contenido de las obras. Lima Medeiros 2024 = de Melo DLM en PubMed. */
  var BIBLIOGRAFIA = [
    { g: "libros", t: "Møller AR. Intraoperative Neurophysiological Monitoring. 3.ª ed. New York: Springer; 2011.", t_en: "Møller AR. Intraoperative Neurophysiological Monitoring. 3rd ed. New York: Springer; 2011." },
    { g: "libros", t: "Deletis V, Shils JL, Sala F, Seidel K, editores. Neurophysiology in Neurosurgery: A Modern Approach. 2.ª ed. London: Academic Press (Elsevier); 2020.", t_en: "Deletis V, Shils JL, Sala F, Seidel K, editors. Neurophysiology in Neurosurgery: A Modern Approach. 2nd ed. London: Academic Press (Elsevier); 2020." },
    { g: "guias", t: "Macdonald DB, Skinner S, Shils J, Yingling C; American Society of Neurophysiological Monitoring. Intraoperative motor evoked potential monitoring – a position statement by the American Society of Neurophysiological Monitoring. Clin Neurophysiol. 2013;124(12):2291-316.", doi: "10.1016/j.clinph.2013.07.025" },
    { g: "guias", t: "MacDonald DB, Dong C, Quatrale R, Sala F, Skinner S, Soto F, et al. Recommendations of the International Society of Intraoperative Neurophysiology for intraoperative somatosensory evoked potentials. Clin Neurophysiol. 2019;130(1):161-79.", doi: "10.1016/j.clinph.2018.10.008" },
    { g: "guias", t: "Leppanen RE. Intraoperative monitoring of segmental spinal nerve root function with free-run and electrically-triggered electromyography and spinal cord function with reflexes and F-responses. A position statement by the American Society of Neurophysiological Monitoring. J Clin Monit Comput. 2005;19(6):437-61.", doi: "10.1007/s10877-005-0086-2" },
    { g: "guias", t: "Legatt AD, Emerson RG, Epstein CM, MacDonald DB, Deletis V, Bravo RJ, et al. ACNS Guideline: Transcranial electrical stimulation motor evoked potential monitoring. J Clin Neurophysiol. 2016;33(1):42-50.", doi: "10.1097/WNP.0000000000000253" },
    { g: "guias", t: "Toleikis JR, Pace C, Jahangiri FR, Hemmer LB, Toleikis SC. Intraoperative somatosensory evoked potential (SEP) monitoring: an updated position statement by the American Society of Neurophysiological Monitoring. J Clin Monit Comput. 2024;38(5):1003-42.", doi: "10.1007/s10877-024-01201-x" },
    { g: "articulos", t: "Acharya S, Palukuri N, Gupta P, Kohli M. Transcranial motor evoked potentials during spinal deformity corrections – safety, efficacy, limitations, and the role of a checklist. Front Surg. 2017;4:8.", doi: "10.3389/fsurg.2017.00008" },
    { g: "articulos", t: "Alvarez CM, Farhan R, Jahangiri FR. Benefits of intraoperative neurophysiological monitoring (IONM) for the localization, mapping, and resection of tumors in the fourth ventricle: a literature review. J Neurophysiol Monit. 2023;1(2):22-36.", doi: "10.5281/zenodo.10207910" },
    { g: "articulos", t: "Boaro A, Basaldella F, Sala F. Intraoperative neurophysiological monitoring during spinal cord tumor surgery. Neurosurg Clin N Am. 2026;37(3):305-16.", doi: "10.1016/j.nec.2026.03.007" },
    { g: "articulos", t: "Costa P, Deletis V. Cortical activity after stimulation of the corticospinal tract in the spinal cord. Clin Neurophysiol. 2016;127(2):1726-33.", doi: "10.1016/j.clinph.2015.11.004" },
    { g: "articulos", t: "Deletis V, Fernández-Conejero I. Intraoperative monitoring and mapping of the functional integrity of the brainstem. J Clin Neurol. 2016;12(3):262-73.", doi: "10.3988/jcn.2016.12.3.262" },
    { g: "articulos", t: "de Melo DLM, Comerlato EA, Pinheiro DS, Manzano GM. The feasibility and technical aspects of trigemino-cervical reflex elicitation in humans under general anesthesia. Clin Neurophysiol. 2024;161:173-9.", doi: "10.1016/j.clinph.2024.02.031" },
    { g: "articulos", t: "London D, Birkenfeld B, Thomas J, Avshalumov M, Mogilner AY, Falowski S, et al. A broad and variable lumbosacral myotome map uncovered by foraminal nerve root stimulation. J Neurosurg Spine. 2022;37(5):680-6.", doi: "10.3171/2022.3.SPINE2212" },
    { g: "articulos", t: "Mirallave Pescador A, Téllez MJ, Sánchez Roldán MÁ, Samusyte G, Lawson EC, Coelho P, et al. Methodology for eliciting the brainstem trigeminal-hypoglossal reflex in humans under general anesthesia. Clin Neurophysiol. 2022;137:1-10.", doi: "10.1016/j.clinph.2022.02.004" },
    { g: "articulos", t: "Romstöck J, Strauss C, Fahlbusch R. Continuous electromyography monitoring of motor cranial nerves during cerebellopontine angle surgery. J Neurosurg. 2000;93(4):586-93.", doi: "10.3171/jns.2000.93.4.0586" },
    { g: "articulos", t: "Schirmer CM, Shils JL, Arle JE, Cosgrove GR, Dempsey PK, Tarlov E, et al. Heuristic map of myotomal innervation in humans using direct intraoperative nerve root stimulation. J Neurosurg Spine. 2011;15(1):64-70.", doi: "10.3171/2011.2.SPINE1068" },
    { g: "articulos", t: "Sloan TB. Muscle relaxant use during intraoperative neurophysiologic monitoring. J Clin Monit Comput. 2013;27(1):35-46.", doi: "10.1007/s10877-012-9399-0" },
    { g: "articulos", t: "Szelényi A, Fava E. Long latency responses in tongue muscle elicited by various stimulation sites in anesthetized humans – new insights into tongue-related brainstem reflexes. Brain Stimul. 2022;15(3):566-75.", doi: "10.1016/j.brs.2022.03.003" },
    { g: "articulos", t: "Ulkatan S, Jaramillo AM, Téllez MJ, Goodman RR, Deletis V. Feasibility of eliciting the H reflex in the masseter muscle in patients under general anesthesia. Clin Neurophysiol. 2017;128(1):123-7.", doi: "10.1016/j.clinph.2016.10.092" },
    { g: "articulos", t: "Urriza J, Fernández-Conejero I, Seidel K, Ulkatan S. Introducing the Trigemino-Vocal Reflex: new insights to assess brainstem connectivity under general anesthesia. Clin Neurophysiol. 2025;175:2110739.", doi: "10.1016/j.clinph.2025.2110739" }
  ];

  function renderBibliografia() {
    var cont = document.getElementById("bibliografia-lista");
    cont.textContent = "";
    var numero = 1;
    ["libros", "guias", "articulos"].forEach(function (g) {
      var h = document.createElement("h3");
      h.className = "biblio-grupo";
      h.textContent = T("biblio_" + g);
      cont.appendChild(h);
      // Numeración de seguido entre los tres grupos, como en Vancouver
      var ol = document.createElement("ol");
      ol.className = "biblio-lista";
      ol.start = numero;
      BIBLIOGRAFIA.filter(function (b) { return b.g === g; }).forEach(function (b) {
        var li = document.createElement("li");
        li.appendChild(document.createTextNode(campo(b, "t")));
        if (b.doi) {
          li.appendChild(document.createTextNode(" doi: "));
          var a = document.createElement("a");
          a.href = "https://doi.org/" + b.doi;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = b.doi;
          li.appendChild(a);
        }
        ol.appendChild(li);
        numero++;
      });
      cont.appendChild(ol);
    });
  }

  document.getElementById("tile-bibliografia").addEventListener("click", function () {
    renderBibliografia();
    irAPantalla("bibliografia");
  });
  // tile-casos, tile-tecnicas-mio, tile-docente y tile-apuntes se conectan
  // más abajo, junto a abrirListaCasos()/abrirTecnicasMio()/abrirDocente()/
  // abrirApunteDoc() -esas sí necesitan pintar contenido antes de
  // mostrarse, no son un simple cambio de pantalla-.

  function aplicarIdioma(nuevo, repintar) {
    idioma = IDIOMAS.indexOf(nuevo) === -1 ? "es" : nuevo;
    try { localStorage.setItem(IDIOMA_KEY, idioma); } catch (e) { /* sin persistencia */ }
    aplicarTextos();
    if (repintar) {
      renderTodo();
      // El Registro abierto se pinta desde sus propios datos, no desde
      // renderTodo(): sin esto seguía en el idioma anterior hasta tocar algo.
      if (pantallaActiva("registro")) renderRegistroContenido();
      if (tourPaso >= 0) tourPintarTextos();
      pintarEstadoSync();
      avisoGuardado(T(MODO_DEMO ? "demo_aviso" : (syncActivo() ? "guardado_nube" : "guardado_local")));
    }
  }

  /* ---------------------------------------------------------------- *
   * Etiquetas = tipos físicos de material (aguja trenzada, sacacorchos,
   * pegatina...). Deciden qué se cuenta en el resumen y cómo se ve el chip.
   *
   * Las de fábrica viven en data/surgeries.js. El usuario puede crear las
   * suyas, y también editar o borrar las de fábrica: una etiqueta propia
   * con el mismo id sustituye a la de fábrica, y etiquetasBorradas guarda
   * las que ha quitado.
   * ---------------------------------------------------------------- */
  var PALETA = {
    rojo: "#cc2f24", azul: "#2565c4", verde: "#248a3c", amarillo: "#d3a800",
    negro: "#14171a", naranja: "#d2691e", morado: "#7b3fa0",
    turquesa: "#0d8f8f", gris: "#8896a2",
    // Mismo tono que --tm-mep en Técnicas IONM: ya está pensado para
    // distinguirse de "rojo" a simple vista sin dejar de leerse como rojo
    // -mismo problema (dos rojos que no se pueden confundir) resuelto ya
    // una vez en este proyecto-. Usado en Manta GRID B, que sigue siendo
    // roja (anodal) pero no puede confundirse con Manta GRID A.
    granate: "#7a1f3d"
  };
  var BORDES = {
    solido: "solid", punteado: "dotted", discontinuo: "dashed",
    doble: "double", grueso: "solid", ninguno: "none"
  };

  var etiquetasUsuario = [];    // [{id, nombre, borde, color, fondo}]
  var etiquetasBorradas = [];   // ids de etiquetas de fábrica que el usuario ha quitado
  var ETIQUETAS = [];           // lista final, ordenada
  var ETQ = {};                 // id -> etiqueta

  function reconstruirEtiquetas() {
    ETIQUETAS = [];
    ETQ = {};
    ETIQUETAS_BASE.forEach(function (e) {
      if (etiquetasBorradas.indexOf(e.id) !== -1) return;
      var copia = Object.assign({}, e);
      ETQ[copia.id] = copia;
      ETIQUETAS.push(copia);
    });
    etiquetasUsuario.forEach(function (e) {
      var copia = Object.assign({}, e, { propia: true });
      var previa = ETQ[copia.id];
      if (previa) {
        // Reedición de una etiqueta de fábrica: ocupa su mismo sitio
        ETIQUETAS[ETIQUETAS.indexOf(previa)] = copia;
      } else {
        ETIQUETAS.push(copia);
      }
      ETQ[copia.id] = copia;
    });
  }

  function etiquetaPorNombre(nombre) {
    if (!nombre) return null;
    var buscado = nombre.trim().toLowerCase();
    for (var i = 0; i < ETIQUETAS.length; i++) {
      if (ETIQUETAS[i].nombre.trim().toLowerCase() === buscado) return ETIQUETAS[i];
    }
    return null;
  }

  function idLibreEtiqueta(nombre) {
    var base = "e_" + normalizar(nombre || "etiqueta");
    var id = base, n = 2;
    while (ETQ[id]) { id = base + "_" + n; n++; }
    return id;
  }

  // Etiqueta efectiva de un ítem: el override de la colocación manda sobre
  // la del ítem. "material" es el campo antiguo (texto suelto) de copias
  // exportadas antes de que existieran las etiquetas.
  function etiquetaDe(item, override) {
    if (!item) return null;
    if (override && ETQ[override]) return ETQ[override];
    if (item.etiqueta && ETQ[item.etiqueta]) return ETQ[item.etiqueta];
    return etiquetaPorNombre(item.material);
  }

  function nombreEtiquetaDe(item, override) {
    var et = etiquetaDe(item, override);
    if (et) return campo(et, "nombre");
    return (item && item.material) || T("chip_sin_etiqueta");
  }

  // El ítem puede sobreescribir cualquiera de las tres señas de la etiqueta
  function estiloDe(item, override) {
    var et = etiquetaDe(item, override) || {};
    return {
      borde: item.borde || et.borde || "solido",
      color: item.color || et.color || null,
      fondo: item.fondo || et.fondo || "ninguno"
    };
  }

  function colorHex(valor) {
    if (!valor || valor === "ninguno") return null;
    if (PALETA[valor]) return PALETA[valor];
    return /^#[0-9a-f]{3,8}$/i.test(valor) ? valor : null;
  }

  function aplicarEstilo(el, estilo) {
    el.style.borderStyle = BORDES[estilo.borde] || "solid";
    el.style.borderWidth = (estilo.borde === "grueso" || estilo.borde === "doble") ? "3px" : "1px";
    var borde = colorHex(estilo.color);
    if (borde) el.style.borderColor = borde;
    var fondo = colorHex(estilo.fondo);
    // Tinte suave: el mismo color con alfa, para que se lea igual sobre el
    // panel claro del catálogo y sobre el fondo oscuro de las cajas.
    if (fondo) el.style.backgroundColor = fondo + "2e";
  }

  /* ---------------------------------------------------------------- *
   * Catálogo = material de fábrica (data/surgeries.js) + material propio
   * que el usuario añade desde la interfaz.
   * ---------------------------------------------------------------- */
  var catalogoUsuario = [];   // [{id, nombre, categoria, material, color, nota, sin_entrada}]
  var CATALOGO = [];          // agrupado, listo para pintar
  var ITEMS = {};             // id -> item

  function reconstruirCatalogo() {
    ITEMS = {};
    CATALOGO = [];

    CATALOGO_BASE.forEach(function (grupo) {
      var items = (grupo.items || []).map(function (item) {
        var completo = Object.assign({}, item, {
          categoria: grupo.categoria,
          categoria_en: grupo.categoria_en,
          // Material que se prepara pero no se conecta a ninguna entrada
          sin_entrada: !!(item.sin_entrada || grupo.sin_entrada)
        });
        ITEMS[item.id] = completo;
        return completo;
      });
      // La categoría en castellano es la clave de agrupación; la traducción
      // viaja al lado para pintarla, no para agrupar.
      CATALOGO.push({ categoria: grupo.categoria, categoria_en: grupo.categoria_en, plegada_por_defecto: !!grupo.plegada_por_defecto, items: items });
    });

    catalogoUsuario.forEach(function (item) {
      var completo = Object.assign({}, item, { propio: true });
      var previo = ITEMS[item.id];
      if (previo && previo.ampliacion && completo.ampliacion === undefined) completo.ampliacion = true;
      ITEMS[item.id] = completo;
      var grupo = CATALOGO.filter(function (g) { return g.categoria === item.categoria; })[0];
      if (!grupo) {
        grupo = { categoria: item.categoria, categoria_en: item.categoria_en, items: [] };
        CATALOGO.push(grupo);
      }
      // Un ítem propio con el id de uno de fábrica lo sustituye en su sitio,
      // para poder retocar el material que viene de serie sin duplicarlo.
      var i = previo ? grupo.items.indexOf(previo) : -1;
      if (i !== -1) grupo.items[i] = completo;
      else grupo.items.push(completo);
      // Si además cambió de categoría, hay que sacarlo de la anterior
      if (previo && i === -1) {
        CATALOGO.forEach(function (g) {
          var j = g.items.indexOf(previo);
          if (j !== -1) g.items.splice(j, 1);
        });
      }
    });
  }

  function categoriasExistentes() {
    return CATALOGO.map(function (g) { return g.categoria; });
  }

  function normalizar(texto) {
    return (texto || "").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "x";
  }

  function idLibre(nombre) {
    var base = "u_" + normalizar(nombre || "material");
    var id = base, n = 2;
    while (ITEMS[id]) { id = base + "_" + n; n++; }
    return id;
  }

  /* ---------------------------------------------------------------- *
   * Catálogos editables: técnicas, servicios, intervenciones y perfiles
   *
   * Mismo patrón que las etiquetas y el material propio: lista de fábrica
   * (data/surgeries.js) + lista del usuario + orden propio, fusionadas por
   * id al arrancar. Un elemento propio con el id de uno de fábrica lo
   * sustituye en su sitio.
   *
   * Lo que se guarda en los escenarios y en los casos es el "id", nunca el
   * texto visible. Por eso renombrar una técnica se propaga sola a todo el
   * histórico en vez de dejar huérfano lo guardado antes.
   *
   * Ojo con el nombre "etiqueta": en una técnica es su texto visible, y no
   * tiene nada que ver con las etiquetas de material (tipos físicos).
   * ---------------------------------------------------------------- */
  var CATALOGOS = ["tecnicas", "servicios", "intervenciones", "perfiles", "usuarios"];
  var GRUPOS_TECNICA = ["monitorizacion", "mapeo"];

  // nombre -> { version, actualizado_en, propios[], orden[], borrados[] }
  var catalogos = {};

  var TECNICAS = [], TECS = {};
  var SERVICIOS = [], SERV = {};
  var INTERVENCIONES = [], INTERV = {};
  var PERFILES = [], PERF = {};
  var USUARIOS = [], USRS = {};

  function reiniciarCatalogos() {
    catalogos = {};
    CATALOGOS.forEach(function (n) {
      catalogos[n] = { version: 1, actualizado_en: null, propios: [], orden: [], borrados: [] };
    });
  }

  function fusionarCatalogo(base, meta) {
    var lista = [], indice = {};
    base.forEach(function (e) {
      if (meta.borrados.indexOf(e.id) !== -1) return;
      var copia = Object.assign({}, e);
      indice[copia.id] = copia;
      lista.push(copia);
    });
    meta.propios.forEach(function (e) {
      if (meta.borrados.indexOf(e.id) !== -1) return;
      var copia = Object.assign({}, e, { propio: true });
      var previo = indice[copia.id];
      if (previo) lista[lista.indexOf(previo)] = copia;
      else lista.push(copia);
      indice[copia.id] = copia;
    });
    // El orden que hayas fijado manda. Lo que no esté en él va detrás, en el
    // orden de fábrica: así una técnica nueva aparece al final en lugar de
    // colarse en un sitio raro o desaparecer.
    if (meta.orden.length) {
      var posBase = {};
      lista.forEach(function (e, i) { posBase[e.id] = i; });
      lista.sort(function (a, b) {
        var ia = meta.orden.indexOf(a.id), ib = meta.orden.indexOf(b.id);
        if (ia === -1) ia = meta.orden.length + posBase[a.id];
        if (ib === -1) ib = meta.orden.length + posBase[b.id];
        return ia - ib;
      });
    }
    return { lista: lista, indice: indice };
  }

  function reconstruirCatalogos() {
    var t = fusionarCatalogo(TECNICAS_BASE, catalogos.tecnicas);
    TECNICAS = t.lista; TECS = t.indice;
    var s = fusionarCatalogo(SERVICIOS_BASE, catalogos.servicios);
    SERVICIOS = s.lista; SERV = s.indice;
    var i = fusionarCatalogo(INTERVENCIONES_BASE, catalogos.intervenciones);
    INTERVENCIONES = i.lista; INTERV = i.indice;
    var p = fusionarCatalogo(PERFILES_BASE, catalogos.perfiles);
    PERFILES = p.lista; PERF = p.indice;
    var u = fusionarCatalogo(USUARIOS_BASE, catalogos.usuarios);
    USUARIOS = u.lista; USRS = u.indice;
  }

  // Lo desactivado deja de ofrecerse para casos nuevos, pero sigue existiendo
  // y sigue resolviéndose por id en todo lo guardado antes.
  function activos(lista) {
    return lista.filter(function (e) { return e.activa !== false; });
  }

  function tocarCatalogo(nombre) {
    var c = catalogos[nombre];
    c.version = (c.version || 1) + 1;
    c.actualizado_en = new Date().toISOString();
  }

  function aplicarCatalogosGuardados(guardados) {
    CATALOGOS.forEach(function (n) {
      var g = guardados && guardados[n];
      if (!g) return;
      catalogos[n] = {
        version: g.version || 1,
        actualizado_en: g.actualizado_en || null,
        propios: Array.isArray(g.propios) ? g.propios : [],
        orden: Array.isArray(g.orden) ? g.orden : [],
        borrados: Array.isArray(g.borrados) ? g.borrados : []
      };
    });
  }

  function idLibreEn(indice, prefijo, nombre) {
    var base = prefijo + normalizar(nombre || "nuevo");
    var id = base, n = 2;
    while (indice[id]) { id = base + "_" + n; n++; }
    return id;
  }

  /* Al cambiar un texto que venía de fábrica se olvidan sus traducciones: ya
     no describen lo que hay. Es lo mismo que hace traducirEscenarios() cuando
     renombras un escenario de fábrica. */
  function fijarTexto(obj, clave, valor) {
    if ((obj[clave] || "") === (valor || "")) return;
    obj[clave] = valor;
    IDIOMAS.forEach(function (l) { delete obj[clave + "_" + l]; });
  }

  /* Guarda un elemento en la capa del usuario. Si venía de fábrica, la copia
     editada pasa a sustituirlo por id sin tocar data/surgeries.js. */
  function guardarEnCatalogo(nombre, elemento) {
    var meta = catalogos[nombre];
    // "propio" lo pone la fusión para pintar, no es un dato: se quita antes
    // de mezclar, o acabaría guardado y viajando al repositorio.
    delete elemento.propio;
    var previo = meta.propios.filter(function (e) { return e.id === elemento.id; })[0];
    if (previo) Object.assign(previo, elemento);
    else meta.propios.push(elemento);
    tocarCatalogo(nombre);
    reconstruirCatalogos();
  }

  function moverEnCatalogo(nombre, id, paso) {
    var meta = catalogos[nombre];
    var lista = { tecnicas: TECNICAS, servicios: SERVICIOS,
                  intervenciones: INTERVENCIONES, perfiles: PERFILES,
                  usuarios: USUARIOS }[nombre];
    // El orden se fija por primera vez con el que se está viendo, para que
    // mover un elemento no reordene de golpe todo lo demás.
    var ids = lista.map(function (e) { return e.id; });
    var i = ids.indexOf(id);
    var j = i + paso;
    if (i === -1 || j < 0 || j >= ids.length) return false;
    ids.splice(j, 0, ids.splice(i, 1)[0]);
    meta.orden = ids;
    tocarCatalogo(nombre);
    reconstruirCatalogos();
    return true;
  }

  /* ---------------------------------------------------------------- *
   * Estado
   * ---------------------------------------------------------------- */
  /* Los MONTAJES: qué material va en qué entrada de qué caja, con sus
     técnicas, firmados por quien los hizo. El nombre "escenario" que sigue
     apareciendo en `escenarioActual()`, `casoDesdeEscenario()` y el parámetro
     `esc` de varias funciones es un alias heredado de "montaje" -así se
     llamaba antes de que existiera un catálogo de tipos de cirugía-. Ese
     catálogo (`ESCENARIOS_TIPO`) se retiró por duplicar el `diagnostico` de
     la ficha del caso; `DATA.escenarios` es otra cosa aparte, sin relación:
     los presets de fábrica que se convierten en montajes al arrancar.

     Cada montaje se guarda en su propio archivo del repositorio de datos
     (montajes/<uid>.json), igual que los casos y por el mismo motivo:
     estado.json se sube entero y sin fusión, así que dos personas guardando
     montajes a la vez se obligarían a elegir cuál de las dos versiones
     enteras se pierde. Con un archivo por montaje eso no puede pasar. */
  var montajes = {};
  var activo = null;
  var MONTAJES_KEY = "mio_ionm_montajes_v1";
  var montajesSha = {};        // uid -> sha del archivo en GitHub
  var montajesSinSubir = {};   // uid -> true mientras no haya subido
  var montajesBorrados = {};   // uid -> sha con el que hay que borrarlo allí

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function montajesPendientes() { return Object.keys(montajesSinSubir); }
  function montajesBorradosPend() { return Object.keys(montajesBorrados); }

  /* Un preset de fábrica se convierte en montaje con un uid derivado de su
     clave, no aleatorio. Es lo que evita que dos dispositivos que arrancan
     por su cuenta creen dos montajes distintos del mismo preset: los dos
     calculan "fab_tumor_it" y acaban en el mismo archivo. */
  function uidDeFabrica(clave) { return "fab_" + clave; }

  function montajeDesdePreset(clave, preset) {
    var m = clonar(preset);
    m.montaje_uid = uidDeFabrica(clave);
    // Sin autor: los de fábrica no son de nadie, así que cualquiera los edita
    m.autor_id = "";
    m.de_fabrica = true;
    m.creado_en = m.creado_en || new Date().toISOString();
    m.editado_en = m.editado_en || [];
    return m;
  }

  function cargarMontajes() {
    montajes = {}; montajesSha = {}; montajesSinSubir = {}; montajesBorrados = {};
    var g = null;
    try { g = JSON.parse(localStorage.getItem(MONTAJES_KEY) || "null"); } catch (e) { g = null; }
    if (g) {
      montajes = g.montajes || {};
      montajesSha = g.sha || {};
      montajesSinSubir = g.sin_subir || {};
      montajesBorrados = g.borrados || {};
      activo = g.activo || null;
    }
  }

  function guardarMontajes() {
    try {
      localStorage.setItem(MONTAJES_KEY, JSON.stringify({
        montajes: montajes, sha: montajesSha, sin_subir: montajesSinSubir,
        borrados: montajesBorrados, activo: activo
      }));
    } catch (e) {
      avisoGuardado(T("guardado_error", { error: e.message }), true);
    }
  }

  /* Guarda un montaje y lo deja listo para subir. Igual que los casos: en
     quirófano se queda esperando y se manda al salir del modo. */
  function guardarMontaje(m, esNuevo) {
    if (!esNuevo) m.editado_en = (m.editado_en || []).concat(new Date().toISOString());
    montajes[m.montaje_uid] = m;
    if (!MODO_DEMO) montajesSinSubir[m.montaje_uid] = true;   // en la demo no hay nada que subir
    guardarMontajes();
    programarEnvio();
    pintarEstadoSync();
  }

  function cargarEstado() {
    montajes = {};
    catalogoUsuario = [];
    etiquetasUsuario = [];
    etiquetasBorradas = [];
    reiniciarCatalogos();
    var guardado = null;
    try {
      guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      guardado = null;
    }
    if (guardado && Array.isArray(guardado.etiquetas_usuario)) {
      etiquetasUsuario = guardado.etiquetas_usuario;
    }
    if (guardado && Array.isArray(guardado.etiquetas_borradas)) {
      etiquetasBorradas = guardado.etiquetas_borradas;
    }
    if (guardado && Array.isArray(guardado.catalogo_usuario)) {
      catalogoUsuario = guardado.catalogo_usuario;
    }
    if (guardado && guardado.catalogos) aplicarCatalogosGuardados(guardado.catalogos);
    reconstruirEtiquetas();
    migrarMaterialALaEtiqueta();
    reconstruirCatalogo();
    reconstruirCatalogos();
    // Los montajes ya no viven aquí: tienen su propio almacén y su propio
    // archivo por montaje. `guardado.escenarios`/`guardado.activo` eran la
    // foto congelada de la versión anterior a esa migración (agosto 2026),
    // conservada solo como red de seguridad -nunca se leyó como dato real-.
    // Pedido del usuario (03-09-2026): retirarla del todo, ya no se lee
    // aquí. legadoEscenarios se queda siempre en null, así que el bloque de
    // sembrarMontajes() que la convertiría en montajes "mig_*" no llega a
    // ejecutarse nunca más -no hacía falta tocar esa función-. La red de
    // seguridad real sigue siendo el historial de git de
    // checklist-mio-datos, como ya decía este archivo.
  }

  // Restos de la versión en la que el escenario era el montaje. Ya no se
  // rellenan desde ningún sitio (ver el comentario de más arriba), se
  // quedan siempre en su valor inicial; se dejan declaradas porque
  // sembrarMontajes() y guardarEstado()/estadoActual() todavía las miran.
  var legadoEscenarios = null;
  var legadoBorrados = [];
  var legadoActivo = null;

  /* Deja el almacén de montajes en condiciones al arrancar:

     1. Convierte los escenarios de la versión anterior, si los hay. El uid se
        deriva de la clave ("mig_tumor_it"), nunca es aleatorio: así dos
        dispositivos que migren por su cuenta producen el mismo archivo en vez
        de dos montajes duplicados del mismo escenario.
     2. Siembra los presets de fábrica que no estén ya, con el mismo criterio.

     Nada de esto pisa un montaje existente: si ya está, se deja como está.
     Es lo que permite que la función se ejecute en cada arranque sin
     deshacer lo que el usuario haya editado después.

     Lo sembrado NO se marca para subir. Si se marcara, este dispositivo
     subiría su copia recién sembrada por encima de la que otro pudiera haber
     editado ya: bajarMontajes() respeta lo que está pendiente de subir, así
     que la copia vieja ganaría a la nueva. Sin la marca, al bajar se
     sustituye por la buena; y lo que de verdad sea nuevo aquí lo detecta
     marcarMontajesNuevos() cuando se comprueba que no existe en el
     repositorio. */
  function sembrarMontajes() {
    var nuevos = 0;

    if (legadoEscenarios) {
      Object.keys(legadoEscenarios).forEach(function (clave) {
        if (legadoBorrados.indexOf(clave) !== -1) return;
        var uid = "mig_" + clave;
        if (montajes[uid]) return;
        var m = clonar(legadoEscenarios[clave]);
        m.montaje_uid = uid;
        m.autor_id = m.autor_id || "";
        m.creado_en = new Date().toISOString();
        m.editado_en = [];
        montajes[uid] = m;
        nuevos++;
      });
      if (legadoActivo && montajes["mig_" + legadoActivo]) activo = "mig_" + legadoActivo;
    }

    Object.keys(DATA.escenarios || {}).forEach(function (clave) {
      var uid = uidDeFabrica(clave);
      // Si ya se migró ese mismo preset desde la versión anterior, no se
      // vuelve a sembrar: sería el mismo montaje dos veces.
      if (montajes[uid] || montajes["mig_" + clave]) return;
      if (legadoBorrados.indexOf(clave) !== -1) return;
      montajes[uid] = montajeDesdePreset(clave, DATA.escenarios[clave]);
      nuevos++;
    });

    if (!activo || !montajes[activo]) activo = Object.keys(montajes)[0] || null;
    if (nuevos) guardarMontajes();
    traducirEscenarios();
  }

  /* Pedido del usuario: quitar todos los montajes heredados -ni de fábrica
     ni migrados de la versión anterior a "un archivo por montaje"-, no solo
     dejar de crear más. Dos orígenes, dos marcas distintas:
       - "fab_<clave>": de DATA.escenarios (ver data/surgeries.js, vacío a
         propósito desde el 03-09-2026). Se identifican por
         "de_fabrica: true" (montajeDesdePreset()), no por el prefijo del
         uid, así vale para cualquiera que haya existido alguna vez -incluido
         un preset antiguo que ya ni sigue en el archivo, como el histórico
         "fab_tumor_it"-.
       - "mig_<clave>": de la foto congelada que traía estado.json antes de
         esa migración (ver cargarEstado()/aplicarEstado(), retirada el
         mismo día). Esos no llevan "de_fabrica", así que se identifican por
         el prefijo "mig_" del propio uid -es el único identificador que
         queda una vez que la foto que los generó ya no se lee-.
     En ambos casos, si ya existían -de este mismo dispositivo o bajados de
     otro por sincronización- siguen en `montajes` hasta que se borran de
     verdad; vaciar la fuente que los sembraba no los borra con retroactivo.
     Mismo camino que "Borrar" a mano: marca en montajesBorrados para que la
     sincronización los borre también en el repositorio. Sin efecto (no hace
     nada) en cuanto no quede ninguno. */
  function limpiarMontajesHeredados() {
    var borrado = false;
    Object.keys(montajes).forEach(function (uid) {
      if (!montajes[uid].de_fabrica && uid.indexOf("mig_") !== 0) return;
      delete montajes[uid];
      delete montajesSinSubir[uid];
      if (montajesSha[uid]) montajesBorrados[uid] = montajesSha[uid];
      delete montajesSha[uid];
      borrado = true;
    });
    if (!borrado) return;
    if (!activo || !montajes[activo]) activo = Object.keys(montajes)[0] || null;
    guardarMontajes();
    programarEnvio();
  }

  var borrados = [];

  // Copias hechas antes de que existieran las etiquetas guardaban el tipo
  // físico como texto suelto en "material". Se convierte a etiqueta: si el
  // texto coincide con una existente se reutiliza, y si no se crea una nueva
  // para no perder el recuento.
  function migrarMaterialALaEtiqueta() {
    var nuevas = false;
    catalogoUsuario.forEach(function (item) {
      if (item.etiqueta || !item.material) return;
      var et = etiquetaPorNombre(item.material);
      if (!et) {
        et = {
          id: idLibreEtiqueta(item.material),
          nombre: item.material,
          borde: "solido", color: "gris", fondo: "ninguno"
        };
        etiquetasUsuario.push(et);
        ETQ[et.id] = et;
        ETIQUETAS.push(et);
        nuevas = true;
      }
      item.etiqueta = et.id;
      delete item.material;
    });
    if (nuevas) reconstruirEtiquetas();
  }

  function guardarEstado() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        // Los montajes ya no van aquí, pero el bloque de la versión anterior
        // se conserva intacto como red de seguridad: si algo saliera mal en
        // la conversión, los escenarios originales siguen estando.
        escenarios: legadoEscenarios || {},
        activo: legadoActivo,
        borrados: borrados,
        catalogo_usuario: catalogoUsuario,
        etiquetas_usuario: etiquetasUsuario,
        etiquetas_borradas: etiquetasBorradas,
        catalogos: catalogos
      }));
      avisoGuardado(T("guardado_en", { hora: new Date().toLocaleTimeString(localeActual()) }));
      programarSubida();
    } catch (e) {
      avisoGuardado(T("guardado_error", { error: e.message }), true);
    }
  }

  function avisoGuardado(texto, esError) {
    var el = document.getElementById("guardado-aviso");
    el.textContent = texto;
    el.className = "guardado-aviso" + (esError ? " error" : "");
  }

  /* Montaje de trabajo mientras se corrige el de un caso. No es un montaje
     del repositorio: es el del caso, cargado en las cajas para poder tocarlo.
     Mientras está puesto, todo lo que lee el montaje activo -las cajas, las
     técnicas, el resumen- ve este en lugar del que estuviera abierto. */
  var montajeCaso = null;
  var casoEditandoUid = null;

  function escenarioActual() {
    if (montajeCaso) return montajeCaso;
    return montajes[activo] || null;
  }

  /* Guarda el montaje activo. Lo que se cambia en las cajas, en las técnicas
     o en el material extra es del montaje, así que va a su propio archivo y
     no tiene por qué reescribir estado.json entero.
     Si lo que se está tocando es el montaje de un caso, va al caso. */
  function guardarMontajeActivo() {
    if (montajeCaso) { guardarMontajeEnCaso(); return; }
    var m = escenarioActual();
    if (m) guardarMontaje(m);
  }

  /* Vuelca lo que hay ahora en las cajas dentro del caso que se está
     corrigiendo. Se hace en cada cambio, igual que con los montajes: no hay
     un "guardar" que se pueda olvidar, y si se cierra el navegador a media
     corrección no se pierde nada. */
  function guardarMontajeEnCaso() {
    var caso = casos[casoEditandoUid];
    if (!caso || !montajeCaso) return;
    caso.tecnicas_realizadas = (montajeCaso.tecnicas || []).slice();
    volcarMontajeEnCaso(caso, montajeCaso);
    guardarCaso(caso);
  }

  /* Carga el montaje de un caso en las cajas para poder corregirlo.
     Los casos antiguos, de antes de que se guardara el montaje en crudo, solo
     tienen la instantánea legible: se puede reconstruir a partir de ella
     porque lleva el id del ítem, pero la clave de la entrada era su rótulo,
     así que hay que traducirlo de vuelta. Lo que no cuadre se deja fuera en
     lugar de colocarlo donde no va. */
  function montajeDesdeCaso(caso) {
    var m = {
      montaje_uid: "__caso__" + caso.caso_uid,
      nombre: caso.ID_Caso || T("caso_sin_id"),
      equipo_id: equipoDe(caso),
      tecnicas: (caso.tecnicas_realizadas || []).slice(),
      asignaciones: clonar(caso.asignaciones || {}),
      extras: (caso.extras || []).slice(),
      etiquetas: clonar(caso.etiquetas_colocadas || {}),
      conmutador: clonar(caso.conmutador || {}),
      notas_montaje: caso.notas_montaje || "",
      nota_perfil_id: caso.perfil || ""
    };
    if (Object.keys(m.asignaciones).length) return m;

    // Reconstrucción de un caso anterior a este cambio
    var esperadas = 0, recuperadas = 0;
    (caso.montaje || []).forEach(function (c) {
      var entradas = entradasDe(c.caja);
      m.asignaciones[c.caja] = m.asignaciones[c.caja] || {};
      (c.entradas || []).forEach(function (e) {
        if (!e.item) return;
        esperadas++;
        var enc = entradas.filter(function (ent) {
          // String() a los dos lados: el rótulo de un canal numerado es un
          // número, y en la instantánea quedó guardado como texto. Sin esto
          // 1 === "1" da falso y no encajaba ninguna entrada numerada, que
          // son casi todas, sin que nada avisara.
          var rotulo = ent.polo ? ent.etiqueta + " " + ent.polo : ent.etiqueta;
          return String(rotulo) === String(e.entrada);
        })[0];
        if (enc) { m.asignaciones[c.caja][enc.id] = e.item; recuperadas++; }
      });
    });
    m.reconstruccion = { esperadas: esperadas, recuperadas: recuperadas };
    return m;
  }

  function abrirMontajeDeCaso(uid) {
    var caso = casos[uid];
    if (!caso) return;
    var m = montajeDesdeCaso(caso);
    // Un caso viejo puede traer entradas que ya no existen -una caja que
    // cambió de canales, un ítem retirado-. Si se dejara guardar sin avisar,
    // el primer cambio reescribiría el montaje del caso con menos material
    // del que tenía y nadie se enteraría.
    var rec = m.reconstruccion;
    if (rec && rec.recuperadas < rec.esperadas) {
      if (!confirm(T("caso_reconstruccion_parcial", {
        recuperadas: rec.recuperadas, esperadas: rec.esperadas
      }))) return;
    }
    delete m.reconstruccion;
    // Fase 7: antes <main> siempre estaba a la vista; ahora es una pantalla
    // más y hay que navegar a ella explícitamente, si no el usuario se queda
    // mirando Gestión de Casos mientras todo esto se repinta invisible detrás.
    irAPantalla("organizador");
    casoEditandoUid = uid;
    montajeCaso = m;
    document.body.classList.add("editando-caso");
    renderTodo();
    // Las cajas son lo que se viene a tocar: se deja a la vista directamente
    var cajas = document.getElementById("cajas-contenido");
    if (cajas) cajas.scrollIntoView({ block: "start" });
  }

  function cerrarMontajeDeCaso(volverAlCaso) {
    var uid = casoEditandoUid;
    montajeCaso = null;
    casoEditandoUid = null;
    document.body.classList.remove("editando-caso");
    renderTodo();
    if (volverAlCaso && uid && casos[uid]) abrirCaso(uid);
  }

  // Material extra del escenario (no ocupa entrada de ninguna caja)
  function extrasDe() {
    var esc = escenarioActual();
    if (!esc) return [];
    if (!esc.extras) esc.extras = [];
    return esc.extras;
  }

  function alternarExtra(itemId) {
    var arr = extrasDe();
    var i = arr.indexOf(itemId);
    if (i === -1) arr.push(itemId); else arr.splice(i, 1);
    guardarMontajeActivo();
    renderCatalogo();
    renderResumen();
  }

  // Técnicas marcadas en el escenario
  function tecnicasDe() {
    var esc = escenarioActual();
    if (!esc) return [];
    if (!esc.tecnicas) esc.tecnicas = [];
    return esc.tecnicas;
  }

  function alternarTecnica(id) {
    var arr = tecnicasDe();
    var i = arr.indexOf(id);
    if (i === -1) arr.push(id); else arr.splice(i, 1);
    guardarMontajeActivo();
    renderTecnicas();
    renderResumen();
  }

  /* Etiqueta elegida para UNA colocación concreta. Vive en el escenario,
     igual que el conmutador, así que el mismo A1 puede ir con sacacorchos
     en una cirugía y con aguja en otra sin duplicarlo en el catálogo. */
  function claveEntrada(cajaKey, entradaId) {
    return cajaKey + "/" + entradaId;
  }

  function etiquetaColocada(cajaKey, entradaId) {
    var esc = escenarioActual();
    if (!esc || !esc.etiquetas) return null;
    return esc.etiquetas[claveEntrada(cajaKey, entradaId)] || null;
  }

  function fijarEtiquetaColocada(cajaKey, entradaId, etiquetaId, itemId) {
    var esc = escenarioActual();
    if (!esc) return;
    if (!esc.etiquetas) esc.etiquetas = {};
    var clave = claveEntrada(cajaKey, entradaId);
    var item = ITEMS[itemId];
    // Si vuelve a la etiqueta propia del ítem no hace falta guardar nada
    if (item && item.etiqueta === etiquetaId) delete esc.etiquetas[clave];
    else esc.etiquetas[clave] = etiquetaId;
  }

  function olvidarEtiquetaColocada(cajaKey, entradaId) {
    var esc = escenarioActual();
    if (esc && esc.etiquetas) delete esc.etiquetas[claveEntrada(cajaKey, entradaId)];
  }

  /* Enlace de un Puente a su cork de referencia (pedido el 22-09-2026): un
     Puente puentea un electrodo que hace de referencia, y el resto de
     Puentes se enlazan a esa misma referencia -mismo concepto que un grafo
     de nodos, pero esta app no dibuja líneas entre cajas, así que el
     enlace se muestra como una pequeña etiqueta de texto "→ C3" en el
     propio chip-. Vive en el escenario, igual que etiquetas/conmutador:
     "esc.puentes" es un mapa clave de la entrada del Puente -> clave de la
     entrada de destino, ambas con el mismo formato que claveEntrada(). */
  function enlacePuente(cajaKey, entradaId) {
    var esc = escenarioActual();
    if (!esc || !esc.puentes) return null;
    return esc.puentes[claveEntrada(cajaKey, entradaId)] || null;
  }

  function fijarEnlacePuente(cajaKey, entradaId, claveDestino) {
    var esc = escenarioActual();
    if (!esc) return;
    if (!esc.puentes) esc.puentes = {};
    esc.puentes[claveEntrada(cajaKey, entradaId)] = claveDestino;
  }

  function olvidarEnlacePuente(cajaKey, entradaId) {
    var esc = escenarioActual();
    if (esc && esc.puentes) delete esc.puentes[claveEntrada(cajaKey, entradaId)];
  }

  function asignacionesDe(cajaKey) {
    var esc = escenarioActual();
    if (!esc) return {};
    if (!esc.asignaciones) esc.asignaciones = {};
    if (!esc.asignaciones[cajaKey]) esc.asignaciones[cajaKey] = {};
    return esc.asignaciones[cajaKey];
  }

  /* ---------------------------------------------------------------- *
   * Definición de entradas de una caja
   * ---------------------------------------------------------------- */
  function infoCaja(key) {
    var info = CAJAS_TODAS[key] || { nombre: key, descripcion: "" };
    return {
      nombre: campo(info, "nombre") || key,
      descripcion: campo(info, "descripcion"),
      canales: info.canales || 8,
      conector: info.conector || "par",
      inicio: info.numeracion_inicio || 1,
      especiales: info.especiales || [],
      rotulo: info.rotulo || "",
      color_conector: info.color_conector || "",
      grupos: info.grupos || null,
      puertos: info.puertos || null,
      rejilla: info.rejilla || 0,
      plegable: !!info.plegable
    };
  }

  // Devuelve todas las entradas de una caja como lista plana de descriptores
  function entradasDe(key) {
    var info = infoCaja(key);
    var out = [];
    var i, n;
    // "grupos" (25-09-2026, módulo cortical de Cadwell): una misma caja física
    // con dos bloques de canales distintos -estímulo H1-H9 y registro E1-E13-.
    // Cada grupo trae su número de canales, su rótulo y su id ("h{n}" para que
    // no choquen entre sí). Solo admite canales "par" o sueltos.
    if (info.grupos) {
      info.grupos.forEach(function (g, gi) {
        for (var k = 0; k < (g.canales || 0); k++) {
          var m = (g.inicio || 1) + k;
          out.push({
            id: g.id ? g.id.replace(/\{n\}/g, m) : String(m),
            etiqueta: g.rotulo ? g.rotulo.replace(/\{n\}/g, m) : m,
            conector: g.conector === "par" ? "par" : (g.color_conector || "individual"),
            grupo: gi
          });
        }
      });
    }
    for (i = 0; i < (info.grupos ? 0 : info.canales); i++) {
      n = info.inicio + i;
      // "rotulo" (25-09-2026, cajas de Cadwell): el texto del canal, p. ej.
      // "E{n}" o "{n}A/{n}R". El id sigue siendo el número, así que las cajas
      // de siempre (sin rótulo) no cambian nada de lo guardado.
      var rot = info.rotulo ? info.rotulo.replace(/\{n\}/g, n) : n;
      if (info.conector === "anodal_catodal") {
        out.push({ id: n + ":anodal", etiqueta: rot, polo: "anodal", conector: "rojo" });
        out.push({ id: n + ":catodal", etiqueta: rot, polo: "catodal", conector: "negro" });
      } else if (info.conector === "par") {
        out.push({ id: String(n), etiqueta: rot, conector: "par" });
      } else {
        out.push({ id: String(n), etiqueta: rot, conector: info.color_conector || "individual" });
      }
    }
    info.especiales.forEach(function (esp) {
      // "polos" (25-09-2026, puertos de sonda del LCSwap): el puerto se parte en
      // dos entradas, − (cátodo) y + (ánodo), para poner la sonda en una y su
      // referencia en la otra según sea estimulación cortical o subcortical.
      if (esp.polos) {
        [["menos", "−", "negro"], ["mas", "+", "rojo"]].forEach(function (p) {
          out.push({
            id: esp.clave + ":" + p[0],
            etiqueta: campo(esp, "nombre"),
            polo: p[1],
            conector: p[2],
            nota: campo(esp, "nota"),
            recuadro: !!esp.recuadro,
            recuadroClave: esp.clave,
            recuadroNombre: campo(esp, "nombre"),
            alto: esp.alto || 1,
            especial: true
          });
        });
        return;
      }
      out.push({
        id: esp.clave,
        etiqueta: campo(esp, "nombre"),
        conector: esp.conector === "par" ? "par" : (esp.color || "individual"),
        nota: campo(esp, "nota"),
        recuadro: !!esp.recuadro,
        alto: esp.alto || 1,
        especial: true
      });
    });
    return out;
  }

  // El descriptor de una entrada concreta -lo que ya da entradasDe(), pero
  // buscado por id-, para poder mostrar su etiqueta de canal (p. ej. "C3")
  // en la etiqueta de enlace de un Puente.
  function entradaPorId(cajaKey, entradaId) {
    var lista = entradasDe(cajaKey);
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === entradaId) return lista[i];
    }
    return null;
  }

  /* ---------------------------------------------------------------- *
   * Selección por clic (alternativa a arrastrar)
   * ---------------------------------------------------------------- */
  var seleccionado = null;
  // Enlace de un Puente en curso: { cajaKey, entradaId } del Puente que
  // espera a que se toque su cork de referencia, o null si no hay ninguno
  // en marcha. Mismo espíritu que "seleccionado", pero para el segundo
  // toque de un enlace en vez de para colocar material -ver crearChip()/
  // crearSlot() e iniciarEnlacePuente()/completarEnlacePuente() más abajo-.
  var enlazandoPuente = null;

  /* Plegar y desplegar el catálogo conservando por dónde ibas.
     El contenedor con scroll es el panel entero, y al plegarlo
     #catalogo-contenido pasa a display:none: el navegador fuerza entonces
     scrollTop a 0, así que al desplegarlo otra vez el catálogo aparecía por
     el principio. En móvil eso pasa en cada colocación -seleccionar pliega,
     colocar despliega-, y obligaba a volver a bajar hasta el músculo que
     estabas usando cada vez.
     Panel-catalogo pasó de <div>+clase "plegado" a <details> nativo el
     06-09-2026 (tarde) -mismo comportamiento que el resto de tarjetas al
     desplegarse en móvil-, así que ahora es .open lo que hay que tocar. */
  var scrollCatalogo = 0;
  // Móvil (27-09-2026, pedido del usuario): el catálogo ya no tiene scroll
  // propio ahí -un deslizamiento largo se paraba en seco al llegar al final
  // de la lista, sin seguir con la página-, así que "por donde ibas" se
  // guarda de otra forma: el material elegido es el ancla. Al plegar, la
  // página sube a las cajas; al desplegar tras colocar, vuelve a ese
  // material del catálogo.
  var anclaCatalogo = null;

  function catalogoConScrollPropio() {
    return !window.matchMedia("(max-width: 900px)").matches;
  }

  // Lo que tapan arriba la cabecera y el rótulo fijos, para no dejar lo que
  // se quiere enseñar debajo de ellos.
  function altoBarrasFijas() {
    var tapa = 0;
    document.querySelectorAll(".barra-sup, #barra-caso").forEach(function (el) {
      if (el.getClientRects().length) tapa = Math.max(tapa, el.getBoundingClientRect().bottom);
    });
    return tapa;
  }

  function plegarCatalogo(plegar) {
    var panel = document.getElementById("panel-catalogo");
    if (plegar === !panel.open) return;
    if (catalogoConScrollPropio()) {
      if (plegar) scrollCatalogo = panel.scrollTop;
      panel.open = !plegar;
      if (!plegar) panel.scrollTop = scrollCatalogo;
      return;
    }
    if (plegar) {
      anclaCatalogo = seleccionado;
      panel.open = false;
      var cajas = document.getElementById("cajas");
      // Si la tarjeta Cajas estaba plegada, no habría dónde colocarlo
      if (cajas && !cajas.open) cajas.open = true;
      if (cajas) window.scrollTo(0, cajas.getBoundingClientRect().top + window.pageYOffset - altoBarrasFijas() - 8);
      return;
    }
    panel.open = true;
    var chip = anclaCatalogo && document.querySelector('#catalogo-contenido .chip[data-item-id="' + anclaCatalogo + '"]');
    if (chip && chip.getClientRects().length) chip.scrollIntoView({ block: "center" });
  }

  function seleccionar(itemId) {
    seleccionado = itemId;
    var barra = document.getElementById("barra-seleccion");
    if (itemId && ITEMS[itemId]) {
      // Elegir material y enlazar un Puente son dos modos de "toca la
      // siguiente entrada" que no pueden convivir a la vez, o el segundo
      // toque sería ambiguo -¿coloca el material o completa el enlace?-.
      cancelarEnlacePuente();
      document.getElementById("bs-nombre").textContent = campo(ITEMS[itemId], "nombre");
      barra.hidden = false;
      document.body.classList.add("hay-seleccion");
    } else {
      seleccionado = null;
      barra.hidden = true;
      document.body.classList.remove("hay-seleccion");
    }
    document.querySelectorAll(".chip.seleccionado").forEach(function (c) {
      c.classList.remove("seleccionado");
    });
    if (seleccionado) {
      document.querySelectorAll('#catalogo-contenido .chip[data-item-id="' + seleccionado + '"]')
        .forEach(function (c) { c.classList.add("seleccionado"); });
      // En móvil el catálogo ocupa media pantalla: se pliega para dejar ver las cajas
      if (window.matchMedia("(max-width: 900px)").matches) plegarCatalogo(true);
    }
  }

  function colocar(cajaKey, entradaId, itemId) {
    asignacionesDe(cajaKey)[entradaId] = itemId;
    // La etiqueta que hubiera elegida era del material anterior
    olvidarEtiquetaColocada(cajaKey, entradaId);
    // Y el enlace también, si lo había: el material nuevo puede ni
    // siquiera ser un Puente.
    olvidarEnlacePuente(cajaKey, entradaId);
    guardarMontajeActivo();
    renderCajas();
    renderResumen();
    // Un ítem colocado no puede estar también en otra entrada: se
    // deselecciona solo en vez de quedarse listo para colocarlo otra vez.
    seleccionar(null);
    // En móvil, seleccionar() plegó el catálogo para dejar ver las cajas;
    // al terminar esta colocación se vuelve a desplegar solo, por donde
    // ibas, para elegir el siguiente ítem sin tener que buscarlo otra vez.
    if (window.matchMedia("(max-width: 900px)").matches) plegarCatalogo(false);
  }

  /* ---------------------------------------------------------------- *
   * Enlazar un Puente a su cork de referencia
   *
   * El resto de la app usa "seleccionar() + toca una entrada" para colocar
   * material; esto es el mismo patrón de dos toques pero para enlazar dos
   * entradas YA colocadas entre sí, así que necesita su propio estado
   * (enlazandoPuente) y su propia barra fija -mismo aspecto que
   * "barra-seleccion", contenido distinto-.
   * ---------------------------------------------------------------- */
  function pintarBarraEnlacePuente() {
    document.getElementById("barra-enlace-puente").hidden = !enlazandoPuente;
  }

  function cancelarEnlacePuente() {
    if (!enlazandoPuente) return;
    enlazandoPuente = null;
    pintarBarraEnlacePuente();
    renderCajas();
  }

  function iniciarEnlacePuente(cajaKey, entradaId) {
    // Elegir material y enlazar no pueden convivir -mismo motivo que al
    // revés en seleccionar()-.
    seleccionar(null);
    var mismo = enlazandoPuente && enlazandoPuente.cajaKey === cajaKey && enlazandoPuente.entradaId === entradaId;
    // Tocar el 🔗 del mismo Puente otra vez cancela, igual que volver a
    // tocar un chip ya seleccionado del catálogo.
    enlazandoPuente = mismo ? null : { cajaKey: cajaKey, entradaId: entradaId };
    pintarBarraEnlacePuente();
    renderCajas();
  }

  function completarEnlacePuente(cajaKey, entradaId) {
    var origen = enlazandoPuente;
    enlazandoPuente = null;
    pintarBarraEnlacePuente();
    if (!origen) return;
    // No tiene sentido enlazar el Puente consigo mismo, ni con una entrada
    // vacía -el enlace señala a un cork ya colocado, no a un hueco-. En
    // los dos casos se cancela en silencio, igual que tocar fuera de las
    // entradas mientras se coloca material tampoco hace nada.
    var mismaEntrada = origen.cajaKey === cajaKey && origen.entradaId === entradaId;
    var destinoOcupado = !!asignacionesDe(cajaKey)[entradaId];
    if (mismaEntrada || !destinoOcupado) { renderCajas(); return; }
    fijarEnlacePuente(origen.cajaKey, origen.entradaId, claveEntrada(cajaKey, entradaId));
    guardarMontajeActivo();
    renderCajas();
    renderResumen();
  }

  /* ---------------------------------------------------------------- *
   * Chips
   * ---------------------------------------------------------------- */
  function crearChip(item, opciones) {
    opciones = opciones || {};
    var chip = document.createElement("span");
    chip.className = "chip" + (opciones.colocado ? " chip-colocado" : "");
    chip.draggable = true;
    chip.dataset.itemId = item.id;
    if (opciones.cajaKey) chip.dataset.origenCaja = opciones.cajaKey;
    if (opciones.entradaId) chip.dataset.origenEntrada = opciones.entradaId;

    // Aspecto según el tipo físico (etiqueta), con el override de la
    // colocación si lo hay: borde, color de borde y tinte de fondo.
    var override = opciones.colocado
      ? etiquetaColocada(opciones.cajaKey, opciones.entradaId) : null;
    var etiqueta = etiquetaDe(item, override);
    aplicarEstilo(chip, estiloDe(item, override));

    var rotulo = etiqueta ? campo(etiqueta, "nombre") : T("chip_sin_etiqueta");
    var nota = campo(item, "nota");
    chip.title = (nota ? nota + "\n" : "") + T("chip_tipo", { tipo: rotulo });

    if (item.color) {
      var dot = document.createElement("span");
      dot.className = "color-dot color-" + item.color;
      chip.appendChild(dot);
    }
    chip.appendChild(document.createTextNode(campo(item, "nombre")));

    // Foto de referencia (de momento solo algunas sondas): un icono que
    // abre la imagen en un visor propio, para identificar la sonda física
    // sin salir de la herramienta. Vale en cualquier sitio donde salga el
    // chip -catálogo, selector y ya colocado-, no solo en el catálogo como
    // el lápiz de editar: es justo cuando está colocada, canal a canal,
    // cuando más falta hace comprobar cuál es cuál.
    if (item.foto) {
      var foto = document.createElement("button");
      foto.type = "button";
      foto.className = "chip-foto";
      foto.textContent = "📷";
      foto.title = T("chip_foto_tit");
      foto.addEventListener("click", function (e) {
        e.stopPropagation();
        abrirFotoSonda(item.foto, campo(item, "nombre"));
      });
      chip.appendChild(foto);
    }

    // Material propio: lápiz para editarlo (solo en el catálogo). En el
    // selector que se abre desde una entrada no sale: allí has ido a elegir
    // material, y abrir el editor encima del propio selector desorienta.
    if (item.propio && !opciones.colocado && !opciones.alElegir) {
      chip.classList.add("chip-propio");
      var lapiz = document.createElement("button");
      lapiz.type = "button";
      lapiz.className = "chip-editar";
      lapiz.textContent = "✎";
      lapiz.title = T("chip_editar_tit");
      lapiz.addEventListener("click", function (e) {
        e.stopPropagation();
        abrirEditorMaterial(item.id);
      });
      chip.appendChild(lapiz);
    }

    if (item.sin_entrada) {
      // No se arrastra ni se coloca: se activa o desactiva para el escenario
      chip.draggable = false;
      chip.classList.add("chip-extra");
      if (extrasDe().indexOf(item.id) !== -1) chip.classList.add("activo");
      chip.addEventListener("click", function () { alternarExtra(item.id); });
      return chip;
    }

    if (!opciones.colocado) {
      // Chip del catálogo: al pulsarlo queda seleccionado para colocar. En el
      // selector abierto desde una entrada el destino ya se sabe, así que el
      // chip coloca directamente en vez de dejar nada seleccionado.
      chip.addEventListener("click", function () {
        if (opciones.alElegir) { opciones.alElegir(item.id); return; }
        seleccionar(seleccionado === item.id ? null : item.id);
      });
    }

    if (opciones.colocado) {
      // Enlace de un Puente a su cork de referencia (22-09-2026): solo en
      // los ítems "puente" -es un concepto suyo, no de cualquier material-.
      // Se muestra como una etiqueta de texto ("→ C3") porque esta app no
      // tiene un lienzo con líneas entre cajas; el destino puede estar en
      // cualquier caja del montaje, así que se busca su nombre resolviendo
      // entradaPorId() sobre la caja guardada en el enlace, no sobre la
      // caja de este chip.
      if (item.id === "puente") {
        var claveDestino = enlacePuente(opciones.cajaKey, opciones.entradaId);
        if (claveDestino) {
          var partes = claveDestino.split("/");
          var cajaDestino = partes[0], entradaDestino = partes.slice(1).join("/");
          var ocupaDestino = !!asignacionesDe(cajaDestino)[entradaDestino];
          var entradaDestinoInfo = entradaPorId(cajaDestino, entradaDestino);
          // Limpieza perezosa: si el cork de destino ya no está colocado
          // -se quitó o se cambió por otra cosa sin pasar por aquí-, el
          // enlace ha quedado huérfano y no tiene sentido seguir
          // mostrándolo. Se olvida solo, en vez de dejar una etiqueta que
          // apunta a un hueco vacío.
          if (!ocupaDestino || !entradaDestinoInfo) {
            olvidarEnlacePuente(opciones.cajaKey, opciones.entradaId);
          } else {
            var etiquetaEnlace = document.createElement("span");
            etiquetaEnlace.className = "chip-enlace-etiqueta";
            etiquetaEnlace.textContent = T("puente_enlace_etiqueta", { canal: entradaDestinoInfo.etiqueta });
            etiquetaEnlace.title = T("puente_enlace_tit", {
              canal: entradaDestinoInfo.etiqueta, caja: infoCaja(cajaDestino).nombre
            });
            chip.appendChild(etiquetaEnlace);
          }
        }

        var enlazar = document.createElement("button");
        enlazar.type = "button";
        enlazar.className = "chip-enlazar";
        enlazar.textContent = "🔗";
        enlazar.title = T("chip_enlazar_tit");
        if (enlazandoPuente && enlazandoPuente.cajaKey === opciones.cajaKey &&
            enlazandoPuente.entradaId === opciones.entradaId) {
          chip.classList.add("chip-enlazando");
        }
        enlazar.addEventListener("click", function (e) {
          e.stopPropagation();
          iniciarEnlacePuente(opciones.cajaKey, opciones.entradaId);
        });
        chip.appendChild(enlazar);
      }

      // Ya no se puede cambiar el tipo físico por colocación desde aquí
      // -no queda sitio en la caja, y el usuario prefiere el tipo fijo del
      // catálogo-. etiquetaColocada()/fijarEtiquetaColocada() se quedan para
      // seguir leyendo overrides de escenarios guardados antes de este
      // cambio, pero nada vuelve a escribir uno nuevo.
      var quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "chip-quitar";
      quitar.textContent = "✕";
      quitar.title = T("chip_quitar_tit");
      quitar.addEventListener("click", function (e) {
        e.stopPropagation();
        delete asignacionesDe(opciones.cajaKey)[opciones.entradaId];
        olvidarEtiquetaColocada(opciones.cajaKey, opciones.entradaId);
        olvidarEnlacePuente(opciones.cajaKey, opciones.entradaId);
        guardarMontajeActivo();
        renderCajas();
        renderResumen();
      });
      chip.appendChild(quitar);
    }

    return chip;
  }

  /* Visor de fotos de material -de momento solo algunas sondas-. Un único
     <dialog> reutilizado por todos los chips: no hace falta uno por ítem,
     con cambiar la imagen y el título antes de abrirlo vale. */
  var dlgFotoSonda = document.getElementById("dlg-foto-sonda");
  function abrirFotoSonda(url, nombre) {
    document.getElementById("foto-sonda-img").src = url;
    document.getElementById("foto-sonda-img").alt = nombre;
    document.getElementById("foto-sonda-nombre").textContent = nombre;
    dlgFotoSonda.showModal();
  }
  document.getElementById("foto-sonda-cerrar").addEventListener("click", function () {
    dlgFotoSonda.close();
  });

  /* Redimensiona y recomprime una imagen a JPEG en el propio navegador
     antes de guardarla en un caso -esas imágenes viajan dentro del JSON del
     caso, en base64, a GitHub en cada sincronización, y no hay backend que
     las sirva aparte-. Sin este paso, una foto de móvil de varios MB
     multiplicaría el peso de cada sincronización del caso. maxLado limita
     el lado mayor en píxeles; calidad es la calidad JPEG (0-1). */
  function comprimirImagen(file, maxLado, calidad) {
    return new Promise(function (resolve, reject) {
      var lector = new FileReader();
      lector.onerror = function () { reject(lector.error || new Error("lectura fallida")); };
      lector.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("imagen no válida")); };
        img.onload = function () {
          var escala = Math.min(1, maxLado / Math.max(img.width, img.height));
          var cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(img.width * escala));
          cv.height = Math.max(1, Math.round(img.height * escala));
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL("image/jpeg", calidad));
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(file);
    });
  }

  /* Botón compacto "📷" que abre la cámara del móvil directamente
     -"capture" salta el selector de archivos y va derecho a hacer la foto-,
     como alternativa junto al selector de galería normal de cada sitio con
     fotos (pedido el 23-09-2026: "sacar foto desde la propia herramienta").
     onArchivos(files) recibe el FileList tal cual, igual que el "change"
     del input de galería -mismo contrato, para reutilizar el mismo
     procesado (comprimirImagen + guardar) en los dos-. Devuelve el botón y
     el <input> oculto que hay que colgar en el DOM junto al resto. */
  function crearBotonCamara(onArchivos) {
    var entrada = document.createElement("input");
    entrada.type = "file";
    entrada.accept = "image/*";
    entrada.capture = "environment";
    entrada.hidden = true;
    entrada.addEventListener("change", function () {
      onArchivos(entrada.files);
      entrada.value = "";
    });
    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-camara";
    boton.textContent = "📷";
    boton.title = T("foto_camara_tit");
    boton.addEventListener("click", function () { entrada.click(); });
    return { boton: boton, entrada: entrada };
  }

  /* ---------------------------------------------------------------- *
   * Fotos en IndexedDB (23-09-2026)
   *
   * Las dataURL de las fotos -Imágenes del montaje, Pruebas de imagen,
   * Planificación del caso, Mis apuntes- dejaban de caber en localStorage
   * según crecía el uso real: 5-10 MB de margen según el móvil, ya
   * agotado más de una vez con casos reales (ver CLAUDE.md, 22 y
   * 23-09-2026). IndexedDB no tiene ese techo -cientos de MB en un móvil
   * normal-, así que las fotos pasan a vivir ahí; localStorage se queda
   * solo con el resto del caso/documento, ligero de por sí.
   *
   * El objeto en memoria (casos[uid], apunteDoc, checklist...) sigue
   * teniendo siempre el dataUrl de cada foto en cuanto está "hidratado"
   * -lo necesita para pintar la miniatura y para subir el caso entero a
   * GitHub, que no cambia de formato: la foto sigue viajando embebida en
   * el JSON remoto, solo cambia dónde vive en ESTE dispositivo-. Se
   * separa al escribir en localStorage (quitarDataUrls + guardarFotosIDB)
   * y se vuelve a unir al leer de ahí (hidratarFotosIDB), en segundo
   * plano, sin bloquear el arranque de la app -las miniaturas y la subida
   * son lo único que necesita el dataUrl, y ninguna de las dos pasa en
   * el primer instante-.
   * ---------------------------------------------------------------- */
  var FOTOS_DB_NOMBRE = MODO_DEMO ? "mio_ionm_fotos_demo" : "mio_ionm_fotos";
  var FOTOS_DB_ALMACEN = "fotos";
  var fotosDBPromesa = null;

  function abrirFotosDB() {
    if (!window.indexedDB) return Promise.reject(new Error("sin IndexedDB"));
    if (fotosDBPromesa) return fotosDBPromesa;
    fotosDBPromesa = new Promise(function (resolve, reject) {
      var req = indexedDB.open(FOTOS_DB_NOMBRE, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(FOTOS_DB_ALMACEN); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error("no se pudo abrir IndexedDB")); };
    });
    return fotosDBPromesa;
  }

  // Qué fotos ya están en IndexedDB en esta sesión, con la longitud de su
  // dataUrl como firma (auditoría 28-09-2026, T2): cada guardado de un caso
  // volvía a escribir TODAS sus fotos, y el Registro guarda cada ~1,2 s
  // durante la cirugía. Una foto con el mismo id no cambia de contenido
  // (se reemplaza con otro id), así que basta con no repetirla.
  var fotosYaEnIDB = {};
  function guardarFotoIDB(clave, dataUrl) {
    if (fotosYaEnIDB[clave] === String(dataUrl).length) return Promise.resolve();
    return abrirFotosDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(FOTOS_DB_ALMACEN, "readwrite");
        tx.objectStore(FOTOS_DB_ALMACEN).put(dataUrl, clave);
        tx.oncomplete = function () { fotosYaEnIDB[clave] = String(dataUrl).length; resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function leerFotoIDB(clave) {
    return abrirFotosDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(FOTOS_DB_ALMACEN, "readonly");
        var req = tx.objectStore(FOTOS_DB_ALMACEN).get(clave);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function borrarFotoIDB(clave) {
    delete fotosYaEnIDB[clave];
    return abrirFotosDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(FOTOS_DB_ALMACEN, "readwrite");
        tx.objectStore(FOTOS_DB_ALMACEN).delete(clave);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  // listaImgs: array de objetos con una dataURL en el campo "campoUrl"
  // ("dataUrl" para imágenes de caso/checklist, "datos" para las de
  // apuntes) y un "id" que la identifica de forma estable. prefijo evita
  // que choquen claves entre casos/checklist/apuntes.
  function guardarFotosIDB(prefijo, listaImgs, campoUrl) {
    return Promise.all((listaImgs || []).map(function (im) {
      if (!im || !im.id || !im[campoUrl]) return Promise.resolve();
      return guardarFotoIDB(prefijo + ":" + im.id, im[campoUrl]).catch(function () { /* mejor esfuerzo */ });
    }));
  }

  // Sin IndexedDB (modo privado de algún navegador...) no se separa nada:
  // la foto se queda incrustada en localStorage como antes, mejor eso que
  // perderla en local por dejarla sin sitio donde guardarse.
  function quitarDataUrls(listaImgs, campoUrl) {
    var separar = !!window.indexedDB;
    return (listaImgs || []).map(function (im) {
      var copia = Object.assign({}, im);
      if (separar) delete copia[campoUrl];
      return copia;
    });
  }

  // Rellena in situ (misma referencia de objetos del array) el campo que
  // falte, leyendo de IndexedDB. La promesa que devuelve se resuelve
  // cuando todas las fotos de esa lista están listas -subirCaso()/
  // subirApunteDoc() la esperan antes de construir lo que suben, para no
  // mandar a GitHub un caso con las fotos a medio recuperar-.
  function hidratarFotosIDB(prefijo, listaImgs, campoUrl) {
    return Promise.all((listaImgs || []).map(function (im) {
      if (!im || !im.id || im[campoUrl]) return Promise.resolve();
      return leerFotoIDB(prefijo + ":" + im.id).then(function (dataUrl) {
        if (dataUrl) {
          im[campoUrl] = dataUrl;
          fotosYaEnIDB[prefijo + ":" + im.id] = String(dataUrl).length;
        }
      }).catch(function () { /* no se pudo leer, la miniatura sale vacía */ });
    }));
  }

  /* ---------------------------------------------------------------- *
   * Drag & drop (delegado en document)
   * ---------------------------------------------------------------- */
  var arrastrando = null;

  document.addEventListener("dragstart", function (e) {
    var chip = e.target.closest && e.target.closest(".chip");
    if (!chip) return;
    arrastrando = {
      itemId: chip.dataset.itemId,
      origenCaja: chip.dataset.origenCaja || null,
      origenEntrada: chip.dataset.origenEntrada || null
    };
    chip.classList.add("arrastrando");
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("text/plain", chip.dataset.itemId);
  });

  document.addEventListener("dragend", function (e) {
    pararAutoScroll();
    var chip = e.target.closest && e.target.closest(".chip");
    if (chip) chip.classList.remove("arrastrando");
    document.querySelectorAll(".sobre").forEach(function (el) {
      el.classList.remove("sobre");
    });
    arrastrando = null;
  });

  // Auto-scroll al arrastrar cerca del borde superior/inferior de la ventana
  var autoScroll = null;
  function pararAutoScroll() {
    if (autoScroll) { clearInterval(autoScroll); autoScroll = null; }
  }
  function evaluarAutoScroll(y) {
    var margen = 90;
    var dir = 0;
    if (y < margen) dir = -1;
    else if (y > window.innerHeight - margen) dir = 1;
    pararAutoScroll();
    if (dir) {
      autoScroll = setInterval(function () { window.scrollBy(0, dir * 22); }, 16);
    }
  }

  document.addEventListener("dragover", function (e) {
    evaluarAutoScroll(e.clientY);
    var slot = e.target.closest && e.target.closest(".slot");
    if (slot) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      slot.classList.add("sobre");
      return;
    }
    // Soltar sobre el catálogo = quitar de la caja
    var cat = e.target.closest && e.target.closest(".panel-catalogo");
    if (cat && arrastrando && arrastrando.origenCaja) {
      e.preventDefault();
      cat.classList.add("sobre");
    }
  });

  document.addEventListener("dragleave", function (e) {
    var el = e.target.closest && e.target.closest(".slot, .panel-catalogo");
    if (el) el.classList.remove("sobre");
  });

  document.addEventListener("drop", function (e) {
    pararAutoScroll();
    if (!arrastrando) return;

    var slot = e.target.closest && e.target.closest(".slot");
    if (slot) {
      e.preventDefault();
      slot.classList.remove("sobre");
      var destinoCaja = slot.dataset.caja;
      var destinoEntrada = slot.dataset.entrada;

      // Mover dentro/entre cajas: liberar el origen y llevarse su etiqueta
      var etiquetaViajera = null;
      if (arrastrando.origenCaja) {
        etiquetaViajera = etiquetaColocada(arrastrando.origenCaja, arrastrando.origenEntrada);
        delete asignacionesDe(arrastrando.origenCaja)[arrastrando.origenEntrada];
        olvidarEtiquetaColocada(arrastrando.origenCaja, arrastrando.origenEntrada);
      }
      asignacionesDe(destinoCaja)[destinoEntrada] = arrastrando.itemId;
      olvidarEtiquetaColocada(destinoCaja, destinoEntrada);
      if (etiquetaViajera) {
        fijarEtiquetaColocada(destinoCaja, destinoEntrada, etiquetaViajera, arrastrando.itemId);
      }
      guardarMontajeActivo();
      renderCajas();
      renderResumen();
      return;
    }

    var cat = e.target.closest && e.target.closest(".panel-catalogo");
    if (cat && arrastrando.origenCaja) {
      e.preventDefault();
      cat.classList.remove("sobre");
      delete asignacionesDe(arrastrando.origenCaja)[arrastrando.origenEntrada];
      olvidarEtiquetaColocada(arrastrando.origenCaja, arrastrando.origenEntrada);
      guardarMontajeActivo();
      renderCajas();
      renderResumen();
    }
  });

  /* ---------------------------------------------------------------- *
   * Render: catálogo maestro
   * ---------------------------------------------------------------- */
  /* Pinta el catálogo agrupado por categorías dentro del contenedor que se
     le pase. Lo usan el panel lateral de siempre y el selector que se abre
     desde una entrada de caja; lo único que cambia entre los dos es qué hace
     un chip al pulsarlo y si se ofrece el material que no ocupa entrada. */
  /* Qué categorías del catálogo quedan desplegadas. Se recuerda por nombre y
     no por índice: así añadir o reordenar categorías no cambia cuáles estaban
     abiertas. Cada categoría trae su propio por-defecto (campo
     "plegada_por_defecto" en data/surgeries.js): las de uso habitual nacen
     abiertas, el resto plegado -con 22 categorías, desplazarse por todas para
     llegar a la que casi no se usa es peor que un toque de más-. Por eso
     recordarCategoria() guarda siempre 0/1 explícito (nunca borra la clave):
     si se borrara al cerrar, una categoría que nace abierta volvería a
     abrirse sola en la siguiente visita en vez de quedarse cerrada como
     decidió el usuario. */
  var CATS_KEY = "mio_ionm_cats_abiertas_v1";
  var catsAbiertas = null;

  function cargarCategorias() {
    if (catsAbiertas) return catsAbiertas;
    try {
      catsAbiertas = JSON.parse(localStorage.getItem(CATS_KEY) || "{}") || {};
    } catch (e) { catsAbiertas = {}; }
    return catsAbiertas;
  }

  function categoriaAbierta(nombre, porDefecto) {
    var g = cargarCategorias();
    if (Object.prototype.hasOwnProperty.call(g, nombre)) return !!g[nombre];
    return !!porDefecto;
  }

  function recordarCategoria(nombre, abierta) {
    var g = cargarCategorias();
    g[nombre] = abierta ? 1 : 0;
    try { localStorage.setItem(CATS_KEY, JSON.stringify(g)); } catch (e) { /* sin persistencia */ }
  }

  function separadorAmpliacion(clase) {
    var sep = document.createElement("div");
    sep.className = clase;
    sep.setAttribute("role", "separator");
    sep.textContent = T("catalogo_ampliacion");
    return sep;
  }

  function pintarCatalogoEn(cont, filtro, opciones) {
    opciones = opciones || {};
    cont.innerHTML = "";

    CATALOGO.forEach(function (grupo) {
      var items = (grupo.items || []).filter(function (it) {
        // Los auriculares o las gafas no van a ninguna entrada: en el
        // selector de una entrada concreta solo estorban.
        if (opciones.soloConEntrada && ITEMS[it.id] && ITEMS[it.id].sin_entrada) return false;
        if (!itemEnEquipo(ITEMS[it.id] || it, equipoDe(escenarioActual()))) return false;
        if (!filtro) return true;
        return (campo(it, "nombre") + " " + campo(it, "nota") + " " + campo(grupo, "categoria") + " " + nombreEtiquetaDe(it, null)).toLowerCase().indexOf(filtro) !== -1;
      });
      if (!items.length) return;

      // Cada categoría es un bloque plegable. Con 20 categorías y más de 250
      // ítems, la lista entera abierta obliga a un scroll larguísimo para
      // llegar a cualquier cosa, sobre todo en el móvil: 20 títulos caben de
      // un vistazo y llevan a lo que buscas en un toque.
      var nombreCat = campo(grupo, "categoria");
      var bloque = document.createElement("details");
      bloque.className = "catalogo-grupo";
      // Buscando se abre todo lo que tenga resultados: si no, la búsqueda
      // encontraría cosas que siguen sin verse.
      bloque.open = filtro ? true : categoriaAbierta(nombreCat, !grupo.plegada_por_defecto);
      bloque.addEventListener("toggle", function () {
        if (!filtro) recordarCategoria(nombreCat, bloque.open);
      });

      var h = document.createElement("summary");
      h.className = "grupo-titulo";
      h.appendChild(document.createTextNode(nombreCat));
      var cuenta = document.createElement("span");
      cuenta.className = "grupo-cuenta";
      cuenta.textContent = items.length;
      h.appendChild(cuenta);
      bloque.appendChild(h);

      var fila = document.createElement("div");
      fila.className = "chip-fila";
      // Músculos de ampliación (27-09-2026): antes eran categorías aparte
      // ("Músculos MMSS — ampliación"...); ahora van en la suya, detrás de
      // una línea, para no tener dos desplegables por grupo muscular.
      var yaSeparado = false;
      items.forEach(function (it, i) {
        if (!yaSeparado && i > 0 && ITEMS[it.id] && ITEMS[it.id].ampliacion) {
          yaSeparado = true;
          fila.appendChild(separadorAmpliacion("chip-separador"));
        }
        fila.appendChild(crearChip(ITEMS[it.id], { alElegir: opciones.alElegir }));
      });
      bloque.appendChild(fila);
      cont.appendChild(bloque);
    });

    if (!cont.children.length) {
      var vacio = document.createElement("p");
      vacio.className = "empty-hint";
      vacio.textContent = T("catalogo_sin_result");
      cont.appendChild(vacio);
    }
  }

  function renderCatalogo() {
    pintarCatalogoEn(
      document.getElementById("catalogo-contenido"),
      (document.getElementById("catalogo-buscar").value || "").toLowerCase().trim(),
      {}
    );
  }

  /* ---------------------------------------------------------------- *
   * Elegir material desde una entrada
   *
   * El flujo de siempre va al revés: eliges material en el catálogo y luego
   * dónde va. Este empieza por la entrada, que es como se piensa cuando ya
   * tienes la caja delante y ves qué canal queda libre, y abre el catálogo
   * encima sabiendo de antemano el destino.
   * ---------------------------------------------------------------- */
  var dlgElegir = document.getElementById("dlg-elegir");
  var elegirCaja = null;
  var elegirEntrada = null;

  function renderElegir() {
    pintarCatalogoEn(
      document.getElementById("elegir-contenido"),
      (document.getElementById("elegir-buscar").value || "").toLowerCase().trim(),
      { soloConEntrada: true, alElegir: function (itemId) {
        colocar(elegirCaja, elegirEntrada, itemId);
        dlgElegir.close();
      } }
    );
  }

  function abrirElegir(cajaKey, entrada) {
    elegirCaja = cajaKey;
    elegirEntrada = entrada.id;
    var ocupada = asignacionesDe(cajaKey)[entrada.id];
    var texto = T("elegir_destino", {
      entrada: entrada.polo ? entrada.etiqueta + " " + entrada.polo : entrada.etiqueta,
      caja: infoCaja(cajaKey).nombre
    });
    // Si la entrada ya tiene algo, se avisa: elegir aquí sustituye, no añade
    if (ocupada && ITEMS[ocupada]) {
      texto += " " + T("elegir_ocupada", { item: campo(ITEMS[ocupada], "nombre") });
    }
    var destino = document.getElementById("elegir-destino");
    destino.textContent = texto;
    document.getElementById("elegir-quitar").hidden = !ocupada;
    document.getElementById("elegir-buscar").value = "";
    renderElegir();
    dlgElegir.showModal();
    // Sin esto, showModal() deja el foco (y en móvil, el teclado) en
    // "elegir-buscar" -el primer elemento enfocable del diálogo- en vez de
    // dejar ver el material recién abierto. Se sigue pudiendo tocar el
    // buscador a mano cuando haga falta.
    destino.focus({ preventScroll: true });
  }

  document.getElementById("elegir-buscar").addEventListener("input", renderElegir);

  document.getElementById("elegir-cerrar").addEventListener("click", function () {
    dlgElegir.close();
  });

  document.getElementById("elegir-quitar").addEventListener("click", function () {
    delete asignacionesDe(elegirCaja)[elegirEntrada];
    olvidarEtiquetaColocada(elegirCaja, elegirEntrada);
    guardarMontajeActivo();
    renderCajas();
    renderResumen();
    dlgElegir.close();
  });

  /* ---------------------------------------------------------------- *
   * Sincronización con GitHub
   *
   * El estado vive en localStorage y la herramienta funciona sin conexión.
   * Subir y bajar son acciones manuales contra un repositorio privado de
   * datos (nunca el del código, que se publica). Si el archivo remoto ha
   * cambiado desde la última vez, se avisa en lugar de pisarlo.
   * ---------------------------------------------------------------- */
  var SYNC_KEY = "mio_ionm_sync_v1";
  var RUTA_REMOTA = "estado.json";
  // pendiente: hay cambios locales sin subir. Sobrevive al cierre del
  // navegador para no bajar encima de ellos al abrir en otro sitio.
  var sync = { repo: "", token: "", sha: null, fecha: null, pendiente: false };

  var RETARDO_SUBIDA = 4000;   // margen para no subir en cada tecleo
  var temporizador = null;
  var subiendo = false;
  var conflicto = false;       // el remoto cambió desde otro dispositivo
  var ultimoFallo = null;

  function syncActivo() {
    return !MODO_DEMO && !!(sync.repo && sync.token);
  }

  function cargarSync() {
    try {
      var g = JSON.parse(localStorage.getItem(SYNC_KEY) || "null");
      if (g) sync = Object.assign(sync, g);
    } catch (e) { /* configuración ausente o ilegible */ }
  }

  function guardarSync() {
    try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch (e) { /* sin persistencia */ }
  }

  function pintarEstadoSync() {
    if (typeof pintarEstadoApunteGuardado === "function") pintarEstadoApunteGuardado();
    var el = document.getElementById("sync-estado");
    var btn = document.getElementById("btn-sync");
    var estado = "ok";
    if (!syncActivo()) {
      el.textContent = T(MODO_DEMO ? "demo_estado_sync" : "sync_sin_conectar");
      estado = "off";
    } else if (conflicto) {
      el.textContent = T("sync_conflicto");
      estado = "error";
    } else if (subiendo) {
      el.textContent = T("sync_sincronizando");
    } else if (ultimoFallo) {
      el.textContent = T("sync_sin_subir");
      estado = "error";
    } else if (sync.pendiente || casosPendientes().length || borradosPendientes().length || montajesPendientes().length || montajesBorradosPend().length || apunteDocPendiente() || simPresetsPendientes()) {
      el.textContent = T("sync_guardando");
      estado = "aviso";
    } else if (sync.fecha) {
      el.textContent = T("sync_fecha", { fecha: new Date(sync.fecha).toLocaleString(localeActual(), {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
      }) });
    } else {
      el.textContent = T("sync_conectado");
    }
    btn.dataset.estado = estado;
    btn.title = ultimoFallo || T(conflicto ? "sync_conflicto_tit" : "sync_titulo");
  }

  function mensajeSync(texto, esError) {
    var err = document.getElementById("sync-error");
    var ok = document.getElementById("sync-ok");
    err.hidden = true; ok.hidden = true;
    if (!texto) return;
    var destino = esError ? err : ok;
    destino.textContent = texto;
    destino.hidden = false;
  }

  // btoa/atob no admiten caracteres no ASCII: hay acentos en los nombres
  function aBase64(texto) {
    var bytes = new TextEncoder().encode(texto);
    var bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }

  function deBase64(b64) {
    var bin = atob(b64.replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function urlContenido() {
    return "https://api.github.com/repos/" + sync.repo + "/contents/" + RUTA_REMOTA;
  }

  function cabeceras() {
    return {
      "Authorization": "Bearer " + sync.token,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
  }

  function errorLegible(resp) {
    if (resp.status === 401) return T("err_token");
    if (resp.status === 403) return T("err_permiso");
    if (resp.status === 404) return T("err_no_repo");
    if (resp.status === 409) return T("err_conflicto");
    return T("err_generico", { codigo: resp.status });
  }

  function estadoActual() {
    return {
      formato: "mio-ionm",
      // version 3: los montajes salen de aquí y pasan a montajes/<uid>.json.
      // El bloque "escenarios" se sigue escribiendo con lo que hubiera en la
      // versión 2, sin tocarlo, como copia de seguridad de la conversión.
      version: 3,
      fecha: new Date().toISOString(),
      escenarios: legadoEscenarios || {},
      catalogo_usuario: catalogoUsuario,
      etiquetas_usuario: etiquetasUsuario,
      etiquetas_borradas: etiquetasBorradas,
      catalogos: catalogos,
      borrados: borrados,
      activo: legadoActivo
    };
  }

  function aplicarEstado(copia) {
    // Los montajes no vienen en esta copia: viajan en sus propios archivos.
    // `copia.escenarios`/`copia.activo` son la foto congelada retirada (ver
    // cargarEstado()): si la copia trae ese bloque -de antes del
    // 03-09-2026, o de un dispositivo que todavía no ha subido el retiro-
    // se ignora a propósito, para no resucitar montajes viejos como
    // "mig_*". limpiarMontajesHeredados() se encarga de borrar los que ya
    // hubieran resucitado antes de este cambio.
    catalogoUsuario = copia.catalogo_usuario || [];
    etiquetasUsuario = copia.etiquetas_usuario || [];
    etiquetasBorradas = copia.etiquetas_borradas || [];
    borrados = copia.borrados || [];
    // Una copia anterior a los catálogos editables no trae el bloque: se
    // queda con los de fábrica en lugar de dejarlo todo vacío.
    reiniciarCatalogos();
    aplicarCatalogosGuardados(copia.catalogos);
    reconstruirEtiquetas();
    migrarMaterialALaEtiqueta();   // copias de la versión 1, sin etiquetas
    reconstruirCatalogo();
    reconstruirCatalogos();
    // Por si la copia traía escenarios de la versión 2 que aquí no estaban
    sembrarMontajes();
    guardarEstado();
    renderTodo();
  }

  // Lee el archivo remoto. Devuelve {existe, contenido, sha} o lanza error.
  function leerRemoto() {
    return fetch(urlContenido() + "?ref=HEAD", { headers: cabeceras(), cache: "no-store" })
      .then(function (resp) {
        // 404 = el archivo no existe todavía; 409 = el repositorio está recién
        // creado y aún no tiene ningún commit. En ambos casos hay que crearlo.
        if (resp.status === 404 || resp.status === 409) {
          return { existe: false, sha: null, contenido: null };
        }
        if (!resp.ok) throw new Error(errorLegible(resp));
        return resp.json().then(function (json) {
          return { existe: true, sha: json.sha, contenido: JSON.parse(deBase64(json.content)) };
        });
      });
  }

  // Escribe el estado en el repositorio. shaRemoto identifica la versión
  // sobre la que escribimos (GitHub la exige para no pisar a ciegas).
  function enviarEstado(shaRemoto) {
    var cuerpo = {
      message: "Actualizar escenarios MIO-Check",
      content: aBase64(JSON.stringify(estadoActual(), null, 2))
    };
    if (shaRemoto) cuerpo.sha = shaRemoto;
    return fetch(urlContenido(), {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, cabeceras()),
      body: JSON.stringify(cuerpo)
    }).then(function (resp) {
      if (!resp.ok) throw new Error(errorLegible(resp));
      return resp.json();
    }).then(function (json) {
      sync.sha = json.content.sha;
      sync.fecha = new Date().toISOString();
      sync.pendiente = false;
      conflicto = false;
      ultimoFallo = null;
      guardarSync();
      pintarEstadoSync();
    });
  }

  function subir(forzar) {
    if (!syncActivo()) return;
    mensajeSync(T("sync_subiendo"));
    leerRemoto()
      .then(function (remoto) {
        // Si en el repositorio hay algo más nuevo que lo que bajamos, avisamos
        if (remoto.existe && sync.sha && remoto.sha !== sync.sha && !forzar) {
          var f = remoto.contenido && remoto.contenido.fecha
            ? new Date(remoto.contenido.fecha).toLocaleString(localeActual())
            : T("sync_fecha_desc");
          if (!confirm(T("sync_pisar", { fecha: f }))) {
            mensajeSync(T("sync_cancelado_sub"), true);
            return null;
          }
        }
        return enviarEstado(remoto.sha).then(function () {
          mensajeSync(T("sync_subido"));
        });
      })
      .catch(function (e) { mensajeSync(e.message || T("sync_error_subir"), true); });
  }

  /* -------- Automático --------------------------------------------- *
   * Guardar deja una marca de "pendiente" y arranca una cuenta atrás.
   * Nunca se pisa lo remoto a la brava: si ha cambiado desde otro
   * dispositivo se marca conflicto y se deja en manos del usuario.
   * ------------------------------------------------------------------ */
  function programarSubida() {
    if (!syncActivo()) return;
    sync.pendiente = true;
    guardarSync();
    programarEnvio();
  }

  /* Arranca la cuenta atrás sin marcar estado.json como pendiente. Lo usan
     los casos, que son archivos aparte y no tienen por qué obligar a
     reescribir el estado entero. */
  function programarEnvio() {
    if (!syncActivo()) return;
    pintarEstadoSync();
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      temporizador = null;
      subirAuto();
    }, RETARDO_SUBIDA);
  }

  function subirAuto() {
    if (!syncActivo() || subiendo) return;
    if (!sync.pendiente && !casosPendientes().length && !borradosPendientes().length &&
        !montajesPendientes().length && !montajesBorradosPend().length &&
        !apunteDocPendiente() && !simPresetsPendientes()) return;
    if (navigator.onLine === false) { pintarEstadoSync(); return; }
    subiendo = true;
    pintarEstadoSync();
    // Un conflicto en estado.json no debe dejar los casos sin subir: son
    // archivos independientes y cada uno se resuelve por su cuenta.
    var cadena = (sync.pendiente && !conflicto)
      ? leerRemoto().then(function (remoto) {
          if (remoto.existe && sync.sha && remoto.sha !== sync.sha) {
            conflicto = true;
            return null;   // hay que decidir a mano cuál se queda
          }
          return enviarEstado(remoto.sha);
        })
      : Promise.resolve();
    cadena
      .then(function () { return subirCasosPendientes(); })
      .then(function () { return borrarCasosPendientes(); })
      .then(function () { return subirMontajesPendientes(); })
      .then(function () { return borrarMontajesPendientes(); })
      .then(function () { return subirApunteDoc(); })
      .then(function () { return subirSimPresetsPendientes(); })
      .then(function () { return borrarSimPresetsPendientes(); })
      .catch(function (e) { ultimoFallo = e.message || T("sync_error_subir"); })
      .then(function () {
        subiendo = false;
        pintarEstadoSync();
      });
  }

  // Al abrir: si no hay nada local sin subir, se trae lo último sin preguntar.
  // Los casos se traen siempre, porque son archivos aparte: aunque haya
  // cambios locales de escenarios sin subir, hay que ver los casos que se
  // prepararon en el otro dispositivo.
  function bajarAuto() {
    if (!syncActivo() || navigator.onLine === false) return;
    if (sync.pendiente) { subirAuto(); bajarCasos(); bajarMontajes(); bajarApunteDoc(); bajarSimPresets(); bajarTecnicasMio(); return; }
    subiendo = true;
    pintarEstadoSync();
    leerRemoto()
      .then(function (remoto) {
        if (!remoto.existe || remoto.sha === sync.sha) return;
        var copia = remoto.contenido;
        if (!copia || copia.formato !== "mio-ionm") return;
        aplicarEstado(copia);
        sync.sha = remoto.sha;
        sync.fecha = new Date().toISOString();
        // aplicarEstado guarda, y guardar deja pendiente: no lo está
        sync.pendiente = false;
        if (temporizador) { clearTimeout(temporizador); temporizador = null; }
        guardarSync();
        avisoGuardado(T("traido_de_github", { hora: new Date().toLocaleTimeString(localeActual()) }));
      })
      .catch(function (e) { ultimoFallo = e.message || T("sync_error_bajar"); })
      .then(function () {
        subiendo = false;
        pintarEstadoSync();
        return bajarCasos();
      })
      .then(function () { return bajarMontajes(); })
      .then(function () { return bajarApunteDoc(); })
      .then(function () { return bajarSimPresets(); })
      .then(function () { return bajarTecnicasMio(); })
      .then(function () {
        // Un caso guardado en quirófano -o sin conexión- se queda marcado en
        // `casosSinSubir`, que es una marca aparte: `sync.pendiente` es solo
        // de estado.json. Sin esta llamada, al reabrir la app se bajaba pero
        // no se subía nunca, y el caso se quedaba encallado en ese navegador
        // hasta que por casualidad se tocara un escenario. Pasó de verdad:
        // dos casos preparados en el móvil no llegaron nunca al repositorio.
        // subirAuto() ya se planta solo si no hay nada que mandar.
        subirAuto();
      });
  }

  // Al volver la conexión se reintenta lo que quedó pendiente
  window.addEventListener("online", function () {
    ultimoFallo = null;
    if (sync.pendiente || casosPendientes().length || borradosPendientes().length || montajesPendientes().length || montajesBorradosPend().length || apunteDocPendiente() || simPresetsPendientes()) subirAuto();
    bajarCasos();
    bajarMontajes();
    bajarApunteDoc();
    bajarSimPresets();
    bajarTecnicasMio();
  });

  // Al volver la pestaña a primer plano, también. En el móvil el navegador
  // suspende o descarta la pestaña en cuanto cambias de app o bloqueas la
  // pantalla, así que la cuenta atrás de 4 s de programarEnvio() muchas veces
  // no llega a dispararse: lo guardado justo antes de guardar el teléfono en
  // el bolsillo se quedaba sin subir.
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    if (!syncActivo()) return;
    if (sync.pendiente || casosPendientes().length || borradosPendientes().length || montajesPendientes().length || montajesBorradosPend().length || apunteDocPendiente() || simPresetsPendientes()) subirAuto();
  });

  // Cerrar la pestaña con algo sin subir: avisa antes de perderlo de vista
  window.addEventListener("beforeunload", function (e) {
    if (syncActivo() && (sync.pendiente || casosPendientes().length || borradosPendientes().length || montajesPendientes().length || montajesBorradosPend().length || apunteDocPendiente() || simPresetsPendientes())) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  function bajar() {
    if (!sync.repo || !sync.token) return;
    mensajeSync(T("sync_bajando"));
    leerRemoto()
      .then(function (remoto) {
        if (!remoto.existe) {
          mensajeSync(T("sync_vacio"), true);
          return;
        }
        var copia = remoto.contenido;
        if (!copia || copia.formato !== "mio-ionm") throw new Error(T("sync_mal_formato"));
        if (!confirm(T("sync_traer", {
          fecha: new Date(copia.fecha).toLocaleString(localeActual()),
          escenarios: Object.keys(copia.escenarios || {}).length,
          materiales: (copia.catalogo_usuario || []).length
        }))) { mensajeSync(T("sync_cancelado_baj")); return; }
        aplicarEstado(copia);
        sync.sha = remoto.sha;
        sync.fecha = new Date().toISOString();
        // Lo local queda sustituido: ya no hay nada pendiente ni en conflicto
        sync.pendiente = false;
        conflicto = false;
        ultimoFallo = null;
        if (temporizador) { clearTimeout(temporizador); temporizador = null; }
        guardarSync();
        pintarEstadoSync();
        mensajeSync(T("sync_bajado"));
      })
      .catch(function (e) { mensajeSync(e.message || T("sync_error_bajar"), true); });
  }

  var dlgSync = document.getElementById("dlg-sync");

  document.getElementById("btn-sync").addEventListener("click", function () {
    if (MODO_DEMO) { alert(T("demo_sin_sync")); return; }
    document.getElementById("sync-repo").value = sync.repo || "";
    document.getElementById("sync-token").value = sync.token || "";
    mensajeSync(null);
    dlgSync.showModal();
  });

  function leerCamposSync() {
    var repo = document.getElementById("sync-repo").value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "");
    var token = document.getElementById("sync-token").value.trim();
    if (!repo || !token) {
      mensajeSync(T("sync_faltan_datos"), true);
      return false;
    }
    if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) {
      mensajeSync(T("sync_formato_repo"), true);
      return false;
    }
    if (repo !== sync.repo) {
      // Repo distinto: la referencia anterior no vale y hay que subirlo entero
      sync.sha = null;
      conflicto = false;
      sync.pendiente = true;
    }
    sync.repo = repo;
    sync.token = token;
    ultimoFallo = null;
    guardarSync();
    pintarEstadoSync();
    return true;
  }

  document.getElementById("sync-subir").addEventListener("click", function () {
    if (leerCamposSync()) subir(false);
  });
  document.getElementById("sync-bajar").addEventListener("click", function () {
    if (leerCamposSync()) bajar();
  });
  document.getElementById("sync-cerrar").addEventListener("click", function () { dlgSync.close(); });
  document.getElementById("sync-olvidar").addEventListener("click", function () {
    if (!confirm(T("sync_olvidar_conf"))) return;
    sync = { repo: "", token: "", sha: null, fecha: null, pendiente: false };
    conflicto = false;
    ultimoFallo = null;
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    try { localStorage.removeItem(SYNC_KEY); } catch (e) { /* nada que borrar */ }
    // Técnicas IONM solo se enseña a quien tiene el token: al desconectar
    // (p. ej. en un ordenador del hospital) no se queda la copia en este navegador.
    olvidarTecnicasMio();
    document.getElementById("sync-repo").value = "";
    document.getElementById("sync-token").value = "";
    pintarEstadoSync();
    mensajeSync(T("sync_desconectado"));
  });

  /* ---------------------------------------------------------------- *
   * Casos: modelo y almacenamiento
   *
   * Un archivo JSON por caso en casos/ del repositorio de datos. NO van
   * dentro de estado.json a propósito: dos dispositivos escribiendo el
   * mismo archivo se pisan, y aquí cada caso es un archivo con su nombre
   * derivado de un UUID, así que no pueden chocar.
   *
   * La clave real es caso_uid. ID_Caso (AAAA-NNN) es solo para nombrar el
   * caso en voz alta; si alguna vez se repitiera, no rompe nada.
   *
   * Tres fechas distintas y no se confunden:
   *   fecha       cuándo fue la cirugía. Editable siempre. Es la que cuenta.
   *   guardado_en cuándo se creó el archivo. Lo pone la app.
   *   editado_en  array con cada edición posterior. Lo pone la app.
   * ---------------------------------------------------------------- */
  var CASOS_KEY = "mio_ionm_casos_v1";
  // Cada caso vive en su propia clave de localStorage ("mio_ionm_caso_<uid>"),
  // no embebido dentro de CASOS_KEY -ver guardarUnCasoLocal()/cargarCasos()-.
  // Hasta el 22-09-2026 todos los casos se guardaban juntos en un solo bloque
  // JSON bajo CASOS_KEY, que crecía con cada foto (Imágenes del montaje,
  // Pruebas de imagen, Planificación del caso) hasta superar la cuota de
  // almacenamiento local de algunos móviles -reportado en real, con casos
  // nuevos que ya no se podían guardar en el dispositivo aunque sí llegaban a
  // subirse a GitHub (subirCaso() lee del objeto en memoria, no de
  // localStorage, así que la subida seguía funcionando)-. Separar por caso no
  // reduce el total que ocupan las fotos, pero evita que editar un caso
  // pequeño falle por culpa de que OTRO caso, con muchas fotos, ya casi llene
  // la cuota: cada guardado ahora solo escribe el caso que cambió.
  var CASO_PREFIJO = "mio_ionm_caso_";
  var VERSION_ESQUEMA = 1;
  var CENTRO_KEY = "mio_ionm_centro";

  var casos = {};        // caso_uid -> caso
  var casosSha = {};     // caso_uid -> sha del archivo en GitHub
  var casosSinSubir = {};// caso_uid -> true mientras no se haya subido
  // caso_uid -> sha con el que había que borrarlo en GitHub. Solo lleva
  // entrada los casos que SÍ llegaron a subirse alguna vez: uno que nunca
  // salió de este dispositivo no deja nada que borrar en el repositorio.
  var casosBorrados = {};

  function casosPendientes() {
    return Object.keys(casosSinSubir);
  }

  function borradosPendientes() {
    return Object.keys(casosBorrados);
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    // Reserva para navegadores sin randomUUID
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function hoyISO() {
    var d = new Date();
    return d.getFullYear() + "-" + dosDigitos(d.getMonth() + 1) + "-" + dosDigitos(d.getDate());
  }

  function dosDigitos(n) { return (n < 10 ? "0" : "") + n; }

  // Campos de un caso que pueden llevar fotos -"dataUrl" en los dos
  // primeros, dentro de checklist_prequirurgico en el tercero-. Un solo
  // sitio con la lista para no repetirla en guardar/cargar/borrar/subir.
  var CAMPOS_IMG_CASO = ["imagenes_montaje", "informes_imagenes"];

  // uid -> Promise que se resuelve cuando las fotos de ese caso ya están
  // hidratadas en memoria (ver hidratarCasoIDB()). subirCaso() la espera
  // antes de construir lo que sube; si un uid no aparece aquí es que
  // nunca hizo falta hidratarlo -llegó completo por bajarCasos(), o es un
  // caso nuevo creado en esta misma sesión-.
  var casosHidratados = {};

  function hidratarCasoIDB(uid) {
    var caso = casos[uid];
    if (!caso) return Promise.resolve();
    var tareas = CAMPOS_IMG_CASO.map(function (campo) {
      return hidratarFotosIDB("caso:" + uid + ":" + campo, caso[campo], "dataUrl");
    });
    if (caso.checklist_prequirurgico) {
      tareas.push(hidratarFotosIDB("caso:" + uid + ":checklist", caso.checklist_prequirurgico.imagenes, "dataUrl"));
    }
    if (caso.registro_intraop) {
      tareas.push(hidratarFotosIDB("caso:" + uid + ":registro", caso.registro_intraop.imagenes, "dataUrl"));
    }
    return Promise.all(tareas);
  }

  function cargarCasos() {
    casos = {}; casosSha = {}; casosSinSubir = {}; casosBorrados = {}; casosHidratados = {};
    var casosViejoFormato = null;
    try {
      var g = JSON.parse(localStorage.getItem(CASOS_KEY) || "null");
      if (g) {
        casosSha = g.sha || {};
        casosSinSubir = g.sin_subir || {};
        casosBorrados = g.borrados || {};
        // Formato anterior a este cambio: los casos venían embebidos aquí
        // mismo. Se migran más abajo, a su propia clave cada uno.
        if (g.casos) casosViejoFormato = g.casos;
      }
    } catch (e) { /* sin casos guardados o ilegibles */ }

    // Los uids que vengan de aquí tienen las fotos separadas en IndexedDB
    // -las guardó así guardarUnCasoLocal()-, así que hace falta volver a
    // unirlas. Los que vengan de casosViejoFormato ya las traen completas
    // (nunca se separaron), no entran en esta lista.
    var uidsPorHidratar = [];
    var uidsAMigrar = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var clave = localStorage.key(i);
        if (clave && clave.indexOf(CASO_PREFIJO) === 0) {
          try {
            var crudo = localStorage.getItem(clave);
            var c = JSON.parse(crudo);
            if (c && c.caso_uid) {
              casos[c.caso_uid] = c;
              // Un caso guardado antes del 23-09-2026 aún lleva las fotos
              // incrustadas: ya está completo, no hay que hidratarlo, y se
              // reescribe ahora mismo ligero -las fotos pasan a
              // IndexedDB- para liberar de golpe el espacio que ocupaba.
              if (crudo.indexOf('"dataUrl"') !== -1) uidsAMigrar.push(c.caso_uid);
              else uidsPorHidratar.push(c.caso_uid);
            }
          } catch (e2) { /* entrada ilegible, se ignora */ }
        }
      }
    } catch (e) { /* sin acceso a localStorage */ }

    if (casosViejoFormato) {
      Object.keys(casosViejoFormato).forEach(function (uid) {
        if (!casos[uid]) casos[uid] = casosViejoFormato[uid];
      });
      Object.keys(casos).forEach(function (uid) { guardarUnCasoLocal(uid); });
      guardarCasos();   // reescribe CASOS_KEY ya sin los casos embebidos
    }

    // En segundo plano, sin retrasar el arranque -la lista de Gestión de
    // Casos no necesita ninguna foto, y para cuando se abra una ficha o
    // se dispare una subida (4 s de retardo como mínimo) ya habrá dado
    // tiempo de sobra a leer de IndexedDB-.
    uidsPorHidratar.forEach(function (uid) {
      casosHidratados[uid] = hidratarCasoIDB(uid);
    });
    // Se espera a que IndexedDB confirme las fotos antes de aligerar
    // localStorage: si algo fallara, el caso sigue completo como estaba.
    uidsAMigrar.forEach(function (uid) {
      var caso = casos[uid];
      var esperas = CAMPOS_IMG_CASO.map(function (campo) {
        return guardarFotosIDB("caso:" + uid + ":" + campo, caso[campo], "dataUrl");
      });
      if (caso.checklist_prequirurgico) {
        esperas.push(guardarFotosIDB("caso:" + uid + ":checklist", caso.checklist_prequirurgico.imagenes, "dataUrl"));
      }
      if (caso.registro_intraop) {
        esperas.push(guardarFotosIDB("caso:" + uid + ":registro", caso.registro_intraop.imagenes, "dataUrl"));
      }
      Promise.all(esperas).then(function () { guardarUnCasoLocal(uid); });
    });
  }

  // Guarda un único caso en su propia clave. Las fotos (imagenes_montaje,
  // informes_imagenes, checklist_prequirurgico.imagenes) se separan antes
  // -van a IndexedDB, sin techo real de tamaño- para que lo que entra en
  // localStorage sea siempre ligero, texto sin más. Puede fallar por cuota
  // igualmente si el resto del caso (sin fotos) no cupiera, pero eso ya no
  // debería pasar en la práctica -en cuyo caso el aviso nombra el caso, no
  // un error críptico de Storage-, y no bloquea el guardado de ningún otro
  // caso.
  function guardarUnCasoLocal(uid) {
    var caso = casos[uid];
    if (!caso) return;
    try {
      var ligero = Object.assign({}, caso);
      CAMPOS_IMG_CASO.forEach(function (campo) {
        if (caso[campo] && caso[campo].length) {
          guardarFotosIDB("caso:" + uid + ":" + campo, caso[campo], "dataUrl");
          ligero[campo] = quitarDataUrls(caso[campo], "dataUrl");
        }
      });
      if (caso.checklist_prequirurgico && (caso.checklist_prequirurgico.imagenes || []).length) {
        guardarFotosIDB("caso:" + uid + ":checklist", caso.checklist_prequirurgico.imagenes, "dataUrl");
        ligero.checklist_prequirurgico = Object.assign({}, caso.checklist_prequirurgico, {
          imagenes: quitarDataUrls(caso.checklist_prequirurgico.imagenes, "dataUrl")
        });
      }
      if (caso.registro_intraop && (caso.registro_intraop.imagenes || []).length) {
        guardarFotosIDB("caso:" + uid + ":registro", caso.registro_intraop.imagenes, "dataUrl");
        ligero.registro_intraop = Object.assign({}, caso.registro_intraop, {
          imagenes: quitarDataUrls(caso.registro_intraop.imagenes, "dataUrl")
        });
      }
      localStorage.setItem(CASO_PREFIJO + uid, JSON.stringify(ligero));
    } catch (e) {
      avisoGuardado(T("guardado_error_caso", { id: caso.ID_Caso || uid, error: e.message }), true);
    }
  }

  // caso, si se pasa, es la versión de en memoria de antes de borrarla -
  // hace falta para saber qué fotos tenía y quitarlas también de
  // IndexedDB; sin eso se quedarían huérfanas ahí para siempre-.
  function borrarUnCasoLocal(uid, caso) {
    try { localStorage.removeItem(CASO_PREFIJO + uid); } catch (e) { /* sin persistencia */ }
    delete casosHidratados[uid];
    if (!caso) return;
    CAMPOS_IMG_CASO.forEach(function (campo) {
      (caso[campo] || []).forEach(function (im) {
        if (im && im.id) borrarFotoIDB("caso:" + uid + ":" + campo + ":" + im.id).catch(function () {});
      });
    });
    if (caso.checklist_prequirurgico) {
      (caso.checklist_prequirurgico.imagenes || []).forEach(function (im) {
        if (im && im.id) borrarFotoIDB("caso:" + uid + ":checklist:" + im.id).catch(function () {});
      });
    }
    if (caso.registro_intraop) {
      (caso.registro_intraop.imagenes || []).forEach(function (im) {
        if (im && im.id) borrarFotoIDB("caso:" + uid + ":registro:" + im.id).catch(function () {});
      });
    }
  }

  // Guarda solo los datos ligeros de sincronización -sha de cada caso en
  // GitHub, cuáles están pendientes de subir o de borrar-, nunca el
  // contenido de los casos en sí (eso va aparte, ver guardarUnCasoLocal()).
  // Este guardado hace falta en cada sincronización, así que pesa siempre
  // unos pocos KB y no puede fallar por cuota aunque el conjunto de casos
  // con fotos sea grande.
  function guardarCasos() {
    try {
      localStorage.setItem(CASOS_KEY, JSON.stringify({
        sha: casosSha, sin_subir: casosSinSubir, borrados: casosBorrados
      }));
    } catch (e) {
      avisoGuardado(T("guardado_error", { error: e.message }), true);
    }
  }

  // Quita un caso de en medio. Si nunca llegó a subirse, con borrarlo aquí
  // basta. Si sí llegó a existir en GitHub, se apunta para borrarlo allí en
  // cuanto haya conexión -igual que "sin_subir" hace con las subidas-, para
  // que no reaparezca solo si otro dispositivo sincroniza antes de que el
  // borrado llegue al repositorio.
  function borrarCaso(uid) {
    var caso = casos[uid];
    delete casos[uid];
    delete casosSinSubir[uid];
    if (casosSha[uid]) casosBorrados[uid] = casosSha[uid];
    delete casosSha[uid];
    borrarUnCasoLocal(uid, caso);
    guardarCasos();
    programarEnvio();
    pintarEstadoSync();
  }

  /* Guarda un caso en local y lo deja listo para subir. En quirófano se
     queda esperando, igual que el resto: durante la cirugía no se toca la
     red. Al salir del modo se manda. */
  // "desdeRegistro" (auditoría 28-09-2026, C9): el Registro guarda en cada
  // cambio; sellar "editado_en" cada vez dejaba cientos de marcas por
  // cirugía. Desde el Registro se sella como mucho una vez cada 30 minutos.
  function guardarCaso(caso, esNuevo, desdeRegistro) {
    if (!esNuevo) {
      var marcas = caso.editado_en || [];
      var ultima = marcas.length ? Date.parse(marcas[marcas.length - 1]) : 0;
      if (!desdeRegistro || !ultima || Date.now() - ultima > 30 * 60000) {
        caso.editado_en = marcas.concat(new Date().toISOString());
      }
    }
    alarmasEnCaso(caso);
    casos[caso.caso_uid] = caso;
    if (!MODO_DEMO) casosSinSubir[caso.caso_uid] = true;   // en la demo no hay nada que subir
    guardarUnCasoLocal(caso.caso_uid);
    guardarCasos();
    programarEnvio();
    pintarEstadoSync();
  }

  // Correlativo AAAA-NNN a partir del año de la fecha de la cirugía, tomando
  // el máximo de lo que ya se conoce (que tras bajar es todo el repositorio).
  function siguienteIdCaso(fecha) {
    var anio = (fecha || "").slice(0, 4) || String(new Date().getFullYear());
    var max = 0;
    Object.keys(casos).forEach(function (uid) {
      var m = /^(\d{4})-(\d+)$/.exec(casos[uid].ID_Caso || "");
      if (m && m[1] === anio) max = Math.max(max, parseInt(m[2], 10));
    });
    var n = String(max + 1);
    while (n.length < 3) n = "0" + n;
    return anio + "-" + n;
  }

  function centroPorDefecto() {
    try { return localStorage.getItem(CENTRO_KEY) || ""; } catch (e) { return ""; }
  }

  function recordarCentro(valor) {
    try { localStorage.setItem(CENTRO_KEY, valor || ""); } catch (e) { /* sin persistencia */ }
  }

  function casoVacio() {
    var fecha = hoyISO();
    return {
      caso_uid: uuid(),
      ID_Caso: siguienteIdCaso(fecha),
      nombre_caso: "",
      equipo_id: equipoNuevo(),
      // Nace sin planificar (26-09-2026); pasa a "preparado" al prepararlo.
      estado: "pendiente_planificar",
      motivo_cancelacion: "",
      fecha: fecha,
      centro: centroPorDefecto(),
      hora_inicio: "", hora_fin: "",
      escenario_nombre: "", perfil: "",
      edad: "", sexo: "", antecedentes_relevantes: "", informes_imagenes: [],
      intervencion: "", servicio_id: "", diagnostico: "",
      posicion: "", posicion_detalle: "", anatomia_patologica: "",
      navegacion: "",   // "" = sin registrar, "si" o "no" -ver navegacionDe()-
      otros_datos_quirurgicos: "",
      tecnicas_realizadas: [], tecnicas_alteradas: [],
      notas_montaje_tecnicas: "",
      hubo_cambios_plan: false, cambios_respecto_al_plan: "",
      umbral_raices_niveles: { niveles: [], valores: {} },
      umbral_tornillos_pediculares: "",
      material_previsto: {}, material_real: {},
      montaje: [], n_cajas: 0, n_canales_ocupados: 0, avisos_preparacion: [],
      coste_material: 0, coste_completo: false,
      // El montaje EN CRUDO, además de la instantánea legible de "montaje".
      // La instantánea guarda el rótulo de la entrada ("6 anodal"), que sirve
      // para leer el caso años después pero no para volver a montarlo: para
      // eso hace falta la clave real de la entrada. Sin esto no se puede
      // corregir dónde iba cada ítem sin adivinar.
      montaje_origen: "", asignaciones: {}, extras: [],
      etiquetas_colocadas: {}, conmutador: {},
      tipo_anestesia: "", tipo_anestesia_detalle: "",
      tof_monitorizado: "", incidencias_anestesicas: "",
      resumen_monitorizacion: "", alerta: false, tipo_alerta: "",
      medida_correctora: "", recuperacion_senal: "", resultado_esperable: "",
      deficit_postoperatorio: "", evolucion_postop: "", concordancia: "",
      incidencias_tecnicas: "", equipo: "",
      rol: "", supervisor: "", dificultad_1a5: "", aprendizaje_clave: "", caso_destacado: false,
      hacer_seguimiento: false,
      notas: "",
      // Checklist pre-quirúrgico vinculado a este caso (19/20-09-2026): mapa
      // id de ítem -> true. Sin campo propio en la ficha ni en CAMPOS_CASO
      // -se edita desde la pantalla "Checklist pre-quirúrgico", que decide
      // sola si trabaja aquí o en el "Modelo 0" suelto-, ver checklistValores().
      checklist_prequirurgico: {},
      // Hoja de registro intraoperatorio vinculada a este caso (24-09-2026),
      // ver "Registro intraoperatorio" al final de este archivo.
      registro_intraop: {},
      version_esquema: VERSION_ESQUEMA,
      guardado_en: new Date().toISOString(),
      editado_en: []
    };
  }

  /* Caso a partir del escenario montado. Todo lo que la herramienta ya sabe
     -técnicas, material, cajas, montaje y avisos- entra solo: no se teclea
     nada de esto. */
  /* Vuelca en el caso todo lo que sale del montaje. Se usa al crear el caso y
     cada vez que se corrige su montaje desde la propia ficha. */
  function volcarMontajeEnCaso(caso, esc) {
    var res = calcularResumen(esc);
    var previstoAntes = JSON.stringify(caso.material_previsto || {});
    caso.material_previsto = materialRedondeado(res.material);
    // "Material realmente usado" es del usuario en cuanto lo toca: solo se
    // vuelve a precargar si seguía siendo idéntico a lo previsto, es decir si
    // no lo había cambiado a mano. Si no, corregir el montaje le borraría lo
    // que anotó al cerrar el caso.
    if (JSON.stringify(caso.material_real || {}) === previstoAntes) {
      caso.material_real = materialRedondeado(res.material);
    }
    caso.n_cajas = res.cajas.length;
    caso.n_canales_ocupados = res.entradas;
    caso.avisos_preparacion = res.avisos.slice();
    caso.coste_material = res.coste ? Math.round(res.coste.total * 100) / 100 : 0;
    caso.coste_completo = !!(res.coste && !res.coste.sinPrecio.length);
    // Instantánea legible, con los textos ya resueltos, para que un caso
    // antiguo se siga leyendo aunque el catálogo cambie después
    caso.montaje = res.cajas.map(function (c) {
      return {
        caja: c.key, nombre: c.nombre, usadas: c.usadas, total: c.total,
        entradas: c.detalle.map(function (d) {
          return { entrada: d.entrada, item: d.item, nombre: d.nombre, tipo: d.tipo };
        })
      };
    });
    // Y el montaje en crudo, que es lo que permite volver a editarlo
    caso.asignaciones = clonar(esc.asignaciones || {});
    caso.extras = (esc.extras || []).slice();
    caso.etiquetas_colocadas = clonar(esc.etiquetas || {});
    caso.conmutador = clonar(esc.conmutador || {});
    // Las notas del montaje viajan con él: al cargar una plantilla se copian
    // al caso. Solo si el destino las trae (un montaje de caso siempre las
    // trae, aunque vacías), para no borrarlas por accidente.
    if (typeof esc.notas_montaje === "string") caso.notas_montaje = esc.notas_montaje;
    return res;
  }

  /* La intervención de un caso, como texto. Los casos nuevos la guardan
     directamente en "intervencion"; uno de antes de este cambio solo tiene
     "intervencion_id" apuntando al catálogo, así que se resuelve por ahí
     como respaldo, para no perder de vista lo que ya tenía. */
  function intervencionDe(c) {
    if (c.intervencion) return c.intervencion;
    var interv = c.intervencion_id ? INTERV[c.intervencion_id] : null;
    return interv ? campo(interv, "nombre") : "";
  }

  /* El resumen de monitorización de un caso. Uno nuevo lo guarda ya como un
     solo texto; uno de antes de este cambio tiene "basales_obtenidas" y
     "basales_cierre" sueltos, así que se juntan como respaldo -con la misma
     etiqueta "CL BSL:" que ya se usaba a mano para separar el cierre-, para
     no perder de vista lo que ya tenía. */
  function resumenMonitorizacionDe(c) {
    if (c.resumen_monitorizacion) return c.resumen_monitorizacion;
    var partes = [];
    if (c.basales_obtenidas) partes.push(c.basales_obtenidas);
    if (c.basales_cierre) partes.push("CL BSL: " + c.basales_cierre);
    return partes.join("\n\n");
  }

  /* Navegación del caso: "si", "no" o "" (sin registrar). Empezó siendo una
     casilla (true/false), pero false no distinguía "no se navegó" de "no lo
     sé": los casos anteriores al 23-09-2026 se hicieron sin anotarlo, y
     figuraban como "no navegado" sin que nadie lo supiera. Un true antiguo se
     lee como "si"; un false antiguo, como "sin registrar" -los casos desde
     el 23-09 se migraron a "no" en el repositorio de datos-. */
  function navegacionDe(c) {
    var v = c.navegacion;
    if (v === true || v === "si") return "si";
    if (v === "no") return "no";
    return "";
  }

  /* El tipo de alerta de un caso, con el criterio de alarma metido dentro si
     lo tenía: eran dos cajas para una misma idea -qué saltó y por qué-, y un
     caso de antes de este cambio los guardaba sueltos. */
  function tipoAlertaDe(c) {
    if (!c.criterio_alarma) return c.tipo_alerta || "";
    var base = c.tipo_alerta || "";
    return base
      ? base + "\n\nCriterio de alarma: " + c.criterio_alarma
      : c.criterio_alarma;
  }

  /* ---------------------------------------------------------------- *
   * Exportación manual de Casos a CSV. Pedida por el usuario para tener
   * los datos a mano sin depender del disparador diario de Apps Script:
   * mismas 54 columnas base que construirFilasCasos_() genera en la hoja
   * "Casos" de Codigo.gs -sin las columnas TEC_<etiqueta> por técnica, que
   * se consultan mejor caso a caso en la ficha-, con los mismos campos
   * resueltos (intervencionDe, resumenMonitorizacionDe, tipoAlertaDe) que
   * ya usa la ficha, para que un caso antiguo se lea igual aquí que en
   * pantalla. Si algún día se toca la cabecera de Codigo.gs, esta lista
   * hay que revisarla a la vez -son la misma tabla, en dos sitios-.
   * ---------------------------------------------------------------- */
  var COLUMNAS_CSV_CASOS = [
    "caso_uid", "ID_Caso", "nombre_caso", "estado", "motivo_cancelacion", "fecha", "centro", "hora_inicio", "hora_fin",
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
    "rol", "supervisor", "dificultad_1a5", "aprendizaje_clave", "caso_destacado", "hacer_seguimiento",
    "notas", "version_esquema", "n_ediciones", "ultima_edicion", "guardado_en"
  ];

  function valorCsvDeCaso(c, columna) {
    switch (columna) {
      case "fecha": return c.fecha || "";
      case "intervencion": return intervencionDe(c);
      case "servicio": return SERV[c.servicio_id] ? campo(SERV[c.servicio_id], "nombre") : "";
      case "resumen_monitorizacion": return resumenMonitorizacionDe(c);
      case "tipo_alerta": return tipoAlertaDe(c);
      case "n_cajas": return c.n_cajas || 0;
      case "n_canales_ocupados": return c.n_canales_ocupados || 0;
      case "avisos_preparacion": return (c.avisos_preparacion || []).join(" · ");
      case "coste_material": return typeof c.coste_material === "number" ? c.coste_material : "";
      case "coste_completo": return c.coste_completo ? 1 : 0;
      case "alerta": return c.alerta ? 1 : 0;
      case "hubo_cambios_plan": return c.hubo_cambios_plan ? 1 : 0;
      case "navegacion": var nav = navegacionDe(c); return nav === "si" ? 1 : (nav === "no" ? 0 : "");
      case "caso_destacado": return c.caso_destacado ? 1 : 0;
      case "hacer_seguimiento": return c.hacer_seguimiento ? 1 : 0;
      // Desde el 25-09-2026 la columna "equipo" es el equipo de cajas
      // (Inomed/Cadwell); el campo de texto libre del mismo nombre se retiró.
      case "equipo": return nombreEquipo(equipoDe(c));
      case "n_ediciones": return (c.editado_en || []).length;
      case "ultima_edicion": return (c.editado_en || []).length ? c.editado_en[c.editado_en.length - 1] : "";
      default: return c[columna] != null ? c[columna] : "";
    }
  }

  // Comillas solo si hacen falta -coma, comilla o salto de línea-, y la
  // comilla interna se escapa doblándola, regla estándar de CSV.
  function csvEscape(valor) {
    var texto = valor == null ? "" : String(valor);
    if (/[",\n]/.test(texto)) return "\"" + texto.replace(/"/g, "\"\"") + "\"";
    return texto;
  }

  function casosACsv(uidsFiltrados) {
    var filas = [COLUMNAS_CSV_CASOS.join(",")];
    // Mismo orden que el Sheet: cronológico por fecha de la cirugía, no por
    // cuándo se guardó el archivo -sea cual sea el orden elegido en
    // pantalla con "Ordenar por"-. uidsFiltrados ya viene filtrado (Estado/
    // Desde/Hasta/Solo destacados), aquí solo se decide el orden de las filas.
    var uids = uidsFiltrados.slice().sort(function (a, b) {
      return (casos[a].fecha || "").localeCompare(casos[b].fecha || "") ||
        (casos[a].ID_Caso || "").localeCompare(casos[b].ID_Caso || "");
    });
    uids.forEach(function (uid) {
      var c = casos[uid];
      var fila = COLUMNAS_CSV_CASOS.map(function (col) { return csvEscape(valorCsvDeCaso(c, col)); });
      filas.push(fila.join(","));
    });
    // BOM al principio: para que Excel en Windows abra los acentos bien en
    // vez de confundir la codificación.
    return "﻿" + filas.join("\r\n");
  }

  function descargarCsv(csv, prefijoNombre) {
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = prefijoNombre + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  document.getElementById("btn-exportar-casos-csv").addEventListener("click", function () {
    descargarCsv(casosACsv(casosFiltradosUids()), "mio-ionm-casos-");
    avisoGuardado(T("casos_exportados"));
  });

  /* Eventos (sección F) y alarmas (sección G) del Registro intraoperatorio
     en CSV (27-09-2026). Van en un archivo aparte y en formato largo -una
     fila por evento o alarma- porque un caso puede tener varios: meterlos en
     columnas del CSV de casos obligaría a comprimirlos en una celda, que es
     justo lo que impide analizarlos. Se cruzan con el CSV de casos por
     caso_uid / ID_Caso. Un solo archivo con "tipo_fila" en vez de dos: dos
     descargas desde un mismo clic las bloquean algunos navegadores. Los
     códigos (F/E/A..., S/P/N) salen tal cual, que son ids estables. */
  var COLUMNAS_CSV_EVENTOS = [
    "caso_uid", "ID_Caso", "fecha", "servicio", "diagnostico", "intervencion",
    "tipo_fila", "n", "hora", "codigo", "fase_maniobra", "contexto", "modalidad_lado", "cambio",
    "criterio", "causa_probable", "aviso_cirujano", "aviso_anestesia", "nrf", "an", "cir",
    "accion_medidas", "recuperacion", "hora_recuperacion", "min_hasta_recuperacion",
    "resultado_mio", "concordancia",
    // Correlación de la alarma con la evolución, por grupo (29-09-2026)
    "grupo_alarmas", "evolucion_alarma", "valorado", "concordancia_alarma"
  ];

  // Una fila del Registro sin nada escrito -las alarmas nacen con 5 filas
  // vacías, ver "min" en REG_SECCIONES- no es un evento.
  function filaRegistroVacia(f) {
    return !Object.keys(f || {}).some(function (k) { return k !== "id" && f[k]; });
  }

  // ¿Tiene la alarma algo escrito de verdad? (auditoría 28-09-2026, C5) Ni
  // la marca "manual" del «+ Alarma» de la ficha ni una lista de medidas
  // vacía (marcar y desmarcar un chip) cuentan: si no, una alarma en blanco
  // ponía «Hubo alerta» y «A1: » en el CSV y el Sheet. filaRegistroVacia()
  // sigue decidiendo qué filas se pintan (la alarma recién creada se ve).
  function alarmaEscrita(a) {
    return Object.keys(a || {}).some(function (k) {
      if (k === "id" || k === "manual") return false;
      var v = a[k];
      return Array.isArray(v) ? v.length > 0 : !!v;
    });
  }

  // Minutos entre dos "HH:MM"; si la recuperación cae pasada la medianoche,
  // suma un día en vez de dar un número negativo.
  function minutosEntre(h1, h2) {
    var m = /^(\d{1,2}):(\d{2})/.exec(h1 || ""), n = /^(\d{1,2}):(\d{2})/.exec(h2 || "");
    if (!m || !n) return "";
    var d = (+n[1] * 60 + +n[2]) - (+m[1] * 60 + +m[2]);
    return d < 0 ? d + 1440 : d;
  }

  function eventosACsv(uidsFiltrados) {
    var filas = [COLUMNAS_CSV_EVENTOS.join(",")], total = 0;
    var uids = uidsFiltrados.slice().sort(function (a, b) {
      return (casos[a].fecha || "").localeCompare(casos[b].fecha || "") ||
        (casos[a].ID_Caso || "").localeCompare(casos[b].ID_Caso || "");
    });
    uids.forEach(function (uid) {
      var c = casos[uid], r = c.registro_intraop || {};
      var comunes = {
        caso_uid: c.caso_uid || uid, ID_Caso: c.ID_Caso || "", fecha: c.fecha || "",
        servicio: valorCsvDeCaso(c, "servicio"),
        diagnostico: c.diagnostico ? opcionTexto("diagnostico", c.diagnostico) : "",
        intervencion: intervencionDe(c),
        resultado_mio: c.recuperacion_senal ? opcionTexto("recuperacion_senal", c.recuperacion_senal) : ((r.v || {}).cierre_resultado || ""),
        concordancia: c.concordancia || ""
      };
      function sacar(tipo, lista, prefijo, aFila) {
        (lista || []).forEach(function (f, i) {
          if (filaRegistroVacia(f) || (tipo === "alarma" && !alarmaEscrita(f))) return;
          var fila = Object.assign({ tipo_fila: tipo, n: prefijo + (i + 1) }, comunes, aFila(f));
          filas.push(COLUMNAS_CSV_EVENTOS.map(function (col) {
            var v = fila[col];
            return csvEscape(v === true ? 1 : (v === false ? 0 : v));
          }).join(","));
          total++;
        });
      }
      sacar("evento", r.eventos, "", function (f) {
        return { hora: f.hora, codigo: f.cod, fase_maniobra: f.fase, contexto: regTextoLista(REG_CONTEXTO, f.contexto), modalidad_lado: f.modalidad,
                 cambio: f.cambio, aviso_cirujano: !!f.av_cir, aviso_anestesia: !!f.av_an,
                 accion_medidas: f.accion };
      });
      // Grupo de cada alarma (misma técnica y criterio) con su correlato
      var grupoDe = {};
      if (r.alarmas) gruposAlarmas(r).forEach(function (g) {
        g.alarmas.forEach(function (x) { grupoDe[x.a.id || ("i" + x.n)] = g; });
      });
      sacar("alarma", r.alarmas, "A", function (f) {
        var g = grupoDe[f.id], eg = g ? correlatoDe(c, g) : {};
        var corr = g ? {
          grupo_alarmas: g.alarmas.map(function (x) { return "A" + x.n; }).join(", "),
          evolucion_alarma: eg.evol ? opcionTexto("correlato_evol", eg.evol) : "",
          valorado: eg.momento ? opcionTexto("correlato_momento", eg.momento) : "",
          concordancia_alarma: concordanciaGrupo(g, eg.evol)
        } : {};
        var med = (f.medidas_l || []).map(function (v) { return regTextoLista(REG_MEDIDAS_AL, v); });
        if (f.medidas) med.push(f.medidas);
        return { hora: f.hora, fase_maniobra: f.fase || "", modalidad_lado: f.modalidad,
                 criterio: regTextoLista(REG_CRITERIO_AL, f.criterio),
                 causa_probable: regTextoLista(REG_CAUSA_AL, f.causa), nrf: !!f.nrf, an: !!f.an, cir: !!f.cir,
                 accion_medidas: med.join(", "), recuperacion: f.recup, hora_recuperacion: f.h_recup,
                 min_hasta_recuperacion: minutosEntre(f.hora, f.h_recup),
                 grupo_alarmas: corr.grupo_alarmas, evolucion_alarma: corr.evolucion_alarma,
                 valorado: corr.valorado, concordancia_alarma: corr.concordancia_alarma };
      });
    });
    // BOM, igual que casosACsv(), para que Excel abra bien los acentos.
    return { csv: "\ufeff" + filas.join("\r\n"), total: total };
  }

  document.getElementById("btn-exportar-eventos-csv").addEventListener("click", function () {
    var res = eventosACsv(casosFiltradosUids());
    if (!res.total) { avisoGuardado(T("eventos_sin_datos"), true); return; }
    descargarCsv(res.csv, "mio-ionm-eventos-alarmas-");
    avisoGuardado(T("eventos_exportados").replace("{n}", res.total));
  });

  /* ------------------------------------------------------------------ *
   * Informe en PDF (pedido por el usuario, 05-09-2026: "en camino desde que se
   * dejó a medias 'Crear informe'"). Sin librerías -regla 4 de CLAUDE.md-:
   * se abre una pestaña con su propio documento, montado con
   * createElement/textContent igual que el resto de la app -nunca
   * innerHTML con datos concatenados-, y se llama a print() al cargar. El
   * propio diálogo de impresión del navegador ya ofrece "Guardar como
   * PDF" de fábrica, así que no hace falta generar el PDF a mano.
   *
   * Primera versión para que el usuario la pruebe y la vaya afinando: recorre
   * CAMPOS_CASO/GRUPOS_CASO -la misma lista que pinta la ficha en
   * pantalla-, así que un campo nuevo en la ficha aparece aquí solo, sin
   * tocar esta función.
   * ------------------------------------------------------------------ */
  function valorCampoInforme(def, c) {
    var v = def.c === "navegacion" ? navegacionDe(c) : c[def.c];
    if (def.t === "check") return v ? opcionTexto("sino", "si") : null;
    if (def.t === "sel") return v ? opcionTexto(def.o, v) : "";
    if (def.t === "equipo") return hayVariosEquipos() ? nombreEquipo(equipoDe(c)) : "";
    if (def.t === "cat") {
      var lista = def.cat === "servicios" ? SERVICIOS : INTERVENCIONES;
      var ent = (lista || []).filter(function (e) { return e.id === v; })[0];
      return ent ? campo(ent, "nombre") : (v || "");
    }
    if (def.c === "resumen_monitorizacion") return resumenMonitorizacionDe(c);
    if (def.c === "tipo_alerta") return tipoAlertaDe(c);
    if (def.c === "dificultad_1a5") return (v || v === 0) ? (v + "/5") : "";
    return v;
  }

  function nodoInforme(doc, tag, cls, texto) {
    var el = doc.createElement(tag);
    if (cls) el.className = cls;
    if (texto != null) el.textContent = texto;
    return el;
  }

  // Fila etiqueta/valor. Devuelve null si no hay nada que mostrar: así el
  // informe no se llena de líneas vacías en los casos que no rellenaron
  // ese campo -ver el .filter(Boolean) de quien la llama-.
  function filaInforme(doc, etiqueta, valor, ancha) {
    if (valor === null || valor === undefined || valor === "") return null;
    var fila = nodoInforme(doc, "div", "informe-fila" + (ancha ? " informe-fila-ancha" : ""));
    fila.appendChild(nodoInforme(doc, "span", "informe-etiqueta", etiqueta + ":"));
    fila.appendChild(nodoInforme(doc, "span", "informe-valor", String(valor)));
    return fila;
  }

  // "columnas" (2 o 3) reparte las filas en una rejilla: las cortas -edad,
  // sexo, fecha...- van una al lado de otra; las que se marcaron "ancha" (un
  // nombre largo, un texto libre) ocupan la fila entera.
  function seccionInforme(doc, titulo, filas, columnas) {
    var validas = (filas || []).filter(Boolean);
    if (!validas.length) return null;
    var sec = nodoInforme(doc, "section", "informe-seccion" + (columnas ? " informe-cols-" + columnas : ""));
    sec.appendChild(nodoInforme(doc, "h3", null, titulo));
    validas.forEach(function (f) { sec.appendChild(f); });
    return sec;
  }

  // Técnicas realizadas: mismo reparto en tres cestas que la ficha
  // (monitorización/reflejos/mapeo), pero como texto en vez de chips.
  function seccionTecnicasInforme(doc, c) {
    var ids = c.tecnicas_realizadas || [];
    if (!ids.length) return null;
    var tecs = TECNICAS.filter(function (t) { return ids.indexOf(t.id) !== -1; });
    var bloques = bloquesTecnicas(tecs);
    var filas = [
      filaInforme(doc, T("grupo_monitorizacion"), bloques.monitor.map(function (t) { return campo(t, "etiqueta"); }).join(", ")),
      filaInforme(doc, T("caso_pdf_reflejos"), bloques.reflejos.map(function (t) { return campo(t, "etiqueta"); }).join(", ")),
      filaInforme(doc, T("grupo_mapeo"), bloques.mapeo.map(function (t) { return campo(t, "etiqueta"); }).join(", "))
    ];
    return seccionInforme(doc, T("caso_tecnicas_realizadas"), filas);
  }

  /* ---------------------------------------------------------------- *
   * "Cómo se realizó cada técnica" (10-09-2026): campos propios por
   * técnica -PARAMETROS_TECNICAS/TECPAR_ID_MAP, ver data/parametros-
   * tecnicas.js-, en vez de la rejilla fija de 8 genéricos que había
   * antes (intensidad/frecuencia/nº pulsos/trenes/ISI/filtros/
   * promediación/barrido para TODAS las técnicas por igual).
   *
   * Guardado: c.tecnicas_parametros[id] = { general:{}, estimulacion:{},
   * registro:{} }, con las claves de cada sección siendo el id del campo
   * -mismo id que en PARAMETROS_TECNICAS-. "general.incidencias" hace de
   * nota libre por técnica -sustituye a lo que antes era un textarea
   * suelto fuera de la rejilla-.
   * ---------------------------------------------------------------- */
  var TECPAR_CAMPOS_ANTIGUOS = ["intensidad", "ancho_pulso", "frecuencia", "num_pulsos", "isi", "trenes", "filtros", "promediacion", "barrido"];

  function tecParCampoExiste(tecDef, sec, campoId) {
    return !!(tecDef && (tecDef.secciones[sec] || []).some(function (c) { return c.id === campoId; }));
  }

  // Un objeto de la forma vieja no trae "general"/"estimulacion"/"registro":
  // trae los 8 campos sueltos directamente, o "notas".
  function esTecParFormaAntigua(datos) {
    if (!datos || datos.general || datos.estimulacion || datos.registro) return false;
    return TECPAR_CAMPOS_ANTIGUOS.some(function (k) { return datos[k]; }) || !!datos.notas;
  }

  // De campo suelto de antes a { sección, campo } de ahora, solo si la
  // técnica en cuestión de verdad tiene ese campo nuevo -si no, el dato no
  // se inventa un sitio: se preserva tal cual en general.incidencias más
  // abajo, con una etiqueta que dice de qué campo venía-.
  var TECPAR_MIGRACION_DIRECTA = {
    intensidad: [["estimulacion", "intensidad"]],
    ancho_pulso: [["estimulacion", "ancho_pulso"]],
    frecuencia: [["estimulacion", "frecuencia"], ["estimulacion", "cadencia_trenes"]],
    num_pulsos: [["estimulacion", "n_pulsos"]],
    isi: [["estimulacion", "isi"]]
  };

  function migrarUnaTecnicaParametros(tecId, datos) {
    if (!esTecParFormaAntigua(datos)) return datos || {};
    var tecDef = definicionTecPar(tecId);
    var nuevo = { general: {}, estimulacion: {}, registro: {} };
    var notasExtra = [];
    Object.keys(TECPAR_MIGRACION_DIRECTA).forEach(function (k) {
      if (!datos[k]) return;
      var candidatos = TECPAR_MIGRACION_DIRECTA[k].filter(function (par) {
        return tecParCampoExiste(tecDef, par[0], par[1]);
      });
      if (candidatos.length) nuevo[candidatos[0][0]][candidatos[0][1]] = datos[k];
      else notasExtra.push(T("tecpar_" + k) + ": " + datos[k]);
    });
    // "trenes"/"filtros"/"promediación"/"barrido" eran texto libre y ahora
    // se reparten en varios campos tipados -partirlos solos sería adivinar
    // una estructura que no se sabe si es correcta-, así que se preservan
    // enteros como nota en vez de repartirse a ciegas.
    ["trenes", "filtros", "promediacion", "barrido"].forEach(function (k) {
      if (datos[k]) notasExtra.push(T("tecpar_" + k) + ": " + datos[k]);
    });
    if (datos.notas) notasExtra.push(datos.notas);
    if (notasExtra.length) nuevo.general.incidencias = notasExtra.join(" · ");
    return nuevo;
  }

  // Aplicada cada vez que se abre la ficha de un caso y cada vez que se
  // genera su informe: cubre tanto lo que ya está en este dispositivo como
  // lo recién bajado de GitHub, sin necesitar un paso de migración aparte
  // -mismo espíritu que migrarSeccionesApunteDoc() con los apuntes-.
  function migrarTecnicasParametros(mapaParam) {
    var salida = {};
    Object.keys(mapaParam || {}).forEach(function (tecId) {
      salida[tecId] = migrarUnaTecnicaParametros(tecId, mapaParam[tecId]);
    });
    return salida;
  }

  /* Opciones con id (auditoría 28-09-2026, C8; regla 3 de CLAUDE.md): cada
     lista de data/parametros-tecnicas.js lleva "ids" fijos junto a
     "opciones". Se guarda el id y se enseña el texto; así renombrar una
     opción no parte los datos. Lo guardado antes como texto se reconoce y
     pasa a id la próxima vez que se abre la ficha. Lo que no es ninguna
     opción (texto propio con "permite_otro") se guarda tal cual. */
  function tecParIdDe(cdef, v) {
    if (typeof v !== "string" || !v || !cdef || !cdef.opciones) return v;
    var ids = cdef.ids || [];
    if (ids.indexOf(v) !== -1) return v;
    var i = cdef.opciones.indexOf(v);
    return i !== -1 && ids[i] ? ids[i] : v;
  }
  function tecParTextoDe(cdef, v) {
    if (typeof v !== "string" || !v || !cdef || !cdef.opciones || !cdef.ids) return v;
    var i = cdef.ids.indexOf(v);
    return i !== -1 ? cdef.opciones[i] : v;
  }

  function tecParValorLegible(v, cdef) {
    if (Array.isArray(v)) return v.length ? v.map(function (x) { return tecParTextoDe(cdef, x); }).join(", ") : "";
    if (v === true) return T("tecpar_si");
    if (v === false || v == null) return "";
    return String(tecParTextoDe(cdef, v));
  }

  // Una línea "Etiqueta: valor · Etiqueta: valor..." con todo lo que tenga
  // contenido -salvo general.incidencias, que hace de nota libre y se
  // muestra aparte, igual que antes hacía "notas"-.
  function tecParLinea(tecDef, datos) {
    var partes = [];
    ["general", "estimulacion", "registro"].forEach(function (sec) {
      (tecDef ? tecDef.secciones[sec] || [] : []).forEach(function (cdef) {
        if (sec === "general" && cdef.id === "incidencias") return;
        var v = tecParValorLegible((datos[sec] || {})[cdef.id], cdef);
        if (v) partes.push(cdef.etiqueta + ": " + v);
      });
    });
    return partes.join(" · ");
  }

  // "Cómo se realizó cada técnica": una ficha por técnica con algo escrito,
  // con sus parámetros en línea y la nota libre debajo.
  function seccionParametrosInforme(doc, c) {
    var mapa = migrarTecnicasParametros(c.tecnicas_parametros);
    var ids = (c.tecnicas_realizadas || []).filter(function (id) {
      var d = mapa[id];
      return d && (tecParLinea(definicionTecPar(id), d) || (d.general || {}).incidencias);
    });
    if (!ids.length) return null;
    var sec = nodoInforme(doc, "section", "informe-seccion");
    sec.appendChild(nodoInforme(doc, "h3", null, T("caso_tecnicas_parametros")));
    ids.forEach(function (id) {
      var t = TECNICAS.filter(function (x) { return x.id === id; })[0];
      var tecDef = definicionTecPar(id);
      var d = mapa[id];
      var bloque = nodoInforme(doc, "div", "informe-tecpar");
      bloque.appendChild(nodoInforme(doc, "h4", null, t ? campo(t, "etiqueta") : id));
      var linea = tecParLinea(tecDef, d);
      if (linea) bloque.appendChild(nodoInforme(doc, "p", "informe-tecpar-linea", linea));
      if ((d.general || {}).incidencias) bloque.appendChild(nodoInforme(doc, "p", "informe-tecpar-notas", d.general.incidencias));
      sec.appendChild(bloque);
    });
    return sec;
  }

  // Umbrales EMG por raíz: una fila por nivel marcado, con sus dos lados.
  // Basales (apertura / post-posición / cierre), solo las filas escritas.
  function seccionBasalesInforme(doc, c) {
    var d = c.registro_intraop && c.registro_intraop.v ? c.registro_intraop : null;
    if (!d) return null;
    var filas = [];
    [["s_", REG_BASALES_SENS, REG_BASALES_LIBRES.sens], ["m_", REG_BASALES_MOT, REG_BASALES_LIBRES.mot]].forEach(function (t) {
      var defs = t[1].map(function (r) { return { id: r.id, rotulo: campo(r, "l") }; });
      for (var i = 1; i <= t[2]; i++) defs.push({ id: "libre" + i, rotulo: d.v["e_" + t[0] + "libre" + i + "_l"] || T("registro_otro") });
      defs.forEach(function (r) {
        var vals = REG_BASALES_COLS.map(function (col) { return regColBasal(col, r.id) ? d.v["e_" + t[0] + r.id + "_" + col.id] || "" : ""; });
        if (vals.some(Boolean)) filas.push([r.rotulo].concat(vals));
      });
    });
    var extras = [];
    if (d.v.grid1_motor) extras.push(T("caso_basales_grid_estimulo") + ": " + d.v.grid1_motor);
    if (d.v.grid1_inversion) extras.push(T("caso_basales_grid_inversion") + ": " + d.v.grid1_inversion);
    if (!filas.length && !extras.length) return null;
    var sec = nodoInforme(doc, "section", "informe-seccion");
    sec.appendChild(nodoInforme(doc, "h3", null, T("caso_basales_registro")));
    if (filas.length) {
      var tabla = nodoInforme(doc, "table", "informe-tabla-basales");
      var cab = nodoInforme(doc, "tr");
      [""].concat(REG_BASALES_COLS.map(function (col) { return campo(col, "l"); })).forEach(function (t) { cab.appendChild(nodoInforme(doc, "th", null, t)); });
      tabla.appendChild(cab);
      filas.forEach(function (f) {
        var tr = nodoInforme(doc, "tr");
        f.forEach(function (v, i) { tr.appendChild(nodoInforme(doc, i ? "td" : "th", null, v)); });
        tabla.appendChild(tr);
      });
      sec.appendChild(tabla);
    }
    extras.forEach(function (t) { sec.appendChild(nodoInforme(doc, "p", "informe-nota", t)); });
    return sec;
  }

  // Alarmas del Registro (espejo en la ficha, 28-09-2026): una línea por
  // alarma, con sus medidas. Sin alarmas estructuradas, nada.
  function seccionAlarmasInforme(doc, c) {
    var d = c.registro_intraop;
    var filas = [];
    ((d && d.alarmas) || []).forEach(function (a, i) {
      if (!alarmaEscrita(a)) return;
      var m = textoMedidasAlarma(a, i);
      filas.push(filaInforme(doc, "A" + (i + 1), textoAlarma(a, i).replace(/^A\d+: /, "") +
        (m ? "\n" + T("reg_p_medidas") + ": " + m.replace(/^A\d+: /, "") : ""), true));
    });
    return filas.length ? seccionInforme(doc, T("caso_alarmas_registro"), filas) : null;
  }

  // Correlación de cada alarma con la evolución (29-09-2026): una línea por
  // grupo; sin alarmas, nada.
  function seccionCorrelatoInforme(doc, c) {
    var filas = filasCorrelato(c).map(function (f) { return filaInforme(doc, f.alarmas, textoCorrelato(f), true); });
    return filas.length ? seccionInforme(doc, T("caso_correlato_alarmas"), filas) : null;
  }

  function seccionUmbralRaicesInforme(doc, c) {
    var datos = c.umbral_raices_niveles;
    if (!datos || !datos.niveles || !datos.niveles.length) return null;
    var filas = datos.niveles.map(function (nivel) {
      var vals = (datos.valores || {})[nivel] || {};
      var partes = [];
      if (vals.izq) partes.push(T("umbral_raices_izq", { nivel: nivel }) + ": " + vals.izq);
      if (vals.der) partes.push(T("umbral_raices_der", { nivel: nivel }) + ": " + vals.der);
      return partes.length ? filaInforme(doc, nivel, partes.join(" · ")) : null;
    });
    return seccionInforme(doc, T("caso_umbral_raices_niveles"), filas);
  }

  // El material, en prosa y todo seguido -"Tipo:" en negrita, la cantidad sin
  // ella-: una lista de una fila por tipo ocupaba media página.
  function seccionMaterialInforme(doc, titulo, mapa) {
    var tipos = Object.keys(mapa || {}).sort();
    if (!tipos.length) return null;
    var sec = nodoInforme(doc, "section", "informe-seccion");
    sec.appendChild(nodoInforme(doc, "h3", null, titulo));
    var p = nodoInforme(doc, "p", "informe-prosa");
    tipos.forEach(function (tipo, i) {
      p.appendChild(nodoInforme(doc, "b", null, tipo + ":"));
      p.appendChild(doc.createTextNode(" " + mapa[tipo] + (i < tipos.length - 1 ? "; " : ".")));
    });
    sec.appendChild(p);
    return sec;
  }

  /* Las cajas del montaje como dibujo, una al lado de otra: cada una con sus
     entradas en orden y el material en la entrada donde se colocó, con el
     mismo borde/color que en pantalla (aplicarEstilo funciona sobre un
     elemento de otro documento, solo toca su .style). Solo salen las cajas
     con algo colocado; las entradas vacías se dibujan discretas para que se
     vea DÓNDE está cada cosa, no solo qué hay. */
  function seccionCajasInforme(doc, c) {
    var esc = montajeDesdeCaso(c);
    var usadas = {};
    calcularResumen(esc).cajas.forEach(function (caja) { usadas[caja.key] = true; });
    var claves = Object.keys(cajasDe(esc)).filter(function (k) { return usadas[k]; });
    if (!claves.length) return null;

    function conector(color) {
      var d = nodoInforme(doc, "i", "informe-con");
      d.style.backgroundColor = colorHex(color) || "#9aa7b1";
      return d;
    }
    function slot(cajaKey, ent) {
      var itemId = ((esc.asignaciones || {})[cajaKey] || {})[ent.id];
      var item = itemId ? ITEMS[itemId] : null;
      var s = nodoInforme(doc, "span", "informe-slot" + (item ? "" : " vacio"), item ? campo(item, "nombre") : "");
      if (item) aplicarEstilo(s, estiloDe(item, (esc.etiquetas || {})[cajaKey + "/" + ent.id] || null));
      return s;
    }
    function fila(cajaKey, ent) {
      var f = nodoInforme(doc, "div", "informe-canal");
      f.appendChild(nodoInforme(doc, "span", "informe-canal-num", ent.polo ? ent.etiqueta + " " + ent.polo : ent.etiqueta));
      var cons = nodoInforme(doc, "span", "informe-cons");
      if (ent.conector === "par") { cons.appendChild(conector("negro")); cons.appendChild(conector("rojo")); }
      else cons.appendChild(conector(ent.conector === "individual" ? null : ent.conector));
      f.appendChild(cons);
      f.appendChild(slot(cajaKey, ent));
      return f;
    }

    var sec = nodoInforme(doc, "section", "informe-seccion informe-seccion-cajas");
    sec.appendChild(nodoInforme(doc, "h3", null, T("caso_pdf_cajas")));
    var contenedor = nodoInforme(doc, "div", "informe-cajas");
    claves.forEach(function (cajaKey) {
      var info = infoCaja(cajaKey);
      var entradas = entradasDe(cajaKey);
      var numeradas = entradas.filter(function (e) { return !e.especial; });
      var especiales = entradas.filter(function (e) { return e.especial; });
      var ancha = info.conector === "anodal_catodal" || info.conector === "individual_2col" || !!info.grupos;
      var caja = nodoInforme(doc, "div", "informe-caja" + (ancha ? " ancha" : ""));
      caja.appendChild(nodoInforme(doc, "h4", null, info.nombre));
      var cuerpo = nodoInforme(doc, "div", "informe-caja-cuerpo");
      if (info.conector === "anodal_catodal") {
        for (var i = 0; i < numeradas.length; i += 2) {
          var par = nodoInforme(doc, "div", "informe-canal");
          par.appendChild(nodoInforme(doc, "span", "informe-canal-num", numeradas[i].etiqueta));
          [numeradas[i], numeradas[i + 1]].forEach(function (ent) {
            if (!ent) return;
            var mitad = nodoInforme(doc, "span", "informe-mitad");
            var cons = nodoInforme(doc, "span", "informe-cons");
            cons.appendChild(conector(ent.conector));
            mitad.appendChild(cons);
            mitad.appendChild(slot(cajaKey, ent));
            par.appendChild(mitad);
          });
          cuerpo.appendChild(par);
        }
      } else if (info.rejilla) {
        var rejI = nodoInforme(doc, "div", "informe-rejilla");
        rejI.style.gridTemplateColumns = "repeat(" + info.rejilla + ", minmax(0, 1fr))";
        numeradas.forEach(function (ent) { rejI.appendChild(fila(cajaKey, ent)); });
        cuerpo.appendChild(rejI);
      } else if (info.grupos) {
        var colsG = nodoInforme(doc, "div", "informe-caja-cols");
        info.grupos.forEach(function (g, gi) {
          var colG = nodoInforme(doc, "div", "informe-col");
          if (g.titulo) colG.appendChild(nodoInforme(doc, "div", "informe-grupo-titulo", campo(g, "titulo")));
          numeradas.filter(function (e) { return e.grupo === gi; })
            .forEach(function (ent) { colG.appendChild(fila(cajaKey, ent)); });
          colsG.appendChild(colG);
        });
        cuerpo.appendChild(colsG);
        var espG = nodoInforme(doc, "div", "informe-especiales");
        especiales.forEach(function (ent) { espG.appendChild(fila(cajaKey, ent)); });
        cuerpo.appendChild(espG);
        especiales = [];
      } else if (info.conector === "individual_2col") {
        // Las dos columnas van en su propio contenedor: Ref y GND se dibujan
        // debajo de la última fila, no como una tercera columna que
        // ensanchaba toda la caja.
        var cols = nodoInforme(doc, "div", "informe-caja-cols");
        var mitadN = Math.ceil(numeradas.length / 2);
        [numeradas.slice(0, mitadN), numeradas.slice(mitadN)].forEach(function (grupo) {
          var col = nodoInforme(doc, "div", "informe-col");
          grupo.forEach(function (ent) { col.appendChild(fila(cajaKey, ent)); });
          cols.appendChild(col);
        });
        cuerpo.appendChild(cols);
        var esp = nodoInforme(doc, "div", "informe-especiales");
        especiales.forEach(function (ent) { esp.appendChild(fila(cajaKey, ent)); });
        cuerpo.appendChild(esp);
        especiales = [];
      } else {
        numeradas.forEach(function (ent) { cuerpo.appendChild(fila(cajaKey, ent)); });
      }
      especiales.forEach(function (ent) { cuerpo.appendChild(fila(cajaKey, ent)); });
      if (info.puertos) cuerpo.appendChild(pintarPuertos(doc, info, cajaKey, esc, { fila: "informe-puertos", triangulo: "informe-puerto" }));
      caja.appendChild(cuerpo);
      contenedor.appendChild(caja);
    });
    sec.appendChild(contenedor);
    return sec;
  }

  // Imágenes (del montaje, o informes de imagen del paciente): se incrustan
  // tal cual -ya son dataURL- para que salgan en el PDF sin depender de
  // ninguna URL externa. Genérica por título/lista, la reutilizan tanto
  // "imagenes_montaje" como "informes_imagenes".
  function seccionImagenesInforme(doc, titulo, imgs) {
    imgs = imgs || [];
    if (!imgs.length) return null;
    var sec = nodoInforme(doc, "section", "informe-seccion informe-seccion-imagenes");
    sec.appendChild(nodoInforme(doc, "h3", null, titulo));
    var galeria = nodoInforme(doc, "div", "informe-imagenes");
    imgs.forEach(function (im) {
      var img = doc.createElement("img");
      img.src = im.dataUrl;
      img.alt = im.nombre || "";
      galeria.appendChild(img);
    });
    sec.appendChild(galeria);
    return sec;
  }

  function construirInformeCaso(doc, c) {
    var art = nodoInforme(doc, "article", "informe-caso");
    var cab = nodoInforme(doc, "header", "informe-cabecera");
    cab.appendChild(nodoInforme(doc, "h2", null, (c.ID_Caso || "—") + (c.nombre_caso ? " — " + c.nombre_caso : "")));
    // Estado, fecha y centro ya salen en "Identificación": repetirlos aquí en
    // una línea aparte solo gastaba altura.
    art.appendChild(cab);

    // Recorre CAMPOS_CASO agrupado por GRUPOS_CASO -la misma fuente que usa
    // la ficha en pantalla-, salvo los campos con su propia sección hecha a
    // mano más abajo (técnicas, material, imágenes...), que se insertan en
    // el sitio del grupo "montaje" al que pertenecen.
    var CAMPOS_APARTE = [
      "tecnicas_realizadas", "tecnicas_alteradas", "tecnicas_parametros",
      "umbral_raices_niveles", "material_previsto", "material_real", "imagenes_montaje",
      "informes_imagenes", "basales_registro", "alarmas_registro", "mapeo_registro", "eventos_anestesia",
      "correlato_alarmas"
    ];
    // Identificación en 2 columnas y Paciente en 3 (edad, sexo y servicio son
    // siempre descripciones cortas), con el nombre del caso y los textos
    // libres a ancho completo.
    var COLUMNAS_GRUPO = { traza: 2, paciente: 3 };
    GRUPOS_CASO.forEach(function (g) {
      var filas = CAMPOS_CASO
        .filter(function (def) { return def.g === g && def.t !== "ro" && CAMPOS_APARTE.indexOf(def.c) === -1; })
        .map(function (def) {
          var ancha = def.t === "area" || def.c === "nombre_caso";
          return filaInforme(doc, T("caso_" + def.c), valorCampoInforme(def, c), ancha);
        });
      var sec = seccionInforme(doc, T("caso_g_" + g), filas, COLUMNAS_GRUPO[g]);
      // "umbral_raices_niveles" va antes que "umbral_tornillos_pediculares"
      // en CAMPOS_CASO (ver la ficha real): su sección aparte tiene que
      // insertarse antes del bloque genérico de "desarrollo", no después,
      // para no invertir el orden que ve el usuario en pantalla.
      if (g === "desarrollo") {
        var sb = seccionBasalesInforme(doc, c);
        if (sb) art.appendChild(sb);
        var sr = seccionUmbralRaicesInforme(doc, c);
        if (sr) art.appendChild(sr);
        var sa = seccionAlarmasInforme(doc, c);
        if (sa) art.appendChild(sa);
      }
      if (g === "montaje") {
        // Mismo orden que CAMPOS_CASO/la ficha en pantalla (06-09-2026):
        // técnicas realizadas, cómo se hizo cada una, notas de
        // montaje/técnicas -"sec" trae justo ese único campo, es el único
        // que no está en CAMPOS_APARTE-, material previsto e imágenes al
        // final. Desde el 23-09-2026, a petición del usuario, el informe ya
        // no lleva ni "Material realmente usado" -remanente sin uso real
        // desde que se suspendió en la ficha el 06-09-2026, lo que cambia o
        // se añade se anota directamente en Notas del material- ni el coste
        // -el precio solo tiene que llegar al Sheet para estadística, no al
        // papel que se le da a nadie-: seccionCosteInforme() se retiró
        // entera, sin más llamadas tras este cambio. "Coste del material"
        // se sigue viendo, igual que siempre, dentro de la propia ficha.
        [
          seccionCajasInforme(doc, c),
          seccionMaterialInforme(doc, T("caso_material_previsto"), c.material_previsto),
          sec,
          seccionImagenesInforme(doc, T("caso_imagenes_montaje"), c.imagenes_montaje)
        ].filter(Boolean).forEach(function (s) { art.appendChild(s); });
      } else if (g === "tecnicas") {
        // Apartado propio desde el 28-09-2026: técnicas realizadas, cómo se
        // hizo cada una y sus notas ("sec").
        [seccionTecnicasInforme(doc, c), seccionParametrosInforme(doc, c), sec]
          .filter(Boolean).forEach(function (s) { art.appendChild(s); });
      } else if (g === "resultado") {
        // La correlación de cada alarma, detrás de la evolución y la
        // concordancia del caso (29-09-2026).
        [sec, seccionCorrelatoInforme(doc, c)].filter(Boolean).forEach(function (s) { art.appendChild(s); });
      } else if (g === "paciente") {
        // Mismo criterio que "montaje": "sec" trae los campos simples del
        // grupo (edad, sexo, servicio, resumen de historia clínica), los
        // informes de imagen se cuelgan aparte al final por ser una galería,
        // no un valor de texto.
        [sec, seccionImagenesInforme(doc, T("caso_informes_imagenes"), c.informes_imagenes)]
          .filter(Boolean).forEach(function (s) { art.appendChild(s); });
      } else if (sec) {
        art.appendChild(sec);
      }
    });
    return art;
  }

  var ESTILO_INFORME_PDF =
    "body{font:14px/1.4 -apple-system,Segoe UI,Arial,sans-serif;color:#1a2229;margin:0;padding:0 2rem;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
    ".informe-caso{padding:1.5rem 0;border-bottom:2px solid #cfd6dd}" +
    ".informe-caso:last-child{border-bottom:none}" +
    "@media print{.informe-caso{page-break-after:always;border-bottom:none}.informe-caso:last-child{page-break-after:avoid}}" +
    ".informe-cabecera h2{margin:0 0 0.2rem;font-size:1.3rem}" +
    ".informe-meta{margin:0 0 1rem;color:#62717c;font-size:0.85rem}" +
    ".informe-seccion{margin-bottom:0.7rem;break-inside:avoid}" +
    ".informe-seccion h3{margin:0 0 0.3rem;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.04em;color:#14705a;border-bottom:1px solid #e3e8ec;padding-bottom:0.15rem}" +
    ".informe-fila{display:flex;gap:0.4rem;font-size:0.85rem;padding:0.05rem 0}" +
    ".informe-etiqueta{font-weight:700;white-space:nowrap}" +
    ".informe-valor{white-space:pre-wrap}" +
    ".informe-tecpar{margin:0.3rem 0;padding-left:0.5rem;border-left:2px solid #e3e8ec}" +
    ".informe-tecpar h4{margin:0;font-size:0.85rem}" +
    ".informe-tecpar-linea,.informe-tecpar-notas{margin:0.1rem 0;font-size:0.8rem}" +
    ".informe-cols-2,.informe-cols-3{display:grid;column-gap:1.2rem}" +
    ".informe-cols-2{grid-template-columns:1fr 1fr}.informe-cols-3{grid-template-columns:1fr 1fr 1fr}" +
    ".informe-cols-2 h3,.informe-cols-3 h3,.informe-fila-ancha{grid-column:1/-1}" +
    ".informe-prosa{margin:0;font-size:0.85rem;line-height:1.5}" +
    ".informe-cajas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.5rem;align-items:start}" +
    ".informe-caja{min-width:0;border:1px solid #9aa7b1;border-radius:4px;background:#f4f6f8;padding:0.25rem 0.3rem;break-inside:avoid}" +
    ".informe-caja.ancha{grid-column:span 2}" +
    ".informe-caja h4{margin:0 0 0.2rem;font-size:0.68rem;text-align:center;color:#14705a}" +
    ".informe-caja-cols{display:flex;gap:0.4rem}.informe-col{flex:1 1 0;min-width:0}" +
    ".informe-grupo-titulo{font-size:0.62em;font-weight:700;color:#555;margin-bottom:1px}" +
    ".informe-puertos{display:flex;gap:3px;margin-top:3px;align-items:flex-end}" +
    ".informe-rejilla{display:grid;gap:1px 4px}" +
    ".informe-tabla-basales{border-collapse:collapse;font-size:0.8em;margin:0.2rem 0}" +
    ".informe-tabla-basales th,.informe-tabla-basales td{border:1px solid #bbb;padding:1px 5px;text-align:left}" +
    ".informe-tabla-basales th{background:#f2f2f2}" +
    ".informe-puerto{position:relative;display:inline-block;width:14px;height:11px;background:#8fb8d8;clip-path:polygon(50% 0,100% 100%,0 100%)}" +
    ".informe-puerto.base{background:#7cbf9b}" +
    ".informe-puerto i{position:absolute;left:5px;top:4px;width:4px;height:4px;border-radius:50%;background:#fff}" +
    ".informe-puerto.encendido i{background:#1a9a3a}" +
    ".informe-puerto b{position:absolute;left:0;right:0;bottom:0;font-size:6px;text-align:center;color:#123}" +
    ".informe-especiales{display:flex;gap:0.4rem;margin-top:0.15rem}.informe-especiales .informe-canal{flex:1 1 0;min-width:0}" +
    ".informe-canal{display:flex;align-items:center;gap:0.2rem;margin:1px 0}" +
    ".informe-canal-num{flex:0 0 1.5rem;text-align:right;font-size:0.6rem;font-weight:700;color:#62717c}" +
    ".informe-cons{flex:0 0 auto;display:inline-flex;gap:1px}" +
    ".informe-con{display:inline-block;width:0.42rem;height:0.42rem;border-radius:50%}" +
    ".informe-mitad{flex:1 1 0;min-width:0;display:flex;align-items:center;gap:0.2rem}" +
    ".informe-slot{flex:1 1 0;min-width:0;min-height:0.95rem;box-sizing:border-box;border:1px solid #cfd6dd;border-radius:3px;background:#fff;font-size:0.6rem;line-height:1.25;padding:0 0.2rem}" +
    ".informe-slot.vacio{border-style:dashed;border-color:#d9dfe4;background:transparent}" +
    ".informe-imagenes{display:flex;flex-wrap:wrap;gap:0.5rem}" +
    ".informe-imagenes img{max-width:18rem;max-height:18rem;object-fit:cover;border:1px solid #cfd6dd;border-radius:4px}" +
    ".informe-coste-nota{margin:0.2rem 0 0;font-size:0.72rem;font-style:italic;color:#62717c}" +
    ".informe-coste-falta{margin:0.15rem 0 0;font-size:0.72rem;color:#a63428}";

  // Recibe una lista de CASOS (objetos, no uids): la usan tanto "Exportar
  // casos" (todos) como "Crear informe" (uno solo, el que está abierto).
  function abrirInformeCasos(listaCasos) {
    if (!listaCasos.length) { alert(T("caso_pdf_sin_datos")); return; }
    var ventana = window.open("", "_blank");
    if (!ventana) { alert(T("caso_pdf_popup_bloqueado")); return; }
    var doc = ventana.document;
    doc.open();
    doc.write("<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>MIO-Check</title></head><body></body></html>");
    doc.close();
    doc.title = "MIO-Check — " + (listaCasos.length === 1 ? (listaCasos[0].ID_Caso || "") : T("caso_pdf_titulo_varios"));
    var estilo = doc.createElement("style");
    estilo.textContent = ESTILO_INFORME_PDF;
    doc.head.appendChild(estilo);
    listaCasos.forEach(function (c) {
      doc.body.appendChild(construirInformeCaso(doc, c));
    });
    // document.write()+close() deja el documento ya montado de forma
    // síncrona -no hay nada que cargar de fuera-, así que se imprime
    // directamente: no hace falta esperar a "load" (y esperarlo también
    // habría disparado el diálogo de impresión dos veces).
    ventana.focus();
    ventana.print();
  }

  document.getElementById("btn-exportar-casos").addEventListener("click", function () {
    // Mismo criterio que casosACsv(): filtrado por lo activo en pantalla,
    // pero siempre en orden cronológico dentro del informe.
    var uids = casosFiltradosUids().sort(function (a, b) {
      return (casos[a].fecha || "").localeCompare(casos[b].fecha || "") ||
        (casos[a].ID_Caso || "").localeCompare(casos[b].ID_Caso || "");
    });
    abrirInformeCasos(uids.map(function (uid) { return casos[uid]; }));
  });

  /* ---------------------------------------------------------------- *
   * Fase 1: cargar una plantilla (un montaje de la biblioteca) sobre un
   * caso ya creado. "Plantilla" es cualquier montaje; aplicarla COPIA su
   * contenido -asignaciones, extras, etiquetas, conmutador y técnicas- sobre
   * el caso. Nunca es un enlace vivo: editar la plantilla después no toca
   * nada de lo ya copiado.
   *
   * Reutiliza lo que ya existía para corregir el montaje de un caso
   * (montajeDesdeCaso/volcarMontajeEnCaso/guardarMontajeEnCaso): esta
   * sección solo añade la fusión con una plantilla y la confirmación con
   * números, no una tubería nueva.
   * ---------------------------------------------------------------- */

  var dlgElegirPlantilla = document.getElementById("dlg-elegir-plantilla");
  var dlgAplicarPlantilla = document.getElementById("dlg-aplicar-plantilla");
  // true si el botón que abrió el selector fue el de la barra fija
  // (corrigiendo el montaje de un caso); false si fue el de la ficha.
  var plantillaModoEditando = false;
  var plantillaElegida = null;

  // El montaje-destino real sobre el que se fusiona: el que se está
  // corrigiendo en las cajas, o una reconstrucción fresca del caso abierto
  // en la ficha (de solo lectura hasta que se confirme la carga).
  function destinoPlantilla() {
    return plantillaModoEditando ? montajeCaso : montajeDesdeCaso(casoAbierto);
  }

  function contarOcupadas(m) {
    return calcularResumen(m).entradas;
  }

  // Entradas vacías en "destino" que la plantilla sí tiene ocupadas: lo que
  // "Añadir solo lo que falta" rellenaría, sin tocar el resto.
  function contarRellenables(destino, plantilla) {
    var n = 0;
    Object.keys(cajasDe(plantilla)).forEach(function (cajaKey) {
      var asignDestino = (destino.asignaciones || {})[cajaKey] || {};
      var asignPlant = (plantilla.asignaciones || {})[cajaKey] || {};
      entradasDe(cajaKey).forEach(function (ent) {
        if (!asignDestino[ent.id] && asignPlant[ent.id]) n++;
      });
    });
    return n;
  }

  // Aplica "plantilla" sobre "destino", mutándolo in situ.
  // modo "reemplazar": asignaciones, extras, etiquetas, conmutador y
  // técnicas pasan a ser una copia de los de la plantilla.
  // modo "anadir": las entradas ya ocupadas en destino no se tocan; las
  // vacías reciben lo que la plantilla tenga. Técnicas y extras de la
  // plantilla se suman a los del destino, sin quitar ninguno.
  function aplicarPlantillaSobreDestino(destino, plantilla, modo) {
    // Las notas del montaje de la plantilla pasan al destino: si la plantilla
    // no tiene, no se toca lo que hubiera; si tiene y el destino ya traía
    // otras distintas, "reemplazar" las sustituye y "añadir" las junta.
    var notasPlant = (plantilla.notas_montaje || "").trim();
    if (notasPlant) {
      var notasDest = (destino.notas_montaje || "").trim();
      if (modo === "reemplazar" || !notasDest) destino.notas_montaje = notasPlant;
      else if (notasDest.indexOf(notasPlant) === -1) destino.notas_montaje = notasDest + "\n\n" + notasPlant;
    }
    if (modo === "reemplazar") {
      destino.asignaciones = clonar(plantilla.asignaciones || {});
      destino.extras = (plantilla.extras || []).slice();
      destino.etiquetas = clonar(plantilla.etiquetas || {});
      destino.conmutador = clonar(plantilla.conmutador || {});
      destino.tecnicas = (plantilla.tecnicas || []).slice();
      return;
    }
    destino.asignaciones = destino.asignaciones || {};
    destino.etiquetas = destino.etiquetas || {};
    Object.keys(cajasDe(plantilla)).forEach(function (cajaKey) {
      var asignPlant = (plantilla.asignaciones || {})[cajaKey] || {};
      entradasDe(cajaKey).forEach(function (ent) {
        var itemPlant = asignPlant[ent.id];
        if (!itemPlant) return;
        destino.asignaciones[cajaKey] = destino.asignaciones[cajaKey] || {};
        if (destino.asignaciones[cajaKey][ent.id]) return; // ya ocupada, no se toca
        destino.asignaciones[cajaKey][ent.id] = itemPlant;
        var overridePlant = (plantilla.etiquetas || {})[claveEntrada(cajaKey, ent.id)];
        if (overridePlant) destino.etiquetas[claveEntrada(cajaKey, ent.id)] = overridePlant;
      });
    });
    destino.extras = (destino.extras || []).concat(plantilla.extras || []);
    var actuales = {};
    (destino.tecnicas || []).forEach(function (id) { actuales[id] = true; });
    destino.tecnicas = (destino.tecnicas || []).concat(
      (plantilla.tecnicas || []).filter(function (id) { return !actuales[id]; })
    );
  }

  // Punto de entrada de "Cargar montaje…", en la barra fija mientras se
  // corrige el material de un caso -antes también se podía desde la ficha,
  // ver Fase 6-.
  function iniciarCargaPlantilla(modoEditando) {
    var caso = modoEditando ? casos[casoEditandoUid] : leerFichaCaso();
    if (!caso) return;
    if (caso.estado === "cerrado" || caso.estado === "cancelado") {
      if (!confirm(T("plantilla_confirmar_estado", { estado: T("caso_estado_" + caso.estado) }))) return;
    }
    plantillaModoEditando = modoEditando;
    document.getElementById("plantilla-buscar").value = "";
    renderListaPlantillas();
    dlgElegirPlantilla.showModal();
    // Mismo motivo que en abrirElegir(): sin esto, showModal() enfoca
    // "plantilla-buscar" y abre el teclado en móvil antes de ver la lista.
    document.getElementById("elegir-plantilla-titulo").focus({ preventScroll: true });
  }

  // Lista de montajes elegibles como plantilla: se ofrecen también los de
  // otros -aplicar es una copia, no toca su archivo, así que puedoEditar()
  // no interviene aquí, a diferencia del diálogo Montajes.
  function renderListaPlantillas() {
    var cont = document.getElementById("plantilla-elegir-lista");
    cont.innerHTML = "";
    var busq = (document.getElementById("plantilla-buscar").value || "").toLowerCase();
    // Cada plantilla es de un equipo: sobre un caso solo se ofrecen las del
    // suyo (las entradas de un equipo no existen en las cajas del otro).
    var eqDestino = equipoDe(destinoPlantilla());
    var uids = Object.keys(montajes).filter(function (uid) {
      var m = montajes[uid];
      if (equipoDe(m) !== eqDestino) return false;
      if (!busq) return true;
      var nombre = (campo(m, "nombre") || "").toLowerCase();
      return nombre.indexOf(busq) !== -1 || autorDe(m).toLowerCase().indexOf(busq) !== -1;
    });
    uids.sort(compararMontajesPorNombre);

    document.getElementById("plantilla-elegir-vacio").hidden = !!uids.length;
    if (!uids.length) {
      document.getElementById("plantilla-elegir-vacio").textContent = T("plantilla_vacio");
      return;
    }

    uids.forEach(function (uid) {
      var m = montajes[uid];
      var fila = document.createElement("button");
      fila.type = "button";
      fila.className = "montaje-fila" + (puedoEditar(m) ? " mio" : "");
      var nom = document.createElement("span");
      nom.className = "montaje-nombre";
      nom.textContent = campo(m, "nombre") || uid;
      var sub = document.createElement("span");
      sub.className = "montaje-autor";
      sub.textContent = autorDe(m) + " · " + T("plantilla_entradas", { n: contarOcupadas(m) }) +
        (fechaMontaje(m) ? " · " + fechaMontaje(m) : "");
      fila.appendChild(nom);
      fila.appendChild(sub);
      fila.addEventListener("click", function () {
        dlgElegirPlantilla.close();
        abrirConfirmarPlantilla(m);
      });
      cont.appendChild(fila);
    });
  }

  document.getElementById("plantilla-buscar").addEventListener("input", renderListaPlantillas);
  document.getElementById("plantilla-elegir-cerrar").addEventListener("click", function () {
    dlgElegirPlantilla.close();
  });

  // La confirmación con números, siempre -tenga o no material el caso-.
  function abrirConfirmarPlantilla(plantilla) {
    plantillaElegida = plantilla;
    var destino = destinoPlantilla();
    var ocupadas = contarOcupadas(destino);
    var rellenables = contarRellenables(destino, plantilla);

    document.getElementById("aplicar-plantilla-nombre").textContent =
      T("montaje_de", { nombre: campo(plantilla, "nombre"), autor: autorDe(plantilla) });

    var msg1 = document.getElementById("aplicar-plantilla-msg");
    var msg2 = document.getElementById("aplicar-plantilla-msg2");
    var btnAnadir = document.getElementById("aplicar-plantilla-anadir");
    var btnReemplazar = document.getElementById("aplicar-plantilla-reemplazar");

    // Con el caso vacío las dos opciones dan el mismo resultado: se ofrece
    // solo "Aplicar", pero el diálogo se sigue mostrando igual.
    if (!ocupadas) {
      msg1.textContent = T("plantilla_msg_vacio", { n: contarOcupadas(plantilla) });
      msg2.textContent = "";
      btnAnadir.hidden = true;
      btnReemplazar.textContent = T("plantilla_btn_aplicar");
    } else {
      msg1.textContent = T("plantilla_msg_reemplazar", { n: ocupadas });
      msg2.textContent = T("plantilla_msg_anadir", { rellenables: rellenables, ocupadas: ocupadas });
      btnAnadir.hidden = false;
      btnReemplazar.textContent = T("plantilla_btn_reemplazar");
    }
    dlgAplicarPlantilla.showModal();
  }

  function confirmarCargaPlantilla(modo) {
    var plantilla = plantillaElegida;
    dlgAplicarPlantilla.close();
    if (!plantilla) return;

    if (plantillaModoEditando) {
      aplicarPlantillaSobreDestino(montajeCaso, plantilla, modo);
      var caso = casos[casoEditandoUid];
      if (caso) caso.montaje_origen = plantilla.montaje_uid;
      guardarMontajeEnCaso();
      renderTodo();
    } else {
      var m = montajeDesdeCaso(casoAbierto);
      aplicarPlantillaSobreDestino(m, plantilla, modo);
      casoAbierto.tecnicas_realizadas = m.tecnicas.slice();
      casoAbierto.montaje_origen = plantilla.montaje_uid;
      volcarMontajeEnCaso(casoAbierto, m);
      guardarCaso(casoAbierto, casoEsNuevo);
      casoEsNuevo = false;
      casoAbierto = clonar(casos[casoAbierto.caso_uid]);
      renderFichaCaso();
      avisoGuardado(T("caso_guardado"));
    }
    plantillaElegida = null;
  }

  document.getElementById("aplicar-plantilla-cancelar").addEventListener("click", function () {
    dlgAplicarPlantilla.close();
    plantillaElegida = null;
  });
  document.getElementById("aplicar-plantilla-reemplazar").addEventListener("click", function () {
    confirmarCargaPlantilla("reemplazar");
  });
  document.getElementById("aplicar-plantilla-anadir").addEventListener("click", function () {
    confirmarCargaPlantilla("anadir");
  });
  document.getElementById("barra-caso-cargar-plantilla").addEventListener("click", function () {
    iniciarCargaPlantilla(true);
  });

  /* ---------------------------------------------------------------- *
   * Fase 3: guardar el montaje de un caso como plantilla nueva.
   *
   * Puente inverso del de la Fase 1: aquí se lee del caso y se crea un
   * montaje nuevo en la biblioteca -nunca se sobrescribe uno existente, y
   * el caso no se toca en absoluto-. Disponible en cualquier momento, sin
   * mirar el estado del caso: no hay ningún riesgo de sobrescritura que
   * justifique una confirmación como la de cargar plantilla.
   * ---------------------------------------------------------------- */

  function guardarMontajeComoPlantilla() {
    var caso = casos[casoEditandoUid];
    var montajeRaw = montajeCaso;
    if (!caso || !montajeRaw) return;

    // Sugerencia a partir del diagnóstico y el nombre del caso -ninguno de
    // los dos es dato de paciente-: es lo más parecido a "de qué trata esta
    // plantilla" que el caso ya tiene escrito, sin inventar nada nuevo.
    var nombreSugerido = [opcionTexto("diagnostico", caso.diagnostico), caso.nombre_caso]
      .filter(Boolean).join(" — ") || T("esc_nuevo_def");
    var nombre = prompt(T("plantilla_guardar_prompt"), nombreSugerido);
    if (!nombre) return;

    var m = montajeNuevo(nombre, equipoDe(caso));
    m.asignaciones = clonar(montajeRaw.asignaciones || {});
    m.extras = (montajeRaw.extras || []).slice();
    m.etiquetas = clonar(montajeRaw.etiquetas || {});
    m.conmutador = clonar(montajeRaw.conmutador || {});
    m.tecnicas = (montajeRaw.tecnicas || []).slice();
    m.notas_montaje = montajeRaw.notas_montaje || "";
    guardarMontaje(m, true);
    avisoGuardado(T("plantilla_guardada", { nombre: campo(m, "nombre") }));
  }

  document.getElementById("barra-caso-guardar-plantilla").addEventListener("click", function () {
    guardarMontajeComoPlantilla();
  });

  /* ---------------------------------------------------------------- *
   * Casos: sincronización
   *
   * Reutiliza el token, las cabeceras y la pausa de quirófano del
   * mecanismo que ya existía. Lo único distinto es que cada caso es su
   * propio archivo, así que se suben y bajan de uno en uno.
   * ---------------------------------------------------------------- */
  function rutaCaso(uid) { return "casos/" + uid + ".json"; }

  function urlCaso(uid) {
    return "https://api.github.com/repos/" + sync.repo + "/contents/" + rutaCaso(uid);
  }

  /* Fusión de dos versiones del mismo caso (auditoría 28-09-2026, C3).
     Sin versión común de referencia no se puede saber quién cambió qué, así
     que el criterio es no perder nada:
       - un campo vacío en un lado se toma del otro;
       - si los dos lo tienen, gana el dispositivo que sube ("local");
       - las listas de elementos con "id" (eventos, alarmas, mapeo, fotos…)
         se juntan: cada elemento, entero, del lado local si lo tiene; los
         que solo tiene el remoto se añaden;
       - los objetos (registro_intraop, su "v", parámetros…) se fusionan
         campo a campo con estas mismas reglas;
       - "editado_en" es la unión de las dos historias.
     Lo que un lado borró y el otro aún tiene puede volver: es el precio de
     no perder datos, y es mucho menos grave que lo contrario. */
  function fusionarCaso(local, remoto) {
    function vacio(v) {
      return v === undefined || v === null || v === "" ||
        (Array.isArray(v) && !v.length) ||
        (v && typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);
    }
    function esObjeto(v) { return v && typeof v === "object" && !Array.isArray(v); }
    function conId(lista) { return lista.every(function (x) { return esObjeto(x) && x.id; }); }
    function fusionar(l, r) {
      if (vacio(l)) return vacio(r) ? l : r;
      if (vacio(r)) return l;
      if (Array.isArray(l) && Array.isArray(r)) {
        if (!conId(l) || !conId(r)) return l;
        // Un elemento local sin nada escrito (p. ej. una de las alarmas en
        // blanco que la hoja crea de antemano, con el mismo id en los dos
        // dispositivos) cede ante el remoto si ese sí tiene datos.
        var ids = {}, porId = {};
        r.forEach(function (y) { porId[y.id] = y; });
        var out = l.map(function (x) {
          ids[x.id] = true;
          var enBlanco = Object.keys(x).every(function (k) { return k === "id" || vacio(x[k]); });
          return (enBlanco && porId[x.id]) ? porId[x.id] : x;
        });
        r.forEach(function (y) { if (!ids[y.id]) out.push(y); });
        return out;
      }
      if (esObjeto(l) && esObjeto(r)) {
        var o = {};
        Object.keys(r).forEach(function (k) { o[k] = r[k]; });
        Object.keys(l).forEach(function (k) { o[k] = (k in r) ? fusionar(l[k], r[k]) : l[k]; });
        return o;
      }
      return l;
    }
    var res = fusionar(local, remoto);
    var marcas = {};
    (local.editado_en || []).concat(remoto.editado_en || []).forEach(function (m) { marcas[m] = true; });
    res.editado_en = Object.keys(marcas).sort();
    return res;
  }

  function subirCaso(uid, reintento) {
    var caso = casos[uid];
    if (!caso) { delete casosSinSubir[uid]; return Promise.resolve(); }
    // Si las fotos de este caso todavía se están recuperando de IndexedDB
    // (ver cargarCasos()), hay que esperar a que terminen -si no, se
    // subiría a GitHub un caso con las fotos a medias, y la subida
    // "ganaría" sobre la versión completa que hubiera antes-.
    return (casosHidratados[uid] || Promise.resolve()).then(function () {
      return subirCasoYaHidratado(uid, reintento);
    });
  }

  function subirCasoYaHidratado(uid, reintento) {
    var caso = casos[uid];
    if (!caso) { delete casosSinSubir[uid]; return Promise.resolve(); }
    var cuerpo = {
      message: "Caso " + (caso.ID_Caso || uid),
      content: aBase64(JSON.stringify(caso, null, 2))
    };
    if (casosSha[uid]) cuerpo.sha = casosSha[uid];
    return fetch(urlCaso(uid), {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, cabeceras()),
      body: JSON.stringify(cuerpo)
    }).then(function (resp) {
      // 409/422: el archivo cambió desde otro dispositivo (p. ej. el Registro
      // en el móvil y la ficha en el ordenador, el mismo día). Antes se subía
      // lo local tal cual y se perdía lo del otro dispositivo; desde el
      // 29-09-2026 (auditoría, C3) se baja el remoto, se fusionan los dos con
      // fusionarCaso() y se sube el resultado.
      if ((resp.status === 409 || resp.status === 422) && !reintento) {
        return fetch(urlCaso(uid), { headers: cabeceras(), cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (json) {
            casosSha[uid] = json ? json.sha : null;
            var remoto = null;
            try { remoto = json && json.content ? JSON.parse(deBase64(json.content)) : null; } catch (e) { remoto = null; }
            if (remoto && remoto.caso_uid === uid && casos[uid]) {
              casos[uid] = fusionarCaso(casos[uid], remoto);
              guardarUnCasoLocal(uid);
              avisoGuardado(T("caso_fusionado", { id: casos[uid].ID_Caso || uid }));
            }
            return subirCasoYaHidratado(uid, true);
          });
      }
      if (!resp.ok) throw new Error(errorLegible(resp));
      return resp.json().then(function (json) {
        casosSha[uid] = json.content.sha;
        delete casosSinSubir[uid];
        guardarCasos();
      });
    });
  }

  // De uno en uno, para no lanzar veinte peticiones a la vez si vuelve la red
  // con varios casos acumulados.
  function subirCasosPendientes() {
    if (!syncActivo()) return Promise.resolve();
    return casosPendientes().reduce(function (cadena, uid) {
      return cadena.then(function () { return subirCaso(uid); });
    }, Promise.resolve());
  }

  function eliminarCasoRemoto_(uid, sha, reintento) {
    return fetch(urlCaso(uid), {
      method: "DELETE",
      headers: Object.assign({ "Content-Type": "application/json" }, cabeceras()),
      body: JSON.stringify({ message: "Borrar caso " + uid, sha: sha })
    }).then(function (resp) {
      if (resp.status === 404) return;   // ya no estaba: nada que hacer
      // El sha cambió desde que se decidió borrarlo (otro dispositivo lo
      // tocó primero). Se relee y se reintenta una vez: el borrado sigue
      // siendo lo que quieres, gane lo que gane el contenido de en medio.
      if ((resp.status === 409 || resp.status === 422) && !reintento) {
        return fetch(urlCaso(uid), { headers: cabeceras(), cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (json) {
            if (!json) return;   // ya no existe
            return eliminarCasoRemoto_(uid, json.sha, true);
          });
      }
      if (!resp.ok) throw new Error(errorLegible(resp));
    });
  }

  function borrarCasosPendientes() {
    if (!syncActivo()) return Promise.resolve();
    return borradosPendientes().reduce(function (cadena, uid) {
      return cadena.then(function () {
        return eliminarCasoRemoto_(uid, casosBorrados[uid]).then(function () {
          delete casosBorrados[uid];
          guardarCasos();
        });
      });
    }, Promise.resolve());
  }

  /* Trae los casos del repositorio. Solo descarga los que han cambiado: el
     listado ya da el sha de cada archivo. Un caso con cambios locales sin
     subir no se pisa, que para eso está pendiente de subida.

     También limpia el caso contrario: uno que este dispositivo tiene
     guardado, con su sha confirmado de una sincronización anterior, pero
     que ya no aparece en el listado remoto -porque se borró desde otro
     dispositivo, o a mano en GitHub, fuera de la app-. Sin esto, ese caso
     se quedaría fantasma en este navegador para siempre: "bajar" solo
     añadía o actualizaba, nunca quitaba lo que había dejado de existir. */
  function bajarCasos() {
    if (!syncActivo() || navigator.onLine === false) return Promise.resolve();
    var url = "https://api.github.com/repos/" + sync.repo + "/contents/casos";
    return fetch(url, { headers: cabeceras(), cache: "no-store" })
      .then(function (resp) {
        if (resp.status === 404) return [];   // todavía no hay ningún caso
        if (!resp.ok) throw new Error(errorLegible(resp));
        return resp.json();
      })
      .then(function (listado) {
        var presentes = {};
        (listado || []).forEach(function (f) {
          if (f.type === "file" && /\.json$/.test(f.name)) {
            presentes[f.name.replace(/\.json$/, "")] = true;
          }
        });
        // Solo se retira un caso con sha confirmado -es decir, que en algún
        // momento se supo que existía en GitHub-. Uno recién creado en este
        // dispositivo y aún sin subir no tiene sha, así que nunca se toca
        // aquí por error.
        var yaNoExisten = Object.keys(casos).filter(function (uid) {
          return casosSha[uid] && !presentes[uid] && !casosSinSubir[uid] && !casosBorrados[uid];
        });
        yaNoExisten.forEach(function (uid) {
          var caso = casos[uid];
          delete casos[uid];
          delete casosSha[uid];
          borrarUnCasoLocal(uid, caso);
        });

        var quedan = (listado || []).filter(function (f) {
          if (f.type !== "file" || !/\.json$/.test(f.name)) return false;
          var uid = f.name.replace(/\.json$/, "");
          if (casosSinSubir[uid]) return false;
          // Pendiente de borrar en este dispositivo: no se vuelve a bajar
          // aunque el listado remoto todavía lo tenga -el borrado no ha
          // llegado allí todavía-, o reaparecería solo.
          if (casosBorrados[uid]) return false;
          // "!casos[uid]" además de la comparación de sha -bug real,
          // 22-09-2026-: casosSha vive en su propia clave ligera (siempre se
          // guarda bien, ver guardarCasos()) separada del contenido del
          // caso (guardarUnCasoLocal(), que si el caso es grande y el
          // móvil va justo de cuota puede fallar). Si el contenido no llegó
          // a guardarse pero el sha sí quedó anotado, comparar solo el sha
          // decía "no ha cambiado" y el caso desaparecía de la lista para
          // siempre, sin que nada volviera a intentar bajarlo -pasó de
          // verdad con los casos más grandes (2026-002/005/007). Con este
          // añadido, cualquier caso que falte en memoria se vuelve a
          // intentar en cada "bajar", tenga el sha que tenga.
          return !casos[uid] || casosSha[uid] !== f.sha;
        });
        return quedan.reduce(function (cadena, f) {
          return cadena.then(function () {
            return fetch(f.url, { headers: cabeceras(), cache: "no-store" })
              .then(function (r) { return r.ok ? r.json() : null; })
              .then(function (json) {
                if (!json || !json.content) return;
                var caso = JSON.parse(deBase64(json.content));
                if (!caso || !caso.caso_uid) return;
                casos[caso.caso_uid] = caso;
                casosSha[caso.caso_uid] = json.sha;
                guardarUnCasoLocal(caso.caso_uid);
              });
          });
        }, Promise.resolve()).then(function () {
          if (quedan.length || yaNoExisten.length) {
            guardarCasos();
            if (pantallaActiva("casos")) renderListaCasos();
          }
        });
      })
      .catch(function (e) { ultimoFallo = e.message || T("sync_error_bajar"); })
      .then(function () { pintarEstadoSync(); });
  }

  /* ---------------------------------------------------------------- *
   * Apuntes personales: un único documento continuo -como un Word que se
   * va actualizando, no una lista de notas sueltas- con parámetros e
   * ideas propias, no lo que ya está en Técnicas MIO. Va al mismo
   * repositorio privado que casos/montajes (checklist-mio-datos), en un
   * solo archivo fijo "apuntes/documento.json" -no uno por entrada: no hay
   * "entradas", es un documento vivo con un solo autor, así que no aplica
   * el motivo por el que casos/montajes van repartidos en archivos
   * sueltos (dos personas editando a la vez). Mismo mecanismo de subida
   * automática que el resto (programarEnvio()).
   * ---------------------------------------------------------------- */
  var APUNTE_DOC_KEY = "mio_ionm_apunte_doc_v1";
  var apunteDoc = { secciones: [], carpetas: [], fotos: [], editado_en: null };
  var apunteDocSha = null;
  var apunteDocSinSubir = false;

  function apunteDocPendiente() { return apunteDocSinSubir; }

  // Migra la forma antigua (un solo "texto" de cuando el documento era un
  // único textarea, 07-09-2026 tarde) a la de varias secciones con título
  // (misma noche): sin esto, un dispositivo que todavía tuviera guardado
  // el formato viejo -en localStorage o recién bajado de GitHub- se
  // quedaría con el texto invisible en vez de perderlo del todo, que es
  // justo lo que ya pasó una vez este mismo día con las fotos sin
  // comprimir -no repetir el mismo susto dos veces-.
  // "carpetas" (22-09-2026) es un array de {id, nombre} aparte, y cada
  // sección lleva su "carpeta_id" -"" o sin la clave siquiera significa
  // "Sin carpeta"-: un documento de antes de esa fecha no tiene ninguna de
  // las dos cosas, así que se completan aquí igual que "secciones" arriba.
  function migrarSeccionesApunteDoc(doc) {
    if (!doc) return doc;
    if (!doc.secciones && typeof doc.texto === "string") {
      doc.secciones = doc.texto ? [{ id: uuid(), titulo: "", texto: doc.texto }] : [];
      delete doc.texto;
    }
    if (!doc.secciones) doc.secciones = [];
    if (!doc.carpetas) doc.carpetas = [];
    // Las fotos de antes del 23-09-2026 no llevaban "id" -no hacía falta
    // hasta que las dataURL empezaron a separarse a IndexedDB, que
    // necesita una clave estable por foto para guardarlas y recuperarlas-.
    (doc.fotos || []).forEach(function (f) { if (f && !f.id) f.id = uuid(); });
    return doc;
  }

  /* Fotos de Mis apuntes (24-09-2026): ya no van incrustadas en
     apuntes/documento.json -eso topaba con el límite de 1 MB de la API de
     Contenidos de GitHub al bajarlo (unas 8-9 fotos)-. Cada foto es un
     archivo aparte, `apuntes/fotos/<id>.jpg`, y en el JSON solo queda
     `{ id, nombre, remota }`. Hay dos listas de fotos: las de cada caja
     (`seccion.fotos`) y la lista suelta de abajo (`apunteDoc.fotos`), y las
     dos usan el mismo mecanismo. En este dispositivo la foto vive en
     IndexedDB (clave `apunte:<id>`) y, mientras se usa, en `foto.datos`.
       - `remota: true` = el archivo ya está en el repositorio.
       - Con `datos` y sin `remota` = pendiente de subir (también las fotos
         antiguas que vienen incrustadas en el JSON: se convierten solas en la
         siguiente subida).
       - Con `remota` y sin `datos` = hay que bajarla del repositorio. */
  function listasFotosApunte() {
    var listas = [apunteDoc.fotos || []];
    (apunteDoc.secciones || []).forEach(function (sec) { if (sec.fotos) listas.push(sec.fotos); });
    return listas;
  }
  function todasFotosApunte() {
    return listasFotosApunte().reduce(function (acc, l) { return acc.concat(l); }, []).filter(Boolean);
  }
  function hidratarTodasFotosApunte() {
    return Promise.all(listasFotosApunte().map(function (l) { return hidratarFotosIDB("apunte", l, "datos"); }));
  }
  // Solo las fotos que aún no se han escrito en esta sesión: guardar en cada
  // tecla reescribiría todas las fotos cada vez.
  var apunteFotosEnIDB = {};
  function guardarTodasFotosApunteIDB() {
    return Promise.all(todasFotosApunte().filter(function (f) { return f.datos && !apunteFotosEnIDB[f.id]; })
      .map(function (f) {
        return guardarFotoIDB("apunte:" + f.id, f.datos).then(function () { apunteFotosEnIDB[f.id] = true; })
          .catch(function () { /* mejor esfuerzo */ });
      }));
  }

  // Se resuelve cuando las fotos de apunteDoc ya están hidratadas desde
  // IndexedDB -mismo patrón que casosHidratados()/hidratarCasoIDB(), ver
  // ahí el porqué-. subirApunteDoc() la espera antes de subir.
  var apunteFotosHidratadas = Promise.resolve();
  // ids de fotos que ya no están en ninguna caja pero cuyo archivo sigue en el
  // repositorio: se borran allí en cuanto hay conexión.
  var apunteFotosBorrar = [];

  function cargarApunteDoc() {
    apunteDoc = { secciones: [], carpetas: [], fotos: [], editado_en: null };
    apunteDocSha = null;
    apunteDocSinSubir = false;
    apunteFotosBorrar = [];
    try {
      var g = JSON.parse(localStorage.getItem(APUNTE_DOC_KEY) || "null");
      if (g) {
        apunteDoc = migrarSeccionesApunteDoc(g.doc) || apunteDoc;
        apunteDocSha = g.sha || null;
        apunteDocSinSubir = !!g.sin_subir;
        apunteFotosBorrar = g.fotos_borrar || [];
      }
    } catch (e) { /* sin apuntes guardados o ilegibles */ }
    // En segundo plano, sin retrasar el arranque -ver el mismo criterio en
    // cargarCasos()-; si para cuando termina la pantalla de Mis apuntes
    // sigue abierta, se repinta con las fotos ya puestas.
    // Fotos que aún traigan su dato incrustado (documento guardado antes del
    // 23-09-2026): se pasan a IndexedDB y el documento se reescribe ligero.
    if (todasFotosApunte().some(function (f) { return f.datos; })) {
      guardarTodasFotosApunteIDB().then(guardarApunteDocLocal);
    }
    apunteFotosHidratadas = hidratarTodasFotosApunte().then(repintarGaleriasApunte);
  }

  // Copia del documento SIN los datos de las fotos: lo que va a localStorage
  // (las fotos van a IndexedDB) y lo que se sube a GitHub (las fotos van como
  // archivos aparte). siempre=true quita los datos aunque no haya IndexedDB
  // (para subir); false los deja si no hay dónde separarlos (para local).
  function apunteDocLigero(siempre) {
    var ligero = Object.assign({}, apunteDoc);
    var quitar = function (lista) {
      return (lista || []).map(function (f) {
        var c = Object.assign({}, f);
        if (siempre || window.indexedDB) delete c.datos;
        return c;
      });
    };
    ligero.fotos = quitar(apunteDoc.fotos);
    ligero.secciones = (apunteDoc.secciones || []).map(function (sec) {
      var c = Object.assign({}, sec);
      if (sec.fotos) c.fotos = quitar(sec.fotos);
      return c;
    });
    return ligero;
  }

  function guardarApunteDocLocal() {
    try {
      guardarTodasFotosApunteIDB();
      localStorage.setItem(APUNTE_DOC_KEY, JSON.stringify({
        doc: apunteDocLigero(false), sha: apunteDocSha, sin_subir: apunteDocSinSubir,
        fotos_borrar: apunteFotosBorrar
      }));
    } catch (e) {
      avisoGuardado(T("guardado_error", { error: e.message }), true);
    }
  }

  // Se llama en cada "input" del textarea/al añadir o quitar una foto: es
  // el mismo patrón que el resto de la app (guardar deja "pendiente" y
  // reinicia la cuenta atrás de subida), así que escribir de corrido no
  // dispara una subida por tecla -solo cuando de verdad hay una pausa-.
  var apunteHoraGuardado = "";
  // Línea de estado junto al botón Guardar de Mis apuntes: qué se guardó y a
  // qué hora, y si ya está en el repositorio (solo con la sincronización
  // conectada). Se repinta en cada guardado y en cada cambio del estado de
  // sincronización.
  function pintarEstadoApunteGuardado() {
    var el = document.getElementById("apunte-estado-guardado");
    if (!el) return;
    if (!apunteHoraGuardado) { el.textContent = ""; return; }
    var t = T("apunte_guardado_estado", { hora: apunteHoraGuardado });
    if (syncActivo()) t += T(apunteDocSinSubir ? "apunte_estado_pendiente" : "apunte_estado_subido");
    el.textContent = t;
  }

  function guardarApunteDoc() {
    apunteDoc.editado_en = new Date().toISOString();
    if (!MODO_DEMO) apunteDocSinSubir = true;   // en la demo no hay nada que subir
    guardarApunteDocLocal();
    apunteHoraGuardado = new Date().toLocaleTimeString(localeActual(), { hour: "2-digit", minute: "2-digit" });
    programarEnvio();
    pintarEstadoSync();
    pintarEstadoApunteGuardado();
  }

  function rutaApunteDoc() { return "apuntes/documento.json"; }

  function urlApunteDoc() {
    return "https://api.github.com/repos/" + sync.repo + "/contents/" + rutaApunteDoc();
  }

  function subirApunteDoc(reintento) {
    if (!apunteDocSinSubir) return Promise.resolve();
    // Igual que subirCaso(): si las fotos todavía se están recuperando de
    // IndexedDB, se espera antes de subir -si no, se subiría un documento
    // con las fotos a medias-.
    return apunteFotosHidratadas.then(function () {
      return subirApunteDocYaHidratado(reintento);
    });
  }

  function urlFotoApunte(id) {
    return "https://api.github.com/repos/" + sync.repo + "/contents/apuntes/fotos/" + id + ".jpg";
  }

  // Sube el archivo de una foto. El id no se repite y el contenido de una foto
  // no cambia nunca, así que si el archivo ya existe (409/422: "falta el sha")
  // vale como subida hecha.
  function subirFotoApunte(foto) {
    var partes = String(foto.datos || "").split(",");
    return fetch(urlFotoApunte(foto.id), {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, cabeceras()),
      body: JSON.stringify({ message: "Foto de apuntes", content: partes[1] || "" })
    }).then(function (resp) {
      if (resp.ok || resp.status === 409 || resp.status === 422) { foto.remota = true; return; }
      throw new Error(errorLegible(resp));
    });
  }

  function subirFotosApuntePendientes() {
    return todasFotosApunte().filter(function (f) { return f.datos && !f.remota; })
      .reduce(function (cadena, f) {
        return cadena.then(function () { return subirFotoApunte(f); });
      }, Promise.resolve());
  }

  // Borra del repositorio los archivos de fotos que ya no están en ninguna
  // caja. Un fallo no rompe la subida de los apuntes: se queda en la lista y
  // se reintenta en la siguiente.
  function borrarFotosApunteRemotas() {
    var ids = apunteFotosBorrar.slice();
    return ids.reduce(function (cadena, id) {
      return cadena.then(function () {
        return fetch(urlFotoApunte(id), { headers: cabeceras(), cache: "no-store" })
          .then(function (r) {
            if (r.status === 404) return null;
            if (!r.ok) throw new Error(errorLegible(r));
            return r.json();
          })
          .then(function (json) {
            if (!json) return;
            return fetch(urlFotoApunte(id), {
              method: "DELETE",
              headers: Object.assign({ "Content-Type": "application/json" }, cabeceras()),
              body: JSON.stringify({ message: "Borrar foto de apuntes", sha: json.sha })
            }).then(function (r) { if (!r.ok && r.status !== 404) throw new Error(errorLegible(r)); });
          })
          .then(function () {
            apunteFotosBorrar = apunteFotosBorrar.filter(function (x) { return x !== id; });
          });
      });
    }, Promise.resolve()).catch(function () { /* se reintenta en la próxima subida */ });
  }

  function subirApunteDocYaHidratado(reintento) {
    return subirFotosApuntePendientes().then(function () {
      var cuerpo = {
        message: "Apuntes personales",
        content: aBase64(JSON.stringify(apunteDocLigero(true), null, 2))
      };
      if (apunteDocSha) cuerpo.sha = apunteDocSha;
      return fetch(urlApunteDoc(), {
        method: "PUT",
        headers: Object.assign({ "Content-Type": "application/json" }, cabeceras()),
        body: JSON.stringify(cuerpo)
      }).then(function (resp) {
        if ((resp.status === 409 || resp.status === 422) && !reintento) {
          return fetch(urlApunteDoc(), { headers: cabeceras(), cache: "no-store" })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (json) {
              apunteDocSha = json ? json.sha : null;
              return subirApunteDocYaHidratado(true);
            });
        }
        if (!resp.ok) throw new Error(errorLegible(resp));
        return resp.json().then(function (json) {
          apunteDocSha = json.content.sha;
          apunteDocSinSubir = false;
          return borrarFotosApunteRemotas().then(function () {
            // Si quedó algún borrado sin hacer, sigue "pendiente" para reintentar
            if (apunteFotosBorrar.length) apunteDocSinSubir = true;
            guardarApunteDocLocal();
          });
        });
      });
    });
  }

  // Baja de GitHub las fotos que el documento da por subidas y este
  // dispositivo no tiene. Y al revés: si aquí hay fotos sin subir -las de antes
  // de este cambio, que iban incrustadas-, marca el documento como pendiente
  // para que la siguiente subida las convierta en archivos.
  function descargarFotosApunteFaltantes() {
    if (!syncActivo() || navigator.onLine === false) return Promise.resolve();
    var faltan = todasFotosApunte().filter(function (f) { return f.remota && !f.datos; });
    return faltan.reduce(function (cadena, f) {
      return cadena.then(function () {
        return fetch(urlFotoApunte(f.id), { headers: cabeceras(), cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (json) {
            if (!json || !json.content) return;
            f.datos = "data:image/jpeg;base64," + json.content.replace(/\n/g, "");
            apunteFotosEnIDB[f.id] = true;
            return guardarFotoIDB("apunte:" + f.id, f.datos).catch(function () { /* mejor esfuerzo */ });
          })
          .catch(function () { /* se reintenta en la próxima bajada */ });
      });
    }, Promise.resolve()).then(function () {
      repintarGaleriasApunte();
      if (!apunteDocSinSubir && todasFotosApunte().some(function (f) { return f.datos && !f.remota; })) {
        apunteDocSinSubir = true;
        guardarApunteDocLocal();
        programarEnvio();
      }
    });
  }

  function bajarApunteDoc() {
    if (!syncActivo() || navigator.onLine === false) return Promise.resolve();
    // Con cambios locales sin subir, no se pisan: igual que casos/montajes.
    if (apunteDocSinSubir) return Promise.resolve();
    return fetch(urlApunteDoc(), { headers: cabeceras(), cache: "no-store" })
      .then(function (resp) {
        if (resp.status === 404) return null;   // todavía no hay apuntes
        if (!resp.ok) throw new Error(errorLegible(resp));
        return resp.json();
      })
      .then(function (json) {
        if (!json || json.sha === apunteDocSha) return;
        var doc = JSON.parse(deBase64(json.content));
        apunteDoc = migrarSeccionesApunteDoc(doc) || apunteDoc;
        apunteDocSha = json.sha;
        // El documento nuevo llega sin los datos de las fotos: se recuperan
        // de IndexedDB y, las que falten, de GitHub.
        apunteFotosHidratadas = hidratarTodasFotosApunte();
        guardarApunteDocLocal();
        if (pantallaActiva("apuntes")) renderApunteDoc();
      })
      .then(function () { return apunteFotosHidratadas; })
      .then(descargarFotosApunteFaltantes)
      .catch(function (e) { ultimoFallo = e.message || T("sync_error_bajar"); })
      .then(function () { pintarEstadoSync(); });
  }

  /* ---------------------------------------------------------------- *
   * Sincronización de montajes
   *
   * Un archivo por montaje, misma mecánica que los casos: se sube el que ha
   * cambiado, se baja solo lo que trae sha distinto, y lo que está pendiente
   * de subir no se pisa nunca al bajar.
   * ---------------------------------------------------------------- */
  function rutaMontaje(uid) { return "montajes/" + uid + ".json"; }

  function urlMontaje(uid) {
    return "https://api.github.com/repos/" + sync.repo + "/contents/" + rutaMontaje(uid);
  }

  function subirMontaje(uid, reintento) {
    var m = montajes[uid];
    if (!m) { delete montajesSinSubir[uid]; return Promise.resolve(); }
    var cuerpo = {
      message: "Montaje " + (campo(m, "nombre") || uid),
      content: aBase64(JSON.stringify(m, null, 2))
    };
    if (montajesSha[uid]) cuerpo.sha = montajesSha[uid];
    return fetch(urlMontaje(uid), {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, cabeceras()),
      body: JSON.stringify(cuerpo)
    }).then(function (resp) {
      if ((resp.status === 409 || resp.status === 422) && !reintento) {
        return fetch(urlMontaje(uid), { headers: cabeceras(), cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (json) {
            montajesSha[uid] = json ? json.sha : null;
            return subirMontaje(uid, true);
          });
      }
      if (!resp.ok) throw new Error(errorLegible(resp));
      return resp.json().then(function (json) {
        montajesSha[uid] = json.content.sha;
        delete montajesSinSubir[uid];
        guardarMontajes();
      });
    });
  }

  function subirMontajesPendientes() {
    if (!syncActivo()) return Promise.resolve();
    return montajesPendientes().reduce(function (cadena, uid) {
      return cadena.then(function () { return subirMontaje(uid); });
    }, Promise.resolve());
  }

  function eliminarMontajeRemoto_(uid, sha, reintento) {
    return fetch(urlMontaje(uid), {
      method: "DELETE",
      headers: Object.assign({ "Content-Type": "application/json" }, cabeceras()),
      body: JSON.stringify({ message: "Borrar montaje " + uid, sha: sha })
    }).then(function (resp) {
      if (resp.status === 404) return;
      if ((resp.status === 409 || resp.status === 422) && !reintento) {
        return fetch(urlMontaje(uid), { headers: cabeceras(), cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (json) {
            if (!json) return;
            return eliminarMontajeRemoto_(uid, json.sha, true);
          });
      }
      if (!resp.ok) throw new Error(errorLegible(resp));
    });
  }

  function borrarMontajesPendientes() {
    if (!syncActivo()) return Promise.resolve();
    return montajesBorradosPend().reduce(function (cadena, uid) {
      return cadena.then(function () {
        return eliminarMontajeRemoto_(uid, montajesBorrados[uid]).then(function () {
          delete montajesBorrados[uid];
          guardarMontajes();
        });
      });
    }, Promise.resolve());
  }

  /* Un montaje que existe aquí, no tiene sha (nunca subió) y tampoco está en
     el repositorio es genuinamente nuevo de este dispositivo: se marca para
     subir. Es lo que hace que lo sembrado al arrancar acabe llegando al
     repositorio sin arriesgarse a pisar lo que otro haya editado. */
  function marcarMontajesNuevos(presentes) {
    var marcados = 0;
    Object.keys(montajes).forEach(function (uid) {
      if (montajesSha[uid] || presentes[uid] || montajesBorrados[uid]) return;
      if (montajesSinSubir[uid]) return;
      montajesSinSubir[uid] = true;
      marcados++;
    });
    return marcados;
  }

  function bajarMontajes() {
    if (!syncActivo() || navigator.onLine === false) return Promise.resolve();
    var url = "https://api.github.com/repos/" + sync.repo + "/contents/montajes";
    return fetch(url, { headers: cabeceras(), cache: "no-store" })
      .then(function (resp) {
        if (resp.status === 404) return [];   // todavía no hay ninguno
        if (!resp.ok) throw new Error(errorLegible(resp));
        return resp.json();
      })
      .then(function (listado) {
        var presentes = {};
        (listado || []).forEach(function (f) {
          if (f.type === "file" && /\.json$/.test(f.name)) {
            presentes[f.name.replace(/\.json$/, "")] = true;
          }
        });
        // Lo que dejó de existir allí se retira también aquí, igual que con
        // los casos: solo si tenía sha, o sea si alguna vez se supo que
        // estaba en GitHub.
        var yaNoExisten = Object.keys(montajes).filter(function (uid) {
          return montajesSha[uid] && !presentes[uid] &&
                 !montajesSinSubir[uid] && !montajesBorrados[uid];
        });
        yaNoExisten.forEach(function (uid) {
          delete montajes[uid];
          delete montajesSha[uid];
        });

        var quedan = (listado || []).filter(function (f) {
          if (f.type !== "file" || !/\.json$/.test(f.name)) return false;
          var uid = f.name.replace(/\.json$/, "");
          if (montajesSinSubir[uid] || montajesBorrados[uid]) return false;
          return montajesSha[uid] !== f.sha;
        });
        return quedan.reduce(function (cadena, f) {
          return cadena.then(function () {
            return fetch(f.url, { headers: cabeceras(), cache: "no-store" })
              .then(function (r) { return r.ok ? r.json() : null; })
              .then(function (json) {
                if (!json || !json.content) return;
                var m = JSON.parse(deBase64(json.content));
                if (!m || !m.montaje_uid) return;
                montajes[m.montaje_uid] = m;
                montajesSha[m.montaje_uid] = json.sha;
              });
          });
        }, Promise.resolve()).then(function () {
          var nuevos = marcarMontajesNuevos(presentes);
          if (quedan.length || yaNoExisten.length || nuevos) {
            if (!activo || !montajes[activo]) activo = Object.keys(montajes)[0] || null;
            traducirEscenarios();
            guardarMontajes();
            renderTodo();
          }
        });
      })
      .catch(function (e) { ultimoFallo = e.message || T("sync_error_bajar"); })
      .then(function () { pintarEstadoSync(); });
  }

  /* ---------------------------------------------------------------- *
   * Editor de material propio
   * ---------------------------------------------------------------- */
  var dlg = document.getElementById("dlg-material");
  var editandoId = null;

  function rellenarDatalists() {
    var dlCat = document.getElementById("lista-categorias");
    dlCat.innerHTML = "";
    categoriasExistentes().forEach(function (c) {
      var o = document.createElement("option");
      o.value = c;
      dlCat.appendChild(o);
    });
  }

  // Desplegable de colores con el nombre traducido, más "sin color"
  function rellenarSelectColor(sel, claveVacio) {
    var previo = sel.value;
    sel.innerHTML = "";
    var vacio = document.createElement("option");
    vacio.value = "";
    vacio.textContent = T(claveVacio);
    sel.appendChild(vacio);
    Object.keys(PALETA).forEach(function (nombre) {
      var o = document.createElement("option");
      o.value = nombre;
      o.textContent = T("color_" + nombre);
      sel.appendChild(o);
    });
    var ninguno = document.createElement("option");
    ninguno.value = "ninguno";
    ninguno.textContent = T("sin_fondo");
    if (sel.id === "mat-fondo" || sel.id === "et-fondo") sel.appendChild(ninguno);
    // Un color a medida guardado como hex sigue siendo una opción válida
    if (previo && !sel.querySelector('option[value="' + previo + '"]')) {
      var libre = document.createElement("option");
      libre.value = previo;
      libre.textContent = previo;
      sel.appendChild(libre);
    }
    sel.value = previo;
  }

  // Desplegable de formas de borde. Con clave vacía incluye "Como la etiqueta"
  function rellenarSelectBorde(sel, conHerencia) {
    var previo = sel.value;
    sel.innerHTML = "";
    if (conHerencia) {
      var heredado = document.createElement("option");
      heredado.value = "";
      heredado.textContent = T("como_etiqueta");
      sel.appendChild(heredado);
    }
    Object.keys(BORDES).forEach(function (clave) {
      var o = document.createElement("option");
      o.value = clave;
      o.textContent = T("borde_" + clave);
      sel.appendChild(o);
    });
    sel.value = previo;
  }

  function rellenarSelectEtiquetas(sel, valor) {
    sel.innerHTML = "";
    ETIQUETAS.forEach(function (et) {
      var o = document.createElement("option");
      o.value = et.id;
      o.textContent = campo(et, "nombre");
      sel.appendChild(o);
    });
    if (valor && ETQ[valor]) sel.value = valor;
  }

  // Chip de ejemplo que se repinta al tocar cualquier desplegable
  function refrescarPreviaMaterial() {
    var previa = document.getElementById("mat-previa");
    previa.removeAttribute("style");
    previa.textContent = document.getElementById("mat-nombre").value.trim() || T("ejemplo");
    aplicarEstilo(previa, estiloDe({
      etiqueta: document.getElementById("mat-etiqueta").value,
      borde: document.getElementById("mat-borde").value || undefined,
      color: document.getElementById("mat-color").value || undefined,
      fondo: document.getElementById("mat-fondo").value || undefined
    }, null));
  }

  function abrirEditorMaterial(id) {
    editandoId = id || null;
    var item = id ? ITEMS[id] : null;
    rellenarDatalists();
    rellenarSelectColor(document.getElementById("mat-color"), "como_etiqueta");
    rellenarSelectColor(document.getElementById("mat-fondo"), "como_etiqueta");
    rellenarSelectBorde(document.getElementById("mat-borde"), true);
    var etActual = item ? (etiquetaDe(item, null) || {}).id : (ETIQUETAS[0] || {}).id;
    rellenarSelectEtiquetas(document.getElementById("mat-etiqueta"), etActual);
    document.getElementById("dlg-titulo").textContent = T(item ? "dlg_mat_editar" : "dlg_mat_nuevo");
    document.getElementById("mat-nombre").value = item ? campo(item, "nombre") : "";
    document.getElementById("mat-categoria").value = item ? item.categoria : "";
    document.getElementById("mat-borde").value = item ? (item.borde || "") : "";
    document.getElementById("mat-color").value = item ? (item.color || "") : "";
    document.getElementById("mat-fondo").value = item ? (item.fondo || "") : "";
    document.getElementById("mat-nota").value = item ? campo(item, "nota") : "";
    document.getElementById("mat-sinentrada").checked = item ? !!item.sin_entrada : false;
    document.getElementById("mat-borrar").hidden = !item;
    document.getElementById("mat-error").hidden = true;
    refrescarPreviaMaterial();
    dlg.showModal();
    enfocarSinTeclado(document.getElementById("mat-nombre"));
  }

  function guardarMaterial() {
    var nombre = document.getElementById("mat-nombre").value.trim();
    var categoria = document.getElementById("mat-categoria").value.trim();
    var etiqueta = document.getElementById("mat-etiqueta").value;
    var err = document.getElementById("mat-error");

    if (!nombre || !categoria || !etiqueta) {
      err.textContent = T("mat_obligatorios");
      err.hidden = false;
      return;
    }

    var datos = {
      nombre: nombre,
      categoria: categoria,
      etiqueta: etiqueta,
      borde: document.getElementById("mat-borde").value || undefined,
      color: document.getElementById("mat-color").value || undefined,
      fondo: document.getElementById("mat-fondo").value || undefined,
      nota: document.getElementById("mat-nota").value.trim() || undefined,
      sin_entrada: document.getElementById("mat-sinentrada").checked || undefined
    };

    if (editandoId) {
      var existente = catalogoUsuario.filter(function (i) { return i.id === editandoId; })[0];
      if (existente) Object.assign(existente, datos);
    } else {
      datos.id = idLibre(nombre);
      catalogoUsuario.push(datos);
    }

    reconstruirCatalogo();
    guardarEstado();
    renderCatalogo();
    renderCajas();
    renderResumen();
    dlg.close();
  }

  function borrarMaterial() {
    if (!editandoId) return;
    var item = ITEMS[editandoId];
    // ¿Está colocado en algún escenario?
    var usos = 0;
    Object.keys(montajes).forEach(function (eid) {
      var asig = montajes[eid].asignaciones || {};
      Object.keys(asig).forEach(function (caja) {
        Object.keys(asig[caja]).forEach(function (ent) {
          if (asig[caja][ent] === editandoId) usos++;
        });
      });
      if ((montajes[eid].extras || []).indexOf(editandoId) !== -1) usos++;
    });

    var msg = T("mat_borrar_conf", { nombre: campo(item, "nombre") });
    if (usos) msg += T("mat_borrar_usos", { n: usos });
    if (!confirm(msg)) return;

    catalogoUsuario = catalogoUsuario.filter(function (i) { return i.id !== editandoId; });
    // Quitarlo del catálogo lo quita de TODOS los montajes donde estuviera,
    // no solo del activo, así que hay que marcar para subir cada uno que se
    // haya tocado: cada montaje es un archivo aparte del repositorio.
    Object.keys(montajes).forEach(function (eid) {
      var tocado = false;
      var asig = montajes[eid].asignaciones || {};
      Object.keys(asig).forEach(function (caja) {
        Object.keys(asig[caja]).forEach(function (ent) {
          if (asig[caja][ent] !== editandoId) return;
          delete asig[caja][ent];
          // La etiqueta elegida para esa entrada se queda sin dueño
          if (montajes[eid].etiquetas) delete montajes[eid].etiquetas[caja + "/" + ent];
          tocado = true;
        });
      });
      if (montajes[eid].extras && montajes[eid].extras.indexOf(editandoId) !== -1) {
        montajes[eid].extras = montajes[eid].extras.filter(function (x) { return x !== editandoId; });
        tocado = true;
      }
      if (tocado) guardarMontaje(montajes[eid]);
    });

    reconstruirCatalogo();
    guardarEstado();
    renderCatalogo();
    renderCajas();
    renderResumen();
    dlg.close();
  }

  document.getElementById("btn-nuevo-material").addEventListener("click", function () {
    abrirEditorMaterial(null);
  });
  document.getElementById("mat-guardar").addEventListener("click", guardarMaterial);
  document.getElementById("mat-borrar").addEventListener("click", borrarMaterial);
  document.getElementById("mat-cancelar").addEventListener("click", function () { dlg.close(); });
  ["mat-etiqueta", "mat-borde", "mat-color", "mat-fondo"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", refrescarPreviaMaterial);
  });
  document.getElementById("mat-nombre").addEventListener("input", refrescarPreviaMaterial);
  document.getElementById("mat-nueva-etiqueta").addEventListener("click", function () {
    abrirGestorEtiquetas(null);
  });

  /* ---------------------------------------------------------------- *
   * Gestor de etiquetas
   *
   * Se pueden crear nuevas, editar cualquiera (también las de fábrica: la
   * versión editada se guarda con el mismo id y la sustituye) y borrarlas.
   * Al borrar una hay que reasignar el material que la usaba, así que se
   * pregunta a dónde va antes de quitarla.
   * ---------------------------------------------------------------- */
  var dlgEt = document.getElementById("dlg-etiquetas");
  var editandoEtiqueta = null;

  function itemsConEtiqueta(etId) {
    return Object.keys(ITEMS).filter(function (id) {
      var et = etiquetaDe(ITEMS[id], null);
      return et && et.id === etId;
    });
  }

  function usosEnEscenarios(etId) {
    var n = 0;
    Object.keys(montajes).forEach(function (eid) {
      var mapa = montajes[eid].etiquetas || {};
      Object.keys(mapa).forEach(function (k) { if (mapa[k] === etId) n++; });
    });
    return n;
  }

  function refrescarPreviaEtiqueta() {
    var previa = document.getElementById("et-previa");
    previa.removeAttribute("style");
    previa.textContent = document.getElementById("et-nombre").value.trim() || T("ejemplo");
    aplicarEstilo(previa, {
      borde: document.getElementById("et-borde").value,
      color: document.getElementById("et-color").value,
      fondo: document.getElementById("et-fondo").value
    });
  }

  function renderListaEtiquetas() {
    var cont = document.getElementById("etiquetas-lista");
    cont.innerHTML = "";
    ETIQUETAS.forEach(function (et) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip chip-etiqueta-lista" + (editandoEtiqueta === et.id ? " editando" : "");
      chip.textContent = campo(et, "nombre");
      aplicarEstilo(chip, { borde: et.borde, color: et.color, fondo: et.fondo });
      var usos = itemsConEtiqueta(et.id).length;
      chip.title = T("et_usos_tit", { n: usos }) + (et.propia ? "" : T("et_es_fabrica_tit"));
      var cuenta = document.createElement("span");
      cuenta.className = "etiqueta-usos";
      cuenta.textContent = usos;
      chip.appendChild(cuenta);
      chip.addEventListener("click", function () { cargarEtiquetaEnFormulario(et.id); });
      cont.appendChild(chip);
    });
  }

  function cargarEtiquetaEnFormulario(id) {
    editandoEtiqueta = id || null;
    var et = id ? ETQ[id] : null;
    rellenarSelectColor(document.getElementById("et-color"), "sin_color");
    rellenarSelectColor(document.getElementById("et-fondo"), "sin_fondo");
    rellenarSelectBorde(document.getElementById("et-borde"), false);
    document.getElementById("et-titulo").textContent = et
      ? T("et_editar", { nombre: campo(et, "nombre") }) + (et.propia ? "" : T("et_de_fabrica"))
      : T("et_nueva");
    document.getElementById("et-nombre").value = et ? campo(et, "nombre") : "";
    document.getElementById("et-borde").value = et ? (et.borde || "solido") : "solido";
    document.getElementById("et-color").value = et ? (et.color || "") : "gris";
    document.getElementById("et-fondo").value = et ? (et.fondo || "") : "ninguno";
    // Sin precio se deja en blanco, no en 0: "todavía no lo sé" y "es gratis"
    // no son lo mismo, y el resumen los distingue.
    document.getElementById("et-precio").value =
      et && typeof et.precio === "number" ? et.precio : "";
    document.getElementById("et-fungible").checked = et ? et.fungible !== false : true;
    document.getElementById("et-manta").checked = et ? !!et.manta : false;
    document.getElementById("et-doble").checked = et ? !!et.doble : false;
    document.getElementById("et-borrar").hidden = !et;
    document.getElementById("et-error").hidden = true;
    refrescarPreviaEtiqueta();
    renderListaEtiquetas();
  }

  function abrirGestorEtiquetas(id) {
    cargarEtiquetaEnFormulario(id);
    if (!dlgEt.open) dlgEt.showModal();
    enfocarSinTeclado(document.getElementById("et-nombre"));
  }

  function guardarEtiqueta() {
    var nombre = document.getElementById("et-nombre").value.trim();
    var err = document.getElementById("et-error");
    if (!nombre) {
      err.textContent = T("et_sin_nombre");
      err.hidden = false;
      return;
    }
    // Dos etiquetas con el mismo nombre se sumarían juntas en el resumen
    var choque = etiquetaPorNombre(nombre);
    if (choque && choque.id !== editandoEtiqueta) {
      err.textContent = T("et_repetida", { nombre: campo(choque, "nombre") });
      err.hidden = false;
      return;
    }

    var precioTxt = document.getElementById("et-precio").value.trim();
    var precio = precioTxt === "" ? null : parseFloat(precioTxt.replace(",", "."));
    if (precio !== null && (isNaN(precio) || precio < 0)) {
      err.textContent = T("et_precio_malo");
      err.hidden = false;
      return;
    }

    var datos = {
      id: editandoEtiqueta || idLibreEtiqueta(nombre),
      nombre: nombre,
      borde: document.getElementById("et-borde").value,
      color: document.getElementById("et-color").value,
      fondo: document.getElementById("et-fondo").value,
      fungible: document.getElementById("et-fungible").checked,
      manta: document.getElementById("et-manta").checked,
      doble: document.getElementById("et-doble").checked
    };
    // Sin precio no se guarda la clave, para que se distinga de un 0 real
    if (precio !== null) datos.precio = precio;

    var existente = etiquetasUsuario.filter(function (e) { return e.id === datos.id; })[0];
    if (existente) {
      Object.assign(existente, datos);
      // Vaciar el precio tiene que poder deshacer uno puesto antes, y
      // Object.assign no quita una clave que ya no viene: se quita a mano.
      if (precio === null) delete existente.precio;
    } else {
      etiquetasUsuario.push(datos);
    }
    // Si estaba borrada y se vuelve a guardar, deja de estarlo
    etiquetasBorradas = etiquetasBorradas.filter(function (x) { return x !== datos.id; });

    reconstruirEtiquetas();
    reconstruirCatalogo();
    guardarEstado();
    renderTodo();
    cargarEtiquetaEnFormulario(datos.id);
  }

  function borrarEtiqueta() {
    if (!editandoEtiqueta) return;
    var et = ETQ[editandoEtiqueta];
    if (!et) return;
    if (ETIQUETAS.length < 2) {
      var err = document.getElementById("et-error");
      err.textContent = T("et_minimo");
      err.hidden = false;
      return;
    }

    var afectados = itemsConEtiqueta(et.id);
    var enEscenarios = usosEnEscenarios(et.id);
    var destino = ETIQUETAS.filter(function (e) { return e.id !== et.id; })[0];

    var msg = T("et_borrar_conf", { nombre: campo(et, "nombre") });
    if (afectados.length || enEscenarios) {
      msg += T("et_borrar_afecta", {
        materiales: afectados.length, colocaciones: enEscenarios,
        destino: campo(destino, "nombre")
      });
    }
    if (!et.propia) msg += T("et_borrar_fabrica");
    if (!confirm(msg)) return;

    // Reasignar el material propio que la usaba
    catalogoUsuario.forEach(function (item) {
      if (item.etiqueta === et.id) item.etiqueta = destino.id;
    });
    // Y las colocaciones que la habían elegido a mano
    Object.keys(montajes).forEach(function (eid) {
      var mapa = montajes[eid].etiquetas;
      if (!mapa) return;
      Object.keys(mapa).forEach(function (k) {
        if (mapa[k] === et.id) mapa[k] = destino.id;
      });
    });
    // El material de fábrica no se puede reescribir: se le fija el destino
    // como override permanente creando una entrada propia mínima.
    afectados.forEach(function (itemId) {
      var item = ITEMS[itemId];
      if (item.propio || item.etiqueta !== et.id) return;
      var copia = Object.assign({}, item, { etiqueta: destino.id });
      delete copia.propio;
      catalogoUsuario.push(copia);
    });

    etiquetasUsuario = etiquetasUsuario.filter(function (e) { return e.id !== et.id; });
    if (ETIQUETAS_BASE.some(function (e) { return e.id === et.id; })) {
      etiquetasBorradas.push(et.id);
    }

    reconstruirEtiquetas();
    reconstruirCatalogo();
    guardarEstado();
    renderTodo();
    cargarEtiquetaEnFormulario(null);
  }

  document.getElementById("btn-etiquetas").addEventListener("click", function () {
    abrirGestorEtiquetas(null);
  });
  document.getElementById("et-guardar").addEventListener("click", guardarEtiqueta);
  document.getElementById("et-borrar").addEventListener("click", borrarEtiqueta);
  document.getElementById("et-nueva").addEventListener("click", function () {
    cargarEtiquetaEnFormulario(null);
    enfocarSinTeclado(document.getElementById("et-nombre"));
  });
  document.getElementById("et-cerrar").addEventListener("click", function () {
    dlgEt.close();
    // El editor de material puede haberse quedado abierto detrás
    if (dlg.open) {
      rellenarSelectEtiquetas(document.getElementById("mat-etiqueta"),
        document.getElementById("mat-etiqueta").value);
      refrescarPreviaMaterial();
    }
  });
  ["et-borde", "et-color", "et-fondo"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", refrescarPreviaEtiqueta);
  });
  document.getElementById("et-nombre").addEventListener("input", refrescarPreviaEtiqueta);
  // Color a medida: se añade como opción y queda elegido en «color del borde»
  document.getElementById("et-color-libre").addEventListener("input", function () {
    var sel = document.getElementById("et-color");
    var hex = this.value;
    if (!sel.querySelector('option[value="' + hex + '"]')) {
      var o = document.createElement("option");
      o.value = hex;
      o.textContent = hex;
      sel.appendChild(o);
    }
    sel.value = hex;
    refrescarPreviaEtiqueta();
  });

  /* ---------------------------------------------------------------- *
   * Casos: interfaz
   *
   * Dos ventanas: el listado ("Mis casos") y la ficha. La ficha enseña
   * arriba el cierre rápido -lo que se rellena siempre- y esconde el resto
   * en un bloque plegado, para poder cerrar un caso desde el móvil sin
   * bajar por una pantalla infinita.
   * ---------------------------------------------------------------- */
  var dlgCasos = document.getElementById("pantalla-casos");
  var dlgCaso = document.getElementById("dlg-caso");
  var casoAbierto = null;      // copia de trabajo del caso que se edita
  var casoEsNuevo = false;
  var camposCaso = {};         // clave -> control del formulario
  // El chip-fila de "tecnicas_alteradas" depende en vivo de lo marcado en
  // "tecnicas_realizadas": cada vez que ese cambia, se avisa a quien se haya
  // apuntado aquí para que se repinte (ver campoCaso, t === "tecnicas_alt").
  var oyentesTecnicasRealizadas = [];
  function notificarTecnicasRealizadas() {
    oyentesTecnicasRealizadas.forEach(function (fn) { fn(); });
  }
  // Oculta un campo entero de la ficha entera mientras una técnica concreta
  // no esté marcada en "tecnicas_realizadas" -a diferencia de dependeDe
  // (que depende de una casilla o un desplegable de la propia ficha), esto
  // depende de otro campo de tipo "tecnicas". Usado por "Umbral EMG de
  // tornillos pediculares" y sus niveles/lados: sin mapeo_raices_tornillos
  // marcado, ninguno de los dos tiene sentido (pedido por el usuario, 05-09-2026).
  function ocultarSegunTecnica(div, tecnicaId) {
    var actualizar = function () {
      var realizadas = camposCaso.tecnicas_realizadas || [];
      div.hidden = realizadas.indexOf(tecnicaId) === -1;
    };
    actualizar();
    oyentesTecnicasRealizadas.push(actualizar);
  }
  // Campos con "dependeDe" (p. ej. "Tipo de alerta" depende de la casilla
  // "alerta"): campoCaso() los apunta aquí al construirse, y al final de
  // renderFichaCaso() se conecta cada uno con su casilla -ocultos hasta que
  // se marque, y se muestran/ocultan en vivo si se toca la casilla-.
  var condicionalesPendientes = [];

  var OPCIONES = {
    sexo: ["mujer", "hombre", "otro"],
    // Correlato postoperatorio de cada grupo de alarmas (29-09-2026).
    correlato_evol: ["sin_deficit", "recupera", "estable", "empeora", "pendiente", "no_valorable"],
    correlato_momento: ["inmediato", "72h", "alta", "1m", "3m", "6m"],
    // Quién rellena la ficha, no el nivel de supervisión clínica -eso ya no
    // se distingue en ningún campo-.
    rol: ["adjunto1", "adjunto2", "residente"],
    // "pendiente_planificar" (26-09-2026): caso apuntado pero sin preparar
    // todavía; va primero por ser el paso anterior a "preparado".
    estado: ["pendiente_planificar", "preparado", "cerrado", "cancelado"],
    sino: ["si", "no"],
    // El tipo de anestesia ya dice si hubo relajante y durante cuánto tiempo
    // (R-TIVA = relajantes toda la cirugía) o si fue libre de opioides (ALO),
    // así que los campos sueltos de relajante quedaron redundantes y se
    // quitaron.
    anestesia: ["tiva", "rtiva", "dxm", "alo", "gas"],
    // Supino y prono primero, que es lo más frecuente. Los cuatro "volteo"
    // son su propia opción cada uno -no una casilla aparte- porque la
    // dirección (y si es doble) cambia el montaje a mitad de cirugía; antes
    // era un único "Volteo" genérico y el sentido solo quedaba en el texto
    // libre de detalle.
    posicion: ["supino", "prono", "lateral", "park_bench",
               "volteo_sp", "volteo_ps", "volteo_doble_sps", "volteo_doble_psp", "otros"],
    // "PR" (demo-congreso B3.F2): positivo reversible. Solo un valor más de la
    // lista; los casos ya guardados no cambian.
    concordancia: ["VP", "FP", "VN", "FN", "PR"],
    // Nació como texto libre y se cerró a lista el 28-09-2026 (pedido del
    // usuario) para poder contarlo; es el mismo dato que el Cierre del
    // Registro (REG_RES_ESPERABLE, mismos ids). Lo escrito antes a mano se
    // conserva: ver resultadoEsperableId().
    resultado_esperable: ["similar", "empeoramiento", "mejoria", "indeterminado"],
    // Antes texto libre "Recuperación de la señal"; desde el 28-09-2026 es el
    // mismo dato que el Resultado del Cierre del Registro (REG_RESULTADO).
    recuperacion_senal: ["sin_cambios", "transitorios", "persistentes"],
    // Nuevo el 28-09-2026: la evolución en lista, el texto queda de detalle.
    evolucion_postop: ["sin_deficit", "deficit_transitorio", "deficit_permanente", "deficit_pendiente", "no_valorable"],
    dificultad: ["1", "2", "3", "4", "5"],
    // Lista cerrada y corta a propósito, como los tipos de cirugía: sirve
    // para agrupar y contar. La anatomía patológica real o el nivel exacto
    // van en su propio campo de texto.
    diagnostico: ["ecc", "ecd", "ecl", "escoliosis", "loe_med", "loe_st", "loe_it",
                  "parotida", "mav", "hipofisis", "chiari", "jannetta", "fractvert", "loe_vert"]
  };

  /* Los 9 puntos de la ficha: los 8 primeros son <details> plegados por
     defecto (uno por "g"), cronológicos según se van sabiendo los datos; el
     9º -Guardar/Cerrar/Borrar/Volver- es la barra de acciones fija del
     diálogo, fuera de esta lista porque no es un campo.
     "dependeDe" oculta el campo hasta que se cumpla una condición (ver
     "condicionalesPendientes" en renderFichaCaso): así "Hubo alerta" o
     "Cambios respecto al plan" no ensucian la ficha cuando no aplican. Puede
     ser el id de una casilla (depende de que esté marcada) o un objeto
     { c, v } con el id de un desplegable y el valor que debe tener, como
     "Motivo de cancelación" con estado === "cancelado". */
  var CAMPOS_CASO = [
    // 1. Identificación / Trazabilidad
    { g: "traza", c: "ID_Caso", t: "ro" },
    { g: "traza", c: "equipo_id", t: "equipo", ay: "caso_equipo_id_ay" },
    { g: "traza", c: "estado", t: "sel", o: "estado" },
    { g: "traza", c: "motivo_cancelacion", t: "area", dependeDe: { c: "estado", v: "cancelado" } },
    { g: "traza", c: "fecha", t: "date", ay: "caso_fecha_ay" },
    { g: "traza", c: "nombre_caso", t: "text", ay: "caso_nombre_caso_ay" },
    { g: "traza", c: "centro", t: "text" },
    { g: "traza", c: "hora_inicio", t: "time" },
    { g: "traza", c: "hora_fin", t: "time" },

    // 2. Paciente
    { g: "paciente", c: "edad", t: "num" },
    { g: "paciente", c: "sexo", t: "sel", o: "sexo" },
    { g: "paciente", c: "servicio_id", t: "cat", cat: "servicios" },
    { g: "paciente", c: "antecedentes_relevantes", t: "area", rows: 8, ay: "caso_antecedentes_relevantes_ay" },
    { g: "paciente", c: "informes_imagenes", t: "imagenes_montaje", ay: "caso_informes_imagenes_ay" },

    // 3. Cirugía
    { g: "cirugia", c: "diagnostico", t: "sel", o: "diagnostico" },
    // Absorbe también lo que antes era "Región / nivel": es el mismo dato
    // -qué parte se operó-, y tenerlo en dos campos separados duplicaba lo
    // que había que escribir.
    { g: "cirugia", c: "anatomia_patologica", t: "text", ay: "caso_anatomia_patologica_ay" },
    // Texto libre y no el catálogo de Intervenciones: el usuario quiere
    // escribirla directamente, sin elegir de una lista cerrada. El catálogo
    // (con su código de hospital) sigue existiendo y editable en Catálogos,
    // simplemente ya no está enlazado a este campo.
    { g: "cirugia", c: "intervencion", t: "text" },
    { g: "cirugia", c: "posicion", t: "sel", o: "posicion" },
    { g: "cirugia", c: "posicion_detalle", t: "area", ay: "caso_posicion_detalle_ay" },
    { g: "cirugia", c: "navegacion", t: "sel", o: "sino", ay: "caso_navegacion_ay" },
    { g: "cirugia", c: "otros_datos_quirurgicos", t: "area" },

    // 4. Anestesia
    { g: "anestesia", c: "tipo_anestesia", t: "sel", o: "anestesia" },
    { g: "anestesia", c: "tipo_anestesia_detalle", t: "text", ay: "caso_tipo_anestesia_detalle_ay" },
    { g: "anestesia", c: "tof_monitorizado", t: "sel", o: "sino" },
    // Los eventos "An" del Registro (hora + qué), en espejo (28-09-2026).
    { g: "anestesia", c: "eventos_anestesia", t: "eventos_an", ay: "caso_eventos_anestesia_ay" },
    { g: "anestesia", c: "incidencias_anestesicas", t: "area" },

    // 5. Montaje / Técnicas, reestructurado en 3 sub-apartados el
    // 10-09-2026 (pedido del usuario) -"Cajas y entradas", "Material" y
    // "Técnicas", ver el HTML a mano de cada uno en renderFichaCaso()-.
    // "sub" dice a cuál de los tres pertenece cada campo; el orden dentro
    // de cada sub-apartado es el orden de este array.
    // "Técnicas" es su propio apartado desde el 28-09-2026 (pedido del
    // usuario); antes era el tercer sub-apartado de "Montaje / Técnicas".
    { g: "tecnicas", c: "tecnicas_realizadas", t: "tecnicas" },
    // Pedido por el usuario, 05-09-2026: para cada técnica ya marcada como
    // realizada, poder anotar cómo se hizo de verdad en este caso concreto
    // -campos propios por técnica desde el 10-09-2026, ver
    // PARAMETROS_TECNICAS-. Va después de "tecnicas_realizadas" en la
    // lista de campos por el mismo motivo que tecnicas_alteradas: depende
    // de esa lista via oyentesTecnicasRealizadas, así que tiene que
    // construirse después.
    { g: "tecnicas", c: "tecnicas_parametros", t: "tecnicas_parametros" },
    // Antes "Notas de Montaje/Técnicas" -absorbía lo que era "Pares
    // craneales monitorizados"-, renombrada "Notas de las Técnicas" el
    // 10-09-2026 al mudarse dentro del sub-apartado "Técnicas".
    { g: "tecnicas", c: "notas_montaje_tecnicas", t: "area" },
    // Nueva el 10-09-2026, pedida junto con el resto de la reestructuración:
    // por si hay algo que decir del montaje en sí -no de una técnica
    // concreta ni del material-, sin tener que forzarlo dentro de
    // "Notas de las Técnicas".
    { g: "montaje", sub: "cajas", c: "notas_montaje", t: "area" },
    { g: "montaje", sub: "material", c: "material_previsto", t: "material_ro" },
    // "Coste del material" se cuelga justo después de material_previsto
    // desde dentro del propio bucle de renderFichaCaso() -no es un campo de
    // CAMPOS_CASO porque no hay nada que guardar, es una vista en vivo con
    // calcularCoste(), igual que "Cajas necesarias"-. Buscar
    // "def.c === \"material_previsto\"" en renderFichaCaso().
    // Nueva el 10-09-2026, mismo motivo que "Notas del montaje" pero para
    // el material.
    { g: "montaje", sub: "material", c: "notas_material", t: "area" },
    //
    // "Material realmente usado" suspendido a petición del usuario
    // (06-09-2026): con el montaje del caso editándose siempre en el
    // Organizador (ver "Crear caso"), lo que de verdad se usó ya es el
    // montaje real, no una copia aparte que había que corregir a mano. Si
    // se añade algo que no estaba previsto, se coloca en su caja y se anota
    // en "Notas del material". El campo `material_real` sigue existiendo
    // en el modelo (`volcarMontajeEnCaso()`, el informe en PDF) por los
    // casos reales antiguos que ya lo tenían relleno -no se borra nada,
    // solo se deja de mostrar aquí-.
    // { g: "montaje", sub: "material", c: "material_real", t: "material", ay: "caso_material_real_ay" },
    // Pedido por el usuario, 05-09-2026: fotos de cómo quedó el montaje en el
    // software del equipo (p. ej. la pantalla del Inomed), para poder
    // consultarlas en un caso futuro parecido. Van dentro del propio caso
    // -no en archivo aparte-, igual que material_previsto/asignaciones: un
    // caso lo edita una sola persona a la vez, no hace falta la separación
    // por archivo que sí necesitan los montajes compartidos (ver "El
    // repositorio de datos" en CLAUDE.md). Cada imagen se comprime en el
    // navegador antes de guardarse (ver comprimirImagen()) para no disparar
    // el tamaño de lo que viaja a GitHub en cada sincronización. Sin "sub"
    // a propósito -renombrada el 10-09-2026 para dejar claro que cubre las
    // tres cosas, así que se queda fuera de los tres sub-apartados-.
    { g: "montaje", c: "imagenes_montaje", t: "imagenes_montaje", ay: "caso_imagenes_montaje_ay" },

    // 6. Desarrollo intraoperatorio
    // Un solo cuadro grande en vez de OP BSL y CL BSL sueltos: en la
    // practica real ya se escribian juntos, con las incidencias intraop
    // en medio contando la evolucion de una a otra -separarlas en dos cajas
    // rompia justo lo que se queria contar de corrido.
    // Basales (25-09-2026): la misma tabla que el Registro intraoperatorio,
    // guardada en caso.registro_intraop -ver campoCaso(), t "basales_reg"-.
    { g: "desarrollo", c: "basales_registro", t: "basales_reg", ay: "caso_basales_registro_ay" },
    // E2 · Mapeo del Registro en espejo (GRID, cortical, subcortical, nervio
    // periférico; las raíces ya tienen su campo propio más abajo).
    { g: "desarrollo", c: "mapeo_registro", t: "mapeo_reg", ay: "caso_mapeo_registro_ay" },
    { g: "desarrollo", c: "resumen_monitorizacion", t: "area", rows: 12, ay: "caso_resumen_monitorizacion_ay" },
    // Pedido por el usuario, 05-09-2026: ambas cajas solo aparecen si "Mapeo de
    // raíces y tornillos" está marcada en Técnicas realizadas -sin esa
    // técnica, ni el desplegable de niveles ni la nota de umbral tienen
    // nada que hacer aquí- (ver ocultarSegunTecnica en campoCaso).
    { g: "desarrollo", c: "umbral_raices_niveles", t: "umbral_raices", ay: "caso_umbral_raices_niveles_ay" },
    { g: "desarrollo", c: "umbral_tornillos_pediculares", t: "area", ay: "caso_umbral_tornillos_pediculares_ay" },
    // "¿Hubo cambios respecto al plan?" y su detalle, fuera de la ficha el
    // 28-09-2026 (pedido del usuario: no los usa). Los datos antiguos se
    // quedan en el JSON (y en el CSV/Sheet); el único texto real se pasó al
    // Resumen de la monitorización.
    { g: "desarrollo", c: "alerta", t: "check" },
    // Las alarmas son las de G · Alarmas del Registro, en espejo (28-09-2026,
    // pedido del usuario: lo de quirófano se recoge en el Registro y se ve
    // igual aquí). Sustituyen a "Tipo de alerta" y "Medida correctora" de
    // texto libre: esos dos campos se siguen escribiendo, pero solos, a partir
    // de las alarmas, al guardar el caso (ver alarmasEnCaso()), para el CSV y
    // el Sheet. Los textos de antes se pasaron al Resumen de la monitorización.
    { g: "desarrollo", c: "alarmas_registro", t: "alarmas_reg", dependeDe: "alerta", ay: "caso_alarmas_registro_ay" },
    { g: "desarrollo", c: "recuperacion_senal", t: "sel", o: "recuperacion_senal", ay: "caso_recuperacion_senal_ay" },
    { g: "desarrollo", c: "resultado_esperable", t: "sel", o: "resultado_esperable", ay: "caso_resultado_esperable_ay" },
    // Depende en vivo de lo que esté marcado en "tecnicas_realizadas" -ver
    // oyentesTecnicasRealizadas-, así que tiene que ir después de esa
    // lista, nunca antes.
    { g: "desarrollo", c: "tecnicas_alteradas", t: "tecnicas_alt", ay: "caso_tecnicas_alteradas_ay" },
    { g: "desarrollo", c: "incidencias_tecnicas", t: "area", rows: 4 },
    // "Equipo" de texto libre retirado de la ficha el 25-09-2026 (pedido del
    // usuario): lo sustituye el Equipo de cajas (equipo_id, en Identificación).
    // Estaba vacío en todos los casos reales salvo uno ("I"). El dato viejo se
    // queda en el JSON, sin usarse.

    // 7. Resultado / Correlación clínica
    { g: "resultado", c: "evolucion_postop", t: "sel", o: "evolucion_postop", ay: "caso_evolucion_postop_ay" },
    { g: "resultado", c: "deficit_postoperatorio", t: "area", rows: 4 },
    // Una fila por alarma o grupo de alarmas del mismo sustrato, con su
    // correlato postoperatorio en listas cerradas (29-09-2026).
    { g: "resultado", c: "correlato_alarmas", t: "correlato_alarmas", ay: "caso_correlato_alarmas_ay" },
    // Debajo lleva una propuesta calculada con alarmas + resultado de la
    // señal + evolución (propuestaConcordancia()), que se aplica con un botón.
    { g: "resultado", c: "concordancia", t: "sel", o: "concordancia", ay: "caso_concordancia_ay" },

    // 8. Docencia / Meta
    { g: "formacion", c: "rol", t: "sel", o: "rol" },
    { g: "formacion", c: "supervisor", t: "text" },
    { g: "formacion", c: "dificultad_1a5", t: "sel", o: "dificultad" },
    { g: "formacion", c: "aprendizaje_clave", t: "area", rows: 8 },
    // "par": las dos casillas en la misma fila (28-09-2026, pedido del usuario).
    { g: "formacion", c: "caso_destacado", t: "check", par: true },
    { g: "formacion", c: "hacer_seguimiento", t: "check", par: true },
    { g: "formacion", c: "notas", t: "area" }
  ];
  var GRUPOS_CASO = ["traza", "paciente", "cirugia", "anestesia", "montaje", "tecnicas", "desarrollo", "resultado", "formacion"];

  /* Concordancia propuesta: cambio en la monitorización (alerta o resultado
     de la señal con cambios) frente a déficit nuevo (cualquiera de los tres
     "déficit nuevo..."). Sin evolución o "no valorable", no propone nada.
     Cambios recuperados sin déficit = PR (positivo reversible); alerta sin
     resultado de la señal y sin déficit es ambiguo (FP o PR): nada. */
  function propuestaConcordancia(p) {
    if (!p.evol || p.evol === "no_valorable") return "";
    var deficit = p.evol !== "sin_deficit";
    var cambio = p.alerta || p.senal === "transitorios" || p.senal === "persistentes";
    if (!cambio) return deficit ? "FN" : "VN";
    if (p.senal === "persistentes") return deficit ? "VP" : "FP";
    if (p.senal === "transitorios") return deficit ? "VP" : "PR";
    return deficit ? "VP" : "";
  }
  // Propuestas discutibles (validado con el usuario, 29-09-2026): hubo cambio
  // y hay déficit, pero los cambios se recuperaron o no consta el resultado
  // de la señal. Se proponen igual (VP), entre interrogantes.
  function concordanciaDudosa(p) {
    var cambio = p.alerta || p.senal === "transitorios" || p.senal === "persistentes";
    return !!(p.evol && p.evol !== "no_valorable" && p.evol !== "sin_deficit" && cambio && p.senal !== "persistentes");
  }
  // Qué datos llevaron a la propuesta, para que se vea la regla aplicada
  // (auditoría 28-09-2026, C7): «Cambios persistentes + Déficit nuevo…».
  function motivoConcordancia(p) {
    var senal = p.senal ? opcionTexto("recuperacion_senal", p.senal)
      : T(p.alerta ? "caso_conc_alerta" : "caso_conc_sin_alerta");
    return senal + " + " + opcionTexto("evolucion_postop", p.evol);
  }

  /* Grupos de alarmas para la correlación postoperatoria: misma técnica y
     mismo criterio = mismo sustrato (varias HFD de un músculo a distintas
     horas no se multiplican). La clave del grupo es la que guarda
     correlato_alarmas: si se corrige la técnica o el criterio de una alarma,
     cambia de grupo y su correlato se vuelve a elegir. */
  var repintarCorrelato = null;
  function gruposAlarmas(d) {
    var grupos = [], porClave = {};
    (d.alarmas || []).forEach(function (a, i) {
      if (!alarmaEscrita(a)) return;
      var tec = String(a.modalidad || "").trim(), crit = String(a.criterio || "").trim();
      var clave = (tec + "|" + crit).toLowerCase();
      var g = porClave[clave];
      if (!g) { g = porClave[clave] = { clave: clave, tec: tec, crit: crit, alarmas: [] }; grupos.push(g); }
      g.alarmas.push({ a: a, n: i + 1 });
    });
    return grupos;
  }

  // Concordancia de un grupo: su recuperación en quirófano (todas «Sí» =
  // recuperada; alguna «No» = persistente) frente a su correlato. Las
  // discutibles, entre interrogantes, como en la propuesta del caso.
  function concordanciaGrupo(g, evol) {
    if (!evol || evol === "no_valorable" || evol === "pendiente") return "";
    var rec = g.alarmas.map(function (x) { return x.a.recup || ""; });
    var persistente = rec.indexOf("N") !== -1;
    var recuperada = !persistente && rec.every(function (r) { return r === "S"; });
    var parcial = !persistente && !recuperada && rec.every(function (r) { return r === "S" || r === "P"; });
    if (evol !== "sin_deficit") return recuperada || parcial ? "¿VP?" : "VP";
    if (persistente) return "FP";
    if (recuperada) return "PR";
    if (parcial) return "¿PR?";
    return "";
  }

  // Correlato elegido para un grupo, en un caso cualquiera (no solo el abierto).
  function correlatoDe(c, g) { return (c.correlato_alarmas || {})[g.clave] || {}; }

  // Una fila por grupo con todo ya resuelto: para el Sheet, el informe y el
  // CSV. Listas en id (como el resto del Sheet); criterio en id si es de la
  // lista y, si no, el texto.
  function filasCorrelato(c) {
    var d = c.registro_intraop;
    if (!d || !d.alarmas) return [];
    return gruposAlarmas(d).map(function (g) {
      var e = correlatoDe(c, g);
      var horas = g.alarmas.map(function (x) { return x.a.hora; }).filter(Boolean).sort();
      var recs = [];
      g.alarmas.forEach(function (x) { if (x.a.recup && recs.indexOf(x.a.recup) === -1) recs.push(x.a.recup); });
      return {
        alarmas: g.alarmas.map(function (x) { return "A" + x.n; }).join(", "),
        n_alarmas: g.alarmas.length, tecnica: g.tec, criterio: g.crit,
        hora_inicio: horas[0] || "", hora_fin: horas[horas.length - 1] || "",
        recuperacion: recs.join("/"), evolucion: e.evol || "", valorado: e.momento || "",
        concordancia: concordanciaGrupo(g, e.evol)
      };
    });
  }

  // «t-MEP MSD · deltoides · Pérdida · 08:59–09:35 → Sin déficit relacionado (72 h) · PR»
  function textoCorrelato(f) {
    var rango = f.hora_inicio + (f.hora_fin && f.hora_fin !== f.hora_inicio ? "–" + f.hora_fin : "");
    var t = [f.tecnica, regTextoLista(REG_CRITERIO_AL, f.criterio), rango].filter(Boolean).join(" · ");
    if (f.evolucion) t += " → " + opcionTexto("correlato_evol", f.evolucion) + (f.valorado ? " (" + opcionTexto("correlato_momento", f.valorado) + ")" : "");
    if (f.concordancia) t += " · " + f.concordancia;
    return t;
  }

  // Concordancia del caso a partir de sus grupos: la más informativa, en
  // este orden (un VP en cualquier grupo hace VP el caso).
  var ORDEN_CONC_GRUPOS = ["VP", "¿VP?", "FP", "PR", "¿PR?"];
  function concordanciaDeGrupos(concs) {
    for (var i = 0; i < ORDEN_CONC_GRUPOS.length; i++) {
      if (concs.indexOf(ORDEN_CONC_GRUPOS[i]) !== -1) return ORDEN_CONC_GRUPOS[i];
    }
    return "";
  }
  var repintarPropuestaCaso = null;

  function filaCorrelato(g) {
    var fila = regNodo("div", "caso-correlato-fila");
    var horas = g.alarmas.map(function (x) { return x.a.hora; }).filter(Boolean).sort();
    var rango = horas.length ? horas[0] + (horas[horas.length - 1] !== horas[0] ? "–" + horas[horas.length - 1] : "") : "";
    var tit = regNodo("div", "caso-correlato-tit");
    tit.appendChild(regNodo("b", null, g.alarmas.map(function (x) { return "A" + x.n; }).join(", ")));
    tit.appendChild(document.createTextNode(" · " + [g.tec, regTextoLista(REG_CRITERIO_AL, g.crit), rango].filter(Boolean).join(" · ")));
    fila.appendChild(tit);
    var ctr = regNodo("div", "caso-correlato-ctr");
    var actual = function () { return (casoAbierto.correlato_alarmas || {})[g.clave] || {}; };
    var conc = regNodo("span", "caso-correlato-conc");
    var pintarConc = function () {
      var p = concordanciaGrupo(g, actual().evol);
      conc.textContent = p;
      conc.title = p ? opcionTexto("concordancia", p.replace(/[¿?]/g, "")) : "";
    };
    [["evol", "correlato_evol"], ["momento", "correlato_momento"]].forEach(function (k) {
      var sel = document.createElement("select");
      sel.setAttribute("aria-label", T("caso_correlato_" + k[0]));
      var vacia = document.createElement("option");
      vacia.value = "";
      vacia.textContent = T("caso_correlato_" + k[0]) + "…";
      sel.appendChild(vacia);
      OPCIONES[k[1]].forEach(function (v) {
        var o = document.createElement("option");
        o.value = v;
        o.textContent = opcionTexto(k[1], v);
        sel.appendChild(o);
      });
      sel.value = actual()[k[0]] || "";
      sel.addEventListener("change", function () {
        var mapa = casoAbierto.correlato_alarmas || (casoAbierto.correlato_alarmas = {});
        var e = mapa[g.clave] || (mapa[g.clave] = {});
        e[k[0]] = sel.value;
        if (!e.evol && !e.momento) delete mapa[g.clave];
        pintarConc();
        if (repintarPropuestaCaso) repintarPropuestaCaso();
      });
      ctr.appendChild(sel);
    });
    pintarConc();
    ctr.appendChild(conc);
    fila.appendChild(ctr);
    return fila;
  }

  // Texto libre de antes -> id de la lista, solo cuando la equivalencia es
  // exacta ("Sin cambios.", "Similar al estado previo"...). Lo que lleva
  // detalle (qué déficit, qué lado) se deja tal cual para no perderlo: el
  // desplegable lo ofrece como una opción más hasta que se cambie a mano.
  function resultadoEsperableId(v) {
    if (!v || OPCIONES.resultado_esperable.indexOf(v) !== -1) return v;
    var s = String(v).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[.\s]+$/, "").trim();
    if (/^(sin cambios|similar al (estado )?previo|similar a previsto: similar al estado previo)$/.test(s)) return "similar";
    if (/^(empeoramiento|mejoria|indeterminado)$/.test(s)) return s;
    return v;
  }

  function opcionTexto(grupo, valor) {
    var clave = "opc_" + grupo + "_" + valor;
    var t = T(clave);
    return t === clave ? valor : t;
  }

  /* Rótulo de una técnica en los chips de pantalla: el nombre corto si lo
     tiene («TVcR» en vez de «Reflejo trigémino-vocal (TVcR)»; 29-09-2026,
     pedido del usuario: los reflejos ocupaban mucho). El nombre completo y
     la descripción van en el title (ratón encima) y en data-ayuda (mantener
     pulsado en el móvil, ver el globo de ayuda). En papel -hoja impresa,
     informe- sigue el nombre completo. */
  function ayudaTecnica(t) {
    var d = campo(t, "descripcion"), e = campo(t, "etiqueta");
    return d ? e + " — " + d : e;
  }
  function rotularChipTecnica(chip, t) {
    chip.textContent = campo(t, "corta") || campo(t, "etiqueta");
    chip.title = ayudaTecnica(t);
    chip.setAttribute("data-ayuda", chip.title);
    return chip;
  }

  /* Chips de técnicas en la ficha del caso: reparte una lista ya filtrada
     en tres cestas -monitorización, reflejos, mapeo-, conservando el orden
     del catálogo dentro de cada una. Los reflejos (Blink Reflex, RBC, los
     H-R, los trigeminales...) llevan "reflejo": true en data/surgeries.js
     aunque su "grupo" siga siendo "monitorizacion" -ese campo lo usa
     también la ventana Técnicas, que solo separa monitorización/mapeo y no
     se toca aquí-. */
  function bloquesTecnicas(lista) {
    return {
      monitor: lista.filter(function (t) { return t.grupo === "monitorizacion" && !t.reflejo; }),
      reflejos: lista.filter(function (t) { return t.reflejo; }),
      mapeo: lista.filter(function (t) { return t.grupo === "mapeo"; })
    };
  }

  // Cuelga los chips de los tres bloques en "contenedor", con una fila de
  // espacio (.chip-espacio) entre los que tengan contenido.
  function anadirChipsAgrupados(contenedor, lista, crearChip) {
    var bloques = bloquesTecnicas(lista);
    var primero = true;
    [bloques.monitor, bloques.reflejos, bloques.mapeo].forEach(function (grupo) {
      if (!grupo.length) return;
      if (!primero) {
        var espacio = document.createElement("div");
        espacio.className = "chip-espacio";
        contenedor.appendChild(espacio);
      }
      primero = false;
      grupo.forEach(function (t) { contenedor.appendChild(crearChip(t)); });
    });
  }

  /* ---------------------------------------------------------------- *
   * Campos de "Cómo se realizó cada técnica" (10-09-2026), uno por tipo
   * de PARAMETROS_TECNICAS ("numero", "texto", "seleccion",
   * "multiseleccion", "si_no" -ver la cabecera de data/parametros-
   * tecnicas.js-). Cada uno deja registrado su control en mapaControles
   * -{ el, evento } por campo.id- para que pintarCamposTecnicaReal()
   * pueda enganchar ahí los campos que dependan de él vía "visible_si".
   * ---------------------------------------------------------------- */
  function tecParRegistrarControl(mapaControles, campoId, el, evento) {
    mapaControles[campoId] = { el: el, evento: evento };
  }

  function tecParTitulo(cdef) {
    return [cdef.nota, cdef.fuente].filter(Boolean).join("\n") || null;
  }

  function tecParCampoNumero(almacen, cdef, mapaControles) {
    var wrap = document.createElement("label");
    wrap.className = "tecpar-campo";
    var tit = tecParTitulo(cdef);
    if (tit) wrap.title = tit;
    var etq = document.createElement("span");
    etq.textContent = cdef.etiqueta + (cdef.unidad ? " (" + cdef.unidad + ")" : "");
    wrap.appendChild(etq);
    var fila = document.createElement("span");
    fila.className = "tecpar-campo-fila";
    var inp = document.createElement("input");
    inp.type = "text";
    inp.value = almacen[cdef.id] || "";
    inp.addEventListener("input", function () { almacen[cdef.id] = inp.value; });
    fila.appendChild(inp);
    if (cdef.unidades) {
      var sel = document.createElement("select");
      sel.className = "tecpar-unidad";
      cdef.unidades.forEach(function (u) {
        var o = document.createElement("option");
        o.value = u; o.textContent = u;
        sel.appendChild(o);
      });
      sel.value = almacen[cdef.id + "_unidad"] || cdef.unidades[0];
      almacen[cdef.id + "_unidad"] = sel.value;
      sel.addEventListener("change", function () { almacen[cdef.id + "_unidad"] = sel.value; });
      fila.appendChild(sel);
    }
    wrap.appendChild(fila);
    tecParRegistrarControl(mapaControles, cdef.id, inp, "input");
    return wrap;
  }

  function tecParCampoTexto(almacen, cdef, mapaControles) {
    var wrap = document.createElement("label");
    wrap.className = "tecpar-campo tecpar-campo-ancho";
    var tit = tecParTitulo(cdef);
    if (tit) wrap.title = tit;
    var etq = document.createElement("span");
    etq.textContent = cdef.etiqueta;
    wrap.appendChild(etq);
    // "incidencias" es la nota libre de cada técnica -sucesora directa del
    // textarea suelto que había antes de este rediseño, y donde
    // migrarTecnicasParametros() aterriza lo que no encuentra un campo
    // tipado claro-: más cómoda como textarea que como input de una línea,
    // aunque su "tipo" siga siendo "texto" como cualquier otro campo libre.
    var inp = document.createElement(cdef.id === "incidencias" ? "textarea" : "input");
    if (cdef.id === "incidencias") inp.rows = 2; else inp.type = "text";
    inp.value = almacen[cdef.id] || "";
    inp.addEventListener("input", function () { almacen[cdef.id] = inp.value; });
    wrap.appendChild(inp);
    tecParRegistrarControl(mapaControles, cdef.id, inp, "input");
    return wrap;
  }

  function tecParCampoSeleccion(almacen, cdef, mapaControles) {
    var wrap = document.createElement("label");
    wrap.className = "tecpar-campo";
    var tit = tecParTitulo(cdef);
    if (tit) wrap.title = tit;
    var etq = document.createElement("span");
    etq.textContent = cdef.etiqueta;
    wrap.appendChild(etq);
    var control, evento;
    if (cdef.permite_otro) {
      control = document.createElement("input");
      control.type = "text";
      var dlId = "dl-tecpar-" + cdef.id + "-" + Math.random().toString(36).slice(2, 8);
      control.setAttribute("list", dlId);
      var dl = document.createElement("datalist");
      dl.id = dlId;
      (cdef.opciones || []).forEach(function (op) {
        var o = document.createElement("option");
        o.value = op;
        dl.appendChild(o);
      });
      // Se escribe el texto; se guarda el id si coincide con una opción.
      if (almacen[cdef.id]) almacen[cdef.id] = tecParIdDe(cdef, almacen[cdef.id]);
      control.value = tecParTextoDe(cdef, almacen[cdef.id]) || "";
      control.addEventListener("input", function () { almacen[cdef.id] = tecParIdDe(cdef, control.value); });
      wrap.appendChild(control);
      wrap.appendChild(dl);
      evento = "input";
    } else {
      control = document.createElement("select");
      var blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "—";
      control.appendChild(blank);
      (cdef.opciones || []).forEach(function (op, i) {
        var o = document.createElement("option");
        o.value = (cdef.ids || [])[i] || op; o.textContent = op;
        control.appendChild(o);
      });
      if (almacen[cdef.id]) almacen[cdef.id] = tecParIdDe(cdef, almacen[cdef.id]);
      var guardadoSel = almacen[cdef.id] || "";
      if (guardadoSel && !(cdef.ids || []).some(function (id) { return id === guardadoSel; })) {
        // Un valor que ya no está en la lista se ofrece igual, no se pierde.
        var oLeg = document.createElement("option");
        oLeg.value = guardadoSel; oLeg.textContent = guardadoSel;
        control.appendChild(oLeg);
      }
      control.value = guardadoSel;
      control.addEventListener("change", function () { almacen[cdef.id] = control.value; });
      wrap.appendChild(control);
      evento = "change";
    }
    tecParRegistrarControl(mapaControles, cdef.id, control, evento);
    return wrap;
  }

  function tecParCampoSiNo(almacen, cdef, mapaControles) {
    var wrap = document.createElement("label");
    wrap.className = "tecpar-campo check";
    var tit = tecParTitulo(cdef);
    if (tit) wrap.title = tit;
    var control = document.createElement("input");
    control.type = "checkbox";
    control.checked = !!almacen[cdef.id];
    control.addEventListener("change", function () { almacen[cdef.id] = control.checked; });
    wrap.appendChild(control);
    var etq = document.createElement("span");
    etq.textContent = cdef.etiqueta;
    wrap.appendChild(etq);
    tecParRegistrarControl(mapaControles, cdef.id, control, "change");
    return wrap;
  }

  // Mismos chips activables que "Técnicas realizadas"/"tecnicas_alt", más
  // -si permite_otro- una miniforma para añadir chips propios sueltos
  // (mismo patrón de quitar con × que el resto de la app).
  function tecParCampoMultiseleccion(almacen, cdef) {
    var valorArr = Array.isArray(almacen[cdef.id]) ? almacen[cdef.id] : (almacen[cdef.id] = []);
    // Textos de antes -> ids (en el sitio: es el mismo array guardado).
    for (var iv = 0; iv < valorArr.length; iv++) valorArr[iv] = tecParIdDe(cdef, valorArr[iv]);
    var idsOp = (cdef.opciones || []).map(function (op, i) { return (cdef.ids || [])[i] || op; });
    var wrap = document.createElement("div");
    wrap.className = "tecpar-campo tecpar-campo-ancho";
    var tit = tecParTitulo(cdef);
    if (tit) wrap.title = tit;
    var etq = document.createElement("span");
    etq.textContent = cdef.etiqueta;
    wrap.appendChild(etq);
    var fila = document.createElement("div");
    fila.className = "chip-fila tecpar-chips";
    var pintar = function () {
      fila.textContent = "";
      (cdef.opciones || []).forEach(function (op, io) {
        var idOp = idsOp[io];
        var chip = document.createElement("span");
        chip.className = "chip chip-extra" + (valorArr.indexOf(idOp) !== -1 ? " activo" : "");
        chip.textContent = op;
        chip.addEventListener("click", function () {
          var i = valorArr.indexOf(idOp);
          if (i === -1) valorArr.push(idOp); else valorArr.splice(i, 1);
          pintar();
        });
        fila.appendChild(chip);
      });
      valorArr.filter(function (v) { return idsOp.indexOf(v) === -1; }).forEach(function (extra) {
        var chip = document.createElement("span");
        chip.className = "chip chip-extra activo";
        chip.textContent = extra;
        var x = document.createElement("button");
        x.type = "button";
        x.className = "chip-quitar";
        x.textContent = "✕";
        x.title = T("tecpar_quitar_tit");
        x.addEventListener("click", function (e) {
          e.stopPropagation();
          var i = valorArr.indexOf(extra);
          if (i !== -1) valorArr.splice(i, 1);
          pintar();
        });
        chip.appendChild(x);
        fila.appendChild(chip);
      });
    };
    pintar();
    wrap.appendChild(fila);
    if (cdef.permite_otro) {
      var filaOtro = document.createElement("span");
      filaOtro.className = "tecpar-otro";
      var inpOtro = document.createElement("input");
      inpOtro.type = "text";
      inpOtro.placeholder = T("tecpar_otro_ph");
      var btnOtro = document.createElement("button");
      btnOtro.type = "button";
      btnOtro.textContent = T("tecpar_otro_anadir");
      var anadir = function () {
        var v = tecParIdDe(cdef, inpOtro.value.trim());
        if (v && valorArr.indexOf(v) === -1) { valorArr.push(v); inpOtro.value = ""; pintar(); }
      };
      btnOtro.addEventListener("click", anadir);
      inpOtro.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); anadir(); } });
      filaOtro.appendChild(inpOtro);
      filaOtro.appendChild(btnOtro);
      wrap.appendChild(filaOtro);
    }
    return wrap;
  }

  function tecParCampo(almacen, cdef, mapaControles) {
    if (cdef.tipo === "numero") return tecParCampoNumero(almacen, cdef, mapaControles);
    if (cdef.tipo === "seleccion") return tecParCampoSeleccion(almacen, cdef, mapaControles);
    if (cdef.tipo === "si_no") return tecParCampoSiNo(almacen, cdef, mapaControles);
    if (cdef.tipo === "multiseleccion") return tecParCampoMultiseleccion(almacen, cdef);
    return tecParCampoTexto(almacen, cdef, mapaControles);
  }

  // Todos los campos de una técnica, agrupados en sus 3 secciones
  // (general/estimulación/registro -sin encabezado para "general", es la
  // que menos campos trae-). "visible_si" se resuelve en vivo: cuando el
  // campo del que depende cambia, se reevalúa si el dependiente se
  // muestra u oculta -"igual_a" compara el id de la opción, "mayor_que"
  // compara como número; un valor no numérico da "false", nunca rompe-.
  function pintarCamposTecnicaReal(tecId, datos) {
    var tecDef = definicionTecPar(tecId);
    var cont = document.createElement("div");
    cont.className = "tecpar-campos";

    if (!tecDef) {
      // Técnica sin definición propia: histórica o desactivada (reflejo_h,
      // jaw jerk, silent period, Material Qx). Una sola nota libre en vez
      // de una rejilla que no se puede rellenar de fábrica.
      var labN = document.createElement("label");
      labN.className = "tecpar-campo tecpar-campo-ancho";
      var etqN = document.createElement("span");
      etqN.textContent = T("tecpar_notas");
      var areaN = document.createElement("textarea");
      areaN.rows = 2;
      areaN.value = datos.general.incidencias || "";
      areaN.addEventListener("input", function () { datos.general.incidencias = areaN.value; });
      labN.appendChild(etqN);
      labN.appendChild(areaN);
      cont.appendChild(labN);
      return cont;
    }

    var mapaControles = {};
    var condicionales = [];

    function valorTecActual(campoId) {
      if (datos.general[campoId] !== undefined) return datos.general[campoId];
      if (datos.estimulacion[campoId] !== undefined) return datos.estimulacion[campoId];
      return datos.registro[campoId];
    }

    ["general", "estimulacion", "registro"].forEach(function (secId) {
      var campos = tecDef.secciones[secId] || [];
      if (!campos.length) return;
      var secDiv = document.createElement("div");
      secDiv.className = "tecpar-seccion";
      if (secId !== "general") {
        var h = document.createElement("h5");
        h.className = "tecpar-titulo-seccion";
        h.textContent = T("tecpar_sec_" + secId);
        secDiv.appendChild(h);
      }
      var grid = document.createElement("div");
      grid.className = "tecpar-grid";
      var almacen = datos[secId];
      campos.forEach(function (cdef) {
        var el = tecParCampo(almacen, cdef, mapaControles);
        if (cdef.visible_si) condicionales.push({ el: el, condicion: cdef.visible_si });
        grid.appendChild(el);
      });
      secDiv.appendChild(grid);
      cont.appendChild(secDiv);
    });

    var defPorId = {};
    ["general", "estimulacion", "registro"].forEach(function (secId) {
      (tecDef.secciones[secId] || []).forEach(function (cd) { defPorId[cd.id] = cd; });
    });
    condicionales.forEach(function (item) {
      var ctrl = mapaControles[item.condicion.campo];
      var evaluar = function () {
        // "igual_a" es un id de opción (desde el 29-09-2026, C8).
        var v = tecParIdDe(defPorId[item.condicion.campo], valorTecActual(item.condicion.campo));
        var mostrar = "igual_a" in item.condicion ? v === item.condicion.igual_a
          : "mayor_que" in item.condicion ? Number(v) > item.condicion.mayor_que
          : true;
        item.el.hidden = !mostrar;
      };
      if (ctrl) ctrl.el.addEventListener(ctrl.evento, evaluar);
      evaluar();
    });

    return cont;
  }

  /* Construye un campo del formulario y deja el control en camposCaso.
     Devuelve el bloque .campo listo para colgar. */
  function campoCaso(def, valor) {
    var div = document.createElement("div");
    div.className = "campo";
    var control;

    if (def.dependeDe) {
      div.classList.add("campo-condicional");
      condicionalesPendientes.push({ div: div, de: def.dependeDe });
    }

    if (def.t === "check") {
      if (def.par) div.classList.add("campo-par");
      var lab = document.createElement("label");
      lab.className = "check";
      control = document.createElement("input");
      control.type = "checkbox";
      control.id = "caso-f-" + def.c;
      control.checked = !!valor;
      lab.appendChild(control);
      var sp = document.createElement("span");
      sp.textContent = T("caso_" + def.c);
      lab.appendChild(sp);
      div.appendChild(lab);
      camposCaso[def.c] = control;
      return div;
    }

    // Técnicas realizadas y las dos tablas de material van dentro de un
    // <details> plegado por defecto (pedido por el usuario, 05-09-2026): son las
    // tres listas más largas de la ficha y no hace falta verlas siempre
    // abiertas. Por eso no llevan la etiqueta <label> normal -su summary la
    // sustituye-.
    var esPlegableMontaje = def.t === "tecnicas" || def.t === "material_ro" || def.t === "material" || def.t === "tecnicas_parametros";
    if (!esPlegableMontaje) {
      var lab2 = document.createElement("label");
      lab2.textContent = T("caso_" + def.c);
      lab2.setAttribute("for", "caso-f-" + def.c);
      div.appendChild(lab2);
    }

    if (def.t === "tecnicas") {
      // Mismos chips que en la tarjeta de técnicas: una sola forma de marcar.
      // Antes era su propio <details> anidado dentro del sub-apartado
      // "Técnicas" -pedido el 05-09-2026-; desde el 23-09-2026 (pedido del
      // usuario, "que aparezcan directamente, no que tenga que abrir otro
      // desplegable") ya no es un pliegue aparte, sale en cuanto se abre
      // "Técnicas" -mismo criterio que ya se aplicó a "Material" el
      // 10-09-2026-. "Cómo se realizó cada técnica" y "Notas de las
      // Técnicas" se quedan tal cual, sin tocar.
      var elegidas = (valor || []).slice();
      camposCaso[def.c] = elegidas;
      var campTec = document.createElement("div");
      campTec.className = "caso-material-bloque";
      var tituloTec = document.createElement("h4");
      tituloTec.className = "caso-cajas-detalle-titulo";
      tituloTec.textContent = T("caso_" + def.c);
      campTec.appendChild(tituloTec);
      var fila = document.createElement("div");
      fila.className = "chip-fila";
      // Se ofrecen las activas, más las que ya tuviera el caso aunque estén
      // desactivadas: si no, no habría manera de quitarlas.
      var ofrecidas = TECNICAS.filter(function (t) {
        return t.activa !== false || elegidas.indexOf(t.id) !== -1;
      });
      anadirChipsAgrupados(fila, ofrecidas, function (t) {
        var chip = document.createElement("span");
        chip.className = "chip chip-extra" + (elegidas.indexOf(t.id) !== -1 ? " activo" : "") +
          (t.activa === false ? " desactivada" : "");
        rotularChipTecnica(chip, t);
        chip.addEventListener("click", function () {
          var i = elegidas.indexOf(t.id);
          if (i === -1) elegidas.push(t.id); else elegidas.splice(i, 1);
          chip.classList.toggle("activo", i === -1);
          if (def.c === "tecnicas_realizadas") notificarTecnicasRealizadas();
        });
        return chip;
      });
      campTec.appendChild(fila);
      div.appendChild(campTec);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      return div;
    }

    if (def.t === "tecnicas_alt") {
      // Mismos chips que "tecnicas", pero solo con las que estén marcadas
      // ahora mismo en "tecnicas_realizadas" -no todo el catálogo-: no tiene
      // sentido marcar una alteración en una técnica que no se hizo. Se
      // repinta cada vez que esa lista cambia (notificarTecnicasRealizadas).
      var alteradas = (valor || []).slice();
      camposCaso[def.c] = alteradas;
      var filaAlt = document.createElement("div");
      filaAlt.className = "chip-fila";
      var pintarAlteradas = function () {
        var realizadas = camposCaso.tecnicas_realizadas || [];
        // Una técnica que se desmarcó de "realizadas" no puede seguir
        // marcada aquí como alterada.
        for (var i = alteradas.length - 1; i >= 0; i--) {
          if (realizadas.indexOf(alteradas[i]) === -1) alteradas.splice(i, 1);
        }
        filaAlt.textContent = "";
        if (!realizadas.length) {
          var nada = document.createElement("span");
          nada.className = "caso-ro";
          nada.textContent = T("caso_sin_tecnicas_alt");
          filaAlt.appendChild(nada);
          return;
        }
        var realizadasTec = TECNICAS.filter(function (t) {
          return realizadas.indexOf(t.id) !== -1;
        });
        anadirChipsAgrupados(filaAlt, realizadasTec, function (t) {
          var chip = document.createElement("span");
          chip.className = "chip chip-extra" + (alteradas.indexOf(t.id) !== -1 ? " activo" : "");
          rotularChipTecnica(chip, t);
          chip.addEventListener("click", function () {
            var i = alteradas.indexOf(t.id);
            if (i === -1) alteradas.push(t.id); else alteradas.splice(i, 1);
            chip.classList.toggle("activo", i === -1);
          });
          return chip;
        });
      };
      pintarAlteradas();
      oyentesTecnicasRealizadas.push(pintarAlteradas);
      div.appendChild(filaAlt);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      return div;
    }

    if (def.t === "tecnicas_parametros") {
      // Un <details> plegable por técnica realizada, con sus propios campos
      // -PARAMETROS_TECNICAS, ver data/parametros-tecnicas.js y las
      // funciones tecParCampo*() más arriba en este archivo-. A diferencia
      // de tecnicas_alt, aquí NO se borra el dato si la técnica se
      // desmarca por error de "tecnicas_realizadas": es texto escrito a
      // mano, más caro de rehacer que un simple chip, así que solo se deja
      // de mostrar -reaparece si se vuelve a marcar la técnica-.
      // El campo entero va también dentro de su propio <details> (pedido
      // el 07-09-2026, junto al resto de "montaje"), con los desplegables
      // de cada técnica ya existentes anidados dentro -mismo patrón que
      // "tecnicas"/"material_ro" de aquí abajo-.
      var mapaParam = migrarTecnicasParametros(valor);
      camposCaso[def.c] = mapaParam;
      var detParam = document.createElement("details");
      detParam.className = "caso-grupo";
      var sumParam = document.createElement("summary");
      sumParam.textContent = T("caso_" + def.c);
      detParam.appendChild(sumParam);
      var campParam = document.createElement("div");
      campParam.className = "caso-grupo-campos";
      var contParam = document.createElement("div");
      contParam.className = "tecpar-lista";
      var pintarParametros = function () {
        var realizadas = camposCaso.tecnicas_realizadas || [];
        contParam.textContent = "";
        if (!realizadas.length) {
          var nadaParam = document.createElement("span");
          nadaParam.className = "caso-ro";
          nadaParam.textContent = T("caso_sin_tecnicas_parametros");
          contParam.appendChild(nadaParam);
          return;
        }
        var realizadasTec = TECNICAS.filter(function (t) {
          return realizadas.indexOf(t.id) !== -1;
        });
        realizadasTec.forEach(function (t) {
          if (!mapaParam[t.id]) mapaParam[t.id] = {};
          var datos = mapaParam[t.id];
          datos.general = datos.general || {};
          datos.estimulacion = datos.estimulacion || {};
          datos.registro = datos.registro || {};
          var tecDef = definicionTecPar(t.id);
          var det = document.createElement("details");
          det.className = "caso-grupo tecpar-tecnica";
          det.open = !!(tecParLinea(tecDef, datos) || datos.general.incidencias);
          var sum = document.createElement("summary");
          sum.textContent = campo(t, "etiqueta");
          det.appendChild(sum);
          var campos = document.createElement("div");
          campos.className = "caso-grupo-campos";
          campos.appendChild(pintarCamposTecnicaReal(t.id, datos));
          det.appendChild(campos);
          contParam.appendChild(det);
        });
      };
      pintarParametros();
      oyentesTecnicasRealizadas.push(pintarParametros);
      campParam.appendChild(contParam);
      detParam.appendChild(campParam);
      div.appendChild(detParam);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      return div;
    }

    if (def.t === "imagenes_montaje") {
      // Array de {id, nombre, dataUrl, fecha}. Se reutiliza el visor de
      // fotos de sondas (abrirFotoSonda) para ampliarlas: solo necesita una
      // URL y un nombre, y una dataURL vale igual que una ruta estática.
      var listaImg = (valor || []).slice();
      camposCaso[def.c] = listaImg;
      var contImg = document.createElement("div");
      contImg.className = "caso-imagenes";
      var galeria = document.createElement("div");
      galeria.className = "caso-imagenes-galeria";
      var pintarGaleria = function () {
        galeria.textContent = "";
        listaImg.forEach(function (im) {
          var marco = document.createElement("div");
          marco.className = "caso-imagen-marco";
          var mini = document.createElement("img");
          mini.src = im.dataUrl;
          mini.alt = im.nombre || "";
          mini.className = "caso-imagen-mini";
          mini.addEventListener("click", function () { abrirFotoSonda(im.dataUrl, im.nombre || ""); });
          var quitar = document.createElement("button");
          quitar.type = "button";
          quitar.className = "caso-imagen-quitar";
          quitar.textContent = "✕";
          quitar.title = T("caso_imagen_quitar_tit");
          quitar.addEventListener("click", function () {
            if (!confirm(T("apunte_foto_borrar_conf"))) return;
            var i = listaImg.indexOf(im);
            if (i !== -1) listaImg.splice(i, 1);
            pintarGaleria();
          });
          marco.appendChild(mini);
          marco.appendChild(quitar);
          galeria.appendChild(marco);
        });
      };
      pintarGaleria();
      var procesarImgs = function (files) {
        Array.prototype.slice.call(files).forEach(function (f) {
          comprimirImagen(f, 1100, 0.72).then(function (dataUrl) {
            listaImg.push({ id: uuid(), nombre: f.name, dataUrl: dataUrl, fecha: new Date().toISOString() });
            pintarGaleria();
          }).catch(function () {
            alert(T("caso_imagen_error"));
          });
        });
      };
      var entradaImg = document.createElement("input");
      entradaImg.type = "file";
      entradaImg.accept = "image/*";
      entradaImg.multiple = true;
      entradaImg.hidden = true;
      entradaImg.addEventListener("change", function () {
        procesarImgs(entradaImg.files);
        entradaImg.value = "";
      });
      var btnAddImg = document.createElement("button");
      btnAddImg.type = "button";
      btnAddImg.className = "caso-imagen-anadir";
      btnAddImg.textContent = T("caso_imagen_anadir");
      btnAddImg.addEventListener("click", function () { entradaImg.click(); });
      var camaraImg = crearBotonCamara(procesarImgs);
      var accionesImg = document.createElement("div");
      accionesImg.className = "caso-imagen-acciones";
      accionesImg.appendChild(btnAddImg);
      accionesImg.appendChild(camaraImg.boton);
      contImg.appendChild(galeria);
      contImg.appendChild(accionesImg);
      contImg.appendChild(entradaImg);
      contImg.appendChild(camaraImg.entrada);
      div.appendChild(contImg);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      return div;
    }

    if (def.t === "umbral_raices") {
      // Solo tiene sentido si se hizo mapeo de raíces y tornillos en este
      // caso (ver ocultarSegunTecnica). Valor: { niveles: [...], valores:
      // {NIVEL: {izq, der}} }. Un nivel presente en "valores" no se borra al
      // desmarcar su chip -mismo criterio que tecnicas_parametros-: es texto
      // escrito a mano, se deja de mostrar pero no se pierde.
      var datosRaices = { niveles: ((valor && valor.niveles) || []).slice(), valores: Object.assign({}, valor && valor.valores) };
      camposCaso[def.c] = datosRaices;
      var contRaices = document.createElement("div");
      contRaices.className = "umbral-raices";
      pintarColumnaRaices(contRaices, datosRaices, REG_SIN_GUARDAR, false);
      div.appendChild(contRaices);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      ocultarSegunTecnica(div, "mapeo_raices_tornillos");
      return div;
    }

    if (def.t === "material_ro") {
      // Igual que "material" pero de solo lectura: es el montaje base tal
      // cual salió del cálculo, no se edita aquí -para eso está "Material
      // realmente usado"-, así que no entra en camposCaso ni se lee en
      // leerFichaCaso().
      // Antes era su propio <details> anidado dentro del sub-apartado
      // "Material" de la ficha; desde el 10-09-2026 (pedido del usuario)
      // ya no es un pliegue aparte, vive directamente dentro de "Material"
      // -mismo nivel que el coste y "Notas del material", mismo aspecto
      // que el título de "Cajas necesarias" en "Cajas y entradas", que
      // tampoco es su propio pliegue-. El coste se sigue colgando dentro
      // de este mismo bloque desde renderFichaCaso() -busca
      // ".caso-material-bloque" en vez de ".caso-grupo-campos"-, así que
      // queda justo debajo de la tabla y antes de la ayuda.
      var contRo = document.createElement("div");
      contRo.className = "caso-material-bloque";
      var tituloRo = document.createElement("h4");
      tituloRo.className = "caso-cajas-detalle-titulo";
      tituloRo.textContent = T("caso_" + def.c);
      contRo.appendChild(tituloRo);
      var tablaRo = document.createElement("div");
      tablaRo.className = "caso-material";
      var tiposRo = Object.keys(valor || {}).sort();
      if (!tiposRo.length) {
        var nadaRo = document.createElement("span");
        nadaRo.className = "caso-ro";
        nadaRo.textContent = T("caso_sin_montaje");
        tablaRo.appendChild(nadaRo);
      }
      tiposRo.forEach(function (tipo) {
        var f = document.createElement("div");
        f.className = "caso-material-fila";
        var n = document.createElement("span");
        n.textContent = tipo;
        var cant = document.createElement("span");
        cant.className = "caso-ro";
        cant.textContent = valor[tipo];
        f.appendChild(n);
        f.appendChild(cant);
        tablaRo.appendChild(f);
      });
      contRo.appendChild(tablaRo);
      div.appendChild(contRo);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      return div;
    }

    if (def.t === "material") {
      // Mapa tipo -> cantidad, con una casilla por tipo
      var mapa = Object.assign({}, valor || {});
      camposCaso[def.c] = mapa;
      var detMat = document.createElement("details");
      detMat.className = "caso-grupo";
      var sumMat = document.createElement("summary");
      sumMat.textContent = T("caso_" + def.c);
      detMat.appendChild(sumMat);
      var campMat = document.createElement("div");
      campMat.className = "caso-grupo-campos";
      var tabla = document.createElement("div");
      tabla.className = "caso-material";
      var tipos = Object.keys(mapa).sort();
      if (!tipos.length) {
        var nada = document.createElement("span");
        nada.className = "caso-ro";
        nada.textContent = T("caso_sin_montaje");
        tabla.appendChild(nada);
      }
      tipos.forEach(function (tipo) {
        var f = document.createElement("label");
        f.className = "caso-material-fila";
        var n = document.createElement("span");
        n.textContent = tipo;
        var inp = document.createElement("input");
        inp.type = "number";
        inp.min = "0";
        inp.value = mapa[tipo];
        inp.addEventListener("input", function () {
          mapa[tipo] = inp.value === "" ? 0 : Number(inp.value);
        });
        f.appendChild(n);
        f.appendChild(inp);
        tabla.appendChild(f);
      });
      campMat.appendChild(tabla);
      detMat.appendChild(campMat);
      div.appendChild(detMat);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      return div;
    }

    // Equipo (25-09-2026): se elige al crear el caso. Solo se puede cambiar
    // mientras el caso no tenga nada colocado -las entradas de un equipo no
    // existen en las cajas del otro; la conversión llegará más adelante-.
    if (def.t === "equipo") {
      if (!hayVariosEquipos()) { div.hidden = true; return div; }
      control = document.createElement("select");
      control.id = "caso-f-" + def.c;
      equiposConCajas().forEach(function (eq) {
        var o = document.createElement("option");
        o.value = eq;
        o.textContent = T("equipo_opcion", { corto: cortoEquipo(eq), nombre: nombreEquipo(eq) });
        control.appendChild(o);
      });
      control.value = equipoDe(casoAbierto);
      control.addEventListener("change", function () { pintarEquipoSubtitulo(control.value); });
      var conMontaje = !!(resumenFicha && resumenFicha.entradas > 0);
      control.disabled = !!conMontaje;
      div.appendChild(control);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      camposCaso[def.c] = control;
      return div;
    }

    // Basales: la tabla del Registro intraoperatorio, sobre la copia de
    // trabajo de la ficha (se guarda con "Guardar", como el resto). Las filas
    // dependen de las técnicas marcadas y se repintan si cambian.
    if (def.t === "basales_reg") {
      if (!casoAbierto.registro_intraop) casoAbierto.registro_intraop = {};
      var dB = registroAsegurar(casoAbierto.registro_intraop);
      var sinGuardar = { cambiar: function () {}, salir: function () {} };
      var contB = document.createElement("div");
      contB.className = "caso-basales";
      var pintarB = function () {
        contB.textContent = "";
        var tecB = camposCaso.tecnicas_realizadas || casoAbierto.tecnicas_realizadas || [];
        var parB = document.createElement("div");
        parB.className = "reg-basales";
        pintarBloqueBasales(T("registro_sens_otros"), regFilasBasales(REG_BASALES_SENS, "s_", dB, tecB), "s_", REG_BASALES_LIBRES.sens, parB, dB, sinGuardar);
        pintarBloqueBasales(T("registro_motores"), regFilasBasales(REG_BASALES_MOT, "m_", dB, tecB), "m_", REG_BASALES_LIBRES.mot, parB, dB, sinGuardar);
        contB.appendChild(parB);
        if (regCasoConGrid(tecB, dB)) {
          var gridB = document.createElement("div");
          gridB.className = "caso-basales-grid";
          [["grid1_motor", "caso_basales_grid_estimulo"], ["grid1_inversion", "caso_basales_grid_inversion"]].forEach(function (g) {
            var campoG = document.createElement("label");
            campoG.className = "caso-basales-grid-campo";
            var tG = document.createElement("span");
            tG.textContent = T(g[1]);
            campoG.appendChild(tG);
            var inpG = document.createElement("input");
            inpG.type = "text";
            inpG.value = dB.v[g[0]] || "";
            inpG.addEventListener("input", function () { dB.v[g[0]] = inpG.value; });
            campoG.appendChild(inpG);
            gridB.appendChild(campoG);
          });
          contB.appendChild(gridB);
        }
      };
      pintarB();
      oyentesTecnicasRealizadas.push(pintarB);
      div.appendChild(contB);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      return div;
    }

    // Espejo del Registro (28-09-2026): alarmas (G), mapeo (E2) y eventos de
    // anestesia (An de F), sobre la copia de trabajo, como las basales. No
    // entran en camposCaso: se guardan con el caso al pulsar "Guardar".
    if (def.t === "alarmas_reg" || def.t === "mapeo_reg" || def.t === "eventos_an") {
      if (!casoAbierto.registro_intraop) casoAbierto.registro_intraop = {};
      var dR = registroAsegurar(casoAbierto.registro_intraop);
      var contR = document.createElement("div");
      contR.className = "caso-espejo";
      var tecR = function () { return camposCaso.tecnicas_realizadas || casoAbierto.tecnicas_realizadas || []; };
      var pintarR = function () {
        contR.textContent = "";
        if (def.t === "alarmas_reg") {
          pintarAlarmas(contR, dR, { modalidades: regQueRapidos(dR, tecR()), guardar: REG_SIN_GUARDAR, conHora: false, alCambiar: function () {
            if (camposCaso.alerta && alarmasConDatos(dR).length) camposCaso.alerta.checked = true;
            if (repintarCorrelato) repintarCorrelato();
            if (repintarPropuestaCaso) repintarPropuestaCaso();
          } });
        } else if (def.t === "mapeo_reg") {
          var bloquesR = REG_MAPEO_BLOQUES.filter(function (b) {
            return b.tec !== "mapeo_raices_tornillos" && tecR().indexOf(b.tec) !== -1;
          });
          if (!bloquesR.length) { contR.appendChild(regNodo("p", "caso-ro", T("reg_p_mapeo_ninguna"))); return; }
          bloquesR.forEach(function (b) {
            contR.appendChild(regNodo("div", "reg-basal-titulo reg-p-map-tit", T(b.t)));
            b.pintar(contR, dR, REG_SIN_GUARDAR);
          });
        } else {
          pintarEventosAn(contR, dR, REG_SIN_GUARDAR, false);
        }
      };
      pintarR();
      if (def.t !== "eventos_an") oyentesTecnicasRealizadas.push(pintarR);
      div.appendChild(contR);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      return div;
    }

    // Correlación de cada alarma con la evolución (29-09-2026, pedido del
    // usuario): una fila por grupo -misma técnica y mismo criterio, p. ej.
    // varias HFD de un músculo a distintas horas, que son el mismo sustrato-
    // con su evolución y cuándo se valoró, y la concordancia de ese grupo.
    // Se guarda en casoAbierto.correlato_alarmas por clave de grupo; no entra
    // en camposCaso. Sin alarmas, no se enseña.
    if (def.t === "correlato_alarmas") {
      var contC = regNodo("div", "caso-correlato");
      var pintarC = function () {
        contC.textContent = "";
        var dC = casoAbierto.registro_intraop ? registroAsegurar(casoAbierto.registro_intraop) : null;
        var grupos = dC ? gruposAlarmas(dC) : [];
        div.hidden = !grupos.length;
        grupos.forEach(function (g) { contC.appendChild(filaCorrelato(g)); });
      };
      pintarC();
      repintarCorrelato = pintarC;
      div.appendChild(contC);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      return div;
    }

    if (def.t === "ro") {
      control = document.createElement("span");
      control.className = "caso-ro";
      control.textContent = valor || "—";
      control.id = "caso-f-" + def.c;
      div.appendChild(control);
      return div;   // no se edita: no entra en camposCaso
    }

    if (def.t === "sel" || def.t === "cat") {
      control = document.createElement("select");
      var vacia = document.createElement("option");
      vacia.value = "";
      vacia.textContent = T("opc_vacio");
      control.appendChild(vacia);
      var lista = def.t === "cat"
        ? (def.cat === "servicios" ? SERVICIOS : INTERVENCIONES)
        : null;
      if (lista) {
        // Se ofrece lo activo, más lo que ya tuviera el caso aunque esté
        // desactivado, para no perder el dato al abrir un caso antiguo.
        lista.filter(function (e) {
          return e.activa !== false || e.id === valor;
        }).forEach(function (e) {
          var o = document.createElement("option");
          o.value = e.id;
          o.textContent = campo(e, "nombre");
          control.appendChild(o);
        });
      } else {
        OPCIONES[def.o].forEach(function (v) {
          var o = document.createElement("option");
          o.value = v;
          o.textContent = opcionTexto(def.o, v);
          control.appendChild(o);
        });
        // Un valor guardado que no está entre las opciones se ofrece igual,
        // en vez de dejar el desplegable en blanco y borrarlo al guardar. Pasa
        // con los campos que nacieron como texto libre y luego se cerraron a
        // una lista: "posicion" venía escrito a mano en los casos de antes.
        if (valor && OPCIONES[def.o].indexOf(String(valor)) === -1) {
          var propio = document.createElement("option");
          propio.value = String(valor);
          propio.textContent = String(valor);
          control.appendChild(propio);
        }
      }
      control.value = valor == null ? "" : String(valor);
    } else if (def.t === "area") {
      control = document.createElement("textarea");
      control.rows = def.rows || 2;
      control.value = valor || "";
    } else {
      control = document.createElement("input");
      control.type = def.t === "num" ? "number" : (def.t === "date" ? "date" : (def.t === "time" ? "time" : "text"));
      if (def.t === "num") control.min = "0";
      control.value = valor == null ? "" : valor;
    }

    control.id = "caso-f-" + def.c;
    div.appendChild(control);
    if (def.ay) div.appendChild(ayudaCampo(def.ay));
    camposCaso[def.c] = control;
    // Solo tiene sentido anotar el umbral de tornillos si de verdad se hizo
    // mapeo de raíces y tornillos en este caso: sin la técnica marcada, ni
    // esta caja de notas ni la de niveles/umbrales de más abajo aparecen
    // (pedido por el usuario, 05-09-2026). Ver también el tipo "umbral_raices".
    if (def.c === "umbral_tornillos_pediculares") ocultarSegunTecnica(div, "mapeo_raices_tornillos");
    return div;
  }

  function ayudaCampo(clave) {
    var s = document.createElement("small");
    s.textContent = T(clave);
    return s;
  }

  // Resumen del montaje del caso abierto, calculado una sola vez por pintado
  // de la ficha (auditoría 28-09-2026, T7): lo usan el campo Equipo y
  // «Montaje / Material».
  var resumenFicha = null;
  function renderFichaCaso() {
    resumenFicha = casoAbierto ? calcularResumen(montajeDesdeCaso(casoAbierto)) : null;
    camposCaso = {};
    oyentesTecnicasRealizadas = [];
    condicionalesPendientes = [];
    var c = casoAbierto;

    document.getElementById("caso-subtitulo").textContent =
      T("caso_subtitulo_prefijo") + " " + (c.ID_Caso || "—") + (c.nombre_caso ? ", " + c.nombre_caso : "");
    pintarEquipoSubtitulo(equipoDe(c));

    // Los 8 apartados son <details> fijos en el HTML (caso-g-<grupo>), cada
    // uno con su contenedor propio (caso-c-<grupo>) donde se cuelgan sus
    // campos en el orden de CAMPOS_CASO. Plegados por defecto -ver
    // index.html-: se despliega el que interese, no hay que rellenar de
    // arriba abajo.
    GRUPOS_CASO.forEach(function (g) {
      var cont = document.getElementById("caso-c-" + g);
      cont.innerHTML = "";
      if (g === "montaje") {
        // Sin sub-apartados desde el 28-09-2026 (pedido del usuario): al
        // abrir "Montaje / Material" sale todo seguido -cajas y entradas,
        // material con su coste, notas e imágenes-. Antes eran <details>
        // "Cajas y entradas", "Material" y "Técnicas" (esta última es ahora
        // su propio apartado). contCajas/contMaterial siguen siendo dos
        // contenedores para que "def.sub" ordene los campos igual que antes.
        var contCajas = document.createElement("div");
        contCajas.className = "caso-grupo-campos";
        var contMaterial = document.createElement("div");
        contMaterial.className = "caso-grupo-campos";
        cont.appendChild(contCajas);
        cont.appendChild(contMaterial);

        var res = document.createElement("p");
        res.className = "caso-resumen-linea";
        res.textContent = c.n_cajas
          ? T("caso_montaje_res", { cajas: c.n_cajas, canales: c.n_canales_ocupados })
          : T("caso_sin_montaje");
        contCajas.appendChild(res);

        // Fase 2: de qué plantilla salió, resuelto en vivo -si se renombra la
        // plantilla, el nombre que se ve aquí cambia con ella; congelarlo
        // pediría un campo nuevo en el caso, y no lo hay. Un caso sin
        // montaje_origen (registrado a mano, o de antes de que existiera el
        // campo) no muestra nada: no se rellena hacia atrás.
        if (c.montaje_origen) {
          var origenP = document.createElement("p");
          origenP.className = "caso-resumen-linea";
          var mOrigen = montajes[c.montaje_origen];
          origenP.textContent = T("caso_montaje_origen", {
            nombre: mOrigen ? campo(mOrigen, "nombre") : T("caso_montaje_origen_no_disponible")
          });
          contCajas.appendChild(origenP);
        }

        // Detalle canal a canal, pedido por el usuario: la misma vista que
        // ya existe en Resumen ("Cajas necesarias"), aquí de solo lectura,
        // para saber qué hay puesto sin salir a corregir el montaje. Se
        // reconstruye desde el montaje en crudo del caso (montajeDesdeCaso)
        // y se recalcula con calcularResumen() -misma función que usa el
        // banco de trabajo, no se duplica nada de su lógica-.
        if (c.n_cajas) {
          var tituloDetalle = document.createElement("h4");
          tituloDetalle.className = "caso-cajas-detalle-titulo";
          var resDetalle = resumenFicha;
          tituloDetalle.textContent = T("resumen_cajas", { n: resDetalle.cajas.length });
          contCajas.appendChild(tituloDetalle);

          var contDetalle = document.createElement("div");
          contDetalle.className = "caso-cajas-detalle";
          resDetalle.cajas.forEach(function (cj) {
            var bloque = document.createElement("div");
            bloque.className = "resumen-caja";

            var cab = document.createElement("div");
            cab.className = "resumen-caja-cab";
            var nom = document.createElement("span");
            nom.className = "resumen-caja-nombre";
            nom.textContent = cj.nombre;
            var cnt = document.createElement("span");
            cnt.className = "resumen-caja-cnt" + (cj.usadas === cj.total ? " llena" : "");
            cnt.textContent = T("resumen_entradas", { usadas: cj.usadas, total: cj.total });
            cab.appendChild(nom);
            cab.appendChild(cnt);
            bloque.appendChild(cab);

            var lista = document.createElement("div");
            lista.className = "resumen-entradas";
            cj.detalle.forEach(function (d) {
              var el = document.createElement("span");
              el.className = "resumen-entrada";
              if (d.estilo) aplicarEstilo(el, d.estilo);
              el.title = T("chip_tipo", { tipo: d.tipo });
              el.innerHTML = "<span class=\"re-num\">" + d.entrada + "</span> ";
              if (d.color) {
                var dot = document.createElement("span");
                dot.className = "color-dot color-" + d.color;
                el.appendChild(dot);
              }
              el.appendChild(document.createTextNode(d.nombre));
              lista.appendChild(el);
            });
            bloque.appendChild(lista);
            contDetalle.appendChild(bloque);
          });
          contCajas.appendChild(contDetalle);
        }

        // Editar montaje (antes "Corregir el material y el montaje",
        // renombrado a "Editar material y montaje" el 06-09-2026, y a
        // secas "Editar montaje" el 10-09-2026 -pedido del usuario-):
        // pedido por el usuario que viva aquí, en el mismo submenú donde
        // ya se ve el resumen y se elige plantilla, en vez de al final de
        // la ficha -es la única forma de ver dónde está colocado cada
        // ítem, canal a canal, y hasta ahora había que bajar del todo
        // para encontrarla-. Necesita el caso ya guardado en `casos` -uno
        // recién creado y sin guardar aún no existe ahí, no hay qué
        // abrir-.
        if (!casoEsNuevo) {
          var filaCorregir = document.createElement("p");
          filaCorregir.className = "caso-montaje-fila";
          var btnCorregir = document.createElement("button");
          btnCorregir.type = "button";
          btnCorregir.textContent = T("caso_editar_montaje");
          // Se guarda antes lo que haya escrito en la ficha: si no, salir a
          // las cajas le perdería lo tecleado y no habría por qué asociar
          // una cosa con la otra.
          btnCorregir.addEventListener("click", function () {
            if (!guardarFicha(false)) return;
            var uid = casoAbierto && casoAbierto.caso_uid;
            if (!uid || !casos[uid]) return;
            dlgCaso.close();
            abrirMontajeDeCaso(uid);
          });
          // Sin texto de ayuda debajo (retirado a petición del usuario, 25-09-2026,
          // igual que los de Técnicas realizadas, Cómo se realizó y Material).
          filaCorregir.appendChild(btnCorregir);
          contCajas.appendChild(filaCorregir);
        }

        // "Cargar montaje…" (antes "Cargar plantilla…") ya no vive aquí:
        // desde la ficha no se sabe si lo que se está copiando encima se
        // puede editar de verdad o no -pedido del usuario-. Sigue existiendo,
        // pero solo desde la barra fija de "Corrigiendo el material del
        // caso" (#barra-caso-cargar-plantilla, más abajo en este archivo).

        // "Guardar este montaje como plantilla…" tampoco vive aquí (retirado
        // el 06-09-2026, tarde): ya está en la barra fija de "Editar material
        // y montaje" (#barra-caso-guardar-plantilla), con el rótulo del caso
        // que se está corrigiendo bien visible ahí -tenerlo duplicado en la
        // ficha y en el Organizador confundía sobre cuál de los dos montajes
        // se estaba guardando-.
      }
      CAMPOS_CASO.filter(function (def) { return def.g === g; }).forEach(function (def) {
        // Un caso de antes de este cambio no trae estos campos ya resueltos:
        // se precargan resueltos desde los que tenía, igual que "intervencion".
        var valor = def.c === "intervencion" ? intervencionDe(c)
          : def.c === "resumen_monitorizacion" ? resumenMonitorizacionDe(c)
          : def.c === "tipo_alerta" ? tipoAlertaDe(c)
          : def.c === "navegacion" ? navegacionDe(c)
          : def.c === "resultado_esperable" ? resultadoEsperableId(c[def.c])
          : c[def.c];
        var elCampo = campoCaso(def, valor);
        // "montaje" reparte sus campos entre los 3 sub-apartados de arriba
        // según "def.sub"; el resto de grupos, y los campos de "montaje"
        // sin "sub" (imágenes), van directos a `cont` como siempre.
        var destino = def.sub === "cajas" ? contCajas
          : def.sub === "material" ? contMaterial
          : cont;
        destino.appendChild(elCampo);
        // Coste del material (pedido por el usuario, 06-09-2026; metido dentro
        // del propio pliegue de "Material (montaje base)" el 07-09-2026,
        // para que abrir/cerrar uno abra/cierre el otro, y desde el
        // 10-09-2026 sin pliegue propio: comparte el de "Material" entero-):
        // el mismo bloque que ya existe en Resumen -bloqueCoste(), con su
        // tabla de líneas, el total, la nota de qué material reutilizable
        // no cuenta y qué tipos no tienen precio puesto todavía-, aquí de
        // solo lectura. Reutiliza resDetalle (calculado más arriba en este
        // mismo render, con calcularResumen() para "Cajas necesarias") en
        // vez de volver a montarlo: es el mismo montaje, así que
        // calcularCoste() sobre él da exactamente el mismo coste que vería
        // el usuario si abriera este montaje ahora mismo en el Organizador
        // -precios de hoy, no los que hubiera cuando se guardó el caso-.
        // Sin montaje (resDetalle sin definir) no hay nada que costear. Se
        // cuelga dentro de ".caso-material-bloque" -el bloque que arma el
        // propio campoCaso() para "material_ro"-, justo debajo de la tabla
        // y antes de la ayuda, no en `cont`.
        if (def.c === "material_previsto" && resDetalle) {
          var campoInterior = elCampo.querySelector(".caso-material-bloque") || elCampo;
          campoInterior.appendChild(bloqueCoste(calcularCoste(resDetalle)));
        }
      });
    });

    // Conecta cada campo condicional con el control del que depende: oculto
    // hasta que se cumpla la condición, y se muestra/oculta en vivo si se
    // toca. "dependeDe" es o bien el id de una casilla -depende de que esté
    // marcada, p. ej. "alerta"- o un objeto { c, v } con el id de un
    // desplegable y el valor que debe tener -p. ej. estado === "cancelado"-.
    condicionalesPendientes.forEach(function (item) {
      var esSelect = typeof item.de === "object";
      var control = camposCaso[esSelect ? item.de.c : item.de];
      if (!control) return;
      var actualizar = function () {
        item.div.hidden = esSelect ? control.value !== item.de.v : !control.checked;
      };
      actualizar();
      control.addEventListener("change", actualizar);
    });

    // Propuesta de concordancia (28-09-2026): se calcula en vivo con "Hubo
    // alerta"/alarmas, el resultado de la señal y la evolución; no se aplica
    // sola, hay que pulsar "Aplicar".
    var ctlConc = camposCaso.concordancia;
    if (ctlConc) {
      var propC = document.createElement("div");
      propC.className = "caso-propuesta";
      ctlConc.parentNode.appendChild(propC);
      var actualizarPropC = function () {
        var datosC = {
          alerta: !!(camposCaso.alerta && camposCaso.alerta.checked) || alarmasConDatos(casoAbierto.registro_intraop).length > 0,
          senal: camposCaso.recuperacion_senal ? camposCaso.recuperacion_senal.value : "",
          evol: camposCaso.evolucion_postop ? camposCaso.evolucion_postop.value : ""
        };
        var v = propuestaConcordancia(datosC);
        var dudosa = concordanciaDudosa(datosC);
        var motivo = motivoConcordancia(datosC);
        // Con la correlación de cada alarma rellena (29-09-2026), la propuesta
        // sale de sus grupos, que es más fino que el resumen de todo el caso.
        var filasG = filasCorrelato(casoAbierto).filter(function (f) { return f.concordancia; });
        if (filasG.length) {
          var vg = concordanciaDeGrupos(filasG.map(function (f) { return f.concordancia; }));
          dudosa = vg.charAt(0) === "¿";
          v = vg.replace(/[¿?]/g, "");
          motivo = T("caso_correlato_alarmas") + ": " + filasG.map(function (f) { return f.alarmas + " " + f.concordancia; }).join(" · ");
        }
        propC.textContent = "";
        propC.hidden = !v || v === ctlConc.value;
        if (propC.hidden) return;
        var textoV = opcionTexto("concordancia", v);
        if (dudosa) textoV = "¿" + textoV + "?";
        propC.appendChild(regNodo("span", null, T("caso_concordancia_propuesta", { v: textoV }) +
          " (" + motivo + ")"));
        var ap = regNodo("button", "caso-propuesta-aplicar", T("caso_concordancia_aplicar"));
        ap.type = "button";
        ap.addEventListener("click", function () {
          ctlConc.value = v;
          ctlConc.dispatchEvent(new Event("change", { bubbles: true }));
        });
        propC.appendChild(ap);
      };
      ["alerta", "recuperacion_senal", "evolucion_postop", "concordancia"].forEach(function (k) {
        if (camposCaso[k]) camposCaso[k].addEventListener("change", actualizarPropC);
      });
      repintarPropuestaCaso = actualizarPropC;
      actualizarPropC();
    }

    // Pie: cuándo se creó el archivo y cuántas veces se ha tocado después
    var pie = document.getElementById("caso-meta");
    var partes = [T("caso_creado_en", {
      fecha: new Date(c.guardado_en).toLocaleString(localeActual())
    })];
    if ((c.editado_en || []).length) {
      partes.push(T("caso_editado_veces", {
        n: c.editado_en.length,
        fecha: new Date(c.editado_en[c.editado_en.length - 1]).toLocaleString(localeActual())
      }));
    }
    pie.textContent = partes.join(" · ");

    // Un caso que todavía no se ha guardado ni una vez no existe en "casos":
    // no hay nada que borrar hasta el primer "Guardar".
    document.getElementById("caso-borrar").hidden = casoEsNuevo;
    // El menú ⋮ solo tiene "Borrar caso": sin él, el menú sobra.
    // El ⋮ se ve siempre: además de Borrar (solo si ya está guardado) lleva
    // Informe y Hoja de registro, que valen también para uno nuevo.
    document.getElementById("caso-mas").hidden = false;
    cerrarMenuCaso();
    document.getElementById("caso-error").hidden = true;
    pintarBotonCerrarCaso();
    if (camposCaso.estado) camposCaso.estado.addEventListener("change", pintarBotonCerrarCaso);
    fichaOrigen = casos[c.caso_uid] || null;
    fichaFirma = firmaFicha();
  }

  function leerFichaCaso() {
    var c = casoAbierto;
    CAMPOS_CASO.forEach(function (def) {
      var control = camposCaso[def.c];
      if (control === undefined) return;
      if (def.t === "tecnicas" || def.t === "tecnicas_alt" || def.t === "imagenes_montaje") { c[def.c] = control.slice(); return; }
      if (def.t === "material") { c[def.c] = Object.assign({}, control); return; }
      if (def.t === "tecnicas_parametros") { c[def.c] = Object.assign({}, control); return; }
      if (def.t === "umbral_raices") { c[def.c] = { niveles: control.niveles.slice(), valores: Object.assign({}, control.valores) }; return; }
      if (def.t === "check") { c[def.c] = control.checked; return; }
      // Los numéricos se guardan como número, no como texto: en el Sheet hay
      // que poder sumarlos y sacar medias sin convertir nada.
      if (def.t === "num" || def.c === "dificultad_1a5") {
        c[def.c] = control.value === "" ? "" : Number(control.value);
        return;
      }
      c[def.c] = control.value;
    });
    return c;
  }

  function abrirCaso(uid) {
    casoEsNuevo = false;
    // Espera a que las fotos de este caso terminen de recuperarse de
    // IndexedDB (normalmente ya lo están, ver cargarCasos()) antes de
    // clonarlo: casoAbierto es una copia de trabajo, así que si se
    // clonara antes de tiempo se quedaría sin las fotos para toda la
    // edición, aunque casos[uid] las tuviera un instante después.
    (casosHidratados[uid] || Promise.resolve()).then(function () {
      casoAbierto = clonar(casos[uid]);
      renderFichaCaso();
      dlgCaso.showModal();
    });
  }

  function guardarFicha(cerrar) {
    if (fichaAutoTimer) { clearTimeout(fichaAutoTimer); fichaAutoTimer = null; }
    var c = leerFichaCaso();
    if (!c.fecha) {
      var err = document.getElementById("caso-error");
      err.textContent = T("caso_falta_fecha");
      err.hidden = false;
      return false;
    }
    // El caso cambió mientras la ficha estaba abierta (lo bajó la
    // sincronización desde otro dispositivo): guardar la copia de trabajo lo
    // pisaría entero. Se pregunta (auditoría 28-09-2026, C10).
    if (!casoEsNuevo && fichaOrigen && casos[c.caso_uid] && casos[c.caso_uid] !== fichaOrigen &&
        !confirm(T("caso_cambiado_fuera"))) return false;
    if (cerrar) c.estado = c.estado === "cerrado" ? "preparado" : "cerrado";
    recordarCentro(c.centro);
    guardarCaso(c, casoEsNuevo);
    casoEsNuevo = false;
    casoAbierto = clonar(casos[c.caso_uid]);
    fichaOrigen = casos[c.caso_uid];
    // La firma NO se calcula aquí: leerFichaCaso() copiaría el formulario
    // (aún con los valores de antes de guardar, p. ej. el estado antes de
    // «Cerrar/Reabrir caso») sobre la copia recién guardada. La pone
    // renderFichaCaso() al repintar; si no se repinta, la ficha se cierra.
    fichaFirma = "";
    avisoGuardado(T("caso_guardado"));
    return true;
  }

  /* Cambios sin guardar en la ficha (auditoría 28-09-2026, C1): la ficha
     trabaja sobre una copia y solo se guarda con «Guardar»; salir sin
     guardar perdía lo escrito sin avisar. "fichaFirma" es la ficha tal como
     quedó al pintarla o al guardarla; "fichaOrigen", el objeto de `casos`
     del que se copió (si la sincronización lo sustituye, se nota, C10). */
  var fichaFirma = "";
  var fichaOrigen = null;
  function firmaFicha() {
    try { return JSON.stringify(leerFichaCaso()); } catch (e) { return ""; }
  }
  /* Autoguardado de la ficha (auditoría 28-09-2026, F1): igual que el
     Registro, la ficha se guarda sola ~1,5 s después de cada cambio. Se
     guarda una COPIA de la copia de trabajo: los controles (y las tablas
     espejo) siguen enlazados a casoAbierto y no se pueden sustituir a mitad
     de edición. «Guardar» sigue ahí como confirmación visible. No guarda
     solo si falta la fecha o si el caso cambió en otro dispositivo mientras
     tanto (C10): entonces avisa y deja la decisión a «Guardar». */
  var fichaAutoTimer = null;
  function casoCambiadoFuera() {
    var uid = casoAbierto && casoAbierto.caso_uid;
    return !!(!casoEsNuevo && fichaOrigen && uid && casos[uid] && casos[uid] !== fichaOrigen);
  }
  function autoguardarFicha() {
    if (fichaAutoTimer) { clearTimeout(fichaAutoTimer); fichaAutoTimer = null; }
    if (!casoAbierto || !dlgCaso.open) return false;
    var firma = firmaFicha();
    if (firma === fichaFirma) return true;
    var c = casoAbierto;
    if (!c.fecha) return false;
    if (casoCambiadoFuera()) { avisoGuardado(T("caso_cambiado_fuera_auto"), true); return false; }
    guardarCaso(clonar(c), casoEsNuevo, true);
    casoEsNuevo = false;
    fichaOrigen = casos[c.caso_uid];
    fichaFirma = firma;
    document.getElementById("caso-borrar").hidden = false;
    document.getElementById("caso-mas").hidden = false;
    avisoGuardado(T("caso_autoguardado"));
    return true;
  }
  function programarAutoguardadoFicha() {
    if (fichaAutoTimer) clearTimeout(fichaAutoTimer);
    fichaAutoTimer = setTimeout(autoguardarFicha, 1500);
  }
  ["input", "change", "click"].forEach(function (ev) {
    dlgCaso.addEventListener(ev, function (e) {
      // Los botones de la barra no son cambios de la ficha.
      if (e.target && e.target.closest && e.target.closest(".caso-acciones")) return;
      programarAutoguardadoFicha();
    });
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) autoguardarFicha(); });
  window.addEventListener("pagehide", function () { autoguardarFicha(); });

  function salirDeFicha() {
    // Con el autoguardado, salir guarda lo pendiente sin preguntar. Solo si no
    // se puede (sin fecha, o el caso cambió fuera) se pregunta como antes.
    if (casoAbierto && firmaFicha() !== fichaFirma && !autoguardarFicha()) {
      if (confirm(T("caso_salir_guardar"))) {
        if (!guardarFicha(false)) return;
      } else if (!confirm(T("caso_salir_descartar"))) {
        return;
      }
    }
    if (fichaAutoTimer) { clearTimeout(fichaAutoTimer); fichaAutoTimer = null; }
    dlgCaso.close();
    abrirListaCasos();
  }

  // Uids que cumplen los filtros activos de la pantalla (Estado/Desde/Hasta/
  // Solo destacados/Hacer seguimiento). No decide el orden -cada consumidor
  // ordena a su manera: el listado en pantalla según "Ordenar por", el CSV
  // y el PDF siempre cronológico, igual que antes de que existiera este
  // filtro-, solo qué casos entran. La comparten el listado en pantalla y
  // los dos botones de exportar, para que "exportar solo los destacados"
  // sea literalmente "filtra, luego exporta lo que se ve".
  // Filtros de fecha: el selector de fecha del móvil no siempre deja
  // borrarla, así que cada uno lleva su ✕ cuando tiene una puesta
  // (pedido del usuario, 26-09-2026).
  function pintarBotonesQuitarFecha() {
    [].forEach.call(document.querySelectorAll(".btn-quitar-fecha"), function (b) {
      b.hidden = !document.getElementById(b.dataset.para).value;
    });
  }
  [].forEach.call(document.querySelectorAll(".btn-quitar-fecha"), function (b) {
    b.addEventListener("click", function () {
      document.getElementById(b.dataset.para).value = "";
      renderListaCasos();
    });
  });

  // Filtro "Equipo" de Gestión de Casos: solo aparece con más de un equipo.
  function pintarFiltroEquipo() {
    var envoltura = document.getElementById("casos-equipo-filtro");
    var sel = document.getElementById("casos-equipo");
    envoltura.hidden = !hayVariosEquipos();
    if (envoltura.hidden) return;
    llenarSelectEquipos(sel, sel.value);
  }

  // "Todos" + un equipo por opción. Lo usan los filtros de Gestión de Casos y
  // de Plantillas de montajes.
  function llenarSelectEquipos(sel, valor) {
    sel.textContent = "";
    var todos = document.createElement("option");
    todos.value = "";
    todos.textContent = T("casos_filtro_todos");
    sel.appendChild(todos);
    equiposConCajas().forEach(function (eq) {
      var o = document.createElement("option");
      o.value = eq;
      o.textContent = T("equipo_opcion", { corto: cortoEquipo(eq), nombre: nombreEquipo(eq) });
      sel.appendChild(o);
    });
    sel.value = valor || "";
    if (sel.value !== (valor || "")) sel.value = "";
  }

  function casosFiltradosUids() {
    var fEstado = document.getElementById("casos-estado").value;
    var fConcordancia = document.getElementById("casos-concordancia").value;
    var fDesde = document.getElementById("casos-desde").value;
    var fHasta = document.getElementById("casos-hasta").value;
    var soloDestacados = document.getElementById("casos-destacado").checked;
    var soloSeguimiento = document.getElementById("casos-seguimiento").checked;
    var fEquipo = hayVariosEquipos() ? document.getElementById("casos-equipo").value : "";
    return Object.keys(casos).filter(function (uid) {
      var c = casos[uid];
      if (fEquipo && equipoDe(c) !== fEquipo) return false;
      if (fEstado && c.estado !== fEstado) return false;
      if (fConcordancia && c.concordancia !== fConcordancia) return false;
      if (fDesde && (c.fecha || "") < fDesde) return false;
      if (fHasta && (c.fecha || "") > fHasta) return false;
      if (soloDestacados && !c.caso_destacado) return false;
      if (soloSeguimiento && !c.hacer_seguimiento) return false;
      return true;
    });
  }

  // Comparador de dificultad compartido por "dificultad" y "dificultad_asc":
  // los que no tienen dificultad puesta van siempre al final, sea cual sea
  // el sentido -no tiene sentido leerlos como "los más fáciles" ni como
  // "los más difíciles", así que se sacan del orden numérico en los dos casos-.
  function comparaDificultad(a, b, ascendente) {
    var sinA = a.dificultad_1a5 === "" || a.dificultad_1a5 == null;
    var sinB = b.dificultad_1a5 === "" || b.dificultad_1a5 == null;
    if (sinA && sinB) return (b.fecha || "").localeCompare(a.fecha || "");
    if (sinA) return 1;
    if (sinB) return -1;
    var da = Number(a.dificultad_1a5), db = Number(b.dificultad_1a5);
    return (ascendente ? da - db : db - da) || (b.fecha || "").localeCompare(a.fecha || "");
  }

  function renderListaCasos() {
    pintarFiltroEquipo();
    pintarBotonesQuitarFecha();
    var cont = document.getElementById("casos-lista");
    cont.innerHTML = "";
    var orden = document.getElementById("casos-orden").value;

    var lista = casosFiltradosUids().map(function (uid) { return casos[uid]; });
    if (orden === "dificultad") {
      lista.sort(function (a, b) { return comparaDificultad(a, b, false); });
    } else if (orden === "dificultad_asc") {
      lista.sort(function (a, b) { return comparaDificultad(a, b, true); });
    } else if (orden === "fecha_asc") {
      // Por fecha de cirugía, lo más antiguo primero.
      lista.sort(function (a, b) { return (a.fecha || "").localeCompare(b.fecha || ""); });
    } else {
      // Por fecha de cirugía, lo más reciente primero (orden de siempre).
      lista.sort(function (a, b) { return (b.fecha || "").localeCompare(a.fecha || ""); });
    }

    var total = Object.keys(casos).length;
    var sinSubir = casosPendientes().length;
    document.getElementById("casos-cuenta").textContent =
      T("casos_n", { n: total }) + (sinSubir ? " · " + T("casos_sin_subir", { n: sinSubir }) : "");

    if (!lista.length) {
      var vacio = document.createElement("p");
      vacio.className = "empty-hint";
      vacio.textContent = total ? T("casos_sin_filtro") : T("casos_vacio");
      cont.appendChild(vacio);
      return;
    }

    lista.forEach(function (c) {
      var fila = document.createElement("button");
      fila.type = "button";
      fila.className = "caso-fila estado-" + c.estado;
      fila.addEventListener("click", function () { abrirCaso(c.caso_uid); });

      var cab = document.createElement("span");
      cab.className = "caso-fila-cab";
      var idGrupo = document.createElement("span");
      idGrupo.className = "caso-fila-id-grupo";
      var id = document.createElement("b");
      id.textContent = c.ID_Caso || "—";
      idGrupo.appendChild(id);
      // Caso destacado: visible en el listado sin tener que abrir el caso
      // ni mirar la hoja de cálculo.
      if (c.caso_destacado) {
        var estrella = document.createElement("span");
        estrella.className = "caso-fila-destacado";
        estrella.textContent = "★";
        estrella.title = T("caso_caso_destacado");
        idGrupo.appendChild(estrella);
      }
      // Hacer seguimiento: mismo motivo que la estrella -verlo sin abrir el
      // caso-, icono propio (ojo) para no confundirlo con "destacado".
      if (c.hacer_seguimiento) {
        var ojo = document.createElement("span");
        ojo.className = "caso-fila-seguimiento";
        ojo.textContent = "👁";
        ojo.title = T("caso_hacer_seguimiento");
        idGrupo.appendChild(ojo);
      }
      // Dificultad: mismo motivo que la estrella, verla sin abrir el caso.
      if (c.dificultad_1a5 !== "" && c.dificultad_1a5 != null) {
        var dificultad = document.createElement("span");
        dificultad.className = "caso-fila-dificultad";
        dificultad.textContent = c.dificultad_1a5 + "/5";
        dificultad.title = T("caso_dificultad_1a5");
        idGrupo.appendChild(dificultad);
      }
      cab.appendChild(idGrupo);
      var fecha = document.createElement("span");
      fecha.className = "caso-fila-fecha";
      fecha.textContent = c.fecha || "";
      // El equipo, debajo de la fecha (pedido del usuario, 25-09-2026).
      if (hayVariosEquipos()) {
        var colFecha = document.createElement("span");
        colFecha.className = "caso-fila-fecha-col";
        colFecha.appendChild(fecha);
        var eqMarca = document.createElement("span");
        eqMarca.className = "caso-fila-equipo";
        eqMarca.appendChild(nodoMarcaEquipo(equipoDe(c)));
        colFecha.appendChild(eqMarca);
        cab.appendChild(colFecha);
      } else {
        cab.appendChild(fecha);
      }
      fila.appendChild(cab);

      var det = document.createElement("span");
      det.className = "caso-fila-det";
      // El nombre que le hayas puesto manda sobre la intervención resuelta:
      // es justo lo que pediste para reconocer el caso de un vistazo.
      det.textContent = c.nombre_caso || (intervencionDe(c) || c.escenario_nombre || T("caso_sin_intervencion"));
      fila.appendChild(det);

      var pie = document.createElement("span");
      pie.className = "caso-fila-pie";
      var et = document.createElement("span");
      et.className = "caso-etiqueta estado-" + c.estado;
      et.textContent = T("caso_estado_" + c.estado);
      pie.appendChild(et);
      if (c.alerta) {
        var al = document.createElement("span");
        al.className = "caso-etiqueta alerta";
        al.textContent = T("caso_alerta");
        pie.appendChild(al);
      }
      if (casosSinSubir[c.caso_uid]) {
        var sub = document.createElement("span");
        sub.className = "caso-etiqueta sin-subir";
        sub.textContent = T("caso_pendiente_subir");
        pie.appendChild(sub);
      }
      fila.appendChild(pie);

      cont.appendChild(fila);
    });
  }

  function abrirListaCasos() {
    renderListaCasos();
    irAPantalla("casos");
  }

  document.getElementById("tile-casos").addEventListener("click", abrirListaCasos);
  ["casos-estado", "casos-concordancia", "casos-equipo", "casos-desde", "casos-hasta", "casos-orden", "casos-destacado", "casos-seguimiento"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", renderListaCasos);
  });

  // "Crear caso" (06-09-2026, antes "Caso nuevo desde cero" + un botón
  // aparte "Guardar este montaje como caso" que se retiró: no tenía sentido
  // -tomaba lo que hubiera en el banco de trabajo sin ninguna relación con
  // el caso nuevo-). El caso se guarda YA, vacío, para que exista de verdad
  // en `casos` -abrirMontajeDeCaso() lo necesita así, si luego se entra a
  // "Editar material y montaje"-. Pedido del usuario el 06-09-2026 (noche):
  // en vez de saltar directo al Organizador, se abre la propia ficha del
  // caso recién creado (misma `abrirCaso()` de siempre) para que "Crear
  // caso" se quede dentro de Gestión de Casos -el Organizador solo se pisa
  // a propósito, desde "Editar material y montaje" en el apartado 5-.
  document.getElementById("casos-nuevo-cero").addEventListener("click", function () {
    elegirEquipo(function (eq) {
      var c = casoVacio();
      c.equipo_id = eq;
      guardarCaso(c, true);
      abrirCaso(c.caso_uid);
    });
  });

  /* Con qué equipo se monta (25-09-2026). Con un solo equipo configurado
     no pregunta nada. Propone el último que se usó en este dispositivo. */
  var EQUIPO_ULTIMO_KEY = "mio_ionm_equipo_ultimo";
  var dlgEquipo = document.getElementById("dlg-equipo");
  var equipoAlElegir = null;
  function elegirEquipo(alElegir) {
    var disponibles = equiposConCajas();
    if (disponibles.length < 2) { alElegir(disponibles[0] || equipoNuevo()); return; }
    var ultimo = null;
    try { ultimo = localStorage.getItem(EQUIPO_ULTIMO_KEY); } catch (e) { /* sin persistencia */ }
    if (disponibles.indexOf(ultimo) === -1) ultimo = equipoNuevo();
    equipoAlElegir = alElegir;
    var cont = document.getElementById("equipo-opciones");
    cont.textContent = "";
    var enfocar = null;
    disponibles.forEach(function (eq) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "equipo-opcion" + (eq === ultimo ? " principal" : "");
      b.appendChild(document.createTextNode(cortoEquipo(eq) + " · "));
      b.appendChild(nodoMarcaEquipo(eq));
      b.addEventListener("click", function () {
        try { localStorage.setItem(EQUIPO_ULTIMO_KEY, eq); } catch (e) { /* sin persistencia */ }
        dlgEquipo.close();
        var cb = equipoAlElegir;
        equipoAlElegir = null;
        if (cb) cb(eq);
      });
      cont.appendChild(b);
      if (eq === ultimo) enfocar = b;
    });
    dlgEquipo.showModal();
    if (enfocar) enfocar.focus();
  }
  document.getElementById("equipo-cancelar").addEventListener("click", function () {
    equipoAlElegir = null;
    dlgEquipo.close();
  });

  document.getElementById("caso-crear-informe").addEventListener("click", function () {
    // Lee lo que haya en la ficha ahora mismo -aunque no se haya pulsado
    // "Guardar" todavía- para que el informe refleje lo último escrito,
    // igual que hace "Guardar" antes de persistir.
    leerFichaCaso();
    abrirInformeCasos([casoAbierto]);
  });
  // Menú ⋮ de la barra de la ficha (demo-congreso B1.F1).
  function cerrarMenuCaso() {
    document.getElementById("caso-mas-lista").hidden = true;
    document.getElementById("caso-mas-btn").setAttribute("aria-expanded", "false");
  }
  document.getElementById("caso-mas-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    var lista = document.getElementById("caso-mas-lista");
    lista.hidden = !lista.hidden;
    this.setAttribute("aria-expanded", lista.hidden ? "false" : "true");
  });
  document.getElementById("dlg-caso").addEventListener("click", function (e) {
    if (!e.target.closest("#caso-mas")) cerrarMenuCaso();
  });
  // Elegir cualquier opción del ⋮ (Informe, Hoja de registro...) lo cierra
  document.getElementById("caso-mas-lista").addEventListener("click", function (e) {
    if (e.target.closest("button")) cerrarMenuCaso();
  });
  document.getElementById("caso-borrar").addEventListener("click", function () {
    cerrarMenuCaso();
    var c = casoAbierto;
    var etiqueta = (c.ID_Caso || "") + (c.nombre_caso ? " — " + c.nombre_caso : "");
    if (!confirm(T("caso_borrar_conf", { caso: etiqueta }))) return;
    borrarCaso(c.caso_uid);
    dlgCaso.close();
    avisoGuardado(T("caso_borrado"));
    abrirListaCasos();
  });
  document.getElementById("caso-guardar").addEventListener("click", function () {
    if (guardarFicha(false)) { renderFichaCaso(); }
  });

  document.getElementById("barra-caso-volver").addEventListener("click", function () {
    cerrarMontajeDeCaso(true);
  });
  document.getElementById("caso-volver").addEventListener("click", function () {
    // No guarda por su cuenta: si hay cambios sin guardar, pregunta antes
    // (ver salirDeFicha()).
    salirDeFicha();
  });
  /* «Cerrar caso» (vuelve el 29-09-2026, pedido del usuario tras la
     auditoría: cerrar un caso obligaba a abrir Identificación, cambiar
     Estado y Guardar). Guarda la ficha con el estado cambiado -la lógica de
     guardarFicha(true)- y vuelve a la lista. Sobre un caso cerrado es
     «Reabrir caso»: lo pasa a Preparado y se queda en la ficha. */
  function pintarBotonCerrarCaso() {
    var b = document.getElementById("caso-cerrar");
    var ctl = camposCaso.estado;
    var estado = ctl ? ctl.value : (casoAbierto && casoAbierto.estado);
    b.hidden = estado === "cancelado";
    b.textContent = T(estado === "cerrado" ? "caso_reabrir" : "caso_cerrar");
  }
  document.getElementById("caso-cerrar").addEventListener("click", function () {
    var estabaCerrado = camposCaso.estado && camposCaso.estado.value === "cerrado";
    if (!guardarFicha(true)) return;
    if (estabaCerrado) { renderFichaCaso(); return; }
    dlgCaso.close();
    abrirListaCasos();
  });
  // Esc, o el gesto de atrás en los navegadores que lo convierten en
  // "cancel" del <dialog>: mismo camino que «Volver a la lista».
  dlgCaso.addEventListener("cancel", function (e) {
    e.preventDefault();
    salirDeFicha();
  });

  /* ---------------------------------------------------------------- *
   * Apuntes personales: un documento continuo hecho de varias cajas de
   * texto con título (pedido el 07-09-2026, tarde: al principio era un
   * único textarea, pero según se iba llenando de temas distintos -MEP,
   * SEP, Blink-Reflex...- hacía falta poder separarlos con su propio
   * título y añadir uno nuevo cuando toque). Sigue siendo **un solo
   * documento** -no una lista de notas sueltas con su propio guardado y
   * sincronización cada una, que es justo lo que se quitó en el diseño
   * anterior-: `apunteDoc.secciones` es un array de `{id, titulo, texto}`
   * dentro del mismo `apuntes/documento.json` de siempre, con el mismo
   * autoguardado de todo el documento en cada tecla. Más la lista de
   * fotos adjuntas, igual que antes.
   * ---------------------------------------------------------------- */
  // Galerías de fotos de Mis apuntes: una por caja y la lista suelta de abajo.
  // Cada una registra su función de repintado para poder refrescarlas todas
  // cuando terminan de llegar fotos en segundo plano (sin repintar las cajas,
  // que haría perder el cursor).
  var apunteGalerias = [];          // las de las cajas: se recrean con ellas
  var apunteRepintarSueltas = null; // la de la lista suelta de abajo
  function repintarGaleriasApunte() {
    apunteGalerias.forEach(function (f) { f(); });
    if (apunteRepintarSueltas) apunteRepintarSueltas();
  }

  function quitarFotoApunte(lista, foto) {
    if (!confirm(T("apunte_foto_borrar_conf"))) return false;
    var i = lista.indexOf(foto);
    if (i !== -1) lista.splice(i, 1);
    if (foto.id) borrarFotoIDB("apunte:" + foto.id).catch(function () {});
    if (foto.remota && apunteFotosBorrar.indexOf(foto.id) === -1) apunteFotosBorrar.push(foto.id);
    guardarApunteDoc();
    return true;
  }

  function procesarFotosApunteEn(lista, files, repintar) {
    Array.prototype.slice.call(files || []).forEach(function (fichero) {
      comprimirImagen(fichero, 1100, 0.72).then(function (dataUrl) {
        lista.push({ id: uuid(), nombre: fichero.name, datos: dataUrl });
        repintar();
        guardarApunteDoc();
      }).catch(function () {
        alert(T("caso_imagen_error"));
      });
    });
  }

  // Rellena "cont" con las miniaturas de "lista" -pulsar una abre el visor,
  // × la quita con confirmación-. Una foto que aún no ha llegado (falta
  // bajarla de GitHub) se pinta como marcador vacío.
  function pintarFotosApunte(cont, lista) {
    cont.innerHTML = "";
    (lista || []).forEach(function (foto) {
      var fig = document.createElement("figure");
      fig.className = "apunte-foto" + (foto.datos ? "" : " apunte-foto-pendiente");
      if (foto.datos) {
        var img = document.createElement("img");
        img.src = foto.datos;
        img.alt = foto.nombre || "";
        img.title = T("apunte_foto_ver_tit");
        img.addEventListener("click", function () { abrirFotoSonda(foto.datos, foto.nombre || ""); });
        fig.appendChild(img);
      } else {
        fig.textContent = "…";
      }
      var quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "apunte-foto-quitar";
      quitar.textContent = "×";
      quitar.title = T("apunte_foto_quitar_tit");
      quitar.addEventListener("click", function () {
        if (quitarFotoApunte(lista, foto)) pintarFotosApunte(cont, lista);
      });
      fig.appendChild(quitar);
      cont.appendChild(fig);
    });
  }

  // Fotos de una caja: miniaturas + "Añadir foto" (galería) + cámara.
  function crearFotosSeccionApunte(seccion) {
    if (!seccion.fotos) seccion.fotos = [];
    var caja = document.createElement("div");
    caja.className = "apunte-fotos-seccion";
    var galeria = document.createElement("div");
    galeria.className = "apunte-fotos";
    var repintar = function () { pintarFotosApunte(galeria, seccion.fotos); };
    apunteGalerias.push(repintar);
    repintar();
    var entrada = document.createElement("input");
    entrada.type = "file";
    entrada.accept = "image/*";
    entrada.multiple = true;
    entrada.hidden = true;
    entrada.addEventListener("change", function () {
      procesarFotosApunteEn(seccion.fotos, entrada.files, repintar);
      entrada.value = "";
    });
    var anadir = document.createElement("button");
    anadir.type = "button";
    anadir.className = "apunte-foto-anadir";
    anadir.textContent = T("apunte_foto_anadir_caja");
    anadir.addEventListener("click", function () { entrada.click(); });
    var camara = crearBotonCamara(function (files) { procesarFotosApunteEn(seccion.fotos, files, repintar); });
    var acciones = document.createElement("div");
    acciones.className = "apunte-foto-entrada";
    acciones.appendChild(anadir);
    acciones.appendChild(camara.boton);
    caja.appendChild(galeria);
    caja.appendChild(acciones);
    caja.appendChild(entrada);
    caja.appendChild(camara.entrada);
    return caja;
  }

  function renderFotosApunteDoc() {
    var cont = document.getElementById("apunte-fotos");
    var repintar = function () { pintarFotosApunte(cont, apunteDoc.fotos); };
    apunteRepintarSueltas = repintar;
    repintar();
  }

  function renderApunteMeta() {
    var meta = document.getElementById("apunte-meta");
    if (!apunteDoc.editado_en) {
      meta.textContent = "";
      return;
    }
    meta.textContent = T("apunte_meta_editado", {
      fecha: new Date(apunteDoc.editado_en).toLocaleString(localeActual())
    });
  }

  /* Texto con negrita en las cajas de Apuntes (24-09-2026): cada caja es
     ahora un editor (contenteditable) con botón B / Ctrl+B. Se guarda el
     HTML SANEADO en `seccion.html` -solo <b>, <i>, <br> y <div>, nada más
     sobrevive- y, aparte, el texto plano en `seccion.texto` (lo que leía la
     versión anterior de la app y lo que usa la exportación). Una caja antigua
     sin `html` se pinta a partir de su `texto`. */
  function apunteEscapar(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function apunteTextoAHtml(texto) {
    return apunteEscapar(texto || "").split("\n").join("<br>");
  }
  // DOMParser es inerte -no ejecuta scripts ni carga imágenes-, a diferencia
  // de asignar innerHTML a un elemento suelto (un <img onerror> sí se ejecuta).
  function apunteSanear(html) {
    var doc = new DOMParser().parseFromString("<body>" + (html || "") + "</body>", "text/html");
    function rec(nodo) {
      var out = "";
      for (var n = nodo.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) { out += apunteEscapar(n.nodeValue); continue; }
        if (n.nodeType !== 1) continue;
        var tag = n.nodeName.toLowerCase();
        if (tag === "script" || tag === "style") continue;
        var dentro = rec(n);
        if (tag === "b" || tag === "strong") out += "<b>" + dentro + "</b>";
        else if (tag === "i" || tag === "em") out += "<i>" + dentro + "</i>";
        else if (tag === "br") out += "<br>";
        else if (tag === "div" || tag === "p") out += "<div>" + (dentro || "<br>") + "</div>";
        else if (tag === "span" && /font-weight\s*:\s*(bold|[6-9]00)/i.test(n.getAttribute("style") || "")) out += "<b>" + dentro + "</b>";
        else out += dentro;
      }
      return out;
    }
    return rec(doc.body);
  }
  function htmlDeSeccionApunte(seccion) {
    return seccion.html ? apunteSanear(seccion.html) : apunteTextoAHtml(seccion.texto);
  }

  // Colores de carpeta: ocho tonos bien separados, para distinguirlas de un
  // vistazo. Cada carpeta guarda el suyo (`color`); una sin color -las
  // creadas antes de este cambio- recibe uno por su posición.
  var APUNTE_COLORES = ["#2e8b6b", "#3b7ddd", "#8a5cd0", "#e08a1e", "#d6456f", "#1fa3b5", "#a08d0b", "#d64d3f"];
  var APUNTE_COLOR_SIN_CARPETA = "#7a8791";
  function asegurarColoresCarpetasApunte() {
    (apunteDoc.carpetas || []).forEach(function (c, i) {
      if (!c.color) c.color = APUNTE_COLORES[i % APUNTE_COLORES.length];
    });
  }

  function nuevaCarpetaApunte() {
    var nombre = (prompt(T("apunte_carpeta_nueva_prompt")) || "").trim();
    if (!nombre) return;
    apunteDoc.carpetas = apunteDoc.carpetas || [];
    apunteDoc.carpetas.push({ id: uuid(), nombre: nombre, color: APUNTE_COLORES[apunteDoc.carpetas.length % APUNTE_COLORES.length] });
    renderSeccionesApunte();
    guardarApunteDoc();
  }

  function renombrarCarpetaApunte(carpeta) {
    var nombre = (prompt(T("apunte_carpeta_renombrar_prompt"), carpeta.nombre) || "").trim();
    if (!nombre) return;
    carpeta.nombre = nombre;
    renderSeccionesApunte();
    guardarApunteDoc();
  }

  // Cada pulsación pasa al siguiente color de la paleta. Se cambia EN EL
  // SITIO -sin repintar la lista entera-: repintar reabría todas las
  // carpetas y hacía perder de vista la que se estaba tocando.
  function cambiarColorCarpetaApunte(carpeta, det, resumen, muestra) {
    var i = APUNTE_COLORES.indexOf(carpeta.color);
    carpeta.color = APUNTE_COLORES[(i + 1) % APUNTE_COLORES.length];
    det.style.setProperty("--carpeta-color", carpeta.color);
    resumen.style.backgroundColor = carpeta.color + "26";
    muestra.style.backgroundColor = carpeta.color;
    guardarApunteDoc();
  }

  // Qué carpetas están abiertas: se recuerda por id (y "__sin" para "Sin
  // carpeta") para que cualquier repintado -mover, renombrar, borrar...- las
  // deje como estaban. Por defecto todas abiertas. Solo de este dispositivo.
  var APUNTE_CARPETAS_ABIERTAS_KEY = "mio_ionm_apuntes_carpetas_abiertas_v1";
  var apunteCarpetasAbiertas = null;
  function carpetaApunteAbierta(id) {
    if (!apunteCarpetasAbiertas) {
      try { apunteCarpetasAbiertas = JSON.parse(localStorage.getItem(APUNTE_CARPETAS_ABIERTAS_KEY) || "{}") || {}; }
      catch (e) { apunteCarpetasAbiertas = {}; }
    }
    return apunteCarpetasAbiertas[id] !== 0;
  }
  function recordarCarpetaApunte(id, abierta) {
    carpetaApunteAbierta(id);
    if (abierta) delete apunteCarpetasAbiertas[id]; else apunteCarpetasAbiertas[id] = 0;
    try { localStorage.setItem(APUNTE_CARPETAS_ABIERTAS_KEY, JSON.stringify(apunteCarpetasAbiertas)); } catch (e) { /* sin persistencia */ }
  }

  // Borrar una carpeta nunca borra lo que hay dentro -mismo criterio que
  // "desactivar no borra" de los catálogos-: las cajas se quedan, solo
  // pierden su carpeta y vuelven a "Sin carpeta".
  function borrarCarpetaApunte(carpeta) {
    if (!confirm(T("apunte_carpeta_borrar_conf", { nombre: carpeta.nombre }))) return;
    (apunteDoc.secciones || []).forEach(function (s) {
      if (s.carpeta_id === carpeta.id) s.carpeta_id = "";
    });
    apunteDoc.carpetas = (apunteDoc.carpetas || []).filter(function (c) { return c.id !== carpeta.id; });
    renderSeccionesApunte();
    guardarApunteDoc();
  }

  // Reordenar con flechas y no arrastrando: en pantalla táctil arrastrar es
  // poco fiable (mismo criterio que la ventana de Catálogos).
  function moverCarpetaApunte(carpeta, dir) {
    var lista = apunteDoc.carpetas || [];
    var i = lista.indexOf(carpeta), j = i + dir;
    if (i === -1 || j < 0 || j >= lista.length) return;
    var tmp = lista[i]; lista[i] = lista[j]; lista[j] = tmp;
    renderSeccionesApunte();
    guardarApunteDoc();
  }

  // Una caja solo se mueve dentro de su grupo -su carpeta, o "Sin carpeta"-:
  // se intercambia con la vecina de ese mismo grupo en el array general.
  function moverSeccionApunte(seccion, dir) {
    var todas = apunteDoc.secciones || [];
    var grupo = todas.filter(function (s) { return (s.carpeta_id || "") === (seccion.carpeta_id || ""); });
    var i = grupo.indexOf(seccion), j = i + dir;
    if (i === -1 || j < 0 || j >= grupo.length) return;
    var a = todas.indexOf(grupo[i]), b = todas.indexOf(grupo[j]);
    var tmp = todas[a]; todas[a] = todas[b]; todas[b] = tmp;
    renderSeccionesApunte();
    guardarApunteDoc();
  }

  function botonFlechaApunte(texto, titulo, deshabilitado, alPulsar) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "apunte-flecha";
    b.textContent = texto;
    b.title = titulo;
    b.disabled = deshabilitado;
    b.addEventListener("click", function (e) { e.preventDefault(); alPulsar(); });
    return b;
  }

  // pos/total: lugar de la caja dentro de su grupo, para desactivar las
  // flechas en los extremos.
  function crearSeccionApunte(seccion, pos, total) {
    var div = document.createElement("div");
    div.className = "apunte-seccion";

    var cab = document.createElement("div");
    cab.className = "apunte-seccion-cab";
    var flechas = document.createElement("span");
    flechas.className = "apunte-flechas";
    flechas.appendChild(botonFlechaApunte("▲", T("apunte_seccion_subir_tit"), pos === 0, function () { moverSeccionApunte(seccion, -1); }));
    flechas.appendChild(botonFlechaApunte("▼", T("apunte_seccion_bajar_tit"), pos === total - 1, function () { moverSeccionApunte(seccion, 1); }));
    cab.appendChild(flechas);

    var titulo = document.createElement("input");
    titulo.type = "text";
    titulo.className = "apunte-seccion-titulo";
    titulo.placeholder = T("apunte_seccion_titulo_ph");
    titulo.value = seccion.titulo || "";
    titulo.addEventListener("input", function () {
      seccion.titulo = titulo.value;
      guardarApunteDoc();
    });
    cab.appendChild(titulo);

    // El selector de carpeta solo aparece si ya existe alguna: sin
    // carpetas creadas, "mover a..." con la única opción "Sin carpeta" no
    // serviría de nada, solo sería ruido para quien no las usa.
    if ((apunteDoc.carpetas || []).length) {
      var mover = document.createElement("select");
      mover.className = "apunte-seccion-carpeta";
      mover.title = T("apunte_seccion_mover_tit");
      var opcSin = document.createElement("option");
      opcSin.value = "";
      opcSin.textContent = T("apunte_carpeta_sin");
      mover.appendChild(opcSin);
      apunteDoc.carpetas.forEach(function (c) {
        var opc = document.createElement("option");
        opc.value = c.id;
        opc.textContent = c.nombre;
        mover.appendChild(opc);
      });
      mover.value = seccion.carpeta_id || "";
      mover.addEventListener("change", function () {
        seccion.carpeta_id = mover.value;
        renderSeccionesApunte();
        guardarApunteDoc();
      });
      cab.appendChild(mover);
    }
    div.appendChild(cab);

    // Barra de formato: solo negrita por ahora (también Ctrl+B). mousedown
    // con preventDefault para que pulsar el botón no quite el foco -ni la
    // selección- del editor.
    var barra = document.createElement("div");
    barra.className = "apunte-formato";
    var negrita = document.createElement("button");
    negrita.type = "button";
    negrita.className = "apunte-formato-btn";
    negrita.innerHTML = "<b>B</b>";
    negrita.title = T("apunte_negrita_tit");
    negrita.addEventListener("mousedown", function (e) { e.preventDefault(); });
    negrita.addEventListener("click", function () {
      editor.focus();
      document.execCommand("bold", false, null);
    });
    barra.appendChild(negrita);
    var cursiva = document.createElement("button");
    cursiva.type = "button";
    cursiva.className = "apunte-formato-btn";
    cursiva.innerHTML = "<i>I</i>";
    cursiva.title = T("apunte_cursiva_tit");
    cursiva.addEventListener("mousedown", function (e) { e.preventDefault(); });
    cursiva.addEventListener("click", function () {
      editor.focus();
      document.execCommand("italic", false, null);
    });
    barra.appendChild(cursiva);
    div.appendChild(barra);

    var editor = document.createElement("div");
    editor.className = "apunte-editor";
    editor.contentEditable = "true";
    editor.setAttribute("role", "textbox");
    editor.setAttribute("aria-multiline", "true");
    editor.setAttribute("data-ph", T("apunte_editor_ph"));
    editor.innerHTML = htmlDeSeccionApunte(seccion);
    editor.addEventListener("input", function () {
      seccion.html = apunteSanear(editor.innerHTML);
      seccion.texto = editor.innerText.replace(/\u00a0/g, " ");
      guardarApunteDoc();
    });
    // Pegar siempre como texto plano: lo que llega de otras webs o de Word
    // trae estilos y tamaños que descuadrarían la caja.
    editor.addEventListener("paste", function (e) {
      var cd = e.clipboardData || window.clipboardData;
      if (!cd) return;
      e.preventDefault();
      var txt = cd.getData("text/plain") || cd.getData("Text") || "";
      document.execCommand("insertText", false, txt);
    });
    div.appendChild(editor);
    div.appendChild(crearFotosSeccionApunte(seccion));
    return div;
  }

  // carpeta === null es el grupo fijo "Sin carpeta" -no se puede renombrar
  // ni borrar ni mover, siempre está presente en cuanto hay alguna carpeta de
  // verdad, aunque esté vacío, para que quede claro dónde "aterrizan" las
  // cajas nuevas y adónde vuelve una caja al sacarla de una carpeta-.
  // Mismo patrón de <details><summary> con botones dentro que ya usa
  // #panel-catalogo (Etiquetas/+): hay que interceptar el click de los
  // botones con preventDefault(), o alternarían también el plegado del
  // grupo entero.
  function grupoCarpetaApunte(carpeta, secciones, indice, totalCarpetas) {
    var color = carpeta ? carpeta.color : APUNTE_COLOR_SIN_CARPETA;
    var det = document.createElement("details");
    det.className = "caso-grupo apunte-carpeta";
    var idCarpeta = carpeta ? carpeta.id : "__sin";
    det.open = carpetaApunteAbierta(idCarpeta);
    det.addEventListener("toggle", function () { recordarCarpetaApunte(idCarpeta, det.open); });
    det.style.setProperty("--carpeta-color", color);

    var resumen = document.createElement("summary");
    resumen.style.backgroundColor = color + "26";

    var icono = document.createElement("span");
    icono.className = "apunte-carpeta-icono";
    icono.textContent = "\uD83D\uDCC1";
    resumen.appendChild(icono);

    var nombre = document.createElement("span");
    nombre.className = "apunte-carpeta-nombre";
    nombre.textContent = carpeta ? carpeta.nombre : T("apunte_carpeta_sin");
    resumen.appendChild(nombre);

    var cuenta = document.createElement("span");
    cuenta.className = "apunte-carpeta-cuenta";
    cuenta.textContent = secciones.length;
    resumen.appendChild(cuenta);

    if (carpeta) {
      var accion = function (texto, titulo, alPulsar, deshabilitado) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "apunte-carpeta-accion";
        b.textContent = texto;
        b.title = titulo;
        b.disabled = !!deshabilitado;
        b.addEventListener("click", alPulsar);
        resumen.appendChild(b);
        return b;
      };
      var muestra = accion("", T("apunte_carpeta_color_tit"), function () { cambiarColorCarpetaApunte(carpeta, det, resumen, muestra); });
      muestra.className += " apunte-carpeta-color";
      muestra.style.backgroundColor = color;
      accion("▲", T("apunte_carpeta_subir_tit"), function () { moverCarpetaApunte(carpeta, -1); }, indice === 0);
      accion("▼", T("apunte_carpeta_bajar_tit"), function () { moverCarpetaApunte(carpeta, 1); }, indice === totalCarpetas - 1);
      accion("✎", T("apunte_carpeta_renombrar_tit"), function () { renombrarCarpetaApunte(carpeta); });
      accion("✕", T("apunte_carpeta_borrar_tit"), function () { borrarCarpetaApunte(carpeta); });
    }

    resumen.addEventListener("click", function (e) {
      if (e.target.closest("button")) e.preventDefault();
    });

    det.appendChild(resumen);

    var cont = document.createElement("div");
    cont.className = "apunte-carpeta-contenido";
    if (!secciones.length) {
      var vacio = document.createElement("p");
      vacio.className = "empty-hint";
      vacio.textContent = T("apunte_carpeta_vacia");
      cont.appendChild(vacio);
    } else {
      secciones.forEach(function (s, i) { cont.appendChild(crearSeccionApunte(s, i, secciones.length)); });
    }
    det.appendChild(cont);
    return det;
  }

  // Se llama al abrir la pantalla y al bajar una versión más nueva desde
  // GitHub mientras está abierta (ver bajarApunteDoc()): repinta todas las
  // cajas, así que si el usuario está escribiendo justo cuando llega una
  // bajada se perdería el cursor -no debería pasar en el uso normal (un
  // solo dispositivo escribe a la vez), documentado y ya está.
  function renderSeccionesApunte() {
    var cont = document.getElementById("apunte-secciones");
    // Al repintar se pierde la altura de la lista un instante y el navegador
    // sube la página: se guarda la posición y se devuelve.
    var scrollY = window.pageYOffset;
    pintarSeccionesApunte(cont);
    window.scrollTo(0, scrollY);
  }

  function pintarSeccionesApunte(cont) {
    cont.innerHTML = "";
    // Las galerías de las cajas se recrean con ellas.
    apunteGalerias = [];
    var secciones = apunteDoc.secciones || [];
    var carpetas = apunteDoc.carpetas || [];
    asegurarColoresCarpetasApunte();

    if (!secciones.length && !carpetas.length) {
      var vacio = document.createElement("p");
      vacio.className = "empty-hint";
      vacio.textContent = T("apunte_secciones_vacio");
      cont.appendChild(vacio);
      return;
    }

    // Sin carpetas creadas todavía: lista plana, exactamente igual que
    // antes de que existieran -así quien no las usa no ve ningún cambio-.
    if (!carpetas.length) {
      secciones.forEach(function (s, i) { cont.appendChild(crearSeccionApunte(s, i, secciones.length)); });
      return;
    }

    var sinCarpeta = secciones.filter(function (s) { return !s.carpeta_id; });
    cont.appendChild(grupoCarpetaApunte(null, sinCarpeta, -1, carpetas.length));
    carpetas.forEach(function (c, i) {
      var deLaCarpeta = secciones.filter(function (s) { return s.carpeta_id === c.id; });
      cont.appendChild(grupoCarpetaApunte(c, deLaCarpeta, i, carpetas.length));
    });
  }

  function renderApunteDoc() {
    renderSeccionesApunte();
    renderFotosApunteDoc();
    renderApunteMeta();
  }

  function abrirApunteDoc() {
    renderApunteDoc();
    irAPantalla("apuntes");
  }

  document.getElementById("tile-apuntes").addEventListener("click", abrirApunteDoc);

  document.getElementById("apunte-anadir-seccion").addEventListener("click", function () {
    apunteDoc.secciones = apunteDoc.secciones || [];
    apunteDoc.secciones.push({ id: uuid(), titulo: "", texto: "" });
    renderSeccionesApunte();
    guardarApunteDoc();
    // El foco va al título de la caja recién creada -la última del
    // contenedor-, para escribir directo sin tener que buscarla.
    var cajas = document.querySelectorAll("#apunte-secciones .apunte-seccion-titulo");
    if (cajas.length) cajas[cajas.length - 1].focus();
  });

  document.getElementById("apunte-anadir-carpeta").addEventListener("click", nuevaCarpetaApunte);

  // Botón Guardar siempre visible mientras se escribe (barra pegada abajo):
  // todo ya se guarda solo en cada tecla, pero da confirmación visible y, con
  // la sincronización conectada, sube AHORA en vez de esperar la cuenta atrás.
  document.getElementById("apunte-guardar").addEventListener("click", function () {
    guardarApunteDoc();
    if (syncActivo()) subirAuto();
    avisoGuardado(T("apunte_guardado_estado", { hora: apunteHoraGuardado }));
  });

  // Cada foto se guarda como data URL dentro del propio documento -mismo
  // archivo que se sube a apuntes/documento.json-, sin servidor de
  // imágenes aparte: proporcionado para unas pocas fotos personales.
  // Se comprime igual que "Imágenes del montaje" en la ficha del caso
  // (comprimirImagen(), 1100px de lado máximo, calidad 0.72) -sin esto, una
  // foto de cámara de móvil sin comprimir son varios MB, y varias de
  // golpe hacen que apuntes/documento.json pase con facilidad de 10 MB:
  // por encima del límite de 1 MB que la API de Contenidos de GitHub
  // admite para leer el archivo de vuelta, así que ni siquiera se podía
  // volver a bajar -pasó de verdad el 07-09-2026, con 2 fotos de cámara
  // sin comprimir metidas a mano al migrar los apuntes antiguos; ver
  // "Retoques posteriores" de esa fecha para cómo se recuperó-.
  function procesarFotosApunte(files) {
    procesarFotosApunteEn(apunteDoc.fotos = apunteDoc.fotos || [], files, renderFotosApunteDoc);
  }
  document.getElementById("apunte-foto-input").addEventListener("change", function (e) {
    procesarFotosApunte(e.target.files);
    e.target.value = "";
  });
  // Botón "tomar foto" (23-09-2026), aparte del selector de galería de
  // arriba -ver crearBotonCamara()-.
  (function () {
    var camara = crearBotonCamara(procesarFotosApunte);
    document.getElementById("apunte-foto-camara-slot").appendChild(camara.boton);
    document.getElementById("apunte-foto-camara-slot").appendChild(camara.entrada);
  })();

  // Exporta el documento entero (secciones + fotos) en un .json, igual de
  // sencillo que "Exportar copia" del estado general (mismo patrón Blob +
  // <a download>).
  document.getElementById("btn-exportar-apuntes").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(apunteDoc, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "mio-apuntes-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    avisoGuardado(T("apuntes_exportado"));
  });

  /* ---------------------------------------------------------------- *
   * Exportar Mis apuntes como Word (.docx) (24-09-2026)
   *
   * Un .docx es un zip de XML. Sin librerías (regla 4): un escritor de zip
   * "sin comprimir" (método 0, basta para Word) + el XML mínimo del documento.
   * Estructura: título, y por cada carpeta (color propio) un Título 1, por cada
   * caja un Título 2 con su texto -negrita y cursiva incluidas- y sus fotos
   * debajo; al final, las fotos sueltas. Las fotos que aún no se han bajado a
   * este dispositivo no salen.
   * ---------------------------------------------------------------- */
  var CRC32_TABLA = null;
  function crc32(bytes) {
    if (!CRC32_TABLA) {
      CRC32_TABLA = [];
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        CRC32_TABLA[n] = c >>> 0;
      }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = CRC32_TABLA[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function bytesDeTexto(texto) {
    var bin = unescape(encodeURIComponent(texto));
    var b = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return b;
  }
  function bytesDeBase64(b64) {
    var bin = atob(b64);
    var b = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return b;
  }

  // archivos: [{ nombre, bytes }] -> Uint8Array con el zip.
  function zipSinComprimir(archivos) {
    var partes = [], central = [], offset = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    archivos.forEach(function (a) {
      var nombre = bytesDeTexto(a.nombre), crc = crc32(a.bytes), tam = a.bytes.length;
      var cab = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
        u32(crc), u32(tam), u32(tam), u16(nombre.length), u16(0));
      partes.push(new Uint8Array(cab), nombre, a.bytes);
      central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
        u32(crc), u32(tam), u32(tam), u16(nombre.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), nombre);
      offset += cab.length + nombre.length + tam;
    });
    var tamCentral = central.reduce(function (t, p) { return t + p.length; }, 0);
    var fin = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(archivos.length), u16(archivos.length),
      u32(tamCentral), u32(offset), u16(0)));
    var todos = partes.concat(central, [fin]);
    var total = todos.reduce(function (t, p) { return t + p.length; }, 0);
    var salida = new Uint8Array(total), pos = 0;
    todos.forEach(function (p) { salida.set(p, pos); pos += p.length; });
    return salida;
  }

  function xmlEscapar(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  // Un trozo de texto con su formato; los saltos de línea son <w:br/>.
  function docxRuns(texto, negrita, cursiva, color) {
    var rpr = (negrita ? "<w:b/>" : "") + (cursiva ? "<w:i/>" : "") + (color ? '<w:color w:val="' + color + '"/>' : "");
    return String(texto).split("\n").map(function (linea, i) {
      return (i ? "<w:r><w:br/></w:r>" : "") +
        '<w:r>' + (rpr ? "<w:rPr>" + rpr + "</w:rPr>" : "") + '<w:t xml:space="preserve">' + xmlEscapar(linea) + "</w:t></w:r>";
    }).join("");
  }
  function docxParrafo(runs, estilo) {
    return "<w:p>" + (estilo ? '<w:pPr><w:pStyle w:val="' + estilo + '"/></w:pPr>' : "") + runs + "</w:p>";
  }
  // El HTML saneado de una caja (<b>, <i>, <br>, <div>) a párrafos de Word.
  function docxParrafosDeHtml(html) {
    var doc = new DOMParser().parseFromString("<body>" + (html || "") + "</body>", "text/html");
    var parrafos = [], actual = "";
    function volcar() { parrafos.push(docxParrafo(actual)); actual = ""; }
    function rec(nodo, b, i) {
      for (var n = nodo.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) {
          if (n.nodeValue) actual += docxRuns(n.nodeValue, b, i);
        } else if (n.nodeType === 1) {
          var t = n.nodeName.toLowerCase();
          if (t === "br") actual += "<w:r><w:br/></w:r>";
          else if (t === "div" || t === "p") { if (actual) volcar(); rec(n, b, i); volcar(); }
          else rec(n, b || t === "b" || t === "strong", i || t === "i" || t === "em");
        }
      }
    }
    rec(doc.body, false, false);
    if (actual) volcar();
    return parrafos;
  }

  function dimensionesImagen(dataUrl) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { resolve({ w: im.naturalWidth || 800, h: im.naturalHeight || 600 }); };
      im.onerror = function () { resolve({ w: 800, h: 600 }); };
      im.src = dataUrl;
    });
  }

  function exportarApuntesWord() {
    var imagenes = [];   // { rid, nombre, bytes, w, h }
    var pendientes = [];
    // Registra una foto y devuelve el párrafo con su imagen (la XML se
    // completa cuando se conocen sus dimensiones, ver más abajo).
    function parrafoFoto(foto) {
      var marca = "@@FOTO" + imagenes.length + "@@";
      var partes = String(foto.datos).split(",");
      var esPng = /image\/png/i.test(partes[0]);
      var img = { rid: "rId" + (imagenes.length + 2), nombre: "foto" + (imagenes.length + 1) + (esPng ? ".png" : ".jpg"),
        bytes: bytesDeBase64(partes[1] || ""), marca: marca };
      imagenes.push(img);
      pendientes.push(dimensionesImagen(foto.datos).then(function (d) { img.w = d.w; img.h = d.h; }));
      return marca;
    }
    function fotosDe(lista) {
      return (lista || []).filter(function (f) { return f && f.datos; }).map(parrafoFoto);
    }

    var cuerpo = [];
    var hoy = new Date().toLocaleDateString(localeActual());
    cuerpo.push(docxParrafo(docxRuns(T("tile_apuntes")), "Title"));
    cuerpo.push(docxParrafo(docxRuns(T("apuntes_word_fecha", { fecha: hoy }), false, true)));

    function volcarCaja(sec, conCarpeta) {
      var titulo = (sec.titulo || "").trim();
      cuerpo.push(docxParrafo(docxRuns(titulo || T("apuntes_word_sin_titulo")), conCarpeta ? "Heading2" : "Heading1"));
      docxParrafosDeHtml(htmlDeSeccionApunte(sec)).forEach(function (p) { cuerpo.push(p); });
      fotosDe(sec.fotos).forEach(function (m) { cuerpo.push(m); });
    }
    var secciones = apunteDoc.secciones || [], carpetas = apunteDoc.carpetas || [];
    if (!carpetas.length) {
      secciones.forEach(function (sec) { volcarCaja(sec, false); });
    } else {
      var grupo = function (nombre, color, lista) {
        if (!lista.length) return;
        cuerpo.push(docxParrafo(docxRuns(nombre, false, false, (color || "").replace("#", "")), "Heading1"));
        lista.forEach(function (sec) { volcarCaja(sec, true); });
      };
      grupo(T("apunte_carpeta_sin"), APUNTE_COLOR_SIN_CARPETA, secciones.filter(function (x) { return !x.carpeta_id; }));
      carpetas.forEach(function (c) {
        grupo(c.nombre, c.color, secciones.filter(function (x) { return x.carpeta_id === c.id; }));
      });
    }
    var sueltas = fotosDe(apunteDoc.fotos);
    if (sueltas.length) {
      cuerpo.push(docxParrafo(docxRuns(T("apunte_campo_fotos")), "Heading1"));
      sueltas.forEach(function (m) { cuerpo.push(m); });
    }

    return Promise.all(pendientes).then(function () {
      var contador = 0;
      var xmlCuerpo = cuerpo.map(function (p) {
        var img = imagenes.filter(function (x) { return x.marca === p; })[0];
        if (!img) return p;
        contador++;
        var ancho = Math.min(img.w * 9525, 5400000);     // 15 cm como máximo
        var alto = Math.round(ancho * img.h / img.w);
        return '<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + ancho + '" cy="' + alto + '"/>' +
          '<wp:docPr id="' + contador + '" name="Foto ' + contador + '"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
          '<pic:pic><pic:nvPicPr><pic:cNvPr id="' + contador + '" name="' + img.nombre + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
          '<pic:blipFill><a:blip r:embed="' + img.rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
          '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + ancho + '" cy="' + alto + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
          '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
      }).join("");

      var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
        'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
      var CAB = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
      var documento = CAB + "<w:document " + NS + "><w:body>" + xmlCuerpo +
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>' +
        "</w:body></w:document>";
      function estilo(id, nombre, tam, color, antes, outline) {
        return '<w:style w:type="paragraph" w:styleId="' + id + '"><w:name w:val="' + nombre + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>' +
          '<w:pPr><w:keepNext/><w:spacing w:before="' + antes + '" w:after="120"/>' + (outline !== null ? '<w:outlineLvl w:val="' + outline + '"/>' : "") + "</w:pPr>" +
          '<w:rPr><w:b/><w:sz w:val="' + tam + '"/><w:color w:val="' + color + '"/></w:rPr></w:style>';
      }
      var estilos = CAB + '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault>' +
        '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
        '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
        estilo("Title", "Title", 44, "14705A", 0, null) + estilo("Heading1", "heading 1", 32, "14705A", 360, 0) +
        estilo("Heading2", "heading 2", 26, "333333", 240, 1) + "</w:styles>";
      var relsDoc = CAB + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        imagenes.map(function (im) {
          return '<Relationship Id="' + im.rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + im.nombre + '"/>';
        }).join("") + "</Relationships>";
      var relsRaiz = CAB + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
      var tipos = CAB + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>';

      var archivos = [
        { nombre: "[Content_Types].xml", bytes: bytesDeTexto(tipos) },
        { nombre: "_rels/.rels", bytes: bytesDeTexto(relsRaiz) },
        { nombre: "word/document.xml", bytes: bytesDeTexto(documento) },
        { nombre: "word/styles.xml", bytes: bytesDeTexto(estilos) },
        { nombre: "word/_rels/document.xml.rels", bytes: bytesDeTexto(relsDoc) }
      ].concat(imagenes.map(function (im) { return { nombre: "word/media/" + im.nombre, bytes: im.bytes }; }));
      return zipSinComprimir(archivos);
    });
  }

  document.getElementById("btn-exportar-apuntes-word").addEventListener("click", function () {
    exportarApuntesWord().then(function (bytes) {
      var blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "mio-apuntes-" + new Date().toISOString().slice(0, 10) + ".docx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      avisoGuardado(T("apuntes_exportado_word"));
    }).catch(function (e) { alert(T("apuntes_word_error", { error: e && e.message ? e.message : e })); });
  });

  /* ---------------------------------------------------------------- *
   * Diálogo de catálogos
   *
   * Una sola ventana con pestañas en vez de cuatro botones en la barra:
   * en el móvil la barra ya va justa, y las cuatro listas se manejan igual.
   * Reordenar va con flechas y no arrastrando, que en pantalla táctil es
   * poco fiable.
   * ---------------------------------------------------------------- */
  var dlgCat = document.getElementById("dlg-catalogos");
  var catPestana = "tecnicas";
  var catEditando = null;    // id que se está editando, o null si es nuevo
  var catCampos = {};        // clave -> elemento del formulario
  var PREFIJO_ID = { tecnicas: "t_", servicios: "s_", intervenciones: "i_", perfiles: "p_",
                     usuarios: "u_" };

  function catLista() {
    return { tecnicas: TECNICAS, servicios: SERVICIOS,
             intervenciones: INTERVENCIONES, perfiles: PERFILES,
             usuarios: USUARIOS }[catPestana];
  }

  function catIndice() {
    return { tecnicas: TECS, servicios: SERV,
             intervenciones: INTERV, perfiles: PERF,
             usuarios: USRS }[catPestana];
  }

  // Las técnicas llaman "etiqueta" a su texto visible; el resto, "nombre".
  function catClaveTexto() {
    return catPestana === "tecnicas" ? "etiqueta" : "nombre";
  }

  function catError(texto) {
    var el = document.getElementById("cat-error");
    el.textContent = texto || "";
    el.hidden = !texto;
  }

  function renderCatPestanas() {
    var cont = document.getElementById("cat-pestanas");
    cont.innerHTML = "";
    CATALOGOS.forEach(function (n) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pestana" + (n === catPestana ? " activa" : "");
      b.textContent = T("tab_" + n);
      b.addEventListener("click", function () {
        catPestana = n;
        catEditando = null;
        renderDlgCatalogos();
      });
      cont.appendChild(b);
    });
  }

  function renderCatLista() {
    var cont = document.getElementById("cat-lista");
    cont.innerHTML = "";
    var lista = catLista();
    var clave = catClaveTexto();

    if (!lista.length) {
      var vacio = document.createElement("p");
      vacio.className = "empty-hint";
      vacio.textContent = T("cat_sin_elementos");
      cont.appendChild(vacio);
      return;
    }

    lista.forEach(function (e, i) {
      var fila = document.createElement("div");
      fila.className = "cat-fila" +
        (e.id === catEditando ? " editando" : "") +
        (e.activa === false ? " desactivada" : "");

      var mover = document.createElement("span");
      mover.className = "cat-mover";
      [["▲", -1, i === 0, "cat_subir"], ["▼", 1, i === lista.length - 1, "cat_bajar"]]
        .forEach(function (def) {
          var b = document.createElement("button");
          b.type = "button";
          b.textContent = def[0];
          b.title = T(def[3]);
          b.disabled = def[2];
          b.addEventListener("click", function () { moverCat(e.id, def[1]); });
          mover.appendChild(b);
        });
      fila.appendChild(mover);

      var texto = document.createElement("button");
      texto.type = "button";
      texto.className = "cat-nombre";
      texto.title = T("cat_editar_tit");
      texto.textContent = campo(e, clave) || e.id;
      texto.addEventListener("click", function () {
        catEditando = e.id;
        catError(null);
        renderDlgCatalogos();
      });
      fila.appendChild(texto);

      var extra = document.createElement("span");
      extra.className = "cat-extra";
      if (catPestana === "tecnicas") {
        extra.textContent = T("grupo_" + e.grupo);
      } else if (catPestana === "intervenciones") {
        extra.textContent = [e.codigo, SERV[e.servicio] ? campo(SERV[e.servicio], "nombre") : ""]
          .filter(Boolean).join(" · ");
      } else if (catPestana === "perfiles") {
        extra.textContent = T("cat_n_tecnicas", { n: (e.tecnicas || []).length });
      }
      fila.appendChild(extra);

      var estado = document.createElement("button");
      estado.type = "button";
      estado.className = "cat-activa";
      estado.textContent = e.activa === false ? "☐" : "☑";
      estado.title = T(e.activa === false ? "cat_activar" : "cat_desactivar");
      estado.addEventListener("click", function () { alternarActivaCat(e.id); });
      fila.appendChild(estado);

      cont.appendChild(fila);
    });
  }

  /* Constructores de campos del formulario. Devuelven el .campo ya montado y
     dejan el control en catCampos para leerlo al guardar. */
  function catCampo(clave, etiqueta, control, ayuda) {
    var div = document.createElement("div");
    div.className = "campo";
    var lab = document.createElement("label");
    lab.textContent = etiqueta;
    lab.setAttribute("for", "cat-f-" + clave);
    control.id = "cat-f-" + clave;
    div.appendChild(lab);
    div.appendChild(control);
    if (ayuda) {
      var small = document.createElement("small");
      small.textContent = ayuda;
      div.appendChild(small);
    }
    catCampos[clave] = control;
    return div;
  }

  function catInput(valor, maxlength) {
    var el = document.createElement("input");
    el.type = "text";
    el.value = valor || "";
    if (maxlength) el.maxLength = maxlength;
    return el;
  }

  function catSelect(opciones, valor) {
    var el = document.createElement("select");
    opciones.forEach(function (o) {
      var op = document.createElement("option");
      op.value = o.valor;
      op.textContent = o.texto;
      el.appendChild(op);
    });
    el.value = valor || "";
    return el;
  }

  function renderCatForm() {
    var cont = document.getElementById("cat-form");
    cont.innerHTML = "";
    catCampos = {};
    var actual = catEditando ? catIndice()[catEditando] : null;
    if (catEditando && !actual) { catEditando = null; }

    document.getElementById("cat-form-titulo").textContent =
      T((catEditando ? "cat_editar_" : "cat_nueva_") + catPestana);
    document.getElementById("cat-borrar").hidden = !(catPestana === "perfiles" && catEditando);

    var clave = catClaveTexto();
    cont.appendChild(catCampo("texto",
      T(catPestana === "tecnicas" ? "cat_campo_etiqueta" : "campo_nombre"),
      catInput(actual ? campo(actual, clave) : "", 60)));

    if (catPestana === "tecnicas") {
      cont.appendChild(catCampo("grupo", T("cat_campo_grupo"),
        catSelect(GRUPOS_TECNICA.map(function (g) {
          return { valor: g, texto: T("grupo_" + g) };
        }), actual ? actual.grupo : "monitorizacion")));
      cont.appendChild(catCampo("descripcion", T("cat_campo_desc"),
        catInput(actual ? campo(actual, "descripcion") : "", 120), T("cat_campo_desc_ay")));
    }

    if (catPestana === "intervenciones") {
      cont.appendChild(catCampo("codigo", T("cat_campo_codigo"),
        catInput(actual ? actual.codigo : "", 30), T("cat_campo_codigo_ay")));
      var ops = [{ valor: "", texto: T("cat_sin_servicio") }].concat(
        activos(SERVICIOS).map(function (s) {
          return { valor: s.id, texto: campo(s, "nombre") };
        }));
      cont.appendChild(catCampo("servicio", T("cat_campo_servicio"),
        catSelect(ops, actual ? actual.servicio : "")));
    }

    if (catPestana === "perfiles") {
      cont.appendChild(catCampo("nota", T("cat_campo_nota"),
        catInput(actual ? campo(actual, "nota") : "", 300), T("cat_campo_nota_ay")));

      // Las técnicas del perfil se marcan con los mismos chips que en la
      // tarjeta de técnicas, para no aprender dos formas de hacer lo mismo.
      var elegidas = actual && actual.tecnicas ? actual.tecnicas.slice() : [];
      catCampos.tecnicas = elegidas;
      var bloque = document.createElement("div");
      bloque.className = "campo";
      var lab = document.createElement("label");
      lab.textContent = T("cat_campo_tecnicas");
      bloque.appendChild(lab);
      var fila = document.createElement("div");
      fila.className = "chip-fila";
      activos(TECNICAS).forEach(function (t) {
        var chip = document.createElement("span");
        chip.className = "chip chip-extra" + (elegidas.indexOf(t.id) !== -1 ? " activo" : "");
        rotularChipTecnica(chip, t);
        chip.addEventListener("click", function () {
          var i = elegidas.indexOf(t.id);
          if (i === -1) elegidas.push(t.id); else elegidas.splice(i, 1);
          chip.classList.toggle("activo", i === -1);
        });
        fila.appendChild(chip);
      });
      bloque.appendChild(fila);
      cont.appendChild(bloque);
    }

    var check = document.createElement("input");
    check.type = "checkbox";
    check.checked = !actual || actual.activa !== false;
    var lblAct = document.createElement("label");
    lblAct.className = "check";
    lblAct.appendChild(check);
    var span = document.createElement("span");
    span.textContent = T("cat_campo_activa");
    lblAct.appendChild(span);
    var envoltorio = document.createElement("div");
    envoltorio.className = "campo";
    envoltorio.appendChild(lblAct);
    catCampos.activa = check;
    cont.appendChild(envoltorio);
  }

  function renderCatVersion() {
    var c = catalogos[catPestana];
    var fecha = c.actualizado_en
      ? new Date(c.actualizado_en).toLocaleString(localeActual(), {
          day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
        })
      : T("cat_nunca");
    document.getElementById("cat-version").textContent =
      T("cat_version", { version: c.version, fecha: fecha });
  }

  function renderDlgCatalogos() {
    renderCatPestanas();
    var intros = { tecnicas: "cat_intro_tecnicas", intervenciones: "cat_intro_interv",
                   servicios: "cat_intro_serv", perfiles: "cat_intro_perfiles",
                   usuarios: "cat_intro_usuarios" };
    document.getElementById("cat-intro").innerHTML = T(intros[catPestana]);
    renderCatLista();
    renderCatVersion();
    renderCatForm();
  }

  // Tras cualquier cambio de catálogo hay que repintar la app entera: las
  // técnicas de la tarjeta, el desplegable de perfiles y el resumen.
  function trasCambiarCatalogo() {
    guardarEstado();
    renderDlgCatalogos();
    renderTodo();
  }

  function moverCat(id, paso) {
    if (!moverEnCatalogo(catPestana, id, paso)) return;
    trasCambiarCatalogo();
  }

  function alternarActivaCat(id) {
    var e = clonar(catIndice()[id]);
    e.activa = e.activa === false;
    guardarEnCatalogo(catPestana, e);
    trasCambiarCatalogo();
  }

  function guardarCat() {
    var clave = catClaveTexto();
    var texto = (catCampos.texto.value || "").trim();
    if (!texto) { catError(T("cat_falta_nombre")); return; }

    var repetido = catLista().filter(function (e) {
      return e.id !== catEditando &&
        (campo(e, clave) || "").trim().toLowerCase() === texto.toLowerCase();
    })[0];
    if (repetido) { catError(T("cat_repetido", { nombre: texto })); return; }

    var indice = catIndice();
    var dato = catEditando ? clonar(indice[catEditando]) : {};
    if (!catEditando) dato.id = idLibreEn(indice, PREFIJO_ID[catPestana], texto);
    fijarTexto(dato, clave, texto);
    dato.activa = catCampos.activa.checked;

    if (catPestana === "tecnicas") {
      dato.grupo = catCampos.grupo.value;
      fijarTexto(dato, "descripcion", (catCampos.descripcion.value || "").trim());
    } else if (catPestana === "intervenciones") {
      dato.codigo = (catCampos.codigo.value || "").trim();
      dato.servicio = catCampos.servicio.value;
    } else if (catPestana === "perfiles") {
      fijarTexto(dato, "nota", (catCampos.nota.value || "").trim());
      dato.tecnicas = catCampos.tecnicas.slice();
    }

    guardarEnCatalogo(catPestana, dato);
    catEditando = dato.id;
    catError(null);
    trasCambiarCatalogo();
  }

  function borrarCat() {
    if (catPestana !== "perfiles" || !catEditando) return;
    var p = PERF[catEditando];
    if (!p || !confirm(T("cat_borrar_perfil", { nombre: campo(p, "nombre") }))) return;
    var meta = catalogos.perfiles;
    meta.propios = meta.propios.filter(function (e) { return e.id !== catEditando; });
    if (meta.borrados.indexOf(catEditando) === -1) meta.borrados.push(catEditando);
    tocarCatalogo("perfiles");
    reconstruirCatalogos();
    catEditando = null;
    trasCambiarCatalogo();
  }

  document.getElementById("btn-catalogos").addEventListener("click", function () {
    catEditando = null;
    catError(null);
    renderDlgCatalogos();
    dlgCat.showModal();
  });
  document.getElementById("cat-cerrar").addEventListener("click", function () { dlgCat.close(); });
  document.getElementById("cat-nueva").addEventListener("click", function () {
    catEditando = null;
    catError(null);
    renderCatForm();
    renderCatLista();
  });
  document.getElementById("cat-guardar").addEventListener("click", guardarCat);
  document.getElementById("cat-borrar").addEventListener("click", borrarCat);

  /* ---------------------------------------------------------------- *
   * Render: técnicas y perfiles
   * ---------------------------------------------------------------- */
  function renderTecnicas() {
    var cont = document.getElementById("tecnicas-contenido");
    cont.innerHTML = "";
    if (!escenarioActual()) return;
    var marcadas = tecnicasDe();

    GRUPOS_TECNICA.forEach(function (grupo) {
      // Una técnica desactivada no se ofrece para casos nuevos, pero si está
      // marcada en este escenario sigue viéndose: si no, no habría manera de
      // desmarcarla y quedaría atrapada.
      var items = TECNICAS.filter(function (t) {
        return t.grupo === grupo && (t.activa !== false || marcadas.indexOf(t.id) !== -1);
      });
      if (!items.length) return;

      var bloque = document.createElement("div");
      bloque.className = "tecnicas-grupo";
      var h = document.createElement("div");
      h.className = "grupo-titulo";
      h.textContent = T("grupo_" + grupo);
      bloque.appendChild(h);

      var fila = document.createElement("div");
      fila.className = "chip-fila";
      items.forEach(function (t) {
        var chip = document.createElement("span");
        chip.className = "chip chip-extra" +
          (marcadas.indexOf(t.id) !== -1 ? " activo" : "") +
          (t.activa === false ? " desactivada" : "");
        rotularChipTecnica(chip, t);
        if (t.activa === false) {
          chip.title = T("tec_desactivada") + " · " + chip.title;
          chip.setAttribute("data-ayuda", chip.title);
        }
        chip.addEventListener("click", function () { alternarTecnica(t.id); });
        fila.appendChild(chip);
      });
      bloque.appendChild(fila);
      cont.appendChild(bloque);
    });
  }

  /* ---------------------------------------------------------------- *
   * Perfil de usuario
   *
   * Quién está usando la herramienta. Sirve para firmar los montajes: cada
   * uno lleva su autor y solo él puede editarlo o borrarlo desde la interfaz.
   *
   * NO es seguridad y no lo pretende: cualquiera puede elegir otro perfil
   * aquí mismo, y el token de GitHub es el mismo para todos, así que a nivel
   * de repositorio cualquiera puede escribir cualquier cosa. Sin backend
   * -regla 4 de CLAUDE.md- no hay forma de autenticar a nadie. Es atribución
   * y un candado blando entre compañeros, y así se explica en la interfaz.
   *
   * El perfil elegido vive en localStorage, no en estado.json: es de este
   * dispositivo, no del equipo. Si viajara en la sincronización, abrir la app
   * en el móvil de Javier te cambiaría el perfil a ti.
   * ---------------------------------------------------------------- */
  var PERFIL_KEY = "mio_ionm_perfil_v1";
  var perfilUsuario = null;

  function cargarPerfilUsuario() {
    try { perfilUsuario = localStorage.getItem(PERFIL_KEY) || null; }
    catch (e) { perfilUsuario = null; }
  }

  function fijarPerfilUsuario(id) {
    perfilUsuario = id || null;
    try {
      if (perfilUsuario) localStorage.setItem(PERFIL_KEY, perfilUsuario);
      else localStorage.removeItem(PERFIL_KEY);
    } catch (e) { /* sin persistencia */ }
  }

  // El usuario activo, o null si todavía no ha dicho quién es
  function usuarioActual() {
    return perfilUsuario && USRS[perfilUsuario] ? USRS[perfilUsuario] : null;
  }

  function nombreUsuario(id) {
    return USRS[id] ? campo(USRS[id], "nombre") : "";
  }

  function renderPerfilUsuario() {
    var sel = document.getElementById("perfil-usuario");
    sel.innerHTML = "";
    var vacio = document.createElement("option");
    vacio.value = "";
    vacio.textContent = T("perfil_usuario_sin");
    sel.appendChild(vacio);
    // Se ofrece lo activo, más el tuyo aunque lo hayan desactivado: si no,
    // desactivar a alguien le dejaría el selector en blanco sin explicación.
    USUARIOS.filter(function (u) {
      return u.activa !== false || u.id === perfilUsuario;
    }).forEach(function (u) {
      var o = document.createElement("option");
      o.value = u.id;
      o.textContent = campo(u, "nombre");
      sel.appendChild(o);
    });
    var nuevo = document.createElement("option");
    nuevo.value = "__nuevo__";
    nuevo.textContent = T("perfil_usuario_nuevo");
    sel.appendChild(nuevo);
    sel.value = usuarioActual() ? perfilUsuario : "";
  }

  document.getElementById("perfil-usuario").addEventListener("change", function (e) {
    if (e.target.value !== "__nuevo__") {
      fijarPerfilUsuario(e.target.value);
      renderPerfilUsuario();
      renderTodo();
      return;
    }
    // Crear un usuario desde aquí, sin tener que ir al diálogo de Catálogos:
    // es lo primero que hace falta al abrir la herramienta por primera vez.
    var nombre = (prompt(T("perfil_usuario_pide")) || "").trim();
    if (!nombre) { renderPerfilUsuario(); return; }
    var yaEsta = USUARIOS.filter(function (u) {
      return (campo(u, "nombre") || "").toLowerCase() === nombre.toLowerCase();
    })[0];
    var id = yaEsta ? yaEsta.id : idLibreEn(USRS, "u_", nombre);
    if (!yaEsta) guardarEnCatalogo("usuarios", { id: id, nombre: nombre, activa: true });
    fijarPerfilUsuario(id);
    guardarEstado();
    renderPerfilUsuario();
    renderTodo();
  });

  // El desplegable "Perfil" (resaltado de técnicas recomendadas según el
  // tipo de cirugía) se retiró el 05-09-2026 a petición del usuario: ya conoce
  // de memoria qué técnicas implica cada cirugía y no le aporta nada. Se
  // quita el <select> del HTML y todo lo que lo pintaba/escuchaba; el dato
  // "nota_perfil_id" que pudiera haber quedado en un montaje antiguo no se
  // toca -sigue generando su aviso en el resumen si lo tenía-, simplemente
  // ya no hay forma de elegir uno nuevo. El catálogo de perfiles en sí
  // sigue vivo (Catálogos > Perfiles): esto solo retira el resaltado.

  /* ---------------------------------------------------------------- *
   * Render: cajas físicas
   * ---------------------------------------------------------------- */
  function crearConector(clase) {
    var c = document.createElement("span");
    c.className = "conector " + clase;
    return c;
  }

  function crearSlot(cajaKey, entrada) {
    var slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.caja = cajaKey;
    slot.dataset.entrada = entrada.id;
    slot.title = T("slot_elegir_tit");
    slot.addEventListener("click", function (e) {
      if (e.target.closest(".chip-quitar") || e.target.closest(".chip-enlazar")) return;
      // Enlazando un Puente: este toque completa el enlace en vez de
      // colocar material o abrir el selector -tiene que ir primero, o un
      // "seleccionado" que hubiera quedado a medias por error se comería
      // el toque-.
      if (enlazandoPuente) { completarEnlacePuente(cajaKey, entrada.id); return; }
      if (seleccionado) { colocar(cajaKey, entrada.id, seleccionado); return; }
      // Sin nada seleccionado la entrada deja de ser solo un destino y pasa a
      // ser el punto de partida: abre el catálogo sabiendo ya dónde va lo que
      // elijas. Antes, pulsar aquí sin haber elegido antes no hacía nada.
      abrirElegir(cajaKey, entrada);
    });
    var itemId = asignacionesDe(cajaKey)[entrada.id];
    if (itemId && ITEMS[itemId]) {
      slot.appendChild(crearChip(ITEMS[itemId], {
        colocado: true,
        cajaKey: cajaKey,
        entradaId: entrada.id
      }));
    } else if (itemId) {
      slot.appendChild(document.createTextNode("? " + itemId));
    }
    return slot;
  }

  function crearFila(cajaKey, entrada) {
    var row = document.createElement("div");
    row.className = "canal-row";

    var num = document.createElement("span");
    num.className = "canal-num";
    num.textContent = entrada.etiqueta;
    row.appendChild(num);

    var cons = document.createElement("span");
    cons.className = "canal-conectores";
    if (entrada.conector === "par") {
      // Activo en negro primero y referencia en rojo después, como "1A/1R"
      // (pedido del usuario, 25-09-2026: igual en Inomed y en Cadwell).
      var activo = crearConector("negro");
      activo.title = T("conector_activo");
      var referencia = crearConector("rojo");
      referencia.title = T("conector_referencia");
      cons.appendChild(activo);
      cons.appendChild(referencia);
    } else {
      cons.appendChild(crearConector(entrada.conector));
    }
    row.appendChild(cons);

    row.appendChild(crearSlot(cajaKey, entrada));

    if (entrada.nota) {
      var nota = document.createElement("span");
      nota.className = "canal-nota";
      nota.textContent = entrada.nota;
      row.appendChild(nota);
    }
    return row;
  }

  /* Qué cajas plegables (3-6) quedan desplegadas. Mismo patrón que
     catsAbiertas/categoriaAbierta con el catálogo: sin esto, cada
     renderCajas() (p. ej. al colocar material) reconstruye el <details>
     desde cero y se pierde el "open" que había puesto el usuario a mano. */
  var CAJAS_KEY = "mio_ionm_cajas_abiertas_v1";
  var cajasAbiertas = null;

  function cargarCajasAbiertas() {
    if (cajasAbiertas) return cajasAbiertas;
    try {
      cajasAbiertas = JSON.parse(localStorage.getItem(CAJAS_KEY) || "{}") || {};
    } catch (e) { cajasAbiertas = {}; }
    return cajasAbiertas;
  }

  function cajaAbierta(key) {
    return !!cargarCajasAbiertas()[key];
  }

  function recordarCaja(key, abierta) {
    var g = cargarCajasAbiertas();
    if (abierta) g[key] = 1; else delete g[key];
    try { localStorage.setItem(CAJAS_KEY, JSON.stringify(g)); } catch (e) { /* sin persistencia */ }
  }

  /* Salidas de una caja "principal" (25-09-2026, módulo cortical de Cadwell):
     cada módulo de extremidad se enchufa a una salida numerada, y en el equipo
     real se enciende su luz verde cuando está en uso. Aquí se enciende si la
     caja enchufada ahí ("conectada_a" en su definición) tiene algo colocado en
     el montaje "esc". Devuelve { clave: [claves de caja] } de las encendidas. */
  function puertosEncendidos(cajaKey, esc) {
    var encendidos = {};
    var asign = (esc && esc.asignaciones) || {};
    Object.keys(cajasDe(esc)).forEach(function (k) {
      var con = CAJAS_TODAS[k] && CAJAS_TODAS[k].conectada_a;
      if (!con || con.caja !== cajaKey) return;
      var usada = Object.keys(asign[k] || {}).some(function (e) { return !!asign[k][e]; });
      if (usada) (encendidos[con.puerto] = encendidos[con.puerto] || []).push(k);
    });
    return encendidos;
  }

  function pintarPuertos(doc, info, cajaKey, esc, clases) {
    var fila = doc.createElement("div");
    fila.className = clases.fila;
    var base = doc.createElement("span");
    base.className = clases.triangulo + " base";
    base.title = T("puerto_base");
    fila.appendChild(base);
    var encendidos = puertosEncendidos(cajaKey, esc);
    info.puertos.forEach(function (p) {
      var t = doc.createElement("span");
      var lista = encendidos[p.clave];
      t.className = clases.triangulo + (lista ? " encendido" : "");
      var led = doc.createElement("i");
      t.appendChild(led);
      var num = doc.createElement("b");
      num.textContent = p.nombre || p.clave;
      t.appendChild(num);
      t.title = lista
        ? T("puerto_en_uso", { puerto: p.nombre || p.clave, cajas: lista.map(function (k) { return infoCaja(k).nombre; }).join(", ") })
        : T("puerto_libre", { puerto: p.nombre || p.clave });
      fila.appendChild(t);
    });
    return fila;
  }

  function renderCajaFisica(cajaKey) {
    var info = infoCaja(cajaKey);
    var entradas = entradasDe(cajaKey);
    var numeradas = entradas.filter(function (e) { return !e.especial; });
    var especiales = entradas.filter(function (e) { return e.especial; });

    // Las cajas de refuerzo (3-6: poco usadas, "disponible para cirugías
    // más amplias") se pliegan aparte y arrancan cerradas -si no, cada vez
    // que hay escenario se ven seis diagramas de cableado aunque solo se
    // usen dos-. El resto se queda siempre visible, como hasta ahora.
    var card = document.createElement(info.plegable ? "details" : "div");
    card.className = "card caja-card" + (info.plegable ? " caja-plegable" : "");
    if (info.plegable) {
      card.open = cajaAbierta(cajaKey);
      card.addEventListener("toggle", function () { recordarCaja(cajaKey, card.open); });
    }

    var cab = document.createElement(info.plegable ? "summary" : "div");
    cab.className = "caja-cab";

    var h3 = document.createElement("h3");
    h3.textContent = info.nombre;
    cab.appendChild(h3);

    // La descripción va en un icono con tooltip para no gastar altura
    if (info.descripcion) {
      var info_i = document.createElement("span");
      info_i.className = "caja-info";
      info_i.textContent = "i";
      info_i.title = info.descripcion;
      cab.appendChild(info_i);
    }

    var usadas = entradas.filter(function (e) {
      return !!asignacionesDe(cajaKey)[e.id];
    }).length;
    var contador = document.createElement("span");
    contador.className = "caja-contador" + (usadas === 0 ? " vacia" : "");
    contador.textContent = usadas + "/" + entradas.length;
    cab.appendChild(contador);

    if (info.plegable) {
      var flecha = document.createElement("span");
      flecha.className = "caja-flecha";
      cab.appendChild(flecha);
    }

    card.appendChild(cab);

    var box = document.createElement("div");
    box.className = "caja-fisica";
    if (info.conector === "anodal_catodal" || info.conector === "individual_2col" || info.grupos) {
      box.classList.add("ancha");
    }

    var tab = document.createElement("div");
    tab.className = "caja-tab";
    tab.textContent = "kΩ";
    box.appendChild(tab);

    var wrap = document.createElement("div");
    wrap.className = "canales-wrap";

    if (info.conector === "anodal_catodal") {
      var cab = document.createElement("div");
      cab.className = "canal-row cabecera";
      var sp = document.createElement("span");
      sp.className = "canal-num";
      cab.appendChild(sp);
      ["Anodal (rojo)", "Catodal (negro)"].forEach(function (t) {
        var e = document.createElement("div");
        e.className = "mitad-titulo";
        e.textContent = t;
        cab.appendChild(e);
      });
      wrap.appendChild(cab);

      for (var i = 0; i < numeradas.length; i += 2) {
        var anodal = numeradas[i];
        var catodal = numeradas[i + 1];
        var row = document.createElement("div");
        row.className = "canal-row doble";
        var n = document.createElement("span");
        n.className = "canal-num";
        n.textContent = anodal.etiqueta;
        row.appendChild(n);
        [anodal, catodal].forEach(function (ent) {
          var mitad = document.createElement("div");
          mitad.className = "canal-mitad";
          mitad.appendChild(crearConector(ent.conector));
          mitad.appendChild(crearSlot(cajaKey, ent));
          row.appendChild(mitad);
        });
        wrap.appendChild(row);
      }
    } else if (info.rejilla) {
      // "rejilla" (25-09-2026, LCSwap de Cadwell): las salidas en cuadrícula,
      // tantas columnas como diga la caja, como están en el aparato.
      wrap.classList.add("rejilla-entradas");
      wrap.style.gridTemplateColumns = "repeat(" + info.rejilla + ", minmax(0, 1fr))";
      numeradas.forEach(function (ent) {
        var celda = document.createElement("div");
        celda.className = "rejilla-celda";
        var cabC = document.createElement("div");
        cabC.className = "rejilla-cab";
        var numC = document.createElement("span");
        numC.className = "canal-num";
        numC.textContent = ent.etiqueta;
        cabC.appendChild(numC);
        cabC.appendChild(crearConector(ent.conector));
        celda.appendChild(cabC);
        celda.appendChild(crearSlot(cajaKey, ent));
        wrap.appendChild(celda);
      });
    } else if (info.grupos) {
      // Una columna por grupo, en el orden en que están en la caja física.
      wrap.classList.add("dos-columnas");
      info.grupos.forEach(function (g, gi) {
        var col = document.createElement("div");
        col.className = "columna";
        if (g.titulo) {
          var tg = document.createElement("div");
          tg.className = "mitad-titulo";
          tg.textContent = campo(g, "titulo");
          col.appendChild(tg);
        }
        numeradas.filter(function (e) { return e.grupo === gi; })
          .forEach(function (ent) { col.appendChild(crearFila(cajaKey, ent)); });
        wrap.appendChild(col);
      });
    } else if (info.conector === "individual_2col") {
      wrap.classList.add("dos-columnas");
      var mitadN = Math.ceil(numeradas.length / 2);
      [numeradas.slice(0, mitadN), numeradas.slice(mitadN)].forEach(function (grupo) {
        var col = document.createElement("div");
        col.className = "columna";
        grupo.forEach(function (ent) { col.appendChild(crearFila(cajaKey, ent)); });
        wrap.appendChild(col);
      });
    } else {
      numeradas.forEach(function (ent) { wrap.appendChild(crearFila(cajaKey, ent)); });
    }
    box.appendChild(wrap);

    // Puertos con recuadro propio (P1/P2/P3 del LCSwap): cada uno en su caja
    // gris con sus bornes − y +, como en el aparato; "alto": 2 ocupa dos filas.
    var enRecuadro = especiales.filter(function (e) { return e.recuadro; });
    especiales = especiales.filter(function (e) { return !e.recuadro; });
    if (enRecuadro.length) {
      var rej = document.createElement("div");
      rej.className = "sonda-recuadros";
      // Puertos partidos en − y + (ver "polos" en entradasDe()): un recuadro
      // por puerto con sus dos entradas, cada una con su borne.
      var porPuerto = [], vistos = {};
      enRecuadro.forEach(function (ent) {
        if (!ent.recuadroClave) return;
        if (!vistos[ent.recuadroClave]) { vistos[ent.recuadroClave] = []; porPuerto.push(vistos[ent.recuadroClave]); }
        vistos[ent.recuadroClave].push(ent);
      });
      porPuerto.forEach(function (lista) {
        var rcP = document.createElement("div");
        rcP.className = "sonda-recuadro";
        if (lista[0].alto > 1) rcP.style.gridRow = "span " + lista[0].alto;
        if (lista[0].nota) rcP.title = lista[0].nota;
        var nomP = document.createElement("div");
        nomP.className = "sonda-recuadro-cab";
        var bP = document.createElement("b");
        bP.textContent = lista[0].recuadroNombre;
        nomP.appendChild(bP);
        rcP.appendChild(nomP);
        lista.forEach(function (ent) {
          var filaP = document.createElement("div");
          filaP.className = "sonda-polo-fila";
          var pl = document.createElement("span");
          pl.className = "sonda-polo";
          pl.textContent = ent.polo;
          pl.title = T(ent.polo === "+" ? "polo_mas" : "polo_menos");
          filaP.appendChild(pl);
          var cnP = crearConector(ent.conector);
          cnP.title = pl.title;
          filaP.appendChild(cnP);
          filaP.appendChild(crearSlot(cajaKey, ent));
          rcP.appendChild(filaP);
        });
        rej.appendChild(rcP);
      });
      enRecuadro.filter(function (e) { return !e.recuadroClave; }).forEach(function (ent) {
        var rc = document.createElement("div");
        rc.className = "sonda-recuadro";
        if (ent.alto > 1) rc.style.gridRow = "span " + ent.alto;
        var cabR = document.createElement("div");
        cabR.className = "sonda-recuadro-cab";
        var menos = document.createElement("span");
        menos.className = "sonda-polo";
        menos.textContent = "−";
        cabR.appendChild(menos);
        var cn = crearConector("negro");
        cn.title = "−";
        cabR.appendChild(cn);
        var nomR = document.createElement("b");
        nomR.textContent = ent.etiqueta;
        cabR.appendChild(nomR);
        var cp = crearConector("rojo");
        cp.title = "+";
        cabR.appendChild(cp);
        var mas = document.createElement("span");
        mas.className = "sonda-polo";
        mas.textContent = "+";
        cabR.appendChild(mas);
        rc.appendChild(cabR);
        if (ent.nota) rc.title = ent.nota;
        rc.appendChild(crearSlot(cajaKey, ent));
        rej.appendChild(rc);
      });
      box.appendChild(rej);
    }
    if (especiales.length) {
      var esp = document.createElement("div");
      esp.className = "canales-especiales";
      especiales.forEach(function (ent) { esp.appendChild(crearFila(cajaKey, ent)); });
      box.appendChild(esp);
    }

    if (info.puertos) {
      box.appendChild(pintarPuertos(document, info, cajaKey, escenarioActual(),
        { fila: "caja-puertos", triangulo: "puerto" }));
    }

    var plate = document.createElement("div");
    plate.className = "caja-plate";
    plate.textContent = info.nombre;
    box.appendChild(plate);

    card.appendChild(box);
    return card;
  }

  function renderCajas() {
    var cont = document.getElementById("cajas-contenido");
    cont.innerHTML = "";
    var pista = document.getElementById("cajas-pista");
    if (!escenarioActual()) { pista.textContent = ""; return; }

    var grid = document.createElement("div");
    grid.className = "cajas-grid";
    var cajasEq = cajasDe(escenarioActual());
    var usadas = 0;
    Object.keys(cajasEq).forEach(function (key) {
      grid.appendChild(renderCajaFisica(key));
      var asign = asignacionesDe(key);
      if (entradasDe(key).some(function (e) { return !!asign[e.id]; })) usadas++;
    });
    cont.appendChild(grid);
    pista.textContent = T("cajas_cuenta", { n: usadas, total: Object.keys(cajasEq).length });
  }

  /* ---------------------------------------------------------------- *
   * Render: resumen de material  (el objetivo de la herramienta)
   * ---------------------------------------------------------------- */
  /* Calcula el resumen y lo devuelve como dato, sin tocar el DOM.
   *
   * Lo usan dos sitios: renderResumen() para pintarlo y el registro de casos
   * para guardarlo. Así lo que queda archivado en un caso es exactamente lo
   * mismo que ves en pantalla, porque sale del mismo cálculo y no de una
   * copia paralela que acabaría separándose.
   *
   * Lee el escenario que se le pasa sin modificarlo: al contrario que
   * asignacionesDe(), no crea entradas vacías por el camino.
   */
  /* Cuánto cuesta el material fungible de este montaje.
     Solo suma lo que se gasta y se tira: las sondas, las gafas o los
     auriculares se preparan igual, pero son reutilizables y meterlos en el
     coste de una cirugía concreta lo falsearía.
     La cantidad es la misma que sale en "Material a preparar", redondeada
     hacia arriba: media unidad suelta (un Erb1 sin su Erb2) obliga a abrir el
     paquete entero, y lo que se factura es el paquete.
     Los tipos sin precio se cuentan aparte en vez de contarse como 0, para
     que un total incompleto no se lea como un total. */
  function enEuros(n) {
    return n.toLocaleString(localeActual(), { style: "currency", currency: "EUR" });
  }

  /* El apartado económico del resumen: unitario x cantidad, importe por línea
     y total de la intervención. Si falta algún precio se dice cuál falta, en
     vez de dar un total que parece completo y no lo es. */
  function bloqueCoste(coste) {
    var sec = document.createElement("div");
    sec.className = "resumen-bloque";
    var h = document.createElement("h3");
    h.textContent = T("resumen_coste");
    sec.appendChild(h);

    if (!coste || !coste.hayPrecios) {
      var p = document.createElement("p");
      p.className = "empty-hint";
      p.textContent = T("coste_sin_datos");
      sec.appendChild(p);
      return sec;
    }

    var tabla = document.createElement("table");
    tabla.className = "tabla-resumen tabla-coste";
    var thead = document.createElement("thead");
    var trh = document.createElement("tr");
    [T("coste_tipo"), T("coste_cantidad"), T("coste_unitario"), T("coste_importe")]
      .forEach(function (txt, i) {
        var th = document.createElement("th");
        th.textContent = txt;
        if (i) th.className = "num";
        trh.appendChild(th);
      });
    thead.appendChild(trh);
    tabla.appendChild(thead);

    var tbody = document.createElement("tbody");
    coste.lineas.forEach(function (l) {
      var tr = document.createElement("tr");
      [l.tipo, String(l.cantidad), enEuros(l.precio), enEuros(l.importe)]
        .forEach(function (txt, i) {
          var td = document.createElement("td");
          td.textContent = txt;
          if (i) td.className = "num";
          tr.appendChild(td);
        });
      tbody.appendChild(tr);
    });
    tabla.appendChild(tbody);

    var tfoot = document.createElement("tfoot");
    var trt = document.createElement("tr");
    var tdT = document.createElement("td");
    tdT.textContent = T("coste_total");
    var tdVacio1 = document.createElement("td");
    var tdVacio2 = document.createElement("td");
    var tdTotal = document.createElement("td");
    tdTotal.className = "num";
    tdTotal.textContent = enEuros(coste.total);
    [tdT, tdVacio1, tdVacio2, tdTotal].forEach(function (td) { trt.appendChild(td); });
    tfoot.appendChild(trt);
    tabla.appendChild(tfoot);
    sec.appendChild(tabla);

    var nota = document.createElement("p");
    nota.className = "coste-nota";
    nota.textContent = T("coste_reutilizable_nota");
    sec.appendChild(nota);

    if (coste.sinPrecio.length) {
      var falta = document.createElement("p");
      falta.className = "coste-falta";
      falta.textContent = T("coste_sin_precio", { tipos: coste.sinPrecio.join(", ") });
      sec.appendChild(falta);
    }
    return sec;
  }

  function calcularCoste(res) {
    var coste = { lineas: [], total: 0, sinPrecio: [], hayPrecios: false };
    Object.keys(res.material).forEach(function (tipo) {
      var et = ETQ[res.tipoEtiqueta[tipo]];
      if (et && et.fungible === false) return;   // reutilizable: no se gasta
      // manta: se compra y se cobra entera, colocar 1 electrodo o los 8 de la
      // manta es el mismo gasto (ver "manta" en el gestor de etiquetas).
      var cantidad = (et && et.manta) ? 1 : Math.ceil(res.material[tipo]);
      var precio = et && typeof et.precio === "number" && et.precio >= 0 ? et.precio : null;
      if (precio === null) { coste.sinPrecio.push(tipo); return; }
      coste.hayPrecios = true;
      coste.total += precio * cantidad;
      coste.lineas.push({ tipo: tipo, cantidad: cantidad, precio: precio, importe: precio * cantidad });
    });
    coste.lineas.sort(function (a, b) { return b.importe - a.importe; });
    return coste;
  }

  function calcularResumen(esc) {
    // tipoEtiqueta: nombre visible del tipo -> id de su etiqueta. El recuento
    // se agrupa por el nombre traducido, pero el precio y si es fungible viven
    // en la etiqueta, así que hace falta el puente entre los dos.
    var res = { tecnicas: [], material: {}, estilos: {}, tipoEtiqueta: {}, cajas: [],
                extras: [], entradas: 0, avisos: [], coste: null, conmutadorTipo: null };
    if (!esc) return res;

    res.tecnicas = (esc.tecnicas || []).slice();

    Object.keys(cajasDe(esc)).forEach(function (cajaKey) {
      var entradas = entradasDe(cajaKey);
      var asign = (esc.asignaciones || {})[cajaKey] || {};
      var detalle = [];
      entradas.forEach(function (ent) {
        var itemId = asign[ent.id];
        if (!itemId) return;
        var item = ITEMS[itemId];
        if (!item) return;
        var rotuloEntrada = ent.polo ? ent.etiqueta + " " + ent.polo : ent.etiqueta;
        var nombre = campo(item, "nombre");
        var override = (esc.etiquetas || {})[cajaKey + "/" + ent.id] || null;
        var tipo = nombreEtiquetaDe(item, override);
        var estilo = estiloDe(item, override);
        if (!res.estilos[tipo]) res.estilos[tipo] = estilo;
        var etDe = etiquetaDe(item, override);
        if (etDe && !res.tipoEtiqueta[tipo]) res.tipoEtiqueta[tipo] = etDe.id;
        detalle.push({
          entrada: rotuloEntrada, nombre: nombre, color: item.color,
          tipo: tipo, estilo: estilo, item: item.id
        });
        // media_unidad: dos entradas que salen del mismo paquete (Erb1 + Erb2).
        // tercio_unidad: tres entradas del mismo kit (Px.1DW/Px.2DW/Px.3DW del
        // epidural D-Wave, activo + referencia entre dos cualquiera de los
        // tres) -1, 2 o 3 colocadas siempre redondean a 1 kit, igual que
        // media_unidad redondea cualquier combinación de dos a 1 paquete-.
        // doble (etiqueta, no item): esta posición necesita 2 unidades del
        // material por colocación -activo y referencia-, como hook_wire;
        // media_unidad/tercio_unidad mandan si coinciden con doble.
        var unidadesPorColocacion = item.media_unidad ? 0.5 :
          (item.tercio_unidad ? (1 / 3) : ((etDe && etDe.doble) ? 2 : 1));
        res.material[tipo] = (res.material[tipo] || 0) + unidadesPorColocacion;
        res.entradas++;
        // El conmutador reparte hacia 6 electrodos de sacacorchos (C3/C4 lo
        // habitual, a veces C5/C6) que no ocupan entrada propia en la caja
        // -son el mismo canal 6, repartido por dentro del switch-, así que
        // sin esto no salían nunca en el material a preparar. Se suman fijos
        // a 6 y no a los ids concretos porque cuáles sean cambia según el
        // caso; lo único constante es la cantidad.
        if (item.id === "conmutador") {
          // El resumen marca en qué fila va el conmutador para poder anotar,
          // en pequeño, las 6 posiciones en las que reparte sus sacacorchos
          // (dato pedido: verlas de un vistazo sin abrir la caja).
          res.conmutadorTipo = tipo;
          var itemSacacorchos = { etiqueta: "electrodo_sacacorchos" };
          var tipoSacacorchos = nombreEtiquetaDe(itemSacacorchos, null);
          if (!res.estilos[tipoSacacorchos]) res.estilos[tipoSacacorchos] = estiloDe(itemSacacorchos, null);
          var etSacacorchos = etiquetaDe(itemSacacorchos, null);
          if (etSacacorchos && !res.tipoEtiqueta[tipoSacacorchos]) res.tipoEtiqueta[tipoSacacorchos] = etSacacorchos.id;
          res.material[tipoSacacorchos] = (res.material[tipoSacacorchos] || 0) + 6;
        }
      });
      if (detalle.length) {
        res.cajas.push({
          key: cajaKey,
          nombre: infoCaja(cajaKey).nombre,
          usadas: detalle.length,
          total: entradas.length,
          detalle: detalle
        });
      }
    });

    res.extras = (esc.extras || []).map(function (id) { return ITEMS[id]; }).filter(Boolean);
    res.extras.forEach(function (item) {
      var tipo = nombreEtiquetaDe(item, null);
      if (!res.estilos[tipo]) res.estilos[tipo] = estiloDe(item, null);
      var etEx = etiquetaDe(item, null);
      if (etEx && !res.tipoEtiqueta[tipo]) res.tipoEtiqueta[tipo] = etEx.id;
      res.material[tipo] = (res.material[tipo] || 0) + 1;
    });

    res.coste = calcularCoste(res);

    // El perfil se guarda por id para poder traducir su nota; nota_perfil es
    // el texto suelto que guardaban los escenarios anteriores.
    if (esc.nota_perfil_id) {
      var perfilNota = PERF[esc.nota_perfil_id];
      if (perfilNota && campo(perfilNota, "nota")) {
        res.avisos.push(campo(perfilNota, "nombre") + ": " + campo(perfilNota, "nota"));
      }
    } else if (esc.nota_perfil) {
      res.avisos.push(esc.nota_perfil);
    }
    if (campo(esc, "notas")) res.avisos.push(campo(esc, "notas"));
    if (campo(esc, "pendiente")) res.avisos.push(T("aviso_pendiente", { texto: campo(esc, "pendiente") }));

    return res;
  }

  // Media unidad suelta se redondea hacia arriba: hay que abrir el paquete
  // igual. Es lo que se ve en pantalla y lo que se guarda en el caso.
  function materialRedondeado(material) {
    var out = {};
    Object.keys(material).sort().forEach(function (tipo) {
      out[tipo] = Math.ceil(material[tipo]);
    });
    return out;
  }

  /* ---------------------------------------------------------------- *
   * Revisión del montaje (demo-congreso B3.F1): avisos orientativos del
   * Resumen, en una lista propia. NO van a res.avisos -que se guarda en
   * caso.avisos_preparacion y viaja a la Sheet-: no se guardan en ningún
   * sitio y no bloquean nada. Reglas y grupos en DATA.material_tecnicas
   * (data/surgeries.js):
   *   R1 · caja de registro con entradas ocupadas y el GND vacío;
   *   R2 · técnica marcada sin el material que necesita;
   *   R3 · material colocado que ninguna técnica marcada usa.
   * ---------------------------------------------------------------- */
  var MAT_TEC = DATA.material_tecnicas || { grupos: {}, reglas: [] };
  var matTecItems = null;   // grupo -> {itemId: true}, se arma la primera vez

  function matTecGrupos() {
    if (matTecItems) return matTecItems;
    matTecItems = {};
    Object.keys(MAT_TEC.grupos || {}).forEach(function (g) {
      var def = MAT_TEC.grupos[g];
      var set = {};
      (def.items || []).forEach(function (id) { set[id] = true; });
      var cats = def.categorias || [];
      if (cats.length) {
        CATALOGO.forEach(function (grupoCat) {
          if (cats.indexOf(grupoCat.categoria) === -1) return;
          grupoCat.items.forEach(function (it) { set[it.id] = true; });
        });
      }
      matTecItems[g] = set;
    });
    return matTecItems;
  }

  function nombreGrupoMat(g) {
    var def = (MAT_TEC.grupos || {})[g];
    return def ? campo(def, "nombre") : g;
  }

  function revisarMontaje(esc) {
    var out = [];
    if (!esc) return out;
    matTecItems = null;   // el catálogo puede haber cambiado desde la web
    var grupos = matTecGrupos();
    // Material colocado (entradas y extras)
    var colocados = {};
    Object.keys(cajasDe(esc)).forEach(function (cajaKey) {
      var asign = (esc.asignaciones || {})[cajaKey] || {};
      var ocupadas = 0, tieneGnd = false, gndVacio = false;
      entradasDe(cajaKey).forEach(function (ent) {
        var itemId = asign[ent.id];
        if (ent.id === "gnd") { tieneGnd = true; gndVacio = !itemId; return; }
        if (!itemId || !ITEMS[itemId]) return;
        ocupadas++;
        colocados[itemId] = true;
      });
      // R1
      if (tieneGnd && gndVacio && ocupadas > 0) {
        out.push(T("rev_gnd", { caja: infoCaja(cajaKey).nombre, n: ocupadas }));
      }
    });
    (esc.extras || []).forEach(function (id) { if (ITEMS[id]) colocados[id] = true; });
    var hay = function (g) {
      var set = grupos[g] || {};
      return Object.keys(colocados).some(function (id) { return !!set[id]; });
    };
    var marcadas = (esc.tecnicas || []).filter(function (id) { return !!TECS[id]; });
    var usados = {};
    (MAT_TEC.reglas || []).forEach(function (r) {
      if (marcadas.indexOf(r.tecnica) === -1) return;
      var todos = [].concat(r.si_hay ? [r.si_hay] : [], r.usa || []);
      (r.necesita || []).forEach(function (n) { todos = todos.concat(n); });
      todos.forEach(function (g) { usados[g] = true; });
      // R2
      if (r.si_hay && !hay(r.si_hay)) return;
      (r.necesita || []).forEach(function (n) {
        var alternativas = [].concat(n);
        if (alternativas.some(hay)) return;
        var falta = alternativas.map(nombreGrupoMat).join(T("rev_o"));
        var tec = campo(TECS[r.tecnica], "etiqueta");
        out.push(r.si_hay
          ? T("rev_falta_si", { tecnica: tec, cond: nombreGrupoMat(r.si_hay), falta: falta })
          : T("rev_falta", { tecnica: tec, falta: falta }));
      });
    });
    // R3: se agrupa por las técnicas que lo usarían, para no dar un aviso
    // por cada músculo.
    var sobrantes = {};
    Object.keys(colocados).forEach(function (id) {
      var suyos = Object.keys(grupos).filter(function (g) { return grupos[g][id]; });
      if (!suyos.length || suyos.some(function (g) { return usados[g]; })) return;
      var tecs = [];
      (MAT_TEC.reglas || []).forEach(function (r) {
        var todos = [].concat(r.si_hay ? [r.si_hay] : [], r.usa || []);
        (r.necesita || []).forEach(function (n) { todos = todos.concat(n); });
        var t = TECS[r.tecnica];
        if (!t || t.activa === false) return;
        if (todos.some(function (g) { return suyos.indexOf(g) !== -1; })) {
          var et = campo(t, "etiqueta");
          if (tecs.indexOf(et) === -1) tecs.push(et);
        }
      });
      var clave = tecs.join(", ");
      (sobrantes[clave] = sobrantes[clave] || []).push(campo(ITEMS[id], "nombre"));
    });
    Object.keys(sobrantes).forEach(function (clave) {
      var nombres = sobrantes[clave];
      var lista = nombres.slice(0, 3).join(", ") + (nombres.length > 3 ? T("rev_y_mas", { n: nombres.length - 3 }) : "");
      var plural = nombres.length > 1 ? "_n" : "";
      out.push(clave ? T("rev_sobra" + plural, { items: lista, tecnicas: clave }) : T("rev_sobra_sin" + plural, { items: lista }));
    });
    return out;
  }

  function renderResumen() {
    var cont = document.getElementById("resumen-contenido");
    cont.innerHTML = "";
    var esc = escenarioActual();
    if (!esc) {
      cont.innerHTML = '<p class="empty-hint"></p>';
      cont.firstChild.textContent = T("resumen_sin_esc");
      return;
    }
    var resumen = calcularResumen(esc);

    var titulo = document.createElement("div");
    titulo.className = "resumen-titulo";
    titulo.innerHTML = "<strong></strong>";
    titulo.firstChild.textContent = campo(esc, "nombre");
    cont.appendChild(titulo);

    // Técnicas marcadas (o modalidades sueltas de escenarios antiguos)
    var etiquetasTec = tecnicasDe().map(function (id) {
      return TECS[id] ? campo(TECS[id], "etiqueta") : id;
    }).concat(esc.modalidades || []);
    if (etiquetasTec.length) {
      var mods = document.createElement("div");
      mods.className = "modalidades";
      etiquetasTec.forEach(function (m) {
        var c = document.createElement("span");
        c.className = "modalidad-chip";
        c.textContent = m;
        mods.appendChild(c);
      });
      cont.appendChild(mods);
    }

    var totalMaterial = resumen.material;
    var estiloPorTipo = resumen.estilos;
    var cajasUsadas = resumen.cajas;
    var extras = resumen.extras;

    if (!resumen.entradas && !extras.length) {
      var vacio = document.createElement("p");
      vacio.className = "empty-hint";
      vacio.textContent = T("resumen_vacio");
      cont.appendChild(vacio);
      return;
    }

    // Dos columnas: recuento a la izquierda, desglose por caja a la derecha
    var cols = document.createElement("div");
    cols.className = "resumen-cols";
    var colIzq = document.createElement("div");
    var colDer = document.createElement("div");
    cols.appendChild(colIzq);
    cols.appendChild(colDer);
    cont.appendChild(cols);

    // Bloque: material total
    var secMat = document.createElement("div");
    secMat.className = "resumen-bloque";
    secMat.innerHTML = "<h3></h3>";
    secMat.firstChild.textContent = T("resumen_material");
    var tablaMat = document.createElement("table");
    tablaMat.className = "tabla-resumen";
    var tbodyMat = document.createElement("tbody");
    Object.keys(totalMaterial).sort().forEach(function (mat) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td");
      // Distintivo con el mismo borde/color que llevan los chips de ese tipo
      if (estiloPorTipo[mat]) {
        var muestra = document.createElement("span");
        muestra.className = "muestra-etiqueta";
        aplicarEstilo(muestra, estiloPorTipo[mat]);
        td1.appendChild(muestra);
      }
      td1.appendChild(document.createTextNode(mat));
      // El conmutador reparte 6 sacacorchos hacia posiciones fijas: se anotan
      // en pequeño junto a su fila para tener el dato a la vista.
      if (mat === resumen.conmutadorTipo) {
        var notaConm = document.createElement("small");
        notaConm.className = "resumen-nota-conmutador";
        notaConm.textContent = " (" + T("resumen_conmutador_nota") + ")";
        td1.appendChild(notaConm);
      }
      var td2 = document.createElement("td");
      td2.className = "num";
      // Media unidad suelta: se redondea hacia arriba (hay que abrir el paquete igual)
      var cantidad = totalMaterial[mat];
      td2.textContent = Number.isInteger(cantidad) ? cantidad : Math.ceil(cantidad);
      if (!Number.isInteger(cantidad)) {
        td2.title = T("resumen_redondeo", { cantidad: cantidad });
      }
      tr.appendChild(td1);
      tr.appendChild(td2);
      tbodyMat.appendChild(tr);
    });
    tablaMat.appendChild(tbodyMat);
    secMat.appendChild(tablaMat);
    colIzq.appendChild(secMat);

    // Bloque: coste del material fungible
    colIzq.appendChild(bloqueCoste(resumen.coste));

    // Bloque: cajas necesarias
    var secCajas = document.createElement("div");
    secCajas.className = "resumen-bloque";
    secCajas.innerHTML = "<h3></h3>";
    secCajas.firstChild.textContent = T("resumen_cajas", { n: cajasUsadas.length });
    cajasUsadas.forEach(function (c) {
      var bloque = document.createElement("div");
      bloque.className = "resumen-caja";

      var cab = document.createElement("div");
      cab.className = "resumen-caja-cab";
      var nom = document.createElement("span");
      nom.className = "resumen-caja-nombre";
      nom.textContent = c.nombre;
      var cnt = document.createElement("span");
      cnt.className = "resumen-caja-cnt" + (c.usadas === c.total ? " llena" : "");
      cnt.textContent = T("resumen_entradas", { usadas: c.usadas, total: c.total });
      cab.appendChild(nom);
      cab.appendChild(cnt);
      bloque.appendChild(cab);

      var lista = document.createElement("div");
      lista.className = "resumen-entradas";
      c.detalle.forEach(function (d) {
        var el = document.createElement("span");
        el.className = "resumen-entrada";
        if (d.estilo) aplicarEstilo(el, d.estilo);
        el.title = T("chip_tipo", { tipo: d.tipo });
        el.innerHTML = '<span class="re-num">' + d.entrada + "</span> ";
        if (d.color) {
          var dot = document.createElement("span");
          dot.className = "color-dot color-" + d.color;
          el.appendChild(dot);
        }
        el.appendChild(document.createTextNode(d.nombre));
        lista.appendChild(el);
      });
      bloque.appendChild(lista);
      secCajas.appendChild(bloque);
    });
    colDer.appendChild(secCajas);

    // Bloque: material extra (no ocupa entrada)
    if (extras.length) {
      var secEx = document.createElement("div");
      secEx.className = "resumen-bloque";
      secEx.innerHTML = "<h3></h3>";
      secEx.firstChild.textContent = T("resumen_extra");
      var listaEx = document.createElement("div");
      listaEx.className = "resumen-entradas";
      extras.forEach(function (item) {
        var el = document.createElement("span");
        el.className = "resumen-entrada";
        el.textContent = campo(item, "nombre");
        if (campo(item, "nota")) el.title = campo(item, "nota");
        listaEx.appendChild(el);
      });
      secEx.appendChild(listaEx);
      colIzq.appendChild(secEx);
    }

    // Revisión del montaje (B3.F1): lista aparte, ver revisarMontaje().
    var revision = revisarMontaje(esc);
    if (revision.length) {
      var secRev = document.createElement("div");
      secRev.className = "resumen-bloque resumen-revision";
      secRev.innerHTML = "<h3></h3><p class=\"resumen-revision-ay\"></p>";
      secRev.firstChild.textContent = T("resumen_revision");
      secRev.childNodes[1].textContent = T("resumen_revision_ay");
      var ulRev = document.createElement("ul");
      ulRev.className = "avisos";
      revision.forEach(function (a) {
        var li = document.createElement("li");
        li.textContent = a;
        ulRev.appendChild(li);
      });
      secRev.appendChild(ulRev);
      colIzq.appendChild(secRev);
    }

    var avisos = resumen.avisos;
    if (avisos.length) {
      var secAv = document.createElement("div");
      secAv.className = "resumen-bloque";
      secAv.innerHTML = "<h3></h3>";
      secAv.firstChild.textContent = T("resumen_avisos");
      var ul = document.createElement("ul");
      ul.className = "avisos";
      avisos.forEach(function (a) {
        var li = document.createElement("li");
        li.textContent = a;
        ul.appendChild(li);
      });
      secAv.appendChild(ul);
      cont.appendChild(secAv);
    }
  }

  /* ---------------------------------------------------------------- *
   * Rótulo permanente y biblioteca de montajes (Fase 4)
   * ---------------------------------------------------------------- */
  function renderSelect() {
    renderBarraCaso();
  }

  /* Un montaje nuevo se identifica por UUID, no por un id derivado del
     nombre. Es lo que permite que dos personas creen a la vez un montaje
     llamado igual sin acabar escribiendo en el mismo archivo del
     repositorio: el nombre es una etiqueta, el uid es la identidad. */
  function montajeNuevo(nombre, equipo) {
    var yo = usuarioActual();
    return {
      montaje_uid: uuid(),
      nombre: nombre,
      equipo_id: equipo || equipoNuevo(),
      autor_id: yo ? yo.id : "",
      modalidades: [],
      tecnicas: [],
      asignaciones: {},
      extras: [],
      etiquetas: {},
      conmutador: {},
      creado_en: new Date().toISOString(),
      editado_en: []
    };
  }

  /* Quién puede editar o borrar un montaje. Sin autor -los de fábrica- lo
     puede tocar cualquiera. Con autor, solo él. NO es seguridad: cambiando de
     perfil arriba se pasa el candado. Es para no pisarse entre compañeros sin
     querer, no para impedir nada. */
  function puedoEditar(m) {
    if (!m) return false;
    if (!m.autor_id) return true;
    var yo = usuarioActual();
    return !!yo && yo.id === m.autor_id;
  }

  // Cuándo se tocó por última vez una plantilla o, si nunca se editó, cuándo
  // se creó. Vacío si no trae ninguna de las dos (las muy antiguas).
  function fechaMontaje(m) {
    var ed = m && m.editado_en && m.editado_en.length ? m.editado_en[m.editado_en.length - 1] : null;
    var iso = ed || (m && m.creado_en);
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return T(ed ? "montaje_modificado" : "montaje_creado", { fecha: d.toLocaleDateString(localeActual()) });
  }

  function autorDe(m) {
    if (!m) return "";
    return m.autor_id ? nombreUsuario(m.autor_id) || T("montaje_autor_ido") : T("montaje_sin_autor");
  }

  // Orden alfabético por nombre, sin importar de quién sea -antes salían
  // primero los propios; pedido del usuario para que el listado (aquí y en
  // "Elegir montaje" al cargarlo sobre un caso) sea siempre el mismo orden,
  // también con los que se vayan creando.
  function compararMontajesPorNombre(a, b) {
    return (campo(montajes[a], "nombre") || "").localeCompare(campo(montajes[b], "nombre") || "");
  }

  function renderTodo() {
    renderSelect();
    // La lista de usuarios puede haber cambiado al bajar de GitHub: si Javier
    // se dio de alta en su móvil, aquí tiene que aparecer sin recargar.
    renderPerfilUsuario();
    renderTecnicas();
    renderResumen();
    renderCatalogo();
    renderCajas();
    // Fase 6: Montajes ya no es un diálogo que se pinta solo al abrirse -es
    // la tarjeta de arriba del todo, abierta de fábrica-, así que necesita
    // su propio refresco aquí, igual que el resto. Sigue siendo condicional
    // a que esté desplegada (el usuario puede plegarla): sincronizarDlgMontajesSiAbierto().
    sincronizarDlgMontajesSiAbierto();
  }


  // Avisa y corta si el montaje activo no es tuyo. El aviso explica de quién
  // es, en vez de dejar un botón que no responde y no dice por qué.
  function exigeSerAutor(m) {
    if (puedoEditar(m)) return true;
    alert(T("montaje_no_es_tuyo", { autor: autorDe(m) }));
    return false;
  }

  // Si el diálogo Montajes está abierto, cualquier acción de aquí abajo
  // tiene que refrescar también su lista -si no, se queda mostrando un
  // nombre viejo, o un montaje ya borrado, hasta que se cierre y se
  // reabra. Mismo patrón que "if (dlgCasos && dlgCasos.open) renderListaCasos()".
  function sincronizarDlgMontajesSiAbierto() {
    if (dlgMontajes && dlgMontajes.open) renderListaMontajesDialog();
  }

  // Clona un montaje a tu nombre, con un uid propio, y lo deja activo. Lo
  // usan "Duplicar" (parte de cualquier montaje, incluido el de otro autor)
  // y "Guardar montaje" → "Guardar como nuevo" (parte siempre del activo).
  // Devuelve false si el usuario cancela el prompt, sin tocar nada.
  function duplicarMontajeComo(esc) {
    var nombre = prompt(T("esc_duplicar_prompt"), campo(esc, "nombre") + T("esc_copia_sufijo"));
    if (!nombre) return false;
    var yo = usuarioActual();
    var m = clonar(esc);
    m.montaje_uid = uuid();
    m.nombre = nombre;
    delete m.nombre_en;          // el nombre nuevo lo has escrito tú
    delete m.de_fabrica;
    m.autor_id = yo ? yo.id : "";
    m.creado_en = new Date().toISOString();
    m.editado_en = [];
    activo = m.montaje_uid;
    guardarMontaje(m, true);
    return true;
  }

  // Duplicar sí funciona sobre el montaje de otro: es la forma de partir del
  // suyo para hacerte el tuyo. La copia nace a tu nombre, no al suyo.
  // Menú "Más acciones" de Plantillas de montajes (28-09-2026): se cierra al
  // elegir una acción o al pulsar fuera.
  function cerrarMenuMontajes() {
    document.getElementById("montajes-mas-lista").hidden = true;
    document.getElementById("montajes-mas-btn").setAttribute("aria-expanded", "false");
  }
  document.getElementById("montajes-mas-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    var lista = document.getElementById("montajes-mas-lista");
    lista.hidden = !lista.hidden;
    this.setAttribute("aria-expanded", lista.hidden ? "false" : "true");
  });
  document.getElementById("montajes-mas-lista").addEventListener("click", cerrarMenuMontajes);
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#montajes-mas")) cerrarMenuMontajes();
  });
  document.getElementById("btn-duplicar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc) return;
    if (!duplicarMontajeComo(esc)) return;
    renderTodo();
  });

  document.getElementById("btn-renombrar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc || !exigeSerAutor(esc)) return;
    var nombre = prompt(T("esc_renombrar"), campo(esc, "nombre"));
    if (!nombre) return;
    esc.nombre = nombre;
    delete esc.nombre_en;
    guardarMontaje(esc);
    renderTodo();
  });

  document.getElementById("btn-vaciar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc || !exigeSerAutor(esc)) return;
    if (!confirm(T("esc_vaciar_conf", { nombre: campo(esc, "nombre") }))) return;
    esc.asignaciones = {};
    esc.conmutador = {};
    esc.etiquetas = {};
    esc.extras = [];
    guardarMontaje(esc);
    renderTodo();
  });

  document.getElementById("btn-borrar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc || !exigeSerAutor(esc)) return;
    if (!confirm(T("esc_borrar_conf", { nombre: campo(esc, "nombre") }))) return;
    var uid = activo;
    delete montajes[uid];
    delete montajesSinSubir[uid];
    // Solo hay que borrarlo en GitHub si llegó a existir allí
    if (montajesSha[uid]) montajesBorrados[uid] = montajesSha[uid];
    delete montajesSha[uid];
    activo = Object.keys(montajes)[0] || null;
    guardarMontajes();
    programarEnvio();
    renderTodo();
  });

  // "Guardar montaje": a diferencia de Duplicar/Renombrar/Vaciar/Borrar, el
  // material ya se autoguarda en cada colocación (colocar() → guardarMontajeActivo());
  // esto no es la única forma de no perder el trabajo, es una confirmación
  // explícita para quien la quiera, con la misma disyuntiva que ya existe al
  // cargar una plantilla sobre un caso: sobrescribir el montaje activo, o
  // dejarlo intacto y guardar aparte como uno nuevo.
  var dlgGuardarMontaje = document.getElementById("dlg-guardar-montaje");
  document.getElementById("btn-guardar-montaje").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc) return;
    document.getElementById("guardar-montaje-nombre").textContent =
      T("guardar_montaje_intro", { nombre: campo(esc, "nombre") });
    // Sobrescribir solo tiene sentido si el montaje activo es tuyo -si es de
    // otro autor, exigeSerAutor() lo bloquearía igualmente al pulsar-.
    document.getElementById("guardar-montaje-sobrescribir").hidden = !puedoEditar(esc);
    dlgGuardarMontaje.showModal();
  });
  document.getElementById("guardar-montaje-cancelar").addEventListener("click", function () {
    dlgGuardarMontaje.close();
  });
  document.getElementById("guardar-montaje-sobrescribir").addEventListener("click", function () {
    var esc = escenarioActual();
    dlgGuardarMontaje.close();
    if (!esc || !exigeSerAutor(esc)) return;
    guardarMontaje(esc);
    avisoGuardado(T("montaje_guardado"));
    sincronizarDlgMontajesSiAbierto();
  });
  document.getElementById("guardar-montaje-nuevo").addEventListener("click", function () {
    var esc = escenarioActual();
    dlgGuardarMontaje.close();
    if (!esc || !duplicarMontajeComo(esc)) return;
    renderTodo();
  });

  /* ---------------------------------------------------------------- *
   * Fase 4.1: diálogo "Montajes" -la biblioteca-. Mismo patrón que
   * dlgCasos: lista con filtro, acciones fijas arriba, cierra sola al
   * elegir. Lista plana -sin escenario que agrupe-, filtro por nombre y
   * autor, entradas ocupadas visibles en cada fila.
   * ---------------------------------------------------------------- */
  // Fase 6: ya no es un <dialog>, es la tarjeta de siempre -mismo
  // "dlgMontajes" de nombre porque su papel no cambia (algo que se abre y se
  // pliega solo al elegir), solo cambia cómo: era showModal()/close(), ahora
  // es el .open de cualquier <details>.
  var dlgMontajes = document.getElementById("montajes");

  function renderListaMontajesDialog() {
    var cont = document.getElementById("dlg-montajes-lista");
    cont.innerHTML = "";
    var busq = (document.getElementById("montajes-buscar").value || "").toLowerCase();
    var yo = usuarioActual();

    // "Montaje en blanco": fijo en primera posición, siempre visible pase
    // lo que pase el filtro -no es una fila de la biblioteca, es la acción
    // "crear uno nuevo y ponerme a trabajar", equivalente al viejo botón
    // "Nuevo". No se puede sobrescribir porque cada pulsación crea un
    // montaje distinto, con su propio uid.
    var blanco = document.createElement("button");
    blanco.type = "button";
    blanco.className = "montaje-fila montaje-en-blanco";
    var blancoNom = document.createElement("span");
    blancoNom.className = "montaje-nombre";
    blancoNom.textContent = T("montaje_en_blanco");
    blanco.appendChild(blancoNom);
    blanco.addEventListener("click", function () {
      elegirEquipo(function (eq) {
        // Si la lista está filtrada por otro equipo, la plantilla nueva
        // quedaría oculta: el filtro pasa a su equipo.
        try {
          if (localStorage.getItem(PLANTILLAS_EQUIPO_KEY)) localStorage.setItem(PLANTILLAS_EQUIPO_KEY, eq);
        } catch (e) { /* sin persistencia */ }
        var m = montajeNuevo(T("esc_nuevo_def"), eq);
        activo = m.montaje_uid;
        guardarMontaje(m, true);
        renderTodo();
      });
    });
    cont.appendChild(blanco);

    // Filtro por equipo (25-09-2026): arranca en el último equipo usado y
    // recuerda lo que se elija; "Todos" las enseña todas.
    var fEquipo = filtroEquipoPlantillas();
    var uids = Object.keys(montajes).filter(function (uid) {
      if (fEquipo && equipoDe(montajes[uid]) !== fEquipo) return false;
      if (!busq) return true;
      var m = montajes[uid];
      var nombre = (campo(m, "nombre") || "").toLowerCase();
      return nombre.indexOf(busq) !== -1 || autorDe(m).toLowerCase().indexOf(busq) !== -1;
    });
    // Alfabético, sin importar de quién sea -pedido del usuario-.
    uids.sort(compararMontajesPorNombre);

    document.getElementById("montajes-cuenta").textContent =
      T("montajes_cuenta", { n: uids.length, total: Object.keys(montajes).length });

    if (!uids.length) {
      var vacio = document.createElement("p");
      vacio.className = "empty-hint";
      vacio.textContent = T("plantilla_vacio");
      cont.appendChild(vacio);
      return;
    }

    uids.forEach(function (uid) {
      var m = montajes[uid];
      var fila = document.createElement("button");
      fila.type = "button";
      fila.className = "montaje-fila" + (uid === activo ? " activo" : "") +
        (puedoEditar(m) ? " mio" : "");
      var nom = document.createElement("span");
      nom.className = "montaje-nombre";
      nom.textContent = campo(m, "nombre") || uid;
      var sub = document.createElement("span");
      sub.className = "montaje-autor";
      // El subtítulo es el autor y cuántas entradas tiene ocupadas: con
      // montajes compartidos hay que saber de quién es y cuánto trae antes
      // de abrirlo.
      sub.textContent = (hayVariosEquipos() ? T("equipo_corto", { corto: cortoEquipo(equipoDe(m)) }) + " · " : "") +
        autorDe(m) + (yo && m.autor_id === yo.id ? " · " + T("montaje_tuyo") : "") +
        " · " + T("plantilla_entradas", { n: calcularResumen(m).entradas }) +
        (fechaMontaje(m) ? " · " + fechaMontaje(m) : "");
      fila.appendChild(nom);
      fila.appendChild(sub);
      // Elegir un montaje no lleva confirmación: no destruye nada, cada
      // montaje es su propio archivo y el anterior queda guardado tal
      // cual. La confirmación de la Fase 1 es solo para aplicar contenido
      // DENTRO de un caso, que sí sobrescribe.
      // La tarjeta se queda desplegada (pedido del usuario, 24-09-2026): tras
      // elegir suele venir Duplicar/Renombrar/Vaciar sobre esa misma
      // plantilla, y plegarla obligaba a redesplegarla cada vez.
      fila.addEventListener("click", function () {
        activo = uid;
        guardarMontajes();
        renderTodo();
      });
      cont.appendChild(fila);
    });
  }

  document.getElementById("montajes-buscar").addEventListener("input", renderListaMontajesDialog);

  var PLANTILLAS_EQUIPO_KEY = "mio_ionm_plantillas_equipo";
  function filtroEquipoPlantillas() {
    var envoltura = document.getElementById("montajes-equipo-filtro");
    var sel = document.getElementById("montajes-equipo");
    envoltura.hidden = !hayVariosEquipos();
    if (envoltura.hidden) return "";
    var guardado = null;
    try { guardado = localStorage.getItem(PLANTILLAS_EQUIPO_KEY); } catch (e) { /* sin persistencia */ }
    if (guardado === null) {
      try { guardado = localStorage.getItem(EQUIPO_ULTIMO_KEY) || ""; } catch (e) { guardado = ""; }
    }
    llenarSelectEquipos(sel, guardado);
    return sel.value;
  }
  document.getElementById("montajes-equipo").addEventListener("change", function () {
    try { localStorage.setItem(PLANTILLAS_EQUIPO_KEY, this.value); } catch (e) { /* sin persistencia */ }
    renderListaMontajesDialog();
  });

  // Bug real (05-09-2026): abrir la tarjeta a mano -pulsando su <summary>-
  // no pasaba por ningún render: sincronizarDlgMontajesSiAbierto() solo
  // repinta si YA estaba abierta cuando algo más llama a renderTodo(), así
  // que la primera vez que se despliega desde cerrada (el estado de fábrica)
  // se queda con la lista vacía hasta que cualquier otra acción dispare un
  // renderTodo(). El evento nativo "toggle" del <details> es justo lo que
  // faltaba para cubrir ese primer despliegue.
  dlgMontajes.addEventListener("toggle", function () {
    if (dlgMontajes.open) renderListaMontajesDialog();
  });

  /* ---------------------------------------------------------------- *
   * Fase 4.2: rótulo permanente. #barra-caso deja de ser exclusivo de la
   * corrección de un caso: está siempre visible, diciendo qué se está
   * tocando -una plantilla suelta o el material de un caso concreto-.
   * ---------------------------------------------------------------- */
  // El equipo del caso, a la derecha de "CASO 2026-001" en la cabecera de la
  // ficha (pedido del usuario, 25-09-2026). Solo con más de un equipo.
  function pintarEquipoSubtitulo(eq) {
    var el = document.getElementById("caso-subtitulo-equipo");
    el.hidden = !hayVariosEquipos();
    el.textContent = "";
    if (el.hidden) return;
    el.appendChild(document.createTextNode(T("caso_equipo_id") + " "));
    el.appendChild(nodoMarcaEquipo(eq));
  }

  // El nombre del equipo escrito con una letra que recuerda a su logotipo
  // (pedido del usuario, 25-09-2026): Cadwell en mayúsculas muy gruesas,
  // Inomed en minúsculas redondeadas y rojas. Solo letras del sistema -la app
  // no carga fuentes de fuera-; el estilo está en .marca-<equipo> (style.css).
  function nodoMarcaEquipo(eq) {
    var s = document.createElement("span");
    s.className = "marca-equipo marca-" + eq;
    s.textContent = nombreEquipo(eq);
    return s;
  }

  // El equipo detrás del nombre del rótulo, solo si hay más de uno: una
  // etiqueta sobria con el nombre, sin imitar el logotipo de la marca
  // (pedido del usuario, 28-09-2026: el rótulo no encajaba con el resto).
  function anadirRotuloEquipo(el, obj) {
    if (!hayVariosEquipos()) return;
    var chip = document.createElement("span");
    chip.className = "barra-caso-equipo";
    chip.textContent = nombreEquipo(equipoDe(obj));
    chip.title = T("caso_equipo_id");
    el.appendChild(chip);
  }

  function renderBarraCaso() {
    var barra = document.getElementById("barra-caso");
    var prefijo = document.getElementById("barra-caso-prefijo");
    var nombre = document.getElementById("barra-caso-nombre");
    var ay = document.getElementById("barra-caso-ay");
    var acciones = document.getElementById("barra-caso-acciones");
    if (document.body.classList.contains("editando-caso")) {
      var caso = casos[casoEditandoUid];
      barra.hidden = false;
      prefijo.textContent = T("barra_caso_texto");
      nombre.textContent = caso ? ((caso.ID_Caso || "") + (caso.nombre_caso ? " — " + caso.nombre_caso : "")) : "";
      if (caso) anadirRotuloEquipo(nombre, caso);
      ay.textContent = T("barra_caso_ay");
      acciones.hidden = false;
    } else {
      // Pedido el 06-09-2026: ya no vive fuera de las 6 pantallas, y no se
      // muestra en absoluto hasta que hay de verdad una plantilla cargada
      // -antes decía "sin plantilla activa" todo el rato, de sobra ahora
      // que el rótulo vive pegado a Plantillas de montajes-.
      var esc = escenarioActual();
      barra.hidden = !esc;
      prefijo.textContent = T("barra_plantilla_texto");
      nombre.textContent = esc ? campo(esc, "nombre") : "";
      if (esc) anadirRotuloEquipo(nombre, esc);
      ay.textContent = "";
      acciones.hidden = true;
    }
    document.body.classList.toggle("barra-caso-oculta", barra.hidden);
    renderNotasMontaje();
  }

  /* Notas del montaje, en el Organizador: las de la plantilla activa o, si se
     está corrigiendo el montaje de un caso, las de ese caso (el mismo campo
     "Notas del montaje" de la ficha). Se guardan al salir de la caja, no en
     cada tecla, para no disparar una subida por letra. */
  function renderNotasMontaje() {
    var bloque = document.getElementById("montaje-notas");
    var caja = document.getElementById("montaje-notas-texto");
    var esc = escenarioActual();
    bloque.hidden = !esc;
    if (!esc) return;
    var valor = esc.notas_montaje || "";
    if (caja.value !== valor && document.activeElement !== caja) caja.value = valor;
    caja.readOnly = !montajeCaso && !puedoEditar(esc);
  }

  document.getElementById("montaje-notas-texto").addEventListener("change", function () {
    var esc = escenarioActual();
    if (!esc || (!montajeCaso && !puedoEditar(esc))) return;
    esc.notas_montaje = this.value;
    guardarMontajeActivo();
  });

  document.getElementById("btn-restablecer").addEventListener("click", function () {
    if (!confirm(T("restablecer_conf"))) return;
    localStorage.removeItem(STORAGE_KEY);
    borrados = [];
    cargarEstado();
    renderTodo();
    avisoGuardado(T("restablecido"));
  });

  // Copia de seguridad completa. Usa el mismo objeto que se sube a GitHub
  // (estadoActual), para que el .json exportado y el remoto sean idénticos:
  // si aquí se armara la copia a mano, sería fácil olvidar un bloque nuevo y
  // la copia perdería datos en silencio.
  document.getElementById("btn-exportar").addEventListener("click", function () {
    var copia = estadoActual();
    // Copia completa (auditoría 28-09-2026, C6): además de lo de siempre
    // (catálogos, etiquetas, material), los casos, las plantillas y los
    // apuntes, que viven en archivos aparte y antes no salían. Así, sin
    // token o con GitHub caído, hay una copia local de todo.
    copia.completa = { casos: casos, montajes: montajes, apuntes: apunteDoc };
    var blob = new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "mio-ionm-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    avisoGuardado(T("exportado"));
  });

  document.getElementById("btn-importar").addEventListener("click", function () {
    document.getElementById("fichero-importar").click();
  });

  document.getElementById("fichero-importar").addEventListener("change", function (e) {
    var fichero = e.target.files && e.target.files[0];
    if (!fichero) return;
    var lector = new FileReader();
    lector.onload = function () {
      var copia;
      try {
        copia = JSON.parse(lector.result);
      } catch (err) {
        alert(T("import_no_json"));
        return;
      }
      if (!copia || copia.formato !== "mio-ionm") {
        alert(T("import_no_formato"));
        return;
      }
      if (!confirm(T("import_conf", {
        escenarios: Object.keys(copia.escenarios || {}).length,
        materiales: (copia.catalogo_usuario || []).length
      }) + (copia.completa ? "\n\n" + T("import_conf_completa", {
        casos: Object.keys(copia.completa.casos || {}).length,
        montajes: Object.keys(copia.completa.montajes || {}).length
      }) : ""))) return;

      // Mismo camino que la bajada de GitHub: así las etiquetas propias y
      // las copias antiguas sin etiquetas se tratan igual en los dos sitios.
      aplicarEstado(copia);
      avisoGuardado(T("importado"));
      if (copia.completa) importarCopiaCompleta(copia.completa);
    };
    lector.readAsText(fichero);
    e.target.value = "";
  });

  // Casos y plantillas de una copia completa: solo se añaden los que NO
  // están en este dispositivo -nunca se pisa uno que ya exista-. Los apuntes,
  // solo si aquí no hay ninguno. Lo recuperado se sube con la sincronización
  // como cualquier cambio (y si en GitHub ya existía, se fusiona, ver
  // fusionarCaso()).
  function importarCopiaCompleta(completa) {
    var nCasos = 0, nMontajes = 0, conApuntes = false;
    Object.keys(completa.casos || {}).forEach(function (uid) {
      var c = completa.casos[uid];
      if (!c || !c.caso_uid || casos[uid]) return;
      casos[uid] = c;
      if (!MODO_DEMO) casosSinSubir[uid] = true;
      guardarUnCasoLocal(uid);
      nCasos++;
    });
    Object.keys(completa.montajes || {}).forEach(function (uid) {
      var m = completa.montajes[uid];
      if (!m || !m.montaje_uid || montajes[uid]) return;
      guardarMontaje(m, true);
      nMontajes++;
    });
    var ap = completa.apuntes;
    if (ap && (ap.secciones || []).length && !(apunteDoc.secciones || []).length) {
      apunteDoc = ap;
      guardarApunteDoc();
      conApuntes = true;
    }
    guardarCasos();
    programarEnvio();
    pintarEstadoSync();
    if (pantallaActiva("casos")) renderListaCasos();
    alert(T("import_completa_hecho", { casos: nCasos, montajes: nMontajes }) +
      (conApuntes ? "\n" + T("import_completa_apuntes") : ""));
  }

  document.getElementById("btn-imprimir").addEventListener("click", function () {
    window.print();
  });

  // El resumen es la única tarjeta que sale en el papel -escenario, montajes
  // y cajas se ocultan por CSS en @media print, ver style.css-. Si estuviera
  // cerrada al imprimir (con el botón o con Ctrl/Cmd+P), no saldría nada en
  // el papel. Se abre a la fuerza justo antes de imprimir y se devuelve a
  // como estaba después.
  var resumenAbiertoAntesDeImprimir = null;
  window.addEventListener("beforeprint", function () {
    var det = document.getElementById("resumen");
    resumenAbiertoAntesDeImprimir = det.open;
    det.open = true;
  });
  window.addEventListener("afterprint", function () {
    if (resumenAbiertoAntesDeImprimir !== null) {
      document.getElementById("resumen").open = resumenAbiertoAntesDeImprimir;
    }
  });

  document.getElementById("catalogo-buscar").addEventListener("input", function () {
    renderCatalogo();
    seleccionar(seleccionado); // mantiene el resaltado tras filtrar
  });

  document.getElementById("bs-cancelar").addEventListener("click", function () {
    seleccionar(null);
  });

  document.getElementById("be-cancelar").addEventListener("click", function () {
    cancelarEnlacePuente();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { seleccionar(null); cancelarEnlacePuente(); }
  });

  /* ---------------------------------------------------------------- *
   * Fase 5: guía de uso. Contenido estático de data/guia.js -no se
   * sincroniza, no se guarda nada de aquí, igual que la ventana Docente-.
   * Se pinta una sola vez, la primera vez que se abre: el contenido no
   * cambia mientras dura la sesión, así que no hace falta rehacerlo en
   * cada apertura.
   * ---------------------------------------------------------------- */
  var dlgGuia = document.getElementById("dlg-guia");
  var guiaRenderizada = false;

  function renderGuia() {
    var guia = window.GUIA || { tarjetas: [], acordeon: [] };

    var contTarjetas = document.getElementById("guia-tarjetas");
    contTarjetas.innerHTML = "";
    guia.tarjetas.forEach(function (t, i) {
      var tarjeta = document.createElement("div");
      // La tercera tarjeta ("Plantilla y caso no son lo mismo") es la más
      // importante de las seis -pedido explícito al escribir el guion-.
      tarjeta.className = "guia-tarjeta" + (i === 2 ? " guia-destacada" : "");
      var h4 = document.createElement("h4");
      h4.textContent = t.titulo;
      var p = document.createElement("p");
      p.textContent = t.texto;
      tarjeta.appendChild(h4);
      tarjeta.appendChild(p);
      contTarjetas.appendChild(tarjeta);
    });

    var contAcordeon = document.getElementById("guia-acordeon");
    contAcordeon.innerHTML = "";
    guia.acordeon.forEach(function (sec) {
      var det = document.createElement("details");
      det.className = "caso-grupo";
      var summary = document.createElement("summary");
      summary.textContent = sec.titulo;
      var campos = document.createElement("div");
      campos.className = "caso-grupo-campos";
      // Contenido estático de desarrollador (data/guia.js), no dato de
      // usuario: mismo patrón que las intros de Catálogos (cat_intro_*).
      campos.innerHTML = sec.html;
      det.appendChild(summary);
      det.appendChild(campos);
      contAcordeon.appendChild(det);
    });

    guiaRenderizada = true;
  }

  function abrirGuia() {
    if (!guiaRenderizada) renderGuia();
    dlgGuia.showModal();
  }

  document.getElementById("btn-guia").addEventListener("click", abrirGuia);

  /* ---------------------------------------------------------------- *
   * Técnicas MIO: parámetros técnicos por técnica, para consulta durante el
   * caso. Se pinta una sola vez, la primera vez que se abre.
   *
   * DE DÓNDE SALE (27-09-2026): son apuntes del autor sacados de libros,
   * capítulos y artículos, y no deben verse fuera. Antes eran
   * data/tecnicas-mio.js en el repositorio PÚBLICO; ahora viven en el
   * privado, referencia/tecnicas-mio.json (con su LEEME al lado, que es el
   * antiguo comentario de cabecera: estructura y principio de fuentes). La
   * app lo baja con el token de sincronización (bajarTecnicasMio(), dentro de
   * bajarAuto()) y lo guarda en localStorage para tenerlo sin conexión. Sin
   * token -cualquiera que abra el enlace- o en la demo no hay datos y la
   * tarjeta no se enseña. Solo se baja, nunca se sube: se edita el JSON en
   * el repositorio.
   *
   * Cada técnica trae objetos anidados con variantes por fuente (p. ej.
   * intensidad_mA: { costa_2015: "...", alvarez_2023: "..." }): el
   * principio del dato es no promediarlas ni combinarlas nunca, así que
   * pintarValorTecMio() las pinta todas, una por línea, en vez de elegir
   * una. Las claves desconocidas (Lote 2 y siguientes) caen en el
   * etiquetado genérico de etiquetaTecMio(), así que un lote nuevo con el
   * mismo formato no necesita tocar este código.
   * ---------------------------------------------------------------- */
  var dlgTecnicasMio = document.getElementById("pantalla-tecnicas-mio");
  var tecMioRenderizada = false;

  var TECMIO_KEY = "mio_ionm_tecnicas_mio_v1";   // { sha, datos }
  var tecMioSha = "";
  (function cargarTecnicasMioLocal() {
    try {
      var g = JSON.parse(localStorage.getItem(TECMIO_KEY) || "null");
      if (g && g.datos && g.datos.tecnicas) { window.TECNICAS_MIO = g.datos; tecMioSha = g.sha || ""; }
    } catch (e) { /* sin copia local */ }
  })();

  function olvidarTecnicasMio() {
    tecMioSha = "";
    window.TECNICAS_MIO = null;
    tecMioRenderizada = false;
    try { localStorage.removeItem(TECMIO_KEY); } catch (e) { /* nada que quitar */ }
    pintarTileTecnicasMio();
  }

  function hayTecnicasMio() {
    return !MODO_DEMO && !!(window.TECNICAS_MIO && (window.TECNICAS_MIO.tecnicas || []).length);
  }
  function pintarTileTecnicasMio() {
    document.getElementById("tile-tecnicas-mio").hidden = !hayTecnicasMio();
  }

  function bajarTecnicasMio() {
    if (MODO_DEMO || !syncActivo() || navigator.onLine === false) return Promise.resolve();
    var url = "https://api.github.com/repos/" + sync.repo + "/contents/referencia/tecnicas-mio.json";
    return fetch(url, { headers: cabeceras(), cache: "no-store" })
      .then(function (resp) {
        // Si se quitó del repositorio, se quita también de aquí
        if (resp.status === 404) {
          if (tecMioSha) olvidarTecnicasMio();
          return null;
        }
        if (!resp.ok) throw new Error(errorLegible(resp));
        return resp.json();
      })
      .then(function (json) {
        if (!json || !json.content || json.sha === tecMioSha) return;
        var datos = JSON.parse(deBase64(json.content));
        if (!datos || !datos.tecnicas) return;
        window.TECNICAS_MIO = datos;
        tecMioSha = json.sha;
        try { localStorage.setItem(TECMIO_KEY, JSON.stringify({ sha: json.sha, datos: datos })); } catch (e) { /* solo esta sesión */ }
        tecMioRenderizada = false;
        if (pantallaActiva("tecnicas-mio")) renderTecnicasMio();
      })
      .catch(function (e) { ultimoFallo = e.message || T("sync_error_bajar"); })
      .then(function () { pintarTileTecnicasMio(); });
  }
  // Término de búsqueda ya normalizado (sin acentos, minúsculas), vigente
  // durante el renderizado en curso: lo consultan pintarTextoConResaltado()
  // y tecnicaCoincideTecMio() sin necesidad de pasarlo por cada función.
  var tecMioFiltro = "";

  // Agrupación de la pantalla "Técnicas IONM" por tipo de técnica (pedido por
  // el usuario, 05-09-2026), no por zona quirúrgica -ver el comentario largo al
  // principio del LEEME de referencia/ (repo privado) con el porqué y qué técnica cae en cada
  // familia-. Cada técnica trae su "familia" ya fijada a mano en ese archivo;
  // aquí solo se traduce a texto legible y se fija el orden de los grupos.
  var TECMIO_FAMILIAS = {
    sep: "SEP (potenciales evocados somatosensoriales)",
    mep: "MEP (potenciales evocados motores)",
    onda_d: "Onda D",
    emg: "EMG",
    reflejos: "Reflejos",
    vep: "VEP (potenciales evocados visuales)",
    peatc: "PEATC / BAEP (potenciales evocados auditivos de tronco)",
    eeg_ecog: "EEG / ECoG",
    des: "DES (estimulación eléctrica directa, mapeo cortical/subcortical)",
    mapeo: "Otro mapeo y registro directo"
  };
  // Orden fijo de aparición de los grupos -no alfabético-: evocados motores y
  // sensitivos primero (SEP → MEP → Onda D, el orden clínico del Lote 1),
  // EMG y reflejos después, luego el resto de evocados (VEP, PEATC),
  // actividad cortical espontánea (EEG/ECoG), y por último las técnicas de
  // mapeo por estimulación directa. Cualquier familia que no esté en esta
  // lista (no debería pasar, ver notas_meta) se pinta al final, por orden de
  // aparición.
  var TECMIO_ORDEN_FAMILIAS = [
    "sep", "mep", "onda_d", "emg", "reflejos", "vep", "peatc", "eeg_ecog", "des", "mapeo"
  ];

  var TECMIO_SECCIONES = {
    estimulacion: "Estimulación",
    registro: "Registro",
    estimulacion_y_registro: "Estimulación y registro",
    estimulacion_registro: "Estimulación / registro",
    filtros: "Filtros",
    barrido: "Barrido (sweep)",
    umbrales_referencia: "Umbrales de referencia",
    tecnica_colision_onda_d: "Técnica de colisión (onda D)",
    mapeo_subcortical_radiacion_optica: "Mapeo subcortical (radiación óptica)",
    notas_clinicas: "Notas clínicas"
  };

  var TECMIO_CAMPOS = {
    sitio: "Sitio", sitio_montaje: "Sitio / montaje", sitio_montajes: "Sitio / montajes",
    sitio_cortical: "Sitio cortical", sitio_subcortical: "Sitio subcortical",
    electrodo: "Electrodo", parametros: "Parámetros",
    parametros_mapeo_clasico: "Parámetros (mapeo clásico)",
    parametros_mapeo_dinamico_continuo: "Parámetros (mapeo dinámico continuo)",
    intensidad_mA: "Intensidad (mA)", intensidad: "Intensidad",
    duracion_pulso_ms: "Duración de pulso (ms)", duracion_pulso_us: "Duración de pulso (µs)",
    frecuencia_hz: "Frecuencia (Hz)", tasa_hz: "Tasa (Hz)",
    modo: "Modo", tipo: "Tipo", tipo_estimulo: "Tipo de estímulo",
    tipo_estimulador: "Tipo de estimulador", tren_pulsos: "Tren de pulsos", isi_ms: "ISI (ms)",
    protocolo_diferenciacion_central_vs_periferico: "Protocolo: central vs. periférico",
    montaje: "Montaje", nota_tecnica: "Nota técnica",
    musculos: "Músculos", musculos_habituales: "Músculos habituales", sonda: "Sonda",
    pasa_alto_hz: "Pasa-alto (Hz)", pasa_bajo_hz: "Pasa-bajo (Hz)",
    pasa_alto_periferico_hz: "Pasa-alto periférico (Hz)", pasa_bajo_periferico_hz: "Pasa-bajo periférico (Hz)",
    pasa_bajo_khz: "Pasa-bajo (kHz)", notch: "Notch", rango_hz: "Rango (Hz)", evitar: "Evitar",
    tiempo_analisis_ms: "Tiempo de análisis (ms)", tiempo_barrido_s: "Tiempo de barrido (s)",
    ventana_registro_ms: "Ventana de registro (ms)", promediado_n: "Promediado (n)",
    tasa_muestreo_hz: "Tasa de muestreo (Hz)",
    criterio_alerta: "Criterio de alerta", trampas_frecuentes: "Trampas frecuentes",
    localizacion_por_onda: "Localización por onda",
    umbral_alarma_mas_usado_mA: "Umbral de alarma más usado (mA)",
    rangos_alternativos_publicados_mA: "Rangos alternativos publicados (mA)",
    valores_normales_sin_brecha_mA: "Valores normales sin brecha (mA)",
    aplicabilidad: "Aplicabilidad", valores_normativos: "Valores normativos", nota: "Nota",
    polaridad: "Polaridad", protocolo_practico: "Protocolo práctico",
    parametros_penfield_clasica: "Parámetros (Penfield clásica)",
    parametros_tren_corto_alta_frecuencia: "Parámetros (tren corto/alta frecuencia)",
    parametros_variables_segun_serie: "Parámetros según la serie",
    tecnica_baja_frecuencia_lf: "Técnica de baja frecuencia (LF)",
    tecnica_alta_frecuencia_hf: "Técnica de alta frecuencia (HF)",
    corriente_de_trabajo_protocolo_us: "Corriente de trabajo (protocolo EE.UU.)",
    corriente_de_trabajo_protocolo_europeo: "Corriente de trabajo (protocolo europeo)",
    tareas: "Tareas", criterio_sitio_elocuente: "Criterio de sitio elocuente",
    manejo_crisis: "Manejo de crisis", criterio_seguridad: "Criterio de seguridad",
    nervio: "Nervio", tecnica: "Técnica",
    criterio_localizacion: "Criterio de localización", precision_descrita: "Precisión descrita",
    ventaja: "Ventaja", distancia_electrodos: "Distancia entre electrodos",
    sensibilidad_inicial: "Sensibilidad inicial", ventana_tiempo: "Ventana de tiempo",
    criterios_cnap_valido: "Criterios de CNAP válido", interpretacion: "Interpretación",
    sitio_clave: "Sitio clave", indicacion_especifica: "Indicación específica",
    limitacion: "Limitación", facilitacion_si_no_hay_respuesta: "Facilitación si no hay respuesta",
    filtros_hz: "Filtros (Hz)", timing_recomendado: "Timing recomendado",
    componentes: "Componentes", trampa_critica: "Trampa crítica",
    sensibilidad_anestesica: "Sensibilidad anestésica",
    contexto_anestesico_descrito: "Contexto anestésico descrito",
    tasa_exito_descrita: "Tasa de éxito descrita", utilidad: "Utilidad",
    parametros_intraoperatorios: "Parámetros intraoperatorios",
    preoperatorio_diagnostico: "Preoperatorio diagnóstico", musculo: "Músculo",
    valores_normativos_intraoperatorios_scm_ipsi: "Valores normativos intraoperatorios (SCM ipsilateral)",
    estado_de_validacion: "Estado de validación", scalp: "Scalp", intracraneal: "Intracraneal",
    uso_real: "Uso real", utilidad_descrita: "Utilidad descrita",
    diferencia_clave: "Diferencia clave", regla_practica: "Regla práctica",
    correlacion_riesgo_seidel: "Correlación de riesgo (Seidel)", promediado: "Promediado",
    ventana: "Ventana",
    // Lote 3 + Lote 4 (04-09-2026) y nota de derivaciones optimizadas ISION.
    descripcion: "Descripción", caracteristicas: "Características",
    indicacion: "Indicación", indicaciones: "Indicaciones",
    sensibilidad: "Sensibilidad", limitaciones: "Limitaciones",
    criterios_isquemia_endarterectomia: "Criterios de isquemia (endarterectomía)",
    electrodos: "Electrodos",
    uso_principal_en_mio: "Uso principal en MIO", uso_epilepsia: "Uso en epilepsia",
    efecto_anestesicos: "Efecto de los anestésicos",
    color_de_luz: "Color de luz", canal_retino: "Canal de retino (ERG)",
    mapeo_via_anterior_ONAP: "Mapeo vía anterior (ONAP)",
    limitacion_principal: "Limitación principal",
    mapeo_vs_monitorizacion: "Mapeo vs. monitorización",
    gastrocnemio: "Gastrocnemio", soleo: "Sóleo",
    confirmacion_h_reflejo: "Confirmación del H-reflejo",
    parametros_monitorizados: "Parámetros monitorizados", mediado_por: "Mediado por",
    variante_heteronima: "Variante heterónima",
    contexto_investigacion_SCS: "Contexto de investigación (SCS)",
    contexto_quirurgico_practico: "Contexto quirúrgico práctico",
    fisiologia: "Fisiología", latencia_relativa_h_reflejo: "Latencia relativa al H-reflejo",
    aplicacion_descrita: "Aplicación descrita",
    diferenciacion_prm: "Diferenciación con el PRM", fundamento: "Fundamento",
    objetivo: "Objetivo",
    anestesia_requerida: "Anestesia requerida", montajes: "Montajes",
    configuracion_segun_nervio_en_riesgo: "Configuración según el nervio en riesgo",
    amplitud_normal_cR1: "Amplitud normal (cR1)", latencia: "Latencia",
    ventaja_clinica: "Ventaja clínica",
    parametros_alvarez_2023: "Parámetros (Álvarez 2023)",
    parametros_moller_alternativos: "Parámetros alternativos (Møller)",
    // Claves con el nombre de una fuente: rótulo con el formato de cita
    // unificado (demo-congreso B3.F3) en vez del nombre de la clave tal cual.
    alvarez_2023: "Álvarez 2023", alvarez_2023_clinico: "Álvarez 2023, clínico",
    clinico_alvarez_2023: "Clínico (Álvarez 2023)", costa_2015: "Costa 2016",
    analogico_moller: "Analógico (Møller)", ejemplo_laboratorio_moller: "Ejemplo de laboratorio (Møller)",
    moller_cap5_ejemplo: "Ejemplo (Møller, cap. 5)", macdonald_2019_ision: "MacDonald 2019 (ISION)",
    ision_scalp: "ISION, scalp",
    protocolo_busqueda: "Protocolo de búsqueda",
    CN_VII: "CN VII", CN_XII: "CN XII", CN_IX_X: "CN IX/X",
    anatomia_referencia: "Anatomía de referencia",
    patrones_desplazamiento_por_tumor: "Patrones de desplazamiento por el tumor",
    seguridad: "Seguridad",
    tecnica_rejilla_multielectrodo: "Técnica de rejilla multielectrodo",
    epoca: "Época",
    tecnica_alternativa_electrodo_bola: "Técnica alternativa (electrodo de bola)",
    criterio_localizacion_linea_media: "Criterio de localización (línea media)",
    trayecto_general: "Trayecto general",
    protocolo_detallado_nervio_facial_extracraneal: "Protocolo detallado (nervio facial extracraneal)",
    identificacion_fascicular_intraneural: "Identificación fascicular intraneural",
    verificacion_previa: "Verificación previa",
    mapeo_directo_gandhi: "Mapeo directo (Gandhi)",
    requisito_tecnico: "Requisito técnico", uso_diferencial: "Uso diferencial",
    supuesto_no_validado: "Supuesto no validado", alternativa_conceptual: "Alternativa conceptual",
    sitio_v3: "Sitio (V3)", electrodo_v3: "Electrodo (V3)",
    sitio_v1: "Sitio (V1)", electrodo_v1: "Electrodo (V1)",
    parametros_v3_y_v1: "Parámetros (V3 y V1)",
    estimulacion_directa_intraoperatoria: "Estimulación directa intraoperatoria",
    styloglossus: "Styloglossus", genioglosso: "Genioglosso",
    lateralidad: "Lateralidad", posicion_mandibula: "Posición de la mandíbula",
    patrones: "Patrones", tasa_de_registro: "Tasa de registro",
    valores_normativos_v3_styloglossus: "Valores normativos V3 (styloglossus)",
    valores_normativos_v1_styloglossus: "Valores normativos V1 (styloglossus)",
    valores_estimulacion_directa_intraoperatoria: "Valores (estimulación directa intraoperatoria)",
    ausente_en: "Ausente en", utilidad_diferencial: "Utilidad diferencial",
    robustez_bajo_anestesia: "Robustez bajo anestesia",
    principio: "Principio",
    mmss_mediano_cubital_decusacion_normal: "Miembros superiores, mediano/cubital — decusación normal",
    mmss_no_decusacion: "Miembros superiores — sin decusación",
    mmii_tibial_decusacion_normal: "Miembros inferiores, tibial — decusación normal",
    mmii_no_decusacion: "Miembros inferiores — sin decusación",
    mmii_posicion_sentada: "Miembros inferiores — posición sentada (fosa posterior)",
    fpz_rara_vez_optima: "Fpz rara vez óptima", comprobar_decusacion: "Comprobar decusación",
    opcional_erb_n13: "Opcional: Erb / N13", fallback_subcortical: "Fallback subcortical",
    velocidad: "Velocidad", topografia_variable: "Topografía variable",
    aclaracion_jaw_jerk: "Aclaración (jaw jerk)",
    // Lote 5 (06-09-2026): c-MEP por grid/strip cortical directo.
    parametros_representativos_segun_serie: "Parámetros representativos según la serie",
    efecto_anestesico_sobre_umbral: "Efecto anestésico sobre el umbral",
    aclaracion_nomenclatura: "Aclaración de nomenclatura",
    ventaja_principal: "Ventaja principal",
    uso_combinado_con_mapeo_subcortical: "Uso combinado con mapeo subcortical",
    alarma_lesion_vascular_remota: "Alarma de lesión vascular remota",
    perdida_irreversible: "Pérdida irreversible",
    distancia_al_tracto_incierta: "Distancia al tracto (incierta)",
    // Claves de tiempo de análisis del PESS (27-09-2026: MMSS/MMII se
    // escriben enteros en toda la app).
    MMII: "Miembros inferiores",
    MMSS_referencia_cruzada: "Miembros superiores (referencia cruzada)"
  };

  function etiquetaTecMio(clave, diccionario) {
    if (diccionario[clave]) return diccionario[clave];
    var s = clave.replace(/_/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Quita acentos/diacríticos y pasa a minúsculas, para que buscar "musculo"
  // encuentre "músculo" y viceversa. normalize("NFD") + quitar las marcas
  // combinantes no cambia el número de caracteres de cada letra acentuada
  // (una "ú" se descompone en "u" + marca, y al quitar la marca vuelve a
  // quedar en un único carácter) -por eso los índices que da indexOf() sobre
  // el texto normalizado sirven directamente sobre el texto original en
  // pintarTextoConResaltado().
  function normalizarTecMio(s) {
    return String(s === null || s === undefined ? "" : s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  // Con búsqueda activa, envuelve las coincidencias en <mark>; sin ella,
  // pinta el texto tal cual (mismo resultado que antes de tener buscador).
  function pintarTextoConResaltado(contenedor, texto) {
    var t = String(texto === null || texto === undefined ? "" : texto);
    if (!tecMioFiltro) { contenedor.appendChild(document.createTextNode(t)); return; }
    var normalizado = normalizarTecMio(t);
    var pos = 0;
    var idx = normalizado.indexOf(tecMioFiltro);
    if (idx === -1) { contenedor.appendChild(document.createTextNode(t)); return; }
    while (idx !== -1) {
      if (idx > pos) contenedor.appendChild(document.createTextNode(t.slice(pos, idx)));
      var fin = idx + tecMioFiltro.length;
      var marca = document.createElement("mark");
      marca.className = "tecmio-resaltado";
      marca.textContent = t.slice(idx, fin);
      contenedor.appendChild(marca);
      pos = fin;
      idx = normalizado.indexOf(tecMioFiltro, pos);
    }
    if (pos < t.length) contenedor.appendChild(document.createTextNode(t.slice(pos)));
  }

  // Busca en toda la técnica -nombre, categoría y cualquier parámetro
  // anidado-, no solo en el nombre: así "supraorbitario" encuentra el Blink
  // Reflex aunque esa palabra solo aparezca dentro de "estimulacion.sitio".
  function tecnicaCoincideTecMio(tecnica, filtro) {
    return normalizarTecMio(JSON.stringify(tecnica)).indexOf(filtro) !== -1;
  }

  function pintarValorTecMio(contenedor, valor) {
    if (valor === null || valor === undefined) return;
    if (typeof valor === "string" || typeof valor === "number") {
      pintarTextoConResaltado(contenedor, String(valor));
      return;
    }
    if (Array.isArray(valor)) {
      if (!valor.length) { contenedor.appendChild(document.createTextNode("—")); return; }
      var ul = document.createElement("ul");
      ul.className = "tecmio-lista";
      valor.forEach(function (item) {
        var li = document.createElement("li");
        pintarValorTecMio(li, item);
        ul.appendChild(li);
      });
      contenedor.appendChild(ul);
      return;
    }
    // Objeto: variantes por fuente u otras subclaves (nunca se combinan).
    var dl = document.createElement("dl");
    dl.className = "tecmio-sub";
    Object.keys(valor).forEach(function (k) {
      var dt = document.createElement("dt");
      pintarTextoConResaltado(dt, etiquetaTecMio(k, TECMIO_CAMPOS) + ":");
      var dd = document.createElement("dd");
      pintarValorTecMio(dd, valor[k]);
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
    contenedor.appendChild(dl);
  }

  function pintarSeccionTecMio(contenedor, clave, datos) {
    if (!datos) return;
    var claves = Object.keys(datos).filter(function (k) { return k !== "fuente"; });
    if (!claves.length && !(datos.fuente && datos.fuente.length)) return;

    var titulo = document.createElement("h5");
    // Clase por sección (tecmio-titulo-estimulacion, -filtros, -barrido...):
    // permite destacar en CSS justo lo que se consulta a media cirugía
    // -estimulación, filtros, barrido- por encima de registro/notas, sin
    // tocar este archivo si el color cambia (pedido por el usuario, 04-09-2026).
    titulo.className = "tecmio-titulo-seccion tecmio-titulo-" + clave;
    pintarTextoConResaltado(titulo, TECMIO_SECCIONES[clave] || etiquetaTecMio(clave, TECMIO_SECCIONES));
    contenedor.appendChild(titulo);

    if (claves.length) {
      var dl = document.createElement("dl");
      dl.className = "tecmio-campos";
      claves.forEach(function (k) {
        var dt = document.createElement("dt");
        pintarTextoConResaltado(dt, etiquetaTecMio(k, TECMIO_CAMPOS) + ":");
        var dd = document.createElement("dd");
        pintarValorTecMio(dd, datos[k]);
        dl.appendChild(dt);
        dl.appendChild(dd);
      });
      contenedor.appendChild(dl);
    }

    if (datos.fuente && datos.fuente.length) {
      var p = document.createElement("p");
      p.className = "tecmio-fuente";
      p.appendChild(document.createTextNode("Fuente: "));
      pintarTextoConResaltado(p, datos.fuente.join(", "));
      contenedor.appendChild(p);
    }
  }

  function renderTecnicaMio(tecnica) {
    var det = document.createElement("details");
    det.className = "caso-grupo tecmio-tecnica";
    if (tecMioFiltro) det.open = true;
    var summary = document.createElement("summary");
    if (tecnica.categoria) {
      var badge = document.createElement("span");
      // Color por familia de técnica (pedido por el usuario, 05-09-2026): un
      // colorcito propio por etiqueta -morado en SEP, rojo/granate en MEP,
      // un rojo distinto en Onda D, verde en EMG, azul en EEG/ECoG, naranja
      // en Reflejos...-. Las clases .tecmio-badge-<familia> están en
      // style.css; si la técnica no trae "familia" (no debería pasar, ver
      // notas_meta de referencia/tecnicas-mio.json) se queda con el color neutro de
      // siempre.
      badge.className = "tecmio-badge" + (tecnica.familia ? " tecmio-badge-" + tecnica.familia : "");
      pintarTextoConResaltado(badge, tecnica.categoria);
      summary.appendChild(badge);
    }
    pintarTextoConResaltado(summary, tecnica.nombre);
    det.appendChild(summary);

    var campos = document.createElement("div");
    campos.className = "caso-grupo-campos";
    // "descripcion" es texto libre suelto, no un objeto con subclaves y
    // fuente como el resto de secciones -c_sep_cortical_directo es la única
    // técnica que lo trae de momento-, así que se pinta aparte como intro.
    if (tecnica.descripcion) {
      var introDesc = document.createElement("p");
      introDesc.className = "tecmio-descripcion";
      pintarTextoConResaltado(introDesc, tecnica.descripcion);
      campos.appendChild(introDesc);
    }
    [
      "estimulacion", "registro", "estimulacion_y_registro", "estimulacion_registro",
      "filtros", "barrido", "umbrales_referencia", "tecnica_colision_onda_d",
      "mapeo_subcortical_radiacion_optica", "notas_clinicas"
    ].forEach(function (clave) {
      pintarSeccionTecMio(campos, clave, tecnica[clave]);
    });
    det.appendChild(campos);
    return det;
  }

  // Con el cuadro de búsqueda vacío se pinta todo, cerrado por defecto,
  // igual que antes de existir el buscador. En cuanto hay texto, las
  // técnicas que no coinciden desaparecen (junto con su región si se queda
  // sin ninguna) y lo que sí coincide se abre solo -región y técnica-, para
  // ir directo al resultado sin desplegar nada a mano.
  function renderTecnicasMioTarjetas() {
    var datos = window.TECNICAS_MIO || { tecnicas: [] };
    var cont = document.getElementById("tecmio-contenido");
    cont.innerHTML = "";

    // Agrupación por familia de técnica (SEP, MEP, Reflejos...), no por
    // región/zona quirúrgica -reorganización del 05-09-2026, ver el
    // LEEME de referencia/ en el repo privado-. El orden de
    // aparición de los grupos lo fija TECMIO_ORDEN_FAMILIAS, no el orden de
    // encuentro en el array; dentro de cada grupo sí se respeta el orden de
    // encuentro, igual que antes con las regiones.
    var porFamilia = {};
    var familiasEncontradas = [];
    (datos.tecnicas || []).forEach(function (t) {
      if (tecMioFiltro && !tecnicaCoincideTecMio(t, tecMioFiltro)) return;
      var f = t.familia || "otras";
      if (!porFamilia[f]) { porFamilia[f] = []; familiasEncontradas.push(f); }
      porFamilia[f].push(t);
    });

    var ordenFamilias = TECMIO_ORDEN_FAMILIAS.filter(function (f) {
      return porFamilia[f];
    });
    familiasEncontradas.forEach(function (f) {
      if (ordenFamilias.indexOf(f) === -1) ordenFamilias.push(f);
    });

    ordenFamilias.forEach(function (f) {
      var det = document.createElement("details");
      det.className = "caso-grupo tecmio-familia tecmio-familia-" + f;
      if (tecMioFiltro) det.open = true;
      var summary = document.createElement("summary");
      pintarTextoConResaltado(summary, TECMIO_FAMILIAS[f] || etiquetaTecMio(f, TECMIO_FAMILIAS));
      det.appendChild(summary);

      var campos = document.createElement("div");
      campos.className = "caso-grupo-campos";
      porFamilia[f].forEach(function (t) {
        campos.appendChild(renderTecnicaMio(t));
      });
      det.appendChild(campos);
      cont.appendChild(det);
    });

    if (tecMioFiltro && !ordenFamilias.length) {
      var vacio = document.createElement("p");
      vacio.className = "tecmio-sin-resultados";
      vacio.textContent = T("tecmio_sin_resultados", { texto: document.getElementById("tecmio-buscar").value || "" });
      cont.appendChild(vacio);
    }
  }

  // Vista "Tabla" (06-09-2026, pedida junto a los apuntes personales;
  // rehecha el 07-09-2026 tras probarla de verdad). Chuleta de un vistazo,
  // pero solo con **parámetros**, no teoría -eso ya está en las Tarjetas-:
  // 3 columnas (Estimulación, Registro, Filtros y barrido fusionados en
  // una sola), sin la columna de Notas que había antes
  // (umbrales_referencia/tecnica_colision_onda_d/
  // mapeo_subcortical_radiacion_optica/notas_clinicas se quedan solo en la
  // tarjeta). "notch" se omite dentro de Filtros -pedido explícito: no se
  // usa nunca, así que no aporta nada verlo en todas las filas-.
  // "estimulacion_y_registro"/"estimulacion_registro" (una sola sección
  // para las técnicas donde ambas van juntas) se reparten en las dos
  // columnas Estimulación y Registro.
  //
  // Una tabla por familia (SEP, MEP, Reflejos...), cada una en su propio
  // <details> plegado por defecto -mismo agrupado que las Tarjetas, mismo
  // criterio "se abre solo si hay búsqueda activa"-, en vez de una tabla
  // única larguísima.
  //
  // Las fuentes ("fuente": [...] en cada sección) ya no se pintan en la
  // celda -"Fuente: Costa 2016, MacDonald 2019..." ocupaba más que el dato
  // en sí-: se sustituyen por superíndices numerados, enlazados a una
  // lista de fuentes única al final de toda la vista Tabla (no una por
  // familia: el mismo texto citado por varias técnicas comparte número).
  var TECMIO_TABLA_ESTIMULACION = [
    { clave: "estimulacion" }, { clave: "estimulacion_y_registro" }, { clave: "estimulacion_registro" }
  ];
  var TECMIO_TABLA_REGISTRO = [
    { clave: "registro" }, { clave: "estimulacion_y_registro" }, { clave: "estimulacion_registro" }
  ];
  var TECMIO_TABLA_FILTROS_BARRIDO = [
    { clave: "filtros", excluir: ["notch"] }, { clave: "barrido" }
  ];

  // Estado de las notas al pie, vigente durante un render de la Tabla: se
  // reinicia al principio de renderTecnicasMioTabla() y lo consultan
  // notaFuentesTabla() (que añade/reutiliza una entrada) y el bloque de
  // fuentes que se pinta al final.
  var tecMioTablaFuentes = [];
  var tecMioTablaFuentesIndice = {};

  function indiceFuenteTabla(texto) {
    if (Object.prototype.hasOwnProperty.call(tecMioTablaFuentesIndice, texto)) {
      return tecMioTablaFuentesIndice[texto];
    }
    tecMioTablaFuentes.push(texto);
    var n = tecMioTablaFuentes.length;
    tecMioTablaFuentesIndice[texto] = n;
    return n;
  }

  // Superíndice con un enlace por cada cita de la lista, para que "Costa
  // 2015, MacDonald 2019 ISION" salga como dos números independientes -no
  // se puede saber si comprobar solo una de las dos sin poder pulsarlas
  // por separado-.
  function notaFuentesTabla(lista) {
    var sup = document.createElement("sup");
    sup.className = "tecmio-nota-fuente";
    lista.forEach(function (texto, i) {
      if (i) sup.appendChild(document.createTextNode(","));
      var a = document.createElement("a");
      a.href = "#tecmio-nota-" + indiceFuenteTabla(texto);
      a.textContent = String(indiceFuenteTabla(texto));
      sup.appendChild(a);
    });
    return sup;
  }

  // Pinta los campos de una sección (sin "fuente" ni las claves excluidas)
  // dentro de una celda, con la nota al pie al final si trae fuente.
  // Devuelve true si pintó algo, para que la celda pueda caer en "—".
  function pintarSeccionTablaTecMio(contenedor, datos, excluir) {
    if (!datos) return false;
    var fuera = (excluir || []).concat(["fuente"]);
    var claves = Object.keys(datos).filter(function (k) { return fuera.indexOf(k) === -1; });
    if (!claves.length) return false;
    var dl = document.createElement("dl");
    dl.className = "tecmio-campos";
    claves.forEach(function (k) {
      var dt = document.createElement("dt");
      pintarTextoConResaltado(dt, etiquetaTecMio(k, TECMIO_CAMPOS) + ":");
      var dd = document.createElement("dd");
      pintarValorTecMio(dd, datos[k]);
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
    contenedor.appendChild(dl);
    if (datos.fuente && datos.fuente.length) {
      contenedor.appendChild(notaFuentesTabla(datos.fuente));
    }
    return true;
  }

  function celdaTablaTecMio(tr, tecnica, seccionesDef) {
    var td = document.createElement("td");
    var presentes = seccionesDef.filter(function (s) { return !!tecnica[s.clave]; });
    var huboAlgo = false;
    presentes.forEach(function (s) {
      if (presentes.length > 1) {
        var h6 = document.createElement("h6");
        h6.className = "tecmio-td-subtitulo";
        pintarTextoConResaltado(h6, etiquetaTecMio(s.clave, TECMIO_SECCIONES));
        td.appendChild(h6);
      }
      if (pintarSeccionTablaTecMio(td, tecnica[s.clave], s.excluir)) huboAlgo = true;
    });
    if (!huboAlgo) td.appendChild(document.createTextNode("—"));
    tr.appendChild(td);
  }

  function tablaFamiliaTecMio(familia, lista) {
    var det = document.createElement("details");
    det.className = "caso-grupo tecmio-familia tecmio-familia-" + familia + " tecmio-tabla-familia";
    if (tecMioFiltro) det.open = true;
    var summary = document.createElement("summary");
    pintarTextoConResaltado(summary, TECMIO_FAMILIAS[familia] || etiquetaTecMio(familia, TECMIO_FAMILIAS));
    det.appendChild(summary);

    var scroll = document.createElement("div");
    scroll.className = "tecmio-tabla-scroll";
    var tabla = document.createElement("table");
    tabla.className = "tecmio-tabla";
    var thead = document.createElement("thead");
    var trCab = document.createElement("tr");
    [T("tecmio_col_tecnica"), T("tecmio_col_estimulacion"), T("tecmio_col_registro"), T("tecmio_col_filtros_barrido")]
      .forEach(function (texto) {
        var th = document.createElement("th");
        th.textContent = texto;
        trCab.appendChild(th);
      });
    thead.appendChild(trCab);
    tabla.appendChild(thead);

    var tbody = document.createElement("tbody");
    lista.forEach(function (t) {
      var tr = document.createElement("tr");
      var tdNombre = document.createElement("td");
      tdNombre.className = "tecmio-td-tecnica";
      if (t.categoria) {
        var badge = document.createElement("span");
        badge.className = "tecmio-badge" + (t.familia ? " tecmio-badge-" + t.familia : "");
        pintarTextoConResaltado(badge, t.categoria);
        tdNombre.appendChild(badge);
        tdNombre.appendChild(document.createElement("br"));
      }
      pintarTextoConResaltado(tdNombre, t.nombre);
      tr.appendChild(tdNombre);
      celdaTablaTecMio(tr, t, TECMIO_TABLA_ESTIMULACION);
      celdaTablaTecMio(tr, t, TECMIO_TABLA_REGISTRO);
      celdaTablaTecMio(tr, t, TECMIO_TABLA_FILTROS_BARRIDO);
      tbody.appendChild(tr);
    });
    tabla.appendChild(tbody);
    scroll.appendChild(tabla);
    det.appendChild(scroll);
    return det;
  }

  function renderTecnicasMioTabla() {
    var datos = window.TECNICAS_MIO || { tecnicas: [] };
    var cont = document.getElementById("tecmio-tabla");
    cont.innerHTML = "";
    tecMioTablaFuentes = [];
    tecMioTablaFuentesIndice = {};

    var porFamilia = {};
    var familiasEncontradas = [];
    (datos.tecnicas || []).forEach(function (t) {
      if (tecMioFiltro && !tecnicaCoincideTecMio(t, tecMioFiltro)) return;
      var f = t.familia || "otras";
      if (!porFamilia[f]) { porFamilia[f] = []; familiasEncontradas.push(f); }
      porFamilia[f].push(t);
    });

    if (!familiasEncontradas.length) {
      var vacio = document.createElement("p");
      vacio.className = "tecmio-sin-resultados";
      vacio.textContent = T("tecmio_sin_resultados", { texto: document.getElementById("tecmio-buscar").value || "" });
      cont.appendChild(vacio);
      return;
    }

    var ordenFamilias = TECMIO_ORDEN_FAMILIAS.filter(function (f) { return porFamilia[f]; });
    familiasEncontradas.forEach(function (f) {
      if (ordenFamilias.indexOf(f) === -1) ordenFamilias.push(f);
    });
    ordenFamilias.forEach(function (f) {
      cont.appendChild(tablaFamiliaTecMio(f, porFamilia[f]));
    });

    // Fuentes al pie, una sola lista para toda la vista Tabla -no una por
    // familia-: el mismo texto citado por dos técnicas de familias
    // distintas comparte número (indiceFuenteTabla lo deduplica por texto).
    if (tecMioTablaFuentes.length) {
      var bloque = document.createElement("div");
      bloque.className = "tecmio-tabla-fuentes";
      var h5 = document.createElement("h5");
      h5.textContent = T("tecmio_fuentes_titulo");
      bloque.appendChild(h5);
      var ol = document.createElement("ol");
      tecMioTablaFuentes.forEach(function (texto, i) {
        var li = document.createElement("li");
        li.id = "tecmio-nota-" + (i + 1);
        pintarTextoConResaltado(li, texto);
        ol.appendChild(li);
      });
      bloque.appendChild(ol);
      cont.appendChild(bloque);
    }
  }

  var tecMioVista = "tarjetas";

  function renderTecnicasMio() {
    var entrada = document.getElementById("tecmio-buscar");
    var filtroCrudo = entrada ? (entrada.value || "").trim() : "";
    tecMioFiltro = normalizarTecMio(filtroCrudo);
    if (tecMioVista === "tabla") renderTecnicasMioTabla();
    else renderTecnicasMioTarjetas();
    tecMioRenderizada = true;
  }

  function elegirVistaTecMio(vista) {
    tecMioVista = vista;
    document.getElementById("tecmio-vista-tarjetas").classList.toggle("activo", vista === "tarjetas");
    document.getElementById("tecmio-vista-tabla").classList.toggle("activo", vista === "tabla");
    document.getElementById("tecmio-contenido").hidden = vista !== "tarjetas";
    document.getElementById("tecmio-tabla").hidden = vista !== "tabla";
    renderTecnicasMio();
  }

  document.getElementById("tecmio-vista-tarjetas").addEventListener("click", function () { elegirVistaTecMio("tarjetas"); });
  document.getElementById("tecmio-vista-tabla").addEventListener("click", function () { elegirVistaTecMio("tabla"); });

  function abrirTecnicasMio() {
    if (!hayTecnicasMio()) return;
    if (!tecMioRenderizada) renderTecnicasMio();
    irAPantalla("tecnicas-mio");
  }

  document.getElementById("tile-tecnicas-mio").addEventListener("click", abrirTecnicasMio);
  pintarTileTecnicasMio();
  document.getElementById("tecmio-buscar").addEventListener("input", renderTecnicasMio);
  document.getElementById("guia-cerrar").addEventListener("click", function () { dlgGuia.close(); });

  function abrirDocente() {
    renderDocente();
    renderCama();
    irAPantalla("docente");
  }

  document.getElementById("tile-docente").addEventListener("click", abrirDocente);

  // Material es pantalla propia desde el 24-09-2026 (antes pestaña de Docencia).
  document.getElementById("tile-material").addEventListener("click", function () {
    renderDocenteMaterial();
    irAPantalla("material");
  });

  /* ================================================================ *
   * Simulador de pantalla (06-09-2026; rehecho el 26-09-2026 con aspecto de
   * pantalla de monitorización y distribución en mosaico)
   *
   * Representa de forma ESQUEMÁTICA la pantalla de monitorización. Nunca se
   * nombra la marca del equipo. Los trazos son garabatos DETERMINISTAS por
   * semilla con forma parecida a la real según la morfología (SEP, AEP, MEP,
   * reflejo, TOF, EMG libre, EEG): no hay señal de verdad.
   *
   * Distribución en MOSAICO: la pantalla es un árbol. Cada nodo es una
   * división horizontal ("h", hijos lado a lado) o vertical ("v", hijos
   * apilados) con su lista de hijos; las hojas son las ventanas. Cada nodo
   * lleva un "peso" (flex-grow): lo que ocupa respecto a sus hermanos. Así
   * cabe cualquier combinación de filas y columnas -una ventana a lo ancho
   * arriba, una columna a la derecha a toda altura, cuadrículas dentro de
   * una columna...-.
   *
   * Al arrastrar una ventana por su cabecera (pointer events: vale con ratón
   * y con el dedo, a diferencia del arrastre nativo de HTML) salen las guías
   * de acople (pedido del usuario, 26-09-2026: "que te deje todas esas
   * opciones"):
   *   - sobre la ventana de debajo, una cruz de 5 destinos: acoplar arriba,
   *     abajo, a la izquierda o a la derecha de ella, o intercambiarlas;
   *   - en los 4 bordes de la pantalla: fila entera arriba/abajo o columna
   *     entera a la izquierda/derecha.
   * Un recuadro de color enseña dónde quedará antes de soltar. Los
   * divisores entre ventanas se arrastran para cambiar el tamaño.
   *
   * Se guarda en localStorage de ESTE dispositivo, no se sincroniza.
   * Parámetros de los ejemplos: los de Técnicas IONM (referencia/tecnicas-mio.json, repo privado)
   * fijados a mano: PESS 40 mA / 4.3-4.7 Hz / 30-300 Hz; PEM 5 pulsos /
   * ISI 2 ms / 0.5 ms; EMG libre 30 Hz-10 kHz; TOF 2 Hz.
   * ================================================================ */
  var SIM_KEY = "mio_ionm_simulador_v1";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var simEstado = { raiz: null };
  var simCargado = false;
  var simVentanaEditando = null;
  var simCanalesEditando = [];
  var simMaximizada = null;   // id de la ventana ampliada (no se guarda)
  var simTicks = {};          // barrida actual de cada ventana; sube al animar
  var simActivas = {};        // ventanas en marcha (▶), por id; no se guarda
  var simSeleccion = "todos"; // a qué afectan ▶ ■ ❚❚: "todos", un id o "grupo:<morfología>"
  var simTimer = null;        // animación (▶)
  var simReloj = null;        // reloj de la barra de estado
  var simCuerpos = [];        // [{v, svg}] para repintar solo los trazos al animar
  var dlgSimVentana = document.getElementById("dlg-sim-ventana");

  function simGid(id) { return document.getElementById(id); }

  function simHoja(v, peso) { return { v: v, peso: peso || 1 }; }
  function simDiv(dir, hijos, peso) { return { dir: dir, hijos: hijos, peso: peso || 1 }; }

  function simCargar() {
    try {
      var g = JSON.parse(localStorage.getItem(SIM_KEY) || "null");
      if (g && g.hasOwnProperty("raiz")) simEstado = g;
      else if (g && (g.columnas || g.filas)) {
        // Formatos viejos (filas, luego columnas de ventanas apiladas): cada
        // columna pasa a ser una división vertical dentro de una horizontal.
        var cols = g.columnas || g.filas.map(function (f) { return { ventanas: f.ventanas || [] }; });
        simEstado = { raiz: simDiv("h", cols.map(function (c) {
          return simDiv("v", (c.ventanas || []).map(function (v) { return simHoja(v); }));
        })) };
        simNormalizar();
      }
    } catch (e) { /* sin persistencia */ }
    simCargado = true;
  }
  function simGuardar() {
    try { localStorage.setItem(SIM_KEY, JSON.stringify(simEstado)); } catch (e) { /* sin persistencia */ }
  }

  function abrirSimulador() {
    if (!simCargado) {
      simCargar();
      // En la demo (B5.F2) se abre con el ejemplo de columna lumbar ya puesto,
      // en vez de una pantalla vacía. Fuera de la demo no cambia nada.
      if (MODO_DEMO && !simEstado.raiz) simCargarEjemplo();
    }
    renderSimulador();
    irAPantalla("simulador");
    simArrancarReloj();
  }

  function simUid() {
    return "sv_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function simVentana(titulo, opts) {
    opts = opts || {};
    return {
      id: simUid(),
      titulo: titulo || T("sim_ventana_nueva"),
      morfologia: opts.morfologia || "generico",
      vista: opts.vista || "avg",
      canales: opts.canales ? opts.canales.slice() : [],
      params: opts.params ? clonar(opts.params) : {},
      filtros: opts.filtros ? clonar(opts.filtros) : {},
      minimizada: !!opts.minimizada
    };
  }

  /* --- Árbol --- */
  // Hojas en orden de lectura (izquierda a derecha, arriba a abajo): da el
  // número de cada ventana en su cabecera.
  function simHojas() {
    var out = [];
    (function rec(n) {
      if (!n) return;
      if (n.v) { out.push(n); return; }
      n.hijos.forEach(rec);
    })(simEstado.raiz);
    return out;
  }

  function simBuscar(id) {
    var res = null;
    (function rec(n, padre, idx) {
      if (!n || res) return;
      if (n.v) { if (n.v.id === id) res = { hoja: n, padre: padre, idx: idx }; return; }
      n.hijos.forEach(function (h, i) { rec(h, n, i); });
    })(simEstado.raiz, null, -1);
    return res;
  }

  // Quita divisiones vacías, sube la única hija de una división a su sitio
  // y funde en su madre una división con la misma dirección, repartiendo
  // pesos para que nada cambie de tamaño en pantalla.
  function simNormalizar() {
    function norm(n) {
      if (!n) return null;
      if (n.v) return n;
      var hijos = n.hijos.map(norm).filter(Boolean), out = [];
      hijos.forEach(function (h) {
        if (h.dir && h.dir === n.dir) {
          var tot = 0;
          h.hijos.forEach(function (x) { tot += x.peso || 1; });
          h.hijos.forEach(function (x) { x.peso = (x.peso || 1) / tot * (h.peso || 1); out.push(x); });
        } else out.push(h);
      });
      n.hijos = out;
      if (!out.length) return null;
      if (out.length === 1) { out[0].peso = n.peso || 1; return out[0]; }
      return n;
    }
    simEstado.raiz = norm(simEstado.raiz);
  }

  function simQuitarHoja(id) {
    var loc = simBuscar(id);
    if (!loc) return null;
    if (!loc.padre) simEstado.raiz = null;
    else loc.padre.hijos.splice(loc.idx, 1);
    simNormalizar();
    return loc.hoja;
  }

  // Coloca una hoja (ya fuera del árbol) junto a la ventana destinoId, en el
  // lado pedido; con destinoId null, en ese borde de la pantalla entera.
  function simColocar(hoja, destinoId, lado) {
    var dir = (lado === "izq" || lado === "der") ? "h" : "v";
    var antes = (lado === "izq" || lado === "arriba");
    var raiz = simEstado.raiz;
    if (!raiz) { hoja.peso = 1; simEstado.raiz = hoja; return; }
    if (destinoId === null) {
      if (raiz.dir === dir) {
        // Mismo eje: una hermana más, con la parte media que ya tienen.
        var tot = 0;
        raiz.hijos.forEach(function (x) { tot += x.peso || 1; });
        hoja.peso = tot / raiz.hijos.length;
        if (antes) raiz.hijos.unshift(hoja); else raiz.hijos.push(hoja);
      } else {
        // Fila o columna a todo lo largo: algo más estrecha que el resto.
        raiz.peso = 1;
        hoja.peso = 0.4;
        simEstado.raiz = simDiv(dir, antes ? [hoja, raiz] : [raiz, hoja]);
      }
      return;
    }
    var loc = simBuscar(destinoId);
    if (!loc) { simColocar(hoja, null, "der"); return; }
    if (loc.padre && loc.padre.dir === dir) {
      // Parte el sitio de la ventana destino entre las dos.
      loc.hoja.peso = (loc.hoja.peso || 1) / 2;
      hoja.peso = loc.hoja.peso;
      loc.padre.hijos.splice(loc.idx + (antes ? 0 : 1), 0, hoja);
    } else {
      var peso = loc.hoja.peso || 1;
      loc.hoja.peso = 1;
      hoja.peso = 1;
      var nueva = simDiv(dir, antes ? [hoja, loc.hoja] : [loc.hoja, hoja], peso);
      if (loc.padre) loc.padre.hijos[loc.idx] = nueva;
      else simEstado.raiz = nueva;
    }
  }

  function simMover(id, destinoId, lado) {
    if (destinoId === id) return;
    if (lado === "centro") {
      var a = simBuscar(id), b = simBuscar(destinoId);
      if (!a || !b) return;
      var tmp = a.hoja.v; a.hoja.v = b.hoja.v; b.hoja.v = tmp;
    } else {
      var hoja = simQuitarHoja(id);
      if (!hoja) return;
      simColocar(hoja, destinoId, lado);
      simNormalizar();
    }
    simGuardar();
    renderSimulador();
  }

  // Ventana nueva: columna nueva a la derecha.
  function simAnadirVentana(v) {
    simColocar(simHoja(v), null, "der");
    simNormalizar();
  }

  function simQuitarVentana(id) {
    simQuitarHoja(id);
    if (simMaximizada === id) simMaximizada = null;
    simGuardar();
    renderSimulador();
  }

  function simVisible(n) {
    if (n.v) return !n.v.minimizada;
    for (var i = 0; i < n.hijos.length; i++) if (simVisible(n.hijos[i])) return true;
    return false;
  }

  /* --- Trazos deterministas por semilla --- */
  function simSemilla(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h >>> 0;
  }
  function simRand(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* --- Formas de onda con latencias y amplitudes reales (26-09-2026) ---
   * Cada trazo se construye en MILISEGUNDOS y MICROVOLTIOS reales: el eje
   * horizontal va de 0 al barrido de la ventana y el vertical usa la
   * sensibilidad (µV/Div), así que al cambiar barrido o sensibilidad cada
   * onda queda donde toca (una N20 a 20 ms sale a la mitad de un barrido de
   * 40 ms y a una quinta parte de uno de 100 ms).
   *
   * Valores ORIENTATIVOS de adulto, para docencia: varían con la talla, la
   * temperatura, la anestesia y el montaje. Donde Técnicas IONM tiene ficha
   * con fuente se toman de ahí: TCR ~16 ms (Lima Medeiros 2024), TVcR R1 ~29
   * y R2 ~65 ms (Urriza 2025), LAR ~22 ms y ~310 µV, THR ~42 ms, reflejo H
   * del masetero M 2,6 / H 5,4 ms, H-reflejo del sóleo <35 ms. El resto son
   * los valores normativos clásicos: PESS de mediano N9 (Erb) ~9,5 ms, N13
   * (cervical) ~13 ms, N20/P25 (cortical) ~19,5/25 ms; de tibial N8
   * (poplíteo), N22 (lumbar), N30 (cervical) y P37/N45 (cortical); PEATC
   * ondas I-V a ~1,7 / 2,8 / 3,9 / 5,1 / 5,8 ms; MEP con la latencia de
   * inicio de cada músculo (más lejos de la corteza, más tarde).
   *
   * Convención: negativo hacia arriba, como en la pantalla de los equipos.
   * --- */

  // Nervio estimulado de un SEP, por el título de la ventana.
  function simNervioSEP(v) {
    var t = (v.titulo || "").toUpperCase();
    if (/TIB|PTN|MMII|MIEMBROS INF|PIERNA|POPL/.test(t)) return "tibial";
    if (/CUB|ULN/.test(t)) return "cubital";
    return "mediano";
  }

  // Componentes de un SEP en un canal: [latencia ms, amplitud µV, anchura ms].
  function simComponentesSEP(v, canal) {
    var c = (canal || "").toUpperCase();
    var nervio = simNervioSEP(v);
    if (nervio === "tibial") {
      if (/POP|PF\b/.test(c)) return [[8.5, -2, 0.7, "N8"]];                       // N8 poplíteo
      if (/LP\b|T12|T10|L1\b|LUMB/.test(c)) return [[22, -1, 1.3, "N22"]];           // N22 lumbar
      if (/CV|C2S|C5S|C7|CERV|\bC2\b|\bC5\b/.test(c)) return [[29, -0.8, 1.4, "N30"]]; // N30 cervical
      return [[37.5, 2, 1.8, "P37"], [46, -1.6, 2.6, "N45"]];                                // P37 / N45 cortical
    }
    var d = nervio === "cubital" ? 0.6 : 0;
    if (/ERB|EPI|EPC/.test(c)) return [[9.5 + d, -3, 0.6, "N9"]];                   // N9 Erb
    if (/CV|C2S|C5S|C7|CERV|\bC2\b|\bC5\b/.test(c)) return [[13 + d, -1.5, 0.9, "N13"]]; // N13 cervical
    return [[19.5 + d, -2, 1, "N20"], [25 + d, 2.2, 1.8, "P25"]];                            // N20 / P25 cortical
  }

  // Latencia de inicio (ms), amplitud (µV) y duración (ms) del MEP según el
  // músculo del canal. Más lejos de la corteza, más tarde.
  var SIM_MEP_MUSCULOS = [
    [/MASS|MASET/, 7, 400, 10],
    [/OOC|OCUL|\bOC\b|ORIS|OOR|MENT|MNT|NAS|FRONT|FACIAL/, 12, 200, 10],
    [/LEN|TONG|GENIO/, 10, 300, 10],
    [/TRAP|STCM|SCM/, 10, 300, 12],
    [/VOC|CRICO|VOCAL|LARIN/, 14, 150, 10],
    [/PALAD/, 11, 150, 10],
    [/DELT/, 11, 500, 12],
    [/BIC/, 13, 500, 12],
    [/TRI/, 14, 500, 12],
    [/EXT|ECR|EDC|FLEX|FCR|FDS|ANTEBR/, 16, 600, 12],
    [/APB|ADM|FDI|THENAR|HIPOT|HAND|MANO/, 20, 900, 12],
    [/ABD|RECT|INTERC|OAE|OBLIC/, 15, 300, 12],
    [/\bQ\b|VM|VL|QUAD|RF\b|ADD/, 23, 400, 15],
    [/TA\b|TIB/, 29, 500, 15],
    [/PL\b|PER/, 30, 400, 15],
    [/GAST|GAS\b|SOL|\bG\b/, 31, 400, 15],
    [/EHL/, 35, 300, 15],
    [/AH|HALL|ABH|FDB|PIE/, 40, 400, 15],
    [/ESF|EAS|ANAL|BULBO|BCR/, 32, 150, 12]
  ];
  function simDatosMEP(canal) {
    var c = (canal || "").toUpperCase().replace(/^[LR]\s*\.\s*/, "");
    for (var i = 0; i < SIM_MEP_MUSCULOS.length; i++) {
      if (SIM_MEP_MUSCULOS[i][0].test(c)) return SIM_MEP_MUSCULOS[i].slice(1);
    }
    return [20, 400, 12];
  }

  // Reflejos por el título de la ventana: [inicio ms, duración ms, amplitud µV,
  // probabilidad de aparecer] para cada respuesta.
  function simDatosReflejo(v) {
    var t = (v.titulo || "").toUpperCase();
    if (/TVCR/.test(t)) return [[29, 12, 150, 1], [65, 18, 80, 0.51]];          // Urriza 2025
    if (/TCR/.test(t)) return [[16, 12, 150, 1], [50, 15, 60, 0.1]];            // Lima Medeiros 2024
    if (/LAR/.test(t)) return [[22.4, 10, 313, 1]];                             // cR1
    if (/THR/.test(t)) return [[42.5, 12, 78, 1]];
    if (/RBC|BULBO|BCR/.test(t)) return [[35, 15, 60, 1]];
    return [[10.5, 8, 200, 1], [32, 30, 80, 0.5]];                              // blink: R1, R2 (a menudo ausente con anestesia)
  }

  // H-reflejo por el músculo del canal (o el título): [latencia M, latencia H] ms.
  function simDatosHreflex(v, canal) {
    var c = ((canal || "") + " " + (v.titulo || "")).toUpperCase();
    if (/MASS|MASET|JAW/.test(c)) return [2.6, 5.4];
    if (/FCR/.test(c)) return [4, 16];
    if (/\bQ\b|VM|VL|QUAD|CU[AÁ]D/.test(c)) return [5, 18];
    return [6, 30];                                                             // sóleo / gastrocnemio
  }

  function simGauss(t, t0, w) { var d = (t - t0) / w; return Math.exp(-0.5 * d * d); }
  // Ráfaga polifásica con envolvente en campana (MEP, reflejos).
  function simRafaga(t, t0, dur, a, fases) {
    if (t < t0 || t > t0 + dur) return 0;
    var p = (t - t0) / dur;
    return a * Math.sin(p * Math.PI) * Math.sin(p * Math.PI * fases);
  }

  // Valor en µV de la señal en el instante t (ms) de una barrida.
  function simModeloSenal(v, canal, rand, mod) {
    var m = v.morfologia || "generico", i;
    // Cambios del caso de Repaso en curso (ver simModificador()); sin caso, nada.
    mod = mod || { amp: 1, lat: 1, latMs: 0, ruido: 0, red: 0, fade: 1 };
    var varA = 0.85 + rand() * 0.3, varT = (rand() - 0.5) * 0.4;
    if (m === "sep") {
      var comp = simComponentesSEP(v, canal);
      return { ruido: 0.3, f: function (t) {
        var y = 0;
        for (i = 0; i < comp.length; i++) y += comp[i][1] * varA * mod.amp * simGauss(t, comp[i][0] * mod.lat + varT, comp[i][2]);
        return y;
      } };
    }
    if (m === "aep") {
      var ondas = [[1.7, -0.25], [2.8, -0.15], [3.9, -0.3], [5.1, -0.25], [5.8, -0.45], [6.8, 0.35]];
      return { ruido: 0.06, f: function (t) {
        var y = 0;
        // Los cambios del caso tocan de la onda III en adelante (la I se conserva).
        for (i = 0; i < ondas.length; i++) {
          var cambia = i >= 2;
          y += ondas[i][1] * varA * (cambia ? mod.amp : 1) *
               simGauss(t, ondas[i][0] + varT * 0.3 + (cambia ? mod.latMs * (i >= 4 ? 1 : 0.6) : 0), 0.22);
        }
        return y;
      } };
    }
    if (m === "mep") {
      var dm = simDatosMEP(canal), ini = dm[0] * mod.lat + (rand() - 0.5) * 2, amp = dm[1] * mod.amp * (0.6 + rand() * 0.8), fases = 5 + Math.floor(rand() * 5);
      return { ruido: 6, artefacto: true, f: function (t) { return -simRafaga(t, ini, dm[2], amp, fases); } };
    }
    if (m === "reflejo") {
      var resp = simDatosReflejo(v).filter(function (r) { return rand() < r[3]; }).map(function (r) {
        return [r[0] * mod.lat + (rand() - 0.5) * 2, r[1], r[2] * mod.amp * (0.6 + rand() * 0.8), 4 + Math.floor(rand() * 6)];
      });
      return { ruido: 5, artefacto: true, f: function (t) {
        var y = 0;
        for (i = 0; i < resp.length; i++) y -= simRafaga(t, resp[i][0], resp[i][1], resp[i][2], resp[i][3]);
        return y;
      } };
    }
    if (m === "hreflex") {
      var mh = simDatosHreflex(v, canal), aM = 500 * varA, aH = 2000 * mod.amp * (0.7 + rand() * 0.6), w = mh[0] < 3 ? 0.5 : 1.8;
      return { ruido: 15, artefacto: true, f: function (t) {
        return -aM * simGauss(t, mh[0], w) + aM * 0.6 * simGauss(t, mh[0] + w * 2, w * 1.3) -
               aH * simGauss(t, mh[1], w * 1.2) + aH * 0.6 * simGauss(t, mh[1] + w * 2.4, w * 1.6);
      } };
    }
    if (m === "tof") {
      // Cuatro respuestas a la frecuencia del tren (2 Hz por defecto: una cada
      // 500 ms), con el desvanecimiento T4/T1 variable.
      var fr = parseFloat(((v.params && v.params.frecuencia) || "2").replace(",", ".")) || 2;
      var inter = 1000 / fr, fade = (0.85 + rand() * 0.15) * mod.fade, aT = 5000 * varA * mod.amp;
      return { ruido: 20, f: function (t) {
        var y = 0;
        for (i = 0; i < 4; i++) {
          var t0 = 30 + i * inter, a = aT * (1 - (1 - fade) * i / 3);
          y += -a * simGauss(t, t0 + 4, 1.6) + a * 0.7 * simGauss(t, t0 + 9, 2.4);
        }
        return y;
      } };
    }
    if (m === "emg") {
      // EMG libre: línea de base de pocos µV y, a veces, una racha de
      // descargas (trenes neurotónicos) de 50-250 µV.
      var hay = rand() > 0.5, tR = rand(), durR = 150 + rand() * 300, aR = 50 + rand() * 200;
      return { ruido: 4, rafagaEMG: hay ? { t: tR, dur: durR, a: aR } : null, f: function () { return 0; } };
    }
    if (m === "eeg") {
      var ph1 = rand() * 6.28, ph2 = rand() * 6.28, ph3 = rand() * 6.28;
      return { ruido: 4, f: function (t) {
        var s = t / 1000;
        return 20 * Math.sin(6.283 * 10 * s + ph1) + 30 * Math.sin(6.283 * 2 * s + ph2) + 6 * Math.sin(6.283 * 21 * s + ph3);
      } };
    }
    var pG = null;
    return { ruido: 3, f: function (t, barr) {
      if (pG === null) pG = [barr * (0.3 + rand() * 0.3), rand() > 0.5 ? -1 : 1];
      return pG[1] * 100 * simGauss(t, pG[0], barr * 0.03);
    } };
  }

  // Puntos de una barrida. o = { x0, ancho, y0, alto, div, sensUv, barr,
  // ymin, ymax }: se dibuja en [x0, x0+ancho] con la línea base en el centro
  // de la banda [y0, y0+alto]; "div" son las unidades del SVG por división
  // vertical, así que un valor de sensUv µV sube una división.
  function simOnda(v, canal, seed, o) {
    var rand = simRand(seed), modelo = simModeloSenal(v, canal, rand, o.mod);
    var ruidoExtra = o.mod ? o.mod.ruido : 0, red = o.mod ? o.mod.red : 0;
    var m = v.morfologia || "generico";
    var n = (m === "tof" || m === "emg" || m === "eeg") ? 1400 : 420;
    var mid = o.y0 + o.alto / 2, pts = [], i;
    var rE = modelo.rafagaEMG, tR0 = rE ? rE.t * o.barr : 0;
    // En los evocados el ruido se suaviza (un promediado real es una línea
    // limpia, no una franja); en las trazas continuas va en bruto.
    var suave = n < 1000, ru = 0;
    for (i = 0; i <= n; i++) {
      var t = i / n * o.barr;
      var r = (rand() - 0.5) * 2 * (modelo.ruido + ruidoExtra);
      ru = suave ? ru * 0.75 + r * 0.5 : r;
      var uv = modelo.f(t, o.barr) + ru + (red ? red * Math.sin(6.2832 * 50 * t / 1000) : 0);
      if (modelo.artefacto && t < 2) uv += o.sensUv * 1.5 * Math.sin(t * 7) * (1 - t / 2);
      if (rE && t > tR0 && t < tR0 + rE.dur) uv += (rand() - 0.5) * 2 * rE.a;
      var y = mid + uv / o.sensUv * o.div;
      if (y < o.ymin) y = o.ymin; if (y > o.ymax) y = o.ymax;
      pts.push((o.x0 + i / n * o.ancho).toFixed(1) + "," + y.toFixed(1));
    }
    return pts.join(" ");
  }

  // Izquierda en rojo y derecha en azul, como en la pantalla real; la línea
  // media en gris oscuro.
  function simColorCanal(v, canal) {
    var base = ((canal || "").trim() || (v.titulo || "").trim()).toUpperCase();
    if (base.charAt(0) === "L") return "#d0312d";
    if (base.charAt(0) === "R") return "#1f4fb4";
    return "#3b4a52";
  }

  function simSvg(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function simPolilinea(puntos, color, ancho, opacidad) {
    return simSvg("polyline", { points: puntos, fill: "none", stroke: color, "stroke-width": ancho,
      opacity: opacidad, "vector-effect": "non-scaling-stroke" });
  }

  // Cómo se pinta cada morfología: etiqueta de la cabecera, sensibilidad y
  // barrido por defecto (el usuario puede fijarlos en Filtros y barrido) y si
  // es una traza continua (RAW) en vez de una respuesta disparada.
  var SIM_MORF = {
    sep:      { tag: "SEP", sens: "2 µV/Div",   barrido: 50 },
    aep:      { tag: "AEP", sens: "0.5 µV/Div", barrido: 15 },
    mep:      { tag: "MEP", sens: "500 µV/Div", barrido: 100 },
    reflejo:  { tag: "RFX", sens: "200 µV/Div", barrido: 50 },
    hreflex:  { tag: "H",   sens: "2 mV/Div",   barrido: 100 },
    tof:      { tag: "TOF", sens: "5 mV/Div",   barrido: 2000, continuo: true },
    emg:      { tag: "EMG", sens: "100 µV/Div", barrido: 4000, continuo: true },
    eeg:      { tag: "EEG", sens: "50 µV/Div",  barrido: 10000, continuo: true },
    generico: { tag: "",    sens: "100 µV/Div", barrido: 100 }
  };
  function simMorf(v) { return SIM_MORF[v.morfologia] || SIM_MORF.generico; }

  // Escalas de las teclas de la ventana (26-09-2026): sensibilidad a la
  // izquierda (+ / −) y barrido abajo (◀ / ▶), con los pasos habituales de
  // los equipos. La sensibilidad se guarda como texto ("3 µV/Div", "5 mV/Div")
  // en filtros.sens, el mismo campo del diálogo; el barrido en ms en
  // filtros.barrido.
  var SIM_SENS = [0.1, 0.2, 0.3, 0.5, 1, 2, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000, 20000];
  var SIM_BARR = [5, 10, 20, 30, 50, 100, 150, 200, 300, 500, 1000, 2000, 4000, 5000, 10000, 20000];
  function simSensUv(txt) {
    var mm = /([\d.,]+)\s*(m|µ|u)?V/i.exec(txt || "");
    if (!mm) return null;
    var val = parseFloat(mm[1].replace(",", "."));
    if (!(val > 0)) return null;
    return (mm[2] && mm[2].toLowerCase() === "m") ? val * 1000 : val;
  }
  function simSensTexto(uv) {
    return uv >= 1000 ? (uv / 1000) + " mV/Div" : uv + " µV/Div";
  }
  function simSensActual(v) {
    return simSensUv(v.filtros && v.filtros.sens) || simSensUv(simMorf(v).sens) || 100;
  }
  function simBarrActual(v) {
    return parseFloat(((v.filtros && v.filtros.barrido) || "").replace(",", ".")) || simBarrDefecto(v);
  }
  // Barrido por defecto según lo que haya que ver: 50 ms para un SEP de
  // miembro superior (N20 ~20 ms), 100 ms para el tibial (P37 ~37 ms), 100 ms
  // para TVcR (R2 ~65 ms), 20 ms para el reflejo maseterino...
  function simBarrDefecto(v) {
    var mf = v.morfologia || "generico", t = (v.titulo || "").toUpperCase();
    if (mf === "sep") return simNervioSEP(v) === "tibial" ? 100 : 50;
    if (mf === "reflejo") return /TVCR|THR|RBC|BULBO/.test(t) ? 100 : 50;
    if (mf === "hreflex") return simDatosHreflex(v, (v.canales || [])[0])[1] < 10 ? 20 : 100;
    return simMorf(v).barrido;
  }
  // Paso siguiente/anterior de una escala partiendo del valor más cercano.
  function simPasoEscala(escala, actual, dir) {
    var mejor = 0;
    escala.forEach(function (x, i) { if (Math.abs(Math.log(x / actual)) < Math.abs(Math.log(escala[mejor] / actual))) mejor = i; });
    var i2 = Math.max(0, Math.min(escala.length - 1, mejor + dir));
    return escala[i2];
  }
  function simCambiarSens(v, dir) {
    v.filtros = v.filtros || {};
    v.filtros.sens = simSensTexto(simPasoEscala(SIM_SENS, simSensActual(v), dir));
    simGuardar();
    renderSimulador();
  }
  function simCambiarBarr(v, dir) {
    v.filtros = v.filtros || {};
    v.filtros.barrido = String(simPasoEscala(SIM_BARR, simBarrActual(v), dir));
    simGuardar();
    renderSimulador();
  }

  // Pinta rejilla y trazos de una ventana en su SVG. Se vuelve a llamar en
  // cada barrida al animar (▶), sin rehacer el resto de la ventana.
  function simDibujarTrazos(v, svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var simTick = simTicks[v.id] || 0;
    var W = 400, nC = Math.max(v.canales.length, 1), banda = 100, H = banda * nC, i, k;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var m = simMorf(v);
    var sensUv = simSensActual(v), barr = simBarrActual(v);
    var horiz = !m.continuo && v.vista === "cascada" && v.cascada === "h";
    for (i = 1; i < 10; i++) svg.appendChild(simSvg("line", { x1: i * W / 10, y1: 0, x2: i * W / 10, y2: H, "class": "sim-rejilla", "vector-effect": "non-scaling-stroke" }));
    for (i = 1; i < nC * 2; i++) svg.appendChild(simSvg("line", { x1: 0, y1: i * banda / 2, x2: W, y2: i * banda / 2, "class": "sim-rejilla", "vector-effect": "non-scaling-stroke" }));
    var nH = 5, segW = W / nH;
    if (horiz) {
      for (k = 1; k < nH; k++) svg.appendChild(simSvg("line", { x1: k * segW, y1: 0, x2: k * segW, y2: H, "class": "sim-separador", "vector-effect": "non-scaling-stroke" }));
    }
    v.canales.forEach(function (canal, c) {
      var y0 = c * banda, color = simColorCanal(v, canal), s = canal + v.id;
      // tickB: barrida a la que pertenece el trazo (para los cambios del
      // caso de Repaso); sin él, la basal.
      function onda(semilla, x0, ancho, yb, altoB, div, tickB) {
        return simOnda(v, canal, simSemilla(semilla), { x0: x0, ancho: ancho, y0: yb, alto: altoB, div: div || banda / 2,
          sensUv: sensUv, barr: barr, ymin: 0, ymax: H, mod: tickB === undefined ? null : simModificador(v, canal, tickB) });
      }
      if (m.continuo) {
        svg.appendChild(simPolilinea(onda(s + simTick, 0, W, y0 + banda * 0.1, banda * 0.8, null, simTick), color, "1.2", 1));
      } else if (horiz) {
        // Cascada horizontal: barridas una al lado de otra, la más reciente
        // a la derecha y en color, las anteriores en gris.
        for (k = 0; k < nH; k++) {
          var edad = nH - 1 - k;
          svg.appendChild(simPolilinea(onda(s + (simTick - edad), k * segW, segW, y0 + banda * 0.1, banda * 0.8, null, simTick - edad),
            edad === 0 ? color : "#8a949a", edad === 0 ? "1.4" : "1", edad === 0 ? 1 : 0.85));
        }
      } else if (v.vista === "cascada") {
        // Cascada vertical: la barrida más reciente arriba y en color, las
        // anteriores debajo en gris, un poco desplazadas cada una.
        var nS = 8, sub = banda * 0.42, pasoY = (banda - sub) / nS;
        for (k = nS - 1; k >= 0; k--) {
          svg.appendChild(simPolilinea(onda(s + (simTick - k), 0, W, y0 + k * pasoY, sub, sub / 2, simTick - k),
            k === 0 ? color : "#8a949a", k === 0 ? "1.4" : "0.8", k === 0 ? 1 : 0.75));
        }
      } else {
        // Promediado: la referencia (basal) en gris y la actual en color.
        svg.appendChild(simPolilinea(onda(s + "ref", 0, W, y0 + banda * 0.1, banda * 0.8), "#9aa3a8", "1", 0.9));
        svg.appendChild(simPolilinea(onda(s + simTick, 0, W, y0 + banda * 0.1, banda * 0.8, null, simTick), color, "1.3", 1));
      }
    });
    // Cursor rojo de barrido en las trazas continuas, como en el EMG libre.
    if (m.continuo) {
      var x = ((simTick % 10) + 0.5) * W / 10;
      svg.appendChild(simSvg("line", { x1: x, y1: 0, x2: x, y2: H, stroke: "#e02020", "stroke-width": "1.2", "vector-effect": "non-scaling-stroke" }));
    }
  }

  function simTextoParams(v) {
    var p = v.params || {}, f = v.filtros || {}, partes = [];
    if (p.intensidad) partes.push(p.intensidad + " mA");
    if (p.frecuencia) partes.push(p.frecuencia + " Hz");
    if (p.pulsos) partes.push(p.pulsos + " p");
    if (p.trenes) partes.push(p.trenes + " tr");
    if (p.isi) partes.push("ISI " + p.isi + " ms");
    if (p.duracion) partes.push(p.duracion + " µs");
    if (f.lff || f.hff) partes.push((f.lff || "–") + "–" + (f.hff || "–") + " Hz");
    if (f.notch) partes.push("notch " + f.notch);
    return partes.join(" · ");
  }

  function simBoton(txt, titulo, fn) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "sim-icono"; b.textContent = txt; b.title = titulo;
    b.addEventListener("click", function (e) { e.stopPropagation(); fn(); });
    // Que pulsar un botón no empiece a arrastrar la ventana.
    b.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    return b;
  }

  function renderSimVentana(v, num) {
    var m = simMorf(v);
    var card = document.createElement("div");
    card.className = "sim-ventana";
    card.dataset.id = v.id;
    // Pulsar dentro de la ventana la elige: ▶ ■ ❚❚ pasan a mandar solo sobre ella.
    card.addEventListener("click", function () { simSeleccionar(v.id); });

    var cab = document.createElement("div");
    // Cabecera verde en las que promedian o van en continuo, gris pizarra en
    // las disparadas en cascada (como en la pantalla real).
    cab.className = "sim-ventana-cab" + ((m.continuo || v.vista !== "cascada") ? " activa" : "");
    cab.title = T("sim_arrastrar_tit");
    var nEl = document.createElement("span");
    nEl.className = "sim-num"; nEl.textContent = num;
    cab.appendChild(nEl);
    if (m.tag) {
      var tag = document.createElement("span");
      tag.className = "sim-badge sim-badge-" + v.morfologia; tag.textContent = m.tag;
      cab.appendChild(tag);
    }
    var tit = document.createElement("span");
    tit.className = "sim-ventana-titulo"; tit.textContent = v.titulo;
    cab.appendChild(tit);
    var acc = document.createElement("span");
    acc.className = "sim-ventana-acc";
    if (!m.continuo && v.vista === "cascada") {
      var enH = v.cascada === "h";
      acc.appendChild(simBoton(enH ? "⇅" : "⇆", T(enH ? "sim_cascada_v_tit" : "sim_cascada_h_tit"), function () {
        v.cascada = enH ? "v" : "h"; simGuardar(); renderSimulador();
      }));
    }
    acc.appendChild(simBoton("⚙", T("sim_ajustes_tit"), function () { simAbrirDialogo(v.id); }));
    acc.appendChild(simBoton("–", T("sim_minimizar_tit"), function () {
      v.minimizada = true; if (simMaximizada === v.id) simMaximizada = null; simGuardar(); renderSimulador();
    }));
    acc.appendChild(simBoton(simMaximizada === v.id ? "❐" : "□", T(simMaximizada === v.id ? "sim_restaurar_tit" : "sim_maximizar_tit"), function () {
      simMaximizada = simMaximizada === v.id ? null : v.id; renderSimulador();
    }));
    acc.appendChild(simBoton("✕", T("sim_cerrar_tit"), function () { simQuitarVentana(v.id); }));
    cab.appendChild(acc);
    cab.addEventListener("pointerdown", function (e) { simEmpezarArrastre(e, v, card); });
    card.appendChild(cab);

    var cuerpo = document.createElement("div");
    cuerpo.className = "sim-ventana-cuerpo";
    // Teclas de sensibilidad a la izquierda: + más ganancia (menos µV/Div),
    // − menos ganancia; el valor, en vertical entre las dos.
    var colSens = document.createElement("div");
    colSens.className = "sim-sens";
    colSens.appendChild(simTecla("+", T("sim_sens_mas_tit"), function () { simCambiarSens(v, -1); }));
    var yl = document.createElement("div");
    yl.className = "sim-ylabel"; yl.textContent = simSensTexto(simSensActual(v));
    colSens.appendChild(yl);
    colSens.appendChild(simTecla("−", T("sim_sens_menos_tit"), function () { simCambiarSens(v, 1); }));
    cuerpo.appendChild(colSens);
    var der = document.createElement("div");
    der.className = "sim-derecha";
    var plot = document.createElement("div");
    plot.className = "sim-plot";
    if (!v.canales.length) {
      var sc = document.createElement("p");
      sc.className = "sim-sin-canales"; sc.textContent = T("sim_sin_canales");
      plot.appendChild(sc);
    } else {
      var svg = simSvg("svg", { "class": "sim-svg", preserveAspectRatio: "none" });
      simDibujarTrazos(v, svg);
      plot.appendChild(svg);
      var registro = { v: v, svg: svg, etiqs: [] };
      simCuerpos.push(registro);
      v.canales.forEach(function (canal, c) {
        var et = document.createElement("span");
        et.className = "sim-etiq";
        et.style.top = ((c + 0.5) / v.canales.length * 100) + "%";
        var txt = document.createElement("span");
        txt.textContent = canal;
        var pto = document.createElement("span");
        pto.className = "sim-etiq-punto";
        pto.style.background = simColorCanal(v, canal);
        et.appendChild(txt); et.appendChild(pto);
        var med = document.createElement("span");
        med.className = "sim-etiq-med";
        med.hidden = true;
        et.appendChild(med);
        registro.etiqs.push({ canal: canal, med: med });
        plot.appendChild(et);
      });
      simActualizarMediciones(registro);
    }
    var tp = simTextoParams(v);
    if (tp) {
      var pr = document.createElement("span");
      pr.className = "sim-params"; pr.textContent = tp;
      plot.appendChild(pr);
    }
    var modo = document.createElement("span");
    modo.className = "sim-modo";
    modo.textContent = m.continuo ? "RAW" : (v.vista === "cascada" ? "CAS" : "AVG");
    plot.appendChild(modo);
    der.appendChild(plot);
    // Barrido abajo: ◀ más corto, marcas de tiempo, ▶ más largo.
    var barr = simBarrActual(v);
    var filaB = document.createElement("div");
    filaB.className = "sim-barr";
    filaB.appendChild(simTecla("◀", T("sim_barr_menos_tit"), function () { simCambiarBarr(v, -1); }));
    var ejes = document.createElement("div");
    ejes.className = "sim-xejes";
    if (m.continuo || (v.vista === "cascada" && v.cascada === "h")) {
      var div = document.createElement("span");
      div.className = "sim-xdiv";
      div.textContent = m.continuo ? (barr / 10) + " ms / Div" : "5 × " + barr + " ms";
      ejes.appendChild(div);
    } else {
      for (var i = 1; i <= 5; i++) {
        var mk = document.createElement("span");
        mk.textContent = Math.round(barr * i / 5 * 10) / 10;
        ejes.appendChild(mk);
      }
    }
    filaB.appendChild(ejes);
    filaB.appendChild(simTecla("▶", T("sim_barr_mas_tit"), function () { simCambiarBarr(v, 1); }));
    der.appendChild(filaB);
    cuerpo.appendChild(der);
    card.appendChild(cuerpo);
    return card;
  }

  // Tecla pequeña de la ventana (sensibilidad y barrido).
  function simTecla(txt, titulo, fn) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "sim-tecla"; b.textContent = txt; b.title = titulo;
    b.addEventListener("click", function (e) { e.stopPropagation(); fn(); });
    return b;
  }

  /* --- Divisores: arrastrar para repartir el tamaño entre dos vecinas --- */
  function simDivisor(dir, nA, nB, elA, elB) {
    var d = document.createElement("div");
    d.className = "sim-divisor sim-divisor-" + dir;
    d.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var h = dir === "h";
      var ra = elA.getBoundingClientRect(), rb = elB.getBoundingClientRect();
      var pa = h ? ra.width : ra.height, pb = h ? rb.width : rb.height;
      var ini = h ? e.clientX : e.clientY;
      var tot = (nA.peso || 1) + (nB.peso || 1);
      d.classList.add("activo");
      try { d.setPointerCapture(e.pointerId); } catch (er) { /* sin captura */ }
      function mover(ev) {
        var delta = (h ? ev.clientX : ev.clientY) - ini;
        var na = Math.max(30, Math.min(pa + pb - 30, pa + delta));
        nA.peso = tot * na / (pa + pb);
        nB.peso = tot - nA.peso;
        elA.style.flexGrow = nA.peso;
        elB.style.flexGrow = nB.peso;
      }
      function soltar() {
        d.classList.remove("activo");
        d.removeEventListener("pointermove", mover);
        d.removeEventListener("pointerup", soltar);
        d.removeEventListener("pointercancel", soltar);
        simGuardar();
      }
      d.addEventListener("pointermove", mover);
      d.addEventListener("pointerup", soltar);
      d.addEventListener("pointercancel", soltar);
    });
    return d;
  }

  function simNodoEl(n, numeros) {
    var el;
    if (n.v) el = renderSimVentana(n.v, numeros[n.v.id]);
    else {
      el = document.createElement("div");
      el.className = "sim-split sim-split-" + n.dir;
      var vis = n.hijos.filter(simVisible), prevNodo = null, prevEl = null;
      vis.forEach(function (h) {
        var hEl = simNodoEl(h, numeros);
        if (prevEl) el.appendChild(simDivisor(n.dir, prevNodo, h, prevEl, hEl));
        el.appendChild(hEl);
        prevNodo = h; prevEl = hEl;
      });
    }
    el.style.flex = (n.peso || 1) + " 1 0";
    return el;
  }

  function renderSimulador() {
    var lienzo = simGid("sim-lienzo");
    if (!lienzo) return;
    lienzo.innerHTML = "";
    simCuerpos = [];
    var hojas = simHojas(), numeros = {};
    hojas.forEach(function (h, i) { numeros[h.v.id] = i + 1; });
    var maxi = simMaximizada ? simBuscar(simMaximizada) : null;
    if (maxi && maxi.hoja.v.minimizada) maxi = null;
    if (!maxi) simMaximizada = null;
    if (!simEstado.raiz || !simVisible(simEstado.raiz)) {
      var vacio = document.createElement("p");
      vacio.className = "sim-vacio";
      vacio.textContent = simEstado.raiz ? T("sim_todo_minimizado") : T("sim_vacio");
      lienzo.appendChild(vacio);
    } else if (maxi) {
      var el = renderSimVentana(maxi.hoja.v, numeros[maxi.hoja.v.id]);
      el.style.flex = "1 1 0";
      lienzo.appendChild(el);
    } else {
      lienzo.appendChild(simNodoEl(simEstado.raiz, numeros));
    }
    // Muelle con las ventanas minimizadas: pulsar una la devuelve a su sitio.
    var dock = simGid("sim-dock");
    dock.innerHTML = "";
    hojas.forEach(function (h) {
      if (!h.v.minimizada) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "sim-dock-item"; b.title = T("sim_restaurar_tit");
      var nn = document.createElement("span"); nn.className = "sim-num"; nn.textContent = numeros[h.v.id];
      b.appendChild(nn);
      var tg = simMorf(h.v).tag;
      if (tg) { var bd = document.createElement("span"); bd.className = "sim-badge sim-badge-" + h.v.morfologia; bd.textContent = tg; b.appendChild(bd); }
      b.appendChild(document.createTextNode(" " + h.v.titulo));
      b.addEventListener("click", function () { h.v.minimizada = false; simGuardar(); renderSimulador(); });
      dock.appendChild(b);
    });
    dock.hidden = !dock.childNodes.length;
    simPintarSeleccion();
    if (typeof simPintarPresetRotulo === "function") simPintarPresetRotulo();
  }

  /* --- Arrastrar y acoplar --- */
  var simDrag = null;

  function simEmpezarArrastre(e, v, card) {
    if (e.button !== undefined && e.button !== 0) return;
    var x0 = e.clientX, y0 = e.clientY, empezado = false, cab = e.currentTarget;
    try { cab.setPointerCapture(e.pointerId); } catch (er) { /* sin captura */ }
    function mover(ev) {
      if (!empezado) {
        if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 8) return;
        empezado = true;
        simIniciarGuias(v, card);
      }
      ev.preventDefault();
      simActualizarGuias(ev.clientX, ev.clientY);
    }
    function soltar(ev) {
      cab.removeEventListener("pointermove", mover);
      cab.removeEventListener("pointerup", soltar);
      cab.removeEventListener("pointercancel", cancelar);
      if (!empezado) return;
      var destino = simDrag && simDrag.destino;
      simQuitarGuias();
      if (destino) simMover(v.id, destino.id, destino.lado);
    }
    function cancelar() {
      cab.removeEventListener("pointermove", mover);
      cab.removeEventListener("pointerup", soltar);
      cab.removeEventListener("pointercancel", cancelar);
      simQuitarGuias();
    }
    cab.addEventListener("pointermove", mover);
    cab.addEventListener("pointerup", soltar);
    cab.addEventListener("pointercancel", cancelar);
  }

  function simIniciarGuias(v, card) {
    var lienzo = simGid("sim-lienzo");
    card.classList.add("arrastrando");
    var capa = document.createElement("div");
    capa.className = "sim-guias";
    // Guías de los 4 bordes de la pantalla: fila o columna entera.
    [["arriba", "▲", "sim_borde_arriba"], ["abajo", "▼", "sim_borde_abajo"],
     ["izq", "◀", "sim_borde_izq"], ["der", "▶", "sim_borde_der"]].forEach(function (g) {
      var b = document.createElement("div");
      b.className = "sim-guia-borde sim-guia-" + g[0];
      b.dataset.lado = g[0];
      b.textContent = g[1];
      b.title = T(g[2]);
      capa.appendChild(b);
    });
    // Cruz sobre la ventana de debajo: acoplar a un lado o intercambiar.
    var cruz = document.createElement("div");
    cruz.className = "sim-cruz";
    cruz.hidden = true;
    [["arriba", "▲"], ["izq", "◀"], ["centro", "⇄"], ["der", "▶"], ["abajo", "▼"]].forEach(function (g) {
      var b = document.createElement("div");
      b.className = "sim-cruz-" + g[0];
      b.dataset.lado = g[0];
      b.textContent = g[1];
      cruz.appendChild(b);
    });
    capa.appendChild(cruz);
    var previa = document.createElement("div");
    previa.className = "sim-previa";
    previa.hidden = true;
    capa.appendChild(previa);
    var rotulo = document.createElement("div");
    rotulo.className = "sim-arrastre-rotulo";
    rotulo.textContent = v.titulo;
    capa.appendChild(rotulo);
    lienzo.appendChild(capa);
    simDrag = { id: v.id, card: card, capa: capa, cruz: cruz, previa: previa, rotulo: rotulo, sobre: null, destino: null };
  }

  function simActualizarGuias(x, y) {
    if (!simDrag) return;
    var lienzo = simGid("sim-lienzo"), rl = lienzo.getBoundingClientRect();
    simDrag.rotulo.style.left = (x - rl.left + 12) + "px";
    simDrag.rotulo.style.top = (y - rl.top + 12) + "px";
    var bajo = document.elementFromPoint(x, y), destino = null, rect = null;
    var guia = bajo && bajo.closest ? bajo.closest("[data-lado]") : null;
    var ventana = bajo && bajo.closest ? bajo.closest(".sim-ventana") : null;
    if (guia && guia.classList.contains("sim-guia-borde")) {
      destino = { id: null, lado: guia.dataset.lado };
      rect = simRectLado(rl, guia.dataset.lado, 0.3);
    } else {
      // La ventana de debajo: la de la cruz si se está sobre ella.
      if (guia && simDrag.sobre) ventana = simDrag.sobre;
      if (ventana && ventana.dataset.id !== simDrag.id) {
        if (simDrag.sobre !== ventana) {
          simDrag.sobre = ventana;
          var rv0 = ventana.getBoundingClientRect();
          simDrag.cruz.hidden = false;
          simDrag.cruz.style.left = (rv0.left - rl.left + rv0.width / 2) + "px";
          simDrag.cruz.style.top = (rv0.top - rl.top + rv0.height / 2) + "px";
        }
        var rv = ventana.getBoundingClientRect(), lado;
        if (guia) lado = guia.dataset.lado;
        else {
          // Fuera de la cruz: el borde más cercano, o intercambiar si se
          // está en el centro de la ventana.
          var dx = (x - rv.left) / rv.width, dy = (y - rv.top) / rv.height;
          var dist = { izq: dx, der: 1 - dx, arriba: dy, abajo: 1 - dy };
          lado = "centro";
          var min = 0.3;
          Object.keys(dist).forEach(function (k) { if (dist[k] < min) { min = dist[k]; lado = k; } });
        }
        destino = { id: ventana.dataset.id, lado: lado };
        rect = lado === "centro" ? rv : simRectLado(rv, lado, 0.5);
      } else {
        simDrag.sobre = null;
        simDrag.cruz.hidden = true;
      }
    }
    Array.prototype.forEach.call(simDrag.capa.querySelectorAll("[data-lado]"), function (el) {
      el.classList.toggle("activa", !!destino && el.dataset.lado === destino.lado &&
        (el.classList.contains("sim-guia-borde") ? destino.id === null : destino.id !== null));
    });
    simDrag.destino = destino;
    if (rect) {
      simDrag.previa.hidden = false;
      simDrag.previa.style.left = (rect.left - rl.left) + "px";
      simDrag.previa.style.top = (rect.top - rl.top) + "px";
      simDrag.previa.style.width = rect.width + "px";
      simDrag.previa.style.height = rect.height + "px";
    } else simDrag.previa.hidden = true;
  }

  function simRectLado(r, lado, frac) {
    var o = { left: r.left, top: r.top, width: r.width, height: r.height };
    if (lado === "izq") o.width = r.width * frac;
    else if (lado === "der") { o.width = r.width * frac; o.left = r.left + r.width - o.width; }
    else if (lado === "arriba") o.height = r.height * frac;
    else if (lado === "abajo") { o.height = r.height * frac; o.top = r.top + r.height - o.height; }
    return o;
  }

  function simQuitarGuias() {
    if (!simDrag) return;
    simDrag.card.classList.remove("arrastrando");
    if (simDrag.capa.parentNode) simDrag.capa.parentNode.removeChild(simDrag.capa);
    simDrag = null;
  }

  /* --- Animación (▶ ❚❚ ■), por ventana o por grupo, y reloj ---
   * Cada ventana anima por su cuenta (simActivas, simTicks). ▶ ■ ❚❚ de la
   * barra lateral mandan sobre la selección: TODOS, la ventana en la que se
   * pulsó, o un grupo por tipo. Los botones de grupo (SEP, MEP...) ponen en
   * marcha o paran todo su grupo de un toque (pedido del usuario, 26-09-2026). */
  var SIM_ORDEN_GRUPOS = ["sep", "aep", "mep", "reflejo", "hreflex", "emg", "tof", "eeg", "generico"];

  function simVentanasVisibles() {
    return simHojas().map(function (h) { return h.v; }).filter(function (v) { return !v.minimizada; });
  }
  function simIdsDe(sel) {
    var vs = simVentanasVisibles();
    if (sel && sel.indexOf("grupo:") === 0) {
      var mf = sel.slice(6);
      vs = vs.filter(function (v) { return (v.morfologia || "generico") === mf; });
    } else if (sel && sel !== "todos") {
      vs = vs.filter(function (v) { return v.id === sel; });
    }
    return vs.map(function (v) { return v.id; });
  }
  function simSeleccionar(sel) {
    simSeleccion = sel;
    simPintarSeleccion();
  }
  function simPasoAnimacion() {
    if (!pantallaActiva("simulador")) { simActivas = {}; simComprobarTimer(); simPintarSeleccion(); return; }
    simCuerpos.forEach(function (c) {
      if (!simActivas[c.v.id]) return;
      simTicks[c.v.id] = (simTicks[c.v.id] || 0) + 1;
      simDibujarTrazos(c.v, c.svg);
      simActualizarMediciones(c);
    });
    simComprobarFinCaso();
  }
  function simComprobarTimer() {
    var hay = Object.keys(simActivas).length > 0;
    if (hay && !simTimer) simTimer = setInterval(simPasoAnimacion, 900);
    if (!hay && simTimer) { clearInterval(simTimer); simTimer = null; }
  }
  function simReproducirIds(ids) {
    ids.forEach(function (id) { simActivas[id] = true; });
    simComprobarTimer();
    simPintarSeleccion();
  }
  function simPausarIds(ids) {
    ids.forEach(function (id) { delete simActivas[id]; });
    simComprobarTimer();
    simPintarSeleccion();
  }
  function simReproducir() { simReproducirIds(simIdsDe(simSeleccion)); }
  function simPausar() { simPausarIds(simIdsDe(simSeleccion)); }
  function simParar() {
    var ids = simIdsDe(simSeleccion);
    simPausarIds(ids);
    ids.forEach(function (id) { simTicks[id] = 0; });
    simCuerpos.forEach(function (c) { if (ids.indexOf(c.v.id) >= 0) { simDibujarTrazos(c.v, c.svg); simActualizarMediciones(c); } });
    simComprobarFinCaso();
  }
  function simTodasEnMarcha(ids) {
    return ids.length > 0 && ids.every(function (id) { return simActivas[id]; });
  }

  // Rótulo de la selección, botones de grupo y marcas en las ventanas
  // (elegida: marco dorado; en marcha: ▶ junto al número).
  function simPintarSeleccion() {
    var vs = simVentanasVisibles();
    if (simSeleccion !== "todos" && !simIdsDe(simSeleccion).length) simSeleccion = "todos";
    var rot = simGid("sim-sel");
    if (rot) {
      var txt = T("sim_todos");
      if (simSeleccion.indexOf("grupo:") === 0) txt = SIM_MORF[simSeleccion.slice(6)] && SIM_MORF[simSeleccion.slice(6)].tag || T("sim_morf_generico");
      else if (simSeleccion !== "todos") {
        var loc = simBuscar(simSeleccion);
        if (loc) txt = loc.hoja.v.titulo;
      }
      rot.textContent = txt;
      rot.classList.toggle("elegida", simSeleccion !== "todos");
    }
    var cont = simGid("sim-grupos");
    if (cont) {
      cont.innerHTML = "";
      SIM_ORDEN_GRUPOS.forEach(function (mf) {
        var ids = simIdsDe("grupo:" + mf);
        if (!ids.length) return;
        var enMarcha = simTodasEnMarcha(ids);
        var b = document.createElement("button");
        b.type = "button";
        b.className = "sim-grupo sim-badge sim-badge-" + mf + (enMarcha ? " corriendo" : "") + (simSeleccion === "grupo:" + mf ? " elegido" : "");
        var tag = SIM_MORF[mf].tag || T("sim_morf_generico");
        b.textContent = (enMarcha ? "❚❚ " : "▶ ") + tag;
        b.title = T(enMarcha ? "sim_grupo_pausa_tit" : "sim_grupo_play_tit", { tipo: tag });
        b.addEventListener("click", function () {
          simSeleccion = "grupo:" + mf;
          if (simTodasEnMarcha(simIdsDe("grupo:" + mf))) simPausarIds(simIdsDe("grupo:" + mf));
          else simReproducirIds(simIdsDe("grupo:" + mf));
        });
        cont.appendChild(b);
      });
    }
    var elegidas = simIdsDe(simSeleccion);
    Array.prototype.forEach.call(document.querySelectorAll("#sim-lienzo .sim-ventana"), function (el) {
      el.classList.toggle("seleccionada", simSeleccion !== "todos" && elegidas.indexOf(el.dataset.id) >= 0);
      el.classList.toggle("corriendo", !!simActivas[el.dataset.id]);
    });
    var p = simGid("sim-play");
    if (p) p.classList.toggle("activo", simTodasEnMarcha(elegidas));
    void vs;
  }
  function simArrancarReloj() {
    function pintar() {
      if (!pantallaActiva("simulador")) { clearInterval(simReloj); simReloj = null; return; }
      var d = new Date(), el = simGid("sim-reloj");
      function dos(n) { return (n < 10 ? "0" : "") + n; }
      if (el) el.textContent = dos(d.getHours()) + ":" + dos(d.getMinutes()) + ":" + dos(d.getSeconds()) +
        "  " + dos(d.getDate()) + "/" + dos(d.getMonth() + 1) + "/" + d.getFullYear();
    }
    if (simReloj) clearInterval(simReloj);
    simReloj = setInterval(pintar, 1000);
    pintar();
  }

  /* --- Diálogo de ajustes de una ventana --- */
  function simRenderCanalesEditor() {
    var cont = simGid("sim-v-canales");
    cont.innerHTML = "";
    if (!simCanalesEditando.length) {
      var vac = document.createElement("span");
      vac.className = "sim-sin-canales";
      vac.textContent = T("sim_sin_canales");
      cont.appendChild(vac);
      return;
    }
    simCanalesEditando.forEach(function (canal, i) {
      var chip = document.createElement("span");
      chip.className = "sim-canal-chip";
      var txt = document.createElement("span");
      txt.textContent = canal;
      var quitar = document.createElement("button");
      quitar.type = "button"; quitar.className = "sim-canal-quitar"; quitar.textContent = "✕";
      quitar.addEventListener("click", function () { simCanalesEditando.splice(i, 1); simRenderCanalesEditor(); });
      chip.appendChild(txt); chip.appendChild(quitar);
      cont.appendChild(chip);
    });
  }

  function simAnadirCanalDesdeInput() {
    var input = simGid("sim-v-canal-nuevo");
    var val = (input.value || "").trim();
    if (!val) return;
    simCanalesEditando.push(val);
    input.value = ""; input.focus();
    simRenderCanalesEditor();
  }

  function simAbrirDialogo(id) {
    var loc = simBuscar(id);
    if (!loc) return;
    var v = loc.hoja.v;
    simVentanaEditando = id;
    simCanalesEditando = v.canales.slice();
    simGid("sim-v-titulo").value = v.titulo;
    simGid("sim-v-morfologia").value = v.morfologia || "generico";
    Array.prototype.forEach.call(document.getElementsByName("sim-vista"), function (r) { r.checked = (r.value === (v.vista || "avg")); });
    var p = v.params || {}, f = v.filtros || {};
    simGid("sim-p-intensidad").value = p.intensidad || "";
    simGid("sim-p-frecuencia").value = p.frecuencia || "";
    simGid("sim-p-pulsos").value = p.pulsos || "";
    simGid("sim-p-trenes").value = p.trenes || "";
    simGid("sim-p-isi").value = p.isi || "";
    simGid("sim-p-duracion").value = p.duracion || "";
    simGid("sim-f-lff").value = f.lff || "";
    simGid("sim-f-hff").value = f.hff || "";
    simGid("sim-f-notch").value = f.notch || "";
    simGid("sim-f-barrido").value = f.barrido || "";
    simGid("sim-f-sens").value = f.sens || "";
    simRenderCanalesEditor();
    dlgSimVentana.showModal();
  }

  function simGuardarDialogo() {
    var loc = simBuscar(simVentanaEditando);
    if (!loc) { dlgSimVentana.close(); return; }
    var v = loc.hoja.v;
    v.titulo = (simGid("sim-v-titulo").value || "").trim() || T("sim_ventana_nueva");
    v.morfologia = simGid("sim-v-morfologia").value || "generico";
    var vistaSel = "avg";
    Array.prototype.forEach.call(document.getElementsByName("sim-vista"), function (r) { if (r.checked) vistaSel = r.value; });
    v.vista = vistaSel;
    v.canales = simCanalesEditando.slice();
    v.params = {
      intensidad: simGid("sim-p-intensidad").value.trim(), frecuencia: simGid("sim-p-frecuencia").value.trim(),
      pulsos: simGid("sim-p-pulsos").value.trim(), trenes: simGid("sim-p-trenes").value.trim(),
      isi: simGid("sim-p-isi").value.trim(), duracion: simGid("sim-p-duracion").value.trim()
    };
    v.filtros = {
      lff: simGid("sim-f-lff").value.trim(), hff: simGid("sim-f-hff").value.trim(),
      notch: simGid("sim-f-notch").value.trim(), barrido: simGid("sim-f-barrido").value.trim(),
      sens: simGid("sim-f-sens").value.trim()
    };
    simGuardar();
    dlgSimVentana.close();
    renderSimulador();
  }

  // Plantillas por tipo: añaden la ventana ya con la morfología y los
  // parámetros más habituales de Técnicas IONM (mismos valores que los
  // ejemplos), y abren su diálogo para poner título y canales. AEP y reflejo
  // van sin parámetros de estímulo: no se inventan.
  var SIM_PLANTILLAS = {
    sep: { titulo: "SEP", morfologia: "sep", vista: "avg", canales: ["Cz'-Fz"],
           params: { intensidad: "40", frecuencia: "4.7", duracion: "300" },
           filtros: { lff: "30", hff: "300", notch: "off" } },
    aep: { titulo: "AEP", morfologia: "aep", vista: "avg", canales: ["A1-Cz", "A2-Cz"], params: {}, filtros: {} },
    mep: { titulo: "MEP", morfologia: "mep", vista: "cascada", canales: ["L.APB"],
           params: { pulsos: "5", isi: "2", duracion: "500" }, filtros: {} },
    reflejo: { titulo: "Blink", morfologia: "reflejo", vista: "cascada", canales: ["L.Oc"], params: {}, filtros: {} },
    hreflex: { titulo: "H-R Sóleo", morfologia: "hreflex", vista: "cascada", canales: ["L.Sol", "R.Sol"], params: {}, filtros: {} },
    emg: { titulo: "f-EMG", morfologia: "emg", vista: "avg", canales: ["L.TA"],
           params: {}, filtros: { lff: "30", hff: "10000" } },
    tof: { titulo: "TOF", morfologia: "tof", vista: "avg", canales: ["APB"],
           params: { frecuencia: "2", pulsos: "4" }, filtros: {} },
    eeg: { titulo: "EEG", morfologia: "eeg", vista: "avg", canales: ["EEG"],
           params: {}, filtros: { lff: "0.5", hff: "70" } },
    generico: { titulo: "", morfologia: "generico", vista: "avg", canales: [], params: {}, filtros: {} }
  };

  function simAnadirPorTipo(clave) {
    if (!simCargado) simCargar();
    var plantilla = SIM_PLANTILLAS[clave];
    if (!plantilla) return;
    var v = simVentana(plantilla.titulo, plantilla);
    simAnadirVentana(v);
    simGuardar();
    renderSimulador();
    simAbrirDialogo(v.id);
  }

  var SIM_F_SEP = { lff: "30", hff: "300", notch: "off" };
  var SIM_P_SEPM = { intensidad: "40", frecuencia: "4.3", duracion: "200" };
  var SIM_P_SEPT = { intensidad: "40", frecuencia: "4.7", duracion: "300" };
  var SIM_P_MEP = { pulsos: "5", isi: "2", duracion: "500" };
  var SIM_P_TOF = { frecuencia: "2", pulsos: "4" };
  var SIM_F_EMG = { lff: "30", hff: "10000" };

  function simH(titulo, opts, peso) { return simHoja(simVentana(titulo, opts), peso); }

  // Ejemplo: columna lumbar. EMG libre a lo ancho arriba; debajo los SEP,
  // los MEP apilados y el TOF a su derecha ocupando el alto de los dos.
  function simCargarEjemplo() {
    simMaximizada = null;
    simEstado = { raiz: simDiv("v", [
      simH("f-EMG", { morfologia: "emg", canales: ["L.VM", "L.TA", "R.VM", "R.TA"], filtros: SIM_F_EMG }, 0.45),
      simDiv("h", [
        simDiv("v", [
          simH("SEP Mediano Izq", { morfologia: "sep", canales: ["L.Erb-R.Erb", "Cv2-CvAnt", "C4-Fz"], params: SIM_P_SEPM, filtros: SIM_F_SEP }),
          simH("SEP Tibial Izq", { morfologia: "sep", canales: ["Cz'-Fz"], params: SIM_P_SEPT, filtros: SIM_F_SEP })
        ]),
        simDiv("v", [
          simH("SEP Mediano Dcho", { morfologia: "sep", canales: ["R.Erb-L.Erb", "Cv2-CvAnt", "C3-Fz"], params: SIM_P_SEPM, filtros: SIM_F_SEP }),
          simH("SEP Tibial Dcho", { morfologia: "sep", canales: ["Cz'-Fz"], params: SIM_P_SEPT, filtros: SIM_F_SEP })
        ]),
        simDiv("v", [
          simH("MEP Izq", { morfologia: "mep", vista: "cascada", canales: ["L.APB", "L.Q", "L.TA", "L.AH"], params: SIM_P_MEP }),
          simH("MEP Dcho", { morfologia: "mep", vista: "cascada", canales: ["R.APB", "R.Q", "R.TA", "R.AH"], params: SIM_P_MEP })
        ]),
        simH("TOF", { morfologia: "tof", canales: ["APB"], params: SIM_P_TOF }, 0.6)
      ])
    ]) };
    var hr = simVentana("H-R Sóleo", { morfologia: "hreflex", vista: "cascada", canales: ["L.Sol", "R.Sol"] });
    hr.minimizada = true;
    simColocar(simHoja(hr), null, "der");
    simNormalizar();
    simGuardar();
    renderSimulador();
  }

  // Ejemplo: fosa posterior con pares craneales, a imagen de la pantalla que
  // pasó el usuario (26-09-2026): EMG libre a lo ancho arriba, AEP y SEP a
  // la izquierda, MEP de miembros y blink en cuadrícula, corticobulbares en
  // una columna a la derecha a toda altura, y el resto minimizado abajo.
  function simCargarEjemploFosa() {
    simMaximizada = null;
    function mep(t, canales, extra) {
      var o = { morfologia: "mep", vista: "cascada", canales: canales, params: SIM_P_MEP };
      if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
      return o;
    }
    simEstado = { raiz: simDiv("h", [
      simDiv("v", [
        simH("EMG libre", { morfologia: "emg", canales: ["R.Mass", "R.Oc", "R.Mnt"], filtros: SIM_F_EMG }, 0.55),
        simDiv("h", [
          simDiv("v", [
            simH("AEP izquierda", { morfologia: "aep", canales: ["A1-Cz", "A2-Cz", "A1-A2", "Cv2-Cz"] }),
            simH("SEP L Median", { morfologia: "sep", canales: ["C4'-C3'", "Cv2-Cz", "Erb1-Erb2"], params: SIM_P_SEPM, filtros: SIM_F_SEP }),
            simH("SEP L PTN", { morfologia: "sep", canales: ["Cz'-C3'", "C3'-C4'", "Cz'-C4'"], params: SIM_P_SEPT, filtros: SIM_F_SEP })
          ]),
          simDiv("v", [
            simH("AEP derecha", { morfologia: "aep", canales: ["A2-Cz", "A1-Cz", "A2-A1", "Cv2-Cz"] }),
            simH("SEP R Median", { morfologia: "sep", canales: ["C3'-C4'", "Cv2-Cz", "Erb2-Erb1"], params: SIM_P_SEPM, filtros: SIM_F_SEP }),
            simH("SEP R PTN", { morfologia: "sep", canales: ["Cz'-C3'", "C3'-C4'", "Cz'-C4'"], params: SIM_P_SEPT, filtros: SIM_F_SEP })
          ]),
          simDiv("v", [
            simH("R. TVcR", mep("R. TVcR", ["Voc.6-8"])),
            simDiv("h", [
              simDiv("v", [simH("L.up MEP", mep("", ["L.fdio", "L.Ext"])), simH("L.lwr MEP", mep("", ["L.TA", "L.AHall"]))]),
              simDiv("v", [simH("R.up MEP", mep("", ["R.fdio", "R.Ext"])), simH("R.lwr MEP", mep("", ["R.TA", "R.AHall"]))]),
              simDiv("v", [
                simH("Blink R", { morfologia: "reflejo", vista: "cascada", canales: ["R.Oc"] }),
                simH("Blink L", { morfologia: "reflejo", vista: "cascada", canales: ["L.Oc"] })
              ])
            ], 1.8)
          ], 2.2)
        ], 2.4)
      ], 3.2),
      simDiv("v", [
        simH("R.CoMEP", mep("", ["R.Oc", "R.Mnt", "R.Voc"])),
        simH("L.CoMEP", mep("", ["Voc.2-4", "Voc.6-8"]))
      ], 0.8)
    ]) };
    // Las que en la pantalla real quedan abajo, minimizadas.
    [["TOF", { morfologia: "tof", canales: ["APB"], params: SIM_P_TOF }],
     ["ECoG", { morfologia: "eeg", canales: ["Strip 1-2", "Strip 3-4"] }],
     ["L. TCR", mep("", ["L.Oc"])],
     ["Mapping", mep("", ["L.Oc", "L.Mnt"])]].forEach(function (d) {
      var v = simVentana(d[0], d[1]);
      v.minimizada = true;
      simColocar(simHoja(v), null, "der");
    });
    simNormalizar();
    simGuardar();
    renderSimulador();
  }

  function simConfirmarSiHay() {
    return !simEstado.raiz || confirm(T("sim_vaciar_conf"));
  }

  var simMenu = simGid("sim-menu");
  simGid("sim-btn-ventanas").addEventListener("click", function (e) {
    e.stopPropagation();
    var mp = simGid("sim-menu-presets");
    if (mp) mp.hidden = true;
    simMenu.hidden = !simMenu.hidden;
  });
  simMenu.addEventListener("click", function (e) {
    e.stopPropagation();
    var b = e.target.closest("button");
    if (!b) return;
    simMenu.hidden = true;
    if (b.dataset.simAdd) simAnadirPorTipo(b.dataset.simAdd);
    else if (b.id === "sim-ejemplo") { if (simConfirmarSiHay()) simCargarEjemplo(); }
    else if (b.id === "sim-ejemplo-fosa") { if (simConfirmarSiHay()) simCargarEjemploFosa(); }
  });
  document.addEventListener("click", function () { simMenu.hidden = true; });

  /* --- Presets del Simulador (26-09-2026): distribuciones guardadas con
   * nombre para volver a ellas -"columna con tornillos", "APC"...-. Se
   * guardan en este dispositivo (mio_ionm_simulador_presets_v1), como el
   * resto del Simulador. simEstado.preset recuerda cuál está cargado, para
   * "Guardar cambios" y para avisar de cambios sin guardar. --- */
  var SIM_PRESETS_KEY = "mio_ionm_simulador_presets_v1";
  var simPresets = null;
  // Sincronización (26-09-2026, pedido del usuario): cada preset es un
  // archivo simulador/<id>.json del repositorio de datos -uno por preset,
  // para que dos dispositivos no se pisen-, con la misma mecánica que los
  // montajes: sha por id, marca de "sin subir" y borrados pendientes.
  var simPresetsSha = {};
  var simPresetsSinSubir = {};
  var simPresetsBorrados = {};   // id -> sha, para borrarlo también allí
  var simMenuPresets = simGid("sim-menu-presets");

  function simCargarPresets() {
    if (simPresets) return;
    simPresetsSha = {}; simPresetsSinSubir = {}; simPresetsBorrados = {};
    var migrar = false;
    try {
      var g = JSON.parse(localStorage.getItem(SIM_PRESETS_KEY) || "null");
      if (Array.isArray(g)) {
        // Formato de antes de sincronizar (una lista suelta): todos son de
        // este dispositivo y nunca subieron, así que quedan pendientes.
        simPresets = g;
        if (!MODO_DEMO) g.forEach(function (pr) { simPresetsSinSubir[pr.id] = true; });
        migrar = true;
      } else if (g) {
        simPresets = g.presets || [];
        simPresetsSha = g.sha || {};
        simPresetsSinSubir = g.sin_subir || {};
        simPresetsBorrados = g.borrados || {};
      }
    } catch (e) { /* ilegible: se empieza de cero */ }
    if (!Array.isArray(simPresets)) simPresets = [];
    if (migrar) simGuardarPresets();
  }
  function simGuardarPresets() {
    try {
      localStorage.setItem(SIM_PRESETS_KEY, JSON.stringify({
        presets: simPresets, sha: simPresetsSha, sin_subir: simPresetsSinSubir, borrados: simPresetsBorrados
      }));
    } catch (e) { /* sin persistencia */ }
  }
  // Tras crear o cambiar un preset: guardarlo aquí y dejarlo listo para subir.
  function simPresetCambiado(id) {
    if (!MODO_DEMO) simPresetsSinSubir[id] = true;
    simGuardarPresets();
    programarEnvio();
  }
  function simPresetsPendientes() {
    // Puede llamarse al arrancar, antes de que este bloque se haya ejecutado
    // (pintarEstadoSync): entonces aún no hay nada que mirar.
    if (!SIM_PRESETS_KEY) return false;
    simCargarPresets();
    return Object.keys(simPresetsSinSubir).length > 0 || Object.keys(simPresetsBorrados).length > 0;
  }

  function urlSimPreset(id) {
    return "https://api.github.com/repos/" + sync.repo + "/contents/simulador/" + id + ".json";
  }
  function subirSimPreset(id, reintento) {
    var pr = simPresetPorId(id);
    if (!pr) { delete simPresetsSinSubir[id]; simGuardarPresets(); return Promise.resolve(); }
    var cuerpo = { message: "Preset del simulador " + pr.nombre, content: aBase64(JSON.stringify(pr, null, 2)) };
    if (simPresetsSha[id]) cuerpo.sha = simPresetsSha[id];
    return fetch(urlSimPreset(id), {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, cabeceras()),
      body: JSON.stringify(cuerpo)
    }).then(function (resp) {
      if ((resp.status === 409 || resp.status === 422) && !reintento) {
        return fetch(urlSimPreset(id), { headers: cabeceras(), cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (json) {
            simPresetsSha[id] = json ? json.sha : null;
            return subirSimPreset(id, true);
          });
      }
      if (!resp.ok) throw new Error(errorLegible(resp));
      return resp.json().then(function (json) {
        simPresetsSha[id] = json.content.sha;
        delete simPresetsSinSubir[id];
        simGuardarPresets();
      });
    });
  }
  function subirSimPresetsPendientes() {
    if (!syncActivo()) return Promise.resolve();
    simCargarPresets();
    return Object.keys(simPresetsSinSubir).reduce(function (cadena, id) {
      return cadena.then(function () { return subirSimPreset(id); });
    }, Promise.resolve());
  }
  function borrarSimPresetRemoto_(id, sha, reintento) {
    return fetch(urlSimPreset(id), {
      method: "DELETE",
      headers: Object.assign({ "Content-Type": "application/json" }, cabeceras()),
      body: JSON.stringify({ message: "Borrar preset del simulador " + id, sha: sha })
    }).then(function (resp) {
      if (resp.status === 404) return;
      if ((resp.status === 409 || resp.status === 422) && !reintento) {
        return fetch(urlSimPreset(id), { headers: cabeceras(), cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (json) { if (json) return borrarSimPresetRemoto_(id, json.sha, true); });
      }
      if (!resp.ok) throw new Error(errorLegible(resp));
    });
  }
  function borrarSimPresetsPendientes() {
    if (!syncActivo()) return Promise.resolve();
    simCargarPresets();
    return Object.keys(simPresetsBorrados).reduce(function (cadena, id) {
      return cadena.then(function () {
        return borrarSimPresetRemoto_(id, simPresetsBorrados[id]).then(function () {
          delete simPresetsBorrados[id];
          simGuardarPresets();
        });
      });
    }, Promise.resolve());
  }
  // Baja solo lo que ha cambiado (sha distinto) y retira lo que ya no está
  // allí; nunca pisa un preset pendiente de subir ni resucita uno borrado.
  function bajarSimPresets() {
    if (!syncActivo() || navigator.onLine === false) return Promise.resolve();
    simCargarPresets();
    var url = "https://api.github.com/repos/" + sync.repo + "/contents/simulador";
    return fetch(url, { headers: cabeceras(), cache: "no-store" })
      .then(function (resp) {
        if (resp.status === 404) return [];
        if (!resp.ok) throw new Error(errorLegible(resp));
        return resp.json();
      })
      .then(function (listado) {
        var presentes = {};
        (listado || []).forEach(function (f) {
          if (f.type === "file" && /\.json$/.test(f.name)) presentes[f.name.replace(/\.json$/, "")] = f;
        });
        var cambio = false;
        simPresets = simPresets.filter(function (pr) {
          var fuera = simPresetsSha[pr.id] && !presentes[pr.id] && !simPresetsSinSubir[pr.id] && !simPresetsBorrados[pr.id];
          if (fuera) { delete simPresetsSha[pr.id]; cambio = true; }
          return !fuera;
        });
        var quedan = Object.keys(presentes).filter(function (id) {
          return !simPresetsSinSubir[id] && !simPresetsBorrados[id] && simPresetsSha[id] !== presentes[id].sha;
        });
        return quedan.reduce(function (cadena, id) {
          return cadena.then(function () {
            return fetch(presentes[id].url, { headers: cabeceras(), cache: "no-store" })
              .then(function (r) { return r.ok ? r.json() : null; })
              .then(function (json) {
                if (!json || !json.content) return;
                var pr = JSON.parse(deBase64(json.content));
                if (!pr || !pr.id || !pr.raiz) return;
                simPresets = simPresets.filter(function (x) { return x.id !== pr.id; });
                simPresets.push(pr);
                simPresetsSha[pr.id] = json.sha;
                cambio = true;
              });
          });
        }, Promise.resolve()).then(function () {
          if (!cambio) return;
          simGuardarPresets();
          if (simMenuPresets && !simMenuPresets.hidden) simRenderMenuPresets();
          simPintarPresetRotulo();
        });
      })
      .catch(function (e) { ultimoFallo = e.message || T("sync_error_bajar"); })
      .then(function () { pintarEstadoSync(); });
  }
  function simPresetPorId(id) {
    simCargarPresets();
    for (var i = 0; i < simPresets.length; i++) if (simPresets[i].id === id) return simPresets[i];
    return null;
  }
  function simPresetModificado() {
    var pr = simEstado.preset ? simPresetPorId(simEstado.preset) : null;
    return !!pr && JSON.stringify(pr.raiz) !== JSON.stringify(simEstado.raiz);
  }
  function simPintarPresetRotulo() {
    var el = simGid("sim-preset-rotulo");
    if (!el) return;
    var pr = simEstado.preset ? simPresetPorId(simEstado.preset) : null;
    el.textContent = pr ? T(simPresetModificado() ? "sim_preset_rotulo_mod" : "sim_preset_rotulo", { nombre: pr.nombre }) : "";
  }
  function simPedirNombre(mensaje, porDefecto) {
    var n = prompt(mensaje, porDefecto || "");
    return n === null ? null : (n.trim() || null);
  }
  function simGuardarComoPreset() {
    if (!simEstado.raiz) { alert(T("sim_preset_vacio")); return; }
    simCargarPresets();
    var nombre = simPedirNombre(T("sim_preset_nombre_pide"), "");
    if (!nombre) return;
    var pr = { id: "sp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nombre: nombre,
               raiz: clonar(simEstado.raiz), editado: new Date().toISOString() };
    simPresets.push(pr);
    simEstado.preset = pr.id;
    simPresetCambiado(pr.id); simGuardar();
    simPintarPresetRotulo();
    avisoGuardado(T("sim_preset_guardado", { nombre: nombre }));
  }
  function simGuardarCambiosPreset() {
    var pr = simEstado.preset ? simPresetPorId(simEstado.preset) : null;
    if (!pr || !simEstado.raiz) return;
    pr.raiz = clonar(simEstado.raiz);
    pr.editado = new Date().toISOString();
    simPresetCambiado(pr.id);
    simPintarPresetRotulo();
    avisoGuardado(T("sim_preset_guardado", { nombre: pr.nombre }));
  }
  function simCargarPreset(id) {
    var pr = simPresetPorId(id);
    if (!pr) return;
    if (simEstado.raiz && simEstado.preset !== id && !confirm(T("sim_preset_cargar_conf", { nombre: pr.nombre }))) return;
    if (simEstado.preset === id && simPresetModificado() && !confirm(T("sim_preset_descartar_conf", { nombre: pr.nombre }))) return;
    simEstado = { raiz: clonar(pr.raiz), preset: pr.id };
    simActivas = {}; simTicks = {}; simComprobarTimer();
    simMaximizada = null; simSeleccion = "todos";
    simGuardar();
    renderSimulador();
  }
  function simRenombrarPreset(id) {
    var pr = simPresetPorId(id);
    if (!pr) return;
    var nombre = simPedirNombre(T("sim_preset_nombre_pide"), pr.nombre);
    if (!nombre) return;
    pr.nombre = nombre;
    pr.editado = new Date().toISOString();
    simPresetCambiado(pr.id);
  }
  function simDuplicarPreset(id) {
    var pr = simPresetPorId(id);
    if (!pr) return;
    var copia = { id: "sp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                  nombre: T("sim_preset_copia", { nombre: pr.nombre }), raiz: clonar(pr.raiz), editado: new Date().toISOString() };
    simPresets.push(copia);
    simPresetCambiado(copia.id);
  }
  function simBorrarPreset(id) {
    var pr = simPresetPorId(id);
    if (!pr || !confirm(T("sim_preset_borrar_conf", { nombre: pr.nombre }))) return;
    simPresets = simPresets.filter(function (x) { return x.id !== id; });
    if (simEstado.preset === id) { simEstado.preset = null; simGuardar(); }
    delete simPresetsSinSubir[id];
    if (simPresetsSha[id]) { simPresetsBorrados[id] = simPresetsSha[id]; delete simPresetsSha[id]; }
    simGuardarPresets();
    programarEnvio();
  }

  function simRenderMenuPresets() {
    simCargarPresets();
    var m = simMenuPresets;
    m.innerHTML = "";
    function tit(clave) { var d = document.createElement("div"); d.className = "sim-menu-tit"; d.textContent = T(clave); m.appendChild(d); }
    function boton(txt, fn, clase) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = txt;
      if (clase) b.className = clase;
      b.addEventListener("click", function (e) { e.stopPropagation(); fn(); });
      return b;
    }
    tit("sim_presets");
    var activo = simEstado.preset ? simPresetPorId(simEstado.preset) : null;
    if (activo) m.appendChild(boton(T("sim_preset_guardar_cambios", { nombre: activo.nombre }), function () { simGuardarCambiosPreset(); m.hidden = true; }));
    m.appendChild(boton(T("sim_preset_guardar_nuevo"), function () { simGuardarComoPreset(); m.hidden = true; }));
    tit("sim_presets_guardados");
    if (!simPresets.length) {
      var vac = document.createElement("div");
      vac.className = "sim-menu-vacio"; vac.textContent = T("sim_presets_ninguno");
      m.appendChild(vac);
    }
    simPresets.slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre); }).forEach(function (pr) {
      var fila = document.createElement("div");
      fila.className = "sim-preset-fila" + (pr.id === simEstado.preset ? " activo" : "");
      var nb = boton(pr.nombre, function () { m.hidden = true; simCargarPreset(pr.id); }, "sim-preset-nombre");
      nb.title = T("sim_preset_cargar_tit");
      fila.appendChild(nb);
      var ed = boton("✎", function () { simRenombrarPreset(pr.id); simRenderMenuPresets(); simPintarPresetRotulo(); }, "sim-preset-acc");
      ed.title = T("sim_preset_renombrar_tit");
      var du = boton("⧉", function () { simDuplicarPreset(pr.id); simRenderMenuPresets(); }, "sim-preset-acc");
      du.title = T("sim_preset_duplicar_tit");
      var bo = boton("🗑", function () { simBorrarPreset(pr.id); simRenderMenuPresets(); simPintarPresetRotulo(); }, "sim-preset-acc");
      bo.title = T("sim_preset_borrar_tit");
      fila.appendChild(ed); fila.appendChild(du); fila.appendChild(bo);
      m.appendChild(fila);
    });
  }
  simGid("sim-btn-presets").addEventListener("click", function (e) {
    e.stopPropagation();
    simMenu.hidden = true;
    if (simMenuPresets.hidden) simRenderMenuPresets();
    simMenuPresets.hidden = !simMenuPresets.hidden;
  });
  simMenuPresets.addEventListener("click", function (e) { e.stopPropagation(); });
  document.addEventListener("click", function () { simMenuPresets.hidden = true; });

  /* --- Repaso: casos con alarmas (26-09-2026) ---
   * Cada caso monta una pantalla (los ejemplos de siempre) y una línea de
   * tiempo de cambios: desde la barrida "desde" hasta "hasta" la señal de
   * las ventanas/canales elegidos va cambiando poco a poco (amplitud,
   * latencia, ruido, red de 50 Hz, desvanecimiento del TOF...) y después se
   * queda así. La referencia gris de los promediados es SIEMPRE la basal, y
   * las cascadas enseñan la evolución barrida a barrida.
   * Al llegar a la barrida "fin" (o antes, con "Valorar") se pregunta qué
   * está pasando, y la respuesta explica el criterio (con la fuente de
   * Técnicas IONM), el patrón y qué hacer. Los criterios que se usan:
   * PESS caída de amplitud >50% y/o aumento de latencia >10% (criterio
   * clásico; MacDonald 2019 ISION propone criterios adaptativos); PEM sin
   * umbral de amplitud universal validado (MacDonald 2013 ASNM); PEATC
   * pérdida de III y/o V o aumento de latencia de V >1,0 ms.
   * --- */
  var simCaso = null;            // { def, respondido, tickRespuesta }
  var simMediciones = false;
  var SIM_REPASO_KEY = "mio_ionm_simulador_repaso_v1";

  var SIM_CASOS = [
    { id: "sep_unilateral", titulo: "SEP tibial izquierdo en escoliosis", nivel: 1, pantalla: "lumbar",
      contexto: "Corrección de escoliosis idiopática T4-L1, TIVA estable. Estás en la fase de colocación de tornillos y barras. Pulsa ▶ y vigila todas las ventanas.",
      eventos: [{ v: /TIBIAL IZQ/, desde: 6, hasta: 14, amp: 0.35, lat: 1.13 }], fin: 22,
      opciones: [
        { t: "Sin cambios significativos" },
        { t: "Alarma: caída del SEP tibial izquierdo", ok: true },
        { t: "Cambio global de origen anestésico" },
        { t: "Problema técnico del electrodo" }
      ],
      explicacion: "El P37 izquierdo cae alrededor de un 65% y su latencia aumenta un 13%, mientras el lado derecho, los SEP de mediano y los MEP siguen estables. Cumple el criterio clásico de alarma de los PESS (caída de amplitud >50% y/o aumento de latencia >10%). Al ser unilateral y aislado, lo primero es sospechar una causa quirúrgica o posicional.",
      accion: "Avisar al cirujano con lo que ves (lado, magnitud, desde cuándo), repetir para confirmar, comprobar tensión arterial media y electrodos, y valorar los MEP de ese lado." },
    { id: "anestesia_global", titulo: "Caída de todos los SEP corticales", nivel: 2, pantalla: "lumbar",
      contexto: "Artrodesis L4-S1 con TIVA. Fase de instrumentación sin incidencias. Pulsa ▶ y vigila.",
      eventos: [
        { v: /SEP MEDIANO/, c: /C[34]-FZ/, desde: 5, hasta: 11, amp: 0.4, lat: 1.07 },
        { v: /SEP TIBIAL/, desde: 5, hasta: 11, amp: 0.38, lat: 1.08 },
        { v: /^MEP/, desde: 5, hasta: 11, amp: 0.45 }
      ], fin: 18,
      opciones: [
        { t: "Alarma quirúrgica unilateral" },
        { t: "Cambio global y simétrico: probable causa anestésica o sistémica", ok: true },
        { t: "Problema técnico" },
        { t: "Sin cambios significativos" }
      ],
      explicacion: "Caen a la vez las respuestas corticales de las cuatro extremidades, de forma simétrica, con N9 (Erb) y N13 (cervical) conservadas, y los MEP también bajan. Un cambio bilateral, simétrico y cortical apunta a una causa supraespinal o sistémica (bolo de hipnótico, halogenados, hipotensión, hipotermia), no a una lesión quirúrgica focal.",
      accion: "Comunicarlo a anestesia (bolos, fármacos, TAM, temperatura), documentarlo y vigilar la recuperación. Si no se explica o no se recupera, tratarlo como alarma." },
    { id: "brazo_posicional", titulo: "SEP de mediano derecho que se apaga", nivel: 2, pantalla: "lumbar",
      contexto: "Cirugía lumbar en prono con los brazos en abducción. Llevas dos horas de cirugía. Pulsa ▶ y vigila.",
      eventos: [{ v: /MEDIANO DCHO/, desde: 5, hasta: 13, amp: 0.3, lat: 1.06 }], fin: 20,
      opciones: [
        { t: "Alarma medular" },
        { t: "Compromiso periférico o posicional del brazo derecho", ok: true },
        { t: "Cambio anestésico" },
        { t: "Sin cambios significativos" }
      ],
      explicacion: "Cae el SEP de mediano derecho en todos sus niveles, también la N9 del punto de Erb. Si ya falla la N9, el problema está antes del plexo braquial: posición del brazo, compresión del nervio, manguito de presión... Una cirugía lumbar no puede explicar un SEP de mediano, y los SEP de tibial y los MEP de miembros inferiores siguen bien.",
      accion: "Revisar la posición del brazo derecho (abducción, almohadillado, codo), el manguito de tensión y los electrodos de estimulación, y comprobar que se recupera." },
    { id: "tecnico_ruido", titulo: "Un canal cortical que se ensucia", nivel: 1, pantalla: "lumbar",
      contexto: "Artrodesis lumbar, fase de descompresión. El cirujano ha empezado a usar el bisturí eléctrico. Pulsa ▶ y vigila.",
      eventos: [{ v: /TIBIAL DCHO/, desde: 5, hasta: 9, ruido: 1.2, red: 5 }], fin: 16,
      opciones: [
        { t: "Alarma: caída del SEP tibial derecho" },
        { t: "Problema técnico: ruido o impedancia del electrodo", ok: true },
        { t: "Cambio anestésico" },
        { t: "Sin cambios significativos" }
      ],
      explicacion: "Solo un canal se llena de ruido de red (50 Hz) que tapa la respuesta, sin un cambio claro de latencia ni una caída progresiva, y el resto de canales siguen limpios. Antes de hablar de alarma hay que descartar un problema técnico.",
      accion: "Revisar impedancias, el electrodo y el cable de ese canal, fuentes de interferencia (bisturí, manta térmica, bombas) y el filtro notch; repetir cuando esté limpio y, si entonces hay cambio real, valorarlo como alarma." },
    { id: "mep_unilateral", titulo: "MEP tras la maniobra de corrección", nivel: 2, pantalla: "lumbar",
      contexto: "Escoliosis: el cirujano acaba de hacer la maniobra de derrotación de la barra. Pulsa ▶ y vigila.",
      eventos: [
        { v: /^MEP IZQ/, c: /TA|AH/, desde: 4, hasta: 8, amp: 0.08 },
        { v: /^MEP IZQ/, c: /\bQ\b|L\.Q/, desde: 4, hasta: 8, amp: 0.3 }
      ], fin: 14,
      opciones: [
        { t: "Sin alarma: los SEP siguen normales" },
        { t: "Alarma: pérdida de MEP en el miembro inferior izquierdo", ok: true },
        { t: "Efecto del relajante neuromuscular" },
        { t: "Problema técnico" }
      ],
      explicacion: "Tras la maniobra casi desaparecen los MEP de tibial anterior y abductor del primer dedo izquierdos y cae el cuádriceps, mientras los derechos y todos los SEP siguen igual. Los MEP pueden alterarse antes que los SEP (vía motora, territorio de la arteria espinal anterior). No hay un umbral de amplitud universal validado (MacDonald 2013, ASNM), pero una pérdida marcada, unilateral y ligada a una maniobra es una alarma.",
      accion: "Avisar al cirujano enseguida, valorar revertir la maniobra, subir la tensión arterial media y comprobar que no hay causa técnica ni anestésica (TOF, bolos)." },
    { id: "relajante", titulo: "Todos los MEP bajan a la vez", nivel: 1, pantalla: "lumbar",
      contexto: "Artrodesis lumbar. Tras la inducción había buenos MEP. Anestesia está reponiendo medicación. Pulsa ▶ y vigila.",
      eventos: [
        { v: /^MEP/, desde: 4, hasta: 10, amp: 0.2 },
        { v: /^TOF/, desde: 4, hasta: 10, amp: 0.55, fade: 0.25 }
      ], fin: 16,
      opciones: [
        { t: "Alarma medular bilateral" },
        { t: "Bloqueo neuromuscular: lo confirma el TOF", ok: true },
        { t: "Problema técnico" },
        { t: "Sin cambios significativos" }
      ],
      explicacion: "Caen a la vez todos los MEP de las cuatro extremidades, de forma simétrica, con los SEP intactos, y el TOF muestra desvanecimiento (T4 mucho menor que T1). Es el patrón del relajante neuromuscular: los MEP dejan de ser valorables mientras dure.",
      accion: "Comentarlo con anestesia (sin más relajante, esperar a que recupere el TOF) y no interpretar los MEP hasta que el TOF vuelva." },
    { id: "peatc_v", titulo: "PEATC en un neurinoma del acústico", nivel: 2, pantalla: "fosa",
      contexto: "Neurinoma del acústico izquierdo, fase de disección del tumor. Pulsa ▶ y vigila el AEP izquierdo.",
      eventos: [{ v: /AEP IZQUIERDA/, desde: 5, hasta: 12, latMs: 1.3, amp: 0.45 }], fin: 18,
      opciones: [
        { t: "Sin cambios significativos" },
        { t: "Alarma: onda V retrasada más de 1 ms y más pequeña", ok: true },
        { t: "Problema técnico" },
        { t: "Cambio anestésico" }
      ],
      explicacion: "La onda V del lado izquierdo se retrasa más de 1 ms y pierde amplitud, con la onda I conservada; el lado derecho sigue igual. El criterio de alarma de los PEATC es la pérdida de la onda III y/o V, el aumento de las latencias entre picos I-III o III-V, o el aumento de latencia de la onda V de más de 1,0 ms.",
      accion: "Avisar al cirujano (tracción del nervio, calor, isquemia), pedir que pare la maniobra y vigilar la recuperación; comprobar el auricular y la temperatura." },
    { id: "sin_alarma", titulo: "Fluctuación de un SEP", nivel: 1, pantalla: "lumbar",
      contexto: "Artrodesis lumbar, fase de instrumentación. Pulsa ▶ y vigila.",
      eventos: [{ v: /TIBIAL IZQ/, desde: 5, hasta: 10, amp: 0.75, lat: 1.04 }], fin: 16,
      opciones: [
        { t: "Sin alarma: variación dentro de lo esperable", ok: true },
        { t: "Alarma: caída del SEP tibial izquierdo" },
        { t: "Problema técnico" },
        { t: "Cambio anestésico global" }
      ],
      explicacion: "El P37 izquierdo baja alrededor de un 25% y se retrasa un 4%: no llega al criterio de alarma (caída >50% y/o latencia >10%). Es una fluctuación que hay que vigilar, no una alarma.",
      accion: "Documentarlo, vigilar la tendencia en las siguientes barridas y revisar que no haya un cambio técnico o anestésico en marcha." }
  ];

  function simCasoPorId(id) {
    for (var i = 0; i < SIM_CASOS.length; i++) if (SIM_CASOS[i].id === id) return SIM_CASOS[i];
    return null;
  }

  // Cambios del caso en curso para un canal en una barrida concreta.
  function simModificador(v, canal, tick) {
    if (!simCaso) return null;
    var t = (v.titulo || "").toUpperCase(), c = (canal || "").toUpperCase();
    var mod = { amp: 1, lat: 1, latMs: 0, ruido: 0, red: 0, fade: 1 }, alguno = false;
    simCaso.def.eventos.forEach(function (e) {
      if (!e.v.test(t) || (e.c && !e.c.test(c))) return;
      var f = Math.max(0, Math.min(1, (tick - e.desde) / Math.max(1, e.hasta - e.desde)));
      if (f <= 0) return;
      alguno = true;
      if (e.amp !== undefined) mod.amp *= 1 + (e.amp - 1) * f;
      if (e.lat !== undefined) mod.lat *= 1 + (e.lat - 1) * f;
      if (e.latMs) mod.latMs += e.latMs * f;
      if (e.ruido) mod.ruido += e.ruido * f;
      if (e.red) mod.red += e.red * f;
      if (e.fade !== undefined) mod.fade *= 1 + (e.fade - 1) * f;
    });
    return alguno ? mod : null;
  }

  // Latencia y amplitud del componente principal de un canal (valores del
  // modelo, sin el ruido de cada barrida), para el botón "Mediciones".
  function simMedicion(v, canal, tick) {
    var mod = simModificador(v, canal, tick) || { amp: 1, lat: 1, latMs: 0, fade: 1 };
    var mf = v.morfologia, nombre, lat, amp, uni = "µV";
    if (mf === "sep") {
      var comp = simComponentesSEP(v, canal)[0];
      nombre = comp[3]; lat = comp[0] * mod.lat; amp = Math.abs(comp[1]) * mod.amp;
      return { nombre: nombre, lat: lat, amp: amp, uni: uni, dLat: mod.lat - 1, dAmp: mod.amp - 1 };
    }
    if (mf === "aep") return { nombre: "V", lat: 5.8 + mod.latMs, amp: 0.45 * mod.amp, uni: uni, dLatMs: mod.latMs, dAmp: mod.amp - 1 };
    if (mf === "mep") {
      var dm = simDatosMEP(canal);
      return { nombre: "MEP", lat: dm[0] * mod.lat, amp: dm[1] * mod.amp, uni: uni, dLat: mod.lat - 1, dAmp: mod.amp - 1 };
    }
    if (mf === "tof") return { nombre: "T4/T1", ratio: Math.round(0.92 * mod.fade * 100) };
    return null;
  }
  function simTextoMedicion(md) {
    if (!md) return "";
    if (md.ratio !== undefined) return md.nombre + " " + md.ratio + "%";
    function pct(x) { var p = Math.round(x * 100); return (p > 0 ? "+" : "") + p + "%"; }
    var txt = md.nombre + " " + md.lat.toFixed(1) + " ms · " + (md.amp >= 10 ? Math.round(md.amp) : md.amp.toFixed(1)) + " " + md.uni;
    var cambios = [];
    if (md.dLat && Math.abs(md.dLat) >= 0.01) cambios.push("lat " + pct(md.dLat));
    if (md.dLatMs && md.dLatMs >= 0.05) cambios.push("lat +" + md.dLatMs.toFixed(1) + " ms");
    if (md.dAmp && Math.abs(md.dAmp) >= 0.01) cambios.push("amp " + pct(md.dAmp));
    return txt + (cambios.length ? " (" + cambios.join(", ") + ")" : "");
  }
  function simActualizarMediciones(c) {
    (c.etiqs || []).forEach(function (e) {
      var extra = simMediciones ? simTextoMedicion(simMedicion(c.v, e.canal, simTicks[c.v.id] || 0)) : "";
      e.med.textContent = extra;
      e.med.hidden = !extra;
    });
  }

  function simResultados() {
    try { return JSON.parse(localStorage.getItem(SIM_REPASO_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function simGuardarResultado(id, ok) {
    var r = simResultados();
    r[id] = r[id] || { intentos: 0, aciertos: 0 };
    r[id].intentos++;
    if (ok) r[id].aciertos++;
    try { localStorage.setItem(SIM_REPASO_KEY, JSON.stringify(r)); } catch (e) { /* sin persistencia */ }
  }

  function simEmpezarCaso(id, sinPreguntar) {
    var def = simCasoPorId(id);
    if (!def) return;
    if (!sinPreguntar && simEstado.raiz && !simCaso && !confirm(T("sim_caso_empezar_conf"))) return;
    simActivas = {}; simTicks = {}; simComprobarTimer();
    if (def.pantalla === "fosa") simCargarEjemploFosa(); else simCargarEjemplo();
    simCaso = { def: def, respondido: false };
    simSeleccion = "todos";
    simPintarCaso();
    renderSimulador();
  }
  function simSalirCaso() {
    simCaso = null;
    simActivas = {}; simComprobarTimer();
    simPintarCaso();
    renderSimulador();
  }
  function simTickCaso() {
    var max = 0;
    Object.keys(simTicks).forEach(function (k) { if (simTicks[k] > max) max = simTicks[k]; });
    return max;
  }
  // Tras cada paso de la animación: al llegar al final del caso, se para y pregunta.
  function simComprobarFinCaso() {
    if (!simCaso || simCaso.respondido) return;
    var t = simTickCaso(), b = simGid("sim-caso-barrida");
    if (b) b.textContent = T("sim_caso_barrida", { n: t });
    if (t >= simCaso.def.fin) {
      simActivas = {}; simComprobarTimer(); simPintarSeleccion();
      simAbrirPregunta();
    }
  }

  function simPintarCaso() {
    var barra = simGid("sim-caso-barra");
    if (!barra) return;
    barra.hidden = !simCaso;
    if (!simCaso) return;
    simGid("sim-caso-titulo").textContent = simCaso.def.titulo;
    simGid("sim-caso-contexto").textContent = simCaso.def.contexto;
    simGid("sim-caso-barrida").textContent = T("sim_caso_barrida", { n: simTickCaso() });
    simGid("sim-caso-mediciones").classList.toggle("activo", simMediciones);
  }

  var dlgSimCaso = simGid("dlg-sim-caso");
  function simAbrirPregunta() {
    if (!simCaso) return;
    var def = simCaso.def, cont = simGid("sim-caso-dlg-cuerpo");
    simGid("sim-caso-dlg-titulo").textContent = def.titulo;
    cont.innerHTML = "";
    var p = document.createElement("p");
    p.className = "sim-caso-pregunta";
    p.textContent = T("sim_caso_pregunta");
    cont.appendChild(p);
    var tickResp = simTickCaso();
    def.opciones.forEach(function (op) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "sim-caso-opcion"; b.textContent = op.t;
      b.addEventListener("click", function () { simResponder(op, tickResp); });
      cont.appendChild(b);
    });
    if (!dlgSimCaso.open) dlgSimCaso.showModal();
  }
  function simResponder(op, tickResp) {
    var def = simCaso.def, ok = !!op.ok, cont = simGid("sim-caso-dlg-cuerpo");
    simCaso.respondido = true;
    simGuardarResultado(def.id, ok);
    var inicio = def.eventos.reduce(function (a, e) { return Math.min(a, e.desde); }, Infinity);
    cont.innerHTML = "";
    var r = document.createElement("p");
    r.className = "sim-caso-veredicto " + (ok ? "ok" : "mal");
    r.textContent = ok ? T("sim_caso_bien") : T("sim_caso_mal", { correcta: def.opciones.filter(function (o) { return o.ok; })[0].t });
    cont.appendChild(r);
    if (def.id !== "sin_alarma") {
      var tm = document.createElement("p");
      tm.className = "sim-caso-tiempo";
      tm.textContent = tickResp < inicio ? T("sim_caso_antes", { n: tickResp, ini: inicio })
        : T("sim_caso_tiempo", { n: tickResp, ini: inicio });
      cont.appendChild(tm);
    }
    [["sim_caso_porque", def.explicacion], ["sim_caso_accion", def.accion]].forEach(function (par) {
      var h = document.createElement("h4"); h.textContent = T(par[0]); cont.appendChild(h);
      var x = document.createElement("p"); x.textContent = par[1]; cont.appendChild(x);
    });
    var fila = document.createElement("div");
    fila.className = "dlg-botones";
    function boton(clave, fn, clase) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = T(clave); if (clase) b.className = clase;
      b.addEventListener("click", fn);
      fila.appendChild(b);
    }
    boton("sim_caso_repetir", function () { dlgSimCaso.close(); simEmpezarCaso(def.id, true); });
    boton("sim_caso_mirar", function () { dlgSimCaso.close(); simMediciones = true; simPintarCaso(); renderSimulador(); });
    var sp = document.createElement("span"); sp.className = "barra-flex"; fila.appendChild(sp);
    boton("sim_caso_otro", function () { dlgSimCaso.close(); simMenuRepaso.hidden = false; simRenderMenuRepaso(); }, "primario");
    cont.appendChild(fila);
  }

  var simMenuRepaso = simGid("sim-menu-repaso");
  function simRenderMenuRepaso() {
    var m = simMenuRepaso, res = simResultados();
    m.innerHTML = "";
    var tit = document.createElement("div"); tit.className = "sim-menu-tit"; tit.textContent = T("sim_repaso_tit");
    m.appendChild(tit);
    var intro = document.createElement("div"); intro.className = "sim-menu-vacio"; intro.textContent = T("sim_repaso_intro");
    m.appendChild(intro);
    SIM_CASOS.forEach(function (cs) {
      var b = document.createElement("button");
      b.type = "button";
      var r = res[cs.id];
      b.textContent = (r ? (r.aciertos ? "✓ " : "✗ ") : "○ ") + cs.titulo + (cs.nivel > 1 ? "  ★★" : "  ★");
      b.title = r ? T("sim_repaso_resultado", { a: r.aciertos, i: r.intentos }) : "";
      b.addEventListener("click", function (e) { e.stopPropagation(); m.hidden = true; simEmpezarCaso(cs.id, !!simCaso); });
      m.appendChild(b);
    });
  }
  simGid("sim-btn-repaso").addEventListener("click", function (e) {
    e.stopPropagation();
    simMenu.hidden = true; simMenuPresets.hidden = true;
    if (simMenuRepaso.hidden) simRenderMenuRepaso();
    simMenuRepaso.hidden = !simMenuRepaso.hidden;
  });
  simMenuRepaso.addEventListener("click", function (e) { e.stopPropagation(); });
  document.addEventListener("click", function () { simMenuRepaso.hidden = true; });
  simGid("sim-caso-valorar").addEventListener("click", function () {
    simActivas = {}; simComprobarTimer(); simPintarSeleccion();
    if (simCaso && !simCaso.respondido) simAbrirPregunta();
  });
  simGid("sim-caso-mediciones").addEventListener("click", function () {
    simMediciones = !simMediciones;
    simPintarCaso();
    simCuerpos.forEach(simActualizarMediciones);
  });
  simGid("sim-caso-salir").addEventListener("click", simSalirCaso);
  simGid("sim-caso-dlg-cerrar").addEventListener("click", function () { dlgSimCaso.close(); });
  simGid("sim-play").addEventListener("click", simReproducir);
  simGid("sim-sel").addEventListener("click", function () { simSeleccionar("todos"); });
  simGid("sim-pausa").addEventListener("click", simPausar);
  simGid("sim-stop").addEventListener("click", simParar);
  simGid("sim-vaciar").addEventListener("click", function () {
    if (!simEstado.raiz) return;
    if (!confirm(T("sim_vaciar_conf"))) return;
    simEstado = { raiz: null };
    simMaximizada = null;
    simCaso = null;
    simPintarCaso();
    simGuardar();
    renderSimulador();
  });
  // Pantalla completa y, en el móvil, girar a horizontal (solo lo permiten
  // algunos navegadores -Chrome de Android sí, Safari del iPhone no-; si no
  // se puede, no pasa nada).
  simGid("sim-completa").addEventListener("click", function () {
    var app = document.querySelector(".sim-app");
    try {
      if (document.fullscreenElement) { document.exitFullscreen(); return; }
      if (app.requestFullscreen) {
        var pr = app.requestFullscreen();
        if (pr && pr.then) pr.then(function () {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(function () {});
        }).catch(function () {});
      }
    } catch (e) { /* sin pantalla completa */ }
  });
  simGid("sim-v-canal-add").addEventListener("click", simAnadirCanalDesdeInput);
  simGid("sim-v-canal-nuevo").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); simAnadirCanalDesdeInput(); } });
  simGid("sim-v-guardar").addEventListener("click", simGuardarDialogo);
  simGid("sim-v-cancelar").addEventListener("click", function () { dlgSimVentana.close(); });
  simGid("sim-v-borrar").addEventListener("click", function () { var id = simVentanaEditando; dlgSimVentana.close(); if (id) simQuitarVentana(id); });

  // Panel-catalogo es ya un <details> de verdad (06-09-2026, tarde): pulsar
  // el <summary> lo pliega/despliega solo, igual que Plantillas de
  // montajes/Técnicas/Cajas/Resumen -ya no hace falta ni el botón ▾/▸ ni
  // este listener a mano-. Los botones Etiquetas y + siguen con su propia
  // acción: hay que impedir que un clic en ellos dispare además el toggle
  // nativo del <summary> que los contiene.
  document.querySelector("#panel-catalogo > summary").addEventListener("click", function (e) {
    if (e.target.closest("button")) e.preventDefault();
  });

  document.getElementById("btn-idioma").addEventListener("click", function () {
    aplicarIdioma(idioma === "es" ? "en" : "es", true);
  });

  /* Desplegable "⋮": Idioma, Guía de uso y Docente. Se cierra solo al elegir
     cualquiera de los tres (sus propios listeners ya abren su diálogo o
     cambian el idioma; aquí solo se pliega el menú) o al pulsar fuera. */
  var menuLista = document.getElementById("menu-lista");
  document.getElementById("btn-menu").addEventListener("click", function (e) {
    e.stopPropagation();
    menuLista.hidden = !menuLista.hidden;
  });
  menuLista.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON") menuLista.hidden = true;
  });
  document.addEventListener("click", function () {
    menuLista.hidden = true;
  });

  /* "Ocultar ayudas" (28-09-2026, pedido del usuario): las leyendas de ayuda
     ocupan mucho sitio y quien ya sabe usar la herramienta no las lee. Pone
     la clase "sin-ayudas" en <body> y style.css esconde los textos de ayuda
     (no los avisos de estado ni los datos). Se recuerda en este dispositivo:
     es una preferencia de pantalla, no un dato que sincronizar. */
  var AYUDAS_KEY = "mio_ionm_sin_ayudas_v1";
  var btnAyudas = document.getElementById("btn-ayudas");
  function aplicarAyudas(sin) {
    document.body.classList.toggle("sin-ayudas", sin);
    var clave = sin ? "btn_ayudas_mostrar" : "btn_ayudas_ocultar";
    btnAyudas.setAttribute("data-i18n", clave);
    btnAyudas.textContent = T(clave);
  }
  var sinAyudasIni = false;
  try { sinAyudasIni = localStorage.getItem(AYUDAS_KEY) === "1"; } catch (e) { /* sin persistencia */ }
  aplicarAyudas(sinAyudasIni);
  btnAyudas.addEventListener("click", function () {
    var sin = !document.body.classList.contains("sin-ayudas");
    aplicarAyudas(sin);
    try { localStorage.setItem(AYUDAS_KEY, sin ? "1" : "0"); } catch (e) { /* sin persistencia */ }
  });

  /* Modo claro (29-09-2026, pedido del usuario): la herramienta va en oscuro
     siempre y el claro se elige en el menú ⋮, debajo del idioma. Pone la
     clase "tema-claro" en <html> (ver style.css). Se recuerda en este
     dispositivo, como «Ocultar ayudas». */
  var TEMA_KEY = "mio_ionm_tema_claro_v1";
  var btnTema = document.getElementById("btn-tema");
  function aplicarTema(claro) {
    document.documentElement.classList.toggle("tema-claro", claro);
    var clave = claro ? "btn_tema_oscuro" : "btn_tema_claro";
    btnTema.setAttribute("data-i18n", clave);
    btnTema.textContent = T(clave);
  }
  var temaClaroIni = false;
  try { temaClaroIni = localStorage.getItem(TEMA_KEY) === "1"; } catch (e) { /* sin persistencia */ }
  aplicarTema(temaClaroIni);
  btnTema.addEventListener("click", function () {
    var claro = !document.documentElement.classList.contains("tema-claro");
    aplicarTema(claro);
    try { localStorage.setItem(TEMA_KEY, claro ? "1" : "0"); } catch (e) { /* sin persistencia */ }
  });

  /* ---------------------------------------------------------------- *
   * Ventana docente: miotomas
   *
   * Un ejercicio, no una calculadora: el alumno elige los niveles que abarca
   * la cirugía, ve qué músculos dependen de esas raíces y decide cuáles
   * monitorizaría. La herramienta no elige por él; solo le dice al final qué
   * niveles se le han quedado sin cubrir, que es donde está el aprendizaje.
   *
   * No toca ni el montaje ni los casos: es una ventana aparte a propósito.
   * ---------------------------------------------------------------- */
  var dlgDocente = document.getElementById("pantalla-docente");
  var DOCENTE_KEY = "mio_ionm_docente_v1";
  var docenteNiveles = [];    // niveles marcados en la columna
  var docenteElegidos = [];   // ids de miotoma llevados a la derecha

  // C1-C7, T1-T12, L1-L5, S1-S5: la columna entera, como pidió el usuario
  function vertebras() {
    var v = [];
    [["C", 7], ["T", 12], ["L", 5], ["S", 5]].forEach(function (par) {
      for (var i = 1; i <= par[1]; i++) v.push(par[0] + i);
    });
    return v;
  }

  function cargarDocente() {
    try {
      var g = JSON.parse(localStorage.getItem(DOCENTE_KEY) || "null");
      if (g) {
        docenteNiveles = g.niveles || [];
        docenteElegidos = g.elegidos || [];
        if (g.cama_posicion) camaPosicion = g.cama_posicion;
        if (g.cama_zonas) {
          ZONAS_CAMA.forEach(function (z) { camaZonas[z] = g.cama_zonas[z] || []; });
        }
      }
    } catch (e) { /* sin ejercicio guardado */ }
  }

  function guardarDocente() {
    // Solo en este navegador: es un ejercicio, no un dato del equipo, y no
    // tiene por qué viajar a la sincronización ni ensuciar el repositorio.
    try {
      localStorage.setItem(DOCENTE_KEY, JSON.stringify({
        niveles: docenteNiveles, elegidos: docenteElegidos,
        cama_posicion: camaPosicion, cama_zonas: camaZonas
      }));
    } catch (e) { /* sin persistencia */ }
  }

  function miotomaPorId(id) {
    return MIOTOMAS.filter(function (m) { return m.id === id; })[0] || null;
  }

  // Los que dependen de alguno de los niveles marcados
  function miotomasDeNiveles() {
    if (!docenteNiveles.length) return [];
    return MIOTOMAS.filter(function (m) {
      return (m.niveles || []).some(function (n) {
        return docenteNiveles.indexOf(n) !== -1;
      });
    });
  }

  function renderDocenteVertebras() {
    var cont = document.getElementById("docente-vertebras");
    cont.innerHTML = "";
    // Qué niveles quedan cubiertos por lo ya elegido, para pintarlos distinto
    var cubiertos = {};
    docenteElegidos.forEach(function (id) {
      var m = miotomaPorId(id);
      if (m) (m.niveles || []).forEach(function (n) { cubiertos[n] = true; });
    });

    vertebras().forEach(function (v) {
      var b = document.createElement("button");
      b.type = "button";
      var marcado = docenteNiveles.indexOf(v) !== -1;
      b.className = "vertebra" + (marcado ? " marcada" : "") +
        (marcado && cubiertos[v] ? " cubierta" : "");
      b.textContent = v;
      b.addEventListener("click", function () {
        var i = docenteNiveles.indexOf(v);
        if (i === -1) docenteNiveles.push(v); else docenteNiveles.splice(i, 1);
        guardarDocente();
        renderDocente();
      });
      cont.appendChild(b);
    });
  }

  function renderDocenteListas() {
    var izq = document.getElementById("docente-posibles");
    var der = document.getElementById("docente-elegidos");
    izq.innerHTML = "";
    der.innerHTML = "";

    document.getElementById("docente-nivel-pista").textContent = docenteNiveles.length
      ? T("docente_nivel_pista", { niveles: docenteNiveles.join(", ") })
      : "";

    function tarjeta(m, elegido) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "miotoma" + (elegido ? " elegido" : "");
      var n = document.createElement("span");
      n.className = "miotoma-nombre";
      n.textContent = m.nombre;
      var niv = document.createElement("span");
      niv.className = "miotoma-niveles";
      niv.textContent = (m.niveles || []).join(" · ");
      b.appendChild(n);
      b.appendChild(niv);
      // El detalle clínico (solapamientos, agrupaciones, citas) va en el
      // tooltip: en la tarjeta apenas cabe el nombre y el nivel, y es
      // justo el tipo de matiz que conviene leer, no memorizar de un vistazo.
      if (m.nota) b.title = m.nota;
      b.addEventListener("click", function () {
        if (elegido) {
          docenteElegidos = docenteElegidos.filter(function (x) { return x !== m.id; });
        } else if (docenteElegidos.indexOf(m.id) === -1) {
          docenteElegidos.push(m.id);
        }
        guardarDocente();
        renderDocente();
      });
      return b;
    }

    var posibles = miotomasDeNiveles().filter(function (m) {
      return docenteElegidos.indexOf(m.id) === -1;
    });
    if (!docenteNiveles.length) {
      izq.appendChild(pistaVacia(T("docente_sin_nivel")));
    } else if (!posibles.length) {
      izq.appendChild(pistaVacia(T("docente_sin_musculos")));
    } else {
      posibles.forEach(function (m) { izq.appendChild(tarjeta(m, false)); });
    }

    if (!docenteElegidos.length) {
      der.appendChild(pistaVacia(T("docente_nada_elegido")));
    } else {
      docenteElegidos.forEach(function (id) {
        var m = miotomaPorId(id);
        if (m) der.appendChild(tarjeta(m, true));
      });
    }

    renderDocenteCobertura();
  }

  function pistaVacia(texto) {
    var p = document.createElement("p");
    p.className = "empty-hint";
    p.textContent = texto;
    return p;
  }

  /* Lo único que corrige la herramienta: qué niveles marcados se quedan sin
     ningún músculo que los cubra. No dice cuál poner -esa es la decisión que
     se está aprendiendo-, solo dónde queda un hueco. */
  function renderDocenteCobertura() {
    var el = document.getElementById("docente-cobertura");
    if (!docenteNiveles.length || !docenteElegidos.length) { el.textContent = ""; return; }
    var cubiertos = {};
    docenteElegidos.forEach(function (id) {
      var m = miotomaPorId(id);
      if (m) (m.niveles || []).forEach(function (n) { cubiertos[n] = true; });
    });
    var faltan = docenteNiveles.filter(function (n) { return !cubiertos[n]; });
    el.textContent = faltan.length
      ? T("docente_cobertura_falta", { niveles: faltan.join(", ") })
      : T("docente_cobertura_ok", { n: docenteNiveles.length });
    el.className = "docente-pista" + (faltan.length ? " falta" : " ok");
  }

  function renderDocente() {
    renderDocenteVertebras();
    renderDocenteListas();
  }

  /* ---- Cama de quirófano ------------------------------------------ *
   * Dónde cae cada caja según cómo esté colocado el paciente. Lo que se
   * practica es que el cable llegue: una caja en los pies no sirve para los
   * electrodos de la cabeza, y con el paciente en prono o sentado el sitio
   * cambia respecto a supino.
   * ------------------------------------------------------------------ */
  var POSICIONES_CAMA = ["supino", "supino_brazos", "prono", "sentado"];
  var ZONAS_CAMA = ["cabecera", "izq", "der", "pies"];
  var camaPosicion = "supino";
  var camaZonas = { cabecera: [], izq: [], der: [], pies: [] };
  var camaSeleccion = null;

  /* El dibujo es esquemático a propósito: una vista cenital de la mesa con el
     paciente encima. No pretende ser anatómico, solo dejar claro dónde queda
     la cabeza, dónde los pies y por dónde salen los brazos, que es lo que
     decide a qué distancia hay que poner cada caja.
     Es marcado fijo, sin ningún dato interpolado, así que va por innerHTML
     sin el riesgo que tiene concatenar texto del usuario. */
  var DIBUJOS_CAMA = {
    supino:
      '<rect class="mesa" x="26" y="8" width="68" height="244" rx="7"/>' +
      '<circle class="cuerpo" cx="60" cy="40" r="14"/>' +
      '<rect class="cuerpo" x="44" y="56" width="32" height="72" rx="5"/>' +
      '<rect class="cuerpo" x="33" y="60" width="9" height="62" rx="4"/>' +
      '<rect class="cuerpo" x="78" y="60" width="9" height="62" rx="4"/>' +
      '<rect class="cuerpo" x="47" y="130" width="11" height="94" rx="5"/>' +
      '<rect class="cuerpo" x="62" y="130" width="11" height="94" rx="5"/>',
    supino_brazos:
      '<rect class="mesa" x="26" y="8" width="68" height="244" rx="7"/>' +
      '<rect class="soporte" x="2" y="58" width="26" height="16" rx="4"/>' +
      '<rect class="soporte" x="92" y="58" width="26" height="16" rx="4"/>' +
      '<circle class="cuerpo" cx="60" cy="40" r="14"/>' +
      '<rect class="cuerpo" x="44" y="56" width="32" height="72" rx="5"/>' +
      '<rect class="cuerpo" x="6" y="61" width="38" height="10" rx="5"/>' +
      '<rect class="cuerpo" x="76" y="61" width="38" height="10" rx="5"/>' +
      '<rect class="cuerpo" x="47" y="130" width="11" height="94" rx="5"/>' +
      '<rect class="cuerpo" x="62" y="130" width="11" height="94" rx="5"/>',
    prono:
      '<rect class="mesa" x="26" y="8" width="68" height="244" rx="7"/>' +
      '<circle class="cuerpo prono" cx="60" cy="40" r="14"/>' +
      // La cara mira a un lado: es lo que distingue el prono de un vistazo
      '<circle class="marca" cx="50" cy="40" r="3.5"/>' +
      '<rect class="cuerpo prono" x="44" y="56" width="32" height="72" rx="5"/>' +
      '<rect class="cuerpo prono" x="33" y="60" width="9" height="62" rx="4"/>' +
      '<rect class="cuerpo prono" x="78" y="60" width="9" height="62" rx="4"/>' +
      '<rect class="cuerpo prono" x="47" y="130" width="11" height="94" rx="5"/>' +
      '<rect class="cuerpo prono" x="62" y="130" width="11" height="94" rx="5"/>',
    sentado:
      // Respaldo levantado: la mesa deja de ser un rectángulo
      '<path class="mesa" d="M26 8 h68 v104 h-24 v140 h-44 z" />' +
      '<circle class="cuerpo" cx="60" cy="36" r="14"/>' +
      '<rect class="cuerpo" x="44" y="52" width="32" height="58" rx="5"/>' +
      '<rect class="cuerpo" x="33" y="56" width="9" height="52" rx="4"/>' +
      '<rect class="cuerpo" x="78" y="56" width="9" height="52" rx="4"/>' +
      '<rect class="cuerpo" x="40" y="112" width="34" height="16" rx="6"/>' +
      '<rect class="cuerpo" x="47" y="128" width="11" height="96" rx="5"/>' +
      '<rect class="cuerpo" x="62" y="128" width="11" height="96" rx="5"/>'
  };

  function renderCamaPosiciones() {
    var cont = document.getElementById("cama-posiciones");
    cont.innerHTML = "";
    POSICIONES_CAMA.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip chip-escenario" + (p === camaPosicion ? " activo" : "");
      b.textContent = T("pos_" + p);
      b.addEventListener("click", function () {
        camaPosicion = p;
        guardarDocente();
        renderCama();
      });
      cont.appendChild(b);
    });
  }

  function renderCamaMesa() {
    var mesa = document.getElementById("cama-mesa");
    mesa.innerHTML = '<svg viewBox="0 0 120 260" class="cama-svg" aria-hidden="true">' +
      (DIBUJOS_CAMA[camaPosicion] || DIBUJOS_CAMA.supino) + "</svg>";
  }

  function camaColocadas() {
    var puestas = {};
    ZONAS_CAMA.forEach(function (z) {
      (camaZonas[z] || []).forEach(function (k) { puestas[k] = z; });
    });
    return puestas;
  }

  function chipCaja(cajaKey, enZona) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cama-caja" + (camaSeleccion === cajaKey ? " seleccionada" : "");
    b.textContent = infoCaja(cajaKey).nombre;
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      if (enZona) {
        // Pulsar una colocada la devuelve a la lista de abajo
        ZONAS_CAMA.forEach(function (z) {
          camaZonas[z] = (camaZonas[z] || []).filter(function (k) { return k !== cajaKey; });
        });
        camaSeleccion = null;
      } else {
        camaSeleccion = camaSeleccion === cajaKey ? null : cajaKey;
      }
      guardarDocente();
      renderCama();
    });
    return b;
  }

  function renderCamaZonas() {
    var puestas = camaColocadas();
    ZONAS_CAMA.forEach(function (z) {
      var zona = document.querySelector('.cama-zona[data-zona="' + z + '"]');
      var cajas = zona.querySelector(".cama-zona-cajas");
      cajas.innerHTML = "";
      (camaZonas[z] || []).forEach(function (k) { cajas.appendChild(chipCaja(k, true)); });
      zona.classList.toggle("recibe", !!camaSeleccion);
    });

    var disp = document.getElementById("cama-disponibles");
    disp.innerHTML = "";
    var sueltas = Object.keys(CAJAS).filter(function (k) { return !puestas[k]; });
    if (!sueltas.length) {
      disp.appendChild(pistaVacia(T("cama_todas")));
    } else {
      sueltas.forEach(function (k) { disp.appendChild(chipCaja(k, false)); });
    }

    var total = Object.keys(CAJAS).length;
    document.getElementById("cama-pista").textContent = camaSeleccion
      ? T("cama_elige_zona", { caja: infoCaja(camaSeleccion).nombre })
      : T("cama_reparto", { repartidas: total - sueltas.length, total: total });
  }

  // Un solo listener en el tablero en vez de uno por zona: las zonas se
  // repintan enteras en cada cambio y volverían a engancharse cada vez.
  document.querySelector(".cama-tablero").addEventListener("click", function (e) {
    var zona = e.target.closest(".cama-zona");
    if (!zona || !camaSeleccion) return;
    var z = zona.dataset.zona;
    camaZonas[z] = (camaZonas[z] || []).concat([camaSeleccion]);
    camaSeleccion = null;
    guardarDocente();
    renderCama();
  });

  function renderCama() {
    renderCamaPosiciones();
    renderCamaMesa();
    renderCamaZonas();
  }

  // Pestañas de la ventana docente
  document.getElementById("docente-pestanas").addEventListener("click", function (e) {
    var b = e.target.closest(".pestana");
    if (!b) return;
    var pane = b.dataset.pane;
    [].forEach.call(this.querySelectorAll(".pestana"), function (x) {
      x.classList.toggle("activa", x === b);
    });
    document.getElementById("pane-miotomas").hidden = pane !== "miotomas";
    document.getElementById("pane-cama").hidden = pane !== "cama";
    // Teoría básica sigue "en construcción" (Fase 7, 06-09-2026), sin render
    // propio.
    document.getElementById("pane-teoria").hidden = pane !== "teoria";
    if (pane === "cama") renderCama();
  });

  /* ---------------------------------------------------------------- *
   * Docencia > Material (24-09-2026): todo el catálogo de material -el de
   * fábrica más el propio del usuario, ya fusionados en CATALOGO-, en filas
   * una debajo de otra y agrupado por categoría, con una breve descripción.
   * La descripción es la `nota` del ítem; si no tiene, se compone SOLO con
   * datos que ya están en el catálogo (tipo físico, si es reutilizable, si
   * comparte paquete...) -no se inventa ninguna descripción clínica-.
   * ---------------------------------------------------------------- */
  function descripcionMaterial(item) {
    // Lo que es del tipo físico -su nombre, si gasta 2 unidades, si es
    // reutilizable- ya no se repite en cada fila (27-09-2026, pedido del
    // usuario): va una sola vez en la leyenda de debajo del buscador, ver
    // pintarLeyendaMaterial(). Aquí queda solo lo propio del ítem.
    var partes = [];
    var nota = campo(item, "nota");
    if (nota) partes.push(nota.replace(/\.?$/, "."));
    if (item.media_unidad) partes.push(T("mat_desc_media"));
    if (item.tercio_unidad) partes.push(T("mat_desc_tercio"));
    if (item.sin_entrada) partes.push(T("mat_desc_sin_entrada"));
    if (hayVariosEquipos() && item.equipos && item.equipos.length) {
      partes.push(T("mat_desc_equipos", { equipos: item.equipos.map(nombreEquipo).join(", ") }));
    }
    return partes.join(" ");
  }

  // "Abductor pollicis brevis izquierdo" -> "Abductor pollicis brevis"; y en
  // inglés "Left abductor..." -> "Abductor...". Para la fila L./R. de Material.
  function descripcionSinLado(d) {
    var r = String(d || "")
      .replace(/\s+(izquierd|derech)[oa]s?\b/gi, "")
      .replace(/\b(left|right)\s+/gi, "")
      .replace(/\s{2,}/g, " ").trim();
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  // Leyenda de tipos físicos: un chip por tipo usado en el catálogo, con el
  // mismo borde y color que llevan los ítems de ese tipo en la lista.
  function pintarLeyendaMaterial() {
    var cont = document.getElementById("docente-material-leyenda");
    cont.textContent = "";
    var vistos = {}, tipos = [];
    CATALOGO.forEach(function (g) {
      g.items.forEach(function (it) {
        var etq = etiquetaDe(it, null);
        if (etq && !vistos[etq.id]) { vistos[etq.id] = true; tipos.push(etq); }
      });
    });
    var tit = document.createElement("span");
    tit.className = "mat-leyenda-tit";
    tit.textContent = T("mat_leyenda");
    cont.appendChild(tit);
    tipos.forEach(function (etq) {
      var chip = document.createElement("span");
      chip.className = "chip mat-leyenda-chip";
      aplicarEstilo(chip, estiloDe({ etiqueta: etq.id }, null));
      chip.appendChild(document.createTextNode(campo(etq, "nombre")));
      [[etq.doble, "mat_leyenda_doble"], [etq.fungible === false, "mat_leyenda_reutilizable"]].forEach(function (m) {
        if (!m[0]) return;
        var marca = document.createElement("small");
        marca.className = "mat-leyenda-marca";
        marca.textContent = T(m[1]);
        marca.title = T(m[1] + "_tit");
        chip.appendChild(marca);
      });
      cont.appendChild(chip);
    });
  }

  // Series de contactos que en Material van en una sola fila. "re" saca la
  // clave de la serie (grupo 1) del nombre de cada contacto; "nombre" y
  // "desc" rehacen el rótulo y la descripción del primero para la serie.
  var SERIES_MATERIAL = [
    // Mantas GRID: "GRID A.1".."GRID A.8" -> "GRID A (1–8)"
    { re: /^(GRID [A-Z])\.(\d+)$/,
      nombre: function (k, n) { return k + " (1–" + n + ")"; },
      desc: function (d, n) { return d.replace(/^Contacto \d+/, "Contactos 1–" + n).replace(/^Contact \d+/, "Contacts 1–" + n); } },
    // Onda D: "Px.1DW".."Px.3DW" -> "Px.1–3DW" (igual el distal, Dst)
    { re: /^((?:Px|Dst)\.)\d+DW$/,
      nombre: function (k, n) { return k + "1–" + n + "DW"; },
      // El paréntesis "(Px.1DW + Px.2DW + Px.3DW = 1 kit)" sobra: lo dice ya
      // la frase de tercio_unidad que va detrás.
      desc: function (d, n) {
        return d.replace(/contacto \d+ de \d+/, "contactos 1–" + n).replace(/contact \d+ of \d+/, "contacts 1–" + n)
          .replace(/\s*\([^)]*= 1 kit\)/, "");
      } }
  ];

  // Inervación que se enseña en Material (27-09-2026, pedido del usuario):
  // las raíces salen de MIOTOMAS (el mismo dato de Docencia, enlazado por
  // "item" al músculo izquierdo; el derecho usa el de su L.) y el par
  // craneal del campo "par" del catálogo. Sin dato, no se pinta nada.
  function inervacionMaterial(item) {
    if (!item) return null;
    // "inerv": texto propio cuando no basta con un par (geniohioideo: C1 vía XII)
    if (item.inerv) return { texto: campo(item, "inerv"), tit: T("mat_par_tit") };
    if (item.par) return { texto: T("mat_par", { par: item.par }), tit: T("mat_par_tit") };
    var id = String(item.id || "").replace(/^r_/, "l_");
    for (var i = 0; i < MIOTOMAS.length; i++) {
      var m = MIOTOMAS[i];
      if (m.item === id && (m.niveles || []).length) {
        var n = m.niveles;
        return { texto: n.length > 1 ? n[0] + "–" + n[n.length - 1] : n[0], tit: T("mat_raices_tit") };
      }
    }
    return null;
  }

  function renderDocenteMaterial() {
    pintarLeyendaMaterial();
    var cont = document.getElementById("docente-material-lista");
    cont.textContent = "";
    var busq = (document.getElementById("docente-material-buscar").value || "").toLowerCase();
    var total = 0, mostrados = 0;
    CATALOGO.forEach(function (grupo) {
      // L. y R. en una sola fila (27-09-2026, pedido del usuario): los pares
      // l_<x>/r_<x> de una misma categoría salen como "L./R.<x>" con la
      // descripción sin el lado, para no repetir cada concepto dos veces.
      var ids = {};
      grupo.items.forEach(function (item) { ids[item.id] = item; });
      var filas = [];
      var mantas = {};
      grupo.items.forEach(function (item) {
        var m = /^([lr])_(.+)$/.exec(item.id || "");
        var par = m ? ids[(m[1] === "l" ? "r_" : "l_") + m[2]] : null;
        if (par && m[1] === "r") return;   // ya va en la fila de su L.
        var etq = etiquetaDe(item, null);
        var nombre = campo(item, "nombre");
        var desc = descripcionMaterial(item);
        // Series de contactos de un mismo electrodo (pedido del usuario):
        // una fila por serie en vez de una por contacto, ver SERIES_MATERIAL.
        var serie = null, ms = null;
        for (var si = 0; si < SERIES_MATERIAL.length && !ms; si++) {
          ms = SERIES_MATERIAL[si].re.exec(nombre);
          if (ms) serie = SERIES_MATERIAL[si];
        }
        if (ms) {
          var fg = mantas[ms[1]];
          if (fg) { fg.contactos.push(item); return; }
          fg = mantas[ms[1]] = { item: item, par: null, contactos: [item], serie: serie, clave: ms[1],
            nombre: nombre, tipo: etq ? campo(etq, "nombre") : "", desc: desc };
          filas.push(fg);
          return;
        }
        if (par) {
          nombre = nombre.replace(/^L\.\s*/, "L./R.");
          desc = descripcionSinLado(desc);
        }
        filas.push({ item: item, par: par, nombre: nombre, tipo: etq ? campo(etq, "nombre") : "", desc: desc,
                     inerv: inervacionMaterial(item) });
      });
      Object.keys(mantas).forEach(function (k) {
        var fg = mantas[k], n = fg.contactos.length;
        if (n < 2) return;
        fg.nombre = fg.serie.nombre(k, n);
        fg.desc = fg.serie.desc(String(fg.desc), n);
      });
      total += filas.length;
      filas = filas.filter(function (f) {
        if (!busq) return true;
        var texto = f.nombre + " " + campo(f.item, "nombre") + " " + (f.par ? campo(f.par, "nombre") : "") + " " +
          (f.contactos || []).map(function (x) { return campo(x, "nombre"); }).join(" ") + " " + f.tipo + " " + f.desc +
          (f.inerv ? " " + f.inerv.texto : "");
        return texto.toLowerCase().indexOf(busq) !== -1;
      });
      if (!filas.length) return;
      mostrados += filas.length;
      var det = document.createElement("details");
      det.className = "caso-grupo";
      det.open = !!busq;   // con búsqueda se abren solas las categorías con resultados
      var sum = document.createElement("summary");
      var tit = document.createElement("span");
      tit.textContent = (idioma !== "es" && grupo.categoria_en) ? grupo.categoria_en : grupo.categoria;
      var cuenta = document.createElement("span");
      cuenta.className = "reg-cuenta";
      cuenta.textContent = String(filas.length);
      sum.appendChild(tit);
      sum.appendChild(cuenta);
      det.appendChild(sum);
      var cuerpo = document.createElement("div");
      cuerpo.className = "caso-grupo-campos";
      var matSeparado = false;
      filas.forEach(function (f, i) {
        if (!matSeparado && i > 0 && f.item.ampliacion) {
          matSeparado = true;
          cuerpo.appendChild(separadorAmpliacion("mat-separador"));
        }
        var fila = document.createElement("div");
        fila.className = "mat-fila";
        var nom = document.createElement("span");
        nom.className = "chip mat-chip";
        aplicarEstilo(nom, estiloDe(f.item, null));
        if (f.item.color) {
          var dot = document.createElement("span");
          dot.className = "color-dot color-" + f.item.color;
          nom.appendChild(dot);
        }
        nom.appendChild(document.createTextNode(f.nombre));
        fila.appendChild(nom);
        var inerv = document.createElement("span");
        inerv.className = "mat-inerv";
        if (f.inerv) { inerv.textContent = f.inerv.texto; inerv.title = f.inerv.tit; }
        fila.appendChild(inerv);
        var desc = document.createElement("span");
        desc.className = "mat-desc";
        desc.textContent = f.desc;
        fila.appendChild(desc);
        var fotoItem = f.item.foto ? f.item : (f.par && f.par.foto ? f.par : null);
        if (fotoItem) {
          var foto = document.createElement("button");
          foto.type = "button";
          foto.className = "chip-foto";
          foto.textContent = "📷";
          foto.title = T("chip_foto_tit");
          foto.addEventListener("click", function () { abrirFotoSonda(fotoItem.foto, campo(fotoItem, "nombre")); });
          fila.appendChild(foto);
        }
        cuerpo.appendChild(fila);
      });
      det.appendChild(cuerpo);
      cont.appendChild(det);
    });
    if (!mostrados) {
      var vacio = document.createElement("p");
      vacio.className = "empty-hint";
      vacio.textContent = T("docente_material_sin");
      cont.appendChild(vacio);
    }
    document.getElementById("docente-material-cuenta").textContent =
      T("docente_material_cuenta", { n: mostrados, total: total });
  }
  document.getElementById("docente-material-buscar").addEventListener("input", renderDocenteMaterial);

  document.getElementById("docente-limpiar-niveles").addEventListener("click", function () {
    docenteNiveles = [];
    guardarDocente();
    renderDocente();
  });
  document.getElementById("docente-reiniciar").addEventListener("click", function () {
    if (!confirm(T("docente_reiniciar_conf"))) return;
    docenteNiveles = [];
    docenteElegidos = [];
    camaSeleccion = null;
    ZONAS_CAMA.forEach(function (z) { camaZonas[z] = []; });
    guardarDocente();
    renderDocente();
    renderCama();
  });

  /* ================================================================ *
   * Checklist pre-quirúrgico (19/20-09-2026, pedido por el usuario): lista
   * de comprobación para no olvidar nada antes de empezar la
   * monitorización, en 5 momentos desde la planificación hasta el campo
   * abierto. Contenido y agrupación dados por el usuario; los ítems
   * marcados "(añadido)" abajo son sugerencias propias hechas al revisar el
   * listado, aceptadas tácitamente al seguir adelante con el diseño -si
   * alguno sobra, se quita con una línea-.
   *
   * Dos modos, elegidos con el desplegable de la pantalla:
   *  - "Modelo 0" (sin caso): checklist de trabajo suelta, sin vincular a
   *    ningún caso -mismo patrón que el Simulador: su propio localStorage,
   *    sin sincronizar, se resetea a mano con "Vaciar"-.
   *  - Vinculada a un caso: los valores viven dentro del propio caso
   *    (`checklist_prequirurgico`, ver casoVacio()), así que viajan con
   *    él -se sincronizan, los ve cualquier dispositivo que baje ese
   *    caso- y dos cirugías en preparación a la vez no se pisan.
   * checklistValores() decide sola en cuál de los dos escribe según
   * checklistCasoUid; el resto del código no repite esa condición.
   *
   * Fuentes citadas por el usuario: Møller cap.18 ("Preparing the Patient
   * for Monitoring"); contraindicaciones relativas de TES: MacDonald 2013
   * ASNM y Neurophysiology in Neurosurgery 2ed cap.41; coordinación
   * anestésica: Neurophysiology in Neurosurgery 2ed cap.19.
   * ================================================================ */
  var CHECKLIST_KEY = "mio_ionm_checklist_v1";
  var CHECKLIST_GRUPOS = ["planificacion", "dia_antes", "induccion", "posicionamiento", "comunicacion"];
  var CHECKLIST_ITEMS = [
    { id: "hist_clinica", g: "planificacion" },
    { id: "examen_neuro", g: "planificacion" },
    { id: "contraindicaciones_tes", g: "planificacion" },
    { id: "consentimiento", g: "planificacion" },            // (añadido)
    { id: "definir_modalidades", g: "planificacion" },
    { id: "plan_anestesico", g: "planificacion" },
    { id: "montar_equipo", g: "dia_antes" },
    { id: "preconfigurar_protocolo", g: "dia_antes" },
    { id: "material_disponible", g: "dia_antes" },            // (añadido)
    { id: "electrodos_antes_drapeado", g: "induccion" },
    { id: "bloque_mordida", g: "induccion" },
    { id: "impedancias", g: "induccion" },
    { id: "estado_estable_anestesico", g: "induccion" },      // (añadido)
    { id: "registro_basal_supino", g: "induccion" },
    { id: "registro_tras_posicionamiento", g: "posicionamiento" },
    { id: "nervios_perifericos_riesgo", g: "posicionamiento" }, // (añadido)
    { id: "basal_definitiva", g: "posicionamiento" },
    { id: "confirmar_decusacion", g: "posicionamiento" },
    { id: "aviso_bolo_anestesia", g: "comunicacion" },
    { id: "timing_maniobras_cirujano", g: "comunicacion" }
  ];

  var checklistModeloCero = { valores: {} };
  var checklistCasoUid = null; // null = Modelo 0
  var checklistCargado = false;

  function checklistCargar() {
    try {
      var g = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "null");
      if (g && g.valores) checklistModeloCero = g;
    } catch (e) { /* sin persistencia */ }
    checklistCargado = true;
  }
  function checklistGuardarModeloCero() {
    try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklistModeloCero)); } catch (e) { /* sin persistencia */ }
  }

  // Único punto que decide dónde viven los valores -Modelo 0 o el caso
  // elegido-, para que el resto del render/marcado no repita la condición.
  function checklistValores() {
    if (checklistCasoUid && casos[checklistCasoUid]) {
      var c = casos[checklistCasoUid];
      if (!c.checklist_prequirurgico) c.checklist_prequirurgico = {};
      return c.checklist_prequirurgico;
    }
    return checklistModeloCero.valores;
  }

  function checklistMarcar(itemId, marcado) {
    var valores = checklistValores();
    if (marcado) valores[itemId] = true; else delete valores[itemId];
    if (checklistCasoUid && casos[checklistCasoUid]) guardarCaso(casos[checklistCasoUid]);
    else checklistGuardarModeloCero();
    renderChecklistProgreso();
  }

  // "Planificación del caso" (texto pegado e imagen-resumen, 20-09-2026)
  // retirada el 27-09-2026: el usuario no la usaba y ningún caso tenía nada.
  // Las claves "notas"/"imagenes" que pudieran quedar en checklist_prequirurgico
  // se ignoran (las fotos las sigue tratando la parte genérica de IndexedDB).

  // Mismos colores que el borde de ".caso-fila.estado-*" (negro/amarillo/
  // verde/rojo). Un <option> no admite color de forma fiable -el selector nativo
  // del móvil lo ignora, y con variables CSS tampoco en escritorio-, así que
  // el color va como círculo en el propio texto, que se ve en todas partes.
  /* Selector de caso propio para "Vincular a un caso" (Checklist y Registro),
     27-09-2026. El <select> nativo se veía bien cerrado, pero su lista la
     dibuja el sistema -en el móvil con la letra del sistema y los círculos
     de MARCA_ESTADO_CASO como emojis-, que no pega con el resto de la app
     (pedido del usuario). Este botón + lista usa la letra y los colores de
     la app. El <select> sigue ahí, oculto, como fuente de verdad: elegir
     aquí pone su value y dispara "change", así que el resto del código no
     cambia. Cada render de opciones llama a refrescarSelectorCaso(). */
  function mejorarSelectorCaso(sel) {
    if (!sel || sel._selCaso) return;
    var caja = document.createElement("div");
    caja.className = "sel-caso";
    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = "sel-caso-boton";
    boton.id = sel.id + "-boton";
    boton.setAttribute("aria-haspopup", "listbox");
    boton.setAttribute("aria-expanded", "false");
    var lista = document.createElement("div");
    lista.className = "sel-caso-lista";
    lista.setAttribute("role", "listbox");
    lista.hidden = true;
    sel.parentNode.insertBefore(caja, sel);
    caja.appendChild(boton);
    caja.appendChild(lista);
    caja.appendChild(sel);
    sel.classList.add("sel-caso-nativo");
    sel.tabIndex = -1;
    sel.setAttribute("aria-hidden", "true");
    // La etiqueta apuntaba al <select>; ahora al botón, que es lo que se ve
    var etiqueta = document.querySelector('label[for="' + sel.id + '"]');
    if (etiqueta) etiqueta.setAttribute("for", boton.id);

    function cerrar() {
      lista.hidden = true;
      boton.setAttribute("aria-expanded", "false");
    }
    function abrir() {
      lista.textContent = "";
      Array.prototype.forEach.call(sel.options, function (op) {
        var it = document.createElement("button");
        it.type = "button";
        it.className = "sel-caso-item" + (op.value === sel.value ? " activo" : "");
        it.setAttribute("role", "option");
        it.setAttribute("aria-selected", op.value === sel.value ? "true" : "false");
        pintarOpcionCaso(it, op);
        it.addEventListener("click", function () {
          cerrar();
          boton.focus();
          if (sel.value === op.value) return;
          sel.value = op.value;
          refrescarSelectorCaso(sel);
          sel.dispatchEvent(new Event("change"));
        });
        lista.appendChild(it);
      });
      lista.hidden = false;
      boton.setAttribute("aria-expanded", "true");
      var act = lista.querySelector(".activo");
      if (act) act.scrollIntoView({ block: "nearest" });
    }
    boton.addEventListener("click", function () {
      if (lista.hidden) abrir(); else cerrar();
    });
    document.addEventListener("click", function (e) {
      if (!lista.hidden && !caja.contains(e.target)) cerrar();
    });
    caja.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lista.hidden) { cerrar(); boton.focus(); }
    });
    sel._selCaso = { boton: boton, cerrar: cerrar };
    refrescarSelectorCaso(sel);
  }

  // Punto de color del estado + "ID — nombre". Sin estado (Modelo 0), sin punto.
  function pintarOpcionCaso(nodo, op) {
    nodo.textContent = "";
    var estado = op ? op.getAttribute("data-estado") : "";
    if (estado) {
      var punto = document.createElement("span");
      punto.className = "sel-caso-punto estado-" + estado;
      nodo.appendChild(punto);
    }
    var txt = document.createElement("span");
    txt.className = "sel-caso-texto";
    txt.textContent = op ? (op.getAttribute("data-texto") || op.textContent) : "";
    nodo.appendChild(txt);
  }

  function refrescarSelectorCaso(sel) {
    if (!sel || !sel._selCaso) return;
    sel._selCaso.cerrar();
    pintarOpcionCaso(sel._selCaso.boton, sel.options[sel.selectedIndex]);
  }

  /* Lista propia para TODOS los desplegables (27-09-2026, pedido del
     usuario tras el de "Vincular a un caso"). El <select> cerrado se queda
     como está -mismo sitio, mismo CSS, ya con la letra de la app-; lo único
     que se sustituye es la lista que se abre, que el navegador dibuja con la
     letra del sistema. Un solo manejador en document, en fase de captura,
     así vale también para los <select> que se crean al vuelo (ficha,
     Registro, Catálogos, apuntes...) sin tener que acordarse de nada al
     crear uno nuevo. Elegir pone el índice y dispara "input" y "change",
     como el nativo. Quedan fuera los múltiples o con size, los marcados
     data-nativo y los ya sustituidos por mejorarSelectorCaso(). */
  var selAbierto = null;   // { sel, lista } de la lista abierta ahora
  var selToque = null;     // { sel, x, y }: <select> y punto donde empezó el toque

  function selEsPropio(el) {
    return !!el && el.tagName === "SELECT" && !el.multiple && !(el.size > 1) &&
      !el.hasAttribute("data-nativo") && !el.classList.contains("sel-caso-nativo");
  }

  function cerrarListaSelect(devolverFoco) {
    if (!selAbierto) return;
    var a = selAbierto;
    selAbierto = null;
    if (a.lista.parentNode) a.lista.parentNode.removeChild(a.lista);
    if (devolverFoco) a.sel.focus({ preventScroll: true });
  }

  function abrirListaSelect(sel) {
    cerrarListaSelect(false);
    if (sel.disabled || !sel.options.length) return;
    var lista = document.createElement("div");
    lista.className = "sel-caso-lista sel-flotante";
    lista.setAttribute("role", "listbox");
    Array.prototype.forEach.call(sel.options, function (op, i) {
      if (op.hidden) return;
      var it = document.createElement("button");
      it.type = "button";
      it.className = "sel-caso-item" + (i === sel.selectedIndex ? " activo" : "");
      it.setAttribute("role", "option");
      it.setAttribute("aria-selected", i === sel.selectedIndex ? "true" : "false");
      it.disabled = op.disabled;
      pintarOpcionCaso(it, op);
      it.addEventListener("click", function () {
        cerrarListaSelect(true);
        if (sel.selectedIndex === i) return;
        sel.selectedIndex = i;
        sel.dispatchEvent(new Event("input", { bubbles: true }));
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      });
      lista.appendChild(it);
    });
    // Dentro de un <dialog> modal, lo que cuelga de body queda por debajo
    // de la capa superior y no se vería: la lista va dentro del diálogo.
    (sel.closest("dialog") || document.body).appendChild(lista);
    colocarListaSelect(sel, lista);
    selAbierto = { sel: sel, lista: lista };
    var act = lista.querySelector(".activo") || lista.querySelector("button:not([disabled])");
    if (act) {
      act.scrollIntoView({ block: "nearest" });
      act.focus({ preventScroll: true });
    }
  }

  // Debajo del desplegable si cabe; si no, encima. Nunca fuera de la pantalla.
  function colocarListaSelect(sel, lista) {
    var r = sel.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var ancho = Math.min(Math.max(r.width, 200), vw - 16);
    var izq = Math.min(Math.max(8, r.left), vw - 8 - ancho);
    var abajo = vh - r.bottom - 8, arriba = r.top - 8;
    var haciaArriba = abajo < Math.min(lista.scrollHeight, 240) && arriba > abajo;
    lista.style.width = ancho + "px";
    lista.style.left = izq + "px";
    lista.style.maxHeight = Math.max(120, Math.min(haciaArriba ? arriba : abajo, vh * 0.6)) + "px";
    if (haciaArriba) lista.style.bottom = (vh - r.top + 4) + "px";
    else lista.style.top = (r.bottom + 4) + "px";
  }

  function alternarListaSelect(sel) {
    if (selAbierto && selAbierto.sel === sel) cerrarListaSelect(false);
    else abrirListaSelect(sel);
  }

  document.addEventListener("mousedown", function (e) {
    if (selEsPropio(e.target)) {
      e.preventDefault();   // sin esto se abre también la lista nativa
      alternarListaSelect(e.target);
      return;
    }
    if (selAbierto && !selAbierto.lista.contains(e.target)) cerrarListaSelect(false);
  }, true);
  // En táctil la lista propia se abre al SOLTAR, y solo si fue un toque: si
  // el dedo se movió es que se estaba desplazando la página (29-09-2026,
  // pedido del usuario: empezar el scroll sobre un desplegable lo abría en
  // vez de desplazar, porque antes se cortaba el gesto ya en touchstart).
  // El preventDefault del touchend evita la lista nativa.
  function selMovido(t) {
    return !selToque || Math.abs(t.clientX - selToque.x) > 10 || Math.abs(t.clientY - selToque.y) > 10;
  }
  document.addEventListener("touchstart", function (e) {
    if (selEsPropio(e.target) && e.touches.length === 1) {
      selToque = { sel: e.target, x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      selToque = null;
      if (selAbierto && !selAbierto.lista.contains(e.target)) cerrarListaSelect(false);
    }
  }, { capture: true, passive: true });
  document.addEventListener("touchmove", function (e) {
    if (selToque && selMovido(e.touches[0])) selToque = null;
  }, { capture: true, passive: true });
  document.addEventListener("touchcancel", function () { selToque = null; }, true);
  document.addEventListener("touchend", function (e) {
    var s = selToque;
    if (s && e.changedTouches[0] && selMovido(e.changedTouches[0])) s = null;
    selToque = null;
    if (s && e.target === s.sel) {
      e.preventDefault();
      alternarListaSelect(s.sel);
    }
  }, { capture: true, passive: false });
  document.addEventListener("keydown", function (e) {
    if (selAbierto && selAbierto.lista.contains(e.target)) {
      var items = Array.prototype.filter.call(selAbierto.lista.children, function (b) { return !b.disabled; });
      var i = items.indexOf(e.target);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        var sig = items[i + (e.key === "ArrowDown" ? 1 : -1)];
        if (sig) sig.focus();
      } else if (e.key === "Escape") {
        // Que el Escape cierre solo la lista, no el diálogo que la contiene
        e.preventDefault();
        e.stopPropagation();
        cerrarListaSelect(true);
      } else if (e.key === "Tab") {
        cerrarListaSelect(true);
      }
      return;
    }
    if (selEsPropio(e.target) && (e.key === " " || e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      abrirListaSelect(e.target);
    }
  }, true);
  window.addEventListener("scroll", function (e) {
    if (!selAbierto) return;
    if (e.target && e.target.nodeType === 1 && selAbierto.lista.contains(e.target)) return;
    cerrarListaSelect(false);
  }, true);
  window.addEventListener("resize", function () { cerrarListaSelect(false); });

  /* Mantener pulsado para ver la ayuda (29-09-2026, pedido del usuario): en
     táctil no hay «ratón encima», así que un toque largo (0,5 s) sobre algo
     con data-ayuda enseña ese texto en un globo. Al soltar, el globo se
     queda un momento para leerlo y ese toque no cuenta como pulsación (no
     marca ni desmarca el chip). Si el dedo se mueve, es scroll: nada. */
  var ayudaGlobo = null, ayudaTimer = null, ayudaToque = null;
  function quitarGloboAyuda() {
    if (ayudaTimer) { clearTimeout(ayudaTimer); ayudaTimer = null; }
    if (ayudaGlobo && ayudaGlobo.parentNode) ayudaGlobo.parentNode.removeChild(ayudaGlobo);
    ayudaGlobo = null;
  }
  function mostrarGloboAyuda(el) {
    quitarGloboAyuda();
    var g = document.createElement("div");
    g.className = "globo-ayuda";
    g.textContent = el.getAttribute("data-ayuda");
    (el.closest("dialog") || document.body).appendChild(g);
    var r = el.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    var ancho = Math.min(280, vw - 16);
    g.style.maxWidth = ancho + "px";
    g.style.left = Math.max(8, Math.min(r.left, vw - 8 - g.offsetWidth)) + "px";
    var arriba = r.top - g.offsetHeight - 6;
    g.style.top = (arriba > 8 ? arriba : r.bottom + 6) + "px";
    ayudaGlobo = g;
  }
  document.addEventListener("touchstart", function (e) {
    quitarGloboAyuda();
    var el = e.target.closest && e.target.closest("[data-ayuda]");
    if (!el || e.touches.length !== 1) { ayudaToque = null; return; }
    ayudaToque = { el: el, x: e.touches[0].clientX, y: e.touches[0].clientY, mostrado: false };
    ayudaTimer = setTimeout(function () {
      ayudaTimer = null;
      if (!ayudaToque) return;
      ayudaToque.mostrado = true;
      mostrarGloboAyuda(ayudaToque.el);
    }, 500);
  }, { capture: true, passive: true });
  document.addEventListener("touchmove", function (e) {
    if (!ayudaToque || ayudaToque.mostrado) return;
    var t = e.touches[0];
    if (Math.abs(t.clientX - ayudaToque.x) > 10 || Math.abs(t.clientY - ayudaToque.y) > 10) {
      ayudaToque = null;
      quitarGloboAyuda();
    }
  }, { capture: true, passive: true });
  document.addEventListener("touchend", function (e) {
    var tq = ayudaToque;
    ayudaToque = null;
    if (ayudaTimer) { clearTimeout(ayudaTimer); ayudaTimer = null; }
    if (tq && tq.mostrado) {
      e.preventDefault();   // que no cuente como toque en el chip
      var g = ayudaGlobo;
      setTimeout(function () { if (ayudaGlobo === g) quitarGloboAyuda(); }, 1800);
    }
  }, { capture: true, passive: false });
  document.addEventListener("touchcancel", function () { ayudaToque = null; quitarGloboAyuda(); }, true);
  // El menú contextual del toque largo (copiar, seleccionar...) sobra aquí
  document.addEventListener("contextmenu", function (e) {
    if (e.target.closest && e.target.closest("[data-ayuda]")) e.preventDefault();
  }, true);

  /* Recuadros de texto libre que crecen solos (29-09-2026, pedido del
     usuario): sin tirador para estirarlos con el dedo (style.css); el alto
     se ajusta al texto al escribir, al aparecer -se crean al vuelo en la
     ficha, el Registro, los apuntes...- y al hacerse visibles (un pliegue que
     se abre, una pantalla o un diálogo que se muestra). El alto de "rows"
     queda como mínimo, porque se mide partiendo de height "auto". Uno oculto
     no se puede medir: se ajusta cuando se vea. */
  function ajustarAltoTexto(t) {
    if (!t || t.tagName !== "TEXTAREA" || !t.getClientRects().length) return;
    t.style.height = "auto";
    t.style.height = (t.scrollHeight + t.offsetHeight - t.clientHeight) + "px";
  }
  function ajustarTodosLosTextos() {
    Array.prototype.forEach.call(document.querySelectorAll("textarea"), ajustarAltoTexto);
  }
  document.addEventListener("input", function (e) { ajustarAltoTexto(e.target); }, true);
  if (window.MutationObserver) {
    var altosProgramados = false;
    new MutationObserver(function () {
      if (altosProgramados) return;
      altosProgramados = true;
      requestAnimationFrame(function () { altosProgramados = false; ajustarTodosLosTextos(); });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "class", "hidden"] });
  }
  window.addEventListener("resize", ajustarTodosLosTextos);

  var MARCA_ESTADO_CASO = {
    pendiente_planificar: "⚫",
    preparado: "🟡",
    cerrado: "🟢",
    cancelado: "🔴"
  };

  function renderChecklistSelector() {
    var sel = document.getElementById("checklist-caso-select");
    sel.innerHTML = "";
    var op0 = document.createElement("option");
    op0.value = "";
    op0.textContent = T("checklist_modelo_cero");
    sel.appendChild(op0);
    // Más recientes primero, mismo criterio que el listado de Gestión de Casos.
    Object.keys(casos).sort(function (a, b) {
      return (casos[b].fecha || "").localeCompare(casos[a].fecha || "");
    }).forEach(function (uid) {
      var c = casos[uid];
      var op = document.createElement("option");
      op.value = uid;
      op.textContent = (MARCA_ESTADO_CASO[c.estado] ? MARCA_ESTADO_CASO[c.estado] + " " : "") +
        (c.ID_Caso || "?") + (c.nombre_caso ? " — " + c.nombre_caso : "");
      op.setAttribute("data-estado", c.estado || "");
      op.setAttribute("data-texto", (c.ID_Caso || "?") + (c.nombre_caso ? " — " + c.nombre_caso : ""));
      // El círculo de color del principio distingue preparado/cerrado/
      // cancelado de un vistazo -pedido el 23-09-2026-, ver MARCA_ESTADO_CASO.
      sel.appendChild(op);
    });
    // Un caso borrado o que ya no existe deja el desplegable en Modelo 0,
    // no en un value huérfano que no seleccionaría ninguna opción real.
    if (checklistCasoUid && !casos[checklistCasoUid]) checklistCasoUid = null;
    sel.value = checklistCasoUid || "";
    refrescarSelectorCaso(sel);
  }

  function renderChecklistProgreso() {
    var valores = checklistValores();
    var marcados = CHECKLIST_ITEMS.filter(function (it) { return valores[it.id]; }).length;
    document.getElementById("checklist-progreso").textContent =
      T("checklist_progreso", { n: marcados, total: CHECKLIST_ITEMS.length });
  }

  function renderChecklistContenido() {
    // «Vaciar» solo en Modelo 0, como en el Registro (auditoría 28-09-2026,
    // F7): con un caso vinculado, las marcas son parte del caso.
    document.getElementById("checklist-vaciar").hidden = !!(checklistCasoUid && casos[checklistCasoUid]);
    var cont = document.getElementById("checklist-contenido");
    cont.innerHTML = "";
    var valores = checklistValores();
    CHECKLIST_GRUPOS.forEach(function (g) {
      var det = document.createElement("details");
      det.className = "caso-grupo";
      det.open = true; // los 5 abiertos: es el contenido principal de la pantalla, no hay nada más que mirar antes
      var sum = document.createElement("summary");
      sum.textContent = T("checklist_g_" + g);
      det.appendChild(sum);
      var campos = document.createElement("div");
      campos.className = "caso-grupo-campos";
      CHECKLIST_ITEMS.filter(function (it) { return it.g === g; }).forEach(function (it) {
        var lab = document.createElement("label");
        lab.className = "check checklist-item";
        var inp = document.createElement("input");
        inp.type = "checkbox";
        inp.checked = !!valores[it.id];
        inp.addEventListener("change", function () { checklistMarcar(it.id, inp.checked); });
        var span = document.createElement("span");
        span.textContent = T("checklist_" + it.id);
        lab.appendChild(inp);
        lab.appendChild(span);
        campos.appendChild(lab);
      });
      det.appendChild(campos);
      cont.appendChild(det);
    });
    renderChecklistProgreso();
  }

  function renderChecklist() {
    if (!checklistCargado) checklistCargar();
    renderChecklistSelector();
    renderChecklistContenido();
  }

  function abrirChecklist() {
    renderChecklist();
    irAPantalla("checklist");
  }

  document.getElementById("tile-checklist").addEventListener("click", abrirChecklist);
  mejorarSelectorCaso(document.getElementById("checklist-caso-select"));
  document.getElementById("checklist-caso-select").addEventListener("change", function (e) {
    checklistCasoUid = e.target.value || null;
    renderChecklistContenido();
  });
  // "Guardar" explícito (20-09-2026, pedido por la usuaria): todo en esta
  // pantalla ya se autoguarda al momento -cada checkbox, cada tecla del
  // texto-, pero este botón da la confirmación visible de que no se ha
  // perdido nada, mismo motivo que "Guardar montaje" en el Organizador.
  document.getElementById("checklist-guardar").addEventListener("click", function () {
    avisoGuardado(T("checklist_guardado"));
  });
  document.getElementById("checklist-vaciar").addEventListener("click", function () {
    if (checklistCasoUid && casos[checklistCasoUid]) return;   // solo Modelo 0 (auditoría, F7)
    if (!confirm(T("checklist_vaciar_conf"))) return;
    if (checklistCasoUid && casos[checklistCasoUid]) {
      casos[checklistCasoUid].checklist_prequirurgico = {};
      guardarCaso(casos[checklistCasoUid]);
    } else {
      checklistModeloCero = { valores: {} };
      checklistGuardarModeloCero();
    }
    renderChecklistContenido();
  });

  /* ================================================================
   * Registro intraoperatorio (24-09-2026): versión digital de la hoja de
   * papel que el usuario está diseñando ("Hoja_Registro_Intraoperatorio_
   * IONM_2h.pdf", dos páginas). Sigue el patrón del Checklist pre-quirúrgico:
   *   - "Modelo 0 — sin caso": hoja suelta en localStorage, sin sincronizar.
   *   - Vinculada a un caso: vive dentro del propio caso
   *     (`registro_intraop`, ver casoVacio()) y se sincroniza con él.
   *
   * La hoja está en desarrollo, así que TODO su contenido sale de datos
   * (REG_SECCIONES, REG_MODALIDADES, REG_BASALES...) y no de HTML escrito a
   * mano: añadir, quitar o renombrar un campo es tocar una línea de esas
   * listas, sin tocar el motor de pintado. Los textos son datos con `l` /
   * `l_en` (mismo patrón que `nombre`/`nombre_en` -se leen con campo()-).
   *
   * Lo que NO lleva, a propósito (regla 1 de CLAUDE.md): la "etiqueta del
   * paciente" ni el "NHC" de la hoja en papel -ningún dato identificativo-.
   *
   * Modelo del contenedor (caso.registro_intraop / registroModeloCero):
   *   { v: { <id de campo>: valor }, eventos: [], mapeo: [], alarmas: [],
   *     modular: [[...10 celdas], ...], imagenes: [{id, nombre, dataUrl}] }
   * "v" guarda solo lo que el usuario tocó. Los campos con `der` (derivado
   * del caso vinculado) muestran ese valor mientras no se hayan tocado:
   * así las técnicas y datos del caso "pasan solos" a la hoja, sin copiarlos
   * a ciegas ni quedarse desfasados si cambian en el caso.
   * ================================================================ */
  var REGISTRO_KEY = "mio_ionm_registro_v1";
  var REGISTRO_ABIERTAS_KEY = "mio_ionm_registro_abiertas_v1";
  var registroModeloCero = {};
  var registroCasoUid = null;   // null = Modelo 0
  var registroCargado = false;
  var registroTimer = null;
  var registroIdSeq = 0;
  var registroAbiertas = null;

  function horaAhora() {
    var d = new Date();
    return dosDigitos(d.getHours()) + ":" + dosDigitos(d.getMinutes());
  }

  // ---- Definición de la hoja ------------------------------------------
  var REG_COD_EVENTO = [
    { v: "F", l: "F · fase", l_en: "F · phase" },
    { v: "E", l: "E · evento", l_en: "E · event" },
    { v: "A", l: "A · alarma", l_en: "A · alarm" },
    { v: "M", l: "M · mapeo", l_en: "M · mapping" },
    { v: "An", l: "An · anestesia", l_en: "An · anaesthesia" },
    { v: "T", l: "T · técnico", l_en: "T · technical" }
  ];
  var REG_TIPO_MAPEO = [
    { v: "G", l: "G · grid/strip", l_en: "G · grid/strip" },
    { v: "C", l: "C · Cx cortical", l_en: "C · cortical" },
    { v: "S", l: "S · subcortical (Raabe)", l_en: "S · subcortical (Raabe)" },
    { v: "IV", l: "IV · suelo IV v.", l_en: "IV · 4th ventricle floor" },
    { v: "PC", l: "PC · par craneal", l_en: "PC · cranial nerve" },
    { v: "R", l: "R · raíz", l_en: "R · root" },
    { v: "N", l: "N · nervio periférico", l_en: "N · peripheral nerve" }
  ];
  var REG_RECUP = [
    { v: "S", l: "S · recupera", l_en: "S · recovers" },
    { v: "P", l: "P · recupera en parte", l_en: "P · partly recovers" },
    { v: "N", l: "N · no recupera", l_en: "N · does not recover" }
  ];
  // Mismos ids que OPCIONES.recuperacion_senal: es el mismo dato que
  // «Resultado de la señal» de la ficha (compartido ⇄, 28-09-2026).
  var REG_RESULTADO = [
    { v: "sin_cambios", l: "Sin cambios", l_en: "No changes" },
    { v: "transitorios", l: "Cambios transitorios recuperados", l_en: "Transient changes, recovered" },
    { v: "persistentes", l: "Cambios persistentes", l_en: "Persistent changes" }
  ];

  /* Alarmas con listas cerradas (28-09-2026, pedido del usuario: menos texto
     libre para poder sacar datos). Se guardan ids; lo escrito antes a mano
     (o el rótulo que guardaba el modo rápido, "↓ amplitud") se reconoce con
     regIdLista() o se conserva como una opción más. Los ids de criterio son
     los de REG_CAMBIOS_RAPIDOS. "medidas_l" es la lista de medidas; "medidas"
     (texto) queda como nota breve. */
  var REG_CRITERIO_AL = [
    { v: "umbral", l: "↑ umbral", l_en: "↑ threshold" },
    { v: "baja", l: "↓ amplitud", l_en: "↓ amplitude" },
    { v: "latencia", l: "↑ latencia", l_en: "↑ latency" },
    { v: "perdida", l: "Pérdida", l_en: "Loss" },
    { v: "hfd", l: "HFD / descargas", l_en: "HFD / discharges" }
  ];
  var REG_CAUSA_AL = [
    { v: "quirurgica", l: "Maniobra quirúrgica", l_en: "Surgical manoeuvre" },
    { v: "anestesica", l: "Anestésica", l_en: "Anaesthetic" },
    { v: "sistemica", l: "Sistémica (TAM, Tª, Hb)", l_en: "Systemic (MAP, temp., Hb)" },
    { v: "posicional", l: "Posicional", l_en: "Positional" },
    { v: "tecnica", l: "Técnica (electrodos, equipo)", l_en: "Technical (electrodes, device)" },
    { v: "desconocida", l: "Desconocida", l_en: "Unknown" }
  ];
  // Avisos al cirujano / anestesista primero (29-09-2026): es la medida que
  // antes se busca después («¿se avisó?»). Reposicionar, causa frecuente en
  // los SEP. Ids nuevos al final de nada: ninguno de antes cambia.
  var REG_MEDIDAS_AL = [
    { v: "aviso_cir", l: "Aviso al cirujano", l_en: "Surgeon informed" },
    { v: "aviso_an", l: "Aviso al anestesista", l_en: "Anaesthetist informed" },
    { v: "pausa", l: "Pausa / revertir maniobra", l_en: "Pause / reverse manoeuvre" },
    { v: "retraccion", l: "Liberar retracción o tracción", l_en: "Release retraction or traction" },
    { v: "reposicionar", l: "Reposicionar cabeza, cuello o extremidad", l_en: "Reposition head, neck or limb" },
    { v: "suero", l: "Suero tibio", l_en: "Warm saline" },
    { v: "papaverina", l: "Papaverina", l_en: "Papaverine" },
    { v: "tam", l: "↑ TAM", l_en: "↑ MAP" },
    { v: "anestesia", l: "Ajuste anestésico", l_en: "Anaesthetic adjustment" },
    { v: "tecnica", l: "Revisar electrodos / ↑ intensidad", l_en: "Check electrodes / ↑ intensity" },
    { v: "espera", l: "Esperar", l_en: "Wait" },
    { v: "corticoides", l: "Corticoides", l_en: "Corticosteroids" },
    { v: "wakeup", l: "Wake-up test", l_en: "Wake-up test" },
    { v: "suspender", l: "Suspender la cirugía", l_en: "Abort surgery" }
  ];
  // Valor guardado -> id de la lista si coincide con el id o con un rótulo
  // (en cualquier idioma); si no, el valor tal cual.
  function regIdLista(lista, v) {
    if (!v) return v;
    var o = lista.filter(function (x) { return x.v === v || x.l === v || x.l_en === v; })[0];
    return o ? o.v : v;
  }
  function regTextoLista(lista, v) {
    var id = regIdLista(lista, v);
    var o = lista.filter(function (x) { return x.v === id; })[0];
    return o ? regOpcionLabel(o) : (v || "");
  }
  // Los mismos ids que OPCIONES.resultado_esperable de la ficha: es el mismo
  // dato (compartido ⇄). Sustituye al texto libre "Déficit esperado / mensaje
  // transmitido" (28-09-2026, pedido del usuario).
  var REG_RES_ESPERABLE = [
    { v: "similar", l: "Similar al previo", l_en: "Similar to previous" },
    { v: "empeoramiento", l: "Empeoramiento", l_en: "Worsening" },
    { v: "mejoria", l: "Mejoría", l_en: "Improvement" },
    { v: "indeterminado", l: "Indeterminado", l_en: "Undetermined" }
  ];

  // ¿El montaje del caso lleva una sonda monopolar (las de la categoría
  // "Sondas": sonda_mono_esferica, sonda_mono_recta)? Coloca la casilla
  // "Monopolar" del mapeo sola.
  function regTieneSondaMonopolar(c) {
    var esc = montajeDesdeCaso(c);
    var hay = false;
    Object.keys(esc.asignaciones || {}).forEach(function (cajaKey) {
      var asign = esc.asignaciones[cajaKey] || {};
      Object.keys(asign).forEach(function (k) {
        if (String(asign[k]).indexOf("sonda_mono_") === 0) hay = true;
      });
    });
    (esc.extras || []).forEach(function (id) { if (String(id).indexOf("sonda_mono_") === 0) hay = true; });
    return hay;
  }

  var REG_MONTAJE = [
    { id: "mont_tes", l: "TES", t: "text" },
    { id: "mont_grid", l: "Grid / strip (tipo · nº contactos)", l_en: "Grid / strip (type · no. contacts)", t: "text" },
    { id: "mont_incidencias", l: "Incidencias colocación", l_en: "Placement issues", t: "text" }
  ];

  // Filas de "Basales y comparativa": id de fila, rótulo. Tres columnas por
  // fila -basal, post-posición y final-, guardadas como e_<fila>_<col>.
  //
  // Desde el 25-09-2026 la misma tabla sale también en la ficha del caso
  // (Desarrollo intraoperatorio, "Basales"): es un único dato, se escriba donde
  // se escriba. Cada fila puede llevar "tec": solo aparece si el caso tiene
  // alguna de esas técnicas (o ya tiene algo escrito en ella). Sin caso
  // (Modelo 0) salen las que no llevan "tec" y las marcadas "defecto".
  // Ver regFilasBasales(). Los ids no cambian: las casillas ya escritas se
  // conservan aunque cambie el rótulo.
  var REG_TEC_GRID = ["c_pem", "c_pess", "mapeo_cortical", "phase_reversal", "ecog"];
  var REG_BASALES_SENS = [
    { id: "sep_msd", l: "t-SEP MSD" }, { id: "sep_msi", l: "t-SEP MSI" },
    { id: "sep_mid", l: "t-SEP MID" }, { id: "sep_mii", l: "t-SEP MII" },
    { id: "csep_msd", l: "c-SEP MSD", tec: ["c_pess"] }, { id: "csep_msi", l: "c-SEP MSI", tec: ["c_pess"] },
    { id: "csep_mid", l: "c-SEP MID", tec: ["c_pess"] }, { id: "csep_mii", l: "c-SEP MII", tec: ["c_pess"] },
    { id: "peat_d", l: "PEAT D", tec: ["peatc"], defecto: true }, { id: "peat_i", l: "PEAT I", tec: ["peatc"], defecto: true }
  ];
  // Las filas libres van SIN rótulo: se escribe a mano lo que toque
  // (esfínter, VII, IX-X, XII, otros...) -pedido del usuario-.
  // REG_BASALES_LIBRES = cuántas filas libres lleva cada tabla.
  var REG_BASALES_MOT = [
    { id: "mep_msd", l: "t-MEP MSD" }, { id: "mep_msi", l: "t-MEP MSI" },
    { id: "mep_mid", l: "t-MEP MID" }, { id: "mep_mii", l: "t-MEP MII" },
    { id: "cmep_msd", l: "c-MEP MSD", tec: ["c_pem"] }, { id: "cmep_msi", l: "c-MEP MSI", tec: ["c_pem"] },
    { id: "cmep_mid", l: "c-MEP MID", tec: ["c_pem"] }, { id: "cmep_mii", l: "c-MEP MII", tec: ["c_pem"] },
    { id: "grid", l: "GRID", tec: REG_TEC_GRID },
    // Onda D debajo de GRID (28-09-2026, pedido del usuario), con el nombre
    // que usa en quirófano. Los ids no cambian: lo escrito se conserva. Es
    // respuesta motora, por eso va en la columna de MEP (24-09-2026); la
    // distal (control) se añadió el 25-09-2026.
    { id: "onda_d", l: "Prox. D-Wave", l_en: "Prox. D-wave", tec: ["onda_d"], defecto: true },
    { id: "onda_d_dist", l: "Dist. D-Wave", l_en: "Dist. D-wave", tec: ["onda_d"], defecto: true },
    { id: "cobu_vii_d", l: "CoMEP VII D", tec: ["pem_corticobulbares"] }, { id: "cobu_vii_i", l: "CoMEP VII I", tec: ["pem_corticobulbares"] },
    { id: "cobu_ixx_d", l: "CoMEP IX-X D", tec: ["pem_corticobulbares"] }, { id: "cobu_ixx_i", l: "CoMEP IX-X I", tec: ["pem_corticobulbares"] },
    { id: "cobu_xii_d", l: "CoMEP XII D", tec: ["pem_corticobulbares"] }, { id: "cobu_xii_i", l: "CoMEP XII I", tec: ["pem_corticobulbares"] },
    // H-R sóleo también es respuesta motora: columna de MEP (24-09-2026).
    { id: "hr_soleo_d", l: "H-R Sóleo D", l_en: "H-R Soleus R", tec: ["hr_popliteo"], defecto: true },
    { id: "hr_soleo_i", l: "H-R Sóleo I", l_en: "H-R Soleus L", tec: ["hr_popliteo"], defecto: true }
    // "Umbral MEP" y "TOF" se quitaron el 28-09-2026 (pedido del usuario).
    // Ningún caso real los tenía escritos; TOF sigue en el modo rápido del
    // Registro como botón propio (REG_QUE_EXTRA).
  ];
  // Filas libres al final de cada tabla (pedido del usuario, 24-09-2026).
  var REG_BASALES_LIBRES = { sens: 2, mot: 1 };
  // Tercera tabla: estimulación de tornillos, IZQ | NIVEL | DER, 8 filas.
  // Claves e_t_<n>_izq / _nivel / _der.
  var REG_TORNILLOS = { filas: 8, cols: [
    { id: "izq", l: "IZQ", l_en: "LEFT" },
    { id: "nivel", l: "NIVEL", l_en: "LEVEL" },
    { id: "der", l: "DER", l_en: "RIGHT" }
  ] };
  // Rótulos cortos y una segunda post-posición (28-09-2026, pedido del
  // usuario): a veces hay que repetir basales por cambios de posición antes
  // de empezar o a mitad de cirugía. PostPos2 ("soloT") solo existe en las
  // filas t-SEP y t-MEP (regColBasal()). Los ids no cambian: lo escrito en
  // Apertura/Post-posición/Cierre sigue en OP BSL/PostPos1/CL BSL.
  var REG_BASALES_COLS = [
    { id: "basal", l: "OP BSL", l_en: "OP BSL", tit: "Basales de apertura, antes de empezar", tit_en: "Opening baselines, before starting" },
    { id: "post", l: "PostPos1", l_en: "PostPos1", tit: "Basales tras el primer cambio de posición", tit_en: "Baselines after the first position change" },
    { id: "post2", l: "PostPos2", l_en: "PostPos2", soloT: true, tit: "Basales tras el segundo cambio de posición (solo t-SEP y t-MEP)", tit_en: "Baselines after the second position change (t-SEP and t-MEP only)" },
    { id: "final", l: "CL BSL", l_en: "CL BSL", tit: "Basales de cierre", tit_en: "Closing baselines" }
  ];
  // ¿Lleva la fila (id sin prefijo: "sep_msd", "libre1"...) esa columna?
  // Los c-MEP no tienen post-posición: solo OP BSL y CL BSL (pedido del
  // usuario, 28-09-2026).
  function regColBasal(col, idFila) {
    if (/^cmep_/.test(idFila)) return col.id === "basal" || col.id === "final";
    return !col.soloT || /^(sep|mep)_/.test(idFila);
  }

  // Filas visibles de una tabla de basales (ver el comentario de
  // REG_BASALES_SENS). "tecnicas" es la lista del caso, o null en Modelo 0.
  function regFilasBasales(filas, prefijo, d, tecnicas) {
    return filas.filter(function (r) {
      if (!r.tec) return true;
      var escrita = REG_BASALES_COLS.some(function (col) { return !!d.v["e_" + prefijo + r.id + "_" + col.id]; });
      if (escrita) return true;
      if (!tecnicas) return !!r.defecto;
      return r.tec.some(function (t) { return tecnicas.indexOf(t) !== -1; });
    });
  }
  function regCasoConGrid(tecnicas, d) {
    return (tecnicas || []).some(function (t) { return REG_TEC_GRID.indexOf(t) !== -1; }) ||
      !!(d.v.grid1_motor || d.v.grid1_inversion || d.v.grid2_inversion);
  }

  var REG_HITOS = [
    { id: "h_entrada_q", l: "Entrada Q", l_en: "OR entry" },
    { id: "h_intubacion", l: "Intubación", l_en: "Intubation" },
    { id: "h_inicio_montaje", l: "Inicio montaje", l_en: "Setup start" },
    { id: "h_fin_montaje", l: "Fin montaje", l_en: "Setup end" },
    { id: "h_volteo", l: "Volteo", l_en: "Turning" },
    { id: "h_basal_pre", l: "Basal pre-posic.", l_en: "Baseline pre-pos." },
    { id: "h_basal_post", l: "Basal post-posic.", l_en: "Baseline post-pos." },
    { id: "h_incision", l: "Incisión", l_en: "Incision" },
    { id: "h_apertura_dural", l: "Apertura dural", l_en: "Dural opening" },
    { id: "h_fase_critica", l: "Fase crítica", l_en: "Critical phase" },
    { id: "h_cierre", l: "Cierre", l_en: "Closure" },
    { id: "h_fin_mio", l: "Fin MIO", l_en: "IONM end", caso: "hora_fin" }
  ].map(function (h) { h.t = "time"; return h; });

  var REG_SECCIONES = [
    { hoja: 1, id: "a", tipo: "campos", l: "A · Identificación y estado prequirúrgico", l_en: "A · Identification and pre-op status",
      campos: [
        { id: "fecha", l: "Fecha", l_en: "Date", t: "date", caso: "fecha", der: function (c) { return c.fecha; } },
        { id: "quirofano", l: "Quirófano", l_en: "Operating room", t: "text" },
        { id: "hora_inicio_mio", l: "Hora inicio MIO ({equipo})", l_en: "IONM start time ({equipo})", t: "time", caso: "hora_inicio", der: function (c) { return c.hora_inicio; } },
        { id: "cirujano", l: "Cirujano", l_en: "Surgeon", t: "text" },
        { id: "anestesista", l: "Anestesista", l_en: "Anaesthetist", t: "text" },
        { id: "neurofisiologo", l: "Neurofisiólogo / técnico", l_en: "Neurophysiologist / technician", t: "text" },
        { id: "diagnostico", l: "Diagnóstico", l_en: "Diagnosis", t: "text", ancho: true, soloCaso: true,
          der: function (c) { return c.diagnostico ? opcionTexto("diagnostico", c.diagnostico) : ""; } },
        { id: "nivel_lado", l: "Nivel / localización · Lado", l_en: "Level / location · Side", t: "text", ancho: true, caso: "anatomia_patologica",
          der: function (c) { return c.anatomia_patologica; } },
        { id: "procedimiento", l: "Procedimiento", l_en: "Procedure", t: "text", ancho: true, caso: "intervencion", der: function (c) { return intervencionDe(c); } },
        { id: "prequx_motor", l: "Pre-qx: Motor", l_en: "Pre-op: Motor", t: "text" },
        { id: "prequx_sensitivo", l: "Pre-qx: Sensitivo", l_en: "Pre-op: Sensory", t: "text" },
        { id: "prequx_ppcc", l: "Pre-qx: PPCC", l_en: "Pre-op: CN", t: "text" },
        { id: "prequx_esfinteres", l: "Pre-qx: Esfínteres", l_en: "Pre-op: Sphincters", t: "text" }
      ] },
    { hoja: 1, id: "b", tipo: "modalidades", l: "B · Técnicas", l_en: "B · Techniques" },
    { hoja: 1, id: "c", tipo: "campos", l: "C · Anestesia", l_en: "C · Anaesthesia",
      campos: [
        { id: "an_hipnotico", l: "Inducción: hipnótico / opioide", l_en: "Induction: hypnotic / opioid", t: "text" },
        { id: "an_relajante", l: "Inducción: relajante", l_en: "Induction: relaxant", t: "text" },
        { id: "an_relajante_h", l: "Hora relajante", l_en: "Relaxant time", t: "time" },
        { id: "an_tof_h", l: "TOF 4/4 a las", l_en: "TOF 4/4 at", t: "time" },
        { id: "an_tiva", l: "Mantenimiento: TIVA", l_en: "Maintenance: TIVA", t: "check",
          der: function (c) { return c.tipo_anestesia === "tiva" || c.tipo_anestesia === "rtiva"; } },
        { id: "an_halogenado", l: "Halogenado", l_en: "Volatile", t: "check", der: function (c) { return c.tipo_anestesia === "gas"; } },
        { id: "an_cam", l: "Halogenado CAM", l_en: "Volatile MAC", t: "text" },
        { id: "an_dexmedetomidina", l: "Dexmedetomidina", l_en: "Dexmedetomidine", t: "check", der: function (c) { return c.tipo_anestesia === "dxm"; } },
        { id: "an_ketamina", l: "Ketamina", l_en: "Ketamine", t: "check" },
        { id: "an_tam", l: "TAM objetivo", l_en: "Target MAP", t: "text" },
        { id: "an_temp", l: "Tª", l_en: "Temp.", t: "text" }
      ] },
    { hoja: 1, id: "d", tipo: "campos", l: "D · Cronograma de hitos (hora del {equipo})", l_en: "D · Milestone timeline ({equipo} clock)", campos: REG_HITOS, compacto: true },
    { hoja: 1, id: "e", tipo: "basales", l: "E · Basales y comparativa", l_en: "E · Baselines and comparison",
      ayuda: "SEP amp/lat · PEAT lat V · MEP umbral o presencia · Onda D amp · Reflejos presencia/umbral",
      ayuda_en: "SEP amp/lat · BAEP lat V · MEP threshold or presence · D wave amp · Reflexes presence/threshold" },
    { hoja: 1, id: "e2", tipo: "lista", lista: "mapeo", l: "E2 · Mapeo", l_en: "E2 · Mapping",
      ayuda: "Tipo: G grid/strip · C cortical · S subcortical (Raabe) · IV suelo IV v. · PC par craneal · R raíz",
      ayuda_en: "Type: G grid/strip · C cortical · S subcortical (Raabe) · IV 4th ventricle floor · PC cranial nerve · R root",
      boton: "+ Fila de mapeo", boton_en: "+ Mapping row", ahora: true,
      antes: [1, 2].reduce(function (lista, n) {
        return lista.concat([
          { id: "grid" + n + "_motor", l: "GRID " + n + " · Electrodo motor", l_en: "GRID " + n + " · Motor electrode", t: "text" },
          { id: "grid" + n + "_musculos", l: "GRID " + n + " · Músculos registrados", l_en: "GRID " + n + " · Muscles recorded", t: "text" },
          { id: "grid" + n + "_sens", l: "GRID " + n + " · Electrodo/s sensitivo/s", l_en: "GRID " + n + " · Sensory electrode(s)", t: "text" },
          { id: "grid" + n + "_inversion", l: "GRID " + n + " · Inversión de fase (contacto)", l_en: "GRID " + n + " · Phase reversal (contact)", t: "text" }
        ]);
      }, []),
      cols: [
        { id: "hora", l: "Hora", l_en: "Time", t: "time" },
        { id: "tipo", l: "Tipo", l_en: "Type", t: "sel", o: REG_TIPO_MAPEO },
        { id: "punto", l: "Punto · contacto · localización", l_en: "Point · contact · location", t: "text", ancho: true },
        { id: "tecnica", l: "Técnica · parámetros", l_en: "Technique · parameters", t: "text", ancho: true },
        { id: "umbral", l: "Umbral mA", l_en: "Threshold mA", t: "num" },
        { id: "respuesta", l: "Respuesta · músculo", l_en: "Response · muscle", t: "text" },
        { id: "accion", l: "Acción · comentario", l_en: "Action · comment", t: "text", ancho: true }
      ] },
    { hoja: 1, id: "esquema", tipo: "imagenes", l: "Esquema (grid · craneotomía · puntos)", l_en: "Diagram (grid · craniotomy · points)" },
    { hoja: 2, id: "f", tipo: "lista", lista: "eventos", l: "F · Registro de fases y eventos", l_en: "F · Phase and event log",
      ayuda: "Códigos: F fase · E evento · A alarma · M mapeo · An anestesia · T técnico",
      ayuda_en: "Codes: F phase · E event · A alarm · M mapping · An anaesthesia · T technical",
      boton: "+ Evento (hora actual)", boton_en: "+ Event (current time)", ahora: true,
      cols: [
        { id: "hora", l: "Hora", l_en: "Time", t: "time" },
        { id: "cod", l: "Cód.", l_en: "Code", t: "sel", o: REG_COD_EVENTO },
        { id: "fase", l: "Fase / maniobra quirúrgica", l_en: "Surgical phase / manoeuvre", t: "text", ancho: true },
        { id: "modalidad", l: "Técnica · lado", l_en: "Technique · side", t: "text" },
        { id: "cambio", l: "Cambio (% amp, lat)", l_en: "Change (% amp, lat)", t: "text" },
        { id: "av_cir", l: "Aviso: Cir", l_en: "Alert: Surg", t: "check" },
        { id: "av_an", l: "Aviso: An", l_en: "Alert: An", t: "check" },
        { id: "accion", l: "Acción y resultado", l_en: "Action and result", t: "text", ancho: true }
      ] },
    { hoja: 2, id: "g", tipo: "lista", lista: "alarmas", l: "G · Alarmas", l_en: "G · Alarms", min: 5, prefijo: "A",
      ayuda: "NRF: repetir · ↑ intensidad · electrodos/impedancias · patrón global vs focal. Anest.: bolo/relajante · profundidad · TAM · Hb/Tª/oxigenación · posición miembros. Cir.: parar/revertir maniobra · liberar tracción/retracción · suelo tibio · implante · sangrado. Si no mejora: ↑ TAM · corticoides · wake-up test · valorar suspender (adapt. Acharya 2017).",
      ayuda_en: "NRF: repeat · ↑ intensity · electrodes/impedances · global vs focal pattern. Anaesth.: bolus/relaxant · depth · MAP · Hb/temp/oxygenation · limb position. Surg.: stop/reverse manoeuvre · release traction/retraction · warm irrigation · implant · bleeding. If no improvement: ↑ MAP · corticosteroids · wake-up test · consider aborting (adapted from Acharya 2017).",
      boton: "+ Alarma", boton_en: "+ Alarm", ahora: false,
      cols: [
        { id: "hora", l: "Hora", l_en: "Time", t: "time" },
        { id: "modalidad", l: "Técnica · lado", l_en: "Technique · side", t: "text" },
        { id: "criterio", l: "Criterio", l_en: "Criterion", t: "text" },
        { id: "causa", l: "Maniobra / causa probable", l_en: "Manoeuvre / probable cause", t: "text", ancho: true },
        { id: "nrf", l: "NRF", t: "check" },
        { id: "an", l: "An", t: "check" },
        { id: "cir", l: "Cir", t: "check" },
        { id: "medidas", l: "Medidas adoptadas", l_en: "Measures taken", t: "text", ancho: true },
        { id: "recup", l: "Recup.", l_en: "Recov.", t: "sel", o: REG_RECUP },
        { id: "h_recup", l: "h recup.", l_en: "Recovery time", t: "time" }
      ] },
    { hoja: 2, id: "h", tipo: "modular", l: "H · Zona modular", l_en: "H · Modular zone",
      ayuda: "Rotular la primera fila · tornillos (nivel | D | I) · raíces · PPCC · tareas despierto · otros",
      ayuda_en: "Label the first row · screws (level | R | L) · roots · CN · awake tasks · other" },
    { hoja: 2, id: "i", tipo: "campos", l: "I · Cierre", l_en: "I · Closure",
      campos: [
        { id: "cierre_resultado", l: "Resultado de la señal", l_en: "Signal outcome", t: "sel", o: REG_RESULTADO, ancho: true, caso: "recuperacion_senal" },
        { id: "cierre_modalidades", l: "Técnicas con alteración", l_en: "Techniques with an alteration", t: "text", ancho: true,
          leerCaso: function (c) { return regNombresTecnicas(c.tecnicas_alteradas).join(", "); } },
        { id: "cierre_com_cir", l: "Comunicación final: Cirujano", l_en: "Final communication: Surgeon", t: "check" },
        { id: "cierre_com_an", l: "Comunicación final: Anestesia", l_en: "Final communication: Anaesthesia", t: "check" },
        { id: "cierre_com_h", l: "Hora comunicación", l_en: "Communication time", t: "time" },
        { id: "cierre_esperable", l: "Resultado esperable", l_en: "Expected outcome", t: "sel", o: REG_RES_ESPERABLE, ancho: true, caso: "resultado_esperable" },
        { id: "cierre_incidencias", l: "Incidencias técnicas", l_en: "Technical incidents", t: "area", ancho: true, caso: "incidencias_tecnicas" },
        { id: "cierre_material", l: "Material: consumo · fallos · reposición", l_en: "Material: use · failures · replacement", t: "text", ancho: true },
        { id: "cierre_perla_check", l: "Perla docente: caso para sesión", l_en: "Teaching pearl: case for session", t: "check", caso: "caso_destacado" },
        { id: "cierre_perla", l: "Perla docente", l_en: "Teaching pearl", t: "area", ancho: true, caso: "aprendizaje_clave" },
        { id: "pend_informe", l: "Pendiente: Informe", l_en: "Pending: Report", t: "check" },
        { id: "pend_explor", l: "Pendiente: Explor. postop", l_en: "Pending: Post-op exam", t: "check" },
        { id: "pend_bd", l: "Pendiente: Base de datos", l_en: "Pending: Database", t: "check" },
        { id: "pend_tiempos", l: "Pendiente: Registro tiempos", l_en: "Pending: Time log", t: "check" },
        { id: "pend_cadwell", l: "Pendiente: exportar el registro del {equipo}", l_en: "Pending: export the {equipo} log", t: "check" },
        { id: "cierre_firma", l: "Firma", l_en: "Signature", t: "text" }
      ] }
  ];
  REG_SECCIONES.forEach(function (s) { s.campos = s.campos || []; });

  // ---- Datos: dónde viven y cómo se guardan ---------------------------
  function registroCaso() {
    return registroCasoUid && casos[registroCasoUid] ? casos[registroCasoUid] : null;
  }

  // Rótulos con el equipo (demo-congreso B1.F2): "{equipo}" se cambia por el
  // nombre del equipo del caso -el de la hoja que se está imprimiendo o, en
  // pantalla, el del caso vinculado- y, sin caso (Modelo 0), por un texto
  // neutro. Así la hoja de un caso Inomed no habla de Cadwell.
  var regCasoRotulos;   // caso de la hoja en curso; undefined = el de la pantalla
  function textoEquipoRegistro() {
    var c = regCasoRotulos !== undefined ? regCasoRotulos : registroCaso();
    return c ? nombreEquipo(equipoDe(c)) : T("registro_equipo_neutro");
  }
  function regL(obj) {
    return String(campo(obj, "l") || "").replace(/\{equipo\}/g, textoEquipoRegistro());
  }

  function registroAsegurar(d) {
    if (!d.v) d.v = {};
    if (!d.eventos) d.eventos = [];
    if (!d.mapeo) d.mapeo = [];
    if (!d.alarmas) d.alarmas = [];
    if (!d.imagenes) d.imagenes = [];
    if (!d.modular) d.modular = [];
    return d;
  }

  function registroDatos() {
    var c = registroCaso();
    if (c) {
      if (!c.registro_intraop) c.registro_intraop = {};
      return registroAsegurar(c.registro_intraop);
    }
    return registroAsegurar(registroModeloCero);
  }

  function registroCargar() {
    try {
      var g = JSON.parse(localStorage.getItem(REGISTRO_KEY) || "null");
      if (g && typeof g === "object") registroModeloCero = g;
    } catch (e) { /* sin persistencia */ }
    registroCargado = true;
    hidratarFotosIDB("registro0", registroModeloCero.imagenes, "dataUrl").then(function () {
      if (pantallaActiva("registro") && !registroCasoUid) renderRegistroContenido();
    });
  }

  function registroGuardarModeloCero() {
    try {
      var ligero = Object.assign({}, registroModeloCero);
      if ((registroModeloCero.imagenes || []).length) {
        guardarFotosIDB("registro0", registroModeloCero.imagenes, "dataUrl");
        ligero.imagenes = quitarDataUrls(registroModeloCero.imagenes, "dataUrl");
      }
      localStorage.setItem(REGISTRO_KEY, JSON.stringify(ligero));
    } catch (e) { /* sin persistencia */ }
  }

  // Guardado inmediato (al salir de un campo, de la pantalla, o al ocultar
  // la app) y guardado con retardo mientras se escribe. Con retardo porque
  // guardarCaso() añade una marca a `editado_en` en cada llamada: guardar
  // en cada tecla llenaría de marcas el historial del caso.
  function registroGuardarYa() {
    if (registroTimer) { clearTimeout(registroTimer); registroTimer = null; }
    var c = registroCaso();
    if (c) guardarCaso(c, false, true); else registroGuardarModeloCero();
  }
  function registroGuardar() {
    if (registroTimer) clearTimeout(registroTimer);
    registroTimer = setTimeout(registroGuardarYa, 1200);
  }
  function registroVaciarPendiente() {
    if (registroTimer) registroGuardarYa();
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) registroVaciarPendiente();
  });
  window.addEventListener("pagehide", registroVaciarPendiente);

  // Valor efectivo de un campo: lo que el usuario tocó y, si no, el derivado
  // del caso vinculado (si el campo lo define y hay caso).
  /* Campos compartidos con la ficha del caso (28-09-2026, pedido del
     usuario: "que se sincronicen los datos que se puedan"). Un campo con
     "caso" es el MISMO dato que ese campo de la ficha, como las basales: se
     lee del caso y, al escribirlo aquí, se escribe en el caso (ver
     regControl()). Lo que se hubiera tecleado antes en la hoja solo se usa si
     el caso lo tiene vacío. "soloCaso": de lectura, se cambia en la ficha.
     "leerCaso": valor calculado desde el caso (modalidades afectadas =
     técnicas alteradas). Sin caso vinculado (Modelo 0), todo como antes. */
  function regGet(almacen, def, casoExplicito) {
    var v = almacen[def.id];
    var cc = casoExplicito !== undefined ? casoExplicito : registroCaso();
    if (cc && def.caso) {
      var cv = cc[def.caso];
      if (def.t === "check") return !!cv || v === true;
      if (cv !== undefined && cv !== null && cv !== "") return cv;
    }
    if (cc && def.leerCaso) {
      return [def.leerCaso(cc), v].filter(Boolean).join(", ");
    }
    var sinTocar = def.t === "check" ? v === undefined : (v === undefined || v === "");
    if (sinTocar && def.der) {
      // "casoExplicito": al imprimir desde la ficha, el caso es la copia de
      // trabajo (sin guardar), no el de la pantalla de Registro.
      var c = casoExplicito !== undefined ? casoExplicito : registroCaso();
      if (c) {
        var dv = def.der(c);
        if (dv !== undefined && dv !== null && dv !== "") return dv;
      }
    }
    if (v === undefined) return def.t === "check" ? false : "";
    return v;
  }

  // ---- Controles ------------------------------------------------------
  function regOpcionLabel(o) {
    return idioma !== "es" && o["l_" + idioma] ? o["l_" + idioma] : o.l;
  }

  function regControl(def, almacen, alTocar) {
    var id = "reg-c-" + (++registroIdSeq);
    var div = document.createElement("div");
    div.className = "campo reg-campo" + (def.ancho ? " reg-ancho" : "");
    var val = regGet(almacen, def);
    var casoVinc = registroCaso();
    var compartido = !!(def.caso && casoVinc && almacen === registroDatos().v);
    function fijar(v) {
      if (compartido) {
        casoVinc[def.caso] = v;
        delete almacen[def.id];
      } else {
        almacen[def.id] = v;
      }
      registroGuardar();
      if (alTocar) alTocar();
    }
    if (def.soloCaso && casoVinc) {
      div.appendChild(regNodo("label", null, regL(def)));
      div.appendChild(regNodo("p", "reg-p-dato reg-solo-caso", val || "—"));
      div.title = T("reg_p_solo_caso");
      return div;
    }
    if (compartido) div.classList.add("reg-compartido");

    if (def.t === "check") {
      if (def.par) div.classList.add("campo-par");
      var lab = document.createElement("label");
      lab.className = "check";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!val;
      cb.addEventListener("change", function () { fijar(cb.checked); registroGuardarYa(); });
      var sp = document.createElement("span");
      sp.textContent = regL(def) + (compartido ? " ⇄" : "");
      lab.appendChild(cb);
      lab.appendChild(sp);
      div.appendChild(lab);
      return div;
    }

    var etq = document.createElement("label");
    etq.htmlFor = id;
    etq.textContent = regL(def) + (compartido ? " ⇄" : "");
    div.appendChild(etq);

    var ctl;
    if (def.t === "sel") {
      ctl = document.createElement("select");
      var vacia = document.createElement("option");
      vacia.value = "";
      vacia.textContent = "—";
      ctl.appendChild(vacia);
      def.o.forEach(function (o) {
        var op = document.createElement("option");
        op.value = o.v;
        op.textContent = regOpcionLabel(o);
        ctl.appendChild(op);
      });
      // Compartido con un campo de la ficha que antes era texto libre: lo
      // escrito a mano se ofrece como una opción más, en vez de dejar el
      // desplegable en blanco (igual que en campoCaso()).
      if (def.caso === "resultado_esperable") val = resultadoEsperableId(val);
      if (val && !def.o.some(function (o) { return o.v === val; })) {
        var propia = document.createElement("option");
        propia.value = String(val);
        propia.textContent = String(val);
        ctl.appendChild(propia);
      }
      ctl.value = val || "";
      ctl.addEventListener("change", function () { fijar(ctl.value); registroGuardarYa(); });
    } else if (def.t === "area") {
      ctl = document.createElement("textarea");
      ctl.rows = 3;
      ctl.value = val || "";
      ctl.addEventListener("input", function () { fijar(ctl.value); });
      ctl.addEventListener("change", registroGuardarYa);
    } else {
      ctl = document.createElement("input");
      ctl.type = def.t === "time" ? "time" : def.t === "date" ? "date" : def.t === "num" ? "number" : "text";
      if (def.t === "num") { ctl.step = "any"; ctl.inputMode = "decimal"; }
      ctl.value = val === undefined || val === null ? "" : val;
      ctl.addEventListener("input", function () { fijar(ctl.value); });
      ctl.addEventListener("change", registroGuardarYa);
    }
    ctl.id = id;

    if (def.t === "time") {
      var fila = document.createElement("div");
      fila.className = "reg-hora";
      fila.appendChild(ctl);
      var ahora = document.createElement("button");
      ahora.type = "button";
      ahora.className = "reg-ahora";
      ahora.textContent = T("registro_ahora");
      ahora.title = T("registro_ahora_tit");
      ahora.addEventListener("click", function () {
        ctl.value = horaAhora();
        fijar(ctl.value);
        registroGuardarYa();
      });
      fila.appendChild(ahora);
      div.appendChild(fila);
    } else {
      div.appendChild(ctl);
    }
    return div;
  }

  // ---- Secciones ------------------------------------------------------
  function pintarSeccionCampos(sec, cont) {
    var d = registroDatos();
    var grid = document.createElement("div");
    grid.className = "reg-grid" + (sec.compacto ? " reg-grid-compacto" : "");
    sec.campos.forEach(function (def) { grid.appendChild(regControl(def, d.v)); });
    cont.appendChild(grid);
  }

  // "guardar" = { cambiar, salir }: por defecto el guardado del Registro. La
  // ficha del caso pasa los suyos (allí se guarda con "Guardar").
  function pintarBloqueBasales(titulo, filas, prefijo, libres, cont, d, guardar) {
    guardar = guardar || { cambiar: registroGuardar, salir: registroGuardarYa };
    var bloque = document.createElement("div");
    bloque.className = "reg-basal";
    var cab = document.createElement("div");
    cab.className = "reg-basal-fila reg-basal-cab";
    var t0 = document.createElement("span");
    t0.textContent = titulo;
    cab.appendChild(t0);
    REG_BASALES_COLS.forEach(function (col) {
      var s = document.createElement("span");
      s.textContent = regL(col);
      s.title = campo(col, "tit");   // la jerga, explicada al pasar o mantener (F9)
      cab.appendChild(s);
    });
    bloque.appendChild(cab);
    function fila(rotulo, idFila, editable, idSinPrefijo) {
      var f = document.createElement("div");
      f.className = "reg-basal-fila";
      if (editable) {
        var inpL = document.createElement("input");
        inpL.type = "text";
        inpL.className = "reg-basal-otro";
        inpL.placeholder = T("registro_otro");
        inpL.value = d.v["e_" + idFila + "_l"] || "";
        inpL.addEventListener("input", function () { d.v["e_" + idFila + "_l"] = inpL.value; guardar.cambiar(); });
        inpL.addEventListener("change", function () { guardar.salir(); });
        f.appendChild(inpL);
      } else {
        var s = document.createElement("span");
        s.className = "reg-basal-rotulo";
        s.textContent = rotulo;
        f.appendChild(s);
      }
      REG_BASALES_COLS.forEach(function (col) {
        if (!regColBasal(col, idSinPrefijo)) {
          f.appendChild(document.createElement("span"));   // hueco en la rejilla
          return;
        }
        var clave = "e_" + idFila + "_" + col.id;
        var inp = document.createElement("input");
        inp.type = "text";
        inp.value = d.v[clave] || "";
        inp.setAttribute("aria-label", (rotulo || T("registro_otro")) + " — " + regL(col));
        inp.addEventListener("input", function () { d.v[clave] = inp.value; guardar.cambiar(); });
        inp.addEventListener("change", function () { guardar.salir(); });
        f.appendChild(inp);
      });
      return f;
    }
    filas.forEach(function (r) { bloque.appendChild(fila(regL(r), prefijo + r.id, false, r.id)); });
    for (var i = 1; i <= libres; i++) bloque.appendChild(fila("", prefijo + "libre" + i, true, "libre" + i));
    cont.appendChild(bloque);
  }

  function pintarSeccionBasales(sec, cont) {
    var d = registroDatos();
    var cRB = registroCaso();
    var tecRB = cRB ? (cRB.tecnicas_realizadas || []) : null;
    var par = document.createElement("div");
    par.className = "reg-basales";
    pintarBloqueBasales(T("registro_sens_otros"), regFilasBasales(REG_BASALES_SENS, "s_", d, tecRB), "s_", REG_BASALES_LIBRES.sens, par, d);
    pintarBloqueBasales(T("registro_motores"), regFilasBasales(REG_BASALES_MOT, "m_", d, tecRB), "m_", REG_BASALES_LIBRES.mot, par, d);
    // La estimulación de tornillos pasó a E2 · Mapeo (28-09-2026), donde
    // solo sale si el caso tiene marcada esa técnica.
    cont.appendChild(par);
  }

  // Fila con algo escrito: para la cuenta del encabezado y para no pedir
  // confirmación al quitar una fila vacía.
  function regFilaConContenido(fila, cols) {
    return cols.some(function (col) { return col.t === "check" ? !!fila[col.id] : !!fila[col.id]; });
  }

  // Cuánto lleva escrito una sección, para el número del encabezado.
  function regCuenta(sec) {
    var d = registroDatos();
    if (sec.tipo === "lista") {
      return d[sec.lista].filter(function (f) { return regFilaConContenido(f, sec.cols); }).length;
    }
    if (sec.tipo === "imagenes") return d.imagenes.length;
    return 0;
  }

  function regAbierta(id) {
    if (!registroAbiertas) {
      try { registroAbiertas = JSON.parse(localStorage.getItem(REGISTRO_ABIERTAS_KEY) || "{}") || {}; }
      catch (e) { registroAbiertas = {}; }
    }
    return !!registroAbiertas[id];
  }
  function regRecordarAbierta(id, abierta) {
    regAbierta(id);
    if (abierta) registroAbiertas[id] = 1; else delete registroAbiertas[id];
    try { localStorage.setItem(REGISTRO_ABIERTAS_KEY, JSON.stringify(registroAbiertas)); } catch (e) { /* sin persistencia */ }
  }

  function renderRegistroContenido() {
    var cont = document.getElementById("registro-contenido");
    cont.textContent = "";
    // Fases, eventos y alarmas se apuntan en un solo sitio, arriba de la hoja
    // (29-09-2026, pedido del usuario): el panel del antiguo modo rápido, que
    // sustituye en pantalla a F y G y deja de ser una vista aparte. Abierto
    // salvo que se pliegue (se recuerda al revés que las demás secciones).
    var detR = document.createElement("details");
    detR.className = "caso-grupo reg-seccion reg-rapido";
    detR.open = !regAbierta("rapido_plegado");
    detR.addEventListener("toggle", function () { regRecordarAbierta("rapido_plegado", !detR.open); });
    var sumR = document.createElement("summary");
    sumR.appendChild(regNodo("span", "", T("rr_en_hoja")));
    detR.appendChild(sumR);
    var cuerpoR = regNodo("div", "caso-grupo-campos");
    pintarPanelApuntar(cuerpoR);
    detR.appendChild(cuerpoR);
    cont.appendChild(detR);
    REG_SECCIONES.forEach(function (sec) {
      // En pantalla, algunas secciones van simplificadas o no van (ver
      // REG_PANTALLA); la hoja impresa sigue saliendo entera.
      var enPantalla = Object.prototype.hasOwnProperty.call(REG_PANTALLA, sec.id) ? REG_PANTALLA[sec.id] : undefined;
      if (enPantalla === null) return;
      // Sin los rótulos «Hoja 1 / Hoja 2» en pantalla (29-09-2026, pedido del
      // usuario): el orden de la pantalla ya no es el del papel. La hoja
      // impresa sigue en sus dos páginas.
      var det = document.createElement("details");
      // Clase por hoja: la hoja 2 lleva casillas del tamaño de las del E2
      // (28-09-2026, pedido del usuario; ver .reg-hoja-2 en style.css).
      det.className = "caso-grupo reg-seccion reg-hoja-" + (sec.hoja || 1);
      det.open = regAbierta(sec.id);
      det.addEventListener("toggle", function () { regRecordarAbierta(sec.id, det.open); });
      var sum = document.createElement("summary");
      var titulo = document.createElement("span");
      titulo.textContent = regL(sec);
      sum.appendChild(titulo);
      var cuenta = document.createElement("span");
      cuenta.className = "reg-cuenta";
      sum.appendChild(cuenta);
      det.appendChild(sum);
      var cuerpo = document.createElement("div");
      cuerpo.className = "caso-grupo-campos";
      if (sec.ayuda && !enPantalla) {
        var ay = document.createElement("p");
        ay.className = "reg-ayuda";
        ay.textContent = campo(sec, "ayuda");
        cuerpo.appendChild(ay);
      }
      var pintarCuenta = function () {
        var n = regCuenta(sec);
        cuenta.textContent = n ? String(n) : "";
      };
      // Cada sección tiene su pintado propio en REG_PANTALLA (o no se enseña);
      // A usa los campos genéricos y E, la tabla de basales. El pintado
      // genérico de listas, zona modular, imágenes y modalidades se retiró
      // el 29-09-2026: ya no se alcanzaba (auditoría, T1).
      if (enPantalla) enPantalla(sec, cuerpo, pintarCuenta);
      else if (sec.tipo === "campos") pintarSeccionCampos(sec, cuerpo);
      else if (sec.tipo === "basales") pintarSeccionBasales(sec, cuerpo);
      pintarCuenta();
      det.appendChild(cuerpo);
      cont.appendChild(det);
    });
    // «Vaciar» solo en Modelo 0 (auditoría 28-09-2026, C2): con un caso
    // vinculado, el Registro guarda basales, alarmas, mapeo y eventos de
    // anestesia que también son datos de la ficha (espejo); vaciarlos de un
    // toque desde la barra de quirófano era demasiado fácil.
    document.getElementById("registro-vaciar").hidden = !!registroCaso();
  }

  /* ---- Modo rápido (27-09-2026) ---------------------------------------
   * Pedido del usuario: la hoja completa tiene demasiados ítems y
   * desplegables para usarla en quirófano con prisa. Aquí se apunta con
   * toques: la fase se marca una vez y la heredan los eventos siguientes, y
   * un cambio de señal es "qué" (las mismas filas que las basales del caso,
   * ver regFilasBasales()) + "qué pasa" + Apuntar.
   * NO tiene datos propios: escribe en las mismas listas "eventos" y
   * "alarmas" de la hoja, así que la hoja completa, la impresión, "Pasar al
   * caso" y el CSV de eventos lo ven sin más. La fase actual tampoco se
   * guarda aparte: es la del último evento F. Lo único extra son dos claves
   * en la fila del evento -alarma_id y recupera_de- para poder deshacer
   * bien; la hoja y el CSV las ignoran porque solo leen sus columnas.
   * 29-09-2026 (pedido del usuario): deja de ser una vista aparte. Es el único
   * sitio donde se apuntan fases, eventos y alarmas, arriba de la Hoja
   * completa; F y G ya no se pintan en pantalla (siguen en la hoja impresa)
   * y lo que se corregía allí -horas, medidas y recuperación de cada alarma-
   * se corrige en la lista «Apuntado». */
  var REG_FASES_RAPIDAS = [
    { l: "Basal", l_en: "Baseline" }, { l: "Posición", l_en: "Positioning" },
    { l: "Incisión", l_en: "Incision" }, { l: "Exposición", l_en: "Exposure" },
    { l: "Apertura dural", l_en: "Dural opening" }, { l: "Descompresión", l_en: "Decompression" },
    { l: "Resección", l_en: "Resection" }, { l: "Instrumentación", l_en: "Instrumentation" },
    { l: "Hemostasia", l_en: "Haemostasis" }, { l: "Cierre", l_en: "Closure" }
  ];
  // "recup": los dos de recuperación cierran la última alarma abierta de la
  // misma modalidad (S/P, los mismos valores que REG_RECUP).
  // Orden (29-09-2026, pedido del usuario): ↑ umbral, ↓ amplitud, ↑ latencia
  // y pérdida; los ids no cambian.
  var REG_CAMBIOS_RAPIDOS = [
    { id: "umbral", l: "↑ umbral", l_en: "↑ threshold" },
    { id: "baja", l: "↓ amplitud", l_en: "↓ amplitude" },
    { id: "latencia", l: "↑ latencia", l_en: "↑ latency" },
    { id: "perdida", l: "Pérdida", l_en: "Loss" },
    { id: "hfd", l: "HFD / descargas", l_en: "HFD / discharges" },
    { id: "recupera_p", l: "Recupera parcial", l_en: "Partial recovery", recup: "P" },
    { id: "recupera", l: "Recupera", l_en: "Recovers", recup: "S" },
    { id: "sin_cambios", l: "Sin cambios", l_en: "No change" }
  ];
  var REG_QUE_ANESTESIA = "__an", REG_QUE_TECNICO = "__t";
  // TOF (29-09-2026, pedido del usuario): las cinco respuestas posibles, ni
  // más ni menos, como eventos de anestesia de un toque (cod "An",
  // modalidad "TOF", cambio "TOF 2/4": así se lee solo en la tabla de
  // eventos de anestesia de la ficha).
  var REG_TOF = ["0/4", "1/4", "2/4", "3/4", "4/4"];
  // Columnas de la cuadrícula de QUÉ (t-SEP, t-MEP... por miembro)
  var REG_MIEMBROS = ["MSD", "MSI", "MID", "MII"];
  // Contexto quirúrgico del evento o la alarma (29-09-2026), lista cerrada.
  // Se guarda el id en ev.contexto; nunca cambiar un id ya usado.
  var REG_CONTEXTO = [
    { v: "diseccion", l: "Disección", l_en: "Dissection" },
    { v: "retraccion", l: "Retracción", l_en: "Retraction" },
    { v: "traccion", l: "Tracción / manipulación", l_en: "Traction / handling" },
    { v: "coagulacion", l: "Coagulación", l_en: "Coagulation" },
    { v: "reseccion", l: "Resección / aspiración", l_en: "Resection / suction" },
    { v: "irrigacion", l: "Irrigación", l_en: "Irrigation" },
    { v: "vascular", l: "Clipaje / oclusión vascular", l_en: "Clipping / vascular occlusion" },
    { v: "implante", l: "Tornillo / implante", l_en: "Screw / implant" },
    { v: "posicion", l: "Cambio de posición", l_en: "Position change" },
    { v: "anestesia", l: "Cambio anestésico", l_en: "Anaesthetic change" },
    { v: "hemodinamica", l: "TA / hemodinámica", l_en: "BP / haemodynamics" }
  ];
  // «Otro» en Qué y en Qué pasa (29-09-2026, pedido del usuario): lo que
  // sea se escribe en la caja de debajo, que si no es un detalle opcional.
  var REG_QUE_OTRO = "__otro", REG_CAMBIO_OTRO = "__otro";
  // Lo elegido y aún sin apuntar. No se guarda: se pierde al cambiar de caso.
  // queNota y faseNota son las cajas de Qué y de Fase; nota, la de Qué pasa.
  function regRapidoVacio() { return { que: "", cambio: "", nota: "", queNota: "", faseNota: "", contexto: "" }; }
  var regRapido = regRapidoVacio();

  function regFaseActual(d) {
    for (var i = d.eventos.length - 1; i >= 0; i--) {
      if (d.eventos[i].cod === "F" && d.eventos[i].fase) return d.eventos[i].fase;
    }
    return "";
  }

  // Modalidades sin fila de basales que también cambian en quirófano. Salen
  // si el caso tiene la técnica; sin caso (Modelo 0), solo las "defecto".
  var REG_QUE_EXTRA = [
    { siempre: true, l: "TOF", l_en: "TOF" },
    { tec: ["emg"], l: "EMG libre", l_en: "Free-run EMG", defecto: true },
    { tec: ["mapeo_raices_tornillos"], l: "Tornillos", l_en: "Screws" },
    { tec: ["rbc"], l: "RBC", l_en: "BCR" },
    { tec: ["br"], l: "Blink", l_en: "Blink" },
    { tec: ["eeg", "ecog"], l: "EEG / ECoG", l_en: "EEG / ECoG" }
  ];

  // "tecExplicitas": técnicas de otro sitio (la ficha, sin guardar); si no se
  // pasa, las del caso vinculado al Registro (null = Modelo 0).
  function regQueRapidos(d, tecExplicitas) {
    var c = registroCaso();
    var tec = tecExplicitas !== undefined ? tecExplicitas : (c ? (c.tecnicas_realizadas || []) : null);
    var extra = REG_QUE_EXTRA.filter(function (x) {
      if (x.siempre) return true;
      return tec ? x.tec.some(function (t) { return tec.indexOf(t) !== -1; }) : !!x.defecto;
    });
    // c-MEP como una sola entrada, detrás de t-MEP MII (28-09-2026, pedido
    // del usuario), en vez de las cuatro filas por miembro de las basales.
    var motores = [];
    regFilasBasales(REG_BASALES_MOT, "m_", d, tec).forEach(function (r) {
      if (/^cmep_/.test(r.id)) return;
      motores.push(r);
      if (r.id === "mep_mii" && (!tec || tec.indexOf("c_pem") !== -1)) motores.push({ l: "c-MEP" });
    });
    return regFilasBasales(REG_BASALES_SENS, "s_", d, tec)
      .concat(motores)
      .concat(extra)
      .map(function (r) { return campo(r, "l"); });
  }

  function regChip(texto, activo, alPulsar, clase) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "rr-chip" + (clase ? " " + clase : "") + (activo ? " activo" : "");
    b.textContent = texto;
    b.addEventListener("click", alPulsar);
    return b;
  }

  function regGrupoRapido(cont, titulo) {
    var t = document.createElement("div");
    t.className = "rr-titulo";
    t.textContent = titulo;
    cont.appendChild(t);
    var fila = document.createElement("div");
    fila.className = "rr-chips";
    cont.appendChild(fila);
    return fila;
  }

  // Dentro de un grupo de chips (una fila o varias), solo uno activo a la
  // vez; pulsar el activo lo desmarca.
  function regElegirEn(fila, boton, clave, valor) {
    var ya = regRapido[clave] === valor;
    regRapido[clave] = ya ? "" : valor;
    Array.prototype.forEach.call(fila.querySelectorAll(".rr-chip"), function (b) { b.classList.remove("activo"); });
    if (!ya) boton.classList.add("activo");
  }

  // El detalle de la fase va en «Acción y resultado» de su fila de F, así el
  // nombre de la fase sigue siendo el del botón (y la heredan los eventos).
  function regTofActual(d) {
    for (var i = d.eventos.length - 1; i >= 0; i--) {
      if (d.eventos[i].modalidad === "TOF" && REG_TOF.indexOf(String(d.eventos[i].cambio).replace(/^TOF /, "")) !== -1) {
        return String(d.eventos[i].cambio).replace(/^TOF /, "");
      }
    }
    return "";
  }
  function regApuntarTof(valor) {
    var d = registroDatos();
    var hora = horaAhora();
    d.eventos.push({ id: uuid(), hora: hora, cod: "An", fase: regFaseActual(d), modalidad: "TOF", cambio: "TOF " + valor });
    registroGuardarYa();
    avisoGuardado(T("rr_tof_apuntado", { v: valor, hora: hora }));
    renderRegistroContenido();
  }

  function regMarcarFase(nombre, detalle) {
    var d = registroDatos();
    detalle = (detalle || "").trim();
    if (!nombre || (nombre === regFaseActual(d) && !detalle)) return;
    var hora = horaAhora();
    var ev = { id: uuid(), hora: hora, cod: "F", fase: nombre };
    if (detalle) ev.accion = detalle;
    d.eventos.push(ev);
    regRapido.faseNota = "";
    registroGuardarYa();
    avisoGuardado(T("rr_fase_marcada", { fase: nombre, hora: hora }));
    renderRegistroContenido();
  }

  function regApuntar(esAlarma) {
    var d = registroDatos();
    var q = regRapido.que;
    var queNota = regRapido.queNota.trim();
    var nota = regRapido.nota.trim();
    if (!q) { avisoGuardado(T("rr_falta_que"), true); return; }
    if (q === REG_QUE_OTRO && !queNota) { avisoGuardado(T("rr_falta_otro"), true); return; }
    var otroCambio = regRapido.cambio === REG_CAMBIO_OTRO;
    if (otroCambio && !nota) { avisoGuardado(T("rr_falta_otro"), true); return; }
    var cambio = REG_CAMBIOS_RAPIDOS.filter(function (x) { return x.id === regRapido.cambio; })[0];
    var hora = horaAhora();
    var fase = regFaseActual(d);
    var esAn = q === REG_QUE_ANESTESIA, esT = q === REG_QUE_TECNICO;
    // "base": la técnica del botón, sin detalle, para cerrar su alarma al
    // recuperarse aunque una de las dos líneas lleve detalle y la otra no.
    var base = (esAn || esT || q === REG_QUE_OTRO) ? "" : q;
    var modalidad = [base, queNota].filter(Boolean).join(" · ");
    // Con «Otro» en Qué pasa, la caja es el cambio; si no, es la nota.
    var textoCambio = otroCambio ? nota : (cambio ? campo(cambio, "l") : "");
    if (otroCambio) nota = "";
    var ev = { id: uuid(), hora: hora, cod: esAlarma ? "A" : (esAn ? "An" : (esT ? "T" : "E")),
               fase: fase, modalidad: modalidad, cambio: textoCambio, accion: nota };
    if (regRapido.contexto) ev.contexto = regRapido.contexto;
    var mensaje = T("rr_apuntado", { hora: hora });
    if (esAlarma) {
      // Las alarmas nacen con filas vacías (min en REG_SECCIONES): se usa la
      // primera libre para que la numeración A1, A2... coincida con la hoja.
      var al = d.alarmas.filter(filaRegistroVacia)[0];
      if (!al) { al = { id: uuid() }; d.alarmas.push(al); }
      var n = "A" + (d.alarmas.indexOf(al) + 1);
      al.hora = hora;
      al.modalidad = modalidad || T(esAn ? "rr_que_anestesia" : "rr_que_tecnico");
      // Ids de las listas cerradas (28-09-2026); la fase va aparte: ya no es
      // la "causa", que ahora se elige de REG_CAUSA_AL.
      al.criterio = otroCambio ? textoCambio : (cambio && !cambio.recup && cambio.id !== "sin_cambios" ? cambio.id : "");
      al.fase = fase;
      if (esAn) al.causa = "anestesica";
      if (esT) al.causa = "tecnica";
      al.medidas = nota;
      var cRap = registroCaso();
      if (cRap) cRap.alerta = true;
      ev.accion = n + (nota ? " · " + nota : "");
      ev.alarma_id = al.id;
      mensaje = T("rr_alarma_apuntada", { n: n, hora: hora });
      regAlarmasAbiertas[al.id] = 1;   // recién apuntada: abierta para marcar el aviso
    } else if (cambio && cambio.recup && modalidad) {
      // Recuperación: cierra la última alarma de esa modalidad que siga
      // abierta (o solo parcialmente recuperada).
      var abierta = null;
      d.alarmas.forEach(function (a, i) {
        var m = String(a.modalidad || "");
        var misma = m === modalidad || (base && (m === base || m.indexOf(base + " · ") === 0));
        if (misma && a.hora && a.recup !== "S") abierta = { a: a, i: i };
      });
      if (abierta) {
        ev.recupera_de = { id: abierta.a.id, recup: abierta.a.recup || "", h_recup: abierta.a.h_recup || "" };
        abierta.a.recup = cambio.recup;
        abierta.a.h_recup = hora;
        mensaje = T("rr_alarma_recuperada", { n: "A" + (abierta.i + 1), min: minutosEntre(abierta.a.hora, hora) });
      }
    }
    d.eventos.push(ev);
    var faseNota = regRapido.faseNota;   // la caja de Fase no es de este apunte
    regRapido = regRapidoVacio();
    regRapido.faseNota = faseNota;
    registroGuardarYa();
    avisoGuardado(mensaje);
    renderRegistroContenido();
  }

  function regQuitarRapido(ev) {
    if (!confirm(T("rr_quitar_conf"))) return;
    var d = registroDatos();
    var i = d.eventos.indexOf(ev);
    if (i !== -1) d.eventos.splice(i, 1);
    d.alarmas.forEach(function (a, j) {
      if (ev.alarma_id && a.id === ev.alarma_id) d.alarmas[j] = { id: a.id };
      if (ev.recupera_de && a.id === ev.recupera_de.id) {
        a.recup = ev.recupera_de.recup;
        a.h_recup = ev.recupera_de.h_recup;
      }
    });
    registroGuardarYa();
    renderRegistroContenido();
  }

  // Caja de texto de un bloque del panel, enlazada a su clave de regRapido.
  function regCajaRapida(clave, placeholder) {
    var caja = document.createElement("input");
    caja.type = "text";
    caja.className = "rr-nota";
    caja.placeholder = placeholder;
    caja.value = regRapido[clave];
    caja.addEventListener("input", function () { regRapido[clave] = caja.value; });
    return caja;
  }

  // Panel «Apuntar fase, evento o alarma», arriba de la Hoja completa, con
  // los tamaños compactos de la hoja (.rr-en-hoja).
  function pintarPanelApuntar(cont) {
    var d = registroDatos();
    var panel = document.createElement("div");
    panel.className = "rr rr-en-hoja";
    var intro = document.createElement("p");
    intro.className = "reg-ayuda";
    intro.textContent = T("rr_intro");
    panel.appendChild(intro);

    // Fase: las de fábrica más las propias ya usadas en este registro
    var faseAct = regFaseActual(d);
    // Dos bloques separados (28-09-2026, pedido del usuario): la FASE se
    // marca sola, cuando toque; "qué" + "qué pasa" van juntos y son los que
    // definen cada evento o alarma.
    var bFase = regNodo("div", "rr-bloque");
    bFase.appendChild(regNodo("div", "rr-bloque-tit", T("rr_fase")));
    panel.appendChild(bFase);
    var estado = document.createElement("div");
    estado.className = "rr-fase-actual";
    estado.textContent = faseAct ? T("rr_fase_actual", { fase: faseAct }) : T("rr_sin_fase");
    bFase.appendChild(estado);
    var filaFases = regNodo("div", "rr-chips");
    bFase.appendChild(filaFases);
    var nombres = REG_FASES_RAPIDAS.map(function (f) { return campo(f, "l"); });
    d.eventos.forEach(function (e) {
      if (e.cod === "F" && e.fase && nombres.indexOf(e.fase) === -1) nombres.push(e.fase);
    });
    nombres.forEach(function (nombre) {
      filaFases.appendChild(regChip(nombre, nombre === faseAct, function () { regMarcarFase(nombre, regRapido.faseNota); }));
    });
    // «Otra»: la fase es lo escrito en la caja (antes, un prompt()).
    filaFases.appendChild(regChip(T("rr_fase_otra"), false, function () {
      var nombre = regRapido.faseNota.trim();
      if (!nombre) { avisoGuardado(T("rr_falta_otro"), true); return; }
      regMarcarFase(nombre);
    }, "rr-chip-otra"));
    bFase.appendChild(regCajaRapida("faseNota", T("rr_fase_detalle")));

    // TOF: cinco botones que se apuntan al tocar, como las fases
    var bTof = regNodo("div", "rr-bloque");
    var tofAct = regTofActual(d);
    bTof.appendChild(regNodo("div", "rr-bloque-tit", "TOF"));
    var filaTof = regNodo("div", "rr-chips");
    REG_TOF.forEach(function (v) {
      // Solo «2/4» en el botón (29-09-2026, pedido del usuario): «TOF» ya va
      // en el título del bloque. Se apunta igual «TOF 2/4».
      var bTofV = regChip(v, v === tofAct, function () { regApuntarTof(v); });
      bTofV.setAttribute("aria-label", "TOF " + v);
      filaTof.appendChild(bTofV);
    });
    bTof.appendChild(filaTof);
    panel.appendChild(bTof);

    var bEvento = regNodo("div", "rr-bloque rr-bloque-evento");
    bEvento.appendChild(regNodo("div", "rr-bloque-tit", T("rr_evento_alarma")));
    panel.appendChild(bEvento);
    // QUÉ en filas por tipo (29-09-2026, pedido del usuario): técnicas,
    // factores técnicos, anestesia -con el TOF, que mide la relajación- y
    // Otro. Sigue siendo una sola elección entre todas las filas.
    bEvento.appendChild(regNodo("div", "rr-titulo", T("rr_que")));
    var queGrupos = regNodo("div", "rr-que-grupos");
    bEvento.appendChild(queGrupos);
    var tecnicasQue = regQueRapidos(d).filter(function (l) { return l !== "TOF"; });
    // Factores técnicos, Anestesia y Otro en una sola fila (29-09-2026,
    // pedido del usuario: caben), cada uno con su rótulo encima; Otro sin
    // rótulo, alineado con los botones.
    var filaCorta = regNodo("div", "rr-que-fila");
    [["rr_grupo_tecnicas", tecnicasQue.map(function (l) { return [l, l]; }), queGrupos],
     ["rr_grupo_factores", [[REG_QUE_TECNICO, T("rr_que_tecnico")]], filaCorta],
     ["rr_grupo_anestesia", [[REG_QUE_ANESTESIA, T("rr_que_anestesia")]], filaCorta],
     [null, [[REG_QUE_OTRO, T("rr_otro"), "rr-chip-otra"]], filaCorta]
    ].forEach(function (g) {
      if (!g[1].length) return;
      var dest = g[2] === queGrupos ? queGrupos : regNodo("div", "rr-que-sub");
      dest.appendChild(regNodo("div", "rr-subtit", g[0] ? T(g[0]) : "\u00a0"));
      var chipQue = function (p) {
        return regChip(p[1], regRapido.que === p[0], function (e) { regElegirEn(queGrupos, e.currentTarget, "que", p[0]); }, p[2]);
      };
      // Técnicas de los cuatro miembros (t-SEP, t-MEP, c-SEP...) en cuadrícula
      // (29-09-2026, pedido del usuario): una fila por técnica y cada miembro
      // en su columna, MSD · MSI · MID · MII. El resto, en fila normal debajo.
      var resto = g[1];
      if (g[0] === "rr_grupo_tecnicas") {
        var filasMiembros = {}, ordenFilas = [];
        resto = g[1].filter(function (p) {
          var m = /^(.+) (MSD|MSI|MID|MII)$/.exec(p[1]);
          if (!m) return true;
          if (!filasMiembros[m[1]]) { filasMiembros[m[1]] = []; ordenFilas.push(m[1]); }
          filasMiembros[m[1]].push({ p: p, col: REG_MIEMBROS.indexOf(m[2]) + 1 });
          return false;
        });
        if (ordenFilas.length) {
          var cuadro = regNodo("div", "rr-que-cuadro");
          // Rótulo de la técnica a la izquierda y, en cada botón, solo el
          // miembro: el nombre entero no cabía a 375 px. Se apunta igual el
          // nombre completo («t-MEP MID»), que va también en el title.
          ordenFilas.forEach(function (pref, fila) {
            var rot = regNodo("span", "rr-que-cuadro-rot", pref);
            rot.style.gridRow = String(fila + 1);
            rot.style.gridColumn = "1";
            cuadro.appendChild(rot);
            filasMiembros[pref].forEach(function (x) {
              var b = chipQue(x.p);
              b.textContent = REG_MIEMBROS[x.col - 1];
              b.title = x.p[1];
              b.setAttribute("aria-label", x.p[1]);
              b.style.gridRow = String(fila + 1);
              b.style.gridColumn = String(x.col + 1);
              cuadro.appendChild(b);
            });
          });
          dest.appendChild(cuadro);
        }
      }
      var filaG = regNodo("div", "rr-chips");
      resto.forEach(function (p) { filaG.appendChild(chipQue(p)); });
      if (resto.length) dest.appendChild(filaG);
      if (dest !== queGrupos) filaCorta.appendChild(dest);
    });
    queGrupos.appendChild(filaCorta);
    bEvento.appendChild(regCajaRapida("queNota", T("rr_que_detalle")));

    var filaCambio = regGrupoRapido(bEvento, T("rr_que_pasa"));
    // Sin «Recupera parcial», «Recupera» ni «Sin cambios» (29-09-2026, pedido
    // del usuario: la recuperación se marca en su sitio, dentro de cada
    // alarma, con «Ahora»). Siguen en la lista para leer lo ya apuntado.
    REG_CAMBIOS_RAPIDOS.filter(function (c) { return !c.recup && c.id !== "sin_cambios"; })
      .map(function (c) { return [c.id, campo(c, "l")]; })
      .concat([[REG_CAMBIO_OTRO, T("rr_otro"), "rr-chip-otra"]])
      .forEach(function (p) {
        var b = regChip(p[1], regRapido.cambio === p[0], function () { regElegirEn(filaCambio, b, "cambio", p[0]); }, p[2]);
        filaCambio.appendChild(b);
      });
    bEvento.appendChild(regCajaRapida("nota", T("rr_nota")));

    var filaCtx = regGrupoRapido(bEvento, T("rr_contexto"));
    REG_CONTEXTO.forEach(function (c) {
      var b = regChip(campo(c, "l"), regRapido.contexto === c.v, function () { regElegirEn(filaCtx, b, "contexto", c.v); });
      filaCtx.appendChild(b);
    });

    var botones = document.createElement("div");
    botones.className = "rr-botones";
    var bEv = document.createElement("button");
    bEv.type = "button";
    bEv.className = "primario";
    bEv.textContent = T("rr_apuntar_evento");
    bEv.addEventListener("click", function () { regApuntar(false); });
    var bAl = document.createElement("button");
    bAl.type = "button";
    bAl.className = "rr-alarma";
    bAl.textContent = T("rr_apuntar_alarma");
    bAl.addEventListener("click", function () { regApuntar(true); });
    botones.appendChild(bEv);
    botones.appendChild(bAl);
    bEvento.appendChild(botones);

    // Lo apuntado, en orden de hora (lo último, abajo)
    panel.appendChild(regNodo("div", "rr-titulo", T("rr_apuntado_lista")));
    var lista = regNodo("div", "rr-lista");
    var items = regItemsApuntados(d);
    if (!items.length) lista.appendChild(regNodo("p", "reg-ayuda", T("rr_vacio")));
    items.forEach(function (it) { lista.appendChild(regLineaApuntada(d, it)); });
    panel.appendChild(lista);
    cont.appendChild(panel);
  }

  // Lo que sale en «Apuntado»: los eventos, cada uno con su alarma si la
  // tiene, y las alarmas escritas sin evento (de antes, de la ficha o de la
  // hoja): ya no hay sección G en pantalla donde verlas (29-09-2026). Por
  // hora, de lo más antiguo a lo más reciente (29-09-2026, pedido del
  // usuario: más natural); a igual hora, en el orden en que se apuntó; lo
  // que no tenga hora, al final.
  function regItemsApuntados(d) {
    var items = [], conEvento = {};
    d.eventos.forEach(function (ev, k) {
      var it = { ev: ev, orden: k };
      if (ev.alarma_id) {
        d.alarmas.forEach(function (a, i) {
          if (a.id === ev.alarma_id && !filaRegistroVacia(a)) { it.al = a; it.n = i + 1; conEvento[a.id] = 1; }
        });
      }
      items.push(it);
    });
    // Un evento A escrito a mano (sin alarma_id: la demo, la ficha) va con
    // la alarma de su misma hora, en vez de salir dos veces; y se enlaza,
    // para que corregir la hora o quitar la línea alcance también a la alarma.
    items.forEach(function (it) {
      if (it.al || it.ev.cod !== "A" || !it.ev.hora) return;
      d.alarmas.forEach(function (a, i) {
        if (!it.al && !conEvento[a.id] && !filaRegistroVacia(a) && a.hora === it.ev.hora) {
          it.al = a; it.n = i + 1; conEvento[a.id] = 1;
          it.ev.alarma_id = a.id;
        }
      });
    });
    d.alarmas.forEach(function (a, i) {
      if (filaRegistroVacia(a) || conEvento[a.id]) return;
      items.push({ al: a, n: i + 1, orden: d.eventos.length + i });
    });
    function hora(it) { return (it.ev ? it.ev.hora : it.al.hora) || ""; }
    return items.sort(function (x, y) {
      var hx = hora(x), hy = hora(y);
      if (hx !== hy) {
        if (!hx) return 1;
        if (!hy) return -1;
        return hx < hy ? -1 : 1;
      }
      return x.orden - y.orden;
    });
  }

  function regLineaApuntada(d, it) {
    var ev = it.ev, al = it.al;
    var caja = regNodo("div", "rr-item");
    var fila = regNodo("div", "rr-linea" + (al ? " rr-linea-alarma" : "") + (ev && ev.cod === "F" ? " rr-linea-fase" : ""));
    // La hora se puede corregir aquí mismo (28-09-2026, pedido del
    // usuario: por si no se apuntó en el momento). Si la línea es una
    // alarma o una recuperación, cambia también la hora de la alarma.
    var h = document.createElement("input");
    h.type = "time";
    h.className = "rr-hora";
    h.value = (ev ? ev.hora : al.hora) || "";
    h.title = T("rr_hora_editar");
    h.setAttribute("aria-label", T("rr_hora_editar"));
    h.addEventListener("change", function () {
      if (ev) {
        ev.hora = h.value;
        d.alarmas.forEach(function (a) {
          if (ev.alarma_id && a.id === ev.alarma_id) a.hora = h.value;
          if (ev.recupera_de && a.id === ev.recupera_de.id) a.h_recup = h.value;
        });
      } else {
        al.hora = h.value;
      }
      registroGuardarYa();
      renderRegistroContenido();   // se reordena y se ve la hora nueva abajo
    });
    fila.appendChild(h);
    fila.appendChild(regNodo("span", "rr-cod", ev ? (ev.cod || "") : "A"));
    var txt = regNodo("span", "rr-texto");
    if (ev && ev.cod === "F") {
      txt.textContent = [ev.fase, ev.accion].filter(Boolean).join(" · ");
    } else {
      // En una alarma, la nota ya no se enseña aquí: está en sus medidas.
      var partes = al
        ? [al.modalidad || (ev && ev.modalidad), ev ? ev.cambio : regTextoLista(REG_CRITERIO_AL, al.criterio), "A" + it.n]
        : [ev.cambio && ev.modalidad && String(ev.cambio).indexOf(ev.modalidad) === 0 ? "" : ev.modalidad, ev.cambio, ev.accion];
      txt.textContent = partes.filter(Boolean).join(" · ");
      var fase = ev ? ev.fase : al.fase;
      var ctx = ev && ev.contexto ? regTextoLista(REG_CONTEXTO, ev.contexto) : "";
      if (fase || ctx) txt.appendChild(regNodo("small", null, " " + [fase ? T("rr_en_fase", { fase: fase }) : "", ctx].filter(Boolean).join(" · ")));
    }
    fila.appendChild(txt);
    // Corregir la línea (29-09-2026, pedido del usuario): solo con ✎ (tocar
    // el texto ya no la abre), que tiene la zona táctil ampliada; otra vez, o
    // «Hecho», cierra las casillas.
    var clave = ev ? ev.id : al.id;
    var alternarEdicion = function () {
      regEditando = regEditando === clave ? "" : clave;
      renderRegistroContenido();
    };
    var ed = regNodo("button", "rr-editar-btn" + (regEditando === clave ? " activo" : ""), "✎");
    ed.type = "button";
    ed.title = T("rr_editar");
    ed.setAttribute("aria-label", T("rr_editar"));
    ed.addEventListener("click", alternarEdicion);
    fila.appendChild(ed);
    var q = regNodo("button", "reg-fila-quitar", "✕");
    q.type = "button";
    q.title = T("rr_quitar");
    q.setAttribute("aria-label", T("rr_quitar"));
    q.addEventListener("click", function () {
      if (ev) { regQuitarRapido(ev); return; }
      if (!confirm(T("reg_p_vaciar_alarma"))) return;
      d.alarmas[it.n - 1] = { id: al.id };
      registroGuardarYa();
      renderRegistroContenido();
    });
    fila.appendChild(q);
    caja.appendChild(fila);
    if (regEditando === clave) caja.appendChild(regEditorApuntado(d, ev, al));
    if (al) {
      // Debajo de cada alarma, lo que antes se completaba en G: causa
      // probable (29-09-2026, pedido del usuario), medidas adoptadas y
      // recuperación Sí / Parcial / No con su hora.
      // Plegable (29-09-2026, pedido del usuario: ocupaban mucho): plegada
      // enseña un resumen; se recuerda abierta o no mientras dura la sesión
      // (regAlarmasAbiertas), y la recién apuntada sale abierta.
      var plegable = document.createElement("details");
      plegable.className = "rr-al-plegable";
      plegable.open = !!regAlarmasAbiertas[al.id];
      plegable.addEventListener("toggle", function () {
        if (plegable.open) regAlarmasAbiertas[al.id] = 1; else delete regAlarmasAbiertas[al.id];
      });
      var sumAl = document.createElement("summary");
      var titAl = regNodo("span", "rr-al-sum-tit", T("rr_al_detalle"));
      var resumenAl = regNodo("span", "rr-al-resumen");
      sumAl.appendChild(titAl);
      sumAl.appendChild(resumenAl);
      plegable.appendChild(sumAl);
      // El rótulo solo si aún no hay nada; si no, el sitio es para el resumen
      var pintarResumenAl = function () {
        var txtR = resumenAlarma(al);
        resumenAl.textContent = txtR;
        titAl.hidden = !!txtR;
      };
      pintarResumenAl();
      var det = regNodo("div", "reg-p-alarma rr-al-detalle");
      plegable.appendChild(det);
      var alCambiarAl = function () {
        var c = registroCaso();
        if (c && alarmasConDatos(d).length) c.alerta = true;
        pintarResumenAl();
      };
      det.appendChild(regSelectLista(al, "causa", REG_CAUSA_AL, T("reg_p_causa_l"), alCambiarAl));
      pintarMedidasRecup(det, al, REG_GUARDAR, alCambiarAl, function () {
        // La hora de recuperación mueve también la línea «Recupera» que la puso
        for (var k = d.eventos.length - 1; k >= 0; k--) {
          if (d.eventos[k].recupera_de && d.eventos[k].recupera_de.id === al.id) { d.eventos[k].hora = al.h_recup || ""; break; }
        }
        registroGuardarYa();
        renderRegistroContenido();
      });
      caja.appendChild(plegable);
    }
    return caja;
  }

  var regAlarmasAbiertas = {};
  // «Aviso al cirujano, ↑ TAM · recupera 09:20»: lo que hay dentro de una
  // alarma plegada.
  function resumenAlarma(al) {
    var partes = [];
    if (al.causa) partes.push(regTextoLista(REG_CAUSA_AL, al.causa));
    // En el orden de la lista (los avisos primero), no en el que se marcaron
    var med = REG_MEDIDAS_AL.filter(function (m) { return (al.medidas_l || []).indexOf(m.v) !== -1; })
      .map(function (m) { return regOpcionLabel(m); });
    if (al.medidas) med.push(al.medidas);
    if (med.length) partes.push(med.join(", "));
    if (al.recup) partes.push(regTextoLista(REG_RECUP, al.recup).replace(/^[SPN] · /, "") + (al.h_recup ? " " + al.h_recup : ""));
    return partes.join(" · ");
  }

  // Casillas para corregir una línea de «Apuntado». Una alarma con evento se
  // corrige en el evento y se copia a su alarma: técnica, fase y criterio (el
  // id si el cambio es uno de los botones; si no, el texto).
  var regEditando = "";
  function regEditorApuntado(d, ev, al) {
    var box = regNodo("div", "rr-editor");
    var copiarAAlarma = function () {
      if (!ev || !al) return;
      al.modalidad = ev.modalidad || "";
      al.fase = ev.fase || "";
      var c = REG_CAMBIOS_RAPIDOS.filter(function (x) {
        return !x.recup && x.id !== "sin_cambios" && campo(x, "l") === ev.cambio;
      })[0];
      al.criterio = c ? c.id : (ev.cambio || "");
    };
    function casilla(obj, k, etiqueta) {
      box.appendChild(regNodo("span", "rr-editor-et", etiqueta));
      box.appendChild(regInputSinTexto(obj, k, "text", etiqueta, copiarAAlarma));
    }
    if (ev && ev.cod === "F") {
      casilla(ev, "fase", T("rr_fase"));
      casilla(ev, "accion", T("rr_detalle"));
    } else if (ev) {
      casilla(ev, "modalidad", T("rr_que"));
      casilla(ev, "cambio", T("rr_que_pasa"));
      // En una alarma, la nota son sus medidas (debajo)
      if (!al) casilla(ev, "accion", T("rr_nota_l"));
      casilla(ev, "fase", T("rr_fase"));
      box.appendChild(regNodo("span", "rr-editor-et", T("rr_contexto")));
      box.appendChild(regSelectLista(ev, "contexto", REG_CONTEXTO, T("rr_contexto")));
    } else {
      casilla(al, "modalidad", T("rr_que"));
      box.appendChild(regNodo("span", "rr-editor-et", T("reg_p_criterio")));
      box.appendChild(regSelectLista(al, "criterio", REG_CRITERIO_AL, T("reg_p_criterio")));
      casilla(al, "fase", T("rr_fase"));
    }
    var hecho = regNodo("button", "rr-editor-hecho", T("rr_editar_hecho"));
    hecho.type = "button";
    hecho.addEventListener("click", function () {
      regEditando = "";
      registroGuardarYa();
      renderRegistroContenido();
    });
    box.appendChild(hecho);
    return box;
  }

  /* ---- Hoja completa en pantalla, simplificada (28-09-2026) -----------
   * Pedido del usuario: en el móvil/tablet/ordenador la hoja completa tenía
   * demasiada información. La hoja IMPRESA no cambia
   * (construirHojaRegistroInterna() tiene su propio pintado) y los datos
   * tampoco: lo que no se enseña aquí sigue guardado y sale impreso.
   *   B y C: solo lo que ya dice la ficha del caso, de lectura.
   *   D (hitos) y el esquema: no van en pantalla.
   *   E2 mapeo: electrodo motor y músculos registrados (campos gridN_*).
   *   F y G: filas compactas con la letra de "Basales y comparativa".
   *   I cierre: resultado, modalidades afectadas (de las técnicas del caso),
   *   déficit esperado, incidencias y perla docente.
   * Lo que no está en REG_PANTALLA se pinta como siempre. */
  var REG_PANTALLA = {
    a: pintarPantallaIdentificacion,
    b: pintarPantallaModalidades,
    c: pintarPantallaAnestesia,
    d: null,
    e2: pintarPantallaMapeo,
    esquema: null,
    // F y G: se apuntan y corrigen en el panel de arriba (29-09-2026).
    f: null,
    g: null,
    // Zona modular: tampoco en pantalla (28-09-2026, el usuario no la ve útil
    // en la herramienta); sigue en la hoja impresa.
    h: null,
    i: pintarPantallaCierre
  };

  function regNodo(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto !== undefined && texto !== null) n.textContent = texto;
    return n;
  }

  // Campo de texto de una fila: guarda en obj[clave] al escribir y al salir.
  // "guardar" (opcional): { cambiar, salir }. Por defecto guarda el Registro;
  // la ficha del caso pasa uno que no hace nada, porque allí se trabaja
  // sobre la copia de trabajo y se guarda con "Guardar" (como las basales).
  var REG_GUARDAR = { cambiar: function () { registroGuardar(); }, salir: function () { registroGuardarYa(); } };
  var REG_SIN_GUARDAR = { cambiar: function () {}, salir: function () {} };

  function regInput(obj, clave, tipo, placeholder, alCambiar, guardar) {
    guardar = guardar || REG_GUARDAR;
    var inp = document.createElement("input");
    inp.type = tipo || "text";
    inp.value = obj[clave] || "";
    if (placeholder) { inp.placeholder = placeholder; inp.setAttribute("aria-label", placeholder); }
    inp.addEventListener("input", function () { obj[clave] = inp.value; guardar.cambiar(); if (alCambiar) alCambiar(); });
    inp.addEventListener("change", function () { guardar.salir(); });
    return inp;
  }

  // Casilla de una tabla con cabecera: sin texto dentro, que ya lo dice la
  // cabecera (29-09-2026, pedido del usuario); el rótulo queda como
  // aria-label para el lector de pantalla.
  function regInputSinTexto(obj, clave, tipo, etiqueta, alCambiar, guardar) {
    var inp = regInput(obj, clave, tipo, etiqueta, alCambiar, guardar);
    inp.placeholder = "";
    return inp;
  }

  // Desplegable sobre una lista {v, l}: un valor guardado que no está en la
  // lista (texto libre de antes) se ofrece como una opción más.
  function regSelectLista(obj, clave, lista, etiqueta, alCambiar, guardar) {
    guardar = guardar || REG_GUARDAR;
    var sel = document.createElement("select");
    sel.setAttribute("aria-label", etiqueta);
    var vacia = document.createElement("option");
    vacia.value = "";
    vacia.textContent = etiqueta + "…";
    sel.appendChild(vacia);
    lista.forEach(function (o) {
      var op = document.createElement("option");
      op.value = o.v;
      op.textContent = regOpcionLabel(o);
      sel.appendChild(op);
    });
    var val = regIdLista(lista, obj[clave]);
    if (val && !lista.some(function (o) { return o.v === val; })) {
      var propia = document.createElement("option");
      propia.value = String(val);
      propia.textContent = String(val);
      sel.appendChild(propia);
    }
    sel.value = val || "";
    sel.addEventListener("change", function () {
      obj[clave] = sel.value;
      guardar.salir();
      if (alCambiar) alCambiar();
    });
    return sel;
  }

  function regNombresTecnicas(ids) {
    ids = ids || [];
    return TECNICAS.filter(function (t) { return ids.indexOf(t.id) !== -1; })
      .map(function (t) { return campo(t, "etiqueta"); });
  }
  function regTecnicasCaso(c) {
    return regNombresTecnicas(c ? c.tecnicas_realizadas : []);
  }

  // A, igual que siempre, más el aviso de los campos compartidos (⇄)
  function pintarPantallaIdentificacion(sec, cont) {
    pintarSeccionCampos(sec, cont);
    if (registroCaso()) cont.appendChild(regNodo("p", "reg-ayuda", T("reg_p_compartido")));
  }

  function pintarPantallaModalidades(sec, cont) {
    var c = registroCaso();
    if (!c) { cont.appendChild(regNodo("p", "reg-ayuda reg-estado", T("reg_p_sin_caso"))); return; }
    var nombres = regTecnicasCaso(c);
    if (!nombres.length) { cont.appendChild(regNodo("p", "reg-ayuda reg-estado", T("reg_p_sin_tecnicas"))); return; }
    // Agrupadas como en Gestión de Casos: monitorización, reflejos, mapeo.
    var fila = regNodo("div", "chip-fila");
    var hechas = c.tecnicas_realizadas || [];
    anadirChipsAgrupados(fila, TECNICAS.filter(function (t) { return hechas.indexOf(t.id) !== -1; }), function (t) {
      return rotularChipTecnica(regNodo("span", "reg-p-chip"), t);
    });
    cont.appendChild(fila);
    cont.appendChild(regNodo("p", "reg-ayuda", T("reg_p_tecnicas_ayuda")));
  }

  /* C · Anestesia en espejo con la ficha (28-09-2026, pedido del usuario:
     escribir en los dos lados). Los cuatro campos del apartado Anestesia de
     la ficha, compartidos (⇄, "caso:" como el resto: regGet() los lee del
     caso y regControl() los escribe en él), y debajo los eventos de
     anestesia (cod "An" de F), la misma tabla que la ficha. La hoja impresa
     no cambia. Sin caso vinculado no hay ficha que reflejar. */
  function pintarPantallaAnestesia(sec, cont) {
    var c = registroCaso();
    if (!c) { cont.appendChild(regNodo("p", "reg-ayuda reg-estado", T("reg_p_sin_caso"))); return; }
    var d = registroDatos();
    function lista(grupo) {
      return OPCIONES[grupo].map(function (v) { return { v: v, l: opcionTexto(grupo, v) }; });
    }
    var defs = [
      { id: "an_tipo", l: T("caso_tipo_anestesia"), t: "sel", o: lista("anestesia"), caso: "tipo_anestesia" },
      { id: "an_tof", l: T("caso_tof_monitorizado"), t: "sel", o: lista("sino"), caso: "tof_monitorizado" },
      { id: "an_detalle", l: T("caso_tipo_anestesia_detalle"), t: "text", ancho: true, caso: "tipo_anestesia_detalle" },
      { id: "an_incidencias", l: T("caso_incidencias_anestesicas"), t: "area", ancho: true, caso: "incidencias_anestesicas" }
    ];
    var grid = regNodo("div", "reg-grid");
    defs.forEach(function (def) { grid.appendChild(regControl(def, d.v)); });
    cont.appendChild(grid);
    cont.appendChild(regNodo("div", "reg-basal-titulo reg-p-map-tit", T("caso_eventos_anestesia") + " ⇄"));
    pintarEventosAn(cont, d, REG_GUARDAR, true);
    cont.appendChild(regNodo("p", "reg-ayuda", T("reg_p_anest_ayuda")));
  }

  /* E2 · Mapeo en pantalla (28-09-2026, pedido del usuario): un bloque por
     técnica de mapeo marcada en el caso; sin caso (Modelo 0), todos.
       c-MEP por GRID: electrodo motor · músculos registrados (gridN_*).
       Cortical / subcortical: hora · punto · umbral · músculo (filas de
         d.mapeo con tipo C / S, las mismas que imprime la hoja).
       Nervio periférico: nervio/punto · intensidad · músculo (tipo N).
       Raíces y tornillos: nivel · izq. · der. = los "Umbrales EMG por raíz"
         de la ficha (umbral_raices_niveles), el mismo dato; sin caso, la
         tabla suelta de la hoja (e_t_*). */
  var REG_MAPEO_BLOQUES = [
    { tec: "c_pem", t: "reg_p_map_grid", pintar: pintarMapeoGrid },
    { tec: "mapeo_cortical", t: "reg_p_map_cortical", pintar: function (cont, d, g) { pintarMapeoFilas(cont, d, "C", true, g); } },
    { tec: "mapeo_subcortical", t: "reg_p_map_subcortical", pintar: function (cont, d, g) { pintarMapeoFilas(cont, d, "S", true, g); } },
    { tec: "mapeo_nervio_periferico", t: "reg_p_map_nervio", pintar: function (cont, d, g) { pintarMapeoFilas(cont, d, "N", false, g); } },
    { tec: "mapeo_raices_tornillos", t: "reg_p_map_raices", pintar: pintarMapeoRaices }
  ];
  var REG_NIVELES_RAICES = ["C1", "C2", "C3", "C4", "C5", "C6", "C7",
    "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12",
    "L1", "L2", "L3", "L4", "L5", "S1", "S2"];

  function pintarPantallaMapeo(sec, cont) {
    var d = registroDatos();
    var c = registroCaso();
    var tec = c ? (c.tecnicas_realizadas || []) : null;
    cont.appendChild(regNodo("p", "reg-ayuda", T("reg_p_mapeo_nota")));
    var bloques = REG_MAPEO_BLOQUES.filter(function (b) { return !tec || tec.indexOf(b.tec) !== -1; });
    if (!bloques.length) { cont.appendChild(regNodo("p", "reg-ayuda reg-estado", T("reg_p_mapeo_ninguna"))); return; }
    bloques.forEach(function (b) {
      cont.appendChild(regNodo("div", "reg-basal-titulo reg-p-map-tit", T(b.t)));
      b.pintar(cont, d);
    });
  }

  // Electrodo motor y músculos registrados: los mismos gridN_motor /
  // gridN_musculos que imprime la hoja.
  function pintarMapeoGrid(cont, d, guardar) {
    var tabla = regNodo("div", "reg-basal reg-p-mapeo");
    var cab = regNodo("div", "reg-basal-fila reg-basal-cab");
    cab.appendChild(regNodo("span", null, ""));
    cab.appendChild(regNodo("span", null, T("reg_p_motor")));
    cab.appendChild(regNodo("span", null, T("reg_p_musculos")));
    tabla.appendChild(cab);
    [1, 2].forEach(function (n) {
      var f = regNodo("div", "reg-basal-fila");
      f.appendChild(regNodo("span", "reg-basal-rotulo", String(n)));
      f.appendChild(regInputSinTexto(d.v, "grid" + n + "_motor", "text", T("reg_p_motor"), null, guardar));
      f.appendChild(regInputSinTexto(d.v, "grid" + n + "_musculos", "text", T("reg_p_musculos"), null, guardar));
      tabla.appendChild(f);
    });
    cont.appendChild(tabla);
  }

  // Filas de d.mapeo de un tipo (C, S o N). Siempre 3 en blanco al final,
  // que entran en la lista al escribir en ellas, como los eventos.
  function pintarMapeoFilas(cont, d, tipo, conHora, guardar) {
    guardar = guardar || REG_GUARDAR;
    // En la ficha (se rellena después de la cirugía) la hora no se pone sola.
    var horaSola = conHora && guardar !== REG_SIN_GUARDAR;
    var tabla = regNodo("div", "reg-basal reg-p-mapfilas" + (conHora ? " con-hora" : ""));
    cont.appendChild(tabla);
    var btn = regNodo("button", "reg-p-nuevo", T("reg_p_fila_nueva"));
    btn.type = "button";
    cont.appendChild(btn);
    var enBlanco = [];
    function pintar() {
      tabla.textContent = "";
      var cab = regNodo("div", "reg-basal-fila reg-basal-cab");
      (conHora ? [T("reg_p_hora"), T("reg_p_punto"), T("reg_p_umbral"), T("reg_p_musculo"), ""]
               : [T("reg_p_nervio"), T("reg_p_intensidad"), T("reg_p_musculo"), ""])
        .forEach(function (t) { cab.appendChild(regNodo("span", null, t)); });
      tabla.appendChild(cab);
      var propias = d.mapeo.filter(function (f) { return f.tipo === tipo; });
      enBlanco = enBlanco.filter(function (f) { return d.mapeo.indexOf(f) === -1; });
      while (enBlanco.length < 3) enBlanco.push({ id: uuid(), tipo: tipo });
      propias.concat(enBlanco).forEach(function (m) {
        var blanca = d.mapeo.indexOf(m) === -1;
        var f = regNodo("div", "reg-basal-fila");
        var inpHora = null;
        function tocar() {
          if (d.mapeo.indexOf(m) === -1) {
            if (horaSola && !m.hora) { m.hora = horaAhora(); if (inpHora) inpHora.value = m.hora; }
            d.mapeo.push(m);
            guardar.cambiar();
          }
        }
        if (conHora) { inpHora = regInputSinTexto(m, "hora", "time", T("reg_p_hora"), tocar, guardar); f.appendChild(inpHora); }
        f.appendChild(regInputSinTexto(m, "punto", "text", T(conHora ? "reg_p_punto" : "reg_p_nervio"), tocar, guardar));
        var um = regInputSinTexto(m, "umbral", "text", T(conHora ? "reg_p_umbral" : "reg_p_intensidad"), tocar, guardar);
        um.inputMode = "decimal";
        f.appendChild(um);
        f.appendChild(regInputSinTexto(m, "respuesta", "text", T("reg_p_musculo"), tocar, guardar));
        if (!blanca) {
          var q = regNodo("button", "reg-fila-quitar", "✕");
          q.type = "button";
          q.title = T("registro_fila_quitar");
          q.setAttribute("aria-label", T("registro_fila_quitar"));
          q.addEventListener("click", function () {
            if (!confirm(T("registro_fila_quitar_conf"))) return;
            var i = d.mapeo.indexOf(m);
            if (i !== -1) d.mapeo.splice(i, 1);
            guardar.salir();
            pintar();
          });
          f.appendChild(q);
        } else {
          f.appendChild(regNodo("span"));
        }
        tabla.appendChild(f);
      });
    }
    btn.addEventListener("click", function () {
      var m = { id: uuid(), tipo: tipo };
      if (horaSola) m.hora = horaAhora();
      d.mapeo.push(m);
      guardar.salir();
      pintar();
    });
    pintar();
  }

  /* Eventos de anestesia (cod "An" de F) en una tabla corta: hora · qué ·
     ✕. La usa la ficha del caso, en espejo con el Registro (28-09-2026).
     "conHora": los nuevos nacen con la hora actual (en quirófano sí; en la
     ficha, que se rellena después, no). */
  function pintarEventosAn(cont, d, guardar, conHora) {
    guardar = guardar || REG_GUARDAR;
    var tabla = regNodo("div", "reg-basal reg-p-ev reg-p-an");
    cont.appendChild(tabla);
    var btn = regNodo("button", "reg-p-nuevo", T("reg_p_an_nuevo"));
    btn.type = "button";
    cont.appendChild(btn);
    function pintar() {
      tabla.textContent = "";
      var ans = d.eventos.filter(function (e) { return e.cod === "An"; });
      if (!ans.length) { tabla.appendChild(regNodo("p", "caso-ro", T("reg_p_sin_an"))); return; }
      ans.forEach(function (ev) {
        var f = regNodo("div", "reg-basal-fila");
        f.appendChild(regInput(ev, "hora", "time", T("reg_p_hora"), null, guardar));
        var que = regInput(ev, "cambio", "text", T("reg_p_que"), null, guardar);
        f.appendChild(que);
        var q = regNodo("button", "reg-fila-quitar", "✕");
        q.type = "button";
        q.title = T("registro_fila_quitar");
        q.setAttribute("aria-label", T("registro_fila_quitar"));
        q.addEventListener("click", function () {
          if (!confirm(T("reg_p_quitar_evento"))) return;
          var i = d.eventos.indexOf(ev);
          if (i !== -1) d.eventos.splice(i, 1);
          guardar.salir();
          pintar();
        });
        f.appendChild(q);
        tabla.appendChild(f);
        if (ev.accion) tabla.appendChild(regNodo("small", "reg-p-extra", ev.accion));
      });
    }
    btn.addEventListener("click", function () {
      d.eventos.push({ id: uuid(), cod: "An", hora: conHora ? horaAhora() : "", cambio: "" });
      guardar.salir();
      pintar();
    });
    pintar();
  }

  /* Umbrales EMG por raíz, en columna vertebral: chips para elegir los
     niveles y, debajo, los niveles en orden anatómico unidos por una línea
     vertical, con una rama a cada lado hasta el umbral de ese lado. Entre
     niveles no contiguos (L3 y L5, por ejemplo) la línea es discontinua. La
     usan la ficha (sobre la copia de trabajo, guardar = REG_SIN_GUARDAR) y el
     E2 del Registro (el mismo dato del caso). datos = { niveles, valores:
     {NIVEL: {izq, der}} }. Un nivel desmarcado conserva sus valores: es
     texto escrito a mano, se deja de mostrar pero no se pierde. */
  function pintarColumnaRaices(cont, datos, guardar, compartido) {
    guardar = guardar || REG_GUARDAR;
    if (!datos.niveles) datos.niveles = [];
    if (!datos.valores) datos.valores = {};
    var filaNiveles = document.createElement("div");
    filaNiveles.className = "chip-fila";
    var contValores = document.createElement("div");
    contValores.className = "umbral-raices-valores";
    function pintarValores() {
      contValores.textContent = "";
      var ordenados = datos.niveles.slice().sort(function (a, b) {
        return REG_NIVELES_RAICES.indexOf(a) - REG_NIVELES_RAICES.indexOf(b);
      });
      if (!ordenados.length) return;
      var cab = document.createElement("div");
      cab.className = "umbral-raices-fila umbral-raices-cab";
      [T("umbral_raices_cab_izq"), "", T("umbral_raices_cab_nivel") + (compartido ? " ⇄" : ""), "", T("umbral_raices_cab_der")].forEach(function (t) {
        var sp = document.createElement("span");
        sp.textContent = t;
        cab.appendChild(sp);
      });
      contValores.appendChild(cab);
      ordenados.forEach(function (nivel, k) {
        if (!datos.valores[nivel]) datos.valores[nivel] = {};
        var vals = datos.valores[nivel];
        var pos = REG_NIVELES_RAICES.indexOf(nivel);
        var saltoArriba = k > 0 && pos - REG_NIVELES_RAICES.indexOf(ordenados[k - 1]) > 1;
        var saltoAbajo = k < ordenados.length - 1 && REG_NIVELES_RAICES.indexOf(ordenados[k + 1]) - pos > 1;
        function campoLado(lado, etiquetaLarga) {
          var inp = document.createElement("input");
          inp.type = "text";
          inp.inputMode = "decimal";
          inp.className = "umbral-raices-mA " + lado;
          inp.title = etiquetaLarga;
          inp.setAttribute("aria-label", etiquetaLarga);
          inp.value = vals[lado] || "";
          inp.addEventListener("input", function () { vals[lado] = inp.value; guardar.cambiar(); });
          inp.addEventListener("change", function () { guardar.salir(); });
          return inp;
        }
        function rama(lado) {
          var r = document.createElement("span");
          r.className = "umbral-raices-rama " + lado;
          return r;
        }
        var vert = document.createElement("span");
        vert.className = "umbral-raices-vert" + (k === 0 ? " primera" : "") + (k === ordenados.length - 1 ? " ultima" : "") +
          (saltoArriba ? " salto-arriba" : "") + (saltoAbajo ? " salto-abajo" : "");
        var pill = document.createElement("span");
        pill.className = "umbral-raices-nivel";
        pill.textContent = nivel;
        vert.appendChild(pill);
        var filaNivel = document.createElement("div");
        filaNivel.className = "umbral-raices-fila" + (saltoArriba ? " con-salto" : "");
        filaNivel.appendChild(campoLado("izq", T("umbral_raices_izq", { nivel: nivel })));
        filaNivel.appendChild(rama("izq"));
        filaNivel.appendChild(vert);
        filaNivel.appendChild(rama("der"));
        filaNivel.appendChild(campoLado("der", T("umbral_raices_der", { nivel: nivel })));
        contValores.appendChild(filaNivel);
      });
    }
    REG_NIVELES_RAICES.forEach(function (nivel) {
      var chip = document.createElement("span");
      chip.className = "chip chip-extra" + (datos.niveles.indexOf(nivel) !== -1 ? " activo" : "");
      chip.textContent = nivel;
      chip.addEventListener("click", function () {
        var i = datos.niveles.indexOf(nivel);
        if (i === -1) datos.niveles.push(nivel); else datos.niveles.splice(i, 1);
        chip.classList.toggle("activo", i === -1);
        guardar.salir();
        pintarValores();
      });
      filaNiveles.appendChild(chip);
    });
    pintarValores();
    cont.appendChild(filaNiveles);
    cont.appendChild(contValores);
  }

  // Raíces y tornillos: nivel · izq. · der. Con caso, son los "Umbrales EMG
  // por raíz" de la ficha (el mismo dato, ⇄). Sin caso (Modelo 0), la misma
  // columna vertebral sobre d.raices (29-09-2026, pedido del usuario: la
  // tabla suelta de antes era distinta y más fea); una hoja suelta que ya
  // tenía escrita la tabla de antes (e_t_*) la sigue enseñando.
  function pintarMapeoRaices(cont, d) {
    var c = registroCaso();
    var datos;
    if (c) {
      if (!c.umbral_raices_niveles) c.umbral_raices_niveles = { niveles: [], valores: {} };
      datos = c.umbral_raices_niveles;
    } else {
      if (!(d.raices && (d.raices.niveles || []).length) && tornillosSueltosEscritos(d)) { pintarTornillosSueltos(cont, d); return; }
      if (!d.raices) d.raices = { niveles: [], valores: {} };
      datos = d.raices;
    }
    if (!datos.niveles) datos.niveles = [];
    if (!datos.valores) datos.valores = {};
    // La misma columna vertebral que la ficha (28-09-2026, pedido del
    // usuario), sobre el mismo dato del caso.
    var contR = regNodo("div", "umbral-raices");
    cont.appendChild(contR);
    pintarColumnaRaices(contR, datos, REG_GUARDAR, !!c);
  }

  function tornillosSueltosEscritos(d) {
    return Object.keys(d.v || {}).some(function (k) { return /^e_t_/.test(k) && d.v[k]; });
  }

  // Sin caso vinculado: la tabla de tornillos de siempre (e_t_*)
  function pintarTornillosSueltos(cont, d) {
    var bloque = regNodo("div", "reg-basal reg-basal-tornillos");
    var cab2 = regNodo("div", "reg-basal-fila reg-basal-cab");
    REG_TORNILLOS.cols.forEach(function (col) { cab2.appendChild(regNodo("span", null, regL(col))); });
    bloque.appendChild(cab2);
    for (var i = 1; i <= REG_TORNILLOS.filas; i++) {
      var f = regNodo("div", "reg-basal-fila");
      REG_TORNILLOS.cols.forEach(function (col) {
        f.appendChild(regInputSinTexto(d.v, "e_t_" + i + "_" + col.id, "text", T("registro_tornillos") + " " + i + " — " + regL(col)));
      });
      bloque.appendChild(f);
    }
    cont.appendChild(bloque);
  }

  // Filas de la tabla de tornillos de la hoja impresa: con niveles marcados,
  // los "Umbrales EMG por raíz" del caso o, sin caso, los de d.raices; si
  // no, la tabla suelta (e_t_*).
  function regFilasTornillos(d, c) {
    var datos = c ? c.umbral_raices_niveles : d.raices;
    if (datos && (datos.niveles || []).length) {
      var filas = datos.niveles.map(function (n) {
        var v = (datos.valores || {})[n] || {};
        return [v.izq || "", n, v.der || ""];
      });
      while (filas.length < REG_TORNILLOS.filas) filas.push(["", "", ""]);
      return filas;
    }
    var out = [];
    for (var ti = 1; ti <= REG_TORNILLOS.filas; ti++) {
      out.push(REG_TORNILLOS.cols.map(function (col) { return d.v["e_t_" + ti + "_" + col.id] || ""; }));
    }
    return out;
  }

  function alarmasConDatos(d) {
    return ((d && d.alarmas) || []).filter(alarmaEscrita);
  }

  /* Fichas de alarma (G) con listas cerradas. La usan el Registro y la ficha
     del caso (en espejo, sobre la copia de trabajo). op: { modalidades
     (rótulos), guardar ({cambiar, salir}; por defecto el del Registro),
     alCambiar }. Una alarma vaciada se queda como { id } para no mover la
     numeración A1, A2… de la hoja. */
  function pintarAlarmas(cont, d, op) {
    var guardar = op.guardar || REG_GUARDAR;
    var alCambiar = op.alCambiar || function () {};
    var listaMod = op.modalidades.concat([T("rr_que_anestesia"), T("rr_que_tecnico")])
      .map(function (l) { return { v: l, l: l }; });
    var conHora = op.conHora !== false;
    var btn = regNodo("button", "reg-p-nuevo", T(conHora ? "reg_p_alarma_nueva" : "reg_p_alarma_nueva_ficha"));
    btn.type = "button";
    var lista = regNodo("div", "reg-p-alarmas");
    cont.appendChild(lista);
    cont.appendChild(btn);
    function pintar(enfocar) {
      lista.textContent = "";
      var hay = false;
      d.alarmas.forEach(function (al, i) {
        if (filaRegistroVacia(al)) return;
        hay = true;
        var ficha = regNodo("div", "reg-p-alarma");
        var l1 = regNodo("div", "reg-p-al-l1");
        l1.appendChild(regNodo("b", "reg-p-al-n", "A" + (i + 1)));
        l1.appendChild(regInput(al, "hora", "time", T("reg_p_hora"), alCambiar, guardar));
        l1.appendChild(regSelectLista(al, "modalidad", listaMod, T("reg_p_modalidad"), alCambiar, guardar));
        var quitar = regNodo("button", "reg-fila-quitar", "✕");
        quitar.type = "button";
        quitar.title = T("registro_fila_quitar");
        quitar.setAttribute("aria-label", T("registro_fila_quitar"));
        quitar.addEventListener("click", function () {
          if (!confirm(T("reg_p_vaciar_alarma"))) return;
          d.alarmas[i] = { id: al.id };
          guardar.salir();
          pintar(null);
          alCambiar();
        });
        l1.appendChild(quitar);
        ficha.appendChild(l1);
        var l2 = regNodo("div", "reg-p-al-l2");
        l2.appendChild(regSelectLista(al, "criterio", REG_CRITERIO_AL, T("reg_p_criterio"), alCambiar, guardar));
        l2.appendChild(regSelectLista(al, "causa", REG_CAUSA_AL, T("reg_p_causa_l"), alCambiar, guardar));
        ficha.appendChild(l2);
        pintarMedidasRecup(ficha, al, guardar, alCambiar);
        lista.appendChild(ficha);
        if (enfocar === al.id) ficha.scrollIntoView({ block: "center" });
      });
      if (!hay) lista.appendChild(regNodo("p", "reg-ayuda reg-estado", T("reg_p_sin_alarmas")));
    }
    btn.addEventListener("click", function () {
      var al = d.alarmas.filter(filaRegistroVacia)[0];
      if (!al) { al = { id: uuid() }; d.alarmas.push(al); }
      // En la ficha (después de la cirugía) sin hora: "manual" la marca como
      // escrita para que no se tome por una fila vacía.
      if (conHora) al.hora = horaAhora(); else al.manual = true;
      guardar.salir();
      pintar(al.id);
      alCambiar();
    });
    pintar(null);
  }

  // Medidas adoptadas (chips marcables + caja) y recuperación S/P/N con su
  // hora. La usan las fichas de alarma del caso y la lista «Apuntado» del
  // Registro. "alHoraRecup" (opcional) se llama al cambiar la hora de
  // recuperación, además de alCambiar.
  function pintarMedidasRecup(cont, al, guardar, alCambiar, alHoraRecup) {
    var chips = regNodo("div", "chip-fila reg-p-al-medidas");
    chips.appendChild(regNodo("span", "reg-p-al-medidas-t", T("reg_p_medidas") + ":"));
    REG_MEDIDAS_AL.forEach(function (m) {
      var marcada = (al.medidas_l || []).indexOf(m.v) !== -1;
      var chip = regNodo("span", "chip chip-extra" + (marcada ? " activo" : ""), regOpcionLabel(m));
      chip.addEventListener("click", function () {
        if (!al.medidas_l) al.medidas_l = [];
        var k = al.medidas_l.indexOf(m.v);
        if (k === -1) al.medidas_l.push(m.v); else al.medidas_l.splice(k, 1);
        chip.classList.toggle("activo", k === -1);
        guardar.salir();
        alCambiar();
      });
      chips.appendChild(chip);
    });
    cont.appendChild(chips);
    // Con rótulo cada casilla (29-09-2026: la hora de recuperación salía
    // vacía y sin decir qué era), «Ahora» para cerrar la alarma de un toque
    // (solo en el Registro: la ficha se rellena después) y su duración.
    var l3 = regNodo("div", "reg-p-al-l3");
    function celda(etiqueta, control) {
      var c = regNodo("div", "reg-p-al-celda");
      c.appendChild(regNodo("span", "reg-p-al-et", etiqueta));
      c.appendChild(control);
      l3.appendChild(c);
      return c;
    }
    celda(T("reg_p_nota"), regInputSinTexto(al, "medidas", "text", T("reg_p_nota"), alCambiar, guardar));
    var selRecup = regSelectLista(al, "recup", REG_RECUP, T("reg_p_recup"), alCambiar, guardar);
    celda(T("reg_p_recup"), selRecup);
    var duracion = regNodo("span", "reg-p-al-dur");
    var pintarDur = function () {
      var m = minutosEntre(al.hora, al.h_recup);
      duracion.textContent = m === "" ? "" : T("reg_p_al_duracion", { min: m });
    };
    var hRecup = regInput(al, "h_recup", "time", T("reg_p_h_recup"), function () { alCambiar(); pintarDur(); }, guardar);
    if (alHoraRecup) hRecup.addEventListener("change", alHoraRecup);
    var cajaHora = regNodo("div", "reg-hora");
    cajaHora.appendChild(hRecup);
    if (guardar !== REG_SIN_GUARDAR) {
      var ahora = regNodo("button", "reg-ahora", T("registro_ahora"));
      ahora.type = "button";
      ahora.title = T("reg_p_recupero_ahora");
      ahora.addEventListener("click", function () {
        al.h_recup = horaAhora();
        hRecup.value = al.h_recup;
        if (!al.recup) { al.recup = "S"; selRecup.value = "S"; }
        guardar.salir();
        alCambiar();
        pintarDur();
        if (alHoraRecup) alHoraRecup();
      });
      cajaHora.appendChild(ahora);
    }
    celda(T("reg_p_h_recup"), cajaHora).appendChild(duracion);
    pintarDur();
    cont.appendChild(l3);
  }

  // Texto de una alarma para el caso (Tipo de alerta / CSV / Sheet / informe).
  function textoAlarma(a, i) {
    var partes = [a.hora, a.modalidad, regTextoLista(REG_CRITERIO_AL, a.criterio),
      regTextoLista(REG_CAUSA_AL, a.causa)].filter(Boolean);
    if (a.recup) partes.push(T("reg_p_recup") + " " + regTextoLista(REG_RECUP, a.recup) + (a.h_recup ? " (" + a.h_recup + ")" : ""));
    return "A" + (i + 1) + ": " + partes.join(" · ");
  }
  function textoMedidasAlarma(a, i) {
    var m = (a.medidas_l || []).map(function (v) { return regTextoLista(REG_MEDIDAS_AL, v); });
    if (a.medidas) m.push(a.medidas);
    return m.length ? "A" + (i + 1) + ": " + m.join(", ") : "";
  }

  /* Al guardar un caso: con alarmas en su Registro, "Hubo alerta", "Tipo de
     alerta" y "Medida correctora" se escriben solos a partir de ellas (para
     el CSV, el Sheet y lo que ya leía esos campos). Sin alarmas no se toca
     nada: un caso antiguo conserva lo suyo. */
  function alarmasEnCaso(c) {
    // Correlación de cada alarma, ya calculada por grupo (29-09-2026): la lee
    // el Sheet (Correlacion_long) tal cual, sin repetir la lógica en Codigo.gs.
    var filasCorr = filasCorrelato(c);
    if (filasCorr.length) c.correlato_filas = filasCorr; else delete c.correlato_filas;
    var d = c.registro_intraop;
    var lista = [];
    ((d && d.alarmas) || []).forEach(function (a, i) { if (alarmaEscrita(a)) lista.push({ a: a, i: i }); });
    // Sin alarmas escritas: si lo que tiene el caso es lo que derivaron antes
    // unas alarmas ya borradas («A1: …»), se deshace, en vez de dejar una
    // alerta que ya no existe en el CSV y el Sheet (auditoría, C4). Un texto
    // escrito a mano (casos antiguos) no empieza así y no se toca.
    var DERIVADO = /^A\d+: /;
    if (!lista.length) {
      if (DERIVADO.test(c.tipo_alerta || "")) {
        c.tipo_alerta = "";
        c.alerta = false;
        if (DERIVADO.test(c.medida_correctora || "")) c.medida_correctora = "";
      }
      return;
    }
    c.alerta = true;
    c.tipo_alerta = lista.map(function (x) { return textoAlarma(x.a, x.i); }).join("\n");
    c.medida_correctora = lista.map(function (x) { return textoMedidasAlarma(x.a, x.i); }).filter(Boolean).join("\n");
  }

  // Cierre: modalidades afectadas elegidas entre las técnicas del caso, y se
  // guardan como texto ("MEP, SEP...") en el mismo campo que imprime la hoja.
  function pintarPantallaCierre(sec, cont) {
    var d = registroDatos();
    var def = {};
    sec.campos.forEach(function (x) { def[x.id] = x; });
    var grid = regNodo("div", "reg-grid");
    grid.appendChild(regControl(def.cierre_resultado, d.v));
    cont.appendChild(grid);

    var c = registroCaso();
    var tecs = c ? TECNICAS.filter(function (t) { return (c.tecnicas_realizadas || []).indexOf(t.id) !== -1; }) : [];
    var bloque = regNodo("div", "campo reg-campo reg-ancho");
    bloque.appendChild(regNodo("label", null, T("caso_tecnicas_alteradas") + (tecs.length ? " ⇄" : "")));
    if (tecs.length) {
      // Son las "Técnicas alteradas" de la ficha (ids). Lo escrito antes a
      // mano en la hoja: los nombres que son técnicas del caso pasan a
      // marcarse allí, una sola vez; el resto se conserva como texto.
      if (!c.tecnicas_alteradas) c.tecnicas_alteradas = [];
      var partes = String(d.v.cierre_modalidades || "").split(/\s*,\s*/).filter(Boolean);
      var migradas = false;
      var sueltas = partes.filter(function (p) {
        var t = tecs.filter(function (x) { return campo(x, "etiqueta") === p; })[0];
        if (!t) return true;
        if (c.tecnicas_alteradas.indexOf(t.id) === -1) c.tecnicas_alteradas.push(t.id);
        migradas = true;
        return false;
      });
      if (migradas) {
        if (sueltas.length) d.v.cierre_modalidades = sueltas.join(", "); else delete d.v.cierre_modalidades;
        registroGuardarYa();
      }
      // Los mismos chips marcables (y agrupados igual) que "Técnicas con
      // alteración" en la ficha: es el mismo dato, se ve igual en los dos
      // sitios (pedido del usuario, 28-09-2026).
      var chips = regNodo("div", "chip-fila");
      anadirChipsAgrupados(chips, tecs, function (t) {
        var chip = rotularChipTecnica(regNodo("span", "chip chip-extra" + (c.tecnicas_alteradas.indexOf(t.id) !== -1 ? " activo" : "")), t);
        chip.addEventListener("click", function () {
          var i = c.tecnicas_alteradas.indexOf(t.id);
          if (i === -1) c.tecnicas_alteradas.push(t.id); else c.tecnicas_alteradas.splice(i, 1);
          chip.classList.toggle("activo", i === -1);
          registroGuardarYa();
        });
        return chip;
      });
      bloque.appendChild(chips);
      if (sueltas.length) bloque.appendChild(regNodo("small", "reg-p-extra", sueltas.join(", ")));
    } else {
      bloque.appendChild(regInput(d.v, "cierre_modalidades", "text", T("caso_tecnicas_alteradas")));
    }
    cont.appendChild(bloque);

    var grid2 = regNodo("div", "reg-grid");
    ["cierre_esperable", "cierre_incidencias", "cierre_perla_check", "cierre_perla"].forEach(function (id) {
      if (def[id]) grid2.appendChild(regControl(def[id], d.v));
    });
    cont.appendChild(grid2);
  }

  function renderRegistroSelector() {
    var sel = document.getElementById("registro-caso-select");
    sel.innerHTML = "";
    var op0 = document.createElement("option");
    op0.value = "";
    op0.textContent = T("checklist_modelo_cero");
    sel.appendChild(op0);
    Object.keys(casos).sort(function (a, b) {
      return (casos[b].fecha || "").localeCompare(casos[a].fecha || "");
    }).forEach(function (uid) {
      var c = casos[uid];
      var op = document.createElement("option");
      op.value = uid;
      op.textContent = (MARCA_ESTADO_CASO[c.estado] ? MARCA_ESTADO_CASO[c.estado] + " " : "") +
        (c.ID_Caso || "?") + (c.nombre_caso ? " — " + c.nombre_caso : "");
      op.setAttribute("data-estado", c.estado || "");
      op.setAttribute("data-texto", (c.ID_Caso || "?") + (c.nombre_caso ? " — " + c.nombre_caso : ""));
      sel.appendChild(op);
    });
    if (registroCasoUid && !casos[registroCasoUid]) registroCasoUid = null;
    sel.value = registroCasoUid || "";
    refrescarSelectorCaso(sel);
  }

  function renderRegistro() {
    if (!registroCargado) registroCargar();
    renderRegistroSelector();
    renderRegistroContenido();
  }

  function abrirRegistro() {
    renderRegistro();
    irAPantalla("registro");
  }

  // "Pasar al caso" se retiró el 28-09-2026 (auditoría, F3): con los campos
  // compartidos (⇄) ya no quedaba nada que pasar a mano.

  function registroVaciar() {
    if (registroCaso()) return;   // solo Modelo 0, ver renderRegistroContenido()
    if (!confirm(T("registro_vaciar_conf"))) return;
    if (registroTimer) { clearTimeout(registroTimer); registroTimer = null; }
    var d = registroDatos();
    var prefijo = registroCaso() ? "caso:" + registroCasoUid + ":registro:" : "registro0:";
    (d.imagenes || []).forEach(function (im) {
      if (im && im.id) borrarFotoIDB(prefijo + im.id).catch(function () {});
    });
    var c = registroCaso();
    if (c) c.registro_intraop = {}; else registroModeloCero = {};
    registroGuardarYa();
    renderRegistroContenido();
  }

  document.getElementById("tile-registro").addEventListener("click", abrirRegistro);
  mejorarSelectorCaso(document.getElementById("registro-caso-select"));
  document.getElementById("registro-caso-select").addEventListener("change", function (e) {
    registroVaciarPendiente();
    registroCasoUid = e.target.value || null;
    regRapido = regRapidoVacio();
    renderRegistroContenido();
  });
  document.getElementById("registro-guardar").addEventListener("click", function () {
    registroGuardarYa();
    avisoGuardado(T("registro_guardado"));
  });
  document.getElementById("registro-vaciar").addEventListener("click", registroVaciar);

  /* ================================================================
   * Hoja imprimible del registro intraoperatorio (24-09-2026).
   *
   * Pedido del usuario: el registro es, sobre todo, "una manera de dar
   * salida" a lo ya metido en Gestión de Casos, para IMPRIMIRLO y tenerlo
   * delante en quirófano. Es la hoja de papel de dos páginas del PDF de
   * partida, pero PRERRELLENADA con los datos del caso (identificación,
   * técnicas/modalidades, anestesia, montaje, dónde está el Raabe...) y con
   * filas en blanco para escribir a mano lo que pasa en la cirugía:
   *   Hoja 1: identificación, modalidades, anestesia, hitos, basales y
   *           comparativa, mapeo (con la sonda Raabe) y esquema pequeño.
   *   Hoja 2: registro de EVENTOS Y ALARMAS fusionado en una sola tabla
   *           -con la leyenda de respuesta NRF / Anest. / Cir. de la hoja
   *           original-, cierre, y los parámetros/notas del caso.
   * Todo lo que se haya tecleado ya en la pantalla del Registro (eventos,
   * alarmas, basales, mapeo...) sale impreso en su fila; el resto, en blanco.
   * Se construye igual que el informe en PDF: ventana nueva + print().
   * ================================================================ */
  function hojaCasilla(marcada) { return marcada ? "☑" : "☐"; }

  function hojaCelda(doc, etiqueta, valor, ancho) {
    var c = nodoInforme(doc, "div", "hj-celda" + (ancho ? " hj-s" + ancho : ""));
    c.appendChild(nodoInforme(doc, "small", null, etiqueta));
    c.appendChild(nodoInforme(doc, "div", "hj-v", valor === undefined || valor === null ? "" : String(valor)));
    return c;
  }

  // Recuadro con un óvalo a modo de cabeza vista desde arriba, para dibujar
  // encima electrodos/posiciones: arriba lo anterior (NARIZ, con una pequeña
  // punta) y abajo lo posterior (INION).
  function hojaCabeza(doc) {
    var NS = "http://www.w3.org/2000/svg";
    var caja = nodoInforme(doc, "div", "hj-cabeza");
    var svg = doc.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    function el(tag, attrs, texto) {
      var e = doc.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
      if (texto) e.textContent = texto;
      svg.appendChild(e);
    }
    el("ellipse", { cx: 50, cy: 52, rx: 30, ry: 36, fill: "none", stroke: "#000", "stroke-width": 0.9 });
    el("path", { d: "M44 16.5 L50 9 L56 16.5", fill: "none", stroke: "#000", "stroke-width": 0.9 });
    el("text", { x: 50, y: 6, "text-anchor": "middle", "font-size": 6.5, "font-family": "Arial", "font-weight": 700 }, T("hoja_nariz"));
    el("text", { x: 50, y: 98, "text-anchor": "middle", "font-size": 6.5, "font-family": "Arial", "font-weight": 700 }, T("hoja_inion"));
    caja.appendChild(svg);
    return caja;
  }

  function hojaSeccion(doc, titulo, ayuda) {
    var h = nodoInforme(doc, "h3", "hj-sec", titulo);
    if (ayuda) h.appendChild(nodoInforme(doc, "small", null, " " + ayuda));
    return h;
  }

  function hojaDef(id) {
    var out = null;
    REG_SECCIONES.forEach(function (s) {
      s.campos.forEach(function (d) { if (d.id === id) out = d; });
    });
    return out;
  }

  // Valor de un campo de la hoja: lo tecleado o, si no, lo derivado del caso.
  function hojaValor(d, c, id) {
    var def = hojaDef(id);
    var v = regGet(d.v, def, c);
    if (def.t === "sel") {
      var o = (def.o || []).filter(function (x) { return x.v === v; })[0];
      return o ? regOpcionLabel(o) : "";
    }
    return v === false ? "" : v;
  }

  // Dónde está montado el Raabe (y su referencia) en el montaje del caso, en
  // texto: "S. de aspiración electrificada (Raabe): TES MEP 12 catodal". Lee el
  // montaje en crudo. "raabe_estim" (Raabe (estímulo)) se retiró del catálogo
  // el 27-09-2026: nadie lo usaba y era la misma sonda de aspiración.
  function hojaRaabeMontado(c) {
    if (!c) return "";
    var esc = montajeDesdeCaso(c);
    var buscados = { ref_raabe: 1, cz_doble_prima: 1, sonda_aspiracion: 1, mapping: 1, ref_mapping_subcortical: 1, sonda_mono_esferica: 1, sonda_mono_recta: 1 };
    var partes = [];
    Object.keys(cajasDe(esc)).forEach(function (cajaKey) {
      var asign = (esc.asignaciones || {})[cajaKey] || {};
      entradasDe(cajaKey).forEach(function (ent) {
        var itemId = asign[ent.id];
        if (!itemId || !buscados[itemId] || !ITEMS[itemId]) return;
        var rotulo = ent.polo ? ent.etiqueta + " " + ent.polo : ent.etiqueta;
        partes.push(campo(ITEMS[itemId], "nombre") + ": " + infoCaja(cajaKey).nombre + " " + rotulo);
      });
    });
    (esc.extras || []).forEach(function (id) {
      if (buscados[id] && ITEMS[id]) partes.push(campo(ITEMS[id], "nombre") + " (" + T("hoja_extra") + ")");
    });
    return partes.join(" · ");
  }

  function hojaTabla(doc, cols, filas, opciones) {
    opciones = opciones || {};
    var t = nodoInforme(doc, "table", "hj-tabla" + (opciones.cls ? " " + opciones.cls : ""));
    var tituloTabla = opciones.titulo;
    var cg = doc.createElement("colgroup");
    cols.forEach(function (col) {
      var e = doc.createElement("col");
      if (col.w) e.style.width = col.w;
      cg.appendChild(e);
    });
    t.appendChild(cg);
    var th = doc.createElement("thead");
    if (tituloTabla) {
      var trt = doc.createElement("tr");
      var tht = nodoInforme(doc, "th", "hj-tt", tituloTabla);
      tht.colSpan = cols.length;
      trt.appendChild(tht);
      th.appendChild(trt);
    }
    var trh = doc.createElement("tr");
    cols.forEach(function (col) { trh.appendChild(nodoInforme(doc, "th", null, col.l)); });
    th.appendChild(trh);
    t.appendChild(th);
    var tb = doc.createElement("tbody");
    filas.forEach(function (fila) {
      var tr = doc.createElement("tr");
      if (fila.cls) tr.className = fila.cls;
      cols.forEach(function (col, i) {
        var td = nodoInforme(doc, "td", col.cls || null, fila.celdas[i] === undefined ? "" : fila.celdas[i]);
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return t;
  }

  function hojaBlancas(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push({ celdas: [] });
    return out;
  }

  function construirHojaRegistro(doc, c) {
    regCasoRotulos = c || null;
    try { return construirHojaRegistroInterna(doc, c); } finally { regCasoRotulos = undefined; }
  }
  function construirHojaRegistroInterna(doc, c) {
    var d = registroAsegurar(c ? (c.registro_intraop || (c.registro_intraop = {})) : registroModeloCero);
    var V = function (id) { return hojaValor(d, c, id); };
    var fragmento = doc.createDocumentFragment();
    var idCaso = c ? ((c.ID_Caso || "") + (c.nombre_caso ? " — " + c.nombre_caso : "")) : "";

    function titulo(hoja) {
      var h = nodoInforme(doc, "div", "hj-titulo");
      h.appendChild(nodoInforme(doc, "b", null, T("hoja_titulo")));
      h.appendChild(nodoInforme(doc, "span", null, T("hoja_hoja", { n: hoja }) + (idCaso ? " · " + idCaso : "")));
      return h;
    }

    /* ---------------------------- HOJA 1 ---------------------------- */
    var p1 = nodoInforme(doc, "section", "hoja");
    p1.appendChild(titulo(1));

    // A · Identificación
    p1.appendChild(hojaSeccion(doc, regL(REG_SECCIONES[0])));
    var gA = nodoInforme(doc, "div", "hj-grid");
    var etq = function (id) { return regL(hojaDef(id)); };
    gA.appendChild(hojaCelda(doc, T("hoja_caso"), idCaso, 2));
    gA.appendChild(hojaCelda(doc, etq("fecha"), V("fecha")));
    gA.appendChild(hojaCelda(doc, etq("quirofano"), V("quirofano")));
    gA.appendChild(hojaCelda(doc, etq("hora_inicio_mio"), V("hora_inicio_mio")));
    gA.appendChild(hojaCelda(doc, etq("cirujano"), V("cirujano")));
    gA.appendChild(hojaCelda(doc, etq("anestesista"), V("anestesista")));
    gA.appendChild(hojaCelda(doc, etq("neurofisiologo"), V("neurofisiologo")));
    gA.appendChild(hojaCelda(doc, etq("diagnostico"), V("diagnostico"), 2));
    gA.appendChild(hojaCelda(doc, etq("nivel_lado"), V("nivel_lado"), 2));
    gA.appendChild(hojaCelda(doc, etq("procedimiento"), V("procedimiento"), 2));
    var posTxt = c && c.posicion ? opcionTexto("posicion", c.posicion) : "";
    gA.appendChild(hojaCelda(doc, T("caso_posicion"), posTxt));
    var nav = c ? navegacionDe(c) : "";
    gA.appendChild(hojaCelda(doc, T("caso_navegacion"), nav ? opcionTexto("sino", nav) : ""));
    ["prequx_motor", "prequx_sensitivo", "prequx_ppcc", "prequx_esfinteres"].forEach(function (id) {
      gA.appendChild(hojaCelda(doc, etq(id), V(id)));
    });
    // Identificación a la izquierda, más apretada, y a la derecha el recuadro
    // de la cabeza (nariz arriba, inion abajo) -pedido del usuario-.
    var ident = nodoInforme(doc, "div", "hj-ident");
    ident.appendChild(gA);
    ident.appendChild(hojaCabeza(doc));
    p1.appendChild(ident);

    // B · Modalidades
    p1.appendChild(hojaSeccion(doc, regL(REG_SECCIONES[1])));
    var bB = nodoInforme(doc, "div", "hj-mods");
    // Técnicas del catálogo, como en Gestión de Casos (28-09-2026, pedido del
    // usuario): tres filas -monitorización, reflejos, mapeo- en el orden del
    // catálogo, con las del caso ya marcadas y el resto para marcar a mano.
    // Sustituye a la rejilla propia de "Modalidades" (REG_MODALIDADES), que
    // repetía lo mismo con otros nombres.
    var hechasB = c ? (c.tecnicas_realizadas || []) : [];
    var tecsB = TECNICAS.filter(function (t) { return t.activa !== false || hechasB.indexOf(t.id) !== -1; });
    var bloquesB = bloquesTecnicas(tecsB);
    [["registro_tec_monitor", bloquesB.monitor], ["registro_tec_reflejos", bloquesB.reflejos], ["registro_tec_mapeo", bloquesB.mapeo]]
      .forEach(function (par) {
        if (!par[1].length) return;
        var f = nodoInforme(doc, "div", "hj-mod");
        f.appendChild(nodoInforme(doc, "b", "hj-mod-rot", T(par[0])));
        var grp = nodoInforme(doc, "span", "hj-mod-grupo");
        par[1].forEach(function (t) {
          grp.appendChild(nodoInforme(doc, "span", "hj-it", hojaCasilla(hechasB.indexOf(t.id) !== -1) + " " + campo(t, "etiqueta")));
        });
        grp.appendChild(nodoInforme(doc, "span", "hj-it", T("registro_otro") + ": ________"));
        f.appendChild(grp);
        bB.appendChild(f);
      });
    var mont = nodoInforme(doc, "div", "hj-mod");
    mont.appendChild(nodoInforme(doc, "b", "hj-mod-rot", T("registro_montaje")));
    REG_MONTAJE.forEach(function (m) {
      mont.appendChild(nodoInforme(doc, "span", "hj-it", regL(m) + ": " + (d.v[m.id] || "______________")));
    });
    bB.appendChild(mont);
    p1.appendChild(bB);

    // C · Anestesia
    p1.appendChild(hojaSeccion(doc, regL(REG_SECCIONES[2])));
    var gC = nodoInforme(doc, "div", "hj-grid");
    ["an_hipnotico", "an_relajante", "an_relajante_h", "an_tof_h"].forEach(function (id) {
      gC.appendChild(hojaCelda(doc, etq(id), V(id)));
    });
    var man = nodoInforme(doc, "div", "hj-celda hj-s4");
    man.appendChild(nodoInforme(doc, "small", null, T("hoja_mantenimiento")));
    var manV = nodoInforme(doc, "div", "hj-v hj-lin");
    [["an_tiva", T("hoja_tiva")], ["an_halogenado", T("hoja_halogenado") + " " + (V("an_cam") || "____")],
     ["an_dexmedetomidina", regL(hojaDef("an_dexmedetomidina"))], ["an_ketamina", regL(hojaDef("an_ketamina"))]
    ].forEach(function (x) {
      manV.appendChild(nodoInforme(doc, "span", "hj-it", hojaCasilla(!!V(x[0])) + " " + x[1]));
    });
    manV.appendChild(nodoInforme(doc, "span", "hj-it", etq("an_tam") + ": " + (V("an_tam") || "____")));
    manV.appendChild(nodoInforme(doc, "span", "hj-it", etq("an_temp") + ": " + (V("an_temp") || "____")));
    if (c && c.tof_monitorizado) manV.appendChild(nodoInforme(doc, "span", "hj-it", "TOF: " + opcionTexto("sino", c.tof_monitorizado)));
    man.appendChild(manV);
    gC.appendChild(man);
    if (c && c.incidencias_anestesicas) gC.appendChild(hojaCelda(doc, T("caso_incidencias_anestesicas"), c.incidencias_anestesicas, 4));
    p1.appendChild(gC);

    // D · Hitos
    p1.appendChild(hojaSeccion(doc, regL(REG_SECCIONES[3])));
    var tH = hojaTabla(doc, REG_HITOS.map(function (h) { return { l: regL(h) }; }),
      [{ celdas: REG_HITOS.map(function (h) { return V(h.id); }), cls: "hj-alta" }], { cls: "hj-hitos" });
    p1.appendChild(tH);

    // E · Basales y comparativa
    p1.appendChild(hojaSeccion(doc, regL(REG_SECCIONES[4]), campo(REG_SECCIONES[4], "ayuda")));
    var par = nodoInforme(doc, "div", "hj-par");
    var tecHoja = c ? (c.tecnicas_realizadas || []) : null;
    // Filas visibles según el caso, cada una con su prefijo de clave.
    function conPrefijo(filas, prefijo) {
      return regFilasBasales(filas, prefijo, d, tecHoja).map(function (r) { return { r: r, prefijo: prefijo }; });
    }
    // c-SEP, c-MEP, GRID y corticobulbares van en una cuarta tabla propia
    // (pedido del usuario, 25-09-2026), para que la de motores no se alargue;
    // la de tornillos se estrecha para hacerle sitio. Sin ninguna de esas
    // filas, la hoja queda con las tres tablas de siempre.
    var ES_CORTICAL = /^(csep_|cmep_|grid$|cobu_)/;
    var sensVis = conPrefijo(REG_BASALES_SENS, "s_"), motVis = conPrefijo(REG_BASALES_MOT, "m_");
    var cortVis = sensVis.concat(motVis).filter(function (x) { return ES_CORTICAL.test(x.r.id); });
    sensVis = sensVis.filter(function (x) { return !ES_CORTICAL.test(x.r.id); });
    motVis = motVis.filter(function (x) { return !ES_CORTICAL.test(x.r.id); });
    var maxFilasBasales = 0;
    function tablaBasales(tituloTabla, visibles, prefijoLibres, libres, rotuloLibre) {
      // PostPos2 solo si la tabla tiene alguna fila t-SEP/t-MEP (la de
      // corticales no la lleva); en las demás filas, la celda sale tachada.
      var colsT = REG_BASALES_COLS.filter(function (col) {
        return !col.soloT || visibles.some(function (x) { return regColBasal(col, x.r.id); });
      });
      var cols = [{ l: tituloTabla, w: "30%", cls: "hj-rot" }].concat(colsT.map(function (col) { return { l: regL(col) }; }));
      var filas = visibles.map(function (x) {
        return { celdas: [regL(x.r)].concat(colsT.map(function (col) {
          return regColBasal(col, x.r.id) ? d.v["e_" + x.prefijo + x.r.id + "_" + col.id] || "" : "—";
        })) };
      });
      for (var i = 1; i <= libres; i++) {
        var k = "libre" + i;
        filas.push({ celdas: [d.v["e_" + prefijoLibres + k + "_l"] || (i <= 2 ? rotuloLibre : "")].concat(colsT.map(function (col) {
          return regColBasal(col, k) ? d.v["e_" + prefijoLibres + k + "_" + col.id] || "" : "—";
        })) });
      }
      maxFilasBasales = Math.max(maxFilasBasales, filas.length);
      // Tabla larga: filas algo más bajas para que la hoja 1 quepa en un A4.
      return hojaTabla(doc, cols, filas, { cls: "hj-basales" + (filas.length > 10 ? " hj-basales-larga" : "") });
    }
    par.appendChild(tablaBasales(T("registro_sens_otros"), sensVis, "s_", REG_BASALES_LIBRES.sens, T("registro_otro") + ":"));
    par.appendChild(tablaBasales(T("registro_motores"), motVis, "m_", REG_BASALES_LIBRES.mot, ""));
    if (cortVis.length) {
      par.classList.add("hj-par4");
      par.appendChild(tablaBasales(T("registro_corticales"), cortVis, "", 0, ""));
    }
    var filasTor = regFilasTornillos(d, c).map(function (celdas) { return { celdas: celdas }; });
    par.appendChild(hojaTabla(doc, REG_TORNILLOS.cols.map(function (col) { return { l: regL(col), cls: "hj-c" }; }),
      filasTor, { cls: "hj-basales hj-tornillos", titulo: T("registro_tornillos") }));
    p1.appendChild(par);

    // E2 · Mapeo + esquema
    p1.appendChild(hojaSeccion(doc, regL(REG_SECCIONES[5]), campo(REG_SECCIONES[5], "ayuda")));
    var raabe = nodoInforme(doc, "div", "hj-raabe");
    var montado = hojaRaabeMontado(c);
    var marcaRaabe = !!d.v.m_map_raabe || /Raabe|aspiraci/i.test(montado);   // el texto "montado" solo trae sondas/Raabe del montaje
    raabe.appendChild(nodoInforme(doc, "b", null, T("hoja_raabe") + " "));
    var marcaMono = !!regGet(d.v, { id: "m_map_monopolar", t: "check", der: regTieneSondaMonopolar }, c);
    raabe.appendChild(nodoInforme(doc, "span", "hj-it", hojaCasilla(marcaMono) + " " + T("hoja_monopolar")));
    raabe.appendChild(nodoInforme(doc, "span", "hj-it", hojaCasilla(marcaRaabe) + " Raabe"));
    raabe.appendChild(nodoInforme(doc, "span", "hj-it", hojaCasilla(!!d.v.m_map_otra_sonda) + " " + T("hoja_otra_sonda") + ": ________"));
    raabe.appendChild(nodoInforme(doc, "span", "hj-it hj-inten", T("hoja_intensidad") + ": ________"));
    if (montado) raabe.appendChild(nodoInforme(doc, "div", "hj-raabe-montaje", T("hoja_montado") + ": " + montado));
    p1.appendChild(raabe);
    // Bajo la sonda de mapeo, dos bloques lado a lado -GRID 1 a la izquierda,
    // GRID 2 a la derecha- con las mismas 3 filas cada uno (electrodo motor,
    // músculos registrados, electrodo/s sensitivo/s). Salen en blanco para
    // escribir a mano, o con lo tecleado en la pantalla (grid1_*, grid2_*).
    var lineas = nodoInforme(doc, "div", "hj-lineas");
    [1, 2].forEach(function (n) {
      var col = nodoInforme(doc, "div", "hj-gridcol");
      var lineasGrid = [["motor", T("hoja_grid_motor")], ["musculos", T("hoja_musculos")], ["sens", T("hoja_sensitivos")]];
      // Inversión de fase: solo si el caso hace phase-reversal o ya está escrita.
      if ((tecHoja && tecHoja.indexOf("phase_reversal") !== -1) || d.v["grid" + n + "_inversion"]) {
        lineasGrid.push(["inversion", T("hoja_inversion")]);
      }
      lineasGrid.forEach(function (f, i) {
        var l = nodoInforme(doc, "div", "hj-linea");
        l.appendChild(nodoInforme(doc, "b", "hj-linea-t", i === 0 ? "GRID " + n : ""));
        l.appendChild(nodoInforme(doc, "span", "hj-linea-e", f[1] + ":"));
        l.appendChild(nodoInforme(doc, "span", "hj-linea-v", d.v["grid" + n + "_" + f[0]] || ""));
        col.appendChild(l);
      });
      lineas.appendChild(col);
    });
    p1.appendChild(lineas);
    var mapDef = REG_SECCIONES[5].cols;
    var filasMapeo = d.mapeo.filter(function (f) { return regFilaConContenido(f, mapDef); }).map(function (f) {
      var tipo = REG_TIPO_MAPEO.filter(function (o) { return o.v === f.tipo; })[0];
      return { celdas: [f.hora, tipo ? tipo.v : "", f.punto, f.tecnica, f.umbral, f.respuesta, f.accion] };
    });
    // Con muchas filas de basales (c-MEP, corticobulbares...) una fila menos
    // de mapeo en blanco, para que la hoja 1 siga cabiendo en un A4.
    filasMapeo = filasMapeo.concat(hojaBlancas(Math.max((maxFilasBasales > 10 ? 6 : 8) - filasMapeo.length, 3)));
    var mapeoEsquema = nodoInforme(doc, "div", "hj-mapeo");
    mapeoEsquema.appendChild(hojaTabla(doc, [
      { l: regL(mapDef[0]), w: "9%" }, { l: regL(mapDef[1]), w: "7%" },
      { l: regL(mapDef[2]), w: "24%" }, { l: regL(mapDef[3]), w: "20%" },
      { l: regL(mapDef[4]), w: "8%" }, { l: regL(mapDef[5]), w: "16%" },
      { l: regL(mapDef[6]), w: "16%" }
    ], filasMapeo, { cls: "hj-mapeo-tabla" }));
    var esq = nodoInforme(doc, "div", "hj-esquema");
    esq.appendChild(nodoInforme(doc, "small", null, regL(REG_SECCIONES[6])));
    if (d.imagenes.length && d.imagenes[0].dataUrl) {
      var im = doc.createElement("img");
      im.src = d.imagenes[0].dataUrl;
      esq.appendChild(im);
    }
    mapeoEsquema.appendChild(esq);
    p1.appendChild(mapeoEsquema);
    fragmento.appendChild(p1);

    /* ---------------------------- HOJA 2 ---------------------------- */
    var p2 = nodoInforme(doc, "section", "hoja");
    p2.appendChild(titulo(2));

    // F+G · Eventos y alarmas, fusionados
    p2.appendChild(hojaSeccion(doc, T("hoja_eventos_alarmas")));
    var leyenda = nodoInforme(doc, "div", "hj-leyenda");
    [
      [T("hoja_cod"), T("hoja_cod_txt")],
      ["NRF", T("hoja_nrf")],
      [T("hoja_anest"), T("hoja_anest_txt")],
      ["Cir.", T("hoja_cir")],
      [T("hoja_sinmejora"), T("hoja_sinmejora_txt")],
      ["Recup.", T("hoja_recup_txt")]
    ].forEach(function (x) {
      var l = nodoInforme(doc, "div", null);
      l.appendChild(nodoInforme(doc, "b", null, x[0] + ": "));
      l.appendChild(doc.createTextNode(x[1]));
      leyenda.appendChild(l);
    });
    p2.appendChild(leyenda);

    var evDef = REG_SECCIONES.filter(function (s) { return s.id === "f"; })[0].cols;
    var alDef = REG_SECCIONES.filter(function (s) { return s.id === "g"; })[0].cols;
    var filasEv = d.eventos.filter(function (f) { return regFilaConContenido(f, evDef); }).map(function (f) {
      return { hora: f.hora || "", celdas: [f.hora, f.cod, [f.fase, regTextoLista(REG_CONTEXTO, f.contexto)].filter(Boolean).join(" · "), f.modalidad, f.cambio,
        hojaCasilla(!!f.av_cir), hojaCasilla(!!f.av_an), "", f.accion, ""] };
    });
    // Listas cerradas (28-09-2026): se imprimen los rótulos, no los ids.
    var filasAl = d.alarmas.filter(alarmaEscrita).map(function (f) {
      var med = (f.medidas_l || []).map(function (v) { return regTextoLista(REG_MEDIDAS_AL, v); });
      if (f.medidas) med.push(f.medidas);
      return { hora: f.hora || "", celdas: [f.hora, "A", [f.fase, regTextoLista(REG_CAUSA_AL, f.causa)].filter(Boolean).join(" · "),
        f.modalidad, regTextoLista(REG_CRITERIO_AL, f.criterio),
        "", "", (f.nrf ? "N" : "") + (f.an ? " A" : "") + (f.cir ? " C" : ""), med.join(", "), f.recup || ""], cls: "hj-alarma" };
    });
    var todas = filasEv.concat(filasAl);
    todas.sort(function (a, b) { return a.hora && b.hora ? a.hora.localeCompare(b.hora) : 0; });
    var nBlancas = Math.max(20 - todas.length, 6);
    // Las filas en blanco llevan las casillas ya dibujadas: se rellenan a mano.
    for (var i = 0; i < nBlancas; i++) {
      todas.push({ celdas: ["", "", "", "", "", "☐", "☐", "☐N ☐A ☐C", "", "S P N"] });
    }
    p2.appendChild(hojaTabla(doc, [
      { l: regL(evDef[0]), w: "8%" }, { l: regL(evDef[1]), w: "6%" },
      { l: regL(evDef[2]), w: "22%" }, { l: regL(evDef[3]), w: "14%" },
      { l: regL(evDef[4]), w: "11%" }, { l: "Cir", w: "4%", cls: "hj-c" }, { l: "An", w: "4%", cls: "hj-c" },
      { l: T("hoja_resp"), w: "10%", cls: "hj-c" }, { l: regL(evDef[7]), w: "17%" }, { l: regL(alDef[8]), w: "6%", cls: "hj-c" }
    ], todas, { cls: "hj-eventos" }));

    // I · Cierre
    p2.appendChild(hojaSeccion(doc, regL(REG_SECCIONES[REG_SECCIONES.length - 1])));
    var gI = nodoInforme(doc, "div", "hj-grid");
    var res = nodoInforme(doc, "div", "hj-celda hj-s4");
    res.appendChild(nodoInforme(doc, "small", null, T("hoja_resultado")));
    var resV = nodoInforme(doc, "div", "hj-v hj-lin");
    REG_RESULTADO.forEach(function (o) {
      resV.appendChild(nodoInforme(doc, "span", "hj-it", hojaCasilla(regGet(d.v, hojaDef("cierre_resultado"), c) === o.v) + " " + regOpcionLabel(o)));
    });
    resV.appendChild(nodoInforme(doc, "span", "hj-it", regL(hojaDef("cierre_modalidades")) + ": " + (V("cierre_modalidades") || "____________")));
    res.appendChild(resV);
    gI.appendChild(res);
    var com = nodoInforme(doc, "div", "hj-celda hj-s4");
    com.appendChild(nodoInforme(doc, "small", null, T("hoja_comunicacion")));
    var comV = nodoInforme(doc, "div", "hj-v hj-lin");
    comV.appendChild(nodoInforme(doc, "span", "hj-it", hojaCasilla(!!d.v.cierre_com_cir) + " " + T("hoja_cirujano")));
    comV.appendChild(nodoInforme(doc, "span", "hj-it", hojaCasilla(!!d.v.cierre_com_an) + " " + T("hoja_anestesia") + "  h: " + (d.v.cierre_com_h || "_____")));
    // Resultado esperable (⇄ ficha): casillas como el Resultado; si el caso
    // trae el texto libre de antes, se imprime ese texto.
    var esp = resultadoEsperableId(regGet(d.v, hojaDef("cierre_esperable"), c));
    var espTxt = regL(hojaDef("cierre_esperable")) + ":";
    if (esp && !REG_RES_ESPERABLE.some(function (o) { return o.v === esp; })) {
      comV.appendChild(nodoInforme(doc, "span", "hj-it", espTxt + " " + esp));
    } else {
      comV.appendChild(nodoInforme(doc, "span", "hj-it", espTxt));
      REG_RES_ESPERABLE.forEach(function (o) {
        comV.appendChild(nodoInforme(doc, "span", "hj-it", hojaCasilla(esp === o.v) + " " + regOpcionLabel(o)));
      });
    }
    com.appendChild(comV);
    gI.appendChild(com);
    gI.appendChild(hojaCelda(doc, regL(hojaDef("cierre_incidencias")), V("cierre_incidencias"), 2));
    gI.appendChild(hojaCelda(doc, regL(hojaDef("cierre_material")), d.v.cierre_material, 2));
    var perla = nodoInforme(doc, "div", "hj-celda hj-s4");
    perla.appendChild(nodoInforme(doc, "small", null, regL(hojaDef("cierre_perla"))));
    perla.appendChild(nodoInforme(doc, "div", "hj-v", hojaCasilla(!!V("cierre_perla_check")) + " " + T("hoja_caso_sesion") + "  " + (V("cierre_perla") || "")));
    gI.appendChild(perla);
    var pend = nodoInforme(doc, "div", "hj-celda hj-s4");
    pend.appendChild(nodoInforme(doc, "small", null, T("hoja_pendientes")));
    var pendV = nodoInforme(doc, "div", "hj-v hj-lin");
    [["pend_informe", "Informe"], ["pend_explor", "Explor. postop"], ["pend_bd", T("hoja_bd")],
     ["pend_tiempos", T("hoja_tiempos")], ["pend_cadwell", T("hoja_cadwell", { equipo: textoEquipoRegistro() })]].forEach(function (x) {
      pendV.appendChild(nodoInforme(doc, "span", "hj-it", hojaCasilla(!!d.v[x[0]]) + " " + x[1]));
    });
    pendV.appendChild(nodoInforme(doc, "span", "hj-it", regL(hojaDef("cierre_firma")) + ": " + (d.v.cierre_firma || "____________")));
    pend.appendChild(pendV);
    gI.appendChild(pend);
    p2.appendChild(gI);

    // Datos del caso que conviene tener a la vista: parámetros de cada
    // técnica y notas -lo que ya se metió en Gestión de Casos-.
    if (c) {
      var notas = [
        [T("caso_notas_montaje"), c.notas_montaje],
        [T("caso_notas_montaje_tecnicas"), c.notas_montaje_tecnicas],
        [T("caso_notas_material"), c.notas_material]
      ].filter(function (n) { return n[1]; });
      var params = seccionParametrosInforme(doc, c);
      if (notas.length || params) {
        p2.appendChild(hojaSeccion(doc, T("hoja_datos_caso")));
        var dc = nodoInforme(doc, "div", "hj-datos-caso");
        notas.forEach(function (n) {
          var l = nodoInforme(doc, "div", "hj-nota");
          l.appendChild(nodoInforme(doc, "b", null, n[0] + ": "));
          l.appendChild(doc.createTextNode(n[1]));
          dc.appendChild(l);
        });
        if (params) {
          var h3 = params.querySelector("h3");
          if (h3) h3.parentNode.removeChild(h3);
          dc.appendChild(params);
        }
        p2.appendChild(dc);
      }
    }
    fragmento.appendChild(p2);
    return fragmento;
  }

  var ESTILO_HOJA_REGISTRO =
    "@page{size:A4;margin:6mm}" +
    "*{box-sizing:border-box}" +
    "body{font:7.6pt/1.22 Arial,Helvetica,sans-serif;color:#000;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
    ".hoja{page-break-after:always}.hoja:last-child{page-break-after:auto}" +
    ".hj-titulo{display:flex;justify-content:space-between;align-items:baseline;font-size:10pt;margin-bottom:1mm;border-bottom:0.5mm solid #000;padding-bottom:0.5mm}" +
    ".hj-titulo span{font-size:8pt}" +
    ".hj-sec{margin:1.6mm 0 0;padding:0.4mm 1.5mm;background:#d9d9d9;border:0.3mm solid #000;font-size:7pt;text-transform:uppercase;letter-spacing:0.02em}" +
    ".hj-sec small{font-weight:400;text-transform:none;font-size:6pt}" +
    ".hj-grid{display:grid;grid-template-columns:repeat(4,1fr);border-left:0.25mm solid #000;border-top:0.25mm solid #000}" +
    ".hj-celda{border-right:0.25mm solid #000;border-bottom:0.25mm solid #000;padding:0.3mm 1.2mm;min-height:6.2mm}" +
    ".hj-ident{display:grid;grid-template-columns:1fr 38mm;gap:2mm;align-items:stretch}" +
    ".hj-ident .hj-celda{padding:0.1mm 1mm;min-height:5.1mm}.hj-ident .hj-celda small{font-size:5.2pt;line-height:1.05}.hj-ident .hj-v{font-size:7.4pt;line-height:1.1}" +
    ".hj-cabeza{border:0.25mm solid #000;background:#fff;padding:0.5mm;display:flex}.hj-cabeza svg{width:100%;height:31mm}" +
    ".hj-s2{grid-column:span 2}.hj-s3{grid-column:span 3}.hj-s4{grid-column:span 4}" +
    ".hj-celda small{display:block;font-size:5.6pt;color:#444}" +
    ".hj-v{font-size:8pt;font-weight:700;white-space:pre-wrap}" +
    ".hj-lin{display:flex;flex-wrap:wrap;gap:0 3mm;font-weight:400}" +
    ".hj-it{white-space:nowrap}" +
    ".hj-mods{border:0.25mm solid #000;border-top:none}" +
    ".hj-mod{display:flex;flex-wrap:wrap;gap:0 4mm;padding:0.35mm 1.2mm;border-top:0.2mm solid #999;align-items:baseline}" +
    ".hj-mod:first-child{border-top:none}" +
    ".hj-mod-rot{min-width:20mm}.hj-mod-grupo{display:inline-flex;flex-wrap:wrap;gap:0 2.5mm}.hj-mod-grupo i{font-style:normal;color:#444}" +
    ".hj-tabla{width:100%;border-collapse:collapse;table-layout:fixed}" +
    ".hj-tabla th,.hj-tabla td{border:0.25mm solid #000;padding:0 1mm;overflow:hidden}" +
    ".hj-tabla th{background:#ececec;font-size:6pt;text-align:center;font-weight:700;padding:0.3mm 0.5mm}" +
    ".hj-tabla td{height:5.4mm;font-size:7.4pt}" +
    ".hj-tabla td.hj-c,.hj-tabla th.hj-c{text-align:center;font-size:6.6pt}" +
    ".hj-hitos td{height:8mm;text-align:center;font-weight:700}" +
    ".hj-par{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2.5mm}.hj-par4{grid-template-columns:1fr 1fr 1fr 0.62fr;gap:1.8mm}" +
    ".hj-tt{background:#d9d9d9;font-size:6.4pt;text-align:left;padding:0.3mm 1mm}.hj-tornillos td{text-align:center}" +
    ".hj-basales td{height:4.4mm;font-size:6.2pt}.hj-basales-larga td{height:3.7mm}.hj-basales td.hj-rot,.hj-basales th.hj-rot{font-weight:700;text-align:left;white-space:nowrap;font-size:6.2pt}" +
    ".hj-raabe{border:0.25mm solid #000;border-top:none;padding:0.5mm 1.2mm;display:flex;flex-wrap:wrap;gap:0 4mm;align-items:baseline}" +
    ".hj-raabe-montaje{flex:1 0 100%;font-size:6.6pt;color:#222}" +
    ".hj-raabe{gap:0 8mm}.hj-inten{margin-left:10mm}" +
    ".hj-lineas{border:0.25mm solid #000;border-top:none;display:grid;grid-template-columns:1fr 1fr}" +
    ".hj-gridcol{padding:0.3mm 1.5mm}.hj-gridcol+.hj-gridcol{border-left:0.25mm solid #000}" +
    ".hj-linea{display:flex;align-items:flex-end;gap:1mm;height:5.2mm;font-size:7pt}" +
    ".hj-linea-t{flex:0 0 11mm;font-size:7.6pt}.hj-linea-e{flex:0 0 auto;white-space:nowrap}" +
    ".hj-linea-v{flex:1 1 auto;border-bottom:0.25mm solid #000;min-height:3.6mm;font-weight:700;padding-left:1mm}" +
    ".hj-mapeo{display:grid;grid-template-columns:1fr 64mm;gap:2mm;margin-top:1.2mm}" +
    ".hj-mapeo-tabla td{height:6mm}" +
    ".hj-esquema{border:0.25mm solid #000;padding:0.3mm 1mm;min-height:44mm}.hj-esquema small{font-size:5.6pt;color:#444}" +
    ".hj-esquema img{display:block;max-width:100%;max-height:40mm;margin:0.5mm auto}" +
    ".hj-leyenda{border:0.25mm solid #000;border-top:none;padding:0.5mm 1.5mm;font-size:6.2pt;line-height:1.3}" +
    ".hj-eventos td{height:7.2mm;font-size:7.2pt}.hj-eventos tr.hj-alarma td{font-weight:700}" +
    ".hj-datos-caso{border:0.25mm solid #000;border-top:none;padding:0.6mm 1.5mm;font-size:6.8pt}" +
    ".hj-datos-caso .informe-seccion{margin:0;break-inside:auto}.hj-datos-caso .informe-tecpar{margin:0.4mm 0;padding-left:1.2mm;border-left:0.4mm solid #999}" +
    ".hj-datos-caso .informe-tecpar h4{margin:0;font-size:7pt}.hj-datos-caso .informe-tecpar-linea,.hj-datos-caso .informe-tecpar-notas{margin:0;font-size:6.6pt}" +
    ".hj-nota{margin-bottom:0.5mm;white-space:pre-wrap}";

  function abrirHojaRegistro(c) {
    var ventana = window.open("", "_blank");
    if (!ventana) { alert(T("caso_pdf_popup_bloqueado")); return; }
    var doc = ventana.document;
    doc.open();
    doc.write("<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>MIO-Check</title></head><body></body></html>");
    doc.close();
    doc.title = "MIO-Check — " + T("tile_registro") + (c && c.ID_Caso ? " " + c.ID_Caso : "");
    var estilo = doc.createElement("style");
    estilo.textContent = ESTILO_HOJA_REGISTRO + ESTILO_INFORME_PDF.replace(/body\{[^}]*\}/, "");
    doc.head.appendChild(estilo);
    doc.body.appendChild(construirHojaRegistro(doc, c));
    ventana.focus();
    ventana.print();
  }

  document.getElementById("registro-imprimir").addEventListener("click", function () {
    registroGuardarYa();
    abrirHojaRegistro(registroCaso());
  });
  document.getElementById("caso-hoja-registro").addEventListener("click", function () {
    // Como "Crear informe": lo que haya ahora en la ficha, sin exigir Guardar.
    leerFichaCaso();
    abrirHojaRegistro(casoAbierto);
  });

  /* ---------------------------------------------------------------- *
   * Modo demostración: datos de ejemplo (25-09-2026). Ver la cabecera de
   * MODO_DEMO al principio de este archivo. Todo es ficticio y genérico
   * -este repositorio es público-: ni casos reales, ni precios del usuario,
   * ni nombres. Los parámetros de los apuntes van marcados como ejemplo.
   * ---------------------------------------------------------------- */
  function fechaDemo(dias) {
    var d = new Date();
    d.setDate(d.getDate() + dias);
    return d.getFullYear() + "-" + dosDigitos(d.getMonth() + 1) + "-" + dosDigitos(d.getDate());
  }

  // Solo las colocaciones que existen en el catálogo y en la caja de hoy: si
  // algún día cambia un id, la demo siembra lo que queda en vez de romperse.
  function asignacionesDemo(asign) {
    var out = {};
    Object.keys(asign).forEach(function (caja) {
      if (!CAJAS_TODAS[caja]) return;
      var validas = {};
      entradasDe(caja).forEach(function (e) { validas[e.id] = true; });
      Object.keys(asign[caja]).forEach(function (ent) {
        var item = asign[caja][ent];
        if (!validas[ent] || !ITEMS[item]) return;
        out[caja] = out[caja] || {};
        out[caja][ent] = item;
      });
    });
    return out;
  }

  function tecnicasDemo(ids) {
    return ids.filter(function (id) { return !!TECS[id]; });
  }

  function montajeDemo(nombre, tecnicas, asign, extras, notas) {
    var m = montajeNuevo(nombre);
    m.tecnicas = tecnicasDemo(tecnicas);
    m.asignaciones = asignacionesDemo(asign);
    m.extras = (extras || []).filter(function (id) { return !!ITEMS[id]; });
    m.notas_montaje = notas || "";
    guardarMontaje(m, true);
    return m;
  }

  function casoDemo(dias, campos, m) {
    var c = casoVacio();
    c.fecha = fechaDemo(dias);
    c.ID_Caso = siguienteIdCaso(c.fecha);
    c.centro = T("demo_centro");
    Object.keys(campos).forEach(function (k) { c[k] = campos[k]; });
    if (m) {
      volcarMontajeEnCaso(c, {
        tecnicas: m.tecnicas.slice(), asignaciones: clonar(m.asignaciones),
        extras: m.extras.slice(), etiquetas: {}, conmutador: {},
        notas_montaje: m.notas_montaje
      });
      c.tecnicas_realizadas = m.tecnicas.slice();
      c.montaje_origen = m.montaje_uid;
    }
    if (c.tecnicas_alteradas) c.tecnicas_alteradas = tecnicasDemo(c.tecnicas_alteradas);
    guardarCaso(c, true);
    return c;
  }

  /* Precios de la demo (28-09-2026, pedido del usuario: que se vea el coste
     de cada cirugía). INVENTADOS, del mismo orden que los de un servicio
     real pero no los reales (regla 2 de CLAUDE.md: nunca precios reales en
     este repositorio). Van como etiquetas propias del almacén de la demo,
     igual que las pondría un usuario desde el gestor de etiquetas; las sondas
     monopolar y de aspiración, como fungibles (de un solo uso). Solo si la
     demo todavía no tiene ninguna etiqueta con precio. */
  var PRECIOS_DEMO = {
    aguja_subdermica: 2.3, aguja_trenzada: 9.4, aguja_monopolar: 4.2, electrodo_sacacorchos: 4.9,
    hook_wire: 8.75, pegatinas: 1.25, sensor_tubo: 10.5, electrodo_epidural: 340,
    electrodo_epidural_dwave: 340, electrodo_grid_mantaA: 870, electrodo_grid_mantaB: 870,
    sonda_mono_esferica: 79.9, sonda_aspiracion: 199
  };
  function preciosDemo() {
    if (etiquetasUsuario.some(function (e) { return typeof e.precio === "number"; })) return false;
    Object.keys(PRECIOS_DEMO).forEach(function (id) {
      var base = ETIQUETAS_BASE.filter(function (e) { return e.id === id; })[0];
      if (!base) return;
      var propia = Object.assign({}, base, { precio: PRECIOS_DEMO[id], fungible: true });
      var i = etiquetasUsuario.map(function (e) { return e.id; }).indexOf(id);
      if (i === -1) etiquetasUsuario.push(propia); else etiquetasUsuario[i] = propia;
    });
    reconstruirEtiquetas();
    guardarEstado();
    return true;
  }

  function sembrarDemo() {
    // Antes de crear los casos: su coste se calcula al volcar el montaje.
    preciosDemo();
    // Cajas que se repiten en varias plantillas
    var tesC3C4 = { "5:anodal": "c3", "5:catodal": "c4", "6:anodal": "c1", "6:catodal": "c2" };
    var corticalSEP = { "1": "cz_prima", "2": "c3_prima", "3": "c4_prima", "4": "fz", "5": "cv2", "gnd": "tierra" };
    var mmii = { "9": "l_q", "10": "r_q", "11": "l_ta", "12": "r_ta", "13": "l_ah", "14": "r_ah", "15": "l_g", "16": "r_g", "gnd": "tierra" };

    var mLumbar = montajeDemo("Demo · Columna lumbar (SEP + MEP + EMG)",
      ["t_pess", "t_pem", "emg", "mapeo_raices_tornillos"],
      {
        tes_mep: { "5:anodal": "c3", "5:catodal": "c4", "6:anodal": "c1", "6:catodal": "c2", "12:catodal": "sonda_mono_recta", "12:anodal": "ref_sonda" },
        registro_cortical: corticalSEP,
        caja_estimulo: { "1": "l_ptn", "2": "r_ptn", "3": "l_mediano", "4": "r_mediano" },
        registro_muscular_mmss: { "1": "l_apb", "2": "r_apb" },
        registro_muscular_mmii: mmii
      }, [],
      "Plantilla de ejemplo. Mediano como control de SEP; APB como control de MEP. Sonda monopolar para estimular tornillos y raíces. La caja de miembros superiores va sin tierra a propósito, para ver el aviso de la Revisión del montaje en el Resumen.");

    var mMedular = montajeDemo("Demo · Tumor medular (Onda D)",
      ["t_pess", "t_pem", "onda_d", "emg"],
      {
        tes_mep: tesC3C4,
        registro_cortical: corticalSEP,
        caja_estimulo: { "1": "l_ptn", "2": "r_ptn", "3": "l_mediano", "4": "r_mediano" },
        registro_muscular_mmss: { "1": "l_apb", "2": "r_apb", "3": "l_bcps", "4": "r_bcps", "gnd": "tierra" },
        registro_muscular_mmii: mmii,
        caja_etiqueta_4: { "9": "px_dw", "10": "dst_dw", "gnd": "tierra" }
      }, [],
      "Electrodo epidural proximal y distal a la lesión (lo coloca el cirujano).");

    var mAPC = montajeDemo("Demo · Ángulo pontocerebeloso",
      ["t_pess", "t_pem", "pem_corticobulbares", "peatc", "emg"],
      {
        tes_mep: { "5:anodal": "c3", "5:catodal": "c4", "6:anodal": "c5", "6:catodal": "c6" },
        registro_cortical: { "1": "cz_prima", "2": "c3_prima", "3": "c4_prima", "4": "fz", "5": "cv2", "9": "a1", "10": "a2", "gnd": "tierra" },
        caja_estimulo: { "1": "l_ptn", "2": "r_ptn", "3": "l_mediano", "4": "r_mediano" },
        caja_etiqueta_3: { "1": "r_frontalis", "2": "r_ooc", "3": "r_oris", "4": "r_ment", "5": "r_mass", "6": "r_len", "7": "r_trapecio", "gnd": "tierra" },
        registro_muscular_mmss: { "1": "l_apb", "2": "r_apb", "gnd": "tierra" },
        registro_muscular_mmii: { "9": "l_ah", "10": "r_ah", "gnd": "tierra" }
      }, ["auriculares_peatc"],
      "Lado derecho en el ejemplo. Auriculares de PEATC en el material extra.");

    var mGRID = montajeDemo("Demo · Supratentorial con GRID",
      ["t_pem", "c_pem", "phase_reversal", "mapeo_cortical", "eeg"],
      {
        tes_mep: tesC3C4,
        registro_cortical: { "1": "grid1", "2": "grid2", "3": "grid3", "4": "grid4", "5": "grid5", "6": "grid6", "7": "grid7", "8": "grid8", "gnd": "tierra" },
        caja_estimulo: { "1": "r_mediano" },
        registro_muscular_mmss: { "1": "r_apb", "2": "r_fdio", "3": "r_ext", "4": "r_bcps", "5": "r_delt", "gnd": "tierra" },
        registro_muscular_mmii: { "9": "r_ta", "10": "r_ah", "gnd": "tierra" }
      }, [],
      "Hemisferio izquierdo en el ejemplo: registro motor en el lado derecho.");

    casoDemo(-38, {
      nombre_caso: "Demo · Artrodesis lumbar L4-S1", estado: "cerrado",
      hora_inicio: "08:30", hora_fin: "12:40",
      edad: "64", sexo: "hombre", servicio_id: "cot",
      antecedentes_relevantes: "Lumbociática bilateral de 2 años de evolución. Sin déficit motor previo.",
      diagnostico: "ecl", anatomia_patologica: "Espondilolistesis degenerativa L5-S1",
      intervencion: "Artrodesis instrumentada L4-S1", posicion: "prono", navegacion: "no",
      tipo_anestesia: "tiva", tof_monitorizado: "si",
      resumen_monitorizacion: "Basales reproducibles en SEP de tibiales y medianos y en MEP de los cuatro miembros. Sin cambios significativos durante la instrumentación ni tras la reducción. Free-EMG sin descargas mantenidas.",
      umbral_raices_niveles: { niveles: ["L4", "L5", "S1"], valores: {
        L4: { izq: "24", der: "22" }, L5: { izq: "19", der: "26" }, S1: { izq: "28", der: "25" } } },
      recuperacion_senal: "sin_cambios", evolucion_postop: "sin_deficit",
      deficit_postoperatorio: "Sin déficit nuevo.", concordancia: "VN",
      rol: "residente", dificultad_1a5: "2",
      aprendizaje_clave: "Estimular cada tornillo tras colocarlo, antes de pasar al siguiente nivel."
    }, mLumbar);

    // Caso estrella de la demo (demo-congreso B2.F3): el del recorrido
    // guiado, con todos los apartados de la ficha, la checklist y la hoja de
    // registro rellenos, para que la hoja impresa salga completa. Ficticio,
    // sin nombres. "Restablecer demo" lo vuelve a sembrar tal cual.
    var cEpend = casoDemo(-21, {
      nombre_caso: "Demo · Ependimoma medular D8-D9", estado: "cerrado",
      hora_inicio: "08:15", hora_fin: "14:30",
      edad: "47", sexo: "mujer", servicio_id: "neurocirugia",
      antecedentes_relevantes: "Parestesias en ambos miembros inferiores de 6 meses de evolución, con nivel sensitivo D10. Balance motor 5/5. Sin alteración esfinteriana.\nRM: lesión intramedular D8-D9 centrada, con captación homogénea y quistes polares.",
      diagnostico: "loe_med", anatomia_patologica: "Ependimoma intramedular D8-D9 (grado 2 de la OMS)",
      intervencion: "Laminotomía D8-D9, mielotomía media posterior y exéresis de lesión intramedular",
      posicion: "prono",
      posicion_detalle: "Prono sobre almohadillas, brazos a lo largo del cuerpo. Bloques de mordida bilaterales antes de voltear.",
      navegacion: "no",
      otros_datos_quirurgicos: "Microscopio. Ecografía intraoperatoria para localizar los polos de la lesión antes de la mielotomía. Electrodo epidural de Onda D colocado por el cirujano tras la laminotomía.",
      tipo_anestesia: "tiva", tipo_anestesia_detalle: "Propofol + remifentanilo. Rocuronio solo en la inducción.",
      tof_monitorizado: "si",
      incidencias_anestesicas: "Hipotensión (TAM 72 mmHg) durante la resección del polo inferior; corregida con vasopresor hasta TAM > 90 mmHg.",
      resumen_monitorizacion: "Basales reproducibles tras la posición, sin cambios respecto al supino.\nTras la mielotomía media posterior se pierden los SEP de tibiales de forma bilateral: esperable por la mielotomía, se informa y no se toma como criterio de alarma.\nDurante la resección del polo inferior, pérdida del MEP muscular en tibial anterior y abductor del hallux izquierdos con Onda D estable (caída < 20 %). Alarma A1: pausa, irrigación con suero templado y TAM > 90 mmHg. El tibial anterior reaparece a los 18 min con umbral 40 mA mayor; el abductor del hallux no se recupera al cierre.\nOnda D sin cambios hasta el final. Free-EMG sin trenes mantenidos.",
      hubo_cambios_plan: false,
      alerta: true, tecnicas_alteradas: ["t_pem"],
      recuperacion_senal: "persistentes", evolucion_postop: "deficit_transitorio",
      resultado_esperable: "empeoramiento",
      incidencias_tecnicas: "Ninguna. Impedancias correctas durante toda la cirugía.",
      deficit_postoperatorio: "Paresia de MII izquierdo 3/5 en el postoperatorio inmediato, 4+/5 a las 72 h y 5/5 al mes. Hipoestesia propioceptiva en miembros inferiores, esperable tras la mielotomía.",
      concordancia: "VP",
      rol: "residente", supervisor: "Adjunto responsable", dificultad_1a5: "4", caso_destacado: true, hacer_seguimiento: true,
      aprendizaje_clave: "Con la Onda D conservada, la pérdida del MEP muscular suele traducirse en un déficit motor transitorio. Si además cae la Onda D más de un 50 %, el riesgo de déficit permanente es alto.",
      notas: "Caso de ejemplo de la demo: todos los apartados están rellenos."
    }, mMedular);
    cEpend.checklist_prequirurgico = {
      hist_clinica: true, examen_neuro: true, contraindicaciones_tes: true, consentimiento: true,
      definir_modalidades: true, plan_anestesico: true, montar_equipo: true, preconfigurar_protocolo: true,
      material_disponible: true, electrodos_antes_drapeado: true, bloque_mordida: true, impedancias: true,
      estado_estable_anestesico: true, registro_basal_supino: true, registro_tras_posicionamiento: true,
      nervios_perifericos_riesgo: true, basal_definitiva: true, confirmar_decusacion: true,
      aviso_bolo_anestesia: true, timing_maniobras_cirujano: true
    };
    cEpend.registro_intraop = {
      v: {
        quirofano: "Quirófano 3",
        prequx_motor: "5/5 en los cuatro miembros", prequx_sensitivo: "Parestesias en miembros inferiores, nivel D10",
        prequx_ppcc: "Normales", prequx_esfinteres: "Continente",
        m_pess_mediano: true, m_pess_tibial: true, m_pem_mmss: true, m_pem_mmii: true, m_tof: true,
        mont_tes: "C3/C4 (C1/C2 de reserva)", mont_incidencias: "Ninguna",
        an_hipnotico: "Propofol / remifentanilo", an_relajante: "Rocuronio (solo inducción)",
        an_relajante_h: "08:25", an_tof_h: "09:05", an_tam: "> 80 mmHg", an_temp: "36,2 ºC",
        h_entrada_q: "08:15", h_intubacion: "08:25", h_inicio_montaje: "08:30", h_fin_montaje: "08:50",
        h_basal_pre: "08:55", h_volteo: "09:00", h_basal_post: "09:15", h_incision: "09:25",
        h_apertura_dural: "10:20", h_fase_critica: "10:45", h_cierre: "13:30", h_fin_mio: "14:20",
        e_s_sep_msd_basal: "2,1/19,4", e_s_sep_msd_post: "2,0/19,5", e_s_sep_msd_final: "1,9/19,6",
        e_s_sep_msi_basal: "2,3/19,2", e_s_sep_msi_post: "2,2/19,3", e_s_sep_msi_final: "2,1/19,4",
        e_s_sep_mid_basal: "0,8/40,6", e_s_sep_mid_post: "0,7/40,9", e_s_sep_mid_final: "Ausente",
        e_s_sep_mii_basal: "0,6/41,2", e_s_sep_mii_post: "0,6/41,5", e_s_sep_mii_final: "Ausente",
        e_m_mep_msd_basal: "Presente", e_m_mep_msd_post: "Presente", e_m_mep_msd_final: "Presente",
        e_m_mep_msi_basal: "Presente", e_m_mep_msi_post: "Presente", e_m_mep_msi_final: "Presente",
        e_m_mep_mid_basal: "TA + AH", e_m_mep_mid_post: "TA + AH", e_m_mep_mid_final: "TA + AH",
        e_m_mep_mii_basal: "TA + AH", e_m_mep_mii_post: "TA + AH", e_m_mep_mii_final: "Solo TA",
        e_m_onda_d_basal: "22 µV", e_m_onda_d_post: "21 µV", e_m_onda_d_final: "20 µV",
        e_m_onda_d_dist_basal: "14 µV", e_m_onda_d_dist_post: "14 µV", e_m_onda_d_dist_final: "12,5 µV",
        cierre_resultado: "persistentes",
        cierre_modalidades: "MEP MII izq. (AH ausente, TA con umbral +40 mA). SEP de miembros inferiores (mielotomía).",
        cierre_com_cir: true, cierre_com_an: true, cierre_com_h: "14:15",
        cierre_incidencias: "Ninguna.", cierre_material: "Sin fallos. Reponer electrodo epidural.",
        cierre_perla_check: true,
        cierre_perla: "Onda D conservada + pérdida del MEP muscular: déficit habitualmente transitorio.",
        cierre_firma: "Usuario demo"
      },
      eventos: [
        { id: uuid(), hora: "09:15", cod: "F", fase: "Basal tras la posición en prono", modalidad: "Todas", cambio: "Sin cambios frente al supino", accion: "Basal definitiva" },
        { id: uuid(), hora: "10:20", cod: "F", fase: "Apertura dural", modalidad: "Todas", cambio: "Sin cambios", accion: "" },
        { id: uuid(), hora: "10:45", cod: "E", fase: "Mielotomía media posterior", modalidad: "SEP tibiales bilat.", cambio: "Pérdida", av_cir: true, accion: "Esperable por la mielotomía; se informa, sin alarma" },
        { id: uuid(), hora: "11:40", cod: "A", fase: "Resección del polo inferior", modalidad: "MEP MII izq.", cambio: "Pérdida de TA y AH; Onda D estable", av_cir: true, av_an: true, accion: "Alarma A1" },
        { id: uuid(), hora: "11:42", cod: "An", fase: "Pausa de la resección", modalidad: "", cambio: "TAM 72 → 92 mmHg", av_an: true, accion: "Vasopresor" },
        { id: uuid(), hora: "11:58", cod: "E", fase: "Reanuda la resección", modalidad: "MEP MII izq.", cambio: "TA reaparece (+40 mA)", av_cir: true, accion: "Se continúa con cautela" },
        { id: uuid(), hora: "13:30", cod: "F", fase: "Cierre dural", modalidad: "Todas", cambio: "Basales de cierre", accion: "Onda D sin cambios" }
      ],
      mapeo: [],
      alarmas: [
        { id: uuid(), hora: "11:40", modalidad: "t-MEP MII", criterio: "perdida", fase: "Resección",
          causa: "quirurgica", nrf: true, an: true, cir: true, medidas_l: ["pausa", "suero", "tam"],
          medidas: "TA vuelve con umbral +40 mA; AH no", recup: "P", h_recup: "11:58" }
      ],
      modular: [], imagenes: []
    };
    guardarCaso(cEpend, true);

    casoDemo(-9, {
      nombre_caso: "Demo · Neurinoma del acústico derecho", estado: "cerrado",
      hora_inicio: "08:00", hora_fin: "15:10",
      edad: "52", sexo: "mujer", servicio_id: "neurocirugia",
      antecedentes_relevantes: "Hipoacusia derecha progresiva. Función facial normal (House-Brackmann I).",
      diagnostico: "loe_it", anatomia_patologica: "Schwannoma vestibular derecho",
      intervencion: "Craneotomía retrosigmoidea derecha", posicion: "park_bench", navegacion: "si",
      tipo_anestesia: "tiva", tof_monitorizado: "si",
      resumen_monitorizacion: "MEP corticobulbar del orbicular de los labios estable. Descargas neurotónicas breves en el EMG facial durante la disección, sin trenes mantenidos. PEATC con pérdida de la onda V al final de la resección.",
      recuperacion_senal: "persistentes", evolucion_postop: "deficit_pendiente",
      deficit_postoperatorio: "Paresia facial leve (House-Brackmann II). Cofosis derecha.", concordancia: "VP",
      rol: "residente", dificultad_1a5: "5", hacer_seguimiento: true,
      aprendizaje_clave: "La relación final/basal del MEP corticobulbar orienta el pronóstico facial."
    }, mAPC);

    casoDemo(-6, {
      nombre_caso: "Demo · Escoliosis idiopática", estado: "cancelado",
      motivo_cancelacion: "Cuadro febril del paciente la víspera. Se reprograma.",
      edad: "15", sexo: "mujer", servicio_id: "cot", diagnostico: "escoliosis"
    }, null);

    var cGRID = casoDemo(1, {
      nombre_caso: "Demo · Glioma frontal izquierdo", estado: "preparado",
      edad: "58", sexo: "hombre", servicio_id: "neurocirugia",
      antecedentes_relevantes: "Crisis focales motoras de mano derecha. Balance motor 5/5.",
      diagnostico: "loe_st", anatomia_patologica: "Lesión frontal posterior izquierda, próxima al área motora",
      intervencion: "Craneotomía frontal izquierda y resección", posicion: "supino", navegacion: "si",
      tipo_anestesia: "tiva"
    }, mGRID);
    cGRID.checklist_prequirurgico = {
      hist_clinica: true, examen_neuro: true, consentimiento: true, definir_modalidades: true
    };
    guardarCaso(cGRID, true);

    activo = mLumbar.montaje_uid;
    guardarMontajes();

    var carpParam = { id: uuid(), nombre: "Parámetros (ejemplo)", color: APUNTE_COLORES[0] };
    var carpOrg = { id: uuid(), nombre: "Organización", color: APUNTE_COLORES[2 % APUNTE_COLORES.length] };
    var seccion = function (carpeta, titulo, html) {
      var tmp = document.createElement("div");
      tmp.innerHTML = html.replace(/<br>/g, "\n");   // contenido fijo de aquí, no del usuario
      return { id: uuid(), titulo: titulo, html: html, texto: tmp.textContent, carpeta_id: carpeta.id, fotos: [] };
    };
    apunteDoc = {
      carpetas: [carpParam, carpOrg],
      secciones: [
        seccion(carpParam, "MEP transcraneal", "<b>Ejemplo</b> de cómo anotar tus parámetros habituales:<br>Tren de 5 pulsos, ISI 4 ms.<br>Montaje C3/C4; C1/C2 si se mueve mucho el paciente.<br><i>Comprobar el bloque de mordida antes de estimular.</i>"),
        seccion(carpParam, "SEP de tibial posterior", "<b>Ejemplo</b>: estímulo en maléolo interno, registro Cz'-Fz y Cv2."),
        seccion(carpOrg, "Antes de entrar a quirófano", "Revisar el caso en <b>Gestión de Casos</b>, pasar la <b>Checklist</b> e imprimir la <b>hoja de registro</b>.")
      ],
      fotos: [], editado_en: null
    };
    guardarApunteDoc();

    localStorage.setItem(DEMO_SEMBRADO_KEY, new Date().toISOString());
  }

  function restablecerDemo() {
    if (!confirm(T("demo_restablecer_conf"))) return;
    localStorage.borrarTodo();
    var recargar = function () { location.reload(); };
    if (!window.indexedDB) { recargar(); return; }
    abrirFotosDB().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(FOTOS_DB_ALMACEN, "readwrite");
        tx.objectStore(FOTOS_DB_ALMACEN).clear();
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      });
    }).then(recargar, recargar);
  }

  function prepararDemo() {
    document.body.classList.add("modo-demo");
    document.title = document.title + " — " + T("demo_titulo");
    document.getElementById("demo-inicio").hidden = false;
    document.getElementById("demo-restablecer").addEventListener("click", restablecerDemo);
    var sembrado = null;
    try { sembrado = localStorage.getItem(DEMO_SEMBRADO_KEY); } catch (e) { /* sin persistencia */ }
    if (!sembrado) {
      try { sembrarDemo(); } catch (e) { console.error("Demo: no se pudieron sembrar los datos", e); }
    }
    // Demos sembradas antes de que hubiera precios: se ponen ahora y se
    // recalcula el coste guardado de los casos con montaje.
    if (preciosDemo()) {
      Object.keys(casos).forEach(function (uid) {
        var cD = casos[uid];
        if (!cD.n_cajas) return;
        var resD = calcularResumen(montajeDesdeCaso(cD));
        var cosD = calcularCoste(resD);
        cD.coste_material = Math.round(cosD.total * 100) / 100;
        cD.coste_completo = !cosD.sinPrecio.length;
        guardarCaso(cD, true);
      });
    }
    // Un usuario de demostración ya elegido en "— quién eres —" (demo-congreso
    // B1.F3), para que quien pruebe la demo no tenga que crear uno. Se
    // comprueba en cada arranque, así también llega a las demos ya sembradas.
    if (!USRS[USUARIO_DEMO]) {
      guardarEnCatalogo("usuarios", { id: USUARIO_DEMO, nombre: "Usuario demo", nombre_en: "Demo user", activa: true });
      guardarEstado();
    }
    if (!usuarioActual()) fijarPerfilUsuario(USUARIO_DEMO);
    // Lo que sigue "en construcción" no se enseña en la demo (B1.F4): la
    // tarjeta Bibliografía y la pestaña Teoría básica de Docencia. Fuera de la
    // demo no cambian.
    // Bibliografía sí se enseña desde el 27-09-2026 (ya no está en
    // construcción: es la bibliografía recomendada).
    // Técnicas IONM no (27-09-2026, pedido del usuario): son apuntes
    // suyos sacados de libros, capítulos y artículos, no para enseñarlos.
    // abrirTecnicasMio() además no abre nada en la demo.
    document.getElementById("tile-tecnicas-mio").hidden = true;
    var pestTeoria = document.querySelector('.pestana[data-pane="teoria"]');
    if (pestTeoria) pestTeoria.hidden = true;
    // Recorrido guiado (B2.F2): botón en Inicio y, la primera vez, se ofrece
    // solo -tras el arranque, con todo ya pintado-.
    document.getElementById("tour-lanzar-fila").hidden = false;
    document.getElementById("tour-lanzar").addEventListener("click", function () { tourIr(0); });
    var tourVisto = null;
    try { tourVisto = localStorage.getItem(TOUR_VISTO_KEY); } catch (e) { /* sin persistencia */ }
    if (!tourVisto) setTimeout(function () { tourIr(0); }, 300);
  }
  var USUARIO_DEMO = "u_demo";

  /* ---------------------------------------------------------------- *
   * Recorrido guiado "Empieza aquí" (demo-congreso B2.F2), solo en ?demo.
   * Una tarjeta flotante, sin librerías, que lleva paso a paso por el flujo
   * principal -plantilla, Resumen, caso, basales y alerta, hoja de registro-
   * y resalta en cada paso de qué está hablando. No bloquea nada: se puede
   * seguir tocando la app con la tarjeta abierta. Se ofrece la primera vez
   * que se entra en la demo (y otra vez tras "Restablecer demo", que borra
   * la marca) y se relanza desde el botón de Inicio.
   * Con la ficha del caso abierta (un <dialog> modal) la tarjeta se cuelga
   * dentro del propio diálogo: fuera de él quedaría inerte, sin poder pulsarla.
   * ---------------------------------------------------------------- */
  var TOUR_VISTO_KEY = "tour_visto";
  // 27-09-2026 (pedido del usuario): el caso es lo más interesante de la
  // herramienta, así que se recorre por apartados en vez de un solo paso de
  // "basales y alerta"; y se añaden Técnicas, el modo rápido del Registro y
  // lo que se puede sacar (hoja, informe, CSV).
  var TOUR_PASOS = ["bienvenida", "plantilla", "tecnicas", "resumen", "caso", "caso_montaje",
                    "caso_desarrollo", "caso_resultado", "caso_docencia", "registro", "salidas", "exportar"];
  var TOUR_GRUPO_CASO = { caso_montaje: "montaje", caso_desarrollo: "desarrollo",
                          caso_resultado: "resultado", caso_docencia: "formacion" };
  var tourPaso = -1;
  var tourCard = null;
  var tourFoco = null;

  function tourMontajeDemo() {
    var uids = Object.keys(montajes);
    for (var i = 0; i < uids.length; i++) {
      if (/^Demo · Columna lumbar/.test(montajes[uids[i]].nombre || "")) return uids[i];
    }
    return null;
  }

  function tourCasoDemo() {
    var elegido = null;
    Object.keys(casos).forEach(function (uid) {
      var c = casos[uid];
      if (!/Ependimoma/.test(c.nombre_caso || "")) return;
      if (!elegido || c.caso_destacado) elegido = uid;
    });
    return elegido;
  }

  function tourCerrarCaso() {
    if (dlgCaso.open) dlgCaso.close();
  }

  // Abre la ficha del caso de ejemplo (desde la lista de casos, para que
  // "Volver" lleve a un sitio con sentido) y avisa cuando ya está a la vista.
  function tourAbrirCaso(listo) {
    var uid = tourCasoDemo();
    if (!uid) { listo(); return; }
    if (dlgCaso.open && casoAbierto && casoAbierto.caso_uid === uid) { listo(); return; }
    tourCerrarCaso();
    abrirListaCasos();
    abrirCaso(uid);
    var intentos = 0;
    (function mirar() {
      if (dlgCaso.open || intentos++ > 60) listo();
      else setTimeout(mirar, 50);
    })();
  }

  // Cada paso lleva a su pantalla y devuelve (por listo) el elemento a
  // resaltar, o null si no hay ninguno.
  function tourPreparar(paso, listo) {
    var id = TOUR_PASOS[paso];
    if (id === "bienvenida") {
      tourCerrarCaso();
      irAPantalla("inicio");
      listo(null);
    } else if (id === "plantilla" || id === "tecnicas" || id === "resumen") {
      tourCerrarCaso();
      if (!pantallaActiva("organizador")) irAPantalla("organizador");
      var uid = tourMontajeDemo();
      if (uid && uid !== activo) { activo = uid; guardarMontajes(); renderTodo(); }
      var det = document.getElementById(id === "plantilla" ? "cajas" : id);
      det.open = true;
      listo(det);
    } else if (id === "registro") {
      // El Registro del caso de ejemplo, con el panel de apuntar a la vista,
      // que es de lo que habla
      tourCerrarCaso();
      registroVaciarPendiente();
      registroCasoUid = tourCasoDemo();
      regRapido = regRapidoVacio();
      renderRegistro();
      irAPantalla("registro");
      var panelReg = document.querySelector("#registro-contenido .reg-rapido");
      if (panelReg) panelReg.open = true;
      listo(panelReg || document.getElementById("registro-contenido"));
    } else if (id === "exportar") {
      tourCerrarCaso();
      abrirListaCasos();
      listo(document.getElementById("btn-exportar-casos-csv").parentNode);
    } else {
      tourAbrirCaso(function () {
        if (!dlgCaso.open) { listo(null); return; }
        if (id === "caso") { listo(dlgCaso.querySelector(".caso-cab")); return; }
        if (id === "salidas") {
          // Informe y Hoja de registro están en el ⋮ (29-09-2026): se abre
          document.getElementById("caso-mas-lista").hidden = false;
          listo(document.getElementById("caso-mas-lista"));
          return;
        }
        // Un apartado de la ficha: se abre ese y se pliegan los demás, para
        // que quepa a la vista lo que se está explicando.
        GRUPOS_CASO.forEach(function (gr) {
          var d = document.getElementById("caso-g-" + gr);
          if (d) d.open = gr === TOUR_GRUPO_CASO[id];
        });
        listo(document.getElementById("caso-g-" + TOUR_GRUPO_CASO[id]));
      });
    }
  }

  function tourQuitarFoco() {
    if (tourFoco) tourFoco.classList.remove("tour-foco");
    tourFoco = null;
  }

  function tourCrearCard() {
    tourCard = document.createElement("div");
    tourCard.className = "tour-card no-print";
    tourCard.setAttribute("role", "dialog");
    tourCard.setAttribute("aria-live", "polite");
    tourCard.innerHTML =
      '<div class="tour-cab"><p class="tour-num"></p><button type="button" class="tour-mini-btn"></button></div>' +
      '<p class="tour-tit"></p><p class="tour-texto"></p>' +
      '<div class="tour-botones"><button type="button" class="tour-saltar"></button>' +
      '<span class="barra-flex"></span><button type="button" class="tour-ant"></button>' +
      '<button type="button" class="tour-sig"></button></div>';
    tourCard.querySelector(".tour-saltar").addEventListener("click", tourTerminar);
    // Minimizar (27-09-2026): la tarjeta tapaba lo de abajo al bajar por la
    // página (Técnicas, Resumen, Notas del montaje...). Minimizada queda solo
    // su cabecera; se vuelve a abrir con el mismo botón.
    tourCard.querySelector(".tour-mini-btn").addEventListener("click", function () {
      tourCard.classList.toggle("tour-mini");
      tourPintarTextos();
      tourReservarSitio();
    });
    tourCard.querySelector(".tour-ant").addEventListener("click", function () { tourIr(tourPaso - 1); });
    tourCard.querySelector(".tour-sig").addEventListener("click", function () {
      if (tourPaso >= TOUR_PASOS.length - 1) tourTerminar();
      else tourIr(tourPaso + 1);
    });
    // Si se cierra la ficha con la tarjeta dentro, la tarjeta vuelve al body.
    dlgCaso.addEventListener("close", function () {
      if (tourCard && tourCard.parentNode === dlgCaso) document.body.appendChild(tourCard);
    });
  }

  // Textos de la tarjeta (también al cambiar de idioma con ella abierta).
  function tourPintarTextos() {
    if (!tourCard || tourPaso < 0) return;
    var id = TOUR_PASOS[tourPaso];
    var ultimo = tourPaso === TOUR_PASOS.length - 1;
    tourCard.querySelector(".tour-num").textContent = T("tour_paso", { n: tourPaso + 1, total: TOUR_PASOS.length });
    tourCard.querySelector(".tour-tit").textContent = T("tour_t_" + id);
    tourCard.querySelector(".tour-texto").textContent = T("tour_x_" + id);
    tourCard.querySelector(".tour-mini-btn").textContent = T(tourCard.classList.contains("tour-mini") ? "tour_mostrar" : "tour_minimizar");
    tourCard.querySelector(".tour-saltar").textContent = T(tourPaso === 0 ? "tour_ahora_no" : (ultimo ? "tour_cerrar" : "tour_saltar"));
    tourCard.querySelector(".tour-saltar").hidden = ultimo;
    var ant = tourCard.querySelector(".tour-ant");
    ant.textContent = T("tour_anterior");
    ant.hidden = tourPaso === 0;
    tourCard.querySelector(".tour-sig").textContent =
      T(tourPaso === 0 ? "tour_empezar" : (ultimo ? "tour_terminar" : "tour_siguiente"));
  }

  function tourIr(paso) {
    if (paso < 0 || paso >= TOUR_PASOS.length) return;
    if (!tourCard) tourCrearCard();
    tourPaso = paso;
    try { localStorage.setItem(TOUR_VISTO_KEY, "1"); } catch (e) { /* sin persistencia */ }
    tourQuitarFoco();
    tourPreparar(paso, function (foco) {
      if (tourPaso !== paso) return;   // se pulsó otro paso mientras tanto
      var padre = dlgCaso.open ? dlgCaso : document.body;
      if (tourCard.parentNode !== padre) padre.appendChild(tourCard);
      tourPintarTextos();
      var arriba = false;
      if (foco) {
        tourFoco = foco;
        foco.classList.add("tour-foco");
        foco.scrollIntoView({ block: foco.id === "caso-hoja-registro" ? "nearest" : "start" });
        // Fuera de la ficha, la cabecera y la barra de la plantilla son
        // sticky y taparían el principio de lo resaltado: se baja lo que ocupan.
        if (!dlgCaso.open) {
          var tapa = 0;
          document.querySelectorAll(".barra-sup, #barra-caso").forEach(function (el) {
            if (el.getClientRects().length) tapa = Math.max(tapa, el.getBoundingClientRect().bottom);
          });
          if (tapa > 0) window.scrollBy(0, -(tapa + 8));
        }
        // La tarjeta va a la mitad de la pantalla que deja libre lo resaltado.
        var r = foco.getBoundingClientRect();
        arriba = r.top + Math.min(r.height, 200) / 2 > window.innerHeight / 2;
      }
      tourCard.classList.toggle("tour-arriba", arriba);
      // En la ficha, abajo va justo encima de la barra de acciones, sin taparla.
      var barra = dlgCaso.open && !arriba ? dlgCaso.querySelector(".caso-acciones") : null;
      tourCard.style.bottom = barra ? (window.innerHeight - barra.getBoundingClientRect().top + 8) + "px" : "";
      tourCard.hidden = false;
      tourReservarSitio();
    });
  }

  // Con la tarjeta abajo, la página gana por debajo lo que ocupa la tarjeta:
  // así se puede bajar hasta el final (Notas del montaje, botones...) sin que
  // nada quede tapado.
  function tourReservarSitio() {
    var abajo = tourCard && !tourCard.hidden && !tourCard.classList.contains("tour-arriba");
    document.body.style.paddingBottom = abajo ? (tourCard.offsetHeight + 24) + "px" : "";
  }

  // Terminar o salir de la visita vuelve a Inicio (29-09-2026, pedido del
  // usuario), cerrando la ficha del caso si la visita la había abierto.
  function tourTerminar() {
    tourQuitarFoco();
    tourPaso = -1;
    if (tourCard) tourCard.hidden = true;
    tourReservarSitio();
    tourCerrarCaso();
    irAPantalla("inicio");
  }

  /* ---------------------------------------------------------------- *
   * Arranque
   * ---------------------------------------------------------------- */
  // El idioma va primero: todo lo que se pinta después ya sale traducido
  var idiomaGuardado = null;
  try { idiomaGuardado = localStorage.getItem(IDIOMA_KEY); } catch (e) { /* sin persistencia */ }
  if (!idiomaGuardado) {
    // Primera visita: se propone el del navegador y se fija, para que no
    // cambie solo si algún día cambia la configuración del sistema.
    idiomaGuardado = (navigator.language || "es").toLowerCase().indexOf("en") === 0 ? "en" : "es";
    try { localStorage.setItem(IDIOMA_KEY, idiomaGuardado); } catch (e) { /* sin persistencia */ }
  }
  idioma = IDIOMAS.indexOf(idiomaGuardado) === -1 ? "es" : idiomaGuardado;
  volcarTraducciones();
  aplicarTextos();

  cargarEstado();
  cargarMontajes();
  // Después de cargarEstado(), que es quien deja el legado de la versión 2
  // listo para convertir, y después de los catálogos, que sembrarMontajes()
  // consulta para emparejar cada montaje con su tipo de cirugía.
  sembrarMontajes();
  limpiarMontajesHeredados();
  cargarCasos();
  cargarApunteDoc();
  cargarSync();
  cargarPerfilUsuario();
  cargarDocente();
  if (MODO_DEMO) prepararDemo();
  pintarEstadoSync();
  renderPerfilUsuario();
  renderTodo();
  // Arranca plegado, igual que Técnicas/Cajas/Resumen -pedido del usuario,
  // para que las cuatro ocupen lo mismo al cargar la página-. Solo en móvil:
  // en escritorio el catálogo es la barra lateral fija pensada para verse
  // sin volver a abrirla en cada colocación (ver la media query de
  // "Pantalla ancha" en style.css); plegarla también ahí obligaría a
  // desplegarla a mano antes de poder colocar nada.
  if (window.matchMedia("(max-width: 900px)").matches) plegarCatalogo(true);
  avisoGuardado(T(MODO_DEMO ? "demo_aviso" : (syncActivo() ? "guardado_nube" : "guardado_local")));
  // Traer lo último de GitHub al abrir, sin preguntar si no hay nada local
  // sin subir. Si lo hay, sube en vez de bajar.
  bajarAuto();
})();
