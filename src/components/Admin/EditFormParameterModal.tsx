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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import CreateParameterCategoryModal from './CreateParameterCategoryModal';

interface FormParameter {
  id: number;
  category: number;
  parameter_definition: number | {
    id: number;
    code: string;
    name: string;
    data_type: string;
    unit?: string;
  };
  order: number;
  is_required: boolean;
  is_visible: boolean;
  grid_row?: number;
  grid_column?: number;
  grid_span?: number;
  parameter_definition_name?: string;
  parameter_definition_code?: string;
}

interface ParameterDefinition {
  id: number;
  code: string;
  form_pdf_code?: string;
  name: string;
  description?: string;
  category?: number | null;
  category_name?: string;
  category_code?: string;
  data_type: string;
  unit?: string;
  scope: string;
  help_text?: string;
  validation_rules?: any;
  is_key_compliance: boolean;
  is_calculated: boolean;
  include_in_snapshot: boolean;
  is_active: boolean;
  display_order: number;
  calculation_formula?: string;
  calculation_inputs?: string[];
  calculation_method?: string;
  snapshot_source: string;
  source_field?: string;
  update_policy: string;
}

interface ParameterCategory {
  id: number;
  code: string;
  name: string;
}

interface EditFormParameterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parameter: FormParameter | null;
  projectTypeId: number;
}

