import React from 'react';
import styles from './PrimaryButton.module.scss';

export interface PrimaryButtonProps {
  type?: 'button' | 'submit';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  type = 'button',
  children,
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
}) => {
  return (
    <button
      type={type}
      className={`${styles.button} ${fullWidth ? styles.fullWidth : ''} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden />
          <span>Espere...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default PrimaryButton;
