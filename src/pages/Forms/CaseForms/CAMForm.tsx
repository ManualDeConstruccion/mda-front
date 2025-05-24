import React, { useState } from 'react';
import { Box, TextField, Button, Stack, Typography, Snackbar, Alert } from '@mui/material';
import { useProjectNode, useProjectNodes } from '../../../hooks/useProjectNodes';
import { useNavigate } from 'react-router-dom';
import { useCAMApi } from '../../../hooks/FormHooks/useCAMApi';

export default function CAMForm({ nodeId }: { nodeId?: string }) {
  const { data: node, isLoading } = useProjectNode(Number(nodeId));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { patchProject } = useProjectNodes();
  const navigate = useNavigate();
  const camApi = useCAMApi();


  const handleSave = async (closeAfter = false) => {
    setSaving(true);
    setError(null);
    try {
      // 1. Crear la instancia de AnalyzedSolution
      const analyzedPayload = {
        name,
        description,
        node: [Number(nodeId)],
      };
      const analyzedResp = await camApi.create.mutateAsync(analyzedPayload);
      // 2. PATCH al nodo para guardar el object_id
      await patchProject.mutateAsync({
        id: Number(nodeId),
        data: {
          object_id: analyzedResp.id,
        },
      });
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