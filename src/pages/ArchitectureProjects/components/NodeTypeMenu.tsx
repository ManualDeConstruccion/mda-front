import React from 'react';
import { MenuItem, Box, TextField, Button } from '@mui/material';
import { TypeCode } from '../../../types/project_nodes.types';
import styles from '../ListadoDeAntecedentes.module.scss';

interface NodeTypeMenuProps {
  isCreatingList: boolean;
  selectedListId: number | null;
  newListName: string;
  onNewListNameChange: (name: string) => void;
  onCreateList: () => void;
  onCreateAntecedent: (type: TypeCode) => void;
  onStartCreatingList: () => void;
  error: string | null;
}

const NodeTypeMenu: React.FC<NodeTypeMenuProps> = ({
  isCreatingList,
  selectedListId,
  newListName,
  onNewListNameChange,
  onCreateList,
  onCreateAntecedent,
  onStartCreatingList,
  error,
}) => {
  return (
    <Box className={styles.popoverContent}>
      {/* Si estamos creando un listado y no hay listado seleccionado */}
      {isCreatingList && !selectedListId && (
        <Box className={styles.popoverSection}>
          <TextField
            label="Nombre del listado"
            value={newListName}
            onChange={e => onNewListNameChange(e.target.value)}
            size="small"
            fullWidth
          />
          <Button 
            onClick={onCreateList} 
            variant="contained" 
            color="primary" 
            size="small" 
            className={styles.popoverButton}
          >
            Crear Listado
          </Button>
        </Box>
      )}

      {/* Si hay un listado seleccionado, mostrar opciones para agregar antecedentes */}
      {selectedListId && !isCreatingList && (
        <>
          <MenuItem disabled>Selecciona el tipo de antecedente a crear:</MenuItem>
          <MenuItem onClick={() => onCreateAntecedent('document')}>Documento</MenuItem>
          <MenuItem onClick={() => onCreateAntecedent('form')}>Formulario</MenuItem>
          <MenuItem onClick={() => onCreateAntecedent('certificate')}>Certificado</MenuItem>
          <MenuItem onClick={() => onCreateAntecedent('external_link')}>Enlace Externo</MenuItem>
          <MenuItem onClick={onStartCreatingList}>Listado</MenuItem>
        </>
      )}

      {/* Si estamos creando un listado contenedor dentro de otro listado */}
      {isCreatingList && selectedListId && (
        <Box className={styles.popoverSection}>
          <TextField
            label="Nombre del listado contenedor"
            value={newListName}
            onChange={e => onNewListNameChange(e.target.value)}
            size="small"
            fullWidth
          />
          <Button 
            onClick={onCreateList} 
            variant="contained" 
            color="primary" 
            size="small" 
            className={styles.popoverButton}
          >
            Crear Listado Contenedor
          </Button>
        </Box>
      )}

      {error && <MenuItem disabled className={styles.errorText}>{error}</MenuItem>}
    </Box>
  );
};

export default NodeTypeMenu; 