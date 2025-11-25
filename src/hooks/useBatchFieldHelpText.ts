// src/hooks/useBatchFieldHelpText.ts

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FieldHelpTextData } from './useFieldHelpText';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export interface BatchFieldHelpTextRequest {
  model: string;
  field: string;
}

export interface BatchFieldHelpTextResponse {
  [key: string]: FieldHelpTextData; // "Model.field": FieldHelpTextData
}

/**
 * Hook para cargar múltiples textos de ayuda en una sola llamada.
 * 
 * @param fields Array de objetos {model, field} con los campos a cargar
 * @returns Query result con los textos indexados por "Model.field"
 * 
 * @example
 * const { data } = useBatchFieldHelpText([
 *   { model: 'Building', field: 'code' },
 *   { model: 'Building', field: 'name' },
 *   { model: 'ProjectLevel', field: 'code' }
 * ]);
 * // data = { "Building.code": {...}, "Building.name": {...}, "ProjectLevel.code": {...} }
 */
export const useBatchFieldHelpText = (fields: BatchFieldHelpTextRequest[]) => {
  const { accessToken } = useAuth();
  
  // Crear una clave única para la query basada en los campos ordenados
  const queryKey = ['batchFieldHelpText', 
    ...fields
      .map(f => `${f.model}.${f.field}`)
      .sort()
      .join(',')
  ];
  
  return useQuery<BatchFieldHelpTextResponse>({
    queryKey,
    queryFn: async () => {
      if (fields.length === 0) {
        return {};
      }
      
      const response = await axios.post<BatchFieldHelpTextResponse>(
        `${API_URL}/api/project-engines/help-texts/batch_by_model_field/`,
        { fields },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    },
    enabled: !!accessToken && fields.length > 0,
    staleTime: 1000 * 60 * 60, // Cache por 1 hora (las ayudas no cambian frecuentemente)
  });
};

