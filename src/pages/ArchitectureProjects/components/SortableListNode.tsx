import React from 'react';
import { IconButton, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProjectNode } from '../../../types/project_nodes.types';
import styles from '../ListadoDeAntecedentes.module.scss';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableListNodeProps {
  node: ProjectNode;
  depth: number;
  isOpen: boolean;
  onToggle: (nodeId: number) => void;
  onAdd: (nodeId: number) => void;
  onEdit: (node: ProjectNode) => void;
  onDelete: (node: ProjectNode) => void;
  children: React.ReactNode;
  indentClass?: string;
  isDragging?: boolean;
  isOver?: boolean;
}

const SortableListNode: React.FC<SortableListNodeProps> = ({
  node,
  depth,
  isOpen,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  children,
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
    <React.Fragment>
      <tr 
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`${styles.listadoRow} ${isDragging ? styles.dragging : ''} ${isOver ? styles.over : ''}`}
      >
        <td 
          className={`${styles.listadoCellNombre} ${depth > 0 ? styles.listadoCellNombreIndent : ''} ${indentClass ? indentClass : ''}`}
          {...listeners}
          style={{ cursor: 'grab' }}
          onClick={(e) => {
            // Prevenir el clic durante el arrastre
            if (!isDragging) {
              onToggle(node.id);
            }
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton 
              size="small" 
              onClick={e => { 
                e.stopPropagation(); 
                e.preventDefault();
                onToggle(node.id); 
              }}
            >
              {isOpen ? <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} /> : <ExpandMoreIcon />}
            </IconButton>
            <Typography className={styles.textNombre}>
              {node.numbered_name || node.name}
            </Typography>
            {isDragging && <span className={styles.dragIndicator}>↔</span>}
          </Box>
          {node.description && (
            <Typography className={styles.textDescripcion}>
              {node.description}
            </Typography>
          )}
        </td>
        <td className={styles.listadoCell}></td>
        <td className={styles.listadoCell}></td>
        <td className={styles.listadoCell}></td>
        <td className={styles.listadoCell}>{node.status || '-'}</td>
        <td className={styles.listadoCell}>{node.progress_percent ?? 0}%</td>
        <td className={styles.acciones}>
          <IconButton 
            size="small" 
            onClick={e => { 
              e.stopPropagation(); 
              e.preventDefault();
              onEdit(node); 
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={e => { 
              e.stopPropagation(); 
              e.preventDefault();
              onAdd(node.id); 
            }}
            className={styles.botonAzul}
          >
            <AddIcon />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(node);
            }}
            className={styles.botonRojo}
          >
            <DeleteIcon />
          </IconButton>
        </td>
      </tr>
      {isOpen && children}
    </React.Fragment>
  );
};

export default SortableListNode; 