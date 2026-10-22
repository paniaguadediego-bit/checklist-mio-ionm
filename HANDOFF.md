# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público del código; repo privado de datos en la carpeta hermana; aquí no se nombran hospitales, personas, números de caso ni repos de datos).
- Fase: **arreglos de la auditoría del 20-10-2026 cerrados en lo que no depende de Pani.** Solo quedan 15 filas abiertas en `AUDITORIA.md`, y todas esperan su decisión (sección 4). En esta sesión también se pidió y se hizo un cambio clínico: **intensidad de estímulo en las basales de SEP y MEP**. El código está en `?v=20261022g`, limpio y subido; no hay nada a medias.
- Piloto multihospital: sin cambios. El Sheet del hospital propio está hecho, pero **falta compartirlo**: acceso restringido, solo lectores, sin editores y sin descargar ni copiar. La consulta de protección de datos sigue pendiente. **No se recogen pacientes reales hasta probar C23 con un repo de prueba y cerrar esa consulta.**

## 2. Hecho en esta sesión (22-10-2026)

- **E9** (`style.css`): en los temas azul y oscuro, `--fam-mot` pasa de #ef4444 a #f87171 y `--fam-ref` de #c8408f a #ea72ad. Los chips quedan a 4,8-5,1:1. El tema claro no cambia. Commit a433890.
- **E10** (`style.css`): `#casos-exportar-alcance` con el mismo aspecto que «Ordenar por». Commit a433890.
- **E11** (`style.css`): en `:root.tema-oscuro`, la pastilla de la demo usa #d99a2b (5,3:1). Commit a433890.
- **E13** (`style.css`): el fondo de `.apunte-carpeta-cuenta` es el color de la carpeta mezclado al 70 % con negro (`color-mix`). El número blanco queda a ≥5:1 en los 8 colores. Commit a433890.
- **F31** (`style.css`): zona táctil ampliada con `::after`. `#btn-colores` y `#btn-guia` ganan 6 px arriba y abajo; las ▲▼ de `.cat-mover`, 6 px a la izquierda y 4 a la derecha (la lista `#cat-lista` recorta más allá). Commit a433890.
- **F11** (`style.css`, decisión de Pani: pastilla corta en móvil): por debajo de 400 px las dos `.barra-fila` pasan a `display: contents` dentro de `.barra-sup`, que es flex con wrap.
  - `#btn-sync` va con `order: 2`, máximo 6rem y «…»; Colores, Guía y ⋮ con `order: 4`.
  - Un `.barra-sup::after` al 100 % fuerza el salto antes de `.sync-espacio` y `.guardado-aviso` (este se oculta si está `:empty`).
  - El perfil va con `flex: 1 1 0`.
  - Cabecera: de 73 a 40 px en la demo y de 95 a 62 px con aviso; a 420 px no cambia. Commit 9d8bd35.
- **E12** (`app.js`, decisión de Pani: dd/mm/aaaa): `fechaCorta(iso)` devuelve dd/mm/aaaa, o mm/aaaa si solo hay mes. La nueva `fechaCortaDe(d)` hace lo mismo con un `Date`.
  - Se usan en las filas de Gestión (`.caso-fila-fecha`), los chips de filtro, la papelera y `fechaMontaje()`, además del tooltip «Creada por».
  - `fechaHoraTxt()` (autoría de la ficha) no cambia. Commit 9d8bd35.
