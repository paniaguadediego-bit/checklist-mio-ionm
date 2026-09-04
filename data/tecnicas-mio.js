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
 * PESS trigeminal). 22 técnicas en total.
 *
 * Un lote nuevo se añade empujando más objetos al array "tecnicas" de abajo,
 * con el mismo formato -no hace falta tocar app.js, que agrupa por el campo
 * "region" de cada técnica sea cual sea (las etiquetas legibles de región
 * están en TECMIO_REGIONES, ahí sí hay que añadir la región nueva a mano).
 */
window.TECNICAS_MIO = {
  "esquema_version": "1.0",
  "generado": "2026-09-03",
  "notas_meta": {
    "principio_fuentes": "Cada parametro cuantitativo incluye su fuente. Cuando dos fuentes difieren, se muestran ambos valores explicitamente (nunca promediados ni combinados). Los campos sin dato verificado en las fuentes del proyecto se marcan como 'no especificado en fuentes'.",
    "convencion_claves": "snake_case sin acentos ni espacios, consistente con la convencion Notion de Pani.",
    "lote_actual": "Lote 1: Columna/medula espinal (6) + Fosa posterior/tronco - evocados y EMG (5) = 11. Lote 2: Craneotomia despierta (4) + Plexo braquial/nervio periferico (3) + Reflejos de tronco adicionales (4) = 11. Total 22 entradas, todas trazadas a fuente.",
    "categorias_pendientes_siguiente_lote": [
      "Variantes anestesicas especificas por tecnica (TIVA vs halogenados) - de momento solo aparecen como nota clinica puntual, no como campo estructurado propio",
      "emg_libre_estimulado_periferico queda como entrada de remision (sin protocolo especifico propio localizado en fuentes) - revisar si Pani tiene protocolo clinico propio que aportar como fuente",
      "Posibles ampliaciones futuras si Pani las pide: laryngeal adductor reflex (LAR), reflejo trigemino-hipogloso, mapeo con sonda de succion aplicado a columna (Gandhi et al., ya referenciado parcialmente en pess_troncos/onda_d)"
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
        "electrodo": "Superficie o subdermico",
        "parametros": {
          "intensidad_mA": {
            "costa_2015": "14-40 (individualizada segun amplitud de respuesta)",
            "alvarez_2023": "40-100"
          },
          "duracion_pulso_ms": "0.2-0.3 (MacDonald 2019 ISION)",
          "frecuencia_hz": {
            "macdonald_2019_ision": "~4.7-5.1 (evitar divisores exactos de 50/60 Hz para no coincidir con artefacto de red)",
            "alvarez_2023": "3.7",
            "costa_2015": "7.1"
          },
          "modo": "Corriente constante preferible. Interleaving izq-dcha recomendado para acelerar adquisicion (MacDonald 2019 ISION)."
        },
        "fuente": ["Costa 2015", "MacDonald 2019 ISION", "Alvarez 2023"]
      },
      "registro": {
        "sitio_cortical": "Cz'-Fz (o CPz-Fz); electrodo de aguja EEG",
        "sitio_subcortical": "Hueco popliteo (fosa poplitea)",
        "montaje": "10-20 internacional; considerar derivaciones optimizadas ISION",
        "nota_tecnica": "Si la onda P40 esta ausente o es de baja amplitud, desplazar el electrodo de registro ~2 cm lateralmente hacia el lado contralateral a la estimulacion",
        "fuente": ["Moller cap.6", "Boaro 2026", "Certificacion Repertorio FEA"]
      },
      "filtros": {
        "pasa_alto_hz": { "analogico_moller": "1-5", "ision_scalp": "30" },
        "pasa_bajo_hz": { "cortical_estandar": "125-250", "si_P14_16_relevante": "500-1000", "ision_scalp": "300" },
        "pasa_alto_periferico_hz": "0.2 (fosa poplitea/cubital, ISION)",
        "pasa_bajo_periferico_hz": "1000 (ISION)",
        "notch": "Desactivado (evita ringing/artefacto de anillo que puede simular o distorsionar el PESS)",
        "fuente": ["Moller cap.6", "Toleikis 2024 ASNM", "MacDonald 2019 ISION"]
      },
      "barrido": {
        "tiempo_analisis_ms": { "MMII": "80-100", "MMSS_referencia_cruzada": "40-50" },
        "promediado_n": "No hay numero fijo recomendado; promediar hasta reproducibilidad media-alta. Costa 2015 uso 100-200 barridos.",
        "tasa_muestreo_hz": ">=2000 con LP 500Hz; preferible 5000-10000",
        "fuente": ["Moller cap.6", "MacDonald 2019 ISION", "Costa 2015"]
      },
      "notas_clinicas": {
        "criterio_alerta": "Clasico: caida de amplitud >50% y/o aumento de latencia >10%. MacDonald 2019 ISION propone criterios adaptativos basados en clase de reproducibilidad en lugar de umbral fijo.",
        "trampas_frecuentes": [
          "Vias somatosensoriales no cruzadas en HGPPS (sindrome de paralisis de mirada horizontal con escoliosis progresiva) - requiere colocacion de electrodo distinta",
          "El PESS no valora la via motora de forma aislada - riesgo de falso negativo si la lesion es puramente corticoespinal",
          "Sensible a hipotension, hipotermia y dosis altas de anestesicos halogenados"
        ],
        "fuente": ["Moller cap.6", "Boaro 2026", "Certificacion Repertorio FEA"]
      }
    },
    {
      "id": "pess_mediano_cubital",
      "categoria": "PESS",
      "region": "columna_medula",
      "nombre": "PESS de nervio mediano / cubital (MMSS)",
      "estimulacion": {
        "sitio": "Nervio mediano en muneca; nervio cubital en muneca o codo",
        "electrodo": "Superficie o subdermico",
        "parametros": {
          "intensidad_mA": "40 (Boaro 2026, ejemplo estandar)",
          "duracion_pulso_ms": "0.2",
          "frecuencia_hz": "4.3 (Boaro 2026); mismo rango 4.7-5.1 recomendado por MacDonald 2019 ISION aplica por analogia",
          "modo": "Corriente constante"
        },
        "fuente": ["Boaro 2026", "MacDonald 2019 ISION"]
      },
      "registro": {
        "sitio_cortical": "C3'/C4'-Fz (contralateral a la estimulacion)",
        "sitio_subcortical": "Punto de Erb (plexo braquial)",
        "montaje": "10-20 internacional; canales clasicos Cz'-Fz (pierna), C3'/C4'-Fz (brazo)",
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
        "promediado_n": "Hasta reproducibilidad media-alta (sin numero fijo)",
        "fuente": ["Moller cap.6", "MacDonald 2019 ISION"]
      },
      "notas_clinicas": {
        "criterio_alerta": "Igual que PESS tibial: caida de amplitud >50% y/o aumento de latencia >10% (criterio clasico)",
        "trampas_frecuentes": [
          "Menos sensible a isquemia de territorio de arteria espinal anterior que MMII en cirugia toracica - complementar con onda D/PEM"
        ],
        "fuente": ["Boaro 2026"]
      }
    },
    {
      "id": "pem_tces_miogenico",
      "categoria": "PEM",
      "region": "columna_medula",
      "nombre": "PEM/TcMEP miogenico por estimulacion electrica transcraneal (TES)",
      "estimulacion": {
        "sitio_montajes": {
          "hemisferico_C3_Cz_C4_Cz": "Testeo de decusacion; MEP facial y de brazo; respuesta mayormente unilateral",
          "interhemisferico_C1_C2": "MEP de brazo y pierna; respuesta asimetrica; penetracion moderada",
          "interhemisferico_C3_C4": "MEP de brazo y pierna; respuesta asimetrica pero mas potente; penetracion profunda",
          "linea_media_Cz-1_Cz+6": "MEP de pierna; respuesta simetrica; penetracion moderada"
        },
        "electrodo": "Tornillo tipo corkscrew subdermico",
        "parametros": {
          "tren_pulsos": "3-8 pulsos (3-5 habitual; 6-8 solo para protocolo especifico de MEP polifasicos largos, Quinones-Hinojosa 2005, no estandarizado)",
          "duracion_pulso_ms": "0.5",
          "isi_ms": "2-4 tipico (rango efectivo 1-10; optimo 1-2 ms segun Moller cap.10); interpulse 2-4ms = 250-500Hz intratren",
          "intensidad": "Individualizada por umbral motor de cada musculo; se ajusta con la profundidad anestesica",
          "tipo_estimulador": "Voltaje constante es lo mas usado historicamente; corriente constante preferible para estimulacion intracraneal directa"
        },
        "fuente": ["Legatt 2016 ACNS", "MacDonald 2013 ASNM", "Moller cap.10"]
      },
      "registro": {
        "musculos_habituales": "Tenar/aductor del quinto dedo (MMSS); tibial anterior/abductor hallucis (MMII) - seleccionar segun objetivo quirurgico",
        "electrodo": "Par de agujas intramusculares (belly-tendon o par de agujas)",
        "fuente": ["MacDonald 2013 ASNM"]
      },
      "filtros": {
        "pasa_alto_hz": "no especificado en fuentes del proyecto para PEM miogenico especificamente",
        "pasa_bajo_hz": "no especificado en fuentes del proyecto para PEM miogenico especificamente",
        "fuente": []
      },
      "barrido": {
        "ventana_registro_ms": "100 (habitual para CMAP miogenico, por analogia con protocolo ARMR/PRMR de Neurophysiology in Neurosurgery cap.31)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.31"]
      },
      "notas_clinicas": {
        "criterio_alerta": "No existe umbral de amplitud universal validado (ver principio ya establecido en memoria de trabajo). MacDonald 2013 ASNM no fija un valor unico de corte de amplitud.",
        "trampas_frecuentes": [
          "Anestesia inhalatoria a dosis altas suprime la respuesta - preferir TIVA para PEM",
          "El bloqueo neuromuscular debe controlarse con train-of-four; relajacion excesiva suprime o distorsiona la respuesta",
          "El criterio de simplificacion morfologica tiene validacion de un unico estudio con protocolo no estandar (Quinones-Hinojosa 2005) - no aplicar como criterio general"
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
        "sitio": "Espacio epidural, electrodos craneal y caudal (misma via de acceso que TES para PEM)",
        "parametros": {
          "tipo_estimulo": "Estimulo unico",
          "duracion_pulso_us": "300",
          "tasa_hz": "3",
          "intensidad_mA": "Ajustada segun aparicion de respuesta cortical (scalp); no superar 30 mA"
        },
        "fuente": ["Costa 2015"]
      },
      "registro": {
        "montaje": "Electrodos 1-2 (activo-referencia) para el electrodo rostral y 2-1 para el caudal, buscando igual polaridad en ambos registros; si no es factible, usar montajes 2 vs 3 (craneal) y 3 vs 2 (caudal)",
        "fuente": ["Costa 2015"]
      },
      "filtros": {
        "rango_hz": "200/500 a 3000 (tipico para D-wave/e-MEP)",
        "fuente": ["Costa 2015"]
      },
      "barrido": {
        "tiempo_analisis_ms": "10 o 20",
        "promediado_n": "Habitualmente respuesta de barrido unico legible; si es necesario, promediar 4-10 respuestas para mejorar SNR",
        "fuente": ["Costa 2015"]
      },
      "notas_clinicas": {
        "criterio_alerta": "Caida de amplitud >50% respecto al basal (criterio ASNM MacDonald 2013)",
        "trampas_frecuentes": [
          "No permite lateralizacion - registra actividad combinada de ambos hemicordones (principio ya validado en memoria de trabajo)",
          "No es apropiada para detectar lesiones que afecten a la medula baja distal al electrodo de registro",
          "Se atenua muy poco con farmacos anestesicos - es el componente mas robusto frente a anestesia, pero no detecta isquemia pura de motoneurona espinal"
        ],
        "fuente": ["Costa 2015", "Certificacion Repertorio FEA"]
      }
    },
    {
      "id": "emg_libre_espinal",
      "categoria": "EMG",
      "region": "columna_medula",
      "nombre": "EMG libre continuo (raices nerviosas espinales)",
      "estimulacion": {
        "nota": "Tecnica pasiva, sin estimulo aplicado"
      },
      "registro": {
        "musculos": "Miotomas correspondientes a las raices en riesgo. Para L2-S2: vasto medial, tibial anterior, peroneo largo, gastrocnemio medial",
        "electrodo": "Aguja insertada en el punto motor del musculo (activo); referencia sobre tendon o hueso",
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
        "tiempo_barrido_s": "1 (tipico)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.13 (Toleikis)"]
      },
      "notas_clinicas": {
        "criterio_alerta": "Descargas tonicas/neurotonicas sostenidas (>1 s) indican irritacion o dano radicular; brotes breves (<1 s) coincidiendo con manipulacion mecanica habitualmente no son significativos",
        "trampas_frecuentes": [
          "Requiere bloqueo neuromuscular parcial (al menos 1 de 4 respuestas en train-of-four); la relajacion excesiva enmascara la actividad",
          "La seccion completa de un nervio puede NO producir respuesta EMG - falso negativo conocido"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.13", "Certificacion Repertorio FEA"]
      }
    },
    {
      "id": "emg_estimulado_tornillo_pedicular",
      "categoria": "EMG",
      "region": "columna_medula",
      "nombre": "EMG estimulado (evaluacion de tornillo/broca pedicular)",
      "estimulacion": {
        "sitio": "Tornillo o broca pedicular (catodo, pinza de cocodrilo esterilizada) frente a electrodo dispersivo sobre el hombro posterior (anodo) - estimulacion monopolar",
        "parametros": {
          "tipo": "Corriente constante preferible sobre voltaje constante (menor variabilidad, ver nota de shunting mas abajo)",
          "duracion_pulso_ms": "0.2",
          "tasa_hz": "1-3 (evitar tasas >1 Hz si hay bloqueo neuromuscular parcial, por decremento del CMAP entre estimulos)"
        },
        "fuente": ["Leppanen 2005/2006 ASNM", "Moller cap.10"]
      },
      "registro": {
        "musculos": "Mismos miotomas que EMG libre, por encima y por debajo del pediculo testado",
        "fuente": ["Leppanen 2005/2006 ASNM"]
      },
      "umbrales_referencia": {
        "umbral_alarma_mas_usado_mA": "<=10 (Calancie et al.; ampliamente adoptado como warning threshold)",
        "rangos_alternativos_publicados_mA": "<6, <4, <11 segun la serie (resumidos en Leppanen 2005/2006)",
        "valores_normales_sin_brecha_mA": {
          "tornillo": "media 24.0 (rango 9.0-60.0, SD 11.9)",
          "broca": "media 30.4 (rango 8.5-53.0, SD 13.9)"
        },
        "aplicabilidad": "Validado para columna toracolumbar. Sin validacion especifica para C1-C2 en las fuentes del proyecto (gap ya identificado en memoria de trabajo).",
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
          "El shunting por fluido/irrigacion eleva falsamente el umbral (riesgo de falso negativo) - retirar irrigacion antes de testear",
          "Relajacion neuromuscular excesiva (menos del 4o twitch en TOF) eleva artificialmente el umbral - verificar TOF antes de interpretar un umbral alto como normal",
          "Tejido cicatricial de cirugia previa puede elevar el umbral basal de forma inespecifica",
          "Ante duda, comparar el umbral del tornillo con el umbral de estimulacion directa de la raiz visible en el campo (tecnica de control)"
        ],
        "fuente": ["Leppanen 2005/2006 ASNM", "Moller cap.10", "Toleikis cap.13"]
      }
    },
    {
      "id": "peatc_baep",
      "categoria": "Fosa posterior/tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "PEATC / BAEP (potenciales evocados auditivos de tronco)",
      "estimulacion": {
        "sitio": "Via auricular de insercion, bilateral",
        "tipo_estimulo": "Clicks de rarefaccion o de condensacion - NO usar clicks alternantes (la mezcla de polaridades distorsiona la respuesta, sobre todo con hipoacusia)",
        "parametros": {
          "clinico_alvarez_2023": "90 dB, 11.3 Hz",
          "ejemplo_laboratorio_moller": "105 dB PeqSPL, 21 pps (ejemplo de referencia, no necesariamente el ajuste clinico habitual en quirofano)"
        },
        "fuente": ["Alvarez 2023", "Moller cap.5"]
      },
      "registro": {
        "montaje": "Vertex (Cz) frente a lobulo de la oreja o mastoides ipsilateral; alternativa vertex frente a nuca dorsal alta",
        "fuente": ["Moller cap.5"]
      },
      "filtros": {
        "rango_hz": { "moller_cap5_ejemplo": "10-3000", "alvarez_2023_clinico": "100-2000" },
        "nota_tecnica": "Preferibles filtros digitales zero-phase FIR sobre analogicos: evitan la distorsion de fase que puede desplazar o invertir picos",
        "fuente": ["Moller cap.5", "Alvarez 2023"]
      },
      "barrido": {
        "tiempo_analisis_ms": "15 (Alvarez 2023, ajuste clinico en quirofano) - verificar en el equipo Cadwell, ya que es un margen ajustado para picos I-V (~6-8ms de latencia de V)",
        "promediado_n": "Hasta 2000-4096 barridos segun amplitud/ruido (Moller cap.5)",
        "fuente": ["Alvarez 2023", "Moller cap.5"]
      },
      "notas_clinicas": {
        "criterio_alerta": "Perdida de onda III y/o V, o aumento de latencia interpico I-III o III-V, o aumento de latencia absoluta de V >1.0 ms",
        "localizacion_por_onda": "I-II: nervio auditivo distal/proximal; III: nucleo coclear/oliva superior; IV: lemnisco lateral contralateral; V: coliculo inferior contralateral",
        "trampas_frecuentes": [
          "Perdida irreversible de todas las ondas se asocia a hipoacusia postoperatoria; recuperacion antes de finalizar la cirugia se asocia a audicion preservada"
        ],
        "fuente": ["Alvarez 2023"]
      }
    },
    {
      "id": "comep_pares_craneales",
      "categoria": "Fosa posterior/tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "CoMEP - potenciales motores corticobulbares por TES (pares craneales motores)",
      "estimulacion": {
        "sitio_montaje": "C3(+)-Cz(-) para hemisferio izquierdo / C4(+)-Cz(-) para hemisferio derecho (Deletis). Alternativa: C5(+)-Cz(-) / C6(+)-Cz(-) (Verst et al.) - mas efectiva pero con mas movimiento por posible componente periferico.",
        "parametros": {
          "tren": "3-5 estimulos de 0.5 ms de duracion, ISI 2 ms, tasa de repeticion del tren 2 Hz",
          "intensidad_mA": "50-150 (hasta 200 excepcionalmente)",
          "protocolo_diferenciacion_central_vs_periferico": "Estimulo unico adicional a los mismos electrodos, 90 ms despues del tren corto. Si el estimulo unico tambien genera respuesta bajo anestesia general, se considera de origen periferico (propagacion distal de corriente), no corticobulbar central."
        },
        "fuente": ["Deletis & Fernandez-Conejero (J Clin Neurol)", "Neurophysiology in Neurosurgery 2ed cap.10", "Intraoperatients.pdf (serie FCoMEP)"]
      },
      "registro": {
        "musculos": "Orbicular oculi, nasal, orbicular oris, mentoniano (facial); segun objetivo tambien velo del paladar, lengua, musculos laringeos para otros pares craneales motores",
        "electrodo": "Par de electrodos hook-wire (menor captacion de respuestas de campo lejano de musculos vecinos que la aguja convencional)",
        "fuente": ["Intraoperatients.pdf", "Neurophysiology in Neurosurgery 2ed cap.10"]
      },
      "filtros": {
        "rango_hz": "50-1500",
        "fuente": ["Intraoperatients.pdf (serie FCoMEP)"]
      },
      "barrido": {
        "ventana_registro_ms": "no especificado explicitamente en fuentes del proyecto - estimar por analogia con CMAP miogenico (~50-100 ms)",
        "fuente": []
      },
      "notas_clinicas": {
        "trampas_frecuentes": [
          "Respuesta a estimulo unico bajo anestesia general = origen periferico, no corticobulbar - no interpretar como CoMEP valido",
          "La latencia de inicio del CoMEP facial por tren debe ser >10 ms para considerarse de origen central (Dong et al.)",
          "Pacientes con disfuncion facial preoperatoria severa (House-Brackmann V-VI) suelen quedar excluidos por no ser evocable el FCoMEP"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.10/23", "Intraoperatients.pdf"]
      }
    },
    {
      "id": "emg_libre_pares_craneales",
      "categoria": "Fosa posterior/tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "EMG libre continuo de pares craneales motores (patron A-train)",
      "estimulacion": {
        "nota": "Tecnica pasiva, sin estimulo aplicado"
      },
      "registro": {
        "musculos": "Facial: orbicular oculi, nasal, orbicular oris, mentoniano (minimo 3-4 canales); trigemino, IX-XII segun campo quirurgico",
        "electrodo": "Aguja bare-needle, separacion 5-10 mm (superior al hook-wire para esta tecnica en concreto, salvo en el musculo masetero)",
        "fuente": ["Romstock 2000", "Neurophysiology in Neurosurgery 2ed cap.23"]
      },
      "filtros": {
        "rango_hz": "no especificado explicitamente en fuentes del proyecto (Romstock 2000 no detalla la banda de filtro utilizada)",
        "fuente": []
      },
      "barrido": {
        "modo": "Registro continuo multicanal; analisis de morfologia de onda (offline u online segun equipo)",
        "fuente": ["Romstock 2000"]
      },
      "notas_clinicas": {
        "criterio_alerta": "El patron A-train (tren sinusoidal, simetrico, alta frecuencia, baja amplitud, duracion ~10 s) es el UNICO patron con alta sensibilidad y especificidad para paresia facial postoperatoria. El criterio es el patron de la onda, no su amplitud (principio ya validado en memoria de trabajo).",
        "trampas_frecuentes": [
          "Los trenes B y C son irrelevantes para el pronostico postoperatorio - no generar alarma por ellos",
          "La estimulacion electrica directa del nervio puede inducir un A-train sin dano real subyacente (descrito por Romstock 2000)",
          "La manipulacion del nervio intermediario puede generar A-train sin correlato clinico facial (Prell et al., referenciado en Neurophysiology in Neurosurgery 2ed)"
        ],
        "fuente": ["Romstock 2000", "Neurophysiology in Neurosurgery 2ed cap.23/24"]
      }
    },
    {
      "id": "mapeo_directo_pares_craneales",
      "categoria": "Fosa posterior/tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "Mapeo directo de pares craneales (sonda manual y sonda de succion dinamica)",
      "estimulacion": {
        "sonda": "Monopolar catodica o bipolar/concentrica (mapeo clasico intermitente); sonda de succion electrificada aislada para mapeo dinamico continuo (tecnica reciente)",
        "parametros_mapeo_clasico": "Duracion de pulso 0.2 ms, tasa 2-3 Hz",
        "parametros_mapeo_dinamico_continuo": "Duracion de pulso 0.3 ms, frecuencia 2 Hz, intensidad 0.05-2 mA",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.23"]
      },
      "registro": {
        "nota": "Mismos musculos/electrodos que CoMEP o EMG libre, segun el par craneal que se esta mapeando",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.23"]
      },
      "notas_clinicas": {
        "trampas_frecuentes": [
          "El mapeo clasico es intermitente - obliga a pausar la reseccion y no detecta un nervio cubierto por el tumor",
          "El mapeo dinamico continuo con sonda de succion permite advertencia en tiempo real durante la diseccion activa, sin pausar la cirugia"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.23"]
      }
    },
    {
      "id": "tvcr_reflejo_trigemino_vocal",
      "categoria": "Fosa posterior/tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "TVcR - Reflejo trigemino-vocal (Urriza et al. 2025)",
      "estimulacion": {
        "sitio": "Rama mentoniana del nervio trigemino (V3), a nivel del foramen mandibular; lado izquierdo (L.V3) o derecho (R.V3)",
        "electrodo": "Agujas o electrodos de superficie",
        "parametros": "Estimulo unico o tren de 2-4 pulsos, elegido segun la profundidad anestesica",
        "fuente": ["Urriza 2025"]
      },
      "registro": {
        "sitio": "Cuerdas vocales",
        "electrodo": "Electrodo de tubo adhesivo endotraqueal",
        "montaje": "Bipolar preferible sobre referencial (trazados mas claros y mejor definidos en la mayoria de los casos)",
        "fuente": ["Urriza 2025"]
      },
      "filtros": {
        "pasa_alto_hz": "0.1 inicial; ajustable 0.1-40 para corregir artefacto de estimulo",
        "pasa_bajo_hz": "2000 (constante)",
        "fuente": ["Urriza 2025"]
      },
      "barrido": {
        "tiempo_analisis_ms": "100-200, con un 10% de delay pre-estimulo",
        "fuente": ["Urriza 2025"]
      },
      "notas_clinicas": {
        "valores_normativos": "R1: latencia 17-39 ms (mediana ~29 ms), respuesta bilateral en 41/47 pacientes de la serie. R2 (presente en ~51% de los casos con R1): latencia 56-76 ms (mediana ~65 ms).",
        "trampas_frecuentes": [
          "Tecnica de descripcion muy reciente (2025) - sin validacion establecida de utilidad clinica intraoperatoria; tratar como hallazgo exploratorio, no como criterio de alerta consolidado",
          "El electrodo de tubo adhesivo puede rotar con el posicionamiento del paciente, dificultando valorar la lateralidad",
          "La intensidad critica para obtener respuesta no es fija - varia entre pacientes y con la profundidad anestesica"
        ],
        "fuente": ["Urriza 2025"]
      }
    },
    {
      "id": "mapeo_cortical_directo_des",
      "categoria": "Craneotomia despierta",
      "region": "craneotomia_despierta",
      "nombre": "Mapeo cortical directo por estimulacion electrica directa (DES) - tecnica de Penfield y tecnica de tren corto/alta frecuencia",
      "estimulacion": {
        "sonda": "Bipolar (Penfield clasica) o monopolar (tecnica de tren corto/alta frecuencia)",
        "parametros_penfield_clasica": "50-60 Hz, pulso rectangular de 1 ms, aplicacion de 1-4 s (1 s suele bastar para mapeo motor; 3-4 s para lenguaje/funcion cognitiva superior)",
        "parametros_tren_corto_alta_frecuencia": "Tren de 5 estimulos monofasicos de 0.5 ms, ISI 4 ms, tasa de repeticion 1 Hz (mapeo motor)",
        "polaridad": "Cortical: la corriente anodica es mas efectiva, independientemente del paradigma usado. Subcortical: catodica preferible.",
        "tipo_estimulador": "Corriente constante preferible sobre voltaje constante - mas seguro y fiable, independiente de la impedancia del tejido",
        "protocolo_practico": "Estimular cada punto al menos 3 veces; nunca el mismo punto 2 veces consecutivas; test control sin estimulacion entre estimulaciones (protocolo European Low Grade Glioma Network)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9"]
      },
      "registro": {
        "musculos": "Segun el homunculo motor objetivo",
        "electrodo": "EMG simultaneo de superficie (belly-tendon) o aguja subdermica (belly-belly) - recomendado para detectar movimientos sutiles o a distancia que podrian pasar desapercibidos",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9"]
      },
      "notas_clinicas": {
        "criterio_seguridad": "Mantener la intensidad por debajo del umbral de afterdischarge; ECoG concurrente recomendada. La tecnica clasica 50-60 Hz es sustancialmente mas epileptogena que la tecnica de tren corto (DCS-MEP).",
        "trampas_frecuentes": [
          "La estimulacion 50-60 Hz clasica puede inducir contraccion tonica progresiva que dificulta medir el umbral motor con precision",
          "El tren corto monopolar es mas predictivo en corteza motora primaria; la bipolar 50 Hz clasica es mas sensible en corteza premotora/area motora suplementaria",
          "Ante afterdischarge o crisis: irrigar con Ringer o suero frio; no reestimular inmediatamente"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9"]
      }
    },
    {
      "id": "mapeo_subcortical_des",
      "categoria": "Craneotomia despierta",
      "region": "craneotomia_despierta",
      "nombre": "Mapeo subcortical del tracto corticoespinal (DES catodica, monopolar o bipolar)",
      "estimulacion": {
        "polaridad": "Catodica preferible (independiente del paradigma)",
        "parametros_variables_segun_serie": {
          "kamada": "Catodica, tren de 5, pulso 0.2 ms",
          "nossek": "Catodica, tren de 5-7, pulso 0.5 ms, 300 Hz",
          "ohue": "Catodica, tren de 5, pulso 0.2 ms, 500 Hz",
          "seidel": "Catodica, tren de 5, pulso 0.5 ms, 250 Hz (ISI 4 ms)"
        },
        "protocolo_practico": "Elevar la intensidad en incrementos de 2 mA, repitiendo la estimulacion con frecuencia mientras se mapea la trayectoria estimada del tracto (European Low Grade Glioma Network)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9, Tabla 9.2"]
      },
      "registro": {
        "nota": "Mismos musculos/electrodos que PEM/CoMEP, segun el tracto que se esta mapeando",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9"]
      },
      "notas_clinicas": {
        "regla_practica": "Regla del pulgar ampliamente usada: ~1 mA de umbral equivale a ~1 mm de distancia al tracto corticoespinal (basada en la correlacion lineal de Nossek et al., 0.97 mA/mm). Kamada et al. postularon 1.8 mA como umbral de contacto directo con el CST.",
        "correlacion_riesgo_seidel": "Tasa de cambios/perdida irreversible de PEM cortical segun grupo de intensidad de mapeo subcortical: 0% en >20 mA, 0% en 11-20 mA, 10% en 6-10 mA, 10% en 4-5 mA, 20% en 1-3 mA",
        "trampas_frecuentes": [
          "No existe consenso definitivo sobre la relacion exacta intensidad-distancia entre estudios - usar la regla de 1 mA = 1 mm como orientacion, nunca como valor absoluto",
          "A mayor intensidad de estimulacion, mayor el area donde se pueden generar PEM - una respuesta positiva a alta intensidad no localiza con precision milimetrica"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.9"]
      }
    },
    {
      "id": "mapeo_lenguaje_des",
      "categoria": "Craneotomia despierta",
      "region": "craneotomia_despierta",
      "nombre": "Mapeo de lenguaje y funciones cognitivas mediante DES (baja frecuencia y alta frecuencia)",
      "estimulacion": {
        "tecnica_baja_frecuencia_lf": "Bifasica, 0.5 ms de duracion, ISI 20 ms (50-60 Hz), sonda bipolar (puntas separadas 5 o 10 mm) - paradigma tradicional",
        "tecnica_alta_frecuencia_hf": "Monofasica, 0.5 ms, tren de 5 estimulos, ISI 4 ms, sonda monopolar; tasa de repeticion 1 Hz para mapeo motor o 3 Hz para mapeo de lenguaje - no superar 3 Hz (aumenta riesgo de crisis sin mejorar la tecnica)",
        "corriente_de_trabajo_protocolo_us": "Incrementos de 0.5 mA desde 2 mA hasta afterdischarge en ECoG (ECoG obligatoria); rango habitual resultante 3.5-15 mA; tasa de crisis inducidas 2-25%",
        "corriente_de_trabajo_protocolo_europeo": "Incrementos de 0.5 mA desde 2 mA hasta anartria/interferencia clara en tarea de nombrar, sin buscar afterdischarge; rango habitual resultante 2-5.5 mA; tasa de crisis inducidas 0.5-5%",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.7"]
      },
      "registro": {
        "tareas": "Nombrar objetos/acciones/personas famosas, cuenta, asociacion semantica - segun el lobulo explorado",
        "criterio_sitio_elocuente": "Error reproducible en al menos 3 estimulaciones no consecutivas",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.7"]
      },
      "notas_clinicas": {
        "manejo_crisis": "Irrigacion con suero frio (Ringer o NaCl isotonico); si no cede, bolo de propofol (0.5-1 mL); no reestimular inmediatamente tras una crisis",
        "trampas_frecuentes": [
          "Estimulacion cortical: aplicar cada 2 items, nunca el mismo sitio 2 veces consecutivas, para reducir el riesgo de afterdischarge",
          "Mapeo subcortical: se usa la misma intensidad de corriente establecida en el mapeo cortical; solo los sitios con error reproducible en presencia de ECoG silente (si disponible) se consideran fiables",
          "La tecnica HF genera menos crisis que la LF - preferible en pacientes con antecedente de crisis, radioterapia previa, o alta carga de antiepilepticos"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.7"]
      }
    },
    {
      "id": "pess_fase_reversal_cisura_central",
      "categoria": "Craneotomia despierta",
      "region": "craneotomia_despierta",
      "nombre": "Mapeo cortical somatosensorial por inversion de fase (localizacion de la cisura central)",
      "estimulacion": {
        "nervio": "Nervio mediano (de eleccion - criterios mejor establecidos y area de mano habitualmente expuesta); alternativa nervio tibial o trigeminal si es necesario",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.3"]
      },
      "registro": {
        "tecnica": "Electrodo en tira o rejilla subdural colocado a traves de la presunta cisura central; registro referencial a escalpo/mastoides preferible sobre bipolar (mas facil de interpretar)",
        "criterio_localizacion": "Inversion de fase: N20 posterior a la cisura (negativo) y P20 anterior (positivo) simultaneos; criterio adicional P25 algo mas tardio en la cresta de S1; M1 se infiere anterior al electrodo P20",
        "precision_descrita": "~90% de los pacientes en la serie citada",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.3"]
      },
      "notas_clinicas": {
        "ventaja": "Realizable bajo anestesia general, sin necesidad de craneotomia despierta - util en ninos o pacientes fragiles donde el mapeo motor tradicional (Penfield) no es viable",
        "trampas_frecuentes": [
          "Ambiguedad si el electrodo cae justo sobre la cisura central o lejos del area de mano - puede requerir reposicionar la rejilla",
          "Patologia cerebral previa o malformacion puede alterar, reducir u obliterar la respuesta"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.3"]
      }
    },
    {
      "id": "nap_cnap_nervio_periferico",
      "categoria": "Plexo braquial / nervio periferico",
      "region": "plexo_periferico",
      "nombre": "Potencial de accion nervioso compuesto (CNAP/NAP) - registro directo intraoperatorio",
      "estimulacion": {
        "distancia_electrodos": "Minimo 4 cm entre estimulacion y registro (posible pero con mas artefacto de estimulo); preferible 8-10 cm",
        "parametros": "Pulsos de 0.02 ms de duracion, intensidad 6-8 V (aprox. 3-5 mA), aplicados habitualmente en el extremo proximal del segmento a estudiar",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.30 (Kline)"]
      },
      "registro": {
        "sensibilidad_inicial": "200-500 (uV)/cm, aumentando progresivamente hasta 10 (uV)/cm si no hay respuesta visible",
        "ventana_tiempo": "0.5-1 ms/cm",
        "electrodo": "Aguja o gancho (hook) percutaneo o en contacto directo con el nervio",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.30 (Kline)"]
      },
      "notas_clinicas": {
        "criterios_cnap_valido": "Fijo/'congelado' en la pantalla con estimulacion repetitiva (phase-locked al estimulo); amplitud siempre <2 mV (una respuesta >2 mV es mas probablemente un potencial de accion muscular, no un CNAP nervioso puro)",
        "interpretacion": "La presencia de CNAP en un segmento con perdida funcional completa preoperatoria orienta a neurolisis (recuperacion descrita en 93-94% de series historicas); la ausencia de CNAP orienta a reseccion y reparacion/injerto",
        "trampas_frecuentes": [
          "No promediar de entrada - el promediado puede detectar fibras finas residuales sin significado funcional y dar una falsa impresion de continuidad",
          "Estimulacion distal con registro proximal reduce el tamano del CNAP por fibras 'enterradas' que se suman al nervio proximalmente sin haber sido estimuladas"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.30 (Kline)"]
      }
    },
    {
      "id": "pess_troncos_cordones_plexo",
      "categoria": "Plexo braquial / nervio periferico",
      "region": "plexo_periferico",
      "nombre": "PESS para monitorizacion del plexo braquial (troncos/cordones)",
      "estimulacion": {
        "nervio": "Nervio mediano o cubital en muneca, segun el segmento del plexo en riesgo",
        "fuente": ["Moller cap.6"]
      },
      "registro": {
        "sitio_clave": "Punto de Erb - refleja la conduccion neural proximal al punto de estimulacion (plexo braquial); complementa el registro cortical estandar C3'/C4'-Fz",
        "indicacion_especifica": "Registrar PESS tambien durante el posicionamiento del paciente en cirugias con brazo/hombro en riesgo (las lesiones de plexo por posicionamiento son relativamente frecuentes) - no exclusivo de cirugia de plexo propiamente dicha",
        "fuente": ["Moller cap.6"]
      },
      "notas_clinicas": {
        "limitacion": "El PESS solo evalua la via sensitiva del nervio mixto; si se necesita valorar tambien la via motora, complementar con respuesta muscular a estimulacion del nervio mixto o con EMG estimulado/libre en musculos diana",
        "trampas_frecuentes": [
          "La amplitud al final de la cirugia como medida pronostica de lesion debe interpretarse con cautela - no distingue lesion temporal de permanente"
        ],
        "fuente": ["Moller cap.6"]
      }
    },
    {
      "id": "emg_libre_estimulado_periferico",
      "categoria": "Plexo braquial / nervio periferico",
      "region": "plexo_periferico",
      "nombre": "EMG libre y estimulado en cirugia de nervio periferico",
      "estimulacion_y_registro": {
        "nota": "Los principios tecnicos (filtros, modo free-run, criterios de patron tonico vs breve) son analogos a los ya descritos en emg_libre_espinal y emg_estimulado_tornillo_pedicular de este mismo documento. No se ha localizado en las fuentes del proyecto un protocolo especifico y distinto para nervio periferico mas alla de esa analogia.",
        "fuente": []
      },
      "notas_clinicas": {
        "diferencia_clave": "En cirugia de plexo/nervio periferico el objetivo suele ser identificar el nervio (mapeo) mas que solo vigilar irritacion - combinar con NAP/CNAP (ver entrada nap_cnap_nervio_periferico) para la decision de neurolisis vs reseccion-injerto",
        "fuente": []
      }
    },
    {
      "id": "reflejo_parpadeo_blink_reflex",
      "categoria": "Reflejos de tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "Reflejo de parpadeo (Blink Reflex, BR) bajo anestesia general",
      "estimulacion": {
        "sitio": "Nervio supraorbitario, agujas EEG subcutaneas; catodo en la escotadura supraorbitaria, anodo 2.5 cm superior y lateral al catodo",
        "parametros": "1-7 estimulos rectangulares de corriente constante, ISI 2 ms, intensidad 20-40 mA, tasa de repeticion del tren 0.4 Hz",
        "facilitacion_si_no_hay_respuesta": "Doble tren de estimulos, con intervalo entre trenes de 20-40 ms",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.17 (Fernandez-Conejero & Deletis)"]
      },
      "registro": {
        "sitio": "Tercio infero-lateral del orbicular de los ojos, ipsilateral al lado estimulado (agujas identicas a las de estimulacion, o hook-wire)",
        "promediado": "2 barridos unicos (minimo); invertir la polaridad del electrodo de estimulacion tras el primer barrido para reducir el artefacto de estimulo",
        "ventana": "Epoca de 50 ms",
        "filtros_hz": "Pasa-banda digital 70-1219",
        "timing_recomendado": "Intentar tras la intubacion, durante la cirugia, y tras iniciar el cierre de piel",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.17"]
      },
      "notas_clinicas": {
        "componentes": "R1: arco reflejo oligosinaptico (aferencia trigeminal V1, conexion troncoencefalica, nucleo motor facial, nervio facial, orbicular oculi). R2: mas complejo/polisinaptico, mismo arco aferente/eferente.",
        "trampa_critica": "El CoMEP del orbicular oculi por TES fuerte puede confundirse con un BR (R1) por difusion de corriente sobre el escalpo anterior que activa el nervio supraorbitario - si se usa el CoMEP de orbicular oculi de forma aislada, un hallazgo puede reflejar el BR y no la via corticobulbar real. Se recomienda monitorizar BR y CoMEP simultaneamente y de forma diferenciada.",
        "sensibilidad_anestesica": "No siempre evocable - sensible a la profundidad anestesica (correlacion descrita con caidas del BIS)",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.17", "Intraoperatients.pdf"]
      }
    },
    {
      "id": "reflejo_masetero_rmt",
      "categoria": "Reflejos de tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "Reflejo H del masetero (RMT) bajo anestesia general",
      "estimulacion": {
        "sitio": "Nervio maseterino (rama del trigemino), acceso percutaneo bajo el arco cigomatico, 0.5 cm anterior a la articulacion temporomandibular",
        "electrodo": "Par de agujas EMG monopolares o electrodos hook-wire",
        "parametros": "Estimulos unicos de intensidad creciente (de submaxima a supramaxima), tasa de repeticion 0.7 Hz",
        "contexto_anestesico_descrito": "TIVA (propofol 75-300 ug/kg/min + remifentanilo 0.1-0.2 ug/kg/min); bloque de mordida (gasa/espuma enrollada) para mantener la boca semiabierta 2-3 cm",
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.16 (Tellez & Ulkatan)"]
      },
      "registro": {
        "musculos": "Masetero ipsilateral (principal); temporal ipsilateral (alternativa, umbral distinto - no registrar ambos simultaneamente asumiendo el mismo umbral)",
        "valores_normativos": {
          "latencia_h_reflejo_masetero_ms": "5.4 +/- 1.3 (media +/- DE)",
          "latencia_respuesta_m_masetero_ms": "2.6 +/- 0.6",
          "latencia_h_reflejo_temporal_ms": "5.3 +/- 0.8",
          "amplitud_h_relativa_a_m": "~21% del maximo de la respuesta M"
        },
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.16"]
      },
      "notas_clinicas": {
        "tasa_exito_descrita": "Elicitable de forma fiable en 7/10 pacientes (70%) para masetero; 3/4 (75%) para temporal, en la serie de Ulkatan et al. 2017",
        "utilidad": "Refleja conduccion a traves del mesencefalo y protuberancia media - util en cirugia que involucra estas estructuras (ej. descompresion microvascular, MAV de tronco)",
        "trampas_frecuentes": [
          "Reflejo estrictamente unilateral - comparar siempre con el lado contralateral cuando sea posible",
          "Sin criterios de alerta validados aun - tecnica en fase de validacion quirurgica, no consolidada como estandar segun la propia fuente"
        ],
        "fuente": ["Neurophysiology in Neurosurgery 2ed cap.16"]
      }
    },
    {
      "id": "reflejo_trigemino_cervical_tcr",
      "categoria": "Reflejos de tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "Reflejo trigemino-cervical (TCR)",
      "estimulacion": {
        "sitio": "Nervio supraorbitario o infraorbitario (rama del trigemino)",
        "parametros_intraoperatorios": "Trenes de 2-7 estimulos (multipulso); duracion de pulso critica: 0.5-1.0 ms (patron B) favorece claramente la aparicion del reflejo bajo anestesia general frente a 0.2-0.5 ms (patron A) - recordabilidad 100% vs 22.2% respectivamente en la serie de referencia",
        "preoperatorio_diagnostico": "Pulso unico bifasico de 0.2 ms; tiempo de analisis 50 ms; ganancia 100 uV/division",
        "fuente": ["Lima Medeiros 2024"]
      },
      "registro": {
        "musculo": "Esternocleidomastoideo (SCM) ipsilateral a la estimulacion - respuesta mas consistente; trapecio ipsi/contralateral y SCM contralateral con recordabilidad variable y menor",
        "filtros_hz": "60-2000 o 90-2000 segun ejemplo de la fuente - ajustar segun visualizacion; filtros mas bajos (ej. 65 Hz) mejoran la visualizacion del TCR pero pueden dificultar distinguir el artefacto de estimulo",
        "valores_normativos_intraoperatorios_scm_ipsi": {
          "latencia_corta_mediana_ms": "15.6-16.7 segun el nervio estimulado",
          "latencia_larga_mediana_ms": "~42-61 (infrecuente - solo en 2 de 20 pacientes de la serie)"
        },
        "fuente": ["Lima Medeiros 2024"]
      },
      "notas_clinicas": {
        "trampa_critica": "Diferenciar del CMAP del platisma por activacion periferica no intencionada del nervio facial (difusion de corriente): el CMAP del platisma tiene latencia <8 ms, mientras que el TCR de latencia corta tiene latencia ~15-25 ms. Usar electrodos aislados en el SCM y vigilar la latencia con cuidado para no confundirlos - un CMAP de platisma mal interpretado como ausencia de TCR puede generar un falso negativo.",
        "estado_de_validacion": "Primera demostracion de elicitacion bajo anestesia general (2024) - sin rol clinico establecido aun en IONM; tecnica exploratoria",
        "fuente": ["Lima Medeiros 2024"]
      }
    },
    {
      "id": "pess_trigeminal_tep",
      "categoria": "Reflejos de tronco",
      "region": "fosa_posterior_tronco",
      "nombre": "Potenciales evocados trigeminales (TEP) - PESS de nervio trigemino",
      "estimulacion": {
        "sitio": "Ramas del nervio trigemino (periferico)",
        "fuente": ["Moller cap.5"]
      },
      "registro": {
        "scalp": "Cz y Oz",
        "intracraneal": "Directamente sobre la porcion intracraneal del nervio trigemino cuando esta expuesto (ej. descompresion microvascular para neuralgia del trigemino) - latencias de componentes negativos de corta latencia: 0.9, 1.6 y 2.6 ms",
        "fuente": ["Moller cap.5"]
      },
      "notas_clinicas": {
        "uso_real": "Tecnica raramente usada en monitorizacion intraoperatoria de rutina, a diferencia del resto de PESS - alta variabilidad entre laboratorios, especialmente en componentes de latencia larga (>5 ms)",
        "utilidad_descrita": "Util para monitorizar la medula oblonga y en rizotomia trigeminal para neuralgia del trigemino, donde interesa vigilar la conduccion del propio nervio trigemino",
        "trampas_frecuentes": [
          "No se ha descrito su uso mediante estimulacion tactil (air puffs) en el contexto intraoperatorio - solo estimulacion electrica",
          "No confundir con el reflejo TCR o TVcR, que son reflejos polisinapticos, no PESS puros de la via trigeminal"
        ],
        "fuente": ["Moller cap.5"]
      }
    }
  ]
};
