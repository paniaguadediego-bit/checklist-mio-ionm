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

## Cómo añadir una cirugía nueva

Abre `data/surgeries.js` y añade un objeto nuevo dentro de `"cirugias"`.
No hace falta tocar `app.js`: el desplegable y las cajas se generan solas
a partir de las claves que pongas.

```json
"nombre_clave_cirugia": {
  "nombre": "Nombre visible de la cirugía",
  "modalidades": ["PESS", "PEM"],
  "cajas": {
    "caja_1": [
      { "item": "Nombre del ítem", "material": "Tipo de material", "cantidad": 2 }
    ],
    "otra_caja": [
      { "item": "Otro ítem", "cantidad_pares": 3, "detalle": "Texto opcional" }
    ]
  }
}
```

Puntos importantes:

- `"cajas"` puede tener **cualquier número de cajas con cualquier nombre**
  (claves libres, por ejemplo `"cabeza"`, `"resto"`, `"registro_cortical"`...).
  Cada una se renderiza como una tarjeta independiente.
- Cada ítem admite estos campos, todos opcionales salvo `"item"`:
  - `"material"` — tipo de material (aguja, pegatina, etc.)
  - `"cantidad"` / `"cantidad_pares"` / `"cantidad_paquetes"` — usa el que
    corresponda; se muestra como etiqueta de cantidad
  - `"detalle"` — texto libre con aclaraciones
  - `"sitios"` — lista de ubicaciones/electrodos, se muestran como chips
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
      { "item": "Ítem extra", "cantidad": 1 }
    ]
  }
}
```

Cada opción aparece como un checkbox encima del checklist. Al marcarlo, sus
`"items_extra"` se añaden a una tarjeta "Material añadido por opciones" sin
recargar la página; al desmarcarlo, desaparecen.

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
