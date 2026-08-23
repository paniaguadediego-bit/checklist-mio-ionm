# CLAUDE.md — MIO-Check

Instrucciones para trabajar en este repositorio. El manual de uso de la
herramienta está en [README.md](README.md); aquí está lo que hay que saber para
**tocar el código sin romper nada y sin perder datos**.

---

## Reglas absolutas

1. **Ningún dato identificativo de paciente entra nunca en este sistema.** Ni
   nombre, ni apellidos, ni NHC, ni número de historia, ni fecha de nacimiento.
   Solo identificador de caso, edad, sexo y antecedentes relevantes. Esto vale
   para el repositorio del código, para el de datos y para el Google Sheet.
2. **El repositorio del código es público.** Nunca se escriben en él tokens,
   datos de pacientes, nombres de usuario reales (los perfiles de usuario se
   crean desde la app, no aquí) ni el nombre del centro.
3. **Lo que se guarda son ids, nunca etiquetas visibles.** Los montajes ya
   guardan ids de técnica y de material. Así se puede renombrar cualquier cosa
   sin dejar huérfano lo guardado antes. Cualquier bloque nuevo sigue esa regla.
4. **Sin build, sin dependencias, sin backend.** `index.html` tiene que seguir
   abriéndose con doble clic y funcionar sin conexión. No se añaden `npm`,
   bundlers, frameworks ni CDNs.
5. **Antes de tocar la sincronización o el cálculo del resumen, leer entero el
   apartado correspondiente de este archivo.** Son las dos piezas donde un
   cambio descuidado pierde trabajo del usuario.

---

## Qué es la herramienta

Prepara monitorizaciones neurofisiológicas intraoperatorias. Eliges las técnicas,
montas el catálogo de electrodos sobre las cajas del equipo INOMED, y la app
calcula el material a preparar, la distribución en cajas con su ocupación, el
montaje canal por canal y los avisos.

Publicada en GitHub Pages: <https://paniaguadediego-bit.github.io/checklist-mio-ionm/>
Cada `git push` a `main` la actualiza en un par de minutos.

---

## Dónde vive cada dato (esto es lo importante)

Hay **tres capas**, y conviene no confundirlas:

| Capa | Qué contiene | Se pierde si… |
|---|---|---|
| `data/surgeries.js` | Lo de fábrica: cajas, etiquetas, catálogo, técnicas, perfiles, tipos de escenario y 2 presets de montaje | Nunca: está en git |
| `localStorage` del navegador | **Tu trabajo**: montajes, etiquetas y material propios | Borras los datos del sitio, cambias de navegador o de dispositivo |
| Repo privado `checklist-mio-datos` | Copia sincronizada: `estado.json`, `casos/` y `montajes/` | Nunca: cada sincronización es un commit |

### Escenario, montaje y caso: tres cosas distintas

Se parecen y conviene no confundirlas al leer el código:

- **Escenario** (`catalogos.escenarios`, `ESCENARIOS_TIPO`) — el *tipo de
  cirugía*: Tumor ST, Tumor IT, Tumor Medular, Awake surgery, ECC, ECL. Es un
  catálogo editable corto, y solo sirve para agrupar montajes.
- **Montaje** (`montajes`, un archivo por montaje) — qué material va en qué
  entrada de qué caja, con sus técnicas. Es lo que antes se llamaba
  "escenario". Lleva autor.
- **Caso** (`casos/`) — una cirugía que ocurrió de verdad, con sus datos.

Cuidado además con `DATA.escenarios`: son los presets de fábrica de la versión
anterior, que al arrancar se convierten en montajes (`fab_<clave>`).

La capa frágil es la del medio. Por eso existe la sincronización, y por eso la
red de seguridad de abajo se apoya en el **historial de git del repo de datos**.

### El repositorio de datos

- Repositorio: `paniaguadediego-bit/checklist-mio-datos` (**privado**).
- `estado.json` en la raíz, más `casos/<uid>.json` y `montajes/<uid>.json`.

**Por qué los montajes están en archivos sueltos y no en `estado.json`:**
`estado.json` se sube entero y **sin fusión de ningún tipo**. Con un solo
usuario eso se aguanta; con dos, cada vez que ambos guardan un montaje la app
detecta el conflicto por `sha` y obliga a elegir entre *Subir* (se pierde lo
del otro) o *Bajar* (se pierde lo tuyo) — y se pierde el archivo **entero**,
no solo el montaje en disputa. Con un archivo por montaje eso no puede pasar.
Es la misma razón por la que los casos ya estaban así. **Cualquier dato nuevo
que dos personas puedan escribir a la vez va en su propio archivo.**
- Lo escribe `estadoActual()` (`grep -n "function estadoActual"`) y tiene esta
  forma:

