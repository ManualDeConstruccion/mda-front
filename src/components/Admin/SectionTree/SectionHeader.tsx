import React, { useMemo } from 'react';
import { Box, Typography, IconButton, Chip, Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { FormParameterCategory, FormParameter, SectionTreeMode } from '../../../types/formParameters.types';

/** Parámetro obligatorio: is_required (integration) y no calculado (core is_calculated false). */
function isObligatoryParam(p: FormParameter): boolean {
  if (!p.is_required) return false;
  const isCalculated = p.parameter_definition_is_calculated
    ?? (typeof p.parameter_definition === 'object' ? p.parameter_definition?.is_calculated : undefined);
  return !isCalculated;
}

function getParamCode(p: FormParameter): string | undefined {
  return p.parameter_definition_code
    ?? (typeof p.parameter_definition === 'object' ? p.parameter_definition?.code : undefined);
}

function hasValue(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim() !== '';
  return true;
}

/** Códigos de parámetros obligatorios en esta categoría y sus descendientes. */
function getObligatoryParamCodesInTree(sec: FormParameterCategory): string[] {
  const codes: string[] = [];
  (sec.form_parameters ?? []).forEach((p) => {
    if (isObligatoryParam(p)) {
      const code = getParamCode(p);
      if (code) codes.push(code);
    }
  });
  sec.subcategories?.forEach((sub) => codes.push(...getObligatoryParamCodesInTree(sub)));
  return codes;
}

/** True si la categoría (o alguna descendiente) tiene al menos un campo obligatorio. */
function hasAtLeastOneObligatoryInTree(sec: FormParameterCategory): boolean {
  const inSec = (sec.form_parameters ?? []).some(isObligatoryParam);
  if (inSec) return true;
  return (sec.subcategories ?? []).some(hasAtLeastOneObligatoryInTree);
}

/** True si todos los campos obligatorios de esta categoría y sus descendientes están completados en values. */
function allObligatoryCompletedInTree(sec: FormParameterCategory, values: Record<string, unknown>): boolean {
  const codes = getObligatoryParamCodesInTree(sec);
  if (codes.length === 0) return true;
  return codes.every((code) => hasValue(values[code]));
}

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
  /** Valores del formulario (modo vista/editable) para contar obligatorios completados. */
  values?: Record<string, unknown>;
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
  values,
  setCreatingSubcategory,
  setEditCategoryModalOpen,
}) => {
  // Porcentaje de avance: total de campos obligatorios de la sección y todas las subsecciones, completados / total
  const progressPercent = useMemo(() => {
    const codes = getObligatoryParamCodesInTree(section);
    const total = codes.length;
    if (total === 0) return null;
    if (values == null) return { total, completed: 0, percent: 0 };
    const completed = codes.filter((code) => hasValue(values[code])).length;
    const percent = Math.round((completed / total) * 100);
    return { total, completed, percent };
  }, [section, values]);

  // Campos obligatorios de esta sección (sin subsecciones)
  const fieldsCount = useMemo(() => {
    const params = section.form_parameters ?? [];
    const obligatory = params.filter(isObligatoryParam);
    if (obligatory.length === 0) return { total: 0, completed: 0 };
    if (values == null) return { total: obligatory.length, completed: 0 };
    const completed = obligatory.filter((p) => {
      const code = getParamCode(p);
      return code != null && hasValue(values[code]);
    }).length;
    return { total: obligatory.length, completed };
  }, [section.form_parameters, values]);

  // Subsecciones: solo se cuentan las que tienen al menos un campo obligatorio; completa = todos sus obligatorios completados
  const subsectionsCount = useMemo(() => {
    const subs = section.subcategories ?? [];
    if (subs.length === 0) return { total: 0, completed: 0 };
    const withObligatory = subs.filter(hasAtLeastOneObligatoryInTree);
    const total = withObligatory.length;
    if (total === 0) return { total: 0, completed: 0 };
    if (values == null) return { total, completed: 0 };
    const completed = withObligatory.filter((sub) => allObligatoryCompletedInTree(sub, values)).length;
    return { total, completed };
  }, [section.subcategories, values]);

  const fieldsChipLabel =
    fieldsCount.total === 0
      ? '0 campos'
      : values != null
        ? `${fieldsCount.completed}/${fieldsCount.total} campos obligatorios`
        : `${fieldsCount.total} campos`;

  const subsectionsChipLabel =
    subsectionsCount.total === 0
      ? null
      : values != null
        ? `${subsectionsCount.completed}/${subsectionsCount.total} subsecciones completas`
        : `${subsectionsCount.total} subsecciones`;

  // Verde si todos completados; rojo si quedan pendientes (solo cuando hay values)
  const fieldsChipColor =
    values != null && fieldsCount.total > 0
      ? fieldsCount.completed === fieldsCount.total
        ? 'success'
        : 'error'
      : 'primary';

  const subsectionsChipColor =
    values != null && subsectionsCount.total > 0
      ? subsectionsCount.completed === subsectionsCount.total
        ? 'success'
        : 'error'
      : 'primary';

  const progressChipColor =
    progressPercent != null && values != null && progressPercent.total > 0
      ? progressPercent.percent === 100
        ? 'success'
        : 'error'
      : 'primary';

  return (
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

    {(hasParameters || hasSubcategories) && (
      <>
        {progressPercent != null && progressPercent.total > 0 && (
          <Chip
            label={`${progressPercent.percent}% avance`}
            size="small"
            color={progressChipColor}
            variant="outlined"
            sx={{ mr: 1 }}
          />
        )}
        {hasParameters && (
          <Chip
            label={fieldsChipLabel}
            size="small"
            color={fieldsChipColor}
            variant="outlined"
            sx={{ mr: 1 }}
          />
        )}
        {hasSubcategories && subsectionsChipLabel != null && (
          <Chip
            label={subsectionsChipLabel}
            size="small"
            color={subsectionsChipColor}
            variant="outlined"
            sx={{ mr: 1 }}
          />
        )}
        {mode !== 'admin' && subprojectId && onSectionModeChange && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, mr: 1 }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSectionModeChange(section.id, 'view');
              }}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                backgroundColor: effectiveMode === 'view' ? '#1976d2' : '#e0e0e0',
                color: effectiveMode === 'view' ? 'white' : 'black',
                border: 'none',
                borderRadius: '6px 0 0 6px',
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
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                backgroundColor: effectiveMode === 'editable' ? '#1976d2' : '#e0e0e0',
                color: effectiveMode === 'editable' ? 'white' : 'black',
                border: 'none',
                borderRadius: '0 6px 6px 0',
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
};
