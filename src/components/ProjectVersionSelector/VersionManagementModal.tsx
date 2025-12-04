import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useProjectSnapshots } from '../../hooks/useProjectSnapshots';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Paper,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { ProjectSnapshot } from '../../types/project_snapshots.types';
import styles from './VersionManagementModal.module.scss';

interface VersionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VersionManagementModal: React.FC<VersionManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { projectNodeId } = useProject();
  const {
    snapshots,
    isLoadingSnapshots,
    activeSnapshot,
    createSnapshot,
    updateSnapshot,
    deleteSnapshot,
    restoreSnapshot,
  } = useProjectSnapshots(projectNodeId);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedReason, setEditedReason] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newReason, setNewReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = (snapshot: ProjectSnapshot) => {
    setEditingId(snapshot.id);
    setEditedName(snapshot.name);
    setEditedReason(snapshot.reason || '');
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedName('');
    setEditedReason('');
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!projectNodeId || !editingId) return;

    if (!editedName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      await updateSnapshot.mutateAsync({
        projectNodeId,
        snapshotId: editingId,
        data: {
          name: editedName.trim(),
          reason: editedReason.trim() || undefined,
        },
      });
      handleCancelEdit();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Error al actualizar la versión');
    }
  };

  const handleDelete = async (snapshotId: number) => {
    if (!projectNodeId) return;

    if (!window.confirm('¿Estás seguro de que deseas eliminar esta versión? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteSnapshot.mutateAsync({
        projectNodeId,
        snapshotId,
      });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Error al eliminar la versión');
    }
  };

  const handleCreate = async () => {
    if (!projectNodeId) return;

    if (!newName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      await createSnapshot.mutateAsync({
        project_node: projectNodeId,
        name: newName.trim(),
        reason: newReason.trim() || undefined,
      });
      setIsCreating(false);
      setNewName('');
      setNewReason('');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Error al crear la versión');
    }
  };

  const handleRestore = async (snapshotId: number) => {
    if (!projectNodeId) return;

    try {
      await restoreSnapshot.mutateAsync({
        projectNodeId,
        snapshotId,
        data: {
          exact_restore: true,
        },
      });
      setError(null);
      onClose();
      // La página se actualizará automáticamente gracias a la invalidación de queries y reload
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Error al restaurar la versión');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserDisplayName = (createdBy: ProjectSnapshot['created_by']) => {
    if (!createdBy) return '-';
    const fullName = `${createdBy.first_name || ''} ${createdBy.last_name || ''}`.trim();
    return fullName || createdBy.email;
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Gestión de Versiones</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!isCreating ? (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setIsCreating(true)}
            variant="contained"
            sx={{ mb: 2 }}
          >
            Crear Nueva Versión
          </Button>
        ) : (
          <div className={styles.createForm}>
            <TextField
              label="Nombre *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Descripción"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              fullWidth
              margin="normal"
              multiline
              rows={2}
              helperText="Motivo por el cual se crea este snapshot"
            />
            <div className={styles.createActions}>
              <Button
                startIcon={<SaveIcon />}
                onClick={handleCreate}
                variant="contained"
                disabled={!newName.trim() || createSnapshot.isPending}
              >
                Crear
              </Button>
              <Button
                startIcon={<CancelIcon />}
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                  setNewReason('');
                  setError(null);
                }}
                variant="outlined"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Versión</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Creado en</TableCell>
                <TableCell>Creado por</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoadingSnapshots ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : snapshots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay versiones disponibles
                  </TableCell>
                </TableRow>
              ) : (
                snapshots.map((snapshot) => (
                  <TableRow key={snapshot.id}>
                    {editingId === snapshot.id ? (
                      <>
                        <TableCell>{snapshot.version}</TableCell>
                        <TableCell>
                          <TextField
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            size="small"
                            fullWidth
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={editedReason}
                            onChange={(e) => setEditedReason(e.target.value)}
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                          />
                        </TableCell>
                        <TableCell>{formatDate(snapshot.created_at)}</TableCell>
                        <TableCell>{getUserDisplayName(snapshot.created_by)}</TableCell>
                        <TableCell>
                          {snapshot.is_active ? (
                            <Chip label="Activa" color="success" size="small" />
                          ) : (
                            <Chip label="Inactiva" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={handleSaveEdit}
                            disabled={!editedName.trim() || updateSnapshot.isPending}
                            color="primary"
                            title="Guardar"
                          >
                            <SaveIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={handleCancelEdit}
                            color="secondary"
                            title="Cancelar"
                          >
                            <CancelIcon />
                          </IconButton>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{snapshot.version}</TableCell>
                        <TableCell>{snapshot.name}</TableCell>
                        <TableCell>{snapshot.reason || '-'}</TableCell>
                        <TableCell>{formatDate(snapshot.created_at)}</TableCell>
                        <TableCell>{getUserDisplayName(snapshot.created_by)}</TableCell>
                        <TableCell>
                          {snapshot.is_active ? (
                            <Chip label="Activa" color="success" size="small" />
                          ) : (
                            <Chip label="Inactiva" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {!snapshot.is_active && (
                            <IconButton
                              size="small"
                              onClick={() => handleRestore(snapshot.id)}
                              color="primary"
                              title="Restaurar esta versión"
                              disabled={restoreSnapshot.isPending}
                            >
                              <RestoreIcon />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleStartEdit(snapshot)}
                            color="primary"
                            title="Editar"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(snapshot.id)}
                            color="error"
                            title="Eliminar"
                            disabled={deleteSnapshot.isPending}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionManagementModal;

