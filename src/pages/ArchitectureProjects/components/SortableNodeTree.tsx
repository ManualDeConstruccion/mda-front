import React from 'react';
import { ProjectNode } from '../../../types/project_nodes.types';
import SortableListNode from './SortableListNode';
import SortableNodeRow from './SortableNodeRow';
import styles from '../ListadoDeAntecedentes.module.scss';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface SortableNodeTreeProps {
  nodes: ProjectNode[];
  depth?: number;
  openAccordions: { [key: number]: boolean };
  onToggleAccordion: (nodeId: number) => void;
  onAddNode: (parentId: number) => void;
  onEditNode: (node: ProjectNode) => void;
  onDeleteNode: (node: ProjectNode) => void;
  onReorderNodes?: (parentId: number, nodeOrders: { id: number; order: number }[]) => void;
  activeId?: number | null;
  overId?: number | null;
}

const SortableNodeTree: React.FC<SortableNodeTreeProps> = ({
  nodes,
  depth = 0,
  openAccordions,
  onToggleAccordion,
  onAddNode,
  onEditNode,
  onDeleteNode,
  onReorderNodes,
  activeId,
  overId,
}) => {
  // Configuración de sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requiere 5px de movimiento para activar el drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Función para manejar el final del drag and drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && nodes && onReorderNodes) {
      const oldIndex = nodes.findIndex(node => node.id === active.id);
      const newIndex = nodes.findIndex(node => node.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newNodes = arrayMove(nodes, oldIndex, newIndex);
        
        // Preparar los datos para enviar al backend
        const nodeOrders = newNodes.map((node, index) => ({
          id: node.id,
          order: index
        }));

        // Obtener el parent_id del primer nodo (todos deberían tener el mismo padre)
        const parentId = newNodes[0]?.parent;
        if (parentId) {
          try {
            // Optimistic update: mostrar el cambio inmediatamente
            // El backend se encargará de actualizar la numeración
            await onReorderNodes(parentId, nodeOrders);
            console.log('Nodos reordenados exitosamente');
          } catch (error) {
            console.error('Error al reordenar los nodos:', error);
            // Mostrar notificación de error más elegante
            alert('Error al reordenar los nodos. Por favor, intenta de nuevo.');
          }
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={nodes?.map(node => node.id) || []}
        strategy={verticalListSortingStrategy}
      >
        <>
          {nodes.map((node) => {
            if (node.type === 'list') {
              return (
                <SortableListNode
                  key={node.id}
                  node={node}
                  depth={depth}
                  isOpen={openAccordions[node.id]}
                  onToggle={onToggleAccordion}
                  onAdd={onAddNode}
                  onEdit={onEditNode}
                  onDelete={onDeleteNode}
                  indentClass={styles[`indent-${depth + 1}`]}
                  isDragging={activeId === node.id}
                  isOver={overId === node.id}
                >
                  {/* Renderizar listados hijos recursivamente */}
                  <SortableNodeTree
                    nodes={node.children?.filter(n => n.type === 'list').sort((a: any, b: any) => {
                      const aName = a.numbered_name || a.name;
                      const bName = b.numbered_name || b.name;
                      return aName.localeCompare(bName);
                    }) || []}
                    depth={depth + 1}
                    openAccordions={openAccordions}
                    onToggleAccordion={onToggleAccordion}
                    onAddNode={onAddNode}
                    onEditNode={onEditNode}
                    onDeleteNode={onDeleteNode}
                    onReorderNodes={onReorderNodes}
                    activeId={activeId}
                    overId={overId}
                  />
                  {/* Renderizar documentos hijos con drag and drop */}
                  <SortableContext
                    items={node.children?.filter(n => n.type !== 'list').map(n => n.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {node.children
                      ?.filter(n => n.type !== 'list')
                      .sort((a: any, b: any) => {
                        const aName = a.numbered_name || a.name;
                        const bName = b.numbered_name || b.name;
                        return aName.localeCompare(bName);
                      })
                      .map((doc) => (
                        <SortableNodeRow
                          key={doc.id}
                          node={doc}
                          depth={depth + 1}
                          onEdit={onEditNode}
                          onDelete={onDeleteNode}
                          indentClass={styles[`indent-${depth + 3}`]}
                          isDragging={activeId === doc.id}
                          isOver={overId === doc.id}
                        />
                      ))}
                  </SortableContext>
                </SortableListNode>
              );
            }
            
            // Renderizar otros tipos de nodo (document, form, certificate, etc.) en el nivel raíz
            return (
              <SortableNodeRow
                key={node.id}
                node={node}
                depth={depth}
                onEdit={onEditNode}
                onDelete={onDeleteNode}
                indentClass={styles[`indent-${depth + 1}`]}
                isDragging={activeId === node.id}
                isOver={overId === node.id}
              />
            );
          })}
        </>
      </SortableContext>
    </DndContext>
  );
};

export default SortableNodeTree; 