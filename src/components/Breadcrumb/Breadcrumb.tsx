// src/components/Breadcrumb/Breadcrumb.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import styles from './Breadcrumb.module.scss';

export interface BreadcrumbItem {
  label: string;
  path?: string; // Si no tiene path, se renderiza como texto (último item)
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  backButton?: {
    label: string;
    onClick: () => void;
  };
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, backButton }) => {
  return (
    <div className={styles.breadcrumbRow}>
      <nav className={styles.breadcrumb}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.path ? (
              <Link to={item.path} className={styles.breadcrumbLink}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.breadcrumbCurrent}>{item.label}</span>
            )}
            {index < items.length - 1 && (
              <ChevronRightIcon className={styles.breadcrumbSeparator} />
            )}
          </React.Fragment>
        ))}
      </nav>
      {backButton && (
        <button 
          className={styles.backButton}
          onClick={backButton.onClick}
        >
          {backButton.label}
        </button>
      )}
    </div>
  );
};

export default Breadcrumb;
