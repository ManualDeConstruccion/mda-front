import React from 'react';
import {
  Box,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DeleteIcon from '@mui/icons-material/Delete';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SettingsIcon from '@mui/icons-material/Settings';
import { 
  SortableGridCell, 
  type FormParameter, 
  type FormGridCell, 
  type SectionTreeMode,
  type FormParameterCategory 
} from './SectionTreeWithModes';

/** Espacio entre celdas (horizontal) y entre filas (vertical). Usa unidades del tema MUI (1 = 8px). */
const GRID_SPACING = 0.8;

interface GridRowProps {
  row: number;
  rowColumns: number;
  rowCells: Record<number, FormParameter | FormGridCell | null>;
  mode: SectionTreeMode;
  maxRow: number;
  activeId: string;
  /** Admin: define si esta fila es la fila activa (se muestran controles/acciones). */
  isRowActive?: boolean;
  /** Admin: activa la fila al clickear cualquier elemento de la fila. */
  onActivateRow?: (row: number) => void;
  hasParameters: boolean;
  section: {
    form_parameters?: FormParameter[];
  };
  onAddRowBefore: (row: number) => void;
  onAddRowAfter: (row: number) => void;
  onDeleteRow: (row: number) => void;
  onUpdateDisplayConfig: (row: number, columns: number) => void;
  /** Inserta un motor entre esta fila y la siguiente (solo admin). */
  onInsertEngineAfterRow?: (row: number) => void;
  onEditParameter: (param: FormParameter) => void;
  onEditTextCell: (cell: FormGridCell) => void;
  onDeleteCell: (cell: FormParameter | FormGridCell, isParameter: boolean) => Promise<void>;
  onAddTextCell: (row: number, column: number) => void;
  onAddParameter: (row: number, column: number) => void;
  values?: Record<string, any>;
  onChange?: (code: string, value: any, selectedOption?: any) => void;
}

const GridRow: React.FC<GridRowProps> = React.memo(({
  row,
  rowColumns,
  rowCells,
  mode,
  maxRow,
  activeId,
  isRowActive = false,
  onActivateRow,
  hasParameters,
  section,
  onAddRowBefore,
  onAddRowAfter,
  onDeleteRow,
  onUpdateDisplayConfig,
  onInsertEngineAfterRow,
  onEditParameter,
  onEditTextCell,
  onDeleteCell,
  onAddTextCell,
  onAddParameter,
  values,
  onChange,
}) => {
  const effectiveRowMode: SectionTreeMode = mode === 'admin' && !isRowActive ? 'view' : mode;
  const cellMode: SectionTreeMode = mode === 'admin' ? (isRowActive ? 'admin' : 'view') : mode;
  const showRowControls = mode === 'admin' && isRowActive;
  const showEmptyButtons = mode === 'admin' && isRowActive;

  const isParameterCell = React.useCallback((c: FormParameter | FormGridCell) => {
    const hasParam = 'parameter_definition' in c;
    const hasContent = 'content' in c && typeof (c as FormGridCell).content === 'string';
    return !!hasParam && !hasContent;
  }, []);

  const hasRowContent = React.useMemo(() => {
    if (mode === 'admin') return true;
    for (let col = 1; col <= rowColumns; col++) {
      const cell = rowCells[col];
      if (cell && !(cell as any).__occupied) return true;
    }
    return false;
  }, [mode, rowCells, rowColumns]);

  // Algoritmo: cada columna tiene span efectivo 1 por defecto (incl. vacías y ocupadas por span de otra).
  // factorX = totalColumnas / sumaDeSpans → redistribución flex = factorX * spanEfectivo.
  const { effectiveSpanPerCol, sumOfSpans, factorX } = React.useMemo(() => {
    const effective: Record<number, number> = {};
    let sum = 0;
    for (let col = 1; col <= rowColumns; col++) {
      const cell = rowCells[col];
      const span = cell && !(cell as any).__occupied
        ? (isParameterCell(cell) ? (cell as FormParameter).grid_span ?? 1 : (cell as FormGridCell).grid_span ?? 1)
        : 1;
      effective[col] = span;
      sum += span;
    }
    const total = Math.max(sum, 1);
    return {
      effectiveSpanPerCol: effective,
      sumOfSpans: total,
      factorX: rowColumns / total,
    };
  }, [rowCells, rowColumns, isParameterCell]);

  if (mode === 'view' && !hasRowContent) {
    return null;
  }
  
  return (
    <Box
      sx={{ mb: GRID_SPACING }}
      onClick={() => {
        onActivateRow?.(row);
      }}
    >
      {/* Controles de fila (solo en modo admin) */}
      {showRowControls && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<KeyboardArrowUpIcon />}
            onClick={() => onAddRowBefore(row)}
          >
            Agregar fila antes
          </Button>
          <Chip 
            label={`Fila ${row}`} 
            size="small" 
            sx={{ minWidth: 70, fontWeight: 'medium' }}
          />
          {onInsertEngineAfterRow && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => onInsertEngineAfterRow(row)}
            >
              Insertar motor aquí
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<KeyboardArrowDownIcon />}
            onClick={() => onAddRowAfter(row)}
          >
            Agregar fila después
          </Button>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Columnas</InputLabel>
            <Select
              value={rowColumns}
              label="Columnas"
              onChange={(e) => onUpdateDisplayConfig(row, Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <MenuItem key={num} value={num}>{num}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => onDeleteRow(row)}
          >
            Eliminar fila
          </Button>
        </Box>
      )}
      
      {/* Grilla de la fila: las columnas siempre caben en el ancho disponible (flex reparte el espacio) */}
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'nowrap',
            width: '100%',
            minWidth: 0,
            gap: GRID_SPACING,
            alignItems: effectiveRowMode === 'view' ? 'stretch' : undefined,
          }}
        >
        {Array.from({ length: rowColumns }, (_, colIndex) => {
          const col = colIndex + 1;
          const cell = rowCells[col];
          const effectiveSpan = effectiveSpanPerCol[col] ?? 1;
          const flexValue = factorX * effectiveSpan;
          
          if (cell && (cell as any).__occupied) {
            return (
              <Box
                key={`occupied-${row}-${col}`}
                sx={{
                  flex: `${flexValue} 0 0`,
                  minWidth: 0,
                  minHeight: mode === 'admin' ? 48 : 0,
                }}
              />
            );
          }
          
          if (cell && !(cell as any).__occupied) {
            const isParameter = isParameterCell(cell);
            const span = isParameter
              ? (cell as FormParameter).grid_span ?? 1
              : (cell as FormGridCell).grid_span ?? 1;
            const spanPercent = effectiveRowMode === 'admin'
              ? Math.round((effectiveSpan / sumOfSpans) * 100)
              : undefined;
            return (
              <Box
                key={`${isParameter ? 'param' : 'text'}-${cell.id}`}
                sx={{
                  flex: `${flexValue} 0 0`,
                  minWidth: 0,
                  ...(effectiveRowMode === 'view' && { display: 'flex', minHeight: 0 }),
                }}
              >
                <SortableGridCell
                  cell={cell}
                  row={row}
                  column={col}
                  span={span}
                  spanPercent={spanPercent}
                  isDragging={activeId === `cell-${isParameter ? 'param' : 'text'}-${cell.id}`}
                  onEdit={(c) => {
                    if (isParameter) onEditParameter(c as FormParameter);
                    else onEditTextCell(c as FormGridCell);
                  }}
                  onDelete={(c) => onDeleteCell(c, !!isParameter)}
                  mode={cellMode}
                  isParameter={!!isParameter}
                  values={values}
                  onChange={onChange}
                />
              </Box>
            );
          }
          
          if (mode === 'admin') {
            return (
              <Box
                key={`empty-${row}-${col}`}
                id={`empty-${row}-${col}`}
                data-cell-id={`empty-${row}-${col}`}
                data-row={row}
                data-column={col}
                sx={{
                  flex: `${flexValue} 0 0`,
                  minWidth: 0,
                  minHeight: '48px',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  p: 1,
                  opacity: showEmptyButtons ? 1 : 0.7,
                }}
              >
                {showEmptyButtons && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<TextFieldsIcon />}
                      onClick={() => onAddTextCell(row, col)}
                    >
                      Agregar Texto
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={() => onAddParameter(row, col)}
                    >
                      Agregar Parámetro
                    </Button>
                  </>
                )}
              </Box>
            );
          }
          
          return null;
        })}
        </Box>
      </Box>
    </Box>
  );
});

GridRow.displayName = 'GridRow';

export default GridRow;
