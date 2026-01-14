import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  Chip,
  Tooltip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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

// Tipos
type SectionTreeMode = 'view' | 'editable' | 'admin';

interface FormParameterCategory {
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

interface FormGridCell {
  id: number;
  category: number;
  grid_row: number;
  grid_column: number;
  grid_span: number;
  content: string;
  style?: any;
  order: number;
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
interface GridCellProps {
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

  return (
    <Box
      ref={mode === 'admin' ? sortable.setNodeRef : undefined}
      style={style}
      {...(mode === 'admin' ? sortable.attributes : {})}
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        borderRadius: 1,
        bgcolor: isParameter ? 'background.default' : 'info.light',
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
      
      <Box sx={{ flex: 1, ml: mode === 'admin' ? 4 : 0 }}>
        {isParameter ? (
          <>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
              {cellContent}
            </Typography>
            {cellCode && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Código: {cellCode}
              </Typography>
            )}
            {/* En modo editable, aquí iría el campo de entrada */}
            {mode === 'editable' && cellCode && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Campo editable - En desarrollo
                </Typography>
              </Box>
            )}
            {/* En modo vista, mostrar solo el valor si existe */}
            {mode === 'view' && cellCode && values && values[cellCode] !== undefined && (
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                {String(values[cellCode])}
              </Typography>
            )}
          </>
        ) : (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontStyle: mode === 'view' ? 'normal' : 'italic',
            }}
          >
            {cellContent}
          </Typography>
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

// Componente principal
const SectionTreeWithModes: React.FC<SectionTreeWithModesProps> = ({
  section,
  level,
  projectTypeId,
  allSections,
  onSectionUpdated,
  mode = 'view',
  subprojectId,
  values = {},
  onChange,
}) => {
  const { accessToken } = useAuth();
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [addParameterModalOpen, setAddParameterModalOpen] = useState(false);
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
      console.error('Error al agregar fila antes:', error);
    }
  }, [section.id, section.display_config, accessToken, onSectionUpdated]);
  
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
      console.error('Error al agregar fila después:', error);
    }
  }, [section.id, section.display_config, accessToken, onSectionUpdated]);
  
  // Estados para modo admin
  const [activeId, setActiveId] = useState<string | null>(null);
  const [gridCells, setGridCells] = useState<FormGridCell[]>(section.grid_cells || []);
  const [addTextCellModalOpen, setAddTextCellModalOpen] = useState(false);
  const [newTextCell, setNewTextCell] = useState({ row: 1, column: 1, span: 1, content: '' });
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
    if (hasParameters) {
      section.form_parameters?.forEach(param => {
        if (param.grid_row && param.grid_row > max) {
          max = param.grid_row;
        }
      });
    }
    gridCells.forEach(cell => {
      if (cell.grid_row > max) {
        max = cell.grid_row;
      }
    });
    return max;
  }, [section.form_parameters, gridCells, hasParameters]);

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
          grid[row][col] = param;
          // Marcar las columnas adicionales como ocupadas
          for (let i = 1; i < span && col + i <= maxCols; i++) {
            grid[row][col + i] = { __occupied: true } as any;
          }
        }
      });
    }
    
    // Colocar celdas de texto
    gridCells.forEach(cell => {
      const row = cell.grid_row;
      const col = cell.grid_column;
      const span = cell.grid_span;
      const maxCols = getColumnsForRow(row);
      
      if (row <= maxRow && col <= maxCols) {
        grid[row][col] = cell;
        // Marcar las columnas adicionales como ocupadas
        for (let i = 1; i < span && col + i <= maxCols; i++) {
          grid[row][col + i] = { __occupied: true } as any;
        }
      }
    });
    
    return grid;
  }, [section.form_parameters, gridCells, maxRow, getColumnsForRow, hasParameters]);

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
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over || active.id === over.id || mode !== 'admin') return;
    
    // Obtener información de la celda arrastrada
    const activeCell = allCells.find(cell => {
      const cellId = `cell-${hasParameters && section.form_parameters?.some(p => p.id === (cell as FormParameter).id) ? 'param' : 'text'}-${cell.id}`;
      return cellId === active.id;
    });
    
    if (!activeCell) return;
    
    // Obtener información del drop target
    // Si over.id es una celda existente, usar su posición
    // Si es una celda vacía, calcular posición desde el elemento DOM
    let newRow = 1;
    let newCol = 1;
    
    const overCell = allCells.find(cell => {
      const isParam = hasParameters && section.form_parameters?.some(p => p.id === (cell as FormParameter).id);
      const cellId = `cell-${isParam ? 'param' : 'text'}-${cell.id}`;
      return cellId === over.id;
    });
    
    if (overCell) {
      // Si se soltó sobre otra celda, usar su posición
      const isParam = hasParameters && section.form_parameters?.some(p => p.id === (overCell as FormParameter).id);
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
    
    // Asegurar que la posición esté dentro de los límites
    newRow = Math.max(1, Math.min(newRow, maxRow + 1));
    const maxColsForRow = getColumnsForRow(newRow);
    newCol = Math.max(1, Math.min(newCol, maxColsForRow));
    
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      
      const isParameter = hasParameters && section.form_parameters?.some(p => p.id === (activeCell as FormParameter).id);
      
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

  // Agregar nueva fila (modo admin)
  const handleAddRow = () => {
    // Las filas se agregan automáticamente cuando se colocan elementos en ellas
    // Este handler puede usarse para otras acciones si es necesario
  };

  // Agregar celda de texto (modo admin)
  const handleAddTextCell = async () => {
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      
      await axios.post(
        `${API_URL}/api/parameters/form-grid-cells/`,
        {
          category: section.id,
          grid_row: newTextCell.row,
          grid_column: newTextCell.column,
          grid_span: newTextCell.span,
          content: newTextCell.content,
          order: 0,
          is_active: true,
        },
        {
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
          withCredentials: true,
        }
      );
      
      setAddTextCellModalOpen(false);
      setNewTextCell({ row: 1, column: 1, span: 1, content: '' });
      onSectionUpdated();
    } catch (error) {
      console.error('Error al crear celda de texto:', error);
    }
  };

  // Renderizar la grilla base (compartida por todos los modos) - REESTRUCTURADO para columnas por fila
  const renderGrid = () => {
    const rows = [];
    
    for (let r = 1; r <= maxRow; r++) {
      const rowColumns = getColumnsForRow(r);
      const rowCells = gridLayout[r] || {};
      
      rows.push(
        <Box key={`row-${r}`} sx={{ mb: 2 }}>
          {/* Controles de fila (solo en modo admin) */}
          {mode === 'admin' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <IconButton
                size="small"
                onClick={() => addRowBefore(r)}
                title="Agregar fila antes"
              >
                <KeyboardArrowUpIcon fontSize="small" />
              </IconButton>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Columnas</InputLabel>
                <Select
                  value={rowColumns}
                  label="Columnas"
                  onChange={(e) => updateDisplayConfig(r, Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <MenuItem key={num} value={num}>{num}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                size="small"
                onClick={() => addRowAfter(r)}
                title="Agregar fila después"
              >
                <KeyboardArrowDownIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          
          {/* Grilla de la fila */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${rowColumns}, 1fr)`,
              gap: 2,
            }}
          >
            {Array.from({ length: rowColumns }, (_, colIndex) => {
              const col = colIndex + 1;
              const cell = rowCells[col];
              
              // Si la celda está ocupada por un span, no renderizar
              if (cell && (cell as any).__occupied) {
                return null;
              }
              
              // Si hay una celda real en esta posición
              if (cell && !(cell as any).__occupied) {
                const isParameter = hasParameters && section.form_parameters?.some(p => p.id === (cell as FormParameter).id);
                
                return (
                  <SortableGridCell
                    key={`${isParameter ? 'param' : 'text'}-${cell.id}`}
                    cell={cell}
                    row={r}
                    column={col}
                    span={isParameter ? (cell as FormParameter).grid_span || 1 : (cell as FormGridCell).grid_span}
                    isDragging={activeId === `cell-${isParameter ? 'param' : 'text'}-${cell.id}`}
                    onEdit={(c) => {
                      if (isParameter) {
                        setSelectedParameter(c as FormParameter);
                        setEditParameterModalOpen(true);
                      } else {
                        setEditingTextCell(c as FormGridCell);
                        setAddTextCellModalOpen(true);
                      }
                    }}
                    onDelete={async (c) => {
                      try {
                        const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
                        
                        if (isParameter) {
                          await axios.delete(
                            `${API_URL}/api/parameters/form-parameters/${c.id}/`,
                            {
                              headers: {
                                'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
                              },
                              withCredentials: true,
                            }
                          );
                        } else {
                          await axios.delete(
                            `${API_URL}/api/parameters/form-grid-cells/${c.id}/`,
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
                    }}
                    mode={mode}
                    isParameter={!!isParameter}
                    values={values}
                    onChange={onChange}
                  />
                );
              }
              
              // Celda vacía
              if (mode === 'admin') {
                return (
                  <Box
                    key={`empty-${r}-${col}`}
                    id={`empty-${r}-${col}`}
                    data-cell-id={`empty-${r}-${col}`}
                    data-row={r}
                    data-column={col}
                    sx={{
                      minHeight: '80px',
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      p: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                      Soltar aquí
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<TextFieldsIcon />}
                      onClick={() => {
                        setNewTextCell({ row: r, column: col, span: 1, content: '' });
                        setAddTextCellModalOpen(true);
                      }}
                    >
                      Agregar Texto
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={() => {
                        setAddParameterModalOpen(true);
                      }}
                    >
                      Agregar Parámetro
                    </Button>
                  </Box>
                );
              }
              
              // En modo vista/editable, no mostrar celdas vacías
              return null;
            })}
          </Box>
        </Box>
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
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={allCells.map(cell => {
              const isParam = hasParameters && section.form_parameters?.some(p => p.id === (cell as FormParameter).id);
              return `cell-${isParam ? 'param' : 'text'}-${cell.id}`;
            })}
            strategy={rectSortingStrategy}
          >
            {gridContent}
          </SortableContext>
          
          <DragOverlay>
            {activeId ? (() => {
              const activeCell = allCells.find(cell => {
                const cellId = `cell-${hasParameters && section.form_parameters?.some(p => p.id === (cell as FormParameter).id) ? 'param' : 'text'}-${cell.id}`;
                return cellId === activeId;
              });
              
              if (!activeCell) return null;
              
              const isParam = hasParameters && section.form_parameters?.some(p => p.id === (activeCell as FormParameter).id);
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
      <Box sx={{ mt: 2, ml: 6 }}>
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
        onClose={() => setAddParameterModalOpen(false)}
        onSuccess={onSectionUpdated}
        categoryId={section.id}
        projectTypeId={projectTypeId}
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
      <Dialog
        open={addTextCellModalOpen}
        onClose={() => {
          setAddTextCellModalOpen(false);
          setEditingTextCell(null);
          setNewTextCell({ row: 1, column: 1, span: 1, content: '' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTextCell ? 'Editar Celda de Texto' : 'Agregar Celda de Texto'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Fila"
              type="number"
              value={editingTextCell?.grid_row || newTextCell.row}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (editingTextCell) {
                  setEditingTextCell({ ...editingTextCell, grid_row: val });
                } else {
                  setNewTextCell({ ...newTextCell, row: val });
                }
              }}
              inputProps={{ min: 1, max: maxRow + 10 }}
              fullWidth
            />
            <TextField
              label="Columna"
              type="number"
              value={editingTextCell?.grid_column || newTextCell.column}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (editingTextCell) {
                  setEditingTextCell({ ...editingTextCell, grid_column: val });
                } else {
                  setNewTextCell({ ...newTextCell, column: val });
                }
              }}
              inputProps={{ min: 1, max: 5 }}
              fullWidth
            />
            <TextField
              label="Ancho (columnas)"
              type="number"
              value={editingTextCell?.grid_span || newTextCell.span}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (editingTextCell) {
                  setEditingTextCell({ ...editingTextCell, grid_span: val });
                } else {
                  setNewTextCell({ ...newTextCell, span: val });
                }
              }}
              inputProps={{ min: 1, max: 5 }}
              fullWidth
            />
            <TextField
              label="Contenido"
              multiline
              rows={4}
              value={editingTextCell?.content || newTextCell.content}
              onChange={(e) => {
                if (editingTextCell) {
                  setEditingTextCell({ ...editingTextCell, content: e.target.value });
                } else {
                  setNewTextCell({ ...newTextCell, content: e.target.value });
                }
              }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddTextCellModalOpen(false);
              setEditingTextCell(null);
              setNewTextCell({ row: 1, column: 1, span: 1, content: '' });
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (editingTextCell) {
                try {
                  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
                  
                  await axios.patch(
                    `${API_URL}/api/parameters/form-grid-cells/${editingTextCell.id}/`,
                    {
                      grid_row: editingTextCell.grid_row,
                      grid_column: editingTextCell.grid_column,
                      grid_span: editingTextCell.grid_span,
                      content: editingTextCell.content,
                    },
                    {
                      headers: {
                        'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
                      },
                      withCredentials: true,
                    }
                  );
                  
                  setAddTextCellModalOpen(false);
                  setEditingTextCell(null);
                  onSectionUpdated();
                } catch (error) {
                  console.error('Error al actualizar celda de texto:', error);
                }
              } else {
                await handleAddTextCell();
              }
            }}
            variant="contained"
          >
            {editingTextCell ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SectionTreeWithModes;
