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

interface CreateCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentId: number | null;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  open,
  onClose,
  onSuccess,
  parentId,
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
      parent?: number | null;
      order: number;
    }) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.post(`${API_URL}/api/architecture/categories/`, data, {
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
    createMutation.mutate({
      code,
      name,
      description: description || undefined,
      parent: parentId,
      order,
    });
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {parentId ? 'Crear Subcategoría' : 'Crear Nueva Categoría'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {createMutation.isError && (
              <Alert severity="error">
                Error al crear la categoría. Por favor, intenta nuevamente.
              </Alert>
            )}

            <TextField
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
              helperText="Código único de la categoría (ej: permisos_edificacion)"
              error={createMutation.isError}
            />

            <TextField
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              helperText="Nombre descriptivo de la categoría"
              error={createMutation.isError}
            />

            <TextField
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              helperText="Descripción opcional de la categoría"
            />

            <TextField
              label="Orden"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              fullWidth
              helperText="Orden de visualización (menor número aparece primero)"
            />

            {parentId && (
              <Typography variant="body2" color="text.secondary">
                Esta categoría se creará como subcategoría de la categoría seleccionada.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || !code || !name}
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Categoría'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateCategoryModal;
