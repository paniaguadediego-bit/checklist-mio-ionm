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
- `app.js` — lógica: catálogo, etiquetas, cajas, arrastrar y soltar, resumen
- `data/surgeries.js` — **el archivo que normalmente vas a tocar**, con los
  bloques `cajas_material`, `etiquetas`, `catalogo_material`, `tecnicas`,
  `perfiles_procedimiento` y `escenarios`
- `data/i18n-en.js` — la traducción al inglés de todo lo anterior

## Idioma

El botón **EN / ES** de la barra superior cambia entre castellano e inglés al
instante, sin recargar ni perder nada. Se recuerda en ese navegador, y en la
primera visita se propone el del sistema.

Cambia toda la interfaz y también los datos: nombres y descripciones de las
cajas, etiquetas, categorías del catálogo, notas de los ítems, técnicas,
perfiles y los escenarios de fábrica. **Lo que escribes tú se queda como lo
escribiste** —tus escenarios, tus etiquetas y tu material propio— porque no
hay forma de traducirlo solo.

El inglés vive en [`data/i18n-en.js`](data/i18n-en.js), separado de
`data/surgeries.js` para que este siga siendo el archivo de trabajo. Allí solo
hay texto, localizado por el `id` de cada cosa; lo que no esté traducido se
queda en castellano. Para añadir otro idioma, ese mismo archivo explica los
cuatro pasos.

## Modo quirófano

El botón **Modo quirófano** (arriba a la derecha) oculta el catálogo, las
técnicas y los botones de edición, y deja solo el resumen —fijado en la
parte superior— y las cajas montadas, en una rejilla compacta que se ve de
un vistazo. Está pensado para consultar durante la cirugía, no para editar.
El selector de escenario sigue accesible, y se puede seguir quitando o
moviendo material si hace falta un ajuste sobre la marcha.

El modo se recuerda entre sesiones en ese navegador.

## Cómo funciona

### 1. Catálogo maestro

`catalogo_material` es la lista de **todo** el material que se puede colocar
en una entrada: electrodos corticales, músculos, estimulaciones periféricas,
GRID, tierras... Vive en un **panel lateral fijo** que no se mueve al hacer
scroll, así que siempre lo tienes a mano aunque estés mirando la última caja.
Está agrupado por categorías y tiene buscador; el botón ▾ lo pliega si
necesitas más sitio.

Hay dos formas de colocar material, y un mismo ítem se puede usar tantas
veces como haga falta (el catálogo no se "gasta"):

- **Pulsar y colocar** (recomendado, sin arrastrar): pulsa el ítem — se
  queda resaltado y aparece una barra abajo — y luego pulsa la entrada donde
  va. Sigue seleccionado, así que puedes colocarlo en varias entradas
  seguidas. `Esc` o el botón *Cancelar* lo suelta.
- **Arrastrar y soltar**: arrastra el ítem hasta la entrada. Si te acercas
  al borde superior o inferior de la ventana, la página hace scroll sola.

**Material extra**: la última categoría del catálogo (auriculares PEATC,
gafas VEP...) es material que se prepara pero no se conecta a ninguna
entrada. Esos ítems no se arrastran: funcionan como interruptor — pulsas
para activarlos (☑) y aparecen en el resumen; pulsas otra vez para
quitarlos. En el JSON se marcan con `"sin_entrada": true`, en el ítem o en
la categoría entera.

### 2. Etiquetas (tipos físicos)

Una **etiqueta** es de qué está hecho el ítem: aguja trenzada, sacacorchos,
pegatina, hook wire… Hace dos cosas a la vez:

- **Es lo que se cuenta** en «Material a preparar». Dos ítems con la misma
  etiqueta se suman juntos.
- **Es lo que se ve**: cada etiqueta tiene forma de borde (sólido, punteado,
  discontinuo, doble, grueso), color de borde y tinte de fondo, así que
  reconoces el tipo de material de un vistazo sin leer el nombre.

El botón **Etiquetas** de la cabecera del catálogo abre el gestor: crear
nuevas, editar cualquiera —también las de fábrica— y borrarlas. Cada etiqueta
muestra cuántos materiales la usan. Al borrar una, el material que la tenía
se reasigna a otra en vez de quedarse huérfano; se avisa antes.

**Un mismo ítem con distinto material según la cirugía.** Un A1 (mastoides)
puede ir con sacacorchos en un caso y con aguja en otro. No hace falta
duplicarlo: el ítem lleva su etiqueta habitual, y **una vez colocado en una
entrada, el desplegable del chip cambia el tipo solo para ese escenario**. El
recuento se ajusta solo. Si mueves el chip a otra entrada, se lleva su tipo.

**Excepciones por ítem.** En el editor de material (botón **+**), el bloque
*Aspecto* deja sobreescribir borde, color o fondo para un ítem concreto
dejando el resto heredado de la etiqueta. Así, con pegatinas de estímulo
puedes tener `L.Mediano` con borde rojo y `R.Mediano` con borde negro,
aunque las dos cuenten como «Pegatinas (par)».

