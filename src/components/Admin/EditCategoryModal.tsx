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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
  parent?: number | null;
  order: number;
  is_active: boolean;
}

interface CategoryOption {
  id: number;
  code: string;
  name: string;
  full_path: string;
  level: number;
}

interface EditCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: Category | null;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  open,
  onClose,
  onSuccess,
  category,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  // Obtener todas las categorías disponibles (excluyendo la actual y sus descendientes)
  const { data: availableCategories = [] } = useQuery<CategoryOption[]>({
    queryKey: ['categories-flat-list', category?.id],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const excludeParam = category ? `?exclude_id=${category.id}` : '';
      const response = await axios.get(
        `${API_URL}/api/architecture/categories/flat_list${excludeParam}`,
        {
          withCredentials: true,
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );
      return response.data;
    },
    enabled: open && !!category,
  });

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (category && open) {
      setCode(category.code);
      setName(category.name);
      setDescription(category.description || '');
      setParentId(category.parent || null);
      setOrder(category.order);
      setIsActive(category.is_active);
    }
  }, [category, open]);

  const updateMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      description?: string;
      parent?: number | null;
      order: number;
      is_active: boolean;
    }) => {
      if (!category) return;
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.patch(
        `${API_URL}/api/architecture/categories/${category.id}/`,
        data,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    
    updateMutation.mutate({
      code,
      name,
      description: description || undefined,
      parent: parentId || null,
      order,
      is_active: isActive,
    });
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      onClose();
    }
  };

  if (!category) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Editar Categoría</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {updateMutation.isError && (
              <Alert severity="error">
                Error al actualizar la categoría. Por favor, intenta nuevamente.
              </Alert>
            )}

            <TextField
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
              helperText="Código único de la categoría"
              error={updateMutation.isError}
              disabled // El código no se puede cambiar
            />

            <TextField
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              helperText="Nombre descriptivo de la categoría"
              error={updateMutation.isError}
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

            <FormControl fullWidth>
              <InputLabel>Categoría Padre</InputLabel>
              <Select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                label="Categoría Padre"
              >
                <MenuItem value="">
                  <em>Ninguna (Categoría raíz)</em>
                </MenuItem>
                {availableCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {'  '.repeat(cat.level)}{cat.full_path}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Selecciona una categoría padre. Deja vacío para convertir en categoría raíz.
              </FormHelperText>
            </FormControl>

            <TextField
              label="Orden"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              fullWidth
              helperText="Orden de visualización (menor número aparece primero)"
            />

            <Box>
              <label>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                {' '}Activa
              </label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={updateMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updateMutation.isPending || !code || !name}
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditCategoryModal;
