# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público del código y repo privado de datos en la carpeta hermana; no se nombran hospitales, personas ni repos de datos aquí).
- Fase: **piloto multihospital, configuración real. Pasos 1-4 del plan hechos; empieza el paso 5 (Sheet del hospital propio).** El código está cerrado y subido, nada a medias. Versión `?v=20261020o` (seis etiquetas de `index.html`; también sale en ⋮ → «v20261020o»). Último commit de código: `5e64f1d`, igual que `origin/main` (el commit del handoff va después).
- Lo que NO está hecho es lo externo: Sheet del hospital propio, centros y usuarios dados de alta, Sheet y espacio del otro hospital (lo hace su médico), consulta de protección de datos. **No recoger pacientes reales hasta cerrarlo.**
- Contexto: memoria `project_piloto_hospitales`, diario privado (`docs/DIARIO-CODIGO.md`), guía `docs/SHEETS-POR-HOSPITAL-2026-10-19.md` y guía del otro hospital `docs/GUIA-MEDICO-OTRO-HOSPITAL-2026-10-20.md` (+ `.pdf`), ambas en el repo privado.

## 2. Hecho en esta sesión (20/10/2026)

- **Pasos 1-3 del plan (con el usuario, fuera del código):** repo de datos nuevo privado + token; espacio del hospital propio creado y conectado (equipo por defecto Cadwell) en PC y móvil (el móvil con «Traer de la nube»); «Archivo» en solo lectura en PC y móvil. Quedó además un espacio extra con equipo Inomed creado por error (vacío, sin tocar).
- **Paso 4:** guía de una página para el médico del otro hospital, en Markdown y PDF (repo privado, `docs/`). Diario privado al día; sin commitear el PDF.
- **Diálogo ☁:** cada espacio en su caja, el activo resaltado (`style.css`, `.esp-fila`).
- **Técnica nueva** «Mapeo cortico-cortical (CCEP)», id `mapeo_cortico_cortical`, grupo mapeo, `corta` «CCEP» (`data/surgeries.js`, `data/i18n-en.js`). Solo dato; sin campos propios en el bloque Mapeo del Registro.
- **Catálogos rediseñado** (`index.html`, `app.js`, `style.css`): botón «+ X nuevo» arriba de la lista, lápiz ✎ por fila (el nombre también edita) y formulario en un panel aparte (`#cat-panel`, estado `catPanel`) con **Guardar** y **Cancelar**. Antes, tras guardar el formulario seguía en modo «editar» y el siguiente nombre sobrescribía el anterior. Claves `cat_nueva_usuarios`/`cat_editar_usuarios` añadidas (salían sin traducir). Fuera la pestaña y botón «Nueva».
- **Pestañas Intervenciones y Perfiles ocultas** en Catálogos (`renderCatPestanas()`); los datos y catálogos internos siguen.
- **Fuera «Material Qx»** (técnica desactivada y su fila en `material_tecnicas`; sin referencias en casos ni montajes).
- Versión `?v=` subida de `h` a `o`; todo en `origin/main`.

## 3. Siguiente paso exacto

**Paso 5, B1 con el usuario, de uno en uno:** el usuario crea en GitHub un **segundo token fine-grained de solo lectura** (`Contents: Read-only`, **solo** el repo de datos del hospital propio, caducidad la más larga razonable, anotar la fecha) para que el Apps Script lea ese repo. **Nunca el token en el chat.** Cuando lo tenga, seguir con **B2** de `docs/SHEETS-POR-HOSPITAL-2026-10-19.md`: copia del Sheet de plantilla, `Codigo.gs` ENTERO (de `apps-script/`), propiedades `REPO_DATOS`, `GITHUB_TOKEN`, `REPO_CODIGO` (obligatoria), `crearDisparadorDiario`, «Reconstruir ahora»; luego la lista C de comprobaciones.

Al empezar, **explicar al usuario (lo pidió) por qué hace falta un token aparte y de solo lectura**: el de la app escribe; el Sheet solo lee, y un Apps Script guarda su token en el propio Sheet, que se comparte con más gente, así que mínimo privilegio (solo lectura, solo ese repo) para que una fuga no permita cambiar ni borrar datos y para no mezclar hospitales.

## 4. Decisiones abiertas (esperan al usuario)

