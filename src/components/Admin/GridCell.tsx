import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatNumberLocale } from '../../utils/helpers';
import { GRID_LABEL_LIGHTBLUE } from '../../utils/gridStandard';
import ParameterInput from './ParameterInput';
import type { GridCellProps, FormParameter, FormGridCell, SectionTreeMode } from '../../types/formParameters.types';

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
                      displayValue = new Date(currentValue as string | number).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
                      const date = new Date(value as string | number);
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
export const SortableGridCell = GridCell;
export default GridCell;
