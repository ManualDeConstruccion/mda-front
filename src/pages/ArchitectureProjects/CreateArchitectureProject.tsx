// src/pages/ArchitectureProjects/CreateArchitectureProject.tsx

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { TypeCode } from '../../types/project_nodes.types';
import CharacterCounter from '../../components/common/CharacterCounter/CharacterCounter';
import { CHARACTER_LIMITS } from '../../utils/validation';
import styles from './CreateArchitectureProject.module.scss';

const CreateArchitectureProject: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { createProject } = useProjectNodes();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    type: 'architecture_subproject' as TypeCode,
    status: 'en_estudio' as const,
    start_date: '',
    parent: Number(projectId) || null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
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
    if (!projectId) return;

    try {
      await createProject.mutateAsync({
        ...formData,
        parent: Number(projectId),
        type: 'architecture_subproject', // aseguramos el tipo correcto
      });
      navigate(`/proyectos/${projectId}`);
    } catch (error) {
      console.error('Error al crear el proyecto de arquitectura:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Crear Nuevo Proyecto de Arquitectura</h1>

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

        <div className={styles.formGroup}>
          <label htmlFor="status">Estado Inicial</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="en_estudio">En Estudio</option>
            <option value="pendiente">Pendiente</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="start_date">Fecha de Inicio</label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleInputChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
            />
            Proyecto Activo
          </label>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => navigate(`/proyectos/${projectId}`)}
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button type="submit" className={styles.saveButton}>
            Crear Proyecto de Arquitectura
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateArchitectureProject;
