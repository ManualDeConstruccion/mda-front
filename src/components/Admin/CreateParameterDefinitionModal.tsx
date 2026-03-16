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
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Typography,
  Divider,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSnapshotSourceFields } from '../../hooks/useSnapshotSourceFields';
import CreateParameterCategoryModal from './CreateParameterCategoryModal';

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
  is_active?: boolean;
  is_key_compliance?: boolean;
  is_calculated?: boolean;
  include_in_snapshot?: boolean;
  validation_rules?: any;
  calculation_formula?: string;
  calculation_inputs?: any;
  calculation_method?: string;
  snapshot_source?: string;
  source_field?: string;
  update_policy?: string;
  regulation_articles?: any[];
  options_source?: string | null;
  options_filter_by?: string[];
  form_rules?: any[];
  show_in_agenda?: boolean;
  agenda_message?: string;
  agenda_message_when_false?: string;
  agenda_display_type?: string;
  agenda_snackbar_undo?: boolean;
  agenda_banner_cancel?: boolean;
  agenda_banner_accept_changes?: boolean;
  agenda_banner_accept_without_changes?: boolean;
  agenda_modal_cancel?: boolean;
  agenda_modal_accept_changes?: boolean;
  agenda_modal_accept_without_changes?: boolean;
}

interface ParameterCategory {
  id: number;
  code: string;
  name: string;
}

