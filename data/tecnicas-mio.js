/*
 * Técnicas MIO: parámetros técnicos de cada técnica de monitorización
 * intraoperatoria (sitios de estimulación/registro, filtros, tiempos de
 * barrido...), para consultar durante el caso.
 *
 * Mismo motivo que data/guia.js y data/surgeries.js: si index.html se abre
 * con doble clic (protocolo file://), fetch() de archivos locales está
 * bloqueado por CORS, así que el contenido va envuelto en una variable
 * global y se carga con una simple etiqueta <script>.
 *
 * Contenido clínico de referencia, no dato de usuario: no se sincroniza, no
 * se guarda nada de aquí, queda excluido de la impresión (mismo patrón que
 * la Guía y la ventana Docente).
 *
 * Principio de fuentes (ver notas_meta.principio_fuentes más abajo): cada
 * parámetro cuantitativo va con su fuente. Cuando dos fuentes dan valores
 * distintos, se guardan ambos por separado -nunca promediados ni
 * combinados-, y app.js los pinta tal cual, uno por línea. Los campos sin
 * dato verificado se marcan "no especificado en fuentes".
 *
 * Solo en castellano por ahora, igual que la Guía: app.js avisa dentro del
 * propio diálogo cuando la interfaz está en inglés.
 *
 * Lote 1: columna/médula (PESS tibial, PESS mediano/cubital, PEM/TcMEP,
 * onda D, EMG libre espinal, EMG estimulado tornillo pedicular) + fosa
 * posterior/tronco - evocados y EMG (PEATC/BAEP, CoMEP pares craneales, EMG
 * libre pares craneales/A-train, mapeo directo pares craneales, TVcR).
 *
 * Lote 2: craneotomía despierta (mapeo cortical/subcortical DES, mapeo de
 * lenguaje, PESS fase-reversal de cisura central), plexo braquial/nervio
 * periférico (NAP/CNAP, PESS de troncos/cordones, EMG libre/estimulado
 * periférico) y reflejos de tronco adicionales (blink reflex, RMT, TCR,
 * PESS trigeminal).
 *
 * Lote 3: c-SEP, RBC, EEG, ECoG, PEV (vía anterior + cortical), H-reflejo de
 * sóleo/gastrocnemio, PRM, ARM, LAR, mapeo del IV ventrículo (BSM), mapeo de
 * columnas dorsales, mapeo de nervio periférico, estimulación directa del
 * cordón espinal.
 *
 * Lote 4: THR - reflejo trigémino-hipogloso (Mirallave Pescador 2022).
 *
 * Reorganización del 04-09-2026, pedida por Pani al llegar el Lote 3: las
 * técnicas de mapeo/registro cortical que se hacen igual bajo anestesia
 * general (DES cortical, DES subcortical, phase-reversal, c-SEP, ECoG, PEV
 * cortical) salen de "craneotomia_despierta" a una región nueva,
 * "cirugia_cerebral" -esa región ya no significa "el paciente está
 * despierto", que es justo lo que la hacía confusa-. La región
 * "craneotomia_despierta" se queda solo con lo que de verdad exige al
 * paciente despierto: el mapeo de lenguaje. Ver TECMIO_REGIONES en app.js.
 *
 * También se añadió la región "general" (EEG, PEV vía anterior): técnicas
 * que no son de una zona quirúrgica concreta.
 *
 * Un lote nuevo se añade empujando más objetos al array "tecnicas" de abajo,
 * con el mismo formato -no hace falta tocar app.js, que agrupa por el campo
 * "region" de cada técnica sea cual sea (las etiquetas legibles de región
 * están en TECMIO_REGIONES, ahí sí hay que añadir la región nueva a mano; lo
 * mismo con TECMIO_SECCIONES si el lote trae una sección de nivel superior
 * que no sea "estimulacion/registro/filtros/barrido/umbrales_referencia/
 * notas_clinicas" -el Lote 3 añadió "estimulacion_registro",
 * "mapeo_subcortical_radiacion_optica" y "tecnica_colision_onda_d"-).
 *
 * Orden dentro de cada región (pedido por Pani el 04-09-2026, no automático:
 * cualquier técnica nueva hay que insertarla a mano en el sitio que le
 * corresponda, app.js no reordena nada):
 *   1. Primero las técnicas de monitorización, luego las de mapeo.
 *   2. Dentro de "Fosa posterior/tronco", los reflejos van agrupados y
 *      ordenados por el nivel del par craneal implicado, de más rostral a
 *      más caudal: Blink Reflex (V1→VII, puente) → RMT/H-reflex del
 *      masetero (V3→V3, puente) → TCR (V→cervical, desciende a la médula
 *      cervical alta) → TVcR (V3→X vago/laringe) → LAR (X→X, puramente
 *      vagal) → THR (V1/V3→XII hipogloso, el par craneal más caudal).
 *
 * Los "id" y "region" de cada técnica son claves internas y se quedan sin
 * acentos a propósito (regla del proyecto: snake_case sin acentos ni
 * espacios). Todo lo demás -nombre, categoria y el resto de texto- lleva
 * tildes y eñes con normalidad: son literales que se pintan tal cual en
 * pantalla, no claves.
 */
