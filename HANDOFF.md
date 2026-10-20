# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público del código y repo privado de datos en la carpeta hermana; no se nombran hospitales, personas ni repos de datos aquí).
- Fase: **piloto multihospital, preparando la configuración real (repos de datos por hospital y Sheets).** El código está cerrado y subido, nada a medias. Versión `?v=20261020h` (seis etiquetas de `index.html`; el número sale también en ⋮ → «v20261020h»). Último commit de código: `e4a53ff`, igual que `origin/main`.
- Lo que NO está hecho es lo externo: crear los repos y tokens de cada hospital, conectar los espacios, Sheets por hospital y consulta de protección de datos. **No recoger pacientes reales hasta cerrarlo.**
- Contexto: memoria `project_piloto_hospitales`, diario privado (`docs/DIARIO-CODIGO.md`), guía `docs/SHEETS-POR-HOSPITAL-2026-10-19.md` (repo privado).

## 2. Hecho en esta sesión (19-20/10/2026)

- **Auditoría de los 29 casos antiguos** (repo privado, solo lectura): 25 cerrados y 4 cancelados; el usuario corrigió los huecos desde la app. Quedaban sin intervención el 002 y el 004 y el 025 con 13,2 h (por confirmar); faltan en el repo los números 001, 026, 031 y 032. Concordancia, evolución y TOF vacíos en muchos: no son error.
- **Informe PDF de varios casos más compacto** (`app.js`: `ESTILO_INFORME_COMPACTO`, solo con más de un caso; cajas en 4 columnas, márgenes 9 mm; **cada caso en página nueva**, a petición del usuario).
- **Selector «Exportar:»** en Gestión de Casos (según filtros / todos / solo destacados) para CSV, eventos y alarmas y PDF: `uidsParaExportar()` en `app.js`, `index.html`, `style.css`.
- **Versión visible** en ⋮ bajo «Ocultar ayudas» (`#menu-version`; sale del `?v=` de `app.js`).
- **Arreglo**: el selector de espacios se escondía con «Ocultar ayudas» (`style.css`).
- **Diálogo ☁ simplificado y reordenado** (`index.html`, `app.js` `pintarDlgSync()`, `style.css`): conectado = solo «Conectado» + «Opciones avanzadas» + Cerrar; avanzado = Espacio, Conexión (repo, token, ayuda), «Sincronizar a mano», Traer/Guardar y pie con Desconectar y **Cerrar al final**.
- **Fuera el «repositorio personal»**: Mis apuntes y Técnicas IONM usan siempre el acceso del espacio «Archivo» (`reflejarArchivoEnPersonal()`, clave global `mio_ionm_sync_personal_v1`, `destinoRuta()`); Desconectar en otro espacio ya no los olvida. Fila del mapa de `CLAUDE.md` actualizada.
- Repo privado: `docs/SHEETS-POR-HOSPITAL-2026-10-19.md` y entradas del diario al día.

## 3. Siguiente paso exacto

**Paso 1 del plan, con el usuario y de uno en uno:** el usuario crea en GitHub su repo de datos nuevo (privado) y un token fine-grained (solo ese repo, Contents: Read and write). Cuando diga el nombre del repo (`usuario/repo`; **nunca** el token en el chat), pasar al **paso 2**: en la app, ☁ → Opciones avanzadas → Espacio de trabajo → crear el espacio de su hospital (equipo por defecto Cadwell), conectarlo con ese repo y token.

Plan completo (explicado al usuario):
1. Repo y token del hospital propio.
2. Conectarlo en la app (espacio nuevo).
3. Dejar «Archivo» solo suyo y en **solo lectura también en el móvil** (la marca es por dispositivo; hoy en el móvil sigue editable). Abrir «Archivo» conectado una vez por dispositivo para que apuntes y técnicas funcionen desde los demás espacios.
4. Guía de una página para el médico del otro hospital: su propio repo privado, su token y su espacio; el usuario NO tiene acceso a ese repo ni ellos al suyo. Escribirla cuando llegue.
5. Sheet del hospital propio (la guía del repo privado). El Sheet del otro hospital lo crea su médico con su propio token (cambia lo dicho antes: el usuario ya no lo crea).

## 4. Decisiones abiertas (esperan al usuario)

