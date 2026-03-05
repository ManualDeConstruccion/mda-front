import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface CAMSolutionSummary {
  id: number;
  name: string;
  fire_resistance: number | null;
  calculated_time: number | null;
  is_symmetric: boolean;
  description: string;
  created_at: string;
  layers: any[];
  base_solution?: { id: number; name: string } | null;
  proposed_solution_id?: number | null;
}

const QUERY_KEY = 'cam-engine-solutions';

export function useCAMEngine(subprojectId: number) {
  const queryClient = useQueryClient();

  const solutionsQuery = useQuery<CAMSolutionSummary[]>({
    queryKey: [QUERY_KEY, subprojectId],
    queryFn: async () => {
      const res = await api.get('analyzed-solutions/', {
        params: { node_id: subprojectId },
      });
      return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
    },
    staleTime: 60_000,
  });

  const createSolutionMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; is_symmetric?: boolean; base_solution_id?: number }) => {
      const res = await api.post('analyzed-solutions/', {
        name: data.name,
        description: data.description ?? '',
        is_symmetric: data.is_symmetric ?? true,
        node: [subprojectId],
        base_solution_id: data.base_solution_id ?? null,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, subprojectId] });
    },
  });

  const deleteSolutionMutation = useMutation({
    mutationFn: async (solutionId: number) => {
      await api.delete(`analyzed-solutions/${solutionId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, subprojectId] });
    },
  });

  const linkSolutionMutation = useMutation({
    mutationFn: async (solutionId: number) => {
      const res = await api.get(`analyzed-solutions/${solutionId}/`);
      const currentNodes: number[] = (res.data.node ?? []);
      if (!currentNodes.includes(subprojectId)) {
        await api.patch(`analyzed-solutions/${solutionId}/`, {
          node: [...currentNodes, subprojectId],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, subprojectId] });
    },
  });

  return {
    solutions: solutionsQuery.data ?? [],
    isLoading: solutionsQuery.isLoading,
    createSolution: createSolutionMutation.mutateAsync,
    isCreating: createSolutionMutation.isPending,
    deleteSolution: deleteSolutionMutation.mutateAsync,
    linkSolution: linkSolutionMutation.mutateAsync,
    refetch: solutionsQuery.refetch,
  };
}
