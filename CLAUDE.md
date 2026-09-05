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
| `data/surgeries.js` | Lo de fábrica: cajas, etiquetas, catálogo, técnicas, perfiles, tipos de escenario. `escenarios` (presets de montaje) vacío a propósito desde el 03-09-2026 | Nunca: está en git |
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
anterior, que al arrancar se convierten en montajes (`fab_<clave>`). Vacío a
propósito desde el 03-09-2026 — ver "Retoques posteriores" de esa fecha:
`limpiarMontajesHeredados()` borra en cada arranque cualquier montaje
`de_fabrica: true` que hubiera, así que sembrar algo aquí ahora mismo no
sobrevive al mismo arranque en que se crea.

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
| Pantalla Docencia (miotomas, cama de quirófano) | `renderDocente()`, `renderCama()` | ver `grep` |
| Puente plantilla↔caso (cargar/guardar) | `iniciarCargaPlantilla()`, `aplicarPlantillaSobreDestino()`, `guardarMontajeComoPlantilla()` | ver `grep` |
| Biblioteca de plantillas ("Plantillas de montajes" desde el 06-09-2026, tarjeta ya no diálogo desde la Fase 6) | `renderListaMontajesDialog()`, `montajeNuevo()`, `compararMontajesPorNombre()`, `limpiarMontajesHeredados()` | ver `grep` |
| Pantalla de inicio y router de pantallas (Fase 7) | `irAPantalla()`, `pantallaActiva()` | ver `grep` |
| Rótulo permanente | `renderBarraCaso()` | ver `grep` |
| Exportación manual de casos a CSV | `casosACsv()`, `COLUMNAS_CSV_CASOS` | ver `grep` |
| Informe en PDF (imprimible), uno o varios casos | `abrirInformeCasos()`, `construirInformeCaso()`, `seccionInforme()` y el resto de `seccion*Informe()` | ver `grep` |
| Guía de uso (contenido en `data/guia.js`) | `renderGuia()`, `abrirGuia()` | ver `grep` |

Datos de fábrica en `data/surgeries.js`: `cajas_material`, `etiquetas` (35,
con `precio` y `fungible` — ver *Coste del material* en README),
`catalogo_material` (~260 ítems), `tecnicas` (~40, monitorización y mapeo),
`servicios`, `intervenciones`, `perfiles_procedimiento`, `escenarios_tipo`
(los tipos de cirugía: Tumor ST, ECC, ECL… **inerte desde el 31-08-2026**,
ver "Retoques posteriores" de esa fecha — nada en `app.js` lo lee ya),
`escenarios` (montajes de fábrica, ojo con el nombre heredado — ver más
abajo; **vacío a propósito desde el 03-09-2026**) y `miotomas` (solo para la
ventana Docente, sin uso en el cálculo de material).

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
- *Corregir el material y el montaje* (renombrado *Editar material y
  montaje* el 06-09-2026, ver más abajo) se movió de "al final de la ficha,
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

### Retoques posteriores, 31-08-2026 (tarde): reorganización de la barra superior, pedida tras usar el puente de verdad

Mismo día, turno aparte, tras probar en real el trabajo de la mañana:

- **Botón "Montajes" movido al rótulo permanente** (`#barra-caso`), a la
  derecha del todo, visible solo cuando el rótulo dice "Plantilla: X" -en
  modo caso ese hueco lo ocupa `.barra-caso-acciones`, mutuamente
  excluyentes, ambos alternados en `renderBarraCaso()`-. Ya no vive en
  `.barra-fila-casos`.
- **"Guía de uso" / Idioma / "Docente" agrupados en un desplegable "⋮"**
  (`.menu-desplegable`/`#menu-lista`, primera fila de la cabecera). Mismo
  patrón de bug que `.campo[hidden]`: `.menu-lista` pone su propio
  `display: flex`, así que necesita `.menu-lista[hidden] { display: none; }`
  explícito -van ya tres veces con este mismo empate de especificidad en el
  proyecto (`.campo[hidden]`, `.barra-caso-acciones[hidden]`, y este):
  cualquier `[hidden]` nuevo sobre algo con `display` propio lo necesita
  sin excepción-. Se cierra solo, al elegir una opción o al pulsar fuera
  (`document.addEventListener("click", ...)` a nivel de documento).
- **"Exportar casos" movido dentro de `dlg-casos`**, en la barra de
  acciones fija, primero (izquierda) en vez de junto a Sincronizar.
- `.barra-fila-casos` queda solo con Gestión de casos y Sincronizar.
- **Fuente del nombre del montaje en el rótulo permanente**, que se había
  dejado a `1.02rem` en el retoque de la mañana, vuelve al tamaño heredado
  del resto de la barra (`0.86rem`) — quedaba más grande que el resto de la
  interfaz, pedido explícito de que fuera igual, no solo "más visible".
- **Detalle canal a canal dentro de la ficha del caso** (apartado 5,
  Montaje/Técnicas): la queja real fue "en Gestión de casos no veo dónde
  tengo colocado cada cosa, solo técnicas y material". Se añadió la misma
  vista de "Cajas necesarias" que ya existía en Resumen
  (`.resumen-caja`/`.resumen-entrada`, con `aplicarEstilo()` para los
  bordes de color), de solo lectura, construida con
  `calcularResumen(montajeDesdeCaso(c))` -mismas dos funciones que ya
  sostenían toda la Fase 1, ninguna lógica nueva, solo un pintado nuevo-.
  Solo aparece si el caso tiene montaje (`c.n_cajas`).

README.md y data/guia.js revisados en el mismo turno (nota de mantenimiento
de arriba, aplicada de inmediato): las menciones a dónde vive cada botón
-Montajes, Exportar casos, Idioma/Guía/Docente- se actualizaron a la vez que
el código, no en un turno aparte.

### Retoques posteriores, 03-09-2026 a 04-09-2026: Montajes pasa a pantalla principal, y limpieza de fábrica

Trabajo grande, hecho por fases con el usuario aprobando cada una — mismo
patrón que el puente montajes↔casos del 31-08-2026.

**Fase 1 — reorganización pequeña.**
- **Catálogos** se mueve a la barra superior, junto al perfil (antes en una
  barra suelta encima de Técnicas). **Importar copia, Exportar copia,
  Imprimir y Restablecer** se mudan dentro de ese mismo diálogo, arriba del
  todo — la vieja `<section class="toolbar">` desaparece. `#guardado-aviso`
  (el aviso de "Guardado a las…") tuvo que reubicarse aparte, en la
  cabecera: es un aviso global (se usa en sync, casos, montajes…), no solo
  de Catálogos, así que dejarlo dentro del diálogo lo habría hecho invisible
  en cuanto el diálogo estuviera cerrado — se detectó antes de que llegara a
  pasar, revisando qué más llamaba a `avisoGuardado()`.
- **Barra de acciones de la ficha del caso**: se quita el botón dinámico
  "Cerrar caso"/"Marcar como preparado" (el id `caso-btn-cerrar-caso` y la
  clave `caso_reabrir` ya no existen). En su lugar, un botón fijo
  **"Volver a la lista"** (`caso-volver`) que solo navega, nunca guarda ni
  toca el estado — cerrar un caso se hace cambiando el propio campo
  **Estado** en Identificación/Trazabilidad, como cualquier otro campo.
  Nuevo botón **"Crear informe"** (`caso-crear-informe`), a la izquierda,
  sin función todavía — solo un aviso de "en camino" al pulsarlo
  (`avisoGuardado`). Orden final: Borrar caso · Crear informe · (flex) ·
  Volver a la lista · Guardar.
- **`hr_popliteo` → "H-R Sóleo"** (antes "H-R Gastrocnemio"). Mismo patrón de
  siempre: solo cambia `etiqueta` (y su traducción en `data/i18n-en.js`), el
  id no se toca porque está en casos y montajes reales.

