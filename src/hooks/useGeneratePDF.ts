import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface GeneratePDFOptions {
  nodeId: string | number;
  data: any;
  configId: number;
  filename?: string;
}

export const useGeneratePDF = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async ({ nodeId, data, configId, filename = `reporte_nodo_${nodeId}.pdf` }: GeneratePDFOptions) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_URL}/export-report/pdf/`,
        {
          node_id: nodeId,
          data,
          config_id: configId,
        },
        {
          responseType: 'blob',
        }
      );
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePDF, isGenerating, error };
};