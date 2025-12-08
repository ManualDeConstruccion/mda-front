import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ProjectSnapshot,
  CreateProjectSnapshotDto,
  UpdateProjectSnapshotDto,
  RestoreSnapshotDto,
} from '../types/project_snapshots.types';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export const useProjectSnapshots = (projectNodeId: number | null) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  // Helper function para crear el config de axios
  // Permite que axios maneje errores HTTP normalmente si no hay token
  const getAxiosConfig = () => {
    return {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    };
  };

  // Obtener todos los snapshots de un proyecto
  const getSnapshots = useQuery<ProjectSnapshot[]>({
    queryKey: ['projectSnapshots', projectNodeId],
    queryFn: async (): Promise<ProjectSnapshot[]> => {
      if (!projectNodeId) return [];
      const response = await axios.get(
        `${API_URL}/api/projects/project-nodes/${projectNodeId}/snapshots/`,
        getAxiosConfig()
      );
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!projectNodeId && !!accessToken,
  });

  // El snapshot activo se deriva de la lista de snapshots (más eficiente)
  const snapshots = getSnapshots.data || [];
  const activeSnapshot = snapshots.find((s: ProjectSnapshot) => s.is_active) || null;

  // Crear snapshot
  const createSnapshot = useMutation({
    mutationFn: async (data: CreateProjectSnapshotDto) => {
      const config = getAxiosConfig();
      const response = await axios.post(
        `${API_URL}/api/projects/project-nodes/${data.project_node}/snapshots/`,
        data,
        {
          ...config,
          headers: {
            ...config.headers,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectSnapshots', variables.project_node] });
    },
  });

  // Actualizar snapshot
  const updateSnapshot = useMutation({
    mutationFn: async ({ 
      projectNodeId, 
      snapshotId, 
      data 
    }: { 
      projectNodeId: number; 
      snapshotId: number; 
      data: UpdateProjectSnapshotDto 
    }) => {
      const config = getAxiosConfig();
      const response = await axios.patch(
        `${API_URL}/api/projects/project-nodes/${projectNodeId}/snapshots/${snapshotId}/`,
        data,
        {
          ...config,
          headers: {
            ...config.headers,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectSnapshots', variables.projectNodeId] });
    },
  });

  // Restaurar snapshot
  const restoreSnapshot = useMutation({
    mutationFn: async ({
      projectNodeId,
      snapshotId,
      data,
    }: {
      projectNodeId: number;
      snapshotId: number;
      data: RestoreSnapshotDto;
    }) => {
      const config = getAxiosConfig();
      const response = await axios.post(
        `${API_URL}/api/projects/project-nodes/${projectNodeId}/snapshots/${snapshotId}/restore/`,
        data,
        {
          ...config,
          headers: {
            ...config.headers,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar snapshots
      queryClient.invalidateQueries({ queryKey: ['projectSnapshots', variables.projectNodeId] });
      
      // Invalidar datos del proyecto que pueden haber cambiado
      queryClient.invalidateQueries({ queryKey: ['projectNode', variables.projectNodeId] });
      queryClient.invalidateQueries({ queryKey: ['projectNodes'] });
      queryClient.invalidateQueries({ queryKey: ['projectNodeTree'] });
      
      // Invalidar datos de estructura que pueden haber sido restaurados
      queryClient.invalidateQueries({ queryKey: ['projectLevels'] });
      queryClient.invalidateQueries({ queryKey: ['projectLevelsByType'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['surfacePolygons'] });
      
      // Invalidar todas las queries que puedan estar relacionadas con el proyecto
      // Esto asegura que todos los componentes se actualicen con los nuevos datos
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          // Invalidar cualquier query que contenga el projectNodeId
          return JSON.stringify(key).includes(String(variables.projectNodeId));
        }
      });
      
      // Forzar refresh de la página para reflejar todos los cambios
      setTimeout(() => {
        window.location.reload();
      }, 300);
    },
  });

  // Eliminar snapshot
  const deleteSnapshot = useMutation({
    mutationFn: async ({
      projectNodeId,
      snapshotId,
    }: {
      projectNodeId: number;
      snapshotId: number;
    }) => {
      await axios.delete(
        `${API_URL}/api/projects/project-nodes/${projectNodeId}/snapshots/${snapshotId}/`,
        getAxiosConfig()
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectSnapshots', variables.projectNodeId] });
    },
  });

  return {
    snapshots,
    isLoadingSnapshots: getSnapshots.isLoading,
    activeSnapshot,
    createSnapshot,
    updateSnapshot,
    restoreSnapshot,
    deleteSnapshot,
  };
};

