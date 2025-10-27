import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

interface ProjectNodePermissionDto {
  user_id: number;
  permission: string; // 'view_projectnode' | 'change_projectnode' | 'delete_projectnode'
}

export const useAssignProjectNodePermission = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };
  return useMutation({
    mutationFn: async ({ nodeId, user_id, permission }: ProjectNodePermissionDto & { nodeId: number }) => {
      const response = await axios.post(
        `${API_URL}/api/projects/project-nodes/${nodeId}/assign_permission/`,
        { user_id, permission },
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectNodes'] });
    },
  });
};

export const useRemoveProjectNodePermission = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };
  return useMutation({
    mutationFn: async ({ nodeId, user_id, permission }: ProjectNodePermissionDto & { nodeId: number }) => {
      const response = await axios.post(
        `${API_URL}/api/projects/project-nodes/${nodeId}/remove_permission/`,
        { user_id, permission },
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectNodes'] });
    },
  });
};

export const useProjectNodeUserPermissions = (nodeId: number | undefined, userId: number | undefined) => {
  const { accessToken } = useAuth();
  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };
  return useQuery({
    queryKey: ['projectNodeUserPermissions', nodeId, userId],
    queryFn: async () => {
      if (!nodeId || !userId) return [];
      const { data } = await axios.get(
        `${API_URL}/api/projects/project-nodes/${nodeId}/user_permissions/?user_id=${userId}`,
        axiosConfig
      );
      return data.permissions || [];
    },
    enabled: !!nodeId && !!userId && !!accessToken,
  });
}; 