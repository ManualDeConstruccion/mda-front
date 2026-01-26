import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Alert,
  Chip,
  Autocomplete,
  Paper,
  IconButton,
  Collapse,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface RegulationArticle {
  id: number;
  code: string;
  article_number: string;
  title?: string;
}

interface ProjectTypeList {
  id?: number;
  architecture_project_type: number;
  architecture_project_type_name?: string;
  name: string;
  description?: string;
  regulation_articles?: RegulationArticle[];
}

interface ArchitectureProjectType {
  id: number;
  code: string;
  name: string;
}

interface EditProjectTypeListProps {
  projectType: ArchitectureProjectType | null;
}

const EditProjectTypeList: React.FC<EditProjectTypeListProps> = ({ projectType }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedArticles, setSelectedArticles] = useState<RegulationArticle[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  
  // Obtener token con fallback
  const getAuthToken = () => {
    return accessToken || localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  };

  // Obtener el ProjectTypeList existente
  const { data: projectTypeList, isLoading: loadingList } = useQuery<ProjectTypeList | null>({
    queryKey: ['project-type-list', projectType?.id],
    queryFn: async () => {
      if (!projectType) return null;
      try {
        const response = await axios.get(
          `${API_URL}/api/architecture/project-type-lists/by-project-type/${projectType.id}/`,
          {
            withCredentials: true,
            headers: {
              'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
            },
          }
        );
        return response.data || null;
      } catch (error: any) {
        if (error.response?.status === 404 || (error.response?.status === 200 && !error.response.data)) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!projectType,
  });

  // Obtener todos los artículos normativos disponibles
  const { data: allArticles = [], isLoading: loadingArticles } = useQuery<RegulationArticle[]>({
    queryKey: ['regulation-articles'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/parameters/regulation-articles/`,
        {
          withCredentials: true,
          headers: {
            'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
          },
        }
      );
      return response.data?.results || response.data || [];
    },
    enabled: isEditing || isExpanded,
  });

  // Cargar datos cuando cambia el listado
  useEffect(() => {
    if (projectTypeList) {
      setName(projectTypeList.name || '');
      setDescription(projectTypeList.description || '');
      setSelectedArticles(projectTypeList.regulation_articles || []);
      setIsExpanded(true);
    } else {
      setName('');
      setDescription('');
      setSelectedArticles([]);
    }
    setIsEditing(false);
  }, [projectTypeList]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      architecture_project_type: number;
      name: string;
      description?: string;
      regulation_articles: number[];
    }) => {
      const response = await axios.post(
        `${API_URL}/api/architecture/project-type-lists/`,
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
      queryClient.invalidateQueries({ queryKey: ['project-type-list', projectType?.id] });
      setIsEditing(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      regulation_articles: number[];
    }) => {
      if (!projectTypeList?.id) return;
      const response = await axios.patch(
        `${API_URL}/api/architecture/project-type-lists/${projectTypeList.id}/`,
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
      queryClient.invalidateQueries({ queryKey: ['project-type-list', projectType?.id] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    if (!projectType || !name.trim()) {
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      regulation_articles: selectedArticles.map(art => art.id),
    };

    if (projectTypeList?.id) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate({
        ...data,
        architecture_project_type: projectType.id,
      });
    }
  };

  const handleCancel = () => {
    if (projectTypeList) {
      setName(projectTypeList.name || '');
      setDescription(projectTypeList.description || '');
      setSelectedArticles(projectTypeList.regulation_articles || []);
    } else {
      setName('');
      setDescription('');
      setSelectedArticles([]);
    }
    setIsEditing(false);
  };

  const isLoading = loadingList || loadingArticles;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;
  const hasList = !!projectTypeList;

  if (!projectType) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Información del Listado
          {!hasList && (
            <Chip label="No configurado" size="small" color="warning" variant="outlined" />
          )}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isEditing && (
            <IconButton
              size="small"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {isError && (
            <Alert severity="error">
              Error al {hasList ? 'actualizar' : 'crear'} el listado. Por favor, intenta nuevamente.
            </Alert>
          )}

          {isEditing ? (
            <>
              <TextField
                label="Nombre del Listado"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                size="small"
                helperText="Nombre descriptivo del listado"
                error={isError}
                disabled={isSubmitting}
              />

              <TextField
                label="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
                size="small"
                helperText="Descripción detallada del listado y su propósito"
                disabled={isSubmitting}
              />

              <Autocomplete
                multiple
                options={allArticles}
                getOptionLabel={(option) => `${option.code} - ${option.article_number}${option.title ? `: ${option.title}` : ''}`}
                value={selectedArticles}
                onChange={(_, newValue) => setSelectedArticles(newValue)}
                disabled={isSubmitting || isLoading}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Artículos Normativos"
                    helperText="Selecciona los artículos de normativa que regulan este listado"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={`${option.code} - ${option.article_number}`}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
              />

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  size="small"
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={isSubmitting || !name.trim()}
                  size="small"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              {hasList ? (
                <>
                  <Typography variant="body2">
                    <strong>Nombre:</strong> {projectTypeList.name}
                  </Typography>
                  {projectTypeList.description && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Descripción:</strong> {projectTypeList.description}
                    </Typography>
                  )}
                  {projectTypeList.regulation_articles && projectTypeList.regulation_articles.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Artículos Normativos:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {projectTypeList.regulation_articles.map((article) => (
                          <Chip
                            key={article.id}
                            label={`${article.code} - ${article.article_number}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  No hay información del listado configurada. Haz clic en editar para configurarla.
                </Alert>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default EditProjectTypeList;
