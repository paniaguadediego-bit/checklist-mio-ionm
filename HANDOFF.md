# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público del código; repo privado de datos en la carpeta hermana; aquí no se nombran hospitales, personas, números de caso ni repos de datos).
- Fase: **auditoría del 20-10-2026 casi cerrada.** Quedan 9 filas abiertas en `AUDITORIA.md` (repo privado), todas esperando decisión de Pani (sección 4). El código está en `?v=20261022j`, limpio y subido; no hay nada a medias. Documentación al día («actualiza todo» del 22-10-2026).
- Piloto multihospital: sin cambios. El Sheet del hospital propio está hecho, pero **falta compartirlo** (solo lectores, sin editores, sin descargar ni copiar). La consulta de protección de datos sigue pendiente. **No se recogen pacientes reales hasta probar C23 con un repo de prueba y cerrar esa consulta.**

## 2. Hecho en esta sesión (22-10-2026)

- Primera parte (ver diario privado): E9-E13, F11, F31, fechas dd/mm/aaaa (E12) e **intensidad en las basales de t-SEP, c-SEP, t-MEP y c-MEP**.
- Decisiones de Pani aplicadas (commits b9f09f5 y 79979ac, `?v=20261022h` e `i`):
  - **F23**: `#btn-guardar-montaje` oculto con `hidden` (el código y el diálogo siguen).
  - **F24**: «Cerrar caso» confirma siempre (`caso_cerrar_confirmar`); si falta algo, el aviso de siempre.
  - **F26**: «Criterio de alarma» en los parámetros de técnicas (solo el texto).
  - **F34**: `.caso-ir-registro-dentro` a 0.78rem, como «Borrador del resumen».
  - **F22**: `#btn-restablecer` al final de `#dlg-catalogos`, a la izquierda de Cerrar; texto «Borrar plantillas y volver a fábrica…».
  - **F25**: en la hoja de evento/alarma, con `hr_popliteo` en el caso, fuera «H-R Sóleo D/I» de Técnicas (filtro junto a los de Blink y RBC); queda el H-R de Reflejos medulares. Las filas de basales no cambian.
  - **F30**: `#dlg-usuario-nuevo` (nombre opcional + iniciales obligatorias, en mayúsculas) sustituye al `prompt()`; campo `iniciales` opcional en el usuario; `nombreCortoUsuario()` (cabecera y autoría) y `nombreLargoUsuario()` («Nombre (INI)», listas de la puerta); campo Iniciales en Catálogos → Usuarios; cambiar de usuario en `#perfil-usuario` pide `perfil_usuario_cambiar_conf`. Los usuarios de antes se ven igual.
- **Datos (no es código)**: copias Cadwell de las 14 plantillas de Inomed del espacio «Archivo» en el repo de datos del hospital con Cadwell, con «(Cadwell)» en el nombre y una nota de revisión en cada una; las de Inomed se quedan. Detalle y convenciones en el diario privado. Pani las revisará en la app (filtro «Equipo» → «Todos» para ver ambas).
- `AUDITORIA.md`: F22, F23, F24, F25 y F30 ✅; notas añadidas en F26 y F34.

## 3. Siguiente paso exacto

Preguntar a Pani por las decisiones abiertas de la sección 4, todas juntas. Si pide algo nuevo, eso va primero. Si comenta algo de las plantillas Cadwell, corregirlas en el repo de datos del hospital (no en el código).

## 4. Decisiones abiertas (esperan a Pani)

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
- T24, menor: renombrar las clases `.sync-personal-*`.
- F11, efecto secundario: a 360 px el selector de perfil se queda en ≈70 px. Con iniciales cabe (ahora la cabecera enseña las iniciales).
- Plantillas Cadwell, para revisar con Pani: femoral derecho en la ES1 del módulo 4 (LOE Med T2-T3), `l_v3` repetido en el original de «MAV – tronco», cremáster duplicado en el original de «D-Wave + BCR», salidas del LCSwap en las tres con estimulación directa por grid, puentes de Inomed quitados.
- Piloto: con quién se comparte el Sheet; consulta al delegado de protección de datos de cada hospital.
- Pendientes de antes: retirar del todo intervenciones y perfiles (aparcado, opción B); columnas `creado_por`/`editado_por` en el Sheet; Sheet viejo con `CONGELADO = 1`; espacio vacío de más; casos con datos dudosos (están en el diario privado).

