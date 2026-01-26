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

interface NodeType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface ListTemplate {
  id?: number;
  architecture_project_type: number;
  name: string;
  description?: string;
  code: string;
  node_type: number;
  parent_code?: string | null;
  order: number;
}

interface ArchitectureProjectType {
  id: number;
  code: string;
  name: string;
}

interface CreateEditTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectType: ArchitectureProjectType | null;
  template?: ListTemplate | null;
  availableParentCodes?: string[]; // Códigos de templates que pueden ser padres
  defaultOrder?: number; // Orden por defecto para nuevos templates
}

const CreateEditTemplateModal: React.FC<CreateEditTemplateModalProps> = ({
  open,
  onClose,
  onSuccess,
  projectType,
  template,
  availableParentCodes = [],
  defaultOrder,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [nodeTypeId, setNodeTypeId] = useState<number | null>(null);
  const [parentCode, setParentCode] = useState<string>('');
  const [order, setOrder] = useState(0);
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const isEditMode = !!template?.id;
  
  // Obtener token con fallback
  const getAuthToken = () => {
    return accessToken || localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  };

  // Obtener tipos de nodo disponibles
  const { data: nodeTypes = [], isLoading: loadingNodeTypes } = useQuery<NodeType[]>({
    queryKey: ['node-types'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/node-types/`, {
          withCredentials: true,
          headers: {
            'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
          },
      });
      return response.data;
    },
    enabled: open,
  });

  // Cargar datos cuando se abre el modal o cambia el template
  useEffect(() => {
    if (open && projectType) {
      if (template) {
        // Editar: cargar datos existentes
        setName(template.name || '');
        setDescription(template.description || '');
        setCode(template.code || '');
        setNodeTypeId(template.node_type || null);
        setParentCode(template.parent_code || '');
        setOrder(template.order || 0);
      } else {
        // Crear: valores por defecto
        setName('');
        setDescription('');
        setCode('');
        setNodeTypeId(null);
        setParentCode('');
        // Orden por defecto: usar el proporcionado o 0
        setOrder(defaultOrder !== undefined ? defaultOrder : 0);
      }
    }
  }, [open, projectType, template]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      architecture_project_type: number;
      name: string;
      description?: string;
      code: string;
      node_type: number;
      parent_code?: string | null;
      order: number;
    }) => {
      const response = await axios.post(
        `${API_URL}/api/architecture/list-templates/`,
        data,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-templates-all', projectType?.id] });
      queryClient.invalidateQueries({ queryKey: ['list-template', projectType?.id] });
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      code: string;
      node_type: number;
      parent_code?: string | null;
      order: number;
    }) => {
      if (!template?.id) return;
      const response = await axios.patch(
        `${API_URL}/api/architecture/list-templates/${template.id}/`,
        data,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-templates-all', projectType?.id] });
      queryClient.invalidateQueries({ queryKey: ['list-template', projectType?.id] });
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectType || !nodeTypeId) {
      return;
    }

    const data = {
      name,
      description: description || undefined,
      code,
      node_type: nodeTypeId,
      parent_code: parentCode || null,
      order,
    };

    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate({
        ...data,
        architecture_project_type: projectType.id,
      });
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending && !updateMutation.isPending) {
      onClose();
    }
  };

  const isLoading = loadingNodeTypes;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;

  if (!projectType) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditMode ? 'Editar Template' : 'Agregar Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {isLoading && (
              <Alert severity="info">Cargando información...</Alert>
            )}

            {isError && (
              <Alert severity="error">
                Error al {isEditMode ? 'actualizar' : 'crear'} el template. Por favor, intenta nuevamente.
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary">
              Tipo de Proyecto: <strong>{projectType.name}</strong>
            </Typography>

            <TextField
              label="Nombre del Template"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              helperText="Nombre descriptivo del template (ej: 'Antecedentes Generales')"
              error={isError}
              disabled={isLoading}
            />

            <TextField
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              helperText="Descripción opcional del template"
              disabled={isLoading}
            />

            <TextField
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
              helperText="Código único para referenciar este template (ej: 'antecedentes_generales')"
              error={isError}
              disabled={isLoading || isEditMode} // No permitir cambiar código al editar
            />

            <FormControl fullWidth required>
              <InputLabel>Tipo de Nodo</InputLabel>
              <Select
                value={nodeTypeId || ''}
                onChange={(e) => setNodeTypeId(e.target.value ? Number(e.target.value) : null)}
                label="Tipo de Nodo"
                error={!nodeTypeId}
                disabled={isLoading}
              >
                {nodeTypes
                  .filter(nt => ['list', 'document', 'form'].includes(nt.code))
                  .map((nt) => (
                    <MenuItem key={nt.id} value={nt.id}>
                      {nt.name} ({nt.code})
                    </MenuItem>
                  ))}
              </Select>
              <FormHelperText>
                Tipo de nodo que se creará automáticamente (Lista, Documento o Formulario)
              </FormHelperText>
            </FormControl>

            {availableParentCodes.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Código del Padre (Opcional)</InputLabel>
                <Select
                  value={parentCode || ''}
                  onChange={(e) => setParentCode(e.target.value || '')}
                  label="Código del Padre (Opcional)"
                  disabled={isLoading}
                >
                  <MenuItem value="">Ninguno (Raíz)</MenuItem>
                  {availableParentCodes.map((parentCodeOption) => (
                    <MenuItem key={parentCodeOption} value={parentCodeOption}>
                      {parentCodeOption}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Código del template padre si este es un subtemplate (dejar vacío si es raíz)
                </FormHelperText>
              </FormControl>
            )}

            {availableParentCodes.length === 0 && (
              <TextField
                label="Código del Padre (Opcional)"
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value)}
                fullWidth
                helperText="Código del template padre si este es un subtemplate (dejar vacío si es raíz)"
                disabled={isLoading}
              />
            )}

            <TextField
              label="Orden"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              fullWidth
              helperText="Posición al crear el nodo. Determina la numeración (1., 2., etc.)"
              disabled={isLoading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !name || !code || !nodeTypeId}
          >
            {isSubmitting
              ? (isEditMode ? 'Guardando...' : 'Creando...')
              : (isEditMode ? 'Guardar Cambios' : 'Crear Template')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateEditTemplateModal;
