# HANDOFF — MIO-Check

## 1. Estado

- Proyecto: MIO-Check (repo público `checklist-mio-ionm` y repo privado de datos `../checklist-mio-datos`).
- Fase: retoques del Registro, las Basales y los casos cerrados pedidos por el usuario el 06-10-2026. **Cerrada**: hecha, probada en la demo a 375 px y subida (`?v=20261006c`).
- Falta el «actualiza todo» de estos cambios: el resumen de `CLAUDE.md`, el README y `data/guia.js` todavía no los recogen. El diario privado sí está al día.

## 2. Hecho en esta sesión

Todo está en `app.js`, `index.html` (`?v=` y el aviso `#caso-candado`) y `style.css`.

- **Candado en casos cerrados** (`candado()`, `candadoAplicar()`, `CANDADO_LIBRES`):
  - La ficha y el Registro quedan de solo lectura hasta «Reabrir caso».
  - Se ve un aviso 🔒. En la ficha no sale «Guardar»; en el Registro no salen la barra de apuntar, ✎ ni ✕.
  - Un `MutationObserver` bloquea lo que se pinta después, y un `click` en captura bloquea los chips `<span>`.
- **Casos cerrados no se borran**: el ⋮ → Borrar muestra un aviso (`caso_borrar_cerrado`) y no hace nada más.
- **Hora en la hoja de fase** (`regRapido.faseHora`, `regMarcarFase()`, `regRapidoDeApunte()`): si se deja en blanco, se apunta la hora actual; al corregir con ✎, sale la hora de la línea.
- **Basales**:
  - Una sola fila de c-MEP (`cmep_a`) y otra de c-SEP (`csep_a`). Con dos GRID pasan a «A» y «B» (`cmep_b`, `csep_b`).
  - Dos GRID = `d.v.grid_b` (botón «+ GRID B» / «Quitar GRID B», `nodoBotonGridB()`) o algo escrito del GRID B (`regGridBEscrito()`).
  - Las filas antiguas por miembro y la fila «GRID» llevan `antigua: true`: solo salen si tienen datos. El botón «GRID» de Técnica del Registro se mantiene aparte, en `regQueRapidos()`.
  - c-MEP y c-SEP tienen las cuatro columnas: Basal, PostPos1, PostPos2 y Cierre (`regColBasal()`).
- **Mapeo**:
  - GRID A / GRID B en lugar de 1 / 2. Los ids `grid1_*` y `grid2_*` no cambian.
  - La fila B (en pantalla) y la columna B (en la hoja impresa) solo salen con dos GRID. Hay botón «+ GRID B» también bajo el bloque del Mapeo.
- **Ayuda de «Fecha de la cirugía»** corregida: ya no dice que se pueda cambiar en un caso cerrado.
- **Fuera del código**:
  - Plan para publicar en App Store y Google Play con Capacitor. Aparcado. Está en la memoria de Claude (`project_tiendas_apps.md`) y en el diario privado.
  - Renombrar la carpeta o los repos a «MIO-Check proyecto»: descartado porque rompe la URL de GitHub Pages, la sincronización y la memoria.

## 3. Siguiente paso exacto

Si el usuario no pide otra cosa, hacer **«actualiza todo»**:
1. Añadir al resumen de `CLAUDE.md` y al mapa del código lo de la sección 2: `candado()`, `nodoBotonGridB()`, `regCasoConGridB()`, `regGridBEscrito()`, `faseHora`.
2. Actualizar el README.
3. Actualizar `data/guia.js`: candado, hora de fase y «+ GRID B». Subir su `?v=`.
4. Actualizar `AGENTS.md`, el diario privado, la memoria (`project_mio_ionm_estado.md`) y hacer push.

## 4. Decisiones abiertas (esperan al usuario)

- Pruebas en el móvil y en quirófano:
  - candado: ficha y Registro de un caso cerrado, y Borrar bloqueado;
  - hora en la hoja de fase;
  - «+ GRID B» en Basales y en el Mapeo;
  - c-MEP y c-SEP con PostPos2;
  - además, lo pendiente del 04-10 que recoge `CLAUDE.md`.
- Aparcados por el usuario: MAV, punto 7 (nube), bloque 4 de la revisión de textos, estudio multicéntrico, privacidad al sacar los datos y publicación en tiendas.

## 5. Restricciones activas

- Los ids no cambian nunca. Al renombrar o fusionar filas, lo ya escrito se conserva con `antigua: true`.
- ES5 (`var`, sin flechas), textos de interfaz con `T()`, DOM con `createElement`.
- Repo público: nada de precios, números de caso reales, nombres ni centro. El diario va en el repo privado.
- Subir el `?v=` de `index.html` en cada cambio de `app.js`, `style.css` o `data/`.
- La ficha se guarda sola a los ~1,5 s: al probar en la demo, deshacer lo marcado.
- Scripts de Python largos: en un archivo del scratchpad y ejecutados con `python archivo.py < /dev/null`. No usar heredoc combinado con `< /dev/null`: la orden se queda colgada.
- Working copy en LF, y git avisa de CRLF; es normal.

## 6. Verificación

1. Comprobar la sintaxis:

```bash
node --check app.js
```

2. Abrir el servidor `checklist` de `.claude/launch.json` (preview_start) en `http://localhost:8099/?demo` a 375 px.
3. Comprobar en la demo:
   - Registro del caso «Glioma frontal»: Basales con una sola fila «c-MEP», sin fila «GRID», con «+ GRID B»; al pulsarlo, «c-MEP A/B» y fila B en el Mapeo. La hoja de fase tiene la casilla de hora.
   - Caso «Neurinoma» (cerrado): aviso 🔒, sin controles activos salvo los plegables y las filas de basales, y Borrar → aviso sin borrar.
