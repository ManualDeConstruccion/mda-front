import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { useNodeTypes } from '../../hooks/useNodeTypes';
import { NodeType } from '../../types/project_nodes.types';
import styles from './CreateProject.module.scss';

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const { createProject } = useProjectNodes();
  const { data: nodeTypes, isLoading: isLoadingNodeTypes } = useNodeTypes();

  // Buscar el tipo 'Proyecto Principal'
  const mainNodeType = nodeTypes?.find((nt: NodeType) => nt.name === 'Proyecto Principal');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    type: undefined as number | undefined,
    status: 'en_estudio' as const,
  });

  // Cuando se cargue el tipo, actualizar el formData
  useEffect(() => {
    if (mainNodeType && formData.type !== mainNodeType.id) {
      setFormData(prev => ({ ...prev, type: mainNodeType.id }));
    }
  }, [mainNodeType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) return;
    try {
      await createProject.mutateAsync({ ...formData, type: formData.type as number });
      navigate('/proyectos/lista');
    } catch (error) {
      console.error('Error al crear el proyecto:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Crear Nuevo Proyecto</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Nombre del Proyecto</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>

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
          <button type="button" onClick={() => navigate('/proyectos/lista')}>
            Cancelar
          </button>
          <button type="submit" className={styles.saveButton} disabled={isLoadingNodeTypes || !formData.type}>
            Crear Proyecto
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;
