import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { FormType } from '../types/formParameters.types';

const QUERY_KEY = ['form-types'] as const;

export function useFormTypes(options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<FormType[]>('parameters/form-types/');
      return response.data;
    },
    enabled,
  });
  return {
    formTypes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
