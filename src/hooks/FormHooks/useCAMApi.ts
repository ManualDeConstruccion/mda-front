import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL;
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

  return { useList, create, useRetrieve, update, partialUpdate, destroy };
}