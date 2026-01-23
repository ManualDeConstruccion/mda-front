// src/components/DynamicFormSection/DynamicFormSection.tsx

import React, { useState } from 'react';
import { DynamicField } from '../DynamicField/DynamicField';
import styles from './DynamicFormSection.module.css';
import type { FormSection } from '../../hooks/useFormParameters';

interface DynamicFormSectionProps {
  section: FormSection;
  getParameterValue: (code: string) => any;
  onParameterChange: (code: string, value: any, dataType: string) => void;
  isSaving?: boolean;
  disabled?: boolean;
  showCompleteness?: boolean;
  completeness?: { total: number; filled: number; percentage: number };
}

export const DynamicFormSection: React.FC<DynamicFormSectionProps> = ({
  section,
  getParameterValue,
  onParameterChange,
  isSaving = false,
  disabled = false,
  showCompleteness = true,
  completeness,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const visibleParameters = section.form_parameters.filter(fp => fp.is_visible);
  const hasSubcategories = section.subcategories && section.subcategories.length > 0;

  // No renderizar si:
  // - La sección está inactiva
  // - No tiene parámetros visibles Y no tiene subsecciones
  if (!section.is_active || (visibleParameters.length === 0 && !hasSubcategories)) {
    return null;
  }

  // ============================================================================
  // RENDERIZADO DE ENCABEZADO
  // ============================================================================

  const renderHeader = () => (
    <div className={styles.header} onClick={() => setIsCollapsed(!isCollapsed)}>
      <div className={styles.headerLeft}>
        <button
          type="button"
          className={styles.collapseButton}
          aria-label={isCollapsed ? 'Expandir sección' : 'Contraer sección'}
        >
          {isCollapsed ? '▶' : '▼'}
        </button>
        <h3 className={styles.title}>
          {section.number && <span className={styles.number}>{section.number}.</span>}
          {section.name}
        </h3>
      </div>
      
      {showCompleteness && completeness && (
        <div className={styles.completeness}>
          <span className={styles.completenessText}>
            {completeness.filled}/{completeness.total}
          </span>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${completeness.percentage}%` }}
            />
          </div>
          <span className={styles.percentage}>{completeness.percentage}%</span>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // RENDERIZADO DE DESCRIPCIÓN
  // ============================================================================

  const renderDescription = () => {
    if (!section.description) return null;
    
    return (
      <div className={styles.description}>
        {section.description}
      </div>
    );
  };

  // ============================================================================
  // RENDERIZADO DE PARÁMETROS
  // ============================================================================

  const renderParameters = () => {
    if (isCollapsed) return null;

    // Organizar parámetros en grid si tienen grid_row/grid_column
    const hasGridLayout = visibleParameters.some(fp => fp.grid_row !== undefined);

    if (hasGridLayout) {
      return renderGridLayout();
    }

    return renderListLayout();
  };

  const renderListLayout = () => (
    <div className={styles.parametersList}>
      {visibleParameters.map(formParameter => (
        <DynamicField
          key={formParameter.id}
          formParameter={formParameter}
          value={getParameterValue(formParameter.parameter_definition.code)}
          onChange={(value) => 
            onParameterChange(
              formParameter.parameter_definition.code,
              value,
              formParameter.parameter_definition.data_type
            )
          }
          disabled={disabled || isSaving}
        />
      ))}
    </div>
  );

  const renderGridLayout = () => {
    // Agrupar parámetros por fila
    const rows = new Map<number, typeof visibleParameters>();
    
    visibleParameters.forEach(fp => {
      const row = fp.grid_row ?? 0;
      if (!rows.has(row)) {
        rows.set(row, []);
      }
      rows.get(row)!.push(fp);
    });

    // Ordenar filas
    const sortedRows = Array.from(rows.entries()).sort((a, b) => a[0] - b[0]);

    return (
      <div className={styles.parametersGrid}>
        {sortedRows.map(([rowIndex, rowParams]) => (
          <div key={rowIndex} className={styles.gridRow}>
            {rowParams
              .sort((a, b) => (a.grid_column ?? 0) - (b.grid_column ?? 0))
              .map(formParameter => (
                <div 
                  key={formParameter.id} 
                  className={styles.gridCell}
                  style={{ 
                    gridColumn: formParameter.grid_span 
                      ? `span ${formParameter.grid_span}` 
                      : undefined 
                  }}
                >
                  <DynamicField
                    formParameter={formParameter}
                    value={getParameterValue(formParameter.parameter_definition.code)}
                    onChange={(value) => 
                      onParameterChange(
                        formParameter.parameter_definition.code,
                        value,
                        formParameter.parameter_definition.data_type
                      )
                    }
                    disabled={disabled || isSaving}
                  />
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  };

  // ============================================================================
  // RENDERIZADO DE SUBSECCIONES
  // ============================================================================

  const renderSubsections = () => {
    if (isCollapsed || !section.subcategories || section.subcategories.length === 0) {
      return null;
    }

    return (
      <div className={styles.subsections}>
        {section.subcategories.map(subsection => (
          <DynamicFormSection
            key={subsection.id}
            section={subsection}
            getParameterValue={getParameterValue}
            onParameterChange={onParameterChange}
            isSaving={isSaving}
            disabled={disabled}
            showCompleteness={showCompleteness}
          />
        ))}
      </div>
    );
  };

  // ============================================================================
  // RENDER FINAL
  // ============================================================================

  return (
    <div className={styles.section}>
      {renderHeader()}
      {!isCollapsed && (
        <>
          {renderDescription()}
          {renderParameters()}
          {renderSubsections()}
        </>
      )}
    </div>
  );
};
