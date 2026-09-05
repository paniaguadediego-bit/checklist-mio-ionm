# MIO-Check

Herramienta interna, sin backend ni build step, para montar el material de
cada cirugía monitorizada y saber exactamente qué hace falta.

**Pantalla de inicio (06-09-2026):** el logo de la cabecera lleva siempre a
una pantalla con 6 tarjetas — **Organizador de Montajes**, **Gestión de
Casos**, **Técnicas IONM**, **Docencia**, **Simulador** y **Bibliografía**—,
cada una su propio espacio de trabajo. Se pulsa una y se trabaja solo ahí;
el logo es el único camino de vuelta al inicio, no hay más navegación
cruzada entre pantallas. Las tres últimas están de momento "en
construcción" — ver *Pantallas nuevas, pendientes de contenido* más abajo.

**Flujo de uso previsto:** el día antes de la cirugía abres o creas una
**plantilla** —un montaje tuyo o de un compañero, desde **Organizador de
Montajes**—, ajustas las entradas de las cajas pulsando o arrastrando
material, y el **Resumen** te dice qué tienes que preparar, qué cuesta y si
te sobran o faltan entradas y cajas. Cuando la cirugía es real, guardas ese
montaje como **caso** en **Gestión de Casos**: la plantilla es el molde y
se reutiliza, el caso es lo que pasó ese día y no cambia aunque la
plantilla cambie después. Un rótulo permanente, justo debajo de la
cabecera, dice siempre cuál de las dos cosas estás tocando, en cualquier
pantalla. **Docencia** trae miotomas y colocación de cajas según la
posición del paciente, sin relación con la preparación del material, y una
**Guía de uso** (menú **⋮**) resume lo esencial para empezar sin tener que
leer este archivo.

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
- `app.js` — toda la lógica, en un único archivo
- `data/surgeries.js` — los datos de fábrica: `cajas_material`, `etiquetas`,
  `catalogo_material`, `tecnicas`, `servicios`, `intervenciones`,
  `perfiles_procedimiento`, `escenarios_tipo` (los tipos de cirugía, inerte)
  y `miotomas` (para la ventana Docente). `escenarios` (montajes de fábrica)
  está vacío a propósito desde el 03-09-2026 — ver *Añadir un montaje de
  fábrica a mano en el JSON* más abajo. Casi todo esto ya se edita desde la
  propia web; este archivo es lo que viene de serie
- `data/i18n-en.js` — la traducción al inglés de todo lo anterior
- `data/guia.js` — el texto de la Guía de uso dentro de la propia
  herramienta (menú **⋮** de la barra superior); solo en castellano por ahora
- `img/` — el icono de la app (favicon, icono de "añadir a pantalla de
  inicio", logo de la cabecera), `img/sondas/` (fotos de referencia de
  algunas sondas, ver *Fotos de referencia del material* más abajo) y
  `manifest.json` para el acceso directo en Android
- `apps-script/Codigo.gs` — el script de Google Apps que reconstruye el
  Google Sheet (ver más abajo); no se sirve por GitHub Pages, se pega a mano
  en el editor de Apps Script

## Idioma

El botón **EN / ES** de la barra superior cambia entre castellano e inglés al
instante, sin recargar ni perder nada. Se recuerda en ese navegador, y en la
primera visita se propone el del sistema.

Cambia toda la interfaz y también los datos: nombres y descripciones de las
cajas, etiquetas, categorías del catálogo, notas de los ítems, técnicas,
perfiles y los montajes de fábrica. **Lo que escribes tú se queda como lo
escribiste** —tus montajes, tus etiquetas y tu material propio— porque no
hay forma de traducirlo solo.

El inglés vive en [`data/i18n-en.js`](data/i18n-en.js), separado de
`data/surgeries.js` para que este siga siendo el archivo de trabajo. Allí solo
hay texto, localizado por el `id` de cada cosa; lo que no esté traducido se
queda en castellano. Para añadir otro idioma, ese mismo archivo explica los
cuatro pasos.

## Guía de uso, dentro de la propia herramienta

Botón **⋮** de la barra superior (agrupa Idioma y Guía de uso, de consulta
ocasional — Técnicas IONM y Docencia vivían aquí hasta el 06-09-2026, ahora
son tarjetas de la pantalla de inicio) → **Guía de uso**. Seis tarjetas cortas (qué es la
herramienta, el flujo de un día, que plantilla y caso no son lo mismo,
catálogo/etiquetas, cajas/resumen, y lo demás) más un acordeón con quince
puntos más detallados, todos plegados. Es la versión corta y orientada a la
tarea —pensada para el móvil, a las 7:30 antes de entrar a quirófano—; este
README sigue siendo la documentación de referencia. Contenido estático de
[`data/guia.js`](data/guia.js), solo en castellano por ahora: en inglés
avisa de que todavía no está traducida en vez de mostrarla a medias.

