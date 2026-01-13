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
   * Retorna:
   * - FieldHelpTextData si existe en BD
   * - {} (objeto vacío) si ya se consultó pero no existe en BD (para evitar llamadas individuales)
   * - undefined solo si aún está cargando
   */
  const getHelpText = (
    model: string, 
    field: string
  ): FieldHelpTextData | {} | undefined => {
    // Si aún está cargando, retornar undefined para que el componente espere
    if (isLoading || !data) return undefined;
    
    const key = `${model}.${field}`;
    const helpText = data[key];
    
    // Si existe y tiene contenido, retornarlo
    if (helpText && Object.keys(helpText).length > 0) {
      return helpText;
    }
    
    // Si es un objeto vacío {}, significa que ya se consultó pero no existe en BD
    // Retornar {} para indicar que ya se consultó y evitar llamadas individuales
    return {};
  };
  
  return {
    getHelpText,
    isLoading,
    isError,
    data, // Acceso directo a todos los datos si se necesita
  };
};

