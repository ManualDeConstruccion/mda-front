# Catálogo de componentes reutilizables

Solo se listan aquí los componentes pensados para reutilización. Los componentes
específicos de una sola página viven en `src/pages/` junto a la página que los usa.

---

## Layout

| Componente | Archivo | Props principales | Cuándo usarlo |
|-----------|---------|------------------|---------------|
| `Layout` | `Layout/Layout.tsx` | — | Wrapper de todas las páginas protegidas |
| `PublicLayout` | `Layout/PublicLayout.tsx` | — | Wrapper de páginas públicas (login, landing) |
| `Navbar` | `Layout/Navbar.tsx` | — | Barra de navegación superior |
| `Sidebar` | `Layout/Sidebar.tsx` | — | Menú lateral de navegación |

---

## Inputs y formularios

| Componente | Archivo | Props principales | Cuándo usarlo |
|-----------|---------|------------------|---------------|
| `FormInput` | `common/FormInput/FormInput.tsx` | `label, name, value, onChange, error` | Input genérico con label y mensaje de error |
| `DynamicField` | `DynamicField/` | `parameterDefinition, value, onChange` | Campo dinámico según `data_type` del parámetro |
| `ParameterInput` | `Admin/ParameterInput.tsx` | `param, nodeId` | Input para un `FormParameter` en modo editable |

---

## Modales

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `DeleteConfirmationModal` | `common/DeleteConfirmationModal.tsx` | Modal de confirmación de borrado con texto configurable |
| `AddFormParameterModal` | `Admin/AddFormParameterModal.tsx` | Añadir parámetro a una sección de formulario |
| `EditFormParameterModal` | `Admin/EditFormParameterModal.tsx` | Editar propiedades de un parámetro en formulario |
| `CreateParameterCategoryModal` | `Admin/CreateParameterCategoryModal.tsx` | Nueva categoría de parámetros |
| `CreateProjectTypeModal` | `Admin/CreateProjectTypeModal.tsx` | Nuevo tipo de proyecto arquitectónico |

---

## Ayuda contextual

| Componente | Archivo | Props principales | Cuándo usarlo |
|-----------|---------|------------------|---------------|
| `HelpTooltip` | `HelpTooltip/` | `fieldCode` | Tooltip con texto de ayuda del backend (`useFieldHelpText`) |

---

## Feedback y notificaciones

| Componente | Archivo | Props principales | Cuándo usarlo |
|-----------|---------|------------------|---------------|
| `Toast` | `common/Toast.tsx` | `message, severity` | Notificaciones temporales (éxito, error, info) |
| `ActivityAlert` | `ActivityAlert/` | — | Indicador de actividad en progreso |

---

## Visualización de documentos

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `PrintPreviewLayout` | `common/PrintPreviewLayout.tsx` | Contenedor para vista previa de impresión |
| `PagedPreview` | `common/PagedPreview.tsx` | Vista de múltiples páginas |
| `PagedIframePreview` | `common/PagedIframePreview.tsx` | Vista previa vía iframe |

---

## Navegación

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `Breadcrumb` | `Breadcrumb/` | Ruta de migas de pan basada en la ruta activa |

---

## Auth

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `GoogleSignInButton` | `GoogleSignInButton/` | Botón de inicio de sesión con Google |
| `LinkedInSignInButton` | `LinkedInSignInButton/` | Botón de inicio de sesión con LinkedIn |

---

## Secciones de datos del proyecto

Estos componentes son reutilizados dentro de la vista de detalle del proyecto.

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `ProjectDetailsSection` | `ProjectDetailsSection/` | Resumen de datos principales del proyecto |

---

## Componentes del editor de formularios (Admin)

Usados exclusivamente en el panel de administración de plantillas de formularios.

| Componente | Descripción |
|-----------|-------------|
| `SectionTreeWithModes` | Editor principal: renderiza árbol de secciones en modo view/edit/admin |
| `SectionGrid` | Renderizador de grilla de parámetros y celdas |
| `GridCell` | Celda individual (parámetro o texto) con drag-drop en modo admin |
| `EngineBlockRenderer` | Dispatcher de motores de sección (superficies, ocupación, etc.) |
| `NormativeTree` | Browser de jerarquía normativa OGUC/LGUC |
| `PublicationEditor` | Editor de publicaciones normativas |

---

## Cómo agregar un componente reutilizable

1. Crear en `src/components/<Categoria>/NombreComponente.tsx`
2. Agregar JSDoc sobre la función:
   ```tsx
   /**
    * Descripción del propósito del componente.
    * Contexto de uso: en qué páginas o situaciones se usa.
    */
   export function NombreComponente({ prop1, prop2 }: Props) {
   ```
3. Añadir una fila a esta tabla siguiendo el formato existente
4. Actualizar `CHANGELOG.md`
