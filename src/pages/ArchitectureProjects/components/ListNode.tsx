import React from 'react';
import { IconButton, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProjectNode } from '../../../types/project_nodes.types';
import styles from '../ListadoDeAntecedentes.module.scss';

interface ListNodeProps {
  node: ProjectNode;
  depth: number;
  isOpen: boolean;
  onToggle: (nodeId: number) => void;
  onAdd: (nodeId: number) => void;
  onEdit: (node: ProjectNode) => void;
  onDelete: (node: ProjectNode) => void;
  children: React.ReactNode;
}

const ListNode: React.FC<ListNodeProps> = ({
  node,
  depth,
  isOpen,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  children
}) => {
  return (
    <React.Fragment>
      <tr className={styles.listadoRow}>
        <td 
          className={`${styles.listadoCellNombre} ${depth > 0 ? styles.listadoCellNombreIndent : ''}`} 
          onClick={() => onToggle(node.id)}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton 
              size="small" 
              onClick={e => { 
                e.stopPropagation(); 
                onToggle(node.id); 
              }}
            >
              {isOpen ? <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} /> : <ExpandMoreIcon />}
            </IconButton>
            <Typography className={styles.textNombre}>{node.name}</Typography>
          </Box>
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
              onEdit(node); 
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={e => { 
              e.stopPropagation(); 
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
              onDelete(node);
            }}
            className={styles.botonRojo}
          >
            <DeleteIcon />
          </IconButton>
        </td>
      </tr>
      {/* Fila para la descripción del listado */}
      <tr className={styles.listadoRow}>
        <td colSpan={7} className={styles.listadoCellDescripcionIndent}>
          {node.description && (
            <Typography variant="body2" className={styles.textDescripcion}>
              {node.description}
            </Typography>
          )}
        </td>
      </tr>
      {isOpen && children}
    </React.Fragment>
  );
};

export default ListNode; 