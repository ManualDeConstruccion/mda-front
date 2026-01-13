// src/hooks/useSurfacePolygons.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export interface SurfacePolygon {
  id: number;
  project_node: number;
  level: number | null;
  name: string;
  width: number | null;
  length: number | null;
  triangulo_rectangulo: boolean;
  count_as_half: boolean;
  manual_total: number | null;
  apply_to_group: boolean;
  is_util: boolean;
  total: number;
  created_at: string;
  updated_at: string;
}

interface SurfacePolygonsFilters {
  project_node?: number;
  level?: number;
}

export const useSurfacePolygons = (filters?: SurfacePolygonsFilters) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  const getPolygons = useQuery<SurfacePolygon[]>({
    queryKey: ['surfacePolygons', filters],
    queryFn: async (): Promise<SurfacePolygon[]> => {
      const params = new URLSearchParams();
      if (filters?.project_node) params.append('project_node', filters.project_node.toString());
      if (filters?.level) params.append('level', filters.level.toString());
      
      const response = await axios.get(
        `${API_URL}/api/project-engines/polygons/?${params.toString()}`,
        axiosConfig
      );
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!accessToken && !!filters?.project_node,
  });

  const createPolygon = useMutation({
    mutationFn: async (data: Partial<SurfacePolygon>) => {
      const response = await axios.post(
        `${API_URL}/api/project-engines/polygons/`,
        data,
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surfacePolygons'] });
    },
  });

  const updatePolygon = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SurfacePolygon> }) => {
      const response = await axios.patch(
        `${API_URL}/api/project-engines/polygons/${id}/`,
        data,
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surfacePolygons'] });
    },
  });

  const deletePolygon = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${API_URL}/api/project-engines/polygons/${id}/`, axiosConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surfacePolygons'] });
    },
  });

  return {
    polygons: getPolygons.data || [],
    isLoadingPolygons: getPolygons.isLoading,
    createPolygon,
    updatePolygon,
    deletePolygon,
  };
};

