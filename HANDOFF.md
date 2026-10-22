# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público del código; repo privado de datos en la carpeta hermana; aquí no se nombran hospitales, personas, números de caso ni repos de datos).
- Fase: **arreglos de la auditoría del 20-10-2026, a medias.** Hechos los bloques 1, 3 y 7 del plan, y parte del 2, el 4 y el 6 (ver sección 2). El código está en `?v=20261021d`, limpio y subido; no hay nada sin terminar.
- Piloto multihospital: el Sheet del hospital propio está hecho y con `Codigo.gs` repegado el 20-10. **Falta compartirlo**: acceso restringido, solo lectores, sin editores y sin descargar ni copiar. La consulta de protección de datos sigue pendiente. C23 y C24 ya están arreglados, pero **no se recogen pacientes reales hasta probar C23 con un repo de prueba y cerrar la consulta**.

## 2. Hecho en esta sesión

- **C27** (`app.js`, `guardarMontajeComoPlantilla()`): el nombre propuesto es «diagnóstico — intervención — equipo» (`opcionTexto`, `intervencionDe`, `nombreEquipo(equipoDe(caso))`); nunca `nombre_caso`. Probado en la demo: ni la sugerencia ni la plantilla guardada llevan el nombre del caso. Commit f085aa9.
- **C33**: marcado ✅ (este archivo ya no lleva números de caso; siguen en el historial de git, como C32).
- **T28** (`app.js`, `COLUMNAS_CSV_CASOS` y `valorCsvDeCaso()`): la columna del CSV pasa de `fecha` a `Fecha`; la cabecera del CSV de casos es idéntica a la de la hoja `Casos` de `Codigo.gs`. No hace falta repegar `Codigo.gs`. Commit 7b2a6e2.
- **F29** (`index.html`, `app.js`): en el diálogo ☁ sin conectar, línea `#sync-sin-conectar` (clave `sync_sin_conectar`, «te lo da quien administra la app en tu hospital… pulsa «Traer de la nube»»). En `pintarDlgSync()`, «Guardar» y «Traer» se apagan hasta tener repositorio y token (marca `data-falta-conexion`, para no reactivar lo que apaga el modo de solo lectura); se repinta con `input` en `#sync-repo` y `#sync-token`. Commit 8ca026c.
- **F36** (`app.js`): en la ficha, una sola leyenda `.leyenda-texto-libre` encima de los apartados (antes nueve, una por apartado), en `.caso-scroll`. Texto nuevo de `txt_leyenda_libre`: «En los textos libres, no escribir…». Clave nueva `reg_espejo_tit` como `title` de las cuatro marcas ⇄ (check y etiqueta en `regControl`, cabecera de umbrales por raíz, «Técnicas con alteración»). En el Registro siguen dos leyendas (pantalla y hoja de apuntar). Commit de F36 tras 8ca026c.
- Repo privado, `docs/AUDITORIA.md`: marcados C27, C33, T28, F29 y F36 como ✅ (20-10-2026).

## 3. Siguiente paso exacto

Abrir `../checklist-mio-datos/docs/AUDITORIA.md` (filas de F21, F15, F32 y F33 en la tabla de seguimiento y en la tabla detallada, apartado 5) y hacer ese bloque: **F21, F15, F32 y F33** (Organizador y Catálogos). Leer cada fila y buscar el código con `grep`; no leer `app.js` entero.

Después, en este orden:
1. **F27**, **F28**, **F34** y **F26** (ficha).
2. **T27**.
3. **E9-E13**, **F31** y **F11**.

Antes de cualquier hallazgo que esté en la sección 4, hay que preguntar a Pani.

## 4. Decisiones abiertas (esperan a Pani)

- **Nuevas de esta sesión:**
  - F36: en el Registro quedan dos leyendas de texto libre (pantalla y hoja de apuntar). ¿Dejar solo una?
  - Textos nuevos: la leyenda «En los textos libres, no escribir…» y la línea del ☁ sin conectar. Pani puede querer otras palabras.
- C25: cómo proteger lo exacto y las fotos, que solo viven en el dispositivo y no tienen copia (`persist()`, aviso, papelera).
- C26, segunda parte: alinear «Hora inicio/Fin MIO» del Registro con las horas de la ficha.
- C28: ids de usuario opacos, o basta con las iniciales.
- C29: olvidar el acceso de «Archivo» desde cualquier espacio.
- C30: si CCEP se registra con tira o con grid (meterlo en `REG_TEC_GRID`).
- C31: informe PDF seudónimo para enviar fuera.
- C32: reescribir la historia de git para quitar nombres antiguos (afecta también a C33).
- C34: fijar `Codigo.gs` a una etiqueta o a un sha del repo del código.
- F22: dónde va «Restablecer» y cómo se llama.
- F23: quitar «Guardar plantilla».
- F24: «Cerrar caso» con confirmación, o renombrado.
- F25: si H-R Sóleo en Técnicas y en Reflejos medulares es lo mismo.
- F30: si «¿Quién eres?» deja de usar `prompt()` y admite nombre además de iniciales.
- T24, menor: renombrar las clases `.sync-personal-*`, que siguen en uso con el nombre viejo.
- Piloto: con quién se comparte el Sheet; consulta al delegado de protección de datos de cada hospital.
- Pendientes de antes: retirar del todo intervenciones y perfiles (aparcado, opción B); columnas `creado_por`/`editado_por` en el Sheet; Sheet viejo con `CONGELADO = 1`; espacio vacío de más; casos con datos dudosos (están en el diario privado).

