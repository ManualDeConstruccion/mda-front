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

interface GridRowProps {
  row: number;
  rowColumns: number;
  rowCells: Record<number, FormParameter | FormGridCell | null>;
  mode: SectionTreeMode;
  maxRow: number;
  activeId: string;
  hasParameters: boolean;
  section: {
    form_parameters?: FormParameter[];
  };
  onAddRowBefore: (row: number) => void;
  onAddRowAfter: (row: number) => void;
  onDeleteRow: (row: number) => void;
  onUpdateDisplayConfig: (row: number, columns: number) => void;
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
  hasParameters,
  section,
  onAddRowBefore,
  onAddRowAfter,
  onDeleteRow,
  onUpdateDisplayConfig,
  onEditParameter,
  onEditTextCell,
  onDeleteCell,
  onAddTextCell,
  onAddParameter,
  values,
  onChange,
}) => {
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
  
  if (mode === 'view' && !hasRowContent) {
    return null;
  }
  
  return (
    <Box sx={{ mb: 2 }}>
      {/* Controles de fila (solo en modo admin) */}
      {mode === 'admin' && (
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
      
      {/* Grilla de la fila: en modo admin, envolver en contenedor con scroll horizontal si las columnas no caben */}
      <Box
        sx={
          mode === 'admin'
            ? {
                overflowX: 'auto',
                overflowY: 'visible',
                // Evitar que la barra de scroll ocupe espacio extra en algunos navegadores
                scrollbarGutter: 'stable',
              }
            : undefined
        }
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'nowrap',
            width: '100%',
            gap: 2,
            minWidth: mode === 'admin' ? rowColumns * 120 : undefined,
          }}
        >
        {Array.from({ length: rowColumns }, (_, colIndex) => {
          const col = colIndex + 1;
          const cell = rowCells[col];
          
          if (cell && (cell as any).__occupied) {
            return null;
          }
          
          if (cell && !(cell as any).__occupied) {
            const isParameter = isParameterCell(cell);
            const span = isParameter
              ? (cell as FormParameter).grid_span ?? 1
              : (cell as FormGridCell).grid_span ?? 1;
            return (
              <Box
                key={`${isParameter ? 'param' : 'text'}-${cell.id}`}
                sx={{
                  flex: `${span} 0 0`,
                  minWidth: 0,
                }}
              >
                <SortableGridCell
                  cell={cell}
                  row={row}
                  column={col}
                  span={span}
                  isDragging={activeId === `cell-${isParameter ? 'param' : 'text'}-${cell.id}`}
                  onEdit={(c) => {
                    if (isParameter) onEditParameter(c as FormParameter);
                    else onEditTextCell(c as FormGridCell);
                  }}
                  onDelete={(c) => onDeleteCell(c, !!isParameter)}
                  mode={mode}
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
                  flex: '0 0 120px',
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
                }}
              >
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