**Fase 2 — Montajes deja de ser un `<dialog>` y pasa a ser la pantalla
principal.** El cambio más grande de las tres fases:
- `<dialog id="dlg-montajes">` se convierte en `<details class="card"
  id="montajes">`, primera tarjeta de `.columna-principal`, antes de
  Técnicas. La variable JS sigue llamándose `dlgMontajes` -mismo papel, algo
  que se abre y se pliega solo al elegir-, pero `showModal()`/`close()`
  pasan a ser `.open = true`/`.open = false`. `abrirDlgMontajes()` y el
  botón `#btn-montajes` de la barra fija (visible solo en modo "Plantilla:
  X") se retiraron enteros en la Fase 2.5 de abajo, ver más adelante -en
  esta Fase 2 todavía existían-.
- **Bug real encontrado al mover esto**: al arrancar, nadie llamaba a
  `renderListaMontajesDialog()` -antes solo se pintaba al abrir el
  diálogo-, así que la tarjeta abría vacía. Se resolvió añadiendo
  `sincronizarDlgMontajesSiAbierto()` al final de `renderTodo()` -mismo
  patrón condicional de siempre (solo repinta si `dlgMontajes.open`), así
  que no hace trabajo de más cuando está plegada-. Esto dejó redundantes
  las llamadas sueltas a `sincronizarDlgMontajesSiAbierto()` que ya existían
  después de cada `renderTodo()` en Duplicar/Renombrar/Vaciar/Borrar: se
  quitaron esas cinco llamadas repetidas.
- **Nuevo botón "Guardar montaje"**, con un diálogo propio
  (`dlg-guardar-montaje`) de dos opciones -mismo patrón que
  `dlg-aplicar-plantilla`-: **Sobrescribir este** (oculto si el montaje
  activo no es tuyo) o **Guardar como nuevo** (mismo camino que Duplicar,
  factorizado en `duplicarMontajeComo(esc)` para no repetir el código dos
  veces). No cambia el modelo de permisos existente: el material ya se
  autoguardaba en cada colocación (`colocar()` no comprueba autoría, nunca
  lo ha hecho, ver "Duplicar sí funciona sobre el montaje de otro" más
  arriba); esto es una confirmación explícita más, no un mecanismo de
  protección nuevo.
- **Montajes, Catálogo, Técnicas, Cajas y Resumen arrancan todos
  plegados** (Montajes se dejó desplegado por error en un primer commit, se
  corrigió el mismo día al pedirlo el usuario). Catálogo, antes solo se
  plegaba en móvil tras colocar material (`plegarCatalogo()`); ahora
  también arranca plegado de fábrica, pero **solo en pantallas ≤900px** — en
  escritorio sigue como barra lateral fija siempre visible, a propósito
  (colapsarla ahí obligaría a desplegarla a mano antes de poder colocar
  nada, contra el propio diseño de la columna lateral).

**Fase 2.5 — limpieza pedida después de probar la Fase 2 en real:**
- **Botón "Montajes" de la barra fija (`#btn-montajes`) retirado del
  todo** -quedaba duplicado con la tarjeta, que ya está siempre a la
  vista-: `abrirDlgMontajes()`, su listener, la lógica de
  mostrar/ocultar en `renderBarraCaso()`, la regla CSS `#btn-montajes` y las
  claves i18n `btn_montajes`/`btn_montajes_tit` se quitaron enteros.
- **Todos los montajes de fábrica, fuera** (pedido explícito del usuario,
  no solo dejar de crear más): `DATA.escenarios` se vació en
  `data/surgeries.js` (antes 2 presets: Artrodesis + descompresión, Tumor
  supratentorial con GRID). Nueva `limpiarMontajesHeredados()`
  (`app.js`, llamada justo después de `sembrarMontajes()` en el arranque):
  borra cualquier montaje ya existente marcado `de_fabrica: true`
  (`fab_<clave>`, venga de este `DATA.escenarios` o de uno que ya no esté
  ahí, como el histórico `fab_tumor_it`), por el mismo camino que "Borrar"
  a mano -deja marca en `montajesBorrados` para que la sincronización
  también los borre en el repositorio-.
- **Bug de fondo encontrado al investigar esto, más serio**: `estado.json`
  lleva desde la migración de agosto de 2026 escribiendo siempre
  `escenarios`/`activo` con la **foto congelada** de los montajes de antes
  de "un archivo por montaje" (`legadoEscenarios`/`legadoActivo`, pensada
  solo como red de seguridad de esa conversión, nunca como dato vivo — ver
  el comentario de `estadoActual()`). El problema: `aplicarEstado()` -que
  corre al **bajar** o **importar** cualquier copia- volvía a leer ese
  bloque y a **repoblar `legadoEscenarios`**, y `sembrarMontajes()` lo
  convertía otra vez en montajes `mig_<clave>` si no existían ya. Es decir:
  cualquier "Bajar" con una copia vieja podía **resucitar montajes
  heredados** sin que nada de la limpieza de arriba (pensada solo para
  `fab_*`) los detectara. Solución en dos partes:
  1. `cargarEstado()` y `aplicarEstado()` dejan de leer
     `guardado.escenarios`/`copia.escenarios` hacia `legadoEscenarios` — se
     queda siempre en `null`, así que el bloque de `sembrarMontajes()` que
     lo convertía nunca se ejecuta ya (no hizo falta tocar esa función).
  2. `limpiarMontajesDeFabrica()` pasa a llamarse
     **`limpiarMontajesHeredados()`** y además de `de_fabrica: true` borra
     cualquier montaje con uid que empiece por `mig_` -sin esa marca, es el
     único identificador que queda una vez retirada la foto que los
     generaba-.

     `guardarEstado()`/`estadoActual()` **siguen escribiendo** el campo
     `escenarios` (como `{}`, porque `legadoEscenarios` ya nunca se puebla)
     por compatibilidad de formato -otro código que lea `copia.escenarios
     || {}` no se rompe-, pero ya no significa nada. **Aviso real para el
     usuario, no resuelto por completo**: el `estado.json` que ya estaba
     subido a GitHub antes de este cambio sigue teniendo su `escenarios`
     con contenido hasta la próxima vez que algo dispare una subida normal
     (cualquier acción que llame a `guardarEstado()` — un cambio de
     catálogo o etiquetas, no colocar material, que usa
     `guardarMontajeActivo()` aparte). Hasta entonces, el diálogo de
     "Bajar" puede seguir mostrando "N escenario(s)" en su cuenta
     -`Object.keys(copia.escenarios).length` sobre el archivo remoto
     todavía viejo-, aunque ya no tenga ningún efecto real.
- **Orden alfabético en la biblioteca de Montajes** (antes "los tuyos
  primero, luego alfabético"), pedido explícito del usuario: nuevo
  comparador único `compararMontajesPorNombre()`, usado tanto en
  `renderListaMontajesDialog()` como en `renderListaPlantillas()` (el
  selector de "Cargar montaje…") para no repetir el criterio dos veces.

**Fase 3 — "Cargar plantilla…" solo desde la corrección de material.**
- Texto del botón, `caso_cargar_plantilla`: **"Cargar plantilla…" → "Cargar
  montaje…"**.
- Se retira el botón de la propia ficha del caso (apartado 5,
  Montaje/Técnicas) -antes había dos entradas, una en la ficha
  (`iniciarCargaPlantilla(false)`) y otra en la barra fija de edición
  (`iniciarCargaPlantilla(true)`)-: ahora solo queda la de la barra fija.
  Motivo del usuario: desde la ficha no se sabe si lo que se va a
  sustituir se puede editar de verdad. `iniciarCargaPlantilla(modoEditando)`
  y el resto del flujo (`aplicarPlantillaSobreDestino()`,
  `confirmarCargaPlantilla()`) **no se tocaron** -siguen aceptando el
  parámetro, ahora siempre `true`-, para no arriesgar la lógica de copia ya
  verificada por un cambio que solo era de interfaz.

### Cambios de catálogo del mismo periodo (pedidos sobre la marcha)

- **Categoría "Sondas" nueva** (13 ítems, luego 12 tras mover uno a VEP):
  material que llevaba tiempo definido como *etiqueta* (tipo físico, para
  coste) pero sin ningún ítem de `catalogo_material` que lo colocara
  -sondas monopolares/bipolares, tripolar, aspiración, laparoscópica, pinza
  de estimulación, discos visuales, bipolar barra, más "Referencia de
  sonda" (etiqueta `aguja_subdermica`)-. Ocupan entrada numerada como
  cualquier otro material -no `sin_entrada`-.
- **Las 9 sondas monopolares/bipolares/tripolar/aspiración/laparoscópica
  comparten ahora una sola etiqueta** (`sonda_mono_esferica`, la que ya
  tenía "Sonda monopolar esférica") en vez de una etiqueta propia cada una
  -pedido del usuario, para que cuenten juntas en el resumen-. Pinza de
  estimulación y Bipolar barra/superficie ENG se quedaron con la suya.
  "Referencia de sonda" se queda con `aguja_subdermica` pero con
  `"color": "rojo"` de override -mismo mecanismo de "excepciones por ítem"
  que ya usaban otros materiales, ver README-. "Discos visuales" se movió a
  la categoría "Potenciales visuales (VEP)", donde encaja mejor.
- **"Registro cervical / plexo" → "Registro cervical / periférico"**: `Cv2`
  se mudó aquí desde "Electrodos corticales — registro" (mismo id, misma
  etiqueta, solo cambia la categoría), y se añadieron
  `l_cubital_periferico`/`r_cubital_periferico`/`l_hueco_popliteo`/`r_hueco_popliteo`
  (etiqueta `pegatinas`) — distintos de los `l_cubital`/`r_cubital` /
  `l_popliteo`/`r_popliteo` que ya existían en "Estimulación periférica":
  son ítems nuevos, no un renombrado.
- **"GRID / MANTA" → "GRID y D-Wave"**: se quitan `dcs_v2`/`hc` ("función
  sin confirmar" desde que se documentaron, sin caso/montaje real conocido
  que los usara) y se añade `epidural_dwave` ("Electrodo epidural
  (D-Wave)", nota "Kit 3 Platinum Contacts"), con etiqueta propia
  `electrodo_epidural_dwave` -mismo aspecto que `electrodo_epidural` pero
  distinta, porque es un producto/coste distinto-.
- **Categorías del catálogo reordenadas por frecuencia de uso**, con un
  campo nuevo `"plegada_por_defecto": true` por categoría (en el grupo, no
  en el ítem) — antes todas se plegaban igual. `reconstruirCatalogo()`
  propaga el flag a `CATALOGO` (antes se perdía, como ya pasaba con
  `categoria_en`); `categoriaAbierta(nombre, porDefecto)` gana un segundo
  parámetro con el valor por defecto de esa categoría, y
  `recordarCategoria()` pasa a guardar siempre `0`/`1` explícito en vez de
  borrar la clave al cerrar -si se borrara, una categoría que nace abierta
  volvería a abrirse sola en vez de quedarse cerrada como decidió el
  usuario-. Abiertas de fábrica: Electrodos corticales (estimulación y
  registro), Registro cervical/periférico, Músculos MMSS, Músculos MMII,
  Estimulación periférica, Tierras y referencias. Todo lo demás, plegado.
- **Cajas 3-6 dejaron de plegarse solas** al colocar material dentro de
  ellas: `renderCajaFisica()` reconstruía el `<details>` en cada
  `renderCajas()` sin fijar `.open`, así que perdía el estado cada vez que
  se colocaba algo en cualquier caja. Mismo patrón que las categorías del
  catálogo: nuevo `cajaAbierta()`/`recordarCaja()`
  (`localStorage["mio_ionm_cajas_abiertas_v1"]`), y un listener `toggle` en
  cada `<details>` plegable de `renderCajaFisica()`.
- **Visor de fotos de material**: campo nuevo opcional `"foto"` por ítem de
  `catalogo_material` (ruta relativa a la raíz, p. ej.
  `img/sondas/sonda_tripolar.png`). `crearChip()` añade un icono 📷 -en
  cualquier sitio donde salga el chip, no solo el catálogo: también ya
  colocado en una caja, que es cuando más falta hace identificar cuál es
  cuál-, que abre `<dialog id="dlg-foto-sonda">` con la imagen a tamaño
  grande (`abrirFotoSonda()`). De momento son fotos reales que pasó el
  usuario, guardadas en `img/sondas/`: 6 de las 9 sondas monopolares/
  bipolares tienen foto, quedan sin foto la de gancho, la tripolar y la
  laparoscópica.

README.md y data/guia.js revisados en el mismo turno (misma nota de
mantenimiento del 31-08-2026: si se toca el flujo, los dos a la vez).

### Retoques posteriores, 05-09-2026: umbrales por raíz, notas por técnica, plegables, quita el Perfil de Técnicas, e informe en PDF

**Dos campos nuevos que se quedaron sin documentar aquí ni en README al
añadirlos, corregido en esta misma pasada** -detectado al revisar todo el
trabajo del día para esta actualización de documentación, no porque
funcionaran mal-:

- **`tecnicas_parametros` (apartado 5, "Cómo se realizó cada técnica")**:
  un `<details class="caso-grupo tecpar-tecnica">` por cada técnica ya
  marcada en `tecnicas_realizadas`, con un grid de 8 campos (intensidad,
  frecuencia, num_pulsos, trenes, isi, filtros, promediacion, barrido) para
  anotar los parámetros reales usados en ese caso concreto -no los que trae
  el catálogo de fábrica, que no varían caso a caso-. Depende de la lista de
  técnicas realizadas vía `oyentesTecnicasRealizadas` (tiene que
  reconstruirse cada vez que cambia esa lista, por eso va *después* de
  `tecnicas_realizadas` en `CAMPOS_CASO`, no es orden arbitrario). Guarda un
  objeto por técnica en `c.tecnicas_parametros`; desmarcar la técnica oculta
  su bloque pero no borra lo escrito, mismo criterio que `tecnicas_alteradas`.
- **`imagenes_montaje` (apartado 5, "Imágenes del montaje")**: galería de
  fotos/capturas del montaje en el software del equipo (p. ej. pantalla del
  Inomed), pensada para consultar en un caso futuro parecido. Cada imagen se
  comprime en el navegador antes de guardarse (`comprimirImagen()`, redimensiona
  a 1100px de lado mayor y calidad 0.72) **porque el caso viaja entero en su
  propio JSON al repositorio de datos** (ver "Por qué los montajes están en
  archivos sueltos" más arriba) — sin comprimir, unas pocas fotos de móvil
  dispararían el tamaño de cada sincronización. Reutiliza el visor de fotos
  ya existente (`abrirFotoSonda()`/`dlg-foto-sonda`, pensado originalmente
  para las fotos de sondas del catálogo) en vez de crear un lightbox nuevo.
  Van dentro del propio caso, no en archivo aparte -a diferencia de los
  montajes compartidos, un caso lo edita una sola persona a la vez, no hay
  riesgo de choque entre dispositivos-.

- **6 electrodos nuevos en "Músculos de tronco y periné"**: L.Abd, R.Abd,
  L.Bulbocavernoso, R.Bulbocavernoso (los cuatro con `aguja_trenzada`, igual
  que el resto de músculos — no llevan etiqueta propia, se corrigió sobre la
  marcha tras un primer intento equivocado con una etiqueta dedicada) y
  L./R.Esfínter Anal Externo (`hook_wire`, agujas hook-wire de verdad, activo
  + referencia).
- **`hook_wire` gana `"doble": true`**: cada colocación hook-wire consume 2
  unidades de material (activo y referencia), no 1 — mismo mecanismo que
  `"manta"` en las etiquetas GRID, pero al revés (multiplica en vez de
  dividir). `calcularResumen()`: `var unidadesPorColocacion = item.media_unidad
  ? 0.5 : ((etDe && etDe.doble) ? 2 : 1)`. Cualquier etiqueta futura que
  necesite este patrón (dos piezas físicas por colocación) usa el mismo flag;
  el editor de etiquetas tiene su checkbox "Se cuenta doble" junto al de
  "Se cobra por manta".
- **Umbrales EMG por raíz (`umbral_raices_niveles`, apartado 6)**: campo
  nuevo, tipo `"umbral_raices"` en `campoCaso()`. Solo aparece si
  "Mapeo de raíces y tornillos" está en `tecnicas_realizadas`
  (`ocultarSegunTecnica()`, helper nuevo y genérico — cualquier campo futuro
  que deba depender de una técnica marcada lo reutiliza, en vez de repetir el
  patrón a mano). Chips C1–S2; marcar un nivel pinta una fila con dos cajas,
  "Izquierdo {nivel}" y "{nivel} derecho". Modelo: `{ niveles: [], valores:
  { <nivel>: { izq, der } } }` — deliberadamente un campo nuevo y no una
  mutación de `umbral_tornillos_pediculares` (que sigue existiendo, ahora
  relabeled "Notas de umbral EMG de tornillos pediculares", también gated a
  la misma técnica), para no migrar el dato real ya guardado en el
  repositorio privado.
- **Nota libre al final de cada técnica**, dentro de `tecnicas_parametros`
  (apartado 5, "Cómo se realizó cada técnica"): noveno campo del bloque de 8
  parámetros, `datos.notas`, `<textarea>` de 2 filas. Mismo criterio de
  preservación que el resto de `tecnicas_parametros`/`umbral_raices_niveles`:
  desmarcar la técnica oculta el bloque entero (`ocultarSegunTecnica`), nunca
  borra lo ya escrito.
- **"Técnicas realizadas", "Material (montaje base)" y "Material realmente
  usado" (apartado 5) pasan a `<details class="caso-grupo">` plegados por
  defecto** — mismo patrón visual que ya usaban `tecnicas_parametros` y
  `umbral_raices_niveles`. `campoCaso()` salta el `<label>` plano para estos
  tres tipos (`t === "tecnicas" || "material_ro" || "material"`) porque el
  título ya lo pone el propio `<summary>`.
- **Cajas más grandes**: "Resumen de la monitorización" 8→12 filas,
  "Aprendizaje clave" 5→8.
- **Se quita el desplegable "Perfil" de la tarjeta Técnicas** (el que
  resaltaba técnicas habituales por tipo de procedimiento): `renderPerfilSelect()`
  y sus tres llamadas, el `<select id="perfil-select">` del HTML, y el
  resaltado `.chip-extra.recomendada` en `renderTecnicas()`, todo retirado.
  **El catálogo `Perfiles` de Catálogos se queda intacto y editable** (regla
  de "desactivar no borra" aplicada a media función: se retiró el único
  consumidor de la interfaz, no el dato) — pero ahora mismo **no lo lee
  ningún sitio de la app**, es un catálogo huérfano. `nota_perfil_id` en
  montajes antiguos tampoco se toca ni se migra, queda inerte. **Pendiente de
  revisar en README.md** si se llega a retirar el catálogo entero algún día
  (de momento README ya se corrigió para no describir un desplegable que ya
  no existe, ver más abajo).
- **"Exportar casos" pasa a generar un PDF** en vez de CSV, vía
  `window.print()` sobre una ventana nueva construida a mano
  (`abrirInformeCasos()` → `construirInformeCaso()`), sin librerías —regla de
  siempre, sin dependencias—. Recorre `GRUPOS_CASO`/`CAMPOS_CASO`
  genéricamente, así que un campo nuevo de la ficha aparece solo en el
  informe sin tocar esta parte. **El CSV no desaparece**: se mueve a un botón
  nuevo, "Exportar CSV" (`btn-exportar-casos-csv`), con `casosACsv()` sin
  tocar. El botón **"Crear informe"** de la ficha de un caso (antes un aviso
  de "próximamente") se conecta al mismo generador, para un único caso.
  `window.open()` puede devolver `null` si el navegador bloquea la ventana —
  hay aviso (`caso_pdf_popup_bloqueado`) en vez de romper. **Primera versión,
  pendiente de que el usuario la pruebe en real y pida ajustes** de
  contenido/formato — avisado explícitamente por el propio usuario al
  pedirlo ("hay que depurarla para que sea útil"), no dar por cerrada esta
  función sin volver a preguntar.

README.md revisado en el mismo turno: se corrigió la descripción del
desplegable Perfil de Técnicas (retirado) y la de "Exportar casos"
(CSV → PDF, con el nuevo botón CSV aparte). `data/guia.js` no mencionaba el
desplegable de Perfil de Técnicas ni describía `tecnicas_parametros`/
`umbral_raices_niveles` todavía — se actualizó su entrada de exportación de
casos; añadir contenido de guía para los campos nuevos de la ficha queda
pendiente si el usuario lo pide (la guía es intencionadamente breve, no
enumera cada campo de la ficha uno por uno).

### Retoques posteriores, 05-09-2026 (tarde): probado el PDF en real, dos correcciones y un bug real en Montajes

El usuario pidió probar el informe en PDF en un navegador de verdad. Como el
entorno de pruebas de este proyecto bloquea `window.open()` (política de
popups del sandbox, no del código), se sirvió la app con un servidor
estático local (`.claude/launch.json`, configuración `checklist`) en vez del
`file://` de siempre -abrir por `file://` en el entorno de pruebas la
carga como una foto estática sin ejecutar el JS, no sirve para probar nada
interactivo- y se interceptó `window.open()` con un iframe oculto para leer
el HTML del informe sin necesitar la ventana emergente real. Se crearon
casos de prueba con datos ficticios (nunca reales) para forzar los casos
límite: umbrales por raíz, alerta con sus tres campos dependientes, un caso
vacío, y varios casos a la vez.

Del PDF salieron dos correcciones:

- **Orden de "Umbrales EMG por raíz"**: en la ficha, `umbral_raices_niveles`
  va *antes* que `umbral_tornillos_pediculares` (las notas libres) dentro de
  "Desarrollo intraoperatorio" -así lo pidió el usuario al definir el
  campo-. En el PDF salía al revés, porque `construirInformeCaso()` siempre
  añadía primero el bloque genérico del grupo (que incluye las notas) y
  la sección hecha a mano de umbrales-por-raíz *después*, sin mirar el orden
  real de `CAMPOS_CASO`. Se corrigió invirtiendo el orden de esos dos
  `appendChild()` solo para el grupo `"desarrollo"` -mismo patrón que ya
  usaba el grupo `"montaje"` con técnicas/parámetros/material/imágenes,
  solo que ahí el orden relativo ya coincidía con la ficha por casualidad.
  **Nota para la próxima vez que se toque esto**: el grupo "montaje" tiene
  el mismo problema en potencia -su bloque genérico (`notas_montaje_tecnicas`)
  se sigue insertando *antes* que técnicas/parámetros/material/imágenes,
  cuando en `CAMPOS_CASO` va justo en medio de esos campos-, pero no se ha
  tocado porque el usuario no lo ha pedido todavía.
- **Título del informe con varios casos**: reutilizaba `T("btn_casos")`
  ("Gestión de casos", el texto del botón) como título del documento/pestaña
  cuando se exportan varios casos a la vez. Nueva clave `caso_pdf_titulo_varios`
  ("Informe de casos"), pedida explícitamente por el usuario tras verlo.

Aparte del PDF, el usuario reportó dos síntomas en la tarjeta **Montajes**
(la pantalla principal desde la Fase 6 del 04-09-2026): que debería empezar
desplegada por ser la pantalla principal, y que **la lista de plantillas no
aparecía** -solo el buscador y los botones de acción-, aunque el rótulo de
arriba mostraba "Plantilla: Test" (un montaje real y antiguo del propio
navegador de la usuaria, nada que ver con este arreglo).

- **Montajes ahora empieza desplegada** (`<details id="montajes" open>` en
  `index.html`), la única de las cinco tarjetas del banco de trabajo que lo
  hace -pedido explícito, por ser la pantalla principal-. El resto sigue
  plegado, como se decidió el 04-09-2026.
- **Bug real, mismo patrón que ya documentaba este archivo dos veces (ver
  `.campo[hidden]` del 26-08-2026 y `.barra-caso-acciones[hidden]` del
  31-08-2026), pero esta vez de *render*, no de CSS**:
  `sincronizarDlgMontajesSiAbierto()` (línea ~6471) solo repinta la lista
  si la tarjeta **ya estaba abierta** cuando algo más llama a `renderTodo()`
  -mismo mecanismo que usa `dlgCasos`-. El problema es que **nada** llamaba
  a esa función (ni a `renderListaMontajesDialog()`) cuando el usuario abría
  la tarjeta a mano pulsando su `<summary>`: el `<details>` nativo se abre
  solo, sin pasar por ningún JS, así que la primera vez que se despliega
  desde cerrada la lista se queda vacía hasta que **otra** acción cualquiera
  (colocar material, marcar una técnica...) dispare un `renderTodo()` de
  refilón. Con Montajes ahora abierta de fábrica el síntoma quedaba oculto
  al arrancar -el primer render sí la ve abierta-, pero volvía en cuanto se
  plegaba y se volvía a desplegar a mano, que es justo lo que reportó el
  usuario. Arreglado con un listener del evento nativo `toggle` sobre
  `dlgMontajes` que llama a `renderListaMontajesDialog()` al abrirse -antes
  no existía ninguno-. **Se comprobó que "Cajas" no tiene este mismo bug**:
  `renderCajas()` no está condicionada a `.open`, reconstruye
  `#cajas-contenido` en cada `renderTodo()` sin mirar si la tarjeta está
  visible (lo que parecía vacío en las pruebas de la tarde anterior era
  `escenarioActual() === null` -sin montaje activo-, no este bug).
- El "Plantilla: Test" que veía el usuario no es un bug: es un montaje real
  llamado "Test" que ya existía en su navegador de antes, marcado como
  `activo`. Con la lista rota no podía verlo en la biblioteca, así que no
  sabía de dónde salía el rótulo; con el arreglo de arriba debería aparecer
  ya en la lista de Montajes.

**Umbrales por raíz, layout pedido tras verlo en real**: cada fila pasa de
"nivel arriba, Izquierdo/derecho apilados debajo" a una sola línea
"I [caja] — nivel — D [caja]", con la caja izquierda pegada al borde
izquierdo, la raíz centrada y la caja derecha pegada al borde derecho.
`.umbral-raices-fila` pasa de `flex` a `grid-template-columns: 1fr auto 1fr`
con `justify-self: start/end` en cada caja -así el nivel queda centrado de
verdad sin importar si las dos cajas miden lo mismo, cosa que un simple
`justify-content: space-between` no habría garantizado-. Los textos largos
`T("umbral_raices_izq"/"_der")` ("Izquierdo {nivel}"/"{nivel} derecho") se
conservan tal cual -son los que salen en el informe en PDF, sin tocar- pero
ya no se pintan en pantalla: ahí se ven solo las claves nuevas
`umbral_raices_izq_corto`/`_der_corto` ("I"/"D"), con el texto largo movido
a `title` (tooltip) y `aria-label` del campo, para no perder contexto de
accesibilidad al acortar la etiqueta visible.

## Fase 7 (06-09-2026): pantalla de inicio con 6 pestañas

Cambio grande de navegación, planificado con el usuario (boceto a mano) antes
de tocar código: de una sola página con scroll más varios `<dialog>`
colgando de un menú "⋮", a una **pantalla de inicio con 6 tarjetas grandes**
-Organizador de Montajes, Gestión de Casos, Técnicas IONM, Docencia,
Simulador, Bibliografía-, cada una llevando a una pantalla dedicada donde se
trabaja "de manera pura". El logo es el único camino de vuelta al inicio; no
hay navegación cruzada entre pantallas ni URL/historial -decisión explícita
del usuario, no una limitación técnica-.

**Alcance de esta pasada** (también acordado antes de implementar): las tres
funciones que ya existían -Organizador de Montajes (el banco de trabajo de
siempre), Gestión de Casos (`dlg-casos`) y Técnicas IONM (`dlg-tecnicas-mio`)-
se migraron enteras y funcionan igual que antes. Docencia se movió también de
verdad (Miotomas y Cama de quirófano, sin cambios), pero ganó dos pestañas
nuevas -Material y Teoría básica de IONM- que de momento son solo "en
construcción": cuando se construya Material de verdad, tiene que reutilizar
las fotos que ya existen en `catalogo_material` (campo `foto`, ver
`abrirFotoSonda()`) en vez de crear un set de contenido aparte -decisión ya
tomada con el usuario, dejada anotada en el propio `index.html`-. Simulador y
Bibliografía son pantallas reales pero vacías, ninguna de las dos con
contenido ni lógica todavía.

### Mecanismo de pantallas

Cada una de las 7 pantallas es un elemento de nivel superior con
`class="pantalla"` e `id="pantalla-<nombre>"`. Visibilidad por **dos clases,
nunca por `[hidden]`**:

```css
.pantalla { display: none; }
.pantalla.activa { display: block; }
```

Se eligió esto a propósito y no `[hidden]`: este archivo ya documentaba tres
veces el mismo fallo de especificidad (`.campo[hidden]` el 26-08-2026,
`.barra-caso-acciones[hidden]` el 31-08-2026, `.menu-lista[hidden]` el
03/04-09-2026) -una clase con su propio `display` gana a un atributo
`[hidden]` de igual especificidad si va después en la hoja-. Dos clases
(`.pantalla.activa`) le ganan siempre a una (`.pantalla`), sin depender del
orden del CSS, así que este patrón evita el bug entero en vez de tener que
acotarlo cada vez que se añada una pantalla. Si una pantalla necesita un
layout distinto a bloque simple (la de inicio, en grid, para las 6
tarjetas), ese `display` va en un `div` de dentro, nunca en `.pantalla`
misma -así el par se queda genérico.

Router único en `app.js`, junto a `aplicarTextos()`:

```js
var PANTALLAS = ["inicio", "organizador", "casos", "tecnicas-mio", "docente", "simulador", "bibliografia"];
function irAPantalla(nombre) { /* toggle .activa por id, scrollTo(0,0) */ }
function pantallaActiva(nombre) { /* .classList.contains("activa") */ }
```

Las funciones que ya abrían cada ventana se reutilizaron tal cual -mismo
nombre, misma lógica de render-, solo cambió su última línea: donde antes
había `dlgX.showModal()` ahora hay `irAPantalla("x")`. `abrirListaCasos()`,
`abrirTecnicasMio()` y `abrirDocente()` siguen siendo los puntos de entrada
de siempre, ahora llamados desde las tarjetas de inicio en vez de desde un
botón de la barra superior.

### `<dialog>` → `<div class="pantalla">`: la diferencia importante con `.open`

El precedente de convertir un `<dialog>` en algo permanente ya existía
-Fase 6, `dlg-montajes` → `<details id="montajes">`-, pero ahí `.open` seguía
siendo válido porque `<details>` también lo tiene de forma nativa. Al
convertir `dlg-casos`/`dlg-tecnicas-mio`/`dlg-docente` en `<div>` sueltos,
**`.open` deja de existir**: cualquier sitio que preguntaba
`dlgCasos.open` para decidir "¿está esto visible ahora?" (el patrón de
refresco de `sincronizarDlgMontajesSiAbierto()`, aplicado también a casos en
`bajarCasos()`) tuvo que pasar a `pantallaActiva("casos")`. Se hizo un grep
exhaustivo de las tres variables (`dlgCasos`, `dlgTecnicasMio`, `dlgDocente`)
antes de tocar nada -13 sitios en total, ninguno se quedó a medias-. Los
tres botones "Cerrar" (`casos-cerrar`, `tecmio-cerrar`, `docente-cerrar`) se
retiraron enteros: con el logo como único camino de vuelta, un "Cerrar"
suelto dentro de una pantalla sería una segunda salida que no llevaría a
ningún sitio coherente.

`dlg-caso` (la ficha de un caso, singular -distinta de `dlg-casos`, el
listado-) **no se tocó**: sigue siendo un `<dialog>` real, abierto con
`showModal()` desde dentro de Gestión de Casos, y sigue flotando bien encima
de cualquier pantalla activa sin cambio ninguno.

### Bug real evitado: `abrirMontajeDeCaso()` necesitaba navegar primero

Antes de este cambio, `<main>` estaba siempre a la vista, así que "Corregir
el material y el montaje" (desde la ficha de un caso) no necesitaba mostrar
nada: solo activaba `body.editando-caso` y repintaba. Con `<main>` ahora
convertido en `#pantalla-organizador` -oculta salvo que sea la pantalla
activa-, sin una llamada a `irAPantalla("organizador")` al principio de
`abrirMontajeDeCaso()` el usuario se habría quedado mirando la pantalla de
Gestión de Casos mientras todo se repintaba invisible detrás, con el
`scrollIntoView` de las cajas sin ningún efecto útil. Se detectó al planificar
el cambio, no al probarlo -por eso no hizo falta corregirlo dos veces-, y se
verificó explícitamente en el navegador: el flujo completo (ficha → Corregir
montaje → Organizador visible con las cajas a la vista → Volver al caso →
ficha reabierta → Volver a la lista → Gestión de Casos) se probó paso a paso
con `document.getElementById(...).click()` y comprobando `.classList` en
cada salto, no solo mirando capturas de pantalla.

### Otros ajustes de la misma pasada

- **Barra superior, de dos filas a una**: al salir `Gestión de casos`,
  `Técnicas MIO` y `Docente` de ahí (pasan a ser tarjetas de inicio), ya no
  hacía falta la segunda fila (`.barra-fila-casos`, retirada del CSS y del
  HTML). Sincronizar y el aviso de "Guardado a las…" se quedan en la única
  fila que queda -pedido explícito: son estado global, deben verse siempre-.
  El menú "⋮" se queda solo con Idioma y Guía de uso.
- **`--header-h` remedido a mano**: pasó de `82px` (dos filas) a `44px` (una
  fila), medido con `getBoundingClientRect()` en el navegador tras el
  cambio, no a ojo -mismo patrón de siempre para esta variable, no hay
  cálculo automático-.
- **El logo pasa a ser un `<button id="btn-inicio">`** envolviendo la
  `<img class="marca">`, no la imagen misma con un listener pegado encima:
  al ser el único camino de vuelta al inicio necesitaba foco de teclado real.
- **`@media print` corregido**: si se imprime (botón "Imprimir" de
  Catálogos, o Ctrl/Cmd+P nativo) estando en cualquier pantalla que no sea
  Organizador, sin este arreglo saldría una página en blanco -el resumen y
  las cajas, lo único que tiene sentido imprimir, estarían en
  `display: none`-. Se fuerza `#pantalla-organizador` visible y el resto de
  `.pantalla` ocultas solo dentro de `@media print`, sin tocar el
  comportamiento en pantalla.
- **`#dlg-casos { max-width: 560px; }` retirado**: una pantalla completa no
  debe llevar el ancho de un modal. Las cinco pantallas que no son
  Organizador comparten ahora una regla de ancho máximo a juego con
  `<main>` (1500px).

README.md y `data/guia.js` revisados en el mismo turno -misma nota de
mantenimiento de siempre: si se toca el flujo, los dos a la vez, o se quedan
obsoletos en silencio sin que nada avise-.

### Retoques posteriores, 06-09-2026: título+Inicio en cada pantalla, "Crear caso" pasa a abrir el Organizador, se suspende "Material realmente usado"

Cuatro pedidos, tras usar la Fase 7 en real. De paso, el botón que llevaba
toda su vida llamándose *"Corregir el material y el montaje"* pasa a
llamarse **"Editar material y montaje"** (clave `caso_editar_montaje`) —
mismo botón, misma función, solo el texto cambia.

**Cada pantalla lleva ahora un `<div class="pantalla-cab">` con su título y
un botón "Inicio"** a la derecha (mismo destino que el logo,
`irAPantalla("inicio")`, un solo listener delegado sobre
`.btn-pantalla-inicio` para las 6 pantallas). Organizador de Montajes no
tenía título propio -era el único de los 6 sin uno-, así que ganó el suyo
(`<h2 data-i18n="tile_organizador">`) igual que el resto. Mismo look de
píldora que `.card h2`, para que las 6 pantallas se sientan consistentes.

**Cambio de modelo importante: "Crear caso" ahora crea y guarda el caso al
instante, vacío, y entra directo en el Organizador de Montajes editando su
montaje.** Antes había dos botones en Gestión de Casos:

- **"Guardar este montaje como caso"** -tomaba lo que hubiera en el banco
  de trabajo (`escenarioActual()`, sin relación necesaria con el caso nuevo)
  y montaba un caso a partir de su resumen ya calculado.
- **"Caso nuevo desde cero"** -abría la ficha vacía directamente
  (`abrirCasoNuevo()`), pensada para cirugías retrospectivas: nacía ya
  `cerrado` y sin montaje.

El usuario pidió unificarlos: **"Guardar este montaje como caso" pierde su
sentido** (un caso nuevo debe construir SU PROPIO montaje, no heredar lo que
hubiera suelto en el banco de trabajo) y **"Caso nuevo desde cero" pasa a
llamarse simplemente "Crear caso"**, con un comportamiento nuevo. El
problema real que esto resuelve: `abrirMontajeDeCaso(uid)` -la función que
lleva a "Editar material y montaje"- necesita `casos[uid]` ya
existente (`if (!caso) return;`), así que para un caso recién creado y sin
guardar **ese botón ni siquiera se pintaba** en la ficha
(`if (!casoEsNuevo) { ... }` en `renderFichaCaso()`, ~línea 5046). Un caso
nuevo solo tenía a mano "Guardar este montaje como plantilla…" -que tampoco
tiene nada que ver con el caso que se está creando-. Era, literalmente, el
flujo sin sentido que describió el usuario.

**Solución**: el nuevo listener de `casos-nuevo-cero` hace
`guardarCaso(casoVacio(), true)` **antes** de `abrirMontajeDeCaso(uid)` -el
caso existe en `casos{}` desde el primer instante, no solo tras el primer
"Guardar" de la ficha-. A partir de ahí el usuario construye el montaje a
mano o carga una plantilla encima (mismo `barra-caso-cargar-plantilla` de
siempre, copia, nunca enlace vivo) directamente en el Organizador, y rellena
el resto de la ficha cuando quiera con "Volver al caso". Se retiraron por
completo `abrirCasoNuevo()` y `casoDesdeEscenario()` -sin más llamadas tras
este cambio, verificado por grep antes de borrarlas- y el botón/HTML de
"Guardar este montaje como caso" (`casos-guardar-montaje`,
`casos_guardar_montaje`/`casos_guardar_ay` en `TEXTOS`).

**Efecto colateral, consciente y no pedido explícitamente pero implícito en
la unificación**: `casoEsNuevo` ya no se pone nunca a `true` -su único punto
de asignación era `abrirCasoNuevo()`, ahora borrado-, así que
`if (!casoEsNuevo)` en `renderFichaCaso()` pasa a cumplirse siempre y
"Editar material y montaje" **se pinta siempre** que se abre un
caso, y `caso-borrar.hidden = casoEsNuevo` deja "Borrar caso" **siempre
visible** -correcto, porque con el flujo nuevo cualquier caso que llegue a
la ficha ya existe de verdad en `casos{}`-. No hizo falta tocar ninguno de
los dos condicionales para conseguir esto, solo dejó de haber ninguna
llamada que pusiera `casoEsNuevo` a `true`.

**Se perdió, sin que se pidiera conservarlo, el matiz retrospectivo** de
"Caso nuevo desde cero" (nacía `cerrado` y sin montaje, para cirugías que
nunca pasaron por el checklist). Con el flujo unificado sigue siendo
perfectamente posible -"Crear caso", no colocar nada en el Organizador,
"Volver al caso", rellenar y poner **Estado → Cerrado** a mano-, pero ya no
hay un atajo que lo haga por defecto. Coherente con la norma ya existente
desde el 03-09-2026 de que cerrar un caso es cambiar el campo Estado, sin
botón aparte.

**"Material realmente usado" (`material_real`), suspendido en la ficha**:
razón dada por el usuario, "no es viable" -en la práctica, con el montaje
del caso editándose siempre en el Organizador, lo que de verdad se usó ya
ES el montaje real; una copia editable aparte para anotar desviaciones
quedaba redundante y confusa-. Se comentó la línea de `CAMPOS_CASO`
(`{ g: "montaje", c: "material_real", ... }`, dejada in situ pero comentada,
con la razón por escrito) en vez de borrar el campo del modelo: `casoVacio()`
sigue inicializándolo, `volcarMontajeEnCaso()` lo sigue sincronizando con
`material_previsto` en segundo plano, y `seccionMaterialInforme()` del
informe en PDF lo sigue leyendo -por los casos reales antiguos que ya
tenían una divergencia real anotada ahí antes de este cambio, que no debe
perderse-. Para cualquier caso nuevo a partir de ahora, `material_real`
quedará simplemente idéntico a `material_previsto` para siempre -inofensivo,
solo redundante en el informe si algún día alguien vuelve a mirarlo-. Si se
quiere quitar también de ahí, o volver a activar el campo en la ficha, es
un cambio de una línea (descomentar/comentar esa entrada de `CAMPOS_CASO`),
no hace falta migrar nada.

README.md y `data/guia.js` revisados en el mismo turno -misma nota de
mantenimiento de siempre-.

### Retoques posteriores, 06-09-2026 (tarde): el rótulo permanente se muda dentro del Organizador, "Montajes" pasa a llamarse "Plantillas de montajes", título de pantalla sin píldora

Tres pedidos más, tras ver la Fase 7 y sus retoques del mismo día en real.

**`#barra-caso` (el rótulo "Plantilla: X" / "CASO Y") sobraba en las otras 5
pantallas** -Gestión de Casos, Técnicas IONM, Docencia, Simulador,
Bibliografía no tienen ningún montaje que editar, así que verlo ahí no
aportaba nada, solo ruido-. Se movió de ser un hermano de nivel superior de
`<main>` (visible siempre, en las 6 pantallas) a vivir **dentro** de
`#pantalla-organizador`, como hijo directo de `.columna-principal` justo
después de `</details>` de "Plantillas de montajes" y antes de la tarjeta
Técnicas. Al ser ahora descendiente de `#pantalla-organizador`
(`display:none` cuando no es la pantalla activa), queda oculto en las otras
5 sin tocar nada más -la misma `.pantalla`/`.pantalla.activa` de la Fase 7
ya resuelve esto gratis-.

**Además, deja de mostrarse "— sin plantilla activa —" todo el rato**:
`renderBarraCaso()` ahora oculta `#barra-caso` por completo
(`barra.hidden = !esc`) cuando no hay ni plantilla cargada ni caso en
corrección, y solo aparece -pedido explícito- una vez que sí hay algo que
mostrar. La clave `barra_plantilla_ninguna` queda huérfana en `TEXTOS`, sin
usar -se deja así, mismo criterio de siempre con las claves que dejan de
hacer falta-.

**Trampa de especificidad, la de siempre**: `.barra-caso` ya traía su propio
`display: flex`, así que ocultarla con el atributo `hidden` necesitó la
misma acotación explícita que ya lleva `.campo[hidden]`/
`.barra-caso-acciones[hidden]`/`.menu-lista[hidden]` -van ya cuatro veces
con este mismo fallo en el proyecto-: `.barra-caso[hidden] { display: none; }`.

**El offset sticky de `.panel-catalogo` seguía dependiendo de
`--barra-caso-h`** (`header-h + barra-caso-h + 0.5rem`, ver el comentario
junto a `.panel-catalogo` en `style.css`), que hasta ahora solo tenía dos
valores posibles -32px por defecto, 48px en `body.editando-caso`-, asumiendo
que el rótulo *siempre* ocupaba sitio. Con el rótulo pudiendo estar
completamente oculto ahora, hacía falta un tercer valor: nueva
`body.barra-caso-oculta { --barra-caso-h: 0px; }`, con la clase puesta por
el propio `renderBarraCaso()` en el mismo momento que oculta la barra. Se
comprobó en el navegador -ancho de escritorio, con `getBoundingClientRect()`,
no solo mirando la pantalla- que `panel-catalogo` sigue calculando bien su
`top` en los tres estados (oculto, plantilla suelta, editando caso).

**"Montajes" pasa a llamarse "Plantillas de montajes"** (`dlg_montajes_titulo`)
-para distinguirlo mejor de "Organizador de Montajes", el título de la
pantalla entera, que se prestaba a confusión-. Es solo el texto visible: el
id `montajes`, la variable `dlgMontajes` y el resto del código no cambian.

**Título de cada pantalla, sin la píldora de color**: `.pantalla-cab h2`
pasó de imitar `.card h2` (mismo fondo `--accent-soft`, mismo texto en
mayúsculas) a una negrita simple sin fondo -pedido explícito: se confundía
visualmente con los submenús de dentro (Plantillas de montajes, Técnicas,
Cajas...), que sí llevan esa píldora, y tienen que distinguirse de un
vistazo del título de la pantalla que los contiene-.

README.md y `data/guia.js` revisados en el mismo turno -misma nota de
mantenimiento de siempre-. Pendiente, sin resolver todavía: la usuaria pidió
además que "Cajas" ocupe toda la pantalla al desplegarse en móvil igual que
ya hace, y algo relacionado con que "Catálogo" no se comporta igual -no
quedó claro el cambio concreto que pide ahí, había que preguntarle antes de
tocar el CSS del catálogo.

### Retoques posteriores, 06-09-2026 (noche): Catálogo pasa a `<details>`, primero en móvil

Resuelto lo que quedó pendiente en el retoque anterior, tras preguntar y
confirmar el enfoque con la usuaria antes de tocar nada (dos preguntas:
"¿cómo de exactamente igual que Cajas?" y "¿el orden es solo visual en
móvil, o reordeno el HTML?" — las dos respondidas con la opción
recomendada).

**`#panel-catalogo` deja de ser un `<div>` con una clase `plegado` a mano y
pasa a ser un `<details>` real**, exactamente como Plantillas de
montajes/Técnicas/Cajas/Resumen. Motivo: en móvil, un `<div>` con su propio
mecanismo de plegado no se comporta igual que un `<details>` nativo al
desplegarse -aunque visualmente pareciera similar, no ocupaba la pantalla
entera de la misma manera que el resto de tarjetas, que es justo lo que
pidió la usuaria-.

- `<div class="panel-cab">` pasa a `<summary class="panel-cab card-cab">`
  -la clase `card-cab` engancha gratis con la regla ya existente
  `.card > summary.card-cab::after` (la flecha ▾/▸ compartida por el resto
  de tarjetas), así que se retira el botón `#btn-plegar` a mano y toda su
  regla CSS: ya no hace falta, el propio `<summary>` lo resuelve.
- Los botones **Etiquetas** y **+** siguen dentro de esa cabecera y
  necesitan seguir teniendo su propia acción sin desplegar/plegar el panel
  de golpe. Con un `<div>` a mano bastaba un `if (e.target.closest("button"))
  return;` antes de alternar la clase; con un `<summary>` nativo el
  mecanismo es distinto -el toggle es la acción por defecto del propio
  evento "click", así que hay que interceptarlo con `e.preventDefault()`
  cuando el clic viene de un botón, en vez de simplemente no llamar a la
  función que pliega-.
- `plegarCatalogo(plegar)` pasa de `panel.classList.toggle("plegado", plegar)`
  a `panel.open = !plegar` -mismo nombre, misma firma, los tres sitios que
  ya la llamaban (`seleccionar()` al elegir un ítem en móvil, `colocar()` al
  terminar, y el arranque en móvil) seguían funcionando sin tocarlos, se
  verificó cada uno por separado en el navegador tras el cambio-.
- `.panel-catalogo.plegado #catalogo-buscar/...{ display: none }` se retira
  entera: un `<details>` nativo ya oculta solo todo lo que no sea el
  `<summary>` cuando no está `[open]`, no hace falta imitarlo a mano.

**Catálogo se ve primero en móvil, antes que Plantillas de montajes**
-razón de la usuaria: el catálogo no es parte de una plantilla de montaje
en sí, es lo que nutre a las cajas, así que no tiene que vivir agrupado
visualmente con las tarjetas de montaje-. Implementado con
`#panel-catalogo { order: -1; }` dentro de `@media (max-width: 900px)`
-mismo mecanismo de `order` que ya usaba este proyecto para el extinto
"Modo quirófano" (retirado el 21-08-2026), reutilizado aquí porque es
exactamente la herramienta hecha para esto: reordenar visualmente sin
tocar el HTML. **El HTML no cambia de sitio**: sigue siendo la cuarta
tarjeta del documento; en escritorio (`grid-column: 2`) el `order` no
afecta a nada, la tarjeta sigue siendo su propia columna lateral, sticky,
tal cual siempre.

Verificado en el navegador, viewport estrecho y ancho por separado: arranca
plegada en móvil (igual que antes), se ve primero en el orden visual, se
pliega/despliega igual que Cajas al tocar el título entero, Etiquetas/+
siguen funcionando sin plegar el panel, seleccionar un ítem sigue plegando
el catálogo y colocarlo lo vuelve a desplegar, y en escritorio (1280px)
sigue siendo la columna lateral fija de siempre, abierta, sin relación con
el `order` de móvil.

README.md revisado en el mismo turno -misma nota de mantenimiento de
siempre-.

### Retoques posteriores, 06-09-2026 (noche): "Músculos de tronco y periné" pasa a "Electrodos de tronco y periné", dos estimuladores nuevos

**Categoría renombrada** -de "Músculos de tronco y periné" a "Electrodos de
tronco y periné"-: los dos ítems nuevos de este mismo cambio son electrodos
de estimulación de superficie, no agujas de registro muscular, así que
"Músculos" ya no describía a toda la categoría. Solo cambia el texto
`categoria` en `data/surgeries.js`; el resto de ítems y sus ids no se
tocan. **Efecto secundario menor y sin importancia**: el plegado/desplegado
de esta categoría se recuerda en `localStorage` por el propio texto de
`categoria` (`categoriaAbierta()`/`recordarCategoria()`, `app.js`); al
cambiar el nombre, la preferencia guardada bajo el nombre viejo queda
huérfana y la categoría vuelve a su `plegada_por_defecto: true` -mismo
comportamiento que ya tenía por defecto, no hay nada que migrar-.

**Dos electrodos nuevos, ambos `"etiqueta": "pegatinas"`** -mismo tipo
físico que Mediano/Tibial post./Poplíteo en "Estimulación periférica": son
estimuladores de superficie, no agujas-: `n_dorsal_pene` ("Nervio Dorsal
del Pene") y `clitoris` ("Clítoris"). Van sin pareja L./R. -son estructuras
de la línea media, como ya pasa con "Tierra" en "Tierras y referencias"-, y
sin `nota` clínica -mismo criterio de siempre: mejor en blanco que una
descripción sin confirmar por el usuario-.

### Retoques posteriores, 06-09-2026 (noche): auditoría hook wire, identificar el conmutador, primera versión del Simulador

Tres cosas en el mismo turno; una cuarta (bloque "Cirugías con IONM") queda
pendiente a propósito, ver el final.

**1 — Conteo de hook wire en casos cerrados, corregido en el repo de datos.**
Regla del usuario: cada músculo con hook wire gasta **2 agujas** (activo +
referencia), que es justo lo que hace el flag `doble: true` de la etiqueta
`hook_wire` desde el 05-09-2026. Los casos cerrados **antes** de ese flag
guardaron su `material_previsto`/`material_real` contando 1 por colocación.
Auditoría (script de Node que cuenta las entradas `tipo: "Electrodo Hook
Wire"` del snapshot `montaje` de cada caso y compara con `2 × colocaciones`):
- **2026-002**: 10→**20**, **2026-005**: 8→**16**, **2026-012**: 11→**22**
  (todos cerrados antes del 05-09, desajustados).
- **2026-014** (4=2×2) y **2026-015** (22=2×11) ya estaban bien.

Se migraron los 3 casos a `2 × colocaciones` -exactamente lo que produce
reabrir y volver a guardar el caso en la app hoy-, con un `editado_en` nuevo
dejando constancia (mismo patrón que la migración del sacacorchos del
23-08-2026). La etiqueta `hook_wire` **no tiene precio**, así que
`coste_material`/`coste_completo` no cambian. Detalle importante que
despistó al principio: los hook wire de estos casos no son el esfínter anal,
son **músculos craneales** (L.Mass, L.OOc, L.Crico, L.STCM, L.LEN…) —todos
con etiqueta `hook_wire` en el catálogo actual, con `etiquetas_colocadas: {}`
en el caso (sin override), así que recalcular hoy los vuelve a etiquetar
"Electrodo Hook Wire" y a contar 2×: la migración es correcta, no un
artefacto de etiquetado viejo. El clon local de `checklist-mio-datos` estaba
13 commits por detrás: se hizo `git fetch` + `pull --ff-only` **antes** de
tocar nada (lección del 26-08-2026), y round-trip `json.loads`→`json.dumps
(ensure_ascii=False, indent=2)` byte-idéntico comprobado antes de editar,
para que el diff fuera solo las líneas cambiadas.

**2 — El conmutador identifica sus 6 sacacorchos en el resumen.** Pedido:
ver de un vistazo en qué reparte el conmutador sus 6 electrodos. Se añade
`res.conmutadorTipo` en `calcularResumen()` (se fija al `tipo` de la fila del
conmutador cuando `item.id === "conmutador"`), y `renderResumen()` cuelga un
`<small class="resumen-nota-conmutador">` con la nota junto a la fila
"Conmutador" de "Material a preparar": **"(reparte en C1, C2, C3, C4, Cz-1,
Cz+6)"** (clave `resumen_conmutador_nota`). Las 6 posiciones son las de la
**descripción de fábrica de la caja TES MEP** (`data/surgeries.js`, "el canal
6 se subdivide en C1/C2/C3/C4/Cz-1/Cz+6"), elegidas por el usuario frente al
comentario más impreciso de `calcularResumen()` ("C3/C4, a veces C5/C6"). Va
en la fila del **conmutador**, no en la de sacacorchos, porque esa cuenta
mezcla los 6 del conmutador con cualquier sacacorchos suelto (Cz-1, Cz+6cm…).

**3 — Simulador, primera versión** (pantalla que estaba vacía desde la Fase
7). Representa **esquemáticamente** la pantalla de monitorización, **sin
nombrar la marca nunca** (regla explícita del usuario). Modelo: una rejilla
de **filas**, cada fila con **ventanas** (una por técnica) una al lado de
otra; el lienzo hace scroll horizontal cuando no caben -se trabaja en
apaisado, como pidió-. Todo el estado en `localStorage["mio_ionm_simulador_v1"]`,
**no se sincroniza** (como Docencia: material de ensayo, no dato clínico).

- Cada ventana: `{ id, titulo, vista: "avg"|"cascada", canales:[], params:{},
  filtros:{} }`. **Avg** dibuja 2 trazos superpuestos por canal; **cascada**,
  ~7 barridas apiladas (waterfall). Los trazos son **garabatos deterministas
  por semilla** (`simSemilla`/`simRand`), no señal real: mismo montaje → mismo
  dibujo, no bailan al repintar. Color por canal: azul lo `L*`, rojo lo `R*`,
  turquesa el resto -la dualidad L/R de la pantalla real-.
- **Parámetros de estimulación a la izquierda** (`simRailParams`): rail
  compacto dentro de la ventana con lo que tenga puesto (I, f, nº, trenes,
  ISI, duración, filtro, notch, barrido). Todo se edita en el diálogo
  `#dlg-sim-ventana` (botón ⚙): título, vista, canales (chips add/quitar), y
  los dos grupos plegables estímulo/filtros.
- **Arrastrar y soltar** (HTML5 DnD nativo, `draggable`): soltar sobre otra
  ventana inserta antes/después según el lado; soltar en una `.sim-zona-fila`
  (bandas finas entre filas y en los extremos) crea una fila nueva. El movido
  se referencia **por id/objeto y se recalcula el índice tras quitarlo**
  (`simSoltarEnVentana`/`simSoltarEnZona`), nunca por índice fijo -se
  invalida al sacar la ventana que arrastras-. Reordena al soltar y repinta.
- Botones de la barra: **+ Ventana** (crea y abre su diálogo para nombrarla),
  **Ejemplo: columna lumbar** (siembra 2 filas: 4 SEP en Avg + MEP L/R en
  cascada con params de la foto que pasó el usuario, TOF, f-EMG), **Vaciar**.

  **Bug real, mismo patrón que ya documenta este archivo** (`data-i18n` sobre
  un elemento con hijos): puse `data-i18n="sim_barrido"` en un `<label>` que
  **envolvía su `<input>`**, y `aplicarTextos()` hace `el.textContent = T(...)`,
  que **borra el input**. `simGid("sim-f-barrido")` daba `null` y el diálogo
  petaba al abrir. Se quitó el `data-i18n` de ese label (queda literal, como
  el resto de micro-etiquetas de unidades del grid). **Regla: nunca `data-i18n`
  en un elemento que contiene otros nodos que deban sobrevivir** -reescribe
  todo su contenido-.
- **Micro-etiquetas del grid de parámetros** ("Int. (mA)", "Nº pulsos",
  "Trenes"…) quedan **literales en castellano**, no por `T()` -pragmatismo de
  v1, son unidades cortas; el resto del chrome sí va por `T()`-. Pendiente si
  se quiere bilingüe del todo.
- Verificado en el navegador: ejemplo, + Ventana (abre diálogo, sin el error
  de arriba), cambiar vista Avg→cascada, y las dos formas de arrastrar
  (reordenar entre filas y crear fila nueva) -estas últimas disparando los
  handlers con `DragEvent` sintéticos + `DataTransfer`, porque el arrastre de
  ratón sintético del entorno no dispara DnD nativo; el contrato DnD es el
  estándar, así que el arrastre real del usuario sí los dispara-.

**3.b — Iteración tras probarlo (mismo día, noche): columnas + morfologías +
params reales.** El usuario probó la v1 (filas) y pidió que una ventana
pudiera ocupar el alto de varias apiladas al lado (p. ej. TOF a la derecha
ocupando el alto de MEP Izq + MEP Dcho). Se cambió el modelo de **filas** a
**columnas**: `simEstado.columnas = [{ ventanas: [] }]`, el lienzo es un flex
`row` con `align-items: stretch`, cada columna un flex `column`, y cada
ventana `flex: 1 1 0` -así las ventanas de una columna reparten su alto y una
ventana sola ocupa el alto de la columna más alta de al lado, que es justo el
efecto "TOF ocupando 2 filas"-. El arrastre pasó a ser **vertical** dentro de
la columna (mitad superior/inferior de la ventana destino) + zonas
`.sim-zona-col` **entre columnas** para crear columna nueva
(`simSoltarEnVentana`/`simSoltarEnColumna`). `simCargar()` convierte el
formato viejo `filas`→`columnas` para no perder lo que hubiera. **Pendiente
(el usuario lo dijo como "en principio"):** EEG/f-EMG como tira ancha y baja
arriba del todo -el modelo de columnas no hace una banda a todo lo ancho;
queda para más adelante-.

- **Morfologías por trazo** (campo nuevo `morfologia` en la ventana:
  `sep`/`mep`/`tof`/`emg`/`eeg`/`generico`, editable con un `<select>` en el
  diálogo): `simOnda()` dibuja la forma según la morfología, no un bulto
  genérico. SEP: picos según el canal (`simPicosSEP` -N9 si "Erb", N13 si
  "Cv/C2", N20 si "C3/C4/CP", P40 si "Cz"-). MEP: ráfaga polifásica (tren de
  oscilaciones con envolvente). TOF: 4 sacudidas bifásicas T1-T4. EMG libre:
  línea casi plana con rachas -y **un canal por músculo**, como pidió-. EEG:
  oscilación continua. `tof`/`emg`/`eeg` son **traza continua única** (ignoran
  Avg/cascada); `sep`/`mep`/`generico` respetan la vista (Avg superpone 2,
  cascada apila 7). Los SVG pasaron a **alto flexible** (`viewBox` fijo +
  `preserveAspectRatio:none` + `vector-effect:non-scaling-stroke`, `height:100%`)
  para llenar la ventana sea cual sea su alto repartido.
- **Parámetros del ejemplo desde Técnicas IONM** (`data/tecnicas-mio.js`), a
  petición del usuario -"ya tenemos la info ahí"-. **No se leen en crudo**:
  ese archivo son textos con cita de fuente (p. ej. `"40 (Boaro 2026)"`), a
  veces rangos o `estimulacion.parametros` en prosa -parsearlos a campos
  numéricos sería frágil y sacaría las citas-. Se leyeron a mano y se fijaron
  los valores limpios más habituales: PESS 40 mA / 4.3-4.7 Hz / dur 200-300 µs
  / filtros 30-300 Hz / notch off / barrido implícito; PEM 5 pulsos / ISI 2 ms
  / 0.5 ms (500 µs); EMG libre 30 Hz-10 kHz, free-run; TOF 2 Hz / tren de 4.
  El ejemplo quedó en 5 columnas: [SEP Med Izq / SEP Tib Izq], [SEP Med Dcho /
  SEP Tib Dcho], [MEP Izq / MEP Dcho], [TOF] (ocupa el alto de los 2 MEP),
  [f-EMG]. **Ojo con la unidad de `duracion`**: el rail la rotula en **µs**, así
  que los PESS van en µs (200/300), no en ms (0.2/0.3) -se vio "0.2 µs" en la
  primera pasada y se corrigió-.
- Verificado en el navegador (v2): ejemplo con el TOF ocupando el alto de los
  dos MEP, morfologías reconocibles (N9/N13/N20, P40, ráfaga MEP, tren TOF,
  EMG plano con rachas), `<select>` de morfología, y las tres formas de
  arrastrar (arriba/abajo dentro de columna, y a columna nueva) con
  `DragEvent` sintéticos.

**4 — Pendiente, sin construir (decisión del usuario): bloque "Cirugías con
IONM".** Una tarjeta/pantalla nueva de inicio donde se describa cada cirugía
(ACDF, TLIF, neurinoma del acústico…): en qué consiste, pasos, técnicas a
realizar, momentos críticos y criterios de alarma, para preparar la cirugía
con todo a la vista. El usuario pidió **dejarlo pendiente** por ahora, así
que **no se ha tocado** -ni tarjeta placeholder-; queda anotado aquí para
retomarlo.

README.md revisado en el mismo turno (Simulador ya no "en construcción").
`data/guia.js` no se tocó: solo nombra el Simulador como una de las 6
tarjetas -sigue siendo cierto-, y la guía es intencionadamente breve, no
enumera el contenido de cada pantalla.

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
- `tecnicas_parametros` — objeto `{ <id_tecnica>: { intensidad, frecuencia,
  num_pulsos, trenes, isi, filtros, promediacion, barrido, notas } }`, solo
  para las técnicas ya en `tecnicas_realizadas`. Parámetros reales usados en
  *este* caso, no los de fábrica del catálogo. No tiene columna propia en el
  Sheet (no cabe en una columna por técnica sin explotar la cabecera); si
  algún día hace falta ahí, probablemente como hoja `long` nueva, igual que
  `Material_long`.
- `umbral_raices_niveles` — `{ niveles: [], valores: { <nivel_C1_a_S2>: {
  izq, der } } }`, solo relevante si `mapeo_raices_tornillos` está en
  `tecnicas_realizadas`. Campo nuevo, no una mutación de
  `umbral_tornillos_pediculares` (que sigue existiendo en paralelo, como
  texto libre). Tampoco tiene columna en el Sheet todavía.
- `imagenes_montaje` — array de `{ dataUrl, nombre }`, imágenes ya
  comprimidas en el navegador (`comprimirImagen()`) antes de guardarse en el
  propio caso. **Ojo con el tamaño del JSON**: a diferencia del resto de
  campos de texto, esto puede hacer crecer bastante un `casos/<uid>.json`
  individual — no hay límite impuesto por la app, solo la compresión previa.

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
