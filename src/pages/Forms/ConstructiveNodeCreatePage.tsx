import React, { useState, useEffect } from 'react';
import { useFormNode } from '../../context/FormNodeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, TextField, FormControlLabel, Switch } from '@mui/material';
import { useProjectNodes } from '../../hooks/useProjectNodes';

export default function ConstructionSolutionCreatePage() {
  const { selectedForm, nodeData, setNodeData } = useFormNode();
  const navigate = useNavigate();
  const { mode, id } = useParams(); // mode: 'create' | 'edit', id?: string
  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const { createProject, updateProject, projects, isLoadingProjects } = useProjectNodes();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al editar, obtener el nodo y poblar el formulario
  useEffect(() => {
    if (mode === 'edit' && id && projects) {
      const node = projects.find((n) => n.id === Number(id));
      if (node) {
        setForm({
          name: node.name,
          description: node.description || '',
          is_active: node.is_active,
        });
        setNodeData(node);
      }
    }
  }, [mode, id, projects, setNodeData]);

  useEffect(() => {
    setNodeData((prev: any) => ({ ...prev, ...form }));
  }, [form, setNodeData]);

  // Si es creación y no hay formulario seleccionado, redirige al selector
  if (!selectedForm && mode === 'create') {
    navigate('/constructive/select');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (mode === 'edit' && id) {
        await updateProject.mutateAsync({
          id: Number(id),
          data: {
            name: form.name,
            description: form.description,
            is_active: form.is_active,
          }
        });
        navigate(-1);
      } else {
        await createProject.mutateAsync({
          name: form.name,
          description: form.description,
          is_active: form.is_active,
          type: selectedForm.node_type,
          parent: nodeData?.parent,
          content_type: selectedForm.content_type,
        });
        navigate(-1);
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        {mode === 'edit' ? 'Editar Formulario' : `Crear Formulario: ${selectedForm?.name}`}
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Box my={2} display="flex" flexDirection="column" gap={2}>
        <TextField
          label="Nombre"
          name="name"
          value={form.name}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Descripción"
          name="description"
          value={form.description}
          onChange={handleChange}
          fullWidth
          multiline
        />
        <FormControlLabel
          control={
            <Switch
              checked={form.is_active}
              onChange={handleChange}
              name="is_active"
            />
          }
          label="Activo"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={saving || isLoadingProjects}
        >
          {saving ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Guardar'}
        </Button>
      </Box>
    </Box>
  );
} 