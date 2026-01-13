// src/components/SurfaceEditor/LevelsTab.tsx

import React, { useState } from 'react';
import { useBuildings, useProjectLevels, Building, ProjectLevel } from '../../hooks/useProjectLevels';
import { useFloors } from '../../hooks/useFloors';
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
  const { levels, isLoadingLevels, createLevel, updateLevel, deleteLevel, suggestLevelCode, getAvailableFloors, createMultipleLevels } = useProjectLevels({
    project_node: projectNodeId,
  });
  const { floors, isLoadingFloors } = useFloors({ project_node: projectNodeId });

  // Cargar todos los textos de ayuda necesarios para los modales en una sola llamada
  const modalHelpTextFields = [
    { model: 'Building', field: 'code' },
    { model: 'Building', field: 'name' },
    { model: 'ProjectLevel', field: 'code' },
    { model: 'ProjectLevel', field: 'name' },
    { model: 'ProjectLevel', field: 'floor' },
    { model: 'ProjectLevel', field: 'altura' },
  ];
  const { getHelpText } = useModalHelpTexts(modalHelpTextFields);

  const [editingBuilding, setEditingBuilding] = useState<number | null>(null);
  const [editingBuildingName, setEditingBuildingName] = useState('');
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newBuildingCode, setNewBuildingCode] = useState('');
  const [buildingValidationErrors, setBuildingValidationErrors] = useState<Record<string, string>>({});
  const [showAddLevelModal, setShowAddLevelModal] = useState<{ buildingId: number; levelType: 'below' | 'above'; editingLevelId?: number } | null>(null);
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelCode, setNewLevelCode] = useState('');
  const [newLevelAltura, setNewLevelAltura] = useState<string>('');
  const [newLevelFloor, setNewLevelFloor] = useState<number | null>(null);
  const [levelValidationErrors, setLevelValidationErrors] = useState<Record<string, string>>({});
  const [showEditHeightsModal, setShowEditHeightsModal] = useState<number | null>(null);
  const [editingHeights, setEditingHeights] = useState<Record<number, number | null>>({});
  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  const [showAddMultipleLevelsModal, setShowAddMultipleLevelsModal] = useState<{ buildingId: number; levelType: 'below' | 'above' | 'roof' } | null>(null);
  const [multipleLevelsCount, setMultipleLevelsCount] = useState<string>('1');
  const [groupMode, setGroupMode] = useState<'none' | 'new' | 'existing'>('none');
  const [selectedTemplateLevelId, setSelectedTemplateLevelId] = useState<number | null>(null);
  const [selectedFirstFloorId, setSelectedFirstFloorId] = useState<number | null>(null);
  const [availableFloorsList, setAvailableFloorsList] = useState<Array<{ id: number; name: string; code: string; order: number }>>([]);
  const [maxFloorsCount, setMaxFloorsCount] = useState<number>(50);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [codePrefix, setCodePrefix] = useState<string>('');
  const [namePrefix, setNamePrefix] = useState<string>('');

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
    setShowAddLevelModal({ 
      buildingId: level.building, 
      levelType: level.level_type === 'roof' ? 'above' : level.level_type as 'below' | 'above',
      editingLevelId: level.id 
    });
    setNewLevelName(level.name);
    setNewLevelCode(level.code);
    setNewLevelAltura(level.altura !== null && level.altura !== undefined ? level.altura.toString() : '');
    setNewLevelFloor(level.floor || null);
    setLevelValidationErrors({});
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

    const isEditing = !!showAddLevelModal.editingLevelId;
    const editingLevel = isEditing ? levels.find(l => l.id === showAddLevelModal.editingLevelId) : null;

    // Validar con Yup
    const levelsForValidation = levels.map(l => ({
      code: l.code,
      name: l.name,
      altura: l.altura ?? null,
      building: l.building,
      id: l.id,
    }));
    const validation = await validateLevelData(
      {
        code: newLevelCode,
        name: newLevelName,
        altura: newLevelAltura ? parseFloat(newLevelAltura) : null,
        level_type: showAddLevelModal.levelType,
        building: showAddLevelModal.buildingId,
        order: editingLevel?.order || 0,
        is_active: editingLevel?.is_active ?? true,
      },
      levelsForValidation,
      showAddLevelModal.buildingId,
      isEditing ? showAddLevelModal.editingLevelId : undefined
    );

    if (!validation.isValid) {
      setLevelValidationErrors(validation.errors);
      return;
    }

    setLevelValidationErrors({});
    try {
      const levelData = {
        building: showAddLevelModal.buildingId,
        name: newLevelName.trim(),
        code: newLevelCode.trim(),
        altura: newLevelAltura ? parseFloat(newLevelAltura) : null,
        level_type: showAddLevelModal.levelType,
        floor: newLevelFloor || null,
        order: editingLevel?.order || 0,
        is_active: editingLevel?.is_active ?? true,
      };

      if (isEditing && showAddLevelModal.editingLevelId) {
        await updateLevel.mutateAsync({
          id: showAddLevelModal.editingLevelId,
          data: levelData,
        });
      } else {
        await createLevel.mutateAsync(levelData);
      }
      
      setNewLevelName('');
      setNewLevelCode('');
      setNewLevelAltura('');
      setNewLevelFloor(null);
      setLevelValidationErrors({});
      setShowAddLevelModal(null);
    } catch (error: any) {
      console.error(`Error al ${isEditing ? 'actualizar' : 'crear'} nivel:`, error);
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
        backendErrors.general = `Error al ${isEditing ? 'actualizar' : 'crear'} nivel. Verifique que los campos no estén duplicados.`;
      }
      
      setLevelValidationErrors(backendErrors);
    }
  };

  const handleOpenAddLevelModal = async (buildingId: number, levelType: 'below' | 'above') => {
    setShowAddLevelModal({ buildingId, levelType });
    setNewLevelName('');
    setNewLevelCode('');
    setNewLevelAltura('');
    setNewLevelFloor(null);
    
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
          <span>{level.name}</span>
        </td>
        <td className={styles.numberCell}>{formatNumber(level.surface_util || 0)}</td>
        <td className={styles.numberCell}>{formatNumber(level.surface_comun || 0)}</td>
        <td className={styles.numberCell}>{formatNumber(level.surface_total || 0)}</td>
        <td>
          <div className={styles.rowActions}>
            <button
              className={styles.editButton}
              onClick={() => handleEditLevel(level)}
              title="Editar nivel"
            >
              <EditIcon fontSize="small" />
            </button>
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
          </div>
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

  // Funciones para agrupación de niveles
  const groupLevelsByTemplate = (levelList: ProjectLevel[]): Array<ProjectLevel | { template: ProjectLevel; levels: ProjectLevel[] }> => {
    const templateMap = new Map<number, ProjectLevel[]>();
    const individualLevels: ProjectLevel[] = [];
    const processedTemplateIds = new Set<number>();

    levelList.forEach(level => {
      // Si este nivel tiene un template_level, agregarlo al grupo correspondiente
      if (level.template_level) {
        const templateId = level.template_level;
        if (!templateMap.has(templateId)) {
          templateMap.set(templateId, []);
        }
        templateMap.get(templateId)!.push(level);
        processedTemplateIds.add(level.id);
      }
    });

    // Ahora identificar los templates y agregar niveles individuales
    levelList.forEach(level => {
      if (!processedTemplateIds.has(level.id)) {
        // Verificar si este nivel es template de otros
        const isTemplate = templateMap.has(level.id);
        if (!isTemplate) {
          individualLevels.push(level);
        }
      }
    });

    const result: Array<ProjectLevel | { template: ProjectLevel; levels: ProjectLevel[] }> = [];
    
    // Agregar niveles individuales
    individualLevels.forEach(level => result.push(level));
    
    // Agregar grupos
    templateMap.forEach((groupLevels, templateId) => {
      const template = levelList.find(l => l.id === templateId);
      if (template) {
        // Incluir el template en el grupo
        const allGroupLevels = [template, ...groupLevels].sort((a, b) => a.order - b.order);
        result.push({ template, levels: allGroupLevels });
      }
    });

    // Ordenar por order del primer elemento (template o nivel individual)
    return result.sort((a, b) => {
      const orderA = typeof a === 'object' && 'template' in a ? a.template.order : a.order;
      const orderB = typeof b === 'object' && 'template' in b ? b.template.order : b.order;
      return orderA - orderB;
    });
  };

  const getGroupMinOrder = (group: { template: ProjectLevel; levels: ProjectLevel[] }): number => {
    return Math.min(...group.levels.map(l => l.order));
  };

  const organizeLevelsByType = (buildingId: number, levelType: 'below' | 'above' | 'roof') => {
    const buildingLevels = levelsByBuilding[buildingId] || { below: [], above: [], roof: [] };
    const levelList = buildingLevels[levelType] || [];
    
    const grouped = groupLevelsByTemplate(levelList);
    const individual: ProjectLevel[] = [];
    const groups: Array<{ template: ProjectLevel; levels: ProjectLevel[] }> = [];

    grouped.forEach(item => {
      if (typeof item === 'object' && 'template' in item) {
        groups.push(item);
      } else {
        individual.push(item as ProjectLevel);
      }
    });

    // Combinar y ordenar: individuales primero, luego grupos
    const combined: Array<ProjectLevel | { template: ProjectLevel; levels: ProjectLevel[] }> = [];
    
    // Agregar niveles individuales
    individual.forEach(level => combined.push(level));
    
    // Agregar grupos ordenados por order mínimo
    groups.sort((a, b) => getGroupMinOrder(a) - getGroupMinOrder(b));
    groups.forEach(group => combined.push(group));

    // Ordenar todo por order
    return combined.sort((a, b) => {
      const orderA = typeof a === 'object' && 'template' in a ? getGroupMinOrder(a) : a.order;
      const orderB = typeof b === 'object' && 'template' in b ? getGroupMinOrder(b) : b.order;
      return orderA - orderB;
    });
  };

  const toggleGroupExpanded = (templateId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
    }
    setExpandedGroups(newExpanded);
  };

  const renderLevelGroup = (group: { template: ProjectLevel; levels: ProjectLevel[] }, buildingId: number) => {
    const isExpanded = expandedGroups.has(group.template.id);
    const sortedLevels = [...group.levels].sort((a, b) => a.order - b.order);
    const minLevel = sortedLevels[0];
    const maxLevel = sortedLevels[sortedLevels.length - 1];
    const groupTitle = `Grupo: ${minLevel.name} a ${maxLevel.name} (${group.levels.length} niveles)`;

    return (
      <React.Fragment key={`group-${group.template.id}`}>
        <tr className={styles.groupHeaderRow}>
          <td>
            <div className={styles.levelNameContainer}>
              <button
                className={styles.expandButton}
                onClick={() => toggleGroupExpanded(group.template.id)}
                title={isExpanded ? "Contraer grupo" : "Expandir grupo"}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
              <span className={styles.groupName}>{groupTitle}</span>
            </div>
          </td>
          <td className={styles.numberCell}>{formatNumber(group.template.surface_util || 0)}</td>
          <td className={styles.numberCell}>{formatNumber(group.template.surface_comun || 0)}</td>
          <td className={styles.numberCell}>{formatNumber(group.template.surface_total || 0)}</td>
          <td></td>
        </tr>
        {isExpanded && (
          <>
            {sortedLevels.map(level => (
              <tr key={level.id} className={styles.groupDetailsRow}>
                <td className={styles.groupDetailsCell}>
                  <div className={styles.levelDetailItem}>
                    <span className={styles.levelDetailName}>{level.name}</span>
                    <span className={styles.levelDetailCode}>({level.code})</span>
                  </div>
                </td>
                <td className={styles.numberCell}>{formatNumber(level.surface_util || 0)}</td>
                <td className={styles.numberCell}>{formatNumber(level.surface_comun || 0)}</td>
                <td className={styles.numberCell}>{formatNumber(level.surface_total || 0)}</td>
                <td>
                  {canDeleteLevel(level, buildingId) ? (
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
            ))}
          </>
        )}
      </React.Fragment>
    );
  };

  const handleAddMultipleLevels = async () => {
    if (!showAddMultipleLevelsModal) return;

    const count = parseInt(multipleLevelsCount);
    if (isNaN(count) || count < 1 || count > maxFloorsCount) {
      alert(`El número de niveles debe estar entre 1 y ${maxFloorsCount} (según pisos disponibles)`);
      return;
    }

    try {
      await createMultipleLevels.mutateAsync({
        building: showAddMultipleLevelsModal.buildingId,
        level_type: showAddMultipleLevelsModal.levelType,
        count,
        group_mode: groupMode,
        template_level_id: groupMode === 'existing' ? selectedTemplateLevelId || undefined : undefined,
        first_floor_id: selectedFirstFloorId || undefined,
        code_prefix: codePrefix || undefined,
        name_prefix: namePrefix || undefined,
      });
      
      setMultipleLevelsCount('1');
      setGroupMode('none');
      setSelectedTemplateLevelId(null);
      setSelectedFirstFloorId(null);
      setCodePrefix('');
      setNamePrefix('');
      setShowAddMultipleLevelsModal(null);
    } catch (error: any) {
      console.error('Error al crear múltiples niveles:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.detail || 
                          error?.response?.data?.message ||
                          'Error al crear múltiples niveles';
      alert(errorMessage);
    }
  };

  const handleOpenAddMultipleLevelsModal = async (buildingId: number, levelType: 'below' | 'above' | 'roof') => {
    setShowAddMultipleLevelsModal({ buildingId, levelType });
    setMultipleLevelsCount('1');
    setGroupMode('none');
    setSelectedTemplateLevelId(null);
    setSelectedFirstFloorId(null);
    setCodePrefix('');
    setNamePrefix('');
    
    // Cargar pisos disponibles
    try {
      const { floors, count } = await getAvailableFloors(buildingId, levelType);
      setAvailableFloorsList(floors);
      setMaxFloorsCount(count);
    } catch (error) {
      console.error('Error al cargar pisos disponibles:', error);
      setAvailableFloorsList([]);
      setMaxFloorsCount(0);
    }
  };

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
                    <span className={styles.subtitle}>S. Edificada por nivel</span>
                  </h5>
                  <div className={styles.levelTypeActions}>
                    <button
                      className={styles.addLevelButton}
                      onClick={() => handleOpenAddLevelModal(building.id, 'below')}
                    >
                      <AddIcon /> Agregar Nivel
                    </button>
                    <button
                      className={styles.addMultipleButton}
                      onClick={() => handleOpenAddMultipleLevelsModal(building.id, 'below')}
                      disabled={createMultipleLevels.isPending}
                    >
                      <AddIcon /> Agregar Múltiples Niveles
                    </button>
                  </div>
                </div>
                {buildingLevels.below.length === 0 ? (
                  <div className={styles.emptyMessage}>
                    No existen niveles asociados
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nivel</th>
                        <th>ÚTIL (m²)</th>
                        <th>COMÚN (m²)</th>
                        <th>TOTAL (m²)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizeLevelsByType(building.id, 'below').map(item => {
                        if (typeof item === 'object' && 'template' in item) {
                          return renderLevelGroup(item, building.id);
                        } else {
                          return renderLevelRow(item as ProjectLevel, building.id);
                        }
                      })}
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
                    <span className={styles.subtitle}>S. Edificada por nivel</span>
                  </h5>
                  <div className={styles.levelTypeActions}>
                    <button
                      className={styles.addLevelButton}
                      onClick={() => handleOpenAddLevelModal(building.id, 'above')}
                    >
                      <AddIcon /> Agregar Nivel
                    </button>
                    <button
                      className={styles.addMultipleButton}
                      onClick={() => handleOpenAddMultipleLevelsModal(building.id, 'above')}
                      disabled={createMultipleLevels.isPending}
                    >
                      <AddIcon /> Agregar Múltiples Niveles
                    </button>
                  </div>
                </div>
                {buildingLevels.above.length === 0 ? (
                  <div className={styles.emptyMessage}>
                    No existen niveles asociados
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nivel</th>
                        <th>ÚTIL (m²)</th>
                        <th>COMÚN (m²)</th>
                        <th>TOTAL (m²)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizeLevelsByType(building.id, 'above').map(item => {
                        if (typeof item === 'object' && 'template' in item) {
                          return renderLevelGroup(item, building.id);
                        } else {
                          return renderLevelRow(item as ProjectLevel, building.id);
                        }
                      })}
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

      {/* Modal para agregar/editar nivel */}
      {showAddLevelModal && (() => {
        const isEditing = !!showAddLevelModal.editingLevelId;
        const availableFloors = floors.filter(floor => {
          // Filtrar pisos según el tipo de nivel
          if (showAddLevelModal.levelType === 'below') {
            return floor.floor_type === 'below';
          } else {
            return floor.floor_type === 'above';
          }
        });

        return (
          <div className={styles.modalOverlay} onClick={() => {
            setShowAddLevelModal(null);
            setNewLevelName('');
            setNewLevelCode('');
            setNewLevelAltura('');
            setNewLevelFloor(null);
            setLevelValidationErrors({});
          }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>
                  {isEditing ? 'Editar' : 'Agregar'} Nivel {showAddLevelModal.levelType === 'below' ? 'Subterráneo' : 'Sobre Terreno'}
                </h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => {
                    setShowAddLevelModal(null);
                    setNewLevelName('');
                    setNewLevelCode('');
                    setNewLevelAltura('');
                    setNewLevelFloor(null);
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
                    disabled={isEditing}
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
                    Piso Consolidado
                    <HelpTooltip
                      modelName="ProjectLevel"
                      fieldName="floor"
                      helpTextData={getHelpText('ProjectLevel', 'floor')}
                      defaultBriefText="Piso consolidado al que tributa este nivel"
                      defaultExtendedText="Si se especifica un piso consolidado, los datos de este nivel se consolidarán en el Floor seleccionado."
                      position="right"
                    />
                  </label>
                  <select
                    value={newLevelFloor || ''}
                    onChange={(e) => {
                      setNewLevelFloor(e.target.value ? parseInt(e.target.value) : null);
                      clearLevelFieldError('floor');
                    }}
                    className={levelValidationErrors.floor ? styles.inputError : styles.formInput}
                  >
                    <option value="">Sin piso consolidado</option>
                    {availableFloors.map(floor => (
                      <option key={floor.id} value={floor.id}>
                        {floor.name} ({floor.code})
                      </option>
                    ))}
                  </select>
                  {levelValidationErrors.floor && (
                    <small className={styles.errorText}>{levelValidationErrors.floor}</small>
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
                    setNewLevelFloor(null);
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
                  {isEditing ? 'Guardar Cambios' : 'Crear Nivel'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal para agregar múltiples niveles */}
      {showAddMultipleLevelsModal && (() => {
        const building = buildings.find(b => b.id === showAddMultipleLevelsModal.buildingId);
        const buildingLevels = levelsByBuilding[showAddMultipleLevelsModal.buildingId] || { below: [], above: [], roof: [] };
        const availableLevels = buildingLevels[showAddMultipleLevelsModal.levelType] || [];
        
        return (
          <div className={styles.modalOverlay} onClick={() => {
            setShowAddMultipleLevelsModal(null);
            setMultipleLevelsCount('1');
            setGroupMode('none');
            setSelectedTemplateLevelId(null);
            setSelectedFirstFloorId(null);
            setCodePrefix('');
            setNamePrefix('');
          }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>
                  Agregar Múltiples Niveles {showAddMultipleLevelsModal.levelType === 'below' ? 'Subterráneos' : showAddMultipleLevelsModal.levelType === 'above' ? 'Sobre Terreno' : 'Cubierta'}
                </h3>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowAddMultipleLevelsModal(null);
                    setMultipleLevelsCount('1');
                    setGroupMode('none');
                    setSelectedTemplateLevelId(null);
                    setSelectedFirstFloorId(null);
                    setCodePrefix('');
                    setNamePrefix('');
                  }}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.formGroup}>
                  <label htmlFor="levelsCount">
                    Número de Niveles
                    {maxFloorsCount > 0 && (
                      <span className={styles.helpText} style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                        (Máximo: {maxFloorsCount} pisos disponibles)
                      </span>
                    )}
                  </label>
                  <input
                    id="levelsCount"
                    type="text"
                    value={multipleLevelsCount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setMultipleLevelsCount(value);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value === '') {
                        setMultipleLevelsCount('1');
                      } else {
                        const num = parseInt(value, 10);
                        if (isNaN(num) || num < 1) {
                          setMultipleLevelsCount('1');
                        } else if (num > maxFloorsCount) {
                          setMultipleLevelsCount(maxFloorsCount.toString());
                          alert(`El número máximo de niveles es ${maxFloorsCount} (según pisos disponibles)`);
                        } else {
                          setMultipleLevelsCount(num.toString());
                        }
                      }
                    }}
                    className={styles.formInput}
                    placeholder={`1-${maxFloorsCount}`}
                    max={maxFloorsCount}
                  />
                  {maxFloorsCount === 0 && (
                    <small className={styles.errorText} style={{ display: 'block', marginTop: '0.25rem' }}>
                      No hay pisos disponibles para este tipo de nivel. Debe crear pisos primero.
                    </small>
                  )}
                </div>

                {availableFloorsList.length > 0 && (
                  <div className={styles.formGroup}>
                    <label htmlFor="firstFloor">Primer Piso a Asociar</label>
                    <select
                      id="firstFloor"
                      value={selectedFirstFloorId || ''}
                      onChange={(e) => setSelectedFirstFloorId(e.target.value ? parseInt(e.target.value) : null)}
                      className={styles.formInput}
                    >
                      <option value="">Seleccionar automáticamente desde el primer piso disponible</option>
                      {availableFloorsList.map(floor => (
                        <option key={floor.id} value={floor.id}>
                          {floor.name} ({floor.code}) - Orden: {floor.order}
                        </option>
                      ))}
                    </select>
                    <small className={styles.helpText} style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.875rem', color: '#666' }}>
                      Los niveles se asociarán automáticamente con los pisos siguientes en orden secuencial.
                    </small>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="codePrefix">
                    Prefijo de Código (Opcional)
                    <HelpTooltip
                      modelName="ProjectLevel"
                      fieldName="code"
                      helpTextData={getHelpText('ProjectLevel', 'code')}
                      defaultBriefText="Prefijo para el código del nivel"
                      defaultExtendedText="Si se especifica, los códigos se generarán como: {prefijo}6, {prefijo}7, {prefijo}8, etc. Si se deja vacío, se detectará automáticamente según los códigos existentes."
                      position="right"
                    />
                  </label>
                  <input
                    id="codePrefix"
                    type="text"
                    value={codePrefix}
                    onChange={(e) => setCodePrefix(e.target.value)}
                    placeholder="ej: P, SS, Nivel"
                    className={styles.formInput}
                  />
                  <small className={styles.helpText} style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.875rem', color: '#666' }}>
                    Si se deja vacío, se detectará automáticamente según los códigos existentes.
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="namePrefix">
                    Prefijo de Nombre (Opcional)
                    <HelpTooltip
                      modelName="ProjectLevel"
                      fieldName="name"
                      helpTextData={getHelpText('ProjectLevel', 'name')}
                      defaultBriefText="Prefijo para el nombre del nivel"
                      defaultExtendedText="Si se especifica, los nombres se generarán como: {prefijo} 6, {prefijo} 7, {prefijo} 8, etc. Si se deja vacío, se generará automáticamente según el tipo de nivel."
                      position="right"
                    />
                  </label>
                  <input
                    id="namePrefix"
                    type="text"
                    value={namePrefix}
                    onChange={(e) => setNamePrefix(e.target.value)}
                    placeholder="ej: Nivel, Subterráneo, Piso"
                    className={styles.formInput}
                  />
                  <small className={styles.helpText} style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.875rem', color: '#666' }}>
                    Si se deja vacío, se generará automáticamente según el tipo de nivel.
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label>Opciones de agrupación</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="groupMode"
                        value="none"
                        checked={groupMode === 'none'}
                        onChange={(e) => {
                          setGroupMode('none');
                          setSelectedTemplateLevelId(null);
                        }}
                      />
                      <span>Sin agrupar</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="groupMode"
                        value="new"
                        checked={groupMode === 'new'}
                        onChange={(e) => {
                          setGroupMode('new');
                          setSelectedTemplateLevelId(null);
                        }}
                      />
                      <span>Agrupar los nuevos niveles juntos</span>
                    </label>
                    {availableLevels.length > 0 && (
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="groupMode"
                          value="existing"
                          checked={groupMode === 'existing'}
                          onChange={(e) => {
                            setGroupMode('existing');
                          }}
                        />
                        <span>Agrupar con nivel existente</span>
                      </label>
                    )}
                  </div>
                </div>

                {groupMode === 'existing' && availableLevels.length > 0 && (
                  <div className={styles.formGroup}>
                    <label htmlFor="templateLevel">Nivel Plantilla</label>
                    <select
                      id="templateLevel"
                      value={selectedTemplateLevelId || ''}
                      onChange={(e) => setSelectedTemplateLevelId(parseInt(e.target.value) || null)}
                      className={styles.formInput}
                    >
                      <option value="">Seleccione un nivel...</option>
                      {availableLevels.map(level => (
                        <option key={level.id} value={level.id}>
                          {level.name} ({level.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowAddMultipleLevelsModal(null);
                      setMultipleLevelsCount('1');
                      setGroupMode('none');
                      setSelectedTemplateLevelId(null);
                      setSelectedFirstFloorId(null);
                      setCodePrefix('');
                      setNamePrefix('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleAddMultipleLevels}
                    disabled={
                      createMultipleLevels.isPending || 
                      !multipleLevelsCount || 
                      parseInt(multipleLevelsCount) < 1 || 
                      parseInt(multipleLevelsCount) > maxFloorsCount ||
                      (groupMode === 'existing' && !selectedTemplateLevelId)
                    }
                  >
                    {createMultipleLevels.isPending ? 'Creando...' : 'Crear Niveles'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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

