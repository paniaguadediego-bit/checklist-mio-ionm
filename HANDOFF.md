# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público `checklist-mio-ionm` y repo privado de datos `../checklist-mio-datos`).
- Fase: **arreglos de la auditoría del 09-10-2026**, en tandas. **A medias**: hechas la tanda 1 y E4; faltan las tandas 2 a 6.
- La auditoría completa está en `../checklist-mio-datos/docs/AUDITORIA.md`: sección «Informe de la auditoría del 09-10-2026» y tabla de seguimiento con los ids C13-C22, F10-F19, T17-T21 y E4-E8.

## 2. Hecho en esta sesión

- **«Actualiza todo» del 06-10** (`b050f20`): `CLAUDE.md`, `README.md`, `AGENTS.md`, `data/guia.js`, diario privado y memoria.
- **Retoques de textos** (`c809a63`):
  - En `CLAUDE.md`, el `?v=` va en **seis** etiquetas.
  - En la guía: PostPos «de posición o de GRID», «Con dos GRID» y la regla de «pocos puntos por tarjeta».
- **Auditoría del 09-10** (repo privado, `225ed15`): 39 commits revisados. Sin críticos; un alto (F10). C12 vuelve a 🟡.
- **Tanda 1** (`be34169`, en `app.js`, `style.css` e `index.html`):
  - **F10**: la hoja de apuntar empieza en blanco si se abre de otro tipo; si es del mismo tipo, sale la franja «Tienes elecciones de antes · Empezar de nuevo».
  - **C14**: `regFaseActual()` devuelve la fase de hora mayor.
  - **C16**: el % se compara con la última PostPos escrita antes, con la etiqueta «vs PostPos1/2».
  - **C18**: al convertir una alarma en evento, se quita `recupera_de`.
  - **C19**: t-SEP/t-MEP solo salen si el caso los hace (`tec` + `defecto`); el botón GRID toma la familia de c-MEP.
- **E4** (`1384caa`, `style.css`): `--fam-*` del modo claro más oscuros (opción B, contraste ≈6:1).
- **Hoja impresa** (`b878f4f`, `app.js`): t-SEP y t-MEP salen siempre en la impresa (`regFilasBasales(..., impresa)`) y en pantalla solo si el caso los hace. Pedido del usuario.
- Seguimiento de AUDITORIA.md y diario privado al día. `?v=20261009e`.

## 3. Siguiente paso exacto

Lanzar la **tanda 2** con un subagente: **C13 + F17**.
- **C13**: en un caso cerrado no se guarda nada por ninguna vía: «Guardar»/«Imprimir» del Registro, ⋮ → Abrir en el Registro, «Editar montaje» y **el Checklist**, que también queda bloqueado (confirmado por el usuario).
- **C13**: ningún botón de navegación guarda, sella `editado_en` ni sube si `firmaFicha()` no ha cambiado.
- **F17**: «Borrar caso» desactivado, con el motivo en `title`, y sin «+ Otro» en Basales cuando hay candado.

Tandas siguientes:
3. **C15 + C20**: dos GRID en el informe PDF y la ficha (A/B, GRID B), y unidades en la tabla «Corticales / pares» de la hoja.
4. **C17**: la papelera no pisa un caso que ya ha vuelto.
5. **Móvil y coherencia**:
   - **F11**: perfil con puntos suspensivos por debajo de 400 px y ⋮ de 44 px (aprobado).
   - F12, F13, F18.
   - **F19**: unificar cómo se ve el estado del caso (aprobado).
   - E5, E6, E8.
   - **E7**: todos los títulos de apartado del Registro como el del Cronograma, en monoespaciada y mayúsculas.
6. **Limpieza y documentación**:
   - C12, C21, T17-T21, F16.
   - Ayuda `caso_basales_registro_ay` (`app.js` ~1026): añadir t-SEP y t-MEP a las filas que dependen de las técnicas.
   - «RBC» repetido en los botones de Técnica de la demo «Médula anclada».
   - Si entra T20, darle al usuario `Codigo.gs` **entero**.

Tras cada tanda: marcar sus filas ✅ en AUDITORIA.md, añadir una entrada al diario y hacer push. Al final, «actualiza todo».

## 4. Decisiones abiertas (esperan al usuario)

- **«Empezar de nuevo» de F10**: ahora es un botón gris relleno. ¿Más discreto?
- **C22** (centro del dispositivo al guardar un caso): esperar a que se retome el multicéntrico.
- **F14** (crear un caso con montaje en ~9 toques; propuesta: ofrecer «¿Cargar una plantilla?» tras elegir el equipo): esfuerzo M; preguntar antes de hacerlo.
- **Pruebas en el móvil**: hoja de apuntar (F10), «vs PostPos» en Basales, colores del modo claro y hoja impresa con t-SEP/t-MEP.
- Siguen aparcados: MAV, punto 7 (nube), bloque 4 de textos, multicéntrico, privacidad al sacar los datos y tiendas de apps.

## 5. Restricciones activas

- Los ids no cambian nunca; las filas renombradas conservan lo escrito con `antigua: true`.
- `regModalidadDeQue("GRID")` sigue devolviendo `"grid"`, para conservar sus hallazgos propios (colocación, phase reversal…). No resolverlo a c-MEP.
- En `regFilasBasales()`, la excepción `impresa` vale solo para `sep_*`/`mep_*`. PEATC también lleva `defecto` y no debe imprimirse siempre.
- «Cerrar la hoja sin borrar lo elegido» es una decisión del usuario del 04-10: F10 solo vacía al cambiar de tipo.
- ES5 (`var`, sin flechas), textos con `T()` y su `_en`, DOM con `createElement`.
- Repo público: sin precios, números de caso reales, nombres ni centro.
- Subir el `?v=` de las **seis** etiquetas de `index.html` en cada cambio de `app.js`, `style.css` o `data/`.
- Scripts de Python en el scratchpad, ejecutados con `python archivo.py < /dev/null`; `sed -i` por patrón, no por número de línea (las líneas se mueven).
- Repo privado: `git pull --ff-only` antes de tocarlo y `git fetch` antes del push.
- Sesión principal: orquestar y delegar cada tanda en un subagente; revisar su diff y verificar.

## 6. Verificación

1. Comprobar la sintaxis:

```bash
node --check app.js
```

2. Abrir el servidor `checklist` de `../.claude/launch.json` (preview_start) en `http://localhost:8099/?demo` a 375 px.
3. Comprobaciones en la demo:
   - **Registro del caso «Glioma frontal»**:
     - Empezar una alarma, cerrarla con ✕ y abrir «+ Evento»: sale en blanco.
     - Volver a «+ Alarma»: también en blanco.
     - Elegir algo en una alarma, cerrar y abrir otra alarma: sale la franja «Tienes elecciones de antes».
     - No se ofrecen t-SEP en Basales ni en Técnica.
     - GRID sale en rojo de motoras.
   - **Hoja impresa del Glioma**: incluye las filas t-SEP MSD…MII. Para comprobarlo, sustituir `window.open` por un `<iframe>` de 794 px.
   - **Modo claro**: chips de familia oscuros (p. ej. Mapeo `#97275e`); azul y oscuro, sin cambios.
4. Deshacer lo marcado en la demo, o «Restablecer demo».