window.TECNICAS_MIO = {
  "esquema_version": "1.0",
  "generado": "2026-09-04",
  "notas_meta": {
    "principio_fuentes": "Cada parámetro cuantitativo incluye su fuente. Cuando dos fuentes difieren, se muestran ambos valores explícitamente (nunca promediados ni combinados). Los campos sin dato verificado en las fuentes del proyecto se marcan como 'no especificado en fuentes'.",
    "convencion_claves": "snake_case sin acentos ni espacios, consistente con la convención Notion de Pani.",
    "lote_actual": "Lote 1: Columna/médula - evocados (6) + Fosa posterior/tronco - evocados y EMG (5) = 11. Lote 2: Craneotomía despierta (4) + Plexo braquial/nervio periférico (3) + Reflejos de tronco (4) = 11. Lote 3: c-SEP, RBC, EEG, ECoG, PEV (vía anterior + cortical), H-R sóleo/gastrocnemio, PRM, ARM, LAR, mapeo IV ventrículo, mapeo columnas dorsales, mapeo nervio periférico, estimulación directa del cordón espinal = 14. Lote 4: THR (tras aporte de Mirallave Pescador 2022) = 1. Más la nota de derivaciones optimizadas ISION para PESS (MacDonald 2019, Tabla 3), añadida como entrada propia. Total 38 entradas, todas trazadas a fuente.",
    "tecnicas_solicitadas_no_disponibles_en_fuentes": [
      "Reflejo glosofaríngeo-trigeminal: mencionado por nombre en la discusión de Urriza 2025 (lista de reflejos trigémino-vagales) sin metodología ni parámetros propios - no hay fuente primaria en el proyecto que lo describa."
    ],
    "categorias_pendientes_siguiente_lote": [
      "Variantes anestésicas específicas por técnica (TIVA vs halogenados) - de momento solo aparecen como nota clínica puntual, no como campo estructurado propio",
      "emg_libre_estimulado_periferico queda como entrada de remisión (sin protocolo específico propio localizado en fuentes) - revisar si Pani tiene protocolo clínico propio que aportar como fuente"
    ]
  },
  "tecnicas": [
    {
      "id": "pess_tibial_posterior",
      "categoria": "PESS",
      "region": "columna_medula",
      "nombre": "PESS de nervio tibial posterior",
      "estimulacion": {
        "sitio": "Nervio tibial posterior, retromaleolar interno (tobillo)",
        "electrodo": "Superficie o subdérmico",
        "parametros": {
          "intensidad_mA": {
            "costa_2015": "14-40 (individualizada según amplitud de respuesta)",
            "alvarez_2023": "40-100"
          },
          "duracion_pulso_ms": "0.2-0.3 (MacDonald 2019 ISION)",
          "frecuencia_hz": {
            "macdonald_2019_ision": "~4.7-5.1 (evitar divisores exactos de 50/60 Hz para no coincidir con artefacto de red)",
            "alvarez_2023": "3.7",
            "costa_2015": "7.1"
          },
          "modo": "Corriente constante preferible. Interleaving izq-dcha recomendado para acelerar adquisición (MacDonald 2019 ISION)."
        },
        "fuente": ["Costa 2015", "MacDonald 2019 ISION", "Álvarez 2023"]
      },
      "registro": {
        "sitio_cortical": "Cz'-Fz (o CPz-Fz); electrodo de aguja EEG",
        "sitio_subcortical": "Hueco poplíteo (fosa poplítea)",
        "montaje": "10-20 internacional; ver derivaciones optimizadas ISION (pess_derivaciones_optimizadas_ision) para el montaje de mayor SNR",
        "nota_tecnica": "Si la onda P40 está ausente o es de baja amplitud, desplazar el electrodo de registro ~2 cm lateralmente hacia el lado contralateral a la estimulación",
        "fuente": ["Moller cap.6", "Boaro 2026", "Certificación Repertorio FEA"]
      },
      "filtros": {
        "pasa_alto_hz": { "analogico_moller": "1-5", "ision_scalp": "30" },
        "pasa_bajo_hz": { "cortical_estandar": "125-250", "si_P14_16_relevante": "500-1000", "ision_scalp": "300" },
        "pasa_alto_periferico_hz": "0.2 (fosa poplítea/cubital, ISION)",
        "pasa_bajo_periferico_hz": "1000 (ISION)",
        "notch": "Desactivado (evita ringing/artefacto de anillo que puede simular o distorsionar el PESS)",
        "fuente": ["Moller cap.6", "Toleikis 2024 ASNM", "MacDonald 2019 ISION"]
      },
      "barrido": {
        "tiempo_analisis_ms": { "MMII": "80-100", "MMSS_referencia_cruzada": "40-50" },
        "promediado_n": "No hay número fijo recomendado; promediar hasta reproducibilidad media-alta. Costa 2015 usó 100-200 barridos.",
        "tasa_muestreo_hz": ">=2000 con LP 500Hz; preferible 5000-10000",
        "fuente": ["Moller cap.6", "MacDonald 2019 ISION", "Costa 2015"]
      },
      "notas_clinicas": {
        "criterio_alerta": "Clásico: caída de amplitud >50% y/o aumento de latencia >10%. MacDonald 2019 ISION propone criterios adaptativos basados en clase de reproducibilidad en lugar de umbral fijo.",
        "trampas_frecuentes": [
          "Vías somatosensoriales no cruzadas en HGPPS (síndrome de parálisis de mirada horizontal con escoliosis progresiva) - requiere colocación de electrodo distinta",
          "El PESS no valora la vía motora de forma aislada - riesgo de falso negativo si la lesión es puramente corticoespinal",
          "Sensible a hipotensión, hipotermia y dosis altas de anestésicos halogenados"
        ],
        "fuente": ["Moller cap.6", "Boaro 2026", "Certificación Repertorio FEA"]
      }
    },
    {
      "id": "pess_mediano_cubital",
      "categoria": "PESS",
      "region": "columna_medula",
      "nombre": "PESS de nervio mediano / cubital (MMSS)",
      "estimulacion": {
        "sitio": "Nervio mediano en muñeca; nervio cubital en muñeca o codo",
        "electrodo": "Superficie o subdérmico",
        "parametros": {
          "intensidad_mA": "40 (Boaro 2026, ejemplo estándar)",
          "duracion_pulso_ms": "0.2",
          "frecuencia_hz": "4.3 (Boaro 2026); mismo rango 4.7-5.1 recomendado por MacDonald 2019 ISION aplica por analogía",
          "modo": "Corriente constante"
        },
        "fuente": ["Boaro 2026", "MacDonald 2019 ISION"]
      },
      "registro": {
        "sitio_cortical": "C3'/C4'-Fz (contralateral a la estimulación)",
        "sitio_subcortical": "Punto de Erb (plexo braquial)",
        "montaje": "10-20 internacional; canales clásicos Cz'-Fz (pierna), C3'/C4'-Fz (brazo); ver derivaciones optimizadas ISION (pess_derivaciones_optimizadas_ision) para mayor SNR",
        "fuente": ["Boaro 2026", "Moller cap.6"]
      },
      "filtros": {
        "pasa_alto_hz": { "analogico_moller": "1-5", "ision_scalp": "30" },
        "pasa_bajo_hz": { "cortical_estandar": "125-250", "ision_scalp": "300" },
        "notch": "Desactivado",
        "fuente": ["Moller cap.6", "MacDonald 2019 ISION"]
      },
      "barrido": {
        "tiempo_analisis_ms": "40-50 (MMSS)",
        "promediado_n": "Hasta reproducibilidad media-alta (sin número fijo)",
        "fuente": ["Moller cap.6", "MacDonald 2019 ISION"]
      },
      "notas_clinicas": {
        "criterio_alerta": "Igual que PESS tibial: caída de amplitud >50% y/o aumento de latencia >10% (criterio clásico)",
        "trampas_frecuentes": [
          "Menos sensible a isquemia de territorio de arteria espinal anterior que MMII en cirugía torácica - complementar con onda D/PEM"
        ],
        "fuente": ["Boaro 2026"]
      }
    },
    {
      "id": "pess_derivaciones_optimizadas_ision",
      "categoria": "PESS",
      "region": "columna_medula",
      "nombre": "PESS - derivaciones corticales optimizadas por SNR (MacDonald 2019 ISION)",
      "registro": {
        "principio": "En vez de una derivación cortical fija, se comparan varias candidatas centroparietales por lado y se elige la de mayor SNR (mayor amplitud de señal con ruido similar) - esto reduce drásticamente el número de barridos necesarios para reproducibilidad media-alta.",
        "mmss_mediano_cubital_decusacion_normal": "Periférica de control: fosa cubital (CF). Cortical, ordenadas por frecuencia: CPc-CPz (óptima en el 75% de los nervios medianos), CPc-CPi, o CPc-Fz",
        "mmss_no_decusacion": "Periférica: fosa cubital (CF). Cortical: CPi-CPz, CPi-CPc, o CPi-Fz",
        "mmii_tibial_decusacion_normal": "Periférica de control: fosa poplítea (PF). Cortical (mayor SNR): CPz-CPc (óptima en ~40% de los nervios tibiales - la más frecuente pero no dominante como en MMSS), Cz-CPc, Pz-CPc, iCPi-CPc, CPi-CPc, o Cz-Pz",
        "mmii_no_decusacion": "Periférica: fosa poplítea (PF). Cortical: CPz-CPi, Cz-CPi, Pz-CPi, iCPc-CPi, CPc-CPi, o Cz-Pz",
        "mmii_posicion_sentada": "Cualquier decusación: CPz-Fpz (única excepción donde Fpz sí es óptima - el aire intracraneal tras apertura dural puede reducir/anular los potenciales laterales, pero las venas puente al seno sagital mantienen el córtex de pierna en contacto dural)",
        "fuente": ["MacDonald 2019 ISION (Tabla 3)", "Neurophysiology in Neurosurgery 2ed Tabla 3.3"]
      },
      "notas_clinicas": {
        "fpz_rara_vez_optima": "Fpz casi nunca es óptima fuera del caso de posición sentada de arriba - el ruido EEG frontal de banda rápida reduce el SNR aunque a veces la señal bruta sea mayor",
        "comprobar_decusacion": "Comprobar decusación con derivación coronal (CPc-M / CPi-M, M=mastoides) antes de fijar la derivación - no asumirla",
        "opcional_erb_n13": "Opcional si no retrasa el feedback: punto de Erb (EPi-M) y/o N13 cervical (C5S-M) - mejor SNR que las derivaciones tradicionales de Erb/C5S",
        "fallback_subcortical": "Solo si el cortical está muy comprometido por anestesia inhalatoria o patología previa: MMSS = CPi-M (CPc-M si no decusa); MMII = Fpz-M",
        "velocidad": "CPc-CPz (mediano) reproduce en mediana 50-120 barridos vs. cientos/miles con derivaciones tradicionales (CPc-Fpz, CPi-EPc, etc.); tibial óptima en mediana 128 barridos vs. 512 (CPz-Fpz tradicional)",
        "topografia_variable": "En ~30% de pacientes la topografía cortical del PESS tibial cambia gradualmente durante la cirugía (el punto de máxima P37 se desplaza) - si hay caída asimétrica inexplicada fuera de contexto quirúrgico, reoptimizar antes de alarmar",
        "fuente": ["MacDonald 2019 ISION (Tabla 3)", "Neurophysiology in Neurosurgery 2ed Tabla 3.3"]
      }
    },
    {
      "id": "pem_tces_miogenico",
      "categoria": "PEM",
      "region": "columna_medula",
      "nombre": "PEM/TcMEP miogénico por estimulación eléctrica transcraneal (TES)",
      "estimulacion": {
        "sitio_montajes": {
          "hemisferico_C3_Cz_C4_Cz": "Testeo de decusación; MEP facial y de brazo; respuesta mayormente unilateral",
          "interhemisferico_C1_C2": "MEP de brazo y pierna; respuesta asimétrica; penetración moderada",
          "interhemisferico_C3_C4": "MEP de brazo y pierna; respuesta asimétrica pero más potente; penetración profunda",
          "linea_media_Cz-1_Cz+6": "MEP de pierna; respuesta simétrica; penetración moderada"
        },
        "electrodo": "Tornillo tipo corkscrew subdérmico",
        "parametros": {
          "tren_pulsos": "3-8 pulsos (3-5 habitual; 6-8 solo para protocolo específico de MEP polifásicos largos, Quiñones-Hinojosa 2005, no estandarizado)",
          "duracion_pulso_ms": "0.5",
          "isi_ms": "2-4 típico (rango efectivo 1-10; óptimo 1-2 ms según Moller cap.10); interpulso 2-4ms = 250-500Hz intratren",
          "intensidad": "Individualizada por umbral motor de cada músculo; se ajusta con la profundidad anestésica",
          "tipo_estimulador": "Voltaje constante es lo más usado históricamente; corriente constante preferible para estimulación intracraneal directa"
        },
        "fuente": ["Legatt 2016 ACNS", "MacDonald 2013 ASNM", "Moller cap.10"]
      },
      "registro": {
        "musculos_habituales": "Tenar/aductor del quinto dedo (MMSS); tibial anterior/abductor hallucis (MMII) - seleccionar según objetivo quirúrgico",
        "electrodo": "Par de agujas intramusculares (belly-tendon o par de agujas)",
        "fuente": ["MacDonald 2013 ASNM"]
      },
      "filtros": {
        "pasa_alto_hz": "no especificado en fuentes del proyecto para PEM miogénico específicamente",
        "pasa_bajo_hz": "no especificado en fuentes del proyecto para PEM miogénico específicamente",
        "fuente": []
      },
      "barrido": {
        "ventana_registro_ms": "100 (habitual para CMAP miogénico, por analogía con protocolo ARMR/PRMR de Neurophysiology in Neurosurgery cap.31)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.31"]
      },
      "notas_clinicas": {
        "criterio_alerta": "No existe umbral de amplitud universal validado (ver principio ya establecido en memoria de trabajo). MacDonald 2013 ASNM no fija un valor único de corte de amplitud.",
        "trampas_frecuentes": [
          "Anestesia inhalatoria a dosis altas suprime la respuesta - preferir TIVA para PEM",
          "El bloqueo neuromuscular debe controlarse con train-of-four; relajación excesiva suprime o distorsiona la respuesta",
          "El criterio de simplificación morfológica tiene validación de un único estudio con protocolo no estándar (Quiñones-Hinojosa 2005) - no aplicar como criterio general"
        ],
        "fuente": ["MacDonald 2013 ASNM", "Sloan 2012 (relajantes musculares)"]
      }
    },
    {
      "id": "onda_d_epidural",
      "categoria": "Onda D",
      "region": "columna_medula",
      "nombre": "Onda D (potencial motor epidural, tracto corticoespinal)",
      "estimulacion": {
        "sitio": "Espacio epidural, electrodos craneal y caudal (misma vía de acceso que TES para PEM)",
        "parametros": {
          "tipo_estimulo": "Estímulo único",
          "duracion_pulso_us": "300",
          "tasa_hz": "3",
          "intensidad_mA": "Ajustada según aparición de respuesta cortical (scalp); no superar 30 mA"
        },
        "fuente": ["Costa 2015"]
      },
      "registro": {
        "montaje": "Electrodos 1-2 (activo-referencia) para el electrodo rostral y 2-1 para el caudal, buscando igual polaridad en ambos registros; si no es factible, usar montajes 2 vs 3 (craneal) y 3 vs 2 (caudal)",
        "fuente": ["Costa 2015"]
      },
      "filtros": {
        "rango_hz": "200/500 a 3000 (típico para D-wave/e-MEP)",
        "fuente": ["Costa 2015"]
      },
      "barrido": {
        "tiempo_analisis_ms": "10 o 20",
        "promediado_n": "Habitualmente respuesta de barrido único legible; si es necesario, promediar 4-10 respuestas para mejorar SNR",
        "fuente": ["Costa 2015"]
      },
      "notas_clinicas": {
        "criterio_alerta": "Caída de amplitud >50% respecto al basal (criterio ASNM MacDonald 2013)",
        "trampas_frecuentes": [
          "No permite lateralización - registra actividad combinada de ambos hemicordones (principio ya validado en memoria de trabajo)",
          "No es apropiada para detectar lesiones que afecten a la médula baja distal al electrodo de registro",
          "Se atenúa muy poco con fármacos anestésicos - es el componente más robusto frente a anestesia, pero no detecta isquemia pura de motoneurona espinal"
        ],
        "fuente": ["Costa 2015", "Certificación Repertorio FEA"]
      }
    },
    {
      "id": "emg_libre_espinal",
      "categoria": "EMG",
      "region": "columna_medula",
      "nombre": "EMG libre continuo (raíces nerviosas espinales)",
      "estimulacion": {
        "nota": "Técnica pasiva, sin estímulo aplicado"
      },
      "registro": {
        "musculos": "Miotomas correspondientes a las raíces en riesgo. Para L2-S2: vasto medial, tibial anterior, peroneo largo, gastrocnemio medial",
        "electrodo": "Aguja insertada en el punto motor del músculo (activo); referencia sobre tendón o hueso",
        "fuente": ["Leppanen 2005/2006 ASNM"]
      },
      "filtros": {
        "pasa_alto_hz": "2-30 (habitual)",
        "pasa_bajo_khz": "10-30 (habitual)",
        "evitar": "Pasa-alto >50 Hz y pasa-bajo <3 kHz",
        "fuente": ["Leppanen 2005/2006 ASNM"]
      },
      "barrido": {
        "modo": "Free-run continuo",
        "tiempo_barrido_s": "1 (típico)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.13 (Toleikis)"]
      },
      "notas_clinicas": {
        "criterio_alerta": "Descargas tónicas/neurotónicas sostenidas (>1 s) indican irritación o daño radicular; brotes breves (<1 s) coincidiendo con manipulación mecánica habitualmente no son significativos",
        "trampas_frecuentes": [
          "Requiere bloqueo neuromuscular parcial (al menos 1 de 4 respuestas en train-of-four); la relajación excesiva enmascara la actividad",
          "La sección completa de un nervio puede NO producir respuesta EMG - falso negativo conocido"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.13", "Certificación Repertorio FEA"]
      }
    },
    {
      "id": "rbc_bulbocavernoso",
      "categoria": "RBC",
      "region": "columna_medula",
      "nombre": "Reflejo bulbocavernoso (RBC/BCR)",
      "estimulacion": {
        "sitio": "Nervio dorsal del pene (varón) o clítoris (mujer) - aferencias pudendas",
        "electrodo": "Dos discos de plata/cloruro de plata; varón: cátodo proximal; mujer: cátodo sobre el clítoris, ánodo sobre labios mayores",
        "parametros": "Pulsos rectangulares de 0.2-0.5 ms, tren de 5 estímulos, ISI 4 ms, tasa de repetición 2.3 Hz, intensidad hasta 40 mA",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.6/29 (Vodusek, Deletis)"]
      },
      "registro": {
        "sitio": "Esfínter anal externo",
        "electrodo": "Dos pares de electrodos intramusculares hook-wire, teflón-coated, insertados en los hemiesfínteres",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.29"]
      },
      "notas_clinicas": {
        "utilidad": "Reflejo oligosináptico - valora la integridad de las fibras aferentes y eferentes del nervio pudendo junto con el centro reflejo de la sustancia gris S2-S4",
        "indicacion": "Se añade a la batería neurofisiológica siempre que la lesión afecte a segmentos lumbosacros de la médula (conus medullaris, cauda equina, tethered cord)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.29"]
      }
    },
    {
      "id": "h_reflejo_soleo_gastrocnemio",
      "categoria": "H-Reflejo",
      "region": "columna_medula",
      "nombre": "H-Reflejo de sóleo y gastrocnemio",
      "estimulacion": {
        "sitio": "Nervio tibial posterior en el hueco poplíteo",
        "electrodo": "Aguja o superficie; ánodo en el área medial distal del hueco poplíteo, cátodo ~4-5 cm lateral y proximal",
        "parametros": "Tasa 0.5 Hz; duración de estímulo larga (1 ms), baja intensidad, para activar selectivamente fibras Ia; intensidad ajustada para amplitud máxima del H-reflejo (más allá de ese punto, subir la intensidad lo inhibe y aparece la onda M)",
        "fuente": ["Leppanen 2005/2006 ASNM"]
      },
      "registro": {
        "gastrocnemio": "Agujas EEG subdérmicas en la cabeza medial de ambos gastrocnemios",
        "soleo": "Mismo montaje; electrodos sobre la línea media dorsal de la pierna, activo 4 cm proximal a la unión de las dos cabezas del gastrocnemio con el tendón de Aquiles, referencia 3 cm distal al activo",
        "filtros": "Pasa-alto 2-30 Hz, pasa-bajo 10-30 kHz (evitar pasa-alto >50 Hz y pasa-bajo <3 kHz)",
        "barrido": "100 ms, registro single-sweep",
        "fuente": ["Leppanen 2005/2006 ASNM"]
      },
      "notas_clinicas": {
        "confirmacion_h_reflejo": "La amplitud debe superar la de la onda M, y la configuración/latencia deben ser constantes de un estímulo a otro",
        "parametros_monitorizados": "Amplitud, latencia (habitualmente <35 ms, mayor intraoperatoriamente por hipotermia del miembro), ratio H:M, diferencias derecha-izquierda",
        "mediado_por": "Fibras Ia aferentes (segmento S1) - útil para valorar la integridad de la vía monosináptica S1, complementario al PESS/PEM en cirugía de médula baja/cauda equina",
        "variante_heteronima": "H-reflejos heterónimos (en músculos de segmento distinto al de la aferencia Ia activada) pueden aparecer en lesiones de motoneurona superior por disminución de la inhibición presináptica - signo de disfunción del sistema motor central",
        "fuente": ["Leppanen 2005/2006 ASNM"]
      }
    },
    {
      "id": "emg_estimulado_tornillo_pedicular",
      "categoria": "EMG",
      "region": "columna_medula",
      "nombre": "EMG estimulado (evaluación de tornillo/broca pedicular)",
      "estimulacion": {
        "sitio": "Tornillo o broca pedicular (cátodo, pinza de cocodrilo esterilizada) frente a electrodo dispersivo sobre el hombro posterior (ánodo) - estimulación monopolar",
        "parametros": {
          "tipo": "Corriente constante preferible sobre voltaje constante (menor variabilidad, ver nota de shunting más abajo)",
          "duracion_pulso_ms": "0.2",
          "tasa_hz": "1-3 (evitar tasas >1 Hz si hay bloqueo neuromuscular parcial, por decremento del CMAP entre estímulos)"
        },
        "fuente": ["Leppanen 2005/2006 ASNM", "Moller cap.10"]
      },
      "registro": {
        "musculos": "Mismos miotomas que EMG libre, por encima y por debajo del pedículo testado",
        "fuente": ["Leppanen 2005/2006 ASNM"]
      },
      "umbrales_referencia": {
        "umbral_alarma_mas_usado_mA": "<=10 (Calancie et al.; ampliamente adoptado como warning threshold)",
        "rangos_alternativos_publicados_mA": "<6, <4, <11 según la serie (resumidos en Leppanen 2005/2006)",
        "valores_normales_sin_brecha_mA": {
          "tornillo": "media 24.0 (rango 9.0-60.0, SD 11.9)",
          "broca": "media 30.4 (rango 8.5-53.0, SD 13.9)"
        },
        "aplicabilidad": "Validado para columna toracolumbar. Sin validación específica para C1-C2 en las fuentes del proyecto (gap ya identificado en memoria de trabajo).",
        "fuente": ["Leppanen 2005/2006 ASNM", "Toleikis - Neurophysiology in Neurosurgery 2ed cap.13"]
      },
      "filtros": {
        "rango_hz": "30-3000 (pasa-banda amplio)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.13"]
      },
      "barrido": {
        "modo": "Single-sweep (respuesta evocada, no promediada)",
        "fuente": ["Leppanen 2005/2006 ASNM"]
      },
      "notas_clinicas": {
        "trampas_frecuentes": [
          "El shunting por fluido/irrigación eleva falsamente el umbral (riesgo de falso negativo) - retirar irrigación antes de testear",
          "Relajación neuromuscular excesiva (menos del 4º twitch en TOF) eleva artificialmente el umbral - verificar TOF antes de interpretar un umbral alto como normal",
          "Tejido cicatricial de cirugía previa puede elevar el umbral basal de forma inespecífica",
          "Ante duda, comparar el umbral del tornillo con el umbral de estimulación directa de la raíz visible en el campo (técnica de control)"
        ],
        "fuente": ["Leppanen 2005/2006 ASNM", "Moller cap.10", "Toleikis cap.13"]
      }
    },
    {
      "id": "mapeo_columnas_dorsales",
      "categoria": "Mapeo de columnas dorsales",
      "region": "columna_medula",
      "nombre": "Mapeo de columnas dorsales (localización de la línea media medular y el DREZ)",
      "estimulacion": {
        "nervio": "Mediano o tibial periférico",
        "parametros": "Hasta 40 mA, 0.2 ms, 13.3 Hz (técnica de rejilla multielectrodo)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.12"]
      },
      "registro": {
        "tecnica_rejilla_multielectrodo": "Rejilla miniatura de 8 hilos de acero inoxidable paralelos (76 µm de diámetro, separados 1 mm), colocada sobre la columna dorsal expuesta, alineada con el eje longitudinal de la médula; referencia en músculo cercano; 2 sets de 100-200 barridos promediados por cada uno de los 8 canales",
        "filtros": "50-1700 Hz",
        "epoca": "~20 ms",
        "tecnica_alternativa_electrodo_bola": "Electrodo de bola de plata o disco de acero inoxidable: registro de PESS por inversión de fase directamente sobre la médula, o registro de NAP (potencial de acción nervioso) desde nervios periféricos para localizar el DREZ (zona de entrada de la raíz dorsal)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.12"]
      },
      "notas_clinicas": {
        "criterio_localizacion_linea_media": "La línea media funcional se determina como el punto entre los dos electrodos de registro con mayor amplitud del PESS (gradiente de amplitud). Para PESS de tibial la amplitud máxima está hacia la línea media y decrece hacia el DREZ. Para PESS de mediano (lesiones cervicales) el patrón es inverso, con amplitudes mayores lateralmente cerca del DREZ.",
        "indicacion": "Localización de la línea media medular y del DREZ para procedimientos como mielotomía en tumores intramedulares o siringomielia",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.12"]
      }
    },
    {
      "id": "estimulacion_directa_cordon_espinal",
      "categoria": "Estimulación directa CE",
      "region": "columna_medula",
      "nombre": "Estimulación directa del cordón espinal (mapeo intramedular) y técnica de colisión de la onda D",
      "estimulacion": {
        "mapeo_directo_gandhi": "Pulsos bifásicos de 1 ms de duración, tasa 60 Hz, sonda bipolar concéntrica; intensidad 0.1-1 mA; mapeo dentro de la cavidad de resección en cirugía de tumores intramedulares",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.12 (protocolo de Gandhi et al.)"]
      },
      "registro": {
        "musculos": "Músculos de miembros (respuesta motora similar al PEM)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.12"]
      },
      "tecnica_colision_onda_d": {
        "fundamento": "La onda D descendente generada por TES colisiona con el volley ascendente antidrómico generado por la estimulación directa de la médula (sonda) cuando esta está próxima al tracto corticoespinal - la colisión reduce la amplitud de la onda D registrada caudalmente (hasta un 50% de reducción máxima)",
        "requisito_tecnico": "Sincronización precisa del disparo entre el estimulador de alta intensidad (TES) y el de baja intensidad (sonda medular)",
        "uso_diferencial": "Comparando la amplitud de la onda D proximal y distal antes y después de la colisión, se puede diferenciar entre fibras del CST sanas, desincronizadas y bloqueadas",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.12"]
      },
      "notas_clinicas": {
        "supuesto_no_validado": "El protocolo de Gandhi et al. asume que la estimulación activa exclusivamente las fibras de conducción rápida del CST - esto no está completamente confirmado según la propia fuente",
        "alternativa_conceptual": "Técnica análoga al mapeo subcortical supratentorial (ver mapeo_subcortical_des) pero aplicada dentro del cordón espinal expuesto, en vez de en sustancia blanca cerebral",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.12"]
      }
    },
    {
      "id": "peatc_baep",
      "categoria": "Fosa posterior/tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "PEATC / BAEP (potenciales evocados auditivos de tronco)",
      "estimulacion": {
        "sitio": "Vía auricular de inserción, bilateral",
        "tipo_estimulo": "Clicks de rarefacción o de condensación - NO usar clicks alternantes (la mezcla de polaridades distorsiona la respuesta, sobre todo con hipoacusia)",
        "parametros": {
          "clinico_alvarez_2023": "90 dB, 11.3 Hz",
          "ejemplo_laboratorio_moller": "105 dB PeqSPL, 21 pps (ejemplo de referencia, no necesariamente el ajuste clínico habitual en quirófano)"
        },
        "fuente": ["Álvarez 2023", "Moller cap.5"]
      },
      "registro": {
        "montaje": "Vertex (Cz) frente a lóbulo de la oreja o mastoides ipsilateral; alternativa vertex frente a nuca dorsal alta",
        "fuente": ["Moller cap.5"]
      },
      "filtros": {
        "rango_hz": { "moller_cap5_ejemplo": "10-3000", "alvarez_2023_clinico": "100-2000" },
        "nota_tecnica": "Preferibles filtros digitales zero-phase FIR sobre analógicos: evitan la distorsión de fase que puede desplazar o invertir picos",
        "fuente": ["Moller cap.5", "Álvarez 2023"]
      },
      "barrido": {
        "tiempo_analisis_ms": "15 (Álvarez 2023, ajuste clínico en quirófano) - verificar en el equipo Cadwell, ya que es un margen ajustado para picos I-V (~6-8ms de latencia de V)",
        "promediado_n": "Hasta 2000-4096 barridos según amplitud/ruido (Moller cap.5)",
        "fuente": ["Álvarez 2023", "Moller cap.5"]
      },
      "notas_clinicas": {
        "criterio_alerta": "Pérdida de onda III y/o V, o aumento de latencia interpico I-III o III-V, o aumento de latencia absoluta de V >1.0 ms",
        "localizacion_por_onda": "I-II: nervio auditivo distal/proximal; III: núcleo coclear/oliva superior; IV: lemnisco lateral contralateral; V: colículo inferior contralateral",
        "trampas_frecuentes": [
          "Pérdida irreversible de todas las ondas se asocia a hipoacusia postoperatoria; recuperación antes de finalizar la cirugía se asocia a audición preservada"
        ],
        "fuente": ["Álvarez 2023"]
      }
    },
    {
      "id": "comep_pares_craneales",
      "categoria": "Fosa posterior/tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "CoMEP - potenciales motores corticobulbares por TES (pares craneales motores)",
      "estimulacion": {
        "sitio_montaje": "C3(+)-Cz(-) para hemisferio izquierdo / C4(+)-Cz(-) para hemisferio derecho (Deletis). Alternativa: C5(+)-Cz(-) / C6(+)-Cz(-) (Verst et al.) - más efectiva pero con más movimiento por posible componente periférico.",
        "parametros": {
          "tren": "3-5 estímulos de 0.5 ms de duración, ISI 2 ms, tasa de repetición del tren 2 Hz",
          "intensidad_mA": "50-150 (hasta 200 excepcionalmente)",
          "protocolo_diferenciacion_central_vs_periferico": "Estímulo único adicional a los mismos electrodos, 90 ms después del tren corto. Si el estímulo único también genera respuesta bajo anestesia general, se considera de origen periférico (propagación distal de corriente), no corticobulbar central."
        },
        "fuente": ["Deletis & Fernández-Conejero (J Clin Neurol)", "Neurophysiology in Neurosurgery 2ed cap.10", "Intraoperatients.pdf (serie FCoMEP)"]
      },
      "registro": {
        "musculos": "Orbicular oculi, nasal, orbicular oris, mentoniano (facial); según objetivo también velo del paladar, lengua, músculos laríngeos para otros pares craneales motores",
        "electrodo": "Par de electrodos hook-wire (menor captación de respuestas de campo lejano de músculos vecinos que la aguja convencional)",
        "fuente": ["Intraoperatients.pdf", "Neurophysiology in Neurosurgery 2ed cap.10"]
      },
      "filtros": {
        "rango_hz": "50-1500",
        "fuente": ["Intraoperatients.pdf (serie FCoMEP)"]
      },
      "barrido": {
        "ventana_registro_ms": "no especificado explícitamente en fuentes del proyecto - estimar por analogía con CMAP miogénico (~50-100 ms)",
        "fuente": []
      },
      "notas_clinicas": {
        "trampas_frecuentes": [
          "Respuesta a estímulo único bajo anestesia general = origen periférico, no corticobulbar - no interpretar como CoMEP válido",
          "La latencia de inicio del CoMEP facial por tren debe ser >10 ms para considerarse de origen central (Dong et al.)",
          "Pacientes con disfunción facial preoperatoria severa (House-Brackmann V-VI) suelen quedar excluidos por no ser evocable el FCoMEP"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.10/23", "Intraoperatients.pdf"]
      }
    },
    {
      "id": "emg_libre_pares_craneales",
      "categoria": "Fosa posterior/tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "EMG libre continuo de pares craneales motores (patrón A-train)",
      "estimulacion": {
        "nota": "Técnica pasiva, sin estímulo aplicado"
      },
      "registro": {
        "musculos": "Facial: orbicular oculi, nasal, orbicular oris, mentoniano (mínimo 3-4 canales); trigémino, IX-XII según campo quirúrgico",
        "electrodo": "Aguja bare-needle, separación 5-10 mm (superior al hook-wire para esta técnica en concreto, salvo en el músculo masetero)",
        "fuente": ["Romstock 2000", "Neurophysiology in Neurosurgery 2ed cap.23"]
      },
      "filtros": {
        "rango_hz": "no especificado explícitamente en fuentes del proyecto (Romstock 2000 no detalla la banda de filtro utilizada)",
        "fuente": []
      },
      "barrido": {
        "modo": "Registro continuo multicanal; análisis de morfología de onda (offline u online según equipo)",
        "fuente": ["Romstock 2000"]
      },
      "notas_clinicas": {
        "criterio_alerta": "El patrón A-train (tren sinusoidal, simétrico, alta frecuencia, baja amplitud, duración ~10 s) es el ÚNICO patrón con alta sensibilidad y especificidad para paresia facial postoperatoria. El criterio es el patrón de la onda, no su amplitud (principio ya validado en memoria de trabajo).",
        "trampas_frecuentes": [
          "Los trenes B y C son irrelevantes para el pronóstico postoperatorio - no generar alarma por ellos",
          "La estimulación eléctrica directa del nervio puede inducir un A-train sin daño real subyacente (descrito por Romstock 2000)",
          "La manipulación del nervio intermediario puede generar A-train sin correlato clínico facial (Prell et al., referenciado en Neurophysiology in Neurosurgery 2ed)"
        ],
        "fuente": ["Romstock 2000", "Neurophysiology in Neurosurgery 2ed cap.23/24"]
      }
    },
    {
      "id": "pess_trigeminal_tep",
      "categoria": "Reflejos de tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "Potenciales evocados trigeminales (TEP) - PESS de nervio trigémino",
      "estimulacion": {
        "sitio": "Ramas del nervio trigémino (periférico)",
        "fuente": ["Moller cap.5"]
      },
      "registro": {
        "scalp": "Cz y Oz",
        "intracraneal": "Directamente sobre la porción intracraneal del nervio trigémino cuando está expuesto (ej. descompresión microvascular para neuralgia del trigémino) - latencias de componentes negativos de corta latencia: 0.9, 1.6 y 2.6 ms",
        "fuente": ["Moller cap.5"]
      },
      "notas_clinicas": {
        "uso_real": "Técnica raramente usada en monitorización intraoperatoria de rutina, a diferencia del resto de PESS - alta variabilidad entre laboratorios, especialmente en componentes de latencia larga (>5 ms)",
        "utilidad_descrita": "Útil para monitorizar la médula oblonga y en rizotomía trigeminal para neuralgia del trigémino, donde interesa vigilar la conducción del propio nervio trigémino",
        "trampas_frecuentes": [
          "No se ha descrito su uso mediante estimulación táctil (air puffs) en el contexto intraoperatorio - solo estimulación eléctrica",
          "No confundir con el reflejo TCR o TVcR, que son reflejos polisinápticos, no PESS puros de la vía trigeminal"
        ],
        "fuente": ["Moller cap.5"]
      }
    },
    {
      "id": "reflejo_parpadeo_blink_reflex",
      "categoria": "Reflejos de tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "Reflejo de parpadeo (Blink Reflex, BR) bajo anestesia general",
      "estimulacion": {
        "sitio": "Nervio supraorbitario, agujas EEG subcutáneas; cátodo en la escotadura supraorbitaria, ánodo 2.5 cm superior y lateral al cátodo",
        "parametros": "1-7 estímulos rectangulares de corriente constante, ISI 2 ms, intensidad 20-40 mA, tasa de repetición del tren 0.4 Hz",
        "facilitacion_si_no_hay_respuesta": "Doble tren de estímulos, con intervalo entre trenes de 20-40 ms",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.17 (Fernández-Conejero & Deletis)"]
      },
      "registro": {
        "sitio": "Tercio ínfero-lateral del orbicular de los ojos, ipsilateral al lado estimulado (agujas idénticas a las de estimulación, o hook-wire)",
        "promediado": "2 barridos únicos (mínimo); invertir la polaridad del electrodo de estimulación tras el primer barrido para reducir el artefacto de estímulo",
        "ventana": "Época de 50 ms",
        "filtros_hz": "Pasa-banda digital 70-1219",
        "timing_recomendado": "Intentar tras la intubación, durante la cirugía, y tras iniciar el cierre de piel",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.17"]
      },
      "notas_clinicas": {
        "componentes": "R1: arco reflejo oligosináptico (aferencia trigeminal V1, conexión troncoencefálica, núcleo motor facial, nervio facial, orbicular oculi). R2: más complejo/polisináptico, mismo arco aferente/eferente.",
        "trampa_critica": "El CoMEP del orbicular oculi por TES fuerte puede confundirse con un BR (R1) por difusión de corriente sobre el escalpo anterior que activa el nervio supraorbitario - si se usa el CoMEP de orbicular oculi de forma aislada, un hallazgo puede reflejar el BR y no la vía corticobulbar real. Se recomienda monitorizar BR y CoMEP simultáneamente y de forma diferenciada.",
        "sensibilidad_anestesica": "No siempre evocable - sensible a la profundidad anestésica (correlación descrita con caídas del BIS)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.17", "Intraoperatients.pdf"]
      }
    },
    {
      "id": "reflejo_masetero_rmt",
      "categoria": "Reflejos de tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "Reflejo H del masetero (RMT) bajo anestesia general",
      "estimulacion": {
        "sitio": "Nervio maseterino (rama del trigémino), acceso percutáneo bajo el arco cigomático, 0.5 cm anterior a la articulación temporomandibular",
        "electrodo": "Par de agujas EMG monopolares o electrodos hook-wire",
        "parametros": "Estímulos únicos de intensidad creciente (de submáxima a supramáxima), tasa de repetición 0.7 Hz",
        "contexto_anestesico_descrito": "TIVA (propofol 75-300 ug/kg/min + remifentanilo 0.1-0.2 ug/kg/min); bloque de mordida (gasa/espuma enrollada) para mantener la boca semiabierta 2-3 cm",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.16 (Téllez & Ulkatan)"]
      },
      "registro": {
        "musculos": "Masetero ipsilateral (principal); temporal ipsilateral (alternativa, umbral distinto - no registrar ambos simultáneamente asumiendo el mismo umbral)",
        "valores_normativos": {
          "latencia_h_reflejo_masetero_ms": "5.4 +/- 1.3 (media +/- DE)",
          "latencia_respuesta_m_masetero_ms": "2.6 +/- 0.6",
          "latencia_h_reflejo_temporal_ms": "5.3 +/- 0.8",
          "amplitud_h_relativa_a_m": "~21% del máximo de la respuesta M"
        },
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.16"]
      },
      "notas_clinicas": {
        "tasa_exito_descrita": "Elicitable de forma fiable en 7/10 pacientes (70%) para masetero; 3/4 (75%) para temporal, en la serie de Ulkatan et al. 2017",
        "utilidad": "Refleja conducción a través del mesencéfalo y protuberancia media - útil en cirugía que involucra estas estructuras (ej. descompresión microvascular, MAV de tronco)",
        "trampas_frecuentes": [
          "Reflejo estrictamente unilateral - comparar siempre con el lado contralateral cuando sea posible",
          "Sin criterios de alerta validados aún - técnica en fase de validación quirúrgica, no consolidada como estándar según la propia fuente"
        ],
        "aclaracion_jaw_jerk": "Confirmado con Pani: el chip 'H-R Masetero (Jaw Jerk)' de su herramienta corresponde a esta técnica eléctrica (estimulación del nervio maseterino), no a la percusión mentoniana clásica del jaw jerk por estiramiento - esa variante por percusión no está descrita como protocolo propio en las fuentes del proyecto.",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.16"]
      }
    },
    {
      "id": "reflejo_trigemino_cervical_tcr",
      "categoria": "Reflejos de tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "Reflejo trigémino-cervical (TCR)",
      "estimulacion": {
        "sitio": "Nervio supraorbitario o infraorbitario (rama del trigémino)",
        "parametros_intraoperatorios": "Trenes de 2-7 estímulos (multipulso); duración de pulso crítica: 0.5-1.0 ms (patrón B) favorece claramente la aparición del reflejo bajo anestesia general frente a 0.2-0.5 ms (patrón A) - recordabilidad 100% vs 22.2% respectivamente en la serie de referencia",
        "preoperatorio_diagnostico": "Pulso único bifásico de 0.2 ms; tiempo de análisis 50 ms; ganancia 100 uV/división",
        "fuente": ["Lima Medeiros 2024"]
      },
      "registro": {
        "musculo": "Esternocleidomastoideo (SCM) ipsilateral a la estimulación - respuesta más consistente; trapecio ipsi/contralateral y SCM contralateral con recordabilidad variable y menor",
        "filtros_hz": "60-2000 o 90-2000 según ejemplo de la fuente - ajustar según visualización; filtros más bajos (ej. 65 Hz) mejoran la visualización del TCR pero pueden dificultar distinguir el artefacto de estímulo",
        "valores_normativos_intraoperatorios_scm_ipsi": {
          "latencia_corta_mediana_ms": "15.6-16.7 según el nervio estimulado",
          "latencia_larga_mediana_ms": "~42-61 (infrecuente - solo en 2 de 20 pacientes de la serie)"
        },
        "fuente": ["Lima Medeiros 2024"]
      },
      "notas_clinicas": {
        "trampa_critica": "Diferenciar del CMAP del platisma por activación periférica no intencionada del nervio facial (difusión de corriente): el CMAP del platisma tiene latencia <8 ms, mientras que el TCR de latencia corta tiene latencia ~15-25 ms. Usar electrodos aislados en el SCM y vigilar la latencia con cuidado para no confundirlos - un CMAP de platisma mal interpretado como ausencia de TCR puede generar un falso negativo.",
        "estado_de_validacion": "Primera demostración de elicitación bajo anestesia general (2024) - sin rol clínico establecido aún en IONM; técnica exploratoria",
        "fuente": ["Lima Medeiros 2024"]
      }
    },
    {
      "id": "tvcr_reflejo_trigemino_vocal",
      "categoria": "Fosa posterior/tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "TVcR - Reflejo trigémino-vocal (Urriza et al. 2025)",
      "estimulacion": {
        "sitio": "Rama mentoniana del nervio trigémino (V3), a nivel del foramen mandibular; lado izquierdo (L.V3) o derecho (R.V3)",
        "electrodo": "Agujas o electrodos de superficie",
        "parametros": "Estímulo único o tren de 2-4 pulsos, elegido según la profundidad anestésica",
        "fuente": ["Urriza 2025"]
      },
      "registro": {
        "sitio": "Cuerdas vocales",
        "electrodo": "Electrodo de tubo adhesivo endotraqueal",
        "montaje": "Bipolar preferible sobre referencial (trazados más claros y mejor definidos en la mayoría de los casos)",
        "fuente": ["Urriza 2025"]
      },
      "filtros": {
        "pasa_alto_hz": "0.1 inicial; ajustable 0.1-40 para corregir artefacto de estímulo",
        "pasa_bajo_hz": "2000 (constante)",
        "fuente": ["Urriza 2025"]
      },
      "barrido": {
        "tiempo_analisis_ms": "100-200, con un 10% de delay pre-estímulo",
        "fuente": ["Urriza 2025"]
      },
      "notas_clinicas": {
        "valores_normativos": "R1: latencia 17-39 ms (mediana ~29 ms), respuesta bilateral en 41/47 pacientes de la serie. R2 (presente en ~51% de los casos con R1): latencia 56-76 ms (mediana ~65 ms).",
        "trampas_frecuentes": [
          "Técnica de descripción muy reciente (2025) - sin validación establecida de utilidad clínica intraoperatoria; tratar como hallazgo exploratorio, no como criterio de alerta consolidado",
          "El electrodo de tubo adhesivo puede rotar con el posicionamiento del paciente, dificultando valorar la lateralidad",
          "La intensidad crítica para obtener respuesta no es fija - varía entre pacientes y con la profundidad anestésica"
        ],
        "fuente": ["Urriza 2025"]
      }
    },
    {
      "id": "lar_reflejo_laringeo_aductor",
      "categoria": "LAR",
      "region": "fosa_posterior_tronco",
      "nombre": "LAR - Reflejo laríngeo aductor",
      "estimulacion": {
        "sitio": "Mucosa laríngea (nervio laríngeo superior interno, iSLN) - vía electrodos de superficie integrados en el tubo endotraqueal, en contacto con la mucosa",
        "anestesia_requerida": "TIVA obligatoria (propofol + remifentanilo) - los agentes inhalatorios a >=1 MAC y la lidocaína tópica al 4% sobre la mucosa laríngea suprimen significativamente todos los componentes del LAR",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.15 (Téllez, Ulkatan, Sinclair)"]
      },
      "registro": {
        "electrodo": "Tubo endotraqueal con electrodos de superficie a ambos lados en contacto con las cuerdas vocales derecha e izquierda; verificar el posicionamiento correcto con videolaringoscopio antes de empezar",
        "montajes": "V1/V2 (entre los dos electrodos de una misma cuerda vocal), V1/referencia, V2/referencia (referencia = aguja subcutánea en esternón, tierra subdérmica) - usar el montaje más estable de los tres",
        "configuracion_segun_nervio_en_riesgo": "Si el nervio recurrente laríngeo (NRL) está en riesgo: electrodos de estimulación en el lado contralateral del tubo y registro en el lado ipsilateral al NRL en riesgo (permite registrar componentes cR1/cR2 desde los músculos inervados por el NRL en riesgo). Si el iSLN es el nervio en riesgo (ej. cirugía cervical alta): disposición inversa.",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.15"]
      },
      "notas_clinicas": {
        "componentes": "R1 y R2, cada uno con componente ipsilateral y contralateral (iR1, cR1, iR2, cR2) respecto al lado estimulado",
        "amplitud_normal_cR1": "Media 313.5 +/- 167.4 µV en función laríngea normal; mínimo útil para monitorización fiable 150-200 µV, óptimamente >200 µV",
        "latencia": "Muy variable (22.4 +/- 2.5 ms) - NO es un buen parámetro para predecir lesión nerviosa, a diferencia de la amplitud",
        "criterio_alerta": "Caída de amplitud >50% respecto al basal = posible lesión inminente, avisar al cirujano y liberar tejido. Caída >60% sin recuperación tras liberar tejido = alta probabilidad de disfunción de cuerda vocal/nervio postoperatoria.",
        "ventaja_clinica": "Técnica no invasiva, continua, sin interferir con el campo quirúrgico; permite valorar simultáneamente estructuras aferentes y eferentes del nervio vago; útil en cirugía de tiroides, base de cráneo, ángulo pontocerebeloso y tronco",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.15"]
      }
    },
    {
      "id": "reflejo_trigemino_hipogloso_thr",
      "categoria": "THR",
      "region": "fosa_posterior_tronco",
      "nombre": "THR - Reflejo trigémino-hipogloso (jaw-tongue reflex)",
      "estimulacion": {
        "sitio_v3": "Bajo el arco cigomático, 0.5 cm anterior a la ATM - mismo punto de acceso percutáneo que el H-reflejo del masetero (Godaux y Desmedt)",
        "electrodo_v3": "Par de agujas monopolares aisladas hasta la punta, 18 mm, cátodo y ánodo separados 1.5-2 cm",
        "sitio_v1": "Foramen supraorbitario - cátodo cerca del foramen, ánodo subcutáneo 2 cm por encima",
        "electrodo_v1": "Par de agujas aisladas hasta la punta, 13 mm",
        "parametros_v3_y_v1": "Tren corto de 2-4 pulsos, duración 200-500 µs (el artículo original imprime 'ms' pero es físicamente incompatible con un ISI de 2 ms entre pulsos del mismo tren - casi con toda seguridad es un error tipográfico por 200-500 µs/0.2-0.5 ms; verificar contra el pulso corto habitual de reflejos de tronco antes de programarlo en tu equipo), tasa de repetición 0.4-0.7 Hz, ISI entre pulsos del tren 2 ms",
        "estimulacion_directa_intraoperatoria": "Sonda bipolar concéntrica de mano sobre el nervio trigémino expuesto en el campo quirúrgico (cerca del tronco): estímulo único de 0.2 ms de duración, intensidad máxima 2 mA, tasa 2 Hz",
        "fuente": ["Mirallave Pescador 2022"]
      },
      "registro": {
        "electrodo": "Par de agujas monopolares trenzadas, aisladas hasta la punta, 13 mm, separadas no más de 1 cm (minimiza contaminación por campo lejano/volumen de músculos vecinos)",
        "styloglossus": "Cara postero-lateral de la lengua, tras proteruirla y exponerla mecánicamente con una gasa",
        "genioglosso": "Suelo de la base de la lengua, bajo la masa lingual principal",
        "filtros": "Pasa-alto 30 Hz, pasa-bajo 1000 Hz",
        "barrido": "20 ms/división",
        "lateralidad": "Ipsilateral a la lesión si está lateralizada; bilateral si es medial o el cirujano lo permite",
        "posicion_mandibula": "Bloque de mordida (dos rollos de gasa entre molares) manteniendo los labios separados 2-3 cm, con la mandíbula en posición semiabierta ~45 grados - esta posición favorece la aparición del reflejo jaw-opening frente al jaw-closing",
        "fuente": ["Mirallave Pescador 2022"]
      },
      "notas_clinicas": {
        "patrones": "Jaw-opening THR (activación de styloglosso, músculo retractor) es el patrón ampliamente predominante (31 de 32 lados con respuesta en la serie); Jaw-closing THR (activación de genioglosso, músculo protractor) es muy infrecuente (2 casos)",
        "tasa_de_registro": "THR registrable en 82.1% de los lados (32/39) con estimulación V3",
        "valores_normativos_v3_styloglossus": "Latencia 42.51 +/- 3.85 ms, amplitud 77.64 +/- 70.89 µV (n=31/39 lados). Al cierre de la cirugía: latencia 40.68 +/- 9.62 ms, amplitud 68.43 +/- 63.5 µV, duración 32.38 +/- 18.58 ms (n=25)",
        "valores_normativos_v1_styloglossus": "Latencia 48.65 +/- 14.4 ms, amplitud 67.27 +/- 73.46 µV (n=4/39) - se pudo obtener simultáneamente con el blink reflex al estimular V1",
        "valores_estimulacion_directa_intraoperatoria": "Latencia más corta, 19.1 ms, amplitud 108.15 µV (n=2) - trayecto más corto al estar la estimulación más próxima al tronco",
        "ausente_en": "Neuralgia del trigémino con radiofrecuencia previa (2 pacientes), schwannoma del hipogloso en el lado de la lesión (esperable, vía eferente lesionada), schwannomas vestibulares grandes Koos IV (4 pacientes)",
        "utilidad_diferencial": "Permite distinguir alteración motora de sensitiva de los pares craneales que inervan la cara cuando se pierde solo uno de los reflejos trigeminales (ej. THR preservado con blink reflex perdido, o viceversa) - aporta información que el resto de técnicas de MIO clásicas no cubre",
        "robustez_bajo_anestesia": "Los componentes de latencia larga del THR (y del LAR) persisten bajo anestesia general con mayor robustez que los componentes de latencia larga del blink reflex (R2), que prácticamente nunca son evocables bajo AG - sugiere que la anestesia general no suprime todas las vías polisinápticas por igual",
        "trampas_frecuentes": [
          "La posición de la mandíbula influye en el tipo de respuesta obtenida (jaw-opening vs jaw-closing) - una mandíbula muy cerrada podría favorecer el patrón jaw-closing, infrecuente en la mayoría de posiciones quirúrgicas habituales",
          "La TES para PEM/CoMEP puede generar una respuesta de latencia larga en el styloglosso por fuga de corriente hacia el trigémino, que puede confundirse con una CoMEP central auténtica de origen corticobulbar - diferenciar con el paradigma de tren corto vs estímulo único (si el estímulo único también genera respuesta a intensidad cercana al umbral del tren, sugiere activación periférica del trigémino, no corticobulbar)",
          "Confirmar ausencia de CMAP inmediato tras el artefacto de estímulo (silencio muscular previo a la respuesta de latencia larga) para descartar activación directa del músculo o del nervio hipogloso en vez de un reflejo auténtico"
        ],
        "estado_de_validacion": "Técnica novedosa (primera descripción 2022) - sin criterio de alerta por amplitud validado; los cambios se clasifican como reversibles (recuperan tras pausa quirúrgica) o permanentes. En la serie descrita, pérdidas reversibles ocurrieron sobre todo durante manipulación trigeminal cercana a pares bajos/tronco bajo; pérdidas permanentes se asociaron en parte a profundidad anestésica (burst suppression) y en parte a manipulación/lesión real",
        "fuente": ["Mirallave Pescador 2022"]
      }
    },
    {
      "id": "mapeo_directo_pares_craneales",
      "categoria": "Fosa posterior/tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "Mapeo directo de pares craneales (sonda manual y sonda de succión dinámica)",
      "estimulacion": {
        "sonda": "Monopolar catódica o bipolar/concéntrica (mapeo clásico intermitente); sonda de succión electrificada aislada para mapeo dinámico continuo (técnica reciente)",
        "parametros_mapeo_clasico": "Duración de pulso 0.2 ms, tasa 2-3 Hz",
        "parametros_mapeo_dinamico_continuo": "Duración de pulso 0.3 ms, frecuencia 2 Hz, intensidad 0.05-2 mA",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.23"]
      },
      "registro": {
        "nota": "Mismos músculos/electrodos que CoMEP o EMG libre, según el par craneal que se está mapeando",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.23"]
      },
      "notas_clinicas": {
        "trampas_frecuentes": [
          "El mapeo clásico es intermitente - obliga a pausar la resección y no detecta un nervio cubierto por el tumor",
          "El mapeo dinámico continuo con sonda de succión permite advertencia en tiempo real durante la disección activa, sin pausar la cirugía"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.23"]
      }
    },
    {
      "id": "mapeo_iv_ventriculo_bsm",
      "categoria": "Mapeo del IV ventrículo",
      "region": "fosa_posterior_tronco",
      "nombre": "Mapeo del suelo del IV ventrículo (Brainstem Mapping, BSM) - localización de núcleos motores de pares craneales",
      "estimulacion": {
        "sonda": "Monopolar de punta fina, manual",
        "parametros_alvarez_2023": "Intensidad inicial 1.0 mA, duración de pulso 0.05 ms, tasa de repetición 1.9-3.7 Hz; corriente constante <2.0 mA considerada segura",
        "parametros_moller_alternativos": "Tasa de repetición <=10 pps (mejor 5 pps), duración de pulso corta (50-100 µs); estimulación bipolar puntual descrita en 0.5-2 mA según el caso",
        "protocolo_busqueda": "Mover la sonda en pasos de 1 mm, manteniendo cada punto <5 segundos; bajar la intensidad progresivamente para precisar la localización una vez obtenida respuesta",
        "fuente": ["Álvarez 2023", "Moller cap.14", "Neurophysiology in Neurosurgery 2ed cap.11 (Morota, Deletis, Epstein)"]
      },
      "registro": {
        "CN_VII": "Orbicular oculi, orbicular oris, nasal, mentoniano - colículo facial",
        "CN_XII": "Músculos intrínsecos de la lengua (genioglosos) - trígono del hipogloso, cerca del obex",
        "CN_IX_X": "Pared faríngea posterior; alternativa cricotiroideo o vocalis - área rostrolateral al obex",
        "fuente": ["Álvarez 2023", "Neurophysiology in Neurosurgery 2ed cap.11"]
      },
      "notas_clinicas": {
        "anatomia_referencia": "Colículo facial ~20 mm rostral al obex; CN VI y VII bajo el colículo facial; CN XII bajo el trígono del hipogloso; zona 'segura' suprafacial e infrafacial descrita por Kyoshima (bordes: fascículo longitudinal medial en medial, nervio facial en caudal, pedúnculos cerebelosos en lateral)",
        "patrones_desplazamiento_por_tumor": "Tumores pontinos desplazan el núcleo facial alrededor del borde tumoral; tumores bulbares desplazan los núcleos de pares bajos ventralmente; tumores de la unión cervicomedular los desplazan rostral y lateralmente - orienta la planificación de la incisión",
        "seguridad": "En estudios animales: hipotensión/bradicardia con >2 mA y parada respiratoria con 3 mA de estimulación del suelo del IV ventrículo - máxima cautela con la intensidad, empezar siempre baja",
        "limitaciones": "El BSM localiza el núcleo/raíz intramedular, pero NO garantiza la integridad funcional de todo el trayecto del par craneal (incluido el CBT) ni de componentes sensitivos o reflejos de tronco - combinar con CoMEP, EMG libre y reflejos de tronco",
        "fuente": ["Álvarez 2023", "Neurophysiology in Neurosurgery 2ed cap.11", "Moller cap.14"]
      }
    },
    {
      "id": "c_sep_cortical_directo",
      "categoria": "c-SEP",
      "region": "cirugia_cerebral",
      "nombre": "c-SEP - Monitorización continua mediante registro cortical directo (grid/strip) tras localización por inversión de fase",
      "descripcion": "Una vez localizada S1 mediante phase-reversal (ver pess_fase_reversal_cisura_central) con el electrodo de grid/strip ya colocado, el mismo electrodo puede dejarse in situ para monitorizar el PESS de forma continua y directa desde la corteza durante el resto de la resección, en vez de solo usarse como localización puntual.",
      "estimulacion": {
        "nervio": "El mismo empleado en la localización inicial (habitualmente mediano)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.3"]
      },
      "registro": {
        "caracteristicas": "Registro near-field directo sobre la corteza - alta relación señal-ruido, requiere poco promediado a diferencia del PESS de escalpo. Registro referencial a escalpo/mastoides preferible sobre bipolar.",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.3"]
      },
      "notas_clinicas": {
        "ventaja": "Al ser near-field y de alta amplitud, permite detectar cambios más rápido que el PESS de escalpo convencional durante la resección cercana al área cubierta por el grid",
        "limitacion": "Solo vigila la función del área exacta cubierta por el electrodo - no sustituye al PESS de escalpo para vigilancia global de la vía somatosensorial",
        "trampas_frecuentes": [
          "Patología cerebral previa o malformación puede alterar, reducir u obliterar la respuesta, igual que en la localización inicial"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.3"]
      }
    },
    {
      "id": "ecog",
      "categoria": "ECoG",
      "region": "cirugia_cerebral",
      "nombre": "Electrocorticografía (ECoG)",
      "estimulacion": {
        "nota": "No es una técnica de estimulación propia; actúa como adyuvante de seguridad durante DES (ver mapeo_lenguaje_des y mapeo_cortical_directo_des)"
      },
      "registro": {
        "electrodos": "Tiras (strip) o rejillas (grid) multicontacto (4, 6, 8x32, etc.) colocadas directamente sobre la corteza",
        "montaje": "Bipolar habitual - diferencia de potencial entre electrodos consecutivos, útil para localizar inversiones de fase de las espigas epileptiformes",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.32"]
      },
      "notas_clinicas": {
        "uso_principal_en_mio": "Detección de afterdischarge y crisis durante mapeo de lenguaje/DES - la ausencia de afterdischarge valida la respuesta del paciente durante la tarea; su presencia la invalida y puede escalar a crisis clínica",
        "uso_epilepsia": "Localización de foco epileptógeno mediante análisis visual de espigas e inicio ictal (fuera del foco principal de MIO pero mencionado por completitud, ya que comparte electrodos/técnica)",
        "efecto_anestesicos": "Efecto variable y dependiente de concentración sobre espigas y crisis según el agente - anestesia más superficial suele ser preferible para registro diagnóstico de ECoG",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.32", "Neurophysiology in Neurosurgery 2ed cap.7", "Neurophysiology in Neurosurgery 2ed cap.41"]
      }
    },
    {
      "id": "pev_cortical_via_posterior",
      "categoria": "PEV",
      "region": "cirugia_cerebral",
      "nombre": "PEV cortical (vía visual posterior) - utilidad limitada",
      "estimulacion_registro": {
        "nota": "Mismo flash/LED que en pev_via_anterior; registro sobre corteza occipital directamente (mapeo) o sobre escalpo en Oz (monitorización)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.4"]
      },
      "mapeo_subcortical_radiacion_optica": {
        "descripcion": "En craneotomía despierta, estimulación subcortical de la radiación óptica con evaluación verbal simultánea de la función visual del paciente (Shahar et al.) - la estimulación subcortical puede identificar la localización de la radiación óptica",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.4"]
      },
      "notas_clinicas": {
        "limitacion_principal": "Alta variabilidad espacial de los PEV corticales - la utilidad de la monitorización de la vía posterior se describe explícitamente como limitada en la fuente. En la práctica, la resección tumoral suele completarse según la planificación preoperatoria independientemente de los hallazgos del PEV cortical.",
        "mapeo_vs_monitorizacion": "El mapeo (identificar dónde está la radiación óptica) tiene más utilidad práctica descrita que la monitorización continua de la vía posterior",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.4"]
      }
    },
    {
      "id": "mapeo_cortical_directo_des",
      "categoria": "DES",
      "region": "cirugia_cerebral",
      "nombre": "Mapeo cortical directo por estimulación eléctrica directa (DES) - técnica de Penfield y técnica de tren corto/alta frecuencia",
      "estimulacion": {
        "sonda": "Bipolar (Penfield clásica) o monopolar (técnica de tren corto/alta frecuencia)",
        "parametros_penfield_clasica": "50-60 Hz, pulso rectangular de 1 ms, aplicación de 1-4 s (1 s suele bastar para mapeo motor; 3-4 s para lenguaje/función cognitiva superior)",
        "parametros_tren_corto_alta_frecuencia": "Tren de 5 estímulos monofásicos de 0.5 ms, ISI 4 ms, tasa de repetición 1 Hz (mapeo motor)",
        "polaridad": "Cortical: la corriente anódica es más efectiva, independientemente del paradigma usado. Subcortical: catódica preferible.",
        "tipo_estimulador": "Corriente constante preferible sobre voltaje constante - más seguro y fiable, independiente de la impedancia del tejido",
        "protocolo_practico": "Estimular cada punto al menos 3 veces; nunca el mismo punto 2 veces consecutivas; test control sin estimulación entre estimulaciones (protocolo European Low Grade Glioma Network)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9"]
      },
      "registro": {
        "musculos": "Según el homúnculo motor objetivo",
        "electrodo": "EMG simultáneo de superficie (belly-tendon) o aguja subdérmica (belly-belly) - recomendado para detectar movimientos sutiles o a distancia que podrían pasar desapercibidos",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9"]
      },
      "notas_clinicas": {
        "criterio_seguridad": "Mantener la intensidad por debajo del umbral de afterdischarge; ECoG concurrente recomendada. La técnica clásica 50-60 Hz es sustancialmente más epileptógena que la técnica de tren corto (DCS-MEP).",
        "trampas_frecuentes": [
          "La estimulación 50-60 Hz clásica puede inducir contracción tónica progresiva que dificulta medir el umbral motor con precisión",
          "El tren corto monopolar es más predictivo en corteza motora primaria; la bipolar 50 Hz clásica es más sensible en corteza premotora/área motora suplementaria",
          "Ante afterdischarge o crisis: irrigar con Ringer o suero frío; no reestimular inmediatamente"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9"]
      }
    },
    {
      "id": "mapeo_subcortical_des",
      "categoria": "DES",
      "region": "cirugia_cerebral",
      "nombre": "Mapeo subcortical del tracto corticoespinal (DES catódica, monopolar o bipolar)",
      "estimulacion": {
        "polaridad": "Catódica preferible (independiente del paradigma)",
        "parametros_variables_segun_serie": {
          "kamada": "Catódica, tren de 5, pulso 0.2 ms",
          "nossek": "Catódica, tren de 5-7, pulso 0.5 ms, 300 Hz",
          "ohue": "Catódica, tren de 5, pulso 0.2 ms, 500 Hz",
          "seidel": "Catódica, tren de 5, pulso 0.5 ms, 250 Hz (ISI 4 ms)"
        },
        "protocolo_practico": "Elevar la intensidad en incrementos de 2 mA, repitiendo la estimulación con frecuencia mientras se mapea la trayectoria estimada del tracto (European Low Grade Glioma Network)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9, Tabla 9.2"]
      },
      "registro": {
        "nota": "Mismos músculos/electrodos que PEM/CoMEP, según el tracto que se está mapeando",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9"]
      },
      "notas_clinicas": {
        "regla_practica": "Regla del pulgar ampliamente usada: ~1 mA de umbral equivale a ~1 mm de distancia al tracto corticoespinal (basada en la correlación lineal de Nossek et al., 0.97 mA/mm). Kamada et al. postularon 1.8 mA como umbral de contacto directo con el CST.",
        "correlacion_riesgo_seidel": "Tasa de cambios/pérdida irreversible de PEM cortical según grupo de intensidad de mapeo subcortical: 0% en >20 mA, 0% en 11-20 mA, 10% en 6-10 mA, 10% en 4-5 mA, 20% en 1-3 mA",
        "trampas_frecuentes": [
          "No existe consenso definitivo sobre la relación exacta intensidad-distancia entre estudios - usar la regla de 1 mA = 1 mm como orientación, nunca como valor absoluto",
          "A mayor intensidad de estimulación, mayor el área donde se pueden generar PEM - una respuesta positiva a alta intensidad no localiza con precisión milimétrica"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9"]
      }
    },
    {
      "id": "pess_fase_reversal_cisura_central",
      "categoria": "PESS",
      "region": "cirugia_cerebral",
      "nombre": "Mapeo cortical somatosensorial por inversión de fase (localización de la cisura central)",
      "estimulacion": {
        "nervio": "Nervio mediano (de elección - criterios mejor establecidos y área de mano habitualmente expuesta); alternativa nervio tibial o trigeminal si es necesario",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.3"]
      },
      "registro": {
        "tecnica": "Electrodo en tira o rejilla subdural colocado a través de la presunta cisura central; registro referencial a escalpo/mastoides preferible sobre bipolar (más fácil de interpretar)",
        "criterio_localizacion": "Inversión de fase: N20 posterior a la cisura (negativo) y P20 anterior (positivo) simultáneos; criterio adicional P25 algo más tardío en la cresta de S1; M1 se infiere anterior al electrodo P20",
        "precision_descrita": "~90% de los pacientes en la serie citada",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.3"]
      },
      "notas_clinicas": {
        "ventaja": "Realizable bajo anestesia general, sin necesidad de craneotomía despierta - útil en niños o pacientes frágiles donde el mapeo motor tradicional (Penfield) no es viable",
        "trampas_frecuentes": [
          "Ambigüedad si el electrodo cae justo sobre la cisura central o lejos del área de mano - puede requerir reposicionar la rejilla",
          "Patología cerebral previa o malformación puede alterar, reducir u obliterar la respuesta"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.3"]
      }
    },
    {
      "id": "mapeo_lenguaje_des",
      "categoria": "DES",
      "region": "craneotomia_despierta",
      "nombre": "Mapeo de lenguaje y funciones cognitivas mediante DES (baja frecuencia y alta frecuencia)",
      "estimulacion": {
        "tecnica_baja_frecuencia_lf": "Bifásica, 0.5 ms de duración, ISI 20 ms (50-60 Hz), sonda bipolar (puntas separadas 5 o 10 mm) - paradigma tradicional",
        "tecnica_alta_frecuencia_hf": "Monofásica, 0.5 ms, tren de 5 estímulos, ISI 4 ms, sonda monopolar; tasa de repetición 1 Hz para mapeo motor o 3 Hz para mapeo de lenguaje - no superar 3 Hz (aumenta riesgo de crisis sin mejorar la técnica)",
        "corriente_de_trabajo_protocolo_us": "Incrementos de 0.5 mA desde 2 mA hasta afterdischarge en ECoG (ECoG obligatoria); rango habitual resultante 3.5-15 mA; tasa de crisis inducidas 2-25%",
        "corriente_de_trabajo_protocolo_europeo": "Incrementos de 0.5 mA desde 2 mA hasta anartria/interferencia clara en tarea de nombrar, sin buscar afterdischarge; rango habitual resultante 2-5.5 mA; tasa de crisis inducidas 0.5-5%",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.7"]
      },
      "registro": {
        "tareas": "Nombrar objetos/acciones/personas famosas, cuenta, asociación semántica - según el lóbulo explorado",
        "criterio_sitio_elocuente": "Error reproducible en al menos 3 estimulaciones no consecutivas",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.7"]
      },
      "notas_clinicas": {
        "manejo_crisis": "Irrigación con suero frío (Ringer o NaCl isotónico); si no cede, bolo de propofol (0.5-1 mL); no reestimular inmediatamente tras una crisis",
        "trampas_frecuentes": [
          "Estimulación cortical: aplicar cada 2 items, nunca el mismo sitio 2 veces consecutivas, para reducir el riesgo de afterdischarge",
          "Mapeo subcortical: se usa la misma intensidad de corriente establecida en el mapeo cortical; solo los sitios con error reproducible en presencia de ECoG silente (si disponible) se consideran fiables",
          "La técnica HF genera menos crisis que la LF - preferible en pacientes con antecedente de crisis, radioterapia previa, o alta carga de antiepilépticos"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.7"]
      }
    },
    {
      "id": "nap_cnap_nervio_periferico",
      "categoria": "Plexo braquial / nervio periférico",
      "region": "plexo_periferico",
      "nombre": "Potencial de acción nervioso compuesto (CNAP/NAP) - registro directo intraoperatorio",
      "estimulacion": {
        "distancia_electrodos": "Mínimo 4 cm entre estimulación y registro (posible pero con más artefacto de estímulo); preferible 8-10 cm",
        "parametros": "Pulsos de 0.02 ms de duración, intensidad 6-8 V (aprox. 3-5 mA), aplicados habitualmente en el extremo proximal del segmento a estudiar",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.30 (Kline)"]
      },
      "registro": {
        "sensibilidad_inicial": "200-500 (uV)/cm, aumentando progresivamente hasta 10 (uV)/cm si no hay respuesta visible",
        "ventana_tiempo": "0.5-1 ms/cm",
        "electrodo": "Aguja o gancho (hook) percutáneo o en contacto directo con el nervio",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.30 (Kline)"]
      },
      "notas_clinicas": {
        "criterios_cnap_valido": "Fijo/'congelado' en la pantalla con estimulación repetitiva (phase-locked al estímulo); amplitud siempre <2 mV (una respuesta >2 mV es más probablemente un potencial de acción muscular, no un CNAP nervioso puro)",
        "interpretacion": "La presencia de CNAP en un segmento con pérdida funcional completa preoperatoria orienta a neurolisis (recuperación descrita en 93-94% de series históricas); la ausencia de CNAP orienta a resección y reparación/injerto",
        "trampas_frecuentes": [
          "No promediar de entrada - el promediado puede detectar fibras finas residuales sin significado funcional y dar una falsa impresión de continuidad",
          "Estimulación distal con registro proximal reduce el tamaño del CNAP por fibras 'enterradas' que se suman al nervio proximalmente sin haber sido estimuladas"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.30 (Kline)"]
      }
    },
    {
      "id": "pess_troncos_cordones_plexo",
      "categoria": "Plexo braquial / nervio periférico",
      "region": "plexo_periferico",
      "nombre": "PESS para monitorización del plexo braquial (troncos/cordones)",
      "estimulacion": {
        "nervio": "Nervio mediano o cubital en muñeca, según el segmento del plexo en riesgo",
        "fuente": ["Moller cap.6"]
      },
      "registro": {
        "sitio_clave": "Punto de Erb - refleja la conducción neural proximal al punto de estimulación (plexo braquial); complementa el registro cortical estándar C3'/C4'-Fz",
        "indicacion_especifica": "Registrar PESS también durante el posicionamiento del paciente en cirugías con brazo/hombro en riesgo (las lesiones de plexo por posicionamiento son relativamente frecuentes) - no exclusivo de cirugía de plexo propiamente dicha",
        "fuente": ["Moller cap.6"]
      },
      "notas_clinicas": {
        "limitacion": "El PESS solo evalúa la vía sensitiva del nervio mixto; si se necesita valorar también la vía motora, complementar con respuesta muscular a estimulación del nervio mixto o con EMG estimulado/libre en músculos diana",
        "trampas_frecuentes": [
          "La amplitud al final de la cirugía como medida pronóstica de lesión debe interpretarse con cautela - no distingue lesión temporal de permanente"
        ],
        "fuente": ["Moller cap.6"]
      }
    },
    {
      "id": "emg_libre_estimulado_periferico",
      "categoria": "Plexo braquial / nervio periférico",
      "region": "plexo_periferico",
      "nombre": "EMG libre y estimulado en cirugía de nervio periférico",
      "estimulacion_y_registro": {
        "nota": "Los principios técnicos (filtros, modo free-run, criterios de patrón tónico vs breve) son análogos a los ya descritos en emg_libre_espinal y emg_estimulado_tornillo_pedicular de este mismo documento. No se ha localizado en las fuentes del proyecto un protocolo específico y distinto para nervio periférico más allá de esa analogía.",
        "fuente": []
      },
      "notas_clinicas": {
        "diferencia_clave": "En cirugía de plexo/nervio periférico el objetivo suele ser identificar el nervio (mapeo) más que solo vigilar irritación - combinar con NAP/CNAP (ver entrada nap_cnap_nervio_periferico) para la decisión de neurolisis vs resección-injerto",
        "fuente": []
      }
    },
    {
      "id": "prm_reflejo_raiz_posterior",
      "categoria": "PRM",
      "region": "plexo_periferico",
      "nombre": "PRM - Posterior Root-Muscle reflex",
      "estimulacion": {
        "contexto_investigacion_SCS": "Estimulación epidural o transcutánea de la médula espinal lumbosacra (fibras aferentes propioceptivas de raíces posteriores L1-S2) - contexto de investigación en rehabilitación/lesión medular",
        "contexto_quirurgico_practico": "Ver protocolo combinado con ARM en la entrada arm_respuesta_raiz_anterior (mismo estímulo, mismo montaje) - dos estímulos idénticos con ISI 50 ms; si el segundo estímulo NO genera respuesta = PRM puro",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.18 (Minassian)", "Neurophysiology in Neurosurgery 2ed cap.31"]
      },
      "registro": {
        "musculos": "Recto femoral, bíceps femoral, tibial anterior, sóleo - electrodos de superficie bipolares",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.18"]
      },
      "notas_clinicas": {
        "fisiologia": "Comparte características con el H-reflejo (depresión post-activación, morfología EMG similar) pero con reclutamiento transináptico de una proporción mayor del pool de motoneuronas - permite valorar más músculos simultáneamente",
        "latencia_relativa_h_reflejo": "La latencia del PRM de sóleo es ~63% de la latencia del H-reflejo de sóleo (por sitio de estimulación más proximal)",
        "ventaja": "Registro en tiempo real de barrido único (sin promediado) da feedback inmediato al cirujano; útil para valorar la integridad del plexo lumbosacro, raíces y nervios periféricos de MMII simultáneamente, incluido el nervio femoral (difícil de monitorizar por otros medios)",
        "aplicacion_descrita": "Caso de cirugía de nervio periférico (ciático) donde el PEM mostró fade anestésico pero el PRM permaneció estable, dando confianza al cirujano para continuar",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.18", "Neurophysiology in Neurosurgery 2ed cap.31"]
      }
    },
    {
      "id": "arm_respuesta_raiz_anterior",
      "categoria": "ARM",
      "region": "plexo_periferico",
      "nombre": "ARM - Anterior Root Muscle response (ARMR)",
      "estimulacion": {
        "electrodo": "Superficie autoadhesiva rectangular 8x4 cm, o par de electrodos disco pequeños (2.2x3 cm) conectados como electrodo único",
        "montaje": "Dorsoventral - cátodo en la espalda, sobre la proyección cutánea del espacio interespinoso L1-L3; ánodo sobre el abdomen (ombligo, o a ambos lados)",
        "parametros": "Dos estímulos idénticos, ISI 50 ms, duración de cada estímulo 0.5-1 ms",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.31"]
      },
      "registro": {
        "musculos": "Mismos que PRM (recto femoral, bíceps femoral, tibial anterior, sóleo), electrodos de superficie bipolares",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.31"]
      },
      "notas_clinicas": {
        "diferenciacion_prm": "Si el SEGUNDO estímulo (a los 50 ms) SÍ genera respuesta = ARM (la vía motora ya no está en periodo refractario tras el primer estímulo); si NO genera respuesta = es PRM puro",
        "fundamento": "El periodo refractario absoluto de la vía del PRM es de ~50 ms en humanos - por eso se usa ese intervalo para distinguir ambas respuestas con el mismo par de estímulos",
        "objetivo": "Valorar de forma diferenciada la vía motora (raíz anterior) de la vía refleja (raíz posterior) con el mismo montaje de estimulación",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.31 (contexto: cirugía de osteotomía periacetabular y nervio periférico)"]
      }
    },
    {
      "id": "mapeo_nervio_periferico",
      "categoria": "Mapeo de nervio periférico",
      "region": "plexo_periferico",
      "nombre": "Mapeo de nervio periférico (trayecto, ramas y fascículos)",
      "estimulacion": {
        "trayecto_general": "Sonda manual de mapeo desplazada a lo largo del trayecto sospechado del nervio, de forma análoga al mapeo de pares craneales (ver mapeo_directo_pares_craneales)",
        "protocolo_detallado_nervio_facial_extracraneal": "Ejemplo de protocolo completo (mapeo transcutáneo del nervio facial extracraneal): sonda monopolar de bola no estéril como cátodo, aguja subdérmica sobre la apófisis mastoides como ánodo; estímulo único a 1 Hz, duración 200 µs, intensidad 1-40 mA; ganancia baja (100-200 µV) con barrido de 30-40 ms para detectar el umbral mínimo de una rama concreta (a diferencia de la monitorización, que usa ganancia de milivoltios con intensidad supramáxima)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.24 (mapeo facial extracraneal, ejemplo detallado)", "Neurophysiology in Neurosurgery 2ed cap.14 (Moller, principio general)"]
      },
      "registro": {
        "musculos": "Músculos diana según el nervio (ejemplo facial: orbicular oculi, orbicular oris, nasal, mentoniano, frontal) - electrodos de aguja subdérmica",
        "identificacion_fascicular_intraneural": "La técnica de CNAP (ver nap_cnap_nervio_periferico) permite además probar fascículos individuales que entran/salen de tumores intraneurales, diferenciando fascículos funcionantes de no funcionantes durante la disección",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.24", "Neurophysiology in Neurosurgery 2ed cap.30"]
      },
      "notas_clinicas": {
        "verificacion_previa": "Antes de mapear, comprobar que el bloqueo neuromuscular se ha eliminado completamente (relajante residual puede simular un nervio no funcionante) - estimular el tronco principal a intensidad supramáxima (ej. 20 mA) y verificar la amplitud de CMAP esperada antes de iniciar el mapeo distal",
        "trampas_frecuentes": [
          "Anestesia local inyectada por error cerca del nervio por el cirujano puede simular ausencia de respuesta",
          "Un nervio neuropático por cirugía previa también reduce la amplitud sin significar sección completa"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.24"]
      }
    },
    {
      "id": "eeg",
      "categoria": "EEG",
      "region": "general",
      "nombre": "Electroencefalograma (EEG) intraoperatorio",
      "estimulacion": {
        "nota": "Técnica pasiva, registro de actividad espontánea cortical"
      },
      "registro": {
        "montaje": "Sistema internacional 10-20; ejemplo de 8 canales en contexto de cirugía de fosa posterior/IV ventrículo (Álvarez 2023)",
        "filtros": "0.5-70 Hz (Álvarez 2023)",
        "sensibilidad": "50-100 µV/división",
        "barrido": "1000 ms/división",
        "fuente": ["Álvarez 2023"]
      },
      "notas_clinicas": {
        "criterios_isquemia_endarterectomia": "Caída de amplitud >60% o pérdida completa de señal = signo de alarma de reducción de perfusión. Enlentecimiento general de frecuencias, incremento de actividad delta (0-4 Hz), o reducción >50% de la actividad rápida de fondo = marcadores adicionales de isquemia.",
        "burst_suppression": "Usado como medida de profundidad anestésica y como medida neuroprotectora con barbitúricos; vigilar la hipotensión concurrente, que puede confundir la interpretación de la señal",
        "indicaciones": "Endarterectomía carotídea, cirugía de aneurismas, cualquier procedimiento con riesgo de isquemia cortical global, detección de crisis (ej. durante cirugía del IV ventrículo)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.25 (endarterectomía carotídea)", "Neurophysiology in Neurosurgery 2ed cap.21 (aneurismas, burst suppression)", "Álvarez 2023"]
      }
    },
    {
      "id": "pev_via_anterior",
      "categoria": "PEV",
      "region": "general",
      "nombre": "Potenciales evocados visuales (PEV) - vía visual anterior",
      "estimulacion": {
        "tipo": "Flash de alta intensidad (estroboscopio o LEDs); goggles con LED de alta intensidad preferibles sobre lente de contacto (menor riesgo corneal) o luz roja transmitida a través de los párpados cerrados",
        "color_de_luz": "Verde preferible sobre rojo en cirugías largas - la luz roja provoca adaptación progresiva a la oscuridad del ojo, que puede confundirse con un cambio patológico",
        "fuente": ["Moller cap.8", "Neurophysiology in Neurosurgery 2ed cap.4"]
      },
      "registro": {
        "scalp": "Cz y Oz",
        "filtros": "Pasa-alto 5 Hz, pasa-bajo 500 Hz",
        "canal_retino": "Canal de electrorretinograma (ERG) registrado simultáneamente al PEV para confirmar que el estímulo luminoso llega correctamente a la retina de cada ojo (verificación pre-retiniana). Referenciar ojo izquierdo contra ojo derecho es coherente con el fundamento descrito en la fuente (la verificación de entrega de luz mediante ERG mejoró la capacidad predictiva del PEV del 60% al 100%), aunque el montaje electrodo-a-electrodo específico no está detallado en las fuentes del proyecto - queda registrado como aportación de experiencia clínica propia, no de la bibliografía.",
        "mapeo_via_anterior_ONAP": "Alternativa de mapeo (no solo monitorización): registro directo del nervio óptico (ONAP, potencial de acción del nervio óptico) con electrodo de bola",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.4", "Moller cap.8"]
      },
      "notas_clinicas": {
        "indicaciones": "Resección de lesiones intraorbitarias, paraselares, y corticales adyacentes a la vía óptica",
        "criterio_alerta": "PEV plano = indicador de alteración visual postoperatoria grave (típicamente pérdida de agudeza visual, con o sin afectación del campo)",
        "limitaciones": "Agudeza visual preoperatoria <0.03 impide un registro fiable. Falso negativo posible: el paciente puede despertar con un defecto campimétrico leve sin cambio en el PEV. Falso positivo posible: cambios intraoperatorios sin déficit postoperatorio, descritos durante manipulación del quiasma e hipotensión.",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.4"]
      }
    }
  ]
};
