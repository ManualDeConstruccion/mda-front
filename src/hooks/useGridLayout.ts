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
    if (rowsColumns[rowKey]) {
      return rowsColumns[rowKey];
    }
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
    return Math.min(Math.max(max, 1), 5);
  }, [section.display_config, section.form_parameters, section.grid_cells, hasParameters]);

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
    if (hasParameters) {
      section.form_parameters?.forEach(param => {
        const row = param.grid_row || 1;
        const col = param.grid_column || 1;
        const span = param.grid_span || 1;
        const maxCols = getColumnsForRow(row);
        if (row <= maxRow && col <= maxCols) {
          if (!grid[row][col] || (grid[row][col] as any).__isParameter === true) {
            grid[row][col] = { ...param, __isParameter: true } as any;
            for (let i = 1; i < span && col + i <= maxCols; i++) {
              grid[row][col + i] = { __occupied: true } as any;
            }
          }
        }
      });
    }
    gridCells.forEach(cell => {
      const row = cell.grid_row;
      const col = cell.grid_column;
      const span = cell.grid_span;
      const maxCols = getColumnsForRow(row);
      if (row <= maxRow && col <= maxCols) {
        grid[row][col] = { ...cell, __isParameter: false } as any;
        for (let i = 1; i < span && col + i <= maxCols; i++) {
          grid[row][col + i] = { __occupied: true } as any;
        }
      }
    });
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
