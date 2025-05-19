import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { ArchitectureProjectNode } from '../../types/architecture.types';
import styles from './EditArchitectureProject.module.scss';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';

type FormDataState = {
  name: string;
  description: string;
  is_active: boolean;
  start_date: string;
};

const EditArchitectureProject: React.FC = () => {
  const { projectId, architectureId } = useParams<{ projectId: string; architectureId: string }>();
  const navigate = useNavigate();

  const { projects: architectureProjects, updateProject } = useProjectNodes<ArchitectureProjectNode>({ type: 'architecture_subproject' });
  const { projects: childNodes, createProject, deleteProject } = useProjectNodes<ArchitectureProjectNode>({ parent: Number(architectureId) });

  const architectureProject = architectureProjects?.find(p => p.id === Number(architectureId));
  const stages = useMemo(() => childNodes?.filter(node => node.type_code === 'stage') || [], [childNodes]);

  const [formData, setFormData] = useState<FormDataState>(() => ({
    name: architectureProject?.name || '',
    description: architectureProject?.description || '',
    is_active: architectureProject?.is_active ?? true,
    start_date: architectureProject?.start_date || '',
  }));

  const [stagesList, setStagesList] = useState<Array<{ id: number; name: string }>>([]);
  const [newStageName, setNewStageName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 1) proyecto
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded && architectureProject) {
      setFormData({
        name: architectureProject.name,
        description: architectureProject.description || '',
        is_active: architectureProject.is_active ?? true,
        start_date: architectureProject.start_date || '',
      });
      setLoaded(true);
    }
  }, [architectureProject, loaded]);

  // 2) etapas
  const [stagesInitialized, setStagesInitialized] = useState(false);
  useEffect(() => {
    if (!stagesInitialized && stages.length > 0) {
      setStagesList(stages.map(s => ({ id: s.id, name: s.name })));
      setStagesInitialized(true);
    }
  }, [stages, stagesInitialized]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleStageNameChange = (id: number, newName: string) => {
    setStagesList(prev => prev.map(stage => 
      stage.id === id ? { ...stage, name: newName } : stage
    ));
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) {
      setError('El nombre de la etapa no puede estar vacío');
      return;
    }

    try {
      setError(null);
      await createProject.mutateAsync({
        parent: Number(architectureId),
        name: newStageName,
        description: '',
        is_active: true,
        type: 'stage',
      });
      setNewStageName('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear la etapa');
    }
  };

  const handleDeleteStage = async (stageId: number) => {
    try {
      setError(null);
      await deleteProject.mutateAsync(stageId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar la etapa');
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      await updateProject.mutateAsync({
        id: Number(architectureId),
        data: {
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          start_date: formData.start_date || null,
          type: 'architecture_subproject',
        },
      });
      navigate(`/proyectos/${projectId}/arquitectura/${architectureId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar los cambios');
    }
  };

  if (!architectureId || !architectureProject) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>Proyecto de arquitectura no encontrado.</p>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Editar Proyecto de Arquitectura</h1>
        <div className={styles.headerActions}>
          <button className={styles.saveButton} onClick={handleSave}>
            <SaveIcon /> Guardar Cambios
          </button>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <BackIcon /> Volver
          </button>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <section className={styles.formSection}>
          <h2>Información del Proyecto</h2>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nombre del Proyecto</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
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
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleCheckboxChange}
              />
              Proyecto Activo
            </label>
          </div>
        </section>

        <section className={styles.stagesSection}>
          <h2>Etapas del Proyecto</h2>
          
          <div className={styles.addStage}>
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Nombre de la nueva etapa"
            />
            <button className={styles.addButton} onClick={handleAddStage}>
              <AddIcon /> Agregar Etapa
            </button>
          </div>

          <div className={styles.stagesList}>
            {stagesList.map(stage => (
              <div key={stage.id} className={styles.stageItem}>
                <input
                  type="text"
                  value={stage.name}
                  onChange={(e) => handleStageNameChange(stage.id, e.target.value)}
                />
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteStage(stage.id)}
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EditArchitectureProject; 