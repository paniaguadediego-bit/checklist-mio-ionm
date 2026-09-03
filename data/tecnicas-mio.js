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
 * Lote 1 (este archivo): columna/médula (PESS tibial, PESS mediano/cubital,
 * PEM/TcMEP, onda D, EMG libre espinal, EMG estimulado tornillo pedicular) +
 * fosa posterior/tronco (PEATC/BAEP, CoMEP pares craneales, EMG libre pares
 * craneales/A-train, mapeo directo pares craneales, TVcR).
 *
 * Lote 2 (pendiente, ver notas_meta.categorias_pendientes_siguiente_lote):
 * craneotomía despierta, plexo braquial/periférico, reflejos de tronco
 * adicionales, PESS trigeminal. Se añade empujando más objetos al array
 * "tecnicas" de abajo, con el mismo formato -no hace falta tocar app.js,
 * que agrupa por el campo "region" de cada técnica sea cual sea.
 */
window.TECNICAS_MIO = {
  "esquema_version": "1.0",
  "generado": "2026-09-03",
  "notas_meta": {
    "principio_fuentes": "Cada parametro cuantitativo incluye su fuente. Cuando dos fuentes difieren, se muestran ambos valores explicitamente (nunca promediados ni combinados). Los campos sin dato verificado en las fuentes del proyecto se marcan como 'no especificado en fuentes'.",
    "convencion_claves": "snake_case sin acentos ni espacios, consistente con la convencion Notion de Pani.",
    "lote_actual": "Columna/medula espinal (6 tecnicas) + Fosa posterior/tronco (5 tecnicas) = 11 entradas, todas trazadas a fuente.",
    "categorias_pendientes_siguiente_lote": [
      "Craneotomia despierta: mapeo cortical/subcortical (DES), mapeo de lenguaje, PESS fase-reversal para localizacion de cisura central",
      "Plexo braquial y nervio periferico: PESS de troncos/cordones, NAP (nerve action potentials), EMG libre/estimulado periferico",
      "Reflejos de tronco adicionales: reflejo de parpadeo (blink reflex), reflejo masetetico trigeminal (RMT), reflejo trigemino-cervical (TCR)",
      "PESS trigeminal",
      "Variantes anestesicas especificas por tecnica (TIVA vs halogenados) - de momento solo aparecen como nota clinica puntual, no como campo estructurado propio"
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
    }
  ]
};
