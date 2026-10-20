# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público del código; repo privado de datos en la carpeta hermana; aquí no se nombran hospitales, personas, números de caso ni repos de datos).
- Fase: **arreglos de la auditoría del 20-10-2026, a medias.** Hechos los bloques 1, 3 y 7 del plan, y parte del 2 y del 4. El código está en `?v=20261020z`, limpio y subido; no hay nada sin terminar.
- Piloto multihospital: el Sheet del hospital propio está hecho y con `Codigo.gs` repegado el 20-10. **Falta compartirlo**: acceso restringido, solo lectores, sin editores y sin descargar ni copiar. La consulta de protección de datos sigue pendiente. C23 y C24 ya están arreglados, pero **no se recogen pacientes reales hasta probar C23 con un repo de prueba y cerrar la consulta**.

## 2. Hecho en esta sesión (20/10/2026)

- **C23** (`app.js`, `subir()` y `subirAuto()`): si hay `estado.json` en la nube y el `sha` no coincide (también cuando no hay `sync.sha`), cuenta como choque «Elegir versión». «Guardar en la nube» pide confirmar y, si se cancela, deja el choque marcado. **Sin probar con un repo real.**
- **C24** (`app.js`, `tInputHoraCaso()`): con t0 provisional, `delta = tMinDeReloj(h, e)` y t0 = `e.ms + delta·60000`. Probado en la demo.
- **C26** (`app.js`, `tDuracionDeMinutos()`, llamada desde `guardarCaso()` en esquema 2): `duracion_min` = fin − inicio de los minutos guardados. Probado en la demo.
- **C22** (`app.js`, `ajustarCentroCaso()`): solo un caso nuevo fija el centro del dispositivo.
- **F20** (`index.html`, `style.css`, `app.js`): clase `.dlg-dato` en 11 mensajes de contexto, que se ven aunque las ayudas estén ocultas.
- **C32** (`CLAUDE.md`): fuera el código del hospital. Sigue en el historial de git.
- **T22** (`apps-script/Codigo.gs`): `columnasNumero` pasa a `Correlacion_long`. Repegado por Pani.
- **T23** (`app.js`): fuera las 15 claves `T()` de Exportar, Importar e Imprimir.
- **T24** (`app.js`, `style.css`): fuera `minutosEntre`, `centroTextoDe`, `regTecnicasCaso` y `espacioActivo`. `t0Quitar()` se llama ahora junto a `exactosBorrar()`, al vaciar la papelera y cuando un caso ya no está en la nube.
- **T25** (`data/i18n-en.js`): las 10 traducciones `en` que faltaban.
- **T26 + T8**, hecho con un subagente y revisado:
  - `CLAUDE.md`: el mapa usa «ver `grep`» en vez de números de línea; fuera la fila de copia completa.
  - `README.md`: Catálogos tiene 4 pestañas; Mis apuntes va siempre por «Archivo».
  - `data/guia.js:72`: el mismo cambio de Mis apuntes.
  - `AGENTS.md`: apartado nuevo sobre espacios, `CLAVES_GLOBALES` y seudonimización.
- Repo privado, `docs/AUDITORIA.md`: marcados C22, C23, C24, C26, F20, T8 y T22-T26 como ✅, y C32 como 🟡.
- Commits del código: a6fd2cb, c89a15b, 7ee5a30, f83f94a, d456c7e y 75facfd.

## 3. Siguiente paso exacto

Abrir el «Informe de la auditoría del 20-10-2026» en `../checklist-mio-datos/docs/AUDITORIA.md` (apartado 5, plan) y hacer **C27**: «Guardar como plantilla…» propone `nombre_caso` como nombre de la plantilla, y ese nombre sube al repo. Hay que proponer un nombre que no sea dato exacto (p. ej., el diagnóstico o la intervención y el equipo) y comprobar que `nombre_caso` no llega a `montajes/`. Hay que buscar el código con `grep -n "guardarMontajeComoPlantilla" app.js`.

Después, sin decisiones pendientes y en este orden:
1. Marcar **C33** como ✅: este archivo ya no lleva números de caso.
2. **T28**: la columna se llama `fecha` en el CSV y `Fecha` en el Sheet.
3. **F29** y **F36**.
4. **F21**, **F15**, **F32** y **F33**.
5. **F27**, **F28**, **F34** y **F26**.
6. **T27**.
7. **E9-E13**, **F31** y **F11**.

Antes de cualquier hallazgo que esté en la sección 4, hay que preguntar a Pani.

## 4. Decisiones abiertas (esperan a Pani)

