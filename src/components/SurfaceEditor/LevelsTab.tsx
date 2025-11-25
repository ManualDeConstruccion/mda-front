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
import { useModalHelpTexts } from '../../hooks/useModalHelpTexts';
import { validateLevelData } from '../../validation/levelSchemas';
import { validateBuildingData } from '../../validation/buildingSchemas';
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

  // Cargar todos los textos de ayuda necesarios para los modales en una sola llamada
  const modalHelpTextFields = [
    { model: 'Building', field: 'code' },
    { model: 'Building', field: 'name' },
    { model: 'ProjectLevel', field: 'code' },
    { model: 'ProjectLevel', field: 'name' },
    { model: 'ProjectLevel', field: 'altura' },
  ];
  const { getHelpText } = useModalHelpTexts(modalHelpTextFields);

  const [editingBuilding, setEditingBuilding] = useState<number | null>(null);
  const [editingBuildingName, setEditingBuildingName] = useState('');
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [editingLevelName, setEditingLevelName] = useState('');
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newBuildingCode, setNewBuildingCode] = useState('');
  const [buildingValidationErrors, setBuildingValidationErrors] = useState<Record<string, string>>({});
  const [showAddLevelModal, setShowAddLevelModal] = useState<{ buildingId: number; levelType: 'below' | 'above' } | null>(null);
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelCode, setNewLevelCode] = useState('');
  const [newLevelAltura, setNewLevelAltura] = useState<string>('');
  const [levelValidationErrors, setLevelValidationErrors] = useState<Record<string, string>>({});
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
    setLevelValidationErrors({}); // Limpiar errores al editar
  };

  const handleSaveLevel = async (levelId: number) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return;

    // Validar con Yup solo el nombre (ya que solo se puede editar el nombre aquí)
    const validation = await validateLevelData(
      {
        code: level.code,
        name: editingLevelName,
        altura: level.altura,
        level_type: level.level_type,
        building: level.building,
        order: level.order,
        is_active: level.is_active,
      },
      levels,
      level.building,
      levelId
    );

    if (!validation.isValid) {
      // Solo mostrar errores relacionados con name
      if (validation.errors.name) {
        setLevelValidationErrors({ name: validation.errors.name });
        return;
      }
    }

    setLevelValidationErrors({});
    try {
      await updateLevel.mutateAsync({
        id: levelId,
        data: { name: editingLevelName.trim() },
      });
      setEditingLevel(null);
      setEditingLevelName('');
    } catch (error: any) {
      console.error('Error al actualizar nivel:', error);
      const errorData = error?.response?.data;
      const backendErrors: Record<string, string> = {};
      if (errorData) {
        Object.keys(errorData).forEach((key) => {
          const errorValue = errorData[key];
          backendErrors[key] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        });
        setLevelValidationErrors(backendErrors);
      }
    }
  };

  // Limpiar errores de validación cuando cambian los campos del edificio
  const clearBuildingFieldError = (fieldName: string) => {
    if (buildingValidationErrors[fieldName]) {
      const newErrors = { ...buildingValidationErrors };
      delete newErrors[fieldName];
      setBuildingValidationErrors(newErrors);
    }
  };

  const handleAddBuilding = async () => {
    // Validar con Yup
    const validation = await validateBuildingData(
      {
        code: newBuildingCode,
        name: newBuildingName,
        project_node: projectNodeId,
        order: buildings.length,
        is_active: true,
      },
      buildings,
      projectNodeId
    );

    if (!validation.isValid) {
      setBuildingValidationErrors(validation.errors);
      return;
    }

    setBuildingValidationErrors({});
    try {
      await createBuilding.mutateAsync({
        project_node: projectNodeId,
        name: newBuildingName.trim(),
        code: newBuildingCode.trim(),
        order: buildings.length,
        is_active: true,
      });
      setNewBuildingName('');
      setNewBuildingCode('');
      setBuildingValidationErrors({});
      setShowAddBuildingModal(false);
    } catch (error: any) {
      console.error('Error al crear edificio:', error);
      console.error('Error response data:', error?.response?.data);
      // Manejar error de validación del backend
      const errorData = error?.response?.data;
      const backendErrors: Record<string, string> = {};
      
      if (errorData) {
        // Manejar diferentes formatos de error del backend
        if (typeof errorData === 'string') {
          backendErrors.general = errorData;
        } else if (Array.isArray(errorData)) {
          backendErrors.general = errorData.join(', ');
        } else if (typeof errorData === 'object') {
          Object.keys(errorData).forEach((key) => {
            const errorValue = errorData[key];
            if (Array.isArray(errorValue)) {
              backendErrors[key] = errorValue[0] || errorValue.join(', ');
            } else if (typeof errorValue === 'string') {
              backendErrors[key] = errorValue;
            } else if (typeof errorValue === 'object' && errorValue !== null) {
              // Si es un objeto, intentar extraer el mensaje
              backendErrors[key] = errorValue.message || JSON.stringify(errorValue);
            }
          });
        }
        
        // Si no hay errores específicos pero hay un mensaje general
        if (Object.keys(backendErrors).length === 0 && errorData.detail) {
          backendErrors.general = errorData.detail;
        } else if (Object.keys(backendErrors).length === 0 && errorData.message) {
          backendErrors.general = errorData.message;
        } else if (Object.keys(backendErrors).length === 0 && errorData.error) {
          backendErrors.general = errorData.error;
        }
      }
      
      // Si aún no hay errores, mostrar mensaje genérico
      if (Object.keys(backendErrors).length === 0) {
        backendErrors.general = 'Error al crear edificio. Verifique que los campos no estén duplicados.';
      }
      
      setBuildingValidationErrors(backendErrors);
    }
  };

  // Limpiar errores de validación cuando cambian los campos
  const clearLevelFieldError = (fieldName: string) => {
    if (levelValidationErrors[fieldName]) {
      const newErrors = { ...levelValidationErrors };
      delete newErrors[fieldName];
      setLevelValidationErrors(newErrors);
    }
  };

  const handleAddLevel = async () => {
    if (!showAddLevelModal) return;

    // Validar con Yup
    const validation = await validateLevelData(
      {
        code: newLevelCode,
        name: newLevelName,
        altura: newLevelAltura,
        level_type: showAddLevelModal.levelType,
        building: showAddLevelModal.buildingId,
        order: 0,
        is_active: true,
      },
      levels,
      showAddLevelModal.buildingId
    );

    if (!validation.isValid) {
      setLevelValidationErrors(validation.errors);
      return;
    }

    setLevelValidationErrors({});
    try {
      await createLevel.mutateAsync({
        building: showAddLevelModal.buildingId,
        name: newLevelName.trim(),
        code: newLevelCode.trim(),
        altura: newLevelAltura ? parseFloat(newLevelAltura) : null,
        level_type: showAddLevelModal.levelType,
        order: 0,
        is_active: true,
      });
      setNewLevelName('');
      setNewLevelCode('');
      setNewLevelAltura('');
      setLevelValidationErrors({});
      setShowAddLevelModal(null);
    } catch (error: any) {
      console.error('Error al crear nivel:', error);
      console.error('Error response data:', error?.response?.data);
      // Manejar error de validación del backend
      const errorData = error?.response?.data;
      const backendErrors: Record<string, string> = {};
      
      if (errorData) {
        // Manejar diferentes formatos de error del backend
        if (typeof errorData === 'string') {
          backendErrors.general = errorData;
        } else if (Array.isArray(errorData)) {
          backendErrors.general = errorData.join(', ');
        } else if (typeof errorData === 'object') {
          Object.keys(errorData).forEach((key) => {
            const errorValue = errorData[key];
            if (Array.isArray(errorValue)) {
              backendErrors[key] = errorValue[0] || errorValue.join(', ');
            } else if (typeof errorValue === 'string') {
              backendErrors[key] = errorValue;
            } else if (typeof errorValue === 'object' && errorValue !== null) {
              // Si es un objeto, intentar extraer el mensaje
              backendErrors[key] = errorValue.message || JSON.stringify(errorValue);
            }
          });
        }
        
        // Si no hay errores específicos pero hay un mensaje general
        if (Object.keys(backendErrors).length === 0 && errorData.detail) {
          backendErrors.general = errorData.detail;
        } else if (Object.keys(backendErrors).length === 0 && errorData.message) {
          backendErrors.general = errorData.message;
        } else if (Object.keys(backendErrors).length === 0 && errorData.error) {
          backendErrors.general = errorData.error;
        }
      }
      
      // Si aún no hay errores, mostrar mensaje genérico
      if (Object.keys(backendErrors).length === 0) {
        backendErrors.general = 'Error al crear nivel. Verifique que los campos no estén duplicados.';
      }
      
      setLevelValidationErrors(backendErrors);
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
            <div style={{ width: '100%' }}>
              <input
                type="text"
                value={editingLevelName}
                onChange={(e) => {
                  setEditingLevelName(e.target.value);
                  clearLevelFieldError('name');
                }}
                onBlur={() => handleSaveLevel(level.id)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveLevel(level.id);
                  } else if (e.key === 'Escape') {
                    setEditingLevel(null);
                    setEditingLevelName('');
                    setLevelValidationErrors({});
                  }
                }}
                autoFocus
                className={`${styles.editInput} ${levelValidationErrors.name ? styles.inputError : ''}`}
              />
              {levelValidationErrors.name && (
                <small className={styles.errorText} style={{ display: 'block', marginTop: '0.25rem' }}>
                  {levelValidationErrors.name}
                </small>
              )}
            </div>
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
        <div className={styles.modalOverlay} onClick={() => {
          setShowAddBuildingModal(false);
          setNewBuildingName('');
          setNewBuildingCode('');
          setBuildingValidationErrors({});
        }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Agregar Edificio</h3>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowAddBuildingModal(false);
                  setNewBuildingName('');
                  setNewBuildingCode('');
                  setBuildingValidationErrors({});
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              {buildingValidationErrors.general && (
                <div className={styles.errorMessage} style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#ffebee', borderRadius: '4px', border: '1px solid #ef5350' }}>
                  <strong style={{ color: '#d32f2f', display: 'block', marginBottom: '0.25rem' }}>Error:</strong>
                  <span style={{ color: '#c62828' }}>{buildingValidationErrors.general}</span>
                </div>
              )}
              <div className={styles.formGroup}>
                <label>
                  Código del Edificio *
                  <HelpTooltip
                    modelName="Building"
                    fieldName="code"
                    helpTextData={getHelpText('Building', 'code')}
                    defaultBriefText="Identificador único del edificio"
                    defaultExtendedText="El código debe ser único dentro del proyecto. Se recomienda usar letras minúsculas, números y guiones. Ejemplos: edificio-a, torre-1, casa-1. Caracteres recomendados: a-z, 0-9, guión (-)."
                    position="right"
                  />
                </label>
                <input
                  type="text"
                  value={newBuildingCode}
                  onChange={(e) => {
                    setNewBuildingCode(e.target.value);
                    clearBuildingFieldError('code');
                  }}
                  placeholder="ej: edificio-a, torre-1"
                  className={buildingValidationErrors.code ? styles.inputError : ''}
                />
                {buildingValidationErrors.code && (
                  <small className={styles.errorText}>{buildingValidationErrors.code}</small>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>
                  Nombre del Edificio *
                  <HelpTooltip
                    modelName="Building"
                    fieldName="name"
                    helpTextData={getHelpText('Building', 'name')}
                    defaultBriefText="Nombre descriptivo del edificio"
                    defaultExtendedText="Nombre legible que se mostrará en la interfaz. Puede incluir espacios y caracteres especiales. Ejemplos: Edificio A, Torre 1, Casa Principal."
                    position="right"
                  />
                </label>
                <input
                  type="text"
                  value={newBuildingName}
                  onChange={(e) => {
                    setNewBuildingName(e.target.value);
                    clearBuildingFieldError('name');
                  }}
                  placeholder="ej: Edificio A, Torre 1"
                  className={buildingValidationErrors.name ? styles.inputError : ''}
                />
                {buildingValidationErrors.name && (
                  <small className={styles.errorText}>{buildingValidationErrors.name}</small>
                )}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowAddBuildingModal(false);
                  setNewBuildingName('');
                  setNewBuildingCode('');
                  setBuildingValidationErrors({});
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleAddBuilding}
                disabled={!newBuildingName.trim() || !newBuildingCode.trim() || Object.keys(buildingValidationErrors).filter(key => key !== 'general').length > 0}
              >
                Crear Edificio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar nivel */}
      {showAddLevelModal && (
        <div className={styles.modalOverlay} onClick={() => {
          setShowAddLevelModal(null);
          setNewLevelName('');
          setNewLevelCode('');
          setNewLevelAltura('');
          setLevelValidationErrors({});
        }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                Agregar Nivel {showAddLevelModal.levelType === 'below' ? 'Subterráneo' : 'Sobre Terreno'}
              </h3>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowAddLevelModal(null);
                  setNewLevelName('');
                  setNewLevelCode('');
                  setNewLevelAltura('');
                  setLevelValidationErrors({});
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              {levelValidationErrors.general && (
                <div className={styles.errorMessage} style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#ffebee', borderRadius: '4px', border: '1px solid #ef5350' }}>
                  <strong style={{ color: '#d32f2f', display: 'block', marginBottom: '0.25rem' }}>Error:</strong>
                  <span style={{ color: '#c62828' }}>{levelValidationErrors.general}</span>
                </div>
              )}
              <div className={styles.formGroup}>
                <label>
                  Código del Nivel *
                  <HelpTooltip
                    modelName="ProjectLevel"
                    fieldName="code"
                    helpTextData={getHelpText('ProjectLevel', 'code')}
                    defaultBriefText="Código único del nivel"
                    defaultExtendedText="Código corto que identifica el nivel. Se recomienda usar patrones como P01, P02 para pisos sobre terreno, SS1, SS2 para subterráneos, AZ para azotea. Caracteres recomendados: letras mayúsculas y números."
                    position="right"
                  />
                </label>
                <input
                  type="text"
                  value={newLevelCode}
                  onChange={(e) => {
                    setNewLevelCode(e.target.value);
                    clearLevelFieldError('code');
                  }}
                  placeholder="ej: ss1, p01"
                  className={levelValidationErrors.code ? styles.inputError : ''}
                />
                {levelValidationErrors.code && (
                  <small className={styles.errorText}>{levelValidationErrors.code}</small>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>
                  Nombre del Nivel *
                  <HelpTooltip
                    modelName="ProjectLevel"
                    fieldName="name"
                    helpTextData={getHelpText('ProjectLevel', 'name')}
                    defaultBriefText="Nombre descriptivo del nivel"
                    defaultExtendedText="Nombre legible que se mostrará en la interfaz. Puede incluir espacios y caracteres especiales. Ejemplos: Subterráneo 1, Piso 1, Azotea, Mezzanine."
                    position="right"
                  />
                </label>
                <input
                  type="text"
                  value={newLevelName}
                  onChange={(e) => {
                    setNewLevelName(e.target.value);
                    clearLevelFieldError('name');
                  }}
                  placeholder="ej: Subterráneo 1, Piso 1"
                  className={levelValidationErrors.name ? styles.inputError : ''}
                />
                {levelValidationErrors.name && (
                  <small className={styles.errorText}>{levelValidationErrors.name}</small>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>
                  Altura (m)
                  <HelpTooltip
                    modelName="ProjectLevel"
                    fieldName="altura"
                    helpTextData={getHelpText('ProjectLevel', 'altura')}
                    defaultBriefText="Altura del nivel desde el nivel del terreno"
                    defaultExtendedText="Altura del nivel desde el nivel del terreno en metros. Negativo para subterráneos. Se calcula automáticamente desde order si no se especifica."
                    position="right"
                  />
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={newLevelAltura}
                  onChange={(e) => {
                    setNewLevelAltura(e.target.value);
                    clearLevelFieldError('altura');
                  }}
                  placeholder="Se calculará automáticamente si se deja vacío"
                  className={levelValidationErrors.altura ? styles.inputError : ''}
                />
                {levelValidationErrors.altura && (
                  <small className={styles.errorText}>{levelValidationErrors.altura}</small>
                )}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowAddLevelModal(null);
                  setNewLevelName('');
                  setNewLevelCode('');
                  setNewLevelAltura('');
                  setLevelValidationErrors({});
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleAddLevel}
                disabled={!newLevelName.trim() || !newLevelCode.trim() || Object.keys(levelValidationErrors).filter(key => key !== 'general').length > 0}
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

