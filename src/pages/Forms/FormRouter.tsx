import React, { useState } from 'react';
import { Box, Typography, Button, MenuItem, Select, FormControl, InputLabel, Stack } from '@mui/material';
import { formRegistry } from './formRegistry';
import { useNavigate } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';


interface FormRouterProps {
  formTypeModel: string;
  nodeData: any;
  mode: 'create' | 'edit';
  selectedForm?: any;
  setNodeData: (data: any) => void;
}

const FormRouter: React.FC<FormRouterProps> = ({ formTypeModel, nodeData, selectedForm, setNodeData, mode }) => {
  const [selectedMode, setSelectedMode] = useState<'existing' | 'new'>(mode === 'edit' ? 'existing' : 'new');
  const [selectedInstance, setSelectedInstance] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { createProject } = useProjectNodes();


  // Obtener el hook de API desde el registry
  const registry = formRegistry[formTypeModel];
  const api = registry?.useApi ? registry.useApi() : null;
  const { data } = api?.useList ? api.useList() : { data: { results: [] } };
  const existingInstances = Array.isArray(data?.results) ? data.results : [];

  // Para mostrar el nombre de la instancia seleccionada
  const selectedInstanceObj = existingInstances.find((inst: any) => String(inst.id) === String(nodeData.object_id));

  // Handlers
  const handleInstanceSelect = (instanceId: string) => {
    setSelectedInstance(instanceId);
  };

  // Lógica principal del botón
  const handleGoToForm = async () => {
    setLoading(true);
    console.log('--- handleGoToForm ---');
    console.log('nodeData:', nodeData);
    console.log('selectedMode:', selectedMode);
    console.log('selectedInstance:', selectedInstance);
    console.log('selectedForm:', selectedForm);
    try {
      if (nodeData.object_id) {
        console.log('Navegando a:', `/form/${formTypeModel}/${nodeData.object_id}`);
        setLoading(false);
        navigate(`/form/${formTypeModel}/${nodeData.object_id}`, { state: { nodeId: nodeData.id } });
        return;
      }
      if (selectedMode === 'existing' && selectedInstance) {
        if (api?.patchNode) {
          await api.patchNode(nodeData.id, {
            content_type: registry.contentType,
            object_id: selectedInstance
          });
        }
        setNodeData((prev: any) => ({ ...prev, object_id: selectedInstance }));
        console.log('Navegando a:', `/form/${formTypeModel}/${selectedInstance}`);
        setLoading(false);
        navigate(`/form/${formTypeModel}/${selectedInstance}`, { state: { nodeId: nodeData.id } });
        return;
      }
      if (selectedMode === 'new') {
        let nodeId = nodeData.id;
        if (!nodeId) {
          const nodePayload = {
            name: nodeData.name || 'Nodo de la Solución',
            description: nodeData.description || '',
            type: selectedForm?.type || nodeData.type,
            node_type: selectedForm?.node_type || nodeData.node_type,
            content_type: selectedForm?.content_type || nodeData.content_type,
            parent: nodeData.parent || undefined
          };
          const nodeResp = await createProject.mutateAsync(nodePayload);
          nodeId = nodeResp.id;
          setNodeData((prev: any) => ({ ...prev, id: nodeId }));
        }
        console.log('Navegando a:', `/form/${formTypeModel}/${nodeId}`);
        setLoading(false);
        navigate(`/form/${formTypeModel}/${nodeId}`);
        return;
      }
    } catch (e) {
      setLoading(false);
      console.error('Error en handleGoToForm:', e);
    }
  };

  // Renderizado
  if (nodeData.object_id && selectedInstanceObj) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Formulario {selectedForm?.form_type?.name || selectedForm?.name || formTypeModel}
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Instancia seleccionada: <b>{selectedInstanceObj.name || selectedInstanceObj.id}</b>
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mt: 2 }}
          id="go-to-form-btn"
          onClick={handleGoToForm}
          disabled={loading}
        >
          Ir al formulario
        </Button>
      </Box>
    );
  }

  const hasInstances = Array.isArray(existingInstances) && existingInstances.length > 0;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Formulario {selectedForm?.form_type?.name || selectedForm?.name || formTypeModel}
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant={selectedMode === 'existing' ? 'contained' : 'outlined'}
          onClick={() => {
            setSelectedMode('existing');
            setSelectedInstance('');
          }}
          disabled={!hasInstances}
        >
          Seleccionar existente
        </Button>
        <Button
          variant={selectedMode === 'new' ? 'contained' : 'outlined'}
          onClick={() => {
            setSelectedMode('new');
            setSelectedInstance('');
          }}
        >
          Crear nueva
        </Button>
      </Stack>
      {selectedMode === 'existing' && hasInstances && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Instancia existente</InputLabel>
          <Select
            value={selectedInstance}
            label="Instancia existente"
            onChange={e => handleInstanceSelect(e.target.value)}
          >
            {existingInstances.map((inst: any) => (
              <MenuItem key={inst.id} value={inst.id}>{inst.name || inst.id}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {!hasInstances && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No existen instancias previas. Solo puedes crear una nueva.
        </Typography>
      )}
      <Button
        variant="contained"
        color="secondary"
        sx={{ mt: 2 }}
        id="go-to-form-btn"
        onClick={handleGoToForm}
        disabled={loading || (selectedMode === 'existing' && !selectedInstance && hasInstances)}
      >
        Ir al formulario
      </Button>
    </Box>
  );
};

export default FormRouter; 