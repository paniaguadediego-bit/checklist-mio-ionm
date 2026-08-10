# Checklist de material MIO/IONM

Herramienta interna, sin backend ni build step, para montar el escenario de
cada cirugía monitorizada y saber exactamente qué material hace falta.

**Flujo de uso previsto:** el día antes de la cirugía abres la herramienta,
eliges (o creas) el escenario del tipo de cirugía, ajustas las entradas de
las cajas arrastrando material, y el **Resumen de material** te dice qué
tienes que preparar y si te sobran o faltan entradas y cajas.

## Cómo abrir la herramienta

Haz doble clic en `index.html`. Se abre en el navegador y funciona sin
conexión a internet (no hace ninguna petición de red).

> **Nota técnica:** los datos no están en un `.json` puro porque Chrome/Edge
> bloquean `fetch()` de archivos locales cuando abres una página con doble
> clic (protocolo `file://`). Por eso viven en
> [`data/surgeries.js`](data/surgeries.js), que es JSON válido envuelto en
> `window.SURGERIES_DATA = { ... };`. Se edita exactamente igual que un JSON.

## Estructura del proyecto

- `index.html` — interfaz
- `style.css` — estilos
- `app.js` — lógica: catálogo, cajas, arrastrar y soltar, resumen
- `data/surgeries.js` — **el único archivo que necesitas tocar**, con tres
  bloques: `cajas_material`, `catalogo_material` y `escenarios`

## Cómo funciona

### 1. Catálogo maestro

`catalogo_material` es la lista de **todo** el material que se puede colocar
en una entrada: electrodos corticales, músculos, estimulaciones periféricas,
GRID, tierras... Aparece agrupado por categorías en la parte de arriba, con
buscador. Arrastra cualquier ítem a una entrada de cualquier caja.

Un mismo ítem se puede usar tantas veces como haga falta (el catálogo es una
fuente infinita, no se "gasta").

### 2. Cajas físicas

`cajas_material` describe las cajas reales del INOMED. Cada caja se dibuja
con sus entradas y conectores. Para quitar material de una entrada: pulsa la
✕ del chip o arrástralo de vuelta al catálogo. Para moverlo: arrástralo a
otra entrada, aunque sea de otra caja.

### 3. Escenarios (presets)

Cada escenario guarda **qué material va en qué entrada de qué caja**. La
barra de herramientas permite crear, duplicar, renombrar, vaciar y borrar
escenarios.

### 4. Resumen de material

Se recalcula solo con cada cambio y es el objetivo de la herramienta:

- **Material a preparar** — recuento por tipo (agujas subdérmicas, agujas
  trenzadas, pegatinas, sacacorchos...)
- **Cajas necesarias** — cuáles, con entradas usadas / totales y el detalle
  de qué va en cada entrada
- **Avisos** — cajas completas sin entradas libres, notas del escenario y
  cosas pendientes de confirmar

El botón **Imprimir resumen** saca solo esta sección en papel.

## Dónde se guarda todo

Los cambios que hagas en la web se guardan **automáticamente en ese
navegador y ese ordenador** (localStorage). No tocan `data/surgeries.js` ni
viajan por git.

Para que un preset sea permanente y esté disponible en otro ordenador:

1. Pulsa **Exportar JSON**.
2. Copia el resultado y pégalo en `data/surgeries.js`, dentro de
   `"escenarios"`.
3. `git commit` + `git push`.

**Restablecer todo** borra lo guardado en el navegador y vuelve a los
escenarios del archivo.

## Añadir material nuevo al catálogo

Dentro de `catalogo_material`, en la categoría que corresponda (o crea una
nueva), añade un objeto:

```json
{ "id": "l_gluteo", "nombre": "L.Glúteo", "material": "Agujas trenzadas (par)", "nota": "Glúteo izquierdo" }
```

- `id` — identificador único, sin espacios. Es lo que se guarda en los presets.
- `nombre` — lo que se ve en el chip.
- `material` — **lo que se cuenta en el resumen**. Reutiliza los textos ya
  existentes (`"Aguja subdérmica"`, `"Agujas trenzadas (par)"`,
  `"Pegatinas (par)"`, `"Electrodo sacacorchos"`...) para que se sumen juntos.
- `color` *(opcional)* — `rojo`, `azul`, `verde` o `amarillo`. Código del
  INOMED: C1/C5 verde, C2/C6 amarillo, C3 y C3' rojo, C4 y C4' azul.
- `nota` *(opcional)* — texto que sale al pasar el ratón.
- `conmutador` + `opciones` *(opcional)* — para un ítem que ocupa una sola
  entrada pero se subdivide por software (el canal 6 anodal de TES MEP).
  Genera un desplegable dentro del chip.

## Añadir o ajustar una caja

Dentro de `cajas_material`:

```json
"mi_caja": {
  "nombre": "Nombre visible",
  "descripcion": "Para qué se usa",
  "canales": 8,
  "numeracion_inicio": 1,
  "conector": "par",
  "especiales": [
    { "clave": "gnd", "nombre": "GND", "conector": "individual", "color": "verde" }
  ]
}
```

Tipos de `conector`:

- `"par"` — una entrada roja+negra por número (agujas trenzadas/pareadas).
- `"individual"` — un círculo por número, una sola columna.
- `"individual_2col"` — individual repartido en 2 columnas (REF-AEP: 1-8 y 9-16).
- `"anodal_catodal"` — 2 columnas **independientes** con numeración compartida
  (TES MEP): izquierda anodal/roja, derecha catodal/negra.

`numeracion_inicio` sirve para que la caja 2 empiece en 9 en vez de en 1, como
en el equipo real. `especiales` son entradas fuera de la numeración (Ref, GND,
PEATC, DNS...), con `clave`, `nombre`, `conector` y opcionalmente `color` y
`nota`.

Los valores de `canales`/`conector` son aproximados a partir de fotos del
equipo — ajústalos si no cuadran.

## Añadir un escenario a mano en el JSON

```json
"clave_escenario": {
  "nombre": "Nombre visible de la cirugía",
  "modalidades": ["PESS", "PEM"],
  "asignaciones": {
    "registro_muscular_mmii": { "9": "l_ta", "10": "l_ah", "gnd": "tierra" },
    "tes_mep": { "6:anodal": "conmutador", "8:catodal": "grid8" }
  },
  "notas": "Texto que aparece en los avisos del resumen",
  "pendiente": "Algo sin confirmar; se muestra destacado"
}
```

Formato de las claves de entrada: `"3"` para un canal normal,
`"6:anodal"` / `"8:catodal"` en TES MEP, y la `clave` del especial
(`"ref"`, `"gnd"`, `"peatc"`, `"dns"`, `"extra_par"`).

## Retomar el proyecto desde otro ordenador

Clonar por primera vez:

```bash
git clone https://github.com/paniaguadediego-bit/checklist-mio-ionm.git
```

Antes de empezar a trabajar:

```bash
git pull
```

Al terminar tus cambios:

```bash
git add -A
git commit -m "Describe brevemente el cambio"
git push
```
