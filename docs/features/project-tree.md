# Árbol de proyecto

Los proyectos son árboles jerárquicos de `ProjectNode`. El frontend renderiza,
navega y permite reorganizar este árbol usando drag-and-drop.

---

## Tipos de nodo (`TypeCode`)

| Código | Uso |
|--------|-----|
| `project` | Raíz del árbol (proyecto principal) |
| `stage` | Etapa del proyecto |
| `architecture_subproject` | Sub-proyecto de arquitectura con tipo de proyecto MINVU |
| `list` | Carpeta o lista de documentos |
| `document` | Documento con archivo adjunto |
| `form` | Nodo con formulario de parámetros |
| `certificate` | Certificado |
| `external_link` | Enlace externo |
| `construction_solution` | Solución constructiva (CAM) |

---

## Hook principal: useProjectNodes

```typescript
const {
  projects,          // ProjectNode[] — lista de nodos
  isLoadingProjects,
  createProject,     // mutation: crear nodo
  updateProject,     // mutation: actualizar (FormData o JSON)
  patchProject,      // mutation: actualizar parcialmente
  deleteProject,     // mutation: eliminar
  reorderNodes,      // función: reordenar con numeración
} = useProjectNodes<ProjectNode>(filters?)
```

Para obtener el árbol completo de un proyecto:

```typescript
const { data: tree } = useQuery({
  queryKey: ['project-tree', projectId],
  queryFn: () => api.get(`/projects/project-nodes/${projectId}/tree/`),
})
```

---

## Drag-and-drop (reordenamiento)

Usa `@dnd-kit/core` y `@dnd-kit/sortable`.

### Funcionamiento

1. El árbol se renderiza con `SortableContext` de dnd-kit
2. Al soltar un nodo en nueva posición, se llama `reorderNodes()`
3. `reorderNodes` hace `POST /api/projects/project-nodes/reorder_with_numbering/`
   con el nuevo orden
4. React Query invalida el queryKey del árbol para refetch

### Uso en la lista de proyectos

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={nodeIds} strategy={verticalListSortingStrategy}>
    {nodes.map(node => <SortableNode key={node.id} node={node} />)}
  </SortableContext>
</DndContext>
```

Ver [README-drag-drop.md](../../README-drag-drop.md) para la documentación detallada
del componente de reordenamiento de etapas.

---

## Estado del nodo

```typescript
type NodeStatus = 'en_estudio' | 'pendiente' | 'finalizado'
```

Cada nodo tiene `status` y `progress_percent` (0-100). El progreso se calcula
en el backend basado en parámetros completados vs requeridos.

---

## Sub-proyectos de arquitectura

Los nodos de tipo `architecture_subproject` tienen asociado un `ArchitectureProjectType`
que define qué formulario MINVU aplica. Desde la vista de detalle se puede acceder a:

- **`/proyectos/:projectId/arquitectura/:architectureId`** — detalle del sub-proyecto
- **`/proyectos/:projectId/arquitectura/:architectureId/superficies`** — editor de superficies
- **`/proyectos/:projectId/arquitectura/:architectureId/pisos`** — editor de pisos/niveles

### Edificios, niveles y superficies

```
ArchitectureProject
└── Building
    └── ProjectLevel (sótano, planta, azotea)
        └── SurfacePolygon (polígono de superficie con área calculada)
```

Hooks: `useBuildings(projectNodeId)`, `useProjectLevels(filters)`, `useFloors(filters)`

---

## Snapshots / Versiones

Cada proyecto puede tener snapshots (versiones inmutables del árbol):

```typescript
const { data: snapshots } = useProjectSnapshots(projectNodeId)
```

Endpoint: `GET /api/projects/project-snapshots/?project_node=ID`

El selector de versión (`ProjectVersionSelector`) permite cambiar la vista
al estado del proyecto en un snapshot anterior.
