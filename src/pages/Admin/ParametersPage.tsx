import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Pagination,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import CreateParameterDefinitionModal from '../../components/Admin/CreateParameterDefinitionModal';

interface ParameterDefinition {
  id: number;
  code: string;
  form_pdf_code?: string;
  name: string;
  description?: string;
  category?: number;
  category_name?: string;
  data_type: string;
  unit?: string;
  help_text?: string;
  is_active: boolean;
  is_key_compliance: boolean;
  is_calculated: boolean;
  include_in_snapshot: boolean;
  validation_rules?: any;
  calculation_formula?: string;
  calculation_inputs?: any;
  calculation_method?: string;
  snapshot_source: string;
  source_field?: string;
  update_policy: string;
  regulation_articles?: any[];
}

interface ParameterCategory {
  id: number;
  code: string;
  name: string;
}

const ParametersPage: React.FC = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [filterDataType, setFilterDataType] = useState<string>('');
  const [filterIsActive, setFilterIsActive] = useState<boolean | ''>('');
  const [filterIsKeyCompliance, setFilterIsKeyCompliance] = useState<boolean | ''>('');
  const [filterIsCalculated, setFilterIsCalculated] = useState<boolean | ''>('');
  
  // Estado de paginación
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;
  
  // Estados del modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<ParameterDefinition | null>(null);

  // Fetch parámetros
  const { data: parameters, isLoading, error } = useQuery<ParameterDefinition[]>({
    queryKey: ['parameter-definitions-all'],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.get(
        `${API_URL}/api/parameters/parameter-definitions/`,
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
    enabled: !!accessToken,
  });

  // Fetch categorías para el filtro
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
    enabled: !!accessToken,
  });

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      await axios.delete(`${API_URL}/api/parameters/parameter-definitions/${id}/`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameter-definitions-all'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-definitions-grouped'] });
    },
  });

  // Filtrar y agrupar parámetros por categoría
  const { groupedParameters, totalCount } = useMemo(() => {
    if (!parameters) return { groupedParameters: {}, totalCount: 0 };
    
    // Filtrar parámetros
    const filtered = parameters.filter(param => {
      // Búsqueda por texto
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          param.code.toLowerCase().includes(search) ||
          param.name.toLowerCase().includes(search) ||
          param.description?.toLowerCase().includes(search) ||
          param.form_pdf_code?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Filtro por categoría
      if (filterCategory !== '' && param.category !== filterCategory) return false;
      
      // Filtro por tipo de dato
      if (filterDataType && param.data_type !== filterDataType) return false;
      
      // Filtro por activo
      if (filterIsActive !== '' && param.is_active !== filterIsActive) return false;
      
      // Filtro por crítico
      if (filterIsKeyCompliance !== '' && param.is_key_compliance !== filterIsKeyCompliance) return false;
      
      // Filtro por calculado
      if (filterIsCalculated !== '' && param.is_calculated !== filterIsCalculated) return false;
      
      return true;
    });
    
    // Agrupar por categoría
    const grouped: { [key: string]: { categoryName: string; parameters: ParameterDefinition[] } } = {};
    
    filtered.forEach(param => {
      const categoryKey = param.category ? String(param.category) : 'uncategorized';
      const categoryName = param.category_name || 'Sin Categoría';
      
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = {
          categoryName,
          parameters: []
        };
      }
      
      grouped[categoryKey].parameters.push(param);
    });
    
    // Aplanar para paginación
    const allParams: ParameterDefinition[] = [];
    Object.values(grouped).forEach(group => {
      allParams.push(...group.parameters);
    });
    
    return { groupedParameters: grouped, totalCount: allParams.length };
  }, [parameters, searchTerm, filterCategory, filterDataType, filterIsActive, filterIsKeyCompliance, filterIsCalculated]);

  // Obtener parámetros paginados
  const paginatedGroups = useMemo(() => {
    const allParams: { categoryKey: string; categoryName: string; parameter: ParameterDefinition }[] = [];
    
    Object.entries(groupedParameters).forEach(([categoryKey, group]) => {
      group.parameters.forEach(param => {
        allParams.push({
          categoryKey,
          categoryName: group.categoryName,
          parameter: param
        });
      });
    });
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = allParams.slice(startIndex, endIndex);
    
    // Agrupar los paginados por categoría
    const result: { [key: string]: { categoryName: string; parameters: ParameterDefinition[] } } = {};
    
    paginated.forEach(item => {
      if (!result[item.categoryKey]) {
        result[item.categoryKey] = {
          categoryName: item.categoryName,
          parameters: []
        };
      }
      result[item.categoryKey].parameters.push(item.parameter);
    });
    
    return result;
  }, [groupedParameters, page, itemsPerPage]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll al inicio de la tabla
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreate = () => {
    setEditingParameter(null);
    setModalOpen(true);
  };

  const handleEdit = async (parameter: ParameterDefinition) => {
    // Obtener el parámetro completo con regulation_articles
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.get(
        `${API_URL}/api/parameters/parameter-definitions/${parameter.id}/`,
        {
          withCredentials: true,
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );
      setEditingParameter(response.data);
      setModalOpen(true);
    } catch (error) {
      console.error('Error al cargar el parámetro:', error);
      // Si falla, usar el parámetro que ya tenemos
      setEditingParameter(parameter);
      setModalOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este parámetro?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingParameter(null);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['parameter-definitions-all'] });
    handleModalClose();
  };

  // Resetear página cuando cambian los filtros
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, filterCategory, filterDataType, filterIsActive, filterIsKeyCompliance, filterIsCalculated]);

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            Error al cargar los parámetros. Por favor, intenta nuevamente.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Administración de Parámetros
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gestiona todas las definiciones de parámetros del sistema.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Nuevo Parámetro
          </Button>
        </Box>

        {/* Búsqueda y Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar"
                placeholder="Código, nombre, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filterCategory}
                  label="Categoría"
                  onChange={(e) => setFilterCategory(e.target.value as number | '')}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categories?.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Dato</InputLabel>
                <Select
                  value={filterDataType}
                  label="Tipo de Dato"
                  onChange={(e) => setFilterDataType(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="decimal">Decimal</MenuItem>
                  <MenuItem value="integer">Entero</MenuItem>
                  <MenuItem value="boolean">Booleano</MenuItem>
                  <MenuItem value="text">Texto</MenuItem>
                  <MenuItem value="date">Fecha</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filterIsActive}
                  label="Estado"
                  onChange={(e) => setFilterIsActive(e.target.value === '' ? '' : e.target.value === 'true')}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Activos</MenuItem>
                  <MenuItem value="false">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Crítico</InputLabel>
                <Select
                  value={filterIsKeyCompliance}
                  label="Crítico"
                  onChange={(e) => setFilterIsKeyCompliance(e.target.value === '' ? '' : e.target.value === 'true')}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Sí</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Calculado</InputLabel>
                <Select
                  value={filterIsCalculated}
                  label="Calculado"
                  onChange={(e) => setFilterIsCalculated(e.target.value === '' ? '' : e.target.value === 'true')}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Sí</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabla de parámetros agrupados por categoría */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Unidad</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Flags</strong></TableCell>
                  <TableCell align="right"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(paginatedGroups).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No se encontraron parámetros con los filtros seleccionados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(paginatedGroups).map(([categoryKey, group], groupIndex) => (
                    <React.Fragment key={categoryKey}>
                      {/* Header de categoría */}
                      <TableRow>
                        <TableCell colSpan={7} sx={{ bgcolor: 'grey.100', py: 1.5 }}>
                          <Typography variant="h6" fontWeight="bold" color="primary">
                            {group.categoryName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {group.parameters.length} parámetro{group.parameters.length !== 1 ? 's' : ''}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {/* Parámetros de esta categoría */}
                      {group.parameters.map((param, paramIndex) => (
                        <TableRow key={param.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {param.code}
                            </Typography>
                            {param.form_pdf_code && (
                              <Typography variant="caption" color="text.secondary">
                                PDF: {param.form_pdf_code}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{param.name}</Typography>
                            {param.description && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {param.description.substring(0, 50)}
                                {param.description.length > 50 ? '...' : ''}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip label={param.data_type} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            {param.unit || '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={param.is_active ? 'Activo' : 'Inactivo'}
                              color={param.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {param.is_key_compliance && (
                                <Chip label="Crítico" size="small" color="error" />
                              )}
                              {param.is_calculated && (
                                <Chip label="Calculado" size="small" color="info" />
                              )}
                              {param.include_in_snapshot && (
                                <Chip label="Snapshot" size="small" color="warning" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(param)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(param.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Separador entre categorías (excepto la última) */}
                      {groupIndex < Object.keys(paginatedGroups).length - 1 && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 1 }}><Divider /></TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Paginación */}
          {totalCount > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Stack spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Mostrando {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, totalCount)} de {totalCount} parámetros
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Modal para crear/editar */}
        <CreateParameterDefinitionModal
          open={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          parameter={editingParameter}
        />
      </Box>
    </Container>
  );
};

export default ParametersPage;
