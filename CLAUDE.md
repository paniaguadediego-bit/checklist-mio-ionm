# CLAUDE.md — Checklist de material MIO/IONM

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
   datos de pacientes ni el nombre del centro.
3. **Lo que se guarda son ids, nunca etiquetas visibles.** Los escenarios ya
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
| `data/surgeries.js` | Lo de fábrica: cajas, etiquetas, catálogo, técnicas, perfiles y 2 escenarios base | Nunca: está en git |
| `localStorage` del navegador | **Tu trabajo**: escenarios, etiquetas y material propios | Borras los datos del sitio, cambias de navegador o de dispositivo |
| Repo privado `checklist-mio-datos` | Copia sincronizada de todo lo anterior | Nunca: cada sincronización es un commit |

La capa frágil es la del medio. Por eso existe la sincronización, y por eso la
red de seguridad de abajo se apoya en el **historial de git del repo de datos**.

### El repositorio de datos

- Repositorio: `paniaguadediego-bit/checklist-mio-datos` (**privado**).
- Un único archivo en la raíz: `estado.json`.
- Lo escribe `estadoActual()` ([app.js:1217](app.js:1217)) y tiene esta forma:

```
{ formato: "mio-ionm", version: 2, fecha, escenarios, catalogo_usuario,
  etiquetas_usuario, etiquetas_borradas, borrados, activo }
```

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
configurada, `bajarAuto()` ([app.js:1350](app.js:1350)) se trae la última versión
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

Todo el JavaScript vive en un único IIFE en `app.js` (~2600 líneas). No hay
módulos. Las funciones son declaraciones, así que el orden de definición no
importa.

| Zona | Función clave | Línea |
|---|---|---|
| Idioma | `volcarTraducciones()`, `campo()` | [269](app.js:269), [348](app.js:348) |
| Etiquetas (tipos físicos) | `reconstruirEtiquetas()` | [422](app.js:422) |
| Catálogo de material | `reconstruirCatalogo()` | [511](app.js:511) |
| Carga y guardado del estado | `cargarEstado()`, `guardarEstado()` | [582](app.js:582), [650](app.js:650) |
| Entradas de una caja | `entradasDe()` | [764](app.js:764) |
| Sincronización | `estadoActual()`, `aplicarEstado()`, `programarSubida()`, `subirAuto()`, `bajarAuto()` | [1217](app.js:1217)–[1374](app.js:1350) |
| Cálculo del resumen | `renderResumen()` | [2146](app.js:2146) |

Datos de fábrica en `data/surgeries.js`: `cajas_material`, `etiquetas`,
`catalogo_material`, `tecnicas` (14 de monitorización + 8 de mapeo),
`servicios`, `intervenciones`, `perfiles_procedimiento` y `escenarios`.

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

`tecnicas`, `servicios`, `intervenciones` y `perfiles` se editan desde el
diálogo **Catálogos** (botón en la barra de herramientas). Su estado vive en
`catalogos` y se guarda dentro de `estado.json`:

```
catalogos: {
  <nombre>: { version, actualizado_en, propios[], orden[], borrados[] }
}
```

- `propios` — elementos creados o editados por el usuario, por `id`.
- `orden` — ids en el orden fijado a mano. Lo que no esté va detrás, en el
  orden de fábrica: una técnica nueva aparece al final, nunca desaparece.
- `borrados` — solo se usa en perfiles. Técnicas, servicios e intervenciones
  **no se borran**, se desactivan (`activa: false`), porque un caso guardado
  puede referirse a ellos.
- `version` sube y `actualizado_en` se sella en cada cambio (`tocarCatalogo`).

Cuidado con el nombre **`etiqueta`**: en una técnica es su texto visible; en el
material es el tipo físico (aguja, sacacorchos…). No tienen nada que ver.

Al cambiar un texto que venía de fábrica, `fijarTexto()` borra sus traducciones
`_en`: ya no describen lo que hay. Es la misma regla que con los escenarios.

### Sincronización: cómo funciona de verdad

- Cada `guardarEstado()` marca `pendiente` y arranca una cuenta atrás de 4 s
  (`programarSubida()`).
- **Modo quirófano pausa la subida**: marca pendiente pero no arranca el
  temporizador. Al salir del modo se manda lo acumulado. Durante la cirugía no
  se toca la red.
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

---

## Estado del proyecto

La herramienta de preparación está terminada y en uso. En marcha está la
**Fase 2.0**, que amplía sin tocar lo existente:

1. ~~Catálogos editables desde la interfaz~~ — **hecho**. Técnicas,
   servicios, intervenciones y perfiles se editan en el diálogo Catálogos; los
   escenarios ya se editaban desde la barra de herramientas.
2. ~~Registro de cada caso como un archivo JSON en `casos/`~~ — **hecho**.
3. ~~Volcado a un Google Sheet mediante Apps Script~~ — **hecho**. Código en
   [`apps-script/Codigo.gs`](apps-script/Codigo.gs), instrucciones de
   instalación en el README. Falta que el usuario lo instale y lo compruebe
   con casos reales; falta la Fase 4 (Looker Studio).

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
refiriéndose a ella por id.

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

## Casos

Un archivo JSON por caso en `casos/<caso_uid>.json` del repositorio de datos.
**No van dentro de `estado.json` a propósito**: ese archivo se sincroniza
entero y dos dispositivos escribiéndolo se pisan. Con un archivo por caso y el
nombre derivado de un UUID, dos dispositivos no pueden chocar.

- `caso_uid` — UUID del cliente. Es la clave real.
- `ID_Caso` — correlativo `AAAA-NNN` por año de `fecha`, solo para nombrar el
  caso en voz alta. Se asigna al crearlo tomando el máximo conocido. Si dos
  dispositivos sin conexión generan el mismo, no rompe nada: el Apps Script
  avisa.
- `estado` — `preparado` | `cerrado`.
- `tecnicas_realizadas` — ids de técnica, nunca etiquetas.

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
conexión sube en cuanto vuelve la red o al salir del Modo quirófano.

Sincronización: `subirCaso()` sube uno con su `sha`; si el archivo cambió desde
otro dispositivo relee el `sha` y reintenta una vez (gana lo que acabas de
escribir aquí). `bajarCasos()` lista `casos/` y **solo descarga los que han
cambiado**, comparando el `sha` del listado; nunca pisa un caso con cambios
locales sin subir. Un conflicto en `estado.json` **no** bloquea la subida de
casos: son archivos independientes.

Arquitectura: App (GitHub Pages) → repo privado de datos (fuente de verdad) →
Apps Script con disparador diario → Google Sheet → Looker Studio.

En el registro de casos hay tres fechas distintas y no deben confundirse:
`fecha` es cuándo ocurrió la cirugía (editable siempre, y es la que cuenta para
las estadísticas), `guardado_en` es cuándo se creó el archivo y `editado_en` es
un array con cada edición posterior. Las dos últimas las pone la app sola.
