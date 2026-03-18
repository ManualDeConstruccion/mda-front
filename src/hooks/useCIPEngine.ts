import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { CIPData, CIPFormData, CIPStreetFrontageData } from '../types/cip.types';

const NODE_QUERY_KEY = 'project-node-cip';
const CIP_QUERY_KEY = 'prev-information-certificate';
const SEARCH_QUERY_KEY = 'cip-search';

export function useCIPEngine(subprojectId: number) {
  const queryClient = useQueryClient();

  // ── CIP vinculado al nodo ──────────────────────────────────────────────────
  const cipIdQuery = useQuery({
    queryKey: [NODE_QUERY_KEY, subprojectId],
    queryFn: async () => {
      const res = await api.get(`projects/project-nodes/${subprojectId}/`);
      return (res.data.prev_information_certificate as number | null) ?? null;
    },
  });

  const cipId = cipIdQuery.data ?? null;

  const cipQuery = useQuery({
    queryKey: [CIP_QUERY_KEY, cipId],
    queryFn: async () => {
      const res = await api.get<CIPData>(`prev-information-certificates/${cipId}/`);
      return res.data;
    },
    enabled: cipId != null,
  });

  // ── Búsqueda de CIPs existentes ───────────────────────────────────────────
  const searchCIPsMutation = useMutation({
    mutationFn: async (params: { search?: string; property?: number }) => {
      const res = await api.get<CIPData[]>('prev-information-certificates/', { params });
      return res.data;
    },
  });

  // ── Crear nuevo CIP ───────────────────────────────────────────────────────
  const createCIPMutation = useMutation({
    mutationFn: async (data: Partial<CIPFormData>) => {
      const res = await api.post<CIPData>('prev-information-certificates/', data);
      return res.data;
    },
  });

  // ── Actualizar CIP ────────────────────────────────────────────────────────
  const updateCIPMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CIPFormData> }) => {
      const res = await api.patch<CIPData>(`prev-information-certificates/${id}/`, data);
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData([CIP_QUERY_KEY, updated.id], updated);
    },
  });

  // ── Vincular CIP al nodo ──────────────────────────────────────────────────
  const linkCIPMutation = useMutation({
    mutationFn: async (newCipId: number) => {
      await api.patch(`projects/project-nodes/${subprojectId}/`, {
        prev_information_certificate: newCipId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NODE_QUERY_KEY, subprojectId] });
    },
  });

  // ── Desvincular CIP del nodo ──────────────────────────────────────────────
  const unlinkCIPMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`projects/project-nodes/${subprojectId}/`, {
        prev_information_certificate: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NODE_QUERY_KEY, subprojectId] });
    },
  });

  // ── Frentes de calle ──────────────────────────────────────────────────────
  const createFrontageMutation = useMutation({
    mutationFn: async (data: Omit<CIPStreetFrontageData, 'id'>) => {
      const res = await api.post<CIPStreetFrontageData>('cip-street-frontages/', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CIP_QUERY_KEY, cipId] });
    },
  });

  const updateFrontageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CIPStreetFrontageData> }) => {
      const res = await api.patch<CIPStreetFrontageData>(`cip-street-frontages/${id}/`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CIP_QUERY_KEY, cipId] });
    },
  });

  const deleteFrontageMutation = useMutation({
    mutationFn: async (frontageId: number) => {
      await api.delete(`cip-street-frontages/${frontageId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CIP_QUERY_KEY, cipId] });
    },
  });

  const invalidateCIP = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [CIP_QUERY_KEY, cipId] });
    queryClient.invalidateQueries({ queryKey: [NODE_QUERY_KEY, subprojectId] });
  }, [queryClient, cipId, subprojectId]);

  return {
    // Estado del CIP vinculado
    cip: cipQuery.data ?? null,
    isLoadingCIP: cipIdQuery.isLoading || (cipId != null && cipQuery.isLoading),

    // Búsqueda
    searchCIPs: searchCIPsMutation.mutateAsync,
    searchResults: searchCIPsMutation.data ?? [],
    isSearching: searchCIPsMutation.isPending,

    // CRUD
    createCIP: createCIPMutation.mutateAsync,
    isCreating: createCIPMutation.isPending,

    updateCIP: updateCIPMutation.mutateAsync,
    isUpdating: updateCIPMutation.isPending,

    // Vinculación
    linkCIP: linkCIPMutation.mutateAsync,
    isLinking: linkCIPMutation.isPending,

    unlinkCIP: unlinkCIPMutation.mutateAsync,
    isUnlinking: unlinkCIPMutation.isPending,

    // Frentes de calle
    createFrontage: createFrontageMutation.mutateAsync,
    updateFrontage: updateFrontageMutation.mutateAsync,
    deleteFrontage: deleteFrontageMutation.mutateAsync,
    isFrontageLoading:
      createFrontageMutation.isPending ||
      updateFrontageMutation.isPending ||
      deleteFrontageMutation.isPending,

    invalidateCIP,
  };
}
