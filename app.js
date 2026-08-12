(function () {
  "use strict";

  var DATA = window.SURGERIES_DATA || {};
  var CAJAS = DATA.cajas_material || {};
  var CATALOGO_BASE = DATA.catalogo_material || [];
  var ETIQUETAS_BASE = DATA.etiquetas || [];
  var TECNICAS = DATA.tecnicas || [];
  var PERFILES = DATA.perfiles_procedimiento || [];
  var STORAGE_KEY = "mio_ionm_escenarios_v1";

  // Índice de técnicas: id -> técnica
  var TECS = {};
  TECNICAS.forEach(function (g) {
    (g.items || []).forEach(function (t) { TECS[t.id] = t; });
  });

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
    escenario_aria:      { es: "Escenario de cirugía", en: "Surgery scenario" },
    idioma_titulo:       { es: "Switch to English", en: "Cambiar a español" },
    sync_titulo:         { es: "Sincronizar con GitHub", en: "Sync with GitHub" },
    quirofano_titulo:    { es: "Oculta el catálogo y las técnicas para dejar solo el montaje y el resumen",
                           en: "Hides the catalogue and techniques, leaving only the montage and the summary" },
    quirofano_entrar:    { es: "Modo quirófano", en: "Theatre mode" },
    quirofano_salir:     { es: "Salir del modo quirófano", en: "Exit theatre mode" },
    btn_nuevo:           { es: "Nuevo", en: "New" },
    btn_duplicar:        { es: "Duplicar", en: "Duplicate" },
    btn_renombrar:       { es: "Renombrar", en: "Rename" },
    btn_vaciar:          { es: "Vaciar", en: "Empty" },
    btn_borrar:          { es: "Borrar", en: "Delete" },
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
    traido_de_github:    { es: "Traído de GitHub · {hora}", en: "Fetched from GitHub · {hora}" },
    sync_sin_conectar:   { es: "Sin conectar", en: "Not connected" },
    sync_conflicto:      { es: "Conflicto", en: "Conflict" },
    sync_sincronizando:  { es: "Sincronizando…", en: "Syncing…" },
    sync_sin_subir:      { es: "Sin subir", en: "Not uploaded" },
    sync_en_pausa:       { es: "En pausa", en: "Paused" },
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
    btn_plegar_tit:      { es: "Plegar / desplegar", en: "Collapse / expand" },
    chip_tipo:           { es: "Tipo: {tipo}", en: "Type: {tipo}" },
    chip_sin_etiqueta:   { es: "sin etiqueta", en: "no label" },
    chip_editar_tit:     { es: "Editar este material", en: "Edit this material" },
    chip_quitar_tit:     { es: "Quitar de esta entrada", en: "Remove from this input" },
    chip_etiqueta_tit:   { es: "Tipo físico de material en esta entrada", en: "Physical material type in this input" },
    colocando:           { es: "Colocando", en: "Placing" },
    colocando_ayuda:     { es: "— pulsa una entrada", en: "— tap an input" },
    cancelar:            { es: "Cancelar", en: "Cancel" },

    /* --- Técnicas --- */
    tecnicas_titulo:     { es: "Técnicas", en: "Techniques" },
    perfil_label:        { es: "Perfil", en: "Profile" },
    perfil_elegir:       { es: "— elegir —", en: "— choose —" },
    perfil_confirmar:    { es: "¿Marcar las técnicas de “{perfil}”?\nSustituye las técnicas marcadas ahora mismo. El material colocado no se toca.",
                           en: "Apply the techniques of “{perfil}”?\nThis replaces the currently selected techniques. Placed material is untouched." },

    /* --- Resumen --- */
    resumen_titulo:      { es: "Resumen de material", en: "Material summary" },
    resumen_sin_esc:     { es: "No hay ningún escenario. Crea uno con “+ Nuevo”.",
                           en: "There are no scenarios. Create one with “New”." },
    resumen_vacio:       { es: "Escenario vacío. Arrastra material del catálogo a las entradas de las cajas.",
                           en: "Empty scenario. Drag material from the catalogue onto the box inputs." },
    resumen_material:    { es: "Material a preparar", en: "Material to prepare" },
    resumen_cajas:       { es: "Cajas necesarias ({n})", en: "Boxes needed ({n})" },
    resumen_extra:       { es: "Material extra (no ocupa entrada)", en: "Extra material (no input used)" },
    resumen_avisos:      { es: "Avisos", en: "Warnings" },
    resumen_entradas:    { es: "{usadas}/{total} entradas", en: "{usadas}/{total} inputs" },
    resumen_redondeo:    { es: "Redondeado hacia arriba: {cantidad} paquetes en uso",
                           en: "Rounded up: {cantidad} packs in use" },
    aviso_caja_llena:    { es: "La caja “{caja}” está completa — no quedan entradas libres.",
                           en: "Box “{caja}” is full — no free inputs left." },
    aviso_pendiente:     { es: "Pendiente de confirmar: {texto}", en: "Pending confirmation: {texto}" },

    /* --- Escenarios --- */
    sin_escenarios:      { es: "— sin escenarios —", en: "— no scenarios —" },
    restablecido:        { es: "Restablecido a los presets del archivo.", en: "Reset to the presets from the file." },
    esc_nuevo_prompt:    { es: "Nombre del nuevo escenario de cirugía:", en: "Name of the new surgery scenario:" },
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
        fusionar(CAJAS[k], tr.cajas[k]);
      });
      Object.keys(CAJAS).forEach(function (k) {
        (CAJAS[k].especiales || []).forEach(function (esp) {
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
      TECNICAS.forEach(function (g) {
        if ((tr.grupos_tecnicas || {})[g.grupo]) g["grupo" + suf] = tr.grupos_tecnicas[g.grupo];
        (g.items || []).forEach(function (t) {
          fusionar(t, (tr.tecnicas || {})[t.id]);
        });
      });
      PERFILES.forEach(function (p) {
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
        var esc = escenarios[k];
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
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", T(el.dataset.i18nAria));
    });
    var btn = document.getElementById("btn-idioma");
    if (btn) {
      btn.textContent = idioma === "es" ? "EN" : "ES";
      btn.title = T("idioma_titulo");
    }
  }

  function aplicarIdioma(nuevo, repintar) {
    idioma = IDIOMAS.indexOf(nuevo) === -1 ? "es" : nuevo;
    try { localStorage.setItem(IDIOMA_KEY, idioma); } catch (e) { /* sin persistencia */ }
    aplicarTextos();
    if (repintar) {
      renderPerfilSelect();
      renderTodo();
      // El botón de quirófano tiene dos textos según el estado
      var q = document.body.classList.contains("modo-quirofano");
      document.getElementById("btn-quirofano").textContent =
        T(q ? "quirofano_salir" : "quirofano_entrar");
      pintarEstadoSync();
      avisoGuardado(T(syncActivo() ? "guardado_nube" : "guardado_local"));
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
    turquesa: "#0d8f8f", gris: "#8896a2"
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
      CATALOGO.push({ categoria: grupo.categoria, categoria_en: grupo.categoria_en, items: items });
    });

    catalogoUsuario.forEach(function (item) {
      var completo = Object.assign({}, item, { propio: true });
      var previo = ITEMS[item.id];
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
   * Estado
   * ---------------------------------------------------------------- */
  var escenarios = {};
  var activo = null;

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function cargarEstado() {
    escenarios = clonar(DATA.escenarios || {});
    catalogoUsuario = [];
    etiquetasUsuario = [];
    etiquetasBorradas = [];
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
    reconstruirEtiquetas();
    migrarMaterialALaEtiqueta();
    reconstruirCatalogo();
    if (guardado && guardado.escenarios) {
      // Lo guardado manda: incluye ediciones de los presets de fábrica
      Object.keys(guardado.escenarios).forEach(function (id) {
        escenarios[id] = guardado.escenarios[id];
      });
      // Respeta los borrados del usuario sobre presets de fábrica
      (guardado.borrados || []).forEach(function (id) {
        delete escenarios[id];
      });
      activo = guardado.activo;
    }
    if (!activo || !escenarios[activo]) {
      activo = Object.keys(escenarios)[0] || null;
    }
    traducirEscenarios();
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
        escenarios: escenarios,
        activo: activo,
        borrados: borrados,
        catalogo_usuario: catalogoUsuario,
        etiquetas_usuario: etiquetasUsuario,
        etiquetas_borradas: etiquetasBorradas
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

  function escenarioActual() {
    return escenarios[activo] || null;
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
    guardarEstado();
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
    guardarEstado();
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
    var info = CAJAS[key] || { nombre: key, descripcion: "" };
    return {
      nombre: campo(info, "nombre") || key,
      descripcion: campo(info, "descripcion"),
      canales: info.canales || 8,
      conector: info.conector || "par",
      inicio: info.numeracion_inicio || 1,
      especiales: info.especiales || []
    };
  }

  // Devuelve todas las entradas de una caja como lista plana de descriptores
  function entradasDe(key) {
    var info = infoCaja(key);
    var out = [];
    var i, n;
    for (i = 0; i < info.canales; i++) {
      n = info.inicio + i;
      if (info.conector === "anodal_catodal") {
        out.push({ id: n + ":anodal", etiqueta: n, polo: "anodal", conector: "rojo" });
        out.push({ id: n + ":catodal", etiqueta: n, polo: "catodal", conector: "negro" });
      } else if (info.conector === "par") {
        out.push({ id: String(n), etiqueta: n, conector: "par" });
      } else {
        out.push({ id: String(n), etiqueta: n, conector: "individual" });
      }
    }
    info.especiales.forEach(function (esp) {
      out.push({
        id: esp.clave,
        etiqueta: campo(esp, "nombre"),
        conector: esp.conector === "par" ? "par" : (esp.color || "individual"),
        nota: campo(esp, "nota"),
        especial: true
      });
    });
    return out;
  }

  /* ---------------------------------------------------------------- *
   * Selección por clic (alternativa a arrastrar)
   * ---------------------------------------------------------------- */
  var seleccionado = null;

  function seleccionar(itemId) {
    seleccionado = itemId;
    var barra = document.getElementById("barra-seleccion");
    if (itemId && ITEMS[itemId]) {
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
      if (window.matchMedia("(max-width: 900px)").matches) {
        document.getElementById("panel-catalogo").classList.add("plegado");
        document.getElementById("btn-plegar").textContent = "▸";
      }
    }
  }

  function colocar(cajaKey, entradaId, itemId) {
    asignacionesDe(cajaKey)[entradaId] = itemId;
    // La etiqueta que hubiera elegida era del material anterior
    olvidarEtiquetaColocada(cajaKey, entradaId);
    guardarEstado();
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

    // Material propio: lápiz para editarlo (solo en el catálogo)
    if (item.propio && !opciones.colocado) {
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

    if (item.conmutador && opciones.colocado) {
      var sel = document.createElement("select");
      sel.className = "chip-select";
      (item.opciones || []).forEach(function (op) {
        var o = document.createElement("option");
        o.textContent = op;
        sel.appendChild(o);
      });
      var esc = escenarioActual();
      var guardadoSel = esc && esc.conmutador && esc.conmutador[opciones.cajaKey + "/" + opciones.entradaId];
      if (guardadoSel) sel.value = guardadoSel;
      ["mousedown", "click", "dragstart"].forEach(function (ev) {
        sel.addEventListener(ev, function (e) { e.stopPropagation(); });
      });
      sel.addEventListener("change", function () {
        var e2 = escenarioActual();
        if (!e2.conmutador) e2.conmutador = {};
        e2.conmutador[opciones.cajaKey + "/" + opciones.entradaId] = sel.value;
        guardarEstado();
        renderResumen();
      });
      chip.appendChild(sel);
    }

    if (!opciones.colocado) {
      // Chip del catálogo: al pulsarlo queda seleccionado para colocar
      chip.addEventListener("click", function () {
        seleccionar(seleccionado === item.id ? null : item.id);
      });
    }

    if (opciones.colocado) {
      // Selector de tipo físico para ESTA colocación: el mismo A1 puede ir
      // con sacacorchos en una cirugía y con aguja en otra.
      var selEt = document.createElement("select");
      selEt.className = "chip-select chip-etiqueta";
      selEt.title = T("chip_etiqueta_tit");
      ETIQUETAS.forEach(function (et) {
        var o = document.createElement("option");
        o.value = et.id;
        o.textContent = campo(et, "nombre");
        selEt.appendChild(o);
      });
      if (etiqueta) selEt.value = etiqueta.id;
      ["mousedown", "click", "dragstart"].forEach(function (ev) {
        selEt.addEventListener(ev, function (e) { e.stopPropagation(); });
      });
      selEt.addEventListener("change", function () {
        fijarEtiquetaColocada(opciones.cajaKey, opciones.entradaId, selEt.value, item.id);
        guardarEstado();
        renderCajas();
        renderResumen();
      });
      chip.appendChild(selEt);

      var quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "chip-quitar";
      quitar.textContent = "✕";
      quitar.title = T("chip_quitar_tit");
      quitar.addEventListener("click", function (e) {
        e.stopPropagation();
        delete asignacionesDe(opciones.cajaKey)[opciones.entradaId];
        olvidarEtiquetaColocada(opciones.cajaKey, opciones.entradaId);
        guardarEstado();
        renderCajas();
        renderResumen();
      });
      chip.appendChild(quitar);
    }

    return chip;
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
      guardarEstado();
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
      guardarEstado();
      renderCajas();
      renderResumen();
    }
  });

  /* ---------------------------------------------------------------- *
   * Render: catálogo maestro
   * ---------------------------------------------------------------- */
  function renderCatalogo() {
    var cont = document.getElementById("catalogo-contenido");
    var filtro = (document.getElementById("catalogo-buscar").value || "").toLowerCase().trim();
    cont.innerHTML = "";

    CATALOGO.forEach(function (grupo) {
      var items = (grupo.items || []).filter(function (it) {
        if (!filtro) return true;
        return (campo(it, "nombre") + " " + campo(it, "nota") + " " + campo(grupo, "categoria") + " " + nombreEtiquetaDe(it, null)).toLowerCase().indexOf(filtro) !== -1;
      });
      if (!items.length) return;

      var bloque = document.createElement("div");
      bloque.className = "catalogo-grupo";
      var h = document.createElement("div");
      h.className = "grupo-titulo";
      h.textContent = campo(grupo, "categoria");
      bloque.appendChild(h);
      var fila = document.createElement("div");
      fila.className = "chip-fila";
      items.forEach(function (it) {
        fila.appendChild(crearChip(ITEMS[it.id], {}));
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
    return !!(sync.repo && sync.token);
  }

  function enQuirofano() {
    return document.body.classList.contains("modo-quirofano");
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
    var el = document.getElementById("sync-estado");
    var btn = document.getElementById("btn-sync");
    var estado = "ok";
    if (!syncActivo()) {
      el.textContent = T("sync_sin_conectar");
      estado = "off";
    } else if (conflicto) {
      el.textContent = T("sync_conflicto");
      estado = "error";
    } else if (subiendo) {
      el.textContent = T("sync_sincronizando");
    } else if (ultimoFallo) {
      el.textContent = T("sync_sin_subir");
      estado = "error";
    } else if (sync.pendiente) {
      el.textContent = T(enQuirofano() ? "sync_en_pausa" : "sync_guardando");
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
      version: 2,
      fecha: new Date().toISOString(),
      escenarios: escenarios,
      catalogo_usuario: catalogoUsuario,
      etiquetas_usuario: etiquetasUsuario,
      etiquetas_borradas: etiquetasBorradas,
      borrados: borrados,
      activo: activo
    };
  }

  function aplicarEstado(copia) {
    escenarios = copia.escenarios || {};
    catalogoUsuario = copia.catalogo_usuario || [];
    etiquetasUsuario = copia.etiquetas_usuario || [];
    etiquetasBorradas = copia.etiquetas_borradas || [];
    borrados = copia.borrados || [];
    activo = copia.activo && escenarios[copia.activo] ? copia.activo : Object.keys(escenarios)[0] || null;
    reconstruirEtiquetas();
    migrarMaterialALaEtiqueta();   // copias de la versión 1, sin etiquetas
    reconstruirCatalogo();
    traducirEscenarios();
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
      message: "Actualizar escenarios MIO/IONM",
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
    pintarEstadoSync();
    if (temporizador) clearTimeout(temporizador);
    // En quirófano no se toca la red: se sube al salir del modo
    if (enQuirofano()) return;
    temporizador = setTimeout(function () {
      temporizador = null;
      subirAuto();
    }, RETARDO_SUBIDA);
  }

  function subirAuto() {
    if (!syncActivo() || subiendo || conflicto || !sync.pendiente) return;
    if (navigator.onLine === false) { pintarEstadoSync(); return; }
    subiendo = true;
    pintarEstadoSync();
    leerRemoto()
      .then(function (remoto) {
        if (remoto.existe && sync.sha && remoto.sha !== sync.sha) {
          conflicto = true;
          return null;   // hay que decidir a mano cuál se queda
        }
        return enviarEstado(remoto.sha);
      })
      .catch(function (e) { ultimoFallo = e.message || T("sync_error_subir"); })
      .then(function () {
        subiendo = false;
        pintarEstadoSync();
      });
  }

  // Al abrir: si no hay nada local sin subir, se trae lo último sin preguntar
  function bajarAuto() {
    if (!syncActivo() || navigator.onLine === false) return;
    if (sync.pendiente) { subirAuto(); return; }
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
      });
  }

  // Al volver la conexión se reintenta lo que quedó pendiente
  window.addEventListener("online", function () {
    ultimoFallo = null;
    if (sync.pendiente) subirAuto();
  });

  // Cerrar la pestaña con algo sin subir: avisa antes de perderlo de vista
  window.addEventListener("beforeunload", function (e) {
    if (syncActivo() && sync.pendiente && !enQuirofano()) {
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
    document.getElementById("sync-repo").value = "";
    document.getElementById("sync-token").value = "";
    pintarEstadoSync();
    mensajeSync(T("sync_desconectado"));
  });

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
    document.getElementById("mat-nombre").focus();
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
    Object.keys(escenarios).forEach(function (eid) {
      var asig = escenarios[eid].asignaciones || {};
      Object.keys(asig).forEach(function (caja) {
        Object.keys(asig[caja]).forEach(function (ent) {
          if (asig[caja][ent] === editandoId) usos++;
        });
      });
      if ((escenarios[eid].extras || []).indexOf(editandoId) !== -1) usos++;
    });

    var msg = T("mat_borrar_conf", { nombre: campo(item, "nombre") });
    if (usos) msg += T("mat_borrar_usos", { n: usos });
    if (!confirm(msg)) return;

    catalogoUsuario = catalogoUsuario.filter(function (i) { return i.id !== editandoId; });
    Object.keys(escenarios).forEach(function (eid) {
      var asig = escenarios[eid].asignaciones || {};
      Object.keys(asig).forEach(function (caja) {
        Object.keys(asig[caja]).forEach(function (ent) {
          if (asig[caja][ent] !== editandoId) return;
          delete asig[caja][ent];
          // La etiqueta elegida para esa entrada se queda sin dueño
          if (escenarios[eid].etiquetas) delete escenarios[eid].etiquetas[caja + "/" + ent];
        });
      });
      if (escenarios[eid].extras) {
        escenarios[eid].extras = escenarios[eid].extras.filter(function (x) { return x !== editandoId; });
      }
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
    Object.keys(escenarios).forEach(function (eid) {
      var mapa = escenarios[eid].etiquetas || {};
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
    document.getElementById("et-borrar").hidden = !et;
    document.getElementById("et-error").hidden = true;
    refrescarPreviaEtiqueta();
    renderListaEtiquetas();
  }

  function abrirGestorEtiquetas(id) {
    cargarEtiquetaEnFormulario(id);
    if (!dlgEt.open) dlgEt.showModal();
    document.getElementById("et-nombre").focus();
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

    var datos = {
      id: editandoEtiqueta || idLibreEtiqueta(nombre),
      nombre: nombre,
      borde: document.getElementById("et-borde").value,
      color: document.getElementById("et-color").value,
      fondo: document.getElementById("et-fondo").value
    };

    var existente = etiquetasUsuario.filter(function (e) { return e.id === datos.id; })[0];
    if (existente) Object.assign(existente, datos);
    else etiquetasUsuario.push(datos);
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
    Object.keys(escenarios).forEach(function (eid) {
      var mapa = escenarios[eid].etiquetas;
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
    document.getElementById("et-nombre").focus();
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
   * Render: técnicas y perfiles
   * ---------------------------------------------------------------- */
  function renderTecnicas() {
    var cont = document.getElementById("tecnicas-contenido");
    cont.innerHTML = "";
    if (!escenarioActual()) return;
    var activas = tecnicasDe();

    TECNICAS.forEach(function (grupo) {
      var bloque = document.createElement("div");
      bloque.className = "tecnicas-grupo";
      var h = document.createElement("div");
      h.className = "grupo-titulo";
      h.textContent = campo(grupo, "grupo");
      bloque.appendChild(h);

      var fila = document.createElement("div");
      fila.className = "chip-fila";
      (grupo.items || []).forEach(function (t) {
        var chip = document.createElement("span");
        chip.className = "chip chip-extra" + (activas.indexOf(t.id) !== -1 ? " activo" : "");
        chip.textContent = campo(t, "nombre");
        var desc = campo(t, "descripcion");
        if (desc) chip.title = desc;
        chip.addEventListener("click", function () { alternarTecnica(t.id); });
        fila.appendChild(chip);
      });
      bloque.appendChild(fila);
      cont.appendChild(bloque);
    });
  }

  function renderPerfilSelect() {
    var sel = document.getElementById("perfil-select");
    sel.innerHTML = "";
    var vacio = document.createElement("option");
    vacio.value = "";
    vacio.textContent = T("perfil_elegir");
    sel.appendChild(vacio);
    PERFILES.forEach(function (p) {
      var o = document.createElement("option");
      o.value = p.id;
      o.textContent = campo(p, "nombre");
      sel.appendChild(o);
    });
  }

  document.getElementById("perfil-select").addEventListener("change", function (e) {
    var perfil = PERFILES.filter(function (p) { return p.id === e.target.value; })[0];
    e.target.value = "";
    if (!perfil || !escenarioActual()) return;
    if (!confirm(T("perfil_confirmar", { perfil: campo(perfil, "nombre") }))) return;
    escenarioActual().tecnicas = perfil.tecnicas.slice();
    if (campo(perfil, "nota")) escenarioActual().nota_perfil_id = perfil.id;
    guardarEstado();
    renderTecnicas();
    renderResumen();
  });

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
    slot.addEventListener("click", function (e) {
      if (!seleccionado) return;
      if (e.target.closest(".chip-quitar, .chip-select")) return;
      colocar(cajaKey, entrada.id, seleccionado);
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
      cons.appendChild(crearConector("rojo"));
      cons.appendChild(crearConector("negro"));
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

  function renderCajaFisica(cajaKey) {
    var info = infoCaja(cajaKey);
    var entradas = entradasDe(cajaKey);
    var numeradas = entradas.filter(function (e) { return !e.especial; });
    var especiales = entradas.filter(function (e) { return e.especial; });

    var card = document.createElement("div");
    card.className = "card caja-card";

    var cab = document.createElement("div");
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

    card.appendChild(cab);

    var box = document.createElement("div");
    box.className = "caja-fisica";
    if (info.conector === "anodal_catodal" || info.conector === "individual_2col") {
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

    if (especiales.length) {
      var esp = document.createElement("div");
      esp.className = "canales-especiales";
      especiales.forEach(function (ent) { esp.appendChild(crearFila(cajaKey, ent)); });
      box.appendChild(esp);
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
    if (!escenarioActual()) return;

    var grid = document.createElement("div");
    grid.className = "cajas-grid";
    Object.keys(CAJAS).forEach(function (key) {
      grid.appendChild(renderCajaFisica(key));
    });
    cont.appendChild(grid);
  }

  /* ---------------------------------------------------------------- *
   * Render: resumen de material  (el objetivo de la herramienta)
   * ---------------------------------------------------------------- */
  function renderResumen() {
    var cont = document.getElementById("resumen-contenido");
    cont.innerHTML = "";
    var esc = escenarioActual();
    if (!esc) {
      cont.innerHTML = '<p class="empty-hint"></p>';
      cont.firstChild.textContent = T("resumen_sin_esc");
      return;
    }

    var titulo = document.createElement("div");
    titulo.className = "resumen-titulo";
    titulo.innerHTML = "<strong></strong>";
    titulo.firstChild.textContent = campo(esc, "nombre");
    cont.appendChild(titulo);

    // Técnicas marcadas (o modalidades sueltas de escenarios antiguos)
    var etiquetasTec = tecnicasDe().map(function (id) {
      return TECS[id] ? campo(TECS[id], "nombre") : id;
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

    // Recuento
    var totalMaterial = {};
    var estiloPorTipo = {};   // nombre de etiqueta -> estilo, para el distintivo
    var cajasUsadas = [];
    var totalEntradas = 0;

    Object.keys(CAJAS).forEach(function (cajaKey) {
      var entradas = entradasDe(cajaKey);
      var asign = asignacionesDe(cajaKey);
      var detalle = [];
      entradas.forEach(function (ent) {
        var itemId = asign[ent.id];
        if (!itemId) return;
        var item = ITEMS[itemId];
        if (!item) return;
        var rotuloEntrada = ent.polo ? ent.etiqueta + " " + ent.polo : ent.etiqueta;
        var nombre = campo(item, "nombre");
        if (item.conmutador) {
          var sel = esc.conmutador && esc.conmutador[cajaKey + "/" + ent.id];
          if (sel) nombre += " → " + sel;
        }
        var override = etiquetaColocada(cajaKey, ent.id);
        var tipo = nombreEtiquetaDe(item, override);
        var estilo = estiloDe(item, override);
        if (!estiloPorTipo[tipo]) estiloPorTipo[tipo] = estilo;
        detalle.push({
          entrada: rotuloEntrada, nombre: nombre, color: item.color,
          tipo: tipo, estilo: estilo
        });
        // media_unidad: dos entradas que salen del mismo paquete (Erb1 + Erb2)
        totalMaterial[tipo] = (totalMaterial[tipo] || 0) + (item.media_unidad ? 0.5 : 1);
        totalEntradas++;
      });
      if (detalle.length) {
        cajasUsadas.push({
          key: cajaKey,
          nombre: infoCaja(cajaKey).nombre,
          usadas: detalle.length,
          total: entradas.length,
          detalle: detalle
        });
      }
    });

    var extras = extrasDe().map(function (id) { return ITEMS[id]; }).filter(Boolean);
    extras.forEach(function (item) {
      var tipo = nombreEtiquetaDe(item, null);
      if (!estiloPorTipo[tipo]) estiloPorTipo[tipo] = estiloDe(item, null);
      totalMaterial[tipo] = (totalMaterial[tipo] || 0) + 1;
    });

    if (!totalEntradas && !extras.length) {
      cont.insertAdjacentHTML("beforeend",
        '<p class="empty-hint">Escenario vacío. Arrastra material del catálogo a las entradas de las cajas.</p>');
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

    // Avisos
    var avisos = [];
    cajasUsadas.forEach(function (c) {
      if (c.usadas === c.total) avisos.push(T("aviso_caja_llena", { caja: c.nombre }));
    });
    // El perfil se guarda por id para poder traducir su nota; nota_perfil es
    // el texto suelto que guardaban los escenarios anteriores.
    if (esc.nota_perfil_id) {
      var perfilNota = PERFILES.filter(function (p) { return p.id === esc.nota_perfil_id; })[0];
      if (perfilNota) avisos.push(campo(perfilNota, "nombre") + ": " + campo(perfilNota, "nota"));
    } else if (esc.nota_perfil) {
      avisos.push(esc.nota_perfil);
    }
    if (campo(esc, "notas")) avisos.push(campo(esc, "notas"));
    if (campo(esc, "pendiente")) avisos.push(T("aviso_pendiente", { texto: campo(esc, "pendiente") }));

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
   * Selector de escenarios y acciones
   * ---------------------------------------------------------------- */
  function renderSelect() {
    var sel = document.getElementById("escenario-select");
    sel.innerHTML = "";
    Object.keys(escenarios).forEach(function (id) {
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = campo(escenarios[id], "nombre") || id;
      if (id === activo) opt.selected = true;
      sel.appendChild(opt);
    });
    if (!Object.keys(escenarios).length) {
      var vacio = document.createElement("option");
      vacio.textContent = T("sin_escenarios");
      sel.appendChild(vacio);
    }
  }

  function idDesdeNombre(nombre) {
    var base = nombre.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "escenario";
    var id = base;
    var n = 2;
    while (escenarios[id]) { id = base + "_" + n; n++; }
    return id;
  }

  function renderTodo() {
    renderSelect();
    renderTecnicas();
    renderResumen();
    renderCatalogo();
    renderCajas();
  }

  document.getElementById("escenario-select").addEventListener("change", function (e) {
    activo = e.target.value;
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-nuevo").addEventListener("click", function () {
    var nombre = prompt(T("esc_nuevo_prompt"), T("esc_nuevo_def"));
    if (!nombre) return;
    var id = idDesdeNombre(nombre);
    escenarios[id] = { nombre: nombre, modalidades: [], asignaciones: {} };
    activo = id;
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-duplicar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc) return;
    var nombre = prompt(T("esc_duplicar_prompt"), campo(esc, "nombre") + T("esc_copia_sufijo"));
    if (!nombre) return;
    var id = idDesdeNombre(nombre);
    escenarios[id] = clonar(esc);
    escenarios[id].nombre = nombre;
    activo = id;
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-renombrar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc) return;
    var nombre = prompt("Nuevo nombre:", esc.nombre);
    if (!nombre) return;
    esc.nombre = nombre;
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-vaciar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc) return;
    if (!confirm(T("esc_vaciar_conf", { nombre: campo(esc, "nombre") }))) return;
    esc.asignaciones = {};
    esc.conmutador = {};
    esc.etiquetas = {};
    esc.extras = [];
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-borrar").addEventListener("click", function () {
    var esc = escenarioActual();
    if (!esc) return;
    if (!confirm(T("esc_borrar_conf", { nombre: campo(esc, "nombre") }))) return;
    delete escenarios[activo];
    if (borrados.indexOf(activo) === -1) borrados.push(activo);
    activo = Object.keys(escenarios)[0] || null;
    guardarEstado();
    renderTodo();
  });

  document.getElementById("btn-restablecer").addEventListener("click", function () {
    if (!confirm(T("restablecer_conf"))) return;
    localStorage.removeItem(STORAGE_KEY);
    borrados = [];
    cargarEstado();
    renderTodo();
    avisoGuardado(T("restablecido"));
  });

  // Copia de seguridad completa: escenarios + catálogo propio, en un .json
  document.getElementById("btn-exportar").addEventListener("click", function () {
    var copia = {
      formato: "mio-ionm",
      version: 1,
      fecha: new Date().toISOString(),
      escenarios: escenarios,
      catalogo_usuario: catalogoUsuario,
      borrados: borrados,
      activo: activo
    };
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
      }))) return;

      // Mismo camino que la bajada de GitHub: así las etiquetas propias y
      // las copias antiguas sin etiquetas se tratan igual en los dos sitios.
      aplicarEstado(copia);
      avisoGuardado(T("importado"));
    };
    lector.readAsText(fichero);
    e.target.value = "";
  });

  document.getElementById("btn-imprimir").addEventListener("click", function () {
    window.print();
  });

  document.getElementById("catalogo-buscar").addEventListener("input", function () {
    renderCatalogo();
    seleccionar(seleccionado); // mantiene el resaltado tras filtrar
  });

  document.getElementById("bs-cancelar").addEventListener("click", function () {
    seleccionar(null);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") seleccionar(null);
  });

  // Modo quirófano: deja solo el montaje y el resumen, sin herramientas de edición
  var MODO_KEY = "mio_ionm_modo_quirofano";

  function aplicarModoQuirofano(activo) {
    document.body.classList.toggle("modo-quirofano", activo);
    var btn = document.getElementById("btn-quirofano");
    btn.classList.toggle("activo", activo);
    btn.textContent = T(activo ? "quirofano_salir" : "quirofano_entrar");
    try { localStorage.setItem(MODO_KEY, activo ? "1" : "0"); } catch (e) { /* sin persistencia */ }
    if (activo) seleccionar(null);
    // La subida automática se pausa en quirófano para no depender de la red
    // durante la cirugía; al salir se manda lo que se haya acumulado.
    if (!activo && sync.pendiente) programarSubida();
    pintarEstadoSync();
  }

  document.getElementById("btn-quirofano").addEventListener("click", function () {
    aplicarModoQuirofano(!document.body.classList.contains("modo-quirofano"));
  });

  document.getElementById("btn-plegar").addEventListener("click", function () {
    var panel = document.getElementById("panel-catalogo");
    panel.classList.toggle("plegado");
    this.textContent = panel.classList.contains("plegado") ? "▸" : "▾";
  });

  document.getElementById("btn-idioma").addEventListener("click", function () {
    aplicarIdioma(idioma === "es" ? "en" : "es", true);
  });

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
  cargarSync();
  pintarEstadoSync();
  renderPerfilSelect();
  renderTodo();
  try {
    aplicarModoQuirofano(localStorage.getItem(MODO_KEY) === "1");
  } catch (e) {
    aplicarModoQuirofano(false);
  }
  avisoGuardado(T(syncActivo() ? "guardado_nube" : "guardado_local"));
  // Traer lo último de GitHub al abrir, sin preguntar si no hay nada local
  // sin subir. Si lo hay, sube en vez de bajar.
  bajarAuto();
})();
