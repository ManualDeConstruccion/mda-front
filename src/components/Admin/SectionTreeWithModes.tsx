import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  Chip,
  Tooltip,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  useSortable,
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { formatNumberLocale } from '../../utils/helpers';
import { GRID_LABEL_LIGHTBLUE } from '../../utils/gridStandard';
import EditFormParameterCategoryModal from './EditFormParameterCategoryModal';
import AddFormParameterModal from './AddFormParameterModal';
import EditFormParameterModal from './EditFormParameterModal';
import AddEditFormGridCellModal from './AddEditFormGridCellModal';
import GridRow from './GridRow';
import ParameterInput from './ParameterInput';
import SuperficiesSectionContent from './SuperficiesSectionContent';

// Tipos
export type SectionTreeMode = 'view' | 'editable' | 'admin';

export interface FormType {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormParameterCategory {
  id: number;
  code: string;
  number: string;
  name: string;
  form_type?: number | FormType | null;
  form_type_name?: string | null;
  description?: string;
  parent?: number | null;
  order: number;
  is_active: boolean;
  form_parameters?: FormParameter[];
  grid_cells?: FormGridCell[];
  subcategories?: FormParameterCategory[];
  display_config?: {
    layout_type?: string;
    grid_config?: {
      rows_columns?: Record<string, number>; // "1": 3, "2": 1, etc.
    };
  };
}

export interface FormParameter {
  id: number;
  category: number;
  parameter_definition: number | {
    id: number;
    code: string;
    name: string;
    data_type: string;
    unit?: string;
    is_calculated?: boolean;
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

export interface FormGridCellStyle {
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: 'lightblue' | 'transparent';
  fontWeight?: 'normal' | 'bold';
  cellType?: 'normal' | 'title';
}

export interface FormGridCell {
  id: number;
  category: number;
  grid_row: number;
  grid_column: number;
  grid_span: number;
  content: string;
  style?: FormGridCellStyle | any;
  is_active: boolean;
}

interface SectionTreeWithModesProps {
  section: FormParameterCategory;
  level: number;
  projectTypeId: number;
  allSections: FormParameterCategory[];
  onSectionUpdated: () => void;
  mode?: SectionTreeMode;
  subprojectId?: number; // Para modo editable (usuario final)
  values?: Record<string, any>; // Valores actuales del formulario (modo editable)
  onChange?: (categoryId: number, code: string, value: any) => void; // Callback para cambios (modo editable); categoryId es la sección que contiene el parámetro
  onSectionExpand?: (sectionId: number) => Promise<void>; // Callback cuando se expande una sección (para cargar valores)
  activeSectionId?: number; // ID de la sección que debe estar expandida por defecto
  sectionMode?: 'view' | 'editable'; // Modo específico para esta sección (solo para usuario final)
  onSectionModeChange?: (sectionId: number, mode: 'view' | 'editable') => void; // Callback cuando cambia el modo de la sección
  getSectionMode?: (sectionId: number) => 'view' | 'editable' | undefined; // Función para obtener el modo de cualquier sección (para subcategorías)
}

// Componente para celda de grilla (compartido por todos los modos)
export interface GridCellProps {
  cell: FormParameter | FormGridCell;
  row: number;
  column: number;
  span: number;
  isDragging?: boolean;
  onEdit?: (cell: FormParameter | FormGridCell) => void;
  onDelete?: (cell: FormParameter | FormGridCell) => void;
  mode: SectionTreeMode;
  isParameter: boolean;
  values?: Record<string, any>;
  onChange?: (code: string, value: any) => void;
}

const MIN_CELL_WIDTH_FOR_INLINE_INPUT = 180; // Por debajo de este ancho se usa modal para editar

const GridCell: React.FC<GridCellProps> = ({
  cell,
  row,
  column,
  span,
  isDragging = false,
  onEdit,
  onDelete,
  mode,
  isParameter,
  values = {},
  onChange,
}) => {
  const cellId = `cell-${isParameter ? 'param' : 'text'}-${cell.id}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellWidth, setCellWidth] = useState<number | null>(null);
  const [inputModalOpen, setInputModalOpen] = useState(false);
  const [modalValue, setModalValue] = useState<any>(null);

  // Solo usar useSortable en modo admin
  const sortable = useSortable({ id: cellId, disabled: mode !== 'admin' });

  // Medir ancho de la celda para decidir si mostrar input inline o en modal
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setCellWidth(w);
      }
    });
    ro.observe(el);
    setCellWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  
  const style = mode === 'admin' ? {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: `span ${span}`,
  } : {
    gridColumn: `span ${span}`,
  };

  // Type guard para parameter_definition
  const getParameterDefinition = (param: FormParameter) => {
    if (typeof param.parameter_definition === 'object' && param.parameter_definition !== null) {
      return param.parameter_definition;
    }
    return null;
  };

  const cellContent = isParameter
    ? getParameterDefinition(cell as FormParameter)?.name || (cell as FormParameter).parameter_definition_name || 'Parámetro'
    : (cell as FormGridCell).content;

  const cellCode = isParameter
    ? getParameterDefinition(cell as FormParameter)?.code || (cell as FormParameter).parameter_definition_code
    : null;

  // Obtener data_type, unit e is_calculated del parameter_definition para modo editable/vista
  const paramDef = isParameter ? getParameterDefinition(cell as FormParameter) : null;
  const dataType = paramDef?.data_type || 'text';
  const unit = paramDef?.unit;
  const isCalculated = paramDef?.is_calculated ?? false;
  
  // Obtener is_required del FormParameter
  const isRequired = isParameter ? (cell as FormParameter).is_required : false;

  // Determinar el color de fondo
  const getBackgroundColor = () => {
    if (mode === 'editable') {
      // Parámetros editables (no calculados, con input) → verde claro
      const isEditableParam = isParameter && !isCalculated && !!cellCode && !!paramDef && !!onChange;
      if (isEditableParam) {
        return 'rgba(232, 245, 233, 0.95)'; // Verde claro (Material green 50)
      }
      // Celdas de texto con celeste en estilo → mantener celeste (estándar grilla)
      if (!isParameter) {
        const cellStyle = (cell as FormGridCell).style || {};
        if ((cellStyle.backgroundColor || '') === 'lightblue') {
          return GRID_LABEL_LIGHTBLUE;
        }
      }
      // Resto (calculados, celdas de texto sin celeste) → blanco
      return '#fff';
    }
    if (isParameter) {
      return 'background.default';
    }
    // Para celdas de texto, verificar si tienen fondo celeste definido en style (estándar grilla)
    const cellStyle = (cell as FormGridCell).style || {};
    const backgroundColor = cellStyle.backgroundColor || 'transparent';
    if (backgroundColor === 'lightblue') {
      return GRID_LABEL_LIGHTBLUE;
    }
    return 'transparent';
  };

  // Determinar si es tipo título
  const isTitleType = !isParameter && ((cell as FormGridCell).style || {}).cellType === 'title';

  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (mode === 'admin') sortable.setNodeRef(el);
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [mode, sortable]);

  return (
    <Box
      ref={setContainerRef}
      style={style}
      {...(mode === 'admin' ? sortable.attributes : {})}
      sx={{
        p: isTitleType ? { py: 3, px: 1.5 } : 1.5,
        border: isTitleType ? 'none' : '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        borderRadius: 1,
        bgcolor: getBackgroundColor(),
        position: 'relative',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: mode === 'view' ? 'center' : 'flex-start',
        cursor: mode === 'admin' ? 'grab' : 'default',
        '&:hover': mode === 'admin' ? {
          borderColor: 'primary.main',
          boxShadow: 1,
        } : mode === 'editable' ? {
          borderColor: 'primary.light',
        } : {},
      }}
    >
      {mode === 'admin' && (
        <Box
          {...sortable.listeners}
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            cursor: 'grab',
            color: 'text.secondary',
          }}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
      )}
      
      <Box sx={{ 
        flex: 1, 
        ml: mode === 'admin' ? 4 : 0,
        display: 'flex',
        flexDirection: 'column',
        ...(mode === 'view' && isParameter ? {
          justifyContent: 'center',
          alignItems: 'center',
        } : {})
      }}>
        {isParameter ? (
          <>
            {/* En modo admin y editable, mostrar nombre y código */}
            {(mode === 'admin' || mode === 'editable') && (
              <>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
                  {cellContent}
                </Typography>
                {cellCode && mode === 'admin' && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Código: {cellCode}
                  </Typography>
                )}
              </>
            )}
            {/* En modo editable, mostrar el input correspondiente (inline o en modal si la celda es estrecha) */}
            {mode === 'editable' && cellCode && paramDef && onChange && (() => {
              const handleChange = onChange;
              const useModalForInput = cellWidth !== null && cellWidth < MIN_CELL_WIDTH_FOR_INLINE_INPUT;
              const currentValue = values?.[cellCode];
              let displayValue = '';
              if (currentValue === null || currentValue === undefined) {
                displayValue = 'Ingresar valor';
              } else {
                switch (dataType) {
                  case 'decimal':
                    displayValue = typeof currentValue === 'number'
                      ? formatNumberLocale(currentValue, 2)
                      : String(currentValue);
                    if (unit) displayValue += ` ${unit}`;
                    break;
                  case 'integer':
                    displayValue = typeof currentValue === 'number'
                      ? formatNumberLocale(currentValue, 0)
                      : String(currentValue);
                    if (unit) displayValue += ` ${unit}`;
                    break;
                  case 'boolean':
                    displayValue = currentValue ? 'Sí' : 'No';
                    break;
                  case 'date':
                    try {
                      displayValue = new Date(currentValue).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    } catch {
                      displayValue = String(currentValue);
                    }
                    break;
                  default:
                    displayValue = String(currentValue);
                }
              }
              if (useModalForInput) {
                return (
                  <>
                    <Box
                      onClick={() => {
                        setModalValue(values?.[cellCode] ?? null);
                        setInputModalOpen(true);
                      }}
                      sx={{
                        mt: 1,
                        py: 1,
                        px: 1.5,
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 1,
                        cursor: 'pointer',
                        bgcolor: 'action.hover',
                        '&:hover': { bgcolor: 'action.selected', borderColor: 'primary.light' },
                      }}
                    >
                      <Typography variant="body2" color={currentValue === null || currentValue === undefined ? 'text.secondary' : 'text.primary'}>
                        {displayValue}
                      </Typography>
                    </Box>
                    <Dialog open={inputModalOpen} onClose={() => setInputModalOpen(false)} maxWidth="xs" fullWidth>
                      <DialogTitle>{cellContent}</DialogTitle>
                      <DialogContent sx={{ pt: 1 }}>
                        <Box sx={{ mt: 1 }}>
                          <ParameterInput
                            dataType={dataType as any}
                            value={modalValue}
                            onChange={(newValue) => setModalValue(newValue)}
                            label={undefined}
                            unit={unit}
                            required={isRequired}
                            disabled={isCalculated}
                          />
                        </Box>
                      </DialogContent>
                      <DialogActions>
                        <Button
                          onClick={() => {
                            handleChange(cellCode, modalValue);
                            setInputModalOpen(false);
                          }}
                          variant="contained"
                        >
                          Listo
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </>
                );
              }
              return (
                <Box sx={{ mt: 1 }}>
                  <ParameterInput
                    dataType={dataType as any}
                    value={values?.[cellCode]}
                    onChange={(newValue) => {
                      handleChange(cellCode, newValue);
                    }}
                    label={undefined}
                    unit={unit}
                    required={isRequired}
                    disabled={isCalculated}
                    persistOnBlur
                  />
                </Box>
              );
            })()}
            {/* En modo vista, mostrar solo el valor formateado, grande y centrado */}
            {mode === 'view' && cellCode && (() => {
              const value = values?.[cellCode];
              let displayValue = '';
              
              if (value === null || value === undefined) {
                displayValue = '-';
              } else {
                switch (dataType) {
                  case 'decimal':
                    displayValue = typeof value === 'number'
                      ? formatNumberLocale(value, 2)
                      : String(value);
                    if (unit) displayValue += ` ${unit}`;
                    break;
                  case 'integer':
                    displayValue = typeof value === 'number'
                      ? formatNumberLocale(value, 0)
                      : String(value);
                    if (unit) displayValue += ` ${unit}`;
                    break;
                  case 'boolean':
                    displayValue = value ? 'Sí' : 'No';
                    break;
                  case 'date':
                    try {
                      const date = new Date(value);
                      displayValue = date.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      });
                    } catch {
                      displayValue = String(value);
                    }
                    break;
                  default:
                    displayValue = String(value);
                }
              }
              
              return (
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'medium',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  {displayValue}
                </Typography>
              );
            })()}
          </>
        ) : (
          (() => {
            // Obtener estilos de la celda de texto
            const cellStyle = (cell as FormGridCell).style || {};
            const textAlign = cellStyle.textAlign || 'left';
            const fontWeight = cellStyle.fontWeight || 'normal';
            
            return (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontStyle: mode === 'view' ? 'normal' : 'italic',
                  textAlign: textAlign,
                  fontWeight: fontWeight,
                  width: '100%',
                }}
              >
                {cellContent}
              </Typography>
            );
          })()
        )}
      </Box>

      {mode === 'admin' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 'auto' }}>
          {onEdit && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(cell);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(cell);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          {isParameter && isRequired && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              Requerido
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

// Alias para compatibilidad
const SortableGridCell = GridCell;

// Exportar GridCell y sus tipos para uso en otros componentes
export { GridCell, SortableGridCell };

// Componente principal
const SectionTreeWithModes: React.FC<SectionTreeWithModesProps> = ({
  section,
  level,
  projectTypeId,
  allSections,
  onSectionUpdated,
  mode = 'view',
  subprojectId,
  values: externalValues = {},
  onChange: externalOnChange,
  onSectionExpand,
  activeSectionId,
  sectionMode: propSectionMode,
  onSectionModeChange,
  getSectionMode,
}) => {
  const { accessToken } = useAuth();
  
  // Estado local para valores cuando no hay onChange externo (modo admin)
  const [localValues, setLocalValues] = useState<Record<string, any>>(externalValues);
  
  // Sincronizar valores locales con valores externos cuando cambian
  useEffect(() => {
    if (externalValues && Object.keys(externalValues).length > 0) {
      setLocalValues(externalValues);
    }
  }, [externalValues]);
  
  // Handler local para cambios cuando no hay onChange externo
  const handleLocalChange = useCallback((code: string, value: any) => {
    setLocalValues(prev => ({
      ...prev,
      [code]: value,
    }));
  }, []);

  // Envolver onChange para inyectar section.id: así cada nivel (incl. subcategorías) guarda en su categoryId correcto
  const onChange = useCallback(
    (code: string, value: any) => {
      if (externalOnChange) {
        externalOnChange(section.id, code, value);
      } else {
        handleLocalChange(code, value);
      }
    },
    [section.id, externalOnChange, handleLocalChange]
  );
  const values = externalOnChange ? externalValues : localValues;
  
  // Determinar el modo efectivo: usar sectionMode si está definido, sino usar mode
  // sectionMode solo aplica cuando no estamos en modo admin y hay subprojectId (usuario final)
  // Si sectionMode está definido (no undefined), usarlo. Si no, intentar obtenerlo con getSectionMode, sino usar mode.
  const resolvedSectionMode = propSectionMode !== undefined 
    ? propSectionMode 
    : (getSectionMode ? getSectionMode(section.id) : undefined);
  
  const effectiveMode: SectionTreeMode = (mode !== 'admin' && subprojectId && resolvedSectionMode !== undefined) 
    ? resolvedSectionMode 
    : mode;
  
  // Debug: verificar que effectiveMode se calcula correctamente
  useEffect(() => {
    if (mode !== 'admin' && subprojectId) {
      console.log(`[SectionTreeWithModes] Section ${section.id}: mode=${mode}, propSectionMode=${propSectionMode} (${typeof propSectionMode}), effectiveMode=${effectiveMode}`);
    }
  }, [mode, propSectionMode, effectiveMode, section.id, subprojectId]);
  
  // Persistir estado de expansión usando sessionStorage para evitar que se cierre al recargar
  const storageKey = `section-expanded-${section.id}`;
  const getInitialExpandedState = () => {
    // En modo vista, todas las secciones inician plegadas
    if (mode === 'view') {
      return false;
    }
    
    // Si hay una sección activa definida, esa debe estar expandida (solo para la primera vez)
    // Pero solo en modos admin o editable, no en vista
    if (activeSectionId !== undefined && section.id === activeSectionId && mode !== 'view') {
      return true;
    }
    
    // Todas las categorías empiezan colapsadas por defecto
    // Solo se expande manualmente o si está guardada en sessionStorage
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored === 'true';
    } catch {
      return false;
    }
  };
  
  const [isExpanded, setIsExpanded] = useState(getInitialExpandedState);
  
  // Si hay activeSectionId y coincide con esta sección, expandirla (solo si no estaba ya guardada)
  // Pero NO en modo vista
  useEffect(() => {
    if (mode === 'view') {
      // En modo vista, forzar que esté plegada
      setIsExpanded(false);
      return;
    }
    
    if (activeSectionId !== undefined && section.id === activeSectionId) {
      // Solo expandir si no hay estado guardado en sessionStorage
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
          setIsExpanded(true);
        }
      } catch {
        setIsExpanded(true);
      }
    }
  }, [activeSectionId, section.id, storageKey, mode]);
  
  // Guardar estado de expansión cuando cambia
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, String(isExpanded));
    } catch {
      // Ignorar errores de sessionStorage
    }
  }, [isExpanded, storageKey]);
  
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [addParameterModalOpen, setAddParameterModalOpen] = useState(false);
  const [parameterInitialGridPosition, setParameterInitialGridPosition] = useState<{ row: number; column: number } | null>(null);
  const [editParameterModalOpen, setEditParameterModalOpen] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<FormParameter | null>(null);
  const [selectTypeModalOpen, setSelectTypeModalOpen] = useState(false);
  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);
  
  // Obtener tipos de formulario desde la API
  useEffect(() => {
    const fetchFormTypes = async () => {
      if (mode !== 'admin') return;
      try {
        const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
        const response = await axios.get(
          `${API_URL}/api/parameters/form-types/`,
          {
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
            withCredentials: true,
          }
        );
        setFormTypes(response.data);
      } catch (error) {
        console.error('Error al obtener tipos de formulario:', error);
      }
    };
    fetchFormTypes();
  }, [mode, accessToken]);
  
  const hasSubcategories = section.subcategories && section.subcategories.length > 0;
  const hasParameters = section.form_parameters && section.form_parameters.length > 0;
  
  // Determinar si la sección usa la interfaz de grilla (solo para tipo "general" explícitamente)
  const formTypeName = typeof section.form_type === 'object' 
    ? section.form_type?.name 
    : (section.form_type_name || null);
  // Normalizar: si es cadena vacía, tratarla como null
  const normalizedFormTypeName = (formTypeName === '' || formTypeName === null || formTypeName === undefined) ? null : formTypeName;
  // Solo mostrar grilla si el tipo es explícitamente "general", no si es undefined/null
  const useGridInterface = normalizedFormTypeName === 'general';
  // Sección especial "superficies": pestañas Resumen / Pisos / Niveles / Polígonos (solo vista/editable con subprojectId)
  const isSuperficiesSection = normalizedFormTypeName === 'superficies' && mode !== 'admin' && !!subprojectId;

  // Verificar si form_type es realmente undefined/null (no solo falsy)
  // IMPORTANTE: Si es tipo "general", NO es undefined, así que no mostrar selector
  const isFormTypeUndefined = normalizedFormTypeName === null || normalizedFormTypeName === undefined || normalizedFormTypeName === '';
  
  // Helper: Obtener número de columnas para una fila desde display_config
  const getColumnsForRow = useCallback((row: number): number => {
    const rowsColumns = section.display_config?.grid_config?.rows_columns || {};
    const rowKey = String(row);
    if (rowsColumns[rowKey]) {
      return rowsColumns[rowKey];
    }
    // Si no existe en display_config, calcular desde los elementos existentes
    let max = 1;
    if (hasParameters) {
      section.form_parameters?.forEach(param => {
        if (param.grid_row === row) {
          const col = param.grid_column || 1;
          const span = param.grid_span || 1;
          if (col + span - 1 > max) {
            max = col + span - 1;
          }
        }
      });
    }
    if (section.grid_cells) {
      section.grid_cells.forEach(cell => {
        if (cell.grid_row === row) {
          if (cell.grid_column + cell.grid_span - 1 > max) {
            max = cell.grid_column + cell.grid_span - 1;
          }
        }
      });
    }
    return Math.min(Math.max(max, 1), 5); // Entre 1 y 5
  }, [section.display_config, section.form_parameters, section.grid_cells, hasParameters]);
  
  // Helper: Actualizar display_config
  const updateDisplayConfig = useCallback(async (row: number, columns: number) => {
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const currentConfig = section.display_config || {};
      const currentGridConfig = currentConfig.grid_config || {};
      const currentRowsColumns = currentGridConfig.rows_columns || {};
      
      const newDisplayConfig = {
        ...currentConfig,
        grid_config: {
          ...currentGridConfig,
          rows_columns: {
            ...currentRowsColumns,
            [String(row)]: columns,
          },
        },
      };
      
      await axios.patch(
        `${API_URL}/api/parameters/form-parameter-categories/${section.id}/`,
        { display_config: newDisplayConfig },
        {
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
          withCredentials: true,
        }
      );
      
      onSectionUpdated();
    } catch (error) {
      console.error('Error al actualizar display_config:', error);
    }
  }, [section.id, section.display_config, accessToken, onSectionUpdated]);
  
  // Helper: Agregar fila antes
  const addRowBefore = useCallback(async (targetRow: number) => {
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const currentConfig = section.display_config || {};
      const currentGridConfig = currentConfig.grid_config || {};
      const currentRowsColumns = currentGridConfig.rows_columns || {};
      
      // Crear nuevo objeto rows_columns con las filas desplazadas
      const newRowsColumns: Record<string, number> = {};
      Object.keys(currentRowsColumns).forEach(key => {
        const rowNum = Number(key);
        if (rowNum >= targetRow) {
          newRowsColumns[String(rowNum + 1)] = currentRowsColumns[key];
        } else {
          newRowsColumns[key] = currentRowsColumns[key];
        }
      });
      
      // Agregar nueva fila con 3 columnas por defecto
      newRowsColumns[String(targetRow)] = 3;
      
      const newDisplayConfig = {
        ...currentConfig,
        grid_config: {
          ...currentGridConfig,
          rows_columns: newRowsColumns,
        },
      };
      
      // Actualizar display_config
      await axios.patch(
        `${API_URL}/api/parameters/form-parameter-categories/${section.id}/`,
        { display_config: newDisplayConfig },
        {
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
          withCredentials: true,
        }
      );
      
      // Desplazar parámetros que están en filas >= targetRow
      if (section.form_parameters) {
        const paramsToMove = section.form_parameters.filter(param => (param.grid_row || 1) >= targetRow);
        for (const param of paramsToMove) {
          await axios.patch(
            `${API_URL}/api/parameters/form-parameters/${param.id}/update_grid_position/`,
            {
              grid_row: (param.grid_row || 1) + 1,
              grid_column: param.grid_column || 1,
              grid_span: param.grid_span || 1,
            },
            {
              headers: {
                'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
              },
              withCredentials: true,
            }
          );
        }
      }
      
      // Desplazar celdas de texto que están en filas >= targetRow
      if (section.grid_cells) {
        const cellsToMove = section.grid_cells.filter(cell => cell.grid_row >= targetRow);
        for (const cell of cellsToMove) {
          await axios.patch(
            `${API_URL}/api/parameters/form-grid-cells/${cell.id}/`,
            {
              grid_row: cell.grid_row + 1,
              grid_column: cell.grid_column,
              grid_span: cell.grid_span,
              content: cell.content,
            },
            {
              headers: {
                'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
              },
              withCredentials: true,
            }
          );
        }
      }
      
      onSectionUpdated();
    } catch (error) {
      console.error('Error al agregar fila antes:', error);
    }
  }, [section.id, section.display_config, section.form_parameters, section.grid_cells, accessToken, onSectionUpdated]);
  
  // Helper: Agregar fila después
  const addRowAfter = useCallback(async (targetRow: number) => {
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const currentConfig = section.display_config || {};
      const currentGridConfig = currentConfig.grid_config || {};
      const currentRowsColumns = currentGridConfig.rows_columns || {};
      
      // Crear nuevo objeto rows_columns con las filas desplazadas
      const newRowsColumns: Record<string, number> = {};
      Object.keys(currentRowsColumns).forEach(key => {
        const rowNum = Number(key);
        if (rowNum > targetRow) {
          newRowsColumns[String(rowNum + 1)] = currentRowsColumns[key];
        } else {
          newRowsColumns[key] = currentRowsColumns[key];
        }
      });
      
      // Agregar nueva fila con 3 columnas por defecto
      newRowsColumns[String(targetRow + 1)] = 3;
      
      const newDisplayConfig = {
        ...currentConfig,
        grid_config: {
          ...currentGridConfig,
          rows_columns: newRowsColumns,
        },
      };
      
      // Actualizar display_config
      await axios.patch(
        `${API_URL}/api/parameters/form-parameter-categories/${section.id}/`,
        { display_config: newDisplayConfig },
        {
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
          withCredentials: true,
        }
      );
      
      // Desplazar parámetros que están en filas > targetRow
      if (section.form_parameters) {
        const paramsToMove = section.form_parameters.filter(param => (param.grid_row || 1) > targetRow);
        for (const param of paramsToMove) {
          await axios.patch(
            `${API_URL}/api/parameters/form-parameters/${param.id}/update_grid_position/`,
            {
              grid_row: (param.grid_row || 1) + 1,
              grid_column: param.grid_column || 1,
              grid_span: param.grid_span || 1,
            },
            {
              headers: {
                'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
              },
              withCredentials: true,
            }
          );
        }
      }
      
      // Desplazar celdas de texto que están en filas > targetRow
      if (section.grid_cells) {
        const cellsToMove = section.grid_cells.filter(cell => cell.grid_row > targetRow);
        for (const cell of cellsToMove) {
          await axios.patch(
            `${API_URL}/api/parameters/form-grid-cells/${cell.id}/`,
            {
              grid_row: cell.grid_row + 1,
              grid_column: cell.grid_column,
              grid_span: cell.grid_span,
              content: cell.content,
            },
            {
              headers: {
                'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
              },
              withCredentials: true,
            }
          );
        }
      }
      
      onSectionUpdated();
    } catch (error) {
      console.error('Error al agregar fila después:', error);
    }
  }, [section.id, section.display_config, section.form_parameters, section.grid_cells, accessToken, onSectionUpdated]);
  
  // Helper: Eliminar fila
  const deleteRow = useCallback(async (targetRow: number) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la fila ${targetRow}? Esto eliminará todos los elementos de esa fila.`)) {
      return;
    }

    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const currentConfig = section.display_config || {};
      const currentGridConfig = currentConfig.grid_config || {};
      const currentRowsColumns = currentGridConfig.rows_columns || {};
      