## 5. Restricciones activas

- **Aislamiento entre hospitales:**
  - toda clave nueva de `localStorage` se prefija; solo va a `CLAVES_GLOBALES` si es una preferencia del dispositivo; nunca `window.localStorage` directo;
  - lo exacto (fecha, edad, personal, `t0`, horas reales, `nombre_caso`) no entra en `estado.json`, `casos/`, `montajes/` ni en el Sheet;
  - un repo de datos por hospital; nunca el token de uno en el Sheet de otro.
- **El repo del código es PÚBLICO.** No lleva precios, números de caso reales, nombres de personas, nombres ni códigos de hospitales, ni nombres de repos de datos: tampoco en este archivo, en `CLAUDE.md` ni en `Codigo.gs`.
- **Casos y datos que no se tocan:** los casos de esquema 1 están congelados (se leen, no se reescriben ni se migran); los ids no cambian nunca; candado en los casos cerrados; la hoja impresa 1 mide como mucho ≈1045 px.
- Exportar/Importar copia e Imprimir se retiraron por decisión expresa: no se vuelven a poner. Intervenciones y perfiles quedan ocultos; sus claves `T()` no se borran.
- El CSV de casos y la hoja `Casos` de `Codigo.gs` son la misma tabla: si cambia una cabecera, cambiar las dos.
- Botones apagados por el modo de solo lectura (`SOLO_LECTURA_IDS`): ningún arreglo los reactiva (ver la marca `data-falta-conexion` de F29).
- **Estilo:** botones rectangulares, casillas de ≈30 px, sin foco automático en el móvil, radios `var(--r)`. Código en ES5, textos con `T()` y su `en` (en el propio diccionario), DOM con `createElement`. Los mensajes de contexto de un diálogo llevan `.dlg-dato` o una clase que no oculte `body.sin-ayudas`.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`. La siguiente versión es `?v=20261022a` (la letra que toque ese día).
- **Saltos de línea:** las ediciones se hacen con un script de Python en binario que detecta CRLF/LF y lo respeta (modelo en el scratchpad: función `edit(p, pares)` con `assert count == 1`). `data/i18n-en.js` tiene saltos mixtos.
- **Repo privado:** `git fetch` y `pull --ff-only` antes de tocarlo. El PDF de la guía del otro hospital queda sin commitear a propósito.
- Al arreglar un hallazgo, marcar su fila en `AUDITORIA.md` (✅, fecha, nota y commit).
- **Sesión principal:** delega lo que toque 3 archivos o más, o necesite lecturas grandes; revisa el diff y verifica antes de subir; si el subagente comparte `index.html`, el `?v=` se sube una sola vez al final.

## 6. Verificación

1. `node --check app.js`, `node --check data/guia.js` y `node --check data/i18n-en.js`. Para `Codigo.gs`: copiarlo a `.js` en el scratchpad y pasarle `node --check`.
2. Servidor `checklist` (preview_start) en `http://localhost:8099/?demo`: las seis etiquetas con el `?v=` nuevo y la consola sin errores propios.
3. C27: abrir un caso de la demo → «Editar montaje» → sustituir `window.prompt` para capturar el valor por defecto → pulsar `#barra-caso-guardar-plantilla`. La sugerencia no lleva el «Demo · …» de `nombre_caso`. «Restablecer demo» después.
4. T28: interceptar `Blob` (una sola vez, sin recargar encima otra intercepción) y pulsar `#btn-exportar-casos-csv`: la cabecera empieza por `caso_uid,ID_Caso,estado,motivo_cancelacion,Fecha,…` y la fecha va en mes.
5. F29: sin `?demo` (en la demo el ☁ no abre), pulsar `#btn-sync` sin conexión: `#sync-sin-conectar` visible, `#sync-subir` y `#sync-bajar` apagados hasta escribir repositorio y token. No guardar nada.
6. F36: la ficha de un caso tiene un solo `.leyenda-texto-libre` (hijo de `.caso-scroll`); en el Registro, con un caso elegido, las etiquetas con ⇄ llevan `title`.
7. Repo del código: `git status -sb` limpio y `git rev-parse HEAD origin/main` iguales. Repo privado: `AUDITORIA.md` con las filas marcadas y subido.
8. Pendiente de antes: C23 con un repo y un token **de prueba** (nunca los del hospital): desde un almacén vacío, «Guardar en la nube» sobre un repo con `estado.json` debe pedir elegir versión y no subir; con un repo vacío sí sube.
9. Nunca verificado: GitHub real con dos dispositivos (C1, C3, C10 y el conflicto 409); el PDF impreso de verdad; la puerta de usuario en el móvil real; el segundo hospital.
