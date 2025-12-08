import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import CharacterCounter from '../../components/common/CharacterCounter/CharacterCounter';
import { CHARACTER_LIMITS } from '../../utils/validation';
import styles from './CreateProject.module.scss';
import { TypeCode } from '../../types/project_nodes.types';

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const { createProject } = useProjectNodes();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'project' as TypeCode,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleCharacterCounterChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proyecto es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Crear el proyecto principal con estado "en_estudio" por defecto
      const response = await createProject.mutateAsync({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        status: 'en_estudio',
      });
      
      const projectId = response.id;
      
      // Navegar a la vista de detalle del proyecto
      navigate(`/proyectos/${projectId}`);
    } catch (error) {
      console.error('Error al crear el proyecto:', error);
      setErrors({ submit: 'Error al crear el proyecto. Por favor intenta nuevamente.' });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Crear Nuevo Proyecto</h1>
        <p className={styles.subtitle}>
          Completa la información básica de tu proyecto para comenzar
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Nombre del Proyecto */}
        <div className={styles.formGroup}>
          <CharacterCounter
            name="name"
            label="Nombre del Proyecto"
            value={formData.name}
            onChange={(value) => handleCharacterCounterChange('name', value)}
            maxLength={CHARACTER_LIMITS.PROJECT_TITLE}
            required={true}
          />
          {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
        </div>

        {/* Descripción */}
        <div className={styles.formGroup}>
          <CharacterCounter
            name="description"
            label="Descripción"
            value={formData.description}
            onChange={(value) => handleCharacterCounterChange('description', value)}
            maxLength={CHARACTER_LIMITS.PROJECT_DESCRIPTION}
            multiline={true}
            required={true}
          />
          {errors.description && <span className={styles.errorMessage}>{errors.description}</span>}
        </div>

        {/* Error general */}
        {errors.submit && (
          <div className={styles.errorBanner}>
            {errors.submit}
          </div>
        )}

        {/* Acciones del formulario */}
        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={() => navigate('/proyectos/lista')}
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button type="submit" className={styles.saveButton}>
            Crear Proyecto
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;
