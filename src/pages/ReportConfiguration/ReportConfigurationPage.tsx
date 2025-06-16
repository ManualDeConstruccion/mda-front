import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ReportConfigurationForm from './ReportConfigurationForm';
import { useAuth } from '../../context/AuthContext';

interface ReportConfigurationPageProps {
  nodeId?: number;
}

const ReportConfigurationPage: React.FC<ReportConfigurationPageProps> = ({ nodeId }) => {
  const { user } = useAuth();

  const isNodeConfig = typeof nodeId === 'number';
  const title = isNodeConfig
    ? `Configuración de Informes del Nodo #${nodeId}`
    : `Configuración de Informes - ${user?.first_name} ${user?.last_name}`;
  const description = isNodeConfig
    ? 'Configura los parámetros de informes para este nodo. Esta configuración se aplicará solo a los informes generados para este nodo.'
    : 'Configura los parámetros por defecto para tus informes. Esta configuración se aplicará a todos los informes que generes, a menos que se especifique una configuración diferente para un proyecto específico.';

  return (
    <Box sx={{ p: 3, mb: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Configuración de Informes
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {description}
        </Typography>
      </Paper>

      <ReportConfigurationForm 
        nodeId={nodeId}
        title={title}
        onSave={() => {
          // El Snackbar ya está manejado en el componente ReportConfigurationForm
        }}
      />
    </Box>
  );
};

export default ReportConfigurationPage; 