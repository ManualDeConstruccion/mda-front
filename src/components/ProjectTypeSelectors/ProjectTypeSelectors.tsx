import React from 'react';
import { useProjectTypeSelectors } from '../../hooks/useProjectTypeSelectors';
import styles from './ProjectTypeSelectors.module.scss';

interface ProjectTypeSelectorsProps {
  onProjectTypeChange?: (projectType: any) => void;
  onProjectTypesSummary?: (summary: any) => void;
  relatedTypes?: any[];
  selectedRelatedTypes?: any[];
  onAddRelatedType?: (relatedType: any) => void;
}

const ProjectTypeSelectors: React.FC<ProjectTypeSelectorsProps> = ({ 
  onProjectTypeChange,
  onProjectTypesSummary,
  relatedTypes = [],
  selectedRelatedTypes = [],
  onAddRelatedType
}) => {
  const {
    groups,
    subgroups,
    projectTypes,
    selectedGroup,
    selectedSubgroup,
    selectedProjectType,
    loading,
    handleGroupChange,
    handleSubgroupChange,
    handleProjectTypeChange,
    getSelectedProjectType,
  } = useProjectTypeSelectors();

  const handleProjectTypeSelection = (projectTypeId: number | null) => {
    // Obtener el tipo de proyecto desde el array actual de projectTypes
    const selectedProjectType = projectTypes.find(pt => pt.id === projectTypeId) || null;
    
    // Actualizar el estado del hook
    handleProjectTypeChange(projectTypeId);
    
    // Notificar al padre sobre el cambio del tipo de proyecto
    if (onProjectTypeChange) {
      onProjectTypeChange(selectedProjectType);
    }
    
    // Notificar resumen SOLO si hay un tipo seleccionado
    if (onProjectTypesSummary && selectedProjectType) {
      const summary = {
        selected: selectedProjectType,
        relatedTypes: selectedProjectType.related_project_types || []
      };
      onProjectTypesSummary(summary);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Escoge el tipo de proyecto</h3>
      
      <div className={styles.selectors}>
        {/* Grupo */}
        <div className={styles.selectorGroup}>
          <label htmlFor="group-select" className={styles.label}>
            Grupo
          </label>
          <select
            id="group-select"
            value={selectedGroup || ''}
            onChange={(e) => handleGroupChange(e.target.value ? Number(e.target.value) : null)}
            className={styles.select}
            disabled={loading.groups}
          >
            <option value="">Selecciona un grupo</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {loading.groups && <div className={styles.loading}>Cargando grupos...</div>}
        </div>

        {/* Subgrupo */}
        <div className={styles.selectorGroup}>
          <label htmlFor="subgroup-select" className={styles.label}>
            Subgrupo
          </label>
          <select
            id="subgroup-select"
            value={selectedSubgroup || ''}
            onChange={(e) => handleSubgroupChange(e.target.value ? Number(e.target.value) : null)}
            className={styles.select}
            disabled={!selectedGroup || loading.subgroups}
          >
            <option value="">Selecciona un subgrupo</option>
            {subgroups.map((subgroup) => (
              <option key={subgroup.id} value={subgroup.id}>
                {subgroup.name}
              </option>
            ))}
          </select>
          {loading.subgroups && <div className={styles.loading}>Cargando subgrupos...</div>}
        </div>

        {/* Tipo de Proyecto */}
        <div className={styles.selectorGroup}>
          <label htmlFor="project-type-select" className={styles.label}>
            Tipo de Proyecto
          </label>
          <select
            id="project-type-select"
            value={selectedProjectType || ''}
            onChange={(e) => handleProjectTypeSelection(e.target.value ? Number(e.target.value) : null)}
            className={styles.select}
            disabled={!selectedSubgroup || loading.projectTypes}
          >
            <option value="">Selecciona un tipo de proyecto</option>
            {projectTypes.map((projectType) => (
              <option key={projectType.id} value={projectType.id}>
                {projectType.name}
              </option>
            ))}
          </select>
          {loading.projectTypes && <div className={styles.loading}>Cargando tipos de proyecto...</div>}
        </div>
      </div>

      {/* Tipos relacionados sugeridos */}
      {relatedTypes && relatedTypes.length > 0 && (
        <div className={styles.suggestionsSection}>
          <h5 className={styles.suggestionsLabel}>También puedes necesitar:</h5>
          <div className={styles.suggestionChips}>
            {relatedTypes.map((related: any) => {
              const isAdded = selectedRelatedTypes.find((t: any) => t.id === related.id);
              return (
                <div 
                  key={related.id} 
                  className={`${styles.suggestionChip} ${isAdded ? styles.suggestionChipAdded : ''}`}
                  onClick={() => {
                    if (!isAdded && onAddRelatedType) {
                      onAddRelatedType(related);
                    }
                  }}
                >
                  <span className={styles.chipName}>{related.name}</span>
                  {related.description && (
                    <span className={styles.chipDescription}>{related.description}</span>
                  )}
                  {isAdded && (
                    <span className={styles.chipAddedIcon}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTypeSelectors;
