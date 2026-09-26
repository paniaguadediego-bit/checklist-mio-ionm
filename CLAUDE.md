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

Prepara, registra y documenta monitorizaciones neurofisiológicas
intraoperatorias. Eliges las técnicas, montas el catálogo de electrodos sobre
las cajas del equipo -**Inomed** o **Cadwell** (Cascade IOMAX), cada plantilla
y cada caso es de uno de los dos- y la app calcula el material a preparar, la
distribución en cajas con su ocupación, el montaje canal por canal y los
avisos. Además lleva la ficha de cada caso real, el checklist, la hoja de
registro intraoperatorio imprimible, consulta y docencia, y apuntes personales.

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

Todo el JavaScript vive en un único IIFE en `app.js` (~14 500 líneas a 26-09-2026). No hay
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
| Casos: sincronización | `subirCaso()`, `bajarCasos()`, `borrarCasosPendientes()`, `guardarUnCasoLocal()`/`borrarUnCasoLocal()` (un caso por clave desde el 22-09-2026) | ver `grep` |
| Casos: filtro/orden de Gestión de Casos | `casosFiltradosUids()`, `comparaDificultad()` | ver `grep` |
| Enlace de un Puente a su cork de referencia (22-09-2026; no confundir con la fila de abajo, "Puente" ahí es la metáfora plantilla↔caso, aquí es el ítem de catálogo) | `enlacePuente()`, `fijarEnlacePuente()`, `iniciarEnlacePuente()`, `completarEnlacePuente()` | ver `grep` |
| Mis apuntes: carpetas con color, orden, editor con negrita/cursiva (24-09-2026) | `grupoCarpetaApunte()`, `crearSeccionApunte()`, `moverCarpetaApunte()`, `moverSeccionApunte()`, `apunteSanear()` | ver `grep` |
| Mis apuntes: fotos como archivos aparte + sincronización | `subirApunteDocYaHidratado()`, `subirFotosApuntePendientes()`, `descargarFotosApunteFaltantes()`, `borrarFotosApunteRemotas()`, `apunteDocLigero()` | ver `grep` |
| Mis apuntes: exportar a Word (.docx, sin librerías) | `exportarApuntesWord()`, `zipSinComprimir()`, `docxParrafosDeHtml()` | ver `grep` |
| Registro intraoperatorio: pantalla digital | `REG_SECCIONES`, `regControl()`, `regGet()`, `pintarSeccion*()`, `registroPasarAlCaso()` | ver `grep` |
| Registro intraoperatorio: hoja imprimible A4 | `construirHojaRegistro()`, `abrirHojaRegistro()`, `ESTILO_HOJA_REGISTRO` | ver `grep` |
| Material, pantalla propia (todo el catálogo en filas) | `renderDocenteMaterial()`, `descripcionMaterial()` | ver `grep` |
| Fotos en IndexedDB (todas las fotos) | `guardarFotoIDB()`, `hidratarFotosIDB()`, `quitarDataUrls()` | ver `grep` |
| Cálculo del resumen (con coste) | `calcularResumen()`, `calcularCoste()` (dato) → `renderResumen()` (pintado) | [4785](app.js:4785), [4868](app.js:4868) |
| Pantalla Docencia (miotomas, cama de quirófano) | `renderDocente()`, `renderCama()` | ver `grep` |
| Puente plantilla↔caso (cargar/guardar) | `iniciarCargaPlantilla()`, `aplicarPlantillaSobreDestino()`, `guardarMontajeComoPlantilla()` | ver `grep` |
| Biblioteca de plantillas ("Plantillas de montajes" desde el 06-09-2026, tarjeta ya no diálogo desde la Fase 6) | `renderListaMontajesDialog()`, `montajeNuevo()`, `compararMontajesPorNombre()`, `limpiarMontajesHeredados()` | ver `grep` |
| Pantalla de inicio y router de pantallas (Fase 7) | `irAPantalla()`, `pantallaActiva()` | ver `grep` |
| Rótulo permanente | `renderBarraCaso()` | ver `grep` |
| Exportación manual de casos a CSV | `casosACsv()`, `COLUMNAS_CSV_CASOS` | ver `grep` |
| Informe en PDF (imprimible), uno o varios casos | `abrirInformeCasos()`, `construirInformeCaso()`, `seccionInforme()` y el resto de `seccion*Informe()` | ver `grep` |
| Guía de uso (contenido en `data/guia.js`) | `renderGuia()`, `abrirGuia()` | ver `grep` |
| Checklist pre-quirúrgico (Modelo 0 suelto o vinculado a un caso) | `CHECKLIST_ITEMS`, `checklistValores()`, `renderChecklist()`, `abrirChecklist()` | ver `grep` |
| Equipos (Inomed/Cadwell): cajas por equipo, elección, filtros, rótulos | `equipoDe()`, `cajasDe()`, `CAJAS_TODAS`, `equiposConCajas()`, `elegirEquipo()`, `nodoMarcaEquipo()`, `itemEnEquipo()` | ver `grep` |
| Cajas con grupos, rejilla, puertos con luz y polos − / + (Cadwell) | `entradasDe()` (`grupos`, `polos`), `renderCajaFisica()` (`rejilla`, `recuadro`), `puertosEncendidos()`, `pintarPuertos()` | ver `grep` |
| Basales compartidas ficha ↔ Registro | `REG_BASALES_SENS/MOT`, `regFilasBasales()`, `pintarBloqueBasales()`, `seccionBasalesInforme()`, `t: "basales_reg"` en `campoCaso()` | ver `grep` |
| Modo demostración (?demo) | `MODO_DEMO`, `almacenDemo()`, `sembrarDemo()`, `restablecerDemo()`, `prepararDemo()` | ver `grep` |

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

