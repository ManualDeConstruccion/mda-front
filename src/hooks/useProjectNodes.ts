// src/hooks/useProjectNodes.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { mapProjectNode } from '../mappers/project_node_mapper';
import { ProjectNode, CreateProjectNodeDto, UpdateProjectNodeDto, TypeCode } from '../types/project_nodes.types';

const STALE_TIME = 60 * 1000;

interface ProjectNodesFilters {
  parent?: number;
  type?: TypeCode;
}

export const useProjectNodes = <T extends ProjectNode = ProjectNode>(filters?: ProjectNodesFilters) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const getProjects = useQuery<T[]>({
    queryKey: ['projectNodes', filters],
    queryFn: async (): Promise<T[]> => {
      const params = new URLSearchParams();
      if (filters?.parent) params.append('parent', filters.parent.toString());
      if (filters?.type) params.append('type', filters.type);
      const response = await api.get(`projects/project-nodes/?${params.toString()}`);
      const results = response.data?.results ?? response.data;
      return Array.isArray(results) ? results.map(mapProjectNode) as T[] : [];
    },
    enabled: !!accessToken && (!!filters?.parent || !!filters?.type),
    staleTime: STALE_TIME,
  });

  const createProject = useMutation({
    mutationFn: async (data: CreateProjectNodeDto) => {
      const hasFiles = Object.values(data).some(value => value instanceof File);
      if (hasFiles) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (value instanceof File) {
              formData.append(key, value);
            } else if (typeof value === 'boolean') {
              formData.append(key, value.toString());
            } else {
              formData.append(key, value);
            }
          }
        });
        const response = await api.post('projects/project-nodes/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      } else {
        const response = await api.post('projects/project-nodes/', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectNodes'] });
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData | UpdateProjectNodeDto | string }) => {
      const isFormData = data instanceof FormData;
      const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
      const body = !isFormData && typeof data === 'object' ? JSON.stringify(data) : data;
      const response = await api.patch(`projects/project-nodes/${id}/`, body, { headers });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectNodes'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['projectNode', variables.id], exact: true });
    },
  });

  const patchProject = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UpdateProjectNodeDto> }) => {
      const response = await api.patch(`projects/project-nodes/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectNodes'] });
      queryClient.invalidateQueries({ queryKey: ['projectNode', variables.id] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`projects/project-nodes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectNodes'] });
    },
  });

  const reorderNodes = async (parentId: number, nodeOrders: Array<{ id: number; order: number }>) => {
    const response = await api.post('projects/project-nodes/reorder_with_numbering/', {
      parent_id: parentId,
      node_orders: nodeOrders,
    });
    queryClient.invalidateQueries({ queryKey: ['projectNodes'], exact: false });
    return response.data;
  };

  return {
    projects: getProjects.data,
    isLoadingProjects: getProjects.isLoading,
    createProject,
    updateProject,
    patchProject,
    deleteProject,
    reorderNodes
  };
};

export const useProjectNodeTree = (nodeId?: number | null) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['projectNodeTree', nodeId],
    queryFn: async () => {
      if (!nodeId) return null;
      const { data } = await api.get(`projects/project-nodes/${nodeId}/tree/`);
      return data;
    },
    enabled: !!nodeId && !!accessToken,
    staleTime: STALE_TIME,
  });
};

export const useProjectNode = <T extends ProjectNode = ProjectNode>(id?: number) => {
  const { accessToken } = useAuth();
  return useQuery<T | null>({
    queryKey: ['projectNode', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`projects/project-nodes/${id}/`);
      return mapProjectNode(data) as T;
    },
    enabled: !!id && !!accessToken,
    staleTime: STALE_TIME,
  });
};
