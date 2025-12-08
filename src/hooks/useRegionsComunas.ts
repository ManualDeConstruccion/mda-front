// front/src/hooks/useRegionsComunas.ts

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Region, Comuna } from '../types/region.types';

const API_URL = import.meta.env.VITE_API_URL;

export const useRegions = () => {
  const { accessToken } = useAuth();
  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  const query = useQuery<Region[]>({
    queryKey: ['regions', accessToken],
    queryFn: async (): Promise<Region[]> => {
      const response = await axios.get(`${API_URL}/region/v1/`, axiosConfig);
      // El backend retorna { id, region }
      return response.data.map((item: any) => ({
        id: item.id,
        region: item.region,
        // region_roman y region_number son opcionales
      }));
    },
    enabled: !!accessToken,
  });

  return {
    regions: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};

export const useComunas = (regionId?: number) => {
  const { accessToken } = useAuth();
  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  const query = useQuery<Comuna[]>({
    queryKey: ['comunas', regionId, accessToken],
    queryFn: async (): Promise<Comuna[]> => {
      if (!regionId) return [];
      
      // Obtener la región primero para tener sus datos completos
      const regionResponse = await axios.get(`${API_URL}/region/v1/`, axiosConfig);
      const region = regionResponse.data.find((r: any) => r.id === regionId);
      
      if (!region) return [];
      
      // Obtener comunas filtradas por región
      const comunasResponse = await axios.get(`${API_URL}/comuna/v1/?region=${regionId}`, axiosConfig);
      
      // El backend retorna { id, comuna, region } donde region es un string
      return comunasResponse.data.map((item: any) => ({
        id: item.id,
        comuna: item.comuna,
        region: {
          id: region.id,
          region: item.region || region.region, // Usar el nombre de región del item o del objeto region
          // region_roman y region_number son opcionales
        }
      }));
    },
    enabled: !!accessToken && !!regionId,
  });

  return {
    comunas: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};

