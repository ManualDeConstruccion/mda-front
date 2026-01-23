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
  onChange?: (code: string, value: any) => void;
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
  // Verificar si la fila tiene contenido (solo en modo vista)
  const hasRowContent = React.useMemo(() => {
    if (mode === 'admin') {
      // En modo admin, siempre mostrar la fila
      return true;
    }
    
    // En modo vista/editable, verificar si hay al menos una celda con contenido
    for (let col = 1; col <= rowColumns; col++) {
      const cell = rowCells[col];
      if (cell && !(cell as any).__occupied) {
        return true;
      }
    }
    return false;
  }, [mode, rowCells, rowColumns]);
  
  // En modo vista, si la fila no tiene contenido, no renderizar nada
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
            // Determinar si es parámetro o celda de texto usando propiedades específicas
            // FormParameter tiene 'parameter_definition', FormGridCell tiene 'content'
            const hasParameterDefinition = 'parameter_definition' in cell;
            const hasContent = 'content' in cell && typeof (cell as FormGridCell).content === 'string';
            // Si tiene content, es una celda de texto. Si tiene parameter_definition, es un parámetro.
            // Preferir content sobre parameter_definition para evitar confusión
            const isParameter = hasParameterDefinition && !hasContent;
            
            return (
              <SortableGridCell
                key={`${isParameter ? 'param' : 'text'}-${cell.id}`}
                cell={cell}
                row={row}
                column={col}
                span={isParameter ? (cell as FormParameter).grid_span || 1 : (cell as FormGridCell).grid_span}
                isDragging={activeId === `cell-${isParameter ? 'param' : 'text'}-${cell.id}`}
                onEdit={(c) => {
                  if (isParameter) {
                    onEditParameter(c as FormParameter);
                  } else {
                    onEditTextCell(c as FormGridCell);
                  }
                }}
                onDelete={(c) => onDeleteCell(c, !!isParameter)}
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
                key={`empty-${row}-${col}`}
                id={`empty-${row}-${col}`}
                data-cell-id={`empty-${row}-${col}`}
                data-row={row}
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
          
          // En modo vista/editable, no mostrar celdas vacías
          return null;
        })}
      </Box>
    </Box>
  );
});

GridRow.displayName = 'GridRow';

export default GridRow;
