# MIO-Check

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
- `data/surgeries.js` — los datos de fábrica: `cajas_material`, `etiquetas`,
  `catalogo_material`, `tecnicas`, `servicios`, `intervenciones`,
  `perfiles_procedimiento` y `escenarios`. Casi todo esto ya se edita desde
  la propia web; este archivo es lo que viene de serie
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

**Cada ítem tiene un tipo físico fijo**, el de su etiqueta habitual — no se
cambia por colocación. Si un mismo material (un A1, por ejemplo) necesita ir
con sacacorchos en una cirugía y con aguja en otra, la forma de hacerlo es
tener dos ítems en el catálogo, uno para cada tipo, no cambiar el tipo de uno
sobre la marcha.

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
material por sí solas, pero dejan constancia de qué se va a hacer. Pulsando
el título se pliega, para dejar más sitio a las cajas.

El desplegable **Aplicar perfil** trae las combinaciones habituales por tipo
de procedimiento (supratentorial, troncoencéfalo, médula espinal, columna,
procesos vasculares, raíces y nervio periférico). Al elegir uno se marcan
sus técnicas de golpe — **el material colocado no se toca** — y su nota
aclaratoria aparece en los avisos del resumen.

Ambas listas se editan desde la interfaz, en el botón **Catálogos** (ver
abajo). También se pueden dejar de fábrica en `data/surgeries.js`.

## Catálogos: técnicas, servicios, intervenciones y perfiles

El botón **Catálogos** de la barra de herramientas abre una ventana con cuatro
pestañas. En todas funciona igual: **▲▼** para reordenar, el nombre para
editarlo, y **☑** para activar o desactivar.

- **Técnicas** — las 22 de partida (14 de monitorización + 8 de mapeo) y las
  que añadas. Lo que ves y cambias es la *etiqueta*; por dentro cada técnica
  tiene un identificador fijo que no cambia nunca. Por eso **renombrar una
  técnica actualiza también los casos que ya la usaban**, en vez de dejarlos
  colgando.
- **Servicios** — Neurocirugía, COT, ORL, Vascular, Endocrino, Maxilofacial y
  Urología, más los que quieras.
- **Intervenciones** — el tipo de cirugía, con su **código del hospital**.
  El código puede quedarse vacío: cuando lo rellenes se aplicará solo a todos
  los casos anteriores de ese tipo, sin tocarlos uno a uno.
- **Perfiles** — las combinaciones de técnicas del desplegable *Aplicar
  perfil*. Se pueden crear, editar y borrar.

**Desactivar no borra.** Una técnica desactivada deja de ofrecerse para casos
nuevos, pero sigue existiendo: los casos y escenarios que ya la tenían la
conservan, y se sigue viendo (tachada) para poder quitarla si hace falta. Por
eso técnicas, servicios e intervenciones no tienen botón de borrar: borrarlos
dejaría casos antiguos apuntando a algo inexistente.

Los escenarios se siguen editando desde la propia barra de herramientas
(*Nuevo*, *Duplicar*, *Renombrar*, *Vaciar*, *Borrar*).

Todo esto se guarda y se sincroniza igual que tus escenarios y tu material.

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

El botón **Imprimir resumen** saca solo esta sección en papel — sale entera
aunque la tengas plegada en pantalla en ese momento.

Va **el último**, debajo de las cajas: es el resumen de lo que se ha ido
colocando arriba. Igual que la tarjeta de Técnicas, se pliega pulsando el
título.

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

## Registrar casos

El botón **Casos** de la barra superior abre tus casos. Está siempre a mano.

**Al preparar**, con el montaje hecho, pulsa *Guardar este montaje como caso*.
El caso nace con las técnicas planificadas, el material a preparar, las cajas,
el montaje entero y los avisos: **nada de eso se teclea**, la herramienta ya lo
había calculado. Queda en estado *Preparado*.

**Al cerrar**, abre el caso desde la lista. Arriba está el **cierre rápido**:
fecha, **nombre del caso** (opcional, para reconocerlo tú de un vistazo —
nunca el nombre del paciente), edad, sexo, servicio, intervención, técnicas
realizadas (ya vienen marcadas las que planificaste, solo ajustas), si hubo
alerta, tu papel y notas. Con eso basta, y es cuestión de un par de minutos
desde el móvil. Debajo,
plegado, está **Ampliar** con lo demás: anestesia, material realmente usado
(precargado con el previsto), desarrollo, incidencias y formación. Se rellena
solo si quieres.

Pulsa *Cerrar caso* y pasa a *Cerrado*.

**Un caso preparado en el ordenador se cierra en el móvil**, o al revés: los
casos viajan por la misma sincronización que el resto, cada uno en su propio
archivo. No hay que exportar ni importar nada.

### Casos de días pasados y correcciones

