import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  FormControlLabel,
  Switch,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface PdfTemplateItem {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  uploaded_at: string;
  pdf_file_url?: string;
  architecture_project_type: number;
  architecture_project_type_name?: string;
  architecture_project_type_code?: string;
  minvu_form_code?: string;
  version?: string;
}

interface LoadPdfTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  architectureProjectTypeId: number;
  architectureProjectTypeName: string;
  /** Código del tipo de proyecto para filtrar el listado */
  architectureProjectTypeCode: string;
}

const LoadPdfTemplateModal: React.FC<LoadPdfTemplateModalProps> = ({
  open,
  onClose,
  onSuccess,
  architectureProjectTypeId,
  architectureProjectTypeName,
  architectureProjectTypeCode,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [activePdfFileUrl, setActivePdfFileUrl] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [minvuFormCode, setMinvuFormCode] = useState('');
  const [version, setVersion] = useState('');
  const [isActive, setIsActive] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const resolvedPdfPreviewUrl = (() => {
    if (!pdfPreviewUrl) return null;
    // URLs locales (blob) no deben tocarse.
    if (pdfPreviewUrl.startsWith('blob:')) return pdfPreviewUrl;
    // `pdf_file_url` suele venir como `/media/...` desde backend.
    if (pdfPreviewUrl.startsWith('/')) return `${API_URL}${pdfPreviewUrl}`;
    return pdfPreviewUrl;
  })();

  // Listado de templates del tipo de proyecto (filtrado por architecture_project_type)
  const { data: templatesData, isLoading: loadingTemplates } = useQuery<
    PdfTemplateItem[] | { results: PdfTemplateItem[] }
  >({
    queryKey: ['pdf-templates', architectureProjectTypeCode],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/formpdf/templates/?project_type=${encodeURIComponent(architectureProjectTypeCode)}`,
        {
          withCredentials: true,
          headers: { Authorization: accessToken ? `Bearer ${accessToken}` : undefined },
        }
      );
      return response.data;
    },
    enabled: open && !!architectureProjectTypeCode && !!accessToken,
  });

  const templatesList = Array.isArray(templatesData) ? templatesData : templatesData?.results ?? [];
  const hasTemplates = templatesList.length > 0;
  const templatesCount = templatesList.length;
  const showTabs = templatesCount > 1;

  useEffect(() => {
    if (open) {
      const active = templatesList.find((t) => t.is_active) ?? templatesList[0] ?? null;

      // Si existen templates, queremos que "Editar template PDF" abra directamente el formulario
      // para que el usuario pueda modificar metadata (sin necesidad de ir a la pestaña Listado).
      setActiveTab(hasTemplates && showTabs ? 1 : 0);

      setName(active?.name ?? '');
      setDescription(active?.description ?? '');
      setMinvuFormCode(active?.minvu_form_code ?? '');
      setVersion(active?.version ?? '');
      setIsActive(active?.is_active ?? true);
      setPdfFile(null);
      setActivePdfFileUrl(active?.pdf_file_url ?? null);
      setPdfPreviewUrl(active?.pdf_file_url ?? null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, hasTemplates, showTabs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Si el usuario selecciona un PDF nuevo, creamos una URL local para vista previa.
    if (!open) return;

    if (pdfFile) {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(pdfFile);
      objectUrlRef.current = url;
      setPdfPreviewUrl(url);
      return;
    }

    // Si no hay archivo nuevo seleccionado, volvemos al URL del template activo.
    setPdfPreviewUrl(activePdfFileUrl);

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [pdfFile, open, activePdfFileUrl]);


  const uploadMutation = useMutation({
    mutationFn: async () => {
      // Al editar un template existente el PDF no siempre es obligatorio:
      // si no se sube, el backend debe mantener el pdf_file actual.
      const requirePdf = !hasTemplates;
      if (requirePdf && !pdfFile) throw new Error('Debe seleccionar un archivo PDF');
      const formData = new FormData();
      formData.append('architecture_project_type', String(architectureProjectTypeId));
      formData.append('name', name.trim() || architectureProjectTypeName);
      formData.append('description', description);
      if (pdfFile) {
        formData.append('pdf_file', pdfFile);
      }
      formData.append('minvu_form_code', minvuFormCode);
      formData.append('version', version);
      formData.append('is_active', String(isActive));
      const response = await axios.post(
        `${API_URL}/api/formpdf/templates/upload/`,
        formData,
        {
          withCredentials: true,
          headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['pdf-templates', architectureProjectTypeCode] });
      onSuccess();
      const updated = data as Partial<PdfTemplateItem> | undefined;
      if (hasTemplates && updated) {
        // Edición: mantener formulario con datos actuales o con la respuesta del servidor
        if (updated.name !== undefined) setName(updated.name);
        if (updated.description !== undefined) setDescription(updated.description ?? '');
        if (updated.minvu_form_code !== undefined) setMinvuFormCode(updated.minvu_form_code ?? '');
        if (updated.version !== undefined) setVersion(updated.version ?? '');
        if (updated.is_active !== undefined) setIsActive(updated.is_active);
        if (updated.pdf_file_url !== undefined) {
          setActivePdfFileUrl(updated.pdf_file_url ?? null);
          setPdfPreviewUrl(updated.pdf_file_url ?? null);
        }
        setPdfFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else if (!hasTemplates) {
        // Nueva carga: blanquear para permitir otra carga
        setActiveTab(0);
        setName('');
        setDescription('');
        setPdfFile(null);
        setMinvuFormCode('');
        setVersion('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        uploadMutation.reset();
        return;
      }
      setPdfFile(file);
    } else {
      setPdfFile(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) setName(architectureProjectTypeName);
    uploadMutation.mutate();
  };

  const handleClose = () => {
    if (!uploadMutation.isPending) onClose();
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('es-CL', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const errorMessage =
    uploadMutation.error && axios.isAxiosError(uploadMutation.error)
      ? (uploadMutation.error.response?.data?.error ||
          uploadMutation.error.response?.data?.detail ||
          (Array.isArray(uploadMutation.error.response?.data?.pdf_file)
            ? uploadMutation.error.response.data.pdf_file[0]
            : null) ||
          'Error al cargar el template')
      : uploadMutation.error instanceof Error
        ? uploadMutation.error.message
        : null;

  const createForm = (
    <>
      <TextField
        fullWidth
        label="Nombre del template"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={architectureProjectTypeName}
        margin="normal"
        helperText="Nombre descriptivo del PDF (ej: Formulario 2-1.1 Obra Nueva)"
      />
      <TextField
        fullWidth
        label="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={2}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Código formulario MINVU"
        value={minvuFormCode}
        onChange={(e) => setMinvuFormCode(e.target.value)}
        placeholder="ej: 2-1.1, 2-2.1"
        margin="normal"
      />
      <TextField
        fullWidth
        label="Versión"
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        placeholder="ej: v2024, modificado"
        margin="normal"
      />
      <Box sx={{ mt: 2, mb: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Archivo PDF {hasTemplates ? '(opcional si solo editas metadata)' : '*'}
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <Button
          variant="outlined"
          component="span"
          onClick={() => fileInputRef.current?.click()}
          startIcon={<PictureAsPdfIcon />}
        >
          {pdfFile ? pdfFile.name : 'Seleccionar PDF'}
        </Button>
        {!pdfFile && activePdfFileUrl && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            PDF cargado: <strong>{activePdfFileUrl.split('/').pop() ?? 'documento'}</strong>
          </Typography>
        )}

        {pdfPreviewUrl && (
          <Button
            sx={{ ml: 2 }}
            variant="text"
            component="a"
            href={resolvedPdfPreviewUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
          >
            Vista previa
          </Button>
        )}
      </Box>
      <FormControlLabel
        control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
        label="Template activo"
        sx={{ mt: 1, display: 'block' }}
      />
      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}
    </>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PictureAsPdfIcon />
          <Typography variant="h6">
            {hasTemplates ? 'Editar template PDF' : 'Cargar template PDF'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tipo de proyecto: <strong>{architectureProjectTypeName}</strong>
        </Typography>

        {showTabs ? (
          <>
            <Tabs
              value={activeTab}
              onChange={(_, v: number) => setActiveTab(v)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Listado" id="pdf-tab-list" />
              <Tab label="Editar" id="pdf-tab-create" />
            </Tabs>
            {activeTab === 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Documentos para este tipo de proyecto (el último agregado es el activo).
                </Typography>
                {loadingTemplates ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <List dense>
                    {templatesList.map((t) => (
                      <ListItem
                        key={t.id}
                        button
                        onClick={() => {
                          setActiveTab(1);
                          setName(t.name ?? '');
                          setDescription(t.description ?? '');
                          setMinvuFormCode(t.minvu_form_code ?? '');
                          setVersion(t.version ?? '');
                          setIsActive(t.is_active ?? true);
                          setPdfFile(null);
                          setActivePdfFileUrl(t.pdf_file_url ?? null);
                          setPdfPreviewUrl(t.pdf_file_url ?? null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                      >
                        <ListItemText
                          primary={t.name}
                          secondary={formatDate(t.uploaded_at)}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                        {t.is_active && (
                          <Chip label="Activo" color="primary" size="small" sx={{ ml: 1 }} />
                        )}
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
            {activeTab === 1 && (
              <form id="load-pdf-form" onSubmit={handleSubmit}>
                {createForm}
              </form>
            )}
          </>
        ) : (
          <form id="load-pdf-form" onSubmit={handleSubmit}>
            {createForm}
          </form>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploadMutation.isPending}>
          Cerrar
        </Button>
        {( !showTabs || activeTab === 1 ) && (
          <Button
            type="submit"
            form="load-pdf-form"
            variant="contained"
            disabled={uploadMutation.isPending || (!hasTemplates && !pdfFile)}
          >
            {uploadMutation.isPending
              ? 'Cargando…'
              : hasTemplates
                ? 'Guardar cambios'
                : 'Cargar template'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LoadPdfTemplateModal;
