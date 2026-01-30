import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { FormParameter, FormGridCell, SectionTreeMode } from '../../../types/formParameters.types';

interface SectionGridProps {
  mode: SectionTreeMode;
  gridContent: React.ReactNode;
  allCells: (FormParameter | FormGridCell)[];
  activeId: string | null;
  sensors: ReturnType<typeof import('@dnd-kit/core').useSensors>;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  isCellParameter: (cell: FormParameter | FormGridCell) => boolean;
  getCellSortId: (cell: FormParameter | FormGridCell) => string;
}

export const SectionGrid: React.FC<SectionGridProps> = ({
  mode,
  gridContent,
  allCells,
  activeId,
  sensors,
  onDragStart,
  onDragOver,
  onDragEnd,
  isCellParameter,
  getCellSortId,
}) => {
  if (mode === 'admin') {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={allCells.map(getCellSortId)}
          strategy={rectSortingStrategy}
        >
          {gridContent}
          <DragOverlay>
            {activeId
              ? (() => {
                  const activeCell = allCells.find((cell) => getCellSortId(cell) === activeId);
                  if (!activeCell) return null;
                  const isParam = isCellParameter(activeCell);
                  const content = isParam
                    ? (() => {
                        const param = activeCell as FormParameter;
                        const paramDef =
                          typeof param.parameter_definition === 'object' && param.parameter_definition !== null
                            ? param.parameter_definition
                            : null;
                        return paramDef?.name || param.parameter_definition_name || 'Parámetro';
                      })()
                    : (activeCell as FormGridCell).content;
                  return (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'background.paper',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        boxShadow: 4,
                        opacity: 0.9,
                      }}
                    >
                      <Typography>{content}</Typography>
                    </Box>
                  );
                })()
              : null}
          </DragOverlay>
        </SortableContext>
      </DndContext>
    );
  }
  return <>{gridContent}</>;
};
