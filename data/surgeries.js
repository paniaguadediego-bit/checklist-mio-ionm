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

  // Equipos (25-09-2026): cada uno tiene su propio juego de cajas. Inomed usa
  // "cajas_material" (el bloque de siempre); los demás, "cajas_<id>". Las
  // claves de caja no se repiten entre equipos. Un equipo sin cajas no se
  // ofrece en la app.
  //
  // Configurar el servicio (demo-congreso B4.F1):
  //   - "por_defecto": true -> el equipo que se propone para lo NUEVO
  //     (plantillas y casos). Lo que no trae equipo_id -todo lo anterior al
  //     25-09-2026- sigue siendo Inomed pase lo que pase: nada que migrar.
  //   - "activo": false -> configurado pero sin ofrecer (sí se ve en ?demo).
  //   - Un equipo nuevo = una entrada aquí + su bloque "cajas_<id>" con
  //     claves de caja que no se repitan con las de otros equipos.
  // "generico" es un ejemplo de plantilla para otros servicios: desactivado,
  // solo aparece en la demo.
  "equipos": {
    "inomed": { "nombre": "Inomed", "corto": "I", "por_defecto": true },
    "cadwell": { "nombre": "Cadwell", "corto": "C" },
    "generico": { "nombre": "Genérico (ejemplo)", "nombre_en": "Generic (example)", "corto": "G", "activo": false }
  },
  // Cajas del equipo de ejemplo "generico": claves con prefijo "generico_".
  // Punto de partida para describir el equipo de otro servicio.
  "cajas_generico": {
    "generico_estimulo": {
      "nombre": "Estimulador periférico", "nombre_en": "Peripheral stimulator",
      "descripcion": "Ejemplo: 4 salidas de estímulo en par (mediano, cubital, tibial posterior...).",
      "descripcion_en": "Example: 4 paired stimulation outputs (median, ulnar, posterior tibial...).",
      "canales": 4,
      "conector": "par"
    },
    "generico_tes": {
      "nombre": "Estimulador transcraneal", "nombre_en": "Transcranial stimulator",
      "descripcion": "Ejemplo: 4 canales con salida anodal (roja) y catodal (negra).",
      "descripcion_en": "Example: 4 channels with anodal (red) and cathodal (black) outputs.",
      "canales": 4,
      "numeracion_inicio": 1,
      "conector": "anodal_catodal"
    },
    "generico_registro_1": {
      "nombre": "Amplificador de registro 1", "nombre_en": "Recording amplifier 1",
      "descripcion": "Ejemplo: 8 entradas referenciales, referencia común y tierra (registro cortical y cervical).",
      "descripcion_en": "Example: 8 referential inputs, common reference and ground (cortical and cervical recording).",
      "canales": 8,
      "conector": "individual_2col",
      "especiales": [
        { "clave": "ref", "nombre": "Ref", "conector": "individual" },
        { "clave": "gnd", "nombre": "GND", "conector": "individual", "color": "verde" }
      ]
    },
    "generico_registro_2": {
      "nombre": "Amplificador de registro 2", "nombre_en": "Recording amplifier 2",
      "descripcion": "Ejemplo: 8 canales diferenciales (activo y referencia juntos) y tierra, para músculos.",
      "descripcion_en": "Example: 8 differential channels (active and reference together) and ground, for muscles.",
      "canales": 8,
      "numeracion_inicio": 1,
      "conector": "par",
      "especiales": [
        { "clave": "gnd", "nombre": "GND", "conector": "individual", "color": "verde" }
      ]
    }
  },
  // Cajas del equipo Cadwell (Cascade IOMAX): claves con prefijo "cadwell_".
  "cajas_cadwell": {
    "cadwell_cortical": {
      "nombre": "Módulo cortical",
      "descripcion": "Estímulo y registro en la misma caja. A la izquierda, el estimulador transcraneal TCS: 9 salidas (H1 a H9); cuál hace de ánodo y cuál de cátodo se decide en el montaje del software, por eso no hay conmutador. A la derecha, el amplificador de 16 canales: 13 entradas referenciales (E1 a E13), 3 pares diferenciales (1A/1R a 3A/3R) y la tierra. Los auriculares del PEATC y las gafas de los PEV van a sus puertos de arriba (naranja y morado) y no ocupan entrada. Abajo, las salidas 1 a 5: en la 1 a la 4 se enchufan los módulos de extremidad y en la 5 el amplificador de 32 canales; la luz de cada una se enciende en verde cuando lo enchufado tiene algo colocado.",
      "grupos": [
        {
          "titulo": "TCS — estímulo",
          "canales": 9,
          "rotulo": "H{n}",
          "id": "h{n}",
          "conector": "individual"
        },
        {
          "titulo": "Registro",
          "canales": 13,
          "rotulo": "E{n}",
          "id": "{n}",
          "conector": "individual",
          "color_conector": "azul"
        }
      ],
      "especiales": [
        {
          "clave": "d1",
          "nombre": "1A/1R",
          "conector": "par",
          "nota": "Par diferencial"
        },
        {
          "clave": "d2",
          "nombre": "2A/2R",
          "conector": "par",
          "nota": "Par diferencial"
        },
        {
          "clave": "d3",
          "nombre": "3A/3R",
          "conector": "par",
          "nota": "Par diferencial"
        },
        {
          "clave": "gnd",
          "nombre": "GND",
          "conector": "individual",
          "color": "verde"
        }
      ],
      "puertos": [
        {
          "clave": "1",
          "nombre": "1"
        },
        {
          "clave": "2",
          "nombre": "2"
        },
        {
          "clave": "3",
          "nombre": "3"
        },
        {
          "clave": "4",
          "nombre": "4"
        },
        {
          "clave": "5",
          "nombre": "5"
        }
      ]
    },
    "cadwell_lcswap": {
      "nombre": "LCSwap — estimulación directa",
      "descripcion": "Estimulador de baja corriente con matriz de conmutación, para estimulación directa de nervio y corteza. Se conecta al puerto LCS (amarillo) del módulo cortical. 12 salidas en rejilla (1 a 12) y tres puertos de sonda, P1, P2 y P3 (este con conector de 4 pines), cada uno con su borne − (cátodo) y + (ánodo) por separado: la sonda va en uno y su referencia en el otro, según sea estimulación cortical o subcortical/periférica.",
      "canales": 12,
      "conector": "individual",
      "rotulo": "{n}",
      "especiales": [
        {
          "clave": "p3",
          "nombre": "P3",
          "conector": "individual",
          "recuadro": true,
          "alto": 2,
          "nota": "Puerto de sonda (− / +) con conector de 4 pines",
          "polos": true
        },
        {
          "clave": "p1",
          "nombre": "P1",
          "conector": "individual",
          "recuadro": true,
          "nota": "Puerto de sonda (− / +)",
          "polos": true
        },
        {
          "clave": "p2",
          "nombre": "P2",
          "conector": "individual",
          "recuadro": true,
          "nota": "Puerto de sonda (− / +)",
          "polos": true
        }
      ],
      "rejilla": 4
    },
    "cadwell_extremidad_1": {
      "nombre": "Módulo de extremidad 1",
      "descripcion": "8 canales de registro diferenciales (1A/1R a 8A/8R): cada canal lleva el activo y la referencia juntos. 5 salidas de estímulo eléctrico emparejadas (ES1 a ES5) y la tierra. El número del módulo es el que marca su selector ID (1 a 4).",
      "canales": 8,
      "conector": "par",
      "rotulo": "{n}A/{n}R",
      "especiales": [
        {
          "clave": "es1",
          "nombre": "ES1",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es2",
          "nombre": "ES2",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es3",
          "nombre": "ES3",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es4",
          "nombre": "ES4",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es5",
          "nombre": "ES5",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "gnd",
          "nombre": "GND",
          "conector": "individual",
          "color": "verde"
        }
      ],
      "conectada_a": {
        "caja": "cadwell_cortical",
        "puerto": "1"
      }
    },
    "cadwell_extremidad_2": {
      "nombre": "Módulo de extremidad 2",
      "descripcion": "8 canales de registro diferenciales (1A/1R a 8A/8R): cada canal lleva el activo y la referencia juntos. 5 salidas de estímulo eléctrico emparejadas (ES1 a ES5) y la tierra. El número del módulo es el que marca su selector ID (1 a 4).",
      "canales": 8,
      "conector": "par",
      "rotulo": "{n}A/{n}R",
      "especiales": [
        {
          "clave": "es1",
          "nombre": "ES1",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es2",
          "nombre": "ES2",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es3",
          "nombre": "ES3",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es4",
          "nombre": "ES4",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es5",
          "nombre": "ES5",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "gnd",
          "nombre": "GND",
          "conector": "individual",
          "color": "verde"
        }
      ],
      "conectada_a": {
        "caja": "cadwell_cortical",
        "puerto": "2"
      }
    },
    "cadwell_extremidad_3": {
      "nombre": "Módulo de extremidad 3",
      "descripcion": "8 canales de registro diferenciales (1A/1R a 8A/8R): cada canal lleva el activo y la referencia juntos. 5 salidas de estímulo eléctrico emparejadas (ES1 a ES5) y la tierra. El número del módulo es el que marca su selector ID (1 a 4).",
      "canales": 8,
      "conector": "par",
      "rotulo": "{n}A/{n}R",
      "especiales": [
        {
          "clave": "es1",
          "nombre": "ES1",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es2",
          "nombre": "ES2",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es3",
          "nombre": "ES3",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es4",
          "nombre": "ES4",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es5",
          "nombre": "ES5",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "gnd",
          "nombre": "GND",
          "conector": "individual",
          "color": "verde"
        }
      ],
      "plegable": true,
      "conectada_a": {
        "caja": "cadwell_cortical",
        "puerto": "3"
      }
    },
    "cadwell_extremidad_4": {
      "nombre": "Módulo de extremidad 4",
      "descripcion": "8 canales de registro diferenciales (1A/1R a 8A/8R): cada canal lleva el activo y la referencia juntos. 5 salidas de estímulo eléctrico emparejadas (ES1 a ES5) y la tierra. El número del módulo es el que marca su selector ID (1 a 4).",
      "canales": 8,
      "conector": "par",
      "rotulo": "{n}A/{n}R",
      "especiales": [
        {
          "clave": "es1",
          "nombre": "ES1",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es2",
          "nombre": "ES2",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es3",
          "nombre": "ES3",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es4",
          "nombre": "ES4",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "es5",
          "nombre": "ES5",
          "conector": "par",
          "nota": "Salida de estímulo eléctrico"
        },
        {
          "clave": "gnd",
          "nombre": "GND",
          "conector": "individual",
          "color": "verde"
        }
      ],
      "plegable": true,
      "conectada_a": {
        "caja": "cadwell_cortical",
        "puerto": "4"
      }
    },
    "cadwell_amp32": {
      "nombre": "Amplificador de 32 canales",
      "descripcion": "Amplificador IOMAX de 32 canales para EEG y PESS corticales directos: entradas 1 a 16 a la izquierda y 17 a 32 a la derecha. El conector de abajo a la izquierda es su salida hacia el módulo principal: se enchufa a la salida 5 del módulo cortical (su luz se enciende en verde cuando esta caja tiene algo colocado). El icono de abajo a la derecha está sin definir.",
      "canales": 32,
      "conector": "individual_2col",
      "rotulo": "{n}",
      "plegable": true,
      "conectada_a": {
        "caja": "cadwell_cortical",
        "puerto": "5"
      }
    }
  },

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
    // Las cuatro de refuerzo (3-6) llevan "plegable": true -ver
    // renderCajaFisica()-: se pliegan aparte dentro de la ventana Cajas y
    // arrancan cerradas, porque son las que menos se usan y si no, seis
    // diagramas de cableado a la vista de golpe es demasiado.
    "caja_etiqueta_3": {
      "nombre": "Caja etiqueta 3",
      "descripcion": "No se suele usar, disponible para cirugías más amplias.",
      "canales": 8,
      "numeracion_inicio": 1,
      "conector": "par",
      "plegable": true,
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
      "plegable": true,
      "especiales": [
        { "clave": "gnd", "nombre": "GND", "conector": "individual", "color": "verde" }
      ]
    },
    "caja_etiqueta_5": {
      "nombre": "Caja etiqueta 5",
      "descripcion": "No se suele usar, disponible para cirugías más amplias.",
      "canales": 8,
      "numeracion_inicio": 1,
      "conector": "par",
      "plegable": true,
      "especiales": [
        { "clave": "gnd", "nombre": "GND", "conector": "individual", "color": "verde" }
      ]
    },
    "caja_etiqueta_6": {
      "nombre": "Caja etiqueta 6",
      "descripcion": "No se suele usar, disponible para cirugías más amplias.",
      "canales": 8,
      "numeracion_inicio": 9,
      "conector": "par",
      "plegable": true,
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
    // "doble": true porque cada canal hook-wire necesita un par -activo y
    // referencia-, no un electrodo suelto: sin este flag el material a
    // preparar salía a la mitad de lo que hace falta pedir de verdad
    // (confirmado por Pani, 04-09-2026). Ver "doble" en calcularResumen().
    { "id": "hook_wire",            "nombre": "Electrodo Hook Wire",       "borde": "doble",       "color": "naranja",  "fondo": "naranja",   "fungible": true, "doble": true },
    { "id": "pegatinas",            "nombre": "Pegatinas (par)",           "borde": "solido",      "color": "verde",    "fondo": "verde",     "fungible": true },
    { "id": "adhesivo_eng",         "nombre": "Electrodo adhesivo de ENG", "borde": "solido",      "color": "turquesa", "fondo": "verde",     "fungible": true },
    // Una manta GRID son 8 electrodos que vienen juntos de fábrica: aunque solo
    // se coloquen 2 o 3 en la caja, la manta entera se ha abierto igual, así que
    // se cobra una sola vez por manta y no por electrodo colocado ("manta": true,
    // ver calcularCoste()). Dos mantas van en dos etiquetas separadas porque son
    // dos compras independientes que se cobran cada una la suya.
    { "id": "electrodo_grid_mantaA","nombre": "Manta GRID A",              "borde": "grueso",      "color": "rojo",     "fondo": "rojo",      "fungible": true, "manta": true },
    { "id": "electrodo_grid_mantaB","nombre": "Manta GRID B",              "borde": "grueso",      "color": "granate",  "fondo": "granate",   "fungible": true, "manta": true },
    { "id": "electrodo_epidural",   "nombre": "Electrodo epidural",        "borde": "doble",       "color": "morado",   "fondo": "morado",    "fungible": true },
    { "id": "electrodo_epidural_dwave", "nombre": "Electrodo epidural (D-Wave)", "borde": "doble",  "color": "morado",   "fondo": "morado",    "fungible": true },
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
    { "id": "sonda_aspiracion",     "nombre": "Sonda de aspiración electrificada (Raabe)", "borde": "grueso", "color": "negro", "fondo": "ninguno", "fungible": false },
    { "id": "pinza_estimulacion",   "nombre": "Pinza de estimulación",     "borde": "grueso",      "color": "amarillo", "fondo": "ninguno",   "fungible": false },
    { "id": "sonda_laparoscopica",  "nombre": "Sonda bipolar laparoscópica", "borde": "grueso",    "color": "turquesa", "fondo": "ninguno",   "fungible": false },
    { "id": "auriculares",          "nombre": "Auriculares PEATC",         "borde": "punteado",    "color": "gris",     "fondo": "ninguno",   "fungible": false },
    { "id": "gafas",                "nombre": "Gafas de estimulación VEP", "borde": "punteado",    "color": "gris",     "fondo": "ninguno",   "fungible": false },
    { "id": "discos_visuales",      "nombre": "Discos visuales",           "borde": "punteado",    "color": "morado",   "fondo": "ninguno",   "fungible": false },
    { "id": "bipolar_barra",        "nombre": "Bipolar barra / superficie ENG", "borde": "punteado", "color": "verde",  "fondo": "ninguno",   "fungible": false },
    { "id": "conmutador_sw",        "nombre": "Conmutador",                "borde": "solido",      "color": "gris",     "fondo": "ninguno",   "fungible": false },
    // Puente: cable/conector reutilizable que enlaza dos entradas -no se
    // gasta ni se compra por caso-, así que no debe sumar al coste de
    // material aunque sí tenga que aparecer en las cajas a preparar
    // (pedido el 09-09-2026).
    { "id": "puente",               "nombre": "Puente",                    "borde": "solido",      "color": "gris",     "fondo": "gris",      "fungible": false },

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
        { "id": "c1", "nombre": "C1", "color": "verde", "etiqueta": "electrodo_sacacorchos", "nota": "Estimulación transcraneal (TES) para los MEP, en pareja con C2. Montaje cercano a la línea media: menos movimiento del paciente y útil sobre todo para los MEP de miembros inferiores" },
        { "id": "c2", "nombre": "C2", "color": "amarillo", "etiqueta": "electrodo_sacacorchos", "nota": "Estimulación transcraneal (TES) para los MEP, en pareja con C1. Montaje cercano a la línea media: menos movimiento del paciente y útil sobre todo para los MEP de miembros inferiores" },
        { "id": "c3", "nombre": "C3", "color": "rojo", "etiqueta": "electrodo_sacacorchos", "nota": "Estimulación transcraneal (TES) para los MEP, en pareja con C4 (montaje clásico). Como ánodo estimula preferentemente el hemisferio izquierdo (respuesta en el hemicuerpo derecho)" },
        { "id": "c4", "nombre": "C4", "color": "azul", "etiqueta": "electrodo_sacacorchos", "nota": "Estimulación transcraneal (TES) para los MEP, en pareja con C3 (montaje clásico). Como ánodo estimula preferentemente el hemisferio derecho (respuesta en el hemicuerpo izquierdo)" },
        { "id": "c5", "nombre": "C5", "color": "verde", "etiqueta": "electrodo_sacacorchos", "nota": "Vías corticobulbares (pares craneales) — combinación principal junto a C6; admite otras con distintas referencias" },
        { "id": "c6", "nombre": "C6", "color": "amarillo", "etiqueta": "electrodo_sacacorchos", "nota": "Vías corticobulbares (pares craneales) — combinación principal junto a C5; admite otras con distintas referencias" },
        { "id": "cz_menos1", "nombre": "Cz-1", "etiqueta": "electrodo_sacacorchos", "nota": "Posición de línea media para TES, en pareja con Cz+6cm: montaje habitual para la Onda D y los MEP de miembros inferiores" },
        { "id": "cz_mas6", "nombre": "Cz+6cm", "etiqueta": "electrodo_sacacorchos", "nota": "6 cm por delante de Cz; pareja de Cz-1 en el montaje de línea media para la Onda D y los MEP de miembros inferiores" },
        { "id": "mapping", "nombre": "Referencia Mapping cortical", "color": "negro", "etiqueta": "electrodo_sacacorchos", "nota": "Referencia del mapeo cortical — cátodo (entrada negra, catodal)" },
        { "id": "ref_mapping_subcortical", "nombre": "Referencia Mapping subcortical", "color": "rojo", "etiqueta": "electrodo_sacacorchos", "nota": "Referencia del mapeo subcortical — ánodo (entrada roja, anodal)" },
        { "id": "raabe_estim", "nombre": "Raabe (estímulo)", "color": "negro", "etiqueta": "sonda_raabe", "nota": "Estimulador cortical tipo aspiración — cátodo, columna catodal (negra) de TES MEP, habitualmente el canal 12. Su ánodo de referencia es Ref.Raabe" },
        { "id": "ref_grid_estim", "nombre": "Ref.GRID", "color": "negro", "etiqueta": "electrodo_sacacorchos", "nota": "Referencia de la columna catodal (negra) para estimulación por GRID -distinta de \"Referencia GRID\" en GRID y D-Wave" },
        { "id": "cz_doble_prima", "nombre": "Cz''", "etiqueta": "electrodo_sacacorchos", "nota": "Alternativa a Ref.Raabe (ánodo de referencia)" },
        { "id": "ref_raabe", "nombre": "Ref.Raabe", "color": "rojo", "etiqueta": "electrodo_sacacorchos", "nota": "Referencia del estimulador Raabe — ánodo (entrada roja)" },
        {
          "id": "conmutador",
          "nombre": "Conmutador",
          "equipos": ["inomed"],
          "etiqueta": "conmutador_sw",
          "nota": "Ocupa una sola entrada anodal (habitualmente la 6)"
        }
      ]
    },
    {
      "categoria": "Electrodos corticales — registro",
      "items": [
        { "id": "cz_prima", "nombre": "Cz'", "etiqueta": "electrodo_sacacorchos", "nota": "Registro cortical de los PESS de miembros inferiores (tibial posterior), habitualmente frente a Fz" },
        { "id": "c3_prima", "nombre": "C3'", "color": "rojo", "etiqueta": "electrodo_sacacorchos", "nota": "Registro cortical de los PESS del miembro superior derecho (mediano o cubital), sobre la corteza somatosensitiva izquierda, frente a Fz o C4'" },
        { "id": "c4_prima", "nombre": "C4'", "color": "azul", "etiqueta": "electrodo_sacacorchos", "nota": "Registro cortical de los PESS del miembro superior izquierdo (mediano o cubital), sobre la corteza somatosensitiva derecha, frente a Fz o C3'" },
        { "id": "fz", "nombre": "Fz", "etiqueta": "electrodo_sacacorchos", "nota": "Referencia habitual" }
      ]
    },
    {
      "categoria": "Registro cervical / periférico",
      "items": [
        { "id": "cv2", "nombre": "Cv2", "etiqueta": "electrodo_sacacorchos", "nota": "Registro cervical (apófisis espinosa de C2) de la respuesta subcortical de los PESS" },
        { "id": "cv7", "nombre": "Cv7", "etiqueta": "electrodo_sacacorchos", "nota": "Registro cervical a nivel de C7 de los PESS de miembro superior (respuesta medular cervical)" },
        { "id": "cvant", "nombre": "CvAnt", "color": "amarillo", "etiqueta": "aguja_subdermica", "nota": "Registro cervical anterior, monopolar" },
        { "id": "erb1", "nombre": "Erb1", "color": "rojo", "etiqueta": "aguja_trenzada", "media_unidad": true, "nota": "Punto de Erb — aguja roja del par trenzado (Erb1 + Erb2 = 1 paquete)" },
        { "id": "erb2", "nombre": "Erb2", "color": "negro", "etiqueta": "aguja_trenzada", "media_unidad": true, "nota": "Punto de Erb — aguja negra del par trenzado (Erb1 + Erb2 = 1 paquete)" },
        { "id": "l_cubital_periferico", "nombre": "L.Cubital periférico", "etiqueta": "pegatinas", "nota": "Registro periférico sobre el nervio cubital: comprueba que el estímulo del PESS de cubital llega bien" },
        { "id": "r_cubital_periferico", "nombre": "R.Cubital periférico", "etiqueta": "pegatinas", "nota": "Registro periférico sobre el nervio cubital: comprueba que el estímulo del PESS de cubital llega bien" },
        { "id": "l_hueco_popliteo", "nombre": "L.Hueco poplíteo", "etiqueta": "pegatinas", "nota": "Registro periférico en el hueco poplíteo (nervio tibial): comprueba que el estímulo del PESS de tibial posterior llega bien" },
        { "id": "r_hueco_popliteo", "nombre": "R.Hueco poplíteo", "etiqueta": "pegatinas", "nota": "Registro periférico en el hueco poplíteo (nervio tibial): comprueba que el estímulo del PESS de tibial posterior llega bien" }
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
      "categoria": "Músculos MMSS — ampliación",
      "plegada_por_defecto": true,
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
      "categoria": "Músculos MMII — ampliación",
      "plegada_por_defecto": true,
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
      "categoria": "Estimulación periférica",
      "items": [
        { "id": "l_mediano", "nombre": "L.Mediano", "etiqueta": "pegatinas", "nota": "Estimulación del nervio mediano en la muñeca para los PESS de miembro superior" },
        { "id": "r_mediano", "nombre": "R.Mediano", "etiqueta": "pegatinas", "nota": "Estimulación del nervio mediano en la muñeca para los PESS de miembro superior" },
        { "id": "l_cubital", "nombre": "L.Cubital", "etiqueta": "pegatinas", "nota": "Estimulación del nervio cubital en la muñeca para los PESS de miembro superior (raíces C8-T1); útil también para vigilar el plexo braquial al posicionar" },
        { "id": "r_cubital", "nombre": "R.Cubital", "etiqueta": "pegatinas", "nota": "Estimulación del nervio cubital en la muñeca para los PESS de miembro superior (raíces C8-T1); útil también para vigilar el plexo braquial al posicionar" },
        { "id": "l_cubital_fosa", "nombre": "L.Cubital fosa", "etiqueta": "pegatinas", "nota": "Fosa cubital (codo), en vez de la muñeca" },
        { "id": "r_cubital_fosa", "nombre": "R.Cubital fosa", "etiqueta": "pegatinas", "nota": "Fosa cubital (codo), en vez de la muñeca" },
        { "id": "l_ptn", "nombre": "L.Tibial post.", "etiqueta": "pegatinas", "nota": "Estimulación del nervio tibial posterior en el tobillo (retromaleolar interno) para los PESS de miembro inferior" },
        { "id": "r_ptn", "nombre": "R.Tibial post.", "etiqueta": "pegatinas", "nota": "Estimulación del nervio tibial posterior en el tobillo (retromaleolar interno) para los PESS de miembro inferior" },
        { "id": "l_popliteo", "nombre": "L.Poplíteo (H)", "etiqueta": "pegatinas", "nota": "Hueco poplíteo — reflejo H" },
        { "id": "r_popliteo", "nombre": "R.Poplíteo (H)", "etiqueta": "pegatinas", "nota": "Hueco poplíteo — reflejo H" }
      ]
    },
    {
      "categoria": "Tierras y referencias",
      "items": [
        { "id": "tierra", "nombre": "Tierra", "etiqueta": "aguja_subdermica", "nota": "Una por caja de registro" }
      ]
    },
    {
      "categoria": "Músculos craneales (pares craneales)",
      "plegada_por_defecto": true,
      "items": [
        { "id": "l_mass", "nombre": "L.Mass", "etiqueta": "hook_wire", "nota": "Maseterino izquierdo — V par craneal" },
        { "id": "r_mass", "nombre": "R.Mass", "etiqueta": "hook_wire", "nota": "Maseterino derecho — V par craneal" },
        { "id": "l_mass_ag", "nombre": "L.Mass", "etiqueta": "aguja_trenzada", "nota": "Maseterino izquierdo — V par craneal, con agujas pareadas en vez de hook wire" },
        { "id": "r_mass_ag", "nombre": "R.Mass", "etiqueta": "aguja_trenzada", "nota": "Maseterino derecho — V par craneal, con agujas pareadas en vez de hook wire" },
        { "id": "l_mass_mono1", "nombre": "L.Mass 1", "etiqueta": "aguja_monopolar", "nota": "Maseterino izquierdo con agujas monopolares en vez de hook wire — canal 1 de 2 por defecto (activa/referencia)" },
        { "id": "l_mass_mono2", "nombre": "L.Mass 2", "etiqueta": "aguja_monopolar", "nota": "Maseterino izquierdo con agujas monopolares en vez de hook wire — canal 2 de 2 por defecto (activa/referencia)" },
        { "id": "r_mass_mono1", "nombre": "R.Mass 1", "etiqueta": "aguja_monopolar", "nota": "Maseterino derecho con agujas monopolares en vez de hook wire — canal 1 de 2 por defecto (activa/referencia)" },
        { "id": "r_mass_mono2", "nombre": "R.Mass 2", "etiqueta": "aguja_monopolar", "nota": "Maseterino derecho con agujas monopolares en vez de hook wire — canal 2 de 2 por defecto (activa/referencia)" },
        { "id": "l_ooc", "nombre": "L.OOc", "etiqueta": "hook_wire", "nota": "Orbicular de los párpados izquierdo — VII par; registro del Blink Reflex" },
        { "id": "r_ooc", "nombre": "R.OOc", "etiqueta": "hook_wire", "nota": "Orbicular de los párpados derecho — VII par; registro del Blink Reflex" },
        { "id": "l_ooc_ag", "nombre": "L.OOc", "etiqueta": "aguja_trenzada", "nota": "Orbicular de los párpados izquierdo — VII par, con agujas pareadas en vez de hook wire; registro del Blink Reflex" },
        { "id": "r_ooc_ag", "nombre": "R.OOc", "etiqueta": "aguja_trenzada", "nota": "Orbicular de los párpados derecho — VII par, con agujas pareadas en vez de hook wire; registro del Blink Reflex" },
        { "id": "l_nasalis", "nombre": "L.Nasalis", "etiqueta": "hook_wire", "nota": "Nasal — VII par izquierdo" },
        { "id": "r_nasalis", "nombre": "R.Nasalis", "etiqueta": "hook_wire", "nota": "Nasal — VII par derecho" },
        { "id": "l_nasalis_ag", "nombre": "L.Nasalis", "etiqueta": "aguja_trenzada", "nota": "Nasal — VII par izquierdo, con agujas pareadas en vez de hook wire" },
        { "id": "r_nasalis_ag", "nombre": "R.Nasalis", "etiqueta": "aguja_trenzada", "nota": "Nasal — VII par derecho, con agujas pareadas en vez de hook wire" },
        { "id": "l_ment", "nombre": "L.Ment", "etiqueta": "hook_wire", "nota": "Mentoniano izquierdo — VII par craneal" },
        { "id": "r_ment", "nombre": "R.Ment", "etiqueta": "hook_wire", "nota": "Mentoniano derecho — VII par craneal" },
        { "id": "l_ment_ag", "nombre": "L.Ment", "etiqueta": "aguja_trenzada", "nota": "Mentoniano izquierdo — VII par craneal, con agujas pareadas en vez de hook wire" },
        { "id": "r_ment_ag", "nombre": "R.Ment", "etiqueta": "aguja_trenzada", "nota": "Mentoniano derecho — VII par craneal, con agujas pareadas en vez de hook wire" },
        { "id": "l_palad", "nombre": "L.Palad", "etiqueta": "hook_wire", "nota": "Velo del paladar izquierdo" },
        { "id": "r_palad", "nombre": "R.Palad", "etiqueta": "hook_wire", "nota": "Velo del paladar derecho" },
        { "id": "l_palad_ag", "nombre": "L.Palad", "etiqueta": "aguja_trenzada", "nota": "Velo del paladar izquierdo, con agujas pareadas en vez de hook wire" },
        { "id": "r_palad_ag", "nombre": "R.Palad", "etiqueta": "aguja_trenzada", "nota": "Velo del paladar derecho, con agujas pareadas en vez de hook wire" },
        { "id": "l_crico", "nombre": "L.Crico", "etiqueta": "hook_wire", "nota": "Cricotiroideo izquierdo — X par; va junto a las cuerdas vocales en el mismo montaje; registro del reflejo trigémino-cervical. Sin confirmar: el crico evaluaría la parte motora y las cuerdas la sensitiva" },
        { "id": "r_crico", "nombre": "R.Crico", "etiqueta": "hook_wire", "nota": "Cricotiroideo derecho — X par; va junto a las cuerdas vocales en el mismo montaje; registro del reflejo trigémino-cervical. Sin confirmar: el crico evaluaría la parte motora y las cuerdas la sensitiva" },
        { "id": "l_crico_ag", "nombre": "L.Crico", "etiqueta": "aguja_trenzada", "nota": "Cricotiroideo izquierdo — X par, con agujas pareadas en vez de hook wire; registro del reflejo trigémino-cervical" },
        { "id": "r_crico_ag", "nombre": "R.Crico", "etiqueta": "aguja_trenzada", "nota": "Cricotiroideo derecho — X par, con agujas pareadas en vez de hook wire; registro del reflejo trigémino-cervical" },
        { "id": "l_stcm", "nombre": "L.STCM", "etiqueta": "hook_wire", "nota": "Esternocleidomastoideo izquierdo — XI par; registro del reflejo trigémino-cervical" },
        { "id": "r_stcm", "nombre": "R.STCM", "etiqueta": "hook_wire", "nota": "Esternocleidomastoideo derecho — XI par; registro del reflejo trigémino-cervical" },
        { "id": "l_stcm_ag", "nombre": "L.STCM", "etiqueta": "aguja_trenzada", "nota": "Esternocleidomastoideo izquierdo — XI par, con agujas pareadas en vez de hook wire; registro del reflejo trigémino-cervical" },
        { "id": "r_stcm_ag", "nombre": "R.STCM", "etiqueta": "aguja_trenzada", "nota": "Esternocleidomastoideo derecho — XI par, con agujas pareadas en vez de hook wire; registro del reflejo trigémino-cervical" },
        { "id": "l_trapecio", "nombre": "L.Trapecio", "etiqueta": "hook_wire", "nota": "Trapecio — XI par izquierdo" },
        { "id": "r_trapecio", "nombre": "R.Trapecio", "etiqueta": "hook_wire", "nota": "Trapecio — XI par derecho" },
        { "id": "l_trapecio_ag", "nombre": "L.Trapecio", "etiqueta": "aguja_trenzada", "nota": "Trapecio — XI par izquierdo, con agujas pareadas en vez de hook wire" },
        { "id": "r_trapecio_ag", "nombre": "R.Trapecio", "etiqueta": "aguja_trenzada", "nota": "Trapecio — XI par derecho, con agujas pareadas en vez de hook wire" },
        { "id": "l_len", "nombre": "L.LEN", "etiqueta": "hook_wire", "nota": "Lengua — XII par izquierdo" },
        { "id": "r_len", "nombre": "R.LEN", "etiqueta": "hook_wire", "nota": "Lengua — XII par derecho" },
        { "id": "l_len_ag", "nombre": "L.LEN", "etiqueta": "aguja_trenzada", "nota": "Lengua — XII par izquierdo, con agujas pareadas en vez de hook wire" },
        { "id": "r_len_ag", "nombre": "R.LEN", "etiqueta": "aguja_trenzada", "nota": "Lengua — XII par derecho, con agujas pareadas en vez de hook wire" },
        { "id": "voc_1_3", "nombre": "Voc1.-3", "etiqueta": "sensor_tubo", "media_unidad": true, "nota": "Cuerdas vocales — X par. Canal del sensor de tubo orotraqueal entre los contactos 1 y 3" },
        { "id": "voc_2_4", "nombre": "Voc.2-4", "etiqueta": "sensor_tubo", "media_unidad": true, "nota": "Cuerdas vocales — X par. Canal del sensor de tubo orotraqueal entre los contactos 2 y 4" },
        { "id": "voc_5_7", "nombre": "Voc.5-7", "etiqueta": "sensor_tubo", "media_unidad": true, "nota": "Cuerdas vocales — X par. Canal del sensor de tubo orotraqueal entre los contactos 5 y 7" },
        { "id": "voc_6_8", "nombre": "Voc.6-8", "etiqueta": "sensor_tubo", "media_unidad": true, "nota": "Cuerdas vocales — X par. Canal del sensor de tubo orotraqueal entre los contactos 6 y 8" },
        { "id": "vocal_1", "nombre": "Vocal 1", "etiqueta": "sensor_tubo", "media_unidad": true, "nota": "Cuerdas vocales — X par. Un único sensor de tubo orotraqueal con 2 entradas (Vocal 1 + Vocal 2 = 1 sensor). No se puede saber qué lado es cada una: depende de cómo quede colocado el tubo. Registro del reflejo trigémino-vocal" },
        { "id": "vocal_2", "nombre": "Vocal 2", "etiqueta": "sensor_tubo", "media_unidad": true, "nota": "Cuerdas vocales — X par. Un único sensor de tubo orotraqueal con 2 entradas (Vocal 1 + Vocal 2 = 1 sensor). No se puede saber qué lado es cada una: depende de cómo quede colocado el tubo. Registro del reflejo trigémino-vocal" }
      ]
    },
    {
      "categoria": "Músculos craneales — ampliación",
      "plegada_por_defecto": true,
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
        {"id":"l_frontalis_ag","nombre":"L.Frontalis","etiqueta":"aguja_trenzada","nota":"Frontal — VII par izquierdo, con agujas pareadas en vez de hook wire"},
        {"id":"r_frontalis_ag","nombre":"R.Frontalis","etiqueta":"aguja_trenzada","nota":"Frontal — VII par derecho, con agujas pareadas en vez de hook wire"},
        {"id":"l_oris","nombre":"L.Oris","etiqueta":"hook_wire","nota":"Orbicular de los labios — VII par izquierdo"},
        {"id":"r_oris","nombre":"R.Oris","etiqueta":"hook_wire","nota":"Orbicular de los labios — VII par derecho"},
        {"id":"l_oris_ag","nombre":"L.Oris","etiqueta":"aguja_trenzada","nota":"Orbicular de los labios — VII par izquierdo, con agujas pareadas en vez de hook wire"},
        {"id":"r_oris_ag","nombre":"R.Oris","etiqueta":"aguja_trenzada","nota":"Orbicular de los labios — VII par derecho, con agujas pareadas en vez de hook wire"},
        {"id":"l_platisma","nombre":"L.Platisma","etiqueta":"hook_wire","nota":"Platisma — VII par izquierdo"},
        {"id":"r_platisma","nombre":"R.Platisma","etiqueta":"hook_wire","nota":"Platisma — VII par derecho"},
        {"id":"l_estilofar","nombre":"L.Estilofar","etiqueta":"hook_wire","nota":"Estilofaríngeo — IX par izquierdo"},
        {"id":"r_estilofar","nombre":"R.Estilofar","etiqueta":"hook_wire","nota":"Estilofaríngeo — IX par derecho"},
        {"id":"l_gen","nombre":"L.GEN","etiqueta":"hook_wire","nota":"Geniohioideo izquierdo"},
        {"id":"r_gen","nombre":"R.GEN","etiqueta":"hook_wire","nota":"Geniohioideo derecho"}
      ]
    },
    {
      "categoria": "GRID y D-Wave",
      "plegada_por_defecto": true,
      "items": [
        { "id": "grid1", "nombre": "GRID A.1", "etiqueta": "electrodo_grid_mantaA", "nota": "Contacto 1 de la manta GRID A: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid2", "nombre": "GRID A.2", "etiqueta": "electrodo_grid_mantaA", "nota": "Contacto 2 de la manta GRID A: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid3", "nombre": "GRID A.3", "etiqueta": "electrodo_grid_mantaA", "nota": "Contacto 3 de la manta GRID A: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid4", "nombre": "GRID A.4", "etiqueta": "electrodo_grid_mantaA", "nota": "Contacto 4 de la manta GRID A: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid5", "nombre": "GRID A.5", "etiqueta": "electrodo_grid_mantaA", "nota": "Contacto 5 de la manta GRID A: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid6", "nombre": "GRID A.6", "etiqueta": "electrodo_grid_mantaA", "nota": "Contacto 6 de la manta GRID A: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid7", "nombre": "GRID A.7", "etiqueta": "electrodo_grid_mantaA", "nota": "Contacto 7 de la manta GRID A: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid8", "nombre": "GRID A.8", "etiqueta": "electrodo_grid_mantaA", "nota": "Contacto 8 de la manta GRID A: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid2_1", "nombre": "GRID B.1", "etiqueta": "electrodo_grid_mantaB", "nota": "Contacto 1 de la manta GRID B: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid2_2", "nombre": "GRID B.2", "etiqueta": "electrodo_grid_mantaB", "nota": "Contacto 2 de la manta GRID B: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid2_3", "nombre": "GRID B.3", "etiqueta": "electrodo_grid_mantaB", "nota": "Contacto 3 de la manta GRID B: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid2_4", "nombre": "GRID B.4", "etiqueta": "electrodo_grid_mantaB", "nota": "Contacto 4 de la manta GRID B: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid2_5", "nombre": "GRID B.5", "etiqueta": "electrodo_grid_mantaB", "nota": "Contacto 5 de la manta GRID B: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid2_6", "nombre": "GRID B.6", "etiqueta": "electrodo_grid_mantaB", "nota": "Contacto 6 de la manta GRID B: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid2_7", "nombre": "GRID B.7", "etiqueta": "electrodo_grid_mantaB", "nota": "Contacto 7 de la manta GRID B: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "grid2_8", "nombre": "GRID B.8", "etiqueta": "electrodo_grid_mantaB", "nota": "Contacto 8 de la manta GRID B: registro de ECoG y c-SEP (inversión de fase) y estimulación cortical directa (c-MEP)" },
        { "id": "epidural_dwave", "nombre": "Electrodo epidural (D-Wave)", "etiqueta": "electrodo_epidural_dwave", "nota": "Kit 3 Platinum Contacts" },
        // Variantes del D-Wave, pedidas el 19-09-2026 -misma etiqueta que el
        // ítem de arriba, que se deja tal cual porque ya está en casos y
        // montajes reales-. Px.DW/Dst.DW son la entrada rápida: un solo chip
        // que representa el kit entero (los 3 contactos vienen incluidos, se
        // usa uno como activo y otro como referencia, sin detallar cuáles).
        { "id": "px_dw", "nombre": "Px.DW", "etiqueta": "electrodo_epidural_dwave", "nota": "Epidural D-Wave proximal — kit completo (contactos 1/2/3 incluidos, uno activo y otro de referencia)" },
        { "id": "dst_dw", "nombre": "Dst.DW", "etiqueta": "electrodo_epidural_dwave", "nota": "Epidural D-Wave distal — kit completo (contactos 1/2/3 incluidos, uno activo y otro de referencia)" },
        // Px.1DW/2DW/3DW y Dst.1DW/2DW/3DW son la entrada detallada: cada
        // contacto por separado para anotar cuál se usó de activo y cuál de
        // referencia, pero los tres salen del mismo kit físico -"tercio_unidad"
        // hace que colocar 1, 2 o 3 de ellos siga contando como 1 solo kit,
        // igual que "media_unidad" con un par-.
        { "id": "px_1dw", "nombre": "Px.1DW", "etiqueta": "electrodo_epidural_dwave", "tercio_unidad": true, "nota": "Epidural D-Wave proximal, contacto 1 de 3 (Px.1DW + Px.2DW + Px.3DW = 1 kit)" },
        { "id": "px_2dw", "nombre": "Px.2DW", "etiqueta": "electrodo_epidural_dwave", "tercio_unidad": true, "nota": "Epidural D-Wave proximal, contacto 2 de 3 (Px.1DW + Px.2DW + Px.3DW = 1 kit)" },
        { "id": "px_3dw", "nombre": "Px.3DW", "etiqueta": "electrodo_epidural_dwave", "tercio_unidad": true, "nota": "Epidural D-Wave proximal, contacto 3 de 3 (Px.1DW + Px.2DW + Px.3DW = 1 kit)" },
        { "id": "dst_1dw", "nombre": "Dst.1DW", "etiqueta": "electrodo_epidural_dwave", "tercio_unidad": true, "nota": "Epidural D-Wave distal, contacto 1 de 3 (Dst.1DW + Dst.2DW + Dst.3DW = 1 kit)" },
        { "id": "dst_2dw", "nombre": "Dst.2DW", "etiqueta": "electrodo_epidural_dwave", "tercio_unidad": true, "nota": "Epidural D-Wave distal, contacto 2 de 3 (Dst.1DW + Dst.2DW + Dst.3DW = 1 kit)" },
        { "id": "dst_3dw", "nombre": "Dst.3DW", "etiqueta": "electrodo_epidural_dwave", "tercio_unidad": true, "nota": "Epidural D-Wave distal, contacto 3 de 3 (Dst.1DW + Dst.2DW + Dst.3DW = 1 kit)" },
        { "id": "ref_grid", "nombre": "Referencia GRID", "etiqueta": "electrodo_sacacorchos", "nota": "Referencia de los registros del GRID (c-SEP, ECoG)" }
      ]
    },
    {
      "categoria": "Potenciales auditivos (PEATC)",
      "plegada_por_defecto": true,
      "items": [
        { "id": "a1", "nombre": "A1", "etiqueta": "electrodo_sacacorchos", "nota": "Registro auditivo del lado izquierdo. Va en una de las entradas numeradas de REF-AEP" },
        { "id": "a2", "nombre": "A2", "etiqueta": "electrodo_sacacorchos", "nota": "Registro auditivo del lado derecho. Va en una de las entradas numeradas de REF-AEP" }
      ]
    },
    {
      "categoria": "Potenciales visuales (VEP)",
      "plegada_por_defecto": true,
      "items": [
        { "id": "o1", "nombre": "O1", "etiqueta": "electrodo_sacacorchos", "nota": "Registro visual occipital izquierdo. Va en una de las entradas numeradas de REF-AEP" },
        { "id": "o2", "nombre": "O2", "etiqueta": "electrodo_sacacorchos", "nota": "Registro visual occipital derecho. Va en una de las entradas numeradas de REF-AEP" },
        { "id": "discos_visuales", "nombre": "Discos visuales", "etiqueta": "discos_visuales", "nota": "Estimuladores luminosos (LED) en disco, sobre los párpados cerrados, para los PEV intraoperatorios" }
      ]
    },
    {
      "categoria": "Estimulación trigeminal (reflejos)",
      "plegada_por_defecto": true,
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
      "categoria": "Otros electrodos corticales (scalp)",
      "plegada_por_defecto": true,
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
      "categoria": "Electrodos de tronco y periné",
      "plegada_por_defecto": true,
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
        {"id":"r_cc","nombre":"R.CC","etiqueta":"aguja_trenzada","nota":"Esfínter anal / cavernoso-cavernoso derecho"},
        {"id":"l_abd","nombre":"L.Abd","etiqueta":"aguja_trenzada", "nota": "Músculos abdominales: registro de EMG y MEP de las raíces torácicas bajas (aprox. T7-T12)"},
        {"id":"r_abd","nombre":"R.Abd","etiqueta":"aguja_trenzada", "nota": "Músculos abdominales: registro de EMG y MEP de las raíces torácicas bajas (aprox. T7-T12)"},
        {"id":"l_bulbocavernoso","nombre":"L.Bulbocavernoso","etiqueta":"aguja_trenzada","nota":"Reflejo bulbocavernoso izquierdo"},
        {"id":"r_bulbocavernoso","nombre":"R.Bulbocavernoso","etiqueta":"aguja_trenzada","nota":"Reflejo bulbocavernoso derecho"},
        {"id":"n_dorsal_pene","nombre":"Nervio Dorsal del Pene","etiqueta":"pegatinas", "nota": "Estimulación del nervio dorsal del pene para el reflejo bulbocavernoso y los PESS de nervio pudendo"},
        {"id":"clitoris","nombre":"Clítoris","etiqueta":"pegatinas", "nota": "Estimulación del nervio dorsal del clítoris para el reflejo bulbocavernoso y los PESS de nervio pudendo"},
        {"id":"l_esfinter_anal_ext","nombre":"L.Esfínter Anal Externo","etiqueta":"hook_wire", "nota": "Registro del esfínter anal externo (raíces S2-S4): EMG, MEP y reflejo bulbocavernoso en cirugía de cono medular, cauda equina y médula anclada"},
        {"id":"r_esfinter_anal_ext","nombre":"R.Esfínter Anal Externo","etiqueta":"hook_wire", "nota": "Registro del esfínter anal externo (raíces S2-S4): EMG, MEP y reflejo bulbocavernoso en cirugía de cono medular, cauda equina y médula anclada"},
        {"id":"l_elevador_ano","nombre":"L.Elevador del ano","etiqueta":"aguja_trenzada", "nota": "Registro del elevador del ano (raíces sacras S3-S4) para EMG y MEP sacros"},
        {"id":"r_elevador_ano","nombre":"R.Elevador del ano","etiqueta":"aguja_trenzada", "nota": "Registro del elevador del ano (raíces sacras S3-S4) para EMG y MEP sacros"},
        {"id":"l_labio_mayor","nombre":"L.Labio mayor","etiqueta":"aguja_trenzada", "nota": "Registro del músculo bulboesponjoso en la mujer (a través del labio mayor) para el reflejo bulbocavernoso y los MEP sacros (S2-S4)"},
        {"id":"r_labio_mayor","nombre":"R.Labio mayor","etiqueta":"aguja_trenzada", "nota": "Registro del músculo bulboesponjoso en la mujer (a través del labio mayor) para el reflejo bulbocavernoso y los MEP sacros (S2-S4)"},
        {"id":"l_oblicuo_externo","nombre":"L.OblicuoExterno","etiqueta":"aguja_trenzada", "nota": "Registro del oblicuo externo del abdomen para EMG y MEP de las raíces torácicas bajas (aprox. T7-T12)"},
        {"id":"r_oblicuo_externo","nombre":"R.OblicuoExterno","etiqueta":"aguja_trenzada", "nota": "Registro del oblicuo externo del abdomen para EMG y MEP de las raíces torácicas bajas (aprox. T7-T12)"}
      ]
    },
    {
      "categoria": "Nervios",
      "plegada_por_defecto": true,
      "items": [
        {"id":"l_iii","nombre":"L.III","etiqueta":"pegatinas","nota":"III par — oculomotor izquierdo"},
        {"id":"r_iii","nombre":"R.III","etiqueta":"pegatinas","nota":"III par — oculomotor derecho"},
        {"id":"l_iv","nombre":"L.IV","etiqueta":"pegatinas","nota":"IV par — troclear izquierdo"},
        {"id":"r_iv","nombre":"R.IV","etiqueta":"pegatinas","nota":"IV par — troclear derecho"},
        {"id":"l_vi","nombre":"L.VI","etiqueta":"pegatinas","nota":"VI par — abducens izquierdo"},
        {"id":"r_vi","nombre":"R.VI","etiqueta":"pegatinas","nota":"VI par — abducens derecho"},
        {"id":"l_n_temporal","nombre":"L.N.Temporal","etiqueta":"pegatinas","nota":"Rama temporal del facial izquierdo"},
        {"id":"r_n_temporal","nombre":"R.N.Temporal","etiqueta":"pegatinas","nota":"Rama temporal del facial derecho"},
        {"id":"l_n_cigomatica","nombre":"L.N.Cigomatica","etiqueta":"pegatinas","nota":"Rama cigomática del facial izquierdo"},
        {"id":"r_n_cigomatica","nombre":"R.N.Cigomatica","etiqueta":"pegatinas","nota":"Rama cigomática del facial derecho"},
        {"id":"l_n_nasobucal","nombre":"L.N.Nasobucal","etiqueta":"pegatinas","nota":"Rama nasobucal del facial izquierdo"},
        {"id":"r_n_nasobucal","nombre":"R.N.Nasobucal","etiqueta":"pegatinas","nota":"Rama nasobucal del facial derecho"},
        {"id":"l_n_mandibular","nombre":"L.N.Mandibular","etiqueta":"pegatinas","nota":"Rama mandibular del facial izquierdo"},
        {"id":"r_n_mandibular","nombre":"R.N.Mandibular","etiqueta":"pegatinas","nota":"Rama mandibular del facial derecho"},
        {"id":"l_n_cervical","nombre":"L.N.Cervical","etiqueta":"pegatinas","nota":"Rama cervical del facial izquierdo"},
        {"id":"r_n_cervical","nombre":"R.N.Cervical","etiqueta":"pegatinas","nota":"Rama cervical del facial derecho"},
        {"id":"l_n_acustico","nombre":"L.N.Acustico","etiqueta":"pegatinas","nota":"Nervio acústico — VIII par izquierdo"},
        {"id":"r_n_acustico","nombre":"R.N.Acustico","etiqueta":"pegatinas","nota":"Nervio acústico — VIII par derecho"},
        {"id":"l_n_vestibular","nombre":"L.N.Vestibular","etiqueta":"pegatinas","nota":"Nervio vestibular — VIII par izquierdo"},
        {"id":"r_n_vestibular","nombre":"R.N.Vestibular","etiqueta":"pegatinas","nota":"Nervio vestibular — VIII par derecho"},
        {"id":"l_n_vago","nombre":"L.N.Vago","etiqueta":"pegatinas","nota":"Nervio vago — X par izquierdo"},
        {"id":"r_n_vago","nombre":"R.N.Vago","etiqueta":"pegatinas","nota":"Nervio vago — X par derecho"},
        {"id":"l_nls","nombre":"L.NLS","etiqueta":"pegatinas","nota":"Nervio laríngeo superior izquierdo"},
        {"id":"r_nls","nombre":"R.NLS","etiqueta":"pegatinas","nota":"Nervio laríngeo superior derecho"},
        {"id":"l_nlr","nombre":"L.NLR","etiqueta":"pegatinas","nota":"Nervio laríngeo recurrente izquierdo"},
        {"id":"r_nlr","nombre":"R.NLR","etiqueta":"pegatinas","nota":"Nervio laríngeo recurrente derecho"},
        {"id":"l_n_espinal","nombre":"L.N.Espinal","etiqueta":"pegatinas","nota":"Nervio espinal — XI par izquierdo"},
        {"id":"r_n_espinal","nombre":"R.N.Espinal","etiqueta":"pegatinas","nota":"Nervio espinal — XI par derecho"},
        {"id":"l_n_hipogloso","nombre":"L.N.Hipogloso","etiqueta":"pegatinas","nota":"Nervio hipogloso — XII par izquierdo"},
        {"id":"r_n_hipogloso","nombre":"R.N.Hipogloso","etiqueta":"pegatinas","nota":"Nervio hipogloso — XII par derecho"},
        {"id":"l_n_supraescap","nombre":"L.N.Supraescap","etiqueta":"pegatinas","nota":"Nervio supraescapular izquierdo"},
        {"id":"r_n_supraescap","nombre":"R.N.Supraescap","etiqueta":"pegatinas","nota":"Nervio supraescapular derecho"},
        {"id":"l_n_axilar","nombre":"L.N.Axilar","etiqueta":"pegatinas","nota":"Nervio axilar izquierdo"},
        {"id":"r_n_axilar","nombre":"R.N.Axilar","etiqueta":"pegatinas","nota":"Nervio axilar derecho"},
        {"id":"l_mc","nombre":"L.MC","etiqueta":"pegatinas","nota":"Nervio musculocutáneo izquierdo"},
        {"id":"r_mc","nombre":"R.MC","etiqueta":"pegatinas","nota":"Nervio musculocutáneo derecho"},
        {"id":"l_n_radial","nombre":"L.N.Radial","etiqueta":"pegatinas","nota":"Nervio radial izquierdo"},
        {"id":"r_n_radial","nombre":"R.N.Radial","etiqueta":"pegatinas","nota":"Nervio radial derecho"},
        {"id":"l_n_mediano","nombre":"L.N.Mediano","etiqueta":"pegatinas","nota":"Nervio mediano izquierdo"},
        {"id":"r_n_mediano","nombre":"R.N.Mediano","etiqueta":"pegatinas","nota":"Nervio mediano derecho"},
        {"id":"l_n_cubital","nombre":"L.N.Cubital","etiqueta":"pegatinas","nota":"Nervio cubital izquierdo"},
        {"id":"r_n_cubital","nombre":"R.N.Cubital","etiqueta":"pegatinas","nota":"Nervio cubital derecho"},
        {"id":"l_n_toracicol","nombre":"L.N.ToracicoL","etiqueta":"pegatinas","nota":"Nervio torácico largo izquierdo"},
        {"id":"r_n_toracicol","nombre":"R.N.ToracicoL","etiqueta":"pegatinas","nota":"Nervio torácico largo derecho"},
        {"id":"l_n_ic","nombre":"L.N.IC","etiqueta":"pegatinas","nota":"Nervio intercostal izquierdo"},
        {"id":"r_n_ic","nombre":"R.N.IC","etiqueta":"pegatinas","nota":"Nervio intercostal derecho"},
        {"id":"l_iing","nombre":"L.IING","etiqueta":"pegatinas","nota":"Nervio ilioinguinal izquierdo"},
        {"id":"r_iing","nombre":"R.IING","etiqueta":"pegatinas","nota":"Nervio ilioinguinal derecho"},
        {"id":"l_ih","nombre":"L.IH","etiqueta":"pegatinas","nota":"Nervio iliohipogástrico izquierdo"},
        {"id":"r_ih","nombre":"R.IH","etiqueta":"pegatinas","nota":"Nervio iliohipogástrico derecho"},
        {"id":"l_gc","nombre":"L.GC","etiqueta":"pegatinas","nota":"Nervio genitofemoral izquierdo"},
        {"id":"r_gc","nombre":"R.GC","etiqueta":"pegatinas","nota":"Nervio genitofemoral derecho"},
        {"id":"l_fc","nombre":"L.FC","etiqueta":"pegatinas","nota":"Nervio femorocutáneo izquierdo"},
        {"id":"r_fc","nombre":"R.FC","etiqueta":"pegatinas","nota":"Nervio femorocutáneo derecho"},
        {"id":"l_n_safeno","nombre":"L.N.Safeno","etiqueta":"pegatinas","nota":"Nervio safeno izquierdo"},
        {"id":"l_n_safeno_ag","nombre":"L.N.Safeno","etiqueta":"aguja_trenzada","nota":"Nervio safeno izquierdo — con agujas pareadas en vez de pegatinas"},
        {"id":"r_n_safeno","nombre":"R.N.Safeno","etiqueta":"pegatinas","nota":"Nervio safeno derecho"},
        {"id":"r_n_safeno_ag","nombre":"R.N.Safeno","etiqueta":"aguja_trenzada","nota":"Nervio safeno derecho — con agujas pareadas en vez de pegatinas"},
        {"id":"l_n_tibialpost","nombre":"L.N.TibialPost","etiqueta":"pegatinas","nota":"Nervio tibial posterior izquierdo"},
        {"id":"r_n_tibialpost","nombre":"R.N.TibialPost","etiqueta":"pegatinas","nota":"Nervio tibial posterior derecho"},
        {"id":"l_n_peroneal","nombre":"L.N.Peroneal","etiqueta":"pegatinas","nota":"Nervio peroneal izquierdo"},
        {"id":"r_n_peroneal","nombre":"R.N.Peroneal","etiqueta":"pegatinas","nota":"Nervio peroneal derecho"},
        {"id":"l_n_sural","nombre":"L.N.Sural","etiqueta":"pegatinas","nota":"Nervio sural izquierdo"},
        {"id":"r_n_sural","nombre":"R.N.Sural","etiqueta":"pegatinas","nota":"Nervio sural derecho"},
        {"id":"l_n_pudendo","nombre":"L.N.Pudendo","etiqueta":"pegatinas","nota":"Nervio pudendo izquierdo"},
        {"id":"r_n_pudendo","nombre":"R.N.Pudendo","etiqueta":"pegatinas","nota":"Nervio pudendo derecho"}
      ]
    },
    {
      "categoria": "Reflejos",
      "plegada_por_defecto": true,
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
      "plegada_por_defecto": true,
      "items": [
        {"id":"l_p_cervical","nombre":"L.P.Cervical","etiqueta":"aguja_subdermica","nota":"Punto de registro cervical izquierdo"},
        {"id":"r_p_cervical","nombre":"R.P.Cervical","etiqueta":"aguja_subdermica","nota":"Punto de registro cervical derecho"},
        {"id":"l_p_popliteo","nombre":"L.P.Popliteo","etiqueta":"aguja_subdermica","nota":"Registro en hueco poplíteo izquierdo"},
        {"id":"r_p_popliteo","nombre":"R.P.Popliteo","etiqueta":"aguja_subdermica","nota":"Registro en hueco poplíteo derecho"},
        {"id":"l_p_lumbar","nombre":"L.P.Lumbar","etiqueta":"aguja_subdermica","nota":"Punto de registro lumbar izquierdo"},
        {"id":"r_p_lumbar","nombre":"R.P.Lumbar","etiqueta":"aguja_subdermica","nota":"Punto de registro lumbar derecho"},
        { "id": "l_eye", "nombre": "L.Eye", "etiqueta": "aguja_trenzada", "media_unidad": true, "nota": "Registro de ERG, ojo izquierdo — aguja del par trenzado (L.Eye + R.Eye = 1 paquete)" },
        { "id": "r_eye", "nombre": "R.Eye", "etiqueta": "aguja_trenzada", "media_unidad": true, "nota": "Registro de ERG, ojo derecho — aguja del par trenzado (L.Eye + R.Eye = 1 paquete)" }
      ]
    },
    {
      "categoria": "Sondas",
      "plegada_por_defecto": true,
      "items": [
        { "id": "sonda_mono_esferica", "nombre": "S. monopolar esférica", "etiqueta": "sonda_mono_esferica", "foto": "img/sondas/sonda_mono_esferica.png", "nota": "Mapeo cerebral cortical y estimulación de tornillos pediculares. Monopolar: necesita su referencia aparte" },
        { "id": "sonda_mono_recta", "nombre": "S. monopolar recta", "etiqueta": "sonda_mono_esferica", "foto": "img/sondas/sonda_mono_recta.png", "nota": "Estimulación monopolar más focal: raíces, tornillos pediculares y mapeo subcortical. Necesita su referencia aparte" },
        { "id": "sonda_bip_concentrica", "nombre": "S. bipolar concéntrica", "etiqueta": "sonda_mono_esferica", "foto": "img/sondas/sonda_bip_concentrica.png", "nota": "Estimulación bipolar muy focal (la corriente queda entre la punta y el anillo): identificar pares craneales y nervios en el campo" },
        { "id": "sonda_bip_rectas", "nombre": "S. bipolar de puntas rectas separadas", "etiqueta": "sonda_mono_esferica", "foto": "img/sondas/sonda_bip_rectas.png", "nota": "Estimulación bipolar focal: mapeo cortical tipo Penfield (motor y lenguaje) y de nervios y raíces" },
        { "id": "sonda_bip_esfericas", "nombre": "S. bipolar de puntas esféricas separadas", "etiqueta": "sonda_mono_esferica", "foto": "img/sondas/sonda_bip_esfericas.png", "nota": "Estimulación bipolar tipo Penfield/Ojemann: mapeo cortical motor y del lenguaje (cirugía despierta)" },
        { "id": "sonda_bip_gancho", "nombre": "S. bipolar de gancho", "etiqueta": "sonda_mono_esferica", "nota": "Para abrazar un nervio o una raíz y estimularlo o registrar su potencial de acción (ENG) aislado del tejido de alrededor" },
        { "id": "sonda_tripolar", "nombre": "S. tripolar", "etiqueta": "sonda_mono_esferica", "nota": "Estimulación muy focal y con poca difusión de corriente (cátodo entre dos ánodos): nervios y raíces" },
        { "id": "sonda_aspiracion", "nombre": "S. de aspiración electrificada (Raabe)", "etiqueta": "sonda_aspiracion", "foto": "img/sondas/sonda_aspiracion.png", "nota": "Cátodo — mapeo/estimulación subcortical" },
        { "id": "sonda_laparoscopica", "nombre": "S. bipolar laparoscópica", "etiqueta": "sonda_mono_esferica", "nota": "Sonda bipolar larga para cirugía laparoscópica o endoscópica: estimular nervios en el campo profundo (p. ej. nervios pélvicos)" },
        { "id": "pinza_estimulacion", "nombre": "Pinza de estimulación", "etiqueta": "pinza_estimulacion", "nota": "Estimula a través de la propia pinza: comprobar un tejido (nervio o tumor) antes de coagularlo o cortarlo" },
        { "id": "bipolar_barra", "nombre": "Bipolar barra / superficie ENG", "etiqueta": "bipolar_barra", "nota": "Electrodo bipolar de barra de superficie: estimulación o registro de nervio periférico a través de la piel (ENG)" },
        { "id": "ref_sonda", "nombre": "Referencia de sonda", "etiqueta": "aguja_subdermica", "color": "rojo", "nota": "Referencia de la sonda monopolar (entrada roja): aguja subdérmica cerca del campo quirúrgico" }
      ]
    },
    {
      "categoria": "Material extra (no ocupa entrada)",
      "sin_entrada": true,
      "plegada_por_defecto": true,
      "items": [
        { "id": "auriculares_peatc", "nombre": "Auriculares PEATC", "etiqueta": "auriculares", "foto": "img/material/auriculares_er3c.jpg", "nota": "Auriculares de inserción ER-3C (Etymotic): rojo = oído derecho, azul = oído izquierdo. Estimulación auditiva para los PEATC (registro en A1/A2). Se conectan al puerto auditivo del equipo (lo indica la descripción de cada caja). No ocupan entrada" },
        { "id": "gafas_vep", "nombre": "Gafas VEP", "etiqueta": "gafas", "nota": "Estimulación visual para los potenciales visuales (O1/O2). No ocupan entrada" }
      ]
    },
    {
      "categoria": "Puentes",
      "plegada_por_defecto": true,
      "items": [
        { "id": "puente", "nombre": "Puente", "etiqueta": "puente", "nota": "Material reutilizable: sale en las cajas a preparar pero no cuenta en el coste" }
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
    { "id": "br", "etiqueta": "Blink Reflex (BR)", "grupo": "monitorizacion", "activa": true, "reflejo": true, "descripcion": "Reflejo del parpadeo" },
    { "id": "rbc", "etiqueta": "RBC", "grupo": "monitorizacion", "activa": true, "reflejo": true, "descripcion": "Reflejo bulbo-cavernoso" },
    { "id": "peatc", "etiqueta": "PEATC", "grupo": "monitorizacion", "activa": true, "descripcion": "Potenciales evocados auditivos de tronco cerebral" },
    { "id": "emg", "etiqueta": "Free-EMG", "grupo": "monitorizacion", "activa": true, "descripcion": "Electromiografía" },
    { "id": "eeg", "etiqueta": "EEG", "grupo": "monitorizacion", "activa": true, "descripcion": "Electroencefalografía" },
    { "id": "ecog", "etiqueta": "ECoG", "grupo": "monitorizacion", "activa": true, "descripcion": "Electrocorticografía" },
    { "id": "pev", "etiqueta": "PEV", "grupo": "monitorizacion", "activa": true, "descripcion": "Potenciales evocados visuales — en estudio" },
    { "id": "c_pev", "etiqueta": "c-PEV", "grupo": "monitorizacion", "activa": true, "descripcion": "Potencial evocado visual cortical" },
    { "id": "erg", "etiqueta": "ERG", "grupo": "monitorizacion", "activa": true, "descripcion": "Electrorretinograma" },
    // "Reflejo H" se divide en dos: no es la misma técnica según el músculo
    // de registro. Se desactiva en vez de borrarse -"desactivar no borra"-,
    // así que un caso o montaje antiguo que todavía diga "reflejo_h" lo
    // sigue mostrando (tachado) en vez de perder la marca.
    { "id": "reflejo_h", "etiqueta": "Reflejo H", "grupo": "monitorizacion", "activa": false, "reflejo": true, "descripcion": "Dividido en H-R Gastrocnemio y H-R Masetero" },
    { "id": "hr_popliteo", "etiqueta": "H-R Sóleo", "grupo": "monitorizacion", "activa": true, "reflejo": true, "descripcion": "Reflejo H por estímulo en hueco poplíteo" },
    { "id": "hr_masetero", "etiqueta": "H-R Masetero (Jaw Jerk)", "grupo": "monitorizacion", "activa": true, "reflejo": true, "descripcion": "Reflejo H por estímulo del nervio masetero — mismo circuito que el jaw jerk / reflejo maseterino clásico. No confundir con el reflejo inhibitorio del masetero (silent period), que es otro circuito y no se estudia en IONM." },
    { "id": "hr_cuadriceps", "etiqueta": "H-R Cuádriceps", "grupo": "monitorizacion", "activa": true, "reflejo": true },

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
    // Unificado con hr_masetero: jaw jerk y H-reflex del masetero son la
    // misma técnica (el H-reflex es el nombre correcto). Se desactiva en
    // vez de borrarse -"desactivar no borra"-; no había ningún caso ni
    // montaje real usando este id (comprobado en el repo de datos).
    { "id": "rx_mandibular", "etiqueta": "Reflejo mandibular (jaw jerk)", "grupo": "monitorizacion", "activa": false, "reflejo": true, "descripcion": "Unificado con HR Masetero — jaw jerk y H-reflex del masetero son la misma técnica." },
    // No es una técnica que se estudie en IONM: el reflejo inhibitorio del
    // masetero (silent period) es un circuito distinto del H-reflex, no un
    // sinónimo. Se desactiva por la misma razón que rx_mandibular.
    { "id": "rx_inhib_maseterino", "etiqueta": "Reflejo inhibitorio del masetero", "grupo": "monitorizacion", "activa": false, "reflejo": true, "descripcion": "No se estudia en IONM: es el silent period maseterino, un circuito inhibitorio distinto del H-reflex del masetero." },
    { "id": "rx_tvcr", "etiqueta": "Reflejo trigémino-vocal (TVcR)", "grupo": "monitorizacion", "activa": true, "reflejo": true },
    { "id": "rx_thr", "etiqueta": "Reflejo trigémino-hipogloso (THR)", "grupo": "monitorizacion", "activa": true, "reflejo": true },
    { "id": "rx_tcr", "etiqueta": "Reflejo trigémino-cervical (TCR)", "grupo": "monitorizacion", "activa": true, "reflejo": true },
    { "id": "rx_lar", "etiqueta": "Reflejo laríngeo aductor (LAR)", "grupo": "monitorizacion", "activa": true, "reflejo": true },
    { "id": "rx_glosofaringeo_trigeminal", "etiqueta": "Reflejo glosofaríngeo-trigeminal", "grupo": "monitorizacion", "activa": true, "reflejo": true },

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
    // Retirada de técnicas por el usuario. "Desactivar no borra": si algún
    // caso o montaje ya la tenía marcada, se sigue viendo (tachada).
    { "id": "mapeo_material_qx", "etiqueta": "Material Qx", "grupo": "mapeo", "activa": false },
    { "id": "eog", "etiqueta": "EOG", "grupo": "mapeo", "activa": true }
  ],

  /* ------------------------------------------------------------------ *
   * MATERIAL QUE NECESITA CADA TÉCNICA (demo-congreso B3.F1)
   * Solo para la "Revisión del montaje" del Resumen: avisos orientativos,
   * que no bloquean nada ni se guardan en el caso. Va aparte de "tecnicas"
   * a propósito: las técnicas se pueden editar desde la web y se guardan en
   * el navegador, así que un campo nuevo ahí no llegaría a quien ya las
   * haya tocado.
   *
   * "grupos": conjuntos de material, por id ("items") y/o por categoría
   *   entera del catálogo ("categorias", así también entra el material que
   *   se añada desde la web a esa categoría).
   * "reglas": por técnica,
   *   - "necesita": grupos que tienen que estar colocados; una lista dentro
   *     de la lista son alternativas (basta uno de ellos).
   *   - "si_hay": la regla solo se aplica si ese grupo está colocado.
   *   - "usa": grupos que la técnica usa aunque no los exija.
   * Todo grupo que aparezca en alguna regla de una técnica marcada cuenta
   * como "usado"; el material colocado que solo está en grupos de técnicas
   * sin marcar da el aviso de "¿falta marcar la técnica?". El material que
   * no está en ningún grupo (tierras, referencias, puentes...) no avisa nunca.
   * ------------------------------------------------------------------ */
  "material_tecnicas": {
    "grupos": {
      "estim_mmss": { "nombre": "estímulo de mediano o cubital", "nombre_en": "median or ulnar stimulation",
        "items": ["l_mediano", "r_mediano", "l_cubital", "r_cubital", "l_cubital_fosa", "r_cubital_fosa"] },
      "estim_mmii": { "nombre": "estímulo de tibial posterior", "nombre_en": "posterior tibial stimulation",
        "items": ["l_ptn", "r_ptn"] },
      "estim_periferico": { "nombre": "estímulo periférico", "nombre_en": "peripheral stimulation",
        "items": ["l_mediano", "r_mediano", "l_cubital", "r_cubital", "l_cubital_fosa", "r_cubital_fosa",
                  "l_ptn", "r_ptn", "l_popliteo", "r_popliteo", "n_dorsal_pene", "clitoris"] },
      "reg_cortical_sep": { "nombre": "registro cortical (Cz', C3', C4'…)", "nombre_en": "cortical recording (Cz', C3', C4'…)",
        "items": ["cz_prima", "c3_prima", "c4_prima", "sc_cz", "sc_c3", "sc_c4", "sc_p3", "sc_pz", "sc_p4"] },
      "reg_erb_cerv": { "nombre": "registro en Erb o cervical", "nombre_en": "Erb's point or cervical recording",
        "items": ["erb1", "erb2", "cv7", "cv2", "cvant", "l_p_cervical", "r_p_cervical"] },
      "reg_mmii_sep": { "nombre": "registro subcortical o periférico (Cv2, poplíteo, lumbar)", "nombre_en": "subcortical or peripheral recording (Cv2, popliteal, lumbar)",
        "items": ["cv2", "cvant", "l_hueco_popliteo", "r_hueco_popliteo", "l_p_popliteo", "r_p_popliteo", "l_p_lumbar", "r_p_lumbar"] },
      "tes": { "nombre": "electrodos de TES", "nombre_en": "TES electrodes",
        "items": ["c1", "c2", "c3", "c4", "c5", "c6", "cz_menos1", "cz_mas6", "conmutador"] },
      "musculos": { "nombre": "músculos de registro", "nombre_en": "recording muscles",
        "categorias": ["Músculos MMSS", "Músculos MMSS — ampliación", "Músculos MMII", "Músculos MMII — ampliación",
                       "Músculos craneales (pares craneales)", "Músculos craneales — ampliación", "Electrodos de tronco y periné"] },
      "musc_craneal": { "nombre": "músculos craneales", "nombre_en": "cranial muscles",
        "categorias": ["Músculos craneales (pares craneales)", "Músculos craneales — ampliación"] },
      "epidural_dw": { "nombre": "electrodo epidural de Onda D", "nombre_en": "epidural D-wave electrode",
        "items": ["epidural_dwave", "px_dw", "dst_dw", "px_1dw", "px_2dw", "px_3dw", "dst_1dw", "dst_2dw", "dst_3dw"] },
      "auriculares": { "nombre": "auriculares de PEATC", "nombre_en": "BAEP earphones", "items": ["auriculares_peatc"] },
      "reg_peatc": { "nombre": "registro auditivo (A1/A2, M1/M2)", "nombre_en": "auditory recording (A1/A2, M1/M2)",
        "items": ["a1", "a2", "sc_m1", "sc_m2"] },
      "gafas": { "nombre": "gafas de PEV", "nombre_en": "VEP goggles", "items": ["gafas_vep", "discos_visuales"] },
      "reg_pev": { "nombre": "registro occipital (O1/O2, Oz)", "nombre_en": "occipital recording (O1/O2, Oz)",
        "items": ["o1", "o2", "sc_oz_mo"] },
      "estim_popliteo": { "nombre": "estímulo en el hueco poplíteo", "nombre_en": "popliteal fossa stimulation",
        "items": ["l_popliteo", "r_popliteo"] },
      "musc_soleo": { "nombre": "registro en gastrocnemio/sóleo", "nombre_en": "gastrocnemius/soleus recording",
        "items": ["l_g", "r_g", "l_rx_h", "r_rx_h"] },
      "estim_trig": { "nombre": "estímulo trigeminal (V1–V3)", "nombre_en": "trigeminal stimulation (V1–V3)",
        "items": ["l_v1", "r_v1", "l_v2", "r_v2", "l_v3", "r_v3"] },
      "ooc": { "nombre": "orbicular del ojo", "nombre_en": "orbicularis oculi",
        "items": ["l_ooc", "r_ooc", "l_ooc_ag", "r_ooc_ag", "l_blinkr", "r_blinkr"] },
      "sondas": { "nombre": "una sonda de estimulación", "nombre_en": "a stimulation probe", "categorias": ["Sondas"] },
      "grid": { "nombre": "un GRID o strip", "nombre_en": "a grid or strip",
        "items": ["grid1", "grid2", "grid3", "grid4", "grid5", "grid6", "grid7", "grid8",
                  "grid2_1", "grid2_2", "grid2_3", "grid2_4", "grid2_5", "grid2_6", "grid2_7", "grid2_8"] }
    },
    "reglas": [
      { "tecnica": "t_pess", "necesita": ["estim_periferico", "reg_cortical_sep"] },
      { "tecnica": "t_pess", "si_hay": "estim_mmss", "necesita": ["reg_erb_cerv"] },
      { "tecnica": "t_pess", "si_hay": "estim_mmii", "necesita": ["reg_mmii_sep"] },
      { "tecnica": "c_pess", "necesita": ["estim_periferico", "grid"] },
      { "tecnica": "phase_reversal", "necesita": ["estim_periferico", "grid"] },
      { "tecnica": "t_pem", "necesita": ["tes", "musculos"] },
      { "tecnica": "c_pem", "necesita": [["grid", "sondas"], "musculos"] },
      { "tecnica": "pem_corticobulbares", "necesita": ["tes", "musc_craneal"] },
      { "tecnica": "onda_d", "necesita": ["epidural_dw", "tes"] },
      { "tecnica": "peatc", "necesita": ["auriculares", "reg_peatc"] },
      { "tecnica": "pev", "necesita": ["gafas", "reg_pev"] },
      { "tecnica": "c_pev", "usa": ["gafas", "grid"] },
      { "tecnica": "erg", "usa": ["gafas"] },
      { "tecnica": "emg", "necesita": ["musculos"] },
      { "tecnica": "hr_popliteo", "necesita": ["estim_popliteo", "musc_soleo"] },
      { "tecnica": "reflejo_h", "necesita": ["estim_popliteo", "musc_soleo"] },
      { "tecnica": "br", "necesita": ["estim_trig", "ooc"] },
      { "tecnica": "mapeo_cortical", "necesita": [["sondas", "grid"]], "usa": ["musculos"] },
      { "tecnica": "mapeo_subcortical", "necesita": ["sondas"], "usa": ["musculos"] },
      { "tecnica": "mapeo_raices_tornillos", "necesita": ["sondas"], "usa": ["musculos"] },
      { "tecnica": "mapeo_iv_ventriculo", "necesita": ["sondas"], "usa": ["musculos"] },
      { "tecnica": "mapeo_nervio_periferico", "necesita": ["sondas"], "usa": ["musculos", "estim_periferico"] },
      { "tecnica": "mapeo_intramedular_ce", "usa": ["sondas", "musculos"] },
      { "tecnica": "mapeo_columnas_dorsales", "usa": ["sondas", "grid", "estim_periferico"] },
      { "tecnica": "mapeo_lenguaje", "usa": ["sondas", "grid", "musculos"] },
      { "tecnica": "mapeo_material_qx", "usa": ["sondas", "musculos"] },
      { "tecnica": "eeg", "usa": ["grid", "reg_cortical_sep", "reg_peatc", "reg_pev"] },
      { "tecnica": "ecog", "usa": ["grid"] },
      { "tecnica": "eog", "usa": ["musculos"] },
      { "tecnica": "rbc", "usa": ["estim_periferico", "musculos"] },
      { "tecnica": "prm", "usa": ["estim_periferico", "musculos"] },
      { "tecnica": "arm", "usa": ["estim_periferico", "musculos"] },
      { "tecnica": "eng_continua", "usa": ["estim_periferico", "musculos", "sondas"] },
      { "tecnica": "hr_masetero", "usa": ["estim_trig", "musc_craneal"] },
      { "tecnica": "hr_cuadriceps", "usa": ["estim_periferico", "musculos"] },
      { "tecnica": "lsr", "usa": ["musc_craneal"] },
      { "tecnica": "onda_f_facial", "usa": ["musc_craneal"] },
      { "tecnica": "pan", "usa": ["musc_craneal", "musculos"] },
      { "tecnica": "retino", "usa": ["musculos"] },
      { "tecnica": "rx_mandibular", "usa": ["estim_trig", "musc_craneal"] },
      { "tecnica": "rx_inhib_maseterino", "usa": ["estim_trig", "musc_craneal"] },
      { "tecnica": "rx_tvcr", "usa": ["estim_trig", "musc_craneal"] },
      { "tecnica": "rx_thr", "usa": ["estim_trig", "musc_craneal"] },
      { "tecnica": "rx_tcr", "usa": ["estim_trig", "musc_craneal", "musculos"] },
      { "tecnica": "rx_lar", "usa": ["musc_craneal"] },
      { "tecnica": "rx_glosofaringeo_trigeminal", "usa": ["estim_trig", "musc_craneal"] }
    ]
  },

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
   * ESCENARIOS (presets de cirugía de fábrica)
   * Vacío a propósito: el usuario pidió quitar todos los montajes de
   * fábrica (los que se sembraban solos como "fab_<clave>" al arrancar,
   * ver uidDeFabrica()/sembrarMontajes() en app.js). Los que ya existían
   * en el navegador/repositorio de datos se borran aparte, una vez, con
   * limpiarMontajesDeFabrica() -vaciar esto no los borra retroactivamente,
   * solo evita que se vuelva a sembrar ninguno nuevo-. Si algún día hace
   * falta un preset de fábrica otra vez, este es el formato:
   *   "escenarios": {
   *     "<clave>": { "nombre": "...", "tecnicas": [...], "asignaciones": {
   *       "<claveCaja>": { "<idEntrada>": "<idMaterial>" } } }
   *   }
   * idEntrada: "3" (canal), "6:anodal" / "8:catodal" (TES MEP),
   *            "ref" / "gnd" / "peatc" / "dns" / "extra_par" (especiales)
   * ------------------------------------------------------------------ */
  "escenarios": {}
};
