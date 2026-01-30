import { useCallback } from 'react';
import { api } from '../services/api';
import type { FormParameterCategory, FormParameter, FormGridCell } from '../types/formParameters.types';

/**
 * Mutaciones para categorías de formulario y grilla (display_config, filas, parámetros, celdas).
 * Usa el cliente api (auth ya configurado).
 */
export function useFormCategoryMutations(
  section: FormParameterCategory,
  onSectionUpdated: () => void
) {
  const basePath = 'parameters/form-parameter-categories';
  const categoryUrl = `${basePath}/${section.id}/`;

  const updateDisplayConfig = useCallback(
    async (row: number, columns: number) => {
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
      await api.patch(categoryUrl, { display_config: newDisplayConfig });
      onSectionUpdated();
    },
    [section.id, section.display_config, onSectionUpdated]
  );

  const patchCategory = useCallback(
    async (payload: { display_config?: object; form_type?: number }) => {
      await api.patch(categoryUrl, payload);
      onSectionUpdated();
    },
    [section.id, onSectionUpdated]
  );

  const deleteCategory = useCallback(async () => {
    await api.delete(categoryUrl);
    onSectionUpdated();
  }, [section.id, onSectionUpdated]);

  const addRowBefore = useCallback(
    async (targetRow: number) => {
      const currentConfig = section.display_config || {};
      const currentGridConfig = currentConfig.grid_config || {};
      const currentRowsColumns = currentGridConfig.rows_columns || {};
      const newRowsColumns: Record<string, number> = {};
      Object.keys(currentRowsColumns).forEach(key => {
        const rowNum = Number(key);
        if (rowNum >= targetRow) {
          newRowsColumns[String(rowNum + 1)] = currentRowsColumns[key];
        } else {
          newRowsColumns[key] = currentRowsColumns[key];
        }
      });
      newRowsColumns[String(targetRow)] = 3;
      await api.patch(categoryUrl, {
        display_config: {
          ...currentConfig,
          grid_config: { ...currentGridConfig, rows_columns: newRowsColumns },
        },
      });
      if (section.form_parameters) {
        const paramsToMove = section.form_parameters.filter((param) => (param.grid_row || 1) >= targetRow);
        for (const param of paramsToMove) {
          await api.patch(`parameters/form-parameters/${param.id}/update_grid_position/`, {
            grid_row: (param.grid_row || 1) + 1,
            grid_column: param.grid_column || 1,
            grid_span: param.grid_span || 1,
          });
        }
      }
      if (section.grid_cells) {
        const cellsToMove = section.grid_cells.filter((cell) => cell.grid_row >= targetRow);
        for (const cell of cellsToMove) {
          await api.patch(`parameters/form-grid-cells/${cell.id}/`, {
            grid_row: cell.grid_row + 1,
            grid_column: cell.grid_column,
            grid_span: cell.grid_span,
            content: cell.content,
          });
        }
      }
      onSectionUpdated();
    },
    [section, onSectionUpdated]
  );

  const addRowAfter = useCallback(
    async (targetRow: number) => {
      const currentConfig = section.display_config || {};
      const currentGridConfig = currentConfig.grid_config || {};
      const currentRowsColumns = currentGridConfig.rows_columns || {};
      const newRowsColumns: Record<string, number> = {};
      Object.keys(currentRowsColumns).forEach(key => {
        const rowNum = Number(key);
        if (rowNum > targetRow) {
          newRowsColumns[String(rowNum + 1)] = currentRowsColumns[key];
        } else {
          newRowsColumns[key] = currentRowsColumns[key];
        }
      });
      newRowsColumns[String(targetRow + 1)] = 3;
      await api.patch(categoryUrl, {
        display_config: {
          ...currentConfig,
          grid_config: { ...currentGridConfig, rows_columns: newRowsColumns },
        },
      });
      if (section.form_parameters) {
        const paramsToMove = section.form_parameters.filter((param) => (param.grid_row || 1) > targetRow);
        for (const param of paramsToMove) {
          await api.patch(`parameters/form-parameters/${param.id}/update_grid_position/`, {
            grid_row: (param.grid_row || 1) + 1,
            grid_column: param.grid_column || 1,
            grid_span: param.grid_span || 1,
          });
        }
      }
      if (section.grid_cells) {
        const cellsToMove = section.grid_cells.filter((cell) => cell.grid_row > targetRow);
        for (const cell of cellsToMove) {
          await api.patch(`parameters/form-grid-cells/${cell.id}/`, {
            grid_row: cell.grid_row + 1,
            grid_column: cell.grid_column,
            grid_span: cell.grid_span,
            content: cell.content,
          });
        }
      }
      onSectionUpdated();
    },
    [section, onSectionUpdated]
  );

  const deleteRow = useCallback(
    async (targetRow: number) => {
      const currentConfig = section.display_config || {};
      const currentGridConfig = currentConfig.grid_config || {};
      const currentRowsColumns = currentGridConfig.rows_columns || {};
      const paramsToDelete = section.form_parameters?.filter((param) => (param.grid_row || 1) === targetRow) || [];
      const cellsToDelete = section.grid_cells?.filter((cell) => cell.grid_row === targetRow) || [];
      for (const param of paramsToDelete) {
        await api.delete(`parameters/form-parameters/${param.id}/`);
      }
      for (const cell of cellsToDelete) {
        await api.delete(`parameters/form-grid-cells/${cell.id}/`);
      }
      const newRowsColumns: Record<string, number> = {};
      Object.keys(currentRowsColumns).forEach(key => {
        const rowNum = Number(key);
        if (rowNum < targetRow) {
          newRowsColumns[key] = currentRowsColumns[key];
        } else if (rowNum > targetRow) {
          newRowsColumns[String(rowNum - 1)] = currentRowsColumns[key];
        }
      });
      if (section.form_parameters) {
        const paramsToMove = section.form_parameters.filter((param) => (param.grid_row || 1) > targetRow);
        for (const param of paramsToMove) {
          await api.patch(`parameters/form-parameters/${param.id}/update_grid_position/`, {
            grid_row: (param.grid_row || 1) - 1,
            grid_column: param.grid_column || 1,
            grid_span: param.grid_span || 1,
          });
        }
      }
      if (section.grid_cells) {
        const cellsToMove = section.grid_cells.filter((cell) => cell.grid_row > targetRow);
        for (const cell of cellsToMove) {
          await api.patch(`parameters/form-grid-cells/${cell.id}/`, {
            grid_row: cell.grid_row - 1,
            grid_column: cell.grid_column,
            grid_span: cell.grid_span,
            content: cell.content,
          });
        }
      }
      await api.patch(categoryUrl, {
        display_config: {
          ...currentConfig,
          grid_config: { ...currentGridConfig, rows_columns: newRowsColumns },
        },
      });
      onSectionUpdated();
    },
    [section, onSectionUpdated]
  );

  const updateParameterPosition = useCallback(
    async (paramId: number, grid_row: number, grid_column: number, grid_span: number) => {
      await api.patch(`parameters/form-parameters/${paramId}/update_grid_position/`, {
        grid_row,
        grid_column,
        grid_span,
      });
      onSectionUpdated();
    },
    [onSectionUpdated]
  );

  const updateGridCell = useCallback(
    async (
      cellId: number,
      payload: { grid_row: number; grid_column: number; grid_span: number; content: string }
    ) => {
      await api.patch(`parameters/form-grid-cells/${cellId}/`, payload);
      onSectionUpdated();
    },
    [onSectionUpdated]
  );

  const deleteParameter = useCallback(async (paramId: number) => {
    await api.delete(`parameters/form-parameters/${paramId}/`);
    onSectionUpdated();
  }, [onSectionUpdated]);

  const deleteGridCell = useCallback(async (cellId: number) => {
    await api.delete(`parameters/form-grid-cells/${cellId}/`);
    onSectionUpdated();
  }, [onSectionUpdated]);

  const addFirstRow = useCallback(async () => {
    const currentConfig = section.display_config || {};
    const currentGridConfig = currentConfig.grid_config || {};
    await api.patch(categoryUrl, {
      display_config: {
        ...currentConfig,
        grid_config: {
          ...currentGridConfig,
          rows_columns: { '1': 3 },
        },
      },
    });
    onSectionUpdated();
  }, [section.id, section.display_config, onSectionUpdated]);

  return {
    updateDisplayConfig,
    patchCategory,
    deleteCategory,
    addRowBefore,
    addRowAfter,
    deleteRow,
    updateParameterPosition,
    updateGridCell,
    deleteParameter,
    deleteGridCell,
    addFirstRow,
  };
}
