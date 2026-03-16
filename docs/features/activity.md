# Activity — Alertas de bitácora (frontend)

Documentación del lado cliente del sistema de actividad/agenda. Para la lógica de backend (modelos, handlers, API) ver [`mdc/docs/features/activity.md`](../../../mdc/docs/features/activity.md).

---

## Componente `ActivityAlert`

**Archivo:** `src/components/ActivityAlert/ActivityAlert.tsx`

Muestra avisos pendientes de bitácora (`status=pending`) como un overlay tipo banner/modal encima del contenido. El componente se monta vía `createPortal` en `document.body` para quedar siempre visible.

### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `projectNodeId` | `number \| undefined` | ID del nodo raíz del proyecto. Si no se pasa, no se hace fetch. |
| `onResolveSuccess` | `(action: string) => void` | Callback tras resolver la alerta. Útil para refrescar el formulario cuando `action === 'cancel'` (el backend revirtió el valor del parámetro). |

### Ciclo de vida

1. Hace `GET /api/activity/project-activity-logs/?project_node={id}&status=pending` vía React Query.
2. Muestra el primer log pendiente (`pendingLogs[0]`). Si no hay logs, no renderiza nada.
3. Los botones de acción los trae el backend en `action_buttons: [{code, label, color}]` — el componente no hardcodea las acciones.
4. Al pulsar un botón envía `POST .../resolve/` con `{action: btn.code}`.
5. Tras resolución exitosa: invalida la query de logs pendientes y llama a `onResolveSuccess(action)`.

### Render del mensaje

El texto de `log.description` puede incluir saltos de línea y listas con formato `- item`. El componente las convierte automáticamente en `<ul><li>` usando `renderMessage()`.

### Ejemplo de uso

```tsx
<ActivityAlert
  projectNodeId={projectNode?.id}
  onResolveSuccess={(action) => {
    if (action === 'cancel') refetchFormData(); // el backend revirtió el parámetro
  }}
/>
```

### Dónde se monta

Actualmente se usa en `ArchitectureProjectDetail` para mostrar alertas de agenda del subproyecto (ej. cuando el usuario activa/desactiva "¿Es alteración?").

---

## Flujo frontend completo de una alerta de agenda

```
1. Usuario cambia un parámetro (ej. checkbox "¿Es alteración?")
   └── DynamicField / ParameterInput dispara mutation
       └── POST /api/parameters/node-parameters/update-value/

2. Backend responde:
   - Si parámetro tiene show_in_agenda=True y display_type banner/modal:
     → Crea un ProjectActivityLog (status=pending)
     → La respuesta lleva información de la alerta
   - Si ya existe un log pending para ese parámetro → 409

3. El formulario invalida la query del proyecto / parámetros

4. ActivityAlert hace polling reactivo (React Query):
   GET ...?project_node=<raíz>&status=pending
   └── Obtiene el log pending y lo renderiza como overlay

5. Usuario pulsa un botón (ej. "Aceptar Cambios"):
   POST .../resolve/ { action: "accept_changes" }
   └── Backend ejecuta el handler (crea/elimina nodos)
   └── Log pasa a status=resolved

6. ActivityAlert invalida la query → desaparece
   └── onResolveSuccess("accept_changes") → el padre puede refrescar
```

---

## Integración con `CreateParameterDefinitionModal` (admin)

El modal de creación/edición de `ParameterDefinition` (en `src/components/Admin/`) incluye una pestaña **"Actividades (agenda / bitácora)"** con los campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `show_in_agenda` | boolean | Activa el sistema de alertas para este parámetro |
| `agenda_display_type` | select | `toast`, `snackbar`, `banner`, `modal` |
| `agenda_message` | textarea | Mensaje cuando el valor cambia a `true` |
| `agenda_message_when_false` | textarea | Mensaje cuando el valor cambia a `false` (ej. "Se quitarán los documentos X, Y, Z") |

Estos campos controlan completamente el comportamiento de `ActivityAlert` para cada parámetro sin necesidad de código adicional.

---

## Notas de implementación

- **Un solo pending a la vez:** El backend rechaza con 409 si ya existe un log `pending` para el mismo `parameter_code` y `project_node`. El front debe deshabilitar el input del parámetro mientras exista un log pendiente.
- **project_node = nodo raíz:** Los logs siempre se filtran por el nodo raíz del proyecto, no por el subproyecto.
- **action_buttons dinámicos:** El componente no tiene lógica de qué botones mostrar; los recibe del backend junto con el log. Esto permite añadir o cambiar botones desde la configuración de `ParameterDefinition` sin tocar el frontend.
