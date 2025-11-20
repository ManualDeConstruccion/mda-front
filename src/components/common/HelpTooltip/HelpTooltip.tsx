// src/components/common/HelpTooltip/HelpTooltip.tsx

import React, { useState, useRef, useEffect } from 'react';
import { HelpOutline } from '@mui/icons-material';
import { useFieldHelpText } from '../../../hooks/useFieldHelpText';
import styles from './HelpTooltip.module.scss';

interface HelpMedia {
  images?: string[];
  videos?: string[];
  animations?: string[];
}

interface HelpTooltipProps {
  modelName: string;  // ej: "Building", "ProjectLevel"
  fieldName: string;  // ej: "code", "name"
  position?: 'top' | 'bottom' | 'left' | 'right';
  // Valores por defecto opcionales si no hay datos en BD
  defaultBriefText?: string;
  defaultExtendedText?: string;
  defaultMedia?: HelpMedia;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  modelName,
  fieldName,
  position = 'top',
  defaultBriefText = '',
  defaultExtendedText,
  defaultMedia,
}) => {
  const { data: helpText } = useFieldHelpText(modelName, fieldName);
  
  // Usar datos de BD si existen, sino usar valores por defecto
  const briefText = helpText?.brief_text || defaultBriefText;
  const extendedText = helpText?.extended_text || defaultExtendedText;
  const media = helpText?.media || defaultMedia;
  
  // Si no hay briefText ni defaultBriefText, no mostrar tooltip
  if (!briefText) {
    return null;
  }
  const [showBrief, setShowBrief] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setShowBrief(true);
    if (extendedText || media) {
      timeoutRef.current = setTimeout(() => {
        setShowExtended(true);
      }, 1000);
    }
  };

  const handleMouseLeave = () => {
    setShowBrief(false);
    setShowExtended(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      className={styles.helpTooltipContainer}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <HelpOutline className={styles.helpIcon} fontSize="small" />
      {showBrief && (
        <div className={`${styles.tooltip} ${styles[position]} ${showExtended ? styles.extended : ''}`}>
          <div className={styles.tooltipContent}>
            <p className={styles.briefText}>{briefText}</p>
            {showExtended && (
              <div className={styles.extendedContent}>
                {extendedText && (
                  <p className={styles.extendedText}>{extendedText}</p>
                )}
                {media?.images && media.images.length > 0 && (
                  <div className={styles.mediaSection}>
                    {media.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`Ayuda ${idx + 1}`} className={styles.mediaImage} />
                    ))}
                  </div>
                )}
                {media?.videos && media.videos.length > 0 && (
                  <div className={styles.mediaSection}>
                    {media.videos.map((video, idx) => (
                      <video key={idx} src={video} controls className={styles.mediaVideo} />
                    ))}
                  </div>
                )}
                {media?.animations && media.animations.length > 0 && (
                  <div className={styles.mediaSection}>
                    {media.animations.map((anim, idx) => (
                      <img key={idx} src={anim} alt={`Animación ${idx + 1}`} className={styles.mediaAnimation} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;

