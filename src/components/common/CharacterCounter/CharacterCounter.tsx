import React from 'react';
import styles from './CharacterCounter.module.scss';

interface CharacterCounterProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  label: string;
  name: string;
  error?: string;
  multiline?: boolean;
  required?: boolean;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({
  value,
  onChange,
  maxLength,
  label,
  name,
  error,
  multiline = false,
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={styles.inputContainer}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>(obligatorio)</span>}
      </label>
      
      <InputComponent
        name={name}
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        className={`${styles.input} ${error ? styles.error : ''}`}
        {...(multiline ? { rows: 4 } : { type: 'text' })}
      />
      
      <div className={styles.footer}>
        <span className={`${styles.counter} ${value.length === maxLength ? styles.limit : ''}`}>
          {value.length}/{maxLength}
        </span>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    </div>
  );
};

export default CharacterCounter; 