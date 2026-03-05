import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface UserSearchResult {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  rut: string | null;
  phone: number | null;
}

export interface CollaboratorRole {
  id: number;
  role: string;
}

export interface CollaboratorCompany {
  id: number;
  name: string;
}

export interface CollaboratorItem {
  id: number;
  collaborator: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    rut: string | null;
  };
  role: CollaboratorRole | null;
  company: CollaboratorCompany | null;
}

const QUERY_KEY_COLLABORATORS = 'project-node-collaborators';

export function useUserEngine(subprojectId: number) {
  const queryClient = useQueryClient();
  const [searchRut, setSearchRut] = useState<string | null>(null);

  const searchQuery = useQuery({
    queryKey: ['user-search-by-rut', searchRut],
    queryFn: async () => {
      if (!searchRut || !searchRut.trim()) return [];
      const res = await api.get<UserSearchResult[]>('users/', {
        params: { rut: searchRut.trim() },
      });
      return res.data;
    },
    enabled: !!searchRut?.trim(),
  });

  const collaboratorsQuery = useQuery({
    queryKey: [QUERY_KEY_COLLABORATORS, subprojectId],
    queryFn: async () => {
      const res = await api.get<CollaboratorItem[]>(
        `projects/project-nodes/${subprojectId}/node-collaborators/`
      );
      return res.data ?? [];
    },
    staleTime: 60_000,
  });

  const searchByRut = useCallback((rut: string) => {
    setSearchRut(rut.trim() || null);
  }, []);

  const assignCollaboratorMutation = useMutation({
    mutationFn: async ({
      userId,
      roleId,
      companyId,
    }: { userId: number; roleId: number; companyId?: number }) => {
      await api.post(`projects/project-nodes/${subprojectId}/node-collaborators/`, {
        user_id: userId,
        role_id: roleId,
        company_id: companyId ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_COLLABORATORS, subprojectId] });
    },
  });

  const unassignRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      await api.delete(`projects/project-nodes/${subprojectId}/node-collaborators/`, {
        data: { role_id: roleId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_COLLABORATORS, subprojectId] });
    },
  });

  const invalidateCollaborators = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY_COLLABORATORS, subprojectId] });
  }, [queryClient, subprojectId]);

  return {
    searchResults: searchQuery.data ?? [],
    isSearching: searchQuery.isLoading,
    searchByRut,

    collaborators: collaboratorsQuery.data ?? [],
    isLoadingCollaborators: collaboratorsQuery.isLoading,

    assignCollaborator: assignCollaboratorMutation.mutateAsync,
    isAssigning: assignCollaboratorMutation.isPending,

    unassignRole: unassignRoleMutation.mutateAsync,
    isUnassigning: unassignRoleMutation.isPending,

    invalidateCollaborators,
  };
}