```
{ formato: "mio-ionm", version: 3, fecha, escenarios, catalogo_usuario,
  etiquetas_usuario, etiquetas_borradas, catalogos, borrados, activo }
```

  `escenarios` y `activo` aquí son el **legado de la versión 2**
  (`legadoEscenarios`/`legadoActivo`), una foto congelada de antes de que los
  montajes salieran a `montajes/`. Se sigue escribiendo tal cual, sin
  tocarlo, solo como red de seguridad de esa conversión — no lo lee nada como
  fuente de verdad. No confundir con `catalogos.escenarios` (los tipos de
  cirugía) ni con `DATA.escenarios` (los montajes de fábrica): ver el
  apartado siguiente.

- Se sube en base64 por la Contents API de GitHub. El token es *fine-grained*,
  con `Contents: Read and write` **solo** sobre ese repositorio, y vive
  únicamente en el `localStorage` del navegador.
- **Cada subida es un commit.** El historial completo es recuperable.

---

## Red de seguridad: qué hacer si algo va mal

Todos estos comandos están probados contra el repositorio real.

### Ver el historial de tus datos

```bash
gh api "repos/paniaguadediego-bit/checklist-mio-datos/commits?path=estado.json&per_page=20" --jq '.[] | "\(.sha[0:7])  \(.commit.author.date)"'
```

### Recuperar una versión anterior

Sustituye `SHA` por el que hayas elegido de la lista anterior:

```bash
gh api "repos/paniaguadediego-bit/checklist-mio-datos/contents/estado.json?ref=SHA" --jq '.content' | base64 -d > estado-recuperado.json
```

Ese archivo se importa desde la propia herramienta con **Importar copia**: tiene
exactamente el mismo formato que la exportación.

### Copia fría completa, en el ordenador

Clona el repositorio de datos donde quieras (fuera de la carpeta del código):

```bash
gh repo clone paniaguadediego-bit/checklist-mio-datos
```

Te llevas el `estado.json` actual **y todo su historial**. Repetir `git pull` de
vez en cuando mantiene la copia al día.

### Si el navegador borró los datos del sitio

No hace falta hacer nada especial: al abrir la web con la sincronización
configurada, `bajarAuto()` ([app.js:1695](app.js:1695)) se trae la última versión
del repositorio. Si además hubieras perdido el token, se vuelve a generar en
GitHub y se pega en el diálogo ☁.

### Si sale «Conflicto» en el botón ☁

Significa que otro dispositivo subió cambios que este no tiene. **La app nunca
decide por su cuenta**: elige tú *Subir* (gana lo de este dispositivo) o *Bajar*
(gana lo del repositorio). Si dudas cuál conserva más trabajo, exporta primero
una copia local y compárala con la del repositorio.

### Antes de cualquier cambio grande en el código

Exporta una copia desde la herramienta (**Exportar copia**) y guárdala fuera del
proyecto. Desde el arreglo de agosto de 2026 esa exportación es **idéntica** a lo
que se sube a GitHub, así que sirve de restauración completa.

---

## Mapa del código

Todo el JavaScript vive en un único IIFE en `app.js` (~5800 líneas). No hay
módulos. Las funciones son declaraciones, así que el orden de definición no
importa. **Los números de línea de esta tabla se desactualizan con cada
cambio grande** — si no cuadran con lo que hay, es más fiable un
`grep -n "function nombreDeLaFuncion"` que fiarse del número a ciegas.
(Los de abajo están comprobados el 21-08-2026.)

| Zona | Función clave | Línea |
|---|---|---|
| Idioma | `volcarTraducciones()`, `campo()` | [599](app.js:599), [681](app.js:681) |
| Etiquetas (tipos físicos) | `reconstruirEtiquetas()` | [751](app.js:751) |
| Catálogo de material | `reconstruirCatalogo()` | [840](app.js:840) |
| Catálogos editables (técnicas/servicios/intervenciones/perfiles/escenarios/usuarios) | `fusionarCatalogo()`, `reconstruirCatalogos()` | ver `grep` |
| Carga y guardado del estado | `cargarEstado()`, `guardarEstado()` | [1159](app.js:1159), [1281](app.js:1281) |
| Entradas de una caja | `entradasDe()` | [1510](app.js:1510) |
| Selección y colocación (pulsar y colocar) | `seleccionar()`, `colocar()` | ver `grep` |
| Sincronización de `estado.json` | `estadoActual()`, `aplicarEstado()`, `programarSubida()`, `subirAuto()`, `bajarAuto()` | [2057](app.js:2057)–[2224](app.js:2224) |
| Montajes: modelo, autoría y sincronización | `montajeNuevo()`, `puedoEditar()`, `guardarMontaje()`, `subirMontaje()`, `bajarMontajes()` | ver `grep` |
| Casos: modelo y ficha | `borrarCaso()`, `guardarCaso()`, `casoVacio()`, `renderFichaCaso()` | [2454](app.js:2454), [2467](app.js:2467), [2498](app.js:2498), [3669](app.js:3669) |
| Casos: sincronización | `subirCaso()`, `bajarCasos()`, `borrarCasosPendientes()` | ver `grep` |
| Cálculo del resumen (con coste) | `calcularResumen()`, `calcularCoste()` (dato) → `renderResumen()` (pintado) | [4785](app.js:4785), [4868](app.js:4868) |
| Ventana Docente (miotomas, cama de quirófano) | `renderDocente()`, `renderCama()` | ver `grep` |

