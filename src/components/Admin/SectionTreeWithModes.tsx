import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Typography, Collapse, Button } from '@mui/material';
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
import { useFormTypes } from '../../hooks/useFormTypes';
import { useSectionExpansion } from '../../hooks/useSectionExpansion';
import { useSectionValues } from '../../hooks/useSectionValues';
import { useGridLayout } from '../../hooks/useGridLayout';
import { useFormCategoryMutations } from '../../hooks/useFormCategoryMutations';
import EditFormParameterCategoryModal from './EditFormParameterCategoryModal';
import AddFormParameterModal from './AddFormParameterModal';
import EditFormParameterModal from './EditFormParameterModal';
import AddEditFormGridCellModal from './AddEditFormGridCellModal';
import GridRow from './GridRow';
import SuperficiesSectionContent from './SuperficiesSectionContent';
import {
  CategoryAlertsBlock,
  SectionTypeInfo,
  EmptyGridState,
  SectionTypeSelector,
  SectionHeader,
  SectionGrid,
} from './SectionTree';
import type {
  SectionTreeMode,
  UIAlert,
  FormType,
  FormParameterCategory,
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
  onChange?: (categoryId: number, code: string, value: any) => void; // Callback para cambios (modo editable); categoryId es la sección que contiene el parámetro
  onSectionExpand?: (sectionId: number) => Promise<void>; // Callback cuando se expande una sección (para cargar valores)
  activeSectionId?: number; // ID de la sección que debe estar expandida por defecto
  sectionMode?: 'view' | 'editable'; // Modo específico para esta sección (solo para usuario final)
  onSectionModeChange?: (sectionId: number, mode: 'view' | 'editable') => void; // Callback cuando cambia el modo de la sección
  getSectionMode?: (sectionId: number) => 'view' | 'editable' | undefined; // Función para obtener el modo de cualquier sección (para subcategorías)
  /** Alertas por categoría (categoryId -> alertas). Se muestran bajo la descripción de la categoría. */
  categoryAlerts?: Record<number, UIAlert[]>;
}

// Re-exportar GridCell y SortableGridCell para compatibilidad con importadores que usan SectionTreeWithModes
export { default as GridCell, SortableGridCell } from './GridCell';

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
  const [selectTypeModalOpen, setSelectTypeModalOpen] = useState(false);
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);
  const { formTypes } = useFormTypes({ enabled: mode === 'admin' });
  
  const [gridCells, setGridCells] = useState<FormGridCell[]>(section.grid_cells || []);
  useEffect(() => {
    if (section.grid_cells) {
      setGridCells(section.grid_cells);
    }
  }, [section.grid_cells]);

  const {
    maxRow,
    gridLayout,
    allCells,
    getColumnsForRow,
    hasParameters,
    hasGridCells,
    isCellParameter,
  } = useGridLayout(section, gridCells, mode);
  
  const hasSubcategories = section.subcategories && section.subcategories.length > 0;
  
  // Determinar si la sección usa la interfaz de grilla (solo para tipo "general" explícitamente)
  const formTypeName = typeof section.form_type === 'object' 
    ? section.form_type?.name 
    : (section.form_type_name || null);
  // Normalizar: si es cadena vacía, tratarla como null
  const normalizedFormTypeName = (formTypeName === '' || formTypeName === null || formTypeName === undefined) ? null : formTypeName;
  // Solo mostrar grilla si el tipo es explícitamente "general", no si es undefined/null
  const useGridInterface = normalizedFormTypeName === 'general';
  // Sección especial "superficies": pestañas Resumen / Pisos / Niveles / Polígonos (solo vista/editable con subprojectId)
  const isSuperficiesSection = normalizedFormTypeName === 'superficies' && mode !== 'admin' && !!subprojectId;

  // Verificar si form_type es realmente undefined/null (no solo falsy)
  // IMPORTANTE: Si es tipo "general", NO es undefined, así que no mostrar selector
  const isFormTypeUndefined = normalizedFormTypeName === null || normalizedFormTypeName === undefined || normalizedFormTypeName === '';

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

  // Sensores para drag and drop (solo modo admin)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
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
    setActiveRow(null);
    
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

  // Handler para abrir modal de agregar celda de texto
  const handleOpenAddTextCellModal = (row: number, column: number) => {
    setTextCellInitialData({ row, column, span: 1, content: '' });
    setEditingTextCell(null);
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
  }, [effectiveMode, maxRow, gridLayout, activeId, hasParameters, section, values, onChange, addRowBefore, addRowAfter, deleteRow, updateDisplayConfig, handleDeleteCell, getColumnsForRow]);
  
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

  // Renderizar según el modo
  const renderContent = () => {
    // Si no usa interfaz de grilla y está en modo admin, mostrar mensaje
    // Pero solo si tiene un tipo definido (no mostrar mensaje si es null/undefined/vacío)
    if (mode === 'admin' && !useGridInterface && normalizedFormTypeName) {
      return (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Esta sección usa el tipo "{normalizedFormTypeName}". La interfaz personalizada para este tipo aún no está implementada.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        {/* Grilla compartida por todos los modos */}
        {renderGrid()}
      </Box>
    );
  };

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
          {mode === 'admin' && !hasParameters && !hasSubcategories && !hasGridCells && isFormTypeUndefined && !useGridInterface && (
            <SectionTypeSelector
              formTypes={formTypes}
              onSelectType={async (formTypeId) => {
                try {
                  await mutations.patchCategory({ form_type: formTypeId });
                } catch (error) {
                  console.error('Error al actualizar tipo de formulario:', error);
                  alert('Error al actualizar el tipo de formulario');
                }
              }}
            />
          )}
          {mode === 'admin' && normalizedFormTypeName && normalizedFormTypeName !== 'general' && (
            <SectionTypeInfo formTypeName={normalizedFormTypeName} />
          )}
          
          {/* Sección superficies: pestañas Resumen / Pisos / Niveles / Polígonos */}
          {isSuperficiesSection && subprojectId && (
            <Box sx={{ mt: 2, ml: 0 }}>
              <SuperficiesSectionContent subprojectId={subprojectId} />
            </Box>
          )}

          {/* Renderizar contenido: SOLO si usa grilla (tipo "general") o si tiene contenido */}
          {/* Si es tipo "general", siempre mostrar la grilla, incluso si está vacía */}
          {!isSuperficiesSection && (useGridInterface || hasParameters || hasSubcategories || hasGridCells) ? (
            renderContent()
          ) : null}

          {/* Subcategorías (no en sección superficies) */}
          {hasSubcategories && !isSuperficiesSection && (
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
        category={creatingSubcategory ? null : section} // null para crear subcategoría, section para editar
        projectTypeId={projectTypeId}
        parentCategories={allSections}
        defaultParentId={creatingSubcategory ? section.id : undefined} // Establecer esta sección como padre solo al crear subcategoría
        blockFormTypeChange={!!section.form_type && !creatingSubcategory} // Bloquear cambio si ya tiene tipo y no estamos creando subcategoría
      />

        <AddFormParameterModal
          open={addParameterModalOpen}
          onClose={() => {
            setAddParameterModalOpen(false);
            setParameterInitialGridPosition(null);
          }}
          onSuccess={onSectionUpdated}
          categoryId={section.id}
          projectTypeId={projectTypeId}
          initialGridPosition={parameterInitialGridPosition}
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
        maxRow={maxRow}
        initialData={textCellInitialData}
        editingCell={editingTextCell}
      />
    </Box>
  );
};

export default SectionTreeWithModes;
