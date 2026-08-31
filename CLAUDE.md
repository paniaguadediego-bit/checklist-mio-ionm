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
| Puente plantilla↔caso (cargar/guardar) | `iniciarCargaPlantilla()`, `aplicarPlantillaSobreDestino()`, `guardarMontajeComoPlantilla()` | ver `grep` |
| Biblioteca de Montajes (diálogo) | `abrirDlgMontajes()`, `renderListaMontajesDialog()`, `montajeNuevo()` | ver `grep` |
| Rótulo permanente | `renderBarraCaso()` | ver `grep` |
| Exportación manual de casos a CSV | `casosACsv()`, `COLUMNAS_CSV_CASOS` | ver `grep` |
| Guía de uso (contenido en `data/guia.js`) | `renderGuia()`, `abrirGuia()` | ver `grep` |

Datos de fábrica en `data/surgeries.js`: `cajas_material`, `etiquetas` (35,
con `precio` y `fungible` — ver *Coste del material* en README),
`catalogo_material` (~260 ítems), `tecnicas` (~40, monitorización y mapeo),
`servicios`, `intervenciones`, `perfiles_procedimiento`, `escenarios_tipo`
(los tipos de cirugía: Tumor ST, ECC, ECL… **inerte desde el 31-08-2026**,
ver "Retoques posteriores" de esa fecha — nada en `app.js` lo lee ya),
`escenarios` (montajes de fábrica, ojo con el nombre heredado — ver más
abajo) y `miotomas` (solo para la ventana Docente, sin uso en el cálculo de
material).

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

`tecnicas`, `servicios`, `intervenciones`, `perfiles` y `usuarios` se editan
desde el diálogo **Catálogos** (botón en la barra de herramientas). Su
estado vive en `catalogos` y se guarda dentro de `estado.json`. **Ya no hay
`escenarios`** (los tipos de cirugía) en esta lista desde el 31-08-2026 —se
retiró, ver "Retoques posteriores" de esa fecha—; no confundir con
`DATA.escenarios`, los montajes de fábrica, que sigue existiendo y no tiene
nada que ver con este catálogo:

```
catalogos: {
  <nombre>: { version, actualizado_en, propios[], orden[], borrados[] }
}
```

- `propios` — elementos creados o editados por el usuario, por `id`.
- `orden` — ids en el orden fijado a mano. Lo que no esté va detrás, en el
  orden de fábrica: una técnica nueva aparece al final, nunca desaparece.
- `borrados` — solo se usa en perfiles (`borrarCat()`). Los otros cuatro
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
- **El conmutador suma 6 "Electrodo sacacorchos"** al material previsto/real
  en cuanto se coloca (detalle en *Detalles de implementación* más abajo).
  **Se migraron a mano los 5 casos reales** que ya existían.
- **Campo del caso "Déficit postoperatorio" → "Evolución postquirúrgica"**,
  y de una línea de texto a un `<textarea>` de 4 filas (más sitio para
  escribir). Es el mismo campo (`deficit_postoperatorio`), solo cambia la
  etiqueta visible y el tamaño de la caja — no toca la columna del Sheet.
