// src/hooks/useProjectLevels.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export interface ProjectLevel {
  id: number;
  building: number;
  building_name: string;
  building_code: string;
  project_node: number;
  code: string;
  name: string;
  order: number;
  level_type: 'below' | 'above' | 'roof';
  altura?: number | null;
  is_active: boolean;
  metadata: Record<string, any>;
  surface_total: number;
  surface_util: number;
  surface_comun: number;
}

export interface Building {
  id: number;
  project_node: number;
  code: string;
  name: string;
  order: number;
  is_active: boolean;
  metadata: Record<string, any>;
  levels_count: number;
}

interface ProjectLevelsFilters {
  project_node?: number;
  building?: number;
}

export const useProjectLevels = (filters?: ProjectLevelsFilters) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  const getLevels = useQuery<ProjectLevel[]>({
    queryKey: ['projectLevels', filters],
    queryFn: async (): Promise<ProjectLevel[]> => {
      const params = new URLSearchParams();
      if (filters?.project_node) params.append('project_node', filters.project_node.toString());
      if (filters?.building) params.append('building', filters.building.toString());
      
      const response = await axios.get(
        `${API_URL}/api/project-engines/levels/?${params.toString()}`,
        axiosConfig
      );
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!accessToken && (!!filters?.project_node || !!filters?.building),
  });

  interface Totals {
    subterraneo: { util: number; comun: number; total: number };
    sobre_terreno: { util: number; comun: number; total: number };
    general: { util: number; comun: number; total: number };
  }

  const getLevelsByType = useQuery<{
    below: ProjectLevel[];
    above: ProjectLevel[];
    roof: ProjectLevel[];
    totals: Totals;
  }>({
    queryKey: ['projectLevelsByType', filters?.project_node],
    queryFn: async () => {
      if (!filters?.project_node) {
        return {
          below: [],
          above: [],
          roof: [],
          totals: {
            subterraneo: { util: 0, comun: 0, total: 0 },
            sobre_terreno: { util: 0, comun: 0, total: 0 },
            general: { util: 0, comun: 0, total: 0 },
          },
        };
      }
      
      const response = await axios.get(
        `${API_URL}/api/project-engines/levels/by_type/?project_node=${filters.project_node}`,
        axiosConfig
      );
      return response.data;
    },
    enabled: !!accessToken && !!filters?.project_node,
  });

  const createLevel = useMutation({
    mutationFn: async (data: Partial<ProjectLevel>) => {
      const response = await axios.post(
        `${API_URL}/api/project-engines/levels/`,
        data,
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectLevels'] });
      queryClient.invalidateQueries({ queryKey: ['projectLevelsByType'] });
    },
  });

  const updateLevel = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProjectLevel> }) => {
      const response = await axios.patch(
        `${API_URL}/api/project-engines/levels/${id}/`,
        data,
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectLevels'] });
      queryClient.invalidateQueries({ queryKey: ['projectLevelsByType'] });
    },
  });

  const deleteLevel = useMutation({
    mutationFn: async (id: number) => {
      try {
        await axios.delete(`${API_URL}/api/project-engines/levels/${id}/`, axiosConfig);
      } catch (error: any) {
        // Extraer mensaje de error del backend
        const errorMessage = error?.response?.data?.error || 
                           error?.response?.data?.detail || 
                           error?.response?.data?.message ||
                           'No se pudo eliminar el nivel';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectLevels'] });
      queryClient.invalidateQueries({ queryKey: ['projectLevelsByType'] });
    },
  });

  const suggestLevelCode = async (buildingId: number, levelType: 'below' | 'above' | 'roof'): Promise<string> => {
    try {
      const response = await axios.get(
        `${API_URL}/api/project-engines/levels/suggest_code/?building=${buildingId}&level_type=${levelType}`,
        axiosConfig
      );
      return response.data.suggested_code || '';
    } catch (error) {
      console.error('Error al obtener sugerencia de código:', error);
      return '';
    }
  };

  return {
    levels: getLevels.data || [],
    isLoadingLevels: getLevels.isLoading,
    levelsByType: getLevelsByType.data || {
      below: [],
      above: [],
      roof: [],
      totals: {
        subterraneo: { util: 0, comun: 0, total: 0 },
        sobre_terreno: { util: 0, comun: 0, total: 0 },
        general: { util: 0, comun: 0, total: 0 },
      },
    },
    isLoadingLevelsByType: getLevelsByType.isLoading,
    createLevel,
    updateLevel,
    deleteLevel,
    suggestLevelCode,
  };
};

export const useBuildings = (projectNodeId?: number) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  const getBuildings = useQuery<Building[]>({
    queryKey: ['buildings', projectNodeId],
    queryFn: async (): Promise<Building[]> => {
      if (!projectNodeId) return [];
      
      const response = await axios.get(
        `${API_URL}/api/project-engines/buildings/?project_node=${projectNodeId}`,
        axiosConfig
      );
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!accessToken && !!projectNodeId,
  });

  const createBuilding = useMutation({
    mutationFn: async (data: Partial<Building>) => {
      const response = await axios.post(
        `${API_URL}/api/project-engines/buildings/`,
        data,
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['projectLevels'] });
    },
  });

  const updateBuilding = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Building> }) => {
      const response = await axios.patch(
        `${API_URL}/api/project-engines/buildings/${id}/`,
        data,
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });

  const deleteBuilding = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${API_URL}/api/project-engines/buildings/${id}/`, axiosConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['projectLevels'] });
    },
  });

  return {
    buildings: getBuildings.data || [],
    isLoadingBuildings: getBuildings.isLoading,
    createBuilding,
    updateBuilding,
    deleteBuilding,
  };
};

