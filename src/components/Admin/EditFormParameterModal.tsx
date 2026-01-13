import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Alert,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface FormParameter {
  id: number;
  category: number;
  parameter_definition: number;
  order: number;
  is_required: boolean;
  is_visible: boolean;
  parameter_definition_name?: string;
  parameter_definition_code?: string;
}

interface EditFormParameterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parameter: FormParameter | null;
  projectTypeId: number;
}

const EditFormParameterModal: React.FC<EditFormParameterModalProps> = ({
  open,
  onClose,
  onSuccess,
  parameter,
  projectTypeId,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState(0);
  const [isRequired, setIsRequired] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (parameter) {
      setOrder(parameter.order);
      setIsRequired(parameter.is_required);
      setIsVisible(parameter.is_visible);
    }
  }, [parameter, open]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.patch(
        `${API_URL}/api/parameters/form-parameters/${parameter?.id}/`,
        data,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Error al actualizar');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      await axios.delete(
        `${API_URL}/api/parameters/form-parameters/${parameter?.id}/`,
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Error al eliminar');
    },
  });

  const handleSubmit = () => {
    setError(null);
    updateMutation.mutate({
      order,
      is_required: isRequired,
      is_visible: isVisible,
    });
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar este parámetro de la sección?')) {
      deleteMutation.mutate();
    }
  };

  if (!parameter) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Editar Parámetro: {parameter.parameter_definition_name}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Código"
            value={parameter.parameter_definition_code || ''}
            fullWidth
            disabled
            helperText="Código del parámetro (no editable)"
          />

          <TextField
            label="Orden"
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            fullWidth
            inputProps={{ min: 0 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
              />
            }
            label="Requerido"
          />

          <FormControlLabel
            control={
              <Switch
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
              />
            }
            label="Visible"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleDelete}
          color="error"
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditFormParameterModal;
