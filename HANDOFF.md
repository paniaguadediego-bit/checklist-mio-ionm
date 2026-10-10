# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público `checklist-mio-ionm` y repo privado de datos `../checklist-mio-datos`).
- Fase: **decisiones abiertas de la auditoría del 09-10 resueltas** (F10, F14 y detalles sueltos). **Fase cerrada**; no hay nada a medias. Todo subido en los dos repos.
- Versión actual: `?v=20261010f` (seis etiquetas de `index.html`). El último commit (`133573f`) solo cambia un comentario de `app.js` y no sube el `?v=`.

## 2. Hecho en esta sesión

Cada cambio tiene su entrada en `../checklist-mio-datos/docs/DIARIO-CODIGO.md`. F14 está marcado ✅ en `../checklist-mio-datos/docs/AUDITORIA.md`.

- **F14** (`907b655`): tras «Crear caso» → equipo, si hay plantillas de ese equipo sale «¿Cargar una plantilla?» (`ofrecerPlantillaCasoNuevo(uid, eq)`, diálogo creado por JS, claves `caso_nuevo_plantilla_*`).
  - «Elegir plantilla…» → `iniciarCargaPlantilla(false)`, la misma vía y la misma confirmación «Aplicar» que en la ficha. «Ahora no» deja la ficha vacía.
  - Sin plantillas de ese equipo no pregunta. Pasa de ~9 toques a 5. Archivo: `app.js`.
- **F10** (`907b655`): «Empezar de nuevo» (`.rr-de-antes-btn`) solo con borde y texto tenue. Archivo: `style.css`.
- **Detalles** (`907b655`):
  - Tarjeta «Técnicas IONM» en la Guía, tras Biblioteca, con el aviso de que no sale en la demo (`data/guia.js`).
  - `reflejo_h` nombra H-R Cuádriceps (`data/surgeries.js`, `data/i18n-en.js`).
  - Radios de `.rr-barra-apuntar`, `.rr-hoja` y `.caja-tab` a `var(--r)` (`style.css`).
  - Números de línea del mapa del código comprobados el 10-10 (`CLAUDE.md`).
- **Textos** (`ca9e972`, `app.js`):
  - `casos_nuevo_cero_ay` menciona la pregunta de plantilla.
  - `caso_editado_veces` ya no dice «tras el cierre»: `editado_en` cuenta todas las ediciones desde la creación.
- **Comentario** de `REG_BASALES_SENS` (`133573f`): cuatro columnas y claves `e_<fila>_<col>_<medida>`.

## 3. Siguiente paso exacto

Preguntar al usuario qué quiere abordar ahora. No hay ninguna tanda aprobada pendiente. Le toca probar en el móvil la pregunta de plantilla al crear un caso y el botón «Empezar de nuevo».

## 4. Decisiones abiertas (esperan al usuario)

- **C22** (centro del dispositivo al guardar un caso): espera al multicéntrico.
- Vistas por el subagente de F14, sin preguntar todavía:
  - ¿Abrir directamente el selector de plantillas en vez de la pregunta previa? Ahorra un toque.
  - ¿Quitar la confirmación «Aplicar» cuando el caso está vacío? Serían 4 toques; hoy la regla es «la confirmación con números, siempre».
- Siguen aparcados: MAV, punto 7 (nube), bloque 4 de textos, multicéntrico, privacidad al sacar los datos y tiendas de apps.

## 5. Restricciones activas

- Los ids no cambian nunca; las filas renombradas conservan lo escrito con `antigua: true`. Los campos del GRID siguen siendo `grid1_*`/`grid2_*` (rótulos A/B).
- GRID: umbrales en Basales; electrodo, músculos, sensitivo e inversión en Mapeo. No duplicar campos entre los dos.
- **Candado**: todo lo que escriba en un caso comprueba `estado === "cerrado"`, salvo Reabrir. `ofrecerPlantillaCasoNuevo()` tampoco ofrece nada en un caso cerrado.
- Técnicas IONM no se enseña en la demo (decisión del usuario del 27-09): `tile-tecnicas-mio` está oculto en `prepararDemo()`.
- Hoja impresa: hoja 1 ≤ ≈1045 px. No añadir nada a la hoja 1 sin medir.
- Botones rectangulares, cambios sutiles, casillas de unos 30 px, sin foco en inputs de texto en el móvil. Radios con `var(--r)`; el Simulador conserva los suyos.
- ES5 (`var`, sin flechas). Textos con `T()` y su `en`. DOM con `createElement`.
- Repo público: sin precios, números de caso reales, nombres (ni apodos) ni centro.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`.
- Scripts de Python en el scratchpad (la ruta real es `C:\Users\pablo\AppData\Local\Temp\claude\...`; `$TEMP/../claude` no existe), con `python archivo.py < /dev/null` y `newline=""`. `data/guia.js` va en CRLF: si un script busca `\n`, falla; mejor usar Edit. Nada de `sed -i` por número de línea.
- Repo privado: `git pull --ff-only` antes de tocarlo y `git fetch` antes del push.
- Sesión principal: orquestar y delegar en subagentes; revisar su diff y verificar. Si un subagente toca `app.js`, los números de línea de `CLAUDE.md` se corrigen después.

## 6. Verificación

1. `node --check app.js`
2. Servidor `checklist` (preview_start) en `http://localhost:8099/?demo`, a 375 px. Las seis etiquetas cargan con `?v=20261010f`; consola sin errores.
3. Gestión de Casos → Crear caso → Inomed: sale «¿Cargar una plantilla?».
   - «Ahora no» deja la ficha vacía.
   - «Elegir plantilla…» muestra solo plantillas Inomed; con «Aplicar» se carga el montaje.
   - Con Genérico, sin plantillas en la demo, no pregunta nada.
4. La ayuda bajo «Crear caso» dice «te ofrece cargar una». El pie de una ficha editada dice «Editado n vez/veces · última: …», sin «tras el cierre».
5. Guía: tarjeta «Técnicas IONM» tras Biblioteca de montajes.
6. `getComputedStyle` de `.rr-hoja`: `border-radius` 5px arriba; `.rr-de-antes-btn`: fondo transparente.
7. Al terminar, «Restablecer demo» si se ha tocado el localStorage.
