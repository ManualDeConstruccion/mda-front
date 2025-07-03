import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { ProjectNode } from '../../types/project_nodes.types';
import styles from './ArchitectureProjectDetail.module.scss';
import ListadoDeAntecedentes from './ListadoDeAntecedentes';
import {
  Home as HomeIcon,
  AttachMoney as BudgetIcon,
  People as PeopleIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const ArchitectureProjectDetail: React.FC = () => {
  const { projectId, architectureId } = useParams<{ projectId: string; architectureId: string }>();
  const navigate = useNavigate();

  const [activeStageId, setActiveStageId] = useState<number | null>(null);

  // Get all stages for the selector
  const { projects: stages } = useProjectNodes<ProjectNode>({ parent: Number(architectureId), type: 'stage' });

  const { projects: architectureProjects } = useProjectNodes<ProjectNode>({ type: 'architecture_subproject' });
  const architectureProject = architectureProjects?.find(p => p.id === Number(architectureId));

  useEffect(() => {
    if (stages && stages.length > 0 && !activeStageId) {
      setActiveStageId(stages[0].id);
    }
  }, [stages, activeStageId]);

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
        <div className={styles.headerContent}>
          <h1>{architectureProject.name}</h1>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.editButton}
            onClick={() => navigate(`/proyectos/${projectId}/arquitectura/${architectureId}/editar`)}
          >
            <EditIcon /> Editar Proyecto
          </button>
          <button 
            className={styles.backButton}
            onClick={() => navigate(`/proyectos/${projectId}`)}
          >
            Volver al Proyecto
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <main className={styles.mainInfo}>
          <section className={styles.infoSection}>
            <h2>Detalles del Proyecto</h2>
            <p><strong>Descripción:</strong> {architectureProject.description}</p>
          </section>
        </main>

        <aside className={styles.sideMenu}>
          <div className={styles.menuSection}>
            <Link to={`/proyectos/${projectId}/arquitectura/${architectureId}/propiedad`} className={styles.menuButton}><HomeIcon className={styles.icon} />Propiedad</Link>
            <Link to={`/proyectos/${projectId}/arquitectura/${architectureId}/presupuestos`} className={styles.menuButton}><BudgetIcon className={styles.icon} />Presupuestos</Link>
            <Link to={`/proyectos/${projectId}/arquitectura/${architectureId}/profesionales`} className={styles.menuButton}><PeopleIcon className={styles.icon} />Propietario / Profesionales</Link>
          </div>
        </aside>
      </div>

      <section className={styles.antecedentesSection}>
        <div className={styles.stagesNavigation}>
          <div className={styles.stagesContainer}>
            {(stages || []).map(stage => (
              <button
                key={stage.id}
                className={`${styles.stageButton} ${activeStageId === stage.id ? styles.active : ''}`}
                onClick={() => setActiveStageId(stage.id)}
              >
                {stage.name}
              </button>
            ))}
          </div>
        </div>

        {activeStageId && (
          <ListadoDeAntecedentes 
            stageId={activeStageId}
            projectId={Number(projectId)}
            architectureProjectId={Number(architectureId)}
          />
        )}
      </section>
    </div>
  );
};

export default ArchitectureProjectDetail;
