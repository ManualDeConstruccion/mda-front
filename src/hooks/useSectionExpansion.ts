import { useState, useEffect } from 'react';
import type { SectionTreeMode } from '../types/formParameters.types';

/**
 * Estado de expansión de una sección del árbol, persistido en sessionStorage.
 * En modo vista todas las secciones inician plegadas; si hay activeSectionId
 * y coincide con esta sección, se expande (solo si no había valor guardado).
 */
export function useSectionExpansion(
  sectionId: number,
  mode: SectionTreeMode,
  activeSectionId?: number
) {
  const storageKey = `section-expanded-${sectionId}`;

  const getInitialExpandedState = (): boolean => {
    if (mode === 'view') {
      return false;
    }
    if (activeSectionId !== undefined && sectionId === activeSectionId) {
      return true;
    }
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored === 'true';
    } catch {
      return false;
    }
  };

  const [isExpanded, setIsExpanded] = useState(getInitialExpandedState);

  // En modo vista forzar plegado; si hay activeSectionId y coincide, expandir (si no había guardado)
  useEffect(() => {
    if (mode === 'view') {
      setIsExpanded(false);
      return;
    }
    if (activeSectionId !== undefined && sectionId === activeSectionId) {
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored === null) {
          setIsExpanded(true);
        }
      } catch {
        setIsExpanded(true);
      }
    }
  }, [activeSectionId, sectionId, storageKey, mode]);

  // Persistir en sessionStorage cuando cambia
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, String(isExpanded));
    } catch {
      // Ignorar errores de sessionStorage
    }
  }, [isExpanded, storageKey]);

  return { isExpanded, setIsExpanded };
}
