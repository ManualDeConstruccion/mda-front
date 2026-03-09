import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface SnapshotSourceFieldOption {
  value: string;
  label: string;
}

const QUERY_KEY = ['snapshot-source-fields'] as const;

export function useSnapshotSourceFields(
  snapshotSource: 'property' | 'user' | 'none' | 'manual'
) {
  const enabled =
    snapshotSource === 'property' || snapshotSource === 'user';

  const query = useQuery({
    queryKey: [...QUERY_KEY, snapshotSource],
    queryFn: async () => {
      const response = await api.get<{
        source: string;
        fields: SnapshotSourceFieldOption[];
      }>('parameters/parameter-definitions/snapshot-source-fields/', {
        params: { source: snapshotSource },
      });
      return response.data;
    },
    enabled,
  });

  return {
    fields: query.data?.fields ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
