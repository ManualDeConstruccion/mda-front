import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Stack, Typography, Snackbar, Alert } from '@mui/material';
import { useProjectNodes } from '../../../hooks/useProjectNodes';
import { useNavigate } from 'react-router-dom';
import { useCAMApi } from '../../../hooks/FormHooks/useCAMApi';

export default function CAMForm({ nodeId, instanceId }: { nodeId?: string, instanceId?: string }) {
  // Usar instanceId para cargar la instancia de analyzedsolution
  const { data: analyzedSolution, isLoading } = useCAMApi().useRetrieve(Number(instanceId));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { patchProject } = useProjectNodes();
  const navigate = useNavigate();
  const camApi = useCAMApi();

  // Precarga los valores cuando analyzedSolution cambia
  useEffect(() => {
    if (analyzedSolution) {
      setName(analyzedSolution.name || '');
      setDescription(analyzedSolution.description || '');
    }
  }, [analyzedSolution]);

  const handleSave = async (closeAfter = false) => {
    setSaving(true);
    setError(null);
    try {
      if (instanceId) {
        // Construir el array de nodos actualizado (ManyToMany)
        let nodes = Array.isArray(analyzedSolution?.node) ? [...analyzedSolution.node] : [];
        if (nodeId && !nodes.includes(Number(nodeId))) {
          nodes.push(Number(nodeId));
        }

        const patchData: any = {};
        if (name !== analyzedSolution?.name) patchData.name = name;
        if (description !== analyzedSolution?.description) patchData.description = description;
        if (nodes.length && JSON.stringify(nodes) !== JSON.stringify(analyzedSolution?.node)) patchData.node = nodes;

        if (Object.keys(patchData).length > 0) {
          await camApi.partialUpdate.mutateAsync({
            id: Number(instanceId),
            ...patchData,
          });
        }
      } else {
        // CREAR nueva instancia y asociar al nodo
        const analyzedPayload = {
          name,
          description,
          node: [Number(nodeId)],
        };
        const analyzedResp = await camApi.create.mutateAsync(analyzedPayload);
        await patchProject.mutateAsync({
          id: Number(nodeId),
          data: {
            object_id: analyzedResp.id,
          },
        });
      }
      setShowSuccess(true);
      if (closeAfter) {
        navigate(-1);
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Typography>Cargando...</Typography>;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Formulario CAM</Typography>
      <Typography variant="body2" gutterBottom>ID del nodo: {nodeId}</Typography>
      <Typography variant="body2" gutterBottom>ID de la instancia: {instanceId}</Typography>
      <Box display="flex" flexDirection="column" gap={2} my={2}>
        <TextField
          label="Nombre de la solución"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
        />
        <TextField
          label="Descripción"
          value={description}
          onChange={e => setDescription(e.target.value)}
          fullWidth
          multiline
        />
      </Box>
      {error && <Typography color="error">{error}</Typography>}
      <Stack direction="row" spacing={2} mt={2}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
        >
          Ir atrás
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSave(true)}
          disabled={saving}
        >
          Guardar y cerrar
        </Button>
        <Button
          variant="outlined"
          color="success"
          onClick={() => handleSave(false)}
          disabled={saving}
        >
          Guardar
        </Button>
      </Stack>
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          ¡Guardado exitosamente!
        </Alert>
      </Snackbar>
    </Box>
  );
} 