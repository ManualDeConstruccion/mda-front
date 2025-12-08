// src/components/common/HelpTooltip/HelpTooltip.tsx

import React, { useState, useRef, useEffect } from 'react';
import { HelpOutline } from '@mui/icons-material';
import { useFieldHelpText, FieldHelpTextData } from '../../../hooks/useFieldHelpText';
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
  // Opcional: datos precargados desde batch (evita llamada individual)
  // Puede ser FieldHelpTextData si existe, {} si no existe en BD, o undefined si aún carga
  helpTextData?: FieldHelpTextData | {};
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  modelName,
  fieldName,
  position = 'top',
  defaultBriefText = '',
  defaultExtendedText,
  defaultMedia,
  helpTextData,
}) => {
  // PRIORIDAD: 1) Datos de BD (desde batch o query individual), 2) Valores por defecto
  
  // Si se proporcionan datos precargados (batch), usarlos directamente
  // Si no, cargar individualmente (fallback para compatibilidad)
  const shouldUseIndividualQuery = helpTextData === undefined;
  
  const { data: helpTextFromQuery, isLoading: isLoadingQuery } = useFieldHelpText(
    modelName, 
    fieldName,
    { enabled: shouldUseIndividualQuery }
  );
  
  // Determinar qué datos usar:
  // 1. Si hay datos precargados (batch), usarlos
  // 2. Si no hay datos precargados, usar datos de query individual
  const helpText = helpTextData !== undefined ? helpTextData : helpTextFromQuery;
  
  // Verificar si helpText es un FieldHelpTextData válido
  // Un objeto vacío {} significa que se consultó pero no existe en BD
  // Un objeto con 'brief_text' significa que existe en BD
  const hasBriefText = helpText && 
                       typeof helpText === 'object' && 
                       'brief_text' in helpText &&
                       typeof (helpText as any).brief_text === 'string' &&
                       (helpText as any).brief_text.trim().length > 0;
  
  // Verificar si es un objeto vacío (se consultó pero no existe)
  const isEmptyObject = helpText && 
                        typeof helpText === 'object' && 
                        Object.keys(helpText).length === 0;
  
  // PRIORIDAD: 1) Datos de BD si existen y tienen brief_text, 2) Valores por defecto
  // Si es un objeto vacío {}, significa que se consultó pero no existe, usar valores por defecto
  // Si tiene brief_text, usar datos de BD
  const briefText = hasBriefText 
    ? (helpText as FieldHelpTextData).brief_text 
    : defaultBriefText;
  const extendedText = hasBriefText 
    ? (helpText as FieldHelpTextData).extended_text 
    : defaultExtendedText;
  const media = hasBriefText 
    ? (helpText as FieldHelpTextData).media 
    : defaultMedia;
  
  // Si no hay briefText ni defaultBriefText, no mostrar tooltip
  if (!briefText) {
    return null;
  }
  const [showBrief, setShowBrief] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Calcular posición cuando el tooltip se extiende
    if (showExtended && containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;

      // Calcular posición según la posición especificada
      switch (position) {
        case 'top':
          top = containerRect.top - tooltipRect.height - 8;
          left = containerRect.left + containerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = containerRect.bottom + 8;
          left = containerRect.left + containerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = containerRect.top + containerRect.height / 2 - tooltipRect.height / 2;
          left = containerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = containerRect.top + containerRect.height / 2 - tooltipRect.height / 2;
          left = containerRect.right + 8;
          break;
      }

      // Ajustar si se sale de la pantalla
      const padding = 16;
      if (top < padding) top = padding;
      if (left < padding) left = padding;
      if (top + tooltipRect.height > window.innerHeight - padding) {
        top = window.innerHeight - tooltipRect.height - padding;
      }
      if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
      }

      setTooltipPosition({ top, left });
    } else {
      setTooltipPosition(null);
    }
  }, [showExtended, position]);

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
        <div 
          ref={tooltipRef}
          className={`${styles.tooltip} ${styles[position]} ${showExtended ? styles.extended : ''}`}
          style={showExtended && tooltipPosition ? {
            position: 'fixed',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            margin: 0,
            transformOrigin: 'center center',
          } : undefined}
          onMouseEnter={handleMouseEnter} // Mantener el tooltip visible cuando el mouse está sobre él
          onMouseLeave={handleMouseLeave}
        >
          <div className={styles.tooltipContent}>
            <p className={styles.briefText}>{briefText}</p>
            {showExtended && (
              <div className={styles.extendedContent}>
                {extendedText && (
                  <p className={styles.extendedText}>{extendedText}</p>
                )}
                {media?.images && media.images.length > 0 && (
                  <div className={styles.mediaSection}>
                    {media.images.map((img: string, idx: number) => (
                      <img key={idx} src={img} alt={`Ayuda ${idx + 1}`} className={styles.mediaImage} />
                    ))}
                  </div>
                )}
                {media?.videos && media.videos.length > 0 && (
                  <div className={styles.mediaSection}>
                    {media.videos.map((video: string, idx: number) => (
                      <video key={idx} src={video} controls className={styles.mediaVideo} />
                    ))}
                  </div>
                )}
                {media?.animations && media.animations.length > 0 && (
                  <div className={styles.mediaSection}>
                    {media.animations.map((anim: string, idx: number) => (
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

