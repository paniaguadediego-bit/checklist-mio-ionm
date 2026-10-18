# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público del código y repo privado de datos en la carpeta hermana; no se nombran aquí).
- Fase: **piloto multihospital: tandas 1-3 de espacios y seudonimización (fases 1-3) CONSTRUIDAS, revisadas y subidas.** Nada a medias en el código. Versión `?v=20261018h` (seis etiquetas de `index.html`). Último commit de código: `b2111e8`, igual que `origin/main`.
- Lo que NO está cerrado es lo externo: Sheets por hospital, consulta de protección de datos y prueba real de la nube (ver 3 y 4). **No recoger pacientes reales hasta cerrar eso.**
- Contexto del piloto, grupos y usuarios: memoria `project_piloto_hospitales` y diario privado (`docs/DIARIO-CODIGO.md`, repo privado). Plan y guion: `docs/AUDITORIA-ESPACIOS-SEUDONIMIZACION-2026-10-18.md` y `docs/SIMULACRO-USO-2026-10-18.md` (repo privado).

## 2. Hecho en esta sesión (18-19/10/2026)

- **Tanda 2 (espacios)**: selector en el diálogo ☁, repo inmutable por espacio (`repo_origen`), `espacio_id` en `estado.json` y en la copia, Mis apuntes globales. `app.js`, `index.html`, `style.css`.
- **Equipo por defecto por espacio** (`equipo_defecto`, `equipoNuevo()`, `#esp-equipo`).
- **Tanda 3 (solo lectura)**: casilla por espacio, `casoBloqueado()`, almacén que ignora escrituras, `fetch` solo GET, banner 🔒. El usuario ya marcó «archivo» como solo lectura en su navegador (la marca es por dispositivo: también hay que ponerla en el móvil).
- **Simulacro sin nube** con tres perfiles y datos ficticios: sin bloqueantes. Ronda de correcciones: importar copia de otro espacio solo añade casos y plantillas (no pisa catálogos), nombre del origen, papelera en solo lectura, rótulo del espacio en la cabecera (solo con más de un espacio), «Sin autor», textos de apuntes, EN, etiqueta de pendiente sin repo, tarjeta de apuntes en carga en frío, `bajar()` no aplica un `estado.json` de otro espacio.
- **Seudonimización, fase 1**: `repoCompatible()` (guarda de red: bloquea subir/bajar contra el repo de otro espacio o si no se puede leer; falla cerrado) y tiempo en minutos desde la incisión (`*_min`, `tMin()`; `t0` solo local en `mio_ionm_t0_v1`, se fija al marcar la fase «Incisión»).
- **Fase 2**: caso esquema 2 (`seudonimizarCaso()`): mes, edad en tramo de 5, sin nombre de caso/personal/centro en texto/firma/quirófano, sellos en mes + `rev`, imágenes solo locales, tabla local `mio_ionm_exactos_v1`; detector no bloqueante de datos en textos libres; commits con uid. Auditoría de fuga por cadena sin hallazgos.
- **Fase 3**: `apps-script/Codigo.gs` reescrito entero (lee esquemas 1 y 2, convierte al volcar, `CONGELADO`); CSV de la app con las mismas 56 columnas que la hoja `Casos`.
- Archivos: `app.js`, `index.html`, `style.css`, `apps-script/Codigo.gs`, `CLAUDE.md` (fila «Seudonimización y tiempo» y «Espacios de trabajo»), este `HANDOFF.md`. Diario privado actualizado.

## 3. Siguiente paso exacto

**Sheet por hospital (lo que el usuario quiere mirar mañana).** Preparar, en el repo privado (`docs/`), un documento con la lista exacta de propiedades y comprobaciones por hospital, y guiar al usuario paso a paso:

1. Congelar el Sheet viejo (el de los 29 casos antiguos): NO pegar el `Codigo.gs` nuevo; borrar su activador diario; revocar su token cuando ya no haga falta; no archivar el repo de datos viejo todavía (copia en `../copia-datos-pamplona-2026-10-18.bundle`, no borrar).
2. Un Sheet nuevo por hospital (copia del Sheet): Extensiones → Apps Script, borrar todo, pegar `apps-script/Codigo.gs` entero; Propiedades del script: `REPO_DATOS` (repo privado de ese hospital), `GITHUB_TOKEN` fine-grained solo lectura (Contents: Read) sobre ese repo, `REPO_CODIGO` (obligatorio, ya sin valor por defecto); ejecutar `crearDisparadorDiario()` y «MIO-Check → Reconstruir ahora».
3. Comprobar en cada Sheet: `Casos` con 56 columnas, `Fecha` en `yyyy-mm`, `espacio_id` en `Meta`, ni nombres ni personal ni horas reales.

