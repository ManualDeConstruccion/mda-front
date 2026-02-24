import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  Typography,
  LinearProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface ImportNormativeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportStats {
  types: { created: number; updated: number; errors: string[] };
  publications: { created: number; updated: number; errors: string[] };
  sections: { created: number; updated: number; errors: string[] };
  articles: { created: number; updated: number; errors: string[] };
}

const ImportNormativeModal: React.FC<ImportNormativeModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { accessToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(false);
  const [result, setResult] = useState<{ success: boolean; stats?: ImportStats; error?: string } | null>(null);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axios.post(
        `${API_URL}/api/normative/regulation-types/import_excel/?dry_run=${dryRun}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setResult({ success: data.success, stats: data.stats });
      if (data.success && !dryRun) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    },
    onError: (error: any) => {
      setResult({
        success: false,
        error: error.response?.data?.error || error.message || 'Error al importar',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    importMutation.mutate(formData);
  };

  const handleClose = () => {
    if (!importMutation.isPending) {
      setFile(null);
      setResult(null);
      setDryRun(false);
      onClose();
    }
  };

  const getTotalStats = (stats?: ImportStats): { created: number; updated: number; errors: string[] } => {
    if (!stats) return { created: 0, updated: 0, errors: [] };
    return {
      created: stats.types.created + stats.publications.created + stats.sections.created + stats.articles.created,
      updated: stats.types.updated + stats.publications.updated + stats.sections.updated + stats.articles.updated,
      errors: [
        ...stats.types.errors,
        ...stats.publications.errors,
        ...stats.sections.errors,
        ...stats.articles.errors,
      ],
    };
  };

  const totalStats = getTotalStats(result?.stats);
  const errorList: string[] = Array.isArray(totalStats.errors) ? totalStats.errors : [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Importar Normativa desde Excel</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {importMutation.isPending && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {dryRun ? 'Simulando importación...' : 'Importando normativa...'}
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {!importMutation.isPending && !result && (
            <>
              <Alert severity="info">
                Selecciona un archivo Excel (.xlsx) con la estructura de normativa.
                El archivo debe contener las hojas: Tipos, Publicaciones, Secciones, Artículos.
              </Alert>

              <Box>
                <input
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button variant="outlined" component="span" fullWidth>
                    {file ? file.name : 'Seleccionar archivo Excel'}
                  </Button>
                </label>
              </Box>

              {file && (
                <Alert severity="success">
                  Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                </Alert>
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                  />
                }
                label="Modo simulación (dry-run) - No guarda cambios, solo muestra qué se haría"
              />
            </>
          )}

          {result && (
            <Box>
              {result.success ? (
                <Alert severity={dryRun ? 'info' : 'success'} sx={{ mb: 2 }}>
                  {dryRun
                    ? 'Simulación completada. Revisa los resultados antes de importar.'
                    : 'Importación completada exitosamente.'}
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {result.error || 'Error al importar'}
                </Alert>
              )}

              {result.stats && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Resumen de Importación
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Tipos:</strong> {result.stats.types.created} creados, {result.stats.types.updated} actualizados
                    </Typography>
                    <Typography variant="body2">
                      <strong>Publicaciones:</strong> {result.stats.publications.created} creadas, {result.stats.publications.updated} actualizadas
                    </Typography>
                    <Typography variant="body2">
                      <strong>Secciones:</strong> {result.stats.sections.created} creadas, {result.stats.sections.updated} actualizadas
                    </Typography>
                    <Typography variant="body2">
                      <strong>Artículos:</strong> {result.stats.articles.created} creados, {result.stats.articles.updated} actualizados
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                      <strong>Total:</strong> {totalStats.created} creados, {totalStats.updated} actualizados
                    </Typography>
                  </Box>

                  {errorList.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Alert severity="warning">
                        <Typography variant="subtitle2" gutterBottom>
                          Errores encontrados ({errorList.length}):
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, m: 0, maxHeight: 200, overflow: 'auto' }}>
                          {errorList.slice(0, 10).map((error: string, idx: number) => (
                            <li key={idx}>
                              <Typography variant="caption">{error}</Typography>
                            </li>
                          ))}
                          {errorList.length > 10 && (
                            <Typography variant="caption" color="text.secondary">
                              ... y {errorList.length - 10} errores más
                            </Typography>
                          )}
                        </Box>
                      </Alert>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={importMutation.isPending}>
          {result ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!result && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!file || importMutation.isPending}
          >
            {dryRun ? 'Simular Importación' : 'Importar'}
          </Button>
        )}
        {result && !dryRun && result.success && (
          <Button onClick={handleClose} variant="contained">
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportNormativeModal;
