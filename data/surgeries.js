/*
 * Datos de material MIO/IONM (sistema INOMED).
 *
 * Este archivo NO es un .json "puro" por una razón técnica: si index.html
 * se abre con doble clic (protocolo file://), Chrome y Edge bloquean
 * fetch() de archivos locales por CORS y el checklist no cargaría nada.
 * Por eso el JSON va envuelto en una variable global y se carga con una
 * simple etiqueta <script>, que sí funciona sin servidor.
 *
 * Tres bloques:
 *   - cajas_material    : catálogo de las cajas físicas y sus entradas.
 *   - catalogo_material : catálogo maestro de TODO el material que se puede
 *                         colocar en una entrada (músculos, electrodos,
 *                         estímulos, tierras...). Aquí se añade material
 *                         nuevo para futuras cirugías.
 *   - escenarios        : presets de cirugía. Cada uno guarda qué material
 *                         va en qué entrada de qué caja.
 *
 * Los escenarios que crees o edites desde la web se guardan en el navegador
 * y NO tocan este archivo. Para que un preset sea permanente y viaje por
 * git a otro ordenador, usa el botón "Exportar" y pega el resultado aquí,
 * dentro de "escenarios".
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
      "descripcion": "Dos columnas independientes. Anodal (roja): el canal 6 es el conmutador que se subdivide en C1/C2/C3/C4/Cz-1/Cz+6; el resto sirven de referencia (Ref.Raabe, Cz''...). Catodal (negra): estimulación catódica, ahí va el GRID (habitualmente el 8) tras el phase reversal.",
      "canales": 12,
      "conector": "anodal_catodal"
    },
    "registro_cortical": {
      "nombre": "REF-AEP — Registro cortical, Erb, CvAnterior",
      "descripcion": "16 entradas individuales en dos columnas de 8, más Ref (habitualmente Fz), GND y la entrada de PEATC (amarilla) si se usan potenciales auditivos.",
      "canales": 16,
      "conector": "individual_2col",
      "especiales": [
        { "clave": "ref", "nombre": "Ref", "conector": "individual", "nota": "Habitualmente Fz" },
        { "clave": "gnd", "nombre": "GND", "conector": "individual", "color": "verde" },
        { "clave": "peatc", "nombre": "PEATC", "conector": "individual", "color": "amarillo" }
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
   * CATÁLOGO MAESTRO DE MATERIAL
   * Añade aquí músculos / estímulos nuevos para futuras cirugías.
   * "material" es lo que se cuenta en el resumen final.
   * ------------------------------------------------------------------ */
  "catalogo_material": [
    {
      "categoria": "Electrodos corticales — estimulación (TES)",
      "items": [
        { "id": "c1", "nombre": "C1", "color": "verde", "material": "Electrodo sacacorchos" },
        { "id": "c2", "nombre": "C2", "color": "amarillo", "material": "Electrodo sacacorchos" },
        { "id": "c3", "nombre": "C3", "color": "rojo", "material": "Electrodo sacacorchos" },
        { "id": "c4", "nombre": "C4", "color": "azul", "material": "Electrodo sacacorchos" },
        { "id": "c5", "nombre": "C5", "color": "verde", "material": "Electrodo sacacorchos", "nota": "Vías corticobulbares (pares craneales) — combinación principal junto a C6; admite otras con distintas referencias" },
        { "id": "c6", "nombre": "C6", "color": "amarillo", "material": "Electrodo sacacorchos", "nota": "Vías corticobulbares (pares craneales) — combinación principal junto a C5; admite otras con distintas referencias" },
        { "id": "cz_menos1", "nombre": "Cz-1", "material": "Electrodo sacacorchos" },
        { "id": "cz_mas6", "nombre": "Cz+6cm", "material": "Electrodo sacacorchos" },
        {
          "id": "conmutador",
          "nombre": "Conmutador",
          "material": "Conmutador",
          "conmutador": true,
          "opciones": ["C1", "C2", "C3", "C4", "Cz-1", "Cz+6"],
          "nota": "Ocupa una sola entrada anodal (habitualmente la 6) y se subdivide entre las combinaciones"
        }
      ]
    },
    {
      "categoria": "Electrodos corticales — registro",
      "items": [
        { "id": "cz_prima", "nombre": "Cz'", "material": "Electrodo sacacorchos" },
        { "id": "c3_prima", "nombre": "C3'", "color": "rojo", "material": "Electrodo sacacorchos" },
        { "id": "c4_prima", "nombre": "C4'", "color": "azul", "material": "Electrodo sacacorchos" },
        { "id": "fz", "nombre": "Fz", "material": "Electrodo sacacorchos", "nota": "Referencia habitual" },
        { "id": "cv2", "nombre": "Cv2", "material": "Electrodo sacacorchos" },
        { "id": "cz_doble_prima", "nombre": "Cz''", "material": "Electrodo sacacorchos", "nota": "Alternativa a Ref.Raabe (ánodo de referencia)" },
        { "id": "ref_raabe", "nombre": "Ref.Raabe", "color": "rojo", "material": "Electrodo sacacorchos", "nota": "Referencia del estimulador Raabe — ánodo (entrada roja)" }
      ]
    },
    {
      "categoria": "Registro cervical / plexo",
      "items": [
        { "id": "cvant", "nombre": "CvAnt", "color": "amarillo", "material": "Aguja subdérmica", "nota": "Registro cervical anterior, monopolar" },
        { "id": "erb1", "nombre": "Erb1", "color": "negro", "material": "Aguja trenzada (par)", "media_unidad": true, "nota": "Punto de Erb — aguja negra del par trenzado (Erb1 + Erb2 = 1 paquete)" },
        { "id": "erb2", "nombre": "Erb2", "color": "rojo", "material": "Aguja trenzada (par)", "media_unidad": true, "nota": "Punto de Erb — aguja roja del par trenzado (Erb1 + Erb2 = 1 paquete)" }
      ]
    },
    {
      "categoria": "Músculos MMSS",
      "items": [
        { "id": "l_apb", "nombre": "L.APB", "material": "Aguja trenzada (par)", "nota": "Abductor pollicis brevis izquierdo" },
        { "id": "r_apb", "nombre": "R.APB", "material": "Aguja trenzada (par)", "nota": "Abductor pollicis brevis derecho" },
        { "id": "l_fdio", "nombre": "L.Fdio", "material": "Aguja trenzada (par)", "nota": "1er interóseo dorsal izquierdo" },
        { "id": "r_fdio", "nombre": "R.Fdio", "material": "Aguja trenzada (par)", "nota": "1er interóseo dorsal derecho" },
        { "id": "l_ext", "nombre": "L.E", "material": "Aguja trenzada (par)", "nota": "Extensor izquierdo" },
        { "id": "r_ext", "nombre": "R.E", "material": "Aguja trenzada (par)", "nota": "Extensor derecho" },
        { "id": "l_bcps", "nombre": "L.B", "material": "Aguja trenzada (par)", "nota": "Bíceps izquierdo" },
        { "id": "r_bcps", "nombre": "R.B", "material": "Aguja trenzada (par)", "nota": "Bíceps derecho" }
      ]
    },
    {
      "categoria": "Músculos craneales (pares craneales)",
      "items": [
        { "id": "l_mass", "nombre": "L.Mass", "material": "Aguja trenzada (par)", "nota": "Maseterino izquierdo — V par craneal" },
        { "id": "r_mass", "nombre": "R.Mass", "material": "Aguja trenzada (par)", "nota": "Maseterino derecho — V par craneal" },
        { "id": "l_ooc", "nombre": "L.OOc", "material": "Aguja trenzada (par)", "nota": "Orbicular de los párpados izquierdo — VII par; registro del Blink Reflex" },
        { "id": "r_ooc", "nombre": "R.OOc", "material": "Aguja trenzada (par)", "nota": "Orbicular de los párpados derecho — VII par; registro del Blink Reflex" },
        { "id": "l_ment", "nombre": "L.Ment", "material": "Aguja trenzada (par)", "nota": "Mentoniano izquierdo — VII par craneal" },
        { "id": "r_ment", "nombre": "R.Ment", "material": "Aguja trenzada (par)", "nota": "Mentoniano derecho — VII par craneal" },
        { "id": "l_crico", "nombre": "L.Crico", "material": "Aguja trenzada (par)", "nota": "Cricotiroideo izquierdo — X par; va junto a las cuerdas vocales en el mismo montaje; registro del reflejo trigémino-cervical. Sin confirmar: el crico evaluaría la parte motora y las cuerdas la sensitiva" },
        { "id": "r_crico", "nombre": "R.Crico", "material": "Aguja trenzada (par)", "nota": "Cricotiroideo derecho — X par; va junto a las cuerdas vocales en el mismo montaje; registro del reflejo trigémino-cervical. Sin confirmar: el crico evaluaría la parte motora y las cuerdas la sensitiva" },
        { "id": "vocal_1", "nombre": "Vocal 1", "material": "Sensor de tubo orotraqueal", "media_unidad": true, "nota": "Cuerdas vocales — X par. Un único sensor de tubo orotraqueal con 2 entradas (Vocal 1 + Vocal 2 = 1 sensor). No se puede saber qué lado es cada una: depende de cómo quede colocado el tubo. Registro del reflejo trigémino-vocal" },
        { "id": "vocal_2", "nombre": "Vocal 2", "material": "Sensor de tubo orotraqueal", "media_unidad": true, "nota": "Cuerdas vocales — X par. Un único sensor de tubo orotraqueal con 2 entradas (Vocal 1 + Vocal 2 = 1 sensor). No se puede saber qué lado es cada una: depende de cómo quede colocado el tubo. Registro del reflejo trigémino-vocal" },
        { "id": "l_stcm", "nombre": "L.STCM", "material": "Aguja trenzada (par)", "nota": "Esternocleidomastoideo izquierdo — XI par; registro del reflejo trigémino-cervical" },
        { "id": "r_stcm", "nombre": "R.STCM", "material": "Aguja trenzada (par)", "nota": "Esternocleidomastoideo derecho — XI par; registro del reflejo trigémino-cervical" }
      ]
    },
    {
      "categoria": "Músculos MMII",
      "items": [
        { "id": "l_q", "nombre": "L.Q", "material": "Aguja trenzada (par)", "nota": "Cuádriceps izquierdo" },
        { "id": "r_q", "nombre": "R.Q", "material": "Aguja trenzada (par)", "nota": "Cuádriceps derecho" },
        { "id": "l_ta", "nombre": "L.Ta", "material": "Aguja trenzada (par)", "nota": "Tibial anterior izquierdo" },
        { "id": "r_ta", "nombre": "R.Ta", "material": "Aguja trenzada (par)", "nota": "Tibial anterior derecho" },
        { "id": "l_ah", "nombre": "L.Ah", "material": "Aguja trenzada (par)", "nota": "Abductor hallucis izquierdo" },
        { "id": "r_ah", "nombre": "R.Ah", "material": "Aguja trenzada (par)", "nota": "Abductor hallucis derecho" },
        { "id": "l_g", "nombre": "L.G", "material": "Aguja trenzada (par)", "nota": "Gastrocnemio medial izquierdo" },
        { "id": "r_g", "nombre": "R.G", "material": "Aguja trenzada (par)", "nota": "Gastrocnemio medial derecho" }
      ]
    },
    {
      "categoria": "Estimulación periférica",
      "items": [
        { "id": "l_mediano", "nombre": "L.Mediano", "material": "Pegatinas (par)" },
        { "id": "r_mediano", "nombre": "R.Mediano", "material": "Pegatinas (par)" },
        { "id": "l_cubital", "nombre": "L.Cubital", "material": "Pegatinas (par)" },
        { "id": "r_cubital", "nombre": "R.Cubital", "material": "Pegatinas (par)" },
        { "id": "l_ptn", "nombre": "L.Tibial post.", "material": "Pegatinas (par)" },
        { "id": "r_ptn", "nombre": "R.Tibial post.", "material": "Pegatinas (par)" },
        { "id": "l_popliteo", "nombre": "L.Poplíteo (H)", "material": "Pegatinas (par)", "nota": "Hueco poplíteo — reflejo H" },
        { "id": "r_popliteo", "nombre": "R.Poplíteo (H)", "material": "Pegatinas (par)", "nota": "Hueco poplíteo — reflejo H" }
      ]
    },
    {
      "categoria": "Estimulación trigeminal (reflejos)",
      "items": [
        { "id": "l_v1", "nombre": "L.V1", "material": "Aguja trenzada (par)", "nota": "Rama oftálmica izquierda del V par — Blink Reflex (registro en orbiculares oculi)" },
        { "id": "r_v1", "nombre": "R.V1", "material": "Aguja trenzada (par)", "nota": "Rama oftálmica derecha del V par — Blink Reflex (registro en orbiculares oculi)" },
        { "id": "l_v2", "nombre": "L.V2", "material": "Aguja trenzada (par)", "nota": "Rama maxilar izquierda del V par — reflejo trigémino-cervical (registro en STCM y cricotiroideo)" },
        { "id": "r_v2", "nombre": "R.V2", "material": "Aguja trenzada (par)", "nota": "Rama maxilar derecha del V par — reflejo trigémino-cervical (registro en STCM y cricotiroideo)" },
        { "id": "l_v3", "nombre": "L.V3", "material": "Aguja trenzada (par)", "nota": "Rama mandibular izquierda del V par — reflejo trigémino-vocal (registro en cuerdas vocales)" },
        { "id": "r_v3", "nombre": "R.V3", "material": "Aguja trenzada (par)", "nota": "Rama mandibular derecha del V par — reflejo trigémino-vocal (registro en cuerdas vocales)" }
      ]
    },
    {
      "categoria": "GRID / estimulación directa",
      "items": [
        { "id": "grid1", "nombre": "GRID 1", "material": "Electrodo de grid" },
        { "id": "grid2", "nombre": "GRID 2", "material": "Electrodo de grid" },
        { "id": "grid3", "nombre": "GRID 3", "material": "Electrodo de grid" },
        { "id": "grid4", "nombre": "GRID 4", "material": "Electrodo de grid" },
        { "id": "grid5", "nombre": "GRID 5", "material": "Electrodo de grid" },
        { "id": "grid6", "nombre": "GRID 6", "material": "Electrodo de grid" },
        { "id": "grid7", "nombre": "GRID 7", "material": "Electrodo de grid" },
        { "id": "grid8", "nombre": "GRID 8", "material": "Electrodo de grid" },
        { "id": "dcs_v2", "nombre": "DCS / V2", "material": "Sin determinar", "nota": "Aparece rotulado en el canal 8 anodal de la caja real — función sin confirmar" },
        { "id": "hc", "nombre": "HC", "material": "Sin determinar", "nota": "Aparece rotulado en el canal 11 de la caja real — función sin confirmar" },
        { "id": "raabe_estim", "nombre": "Raabe (estímulo)", "color": "negro", "material": "Sonda Raabe", "nota": "Cátodo del estimulador tipo aspiración (entrada negra)" }
      ]
    },
    {
      "categoria": "Tierras y referencias",
      "items": [
        { "id": "tierra", "nombre": "Tierra", "material": "Aguja subdérmica", "nota": "Una por caja de registro" },
        { "id": "peatc", "nombre": "PEATC", "material": "Auriculares PEATC", "color": "amarillo", "nota": "Potenciales auditivos de tronco" }
      ]
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
      "modalidades": ["PESS", "PEM", "EMG libre", "EMG estimulado", "Reflejo H"],
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
      "modalidades": ["SEP", "MEP", "Phase Reversal", "DCS", "ECoG", "ECG"],
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