export interface OptionSourceItem {
  id: number;
  code: string;
  name: string;
  endpoint_path: string;
  filter_query_param: string;
  help_filter_by: string;
  help_form_rules: string;
  is_active: boolean;
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
  const [isKeyCompliance, setIsKeyCompliance] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [includeInSnapshot, setIncludeInSnapshot] = useState(false);
  const [validationRules, setValidationRules] = useState('');
  const [calculationFormula, setCalculationFormula] = useState('');
  const [calculationInputs, setCalculationInputs] = useState('');
  const [calculationMethod, setCalculationMethod] = useState('');
  const [snapshotSource, setSnapshotSource] = useState('none');
  const [sourceField, setSourceField] = useState('');
  const [updatePolicy, setUpdatePolicy] = useState('manual');
  const [selectedRegulationArticles, setSelectedRegulationArticles] = useState<number[]>([]);
  const [optionsSource, setOptionsSource] = useState('');
  const [optionsFilterBy, setOptionsFilterBy] = useState('[]');
  const [formRules, setFormRules] = useState('[]');
  const [showInAgenda, setShowInAgenda] = useState(false);
  const [agendaMessage, setAgendaMessage] = useState('');
  const [agendaMessageWhenFalse, setAgendaMessageWhenFalse] = useState('');
  const [agendaDisplayType, setAgendaDisplayType] = useState('toast');
  const [agendaSnackbarUndo, setAgendaSnackbarUndo] = useState(false);
  const [agendaBannerCancel, setAgendaBannerCancel] = useState(false);
  const [agendaBannerAcceptChanges, setAgendaBannerAcceptChanges] = useState(false);
  const [agendaBannerAcceptWithoutChanges, setAgendaBannerAcceptWithoutChanges] = useState(false);
  const [agendaModalCancel, setAgendaModalCancel] = useState(false);
  const [agendaModalAcceptChanges, setAgendaModalAcceptChanges] = useState(false);
  const [agendaModalAcceptWithoutChanges, setAgendaModalAcceptWithoutChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const { fields: snapshotSourceFields, isLoading: snapshotFieldsLoading } = useSnapshotSourceFields(
    snapshotSource as 'property' | 'user' | 'none' | 'manual'
  );

  // Funciones auxiliares para validar JSON
  const isValidJSON = (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const isValidJSONArray = (str: string): boolean => {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  };

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

  // Fetch artículos normativos
  // Option sources (listados: comuna, región, etc.) para Select y ayudas contextuales
  const { data: optionSources } = useQuery<OptionSourceItem[]>({
    queryKey: ['option-sources'],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.get(
        `${API_URL}/api/parameters/option-sources/`,
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
    staleTime: 24 * 60 * 60 * 1000,
  });

  const selectedOptionSource = optionsSource
    ? (optionSources ?? []).find((s) => s.code === optionsSource)
    : null;

  const { data: regulationArticles, isLoading: isLoadingArticles, error: articlesError } = useQuery<any[]>({
    queryKey: ['regulation-articles'],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      try {
        const response = await axios.get(
          `${API_URL}/api/parameters/regulation-articles/?is_active=true`,
          {
            withCredentials: true,
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
          }
        );
        return response.data;
      } catch (error: any) {
        console.error('Error fetching regulation articles:', error);
        // Si el endpoint no existe o falla, retornar array vacío
        return [];
      }
    },
    enabled: open && !!accessToken,
    retry: false,
  });

  // Limpiar error cuando los campos se corrigen y son válidos
  useEffect(() => {
    // Solo validar si hay un error activo
    if (!error) return;
    
    // Validar que todos los campos sean válidos
    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    
    // Validar código: debe comenzar con letra y solo contener letras minúsculas, números y guiones bajos
    const isCodeValid = trimmedCode && /^[a-z][a-z0-9_]*$/.test(trimmedCode);
    
    // Validar nombre: no debe estar vacío
    const isNameValid = trimmedName.length > 0;
    
    // Validar JSON fields
    const isValidationRulesValid = !validationRules.trim() || isValidJSON(validationRules.trim());
    const isCalculationInputsValid = !calculationInputs.trim() || isValidJSONArray(calculationInputs.trim());
    
    // Si todos los campos son válidos, limpiar el error
    if (isCodeValid && isNameValid && isValidationRulesValid && isCalculationInputsValid) {
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, name, validationRules, calculationInputs]);

  useEffect(() => {
    if (!open) {
      // Resetear cuando se cierra el modal
      return;
    }
    
    if (parameter) {
      const param = parameter as ParameterDefinition & Record<string, unknown>;
      setCode((param.code as string) || '');
      setFormPdfCode((param.form_pdf_code as string | undefined) || '');
      setName((param.name as string) || '');
      setDescription((param.description as string | undefined) || '');
      setCategory((param.category as number | undefined) ?? null);
      setDataType((param.data_type as string) || 'text');
      setUnit((param.unit as string | undefined) || '');
      setHelpText((param.help_text as string | undefined) || '');
      setIsActive(param.is_active !== undefined ? (param.is_active as boolean) : true);
      setIsKeyCompliance((param.is_key_compliance as boolean | undefined) || false);
      setIsCalculated((param.is_calculated as boolean | undefined) || false);
      setIncludeInSnapshot((param.include_in_snapshot as boolean | undefined) || false);
      setValidationRules(param.validation_rules ? JSON.stringify(param.validation_rules, null, 2) : '');
      setCalculationFormula((param.calculation_formula as string | undefined) || '');
      setCalculationInputs(param.calculation_inputs ? JSON.stringify(param.calculation_inputs, null, 2) : '');
      setCalculationMethod((param.calculation_method as string | undefined) || '');
      setSnapshotSource((param.snapshot_source as string | undefined) || 'none');
      setSourceField((param.source_field as string | undefined) || '');
      setUpdatePolicy((param.update_policy as string | undefined) || 'manual');
      setOptionsSource((param.options_source as string | undefined) || '');
      setOptionsFilterBy(
        param.options_filter_by != null
          ? JSON.stringify(param.options_filter_by, null, 2)
          : '[]'
      );
      setFormRules(
        param.form_rules != null ? JSON.stringify(param.form_rules, null, 2) : '[]'
      );
      setShowInAgenda((param.show_in_agenda as boolean | undefined) ?? false);
      setAgendaMessage((param.agenda_message as string | undefined) ?? '');
      setAgendaMessageWhenFalse((param.agenda_message_when_false as string | undefined) ?? '');
      setAgendaDisplayType((param.agenda_display_type as string | undefined) ?? 'toast');
      setAgendaSnackbarUndo((param.agenda_snackbar_undo as boolean | undefined) ?? false);
      setAgendaBannerCancel((param.agenda_banner_cancel as boolean | undefined) ?? false);
      setAgendaBannerAcceptChanges((param.agenda_banner_accept_changes as boolean | undefined) ?? false);
      setAgendaBannerAcceptWithoutChanges((param.agenda_banner_accept_without_changes as boolean | undefined) ?? false);
      setAgendaModalCancel((param.agenda_modal_cancel as boolean | undefined) ?? false);
      setAgendaModalAcceptChanges((param.agenda_modal_accept_changes as boolean | undefined) ?? false);
      setAgendaModalAcceptWithoutChanges((param.agenda_modal_accept_without_changes as boolean | undefined) ?? false);
      // regulation_articles viene como array de IDs o objetos con id
      const regArticles = param.regulation_articles as unknown[] | undefined;
      if (regArticles && Array.isArray(regArticles)) {
        const articleIds = regArticles.map((art: unknown) => (typeof art === 'number' ? art : (art as { id: number }).id));
        setSelectedRegulationArticles(articleIds);
      } else {
        setSelectedRegulationArticles([]);
      }
    } else {
      // Resetear todo cuando se crea un nuevo parámetro
      setCode('');
      setFormPdfCode('');
      setName('');
      setDescription('');
      setCategory(null);
      setDataType('text');
      setUnit('');
      setHelpText('');
      setIsActive(true);
      setIsKeyCompliance(false);
      setIsCalculated(false);
      setIncludeInSnapshot(false);
      setValidationRules('');
      setCalculationFormula('');
      setCalculationInputs('');
      setCalculationMethod('');
      setSnapshotSource('none');
      setSourceField('');
      setUpdatePolicy('manual');
      setOptionsSource('');
      setOptionsFilterBy('[]');
      setFormRules('[]');
      setShowInAgenda(false);
      setAgendaMessage('');
      setAgendaMessageWhenFalse('');
      setAgendaDisplayType('toast');
      setAgendaSnackbarUndo(false);
      setAgendaBannerCancel(false);
      setAgendaBannerAcceptChanges(false);
      setAgendaBannerAcceptWithoutChanges(false);
      setAgendaModalCancel(false);
      setAgendaModalAcceptChanges(false);
      setAgendaModalAcceptWithoutChanges(false);
      setSelectedRegulationArticles([]);
      setTabValue(0);
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
    onSuccess: async (data) => {
      // Actualizar regulation_articles si hay cambios (ManyToMany requiere actualización separada)
      // Solo actualizar si estamos creando un nuevo parámetro y hay artículos seleccionados
      // o si estamos editando y hay cambios
      if (!parameter && selectedRegulationArticles.length > 0) {
        try {
          const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
          await axios.patch(
            `${API_URL}/api/parameters/parameter-definitions/${data.id}/`,
            { regulation_articles: selectedRegulationArticles },
            {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );
        } catch (err) {
          console.error('Error al actualizar artículos normativos:', err);
        }
      } else if (parameter && selectedRegulationArticles.length >= 0) {
        // Al editar, también actualizar regulation_articles
        try {
          const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
          await axios.patch(
            `${API_URL}/api/parameters/parameter-definitions/${data.id}/`,
            { regulation_articles: selectedRegulationArticles },
            {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );
        } catch (err) {
          console.error('Error al actualizar artículos normativos:', err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['parameter-definitions-grouped'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-definitions-all'] });
      onSuccess(data);
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.code?.[0] || err.response?.data?.detail || 'Error al guardar');
    },
  });

  const handleSubmit = () => {
    setError(null);
    
    // Validar que el código no esté vacío
    const trimmedCode = code.trim();
    if (!trimmedCode || !name.trim()) {
      setError('Código y nombre son requeridos');
      return;
    }
    
    // Validar formato del código (debe ser alfanumérico con guiones bajos)
    if (!/^[a-z][a-z0-9_]*$/.test(trimmedCode)) {
      setError('El código debe comenzar con una letra y solo puede contener letras minúsculas, números y guiones bajos');
      return;
    }

    // Validar JSON fields
    let parsedValidationRules = {};
    if (validationRules.trim()) {
      try {
        parsedValidationRules = JSON.parse(validationRules);
      } catch (e) {
        setError('Reglas de validación deben ser un JSON válido');
        return;
      }
    }

    let parsedCalculationInputs: string[] = [];
    if (calculationInputs.trim()) {
      try {
        parsedCalculationInputs = JSON.parse(calculationInputs);
        if (!Array.isArray(parsedCalculationInputs)) {
          setError('Parámetros de entrada deben ser un array JSON válido');
          return;
        }
      } catch (e) {
        setError('Parámetros de entrada deben ser un array JSON válido');
        return;
      }
    }

    let parsedOptionsFilterBy: string[] = [];
    if (optionsFilterBy.trim()) {
      try {
        const parsed = JSON.parse(optionsFilterBy);
        if (!Array.isArray(parsed)) {
          setError('Filtrar opciones por debe ser un array JSON válido (ej: ["region"])');
          return;
        }
        parsedOptionsFilterBy = parsed.map((x: unknown) => String(x));
      } catch (e) {
        setError('Filtrar opciones por debe ser un array JSON válido (ej: ["region"])');
        return;
      }
    }

    let parsedFormRules: any[] = [];
    if (formRules.trim()) {
      try {
        const parsed = JSON.parse(formRules);
        if (!Array.isArray(parsed)) {
          setError('Reglas de formulario deben ser un array JSON válido');
          return;
        }
        parsedFormRules = parsed;
      } catch (e) {
        setError('Reglas de formulario deben ser un array JSON válido');
        return;
      }
    }

    const mutationData: any = {
      code: trimmedCode,
      form_pdf_code: formPdfCode.trim() || '',
      name: name.trim(),
      description: description.trim() || '',
      category: category || null,
      data_type: dataType,
      unit: unit.trim() || '',
      help_text: helpText.trim() || '',
      is_active: isActive,
      is_key_compliance: isKeyCompliance,
      is_calculated: isCalculated,
      include_in_snapshot: includeInSnapshot,
      validation_rules: parsedValidationRules,
      calculation_formula: calculationFormula.trim() || '',
      calculation_inputs: parsedCalculationInputs,
      calculation_method: calculationMethod.trim() || '',
      snapshot_source: snapshotSource,
      source_field: sourceField.trim() || '',
      update_policy: updatePolicy,
      options_source: optionsSource.trim() || null,
      options_filter_by: parsedOptionsFilterBy,
      form_rules: parsedFormRules,
      show_in_agenda: showInAgenda,
      agenda_message: agendaMessage.trim() || '',
      agenda_message_when_false: agendaMessageWhenFalse.trim() || '',
      agenda_display_type: agendaDisplayType,
      agenda_snackbar_undo: agendaSnackbarUndo,
      agenda_banner_cancel: agendaBannerCancel,
      agenda_banner_accept_changes: agendaBannerAcceptChanges,
      agenda_banner_accept_without_changes: agendaBannerAcceptWithoutChanges,
      agenda_modal_cancel: agendaModalCancel,
      agenda_modal_accept_changes: agendaModalAcceptChanges,
      agenda_modal_accept_without_changes: agendaModalAcceptWithoutChanges,
    };

    // regulation_articles se manejan después de crear/actualizar ya que es ManyToMany
    // Debug: verificar que el código se está incluyendo
    console.log('Enviando mutationData:', { ...mutationData, code: mutationData.code || 'VACÍO' });
    createMutation.mutate(mutationData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {parameter ? 'Editar Parámetro' : 'Nuevo Parámetro'}
      </DialogTitle>
      <DialogContent sx={{ minHeight: 500 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 1, minHeight: 420 }}>
          {/* Navegación lateral */}
          <List
            dense
            sx={{
              width: 200,
              flexShrink: 0,
              borderRight: 1,
              borderColor: 'divider',
              py: 0,
            }}
          >
            {[
              'Información Básica',
              'Validación y Cálculo',
              'Snapshot y Políticas',
              'Referencias Normativas',
              'Reglas de formulario',
              'Actividades',
            ].map((label, index) => (
              <ListItemButton
                key={label}
                selected={tabValue === index}
                onClick={() => setTabValue(index)}
                sx={{ borderRadius: 1, mx: 0.5, mb: 0.25 }}
              >
                <ListItemText primary={label} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItemButton>
            ))}
          </List>

          {/* Contenido del panel */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Tab 1: Información Básica */}
        {tabValue === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Código"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              // Limpiar error cuando el usuario modifica el código
              if (error) {
                const trimmedCode = e.target.value.trim();
                if (trimmedCode && /^[a-z][a-z0-9_]*$/.test(trimmedCode)) {
                  setError(null);
                }
              }
            }}
            required
            fullWidth
            disabled={!!parameter}
            helperText={parameter ? 'El código no puede cambiarse' : 'Código único del parámetro (ej: "carga_ocupacion_total")'}
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
            onChange={(e) => {
              setName(e.target.value);
              // Limpiar error cuando el usuario modifica el nombre y el error era sobre nombre
              if (error && e.target.value.trim() && error.includes('nombre')) {
                const trimmedCode = code.trim();
                if (trimmedCode && /^[a-z][a-z0-9_]*$/.test(trimmedCode)) {
                  setError(null);
                }
              }
            }}
            required
            fullWidth
            helperText="Nombre descriptivo del parámetro"
          />

          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            helperText="Descripción detallada del parámetro"
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
              Categoría administrativa para organizar parámetros en formularios
            </Typography>
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
              Tipo de dato que almacena este parámetro
            </Typography>
          </FormControl>

          <TextField
            label="Unidad"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            fullWidth
            helperText='Unidad de medida (ej: "m", "m²", "personas", "%")'
          />

          <TextField
            label="Texto de Ayuda"
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            multiline
            rows={2}
            fullWidth
            helperText="Texto de ayuda para el usuario al ingresar este parámetro"
          />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                }
                label="Activo"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={isKeyCompliance}
                    onChange={(e) => setIsKeyCompliance(e.target.checked)}
                  />
                }
                label="Parámetro Crítico"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4.5, mt: -0.5 }}>
                Indica si es un parámetro crítico para cumplimiento normativo (DOM)
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isCalculated}
                    onChange={(e) => setIsCalculated(e.target.checked)}
                  />
                }
                label="Es Calculado"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4.5, mt: -0.5 }}>
                Indica si este parámetro se calcula automáticamente
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeInSnapshot}
                    onChange={(e) => setIncludeInSnapshot(e.target.checked)}
                  />
                }
                label="Incluir en Snapshot"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4.5, mt: -0.5 }}>
                Si es True, este parámetro se incluye en snapshots del proyecto. Solo parámetros críticos que afectan cálculos normativos deben estar en True.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Tab 2: Validación y Cálculo */}
        {tabValue === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Validación</Typography>
            <TextField
              label="Reglas de Validación"
              value={validationRules}
              onChange={(e) => {
                setValidationRules(e.target.value);
                // Limpiar error cuando el usuario modifica las reglas de validación y el error era sobre JSON
                if (error && (error.includes('Reglas de validación') || error.includes('JSON válido'))) {
                  const trimmed = e.target.value.trim();
                  if (!trimmed || (trimmed && isValidJSON(trimmed))) {
                    // Verificar que otros campos también sean válidos antes de limpiar
                    const trimmedCode = code.trim();
                    const trimmedName = name.trim();
                    const isCodeValid = trimmedCode && /^[a-z][a-z0-9_]*$/.test(trimmedCode);
                    const isNameValid = trimmedName.length > 0;
                    const isCalculationInputsValid = !calculationInputs.trim() || isValidJSONArray(calculationInputs.trim());
                    if (isCodeValid && isNameValid && isCalculationInputsValid) {
                      setError(null);
                    }
                  }
                }
              }}
              multiline
              rows={4}
              fullWidth
              helperText='Reglas de validación en formato JSON (ej: {"min": 0, "max": 100})'
              placeholder='{"min": 0, "max": 100}'
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>Cálculo Automático</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Estos campos solo aplican si "Es Calculado" está activado.
            </Alert>

            <TextField
              label="Fórmula de Cálculo"
              value={calculationFormula}
              onChange={(e) => setCalculationFormula(e.target.value)}
              multiline
              rows={3}
              fullWidth
              helperText='Fórmula para calcular este parámetro automáticamente (ej: "superficie / factor_ocupacion")'
              placeholder='superficie / factor_ocupacion'
            />

            <TextField
              label="Parámetros de Entrada"
              value={calculationInputs}
              onChange={(e) => {
                setCalculationInputs(e.target.value);
                // Limpiar error cuando el usuario modifica los parámetros de entrada y el error era sobre este campo
                if (error && error.includes('Parámetros de entrada')) {
                  const trimmed = e.target.value.trim();
                  if (!trimmed || (trimmed && isValidJSONArray(trimmed))) {
                    // Verificar que otros campos también sean válidos antes de limpiar
                    const trimmedCode = code.trim();
                    const trimmedName = name.trim();
                    const isCodeValid = trimmedCode && /^[a-z][a-z0-9_]*$/.test(trimmedCode);
                    const isNameValid = trimmedName.length > 0;
                    const isValidationRulesValid = !validationRules.trim() || isValidJSON(validationRules.trim());
                    if (isCodeValid && isNameValid && isValidationRulesValid) {
                      setError(null);
                    }
                  }
                }
              }}
              multiline
              rows={3}
              fullWidth
              helperText='Lista de códigos de parámetros necesarios para el cálculo: ["superficie_construida", "factor_ocupacion"]'
              placeholder='["superficie_construida", "factor_ocupacion"]'
            />

            <TextField
              label="Método de Cálculo"
              value={calculationMethod}
              onChange={(e) => setCalculationMethod(e.target.value)}
              fullWidth
              helperText='Nombre del método Python que ejecuta el cálculo (ej: "calculate_occupancy_load"). Si está vacío, usa calculation_formula'
              placeholder='calculate_occupancy_load'
            />
          </Box>
        )}

        {/* Tab 3: Snapshot y Políticas */}
        {tabValue === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Configuración de Snapshot</Typography>

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
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                Define si este parámetro debe capturar snapshot desde un modelo externo
              </Typography>
            </FormControl>

            {snapshotSource !== 'none' && (
              snapshotSource === 'property' || snapshotSource === 'user' ? (
                <FormControl fullWidth>
                  <InputLabel>Campo Fuente</InputLabel>
                  <Select
                    label="Campo Fuente"
                    value={sourceField}
                    onChange={(e) => setSourceField(e.target.value)}
                    disabled={snapshotFieldsLoading}
                    displayEmpty
                    renderValue={(v) => v || ''}
                  >
                    <MenuItem value="">
                      <em>Ninguno</em>
                    </MenuItem>
                    {[
                      ...snapshotSourceFields,
                      ...(sourceField && !snapshotSourceFields.some((f) => f.value === sourceField)
                        ? [{ value: sourceField, label: sourceField }]
                        : []),
                    ]
                      .sort((a, b) => a.value.localeCompare(b.value))
                      .map((f) => (
                        <MenuItem key={f.value} value={f.value}>
                          {f.label}
                        </MenuItem>
                      ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Campos disponibles desde el modelo {snapshotSource === 'property' ? 'Property' : 'ProjectCollaborator'}
                  </Typography>
                </FormControl>
              ) : (
                <TextField
                  label="Campo Fuente"
                  value={sourceField}
                  onChange={(e) => setSourceField(e.target.value)}
                  fullWidth
                  helperText="Snapshot manual: campo fuente opcional"
                  placeholder="rol_number"
                />
              )
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
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                Cómo manejar actualizaciones cuando el valor fuente cambia
              </Typography>
            </FormControl>
          </Box>
        )}

        {/* Tab 4: Referencias Normativas */}
        {tabValue === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>Artículos Normativos</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Artículos de normativa que definen o regulan este parámetro
            </Typography>

            {isLoadingArticles ? (
              <Alert severity="info">
                Cargando artículos normativos...
              </Alert>
            ) : articlesError ? (
              <Alert severity="warning">
                No se pudieron cargar los artículos normativos. Verifica que el endpoint esté disponible.
              </Alert>
            ) : regulationArticles && regulationArticles.length > 0 ? (
              <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                {regulationArticles.map((article: any) => (
                  <FormControlLabel
                    key={article.id}
                    control={
                      <Switch
                        checked={selectedRegulationArticles.includes(article.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRegulationArticles([...selectedRegulationArticles, article.id]);
                          } else {
                            setSelectedRegulationArticles(selectedRegulationArticles.filter(id => id !== article.id));
                          }
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {article.code || article.name}
                        </Typography>
                        {article.name && article.code !== article.name && (
                          <Typography variant="caption" color="text.secondary">
                            {article.name}
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{ display: 'flex', mb: 1, alignItems: 'flex-start' }}
                  />
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                No hay artículos normativos disponibles. Debes crear artículos normativos primero.
              </Alert>
            )}

            {selectedRegulationArticles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Artículos seleccionados:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedRegulationArticles.map(articleId => {
                    const article = regulationArticles?.find((a: any) => a.id === articleId);
                    return article ? (
                      <Chip
                        key={articleId}
                        label={article.code || article.name}
                        onDelete={() => {
                          setSelectedRegulationArticles(selectedRegulationArticles.filter(id => id !== articleId));
                        }}
                      />
                    ) : null;
                  })}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 5: Reglas de formulario */}
        {tabValue === 4 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Selector y reglas</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Configuración para mostrar este parámetro como desplegable (ej: Comuna, Región) y reglas que se ejecutan al cambiar su valor.
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Origen de opciones</InputLabel>
              <Select
                value={optionsSource}
                onChange={(e) => setOptionsSource(e.target.value)}
                label="Origen de opciones"
              >
                <MenuItem value="">Ninguno (campo libre)</MenuItem>
                {(optionSources ?? []).map((s) => (
                  <MenuItem key={s.id} value={s.code}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                Si se define, este parámetro se mostrará como desplegable con opciones del catálogo.
              </Typography>
            </FormControl>

            <TextField
              label="Filtrar opciones por"
              value={optionsFilterBy}
              onChange={(e) => setOptionsFilterBy(e.target.value)}
              multiline
              rows={2}
              fullWidth
              placeholder='["propiedad_region"]'
            />
            {selectedOptionSource?.help_filter_by ? (
              <Alert severity="info" sx={{ mt: 0.5 }}>
                {selectedOptionSource.help_filter_by}
              </Alert>
            ) : null}

            <TextField
              label="Reglas al cambiar este parámetro"
              value={formRules}
              onChange={(e) => setFormRules(e.target.value)}
              multiline
              rows={6}
              fullWidth
              placeholder='[{"action": "clear_value", "target_parameter_code": "comuna"}]'
            />
            {selectedOptionSource?.help_form_rules ? (
              <Alert severity="info" sx={{ mt: 0.5 }}>
                {selectedOptionSource.help_form_rules}
              </Alert>
            ) : null}
          </Box>
        )}

        {/* Tab 6: Actividades (agenda / bitácora) */}
        {tabValue === 5 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Bitácora y agenda de actividad</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Si este parámetro se muestra en la agenda, al actualizarlo se creará una entrada en la bitácora (toast, snackbar, banner o modal) según el tipo de presentación.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={showInAgenda}
                  onChange={(e) => setShowInAgenda(e.target.checked)}
                />
              }
              label="Mostrar en agenda"
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4.5, mt: -0.5, display: 'block' }}>
              Si está activo, al actualizar este parámetro se crea una entrada en la bitácora.
            </Typography>

            {showInAgenda && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  Mensajes según el valor del parámetro
                </Typography>
                <TextField
                  label="Cuando el valor es True (Sí)"
                  value={agendaMessage}
                  onChange={(e) => setAgendaMessage(e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  helperText="Mensaje mostrado en la alerta cuando el usuario activa el parámetro (ej. «Sí» en un booleano). Si está vacío se usa «Se actualizó {nombre del parámetro}»."
                  placeholder="Se agregó el trámite de Alteración. Se agregarán los documentos: Listado de alteraciones, Presupuesto. ¿Aplicar estos cambios?"
                />
                <TextField
                  label="Cuando el valor es False (No / No aplica)"
                  value={agendaMessageWhenFalse}
                  onChange={(e) => setAgendaMessageWhenFalse(e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  helperText="Para parámetros booleanos: mensaje cuando el usuario desactiva el parámetro. Si está vacío, en algunos parámetros (ej. Alteración) el sistema usa un mensaje por defecto según el estado del proyecto."
                  placeholder="Se quitarán los documentos del Listado de Antecedentes: Listado de alteraciones, Presupuesto. ¿Aplicar estos cambios?"
                />

                <FormControl fullWidth>
                  <InputLabel>Tipo de presentación</InputLabel>
                  <Select
                    value={agendaDisplayType}
                    onChange={(e) => setAgendaDisplayType(e.target.value)}
                    label="Tipo de presentación"
                  >
                    <MenuItem value="toast">Toast (efímero, sin botones)</MenuItem>
                    <MenuItem value="snackbar">Snackbar (con acción Deshacer)</MenuItem>
                    <MenuItem value="banner">Banner (requiere decisión)</MenuItem>
                    <MenuItem value="modal">Modal (requiere decisión, bloquea pantalla)</MenuItem>
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                    Toast/snackbar ejecutan el handler al instante; banner/modal quedan pendientes hasta que el usuario resuelva.
                  </Typography>
                </FormControl>

                {agendaDisplayType === 'snackbar' && (
                  <Box sx={{ pl: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={agendaSnackbarUndo}
                          onChange={(e) => setAgendaSnackbarUndo(e.target.checked)}
                        />
                      }
                      label="Incluir botón Deshacer"
                    />
                  </Box>
                )}

                {(agendaDisplayType === 'banner' || agendaDisplayType === 'modal') && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Botones disponibles para este tipo:
                    </Typography>
                    {agendaDisplayType === 'banner' && (
                      <>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agendaBannerCancel}
                              onChange={(e) => setAgendaBannerCancel(e.target.checked)}
                            />
                          }
                          label="Cancelar (revierte el valor)"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agendaBannerAcceptChanges}
                              onChange={(e) => setAgendaBannerAcceptChanges(e.target.checked)}
                            />
                          }
                          label="Aceptar Cambios"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agendaBannerAcceptWithoutChanges}
                              onChange={(e) => setAgendaBannerAcceptWithoutChanges(e.target.checked)}
                            />
                          }
                          label="Aceptar sin cambios"
                        />
                      </>
                    )}
                    {agendaDisplayType === 'modal' && (
                      <>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agendaModalCancel}
                              onChange={(e) => setAgendaModalCancel(e.target.checked)}
                            />
                          }
                          label="Cancelar (revierte el valor)"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agendaModalAcceptChanges}
                              onChange={(e) => setAgendaModalAcceptChanges(e.target.checked)}
                            />
                          }
                          label="Aceptar Cambios"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={agendaModalAcceptWithoutChanges}
                              onChange={(e) => setAgendaModalAcceptWithoutChanges(e.target.checked)}
                            />
                          }
                          label="Aceptar sin cambios"
                        />
                      </>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
          </Box>
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