## Organizador de Montajes: el banco de trabajo, en el orden en que se trabaja

Es la primera tarjeta de la pantalla de inicio. Dentro: Montajes → Técnicas
→ Catálogo → Cajas → Resumen. Es un banco único: el mismo tanto si estás
editando una plantilla suelta como si estás corrigiendo el material de un
caso concreto — nunca hay dos copias de estas cinco tarjetas (corregir el
material de un caso desde **Gestión de Casos** te trae aquí mismo, con el
rótulo permanente en verde sólido avisando de que estás mid-corrección).
Cada una se pliega sola (menos el catálogo, que en pantalla ancha es la
columna lateral fija de siempre, y que se pliega pulsando su barra entera,
no solo la flechita). **Arrancan todas plegadas, salvo Montajes** —al ser
lo primero que se ve al entrar aquí, desde el 05-09-2026 se abre sola—;
despliega las demás según te interese en cada momento. El orden es el del
flujo real: qué montaje cargas, qué técnicas vas a hacer, qué material hay, dónde va y qué
sale de todo ello.

Qué montaje hay cargado en ese banco de trabajo se elige aparte, desde la
tarjeta **Montajes** o desde la ficha de un caso. Un **rótulo permanente**,
justo debajo de la cabecera, dice siempre cuál de los dos estás tocando:
*«Plantilla: ECL con mapeo»* en gris/verde suave, o *«CASO 2026-011,
Meningioma APC»* en verde sólido con los botones de corrección en su lugar,
cuando estás dentro de un caso.

### La tarjeta Montajes (la biblioteca de plantillas)

Primera tarjeta de la página, y la única que empieza **desplegada** —al ser
la pantalla principal, para que las plantillas estén a la vista sin tener
que pulsar nada—. Lista plana con buscador por nombre o autor, siempre en
**orden alfabético** —da
igual de quién sea cada montaje, y también para los que vayas creando—, y
cuántas entradas tiene ocupadas cada uno. **+ Montaje en blanco**, fijo
arriba de la lista, crea uno nuevo y vacío al momento. Elegir un montaje
**lo carga directo en el banco de trabajo y pliega la tarjeta sola, sin
preguntar** — no hay ningún riesgo: cada montaje es su propio archivo y el
anterior se queda guardado tal cual.

**Duplicar, Renombrar, Vaciar y Borrar** actúan sobre el montaje que tengas
cargado en ese momento. **Guardar montaje** pregunta cada vez si quieres
sobrescribir el activo o guardarlo como uno nuevo — una confirmación
explícita, aparte del guardado automático de siempre en cada colocación.
Cada montaje muestra su **autor**: los tuyos llevan una marca lateral para
reconocerlos entre los de un compañero, y **solo el autor puede renombrar,
vaciar o borrar el suyo** (tampoco puede sobrescribirlo con *Guardar
montaje* si no es suyo) — cualquiera puede *duplicarlo* (es la forma de
partir del molde de otro para hacerte el tuyo; la copia nace a tu nombre).
**Esto no es seguridad de verdad**: cambiar de perfil (ver abajo) salta el
candado sin más, porque la herramienta no tiene backend que pueda
impedirlo. Es solo para no pisarse el trabajo entre compañeros sin querer.

> No vienen montajes de fábrica desde el 03-09-2026 (decisión del usuario):
> la biblioteca empieza vacía y se llena con lo que tú y tus compañeros
> guardéis. Ver *Añadir un montaje de fábrica a mano en el JSON* más abajo
> si alguna vez hace falta volver a sembrar alguno.

**Perfil de usuario** (arriba a la izquierda, junto al logo): quién eres.
Sirve para firmar tus montajes. Se crea la primera vez desde ese mismo
desplegable, escribiendo tu nombre — no hay contraseña ni registro. El
perfil elegido se recuerda en ese navegador y no viaja en la sincronización:
es de tu dispositivo, no del equipo.

### 1. Técnicas

Lista las técnicas de monitorización y de mapeo. Se marcan pulsándolas y
salen en el resumen. Son informativas: no calculan material por sí solas,
pero dejan constancia de qué se va a hacer.

