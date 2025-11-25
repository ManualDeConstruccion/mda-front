// src/hooks/useFloors.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export interface Floor {
  id: number;
  project_node: number;
  code: string;
  name: string;
  order: number;
  floor_type: 'below' | 'above';
  superficie_util: number;
  superficie_comun: number;
  superficie_total: number;
  is_active: boolean;
  metadata: Record<string, any>;
  levels_count: number;
  levels_detail: Array<{
    id: number;
    building: number;
    building_name: string;
    building_code: string;
    code: string;
    name: string;
    level_type: 'below' | 'above' | 'roof';
    superficie_util: number;
    superficie_comun: number;
    superficie_total: number;
  }>;
  buildings: Array<{
    id: number;
    name: string;
    code: string;
  }>;
  surface_total: number;
  surface_util: number;
  surface_comun: number;
  created_at: string;
  updated_at: string;
}

interface FloorsFilters {
  project_node?: number;
}

export const useFloors = (filters?: FloorsFilters) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  const getFloors = useQuery<Floor[]>({
    queryKey: ['floors', filters],
    queryFn: async (): Promise<Floor[]> => {
      const params = new URLSearchParams();
      if (filters?.project_node) params.append('project_node', filters.project_node.toString());
      
      const response = await axios.get(
        `${API_URL}/api/project-engines/floors/?${params.toString()}`,
        axiosConfig
      );
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!accessToken && !!filters?.project_node,
  });

  const createFloor = useMutation({
    mutationFn: async (data: Partial<Floor>) => {
      const response = await axios.post(
        `${API_URL}/api/project-engines/floors/`,
        data,
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['projectLevels'] });
    },
  });

  const updateFloor = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Floor> }) => {
      const response = await axios.patch(
        `${API_URL}/api/project-engines/floors/${id}/`,
        data,
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['projectLevels'] });
    },
  });

  const deleteFloor = useMutation({
    mutationFn: async (id: number) => {
      try {
        await axios.delete(`${API_URL}/api/project-engines/floors/${id}/`, axiosConfig);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 
                           error?.response?.data?.detail || 
                           error?.response?.data?.message ||
                           'No se pudo eliminar el piso';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['projectLevels'] });
    },
  });

  const updateConsolidatedValues = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.post(
        `${API_URL}/api/project-engines/floors/${id}/update_consolidated_values/`,
        {},
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  const suggestNextName = async (projectNodeId: number, floorType: 'below' | 'above'): Promise<{ suggested_name: string; suggested_code: string }> => {
    try {
      const response = await axios.get(
        `${API_URL}/api/project-engines/floors/suggest_next_name/?project_node=${projectNodeId}&floor_type=${floorType}`,
        axiosConfig
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener sugerencia de nombre:', error);
      throw error;
    }
  };

  const createMultipleFloors = useMutation({
    mutationFn: async (data: { project_node: number; floor_type: 'below' | 'above'; count: number }) => {
      const response = await axios.post(
        `${API_URL}/api/project-engines/floors/create_multiple/`,
        data,
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['projectLevels'] });
    },
  });

  return {
    floors: getFloors.data || [],
    isLoadingFloors: getFloors.isLoading,
    createFloor,
    updateFloor,
    deleteFloor,
    updateConsolidatedValues,
    suggestNextName,
    createMultipleFloors,
  };
};

