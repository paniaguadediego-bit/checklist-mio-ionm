# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público `checklist-mio-ionm` y repo privado de datos `../checklist-mio-datos`).
- Fase: **piloto multihospital, tanda 1 de 9 cerrada** (almacén local por espacio de trabajo). Nada a medias. Todo subido en los dos repos.
- Versión actual: `?v=20261018` (seis etiquetas de `index.html`).
- Plan completo de las 9 tandas, con líneas de código y riesgos: `../checklist-mio-datos/docs/AUDITORIA-ESPACIOS-SEUDONIMIZACION-2026-10-18.md`. Contexto del piloto, grupos y usuarios: memoria `project_piloto_hospitales` y diario privado.

## 2. Hecho en esta sesión (11 a 18-10-2026)

- **Docs**: README revisado entero contra el código (31 correcciones); `CLAUDE.md` y README: «Exportar copia» es completa desde el 29-09. Dosier de producto en el repo privado: `docs/DOSIER-PRODUCTO-2026-10-11.md`. Propiedad intelectual: NO registrada (solo la memoria descriptiva preparada).
- **Fase 1 multihospital** (`app.js`, `index.html`, `style.css`, `data/guia.js`, README, CLAUDE.md): plantillas editables por todo el grupo (`puedoEditar()`), «Cambiar autor…» en Más acciones de Plantillas, repositorio personal opcional (`destinoRuta()`/`urlRuta()`; `mio_ionm_sync_personal_v1`; apuntes/ y referencia/ van allí).
- **Mis apuntes** solo visibles con repo personal, en la demo o si el dispositivo ya tiene apuntes (`apuntesVisibles()`; excepción de transición). Biblioteca de montajes → rótulo «Biblioteca de casos compartidos» (sigue En construcción, aparcada).
- **Organizador**: fuera la franja de color a la izquierda de cada plantilla.
- **Ayuda** de «Resultado de la señal»: ya no dice que es el mismo dato que el Cierre del Registro.
- **Tanda 1** (`app.js` ~l.70-190, `index.html`, `CLAUDE.md`): `almacenEspacio()`, `resolverEspacio()`, `espacioActivo()`, `CLAVES_GLOBALES`, índice `mio_ionm_espacios_v1`, puntero `mio_ionm_espacio_activo`, IDB `mio_ionm_fotos__<id>`. Espacio «archivo» = prefijo vacío (datos actuales sin tocar). Sin interfaz.
- **Infraestructura fuera del código**: organización de GitHub del piloto (plan Free) con dos repos privados de datos (plantillas y usuarios cargados, sin casos); copia de seguridad `../copia-datos-pamplona-2026-10-18.bundle` del repo de datos anterior (29 casos, último 15-10). No borrar.

## 3. Siguiente paso exacto

Tanda 2 de la auditoría: **selector de espacios + recarga al cambiar**, con repo inmutable por espacio (`repo_origen`), aviso si hay pendiente de subir, `espacio_id` en `estado.json`, comprobación en «Importar copia» (`importarCopiaCompleta()`), y bloquear el cambio de `sync.repo` en un espacio con datos (`leerCamposSync()`). Incluye pasar **Mis apuntes a ámbito personal global** (hay un `TODO tanda 2` junto a `APUNTE_DOC_KEY`). Delegar a un subagente con el encargo detallado de la auditoría (parte A.3).

Antes, leer y explorar con el usuario las dos ideas de la sección 4.

## 4. Decisiones abiertas (esperan al usuario)

