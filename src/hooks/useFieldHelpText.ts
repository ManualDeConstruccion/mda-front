// src/hooks/useFieldHelpText.ts

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export interface FieldHelpTextData {
  id?: number;
  model_name: string;
  field_name: string;
  brief_text: string;
  extended_text?: string;
  media?: {
    images?: string[];
    videos?: string[];
    animations?: string[];
  };
  is_active?: boolean;
}

interface BatchFieldHelpTextResponse {
  [key: string]: FieldHelpTextData; // "Model.field": FieldHelpTextData
}

/**
 * Hook para cargar un texto de ayuda individual.
 * Internamente usa el endpoint batch para mantener consistencia y optimización.
 * 
 * @param modelName Nombre del modelo (ej: 'Building', 'ProjectLevel')
 * @param fieldName Nombre del campo (ej: 'code', 'name')
 * @param options Opciones adicionales (ej: enabled)
 * @returns Query result con el texto de ayuda
 */
export const useFieldHelpText = (
  modelName: string, 
  fieldName: string,
  options?: { enabled?: boolean }
) => {
  const { accessToken } = useAuth();
  
  return useQuery<FieldHelpTextData>({
    queryKey: ['fieldHelpText', modelName, fieldName],
    queryFn: async () => {
      // Usar batch internamente, incluso para un solo campo
      // Esto mantiene consistencia y aprovecha las optimizaciones del batch
      const response = await axios.post<BatchFieldHelpTextResponse>(
        `${API_URL}/api/project-engines/help-texts/batch_by_model_field/`,
        { fields: [{ model: modelName, field: fieldName }] },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      // Extraer el resultado del diccionario batch
      const key = `${modelName}.${fieldName}`;
      return response.data[key] || {};
    },
    enabled: (options?.enabled !== false) && !!accessToken && !!modelName && !!fieldName,
    staleTime: 1000 * 60 * 60, // Cache por 1 hora (las ayudas no cambian frecuentemente)
  });
};

