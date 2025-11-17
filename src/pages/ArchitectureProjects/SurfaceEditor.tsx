// src/pages/ArchitectureProjects/SurfaceEditor.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { ProjectNode } from '../../types/project_nodes.types';
import styles from './SurfaceEditor.module.scss';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import LevelsTab from '../../components/SurfaceEditor/LevelsTab';

type SurfaceTabType = 'niveles' | 'poligonos' | 'copropiedad';

const SurfaceEditor: React.FC = () => {
  const { projectId, architectureId } = useParams<{ projectId: string; architectureId: string }>();
  const navigate = useNavigate();

  const [isSurfacesExpanded, setIsSurfacesExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<SurfaceTabType>('niveles');

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
          <h1>{architectureProject.name} - Superficies</h1>
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
          {/* Sección colapsable: Superficies */}
          <section className={styles.collapsibleSection}>
            <div 
              className={styles.collapsibleHeader}
              onClick={() => setIsSurfacesExpanded(!isSurfacesExpanded)}
            >
              <h2>Superficies</h2>
              <p><strong>Descripción:</strong> {architectureProject.description}</p>
              <button className={styles.toggleButton}>
                {isSurfacesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </button>
            </div>

            {isSurfacesExpanded && (
              <div className={styles.collapsibleContent}>
                {/* Pestañas de navegación */}
                <div className={styles.tabsContainer}>
                  <div className={styles.tabs}>
                    <button
                      className={`${styles.tab} ${activeTab === 'niveles' ? styles.active : ''}`}
                      onClick={() => setActiveTab('niveles')}
                    >
                      Niveles
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'poligonos' ? styles.active : ''}`}
                      onClick={() => setActiveTab('poligonos')}
                    >
                      Polígonos de Superficies
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'copropiedad' ? styles.active : ''}`}
                      onClick={() => setActiveTab('copropiedad')}
                    >
                      Unidades de Copropiedad
                    </button>
                  </div>

                  <div className={styles.tabContent}>
                    {activeTab === 'niveles' && (
                      <div className={styles.tabPane}>
                        <LevelsTab projectNodeId={Number(architectureId)} />
                      </div>
                    )}

                    {activeTab === 'poligonos' && (
                      <div className={styles.tabPane}>
                        <h3>Polígonos de Superficies</h3>
                        <p>Aquí podrás gestionar los polígonos de superficies por nivel.</p>
                        {/* TODO: Implementar componente de gestión de polígonos */}
                      </div>
                    )}

                    {activeTab === 'copropiedad' && (
                      <div className={styles.tabPane}>
                        <h3>Unidades de Copropiedad (Superficie Útil)</h3>
                        <p>Aquí podrás gestionar las unidades de copropiedad y sus superficies útiles.</p>
                        {/* TODO: Implementar componente de gestión de copropiedad */}
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

export default SurfaceEditor;

