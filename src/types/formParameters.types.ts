/**
 * Tipos compartidos para parámetros de formulario, categorías y celdas de grilla.
 * Usados por SectionTreeWithModes, GridCell, GridRow, modales y hooks de parámetros.
 */

export type SectionTreeMode = 'view' | 'editable' | 'admin';

/** Alerta de UI devuelta por el backend (validadores por categoría). */
export interface UIAlert {
  code: string;
  level: 'error' | 'warning' | 'info' | 'success';
  message: string;
  category_code?: string;
  affected_params?: string[];
  action_label?: string | null;
}

export interface FormType {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Motor de sección (componente especial: superficies, etc.). */
export interface SectionEngine {
  id: number;
  code: string;
  name: string;
  description?: string | null;
}

/** Bloque dentro de una sección: grilla o motor. */
export interface FormCategoryBlock {
  id: number;
  order: number;
  block_type: 'grid' | 'engine';
  section_engine?: SectionEngine | null;
  /** Nombre del bloque (en motores: se muestra cuando está colapsado). */
  name?: string;
  /** Si es true, en vista usuario final el bloque se muestra colapsable. */
  is_collapsible?: boolean;
}

export interface FormParameterCategory {
  id: number;
  code: string;
  number: string;
  name: string;
  description?: string;
  parent?: number | null;
  order: number;
  is_active: boolean;
  blocks?: FormCategoryBlock[];
  form_parameters?: FormParameter[];
  grid_cells?: FormGridCell[];
  subcategories?: FormParameterCategory[];
  display_config?: {
    layout_type?: string;
    grid_config?: {
      rows_columns?: Record<string, number>; // "1": 3, "2": 1, etc.
    };
  };
}

export interface FormParameter {
  id: number;
  category: number;
  block?: number | null;
  parameter_definition: number | {
    id: number;
    code: string;
    name: string;
    data_type: string;
    unit?: string;
    is_calculated?: boolean;
  };
  order: number;
  is_required: boolean;
  is_visible: boolean;
  grid_row?: number;
  grid_column?: number;
  grid_span?: number;
  parameter_definition_name?: string;
  parameter_definition_code?: string;
  /** Si el parámetro es calculado (solo lectura en grilla). Incluido cuando parameter_definition viene como ID. */
  parameter_definition_is_calculated?: boolean;
}

export interface FormGridCellStyle {
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: 'lightblue' | 'transparent';
  fontWeight?: 'normal' | 'bold';
  cellType?: 'normal' | 'title';
}

export interface FormGridCell {
  id: number;
  category: number;
  block?: number | null;
  grid_row: number;
  grid_column: number;
  grid_span: number;
  content: string;
  style?: FormGridCellStyle | Record<string, unknown>;
  is_active: boolean;
}

/** Props del componente GridCell (celda de grilla). */
export interface GridCellProps {
  cell: FormParameter | FormGridCell;
  row: number;
  column: number;
  span: number;
  isDragging?: boolean;
  onEdit?: (cell: FormParameter | FormGridCell) => void;
  onDelete?: (cell: FormParameter | FormGridCell) => void;
  mode: SectionTreeMode;
  isParameter: boolean;
  values?: Record<string, any>;
  onChange?: (code: string, value: any) => void;
}