Datos de fábrica en `data/surgeries.js`: `cajas_material`, `etiquetas` (35,
con `precio` y `fungible` — ver *Coste del material* en README),
`catalogo_material` (~260 ítems), `tecnicas` (~40, monitorización y mapeo),
`servicios`, `intervenciones`, `perfiles_procedimiento`, `escenarios_tipo`
(los tipos de cirugía: Tumor ST, ECC, ECL…), `escenarios` (montajes de
fábrica, ojo con el nombre heredado — ver más abajo) y `miotomas` (solo para
la ventana Docente, sin uso en el cálculo de material).

### Patrón de datos editables

Todo lo que el usuario puede modificar sigue **el mismo patrón**, y cualquier
catálogo nuevo debe seguirlo también:

> lista de fábrica + lista del usuario + lista de borrados, fusionadas por `id`
> al arrancar. Un elemento propio con el `id` de uno de fábrica lo **sustituye
> en su sitio**.

Ver `reconstruirEtiquetas()` y `reconstruirCatalogo()` como referencia, y
`fusionarCatalogo()` para la versión genérica que usan los cuatro catálogos
editables.

### Catálogos editables

`tecnicas`, `servicios`, `intervenciones`, `perfiles`, `escenarios` (los
tipos de cirugía — no confundir con `DATA.escenarios`, los montajes de
fábrica) y `usuarios` se editan desde el diálogo **Catálogos** (botón en la
barra de herramientas). Su estado vive en `catalogos` y se guarda dentro de
`estado.json`:

```
catalogos: {
  <nombre>: { version, actualizado_en, propios[], orden[], borrados[] }
}
```

- `propios` — elementos creados o editados por el usuario, por `id`.
- `orden` — ids en el orden fijado a mano. Lo que no esté va detrás, en el
  orden de fábrica: una técnica nueva aparece al final, nunca desaparece.
- `borrados` — solo se usa en perfiles (`borrarCat()`). Los otros cinco
  catálogos **no se borran**, se desactivan (`activa: false`), porque un
  caso o montaje guardado puede referirse a ellos.
- `version` sube y `actualizado_en` se sella en cada cambio (`tocarCatalogo`).

`usuarios` va **vacío de fábrica a propósito**: los nombres de personas
reales no se escriben en este repositorio, que es público (regla 2). Se
crean desde la app (selector "quién eres" en la barra superior) y quedan en
`catalogos.usuarios` dentro de `estado.json`, que va al repo privado. El
perfil *elegido* (no la lista de usuarios) vive aparte, en
`localStorage["mio_ionm_perfil_v1"]`, y no se sincroniza: es de este
dispositivo, no del equipo. Sirve para firmar montajes (`autor_id`), pero
**no es seguridad** — cualquiera puede cambiar de perfil sin más, y sin
backend no hay forma de impedirlo.

Cuidado con el nombre **`etiqueta`**: en una técnica es su texto visible; en el
material es el tipo físico (aguja, sacacorchos…). No tienen nada que ver.

Al cambiar un texto que venía de fábrica, `fijarTexto()` borra sus traducciones
`_en`: ya no describen lo que hay. Es la misma regla que con los escenarios.

### Sincronización: cómo funciona de verdad

- Cada `guardarEstado()` marca `pendiente` y arranca una cuenta atrás de 4 s
  (`programarSubida()`).
- Al abrir, `bajarAuto()` se trae lo último **salvo que haya cambios locales sin
  subir**, en cuyo caso sube en vez de bajar. Así el trabajo del móvil no se
  pisa.
- Los conflictos se detectan por el `sha` del archivo. **No hay fusión de
  ningún tipo**: es reemplazo del archivo entero, y decide el usuario.

