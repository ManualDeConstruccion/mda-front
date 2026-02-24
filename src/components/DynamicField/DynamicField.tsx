// src/components/DynamicField/DynamicField.tsx

import React, { useState, useEffect } from 'react';
import styles from './DynamicField.module.css';
import type { FormParameter } from '../../types/formParameters.types';

interface DynamicFieldProps {
  formParameter: FormParameter;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: string;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({
  formParameter,
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const { parameter_definition, is_required } = formParameter;
  const display_config = (formParameter as FormParameter & { display_config?: unknown }).display_config;
  const paramDef = typeof parameter_definition === 'object' && parameter_definition !== null
    ? parameter_definition as { id: number; code: string; name: string; data_type: string; unit?: string; help_text?: string; is_calculated?: boolean }
    : null;
  const code = paramDef?.code ?? (formParameter.parameter_definition_code ?? '');
  const name = paramDef?.name ?? (formParameter.parameter_definition_name ?? '');
  const data_type = paramDef?.data_type ?? 'text';
  const unit = paramDef?.unit;
  const help_text = paramDef?.help_text;

  const [localValue, setLocalValue] = useState(value ?? '');

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const renderLabel = () => (
    <label htmlFor={code} className={styles.label}>
      {name}
      {is_required && <span className={styles.required}>*</span>}
      {unit && <span className={styles.unit}>({unit})</span>}
    </label>
  );

  const renderHelpText = () => {
    if (!help_text) return null;
    return <p className={styles.helpText}>{help_text}</p>;
  };

  const renderError = () => {
    if (!error) return null;
    return <span className={styles.error}>{error}</span>;
  };

  // ============================================================================
  // RENDERIZADO POR TIPO DE DATO
  // ============================================================================

  const renderInput = () => {
    switch (data_type) {
      // ========================================================================
      // DECIMAL
      // ========================================================================
      case 'decimal':
        return (
          <input
            type="number"
            id={code}
            name={code}
            value={localValue}
            onChange={(e) => handleChange(parseFloat(e.target.value) || null)}
            disabled={disabled}
            step="0.01"
            className={styles.input}
            placeholder={`Ingrese ${name.toLowerCase()}`}
          />
        );

      // ========================================================================
      // INTEGER
      // ========================================================================
      case 'integer':
        return (
          <input
            type="number"
            id={code}
            name={code}
            value={localValue}
            onChange={(e) => handleChange(parseInt(e.target.value) || null)}
            disabled={disabled}
            step="1"
            className={styles.input}
            placeholder={`Ingrese ${name.toLowerCase()}`}
          />
        );

      // ========================================================================
      // BOOLEAN
      // ========================================================================
      case 'boolean':
        return (
          <div className={styles.checkboxWrapper}>
            <input
              type="checkbox"
              id={code}
              name={code}
              checked={localValue === true}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
              className={styles.checkbox}
            />
            <label htmlFor={code} className={styles.checkboxLabel}>
              {display_config?.checkbox_label || name}
            </label>
          </div>
        );

      // ========================================================================
      // TEXT
      // ========================================================================
      case 'text':
        // Si tiene maxLength en display_config, usar textarea
        const isLongText = display_config?.maxLength && display_config.maxLength > 100;

        if (isLongText) {
          return (
            <textarea
              id={code}
              name={code}
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              rows={display_config?.rows || 4}
              maxLength={display_config?.maxLength}
              className={styles.textarea}
              placeholder={`Ingrese ${name.toLowerCase()}`}
            />
          );
        }

        return (
          <input
            type="text"
            id={code}
            name={code}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            maxLength={display_config?.maxLength}
            className={styles.input}
            placeholder={`Ingrese ${name.toLowerCase()}`}
          />
        );

      // ========================================================================
      // DATE
      // ========================================================================
      case 'date':
        return (
          <input
            type="date"
            id={code}
            name={code}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={styles.input}
          />
        );

      default:
        return (
          <div className={styles.unsupported}>
            Tipo de dato no soportado: {data_type}
          </div>
        );
    }
  };

  // ============================================================================
  // RENDER FINAL
  // ============================================================================

  // Para checkbox, el layout es diferente
  if (data_type === 'boolean') {
    return (
      <div className={styles.fieldWrapper}>
        {renderInput()}
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // Para otros tipos
  return (
    <div className={styles.fieldWrapper}>
      {renderLabel()}
      {renderInput()}
      {renderHelpText()}
      {renderError()}
    </div>
  );
};
