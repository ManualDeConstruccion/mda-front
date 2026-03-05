import React from 'react';
import styles from './FormInput.module.scss';

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const defaultPasswordRules: PasswordRule[] = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Al menos una mayúscula', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Al menos una minúscula', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'Al menos un número', test: (v) => /[0-9]/.test(v) },
  { id: 'notOnlyNumbers', label: 'No solo números', test: (v) => v.length === 0 || /[^0-9]/.test(v) },
];

export interface FormInputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password';
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  showPasswordToggle?: boolean;
  /** Muestra las reglas de contraseña con checks en tiempo real. Solo aplica cuando type="password". */
  showPasswordRules?: boolean;
  /** Reglas personalizadas; si no se pasan, se usan defaultPasswordRules. */
  passwordRules?: PasswordRule[];
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  autoComplete,
  showPasswordToggle = false,
  showPasswordRules = false,
  passwordRules = defaultPasswordRules,
}) => {
  const inputId = id ?? name ?? `input-${label.replace(/\s/g, '-')}`;
  const [showPassword, setShowPassword] = React.useState(false);
  const inputType = showPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type;
  const rules = type === 'password' && showPasswordRules ? passwordRules : [];
  const ruleResults = rules.map((r) => ({ ...r, met: r.test(value) }));

  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <input
          id={inputId}
          name={name ?? inputId}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`${styles.input} ${error ? styles.hasError : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword((p) => !p)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        )}
      </div>
      {error && (
        <span id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
      {ruleResults.length > 0 && (
        <ul className={styles.passwordRules} aria-live="polite">
          {ruleResults.map(({ id: ruleId, label: ruleLabel, met }) => (
            <li
              key={ruleId}
              className={met ? styles.ruleMet : styles.ruleUnmet}
              aria-label={met ? `Cumple: ${ruleLabel}` : `Falta: ${ruleLabel}`}
            >
              <span className={styles.ruleIcon} aria-hidden>
                {met ? '✓' : '○'}
              </span>
              <span>{ruleLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FormInput;