- **Sheet viejo (29 casos antiguos):** ¿congelarlo ya quitando su activador diario (A de la guía) o dejarlo como está? Se le preguntó; sin respuesta. Hoy se actualiza solo con su script viejo (no pegarle el `Codigo.gs` nuevo).
- **Centros y usuarios:** los dará de alta él en la app (⋮ → Catálogos, en el espacio del hospital propio): su centro con código corto y los usuarios de su hospital. Cada otro hospital crea los suyos en su espacio. Falta decidir **seudónimos (iniciales) o nombres reales** para los usuarios (propuesto, sin respuesta). Los nombres no van nunca al repo público.
- **Intervenciones/perfiles:** ya ocultos de Catálogos; falta decidir si algún día se retiran del todo (datos, `DATA`, textos) — no se ha hecho.
- **Espacio de más (equipo Inomed, vacío):** ¿se puede borrar desde la app? No se sabe; no se ha tocado.
- Casos 002 y 004 sin intervención y 025 con 13,2 h: confirmar o corregir; números 001/026/031/032 ausentes (¿papelera o borrados?).
- **Copia de seguridad:** la «Exportar copia» de un caso nuevo sale sin fecha exacta, personal ni fotos; ¿se acepta o copia local cifrada?
- **Protección de datos:** consulta al delegado de cada hospital ANTES de pacientes reales (no es decisión técnica).
- **Repo del código privado:** probado a medias; no se confirmó si GitHub Pages sigue sirviendo la web con el repo privado (desde fuera seguía dando 200, pero puede ser caché; falta comprobarlo en incógnito pasados unos minutos y en Settings → Pages). Si da 404, volver a público. Antes de dejarlo privado: avisar a médicos, revisar el token del Apps Script y los textos «repo público».
- **Pendientes de interfaz, sin pedir aún:** código de configuración de un paso (o QR) para dejar un dispositivo conectado sin teclear repo y token; renombrar espacios; acceso directo a «Archivo» sin pasar por Opciones avanzadas; campos propios de CCEP en el Mapeo del Registro.
- Ideas 1 (eventos y alarmas en el Sheet) y 2 (rastro de quién hace qué) sin respuesta. Decisiones del subagente a validar: bajadas en solo lectura no retiran en local lo que falte en remoto; preferencias prefijadas no persisten en solo lectura; `t0` se fija al marcar «Incisión»; «Ahora» sin `t0` crea uno provisional.
- Parados: C22, MAV, nube punto 7, bloque 4 de textos, tiendas de apps, Biblioteca de casos compartidos.

## 5. Restricciones activas

- **Aislamiento entre hospitales**: toda clave nueva de `localStorage` se prefija por defecto; solo va a `CLAVES_GLOBALES` si es preferencia de dispositivo. Nunca `window.localStorage` directo. Lo exacto (fecha, edad, personal, `t0`) vive solo en tablas locales y no entra en `estado.json`, `casos/`, montajes ni «Exportar copia». Nunca el token de un hospital en el Sheet de otro; un repo de datos distinto por hospital y el otro hospital sin acceso al del usuario.
- **Espacio «Archivo» ligado a su repo viejo**: no se puede cambiar de repo (protección correcta); en la ficha del espacio, el equipo por defecto de «Archivo» debe quedar en «El de la herramienta» (se tocó sin querer en el móvil; comprobar). Centros y usuarios viven en el `estado.json` de **cada espacio**: yo no puedo escribirlos, los crea la persona en la app.
- **Casos esquema 1 (los 29 antiguos) congelados**: se leen igual; editar uno lo guarda con sus datos exactos (por eso «Archivo» va en solo lectura). No migrarlos. El Sheet viejo no recibe el `Codigo.gs` nuevo; su repo y la copia `copia-datos-…-2026-10-18.bundle` de la carpeta superior no se borran.
- Los ids no cambian nunca (la técnica nueva usa un id propio; lo retirado no se reutiliza); GRID: umbrales en Basales, mapeo en Mapeo; candado de casos cerrados; Técnicas IONM fuera de la demo; hoja impresa 1 ≤ ≈1045 px.
- Botones rectangulares, casillas ≈30 px, sin foco automático en el móvil, radios `var(--r)`. ES5 (`var`, sin flechas). Textos con `T()` y su `en`. DOM con `createElement`.
- **Repo público: sin precios, números de caso reales, nombres de personas (ni apodos), nombres de hospitales ni de repos de datos.** Vale también para este archivo y para `Codigo.gs`.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`.
- Archivos de trabajo en LF; mejor Edit que `sed -i` (el `sed` solo para subir `?v=`). Scripts largos en un archivo del scratchpad, **no en heredoc de bash**. En Windows, Python no entiende rutas `/c/…` de Git Bash: usar `C:/…`.
- Repo privado: `git fetch` + `pull --ff-only` antes de tocarlo y `fetch` antes del push. Diario privado: una entrada por cambio.
- Pedido del usuario: no cambiar nada que no pida; ante ambigüedad, una pregunta antes de actuar. Explicar poco a poco, paso a paso, sin jerga de GitHub. Responder siempre en castellano.
- Móvil del usuario: tras cada publicación, borrar solo la **caché** (nunca «datos del sitio»: perdería lo no subido).
- Sesión principal: orquestar; delegar lo que toque 3+ archivos o lecturas grandes; revisar el diff y verificar antes de subir.

## 6. Verificación

1. `node --check app.js` y `node --check data/surgeries.js`.
2. Servidor `checklist` (preview_start) en `http://localhost:8099/?demo`: seis etiquetas con `?v=20261020o`; ⋮ muestra «v20261020o»; consola sin errores propios (401 de tokens falsos no cuentan).
3. Catálogos (⋮): pestañas Técnicas, Servicios, Usuarios, Centros (sin Intervenciones ni Perfiles); «+ Usuario nuevo» abre un panel con «Usuario nuevo», Cancelar y Guardar; guardar dos seguidos deja los dos; el lápiz abre «Editar usuario»; Técnicas lista «Mapeo cortico-cortical (CCEP)» y no «Material Qx» (44 técnicas en la demo).
4. Diálogo ☁: cada espacio en su caja, el activo con borde de acento.
5. `git status -sb` limpio y `git rev-parse HEAD origin/main` iguales; `curl` de la web publicada debe dar `app.js?v=20261020o` (si Pages sigue activo con el repo privado).
6. NO verificado nunca: GitHub real con dos dispositivos, conflicto 409, Apps Script real, PDF impreso real, la guía PDF renderizada (solo se comprobó el texto), apuntes/técnicas desde un segundo espacio real, inglés de avisos nuevos, escritorio, gestos táctiles, el diálogo de Catálogos y el ☁ nuevos en el móvil real.