- **Basales con intensidad** (`app.js`, pedido de Pani). Solo en las filas t-SEP, c-SEP, t-MEP y c-MEP (`RE_BASAL_INTENSIDAD`), que llevan Intensidad en lugar de Amplitud. Clave nueva `e_<fila>_<fase>_int`: SEP en mA, MEP en mA/V (`REG_BASAL_INT`, `regBasalConIntensidad()`, `regMedidasBasal()`). Commit a93fe93.
  - `regBasalValor()`: `int` nunca sale de la casilla antigua «a/b».
  - `regBasalMigrar()`: migra con `REG_BASALES_MEDIDAS`, amplitud incluida.
  - `regBasalEscrita()`: cuenta también `_int`.
  - `regBasalTexto()`: añade «(amp. X µV/mV)» si la fila tiene amplitud escrita de antes.
  - `regLeyendaUnidades(prefijo, corta)`: cabecera de la pantalla y títulos de la hoja impresa («SEP: mA / ms; resto: µV / ms»).
  - `regComparacionFila()`: la intensidad cuenta como «fuerte» si sube ≥50 %. **Pani lo confirmó: se queda en 50 %.**
  - Claves `T()` nuevas: `reg_bl_amp_antigua`, `reg_bl_resto` y `reg_bl_onda_d_uv`. Cambia el texto de `registro_basales_leyenda`.
  - Demo: los valores `_amp` de SEP y MEP pasan a `_int`. SEP 18 mA en los miembros superiores y 28 en los inferiores (40 si hubo pérdida); MEP = umbral + 50.
  - Las basales no van al CSV ni al Sheet: `Codigo.gs` no se toca.
- Repo privado, `docs/AUDITORIA.md`: E9, E10, E11, E12, E13, F11 y F31 marcados ✅ (22-10-2026).

## 3. Siguiente paso exacto

Preguntar a Pani, todo junto en una sola pregunta, por las decisiones abiertas de la sección 4. Sugerencia: empezar por las de producto que son pequeñas (F22, F23, F24, F25, F30 y las dos de F26/F34). No tocar código hasta tener la respuesta. Si además pide algo nuevo, eso va primero.

Pendiente de documentación: README.md (líneas ≈137, 158, 1180-1182 y 2070) y el mapa de `CLAUDE.md` todavía dicen «amplitud» en las basales de SEP y MEP. Se actualizan con el próximo «actualiza todo», o antes si Pani lo pide. Lo mismo con el diario privado (`docs/DIARIO-CODIGO.md`): esta sesión no se ha apuntado.

## 4. Decisiones abiertas (esperan a Pani)

- F26: en los parámetros de técnicas sigue el rótulo «Criterio de alerta» (`criterio_alerta`, hacia `app.js:14531`). ¿Pasarlo también a «alarma»?
- F34: el botón «Abrir en el Registro» de Desarrollo sale algo más grande que «Borrador del resumen». ¿Igualarlo?
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
- F11, efecto secundario: a 360 px el selector de perfil se queda en ≈70 px. Con iniciales cabe, con un nombre largo se corta. Solo si Pani lo ve mal.
- Piloto: con quién se comparte el Sheet; consulta al delegado de protección de datos de cada hospital.
- Pendientes de antes: retirar del todo intervenciones y perfiles (aparcado, opción B); columnas `creado_por`/`editado_por` en el Sheet; Sheet viejo con `CONGELADO = 1`; espacio vacío de más; casos con datos dudosos (están en el diario privado).

## 5. Restricciones activas

- **Aislamiento entre hospitales:** toda clave nueva de `localStorage` se prefija (se usa el `localStorage` envuelto, nunca `window.localStorage` directo). Lo exacto (fecha, edad, personal, `t0`, horas reales, `nombre_caso`) no sale del dispositivo. Un repo de datos por hospital.
- **El repo del código es PÚBLICO:** sin precios, números de caso, nombres de personas, ni nombres o códigos de hospitales o de repos de datos (tampoco aquí ni en `CLAUDE.md`).
- **Ids que no cambian nunca:** en basales, `_amp` se sigue leyendo aunque ya no tenga casilla en SEP/MEP; no se borra ni se renombra. La casilla antigua `e_<fila>_<fase>` («a/b») se migra con las medidas de la tabla, nunca con las de la fila. Un cambio de texto no toca ids ni columnas del CSV o del Sheet.
- **Casos y datos que no se tocan:** los casos de esquema 1 están congelados; los ids no cambian nunca; candado en los casos cerrados (para «¿está bloqueado?» se usa `casoBloqueado(c)`).
- **Hoja impresa:** la hoja 1 mide como mucho ≈1045 px. Tras el cambio de intensidad mide 1030 px en 2026-002 de la demo y 1003 px en 2026-005; los títulos de basales ocupan ya dos líneas, así que no hay margen para alargarlos.
- **Decisiones de Pani que siguen en pie:**
  - La barra de la ficha va en una sola fila (29-09).
  - El filtro de equipo recuerda el último usado.
  - Exportar/Importar copia e Imprimir no se vuelven a poner.
  - Intervenciones y perfiles quedan ocultos, sin borrar sus claves `T()`.
  - La cabecera tiene dos filas a ≥400 px (09-09); por debajo, una (F11).
  - Las fechas a la vista van en dd/mm/aaaa.
  - La intensidad es «fuerte» desde +50 %.
