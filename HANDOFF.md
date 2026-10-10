# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público `checklist-mio-ionm` y repo privado de datos `../checklist-mio-datos`).
- Fase: **auditoría del 09-10-2026 cerrada** (tandas 1-6 hechas y marcadas ✅ en `../checklist-mio-datos/docs/AUDITORIA.md`), más el rediseño del GRID (todo a Mapeo) y la tanda de radios. «Actualiza todo» hecho el 10-10. **Fase cerrada**; no hay nada a medias.
- Versión actual: `?v=20261010d` (seis etiquetas de `index.html`).

## 2. Hecho en esta sesión

Todo subido. Cada cambio tiene su entrada en `../checklist-mio-datos/docs/DIARIO-CODIGO.md`.

- **Tanda 6** (`5bdbaf8`): C12 (apodo fuera de `style.css`), C21 (`reflejo_h` → H-R Sóleo), F16 (Guía con Biblioteca y Bibliografía), T17 (CSS muerto), T18 (13 claves de `T()` huérfanas), T19 (README, CLAUDE.md y comentarios), T20 (`nombreEquipo_()` de `apps-script/Codigo.gs` con «generico»), T21 (`hoja_informe`, `hoja_explor`). Ayuda `caso_basales_registro_ay` con t-SEP/t-MEP; «RBC» ya no sale repetido en la demo. Archivos: `app.js`, `style.css`, `index.html`, `README.md`, `CLAUDE.md`, `data/guia.js`, `data/surgeries.js`, `data/i18n-en.js`, `apps-script/Codigo.gs`.
- **Limpieza** (`8216d0b`): 7 claves de `T()` sin uso más y CSS muerto de `.reg-fila`.
- **GRID todo a Mapeo** (`01b18da`), decisión del usuario: Basales = solo umbrales (filas c-MEP/c-SEP A/B); Mapeo = electrodo motor, músculos, electrodo/s sensitivo/s e inversión de fase por GRID (A, y B con dos), visible con cualquier técnica de GRID. Nuevas `regCamposGrid(n)` (lee los `antes:` de E2), `regMapeoBloqueVisible()`, `seccionMapeoInforme()` (sección «Mapeo» del informe tras Basales). Fuera el bloque `.caso-basales-grid` de la ficha y las claves `caso_basales_grid*`, `reg_p_motor`, `reg_p_musculos`.
- **«+ GRID B»** (`9409a3a`, `cd49890`): `nodoBotonGridB(d, tecnicas, alCambiar, enBasales)`. En Mapeo, con `regCasoConGrid()`; en Basales, solo con c-MEP o c-SEP. La ficha le pasa las técnicas de la copia de trabajo. `reg_p_mapeo_nota` matizada.
- **Radios** (`cd49890`): 24 contenedores (tarjetas, paneles, filas, `dialog`) a `var(--r)` (5 px). Sin tocar: Simulador, logo, fotos, iconos, píldoras, chips de 2-4 px, `.rr-barra-apuntar`, `.caja-tab`, `.rr-hoja`, `.sonda-recuadro`.
- **Docs** (`b51cc92`): `CLAUDE.md` (resumen a 10-10, mapa del código) y `README.md` (novedades del 9 y 10/10, GRID/Mapeo/Basales). Memoria de Claude actualizada.

## 3. Siguiente paso exacto

Preguntar al usuario qué quiere abordar ahora, ofreciendo las decisiones abiertas de la sección 4 (la primera, F10 «Empezar de nuevo», es la más rápida). No hay ninguna tanda aprobada pendiente.

## 4. Decisiones abiertas (esperan al usuario)

