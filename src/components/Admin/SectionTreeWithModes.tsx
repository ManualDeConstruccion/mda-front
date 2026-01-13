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
  maxColumns: number;
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
  maxColumns,
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

  const cellContent = isParameter
    ? (cell as FormParameter).parameter_definition?.name || (cell as FormParameter).parameter_definition_name || 'Parámetro'
    : (cell as FormGridCell).content;

  const cellCode = isParameter
    ? (cell as FormParameter).parameter_definition?.code || (cell as FormParameter).parameter_definition_code
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
  
  // Calcular número máximo de columnas usado inicialmente
  const calculateInitialMaxColumns = () => {
    let max = 1;
    if (hasParameters) {
      section.form_parameters?.forEach(param => {
        const col = param.grid_column || 1;
        const span = param.grid_span || 1;
        if (col + span - 1 > max) {
          max = col + span - 1;
        }
      });
    }
    if (section.grid_cells) {
      section.grid_cells.forEach(cell => {
        if (cell.grid_column + cell.grid_span - 1 > max) {
          max = cell.grid_column + cell.grid_span - 1;
        }
      });
    }
    return Math.min(Math.max(max, 1), 5); // Entre 1 y 5
  };
  
  // Estados para modo admin
  const [maxColumns, setMaxColumns] = useState(calculateInitialMaxColumns);
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
    // Recalcular maxColumns si es necesario
    const newMax = calculateInitialMaxColumns();
    if (newMax > maxColumns) {
      setMaxColumns(newMax);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.grid_cells, section.form_parameters]);

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

  // Organizar celdas en grilla (modo admin)
  const gridLayout = useMemo(() => {
    const grid: (FormParameter | FormGridCell | null)[][] = [];
    
    // Inicializar grilla
    for (let r = 1; r <= maxRow; r++) {
      grid[r - 1] = new Array(maxColumns).fill(null);
    }
    
    // Colocar parámetros
    if (hasParameters) {
      section.form_parameters?.forEach(param => {
        const row = param.grid_row || 1;
        const col = param.grid_column || 1;
        const span = param.grid_span || 1;
        
        if (row <= maxRow && col <= maxColumns) {
          // Solo marcar la primera columna con el objeto, las demás con un marcador
          if (grid[row - 1]) {
            grid[row - 1][col - 1] = param;
            // Marcar las columnas adicionales como ocupadas (pero no duplicar el objeto)
            for (let i = 1; i < span && col + i <= maxColumns; i++) {
              grid[row - 1][col - 1 + i] = { __occupied: true } as any;
            }
          }
        }
      });
    }
    
    // Colocar celdas de texto
    gridCells.forEach(cell => {
      const row = cell.grid_row;
      const col = cell.grid_column;
      const span = cell.grid_span;
      
      if (row <= maxRow && col <= maxColumns) {
        if (grid[row - 1]) {
          grid[row - 1][col - 1] = cell;
          // Marcar las columnas adicionales como ocupadas
          for (let i = 1; i < span && col + i <= maxColumns; i++) {
            grid[row - 1][col - 1 + i] = { __occupied: true } as any;
          }
        }
      }
    });
    
    return grid;
  }, [section.form_parameters, gridCells, maxRow, maxColumns, hasParameters]);

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
    newCol = Math.max(1, Math.min(newCol, maxColumns));
    
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

  // Renderizar la grilla base (compartida por todos los modos)
  const renderGrid = () => {
    const gridContent = (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${maxColumns}, 1fr)`,
          gap: 2,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
        }}
      >
        {Array.from({ length: maxRow }, (_, rowIndex) => {
          const row = rowIndex + 1;
          return Array.from({ length: maxColumns }, (_, colIndex) => {
            const col = colIndex + 1;
            const cell = gridLayout[rowIndex]?.[colIndex];
            
            // Si la celda está ocupada por un span, no renderizar
            if (cell && (cell as any).__occupied) {
              return null;
            }
            
            // Si hay una celda real en esta posición
            if (cell && !(cell as any).__occupied) {
              const isParameter = hasParameters && section.form_parameters?.some(p => p.id === (cell as FormParameter).id);
              const actualCol = isParameter 
                ? (cell as FormParameter).grid_column || 1
                : (cell as FormGridCell).grid_column;
              
              // Solo renderizar en la primera columna de cada celda
              if (col === actualCol) {
                const span = isParameter
                  ? (cell as FormParameter).grid_span || 1
                  : (cell as FormGridCell).grid_span;
                
                return (
                  <SortableGridCell
                    key={`${isParameter ? 'param' : 'text'}-${cell.id}`}
                    cell={cell}
                    row={row}
                    column={col}
                    span={span}
                    maxColumns={maxColumns}
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
                    isParameter={isParameter}
                    values={values}
                    onChange={onChange}
                  />
                );
              }
              return null;
            }
            
            // Celda vacía (solo mostrar en modo admin)
            if (mode === 'admin') {
              return (
                <Box
                  key={`empty-${row}-${col}`}
                  data-cell-id={`empty-${row}-${col}`}
                  data-row={row}
                  data-column={col}
                  sx={{
                    minHeight: '80px',
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                  }}
                >
                  Soltar aquí
                </Box>
              );
            }
            
            // En modo vista/editable, no mostrar celdas vacías
            return null;
          });
        })}
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
            {activeId ? (
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
                {allCells.find(cell => {
                  const cellId = `cell-${hasParameters && section.form_parameters?.some(p => p.id === (cell as FormParameter).id) ? 'param' : 'text'}-${cell.id}`;
                  return cellId === activeId;
                }) && (
                  <Typography>
                    {hasParameters && section.form_parameters?.some(p => p.id === (allCells.find(c => {
                      const cid = `cell-${hasParameters && section.form_parameters?.some(p2 => p2.id === (c as FormParameter).id) ? 'param' : 'text'}-${c.id}`;
                      return cid === activeId;
                    }) as FormParameter)?.id) 
                      ? (allCells.find(c => {
                          const cid = `cell-${hasParameters && section.form_parameters?.some(p2 => p2.id === (c as FormParameter).id) ? 'param' : 'text'}-${c.id}`;
                          return cid === activeId;
                        }) as FormParameter)?.parameter_definition?.name
                      : (allCells.find(c => {
                          const cid = `cell-${hasParameters && section.form_parameters?.some(p2 => p2.id === (c as FormParameter).id) ? 'param' : 'text'}-${c.id}`;
                          return cid === activeId;
                        }) as FormGridCell)?.content}
                  </Typography>
                )}
              </Box>
            ) : null}
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
        {/* Controles solo en modo admin */}
        {mode === 'admin' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Columnas</InputLabel>
              <Select
                value={maxColumns}
                label="Columnas"
                onChange={(e) => setMaxColumns(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <MenuItem key={num} value={num}>{num}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAddTextCellModalOpen(true)}
            >
              Agregar Texto
            </Button>
            
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAddParameterModalOpen(true)}
            >
              Agregar Parámetro
            </Button>
          </Box>
        )}

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
              inputProps={{ min: 1, max: maxColumns }}
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
              inputProps={{ min: 1, max: maxColumns }}
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
