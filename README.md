# Checklist de material MIO/IONM

Herramienta interna, sin backend ni build step, para generar el checklist de
material necesario según el tipo de cirugía monitorizada.

## Cómo abrir la herramienta

Haz doble clic en `index.html`. Se abre en el navegador y funciona sin
conexión a internet (no hace ninguna petición de red).

> **Nota técnica:** los datos no están en un `.json` puro porque Chrome/Edge
> bloquean `fetch()` de archivos locales cuando abres una página con doble
> clic (protocolo `file://`). Para evitarlo, los datos viven en
> [`data/surgeries.js`](data/surgeries.js), que es JSON válido envuelto en
> `window.SURGERIES_DATA = { ... };` y se carga con una etiqueta
> `<script>` normal. Se edita exactamente igual que un JSON.

## Estructura del proyecto

- `index.html` — interfaz (selector, checklist, checkboxes de opciones)
- `style.css` — estilos
- `app.js` — lógica: lee `window.SURGERIES_DATA` y renderiza todo dinámicamente
- `data/surgeries.js` — **el único archivo que necesitas tocar** para añadir
  o modificar cirugías

## Las cajas del INOMED

El array `"cajas_material"` (arriba del todo en `data/surgeries.js`) es el
catálogo fijo de las 7 cajas físicas del equipo INOMED:
caja de estímulo, TES MEP, registro corticales/Erb/CvAnterior, registro
muscular etiqueta 1 (MMSS), etiqueta 2 (MMII), y las etiquetas 3 y 4 (poco
usadas). Cada una tiene un `"nombre"` y una `"descripcion"` de uso que se
muestran en la tarjeta correspondiente.

Cada cirugía referencia estas mismas claves (`"caja_estimulo"`, `"tes_mep"`,
`"registro_cortical"`, `"registro_muscular_mmss"`, `"registro_muscular_mmii"`,
`"caja_etiqueta_3"`, `"caja_etiqueta_4"`) dentro de su propio `"cajas"`,
incluyendo solo las que usa. Si en el futuro hace falta una caja que no está
en el catálogo, puedes usar cualquier otra clave libre — se mostrará con un
título genérico sin descripción.

Cada entrada del catálogo admite además `"canales"` (número de entradas) y
`"conector"`, con cuatro tipos posibles:

- `"par"` — una sola entrada roja+negra por número (agujas trenzadas/
  pareadas: registro muscular, estímulo). Un ítem ocupa las dos a la vez.
- `"individual"` — un único círculo por número, en una sola columna.
- `"individual_2col"` — como `"individual"` pero repartido en 2 columnas
  de `canales / 2` (p. ej. REF-AEP: 1-8 a la izquierda, 9-16 a la derecha).
- `"anodal_catodal"` — 2 columnas independientes que comparten numeración
  (TES MEP): izquierda = anodal/rojo, derecha = catodal/negro. Cada lado
  se puede arrastrar por separado, no van ligados como en `"par"`.

Además puede llevar `"especiales"`: un array de conectores fijos fuera de
la numeración normal (p. ej. Ref, GND, PEATC de REF-AEP, o el DNS de la
caja de estímulo), cada uno con `"clave"`, `"nombre"`, `"conector"`
(`"individual"` o `"par"`) y opcionalmente `"color"` (p. ej. `"amarillo"`
para PEATC) y `"nota"` (texto aclaratorio, p. ej. "Habitualmente Fz").

Estos valores son una aproximación a partir de fotos reales del equipo —
ajústalos si no cuadran. Si una caja no especifica `"canales"`/`"conector"`,
se usan 8 canales tipo `"par"` por defecto.

### Ítem "conmutador" (TES MEP)

Un ítem puede llevar `"conmutador": true` cuando representa una sola
entrada física que se subdivide por software entre varias combinaciones
(el canal 6 anodal de TES MEP, que alterna entre C1/C2/C3/C4/Cz-1/Cz+6).
En ese caso `"sitios"` define las opciones del desplegable que aparece
junto al chip en la caja física, en vez de generar un chip por sitio.

## Vista de caja física (arrastrar y soltar)

