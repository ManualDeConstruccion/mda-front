import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
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

export interface PdfImportSection {
  number: string;
  name: string;
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
  import_mode?: 'full_import' | 'create_sections' | 'semantic_only';
}

const storageKeyForProject = (projectTypeId: number) =>
  `mda-pdf-import-job-${projectTypeId}`;

export type UsePdfImportOptions = {
  /** Tipo de proyecto del formulario (clave de persistencia del borrador). */
  projectTypeId: number;
  /** Solo restaurar `jobId` desde localStorage cuando el wizard está abierto. */
  wizardOpen: boolean;
};

/**
 * Orquesta la importación desde PDF vía endpoints del backend:
 * 1) inicia el análisis (multipart) -> crea un `PdfImportJob`,
 * 2) hace polling del estado hasta llegar a `review`,
 * 3) entrega `proposals` editables,
 * 4) aplica confirmación creando/actualizando la estructura MDA.
 *
 * El `jobId` del último análisis se persiste en localStorage por `projectTypeId`
 * para poder cerrar el wizard y retomar en revisión sin volver a gastar tokens.
 */
export function usePdfImport({ projectTypeId, wizardOpen }: UsePdfImportOptions) {
  const storageKey = storageKeyForProject(projectTypeId);
  const [jobId, setJobId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const [sections, setSections] = useState<PdfImportSection[]>([]);
  const [proposalsBySection, setProposalsBySection] = useState<Record<string, string[]>>({});
  const [sectionFieldCounts, setSectionFieldCounts] = useState<Record<string, number>>({});

  const statusQuery = useQuery<PdfImportStatus>({
    queryKey: ['pdf-import-status', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      if (!jobId) throw new Error('Missing jobId');
      const { data } = await api.get(`parameters/pdf-import/${jobId}/status/`);
      return data as PdfImportStatus;
    },
    refetchInterval: (data) => {
      // En esta versión de tanstack, `refetchInterval` recibe el query como parámetro.
      const d = (data as any)?.state?.data as PdfImportStatus | undefined;
      if (!d) return 2000;
      if (d.status === 'done' || d.status === 'error') return false;
      return 2000;
    },
  });

  const proposalsQuery = useQuery<{
    id: number;
    status: string;
    field_info: any[];
    proposals: PdfImportProposals;
    mapping: any;
    sections?: PdfImportSection[];
    proposals_by_section?: Record<string, string[]>;
    section_field_counts?: Record<string, number>;
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

  useEffect(() => {
    if (!proposalsQuery.data) return;
    setSections(proposalsQuery.data.sections ?? []);
    setProposalsBySection(proposalsQuery.data.proposals_by_section ?? {});
    setSectionFieldCounts(proposalsQuery.data.section_field_counts ?? {});
  }, [proposalsQuery.data]);

  /**
   * Al abrir el wizard: cargar el job guardado para este `projectTypeId`.
   * Si cambias de formulario (otro tipo), se limpia el job del otro tipo.
   */
  useLayoutEffect(() => {
    if (!wizardOpen) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const id = parseInt(raw, 10);
        if (!Number.isNaN(id)) {
          setJobId(id);
          return;
        }
      }
      setJobId(null);
    } catch {
      setJobId(null);
    }
  }, [wizardOpen, storageKey]);

  const persistJobId = useCallback(
    (id: number) => {
      try {
        localStorage.setItem(storageKey, String(id));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const clearPersistedJob = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setJobId(null);
    setSections([]);
    setProposalsBySection({});
    setSectionFieldCounts({});
    queryClient.removeQueries({ queryKey: ['pdf-import-status'] });
    queryClient.removeQueries({ queryKey: ['pdf-import-proposals'] });
  }, [storageKey, queryClient]);

  /** Job fallido en servidor: limpiar borrador para permitir un nuevo análisis. */
  useEffect(() => {
    const st = statusQuery.data?.status;
    if (st !== 'error') return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setJobId(null);
    queryClient.removeQueries({ queryKey: ['pdf-import-status'] });
    queryClient.removeQueries({ queryKey: ['pdf-import-proposals'] });
  }, [statusQuery.data?.status, storageKey, queryClient]);

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
      setSections([]);
      setProposalsBySection({});
      setSectionFieldCounts({});
      setJobId(data.job_id);
      persistJobId(data.job_id);
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (payload: PdfImportApplyPayload) => {
      if (!jobId) throw new Error('Missing jobId');
      const res = await api.post(`parameters/pdf-import/${jobId}/apply/`, payload);
      return res.data as any;
    },
    onSuccess: () => {
      clearPersistedJob();
      queryClient.invalidateQueries();
    },
  });

  const canFetchProposals = useMemo(() => {
    const s = statusQuery.data?.status;
    return s === 'review' || s === 'done' || s === 'applying';
  }, [statusQuery.data?.status]);

  /** Descarta el borrador guardado y vuelve a estado inicial (nuevo análisis). */
  const discardDraft = useCallback(() => {
    clearPersistedJob();
  }, [clearPersistedJob]);

  return {
    jobId,
    statusQuery,
    proposalsQuery: canFetchProposals ? proposalsQuery : undefined,
    startMutation,
    applyMutation,
    discardDraft,
    sections,
    proposalsBySection,
    sectionFieldCounts,
  };
}

