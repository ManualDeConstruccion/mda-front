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
  page_size: 'A4' | 'letter' | 'legal' | 'oficio' | 'custom';
  custom_page_width?: number;
  custom_page_height?: number;
  orientation: 'portrait' | 'landscape';
  margins: Margins;
  header?: string;
  footer?: string;
  logo?: string;
  show_page_numbers: boolean;
  page_number_position: 'bottom_center' | 'bottom_right' | 'bottom_left';
  updated_at?: string;
}

type HeadersType = Record<string, string>;

function getMostRecentConfig(data: any): ReportConfiguration | undefined {
  if (Array.isArray(data)) {
    if (data.length === 0) return undefined;
    // Ordenar por updated_at descendente, luego por id descendente
    return data
      .slice()
      .sort((a, b) => {
        if (a.updated_at && b.updated_at && a.updated_at !== b.updated_at) {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        return (b.id || 0) - (a.id || 0);
      })[0];
  }
  if (data && typeof data === 'object' && data.id) {
    return data as ReportConfiguration;
  }
  return undefined;
}

export const useReportConfigurations = (nodeId?: number) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const baseHeaders: HeadersType = { Authorization: `Bearer ${accessToken}` };

  // Query para obtener la configuración efectiva
  const { data: rawConfig, isLoading, isError, error } = useQuery({
    queryKey: ['reportConfiguration', nodeId],
    queryFn: async () => {
      const url = nodeId 
        ? `${API_URL}/report-configurations/get_effective_config/?node_id=${nodeId}`
        : `${API_URL}/report-configurations/`;
      const response = await axios.get(url, { headers: baseHeaders });
      return response.data;
    },
    enabled: !!accessToken
  });

  const configuration = getMostRecentConfig(rawConfig);

  // Mutation para crear o actualizar la configuración
  const { mutate: updateConfiguration, isPending: isUpdating } = useMutation({
    mutationFn: async (data: FormData | Partial<ReportConfiguration>) => {
      let url: string;
      let method: 'post' | 'put';
      let headers: HeadersType = { ...baseHeaders };

      // Si existe configuration.id, actualizar (PUT), si no, crear (POST)
      if (configuration && configuration.id) {
        url = `${API_URL}/report-configurations/${configuration.id}/`;
        method = 'put';
      } else {
        url = nodeId 
          ? `${API_URL}/report-configurations/?node_id=${nodeId}`
          : `${API_URL}/report-configurations/`;
        method = 'post';
      }

      if (data instanceof FormData) {
        headers = { ...headers, 'Content-Type': 'multipart/form-data' };
      }

      if (method === 'put') {
        // PUT para actualizar
        if (data instanceof FormData) {
          const response = await axios.put<ReportConfiguration>(url, data, { headers });
          return response.data;
        } else {
          const response = await axios.put<ReportConfiguration>(url, data, { headers });
          return response.data;
        }
      } else {
        // POST para crear
        if (data instanceof FormData) {
          const response = await axios.post<ReportConfiguration>(url, data, { headers });
          return response.data;
        } else {
          const response = await axios.post<ReportConfiguration>(url, data, { headers });
          return response.data;
        }
      }
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
        { headers: baseHeaders }
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