Consecuencia importante para cualquier ampliación: **no metas datos nuevos
dentro de `estado.json` si dos dispositivos pueden escribirlos a la vez.** Se
perdería una de las dos versiones enteras. Los datos concurrentes van en
archivos separados, con nombre derivado de un identificador único.

---

## Convenciones de código

- **JavaScript ES5**: `var`, `function`, nada de `let`/`const`/flechas/clases.
  Es deliberado: la herramienta se abre en navegadores del hospital.
- **Comentarios en castellano**, y explican *por qué*, no *qué*. Si una decisión
  fue así por un motivo concreto (una limitación de Chrome, una regla clínica),
  eso es lo que se escribe.
- **Nombres en castellano** para todo lo del dominio (`escenario`, `etiqueta`,
  `caja`, `entrada`, `tecnica`).
- **Textos de interfaz siempre por `T("clave")`**, nunca literales. Los textos
  de datos usan campos paralelos con sufijo `_en` y se leen con `campo(obj, "x")`.
  Lo que escribe el usuario no se traduce nunca.
- **El DOM se construye con `createElement` y `textContent`**, no con `innerHTML`
  concatenando datos. Hay nombres con acentos y comillas.
- Comprobar sintaxis antes de dar nada por bueno: `node --check app.js`.

## Al desplegar: subir el `?v=` de index.html

GitHub Pages manda `Cache-Control: max-age=600` en **cada archivo por
separado**. Sin versionar, el navegador puede quedarse con el `index.html`
nuevo y el `app.js` viejo: la página se dibuja con botones que no responden,
porque el código que los escucha no ha llegado. Pasó al publicar la fase 2.

Por eso `index.html` carga sus archivos con `?v=AAAAMMDD`. **Cada vez que
cambie `app.js`, `style.css` o algo de `data/`, hay que subir ese número** en
las cuatro etiquetas (`style.css`, `data/surgeries.js`, `data/i18n-en.js`,
`app.js`). Es lo único manual del despliegue; el resto lo hace `git push`.
Si hay más de un despliegue el mismo día, se añade una letra al final
(`20260813`, `20260813b`, `20260813c`...) — solo tiene que ser una URL
distinta a la anterior, no importa el formato exacto.

---

## Estado del proyecto

**La herramienta está en uso clínico real desde agosto de 2026.** El
repositorio de datos tiene casos reales con contenido real (`2026-002` a
`2026-006` al 21-08-2026) — **no está limpio de casos de prueba porque ya no
son de prueba**. Cualquier cambio en el modelo de datos de un caso a partir
de ahora es un cambio sobre datos clínicos de verdad, no sobre un arnés: si
hay que migrar algo, se migra también en el repositorio de datos, no solo en
el código (ver ejemplo reciente más abajo).

### Las cinco fases del plan original están hechas

1. **Preparación de material** (catálogo, cajas, montaje, resumen) — la base
   de la herramienta desde el principio.
2. **Catálogo ampliado y coste** — de 132 a ~260 ítems de material, 35
   etiquetas con `precio`/`fungible`, apartado de coste en el resumen.
3. **Perfiles de usuario, escenarios como tipo de cirugía, y montajes**
   — el cambio de modelo más grande: un "escenario" pasó de ser el montaje a
   ser el tipo de cirugía, y los montajes salieron a `montajes/<uid>.json`
   con autoría. La interfaz se reordenó en seis ventanas: Escenario →
   Montajes personales → Técnicas → Catálogo → Cajas → Resumen.
4. **Corregir el montaje de un caso ya guardado** — el caso archiva ahora el
   montaje en crudo (no solo la instantánea legible), así que se puede volver
   a abrir y editar sin perder lo que ya tenía.
5. **Ventana Docente** — miotomas (ejercicio, cita fuentes reales) y cama de
   quirófano (colocación de cajas según la posición del paciente). Sin
   relación con la preparación de material; no se sincroniza.

El **Google Sheet vía Apps Script está confirmado en producción** (Fase
paralela a las de arriba): instalado por el usuario en un Sheet real, con
`crearDisparadorDiario()` activo. **Looker Studio sigue a medias, en pausa
por decisión del usuario** — las tres fuentes de datos están conectadas y
detectando bien los campos, quedan por montar los 6 grupos de gráficos del
README; no asumir que están hechos sin preguntar.

### Retoques posteriores a las cinco fases (21-08-2026)

Todo esto se hizo *después* de dar las cinco fases por terminadas, pedido
por el usuario tras usar la herramienta de verdad:

