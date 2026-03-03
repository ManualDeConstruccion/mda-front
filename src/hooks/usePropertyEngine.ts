import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface PropertyData {
  id: number;
  name: string;
  rol: string;
  description: string;
  owner: number | null;
  address: string;
  region: number | null;
  comuna: number | null;
  localidad: string | null;
  block: string | null;
  allotment: string | null;
  neighborhood: string | null;
  subdivision_plan: string | null;
}

interface SearchParams {
  rol: string;
  comunaId: number | null;
}

const QUERY_KEY = 'property-search';

export function usePropertyEngine(subprojectId: number) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

  const searchQuery = useQuery({
    queryKey: [QUERY_KEY, searchParams?.rol, searchParams?.comunaId],
    queryFn: async () => {
      if (!searchParams?.rol || !searchParams?.comunaId) return [];
      const res = await api.get<PropertyData[]>('properties/', {
        params: { rol: searchParams.rol, comuna: searchParams.comunaId },
      });
      return res.data;
    },
    enabled: !!searchParams?.rol && !!searchParams?.comunaId,
  });

  const linkedPropertyQuery = useQuery({
    queryKey: ['project-node-properties', subprojectId],
    queryFn: async () => {
      const res = await api.get(`projects/project-nodes/${subprojectId}/`);
      const propertyIds: number[] = res.data.properties ?? [];
      if (propertyIds.length === 0) return null;
      const propRes = await api.get<PropertyData>(`properties/${propertyIds[0]}/`);
      return propRes.data;
    },
  });

  const searchProperty = useCallback((rol: string, comunaId: number) => {
    setSearchParams({ rol: rol.trim(), comunaId });
  }, []);

  const createPropertyMutation = useMutation({
    mutationFn: async (data: Partial<PropertyData>) => {
      const res = await api.post<PropertyData>('properties/', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const linkPropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const nodeRes = await api.get(`projects/project-nodes/${subprojectId}/`);
      const currentProperties: number[] = nodeRes.data.properties ?? [];
      if (!currentProperties.includes(propertyId)) {
        await api.patch(`projects/project-nodes/${subprojectId}/`, {
          properties: [...currentProperties, propertyId],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-node-properties', subprojectId] });
    },
  });

  return {
    searchResults: searchQuery.data ?? [],
    isSearching: searchQuery.isLoading,
    searchProperty,

    linkedProperty: linkedPropertyQuery.data ?? null,
    isLoadingLinked: linkedPropertyQuery.isLoading,

    createProperty: createPropertyMutation.mutateAsync,
    isCreating: createPropertyMutation.isPending,

    linkProperty: linkPropertyMutation.mutateAsync,
    isLinking: linkPropertyMutation.isPending,
  };
}
