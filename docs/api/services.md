# Capa de servicios

El cliente HTTP está centralizado en `src/services/api.ts`.
Todos los hooks de React Query consumen este cliente.

---

## Instancia Axios (`api`)

```typescript
// src/services/api.ts
export const api = axios.create({
  baseURL: `${VITE_API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})
```

**Request interceptor:**
- Añade `Authorization: Bearer <access_token>` desde localStorage
- Añade `X-CSRFToken` desde el cookie `mdc_csrftoken`

**Response interceptor:**
- Pasa los errores al caller sin procesamiento; el manejo de 401 ocurre en AuthContext

---

## Convención de uso en hooks

No llamar a `api` directamente en componentes. Envolver siempre en un hook con React Query:

```typescript
// ✅ Correcto
const { data } = useQuery({
  queryKey: ['projects'],
  queryFn: () => api.get('/projects/project-nodes/').then(r => r.data),
})

// ❌ Incorrecto — no usar en componentes directamente
useEffect(() => {
  api.get('/projects/').then(setProjects)
}, [])
```

---

## Principales llamadas por dominio

### Proyectos — `/api/projects/project-nodes/`

| Función | Método | Ruta | Hook que la usa |
|---------|--------|------|-----------------|
| Listar nodos | GET | `/project-nodes/` | `useProjectNodes` |
| Obtener nodo | GET | `/project-nodes/{id}/` | `useProjectNode` |
| Árbol del proyecto | GET | `/project-nodes/{id}/tree/` | `useProjectNodeTree` |
| Crear nodo | POST | `/project-nodes/` | `useProjectNodes.createProject` |
| Actualizar nodo | PATCH | `/project-nodes/{id}/` | `useProjectNodes.patchProject` |
| Eliminar nodo | DELETE | `/project-nodes/{id}/` | `useProjectNodes.deleteProject` |
| Reordenar | POST | `/project-nodes/reorder_with_numbering/` | `useProjectNodes.reorderNodes` |

Ver contratos completos en [mdc/docs/api/endpoints.md](../../../mdc/docs/api/endpoints.md).

### Arquitectura — `/api/architecture-project-types/`

| Función | Método | Ruta | Hook |
|---------|--------|------|------|
| Grupos (categorías raíz) | GET | `/groups/` | `useFormCategoriesTree` |
| Subgrupos | GET | `/subgroups/?group_id=X` | `useFormCategoriesTree` |
| Tipos de proyecto | GET | `/project_types/?subgroup_id=X` | `useArchitectureProjectTypes` |
| Estructura del formulario | GET | `/{id}/form_structure/` | `useSectionValues` |

### Edificios y niveles — `/api/project-engines/`

| Función | Método | Ruta | Hook |
|---------|--------|------|------|
| Edificios | GET/POST | `/buildings/` | `useBuildings` |
| Niveles | GET/POST | `/levels/` | `useProjectLevels` |
| Pisos | GET/POST | `/floors/` | `useFloors` |
| Superficies | GET/POST | `/surface-polygons/` | `useFloors` (incluido) |

### Parámetros — `/api/parameters/`

| Función | Método | Ruta | Hook |
|---------|--------|------|------|
| Tipos de formulario | GET | `/form-types/` | `useFormTypes` |
| Valores de sección | GET | `/node-parameters/?project_node=X` | `useSectionValues` |
| Actualizar parámetro | PATCH | `/node-parameters/{id}/` | mutations en `useSectionValues` |

### Protección al fuego — `/api/fire-protection/`

Ver `src/hooks/FormHooks/useCAMApi.ts` — wrapper completo de todos los endpoints.

| Función | Método | Ruta |
|---------|--------|------|
| Soluciones analizadas | GET/POST | `/analyzed-solutions/` |
| Crear desde base | POST | `/proposed-solutions/create_from_base/` |
| Capas | GET/POST/PATCH/DELETE | `/layers/`, `/proposed-layers/` |

### Generación de PDF — `/formpdf/`

| Función | Método | Ruta | Hook |
|---------|--------|------|------|
| Iniciar generación | POST | `/formpdf/generate/` | `usePDFGeneration` |
| Estado de tarea | GET | `/formpdf/tasks/{taskId}/` | `usePDFGeneration` (polling) |

### Actividad — `/api/activity/`

| Función | Método | Ruta |
|---------|--------|------|
| Logs del proyecto | GET | `/project-activity-logs/?project_node=X` |
| Resolver acción | POST | `/project-activity-logs/{id}/resolve/` |

---

## Manejo de errores

Los errores de API tienen esta forma estándar:

```typescript
interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>  // errores de validación por campo
}
```

Para mutaciones, capturar con `onError` de React Query:

```typescript
useMutation({
  mutationFn: ...,
  onError: (error: AxiosError<ApiError>) => {
    const message = error.response?.data?.message ?? 'Error inesperado'
    // mostrar Toast o setear errores en formulario
  }
})
```

---

## Agregar una nueva llamada

1. Implementar la función en `src/services/` si requiere lógica especial, o directamente en el hook
2. Envolver en `useQuery` o `useMutation` con `queryKey` descriptivo
3. Documentar en la tabla correspondiente de este archivo
4. Actualizar `CHANGELOG.md`
