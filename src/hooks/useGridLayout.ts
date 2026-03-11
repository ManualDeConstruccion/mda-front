import { useMemo, useCallback } from 'react';
import type {
  FormParameterCategory,
  FormParameter,
  FormGridCell,
  SectionTreeMode,
} from '../types/formParameters.types';

/**
 * Calcula maxRow, gridLayout, allCells, getColumnsForRow y helpers para la grilla
 * de una sección (parámetros + celdas de texto).
 *
 * Ancho de celdas: cada celda tiene grid_span (1-8 columnas). El ancho NO está
 * en style; style solo tiene textAlign, backgroundColor, fontWeight, cellType.
 * getColumnsForRow(row) devuelve el número de columnas de la fila (1-8): primero
 * display_config.grid_config.rows_columns[row], si no se infiere del contenido.
 */
export function useGridLayout(
  section: FormParameterCategory,
  gridCells: FormGridCell[],
  mode: SectionTreeMode
) {
  const hasParameters = !!(section.form_parameters && section.form_parameters.length > 0);
  const hasGridCells = gridCells.length > 0;

  const getColumnsForRow = useCallback((row: number): number => {
    const rowsColumns = section.display_config?.grid_config?.rows_columns || {};
    const rowKey = String(row);
    const blockId = gridCells.length > 0 ? (gridCells[0] as FormGridCell).block : undefined;
    let requiredByContent = 1;
    if (hasParameters && section.form_parameters) {
      section.form_parameters.forEach(param => {
        if (param.grid_row !== row) return;
        if (blockId != null && (param as FormParameter & { block?: number }).block !== blockId) return;
        const col = param.grid_column || 1;
        const span = param.grid_span || 1;
        if (col + span - 1 > requiredByContent) {
          requiredByContent = col + span - 1;
        }
      });
    }
    gridCells.forEach(cell => {
      if (cell.grid_row !== row) return;
      if (cell.grid_column + cell.grid_span - 1 > requiredByContent) {
        requiredByContent = cell.grid_column + cell.grid_span - 1;
      }
    });
    const configured = rowsColumns[rowKey] != null && rowsColumns[rowKey] !== ''
      ? Number(rowsColumns[rowKey])
      : null;
    const cols = configured != null
      ? configured
      : requiredByContent;
    return Math.min(Math.max(cols, 1), 8);
  }, [section.display_config, section.form_parameters, gridCells, hasParameters]);

  const maxRow = useMemo(() => {
    if (!hasParameters && !hasGridCells) {
      if (mode === 'admin') {
        const rowsColumns = section.display_config?.grid_config?.rows_columns || {};
        const hasDefinedRows = Object.keys(rowsColumns).length > 0;
        if (hasDefinedRows) {
          let max = 1;
          Object.keys(rowsColumns).forEach(key => {
            const rowNum = Number(key);
            if (rowNum > max) max = rowNum;
          });
          return max;
        }
        // Bloque/sección vacía en admin: mostrar al menos 1 fila para poder agregar contenido
        return 1;
      }
      return 0;
    }
    let max = 1;
    const rowsColumns = section.display_config?.grid_config?.rows_columns || {};
    Object.keys(rowsColumns).forEach(key => {
      const rowNum = Number(key);
      if (rowNum > max) max = rowNum;
    });
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
  }, [section.form_parameters, section.display_config, gridCells, hasParameters, hasGridCells, mode]);

  const gridLayout = useMemo(() => {
    const grid: Record<number, Record<number, FormParameter | FormGridCell | null>> = {};
    for (let r = 1; r <= maxRow; r++) {
      const cols = getColumnsForRow(r);
      grid[r] = {};
      for (let c = 1; c <= cols; c++) {
        grid[r][c] = null;
      }
    }
    const paramsInRow = (r: number) =>
      (section.form_parameters || []).filter((p) => (p.grid_row || 1) === r);
    const cellsInRow = (r: number) =>
      gridCells.filter((c) => c.grid_row === r);

    // Asignar cada ítem a su slot (grid_column). El span solo define el ancho visual (flex),
    // no reserva columnas adicionales: así parámetros y celdas de texto usan la misma lógica
    // y todas las columnas se muestran (ej. param col 1 span 2 + param col 2 span 1 → 4 slots visibles).
    if (hasParameters) {
      for (let r = 1; r <= maxRow; r++) {
        const sorted = [...paramsInRow(r)].sort((a, b) => (a.grid_column || 1) - (b.grid_column || 1));
        sorted.forEach(param => {
          const row = param.grid_row || 1;
          const col = param.grid_column || 1;
          const maxCols = getColumnsForRow(row);
          if (row <= maxRow && col <= maxCols) {
            grid[row][col] = { ...param, __isParameter: true } as any;
          }
        });
      }
    }
    for (let r = 1; r <= maxRow; r++) {
      const sorted = [...cellsInRow(r)].sort((a, b) => a.grid_column - b.grid_column);
      sorted.forEach(cell => {
        const row = cell.grid_row;
        const col = cell.grid_column;
        const maxCols = getColumnsForRow(row);
        if (row <= maxRow && col <= maxCols) {
          grid[row][col] = { ...cell, __isParameter: false } as any;
        }
      });
    }
    return grid;
  }, [section.form_parameters, gridCells, maxRow, getColumnsForRow, hasParameters]);

  const isCellParameter = useCallback((cell: FormParameter | FormGridCell): boolean => {
    const hasParameterDefinition = 'parameter_definition' in cell;
    const hasContent = 'content' in cell && typeof (cell as FormGridCell).content === 'string';
    return hasParameterDefinition && !hasContent;
  }, []);

  const allCells = useMemo(() => {
    const cells: (FormParameter | FormGridCell)[] = [];
    if (hasParameters) {
      section.form_parameters?.forEach(param => cells.push(param));
    }
    gridCells.forEach(cell => cells.push(cell));
    return cells;
  }, [section.form_parameters, gridCells, hasParameters]);

  return {
    maxRow,
    gridLayout,
    allCells,
    getColumnsForRow,
    hasParameters,
    hasGridCells,
    isCellParameter,
  };
}