- **Caso nuevo desde cero** registra una cirugía que nunca pasó por el
  checklist. Nace ya cerrado y sin material ni montaje, porque no los hubo.
- **La fecha se puede cambiar siempre**, también en un caso ya cerrado hace
  meses. Es la fecha de la cirugía y es la que cuenta para las estadísticas.
- La herramienta guarda por su cuenta *cuándo se creó el archivo* y *cuándo lo
  has tocado después*, sin que puedas editarlos. Así un caso de hace un mes
  registrado hoy no se confunde con uno de hoy.
- Cualquier caso cerrado se sigue pudiendo abrir y corregir, sin límite de
  tiempo.
- **Borrar caso**, abajo a la izquierda dentro de la ficha, quita un caso de
  en medio para siempre — un caso de prueba, uno duplicado, uno que no
  debiste registrar. Pide confirmación porque no se puede deshacer desde la
  propia herramienta. (El repositorio de datos sí guarda historial de git,
  así que en el peor de los casos sigue siendo recuperable a mano, igual que
  con el resto de tus datos — ver *Red de seguridad* en `CLAUDE.md`.) El
  botón solo aparece en un caso que ya guardaste al menos una vez.

### Qué NO se guarda

Ningún dato que identifique al paciente. Ni nombre, ni apellidos, ni NHC, ni
fecha de nacimiento. Solo el identificador del caso, edad, sexo y antecedentes
relevantes.

## Uso desde el móvil

La interfaz es táctil. Lo cómodo en el móvil es **pulsar y colocar**:
tocas el material, el catálogo se pliega solo para dejar ver las cajas, y
tocas la entrada de destino. En cuanto lo colocas, se suelta la selección y
el catálogo se despliega solo otra vez, listo para el siguiente ítem —un
material colocado no puede estar a la vez en otra entrada. Arrastrar no
funciona bien en pantallas táctiles, así que ese es el flujo recomendado.

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

## El dashboard: Google Sheet actualizado solo

El repositorio de datos es la fuente de verdad; el Google Sheet es
**desechable y se reconstruye entero cada vez**, nunca fila a fila. De ahí
sale gratis que una técnica nueva cree su columna sola, que renombrar una
técnica se propague a todo el histórico, y que no existan duplicados.

El código vive en [`apps-script/Codigo.gs`](apps-script/Codigo.gs). Se instala
una sola vez, en un Google Sheet tuyo:

1. **Crea un Google Sheet nuevo y vacío.** El nombre da igual.
2. **Extensiones → Apps Script.** Se abre un editor en una pestaña nueva.
3. Borra el contenido de `Código.gs` que trae por defecto y pega ahí todo el
   contenido de [`apps-script/Codigo.gs`](apps-script/Codigo.gs). Guarda
   (el icono del disquete, o Ctrl/Cmd+S).
4. **Un segundo token de GitHub**, distinto del que usa la app — ese token
   solo puede leer, y solo el repositorio de datos:
   - En GitHub: *Settings → Developer settings → Personal access tokens →
     Fine-grained tokens → Generate new token*.
   - *Repository access* → **Only select repositories** → el repositorio de
     datos (`checklist-mio-datos`).
   - *Permissions → Repository permissions* → **Contents: Read-only**. Nada
     más.
   - Genera el token y cópialo.
5. En el editor de Apps Script: el icono de engranaje **Configuración del
   proyecto** (barra lateral izquierda) → **Script Properties** → **Add
   script property**, y añade dos:
   - `GITHUB_TOKEN` — el token que acabas de crear.
   - `REPO_DATOS` — `paniaguadediego-bit/checklist-mio-datos`.
   
   (Hay una tercera, `REPO_CODIGO`, para el repositorio público de la app;
   no hace falta tocarla, ya trae el valor correcto por defecto.)
6. Arriba del editor, en el desplegable de funciones, elige
   **`crearDisparadorDiario`** y pulsa **▶ Ejecutar**. La primera vez Google
   pedirá autorizar el script — es tu propio script corriendo con tu propia
   cuenta, no una app externa pidiendo tus datos; pulsa *Avanzado* → *Ir a
   [nombre del proyecto] (no seguro)* → *Permitir*. Ese aviso lo da Google
   con cualquier script propio la primera vez, no es una señal de alarma.
   Esto deja el disparador diario instalado; no hace falta repetirlo.
7. Elige ahora **`reconstruirTodo`** en el mismo desplegable y pulsa
   **▶ Ejecutar**, para la primera reconstrucción. Al terminar, vuelve a la
   pestaña del Sheet: deberían haber aparecido las hojas `Casos`,
   `Tecnicas_long`, `Material_long`, `Listas` y `Meta`.

