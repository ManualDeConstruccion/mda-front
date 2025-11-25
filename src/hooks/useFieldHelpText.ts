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

export const useFieldHelpText = (
  modelName: string, 
  fieldName: string,
  options?: { enabled?: boolean }
) => {
  const { accessToken } = useAuth();
  
  return useQuery<FieldHelpTextData>({
    queryKey: ['fieldHelpText', modelName, fieldName],
    queryFn: async () => {
      const response = await axios.get<FieldHelpTextData>(
        `${API_URL}/api/project-engines/help-texts/by_model_field/`,
        {
          params: { model: modelName, field: fieldName },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    },
    enabled: (options?.enabled !== false) && !!accessToken && !!modelName && !!fieldName,
    staleTime: 1000 * 60 * 60, // Cache por 1 hora (las ayudas no cambian frecuentemente)
  });
};