> Hasta el 05-09-2026 esta tarjeta tenía además un desplegable **Perfil** que
> resaltaba las técnicas habituales por tipo de procedimiento. Se retiró a
> petición del usuario, que ya no lo necesitaba. El catálogo *Perfiles* de
> Catálogos sigue existiendo (ver más abajo) pero ya no lo usa nada de la
> interfaz.

### 2. Catálogo

`catalogo_material` es la lista de **todo** el material que se puede colocar
en una entrada: electrodos corticales, músculos, estimulaciones periféricas,
GRID, sondas, tierras... Agrupado en categorías plegables con buscador,
cada una abierta o cerrada de fábrica según se use más o menos a menudo. En
pantalla ancha es la **columna lateral fija** de siempre, así que siempre lo
tienes a mano aunque estés mirando la última caja; en el móvil va en su
sitio dentro del flujo del banco de trabajo, y se pliega solo al colocar
material para dejar ver las cajas.

Hay dos formas de colocar material, y un mismo ítem se puede usar tantas
veces como haga falta (el catálogo no se "gasta"):

- **Pulsar y colocar** (recomendado, sin arrastrar): pulsa el ítem del
  catálogo — se queda resaltado y aparece una barra abajo — y luego pulsa la
  entrada donde va. Sigue seleccionado, así que puedes colocarlo en varias
  entradas seguidas. `Esc` o el botón *Cancelar* lo suelta. También al
  revés: pulsa una entrada vacía y elige el material desde ahí, con el mismo
  catálogo filtrado a lo que ocupa entrada.
- **Arrastrar y soltar**: arrastra el ítem hasta la entrada. Si te acercas
  al borde superior o inferior de la ventana, la página hace scroll sola.

**Material extra**: la última categoría del catálogo (auriculares PEATC,
gafas VEP...) es material que se prepara pero no se conecta a ninguna
entrada. Esos ítems no se arrastran: funcionan como interruptor — pulsas
para activarlos (☑) y aparecen en el resumen; pulsas otra vez para
quitarlos. En el JSON se marcan con `"sin_entrada": true`, en el ítem o en
la categoría entera.

#### Etiquetas (tipos físicos)

Una **etiqueta** es de qué está hecho el ítem: aguja trenzada, sacacorchos,
pegatina, hook wire… Hace tres cosas a la vez:

- **Es lo que se cuenta** en «Material a preparar». Dos ítems con la misma
  etiqueta se suman juntos.
- **Es lo que se ve**: cada etiqueta tiene forma de borde (sólido, punteado,
  discontinuo, doble, grueso), color de borde y tinte de fondo, así que
  reconoces el tipo de material de un vistazo sin leer el nombre.
- **Es de donde sale el coste**: `precio` por unidad y si es `fungible` (se
  gasta) o no (se prepara, no se gasta, no cuenta en el coste). Ver *Coste
  del material* más abajo.

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

#### Fotos de referencia del material

Algunos ítems —de momento, varias de las sondas— llevan un icono **📷** junto
al nombre del chip. Lo pulsas y abre una foto de referencia en un visor
propio, sin salir de la herramienta ni depender de conexión: útil para
identificar a simple vista cuál es cuál antes de una cirugía. Funciona igual
en el catálogo, en el selector que se abre desde una entrada, y ya colocado
en una caja. No hay editor desde la interfaz todavía: se añade a mano, con
la clave opcional `"foto"` del ítem en `data/surgeries.js` apuntando a un
archivo dentro de `img/` (ver *Añadir material al catálogo editando el
archivo* más abajo).

### 3. Cajas

`cajas_material` describe las cajas reales del INOMED. Cada caja se dibuja
con sus entradas y conectores. Para quitar material de una entrada: pulsa la
✕ del chip, arrástralo de vuelta al panel del catálogo, o pulsa la entrada
y elige "Dejar la entrada vacía". Para moverlo: arrástralo a otra entrada,
aunque sea de otra caja.

Las cajas 3 a 6 ("Caja etiqueta 3"… "Caja etiqueta 6") son de refuerzo, para
cirugías más amplias que necesiten más canales de registro muscular de los
habituales — se usan poco, así que cada una **se pliega aparte y arranca
cerrada**: solo se despliega la que vayas a usar en ese caso.

### 4. Resumen de técnicas y material

Se recalcula solo con cada cambio y es el objetivo de la herramienta:

- **Material a preparar** — recuento por tipo (agujas subdérmicas, agujas
  trenzadas, pegatinas, sacacorchos...)
