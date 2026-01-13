import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const FormulariosPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Administración de Formularios
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Esta página estará disponible próximamente para construir y gestionar formularios.
        </Typography>
      </Box>
    </Container>
  );
};

export default FormulariosPage;
