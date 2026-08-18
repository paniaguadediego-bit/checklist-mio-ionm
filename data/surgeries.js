/*
 * Datos de material MIO/IONM (sistema INOMED).
 *
 * Este archivo NO es un .json "puro" por una razón técnica: si index.html
 * se abre con doble clic (protocolo file://), Chrome y Edge bloquean
 * fetch() de archivos locales por CORS y el checklist no cargaría nada.
 * Por eso el JSON va envuelto en una variable global y se carga con una
 * simple etiqueta <script>, que sí funciona sin servidor.
 *
 * Bloques:
 *   - cajas_material    : catálogo de las cajas físicas y sus entradas.
 *   - etiquetas         : tipos físicos de material (aguja trenzada,
 *                         sacacorchos, pegatina...). Definen lo que se cuenta
 *                         en el resumen y el aspecto del chip.
 *   - catalogo_material : catálogo maestro de TODO el material que se puede
 *                         colocar en una entrada (músculos, electrodos,
 *                         estímulos, tierras...). Aquí se añade material
 *                         nuevo para futuras cirugías.
 *   - tecnicas          : técnicas de monitorización y de mapeo.
 *   - servicios         : servicios quirúrgicos.
 *   - intervenciones    : tipos de cirugía, con su código de hospital.
 *   - perfiles_procedimiento : combinaciones habituales de técnicas.
 *   - escenarios        : presets de cirugía. Cada uno guarda qué material
 *                         va en qué entrada de qué caja.
 *
 * Los cinco últimos bloques son SIEMBRA de fábrica: desde la web se pueden
 * añadir, renombrar y reordenar sus elementos, y lo que cambies se guarda
 * en el navegador (y se sincroniza) sin tocar este archivo. Para que algo
 * venga de serie en el repositorio, edítalo aquí.
 *
 * Regla que no se rompe: lo que se guarda en escenarios y casos son los
 * "id", nunca los textos visibles. Así renombrar cualquier cosa se propaga
 * al histórico entero en vez de dejarlo huérfano.
 */
