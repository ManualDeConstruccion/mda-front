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
    async (payload: { display_config?: object }) => {
      await api.patch(categoryUrl, payload);
      onSectionUpdated();
    },
    [section.id, onSectionUpdated]
  );

  const createBlock = useCallback(
    async (blockType: 'grid' | 'engine', sectionEngineId?: number) => {
      const nextOrder = (section.blocks?.length ?? 0) + 1;
      await api.post('parameters/form-category-blocks/', {
        category: section.id,
        order: nextOrder,
        block_type: blockType,
        section_engine_id: blockType === 'engine' ? sectionEngineId : null,
      });
      onSectionUpdated();
    },
    [section.id, section.blocks?.length, onSectionUpdated]
  );

  /** Inserta un bloque al inicio (orden 1); renumera el resto en una sola request. */
  const createBlockBefore = useCallback(
    async (blockType: 'grid' | 'engine', sectionEngineId?: number) => {
      await api.post('parameters/form-category-blocks/insert/', {
        category: section.id,
        position: 'before',
        block_type: blockType,
        section_engine_id: blockType === 'engine' ? sectionEngineId : null,
      });
      onSectionUpdated();
    },
    [section.id, onSectionUpdated]
  );

  /** Inserta un bloque después del último en una sola request. */
  const createBlockAfter = useCallback(
    async (blockType: 'grid' | 'engine', sectionEngineId?: number) => {
      await api.post('parameters/form-category-blocks/insert/', {
        category: section.id,
        position: 'after',
        block_type: blockType,
        section_engine_id: blockType === 'engine' ? sectionEngineId : null,
      });
      onSectionUpdated();
    },
    [section.id, onSectionUpdated]
  );

  /** Elimina un bloque (grilla o motor) de la sección. */
  const deleteBlock = useCallback(
    async (blockId: number) => {
      await api.delete(`parameters/form-category-blocks/${blockId}/`);
      onSectionUpdated();
    },
    [onSectionUpdated]
  );

  const deleteCategory = useCallback(async () => {
    await api.delete(categoryUrl);
    onSectionUpdated();
  }, [section.id, onSectionUpdated]);

  const addRowBefore = useCallback(
    async (targetRow: number) => {
      await api.post(`${categoryUrl}shift-rows/`, {
        target_row: targetRow,
        action: 'insert_before',
      });
      onSectionUpdated();
    },
    [section.id, onSectionUpdated]
  );

  const addRowAfter = useCallback(
    async (targetRow: number) => {
      await api.post(`${categoryUrl}shift-rows/`, {
        target_row: targetRow,
        action: 'insert_after',
      });
      onSectionUpdated();
    },
    [section.id, onSectionUpdated]
  );

  const deleteRow = useCallback(
    async (targetRow: number) => {
      await api.post(`${categoryUrl}shift-rows/`, {
        target_row: targetRow,
        action: 'delete',
      });
      onSectionUpdated();
    },
    [section.id, onSectionUpdated]
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
    createBlock,
    createBlockBefore,
    createBlockAfter,
    deleteBlock,
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
