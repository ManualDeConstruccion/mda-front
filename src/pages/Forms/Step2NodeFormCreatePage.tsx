import React, { useState, useEffect } from 'react';
import { useFormNode } from '../../context/FormNodeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, TextField, FormControlLabel, Switch, Stack, Snackbar, Alert } from '@mui/material';
import { useProjectNodes, useProjectNode } from '../../hooks/useProjectNodes';
import FormRouter from './FormRouter';
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
  const { createProject, patchProject, isLoadingProjects } = useProjectNodes();
  const { data: node, isLoading: isLoadingNode } = useProjectNode(Number(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [originalNode, setOriginalNode] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Extraer el modelo del formulario (formTypeModel) desde selectedForm o nodeData
  const formTypeModel =
    selectedForm?.form_type?.model ||
    nodeData?.form_type?.model ||
    selectedForm?.model;

  // Al editar, obtener el nodo y poblar el formulario
  useEffect(() => {
    if (mode === 'edit' && id && node) {
      setForm({
        name: node.name,
        description: node.description || '',
        is_active: node.is_active,
      });
      setNodeData({
        ...node,
        object_id: node.object_id || null // Aseguramos que object_id esté definido
      });
      setOriginalNode(node);
    }
  }, [mode, id, node, setNodeData]);

  useEffect(() => {
    setNodeData((prev: any) => ({ ...prev, ...form }));
  }, [form, setNodeData]);

  // Si es creación y no hay formulario seleccionado, redirige al selector
  if (!selectedForm && mode === 'create') {
    navigate('/form/select');
    return null;
  }
  if (mode === 'edit' && isLoadingNode) {
    return <Typography>Cargando nodo...</Typography>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'name') setNameError(false);
  };

  const getPatchData = () => {
    if (!originalNode) return {};
    const patch: any = {};
    if (form.name !== originalNode.name) patch.name = form.name;
    if (form.description !== originalNode.description) patch.description = form.description;
    if (form.is_active !== originalNode.is_active) patch.is_active = form.is_active;
    if (nodeData.object_id !== originalNode.object_id) patch.object_id = nodeData.object_id;
    return patch;
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
        const patchData = getPatchData();
        if (Object.keys(patchData).length > 0) {
          await patchProject.mutateAsync({
            id: Number(id),
            data: patchData,
          });
        }
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
          object_id: nodeData?.object_id || null,
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

  const handleSaveOnly = async () => {
    if (!form.name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setSaving(true);
    setError(null);
    try {
      if (mode === 'edit' && id) {
        const patchData = getPatchData();
        if (Object.keys(patchData).length === 0) {
          setSaving(false);
          return; // No hay cambios
        }
        await patchProject.mutateAsync({
          id: Number(id),
          data: patchData,
        });
        setShowSuccess(true);
      } else {
        await createProject.mutateAsync({
          name: form.name,
          description: form.description,
          is_active: form.is_active,
          node_type: selectedForm.node_type,
          parent: nodeData?.parent,
          content_type: selectedForm.content_type,
          object_id: nodeData?.object_id || null,
        });
        setShowSuccess(true);
      }
      // No navegar
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleGoToForm = () => {
    // Solo permitir ir al formulario si hay un object_id seleccionado
    if (!nodeData.object_id) {
      setError('Debe seleccionar o crear una instancia antes de continuar');
      return;
    }
    navigate(`/form/form/${id || 'new'}`);
  };

  const handleGoBack = () => {
    navigate('/form/select');
  };

  // Log props for FormRouter for debugging
  if (selectedForm) {
    console.log('FormRouter props:', {
      content_type: selectedForm.content_type,
      nodeData,
      mode,
      setNodeData,
      selectedForm
    });
  }

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
      {formTypeModel && (
        <Box my={3}>
          <FormRouter 
            formTypeModel={formTypeModel}
            nodeData={nodeData}
            mode={mode as 'create' | 'edit'}
            setNodeData={setNodeData}
            selectedForm={selectedForm}
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
        <Button
          variant="outlined"
          color="success"
          onClick={handleSaveOnly}
          disabled={saving || isLoadingProjects}
        >
          Guardar
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
          disabled={!nodeData.object_id}
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

      {/* Snackbar de éxito */}
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