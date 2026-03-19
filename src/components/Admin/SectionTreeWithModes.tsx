import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { useSectionEngines } from '../../hooks/useSectionEngines';
import { useSectionExpansion } from '../../hooks/useSectionExpansion';
import { useSectionValues } from '../../hooks/useSectionValues';
import { useGridLayout } from '../../hooks/useGridLayout';
import { useFormCategoryMutations } from '../../hooks/useFormCategoryMutations';
import EditFormParameterCategoryModal from './EditFormParameterCategoryModal';
import EditEngineBlockModal from './EditEngineBlockModal';
import AddFormParameterModal from './AddFormParameterModal';
import EditFormParameterModal from './EditFormParameterModal';
import AddEditFormGridCellModal from './AddEditFormGridCellModal';
import GridRow from './GridRow';
import EngineBlockRenderer from './EngineBlockRenderer';
import ENGINE_COMPONENTS from './engineRegistry';
import {
  CategoryAlertsBlock,
  EmptyGridState,
  AddFirstBlockSelector,
  AddBlockBelow,
  SectionHeader,
  SectionGrid,
} from './SectionTree';
import type {
  SectionTreeMode,
  UIAlert,
  FormType,
  FormParameterCategory,
  FormCategoryBlock,
  FormParameter,
  FormGridCellStyle,
  FormGridCell,
  GridCellProps,
} from '../../types/formParameters.types';

export type { SectionTreeMode, UIAlert, FormType, FormParameterCategory, FormParameter, FormGridCellStyle, FormGridCell, GridCellProps };

interface SectionTreeWithModesProps {
  section: FormParameterCategory;
  level: number;
  projectTypeId: number;
  allSections: FormParameterCategory[];
  onSectionUpdated: () => void;
  mode?: SectionTreeMode;
  subprojectId?: number; // Para modo editable (usuario final)
  values?: Record<string, any>; // Valores actuales del formulario (modo editable)
  onChange?: (categoryId: number, code: string, value: any, selectedOption?: any) => void; // Callback para cambios (modo editable); selectedOption para form_rules (ej. value_source "region")
  onSectionExpand?: (sectionId: number) => Promise<void>; // Callback cuando se expande una sección (para cargar valores)
  activeSectionId?: number; // ID de la sección que debe estar expandida por defecto
  sectionMode?: 'view' | 'editable'; // Modo específico para esta sección (solo para usuario final)
  onSectionModeChange?: (sectionId: number, mode: 'view' | 'editable') => void; // Callback cuando cambia el modo de la sección
  getSectionMode?: (sectionId: number) => 'view' | 'editable' | undefined; // Función para obtener el modo de cualquier sección (para subcategorías)
  /** Alertas por categoría (categoryId -> alertas). Se muestran bajo la descripción de la categoría. */
  categoryAlerts?: Record<number, UIAlert[]>;
  /** Llamar cuando un motor aplica cambios (ej. propiedad vinculada/editada) para recargar el resto de formularios sin recargar la página. */
  onMotorAppliedChange?: () => void | Promise<void>;
}

// Re-exportar GridCell y SortableGridCell para compatibilidad con importadores que usan SectionTreeWithModes
export { default as GridCell, SortableGridCell } from './GridCell';

/** Props para la grilla de un solo bloque (params/cells filtrados por block). */
interface GridBlockViewProps {
  section: FormParameterCategory;
  gridCells: FormGridCell[];
  mode: SectionTreeMode;
  effectiveMode: SectionTreeMode;
  values: Record<string, any>;
  onChange: (code: string, value: any, selectedOption?: any) => void;
  mutations: ReturnType<typeof useFormCategoryMutations>;
  onAddParameter: (row: number, column: number) => void;
  onEditParameter: (param: FormParameter) => void;
  onEditTextCell: (cell: FormGridCell) => void;
  onDeleteCell: (cell: FormParameter | FormGridCell, isParameter: boolean) => Promise<void>;
  onAddTextCell: (row: number, column: number, blockId?: number) => void;
  addRowBefore: (targetRow: number) => Promise<void>;
  addRowAfter: (targetRow: number) => Promise<void>;
  deleteRow: (targetRow: number) => Promise<void>;
  updateDisplayConfig: (row: number, columns: number) => Promise<void>;
  /** Abre flujo para insertar motor entre esta fila y la siguiente (admin). */
  onInsertEngineAfterRow?: (row: number) => void;
}