A partir de aquí funciona solo, una vez al día. Para forzarlo a mano sin
entrar al editor: recarga el Sheet y usa el menú **MIO-Check → Reconstruir
ahora** que aparece arriba.

**Si sale «API rate limit exceeded» leyendo `data/surgeries.js`:** ese error
no es cosa tuya — la lectura del repositorio público, sin autenticar, usa un
cupo de 60 peticiones/hora que **comparten todos los scripts de Apps Script
del mundo que salen por la misma IP de Google**, así que se agota con muy
poco. Si ves esto, asegúrate de tener la versión del código de este
repositorio: lee ese archivo por `raw.githubusercontent.com` en vez de por
la API, que tiene un cupo aparte y mucho más alto. Si aun así te sale,
espera unos minutos y pulsa *Reconstruir ahora* de nuevo.

**Cuando añadas una técnica nueva** desde el catálogo de la app, no hace
falta hacer nada aquí: en la siguiente reconstrucción (al día siguiente, o
al momento si pulsas *Reconstruir ahora*) su columna `TEC_<etiqueta>`
aparece sola. Igual si la renombras: el histórico entero se actualiza solo,
porque la columna se genera resolviendo el id contra el catálogo actual, no
guardando el nombre de cuando se creó el caso.

La hoja **Meta** avisa, sin romper nada, de: correlativos `ID_Caso`
duplicados, casos en estado *preparado* que llevan tiempo sin cerrarse, e
ids de técnica usados en algún caso que ya no existen en el catálogo.

## El dashboard: Looker Studio

Looker Studio se conecta directamente al Google Sheet de la fase anterior.
No hay nada que instalar ni ningún token nuevo — es la misma cuenta de
Google, y Looker vuelve a leer el Sheet cada vez que abres el informe (o
cuando pulsas el botón de actualizar).

### 0. Conectar las tres hojas

Cada tabla del Sheet (`Casos`, `Tecnicas_long`, `Material_long`) se conecta
como una **fuente de datos separada**, aunque las tres vivan en el mismo
documento — es así como funciona el conector de Hojas de cálculo de Looker
Studio.

