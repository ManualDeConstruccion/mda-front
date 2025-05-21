import React from 'react';
import { IconButton, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProjectNode } from '../../../types/project_nodes.types';
import styles from '../ListadoDeAntecedentes.module.scss';

interface NodeRowProps {
  node: ProjectNode;
  depth: number;
  onEdit: (node: ProjectNode) => void;
  onDelete: (node: ProjectNode) => void;
  indentClass?: string;
}

const NodeRow: React.FC<NodeRowProps> = ({ node, onEdit, onDelete, indentClass }) => {
  return (
    <tr>
      <td className={`${styles.tableCellIndent} ${indentClass || ''}`}>
        {node.file_url ? (
          <a href={node.file_url} target="_blank" rel="noopener noreferrer" className={styles.textDocument}>
            {node.name}
          </a>
        ) : (
          <Typography className={styles.textDocument}>{node.name}</Typography>
        )}
      </td>
      <td className={styles.tableCell}>{node.type}</td>
      <td className={styles.tableCell}>{node.start_date ? new Date(node.start_date).toLocaleDateString() : '-'}</td>
      <td className={styles.tableCell}>{node.end_date ? new Date(node.end_date).toLocaleDateString() : '-'}</td>
      <td className={styles.tableCell}>{node.status || '-'}</td>
      <td className={styles.tableCell}>{node.progress_percent ?? 0}%</td>
      <td className={styles.tableCellRight}>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(node);
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node);
          }}
          className={styles.tableCellRightButton}
        >
          <DeleteIcon />
        </IconButton>
      </td>
    </tr>
  );
};

export default NodeRow; 