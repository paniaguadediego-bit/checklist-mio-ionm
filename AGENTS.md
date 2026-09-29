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
  caso reales, nombres de personas o del centro.
- La consola del usuario es PowerShell 5.1: en los comandos que se le den, nada
  de `&&`; mejor `git -C "ruta" ...`, una orden por bloque.
- La **auditoría periódica** (informe vivo con seguimiento, y el encargo para
  repetirla) vive en el repositorio privado: `../checklist-mio-datos/docs/`
  (`AUDITORIA.md` y `PROMPT-AUDITORIA.md`). Al arreglar un hallazgo, marca su
  fila como hecha.
- En `data/parametros-tecnicas.js`, cada `"opciones"` lleva al lado `"ids"`:
  el caso guarda el id. Se puede corregir el texto de una opción, pero **nunca
  cambiar un id ya usado**; una opción nueva va al final de las dos listas.
- El contenido de **Técnicas IONM** (apuntes del autor sacados de libros y
  artículos) vive SOLO en el repositorio privado (`referencia/`): no lo copies
  nunca a este repositorio público.
- Con `core.autocrlf=true`, la copia de trabajo suele ir en CRLF: respeta el
  salto de línea que tenga cada archivo al editarlo.
- Los scripts de Python largos para editar archivos van en un archivo aparte
  (no en un heredoc de bash): dentro del heredoc, los `\n` y `\d` de las
  cadenas de JavaScript llegan rotos. Después, siempre `node --check`.
