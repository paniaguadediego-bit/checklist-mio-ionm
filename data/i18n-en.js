/*
 * Traducción al inglés de los datos de data/surgeries.js.
 *
 * Va aparte para que surgeries.js siga siendo el archivo de trabajo, con sus
 * comentarios y su formato a mano. Al arrancar, app.js vuelca estas cadenas
 * dentro de los objetos correspondientes como campos "_en", así que aquí solo
 * hay texto: ninguna estructura que mantener sincronizada.
 *
 * Para traducir algo más, búscalo por su id (o por su texto en castellano,
 * en el caso de las categorías) y añade la línea. Lo que no esté aquí se
 * queda en castellano, que es el idioma de referencia.
 *
 * Para añadir OTRO idioma: copia este archivo como i18n-fr.js, cambia
 * "en" por "fr" abajo, tradúcelo, añade el <script> en index.html y mete
 * "fr" en la lista IDIOMAS de app.js.
 */
window.SURGERIES_I18N = window.SURGERIES_I18N || {};
window.SURGERIES_I18N.en = {

  /* Cajas físicas: clave de la caja -> nombre y descripción */
  "cajas": {
    "caja_estimulo": {
      "nombre": "Stimulation box (STIM)",
      "descripcion": "Peripheral stimulation: mainly median and posterior tibial nerve, though it varies with the surgery for convenience (e.g. at leg level, posterior tibial and popliteal fossa for the H reflex)."
    },
    "tes_mep": {
      "nombre": "TES MEP",
      "descripcion": "Numbered 5 to 12 (it has no inputs 1-4). Two independent columns. Anodal (red): channel 6 is the switch that subdivides into C1/C2/C3/C4/Cz-1/Cz+6; the rest serve as reference (Ref.Raabe, Cz''...). Cathodal (black): cathodic stimulation, where the GRID goes (usually 8) after phase reversal, and the Raabe stimulator (usually 12)."
    },
    "registro_cortical": {
      "nombre": "REF-AEP — Cortical recording, Erb, anterior cervical",
      "descripcion": "16 individual inputs in two columns of 8, plus Ref (usually Fz) and GND. Auditory responses are recorded with A1 and A2 in two of the numbered inputs; the yellow connector on the box is only the BAEP connection, not an assignable input."
    },
    "registro_muscular_mmss": {
      "nombre": "Muscle recording — label 1",
      "descripcion": "Generally upper limbs, though it may vary. Numbered 1-8."
    },
    "registro_muscular_mmii": {
      "nombre": "Muscle recording — label 2",
      "descripcion": "Generally lower limbs, though it may vary. Continues the numbering of label 1 (9-16)."
    },
    "caja_etiqueta_3": {
      "nombre": "Label 3 box",
      "descripcion": "Not usually used, available for larger surgeries."
    },
    "caja_etiqueta_4": {
      "nombre": "Label 4 box",
      "descripcion": "Not usually used, available for larger surgeries."
    },
    "caja_etiqueta_5": {
      "nombre": "Label 5 box",
      "descripcion": "Not usually used, available for larger surgeries."
    },
    "caja_etiqueta_6": {
      "nombre": "Label 6 box",
      "descripcion": "Not usually used, available for larger surgeries."
    }
  },

  /* Entradas especiales de las cajas: clave -> nombre y nota */
  "especiales": {
    "dns": { "nota": "Function unconfirmed" },
    "extra_par": { "nombre": "Extra", "nota": "Unlabelled and unnumbered on the actual box" },
    "ref": { "nota": "Usually Fz" }
  },

  /* Etiquetas (tipos físicos): id -> nombre */
  "etiquetas": {
    "aguja_subdermica": "Subdermal needle",
    "aguja_trenzada": "Twisted-pair needle",
    "electrodo_sacacorchos": "Corkscrew electrode",
    "hook_wire": "Hook-wire electrode",
    "pegatinas": "Adhesive pads (pair)",
    "electrodo_cubital": "Cubital electrode",
    "electrodo_grid_mantaA": "GRID mat A",
    "electrodo_grid_mantaB": "GRID mat B",
    "sensor_tubo": "Endotracheal tube sensor",
    "sonda_mapeo": "Cortical mapping probe",
    "sonda_raabe": "Raabe probe",
    "auriculares": "BAEP headphones",
    "gafas": "VEP goggles",
    "conmutador_sw": "Switch",
    "sin_determinar": "Undetermined"
  },

  /* Categorías del catálogo: texto en castellano -> texto en inglés */
  "categorias": {
    "Electrodos corticales — estimulación (TES)": "Cortical electrodes — stimulation (TES)",
    "Electrodos corticales — registro": "Cortical electrodes — recording",
    "Registro cervical / plexo": "Cervical / plexus recording",
    "Músculos MMSS": "Upper limb muscles",
    "Músculos craneales (pares craneales)": "Cranial muscles (cranial nerves)",
    "Músculos MMII": "Lower limb muscles",
    "Estimulación periférica": "Peripheral stimulation",
    "Estimulación trigeminal (reflejos)": "Trigeminal stimulation (reflexes)",
    "GRID / MANTA": "GRID / mat",
    "Potenciales auditivos (PEATC)": "Auditory potentials (BAEP)",
    "Potenciales visuales (VEP)": "Visual potentials (VEP)",
    "Tierras y referencias": "Grounds and references",
    "Material extra (no ocupa entrada)": "Extra material (no input used)"
  },

  /* Ítems del catálogo: id -> { nombre, nota }.
     La mayoría de nombres (C1, L.APB, GRID 3...) son iguales en los dos
     idiomas, así que solo aparecen los que cambian. */
  "items": {
    "c5": { "nota": "Corticobulbar tracts (cranial nerves) — main combination together with C6; other combinations with different references are possible" },
    "c6": { "nota": "Corticobulbar tracts (cranial nerves) — main combination together with C5; other combinations with different references are possible" },
    "mapping": { "nota": "Cortical mapping with the Penfield technique" },
    "raabe_estim": { "nombre": "Raabe (stimulus)", "nota": "Suction-type cortical stimulator — cathode, cathodal (black) column of TES MEP, usually channel 12. Its reference anode is Ref.Raabe" },
    "conmutador": { "nombre": "Switch", "nota": "Occupies a single anodal input (usually 6)" },
    "fz": { "nota": "Usual reference" },
    "cz_doble_prima": { "nota": "Alternative to Ref.Raabe (reference anode)" },
    "ref_raabe": { "nota": "Reference for the Raabe stimulator — anode (red input)" },
    "cvant": { "nota": "Anterior cervical recording, monopolar" },
    "erb1": { "nota": "Erb's point — red needle of the twisted pair (Erb1 + Erb2 = 1 pack)" },
    "erb2": { "nota": "Erb's point — black needle of the twisted pair (Erb1 + Erb2 = 1 pack)" },
    "l_apb": { "nota": "Left abductor pollicis brevis" },
    "r_apb": { "nota": "Right abductor pollicis brevis" },
    "l_fdio": { "nota": "Left first dorsal interosseous" },
    "r_fdio": { "nota": "Right first dorsal interosseous" },
    "l_ext": { "nota": "Left extensor" },
    "r_ext": { "nota": "Right extensor" },
    "l_bcps": { "nota": "Left biceps" },
    "r_bcps": { "nota": "Right biceps" },
    "l_mass": { "nota": "Left masseter — cranial nerve V" },
    "r_mass": { "nota": "Right masseter — cranial nerve V" },
    "l_ooc": { "nota": "Left orbicularis oculi — CN VII; blink reflex recording" },
    "r_ooc": { "nota": "Right orbicularis oculi — CN VII; blink reflex recording" },
    "l_ment": { "nota": "Left mentalis — cranial nerve VII" },
    "r_ment": { "nota": "Right mentalis — cranial nerve VII" },
    "l_crico": { "nota": "Left cricothyroid — CN X; goes together with the vocal cords in the same montage; trigemino-cervical reflex recording. Unconfirmed: the cricothyroid would assess the motor part and the cords the sensory part" },
    "r_crico": { "nota": "Right cricothyroid — CN X; goes together with the vocal cords in the same montage; trigemino-cervical reflex recording. Unconfirmed: the cricothyroid would assess the motor part and the cords the sensory part" },
    "vocal_1": { "nota": "Vocal cords — CN X. A single endotracheal tube sensor with 2 inputs (Vocal 1 + Vocal 2 = 1 sensor). There is no way to know which side each one is: it depends on how the tube ends up positioned. Trigemino-vocal reflex recording" },
    "vocal_2": { "nota": "Vocal cords — CN X. A single endotracheal tube sensor with 2 inputs (Vocal 1 + Vocal 2 = 1 sensor). There is no way to know which side each one is: it depends on how the tube ends up positioned. Trigemino-vocal reflex recording" },
    "l_stcm": { "nota": "Left sternocleidomastoid — CN XI; trigemino-cervical reflex recording" },
    "r_stcm": { "nota": "Right sternocleidomastoid — CN XI; trigemino-cervical reflex recording" },
    "l_q": { "nota": "Left quadriceps" },
    "r_q": { "nota": "Right quadriceps" },
    "l_ta": { "nota": "Left tibialis anterior" },
    "r_ta": { "nota": "Right tibialis anterior" },
    "l_ah": { "nota": "Left abductor hallucis" },
    "r_ah": { "nota": "Right abductor hallucis" },
    "l_g": { "nota": "Left medial gastrocnemius" },
    "r_g": { "nota": "Right medial gastrocnemius" },
    "l_ptn": { "nombre": "L.Post. tibial" },
    "r_ptn": { "nombre": "R.Post. tibial" },
    "l_popliteo": { "nombre": "L.Popliteal (H)", "nota": "Popliteal fossa — H reflex" },
    "r_popliteo": { "nombre": "R.Popliteal (H)", "nota": "Popliteal fossa — H reflex" },
    "l_v1": { "nota": "Left ophthalmic branch of CN V — blink reflex (recorded at orbicularis oculi)" },
    "r_v1": { "nota": "Right ophthalmic branch of CN V — blink reflex (recorded at orbicularis oculi)" },
    "l_v2": { "nota": "Left maxillary branch of CN V — trigemino-cervical reflex (recorded at SCM and cricothyroid)" },
    "r_v2": { "nota": "Right maxillary branch of CN V — trigemino-cervical reflex (recorded at SCM and cricothyroid)" },
    "l_v3": { "nota": "Left mandibular branch of CN V — trigemino-vocal reflex (recorded at vocal cords)" },
    "r_v3": { "nota": "Right mandibular branch of CN V — trigemino-vocal reflex (recorded at vocal cords)" },
    "dcs_v2": { "nota": "Labelled on anodal channel 8 of the actual box — function unconfirmed" },
    "hc": { "nota": "Labelled on channel 11 of the actual box — function unconfirmed" },
    "a1": { "nota": "Left-side auditory recording. Goes in one of the numbered REF-AEP inputs" },
    "a2": { "nota": "Right-side auditory recording. Goes in one of the numbered REF-AEP inputs" },
    "o1": { "nota": "Left occipital visual recording. Goes in one of the numbered REF-AEP inputs" },
    "o2": { "nota": "Right occipital visual recording. Goes in one of the numbered REF-AEP inputs" },
    "tierra": { "nombre": "Ground", "nota": "One per recording box" },
    "auriculares_peatc": { "nombre": "BAEP headphones", "nota": "Auditory stimulation for BAEP (A1/A2). They connect to the yellow REF-AEP connector and use no input" },
    "gafas_vep": { "nombre": "VEP goggles", "nota": "Visual stimulation for visual evoked potentials (O1/O2). They use no input" },
    "l_eye": { "nota": "ERG recording, left eye — needle of the twisted pair (L.Eye + R.Eye = 1 pack)" },
    "r_eye": { "nota": "ERG recording, right eye — needle of the twisted pair (L.Eye + R.Eye = 1 pack)" }
  },

  /* Técnicas: id -> { etiqueta, descripcion }
     "etiqueta" es el texto visible. Las técnicas que añadas tú no pasan por
     aquí: se quedan como las escribas, igual que tus escenarios. */
  "tecnicas": {
    "t_pess": { "etiqueta": "t-SEP", "descripcion": "Transcranial SSEP" },
    "t_pem": { "etiqueta": "t-MEP", "descripcion": "Transcranial motor evoked potentials" },
    "c_pem": { "etiqueta": "c-MEP", "descripcion": "MEP by direct cortical stimulation" },
    "c_pess": { "etiqueta": "c-SEP", "descripcion": "Cortical SSEP" },
    "pem_corticobulbares": { "etiqueta": "Corticobulbar MEP", "descripcion": "Corticobulbar tracts (cranial nerves)" },
    "onda_d": { "etiqueta": "D wave", "descripcion": "Epidural D-wave recording" },
    "br": { "etiqueta": "Blink Reflex (BR)", "descripcion": "Blink reflex" },
    "rbc": { "etiqueta": "BCR", "descripcion": "Bulbocavernosus reflex" },
    "peatc": { "etiqueta": "BAEP", "descripcion": "Brainstem auditory evoked potentials" },
    "emg": { "etiqueta": "Free-EMG", "descripcion": "Electromyography" },
    "eeg": { "descripcion": "Electroencephalography" },
    "ecog": { "descripcion": "Electrocorticography" },
    "pev": { "etiqueta": "VEP", "descripcion": "Visual evoked potentials — under study" },
    "c_pev": { "etiqueta": "c-VEP", "descripcion": "Cortical visual evoked potential" },
    "erg": { "descripcion": "Electroretinogram" },
    "reflejo_h": { "etiqueta": "H reflex", "descripcion": "Split into H-R Gastrocnemius and H-R Masseter" },
    "hr_popliteo": { "etiqueta": "H-R Gastrocnemius", "descripcion": "H reflex by popliteal fossa stimulation" },
    "hr_masetero": { "etiqueta": "H-R Masseter (Jaw Jerk)", "descripcion": "H reflex by masseteric nerve stimulation — same circuit as the classic jaw jerk / masseteric reflex. Not to be confused with the masseteric inhibitory reflex (silent period), a different circuit not studied in IONM." },
    "hr_cuadriceps": { "etiqueta": "H-R Quadriceps" },
    "mapeo_cortical": { "etiqueta": "Cortical mapping", "descripcion": "Penfield technique" },
    "mapeo_subcortical": { "etiqueta": "Subcortical mapping" },
    "phase_reversal": { "etiqueta": "Phase reversal", "descripcion": "SSEP phase inversion" },
    "mapeo_lenguaje": { "etiqueta": "Language mapping" },
    "mapeo_iv_ventriculo": { "etiqueta": "Fourth ventricle mapping", "descripcion": "Nuclei of the floor of the fourth ventricle" },
    "mapeo_columnas_dorsales": { "etiqueta": "Dorsal column mapping" },
    "mapeo_raices_tornillos": { "etiqueta": "Root and screw mapping", "descripcion": "Nerve roots and pedicle screws" },
    "mapeo_nervio_periferico": { "etiqueta": "Peripheral nerve mapping" }
  },

  /* Servicios quirúrgicos: id -> { nombre } */
  "servicios": {
    "neurocirugia": { "nombre": "Neurosurgery" },
    "cot": { "nombre": "Orthopaedics" },
    "orl": { "nombre": "ENT" },
    "vascular": { "nombre": "Vascular" },
    "endocrino": { "nombre": "Endocrine" },
    "maxilofacial": { "nombre": "Maxillofacial" },
    "urologia": { "nombre": "Urology" }
  },

  /* Intervenciones: id -> { nombre } */
  "intervenciones": {
    "artrodesis_descompresion": { "nombre": "Fusion + decompression" },
    "tumor_supratentorial_grid": { "nombre": "Supratentorial tumour with GRID" }
  },

  /* Perfiles por procedimiento: id -> { nombre, nota } */
  "perfiles": {
    "supratentorial": { "nombre": "Supratentorial surgery", "nota": "Motor mapping (cortical and subcortical) or language mapping. VEPs are under study." },
    "troncoencefalo": { "nombre": "Brainstem surgery" },
    "medula_espinal": { "nombre": "Spinal cord surgery" },
    "columna": { "nombre": "Spine surgery" },
    "vascular": { "nombre": "Vascular procedures" },
    "raices_nervio_periferico": { "nombre": "Nerve root and peripheral nerve surgery" }
  },

  /* Escenarios de fábrica: clave -> { nombre, notas, pendiente } */
  "escenarios": {
    "artrodesis_descompresion": {
      "nombre": "Fusion + decompression",
      "notas": "The two popliteal fossae for the H reflex do not fit in the 4 numbered inputs of the stimulation box: consider the extra input or a second box."
    },
    "tumor_supratentorial_grid": {
      "nombre": "Supratentorial tumour with GRID",
      "notas": "Symmetrical muscle recording; if extended, always on the side contralateral to the lesion.",
      "pendiente": "Reference used by the GRID (cortical strip, for phase reversal / DCS) — not confirmed yet."
    }
  }
};
