// src/components/SurfacesTab/SurfacesTab.tsx

import React, { useState } from 'react';
import { useProjectLevels, ProjectLevel } from '../../hooks/useProjectLevels';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import styles from './SurfacesTab.module.scss';

interface SurfacesTabProps {
  projectNodeId: number;
}

const SurfacesTab: React.FC<SurfacesTabProps> = ({ projectNodeId }) => {
  const { levelsByType, isLoadingLevelsByType, createLevel, deleteLevel } = useProjectLevels({
    project_node: projectNodeId,
  });

  const [showAddLevelModal, setShowAddLevelModal] = useState(false);
  const [newLevelType, setNewLevelType] = useState<'below' | 'above' | 'roof'>('above');
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelCode, setNewLevelCode] = useState('');

  // Obtener el primer edificio (por ahora asumimos que hay al menos uno)
  // TODO: Permitir seleccionar edificio cuando haya múltiples
  const firstBuildingId = levelsByType.below[0]?.building || 
                          levelsByType.above[0]?.building || 
                          levelsByType.roof[0]?.building || 
                          null;

  const handleAddLevel = async () => {
    if (!newLevelName.trim() || !newLevelCode.trim() || !firstBuildingId) {
      return;
    }

    try {
      await createLevel.mutateAsync({
        building: firstBuildingId,
        code: newLevelCode,
        name: newLevelName,
        level_type: newLevelType,
        order: 0,
        is_active: true,
      });
      setShowAddLevelModal(false);
      setNewLevelName('');
      setNewLevelCode('');
    } catch (error) {
      console.error('Error al crear nivel:', error);
    }
  };

  const handleDeleteLevel = async (levelId: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este nivel?')) {
      try {
        await deleteLevel.mutateAsync(levelId);
      } catch (error) {
        console.error('Error al eliminar nivel:', error);
      }
    }
  };

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  const calculateTotal = (levels: ProjectLevel[], field: 'surface_total' | 'surface_util' | 'surface_comun'): number => {
    return levels.reduce((sum, level) => sum + (level[field] || 0), 0);
  };

  const renderLevelRow = (level: ProjectLevel) => (
    <tr key={level.id}>
      <td>{level.name}</td>
      <td className={styles.numberCell}>{formatNumber(level.surface_util)}</td>
      <td className={styles.numberCell}>{formatNumber(level.surface_comun)}</td>
      <td className={styles.numberCell}>{formatNumber(level.surface_total)}</td>
      <td>
        <button
          className={styles.deleteButton}
          onClick={() => handleDeleteLevel(level.id)}
          title="Eliminar nivel"
        >
          <DeleteIcon />
        </button>
      </td>
    </tr>
  );

  const renderTotalRow = (levels: ProjectLevel[], label: string) => {
    const totalUtil = calculateTotal(levels, 'surface_util');
    const totalComun = calculateTotal(levels, 'surface_comun');
    const totalTotal = calculateTotal(levels, 'surface_total');

    return (
      <tr className={styles.totalRow}>
        <td className={styles.totalLabel}>{label}</td>
        <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totalUtil)}</td>
        <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totalComun)}</td>
        <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totalTotal)}</td>
        <td></td>
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
          className={styles.addButton}
          onClick={() => setShowAddLevelModal(true)}
        >
          <AddIcon /> Agregar Nivel
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {levelsByType.below.map(renderLevelRow)}
            {levelsByType.below.length > 0 && renderTotalRow(levelsByType.below, 'TOTAL')}
            {levelsByType.below.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyMessage}>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {levelsByType.above.map(renderLevelRow)}
            {levelsByType.above.length > 0 && renderTotalRow(levelsByType.above, 'TOTAL')}
            {levelsByType.above.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyMessage}>
                  No hay niveles sobre terreno registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para agregar nivel */}
      {showAddLevelModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddLevelModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Agregar Nivel</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowAddLevelModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Tipo de Nivel</label>
                <select
                  value={newLevelType}
                  onChange={(e) => setNewLevelType(e.target.value as 'below' | 'above' | 'roof')}
                >
                  <option value="below">Subterráneo</option>
                  <option value="above">Sobre Terreno</option>
                  <option value="roof">Cubierta</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Código</label>
                <input
                  type="text"
                  value={newLevelCode}
                  onChange={(e) => setNewLevelCode(e.target.value)}
                  placeholder="Ej: ss1, p01, azotea"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nombre</label>
                <input
                  type="text"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  placeholder="Ej: Subterráneo 1, Piso 1"
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowAddLevelModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.saveButton}
                onClick={handleAddLevel}
                disabled={!newLevelName.trim() || !newLevelCode.trim()}
              >
                Crear Nivel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurfacesTab;

