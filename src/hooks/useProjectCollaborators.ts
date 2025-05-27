import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ProjectCollaborator, CreateProjectCollaboratorDto, UpdateProjectCollaboratorDto } from '../types/project_collaborators.types';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export const useProjectCollaborators = (projectId?: number) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  // Obtener colaboradores de un proyecto
  const { data: collaborators, isLoading: isLoadingCollaborators } = useQuery<ProjectCollaborator[]>({
    queryKey: ['projectCollaborators', projectId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/projects/${projectId}/collaborators/`, axiosConfig);
      return response.data;
    },
    enabled: !!projectId,
  });

  // Obtener un colaborador específico
  const useCollaborator = (collaboratorId: number) => {
    return useQuery<ProjectCollaborator>({
      queryKey: ['projectCollaborators', projectId, collaboratorId],
      queryFn: async () => {
        const response = await axios.get(`${API_URL}/projects/${projectId}/collaborators/${collaboratorId}/`, axiosConfig);
        return response.data;
      },
      enabled: !!projectId && !!collaboratorId,
    });
  };

  // Añadir un colaborador al proyecto
  const addCollaborator = useMutation({
    mutationFn: async (newCollaborator: CreateProjectCollaboratorDto) => {
      const response = await axios.post(`${API_URL}/projects/${projectId}/collaborators/`, newCollaborator, axiosConfig);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectCollaborators', projectId] });
    },
  });

  // Actualizar un colaborador
  const updateCollaborator = useMutation({
    mutationFn: async ({ collaboratorId, data }: { collaboratorId: number; data: UpdateProjectCollaboratorDto }) => {
      const response = await axios.put(`${API_URL}/projects/${projectId}/collaborators/${collaboratorId}/`, data, axiosConfig);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectCollaborators', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectCollaborators', projectId, variables.collaboratorId] });
    },
  });

  // Eliminar un colaborador
  const removeCollaborator = useMutation({
    mutationFn: async (collaboratorId: number) => {
      await axios.delete(`${API_URL}/projects/${projectId}/collaborators/${collaboratorId}/`, axiosConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectCollaborators', projectId] });
    },
  });

  return {
    collaborators,
    isLoadingCollaborators,
    useCollaborator,
    addCollaborator,
    updateCollaborator,
    removeCollaborator,
  };
}; 