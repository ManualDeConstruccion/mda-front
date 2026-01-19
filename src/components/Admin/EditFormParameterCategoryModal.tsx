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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface FormType {
  id: number;
  name: string;
}

interface FormParameterCategory {
  id: number;
  code: string;
  number: string;
  name: string;
  description?: string;
  parent?: number | null;
  order: number;
  is_active: boolean;
  form_type?: number | FormType | null;
  form_type_name?: string | null;
}

interface EditFormParameterCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: FormParameterCategory | null;
  projectTypeId: number;
  parentCategories?: FormParameterCategory[];
  defaultParentId?: number; // ID de la categoría padre por defecto (para crear subcategorías)
  blockFormTypeChange?: boolean; // Bloquear cambio de form_type si ya tiene uno
}

const EditFormParameterCategoryModal: React.FC<EditFormParameterCategoryModalProps> = ({
  open,
  onClose,
  onSuccess,
  category,
  projectTypeId,
  parentCategories = [],
  defaultParentId,
  blockFormTypeChange = false,
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
  const [formType, setFormType] = useState<number | null>(null);
  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Obtener tipos de formulario
  useEffect(() => {
    const fetchFormTypes = async () => {
      try {
        const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
        const response = await axios.get(
          `${API_URL}/api/parameters/form-types/`,
          {
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
            withCredentials: true,
          }
        );
        setFormTypes(response.data);
      } catch (error) {
        console.error('Error al obtener tipos de formulario:', error);
      }
    };
    if (open) {
      fetchFormTypes();
    }
  }, [open, accessToken]);

  useEffect(() => {
    if (category) {
      setCode(category.code);
      setNumber(category.number);
      setName(category.name);
      setDescription(category.description || '');
      setParent(category.parent || null);
      setOrder(category.order);
      setIsActive(category.is_active);
      // Establecer form_type
      if (category.form_type) {
        const formTypeId = typeof category.form_type === 'object' ? category.form_type.id : category.form_type;
        setFormType(formTypeId);
      } else {
        setFormType(null);
      }
    } else {
      // Reset para crear nuevo
      setCode('');
      setNumber('');
      setName('');
      setDescription('');
      setParent(defaultParentId || null); // Usar defaultParentId si está disponible
      setOrder(0);
      setIsActive(true);
      setFormType(null);
    }
  }, [category, open, defaultParentId]);

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

    const mutationData: any = {
      code: code.trim(),
      number: number.trim(),
      name: name.trim(),
      description: description.trim() || '',
      parent: parent || null,
      order,
      is_active: isActive,
    };
    
    // Solo incluir form_type si no está bloqueado o si es una nueva categoría
    if (!blockFormTypeChange || !category) {
      if (formType) {
        mutationData.form_type = formType;
      }
    }

    updateMutation.mutate(mutationData);
  };

  // Filtrar categorías padre válidas (excluir la actual y sus descendientes)
  const validParents = parentCategories.filter(
    (cat) => cat.id !== category?.id
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {category ? 'Editar Sección' : (defaultParentId ? 'Nueva Subsección' : 'Nueva Sección')}
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

          {/* Selector de tipo de formulario (solo si no está bloqueado o es nueva categoría) */}
          {(!blockFormTypeChange || !category) && (
            <FormControl fullWidth>
              <InputLabel>Tipo de Formulario</InputLabel>
              <Select
                value={formType || ''}
                label="Tipo de Formulario"
                onChange={(e) => setFormType(e.target.value ? Number(e.target.value) : null)}
                disabled={blockFormTypeChange && !!category}
              >
                <MenuItem value="">
                  <em>Ninguno (usar grilla por defecto)</em>
                </MenuItem>
                {formTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
              {blockFormTypeChange && category && (
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    El tipo no puede cambiarse una vez establecido
                  </Typography>
                </Box>
              )}
            </FormControl>
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