      // Eliminar parámetros y celdas de texto de la fila
      const paramsToDelete = section.form_parameters?.filter(param => (param.grid_row || 1) === targetRow) || [];
      const cellsToDelete = section.grid_cells?.filter(cell => cell.grid_row === targetRow) || [];
      
      // Eliminar parámetros
      for (const param of paramsToDelete) {
        await axios.delete(
          `${API_URL}/api/parameters/form-parameters/${param.id}/`,
          {
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
            withCredentials: true,
          }
        );
      }
      
      // Eliminar celdas de texto
      for (const cell of cellsToDelete) {
        await axios.delete(
          `${API_URL}/api/parameters/form-grid-cells/${cell.id}/`,
          {
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
            withCredentials: true,
          }
        );
      }
      
      // Crear nuevo objeto rows_columns con las filas desplazadas hacia arriba
      const newRowsColumns: Record<string, number> = {};
      Object.keys(currentRowsColumns).forEach(key => {
        const rowNum = Number(key);
        if (rowNum < targetRow) {
          // Filas anteriores se mantienen igual
          newRowsColumns[key] = currentRowsColumns[key];
        } else if (rowNum > targetRow) {
          // Filas posteriores se mueven una posición hacia arriba
          newRowsColumns[String(rowNum - 1)] = currentRowsColumns[key];
        }
        // La fila targetRow se elimina (no se agrega al nuevo objeto)
      });
      