const GridBlockView: React.FC<GridBlockViewProps> = ({
  section,
  gridCells,
  mode,
  effectiveMode,
  values,
  onChange,
  mutations,
  onAddParameter,
  onEditParameter,
  onEditTextCell,
  onDeleteCell,
  onAddTextCell,
  addRowBefore,
  addRowAfter,
  deleteRow,
  updateDisplayConfig,
  onInsertEngineAfterRow,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeRow, setActiveRow] = useState<number | null>(null);

  const handleActivateRow = useCallback(
    (row: number) => {
      setActiveRow(row);
      setActiveId(null);
    },
    []
  );

  const {
    maxRow,
    gridLayout,
    allCells,
    getColumnsForRow,
    hasParameters,
    hasGridCells,
    isCellParameter,
  } = useGridLayout(section, gridCells, mode);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );
  const gridRows = useMemo(() => {
    const rows: React.ReactNode[] = [];
    if (maxRow === 0) return rows;
    for (let r = 1; r <= maxRow; r++) {
      const rowColumns = getColumnsForRow(r);
      const rowCells = gridLayout[r] || {};
      rows.push(
        <GridRow
          key={`row-${r}`}
          row={r}
          rowColumns={rowColumns}
          rowCells={rowCells}
          mode={effectiveMode}
          maxRow={maxRow}
          activeId={activeId || ''}
          isRowActive={effectiveMode === 'admin' ? activeRow === r : true}
          onActivateRow={effectiveMode === 'admin' ? handleActivateRow : undefined}
          hasParameters={!!hasParameters}
          section={section}
          onAddRowBefore={addRowBefore}
          onAddRowAfter={addRowAfter}
          onDeleteRow={deleteRow}
          onUpdateDisplayConfig={updateDisplayConfig}
          onInsertEngineAfterRow={onInsertEngineAfterRow}
          onEditParameter={onEditParameter}
          onEditTextCell={onEditTextCell}
          onDeleteCell={onDeleteCell}
          onAddTextCell={onAddTextCell}
          onAddParameter={onAddParameter}
          values={values}
          onChange={onChange}
        />
      );
    }
    return rows;
  }, [effectiveMode, maxRow, gridLayout, activeId, activeRow, hasParameters, section, values, onChange, getColumnsForRow, addRowBefore, addRowAfter, deleteRow, updateDisplayConfig, onEditParameter, onEditTextCell, onDeleteCell, onAddTextCell, onAddParameter, handleActivateRow]);
  const hasRealContent = hasParameters || hasGridCells;
  if (!hasRealContent && mode !== 'admin') return null;
  if (maxRow === 0 && mode === 'admin') {
    return (
      <Box sx={{ mt: 2 }}>
        <EmptyGridState onAddFirstRow={async () => await mutations.addFirstRow()} />
      </Box>
    );
  }
  if (!hasRealContent && maxRow === 0) return null;
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
        <SectionGrid
          mode={mode}
          gridContent={<>{gridRows}</>}
          allCells={allCells}
          activeId={activeId || ''}
          sensors={sensors}
          onDragStart={() => {}}
          onDragOver={() => {}}
          onDragEnd={async () => {}}
          isCellParameter={isCellParameter}
          getCellSortId={(cell) => `cell-${isCellParameter(cell) ? 'param' : 'text'}-${cell.id}`}
        />
      </Box>
    </Box>
  );
};