Cada tarjeta de caja incluye, debajo del listado de material, un dibujo de
la caja física (forma vertical, cabecera "kΩ", entradas numeradas, placa
con el nombre abajo) con el material de esa caja como chips sueltos debajo
("Material sin colocar"). Puedes arrastrar cualquier chip a una entrada
para ver cómo quedaría la caja montada, mover uno de una entrada a otra, o
devolverlo al grupo de "sin colocar".

Esto es **solo una ayuda visual de la sesión actual**: no se guarda en
ningún sitio ni se sincroniza con git. Al recargar la página vuelve a
empezar con todo sin colocar. Los datos que sí son fijos (qué material
lleva cada cirugía, en qué caja) siguen viviendo en `data/surgeries.js`
como siempre.

## Cómo añadir una cirugía nueva

Abre `data/surgeries.js` y añade un objeto nuevo dentro de `"cirugias"`.
No hace falta tocar `app.js`: el desplegable y las cajas se generan solas
a partir de las claves que pongas.

```json
"nombre_clave_cirugia": {
  "nombre": "Nombre visible de la cirugía",
  "modalidades": ["PESS", "PEM"],
  "cajas": {
    "caja_estimulo": [
      { "item": "Nombre del ítem", "material": "Tipo de material", "cantidad": 2 }
    ],
    "registro_cortical": [
      { "item": "Otro ítem", "cantidad_pares": 3, "detalle": "Texto opcional" }
    ]
  }
}
```

Puntos importantes:

- `"cajas"` puede tener **cualquier número de cajas**; lo normal es usar las
  claves del catálogo `"cajas_material"`, pero admite cualquier nombre libre.
  Cada una se renderiza como una tarjeta independiente, en el orden del
  catálogo.
- Cada ítem admite estos campos, todos opcionales salvo `"item"`:
  - `"material"` — tipo de material (aguja, pegatina, etc.)
  - `"cantidad"` / `"cantidad_pares"` / `"cantidad_paquetes"` — usa el que
    corresponda; se muestra como etiqueta de cantidad
  - `"detalle"` — texto libre con aclaraciones
  - `"sitios"` — lista de ubicaciones/electrodos, se muestran como chips.
    Cada sitio puede ser un texto simple (`"Fz"`) o un objeto con color
    real del electrodo: `{ "nombre": "C3", "color": "rojo" }`. Colores
    admitidos: `rojo`, `azul`, `verde`, `amarillo`. Código de color del
    INOMED: C1/C5 verde, C2/C6 amarillo, C3 y C3' rojo, C4 y C4' azul.
- Si tienes material que aún no has repartido entre cajas, ponlo en un array
  `"sin_asignar"` al mismo nivel que `"cajas"` — aparece en una tarjeta
  aparte llamada "Sin asignar todavía".
- Si algo está pendiente de confirmar (y no quieres inventar un valor),
  añade un campo `"pendiente"` (texto) al mismo nivel que `"cajas"` — se
  muestra como aviso destacado en la parte superior del checklist.

## Cómo añadir una opción/variante (tipo "sonda Raabe")

Dentro de una cirugía, añade un bloque `"opciones"`:

```json
"opciones": {
  "clave_opcion": {
    "etiqueta": "¿Se usa tal cosa?",
    "descripcion": "Texto opcional de aclaración",
    "items_extra": [
      { "item": "Ítem extra", "cantidad": 1, "caja": "tes_mep" }
    ]
  }
}
```

Cada opción aparece como un checkbox encima del checklist. Al marcarlo, sus
`"items_extra"` se insertan sin recargar la página; al desmarcarlo,
desaparecen. Si un ítem extra lleva `"caja"`, se añade dentro de esa caja
(con un fondo distinto para diferenciarlo). Si no lleva `"caja"`, aparece en
una tarjeta aparte "Material añadido por opciones".

## Material base

La sección "Material base" (`"material_base"` en el JSON) se muestra siempre,
independientemente de la cirugía elegida. Tiene su propio array `"items"`
(vacío de momento) y una lista `"cajas"` puramente descriptiva.

## Retomar el proyecto desde otro ordenador

Clonar por primera vez:

```bash
git clone <url-del-repo>
```

Antes de empezar a trabajar (traer cambios de otra sesión):

```bash
git pull
```

Al terminar tus cambios:

```bash
git add -A
git commit -m "Describe brevemente el cambio"
git push
```