- **Coste del material** — unitario × cantidad por tipo y total de la
  intervención, solo del material fungible (lo reutilizable —sondas, gafas,
  auriculares— se prepara pero no se gasta, y no cuenta). Los precios se
  ponen uno por uno en el botón **Etiquetas**; un tipo sin precio se lista
  aparte en vez de contar como cero, para que el total no parezca completo
  sin serlo. Alguna etiqueta —la manta de electrodos GRID, por ejemplo— viene
  marcada **"Se cobra por manta"**: cuenta 1 unidad de coste sin importar
  cuántas de sus entradas se coloquen, porque el conjunto entero se abre
  igual se use una tira o las ocho.
- **Cajas necesarias** — cuáles, con entradas usadas / totales y el detalle
  de qué va en cada entrada
- **Avisos** — notas del montaje y cosas pendientes de confirmar

El botón **Imprimir resumen** saca solo esta sección en papel — sale entera
aunque la tengas plegada en pantalla en ese momento.

## Catálogos: técnicas, servicios, intervenciones, perfiles y usuarios

El botón **Catálogos**, en la barra superior junto al selector de perfil,
abre una ventana con cinco pestañas. En todas funciona igual: **▲▼** para
reordenar, el nombre para editarlo, y **☑** para activar o desactivar.
Arriba del todo, dentro de ese mismo diálogo, están **Importar copia,
Exportar copia, Imprimir y Restablecer** (ver *Dónde se guarda todo* más
abajo).

- **Técnicas** — las de partida (monitorización y mapeo) y las que añadas.
  Lo que ves y cambias es la *etiqueta*; por dentro cada técnica tiene un
  identificador fijo que no cambia nunca. Por eso **renombrar una técnica
  actualiza también los casos que ya la usaban**, en vez de dejarlos
  colgando.
- **Servicios** — Neurocirugía, COT, ORL, Vascular, Endocrino, Maxilofacial y
  Urología, más los que quieras.
- **Intervenciones** — la descripción de la cirugía concreta, con su
  **código del hospital**. El código puede quedarse vacío: cuando lo
  rellenes se aplicará solo a todos los casos anteriores de ese tipo, sin
  tocarlos uno a uno. Es independiente del campo *Intervención* del caso
  (texto libre, ver más abajo).
- **Perfiles** — las combinaciones de técnicas que antes alimentaban el
  desplegable *Perfil* de la tarjeta Técnicas (retirado el 05-09-2026, ver
  más arriba). Se pueden seguir creando, editando y borrando, pero de
  momento no los usa ninguna otra parte de la interfaz.
- **Usuarios** — quién puede firmar montajes (ver la tarjeta *Montajes*
  arriba). Vacío de fábrica a propósito: los nombres de personas reales no
  se escriben en el repositorio público del código, se crean desde la app y
  viven en el repositorio privado de datos.

> El catálogo de **tipos de cirugía** (antes una pestaña más, "Escenarios",
> y la primera ventana de la página) se retiró: duplicaba casi literalmente
> al *Diagnóstico* de la ficha del caso, que además es más completo. Sigue
> existiendo en `data/surgeries.js` (`escenarios_tipo`), inerte, y los
> montajes/casos antiguos conservan el dato que ya tuvieran — no se tocó
> ningún archivo real al retirarlo, solo el código y la interfaz.

**Desactivar no borra.** Un elemento desactivado deja de ofrecerse para
casos nuevos, pero sigue existiendo: lo que ya lo tenía lo conserva, y se
sigue viendo (tachado) para poder quitarlo si hace falta. Por eso técnicas,
servicios e intervenciones no tienen botón de borrar: borrarlos dejaría
casos antiguos apuntando a algo inexistente. Perfiles sí se puede borrar.

Todo esto se guarda y se sincroniza igual que tus montajes y tu material.

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

La tarjeta **Gestión de Casos** de la pantalla de inicio abre tus casos —es
el único sitio desde donde se abre, no hay otro acceso repetido en la
herramienta—.

