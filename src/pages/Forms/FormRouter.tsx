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
  // Obtener el hook de API desde el registry
  const registry = formRegistry[formTypeModel];
  const api = registry?.useApi ? registry.useApi() : null;
  const { data } = api?.useList ? api.useList() : { data: { results: [] } };
  const existingInstances = Array.isArray(data?.results) ? data.results : [];
  const hasInstances = Array.isArray(existingInstances) && existingInstances.length > 0;
  
  // En modo edit sin object_id, si hay instancias disponibles, permitir seleccionar; si no, usar modo 'new'
  const initialMode = mode === 'edit' && !nodeData.object_id 
    ? (hasInstances ? 'existing' : 'new')
    : (mode === 'edit' ? 'existing' : 'new');
  
  const [selectedMode, setSelectedMode] = useState<'existing' | 'new'>(initialMode);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { createProject, patchProject } = useProjectNodes();

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
        // Asociar la instancia seleccionada al nodo
        if (nodeData.id) {
          if (api?.patchNode) {
            await api.patchNode(nodeData.id, {
              content_type: registry.contentType,
              object_id: Number(selectedInstance)
            });
          } else {
            await patchProject.mutateAsync({
              id: nodeData.id,
              data: {
                object_id: Number(selectedInstance)
              }
            });
          }
        }
        setNodeData((prev: any) => ({ ...prev, object_id: selectedInstance }));
        console.log('Navegando a:', `/form/${formTypeModel}/${selectedInstance}`);
        setLoading(false);
        navigate(`/form/${formTypeModel}/${selectedInstance}`, { state: { nodeId: nodeData.id } });
        return;
      }
      if (selectedMode === 'new') {
        // Asegurar que el nodo existe primero
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
        
        // Crear una nueva instancia de la solución
        let instanceId: number | string;
        if (api?.create) {
          // Crear la instancia con el nombre del nodo y asociarla al nodo
          const instancePayload = {
            name: nodeData.name || 'Nueva Solución',
            description: nodeData.description || '',
            node: [nodeId], // El campo 'node' es requerido y debe ser un array con el ID del nodo
            // Agregar otros campos necesarios según el tipo de formulario
          };
          const instanceResp = await api.create.mutateAsync(instancePayload);
          instanceId = instanceResp.id;
          
          // Asociar la instancia al nodo actualizando el object_id
          if (api?.patchNode && nodeId) {
            await api.patchNode(nodeId, {
              content_type: registry.contentType,
              object_id: Number(instanceId)
            });
          } else if (nodeId) {
            // Si no hay patchNode, usar patchProject para actualizar
            await patchProject.mutateAsync({
              id: nodeId,
              data: {
                object_id: Number(instanceId)
              }
            });
          }
          
          // Actualizar nodeData con el object_id
          setNodeData((prev: any) => ({ ...prev, object_id: instanceId }));
          
          console.log('Instancia creada - Navegando a:', `/form/${formTypeModel}/${instanceId}`);
          setLoading(false);
          navigate(`/form/${formTypeModel}/${instanceId}`, { state: { nodeId: nodeId } });
          return;
        } else {
          // Si no hay API de creación, usar el nodeId como fallback (comportamiento anterior)
          console.log('Navegando a (sin crear instancia):', `/form/${formTypeModel}/${nodeId}`);
          setLoading(false);
          navigate(`/form/${formTypeModel}/${nodeId}`, { state: { nodeId: nodeId } });
          return;
        }
      }
    } catch (e) {
      setLoading(false);
      console.error('Error en handleGoToForm:', e);
    }
  };

  // Renderizado
  // Si hay object_id (especialmente en modo edit), mostrar el botón directamente
  if (nodeData.object_id) {
    const instanceName = selectedInstanceObj 
      ? (selectedInstanceObj.name || selectedInstanceObj.id)
      : `ID: ${nodeData.object_id}`;
    
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Formulario {selectedForm?.form_type?.name || selectedForm?.name || formTypeModel}
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Instancia seleccionada: <b>{instanceName}</b>
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
        disabled={loading || (selectedMode === 'existing' && !selectedInstance && hasInstances) || (selectedMode === 'new' && mode === 'create' && !nodeData.id && !nodeData.name)}
      >
        Ir al formulario
      </Button>
    </Box>
  );
};

export default FormRouter; 