const EditFormParameterModal: React.FC<EditFormParameterModalProps> = ({
  open,
  onClose,
  onSuccess,
  parameter,
  projectTypeId,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0); // 0: FormParameter, 1: ParameterDefinition
  const [order, setOrder] = useState(0);
  const [isRequired, setIsRequired] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [gridRow, setGridRow] = useState(1);
  const [gridColumn, setGridColumn] = useState(1);
  const [gridSpan, setGridSpan] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);

  // Estados para ParameterDefinition
  const [paramDef, setParamDef] = useState<ParameterDefinition | null>(null);
  const [formPdfCode, setFormPdfCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [dataType, setDataType] = useState('text');
  const [unit, setUnit] = useState('');
  const [helpText, setHelpText] = useState('');
  const [isKeyCompliance, setIsKeyCompliance] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [includeInSnapshot, setIncludeInSnapshot] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [calculationFormula, setCalculationFormula] = useState('');
  const [calculationInputs, setCalculationInputs] = useState('');
  const [calculationMethod, setCalculationMethod] = useState('');
  const [snapshotSource, setSnapshotSource] = useState('none');
  const [sourceField, setSourceField] = useState('');
  const [updatePolicy, setUpdatePolicy] = useState('manual');
  const [validationRules, setValidationRules] = useState('{}');

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

  // Obtener el ID del parameter_definition (puede ser número o objeto)
  const getParameterDefinitionId = (): number | null => {
    if (!parameter) return null;
    if (typeof parameter.parameter_definition === 'number') {
      return parameter.parameter_definition;
    }
    if (typeof parameter.parameter_definition === 'object' && parameter.parameter_definition?.id) {
      return parameter.parameter_definition.id;
    }
    return null;
  };

  const parameterDefinitionId = getParameterDefinitionId();

  // Fetch ParameterDefinition completo
  const { data: parameterDefinition } = useQuery<ParameterDefinition>({
    queryKey: ['parameter-definition', parameterDefinitionId],
    queryFn: async () => {
      if (!parameterDefinitionId) return null;
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.get(
        `${API_URL}/api/parameters/parameter-definitions/${parameterDefinitionId}/`,
        {
          withCredentials: true,
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );
      return response.data;
    },
    enabled: open && !!parameterDefinitionId && !!accessToken,
  });

  // Obtener nombre y código del parámetro (puede venir del objeto o de campos directos)
  const getParameterName = (): string => {
    if (parameter?.parameter_definition_name) {
      return parameter.parameter_definition_name;
    }
    if (typeof parameter?.parameter_definition === 'object' && parameter.parameter_definition?.name) {
      return parameter.parameter_definition.name;
    }
    return 'Parámetro';
  };

  const getParameterCode = (): string => {
    if (parameter?.parameter_definition_code) {
      return parameter.parameter_definition_code;
    }
    if (typeof parameter?.parameter_definition === 'object' && parameter.parameter_definition?.code) {
      return parameter.parameter_definition.code;
    }
    return '';
  };

  useEffect(() => {
    if (parameter) {
      setOrder(parameter.order);
      setIsRequired(parameter.is_required);
      setIsVisible(parameter.is_visible);
      setGridRow(parameter.grid_row || 1);
      setGridColumn(parameter.grid_column || 1);
      setGridSpan(parameter.grid_span || 1);
    }
  }, [parameter, open]);

  useEffect(() => {
    if (parameterDefinition) {
      setParamDef(parameterDefinition);
      setFormPdfCode(parameterDefinition.form_pdf_code || '');
      setName(parameterDefinition.name);
      setDescription(parameterDefinition.description || '');
      setCategory(parameterDefinition.category || null);
      setDataType(parameterDefinition.data_type);
      setUnit(parameterDefinition.unit || '');
      setHelpText(parameterDefinition.help_text || '');
      setIsKeyCompliance(parameterDefinition.is_key_compliance);
      setIsCalculated(parameterDefinition.is_calculated);
      setIncludeInSnapshot(parameterDefinition.include_in_snapshot);
      setIsActive(parameterDefinition.is_active);
      setDisplayOrder(parameterDefinition.display_order);
      setCalculationFormula(parameterDefinition.calculation_formula || '');
      setCalculationInputs(JSON.stringify(parameterDefinition.calculation_inputs || []));
      setCalculationMethod(parameterDefinition.calculation_method || '');
      setSnapshotSource(parameterDefinition.snapshot_source);
      setSourceField(parameterDefinition.source_field || '');
      setUpdatePolicy(parameterDefinition.update_policy);
      setValidationRules(JSON.stringify(parameterDefinition.validation_rules || {}, null, 2));
    }
  }, [parameterDefinition, open]);

  const updateFormParameterMutation = useMutation({
    mutationFn: async (data: any) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.patch(
        `${API_URL}/api/parameters/form-parameters/${parameter?.id}/`,
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
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Error al actualizar FormParameter');
    },
  });

  const updateParameterDefinitionMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!parameterDefinitionId) {
        throw new Error('ID de ParameterDefinition no disponible');
      }
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.patch(
        `${API_URL}/api/parameters/parameter-definitions/${parameterDefinitionId}/`,
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
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Error al actualizar ParameterDefinition');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      await axios.delete(
        `${API_URL}/api/parameters/form-parameters/${parameter?.id}/`,
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Error al eliminar');
    },
  });

  const handleSubmit = async () => {
    setError(null);
    
    try {
      // Actualizar FormParameter
      await updateFormParameterMutation.mutateAsync({
        order,
        is_required: isRequired,
        is_visible: isVisible,
        grid_row: gridRow,
        grid_column: gridColumn,
        grid_span: gridSpan,
      });

      // Actualizar ParameterDefinition
      let parsedCalculationInputs: string[] = [];
      try {
        parsedCalculationInputs = JSON.parse(calculationInputs || '[]');
      } catch (e) {
        setError('calculation_inputs debe ser un JSON válido (array)');
        return;
      }

      let parsedValidationRules: any = {};
      try {
        parsedValidationRules = JSON.parse(validationRules || '{}');
      } catch (e) {
        setError('validation_rules debe ser un JSON válido (objeto)');
        return;
      }

      if (parameterDefinitionId) {
        await updateParameterDefinitionMutation.mutateAsync({
          form_pdf_code: formPdfCode.trim() || '',
          name: name.trim(),
          description: description.trim() || '',
          category: category || null,
          data_type: dataType,
          unit: unit.trim() || '',
          help_text: helpText.trim() || '',
          is_key_compliance: isKeyCompliance,
          is_calculated: isCalculated,
          include_in_snapshot: includeInSnapshot,
          is_active: isActive,
          display_order: displayOrder,
          calculation_formula: calculationFormula.trim() || '',
          calculation_inputs: parsedCalculationInputs,
          calculation_method: calculationMethod.trim() || '',
          snapshot_source: snapshotSource,
          source_field: sourceField.trim() || '',
          update_policy: updatePolicy,
          validation_rules: parsedValidationRules,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
      queryClient.invalidateQueries({ queryKey: ['parameter-definition', parameterDefinitionId] });
      queryClient.invalidateQueries({ queryKey: ['parameter-definitions-grouped'] });
      onSuccess();
      onClose();
    } catch (err: any) {
      // El error ya se maneja en las mutaciones
    }
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar este parámetro de la sección?')) {
      deleteMutation.mutate();
    }
  };

  if (!parameter) return null;

  const isLoading = updateFormParameterMutation.isPending || updateParameterDefinitionMutation.isPending;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Editar Parámetro: {parameter ? getParameterName() : ''}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="Configuración en Formulario" />
            <Tab label="Definición del Parámetro" />
          </Tabs>

          {tab === 0 ? (
            // Pestaña 1: FormParameter
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Alert severity="info" sx={{ mb: 1 }}>
                Parámetro: <strong>{getParameterName()}</strong> ({getParameterCode()})
              </Alert>

              <TextField
                label="Fila"
                type="number"
                value={gridRow}
                onChange={(e) => setGridRow(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 1 }}
                required
              />

              <TextField
                label="Columna"
                type="number"
                value={gridColumn}
                onChange={(e) => setGridColumn(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 1, max: 8 }}
                required
              />

              <TextField
                label="Ancho (columnas)"
                type="number"
                value={gridSpan}
                onChange={(e) => setGridSpan(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 1, max: 8 }}
                required
              />

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
          ) : (
            // Pestaña 2: ParameterDefinition
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, maxHeight: '60vh', overflow: 'auto' }}>
              <TextField
                label="Código"
                value={paramDef?.code || ''}
                fullWidth
                disabled
                helperText="Código único del parámetro (no editable)"
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
                size="small"
                onClick={() => setCreateCategoryModalOpen(true)}
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

              <TextField
                label="Orden de Visualización"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 0 }}
              />

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" fontWeight="bold">
                Flags Importantes
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={isKeyCompliance}
                    onChange={(e) => setIsKeyCompliance(e.target.checked)}
                  />
                }
                label="Parámetro Crítico (DOM)"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={isCalculated}
                    onChange={(e) => setIsCalculated(e.target.checked)}
                  />
                }
                label="Es Calculado"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={includeInSnapshot}
                    onChange={(e) => setIncludeInSnapshot(e.target.checked)}
                  />
                }
                label="Incluir en Snapshot"
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

              {isCalculated && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Configuración de Cálculo
                  </Typography>

                  <TextField
                    label="Fórmula de Cálculo"
                    value={calculationFormula}
                    onChange={(e) => setCalculationFormula(e.target.value)}
                    multiline
                    rows={2}
                    fullWidth
                    helperText="Fórmula para calcular este parámetro (ej: 'superficie / factor_ocupacion')"
                  />

                  <TextField
                    label="Parámetros de Entrada (JSON)"
                    value={calculationInputs}
                    onChange={(e) => setCalculationInputs(e.target.value)}
                    multiline
                    rows={2}
                    fullWidth
                    helperText='Array JSON de códigos de parámetros: ["superficie_construida", "factor_ocupacion"]'
                  />

                  <TextField
                    label="Método de Cálculo"
                    value={calculationMethod}
                    onChange={(e) => setCalculationMethod(e.target.value)}
                    fullWidth
                    helperText="Nombre del método Python que ejecuta el cálculo (opcional)"
                  />
                </>
              )}

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" fontWeight="bold">
                Configuración de Snapshot
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Tipo de Snapshot</InputLabel>
                <Select
                  value={snapshotSource}
                  onChange={(e) => setSnapshotSource(e.target.value)}
                  label="Tipo de Snapshot"
                >
                  <MenuItem value="none">Sin snapshot</MenuItem>
                  <MenuItem value="property">Snapshot desde Property</MenuItem>
                  <MenuItem value="user">Snapshot desde User</MenuItem>
                  <MenuItem value="manual">Snapshot manual</MenuItem>
                </Select>
              </FormControl>

              {snapshotSource !== 'none' && (
                <TextField
                  label="Campo Fuente"
                  value={sourceField}
                  onChange={(e) => setSourceField(e.target.value)}
                  fullWidth
                  helperText="Campo del modelo fuente (ej: 'rol_number', 'sector', 'address')"
                />
              )}

              <FormControl fullWidth>
                <InputLabel>Política de Actualización</InputLabel>
                <Select
                  value={updatePolicy}
                  onChange={(e) => setUpdatePolicy(e.target.value)}
                  label="Política de Actualización"
                >
                  <MenuItem value="manual">Actualización Manual</MenuItem>
                  <MenuItem value="auto">Actualización Automática</MenuItem>
                  <MenuItem value="prompt">Preguntar al Usuario</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" fontWeight="bold">
                Reglas de Validación
              </Typography>

              <TextField
                label="Reglas de Validación (JSON)"
                value={validationRules}
                onChange={(e) => setValidationRules(e.target.value)}
                multiline
                rows={4}
                fullWidth
                helperText='JSON con reglas: {"min": 0, "max": 100, "min_length": 5, "max_length": 50, "pattern": "^[A-Z]+$"}'
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={deleteMutation.isPending || isLoading}
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar de Sección'}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <CreateParameterCategoryModal
        open={createCategoryModalOpen}
        onClose={() => setCreateCategoryModalOpen(false)}
        onSuccess={(newCategory) => {
          setCreateCategoryModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['parameter-categories'] });
          if (newCategory && newCategory.id) {
            setCategory(newCategory.id);
          }
        }}
        category={null}
      />
    </>
  );
};

export default EditFormParameterModal;