**Al preparar**, pulsa **Crear caso** (06-09-2026, antes "Caso nuevo desde
cero"). El caso se guarda al instante, vacío, y te lleva directo al
**Organizador de Montajes** a construir su montaje: a mano —marcando
técnicas y colocando material como siempre—, o cargando una plantilla
encima con **Cargar montaje…** (mantiene la plantilla original intacta, es
una copia). Es fundamental que el montaje de un caso se toque siempre desde
aquí, no hay otro camino. El resto de la ficha —diagnóstico, anestesia,
resultado…— se rellena cuando quieras, pulsando **Volver al caso** en el
rótulo permanente.

Un caso marcado como **caso destacado** (punto 8, Docencia/Meta) lleva una
★ ámbar junto a su identificador en el propio listado, y si además tiene
puesta la **dificultad** aparece justo al lado como "N/5" — las dos cosas
para verlas de un vistazo sin abrir cada caso ni mirar la hoja de cálculo.

**Al cerrar**, abre el caso desde la lista. La ficha son **8 apartados
plegables, cronológicos, todos cerrados por defecto**: despliega el que te
interese según el punto del caso en el que estés, no hay que rellenar de
arriba abajo. Debajo del título ("Gestión de casos") sale el identificador
del caso que tienes abierto, p. ej. *CASO 2026-004, Meningioma APC*.

1. **Identificación / Trazabilidad** — identificador (fijo), estado (con
   **Cancelado** como opción, que muestra un motivo de cancelación en
   cuanto se marca — ver más abajo), fecha de la cirugía, nombre del caso
   (opcional, para reconocerlo tú de un vistazo — nunca el nombre del
   paciente), centro, hora de inicio/fin.
2. **Paciente** — edad, sexo, servicio, antecedentes relevantes.
3. **Cirugía** — diagnóstico, anatomía patológica (el resultado real, o el
   nivel intervenido si es columna), intervención (texto libre — no un
   catálogo cerrado; escríbela tal cual), posición (con las variantes de
   volteo separadas: supino→prono, prono→supino, y los dos dobles) y su
   detalle, otros datos quirúrgicos.
4. **Anestesia** — tipo (TIVA, R-TIVA, DXM, ALO, Gas), detalle, TOF
   monitorizado, incidencias anestésicas.
5. **Montaje / Técnicas** — el resumen de cajas/entradas ocupadas, la
   plantilla de origen (si el caso salió de una, resuelta en vivo — si la
   renombras después, aquí se ve el nombre nuevo), y dos botones seguidos:
   **Editar material y montaje** (te lleva al Organizador de
   Montajes con las cajas de este caso concreto para cambiar dónde va cada
   cosa — desde ahí, y solo desde ahí, se puede además *cargar un montaje*
   sobre el caso, ver más abajo) y **Guardar este montaje como plantilla…**
   (crea una plantilla nueva a partir de lo que hay ahora mismo en el caso).
   Justo debajo, el **detalle canal a canal**: la misma vista de "Cajas
   necesarias" que hay en Resumen, de solo lectura, para saber exactamente
   qué hay puesto en cada entrada sin salir a corregir el montaje. Debajo de
   eso, **técnicas realizadas** y **material (montaje base)** —los dos,
   plegados por defecto desde el 05-09-2026, se despliegan pulsando su
   título— (ya vienen marcadas las técnicas que planificaste, solo ajustas
   — los chips salen en tres bloques separados por un hueco: monitorización,
   reflejos y mapeo; el material es siempre de solo lectura: sale del
   montaje real del caso, que se corrige desde el Organizador, no aquí — la
   sección "Material realmente usado" está suspendida desde el 06-09-2026:
   si añades algo que no estaba previsto, colócalo en su caja y anótalo en
   las notas de montaje/técnicas, justo debajo), notas de montaje/técnicas, **"Cómo se
   realizó cada técnica"** (un bloque plegable por cada técnica ya marcada
   como realizada, con los parámetros reales usados en este caso —
   intensidad, frecuencia, nº de pulsos, trenes, ISI, filtros, promediación,
   barrido— y una caja de notas libres al final para cualquier detalle
   técnico que no encaje en esos campos) y **"Imágenes del montaje"**
   (capturas o fotos de cómo quedó en el software del equipo, p. ej. la
   pantalla del Inomed, para consultar si te toca un caso parecido —se
   comprimen solas al añadirlas, se pulsan para verlas en grande).
6. **Desarrollo intraoperatorio** — resumen de la monitorización (de
   corrido qué salió al empezar, qué pasó por el medio y qué salió al
   cerrar); si se marcó la técnica "Mapeo de raíces y tornillos", un
   selector de niveles C1–S2 (marca los que mapeaste y aparece una fila
   "I [caja] — nivel — D [caja]" por cada uno, con el umbral izquierdo y
   derecho en sus propios extremos) más una caja de notas libres de umbral
   EMG de tornillos pediculares para lo que
   no encaje en una raíz concreta; si hubo cambios respecto al plan y, si
   los hubo, su detalle; si hubo alerta y, si la hubo, tipo de alerta,
   medida correctora y recuperación de la señal; resultado esperable;
   técnicas con alteración (un chip-fila con solo las técnicas ya marcadas
   como realizadas —se actualiza solo si las tocas en el punto 5—);
   incidencias técnicas; equipo.
