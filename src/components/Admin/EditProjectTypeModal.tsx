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

interface CategoryOption {
  id: number;
  code: string;
  name: string;
  full_path: string;
  level: number;
}

interface ArchitectureProjectType {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: number;
  order: number;
  is_active: boolean;
}

interface EditProjectTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectType: ArchitectureProjectType | null;
}

const EditProjectTypeModal: React.FC<EditProjectTypeModalProps> = ({
  open,
  onClose,
  onSuccess,
  projectType,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  // Obtener todas las categorías disponibles
  const { data: availableCategories = [] } = useQuery<CategoryOption[]>({
    queryKey: ['categories-flat-list'],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.get(
        `${API_URL}/api/architecture/categories/flat_list/`,
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

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (projectType && open) {
      setCode(projectType.code);
      setName(projectType.name);
      setDescription(projectType.description || '');
      setCategoryId(projectType.category);
      setOrder(projectType.order);
      setIsActive(projectType.is_active);
    }
  }, [projectType, open]);

  const updateMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      description?: string;
      category: number;
      order: number;
      is_active: boolean;
    }) => {
      if (!projectType) return;
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.patch(
        `${API_URL}/api/architecture/architecture-project-types/${projectType.id}/`,
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
    if (!projectType) return;
    
    if (!categoryId) {
      alert('Debes seleccionar una categoría');
      return;
    }
    
    updateMutation.mutate({
      code,
      name,
      description: description || undefined,
      category: categoryId,
      order,
      is_active: isActive,
    });
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      onClose();
    }
  };

  if (!projectType) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Editar Tipo de Proyecto</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {updateMutation.isError && (
              <Alert severity="error">
                Error al actualizar el tipo de proyecto. Por favor, intenta nuevamente.
              </Alert>
            )}

            <TextField
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
              helperText="Código único del tipo de proyecto"
              error={updateMutation.isError}
              disabled // El código no se puede cambiar
            />

            <TextField
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              helperText="Nombre descriptivo del tipo de proyecto"
              error={updateMutation.isError}
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

            <FormControl fullWidth required>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                label="Categoría"
                error={!categoryId}
              >
                {availableCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {'  '.repeat(cat.level)}{cat.full_path}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Selecciona la categoría a la que pertenece este tipo de proyecto.
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
                {' '}Activo
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
            disabled={updateMutation.isPending || !code || !name || !categoryId}
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProjectTypeModal;
