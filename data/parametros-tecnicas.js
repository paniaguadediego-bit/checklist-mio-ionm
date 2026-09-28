/*
 * Parámetros de "Cómo se realizó cada técnica" (Gestión de Casos).
 * 
 * Fuente: JSON compartido por el usuario el 10-09-2026 (38 técnicas,
 * con respaldo en fuentes del proyecto donde lo hay -ver "fuente" en cada
 * campo-). Sustituye a la rejilla fija de 8 campos genéricos que había antes
 * (intensidad/frecuencia/nº pulsos/trenes/ISI/filtros/promediación/barrido
 * para TODAS las técnicas por igual): ahora cada técnica trae sus propios
 * campos, del tipo que le corresponde de verdad.
 *
 * IDENTIFICADORES: esta tabla usa sus propios ids (t_sep, c_mep...), que NO
 * siempre coinciden con el id de la técnica en data/surgeries.js (t_pess,
 * c_pem...) -ver TECPAR_ID_MAP al final de este mismo archivo, que traduce
 * de uno a otro-. Dos
 * fusiones a propósito: "erg_retinograma" cubre tanto ERG como Retino, y
 * "prm_arm" cubre tanto PRM como ARM -mismos parámetros técnicos en la
 * práctica-, pero el catálogo de técnicas de surgeries.js NO se tocó: siguen
 * siendo 4 técnicas marcables por separado en "Técnicas realizadas", cada
 * una resuelve aquí al mismo bloque de campos.
 *
 * TIPOS DE CAMPO ("tipo"):
 *   numero         Input de texto libre (no numérico estricto, para poder
 *                  escribir "50 tpn y 40 cub" o rangos). "unidad" fija se
 *                  muestra como pista; "unidades" (varias) añade un select.
 *   texto          Input de texto libre.
 *   seleccion      <select> cerrado si permite_otro=false; si permite_otro=
 *                  true, input con <datalist> -sugiere pero admite otra cosa-.
 *   multiseleccion Chips de las opciones fijas (mismo patrón que "Técnicas
 *                  realizadas"); si permite_otro=true, se pueden añadir chips
 *                  propios sueltos.
 *   si_no          Casilla simple.
 *
 * IDS DE OPCIÓN (29-09-2026, auditoría C8): cada lista "opciones" lleva al
 * lado "ids", en el mismo orden. Se guarda el id y se enseña el texto, así
 * que el texto de una opción se puede corregir sin tocar su id (NUNCA cambiar
 * un id ya usado: dejaría huérfanos los casos guardados). Una opción nueva va
 * al final de las dos listas, con un id nuevo. "igual_a" de visible_si es un id.
 *
 * visible_si: el campo solo se pinta si el campo citado ("campo", el id de
 * OTRO campo de la misma técnica) cumple "igual_a" o "mayor_que" -se
 * reevalúa en vivo si ese otro campo cambia, ver ocultarSegunCampoTec().
 *
 * Guardado: caso.tecnicas_parametros[id_surgeries] = { general: {...},
 * estimulacion: {...}, registro: {...} }, con las claves de cada sección
 * siendo el id del campo -mismo id que aquí-. Un caso con la forma vieja
 * (campos sueltos sin sección) se migra sola al cargar, ver
 * migrarTecnicasParametros() en app.js.
 */