7. **Resultado / Correlación clínica** — evolución postquirúrgica,
   concordancia.
8. **Docencia / Meta** — mi papel (Adjunto 1 / Adjunto 2 / Residente),
   supervisor, dificultad, aprendizaje clave, caso destacado, notas.

Se rellena lo que haga falta y pulsa **Guardar**. Para cerrar el caso,
cambia el propio campo **Estado** (apartado 1, Identificación/Trazabilidad)
a *Cerrado* y guarda — no hay un botón aparte que lo haga por ti. La barra
de acciones fija de abajo del diálogo, siempre visible aunque hayas bajado
en el scroll de los 8 apartados, tiene **Borrar caso** y **Crear informe**
a la izquierda (abre un PDF imprimible de ese caso, ver más abajo), y
**Volver a la lista** y **Guardar** a la derecha — *Volver a la lista* solo
navega, nunca guarda ni cambia el estado.

**Editar material y montaje de un caso ya guardado**: el botón vive en el propio
apartado 5 (Montaje/Técnicas), junto al de plantillas — abre las cajas de
ese caso concreto para cambiar dónde va cada cosa, un cambio de última hora
o un error al preparar. Se guarda en el caso, no toca el montaje del que
salió. Mientras tanto, el rótulo permanente de arriba pasa a verde sólido y
recuerda en qué caso estás, con tres botones a mano sin tener que volver a
la ficha: **Cargar montaje…**, **Guardar este montaje como plantilla…** y
**Volver al caso**.

**Cargar un montaje sobre un caso ya creado**: solo se puede hacer desde
ahí —la barra fija de "Corrigiendo el material del caso", botón **Cargar
montaje…**—, nunca desde la ficha: así siempre sabes que lo que vas a
sustituir se puede editar de verdad. Elige un montaje y siempre te pregunta
antes de tocar nada —también con el caso vacío—, diciendo en números qué va
a pasar. Puedes **Reemplazar todo** o **Añadir solo lo que falta** (no toca
ninguna entrada que ya tuviera material). Es una copia: editar el montaje
después no cambia nada de lo ya aplicado. Si el caso está cerrado o
cancelado, pide una confirmación aparte antes de seguir.

**Guardar el montaje de un caso como plantilla**: mismo apartado, crea
siempre una plantilla nueva —nunca sobrescribe una existente— a partir de
lo que hay ahora mismo en las cajas de ese caso. Disponible tenga el caso el
estado que tenga; el caso en sí no se modifica.

**Un caso preparado en el ordenador se cierra en el móvil**, o al revés: los
casos viajan por la misma sincronización que el resto, cada uno en su propio
archivo. No hay que exportar ni importar nada.

### Cancelar un caso

Si marcas **Estado → Cancelado** (apartado 1, Identificación/Trazabilidad)
aparece un campo **Motivo de cancelación** para dejar constancia de por qué
—suspensión quirúrgica, cambio de planes, lo que sea—. Un caso cancelado no
llegó a monitorizarse, así que en las estadísticas del Google Sheet solo
cuenta para lo que sí es real de él: fecha, nombre del caso y centro
(Trazabilidad) y los datos de Paciente. No entra en las hojas de técnicas ni
de material consumido (`Tecnicas_long`, `Material_long`), y la hoja **Meta**
muestra cuántos casos cancelados hay en total.

### Casos de días pasados y correcciones

- **Para registrar una cirugía que nunca pasó por el checklist**: pulsa
  **Crear caso** igual que siempre, y en el Organizador de Montajes no
  coloques nada —vuelve directo a la ficha con **Volver al caso**—. Rellena
  lo que sepas y pon el **Estado** en *Cerrado* a mano (ya no hay un botón
  aparte que lo haga por ti, ni un caso nace cerrado solo).
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

## Docencia

Tarjeta **Docencia** de la pantalla de inicio (era **⋮ → Docente** hasta el
06-09-2026). Cuatro pestañas, sin relación con la preparación de
material — no tocan ningún montaje ni caso, y Miotomas/Cama de quirófano se
guardan solo en ese navegador, no se sincronizan:

