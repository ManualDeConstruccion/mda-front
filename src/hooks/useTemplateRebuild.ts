import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

type PendingChange = {
  id: number;
  parameter_definition: number;
  parameter_definition_code: string;
  parameter_definition_name: string;
  old_form_pdf_code: string;
  new_form_pdf_code: string;
  status: string;
  created_at: string;
};

type PendingResponse = {
  count: number;
  results: PendingChange[];
};

type RebuildPreview = {
  pending_count: number;
  rename_map_count: number;
  pending_changes: Array<{
    id: number;
    parameter_definition_id: number;
    parameter_code: string;
    old_form_pdf_code: string;
    new_form_pdf_code: string;
    created_at: string;
  }>;
  affected_templates: Array<{
    template_id: number;
    project_type_id: number;
    project_type_name: string;
    template_name: string;
    pdf_file: string;
    rename_candidates: number;
  }>;
};

/**
 * Consulta y ejecuta el flujo diferido de actualización de templates PDF.
 * Incluye pendientes, preview, apply, estado, resultado y reintento técnico.
 */
export const useTemplateRebuild = (enabled = true) => {
  const { accessToken } = useAuth();
  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const headers = {
    Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
  };

  const pendingQuery = useQuery<PendingResponse>({
    queryKey: ['template-rebuild-pending'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/formpdf/templates/rebuild/pending/`, {
        withCredentials: true,
        headers,
      });
      return response.data;
    },
    enabled: enabled && !!accessToken,
    refetchInterval: 15000,
  });

  const previewQuery = useQuery<RebuildPreview>({
    queryKey: ['template-rebuild-preview'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/formpdf/templates/rebuild/pending-preview/`, {
        withCredentials: true,
        headers,
      });
      return response.data;
    },
    enabled: false,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${API_URL}/api/formpdf/templates/rebuild/apply/`,
        {},
        { withCredentials: true, headers }
      );
      return response.data as { job_id: number; task_id: string; status: string };
    },
  });

  const statusQuery = (jobId?: number) =>
    useQuery({
      queryKey: ['template-rebuild-status', jobId],
      queryFn: async () => {
        const response = await axios.get(`${API_URL}/api/formpdf/templates/rebuild/${jobId}/status/`, {
          withCredentials: true,
          headers,
        });
        return response.data;
      },
      enabled: !!jobId && !!accessToken,
      refetchInterval: 3000,
    });

  const resultQuery = (jobId?: number) =>
    useQuery({
      queryKey: ['template-rebuild-result', jobId],
      queryFn: async () => {
        const response = await axios.get(`${API_URL}/api/formpdf/templates/rebuild/${jobId}/result/`, {
          withCredentials: true,
          headers,
        });
        return response.data;
      },
      enabled: !!jobId && !!accessToken,
    });

  const retryFailedMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await axios.post(
        `${API_URL}/api/formpdf/templates/rebuild/${jobId}/retry-failed/`,
        {},
        { withCredentials: true, headers }
      );
      return response.data as { job_id: number; task_id: string; status: string };
    },
  });

  return {
    pendingQuery,
    previewQuery,
    applyMutation,
    statusQuery,
    resultQuery,
    retryFailedMutation,
  };
};
