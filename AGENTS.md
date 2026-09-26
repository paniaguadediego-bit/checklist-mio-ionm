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
