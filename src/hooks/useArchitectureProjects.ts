// src/hooks/useArchitectureProjects.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ProjectNode, CreateProjectNodeDto, UpdateProjectNodeDto } from '../types/project_nodes.types';
import { ArchitectureProjectNode } from '../types/architecture.types';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL;

// Hook para obtener los proyectos de arquitectura de un proyecto específico
export const useProjectArchitectureProjects = (projectId?: number) => {
  const { accessToken } = useAuth();
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  return useQuery<ArchitectureProjectNode[]>({
    queryKey: ['architectureProjects', projectId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/project-nodes/?node_parent=${projectId}`, axiosConfig);
      return response.data.filter((node: ProjectNode) => node.type === 'architecture_subproject') as ArchitectureProjectNode[];
    },
    enabled: !!projectId,
  });
};

// Hook para obtener un proyecto de arquitectura específico
export const useArchitectureProject = (architectureProjectId?: number) => {
  const { accessToken } = useAuth();
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  return useQuery<ArchitectureProjectNode>({
    queryKey: ['architectureProject', architectureProjectId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/project-nodes/${architectureProjectId}/`, axiosConfig);
      return response.data as ArchitectureProjectNode;
    },
    enabled: !!architectureProjectId,
  });
};

// Hook para las operaciones de mutación (crear, actualizar, eliminar)
export const useArchitectureProjectMutations = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  const createArchitectureProject = useMutation({
    mutationFn: async (newArchitectureProject: CreateProjectNodeDto & { parent: number }) => {
      const projectData = {
        ...newArchitectureProject,
        type: 'architecture_subproject'
      };
      const response = await axios.post(`${API_URL}/project-nodes/`, projectData, axiosConfig);
      return response.data as ArchitectureProjectNode;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['architectureProjects', variables.parent] });
    },
  });

  const updateArchitectureProject = useMutation({
    mutationFn: async ({ architectureProjectId, data }: { architectureProjectId: number; data: UpdateProjectNodeDto }) => {
      const response = await axios.put(`${API_URL}/project-nodes/${architectureProjectId}/`, data, axiosConfig);
      return response.data as ArchitectureProjectNode;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['architectureProject', variables.architectureProjectId] });
      queryClient.invalidateQueries({ queryKey: ['architectureProjects'] });
    },
  });

  const deleteArchitectureProject = useMutation({
    mutationFn: async (architectureProjectId: number) => {
      await axios.delete(`${API_URL}/project-nodes/${architectureProjectId}/`, axiosConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['architectureProjects'] });
    },
  });

  return {
    createArchitectureProject,
    updateArchitectureProject,
    deleteArchitectureProject,
  };
}; 