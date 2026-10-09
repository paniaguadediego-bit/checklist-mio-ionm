# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público `checklist-mio-ionm` y repo privado de datos `../checklist-mio-datos`).
- Fase: **arreglos de la auditoría del 09-10-2026**, en tandas. **A medias**: hechas las tandas 1 a 5, E4 y los retoques del montaje cerrado; **falta la tanda 6** (limpieza y documentación) y, después, «actualiza todo».
- La auditoría completa está en `../checklist-mio-datos/docs/AUDITORIA.md`: sección «Informe de la auditoría del 09-10-2026» y tabla de seguimiento (ids C12-C22, F10-F19, T17-T21, E4-E8).

## 2. Hecho en esta sesión

Todo en `app.js`, `style.css` e `index.html` del repo público. En el privado, `docs/AUDITORIA.md` (F11-F13, F18, F19 y E5-E8 en ✅) y `docs/DIARIO-CODIGO.md` (una entrada por cambio). Todo subido.

- **Montaje de caso cerrado** (`4d97ed9`, `?v=20261009i`):
  - «Guardar como plantilla…» vuelve a estar activo. `candadoMontajeCaso()` solo desactiva «Cargar plantilla…».
  - La ✕ de los chips colocados se oculta con `.candado .slot .chip-quitar`. Hace falta esa especificidad para ganar a `.slot > .chip-colocado > .chip-quitar`.
- **Tanda 5** (`d33b467`, `?v=20261009j`), delegada en un subagente y revisada:
  - **F11**: con menos de 400 px, el perfil se recorta con puntos suspensivos y el ⋮ sigue en la misma fila. El ⋮ tiene zona táctil de 44 px por `::after`.
  - **F12**: `.montajes-lote` es sticky. La nueva `compensarSaltoLote()` (llamada desde `renderListaMontajesDialog()`/`renderLotePlantillas(topListaAntes)`) corrige el scroll para que la lista no salte.
  - **F13**: el pie de `#dlg-guia` está fijo.
  - **F18**: zonas táctiles con `::after` en `.rr-fase-hora`, `#btn-etiquetas`, `#btn-nuevo-material`, `.chip-foto` y `#apunte-guardar`.
  - **F19**: sin cambios, ya coincidían.
  - **E5**: `.reg-basales > .reg-grid-b { justify-self: start }`.
  - **E6**: 45 radios de botones y controles pasan a `var(--r)`.
  - **E7**: los títulos de apartado del Registro van en mono y mayúsculas; la regla se comparte con `.rr-crono-tit`.
  - **E8**: `dialog h3` lleva `var(--r)`. Se añadió la clase `.casos-exportar` (altura común) en `index.html`.
  - Todo lo nuevo está en el bloque «Auditoría 09-10-2026, tanda 5» de `style.css`.
- **F19, decisión del usuario** (`2e25a57`, `?v=20261009k`): en los temas oscuros, `.sel-caso-punto` de «A planificar» sale en gris, como la lista. Reglas F8 de `style.css`, hacia la línea 4065.

## 3. Siguiente paso exacto

Leer las filas de la **tanda 6** en AUDITORIA.md y delegarla en un subagente:
- C12, C21, T17-T21 y F16.
- En la ayuda `caso_basales_registro_ay`, añadir t-SEP y t-MEP a las filas que dependen de las técnicas.
- Quitar el «RBC» repetido en los botones de Técnica de la demo «Médula anclada».
- Si entra T20, darle al usuario `Codigo.gs` **entero**.
- Valorar dos detalles: la ficha tiene `grid1_motor` en dos sitios (bloque GRID de basales y Mapeo), y los rótulos A/B del Mapeo usan `r.l`, no `l_en`.
- `importarCopiaCompleta()` deja el uid en `casosBorrados`. Ya lo cubre la salvaguarda; solo flagear.

Tras la tanda: marcar sus filas ✅ en AUDITORIA.md, añadir la entrada al diario y hacer push. Al final, «actualiza todo».

