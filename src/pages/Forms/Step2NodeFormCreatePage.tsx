import React, { useState, useEffect } from 'react';
import { useFormNode } from '../../context/FormNodeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, TextField, FormControlLabel, Switch, Stack } from '@mui/material';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import FormRouter from '../../components/Forms/FormRouter';
import NodePermissionsModal from '../EditArchitectureNodes/NodePermissionsModal';

export default function NodeFormCreatePage() {
  const { 
    selectedForm, 
    nodeData, 
    setNodeData,
    projectId,
    architectureProjectId 
  } = useFormNode();
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
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [nameError, setNameError] = useState(false);

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
    navigate('/form/select');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'name') setNameError(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
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
        if (projectId && architectureProjectId) {
          navigate(`/proyectos/${projectId}/arquitectura/${architectureProjectId}`);
        } else {
          navigate(-1);
        }
      } else {
        await createProject.mutateAsync({
          name: form.name,
          description: form.description,
          is_active: form.is_active,
          node_type: selectedForm.node_type,
          parent: nodeData?.parent,
          content_type: selectedForm.content_type,
        });
        if (projectId && architectureProjectId) {
          navigate(`/proyectos/${projectId}/arquitectura/${architectureProjectId}`);
        } else {
          navigate(-1);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleGoToForm = () => {
    // Aquí irá la navegación al paso 3 con el formulario específico
    navigate(`/form/form/${id || 'new'}`);
  };

  const handleGoBack = () => {
    navigate('/form/select');
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        {mode === 'edit' ? 'Editar Formulario' : `Crear Formulario: ${selectedForm?.name}`}
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      
      {/* Campos básicos del nodo */}
      <Box my={2} display="flex" flexDirection="column" gap={2}>
        <TextField
          label="Nombre"
          name="name"
          value={form.name}
          onChange={handleChange}
          fullWidth
          error={nameError}
          helperText={nameError ? 'El nombre es obligatorio' : ''}
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
      </Box>

      {/* Router de formularios específicos */}
      {selectedForm && (
        <Box my={3}>
          <FormRouter 
            content_type={selectedForm.content_type}
            nodeData={nodeData}
            mode={mode as 'create' | 'edit'}
          />
        </Box>
      )}

      {/* Botones de acción */}
      <Stack direction="row" spacing={2} mt={3}>
        {mode === 'create' && (
          <Button
            variant="outlined"
            onClick={handleGoBack}
          >
            Ir atrás
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={saving || isLoadingProjects}
        >
          {saving ? 'Guardando...' : 'Guardar y cerrar'}
        </Button>
        {mode === 'edit' && id && (
          <Button
            variant="outlined"
            onClick={() => setShowPermissionsModal(true)}
          >
            Editar permisos
          </Button>
        )}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleGoToForm}
        >
          Ir al formulario
        </Button>
      </Stack>

      {/* Modal de permisos */}
      {mode === 'edit' && id && (
        <NodePermissionsModal
          open={showPermissionsModal}
          onClose={() => setShowPermissionsModal(false)}
          nodeId={Number(id)}
        />
      )}
    </Box>
  );
} 