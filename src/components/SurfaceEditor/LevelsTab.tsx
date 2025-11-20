// src/components/SurfaceEditor/LevelsTab.tsx

import React, { useState } from 'react';
import { useBuildings, useProjectLevels, Building, ProjectLevel } from '../../hooks/useProjectLevels';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Height as HeightIcon
} from '@mui/icons-material';
import HelpTooltip from '../common/HelpTooltip/HelpTooltip';
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
  const { levels, isLoadingLevels, createLevel, updateLevel, deleteLevel, suggestLevelCode } = useProjectLevels({
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
  const [showEditHeightsModal, setShowEditHeightsModal] = useState<number | null>(null);
  const [editingHeights, setEditingHeights] = useState<Record<number, number | null>>({});
  const [inputValues, setInputValues] = useState<Record<number, string>>({});

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
    } catch (error: any) {
      console.error('Error al crear nivel:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.detail || 
                          error?.response?.data?.message ||
                          'Error al crear nivel';
      alert(errorMessage);
    }
  };

  const handleOpenAddLevelModal = async (buildingId: number, levelType: 'below' | 'above') => {
    setShowAddLevelModal({ buildingId, levelType });
    setNewLevelName('');
    setNewLevelCode('');
    
    // Obtener sugerencia de código
    try {
      const suggestedCode = await suggestLevelCode(buildingId, levelType);
      if (suggestedCode) {
        setNewLevelCode(suggestedCode);
      }
    } catch (error) {
      console.error('Error al obtener sugerencia de código:', error);
      // Continuar sin sugerencia si hay error
    }
  };

  const handleDeleteLevel = async (level: ProjectLevel) => {
    if (!confirm(`¿Está seguro de eliminar el nivel "${level.name}"?`)) {
      return;
    }
    
    try {
      await deleteLevel.mutateAsync(level.id);
    } catch (error: any) {
      console.error('Error al eliminar nivel:', error);
      const errorMessage = error?.message || 
                          error?.response?.data?.error || 
                          error?.response?.data?.detail || 
                          error?.response?.data?.message ||
                          'No se pudo eliminar el nivel';
      alert(errorMessage);
    }
  };

  // Verificar si un nivel específico puede ser eliminado (debe ser extremo y no ser el único)
  const canDeleteLevel = (level: ProjectLevel, buildingId: number): boolean => {
    const buildingLevels = levelsByBuilding[buildingId] || { below: [], above: [], roof: [] };
    const allLevels = [...buildingLevels.below, ...buildingLevels.above, ...buildingLevels.roof];
    
    // Verificar que no sea el único nivel del edificio
    if (allLevels.length <= 1) {
      return false;
    }
    
    // Verificar si es extremo según su tipo
    return isExtremeLevel(level, allLevels);
  };

  // Verificar si un nivel es extremo (el más profundo en subterráneos o el más alto en sobre terreno)
  const isExtremeLevel = (level: ProjectLevel, allLevels: ProjectLevel[]): boolean => {
    // Obtener todos los niveles del mismo tipo y edificio
    const sameTypeLevels = allLevels.filter(
      l => l.level_type === level.level_type && l.building === level.building
    );
    
    // Si es el único nivel de este tipo, es extremo (pero ya verificamos que no es el único del edificio)
    if (sameTypeLevels.length <= 1) {
      return true;
    }
    
    if (level.level_type === 'below') {
      // Para subterráneos: extremo es el más profundo (menor altura o mayor order)
      if (sameTypeLevels.every(l => l.altura === null || l.altura === undefined)) {
        // Si no hay alturas definidas, usar order descendente (mayor order = más profundo)
        const sortedByOrder = [...sameTypeLevels].sort((a, b) => b.order - a.order);
        return sortedByOrder[0].id === level.id;
      }
      
      // Ordenar por altura ascendente (menor primero) y verificar si este es el primero
      const sortedByHeight = [...sameTypeLevels].sort((a, b) => {
        const alturaA = a.altura !== null && a.altura !== undefined ? a.altura : Infinity;
        const alturaB = b.altura !== null && b.altura !== undefined ? b.altura : Infinity;
        if (alturaA !== alturaB) {
          return alturaA - alturaB;
        }
        return b.order - a.order; // Si alturas iguales, mayor order primero
      });
      return sortedByHeight[0].id === level.id;
    } else if (level.level_type === 'above') {
      // Para sobre terreno: extremo es el más alto (mayor altura o mayor order)
      if (sameTypeLevels.every(l => l.altura === null || l.altura === undefined)) {
        // Si no hay alturas definidas, usar order descendente (mayor order = más alto)
        const sortedByOrder = [...sameTypeLevels].sort((a, b) => b.order - a.order);
        return sortedByOrder[0].id === level.id;
      }
      
      // Ordenar por altura descendente (mayor primero) y verificar si este es el primero
      const sortedByHeight = [...sameTypeLevels].sort((a, b) => {
        const alturaA = a.altura !== null && a.altura !== undefined ? a.altura : -Infinity;
        const alturaB = b.altura !== null && b.altura !== undefined ? b.altura : -Infinity;
        if (alturaA !== alturaB) {
          return alturaB - alturaA; // Descendente
        }
        return b.order - a.order; // Si alturas iguales, mayor order primero
      });
      return sortedByHeight[0].id === level.id;
    } else {
      // Las cubiertas siempre son extremos (están en la parte superior)
      return true;
    }
  };

  const handleEditHeights = (buildingId: number) => {
    const buildingLevels = levelsByBuilding[buildingId] || { below: [], above: [], roof: [] };
    // Obtener todos los niveles del edificio (subterráneos, sobre terreno y cubierta)
    const allLevels = [...buildingLevels.below, ...buildingLevels.above, ...buildingLevels.roof];
    
    // Inicializar el estado de edición con las alturas actuales
    const initialHeights: Record<number, number | null> = {};
    const initialInputValues: Record<number, string> = {};
    allLevels.forEach(level => {
      // Asegurarse de obtener el valor correcto de altura
      const alturaValue = level.altura !== undefined && level.altura !== null ? Number(level.altura) : null;
      initialHeights[level.id] = alturaValue;
      // Inicializar el valor del input como string formateado
      initialInputValues[level.id] = alturaValue !== null ? alturaValue.toFixed(2) : '';
    });
    setEditingHeights(initialHeights);
    setInputValues(initialInputValues);
    setShowEditHeightsModal(buildingId);
  };

  const handleSaveHeights = async () => {
    if (!showEditHeightsModal) return;
    
    try {
      // Actualizar cada nivel con su nueva altura
      const updatePromises = Object.entries(editingHeights).map(([levelId, altura]) => {
        const alturaValue = altura === null || altura === undefined ? null : parseFloat(altura.toString());
        return updateLevel.mutateAsync({
          id: parseInt(levelId),
          data: { altura: alturaValue }
        });
      });
      
      await Promise.all(updatePromises);
      setShowEditHeightsModal(null);
      setEditingHeights({});
    } catch (error: any) {
      console.error('Error al guardar alturas:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.detail || 
                          error?.response?.data?.message ||
                          'Error al guardar alturas';
      alert(errorMessage);
    }
  };

  const renderLevelRow = (level: ProjectLevel, buildingId: number) => {
    const canDelete = canDeleteLevel(level, buildingId);
    
    return (
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
            <div className={styles.levelNameContainer}>
              <span>{level.name}</span>
              <button
                className={styles.editIconButton}
                onClick={() => handleEditLevel(level)}
                title="Editar nombre del nivel"
              >
                <EditIcon fontSize="small" />
              </button>
            </div>
          )}
        </td>
        <td className={styles.numberCell}>{formatNumber(level.surface_util || 0)}</td>
        <td className={styles.numberCell}>{formatNumber(level.surface_comun || 0)}</td>
        <td className={styles.numberCell}>{formatNumber(level.surface_total || 0)}</td>
        <td>
          {canDelete ? (
            <button
              className={styles.deleteButton}
              onClick={() => handleDeleteLevel(level)}
              title="Eliminar nivel"
            >
              <DeleteIcon fontSize="small" />
            </button>
          ) : (
            <button
              className={styles.deleteButton}
              disabled
              title="Solo se pueden eliminar los niveles extremos"
              style={{ opacity: 0.3, cursor: 'not-allowed' }}
            >
              <DeleteIcon fontSize="small" />
            </button>
          )}
        </td>
      </tr>
    );
  };

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
                  <>
                    <div className={styles.buildingNameContainer}>
                      <h4>{building.name}</h4>
                      <button
                        className={styles.editIconButton}
                        onClick={() => handleEditBuilding(building)}
                        title="Editar nombre del edificio"
                      >
                        <EditIcon fontSize="small" />
                      </button>
                    </div>
                    <button
                      className={styles.addLevelButton}
                      onClick={() => handleEditHeights(building.id)}
                      title="Editar alturas"
                    >
                      <HeightIcon fontSize="small" /> Editar alturas
                    </button>
                  </>
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
                    onClick={() => handleOpenAddLevelModal(building.id, 'below')}
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
                      {renderTotalRow(totals.subterraneo, `TOTAL SUBTERRÁNEO ${building.name}`)}
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
                    onClick={() => handleOpenAddLevelModal(building.id, 'above')}
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
                      {renderTotalRow(totals.sobre_terreno, `TOTAL SOBRE TERRENO ${building.name}`)}
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
                      <th></th>
                      <th>ÚTIL (m²)</th>
                      <th>COMÚN (m²)</th>
                      <th>TOTAL (m²)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTotalRow(totals.total, `TOTAL ${building.name}`)}
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
                <label>
                  Código del Edificio
                  <HelpTooltip
                    modelName="Building"
                    fieldName="code"
                    defaultBriefText="Identificador único del edificio"
                    defaultExtendedText="El código debe ser único dentro del proyecto. Se recomienda usar letras minúsculas, números y guiones. Ejemplos: edificio-a, torre-1, casa-1. Caracteres recomendados: a-z, 0-9, guión (-)."
                    position="right"
                  />
                </label>
                <input
                  type="text"
                  value={newBuildingCode}
                  onChange={(e) => setNewBuildingCode(e.target.value)}
                  placeholder="ej: edificio-a, torre-1"
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Nombre del Edificio
                  <HelpTooltip
                    modelName="Building"
                    fieldName="name"
                    defaultBriefText="Nombre descriptivo del edificio"
                    defaultExtendedText="Nombre legible que se mostrará en la interfaz. Puede incluir espacios y caracteres especiales. Ejemplos: Edificio A, Torre 1, Casa Principal."
                    position="right"
                  />
                </label>
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
                <label>
                  Código del Nivel
                  <HelpTooltip
                    modelName="ProjectLevel"
                    fieldName="code"
                    defaultBriefText="Código único del nivel"
                    defaultExtendedText="Código corto que identifica el nivel. Se recomienda usar patrones como P01, P02 para pisos sobre terreno, SS1, SS2 para subterráneos, AZ para azotea. Caracteres recomendados: letras mayúsculas y números."
                    position="right"
                  />
                </label>
                <input
                  type="text"
                  value={newLevelCode}
                  onChange={(e) => setNewLevelCode(e.target.value)}
                  placeholder="ej: ss1, p01"
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Nombre del Nivel
                  <HelpTooltip
                    modelName="ProjectLevel"
                    fieldName="name"
                    defaultBriefText="Nombre descriptivo del nivel"
                    defaultExtendedText="Nombre legible que se mostrará en la interfaz. Puede incluir espacios y caracteres especiales. Ejemplos: Subterráneo 1, Piso 1, Azotea, Mezzanine."
                    position="right"
                  />
                </label>
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

      {/* Modal para editar alturas */}
      {showEditHeightsModal && (() => {
        const building = buildings.find(b => b.id === showEditHeightsModal);
        const buildingLevels = levelsByBuilding[showEditHeightsModal] || { below: [], above: [], roof: [] };
        const allLevels = [...buildingLevels.below, ...buildingLevels.above, ...buildingLevels.roof];
        
        return (
          <div className={styles.modalOverlay} onClick={() => setShowEditHeightsModal(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>
                  Editar Alturas - {building?.name || 'Edificio'}
                </h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => {
                    setShowEditHeightsModal(null);
                    setEditingHeights({});
                    setInputValues({});
                  }}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalContent}>
                <p className={styles.helpText}>
                  Ingrese la altura de cada nivel en metros. Los niveles subterráneos deben tener valores negativos.
                </p>
                {allLevels.length === 0 ? (
                  <p className={styles.emptyMessage}>No hay niveles asociados a este edificio.</p>
                ) : (
                  <table className={styles.heightsTable}>
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Nivel</th>
                        <th>Código</th>
                        <th>Altura (m)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Ordenar todos los niveles de menor a mayor altura */}
                      {(() => {
                        // Ordenar todos los niveles por altura de menor a mayor
                        const sortedLevels = [...allLevels].sort((a, b) => {
                          const alturaA = a.altura !== null && a.altura !== undefined ? a.altura : (a.level_type === 'below' ? -Infinity : Infinity);
                          const alturaB = b.altura !== null && b.altura !== undefined ? b.altura : (b.level_type === 'below' ? -Infinity : Infinity);
                          // Ordenar de menor a mayor
                          return alturaA - alturaB;
                        });
                        
                        const result: JSX.Element[] = [];
                        let groundLevelInserted = false;
                        
                        // Agregar niveles ordenados de menor a mayor
                        sortedLevels.forEach((level) => {
                          // Insertar línea de suelo natural después del último nivel negativo o antes del primer positivo
                          if (!groundLevelInserted) {
                            const altura = level.altura !== null && level.altura !== undefined ? level.altura : (level.level_type === 'below' ? -Infinity : Infinity);
                            if (altura >= 0) {
                              // Insertar antes del primer nivel positivo o cero
                              result.push(
                                <tr key="ground-level" className={styles.groundLevelRow}>
                                  <td colSpan={3} className={styles.groundLevelLabel}>
                                    Nivel de suelo natural
                                  </td>
                                  <td className={styles.groundLevelValue}>
                                    ±0.00
                                  </td>
                                </tr>
                              );
                              groundLevelInserted = true;
                            }
                          }
                          
                          const levelTypeLabel = 
                            level.level_type === 'below' ? 'Subterráneo' :
                            level.level_type === 'above' ? 'Sobre Terreno' :
                            'Cubierta';
                          
                          result.push(
                            <tr key={level.id}>
                              <td>{levelTypeLabel}</td>
                              <td>{level.name}</td>
                              <td>{level.code}</td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  min={level.level_type === 'below' ? '-999.99' : '0'}
                                  value={
                                    inputValues[level.id] !== undefined
                                      ? inputValues[level.id]
                                      : level.altura !== undefined && level.altura !== null
                                      ? Number(level.altura).toFixed(2)
                                      : ''
                                  }
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    // Guardar el valor del input como string para permitir escritura parcial
                                    setInputValues(prev => ({
                                      ...prev,
                                      [level.id]: inputValue
                                    }));
                                    // Convertir a número solo si es válido
                                    const numValue = inputValue === '' || inputValue === '-' ? null : parseFloat(inputValue);
                                    if (numValue !== null && !isNaN(numValue)) {
                                      setEditingHeights(prev => ({
                                        ...prev,
                                        [level.id]: numValue
                                      }));
                                    } else {
                                      setEditingHeights(prev => ({
                                        ...prev,
                                        [level.id]: null
                                      }));
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Al perder el foco, formatear el valor a 2 decimales
                                    const numValue = e.target.value === '' || e.target.value === '-' ? null : parseFloat(e.target.value);
                                    if (numValue !== null && !isNaN(numValue)) {
                                      setInputValues(prev => ({
                                        ...prev,
                                        [level.id]: numValue.toFixed(2)
                                      }));
                                    } else {
                                      setInputValues(prev => ({
                                        ...prev,
                                        [level.id]: ''
                                      }));
                                    }
                                  }}
                                  placeholder="0.00"
                                  className={styles.heightInput}
                                />
                              </td>
                            </tr>
                          );
                        });
                        
                        // Si todos los niveles son negativos, insertar la línea de suelo natural al final
                        if (!groundLevelInserted && sortedLevels.length > 0) {
                          result.push(
                            <tr key="ground-level" className={styles.groundLevelRow}>
                              <td colSpan={3} className={styles.groundLevelLabel}>
                                Nivel de suelo natural
                              </td>
                              <td className={styles.groundLevelValue}>
                                ±0.00
                              </td>
                            </tr>
                          );
                        }
                        
                        return result;
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowEditHeightsModal(null);
                    setEditingHeights({});
                    setInputValues({});
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className={styles.saveButton}
                  onClick={handleSaveHeights}
                  disabled={updateLevel.isPending || allLevels.length === 0}
                >
                  {updateLevel.isPending ? 'Guardando...' : 'Guardar Alturas'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default LevelsTab;

