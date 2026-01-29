import React, { useState } from 'react';
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
  Tabs,
  Tab,
  Autocomplete,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import CreateParameterDefinitionModal from './CreateParameterDefinitionModal';
import CreateParameterCategoryModal from './CreateParameterCategoryModal';

interface ParameterDefinition {
  id: number;
  code: string;
  name: string;
  data_type: string;
  unit?: string;
  category?: number;
  category_name?: string;
}

interface AddFormParameterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryId: number;
  projectTypeId: number;
  initialGridPosition?: { row: number; column: number } | null;
}

const AddFormParameterModal: React.FC<AddFormParameterModalProps> = ({
  open,
  onClose,
  onSuccess,
  categoryId,
  projectTypeId,
  initialGridPosition,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0); // 0: Seleccionar existente, 1: Crear nuevo
  const [selectedParameter, setSelectedParameter] = useState<ParameterDefinition | null>(null);
  const [isRequired, setIsRequired] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createParamModalOpen, setCreateParamModalOpen] = useState(false);
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch parámetros agrupados por categoría
  const { data: groupedParameters, isLoading } = useQuery({
    queryKey: ['parameter-definitions-grouped', searchTerm],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      const url = `${API_URL}/api/parameters/parameter-definitions/grouped_by_category/${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await axios.get(url, {
        withCredentials: true,
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
        },
      });
      return response.data;
    },
    enabled: open && tab === 0 && !!accessToken,
  });

  // Obtener parámetros ya agregados a esta categoría
  const { data: existingParameters } = useQuery({
    queryKey: ['form-parameters', categoryId],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.get(
        `${API_URL}/api/parameters/form-parameters/?category=${categoryId}`,
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

  const existingParameterIds = existingParameters?.map((p: any) => p.parameter_definition) || [];

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.post(
        `${API_URL}/api/parameters/form-parameters/`,
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
      queryClient.invalidateQueries({ queryKey: ['form-parameters', categoryId] });
      onSuccess();
      onClose();
      setSelectedParameter(null);
      setSearchTerm('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.parameter_definition?.[0] || err.response?.data?.detail || 'Error al agregar parámetro');
    },
  });

  const handleSubmit = () => {
    setError(null);
    
    if (tab === 0) {
      // Seleccionar existente
      if (!selectedParameter) {
        setError('Debes seleccionar un parámetro');
        return;
      }
      
      addMutation.mutate({
        category: categoryId,
        parameter_definition: selectedParameter.id,
        is_required: isRequired,
        is_visible: isVisible,
        ...(initialGridPosition && {
          grid_row: initialGridPosition.row,
          grid_column: initialGridPosition.column,
          grid_span: 1, // Por defecto span 1, se puede editar después
        }),
      });
    } else {
      // Crear nuevo - esto se manejará en el modal de creación
      setCreateParamModalOpen(true);
    }
  };

  const handleParameterCreated = (newParameter: ParameterDefinition) => {
    // Después de crear, agregarlo automáticamente
    addMutation.mutate({
      category: categoryId,
      parameter_definition: newParameter.id,
      is_required: isRequired,
      is_visible: isVisible,
      ...(initialGridPosition && {
        grid_row: initialGridPosition.row,
        grid_column: initialGridPosition.column,
        grid_span: 1, // Por defecto span 1, se puede editar después
      }),
    });
    setCreateParamModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['parameter-definitions-grouped'] });
  };

  // Filtrar parámetros que no están ya agregados
  const availableParameters = groupedParameters?.flatMap((group: any) => 
    group.parameters.filter((p: ParameterDefinition) => !existingParameterIds.includes(p.id))
  ) || [];

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Parámetro a la Sección</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="Seleccionar Existente" />
            <Tab label="Crear Nuevo" />
          </Tabs>

          {tab === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Buscar parámetro"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                placeholder="Buscar por nombre, código o descripción..."
              />

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {groupedParameters && groupedParameters.length > 0 ? (
                    groupedParameters.map((group: any) => {
                      const availableInGroup = group.parameters.filter(
                        (p: ParameterDefinition) => !existingParameterIds.includes(p.id)
                      );
                      
                      if (availableInGroup.length === 0) return null;

                      return (
                        <Box key={group.category?.id || 'uncategorized'} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            {group.category?.name || 'Sin Categoría'}
                          </Typography>
                          <List dense>
                            {availableInGroup.map((param: ParameterDefinition) => (
                              <ListItem
                                key={param.id}
                                button
                                selected={selectedParameter?.id === param.id}
                                onClick={() => setSelectedParameter(param)}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  mb: 0.5,
                                  '&.Mui-selected': {
                                    bgcolor: 'primary.light',
                                    borderColor: 'primary.main',
                                  },
                                }}
                              >
                                <ListItemText
                                  primary={param.name}
                                  secondary={
                                    <Box>
                                      <Typography variant="caption" display="block">
                                        Código: {param.code}
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        <Chip label={param.data_type} size="small" />
                                        {param.unit && (
                                          <Chip label={param.unit} size="small" variant="outlined" />
                                        )}
                                      </Box>
                                    </Box>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      );
                    })
                  ) : (
                    <Alert severity="info">
                      {searchTerm ? 'No se encontraron parámetros con ese criterio' : 'No hay parámetros disponibles'}
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                Crearás un nuevo parámetro global que estará disponible para todos los formularios.
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setCreateParamModalOpen(true)}
                  fullWidth
                >
                  Crear Nuevo Parámetro
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setCreateCategoryModalOpen(true)}
                  fullWidth
                >
                  Crear Nueva Categoría
                </Button>
              </Box>
            </Box>
          )}

          {(tab === 0 && selectedParameter) && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                  />
                }
                label="Requerido"
                sx={{ mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                  />
                }
                label="Visible"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={addMutation.isPending || (tab === 0 && !selectedParameter)}
          >
            {addMutation.isPending ? 'Agregando...' : tab === 0 ? 'Agregar' : 'Crear y Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      <CreateParameterDefinitionModal
        open={createParamModalOpen}
        onClose={() => setCreateParamModalOpen(false)}
        onSuccess={handleParameterCreated}
      />

      <CreateParameterCategoryModal
        open={createCategoryModalOpen}
        onClose={() => setCreateCategoryModalOpen(false)}
        onSuccess={() => {
          setCreateCategoryModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['parameter-categories'] });
        }}
      />
    </>
  );
};

export default AddFormParameterModal;