- Botones apagados por el modo de solo lectura (`SOLO_LECTURA_IDS`): ningún arreglo los reactiva.
- **Estilo:** botones rectangulares, casillas de ≈30 px, sin foco automático en el móvil, radios `var(--r)`. Código en ES5, textos con `T()` y su `en`, DOM con `createElement`/`regNodo`.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`. La siguiente versión es `?v=20261023a` (o `20261022h` si es el mismo día).
- **Saltos de línea:** editar con un script de Python en binario que respete CRLF/LF (`edit(p, pares)` con `assert count == 1`), escrito con la herramienta Write en el scratchpad. Ejecutar con `python -X utf8`. Al regenerar datos de la demo con regex, buscar los valores **en la misma línea** y no en todo `sembrarDemo()`: las claves se repiten entre casos (ya falló una vez en esta sesión).
- **Repo privado:** `git pull --ff-only` antes de tocarlo. El PDF de la guía del otro hospital queda sin commitear a propósito. Al marcar filas, el patrón debe exigir ⬜/🟡 en la segunda columna y no acabar en `$` (el archivo puede ir en CRLF).
- Al arreglar un hallazgo, marcar su fila en `AUDITORIA.md` (✅, fecha, nota y commit).

## 6. Verificación

1. `node --check app.js`.
2. Servidor `checklist` (preview_start) en `http://localhost:8099/?demo`: las seis etiquetas con `?v=20261022g` y la consola sin errores propios. Para cerrar la visita guiada, el botón «Ahora no». Pulsar «Restablecer demo» para cargar los casos con intensidad.
3. Cabecera a 360 px: `.barra-sup` mide ≈40 px y `--header-h` coincide. Con texto en `#guardado-aviso` mide ≈62 px. A 420 px vuelve a dos filas (≈73 px).
4. Contraste en azul y oscuro: `--fam-mot` = #f87171 y `--fam-ref` = #ea72ad. En oscuro, el `#btn-sync` de la demo es #d99a2b.
5. Gestión de Casos: las fechas de las filas en dd/mm/aaaa; el filtro «Desde» da el chip «Desde 05/01/2026». Las plantillas dicen «modificada 22/10/2026».
6. Registro, caso 2026-002:
   - Cabeceras: «SEP: intensidad (mA) · latencia (ms); resto: …» y «MEP: intensidad (mA/V) · umbral (mA/V); resto: …».
   - t-SEP MID: «Cierre 40 / –» y «int +43 % vs PostPos1».
   - Al abrir una fila de t-SEP, el editor dice «Intensidad (mA) · Latencia (ms)».
   - Con una `_amp` escrita a mano, aparece «(amp. 2,4 µV)».
7. Hoja impresa: sustituir `window.open` por un `<iframe>` de 794 px y pulsar `#registro-imprimir`. La hoja 1 mide ≤1045 px (1030 en 2026-002 y 1003 en 2026-005).
8. Repo del código: `git status -sb` limpio y `HEAD` igual que `origin/main`. Repo privado: filas marcadas y subido.
9. Pendiente de antes: C23 con un repo y un token **de prueba** (nunca los del hospital). Nunca verificado: GitHub real con dos dispositivos (C1, C3, C10, 409), el PDF impreso de verdad, la puerta de usuario en el móvil real y el segundo hospital.