Nunca el token de un hospital en el Sheet de otro.

## 4. Decisiones abiertas (esperan al usuario)

- **Catálogo de usuarios**: los nombres reales de los médicos siguen en `estado.json` y en la copia. Propuesta: seudónimo por usuario («Usuario 1»…) con el nombre real solo en el dispositivo. Falta su visto bueno para construirlo.
- **Copia de seguridad**: la «Exportar copia» de un caso nuevo sale sin fecha exacta, personal ni fotos; esos datos solo existen en el dispositivo del autor. ¿Se acepta o se quiere una copia local cifrada aparte?
- **Protección de datos**: consulta al delegado de cada hospital ANTES de pacientes reales (no es decisión técnica).
- **Hacer privado el repo del código**: más adelante, sin prisa; el usuario tiene plan de pago (Pages funciona con privados). Al hacerlo: avisar a los médicos, comprobar el token del Apps Script y revisar README/CLAUDE.md (dicen «repo público»).
- **Idea 1** (eventos y alarmas: `Eventos_long` en el Sheet, retirar el CSV) e **idea 2** (rastro de quién hace qué: `creado_por`/`editado_por[]`): sin respuesta.
- Decisiones del subagente a validar: en solo lectura las bajadas no retiran en local lo que falte en remoto; las preferencias con clave prefijada (perfil, orden, último equipo) no persisten en solo lectura; `t0` se fija al marcar la fase «Incisión»; «Ahora» sin `t0` crea uno provisional.
- Parados: C22, MAV, nube punto 7, bloque 4 de textos, tiendas de apps, Biblioteca de casos compartidos.

## 5. Restricciones activas

- **Aislamiento entre hospitales**: toda clave nueva de `localStorage` se prefija por defecto; solo va a `CLAVES_GLOBALES` si es preferencia de dispositivo. Nunca `window.localStorage` directo. Lo exacto (fecha, edad, personal, `t0`) vive solo en tablas locales y no entra en `estado.json`, `casos/`, montajes ni «Exportar copia».
- **Casos esquema 1 (antiguos) congelados**: se leen igual; editar uno lo guarda con sus datos exactos. Por eso «archivo» va en solo lectura. No migrarlos.
- Los ids no cambian nunca; GRID: umbrales en Basales, mapeo en Mapeo; candado de casos cerrados; Técnicas IONM fuera de la demo; hoja impresa 1 ≤ ≈1045 px.
- Botones rectangulares, casillas ≈30 px, sin foco automático en el móvil, radios `var(--r)`. ES5 (`var`, sin flechas). Textos con `T()` y su `en` (en `app.js`). DOM con `createElement`.
- **Repo público: sin precios, números de caso reales, nombres de personas (ni apodos), nombres de hospitales ni de repos de datos.** Vale también para este archivo y para `Codigo.gs`.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`.
- Los archivos de trabajo están en LF (git los normaliza); mejor Edit que `sed -i`. Scripts de Python en el scratchpad y en un archivo, **nunca heredoc combinado con `< /dev/null`** (se cuelga; pasó dos veces).
- Repo privado: `git fetch` + `pull --ff-only` antes de tocarlo y `fetch` antes del push. Diario privado: una entrada por cambio.
- Seguro de datos: GitHub guarda la hora real de cada commit; esto es seudonimizar, no anonimizar.
- Sesión principal: orquestar; delegar a subagente lo que toque 3+ archivos o lecturas grandes; revisar el diff y verificar antes de subir.

## 6. Verificación

1. `node --check app.js`; `Codigo.gs` copiado a `.js` y `node --check`.
2. Servidor `checklist` (preview_start) en `http://localhost:8099/` y `?demo`, a 375 px: seis etiquetas con `?v=20261018h`, consola sin errores propios (los 401 de tokens falsos y los `beforeunload` de recargas por script no cuentan).
3. `git status -sb` limpio y `git rev-parse HEAD origin/main` iguales; `curl` de la web publicada debe dar `app.js?v=20261018h`.
4. Aislamiento: índice `mio_ionm_espacios_v1` con «archivo» (y los espacios que se creen); crear un espacio de prueba, cambiar y volver: datos del archivo intactos; limpiar todo al terminar (claves `mio_ionm_esp_*`, IDB `mio_ionm_fotos__*`).
5. Fuga: guardar un caso ficticio completo y buscar por cadena nombre, personal, fecha completa, edad exacta y hora real en lo que se subiría (`casos/`, `estado.json`, copia exportada): no debe aparecer ninguno.
6. NO verificado nunca: GitHub real (subida/bajada, dos dispositivos, conflicto 409), Apps Script real, PDF e impresión reales, inglés de avisos nuevos, escritorio, gestos táctiles.