- C25: cómo proteger lo exacto y las fotos, que solo viven en el dispositivo y no tienen copia (`persist()`, aviso, papelera).
- C26, segunda parte: alinear «Hora inicio/Fin MIO» del Registro con las horas de la ficha. Hoy la duración ya se recalcula al guardar.
- C28: ids de usuario opacos, o basta con las iniciales.
- C29: olvidar el acceso de «Archivo» desde cualquier espacio.
- C30: si CCEP se registra con tira o con grid (meterlo en `REG_TEC_GRID`).
- C31: informe PDF seudónimo para enviar fuera.
- C32: reescribir la historia de git para quitar nombres antiguos.
- C34: fijar `Codigo.gs` a una etiqueta o a un sha del repo del código.
- F22: dónde va «Restablecer» y cómo se llama.
- F23: quitar «Guardar plantilla».
- F24: «Cerrar caso» con confirmación, o renombrado.
- F25: si H-R Sóleo en Técnicas y en Reflejos medulares es lo mismo.
- F30: si «¿Quién eres?» deja de usar `prompt()` y admite nombre además de iniciales (confirmar antes de cambiarlo).
- T24, menor: renombrar las clases `.sync-personal-*`, que siguen en uso con el nombre viejo.
- Piloto: con quién se comparte el Sheet; consulta al delegado de protección de datos de cada hospital.
- Pendientes de antes:
  - retirar del todo intervenciones y perfiles (aparcado, opción B);
  - columnas `creado_por`/`editado_por` en el Sheet;
  - Sheet viejo con `CONGELADO = 1`;
  - espacio vacío de más;
  - casos con datos dudosos (están en el diario privado).

## 5. Restricciones activas

- **Aislamiento entre hospitales:**
  - toda clave nueva de `localStorage` se prefija; solo va a `CLAVES_GLOBALES` si es una preferencia del dispositivo; nunca `window.localStorage` directo;
  - lo exacto (fecha, edad, personal, `t0`, horas reales) no entra en `estado.json`, `casos/`, montajes ni en el Sheet;
  - un repo de datos por hospital; nunca el token de uno en el Sheet de otro.
- **El repo del código es PÚBLICO.** No lleva precios, números de caso reales, nombres de personas, nombres ni códigos de hospitales, ni nombres de repos de datos: tampoco en este archivo, en `CLAUDE.md` ni en `Codigo.gs`.
- **Casos y datos que no se tocan:**
  - los casos de esquema 1 están congelados: se leen, pero no se reescriben ni se migran;
  - los ids no cambian nunca;
  - candado en los casos cerrados;
  - la hoja impresa 1 mide como mucho ≈1045 px.
- Exportar/Importar copia e Imprimir se retiraron por decisión expresa: no se vuelven a poner. Intervenciones y perfiles quedan ocultos; sus claves `T()` no se borran.
- **Estilo:** botones rectangulares, casillas de ≈30 px, sin foco automático en el móvil, radios `var(--r)`. Código en ES5, textos con `T()` y su `en`, DOM con `createElement`.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`. La siguiente versión es `?v=20261021a` (o la letra que toque ese día).
- **Saltos de línea:** el `sed -i` de Git Bash deja los archivos en LF. Git los normaliza, pero `data/i18n-en.js` tiene saltos mixtos: se edita con Python en binario. Los scripts largos van al scratchpad.
- **Repo privado:** `git fetch` y `pull --ff-only` antes de tocarlo. El PDF de la guía del otro hospital queda sin commitear a propósito.
- Al arreglar un hallazgo, marcar su fila en `AUDITORIA.md` (✅, fecha, nota y commit).
- **Sesión principal:**
  - delega lo que toque 3 archivos o más, o necesite lecturas grandes;
  - revisa el diff y verifica antes de subir;
  - si el subagente comparte `index.html`, el `?v=` se sube una sola vez al final.

## 6. Verificación

1. `node --check app.js`, `node --check data/guia.js` y `node --check data/i18n-en.js`. Para `Codigo.gs`: copiarlo a `.js` en el scratchpad y pasarle `node --check`.
2. Servidor `checklist` (preview_start) en `http://localhost:8099/?demo`: las seis etiquetas con el `?v=` nuevo y la consola sin errores propios. El servidor se define en `C:\Claude Code mio-checklist\.claude\launch.json`, que apunta a un `servidor.js` de un scratchpad antiguo; si ese archivo desaparece, hay que crear otro.
3. C24 y C26 en la demo: escribir en `localStorage` (prefijo `mio_ionm_demo__`) un t0 provisional de ayer y `hora_fin_min`, abrir el caso, escribir la hora de inicio y guardar. Los minutos no deben saltar ±1440 y `duracion_min` debe ser fin − inicio. «Restablecer demo» deja los casos ficticios como estaban.
4. C23, pendiente: con un repo y un token **de prueba** (nunca los del hospital) que ya tengan `estado.json`, conectar desde un almacén vacío y pulsar «Guardar en la nube». Debe pedir elegir versión y no subir. Probar también con un repo vacío, donde sí debe subir.
5. F20: con las ayudas ocultas, `#aplicar-plantilla-msg`, `#elegir-destino` y el texto de «¿Quién eres?» tienen `display` distinto de `none`.
6. Repo del código: `git status -sb` limpio y `git rev-parse HEAD origin/main` iguales. Repo privado: `AUDITORIA.md` con las filas marcadas y subido.
7. Nunca verificado:
   - GitHub real con dos dispositivos (C1, C3, C10 y el conflicto 409);
   - el PDF impreso de verdad;
   - la puerta de usuario en el móvil real;
   - el segundo hospital.
