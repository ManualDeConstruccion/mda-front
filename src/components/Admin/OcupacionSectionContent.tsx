// src/components/Admin/OcupacionSectionContent.tsx
// Contenido de la sección "Ocupación": pestañas Resumen, Pisos, Niveles, Polígonos de ocupación.
// Similar a SuperficiesSectionContent; enfocado en carga de ocupación (usage_type=occupancy, occupancy_destination).

import React, { useState } from 'react';
import { ProjectProvider } from '../../context/ProjectContext';
import FloorsTab from '../FloorEditor/FloorsTab';
import LevelsTab from '../SurfaceEditor/LevelsTab';
import PolygonsTab from '../SurfaceEditor/PolygonsTab';
import styles from './SurfacesSectionTabs.module.scss';

export type OcupacionTabType = 'resumen' | 'pisos' | 'niveles' | 'poligonos';

export interface OcupacionSectionContentProps {
  /** ID del subproyecto (architecture_subproject) */
  subprojectId: number;
}

const OcupacionSectionContent: React.FC<OcupacionSectionContentProps> = ({ subprojectId }) => {
  const [activeTab, setActiveTab] = useState<OcupacionTabType>('resumen');

  return (
    <ProjectProvider projectNodeId={subprojectId}>
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'resumen' ? styles.active : ''}`}
            onClick={() => setActiveTab('resumen')}
          >
            Resumen ocupación
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
            Polígonos de ocupación
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'resumen' && (
            <div className={styles.tabPane}>
              <p>Resumen de carga de ocupación por piso y edificio (resultados en <code>occupancy_results</code>). En construcción.</p>
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
              <PolygonsTab projectNodeId={subprojectId} usageType="occupancy" />
            </div>
          )}
        </div>
      </div>
    </ProjectProvider>
  );
};

export default OcupacionSectionContent;
