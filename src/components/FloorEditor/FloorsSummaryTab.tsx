// src/components/FloorEditor/FloorsSummaryTab.tsx

import React, { useState, useMemo } from 'react';
import { useFloors } from '../../hooks/useFloors';
import styles from './FloorsTab.module.scss';

interface FloorsSummaryTabProps {
  projectNodeId: number;
}

const FloorsSummaryTab: React.FC<FloorsSummaryTabProps> = ({ projectNodeId }) => {
  const { floors, isLoadingFloors } = useFloors({
    project_node: projectNodeId,
  });

  const [surfaceTerreno, setSurfaceTerreno] = useState<number>(300);
  const [permittedValues, setPermittedValues] = useState({
    ocupacionPisosSuperiores: 0,
    ocupacionSuelo: 0,
    constructibilidad: 0,
  });

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  // Calcular totales
  const totals = useMemo(() => {
    const floorsByType = {
      below: floors.filter(f => f.floor_type === 'below'),
      above: floors.filter(f => f.floor_type === 'above'),
    };

    const calculateTotals = (floorList: typeof floors) => {
      return floorList.reduce(
        (acc, floor) => ({
          util: acc.util + (floor.surface_util || 0),
          comun: acc.comun + (floor.surface_comun || 0),
          total: acc.total + (floor.surface_total || 0),
        }),
        { util: 0, comun: 0, total: 0 }
      );
    };

    const subterraneoTotals = calculateTotals(floorsByType.below);
    const sobreTerrenoTotals = calculateTotals(floorsByType.above);
    const totalGeneral = {
      util: subterraneoTotals.util + sobreTerrenoTotals.util,
      comun: subterraneoTotals.comun + sobreTerrenoTotals.comun,
      total: subterraneoTotals.total + sobreTerrenoTotals.total,
    };

    // Encontrar el primer piso (piso 1) - el primer piso "above" con order más bajo
    const firstFloor = floorsByType.above
      .sort((a, b) => a.order - b.order)[0];

    return {
      subterraneo: subterraneoTotals,
      sobreTerreno: sobreTerrenoTotals,
      general: totalGeneral,
      firstFloor: firstFloor,
      allAboveFloors: floorsByType.above,
    };
  }, [floors]);

  // Calcular coeficientes del proyecto
  const projectCoefficients = useMemo(() => {
    const terreno = surfaceTerreno || 1; // Evitar división por cero
    
    // Superficie del primer piso
    const primerPiso = totals.firstFloor?.surface_total || 0;
    
    // Superficie de todos los pisos superiores (excluyendo el primer piso)
    const pisosSuperiores = totals.allAboveFloors
      .filter(f => f.id !== totals.firstFloor?.id)
      .reduce((sum, f) => sum + (f.surface_total || 0), 0);
    
    // Ocupación pisos superiores: (todos_los_superiores - piso 1) / terreno
    const ocupacionPisosSuperiores = pisosSuperiores / terreno;
    
    // Ocupación de suelo: (piso 1 / terreno)
    const ocupacionSuelo = primerPiso / terreno;
    
    // Constructibilidad: (superficie total / terreno)
    const constructibilidad = totals.general.total / terreno;

    return {
      ocupacionPisosSuperiores,
      ocupacionSuelo,
      constructibilidad,
    };
  }, [totals, surfaceTerreno]);

  const renderTotalRow = (totals: { util: number; comun: number; total: number }, label: string) => (
    <tr className={styles.totalRow}>
      <td className={styles.totalLabel}>{label}</td>
      <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totals.util)}</td>
      <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totals.comun)}</td>
      <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totals.total)}</td>
    </tr>
  );

  if (isLoadingFloors) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando resumen...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Resumen de Superficies</h3>
      </div>

      {/* Sección: Superficies Subterráneas */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          S. EDIFICADA SUBTERRÁNEO (S)
          <span className={styles.sectionSubtitle}>S. Edificada por piso</span>
        </h4>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>ÚTIL (m²)</th>
              <th>COMÚN (m²)</th>
              <th>TOTAL (m²)</th>
            </tr>
          </thead>
          <tbody>
            {renderTotalRow(totals.subterraneo, 'TOTAL SUBTERRÁNEO')}
          </tbody>
        </table>
      </div>

      {/* Sección: Superficies Sobre Terreno */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          S. EDIFICADA SOBRE TERRENO
          <span className={styles.sectionSubtitle}>S. Edificada por piso</span>
        </h4>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>ÚTIL (m²)</th>
              <th>COMÚN (m²)</th>
              <th>TOTAL (m²)</th>
            </tr>
          </thead>
          <tbody>
            {renderTotalRow(totals.sobreTerreno, 'TOTAL SOBRE TERRENO')}
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
              <th></th>
              <th>ÚTIL (m²)</th>
              <th>COMÚN (m²)</th>
              <th>TOTAL (m²)</th>
            </tr>
          </thead>
          <tbody>
            {renderTotalRow(totals.general, 'TOTAL GENERAL')}
          </tbody>
        </table>
      </div>

      {/* Campo: Superficie Terreno */}
      <div className={styles.section}>
        <div className={styles.formGroup}>
          <label htmlFor="surfaceTerreno">Superficie Terreno (m²)</label>
          <input
            id="surfaceTerreno"
            type="number"
            min="0"
            step="0.01"
            value={surfaceTerreno}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              setSurfaceTerreno(value);
            }}
            className={styles.formInput}
          />
        </div>
      </div>

      {/* Cuadro Comparativo */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          Cuadro Comparativo
        </h4>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Parámetro</th>
              <th>Proyecto</th>
              <th>Permitido</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>COEFICIENTE DE OCUPACIÓN PISOS SUPERIORES (sobre 1er piso)</td>
              <td className={styles.numberCell}>{formatNumber(projectCoefficients.ocupacionPisosSuperiores)}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={permittedValues.ocupacionPisosSuperiores || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    setPermittedValues({
                      ...permittedValues,
                      ocupacionPisosSuperiores: value,
                    });
                  }}
                  className={styles.formInput}
                  style={{ width: '100%', textAlign: 'right', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </td>
            </tr>
            <tr>
              <td>COEFICIENTE DE OCUPACIÓN DE SUELO (1er piso)</td>
              <td className={styles.numberCell}>{formatNumber(projectCoefficients.ocupacionSuelo)}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={permittedValues.ocupacionSuelo || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    setPermittedValues({
                      ...permittedValues,
                      ocupacionSuelo: value,
                    });
                  }}
                  className={styles.formInput}
                  style={{ width: '100%', textAlign: 'right', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </td>
            </tr>
            <tr>
              <td>COEFICIENTE DE CONSTRUCTIBILIDAD</td>
              <td className={styles.numberCell}>{formatNumber(projectCoefficients.constructibilidad)}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={permittedValues.constructibilidad || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    setPermittedValues({
                      ...permittedValues,
                      constructibilidad: value,
                    });
                  }}
                  className={styles.formInput}
                  style={{ width: '100%', textAlign: 'right', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FloorsSummaryTab;