- **Etiqueta de L.Cubital/R.Cubital separada de "pegatinas"** — compartían
  etiqueta con los electrodos de superficie habituales (Mediano, Tibial
  post., Poplíteo, V2), así que cualquier uso de esos electrodos rutinarios
  se contaba y se mostraba bajo el nombre que el usuario le había puesto al
  cubital ("R. Periférico Cubital2", con precio), aunque no hubiera colocado
  ningún cubital de verdad. Ahora `l_cubital`/`r_cubital` usan su propia
  etiqueta de fábrica `electrodo_cubital` (sin precio, como toca). **Se
  corrigió también el catálogo real** (`etiquetas_usuario` en
  `estado.json`): se quitó el override de `pegatinas` (vuelve a "Pegatinas
  (par)", sin precio) y se creó `electrodo_cubital` → "R. Periférico
  Cubital2" (2€) en su lugar. **Se corrigieron también a mano los 4 casos
  reales** que ya tenían "R. Periférico Cubital2" en su material (ninguno
  usó nunca un cubital de verdad, comprobado antes de tocar nada): pasó a
  "Pegatinas (par)" en `material_previsto`/`material_real`, y
  `coste_material` bajó lo que esa cantidad aportaba a 2€/ud (entre 8€ y
  12€ según el caso) — `coste_completo` pasó a `false` en los que lo tenían
  a `true`, porque ahora sí hay un material sin precio de verdad.

### Retoques posteriores, 25-08-2026

- **L.Eye / R.Eye** en *Otros puntos de registro* — un único paquete de
  aguja trenzada para las dos (`media_unidad: true`), igual que Erb1/Erb2:
  se cuentan entre las dos como 1 paquete, no dos. Para el ERG
  (electrorretinograma).
- **Dos técnicas de monitorización nuevas**: `c_pev` ("c-PEV", potencial
  evocado visual cortical) y `erg` ("ERG", electrorretinograma), junto a
  PEV.
- **Cajas de texto más grandes**: "Resumen de la monitorización" de 6 a 8
  filas, "Incidencias técnicas" de 2 (el valor por defecto, no se
  especificaba) a 4. Solo tamaño, ningún campo ni columna del Sheet cambia.
- **`centro`: "VdC" → "HdN"** en los 3 casos reales que todavía lo tenían
  (2026-002, 2026-003, 2026-005) — cambio de nombre del centro, no hace
  falta tocar código porque `centro` es texto libre.

### Retoques posteriores, 26-08-2026

- **Categoría "GRID / MANTA" y precio por manta, no por electrodo**: una
  manta GRID son 8 tiras que vienen físicas juntas de fábrica, así que
  colocar 2 o 8 de ellas abre la misma manta y debía cobrarse una sola vez.
  Antes la etiqueta `electrodo_grid` cobraba por electrodo colocado, lo que
  sobrefacturaba cualquier caso con GRID. Ahora hay dos etiquetas
  independientes -`electrodo_grid_mantaA` y `electrodo_grid_mantaB`, para
  GRID A.1-A.8 y GRID B.1-B.8 (antes GRID 1-8, un solo grupo)- con un flag
  nuevo `"manta": true` que hace que `calcularCoste()` cuente 1 unidad por
  manta sin importar cuántas de sus entradas se coloquen; el material a
  preparar sigue mostrando el recuento real de posiciones. El flag tiene su
  propio checkbox "Se cobra por manta" en el gestor de etiquetas -si no,
  `guardarEtiqueta()` lo habría perdido la primera vez que el usuario le
  pusiera precio desde ahí, porque esa función reemplaza la etiqueta de
  fábrica entera por la del formulario-. **Se migró a mano** la etiqueta
  `electrodo_grid` (400€, puesta por el usuario) del repositorio de datos:
  pasó a `electrodo_grid_mantaA` con el mismo precio, y se creó
  `electrodo_grid_mantaB` también a 400€ (confirmado por el usuario, mismo
  producto). Ningún caso ni montaje real usaba GRID todavía, así que no hizo
  falta tocar `casos/` ni `montajes/` más allá de esa etiqueta.

- **Ficha del caso, rediseño completo a 9 puntos** (pedido tras usar la
  herramienta de verdad): se elimina el concepto de "cierre rápido" +
  "ampliar" (dos bloques, uno siempre visible y otro plegado en su
  mayoría) y se sustituye por **8 apartados `<details>` cronológicos,
  todos plegados por defecto**, más una barra de acciones fija (punto 9,
  fuera del scroll de la ficha): Identificación/Trazabilidad, Paciente,
  Cirugía, Anestesia, Montaje/Técnicas, Desarrollo intraoperatorio,
  Resultado/Correlación clínica, Docencia/Meta. `CAMPOS_RAPIDO` +
  `CAMPOS_AMPLIAR` (con sus sub-grupos `h4` y el `material` plegado aparte)
  se sustituyen por un único array plano `CAMPOS_CASO`, cada campo con su
  `g` (uno de los 8 apartados) y opcionalmente `dependeDe` (oculta el campo
  hasta que se marque esa casilla; ver `condicionalesPendientes` y el cierre
  de `renderFichaCaso()` que conecta cada casilla con sus campos
  dependientes). El botón/diálogo pasa de "Casos" a **"Creador de casos"**
  y, más tarde el mismo día, a **"Gestión de casos"** (nombre definitivo,
  claves `btn_casos`/`dlg_casos_titulo`/`dlg_caso_titulo`) al pedirlo el
  usuario; sigue siendo el único punto de acceso -`btn-casos` en la barra
  superior, sin ningún otro botón en la página que abra `dlgCasos`, ni
  siquiera bajo el Resumen-. La ficha muestra debajo del título un
  subtítulo con el identificador -"CASO 2026-XXX, nombre del caso"-.

  Cambios de modelo, todos con su migración a mano en `casos/` (5 casos
  reales, `2026-002` a `2026-006`):
  - **`region_nivel` eliminado**, absorbido por `anatomia_patologica` (es
    el mismo dato -qué parte se operó- en dos campos separados). Se
    concatenó el valor de `region_nivel` al final de `anatomia_patologica`
    en los 3 casos que solo tenían el primero, y se descartó en el único
    caso (`2026-004`) donde ambos campos ya traían el mismo texto.
  - **`pares_craneales_cuales` eliminado**, absorbido por el nuevo
    `notas_montaje_tecnicas` (campo libre del apartado 5, sin sitio propio
    ya). Migrado con el prefijo "Pares craneales monitorizados: " en los 2
    casos que lo tenían.
  - **`hubo_cambios_plan` nuevo** (checkbox): antes `cambios_respecto_al_plan`
    era una caja de texto siempre visible; ahora solo aparece si se marca
    esta casilla. Se puso a `true` en el único caso (`2026-003`) que ya
    tenía texto ahí.
  - **`posicion`: la opción genérica `"volteo"` se divide en cuatro** —
    `volteo_sp` (supino→prono), `volteo_ps` (prono→supino),
    `volteo_doble_sps`, `volteo_doble_psp`— más `lateral`, `park_bench` y
    `otros`; se quita `sedestacion` (ningún caso real la usaba). Los 2 casos
    reales con `posicion: "volteo"` (`2026-003`, `2026-004`) migraron a
    `volteo_sp`: su propio `posicion_detalle` ya describía supino→prono sin
    ambigüedad.
  - **`rol` reutilizado para "Mi papel"**: era nivel de supervisión
    (`observo`/`supervisado`/`autonomo`), pasa a ser quién rellena
    (`adjunto1`/`adjunto2`/`residente`) — dos ejes distintos, decisión del
    usuario. Los 4 casos reales con `rol: "supervisado"` migraron a
    `"residente"` (decisión explícita del usuario, no un mapeo automático).
  - **`recuperacion_senal`: de lista cerrada a área de texto libre** (ya no
    hay campo "Recuperación de la señal" con desplegable). Los valores
    codificados de los 3 casos reales que lo tenían se migraron a su texto
    ("no" → "No hubo", "completa" → "Completa"), igual que se hizo antes con
    "Reflejo H" y el cubital: el código cambia y el dato real se migra en el
    mismo turno.
  - **Campos nuevos sin dato previo que migrar**: `otros_datos_quirurgicos`
    (apartado 3) y `material_previsto` ganó su propio campo de solo lectura
    ("Material (montaje base)", tipo `material_ro` en `campoCaso()`) junto
    al ya existente `material_real` editable.

  El Sheet (`Codigo.gs`, `construirFilasCasos_()`) se actualizó en el mismo
  turno: cabecera y array `base` pierden las columnas `region_nivel` y
  `pares_craneales_cuales`, y ganan `otros_datos_quirurgicos`,
  `notas_montaje_tecnicas` y `hubo_cambios_plan` (booleano 0/1, mismo patrón
  que `alerta`/`coste_completo`). Las dos listas se revisaron a mano
  posición por posición para que sigan alineadas 1:1 -son 53 columnas base a
  cada lado-. **El arnés de pruebas de Node mencionado en este archivo no
  está en este repositorio** -no se encontró al hacer este cambio-, así que
  no se pudo re-ejecutar contra `Codigo.gs`; si existe en otro sitio,
  conviene pasarlo antes de instalar esta versión del script en el Sheet
  real.

  También cambió, en la misma pasada:
  - **Títulos de ventana con resalte**: `.card h2`, `.panel-cab h2` y
    `dialog h3` pasan de texto pequeño y gris a una "píldora" más grande con
    fondo `--accent-soft` y texto `--accent`, para distinguirse de un
    vistazo de los subtítulos internos (`grupo-titulo`, `h3` de caja,
    bloques del resumen…), que se quedan igual que estaban.
  - **Flechas ▸/▾ más visibles en toda la herramienta**: más grandes y en
    color `--accent` en vez de `--text-muted` -`.card > summary.card-cab`,
    `.grupo-titulo`, `#btn-plegar`, y las nuevas `.caso-grupo > summary`-.
  - **Las 6 ventanas principales empiezan plegadas** (antes Escenario,
    Montajes, Técnicas y Resumen se abrían solas): se quita `open` de sus
    `<details>`. **Cajas pasa a ser plegable** -antes era una `<section>`
    suelta, sin tarjeta ni título, siempre visible entera-, ahora
    `<details class="card" id="cajas">` con su propio `card-pista` ("N de M
    con material"). Al revisar el CSS de impresión se vio que **Cajas nunca
    salía en el papel** (`#cajas-contenido { display: none }` en
    `@media print`, igual que Montajes): se ajustó el selector a `#cajas`
    tras envolverla, sin cambiar el comportamiento.
  - **Bug real encontrado y corregido**: `.campo[hidden] { display: none; }`
    tuvo que añadirse a mano en `style.css`. Sin él, los campos con
    `dependeDe` (Tipo de alerta, Detalle de los cambios…) seguían
    visibles aunque su casilla estuviera desmarcada: `.campo { display:
    flex }` y el `[hidden]` nativo del navegador empatan en especificidad
    (0,0,1,0 los dos), y como `.campo` viene después en la hoja, gana ella.
    Se detectó probando en el navegador (`getComputedStyle` mostraba
    `display: flex` en un elemento con `hidden=true`), no por inspección de
    código. **Cualquier `[hidden]` nuevo sobre un elemento con una clase que
    ya trae su propio `display` hay que forzarlo así explícitamente -no
    basta con poner el atributo.**
  - **El mismo fallo, otra vez, en `#dlg-caso`** (reportado por el usuario:
    la ficha se veía metida en la página, debajo de la barra fija de
    "Corrigiendo el material del caso", en vez de desaparecer al cerrarla).
    `#dlg-caso { display: flex; ... }` pisaba el `display: none` de fábrica
    que trae un `<dialog>` sin el atributo `open` -mismo empate de
    especificidad que el caso de arriba, pero esta vez contra una regla del
    propio navegador en vez de un `[hidden]` puesto a mano-. Se corrigió
    acotando el selector a `#dlg-caso[open]`. **Regla general: cualquier
    `display` puesto a mano en un `<dialog>` (o en algo que dependa de
    `[hidden]`) tiene que ir condicionado a su estado -`[open]` o
    `[hidden]`-, nunca suelto en el selector base.**

### El clon local de checklist-mio-datos estaba desactualizado ~140 commits (26-08-2026)

Al ir a hacer `git push` de la migración de arriba se descubrió que el clon
local de `checklist-mio-datos` llevaba desde antes del 23-08-2026 sin
`git pull`: el repositorio remoto tenía ~140 commits más -usuarios reales
usando la herramienta en otro dispositivo, casos `2026-006` a `2026-009`
cerrados y editados, `Actualizar escenarios MIO-Check` varias veces-. Los 5
casos que se acababan de migrar a mano (ver arriba) habían cambiado también
en el remoto con contenido clínico real en el mismo rango de campos.

**Lección para la próxima vez que se toque `checklist-mio-datos` a mano
-fuera de la sincronización de la propia app-:** antes de editar nada,
`git fetch origin main` y comparar `HEAD` con `origin/main`
(`git log --oneline HEAD..origin/main`). Este repositorio lo escribe la app
sola, sin pasar por este clon, así que puede haber avanzado sin que se note
hasta el `push`. Editar a ciegas sobre una copia vieja y forzar el push
habría borrado silenciosamente ediciones clínicas reales (`centro`,
`deficit_postoperatorio`, `tipo_alerta`, correcciones de material…).

Resolución seguida (sin usar `push --force` ni `reset --hard`):
1. `git tag` de seguridad antes de tocar nada.
2. `git merge origin/main` -deja marcas de conflicto `<<<<<<<`, no decide
   por su cuenta-.
3. Cada conflicto se resolvió a mano campo por campo, no aceptando un lado
   entero: se conservó el contenido clínico real más reciente del remoto en
   los campos que la migración no tocaba, y se reaplicó la transformación de
   modelo (p. ej. `rol: "supervisado"` → `"residente"`) sobre el valor
   *actual* del remoto, no sobre el valor viejo con el que se había
   calculado originalmente.
4. **git no marcó como conflicto todos los solapes reales**: en más de un
   caso cambió `rol` en el remoto y en este lado sin marcarlo `<<<<<<<` -las
   líneas quedaban alineadas de forma distinta en cada versión-, así que el
   merge automático se quedó con un lado sin avisar. Se detectó revisando a
   mano, campo por campo, los 5 casos después de la fusión -no fiarse de que
   "sin marcas de conflicto" signifique "sin nada que revisar" cuando se
   sabe que dos lados tocaron el mismo campo.
5. **Bug de JSON real, y grave**: al fusionar `casos/4df789d1-…json`, un
   lado había añadido `"anatomia_patologica"` en un sitio del archivo y el
   otro lado en otro sitio distinto -ambos cambios no solapaban en líneas,
   así que ninguno quedó marcado como conflicto-, dejando dos claves
   `"anatomia_patologica"` en el mismo objeto JSON. JSON no rechaza claves
   repetidas, y `JSON.parse()` se queda calladamente con la última -que era
   la vacía-, perdiendo el valor migrado. Se encontró con un script que
   cuenta claves de primer nivel repetidas
   (`grep -n '^  "' archivo.json | ... | uniq -c`), no por inspección visual
   ni por un error en consola. **Después de cualquier fusión de un `.json`
   con conflictos, conviene pasar ese script sobre los archivos tocados**:
   una clave duplicada no da ningún error hasta que se lee el campo
   equivocado, silenciosamente.
6. Antes de dar el merge por bueno: `node --check`/`JSON.parse()` de cada
   archivo tocado, y una relectura campo a campo de `rol`, `posicion`,
   `recuperacion_senal`, `anatomia_patologica` y `notas_montaje_tecnicas` en
   los 5 casos para confirmar que la migración sobrevivió con el contenido
   correcto.

### El script del Sheet real llevaba desde antes del 23-08-2026 sin actualizar (26-08-2026)

El usuario reportó que su Google Sheet no traía las columnas
`TEC_<etiqueta> - alteración` (alteraciones por técnica, añadidas en el
commit `d884833` del 23-08-2026). El código de `apps-script/Codigo.gs` en
este repositorio ya las genera bien -comprobado leyendo
`columnasTecnicas_()`-: el problema no era el código, era que **el script
pegado a mano en su Apps Script real es de antes de esa fecha**, y a
diferencia de la app (que se actualiza sola con cada `git push`),
`Codigo.gs` no se actualiza solo — se queda congelado en lo que se pegó la
última vez, para siempre, hasta que alguien lo vuelva a pegar.

El README solo documentaba la instalación desde cero, nunca cómo actualizar
una instalación ya existente, así que no había manera de que el usuario
supiera qué hacer con esto. Se añadió una sección **"Actualizar el script si
ya lo tenías instalado"** justo después de los pasos de instalación: pegar
de nuevo el contenido completo de `Código.gs` y pulsar *Reconstruir ahora*.
**Cualquier cambio futuro en `Codigo.gs`** (columnas nuevas, campos
renombrados) tiene este mismo problema en potencia: el repositorio se
actualiza con el `git push`, pero el Sheet real del usuario no se entera
hasta que alguien vuelve a pegar el script a mano. Vale la pena recordárselo
al usuario explícitamente cuando se toque este archivo, no dar por hecho que
se actualiza solo.

### Retoques posteriores, 26-08-2026 (tarde): barra en dos filas, dificultad, cajas 5-6

- **`.barra-sup` en dos filas** (`.barra-fila` + `.barra-fila-casos`): fila 1
  identidad/contexto (marca, perfil, montaje, EN, Docente), fila 2 Gestión
  de casos + Sincronizar, aparte porque son las dos cosas que se tocan a
  media cirugía. `--header-h` pasa de `44px` (una fila) a `82px` (las dos
  juntas, medido en el navegador) — lo usan `.barra-caso` y `.panel-catalogo`
  para su offset `sticky`; si se vuelve a tocar la altura de la barra, hay
  que remedir y actualizar esta variable a mano, no hay cálculo automático.
- **Dificultad junto a la estrella** en el listado de Gestión de casos
  (`.caso-fila-dificultad`, "N/5"), mismo motivo que la estrella: verla sin
  abrir el caso.
- **Dos cajas nuevas, `caja_etiqueta_5` y `caja_etiqueta_6`**, mismo patrón
  que 3/4 (8 canales cada una, numeración 1-8 y 9-16 propias, no continúan
  la de las cajas 3/4). `CAJAS = DATA.cajas_material` se recorre con
  `Object.keys()` en todos lados, así que no hizo falta tocar nada más para
  que aparecieran.
- **Cajas 3-6 ahora plegables y cerradas por defecto** dentro de la ventana
  Cajas -antes las seis physical boxes de refuerzo/registro se veían
  siempre enteras, seis diagramas de cableado a la vista aunque casi nunca
  se usen-. Nuevo flag `"plegable": true` en `cajas_material` (mismo patrón
  que `"manta"` en etiquetas): `infoCaja()` lo pasa a `renderCajaFisica()`,
  que construye la tarjeta como `<details><summary>` en vez de
  `<div><div>` cuando está presente. **Cuidado al probar esto con
  `getBoundingClientRect()` o `getComputedStyle().display` desde JS: en el
  entorno de pruebas de este proyecto (Browser pane) esas dos APIs
  devuelven la altura/`display` como si el `<details>` estuviera abierto
  incluso estando cerrado -pasa hasta con un `<details>` vacío recién
  creado, no es nada de esta app-, así que dieron un falso positivo de "no
  se pliega".** La comprobación fiable fue `get_page_text` (extracción de
  texto visible): con la caja cerrada no aparece nada de su diagrama
  (ni "kΩ" ni los números de canal), solo la cabecera. Para verificar que un
  `<details>` se pliega de verdad, comprobar el texto/contenido
  renderizado, no las medidas de layout vía JS.

### Retoques posteriores, 26-08-2026 (noche): reflejos agrupados en la ficha del caso

- **`hr_popliteo` → "H-R Gastrocnemio"** y **`hr_masetero` → "H-R Masetero
  (Jaw Jerk)"** (antes "HR Poplíteo" y "H-reflex del masetero (Jaw Jerk)").
  Solo cambia `etiqueta` -y su traducción en `data/i18n-en.js`-, los ids se
  quedan igual: `hr_popliteo`, `hr_masetero` y `mapeo_material_qx` están
  usados en casos y montajes reales (comprobado en el repo de datos), así
  que renombrar en vez de recrear era obligatorio, no una preferencia de
  estilo.
- **Técnica nueva `hr_cuadriceps`** ("H-R Cuádriceps"), sin descripción
  inventada -mismo criterio que las demás técnicas añadidas a mano: mejor
  en blanco que una descripción clínica que nadie ha confirmado-.
- **`mapeo_material_qx` desactivada** ("Material Qx"), a petición del
  usuario y sin motivo dado; comprobado que ningún caso ni montaje real la
  usaba, así que no hizo falta migrar nada.
- **Nuevo campo `"reflejo": true`** en `data/surgeries.js` sobre las
  técnicas que son reflejos (Blink Reflex, RBC, Reflejo H y sus tres
  variantes activas, los 5 reflejos trigeminales, y los 2 unificados
  desactivados). Es aparte de `"grupo"` -que sigue siendo solo
  `monitorizacion`/`mapeo` y lo sigue usando la ventana Técnicas del todo
  igual, sin tocar-: `"reflejo"` es una subclasificación nueva, solo para
  agrupar visualmente dentro de la ficha del caso.
- **Espacio visual entre bloques en "Técnicas realizadas" y "Técnicas con
  alteración"** (Gestión de casos, apartado 5 y 6): `bloquesTecnicas()`
  reparte la lista ya filtrada en monitorización (sin reflejos) / reflejos
  / mapeo conservando el orden del catálogo dentro de cada cesta, y
  `anadirChipsAgrupados()` cuelga los chips con un `.chip-espacio` -un
  `div` con `flex-basis:100%` dentro del `.chip-fila` flex-wrap, fuerza el
  salto de línea- entre cada bloque no vacío. La ventana Técnicas principal
  no se toca: sigue con sus dos grupos de siempre
  (`grupo_monitorizacion`/`grupo_mapeo`), el reparto en tres es solo dentro
  de la ficha del caso, como pidió el usuario.

### Retoques posteriores, 27-08-2026: Estado "Cancelado" y cabecera del Sheet

- **Nuevo valor `"cancelado"` en `estado`** (apartado 1, Identificación/
  Trazabilidad), junto a los ya existentes `preparado`/`cerrado`. Al
  elegirlo aparece un campo nuevo, **`motivo_cancelacion`** (área de texto),
  con el mismo mecanismo `dependeDe` que ya usaban "Detalle de los cambios"
  o "Tipo de alerta" -oculto hasta que se cumple la condición-. Hasta ahora
  `dependeDe` solo sabía depender de una **casilla** marcada (`control.checked`);
  aquí depende de que un **desplegable** tenga un valor concreto
  (`estado === "cancelado"`), así que se generalizó a aceptar también
  `dependeDe: { c: "<campo>", v: "<valor>" }` en vez de solo el id de una
  casilla -ver `campoCaso()` y el cierre de `renderFichaCaso()` que conecta
  cada condicional con su control-. Cualquier campo condicional futuro que
  dependa de un desplegable (no de una casilla) sigue este mismo patrón.
- **Un caso cancelado no llegó a monitorizarse de verdad**, así que en el
  Sheet solo cuenta para lo que sí es real de él: Trazabilidad (fecha,
  nombre_caso, centro) y Paciente. `construirTecnicasLong_()` y
  `construirMaterialLong_()` (`Codigo.gs`) ahora filtran `estado !==
  "cancelado"` antes de construir sus filas -un caso cancelado puede
  arrastrar `tecnicas_realizadas`/`material_previsto` de cuando estaba en
  preparación, y no deben contar como técnica/material realmente usado-.
  La hoja `Casos` sí conserva el caso entero, con su columna nueva
  `motivo_cancelacion` justo al lado de `estado` en `cabecera`/`base` de
  `construirFilasCasos_()` -54 columnas base ahora, no 53-. `Meta` suma una
  fila **"Casos cancelados"** con el recuento, calculada en `construirMeta_()`.
  **No hizo falta migrar nada** en el repositorio de datos: es un valor y un
  campo nuevos, ningún caso real usaba `estado: "cancelado"` antes de que
  existiera.
- **Cabecera de `Casos`, `Tecnicas_long`, `Material_long` y `Listas`
  recoloreada**: el tema `BandingTheme.TEAL` de Sheets deja la cabecera en
  verde con el texto en negro por defecto de Sheets, poco legible -lo que el
  usuario reportó como "el negro con el verde actual no es agradable"-. En
  vez de cambiar de tema (perdería el franjeado alterno del resto de filas,
  que sí gustaba), `formatearTabla_()` y `formatearListas_()` ahora capturan
  el objeto `Banding` que devuelve `applyRowBanding()` y llaman a
  `banding.setHeaderRowColor(COLOR_CABECERA_FONDO)` para sobreescribir solo
  el color de la cabecera -intentar poner el color con
  `Range.setBackground()` no sirve aquí: mientras el franjeado está activo,
  manda él sobre el fondo de las celdas banded, hay que tocar el propio
  objeto `Banding`-. El color elegido, `#14705a`, es el mismo verde de
  acento que usa la web (`--accent` en `style.css`), con texto blanco
  (`setFontColor`, que sí es cosa de la celda y no del franjeado, así que
  ese sí funcionaba ya antes). `formatearMeta_()` no se tocó: no usa
  franjeado ni tema, no tenía este problema.
- **Pendiente para el usuario**: como con cualquier cambio en `Codigo.gs`
  (ver la sección de arriba, "El script del Sheet real llevaba desde antes
  del 23-08-2026 sin actualizar"), este cambio no llega solo al Sheet real
  -hay que volver a pegar `Código.gs` a mano en el editor de Apps Script y
  pulsar *Reconstruir ahora* para verlo reflejado, incluida la columna
  `motivo_cancelacion` y el nuevo color de cabecera-.

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

### Retoques posteriores, 31-08-2026: puente montajes↔casos, retirada de Escenario, guía de uso

Trabajo grande, hecho por fases con el usuario aprobando cada una. Antes de
esto el puente entre montajes y casos era de una sola dirección
(`casoDesdeEscenario()`); ahora es de ida y vuelta.

**Fase 1 — Cargar una plantilla sobre un caso ya creado.** Botón *Cargar
plantilla…* en el apartado 5 de la ficha y en la barra fija de corrección.
Reglas que hay que conservar si se vuelve a tocar esto:
- **Copia, nunca enlace vivo.** Aplicar una plantilla copia
  `asignaciones`/`extras`/`etiquetas`/`conmutador`/`tecnicas` en el caso.
  Editar la plantilla después no cambia nada de lo ya copiado -verificado a
  mano: aplicar → cerrar caso → renombrar y vaciar la plantilla → reabrir el
  caso → sigue intacto-.
- **Confirmación siempre**, tenga o no material el caso -ni siquiera un caso
  vacío se salta el diálogo-, con los números reales de qué va a pasar
  (`contarOcupadas`/`contarRellenables`, ver `app.js` sección "Fase 1").
- **Caso `cerrado` y caso `cancelado` van al mismo nivel**: los dos piden la
  misma confirmación adicional (vía `confirm()` nativo, antes de abrir el
  selector), nombrando el estado. Un caso cerrado ya viajó al Sheet; uno
  cancelado no debería recibir una plantilla nunca, así que si llega ahí es
  casi seguro un error de pulsación.
- Reutiliza `montajeDesdeCaso()`/`volcarMontajeEnCaso()`/`guardarMontajeEnCaso()`
  tal cual estaban: no se tocó su lógica.

**Fase 2 — Mostrar `montaje_origen`.** Ya existía el campo (string, el uid
de la plantilla); solo faltaba pintarlo en el apartado 5, resuelto en vivo
contra `montajes[uid]`. **Trade-off consciente**: el nombre no se congela
-si renombras la plantilla, los casos que salieron de ella muestran el
nombre nuevo-. Congelarlo pediría un campo nuevo y una columna nueva en el
Sheet; se descartó a propósito. Si la plantilla ya no existe localmente,
muestra "plantilla no disponible", nunca el uid crudo.

**Fase 3 — Guardar el montaje de un caso como plantilla nueva.** Botón
*Guardar este montaje como plantilla…* en el mismo apartado 5, disponible
**en cualquier estado del caso**, sin gate de confirmación -al contrario que
la Fase 1, aquí no hay ningún riesgo de sobrescritura: siempre nace un
montaje nuevo (`montajeNuevo()`, uid propio, nunca `__caso__...`), nunca se
sobrescribe uno existente, y el caso no se toca en absoluto-.

**Fase 4.0 — Retirada del catálogo de tipos de cirugía ("Escenario").**
Decidido con el usuario: duplicaba casi literalmente al `diagnostico` de la
ficha del caso (Tumor ST/LOE ST, ECC/ECC, ECL/ECL, MAV/MAV,
Escoliosis/Escoliosis), y `diagnostico` es más completo (14 valores frente a
8). Se retiraron `ESCENARIOS_TIPO`/`ESCT`/`ESCENARIOS_BASE`,
`escenarioPorNombre()`, la pestaña *Escenarios* de Catálogos (quedan cinco:
Técnicas, Servicios, Intervenciones, Perfiles, Usuarios), los chips de la
ventana 1, `escenario_id` en `montajeNuevo()`/duplicar/presets de fábrica, y
la escritura de `caso.escenario_nombre` en `casoDesdeEscenario()` (el campo
se queda en `casoVacio()` sin tocar, por la regla de no cambiar el modelo
del caso — solo deja de rellenarse). **Se perdió el autocompletado de
intervención/servicio** que comparaba el nombre del escenario contra el
catálogo de Intervenciones al crear un caso: es una pérdida real, pequeña,
ya avisada al usuario.

`escenarioActual()`, `casoDesdeEscenario()` y el parámetro `esc` de medio
`app.js` **no se tocaron**: es el otro significado de "escenario", heredado
de antes de que existiera el catálogo retirado (significa "montaje"). Los
dos significados convivían en el código con nombres parecidos; solo se
retiró uno.

`data/surgeries.js` conserva `escenarios_tipo` inerte, sin tocar -regla de
"desactivar no borra" aplicada a una funcionalidad entera-. Los montajes y
casos ya sincronizados conservan su `escenario_id`/`escenario_nombre` tal
cual estén, sin migración ni limpieza. **Nota técnica no cubierta por esa
regla**: si algún dispositivo tenía `catalogos.escenarios` personalizado en
su `estado.json` (edits a mano del catálogo retirado), la app deja de
leerlo y escribirlo -no se borra el archivo remoto a propósito, pero la
próxima subida ya no lo llevará-. El usuario confirmó que no lo usaba.

**Codigo.gs**: se quitó la columna `escenario_nombre` de `cabecera`/`base`
en `construirFilasCasos_()` -decisión del usuario, opción "quitar ya" frente
a "dejarla vacía"-. **54 → 53 columnas base**, verificado 1:1 a mano (no hay
arnés de Node en este repositorio para volver a pasarlo, ver nota de
23-08-2026 más abajo). **Pendiente para el usuario: repegar `Código.gs`** en
el editor de Apps Script, como con cualquier cambio ahí.

**Fase 4.1 — Diálogo "Montajes" (la biblioteca).** Sustituye a las ventanas
*Escenario* y *Montajes personales* de la página, retiradas enteras. Lista
plana (sin escenario que agrupe), filtro por nombre/autor, entradas
ocupadas por fila. "+ Montaje en blanco" fijo arriba -mismo `montajeNuevo()`
que el viejo botón "Nuevo", sin prompt, un clic-. Elegir una fila cierra el
diálogo y carga el banco de trabajo **sin confirmación**: no hay riesgo,
cada montaje es su propio archivo. Duplicar/Renombrar/Vaciar/Borrar se
movieron tal cual -mismo `exigeSerAutor()`-, con una llamada añadida a
`sincronizarDlgMontajesSiAbierto()` al final de cada uno para que la lista
del diálogo no se quede obsoleta si sigue abierto (mismo patrón que
`if (dlgCasos && dlgCasos.open) renderListaCasos()`, ya usado en otro
sitio).

**Fase 4.2 — Rótulo permanente.** `#barra-caso` generalizado: *"Plantilla:
X"* (fondo `--accent-soft`, nombre en `--accent`) o *"CASO ..."* (fondo
`--accent` sólido, con los tres botones) según `body.editando-caso`.
**Se movió de sitio en el DOM** -antes vivía después de `</main>`, ahora
entre la cabecera y `<main>`-: estando siempre visible (ya no se
oculta/muestra con `hidden`), su `position: sticky` necesitaba arrancar
cerca de la cabecera para "engancharse" de verdad; en su posición vieja,
con contenido corto en pantalla, casi nunca llegaba a pegarse arriba al
hacer scroll -se detectó probando la Fase 1 en el navegador, antes de mover
nada-. `--header-h` no cambió (sigue 82px), pero se añadió `--barra-caso-h`
(32px en modo plantilla, 48px en modo caso, medidos a mano) porque
`.panel-catalogo` tenía que dejarle sitio también al rótulo, no solo a la
cabecera -mismo patrón manual de remedir, sin cálculo automático-.

**Bug real encontrado y corregido**: `.barra-caso-acciones[hidden]`
necesitaba el mismo arreglo que ya documenta este archivo para
`.campo[hidden]` (26-08-2026) — una clase con su propio `display: flex`
empata en especificidad con el `[hidden]` nativo y gana por ir después en
la hoja. Se detectó en el navegador: los tres botones de corrección
aparecían en modo plantilla, donde no debían. **Cualquier `[hidden]` nuevo
sobre un elemento con una clase que ya trae su propio `display` sigue
necesitando la regla explícita** -van ya dos veces, es un patrón real de
este proyecto, no una casualidad.

**Ajustes de UX pedidos tras usar el puente de verdad** (mismo turno):
- El panel Catálogo se pliega pulsando toda su barra (`.panel-cab`), no
  solo la flechita `#btn-plegar` -igual que el resto de tarjetas, que son
  `<summary>` nativos y ya respondían en toda la fila-.
- El rótulo permanente en modo plantilla pasó de texto gris suelto a fondo
  `--accent-soft` y nombre en `--accent`, negrita: pedido explícito de que
  el montaje activo se vea bien a simple vista.
- *Corregir el material y el montaje* se movió de "al final de la ficha,
  fuera de los 8 apartados" al apartado 5 (Montaje/Técnicas), como primera
  de las tres acciones: era la queja real -"no veo dónde tengo colocado
  cada cosa, solo técnicas y material"-, y el botón vivía lejos de donde se
  mira eso.
- `umbral_tornillos_pediculares` pasó del apartado 5 al 6, justo debajo de
  `resumen_monitorizacion` -mismo campo, mismo modelo, solo cambia el grupo
  (`g`) y la posición dentro de `CAMPOS_CASO`; no toca `Codigo.gs`, que
  busca columnas por nombre-.
- Botón **Exportar casos**, junto a Sincronizar: `casosACsv()` construye un
  CSV con las mismas 53 columnas base que `construirFilasCasos_()` -sin las
  columnas `TEC_<etiqueta>`-, reutilizando `intervencionDe()`/
  `resumenMonitorizacionDe()`/`tipoAlertaDe()` tal cual las usa la ficha,
  para que un caso antiguo se lea igual aquí que en pantalla. Pensado para
  no depender del disparador diario de Apps Script; si algún día cambia la
  cabecera de `construirFilasCasos_()`, `COLUMNAS_CSV_CASOS` hay que
  revisarla a la vez -son la misma tabla, en dos sitios ahora-.

**Fase 5 — Guía de uso.** Diálogo nuevo (`btn-guia`/`dlg-guia`), contenido
en [`data/guia.js`](data/guia.js) -mismo patrón `window.X = {...}` que
`data/surgeries.js`, por el bloqueo de `fetch()` en `file://`-. Seis
tarjetas cortas + acordeón de quince puntos, todo verificado contra el
código real antes de escribirlo, no contra lo que "sonaba bien". Decisión
del usuario: **solo en castellano por ahora**, con aviso visible dentro del
propio diálogo cuando la interfaz está en inglés (`guia_aviso_en`, se
actualiza en `aplicarTextos()`). No se sincroniza, no se guarda nada de
ahí, excluida de la impresión (clase `no-print`).

**Nota de mantenimiento importante**: `data/guia.js` es la **segunda**
descripción del flujo de trabajo que existe en el proyecto, después de este
`README.md`. Si se vuelve a tocar el flujo -qué es plantilla, qué es caso,
dónde vive cada botón-, hay que revisar **los dos** archivos en el mismo
turno. Quedarse solo con el README es exactamente el tipo de desincronización
silenciosa que ya pasó una vez con el script del Sheet (ver 26-08-2026 más
abajo) — nadie avisa cuando uno de los dos se queda obsoleto.

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
