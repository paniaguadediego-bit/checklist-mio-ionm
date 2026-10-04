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

### Si sale «Elegir versión» en el botón ☁ (antes «Conflicto»)

Significa que otro dispositivo subió cambios de `estado.json` que este no tiene.
**La app nunca decide por su cuenta**: elige tú *Quedarme con lo de este
dispositivo* (antes *Subir*) o *Quedarme con lo de la nube* (antes *Bajar*). Si dudas cuál conserva más trabajo, exporta primero
una copia local y compárala con la del repositorio.

### Antes de cualquier cambio grande en el código

Exporta una copia desde la herramienta (**Exportar copia**) y guárdala fuera del
proyecto. **Ojo:** esa copia es `estadoActual()` -catálogos, etiquetas y material
propio-, **no incluye casos, montajes ni apuntes** (van en archivos aparte desde
que se separaron). Para esos, la copia de verdad es el repositorio de datos: clónalo
(ver «Copia fría completa» más arriba) antes de un cambio grande.

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
| Catálogos editables (técnicas/servicios/intervenciones/perfiles/escenarios/usuarios/centros) | `fusionarCatalogo()`, `reconstruirCatalogos()` | ver `grep` |
| Centros (estudio multicéntrico, 03-10-2026): catálogo `centros` {id, nombre, codigo}, vacío de fábrica; centro del dispositivo en `mio_ionm_centro_id` (no se sincroniza); `centro_id` en el caso (el texto `centro` se deriva al guardar); número «H1-2026-003»; filtro «Centro»; usuarios con `centro_id` | `CENTROS_BASE`, `centroIdDispositivo()`, `selectorCentroDispositivo()`, `siguienteIdCaso(fecha, centroId)`, `RE_ID_CASO`, `ajustarCentroCaso()`, `pintarFiltroCentro()`, `opcionesCentros()`, `listaCatalogoCaso()` | ver `grep` |
| Diálogo de la nube en lenguaje llano (Subir/Bajar escondidos si no hay choque) | `pintarDlgSync()`, `syncAvanzado` | ver `grep` |
| Carga y guardado del estado | `cargarEstado()`, `guardarEstado()` | [1159](app.js:1159), [1281](app.js:1281) |
| Entradas de una caja | `entradasDe()` | [1510](app.js:1510) |
| Selección y colocación (pulsar y colocar); chip con el nombre en `.chip-nombre` (se parte en entradas estrechas) | `seleccionar()`, `colocar()`, `crearChip()` | ver `grep` |
| Sincronización de `estado.json` | `estadoActual()`, `aplicarEstado()`, `programarSubida()`, `subirAuto()`, `bajarAuto()` | [2057](app.js:2057)–[2224](app.js:2224) |
| Montajes: modelo, autoría y sincronización | `montajeNuevo()`, `puedoEditar()`, `guardarMontaje()`, `subirMontaje()`, `bajarMontajes()` | ver `grep` |
| Casos: modelo y ficha | `borrarCaso()`, `guardarCaso()`, `casoVacio()`, `renderFichaCaso()` | [2454](app.js:2454), [2467](app.js:2467), [2498](app.js:2498), [3669](app.js:3669) |
| Casos: sincronización | `subirCaso()`, `bajarCasos()`, `borrarCasosPendientes()`, `guardarUnCasoLocal()`/`borrarUnCasoLocal()` (un caso por clave desde el 22-09-2026) | ver `grep` |
| Casos: filtro/orden de Gestión de Casos (panel plegable «Filtros (n)», chips de filtros activos con ✕, Especialidad = `servicio_id`, Diagnóstico = `diagnostico` desde el 04-10) | `casosFiltradosUids()`, `comparaDificultad()`, `pintarFiltrosActivos()`, `pintarFiltroServicio()`, `pintarFiltroDiagnostico()`, `CASOS_FILTROS_SELECT` | ver `grep` |
| Enlace de un Puente a su cork de referencia (22-09-2026; no confundir con la fila de abajo, "Puente" ahí es la metáfora plantilla↔caso, aquí es el ítem de catálogo) | `enlacePuente()`, `fijarEnlacePuente()`, `iniciarEnlacePuente()`, `completarEnlacePuente()` | ver `grep` |
| Mis apuntes: carpetas con color, orden, editor con negrita/cursiva (24-09-2026) | `grupoCarpetaApunte()`, `crearSeccionApunte()`, `moverCarpetaApunte()`, `moverSeccionApunte()`, `apunteSanear()` | ver `grep` |
| Mis apuntes: fotos como archivos aparte + sincronización | `subirApunteDocYaHidratado()`, `subirFotosApuntePendientes()`, `descargarFotosApunteFaltantes()`, `borrarFotosApunteRemotas()`, `apunteDocLigero()` | ver `grep` |
| Mis apuntes: exportar a Word (.docx, sin librerías) | `exportarApuntesWord()`, `zipSinComprimir()`, `docxParrafosDeHtml()` | ver `grep` |
| Registro intraoperatorio: pantalla digital | `REG_SECCIONES`, `regControl()`, `regGet()`, `REG_PANTALLA` (pintado propio por sección), `pintarSeccionCampos()` (A), `pintarSeccionBasales()` (E) | ver `grep` |
| Lista propia de TODOS los desplegables (el `<select>` cerrado no cambia; un manejador en `document` en captura; `data-nativo` para excluir uno). En táctil se abre al SOLTAR y solo si el dedo no se movió (si no, es scroll) | `selEsPropio()`, `abrirListaSelect()`, `colocarListaSelect()`, `cerrarListaSelect()`, `selMovido()` | ver `grep` |
| Técnicas IONM desde el repo privado | `bajarTecnicasMio()`, `hayTecnicasMio()`, `pintarTileTecnicasMio()`, `olvidarTecnicasMio()`, `TECMIO_KEY` | ver `grep` |
| Técnicas IONM: fuentes agrupadas por obra (número + letra), mismos superíndices en Tarjetas y Tabla, lista al pie solo con lo citado | `mapaFuentesTecMio()` (se rehace si cambia `window.TECNICAS_MIO`), `partirFuenteTecMio()`, `letraFuenteTecMio()`, `notaFuentesTabla()`, `bloqueFuentesTecMio()`, `tecMioPrefijoNota` | ver `grep` |
| Técnicas en apartados: monitorización, reflejos de tronco, reflejos medulares, mapeo (`"reflejo": "tronco"/"medular"` en `data/surgeries.js`) | `tipoReflejo()`, `bloquesTecnicas()`, `apartadosTecnicas()`, `anadirChipsAgrupados()`, `renderTecnicas()` | ver `grep` |
| Catálogo del Organizador en el móvil (sin scroll propio; al elegir sube a las cajas y al colocar vuelve al material) | `plegarCatalogo()`, `anclaCatalogo`, `catalogoConScrollPropio()`, `altoBarrasFijas()` | ver `grep` |
| Foco sin teclado en táctil (Etiquetas, Material nuevo) | `enfocarSinTeclado()` | ver `grep` |
| Bibliografía recomendada (Vancouver con DOI) | `BIBLIOGRAFIA`, `renderBibliografia()` | ver `grep` |
| Selector «Vincular a un caso» propio (Checklist y Registro; el `<select>` sigue oculto como fuente de verdad) | `mejorarSelectorCaso()`, `refrescarSelectorCaso()`, `pintarOpcionCaso()` | ver `grep` |
| Registro ↔ ficha: campos compartidos (`caso: "campo"` en la definición; `soloCaso`; `leerCaso`) — `regGet()` los lee del caso y `regControl()` los escribe en el caso | `regGet()`, `regControl()`, `regNombresTecnicas()` | ver `grep` |
| Registro: hoja completa simplificada en pantalla (la impresa no cambia); bloques de Mapeo con el color de su técnica (GRID = c-MEP, el resto = mapeo; `nodoBloqueMapeo()`, también en la ficha) | `REG_PANTALLA` (id de sección → pintado propio; `null` = no se enseña: A, B, C, D, esquema, F, G y H; en pantalla solo E, E2 e I, sin la letra de la hoja), `pintarPantallaMapeo/Cierre()`, `REG_MAPEO_BLOQUES`, `pintarMapeoGrid/Filas/Raices()`, `regFilasTornillos()`, `regInput()`, `regSelectLista()` | ver `grep` |
| Registro: varias técnicas a la vez = una alarma «A + B»; magnitud %; técnicas con alteración solas; comparativa de basales; borrador del resumen | `regElegirQue()`, `regQuesElegidos()`, `regTecnicasDeQue()`, `REG_CAMBIOS_MAGNITUD`, `regConMagnitud()`, `regComparacionesBasales()`, `borradorResumenCaso()` | ver `grep` |
| Registro, diseño B (04-10-2026): barra fija abajo + hoja de apuntar desde abajo, por pasos; Cronograma compacto en el centro | `pintarBarraApuntar()`, `regHoja`, `regPaso`, `regAbrirHoja()`, `regCerrarHoja()`, `pintarCronograma()`, `regVerUltimoApuntado()`, `.rr-barra-apuntar`, `.rr-hoja`, `.rr-pasos`, `.rr-principal`; colores de familia `regFamiliaDeQue()`, `regPonerFamilia()` | ver `grep` |
| Registro: panel «Apuntar fase, evento o alarma» (antes modo rápido; único sitio donde se apuntan; desde el 04-10 es el contenido de la hoja de abajo; escribe en `eventos`/`alarmas`, sin datos propios; «Otro» + cajas; QUÉ en filas por tipo -técnicas, factores técnicos, anestesia, Otro-; TOF 0/4…4/4 como contexto (regRapido.tof → ev.tof/al.tof); contexto quirúrgico; «Cronograma de eventos» por hora ascendente: tarjetas con franja de color por gravedad y filtros Todos/Críticos/Cambios/Info, horas editables, ✎ para corregir cada línea —desde el 04-10 abre la MISMA hoja que para apuntarla, con los botones marcados, y «Guardar cambios» la corrige en su sitio (id, hora y número de alarma no cambian)— y, bajo cada alarma, causa, medidas y recuperación) | `pintarPanelApuntar()`, `regItemsApuntados()`, `regTipoApuntado()` (gravedad y etiqueta), `regFiltroCrono`, `regLineaApuntada()`, corregir: `regAbrirEdicion()`, `regEditandoAp` ({ev, al}), `regRapidoDeApunte()` (lo contrario de `regApuntar()`: de lo guardado a los botones; un campo nuevo de la hoja se lee también aquí), `regTerminarEdicion()` (devuelve lo que hubiera a medio elegir, `regRapidoAparte`), `regRapidoReiniciar()` (al cambiar de caso), `regQuesConocidos()`, `regCambioDeTexto()`; al corregir, selector **Evento | Alarma** para convertir una en otra (`.rr-tipo-ed`; evento → alarma toma la primera fila libre; alarma → evento deja su fila vacía, pide confirmar si tenía causa, medidas marcadas o recuperación, y si ya no queda ninguna alarma quita la marca «alerta» del caso; las recuperaciones no se convierten), alarma plegable con `resumenAlarma()` (`regAlarmasAbiertas`), `pintarMedidasRecup()` (también en la ficha), `regApuntar()`, `regMarcarFase()`, `regQuitarRapido()`, `regCajaRapida()`, `REG_TOF`, `REG_CONTEXTO` (ev.contexto, ids), `REG_FASES_RAPIDAS`, `REG_CAMBIOS_RAPIDOS`, `REG_QUE_EXTRA`, `REG_QUE_OTRO`/`REG_CAMBIO_OTRO` | ver `grep` |
| Registro intraoperatorio: hoja imprimible A4 | `construirHojaRegistro()`, `abrirHojaRegistro()`, `ESTILO_HOJA_REGISTRO` | ver `grep` |
| Material, pantalla propia (todo el catálogo en filas) | `renderDocenteMaterial()`, `descripcionMaterial()` | ver `grep` |
| Fotos en IndexedDB (todas las fotos) | `guardarFotoIDB()`, `hidratarFotosIDB()`, `quitarDataUrls()` | ver `grep` |
| Cálculo del resumen (con coste) | `calcularResumen()`, `calcularCoste()` (dato) → `renderResumen()` (pintado) | [4785](app.js:4785), [4868](app.js:4868) |
| Pantalla Docencia (miotomas, cama de quirófano) | `renderDocente()`, `renderCama()` | ver `grep` |
| Puente plantilla↔caso (cargar/guardar) | `iniciarCargaPlantilla()`, `aplicarPlantillaSobreDestino()`, `guardarMontajeComoPlantilla()` | ver `grep` |
| Organizador en dos pantallas (04-10-2026, «como Gestión de Casos»): lista de plantillas sola al entrar (`body.org-lista`, botón «Crear plantilla», filtros) y, al tocar una, su edición (ruta «Plantillas › nombre» arriba para volver; rótulo con Guardar plantilla y Más acciones; Cajas, Técnicas, Resumen, Notas y Catálogo). Corregir el montaje de un caso (`editando-caso`) es siempre la edición. Atrás del móvil en la edición → lista | `orgEditor`, `aplicarModoOrganizador()` (en `renderTodo()`; también las migas «Plantillas › nombre» `#org-migas` y Cajas abierta al entrar), colores por familia de técnica (sensitivas ámbar, PEATC amarillo `aud`, motoras rojo, EMG verde, reflejos rojo-violeta —cualquier técnica con `reflejo`—, EEG/ECoG azulado, mapeo rosa; `FAMILIA_TEC`, `REFLEJOS_TEC`, `familiaTecnica()`, `--fam-*` en style.css; franja izquierda `--franja` con las familias de la plantilla; leyenda; vacías atenuadas con «Vacía»), «Ordenar por» nombre / última modificación (`ordenPlantillas()`, `comparadorPlantillas()`, `PLANTILLAS_ORDEN_KEY`, por dispositivo), `abrirEditorPlantilla()`, `volverAListaPlantillas()`, `#btn-crear-plantilla`; selección de varias con «Más acciones» encima de la lista (`plantillasSel`, `renderLotePlantillas()`, `#montajes-lote`, `vaciarMontaje()`, `quitarMontaje()`) | ver `grep` |
| Biblioteca de plantillas ("Plantillas de montajes" desde el 06-09-2026, tarjeta ya no diálogo desde la Fase 6; desde el 04-10-2026 `#montajes` es un <div>, la lista de la primera pantalla) | `renderListaMontajesDialog()`, `montajeNuevo()`, `compararMontajesPorNombre()`, `limpiarMontajesHeredados()` | ver `grep` |
| Pantalla de inicio y router de pantallas (Fase 7) | `irAPantalla()`, `pantallaActiva()` | ver `grep` |
| Rótulo permanente | `renderBarraCaso()` | ver `grep` |
| Exportación manual de casos a CSV | `casosACsv()`, `COLUMNAS_CSV_CASOS`, `descargarCsv()` | ver `grep` |
| Exportación de eventos y alarmas del Registro a CSV (una fila por evento/alarma) | `eventosACsv()`, `COLUMNAS_CSV_EVENTOS`, `minutosEntre()` | ver `grep` |
| Informe en PDF (imprimible), uno o varios casos | `abrirInformeCasos()`, `construirInformeCaso()`, `seccionInforme()` y el resto de `seccion*Informe()` | ver `grep` |
| Guía de uso (botón «Guía» de la barra; contenido corto en `data/guia.js`: `flujo`, `pantallas`, `claves`, `dudas`) | `renderGuia()`, `abrirGuia()` | ver `grep` |
| Checklist pre-quirúrgico («Sin caso — hoja suelta», antes «Modelo 0», o vinculado a un caso) | `CHECKLIST_ITEMS`, `checklistValores()`, `renderChecklist()`, `abrirChecklist()` | ver `grep` |
| Equipos (Inomed/Cadwell/Genérico): cajas por equipo, elección, filtros, rótulos | `equipoDe()`, `cajasDe()`, `CAJAS_TODAS`, `equiposConCajas()`, `elegirEquipo()`, `nodoMarcaEquipo()`, `itemEnEquipo()` | ver `grep` |
| Cajas con grupos, rejilla, puertos con luz y polos − / + (Cadwell) | `entradasDe()` (`grupos`, `polos`), `renderCajaFisica()` (`rejilla`, `recuadro`), `puertosEncendidos()`, `pintarPuertos()` | ver `grep` |
| Registro ↔ ficha en espejo (28-09-2026): alarmas con listas cerradas (`REG_CRITERIO_AL`, `REG_CAUSA_AL`, `REG_MEDIDAS_AL`; ids, lo antiguo como opción más), mapeo E2 y eventos «An» pintados también en la ficha sobre la copia de trabajo (`guardar` = `REG_SIN_GUARDAR`); «Tipo de alerta»/«Medida correctora» se derivan al guardar; («Resultado de la señal» ya no está en el Registro desde el 30-09-2026: sigue solo en la ficha); evolución en lista + propuesta de concordancia | `pintarAlarmas()`, `alarmasEnCaso()` (en `guardarCaso()`), `textoAlarma()`, `regSelectLista()`, `regIdLista()`, `pintarEventosAn()`, `propuestaConcordancia()`, `t: "alarmas_reg"/"mapeo_reg"/"eventos_an"` en `campoCaso()` | ver `grep` |
| Columna vertebral de umbrales por raíz (ficha y E2 del Registro; salto discontinuo) | `pintarColumnaRaices()`, `REG_NIVELES_RAICES` | ver `grep` |
| Columnas de basales Basal/PostPos1/PostPos2/Cierre | `REG_BASALES_COLS`, `regColBasal()` | ver `grep` |
| Eventos An (tabla de la ficha; C · Anestesia ya no sale en la pantalla del Registro) | `pintarEventosAn()` | ver `grep` |
| Correlación de cada alarma con la evolución (ficha, Resultado): grupos automáticos por técnica + criterio; `correlato_alarmas` = {clave de grupo: {evol, momento}} con ids (`OPCIONES.correlato_evol/_momento`); concordancia por grupo | `gruposAlarmas()`, `filaCorrelato()`, `concordanciaGrupo()`, `filasCorrelato()` (→ `correlato_filas`), `textoCorrelato()`, `concordanciaDeGrupos()`, `seccionCorrelatoInforme()`, `repintarCorrelato`, `repintarPropuestaCaso`, `t: "correlato_alarmas"` en `campoCaso()` | ver `grep` |
| Recuadros de texto que crecen solos (sin tirador): input + MutationObserver (childList y open/class/hidden) | `ajustarAltoTexto()`, `ajustarTodosLosTextos()`; `textarea { resize: none }` | ver `grep` |
| Nombre corto de técnica en los chips de pantalla (`"corta"` en `data/surgeries.js`: BR, TVcR, TCR, THR, LAR, H-R Masetero) + ayuda al mantener pulsado (`data-ayuda`) | `rotularChipTecnica()`, `ayudaTecnica()`, `mostrarGloboAyuda()`, `.globo-ayuda` | ver `grep` |
| Casillas de tabla sin texto dentro (la cabecera ya lo dice) | `regInputSinTexto()` | ver `grep` |
| Menú ⋮ «Ocultar ayudas» | `AYUDAS_KEY`, `aplicarAyudas()`, `body.sin-ayudas` en style.css | ver `grep` |
| Colores: tres modos con el botón redondo junto al ⋮ (ciclo oscuro → azul → claro; azul por defecto; por dispositivo, `mio_ionm_tema_v2`). Azul en `@media screen { :root:not(.tema-claro) … }`, oscuro (negro y dorado) en `:root.tema-oscuro` justo después, claro = `:root` sin más; al imprimir, siempre los claros. `--cab-bg`/`--cab-texto` para cabeceras | `TEMAS`, `aplicarTema()`, `#btn-colores`, `html.tema-claro` / `html.tema-oscuro` en style.css | ver `grep` |
| Alto real de la barra superior en `--header-h` (lo usan los sticky de debajo) | IIFE junto a `aplicarTema()` con `ResizeObserver` | ver `grep` |
| Plantillas: fila con aspecto de caso (fecha, marca del equipo, técnicas, «+n» con globo) y favoritas por dispositivo y perfil | `nodoFilaPlantilla()`, `PLANTILLA_MAX_TECS`, `favoritasPlantillas()`, `esFavorita()`, `alternarFavorita()`, `FAV_PLANTILLAS_KEY` (orden solo por nombre: las favoritas no suben arriba desde el 04-10-2026) | ver `grep` |
| Demo: etiqueta «Ficticio» y aviso en la ficha | `nodoFicticio()`, `#caso-aviso-demo` | ver `grep` |
| Biblioteca de montajes (en construcción; ids «casos-modelo») | `renderCasosModelo()`, `CMOD_TECNICAS`, `#pantalla-casos-modelo` | ver `grep` |
| Precios inventados de la demo | `PRECIOS_DEMO`, `preciosDemo()` | ver `grep` |
| Ficha a pantalla completa (04-10-2026): sigue siendo `<dialog id="dlg-caso">` (showModal), pero `#dlg-caso[open]` ocupa 100vw×100dvh sin margen ni bordes y el contenido se centra hasta 1400 px (padding de `.caso-cab`, `.caso-scroll`, `.caso-acciones`); la barra superior de la app queda tapada mientras está abierta | reglas al final de style.css | — |
| Ficha: autoguardado, salir y cerrar caso | `autoguardarFicha()`, `salirDeFicha()`, `firmaFicha()`, `fichaOrigen`, `casoCambiadoFuera()`, `pintarBotonCerrarCaso()`; aviso de lo que falta al cerrar; campos cortos en una fila (`fila` en `CAMPOS_CASO` → `.campos-fila`); ⋮ Abrir en el Registro (`#caso-ir-registro`); `borradorResumenCaso()` | ver `grep` |
| Papelera de casos (04-10-2026): Borrar manda el caso a una papelera DE ESTE DISPOSITIVO (30 días, se vacía sola); el borrado en GitHub sigue igual (el Sheet no cambia); Recuperar lo vuelve a subir (cancela el borrado si no había llegado); fotos en IndexedDB hasta vaciarla; sus números no se reutilizan | `PAPELERA_KEY`, `papeleraCasos`, `meterEnPapelera()`, `recuperarDePapelera()`, `vaciarDePapelera()`, `cargarPapelera()`, `renderPapelera()`, `#dlg-papelera`, `#btn-papelera-casos` | ver `grep` |
| Fusión de un caso en conflicto de subida | `fusionarCaso()` (dentro del 409/422 de `subirCasoYaHidratado()`) | ver `grep` |
| Copia completa (exportar/importar) | handler de `btn-exportar`, `importarCopiaCompleta()` | ver `grep` |
| Ids de opción de «Cómo se realizó cada técnica» | `tecParIdDe()`, `tecParTextoDe()`, `"ids"` en `data/parametros-tecnicas.js` | ver `grep` |
| Alarmas: qué cuenta como escrita y derivación al caso | `alarmaEscrita()`, `alarmasEnCaso()`, `concordanciaDudosa()`, `motivoConcordancia()` | ver `grep` |
| Basales compartidas ficha ↔ Registro | `REG_BASALES_SENS/MOT`, `regFilasBasales()`, `pintarBloqueBasales()`, `seccionBasalesInforme()`, `t: "basales_reg"` en `campoCaso()`; en pantalla, lista por técnica (una línea con valores y %, casillas grandes al tocarla, «= Basal»): `regComparacionFila()`, `regBasalAbiertas`; dos medidas por fase: `REG_BASALES_MEDIDAS`, `regBasalValor()`, `regBasalMigrar()`, `regBasalTexto()` | ver `grep` |
| Modo demostración (?demo) | `MODO_DEMO`, `almacenDemo()`, `sembrarDemo()`, `restablecerDemo()`, `prepararDemo()`; bloqueo de `fetch` a otros orígenes al principio del archivo; registros de ejemplo con `registroDemo(v, lineas)` | ver `grep` |
| Visita guiada opcional (antes "Empieza aquí"; solo ?demo) | `TOUR_PASOS`, `TOUR_GRUPO_CASO`, `tourIr()`, `tourPreparar()`, `tourPintarTextos()`, `tourReservarSitio()`, `tourTerminar()` | ver `grep` |
| Revisión del montaje (avisos del Resumen, no se guardan) | `revisarMontaje()`, `matTecGrupos()`; datos en `material_tecnicas` de `data/surgeries.js` | ver `grep` |
| Equipo de lo nuevo / rótulo del equipo | `equipoNuevo()` (`"por_defecto"` en `equipos`), `anadirRotuloEquipo()` (`.barra-caso-equipo`) | ver `grep` |
| Menús desplegables de acciones | `cerrarMenuCaso()` (⋮ de la ficha), `cerrarMenuMontajes()` (Más acciones de Plantillas) | ver `grep` |

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

