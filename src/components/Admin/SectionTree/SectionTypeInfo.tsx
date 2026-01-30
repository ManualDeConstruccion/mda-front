import React from 'react';
import { Box, Typography } from '@mui/material';

interface SectionTypeInfoProps {
  formTypeName: string;
}

export const SectionTypeInfo: React.FC<SectionTypeInfoProps> = ({ formTypeName }) => (
  <Box sx={{ mt: 2, mb: 2, ml: 0 }}>
    <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
      <Typography variant="body2" color="text.secondary">
        Tipo: {formTypeName}
        {formTypeName === 'superficies' ? (
          <span> – En vista/editable se usa la interfaz de pestañas (Resumen, Pisos, Niveles, Polígonos).</span>
        ) : (
          <span> – La interfaz personalizada para este tipo aún no está implementada</span>
        )}
      </Typography>
    </Box>
  </Box>
);
