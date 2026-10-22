# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público del código; repo privado de datos en la carpeta hermana; aquí no se nombran hospitales, personas, números de caso ni repos de datos).
- Fase: **arreglos de la auditoría del 20-10-2026, a medias.** En esta sesión se cerraron tres bloques: Organizador y Catálogos, ficha, y T27. Faltan E9-E13, F31 y F11. El código está en `?v=20261022d`, limpio y subido; no hay nada sin terminar.
- Piloto multihospital: sin cambios. El Sheet del hospital propio está hecho, pero **falta compartirlo**: acceso restringido, solo lectores, sin editores y sin descargar ni copiar. La consulta de protección de datos sigue pendiente. **No se recogen pacientes reales hasta probar C23 con un repo de prueba y cerrar esa consulta.**

## 2. Hecho en esta sesión (22-10-2026)

- **F21** (`style.css`): `#montajes-mas-lista { left: auto; right: 0; }`. El menú de varias plantillas (`#lote-mas-lista`) sigue anclado a la izquierda, porque ese botón está a la izquierda. Commit 254fbca.
- **F15** (`style.css`): `.org-migas` en una sola línea (`flex: 1 1 0; nowrap`) y `#org-migas-nombre` cortado con «…»; «Inicio» en la misma fila. Cabecera de ≈128 px a 31 px a 360 px. Por decisión de Pani, el nombre sigue también en «Plantilla seleccionada». Commit 254fbca.
- **F32** (`style.css`, `app.js`): `#cat-pestanas` baja de línea. En `renderCatVersion()`, sin `actualizado_en` sale solo «Versión N» (clave nueva `cat_version_sin_fecha`); `cat_nunca` ya no se usa, pero no se borra. Por decisión de Pani, la columna del grupo se queda. Commits 254fbca y afe8b10.
- **F33** (`app.js`, `filtroEquipoPlantillas()`): sigue arrancando en el equipo recordado, pero si ese equipo no tiene plantillas pasa a «Todos» (lo recordado no se borra). También ocurre si se elige a mano un equipo vacío. Commit afe8b10.
- **F26** (`app.js`, solo textos `es`/`en`): «alarma» en `caso_alerta`, `caso_tipo_alerta`, `caso_conc_alerta`, `caso_conc_sin_alerta`, `tile_casos_sub`, `tour_x_caso_desarrollo` y `caso_alarmas_registro_ay`. Los ids de campo y las columnas del CSV y del Sheet (`alerta`, `tipo_alerta`) no cambian. Commit 52c5432.
- **F27** (`app.js`, `style.css`): `pintarDuracionCaso()` junto a `tDuracionDeMinutos()`. Pone `<p id="caso-duracion" class="caso-duracion">` («Duración: 3 h 35 min») debajo de la fila de horas, se repinta con `input` en las dos horas y se oculta si falta una. Commit 52c5432.
- **F28** (`app.js`): `fechaHoraTxt(v, sinSeg)` tiene un segundo parámetro opcional, que solo usa `textoAutoriaCaso()`. Plurales con las claves `caso_n_ediciones(_1)` y `caso_n_veces(_1)`; `caso_creado_en` pasa a «Creado · {fecha}». Commit 52c5432.
- **F34** (`app.js`, `style.css`): botón `.caso-ir-registro-dentro` al principio de `#caso-c-desarrollo`, solo si `!casoBloqueado(c)`. Llama a `#caso-ir-registro`, que sigue en el ⋮. Commit 52c5432.
- **T27** (`app.js`, `almacenEspacio()`): la lista de claves se guarda y se rehace con `setItem`/`removeItem`/`borrarTodo` del envoltorio, con el evento `storage` de otra pestaña o si cambia `real.length`. `borrarTodo` usa `clavesReales()`. Commit 7d42d09.
- Repo privado, `docs/AUDITORIA.md`: F15, F21, F26, F27, F28, F32, F33, F34 y T27 marcados ✅ (22-10-2026).

## 3. Siguiente paso exacto

Abrir `../checklist-mio-datos/docs/AUDITORIA.md` (antes, `git pull --ff-only`) y leer las filas de **E9, E10, E11, E12, E13, F31 y F11**, en la tabla de seguimiento y en la tabla detallada. Buscar el código de cada una con `grep`, sin leer `app.js` entero. Lo que cambie una decisión anterior o un texto se pregunta a Pani antes de tocarlo, todo junto en una sola pregunta.

Cuando acabe ese bloque, quedan solo los hallazgos de la sección 4, que esperan a Pani.

## 4. Decisiones abiertas (esperan a Pani)

- **Nuevas de esta sesión:**
  - F26: en los parámetros de técnicas sigue el rótulo «Criterio de alerta» (`criterio_alerta`, hacia `app.js:14531`). ¿Pasarlo también a «alarma»?
  - F34: el botón nuevo sale algo más grande que «Borrador del resumen», porque la ficha aplica su propio tamaño de botón. ¿Igualarlo?
- De la sesión anterior:
  - F36: en el Registro quedan dos leyendas de texto libre (pantalla y hoja de apuntar). ¿Dejar solo una?
  - Textos: la leyenda «En los textos libres, no escribir…» y la línea del ☁ sin conectar.
