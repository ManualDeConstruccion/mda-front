import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Stack, 
  Typography, 
  Snackbar, 
  Alert,
  FormControlLabel,
  Checkbox,
  Card,
  CardHeader,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { useProjectNodes } from '../../../../hooks/useProjectNodes';
import { useNavigate } from 'react-router-dom';
import { useCAMApi } from '../../../../hooks/FormHooks/useCAMApi';
import { AnalyzedSolution, CreateAnalyzedSolutionRequest, Layer } from '../../../../types/FormTypes/cam.types';
import { LayerModal } from './components/LayerModal';
import { LayersTable } from './components/LayersTable';
import { LayerVisualization } from './components/LayerVisualization';
import { LayerCalculations } from './components/LayerCalculations';

export default function CAMForm({ nodeId, instanceId }: { nodeId?: string, instanceId?: string }) {
  const { data: analyzedSolution, isLoading, refetch } = useCAMApi().useRetrieve(Number(instanceId));
  const [formData, setFormData] = useState<CreateAnalyzedSolutionRequest>({
    name: '',
    node: nodeId ? [Number(nodeId)] : [],
    base_solution: undefined,
    is_symmetric: true,
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layerModalOpen, setLayerModalOpen] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null);
  const [layerPosition, setLayerPosition] = useState<'anterior' | 'posterior'>('anterior');
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const { patchProject } = useProjectNodes();
  const navigate = useNavigate();
  const camApi = useCAMApi();

  // Precarga los valores cuando analyzedSolution cambia
  useEffect(() => {
    if (analyzedSolution) {
      setFormData({
        name: analyzedSolution.name || '',
        node: analyzedSolution.node || [],
        base_solution: analyzedSolution.base_solution,
        is_symmetric: analyzedSolution.is_symmetric,
        description: analyzedSolution.description || '',
      });
    }
  }, [analyzedSolution]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (closeAfter = false) => {
    setSaving(true);
    setError(null);
    try {
      if (instanceId) {
        const patchData: any = {};
        Object.keys(formData).forEach(key => {
          if (formData[key as keyof CreateAnalyzedSolutionRequest] !== analyzedSolution?.[key as keyof AnalyzedSolution]) {
            patchData[key] = formData[key as keyof CreateAnalyzedSolutionRequest];
          }
        });

        if (Object.keys(patchData).length > 0) {
          await camApi.partialUpdate.mutateAsync({
            id: Number(instanceId),
            ...patchData,
          });
        }
      } else {
        const analyzedResp = await camApi.create.mutateAsync(formData);
        await patchProject.mutateAsync({
          id: Number(nodeId),
          data: {
            object_id: analyzedResp.id,
          },
        });
      }
      setShowSuccess(true);
      if (closeAfter) {
        navigate(-1);
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLayer = async (layer: any) => {
    if (!instanceId) return;
    
    try {
      console.log('Datos de capa recibidos:', layer);
      const layerData = {
        ...layer,
        apparent_density: layer.is_insulation ? layer.apparent_density : null,
        position_type: layerPosition,
      };
      console.log('Datos de capa a enviar:', layerData);
      await camApi.addLayer.mutateAsync({
        id: Number(instanceId),
        layer: layerData,
      });
      setLayerModalOpen(false);
      // Refrescar los datos
      await refetch();
    } catch (err: any) {
      console.error('Error al agregar capa:', err);
      setError(err.message || 'Error al agregar la capa');
    }
  };

  const handleEditLayer = async (layer: Partial<Layer>) => {
    if (!instanceId || !selectedLayer?.id) return;
    
    try {
      await camApi.editLayer.mutateAsync({
        id: Number(instanceId),
        layerId: selectedLayer.id,
        layer,
      });
      setLayerModalOpen(false);
      setSelectedLayer(null);
      // Refrescar los datos
      await refetch();
    } catch (err: any) {
      setError(err.message || 'Error al editar la capa');
    }
  };

  const handleDeleteLayer = async (layerId: number) => {
    if (!instanceId) return;
    
    if (!window.confirm('¿Está seguro de eliminar esta capa?')) return;
    
    try {
      await camApi.deleteLayer.mutateAsync({
        id: Number(instanceId),
        layerId,
      });
      // Refrescar los datos
      await refetch();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la capa');
    }
  };

  const handleOpenAddLayerModal = (position: 'anterior' | 'posterior') => {
    setLayerPosition(position);
    setModalMode('add');
    setSelectedLayer(null);
    setLayerModalOpen(true);
  };

  const handleOpenEditLayerModal = (layer: Layer) => {
    setSelectedLayer(layer);
    setModalMode('edit');
    setLayerModalOpen(true);
  };

  const handleSaveBaseSolution = () => {
    camApi.proposed.solutions.createFromBase.mutate({
      ...formData,
      layers: analyzedSolution?.layers || [],
    });
  };

  if (isLoading) return <Typography>Cargando...</Typography>;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Formulario Solución de Resistencia al Fuego CAM</Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Detalles de la Solución" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de la solución"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Solución base</InputLabel>
                <Select
                  name="base_solution"
                  value={formData.base_solution || ''}
                  onChange={handleSelectChange}
                  label="Solución base"
                >
                  <MenuItem value="">
                    <em>Ninguna</em>
                  </MenuItem>
                  {/* Aquí irían las opciones de soluciones base */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="is_symmetric"
                    checked={formData.is_symmetric}
                    onChange={handleInputChange}
                  />
                }
                label="Solución simétrica"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={2}
                margin="normal"
              />
            </Grid>
          </Grid>
          {/* Botón Ver informe */}
          {instanceId && (
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigate(`/form/analyzedsolution/${instanceId}/informe`)}
            >
              Ver informe
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Visualización de capas */}
      {analyzedSolution?.layers && analyzedSolution.layers.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Representación de capas de la solución base" />
          <CardContent>
            <LayerVisualization layers={analyzedSolution.layers} />
          </CardContent>
        </Card>
      )}

      {/* Tabla de capas */}
      {analyzedSolution?.layers && analyzedSolution.layers.length > 0 ? (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Capas de la solución base" />
          <CardContent>
            <Box sx={{ mb: 2 }}>
              {analyzedSolution.calculated_time !== undefined && (
                <Typography variant="subtitle1">
                  <b>Tiempo calculado:</b> {analyzedSolution.calculated_time} min
                </Typography>
              )}
              {analyzedSolution.fire_resistance && (
                <Typography variant="subtitle1">
                  <b>Resistencia al fuego:</b> F-{analyzedSolution.fire_resistance}
                </Typography>
              )}
            </Box>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenAddLayerModal('anterior')}
              >
                Agregar Capa Anterior
              </Button>
            </Box>
            <LayersTable
              layers={analyzedSolution.layers}
              onEdit={handleOpenEditLayerModal}
              onDelete={handleDeleteLayer}
            />
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenAddLayerModal('posterior')}
              >
                Agregar Capa Posterior
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Capas de la solución" />
          <CardContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              No hay capas definidas. Agrega la primera capa para comenzar.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setModalMode('add');
                setLayerPosition('anterior');
                setLayerModalOpen(true);
              }}
            >
              Agregar Primera Capa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mostrar cálculos si hay layers */}
      {analyzedSolution?.layers && analyzedSolution.layers.length > 0 && (
        <LayerCalculations layers={analyzedSolution.layers} />
      )}

      {/* Botón de generar solución propuesta solo cuando hay capas */}
      {analyzedSolution?.layers && analyzedSolution.layers.length > 0 && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveBaseSolution}
          sx={{ mb: 2 }}
        >
          Generar solución propuesta
        </Button>
      )}
      
      <Stack direction="row" spacing={2} mt={2}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
        >
          Ir atrás
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSave(true)}
          disabled={saving}
        >
          Guardar y cerrar
        </Button>
        <Button
          variant="outlined"
          color="success"
          onClick={() => handleSave(false)}
          disabled={saving}
        >
          Guardar
        </Button>
      </Stack>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          ¡Guardado exitosamente!
        </Alert>
      </Snackbar>

      <LayerModal
        open={layerModalOpen}
        onClose={() => {
          setLayerModalOpen(false);
          setSelectedLayer(null);
        }}
        onSave={modalMode === 'add' ? handleAddLayer : handleEditLayer}
        initialData={selectedLayer}
        mode={modalMode}
        position={modalMode === 'add' ? layerPosition : undefined}
        isFirstLayer={!analyzedSolution?.layers || analyzedSolution.layers.length === 0}
      />
    </Box>
  );
} 