### 3. Cajas físicas

`cajas_material` describe las cajas reales del INOMED. Cada caja se dibuja
con sus entradas y conectores. Para quitar material de una entrada: pulsa la
✕ del chip o arrástralo de vuelta al panel del catálogo. Para moverlo:
arrástralo a otra entrada, aunque sea de otra caja.

### 4. Técnicas y perfiles

La tarjeta **Técnicas** lista las técnicas de monitorización y de mapeo.
Se marcan pulsándolas y salen en el resumen. Son informativas: no calculan
material por sí solas, pero dejan constancia de qué se va a hacer.

El desplegable **Aplicar perfil** trae las combinaciones habituales por tipo
de procedimiento (supratentorial, troncoencéfalo, médula espinal, columna,
procesos vasculares, raíces y nervio periférico). Al elegir uno se marcan
sus técnicas de golpe — **el material colocado no se toca** — y su nota
aclaratoria aparece en los avisos del resumen.

Ambas listas se editan en `data/surgeries.js`, en los bloques `tecnicas` y
`perfiles_procedimiento`.

### 5. Escenarios (presets)

Cada escenario guarda **qué material va en qué entrada de qué caja**. La
barra de herramientas permite crear, duplicar, renombrar, vaciar y borrar
escenarios.

### 6. Resumen de material

Se recalcula solo con cada cambio y es el objetivo de la herramienta:

- **Material a preparar** — recuento por tipo (agujas subdérmicas, agujas
  trenzadas, pegatinas, sacacorchos...)
- **Cajas necesarias** — cuáles, con entradas usadas / totales y el detalle
  de qué va en cada entrada
- **Avisos** — cajas completas sin entradas libres, notas del escenario y
  cosas pendientes de confirmar

El botón **Imprimir resumen** saca solo esta sección en papel.

## Añadir material propio desde la interfaz

El botón **+** de la cabecera del catálogo abre un formulario para crear
material nuevo sin tocar ningún archivo: nombre, categoría, **etiqueta**,
excepciones de aspecto, nota y si ocupa entrada o no. La categoría tiene
sugerencias de las existentes — conviene reutilizarlas. Si te falta un tipo
físico, **Gestionar…** abre el gestor de etiquetas sin cerrar el formulario.

El material propio lleva un lápiz (✎) para editarlo o borrarlo. Al borrarlo,
avisa de en cuántas entradas está colocado y lo quita también de ahí. Un ítem
propio con el mismo `id` que uno de fábrica lo **sustituye** en su sitio, así
que también puedes retocar el material que viene de serie.

Ejemplo: añades `L.Frontalis` en la categoría *Músculos craneales* con la
etiqueta `Electrodo Hook Wire`, y lo colocas donde quieras; el resumen sumará
ese hook wire al total. Otro: `R.Delt` con la etiqueta *Aguja trenzada (par)*
y borde punteado para distinguirlo del resto del grupo.

## Uso desde el móvil

La interfaz es táctil. Lo cómodo en el móvil es **pulsar y colocar**:
tocas el material, el catálogo se pliega solo para dejar ver las cajas, y
tocas la entrada de destino. Arrastrar no funciona bien en pantallas
táctiles, así que ese es el flujo recomendado.

La web está publicada con **GitHub Pages**:

**https://paniaguadediego-bit.github.io/checklist-mio-ionm/**

Cada `git push` a `main` la actualiza sola en un par de minutos. Merece la pena
guardarla en la pantalla de inicio del móvil (en Chrome, *⋮ → Añadir a pantalla
de inicio*): se abre como una app, a pantalla completa y sin barra del
navegador.

> La web y el repositorio del código son **públicos**. No contienen ningún dato
> de paciente, ningún token ni ninguna referencia al centro. Tus escenarios,
> etiquetas y material propio **no viajan ahí**: viven en tu navegador y se
> sincronizan con un repositorio de datos **privado** aparte (ver abajo).

## Dónde se guarda todo, y cómo pasarlo de un dispositivo a otro

Los cambios se guardan **automáticamente en ese navegador y ese
dispositivo** (localStorage). No tocan `data/surgeries.js`. Si conectas la
sincronización (siguiente apartado), además viajan solos entre dispositivos;
si no, el navegador del móvil y el del ordenador son almacenes distintos.

Para pasar tu trabajo de uno a otro a mano:

1. **Exportar copia** descarga un `.json` con **todo**: escenarios, etiquetas,
   material propio y qué va en cada entrada.
2. Pasa ese archivo al otro dispositivo (correo, nube, cable…).
3. **Importar copia** allí. Avisa de cuántos escenarios y materiales trae, y
   sustituye lo que hubiera en ese navegador.

Ese mismo archivo sirve de copia de seguridad: si el navegador borra los
datos del sitio, se recupera importándolo.

### Sincronización automática con GitHub

El botón **☁** de la barra superior conecta la herramienta con un repositorio
privado de GitHub que hace de nube. Es gratis: los repos privados, los tokens
y la API de GitHub no cuestan nada.

