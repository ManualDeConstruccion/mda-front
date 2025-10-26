import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import CharacterCounter from '../../components/common/CharacterCounter/CharacterCounter';
import ProjectTypeSelectors from '../../components/ProjectTypeSelectors';
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

  const [selectedProjectType, setSelectedProjectType] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCharacterCounterChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject.mutateAsync(formData);
      navigate('/proyectos/lista');
    } catch (error) {
      console.error('Error al crear el proyecto:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Crear Nuevo Proyecto</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <CharacterCounter
          name="name"
          label="Nombre del Proyecto"
          value={formData.name}
          onChange={(value) => handleCharacterCounterChange('name', value)}
          maxLength={CHARACTER_LIMITS.PROJECT_TITLE}
          required={true}
        />

        <CharacterCounter
          name="description"
          label="Descripción"
          value={formData.description}
          onChange={(value) => handleCharacterCounterChange('description', value)}
          maxLength={CHARACTER_LIMITS.PROJECT_DESCRIPTION}
          multiline={true}
          required={true}
        />

        <ProjectTypeSelectors
          onProjectTypeChange={setSelectedProjectType}
        />

        <div className={styles.formActions}>
          <button type="button" onClick={() => navigate('/proyectos/lista')}>
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