- **Renombrada a "MIO-Check"** — título, cabecera (con logo propio en
  `img/`), README, Apps Script. Las URLs del repositorio y de GitHub Pages
  **no se tocaron a propósito** — renombrarlas rompería accesos directos ya
  guardados; sigue pendiente si el usuario lo quiere en algún momento.
- **Modo quirófano, retirado entero** — no solo el botón: la pausa de
  subida automática durante la cirugía, el reordenado por CSS `order`, todo.
  "Otros" volvió a ser un botón simple de Docente al quedarse con una sola
  opción.
- **Ficha del caso, reorganizada a fondo**: Estado ahora es el primer campo
  (antes de Fecha); "Ampliar" dejó de ser un `<details>` plegado —el usuario
  lo rellena siempre—; dentro de eso, solo el grupo Material se pliega
  aparte (puede ser una lista larga); Diagnóstico y Tipo de anestesia pasaron
  de texto libre a listas cerradas; Intervención pasó de catálogo a texto
  libre (se perdió la propagación automática del código de hospital, que
  dependía de ese enlace); Opening/Closing baselines se fundieron en un solo
  "Resumen de la monitorización"; Criterio de alarma se fundió dentro de
  Tipo de alerta; "Resultado esperable" es campo nuevo; se quitó el aviso
  de "caja completa".
- **"Reflejo H" dividido en HR Poplíteo y HR Masetero** — no es la misma
  técnica según el músculo de registro. Se desactivó el id viejo en vez de
  borrarlo (regla de siempre: "desactivar no borra"), y además **se migraron
  a mano los casos y montajes reales** que lo usaban en el repositorio de
  datos, con criterio clínico dado por el usuario (todos los anteriores eran
  Poplíteo, el de ese mismo día fue Masetero). Es el patrón a seguir la
  próxima vez que una técnica o campo se divida o se funda estando ya en uso
  real: el código cambia, y los datos reales existentes se migran con él, en
  el mismo turno, no "algún día".

### Retoques posteriores, 23-08-2026

