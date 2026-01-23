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
import AdminListTemplateEditor from './AdminListTemplateEditor';

interface NodeType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
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

interface ListTemplate {
  id?: number;
  architecture_project_type: number;
  architecture_project_type_name?: string;
  name: string;
  description?: string;
  code: string;
  node_type: number;
  node_type_name?: string;
  node_type_code?: string;
  parent_code?: string | null;
  order: number;
}

interface EditListTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectType: ArchitectureProjectType | null;
}

const EditListTemplateModal: React.FC<EditListTemplateModalProps> = ({
  open,
  onClose,
  onSuccess,
  projectType,
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

  // Obtener tipos de nodo disponibles
  const { data: nodeTypes = [], isLoading: loadingNodeTypes } = useQuery<NodeType[]>({
    queryKey: ['node-types'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/node-types/`, {
        withCredentials: true,
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
        },
      });
      return response.data;
    },
    enabled: open,
  });

  // Obtener todos los templates para este tipo de proyecto
  const { data: allTemplates = [], isLoading: loadingTemplates } = useQuery<ListTemplate[]>({
    queryKey: ['list-templates-all', projectType?.id],
    queryFn: async () => {
      if (!projectType) return [];
      try {
        const response = await axios.get(
          `${API_URL}/api/architecture/list-templates/all-by-project-type/${projectType.id}/`,
          {
            withCredentials: true,
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
          }
        );
        return response.data || [];
      } catch (error: any) {
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: open && !!projectType,
  });

  // Si hay templates, usar el editor admin; si no, mostrar formulario para crear el primero
  const hasTemplates = allTemplates.length > 0;

  // Cargar datos cuando se abre el modal (solo si no hay templates)
  useEffect(() => {
    if (open && projectType && !hasTemplates) {
      // Crear: valores por defecto
      setName('');
      setDescription('');
      setCode('');
      setNodeTypeId(null);
      setParentCode('');
      setOrder(0);
    }
  }, [open, projectType, hasTemplates]);

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
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
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
      architecture_project_type: projectType.id,
    };

    createMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      onClose();
    }
  };

  const handleEditorClose = () => {
    onSuccess(); // Invalidar queries y cerrar
    onClose();
  };

  const isLoading = loadingNodeTypes || loadingTemplates;
  const isSubmitting = createMutation.isPending;
  const isError = createMutation.isError;

  if (!projectType) {
    return null;
  }

  // Si hay templates, mostrar el editor admin
  if (hasTemplates) {
    return (
      <AdminListTemplateEditor
        open={open}
        onClose={handleEditorClose}
        projectType={projectType}
      />
    );
  }

  // Si no hay templates, mostrar formulario para crear el primero
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Agregar Listado</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {isLoading && (
              <Alert severity="info">Cargando información...</Alert>
            )}

            {isError && (
              <Alert severity="error">
                Error al crear el listado. Por favor, intenta nuevamente.
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary">
              Tipo de Proyecto: <strong>{projectType.name}</strong>
            </Typography>

            <TextField
              label="Nombre del Listado"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              helperText="Nombre descriptivo del listado (ej: 'Antecedentes Generales')"
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
              helperText="Descripción opcional del listado"
              disabled={isLoading}
            />

            <TextField
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
              helperText="Código único para referenciar este listado (ej: 'antecedentes_generales')"
              error={isError}
              disabled={isLoading}
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

            <TextField
              label="Código del Padre (Opcional)"
              value={parentCode}
              onChange={(e) => setParentCode(e.target.value)}
              fullWidth
              helperText="Código del listado padre si este es un sublistado (dejar vacío si es raíz)"
              disabled={isLoading}
            />

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
            {isSubmitting ? 'Creando...' : 'Crear Listado'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditListTemplateModal;
