import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface UpdateParametersModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Snapshot {
  id: number;
  version: string;
  description: string;
  created_at: string;
  created_by?: {
    id: number;
    username: string;
  };
  parameters_count?: number;
}

const UpdateParametersModal: React.FC<UpdateParametersModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

  // Obtener lista de snapshots
  const { data: snapshotsData, refetch: refetchSnapshots } = useQuery<{ results: Snapshot[] } | Snapshot[]>({
    queryKey: ['parameter-snapshots'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/parameters/parameter-updates/`,
        {
          withCredentials: true,
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );
      return response.data;
    },
    enabled: open,
  });

  const snapshots = Array.isArray(snapshotsData) ? snapshotsData : snapshotsData?.results || [];

  // Crear snapshot
  const createSnapshotMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await axios.post(
        `${API_URL}/api/parameters/parameter-definitions/create-snapshot/`,
        { description },
        {
          withCredentials: true,
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      refetchSnapshots();
      setDescription('');
      if (applyToAll) {
        applySnapshotMutation.mutate();
      } else {
        onSuccess?.();
      }
    },
  });

  // Aplicar snapshot a todos los proyectos
  const applySnapshotMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${API_URL}/api/parameters/parameter-definitions/apply-latest-snapshot/`,
        { force: false },
        {
          withCredentials: true,
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter-snapshots'] });
      onSuccess?.();
    },
  });

  const handleCreateSnapshot = () => {
    if (!description.trim()) {
      return;
    }
    createSnapshotMutation.mutate(description);
  };

  const handleApplySnapshot = () => {
    applySnapshotMutation.mutate();
  };

  const handleClose = () => {
    setDescription('');
    setApplyToAll(false);
    onClose();
  };

  const latestSnapshot = snapshots?.[0];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UpdateIcon />
          <Typography variant="h6">Actualizar Parámetros</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Información del snapshot más reciente */}
          {latestSnapshot && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Snapshot más reciente: v{latestSnapshot.version}
              </Typography>
              {latestSnapshot.description && (
                <Typography variant="body2" color="text.secondary">
                  {latestSnapshot.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Creado: {new Date(latestSnapshot.created_at).toLocaleString('es-CL')}
                {latestSnapshot.created_by_name && ` por ${latestSnapshot.created_by_name}`}
              </Typography>
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Crear nuevo snapshot */}
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Crear Nuevo Snapshot
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Crea un snapshot del estado actual de todos los parámetros. Esto permitirá que los
            proyectos actualicen sus parámetros a esta versión.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descripción del snapshot"
            placeholder="Ej: Agregados nuevos parámetros de superficie, actualizada validación de altura máxima..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Describe los cambios realizados en los parámetros"
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <input
              type="checkbox"
              id="applyToAll"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
            />
            <label htmlFor="applyToAll">
              <Typography variant="body2">
                Aplicar automáticamente a todos los proyectos después de crear el snapshot
              </Typography>
            </label>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Aplicar snapshot existente */}
          {latestSnapshot && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Aplicar Snapshot a Todos los Proyectos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Aplica el snapshot más reciente (v{latestSnapshot.version}) a todos los proyectos
                que tengan una versión anterior.
              </Typography>
            </Box>
          )}

          {/* Errores */}
          {createSnapshotMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error al crear snapshot: {String(createSnapshotMutation.error)}
            </Alert>
          )}

          {applySnapshotMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error al aplicar snapshot: {String(applySnapshotMutation.error)}
            </Alert>
          )}

          {/* Resultados */}
          {createSnapshotMutation.isSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Snapshot creado correctamente
              </Typography>
              <Typography variant="body2">
                Versión: {createSnapshotMutation.data.version}
              </Typography>
              <Typography variant="body2">
                Parámetros: {createSnapshotMutation.data.parameters_count}
              </Typography>
            </Alert>
          )}

          {applySnapshotMutation.isSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Snapshot aplicado correctamente
              </Typography>
              <Typography variant="body2">
                Proyectos actualizados: {applySnapshotMutation.data.projects_applied}
              </Typography>
              <Typography variant="body2">
                Parámetros agregados: {applySnapshotMutation.data.total_parameters_added}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tiempo de ejecución: {applySnapshotMutation.data.execution_time_ms}ms
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={createSnapshotMutation.isPending || applySnapshotMutation.isPending}>
          Cerrar
        </Button>
        {latestSnapshot && (
          <Button
            variant="outlined"
            onClick={handleApplySnapshot}
            disabled={createSnapshotMutation.isPending || applySnapshotMutation.isPending}
            startIcon={applySnapshotMutation.isPending ? <CircularProgress size={16} /> : <UpdateIcon />}
          >
            Aplicar Snapshot Actual
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleCreateSnapshot}
          disabled={!description.trim() || createSnapshotMutation.isPending || applySnapshotMutation.isPending}
          startIcon={createSnapshotMutation.isPending ? <CircularProgress size={16} /> : <UpdateIcon />}
        >
          Crear Snapshot
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateParametersModal;
