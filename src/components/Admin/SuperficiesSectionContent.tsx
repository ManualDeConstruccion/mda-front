// src/components/Admin/SuperficiesSectionContent.tsx
// Contenido de la sección "Superficies": pestañas Resumen, Pisos, Niveles, Polígonos.
// Reutiliza FloorsSummaryTab, FloorsTab, LevelsTab, PolygonsTab (misma lógica que FloorEditor).

import React, { useState } from 'react';
import { ProjectProvider } from '../../context/ProjectContext';
import FloorsSummaryTab from '../FloorEditor/FloorsSummaryTab';
import FloorsTab from '../FloorEditor/FloorsTab';
import LevelsTab from '../SurfaceEditor/LevelsTab';
import PolygonsTab from '../SurfaceEditor/PolygonsTab';
import styles from './SurfacesSectionTabs.module.scss';

export type SuperficiesTabType = 'resumen' | 'pisos' | 'niveles' | 'poligonos';

export interface SuperficiesSectionContentProps {
  /** ID del subproyecto (architecture_subproject) */
  subprojectId: number;
}

const SuperficiesSectionContent: React.FC<SuperficiesSectionContentProps> = ({ subprojectId }) => {
  const [activeTab, setActiveTab] = useState<SuperficiesTabType>('resumen');

  return (
    <ProjectProvider projectNodeId={subprojectId}>
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'resumen' ? styles.active : ''}`}
            onClick={() => setActiveTab('resumen')}
          >
            Resumen
          </button>
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
          <button
            className={`${styles.tab} ${activeTab === 'poligonos' ? styles.active : ''}`}
            onClick={() => setActiveTab('poligonos')}
          >
            Polígonos de Superficies
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'resumen' && (
            <div className={styles.tabPane}>
              <FloorsSummaryTab projectNodeId={subprojectId} />
            </div>
          )}
          {activeTab === 'pisos' && (
            <div className={styles.tabPane}>
              <FloorsTab projectNodeId={subprojectId} />
            </div>
          )}
          {activeTab === 'niveles' && (
            <div className={styles.tabPane}>
              <LevelsTab projectNodeId={subprojectId} />
            </div>
          )}
          {activeTab === 'poligonos' && (
            <div className={styles.tabPane}>
              <PolygonsTab projectNodeId={subprojectId} />
            </div>
          )}
        </div>
      </div>
    </ProjectProvider>
  );
};

export default SuperficiesSectionContent;
