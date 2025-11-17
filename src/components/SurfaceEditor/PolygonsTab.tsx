// src/components/SurfaceEditor/PolygonsTab.tsx

import React, { useState, useEffect } from 'react';
import { useBuildings, useProjectLevels, Building, ProjectLevel } from '../../hooks/useProjectLevels';
import { useSurfacePolygons, SurfacePolygon } from '../../hooks/useSurfacePolygons';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import styles from './PolygonsTab.module.scss';

interface PolygonsTabProps {
  projectNodeId: number;
}

const PolygonsTab: React.FC<PolygonsTabProps> = ({ projectNodeId }) => {
  const { accessToken } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  
  const { buildings, isLoadingBuildings } = useBuildings(projectNodeId);
  const { levels, isLoadingLevels, updateLevel } = useProjectLevels({
    project_node: projectNodeId,
  });
  const { polygons, isLoadingPolygons, createPolygon, updatePolygon, deletePolygon } = useSurfacePolygons({
    project_node: projectNodeId,
  });

  // Estado para controlar qué niveles están expandidos (por defecto todos abiertos)
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());
  const [showAddPolygonModal, setShowAddPolygonModal] = useState<{ levelId: number } | null>(null);
  const [editingPolygon, setEditingPolygon] = useState<SurfacePolygon | null>(null);
  const [newPolygonName, setNewPolygonName] = useState('');
  const [newPolygonWidth, setNewPolygonWidth] = useState('');
  const [newPolygonLength, setNewPolygonLength] = useState('');
  const [newPolygonCountAsHalf, setNewPolygonCountAsHalf] = useState(false);
  const [newPolygonManualTotal, setNewPolygonManualTotal] = useState('');

  // Agrupar polígonos por nivel
  const polygonsByLevel = polygons.reduce((acc, polygon) => {
    const levelId = polygon.level || 0; // 0 para polígonos sin nivel
    if (!acc[levelId]) {
      acc[levelId] = [];
    }
    acc[levelId].push(polygon);
    return acc;
  }, {} as Record<number, SurfacePolygon[]>);

  // Calcular totales en tiempo real por nivel (suma de polígonos)
  const calculateLevelTotal = (levelId: number): number => {
    const levelPolygons = polygonsByLevel[levelId] || [];
    return levelPolygons.reduce((sum, polygon) => sum + (polygon.total || 0), 0);
  };

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

  const toggleLevel = (levelId: number) => {
    setExpandedLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(levelId)) {
        newSet.delete(levelId);
      } else {
        newSet.add(levelId);
      }
      return newSet;
    });
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(Number(num))) return '-';
    return Number(num).toFixed(2);
  };

  const recalculateLevelFromPolygons = async (levelId: number) => {
    try {
      await axios.post(
        `${API_URL}/api/project-engines/levels/${levelId}/recalculate_from_polygons/`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      // Invalidar queries para refrescar niveles
      // Esto se hará automáticamente cuando se actualicen los polígonos
    } catch (error) {
      console.error('Error al recalcular superficies:', error);
    }
  };

  // Inicializar todos los niveles como expandidos
  useEffect(() => {
    if (levels.length > 0 && expandedLevels.size === 0) {
      setExpandedLevels(new Set(levels.map(level => level.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels]);

  // Recalcular automáticamente cuando cambian los polígonos
  useEffect(() => {
    if (polygons.length > 0 && levels.length > 0) {
      // Recalcular todos los niveles que tienen polígonos
      const levelsWithPolygons = new Set(polygons.map(p => p.level).filter(Boolean));
      levelsWithPolygons.forEach(levelId => {
        recalculateLevelFromPolygons(levelId as number);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygons.length]);

  const handleAddPolygon = async () => {
    if (!showAddPolygonModal) return;
    if (!newPolygonName.trim()) {
      alert('Debe ingresar un nombre para el polígono');
      return;
    }

    // Validar que tenga manual_total o (width y length)
    if (!newPolygonManualTotal && (!newPolygonWidth || !newPolygonLength)) {
      alert('Debe ingresar ancho y largo, o un total manual');
      return;
    }

    try {
      await createPolygon.mutateAsync({
        project_node: projectNodeId,
        level: showAddPolygonModal.levelId,
        name: newPolygonName,
        width: newPolygonWidth ? parseFloat(newPolygonWidth) : null,
        length: newPolygonLength ? parseFloat(newPolygonLength) : null,
        count_as_half: newPolygonCountAsHalf,
        manual_total: newPolygonManualTotal ? parseFloat(newPolygonManualTotal) : null,
      });
      setNewPolygonName('');
      setNewPolygonWidth('');
      setNewPolygonLength('');
      setNewPolygonCountAsHalf(false);
      setNewPolygonManualTotal('');
      setShowAddPolygonModal(null);
      
      // Recalcular superficies del nivel automáticamente
      if (showAddPolygonModal) {
        await recalculateLevelFromPolygons(showAddPolygonModal.levelId);
      }
    } catch (error) {
      console.error('Error al crear polígono:', error);
      alert('Error al crear polígono');
    }
  };

  const handleEditPolygon = (polygon: SurfacePolygon) => {
    setEditingPolygon(polygon);
    setNewPolygonName(polygon.name);
    setNewPolygonWidth(polygon.width?.toString() || '');
    setNewPolygonLength(polygon.length?.toString() || '');
    setNewPolygonCountAsHalf(polygon.count_as_half || false);
    setNewPolygonManualTotal(polygon.manual_total?.toString() || '');
  };

  const handleUpdatePolygon = async () => {
    if (!editingPolygon) return;
    if (!newPolygonName.trim()) {
      alert('Debe ingresar un nombre para el polígono');
      return;
    }

    // Validar que tenga manual_total o (width y length)
    if (!newPolygonManualTotal && (!newPolygonWidth || !newPolygonLength)) {
      alert('Debe ingresar ancho y largo, o un total manual');
      return;
    }

    try {
      const levelId = editingPolygon.level;
      await updatePolygon.mutateAsync({
        id: editingPolygon.id,
        data: {
          name: newPolygonName,
          width: newPolygonWidth ? parseFloat(newPolygonWidth) : null,
          length: newPolygonLength ? parseFloat(newPolygonLength) : null,
          count_as_half: newPolygonCountAsHalf,
          manual_total: newPolygonManualTotal ? parseFloat(newPolygonManualTotal) : null,
        },
      });
      setNewPolygonName('');
      setNewPolygonWidth('');
      setNewPolygonLength('');
      setNewPolygonCountAsHalf(false);
      setNewPolygonManualTotal('');
      setEditingPolygon(null);
      
      // Recalcular superficies del nivel automáticamente
      if (levelId) {
        await recalculateLevelFromPolygons(levelId);
      }
    } catch (error) {
      console.error('Error al actualizar polígono:', error);
      alert('Error al actualizar polígono');
    }
  };

  const renderPolygonRow = (polygon: SurfacePolygon) => (
    <tr key={polygon.id}>
      <td>{polygon.name}</td>
      <td className={styles.numberCell}>{formatNumber(polygon.width)}</td>
      <td className={styles.numberCell}>{formatNumber(polygon.length)}</td>
      <td className={styles.centerCell}>
        <input
          type="checkbox"
          checked={polygon.count_as_half}
          onChange={async (e) => {
            const levelId = polygon.level;
            await updatePolygon.mutateAsync({
              id: polygon.id,
              data: { count_as_half: e.target.checked },
            });
            // Recalcular superficies del nivel después de actualizar
            if (levelId) {
              await recalculateLevelFromPolygons(levelId);
            }
          }}
        />
      </td>
      <td className={styles.numberCell}>{formatNumber(polygon.manual_total)}</td>
      <td className={styles.numberCell}>{formatNumber(polygon.total)}</td>
      <td>
        <div className={styles.actionButtons}>
          <button
            className={styles.editButton}
            onClick={() => handleEditPolygon(polygon)}
            title="Editar polígono"
          >
            <EditIcon fontSize="small" />
          </button>
          <button
            className={styles.deleteButton}
            onClick={async () => {
              if (confirm(`¿Está seguro de eliminar el polígono "${polygon.name}"?`)) {
                const levelId = polygon.level;
                await deletePolygon.mutateAsync(polygon.id);
                // Recalcular superficies del nivel después de eliminar
                if (levelId) {
                  await recalculateLevelFromPolygons(levelId);
                }
              }
            }}
            title="Eliminar polígono"
          >
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderLevelSection = (level: ProjectLevel) => {
    const levelPolygons = polygonsByLevel[level.id] || [];
    const isExpanded = expandedLevels.has(level.id);
    const calculatedTotal = calculateLevelTotal(level.id);

    return (
      <div key={level.id} className={styles.levelAccordion}>
        <div 
          className={styles.levelAccordionHeader}
          onClick={() => toggleLevel(level.id)}
        >
          <div className={styles.levelAccordionTitle}>
            <button className={styles.expandButton}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </button>
            <span className={styles.levelName}>{level.name}</span>
            <span className={styles.levelTotals}>
              Total: {formatNumber(calculatedTotal)} m²
            </span>
          </div>
          <button
            className={styles.addPolygonButton}
            onClick={(e) => {
              e.stopPropagation();
              setShowAddPolygonModal({ levelId: level.id });
            }}
          >
            <AddIcon /> Agregar Polígono
          </button>
        </div>
        {isExpanded && (
          <div className={styles.levelAccordionContent}>
            {levelPolygons.length === 0 ? (
              <div className={styles.emptyMessage}>
                No existen polígonos asociados
              </div>
            ) : (
              <>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Ancho (m)</th>
                      <th>Largo (m)</th>
                      <th>Media Superficie</th>
                      <th>Total Manual (m²)</th>
                      <th>Total (m²)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {levelPolygons.map(renderPolygonRow)}
                    <tr className={styles.totalRow}>
                      <td className={styles.totalLabel} colSpan={5}>
                        <strong>TOTAL DEL NIVEL</strong>
                      </td>
                      <td className={`${styles.numberCell} ${styles.totalCell}`}>
                        {formatNumber(calculatedTotal)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoadingBuildings || isLoadingLevels || isLoadingPolygons) {
    return <div className={styles.loading}>Cargando polígonos...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Gestión de Polígonos de Superficie</h3>
      </div>

      {buildings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay edificios registrados. Crea edificios y niveles primero.</p>
        </div>
      ) : (
        buildings.map((building) => {
          const buildingLevels = levelsByBuilding[building.id] || { below: [], above: [], roof: [] };

          return (
            <div key={building.id} className={styles.buildingSection}>
              <div className={styles.buildingHeader}>
                <h4>{building.name}</h4>
              </div>

              {/* Sección: Superficies Subterráneas */}
              {buildingLevels.below.length > 0 && (
                <div className={styles.levelTypeSection}>
                  <h5>
                    S. EDIFICADA SUBTERRÁNEO (S)
                    <span className={styles.subtitle}>S. Edificada por nivel o piso</span>
                  </h5>
                  {buildingLevels.below.map(renderLevelSection)}
                </div>
              )}

              {/* Sección: Superficies Sobre Terreno */}
              {buildingLevels.above.length > 0 && (
                <div className={styles.levelTypeSection}>
                  <h5>
                    S. EDIFICADA SOBRE TERRENO
                    <span className={styles.subtitle}>S. Edificada por nivel o piso</span>
                  </h5>
                  {buildingLevels.above.map(renderLevelSection)}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Modal para agregar polígono */}
      {showAddPolygonModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddPolygonModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Agregar Polígono</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAddPolygonModal(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Nombre del Polígono *</label>
                <input
                  type="text"
                  value={newPolygonName}
                  onChange={(e) => setNewPolygonName(e.target.value)}
                  placeholder="ej: Sala principal"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Total Manual (m²)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPolygonManualTotal}
                  onChange={(e) => setNewPolygonManualTotal(e.target.value)}
                  placeholder="Si se ingresa, se ignora ancho y largo"
                />
                <small className={styles.helpText}>
                  Si ingresa un total manual, se ignorarán ancho y largo
                </small>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Ancho (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPolygonWidth}
                    onChange={(e) => setNewPolygonWidth(e.target.value)}
                    placeholder="Ancho"
                    disabled={!!newPolygonManualTotal}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Largo (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPolygonLength}
                    onChange={(e) => setNewPolygonLength(e.target.value)}
                    placeholder="Largo"
                    disabled={!!newPolygonManualTotal}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={newPolygonCountAsHalf}
                    onChange={(e) => setNewPolygonCountAsHalf(e.target.checked)}
                    disabled={!!newPolygonManualTotal}
                  />
                  Media Superficie (dividir por 2)
                </label>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowAddPolygonModal(null)}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleAddPolygon}
                disabled={!newPolygonName.trim() || (!newPolygonManualTotal && (!newPolygonWidth || !newPolygonLength))}
              >
                Crear Polígono
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar polígono */}
      {editingPolygon && (
        <div className={styles.modalOverlay} onClick={() => setEditingPolygon(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Editar Polígono</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setEditingPolygon(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Nombre del Polígono *</label>
                <input
                  type="text"
                  value={newPolygonName}
                  onChange={(e) => setNewPolygonName(e.target.value)}
                  placeholder="ej: Sala principal"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Total Manual (m²)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPolygonManualTotal}
                  onChange={(e) => setNewPolygonManualTotal(e.target.value)}
                  placeholder="Si se ingresa, se ignora ancho y largo"
                />
                <small className={styles.helpText}>
                  Si ingresa un total manual, se ignorarán ancho y largo
                </small>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Ancho (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPolygonWidth}
                    onChange={(e) => setNewPolygonWidth(e.target.value)}
                    placeholder="Ancho"
                    disabled={!!newPolygonManualTotal}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Largo (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPolygonLength}
                    onChange={(e) => setNewPolygonLength(e.target.value)}
                    placeholder="Largo"
                    disabled={!!newPolygonManualTotal}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={newPolygonCountAsHalf}
                    onChange={(e) => setNewPolygonCountAsHalf(e.target.checked)}
                    disabled={!!newPolygonManualTotal}
                  />
                  Media Superficie (dividir por 2)
                </label>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setEditingPolygon(null)}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleUpdatePolygon}
                disabled={!newPolygonName.trim() || (!newPolygonManualTotal && (!newPolygonWidth || !newPolygonLength))}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolygonsTab;

