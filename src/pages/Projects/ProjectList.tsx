// src/pages/Projects/ProjectList.tsx

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { ProjectNode } from '../../types/project_nodes.types';
import styles from './ProjectList.module.scss';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { projects, isLoadingProjects } = useProjectNodes<ProjectNode>({
    type: 'project',
  });

  const handleCreateProject = () => {
    navigate('/proyectos/crear');
  };

  const handleViewProject = (projectId: number) => {
    navigate(`/proyectos/${projectId}`);
  };

  if (isLoadingProjects) {
    return <div className={styles.loading}>Cargando proyectos...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Proyectos</h1>
        <button 
          className={styles.createButton}
          onClick={handleCreateProject}
        >
          Crear Nuevo Proyecto
        </button>
      </div>

      <div className={styles.projectGrid}>
        {projects?.map((project) => (
          <div key={project.id} className={styles.projectCard}>
            <div 
              className={styles.projectCardContent}
              onClick={() => handleViewProject(project.id)}
            >
              {project.cover_image_url ? (
                <div className={styles.coverImageContainer}>
                  <img 
                    src={project.cover_image_url}
                    alt={`Portada de ${project.name}`}
                    className={styles.coverImage}
                  />
                </div>
              ) : (
                <div className={styles.placeholderImage}>
                  <span>Sin imagen</span>
                </div>
              )}

              <div className={styles.projectInfo}>
                <h3>{project.name}</h3>
                <ProjectArchitectureList projectId={project.id} />
                <p className={styles.description}>
                  {project.description || 'Sin descripción'}
                </p>
                <div className={styles.projectMeta}>
                  <span className={styles.status} data-status={project.status}>
                    {project.status}
                  </span>
                  <span className={styles.progress}>
                    {project.progress_percent}% completado
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectArchitectureList: React.FC<{ projectId: number }> = ({ projectId }) => {
  const { projects: architectureProjects, isLoadingProjects: isLoading } = useProjectNodes<ProjectNode>({
    parent: projectId,
    type: 'architecture_subproject',
  });

  if (isLoading) {
    return <div className={styles.loading}>Cargando proyectos de arquitectura...</div>;
  }

  if (!architectureProjects || architectureProjects.length === 0) {
    return <p className={styles.noArchitectureProjects}>No hay proyectos de arquitectura</p>;
  }

  return (
    <ul className={styles.architectureList}>
      {architectureProjects.map((archProject) => (
        <li key={archProject.id} className={styles.architectureItem}>
          <Link 
            to={`/proyectos/${projectId}/arquitectura/${archProject.id}`}
            className={styles.architectureLink}
            onClick={(e) => e.stopPropagation()}
          >
            {archProject.name}
          </Link>
          <span className={styles.architectureStatus}>
            {archProject.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default ProjectList;
