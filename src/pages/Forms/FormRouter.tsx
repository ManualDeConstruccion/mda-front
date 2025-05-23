import React, { useState } from 'react';
import { Box, Typography, Button, MenuItem, Select, FormControl, InputLabel, Stack } from '@mui/material';

interface FormRouterProps {
  formTypeModel: string;
  nodeData: any;
  mode: 'create' | 'edit';
  selectedForm?: any;
  setNodeData: (data: any) => void;
}

const FormRouter: React.FC<FormRouterProps> = ({ formTypeModel, nodeData, mode, selectedForm, setNodeData }) => {
  // Simulación de instancias existentes
  const existingInstances = [
    { id: 1, name: 'Solución CAM 1' },
    { id: 2, name: 'Solución CAM 2' }
  ];
  const [selectedMode, setSelectedMode] = useState<'existing' | 'new'>('new');
  const [selectedInstance, setSelectedInstance] = useState('');

  const handleInstanceSelect = (instanceId: string) => {
    setSelectedInstance(instanceId);
    setNodeData((prev: any) => ({
      ...prev,
      object_id: instanceId
    }));
  };

  const handleNewInstance = () => {
    setNodeData((prev: any) => ({
      ...prev,
      object_id: null // Se establecerá cuando se cree la nueva instancia
    }));
  };

  // Si estamos en modo edición y no hay object_id, mostrar el selector
  const shouldShowSelector = !nodeData.object_id;

  switch (formTypeModel) {
    case 'analyzedsolution': // CAM
      return (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Formulario {selectedForm?.name || 'CAM'}
          </Typography>
          {shouldShowSelector && (
            <>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button
                  variant={selectedMode === 'existing' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setSelectedMode('existing');
                    setSelectedInstance('');
                  }}
                >
                  Seleccionar existente
                </Button>
                <Button
                  variant={selectedMode === 'new' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setSelectedMode('new');
                    handleNewInstance();
                  }}
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
                    onChange={e => handleInstanceSelect(e.target.value)}
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
                  id="go-to-form-btn"
                >
                  Ir al formulario
                </Button>
              )}
            </>
          )}
        </Box>
      );
    default:
      return (
        <Box>
          <Typography>Formulario no encontrado para model: {formTypeModel}</Typography>
        </Box>
      );
  }
};

export default FormRouter; 