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
 *
 * Orden dentro de cada región (pedido por Pani el 04-09-2026, no automático:
 * cualquier técnica nueva hay que insertarla a mano en el sitio que le
 * corresponda, app.js no reordena nada):
 *   1. Primero las técnicas de monitorización, luego las de mapeo.
 *   2. Dentro de "Fosa posterior/tronco", los reflejos van agrupados y
 *      ordenados por el nivel del par craneal implicado, de más rostral a
 *      más caudal: Blink Reflex (V1→VII, puente) → RMT/H-reflex del
 *      masetero (V3→V3, puente) → TCR (V→cervical, desciende a la médula
 *      cervical alta) → TVcR (V3→X vago/laringe, el más caudal).
 *
 * Los "id" y "region" de cada técnica son claves internas y se quedan sin
 * acentos a propósito (regla del proyecto: snake_case sin acentos ni
 * espacios). Todo lo demás -nombre, categoria y el resto de texto- lleva
 * tildes y eñes con normalidad: son literales que se pintan tal cual en
 * pantalla, no claves.
 */
window.TECNICAS_MIO = {
  "esquema_version": "1.0",
  "generado": "2026-09-03",
  "notas_meta": {
    "principio_fuentes": "Cada parámetro cuantitativo incluye su fuente. Cuando dos fuentes difieren, se muestran ambos valores explícitamente (nunca promediados ni combinados). Los campos sin dato verificado en las fuentes del proyecto se marcan como 'no especificado en fuentes'.",
    "convencion_claves": "snake_case sin acentos ni espacios, consistente con la convención Notion de Pani.",
    "lote_actual": "Lote 1: Columna/médula espinal (6) + Fosa posterior/tronco - evocados y EMG (5) = 11. Lote 2: Craneotomía despierta (4) + Plexo braquial/nervio periférico (3) + Reflejos de tronco adicionales (4) = 11. Total 22 entradas, todas trazadas a fuente.",
    "categorias_pendientes_siguiente_lote": [
      "Variantes anestésicas específicas por técnica (TIVA vs halogenados) - de momento solo aparecen como nota clínica puntual, no como campo estructurado propio",
      "emg_libre_estimulado_periferico queda como entrada de remisión (sin protocolo específico propio localizado en fuentes) - revisar si Pani tiene protocolo clínico propio que aportar como fuente",
      "Posibles ampliaciones futuras si Pani las pide: laryngeal adductor reflex (LAR), reflejo trigémino-hipogloso, mapeo con sonda de succión aplicado a columna (Gandhi et al., ya referenciado parcialmente en pess_troncos/onda_d)"
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
        "montaje": "10-20 internacional; considerar derivaciones optimizadas ISION",
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
        "montaje": "10-20 internacional; canales clásicos Cz'-Fz (pierna), C3'/C4'-Fz (brazo)",
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
      "id": "mapeo_cortical_directo_des",
      "categoria": "Craneotomía despierta",
      "region": "craneotomia_despierta",
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
      "categoria": "Craneotomía despierta",
      "region": "craneotomia_despierta",
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
      "id": "mapeo_lenguaje_des",
      "categoria": "Craneotomía despierta",
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
      "id": "pess_fase_reversal_cisura_central",
      "categoria": "Craneotomía despierta",
      "region": "craneotomia_despierta",
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
    }
  ]
};
