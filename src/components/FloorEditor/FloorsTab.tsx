// src/components/FloorEditor/FloorsTab.tsx

import React, { useState } from 'react';
import { useFloors, Floor } from '../../hooks/useFloors';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import styles from './FloorsTab.module.scss';

interface FloorsTabProps {
  projectNodeId: number;
}

const FloorsTab: React.FC<FloorsTabProps> = ({ projectNodeId }) => {
  const { floors, isLoadingFloors, createFloor, updateFloor, deleteFloor, updateConsolidatedValues, suggestNextName, createMultipleFloors } = useFloors({
    project_node: projectNodeId,
  });


  const [showAddMultipleModal, setShowAddMultipleModal] = useState<{ floorType: 'below' | 'above' } | null>(null);
  const [multipleFloorsCount, setMultipleFloorsCount] = useState<string>('1');
  const [floorValidationErrors, setFloorValidationErrors] = useState<Record<string, string>>({});
  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set());

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };


  const handleDeleteFloor = async (floorId: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este piso consolidado?')) {
      return;
    }

    try {
      await deleteFloor.mutateAsync(floorId);
    } catch (error: any) {
      const errorMessage = error?.message || 
                         error?.response?.data?.error || 
                         'No se pudo eliminar el piso';
      alert(errorMessage);
    }
  };

  const handleAddFloor = async (floorType: 'below' | 'above', direction: 'up' | 'down' = 'up') => {
    setFloorValidationErrors({});

    try {
      // El backend genera automáticamente el código y nombre
      await createFloor.mutateAsync({
        project_node: projectNodeId,
        floor_type: floorType,
        // No enviar name ni code, el backend los genera
      });
      setFloorValidationErrors({});
    } catch (error: any) {
      console.error('Error al crear piso:', error);
      const errors: Record<string, string> = {};
      
      if (error?.response?.data?.error) {
        errors.general = error.response.data.error;
      }
      
      if (Object.keys(errors).length === 0) {
        errors.general = 'Error al crear piso';
      }
      
      setFloorValidationErrors(errors);
      alert(errors.general);
    }
  };

  const handleAddMultipleFloors = async () => {
    setFloorValidationErrors({});

    // Validar que sea un número entero válido
    const count = parseInt(multipleFloorsCount, 10);
    
    if (isNaN(count) || !Number.isInteger(count)) {
      setFloorValidationErrors({ count: 'Debe ingresar un número entero válido' });
      return;
    }

    if (count < 1 || count > 50) {
      setFloorValidationErrors({ count: 'El número de pisos debe estar entre 1 y 50' });
      return;
    }

    try {
      if (!showAddMultipleModal) return;
      
      await createMultipleFloors.mutateAsync({
        project_node: projectNodeId,
        floor_type: showAddMultipleModal.floorType,
        count: count,
      });
      setShowAddMultipleModal(null);
      setMultipleFloorsCount('1');
      setFloorValidationErrors({});
    } catch (error: any) {
      console.error('Error al crear múltiples pisos:', error);
      const errors: Record<string, string> = {};
      
      if (error?.response?.data?.error) {
        errors.general = error.response.data.error;
      }
      
      if (Object.keys(errors).length === 0) {
        errors.general = 'Error al crear pisos';
      }
      
      setFloorValidationErrors(errors);
    }
  };

  const handleUpdateConsolidatedValues = async (floorId: number) => {
    try {
      await updateConsolidatedValues.mutateAsync(floorId);
    } catch (error) {
      console.error('Error al actualizar valores consolidados:', error);
      alert('Error al actualizar valores consolidados');
    }
  };

  if (isLoadingFloors) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando pisos...</div>
      </div>
    );
  }

  // Agrupar pisos por tipo y ordenar
  // Subterráneos: ordenar de mayor a menor (más profundo primero) - order descendente
  // Sobre terreno: ordenar de menor a mayor (order ascendente)
  const floorsByType = {
    below: floors.filter(f => f.floor_type === 'below').sort((a, b) => b.order - a.order),
    above: floors.filter(f => f.floor_type === 'above').sort((a, b) => a.order - b.order),
  };

  // Calcular totales por tipo
  const calculateTotals = (floorList: Floor[]) => {
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

  const toggleFloorExpanded = (floorId: number) => {
    const newExpanded = new Set(expandedFloors);
    if (newExpanded.has(floorId)) {
      newExpanded.delete(floorId);
    } else {
      newExpanded.add(floorId);
    }
    setExpandedFloors(newExpanded);
  };

  const isLastFloor = (floor: Floor, floorList: Floor[], floorType: 'below' | 'above') => {
    const sorted = floorType === 'below'
      ? [...floorList].sort((a, b) => b.order - a.order)
      : [...floorList].sort((a, b) => a.order - b.order);
    
    const lastFloor = floorType === 'below' ? sorted[0] : sorted[sorted.length - 1];
    return floor.id === lastFloor?.id;
  };

  const renderFloorDetails = (floor: Floor) => {
    if (!expandedFloors.has(floor.id) || !floor.levels_detail || floor.levels_detail.length === 0) {
      return null;
    }

    return (
      <tr className={styles.detailRow}>
        <td colSpan={5} className={styles.detailCell}>
          <div className={styles.detailContent}>
            <div className={styles.detailHeader}>Niveles asociados:</div>
            <div className={styles.levelsList}>
              {floor.levels_detail.map(level => (
                <div key={level.id} className={styles.levelItem}>
                  <span className={styles.levelBuilding}>{level.building_name}</span>
                  <span className={styles.levelSeparator}> - </span>
                  <span className={styles.levelName}>{level.name}</span>
                  <span className={styles.levelCode}>({level.code})</span>
                </div>
              ))}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const renderFloorRow = (floor: Floor, floorList: Floor[], index: number, floorType: 'below' | 'above') => {
    const isExpanded = expandedFloors.has(floor.id);
    const isLastFloor = floorType === 'below' 
      ? index === 0  // Subterráneos: el primero (mayor order, más profundo)
      : index === floorList.length - 1;  // Sobre terreno: el último (mayor order)
    
    return (
      <React.Fragment key={floor.id}>
        <tr>
          <td>
            <div className={styles.floorNameCell}>
              <button
                className={styles.expandButton}
                onClick={() => toggleFloorExpanded(floor.id)}
                title={isExpanded ? "Contraer detalles" : "Expandir detalles"}
              >
                {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
              </button>
              <span>{floor.name}</span>
            </div>
          </td>
          <td className={styles.numberCell}>{formatNumber(floor.surface_util || 0)}</td>
          <td className={styles.numberCell}>{formatNumber(floor.surface_comun || 0)}</td>
          <td className={styles.numberCell}>{formatNumber(floor.surface_total || 0)}</td>
          <td>
            <div className={styles.rowActions}>
              <button
                className={styles.refreshButton}
                onClick={() => handleUpdateConsolidatedValues(floor.id)}
                title="Actualizar valores consolidados"
                disabled={updateConsolidatedValues.isPending}
              >
                <RefreshIcon fontSize="small" />
              </button>
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteFloor(floor.id);
                }}
                title={isLastFloor ? "Eliminar piso" : "Solo se puede eliminar el último piso"}
                disabled={deleteFloor.isPending || !isLastFloor}
                style={{ opacity: isLastFloor ? 1 : 0.5, cursor: isLastFloor ? 'pointer' : 'not-allowed' }}
              >
                <DeleteIcon fontSize="small" />
              </button>
            </div>
          </td>
        </tr>
        {renderFloorDetails(floor)}
      </React.Fragment>
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Pisos Consolidados</h3>
      </div>

      {/* Sección: Pisos Subterráneos */}
      <div className={styles.floorTypeSection}>
        <div className={styles.floorTypeHeader}>
          <h5>
            S. EDIFICADA SUBTERRÁNEO (S)
            <span className={styles.subtitle}>S. Edificada por nivel</span>
          </h5>
          <div className={styles.floorTypeActions}>
            <button
              className={styles.addFloorButton}
              onClick={() => handleAddFloor('below', 'down')}
              disabled={createFloor.isPending}
            >
              <AddIcon /> Agregar Piso
            </button>
            <button
              className={styles.addMultipleButton}
              onClick={() => setShowAddMultipleModal({ floorType: 'below' })}
              disabled={createMultipleFloors.isPending}
            >
              <AddIcon /> Agregar Múltiples Pisos
            </button>
          </div>
        </div>
        {floorsByType.below.length === 0 ? (
          <div className={styles.emptyMessage}>
            No existen niveles asociados
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Piso</th>
                <th>ÚTIL (m²)</th>
                <th>COMÚN (m²)</th>
                <th>TOTAL (m²)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {floorsByType.below.map((floor, index) => 
                renderFloorRow(floor, floorsByType.below, index, 'below')
              )}
              {renderTotalRow(subterraneoTotals, 'TOTAL SUBTERRÁNEO')}
            </tbody>
          </table>
        )}
      </div>

      {/* Sección: Pisos Sobre Terreno */}
      <div className={styles.floorTypeSection}>
        <div className={styles.floorTypeHeader}>
          <h5>
            S. EDIFICADA SOBRE TERRENO
            <span className={styles.subtitle}>S. Edificada por nivel</span>
          </h5>
          <div className={styles.floorTypeActions}>
            <button
              className={styles.addFloorButton}
              onClick={() => handleAddFloor('above', 'up')}
              disabled={createFloor.isPending}
            >
              <AddIcon /> Agregar Piso
            </button>
            <button
              className={styles.addMultipleButton}
              onClick={() => setShowAddMultipleModal({ floorType: 'above' })}
              disabled={createMultipleFloors.isPending}
            >
              <AddIcon /> Agregar Múltiples Pisos
            </button>
          </div>
        </div>
        {floorsByType.above.length === 0 ? (
          <div className={styles.emptyMessage}>
            No existen niveles asociados
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Piso</th>
                <th>ÚTIL (m²)</th>
                <th>COMÚN (m²)</th>
                <th>TOTAL (m²)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {floorsByType.above.map((floor, index) => 
                renderFloorRow(floor, floorsByType.above, index, 'above')
              )}
              {renderTotalRow(sobreTerrenoTotals, 'TOTAL SOBRE TERRENO')}
            </tbody>
          </table>
        )}
      </div>

      {/* Totales Generales */}
      {(floorsByType.below.length > 0 || floorsByType.above.length > 0) && (
        <div className={styles.totalSection}>
          <h5>TOTALES GENERALES</h5>
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
              {renderTotalRow(totalGeneral, 'TOTAL GENERAL')}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para agregar múltiples pisos */}
      {showAddMultipleModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddMultipleModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Agregar Múltiples Pisos {showAddMultipleModal.floorType === 'below' ? 'Subterráneos' : 'Sobre Terreno'}</h3>
              <button
                className={styles.modalCloseButton}
                onClick={() => {
                  setShowAddMultipleModal(null);
                  setMultipleFloorsCount('1');
                  setFloorValidationErrors({});
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>

              <div className={styles.formGroup}>
                <label htmlFor="floorsCount">Número de Pisos</label>
                <input
                  id="floorsCount"
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={multipleFloorsCount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir valores vacíos temporalmente para poder editar
                    if (value === '' || /^\d+$/.test(value)) {
                      setMultipleFloorsCount(value);
                      // Limpiar error si el usuario está escribiendo
                      if (floorValidationErrors.count) {
                        setFloorValidationErrors({ ...floorValidationErrors, count: '' });
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Validar al perder el foco
                    const value = e.target.value.trim();
                    if (value === '') {
                      setMultipleFloorsCount('1');
                    } else {
                      const num = parseInt(value, 10);
                      if (isNaN(num) || num < 1) {
                        setMultipleFloorsCount('1');
                      } else if (num > 50) {
                        setMultipleFloorsCount('50');
                      } else {
                        setMultipleFloorsCount(num.toString());
                      }
                    }
                  }}
                  className={`${styles.formInput} ${
                    floorValidationErrors.count ? styles.inputError : ''
                  }`}
                />
                {floorValidationErrors.count && (
                  <span className={styles.errorMessage}>{floorValidationErrors.count}</span>
                )}
              </div>

              {floorValidationErrors.general && (
                <div className={styles.errorMessage}>{floorValidationErrors.general}</div>
              )}

              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowAddMultipleModal(null);
                    setMultipleFloorsCount('1');
                    setFloorValidationErrors({});
                  }}
                >
                  Cancelar
                </button>
                <button
                  className={styles.saveButton}
                  onClick={handleAddMultipleFloors}
                  disabled={createMultipleFloors.isPending}
                >
                  {createMultipleFloors.isPending ? 'Creando...' : 'Crear Pisos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FloorsTab;