window.PARAMETROS_TECNICAS = {
  "tecnicas": [
    {
      "id": "t_sep",
      "nombre": "t-SEP",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "multiseleccion",
            "opciones": [
              "Caída de amplitud 50% o aumento de latencia 10%",
              "Criterio adaptativo"
            ],
            "ids": ["caida_de_amplitud_50pct_o_aumento_de_latencia_10","criterio_adaptativo"],
            "permite_otro": true,
            "fuente": "Boaro 2026 (clásico); criterio adaptativo propuesto por MacDonald y cols."
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "nervios",
            "etiqueta": "Nervios estimulados",
            "tipo": "multiseleccion",
            "opciones": [
              "Mediano",
              "Cubital",
              "Tibial posterior",
              "Peroneo",
              "Pudendo",
              "Trigémino"
            ],
            "ids": ["mediano","cubital","tibial_posterior","peroneo","pudendo","trigemino"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "patron_estimulacion",
            "etiqueta": "Patrón entre nervios",
            "tipo": "seleccion",
            "opciones": [
              "Secuencial por nervio",
              "Intercalado/alternante",
              "Simultáneo bilateral"
            ],
            "ids": ["secuencial_por_nervio","intercalado_alternante","simultaneo_bilateral"],
            "permite_otro": true
          }
        ],
        "registro": [
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Sacacorchos",
              "Aguja subdérmica",
              "Superficie adhesivo"
            ],
            "ids": ["sacacorchos","aguja_subdermica","superficie_adhesivo"],
            "permite_otro": true
          },
          {
            "id": "tipo_montaje",
            "etiqueta": "Tipo de montaje",
            "tipo": "seleccion",
            "opciones": [
              "Clásico",
              "Optimizado ISION"
            ],
            "ids": ["clasico","optimizado_ision"],
            "permite_otro": true,
            "fuente": "MacDonald 2019 (ISION)"
          },
          {
            "id": "derivaciones_corticales",
            "etiqueta": "Derivaciones corticales",
            "tipo": "multiseleccion",
            "opciones": [
              "C3'–Fz",
              "C4'–Fz",
              "Cz'–Fz"
            ],
            "ids": ["c3_fz","c4_fz","cz_fz"],
            "permite_otro": true,
            "fuente": "Derivaciones clásicas: Boaro 2026"
          },
          {
            "id": "canal_subcortical",
            "etiqueta": "Canal subcortical",
            "tipo": "si_no"
          },
          {
            "id": "canal_periferico_control",
            "etiqueta": "Canal periférico de control",
            "tipo": "multiseleccion",
            "opciones": [
              "Erb",
              "Fosa poplítea"
            ],
            "ids": ["erb","fosa_poplitea"],
            "permite_otro": true
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_promedios",
            "etiqueta": "Nº de promedios",
            "tipo": "numero"
          },
          {
            "id": "rechazo_artefactos",
            "etiqueta": "Rechazo de artefactos activo",
            "tipo": "si_no"
          },
          {
            "id": "n_replicas",
            "etiqueta": "Nº de réplicas (reproducibilidad)",
            "tipo": "numero"
          }
        ]
      }
    },
    {
      "id": "c_sep",
      "nombre": "c-SEP",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "multiseleccion",
            "opciones": [
              "Caída de amplitud 50% o aumento de latencia 10%",
              "Criterio adaptativo"
            ],
            "ids": ["caida_de_amplitud_50pct_o_aumento_de_latencia_10","criterio_adaptativo"],
            "permite_otro": true,
            "fuente": "Boaro 2026 (clásico); criterio adaptativo propuesto por MacDonald y cols."
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "nervios",
            "etiqueta": "Nervios estimulados",
            "tipo": "multiseleccion",
            "opciones": [
              "Mediano",
              "Cubital",
              "Tibial posterior",
              "Peroneo",
              "Pudendo",
              "Trigémino"
            ],
            "ids": ["mediano","cubital","tibial_posterior","peroneo","pudendo","trigemino"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "patron_estimulacion",
            "etiqueta": "Patrón entre nervios",
            "tipo": "seleccion",
            "opciones": [
              "Secuencial por nervio",
              "Intercalado/alternante",
              "Simultáneo bilateral"
            ],
            "ids": ["secuencial_por_nervio","intercalado_alternante","simultaneo_bilateral"],
            "permite_otro": true
          }
        ],
        "registro": [
          {
            "id": "strip_n_contactos",
            "etiqueta": "Strip/grid: nº de contactos",
            "tipo": "numero"
          },
          {
            "id": "strip_localizacion",
            "etiqueta": "Strip/grid: localización",
            "tipo": "texto"
          },
          {
            "id": "montaje_registro",
            "etiqueta": "Montaje de registro",
            "tipo": "seleccion",
            "opciones": [
              "Referencial",
              "Bipolar"
            ],
            "ids": ["referencial","bipolar"],
            "permite_otro": false
          },
          {
            "id": "referencia",
            "etiqueta": "Referencia",
            "tipo": "texto"
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_promedios",
            "etiqueta": "Nº de promedios",
            "tipo": "numero"
          },
          {
            "id": "rechazo_artefactos",
            "etiqueta": "Rechazo de artefactos activo",
            "tipo": "si_no"
          },
          {
            "id": "n_replicas",
            "etiqueta": "Nº de réplicas (reproducibilidad)",
            "tipo": "numero"
          }
        ]
      }
    },
    {
      "id": "t_mep",
      "nombre": "t-MEP",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "multiseleccion",
            "opciones": [
              "Todo o nada (desaparición)",
              "Caída de amplitud",
              "Aumento de umbral",
              "Simplificación de morfología"
            ],
            "ids": ["todo_o_nada_desaparicion","caida_de_amplitud","aumento_de_umbral","simplificacion_de_morfologia"],
            "permite_otro": true,
            "fuente": "MacDonald 2013 (ASNM)"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "montaje_estimulacion",
            "etiqueta": "Montaje de estimulación",
            "tipo": "seleccion",
            "opciones": [
              "C1–C2",
              "C2–C1",
              "C3–C4",
              "C4–C3"
            ],
            "ids": ["c1_c2","c2_c1","c3_c4","c4_c3"],
            "permite_otro": true,
            "fuente": "Deletis cap. 31 (C1–C2/C2–C1, C3–C4/C4–C3)",
            "nota": "Opciones orientativas y editables"
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Sacacorchos",
              "Aguja subdérmica"
            ],
            "ids": ["sacacorchos","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero"
          },
          {
            "id": "isi",
            "etiqueta": "ISI (intervalo interestímulo)",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "n_pulsos",
              "mayor_que": 1
            }
          },
          {
            "id": "cadencia_trenes",
            "etiqueta": "Cadencia entre trenes",
            "tipo": "numero",
            "unidades": [
              "Hz",
              "s"
            ]
          },
          {
            "id": "facilitacion",
            "etiqueta": "Facilitación",
            "tipo": "seleccion",
            "opciones": [
              "Ninguna",
              "Doble tren"
            ],
            "ids": ["ninguna","doble_tren"],
            "permite_otro": true
          },
          {
            "id": "intervalo_entre_trenes",
            "etiqueta": "Intervalo entre trenes (doble tren)",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "facilitacion",
              "igual_a": "doble_tren"
            }
          },
          {
            "id": "n_pulsos_tren_acondicionante",
            "etiqueta": "Nº de pulsos del tren acondicionante",
            "tipo": "numero",
            "visible_si": {
              "campo": "facilitacion",
              "igual_a": "doble_tren"
            }
          },
          {
            "id": "bloque_mordida",
            "etiqueta": "Bloque de mordida colocado",
            "tipo": "si_no"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Deltoides",
              "Bíceps",
              "Tríceps",
              "Extensores del carpo",
              "Flexores del carpo",
              "Abductor corto del pulgar (APB)",
              "Abductor del meñique (ADM)",
              "Primer interóseo dorsal",
              "Aductores",
              "Cuádriceps (vasto/recto femoral)",
              "Isquiotibiales",
              "Tibial anterior",
              "Gastrocnemio",
              "Sóleo",
              "Extensor corto de los dedos (EDB)",
              "Abductor del primer dedo (AH)",
              "Intercostales",
              "Recto abdominal",
              "Esfínter anal externo"
            ],
            "ids": ["deltoides","biceps","triceps","extensores_del_carpo","flexores_del_carpo","abductor_corto_del_pulgar_apb","abductor_del_menique_adm","primer_interoseo_dorsal","aductores","cuadriceps_vasto_recto_femoral","isquiotibiales","tibial_anterior","gastrocnemio","soleo","extensor_corto_de_los_dedos_edb","abductor_del_primer_dedo_ah","intercostales","recto_abdominal","esfinter_anal_externo"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "c_mep",
      "nombre": "c-MEP",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "multiseleccion",
            "opciones": [
              "Todo o nada (desaparición)",
              "Caída de amplitud",
              "Aumento de umbral",
              "Simplificación de morfología"
            ],
            "ids": ["todo_o_nada_desaparicion","caida_de_amplitud","aumento_de_umbral","simplificacion_de_morfologia"],
            "permite_otro": true,
            "fuente": "MacDonald 2013 (ASNM)"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "strip_n_contactos",
            "etiqueta": "Strip/grid: nº de contactos",
            "tipo": "numero"
          },
          {
            "id": "contacto_catodo",
            "etiqueta": "Contacto(s) de estímulo",
            "tipo": "texto"
          },
          {
            "id": "anodo_referencia",
            "etiqueta": "Ánodo/referencia",
            "tipo": "texto"
          },
          {
            "id": "localizacion_confirmada_phase_reversal",
            "etiqueta": "Localización confirmada por phase-reversal",
            "tipo": "si_no"
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero"
          },
          {
            "id": "isi",
            "etiqueta": "ISI (intervalo interestímulo)",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "n_pulsos",
              "mayor_que": 1
            }
          },
          {
            "id": "cadencia_trenes",
            "etiqueta": "Cadencia entre trenes",
            "tipo": "numero",
            "unidades": [
              "Hz",
              "s"
            ]
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Deltoides",
              "Bíceps",
              "Tríceps",
              "Extensores del carpo",
              "Flexores del carpo",
              "Abductor corto del pulgar (APB)",
              "Abductor del meñique (ADM)",
              "Primer interóseo dorsal",
              "Aductores",
              "Cuádriceps (vasto/recto femoral)",
              "Isquiotibiales",
              "Tibial anterior",
              "Gastrocnemio",
              "Sóleo",
              "Extensor corto de los dedos (EDB)",
              "Abductor del primer dedo (AH)",
              "Frontal",
              "Orbicular del ojo",
              "Orbicular de la boca",
              "Mentoniano",
              "Masetero",
              "Temporal",
              "Velo del paladar/faringe",
              "Cuerdas vocales (electrodo de tubo)",
              "Cricotiroideo",
              "Esternocleidomastoideo",
              "Trapecio",
              "Lengua"
            ],
            "ids": ["deltoides","biceps","triceps","extensores_del_carpo","flexores_del_carpo","abductor_corto_del_pulgar_apb","abductor_del_menique_adm","primer_interoseo_dorsal","aductores","cuadriceps_vasto_recto_femoral","isquiotibiales","tibial_anterior","gastrocnemio","soleo","extensor_corto_de_los_dedos_edb","abductor_del_primer_dedo_ah","frontal","orbicular_del_ojo","orbicular_de_la_boca","mentoniano","masetero","temporal","velo_del_paladar_faringe","cuerdas_vocales_electrodo_de_tubo","cricotiroideo","esternocleidomastoideo","trapecio","lengua"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "comep",
      "nombre": "MEP córtico-bulbares",
      "alias": [
        "CoMEP"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "multiseleccion",
            "opciones": [
              "Todo o nada (desaparición)",
              "Caída de amplitud",
              "Aumento de umbral",
              "Simplificación de morfología"
            ],
            "ids": ["todo_o_nada_desaparicion","caida_de_amplitud","aumento_de_umbral","simplificacion_de_morfologia"],
            "permite_otro": true,
            "fuente": "MacDonald 2013 (ASNM)"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "montaje_estimulacion",
            "etiqueta": "Montaje de estimulación",
            "tipo": "seleccion",
            "opciones": [
              "C3–Cz",
              "C4–Cz",
              "C5–Cz",
              "C6–Cz"
            ],
            "ids": ["c3_cz","c4_cz","c5_cz","c6_cz"],
            "permite_otro": true,
            "nota": "Opciones orientativas y editables"
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Sacacorchos",
              "Aguja subdérmica"
            ],
            "ids": ["sacacorchos","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero"
          },
          {
            "id": "isi",
            "etiqueta": "ISI (intervalo interestímulo)",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "n_pulsos",
              "mayor_que": 1
            }
          },
          {
            "id": "cadencia_trenes",
            "etiqueta": "Cadencia entre trenes",
            "tipo": "numero",
            "unidades": [
              "Hz",
              "s"
            ]
          },
          {
            "id": "facilitacion",
            "etiqueta": "Facilitación",
            "tipo": "seleccion",
            "opciones": [
              "Ninguna",
              "Doble tren"
            ],
            "ids": ["ninguna","doble_tren"],
            "permite_otro": true
          },
          {
            "id": "intervalo_entre_trenes",
            "etiqueta": "Intervalo entre trenes (doble tren)",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "facilitacion",
              "igual_a": "doble_tren"
            }
          },
          {
            "id": "n_pulsos_tren_acondicionante",
            "etiqueta": "Nº de pulsos del tren acondicionante",
            "tipo": "numero",
            "visible_si": {
              "campo": "facilitacion",
              "igual_a": "doble_tren"
            }
          },
          {
            "id": "bloque_mordida",
            "etiqueta": "Bloque de mordida colocado",
            "tipo": "si_no"
          },
          {
            "id": "prueba_pulso_unico",
            "etiqueta": "Prueba de pulso único para descartar estímulo periférico directo",
            "tipo": "si_no"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Frontal",
              "Orbicular del ojo",
              "Orbicular de la boca",
              "Mentoniano",
              "Masetero",
              "Temporal",
              "Velo del paladar/faringe",
              "Cuerdas vocales (electrodo de tubo)",
              "Cricotiroideo",
              "Esternocleidomastoideo",
              "Trapecio",
              "Lengua"
            ],
            "ids": ["frontal","orbicular_del_ojo","orbicular_de_la_boca","mentoniano","masetero","temporal","velo_del_paladar_faringe","cuerdas_vocales_electrodo_de_tubo","cricotiroideo","esternocleidomastoideo","trapecio","lengua"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "onda_d",
      "nombre": "Onda D",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "multiseleccion",
            "opciones": [
              "Caída de amplitud"
            ],
            "ids": ["caida_de_amplitud"],
            "permite_otro": true
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "montaje_estimulacion",
            "etiqueta": "Montaje de estimulación",
            "tipo": "seleccion",
            "opciones": [
              "C1–C2",
              "C2–C1",
              "C3–C4",
              "C4–C3"
            ],
            "ids": ["c1_c2","c2_c1","c3_c4","c4_c3"],
            "permite_otro": true,
            "nota": "Opciones orientativas y editables"
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Sacacorchos",
              "Aguja subdérmica"
            ],
            "ids": ["sacacorchos","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "nota_pulso",
            "etiqueta": "Pulso único",
            "tipo": "texto",
            "nota": "Registrar aquí si se usó algo distinto a pulso único"
          }
        ],
        "registro": [
          {
            "id": "electrodo_registro",
            "etiqueta": "Electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Epidural (catéter)",
              "Subdural"
            ],
            "ids": ["epidural_cateter","subdural"],
            "permite_otro": true
          },
          {
            "id": "n_contactos",
            "etiqueta": "Nº de contactos",
            "tipo": "numero"
          },
          {
            "id": "nivel_vertebral",
            "etiqueta": "Nivel vertebral",
            "tipo": "texto"
          },
          {
            "id": "posicion_respecto_lesion",
            "etiqueta": "Posición respecto a la lesión",
            "tipo": "seleccion",
            "opciones": [
              "Caudal",
              "Rostral (control)",
              "Rostral + caudal"
            ],
            "ids": ["caudal","rostral_control","rostral_caudal"],
            "permite_otro": false
          },
          {
            "id": "contactos_montaje",
            "etiqueta": "Contactos del montaje de registro",
            "tipo": "texto"
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_promedios",
            "etiqueta": "Nº de promedios",
            "tipo": "numero"
          }
        ]
      }
    },
    {
      "id": "blink_reflex",
      "nombre": "Blink Reflex (BR)",
      "alias": [
        "BR"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sitio_estimulo",
            "etiqueta": "Sitio de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Supraorbitario"
            ],
            "ids": ["supraorbitario"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero"
          },
          {
            "id": "isi",
            "etiqueta": "ISI (intervalo interestímulo)",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "n_pulsos",
              "mayor_que": 1
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Orbicular del ojo"
            ],
            "ids": ["orbicular_del_ojo"],
            "permite_otro": true
          },
          {
            "id": "lado_registro",
            "etiqueta": "Lado de registro",
            "tipo": "seleccion",
            "opciones": [
              "Ipsilateral",
              "Contralateral",
              "Bilateral"
            ],
            "ids": ["ipsilateral","contralateral","bilateral"],
            "permite_otro": false
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "R1",
              "R2"
            ],
            "ids": ["r1","r2"],
            "permite_otro": false
          },
          {
            "id": "latencia_medida_desde",
            "etiqueta": "Latencia medida desde",
            "tipo": "seleccion",
            "opciones": [
              "Primer pulso del tren",
              "Último pulso del tren"
            ],
            "ids": ["primer_pulso_del_tren","ultimo_pulso_del_tren"],
            "permite_otro": false,
            "fuente": "Lima Medeiros 2024 mide desde el inicio del último pulso del tren"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "rbc",
      "nombre": "RBC",
      "alias": [
        "Reflejo bulbocavernoso"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sitio_estimulo",
            "etiqueta": "Sitio de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Nervio dorsal del pene",
              "Nervio dorsal del clítoris"
            ],
            "ids": ["nervio_dorsal_del_pene","nervio_dorsal_del_clitoris"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Anillo",
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["anillo","superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero"
          },
          {
            "id": "isi",
            "etiqueta": "ISI (intervalo interestímulo)",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "n_pulsos",
              "mayor_que": 1
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Esfínter anal externo"
            ],
            "ids": ["esfinter_anal_externo"],
            "permite_otro": true
          },
          {
            "id": "lado_registro",
            "etiqueta": "Lado de registro",
            "tipo": "seleccion",
            "opciones": [
              "Ipsilateral",
              "Contralateral",
              "Bilateral"
            ],
            "ids": ["ipsilateral","contralateral","bilateral"],
            "permite_otro": false
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "Respuesta refleja"
            ],
            "ids": ["respuesta_refleja"],
            "permite_otro": false
          },
          {
            "id": "latencia_medida_desde",
            "etiqueta": "Latencia medida desde",
            "tipo": "seleccion",
            "opciones": [
              "Primer pulso del tren",
              "Último pulso del tren"
            ],
            "ids": ["primer_pulso_del_tren","ultimo_pulso_del_tren"],
            "permite_otro": false,
            "fuente": "Lima Medeiros 2024 mide desde el inicio del último pulso del tren"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "peatc",
      "nombre": "PEATC",
      "alias": [
        "BAEP"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "transductor",
            "etiqueta": "Transductor",
            "tipo": "seleccion",
            "opciones": [
              "Inserto",
              "Auricular"
            ],
            "ids": ["inserto","auricular"],
            "permite_otro": true
          },
          {
            "id": "tipo_estimulo",
            "etiqueta": "Tipo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Clic",
              "Tone burst"
            ],
            "ids": ["clic","tone_burst"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad",
            "tipo": "seleccion",
            "opciones": [
              "Rarefacción",
              "Condensación",
              "Alternante"
            ],
            "ids": ["rarefaccion","condensacion","alternante"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidades": [
              "dB nHL",
              "dB SPL",
              "dB peSPL"
            ]
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "enmascaramiento_contralateral",
            "etiqueta": "Enmascaramiento contralateral",
            "tipo": "numero",
            "unidad": "dB"
          }
        ],
        "registro": [
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Sacacorchos",
              "Superficie adhesivo"
            ],
            "ids": ["aguja_subdermica","sacacorchos","superficie_adhesivo"],
            "permite_otro": true
          },
          {
            "id": "derivaciones",
            "etiqueta": "Derivaciones",
            "tipo": "multiseleccion",
            "opciones": [
              "Cz–Ai (ipsilateral)",
              "Cz–Ac (contralateral)"
            ],
            "ids": ["cz_ai_ipsilateral","cz_ac_contralateral"],
            "permite_otro": true
          },
          {
            "id": "registro_directo",
            "etiqueta": "Registro directo adicional",
            "tipo": "seleccion",
            "opciones": [
              "No",
              "ECochG",
              "CNAP nervio VIII",
              "Núcleo coclear"
            ],
            "ids": ["no","ecochg","cnap_nervio_viii","nucleo_coclear"],
            "permite_otro": true
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_promedios",
            "etiqueta": "Nº de promedios",
            "tipo": "numero"
          },
          {
            "id": "rechazo_artefactos",
            "etiqueta": "Rechazo de artefactos activo",
            "tipo": "si_no"
          },
          {
            "id": "n_replicas",
            "etiqueta": "Nº de réplicas (reproducibilidad)",
            "tipo": "numero"
          }
        ]
      }
    },
    {
      "id": "free_emg",
      "nombre": "Free-EMG",
      "nota": "Sin estimulación: la sección 'estimulacion' queda vacía",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Frontal",
              "Orbicular del ojo",
              "Orbicular de la boca",
              "Mentoniano",
              "Masetero",
              "Temporal",
              "Velo del paladar/faringe",
              "Cuerdas vocales (electrodo de tubo)",
              "Cricotiroideo",
              "Esternocleidomastoideo",
              "Trapecio",
              "Lengua",
              "Deltoides",
              "Bíceps",
              "Tríceps",
              "Extensores del carpo",
              "Flexores del carpo",
              "Abductor corto del pulgar (APB)",
              "Abductor del meñique (ADM)",
              "Primer interóseo dorsal",
              "Aductores",
              "Cuádriceps (vasto/recto femoral)",
              "Isquiotibiales",
              "Tibial anterior",
              "Gastrocnemio",
              "Sóleo",
              "Extensor corto de los dedos (EDB)",
              "Abductor del primer dedo (AH)",
              "Intercostales",
              "Recto abdominal",
              "Esfínter anal externo"
            ],
            "ids": ["frontal","orbicular_del_ojo","orbicular_de_la_boca","mentoniano","masetero","temporal","velo_del_paladar_faringe","cuerdas_vocales_electrodo_de_tubo","cricotiroideo","esternocleidomastoideo","trapecio","lengua","deltoides","biceps","triceps","extensores_del_carpo","flexores_del_carpo","abductor_corto_del_pulgar_apb","abductor_del_menique_adm","primer_interoseo_dorsal","aductores","cuadriceps_vasto_recto_femoral","isquiotibiales","tibial_anterior","gastrocnemio","soleo","extensor_corto_de_los_dedos_edb","abductor_del_primer_dedo_ah","intercostales","recto_abdominal","esfinter_anal_externo"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "sensibilidad",
            "etiqueta": "Sensibilidad",
            "tipo": "numero",
            "unidad": "µV/div"
          },
          {
            "id": "base_tiempo",
            "etiqueta": "Base de tiempo",
            "tipo": "numero",
            "unidades": [
              "ms/div",
              "s/pantalla"
            ]
          },
          {
            "id": "umbral_audio",
            "etiqueta": "Umbral de audio/alarma",
            "tipo": "numero",
            "unidad": "µV"
          },
          {
            "id": "audio_activo",
            "etiqueta": "Audio activo",
            "tipo": "si_no"
          },
          {
            "id": "silenciado_coagulacion",
            "etiqueta": "Silenciado durante la coagulación",
            "tipo": "si_no"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          }
        ]
      }
    },
    {
      "id": "eeg",
      "nombre": "EEG",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [],
        "registro": [
          {
            "id": "n_canales",
            "etiqueta": "Nº de canales",
            "tipo": "numero"
          },
          {
            "id": "montaje",
            "etiqueta": "Montaje",
            "tipo": "texto"
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Sacacorchos",
              "Superficie adhesivo"
            ],
            "ids": ["aguja_subdermica","sacacorchos","superficie_adhesivo"],
            "permite_otro": true
          },
          {
            "id": "sensibilidad",
            "etiqueta": "Sensibilidad",
            "tipo": "numero",
            "unidad": "µV/mm"
          },
          {
            "id": "base_tiempo",
            "etiqueta": "Base de tiempo",
            "tipo": "numero",
            "unidad": "s/pantalla"
          },
          {
            "id": "procesado",
            "etiqueta": "Procesado",
            "tipo": "multiseleccion",
            "opciones": [
              "DSA/espectrograma",
              "SEF",
              "Índice de supresión (BSR)",
              "Índice comercial de profundidad",
              "Ninguno"
            ],
            "ids": ["dsa_espectrograma","sef","indice_de_supresion_bsr","indice_comercial_de_profundidad","ninguno"],
            "permite_otro": true
          },
          {
            "id": "objetivo",
            "etiqueta": "Objetivo",
            "tipo": "multiseleccion",
            "opciones": [
              "Profundidad anestésica",
              "Isquemia",
              "Crisis",
              "Supresión farmacológica"
            ],
            "ids": ["profundidad_anestesica","isquemia","crisis","supresion_farmacologica"],
            "permite_otro": true
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          }
        ]
      }
    },
    {
      "id": "ecog",
      "nombre": "ECoG",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [],
        "registro": [
          {
            "id": "tipo_electrodo",
            "etiqueta": "Tipo de electrodo",
            "tipo": "seleccion",
            "opciones": [
              "Strip",
              "Grid",
              "Profundidad"
            ],
            "ids": ["strip","grid","profundidad"],
            "permite_otro": true
          },
          {
            "id": "n_contactos",
            "etiqueta": "Nº de contactos",
            "tipo": "numero"
          },
          {
            "id": "localizacion",
            "etiqueta": "Localización",
            "tipo": "texto"
          },
          {
            "id": "montaje_registro",
            "etiqueta": "Montaje",
            "tipo": "seleccion",
            "opciones": [
              "Referencial",
              "Bipolar"
            ],
            "ids": ["referencial","bipolar"],
            "permite_otro": false
          },
          {
            "id": "referencia",
            "etiqueta": "Referencia",
            "tipo": "texto"
          },
          {
            "id": "sensibilidad",
            "etiqueta": "Sensibilidad",
            "tipo": "numero",
            "unidad": "µV/mm"
          },
          {
            "id": "base_tiempo",
            "etiqueta": "Base de tiempo",
            "tipo": "numero",
            "unidad": "s/pantalla"
          },
          {
            "id": "situacion_anestesica",
            "etiqueta": "Situación anestésica durante el registro",
            "tipo": "texto"
          },
          {
            "id": "objetivo",
            "etiqueta": "Objetivo",
            "tipo": "multiseleccion",
            "opciones": [
              "Actividad epileptiforme",
              "Postdescargas durante mapeo"
            ],
            "ids": ["actividad_epileptiforme","postdescargas_durante_mapeo"],
            "permite_otro": true
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          }
        ]
      }
    },
    {
      "id": "pev",
      "nombre": "PEV",
      "alias": [
        "VEP",
        "Flash VEP"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "estimulador",
            "etiqueta": "Estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Gafas LED",
              "Pad LED de silicona",
              "Pad LED esterilizable"
            ],
            "ids": ["gafas_led","pad_led_de_silicona","pad_led_esterilizable"],
            "permite_otro": true,
            "fuente": "Deletis cap. 4"
          },
          {
            "id": "ojo_estimulado",
            "etiqueta": "Ojo estimulado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Ambos por separado"
            ],
            "ids": ["derecho","izquierdo","ambos_por_separado"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA",
            "nota": "Corriente del LED en el amplificador"
          },
          {
            "id": "supramaxima_por_erg",
            "etiqueta": "Intensidad fijada como supramáxima por ERG",
            "tipo": "si_no",
            "fuente": "Deletis cap. 4: intensidad óptima = mínima que produce el ERG máximo"
          },
          {
            "id": "duracion_flash",
            "etiqueta": "Duración del flash",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Grapa (staple)",
              "Aguja subdérmica",
              "Sacacorchos"
            ],
            "ids": ["grapa_staple","aguja_subdermica","sacacorchos"],
            "permite_otro": true,
            "fuente": "Deletis cap. 4 (grapa)"
          },
          {
            "id": "derivaciones_activas",
            "etiqueta": "Derivaciones activas",
            "tipo": "multiseleccion",
            "opciones": [
              "LT",
              "LO",
              "Oz",
              "RO",
              "RT",
              "O1",
              "O2"
            ],
            "ids": ["lt","lo","oz","ro","rt","o1","o2"],
            "permite_otro": true,
            "fuente": "Deletis cap. 4: LT, LO, Oz, RO, RT"
          },
          {
            "id": "referencia",
            "etiqueta": "Referencia",
            "tipo": "texto",
            "nota": "Deletis cap. 4: A1 y A2 unidas"
          },
          {
            "id": "erg_simultaneo",
            "etiqueta": "ERG simultáneo",
            "tipo": "si_no"
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_promedios",
            "etiqueta": "Nº de promedios",
            "tipo": "numero"
          },
          {
            "id": "rechazo_artefactos",
            "etiqueta": "Rechazo de artefactos activo",
            "tipo": "si_no"
          },
          {
            "id": "n_replicas",
            "etiqueta": "Nº de réplicas (reproducibilidad)",
            "tipo": "numero"
          }
        ]
      }
    },
    {
      "id": "c_pev",
      "nombre": "c-PEV",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "estimulador",
            "etiqueta": "Estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Gafas LED",
              "Pad LED de silicona",
              "Pad LED esterilizable"
            ],
            "ids": ["gafas_led","pad_led_de_silicona","pad_led_esterilizable"],
            "permite_otro": true,
            "fuente": "Deletis cap. 4"
          },
          {
            "id": "ojo_estimulado",
            "etiqueta": "Ojo estimulado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Ambos por separado"
            ],
            "ids": ["derecho","izquierdo","ambos_por_separado"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA",
            "nota": "Corriente del LED en el amplificador"
          },
          {
            "id": "supramaxima_por_erg",
            "etiqueta": "Intensidad fijada como supramáxima por ERG",
            "tipo": "si_no",
            "fuente": "Deletis cap. 4: intensidad óptima = mínima que produce el ERG máximo"
          },
          {
            "id": "duracion_flash",
            "etiqueta": "Duración del flash",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "strip_n_contactos",
            "etiqueta": "Strip/grid: nº de contactos",
            "tipo": "numero"
          },
          {
            "id": "strip_localizacion",
            "etiqueta": "Strip/grid: localización",
            "tipo": "texto"
          },
          {
            "id": "montaje_registro",
            "etiqueta": "Montaje de registro",
            "tipo": "seleccion",
            "opciones": [
              "Referencial",
              "Bipolar"
            ],
            "ids": ["referencial","bipolar"],
            "permite_otro": false
          },
          {
            "id": "referencia",
            "etiqueta": "Referencia",
            "tipo": "texto"
          },
          {
            "id": "erg_simultaneo",
            "etiqueta": "ERG simultáneo",
            "tipo": "si_no"
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_promedios",
            "etiqueta": "Nº de promedios",
            "tipo": "numero"
          },
          {
            "id": "rechazo_artefactos",
            "etiqueta": "Rechazo de artefactos activo",
            "tipo": "si_no"
          },
          {
            "id": "n_replicas",
            "etiqueta": "Nº de réplicas (reproducibilidad)",
            "tipo": "numero"
          }
        ]
      }
    },
    {
      "id": "erg_retinograma",
      "nombre": "ERG / Retinograma",
      "alias": [
        "ERG",
        "Retino",
        "Retinograma"
      ],
      "nota": "Fusión de ERG y Retino. Si el estímulo es el del PEV, se ocultan los campos de estímulo",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "estimulo_compartido_pev",
            "etiqueta": "Estímulo compartido con el PEV",
            "tipo": "si_no"
          },
          {
            "id": "estimulador",
            "etiqueta": "Estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Gafas LED",
              "Pad LED de silicona",
              "Pad LED esterilizable"
            ],
            "ids": ["gafas_led","pad_led_de_silicona","pad_led_esterilizable"],
            "permite_otro": true,
            "fuente": "Deletis cap. 4",
            "visible_si": {
              "campo": "estimulo_compartido_pev",
              "igual_a": false
            }
          },
          {
            "id": "ojo_estimulado",
            "etiqueta": "Ojo estimulado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Ambos por separado"
            ],
            "ids": ["derecho","izquierdo","ambos_por_separado"],
            "permite_otro": false,
            "visible_si": {
              "campo": "estimulo_compartido_pev",
              "igual_a": false
            }
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA",
            "nota": "Corriente del LED en el amplificador",
            "visible_si": {
              "campo": "estimulo_compartido_pev",
              "igual_a": false
            }
          },
          {
            "id": "supramaxima_por_erg",
            "etiqueta": "Intensidad fijada como supramáxima por ERG",
            "tipo": "si_no",
            "fuente": "Deletis cap. 4: intensidad óptima = mínima que produce el ERG máximo",
            "visible_si": {
              "campo": "estimulo_compartido_pev",
              "igual_a": false
            }
          },
          {
            "id": "duracion_flash",
            "etiqueta": "Duración del flash",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "estimulo_compartido_pev",
              "igual_a": false
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz",
            "visible_si": {
              "campo": "estimulo_compartido_pev",
              "igual_a": false
            }
          }
        ],
        "registro": [
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica"
            ],
            "ids": ["aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "posicion_electrodo",
            "etiqueta": "Posición del electrodo",
            "tipo": "texto",
            "nota": "Deletis cap. 4: canto externo"
          },
          {
            "id": "referencia",
            "etiqueta": "Referencia",
            "tipo": "texto"
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_promedios",
            "etiqueta": "Nº de promedios",
            "tipo": "numero"
          },
          {
            "id": "rechazo_artefactos",
            "etiqueta": "Rechazo de artefactos activo",
            "tipo": "si_no"
          },
          {
            "id": "n_replicas",
            "etiqueta": "Nº de réplicas (reproducibilidad)",
            "tipo": "numero"
          }
        ]
      }
    },
    {
      "id": "hr_soleo",
      "nombre": "H-R Sóleo",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sitio_estimulo",
            "etiqueta": "Sitio de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Nervio tibial (hueco poplíteo)"
            ],
            "ids": ["nervio_tibial_hueco_popliteo"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "criterio_intensidad",
            "etiqueta": "Criterio de intensidad",
            "tipo": "seleccion",
            "opciones": [
              "H máxima",
              "Submáxima fija"
            ],
            "ids": ["h_maxima","submaxima_fija"],
            "permite_otro": true
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Sóleo",
              "Gastrocnemio"
            ],
            "ids": ["soleo","gastrocnemio"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "H",
              "M"
            ],
            "ids": ["h","m"],
            "permite_otro": false
          },
          {
            "id": "onda_m_control",
            "etiqueta": "Onda M de control",
            "tipo": "si_no"
          },
          {
            "id": "parametro_vigilado",
            "etiqueta": "Parámetro vigilado",
            "tipo": "multiseleccion",
            "opciones": [
              "Amplitud H",
              "Cociente H/M",
              "Latencia H"
            ],
            "ids": ["amplitud_h","cociente_h_m","latencia_h"],
            "permite_otro": true
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "hr_masetero",
      "nombre": "H-R Masetero (Jaw Jerk)",
      "alias": [
        "Jaw Jerk",
        "H maseterino"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "modo_estimulo",
            "etiqueta": "Modo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Eléctrico (nervio maseterino)",
              "Mecánico (martillo con trigger)"
            ],
            "ids": ["electrico_nervio_maseterino","mecanico_martillo_con_trigger"],
            "permite_otro": false,
            "fuente": "Urriza 2025 cita el H maseterino (Ulkatan 2017) y el jaw jerk como reflejos distintos"
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true,
            "visible_si": {
              "campo": "modo_estimulo",
              "igual_a": "electrico_nervio_maseterino"
            }
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto",
            "visible_si": {
              "campo": "modo_estimulo",
              "igual_a": "electrico_nervio_maseterino"
            }
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false,
            "visible_si": {
              "campo": "modo_estimulo",
              "igual_a": "electrico_nervio_maseterino"
            }
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA",
            "visible_si": {
              "campo": "modo_estimulo",
              "igual_a": "electrico_nervio_maseterino"
            }
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "modo_estimulo",
              "igual_a": "electrico_nervio_maseterino"
            }
          },
          {
            "id": "criterio_intensidad",
            "etiqueta": "Criterio de intensidad",
            "tipo": "seleccion",
            "opciones": [
              "H máxima",
              "Submáxima fija"
            ],
            "ids": ["h_maxima","submaxima_fija"],
            "permite_otro": true,
            "visible_si": {
              "campo": "modo_estimulo",
              "igual_a": "electrico_nervio_maseterino"
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Masetero"
            ],
            "ids": ["masetero"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "H",
              "M"
            ],
            "ids": ["h","m"],
            "permite_otro": false
          },
          {
            "id": "onda_m_control",
            "etiqueta": "Onda M de control",
            "tipo": "si_no"
          },
          {
            "id": "parametro_vigilado",
            "etiqueta": "Parámetro vigilado",
            "tipo": "multiseleccion",
            "opciones": [
              "Amplitud H",
              "Cociente H/M",
              "Latencia H"
            ],
            "ids": ["amplitud_h","cociente_h_m","latencia_h"],
            "permite_otro": true
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "hr_cuadriceps",
      "nombre": "H-R Cuádriceps",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sitio_estimulo",
            "etiqueta": "Sitio de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Nervio femoral (región inguinal)"
            ],
            "ids": ["nervio_femoral_region_inguinal"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "criterio_intensidad",
            "etiqueta": "Criterio de intensidad",
            "tipo": "seleccion",
            "opciones": [
              "H máxima",
              "Submáxima fija"
            ],
            "ids": ["h_maxima","submaxima_fija"],
            "permite_otro": true
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Vasto medial",
              "Recto femoral",
              "Vasto lateral"
            ],
            "ids": ["vasto_medial","recto_femoral","vasto_lateral"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "H",
              "M"
            ],
            "ids": ["h","m"],
            "permite_otro": false
          },
          {
            "id": "onda_m_control",
            "etiqueta": "Onda M de control",
            "tipo": "si_no"
          },
          {
            "id": "parametro_vigilado",
            "etiqueta": "Parámetro vigilado",
            "tipo": "multiseleccion",
            "opciones": [
              "Amplitud H",
              "Cociente H/M",
              "Latencia H"
            ],
            "ids": ["amplitud_h","cociente_h_m","latencia_h"],
            "permite_otro": true
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "eng_continua",
      "nombre": "ENG continua",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "nervio",
            "etiqueta": "Nervio",
            "tipo": "seleccion",
            "opciones": [
              "Vago",
              "Laríngeo recurrente",
              "Facial",
              "Ciático",
              "Femoral",
              "Peroneo",
              "Tibial"
            ],
            "ids": ["vago","laringeo_recurrente","facial","ciatico","femoral","peroneo","tibial"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Aguja",
              "Superficie adhesivo",
              "Manguito (APS)"
            ],
            "ids": ["aguja","superficie_adhesivo","manguito_aps"],
            "permite_otro": true
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "supramaxima",
            "etiqueta": "Intensidad supramáxima",
            "tipo": "si_no"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación continua",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "tipo_registro",
            "etiqueta": "Tipo de registro",
            "tipo": "seleccion",
            "opciones": [
              "CMAP (músculo)",
              "SNAP/NAP (nervio)"
            ],
            "ids": ["cmap_musculo","snap_nap_nervio"],
            "permite_otro": false
          },
          {
            "id": "sitio_registro",
            "etiqueta": "Músculo o sitio de registro",
            "tipo": "texto"
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "parametro_vigilado",
            "etiqueta": "Parámetro vigilado",
            "tipo": "multiseleccion",
            "opciones": [
              "Amplitud",
              "Latencia"
            ],
            "ids": ["amplitud","latencia"],
            "permite_otro": false
          },
          {
            "id": "n_promedios",
            "etiqueta": "Nº de promedios",
            "tipo": "numero",
            "visible_si": {
              "campo": "tipo_registro",
              "igual_a": "snap_nap_nervio"
            }
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "pan",
      "nombre": "PAN",
      "alias": [
        "NAP",
        "Potencial de acción nervioso"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "nervio",
            "etiqueta": "Nervio",
            "tipo": "texto"
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Gancho bipolar",
              "Gancho tripolar"
            ],
            "ids": ["gancho_bipolar","gancho_tripolar"],
            "permite_otro": true
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Gancho bipolar",
              "Gancho tripolar"
            ],
            "ids": ["gancho_bipolar","gancho_tripolar"],
            "permite_otro": true
          },
          {
            "id": "distancia_estimulo_registro",
            "etiqueta": "Distancia estímulo–registro",
            "tipo": "numero",
            "unidad": "mm"
          },
          {
            "id": "segmento",
            "etiqueta": "Segmento explorado",
            "tipo": "seleccion",
            "opciones": [
              "A través de la lesión",
              "Proximal a la lesión",
              "Distal a la lesión"
            ],
            "ids": ["a_traves_de_la_lesion","proximal_a_la_lesion","distal_a_la_lesion"],
            "permite_otro": true
          },
          {
            "id": "nervio_elevado",
            "etiqueta": "Nervio elevado del lecho quirúrgico",
            "tipo": "si_no"
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_promedios",
            "etiqueta": "Nº de promedios",
            "tipo": "numero"
          },
          {
            "id": "rechazo_artefactos",
            "etiqueta": "Rechazo de artefactos activo",
            "tipo": "si_no"
          },
          {
            "id": "n_replicas",
            "etiqueta": "Nº de réplicas (reproducibilidad)",
            "tipo": "numero"
          }
        ]
      }
    },
    {
      "id": "onda_f_facial",
      "nombre": "Onda F Facial",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sitio_estimulo",
            "etiqueta": "Sitio de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Tronco facial (agujero estilomastoideo)",
              "Rama temporal",
              "Rama zigomática",
              "Rama bucal",
              "Rama marginal mandibular"
            ],
            "ids": ["tronco_facial_agujero_estilomastoideo","rama_temporal","rama_zigomatica","rama_bucal","rama_marginal_mandibular"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "supramaxima",
            "etiqueta": "Intensidad supramáxima",
            "tipo": "si_no"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "n_estimulos_serie",
            "etiqueta": "Nº de estímulos por serie",
            "tipo": "numero"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Frontal",
              "Orbicular del ojo",
              "Nasal",
              "Orbicular de la boca",
              "Mentoniano"
            ],
            "ids": ["frontal","orbicular_del_ojo","nasal","orbicular_de_la_boca","mentoniano"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "M",
              "F"
            ],
            "ids": ["m","f"],
            "permite_otro": false
          },
          {
            "id": "medidas_derivadas",
            "etiqueta": "Medidas derivadas",
            "tipo": "multiseleccion",
            "opciones": [
              "Persistencia",
              "Cociente F/M",
              "Latencia mínima F"
            ],
            "ids": ["persistencia","cociente_f_m","latencia_minima_f"],
            "permite_otro": true
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "lsr",
      "nombre": "LSR",
      "alias": [
        "Lateral spread response",
        "AMR"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "rama_estimulada",
            "etiqueta": "Rama facial estimulada",
            "tipo": "seleccion",
            "opciones": [
              "Temporal",
              "Zigomática",
              "Bucal",
              "Marginal mandibular"
            ],
            "ids": ["temporal","zigomatica","bucal","marginal_mandibular"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "musculo_registro_lsr",
            "etiqueta": "Músculo de registro de la LSR (otra rama)",
            "tipo": "multiseleccion",
            "opciones": [
              "Frontal",
              "Orbicular del ojo",
              "Nasal",
              "Orbicular de la boca",
              "Mentoniano"
            ],
            "ids": ["frontal","orbicular_del_ojo","nasal","orbicular_de_la_boca","mentoniano"],
            "permite_otro": true
          },
          {
            "id": "musculo_control_directo",
            "etiqueta": "Músculo de control (respuesta directa)",
            "tipo": "multiseleccion",
            "opciones": [
              "Frontal",
              "Orbicular del ojo",
              "Nasal",
              "Orbicular de la boca",
              "Mentoniano"
            ],
            "ids": ["frontal","orbicular_del_ojo","nasal","orbicular_de_la_boca","mentoniano"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "Respuesta directa",
              "LSR"
            ],
            "ids": ["respuesta_directa","lsr"],
            "permite_otro": false
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "prm_arm",
      "nombre": "PRM / ARM",
      "alias": [
        "PRM",
        "ARM",
        "Posterior root-muscle reflex",
        "Anterior root-muscle response"
      ],
      "nota": "Fusión de PRM y ARM",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo rectangular",
              "Par de discos adhesivos puenteados",
              "Epidural"
            ],
            "ids": ["superficie_adhesivo_rectangular","par_de_discos_adhesivos_puenteados","epidural"],
            "permite_otro": true,
            "fuente": "Deletis cap. 31"
          },
          {
            "id": "nivel_catodo",
            "etiqueta": "Nivel vertebral del cátodo",
            "tipo": "seleccion",
            "opciones": [
              "T11–T12",
              "L1–L3",
              "L4–L5"
            ],
            "ids": ["t11_t12","l1_l3","l4_l5"],
            "permite_otro": true,
            "fuente": "Deletis cap. 18 y 31"
          },
          {
            "id": "posicion_anodo",
            "etiqueta": "Posición del ánodo",
            "tipo": "seleccion",
            "opciones": [
              "Abdomen supraumbilical",
              "Paraumbilical bilateral"
            ],
            "ids": ["abdomen_supraumbilical","paraumbilical_bilateral"],
            "permite_otro": true,
            "fuente": "Deletis cap. 31"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "pulso_doble",
            "etiqueta": "Pulso doble para discriminar PRM/ARM",
            "tipo": "si_no"
          },
          {
            "id": "isi_pulso_doble",
            "etiqueta": "ISI del pulso doble",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "pulso_doble",
              "igual_a": true
            },
            "fuente": "Deletis cap. 31: 50 ms; respuesta al 2º estímulo = ARM, ausencia = PRM"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "posicion_paciente",
            "etiqueta": "Posición del paciente",
            "tipo": "seleccion",
            "opciones": [
              "Prono",
              "Supino",
              "Lateral"
            ],
            "ids": ["prono","supino","lateral"],
            "permite_otro": false,
            "fuente": "Deletis cap. 18: prono o supino cambia el reclutamiento de raíces posteriores y anteriores"
          },
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Isquiotibiales",
              "Recto femoral",
              "Vasto medial",
              "Tibial anterior",
              "Gastrocnemio",
              "Sóleo",
              "Extensor corto de los dedos (EDB)",
              "Abductor del primer dedo (AH)"
            ],
            "ids": ["isquiotibiales","recto_femoral","vasto_medial","tibial_anterior","gastrocnemio","soleo","extensor_corto_de_los_dedos_edb","abductor_del_primer_dedo_ah"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "PRM",
              "ARM"
            ],
            "ids": ["prm","arm"],
            "permite_otro": false
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "tvcr",
      "nombre": "Reflejo trigémino-vocal (TVcR)",
      "alias": [
        "TVcR"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sitio_estimulo",
            "etiqueta": "Sitio de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Nervio mentoniano (foramen)"
            ],
            "ids": ["nervio_mentoniano_foramen"],
            "permite_otro": true,
            "fuente": "Urriza 2025"
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero"
          },
          {
            "id": "isi",
            "etiqueta": "ISI (intervalo interestímulo)",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "n_pulsos",
              "mayor_que": 1
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "estrategia_estimulo",
            "etiqueta": "Estrategia",
            "tipo": "seleccion",
            "opciones": [
              "Pulso simple",
              "Tren escalado según profundidad anestésica"
            ],
            "ids": ["pulso_simple","tren_escalado_segun_profundidad_anestesica"],
            "permite_otro": false,
            "fuente": "Urriza 2025: pulso simple; si no hay respuesta, tren creciente hasta 4 pulsos"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Cuerdas vocales (electrodo de tubo)"
            ],
            "ids": ["cuerdas_vocales_electrodo_de_tubo"],
            "permite_otro": true
          },
          {
            "id": "lado_registro",
            "etiqueta": "Lado de registro",
            "tipo": "seleccion",
            "opciones": [
              "Ipsilateral",
              "Contralateral",
              "Bilateral"
            ],
            "ids": ["ipsilateral","contralateral","bilateral"],
            "permite_otro": false
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "R1",
              "R2"
            ],
            "ids": ["r1","r2"],
            "permite_otro": false
          },
          {
            "id": "latencia_medida_desde",
            "etiqueta": "Latencia medida desde",
            "tipo": "seleccion",
            "opciones": [
              "Primer pulso del tren",
              "Último pulso del tren"
            ],
            "ids": ["primer_pulso_del_tren","ultimo_pulso_del_tren"],
            "permite_otro": false,
            "fuente": "Lima Medeiros 2024 mide desde el inicio del último pulso del tren"
          },
          {
            "id": "montaje_tubo",
            "etiqueta": "Montaje del electrodo de tubo",
            "tipo": "seleccion",
            "opciones": [
              "Bipolar (contactos adyacentes)",
              "Referencial (vs aguja externa)"
            ],
            "ids": ["bipolar_contactos_adyacentes","referencial_vs_aguja_externa"],
            "permite_otro": false,
            "fuente": "Urriza 2025"
          },
          {
            "id": "referencia_externa",
            "etiqueta": "Referencia externa",
            "tipo": "texto",
            "visible_si": {
              "campo": "montaje_tubo",
              "igual_a": "referencial_vs_aguja_externa"
            },
            "nota": "Urriza 2025: manubrio esternal"
          },
          {
            "id": "lateralidad_verificada",
            "etiqueta": "Lateralidad del tubo verificada",
            "tipo": "si_no",
            "fuente": "Urriza 2025: la rotación del tubo compromete la lateralidad"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "thr",
      "nombre": "Reflejo trigémino-hipogloso (THR)",
      "alias": [
        "THR"
      ],
      "nota": "Método no disponible en las fuentes del proyecto (Mirallave 2022 y Szelényi 2022 solo citados en Urriza 2025). Campos genéricos de la familia",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sitio_estimulo",
            "etiqueta": "Sitio de estímulo",
            "tipo": "seleccion",
            "opciones": [],
            "ids": [],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero"
          },
          {
            "id": "isi",
            "etiqueta": "ISI (intervalo interestímulo)",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "n_pulsos",
              "mayor_que": 1
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Lengua"
            ],
            "ids": ["lengua"],
            "permite_otro": true
          },
          {
            "id": "lado_registro",
            "etiqueta": "Lado de registro",
            "tipo": "seleccion",
            "opciones": [
              "Ipsilateral",
              "Contralateral",
              "Bilateral"
            ],
            "ids": ["ipsilateral","contralateral","bilateral"],
            "permite_otro": false
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "R1",
              "R2"
            ],
            "ids": ["r1","r2"],
            "permite_otro": false
          },
          {
            "id": "latencia_medida_desde",
            "etiqueta": "Latencia medida desde",
            "tipo": "seleccion",
            "opciones": [
              "Primer pulso del tren",
              "Último pulso del tren"
            ],
            "ids": ["primer_pulso_del_tren","ultimo_pulso_del_tren"],
            "permite_otro": false,
            "fuente": "Lima Medeiros 2024 mide desde el inicio del último pulso del tren"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "tcr",
      "nombre": "Reflejo trigémino-cervical (TCR)",
      "alias": [
        "TCR"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sitio_estimulo",
            "etiqueta": "Sitio de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Supraorbitario",
              "Infraorbitario"
            ],
            "ids": ["supraorbitario","infraorbitario"],
            "permite_otro": true,
            "fuente": "Lima Medeiros 2024"
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero"
          },
          {
            "id": "isi",
            "etiqueta": "ISI (intervalo interestímulo)",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "n_pulsos",
              "mayor_que": 1
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Esternocleidomastoideo",
              "Trapecio"
            ],
            "ids": ["esternocleidomastoideo","trapecio"],
            "permite_otro": true,
            "fuente": "Lima Medeiros 2024"
          },
          {
            "id": "lado_registro",
            "etiqueta": "Lado de registro",
            "tipo": "seleccion",
            "opciones": [
              "Ipsilateral",
              "Contralateral",
              "Bilateral"
            ],
            "ids": ["ipsilateral","contralateral","bilateral"],
            "permite_otro": false
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "Latencia corta",
              "Latencia larga"
            ],
            "ids": ["latencia_corta","latencia_larga"],
            "permite_otro": false
          },
          {
            "id": "latencia_medida_desde",
            "etiqueta": "Latencia medida desde",
            "tipo": "seleccion",
            "opciones": [
              "Primer pulso del tren",
              "Último pulso del tren"
            ],
            "ids": ["primer_pulso_del_tren","ultimo_pulso_del_tren"],
            "permite_otro": false,
            "fuente": "Lima Medeiros 2024 mide desde el inicio del último pulso del tren"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "lar",
      "nombre": "Reflejo laríngeo aductor (LAR)",
      "alias": [
        "LAR"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sitio_estimulo",
            "etiqueta": "Sitio de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Mucosa laríngea (electrodo de tubo)"
            ],
            "ids": ["mucosa_laringea_electrodo_de_tubo"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Cuerdas vocales (electrodo de tubo)"
            ],
            "ids": ["cuerdas_vocales_electrodo_de_tubo"],
            "permite_otro": true
          },
          {
            "id": "lado_registro",
            "etiqueta": "Lado de registro",
            "tipo": "seleccion",
            "opciones": [
              "Ipsilateral",
              "Contralateral",
              "Bilateral"
            ],
            "ids": ["ipsilateral","contralateral","bilateral"],
            "permite_otro": false
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "R1",
              "R2"
            ],
            "ids": ["r1","r2"],
            "permite_otro": false
          },
          {
            "id": "posicion_tubo_verificada",
            "etiqueta": "Posición del tubo verificada",
            "tipo": "si_no"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "reflejo_glosofaringeo_trigeminal",
      "nombre": "Reflejo glosofaríngeo-trigeminal",
      "nota": "Solo citado nominalmente en Urriza 2025; sin método en las fuentes del proyecto. Campos genéricos de la familia",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_alarma",
            "etiqueta": "Criterio de alarma aplicado",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sitio_estimulo",
            "etiqueta": "Sitio de estímulo",
            "tipo": "seleccion",
            "opciones": [],
            "ids": [],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "polaridad",
            "etiqueta": "Polaridad (posición del cátodo)",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero"
          },
          {
            "id": "isi",
            "etiqueta": "ISI (intervalo interestímulo)",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "n_pulsos",
              "mayor_que": 1
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [],
            "ids": [],
            "permite_otro": true
          },
          {
            "id": "lado_registro",
            "etiqueta": "Lado de registro",
            "tipo": "seleccion",
            "opciones": [
              "Ipsilateral",
              "Contralateral",
              "Bilateral"
            ],
            "ids": ["ipsilateral","contralateral","bilateral"],
            "permite_otro": false
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "componentes_obtenidos",
            "etiqueta": "Componentes obtenidos",
            "tipo": "multiseleccion",
            "opciones": [
              "R1",
              "R2"
            ],
            "ids": ["r1","r2"],
            "permite_otro": false
          },
          {
            "id": "latencia_medida_desde",
            "etiqueta": "Latencia medida desde",
            "tipo": "seleccion",
            "opciones": [
              "Primer pulso del tren",
              "Último pulso del tren"
            ],
            "ids": ["primer_pulso_del_tren","ultimo_pulso_del_tren"],
            "permite_otro": false,
            "fuente": "Lima Medeiros 2024 mide desde el inicio del último pulso del tren"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "mapeo_cortical",
      "nombre": "Mapeo cortical",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_respuesta",
            "etiqueta": "Criterio de respuesta positiva",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sonda",
            "etiqueta": "Tipo de sonda",
            "tipo": "seleccion",
            "opciones": [
              "Monopolar",
              "Bipolar",
              "Concéntrica"
            ],
            "ids": ["monopolar","bipolar","concentrica"],
            "permite_otro": true
          },
          {
            "id": "referencia_anodo",
            "etiqueta": "Referencia/ánodo",
            "tipo": "texto"
          },
          {
            "id": "paradigma",
            "etiqueta": "Paradigma",
            "tipo": "seleccion",
            "opciones": [
              "Tren corto HF",
              "Penfield 50–60 Hz",
              "Pulso único"
            ],
            "ids": ["tren_corto_hf","penfield_50_60_hz","pulso_unico"],
            "permite_otro": true
          },
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "intensidad_inicial",
            "etiqueta": "Intensidad inicial",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "isi",
            "etiqueta": "ISI",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Frontal",
              "Orbicular del ojo",
              "Orbicular de la boca",
              "Mentoniano",
              "Masetero",
              "Temporal",
              "Velo del paladar/faringe",
              "Cuerdas vocales (electrodo de tubo)",
              "Cricotiroideo",
              "Esternocleidomastoideo",
              "Trapecio",
              "Lengua",
              "Deltoides",
              "Bíceps",
              "Tríceps",
              "Extensores del carpo",
              "Flexores del carpo",
              "Abductor corto del pulgar (APB)",
              "Abductor del meñique (ADM)",
              "Primer interóseo dorsal",
              "Aductores",
              "Cuádriceps (vasto/recto femoral)",
              "Isquiotibiales",
              "Tibial anterior",
              "Gastrocnemio",
              "Sóleo",
              "Extensor corto de los dedos (EDB)",
              "Abductor del primer dedo (AH)"
            ],
            "ids": ["frontal","orbicular_del_ojo","orbicular_de_la_boca","mentoniano","masetero","temporal","velo_del_paladar_faringe","cuerdas_vocales_electrodo_de_tubo","cricotiroideo","esternocleidomastoideo","trapecio","lengua","deltoides","biceps","triceps","extensores_del_carpo","flexores_del_carpo","abductor_corto_del_pulgar_apb","abductor_del_menique_adm","primer_interoseo_dorsal","aductores","cuadriceps_vasto_recto_femoral","isquiotibiales","tibial_anterior","gastrocnemio","soleo","extensor_corto_de_los_dedos_edb","abductor_del_primer_dedo_ah"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "umbral_deteccion",
            "etiqueta": "Umbral de detección de respuesta",
            "tipo": "numero",
            "unidad": "µV"
          },
          {
            "id": "umbral_minimo_obtenido",
            "etiqueta": "Umbral mínimo obtenido",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ecog_postdescargas",
            "etiqueta": "ECoG de vigilancia de postdescargas",
            "tipo": "si_no"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "mapeo_subcortical",
      "nombre": "Mapeo subcortical",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_respuesta",
            "etiqueta": "Criterio de respuesta positiva",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sonda",
            "etiqueta": "Tipo de sonda",
            "tipo": "seleccion",
            "opciones": [
              "Monopolar",
              "Aspirador estimulante",
              "Bipolar"
            ],
            "ids": ["monopolar","aspirador_estimulante","bipolar"],
            "permite_otro": true
          },
          {
            "id": "referencia_anodo",
            "etiqueta": "Referencia/ánodo",
            "tipo": "texto"
          },
          {
            "id": "paradigma",
            "etiqueta": "Paradigma",
            "tipo": "seleccion",
            "opciones": [
              "Tren corto HF",
              "Penfield 50–60 Hz",
              "Pulso único"
            ],
            "ids": ["tren_corto_hf","penfield_50_60_hz","pulso_unico"],
            "permite_otro": true
          },
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "intensidad_inicial",
            "etiqueta": "Intensidad inicial",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "isi",
            "etiqueta": "ISI",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "modo_continuo_dinamico",
            "etiqueta": "Estimulación continua/dinámica",
            "tipo": "si_no"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Frontal",
              "Orbicular del ojo",
              "Orbicular de la boca",
              "Mentoniano",
              "Masetero",
              "Temporal",
              "Velo del paladar/faringe",
              "Cuerdas vocales (electrodo de tubo)",
              "Cricotiroideo",
              "Esternocleidomastoideo",
              "Trapecio",
              "Lengua",
              "Deltoides",
              "Bíceps",
              "Tríceps",
              "Extensores del carpo",
              "Flexores del carpo",
              "Abductor corto del pulgar (APB)",
              "Abductor del meñique (ADM)",
              "Primer interóseo dorsal",
              "Aductores",
              "Cuádriceps (vasto/recto femoral)",
              "Isquiotibiales",
              "Tibial anterior",
              "Gastrocnemio",
              "Sóleo",
              "Extensor corto de los dedos (EDB)",
              "Abductor del primer dedo (AH)"
            ],
            "ids": ["frontal","orbicular_del_ojo","orbicular_de_la_boca","mentoniano","masetero","temporal","velo_del_paladar_faringe","cuerdas_vocales_electrodo_de_tubo","cricotiroideo","esternocleidomastoideo","trapecio","lengua","deltoides","biceps","triceps","extensores_del_carpo","flexores_del_carpo","abductor_corto_del_pulgar_apb","abductor_del_menique_adm","primer_interoseo_dorsal","aductores","cuadriceps_vasto_recto_femoral","isquiotibiales","tibial_anterior","gastrocnemio","soleo","extensor_corto_de_los_dedos_edb","abductor_del_primer_dedo_ah"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "umbral_deteccion",
            "etiqueta": "Umbral de detección de respuesta",
            "tipo": "numero",
            "unidad": "µV"
          },
          {
            "id": "umbral_minimo_obtenido",
            "etiqueta": "Umbral mínimo obtenido",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "mep_simultaneos",
            "etiqueta": "MEP simultáneos",
            "tipo": "si_no"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "phase_reversal",
      "nombre": "Phase-Reversal",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_respuesta",
            "etiqueta": "Criterio de respuesta positiva",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "nervio",
            "etiqueta": "Nervio estimulado",
            "tipo": "seleccion",
            "opciones": [
              "Mediano",
              "Tibial posterior"
            ],
            "ids": ["mediano","tibial_posterior"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_estimulo",
            "etiqueta": "Tipo de electrodo de estímulo",
            "tipo": "seleccion",
            "opciones": [
              "Superficie adhesivo",
              "Aguja subdérmica"
            ],
            "ids": ["superficie_adhesivo","aguja_subdermica"],
            "permite_otro": true
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "strip_n_contactos",
            "etiqueta": "Strip/grid: nº de contactos",
            "tipo": "numero"
          },
          {
            "id": "strip_localizacion",
            "etiqueta": "Strip/grid: localización",
            "tipo": "texto"
          },
          {
            "id": "montaje_registro",
            "etiqueta": "Montaje de registro",
            "tipo": "seleccion",
            "opciones": [
              "Referencial",
              "Bipolar"
            ],
            "ids": ["referencial","bipolar"],
            "permite_otro": false
          },
          {
            "id": "referencia",
            "etiqueta": "Referencia",
            "tipo": "texto"
          },
          {
            "id": "orientacion_strip",
            "etiqueta": "Orientación del strip",
            "tipo": "seleccion",
            "opciones": [
              "Perpendicular al surco central"
            ],
            "ids": ["perpendicular_al_surco_central"],
            "permite_otro": true
          },
          {
            "id": "contactos_inversion",
            "etiqueta": "Par de contactos con inversión de fase",
            "tipo": "texto"
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_promedios",
            "etiqueta": "Nº de promedios",
            "tipo": "numero"
          },
          {
            "id": "rechazo_artefactos",
            "etiqueta": "Rechazo de artefactos activo",
            "tipo": "si_no"
          },
          {
            "id": "n_replicas",
            "etiqueta": "Nº de réplicas (reproducibilidad)",
            "tipo": "numero"
          }
        ]
      }
    },
    {
      "id": "mapeo_lenguaje",
      "nombre": "Mapeo del lenguaje",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_respuesta",
            "etiqueta": "Criterio de respuesta positiva",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sonda",
            "etiqueta": "Tipo de sonda",
            "tipo": "seleccion",
            "opciones": [
              "Bipolar",
              "Monopolar"
            ],
            "ids": ["bipolar","monopolar"],
            "permite_otro": true
          },
          {
            "id": "referencia_anodo",
            "etiqueta": "Referencia/ánodo",
            "tipo": "texto"
          },
          {
            "id": "paradigma",
            "etiqueta": "Paradigma",
            "tipo": "seleccion",
            "opciones": [
              "Penfield 50–60 Hz",
              "Tren corto HF"
            ],
            "ids": ["penfield_50_60_hz","tren_corto_hf"],
            "permite_otro": true
          },
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "intensidad_inicial",
            "etiqueta": "Intensidad inicial",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "isi",
            "etiqueta": "ISI",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "separacion_polos",
            "etiqueta": "Separación de polos",
            "tipo": "numero",
            "unidad": "mm"
          },
          {
            "id": "duracion_max_estimulo",
            "etiqueta": "Duración máxima del estímulo",
            "tipo": "numero",
            "unidad": "s"
          },
          {
            "id": "tareas",
            "etiqueta": "Tareas",
            "tipo": "multiseleccion",
            "opciones": [
              "Conteo",
              "Denominación",
              "Lectura",
              "Repetición",
              "Comprensión"
            ],
            "ids": ["conteo","denominacion","lectura","repeticion","comprension"],
            "permite_otro": true
          },
          {
            "id": "n_repeticiones_punto",
            "etiqueta": "Nº de repeticiones por punto",
            "tipo": "numero"
          },
          {
            "id": "nivel",
            "etiqueta": "Nivel",
            "tipo": "seleccion",
            "opciones": [
              "Cortical",
              "Subcortical",
              "Ambos"
            ],
            "ids": ["cortical","subcortical","ambos"],
            "permite_otro": false
          },
          {
            "id": "estado_paciente",
            "etiqueta": "Estado del paciente",
            "tipo": "seleccion",
            "opciones": [
              "Dormido-despierto-dormido",
              "Despierto con sedación consciente"
            ],
            "ids": ["dormido_despierto_dormido","despierto_con_sedacion_consciente"],
            "permite_otro": true
          }
        ],
        "registro": [
          {
            "id": "respuesta_conductual",
            "etiqueta": "Tipo de respuesta conductual valorada",
            "tipo": "texto"
          },
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Frontal",
              "Orbicular del ojo",
              "Orbicular de la boca",
              "Mentoniano",
              "Masetero",
              "Temporal",
              "Velo del paladar/faringe",
              "Cuerdas vocales (electrodo de tubo)",
              "Cricotiroideo",
              "Esternocleidomastoideo",
              "Trapecio",
              "Lengua",
              "Deltoides",
              "Bíceps",
              "Tríceps",
              "Extensores del carpo",
              "Flexores del carpo",
              "Abductor corto del pulgar (APB)",
              "Abductor del meñique (ADM)",
              "Primer interóseo dorsal"
            ],
            "ids": ["frontal","orbicular_del_ojo","orbicular_de_la_boca","mentoniano","masetero","temporal","velo_del_paladar_faringe","cuerdas_vocales_electrodo_de_tubo","cricotiroideo","esternocleidomastoideo","trapecio","lengua","deltoides","biceps","triceps","extensores_del_carpo","flexores_del_carpo","abductor_corto_del_pulgar_apb","abductor_del_menique_adm","primer_interoseo_dorsal"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "umbral_deteccion",
            "etiqueta": "Umbral de detección de respuesta",
            "tipo": "numero",
            "unidad": "µV"
          },
          {
            "id": "umbral_minimo_obtenido",
            "etiqueta": "Umbral mínimo obtenido",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ecog_postdescargas",
            "etiqueta": "ECoG de vigilancia de postdescargas",
            "tipo": "si_no"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "mapeo_iv_ventriculo",
      "nombre": "Mapeo del IV ventrículo",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_respuesta",
            "etiqueta": "Criterio de respuesta positiva",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sonda",
            "etiqueta": "Tipo de sonda",
            "tipo": "seleccion",
            "opciones": [
              "Monopolar",
              "Bipolar",
              "Concéntrica"
            ],
            "ids": ["monopolar","bipolar","concentrica"],
            "permite_otro": true
          },
          {
            "id": "referencia_anodo",
            "etiqueta": "Referencia/ánodo",
            "tipo": "texto"
          },
          {
            "id": "paradigma",
            "etiqueta": "Paradigma",
            "tipo": "seleccion",
            "opciones": [
              "Pulso único",
              "Tren corto HF"
            ],
            "ids": ["pulso_unico","tren_corto_hf"],
            "permite_otro": true
          },
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "intensidad_inicial",
            "etiqueta": "Intensidad inicial",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "isi",
            "etiqueta": "ISI",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Orbicular del ojo",
              "Orbicular de la boca",
              "Velo del paladar/faringe",
              "Cuerdas vocales (electrodo de tubo)",
              "Lengua"
            ],
            "ids": ["orbicular_del_ojo","orbicular_de_la_boca","velo_del_paladar_faringe","cuerdas_vocales_electrodo_de_tubo","lengua"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "umbral_deteccion",
            "etiqueta": "Umbral de detección de respuesta",
            "tipo": "numero",
            "unidad": "µV"
          },
          {
            "id": "umbral_minimo_obtenido",
            "etiqueta": "Umbral mínimo obtenido",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "mapeo_columnas_dorsales",
      "nombre": "Mapeo de columnas dorsales",
      "alias": [
        "DCM"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_respuesta",
            "etiqueta": "Criterio de respuesta positiva",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "metodo",
            "etiqueta": "Método",
            "tipo": "seleccion",
            "opciones": [
              "Inversión de fase del SEP en CP3–CP4 con estímulo en columna dorsal (Simon/Nair)",
              "Registro con microelectrodo multiarray sobre médula tras estímulo tibial (Yanni)",
              "Registro antidrómico en nervio tibial tras estímulo de columnas dorsales (Quiñones-Hinojosa)"
            ],
            "ids": ["inversion_de_fase_del_sep_en_cp3_cp4_con_estimul","registro_con_microelectrodo_multiarray_sobre_med","registro_antidromico_en_nervio_tibial_tras_estim"],
            "permite_otro": true,
            "fuente": "Boaro 2026"
          },
          {
            "id": "sitio_estimulo",
            "etiqueta": "Sitio de estímulo",
            "tipo": "texto"
          },
          {
            "id": "electrodo_estimulo",
            "etiqueta": "Electrodo/sonda de estímulo",
            "tipo": "texto"
          },
          {
            "id": "forma_pulso",
            "etiqueta": "Forma del pulso",
            "tipo": "seleccion",
            "opciones": [
              "Monofásico",
              "Bifásico"
            ],
            "ids": ["monofasico","bifasico"],
            "permite_otro": false
          },
          {
            "id": "intensidad",
            "etiqueta": "Intensidad",
            "tipo": "numero",
            "unidad": "mA"
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "sitio_registro",
            "etiqueta": "Sitio/derivación de registro",
            "tipo": "texto"
          },
          {
            "id": "electrodo_registro",
            "etiqueta": "Electrodo de registro",
            "tipo": "texto"
          },
          {
            "id": "resultado_linea_media",
            "etiqueta": "Localización de la línea media obtenida",
            "tipo": "texto"
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_promedios",
            "etiqueta": "Nº de promedios",
            "tipo": "numero"
          },
          {
            "id": "rechazo_artefactos",
            "etiqueta": "Rechazo de artefactos activo",
            "tipo": "si_no"
          },
          {
            "id": "n_replicas",
            "etiqueta": "Nº de réplicas (reproducibilidad)",
            "tipo": "numero"
          }
        ]
      }
    },
    {
      "id": "mapeo_raices_tornillos",
      "nombre": "Mapeo de raíces y tornillos",
      "alias": [
        "t-EMG",
        "EMG estimulada"
      ],
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_respuesta",
            "etiqueta": "Criterio de respuesta positiva",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "diana",
            "etiqueta": "Diana",
            "tipo": "seleccion",
            "opciones": [
              "Tornillo (cabeza)",
              "Orificio de tornillo",
              "Raíz directa"
            ],
            "ids": ["tornillo_cabeza","orificio_de_tornillo","raiz_directa"],
            "permite_otro": true
          },
          {
            "id": "sonda",
            "etiqueta": "Sonda",
            "tipo": "seleccion",
            "opciones": [
              "Bola",
              "Punta"
            ],
            "ids": ["bola","punta"],
            "permite_otro": true
          },
          {
            "id": "referencia_anodo",
            "etiqueta": "Referencia/ánodo",
            "tipo": "texto"
          },
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "intensidad_inicial",
            "etiqueta": "Intensidad inicial",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "escalado_intensidad",
            "etiqueta": "Escalado de intensidad",
            "tipo": "seleccion",
            "opciones": [
              "Manual",
              "Automático"
            ],
            "ids": ["manual","automatico"],
            "permite_otro": false
          },
          {
            "id": "control_raiz_directa",
            "etiqueta": "Control con estímulo de raíz directa",
            "tipo": "si_no"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Deltoides",
              "Bíceps",
              "Tríceps",
              "Extensores del carpo",
              "Flexores del carpo",
              "Abductor corto del pulgar (APB)",
              "Abductor del meñique (ADM)",
              "Primer interóseo dorsal",
              "Aductores",
              "Cuádriceps (vasto/recto femoral)",
              "Isquiotibiales",
              "Tibial anterior",
              "Gastrocnemio",
              "Sóleo",
              "Extensor corto de los dedos (EDB)",
              "Abductor del primer dedo (AH)",
              "Intercostales",
              "Recto abdominal",
              "Esfínter anal externo"
            ],
            "ids": ["deltoides","biceps","triceps","extensores_del_carpo","flexores_del_carpo","abductor_corto_del_pulgar_apb","abductor_del_menique_adm","primer_interoseo_dorsal","aductores","cuadriceps_vasto_recto_femoral","isquiotibiales","tibial_anterior","gastrocnemio","soleo","extensor_corto_de_los_dedos_edb","abductor_del_primer_dedo_ah","intercostales","recto_abdominal","esfinter_anal_externo"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "umbral_deteccion",
            "etiqueta": "Umbral de detección de respuesta",
            "tipo": "numero",
            "unidad": "µV"
          },
          {
            "id": "umbral_por_nivel",
            "etiqueta": "Umbral por nivel y lado",
            "tipo": "texto"
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "mapeo_nervio_periferico",
      "nombre": "Mapeo de nervio periférico",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_respuesta",
            "etiqueta": "Criterio de respuesta positiva",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sonda",
            "etiqueta": "Tipo de sonda",
            "tipo": "seleccion",
            "opciones": [
              "Monopolar",
              "Bipolar",
              "Gancho"
            ],
            "ids": ["monopolar","bipolar","gancho"],
            "permite_otro": true
          },
          {
            "id": "referencia_anodo",
            "etiqueta": "Referencia/ánodo",
            "tipo": "texto"
          },
          {
            "id": "paradigma",
            "etiqueta": "Paradigma",
            "tipo": "seleccion",
            "opciones": [
              "Pulso único",
              "Tren corto HF"
            ],
            "ids": ["pulso_unico","tren_corto_hf"],
            "permite_otro": true
          },
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "intensidad_inicial",
            "etiqueta": "Intensidad inicial",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "isi",
            "etiqueta": "ISI",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "nervio",
            "etiqueta": "Nervio",
            "tipo": "texto"
          },
          {
            "id": "tipo_mapeo",
            "etiqueta": "Tipo de mapeo",
            "tipo": "seleccion",
            "opciones": [
              "Motor (EMG)",
              "Sensitivo (registro de PAN)"
            ],
            "ids": ["motor_emg","sensitivo_registro_de_pan"],
            "permite_otro": false
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Deltoides",
              "Bíceps",
              "Tríceps",
              "Extensores del carpo",
              "Flexores del carpo",
              "Abductor corto del pulgar (APB)",
              "Abductor del meñique (ADM)",
              "Primer interóseo dorsal",
              "Aductores",
              "Cuádriceps (vasto/recto femoral)",
              "Isquiotibiales",
              "Tibial anterior",
              "Gastrocnemio",
              "Sóleo",
              "Extensor corto de los dedos (EDB)",
              "Abductor del primer dedo (AH)",
              "Frontal",
              "Orbicular del ojo",
              "Orbicular de la boca",
              "Mentoniano",
              "Masetero",
              "Temporal",
              "Velo del paladar/faringe",
              "Cuerdas vocales (electrodo de tubo)",
              "Cricotiroideo",
              "Esternocleidomastoideo",
              "Trapecio",
              "Lengua"
            ],
            "ids": ["deltoides","biceps","triceps","extensores_del_carpo","flexores_del_carpo","abductor_corto_del_pulgar_apb","abductor_del_menique_adm","primer_interoseo_dorsal","aductores","cuadriceps_vasto_recto_femoral","isquiotibiales","tibial_anterior","gastrocnemio","soleo","extensor_corto_de_los_dedos_edb","abductor_del_primer_dedo_ah","frontal","orbicular_del_ojo","orbicular_de_la_boca","mentoniano","masetero","temporal","velo_del_paladar_faringe","cuerdas_vocales_electrodo_de_tubo","cricotiroideo","esternocleidomastoideo","trapecio","lengua"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "umbral_deteccion",
            "etiqueta": "Umbral de detección de respuesta",
            "tipo": "numero",
            "unidad": "µV"
          },
          {
            "id": "umbral_minimo_obtenido",
            "etiqueta": "Umbral mínimo obtenido",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "mapeo_intramedular_ce",
      "nombre": "Intramedular CE",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_respuesta",
            "etiqueta": "Criterio de respuesta positiva",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sonda",
            "etiqueta": "Tipo de sonda",
            "tipo": "seleccion",
            "opciones": [
              "Monopolar",
              "Bipolar"
            ],
            "ids": ["monopolar","bipolar"],
            "permite_otro": true
          },
          {
            "id": "referencia_anodo",
            "etiqueta": "Referencia/ánodo",
            "tipo": "texto"
          },
          {
            "id": "paradigma",
            "etiqueta": "Paradigma",
            "tipo": "seleccion",
            "opciones": [
              "Tren corto HF",
              "Pulso único"
            ],
            "ids": ["tren_corto_hf","pulso_unico"],
            "permite_otro": true
          },
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "intensidad_inicial",
            "etiqueta": "Intensidad inicial",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "isi",
            "etiqueta": "ISI",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "musculos",
            "etiqueta": "Músculos registrados",
            "tipo": "multiseleccion",
            "opciones": [
              "Deltoides",
              "Bíceps",
              "Tríceps",
              "Extensores del carpo",
              "Flexores del carpo",
              "Abductor corto del pulgar (APB)",
              "Abductor del meñique (ADM)",
              "Primer interóseo dorsal",
              "Aductores",
              "Cuádriceps (vasto/recto femoral)",
              "Isquiotibiales",
              "Tibial anterior",
              "Gastrocnemio",
              "Sóleo",
              "Extensor corto de los dedos (EDB)",
              "Abductor del primer dedo (AH)"
            ],
            "ids": ["deltoides","biceps","triceps","extensores_del_carpo","flexores_del_carpo","abductor_corto_del_pulgar_apb","abductor_del_menique_adm","primer_interoseo_dorsal","aductores","cuadriceps_vasto_recto_femoral","isquiotibiales","tibial_anterior","gastrocnemio","soleo","extensor_corto_de_los_dedos_edb","abductor_del_primer_dedo_ah"],
            "permite_otro": true
          },
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Aguja subdérmica",
              "Aguja intramuscular",
              "Hook wire",
              "Sacacorchos",
              "Superficie adhesivo",
              "Electrodo de tubo endotraqueal"
            ],
            "ids": ["aguja_subdermica","aguja_intramuscular","hook_wire","sacacorchos","superficie_adhesivo","electrodo_de_tubo_endotraqueal"],
            "permite_otro": true
          },
          {
            "id": "umbral_deteccion",
            "etiqueta": "Umbral de detección de respuesta",
            "tipo": "numero",
            "unidad": "µV"
          },
          {
            "id": "umbral_minimo_obtenido",
            "etiqueta": "Umbral mínimo obtenido",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "registro_respuesta",
            "etiqueta": "Respuesta registrada",
            "tipo": "seleccion",
            "opciones": [
              "Músculos",
              "Onda D",
              "Ambos"
            ],
            "ids": ["musculos","onda_d","ambos"],
            "permite_otro": false
          },
          {
            "id": "tof_basal",
            "etiqueta": "TOF en el basal",
            "tipo": "seleccion",
            "opciones": [
              "4/4",
              "3/4",
              "2/4",
              "1/4",
              "0/4"
            ],
            "ids": ["4_4","3_4","2_4","1_4","0_4"],
            "permite_otro": false
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    },
    {
      "id": "eog",
      "nombre": "EOG",
      "nota": "Uso no definido en el servicio. Campos provisionales asumiendo registro oculomotor durante estimulación de III, IV y VI",
      "secciones": {
        "general": [
          {
            "id": "lado",
            "etiqueta": "Lado",
            "tipo": "seleccion",
            "opciones": [
              "Derecho",
              "Izquierdo",
              "Bilateral",
              "No aplica"
            ],
            "ids": ["derecho","izquierdo","bilateral","no_aplica"],
            "permite_otro": false
          },
          {
            "id": "criterio_respuesta",
            "etiqueta": "Criterio de respuesta positiva",
            "tipo": "texto"
          },
          {
            "id": "incidencias",
            "etiqueta": "Desviaciones o incidencias técnicas",
            "tipo": "texto"
          }
        ],
        "estimulacion": [
          {
            "id": "sonda",
            "etiqueta": "Tipo de sonda",
            "tipo": "seleccion",
            "opciones": [
              "Monopolar",
              "Bipolar"
            ],
            "ids": ["monopolar","bipolar"],
            "permite_otro": true
          },
          {
            "id": "referencia_anodo",
            "etiqueta": "Referencia/ánodo",
            "tipo": "texto"
          },
          {
            "id": "paradigma",
            "etiqueta": "Paradigma",
            "tipo": "seleccion",
            "opciones": [
              "Pulso único",
              "Tren corto HF"
            ],
            "ids": ["pulso_unico","tren_corto_hf"],
            "permite_otro": true
          },
          {
            "id": "modo_estimulador",
            "etiqueta": "Modo del estimulador",
            "tipo": "seleccion",
            "opciones": [
              "Corriente constante (mA)",
              "Voltaje constante (V)"
            ],
            "ids": ["corriente_constante_ma","voltaje_constante_v"],
            "permite_otro": false
          },
          {
            "id": "intensidad_inicial",
            "etiqueta": "Intensidad inicial",
            "tipo": "numero",
            "unidades": [
              "mA",
              "V"
            ]
          },
          {
            "id": "ancho_pulso",
            "etiqueta": "Ancho de pulso",
            "tipo": "numero",
            "unidad": "ms"
          },
          {
            "id": "n_pulsos",
            "etiqueta": "Nº de pulsos por tren",
            "tipo": "numero",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "isi",
            "etiqueta": "ISI",
            "tipo": "numero",
            "unidad": "ms",
            "visible_si": {
              "campo": "paradigma",
              "igual_a": "tren_corto_hf"
            }
          },
          {
            "id": "frecuencia",
            "etiqueta": "Frecuencia de estimulación",
            "tipo": "numero",
            "unidad": "Hz"
          }
        ],
        "registro": [
          {
            "id": "tipo_electrodo_registro",
            "etiqueta": "Tipo de electrodo de registro",
            "tipo": "seleccion",
            "opciones": [
              "Superficie periorbitario",
              "Aguja en musculatura extraocular"
            ],
            "ids": ["superficie_periorbitario","aguja_en_musculatura_extraocular"],
            "permite_otro": true
          },
          {
            "id": "pares_diana",
            "etiqueta": "Pares craneales diana",
            "tipo": "multiseleccion",
            "opciones": [
              "III",
              "IV",
              "VI"
            ],
            "ids": ["iii","iv","vi"],
            "permite_otro": true
          },
          {
            "id": "umbral_deteccion",
            "etiqueta": "Umbral de detección de respuesta",
            "tipo": "numero",
            "unidad": "µV"
          },
          {
            "id": "filtro_hp",
            "etiqueta": "Filtro paso alto (HP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "filtro_lp",
            "etiqueta": "Filtro paso bajo (LP)",
            "tipo": "numero",
            "unidad": "Hz"
          },
          {
            "id": "notch",
            "etiqueta": "Filtro notch",
            "tipo": "si_no"
          },
          {
            "id": "ventana",
            "etiqueta": "Ventana de análisis",
            "tipo": "numero",
            "unidad": "ms"
          }
        ]
      }
    }
  ]
};

/* Traduce el id de data/surgeries.js al id de arriba, solo donde no coinciden. */
window.TECPAR_ID_MAP = {
  "t_pess": "t_sep",
  "t_pem": "t_mep",
  "c_pem": "c_mep",
  "c_pess": "c_sep",
  "pem_corticobulbares": "comep",
  "br": "blink_reflex",
  "emg": "free_emg",
  "erg": "erg_retinograma",
  "retino": "erg_retinograma",
  "hr_popliteo": "hr_soleo",
  "prm": "prm_arm",
  "arm": "prm_arm",
  "rx_tvcr": "tvcr",
  "rx_thr": "thr",
  "rx_tcr": "tcr",
  "rx_lar": "lar",
  "rx_glosofaringeo_trigeminal": "reflejo_glosofaringeo_trigeminal"
};
