import React, { useState, useEffect } from 'react';
import { useFormNode } from '../../context/FormNodeContext';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, TextField, FormControlLabel, Switch, RadioGroup, Radio, FormControl, FormLabel } from '@mui/material';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';

type CreationStep = 'select' | 'create' | 'form';

export default function ConstructionSolutionCreatePage() {
  const { selectedForm, nodeData, setNodeData } = useFormNode();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CreationStep>('select');
  const [form, setForm] = useState({
    name: nodeData?.name || '',
    description: nodeData?.description || '',
    is_active: nodeData?.is_active ?? true,
  });

  const { createProject, updateProject, isLoadingProjects } = useProjectNodes();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creationType, setCreationType] = useState<'new' | 'existing'>('new');

  useEffect(() => {
    setNodeData((prev: any) => ({ ...prev, ...form }));
  }, [form, setNodeData]);

  if (!selectedForm && !nodeData) {
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
      if (nodeData?.isEditing) {
        await updateProject.mutateAsync({
          id: nodeData.id,
          data: {
            name: form.name,
            description: form.description,
            is_active: form.is_active,
          }
        });
      } else {
        await createProject.mutateAsync({
          name: form.name,
          description: form.description,
          is_active: form.is_active,
          type: selectedForm.node_type,
          parent: nodeData?.parent,
          model_name: selectedForm.model_name,
        });
      }
      
      if (nodeData?.project_id && nodeData?.architecture_project_id) {
        navigate(`/proyectos/${nodeData.project_id}/arquitectura/${nodeData.architecture_project_id}`);
      } else {
        navigate(-1);
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar la solución constructiva');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'select':
        return (
          <Box my={2}>
            <FormControl component="fieldset">
              <FormLabel component="legend">¿Cómo deseas proceder?</FormLabel>
              <RadioGroup
                value={creationType}
                onChange={(e) => setCreationType(e.target.value as 'new' | 'existing')}
              >
                <FormControlLabel value="new" control={<Radio />} label="Crear nueva solución" />
                <FormControlLabel value="existing" control={<Radio />} label="Usar solución existente" />
              </RadioGroup>
            </FormControl>
            <Button 
              variant="contained" 
              onClick={() => setCurrentStep(creationType === 'new' ? 'create' : 'form')}
              sx={{ mt: 2 }}
            >
              Continuar
            </Button>
          </Box>
        );

      case 'create':
        return (
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
              onClick={() => setCurrentStep('form')}
            >
              Continuar al formulario
            </Button>
          </Box>
        );

      case 'form':
        return (
          <Box my={2}>
            <Typography variant="h6" gutterBottom>
              Formulario: {selectedForm.name}
            </Typography>
            <DynamicFormRenderer
              modelName={selectedForm.model_name}
              formData={nodeData?.formData}
              onChange={(data) => setNodeData((prev: any) => ({ ...prev, formData: data }))}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSubmit} 
              disabled={saving || isLoadingProjects}
              sx={{ mt: 2 }}
            >
              {saving ? 'Guardando...' : nodeData?.isEditing ? 'Actualizar' : 'Guardar'}
            </Button>
          </Box>
        );
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        {nodeData?.isEditing ? 'Editar Solución Constructiva' : `Crear Solución Constructiva: ${selectedForm?.name}`}
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      {renderStep()}
    </Box>
  );
} 