- **Idea 1: exportar eventos y alarmas.** ¿Quitar el CSV y meterlos en el Sheet «maestro»? Opinión dada: no en la hoja `Casos` (una fila por caso); mejor una hoja `Eventos_long` (una fila por evento/alarma, con `ID_Caso` y minutos desde el inicio) en la tanda 7, y retirar el CSV si nadie lo usa. Falta su respuesta.
- **Idea 2: rastro de quién hace qué.** «Caso creado por X», historial de modificaciones y obligar a elegir perfil al abrir la herramienta. Ojo: el perfil no es seguridad; la atribución fiable es la cuenta de GitHub de cada médico. Tensión con la seudonimización: `editado_en` con hora real saldría del repo; propuesta: `creado_por` y `editado_por[]` (id + nº de edición, como mucho mes). Falta definir y aprobar.
- Aprobado el 18-10 (no reabrir): fecha mes/año, minuto 0 = incisión, edad por tramos de 5, sin nombre de caso ni nombres del personal en lo que se sube, imágenes solo locales, textos libres con aviso (sin bloquear), `ID_Caso` actual, seudonimización al guardar, plantillas ajenas en solo lectura (repo común, al final).
- Parados: **C22** (centro del dispositivo), MAV, nube punto 7, bloque 4 de textos, privacidad al sacar datos, tiendas de apps, **Biblioteca de casos compartidos** (aparcada por riesgo de fuga entre hospitales).
- Pendiente del usuario (GitHub y Google): invitar a cada médico a su repo (una cuenta por persona, permiso Write), token fine-grained por persona, repo personal para sus apuntes, Sheet por hospital y archivar el repo de datos antiguo cuando exista el modo consulta. Pamplona y el segundo hospital esperan a la seudonimización; **ningún dispositivo con casos reales debe conectarse a otro repo hasta que acaben las tandas 2 y 3**.
- Subagente sin respuesta del usuario: ¿«Restablecer demo» sigue bien tras la tanda 1? (no se pulsó en las pruebas).

## 5. Restricciones activas

- **Aislamiento entre hospitales**: toda clave nueva de `localStorage` se prefija por defecto; solo va a `CLAVES_GLOBALES` si es preferencia de dispositivo. Nada de datos de un espacio en otro.
- Los ids no cambian nunca; GRID: umbrales en Basales, mapeo en Mapeo; `grid1_*`/`grid2_*`. Candado de casos cerrados (`candado()`). Técnicas IONM fuera de la demo (`prepararDemo()`). Hoja impresa: hoja 1 ≤ ≈1045 px.
- Botones rectangulares, casillas ≈30 px, sin foco automático en inputs en el móvil, radios `var(--r)`. ES5 (`var`, sin flechas). Textos con `T()` y su `en`. DOM con `createElement`.
- **Repo público: sin precios, números de caso reales, nombres de personas (ni apodos), nombres de hospitales ni de repos de datos.** Eso vale también para este archivo.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`.
- Scripts de Python en el scratchpad (`C:\Users\pablo\AppData\Local\Temp\claude\...`), con `python archivo.py < /dev/null` y `newline=""`; los scripts largos van en archivo, no en heredoc. `app.js` va en CRLF; mejor Edit que `sed -i`.
- Repo privado: `git fetch` + `pull --ff-only` antes de tocarlo y `fetch` antes del push. Diario privado: una entrada por cambio.
- Seguro de datos: GitHub guarda la hora real de cada commit; esto es seudonimizar, no anonimizar. Cada hospital debe consultar a su delegado de protección de datos antes de meter pacientes reales.
- Sesión principal: orquestar; delegar a subagente lo que toque 3+ archivos, lecturas grandes o búsquedas amplias; revisar el diff y verificar antes de subir.

## 6. Verificación

1. `node --check app.js`
2. Servidor `checklist` (preview_start) en `http://localhost:8099/` y en `?demo`, a 375 px: seis etiquetas con `?v=20261018`, consola sin errores.
3. En `localStorage`: `mio_ionm_espacios_v1` = `[{"id":"archivo","nombre":"Archivo","prefijo":"","solo_lectura":false}]` y `mio_ionm_espacio_activo` = `archivo`.
4. Aislamiento (solo en el navegador de pruebas): añadir un espacio `prueba` al índice, apuntar el puntero a él y recargar: Gestión de Casos vacía, claves nuevas con prefijo `mio_ionm_esp_prueba__`, IDB `mio_ionm_fotos__prueba`. Volver el puntero a `archivo`: datos del archivo intactos. Limpiar todo al terminar.
5. Gestión de Casos de la demo: 8 casos; Organizador: plantillas sin franja de color a la izquierda.