      // Desplazar parámetros que están en filas > targetRow
      if (section.form_parameters) {
        const paramsToMove = section.form_parameters.filter(param => (param.grid_row || 1) > targetRow);
        for (const param of paramsToMove) {
          await axios.patch(
            `${API_URL}/api/parameters/form-parameters/${param.id}/update_grid_position/`,
            {
              grid_row: (param.grid_row || 1) - 1,
              grid_column: param.grid_column || 1,
              grid_span: param.grid_span || 1,
            },
            {
              headers: {
                'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
              },
              withCredentials: true,
            }
          );
        }
      }
      
      // Desplazar celdas de texto que están en filas > targetRow
      if (section.grid_cells) {
        const cellsToMove = section.grid_cells.filter(cell => cell.grid_row > targetRow);
        for (const cell of cellsToMove) {
          await axios.patch(
            `${API_URL}/api/parameters/form-grid-cells/${cell.id}/`,
            {
              grid_row: cell.grid_row - 1,
              grid_column: cell.grid_column,
              grid_span: cell.grid_span,
              content: cell.content,
            },
            {
              headers: {
                'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
              },
              withCredentials: true,
            }
          );
        }
      }
      
      // Actualizar display_config
      const newDisplayConfig = {
        ...currentConfig,
        grid_config: {
          ...currentGridConfig,
          rows_columns: newRowsColumns,
        },
      };
      
