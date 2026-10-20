# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público del código y repo privado de datos en la carpeta hermana; no se nombran hospitales, personas ni repos de datos aquí).
- Fase: **piloto multihospital, configuración real. Paso 5 (Sheet del hospital propio) hecho y probado; falta compartirlo.** El código está cerrado y subido, nada a medias. Versión `?v=20261020v` (seis etiquetas de `index.html`; también sale en ⋮ → «v20261020v»). Docs al día (`CLAUDE.md`, `README.md`, `data/guia.js`, diario privado, memoria).
- Lo que NO está hecho es lo externo: compartir el Sheet, Sheet y espacio del otro hospital (lo hace su médico), consulta de protección de datos. **No recoger pacientes reales hasta cerrarlo.**
- Contexto: memoria `project_piloto_hospitales`, diario privado (`docs/DIARIO-CODIGO.md`), guía `docs/SHEETS-POR-HOSPITAL-2026-10-19.md` y guía del otro hospital (ambas en el repo privado).

## 2. Hecho en esta sesión (20/10/2026)

- **Paso 5 con el usuario (fuera del código):** segundo token fine-grained de solo lectura (solo el repo de datos del hospital propio, sin caducidad), copia del Sheet, `Codigo.gs` entero, propiedades `REPO_DATOS`/`GITHUB_TOKEN`/`REPO_CODIGO`, `appsscript.json` con `oauthScopes` acotados, activador diario. Primer fallo: el repo del código estaba privado y el script no lo leía → **vuelto a público**. Sheet viejo congelado (activador eliminado). Probado con un caso real: fila correcta; caso de prueba borrado.
- `apps-script/Codigo.gs`: fuera el bloque «Intervenciones» de `Listas`; columna `duracion_min` tras `min_fin` (57 base + 2 por técnica = 145 con 44 técnicas; usa `c.duracion_min` y, si falta, fin − inicio); columnas de minutos con formato número (`columnasNumero`, también en `Correlacion_long`).
- `app.js`/`index.html`: fuera «Exportar copia», «Importar copia» e «Imprimir» de Catálogos (y `importarCopiaCompleta()`); hora inicio/fin de la ficha con hora real sin depender del Registro (`tInputHoraCaso()`, `tDuracionCaso()`, `duracion_min` también en el CSV de casos); puerta de usuario obligatoria (`#dlg-quien-eres`, `actualizarPuertaUsuario()`, `crearUsuarioDesdeAqui()`); `creado_por`/`editado_por` en casos y `editado_por` en plantillas, visibles en ficha, Registro (`#registro-autoria`) y lista de plantillas (`textoAutoriaCaso()`, `fechaMontaje()`); ayudas ocultas por defecto; nota «mejor con ordenador» del Simulador (`tile_simulador_sub`, `sim_girar`).
- `style.css`: rótulo del espacio activo como pastilla (`.sync-espacio`, con ajuste para el modo claro).
- `CLAUDE.md`, `README.md`, `data/guia.js`: actualizados; diario privado y memoria al día.

## 3. Siguiente paso exacto

Preguntar al usuario si ya compartió el Sheet nuevo. Si no, guiarle de uno en uno: botón **Compartir** → acceso general **Restringido** → añadir solo a la gente del hospital propio como **Lector** (ningún Editor: un editor ve el script, que guarda el token) → en el engranaje, desactivar «los editores pueden cambiar permisos» y «los lectores pueden descargar, imprimir y copiar». Después, la lista C de `docs/SHEETS-POR-HOSPITAL-2026-10-19.md` ya está comprobada salvo `Tecnicas_long` y `Material_long` (mirar que solo tengan encabezados o las filas del caso real).

## 4. Decisiones abiertas (esperan al usuario)

- **Compartir el Sheet** y con quién (lectores concretos).
- **Protección de datos:** consulta al delegado de cada hospital ANTES de pacientes reales (no es decisión técnica).
- **Intervenciones/perfiles:** retirarlas del todo (datos, `DATA`, textos, traducciones) está **aparcado** (opción B); hoy solo salen del Sheet y están ocultas de Catálogos. Riesgo: los 29 casos antiguos guardan `intervencion_id`.
- **Columnas `creado_por`/`editado_por` en el Sheet:** no se han pedido; es un cambio pequeño en `Codigo.gs` si se quieren.
- **Registro:** «Hora inicio MIO»/«Fin MIO» del Registro sigue pidiendo minutos sin incisión y no recalcula `duracion_min`; ¿alinearlo con la ficha?
- **Sheet viejo (29 casos):** congelado sin activador; falta decidir si se le pone `CONGELADO = 1`.
- **Espacio de más (equipo Inomed, vacío):** ¿se puede borrar desde la app? No se sabe.
- Casos 002 y 004 sin intervención y 025 con 13,2 h: confirmar o corregir; números 001/026/031/032 ausentes.
- Pendientes de interfaz, sin pedir aún: código de configuración de un paso (o QR); renombrar espacios; acceso directo a «Archivo»; campos propios de CCEP en el Mapeo.
- Ideas 1 (eventos y alarmas en el Sheet) y 2 (rastro de quién hace qué: ya hecho en la app, falta en el Sheet) sin respuesta. Parados: C22, MAV, nube punto 7, bloque 4 de textos, tiendas de apps, Biblioteca de casos compartidos.