> **Resumen a 28-09-2026 (léelo primero; el diario cronológico está en el
> repositorio privado, ver al final de este archivo).**
> - **Pantallas (10 tarjetas de Inicio, en 2 columnas también en el móvil):**
>   Organizador de Montajes, Gestión de Casos, Checklist pre-quirúrgico, Registro
>   intraoperatorio, Material (catálogo entero con descripción de uso de cada
>   ítem), Técnicas IONM, Docencia (Miotomas, Cama, Teoría básica pendiente),
>   Simulador, Bibliografía (vacía, pendiente) y Mis apuntes.
> - **Dos equipos** (25-09-2026): `equipo_id` "inomed" | "cadwell" en plantillas y
>   casos (sin el campo = Inomed). Cajas por equipo (`cajas_material` = Inomed,
>   `cajas_cadwell`), `cajasDe()`/`CAJAS_TODAS`; se elige al crear caso o montaje en
>   blanco. Cadwell: módulo cortical (TCS H1-H9 + registro E1-E13, 1A/1R-3A/3R,
>   GND, salidas 1-5 con luz verde según lo enchufado), LCSwap (rejilla 4×3, P1-P3
>   con − y + separados), 4 módulos de extremidad y amplificador de 32 canales
>   (plegado, salida 5). **`equipo_id` no es `equipo`**: ese era un texto libre del
>   caso, retirado de la ficha; la columna `equipo` del CSV/Sheet sale ahora de
>   `equipo_id`.
> - **Basales compartidas** (25-09-2026): la tabla "Basales y comparativa" del
>   Registro se edita también desde la ficha (Desarrollo intraoperatorio). Mismos
>   datos en `caso.registro_intraop.v`. Filas según técnicas (`regFilasBasales()`).
> - **Modo demo** `?demo`: datos ficticios aislados (prefijo de localStorage,
>   IndexedDB aparte), sin sincronizar. `localStorage` a secas en todo el código,
>   nunca `window.localStorage`.
> - **Licencia**: todos los derechos reservados (`LICENSE`), titular Pablo Paniagua
>   de Diego. Registro de la Propiedad Intelectual aparcado hasta que la app esté
>   más desarrollada (paquete preparado en `../registro-propiedad-intelectual/`).
> - **Dónde vive cada dato:** localStorage (texto, ligero) · **IndexedDB** (todas
>   las fotos: casos, checklist, registro, apuntes) · repo privado
>   `checklist-mio-datos` (`estado.json`, `casos/`, `montajes/`, `apuntes/` y
>   `apuntes/fotos/<id>.jpg`, una foto por archivo; y `simulador/<id>.json`, un preset del Simulador por archivo, desde el 26-09-2026). Las fotos de CASOS siguen
>   incrustadas en el JSON del caso; solo las de Apuntes son archivos aparte.
>   Material propio del usuario (femorales, bulbocavernoso monopolar...) y precios
>   reales: `estado.json` (`catalogo_usuario`, `etiquetas_usuario`).
> - **Pendiente del usuario:** abrir la app nueva en TODOS los dispositivos (una copia con caché vieja
>   puede subir el documento de Apuntes sin sus fotos); abrir un .docx exportado en
>   Word real; revisar las descripciones de material redactadas el 26-09-2026.
> - **Ideas pendientes, no construidas:** conversión de un montaje de Inomed a
>   Cadwell (y al revés); fusionar eventos y alarmas en la pantalla del Registro
>   (solo la hoja impresa los fusiona); rellenar la tabla de tornillos de la hoja
>   desde `umbral_raices_niveles`; sección del Registro en el Sheet; bloque
>   "Cirugías con IONM"; Bibliografía y Teoría básica.
> - **Convenciones que han fallado antes:** subir el `?v=` de `index.html` en
>   cada cambio de `app.js`/`style.css`/`data/`; `git fetch`+`pull --ff-only` antes
>   de tocar `checklist-mio-datos` (y otro `fetch` antes del push: la app escribe
>   ahí sola); al editar con Python, construir el contenido entero en memoria y
>   escribirlo al final, **respetando el salto de línea que ya tenga el archivo**
>   (hoy `app.js` va en LF; cuidado con `\r` en rutas dentro de strings de Python);
>   `estado.json` y los casos se reescriben con `json.dumps(indent=2,
>   ensure_ascii=False)` y el mismo salto de línea (comprobar el round-trip antes);
>   medir `--header-h`/`--barra-caso-h` a mano si se toca la cabecera o el rótulo;
>   ES5 (`var`, sin flechas ni `let`); cualquier `[hidden]` sobre una clase con
>   `display` propio necesita su regla explícita; la hoja impresa del Registro
>   tiene que caber en A4 (medir la página 1 con casos de varias técnicas).
> - **Comprobación habitual:** `node --check app.js`, servidor estático local
>   (`.claude/launch.json`, configuración `checklist`, no `file://`), probar en el
>   navegador (el modo `?demo` trae casos y plantillas de ejemplo para probar sin
>   tocar nada real), commit y push (permiso permanente para este repo).
> - **"Actualiza todo"** (orden del usuario, 26-09-2026): poner al día este
>   resumen, el mapa del código, README.md, `data/guia.js` si cambió el flujo,
>   AGENTS.md y la memoria de Claude, y subirlo todo a GitHub.
> - **Demo y congreso** (27/28-09-2026, rama `demo-congreso`, ya en `main`): Inicio
>   en tres bloques con una línea por tarjeta; recorrido «Empieza aquí» solo en
>   `?demo` (`TOUR_PASOS`, `tourIr()`; con la ficha abierta la tarjeta va DENTRO de
>   `#dlg-caso`); caso estrella (ependimoma D8-D9) en `sembrarDemo()`; «Revisión del
>   montaje» en el Resumen (`revisarMontaje()`, reglas en `material_tecnicas` de
>   `data/surgeries.js`; lista propia, NO entra en `res.avisos` ni en el Sheet);
>   concordancia `PR`; equipo de lo nuevo por `"por_defecto"` (`equipoNuevo()`,
>   lo antiguo sin `equipo_id` sigue siendo Inomed); equipo de ejemplo `generico`
>   (solo demo); 44 px en ficha y Registro en táctil/estrecho; en `?demo`,
>   `window.fetch` rechaza otros orígenes. Sin campos nuevos en el modelo del caso.
> - **Letra Inter** servida desde `fonts/` (OFL), negritas a 600. Rótulo de la
>   plantilla cargada sobrio (`.barra-caso-equipo`, sin logotipo de marca).

## Diario del proyecto (privado)

El diario cronológico de cada cambio -qué se hizo, cuándo y por qué, con los
datos del servicio (precios reales, costes y números de casos)- **no está en
este repositorio público**. Vive en el repositorio privado de datos:
`../checklist-mio-datos/docs/DIARIO-CODIGO.md`. Léelo antes de un cambio
grande, y apunta allí cada cambio nuevo (al final, con fecha). Aquí solo se
actualiza el resumen de arriba y el mapa del código.

**Nunca escribas en este repositorio** precios reales, costes de casos, números
de caso reales, nombres de personas o del centro, ni correos o enlaces internos
(el único correo público es el de contacto del autor en la demo).