      await axios.patch(
        `${API_URL}/api/parameters/form-parameter-categories/${section.id}/`,
        { display_config: newDisplayConfig },
        {
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
          withCredentials: true,
        }
      );
      
      onSectionUpdated();
    } catch (error) {
      console.error('Error al eliminar fila:', error);
      alert('Error al eliminar la fila. Por favor, inténtalo de nuevo.');
    }
  }, [section.id, section.display_config, section.form_parameters, section.grid_cells, accessToken, onSectionUpdated]);
  
  // Estados para modo admin
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [gridCells, setGridCells] = useState<FormGridCell[]>(section.grid_cells || []);
  const [addTextCellModalOpen, setAddTextCellModalOpen] = useState(false);
  const [textCellInitialData, setTextCellInitialData] = useState<{ row: number; column: number; span: number; content: string } | null>(null);
  const [editingTextCell, setEditingTextCell] = useState<FormGridCell | null>(null);
  const hasGridCells = gridCells.length > 0;
  
  // Actualizar gridCells cuando cambie section
  useEffect(() => {
    if (section.grid_cells) {
      setGridCells(section.grid_cells);
    }
  }, [section.grid_cells]);

  // Sensores para drag and drop (solo modo admin)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Calcular número máximo de filas necesarias
  // Si no hay contenido (parámetros ni celdas de texto), retornar 0 para no mostrar filas vacías
  const maxRow = useMemo(() => {
    // Si no hay contenido real (parámetros o celdas), calcular maxRow solo si es modo admin
    // En modo vista/editable, no mostrar filas vacías
    if (!hasParameters && !hasGridCells) {
      // En modo admin, permitir mostrar filas definidas en display_config (para poder agregar contenido)
      if (mode === 'admin') {
        const rowsColumns = section.display_config?.grid_config?.rows_columns || {};
        const hasDefinedRows = Object.keys(rowsColumns).length > 0;
        if (hasDefinedRows) {
          // Calcular max basándose en display_config
          let max = 1;
          Object.keys(rowsColumns).forEach(key => {
            const rowNum = Number(key);
            if (rowNum > max) {
              max = rowNum;
            }
          });
          return max;
        }
      }
      // En modo vista/editable o si no hay filas definidas, retornar 0
      return 0;
    }
    
    // Si hay contenido real, calcular maxRow normalmente
    let max = 1;
    
    // Primero verificar las filas definidas en display_config
    const rowsColumns = section.display_config?.grid_config?.rows_columns || {};
    Object.keys(rowsColumns).forEach(key => {
      const rowNum = Number(key);
      if (rowNum > max) {
        max = rowNum;
      }
    });
    
    // Luego verificar parámetros
    if (hasParameters) {
      section.form_parameters?.forEach(param => {
        if (param.grid_row && param.grid_row > max) {
          max = param.grid_row;
        }
      });
    }
    
    // Finalmente verificar celdas de texto
    gridCells.forEach(cell => {
      if (cell.grid_row > max) {
        max = cell.grid_row;
      }
    });
    
    return max;
  }, [section.form_parameters, section.display_config, gridCells, hasParameters, hasGridCells, mode]);

  // Organizar celdas en grilla (modo admin) - ahora usando columnas por fila
  const gridLayout = useMemo(() => {
    // Estructura: Record<row, Record<col, cell | null>>
    const grid: Record<number, Record<number, FormParameter | FormGridCell | null>> = {};
    
    // Inicializar grilla con columnas por fila
    for (let r = 1; r <= maxRow; r++) {
      const cols = getColumnsForRow(r);
      grid[r] = {};
      for (let c = 1; c <= cols; c++) {
        grid[r][c] = null;
      }
    }
    
    // Colocar parámetros
    if (hasParameters) {
      section.form_parameters?.forEach(param => {
        const row = param.grid_row || 1;
        const col = param.grid_column || 1;
        const span = param.grid_span || 1;
        const maxCols = getColumnsForRow(row);
        
        if (row <= maxRow && col <= maxCols) {
          // Solo colocar si la posición está libre o si es el mismo parámetro
          if (!grid[row][col] || (grid[row][col] as any).__isParameter === true) {
            grid[row][col] = { ...param, __isParameter: true } as any;
            // Marcar las columnas adicionales como ocupadas
            for (let i = 1; i < span && col + i <= maxCols; i++) {
              grid[row][col + i] = { __occupied: true } as any;
            }
          }
        }
      });
    }
    
    // Colocar celdas de texto (tienen prioridad si hay conflicto - se sobrescriben)
    gridCells.forEach(cell => {
      const row = cell.grid_row;
      const col = cell.grid_column;
      const span = cell.grid_span;
      const maxCols = getColumnsForRow(row);
      
      if (row <= maxRow && col <= maxCols) {
        // Las celdas de texto pueden sobrescribir parámetros si están en la misma posición
        // Esto puede pasar por errores de datos, pero preferimos mostrar el texto
        grid[row][col] = { ...cell, __isParameter: false } as any;
        // Marcar las columnas adicionales como ocupadas
        for (let i = 1; i < span && col + i <= maxCols; i++) {
          grid[row][col + i] = { __occupied: true } as any;
        }
      }
    });
    
    return grid;
  }, [section.form_parameters, gridCells, maxRow, getColumnsForRow, hasParameters]);

  // Helper: Determinar si una celda es un parámetro basándose en sus propiedades
  const isCellParameter = useCallback((cell: FormParameter | FormGridCell): boolean => {
    // FormParameter tiene 'parameter_definition', FormGridCell tiene 'content'
    const hasParameterDefinition = 'parameter_definition' in cell;
    const hasContent = 'content' in cell && typeof (cell as FormGridCell).content === 'string';
    // Si tiene content, es una celda de texto. Si tiene parameter_definition y no content, es un parámetro.
    return hasParameterDefinition && !hasContent;
  }, []);

  // Obtener todas las celdas (parámetros + texto) para drag and drop
  const allCells = useMemo(() => {
    const cells: (FormParameter | FormGridCell)[] = [];
    if (hasParameters) {
      section.form_parameters?.forEach(param => {
        cells.push(param);
      });
    }
    gridCells.forEach(cell => {
      cells.push(cell);
    });
    return cells;
  }, [section.form_parameters, gridCells, hasParameters]);

  // Handlers para drag and drop (modo admin)
  const handleDragStart = (event: DragStartEvent) => {
    const activeIdStr = event.active.id as string;
    setActiveId(activeIdStr);
    
    // Obtener la fila de la celda que se está arrastrando
    const activeCell = allCells.find(cell => {
      const isParam = isCellParameter(cell);
      const cellId = `cell-${isParam ? 'param' : 'text'}-${cell.id}`;
      return cellId === activeIdStr;
    });
    
    if (activeCell) {
      const isParam = isCellParameter(activeCell);
      const row = isParam 
        ? (activeCell as FormParameter).grid_row || 1 
        : (activeCell as FormGridCell).grid_row;
      setActiveRow(row);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Este handler permite dar feedback visual, pero la validación real
    // se hace en handleDragEnd para prevenir el movimiento entre filas
    // En dnd-kit, no podemos "bloquear" el drop aquí directamente,
    // pero podemos usar esto para cambios visuales si es necesario
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveRow(null);
    
    if (!over || active.id === over.id || mode !== 'admin') return;
    
    // Obtener información de la celda arrastrada
    const activeCell = allCells.find(cell => {
      const isParam = isCellParameter(cell);
      const cellId = `cell-${isParam ? 'param' : 'text'}-${cell.id}`;
      return cellId === active.id;
    });
    
    if (!activeCell) return;
    
    // Obtener la fila original de la celda arrastrada
    const isParameter = isCellParameter(activeCell);
    const originalRow = isParameter 
      ? (activeCell as FormParameter).grid_row || 1 
      : (activeCell as FormGridCell).grid_row;
    
    // Obtener información del drop target
    // Si over.id es una celda existente, usar su posición
    // Si es una celda vacía, calcular posición desde el elemento DOM
    let newRow = 1;
    let newCol = 1;
    
    const overCell = allCells.find(cell => {
      const isParam = isCellParameter(cell);
      const cellId = `cell-${isParam ? 'param' : 'text'}-${cell.id}`;
      return cellId === over.id;
    });
    
    if (overCell) {
      // Si se soltó sobre otra celda, usar su posición
      const isParam = isCellParameter(overCell);
      newRow = isParam ? (overCell as FormParameter).grid_row || 1 : (overCell as FormGridCell).grid_row;
      newCol = isParam ? (overCell as FormParameter).grid_column || 1 : (overCell as FormGridCell).grid_column;
    } else if (over.id.toString().startsWith('empty-')) {
      // Si se soltó en una celda vacía, extraer posición del ID
      const match = over.id.toString().match(/empty-(\d+)-(\d+)/);
      if (match) {
        newRow = Number(match[1]);
        newCol = Number(match[2]);
      }
    }
    
    // Restricción: solo permitir movimiento dentro de la misma fila
    if (newRow !== originalRow) {
      // No permitir mover celdas entre filas diferentes
      return;
    }
    
    // Asegurar que la posición esté dentro de los límites
    newRow = Math.max(1, Math.min(newRow, maxRow + 1));
    const maxColsForRow = getColumnsForRow(newRow);
    newCol = Math.max(1, Math.min(newCol, maxColsForRow));
    
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      
      const isParameter = isCellParameter(activeCell);
      
      if (isParameter) {
        // Es un parámetro
        const param = activeCell as FormParameter;
        await axios.patch(
          `${API_URL}/api/parameters/form-parameters/${param.id}/update_grid_position/`,
          {
            grid_row: newRow,
            grid_column: newCol,
            grid_span: param.grid_span || 1,
          },
          {
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
            withCredentials: true,
          }
        );
      } else {
        // Es una celda de texto
        const cell = activeCell as FormGridCell;
        await axios.patch(
          `${API_URL}/api/parameters/form-grid-cells/${cell.id}/`,
          {
            grid_row: newRow,
            grid_column: newCol,
            grid_span: cell.grid_span,
            content: cell.content,
          },
          {
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
            withCredentials: true,
          }
        );
      }
      
      onSectionUpdated();
    } catch (error) {
      console.error('Error al actualizar posición:', error);
    }
  };

  // Handler para abrir modal de agregar celda de texto
  const handleOpenAddTextCellModal = (row: number, column: number) => {
    setTextCellInitialData({ row, column, span: 1, content: '' });
    setEditingTextCell(null);
    setAddTextCellModalOpen(true);
  };

  // Handler para abrir modal de editar celda de texto
  const handleOpenEditTextCellModal = (cell: FormGridCell) => {
    setEditingTextCell(cell);
    setTextCellInitialData(null);
    setAddTextCellModalOpen(true);
  };

  // Handler para cerrar modal de celda de texto
  const handleCloseTextCellModal = () => {
    setAddTextCellModalOpen(false);
    setEditingTextCell(null);
    setTextCellInitialData(null);
  };

  // Handler para eliminar celda
  const handleDeleteCell = useCallback(async (cell: FormParameter | FormGridCell, isParameter: boolean) => {
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      
      if (isParameter) {
        await axios.delete(
          `${API_URL}/api/parameters/form-parameters/${cell.id}/`,
          {
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
            withCredentials: true,
          }
        );
      } else {
        await axios.delete(
          `${API_URL}/api/parameters/form-grid-cells/${cell.id}/`,
          {
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
            withCredentials: true,
          }
        );
      }
      
      onSectionUpdated();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  }, [accessToken, onSectionUpdated]);

  // Renderizar la grilla base (compartida por todos los modos) - REESTRUCTURADO para columnas por fila
  // Usar useMemo para recalcular cuando cambia effectiveMode u otros dependencias
  const gridRows = useMemo(() => {
    const rows = [];
    
    // Si maxRow es 0, no renderizar ninguna fila (categoría vacía sin contenido)
    if (maxRow === 0) {
      return rows;
    }
    
    for (let r = 1; r <= maxRow; r++) {
      const rowColumns = getColumnsForRow(r);
      const rowCells = gridLayout[r] || {};
      
      rows.push(
        <GridRow
          key={`row-${r}-${effectiveMode}`} // Incluir effectiveMode en la key para forzar re-render
          row={r}
          rowColumns={rowColumns}
          rowCells={rowCells}
          mode={effectiveMode}
          maxRow={maxRow}
          activeId={activeId || ''}
          hasParameters={!!hasParameters}
          section={section}
          onAddRowBefore={addRowBefore}
          onAddRowAfter={addRowAfter}
          onDeleteRow={deleteRow}
          onUpdateDisplayConfig={updateDisplayConfig}
          onEditParameter={(param: FormParameter) => {
            setSelectedParameter(param);
            setEditParameterModalOpen(true);
          }}
          onEditTextCell={(cell: FormGridCell) => handleOpenEditTextCellModal(cell)}
          onDeleteCell={handleDeleteCell}
          onAddTextCell={handleOpenAddTextCellModal}
          onAddParameter={(row, column) => {
            setParameterInitialGridPosition({ row, column });
            setAddParameterModalOpen(true);
          }}
          values={values}
          onChange={onChange}
        />
      );
    }
    
    return rows;
  }, [effectiveMode, maxRow, gridLayout, activeId, hasParameters, section, values, onChange, addRowBefore, addRowAfter, deleteRow, updateDisplayConfig, handleDeleteCell, getColumnsForRow]);
  
  const renderGrid = () => {
    // Verificar si realmente hay contenido (parámetros o celdas de texto)
    const hasRealContent = hasParameters || hasGridCells;
    
    // Si no hay contenido real y no es modo admin, no renderizar nada
    if (!hasRealContent && mode !== 'admin') {
      return null;
    }
    
    // Si no hay filas (categoría vacía) y es tipo "general", mostrar botón para agregar primera fila
    if (maxRow === 0 && mode === 'admin' && useGridInterface) {
      return (
        <Box
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Esta sección está vacía. Agrega la primera fila para comenzar.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={async () => {
              // Crear la primera fila directamente en display_config
              try {
                const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
                const currentConfig = section.display_config || {};
                const currentGridConfig = currentConfig.grid_config || {};
                
                const newDisplayConfig = {
                  ...currentConfig,
                  grid_config: {
                    ...currentGridConfig,
                    rows_columns: {
                      '1': 3, // Primera fila con 3 columnas por defecto
                    },
                  },
                };
                
                await axios.patch(
                  `${API_URL}/api/parameters/form-parameter-categories/${section.id}/`,
                  { display_config: newDisplayConfig },
                  {
                    headers: {
                      'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
                    },
                    withCredentials: true,
                  }
                );
                
                onSectionUpdated();
              } catch (error) {
                console.error('Error al agregar primera fila:', error);
              }
            }}
          >
            Agregar Primera Fila
          </Button>
        </Box>
      );
    }
    
    // Si no hay contenido real y maxRow es 0, no renderizar contenedor
    if (!hasRealContent && maxRow === 0) {
      return null;
    }
    
    // Si hay filas pero no hay contenido real en modo vista/editable, no renderizar
    if (!hasRealContent && mode !== 'admin' && maxRow > 0) {
      return null;
    }
    
    const gridContent = (
      <Box
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
        }}
      >
        {gridRows}
      </Box>
    );

    // En modo admin, envolver con DndContext
    if (mode === 'admin') {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={allCells.map(cell => {
              const isParam = isCellParameter(cell);
              return `cell-${isParam ? 'param' : 'text'}-${cell.id}`;
            })}
            strategy={rectSortingStrategy}
          >
            {gridContent}
          </SortableContext>
          
          <DragOverlay>
            {activeId ? (() => {
              const activeCell = allCells.find(cell => {
                const isParam = isCellParameter(cell);
                const cellId = `cell-${isParam ? 'param' : 'text'}-${cell.id}`;
                return cellId === activeId;
              });
              
              if (!activeCell) return null;
              
              const isParam = isCellParameter(activeCell);
              const content = isParam
                ? (() => {
                    const param = activeCell as FormParameter;
                    const paramDef = typeof param.parameter_definition === 'object' && param.parameter_definition !== null
                      ? param.parameter_definition
                      : null;
                    return paramDef?.name || param.parameter_definition_name || 'Parámetro';
                  })()
                : (activeCell as FormGridCell).content;
              
              return (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    boxShadow: 4,
                    opacity: 0.9,
                  }}
                >
                  <Typography>{content}</Typography>
                </Box>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
      );
    }

    // En modo vista/editable, solo mostrar la grilla sin drag and drop
    return gridContent;
  };

  // Renderizar según el modo
  const renderContent = () => {
    // Si no usa interfaz de grilla y está en modo admin, mostrar mensaje
    // Pero solo si tiene un tipo definido (no mostrar mensaje si es null/undefined/vacío)
    if (mode === 'admin' && !useGridInterface && normalizedFormTypeName) {
      return (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Esta sección usa el tipo "{normalizedFormTypeName}". La interfaz personalizada para este tipo aún no está implementada.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        {/* Grilla compartida por todos los modos */}
        {renderGrid()}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        ml: level * 1,
        mb: 2,
        borderLeft: level > 0 ? '2px solid' : 'none',
        borderColor: 'divider',
        pl: level > 0 ? 1 : 0,
      }}
    >
      <Box
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {/* Botón de expandir/colapsar - Mostrar en admin, si tiene contenido, o si es sección superficies */}
          {(mode === 'admin' || hasSubcategories || hasParameters || hasGridCells || isSuperficiesSection) && (
            <IconButton
              size="small"
              onClick={async () => {
                const newExpanded = !isExpanded;
                setIsExpanded(newExpanded);
                
                // Si se está expandiendo y hay callback, cargar valores y notificar al padre
                if (newExpanded && onSectionExpand) {
                  await onSectionExpand(section.id);
                }
              }}
              sx={{ mr: 1 }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
          {mode !== 'admin' && !(hasSubcategories || hasParameters || hasGridCells || isSuperficiesSection) && <Box sx={{ width: 40, mr: 1 }} />}
          
          <Typography variant="h6" sx={{ flex: 1 }}>
            {section.number} - {section.name}
          </Typography>
          
          {isSuperficiesSection && (
            <Chip
              label="Superficies"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mr: 1 }}
            />
          )}
          {hasParameters && !isSuperficiesSection && (
            <>
              <Chip
                label={`${section.form_parameters?.length} parámetros`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mr: 1 }}
              />
              
              {/* Selector de modo Vista/Editable para categorías con parámetros (solo modo usuario final) */}
              {mode !== 'admin' && subprojectId && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, mr: 1 }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log(`[SectionTreeWithModes] Button clicked for section ${section.id}, setting to view`);
                      onSectionModeChange && onSectionModeChange(section.id, 'view');
                    }}
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      backgroundColor: effectiveMode === 'view' ? '#1976d2' : '#e0e0e0',
                      color: effectiveMode === 'view' ? 'white' : 'black',
                      border: 'none',
                      borderRadius: '4px 0 0 4px',
                      cursor: 'pointer',
                      fontWeight: effectiveMode === 'view' ? 'bold' : 'normal',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    Vista
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log(`[SectionTreeWithModes] Button clicked for section ${section.id}, setting to editable`);
                      onSectionModeChange && onSectionModeChange(section.id, 'editable');
                    }}
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      backgroundColor: effectiveMode === 'editable' ? '#1976d2' : '#e0e0e0',
                      color: effectiveMode === 'editable' ? 'white' : 'black',
                      border: 'none',
                      borderRadius: '0 4px 4px 0',
                      cursor: 'pointer',
                      fontWeight: effectiveMode === 'editable' ? 'bold' : 'normal',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    Editable
                  </button>
                </Box>
              )}
            </>
          )}

          {mode === 'admin' && (
            <>
              <Tooltip title="Editar sección">
                <IconButton
                  size="small"
                  onClick={() => {
                    setCreatingSubcategory(false); // Asegurar que no estamos creando subcategoría
                    setEditCategoryModalOpen(true);
                  }}
                  sx={{ mr: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar sección">
                <IconButton
                  size="small"
                  onClick={async () => {
                    if (window.confirm(`¿Estás seguro de que deseas eliminar la sección "${section.name}"? Esta acción no se puede deshacer.`)) {
                      try {
                        const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
                        await axios.delete(
                          `${API_URL}/api/parameters/form-parameter-categories/${section.id}/`,
                          {
                            headers: {
                              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
                            },
                            withCredentials: true,
                          }
                        );
                        onSectionUpdated();
                      } catch (error) {
                        console.error('Error al eliminar sección:', error);
                        alert('Error al eliminar la sección. Asegúrate de que no tenga subcategorías o parámetros asociados.');
                      }
                    }
                  }}
                  sx={{ mr: 0.5 }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>

        {section.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 6 }}>
            {section.description}
          </Typography>
        )}

        <Collapse in={isExpanded}>
          {/* Selector de tipo cuando la sección está vacía (modo admin) - Mostrar SOLO si form_type es undefined/null Y NO es tipo "general" */}
          {mode === 'admin' && !hasParameters && !hasSubcategories && !hasGridCells && isFormTypeUndefined && !useGridInterface && (
            <Box sx={{ mt: 2, ml: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Esta sección está vacía. Elige cómo configurarla:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Seleccionar Tipo de Categoría</InputLabel>
                  <Select
                    value=""
                    label="Seleccionar Tipo de Categoría"
                    onChange={async (e) => {
                      const formTypeId = Number(e.target.value);
                      if (formTypeId) {
                        try {
                          const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
                          await axios.patch(
                            `${API_URL}/api/parameters/form-parameter-categories/${section.id}/`,
                            { form_type: formTypeId },
                            {
                              headers: {
                                'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
                              },
                              withCredentials: true,
                            }
                          );
                          onSectionUpdated();
                        } catch (error) {
                          console.error('Error al actualizar tipo de formulario:', error);
                          alert('Error al actualizar el tipo de formulario');
                        }
                      }
                    }}
                  >
                    {formTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
          
          {/* Mostrar información del tipo si ya está seleccionado (solo si no es "general") */}
          {mode === 'admin' && normalizedFormTypeName && normalizedFormTypeName !== 'general' && (
            <Box sx={{ mt: 2, mb: 2, ml: 0 }}>
              <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Tipo: {normalizedFormTypeName}
                  {normalizedFormTypeName === 'superficies' ? (
                    <span> – En vista/editable se usa la interfaz de pestañas (Resumen, Pisos, Niveles, Polígonos).</span>
                  ) : (
                    <span> – La interfaz personalizada para este tipo aún no está implementada</span>
                  )}
                </Typography>
              </Box>
            </Box>
          )}
          
          {/* Sección superficies: pestañas Resumen / Pisos / Niveles / Polígonos */}
          {isSuperficiesSection && subprojectId && (
            <Box sx={{ mt: 2, ml: 0 }}>
              <SuperficiesSectionContent subprojectId={subprojectId} />
            </Box>
          )}

          {/* Renderizar contenido: SOLO si usa grilla (tipo "general") o si tiene contenido */}
          {/* Si es tipo "general", siempre mostrar la grilla, incluso si está vacía */}
          {!isSuperficiesSection && (useGridInterface || hasParameters || hasSubcategories || hasGridCells) ? (
            renderContent()
          ) : null}

          {/* Subcategorías (no en sección superficies) */}
          {hasSubcategories && !isSuperficiesSection && (
            <Box sx={{ mt: 2 }}>
              {section.subcategories?.map((subcategory) => (
                <SectionTreeWithModes
                  key={subcategory.id}
                  section={subcategory}
                  level={level + 1}
                  projectTypeId={projectTypeId}
                  allSections={allSections}
                  onSectionUpdated={onSectionUpdated}
                  mode={mode}
                  subprojectId={subprojectId}
                  values={values}
                  onChange={externalOnChange}
                  onSectionExpand={onSectionExpand}
                  activeSectionId={activeSectionId}
                  sectionMode={getSectionMode ? getSectionMode(subcategory.id) : undefined}
                  onSectionModeChange={onSectionModeChange}
                  getSectionMode={getSectionMode}
                />
              ))}
            </Box>
          )}

          {/* Mensaje para modo no-admin cuando está vacía (no en sección superficies) */}
          {mode !== 'admin' && !hasParameters && !hasSubcategories && !hasGridCells && !isSuperficiesSection && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 6 }}>
              Esta sección no tiene parámetros configurados.
            </Typography>
          )}

          {/* Botón para crear subsección - Siempre visible en modo admin, al final */}
          {mode === 'admin' && (
            <Box sx={{ mt: 2, ml: 0 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setCreatingSubcategory(true);
                  setEditCategoryModalOpen(true);
                }}
              >
                Crear Subsección
              </Button>
            </Box>
          )}
        </Collapse>
      </Box>

      {/* Modales */}
      <EditFormParameterCategoryModal
        open={editCategoryModalOpen}
        onClose={() => {
          setEditCategoryModalOpen(false);
          setCreatingSubcategory(false);
        }}
        onSuccess={() => {
          onSectionUpdated();
          setCreatingSubcategory(false);
        }}
        category={creatingSubcategory ? null : section} // null para crear subcategoría, section para editar
        projectTypeId={projectTypeId}
        parentCategories={allSections}
        defaultParentId={creatingSubcategory ? section.id : undefined} // Establecer esta sección como padre solo al crear subcategoría
        blockFormTypeChange={!!section.form_type && !creatingSubcategory} // Bloquear cambio si ya tiene tipo y no estamos creando subcategoría
      />

        <AddFormParameterModal
          open={addParameterModalOpen}
          onClose={() => {
            setAddParameterModalOpen(false);
            setParameterInitialGridPosition(null);
          }}
          onSuccess={onSectionUpdated}
          categoryId={section.id}
          projectTypeId={projectTypeId}
          initialGridPosition={parameterInitialGridPosition}
        />

      <EditFormParameterModal
        open={editParameterModalOpen}
        onClose={() => {
          setEditParameterModalOpen(false);
          setSelectedParameter(null);
        }}
        onSuccess={onSectionUpdated}
        parameter={selectedParameter}
        projectTypeId={projectTypeId}
      />

      {/* Modal para agregar/editar celda de texto */}
      <AddEditFormGridCellModal
        open={addTextCellModalOpen}
        onClose={handleCloseTextCellModal}
        onSuccess={onSectionUpdated}
        categoryId={section.id}
        maxRow={maxRow}
        initialData={textCellInitialData}
        editingCell={editingTextCell}
      />
    </Box>
  );
};

export default SectionTreeWithModes;
