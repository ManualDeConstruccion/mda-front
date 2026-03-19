# Changelog

Todos los cambios notables de este proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Unreleased]

### Added
- Estructura de documentación completa en `docs/` (arquitectura, features, componentes, API, guías)
- `AGENTS.md` con instrucciones de setup y protocolo de documentación para agentes IA
- `.cursor/rules/documentation.mdc` con reglas de documentación para Cursor
- `.github/PULL_REQUEST_TEMPLATE.md` con checklist de calidad y documentación
- Admin UI: wizard async “Importar desde PDF” con revisión editable de mapeos y ejecución del import.
- Admin UI: se unifica flujo importador; si no hay templates activos, el wizard permite `form_code` manual y al aplicar se deja listo el `BasePDFTemplate`.
- Admin UI: el wizard salta el Paso 1 cuando existe template activo y permite analizar con IA usando `template_id` (sin volver a subir el PDF).
- Admin UI: wizard “Importar desde PDF” persiste el borrador del análisis en `localStorage` (por tipo de proyecto) para cerrar el modal y retomar en revisión sin volver a gastar tokens; botón «Descartar borrador» y limpieza al aplicar o si el job falla.

### Changed
- Admin UI: en la grilla de sección, los controles/acciones se muestran solo en la fila activa seleccionada al clickear sobre un elemento de la fila.

---

## [Versión anterior — historial previo al CHANGELOG]

Los cambios anteriores al establecimiento de este CHANGELOG están en el historial
de commits de Git. Los más recientes incluyen:

- Flujo OAuth con LinkedIn (PKCE)
- Perfil de usuario con foto y datos profesionales
- Alertas de actividad (`ActivityAlert`)
- Navegación por tabs en `ArchitectureProjectDetail` con nuevo proceso de aprobación
- Rediseño de `SectionHeader` para mostrar estado de campos completados
- Vistas de drag-and-drop para reordenamiento de etapas (ver `README-drag-drop.md`)
