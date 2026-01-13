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

interface FormParameterCategory {
  id: number;
  code: string;
  number: string;
  name: string;
  description?: string;
  parent?: number | null;
  order: number;
  is_active: boolean;
}

interface EditFormParameterCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: FormParameterCategory | null;
  projectTypeId: number;
  parentCategories?: FormParameterCategory[];
}

const EditFormParameterCategoryModal: React.FC<EditFormParameterCategoryModalProps> = ({
  open,
  onClose,
  onSuccess,
  category,
  projectTypeId,
  parentCategories = [],
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState<number | null>(null);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setCode(category.code);
      setNumber(category.number);
      setName(category.name);
      setDescription(category.description || '');
      setParent(category.parent || null);
      setOrder(category.order);
      setIsActive(category.is_active);
    } else {
      // Reset para crear nuevo
      setCode('');
      setNumber('');
      setName('');
      setDescription('');
      setParent(null);
      setOrder(0);
      setIsActive(true);
    }
  }, [category, open]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      if (category) {
        const response = await axios.patch(
          `${API_URL}/api/parameters/form-parameter-categories/${category.id}/`,
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
          `${API_URL}/api/parameters/form-parameter-categories/`,
          { ...data, project_type: projectTypeId },
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
      queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.code?.[0] || err.response?.data?.detail || 'Error al guardar');
    },
  });

  const handleSubmit = () => {
    setError(null);
    if (!code.trim() || !number.trim() || !name.trim()) {
      setError('Código, número y nombre son requeridos');
      return;
    }

    updateMutation.mutate({
      code: code.trim(),
      number: number.trim(),
      name: name.trim(),
      description: description.trim() || '',
      parent: parent || null,
      order,
      is_active: isActive,
    });
  };

  // Filtrar categorías padre válidas (excluir la actual y sus descendientes)
  const validParents = parentCategories.filter(
    (cat) => cat.id !== category?.id
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {category ? 'Editar Sección' : 'Nueva Sección'}
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
            helperText="Código único dentro del tipo de proyecto"
          />

          <TextField
            label="Número"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
            fullWidth
            helperText="Numeración según formulario MINVU (ej: '5', '6.1', '7.1')"
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

          {validParents.length > 0 && (
            <TextField
              select
              label="Sección Padre"
              value={parent || ''}
              onChange={(e) => setParent(e.target.value ? Number(e.target.value) : null)}
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Ninguna (Sección raíz)</option>
              {validParents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.number} - {cat.name}
                </option>
              ))}
            </TextField>
          )}

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
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditFormParameterCategoryModal;
