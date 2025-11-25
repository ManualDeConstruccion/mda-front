// src/pages/ArchitectureProjects/FloorEditor.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { ProjectNode } from '../../types/project_nodes.types';
import styles from './SurfaceEditor.module.scss';
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import LevelsTab from '../../components/SurfaceEditor/LevelsTab';
import FloorsTab from '../../components/FloorEditor/FloorsTab';

type FloorTabType = 'pisos' | 'niveles';

const FloorEditor: React.FC = () => {
  const { projectId, architectureId } = useParams<{ projectId: string; architectureId: string }>();
  const navigate = useNavigate();

  const [isFloorsExpanded, setIsFloorsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<FloorTabType>('pisos');

  const { projects: architectureProjects } = useProjectNodes<ProjectNode>({ type: 'architecture_subproject' });
  const architectureProject = architectureProjects?.find(p => p.id === Number(architectureId));

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
          <h1>{architectureProject.name} - Pisos</h1>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(`/proyectos/${projectId}/arquitectura/${architectureId}`)}
          >
            <ArrowBackIcon /> Volver
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <main className={styles.mainInfo}>
          {/* Sección colapsable: Pisos */}
          <section className={styles.collapsibleSection}>
            <div 
              className={styles.collapsibleHeader}
              onClick={() => setIsFloorsExpanded(!isFloorsExpanded)}
            >
              <h2>Pisos Consolidados</h2>
              <p><strong>Descripción:</strong> {architectureProject.description}</p>
              <button className={styles.toggleButton}>
                {isFloorsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </button>
            </div>

            {isFloorsExpanded && (
              <div className={styles.collapsibleContent}>
                {/* Pestañas de navegación */}
                <div className={styles.tabsContainer}>
                  <div className={styles.tabs}>
                    <button
                      className={`${styles.tab} ${activeTab === 'pisos' ? styles.active : ''}`}
                      onClick={() => setActiveTab('pisos')}
                    >
                      Pisos
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'niveles' ? styles.active : ''}`}
                      onClick={() => setActiveTab('niveles')}
                    >
                      Niveles
                    </button>
                  </div>

                  <div className={styles.tabContent}>
                    {activeTab === 'pisos' && (
                      <div className={styles.tabPane}>
                        <FloorsTab projectNodeId={Number(architectureId)} />
                      </div>
                    )}

                    {activeTab === 'niveles' && (
                      <div className={styles.tabPane}>
                        <LevelsTab projectNodeId={Number(architectureId)} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default FloorEditor;

