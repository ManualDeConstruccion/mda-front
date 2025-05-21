import React from 'react';
import { ProjectNode } from '../../../types/project_nodes.types';
import ListNode from './ListNode';
import NodeRow from './NodeRow';
import styles from '../ListadoDeAntecedentes.module.scss';

interface NodeTreeProps {
  nodes: ProjectNode[];
  depth?: number;
  openAccordions: { [key: number]: boolean };
  onToggleAccordion: (nodeId: number) => void;
  onAddNode: (parentId: number) => void;
  onEditNode: (node: ProjectNode) => void;
  onDeleteNode: (node: ProjectNode) => void;
}

const NodeTree: React.FC<NodeTreeProps> = ({
  nodes,
  depth = 0,
  openAccordions,
  onToggleAccordion,
  onAddNode,
  onEditNode,
  onDeleteNode,
}) => {
  return (
    <>
      {nodes.map((node) => {
        if (node.type === 'list') {
          return (
            <ListNode
              key={node.id}
              node={node}
              depth={depth}
              isOpen={openAccordions[node.id]}
              onToggle={onToggleAccordion}
              onAdd={onAddNode}
              onEdit={onEditNode}
              onDelete={onDeleteNode}
            >
              {/* Renderizar listados hijos recursivamente */}
              <NodeTree
                nodes={node.children?.filter(n => n.type === 'list') || []}
                depth={depth + 1}
                openAccordions={openAccordions}
                onToggleAccordion={onToggleAccordion}
                onAddNode={onAddNode}
                onEditNode={onEditNode}
                onDeleteNode={onDeleteNode}
              />
              {/* Renderizar documentos hijos */}
              {node.children
                ?.filter(n => n.type !== 'list')
                .map((doc) => (
                  <NodeRow
                    key={doc.id}
                    node={doc}
                    depth={depth + 1}
                    onEdit={onEditNode}
                    onDelete={onDeleteNode}
                    indentClass={styles[`indent-${depth + 2}`]}
                  />
                ))}
            </ListNode>
          );
        }
        return null; // Los documentos en el nivel raíz no se renderizan
      })}
    </>
  );
};

export default NodeTree; 