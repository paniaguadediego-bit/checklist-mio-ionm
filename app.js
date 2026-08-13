(function () {
  "use strict";

  var DATA = window.SURGERIES_DATA || {};
  var CAJAS = DATA.cajas_material || {};
  var CATALOGO_BASE = DATA.catalogo_material || [];
  var ETIQUETAS_BASE = DATA.etiquetas || [];
  var TECNICAS_BASE = DATA.tecnicas || [];
  var SERVICIOS_BASE = DATA.servicios || [];
  var INTERVENCIONES_BASE = DATA.intervenciones || [];
  var PERFILES_BASE = DATA.perfiles_procedimiento || [];
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

    /* --- Casos --- */
    btn_casos:           { es: "Casos", en: "Cases" },
    btn_casos_tit:       { es: "Registrar y consultar casos", en: "Record and review cases" },
    dlg_casos_titulo:    { es: "Mis casos", en: "My cases" },
    casos_guardar_montaje:{ es: "Guardar este montaje como caso", en: "Save this montage as a case" },
    casos_guardar_ay:    { es: "Crea el caso con las técnicas, el material, las cajas y los avisos que ya ha calculado la herramienta. No hay que teclear nada.",
                           en: "Creates the case with the techniques, material, boxes and warnings the tool has already worked out. Nothing to type." },
    casos_nuevo_cero:    { es: "Caso nuevo desde cero", en: "New case from scratch" },
    casos_nuevo_cero_ay: { es: "Para registrar una cirugía pasada que no pasó por el checklist.",
                           en: "To record a past surgery that never went through the checklist." },
    casos_filtro_estado: { es: "Estado", en: "Status" },
    casos_filtro_todos:  { es: "Todos", en: "All" },
    casos_filtro_desde:  { es: "Desde", en: "From" },
    casos_filtro_hasta:  { es: "Hasta", en: "To" },
    casos_vacio:         { es: "Todavía no hay ningún caso.", en: "No cases yet." },
    casos_sin_filtro:    { es: "Ningún caso con esos filtros.", en: "No cases match those filters." },
    casos_n:             { es: "{n} caso(s)", en: "{n} case(s)" },
    casos_sin_subir:     { es: "{n} sin subir", en: "{n} not uploaded" },
    caso_estado_preparado: { es: "Preparado", en: "Prepared" },
    caso_estado_cerrado: { es: "Cerrado", en: "Closed" },
    caso_sin_intervencion: { es: "— sin intervención —", en: "— no procedure —" },
    caso_pendiente_subir: { es: "Guardado aquí, pendiente de subir", en: "Saved here, waiting to upload" },

    /* --- Ficha del caso --- */
    dlg_caso_titulo:     { es: "Caso {id}", en: "Case {id}" },
    caso_cerrar_titulo:  { es: "Cierre rápido", en: "Quick close" },
    caso_ampliar:        { es: "Ampliar (opcional)", en: "More detail (optional)" },
    caso_g_traza:        { es: "Trazabilidad", en: "Traceability" },
    caso_g_paciente:     { es: "Paciente", en: "Patient" },
    caso_g_cirugia:      { es: "Cirugía", en: "Surgery" },
    caso_g_tecnicas:     { es: "Técnicas", en: "Techniques" },
    caso_g_material:     { es: "Material", en: "Material" },
    caso_g_anestesia:    { es: "Anestesia", en: "Anaesthesia" },
    caso_g_desarrollo:   { es: "Desarrollo", en: "Course" },
    caso_g_incidencias:  { es: "Incidencias técnicas", en: "Technical incidents" },
    caso_g_formacion:    { es: "Formación", en: "Training" },
    caso_volver:         { es: "Volver a la lista", en: "Back to the list" },
    caso_btn_cerrar_caso:{ es: "Cerrar caso", en: "Close case" },
    caso_reabrir:        { es: "Marcar como preparado", en: "Mark as prepared" },
    caso_borrar:         { es: "Borrar caso", en: "Delete case" },
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
    caso_intervencion_id:{ es: "Intervención", en: "Procedure" },
    caso_tecnicas_realizadas: { es: "Técnicas realizadas", en: "Techniques performed" },
    caso_tecnicas_ay:    { es: "Vienen marcadas las que planificaste. Marca o desmarca lo que cambió.",
                           en: "The ones you planned come pre-selected. Tick or untick what changed." },
    caso_alerta:         { es: "Hubo alerta", en: "There was an alert" },
    caso_rol:            { es: "Mi papel", en: "My role" },
    caso_notas:          { es: "Notas", en: "Notes" },
    caso_ID_Caso:        { es: "Identificador", en: "Identifier" },
    caso_estado:         { es: "Estado", en: "Status" },
    caso_centro:         { es: "Centro", en: "Hospital" },
    caso_hora_inicio:    { es: "Hora de inicio", en: "Start time" },
    caso_hora_fin:       { es: "Hora de fin", en: "End time" },
    caso_escenario_nombre: { es: "Escenario usado", en: "Scenario used" },
    caso_antecedentes_relevantes: { es: "Antecedentes relevantes", en: "Relevant history" },
    caso_region_nivel:   { es: "Región / nivel", en: "Region / level" },
    caso_diagnostico:    { es: "Diagnóstico", en: "Diagnosis" },
    caso_posicion:       { es: "Posición", en: "Position" },
    caso_pares_craneales_cuales: { es: "Pares craneales monitorizados", en: "Cranial nerves monitored" },
    caso_cambios_respecto_al_plan: { es: "Cambios respecto al plan", en: "Changes from the plan" },
    caso_material_real:  { es: "Material realmente usado", en: "Material actually used" },
    caso_tipo_anestesia: { es: "Tipo de anestesia", en: "Type of anaesthesia" },
    caso_tipo_anestesia_detalle: { es: "Detalle", en: "Detail" },
    caso_tipo_anestesia_detalle_ay: { es: "Qué lleva exactamente, o qué fue si elegiste «Otra». Por ejemplo: «TIVA + remifentanilo, sin relajante».",
                           en: "What it actually includes, or what it was if you chose “Other”. E.g.: “TIVA + remifentanil, no relaxant”." },
    caso_relajante_nm:   { es: "Relajante neuromuscular", en: "Neuromuscular blocker" },
    caso_relajante_cual: { es: "¿Cuál?", en: "Which one?" },
    caso_tof_monitorizado: { es: "TOF monitorizado", en: "TOF monitored" },
    caso_incidencias_anestesicas: { es: "Incidencias anestésicas", en: "Anaesthetic incidents" },
    caso_basales_obtenidas: { es: "Basales obtenidas", en: "Baselines obtained" },
    caso_basales_obtenidas_ay: { es: "Qué salió en cada técnica, no solo si sí o no. Por ejemplo: «t-PESS normales al inicio; t-PEM hemicuerpo izquierdo no evocables».",
                           en: "What came out per technique, not just yes/no. E.g.: “t-SSEP normal at baseline; t-MEP left hemibody not evocable”." },
    caso_tipo_alerta:    { es: "Tipo de alerta", en: "Type of alert" },
    caso_criterio_alarma:{ es: "Criterio de alarma", en: "Alarm criterion" },
    caso_medida_correctora: { es: "Medida correctora", en: "Corrective action" },
    caso_recuperacion_senal: { es: "Recuperación de la señal", en: "Signal recovery" },
    caso_deficit_postoperatorio: { es: "Déficit postoperatorio", en: "Postoperative deficit" },
    caso_concordancia:   { es: "Concordancia", en: "Concordance" },
    caso_incidencias_tecnicas: { es: "Incidencias técnicas", en: "Technical incidents" },
    caso_equipo:         { es: "Equipo", en: "Equipment" },
    caso_supervisor:     { es: "Supervisor", en: "Supervisor" },
    caso_dificultad_1a5: { es: "Dificultad (1 a 5)", en: "Difficulty (1 to 5)" },
    caso_aprendizaje_clave: { es: "Aprendizaje clave", en: "Key learning" },
    caso_caso_destacado: { es: "Caso destacado", en: "Notable case" },

    /* Valores de los desplegables del caso */
    opc_vacio:           { es: "— sin especificar —", en: "— not specified —" },
    opc_sexo_mujer:      { es: "Mujer", en: "Female" },
    opc_sexo_hombre:     { es: "Hombre", en: "Male" },
    opc_sexo_otro:       { es: "Otro", en: "Other" },
    opc_rol_observo:     { es: "Observo", en: "Observing" },
    opc_rol_supervisado: { es: "Con supervisión", en: "Supervised" },
    opc_rol_autonomo:    { es: "Autónomo", en: "Independent" },
    opc_estado_preparado:{ es: "Preparado", en: "Prepared" },
    opc_estado_cerrado:  { es: "Cerrado", en: "Closed" },
    opc_sino_si:         { es: "Sí", en: "Yes" },
    opc_sino_no:         { es: "No", en: "No" },
    // "Solo inducción" va primero en OPCIONES.relajante: es la más habitual
    opc_relajante_induccion: { es: "Solo en la inducción", en: "Induction only" },
    opc_relajante_si:    { es: "Sí", en: "Yes" },
    opc_relajante_no:    { es: "No", en: "No" },
    opc_anestesia_tiva:  { es: "TIVA", en: "TIVA" },
    opc_anestesia_balanceada: { es: "Balanceada", en: "Balanced" },
    opc_anestesia_otra:  { es: "Otra", en: "Other" },
    opc_recuperacion_completa: { es: "Completa", en: "Complete" },
    opc_recuperacion_parcial: { es: "Parcial", en: "Partial" },
    opc_recuperacion_no: { es: "No hubo", en: "None" },
    opc_recuperacion_na: { es: "No procede", en: "Not applicable" },
    opc_concordancia_VP: { es: "VP — verdadero positivo", en: "TP — true positive" },
    opc_concordancia_FP: { es: "FP — falso positivo", en: "FP — false positive" },
    opc_concordancia_VN: { es: "VN — verdadero negativo", en: "TN — true negative" },
    opc_concordancia_FN: { es: "FN — falso negativo", en: "FN — false negative" },
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
  var CATALOGOS = ["tecnicas", "servicios", "intervenciones", "perfiles"];
  var GRUPOS_TECNICA = ["monitorizacion", "mapeo"];

  // nombre -> { version, actualizado_en, propios[], orden[], borrados[] }
  var catalogos = {};

  var TECNICAS = [], TECS = {};
  var SERVICIOS = [], SERV = {};
  var INTERVENCIONES = [], INTERV = {};
  var PERFILES = [], PERF = {};

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
                  intervenciones: INTERVENCIONES, perfiles: PERFILES }[nombre];
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
    // Un ítem colocado no puede estar también en otra entrada: se
    // deselecciona solo en vez de quedarse listo para colocarlo otra vez.
    seleccionar(null);
    // En móvil, seleccionar() plegó el catálogo para dejar ver las cajas;
    // al terminar esta colocación se vuelve a desplegar solo, para elegir
    // el siguiente ítem sin tener que desplegarlo a mano cada vez.
    if (window.matchMedia("(max-width: 900px)").matches) {
      document.getElementById("panel-catalogo").classList.remove("plegado");
      document.getElementById("btn-plegar").textContent = "▾";
    }
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

    if (!opciones.colocado) {
      // Chip del catálogo: al pulsarlo queda seleccionado para colocar
      chip.addEventListener("click", function () {
        seleccionar(seleccionado === item.id ? null : item.id);
      });
    }

    if (opciones.colocado) {
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
    } else if (sync.pendiente || casosPendientes().length || borradosPendientes().length) {
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
      catalogos: catalogos,
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
    // Una copia anterior a los catálogos editables no trae el bloque: se
    // queda con los de fábrica en lugar de dejarlo todo vacío.
    reiniciarCatalogos();
    aplicarCatalogosGuardados(copia.catalogos);
    reconstruirEtiquetas();
    migrarMaterialALaEtiqueta();   // copias de la versión 1, sin etiquetas
    reconstruirCatalogo();
    reconstruirCatalogos();
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
    programarEnvio();
  }

  /* Arranca la cuenta atrás sin marcar estado.json como pendiente. Lo usan
     los casos, que son archivos aparte y no tienen por qué obligar a
     reescribir el estado entero. */
  function programarEnvio() {
    if (!syncActivo()) return;
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
    if (!syncActivo() || subiendo) return;
    if (!sync.pendiente && !casosPendientes().length && !borradosPendientes().length) return;
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
    if (sync.pendiente) { subirAuto(); bajarCasos(); return; }
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
      });
  }

  // Al volver la conexión se reintenta lo que quedó pendiente
  window.addEventListener("online", function () {
    ultimoFallo = null;
    if (sync.pendiente || casosPendientes().length || borradosPendientes().length) subirAuto();
    bajarCasos();
  });

  // Cerrar la pestaña con algo sin subir: avisa antes de perderlo de vista
  window.addEventListener("beforeunload", function (e) {
    if (syncActivo() && (sync.pendiente || casosPendientes().length || borradosPendientes().length) && !enQuirofano()) {
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

  function cargarCasos() {
    casos = {}; casosSha = {}; casosSinSubir = {}; casosBorrados = {};
    try {
      var g = JSON.parse(localStorage.getItem(CASOS_KEY) || "null");
      if (g) {
        casos = g.casos || {};
        casosSha = g.sha || {};
        casosSinSubir = g.sin_subir || {};
        casosBorrados = g.borrados || {};
      }
    } catch (e) { /* sin casos guardados o ilegibles */ }
  }

  function guardarCasos() {
    try {
      localStorage.setItem(CASOS_KEY, JSON.stringify({
        casos: casos, sha: casosSha, sin_subir: casosSinSubir, borrados: casosBorrados
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
    delete casos[uid];
    delete casosSinSubir[uid];
    if (casosSha[uid]) casosBorrados[uid] = casosSha[uid];
    delete casosSha[uid];
    guardarCasos();
    programarEnvio();
    pintarEstadoSync();
  }

  /* Guarda un caso en local y lo deja listo para subir. En quirófano se
     queda esperando, igual que el resto: durante la cirugía no se toca la
     red. Al salir del modo se manda. */
  function guardarCaso(caso, esNuevo) {
    if (!esNuevo) caso.editado_en = (caso.editado_en || []).concat(new Date().toISOString());
    casos[caso.caso_uid] = caso;
    casosSinSubir[caso.caso_uid] = true;
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
      estado: "preparado",
      fecha: fecha,
      centro: centroPorDefecto(),
      hora_inicio: "", hora_fin: "",
      escenario_nombre: "", perfil: "",
      edad: "", sexo: "", antecedentes_relevantes: "",
      intervencion_id: "", servicio_id: "", region_nivel: "", diagnostico: "", posicion: "",
      tecnicas_realizadas: [], pares_craneales_cuales: "", cambios_respecto_al_plan: "",
      material_previsto: {}, material_real: {},
      montaje: [], n_cajas: 0, n_canales_ocupados: 0, avisos_preparacion: [],
      tipo_anestesia: "", tipo_anestesia_detalle: "", relajante_nm: "", relajante_cual: "",
      tof_monitorizado: "", incidencias_anestesicas: "",
      basales_obtenidas: "", alerta: false, tipo_alerta: "", criterio_alarma: "",
      medida_correctora: "", recuperacion_senal: "",
      deficit_postoperatorio: "", concordancia: "",
      incidencias_tecnicas: "", equipo: "",
      rol: "", supervisor: "", dificultad_1a5: "", aprendizaje_clave: "", caso_destacado: false,
      notas: "",
      version_esquema: VERSION_ESQUEMA,
      guardado_en: new Date().toISOString(),
      editado_en: []
    };
  }

  /* Caso a partir del escenario montado. Todo lo que la herramienta ya sabe
     -técnicas, material, cajas, montaje y avisos- entra solo: no se teclea
     nada de esto. */
  function casoDesdeEscenario() {
    var esc = escenarioActual();
    var caso = casoVacio();
    if (!esc) return caso;
    var res = calcularResumen(esc);
    caso.escenario_nombre = campo(esc, "nombre");
    caso.perfil = esc.nota_perfil_id || "";
    caso.tecnicas_realizadas = res.tecnicas.slice();
    caso.material_previsto = materialRedondeado(res.material);
    caso.material_real = materialRedondeado(res.material);
    caso.n_cajas = res.cajas.length;
    caso.n_canales_ocupados = res.entradas;
    caso.avisos_preparacion = res.avisos.slice();
    // Instantánea del montaje: se guarda tal cual estaba, con los textos ya
    // resueltos, para que un caso antiguo se siga leyendo aunque el catálogo
    // de material cambie después.
    caso.montaje = res.cajas.map(function (c) {
      return {
        caja: c.key, nombre: c.nombre, usadas: c.usadas, total: c.total,
        entradas: c.detalle.map(function (d) {
          return { entrada: d.entrada, item: d.item, nombre: d.nombre, tipo: d.tipo };
        })
      };
    });
    // La intervención se propone por el nombre del escenario, si coincide
    var porNombre = INTERVENCIONES.filter(function (i) {
      return (campo(i, "nombre") || "").toLowerCase() === (caso.escenario_nombre || "").toLowerCase();
    })[0];
    if (porNombre) {
      caso.intervencion_id = porNombre.id;
      caso.servicio_id = porNombre.servicio || "";
    }
    return caso;
  }

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

  function subirCaso(uid, reintento) {
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
      // 409/422: el archivo cambió desde otro dispositivo. Se relee el sha y
      // se reintenta una vez: lo que acabas de escribir aquí es lo más nuevo.
      if ((resp.status === 409 || resp.status === 422) && !reintento) {
        return fetch(urlCaso(uid), { headers: cabeceras(), cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (json) {
            casosSha[uid] = json ? json.sha : null;
            return subirCaso(uid, true);
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
          delete casos[uid];
          delete casosSha[uid];
        });

        var quedan = (listado || []).filter(function (f) {
          if (f.type !== "file" || !/\.json$/.test(f.name)) return false;
          var uid = f.name.replace(/\.json$/, "");
          if (casosSinSubir[uid]) return false;
          // Pendiente de borrar en este dispositivo: no se vuelve a bajar
          // aunque el listado remoto todavía lo tenga -el borrado no ha
          // llegado allí todavía-, o reaparecería solo.
          if (casosBorrados[uid]) return false;
          return casosSha[uid] !== f.sha;
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
              });
          });
        }, Promise.resolve()).then(function () {
          if (quedan.length || yaNoExisten.length) {
            guardarCasos();
            if (dlgCasos && dlgCasos.open) renderListaCasos();
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
   * Casos: interfaz
   *
   * Dos ventanas: el listado ("Mis casos") y la ficha. La ficha enseña
   * arriba el cierre rápido -lo que se rellena siempre- y esconde el resto
   * en un bloque plegado, para poder cerrar un caso desde el móvil sin
   * bajar por una pantalla infinita.
   * ---------------------------------------------------------------- */
  var dlgCasos = document.getElementById("dlg-casos");
  var dlgCaso = document.getElementById("dlg-caso");
  var casoAbierto = null;      // copia de trabajo del caso que se edita
  var casoEsNuevo = false;
  var camposCaso = {};         // clave -> control del formulario

  var OPCIONES = {
    sexo: ["mujer", "hombre", "otro"],
    rol: ["observo", "supervisado", "autonomo"],
    estado: ["preparado", "cerrado"],
    sino: ["si", "no"],
    // "Solo inducción" primero: es lo más habitual, para no obligar a
    // desplazarse hasta el final del desplegable en el caso típico.
    relajante: ["induccion", "si", "no"],
    anestesia: ["tiva", "balanceada", "otra"],
    recuperacion: ["completa", "parcial", "no", "na"],
    concordancia: ["VP", "FP", "VN", "FN"],
    dificultad: ["1", "2", "3", "4", "5"]
  };

  // Cierre rápido: lo que se rellena siempre. Objetivo, menos de 3 minutos.
  var CAMPOS_RAPIDO = [
    { c: "fecha", t: "date", ay: "caso_fecha_ay" },
    { c: "nombre_caso", t: "text", ay: "caso_nombre_caso_ay" },
    { c: "edad", t: "num" },
    { c: "sexo", t: "sel", o: "sexo" },
    { c: "servicio_id", t: "cat", cat: "servicios" },
    { c: "intervencion_id", t: "cat", cat: "intervenciones" },
    { c: "tecnicas_realizadas", t: "tecnicas", ay: "caso_tecnicas_ay" },
    { c: "alerta", t: "check" },
    { c: "rol", t: "sel", o: "rol" },
    { c: "notas", t: "area" }
  ];

  var CAMPOS_AMPLIAR = [
    { g: "traza", c: "ID_Caso", t: "ro" },
    { g: "traza", c: "estado", t: "sel", o: "estado" },
    { g: "traza", c: "centro", t: "text" },
    { g: "traza", c: "hora_inicio", t: "time" },
    { g: "traza", c: "hora_fin", t: "time" },
    { g: "traza", c: "escenario_nombre", t: "ro" },
    { g: "paciente", c: "antecedentes_relevantes", t: "area" },
    { g: "cirugia", c: "region_nivel", t: "text" },
    { g: "cirugia", c: "diagnostico", t: "text" },
    { g: "cirugia", c: "posicion", t: "text" },
    { g: "tecnicas", c: "pares_craneales_cuales", t: "text" },
    { g: "tecnicas", c: "cambios_respecto_al_plan", t: "area" },
    { g: "material", c: "material_real", t: "material", ay: "caso_material_real_ay" },
    { g: "anestesia", c: "tipo_anestesia", t: "sel", o: "anestesia" },
    { g: "anestesia", c: "tipo_anestesia_detalle", t: "text", ay: "caso_tipo_anestesia_detalle_ay" },
    { g: "anestesia", c: "relajante_nm", t: "sel", o: "relajante" },
    { g: "anestesia", c: "relajante_cual", t: "text" },
    { g: "anestesia", c: "tof_monitorizado", t: "sel", o: "sino" },
    { g: "anestesia", c: "incidencias_anestesicas", t: "area" },
    // Texto libre y no sí/no/parciales: las basales se intentan siempre, lo
    // que varía es qué salió en cada técnica, y eso no cabe en tres opciones.
    { g: "desarrollo", c: "basales_obtenidas", t: "area", ay: "caso_basales_obtenidas_ay" },
    { g: "desarrollo", c: "tipo_alerta", t: "text" },
    { g: "desarrollo", c: "criterio_alarma", t: "text" },
    { g: "desarrollo", c: "medida_correctora", t: "area" },
    { g: "desarrollo", c: "recuperacion_senal", t: "sel", o: "recuperacion" },
    { g: "desarrollo", c: "deficit_postoperatorio", t: "text" },
    { g: "desarrollo", c: "concordancia", t: "sel", o: "concordancia" },
    { g: "incidencias", c: "incidencias_tecnicas", t: "area" },
    { g: "incidencias", c: "equipo", t: "text" },
    { g: "formacion", c: "supervisor", t: "text" },
    { g: "formacion", c: "dificultad_1a5", t: "sel", o: "dificultad" },
    { g: "formacion", c: "aprendizaje_clave", t: "area" },
    { g: "formacion", c: "caso_destacado", t: "check" }
  ];

  function opcionTexto(grupo, valor) {
    var clave = "opc_" + grupo + "_" + valor;
    var t = T(clave);
    return t === clave ? valor : t;
  }

  /* Construye un campo del formulario y deja el control en camposCaso.
     Devuelve el bloque .campo listo para colgar. */
  function campoCaso(def, valor) {
    var div = document.createElement("div");
    div.className = "campo";
    var control;

    if (def.t === "check") {
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

    var lab2 = document.createElement("label");
    lab2.textContent = T("caso_" + def.c);
    lab2.setAttribute("for", "caso-f-" + def.c);
    div.appendChild(lab2);

    if (def.t === "tecnicas") {
      // Mismos chips que en la tarjeta de técnicas: una sola forma de marcar
      var elegidas = (valor || []).slice();
      camposCaso[def.c] = elegidas;
      var fila = document.createElement("div");
      fila.className = "chip-fila";
      // Se ofrecen las activas, más las que ya tuviera el caso aunque estén
      // desactivadas: si no, no habría manera de quitarlas.
      TECNICAS.filter(function (t) {
        return t.activa !== false || elegidas.indexOf(t.id) !== -1;
      }).forEach(function (t) {
        var chip = document.createElement("span");
        chip.className = "chip chip-extra" + (elegidas.indexOf(t.id) !== -1 ? " activo" : "") +
          (t.activa === false ? " desactivada" : "");
        chip.textContent = campo(t, "etiqueta");
        chip.addEventListener("click", function () {
          var i = elegidas.indexOf(t.id);
          if (i === -1) elegidas.push(t.id); else elegidas.splice(i, 1);
          chip.classList.toggle("activo", i === -1);
        });
        fila.appendChild(chip);
      });
      div.appendChild(fila);
      if (def.ay) div.appendChild(ayudaCampo(def.ay));
      return div;
    }

    if (def.t === "material") {
      // Mapa tipo -> cantidad, con una casilla por tipo
      var mapa = Object.assign({}, valor || {});
      camposCaso[def.c] = mapa;
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
      div.appendChild(tabla);
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
      }
      control.value = valor == null ? "" : String(valor);
    } else if (def.t === "area") {
      control = document.createElement("textarea");
      control.rows = 2;
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
    return div;
  }

  function ayudaCampo(clave) {
    var s = document.createElement("small");
    s.textContent = T(clave);
    return s;
  }

  function renderFichaCaso() {
    camposCaso = {};
    var c = casoAbierto;
    document.getElementById("caso-titulo").textContent =
      T("dlg_caso_titulo", { id: c.ID_Caso || "" }) + (c.nombre_caso ? " — " + c.nombre_caso : "");

    var rapido = document.getElementById("caso-rapido");
    rapido.innerHTML = "";
    CAMPOS_RAPIDO.forEach(function (def) {
      rapido.appendChild(campoCaso(def, c[def.c]));
    });

    var ampliar = document.getElementById("caso-ampliar-campos");
    ampliar.innerHTML = "";
    var grupoActual = null;
    CAMPOS_AMPLIAR.forEach(function (def) {
      if (def.g !== grupoActual) {
        grupoActual = def.g;
        var h = document.createElement("h4");
        h.textContent = T("caso_g_" + def.g);
        ampliar.appendChild(h);
        if (def.g === "material") {
          var res = document.createElement("p");
          res.className = "caso-resumen-linea";
          res.textContent = c.n_cajas
            ? T("caso_montaje_res", { cajas: c.n_cajas, canales: c.n_canales_ocupados })
            : T("caso_sin_montaje");
          ampliar.appendChild(res);
        }
      }
      ampliar.appendChild(campoCaso(def, c[def.c]));
    });

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

    document.getElementById("caso-btn-cerrar-caso").textContent =
      T(c.estado === "cerrado" ? "caso_reabrir" : "caso_btn_cerrar_caso");
    // Un caso que todavía no se ha guardado ni una vez no existe en "casos":
    // no hay nada que borrar hasta el primer "Guardar".
    document.getElementById("caso-borrar").hidden = casoEsNuevo;
    document.getElementById("caso-error").hidden = true;
  }

  function leerFichaCaso() {
    var c = casoAbierto;
    CAMPOS_RAPIDO.concat(CAMPOS_AMPLIAR).forEach(function (def) {
      var control = camposCaso[def.c];
      if (control === undefined) return;
      if (def.t === "tecnicas") { c[def.c] = control.slice(); return; }
      if (def.t === "material") { c[def.c] = Object.assign({}, control); return; }
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
    casoAbierto = clonar(casos[uid]);
    if (dlgCasos.open) dlgCasos.close();
    renderFichaCaso();
    dlgCaso.showModal();
  }

  function abrirCasoNuevo(caso) {
    casoEsNuevo = true;
    casoAbierto = caso;
    if (dlgCasos.open) dlgCasos.close();
    renderFichaCaso();
    dlgCaso.showModal();
  }

  function guardarFicha(cerrar) {
    var c = leerFichaCaso();
    if (!c.fecha) {
      var err = document.getElementById("caso-error");
      err.textContent = T("caso_falta_fecha");
      err.hidden = false;
      return false;
    }
    if (cerrar) c.estado = c.estado === "cerrado" ? "preparado" : "cerrado";
    recordarCentro(c.centro);
    guardarCaso(c, casoEsNuevo);
    casoEsNuevo = false;
    casoAbierto = clonar(casos[c.caso_uid]);
    avisoGuardado(T("caso_guardado"));
    return true;
  }

  function renderListaCasos() {
    var cont = document.getElementById("casos-lista");
    cont.innerHTML = "";
    var fEstado = document.getElementById("casos-estado").value;
    var fDesde = document.getElementById("casos-desde").value;
    var fHasta = document.getElementById("casos-hasta").value;

    var lista = Object.keys(casos).map(function (uid) { return casos[uid]; })
      .filter(function (c) {
        if (fEstado && c.estado !== fEstado) return false;
        if (fDesde && (c.fecha || "") < fDesde) return false;
        if (fHasta && (c.fecha || "") > fHasta) return false;
        return true;
      })
      // Por fecha de cirugía, lo más reciente primero
      .sort(function (a, b) { return (b.fecha || "").localeCompare(a.fecha || ""); });

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
      var id = document.createElement("b");
      id.textContent = c.ID_Caso || "—";
      var fecha = document.createElement("span");
      fecha.className = "caso-fila-fecha";
      fecha.textContent = c.fecha || "";
      cab.appendChild(id);
      cab.appendChild(fecha);
      fila.appendChild(cab);

      var det = document.createElement("span");
      det.className = "caso-fila-det";
      // El nombre que le hayas puesto manda sobre la intervención resuelta:
      // es justo lo que pediste para reconocer el caso de un vistazo.
      var interv = INTERV[c.intervencion_id];
      det.textContent = c.nombre_caso || (interv ? campo(interv, "nombre")
        : (c.escenario_nombre || T("caso_sin_intervencion")));
      fila.appendChild(det);

      var pie = document.createElement("span");
      pie.className = "caso-fila-pie";
      var et = document.createElement("span");
      et.className = "caso-etiqueta";
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
    document.getElementById("casos-guardar-montaje").disabled = !escenarioActual();
    renderListaCasos();
    dlgCasos.showModal();
  }

  document.getElementById("btn-casos").addEventListener("click", abrirListaCasos);
  document.getElementById("casos-cerrar").addEventListener("click", function () { dlgCasos.close(); });
  ["casos-estado", "casos-desde", "casos-hasta"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", renderListaCasos);
  });

  document.getElementById("casos-guardar-montaje").addEventListener("click", function () {
    abrirCasoNuevo(casoDesdeEscenario());
  });
  document.getElementById("casos-nuevo-cero").addEventListener("click", function () {
    // Retrospectivo: nace cerrado y sin material ni montaje, porque no hubo
    var c = casoVacio();
    c.estado = "cerrado";
    abrirCasoNuevo(c);
  });

  document.getElementById("caso-volver").addEventListener("click", function () {
    dlgCaso.close();
    abrirListaCasos();
  });
  document.getElementById("caso-borrar").addEventListener("click", function () {
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
  document.getElementById("caso-btn-cerrar-caso").addEventListener("click", function () {
    if (guardarFicha(true)) { dlgCaso.close(); abrirListaCasos(); }
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
  var PREFIJO_ID = { tecnicas: "t_", servicios: "s_", intervenciones: "i_", perfiles: "p_" };

  function catLista() {
    return { tecnicas: TECNICAS, servicios: SERVICIOS,
             intervenciones: INTERVENCIONES, perfiles: PERFILES }[catPestana];
  }

  function catIndice() {
    return { tecnicas: TECS, servicios: SERV,
             intervenciones: INTERV, perfiles: PERF }[catPestana];
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
        chip.textContent = campo(t, "etiqueta");
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
                   servicios: "cat_intro_serv", perfiles: "cat_intro_perfiles" };
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
        chip.textContent = campo(t, "etiqueta");
        var desc = campo(t, "descripcion");
        if (t.activa === false) desc = T("tec_desactivada") + (desc ? " · " + desc : "");
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
    activos(PERFILES).forEach(function (p) {
      var o = document.createElement("option");
      o.value = p.id;
      o.textContent = campo(p, "nombre");
      sel.appendChild(o);
    });
  }

  // El selector de perfil vive dentro del <summary> de la tarjeta de
  // técnicas: sin esto, cualquier clic para abrirlo también plegaría o
  // desplegaría la tarjeta entera, porque un <summary> reacciona a
  // cualquier clic dentro de él.
  ["mousedown", "click"].forEach(function (ev) {
    document.getElementById("perfil-select").addEventListener(ev, function (e) { e.stopPropagation(); });
  });

  document.getElementById("perfil-select").addEventListener("change", function (e) {
    var perfil = PERF[e.target.value];
    e.target.value = "";
    if (!perfil || !escenarioActual()) return;
    if (!confirm(T("perfil_confirmar", { perfil: campo(perfil, "nombre") }))) return;
    escenarioActual().tecnicas = (perfil.tecnicas || []).slice();
    // Siempre se apunta el perfil aplicado, tenga nota o no: si solo se
    // guardara cuando la hay, aplicar un perfil sin nota dejaría en los
    // avisos la nota del perfil anterior.
    escenarioActual().nota_perfil_id = perfil.id;
    delete escenarioActual().nota_perfil;
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
      if (e.target.closest(".chip-quitar")) return;
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
  function calcularResumen(esc) {
    var res = { tecnicas: [], material: {}, estilos: {}, cajas: [],
                extras: [], entradas: 0, avisos: [] };
    if (!esc) return res;

    res.tecnicas = (esc.tecnicas || []).slice();

    Object.keys(CAJAS).forEach(function (cajaKey) {
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
        detalle.push({
          entrada: rotuloEntrada, nombre: nombre, color: item.color,
          tipo: tipo, estilo: estilo, item: item.id
        });
        // media_unidad: dos entradas que salen del mismo paquete (Erb1 + Erb2)
        res.material[tipo] = (res.material[tipo] || 0) + (item.media_unidad ? 0.5 : 1);
        res.entradas++;
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
      res.material[tipo] = (res.material[tipo] || 0) + 1;
    });

    res.cajas.forEach(function (c) {
      if (c.usadas === c.total) res.avisos.push(T("aviso_caja_llena", { caja: c.nombre }));
    });
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
    renderPerfilSelect();
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
    var nombre = prompt(T("esc_renombrar"), campo(esc, "nombre"));
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

  // Copia de seguridad completa. Usa el mismo objeto que se sube a GitHub
  // (estadoActual), para que el .json exportado y el remoto sean idénticos:
  // si aquí se armara la copia a mano, sería fácil olvidar un bloque nuevo y
  // la copia perdería datos en silencio.
  document.getElementById("btn-exportar").addEventListener("click", function () {
    var copia = estadoActual();
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

  // El resumen es un <details> plegable: si estuviera cerrado al imprimir
  // (con el botón o con Ctrl/Cmd+P), no saldría nada en el papel. Se abre a
  // la fuerza justo antes de imprimir y se devuelve a como estaba después.
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
    if (activo) {
      seleccionar(null);
      // El resumen es lo que se consulta durante la cirugía: si se hubiera
      // quedado plegado de antes, entrar en quirófano no puede dejarlo
      // escondido.
      document.getElementById("resumen").open = true;
    }
    // La subida automática se pausa en quirófano para no depender de la red
    // durante la cirugía; al salir se manda lo que se haya acumulado, tanto
    // el estado como los casos guardados o borrados mientras tanto.
    if (!activo && (sync.pendiente || casosPendientes().length || borradosPendientes().length)) programarEnvio();
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
  cargarCasos();
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