- **Miotomas** — la columna vertebral entera (C1 a S5) en el centro, los
  músculos posibles a la izquierda y los monitorizados a la derecha. Marcas
  los niveles que abarca la cirugía y aparecen los músculos que dependen de
  esas raíces; los llevas de un lado a otro pulsándolos. Es un ejercicio, no
  una calculadora: la herramienta no elige por ti, solo avisa de qué niveles
  se quedan sin ningún músculo que los cubra. Los rangos de `data/surgeries.js`
  vienen en parte citados (Toleikis/Deletis, Leppänen, Schirmer, London — se
  marcan con `[TD/L]`, `[Sch]`, `[Lon]` en el propio tooltip) y en parte son
  cobertura de enseñanza habitual sin cita concreta detrás; la ventana explica
  cuál es cuál.

## Simulador y Bibliografía

Dos tarjetas nuevas de la pantalla de inicio (06-09-2026), de momento "en
construcción". **Simulador** será un simulador de ventanas de un software de
IONM (SEP, MEP, EMG, EEG...) para crear canales de electrodos con sus
parámetros de estimulación/filtros/barrido según la técnica. **Bibliografía**
serán enlaces a artículos open-access de PubMed con teoría relevante. Ninguna
de las dos toca montajes, casos ni catálogos.
- **Cama de quirófano** — eliges la posición del paciente (supino, supino con
  brazos extendidos, prono, sentado) y repartes las cajas por cabecera,
  laterales y pies con el mismo gesto de pulsar y colocar del resto de la
  herramienta. Lo que se practica es que el cable llegue.
- **Material** y **Teoría básica de IONM** — pestañas nuevas del 06-09-2026,
  de momento "en construcción". Material está pensada para reutilizar las
  fotos que ya existen en el catálogo de material (electrodos, agujas,
  sondas) en vez de duplicar contenido; Teoría básica cubrirá conceptos como
  far-field/near-field, campo abierto/cerrado, reflejo H, onda F, potencial
  de acción... Sin fecha todavía, se irán llenando en turnos aparte.

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
> de paciente, ningún token, ningún nombre de usuario ni ninguna referencia al
> centro. Tus montajes, etiquetas y material propio **no viajan ahí**: viven
> en tu navegador y se sincronizan con un repositorio de datos **privado**
> aparte (ver abajo).

## Dónde se guarda todo, y cómo pasarlo de un dispositivo a otro

Los cambios se guardan **automáticamente en ese navegador y ese
dispositivo** (localStorage). No tocan `data/surgeries.js`. Si conectas la
sincronización (siguiente apartado), además viajan solos entre dispositivos;
si no, el navegador del móvil y el del ordenador son almacenes distintos.

Para pasar tu trabajo de uno a otro a mano:

1. **Exportar copia** descarga un `.json` con tu material propio, tus
   etiquetas y los catálogos editables (técnicas, servicios, intervenciones,
   perfiles, usuarios). **No incluye tus montajes ni tus
   casos** — desde que pasaron a un archivo por montaje/caso, este volcado
   dejó de cubrirlos; para esos dos, la sincronización con GitHub es la
   única copia de verdad. Pendiente de decidir si merece la pena ampliarlo.
2. Pasa ese archivo al otro dispositivo (correo, nube, cable…).
3. **Importar copia** allí. Avisa de cuántos elementos trae, y sustituye lo
   que hubiera en ese navegador.

Ese mismo archivo sirve de copia de seguridad de lo que cubre: si el
navegador borra los datos del sitio, ese material y esas etiquetas se
recuperan importándolo — los montajes y los casos, solo si estaban
sincronizados con GitHub.

### Sincronización automática con GitHub

El botón **☁** de la barra superior conecta la herramienta con un repositorio
privado de GitHub que hace de nube. Es gratis: los repos privados, los tokens
y la API de GitHub no cuestan nada.

Preparación, una sola vez y en un solo dispositivo:

1. Crea un repositorio **privado y vacío** solo para los datos, por ejemplo
   `checklist-mio-datos`. **No uses el del código**: es público, dejaría los
   montajes a la vista, y así el token tampoco puede tocar el código.
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

El estado se ve en el propio botón: *Sin conectar*, *Guardando…*,
*Sinc. 12/08 19:30*, *Sin subir* o *Conflicto*.

El token se guarda solo en ese navegador. **Desconectar** lo borra del
dispositivo (no toca ni tus montajes ni lo guardado en GitHub), y siempre
puedes revocarlo desde GitHub.

