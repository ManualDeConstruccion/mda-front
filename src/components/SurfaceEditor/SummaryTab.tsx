// src/components/SurfaceEditor/SummaryTab.tsx

import React, { useState, useMemo } from 'react';
import { useProjectLevels, ProjectLevel } from '../../hooks/useProjectLevels';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import styles from './SummaryTab.module.scss';

interface SummaryTabProps {
  projectNodeId: number;
}

interface LevelTotals {
  util: number;
  comun: number;
  total: number;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ projectNodeId }) => {
  const { levels, isLoadingLevels } = useProjectLevels({
    project_node: projectNodeId,
  });

  // Por defecto, los desplegables están abiertos
  const [isSubterraneoExpanded, setIsSubterraneoExpanded] = useState(true);
  const [isSobreTerrenoExpanded, setIsSobreTerrenoExpanded] = useState(true);

  // Agrupar niveles por tipo
  const levelsByType = useMemo(() => {
    const below: ProjectLevel[] = [];
    const above: ProjectLevel[] = [];
    const roof: ProjectLevel[] = [];

    levels.forEach(level => {
      if (level.level_type === 'below') {
        below.push(level);
      } else if (level.level_type === 'above') {
        above.push(level);
      } else if (level.level_type === 'roof') {
        roof.push(level);
      }
    });

    return { below, above, roof };
  }, [levels]);

  // Calcular totales por tipo
  const calculateTypeTotal = (levelList: ProjectLevel[]): LevelTotals => {
    return levelList.reduce(
      (acc, level) => ({
        util: acc.util + (level.surface_util || 0),
        comun: acc.comun + (level.surface_comun || 0),
        total: acc.total + (level.surface_total || 0),
      }),
      { util: 0, comun: 0, total: 0 }
    );
  };

  const subterraneoTotals = useMemo(
    () => calculateTypeTotal(levelsByType.below),
    [levelsByType.below]
  );

  const sobreTerrenoTotals = useMemo(
    () => calculateTypeTotal([...levelsByType.above, ...levelsByType.roof]),
    [levelsByType.above, levelsByType.roof]
  );

  const projectTotals = useMemo(() => ({
    util: subterraneoTotals.util + sobreTerrenoTotals.util,
    comun: subterraneoTotals.comun + sobreTerrenoTotals.comun,
    total: subterraneoTotals.total + sobreTerrenoTotals.total,
  }), [subterraneoTotals, sobreTerrenoTotals]);

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  const renderLevelRow = (level: ProjectLevel) => (
    <tr key={level.id} className={styles.levelRow}>
      <td className={styles.levelName}>
        {level.building_name} - {level.name}
      </td>
      <td className={styles.numberCell}>{formatNumber(level.surface_util || 0)}</td>
      <td className={styles.numberCell}>{formatNumber(level.surface_comun || 0)}</td>
      <td className={styles.numberCell}>{formatNumber(level.surface_total || 0)}</td>
    </tr>
  );

  const renderTotalRow = (totals: LevelTotals, label: string) => (
    <tr className={styles.totalRow}>
      <td className={styles.totalLabel}>{label}</td>
      <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totals.util)}</td>
      <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totals.comun)}</td>
      <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totals.total)}</td>
    </tr>
  );

  if (isLoadingLevels) {
    return <div className={styles.loading}>Cargando resumen...</div>;
  }

  // Ordenar niveles: primero por edificio, luego por orden
  const sortedBelowLevels = [...levelsByType.below].sort((a, b) => {
    if (a.building_name !== b.building_name) {
      return a.building_name.localeCompare(b.building_name);
    }
    return a.order - b.order;
  });

  const sortedAboveLevels = [...levelsByType.above, ...levelsByType.roof].sort((a, b) => {
    if (a.building_name !== b.building_name) {
      return a.building_name.localeCompare(b.building_name);
    }
    return a.order - b.order;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Resumen de Superficies</h3>
      </div>

      <div className={styles.summaryContent}>
        {/* Total Subterráneo - Desplegable */}
        <div className={styles.collapsibleSection}>
          <div
            className={styles.collapsibleHeader}
            onClick={() => setIsSubterraneoExpanded(!isSubterraneoExpanded)}
          >
            <h4>TOTAL SUBTERRÁNEO</h4>
            <div className={styles.headerTotals}>
              <span className={styles.totalValue}>
                {formatNumber(subterraneoTotals.total)} m²
              </span>
              <button className={styles.toggleButton}>
                {isSubterraneoExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </button>
            </div>
          </div>

          {isSubterraneoExpanded && (
            <div className={styles.collapsibleContent}>
              {sortedBelowLevels.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nivel</th>
                      <th>ÚTIL (m²)</th>
                      <th>COMÚN (m²)</th>
                      <th>TOTAL (m²)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBelowLevels.map(renderLevelRow)}
                    {renderTotalRow(subterraneoTotals, 'TOTAL SUBTERRÁNEO')}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyMessage}>
                  No hay niveles subterráneos registrados.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total sobre Terreno - Desplegable */}
        <div className={styles.collapsibleSection}>
          <div
            className={styles.collapsibleHeader}
            onClick={() => setIsSobreTerrenoExpanded(!isSobreTerrenoExpanded)}
          >
            <h4>TOTAL SOBRE TERRENO</h4>
            <div className={styles.headerTotals}>
              <span className={styles.totalValue}>
                {formatNumber(sobreTerrenoTotals.total)} m²
              </span>
              <button className={styles.toggleButton}>
                {isSobreTerrenoExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </button>
            </div>
          </div>

          {isSobreTerrenoExpanded && (
            <div className={styles.collapsibleContent}>
              {sortedAboveLevels.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nivel</th>
                      <th>ÚTIL (m²)</th>
                      <th>COMÚN (m²)</th>
                      <th>TOTAL (m²)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAboveLevels.map(renderLevelRow)}
                    {renderTotalRow(sobreTerrenoTotals, 'TOTAL SOBRE TERRENO')}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyMessage}>
                  No hay niveles sobre terreno registrados.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total del Proyecto */}
        <div className={styles.projectTotal}>
          <h5>TOTAL DEL PROYECTO</h5>
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
              {renderTotalRow(projectTotals, 'TOTAL PROYECTO')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;

