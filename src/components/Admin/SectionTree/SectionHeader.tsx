import React from 'react';
import { Box, Typography, IconButton, Chip, Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { FormParameterCategory, SectionTreeMode } from '../../../types/formParameters.types';

interface SectionHeaderProps {
  section: FormParameterCategory;
  mode: SectionTreeMode;
  effectiveMode: SectionTreeMode;
  hasSubcategories: boolean;
  hasParameters: boolean;
  hasGridCells: boolean;
  isSuperficiesSection: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
  onSectionModeChange?: (sectionId: number, mode: 'view' | 'editable') => void;
  subprojectId?: number;
  setCreatingSubcategory: (v: boolean) => void;
  setEditCategoryModalOpen: (v: boolean) => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  section,
  mode,
  effectiveMode,
  hasSubcategories,
  hasParameters,
  hasGridCells,
  isSuperficiesSection,
  isExpanded,
  onToggleExpand,
  onEditCategory,
  onDeleteCategory,
  onSectionModeChange,
  subprojectId,
  setCreatingSubcategory,
  setEditCategoryModalOpen,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    {(mode === 'admin' || hasSubcategories || hasParameters || hasGridCells || isSuperficiesSection) && (
      <IconButton size="small" onClick={onToggleExpand} sx={{ mr: 1 }}>
        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    )}
    {mode !== 'admin' && !(hasSubcategories || hasParameters || hasGridCells || isSuperficiesSection) && (
      <Box sx={{ width: 40, mr: 1 }} />
    )}

    <Typography variant="h6" sx={{ flex: 1 }}>
      {section.number} - {section.name}
    </Typography>

    {isSuperficiesSection && (
      <Chip label="Superficies" size="small" color="primary" variant="outlined" sx={{ mr: 1 }} />
    )}
    {hasParameters && !isSuperficiesSection && (
      <>
        <Chip
          label={`${section.form_parameters?.length} parámetros`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mr: 1 }}
        />
        {mode !== 'admin' && subprojectId && onSectionModeChange && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, mr: 1 }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSectionModeChange(section.id, 'view');
              }}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                backgroundColor: effectiveMode === 'view' ? '#1976d2' : '#e0e0e0',
                color: effectiveMode === 'view' ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
                fontWeight: effectiveMode === 'view' ? 'bold' : 'normal',
                transition: 'background-color 0.2s',
              }}
            >
              Vista
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSectionModeChange(section.id, 'editable');
              }}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                backgroundColor: effectiveMode === 'editable' ? '#1976d2' : '#e0e0e0',
                color: effectiveMode === 'editable' ? 'white' : 'black',
                border: 'none',
                borderRadius: '0 4px 4px 0',
                cursor: 'pointer',
                fontWeight: effectiveMode === 'editable' ? 'bold' : 'normal',
                transition: 'background-color 0.2s',
              }}
            >
              Editable
            </button>
          </Box>
        )}
      </>
    )}

    {mode === 'admin' && (
      <>
        <Tooltip title="Editar sección">
          <IconButton
            size="small"
            onClick={() => {
              setCreatingSubcategory(false);
              setEditCategoryModalOpen(true);
            }}
            sx={{ mr: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar sección">
          <IconButton size="small" onClick={onDeleteCategory} sx={{ mr: 0.5 }} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    )}
  </Box>
);
