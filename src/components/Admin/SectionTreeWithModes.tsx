import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import EditFormParameterCategoryModal from './EditFormParameterCategoryModal';
import AddFormParameterModal from './AddFormParameterModal';
import EditFormParameterModal from './EditFormParameterModal';
import AddEditFormGridCellModal from './AddEditFormGridCellModal';
import GridRow from './GridRow';
import ParameterInput from './ParameterInput';

// Tipos
export type SectionTreeMode = 'view' | 'editable' | 'admin';

export interface FormParameterCategory {
  id: number;
  code: string;
  number: string;
  name: string;
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
  onChange?: (code: string, value: any) => void; // Callback para cambios (modo editable)
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
  
  // Solo usar useSortable en modo admin
  const sortable = useSortable({ id: cellId, disabled: mode !== 'admin' });
  
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

  // Obtener data_type y unit del parameter_definition para modo editable/vista
  const paramDef = isParameter ? getParameterDefinition(cell as FormParameter) : null;
  const dataType = paramDef?.data_type || 'text';
  const unit = paramDef?.unit;
  
  // Obtener is_required del FormParameter
  const isRequired = isParameter ? (cell as FormParameter).is_required : false;

  // Determinar el color de fondo para celdas de texto
  const getBackgroundColor = () => {
    if (isParameter) {
      return 'background.default';
    }
    // Para celdas de texto, verificar si tienen fondo celeste definido en style
    const cellStyle = (cell as FormGridCell).style || {};
    const backgroundColor = cellStyle.backgroundColor || 'transparent';
    
    if (backgroundColor === 'lightblue') {
      return 'rgba(135, 206, 250, 0.3)'; // Celeste claro
    }
    // Si no tiene fondo celeste, no aplicar fondo
    return 'transparent';
  };

  // Determinar si es tipo título
  const isTitleType = !isParameter && ((cell as FormGridCell).style || {}).cellType === 'title';

  return (
    <Box
      ref={mode === 'admin' ? sortable.setNodeRef : undefined}
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
            {/* En modo editable, mostrar el input correspondiente */}
            {mode === 'editable' && cellCode && paramDef && onChange && (() => {
              const handleChange = onChange; // Capturar onChange para evitar error de TypeScript
              return (
                <Box sx={{ mt: 1 }}>
                  <ParameterInput
                    dataType={dataType as any}
                    value={values?.[cellCode]}
                    onChange={(newValue) => {
                      handleChange(cellCode, newValue);
                    }}
                    label={undefined} // Ya se muestra el nombre arriba
                    unit={unit}
                    required={isRequired}
                    disabled={false}
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
                      ? value.toFixed(2) 
                      : String(value);
                    if (unit) displayValue += ` ${unit}`;
                    break;
                  case 'integer':
                    displayValue = String(value);
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
        <Box sx={{ display: 'flex', gap: 0.5, mt: 'auto' }}>
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
  
  // Usar onChange externo si existe, sino usar el local
  const onChange = externalOnChange || handleLocalChange;
  const values = externalOnChange ? externalValues : localValues;
  
  // Persistir estado de expansión usando sessionStorage para evitar que se cierre al recargar
  const storageKey = `section-expanded-${section.id}`;
  const getInitialExpandedState = () => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored !== null ? stored === 'true' : level === 0;
    } catch {
      return level === 0;
    }
  };
  
  const [isExpanded, setIsExpanded] = useState(getInitialExpandedState);
  
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
  
  const hasSubcategories = section.subcategories && section.subcategories.length > 0;
  const hasParameters = section.form_parameters && section.form_parameters.length > 0;
  
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
  const maxRow = useMemo(() => {
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
  }, [section.form_parameters, section.display_config, gridCells, hasParameters]);

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
  const renderGrid = () => {
    const rows = [];
    
    for (let r = 1; r <= maxRow; r++) {
      const rowColumns = getColumnsForRow(r);
      const rowCells = gridLayout[r] || {};
      
      rows.push(
        <GridRow
          key={`row-${r}`}
          row={r}
          rowColumns={rowColumns}
          rowCells={rowCells}
          mode={mode}
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
        {rows}
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
        ml: level * 3,
        mb: 2,
        borderLeft: level > 0 ? '2px solid' : 'none',
        borderColor: 'divider',
        pl: level > 0 ? 2 : 0,
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
          {(hasSubcategories || hasParameters || hasGridCells) && (
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ mr: 1 }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
          {!(hasSubcategories || hasParameters || hasGridCells) && <Box sx={{ width: 40, mr: 1 }} />}
          
          <Typography variant="h6" sx={{ flex: 1 }}>
            {section.number} - {section.name}
          </Typography>
          
          {hasParameters && (
            <Chip
              label={`${section.form_parameters?.length} parámetros`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mr: 1 }}
            />
          )}

          {mode === 'admin' && (
            <>
              <Tooltip title="Editar sección">
                <IconButton
                  size="small"
                  onClick={() => setEditCategoryModalOpen(true)}
                  sx={{ mr: 0.5 }}
                >
                  <EditIcon fontSize="small" />
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
          {renderContent()}

          {/* Subcategorías */}
          {hasSubcategories && (
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
                  onChange={onChange}
                />
              ))}
            </Box>
          )}

          {!hasParameters && !hasSubcategories && !hasGridCells && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 6 }}>
              Esta sección no tiene parámetros configurados.
            </Typography>
          )}
        </Collapse>
      </Box>

      {/* Modales */}
      <EditFormParameterCategoryModal
        open={editCategoryModalOpen}
        onClose={() => setEditCategoryModalOpen(false)}
        onSuccess={onSectionUpdated}
        category={section}
        projectTypeId={projectTypeId}
        parentCategories={allSections}
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