- **Pendientes de interfaz, sin pedir aún**: código de configuración de un paso (o QR) para que el administrador deje un dispositivo conectado sin teclear repo y token; renombrar espacios (p. ej. «Casos de X (solo consulta)»; no se sabe si la app lo permite); acceso directo a «Archivo» sin pasar por Opciones avanzadas.
- Casos 002 y 004 sin intervención y 025 con 13,2 h: confirmar o corregir; números 001/026/031/032 ausentes (¿papelera o borrados?).
- **Catálogo de usuarios**: nombres reales siguen en `estado.json` y en la copia; propuesta de seudónimo por usuario sin visto bueno.
- **Copia de seguridad**: la «Exportar copia» de un caso nuevo sale sin fecha exacta, personal ni fotos; ¿se acepta o copia local cifrada?
- **Protección de datos**: consulta al delegado de cada hospital ANTES de pacientes reales (no es decisión técnica).
- **Repo del código privado**: más adelante; avisar a médicos, revisar token del Apps Script y los textos «repo público».
- Ideas 1 (eventos y alarmas en el Sheet) y 2 (rastro de quién hace qué) sin respuesta. Decisiones del subagente a validar: bajadas en solo lectura no retiran en local lo que falte en remoto; preferencias prefijadas no persisten en solo lectura; `t0` se fija al marcar «Incisión»; «Ahora» sin `t0` crea uno provisional.
- Parados: C22, MAV, nube punto 7, bloque 4 de textos, tiendas de apps, Biblioteca de casos compartidos.

## 5. Restricciones activas

- **Aislamiento entre hospitales**: toda clave nueva de `localStorage` se prefija por defecto; solo va a `CLAVES_GLOBALES` si es preferencia de dispositivo (como `mio_ionm_sync_personal_v1`, que lleva el acceso de «Archivo»). Nunca `window.localStorage` directo. Lo exacto (fecha, edad, personal, `t0`) vive solo en tablas locales y no entra en `estado.json`, `casos/`, montajes ni «Exportar copia». Nunca el token de un hospital en el Sheet de otro; un repo de datos distinto por hospital y el otro hospital sin acceso al del usuario.
- **Casos esquema 1 (los 29 antiguos) congelados**: se leen igual; editar uno lo guarda con sus datos exactos (por eso «Archivo» va en solo lectura). No migrarlos. El Sheet viejo se actualiza solo con su script viejo (**no** pegarle el `Codigo.gs` nuevo); su repo y la copia `la copia «copia-datos-…-2026-10-18.bundle» de la carpeta superior` no se borran.
- Los ids no cambian nunca; GRID: umbrales en Basales, mapeo en Mapeo; candado de casos cerrados; Técnicas IONM fuera de la demo; hoja impresa 1 ≤ ≈1045 px (el informe compacto solo aplica con varios casos y no toca la hoja).
- Botones rectangulares, casillas ≈30 px, sin foco automático en el móvil, radios `var(--r)`. ES5 (`var`, sin flechas). Textos con `T()` y su `en`. DOM con `createElement`.
- **Repo público: sin precios, números de caso reales, nombres de personas (ni apodos), nombres de hospitales ni de repos de datos.** Vale también para este archivo y para `Codigo.gs`.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`.
- Archivos de trabajo en LF; mejor Edit que `sed -i`. Scripts de Node/Python largos en un archivo (herramienta Write) del scratchpad, **no en heredoc de bash** (se rompe con apóstrofos y comillas; pasó otra vez hoy).
- Repo privado: `git fetch` + `pull --ff-only` (o `pull --rebase` si la app subió commits) antes de tocarlo y `fetch` antes del push. Diario privado: una entrada por cambio.
- Pedido del usuario: no cambiar nada que no pida; ante ambigüedad, una pregunta antes de actuar. Explicar poco a poco, paso a paso, sin jerga de GitHub.
- Móvil del usuario: tras cada publicación, borrar solo la **caché** (nunca «datos del sitio»: perdería lo no subido).
- Sesión principal: orquestar; delegar lo que toque 3+ archivos o lecturas grandes; revisar el diff y verificar antes de subir.

## 6. Verificación

1. `node --check app.js`.
2. Servidor `checklist` (preview_start) en `http://localhost:8099/` y `?demo`: seis etiquetas con `?v=20261020h`; ⋮ muestra «v20261020h»; consola sin errores propios (401 de tokens falsos no cuentan).
3. Diálogo ☁ con credenciales falsas en `mio_ionm_sync_v1` (restaurar la clave al acabar): conectado = solo estado, «Opciones avanzadas» y Cerrar; avanzado = Espacio, Conexión, Sincronizar a mano y pie con Cerrar último; sin conexión se ve todo. En espacio «archivo» conectado debe aparecer `mio_ionm_sync_personal_v1`.
4. Exportar: selector «Exportar:» en Gestión de Casos (demo: 8 / 8 / 2 casos) y informe de varios casos con salto de página por caso.
5. `git status -sb` limpio y `git rev-parse HEAD origin/main` iguales; `curl` de la web publicada debe dar `app.js?v=20261020h`.
6. NO verificado nunca: GitHub real (subida/bajada, dos dispositivos, conflicto 409), Apps Script real, PDF impreso real, apuntes/técnicas desde un segundo espacio real, inglés de avisos nuevos, escritorio, gestos táctiles.
