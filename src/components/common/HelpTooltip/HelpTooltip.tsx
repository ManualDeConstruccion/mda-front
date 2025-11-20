// src/components/common/HelpTooltip/HelpTooltip.tsx

import React, { useState, useRef, useEffect } from 'react';
import { HelpOutline } from '@mui/icons-material';
import styles from './HelpTooltip.module.scss';

interface HelpMedia {
  images?: string[];
  videos?: string[];
  animations?: string[];
}

interface HelpTooltipProps {
  briefText: string;
  extendedText?: string;
  media?: HelpMedia;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  briefText,
  extendedText,
  media,
  position = 'top',
}) => {
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

