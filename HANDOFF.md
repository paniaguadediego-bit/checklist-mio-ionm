# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público `checklist-mio-ionm` y repo privado de datos `../checklist-mio-datos`).
- Fase: **arreglos de la auditoría del 09-10-2026**, en tandas. **A medias**: hechas las tandas 1 a 4 y E4; faltan las tandas 5 y 6, y dos retoques ya decididos del candado del montaje.
- La auditoría completa está en `../checklist-mio-datos/docs/AUDITORIA.md`: sección «Informe de la auditoría del 09-10-2026» y tabla de seguimiento (ids C13-C22, F10-F19, T17-T21, E4-E8).

## 2. Hecho en esta sesión

Todo en `app.js` + `index.html` (repo público). En el privado, `docs/AUDITORIA.md` (filas en ✅) y `docs/DIARIO-CODIGO.md` (una entrada por tanda), todo subido.

- **Tanda 2 — C13 + F17** (`ad99bfe`, `?v=20261009f`):
  - Un caso cerrado no se guarda por ninguna vía: ficha (`fichaCerrada()` en `guardarFicha()`, salvo Reabrir, y en `autoguardarFicha()`), Registro (`registroGuardarYa()`), montaje (`guardarMontajeEnCaso()`) y Checklist (`checklistCerrado()`: casillas desactivadas y aviso `checklist_candado_aviso`).
  - «Abrir en el Registro» y «Editar montaje» usan `guardarFichaSiCambio()`: sin cambios en `firmaFicha()` no guardan, no sellan `editado_en` y no suben nada.
  - F17: «Borrar caso» desactivado con el motivo en `title`. Sin «+ Otro» en Basales con candado (`pintarBloqueBasales(..., sinVacia)`).
- **Tanda 3 — decisiones del usuario + C15 + C20** (`6571e9d`, `?v=20261009g`):
  - El montaje de un caso cerrado se abre **en solo lectura**: `montajeCasoCerrado()`, `candadoMontajeCaso()` (llamada en `renderBarraCaso()`), aviso `montaje_candado_aviso`. El botón lleva `.candado-libre`, que se añadió a `CANDADO_LIBRES`.
  - «Guardar» del Registro oculto en un caso cerrado.
  - **C15**: con `regCasoConGridB()`, el informe y la ficha muestran «c-MEP A/B», «c-SEP A/B» y GRID B (claves `caso_basales_gridab_*`). `regCasoConGrid` mira también `grid2_motor`.
  - **C20**: leyenda de unidades bajo «Corticales / pares» de la hoja impresa (`.hj-cort-unid`). Hoja 1: 1003 px en el caso habitual y 1044 px en el peor (A4 ≈1077).
- **Tanda 4 — C17** (`bd31292`, `?v=20261009h`):
  - Si el caso ya está vivo, `recuperarDePapelera()` devuelve `"ya_estaba"`, avisa con `alert` (`papelera_ya_en_lista`) y solo lo quita de la papelera.
  - `borrarCasosPendientes()` cancela el borrado en GitHub de un uid que vuelve a estar en `casos`, por ejemplo tras «Importar copia». Sin probar contra GitHub.

## 3. Siguiente paso exacto

Delegar en un subagente los **dos retoques del montaje en solo lectura**, ya decididos por el usuario:
1. **Permitir «Guardar como plantilla…»** en el montaje de un caso cerrado: quitar `barra-caso-guardar-plantilla` de la lista de `candadoMontajeCaso()`. «Cargar plantilla…» sigue desactivado.
2. **Ocultar la ✕ de los chips colocados** en el montaje en solo lectura: CSS bajo `.candado` o el atributo que ponga `candado()`.

Subir el `?v=` a `20261009i`, verificar en `?demo` con 2026-001, hacer commit y push, y apuntarlo en el diario.

Después, la **tanda 5 (móvil y coherencia)**:
- **F11**: perfil con puntos suspensivos por debajo de 400 px y ⋮ de 44 px (aprobado).
- F12, F13, F18. Leer sus filas en AUDITORIA.md.
- **F19**: unificar cómo se ve el estado del caso (aprobado).
- E5, E6, E8.
- **E7**: todos los títulos de apartado del Registro como el del Cronograma, en monoespaciada y mayúsculas.

