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
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useProjectNodes } from '../../../../hooks/useProjectNodes';
import { useNavigate } from 'react-router-dom';
import { useCAMApi } from '../../../../hooks/FormHooks/useCAMApi';
import { AnalyzedSolution, CreateAnalyzedSolutionRequest, Layer } from '../../../../types/FormTypes/cam.types';
import { LayerModal } from './components/LayerModal';
import { LayersTable } from './components/LayersTable';
import { LayerVisualization } from './components/LayerVisualization';
import { LayerCalculations } from './components/LayerCalculations';
import { useQueryClient } from '@tanstack/react-query';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function CAMForm({ nodeId, instanceId }: { nodeId?: string, instanceId?: string }) {
  const { data: analyzedSolution, isLoading, refetch } = useCAMApi().useRetrieve(Number(instanceId));
  const { data: proposedSolutionData } = useCAMApi().proposed.solutions.useRetrieve(
    analyzedSolution?.proposed_solution_id || 0
  );
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
  const [proposedSolution, setProposedSolution] = useState<any>(null);
  const [showProposedSuccess, setShowProposedSuccess] = useState(false);
  const queryClient = useQueryClient();

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

  // Actualizar la solución propuesta cuando cambia proposedSolutionData
  useEffect(() => {
    if (proposedSolutionData) {
      setProposedSolution(proposedSolutionData);
    }
  }, [proposedSolutionData]);

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
    if (!instanceId && !proposedSolution) return;

    try {
      // Eliminar el campo position y asegurar tipos numéricos
      const { position, ...rest } = layer;
      const layerData = {
        ...rest,
        thickness: layer.thickness ? Number(layer.thickness) : undefined,
        apparent_density: layer.is_insulation && layer.apparent_density !== undefined && layer.apparent_density !== null ? Number(layer.apparent_density) : null,
        carbonization_rate: layer.carbonization_rate ? Number(layer.carbonization_rate) : undefined,
        joint_coefficient: layer.joint_coefficient ? Number(layer.joint_coefficient) : undefined,
        position_type: layerPosition, // anterior o posterior
      };

      if (proposedSolution) {
        await camApi.proposed.layers.create.mutateAsync({
          solution: proposedSolution.id,
          ...layerData,
          is_base_layer: false,
        });
        queryClient.invalidateQueries({ queryKey: ['proposedsolution', proposedSolution.id] });
      } else {
        await camApi.addLayer.mutateAsync({
          id: Number(instanceId),
          layer: layerData,
        });
        await refetch();
      }

      setLayerModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error al agregar la capa');
    }
  };

  const handleEditLayer = async (layer: Partial<Layer> & { is_base_layer?: boolean }) => {
    if ((!instanceId && !proposedSolution) || !selectedLayer?.id) return;

    try {
      if (proposedSolution) {
        if ((selectedLayer as any).is_base_layer) {
          setError('No se pueden editar las capas base en la solución propuesta');
          return;
        }
        await camApi.proposed.layers.update.mutateAsync({
          id: selectedLayer.id,
          ...layer,
        });
        queryClient.invalidateQueries({ queryKey: ['proposedsolution', proposedSolution.id] });
      } else {
        await camApi.editLayer.mutateAsync({
          id: Number(instanceId),
          layerId: selectedLayer.id,
          layer,
        });
        await refetch();
      }

      setLayerModalOpen(false);
      setSelectedLayer(null);
    } catch (err: any) {
      setError(err.message || 'Error al editar la capa');
    }
  };

  const handleDeleteLayer = async (layerId: number) => {
    if (!instanceId && !proposedSolution) return;

    if (!window.confirm('¿Está seguro de eliminar esta capa?')) return;

    try {
      if (proposedSolution) {
        const layer = proposedSolution.layers.find((l: any) => l.id === layerId);
        if (layer?.is_base_layer) {
          setError('No se pueden eliminar las capas base en la solución propuesta');
          return;
        }
        await camApi.proposed.layers.destroy.mutateAsync(layerId);
        queryClient.invalidateQueries({ queryKey: ['proposedsolution', proposedSolution.id] });
      } else {
        await camApi.deleteLayer.mutateAsync({
          id: Number(instanceId),
          layerId,
        });
        await refetch();
      }
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

  // Nueva función para generar solución propuesta
  const handleGenerateProposedSolution = async () => {
    if (!instanceId) return;
    
    // Verificar si ya existe una solución propuesta
    if (proposedSolution) {
      setError('Ya existe una solución propuesta para esta solución base');
      return;
    }

    try {
      const data = await camApi.generateProposedSolutionFromAnalyzed.mutateAsync(Number(instanceId));
      setProposedSolution(data);
      setShowProposedSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al generar la solución propuesta');
    }
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

      {/* Tabla de capas de la solución base */}
      {analyzedSolution?.layers && analyzedSolution.layers.length > 0 && (
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
            {!proposedSolution && (
              <>
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
                  onEdit={proposedSolution ? () => {} : handleOpenEditLayerModal}
                  onDelete={proposedSolution ? () => {} : handleDeleteLayer}
                  readOnlyBaseLayers={!!proposedSolution}
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
              </>
            )}
            {proposedSolution && (
              <LayersTable
                layers={analyzedSolution.layers}
                onEdit={() => {}}
                onDelete={() => {}}
                readOnlyBaseLayers={true}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Cálculos de la solución base en un acordeón */}
      {analyzedSolution?.layers && analyzedSolution.layers.length > 0 && (
        <Accordion sx={{ mb: 2 }} defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Cálculos de la solución base</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <LayerCalculations layers={analyzedSolution.layers} />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Botón de generar solución propuesta solo cuando hay capas y no existe una solución propuesta */}
      {analyzedSolution?.layers && analyzedSolution.layers.length > 0 && !proposedSolution && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateProposedSolution}
          sx={{ mb: 2 }}
        >
          Generar solución propuesta
        </Button>
      )}

      {/* Visualización de la solución propuesta si existe */}
      {proposedSolution && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Representación de capas de la solución propuesta" />
          <CardContent>
            <LayerVisualization layers={proposedSolution.layers} />
          </CardContent>
        </Card>
      )}

      {proposedSolution && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Capas de la solución propuesta" />
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              <b>Tiempo calculado:</b> {proposedSolution.calculated_time} min
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              <b>Resistencia al fuego:</b> F-{proposedSolution.fire_resistance}
            </Typography>
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
              layers={proposedSolution.layers}
              onEdit={handleOpenEditLayerModal}
              onDelete={handleDeleteLayer}
              readOnlyBaseLayers={true}
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
      )}

      {/* Cálculos de la solución propuesta en un acordeón */}
      {proposedSolution && (
        <Accordion sx={{ mb: 2 }} defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Cálculos de la solución propuesta</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <LayerCalculations layers={proposedSolution.layers} />
          </AccordionDetails>
        </Accordion>
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

      <Snackbar
        open={showProposedSuccess}
        autoHideDuration={3000}
        onClose={() => setShowProposedSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setShowProposedSuccess(false)} severity="success" sx={{ width: '100%' }}>
          ¡Solución propuesta generada exitosamente!
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