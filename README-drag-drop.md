# Drag and Drop para Reordenar Stages

## Descripción

Esta funcionalidad permite reordenar los stages (etapas) de un proyecto de arquitectura usando drag and drop. Los cambios se guardan automáticamente en el backend.

## Tecnologías Utilizadas

- **@dnd-kit/core**: Biblioteca principal para drag and drop
- **@dnd-kit/sortable**: Extensión para funcionalidad de ordenamiento
- **@dnd-kit/utilities**: Utilidades para transformaciones CSS

## Instalación

Las dependencias ya están incluidas en el proyecto. Si necesitas instalarlas manualmente:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Uso

### Frontend

El componente `ArchitectureProjectDetail.tsx` incluye:

1. **Sensores de Drag and Drop**: Configurados para mouse y teclado
2. **Componente SortableStageButton**: Botones arrastrables para cada stage
3. **Contexto DndContext**: Envuelve la lista de stages
4. **Función handleDragEnd**: Maneja el reordenamiento y envía datos al backend

### Backend

El modelo `ProjectNode` incluye:

1. **Campo `order`**: Campo `PositiveIntegerField` para mantener el orden
2. **Endpoint `/api/project-nodes/reorder/`**: POST endpoint para actualizar el orden
3. **Serializer actualizado**: Incluye el campo `order` en la respuesta

## Estructura de Datos

### Request al Backend

```json
{
  "parent_id": 123,
  "node_orders": [
    {"id": 1, "order": 0},
    {"id": 2, "order": 1},
    {"id": 3, "order": 2}
  ]
}
```

### Response del Backend

```json
{
  "status": "Nodos reordenados exitosamente"
}
```

## Características

- **Drag and Drop visual**: Los botones se pueden arrastrar y soltar
- **Feedback visual**: Los elementos se vuelven semi-transparentes durante el arrastre
- **Actualización automática**: Los datos se refrescan después del reordenamiento
- **Manejo de errores**: Errores de red se manejan apropiadamente
- **Accesibilidad**: Soporte para navegación por teclado

## Estilos CSS

Los estilos incluyen:

- `cursor: grab/grabbing`: Indica que el elemento es arrastrable
- `user-select: none`: Previene selección de texto durante el arrastre
- `touch-action: none`: Optimiza para dispositivos táctiles
- Efectos hover y transiciones suaves

## Migración de Base de Datos

Para aplicar los cambios en la base de datos:

```bash
python manage.py makemigrations projects
python manage.py migrate
```

## Consideraciones de Rendimiento

- Los sensores están optimizados para rendimiento
- La actualización de la UI es inmediata
- Los datos se refrescan solo después de confirmar el cambio en el backend
- El ordenamiento se mantiene en la base de datos para persistencia 