1. Entra en [lookerstudio.google.com](https://lookerstudio.google.com) con
   la misma cuenta de Google del Sheet.
2. **Crear → Fuente de datos → Hojas de cálculo de Google.**
3. Elige tu Sheet y, dentro, la pestaña **`Casos`**. **Conectar.**
4. Comprueba el campo **`Fecha`**: en la lista de campos que aparece, su
   tipo debe salir como **Fecha**. Si sale como *Texto*, haz clic en el
   campo y cambia el tipo a *Fecha* a mano — a veces Looker no lo detecta
   bien la primera vez, y todos los gráficos por mes dependen de que este
   campo sea de tipo fecha de verdad.
5. **Crear informe** (o, si ya tienes uno, añade esta fuente a él).
6. Repite los pasos 2-4 dos veces más, una para la pestaña **`Tecnicas_long`**
   y otra para **`Material_long`**. Al final tendrás tres fuentes de datos
   en el mismo informe.

### 1. Total de casos, casos por mes, casos por servicio

Los tres usan la fuente **`Casos`**.

- **Total de casos** — inserta un **Marcador** (Scorecard). Métrica:
  **Recuento de registros**.
- **Casos por mes** — **Gráfico de columnas**. Dimensión: **Fecha**; haz
  clic en el campo dentro del gráfico y cambia su granularidad a
  **Año y mes**. Métrica: **Recuento de registros**. Ordena por la propia
  Fecha, ascendente.
- **Casos por servicio** — **Gráfico de columnas**. Dimensión: **servicio**.
  Métrica: **Recuento de registros**. Ordena por la métrica, descendente,
  para ver primero el servicio con más casos.

### 2. Técnicas más usadas y su evolución mensual

Los dos usan la fuente **`Tecnicas_long`** — está en formato largo (una fila
por técnica realmente marcada en cada caso), que es justo lo que necesita
Looker para contar y agrupar sin que tengas que tocar nada.

- **Técnicas más usadas** — **Gráfico de barras** (horizontal, se lee mejor
  con muchas categorías). Dimensión: **Tecnica**. Métrica: **Recuento de
  registros**. Ordena por la métrica, descendente.
- **Evolución mensual** — **Gráfico de series temporales**. Dimensión de
  tiempo: **Fecha** (granularidad Año y mes). Métrica: **Recuento de
  registros**. Campo de desglose (*Breakdown dimension*): **Tecnica**.

  Con 22 técnicas o más, una línea por cada una es ilegible de un vistazo.
  Te recomiendo añadir, junto a este gráfico, un **Control de filtro**
  (desplegable de selección múltiple) sobre el campo **Tecnica**, para poder
  elegir tú a mano las 3 o 4 que quieras comparar cada vez, en vez de verlas
  todas encima unas de otras.

### 3. Tasa de alertas y concordancia VP/FP/VN/FN

Los dos usan la fuente **`Casos`**.

- **Tasa de alertas** — **Marcador**. Métrica: **alerta**, pero cambia su
  **agregación por defecto de Suma a Media** (clic en el campo de la
  métrica dentro del gráfico → *Tipo de agregación* → *Media*). Como
  `alerta` ya es `1`/`0` por caso, la media de esa columna **es** la tasa de
  alertas directamente — un 0,18 significa 18 % de los casos con alerta. En
  el estilo del marcador, pon el formato de número en **Porcentaje**.
- **Concordancia VP/FP/VN/FN** — **Gráfico circular** (donut). Dimensión:
  **concordancia**. Métrica: **Recuento de registros**. Añade un filtro al
  propio gráfico (*Añadir un filtro* en el panel derecho) con la condición
  **concordancia — No es nulo**, para que los casos sin ese dato relleno no
  aparezcan como una porción más.

### 4. Evolución de mi rol

Fuente **`Casos`**. **Gráfico de columnas apiladas.** Dimensión: **Fecha**
(granularidad Año y mes). Campo de desglose: **rol**. Métrica: **Recuento
de registros**. Cada barra mensual se reparte entre *observo*,
*supervisado* y *autonomo* según lo que marcaste en cada caso de ese mes —
así se ve, mes a mes, cómo se va corriendo el peso hacia la autonomía.

*(Opcional, solo si te importa que el orden dentro de cada barra sea
siempre observo → supervisado → autónomo y no el alfabético que pone Looker
por defecto: crea un **Campo calculado** en la fuente `Casos` llamado
`Orden_rol` con la fórmula
`CASE WHEN rol="observo" THEN 1 WHEN rol="supervisado" THEN 2 WHEN rol="autonomo" THEN 3 END`,
y ordena el desglose del gráfico por ese campo. No afecta a los datos, solo
al orden visual.)*

### 5. Material consumido acumulado

Fuente **`Material_long`**. **Gráfico de barras** (horizontal). Dimensión:
**Tipo**. Métrica: **Cantidad_real**, con agregación **Suma**. Ordena por
la métrica, descendente. Si quieres comparar lo previsto contra lo
realmente gastado, añade una segunda métrica **Cantidad_prevista** (también
en Suma): salen las dos barras una junto a la otra por tipo de material.

### 6. Filtros por fecha y por servicio

Estos dos van sueltos en la parte de arriba del informe, no dentro de un
gráfico concreto, para que afecten a todos a la vez:

1. **Insertar → Control → Control de intervalo de fechas.** No importa qué
   fuente de datos elijas al crearlo (usa `Casos`, por ejemplo): como las
   tres fuentes tienen un campo llamado exactamente **Fecha**, el filtro
   alcanza a los gráficos de las tres.
2. **Insertar → Control → Control de filtro**, tipo *Lista desplegable*.
   Campo: **servicio**. Por el mismo motivo —el campo se llama igual en
   `Casos` y en `Tecnicas_long`— este filtro alcanza también al gráfico de
   técnicas más usadas.

   `Material_long` **no tiene** columna de servicio —por diseño: el gasto de
   material se cuenta por caso y por tipo, no por servicio—, así que este
   filtro concreto no toca el gráfico de material consumido. No es un fallo,
   es que esa hoja no distingue por servicio.

### Cuando añadas una técnica nueva

**No hace falta tocar nada en Looker** para los gráficos de arriba: viven
sobre `Tecnicas_long`, que guarda las técnicas como texto en una columna
(`Tecnica`), no como columnas separadas. Una técnica nueva es, sencillamente,
un valor de texto más que puede aparecer en esa columna, y Looker lo recoge
solo la próxima vez que refresque los datos.

Donde sí hace falta un paso manual es si algún día quieres montar **un
gráfico nuevo que use directamente una columna `TEC_<etiqueta>` de la hoja
`Casos`** (por ejemplo, un marcador para el uso de una sola técnica muy
concreta). Esas columnas se generan solas en el Sheet, pero Looker Studio
memorizó la lista de columnas que había el día que conectaste la fuente, y
no vigila el Sheet para ver si han aparecido nuevas. Para que las vea:

1. **Recursos → Gestionar las fuentes de datos** (o el icono de fuentes de
   la barra lateral).
2. Elige la fuente **`Casos`** → **Editar**.
3. Pulsa **Actualizar campos** (el icono de refrescar junto a la lista de
   campos, arriba a la derecha del editor de campos).
4. Guarda. La columna `TEC_<etiqueta>` nueva ya aparece en la lista, lista
   para usarla en cualquier gráfico. Los gráficos que ya tenías no cambian
   solos: hay que añadirla tú a mano al gráfico en el que quieras usarla.

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
