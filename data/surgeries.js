/*
 * Datos de material MIO/IONM.
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
 */
window.SURGERIES_DATA = {
  "material_base": {
    "descripcion": "Común a todas las cirugías, no se repite por checklist",
    "cajas": ["1 cortical", "2 de registro", "2 de estímulo"],
    "items": []
  },
  "cirugias": {
    "artrodesis_descompresion": {
      "nombre": "Artrodesis + descompresión",
      "modalidades": ["PESS", "PEM", "EMG libre", "EMG estimulado"],
      "cajas": {
        "cabeza": [
          {
            "item": "Electrodos sacacorchos (estimulación/registro cortical y cervical alto)",
            "sitios": ["Cz-1", "Cz+6cm", "C1", "C2", "C3", "C4", "Cz'", "C3'", "C4'", "Fz", "Cv2"],
            "cantidad": 11
          },
          { "item": "Registro cervical anterior (CvAnt)", "material": "Aguja monopolar", "cantidad": 1 },
          { "item": "Tierra", "material": "Aguja subdérmica", "cantidad": 1 }
        ],
        "resto": [
          {
            "item": "Registro muscular",
            "material": "Agujas subdérmicas pareadas",
            "detalle": "4 niveles por lado (cuádriceps, tibial anterior, abductor hallucis, gastrocnemio medial) + 1 primer interóseo de cada lado como control",
            "cantidad_pares": 10
          },
          {
            "item": "Estimulación periférica (para PESS)",
            "material": "Pegatinas",
            "detalle": "Tibial posterior, hueco poplíteo, mediano o cubital",
            "cantidad_pares": 6
          },
          { "item": "Punto de Erb", "material": "Agujas trenzadas", "cantidad_pares": 1 },
          { "item": "Tierras restantes", "material": "Aguja subdérmica", "cantidad": 2 }
        ]
      }
    },
    "tumor_supratentorial_grid": {
      "nombre": "Tumor supratentorial con GRID",
      "modalidades": ["SEP", "MEP", "Phase Reversal", "DCS", "ECoG", "ECG"],
      "cajas": {
        "registro_cortical": [
          { "item": "Tierra", "material": "Aguja subdérmica", "cantidad": 1 }
        ],
        "registro_muscular_mmss": [
          { "item": "Tierra", "material": "Aguja subdérmica", "cantidad": 1 }
        ],
        "registro_muscular_mmii": [
          { "item": "Tierra", "material": "Aguja subdérmica", "cantidad": 1 }
        ]
      },
      "sin_asignar": [
        {
          "item": "Electrodos sacacorchos — estimulación",
          "sitios": ["C1", "C2", "C3", "C4", "Cz-1", "Cz+6"],
          "cantidad": 6
        },
        {
          "item": "Electrodos sacacorchos — registro",
          "sitios": ["Fz", "Cz'", "C3'", "C4'", "Cv2"],
          "cantidad": 5
        },
        { "item": "Registro cervical anterior (CvAnt)", "material": "Aguja monopolar", "cantidad": 1 },
        { "item": "Punto de Erb", "material": "Agujas trenzadas", "cantidad_pares": 1 },
        {
          "item": "Estimulación periférica",
          "material": "Pegatinas",
          "detalle": "Mediano bilateral, tibial posterior bilateral, hueco poplíteo (reflejo H) bilateral — 1 par por lado y sitio",
          "cantidad_pares": 6
        },
        {
          "item": "Registro muscular",
          "material": "Paquete de agujas trenzadas",
          "detalle": "Primer interóseo, extensor, tibial anterior, abductor hallucis — simétrico, 1 paquete por músculo y lado. Si se amplía, siempre en el lado contralateral a la lesión.",
          "cantidad_paquetes": 8
        }
      ],
      "opciones": {
        "sonda_raabe": {
          "etiqueta": "¿Se usa sonda tipo aspiración/estimulación (Raabe)?",
          "descripcion": "Poco frecuente, pero se prepara por si acaso",
          "items_extra": [
            { "item": "Ref.Raabe", "detalle": "Referencia principal del estimulador Raabe", "tipo": "sacacorchos", "cantidad": 1 },
            { "item": "Cz''", "detalle": "Alternativa a Ref.Raabe", "tipo": "sacacorchos", "cantidad": 1 }
          ]
        }
      },
      "pendiente": "Referencia usada por el GRID (tira cortical, para Phase Reversal/DCS) — no confirmada todavía. No inventar un valor; dejar visible como pendiente en la UI."
    }
  }
};
