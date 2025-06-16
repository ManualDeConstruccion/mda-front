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

export interface ReportConfiguration {
  id?: number;
  user: number;
  node: number | null;
  node_type: string | null;
  is_default: boolean;
  page_size: 'A4' | 'letter' | 'legal' | 'oficio' | 'custom';
  custom_page_width?: number;
  custom_page_height?: number;
  orientation: 'portrait' | 'landscape';
  margins: Margins;
  header_text: string;
  header_font_size: number;
  header_font_style: string;
  footer_text: string;
  footer_font_size: number;
  footer_font_style: string;
  logo: string;
  logo_position: string;
  logo_size: string;
  show_page_numbers: boolean;
  page_number_position: 'bottom_center' | 'bottom_right' | 'bottom_left';
  created_at?: string;
  updated_at?: string;
}

type HeadersType = Record<string, string>;

export type UseReportConfigurationsOptions = {
  userId?: number;
  nodeId?: number;
};

export const useReportConfigurations = (options: UseReportConfigurationsOptions) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const baseHeaders: HeadersType = { Authorization: `Bearer ${accessToken}` };

  // Construir URL según el modo
  const getUrl = () => {
    if (options.nodeId) {
      return `${API_URL}/node-report-configurations/?node_id=${options.nodeId}`;
    }
    if (options.userId) {
      return `${API_URL}/user-report-configurations/?user_id=${options.userId}`;
    }
    throw new Error('Either userId or nodeId must be provided');
  };

  // Query para obtener la configuración
  const { data: configuration, isLoading, isError, error } = useQuery({
    queryKey: ['reportConfiguration', options.userId, options.nodeId],
    queryFn: async () => {
      console.log('Fetching configuration with options:', options);
      const response = await axios.get(getUrl(), { headers: baseHeaders });
      console.log('Configuration response:', response.data);
      // Si es array, retorna el primer elemento, si no, retorna undefined
      return Array.isArray(response.data) ? response.data[0] : response.data;
    },
    enabled: !!accessToken && (!!options.userId || !!options.nodeId)
  });

  // Mutation para crear o actualizar la configuración
  const { mutate: updateConfiguration, isPending: isUpdating } = useMutation({
    mutationFn: async (data: FormData | Partial<ReportConfiguration>) => {
      console.log('Mutation data:', data);
      console.log('Current configuration:', configuration);

      const headers = data instanceof FormData 
        ? { ...baseHeaders, 'Content-Type': 'multipart/form-data' }
        : baseHeaders;

      try {
        // Primero intentamos obtener la configuración existente
        const existingConfig = await axios.get<ReportConfiguration[]>(getUrl(), { headers });
        const configExists = existingConfig.data && existingConfig.data.length > 0;

        // Construir la URL base con los parámetros de consulta
        const baseUrl = `${API_URL}/${options.nodeId ? 'node' : 'user'}-report-configurations/`;
        const queryParams = options.nodeId ? `node_id=${options.nodeId}` : `user_id=${options.userId}`;

        if (configExists) {
          // Si existe, actualizamos
          const configId = existingConfig.data[0].id;
          console.log('Updating existing configuration:', configId);
          const response = await axios.put<ReportConfiguration>(
            `${baseUrl}${configId}/?${queryParams}`,
            data,
            { headers }
          );
          console.log('Update response:', response.data);
          return response.data;
        } else {
          // Si no existe, creamos una nueva
          console.log('Creating new configuration');
          const response = await axios.post<ReportConfiguration>(
            `${baseUrl}?${queryParams}`,
            data,
            { headers }
          );
          console.log('Create response:', response.data);
          return response.data;
        }
      } catch (error) {
        console.error('Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Mutation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['reportConfiguration', options.userId, options.nodeId] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    }
  });

  return {
    configuration,
    isLoading,
    isError,
    error,
    updateConfiguration,
    isUpdating
  };
}; 