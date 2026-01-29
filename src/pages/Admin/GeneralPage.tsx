import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  CardActions,
  Divider,
  LinearProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoIcon from '@mui/icons-material/Info';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

/**
 * Página General de Administración.
 * Permite exportar (respaldar) e importar la base de datos de modelos de
 * normativa, architecture_projects y parameters en formato JSON (dumpdata/loaddata).
 * Preparado para miles de registros con proceso automático.
 */
const GeneralPage: React.FC = () => {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExportError(null);
    setExportSuccess(false);
    setExportLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/admin/backup/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || `Error ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'mda_admin_backup.json';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match) filename = match[1].trim();
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportSuccess(true);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Error al exportar');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);
    setImportLoading(true);
    setImportProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('auth_token');
      const xhr = new XMLHttpRequest();

      const promise = new Promise<{ message: string; loaded?: number }>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setImportProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch {
              resolve({ message: 'Importación completada' });
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.detail || err.error || err.message || `Error ${xhr.status}`));
            } catch {
              reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
            }
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Error de red')));
        xhr.open('POST', `${API_URL}/api/admin/restore/`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        const csrf = document.cookie.match(/mdc_csrftoken=([^;]+)/)?.[1];
        if (csrf) xhr.setRequestHeader('X-CSRFToken', csrf);
        xhr.withCredentials = true;
        xhr.send(formData);
      });

      const result = await promise;
      setImportSuccess(result.message || 'Importación completada correctamente.');
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Error al importar');
    } finally {
      setImportLoading(false);
      setImportProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Administración general
      </Typography>
      <Typography color="text.secondary" paragraph>
        Respaldar e importar la configuración de Normativas, Tipos de proyecto y Parámetros en formato JSON.
        El proceso es automático y soporta miles de registros.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
          Se incluyen: Normativa (tipos, publicaciones, secciones, artículos), Architecture projects
          (categorías, tipos de proyecto, plantillas) y Parameters (categorías, definiciones, secciones de formulario).
          Formato: JSON (Django dumpdata/loaddata).
        </Alert>
      </Box>

      <Stack spacing={3}>
        {/* Exportar */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Exportar (respaldar)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Descarga un archivo JSON con todos los modelos de administración. Úsalo para respaldo o para
              importar en otro entorno (QA, Producción).
            </Typography>
            {exportError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExportError(null)}>
                {exportError}
              </Alert>
            )}
            {exportSuccess && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setExportSuccess(false)}>
                Archivo descargado correctamente.
              </Alert>
            )}
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2 }}>
            <Button
              variant="contained"
              startIcon={exportLoading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              onClick={handleExport}
              disabled={exportLoading}
            >
              {exportLoading ? 'Generando…' : 'Descargar respaldo'}
            </Button>
          </CardActions>
        </Card>

        <Divider />

        {/* Importar */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Importar (restaurar)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Sube un archivo JSON generado por la exportación. Reemplazará/actualizará los datos de
              normativa, tipos de proyecto y parámetros. El proceso se ejecuta en una transacción (todo o nada).
            </Typography>
            {importError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setImportError(null)}>
                {importError}
              </Alert>
            )}
            {importSuccess && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setImportSuccess(null)}>
                {importSuccess}
              </Alert>
            )}
            {importLoading && importProgress > 0 && importProgress < 100 && (
              <LinearProgress variant="determinate" value={importProgress} sx={{ mb: 2 }} />
            )}
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            <Button
              variant="contained"
              color="secondary"
              component="span"
              startIcon={importLoading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
            >
              {importLoading ? 'Importando…' : 'Seleccionar archivo e importar'}
            </Button>
          </CardActions>
        </Card>
      </Stack>
    </Container>
  );
};

export default GeneralPage;