window.SURGERIES_DATA = {

  /* ------------------------------------------------------------------ *
   * CAJAS FÍSICAS
   * ------------------------------------------------------------------ */
  "cajas_material": {
    "caja_estimulo": {
      "nombre": "Caja de estímulo (STIM)",
      "descripcion": "Estimulación periférica: principalmente mediano y tibial posterior, aunque varía según la cirugía por comodidad (p. ej. a la altura de las piernas, tibial posterior y hueco poplíteo para el reflejo H).",
      "canales": 4,
      "conector": "par",
      "especiales": [
        { "clave": "dns", "nombre": "DNS", "conector": "individual", "nota": "Función sin confirmar" },
        { "clave": "extra_par", "nombre": "Extra", "conector": "par", "nota": "Sin nombre ni numeración en la caja real" }
      ]
    },
    "tes_mep": {
      "nombre": "TES MEP",
      "descripcion": "Numerada del 5 al 12 (no tiene entradas 1-4). Dos columnas independientes. Anodal (roja): el canal 6 es el conmutador que se subdivide en C1/C2/C3/C4/Cz-1/Cz+6; el resto sirven de referencia (Ref.Raabe, Cz''...). Catodal (negra): estimulación catódica, ahí van el GRID (habitualmente el 8) tras el phase reversal y el estimulador Raabe (habitualmente el 12).",
      "canales": 8,
      "numeracion_inicio": 5,
      "conector": "anodal_catodal"
    },
    "registro_cortical": {
      "nombre": "REF-AEP — Registro cortical, Erb, CvAnterior",
      "descripcion": "16 entradas individuales en dos columnas de 8, más Ref (habitualmente Fz) y GND. Los auditivos se registran con A1 y A2 en dos de las entradas numeradas; el conector amarillo de la caja es solo la conexión de los PEATC, no una entrada asignable.",
      "canales": 16,
      "conector": "individual_2col",
      "especiales": [
        { "clave": "ref", "nombre": "Ref", "conector": "individual", "nota": "Habitualmente Fz" },
        { "clave": "gnd", "nombre": "GND", "conector": "individual", "color": "verde" }
      ]
    },
    "registro_muscular_mmss": {
      "nombre": "Registro muscular — etiqueta 1",
      "descripcion": "Generalmente miembros superiores, aunque puede variar. Numerada 1-8.",
      "canales": 8,
      "numeracion_inicio": 1,
      "conector": "par",
      "especiales": [
        { "clave": "gnd", "nombre": "GND", "conector": "individual", "color": "verde" }
      ]
    },
    "registro_muscular_mmii": {
      "nombre": "Registro muscular — etiqueta 2",
      "descripcion": "Generalmente miembros inferiores, aunque puede variar. Continúa la numeración de la etiqueta 1 (9-16).",
      "canales": 8,
      "numeracion_inicio": 9,
      "conector": "par",
      "especiales": [
        { "clave": "gnd", "nombre": "GND", "conector": "individual", "color": "verde" }
      ]
    },
    "caja_etiqueta_3": {
      "nombre": "Caja etiqueta 3",
      "descripcion": "No se suele usar, disponible para cirugías más amplias.",
      "canales": 8,
      "numeracion_inicio": 1,
      "conector": "par",
      "especiales": [
        { "clave": "gnd", "nombre": "GND", "conector": "individual", "color": "verde" }
      ]
    },
    "caja_etiqueta_4": {
      "nombre": "Caja etiqueta 4",
      "descripcion": "No se suele usar, disponible para cirugías más amplias.",
      "canales": 8,
      "numeracion_inicio": 9,
      "conector": "par",
      "especiales": [
        { "clave": "gnd", "nombre": "GND", "conector": "individual", "color": "verde" }
      ]
    }
  },

  /* ------------------------------------------------------------------ *
   * ETIQUETAS (tipos físicos de material)
   *
   * Una etiqueta es "de qué está hecho" el ítem: aguja trenzada,
   * sacacorchos, pegatina... Es lo que se suma en el recuento del resumen
   * y lo que da el aspecto al chip, para reconocerlo de un vistazo.
   *
   *   borde  : solido | punteado | discontinuo | doble | grueso | ninguno
   *   color  : rojo | azul | verde | amarillo | negro | naranja | morado |
   *            turquesa | gris, o un hex tipo "#c04a2b"
   *   fondo  : el mismo juego de colores (tinte suave) o "ninguno"
   *
   * Un ítem puede sobreescribir cualquiera de los tres, y al colocarlo en
   * una entrada se le puede cambiar la etiqueta solo para ese escenario
   * (un A1 con sacacorchos en una cirugía y con aguja en otra).
   * ------------------------------------------------------------------ */
  /* "fungible": true  -> se gasta y se tira; entra en el coste de la cirugía.
     "fungible": false -> material reutilizable (sondas, gafas, auriculares).
                          Sale en el material a preparar, pero no suma importe.
     "precio"          -> euros por unidad. Se deja SIN rellenar a propósito:
                          los precios reales los pone el usuario desde el
                          gestor de etiquetas. Un precio inventado en una
                          herramienta que informa del coste de una cirugía es
                          peor que no tener el dato.
     Una etiqueta sin "fungible" se trata como fungible sin precio conocido. */
  "etiquetas": [
    { "id": "aguja_subdermica",     "nombre": "Aguja subdérmica",          "borde": "punteado",    "color": "azul",     "fondo": "azul",      "fungible": true },
    { "id": "aguja_trenzada",       "nombre": "Aguja trenzada (par)",      "borde": "discontinuo", "color": "azul",     "fondo": "azul",      "fungible": true },
    { "id": "aguja_monopolar",      "nombre": "Aguja monopolar",           "borde": "punteado",    "color": "turquesa", "fondo": "turquesa",  "fungible": true },
    { "id": "electrodo_sacacorchos","nombre": "Electrodo sacacorchos",     "borde": "solido",      "color": "morado",   "fondo": "morado",    "fungible": true },
    { "id": "hook_wire",            "nombre": "Electrodo Hook Wire",       "borde": "doble",       "color": "naranja",  "fondo": "naranja",   "fungible": true },
    { "id": "pegatinas",            "nombre": "Pegatinas (par)",           "borde": "solido",      "color": "verde",    "fondo": "verde",     "fungible": true },
    { "id": "adhesivo_eng",         "nombre": "Electrodo adhesivo de ENG", "borde": "solido",      "color": "turquesa", "fondo": "verde",     "fungible": true },
    { "id": "electrodo_grid",       "nombre": "Electrodo de grid",         "borde": "grueso",      "color": "rojo",     "fondo": "rojo",      "fungible": true },
    { "id": "electrodo_epidural",   "nombre": "Electrodo epidural",        "borde": "doble",       "color": "morado",   "fondo": "morado",    "fungible": true },
    { "id": "sensor_tubo",          "nombre": "Sensor de tubo orotraqueal","borde": "doble",       "color": "turquesa", "fondo": "turquesa",  "fungible": true },
    { "id": "gancho_j",             "nombre": "Electrodo gancho / J / Delta", "borde": "doble",    "color": "amarillo", "fondo": "amarillo",  "fungible": true },
    { "id": "manta_4_8",            "nombre": "Manta de 4/6/8 electrodos", "borde": "grueso",      "color": "verde",    "fondo": "verde",     "fungible": true },
    { "id": "manta_10",             "nombre": "Manta de >10 electrodos",   "borde": "grueso",      "color": "turquesa", "fondo": "turquesa",  "fungible": true },
    { "id": "electrodo_profundo",   "nombre": "Electrodo profundo",        "borde": "grueso",      "color": "morado",   "fondo": "morado",    "fungible": true },
    { "id": "bloqueo_mandibular",   "nombre": "Bloqueo mandibular",        "borde": "solido",      "color": "naranja",  "fondo": "ninguno",   "fungible": true },
    { "id": "proteccion_ocular",    "nombre": "Protección ocular",         "borde": "solido",      "color": "amarillo", "fondo": "ninguno",   "fungible": true },
    { "id": "tren_de_4",            "nombre": "Tren de 4 (TOF)",           "borde": "punteado",    "color": "verde",    "fondo": "ninguno",   "fungible": true },

    /* Reutilizable: se prepara, pero no se gasta y no suma al coste */
    { "id": "sonda_mapeo",          "nombre": "Sonda de mapeo cortical",   "borde": "grueso",      "color": "amarillo", "fondo": "amarillo",  "fungible": false },
    { "id": "sonda_raabe",          "nombre": "Sonda Raabe",               "borde": "grueso",      "color": "negro",    "fondo": "ninguno",   "fungible": false },
    { "id": "sonda_mono_esferica",  "nombre": "Sonda monopolar esférica",  "borde": "grueso",      "color": "gris",     "fondo": "ninguno",   "fungible": false },
    { "id": "sonda_mono_recta",     "nombre": "Sonda monopolar recta",     "borde": "grueso",      "color": "gris",     "fondo": "ninguno",   "fungible": false },
    { "id": "sonda_bip_concentrica","nombre": "Sonda bipolar concéntrica", "borde": "grueso",      "color": "negro",    "fondo": "ninguno",   "fungible": false },
    { "id": "sonda_bip_rectas",     "nombre": "Sonda bipolar de puntas rectas separadas", "borde": "grueso", "color": "negro", "fondo": "ninguno", "fungible": false },
    { "id": "sonda_bip_esfericas",  "nombre": "Sonda bipolar de puntas esféricas separadas", "borde": "grueso", "color": "negro", "fondo": "ninguno", "fungible": false },
    { "id": "sonda_bip_gancho",     "nombre": "Sonda bipolar de gancho",   "borde": "grueso",      "color": "naranja",  "fondo": "ninguno",   "fungible": false },
    { "id": "sonda_tripolar",       "nombre": "Sonda tripolar",            "borde": "grueso",      "color": "morado",   "fondo": "ninguno",   "fungible": false },
    { "id": "sonda_aspiracion",     "nombre": "Sonda de aspiración electrificada", "borde": "grueso", "color": "rojo",  "fondo": "ninguno",   "fungible": false },
    { "id": "pinza_estimulacion",   "nombre": "Pinza de estimulación",     "borde": "grueso",      "color": "amarillo", "fondo": "ninguno",   "fungible": false },
    { "id": "sonda_laparoscopica",  "nombre": "Sonda bipolar laparoscópica", "borde": "grueso",    "color": "turquesa", "fondo": "ninguno",   "fungible": false },
    { "id": "auriculares",          "nombre": "Auriculares PEATC",         "borde": "punteado",    "color": "gris",     "fondo": "ninguno",   "fungible": false },
    { "id": "gafas",                "nombre": "Gafas de estimulación VEP", "borde": "punteado",    "color": "gris",     "fondo": "ninguno",   "fungible": false },
    { "id": "discos_visuales",      "nombre": "Discos visuales",           "borde": "punteado",    "color": "morado",   "fondo": "ninguno",   "fungible": false },
    { "id": "bipolar_barra",        "nombre": "Bipolar barra / superficie ENG", "borde": "punteado", "color": "verde",  "fondo": "ninguno",   "fungible": false },
    { "id": "conmutador_sw",        "nombre": "Conmutador",                "borde": "solido",      "color": "gris",     "fondo": "ninguno",   "fungible": false },

    { "id": "sin_determinar",       "nombre": "Sin determinar",            "borde": "punteado",    "color": "rojo",     "fondo": "ninguno" }
  ],

  /* ------------------------------------------------------------------ *
   * CATÁLOGO MAESTRO DE MATERIAL
   * Añade aquí músculos / estímulos nuevos para futuras cirugías.
   * "etiqueta" es el tipo físico: lo que se cuenta en el resumen final.
   * ------------------------------------------------------------------ */
  "catalogo_material": [
    {
      "categoria": "Electrodos corticales — estimulación (TES)",
      "items": [
        { "id": "c1", "nombre": "C1", "color": "verde", "etiqueta": "electrodo_sacacorchos" },
        { "id": "c2", "nombre": "C2", "color": "amarillo", "etiqueta": "electrodo_sacacorchos" },
        { "id": "c3", "nombre": "C3", "color": "rojo", "etiqueta": "electrodo_sacacorchos" },
        { "id": "c4", "nombre": "C4", "color": "azul", "etiqueta": "electrodo_sacacorchos" },
        { "id": "c5", "nombre": "C5", "color": "verde", "etiqueta": "electrodo_sacacorchos", "nota": "Vías corticobulbares (pares craneales) — combinación principal junto a C6; admite otras con distintas referencias" },
        { "id": "c6", "nombre": "C6", "color": "amarillo", "etiqueta": "electrodo_sacacorchos", "nota": "Vías corticobulbares (pares craneales) — combinación principal junto a C5; admite otras con distintas referencias" },
        { "id": "cz_menos1", "nombre": "Cz-1", "etiqueta": "electrodo_sacacorchos" },
        { "id": "cz_mas6", "nombre": "Cz+6cm", "etiqueta": "electrodo_sacacorchos" },
        { "id": "mapping", "nombre": "Mapping", "etiqueta": "sonda_mapeo", "nota": "Mapeo cortical con técnica de Penfield" },
        { "id": "raabe_estim", "nombre": "Raabe (estímulo)", "color": "negro", "etiqueta": "sonda_raabe", "nota": "Estimulador cortical tipo aspiración — cátodo, columna catodal (negra) de TES MEP, habitualmente el canal 12. Su ánodo de referencia es Ref.Raabe" },
        {
          "id": "conmutador",
          "nombre": "Conmutador",
          "etiqueta": "conmutador_sw",
          "nota": "Ocupa una sola entrada anodal (habitualmente la 6)"
        }
      ]
    },
    {
      "categoria": "Electrodos corticales — registro",
      "items": [
        { "id": "cz_prima", "nombre": "Cz'", "etiqueta": "electrodo_sacacorchos" },
        { "id": "c3_prima", "nombre": "C3'", "color": "rojo", "etiqueta": "electrodo_sacacorchos" },
        { "id": "c4_prima", "nombre": "C4'", "color": "azul", "etiqueta": "electrodo_sacacorchos" },
        { "id": "fz", "nombre": "Fz", "etiqueta": "electrodo_sacacorchos", "nota": "Referencia habitual" },
        { "id": "cv2", "nombre": "Cv2", "etiqueta": "electrodo_sacacorchos" },
        { "id": "cz_doble_prima", "nombre": "Cz''", "etiqueta": "electrodo_sacacorchos", "nota": "Alternativa a Ref.Raabe (ánodo de referencia)" },
        { "id": "ref_raabe", "nombre": "Ref.Raabe", "color": "rojo", "etiqueta": "electrodo_sacacorchos", "nota": "Referencia del estimulador Raabe — ánodo (entrada roja)" }
      ]
    },
    {
      "categoria": "Registro cervical / plexo",
      "items": [
        { "id": "cvant", "nombre": "CvAnt", "color": "amarillo", "etiqueta": "aguja_subdermica", "nota": "Registro cervical anterior, monopolar" },
        { "id": "erb1", "nombre": "Erb1", "color": "rojo", "etiqueta": "aguja_trenzada", "media_unidad": true, "nota": "Punto de Erb — aguja roja del par trenzado (Erb1 + Erb2 = 1 paquete)" },
        { "id": "erb2", "nombre": "Erb2", "color": "negro", "etiqueta": "aguja_trenzada", "media_unidad": true, "nota": "Punto de Erb — aguja negra del par trenzado (Erb1 + Erb2 = 1 paquete)" }
      ]
    },
    {
      "categoria": "Músculos MMSS",
      "items": [
        { "id": "l_apb", "nombre": "L.APB", "etiqueta": "aguja_trenzada", "nota": "Abductor pollicis brevis izquierdo" },
        { "id": "r_apb", "nombre": "R.APB", "etiqueta": "aguja_trenzada", "nota": "Abductor pollicis brevis derecho" },
        { "id": "l_fdio", "nombre": "L.Fdio", "etiqueta": "aguja_trenzada", "nota": "1er interóseo dorsal izquierdo" },
        { "id": "r_fdio", "nombre": "R.Fdio", "etiqueta": "aguja_trenzada", "nota": "1er interóseo dorsal derecho" },
        { "id": "l_ext", "nombre": "L.E", "etiqueta": "aguja_trenzada", "nota": "Extensor izquierdo" },
        { "id": "r_ext", "nombre": "R.E", "etiqueta": "aguja_trenzada", "nota": "Extensor derecho" },
        { "id": "l_bcps", "nombre": "L.B", "etiqueta": "aguja_trenzada", "nota": "Bíceps izquierdo" },
        { "id": "r_bcps", "nombre": "R.B", "etiqueta": "aguja_trenzada", "nota": "Bíceps derecho" }
      ]
    },
    {
      "categoria": "Músculos craneales (pares craneales)",
      "items": [
        { "id": "l_mass", "nombre": "L.Mass", "etiqueta": "hook_wire", "nota": "Maseterino izquierdo — V par craneal" },
        { "id": "r_mass", "nombre": "R.Mass", "etiqueta": "hook_wire", "nota": "Maseterino derecho — V par craneal" },
        { "id": "l_ooc", "nombre": "L.OOc", "etiqueta": "hook_wire", "nota": "Orbicular de los párpados izquierdo — VII par; registro del Blink Reflex" },
        { "id": "r_ooc", "nombre": "R.OOc", "etiqueta": "hook_wire", "nota": "Orbicular de los párpados derecho — VII par; registro del Blink Reflex" },
        { "id": "l_ment", "nombre": "L.Ment", "etiqueta": "hook_wire", "nota": "Mentoniano izquierdo — VII par craneal" },
        { "id": "r_ment", "nombre": "R.Ment", "etiqueta": "hook_wire", "nota": "Mentoniano derecho — VII par craneal" },
        { "id": "l_crico", "nombre": "L.Crico", "etiqueta": "hook_wire", "nota": "Cricotiroideo izquierdo — X par; va junto a las cuerdas vocales en el mismo montaje; registro del reflejo trigémino-cervical. Sin confirmar: el crico evaluaría la parte motora y las cuerdas la sensitiva" },
        { "id": "r_crico", "nombre": "R.Crico", "etiqueta": "hook_wire", "nota": "Cricotiroideo derecho — X par; va junto a las cuerdas vocales en el mismo montaje; registro del reflejo trigémino-cervical. Sin confirmar: el crico evaluaría la parte motora y las cuerdas la sensitiva" },
        { "id": "vocal_1", "nombre": "Vocal 1", "etiqueta": "sensor_tubo", "media_unidad": true, "nota": "Cuerdas vocales — X par. Un único sensor de tubo orotraqueal con 2 entradas (Vocal 1 + Vocal 2 = 1 sensor). No se puede saber qué lado es cada una: depende de cómo quede colocado el tubo. Registro del reflejo trigémino-vocal" },
        { "id": "vocal_2", "nombre": "Vocal 2", "etiqueta": "sensor_tubo", "media_unidad": true, "nota": "Cuerdas vocales — X par. Un único sensor de tubo orotraqueal con 2 entradas (Vocal 1 + Vocal 2 = 1 sensor). No se puede saber qué lado es cada una: depende de cómo quede colocado el tubo. Registro del reflejo trigémino-vocal" },
        { "id": "l_stcm", "nombre": "L.STCM", "etiqueta": "hook_wire", "nota": "Esternocleidomastoideo izquierdo — XI par; registro del reflejo trigémino-cervical" },
        { "id": "r_stcm", "nombre": "R.STCM", "etiqueta": "hook_wire", "nota": "Esternocleidomastoideo derecho — XI par; registro del reflejo trigémino-cervical" }
      ]
    },
    {
      "categoria": "Músculos MMII",
      "items": [
        { "id": "l_q", "nombre": "L.Q", "etiqueta": "aguja_trenzada", "nota": "Cuádriceps izquierdo" },
        { "id": "r_q", "nombre": "R.Q", "etiqueta": "aguja_trenzada", "nota": "Cuádriceps derecho" },
        { "id": "l_ta", "nombre": "L.Ta", "etiqueta": "aguja_trenzada", "nota": "Tibial anterior izquierdo" },
        { "id": "r_ta", "nombre": "R.Ta", "etiqueta": "aguja_trenzada", "nota": "Tibial anterior derecho" },
        { "id": "l_ah", "nombre": "L.Ah", "etiqueta": "aguja_trenzada", "nota": "Abductor hallucis izquierdo" },
        { "id": "r_ah", "nombre": "R.Ah", "etiqueta": "aguja_trenzada", "nota": "Abductor hallucis derecho" },
        { "id": "l_g", "nombre": "L.G", "etiqueta": "aguja_trenzada", "nota": "Gastrocnemio medial izquierdo" },
        { "id": "r_g", "nombre": "R.G", "etiqueta": "aguja_trenzada", "nota": "Gastrocnemio medial derecho" }
      ]
    },
    {
      "categoria": "Estimulación periférica",
      "items": [
        { "id": "l_mediano", "nombre": "L.Mediano", "etiqueta": "pegatinas" },
        { "id": "r_mediano", "nombre": "R.Mediano", "etiqueta": "pegatinas" },
        { "id": "l_cubital", "nombre": "L.Cubital", "etiqueta": "pegatinas" },
        { "id": "r_cubital", "nombre": "R.Cubital", "etiqueta": "pegatinas" },
        { "id": "l_ptn", "nombre": "L.Tibial post.", "etiqueta": "pegatinas" },
        { "id": "r_ptn", "nombre": "R.Tibial post.", "etiqueta": "pegatinas" },
        { "id": "l_popliteo", "nombre": "L.Poplíteo (H)", "etiqueta": "pegatinas", "nota": "Hueco poplíteo — reflejo H" },
        { "id": "r_popliteo", "nombre": "R.Poplíteo (H)", "etiqueta": "pegatinas", "nota": "Hueco poplíteo — reflejo H" }
      ]
    },
    {
      "categoria": "Estimulación trigeminal (reflejos)",
      "items": [
        { "id": "l_v1", "nombre": "L.V1", "etiqueta": "aguja_trenzada", "nota": "Rama oftálmica izquierda del V par — Blink Reflex (registro en orbiculares oculi)" },
        { "id": "r_v1", "nombre": "R.V1", "etiqueta": "aguja_trenzada", "nota": "Rama oftálmica derecha del V par — Blink Reflex (registro en orbiculares oculi)" },
        { "id": "l_v2", "nombre": "L.V2", "etiqueta": "pegatinas", "nota": "Rama maxilar izquierda del V par — reflejo trigémino-cervical (registro en STCM y cricotiroideo)" },
        { "id": "r_v2", "nombre": "R.V2", "etiqueta": "pegatinas", "nota": "Rama maxilar derecha del V par — reflejo trigémino-cervical (registro en STCM y cricotiroideo)" },
        { "id": "l_v3", "nombre": "L.V3", "etiqueta": "aguja_trenzada", "nota": "Rama mandibular izquierda del V par — reflejo trigémino-vocal (registro en cuerdas vocales)" },
        { "id": "r_v3", "nombre": "R.V3", "etiqueta": "aguja_trenzada", "nota": "Rama mandibular derecha del V par — reflejo trigémino-vocal (registro en cuerdas vocales)" }
      ]
    },
    {
      "categoria": "GRID / estimulación directa",
      "items": [
        { "id": "grid1", "nombre": "GRID 1", "etiqueta": "electrodo_grid" },
        { "id": "grid2", "nombre": "GRID 2", "etiqueta": "electrodo_grid" },
        { "id": "grid3", "nombre": "GRID 3", "etiqueta": "electrodo_grid" },
        { "id": "grid4", "nombre": "GRID 4", "etiqueta": "electrodo_grid" },
        { "id": "grid5", "nombre": "GRID 5", "etiqueta": "electrodo_grid" },
        { "id": "grid6", "nombre": "GRID 6", "etiqueta": "electrodo_grid" },
        { "id": "grid7", "nombre": "GRID 7", "etiqueta": "electrodo_grid" },
        { "id": "grid8", "nombre": "GRID 8", "etiqueta": "electrodo_grid" },
        { "id": "dcs_v2", "nombre": "DCS / V2", "etiqueta": "sin_determinar", "nota": "Aparece rotulado en el canal 8 anodal de la caja real — función sin confirmar" },
        { "id": "hc", "nombre": "HC", "etiqueta": "sin_determinar", "nota": "Aparece rotulado en el canal 11 de la caja real — función sin confirmar" }
      ]
    },
    {
      "categoria": "Potenciales auditivos (PEATC)",
      "items": [
        { "id": "a1", "nombre": "A1", "etiqueta": "electrodo_sacacorchos", "nota": "Registro auditivo del lado izquierdo. Va en una de las entradas numeradas de REF-AEP" },
        { "id": "a2", "nombre": "A2", "etiqueta": "electrodo_sacacorchos", "nota": "Registro auditivo del lado derecho. Va en una de las entradas numeradas de REF-AEP" }
      ]
    },
    {
      "categoria": "Potenciales visuales (VEP)",
      "items": [
        { "id": "o1", "nombre": "O1", "etiqueta": "electrodo_sacacorchos", "nota": "Registro visual occipital izquierdo. Va en una de las entradas numeradas de REF-AEP" },
        { "id": "o2", "nombre": "O2", "etiqueta": "electrodo_sacacorchos", "nota": "Registro visual occipital derecho. Va en una de las entradas numeradas de REF-AEP" }
      ]
    },
    {
      "categoria": "Tierras y referencias",
      "items": [
        { "id": "tierra", "nombre": "Tierra", "etiqueta": "aguja_subdermica", "nota": "Una por caja de registro" }
      ]
    },
    {
      "categoria": "Otros electrodos corticales (scalp)",
      "items": [
        {"id":"sc_eeg_manta","nombre":"EEG Manta","etiqueta":"manta_4_8","nota":"Manta de electrodos para EEG continuo"},
        {"id":"sc_fp1","nombre":"Fp1","etiqueta":"aguja_subdermica","nota":"Frontopolar izquierdo"},
        {"id":"sc_fpz","nombre":"Fpz","etiqueta":"aguja_subdermica","nota":"Frontopolar medio"},
        {"id":"sc_fp2","nombre":"Fp2","etiqueta":"aguja_subdermica","nota":"Frontopolar derecho"},
        {"id":"sc_cz_6","nombre":"Cz-6","etiqueta":"aguja_subdermica","nota":"6 cm por detrás de Cz"},
        {"id":"sc_f7","nombre":"F7","etiqueta":"aguja_subdermica","nota":"Frontal inferior izquierdo"},
        {"id":"sc_f3","nombre":"F3","etiqueta":"aguja_subdermica","nota":"Frontal izquierdo"},
        {"id":"sc_f4","nombre":"F4","etiqueta":"aguja_subdermica","nota":"Frontal derecho"},
        {"id":"sc_f8","nombre":"F8","etiqueta":"aguja_subdermica","nota":"Frontal inferior derecho"},
        {"id":"sc_c5","nombre":"C5'","etiqueta":"aguja_subdermica","nota":"Central izquierdo (C5 prima)"},
        {"id":"sc_c6","nombre":"C6'","etiqueta":"aguja_subdermica","nota":"Central derecho (C6 prima)"},
        {"id":"sc_t3","nombre":"T3","etiqueta":"aguja_subdermica","nota":"Temporal medio izquierdo"},
        {"id":"sc_c3","nombre":"C3","etiqueta":"aguja_subdermica","nota":"Central izquierdo"},
        {"id":"sc_cz","nombre":"Cz","etiqueta":"aguja_subdermica","nota":"Vértex"},
        {"id":"sc_c4","nombre":"C4","etiqueta":"aguja_subdermica","nota":"Central derecho"},
        {"id":"sc_t4","nombre":"T4","etiqueta":"aguja_subdermica","nota":"Temporal medio derecho"},
        {"id":"sc_t5","nombre":"T5","etiqueta":"aguja_subdermica","nota":"Temporal posterior izquierdo"},
        {"id":"sc_p3","nombre":"P3","etiqueta":"aguja_subdermica","nota":"Parietal izquierdo"},
        {"id":"sc_pz","nombre":"Pz","etiqueta":"aguja_subdermica","nota":"Parietal medio"},
        {"id":"sc_p4","nombre":"P4","etiqueta":"aguja_subdermica","nota":"Parietal derecho"},
        {"id":"sc_t6","nombre":"T6","etiqueta":"aguja_subdermica","nota":"Temporal posterior derecho"},
        {"id":"sc_m1","nombre":"M1","etiqueta":"aguja_subdermica","nota":"Mastoides izquierda"},
        {"id":"sc_m2","nombre":"M2","etiqueta":"aguja_subdermica","nota":"Mastoides derecha"},
        {"id":"sc_oz_mo","nombre":"Oz (MO)","etiqueta":"aguja_subdermica","nota":"Occipital medio"},
        {"id":"sc_m3","nombre":"M3","etiqueta":"aguja_subdermica","nota":"Mastoides accesoria izquierda"},
        {"id":"sc_m4","nombre":"M4","etiqueta":"aguja_subdermica","nota":"Mastoides accesoria derecha"}
      ]
    },
    {
      "categoria": "Músculos craneales — ampliación",
      "items": [
        {"id":"l_rsup","nombre":"L.RSup","etiqueta":"hook_wire","nota":"Recto superior (oculomotor) izquierdo"},
        {"id":"r_rsup","nombre":"R.RSup","etiqueta":"hook_wire","nota":"Recto superior (oculomotor) derecho"},
        {"id":"l_rmed","nombre":"L.RMed","etiqueta":"hook_wire","nota":"Recto medio (oculomotor) izquierdo"},
        {"id":"r_rmed","nombre":"R.RMed","etiqueta":"hook_wire","nota":"Recto medio (oculomotor) derecho"},
        {"id":"l_rinf","nombre":"L.RInf","etiqueta":"hook_wire","nota":"Recto inferior (oculomotor) izquierdo"},
        {"id":"r_rinf","nombre":"R.RInf","etiqueta":"hook_wire","nota":"Recto inferior (oculomotor) derecho"},
        {"id":"l_oblsup","nombre":"L.OblSup","etiqueta":"hook_wire","nota":"Oblicuo superior (troclear) izquierdo"},
        {"id":"r_oblsup","nombre":"R.OblSup","etiqueta":"hook_wire","nota":"Oblicuo superior (troclear) derecho"},
        {"id":"l_rext","nombre":"L.RExt","etiqueta":"hook_wire","nota":"Recto externo (abducens) izquierdo"},
        {"id":"r_rext","nombre":"R.RExt","etiqueta":"hook_wire","nota":"Recto externo (abducens) derecho"},
        {"id":"l_v_t","nombre":"L.V-T","etiqueta":"hook_wire","nota":"Temporal — V par izquierdo"},
        {"id":"r_v_t","nombre":"R.V-T","etiqueta":"hook_wire","nota":"Temporal — V par derecho"},
        {"id":"l_frontalis","nombre":"L.Frontalis","etiqueta":"hook_wire","nota":"Frontal — VII par izquierdo"},
        {"id":"r_frontalis","nombre":"R.Frontalis","etiqueta":"hook_wire","nota":"Frontal — VII par derecho"},
        {"id":"l_nasalis","nombre":"L.Nasalis","etiqueta":"hook_wire","nota":"Nasal — VII par izquierdo"},
        {"id":"r_nasalis","nombre":"R.Nasalis","etiqueta":"hook_wire","nota":"Nasal — VII par derecho"},
        {"id":"l_oris","nombre":"L.Oris","etiqueta":"hook_wire","nota":"Orbicular de los labios — VII par izquierdo"},
        {"id":"r_oris","nombre":"R.Oris","etiqueta":"hook_wire","nota":"Orbicular de los labios — VII par derecho"},
        {"id":"l_platisma","nombre":"L.Platisma","etiqueta":"hook_wire","nota":"Platisma — VII par izquierdo"},
        {"id":"r_platisma","nombre":"R.Platisma","etiqueta":"hook_wire","nota":"Platisma — VII par derecho"},
        {"id":"l_estilofar","nombre":"L.Estilofar","etiqueta":"hook_wire","nota":"Estilofaríngeo — IX par izquierdo"},
        {"id":"r_estilofar","nombre":"R.Estilofar","etiqueta":"hook_wire","nota":"Estilofaríngeo — IX par derecho"},
        {"id":"l_trapecio","nombre":"L.Trapecio","etiqueta":"hook_wire","nota":"Trapecio — XI par izquierdo"},
        {"id":"r_trapecio","nombre":"R.Trapecio","etiqueta":"hook_wire","nota":"Trapecio — XI par derecho"},
        {"id":"l_gen","nombre":"L.GEN","etiqueta":"hook_wire","nota":"Geniohioideo izquierdo"},
        {"id":"r_gen","nombre":"R.GEN","etiqueta":"hook_wire","nota":"Geniohioideo derecho"},
        {"id":"l_len","nombre":"L.LEN","etiqueta":"hook_wire","nota":"Lengua — XII par izquierdo"},
        {"id":"r_len","nombre":"R.LEN","etiqueta":"hook_wire","nota":"Lengua — XII par derecho"}
      ]
    },
    {
      "categoria": "Músculos MMSS — ampliación",
      "items": [
        {"id":"l_supraes","nombre":"L.Supraes","etiqueta":"aguja_trenzada","nota":"Supraespinoso izquierdo"},
        {"id":"r_supraes","nombre":"R.Supraes","etiqueta":"aguja_trenzada","nota":"Supraespinoso derecho"},
        {"id":"l_infraes","nombre":"L.Infraes","etiqueta":"aguja_trenzada","nota":"Infraespinoso izquierdo"},
        {"id":"r_infraes","nombre":"R.Infraes","etiqueta":"aguja_trenzada","nota":"Infraespinoso derecho"},
        {"id":"l_serrato","nombre":"L.Serrato","etiqueta":"aguja_trenzada","nota":"Serrato anterior izquierdo"},
        {"id":"r_serrato","nombre":"R.Serrato","etiqueta":"aguja_trenzada","nota":"Serrato anterior derecho"},
        {"id":"l_delt","nombre":"L.Delt","etiqueta":"aguja_trenzada","nota":"Deltoides izquierdo"},
        {"id":"r_delt","nombre":"R.Delt","etiqueta":"aguja_trenzada","nota":"Deltoides derecho"},
        {"id":"l_triceps","nombre":"L.Triceps","etiqueta":"aguja_trenzada","nota":"Tríceps izquierdo"},
        {"id":"r_triceps","nombre":"R.Triceps","etiqueta":"aguja_trenzada","nota":"Tríceps derecho"},
        {"id":"l_br","nombre":"L.BR","etiqueta":"aguja_trenzada","nota":"Braquiorradial izquierdo"},
        {"id":"r_br","nombre":"R.BR","etiqueta":"aguja_trenzada","nota":"Braquiorradial derecho"},
        {"id":"l_fcu","nombre":"L.FCU","etiqueta":"aguja_trenzada","nota":"Flexor cubital del carpo izquierdo"},
        {"id":"r_fcu","nombre":"R.FCU","etiqueta":"aguja_trenzada","nota":"Flexor cubital del carpo derecho"},
        {"id":"l_fcr","nombre":"L.FCR","etiqueta":"aguja_trenzada","nota":"Flexor radial del carpo izquierdo"},
        {"id":"r_fcr","nombre":"R.FCR","etiqueta":"aguja_trenzada","nota":"Flexor radial del carpo derecho"},
        {"id":"l_adm","nombre":"L.ADM","etiqueta":"aguja_trenzada","nota":"Abductor del meñique izquierdo"},
        {"id":"r_adm","nombre":"R.ADM","etiqueta":"aguja_trenzada","nota":"Abductor del meñique derecho"}
      ]
    },
    {
      "categoria": "Músculos de tronco y periné",
      "items": [
        {"id":"l_diafragma","nombre":"L.Diafragma","etiqueta":"aguja_trenzada","nota":"Diafragma — nervio frénico izquierdo"},
        {"id":"r_diafragma","nombre":"R.Diafragma","etiqueta":"aguja_trenzada","nota":"Diafragma — nervio frénico derecho"},
        {"id":"l_ic","nombre":"L.IC","etiqueta":"aguja_trenzada","nota":"Intercostal izquierdo — registro muscular, T1-T4"},
        {"id":"r_ic","nombre":"R.IC","etiqueta":"aguja_trenzada","nota":"Intercostal derecho — registro muscular, T1-T4"},
        {"id":"l_ras","nombre":"L.RAS","etiqueta":"aguja_trenzada","nota":"Recto anterior superior izquierdo"},
        {"id":"r_ras","nombre":"R.RAS","etiqueta":"aguja_trenzada","nota":"Recto anterior superior derecho"},
        {"id":"l_ram","nombre":"L.RAM","etiqueta":"aguja_trenzada","nota":"Recto anterior medio izquierdo"},
        {"id":"r_ram","nombre":"R.RAM","etiqueta":"aguja_trenzada","nota":"Recto anterior medio derecho"},
        {"id":"l_rai","nombre":"L.RAI","etiqueta":"aguja_trenzada","nota":"Recto anterior inferior izquierdo"},
        {"id":"r_rai","nombre":"R.RAI","etiqueta":"aguja_trenzada","nota":"Recto anterior inferior derecho"},
        {"id":"l_oae","nombre":"L.OAE","etiqueta":"aguja_trenzada","nota":"Oblicuo abdominal externo izquierdo"},
        {"id":"r_oae","nombre":"R.OAE","etiqueta":"aguja_trenzada","nota":"Oblicuo abdominal externo derecho"},
        {"id":"l_cremaster","nombre":"L.Cremaster","etiqueta":"aguja_trenzada","nota":"Cremáster izquierdo"},
        {"id":"r_cremaster","nombre":"R.Cremaster","etiqueta":"aguja_trenzada","nota":"Cremáster derecho"},
        {"id":"l_cc","nombre":"L.CC","etiqueta":"aguja_trenzada","nota":"Esfínter anal / cavernoso-cavernoso izquierdo"},
        {"id":"r_cc","nombre":"R.CC","etiqueta":"aguja_trenzada","nota":"Esfínter anal / cavernoso-cavernoso derecho"}
      ]
    },
    {
      "categoria": "Músculos MMII — ampliación",
      "items": [
        {"id":"l_pso","nombre":"L.PSO","etiqueta":"aguja_trenzada","nota":"Psoas izquierdo"},
        {"id":"r_pso","nombre":"R.PSO","etiqueta":"aguja_trenzada","nota":"Psoas derecho"},
        {"id":"l_add","nombre":"L.ADD","etiqueta":"aguja_trenzada","nota":"Aductores izquierdo"},
        {"id":"r_add","nombre":"R.ADD","etiqueta":"aguja_trenzada","nota":"Aductores derecho"},
        {"id":"l_vl","nombre":"L.VL","etiqueta":"aguja_trenzada","nota":"Vasto lateral — cuádriceps izquierdo"},
        {"id":"r_vl","nombre":"R.VL","etiqueta":"aguja_trenzada","nota":"Vasto lateral — cuádriceps derecho"},
        {"id":"l_vm","nombre":"L.VM","etiqueta":"aguja_trenzada","nota":"Vasto medial — cuádriceps izquierdo"},
        {"id":"r_vm","nombre":"R.VM","etiqueta":"aguja_trenzada","nota":"Vasto medial — cuádriceps derecho"},
        {"id":"l_pl","nombre":"L.PL","etiqueta":"aguja_trenzada","nota":"Peroneo largo izquierdo"},
        {"id":"r_pl","nombre":"R.PL","etiqueta":"aguja_trenzada","nota":"Peroneo largo derecho"},
        {"id":"l_ehb","nombre":"L.EHB","etiqueta":"aguja_trenzada","nota":"Extensor corto de los dedos / extensor brevis izquierdo"},
        {"id":"r_ehb","nombre":"R.EHB","etiqueta":"aguja_trenzada","nota":"Extensor corto de los dedos / extensor brevis derecho"},
        {"id":"l_eae","nombre":"L.EAE","etiqueta":"aguja_trenzada","nota":"Extensor largo de los dedos izquierdo"},
        {"id":"r_eae","nombre":"R.EAE","etiqueta":"aguja_trenzada","nota":"Extensor largo de los dedos derecho"},
        {"id":"l_eai","nombre":"L.EAI","etiqueta":"aguja_trenzada","nota":"Interóseos del pie izquierdo"},
        {"id":"r_eai","nombre":"R.EAI","etiqueta":"aguja_trenzada","nota":"Interóseos del pie derecho"}
      ]
    },
    {
      "categoria": "Nervios",
      "items": [
        {"id":"l_iii","nombre":"L.III","etiqueta":"aguja_trenzada","nota":"III par — oculomotor izquierdo"},
        {"id":"r_iii","nombre":"R.III","etiqueta":"aguja_trenzada","nota":"III par — oculomotor derecho"},
        {"id":"l_iv","nombre":"L.IV","etiqueta":"aguja_trenzada","nota":"IV par — troclear izquierdo"},
        {"id":"r_iv","nombre":"R.IV","etiqueta":"aguja_trenzada","nota":"IV par — troclear derecho"},
        {"id":"l_vi","nombre":"L.VI","etiqueta":"aguja_trenzada","nota":"VI par — abducens izquierdo"},
        {"id":"r_vi","nombre":"R.VI","etiqueta":"aguja_trenzada","nota":"VI par — abducens derecho"},
        {"id":"l_n_temporal","nombre":"L.N.Temporal","etiqueta":"aguja_trenzada","nota":"Rama temporal del facial izquierdo"},
        {"id":"r_n_temporal","nombre":"R.N.Temporal","etiqueta":"aguja_trenzada","nota":"Rama temporal del facial derecho"},
        {"id":"l_n_cigomatica","nombre":"L.N.Cigomatica","etiqueta":"aguja_trenzada","nota":"Rama cigomática del facial izquierdo"},
        {"id":"r_n_cigomatica","nombre":"R.N.Cigomatica","etiqueta":"aguja_trenzada","nota":"Rama cigomática del facial derecho"},
        {"id":"l_n_nasobucal","nombre":"L.N.Nasobucal","etiqueta":"aguja_trenzada","nota":"Rama nasobucal del facial izquierdo"},
        {"id":"r_n_nasobucal","nombre":"R.N.Nasobucal","etiqueta":"aguja_trenzada","nota":"Rama nasobucal del facial derecho"},
        {"id":"l_n_mandibular","nombre":"L.N.Mandibular","etiqueta":"aguja_trenzada","nota":"Rama mandibular del facial izquierdo"},
        {"id":"r_n_mandibular","nombre":"R.N.Mandibular","etiqueta":"aguja_trenzada","nota":"Rama mandibular del facial derecho"},
        {"id":"l_n_cervical","nombre":"L.N.Cervical","etiqueta":"aguja_trenzada","nota":"Rama cervical del facial izquierdo"},
        {"id":"r_n_cervical","nombre":"R.N.Cervical","etiqueta":"aguja_trenzada","nota":"Rama cervical del facial derecho"},
        {"id":"l_n_acustico","nombre":"L.N.Acustico","etiqueta":"aguja_trenzada","nota":"Nervio acústico — VIII par izquierdo"},
        {"id":"r_n_acustico","nombre":"R.N.Acustico","etiqueta":"aguja_trenzada","nota":"Nervio acústico — VIII par derecho"},
        {"id":"l_n_vestibular","nombre":"L.N.Vestibular","etiqueta":"aguja_trenzada","nota":"Nervio vestibular — VIII par izquierdo"},
        {"id":"r_n_vestibular","nombre":"R.N.Vestibular","etiqueta":"aguja_trenzada","nota":"Nervio vestibular — VIII par derecho"},
        {"id":"l_n_vago","nombre":"L.N.Vago","etiqueta":"aguja_trenzada","nota":"Nervio vago — X par izquierdo"},
        {"id":"r_n_vago","nombre":"R.N.Vago","etiqueta":"aguja_trenzada","nota":"Nervio vago — X par derecho"},
        {"id":"l_nls","nombre":"L.NLS","etiqueta":"aguja_trenzada","nota":"Nervio laríngeo superior izquierdo"},
        {"id":"r_nls","nombre":"R.NLS","etiqueta":"aguja_trenzada","nota":"Nervio laríngeo superior derecho"},
        {"id":"l_nlr","nombre":"L.NLR","etiqueta":"aguja_trenzada","nota":"Nervio laríngeo recurrente izquierdo"},
        {"id":"r_nlr","nombre":"R.NLR","etiqueta":"aguja_trenzada","nota":"Nervio laríngeo recurrente derecho"},
        {"id":"l_n_espinal","nombre":"L.N.Espinal","etiqueta":"aguja_trenzada","nota":"Nervio espinal — XI par izquierdo"},
        {"id":"r_n_espinal","nombre":"R.N.Espinal","etiqueta":"aguja_trenzada","nota":"Nervio espinal — XI par derecho"},
        {"id":"l_n_hipogloso","nombre":"L.N.Hipogloso","etiqueta":"aguja_trenzada","nota":"Nervio hipogloso — XII par izquierdo"},
        {"id":"r_n_hipogloso","nombre":"R.N.Hipogloso","etiqueta":"aguja_trenzada","nota":"Nervio hipogloso — XII par derecho"},
        {"id":"l_n_supraescap","nombre":"L.N.Supraescap","etiqueta":"aguja_trenzada","nota":"Nervio supraescapular izquierdo"},
        {"id":"r_n_supraescap","nombre":"R.N.Supraescap","etiqueta":"aguja_trenzada","nota":"Nervio supraescapular derecho"},
        {"id":"l_n_axilar","nombre":"L.N.Axilar","etiqueta":"aguja_trenzada","nota":"Nervio axilar izquierdo"},
        {"id":"r_n_axilar","nombre":"R.N.Axilar","etiqueta":"aguja_trenzada","nota":"Nervio axilar derecho"},
        {"id":"l_mc","nombre":"L.MC","etiqueta":"aguja_trenzada","nota":"Nervio musculocutáneo izquierdo"},
        {"id":"r_mc","nombre":"R.MC","etiqueta":"aguja_trenzada","nota":"Nervio musculocutáneo derecho"},
        {"id":"l_n_radial","nombre":"L.N.Radial","etiqueta":"aguja_trenzada","nota":"Nervio radial izquierdo"},
        {"id":"r_n_radial","nombre":"R.N.Radial","etiqueta":"aguja_trenzada","nota":"Nervio radial derecho"},
        {"id":"l_n_mediano","nombre":"L.N.Mediano","etiqueta":"aguja_trenzada","nota":"Nervio mediano izquierdo"},
        {"id":"r_n_mediano","nombre":"R.N.Mediano","etiqueta":"aguja_trenzada","nota":"Nervio mediano derecho"},
        {"id":"l_n_cubital","nombre":"L.N.Cubital","etiqueta":"aguja_trenzada","nota":"Nervio cubital izquierdo"},
        {"id":"r_n_cubital","nombre":"R.N.Cubital","etiqueta":"aguja_trenzada","nota":"Nervio cubital derecho"},
        {"id":"l_n_toracicol","nombre":"L.N.ToracicoL","etiqueta":"aguja_trenzada","nota":"Nervio torácico largo izquierdo"},
        {"id":"r_n_toracicol","nombre":"R.N.ToracicoL","etiqueta":"aguja_trenzada","nota":"Nervio torácico largo derecho"},
        {"id":"l_n_ic","nombre":"L.N.IC","etiqueta":"aguja_trenzada","nota":"Nervio intercostal izquierdo"},
        {"id":"r_n_ic","nombre":"R.N.IC","etiqueta":"aguja_trenzada","nota":"Nervio intercostal derecho"},
        {"id":"l_iing","nombre":"L.IING","etiqueta":"aguja_trenzada","nota":"Nervio ilioinguinal izquierdo"},
        {"id":"r_iing","nombre":"R.IING","etiqueta":"aguja_trenzada","nota":"Nervio ilioinguinal derecho"},
        {"id":"l_ih","nombre":"L.IH","etiqueta":"aguja_trenzada","nota":"Nervio iliohipogástrico izquierdo"},
        {"id":"r_ih","nombre":"R.IH","etiqueta":"aguja_trenzada","nota":"Nervio iliohipogástrico derecho"},
        {"id":"l_gc","nombre":"L.GC","etiqueta":"aguja_trenzada","nota":"Nervio genitofemoral izquierdo"},
        {"id":"r_gc","nombre":"R.GC","etiqueta":"aguja_trenzada","nota":"Nervio genitofemoral derecho"},
        {"id":"l_fc","nombre":"L.FC","etiqueta":"aguja_trenzada","nota":"Nervio femorocutáneo izquierdo"},
        {"id":"r_fc","nombre":"R.FC","etiqueta":"aguja_trenzada","nota":"Nervio femorocutáneo derecho"},
        {"id":"l_n_safeno","nombre":"L.N.Safeno","etiqueta":"aguja_trenzada","nota":"Nervio safeno izquierdo"},
        {"id":"r_n_safeno","nombre":"R.N.Safeno","etiqueta":"aguja_trenzada","nota":"Nervio safeno derecho"},
        {"id":"l_n_tibialpost","nombre":"L.N.TibialPost","etiqueta":"aguja_trenzada","nota":"Nervio tibial posterior izquierdo"},
        {"id":"r_n_tibialpost","nombre":"R.N.TibialPost","etiqueta":"aguja_trenzada","nota":"Nervio tibial posterior derecho"},
        {"id":"l_n_peroneal","nombre":"L.N.Peroneal","etiqueta":"aguja_trenzada","nota":"Nervio peroneal izquierdo"},
        {"id":"r_n_peroneal","nombre":"R.N.Peroneal","etiqueta":"aguja_trenzada","nota":"Nervio peroneal derecho"},
        {"id":"l_n_sural","nombre":"L.N.Sural","etiqueta":"aguja_trenzada","nota":"Nervio sural izquierdo"},
        {"id":"r_n_sural","nombre":"R.N.Sural","etiqueta":"aguja_trenzada","nota":"Nervio sural derecho"},
        {"id":"l_n_pudendo","nombre":"L.N.Pudendo","etiqueta":"aguja_trenzada","nota":"Nervio pudendo izquierdo"},
        {"id":"r_n_pudendo","nombre":"R.N.Pudendo","etiqueta":"aguja_trenzada","nota":"Nervio pudendo derecho"}
      ]
    },
    {
      "categoria": "Reflejos",
      "items": [
        {"id":"l_blinkr","nombre":"L.BlinkR","etiqueta":"aguja_trenzada","nota":"Blink Reflex izquierdo"},
        {"id":"r_blinkr","nombre":"R.BlinkR","etiqueta":"aguja_trenzada","nota":"Blink Reflex derecho"},
        {"id":"l_rx_maset","nombre":"L.Rx.Maset","etiqueta":"aguja_trenzada","nota":"Reflejo maseterino izquierdo"},
        {"id":"r_rx_maset","nombre":"R.Rx.Maset","etiqueta":"aguja_trenzada","nota":"Reflejo maseterino derecho"},
        {"id":"l_rx_v_xii","nombre":"L.Rx.V-XII","etiqueta":"aguja_trenzada","nota":"Reflejo V-XII izquierdo"},
        {"id":"r_rx_v_xii","nombre":"R.Rx.V-XII","etiqueta":"aguja_trenzada","nota":"Reflejo V-XII derecho"},
        {"id":"l_lar","nombre":"L.LAR","etiqueta":"aguja_trenzada","nota":"Laryngeal Adductor Reflex izquierdo"},
        {"id":"r_lar","nombre":"R.LAR","etiqueta":"aguja_trenzada","nota":"Laryngeal Adductor Reflex derecho"},
        {"id":"l_rx_h","nombre":"L.Rx.H","etiqueta":"aguja_trenzada","nota":"Reflejo H izquierdo"},
        {"id":"r_rx_h","nombre":"R.Rx.H","etiqueta":"aguja_trenzada","nota":"Reflejo H derecho"},
        {"id":"l_rbc","nombre":"L.RBC","etiqueta":"aguja_trenzada","nota":"Reflejo bulbo-cavernoso izquierdo"},
        {"id":"r_rbc","nombre":"R.RBC","etiqueta":"aguja_trenzada","nota":"Reflejo bulbo-cavernoso derecho"}
      ]
    },
    {
      "categoria": "Otros puntos de registro",
      "items": [
        {"id":"l_p_cervical","nombre":"L.P.Cervical","etiqueta":"aguja_subdermica","nota":"Punto de registro cervical izquierdo"},
        {"id":"r_p_cervical","nombre":"R.P.Cervical","etiqueta":"aguja_subdermica","nota":"Punto de registro cervical derecho"},
        {"id":"l_p_popliteo","nombre":"L.P.Popliteo","etiqueta":"aguja_subdermica","nota":"Registro en hueco poplíteo izquierdo"},
        {"id":"r_p_popliteo","nombre":"R.P.Popliteo","etiqueta":"aguja_subdermica","nota":"Registro en hueco poplíteo derecho"},
        {"id":"l_p_lumbar","nombre":"L.P.Lumbar","etiqueta":"aguja_subdermica","nota":"Punto de registro lumbar izquierdo"},
        {"id":"r_p_lumbar","nombre":"R.P.Lumbar","etiqueta":"aguja_subdermica","nota":"Punto de registro lumbar derecho"}
      ]
    },
    {
      "categoria": "Material extra (no ocupa entrada)",
      "sin_entrada": true,
      "items": [
        { "id": "auriculares_peatc", "nombre": "Auriculares PEATC", "etiqueta": "auriculares", "nota": "Estimulación auditiva para los PEATC (A1/A2). Se conectan al conector amarillo de REF-AEP, no ocupan entrada" },
        { "id": "gafas_vep", "nombre": "Gafas VEP", "etiqueta": "gafas", "nota": "Estimulación visual para los potenciales visuales (O1/O2). No ocupan entrada" }
      ]
    }
  ],

  /* ------------------------------------------------------------------ *
   * TÉCNICAS
   * Cada escenario marca las que se van a usar. Solo son informativas
   * (no calculan material por sí solas), pero ayudan a decidir qué
   * montar y quedan impresas en el resumen.
   * ------------------------------------------------------------------ */
  "tecnicas": [
    { "id": "t_pess", "etiqueta": "t-SEP", "grupo": "monitorizacion", "activa": true, "descripcion": "PESS transcraneales" },
    { "id": "t_pem", "etiqueta": "t-MEP", "grupo": "monitorizacion", "activa": true, "descripcion": "Potenciales evocados motores transcraneales" },
    { "id": "c_pem", "etiqueta": "c-MEP", "grupo": "monitorizacion", "activa": true, "descripcion": "PEM por estímulo directo cortical" },
    { "id": "c_pess", "etiqueta": "c-SEP", "grupo": "monitorizacion", "activa": true, "descripcion": "PESS corticales" },
    { "id": "pem_corticobulbares", "etiqueta": "MEP córtico-bulbares", "grupo": "monitorizacion", "activa": true, "descripcion": "Vías corticobulbares (pares craneales)" },
    { "id": "onda_d", "etiqueta": "Onda D", "grupo": "monitorizacion", "activa": true, "descripcion": "Registro epidural de la onda D" },
    { "id": "br", "etiqueta": "Blink Reflex (BR)", "grupo": "monitorizacion", "activa": true, "descripcion": "Reflejo del parpadeo" },
    { "id": "rbc", "etiqueta": "RBC", "grupo": "monitorizacion", "activa": true, "descripcion": "Reflejo bulbo-cavernoso" },
    { "id": "peatc", "etiqueta": "PEATC", "grupo": "monitorizacion", "activa": true, "descripcion": "Potenciales evocados auditivos de tronco cerebral" },
    { "id": "emg", "etiqueta": "Free-EMG", "grupo": "monitorizacion", "activa": true, "descripcion": "Electromiografía" },
    { "id": "eeg", "etiqueta": "EEG", "grupo": "monitorizacion", "activa": true, "descripcion": "Electroencefalografía" },
    { "id": "ecog", "etiqueta": "ECoG", "grupo": "monitorizacion", "activa": true, "descripcion": "Electrocorticografía" },
    { "id": "pev", "etiqueta": "PEV", "grupo": "monitorizacion", "activa": true, "descripcion": "Potenciales evocados visuales — en estudio" },
    { "id": "reflejo_h", "etiqueta": "Reflejo H", "grupo": "monitorizacion", "activa": true, "descripcion": "Reflejo H por estímulo en hueco poplíteo" },

    /* Añadidas de la lista del usuario. Van con su etiqueta exacta y SIN
       descripción: expandir una abreviatura a ojo en una herramienta clínica
       es peor que dejarla en blanco. Se rellenan desde el diálogo Catálogos
       sin tocar este archivo. */
    { "id": "eng_continua", "etiqueta": "ENG continua", "grupo": "monitorizacion", "activa": true },
    { "id": "retino", "etiqueta": "Retino", "grupo": "monitorizacion", "activa": true },
    { "id": "pan", "etiqueta": "PAN", "grupo": "monitorizacion", "activa": true },
    { "id": "onda_f_facial", "etiqueta": "Onda F Facial", "grupo": "monitorizacion", "activa": true },
    { "id": "lsr", "etiqueta": "LSR", "grupo": "monitorizacion", "activa": true },
    { "id": "prm", "etiqueta": "PRM", "grupo": "monitorizacion", "activa": true },
    { "id": "arm", "etiqueta": "ARM", "grupo": "monitorizacion", "activa": true },

    /* Reflejos de tronco. Van sueltos y no dentro de un "Reflejos" genérico
       porque cada uno se monitoriza por su cuenta y con su propio montaje;
       agrupados no se podría marcar cuál se hizo de verdad.
       El Blink Reflex, el RBC y el Reflejo H ya estaban más arriba. */
    { "id": "rx_mandibular", "etiqueta": "Reflejo mandibular (jaw jerk)", "grupo": "monitorizacion", "activa": true },
    { "id": "rx_inhib_maseterino", "etiqueta": "Reflejo inhibitorio del masetero", "grupo": "monitorizacion", "activa": true },
    { "id": "rx_tvcr", "etiqueta": "Reflejo trigémino-vocal (TVcR)", "grupo": "monitorizacion", "activa": true },
    { "id": "rx_thr", "etiqueta": "Reflejo trigémino-hipogloso (THR)", "grupo": "monitorizacion", "activa": true },
    { "id": "rx_tcr", "etiqueta": "Reflejo trigémino-cervical (TCR)", "grupo": "monitorizacion", "activa": true },
    { "id": "rx_lar", "etiqueta": "Reflejo laríngeo aductor (LAR)", "grupo": "monitorizacion", "activa": true },
    { "id": "rx_glosofaringeo_trigeminal", "etiqueta": "Reflejo glosofaríngeo-trigeminal", "grupo": "monitorizacion", "activa": true },

    { "id": "mapeo_cortical", "etiqueta": "Mapeo cortical", "grupo": "mapeo", "activa": true, "descripcion": "Técnica de Penfield" },
    { "id": "mapeo_subcortical", "etiqueta": "Mapeo subcortical", "grupo": "mapeo", "activa": true },
    { "id": "phase_reversal", "etiqueta": "Phase-Reversal", "grupo": "mapeo", "activa": true, "descripcion": "Inversión de fase de los PESS" },
    { "id": "mapeo_lenguaje", "etiqueta": "Mapeo del lenguaje", "grupo": "mapeo", "activa": true },
    { "id": "mapeo_iv_ventriculo", "etiqueta": "Mapeo del IV ventrículo", "grupo": "mapeo", "activa": true, "descripcion": "Núcleos del suelo del IV ventrículo" },
    { "id": "mapeo_columnas_dorsales", "etiqueta": "Mapeo de columnas dorsales", "grupo": "mapeo", "activa": true },
    { "id": "mapeo_raices_tornillos", "etiqueta": "Mapeo de raíces y tornillos", "grupo": "mapeo", "activa": true, "descripcion": "Raíces y tornillos pediculares" },
    { "id": "mapeo_nervio_periferico", "etiqueta": "Mapeo de nervio periférico", "grupo": "mapeo", "activa": true },

    /* Igual que arriba: etiqueta literal, sin descripción inventada.
       "Pedicular" y "Tornillos" NO se añaden por separado a propósito: ya
       existe "Mapeo de raíces y tornillos" y dos técnicas que significan lo
       mismo partirían en dos las estadísticas del histórico. Si de verdad
       son cosas distintas, se separan desde el diálogo Catálogos. */
    { "id": "mapeo_intramedular_ce", "etiqueta": "Intramedular CE", "grupo": "mapeo", "activa": true },
    { "id": "mapeo_material_qx", "etiqueta": "Material Qx", "grupo": "mapeo", "activa": true },
    { "id": "eog", "etiqueta": "EOG", "grupo": "mapeo", "activa": true }
  ],

  /* ------------------------------------------------------------------ *
   * TIPOS DE CIRUGÍA (ESCENARIOS)
   * Lista corta y cerrada que agrupa los montajes personales. No describe
   * la intervención concreta —de eso se encarga "intervenciones", que lleva
   * el código del hospital—, sino el tipo de escenario que se monta.
   * Catálogo editable: se amplía desde el diálogo Catálogos.
   * ------------------------------------------------------------------ */
  "escenarios_tipo": [
    { "id": "esc_tumor_st",    "nombre": "Tumor ST",      "activa": true, "descripcion": "Tumor supratentorial" },
    { "id": "esc_tumor_it",    "nombre": "Tumor IT",      "activa": true, "descripcion": "Tumor infratentorial" },
    { "id": "esc_tumor_med",   "nombre": "Tumor Medular", "activa": true },
    { "id": "esc_awake",       "nombre": "Awake surgery", "activa": true, "descripcion": "Cirugía con paciente despierto" },
    { "id": "esc_ecc",         "nombre": "ECC",           "activa": true, "descripcion": "Estenosis del canal cervical" },
    { "id": "esc_ecl",         "nombre": "ECL",           "activa": true, "descripcion": "Estenosis del canal lumbar" },
    { "id": "esc_mav",         "nombre": "MAV",           "activa": true, "descripcion": "Malformación arteriovenosa" },
    { "id": "esc_escoliosis",  "nombre": "Escoliosis",    "activa": true }
  ],

  /* ------------------------------------------------------------------ *
   * MIOTOMAS — solo para la ventana docente
   *
   * Qué músculo depende de qué raíces. La mayoría de las entradas siguen la
   * tabla consolidada que dio el usuario (18-08-2026), a partir de:
   *   - Toleikis/Deletis, 2nd ed., cap. 13 — y Leppänen 2005/2006 (ASNM):
   *     músculos y niveles de partida, marcados como "[TD/L]" en la nota.
   *   - Schirmer 2011 y London 2022 (J Neurosurg Spine): frecuencia de
   *     solapamiento entre niveles, marcados como "[Sch]" / "[Lon]".
   * Estas SÍ son referencia clínica citada, no un punto de partida a discutir.
   *
   * Las entradas sin ninguna de esas marcas (diafragma, supraespinoso,
   * infraespinoso, braquiorradial, flexor cubital del carpo, interóseos de
   * la mano, cremáster, cuádriceps genérico, extensor corto de los dedos,
   * abductor del hallux) son las que ya había antes de esa tabla: rangos
   * habituales de enseñanza, sin cita concreta detrás. Se dejan porque siguen
   * siendo válidas y amplían la cobertura, pero con menos rigor que las
   * citadas — están para discutirlas y corregirlas.
   *
   * "item" enlaza con el catálogo de material cuando existe el músculo, para
   * que lo que se elige aquí se reconozca luego en las cajas.
   * ------------------------------------------------------------------ */
  "miotomas": [
    { "id": "mio_ecm",        "nombre": "Esternocleidomastoideo", "niveles": ["C2", "C3", "C4"], "item": "l_stcm",
      "nota": "Por la rama espinal del XI par, igual que el trapecio. [TD/L]" },
    { "id": "mio_trapecio",   "nombre": "Trapecio",            "niveles": ["C2", "C3", "C4"], "item": "l_trapecio",
      "nota": "Por la rama espinal del XI par, igual que el ECM. [TD/L]" },
    { "id": "mio_diafragma",  "nombre": "Diafragma",           "niveles": ["C3", "C4", "C5"], "item": "l_diafragma" },
    { "id": "mio_supraes",    "nombre": "Supraespinoso",       "niveles": ["C5", "C6"], "item": "l_supraes" },
    { "id": "mio_infraes",    "nombre": "Infraespinoso",       "niveles": ["C5", "C6"], "item": "l_infraes" },
    { "id": "mio_deltoides",  "nombre": "Deltoides",           "niveles": ["C5", "C6"], "item": "l_delt",
      "nota": "No se aísla por raíz individual: se monitoriza junto al bíceps en este bloque, porque la dominancia C5 vs C6 varía entre pacientes. [TD/L]" },
    { "id": "mio_biceps",     "nombre": "Bíceps",              "niveles": ["C5", "C6"], "item": "l_bcps",
      "nota": "No se aísla por raíz individual: se monitoriza junto al deltoides en este bloque, porque la dominancia C5 vs C6 varía entre pacientes. [TD/L]" },
    { "id": "mio_br",         "nombre": "Braquiorradial",      "niveles": ["C5", "C6"], "item": "l_br" },
    { "id": "mio_fcr",        "nombre": "Flexor radial del carpo", "niveles": ["C6", "C7"], "item": "l_fcr",
      "nota": "Se monitoriza junto al tríceps en este bloque. [TD/L]" },
    { "id": "mio_triceps",    "nombre": "Tríceps",             "niveles": ["C6", "C7"], "item": "l_triceps",
      "nota": "Se monitoriza junto al flexor radial del carpo en este bloque. [TD/L]" },
    { "id": "mio_ecd",        "nombre": "Extensor común de los dedos", "niveles": ["C7", "C8"], "item": "l_ext" },
    { "id": "mio_fcu",        "nombre": "Flexor cubital del carpo", "niveles": ["C7", "C8", "T1"], "item": "l_fcu" },
    { "id": "mio_apb",        "nombre": "Abductor corto del pulgar", "niveles": ["C8", "T1"], "item": "l_apb",
      "nota": "Se monitoriza junto al abductor del meñique en este bloque. [TD/L]" },
    { "id": "mio_adm",        "nombre": "Abductor del meñique", "niveles": ["C8", "T1"], "item": "l_adm",
      "nota": "Se monitoriza junto al abductor corto del pulgar en este bloque. [TD/L]" },
    { "id": "mio_interoseos", "nombre": "Interóseos de la mano", "niveles": ["C8", "T1"], "item": "l_fdio" },
    { "id": "mio_intercostales", "nombre": "Intercostales",   "niveles": ["T1", "T2", "T3", "T4"], "item": "l_ic",
      "nota": "Único músculo de este bloque troncal: por debajo de T4 el registro pasa a los rectos abdominales, con los intercostales todavía presentes de acompañamiento. [TD/L]" },
    { "id": "mio_ras",        "nombre": "Recto anterior superior", "niveles": ["T5", "T6"], "item": "l_ras",
      "nota": "Más intercostales en ese nivel, de acompañamiento. [TD/L]" },
    { "id": "mio_ram",        "nombre": "Recto anterior medio", "niveles": ["T7", "T8"], "item": "l_ram",
      "nota": "Más intercostales en ese nivel, de acompañamiento. [TD/L]" },
    { "id": "mio_rai",        "nombre": "Recto anterior inferior", "niveles": ["T9", "T10", "T11", "T12"], "item": "l_rai",
      "nota": "T9-T11 con intercostales de acompañamiento; T12 es la porción más caudal, ya sin intercostal propiamente dicho (nervio subcostal). [TD/L]" },
    { "id": "mio_oae",        "nombre": "Oblicuo abdominal externo", "niveles": ["T8", "T9", "T10", "T11", "T12"], "item": "l_oae" },
    { "id": "mio_cremaster",  "nombre": "Cremáster",           "niveles": ["L1", "L2"], "item": "l_cremaster" },
    { "id": "mio_psoas",      "nombre": "Psoas",               "niveles": ["L1"], "item": "l_pso",
      "nota": "Raíz aislada: no se agrupa con L2, a diferencia de otros músculos de la zona. [TD/L]" },
    { "id": "mio_aductores",  "nombre": "Aductores (aductor mayor)", "niveles": ["L2", "L3"], "item": "l_add",
      "nota": "Aductor mayor específicamente. [TD/L]" },
    { "id": "mio_cuadriceps", "nombre": "Cuádriceps",          "niveles": ["L2", "L3", "L4"], "item": "l_q" },
    { "id": "mio_vl",         "nombre": "Vasto lateral",       "niveles": ["L3", "L4"], "item": "l_vl" },
    { "id": "mio_vm",         "nombre": "Vasto medial",        "niveles": ["L3", "L4"], "item": "l_vm",
      "nota": "Leppänen amplía el rango a L2-L3-L4. Al estimular L3 se activa el cuádriceps con más frecuencia que ningún otro músculo, pero también el aductor y el iliopsoas en una proporción no despreciable de casos. [TD/L] [Sch]" },
    { "id": "mio_ta",         "nombre": "Tibial anterior",     "niveles": ["L4", "L5"], "item": "l_ta",
      "nota": "Leppänen amplía el rango a L4-L5-S1. Al estimular L4, cuádriceps y tibial anterior se activan con frecuencias comparables: no hay predominio neto de uno sobre otro. [TD/L] [Sch]" },
    { "id": "mio_ehb",        "nombre": "Extensor corto de los dedos", "niveles": ["L5", "S1"], "item": "l_ehb" },
    { "id": "mio_pl",         "nombre": "Peroneo largo",       "niveles": ["L5", "S1"], "item": "l_pl",
      "nota": "Al estimular L5 también se activa con frecuencia relevante el gastrocnemio, y ocasionalmente el abductor del hallux. [TD/L] [Sch]" },
    { "id": "mio_gm",         "nombre": "Gastrocnemio (porción medial)", "niveles": ["S1", "S2"], "item": "l_g",
      "nota": "Al estimular S1 se activa el tibial anterior en una proporción apreciable de casos, pese a ser músculo \"típico\" de niveles más altos. [TD/L] [Lon]" },
    { "id": "mio_ah",         "nombre": "Abductor del hallux", "niveles": ["S1", "S2"], "item": "l_ah" },
    { "id": "mio_cc",         "nombre": "Esfínter anal externo", "niveles": ["S2", "S3", "S4"], "item": "l_cc",
      "nota": "[TD/L]" }
  ],

  /* ------------------------------------------------------------------ *
   * SERVICIOS QUIRÚRGICOS
   * Catálogo editable. Los casos guardan el "id", nunca el nombre, para
   * poder renombrar un servicio sin dejar huérfano ningún caso anterior.
   * ------------------------------------------------------------------ */
  "servicios": [
    { "id": "neurocirugia",  "nombre": "Neurocirugía",  "activa": true },
    { "id": "cot",           "nombre": "COT",           "activa": true },
    { "id": "orl",           "nombre": "ORL",           "activa": true },
    { "id": "vascular",      "nombre": "Vascular",      "activa": true },
    { "id": "endocrino",     "nombre": "Endocrino",     "activa": true },
    { "id": "maxilofacial",  "nombre": "Maxilofacial",  "activa": true },
    { "id": "urologia",      "nombre": "Urología",      "activa": true }
  ],

  /* ------------------------------------------------------------------ *
   * INTERVENCIONES
   * Sembradas con los escenarios que ya existían. "codigo" queda vacío
   * hasta tener la codificación del hospital: al rellenarlo se propaga
   * solo a todo el histórico, porque los casos guardan el id.
   * ------------------------------------------------------------------ */
  "intervenciones": [
    { "id": "artrodesis_descompresion", "nombre": "Artrodesis + descompresión", "codigo": "", "servicio": "neurocirugia", "activa": true },
    { "id": "tumor_supratentorial_grid", "nombre": "Tumor supratentorial con GRID", "codigo": "", "servicio": "neurocirugia", "activa": true }
  ],

  /* ------------------------------------------------------------------ *
   * PERFILES POR PROCEDIMIENTO
   * Combinaciones habituales de técnicas. Al aplicar un perfil se marcan
   * sus técnicas en el escenario activo; el material no se toca.
   * ------------------------------------------------------------------ */
  "perfiles_procedimiento": [
    {
      "id": "supratentorial",
      "activa": true,
      "nombre": "Cirugía supratentorial",
      "tecnicas": ["t_pem", "c_pem", "t_pess", "c_pess", "mapeo_cortical", "mapeo_subcortical", "mapeo_lenguaje", "eeg", "ecog", "br"],
      "nota": "Mapeo motor (cortical y subcortical) o del lenguaje. Los PEV están en estudio."
    },
    {
      "id": "troncoencefalo",
      "activa": true,
      "nombre": "Cirugía de troncoencéfalo",
      "tecnicas": ["t_pem", "pem_corticobulbares", "t_pess", "eeg", "peatc", "br", "mapeo_iv_ventriculo"],
      "nota": "Incluye mapeo motor de los nervios y de los núcleos del suelo del IV ventrículo."
    },
    {
      "id": "medula_espinal",
      "activa": true,
      "nombre": "Cirugía de médula espinal",
      "tecnicas": ["t_pem", "onda_d", "t_pess", "mapeo_columnas_dorsales", "eeg"]
    },
    {
      "id": "columna",
      "activa": true,
      "nombre": "Cirugía de columna",
      "tecnicas": ["t_pem", "t_pess", "mapeo_raices_tornillos", "eeg"]
    },
    {
      "id": "vascular",
      "activa": true,
      "nombre": "Procesos vasculares",
      "tecnicas": ["t_pem", "c_pem", "t_pess", "c_pess", "eeg", "ecog"],
      "nota": "No exclusiva de neurocirugía: también radiología intervencionista y cirugía vascular. Las técnicas concretas dependen de la localización (aneurismas cerebrales o aórticos, malformaciones cerebrales o espinales...). PEM y PESS pueden asociarse a pruebas de provocación con anestésicos, sobre todo en embolización."
    },
    {
      "id": "raices_nervio_periferico",
      "activa": true,
      "nombre": "Cirugía de raíces y nervio periférico",
      "tecnicas": ["t_pem", "t_pess", "mapeo_raices_tornillos", "mapeo_nervio_periferico"],
      "nota": "El mapeo puede ser de raíces, plexo, nervio periférico o tornillos pediculares."
    }
  ],

  /* ------------------------------------------------------------------ *
   * ESCENARIOS (presets de cirugía)
   * asignaciones: { claveCaja: { "idEntrada": "idMaterial" } }
   * idEntrada: "3" (canal), "6:anodal" / "8:catodal" (TES MEP),
   *            "ref" / "gnd" / "peatc" / "dns" / "extra_par" (especiales)
   * ------------------------------------------------------------------ */
  "escenarios": {
    "artrodesis_descompresion": {
      "nombre": "Artrodesis + descompresión",
      "tecnicas": ["t_pess", "t_pem", "emg", "mapeo_raices_tornillos", "reflejo_h"],
      "asignaciones": {
        "caja_estimulo": {
          "1": "l_mediano",
          "2": "r_mediano",
          "3": "l_ptn",
          "4": "r_ptn"
        },
        "tes_mep": {
          "6:anodal": "conmutador"
        },
        "registro_cortical": {
          "1": "cz_prima",
          "2": "cv2",
          "3": "c3_prima",
          "4": "c4_prima",
          "5": "erb1",
          "6": "erb2",
          "8": "cvant",
          "ref": "fz",
          "gnd": "tierra"
        },
        "registro_muscular_mmss": {
          "1": "l_fdio",
          "5": "r_fdio",
          "gnd": "tierra"
        },
        "registro_muscular_mmii": {
          "9": "l_q",
          "10": "l_ta",
          "11": "l_ah",
          "12": "l_g",
          "13": "r_q",
          "14": "r_ta",
          "15": "r_ah",
          "16": "r_g",
          "gnd": "tierra"
        }
      },
      "notas": "Los dos huecos poplíteos del reflejo H no caben en las 4 entradas numeradas de la caja de estímulo: valorar la entrada extra o una segunda caja."
    },
    "tumor_supratentorial_grid": {
      "nombre": "Tumor supratentorial con GRID",
      "tecnicas": ["t_pess", "c_pess", "t_pem", "c_pem", "phase_reversal", "mapeo_cortical", "mapeo_subcortical", "ecog", "eeg"],
      "asignaciones": {
        "caja_estimulo": {
          "1": "l_mediano",
          "2": "r_mediano",
          "3": "l_ptn",
          "4": "r_ptn"
        },
        "tes_mep": {
          "6:anodal": "conmutador",
          "8:catodal": "grid8"
        },
        "registro_cortical": {
          "1": "cz_prima",
          "2": "cv2",
          "3": "c3_prima",
          "4": "c4_prima",
          "5": "erb1",
          "6": "erb2",
          "8": "cvant",
          "ref": "fz",
          "gnd": "tierra"
        },
        "registro_muscular_mmss": {
          "1": "l_fdio",
          "2": "l_ext",
          "5": "r_fdio",
          "6": "r_ext",
          "gnd": "tierra"
        },
        "registro_muscular_mmii": {
          "9": "l_ta",
          "10": "l_ah",
          "13": "r_ta",
          "14": "r_ah",
          "gnd": "tierra"
        }
      },
      "notas": "Registro muscular simétrico; si se amplía, siempre en el lado contralateral a la lesión.",
      "pendiente": "Referencia usada por el GRID (tira cortical, para Phase Reversal/DCS) — no confirmada todavía."
    }
  }
};
