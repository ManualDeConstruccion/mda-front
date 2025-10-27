import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { useAuth } from '../../context/AuthContext';
import CharacterCounter from '../../components/common/CharacterCounter/CharacterCounter';
import ProjectTypeSelectors from '../../components/ProjectTypeSelectors';
import { CHARACTER_LIMITS } from '../../utils/validation';
import styles from './CreateProject.module.scss';
import { TypeCode } from '../../types/project_nodes.types';

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const { createProject } = useProjectNodes();
  const { accessToken } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'project' as TypeCode,
  });

  const [selectedProjectType, setSelectedProjectType] = useState<any>(null);
  const [projectTypesSummary, setProjectTypesSummary] = useState<any>(null);
  const [selectedRelatedTypes, setSelectedRelatedTypes] = useState<any[]>([]);

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

  const handleProjectTypesSummary = (summary: any) => {
    setProjectTypesSummary(summary);
    // No inicializar con tipos relacionados, el usuario los agrega manualmente
    setSelectedRelatedTypes([]);
  };

  const handleAddRelatedType = (relatedType: any) => {
    if (!selectedRelatedTypes.find((t: any) => t.id === relatedType.id)) {
      setSelectedRelatedTypes([...selectedRelatedTypes, relatedType]);
    }
  };

  const handleRemoveType = (typeId: number) => {
    setSelectedRelatedTypes(selectedRelatedTypes.filter((t: any) => t.id !== typeId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que hay un tipo de proyecto seleccionado
    if (!projectTypesSummary || !projectTypesSummary.selected) {
      alert('Por favor selecciona un tipo de proyecto');
      return;
    }
    
    try {
      // 1. Crear el proyecto principal
      const response = await createProject.mutateAsync(formData);
      const projectId = response.id;
      
      // 2. Crear los subproyectos arquitectónicos
      const allProjectTypes = [
        projectTypesSummary.selected,
        ...selectedRelatedTypes
      ];
      
      for (const projectType of allProjectTypes) {
        try {
          const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
          await fetch(`${apiUrl}/api/projects/project-nodes/create_architecture_subproject/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              description: projectType.description || '',
              parent_id: projectId,
              project_type_code: projectType.code
            })
          });
          console.log(`Subproyecto ${projectType.name} creado exitosamente`);
        } catch (subprojectError) {
          console.error(`Error al crear subproyecto ${projectType.name}:`, subprojectError);
        }
      }
      
      console.log('Proyecto y subproyectos creados exitosamente');
      
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
          onProjectTypesSummary={handleProjectTypesSummary}
          relatedTypes={projectTypesSummary?.relatedTypes || []}
          selectedRelatedTypes={selectedRelatedTypes}
          onAddRelatedType={handleAddRelatedType}
        />

        {/* Resumen de tipos de proyecto seleccionados */}
        {projectTypesSummary && projectTypesSummary.selected && (
          <div className={styles.summarySection}>
            <h3 className={styles.summaryTitle}>Resumen de la creación del proyecto</h3>
            
            <div className={styles.summaryContent}>
              {/* Tipo de proyecto principal */}
              <div className={styles.projectTypeChip}>
                <span className={styles.chipName}>{projectTypesSummary.selected.name}</span>
                <button 
                  type="button" 
                  onClick={() => {
                    setProjectTypesSummary(null);
                    setSelectedRelatedTypes([]);
                    setSelectedProjectType(null);
                  }}
                  className={styles.chipRemoveBtn}
                  aria-label="Eliminar tipo de proyecto"
                >
                  ×
                </button>
              </div>

              {/* Tipos relacionados seleccionados */}
              {selectedRelatedTypes.length > 0 && (
                <div className={styles.selectedTypesSection}>
                  <div className={styles.selectedTypesChips}>
                    {selectedRelatedTypes.map((type: any) => (
                      <div key={type.id} className={styles.selectedTypeChip}>
                        <span className={styles.chipName}>{type.name}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveType(type.id)}
                          className={styles.chipRemoveBtn}
                          aria-label={`Eliminar ${type.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
