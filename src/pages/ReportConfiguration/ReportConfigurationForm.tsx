import React, { useEffect, useState } from 'react';
import { useReportConfigurations } from '../../hooks/useReportConfigurations';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  IconButton,
  Snackbar,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../context/AuthContext';

interface ReportConfigurationFormProps {
  nodeId?: number;
  title?: string;
  onSave?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

interface FormData {
  page_size: 'A4' | 'letter' | 'legal' | 'oficio' | 'custom';
  custom_page_width?: number;
  custom_page_height?: number;
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
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
}

const defaultFormData: FormData = {
  page_size: 'A4',
  orientation: 'portrait',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  header_text: '',
  header_font_size: 12,
  header_font_style: 'normal',
  footer_text: '',
  footer_font_size: 12,
  footer_font_style: 'normal',
  logo: '',
  logo_position: 'left',
  logo_size: 'medium',
  show_page_numbers: true,
  page_number_position: 'bottom_center'
};

const pageSizes = [
  { value: 'A4', label: 'A4 (210x297mm)' },
  { value: 'letter', label: 'Carta (216x279mm)' },
  { value: 'legal', label: 'Legal (216x356mm)' },
  { value: 'oficio', label: 'Oficio (216x330mm)' },
  { value: 'custom', label: 'Personalizado' }
];

const pageNumberPositions = [
  { value: 'bottom_center', label: 'Centro Inferior' },
  { value: 'bottom_right', label: 'Derecha Inferior' },
  { value: 'bottom_left', label: 'Izquierda Inferior' }
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const ReportConfigurationForm: React.FC<ReportConfigurationFormProps> = ({ 
  nodeId,
  title,
  onSave,
  onCancel,
  showActions = true
}) => {
  const { user } = useAuth();
  const {
    configuration,
    isLoading,
    isError,
    error,
    updateConfiguration,
    isUpdating
  } = useReportConfigurations({ 
    userId: nodeId ? undefined : user?.id,
    nodeId 
  });

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  if (!user?.id && !nodeId) {
    return (
      <Alert severity="error">
        No se ha iniciado sesión. Por favor, inicie sesión para continuar.
      </Alert>
    );
  }

  useEffect(() => {
    if (configuration) {
      setFormData({
        page_size: configuration.page_size || defaultFormData.page_size,
        custom_page_width: configuration.custom_page_width,
        custom_page_height: configuration.custom_page_height,
        orientation: configuration.orientation || defaultFormData.orientation,
        margins: configuration.margins || defaultFormData.margins,
        header_text: configuration.header_text || '',
        header_font_size: configuration.header_font_size || defaultFormData.header_font_size,
        header_font_style: configuration.header_font_style || defaultFormData.header_font_style,
        footer_text: configuration.footer_text || '',
        footer_font_size: configuration.footer_font_size || defaultFormData.footer_font_size,
        footer_font_style: configuration.footer_font_style || defaultFormData.footer_font_style,
        logo: configuration.logo || '',
        logo_position: configuration.logo_position || defaultFormData.logo_position,
        logo_size: configuration.logo_size || defaultFormData.logo_size,
        show_page_numbers: configuration.show_page_numbers ?? defaultFormData.show_page_numbers,
        page_number_position: configuration.page_number_position || defaultFormData.page_number_position
      });
      
      if (configuration.logo) {
        setLogoPreview(configuration.logo);
      }
    }
  }, [configuration]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMarginChange = (field: keyof FormData['margins'], value: string) => {
    setFormData(prev => ({
      ...prev,
      margins: {
        ...prev.margins,
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setLogoError(null);

    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setLogoError('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setLogoError('El archivo no debe superar los 10MB');
      return;
    }

    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({
      ...prev,
      logo: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      if (nodeId) {
        formDataToSend.append('node_id', nodeId.toString());
      } else if (user?.id) {
        formDataToSend.append('user_id', user.id.toString());
      }
      
      const dataToSend = {
        ...formData,
        custom_page_width: formData.custom_page_width ? Math.round(formData.custom_page_width) : null,
        custom_page_height: formData.custom_page_height ? Math.round(formData.custom_page_height) : null
      };
      
      Object.entries(dataToSend).forEach(([key, value]) => {
        if (key === 'margins') {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      if (logoFile) {
        formDataToSend.append('logo_file', logoFile);
      }

      await updateConfiguration(formDataToSend);
      setSnackbar({
        open: true,
        message: configuration?.id 
          ? 'Configuración actualizada exitosamente' 
          : 'Nueva configuración creada exitosamente',
        severity: 'success'
      });
      onSave?.();
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      const errorMessage = error.response?.data?.detail || 'Error al guardar la configuración';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Error al cargar la configuración: {error?.message}
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {title || (nodeId ? 'Configuración de Informe del Nodo' : 'Configuración de Informe por Defecto')}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tamaño de Página</InputLabel>
              <Select
                value={formData.page_size}
                label="Tamaño de Página"
                onChange={(e) => handleChange('page_size', e.target.value)}
              >
                {pageSizes.map((size) => (
                  <MenuItem key={size.value} value={size.value}>
                    {size.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {formData.page_size === 'custom' && (
            <>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Ancho (mm)"
                  type="number"
                  inputProps={{ step: 1, min: 1 }}
                  value={formData.custom_page_width || ''}
                  onChange={(e) => handleChange('custom_page_width', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Alto (mm)"
                  type="number"
                  inputProps={{ step: 1, min: 1 }}
                  value={formData.custom_page_height || ''}
                  onChange={(e) => handleChange('custom_page_height', parseInt(e.target.value) || 0)}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Orientación</InputLabel>
              <Select
                value={formData.orientation}
                label="Orientación"
                onChange={(e) => handleChange('orientation', e.target.value)}
              >
                <MenuItem value="portrait">Vertical</MenuItem>
                <MenuItem value="landscape">Horizontal</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Márgenes (mm)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Superior"
                  type="number"
                  value={formData.margins.top}
                  onChange={(e) => handleMarginChange('top', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Izquierdo"
                  type="number"
                  value={formData.margins.left}
                  onChange={(e) => handleMarginChange('left', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Derecho"
                  type="number"
                  value={formData.margins.right}
                  onChange={(e) => handleMarginChange('right', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Inferior"
                  type="number"
                  value={formData.margins.bottom}
                  onChange={(e) => handleMarginChange('bottom', e.target.value)}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Encabezado
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Texto del Encabezado"
                  multiline
                  rows={2}
                  value={formData.header_text}
                  onChange={(e) => handleChange('header_text', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tamaño de Fuente"
                  type="number"
                  value={formData.header_font_size}
                  onChange={(e) => handleChange('header_font_size', parseFloat(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Estilo de Fuente</InputLabel>
                  <Select
                    value={formData.header_font_style}
                    label="Estilo de Fuente"
                    onChange={(e) => handleChange('header_font_style', e.target.value)}
                  >
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="bold">Negrita</MenuItem>
                    <MenuItem value="italic">Cursiva</MenuItem>
                    <MenuItem value="bold italic">Negrita y Cursiva</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Pie de Página
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Texto del Pie de Página"
                  multiline
                  rows={2}
                  value={formData.footer_text}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tamaño de Fuente"
                  type="number"
                  value={formData.footer_font_size}
                  onChange={(e) => handleChange('footer_font_size', parseFloat(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Estilo de Fuente</InputLabel>
                  <Select
                    value={formData.footer_font_style}
                    label="Estilo de Fuente"
                    onChange={(e) => handleChange('footer_font_style', e.target.value)}
                  >
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="bold">Negrita</MenuItem>
                    <MenuItem value="italic">Cursiva</MenuItem>
                    <MenuItem value="bold italic">Negrita y Cursiva</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Logo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                    >
                      Subir Logo
                      <input
                        type="file"
                        hidden
                        accept={ALLOWED_FILE_TYPES.join(',')}
                        onChange={handleLogoChange}
                      />
                    </Button>
                    {logoPreview && (
                      <>
                        <Box
                          component="img"
                          src={logoPreview}
                          alt="Logo preview"
                          sx={{
                            maxHeight: 100,
                            maxWidth: 200,
                            objectFit: 'contain'
                          }}
                        />
                        <IconButton
                          color="error"
                          onClick={handleRemoveLogo}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                  {logoError && (
                    <Typography color="error" variant="caption">
                      {logoError}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Posición del Logo</InputLabel>
                  <Select
                    value={formData.logo_position}
                    label="Posición del Logo"
                    onChange={(e) => handleChange('logo_position', e.target.value)}
                  >
                    <MenuItem value="left">Izquierda</MenuItem>
                    <MenuItem value="center">Centro</MenuItem>
                    <MenuItem value="right">Derecha</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tamaño del Logo</InputLabel>
                  <Select
                    value={formData.logo_size}
                    label="Tamaño del Logo"
                    onChange={(e) => handleChange('logo_size', e.target.value)}
                  >
                    <MenuItem value="small">Pequeño</MenuItem>
                    <MenuItem value="medium">Mediano</MenuItem>
                    <MenuItem value="large">Grande</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.show_page_numbers}
                  onChange={(e) => handleChange('show_page_numbers', e.target.checked)}
                />
              }
              label="Mostrar Números de Página"
            />
          </Grid>

          {formData.show_page_numbers && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Posición del Número de Página</InputLabel>
                <Select
                  value={formData.page_number_position}
                  label="Posición del Número de Página"
                  onChange={(e) => handleChange('page_number_position', e.target.value)}
                >
                  {pageNumberPositions.map((position) => (
                    <MenuItem key={position.value} value={position.value}>
                      {position.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {showActions && (
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                {onCancel && (
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? <CircularProgress size={24} /> : 'Guardar Configuración'}
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportConfigurationForm; 