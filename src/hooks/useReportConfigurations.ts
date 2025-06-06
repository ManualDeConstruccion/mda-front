import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ReportConfiguration {
  id?: number;
  page_size: 'A4' | 'letter' | 'legal';
  margins: Margins;
  header?: string;
  footer?: string;
  logo?: string;
}

export const useReportConfigurations = (nodeId?: number) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  // Query para obtener la configuración efectiva
  const { data: configuration, isLoading, isError, error } = useQuery({
    queryKey: ['reportConfiguration', nodeId],
    queryFn: async () => {
      const url = nodeId 
        ? `${API_URL}/report-configurations/get_effective_config/?node_id=${nodeId}`
        : `${API_URL}/report-configurations/`;
      const response = await axios.get<ReportConfiguration>(url, axiosConfig);
      return response.data;
    },
    enabled: !!accessToken
  });

  // Mutation para actualizar la configuración
  const { mutate: updateConfiguration, isPending: isUpdating } = useMutation({
    mutationFn: async (data: Partial<ReportConfiguration>) => {
      const url = nodeId 
        ? `${API_URL}/report-configurations/?node_id=${nodeId}`
        : `${API_URL}/report-configurations/`;
      const response = await axios.post<ReportConfiguration>(url, data, axiosConfig);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportConfiguration', nodeId] });
    }
  });

  // Mutation para restaurar la configuración por defecto
  const { mutate: restoreDefault, isPending: isRestoring } = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${API_URL}/report-configurations/restore_default/?node_id=${nodeId}`,
        {},
        axiosConfig
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportConfiguration', nodeId] });
    }
  });

  return {
    configuration,
    isLoading,
    isError,
    error,
    updateConfiguration,
    restoreDefault,
    isUpdating,
    isRestoring
  };
}; 