**Tanda 6, limpieza y documentación:**
- C12, C21, T17-T21, F16.
- En la ayuda `caso_basales_registro_ay`, añadir t-SEP y t-MEP a las filas que dependen de las técnicas.
- Quitar el «RBC» repetido en los botones de Técnica de la demo «Médula anclada».
- Si entra T20, darle al usuario `Codigo.gs` **entero**.
- Valorar dos detalles vistos de paso: la ficha tiene `grid1_motor` en dos sitios (bloque GRID de basales y Mapeo), y los rótulos A/B del Mapeo usan `r.l`, no `l_en`.
- `importarCopiaCompleta()` deja el uid en `casosBorrados`. Ya lo cubre la salvaguarda; solo flagear.

Tras cada tanda: marcar sus filas ✅ en AUDITORIA.md, añadir una entrada al diario y hacer push. Al final, «actualiza todo».

## 4. Decisiones abiertas (esperan a Pani)

- **«Empezar de nuevo» de F10**: ahora es un botón gris relleno. ¿Lo hacemos más discreto?
- **C22** (centro del dispositivo al guardar un caso): espera a que se retome el multicéntrico.
- **F14** (crear un caso con montaje en ~9 toques; propuesta: ofrecer «¿Cargar una plantilla?» tras elegir el equipo): esfuerzo M, preguntar antes.
- **Pruebas en el móvil**:
  - Hoja de apuntar (F10) y «vs PostPos» en Basales.
  - Colores del modo claro y hoja impresa con t-SEP/t-MEP.
  - Candado: Checklist, montaje en solo lectura y Registro sin «Guardar».
  - Dos GRID en el informe y la ficha, y leyenda de unidades.
- Siguen aparcados: MAV, punto 7 (nube), bloque 4 de textos, multicéntrico, privacidad al sacar los datos y tiendas de apps.

## 5. Restricciones activas

- Los ids no cambian nunca; las filas renombradas conservan lo escrito con `antigua: true`.
- `regModalidadDeQue("GRID")` sigue devolviendo `"grid"`. No resolverlo a c-MEP.
- En `regFilasBasales()`, la excepción `impresa` vale solo para `sep_*`/`mep_*`. PEATC no se imprime siempre.
- «Cerrar la hoja sin borrar lo elegido» es decisión del usuario del 04-10: F10 solo vacía al cambiar de tipo.
- **Candado**:
  - Todo lo que escriba en un caso comprueba `estado === "cerrado"`, salvo Reabrir (`guardarFicha(true)`).
  - Los botones que solo enseñan llevan `.candado-libre`.
  - `borrarCaso()` quita el caso de `casos` antes de marcarlo en `casosBorrados`; la salvaguarda de `borrarCasosPendientes()` depende de ese orden.
- Hoja impresa: hoja 1 ≤ ≈1045 px. Con la leyenda C20, el peor caso ya está en 1044 px: no añadir nada a la hoja 1 sin medir.
- ES5 (`var`, sin flechas). Textos con `T()` y su `en` en el diccionario de `app.js`. DOM con `createElement`.
- Repo público: sin precios, números de caso reales, nombres ni centro.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`. Ahora está en `20261009h`.
- Scripts de Python en el scratchpad, con `python archivo.py < /dev/null`. Nada de `sed -i` por número de línea. Conservar CRLF.
- Repo privado: `git pull --ff-only` antes de tocarlo y `git fetch` antes del push.
- Sesión principal: orquestar y delegar cada tanda en un subagente; revisar su diff y verificar.

## 6. Verificación

1. Comprobar la sintaxis:

```bash
node --check app.js
```

2. Abrir el servidor `checklist` de `../.claude/launch.json` (preview_start) en `http://localhost:8099/?demo`, a 375 px.
3. Comprobaciones con un **caso cerrado (2026-001)**:
   - «Borrar caso» sale desactivado y con `title`.
   - Sin «+ Otro» en Basales.
   - «Abrir en el Registro» no cambia el caso en localStorage.
   - El Registro sale sin «Guardar».
   - El Checklist, con las casillas desactivadas y el aviso 🔒.
   - «Editar montaje» abre el montaje con el aviso 🔒 y sin poder colocar ni quitar.
4. Comprobaciones con un **caso abierto (2026-005)**:
   - Sin cambios, «Abrir en el Registro» no guarda.
   - Con «+ GRID B» y valores en GRID B, el informe y la ficha muestran A/B.
5. **Hoja impresa**: sale la leyenda de unidades bajo «Corticales / pares». Para medir la hoja 1, sustituir `window.open` por un `<iframe>` de 794 px.
6. **Papelera**: borrar un caso, devolverlo a localStorage y pulsar Recuperar. Sale el aviso y el caso vivo no cambia.
7. Al terminar, restaurar el localStorage o pulsar «Restablecer demo».
