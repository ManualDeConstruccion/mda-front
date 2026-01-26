// src/hooks/usePDFGeneration.ts
/**
 * Hook para gestionar la generación asíncrona de PDFs.
 * 
 * Este hook maneja:
 * - Iniciar la generación asíncrona
 * - Hacer polling del estado de la tarea
 * - Descargar el PDF cuando esté listo
 * - Manejo de errores y reintentos
 * 
 * Uso:
 * ```tsx
 * const { generatePDF, status, progress, error, downloadUrl } = usePDFGeneration();
 * 
 * // Iniciar generación
 * await generatePDF(subprojectId);
 * 
 * // El hook hace polling automáticamente y actualiza el estado
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../services/api';

export type PDFGenerationStatus = 
  | 'idle'
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'timeout';

interface TaskStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  download_url?: string;
  file_size?: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  retry_count: number;
}

interface UsePDFGenerationResult {
  /** Inicia la generación de PDF */
  generatePDF: (subprojectId: number) => Promise<void>;
  /** Estado actual de la generación */
  status: PDFGenerationStatus;
  /** Progreso estimado (0-100) */
  progress: number;
  /** Error si ocurrió */
  error: string | null;
  /** URL de descarga cuando está listo */
  downloadUrl: string | null;
  /** ID de la tarea en Celery */
  taskId: string | null;
  /** Tamaño del archivo en bytes */
  fileSize: number | null;
  /** Duración de la generación en segundos */
  durationSeconds: number | null;
  /** Reinicia el estado */
  reset: () => void;
  /** Indica si está en proceso */
  isGenerating: boolean;
}

const POLLING_INTERVAL = 2000; // 2 segundos
const MAX_POLLING_TIME = 300000; // 5 minutos

export const usePDFGeneration = (): UsePDFGenerationResult => {
  const [status, setStatus] = useState<PDFGenerationStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);

  /**
   * Limpia el polling interval
   */
  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    pollingStartTimeRef.current = null;
  }, []);

  /**
   * Consulta el estado de la tarea
   */
  const checkTaskStatus = useCallback(async (taskIdToCheck: string) => {
    try {
      const response = await api.get<TaskStatusResponse>(
        `/formpdf/templates/tasks/status/${taskIdToCheck}/`
      );
      
      const data = response.data;
      
      // Actualizar progreso basado en estado
      if (data.status === 'pending') {
        setStatus('pending');
        setProgress(10);
      } else if (data.status === 'processing') {
        setStatus('processing');
        // Progreso entre 20% y 90% mientras procesa
        setProgress(prev => Math.min(prev + 5, 90));
      } else if (data.status === 'success') {
        setStatus('success');
        setProgress(100);
        setDownloadUrl(data.download_url || null);
        setFileSize(data.file_size || null);
        setDurationSeconds(data.duration_seconds || null);
        
        // Detener polling
        clearPolling();
        
        // Iniciar descarga automática sin cambiar de vista
        if (data.download_url) {
          // Crear un elemento <a> temporal para descargar
          const link = document.createElement('a');
          link.href = data.download_url;
          link.download = `formulario_subproject_${data.download_url.split('/').pop()}`; // Nombre del archivo
          link.target = '_blank'; // Por si falla la descarga, abre en nueva pestaña
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log(`PDF descargado desde: ${data.download_url}`);
        }
      } else if (data.status === 'failed') {
        setStatus('failed');
        setError(data.error_message || 'Error desconocido al generar PDF');
        clearPolling();
      } else if (data.status === 'cancelled') {
        setStatus('failed');
        setError('Generación cancelada');
        clearPolling();
      }
    } catch (err: any) {
      console.error('Error consultando estado de tarea:', err);
      
      // Si es 404, la tarea no existe (raro, pero posible)
      if (err.response?.status === 404) {
        setStatus('failed');
        setError('Tarea no encontrada');
        clearPolling();
      }
      // Para otros errores, seguir intentando (puede ser temporal)
    }
  }, [clearPolling]);

  /**
   * Inicia el polling del estado de la tarea
   */
  const startPolling = useCallback((taskIdToPoll: string) => {
    pollingStartTimeRef.current = Date.now();
    
    // Consultar inmediatamente
    checkTaskStatus(taskIdToPoll);
    
    // Configurar polling periódico
    pollingIntervalRef.current = setInterval(() => {
      // Verificar timeout
      if (pollingStartTimeRef.current) {
        const elapsed = Date.now() - pollingStartTimeRef.current;
        if (elapsed > MAX_POLLING_TIME) {
          setStatus('timeout');
          setError('La generación está tardando demasiado. Por favor, intenta nuevamente.');
          clearPolling();
          return;
        }
      }
      
      checkTaskStatus(taskIdToPoll);
    }, POLLING_INTERVAL);
  }, [checkTaskStatus, clearPolling]);

  /**
   * Inicia la generación de PDF
   */
  const generatePDF = useCallback(async (subprojectId: number) => {
    try {
      // Resetear estado
      setStatus('pending');
      setProgress(0);
      setError(null);
      setDownloadUrl(null);
      setTaskId(null);
      setFileSize(null);
      setDurationSeconds(null);
      clearPolling();
      
      console.log(`Iniciando generación de PDF para subproject ${subprojectId}...`);
      
      // Iniciar generación (POST)
      const response = await api.post<{
        task_id: string;
        status: string;
        message: string;
      }>(`/formpdf/templates/generate/${subprojectId}/`);
      
      const { task_id, message } = response.data;
      
      console.log(`Generación iniciada: task_id=${task_id}`);
      
      setTaskId(task_id);
      setStatus('pending');
      setProgress(5);
      
      // Iniciar polling
      startPolling(task_id);
      
    } catch (err: any) {
      console.error('Error iniciando generación de PDF:', err);
      
      let errorMessage = 'Error al iniciar generación de PDF';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setStatus('failed');
      setError(errorMessage);
      setProgress(0);
    }
  }, [clearPolling, startPolling]);

  /**
   * Reinicia el estado del hook
   */
  const reset = useCallback(() => {
    clearPolling();
    setStatus('idle');
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
    setTaskId(null);
    setFileSize(null);
    setDurationSeconds(null);
  }, [clearPolling]);

  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  return {
    generatePDF,
    status,
    progress,
    error,
    downloadUrl,
    taskId,
    fileSize,
    durationSeconds,
    reset,
    isGenerating: status === 'pending' || status === 'processing',
  };
};
