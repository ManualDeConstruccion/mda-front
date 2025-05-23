import React from 'react';
import { Box, Typography } from '@mui/material';

interface FormRouterProps {
  content_type: number;
  nodeData: any;
  mode: 'create' | 'edit';
}

const FormRouter: React.FC<FormRouterProps> = ({ content_type, nodeData, mode }) => {
  // Aquí irán los diferentes casos según el content_type
  switch (content_type) {
    case 48: // Método de Adición de Capas (CAM)
      return (
        <Box>
          <Typography>Formulario CAM</Typography>
          {/* Aquí irá el componente específico para CAM */}
        </Box>
      );
    // Agregar más casos según sea necesario
    default:
      return (
        <Box>
          <Typography>Formulario no encontrado para content_type: {content_type}</Typography>
        </Box>
      );
  }
};

export default FormRouter; 