// src/hooks/useModalHelpTexts.ts

import { useBatchFieldHelpText, BatchFieldHelpTextRequest } from './useBatchFieldHelpText';
import { FieldHelpTextData } from './useFieldHelpText';

/**
 * Hook para cargar todos los textos de ayuda necesarios para un modal completo.
 * 
 * Este hook simplifica el uso de useBatchFieldHelpText proporcionando
 * una función helper para obtener textos por modelo y campo.
 * 
 * @param fields Array de objetos {model, field} con los campos a cargar
 * @returns Objeto con función helper para obtener textos y el estado de carga
 * 
 * @example
 * const modalFields = [
 *   { model: 'Building', field: 'code' },
 *   { model: 'Building', field: 'name' },
 *   { model: 'ProjectLevel', field: 'code' }
 * ];
 * 
 * const { getHelpText, isLoading } = useModalHelpTexts(modalFields);
 * 
 * // En el componente:
 * const buildingCodeHelp = getHelpText('Building', 'code');
 */
export const useModalHelpTexts = (fields: BatchFieldHelpTextRequest[]) => {
  const { data, isLoading, isError } = useBatchFieldHelpText(fields);
  
  /**
   * Obtiene el texto de ayuda para un modelo y campo específico.
   * Retorna undefined si no existe.
   */
  const getHelpText = (
    model: string, 
    field: string
  ): FieldHelpTextData | undefined => {
    if (!data) return undefined;
    const key = `${model}.${field}`;
    const helpText = data[key];
    // Retorna undefined si es un objeto vacío (no existe en BD)
    return helpText && Object.keys(helpText).length > 0 ? helpText : undefined;
  };
  
  return {
    getHelpText,
    isLoading,
    isError,
    data, // Acceso directo a todos los datos si se necesita
  };
};