**Exportar casos**, dentro de la pantalla **Gestión de Casos** (barra de
acciones fija), abre un **informe en PDF** —imprimible desde el propio
diálogo "Guardar como PDF" del navegador, sin depender de ninguna librería—
con todos los casos que tengas cargados en ese navegador en ese momento.
**Crear informe**, dentro de la ficha de un caso concreto, genera el mismo
tipo de informe pero solo de ese caso. Es una función nueva del
05-09-2026, primera versión pendiente de irse afinando con el uso real.

Junto a él, un botón aparte **Exportar CSV** descarga un CSV con esos mismos
casos —mismas columnas que la hoja *Casos* del Google Sheet, sin las
columnas por técnica—. Ninguno de los dos depende de la sincronización
automática ni del disparador diario de Apps Script: son vías manuales para
tener los datos a mano cuando quieras, sin esperar a nada.

Los montajes de fábrica están desactivados a propósito desde el 03-09-2026
(ver la nota de la tarjeta *Montajes* más arriba). Si algún día hace falta
volver a sembrar uno, no basta con rellenar `"escenarios"` en
`data/surgeries.js` — ver el aviso en *Añadir un montaje de fábrica a mano
en el JSON* más abajo antes de hacerlo.

**Restablecer** borra lo guardado en el navegador y vuelve a los montajes
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
- `foto` *(opcional)* — ruta a una imagen de referencia, relativa a la raíz
  del proyecto (por ejemplo `img/sondas/sonda_tripolar.png`). Añade el icono
  **📷** al chip; ver *Fotos de referencia del material* más arriba. Guarda
  el archivo dentro de `img/` antes de referenciarlo.

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

## Añadir un montaje de fábrica a mano en el JSON

Esto es el bloque `"escenarios"` de `data/surgeries.js` — un nombre heredado
de la versión original de la herramienta, cuando un "escenario" era lo que
ahora es un montaje (el catálogo de tipos de cirugía que llegó a llamarse
así también más adelante ya no existe, ver *Catálogos* más arriba). Cada
clave de ahí sería un **montaje** de fábrica: al arrancar, la app lo
convertiría en un montaje normal con el id `fab_<clave>`, sin autor,
editable por cualquiera.

> **Está vacío a propósito** desde el 03-09-2026 (decisión del usuario: no
> quería ningún montaje de fábrica) — y no basta con volver a rellenarlo
> para que reaparezcan. `limpiarMontajesHeredados()` (`app.js`) se ejecuta
> en cada arranque y borra cualquier montaje marcado `de_fabrica: true`,
> justo después de que `sembrarMontajes()` lo hubiera creado — así que hoy
> por hoy sembrar uno nuevo aquí no tiene ningún efecto visible, se crea y
> se borra en el mismo arranque. Si algún día hace falta que vuelvan a
> funcionar los montajes de fábrica, hay que tocar también esa función (o
> quitar su llamada en el arranque), no solo este bloque.

```json
"clave_montaje": {
  "nombre": "Nombre visible del montaje",
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

**Actualizar el script si ya lo tenías instalado:** a diferencia de la app
—que se actualiza sola con cada `git push`—, este código **no se actualiza
solo**: lo pegaste a mano una vez, y se queda tal cual hasta que lo vuelvas a
pegar. Si notas que falta una columna nueva (por ejemplo
`TEC_<etiqueta> - alteración`, o cualquier campo añadido después de tu
instalación), el Sheet no tiene ningún bug: tiene una copia vieja del
script. Para ponerlo al día: *Extensiones → Apps Script*, selecciona todo el
contenido de `Código.gs` (Ctrl/Cmd+A) y sustitúyelo entero por el contenido
actual de [`apps-script/Codigo.gs`](apps-script/Codigo.gs) de este
repositorio. Guarda, y pulsa **MIO-Check → Reconstruir ahora** en el Sheet
para verlo reflejado al momento, sin esperar al disparador diario. Los
`Script Properties` (`GITHUB_TOKEN`, `REPO_DATOS`) no se tocan al actualizar,
solo el código.

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
aparece sola, con su columna hermana `TEC_<etiqueta> - alteración` justo al
lado (marca con `1` los casos donde esa técnica tuvo algún cambio o aviso, ver
*Registrar casos* más arriba). Igual si la renombras: el histórico entero se
actualiza solo, porque la columna se genera resolviendo el id contra el
catálogo actual, no guardando el nombre de cuando se creó el caso.

La hoja **Meta** muestra el número total de casos y de casos cancelados, y
avisa, sin romper nada, de: correlativos `ID_Caso` duplicados, casos en
estado *preparado* que llevan tiempo sin cerrarse, e ids de técnica usados en
algún caso que ya no existen en el catálogo.

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