`tecnicas`, `servicios`, `intervenciones`, `perfiles`, `usuarios` y `centros` (03-10-2026) se editan
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

> **Resumen a 04-10-2026, noche (léelo primero; el diario cronológico está en
> el repositorio privado, ver al final de este archivo).**
> - **Lo último de todo (04-10-2026, última hora):**
>   - **Corregir en el Registro con los mismos botones**: ✎ abre la hoja de
>     apuntar («Corregir evento / alarma / fase», «Guardar cambios») con lo
>     guardado ya marcado (`regRapidoDeApunte()`), y la línea se corrige en su
>     sitio. En Contexto, además, la **fase** en que pasó. Fuera el editor de
>     casillas de texto (`regEditorApuntado()`). Probado: las 78 líneas de los
>     casos demo quedan idénticas al guardar sin tocar nada. Al corregir, un
>     **evento se puede convertir en alarma y al revés** (selector Evento |
>     Alarma arriba de la hoja); si la alarma convertida era la última, el
>     caso deja de estar «con alerta».
>   - **Mapeo** (Registro y ficha): cada bloque con franja y título del color de
>     su técnica (`nodoBloqueMapeo()`).
>   - **Plantillas**: marcar **varias** (casilla en cada fila) y «Más acciones»
>     para todas; fuera «← Todas las plantillas» (repetía la ruta del título).
>   - **Modo claro**: `--text-muted` de #62717c a #3e4850 (el usuario: «el gris
>     de las letras apenas contrasta»); contraste mínimo 4,69:1. La paleta no
>     cambió (se le enseñaron tres y dijo que el problema era el gris).
> - **Lo último (04-10-2026, tarde y noche):**
>   - **Registro con diseño B** (elegido por el usuario entre tres maquetas):
>     Cronograma compacto en el centro (una línea por evento: hora · texto · ✎ ✕;
>     el tipo, por la franja de color y el `title`; lo recién apuntado se enseña
>     y se resalta, `regVerUltimoApuntado(id)`, `data-id`), «Fase actual» encima,
>     y barra fija abajo **+ Fase · + Evento · + Alarma** que abre una hoja desde
>     abajo (`regHoja`, `regPaso`, `regAbrirHoja()`, `regCerrarHoja()`,
>     `pintarBarraApuntar()`, `pintarPanelApuntar()` reconvertido,
>     `pintarCronograma()` aparte). Evento/alarma por pasos Técnica › Hallazgo ›
>     Contexto con ✓ y «Siguiente»; el botón de apuntar siempre visible; Escape o
>     el fondo cierran sin borrar lo elegido. Los datos no cambian.
>   - **Colores de familia en el Registro** (botones de Técnica, nombre, franja y
>     flecha de cada fila de Basales, técnicas del Cronograma):
>     `regFamiliaDeQue()`, `regPonerFamilia()`, `--fam` en `.fam-*`. **PEATC con
>     familia propia AMARILLA** (`aud`, `--fam-aud`) en plantillas, casos y
>     Registro; **Técnicas IONM conserva su paleta `--tm-*`** (pedido expreso).
>   - **Reflejos de tronco y medulares**: `"reflejo": "tronco" | "medular"` en
>     `data/surgeries.js` (PRM pasa a reflejo medular); `tipoReflejo()`,
>     `apartadosTecnicas()`; títulos en Organizador, ficha (también
>     monitorización y mapeo, `.chip-grupo-tit`), informe, hoja y Registro.
>   - **Letra +0,5 pt** en toda la app (`html` 104,76 %, `body` 0.875rem).
>   - **Gestión de Casos**: filtro **Diagnóstico** (`pintarFiltroDiagnostico()`;
>     el chip enseña el nombre sin la sigla). Plantillas: siempre «modificada
>     {fecha}». Cronograma con cabecera de botón y «Mostrar/Ocultar».
>   - **Técnicas IONM**: fuentes **agrupadas por obra** (número alfabético +
>     letra por capítulo, «5k»; pasada la z, aa…) y superíndices también en las
>     Tarjetas (`mapaFuentesTecMio()`, `bloqueFuentesTecMio()`,
>     `notaFuentesTabla()`, `letraFuenteTecMio()`); familia de mapeo con
>     etiquetas cortas «Mapeo»/«NAP» en el repo privado.
>   - **Revisión «para un médico de otro hospital»**: corregidos errores y notas
>     internas (bloques 1 y 2) y, del bloque 3, equipo **Genérico** activo,
>     cajas Inomed con «p. ej.», **nombre completo delante y sigla entre
>     paréntesis** (diagnóstico, anestesia; NRF → Neurofis., PPCC → pares
>     craneales), fuera «Pendiente: Base de datos / Registro tiempos», servicios
>     Cirugía General y Cirugía Cardiaca / Torácica y COT con su nombre, y
>     castellano (reflejo de parpadeo, paciente despierto, «configuración» en el
>     Simulador). «Modelo 0» ya no sale en pantalla: «Sin caso — hoja suelta».
>     **Aparcado por el usuario**: el **MAV** (revisarlo más adelante), el punto
>     7 (nube con GitHub y token, ligado al multicéntrico) y el bloque 4 (Gmail
>     del pie, notas internas de `parametros-tecnicas.js`, comentarios del
>     código público).
> - **Pantallas (Inicio en tres bloques, tarjetas centradas, una línea bajo cada
>   nombre):** *Antes de quirófano*: Organizador de Montajes, Gestión de Casos.
>   *Quirófano*: Checklist pre-quirúrgico (4 momentos; «Con el campo abierto»
>   quitado), Registro intraoperatorio. *Después / consulta*: **Biblioteca de
>   montajes** (en construcción; ids `casos-modelo`), Técnicas IONM (solo con
>   token), Material (en construcción), **Miotomas** (antes «Docencia»; id
>   `docente`; Cama y Teoría ocultas con `hidden`), Simulador (en construcción),
>   Mis apuntes, Bibliografía recomendada. Al final del inicio, logo grande,
>   «Con la inestimable colaboración del Dr. Javier Urriza Mena» y la autoría (siempre, no
>   solo en la demo; nombre en el repo público por decisión del autor). Barra
>   superior: botón redondo de **colores** (oscuro → azul → claro) y **Guía**
>   junto al ⋮; en el ⋮ quedan Catálogos, EN y Ocultar ayudas.
> - **Aspecto (30-09)**: paleta **azul marino** por defecto (#0F141C,
>   tarjetas #18202C, acento #7AA7DA con texto oscuro encima); «oscuro» = negro y
>   dorado de antes (el dorado, solo ahí); claro con más contraste, acento azul
>   marino muy oscuro (#0F2A47) y cabeceras azul grisáceo (#CFD9E4) con texto
>   marino casi negro. Cabeceras de tarjeta y de apartado con fondo propio
>   (`--cab-bg`) y texto `--cab-texto` (casi blanco en azul). Plantillas de
>   montajes con cabecera centrada y teñida; «Plantilla seleccionada» con franja
>   gruesa de acento y sombra (fijo al hacer scroll).
> - **Idea rectora del usuario (28-09 noche):** lo que se recoge en quirófano se
>   apunta en el **Registro** y la ficha de Gestión de Casos lo refleja **en
>   espejo** (se escribe en cualquiera de los dos); **menos texto libre**, listas
>   cerradas con ids para poder sacar datos. Al cerrar un texto libre a lista, lo
>   escrito en los casos reales se migra en el repo privado y el texto original
>   se añade al final del Resumen de la monitorización («… (texto original): …»).
> - **Registro ↔ ficha (⇄)**: fecha, horas, nivel, procedimiento, **anestesia**
>   (tipo, TOF, detalle, incidencias) y **eventos An**, **basales**, **mapeo E2**
>   (GRID/cortical/subcortical/nervio en la ficha con `t: "mapeo_reg"`; raíces con
>   `pintarColumnaRaices()` en los dos sitios), **alarmas** (`pintarAlarmas()`:
>   modalidad, criterio, causa, medidas en chips, recup S/P/N; «Tipo de alerta» y
>   «Medida correctora» se derivan al guardar con `alarmasEnCaso()`), **técnicas
>   con alteración** (chips, como en la ficha; sin caso o sin técnicas, el aviso
>   de la ficha), **resultado esperable** (lista) e incidencias técnicas (la perla
>   docente, desde el 30-09, solo en la ficha y en la hoja impresa). La ficha
>   trabaja sobre la copia de trabajo (`guardar` = `REG_SIN_GUARDAR`) y guarda con
>   «Guardar»; el Registro guarda solo (`REG_GUARDAR`). Sin caso (Modelo 0) no hay
>   espejo.
> - **Retoques del 29-09 (tarde)**: desplegables que ya no se abren al hacer
>   scroll sobre ellos; recuadros de texto que crecen solos; sin texto dentro de
>   las casillas del Mapeo; raíces y tornillos con la columna vertebral también
>   en Modelo 0 (`d.raices`; la tabla `e_t_*` solo si ya tenía datos);
>   **CoMEP** (antes «MEP córtico-bulbares»/«CoBu»; solo rótulos, ids iguales);
>   reflejos con nombre corto y ayuda al mantener pulsado; ficha con la barra en
>   una fila (Informe y Hoja de registro en el ⋮, «Volver») y fondo algo más
>   claro con línea dorada; alarmas con medidas «Aviso al cirujano/anestesista»
>   y «Reposicionar…», recuperación «recupera / en parte / no recupera»,
>   rótulos, «Ahora» y duración (`pintarMedidasRecup()`).
> - **Correlación de cada alarma** (29-09-2026): en Resultado, una fila por grupo
>   de alarmas (misma técnica + mismo criterio = mismo sustrato; varias HFD de un
>   músculo a distintas horas son una fila) con evolución y momento en listas
>   cerradas y la concordancia del grupo (con su recuperación S/P/N). Guardado en
>   `correlato_alarmas` por clave de grupo. Al guardar, `alarmasEnCaso()` deja
>   las filas ya resueltas en `correlato_filas` (ids), que es lo que lee el Sheet
>   (pestaña **Correlacion_long**, `construirCorrelacionLong_()` en `Codigo.gs`:
>   la lógica NO se repite allí). Sale también en el informe PDF
>   (`seccionCorrelatoInforme()`), en el CSV de eventos y alarmas (4 columnas al
>   final) y en la propuesta de concordancia del caso (`concordanciaDeGrupos()`:
>   VP > ¿VP? > FP > PR > ¿PR?).
> - **Ficha del caso**: apartados Identificación, Paciente, Cirugía, Anestesia,
>   **Montaje / Material** (sin sub-desplegables), **Técnicas** (apartado propio),
>   Desarrollo, Resultado, Docencia. Resultado: **evolución** en lista
>   (`evolucion_postop`) + detalle, y **propuesta de concordancia**
>   (`propuestaConcordancia()`) con botón Aplicar. Fuera «¿Hubo cambios respecto
>   al plan?». Caso destacado y Hacer seguimiento en la misma fila (`par`).
>   **Se guarda sola** ~1,5 s tras cada cambio (`autoguardarFicha()`: guarda una
>   COPIA de `casoAbierto`, porque los controles y las tablas espejo siguen
>   enlazados a él); «Guardar» queda como confirmación. Se para y avisa si falta
>   la fecha o si el caso cambió fuera (`casoCambiadoFuera()`). **Cerrar caso /
>   Reabrir caso** en la barra (`guardarFicha(true)`, `pintarBotonCerrarCaso()`).
>   Ojo: `leerFichaCaso()` copia el formulario sobre `casoAbierto`; no llamarlo
>   después de guardar sin repintar (ya pasó: «Reabrir» se deshacía).
>   Desde el 30-09: **campos cortos en una fila** (`fila` en `CAMPOS_CASO` →
>   `.campos-fila`): Equipo+Estado, Hora inicio+fin, Edad+Sexo+Servicio,
>   Posición+Navegación (el detalle debajo), Mi papel+Supervisor+Dificultad; ⋮
>   con **Abrir en el Registro** (`#caso-ir-registro`), Informe (PDF),
>   **Imprimir hoja de registro** y Borrar; **Borrador desde el Registro** bajo
>   el Resumen de la monitorización (`borradorResumenCaso()`: cronograma +
>   comparativa de basales); al **cerrar**, aviso de lo que falta (diagnóstico,
>   intervención, resumen, evolución, concordancia) sin impedirlo; diagnósticos
>   nuevos tiroides, disrafismo, nervio_periferico y otro.
> - **Robustez de datos (auditoría 28-29/09):** conflicto al subir un caso →
>   `fusionarCaso()` (vacío toma del otro, gana el que sube, listas con id se
>   juntan, `editado_en` unido); «Exportar copia» es completa (`completa: {casos,
>   montajes, apuntes}`) e «Importar» solo añade lo que falta
>   (`importarCopiaCompleta()`); «Cómo se realizó cada técnica» guarda **ids**
>   (`"ids"` junto a cada `"opciones"` en `parametros-tecnicas.js`, NUNCA cambiar
>   un id usado; `tecParIdDe()`/`tecParTextoDe()`); una alarma sin nada escrito
>   no cuenta (`alarmaEscrita()`) y lo derivado se deshace al quitarlas; el
>   Registro y el autoguardado sellan `editado_en` como mucho cada 30 min; las
>   fotos no se reescriben en IndexedDB (`fotosYaEnIDB`). «Vaciar» del Registro y
>   del Checklist, solo en Modelo 0. «Pasar al caso» retirado.
> - **Nombres:** «Plantilla» = lo guardado en la biblioteca (Guardar/Cargar
>   plantilla, + Plantilla en blanco); «Montaje» = cómo quedan las cajas (Editar
>   montaje del caso, Organizador de Montajes); «Técnica · lado» (no
>   «Modalidad»); «Informe (PDF)» / «Informe de casos (PDF)».
> - **Basales**: columnas **Basal · PostPos1 · PostPos2 · Cierre** (antes OP BSL
>   y CL BSL; ids `basal`, `post`, `post2`, `final`); PostPos2 solo t-SEP/t-MEP,
>   c-MEP solo Basal y Cierre (`regColBasal()`). Desde el 30-09, **dos medidas
>   por fase** con la unidad en el encabezado, según las guías (ASNM 2013, ISIN
>   2019): sensitivos Amp (µV) + Lat (ms), motores Amp (mV desde el 30-09; onda D en µV, `REG_BASALES_UNIDAD_FILA`) + Umbral (mA/V);
>   claves `e_<fila>_<fase>_amp/_lat/_umb` (`REG_BASALES_MEDIDAS`,
>   `regBasalValor()` lee también la casilla antigua «a/b», `regBasalMigrar()`
>   la parte al escribir, `regBasalTexto()` para hoja e informe). En pantalla
>   (Registro y ficha) ya no es una rejilla: **lista por técnica**
>   (`pintarBloqueBasales()`), una línea con los valores y el % por medida
>   (`regComparacionFila()`, «amp / lat / umb»); al tocarla, casillas grandes
>   por fase y **«= Basal»** en PostPos y Cierre; las filas libres, las usadas
>   y una «+ Otro»; abiertas en `regBasalAbiertas` (sesión).
>   Título en la ficha: «Basales (Basal, Post posicionar y Cierre)». **Umbrales por raíz** en columna
>   vertebral: niveles en orden anatómico unidos por una línea (discontinua si no
>   son contiguos).
> - **Hoja impresa**: B · Técnicas en tres filas (monitorización, reflejos,
>   mapeo) con las del caso marcadas; alarmas y resultado esperable con rótulos.
>   Tiene que caber en A4 (hoja 1 ≈1000-1045 px de ≈1077).
> - **Tamaños**: casillas ≈30 px y 0,8rem en todo el Registro, la ficha y Mis
>   apuntes (le ganan al `min-height: 44px` táctil); basales pequeñas; botones con
>   tamaño táctil.
> - **Material**: «Estimulación trigeminal» (V1-V3 + N.Maset, id `l_rx_maset`);
>   fuera la categoría «Reflejos» (eran técnicas). Serrato anterior C5-C7 en
>   miotomas. 20 categorías en orden lógico; `SERIES_MATERIAL` agrupa L./R.
> - **Registro en pantalla** (30-09-2026; **diseño B desde el 04-10**, ver «Lo
>   último»: el panel ya no está arriba, es la hoja que abre la barra de abajo;
>   sus botones son los de aquí): Cronograma + Basales y comparativa + Mapeo +
>   Cierre, sin la letra de la hoja
>   (A, B y C están en Gestión de Casos; D, esquema, F, G y H tampoco salen; la
>   hoja impresa sale entera). Cierre sin «Resultado de la señal» ni perla
>   docente. Selector de caso con los de **hoy** primero («· hoy»). Fases,
>   eventos y alarmas se apuntan SOLO en la hoja de apuntar (`regHoja`). Dentro:
>   - **Fase**: un toque; caja = detalle u «Otra».
>   - **Evento o alarma** (recuadro resaltado en dorado apagado) con dos
>     recuadros: **Técnica** (antes «Qué»): t-SEP / t-MEP / c-SEP en tabla por
>     miembro (MSD · MSI · MID · MII) y, con CoMEP, los pares craneales en la
>     misma tabla (`REG_PARES_COMEP`, botoncitos I/D → «CoMEP VII I»); el resto de
>     técnicas; **Reflejos** del caso con nombre corto. Las técnicas se marcan
>     **varias a la vez** (bilateral, hemicorporal, brazo-pierna-cara, cruzado:
>     `regElegirQue()`, `regRapido.queMas`, `regQuesElegidos()`) y se apuntan
>     como UNA alarma o evento con la modalidad «A + B»; al apuntar un cambio o
>     una alarma, su técnica se marca sola en Técnicas con alteración
>     (`regTecnicasDeQue()`). Factores técnicos + Otro
>     en una fila; **Anestesia + TOF 0/4…4/4** en otra (TOF = contexto:
>     `ev.tof`/`al.tof`, `data-clave="tof"`, se desmarca al apuntar); con
>     Anestesia, fila **Fármaco** (`REG_FARMACOS` → `ev.farmaco`). **Hallazgo**
>     (antes «Qué pasa»): ↑ umbral, ↓ amplitud, ↑ latencia, pérdida, HFD, Otro (sin
>     botones de recuperación: se marca en la alarma), con «Cuánto respecto a la
>     basal (%)» en ↑ umbral, ↓ amplitud, ↑ latencia y ↓ onda D
>     (`REG_CAMBIOS_MAGNITUD` → `ev/al.magnitud`, `regConMagnitud()`; en ficha,
>     hoja, cronograma, CSV `magnitud_pct` y Sheet `Magnitud_pct`), y debajo las **propias de la
>     técnica elegida** (`mod` en `REG_CAMBIOS_RAPIDOS`, mismos ids en
>     `REG_CRITERIO_AL`, `regModalidadDeQue()`, `actualizarCambiosPropios()`,
>     `miembro` sup/inf: N13/N20 o N22/P37; ayuda al mantener pulsado); con GRID
>     solo sus eventos (colocación, phase reversal, se mueve, retirada) y con
>     Anestesia solo ↑/↓ perfusión, bolo, inicio, detención
>     (`REG_MODS_SIN_GENERAL`) → An «Propofol · Bolo». Luego **contexto
>     quirúrgico** opcional (`ev.contexto`) y Apuntar evento / alarma (al pie de
>     la hoja; la ayuda larga y el «↓» se quitaron el 04-10). Un evento
>     puede ser solo contexto y/o TOF (solo TOF → An «TOF 1/4»); la alarma
>     necesita técnica.
>   - **Cronograma de eventos** (antes «Apuntado»): una línea por evento desde
>     el 04-10, por hora, de lo más antiguo a lo más reciente, con franja de
>     color por gravedad
>     (`regTipoApuntado()`: alarma = rojo, cambio sin alarma o factor técnico =
>     naranja, fase o recuperación = verde, resto = azul; la etiqueta FASE /
>     ALARMA… va solo en el `title`), «n eventos» bajo el título y filtros Todos / Críticos / Cambios /
>     Info/Normal. Hora editable; ✎ (solo el lápiz) corrige la línea y su
>     alarma; cada alarma con su detalle **plegado** y resumen.
>     El cronograma entero es un `<details class="rr-crono">` plegable, con
>     cabecera de título (▸, mayúsculas); su estado (`regCronoAbierto`) se
>     conserva al volver a pintar y entre sesiones (`mio_ionm_crono_plegado`).
>   - La impresa no cambia con lo de pantalla (salvo la fase de F, que lleva
>     « · contexto»).
> - **Gestión de Casos**: borde izquierdo y bolita del color del estado («A
>   planificar», Preparado, Cerrado, Cancelado); a la vista solo «▸ Filtros (n)»
>   y «Ordenar por»; el panel plegable tiene Estado, **Especialidad**,
>   **Diagnóstico** (04-10), Concordancia, Equipo, (Centro, si hay centros), Desde, Hasta, Destacados y
>   Seguimiento; los filtros puestos salen como chips con ✕. Los mismos filtros
>   valen para el informe y los CSV. Desde el 04-10: cada fila lleva sus
>   **técnicas hechas** con el color de su familia (`nodoEtiquetasTecnicas()`,
>   compartida con las plantillas); **Papelera** de casos (30 días, por
>   dispositivo; Borrar ya no pierde nada); la **ficha a pantalla completa**
>   (sigue siendo el `<dialog>`; tapa la barra superior mientras está abierta).
> - **Organizador en dos pantallas** (04-10-2026): lista de plantillas como Gestión de Casos («Crear plantilla», filtros, filas) y, al tocar una, su pantalla de edición (se vuelve con «Plantillas» en la ruta del título; el botón «← Todas las plantillas» se quitó el 04-10 por repetido). Casilla en cada fila para **marcar varias** y aplicarles «Más acciones» (Duplicar, Vaciar, Borrar; Renombrar con una). **Plantillas de montajes**: una debajo de otra (una columna, 03-10-2026); lista entera sin scroll propio; filas con aspecto
>   de caso (`nodoFilaPlantilla()`); ★ **favoritas** (se quedan en su sitio desde el 04-10; casilla «Solo
>   favoritas»; por dispositivo y perfil, no se sincronizan).
> - **Tres equipos** (Inomed/Cadwell/**Genérico**, este para cualquier otra
>   marca, activo desde el 04-10): `equipo_id`; **no confundir con `equipo`**.
> - **Técnicas IONM, privada**: contenido en el repo privado
>   (`referencia/tecnicas-mio.json`), se baja con el token. **No volver a meterlo
>   aquí.** Fuentes agrupadas por obra y paleta propia `--tm-*` (no la de
>   familias del resto de la app, por decisión del usuario).
> - **Modo demo** `?demo`: datos ficticios aislados; precios INVENTADOS
>   (`PRECIOS_DEMO`, `preciosDemo()`) para enseñar el coste; visita guiada de 12
>   pasos. Plantillas y casos «Demo · Inomed · …» y «Demo · Cadwell · …» (3 de
>   Cadwell: espasmo hemifacial con LSR/BR/PEATC, tiroidectomía con NLR, médula
>   anclada con RBC y H-reflex). Plantillas Inomed con el **conmutador** en la
>   columna anodal (los sacacorchos de estimulación van siempre por él; en la
>   catodal, solo referencias). Los cinco casos ya operados (artrodesis,
>   ependimoma, neurinoma, espasmo hemifacial, tiroidectomía) llevan un
>   **registro completo como si fueran reales**: fases, eventos, anestesia, TOF,
>   factores técnicos, cambios sin alarma, alarmas con causa, medidas,
>   recuperación y magnitud, basales en lista y correlación de cada alarma;
>   se siembran con `registroDemo(v, lineas)` dentro de `sembrarDemo()`
>   (una línea por apunte, como en el panel). Etiqueta **«Ficticio»** junto a cada caso y
>   plantilla y aviso en la ficha: no son montajes de referencia. Sin el aviso de
>   texto en la cabecera. `localStorage` a secas, nunca `window.localStorage`.
> - **Dónde vive cada dato:** localStorage (texto) · IndexedDB (fotos) · repo
>   privado `checklist-mio-datos` (`estado.json`, `casos/`, `montajes/`,
>   `apuntes/` + `apuntes/fotos/`, `simulador/`, `referencia/`). Precios reales y
>   material propio del usuario: `estado.json` (nunca en este repo).
> - **Sheet**: `Codigo.gs` con la columna `evolucion_postop` (54 columnas base)
>   y la pestaña **Correlacion_long** (una fila por grupo de alarmas), con `Magnitud_pct`, repegado y
>   reconstruido por el usuario el 30-09. Los campos de lista llegan como id. Si
>   vuelve a cambiar, darle el ARCHIVO ENTERO (adjunto o enlace raw de GitHub):
>   no sabe insertar bloques sueltos.
> - **Historial público reescrito** dos veces (27 y 28-09): copias
>   `../copia-historial-codigo-2026-09-27.bundle` y `-28.bundle`. No borrarlas.
> - **Licencia**: todos los derechos reservados (`LICENSE`).
> - **Prueba con tres usuarios (30-09-2026)**: recorrido de la demo como experto,
>   residente y escéptico (informe en el diario privado); lo corregible está
>   hecho (ver Registro, Basales, Ficha y Demo arriba), más medidas de columna
>   («Retirar o recolocar tornillo / implante», «Reducir la corrección o la
>   distracción»), hoja impresa sin «hora del equipo» (la hora, sin decir de qué
>   reloj) y siglas en la Guía. Organizador: el nombre del chip va en
>   `.chip-nombre` (`crearChip()`); en una entrada estrecha (tres cajas en
>   fila) el chip colocado es de bloque, se parte por los espacios y la ✕ y el
>   📷 quedan al final de la última línea, sin salirse.
> - **Estudio multicéntrico (03-10-2026, preparado, no en marcha)**: dos hospitales, 0-2 cirugías/día cada uno, unos meses, para el congreso nacional. Decidido: **opción B** (una cuenta de GitHub por hospital; el administrador configura cada dispositivo), **plantillas comunes**, los casos actuales del usuario **no entran**. **Bloque 1 hecho**: catálogo Centros (código delante del número de caso, por centro y año; los números antiguos sin centro no cambian), centro del dispositivo, filtro Centro, usuarios por centro, aviso al cerrar si falta el centro, diálogo de la nube en lenguaje llano («Guardar en la nube» / «Traer de la nube»; con choque, «Quedarme con lo de este dispositivo / de la nube»), aviso de privacidad en Antecedentes. Sin centros dados de alta todo se ve como antes. **Pendiente (bloque 2, cuando el DPD y el CEIm digan dónde alojar)**: repositorio común aparte del personal (la app conectada a dos sitios), `estado.json` por centro, «código de configuración» en un paso (nunca en un enlace), organización de GitHub si se queda allí, Mis apuntes fuera del común (hoy un solo `apuntes/documento.json`), `centro_id` en el CSV y el Sheet; **bloque 3**: guía de una página para médicos y guía de administrador. Alojamiento: plataforma institucional (REDCap) > servidor UE (Forgejo/Gitea) > GitHub; lo decide el DPD.
> - **Preguntas abiertas del usuario (30-09-2026)**: dónde guardar los datos de
>   un usuario normal (hoy, repo privado de GitHub con token; no revisado por
>   protección de datos ni informática; no es aplicación sanitaria: solo recoge
>   datos); cómo compartir casos dentro del servicio y entre hospitales
>   (multicéntrico); más equipos (Natus, Nihon Kohden); quién la mantiene.
> - **Pendiente del usuario (04-10, última hora):** probar en el móvil el ✎ del
>   Registro (hoja de corregir y el selector Evento | Alarma), los colores del
>   Mapeo, la selección de varias plantillas y el modo claro con el gris nuevo.
> - **Pendiente del usuario (04-10, noche):** recargar la app; probar en el
>   móvil y en quirófano el **Registro con diseño B** (¿choca la barra de abajo
>   con los gestos del teléfono?, ¿echa de menos la etiqueta FASE/ALARMA en cada
>   línea?), la letra más grande, los reflejos por apartados y PEATC en
>   amarillo; decidir el **MAV**, el punto 7 (nube) y el bloque 4 de la
>   revisión de textos cuando quiera.
> - **Pendiente del usuario (04-10, mañana):** probar el Organizador en dos
>   pantallas (lista ↔ edición, «Plantillas ›», atrás del móvil), los colores por
>   familia, «Ordenar por», la Papelera y la ficha a pantalla completa en el
>   móvil y el portátil; marcar en Catálogos > Centros su centro solo cuando
>   retome el estudio multicéntrico (aparcado; antes, preguntar en su hospital si
>   tienen REDCap).
> - **Pendiente del usuario:** recargar la app en todos los dispositivos; probar
>   en el móvil de verdad el scroll sobre desplegables y el toque largo de los
>   reflejos (solo probados con toques simulados); decir la abreviatura del
>   «Reflejo glosofaríngeo-trigeminal» si la hay; rellenar la correlación de cada
>   alarma en sus casos para que entren en Correlacion_long; revisar en sus casos
>   las evoluciones «déficit nuevo, evolución pendiente» y la ECL L3-S1
>   (resultado esperable «similar»); probar en quirófano el Registro nuevo;
>   probar con dos dispositivos a la vez sobre el mismo caso (fusión y aviso) y
>   el gesto de atrás de Android con la ficha abierta; «Restablecer demo» para
>   ver los casos de Cadwell y los nombres con «Inomed ·»; ver en el móvil los
>   tres modos de color y el Registro reducido en quirófano; marcar sus
>   plantillas favoritas en cada dispositivo; «Restablecer demo» para ver las
>   basales numéricas y el conmutador de Inomed; probar en quirófano las
>   alarmas con varias técnicas, la magnitud % y las basales en dos columnas;
>   si quiere la magnitud de alarmas antiguas en el Sheet, ponerla en la ficha
>   y volver a guardar el caso.
> - **Ideas pendientes, no construidas:** convertir la ficha del caso en una
>   pantalla de verdad (hoy `<dialog>` a pantalla completa: la barra superior
>   queda tapada); exportación compatible con REDCap (diccionario de datos + CSV)
>   si el estudio multicéntrico se retoma; **sacar los datos sin vulnerar la
>   privacidad** (aparcado el 04-10-2026; lo guardado es seudonimizado, no
>   anónimo): «Exportar para enviar» anonimizado en el dispositivo (edad en
>   tramos, mes/año, minutos desde el inicio, sin texto libre, imágenes ni número
>   de caso) + cifrado en el navegador (Web Crypto, AES-GCM con contraseña) para
>   mandarlo al correo institucional; destino institucional (REDCap, Microsoft
>   365) cuando decida el DPD; detalle en el diario privado; que la demo enseñe más utilidades;
>   conversión Inomed ↔ Cadwell; eventos del Registro en el Sheet (las alarmas
>   ya van por grupos en Correlacion_long); que la concordancia del caso proponga
>   FN si hay déficit sin alarma relacionada; bloque "Cirugías con IONM"; Teoría
>   básica; convertir en listas más textos libres de la ficha si el usuario lo
>   pide; **contenido de la Biblioteca de montajes** (montajes de ejemplo por
>   especialidad y equipo, copiables como plantilla); favoritas sincronizadas
>   entre dispositivos si el usuario lo pide; aviso en el Resumen si en Inomed
>   hay un sacacorchos de estimulación en la catodal; antes del congreso,
>   ocultar o terminar en la demo las pantallas «En construcción»; cronometrar
>   en vivo «caso cerrado en menos de 3 minutos»; unificar la paleta de Técnicas
>   IONM con las familias del resto si el usuario lo pide; cajas reales de otras
>   marcas (Natus, Nihon Kohden) si alguien pasa cómo son.
> - **Convenciones que han fallado antes:** subir el `?v=` de `index.html` en cada
>   cambio de `app.js`/`style.css`/`data/`; `git fetch`+`pull --ff-only` antes de
>   tocar `checklist-mio-datos` (y otro `fetch` antes del push); con
>   `core.autocrlf=true` la copia de trabajo suele ir en **CRLF** (en git, LF) y
>   `data/i18n-en.js` tiene saltos mixtos: detectar el salto, normalizar, editar y
>   restaurarlo; los scripts de Python largos, en un archivo del scratchpad y no
>   en un heredoc de bash (los `\n` y `\d` de las cadenas JS llegaban rotos);
>   en los scripts de Node con plantillas `...`, un `\n` dentro de una cadena
>   JS a insertar se vuelve un salto real y rompe app.js: escribirlo como
>   `String.fromCharCode(92) + "n"` o con `JSON.stringify`; y nada de
>   `node -e "..."` con escapes dentro de comillas dobles de bash;
>   en el texto a buscar de esos scripts va el carácter real (−, ·, µ), no su
>   escape `\uXXXX`, o no coincide;
>   ES5 (`var`, sin flechas); `[hidden]` sobre clases con `display` propio
>   necesita su regla; `#pantalla-registro button` y `#dlg-caso select
>   { min-height: 44px }` ganan por el id (excepciones con el id delante); un
>   `::after` del padre se pinta sobre los hijos (`z-index` en el hijo); la hoja
>   impresa del Registro tiene que caber en A4; un campo nuevo del caso que no
>   sea texto (objeto) va en `CAMPOS_APARTE` del informe o sale «[object
>   Object]»; `preventDefault` en `touchstart` impide el scroll (usar
>   `touchend` y comprobar que el dedo no se movió); en un heredoc de bash, un
>   apóstrofo dentro de un `r'''…'''` de Python rompe el comando; los colores
>   fijos pensados para el negro (#232323…) se ven marrones en el azul: dar
>   valores propios a `:root.tema-oscuro` y a `:root:not(.tema-claro)`;
>   `--header-h` ya lo mide app.js, no fijarlo a mano.
> - **Comprobación habitual:** `node --check app.js`, servidor `checklist` de
>   `.claude/launch.json` (no `file://`), probar en el navegador con `?demo`
>   (a 375 px para el móvil), commit y push (permiso permanente). Para medir la
>   hoja impresa: sustituir `window.open` por un `<iframe>` de 794 px de ancho.
> - **"Actualiza todo"**: poner al día este resumen, el mapa del código,
>   README.md, `data/guia.js` si cambió el flujo, AGENTS.md, el diario privado y
>   la memoria de Claude, y subirlo todo.

## Auditoría periódica (privada)

La herramienta se reaudita cada poco tiempo (clínico → funcional → técnico →
estético). El informe vivo, con su tabla de seguimiento de cada hallazgo, está en
el repositorio privado: `../checklist-mio-datos/docs/AUDITORIA.md`, y el encargo
para repetirla en `../checklist-mio-datos/docs/PROMPT-AUDITORIA.md`. Antes de un
bloque de mejoras, mira qué está pendiente allí; al arreglar un hallazgo, marca su
fila como hecha.

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
