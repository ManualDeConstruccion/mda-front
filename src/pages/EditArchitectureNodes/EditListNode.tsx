import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
import { ProjectNode } from '../../types/project_nodes.types';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { useQueryClient } from '@tanstack/react-query';
import NodePermissionsModal from './NodePermissionsModal';

// TODO: Importar los modales correspondientes para cada tipo de nodo
// Ejemplo:
// import EditDocumentNode from './EditDocumentNode';
// import EditFormNode from './EditFormNode';
// import EditCertificateNode from './EditCertificateNode';
// import EditConstructionSolutionNode from './EditConstructionSolutionNode';
// import EditLayerNode from './EditLayerNode';
// import EditExternalLinkNode from './EditExternalLinkNode';

interface EditListNodeProps {
  open: boolean;
  onClose: () => void;
  node: ProjectNode | null;
  stageId: number;
}

const EditListNode: React.FC<EditListNodeProps> = ({ open, onClose, node, stageId }) => {
  const { updateProject } = useProjectNodes();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  // TODO: Agregar estados para los diferentes tipos de nodos
  // Ejemplo:
  // const [showDocumentModal, setShowDocumentModal] = useState(false);
  // const [showFormModal, setShowFormModal] = useState(false);
  // const [showCertificateModal, setShowCertificateModal] = useState(false);
  // const [showConstructionSolutionModal, setShowConstructionSolutionModal] = useState(false);
  // const [showLayerModal, setShowLayerModal] = useState(false);
  // const [showExternalLinkModal, setShowExternalLinkModal] = useState(false);

  useEffect(() => {
    if (node) {
      setName(node.name || '');
      setDescription(node.description || '');
      setError(null);
    }
  }, [node, open]);

  const handleSave = async () => {
    if (!node) return;
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProject.mutateAsync({
        id: node.id,
        data: { name, description, type: 'list' },
      });
      queryClient.invalidateQueries({ queryKey: ['projectNodeTree', stageId] });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // TODO: Agregar manejadores para los diferentes tipos de nodos
  // Ejemplo:
  // const handleDocumentNode = () => {
  //   setShowDocumentModal(true);
  // };
  // const handleFormNode = () => {
  //   setShowFormModal(true);
  // };
  // const handleCertificateNode = () => {
  //   setShowCertificateModal(true);
  // };
  // const handleConstructionSolutionNode = () => {
  //   setShowConstructionSolutionModal(true);
  // };
  // const handleLayerNode = () => {
  //   setShowLayerModal(true);
  // };
  // const handleExternalLinkNode = () => {
  //   setShowExternalLinkModal(true);
  // };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Listado</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ py: 1 }}>
            <TextField
              label="Nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              required
              disabled={saving}
            />
            <TextField
              label="Descripción"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              disabled={saving}
            />
            {error && <Box color="error.main">{error}</Box>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPermissions(true)} color="secondary" variant="outlined">
            Editar permisos
          </Button>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} color="primary" variant="contained" disabled={saving}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* TODO: Agregar los modales para cada tipo de nodo */}
      {/* Ejemplo:
      <EditDocumentNode
        open={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        node={node}
        stageId={stageId}
      />
      <EditFormNode
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        node={node}
        stageId={stageId}
      />
      <EditCertificateNode
        open={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        node={node}
        stageId={stageId}
      />
      <EditConstructionSolutionNode
        open={showConstructionSolutionModal}
        onClose={() => setShowConstructionSolutionModal(false)}
        node={node}
        stageId={stageId}
      />
      <EditLayerNode
        open={showLayerModal}
        onClose={() => setShowLayerModal(false)}
        node={node}
        stageId={stageId}
      />
      <EditExternalLinkNode
        open={showExternalLinkModal}
        onClose={() => setShowExternalLinkModal(false)}
        node={node}
        stageId={stageId}
      />
      */}

      {/* Modal de permisos */}
      <NodePermissionsModal open={showPermissions} onClose={() => setShowPermissions(false)} nodeId={node?.id} />
    </>
  );
};

export default EditListNode; 