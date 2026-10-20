# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público del código; repo privado de datos en la carpeta hermana; aquí no se nombran hospitales, personas, números de caso ni repos de datos).
- Fase: **arreglos de la auditoría del 20-10-2026 — sin empezar.** La auditoría está **cerrada** y subida (informe vivo `docs/AUDITORIA.md` del repo privado, sección «Informe de la auditoría del 20-10-2026» al final, con tabla, detalle y plan en 10 bloques). El código está en `?v=20261020v`, limpio y subido; nada a medias.
- Piloto multihospital: Sheet del hospital propio hecho; **falta compartirlo** (Restringido, solo Lectores, sin editores, sin descargar/copiar). Consulta de protección de datos pendiente. **No recoger pacientes reales hasta cerrar C23 y C24 y la consulta.**

## 2. Hecho en esta sesión (20/10/2026)

- Reauditoría con Opus (dos subagentes de solo lectura: código y navegador a 360 px) sobre 64 commits desde el 09-10. Verificados a mano en el código C23, C24, F20, T22 y C32.
- Repo privado, `docs/AUDITORIA.md`: seguimiento al día (C6 ➖, C22 sube a media, F11 y T8 vuelven a 🟡, F15 empeora), 43 filas nuevas ⬜ (C23-C34, F20-F38, T22-T28, E9-E13), informe y fila de historial. Commit 2e81273.
- Repo del código: solo este `HANDOFF.md` (quitados los números de caso reales que había, hallazgo C33).

## 3. Siguiente paso exacto

Leer en `../checklist-mio-datos/docs/AUDITORIA.md` el «Informe de la auditoría del 20-10-2026» (apartados 2, 3 y 5) y empezar por el **bloque 1 del plan: C23 y C24** (ambos alta, esfuerzo S):
- **C23**: en `subir()` (`app.js:4673`) y `subirAuto()` (`app.js:4726`), «remoto existe y sin `sync.sha`» debe pasar por la elección de versión, nunca subir directo. Probar con un repo de prueba con `estado.json` y otro vacío.
- **C24**: en `tInputHoraCaso()` (`app.js:18720-18724`), rama t0 provisional + `hora_inicio`: `delta = tMinDeReloj(h, e)` y t0 = `e.ms + delta·60000` en vez de `tMsDeReloj(h)` (fecha de hoy). Reproducirlo antes en la demo (Registro con «Ahora» un día, ficha otro).
Después, por orden: C26 + C22; F20 (clase aparte para `.dlg-intro` esenciales); C32 (quitar el código del hospital de `CLAUDE.md:399` y `408`); T22 (+ volver a pegar `Codigo.gs`); limpieza y docs (T23-T26, T8); el resto del plan. Antes de cada bloque que dependa de una decisión, preguntar a Pani (sección 4).

## 4. Decisiones abiertas (esperan a Pani)

- **De la auditoría del 20-10:**
  - C25: ¿cómo proteger lo exacto y las fotos, que solo viven en el dispositivo y ya no tienen copia? (`persist()`, aviso, papelera).
  - C28: ¿ids de usuario opacos o basta con iniciales?
  - C31: ¿informe PDF seudónimo para enviar fuera?
  - C32: ¿reescribir la historia de git para quitar nombres antiguos?
  - C34: ¿fijar `Codigo.gs` a una etiqueta o sha del repo del código?
  - C29: ¿olvidar el acceso de «Archivo» desde cualquier espacio?
  - C30: ¿CCEP se registra con tira o grid (meterla en `REG_TEC_GRID`)?
  - F22: ¿dónde va «Restablecer» y cómo se llama?
  - F23: ¿quitar «Guardar plantilla»?
  - F24: ¿«Cerrar caso» con confirmación o renombrado?
  - F25: ¿H-R Sóleo en Técnicas y en Reflejos medulares es lo mismo?
- **Piloto:** compartir el Sheet y con quién; consulta al delegado de protección de datos de cada hospital.
- **Ya abiertas antes:**
  - Retirar del todo intervenciones/perfiles: aparcado (opción B).
  - Columnas `creado_por`/`editado_por` en el Sheet.
  - Alinear «Hora inicio/Fin MIO» del Registro con la ficha (enlaza con C26).
  - Sheet viejo con `CONGELADO = 1`.
  - Espacio de más vacío.
  - Casos con datos dudosos: están en el diario privado.
  - Pendientes de interfaz e ideas sin pedir.

## 5. Restricciones activas

- **Aislamiento entre hospitales:** toda clave nueva de `localStorage` se prefija por defecto; solo va a `CLAVES_GLOBALES` si es preferencia de dispositivo; nunca `window.localStorage` directo. Lo exacto (fecha, edad, personal, `t0`, horas reales) no entra en `estado.json`, `casos/`, montajes ni en el Sheet. Un repo de datos distinto por hospital; nunca el token de uno en el Sheet de otro.
- **Repo del código PÚBLICO** (el Apps Script lo lee sin token). Sin precios, números de caso reales, nombres de personas ni apodos, nombres o códigos de hospitales ni nombres de repos de datos: tampoco en este archivo, `CLAUDE.md` ni `Codigo.gs`.
- **Casos esquema 1** (los antiguos) congelados: se leen igual, no se reescriben ni se migran. Ids que nunca cambian. Candado de casos cerrados. Hoja impresa 1 ≤ ≈1045 px.
- Exportar/Importar copia retirados por decisión expresa (no volver a ponerlos); intervenciones/perfiles ocultos, no borrar sus claves `T()`.
- Estilo de interfaz: botones rectangulares, casillas ≈30 px, sin foco automático en el móvil, radios `var(--r)`. Código: ES5, textos con `T()` y su `en`, DOM con `createElement`.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`. Scripts largos en el scratchpad.
- Repo privado: `git fetch` + `pull --ff-only` antes de tocarlo; el PDF de la guía del otro hospital queda sin commitear a propósito.
- Al arreglar un hallazgo, marcar su fila en `AUDITORIA.md` (✅, fecha, nota, commit).
- Sesión principal: delegar lo que toque 3+ archivos o lecturas grandes; revisar el diff y verificar antes de subir. Respuestas en castellano, paso a paso, sin jerga de GitHub. Si un cambio de `Codigo.gs` hace falta, al usuario se le da el archivo entero.

## 6. Verificación

1. `node --check app.js` y `node --check data/guia.js`. `Codigo.gs` se comprueba copiándolo a `.js` en el scratchpad y pasando `node --check`.
2. Servidor `checklist` (preview_start) en `http://localhost:8099/?demo` a 360 px: las seis etiquetas con el `?v=` nuevo y la consola sin errores propios.
3. C23: con un repo de prueba que ya tenga `estado.json`, conectar desde un almacén vacío y pulsar «Guardar en la nube». Debe pedir elegir versión y no subir. Hay que usar repos y tokens de prueba, nunca los del hospital.
4. C24: Registro con «Ahora» un día y hora de inicio de la ficha escrita otro día. `hora_inicio_min` y los minutos de los eventos no deben saltar ±1440.
5. F20: con las ayudas ocultas, «Cargar plantilla» sigue diciendo cuántas entradas borra o rellena.
6. Repo del código: `git status -sb` limpio y `git rev-parse HEAD origin/main` iguales. Repo privado: `AUDITORIA.md` con las filas marcadas y subido.
7. Nunca verificado:
   - GitHub real con dos dispositivos (C1, C3, C10, conflicto 409).
   - PDF impreso real.
   - Puerta de usuario en el móvil real.
   - El segundo hospital.
