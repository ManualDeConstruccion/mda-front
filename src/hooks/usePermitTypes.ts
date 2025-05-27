// src/hooks/usePermitTypes.ts

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface PermitSubTypeItem {
  id: number;
  permit_sub_type: string;
}

interface PermitTypeSubtypes {
  [group: string]: PermitSubTypeItem[];
}

interface PermitType {
  id: number;
  permit_type: string;
  subtypes: PermitTypeSubtypes;
}

export const usePermitTypes = () => {
  // Query para obtener todos los tipos de permiso con sus subtipos
  const permitTypesQuery = useQuery({
    queryKey: ['permitTypes'],
    queryFn: async () => {
      const response = await axios.get<PermitType[]>(`${API_URL}/permit-types/`);
      console.log('Permit Types Response:', response.data);
      return response.data;
    }
  });

  return {
    permitTypes: permitTypesQuery.data,
    isLoading: permitTypesQuery.isLoading,
    isError: permitTypesQuery.isError,
    error: permitTypesQuery.error,
  };
};

// Hook específico para subtipos de un tipo de permiso
export const usePermitSubtypes = (permitTypeId: number) => {
  return useQuery({
    queryKey: ['permitSubtypes', permitTypeId],
    queryFn: async () => {
      const response = await axios.get<PermitSubTypeItem[]>(`${API_URL}/permit-types/${permitTypeId}/subtypes/`);
      return response.data;
    },
    // Solo ejecutar la query si hay un permitTypeId válido
    enabled: !!permitTypeId,
  });
}; 