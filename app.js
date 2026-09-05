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
  // Quién usa la herramienta. Va VACÍO de fábrica y se rellena desde la app:
  // los nombres de personas reales no se escriben en este repositorio, que es
  // público. Creados desde la interfaz viven en estado.json, que es privado.
  var USUARIOS_BASE = [];
  // Solo para la ventana docente: qué músculo depende de qué raíces
  var MIOTOMAS = DATA.miotomas || [];
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
    btn_exportar_casos:  { es: "Exportar casos (PDF)", en: "Export cases (PDF)" },
    btn_exportar_casos_tit: { es: "Abre un informe imprimible de todos los casos -usa \"Guardar como PDF\" en el diálogo de impresión del navegador. En pruebas: dilo si algo no sale bien.",
                           en: "Opens a printable report of all cases -use \"Save as PDF\" in the browser's print dialog. Still being tested: let me know if something looks off." },
    btn_exportar_casos_csv: { es: "Exportar CSV", en: "Export CSV" },
    btn_exportar_casos_csv_tit: { es: "Descargar todos los casos en un CSV, sin esperar a la sincronización automática con el Sheet",
                           en: "Download all cases as a CSV, without waiting for automatic Sheet sync" },
    casos_exportados:    { es: "Casos exportados a CSV.", en: "Cases exported to CSV." },
    caso_pdf_sin_datos:  { es: "Todavía no hay ningún caso que exportar.", en: "There are no cases to export yet." },
    caso_pdf_popup_bloqueado: { es: "El navegador ha bloqueado la pestaña del informe. Permite las ventanas emergentes para esta página e inténtalo de nuevo.",
                           en: "The browser blocked the report tab. Allow pop-ups for this page and try again." },
    caso_pdf_reflejos:   { es: "Reflejos", en: "Reflexes" },
    caso_pdf_titulo_varios: { es: "Informe de casos", en: "Case report" },
    btn_duplicar:        { es: "Duplicar", en: "Duplicate" },
    btn_renombrar:       { es: "Renombrar", en: "Rename" },
    btn_vaciar:          { es: "Vaciar", en: "Empty" },
    btn_borrar:          { es: "Borrar", en: "Delete" },
    btn_guardar_montaje: { es: "Guardar montaje", en: "Save montage" },
    dlg_guardar_montaje_titulo: { es: "Guardar montaje", en: "Save montage" },
    guardar_montaje_intro: { es: "¿Qué quieres hacer con «{nombre}»?", en: "What do you want to do with “{nombre}”?" },
    guardar_montaje_nuevo: { es: "Guardar como nuevo", en: "Save as new" },
    guardar_montaje_sobrescribir: { es: "Sobrescribir este", en: "Overwrite this one" },
    montaje_guardado:    { es: "Montaje guardado.", en: "Montage saved." },
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
    chip_foto_tit:       { es: "Ver foto", en: "View photo" },
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
    tec_recomendada:     { es: "Recomendada en “{perfil}”. Decides tú si se marca.",
                           en: "Recommended in “{perfil}”. You decide whether to select it." },

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
    btn_casos:           { es: "Gestión de casos", en: "Case management" },
    btn_casos_tit:       { es: "Registrar y consultar casos", en: "Record and review cases" },
    dlg_casos_titulo:    { es: "Gestión de casos", en: "Case management" },
    casos_nuevo_cero:    { es: "Crear caso", en: "Create case" },
    casos_nuevo_cero_ay: { es: "Te lleva al Organizador de Montajes para construir el montaje de este caso -a mano, o a partir de una plantilla-. Rellenas el resto de la ficha cuando quieras.",
                           en: "Takes you to the Montage Organizer to build this case's montage -from scratch, or from a template-. Fill in the rest of the form whenever you like." },
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
    caso_g_montaje:      { es: "Montaje / Técnicas", en: "Montage / Techniques" },
    caso_g_desarrollo:   { es: "Desarrollo intraoperatorio", en: "Intraoperative course" },
    caso_g_resultado:    { es: "Resultado / Correlación clínica", en: "Outcome / Clinical correlation" },
    caso_g_formacion:    { es: "Docencia / Meta", en: "Teaching / Meta" },
    caso_volver:         { es: "Volver a la lista", en: "Back to the list" },
    caso_borrar:         { es: "Borrar caso", en: "Delete case" },
    caso_crear_informe:  { es: "Crear informe", en: "Create report" },
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
    caso_antecedentes_relevantes: { es: "Antecedentes relevantes", en: "Relevant history" },
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
    caso_notas_montaje_tecnicas: { es: "Notas de Montaje/Técnicas", en: "Montage/Techniques notes" },
    caso_tecnicas_parametros: { es: "Cómo se realizó cada técnica", en: "How each technique was performed" },
    caso_tecnicas_parametros_ay: { es: "Para cada técnica marcada como realizada arriba: parámetros reales usados en este caso concreto (intensidad, frecuencia...). Queda plegado y vacío hasta que abras una técnica y escribas algo.",
                                    en: "For each technique ticked as performed above: the actual parameters used in this specific case (intensity, frequency...). Stays collapsed and empty until you open a technique and write something." },
    caso_sin_tecnicas_parametros: { es: "Marca primero las técnicas realizadas, arriba.",
                                     en: "First tick the techniques performed, above." },
    tecpar_intensidad:   { es: "Intensidad", en: "Intensity" },
    tecpar_frecuencia:   { es: "Frecuencia", en: "Frequency" },
    tecpar_num_pulsos:   { es: "Nº de pulsos", en: "Pulse count" },
    tecpar_trenes:       { es: "Trenes (facilitación)", en: "Trains (facilitation)" },
    tecpar_isi:          { es: "ISI", en: "ISI" },
    tecpar_filtros:      { es: "Filtros", en: "Filters" },
    tecpar_promediacion: { es: "Promediación", en: "Averaging" },
    tecpar_barrido:      { es: "Tiempo de barrido", en: "Sweep time" },
    tecpar_notas:        { es: "Notas técnicas de esta técnica", en: "Technical notes for this technique" },
    caso_imagenes_montaje: { es: "Imágenes del montaje", en: "Montage images" },
    caso_imagenes_montaje_ay: { es: "Capturas o fotos de cómo quedó el montaje en el software del equipo (pantalla del Inomed, por ejemplo), para consultarlas si en el futuro te toca un caso parecido. Se comprimen solas al añadirlas.",
                                 en: "Screenshots or photos of how the montage ended up on the equipment's software (e.g. the Inomed screen), to look up if a similar case comes up in the future. They get compressed automatically when added." },
    caso_imagen_anadir:  { es: "＋ Añadir imagen", en: "＋ Add image" },
    caso_imagen_quitar_tit: { es: "Quitar esta imagen", en: "Remove this image" },
    caso_imagen_error:   { es: "No se pudo leer esa imagen. Prueba con otro archivo.", en: "Couldn't read that image. Try another file." },
    caso_hubo_cambios_plan: { es: "¿Hubo cambios respecto al plan?", en: "Were there changes from the plan?" },
    caso_cambios_respecto_al_plan: { es: "Detalle de los cambios", en: "Details of the changes" },
    caso_umbral_raices_niveles: { es: "Umbrales EMG por raíz (mapeo de tornillos)", en: "EMG thresholds by root (screw mapping)" },
    caso_umbral_raices_niveles_ay: { es: "Marca los niveles testados durante el mapeo y anota el umbral de cada lado.",
                           en: "Tick the levels tested during mapping and note the threshold on each side." },
    umbral_raices_izq:  { es: "Izquierdo {nivel}", en: "Left {nivel}" },
    umbral_raices_der:  { es: "{nivel} derecho", en: "{nivel} right" },
    umbral_raices_izq_corto: { es: "I", en: "L" },
    umbral_raices_der_corto: { es: "D", en: "R" },
    caso_umbral_tornillos_pediculares: { es: "Notas de umbral EMG de tornillos pediculares", en: "Notes on pedicle screw EMG threshold" },
    caso_umbral_tornillos_pediculares_ay: { es: "Cualquier cosa que no encaje en los niveles de arriba: umbrales no testados por raíz, matices, comparaciones entre tornillos, etc.",
                           en: "Anything that doesn't fit the levels above: thresholds not tested by root, nuances, comparisons between screws, etc." },
    caso_material_previsto: { es: "Material (montaje base)", en: "Material (base montage)" },
    caso_material_previsto_ay: { es: "El material que sale del montaje de este caso -de solo lectura aquí-. Si añadiste algo que no estaba previsto, colócalo en su caja desde el Organizador de Montajes y anótalo en «Notas de Montaje/Técnicas».",
                           en: "The material that comes out of this case's montage -read-only here-. If you added something that wasn't planned, place it in its box from the Montage Organizer and note it in “Montage/Techniques notes”." },
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
    caso_recuperacion_senal: { es: "Recuperación de la señal", en: "Signal recovery" },
    caso_resultado_esperable: { es: "Resultado esperable", en: "Expected outcome" },
    caso_resultado_esperable_ay: { es: "Lo que cabría esperar en el postoperatorio dado lo registrado, para compararlo después con el déficit real.",
                           en: "What would be expected postoperatively given what was recorded, to compare later against the actual deficit." },
    caso_deficit_postoperatorio: { es: "Evolución postquirúrgica", en: "Postoperative evolution" },
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
    opc_rol_adjunto1:    { es: "Adjunto 1", en: "Attending 1" },
    opc_rol_adjunto2:    { es: "Adjunto 2", en: "Attending 2" },
    opc_rol_residente:   { es: "Residente", en: "Resident" },
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
    cat_intro_usuarios:  { es: "Quién usa la herramienta. Sirve para <b>firmar los montajes</b>: cada uno lleva el nombre de quien lo creó, y solo su autor puede editarlo o borrarlo. No es una contraseña ni protege nada — cualquiera puede cambiar de perfil desde la barra de arriba. Estos nombres viven en tu repositorio de datos privado, nunca en el del código.",
                           en: "Who uses the tool. It is used to <b>sign montages</b>: each one carries the name of whoever created it, and only its author can edit or delete it. It is not a password and protects nothing — anyone can switch profile from the top bar. These names live in your private data repository, never in the code one." },
    perfil_usuario_aria: { es: "Quién eres", en: "Who you are" },
    perfil_usuario_sin:  { es: "— quién eres —", en: "— who are you —" },
    perfil_usuario_nuevo: { es: "+ Añadir usuario…", en: "+ Add user…" },
    perfil_usuario_pide:  { es: "¿Cómo te llamas? Aparecerá como autor de los montajes que crees.",
                           en: "What is your name? It will appear as the author of the montages you create." },
    montaje_sin_autor:   { es: "de fábrica", en: "factory" },
    montaje_autor_ido:   { es: "otro usuario", en: "another user" },
    montaje_no_es_tuyo:  { es: "Este montaje es de {autor}, así que no puedes cambiarlo.\n\nUsa «Duplicar» para hacerte una copia tuya y trabajar sobre ella.",
                           en: "This montage belongs to {autor}, so you cannot change it.\n\nUse “Duplicate” to make your own copy and work on that." },
    montaje_de:          { es: "{nombre} · {autor}", en: "{nombre} · {autor}" },
    caso_sin_id:         { es: "Caso sin número", en: "Case with no number" },
    btn_menu_tit:        { es: "Idioma y guía de uso", en: "Language and user guide" },
    btn_guia:            { es: "Guía de uso", en: "User guide" },
    btn_guia_tit:        { es: "Cómo se usa MIO-Check, de un vistazo", en: "How to use MIO-Check, at a glance" },
    dlg_guia_titulo:     { es: "Guía de uso", en: "User guide" },
    guia_aviso_en:       { es: "This guide is only written in Spanish for now.", en: "This guide is only written in Spanish for now." },
    // Fase 7 (06-09-2026): pantalla de inicio con 6 tarjetas.
    logo_inicio_tit:     { es: "Volver al inicio", en: "Back to home" },
    btn_inicio_pantalla: { es: "Inicio", en: "Home" },
    tile_organizador:    { es: "Organizador de Montajes", en: "Montage Organizer" },
    tile_casos:          { es: "Gestión de Casos", en: "Case Management" },
    tile_tecnicas:       { es: "Técnicas IONM", en: "IONM Techniques" },
    tile_docencia:       { es: "Docencia", en: "Teaching" },
    tile_simulador:      { es: "Simulador", en: "Simulator" },
    tile_bibliografia:   { es: "Bibliografía", en: "Bibliography" },
    docente_tab_material:{ es: "Material", en: "Material" },
    docente_tab_teoria:  { es: "Teoría básica de IONM", en: "IONM basic theory" },
    en_construccion:     { es: "En construcción.", en: "Under construction." },
    btn_tecnicas_mio:    { es: "Técnicas MIO", en: "MIO Techniques" },
    btn_tecnicas_mio_tit: { es: "Sitios de estimulación/registro, filtros y barridos de cada técnica, para consulta durante el caso",
                           en: "Stimulation/recording sites, filters and sweep times for each technique, for reference during a case" },
    dlg_tecnicas_mio_titulo: { es: "Técnicas MIO", en: "MIO Techniques" },
    tecnicas_mio_intro:  { es: "Cada parámetro cuantitativo indica su fuente. Cuando dos fuentes dan valores distintos, se muestran ambos por separado: nunca se promedian ni se combinan.",
                           en: "Each quantitative parameter names its source. When two sources give different values, both are shown separately — never averaged or merged." },
    tecnicas_mio_aviso_en: { es: "This section is only written in Spanish for now.", en: "This section is only written in Spanish for now." },
    tecmio_buscar_ph:    { es: "Buscar técnica, sitio, parámetro, cifra…", en: "Search technique, site, parameter, figure…" },
    btn_docente:         { es: "Docente", en: "Teaching" },
    docente_titulo:      { es: "Miotomas: qué músculos monitorizar", en: "Myotomes: which muscles to monitor" },
    docente_intro:       { es: "Pulsa en la columna los <b>niveles</b> que abarca la cirugía. A la izquierda aparecen los músculos que dependen de esas raíces; pulsa uno para llevarlo a los <b>monitorizados</b> de la derecha, y pulsa allí para quitarlo. Los rangos son los que se enseñan habitualmente: la inervación se solapa y no todas las escuelas dan los mismos límites, así que están para discutirlos.",
                           en: "Click the <b>levels</b> the surgery covers on the spine. The muscles depending on those roots appear on the left; click one to move it to <b>monitored</b> on the right, and click there to remove it. The ranges are the ones usually taught: innervation overlaps and not every school gives the same limits, so they are there to be discussed." },
    docente_fuentes:      { es: "El detalle al pasar el ratón por un músculo, cuando lo lleva, cita: <b>[TD/L]</b> Toleikis/Deletis 2.ª ed. cap. 13 y Leppänen (ASNM) para el músculo y el nivel · <b>[Sch]</b> Schirmer 2011 y <b>[Lon]</b> London 2022 (J Neurosurg Spine) para la frecuencia real de solapamiento entre niveles. Los músculos sin ninguna marca no vienen de esta tabla: son rangos habituales de enseñanza, sin cita concreta detrás.",
                           en: "The tooltip on a muscle, when it has one, cites: <b>[TD/L]</b> Toleikis/Deletis 2nd ed. ch. 13 and Leppänen (ASNM) for the muscle and level · <b>[Sch]</b> Schirmer 2011 and <b>[Lon]</b> London 2022 (J Neurosurg Spine) for how often levels actually overlap. Muscles with no mark are not from this table: they are the usual teaching ranges, with no specific citation behind them." },
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
    caso_editar_montaje: { es: "Editar material y montaje", en: "Edit material and montage" },
    caso_editar_montaje_ay: { es: "Abre las cajas de este caso para cambiar dónde va cada cosa. Lo que cambies se guarda en el caso, no en el montaje del que salió.",
                           en: "Opens this case’s boxes to change where each item goes. What you change is saved in the case, not in the montage it came from." },
    caso_cargar_plantilla: { es: "Cargar montaje…", en: "Load montage…" },
    caso_montaje_origen: { es: "Plantilla de origen: {nombre}", en: "Source template: {nombre}" },
    caso_montaje_origen_no_disponible: { es: "plantilla no disponible", en: "template not available" },
    caso_guardar_plantilla: { es: "Guardar este montaje como plantilla…", en: "Save this montage as a template…" },
    caso_guardar_plantilla_ay: { es: "Crea una plantilla nueva a partir de lo que hay ahora en las cajas de este caso. El caso no se modifica.",
                           en: "Creates a new template from what's currently in this case's boxes. The case itself is not changed." },
    plantilla_guardar_prompt: { es: "Nombre de la plantilla nueva:\n\nPara reconocerla luego en la lista — nunca un dato del paciente.",
                           en: "Name of the new template:\n\nSo you can recognise it later in the list — never patient data." },
    plantilla_guardada: { es: "Plantilla «{nombre}» guardada.", en: "Template “{nombre}” saved." },
    barra_caso_texto:    { es: "Corrigiendo el material del caso", en: "Correcting the material of case" },
    barra_caso_ay:       { es: "Se guarda solo, en el caso. El montaje original no se toca.",
                           en: "Saved automatically, into the case. The original montage is untouched." },
    barra_caso_volver:   { es: "Volver al caso", en: "Back to the case" },
    barra_plantilla_texto: { es: "Plantilla:", en: "Template:" },
    barra_plantilla_ninguna: { es: "— sin plantilla activa —", en: "— no active template —" },
    caso_reconstruccion_parcial: { es: "De este caso solo se han podido recolocar {recuperadas} de {esperadas} entradas.\n\nEs un caso antiguo, de antes de que se guardara el montaje completo, y alguna de sus entradas ya no existe en las cajas de ahora.\n\nSi sigues y cambias algo, el caso se quedará con las {recuperadas} que se ven. ¿Continuar?",
                           en: "Only {recuperadas} of {esperadas} inputs could be restored for this case.\n\nIt is an old case, from before the full montage was stored, and some of its inputs no longer exist in the current boxes.\n\nIf you continue and change anything, the case will keep only the {recuperadas} shown. Continue?" },
    montajes_cuenta:     { es: "{n} de {total}", en: "{n} of {total}" },
    montaje_tuyo:        { es: "tuyo", en: "yours" },

    /* --- Fase 4.1: biblioteca de montajes --- */
    dlg_montajes_titulo: { es: "Plantillas de montajes", en: "Montage templates" },
    montaje_en_blanco:   { es: "+ Montaje en blanco", en: "+ Blank montage" },

    /* --- Fase 1: cargar una plantilla sobre un caso --- */
    dlg_elegir_plantilla_titulo: { es: "Elegir plantilla", en: "Choose template" },
    plantilla_filtro_buscar: { es: "Buscar", en: "Search" },
    plantilla_buscar_ph: { es: "Nombre o autor…", en: "Name or author…" },
    plantilla_entradas: { es: "{n} entradas", en: "{n} inputs" },
    plantilla_vacio:    { es: "Ningún montaje con esos filtros.", en: "No montage matches those filters." },
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
  var PANTALLAS = ["inicio", "organizador", "casos", "tecnicas-mio", "docente", "simulador", "bibliografia"];

  function irAPantalla(nombre) {
    PANTALLAS.forEach(function (p) {
      var el = document.getElementById("pantalla-" + p);
      if (el) el.classList.toggle("activa", p === nombre);
    });
    window.scrollTo(0, 0);
  }

  // Para el patrón "si esta pantalla está visible ahora mismo, repinta" -antes
  // dlgCasos.open, con dlg-casos ya convertido de <dialog> a <div> ese booleano
  // nativo deja de existir, hace falta esta comprobación explícita.
  function pantallaActiva(nombre) {
    var el = document.getElementById("pantalla-" + nombre);
    return !!(el && el.classList.contains("activa"));
  }

  document.getElementById("btn-inicio").addEventListener("click", function () { irAPantalla("inicio"); });
  // Botón "Inicio" junto al título de cada pantalla (pedido el 06-09-2026):
  // mismo destino que el logo, para no obligar a subir hasta la cabecera.
  document.querySelectorAll(".btn-pantalla-inicio").forEach(function (btn) {
    btn.addEventListener("click", function () { irAPantalla("inicio"); });
  });
  document.getElementById("tile-organizador").addEventListener("click", function () { irAPantalla("organizador"); });
  document.getElementById("tile-simulador").addEventListener("click", function () { irAPantalla("simulador"); });
  document.getElementById("tile-bibliografia").addEventListener("click", function () { irAPantalla("bibliografia"); });
  // tile-casos, tile-tecnicas-mio y tile-docente se conectan más abajo, junto
  // a abrirListaCasos()/abrirTecnicasMio()/abrirDocente() -esas sí necesitan
  // pintar contenido antes de mostrarse, no son un simple cambio de pantalla-.

  function aplicarIdioma(nuevo, repintar) {
    idioma = IDIOMAS.indexOf(nuevo) === -1 ? "es" : nuevo;
    try { localStorage.setItem(IDIOMA_KEY, idioma); } catch (e) { /* sin persistencia */ }
    aplicarTextos();
    if (repintar) {
      renderTodo();
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
      CATALOGO.push({ categoria: grupo.categoria, categoria_en: grupo.categoria_en, plegada_por_defecto: !!grupo.plegada_por_defecto, items: items });
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
    montajesSinSubir[m.montaje_uid] = true;
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

  function editandoMontajeDeCaso() { return !!montajeCaso; }

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
      tecnicas: (caso.tecnicas_realizadas || []).slice(),
      asignaciones: clonar(caso.asignaciones || {}),
      extras: (caso.extras || []).slice(),
      etiquetas: clonar(caso.etiquetas_colocadas || {}),
      conmutador: clonar(caso.conmutador || {}),
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
      especiales: info.especiales || [],
      plegable: !!info.plegable
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

  function plegarCatalogo(plegar) {
    var panel = document.getElementById("panel-catalogo");
    if (plegar === !panel.open) return;
    if (plegar) scrollCatalogo = panel.scrollTop;
    panel.open = !plegar;
    if (!plegar) panel.scrollTop = scrollCatalogo;
  }

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
      if (window.matchMedia("(max-width: 900px)").matches) plegarCatalogo(true);
    }
  }

  function colocar(cajaKey, entradaId, itemId) {
    asignacionesDe(cajaKey)[entradaId] = itemId;
    // La etiqueta que hubiera elegida era del material anterior
    olvidarEtiquetaColocada(cajaKey, entradaId);
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

  function pintarCatalogoEn(cont, filtro, opciones) {
    opciones = opciones || {};
    cont.innerHTML = "";

    CATALOGO.forEach(function (grupo) {
      var items = (grupo.items || []).filter(function (it) {
        // Los auriculares o las gafas no van a ninguna entrada: en el
        // selector de una entrada concreta solo estorban.
        if (opciones.soloConEntrada && ITEMS[it.id] && ITEMS[it.id].sin_entrada) return false;
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
      items.forEach(function (it) {
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
      entrada: entrada.etiqueta,
      caja: infoCaja(cajaKey).nombre
    });
    // Si la entrada ya tiene algo, se avisa: elegir aquí sustituye, no añade
    if (ocupada && ITEMS[ocupada]) {
      texto += " " + T("elegir_ocupada", { item: campo(ITEMS[ocupada], "nombre") });
    }
    document.getElementById("elegir-destino").textContent = texto;
    document.getElementById("elegir-quitar").hidden = !ocupada;
    document.getElementById("elegir-buscar").value = "";
    renderElegir();
    dlgElegir.showModal();
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
    return !!(sync.repo && sync.token);
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
    } else if (sync.pendiente || casosPendientes().length || borradosPendientes().length || montajesPendientes().length || montajesBorradosPend().length) {
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
        !montajesPendientes().length && !montajesBorradosPend().length) return;
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
    if (sync.pendiente) { subirAuto(); bajarCasos(); bajarMontajes(); return; }
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
    if (sync.pendiente || casosPendientes().length || borradosPendientes().length || montajesPendientes().length || montajesBorradosPend().length) subirAuto();
    bajarCasos();
    bajarMontajes();
  });

  // Al volver la pestaña a primer plano, también. En el móvil el navegador
  // suspende o descarta la pestaña en cuanto cambias de app o bloqueas la
  // pantalla, así que la cuenta atrás de 4 s de programarEnvio() muchas veces
  // no llega a dispararse: lo guardado justo antes de guardar el teléfono en
  // el bolsillo se quedaba sin subir.
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    if (!syncActivo()) return;
    if (sync.pendiente || casosPendientes().length || borradosPendientes().length || montajesPendientes().length || montajesBorradosPend().length) subirAuto();
  });

  // Cerrar la pestaña con algo sin subir: avisa antes de perderlo de vista
  window.addEventListener("beforeunload", function (e) {
    if (syncActivo() && (sync.pendiente || casosPendientes().length || borradosPendientes().length || montajesPendientes().length || montajesBorradosPend().length)) {
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
      motivo_cancelacion: "",
      fecha: fecha,
      centro: centroPorDefecto(),
      hora_inicio: "", hora_fin: "",
      escenario_nombre: "", perfil: "",
      edad: "", sexo: "", antecedentes_relevantes: "",
      intervencion: "", servicio_id: "", diagnostico: "",
      posicion: "", posicion_detalle: "", anatomia_patologica: "",
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
   * mismas 53 columnas base que construirFilasCasos_() genera en la hoja
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
    "posicion", "posicion_detalle", "anatomia_patologica", "otros_datos_quirurgicos",
    "notas_montaje_tecnicas", "hubo_cambios_plan", "cambios_respecto_al_plan", "umbral_tornillos_pediculares",
    "n_cajas", "n_canales_ocupados", "avisos_preparacion",
    "coste_material", "coste_completo",
    "tipo_anestesia", "tipo_anestesia_detalle",
    "tof_monitorizado", "incidencias_anestesicas",
    "resumen_monitorizacion", "alerta", "tipo_alerta",
    "medida_correctora", "recuperacion_senal", "resultado_esperable",
    "deficit_postoperatorio", "concordancia",
    "incidencias_tecnicas", "equipo",
    "rol", "supervisor", "dificultad_1a5", "aprendizaje_clave", "caso_destacado",
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
      case "caso_destacado": return c.caso_destacado ? 1 : 0;
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

  function casosACsv() {
    var filas = [COLUMNAS_CSV_CASOS.join(",")];
    // Mismo orden que el Sheet: cronológico por fecha de la cirugía, no por
    // cuándo se guardó el archivo.
    var uids = Object.keys(casos).sort(function (a, b) {
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

  document.getElementById("btn-exportar-casos-csv").addEventListener("click", function () {
    var csv = casosACsv();
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "mio-ionm-casos-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    avisoGuardado(T("casos_exportados"));
  });

  /* ------------------------------------------------------------------ *
   * Informe en PDF (pedido por Pani, 05-09-2026: "en camino desde que se
   * dejó a medias 'Crear informe'"). Sin librerías -regla 4 de CLAUDE.md-:
   * se abre una pestaña con su propio documento, montado con
   * createElement/textContent igual que el resto de la app -nunca
   * innerHTML con datos concatenados-, y se llama a print() al cargar. El
   * propio diálogo de impresión del navegador ya ofrece "Guardar como
   * PDF" de fábrica, así que no hace falta generar el PDF a mano.
   *
   * Primera versión para que Pani la pruebe y la vaya afinando: recorre
   * CAMPOS_CASO/GRUPOS_CASO -la misma lista que pinta la ficha en
   * pantalla-, así que un campo nuevo en la ficha aparece aquí solo, sin
   * tocar esta función.
   * ------------------------------------------------------------------ */
  function valorCampoInforme(def, c) {
    var v = c[def.c];
    if (def.t === "check") return v ? opcionTexto("sino", "si") : null;
    if (def.t === "sel") return v ? opcionTexto(def.o, v) : "";
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
  function filaInforme(doc, etiqueta, valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    var fila = nodoInforme(doc, "div", "informe-fila");
    fila.appendChild(nodoInforme(doc, "span", "informe-etiqueta", etiqueta + ":"));
    fila.appendChild(nodoInforme(doc, "span", "informe-valor", String(valor)));
    return fila;
  }

  function seccionInforme(doc, titulo, filas) {
    var validas = (filas || []).filter(Boolean);
    if (!validas.length) return null;
    var sec = nodoInforme(doc, "section", "informe-seccion");
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

  // "Cómo se realizó cada técnica": una fila por técnica con algo escrito,
  // con sus parámetros en línea y la nota libre debajo.
  function seccionParametrosInforme(doc, c) {
    var mapa = c.tecnicas_parametros || {};
    var CAMPOS_TECPAR = ["intensidad", "frecuencia", "num_pulsos", "trenes", "isi", "filtros", "promediacion", "barrido"];
    var ids = (c.tecnicas_realizadas || []).filter(function (id) {
      var d = mapa[id];
      return d && (CAMPOS_TECPAR.some(function (k) { return d[k]; }) || d.notas);
    });
    if (!ids.length) return null;
    var sec = nodoInforme(doc, "section", "informe-seccion");
    sec.appendChild(nodoInforme(doc, "h3", null, T("caso_tecnicas_parametros")));
    ids.forEach(function (id) {
      var t = TECNICAS.filter(function (x) { return x.id === id; })[0];
      var d = mapa[id];
      var bloque = nodoInforme(doc, "div", "informe-tecpar");
      bloque.appendChild(nodoInforme(doc, "h4", null, t ? campo(t, "etiqueta") : id));
      var linea = CAMPOS_TECPAR.filter(function (k) { return d[k]; })
        .map(function (k) { return T("tecpar_" + k) + ": " + d[k]; }).join(" · ");
      if (linea) bloque.appendChild(nodoInforme(doc, "p", "informe-tecpar-linea", linea));
      if (d.notas) bloque.appendChild(nodoInforme(doc, "p", "informe-tecpar-notas", d.notas));
      sec.appendChild(bloque);
    });
    return sec;
  }

  // Umbrales EMG por raíz: una fila por nivel marcado, con sus dos lados.
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

  function seccionMaterialInforme(doc, titulo, mapa) {
    var tipos = Object.keys(mapa || {}).sort();
    if (!tipos.length) return null;
    return seccionInforme(doc, titulo, tipos.map(function (tipo) { return filaInforme(doc, tipo, mapa[tipo]); }));
  }

  // Imágenes del montaje: se incrustan tal cual -ya son dataURL- para que
  // salgan en el PDF sin depender de ninguna URL externa.
  function seccionImagenesInforme(doc, c) {
    var imgs = c.imagenes_montaje || [];
    if (!imgs.length) return null;
    var sec = nodoInforme(doc, "section", "informe-seccion informe-seccion-imagenes");
    sec.appendChild(nodoInforme(doc, "h3", null, T("caso_imagenes_montaje")));
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
    var meta = [valorCampoInforme({ c: "estado", t: "sel", o: "estado" }, c), c.fecha, c.centro].filter(Boolean).join(" · ");
    if (meta) cab.appendChild(nodoInforme(doc, "p", "informe-meta", meta));
    art.appendChild(cab);

    // Recorre CAMPOS_CASO agrupado por GRUPOS_CASO -la misma fuente que usa
    // la ficha en pantalla-, salvo los campos con su propia sección hecha a
    // mano más abajo (técnicas, material, imágenes...), que se insertan en
    // el sitio del grupo "montaje" al que pertenecen.
    var CAMPOS_APARTE = [
      "tecnicas_realizadas", "tecnicas_alteradas", "tecnicas_parametros",
      "umbral_raices_niveles", "material_previsto", "material_real", "imagenes_montaje"
    ];
    GRUPOS_CASO.forEach(function (g) {
      var filas = CAMPOS_CASO
        .filter(function (def) { return def.g === g && def.t !== "ro" && CAMPOS_APARTE.indexOf(def.c) === -1; })
        .map(function (def) { return filaInforme(doc, T("caso_" + def.c), valorCampoInforme(def, c)); });
      var sec = seccionInforme(doc, T("caso_g_" + g), filas);
      // "umbral_raices_niveles" va antes que "umbral_tornillos_pediculares"
      // en CAMPOS_CASO (ver la ficha real): su sección aparte tiene que
      // insertarse antes del bloque genérico de "desarrollo", no después,
      // para no invertir el orden que ve el usuario en pantalla.
      if (g === "desarrollo") {
        var sr = seccionUmbralRaicesInforme(doc, c);
        if (sr) art.appendChild(sr);
      }
      if (sec) art.appendChild(sec);
      if (g === "montaje") {
        [
          seccionTecnicasInforme(doc, c),
          seccionParametrosInforme(doc, c),
          seccionMaterialInforme(doc, T("caso_material_previsto"), c.material_previsto),
          seccionMaterialInforme(doc, T("caso_material_real"), c.material_real),
          seccionImagenesInforme(doc, c)
        ].filter(Boolean).forEach(function (s) { art.appendChild(s); });
      }
    });
    return art;
  }

  var ESTILO_INFORME_PDF =
    "body{font:14px/1.4 -apple-system,Segoe UI,Arial,sans-serif;color:#1a2229;margin:0;padding:0 2rem}" +
    ".informe-caso{padding:1.5rem 0;border-bottom:2px solid #cfd6dd}" +
    ".informe-caso:last-child{border-bottom:none}" +
    "@media print{.informe-caso{page-break-after:always;border-bottom:none}.informe-caso:last-child{page-break-after:avoid}}" +
    ".informe-cabecera h2{margin:0 0 0.2rem;font-size:1.3rem}" +
    ".informe-meta{margin:0 0 1rem;color:#62717c;font-size:0.85rem}" +
    ".informe-seccion{margin-bottom:0.9rem;break-inside:avoid}" +
    ".informe-seccion h3{margin:0 0 0.3rem;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.04em;color:#14705a;border-bottom:1px solid #e3e8ec;padding-bottom:0.15rem}" +
    ".informe-fila{display:flex;gap:0.4rem;font-size:0.85rem;padding:0.1rem 0}" +
    ".informe-etiqueta{font-weight:700;white-space:nowrap}" +
    ".informe-valor{white-space:pre-wrap}" +
    ".informe-tecpar{margin:0.3rem 0;padding-left:0.5rem;border-left:2px solid #e3e8ec}" +
    ".informe-tecpar h4{margin:0;font-size:0.85rem}" +
    ".informe-tecpar-linea,.informe-tecpar-notas{margin:0.1rem 0;font-size:0.8rem}" +
    ".informe-imagenes{display:flex;flex-wrap:wrap;gap:0.5rem}" +
    ".informe-imagenes img{max-width:9rem;max-height:9rem;object-fit:cover;border:1px solid #cfd6dd;border-radius:4px}";

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
    var uids = Object.keys(casos).sort(function (a, b) {
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
    Object.keys(CAJAS).forEach(function (cajaKey) {
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
    Object.keys(CAJAS).forEach(function (cajaKey) {
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
  }

  // Lista de montajes elegibles como plantilla: se ofrecen también los de
  // otros -aplicar es una copia, no toca su archivo, así que puedoEditar()
  // no interviene aquí, a diferencia del diálogo Montajes.
  function renderListaPlantillas() {
    var cont = document.getElementById("plantilla-elegir-lista");
    cont.innerHTML = "";
    var busq = (document.getElementById("plantilla-buscar").value || "").toLowerCase();
    var uids = Object.keys(montajes).filter(function (uid) {
      var m = montajes[uid];
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
      sub.textContent = autorDe(m) + " · " + T("plantilla_entradas", { n: contarOcupadas(m) });
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

    var m = montajeNuevo(nombre);
    m.asignaciones = clonar(montajeRaw.asignaciones || {});
    m.extras = (montajeRaw.extras || []).slice();
    m.etiquetas = clonar(montajeRaw.etiquetas || {});
    m.conmutador = clonar(montajeRaw.conmutador || {});
    m.tecnicas = (montajeRaw.tecnicas || []).slice();
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
            if (pantallaActiva("casos")) renderListaCasos();
          }
        });
      })
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
  // marcado, ninguno de los dos tiene sentido (pedido por Pani, 05-09-2026).
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
    // Quién rellena la ficha, no el nivel de supervisión clínica -eso ya no
    // se distingue en ningún campo-.
    rol: ["adjunto1", "adjunto2", "residente"],
    estado: ["preparado", "cerrado", "cancelado"],
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
    concordancia: ["VP", "FP", "VN", "FN"],
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
    { g: "paciente", c: "antecedentes_relevantes", t: "area" },

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
    { g: "cirugia", c: "otros_datos_quirurgicos", t: "area" },

    // 4. Anestesia
    { g: "anestesia", c: "tipo_anestesia", t: "sel", o: "anestesia" },
    { g: "anestesia", c: "tipo_anestesia_detalle", t: "text", ay: "caso_tipo_anestesia_detalle_ay" },
    { g: "anestesia", c: "tof_monitorizado", t: "sel", o: "sino" },
    { g: "anestesia", c: "incidencias_anestesicas", t: "area" },

    // 5. Montaje / Técnicas
    { g: "montaje", c: "tecnicas_realizadas", t: "tecnicas", ay: "caso_tecnicas_ay" },
    { g: "montaje", c: "material_previsto", t: "material_ro", ay: "caso_material_previsto_ay" },
    // "Material realmente usado" suspendido a petición del usuario
    // (06-09-2026): con el montaje del caso editándose siempre en el
    // Organizador (ver "Crear caso"), lo que de verdad se usó ya es el
    // montaje real, no una copia aparte que había que corregir a mano. Si
    // se añade algo que no estaba previsto, se coloca en su caja y se anota
    // en "Notas de Montaje/Técnicas". El campo `material_real` sigue
    // existiendo en el modelo (`volcarMontajeEnCaso()`, el informe en PDF)
    // por los casos reales antiguos que ya lo tenían relleno -no se borra
    // nada, solo se deja de mostrar aquí-.
    // { g: "montaje", c: "material_real", t: "material", ay: "caso_material_real_ay" },
    // Absorbe lo que antes era "Pares craneales monitorizados": ya no tiene
    // campo propio, va aquí como una nota más de montaje.
    { g: "montaje", c: "notas_montaje_tecnicas", t: "area" },
    // Pedido por Pani, 05-09-2026: para cada técnica ya marcada como
    // realizada, poder anotar cómo se hizo de verdad en este caso concreto
    // -intensidad, frecuencia, nº pulsos, trenes, ISI, filtros, promediado,
    // barrido-. Va después de "tecnicas_realizadas" en la lista de campos
    // por el mismo motivo que tecnicas_alteradas: depende de esa lista via
    // oyentesTecnicasRealizadas, así que tiene que construirse después.
    { g: "montaje", c: "tecnicas_parametros", t: "tecnicas_parametros", ay: "caso_tecnicas_parametros_ay" },
    // Pedido por Pani, 05-09-2026: fotos de cómo quedó el montaje en el
    // software del equipo (p. ej. la pantalla del Inomed), para poder
    // consultarlas en un caso futuro parecido. Van dentro del propio caso
    // -no en archivo aparte-, igual que material_previsto/asignaciones: un
    // caso lo edita una sola persona a la vez, no hace falta la separación
    // por archivo que sí necesitan los montajes compartidos (ver "El
    // repositorio de datos" en CLAUDE.md). Cada imagen se comprime en el
    // navegador antes de guardarse (ver comprimirImagen()) para no disparar
    // el tamaño de lo que viaja a GitHub en cada sincronización.
    { g: "montaje", c: "imagenes_montaje", t: "imagenes_montaje", ay: "caso_imagenes_montaje_ay" },

    // 6. Desarrollo intraoperatorio
    // Un solo cuadro grande en vez de OP BSL y CL BSL sueltos: en la
    // practica real ya se escribian juntos, con las incidencias intraop
    // en medio contando la evolucion de una a otra -separarlas en dos cajas
    // rompia justo lo que se queria contar de corrido.
    { g: "desarrollo", c: "resumen_monitorizacion", t: "area", rows: 12, ay: "caso_resumen_monitorizacion_ay" },
    // Pedido por Pani, 05-09-2026: ambas cajas solo aparecen si "Mapeo de
    // raíces y tornillos" está marcada en Técnicas realizadas -sin esa
    // técnica, ni el desplegable de niveles ni la nota de umbral tienen
    // nada que hacer aquí- (ver ocultarSegunTecnica en campoCaso).
    { g: "desarrollo", c: "umbral_raices_niveles", t: "umbral_raices", ay: "caso_umbral_raices_niveles_ay" },
    { g: "desarrollo", c: "umbral_tornillos_pediculares", t: "area", ay: "caso_umbral_tornillos_pediculares_ay" },
    { g: "desarrollo", c: "hubo_cambios_plan", t: "check" },
    { g: "desarrollo", c: "cambios_respecto_al_plan", t: "area", dependeDe: "hubo_cambios_plan" },
    { g: "desarrollo", c: "alerta", t: "check" },
    // Absorbe tambien el criterio de alarma: eran dos cajas para una misma
    // idea -que salto y por que-, y tipo_alerta ya se escribia largo en la
    // practica real, asi que pasa a area en vez de una linea.
    { g: "desarrollo", c: "tipo_alerta", t: "area", dependeDe: "alerta" },
    { g: "desarrollo", c: "medida_correctora", t: "area", dependeDe: "alerta" },
    { g: "desarrollo", c: "recuperacion_senal", t: "area", dependeDe: "alerta" },
    { g: "desarrollo", c: "resultado_esperable", t: "area", ay: "caso_resultado_esperable_ay" },
    // Depende en vivo de lo que esté marcado en "tecnicas_realizadas" -ver
    // oyentesTecnicasRealizadas-, así que tiene que ir después de esa
    // lista, nunca antes.
    { g: "desarrollo", c: "tecnicas_alteradas", t: "tecnicas_alt", ay: "caso_tecnicas_alteradas_ay" },
    { g: "desarrollo", c: "incidencias_tecnicas", t: "area", rows: 4 },
    { g: "desarrollo", c: "equipo", t: "text" },

    // 7. Resultado / Correlación clínica
    { g: "resultado", c: "deficit_postoperatorio", t: "area", rows: 4 },
    { g: "resultado", c: "concordancia", t: "sel", o: "concordancia" },

    // 8. Docencia / Meta
    { g: "formacion", c: "rol", t: "sel", o: "rol" },
    { g: "formacion", c: "supervisor", t: "text" },
    { g: "formacion", c: "dificultad_1a5", t: "sel", o: "dificultad" },
    { g: "formacion", c: "aprendizaje_clave", t: "area", rows: 8 },
    { g: "formacion", c: "caso_destacado", t: "check" },
    { g: "formacion", c: "notas", t: "area" }
  ];
  var GRUPOS_CASO = ["traza", "paciente", "cirugia", "anestesia", "montaje", "desarrollo", "resultado", "formacion"];

  function opcionTexto(grupo, valor) {
    var clave = "opc_" + grupo + "_" + valor;
    var t = T(clave);
    return t === clave ? valor : t;
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
    // <details> plegado por defecto (pedido por Pani, 05-09-2026): son las
    // tres listas más largas de la ficha y no hace falta verlas siempre
    // abiertas. Por eso no llevan la etiqueta <label> normal -su summary la
    // sustituye-.
    var esPlegableMontaje = def.t === "tecnicas" || def.t === "material_ro" || def.t === "material";
    if (!esPlegableMontaje) {
      var lab2 = document.createElement("label");
      lab2.textContent = T("caso_" + def.c);
      lab2.setAttribute("for", "caso-f-" + def.c);
      div.appendChild(lab2);
    }

    if (def.t === "tecnicas") {
      // Mismos chips que en la tarjeta de técnicas: una sola forma de marcar
      var elegidas = (valor || []).slice();
      camposCaso[def.c] = elegidas;
      var detTec = document.createElement("details");
      detTec.className = "caso-grupo";
      var sumTec = document.createElement("summary");
      sumTec.textContent = T("caso_" + def.c);
      detTec.appendChild(sumTec);
      var campTec = document.createElement("div");
      campTec.className = "caso-grupo-campos";
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
        chip.textContent = campo(t, "etiqueta");
        chip.addEventListener("click", function () {
          var i = elegidas.indexOf(t.id);
          if (i === -1) elegidas.push(t.id); else elegidas.splice(i, 1);
          chip.classList.toggle("activo", i === -1);
          if (def.c === "tecnicas_realizadas") notificarTecnicasRealizadas();
        });
        return chip;
      });
      campTec.appendChild(fila);
      detTec.appendChild(campTec);
      div.appendChild(detTec);
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
          chip.textContent = campo(t, "etiqueta");
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
      // Un <details> plegable por técnica realizada, con los 8 parámetros
      // reales usados en este caso. A diferencia de tecnicas_alt, aquí NO se
      // borra el dato si la técnica se desmarca por error de
      // "tecnicas_realizadas": es texto escrito a mano, más caro de rehacer
      // que un simple chip, así que solo se deja de mostrar -reaparece si se
      // vuelve a marcar la técnica-.
      var CAMPOS_TECPAR = ["intensidad", "frecuencia", "num_pulsos", "trenes", "isi", "filtros", "promediacion", "barrido"];
      var mapaParam = Object.assign({}, valor || {});
      camposCaso[def.c] = mapaParam;
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
          var det = document.createElement("details");
          det.className = "caso-grupo tecpar-tecnica";
          det.open = CAMPOS_TECPAR.some(function (k) { return datos[k]; }) || !!datos.notas;
          var sum = document.createElement("summary");
          sum.textContent = campo(t, "etiqueta");
          det.appendChild(sum);
          var grid = document.createElement("div");
          grid.className = "caso-grupo-campos tecpar-grid";
          CAMPOS_TECPAR.forEach(function (k) {
            var lab3 = document.createElement("label");
            lab3.className = "tecpar-campo";
            var etq = document.createElement("span");
            etq.textContent = T("tecpar_" + k);
            var inp = document.createElement("input");
            inp.type = "text";
            inp.value = datos[k] || "";
            inp.addEventListener("input", function () { datos[k] = inp.value; });
            lab3.appendChild(etq);
            lab3.appendChild(inp);
            grid.appendChild(lab3);
          });
          det.appendChild(grid);
          // Notas libres, aparte de la rejilla: detalles que no encajan en
          // ningún parámetro fijo (p. ej. "facilitación cortical previa al
          // tren periférico"), pedido por Pani el 05-09-2026.
          var labNotas = document.createElement("label");
          labNotas.className = "tecpar-notas";
          var etqNotas = document.createElement("span");
          etqNotas.textContent = T("tecpar_notas");
          var areaNotas = document.createElement("textarea");
          areaNotas.rows = 2;
          areaNotas.value = datos.notas || "";
          areaNotas.addEventListener("input", function () { datos.notas = areaNotas.value; });
          labNotas.appendChild(etqNotas);
          labNotas.appendChild(areaNotas);
          grid.appendChild(labNotas);
          contParam.appendChild(det);
        });
      };
      pintarParametros();
      oyentesTecnicasRealizadas.push(pintarParametros);
      div.appendChild(contParam);
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
      var entradaImg = document.createElement("input");
      entradaImg.type = "file";
      entradaImg.accept = "image/*";
      entradaImg.multiple = true;
      entradaImg.hidden = true;
      entradaImg.addEventListener("change", function () {
        var archivos = Array.prototype.slice.call(entradaImg.files);
        entradaImg.value = "";
        archivos.forEach(function (f) {
          comprimirImagen(f, 1100, 0.72).then(function (dataUrl) {
            listaImg.push({ id: uuid(), nombre: f.name, dataUrl: dataUrl, fecha: new Date().toISOString() });
            pintarGaleria();
          }).catch(function () {
            alert(T("caso_imagen_error"));
          });
        });
      });
      var btnAddImg = document.createElement("button");
      btnAddImg.type = "button";
      btnAddImg.className = "caso-imagen-anadir";
      btnAddImg.textContent = T("caso_imagen_anadir");
      btnAddImg.addEventListener("click", function () { entradaImg.click(); });
      contImg.appendChild(galeria);
      contImg.appendChild(btnAddImg);
      contImg.appendChild(entradaImg);
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
      var NIVELES_RAICES = [
        "C1", "C2", "C3", "C4", "C5", "C6", "C7",
        "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12",
        "L1", "L2", "L3", "L4", "L5", "S1", "S2"
      ];
      var datosRaices = { niveles: ((valor && valor.niveles) || []).slice(), valores: Object.assign({}, valor && valor.valores) };
      camposCaso[def.c] = datosRaices;

      var contRaices = document.createElement("div");
      contRaices.className = "umbral-raices";
      var filaNiveles = document.createElement("div");
      filaNiveles.className = "chip-fila";
      var contValores = document.createElement("div");
      contValores.className = "umbral-raices-valores";

      var pintarValoresRaices = function () {
        contValores.textContent = "";
        datosRaices.niveles.forEach(function (nivel) {
          if (!datosRaices.valores[nivel]) datosRaices.valores[nivel] = {};
          var vals = datosRaices.valores[nivel];
          // I (caja) - nivel - D (caja): izquierda y derecha en sus propios
          // extremos, la raíz centrada -pedido del usuario el 05-09-2026,
          // para leer de un vistazo qué lado es cada umbral sin tener que
          // leer "Izquierdo"/"derecho" enteros cada vez. El texto largo
          // (T("umbral_raices_izq"/"_der")) se conserva como title/aria-label
          // y es el que sigue saliendo tal cual en el informe en PDF.
          var campoLado = function (lado, etiquetaCorta, etiquetaLarga) {
            var lab = document.createElement("label");
            lab.className = "umbral-raices-campo " + lado;
            lab.title = etiquetaLarga;
            var etq = document.createElement("span");
            etq.textContent = etiquetaCorta;
            var inp = document.createElement("input");
            inp.type = "text";
            inp.setAttribute("aria-label", etiquetaLarga);
            inp.value = vals[lado] || "";
            inp.addEventListener("input", function () { vals[lado] = inp.value; });
            lab.appendChild(etq);
            lab.appendChild(inp);
            return lab;
          };
          var tituloNivel = document.createElement("span");
          tituloNivel.className = "umbral-raices-nivel";
          tituloNivel.textContent = nivel;

          var filaNivel = document.createElement("div");
          filaNivel.className = "umbral-raices-fila";
          filaNivel.appendChild(campoLado("izq", T("umbral_raices_izq_corto"), T("umbral_raices_izq", { nivel: nivel })));
          filaNivel.appendChild(tituloNivel);
          filaNivel.appendChild(campoLado("der", T("umbral_raices_der_corto"), T("umbral_raices_der", { nivel: nivel })));
          contValores.appendChild(filaNivel);
        });
      };

      NIVELES_RAICES.forEach(function (nivel) {
        var chip = document.createElement("span");
        chip.className = "chip chip-extra" + (datosRaices.niveles.indexOf(nivel) !== -1 ? " activo" : "");
        chip.textContent = nivel;
        chip.addEventListener("click", function () {
          var i = datosRaices.niveles.indexOf(nivel);
          if (i === -1) datosRaices.niveles.push(nivel); else datosRaices.niveles.splice(i, 1);
          chip.classList.toggle("activo", i === -1);
          pintarValoresRaices();
        });
        filaNiveles.appendChild(chip);
      });

      pintarValoresRaices();
      contRaices.appendChild(filaNiveles);
      contRaices.appendChild(contValores);
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
      var detRo = document.createElement("details");
      detRo.className = "caso-grupo";
      var sumRo = document.createElement("summary");
      sumRo.textContent = T("caso_" + def.c);
      detRo.appendChild(sumRo);
      var campRo = document.createElement("div");
      campRo.className = "caso-grupo-campos";
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
      campRo.appendChild(tablaRo);
      detRo.appendChild(campRo);
      div.appendChild(detRo);
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
    // (pedido por Pani, 05-09-2026). Ver también el tipo "umbral_raices".
    if (def.c === "umbral_tornillos_pediculares") ocultarSegunTecnica(div, "mapeo_raices_tornillos");
    return div;
  }

  function ayudaCampo(clave) {
    var s = document.createElement("small");
    s.textContent = T(clave);
    return s;
  }

  function renderFichaCaso() {
    camposCaso = {};
    oyentesTecnicasRealizadas = [];
    condicionalesPendientes = [];
    var c = casoAbierto;

    document.getElementById("caso-subtitulo").textContent =
      T("caso_subtitulo_prefijo") + " " + (c.ID_Caso || "—") + (c.nombre_caso ? ", " + c.nombre_caso : "");

    // Los 8 apartados son <details> fijos en el HTML (caso-g-<grupo>), cada
    // uno con su contenedor propio (caso-c-<grupo>) donde se cuelgan sus
    // campos en el orden de CAMPOS_CASO. Plegados por defecto -ver
    // index.html-: se despliega el que interese, no hay que rellenar de
    // arriba abajo.
    GRUPOS_CASO.forEach(function (g) {
      var cont = document.getElementById("caso-c-" + g);
      cont.innerHTML = "";
      if (g === "montaje") {
        var res = document.createElement("p");
        res.className = "caso-resumen-linea";
        res.textContent = c.n_cajas
          ? T("caso_montaje_res", { cajas: c.n_cajas, canales: c.n_canales_ocupados })
          : T("caso_sin_montaje");
        cont.appendChild(res);

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
          cont.appendChild(origenP);
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
          var resDetalle = calcularResumen(montajeDesdeCaso(c));
          tituloDetalle.textContent = T("resumen_cajas", { n: resDetalle.cajas.length });
          cont.appendChild(tituloDetalle);

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
          cont.appendChild(contDetalle);
        }

        // Editar material y montaje (antes "Corregir el material y el
        // montaje", renombrado el 06-09-2026): pedido por el usuario que viva
        // aquí, en el mismo submenú donde ya se ve el resumen y se elige
        // plantilla, en vez de al final de la ficha -es la única forma de
        // ver dónde está colocado cada ítem, canal a canal, y hasta ahora
        // había que bajar del todo para encontrarla-. Necesita el caso ya
        // guardado en `casos` -uno recién creado y sin guardar aún no
        // existe ahí, no hay qué abrir-.
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
          var ayCorregir = document.createElement("small");
          ayCorregir.textContent = T("caso_editar_montaje_ay");
          filaCorregir.appendChild(btnCorregir);
          filaCorregir.appendChild(ayCorregir);
          cont.appendChild(filaCorregir);
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
          : c[def.c];
        cont.appendChild(campoCaso(def, valor));
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
    document.getElementById("caso-error").hidden = true;
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
    casoAbierto = clonar(casos[uid]);
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
      cab.appendChild(fecha);
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
    renderListaCasos();
    irAPantalla("casos");
  }

  document.getElementById("tile-casos").addEventListener("click", abrirListaCasos);
  ["casos-estado", "casos-desde", "casos-hasta"].forEach(function (id) {
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
    var c = casoVacio();
    guardarCaso(c, true);
    abrirCaso(c.caso_uid);
  });

  document.getElementById("caso-crear-informe").addEventListener("click", function () {
    // Lee lo que haya en la ficha ahora mismo -aunque no se haya pulsado
    // "Guardar" todavía- para que el informe refleje lo último escrito,
    // igual que hace "Guardar" antes de persistir.
    leerFichaCaso();
    abrirInformeCasos([casoAbierto]);
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

  document.getElementById("barra-caso-volver").addEventListener("click", function () {
    cerrarMontajeDeCaso(true);
  });
  document.getElementById("caso-volver").addEventListener("click", function () {
    // Solo navega, no guarda nada: para eso está "Guardar". Cerrar el caso
    // es cambiar el campo Estado en Identificación/Trazabilidad, como
    // cualquier otro campo -pedido del usuario, ya no hay un botón aparte
    // que lo haga por su cuenta-.
    dlgCaso.close();
    abrirListaCasos();
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
  // tipo de cirugía) se retiró el 05-09-2026 a petición de Pani: ya conoce
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
      if (e.target.closest(".chip-quitar")) return;
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
    var pista = document.getElementById("cajas-pista");
    if (!escenarioActual()) { pista.textContent = ""; return; }

    var grid = document.createElement("div");
    grid.className = "cajas-grid";
    var usadas = 0;
    Object.keys(CAJAS).forEach(function (key) {
      grid.appendChild(renderCajaFisica(key));
      var asign = asignacionesDe(key);
      if (entradasDe(key).some(function (e) { return !!asign[e.id]; })) usadas++;
    });
    cont.appendChild(grid);
    pista.textContent = T("cajas_cuenta", { n: usadas, total: Object.keys(CAJAS).length });
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
                extras: [], entradas: 0, avisos: [], coste: null };
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
        var etDe = etiquetaDe(item, override);
        if (etDe && !res.tipoEtiqueta[tipo]) res.tipoEtiqueta[tipo] = etDe.id;
        detalle.push({
          entrada: rotuloEntrada, nombre: nombre, color: item.color,
          tipo: tipo, estilo: estilo, item: item.id
        });
        // media_unidad: dos entradas que salen del mismo paquete (Erb1 + Erb2).
        // doble (etiqueta, no item): esta posición necesita 2 unidades del
        // material por colocación -activo y referencia-, como hook_wire;
        // media_unidad manda si coinciden ambos.
        var unidadesPorColocacion = item.media_unidad ? 0.5 : ((etDe && etDe.doble) ? 2 : 1);
        res.material[tipo] = (res.material[tipo] || 0) + unidadesPorColocacion;
        res.entradas++;
        // El conmutador reparte hacia 6 electrodos de sacacorchos (C3/C4 lo
        // habitual, a veces C5/C6) que no ocupan entrada propia en la caja
        // -son el mismo canal 6, repartido por dentro del switch-, así que
        // sin esto no salían nunca en el material a preparar. Se suman fijos
        // a 6 y no a los ids concretos porque cuáles sean cambia según el
        // caso; lo único constante es la cantidad.
        if (item.id === "conmutador") {
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
  function montajeNuevo(nombre) {
    var yo = usuarioActual();
    return {
      montaje_uid: uuid(),
      nombre: nombre,
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
      var m = montajeNuevo(T("esc_nuevo_def"));
      activo = m.montaje_uid;
      guardarMontaje(m, true);
      dlgMontajes.open = false;
      renderTodo();
    });
    cont.appendChild(blanco);

    var uids = Object.keys(montajes).filter(function (uid) {
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
      sub.textContent = autorDe(m) + (yo && m.autor_id === yo.id ? " · " + T("montaje_tuyo") : "") +
        " · " + T("plantilla_entradas", { n: calcularResumen(m).entradas });
      fila.appendChild(nom);
      fila.appendChild(sub);
      // Elegir un montaje no lleva confirmación: no destruye nada, cada
      // montaje es su propio archivo y el anterior queda guardado tal
      // cual. La confirmación de la Fase 1 es solo para aplicar contenido
      // DENTRO de un caso, que sí sobrescribe.
      fila.addEventListener("click", function () {
        activo = uid;
        guardarMontajes();
        dlgMontajes.open = false;
        renderTodo();
      });
      cont.appendChild(fila);
    });
  }

  document.getElementById("montajes-buscar").addEventListener("input", renderListaMontajesDialog);

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
      ay.textContent = "";
      acciones.hidden = true;
    }
    document.body.classList.toggle("barra-caso-oculta", barra.hidden);
  }

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

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") seleccionar(null);
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
   * Técnicas MIO: parámetros técnicos por técnica (data/tecnicas-mio.js),
   * para consulta durante el caso -no se sincroniza, no se guarda nada de
   * aquí, mismo patrón que la Guía de arriba: se pinta una sola vez, la
   * primera vez que se abre.
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
  // Término de búsqueda ya normalizado (sin acentos, minúsculas), vigente
  // durante el renderizado en curso: lo consultan pintarTextoConResaltado()
  // y tecnicaCoincideTecMio() sin necesidad de pasarlo por cada función.
  var tecMioFiltro = "";

  var TECMIO_REGIONES = {
    columna_medula: "Columna / médula espinal",
    fosa_posterior_tronco: "Fosa posterior / tronco",
    cirugia_cerebral: "Cirugía cerebral",
    craneotomia_despierta: "Craneotomía despierta",
    plexo_periferico: "Plexo braquial / nervio periférico",
    general: "General / multipropósito"
  };

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
    parametros_moller_alternativos: "Parámetros alternativos (Moller)",
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
    mmss_mediano_cubital_decusacion_normal: "MMSS mediano/cubital — decusación normal",
    mmss_no_decusacion: "MMSS — sin decusación",
    mmii_tibial_decusacion_normal: "MMII tibial — decusación normal",
    mmii_no_decusacion: "MMII — sin decusación",
    mmii_posicion_sentada: "MMII — posición sentada (fosa posterior)",
    fpz_rara_vez_optima: "Fpz rara vez óptima", comprobar_decusacion: "Comprobar decusación",
    opcional_erb_n13: "Opcional: Erb / N13", fallback_subcortical: "Fallback subcortical",
    velocidad: "Velocidad", topografia_variable: "Topografía variable",
    aclaracion_jaw_jerk: "Aclaración (jaw jerk)"
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
    // tocar este archivo si el color cambia (pedido por Pani, 04-09-2026).
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
      badge.className = "tecmio-badge";
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
  function renderTecnicasMio() {
    var datos = window.TECNICAS_MIO || { tecnicas: [] };
    var cont = document.getElementById("tecmio-contenido");
    cont.innerHTML = "";

    var entrada = document.getElementById("tecmio-buscar");
    var filtroCrudo = entrada ? (entrada.value || "").trim() : "";
    tecMioFiltro = normalizarTecMio(filtroCrudo);

    var porRegion = {};
    var ordenRegiones = [];
    (datos.tecnicas || []).forEach(function (t) {
      if (tecMioFiltro && !tecnicaCoincideTecMio(t, tecMioFiltro)) return;
      var r = t.region || "otras";
      if (!porRegion[r]) { porRegion[r] = []; ordenRegiones.push(r); }
      porRegion[r].push(t);
    });

    ordenRegiones.forEach(function (r) {
      var det = document.createElement("details");
      det.className = "caso-grupo";
      if (tecMioFiltro) det.open = true;
      var summary = document.createElement("summary");
      pintarTextoConResaltado(summary, TECMIO_REGIONES[r] || etiquetaTecMio(r, TECMIO_REGIONES));
      det.appendChild(summary);

      var campos = document.createElement("div");
      campos.className = "caso-grupo-campos";
      porRegion[r].forEach(function (t) {
        campos.appendChild(renderTecnicaMio(t));
      });
      det.appendChild(campos);
      cont.appendChild(det);
    });

    if (tecMioFiltro && !ordenRegiones.length) {
      var vacio = document.createElement("p");
      vacio.className = "tecmio-sin-resultados";
      vacio.textContent = "Sin resultados para «" + filtroCrudo + "».";
      cont.appendChild(vacio);
    }

    tecMioRenderizada = true;
  }

  function abrirTecnicasMio() {
    if (!tecMioRenderizada) renderTecnicasMio();
    irAPantalla("tecnicas-mio");
  }

  document.getElementById("tile-tecnicas-mio").addEventListener("click", abrirTecnicasMio);
  document.getElementById("tecmio-buscar").addEventListener("input", renderTecnicasMio);
  document.getElementById("guia-cerrar").addEventListener("click", function () { dlgGuia.close(); });

  function abrirDocente() {
    renderDocente();
    renderCama();
    irAPantalla("docente");
  }

  document.getElementById("tile-docente").addEventListener("click", abrirDocente);

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
    // Material y Teoría básica son pestañas nuevas (Fase 7, 06-09-2026),
    // "en construcción" por ahora -sin render propio, no hace falta el
    // "if (pane === ...) renderX()" que sí lleva "cama"-.
    document.getElementById("pane-material").hidden = pane !== "material";
    document.getElementById("pane-teoria").hidden = pane !== "teoria";
    if (pane === "cama") renderCama();
  });

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
  cargarSync();
  cargarPerfilUsuario();
  cargarDocente();
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
  avisoGuardado(T(syncActivo() ? "guardado_nube" : "guardado_local"));
  // Traer lo último de GitHub al abrir, sin preguntar si no hay nada local
  // sin subir. Si lo hay, sube en vez de bajar.
  bajarAuto();
})();
