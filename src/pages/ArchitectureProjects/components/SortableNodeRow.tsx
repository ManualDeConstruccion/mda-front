import React from 'react';
import { IconButton, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProjectNode } from '../../../types/project_nodes.types';
import styles from '../ListadoDeAntecedentes.module.scss';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableNodeRowProps {
  node: ProjectNode;
  depth: number;
  onEdit: (node: ProjectNode) => void;
  onDelete: (node: ProjectNode) => void;
  indentClass?: string;
  isDragging?: boolean;
  isOver?: boolean;
}

const SortableNodeRow: React.FC<SortableNodeRowProps> = ({ 
  node, 
  onEdit, 
  onDelete, 
  indentClass,
  isDragging = false,
  isOver = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isDragging ? styles.dragging : ''} ${isOver ? styles.over : ''}`}
    >
      <td className={`${styles.tableCellIndent} ${indentClass || ''}`}>
        {node.file_url ? (
          <a href={node.file_url} target="_blank" rel="noopener noreferrer" className={styles.textDocument}>
            {node.numbered_name || node.name}
          </a>
        ) : (
          <Typography className={styles.textDocument}>
            {node.numbered_name || node.name}
          </Typography>
        )}
        {isDragging && <span className={styles.dragIndicator}>↔</span>}
      </td>
      <td className={styles.tableCell}>{node.type_name}</td>
      <td className={styles.tableCell}>{node.start_date ? new Date(node.start_date).toLocaleDateString() : '-'}</td>
      <td className={styles.tableCell}>{node.end_date ? new Date(node.end_date).toLocaleDateString() : '-'}</td>
      <td className={styles.tableCell}>{node.status || '-'}</td>
      <td className={styles.tableCell}>{node.progress_percent ?? 0}%</td>
      <td className={styles.tableCellRight}>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            if (!isDragging) {
              onEdit(node);
            }
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            if (!isDragging) {
              onDelete(node);
            }
          }}
          className={styles.tableCellRightButton}
        >
          <DeleteIcon />
        </IconButton>
      </td>
    </tr>
  );
};

export default SortableNodeRow; 