// src/components/SurfaceEditor/LevelsTab.tsx

import React, { useState } from 'react';
import { useBuildings, useProjectLevels, Building, ProjectLevel } from '../../hooks/useProjectLevels';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon 
} from '@mui/icons-material';
import styles from './LevelsTab.module.scss';

interface LevelsTabProps {
  projectNodeId: number;
}

interface BuildingTotals {
  subterraneo: { util: number; comun: number; total: number };
  sobre_terreno: { util: number; comun: number; total: number };
  total: { util: number; comun: number; total: number };
}

const LevelsTab: React.FC<LevelsTabProps> = ({ projectNodeId }) => {
  const { buildings, isLoadingBuildings, createBuilding, updateBuilding } = useBuildings(projectNodeId);
  const { levels, isLoadingLevels, createLevel, updateLevel, deleteLevel } = useProjectLevels({
    project_node: projectNodeId,
  });

  const [editingBuilding, setEditingBuilding] = useState<number | null>(null);
  const [editingBuildingName, setEditingBuildingName] = useState('');
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [editingLevelName, setEditingLevelName] = useState('');
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newBuildingCode, setNewBuildingCode] = useState('');
  const [showAddLevelModal, setShowAddLevelModal] = useState<{ buildingId: number; levelType: 'below' | 'above' } | null>(null);
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelCode, setNewLevelCode] = useState('');

  // Agrupar niveles por edificio
  const levelsByBuilding = buildings.reduce((acc, building) => {
    const buildingLevels = levels.filter(level => level.building === building.id);
    acc[building.id] = {
      below: buildingLevels.filter(l => l.level_type === 'below'),
      above: buildingLevels.filter(l => l.level_type === 'above'),
      roof: buildingLevels.filter(l => l.level_type === 'roof'),
    };
    return acc;
  }, {} as Record<number, { below: ProjectLevel[]; above: ProjectLevel[]; roof: ProjectLevel[] }>);

  // Calcular subtotales por edificio
  const calculateBuildingTotals = (buildingId: number): BuildingTotals => {
    const buildingLevels = levelsByBuilding[buildingId] || { below: [], above: [], roof: [] };
    
    const calculateTypeTotal = (levelList: ProjectLevel[]) => {
      return levelList.reduce(
        (acc, level) => ({
          util: acc.util + (level.surface_util || 0),
          comun: acc.comun + (level.surface_comun || 0),
          total: acc.total + (level.surface_total || 0),
        }),
        { util: 0, comun: 0, total: 0 }
      );
    };

    const subterraneo = calculateTypeTotal(buildingLevels.below);
    const sobre_terreno = calculateTypeTotal([...buildingLevels.above, ...buildingLevels.roof]);
    const total = {
      util: subterraneo.util + sobre_terreno.util,
      comun: subterraneo.comun + sobre_terreno.comun,
      total: subterraneo.total + sobre_terreno.total,
    };

    return { subterraneo, sobre_terreno, total };
  };

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  const handleSaveToProject = async () => {
    // TODO: Implementar servicio que consolida valores de edificios a NodeParameter
    console.log('Guardar superficies en proyecto');
    alert('Funcionalidad de consolidación pendiente de implementar');
  };

  const handleEditBuilding = (building: Building) => {
    setEditingBuilding(building.id);
    setEditingBuildingName(building.name);
  };

  const handleSaveBuilding = async (buildingId: number) => {
    try {
      await updateBuilding.mutateAsync({
        id: buildingId,
        data: { name: editingBuildingName },
      });
      setEditingBuilding(null);
      setEditingBuildingName('');
    } catch (error) {
      console.error('Error al actualizar edificio:', error);
      alert('Error al actualizar edificio');
    }
  };

  const handleEditLevel = (level: ProjectLevel) => {
    setEditingLevel(level.id);
    setEditingLevelName(level.name);
  };

  const handleSaveLevel = async (levelId: number) => {
    await updateLevel.mutateAsync({
      id: levelId,
      data: { name: editingLevelName },
    });
    setEditingLevel(null);
    setEditingLevelName('');
  };

  const handleAddBuilding = async () => {
    if (!newBuildingName.trim() || !newBuildingCode.trim()) {
      alert('Debe ingresar nombre y código del edificio');
      return;
    }
    
    try {
      await createBuilding.mutateAsync({
        project_node: projectNodeId,
        name: newBuildingName,
        code: newBuildingCode,
        order: buildings.length,
        is_active: true,
      });
      setNewBuildingName('');
      setNewBuildingCode('');
      setShowAddBuildingModal(false);
    } catch (error) {
      console.error('Error al crear edificio:', error);
      alert('Error al crear edificio');
    }
  };

  const handleAddLevel = async () => {
    if (!showAddLevelModal) return;
    if (!newLevelName.trim() || !newLevelCode.trim()) {
      alert('Debe ingresar nombre y código del nivel');
      return;
    }
    
    try {
      await createLevel.mutateAsync({
        building: showAddLevelModal.buildingId,
        name: newLevelName,
        code: newLevelCode,
        level_type: showAddLevelModal.levelType,
        order: 0,
        is_active: true,
      });
      setNewLevelName('');
      setNewLevelCode('');
      setShowAddLevelModal(null);
    } catch (error) {
      console.error('Error al crear nivel:', error);
      alert('Error al crear nivel');
    }
  };

  const renderLevelRow = (level: ProjectLevel, buildingId: number) => (
    <tr key={level.id}>
      <td>
        {editingLevel === level.id ? (
          <input
            type="text"
            value={editingLevelName}
            onChange={(e) => setEditingLevelName(e.target.value)}
            onBlur={() => handleSaveLevel(level.id)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveLevel(level.id);
              } else if (e.key === 'Escape') {
                setEditingLevel(null);
                setEditingLevelName('');
              }
            }}
            autoFocus
            className={styles.editInput}
          />
        ) : (
          <span 
            onClick={() => handleEditLevel(level)} 
            className={styles.editableText}
            title="Click para editar"
          >
            {level.name}
          </span>
        )}
      </td>
      <td className={styles.numberCell}>{formatNumber(level.surface_util || 0)}</td>
      <td className={styles.numberCell}>{formatNumber(level.surface_comun || 0)}</td>
      <td className={styles.numberCell}>{formatNumber(level.surface_total || 0)}</td>
      <td>
        <button
          className={styles.deleteButton}
          onClick={() => {
            if (confirm(`¿Está seguro de eliminar el nivel "${level.name}"?`)) {
              deleteLevel.mutate(level.id);
            }
          }}
          title="Eliminar nivel"
        >
          <DeleteIcon fontSize="small" />
        </button>
      </td>
    </tr>
  );

  const renderTotalRow = (totals: { util: number; comun: number; total: number }, label: string) => (
    <tr className={styles.totalRow}>
      <td className={styles.totalLabel}>{label}</td>
      <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totals.util)}</td>
      <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totals.comun)}</td>
      <td className={`${styles.numberCell} ${styles.totalCell}`}>{formatNumber(totals.total)}</td>
      <td></td>
    </tr>
  );

  if (isLoadingBuildings || isLoadingLevels) {
    return <div className={styles.loading}>Cargando edificios y niveles...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Gestión de Edificios y Niveles</h3>
        <div className={styles.headerActions}>
          <button
            className={styles.addBuildingButton}
            onClick={() => setShowAddBuildingModal(true)}
          >
            <AddIcon /> Agregar Edificio
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSaveToProject}
          >
            <SaveIcon /> Guardar Superficies en Proyecto
          </button>
        </div>
      </div>

      {buildings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay edificios registrados. Crea el primer edificio para comenzar.</p>
        </div>
      ) : (
        buildings.map((building) => {
          const buildingLevels = levelsByBuilding[building.id] || { below: [], above: [], roof: [] };
          const totals = calculateBuildingTotals(building.id);

          return (
            <div key={building.id} className={styles.buildingSection}>
              <div className={styles.buildingHeader}>
                {editingBuilding === building.id ? (
                  <input
                    type="text"
                    value={editingBuildingName}
                    onChange={(e) => setEditingBuildingName(e.target.value)}
                    onBlur={() => handleSaveBuilding(building.id)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveBuilding(building.id);
                      } else if (e.key === 'Escape') {
                        setEditingBuilding(null);
                        setEditingBuildingName('');
                      }
                    }}
                    autoFocus
                    className={styles.buildingNameInput}
                  />
                ) : (
                  <h4 
                    onClick={() => handleEditBuilding(building)} 
                    className={styles.editableBuildingName}
                    title="Click para editar"
                  >
                    {building.name}
                  </h4>
                )}
              </div>

              {/* Sección: Superficies Subterráneas */}
              <div className={styles.levelTypeSection}>
                <div className={styles.levelTypeHeader}>
                  <h5>
                    S. EDIFICADA SUBTERRÁNEO (S)
                    <span className={styles.subtitle}>S. Edificada por nivel o piso</span>
                  </h5>
                  <button
                    className={styles.addLevelButton}
                    onClick={() => setShowAddLevelModal({ buildingId: building.id, levelType: 'below' })}
                  >
                    <AddIcon /> Agregar Nivel
                  </button>
                </div>
                {buildingLevels.below.length === 0 ? (
                  <div className={styles.emptyMessage}>
                    No existen niveles asociados
                  </div>
                ) : (
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
                      {buildingLevels.below.map(level => renderLevelRow(level, building.id))}
                      {renderTotalRow(totals.subterraneo, 'TOTAL SUBTERRÁNEO')}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Sección: Superficies Sobre Terreno */}
              <div className={styles.levelTypeSection}>
                <div className={styles.levelTypeHeader}>
                  <h5>
                    S. EDIFICADA SOBRE TERRENO
                    <span className={styles.subtitle}>S. Edificada por nivel o piso</span>
                  </h5>
                  <button
                    className={styles.addLevelButton}
                    onClick={() => setShowAddLevelModal({ buildingId: building.id, levelType: 'above' })}
                  >
                    <AddIcon /> Agregar Nivel
                  </button>
                </div>
                {buildingLevels.above.length === 0 ? (
                  <div className={styles.emptyMessage}>
                    No existen niveles asociados
                  </div>
                ) : (
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
                      {buildingLevels.above.map(level => renderLevelRow(level, building.id))}
                      {renderTotalRow(totals.sobre_terreno, 'TOTAL SOBRE TERRENO')}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Totales del Edificio */}
              <div className={styles.buildingTotals}>
                <h5>TOTALES DEL EDIFICIO</h5>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>ÚTIL (m²)</th>
                      <th>COMÚN (m²)</th>
                      <th>TOTAL (m²)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTotalRow(totals.total, 'TOTAL EDIFICIO')}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      {/* Modal para agregar edificio */}
      {showAddBuildingModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddBuildingModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Agregar Edificio</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAddBuildingModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Código del Edificio</label>
                <input
                  type="text"
                  value={newBuildingCode}
                  onChange={(e) => setNewBuildingCode(e.target.value)}
                  placeholder="ej: edificio-a, torre-1"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nombre del Edificio</label>
                <input
                  type="text"
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                  placeholder="ej: Edificio A, Torre 1"
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowAddBuildingModal(false)}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleAddBuilding}
                disabled={!newBuildingName.trim() || !newBuildingCode.trim()}
              >
                Crear Edificio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar nivel */}
      {showAddLevelModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddLevelModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                Agregar Nivel {showAddLevelModal.levelType === 'below' ? 'Subterráneo' : 'Sobre Terreno'}
              </h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAddLevelModal(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Código del Nivel</label>
                <input
                  type="text"
                  value={newLevelCode}
                  onChange={(e) => setNewLevelCode(e.target.value)}
                  placeholder="ej: ss1, p01"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nombre del Nivel</label>
                <input
                  type="text"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  placeholder="ej: Subterráneo 1, Piso 1"
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowAddLevelModal(null)}
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

export default LevelsTab;

