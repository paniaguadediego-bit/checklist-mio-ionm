# AGENTS.md — MIO-Check

Instrucciones para cualquier asistente de código que trabaje en este repositorio.

- **Léete primero [CLAUDE.md](CLAUDE.md)**: reglas absolutas (ningún dato de
  paciente, repositorio público, se guardan ids y no rótulos, sin build ni
  dependencias), dónde vive cada dato, mapa del código y el resumen del estado
  del proyecto al principio de "Estado del proyecto". Es la fuente de verdad.
- [README.md](README.md) es el manual de uso de la herramienta.
- Los datos reales viven en el repositorio privado hermano `checklist-mio-datos`
  (`../checklist-mio-datos`): antes de tocarlo, `git fetch` + `git pull --ff-only`.
- Comprobación antes de subir: `node --check app.js`, subir el `?v=` de
  `index.html` para cada archivo cambiado, probar en el navegador (servidor
  estático, no `file://`; `?demo` trae datos de ejemplo).
- Todo en castellano: comentarios, nombres del dominio y commits.
- El **diario** de cambios (qué se hizo, cuándo y por qué) vive en el repositorio
  privado: `../checklist-mio-datos/docs/DIARIO-CODIGO.md`. Cada cambio se apunta
  ahí, no en este repositorio. Aquí **nunca** precios reales, costes, números de
  caso reales, nombres de personas o del centro (única excepción, por decisión
  del autor: la autoría y el agradecimiento del pie del inicio).
- La consola del usuario es PowerShell 5.1: en los comandos que se le den, nada
  de `&&`; mejor `git -C "ruta" ...`, una orden por bloque.
- La **auditoría periódica** (informe vivo con seguimiento, y el encargo para
  repetirla) vive en el repositorio privado: `../checklist-mio-datos/docs/`
  (`AUDITORIA.md` y `PROMPT-AUDITORIA.md`). Al arreglar un hallazgo, marca su
  fila como hecha.
- En `data/parametros-tecnicas.js`, cada `"opciones"` lleva al lado `"ids"`:
  el caso guarda el id. Se puede corregir el texto de una opción, pero **nunca
  cambiar un id ya usado**; una opción nueva va al final de las dos listas.
- Las listas cerradas del Registro y la ficha (`REG_MEDIDAS_AL`,
  `REG_CONTEXTO`, `REG_CRITERIO_AL`, `REG_CAMBIOS_RAPIDOS`, `REG_FARMACOS`, `REG_CAUSA_AL`, `OPCIONES.*`...) guardan
  ids: se puede cambiar el rótulo, nunca un id ya usado.
- Si cambia `apps-script/Codigo.gs`, el usuario tiene que volver a pegarlo en
  Apps Script: dale el archivo **entero** para copiar y pegar, no bloques
  sueltos.
- El contenido de **Técnicas IONM** (apuntes del autor sacados de libros y
  artículos) vive SOLO en el repositorio privado (`referencia/`): no lo copies
  nunca a este repositorio público.
- Con `core.autocrlf=true`, la copia de trabajo suele ir en CRLF: respeta el
  salto de línea que tenga cada archivo al editarlo.
- Los scripts de Python largos para editar archivos van en un archivo aparte
  (no en un heredoc de bash): dentro del heredoc, los `\n` y `\d` de las
  cadenas de JavaScript llegan rotos. En el texto a buscar va el carácter real
  (−, ·, µ), no su escape `\uXXXX`. Después, siempre `node --check`.
- Basales: dos medidas por fase, claves `e_<fila>_<fase>_amp` y `_lat`
  (sensitivos) o `_umb` (motores); lee siempre con `regBasalValor()`, que
  entiende también la casilla antigua «a/b». En pantalla son una lista por técnica, no una
  rejilla (elección del usuario): no volver a la rejilla de casillas.
- Colores: tres modos (azul por defecto, `tema-oscuro`, `tema-claro`). Un
  color fijo nuevo para el oscuro necesita también su valor para el azul (si no,
  los grises neutros se ven marrones junto al marino). `--header-h` lo mide
  `app.js`: no fijarlo a mano.
- Los scripts de Node que insertan código con plantillas `` `...` ``: un `\n`
  dentro de una cadena JS se vuelve un salto de línea real y rompe `app.js`.
  Escríbelo como `String.fromCharCode(92) + "n"` o con `JSON.stringify`, y
  comprueba siempre con `node --check app.js`.
- Colores por familia de técnica (plantillas y casos): `--fam-*` en
  `style.css`, con valor para el claro y para azul/oscuro; qué técnica va en
  qué familia lo decide `familiaTecnica()` en `app.js` (colores elegidos por
  el usuario: no cambiarlos sin que lo pida).
  PEATC tiene familia propia (amarillo, `aud`). **Técnicas IONM usa su propia
  paleta `--tm-*`** y no la de familias: no unificarlas sin que lo pida.
- Reflejos: en `data/surgeries.js`, `"reflejo": "tronco"` o `"medular"`; las
  listas de técnicas los separan con `apartadosTecnicas()`. Una técnica nueva que
  sea reflejo lleva uno de los dos valores.
- Rótulos de listas cerradas: nombre completo delante y sigla entre paréntesis
  («Estenosis de canal cervical (ECC)»), sin notas internas ni costumbres de un
  servicio concreto (eso va como «p. ej.»): la herramienta la puede usar un
  médico de otro hospital.
- Al reemplazar varias líneas con Python, construye el texto a buscar con el
  salto de línea real del archivo (CRLF o LF): si no, no casa.
- Registro: corregir una línea usa la misma hoja que apuntarla
  (`regAbrirEdicion()`). Un botón o campo nuevo en la hoja de apuntar
  (`regApuntar()`) tiene que leerse también en `regRapidoDeApunte()`, o se
  perderá al corregir. Para comprobarlo: en la demo, ✎ y «Guardar cambios» sin
  tocar nada en todas las líneas; el cronograma no debe cambiar.
- Casos cerrados con candado (06-10-2026): `candado()` desactiva en la ficha y
  el Registro todo `input`/`select`/`textarea`/`button` (también lo que se
  pinta después) salvo `CANDADO_LIBRES`. Un control nuevo que solo enseña y
  debe funcionar en un caso cerrado va en `CANDADO_LIBRES`; uno que no sea
  esos elementos (un `<span>` clicable) ya lo frena el click en captura.
- GRID A / GRID B: los rótulos dicen A y B, pero los ids siguen siendo
  `grid1_*` y `grid2_*` (no cambiarlos). Dos GRID = `regCasoConGridB()`.
