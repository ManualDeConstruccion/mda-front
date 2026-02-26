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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  Collapse,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { api } from '../../services/api';

/** Respuesta del preview: conteo por modelo y lista de ítems modificados */
export interface RestorePreviewResponse {
  added_counts: Record<string, number>;
  modified: Array<{
    key: string;
    model: string;
    pk: string | number;
    label: string;
    fields_changed: Array<{
      field: string;
      field_label: string;
      old_value: string;
      new_value: string;
    }>;
  }>;
}

/** Respuesta del apply */
export interface RestoreApplyResponse {
  message: string;
  added_counts: Record<string, number>;
  updated_count: number;
  errors?: string[];
}

const MODEL_LABELS: Record<string, string> = {
  'normative.regulationtype': 'Tipo de documento',
  'normative.officialpublication': 'Publicación oficial',
  'normative.publicationsection': 'Sección de publicación',
  'normative.regulationarticle': 'Artículo de normativa',
  'architecture_projects.category': 'Categoría',
  'architecture_projects.architectureprojecttype': 'Tipo de proyecto',
  'architecture_projects.formtype': 'Tipo de formulario',
  'architecture_projects.projecttypelisttemplate': 'Plantilla de listado',
  'architecture_projects.projecttypelist': 'Listado de tipo de proyecto',
  'parameters.parametercategory': 'Categoría de parámetro',
  'parameters.parameterdefinition': 'Definición de parámetro',
  'parameters.formtype': 'Tipo de formulario (parámetros)',
  'parameters.formparametercategory': 'Sección de formulario',
  'parameters.formparameter': 'Parámetro de formulario',
  'parameters.formgridcell': 'Celda de grilla',
};

/**
 * Página General de Administración.
 * Exportar: descarga JSON (dumpdata).
 * Importar: flujo en 2 pasos — preview (comparar), luego aceptar/rechazar por ítem modificado y apply.
 */
