import { useState, useEffect, useCallback } from 'react';

/**
 * Valores de una sección: estado local cuando no hay onChange externo,
 * sincronización con externalValues, y onChange que inyecta sectionId.
 */
export function useSectionValues(
  externalValues: Record<string, any>,
  externalOnChange: ((categoryId: number, code: string, value: any) => void) | undefined,
  sectionId: number
) {
  const [localValues, setLocalValues] = useState<Record<string, any>>(externalValues);

  useEffect(() => {
    if (externalValues && Object.keys(externalValues).length > 0) {
      setLocalValues(externalValues);
    }
  }, [externalValues]);

  const handleLocalChange = useCallback((code: string, value: any) => {
    setLocalValues(prev => ({
      ...prev,
      [code]: value,
    }));
  }, []);

  const onChange = useCallback(
    (code: string, value: any) => {
      if (externalOnChange) {
        externalOnChange(sectionId, code, value);
      } else {
        handleLocalChange(code, value);
      }
    },
    [sectionId, externalOnChange, handleLocalChange]
  );

  const values = externalOnChange ? externalValues : localValues;

  return { values, onChange };
}