Tanda posterior, **ya aprobada por el usuario**: unificar a `var(--r)` los radios de tarjetas y paneles (de 5 a 8 px). La lista está en la entrada del diario «Tanda 5», en E6. El **Simulador conserva sus radios propios**, por decisión del usuario.

## 4. Decisiones abiertas (esperan a Pani)

- **«Empezar de nuevo» de F10**: ahora es un botón gris relleno. ¿Lo hacemos más discreto?
- **C22** (centro del dispositivo al guardar un caso): espera a que se retome el multicéntrico.
- **F14** (crear un caso con montaje cuesta unos 9 toques; propuesta: ofrecer «¿Cargar una plantilla?» tras elegir el equipo): esfuerzo M, preguntar antes.
- **Pruebas en el móvil**:
  - Hoja de apuntar (F10) y «vs PostPos».
  - Colores del modo claro y hoja impresa con t-SEP/t-MEP.
  - Candado: Checklist, montaje en solo lectura (sin ✕, con «Guardar como plantilla…») y Registro sin «Guardar».
  - Dos GRID en el informe y la ficha, y leyenda de unidades.
  - Tanda 5: cabecera a 360 px, barra sticky del Organizador, pie de la Guía y títulos del Registro en mono.
- Siguen aparcados: MAV, punto 7 (nube), bloque 4 de textos, multicéntrico, privacidad al sacar los datos y tiendas de apps.

## 5. Restricciones activas

- Los ids no cambian nunca; las filas renombradas conservan lo escrito con `antigua: true`.
- `regModalidadDeQue("GRID")` sigue devolviendo `"grid"`.
- En `regFilasBasales()`, la excepción `impresa` vale solo para `sep_*`/`mep_*`.
- **Candado**:
  - Todo lo que escriba en un caso comprueba `estado === "cerrado"`, salvo Reabrir.
  - Los botones que solo enseñan llevan `.candado-libre`.
  - `borrarCaso()` quita el caso de `casos` antes de marcarlo en `casosBorrados`.
- Hoja impresa: hoja 1 ≤ ≈1045 px; el peor caso ya está en 1044 px. No añadir nada a la hoja 1 sin medir.
- Botones rectangulares, cambios sutiles, casillas compactas de unos 30 px. Ampliar zonas táctiles con `::after`, sin cambiar el tamaño visible.
- ES5 (`var`, sin flechas). Textos con `T()` y su `en` en el diccionario de `app.js`. DOM con `createElement`.
- Repo público: sin precios, números de caso reales, nombres ni centro.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`. Ahora está en `20261009k`.
- Scripts de Python en el scratchpad, con `python archivo.py < /dev/null` y `newline=""`. Nada de `sed -i` por número de línea.
- Repo privado: `git pull --ff-only` antes de tocarlo y `git fetch` antes del push.
- Sesión principal: orquestar y delegar cada tanda en un subagente; revisar su diff y verificar.

## 6. Verificación

1. Comprobar la sintaxis:

```bash
node --check app.js
```

2. Abrir el servidor `checklist` (preview_start) en `http://localhost:8099/?demo`, a 360 y 375 px. Comprobar que se cargan `style.css?v=20261009k` y `app.js?v=20261009k`.
3. Caso cerrado 2026-001:
   - En «Editar montaje», ninguna ✕ visible.
   - «Guardar como plantilla…» activo y «Cargar plantilla…» desactivado con `title`.
4. Caso abierto 2026-005: todas las ✕ visibles.
5. A 360 px, `#btn-menu` y `#perfil-usuario` tienen el mismo `top` (unos 5 px).
6. En el Registro, Cronograma, Basales, Mapeo y Cierre salen con `text-transform: uppercase` y fuente mono.
7. En el tema oscuro, `.sel-caso-punto.estado-pendiente_planificar` es `rgb(125, 139, 160)`; en el claro, `rgb(17, 17, 17)`.
8. Consola sin errores con `?v=20261009k`.
9. Al terminar, pulsar «Restablecer demo» si se ha tocado el localStorage.