const GeneralPage: React.FC = () => {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [importStep, setImportStep] = useState<'select' | 'preview' | 'applying'>('select');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [fileForApply, setFileForApply] = useState<File | null>(null);
  const [preview, setPreview] = useState<RestorePreviewResponse | null>(null);
  const [acceptedKeys, setAcceptedKeys] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExportError(null);
    setExportSuccess(false);
    setExportLoading(true);
    try {
      const response = await api.get<Blob>('/admin/backup/', {
        responseType: 'blob',
      });
      const blob = response.data;
      const contentDisposition = response.headers['content-disposition'];
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
    } catch (e: unknown) {
      let message = 'Error al exportar';
      if (e && typeof e === 'object' && 'response' in e) {
        const res = (e as { response?: { data?: Blob; status?: number } }).response;
        if (res?.data instanceof Blob) {
          try {
            const text = await res.data.text();
            const err = JSON.parse(text);
            message = err.detail || err.error || message;
          } catch {
            message = res?.status === 401 ? 'Sesión expirada. Vuelve a iniciar sesión.' : message;
          }
        }
      } else if (e instanceof Error) {
        message = e.message;
      }
      setExportError(message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);
    setPreview(null);
    setAcceptedKeys(new Set());
    setFileForApply(null);
    setImportStep('preview');
    setImportProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<RestorePreviewResponse>('/admin/restore/preview/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total && e.total > 0) {
            setImportProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });
      setPreview(response.data);
      setFileForApply(file);
      setAcceptedKeys(new Set((response.data.modified || []).map((m) => m.key)));
      setImportStep('select');
    } catch (e: unknown) {
      let message = 'Error al comparar';
      if (e && typeof e === 'object' && 'response' in e) {
        const res = (e as { response?: { data?: { detail?: string }; status?: number } }).response;
        const data = res?.data;
        if (data && typeof data === 'object') {
          message = (data as { detail?: string }).detail || message;
        } else if (res?.status === 401) {
          message = 'Sesión expirada. Vuelve a iniciar sesión.';
        }
      } else if (e instanceof Error) {
        message = e.message;
      }
      setImportError(message);
      setImportStep('select');
    } finally {
      setImportProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleAccepted = (key: string) => {
    setAcceptedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleApply = async () => {
    if (!fileForApply || !preview) return;

    setImportError(null);
    setImportSuccess(null);
    setImportStep('applying');

    const formData = new FormData();
    formData.append('file', fileForApply);
    formData.append('accepted_modified_keys', JSON.stringify(Array.from(acceptedKeys)));

    try {
      const response = await api.post<RestoreApplyResponse>('/admin/restore/apply/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total && e.total > 0) {
            setImportProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });
      setImportSuccess(response.data?.message || 'Importación completada.');
      setPreview(null);
      setFileForApply(null);
      setAcceptedKeys(new Set());
    } catch (e: unknown) {
      let message = 'Error al importar';
      if (e && typeof e === 'object' && 'response' in e) {
        const res = (e as { response?: { data?: { detail?: string }; status?: number } }).response;
        const data = res?.data;
        if (data && typeof data === 'object') {
          message = (data as { detail?: string }).detail || message;
        } else if (res?.status === 401) {
          message = 'Sesión expirada. Vuelve a iniciar sesión.';
        }
      } else if (e instanceof Error) {
        message = e.message;
      }
      setImportError(message);
    } finally {
      setImportStep('select');
      setImportProgress(0);
    }
  };

  const handleResetImport = () => {
    setImportStep('select');
    setImportError(null);
    setImportSuccess(null);
    setPreview(null);
    setFileForApply(null);
    setAcceptedKeys(new Set());
    setExpandedRow(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalAdded = preview ? Object.values(preview.added_counts).reduce((a, b) => a + b, 0) : 0;
  const hasModified = preview && preview.modified && preview.modified.length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Administración general
      </Typography>
      <Typography color="text.secondary" paragraph>
        Respaldar e importar la configuración de Normativas, Tipos de proyecto y Parámetros en formato JSON.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
          Se incluyen: Normativa (tipos, publicaciones, secciones, artículos), Architecture projects
          (categorías, tipos de proyecto, plantillas) y Parameters (categorías, definiciones, secciones de formulario).
          La importación compara con los datos existentes: nuevos se añaden; modificaciones se muestran para aceptar o rechazar por ítem.
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
              Descarga un archivo JSON con todos los modelos de administración.
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
              Sube un JSON generado por la exportación. Se comparará con los datos actuales: los nuevos se añadirán;
              los ítems modificados se listarán para que aceptes o rechaces cada cambio.
              Tras importar, se reajustan automáticamente las secuencias de la base de datos para que puedas crear nuevos registros sin errores de clave duplicada.
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
            {(importStep === 'preview' || importStep === 'applying') && importProgress > 0 && importProgress < 100 && (
              <LinearProgress variant="determinate" value={importProgress} sx={{ mb: 2 }} />
            )}

            {importStep === 'select' && !preview && (
              <CardActions sx={{ px: 0, pb: 0 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar archivo y comparar
                </Button>
              </CardActions>
            )}

            {preview && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Resumen
                </Typography>
                {totalAdded > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Registros nuevos que se añadirán (por modelo):
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                      {Object.entries(preview.added_counts).map(([model, count]) => (
                        <Chip
                          key={model}
                          label={`${MODEL_LABELS[model] || model}: ${count}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
                {!totalAdded && !hasModified && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No hay registros nuevos ni modificaciones respecto a los datos actuales.
                  </Alert>
                )}
                {hasModified && (
                  <>
                    <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                      Ítems modificados — marca los que quieras aplicar:
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox">Aplicar</TableCell>
                            <TableCell>Modelo</TableCell>
                            <TableCell>Nombre / ID</TableCell>
                            <TableCell>Campos modificados</TableCell>
                            <TableCell width={48} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {preview.modified.map((item) => (
                            <React.Fragment key={item.key}>
                              <TableRow>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={acceptedKeys.has(item.key)}
                                    onChange={() => toggleAccepted(item.key)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {MODEL_LABELS[item.model] || item.model}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={500}>
                                    {item.label || '(sin nombre)'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {item.pk}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.fields_changed.length} campo(s) cambiado(s)
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="small"
                                    onClick={() =>
                                      setExpandedRow((prev) => (prev === item.key ? null : item.key))
                                    }
                                    endIcon={
                                      expandedRow === item.key ? (
                                        <ExpandLessIcon />
                                      ) : (
                                        <ExpandMoreIcon />
                                      )
                                    }
                                  >
                                    {expandedRow === item.key ? 'Menos' : 'Detalle'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell colSpan={5} sx={{ py: 0, borderBottom: 0 }}>
                                  <Collapse in={expandedRow === item.key}>
                                    <Box sx={{ py: 1, pl: 2 }}>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell>Campo</TableCell>
                                            <TableCell>Valor actual</TableCell>
                                            <TableCell>Valor nuevo</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {item.fields_changed.map((fc) => (
                                            <TableRow key={fc.field}>
                                              <TableCell>{fc.field_label || fc.field}</TableCell>
                                              <TableCell sx={{ maxWidth: 280, wordBreak: 'break-all' }}>
                                                {fc.old_value || '—'}
                                              </TableCell>
                                              <TableCell sx={{ maxWidth: 280, wordBreak: 'break-all' }}>
                                                {fc.new_value || '—'}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleApply}
                        disabled={importStep === 'applying' || (totalAdded === 0 && acceptedKeys.size === 0)}
                        startIcon={
                          importStep === 'applying' ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : undefined
                        }
                      >
                        {importStep === 'applying'
                          ? 'Importando…'
                          : `Importar (${totalAdded} nuevos, ${acceptedKeys.size} actualizaciones aceptadas)`}
                      </Button>
                      <Button variant="outlined" onClick={handleResetImport} disabled={importStep === 'applying'}>
                        Elegir otro archivo
                      </Button>
                    </Stack>
                  </>
                )}
                {preview && !hasModified && totalAdded > 0 && (
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleApply}
                      disabled={importStep === 'applying'}
                      startIcon={
                        importStep === 'applying' ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : undefined
                      }
                    >
                      {importStep === 'applying' ? 'Importando…' : `Importar ${totalAdded} nuevos`}
                    </Button>
                    <Button variant="outlined" onClick={handleResetImport} disabled={importStep === 'applying'}>
                      Elegir otro archivo
                    </Button>
                  </Stack>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default GeneralPage;