- **«Empezar de nuevo» de F10**: ahora es un botón gris relleno. ¿Más discreto?
- **F14** (crear un caso con montaje cuesta unos 9 toques; propuesta: ofrecer «¿Cargar una plantilla?» tras elegir el equipo): esfuerzo M, preguntar antes.
- **C22** (centro del dispositivo al guardar un caso): espera al multicéntrico.
- Detalles vistos y no tocados, por si los quiere: Guía sin tarjeta de Técnicas IONM; `reflejo_h` no nombra H-R Cuádriceps; comentario de `REG_BASALES_SENS` habla de tres columnas (son cuatro); radios parciales de `.rr-barra-apuntar`, `.caja-tab` y `.rr-hoja`; la cabecera del mapa del código en `CLAUDE.md` tiene números de línea desfasados.
- **Tareas del usuario**:
  - Repegar `apps-script/Codigo.gs` **entero** en el Sheet (T20).
  - Probar en el móvil: Mapeo con las cuatro casillas del GRID (A y B), sección «Mapeo» del informe, «+ GRID B» en Basales y Mapeo; hoja de apuntar (F10) y «vs PostPos»; colores del modo claro y hoja impresa con t-SEP/t-MEP; candado (Checklist, montaje en solo lectura, Registro sin «Guardar»); cabecera a 360 px, barra sticky del Organizador, pie de la Guía, títulos del Registro en mono; radios nuevos.
- Siguen aparcados: MAV, punto 7 (nube), bloque 4 de textos, multicéntrico, privacidad al sacar los datos y tiendas de apps.

## 5. Restricciones activas

- Los ids no cambian nunca; las filas renombradas conservan lo escrito con `antigua: true`. Los campos del GRID siguen siendo `grid1_*`/`grid2_*` (rótulos A/B).
- GRID: umbrales en Basales; electrodo, músculos, sensitivo e inversión en Mapeo. No volver a duplicar campos entre los dos.
- `regModalidadDeQue("GRID")` sigue devolviendo `"grid"`. En `regFilasBasales()`, la excepción `impresa` vale solo para `sep_*`/`mep_*`.
- **Candado**: todo lo que escriba en un caso comprueba `estado === "cerrado"`, salvo Reabrir; los botones que solo enseñan llevan `.candado-libre`; `borrarCaso()` quita el caso de `casos` antes de marcarlo en `casosBorrados`.
- Hoja impresa: hoja 1 ≤ ≈1045 px (peor caso, 1044 px). No añadir nada a la hoja 1 sin medir.
- Botones rectangulares, cambios sutiles, casillas de unos 30 px; zonas táctiles con `::after`. Radios con `var(--r)`; el **Simulador conserva sus radios propios**.
- ES5 (`var`, sin flechas). Textos con `T()` y su `en`. DOM con `createElement`.
- Repo público: sin precios, números de caso reales, nombres (ni apodos) ni centro.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`.
- Si cambia `Codigo.gs`, darle al usuario el archivo entero.
- Scripts de Python en el scratchpad, con `python archivo.py < /dev/null` y `newline=""`. Nada de `sed -i` por número de línea. No dejar un `cat >` sin heredoc (se queda colgado).
- Repo privado: `git pull --ff-only` antes de tocarlo y `git fetch` antes del push.
- Sesión principal: orquestar y delegar en subagentes; revisar su diff y verificar.

## 6. Verificación

1. `node --check app.js`
2. Servidor `checklist` (preview_start) en `http://localhost:8099/?demo`, a 375 px. Las seis etiquetas cargan con `?v=20261010d`; consola sin errores.
3. Caso «Glioma frontal izquierdo» (c_pem, phase_reversal, mapeo_cortical):
   - Ficha: bajo Basales no hay bloque GRID; en Mapeo, las cuatro casillas del GRID A; «+ GRID B» en Basales y Mapeo.
   - Escribir en una casilla del GRID en la ficha y verla en el Mapeo del Registro y en la sección «Mapeo» del informe.
4. Con solo phase_reversal (cambio temporal): «+ GRID B» en Mapeo sí, en Basales no.
5. Caso cerrado: casillas del GRID desactivadas en ficha y Registro.
6. `getComputedStyle` de `.caso-fila` y `dialog#dlg-sync`: `border-radius` 5px; `.sim-app`: 6px.
7. Al terminar, «Restablecer demo» si se ha tocado el localStorage.