## 5. Restricciones activas

- **Aislamiento entre hospitales:** toda clave nueva de `localStorage` se prefija (se usa el `localStorage` envuelto, nunca `window.localStorage` directo). Lo exacto (fecha, edad, personal, `t0`, horas reales, `nombre_caso`) no sale del dispositivo. Un repo de datos por hospital.
- **El repo del código es PÚBLICO:** sin precios, números de caso, nombres de personas, ni nombres o códigos de hospitales o de repos de datos (tampoco aquí ni en `CLAUDE.md`).
- **Ids que no cambian nunca:** en basales, `_amp` se sigue leyendo aunque ya no tenga casilla en SEP/MEP. Un cambio de texto no toca ids ni columnas del CSV o del Sheet. `perfil_usuario_pide` queda sin uso (no se borra).
- **Casos y datos que no se tocan:** los casos de esquema 1 están congelados; candado en los casos cerrados (`casoBloqueado(c)`).
- **Hoja impresa:** la hoja 1 mide como mucho ≈1045 px (1030 en 2026-002 de la demo); no hay margen para alargar los títulos de basales.
- **Decisiones de Pani que siguen en pie:** barra de la ficha en una fila; el filtro de equipo recuerda el último usado; Exportar/Importar copia e Imprimir no vuelven; intervenciones y perfiles ocultos sin borrar sus claves `T()`; cabecera de dos filas a ≥400 px y una por debajo; fechas a la vista dd/mm/aaaa; intensidad «fuerte» desde +50 %; las de la sección 2.
- **Plantillas Cadwell** (convención de Pani): sin conmutador; motores en el TCS H1 C1, H2 C2, H3 C3, H4 C4, H5 Cz-1, H6 Cz+6; Fz en E13; grid en el amplificador de 32.
- Botones apagados por el modo de solo lectura (`SOLO_LECTURA_IDS`): ningún arreglo los reactiva.
- **Estilo:** botones rectangulares, casillas de ≈30 px, sin foco automático en el móvil (`enfocarSinTeclado()`), radios `var(--r)`. Código en ES5, textos con `T()` y su `en`, DOM con `createElement`/`regNodo`.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`. La siguiente es `?v=20261023a` (o `20261022k` si es el mismo día).
- **Saltos de línea:** editar con un script de Python en binario que respete CRLF/LF (`edit(p, pares)` con `assert count == 1`), escrito con Write en el scratchpad; `python -X utf8`.
- **Repos de datos:** `git pull --ff-only` antes de tocarlos. El PDF de la guía del otro hospital queda sin commitear a propósito. Al marcar filas de `AUDITORIA.md`, el patrón exige ⬜/🟡 en la segunda columna y no acaba en `$` (CRLF). Un clon nuevo no tiene identidad de git: copiar `user.name`/`user.email` del repo de datos de siempre, solo en ese clon.

## 6. Verificación

1. `node --check app.js` y `node --check data/guia.js`.
2. Servidor `checklist` (preview_start) en `http://localhost:8099/?demo`: las seis etiquetas con `?v=20261022j` y la consola sin errores propios.
3. Organizador: sin «Guardar plantilla». Catálogos: «Borrar plantillas y volver a fábrica…» al final, junto a Cerrar (a 360 px cabe en una fila, el botón en dos líneas).
4. Ficha de un caso abierto: «Cerrar caso» pide confirmación (con y sin campos vacíos); «Abrir en el Registro» y «Borrador del resumen» de 32 px.
5. Registro del caso 2026-008: en «+ Evento», un solo «H-R Sóleo», en Reflejos medulares.
6. «+ Añadir usuario…»: sin iniciales da «Escribe tus iniciales.»; con nombre e iniciales, la cabecera enseña las iniciales; cambiar de usuario pide confirmación. Al terminar, «Restablecer demo».
7. Repo del código: `git status -sb` limpio y `HEAD` igual que `origin/main`. Repo privado: filas marcadas y subido.
8. Pendiente de antes: C23 con un repo y un token **de prueba** (nunca los del hospital). Nunca verificado: GitHub real con dos dispositivos (C1, C3, C10, 409), el PDF impreso de verdad, la puerta de usuario en el móvil real y el segundo hospital.
