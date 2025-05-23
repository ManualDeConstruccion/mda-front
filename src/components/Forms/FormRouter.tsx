import React, { useState } from 'react';
import { Box, Typography, Button, MenuItem, Select, FormControl, InputLabel, Stack } from '@mui/material';

interface FormRouterProps {
  content_type: number;
  nodeData: any;
  mode: 'create' | 'edit';
  selectedForm?: any;
}

const FormRouter: React.FC<FormRouterProps> = ({ content_type, nodeData, mode, selectedForm }) => {
  // Simulación de instancias existentes
  const existingInstances = [
    { id: 1, name: 'Solución CAM 1' },
    { id: 2, name: 'Solución CAM 2' }
  ];
  const [selectedMode, setSelectedMode] = useState<'existing' | 'new'>('new');
  const [selectedInstance, setSelectedInstance] = useState('');

  switch (content_type) {
    case 48: // CAM
      return (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Formulario {selectedForm?.name || 'CAM'}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button
              variant={selectedMode === 'existing' ? 'contained' : 'outlined'}
              onClick={() => setSelectedMode('existing')}
            >
              Seleccionar existente
            </Button>
            <Button
              variant={selectedMode === 'new' ? 'contained' : 'outlined'}
              onClick={() => setSelectedMode('new')}
            >
              Crear nueva
            </Button>
          </Stack>
          {selectedMode === 'existing' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Instancia existente</InputLabel>
              <Select
                value={selectedInstance}
                label="Instancia existente"
                onChange={e => setSelectedInstance(e.target.value)}
              >
                {existingInstances.map(inst => (
                  <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {/* Si está en modo 'new', muestra el botón Ir al formulario */}
          {selectedMode === 'new' && (
            <Button
              variant="contained"
              color="secondary"
              sx={{ mt: 2 }}
              // onClick={...} // El handler real se pasa desde el padre
              id="go-to-form-btn"
            >
              Ir al formulario
            </Button>
          )}
        </Box>
      );
    default:
      return (
        <Box>
          <Typography>Formulario no encontrado para content_type: {content_type}</Typography>
        </Box>
      );
  }
};

export default FormRouter; 