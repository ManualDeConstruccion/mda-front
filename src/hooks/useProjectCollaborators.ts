import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { NodeCollaborator } from '../types/project_collaborators.types';

/**
 * Hook para gestionar los colaboradores de un nodo (proyecto/subproyecto).
 * Endpoint: /api/projects/project-nodes/{nodeId}/node-collaborators/
 *
 * Cada colaborador tiene un rol (Arquitecto, Constructor, etc.) asignado al nodo.
 * Para gestionar permisos Guardian (view/edit/delete) usar useProjectNodePermissions.
 */
export const useProjectCollaborators = (nodeId?: number) => {
  const queryClient = useQueryClient();

  const collaboratorsQuery = useQuery<NodeCollaborator[]>({
    queryKey: ['nodeCollaborators', nodeId],
    queryFn: async () => {
      const { data } = await api.get(`projects/project-nodes/${nodeId}/node-collaborators/`);
      return data;
    },
    enabled: !!nodeId,
  });

  const addCollaborator = useMutation({
    mutationFn: async (payload: { user_id: number; role_id: number; company_id?: number | null }) => {
      const { data } = await api.post(
        `projects/project-nodes/${nodeId}/node-collaborators/`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodeCollaborators', nodeId] });
    },
  });

  const removeCollaborator = useMutation({
    mutationFn: async (role_id: number) => {
      await api.delete(`projects/project-nodes/${nodeId}/node-collaborators/`, {
        data: { role_id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodeCollaborators', nodeId] });
    },
  });

  return {
    collaborators: collaboratorsQuery.data ?? [],
    isLoading: collaboratorsQuery.isLoading,
    isError: collaboratorsQuery.isError,
    addCollaborator,
    removeCollaborator,
  };
};
