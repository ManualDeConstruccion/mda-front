import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Layer } from '../../types/FormTypes/cam.types';

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = `${API_URL}/analyzed-solutions/`;

export function useCAMApi() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  // Listar todas las soluciones
  function useList() {
    return useQuery({
      queryKey: ['analyzedsolutions'],
      queryFn: async () => {
        const { data } = await axios.get(BASE_URL, axiosConfig);
        return data;
      },
    });
  }

  // Crear una nueva solución
  const create = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.post(BASE_URL, payload, axiosConfig);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyzedsolutions'] });
    },
  });

  // Obtener detalles de una solución
  function useRetrieve(id: number | string) {
    return useQuery({
      queryKey: ['analyzedsolution', id],
      queryFn: async () => {
        const { data } = await axios.get(`${BASE_URL}${id}/`, axiosConfig);
        return data;
      },
      enabled: !!id,
    });
  }

  // Actualizar completamente
  const update = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await axios.put(`${BASE_URL}${id}/`, payload, axiosConfig);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analyzedsolutions'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['analyzedsolution', variables.id] });
      }
    },
  });

  // Actualización parcial
  const partialUpdate = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await axios.patch(`${BASE_URL}${id}/`, payload, axiosConfig);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analyzedsolutions'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['analyzedsolution', variables.id] });
      }
    },
  });

  // Eliminar
  const destroy = useMutation({
    mutationFn: async (id: number | string) => {
      const { data } = await axios.delete(`${BASE_URL}${id}/`, axiosConfig);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyzedsolutions'] });
    },
  });

  // Agregar una capa
  const addLayer = useMutation({
    mutationFn: async ({ id, layer }: { id: number; layer: any }) => {
      // El backend espera el id de la solución como parte del body, bajo solution
      const payload = { ...layer, solution: id };
      const { data } = await axios.post(`${API_URL}/layers/`, payload, axiosConfig);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analyzedsolution', variables.id] });
    },
  });

  // Editar una capa
  const editLayer = useMutation({
    mutationFn: async ({ id, layerId, layer }: { id: number; layerId: number; layer: Partial<Layer> }) => {
      const { data } = await axios.patch(`${API_URL}/layers/${layerId}/`, layer, axiosConfig);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analyzedsolution', variables.id] });
    },
  });

  // Eliminar una capa
  const deleteLayer = useMutation({
    mutationFn: async ({ id, layerId }: { id: number; layerId: number }) => {
      const { data } = await axios.delete(`${API_URL}/layers/${layerId}/`, axiosConfig);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analyzedsolution', variables.id] });
    },
  });

  // --- PROPOSED SOLUTIONS ---
  const PROPOSED_SOLUTIONS_URL = `${API_URL}/proposed-solutions/`;
  const PROPOSED_LAYERS_URL = `${API_URL}/proposed-layers/`;

  // Proposed Solutions
  function useProposedSolutionsList() {
    return useQuery({
      queryKey: ['proposedsolutions'],
      queryFn: async () => {
        const { data } = await axios.get(PROPOSED_SOLUTIONS_URL, axiosConfig);
        return data;
      },
    });
  }

  const createProposedSolution = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.post(PROPOSED_SOLUTIONS_URL, payload, axiosConfig);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposedsolutions'] });
    },
  });

  const createProposedSolutionFromBase = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.post(`${PROPOSED_SOLUTIONS_URL}create_from_base/`, payload, axiosConfig);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposedsolutions'] });
    },
  });

  function useProposedSolutionRetrieve(id: number | string) {
    return useQuery({
      queryKey: ['proposedsolution', id],
      queryFn: async () => {
        const { data } = await axios.get(`${PROPOSED_SOLUTIONS_URL}${id}/`, axiosConfig);
        return data;
      },
      enabled: !!id,
    });
  }

  const updateProposedSolution = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await axios.put(`${PROPOSED_SOLUTIONS_URL}${id}/`, payload, axiosConfig);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposedsolutions'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['proposedsolution', variables.id] });
      }
    },
  });

  const partialUpdateProposedSolution = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await axios.patch(`${PROPOSED_SOLUTIONS_URL}${id}/`, payload, axiosConfig);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposedsolutions'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['proposedsolution', variables.id] });
      }
    },
  });

  const destroyProposedSolution = useMutation({
    mutationFn: async (id: number | string) => {
      const { data } = await axios.delete(`${PROPOSED_SOLUTIONS_URL}${id}/`, axiosConfig);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposedsolutions'] });
    },
  });

  // --- PROPOSED LAYERS ---
  function useProposedLayersList() {
    return useQuery({
      queryKey: ['proposedlayers'],
      queryFn: async () => {
        const { data } = await axios.get(PROPOSED_LAYERS_URL, axiosConfig);
        return data;
      },
    });
  }

  const createProposedLayer = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.post(PROPOSED_LAYERS_URL, payload, axiosConfig);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposedlayers'] });
    },
  });

  function useProposedLayerRetrieve(id: number | string) {
    return useQuery({
      queryKey: ['proposedlayer', id],
      queryFn: async () => {
        const { data } = await axios.get(`${PROPOSED_LAYERS_URL}${id}/`, axiosConfig);
        return data;
      },
      enabled: !!id,
    });
  }

  const updateProposedLayer = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await axios.put(`${PROPOSED_LAYERS_URL}${id}/`, payload, axiosConfig);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposedlayers'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['proposedlayer', variables.id] });
      }
    },
  });

  const partialUpdateProposedLayer = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await axios.patch(`${PROPOSED_LAYERS_URL}${id}/`, payload, axiosConfig);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposedlayers'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['proposedlayer', variables.id] });
      }
    },
  });

  const destroyProposedLayer = useMutation({
    mutationFn: async (id: number | string) => {
      const { data } = await axios.delete(`${PROPOSED_LAYERS_URL}${id}/`, axiosConfig);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposedlayers'] });
    },
  });

  // Generar solución propuesta desde AnalyzedSolution
  const generateProposedSolutionFromAnalyzed = useMutation({
    mutationFn: async (analyzedSolutionId: number) => {
      const { data } = await axios.post(
        `${PROPOSED_SOLUTIONS_URL}create_from_base/`,
        { base_solution_id: analyzedSolutionId },
        axiosConfig
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposedsolutions'] });
    },
  });

  // Corregir posiciones de capas en soluciones base
  const fixAnalyzedSolutionLayerPositions = useMutation({
    mutationFn: async (solutionId: number) => {
      const { data } = await axios.post(
        `${BASE_URL}fix_layer_positions/`,
        { solution_id: solutionId },
        axiosConfig
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyzedsolutions'] });
    },
  });

  // Corregir posiciones de capas en soluciones propuestas
  const fixProposedSolutionLayerPositions = useMutation({
    mutationFn: async (solutionId: number) => {
      const { data } = await axios.post(
        `${PROPOSED_SOLUTIONS_URL}fix_layer_positions/`,
        { solution_id: solutionId },
        axiosConfig
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposedsolutions'] });
    },
  });

  return {
    useList,
    create,
    useRetrieve,
    update,
    partialUpdate,
    destroy,
    addLayer,
    editLayer,
    deleteLayer,
    generateProposedSolutionFromAnalyzed,
    fixLayerPositions: fixAnalyzedSolutionLayerPositions,
    proposed: {
      solutions: {
        useList: useProposedSolutionsList,
        create: createProposedSolution,
        createFromBase: createProposedSolutionFromBase,
        useRetrieve: useProposedSolutionRetrieve,
        update: updateProposedSolution,
        partialUpdate: partialUpdateProposedSolution,
        destroy: destroyProposedSolution,
        fixLayerPositions: fixProposedSolutionLayerPositions,
      },
      layers: {
        useList: useProposedLayersList,
        create: createProposedLayer,
        useRetrieve: useProposedLayerRetrieve,
        update: updateProposedLayer,
        partialUpdate: partialUpdateProposedLayer,
        destroy: destroyProposedLayer,
      },
    },
  };
}