# State management

El frontend usa dos mecanismos de estado. La regla es simple:
**datos del servidor → React Query; estado de UI → Context**.

---

## División de responsabilidades

| ¿Qué guardar? | ¿Dónde? | Motivo |
|--------------|---------|--------|
| Datos del servidor (proyectos, parámetros, normativa…) | React Query | Caché automático, invalidación, refetch |
| Tokens JWT y usuario autenticado | `AuthContext` + localStorage | Persiste entre recargas; necesario en interceptores |
| ID del proyecto activo | `ProjectContext` | Estado local sin datos del servidor |
| Estado del wizard de formularios | `FormNodeContext` | Estado de UI entre pasos del wizard |

---

## AuthContext

**Fuente de verdad de autenticación.** Provee `useAuth()`.

```typescript
const { user, accessToken, loginWithEmail, loginWithGoogle, logout, refreshAccessToken } = useAuth()
```

- Persiste `access_token` y `refresh_token` en localStorage
- Configura un interceptor de Axios al montar: añade `Authorization: Bearer` a cada request
- Intercepta 401: intenta refresh automático; si falla, hace logout
- El perfil del usuario (`/api/auth/user/`) se carga via React Query con `queryKey: ['me']`

---

## React Query

Configuración global en `App.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

### Hooks principales y sus queryKeys

| Hook | queryKey | Endpoint |
|------|----------|----------|
| `useProjectNodes()` | `['project-nodes', filters]` | `/api/projects/project-nodes/` |
| `useProjectNode(id)` | `['project-node', id]` | `/api/projects/project-nodes/{id}/` |
| `useProjectNodeTree(id)` | `['project-tree', id]` | `/api/projects/project-nodes/{id}/tree/` |
| `useFloors(filters)` | `['floors', filters]` | `/api/project-engines/floors/` |
| `useProjectLevels(filters)` | `['levels', filters]` | `/api/project-engines/levels/` |
| `useBuildings(id)` | `['buildings', id]` | `/api/project-engines/buildings/` |
| `useFormTypes()` | `['form-types']` | `/api/parameters/form-types/` |
| `useFormCategoriesTree()` | `['categories-tree']` | `/api/architecture/categories/tree/` |
| `useProjectSnapshots(id)` | `['snapshots', id]` | `/api/projects/snapshots/` |
| `useArchitectureProjectTypes()` | `['architecture-project-types']` | `/api/architecture-project-types/` |
| `useFireProtectionSolutions()` | `['fire-protection-solutions']` | `/api/fire-protection/...` |

### Patrón de mutación

```typescript
const mutation = useMutation({
  mutationFn: async (data) => api.post('/ruta/', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clave-relacionada'] })
  },
})
```

Las mutaciones invalidan el queryKey del recurso afectado para forzar un refetch.

---

## FormNodeContext

Estado del wizard de creación de formularios (3 pasos).

```typescript
const { selectedForm, setSelectedForm, nodeData, setNodeData,
        projectId, setProjectId, architectureProjectId } = useFormNodeContext()
```

Guarda qué formulario fue seleccionado (paso 1), los datos del nodo siendo creado (paso 2),
y los IDs de contexto (proyecto + subproyecto arquitectónico).

---

## ProjectContext

Estado mínimo: solo el ID del nodo de proyecto activo.

```typescript
const { projectNodeId, setProjectNodeId } = useProjectContext()
```

Usado en páginas de detalle de proyecto para compartir el ID entre componentes sin prop-drilling.

---

## Cuándo NO usar Context

No crear nuevos Contexts para datos del servidor. Si un dato viene de la API,
usar React Query. Los Contexts existentes son suficientes para el estado de UI actual.
