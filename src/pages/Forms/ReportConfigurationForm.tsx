import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
} from '@mui/material';

interface ReportConfigurationFormProps {
  nodeId?: number;
  title?: string;
}

interface FormData {
  page_size: 'A4' | 'letter' | 'legal';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header: string;
  footer: string;
  logo: string;
}

const defaultFormData: FormData = {
  page_size: 'A4',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  header: '',
  footer: '',
  logo: ''
};

const ReportConfigurationForm: React.FC<ReportConfigurationFormProps> = ({ nodeId: propNodeId, title }) => {
  const { nodeId: paramNodeId } = useParams<{ nodeId: string }>();
  const nodeId = propNodeId || (paramNodeId ? parseInt(paramNodeId) : undefined);
  
  const {
    configuration,
    isLoading,
    isError,
    error,
    updateConfiguration,
    restoreDefault,
    isUpdating,
    isRestoring
  } = useReportConfigurations(nodeId);

  const [formData, setFormData] = useState<FormData>(defaultFormData);

  useEffect(() => {
    if (configuration) {
      setFormData({
        page_size: configuration.page_size || defaultFormData.page_size,
        margins: configuration.margins || defaultFormData.margins,
        header: configuration.header || '',
        footer: configuration.footer || '',
        logo: configuration.logo || ''
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfiguration(formData);
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
          {title || 'Configuración de Informes'}
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
                <MenuItem value="A4">A4</MenuItem>
                <MenuItem value="letter">Carta</MenuItem>
                <MenuItem value="legal">Legal</MenuItem>
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
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Izquierdo"
                  type="number"
                  value={formData.margins.left}
                  onChange={(e) => handleMarginChange('left', e.target.value)}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Encabezado"
              multiline
              rows={2}
              value={formData.header}
              onChange={(e) => handleChange('header', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Pie de Página"
              multiline
              rows={2}
              value={formData.footer}
              onChange={(e) => handleChange('footer', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="URL del Logo"
              value={formData.logo}
              onChange={(e) => handleChange('logo', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              {nodeId && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => restoreDefault()}
                  disabled={isRestoring}
                >
                  {isRestoring ? <CircularProgress size={24} /> : 'Restaurar Valores por Defecto'}
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
        </Grid>
      </Paper>
    </Box>
  );
};

export default ReportConfigurationForm; 