- C25: cómo proteger lo exacto y las fotos, que solo viven en el dispositivo y no tienen copia (`persist()`, aviso, papelera).
- C26, segunda parte: alinear «Hora inicio/Fin MIO» del Registro con las horas de la ficha.
- C28: ids de usuario opacos, o basta con las iniciales.
- C29: olvidar el acceso de «Archivo» desde cualquier espacio.
- C30: si CCEP se registra con tira o con grid (`REG_TEC_GRID`).
- C31: informe PDF seudónimo para enviar fuera.
- C32: reescribir la historia de git para quitar nombres antiguos (afecta también a C33).
- C34: fijar `Codigo.gs` a una etiqueta o a un sha del repo del código.
- F22: dónde va «Restablecer» y cómo se llama.
- F23: quitar «Guardar plantilla».
- F24: «Cerrar caso» con confirmación, o renombrado.
- F25: si H-R Sóleo en Técnicas y en Reflejos medulares es lo mismo.
- F30: si «¿Quién eres?» deja de usar `prompt()` y admite nombre además de iniciales.
- T24, menor: renombrar las clases `.sync-personal-*`.
- Piloto: con quién se comparte el Sheet; consulta al delegado de protección de datos de cada hospital.
- Pendientes de antes: retirar del todo intervenciones y perfiles (aparcado, opción B); columnas `creado_por`/`editado_por` en el Sheet; Sheet viejo con `CONGELADO = 1`; espacio vacío de más; casos con datos dudosos (están en el diario privado).

## 5. Restricciones activas

- **Aislamiento entre hospitales:** toda clave nueva de `localStorage` se prefija (se usa el `localStorage` envuelto, nunca `window.localStorage` directo); lo exacto (fecha, edad, personal, `t0`, horas reales, `nombre_caso`) no sale del dispositivo; un repo de datos por hospital.
- **El repo del código es PÚBLICO:** sin precios, números de caso, nombres de personas, ni nombres o códigos de hospitales o de repos de datos (tampoco aquí ni en `CLAUDE.md`).
- **Casos y datos que no se tocan:** los casos de esquema 1 están congelados; los ids no cambian nunca; candado en los casos cerrados (para «¿está bloqueado?» se usa `casoBloqueado(c)`; `fichaCerrada()` aún no vale mientras se pinta la ficha); la hoja impresa 1 mide como mucho ≈1045 px.
- **Ids de campo y columnas:** un cambio de texto (como «alerta» → «alarma») no toca ids ni cabeceras. El CSV de casos y la hoja `Casos` de `Codigo.gs` son la misma tabla.
- **Decisiones de Pani que siguen en pie:** la barra de la ficha va en una sola fila (29-09); el filtro de equipo recuerda el último usado (25-09; F33 solo añade la vuelta a «Todos»); Exportar/Importar copia e Imprimir no se vuelven a poner; intervenciones y perfiles ocultos, sin borrar sus claves `T()`.
- Botones apagados por el modo de solo lectura (`SOLO_LECTURA_IDS`): ningún arreglo los reactiva.
- **Estilo:** botones rectangulares, casillas de ≈30 px, sin foco automático en el móvil, radios `var(--r)`. Código en ES5, textos con `T()` y su `en`, DOM con `createElement`/`regNodo`.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`. La siguiente versión es `?v=20261023a` (o `20261022e` si es el mismo día).
- **Saltos de línea:** editar con un script de Python en binario que respete CRLF/LF (`edit(p, pares)` con `assert count == 1`), escrito con la herramienta Write en el scratchpad: los heredoc largos con `'''` fallan en el Bash de esta máquina. Ejecutar con `python -X utf8`.
- **Repo privado:** `git pull --ff-only` antes de tocarlo. El PDF de la guía del otro hospital queda sin commitear a propósito. Al marcar filas, el patrón debe exigir ⬜/🟡 en la segunda columna, porque si no también encuentra la tabla detallada.
- Al arreglar un hallazgo, marcar su fila en `AUDITORIA.md` (✅, fecha, nota y commit).

## 6. Verificación

1. `node --check app.js` (y `data/guia.js`, `data/i18n-en.js` si se tocan).
2. Servidor `checklist` (preview_start) en `http://localhost:8099/?demo`: las seis etiquetas con `?v=20261022d` y la consola sin errores propios. Para cerrar la visita guiada, el botón «Ahora no».
3. Organizador a 360 px, con la plantilla «Supratentorial» abierta: la cabecera mide ≈31 px y «Más acciones» abre dentro de la pantalla (derecha ≤ 360).
4. Catálogos a 360 px: `#cat-pestanas` sin scroll horizontal (`scrollWidth == clientWidth`); `#cat-version` = «Versión 1».
5. F33: en `#montajes-equipo` elegir «generico» (sin plantillas): el valor vuelve a «» (Todos) y se ven las 7.
6. Ficha: un caso cerrado tiene «Duración: 2 h 20 min» y no tiene `.caso-ir-registro-dentro`; en uno preparado, al escribir 08:30 y 12:05 sale «Duración: 3 h 35 min», y al guardar el pie dice «… · 1 edición» sin segundos. El botón de Desarrollo abre `#pantalla-registro`. Etiquetas de la lista: «Hubo alarma».
7. T27: Gestión de Casos de la demo con 8 filas, igual que las claves `mio_ionm_demo__mio_ionm_caso_*`; borrar un caso → 7, también tras recargar; «Restablecer demo» → 8.
8. Repo del código: `git status -sb` limpio y `HEAD` igual que `origin/main`. Repo privado: filas marcadas y subido.
9. Pendiente de antes: C23 con un repo y un token **de prueba** (nunca los del hospital). Nunca verificado: GitHub real con dos dispositivos (C1, C3, C10, 409), el PDF impreso de verdad, la puerta de usuario en el móvil real y el segundo hospital.
