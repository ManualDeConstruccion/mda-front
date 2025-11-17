// src/components/SurfacesTab/SurfacesTab.tsx

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectLevels, ProjectLevel } from '../../hooks/useProjectLevels';
import { Edit as EditIcon } from '@mui/icons-material';
import styles from './SurfacesTab.module.scss';

interface SurfacesTabProps {
  projectNodeId: number;
}

const SurfacesTab: React.FC<SurfacesTabProps> = ({ projectNodeId }) => {
  const { levelsByType, isLoadingLevelsByType } = useProjectLevels({
    project_node: projectNodeId,
  });
  const navigate = useNavigate();
  const { projectId, architectureId } = useParams<{ projectId: string; architectureId: string }>();

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  const renderLevelRow = (level: ProjectLevel) => (
    <tr key={level.id}>
      <td>{level.name}</td>
      <td className={styles.numberCell}>{formatNumber(level.surface_util)}</td>
      <td className={styles.numberCell}>{formatNumber(level.surface_comun)}</td>
      <td className={styles.numberCell}>{formatNumber(level.surface_total)}</td>
    </tr>
  );

  const renderTotalRow = (util: number, comun: number, total: number, label: string) => {
    return (
      <tr className={styles.totalRow}>
        <td className={styles.totalLabel}>{label}</td>
        <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(util)}</td>
        <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(comun)}</td>
        <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(total)}</td>
      </tr>
    );
  };

  if (isLoadingLevelsByType) {
    return <div className={styles.loading}>Cargando superficies...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Superficies por Nivel</h3>
        <button
          className={styles.editButton}
          onClick={() => navigate(`/proyectos/${projectId}/arquitectura/${architectureId}/superficies`)}
        >
          <EditIcon /> Editar Superficies
        </button>
      </div>

      {/* Sección: Superficies Subterráneas */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          S. EDIFICADA SUBTERRÁNEO (S)
          <span className={styles.sectionSubtitle}>S. Edificada por nivel o piso</span>
        </h4>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nivel o Piso</th>
              <th>ÚTIL (m²)</th>
              <th>COMÚN (m²)</th>
              <th>TOTAL (m²)</th>
            </tr>
          </thead>
          <tbody>
            {levelsByType.below.map(renderLevelRow)}
            {renderTotalRow(
              levelsByType.totals?.subterraneo?.util || 0,
              levelsByType.totals?.subterraneo?.comun || 0,
              levelsByType.totals?.subterraneo?.total || 0,
              'TOTAL SUBTERRÁNEO'
            )}
            {levelsByType.below.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.emptyMessage}>
                  No hay niveles subterráneos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sección: Superficies Sobre Terreno */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          S. EDIFICADA SOBRE TERRENO
          <span className={styles.sectionSubtitle}>S. Edificada por nivel o piso</span>
        </h4>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nivel o Piso</th>
              <th>ÚTIL (m²)</th>
              <th>COMÚN (m²)</th>
              <th>TOTAL (m²)</th>
            </tr>
          </thead>
          <tbody>
            {levelsByType.above.map(renderLevelRow)}
            {renderTotalRow(
              levelsByType.totals?.sobre_terreno?.util || 0,
              levelsByType.totals?.sobre_terreno?.comun || 0,
              levelsByType.totals?.sobre_terreno?.total || 0,
              'TOTAL SOBRE TERRENO'
            )}
            {levelsByType.above.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.emptyMessage}>
                  No hay niveles sobre terreno registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sección: Total General */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          TOTAL GENERAL DEL PROYECTO
        </h4>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>ÚTIL (m²)</th>
              <th>COMÚN (m²)</th>
              <th>TOTAL (m²)</th>
            </tr>
          </thead>
          <tbody>
            {renderTotalRow(
              levelsByType.totals?.general?.util || 0,
              levelsByType.totals?.general?.comun || 0,
              levelsByType.totals?.general?.total || 0,
              'TOTAL GENERAL'
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SurfacesTab;

