import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface CreateProjectTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryId: number | null;
}

const CreateProjectTypeModal: React.FC<CreateProjectTypeModalProps> = ({
  open,
  onClose,
  onSuccess,
  categoryId,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const queryClient = useQueryClient();

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      setCode('');
      setName('');
      setDescription('');
      setOrder(0);
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      description?: string;
      category: number;
      order: number;
    }) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.post(`${API_URL}/api/architecture/architecture-project-types/`, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      return;
    }
    createMutation.mutate({
      code,
      name,
      description: description || undefined,
      category: categoryId,
      order,
    });
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      onClose();
    }
  };

  if (!categoryId) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Crear Nuevo Tipo de Proyecto</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {createMutation.isError && (
              <Alert severity="error">
                Error al crear el tipo de proyecto. Por favor, intenta nuevamente.
              </Alert>
            )}

            <TextField
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
              helperText="Código único del tipo de proyecto (ej: permiso_edificacion_obra_nueva)"
              error={createMutation.isError}
            />

            <TextField
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              helperText="Nombre descriptivo del tipo de proyecto"
              error={createMutation.isError}
            />

            <TextField
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              helperText="Descripción opcional del tipo de proyecto"
            />

            <TextField
              label="Orden"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              fullWidth
              helperText="Orden de visualización (menor número aparece primero)"
            />

            <Typography variant="body2" color="text.secondary">
              Este tipo de proyecto se asociará a la categoría seleccionada.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || !code || !name || !categoryId}
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Tipo de Proyecto'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateProjectTypeModal;
