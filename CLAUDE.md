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
`perfiles_procedimiento` y `escenarios`.

### Patrón de datos editables

Todo lo que el usuario puede modificar sigue **el mismo patrón**, y cualquier
catálogo nuevo debe seguirlo también:

> lista de fábrica + lista del usuario + lista de borrados, fusionadas por `id`
> al arrancar. Un elemento propio con el `id` de uno de fábrica lo **sustituye
> en su sitio**.

Ver `reconstruirEtiquetas()` y `reconstruirCatalogo()` como referencia.

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

---

## Estado del proyecto

La herramienta de preparación está terminada y en uso. En marcha está la
**Fase 2.0**, que amplía sin tocar lo existente:

1. Catálogos editables desde la interfaz: técnicas, intervenciones, servicios,
   escenarios y perfiles. Estructura de técnica: `{ id, etiqueta, grupo, activa }`.
   Desactivar no borra: deja de ofrecerse en casos nuevos pero sigue existiendo
   en el histórico.
2. Registro de cada caso como un archivo JSON en `casos/` del repo de datos,
   con `caso_uid` (UUID del cliente) como clave real.
3. Volcado a un Google Sheet mediante Apps Script, **reconstruyendo la hoja
   entera** en cada actualización, que alimenta un dashboard en Looker Studio.

Arquitectura: App (GitHub Pages) → repo privado de datos (fuente de verdad) →
Apps Script con disparador diario → Google Sheet → Looker Studio.

En el registro de casos hay tres fechas distintas y no deben confundirse:
`fecha` es cuándo ocurrió la cirugía (editable siempre, y es la que cuenta para
las estadísticas), `guardado_en` es cuándo se creó el archivo y `editado_en` es
un array con cada edición posterior. Las dos últimas las pone la app sola.
