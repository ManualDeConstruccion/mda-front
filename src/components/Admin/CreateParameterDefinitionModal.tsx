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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import CreateParameterCategoryModal from './CreateParameterCategoryModal';

interface ParameterDefinition {
  id: number;
  code: string;
  name: string;
  data_type: string;
  unit?: string;
  category?: number;
}

interface ParameterCategory {
  id: number;
  code: string;
  name: string;
}

interface CreateParameterDefinitionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (parameter: ParameterDefinition) => void;
  parameter?: ParameterDefinition | null;
}

const CreateParameterDefinitionModal: React.FC<CreateParameterDefinitionModalProps> = ({
  open,
  onClose,
  onSuccess,
  parameter,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [formPdfCode, setFormPdfCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [dataType, setDataType] = useState('text');
  const [unit, setUnit] = useState('');
  const [helpText, setHelpText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);

  // Fetch categorías
  const { data: categories } = useQuery<ParameterCategory[]>({
    queryKey: ['parameter-categories'],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.get(
        `${API_URL}/api/parameters/parameter-categories/?is_active=true`,
        {
          withCredentials: true,
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );
      return response.data;
    },
    enabled: open && !!accessToken,
  });

  useEffect(() => {
    if (parameter) {
      setCode(parameter.code);
      setName(parameter.name);
      setCategory(parameter.category || null);
      setDataType(parameter.data_type);
      setUnit(parameter.unit || '');
    } else {
      setCode('');
      setFormPdfCode('');
      setName('');
      setDescription('');
      setCategory(null);
      setDataType('text');
      setUnit('');
      setHelpText('');
      setIsActive(true);
    }
  }, [parameter, open]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      if (parameter) {
        const response = await axios.patch(
          `${API_URL}/api/parameters/parameter-definitions/${parameter.id}/`,
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
          `${API_URL}/api/parameters/parameter-definitions/`,
          { ...data, scope: 'project' },
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parameter-definitions-grouped'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-definitions'] });
      onSuccess(data);
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
      form_pdf_code: formPdfCode.trim() || '',
      name: name.trim(),
      description: description.trim() || '',
      category: category || null,
      data_type: dataType,
      unit: unit.trim() || '',
      help_text: helpText.trim() || '',
      is_active: isActive,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {parameter ? 'Editar Parámetro' : 'Nuevo Parámetro'}
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
            disabled={!!parameter}
            helperText={parameter ? 'El código no puede cambiarse' : 'Código único del parámetro'}
          />

          <TextField
            label="Código PDF MINVU"
            value={formPdfCode}
            onChange={(e) => setFormPdfCode(e.target.value)}
            fullWidth
            helperText="Código del formulario PDF oficial de MINVU (opcional)"
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

          <FormControl fullWidth>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={category || ''}
              onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : null)}
              label="Categoría"
            >
              <MenuItem value="">Sin Categoría</MenuItem>
              {categories?.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setCreateCategoryModalOpen(true)}
            size="small"
          >
            Crear Nueva Categoría
          </Button>

          <FormControl fullWidth required>
            <InputLabel>Tipo de Dato</InputLabel>
            <Select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              label="Tipo de Dato"
            >
              <MenuItem value="decimal">Decimal</MenuItem>
              <MenuItem value="integer">Entero</MenuItem>
              <MenuItem value="boolean">Booleano</MenuItem>
              <MenuItem value="text">Texto</MenuItem>
              <MenuItem value="date">Fecha</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Unidad"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            fullWidth
            helperText="Unidad de medida (ej: 'm²', 'personas', '%')"
          />

          <TextField
            label="Texto de Ayuda"
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            }
            label="Activo"
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

      <CreateParameterCategoryModal
        open={createCategoryModalOpen}
        onClose={() => setCreateCategoryModalOpen(false)}
        onSuccess={(newCategory) => {
          setCreateCategoryModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['parameter-categories'] });
          // Si se creó una nueva categoría, seleccionarla automáticamente
          if (newCategory && newCategory.id) {
            setCategory(newCategory.id);
          }
        }}
        category={null}
      />
    </Dialog>
  );
};

export default CreateParameterDefinitionModal;