## 5. Restricciones activas

- **Aislamiento entre hospitales**: toda clave nueva de `localStorage` se prefija por defecto; solo va a `CLAVES_GLOBALES` si es preferencia de dispositivo. Nunca `window.localStorage` directo. Lo exacto (fecha, edad, personal, `t0`, horas reales de inicio/fin) vive solo en tablas locales y no entra en `estado.json`, `casos/`, montajes ni en el Sheet. Nunca el token de un hospital en el Sheet de otro; un repo de datos distinto por hospital.
- **Repo del código PÚBLICO** (el Apps Script lo lee sin token; si se vuelve a privado, el Sheet falla con «No se encuentra data/surgeries.js»). Sin precios, números de caso reales, nombres de personas (ni apodos), nombres de hospitales ni de repos de datos, tampoco en este archivo ni en `Codigo.gs`.
- **Casos esquema 1 (los 29 antiguos) congelados**: se leen igual; no se reescriben ni se migran; `creado_por`/`editado_por` solo se sellan en esquema 2. «Archivo» en solo lectura. El Sheet viejo no recibe el `Codigo.gs` nuevo.
- La hora de inicio de la ficha es la ENTRADA en quirófano, no la incisión; `duracion_min` se calcula de las dos horas escritas, sin t0. La puerta de usuario no aplica a la demo ni a solo lectura; no es seguridad.
- Los ids no cambian nunca; GRID: umbrales en Basales, mapeo en Mapeo; candado de casos cerrados; hoja impresa 1 ≤ ≈1045 px.
- Botones rectangulares, casillas ≈30 px, sin foco automático en el móvil, radios `var(--r)`. ES5 (`var`, sin flechas). Textos con `T()` y su `en`. DOM con `createElement`.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`. Archivos de trabajo en LF (README.md y `data/guia.js` están en CRLF: al editarlos con scripts, respetar el salto). Scripts largos en un archivo del scratchpad, no en heredoc de bash; en un heredoc, `\r\n` se vuelve real.
- Repo privado: `git fetch` + `pull --ff-only` antes de tocarlo. El PDF de la guía del otro hospital queda sin commitear a propósito.
- Pedido del usuario: no cambiar nada que no pida; ante ambigüedad, una pregunta antes de actuar. Explicar poco a poco, paso a paso, sin jerga de GitHub. Responder siempre en castellano. Móvil: tras publicar, borrar solo la **caché**.
- Sesión principal: orquestar; delegar lo que toque 3+ archivos o lecturas grandes; revisar el diff y verificar antes de subir.

## 6. Verificación

1. `node --check app.js` y `node --check data/guia.js`; `Codigo.gs` se comprueba copiándolo a `.js` en el scratchpad y `node --check`.
2. Servidor `checklist` (preview_start) en `http://localhost:8099/?demo`: seis etiquetas con `?v=20261020v`; ⋮ muestra «v20261020v» y «Mostrar ayudas» (ayudas ocultas); consola sin errores propios (los 401 de tokens falsos no cuentan).
3. Sin `?demo` (localhost, almacén vacío): sale «¿Quién eres?» que Esc no cierra; «+ Crear mi usuario» (con `prompt` sustituido) la cierra. Un caso nuevo guardado lleva `creado_por`/`editado_por` y la ficha enseña «Creado por X · … · Última modificación por X».
4. Ficha de un caso nuevo (demo): hora de inicio 08:00 y fin 15:00 dan `hora_inicio_min` 0, `hora_fin_min` 420 y `duracion_min` 420; 22:00 → 03:30 da 330.
5. Catálogos (⋮): sin Exportar/Importar copia ni Imprimir; solo Restablecer y las pestañas Técnicas, Servicios, Usuarios, Centros.
6. Sheet: **MIO-Check → Reconstruir ahora**; `Casos` con `duracion_min` y minutos como números; `Listas` solo Técnicas, Servicios y Centros; `Meta` sin avisos.
7. `git status -sb` limpio y `git rev-parse HEAD origin/main` iguales.
8. NO verificado nunca: GitHub real con dos dispositivos, conflicto 409, PDF impreso real, la puerta de usuario y la pastilla del espacio en el móvil real, el segundo hospital, escritorio, gestos táctiles, `Tecnicas_long`/`Material_long` con un caso con técnicas.