Preparación, una sola vez y en un solo dispositivo:

1. Crea un repositorio **privado y vacío** solo para los datos, por ejemplo
   `checklist-mio-datos`. **No uses el del código**: es público, dejaría los
   escenarios a la vista, y así el token tampoco puede tocar el código.
2. En GitHub: *Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token*.
3. En *Repository access*, **Only select repositories** → solo el de datos.
4. En *Permissions → Repository permissions*, **Contents: Read and write**.
   Nada más.
5. Pega el token y `usuario/repositorio` en el diálogo del botón ☁.

Repite el paso 5 con el mismo token en el móvil, y los dos quedan conectados.

**A partir de ahí funciona solo:**

- Al abrir la web **baja** lo último que haya en el repositorio.
- Unos segundos después de cada cambio, lo **sube**.
- En **Modo quirófano** la subida se **pausa**: durante la cirugía no se toca
  la red. Al salir del modo, se manda todo lo acumulado.
- **Sin conexión** sigue funcionando con normalidad y reintenta cuando vuelve.
- Si has tocado algo en el móvil sin subirlo y abres el ordenador, **no se
  pisa nada**: sube lo tuyo en vez de bajar.
- Si dos dispositivos han cambiado cosas distintas, avisa de **Conflicto** y
  decides tú con **Subir** o **Bajar** desde el diálogo. Nunca sobrescribe sin
  preguntar.

El estado se ve en el propio botón: *Sin conectar*, *Guardando…*, *En pausa*,
*Sinc. 12/08 19:30*, *Sin subir* o *Conflicto*.

El token se guarda solo en ese navegador. **Desconectar** lo borra del
dispositivo (no toca ni tus escenarios ni lo guardado en GitHub), y siempre
puedes revocarlo desde GitHub.

Si además quieres que un preset venga de fábrica en el repositorio, pega su
bloque en `data/surgeries.js` dentro de `"escenarios"` y haz `git commit` +
`git push`.

**Restablecer** borra lo guardado en el navegador y vuelve a los escenarios
y al catálogo del archivo.

## Añadir material al catálogo editando el archivo

Se puede hacer desde la interfaz con el botón **+** (ver arriba); esto es
para material que quieras que venga de fábrica en el repositorio. Dentro de
`catalogo_material`, en la categoría que corresponda (o crea una nueva),
añade un objeto:

```json
{ "id": "l_gluteo", "nombre": "L.Glúteo", "etiqueta": "aguja_trenzada", "nota": "Glúteo izquierdo" }
```

- `id` — identificador único, sin espacios. Es lo que se guarda en los presets.
- `nombre` — lo que se ve en el chip.
- `etiqueta` — el `id` de una etiqueta del bloque `etiquetas`. Es **lo que se
  cuenta en el resumen** y de dónde saca el chip su aspecto.
- `color` *(opcional)* — sobreescribe el color del borde que pone la etiqueta.
  `rojo`, `azul`, `verde`, `amarillo`, `negro`, `naranja`, `morado`,
  `turquesa`, `gris` o un hex `#c04a2b`. Código del INOMED: C1/C5 verde,
  C2/C6 amarillo, C3 y C3' rojo, C4 y C4' azul.
- `borde` / `fondo` *(opcionales)* — igual, para la forma del borde y el tinte.
- `nota` *(opcional)* — texto que sale al pasar el ratón.
- `conmutador` + `opciones` *(opcional)* — para un ítem que ocupa una sola
  entrada pero se subdivide por software (el canal 6 anodal de TES MEP).
  Genera un desplegable dentro del chip.

## Añadir una etiqueta editando el archivo

Se hace desde la interfaz con el botón **Etiquetas**; esto es para las que
quieras de fábrica. Dentro de `etiquetas`:

```json
{ "id": "electrodo_copa", "nombre": "Electrodo de copa", "borde": "punteado", "color": "naranja", "fondo": "amarillo" }
```

- `borde` — `solido`, `punteado`, `discontinuo`, `doble`, `grueso` o `ninguno`.
- `color` — color del borde, del juego de arriba o un hex.
- `fondo` — tinte suave de fondo, o `ninguno`.

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
  "etiquetas": { "registro_cortical/1": "aguja_subdermica" },
  "notas": "Texto que aparece en los avisos del resumen",
  "pendiente": "Algo sin confirmar; se muestra destacado"
}
```

Formato de las claves de entrada: `"3"` para un canal normal,
`"6:anodal"` / `"8:catodal"` en TES MEP, y la `clave` del especial
(`"ref"`, `"gnd"`, `"peatc"`, `"dns"`, `"extra_par"`).

`etiquetas` es opcional y solo hace falta cuando una colocación concreta lleva
un tipo físico distinto del habitual del ítem. La clave es
`"caja/entrada"` y el valor, el `id` de la etiqueta:
`{ "registro_cortical/1": "aguja_subdermica" }`.

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
