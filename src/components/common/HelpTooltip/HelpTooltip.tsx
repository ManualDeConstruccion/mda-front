// src/components/common/HelpTooltip/HelpTooltip.tsx

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  /** Tamaño del ícono: small (16px), medium (22px) */
  iconSize?: 'small' | 'medium';
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
  iconSize = 'small',
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
  // Aceptar extended_text (FieldHelpTextData) o help_extended (payload de FormGridCell / API)
  const extendedTextRaw = hasBriefText
    ? ((helpText as Record<string, unknown>).extended_text ?? (helpText as Record<string, unknown>).help_extended ?? '')
    : defaultExtendedText ?? '';
  const extendedText = typeof extendedTextRaw === 'string' ? extendedTextRaw.trim() : String(extendedTextRaw ?? '').trim();
  const media = hasBriefText 
    ? (helpText as FieldHelpTextData).media 
    : defaultMedia;
  // URLs para web del trámite y video tutorial (aceptar help_web_url/help_video_url del payload)
  const helpWebUrl = (hasBriefText
    ? ((helpText as FieldHelpTextData).help_web_url ?? (helpText as Record<string, unknown>).help_web_url ?? '')
    : '')?.trim() ?? '';
  const helpVideoUrl = (hasBriefText
    ? ((helpText as FieldHelpTextData).help_video_url ?? (helpText as Record<string, unknown>).help_video_url ?? '')
    : '')?.trim() ?? '';

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

  const padding = 16;
  const maxW = showExtended ? Math.min(600, window.innerWidth - padding * 2) : Math.min(300, window.innerWidth - padding * 2);

  useLayoutEffect(() => {
    if (!showBrief || !containerRef.current || !tooltipRef.current) {
      setTooltipPosition(null);
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;
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
    if (top < padding) top = padding;
    if (left < padding) left = padding;
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding;
    }
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    if (left < padding) left = padding;
    setTooltipPosition({ top, left });
  }, [showBrief, showExtended, position]);

  const handleMouseEnter = () => {
    setShowBrief(true);
    if (extendedText || media || helpWebUrl || helpVideoUrl) {
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

  const iconClass = iconSize === 'medium' ? `${styles.helpIcon} ${styles.helpIconMedium}` : styles.helpIcon;

  const tooltipContent = showBrief ? (
    <div
      ref={tooltipRef}
      className={`${styles.tooltip} ${styles.tooltipPortal} ${showExtended ? styles.extended : ''}`}
      style={{
        position: 'fixed',
        ...(tooltipPosition
          ? {
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              opacity: 1,
              maxWidth: `${maxW}px`,
              margin: 0,
              transform: 'none',
            }
          : { opacity: 0, pointerEvents: 'none', left: -9999, top: 0, maxWidth: `${maxW}px` }),
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.tooltipContent}>
        <p className={styles.briefText}>{briefText}</p>
        {showExtended && (
          <div className={styles.extendedContent}>
            {extendedText ? (
              <p className={styles.extendedText}>{extendedText}</p>
            ) : (
              // Si no hay texto extendido pero sí links, dejar espacio para los enlaces
              null
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
            {(helpWebUrl || helpVideoUrl) && (
              <div className={styles.tooltipFooter}>
                {helpWebUrl && (
                  <a href={helpWebUrl} target="_blank" rel="noopener noreferrer" className={styles.tooltipLink}>
                    Ir a web del trámite
                  </a>
                )}
                {helpVideoUrl && (
                  <a href={helpVideoUrl} target="_blank" rel="noopener noreferrer" className={styles.tooltipLink}>
                    Ir a tutorial
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={styles.helpTooltipContainer}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <HelpOutline className={iconClass} fontSize={iconSize === 'medium' ? 'medium' : 'small'} />
      {showBrief && typeof document !== 'undefined' && document.body
        ? createPortal(tooltipContent, document.body)
        : null}
    </div>
  );
};

export default HelpTooltip;