- **Alteraciones intraoperatorias por técnica** — nuevo campo
  `tecnicas_alteradas` en el caso (detalle en la sección [Casos](#casos)
  más abajo) y su columna hermana `TEC_<etiqueta> - alteración` en el Sheet
  (detalle en [Google Sheet](#google-sheet-apps-script)).
- **Reflejos maseterinos, unificados** — `rx_mandibular` ("Reflejo
  mandibular (jaw jerk)") se desactivó por ser la misma técnica que
  `hr_masetero`: el jaw jerk clásico y el H-reflex del masetero son un solo
  reflejo con dos nombres, no dos técnicas. `hr_masetero` pasó a llamarse
  **"H-reflex del masetero (Jaw Jerk)"** para dejarlo dicho. `rx_inhib_maseterino`
  ("Reflejo inhibitorio del masetero") también se desactivó, pero por la
  razón contraria: es un circuito distinto (silent period), no un sinónimo,
  y no es una técnica que se estudie en IONM — no se fusiona con nada, solo
  se retira de las técnicas activas. Mismo patrón de siempre, "desactivar no
  borra". **No hizo falta migrar nada en el repositorio de datos**: se
  comprobó a mano que ningún caso ni montaje real usaba ninguno de los dos
  ids antes de desactivarlos.

### Un gap real encontrado y documentado, sin arreglar todavía

**"Exportar copia" / "Importar copia" ya no cubren los montajes ni los
casos.** Desde que salieron a archivos sueltos (Fase 3 y antes), el volcado
de `estadoActual()` dejó de incluirlos, pero el texto de la interfaz y el
README seguían prometiendo "todo". El README ya está corregido para decir la
verdad (solo catálogo propio, etiquetas y catálogos editables); el código no
se ha tocado. Si se quiere que ese botón vuelva a ser una copia de seguridad
completa, hay que decidir cómo empaquetar archivos de `montajes/` y `casos/`
junto al resto — no es trivial porque son colecciones de tamaño variable, no
un único objeto.

### Detalles de implementación que conviene no perder

- El **conmutador** es un chip fijo, sin desplegable de canal ni
  `item.conmutador` en el dato. No se puede cambiar el tipo físico por
  colocación desde la caja; `etiquetaColocada()` sigue leyendo overrides
  guardados antes de ese cambio, pero nada vuelve a crear uno.
- **El conmutador siempre suma 6 "Electrodo sacacorchos" al material**,
  además de su propia unidad (`calcularResumen()`, buscar `item.id ===
  "conmutador"`). Reparte por dentro hacia 6 posiciones (C3/C4 lo habitual,
  a veces C5/C6), que no ocupan entrada propia en la caja — sin este
  añadido a mano no salían nunca en el material a preparar. Se suma fijo a
  6, no a ids de electrodo concretos, porque cuáles sean varía según el
  caso. Añadido el 23-08-2026: se corrigieron a mano los 5 casos reales que
  ya existían entonces (`material_previsto`, `material_real` y
  `coste_material`, +6 unidades y +18€ cada uno — el precio de
  `electrodo_sacacorchos` era 3€/ud), con un `editado_en` nuevo dejando
  constancia. Mismo patrón de siempre: el código se arregla y los datos
  reales existentes se migran en el mismo turno.
- `colocar()` deselecciona el ítem tras colocarlo (antes se quedaba listo
  para repetir) y, en móvil, vuelve a desplegar el catálogo por donde iba
  para el siguiente ítem — `plegarCatalogo()` guarda y restaura el
  `scrollTop`, porque el navegador lo fuerza a 0 al ocultar el contenido.
- Las tarjetas plegables (`<details>`) se fuerzan abiertas antes de imprimir
  y vuelven a como estaban después (`beforeprint`/`afterprint`), para que no
  falte nada en el papel.

Pendiente, sin urgencia: verificar en vivo con datos reales que
añadir/renombrar una técnica actualiza el Sheet solo, y que rellenar el
`código` de una intervención se propaga a los casos previos.

## Google Sheet (Apps Script)

`apps-script/Codigo.gs` es un script de Google Apps independiente: no forma
parte de la web y no se sirve por GitHub Pages, pero vive en este mismo
repositorio porque es la fuente de verdad de su código (el usuario lo pega a
mano en el editor de Apps Script; ver README para la instalación).

Reconstruye **enteras** cinco hojas en cada pasada — `Casos`, `Tecnicas_long`,
`Material_long`, `Listas`, `Meta` — nunca fila a fila. Dos fases:

1. **Reunir todo en memoria**: catálogos fusionados (mismo algoritmo que
   `fusionarCatalogo()` de `app.js`, reimplementado porque Apps Script no
   puede importar el archivo del navegador) + casos descargados en lote con
   `UrlFetchApp.fetchAll()`. Si algo falla aquí —sobre todo un fallo de red o
   de la API al listar o descargar—, se lanza un error y **no se toca ninguna
   hoja**: el Sheet se queda con la reconstrucción anterior.
2. **Escribir las hojas**, solo si la fase 1 terminó entera y sin errores.
   `Meta` se escribe la última, para que su "última sincronización" nunca
   describa una reconstrucción a medias.

Un caso individual con el JSON roto o sin `caso_uid` **no aborta la
reconstrucción**: se descarta y queda anotado en `Meta` como "Caso no leído".
Es la distinción entre un problema de red (aborta) y un problema del dato
(avisa y sigue) que pedía la especificación.

`data/surgeries.js` no es JSON puro —lleva comentarios de bloque entre las
propiedades, pensado para cargarse con `<script>`— así que el script lo
**evalúa como el código JS que es** (`evaluarSurgeriesJs_()`), igual que hace
el propio navegador, en vez de intentar limpiar los comentarios con una
expresión regular frágil.

`data/surgeries.js` se lee por **`raw.githubusercontent.com`**
(`leerArchivoPublicoRaw_()`), no por la Contents API. Se probó así al
instalar en un Sheet real y dio `403 API rate limit exceeded`: la Contents
API sin autenticar tiene un cupo de 60 peticiones/hora que **comparten todos
los scripts de Apps Script del mundo que salen por la misma IP de Google**,
así que se agota casi sin usarlo. El token de solo lectura tampoco sirve
aquí, porque está circunscrito al repositorio de datos, no al del código.
`raw.githubusercontent.com` es un reparto de contenido aparte, con cupo
propio y mucho más alto. La rama se lee de la Script Property opcional
`REPO_CODIGO_RAMA` (por defecto `main`). El resto de lecturas —`estado.json`
y los casos— siguen por la Contents API autenticada, que no tiene este
problema porque el límite autenticado (5000/hora) es propio de cada token,
no compartido.

Las columnas `TEC_<etiqueta>` se generan a partir del catálogo de técnicas
**fusionado y en su orden**, incluidas las desactivadas — una técnica
desactivada no debe perder su columna, porque casos antiguos siguen
refiriéndose a ella por id. Cada una lleva justo al lado su hermana
`TEC_<etiqueta> - alteración` (`columnasTecnicas_()` devuelve las dos claves
juntas, `construirFilasCasos_()` las intercala): `1` si esa técnica está en
`tecnicas_alteradas` del caso, `0` si no. Al añadir o quitar una columna de
técnica hay que tocar las dos, nunca solo `columna`.

Los `filas.sort()` de `construirFilasCasos_()`, `construirTecnicasLong_()` y
`construirMaterialLong_()` **buscan la columna por su nombre**
(`cabecera.indexOf("Fecha")`), nunca por un índice fijo (`a[3]`). Un índice
fijo se rompe en silencio —sin ningún error, solo un orden mal— el día que se
inserte una columna nueva en medio de la cabecera. Pasó de verdad al añadir
`nombre_caso`: el índice de `Fecha` cambió de 3 a 4 y las filas dejaron de
salir en orden cronológico, sin que nada avisara —lo detectó el arnés de
pruebas, no un error. Cualquier columna nueva que se
añada a una cabecera debe seguir este patrón, no un índice literal.

Probado con un arnés de Node (`vm` + simulación de `UrlFetchApp`,
`PropertiesService`, `SpreadsheetApp`) que ejecuta el archivo real, no una
reimplementación aparte. 21 pruebas cubren: fusión y renombrado de catálogo,
columnas de técnica desactivada, booleanos como `1`/`0` numéricos, fechas
como objetos `Date` reales (no texto) para que Looker las reconozca como
fecha, orden determinista, idempotencia (dos ejecuciones seguidas dan el
mismo resultado salvo la marca de tiempo), carpeta `casos/` vacía, fallo de
red que no toca el Sheet, y los tres avisos de `Meta` (correlativo duplicado,
preparado sin cerrar, técnica sin catálogo).

`Material_long` es una hoja añadida sobre la especificación mínima de la
Fase 3: sin ella, "material consumido acumulado" (criterio de la Fase 4) no
tiene de dónde sumar, porque `material_previsto`/`material_real` son mapas de
clave variable que no caben en una columna de `Casos`.

**Los nombres de columna que aparecen en más de una hoja tienen que
coincidir letra por letra** (`Fecha`, `ID_Caso`, `servicio`): un filtro de
Looker Studio solo cruza de una fuente de datos a otra cuando el campo se
llama exactamente igual en las dos. `Tecnicas_long` usaba `Servicio` con
mayúscula mientras `Casos` usa `servicio`; se corrigió al escribir las
instrucciones de la Fase 4, porque si no el filtro por servicio del
dashboard no habría alcanzado al gráfico de técnicas más usadas. Si algún
día se añade una columna compartida nueva, hay que vigilar esto.

### Formato de las hojas

El formato se aplica **dentro del script** (`formatearTabla_()`,
`formatearListas_()`, `formatearMeta_()`), no a mano en el Sheet: como las
hojas se reescriben enteras en cada pasada, un formato puesto a mano
desaparecería en la siguiente reconstrucción.

El franjeado (`Banding`, alternancia de color por fila) es un objeto aparte
de las celdas —`clearContents()` no lo toca—, así que `escribirHoja_()`
llama primero a `quitarFormatoAnterior_()` para retirar el de la pasada
anterior. Sin eso, la segunda ejecución seguida intentaría aplicar un
franjeado sobre un rango que ya lo tiene. Probado explícitamente: dos
`reconstruirTodo()` sobre el mismo Sheet dejan un único franjeado, no dos.

`Listas` tiene el franjeado por bloque (uno por catálogo), no de un tirón
sobre toda la hoja, para que no salte por encima de la columna en blanco que
separa los tres bloques.

## Casos

Un archivo JSON por caso en `casos/<caso_uid>.json` del repositorio de datos.
**No van dentro de `estado.json` a propósito**: ese archivo se sincroniza
entero y dos dispositivos escribiéndolo se pisan. Con un archivo por caso y el
nombre derivado de un UUID, dos dispositivos no pueden chocar.

- `caso_uid` — UUID del cliente. Es la clave real.
- `ID_Caso` — correlativo `AAAA-NNN` por año de `fecha`, solo para nombrar el
  caso en voz alta. Se asigna al crearlo tomando el máximo conocido. Si dos
  dispositivos sin conexión generan el mismo, no rompe nada: el Apps Script
  avisa. **No es editable** — es el correlativo, no una etiqueta.
- `nombre_caso` — texto libre, opcional, editable en cualquier momento.
  Para que el usuario reconozca el caso de un vistazo en la lista y en el
  Sheet; no sustituye a `ID_Caso`, que sigue siendo la clave de numeración
  y la que usa `Meta` para avisar de correlativos duplicados. Lleva una
  ayuda visible en el formulario recordando que no debe ser un dato de
  paciente — es un campo de texto libre más, sujeto a la regla 1.
- `estado` — `preparado` | `cerrado`.
- `tecnicas_realizadas` — ids de técnica, nunca etiquetas.
- `tecnicas_alteradas` — subconjunto de `tecnicas_realizadas` (mismos ids):
  las que tuvieron algún cambio, hallazgo o aviso durante la cirugía. Se
  marca al cerrar el caso, en un chip-fila propio al final de la ficha que
  solo ofrece las técnicas ya marcadas como realizadas — en la interfaz
  (`campoCaso`, `t: "tecnicas_alt"`) se repinta en vivo si se toca
  "Técnicas realizadas", y si una técnica se desmarca de ahí deja de poder
  estar aquí. En el Sheet genera la columna hermana
  `TEC_<etiqueta> - alteración` junto a cada `TEC_<etiqueta>` (ver más
  abajo), con el mismo `1`/`0` que el resto de columnas booleanas.

**Tres fechas y no se confunden:**

| Campo | Qué es | Quién lo pone |
|---|---|---|
| `fecha` | Cuándo fue la cirugía. **Es la que cuenta para las estadísticas.** | El usuario, siempre editable |
| `guardado_en` | Cuándo se creó el archivo | La app, una vez |
| `editado_en` | Array con cada edición posterior | La app, en cada guardado |

Un caso de hace un mes registrado hoy no se confunde con uno de hoy. El Apps
Script debe agrupar por `fecha`, nunca por `guardado_en`.

`material_previsto`, `material_real`, `montaje`, `n_cajas`,
`n_canales_ocupados` y `avisos_preparacion` salen de `calcularResumen()`: lo
que se archiva es exactamente lo que se ve en pantalla, calculado una sola vez
y en un solo sitio. El montaje se guarda como **instantánea con los textos ya
resueltos**, para que un caso antiguo se siga leyendo aunque el catálogo de
material cambie después.

Almacenamiento local: `mio_ionm_casos_v1` con `{ casos, sha, sin_subir }`.
`sin_subir` sobrevive al cierre del navegador, así que un caso guardado sin
conexión sube en cuanto vuelve la red.

Sincronización: `subirCaso()` sube uno con su `sha`; si el archivo cambió desde
otro dispositivo relee el `sha` y reintenta una vez (gana lo que acabas de
escribir aquí). `bajarCasos()` lista `casos/` y **solo descarga los que han
cambiado**, comparando el `sha` del listado; nunca pisa un caso con cambios
locales sin subir. Un conflicto en `estado.json` **no** bloquea la subida de
casos: son archivos independientes.

`bajarCasos()` también hace el camino contrario: si un caso que este
dispositivo tiene guardado con `sha` confirmado **ya no aparece** en el
listado remoto, se quita también en local. Sin esto, un caso borrado a mano
en GitHub —o desde otro dispositivo antes de que este bajara nunca— se
quedaría fantasma en este navegador para siempre, porque bajar solo sabía
añadir o actualizar, nunca detectar una ausencia. Solo se retira un caso con
`sha` conocido: uno recién creado en este dispositivo y aún sin subir no
tiene `sha`, así que nunca se toca por error. Pasó de verdad: se borraron
tres casos de prueba directamente contra la API de GitHub —por fuera de la
app, para una limpieza rápida— y siguieron saliendo en el navegador del
usuario hasta que se corrigió esto.

**Borrar un caso** (`borrarCaso()`) sigue el mismo patrón que "sin_subir",
pero al revés: `casosBorrados` guarda `caso_uid → sha` para los casos que
**sí llegaron a existir en GitHub** (si nunca se subió, no hay nada que
borrar allí y basta con quitarlo en local). `borrarCasosPendientes()` los
vacía con `DELETE` en cuanto hay conexión, reintentando una vez si el `sha`
cambió mientras tanto — el borrado gana siempre, sea cual sea el contenido
de en medio. `bajarCasos()` ignora cualquier `uid` que esté en
`casosBorrados`, o un caso que acabas de borrar reaparecería solo si el
listado remoto todavía no se había enterado. El botón solo aparece en un
caso que ya se guardó al menos una vez (uno recién creado sin guardar no
existe todavía en `casos`, no hay nada que borrar). No hay deshacer desde la
app, pero el borrado en GitHub es un commit más: recuperable del historial,
igual que `estado.json`.

Arquitectura: App (GitHub Pages) → repo privado de datos (fuente de verdad) →
Apps Script con disparador diario → Google Sheet → Looker Studio.

En el registro de casos hay tres fechas distintas y no deben confundirse:
`fecha` es cuándo ocurrió la cirugía (editable siempre, y es la que cuenta para
las estadísticas), `guardado_en` es cuándo se creó el archivo y `editado_en` es
un array con cada edición posterior. Las dos últimas las pone la app sola.
