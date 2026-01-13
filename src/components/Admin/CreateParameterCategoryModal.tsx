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

interface ParameterCategory {
  id: number;
  code: string;
  name: string;
  description?: string;
  order: number;
  is_active: boolean;
}

interface CreateParameterCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (category?: ParameterCategory) => void;
  category?: ParameterCategory | null;
}

const CreateParameterCategoryModal: React.FC<CreateParameterCategoryModalProps> = ({
  open,
  onClose,
  onSuccess,
  category,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setCode(category.code);
      setName(category.name);
      setDescription(category.description || '');
      setOrder(category.order);
      setIsActive(category.is_active);
    } else {
      setCode('');
      setName('');
      setDescription('');
      setOrder(0);
      setIsActive(true);
    }
  }, [category, open]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      if (category) {
        const response = await axios.patch(
          `${API_URL}/api/parameters/parameter-categories/${category.id}/`,
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
      } else {
        const response = await axios.post(
          `${API_URL}/api/parameters/parameter-categories/`,
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter-categories'] });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.code?.[0] || err.response?.data?.detail || 'Error al guardar');
    },
  });

  const handleSubmit = () => {
    setError(null);
    if (!code.trim() || !name.trim()) {
      setError('Código y nombre son requeridos');
      return;
    }

    createMutation.mutate({
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || '',
      order,
      is_active: isActive,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {category ? 'Editar Categoría' : 'Nueva Categoría de Parámetros'}
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
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            fullWidth
            disabled={!!category}
            helperText={category ? 'El código no puede cambiarse' : 'Código único de la categoría'}
          />

          <TextField
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
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
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            }
            label="Activa"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateParameterCategoryModal;
