/*
 * Datos de material MIO/IONM (sistema INOMED).
 *
 * Este archivo NO es un .json "puro" por una razón técnica: si index.html
 * se abre con doble clic (protocolo file://), Chrome y Edge bloquean
 * fetch() de archivos locales por CORS y el checklist no cargaría nada.
 * Por eso el JSON va envuelto en una variable global y se carga con una
 * simple etiqueta <script>, que sí funciona sin servidor.
 *
 * Para editarlo: es JSON válido entre las llaves de abajo. Añadir una
 * cirugía nueva es añadir un objeto dentro de "cirugias" — no hay que
 * tocar app.js. Ver README.md para ejemplos.
 *
 * "cajas_material" es el catálogo fijo de las 7 cajas físicas del INOMED.
 * Cada cirugía referencia en su "cajas" solo las que usa, con esa misma
 * clave. Si un ítem extra (de una opción/checkbox) lleva "caja", se añade
 * dentro de esa caja en vez de en la tarjeta genérica de opciones.
 */
window.SURGERIES_DATA = {
  "cajas_material": {
    "caja_estimulo": {
      "nombre": "Caja de estímulo",
      "descripcion": "Uso principalmente para mediano y tibial posterior, aunque puede variar según la cirugía por comodidad (p. ej. a la altura de las piernas, usando tibial posterior y hueco poplíteo para el H-reflex)."
    },
    "tes_mep": {
      "nombre": "TES MEP",
      "descripcion": "Conmutador en el canal 6 con las combinaciones de ánodo/cátodo (C1, C2, C3, C4, Cz-1, Cz+6); incluye los canales del GRID (entradas de cátodo, negras) y el Raabe (cátodo negro que estimula + ánodo rojo de referencia)."
    },
    "registro_cortical": {
      "nombre": "Registro corticales, Erb, CvAnterior",
      "descripcion": "Registro cortical, punto de Erb y CvAnterior; si se usan, también potenciales auditivos."
    },
    "registro_muscular_mmss": {
      "nombre": "Registro muscular — etiqueta 1",
      "descripcion": "Generalmente miembros superiores, aunque puede variar."
    },
    "registro_muscular_mmii": {
      "nombre": "Registro muscular — etiqueta 2",
      "descripcion": "Generalmente miembros inferiores, aunque puede variar."
    },
    "caja_etiqueta_3": {
      "nombre": "Caja etiqueta 3",
      "descripcion": "No se suele usar, pero está disponible si se necesita."
    },
    "caja_etiqueta_4": {
      "nombre": "Caja etiqueta 4",
      "descripcion": "No se suele usar, pero está disponible si se necesita."
    }
  },
  "material_base": {
    "descripcion": "Común a todas las cirugías, no se repite por checklist",
    "cajas": [
      "Caja de estímulo",
      "TES MEP",
      "Registro corticales, Erb, CvAnterior",
      "Registro muscular — etiqueta 1",
      "Registro muscular — etiqueta 2",
      "Caja etiqueta 3",
      "Caja etiqueta 4"
    ],
    "items": []
  },
  "cirugias": {
    "artrodesis_descompresion": {
      "nombre": "Artrodesis + descompresión",
      "modalidades": ["PESS", "PEM", "EMG libre", "EMG estimulado"],
      "cajas": {
        "caja_estimulo": [
          {
            "item": "Estimulación periférica (para PESS y reflejo H)",
            "material": "Pegatinas",
            "detalle": "Tibial posterior, hueco poplíteo (reflejo H), mediano o cubital",
            "cantidad_pares": 6
          }
        ],
        "tes_mep": [
          {
            "item": "Electrodos sacacorchos — estimulación",
            "sitios": [
              { "nombre": "Cz-1" },
              { "nombre": "Cz+6cm" },
              { "nombre": "C1", "color": "verde" },
              { "nombre": "C2", "color": "amarillo" },
              { "nombre": "C3", "color": "rojo" },
              { "nombre": "C4", "color": "azul" }
            ],
            "cantidad": 6
          }
        ],
        "registro_cortical": [
          {
            "item": "Electrodos sacacorchos — registro",
            "sitios": [
              { "nombre": "Cz'" },
              { "nombre": "C3'", "color": "rojo" },
              { "nombre": "C4'", "color": "azul" },
              { "nombre": "Fz" },
              { "nombre": "Cv2" }
            ],
            "cantidad": 5
          },
          { "item": "Registro cervical anterior (CvAnt)", "material": "Aguja subdérmica", "detalle": "Registro monopolar", "cantidad": 1 },
          { "item": "Punto de Erb", "material": "Agujas trenzadas", "detalle": "Colores: roja y negra", "cantidad_pares": 1 },
          { "item": "Tierra", "material": "Aguja subdérmica", "cantidad": 1 }
        ],
        "registro_muscular_mmss": [
          {
            "item": "Registro muscular — 1er interóseo (control)",
            "material": "Agujas subdérmicas pareadas",
            "detalle": "1 par por lado, bilateral",
            "cantidad_pares": 2
          },
          { "item": "Tierra", "material": "Aguja subdérmica", "cantidad": 1 }
        ],
        "registro_muscular_mmii": [
          {
            "item": "Registro muscular",
            "material": "Agujas subdérmicas pareadas",
            "detalle": "4 niveles por lado: cuádriceps, tibial anterior, abductor hallucis, gastrocnemio medial",
            "cantidad_pares": 8
          },
          { "item": "Tierra", "material": "Aguja subdérmica", "cantidad": 1 }
        ]
      }
    },
    "tumor_supratentorial_grid": {
      "nombre": "Tumor supratentorial con GRID",
      "modalidades": ["SEP", "MEP", "Phase Reversal", "DCS", "ECoG", "ECG"],
      "cajas": {
        "caja_estimulo": [
          {
            "item": "Estimulación periférica",
            "material": "Pegatinas",
            "detalle": "Mediano bilateral, tibial posterior bilateral, hueco poplíteo (reflejo H) bilateral — 1 par por lado y sitio",
            "cantidad_pares": 6
          }
        ],
        "tes_mep": [
          {
            "item": "Electrodos sacacorchos — estimulación",
            "sitios": [
              { "nombre": "C1", "color": "verde" },
              { "nombre": "C2", "color": "amarillo" },
              { "nombre": "C3", "color": "rojo" },
              { "nombre": "C4", "color": "azul" },
              { "nombre": "Cz-1" },
              { "nombre": "Cz+6" }
            ],
            "cantidad": 6
          }
        ],
        "registro_cortical": [
          {
            "item": "Electrodos sacacorchos — registro",
            "sitios": [
              { "nombre": "Fz" },
              { "nombre": "Cz'" },
              { "nombre": "C3'", "color": "rojo" },
              { "nombre": "C4'", "color": "azul" },
              { "nombre": "Cv2" }
            ],
            "cantidad": 5
          },
          { "item": "Registro cervical anterior (CvAnt)", "material": "Aguja subdérmica", "detalle": "Registro monopolar", "cantidad": 1 },
          { "item": "Punto de Erb", "material": "Agujas trenzadas", "detalle": "Colores: roja y negra", "cantidad_pares": 1 },
          { "item": "Tierra", "material": "Aguja subdérmica", "cantidad": 1 }
        ],
        "registro_muscular_mmss": [
          {
            "item": "Registro muscular — 1er interóseo y extensor",
            "material": "Paquete de agujas trenzadas",
            "detalle": "1 paquete por músculo y lado, bilateral. Si se amplía, siempre en el lado contralateral a la lesión.",
            "cantidad_paquetes": 4
          },
          { "item": "Tierra", "material": "Aguja subdérmica", "cantidad": 1 }
        ],
        "registro_muscular_mmii": [
          {
            "item": "Registro muscular — tibial anterior y abductor hallucis",
            "material": "Paquete de agujas trenzadas",
            "detalle": "1 paquete por músculo y lado, bilateral. Si se amplía, siempre en el lado contralateral a la lesión.",
            "cantidad_paquetes": 4
          },
          { "item": "Tierra", "material": "Aguja subdérmica", "cantidad": 1 }
        ]
      },
      "opciones": {
        "sonda_raabe": {
          "etiqueta": "¿Se usa sonda tipo aspiración/estimulación (Raabe)?",
          "descripcion": "Poco frecuente, pero se prepara por si acaso",
          "items_extra": [
            { "item": "Ref.Raabe", "detalle": "Referencia principal del estimulador Raabe (cátodo, entrada negra)", "tipo": "sacacorchos", "cantidad": 1, "caja": "tes_mep" },
            { "item": "Cz''", "detalle": "Alternativa a Ref.Raabe (ánodo de referencia, entrada roja)", "tipo": "sacacorchos", "cantidad": 1, "caja": "tes_mep" }
          ]
        }
      },
      "pendiente": "Referencia usada por el GRID (tira cortical, para Phase Reversal/DCS) — no confirmada todavía. No inventar un valor; dejar visible como pendiente en la UI."
    }
  }
};
