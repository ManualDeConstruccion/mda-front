import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export type PdfImportStartPayload =
  | {
      project_type: number;
      template_id: number;
    }
  | {
      project_type: number;
      form_code: string;
      pdf: File;
    };

export interface PdfImportStatus {
  id: number;
  status: string;
  progress: number;
  progress_message: string;
  error_message: string;
  pdf_semantic_url?: string | null;
}

export type PdfImportProposals = Record<
  string,
  {
    action: 'assign_existing' | 'create_new' | 'ignore' | string;
    code: string;
    confidence?: string;
    evidence?: string;
    scope?: string;
    data_type?: string;
    suggested_name?: string;
    _pdf_meta?: Record<string, any>;
  }
>;

export interface PdfImportApplyPayload {
  proposals: PdfImportProposals;
  create_sections: boolean;
}

/**
 * Orquesta la importación desde PDF vía endpoints del backend:
 * 1) inicia el análisis (multipart) -> crea un `PdfImportJob`,
 * 2) hace polling del estado hasta llegar a `review`,
 * 3) entrega `proposals` editables,
 * 4) aplica confirmación creando/actualizando la estructura MDA.
 */
export function usePdfImport() {
  const [jobId, setJobId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const statusQuery = useQuery<PdfImportStatus>({
    queryKey: ['pdf-import-status', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      if (!jobId) throw new Error('Missing jobId');
      const { data } = await api.get(`parameters/pdf-import/${jobId}/status/`);
      return data as PdfImportStatus;
    },
    refetchInterval: (data) => {
      if (!data) return 2000;
      if (data.status === 'done' || data.status === 'error') return false;
      return 2000;
    },
  });

  const proposalsQuery = useQuery<{
    id: number;
    status: string;
    field_info: any[];
    proposals: PdfImportProposals;
    mapping: any;
  }>({
    queryKey: ['pdf-import-proposals', jobId],
    enabled:
      !!jobId &&
      (statusQuery.data?.status === 'review' ||
        statusQuery.data?.status === 'done' ||
        statusQuery.data?.status === 'applying'),
    queryFn: async () => {
      if (!jobId) throw new Error('Missing jobId');
      const { data } = await api.get(`parameters/pdf-import/${jobId}/proposals/`);
      return data;
    },
  });

  const startMutation = useMutation({
    mutationFn: async (payload: PdfImportStartPayload) => {
      const form = new FormData();
      form.append('project_type', payload.project_type.toString());

      if ('template_id' in payload) {
        form.append('template_id', payload.template_id.toString());
      } else {
        form.append('pdf', payload.pdf);
        form.append('form_code', payload.form_code);
      }

      const res = await api.post(`parameters/pdf-import/analyze/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data as { job_id: number };
    },
    onSuccess: (data) => {
      setJobId(data.job_id);
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (payload: PdfImportApplyPayload) => {
      if (!jobId) throw new Error('Missing jobId');
      const res = await api.post(`parameters/pdf-import/${jobId}/apply/`, payload);
      return res.data as any;
    },
    onSuccess: () => {
      // El usuario normalmente recarga/renueva la estructura, pero invalidar por si acaso.
      queryClient.invalidateQueries();
    },
  });

  const canFetchProposals = useMemo(() => {
    const s = statusQuery.data?.status;
    return s === 'review' || s === 'done' || s === 'applying';
  }, [statusQuery.data?.status]);

  const reset = useCallback(() => {
    setJobId(null);
    queryClient.removeQueries({ queryKey: ['pdf-import-status'] });
    queryClient.removeQueries({ queryKey: ['pdf-import-proposals'] });
  }, [queryClient]);

  return {
    jobId,
    statusQuery,
    proposalsQuery: canFetchProposals ? proposalsQuery : undefined,
    startMutation,
    applyMutation,
    reset,
  };
}

