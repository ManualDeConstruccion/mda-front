import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface EmptyGridStateProps {
  onAddFirstRow: () => Promise<void>;
}

export const EmptyGridState: React.FC<EmptyGridStateProps> = ({ onAddFirstRow }) => (
  <Box
    sx={{
      p: 2,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      bgcolor: 'background.paper',
      textAlign: 'center',
    }}
  >
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Esta sección está vacía. Agrega la primera fila para comenzar.
    </Typography>
    <Button
      variant="outlined"
      startIcon={<AddIcon />}
      onClick={async () => {
        await onAddFirstRow();
      }}
    >
      Agregar Primera Fila
    </Button>
  </Box>
);
