import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { SectionEngine } from '../types/formParameters.types';

const QUERY_KEY = ['section-engines'] as const;

export function useSectionEngines(options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<SectionEngine[]>('parameters/section-engines/');
      return response.data;
    },
    enabled,
  });
  return {
    sectionEngines: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