// Componente principal
const SectionTreeWithModes: React.FC<SectionTreeWithModesProps> = ({
  section,
  level,
  projectTypeId,
  allSections,
  onSectionUpdated,
  mode = 'view',
  subprojectId,
  values: externalValues = {},
  onChange: externalOnChange,
  onSectionExpand,
  activeSectionId,
  sectionMode: propSectionMode,
  onSectionModeChange,
  getSectionMode,
  categoryAlerts,
  onMotorAppliedChange,
}) => {
  const { values, onChange } = useSectionValues(externalValues, externalOnChange, section.id);
  const mutations = useFormCategoryMutations(section, onSectionUpdated);
  
  // Determinar el modo efectivo: usar sectionMode si está definido, sino usar mode
  // sectionMode solo aplica cuando no estamos en modo admin y hay subprojectId (usuario final)
  // Si sectionMode está definido (no undefined), usarlo. Si no, intentar obtenerlo con getSectionMode, sino usar mode.
  const resolvedSectionMode = propSectionMode !== undefined 
    ? propSectionMode 
    : (getSectionMode ? getSectionMode(section.id) : undefined);
  
  const effectiveMode: SectionTreeMode = (mode !== 'admin' && subprojectId && resolvedSectionMode !== undefined) 
    ? resolvedSectionMode 
    : mode;
  
  const { isExpanded, setIsExpanded } = useSectionExpansion(section.id, mode, activeSectionId);
  
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [addParameterModalOpen, setAddParameterModalOpen] = useState(false);
  const [parameterInitialGridPosition, setParameterInitialGridPosition] = useState<{ row: number; column: number } | null>(null);
  const [editParameterModalOpen, setEditParameterModalOpen] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<FormParameter | null>(null);
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);
  const [currentBlockIdForNewParam, setCurrentBlockIdForNewParam] = useState<number | null>(null);
  const [engineBlockToEdit, setEngineBlockToEdit] = useState<FormCategoryBlock | null>(null);
  const { sectionEngines } = useSectionEngines({ enabled: mode === 'admin' });
  
  // Modal: split + insertar motor en medio de una grilla (admin)
  const [insertEngineModalOpen, setInsertEngineModalOpen] = useState(false);
  const [insertEngineTargetBlockId, setInsertEngineTargetBlockId] = useState<number | null>(null);
  const [insertEngineSplitRow, setInsertEngineSplitRow] = useState<number>(1);
  const [insertEngineId, setInsertEngineId] = useState<number | ''>('');
  const [insertEngineName, setInsertEngineName] = useState<string>('');
  const [insertEngineIsCollapsible, setInsertEngineIsCollapsible] = useState<boolean>(false);

  const openInsertEngineModal = useCallback((blockId: number, row: number) => {
    setInsertEngineTargetBlockId(blockId);
    setInsertEngineSplitRow(row);
    setInsertEngineId('');
    setInsertEngineName('');
    setInsertEngineIsCollapsible(false);
    setInsertEngineModalOpen(true);
  }, []);
  
  const [gridCells, setGridCells] = useState<FormGridCell[]>(section.grid_cells || []);
  useEffect(() => {
    if (section.grid_cells) {
      setGridCells(section.grid_cells);
    }
  }, [section.grid_cells]);

  // Bloques ordenados (grilla + motores). Si no hay bloques, se trata como una sola grilla legacy.
  const sortedBlocks = useMemo(() => {
    const blocks = section.blocks ?? [];
    return blocks.slice().sort((a, b) => a.order - b.order);
  }, [section.blocks]);
  const hasBlocks = sortedBlocks.length > 0;
  const hasEngineBlockWithComponent = hasBlocks && sortedBlocks.some(
    (b) => b.block_type === 'engine' && b.section_engine?.code && ENGINE_COMPONENTS[b.section_engine.code]
  );

  const shouldUseTopLevelGrid = !hasBlocks;
  const gridHookResult = useGridLayout(
    shouldUseTopLevelGrid ? section : { ...section, form_parameters: [], grid_cells: [] },
    shouldUseTopLevelGrid ? gridCells : [],
    mode,
  );
  const {
    maxRow,
    gridLayout,
    allCells,
    getColumnsForRow,
    hasParameters: hasParametersRaw,
    hasGridCells: hasGridCellsRaw,
    isCellParameter,
  } = gridHookResult;
  const hasParameters = shouldUseTopLevelGrid ? hasParametersRaw : (section.form_parameters?.length ?? 0) > 0;
  const hasGridCells = shouldUseTopLevelGrid ? hasGridCellsRaw : (gridCells?.length ?? 0) > 0;
  
  const hasSubcategories = section.subcategories && section.subcategories.length > 0;
  /** Si la sección no tiene parámetros ni celdas, solo se muestra el botón de agregar bloque (no "Agregar primera fila"). */
  const sectionHasNoContent = !hasParameters && !hasGridCells;
  
  // Cuando hay bloques: contenido por bloque (grilla filtrada o motor). Sin bloques: una sola grilla con todo.
  const useGridInterface = !hasBlocks || sortedBlocks.some((b) => b.block_type === 'grid');
  const isSuperficiesSection = hasEngineBlockWithComponent && mode !== 'admin' && !!subprojectId;
  const isFormTypeUndefined = !hasBlocks;

  const updateDisplayConfig = useCallback(async (row: number, columns: number) => {
    try {
      await mutations.updateDisplayConfig(row, columns);
    } catch (error) {
      console.error('Error al actualizar display_config:', error);
    }
  }, [mutations]);

  const addRowBefore = useCallback(async (targetRow: number) => {
    try {
      await mutations.addRowBefore(targetRow);
    } catch (error) {
      console.error('Error al agregar fila antes:', error);
    }
  }, [mutations]);

  const addRowAfter = useCallback(async (targetRow: number) => {
    try {
      await mutations.addRowAfter(targetRow);
    } catch (error) {
      console.error('Error al agregar fila después:', error);
    }
  }, [mutations]);

  const deleteRow = useCallback(async (targetRow: number) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la fila ${targetRow}? Esto eliminará todos los elementos de esa fila.`)) {
      return;
    }
    try {
      await mutations.deleteRow(targetRow);
    } catch (error) {
      console.error('Error al eliminar fila:', error);
      alert('Error al eliminar la fila. Por favor, inténtalo de nuevo.');
    }
  }, [mutations]);
  
  // Estados para modo admin
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [addTextCellModalOpen, setAddTextCellModalOpen] = useState(false);
  const [textCellInitialData, setTextCellInitialData] = useState<{ row: number; column: number; span: number; content: string } | null>(null);
  const [editingTextCell, setEditingTextCell] = useState<FormGridCell | null>(null);
  const [currentBlockIdForNewTextCell, setCurrentBlockIdForNewTextCell] = useState<number | null>(null);

  // Sensores para drag and drop (solo modo admin)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleActivateRow = useCallback(
    (row: number) => {
      setActiveRow(row);
      setActiveId(null);
    },
    []
  );

  // Handlers para drag and drop (modo admin)
  const handleDragStart = (event: DragStartEvent) => {
    const activeIdStr = event.active.id as string;
    setActiveId(activeIdStr);
    
    // Obtener la fila de la celda que se está arrastrando
    const activeCell = allCells.find(cell => {
      const isParam = isCellParameter(cell);
      const cellId = `cell-${isParam ? 'param' : 'text'}-${cell.id}`;
      return cellId === activeIdStr;
    });
    
    if (activeCell) {
      const isParam = isCellParameter(activeCell);
      const row = isParam 
        ? (activeCell as FormParameter).grid_row || 1 
        : (activeCell as FormGridCell).grid_row;
      setActiveRow(row);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Este handler permite dar feedback visual, pero la validación real
    // se hace en handleDragEnd para prevenir el movimiento entre filas
    // En dnd-kit, no podemos "bloquear" el drop aquí directamente,
    // pero podemos usar esto para cambios visuales si es necesario
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over || active.id === over.id || mode !== 'admin') return;
    
    // Obtener información de la celda arrastrada
    const activeCell = allCells.find(cell => {
      const isParam = isCellParameter(cell);
      const cellId = `cell-${isParam ? 'param' : 'text'}-${cell.id}`;
      return cellId === active.id;
    });
    
    if (!activeCell) return;
    
    // Obtener la fila original de la celda arrastrada
    const isParameter = isCellParameter(activeCell);
    const originalRow = isParameter 
      ? (activeCell as FormParameter).grid_row || 1 
      : (activeCell as FormGridCell).grid_row;
    
    // Obtener información del drop target
    // Si over.id es una celda existente, usar su posición
    // Si es una celda vacía, calcular posición desde el elemento DOM
    let newRow = 1;
    let newCol = 1;
    
    const overCell = allCells.find(cell => {
      const isParam = isCellParameter(cell);
      const cellId = `cell-${isParam ? 'param' : 'text'}-${cell.id}`;
      return cellId === over.id;
    });
    
    if (overCell) {
      // Si se soltó sobre otra celda, usar su posición
      const isParam = isCellParameter(overCell);
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
    
    // Restricción: solo permitir movimiento dentro de la misma fila
    if (newRow !== originalRow) {
      // No permitir mover celdas entre filas diferentes
      return;
    }
    
    // Asegurar que la posición esté dentro de los límites
    newRow = Math.max(1, Math.min(newRow, maxRow + 1));
    const maxColsForRow = getColumnsForRow(newRow);
    newCol = Math.max(1, Math.min(newCol, maxColsForRow));
    
    try {
      const isParameter = isCellParameter(activeCell);
      if (isParameter) {
        const param = activeCell as FormParameter;
        await mutations.updateParameterPosition(param.id, newRow, newCol, param.grid_span || 1);
      } else {
        const cell = activeCell as FormGridCell;
        await mutations.updateGridCell(cell.id, {
          grid_row: newRow,
          grid_column: newCol,
          grid_span: cell.grid_span,
          content: cell.content,
        });
      }
    } catch (error) {
      console.error('Error al actualizar posición:', error);
    }
  };

  // Handler para abrir modal de agregar celda de texto (blockId cuando se agrega desde un bloque)
  const handleOpenAddTextCellModal = (row: number, column: number, blockId?: number) => {
    setTextCellInitialData({ row, column, span: 1, content: '' });
    setEditingTextCell(null);
    setCurrentBlockIdForNewTextCell(blockId ?? null);
    setAddTextCellModalOpen(true);
  };

  // Handler para abrir modal de editar celda de texto
  const handleOpenEditTextCellModal = (cell: FormGridCell) => {
    setEditingTextCell(cell);
    setTextCellInitialData(null);
    setAddTextCellModalOpen(true);
  };

  // Handler para cerrar modal de celda de texto
  const handleCloseTextCellModal = () => {
    setAddTextCellModalOpen(false);
    setEditingTextCell(null);
    setTextCellInitialData(null);
    setCurrentBlockIdForNewTextCell(null);
  };

  // Handler para eliminar celda
  const handleDeleteCell = useCallback(async (cell: FormParameter | FormGridCell, isParameter: boolean) => {
    try {
      if (isParameter) {
        await mutations.deleteParameter(cell.id);
      } else {
        await mutations.deleteGridCell(cell.id);
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  }, [mutations]);

  // Renderizar la grilla base (compartida por todos los modos) - REESTRUCTURADO para columnas por fila
  // Usar useMemo para recalcular cuando cambia effectiveMode u otros dependencias
  const gridRows = useMemo(() => {
    const rows: React.ReactNode[] = [];
    
    // Si maxRow es 0, no renderizar ninguna fila (categoría vacía sin contenido)
    if (maxRow === 0) {
      return rows;
    }
    
    for (let r = 1; r <= maxRow; r++) {
      const rowColumns = getColumnsForRow(r);
      const rowCells = gridLayout[r] || {};
      
      rows.push(
        <GridRow
          key={`row-${r}-${effectiveMode}`} // Incluir effectiveMode en la key para forzar re-render
          row={r}
          rowColumns={rowColumns}
          rowCells={rowCells}
          mode={effectiveMode}
          maxRow={maxRow}
          activeId={activeId || ''}
          isRowActive={effectiveMode === 'admin' ? activeRow === r : true}
          onActivateRow={effectiveMode === 'admin' ? handleActivateRow : undefined}
          hasParameters={!!hasParameters}
          section={section}
          onAddRowBefore={addRowBefore}
          onAddRowAfter={addRowAfter}
          onDeleteRow={deleteRow}
          onUpdateDisplayConfig={updateDisplayConfig}
          onEditParameter={(param: FormParameter) => {
            setSelectedParameter(param);
            setEditParameterModalOpen(true);
          }}
          onEditTextCell={(cell: FormGridCell) => handleOpenEditTextCellModal(cell)}
          onDeleteCell={handleDeleteCell}
          onAddTextCell={handleOpenAddTextCellModal}
          onAddParameter={(row, column) => {
            setParameterInitialGridPosition({ row, column });
            setAddParameterModalOpen(true);
          }}
          values={values}
          onChange={onChange}
        />
      );
    }
    
    return rows;
  }, [effectiveMode, maxRow, gridLayout, activeId, activeRow, handleActivateRow, hasParameters, section, values, onChange, addRowBefore, addRowAfter, deleteRow, updateDisplayConfig, handleDeleteCell, getColumnsForRow]);
  
  const renderGrid = () => {
    // Verificar si realmente hay contenido (parámetros o celdas de texto)
    const hasRealContent = hasParameters || hasGridCells;
    
    // Si no hay contenido real y no es modo admin, no renderizar nada
    if (!hasRealContent && mode !== 'admin') {
      return null;
    }
    
    if (maxRow === 0 && mode === 'admin' && useGridInterface) {
      return (
        <EmptyGridState
          onAddFirstRow={async () => {
            try {
              await mutations.addFirstRow();
            } catch (error) {
              console.error('Error al agregar primera fila:', error);
            }
          }}
        />
      );
    }
    
    // Si no hay contenido real y maxRow es 0, no renderizar contenedor
    if (!hasRealContent && maxRow === 0) {
      return null;
    }
    
    // Si hay filas pero no hay contenido real en modo vista/editable, no renderizar
    if (!hasRealContent && mode !== 'admin' && maxRow > 0) {
      return null;
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
        {gridRows}
      </Box>
    );

    return (
      <SectionGrid
        mode={mode}
        gridContent={gridContent}
        allCells={allCells}
        activeId={activeId || ''}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        isCellParameter={isCellParameter}
        getCellSortId={(cell) => {
          const isParam = isCellParameter(cell);
          return `cell-${isParam ? 'param' : 'text'}-${cell.id}`;
        }}
      />
    );
  };

  // Renderizar contenido: una grilla (legacy o por bloque)
  const renderContent = () => (
    <Box sx={{ mt: 2 }}>
      {renderGrid()}
    </Box>
  );

  return (
    <Box
      sx={{
        ml: level * 1,
        mb: 2,
        borderLeft: level > 0 ? '2px solid' : 'none',
        borderColor: 'divider',
        pl: level > 0 ? 1 : 0,
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
        <SectionHeader
          section={section}
          mode={mode}
          effectiveMode={effectiveMode}
          hasSubcategories={!!hasSubcategories}
          hasParameters={!!hasParameters}
          hasGridCells={!!hasGridCells}
          isSuperficiesSection={!!isSuperficiesSection}
          isExpanded={isExpanded}
          onToggleExpand={async () => {
            const newExpanded = !isExpanded;
            setIsExpanded(newExpanded);
            if (newExpanded && onSectionExpand) {
              await onSectionExpand(section.id);
            }
          }}
          onEditCategory={() => setEditCategoryModalOpen(true)}
          onDeleteCategory={async () => {
            if (window.confirm(`¿Estás seguro de que deseas eliminar la sección "${section.name}"? Esta acción no se puede deshacer.`)) {
              try {
                await mutations.deleteCategory();
              } catch (error) {
                console.error('Error al eliminar sección:', error);
                alert('Error al eliminar la sección. Asegúrate de que no tenga subcategorías o parámetros asociados.');
              }
            }
          }}
          onSectionModeChange={onSectionModeChange}
          subprojectId={subprojectId}
          values={values}
          setCreatingSubcategory={setCreatingSubcategory}
          setEditCategoryModalOpen={setEditCategoryModalOpen}
        />

        {section.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 6 }}>
            {section.description}
          </Typography>
        )}

        {categoryAlerts && categoryAlerts[section.id]?.length > 0 && (
          <CategoryAlertsBlock alerts={categoryAlerts[section.id] as UIAlert[]} />
        )}

        <Collapse in={isExpanded}>
          {/* Sin bloques: mostrar selector para agregar primer bloque (admin) o nada */}
          {mode === 'admin' && !hasParameters && !hasSubcategories && !hasGridCells && isFormTypeUndefined && (
            <AddFirstBlockSelector
              sectionEngines={sectionEngines}
              onSelectGrid={async () => {
                try {
                  await mutations.createBlockAfter('grid');
                } catch (e) {
                  console.error('Error al crear bloque grilla:', e);
                  alert('Error al crear el bloque');
                }
              }}
              onSelectEngine={async (sectionEngineId) => {
                try {
                  await mutations.createBlockAfter('engine', sectionEngineId);
                } catch (e) {
                  console.error('Error al crear bloque motor:', e);
                  alert('Error al crear el bloque');
                }
              }}
            />
          )}

          {/* Con bloques en admin: siempre "Agregar bloque arriba" antes del primer bloque */}
          {hasBlocks && mode === 'admin' && (
            <AddBlockBelow
              label="Agregar bloque arriba"
              sectionEngines={sectionEngines}
              onAdd={mutations.createBlockBefore}
            />
          )}

          {/* Con bloques: renderizar cada bloque (motor superficies o grilla) */}
          {hasBlocks && sortedBlocks.map((block, blockIndex) => {
            const isLastBlock = blockIndex === sortedBlocks.length - 1;
            const blockContent =
              block.block_type === 'engine' ? (
                <EngineBlockRenderer
                  block={block}
                  mode={mode}
                  subprojectId={subprojectId}
                  onEdit={(b) => setEngineBlockToEdit(b)}
                  onDelete={(id) => mutations.deleteBlock(id)}
                  onMotorAppliedChange={onMotorAppliedChange}
                />
              ) : block.block_type === 'grid' ? (
                (() => {
                  const filteredParams = (section.form_parameters ?? []).filter(
                    (p) => (p as FormParameter & { block?: number }).block === block.id
                  );
                  const filteredCells = gridCells.filter(
                    (c) => (c as FormGridCell & { block?: number }).block === block.id
                  );
                  const rowsColumnsByBlock = (section.display_config as any)?.grid_config?.rows_columns_by_block;
                  const blockRowsColumns = rowsColumnsByBlock?.[String(block.id)];
                  const virtualDisplayConfig = {
                    ...(section.display_config || {}),
                    grid_config: {
                      ...((section.display_config || {}).grid_config || {}),
                      rows_columns: blockRowsColumns ?? (section.display_config as any)?.grid_config?.rows_columns ?? {},
                    },
                  };
                  const virtualSection = {
                    ...section,
                    form_parameters: filteredParams,
                    grid_cells: filteredCells,
                    display_config: virtualDisplayConfig,
                  };
                  const gridBlockCount = sortedBlocks.filter((b) => b.block_type === 'grid').length;
                  const gridBlockNumber = sortedBlocks.slice(0, blockIndex).filter((b) => b.block_type === 'grid').length + 1;
                  const blockSpacing = mode === 'admin' ? (blockIndex > 0 ? 3 : 2) : 0.5;
                  return (
                    <Box sx={{ mt: blockSpacing, ml: 0 }}>
                      {mode === 'admin' && gridBlockCount > 1 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Bloque de grilla {gridBlockNumber}
                        </Typography>
                      )}
                      <GridBlockView
                        section={virtualSection}
                        gridCells={filteredCells}
                      mode={mode}
                      effectiveMode={effectiveMode}
                      values={values}
                      onChange={onChange}
                      mutations={mutations}
                      onAddParameter={(row, column) => {
                        setCurrentBlockIdForNewParam(block.id);
                        setParameterInitialGridPosition({ row, column });
                        setAddParameterModalOpen(true);
                      }}
                      onEditParameter={(param) => {
                        setSelectedParameter(param);
                        setEditParameterModalOpen(true);
                      }}
                      onEditTextCell={handleOpenEditTextCellModal}
                      onDeleteCell={handleDeleteCell}
                      onAddTextCell={(row, column) => handleOpenAddTextCellModal(row, column, block.id)}
                      addRowBefore={addRowBefore}
                      addRowAfter={addRowAfter}
                      deleteRow={deleteRow}
                      updateDisplayConfig={async (row, columns) => {
                        const maybe = (mutations as any).updateDisplayConfigForBlock;
                        if (typeof maybe === 'function') {
                          await maybe(block.id, row, columns);
                        } else {
                          await updateDisplayConfig(row, columns);
                        }
                      }}
                      onInsertEngineAfterRow={(row) => openInsertEngineModal(block.id, row)}
                    />
                    </Box>
                  );
                })()
              ) : null;

            return (
              <React.Fragment key={block.id}>
                {blockContent}
                {/* "Agregar bloque debajo" después del último bloque */}
                {mode === 'admin' && isLastBlock && blockContent != null && (
                  <AddBlockBelow
                    label="Agregar bloque debajo"
                    sectionEngines={sectionEngines}
                    onAdd={mutations.createBlockAfter}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Sin bloques pero con contenido: una sola grilla legacy. No mostrar editor de grilla si la sección está vacía. */}
          {!hasBlocks && (hasParameters || hasSubcategories || hasGridCells) && renderContent()}

          {/* Subcategorías: siempre visibles si existen (también cuando la sección tiene bloque motor) */}
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
                  onChange={externalOnChange}
                  onSectionExpand={onSectionExpand}
                  activeSectionId={activeSectionId}
                  sectionMode={getSectionMode ? getSectionMode(subcategory.id) : undefined}
                  onSectionModeChange={onSectionModeChange}
                  getSectionMode={getSectionMode}
                  categoryAlerts={categoryAlerts}
                  onMotorAppliedChange={onMotorAppliedChange}
                />
              ))}
            </Box>
          )}

          {/* Mensaje para modo no-admin cuando está vacía (no en sección superficies) */}
          {mode !== 'admin' && !hasParameters && !hasSubcategories && !hasGridCells && !isSuperficiesSection && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 6 }}>
              Esta sección no tiene parámetros configurados.
            </Typography>
          )}

          {/* Botón para crear subsección - Siempre visible en modo admin, al final */}
          {mode === 'admin' && (
            <Box sx={{ mt: 2, ml: 0 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setCreatingSubcategory(true);
                  setEditCategoryModalOpen(true);
                }}
              >
                Crear Subsección
              </Button>
            </Box>
          )}
        </Collapse>
      </Box>

      {/* Modales */}
      {mode === 'admin' && (
        <Dialog open={insertEngineModalOpen} onClose={() => setInsertEngineModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Insertar motor entre filas</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Se insertará un motor entre la fila {insertEngineSplitRow} y la fila {insertEngineSplitRow + 1}.
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Motor</InputLabel>
              <Select
                label="Motor"
                value={insertEngineId}
                onChange={(e) => setInsertEngineId(Number(e.target.value))}
              >
                {sectionEngines.map((eng) => (
                  <MenuItem key={eng.id} value={eng.id}>
                    {eng.name} ({eng.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Nombre (opcional)"
              value={insertEngineName}
              onChange={(e) => setInsertEngineName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={insertEngineIsCollapsible}
                  onChange={(e) => setInsertEngineIsCollapsible(e.target.checked)}
                />
              }
              label="Colapsable en vista usuario"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInsertEngineModalOpen(false)}>Cancelar</Button>
            <Button
              variant="contained"
              disabled={insertEngineTargetBlockId == null || insertEngineId === ''}
              onClick={async () => {
                if (insertEngineTargetBlockId == null || insertEngineId === '') return;
                try {
                  await (mutations as any).splitInsertEngine(
                    insertEngineTargetBlockId,
                    insertEngineSplitRow,
                    Number(insertEngineId),
                    { name: insertEngineName, is_collapsible: insertEngineIsCollapsible }
                  );
                  setInsertEngineModalOpen(false);
                } catch (e) {
                  console.error('Error al insertar motor en medio:', e);
                  alert('Error al insertar el motor en medio de la grilla');
                }
              }}
            >
              Insertar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <EditFormParameterCategoryModal
        open={editCategoryModalOpen}
        onClose={() => {
          setEditCategoryModalOpen(false);
          setCreatingSubcategory(false);
        }}
        onSuccess={() => {
          onSectionUpdated();
          setCreatingSubcategory(false);
        }}
        category={creatingSubcategory ? null : section}
        projectTypeId={projectTypeId}
        parentCategories={allSections}
        defaultParentId={creatingSubcategory ? section.id : undefined}
      />

      <EditEngineBlockModal
        open={!!engineBlockToEdit}
        onClose={() => setEngineBlockToEdit(null)}
        onSuccess={onSectionUpdated}
        block={engineBlockToEdit}
        projectTypeId={projectTypeId}
      />

        <AddFormParameterModal
          open={addParameterModalOpen}
          onClose={() => {
            setAddParameterModalOpen(false);
            setParameterInitialGridPosition(null);
            setCurrentBlockIdForNewParam(null);
          }}
          onSuccess={onSectionUpdated}
          categoryId={section.id}
          projectTypeId={projectTypeId}
          initialGridPosition={parameterInitialGridPosition}
          initialBlockId={currentBlockIdForNewParam ?? undefined}
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
      <AddEditFormGridCellModal
        open={addTextCellModalOpen}
        onClose={handleCloseTextCellModal}
        onSuccess={onSectionUpdated}
        categoryId={section.id}
        blockId={currentBlockIdForNewTextCell}
        maxRow={maxRow}
        initialData={textCellInitialData}
        editingCell={editingTextCell}
      />
    </Box>
  );
};

export default SectionTreeWithModes;
