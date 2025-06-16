import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ReportConfigurationForm from './ReportConfigurationForm';
import { useAuth } from '../../context/AuthContext';

const ReportConfigurationPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Configuración de Informes
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Configura los parámetros por defecto para tus informes. Esta configuración se aplicará a todos los informes que generes, a menos que se especifique una configuración diferente para un proyecto específico.
        </Typography>
      </Paper>

      <ReportConfigurationForm 
        title={`Configuración de Informes - ${user?.first_name} ${user?.last_name}`}
        onSave={() => {
          // El Snackbar ya está manejado en el componente ReportConfigurationForm
        }}
      />
    </Box>
  );
};

export default ReportConfigurationPage; 