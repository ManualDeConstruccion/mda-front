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
import HelpTooltip from '../common/HelpTooltip/HelpTooltip';
import { useModalHelpTexts } from '../../hooks/useModalHelpTexts';
import { validatePolygonData } from '../../validation/polygonSchemas';
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

  // Cargar todos los textos de ayuda necesarios para los modales en una sola llamada
  const modalHelpTextFields = [
    { model: 'SurfacePolygon', field: 'name' },
    { model: 'SurfacePolygon', field: 'manual_total' },
    { model: 'SurfacePolygon', field: 'width' },
    { model: 'SurfacePolygon', field: 'length' },
    { model: 'SurfacePolygon', field: 'triangulo_rectangulo' },
    { model: 'SurfacePolygon', field: 'count_as_half' },
  ];
  const { getHelpText } = useModalHelpTexts(modalHelpTextFields);

  // Estado para controlar qué niveles están expandidos (por defecto todos abiertos)
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());
  const [showAddPolygonModal, setShowAddPolygonModal] = useState<{ levelId: number } | null>(null);
  const [editingPolygon, setEditingPolygon] = useState<SurfacePolygon | null>(null);
  const [newPolygonName, setNewPolygonName] = useState('');
  const [newPolygonWidth, setNewPolygonWidth] = useState('');
  const [newPolygonLength, setNewPolygonLength] = useState('');
  const [newPolygonTrianguloRectangulo, setNewPolygonTrianguloRectangulo] = useState(false);
  const [newPolygonCountAsHalf, setNewPolygonCountAsHalf] = useState(false);
  const [newPolygonManualTotal, setNewPolygonManualTotal] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
    return levelPolygons.reduce((sum, polygon) => {
      const polygonTotal = polygon.total;
      if (polygonTotal === null || polygonTotal === undefined || isNaN(Number(polygonTotal))) {
        return sum;
      }
      return sum + Number(polygonTotal);
    }, 0);
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
    const numValue = Number(num);
    // Mostrar 0.00 en lugar de "-" cuando el valor es 0
    if (numValue === 0) return '0.00';
    return numValue.toFixed(2);
  };

  // Calcular total en vivo según la lógica del backend
  const calculateLiveTotal = (): number | null => {
    let area: number | null = null;

    // Si hay total manual, empezar con ese valor
    if (newPolygonManualTotal) {
      const manual = parseFloat(newPolygonManualTotal);
      if (!isNaN(manual) && manual > 0) {
        area = manual;
      }
    } else {
      // Si no hay ancho y largo, no se puede calcular
      if (!newPolygonWidth || !newPolygonLength) {
        return null;
      }

      const width = parseFloat(newPolygonWidth);
      const length = parseFloat(newPolygonLength);

      if (isNaN(width) || isNaN(length) || width <= 0 || length <= 0) {
        return null;
      }

      area = width * length;

      // Aplicar división por 2 si es triángulo rectángulo
      if (newPolygonTrianguloRectangulo) {
        area = area / 2;
      }
    }

    if (area === null) {
      return null;
    }

    // Media superficie aplica factor adicional de 0.5 (compatible con manual_total y triangulo_rectangulo)
    if (newPolygonCountAsHalf) {
      area = area / 2;
    }

    // Redondear a 2 decimales
    return Math.round(area * 100) / 100;
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

  // Limpiar errores de validación cuando cambian los campos
  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      const newErrors = { ...validationErrors };
      delete newErrors[fieldName];
      setValidationErrors(newErrors);
    }
  };

  const handleAddPolygon = async () => {
    if (!showAddPolygonModal) return;

    // Validar con Yup
    const validation = await validatePolygonData(
      {
        name: newPolygonName,
        width: newPolygonWidth,
        length: newPolygonLength,
        manual_total: newPolygonManualTotal,
        triangulo_rectangulo: newPolygonTrianguloRectangulo,
        count_as_half: newPolygonCountAsHalf,
      },
      polygons,
      showAddPolygonModal.levelId
    );

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});
    try {
      await createPolygon.mutateAsync({
        project_node: projectNodeId,
        level: showAddPolygonModal.levelId,
        name: newPolygonName.trim(),
        width: newPolygonWidth ? parseFloat(newPolygonWidth) : null,
        length: newPolygonLength ? parseFloat(newPolygonLength) : null,
        triangulo_rectangulo: newPolygonTrianguloRectangulo,
        count_as_half: newPolygonCountAsHalf,
        manual_total: newPolygonManualTotal ? parseFloat(newPolygonManualTotal) : null,
      });
      setNewPolygonName('');
      setNewPolygonWidth('');
      setNewPolygonLength('');
      setNewPolygonTrianguloRectangulo(false);
      setNewPolygonCountAsHalf(false);
      setNewPolygonManualTotal('');
      setValidationErrors({});
      setShowAddPolygonModal(null);
      
      // Recalcular superficies del nivel automáticamente
      if (showAddPolygonModal) {
        await recalculateLevelFromPolygons(showAddPolygonModal.levelId);
      }
    } catch (error: any) {
      console.error('Error al crear polígono:', error);
      console.error('Error response data:', error?.response?.data);
      // Manejar error de validación del backend
      const errorData = error?.response?.data;
      const backendErrors: Record<string, string> = {};
      if (errorData) {
        Object.keys(errorData).forEach((key) => {
          const errorValue = errorData[key];
          backendErrors[key] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        });
        setValidationErrors(backendErrors);
      } else {
        setValidationErrors({ general: 'Error al crear polígono. Verifique que el nombre no esté duplicado.' });
      }
    }
  };

  const handleEditPolygon = (polygon: SurfacePolygon) => {
    setEditingPolygon(polygon);
    setNewPolygonName(polygon.name);
    setNewPolygonWidth(polygon.width?.toString() || '');
    setNewPolygonLength(polygon.length?.toString() || '');
    setNewPolygonTrianguloRectangulo(polygon.triangulo_rectangulo || false);
    setNewPolygonCountAsHalf(polygon.count_as_half || false);
    setNewPolygonManualTotal(polygon.manual_total?.toString() || '');
    setValidationErrors({}); // Limpiar errores al editar
  };

  const handleUpdatePolygon = async () => {
    if (!editingPolygon) return;

    // Validar con Yup
    const validation = await validatePolygonData(
      {
        name: newPolygonName,
        width: newPolygonWidth,
        length: newPolygonLength,
        manual_total: newPolygonManualTotal,
        triangulo_rectangulo: newPolygonTrianguloRectangulo,
        count_as_half: newPolygonCountAsHalf,
      },
      polygons,
      editingPolygon.level,
      editingPolygon.id
    );

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});
    try {
      const levelId = editingPolygon.level;
      await updatePolygon.mutateAsync({
        id: editingPolygon.id,
        data: {
          name: newPolygonName.trim(),
          width: newPolygonWidth ? parseFloat(newPolygonWidth) : null,
          length: newPolygonLength ? parseFloat(newPolygonLength) : null,
          triangulo_rectangulo: newPolygonTrianguloRectangulo,
          count_as_half: newPolygonCountAsHalf,
          manual_total: newPolygonManualTotal ? parseFloat(newPolygonManualTotal) : null,
        },
      });
      setNewPolygonName('');
      setNewPolygonWidth('');
      setNewPolygonLength('');
      setNewPolygonTrianguloRectangulo(false);
      setNewPolygonCountAsHalf(false);
      setNewPolygonManualTotal('');
      setValidationErrors({});
      setEditingPolygon(null);
      
      // Recalcular superficies del nivel automáticamente
      if (levelId) {
        await recalculateLevelFromPolygons(levelId);
      }
    } catch (error: any) {
      console.error('Error al actualizar polígono:', error);
      console.error('Error response data:', error?.response?.data);
      // Manejar error de validación del backend
      const errorData = error?.response?.data;
      const backendErrors: Record<string, string> = {};
      if (errorData) {
        Object.keys(errorData).forEach((key) => {
          const errorValue = errorData[key];
          backendErrors[key] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        });
        setValidationErrors(backendErrors);
      } else {
        setValidationErrors({ general: 'Error al actualizar polígono. Verifique que el nombre no esté duplicado.' });
      }
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
                        <strong>TOTAL DEL NIVEL {level.building_name}</strong>
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
              {validationErrors.general && (
                <div className={styles.errorText} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                  {validationErrors.general}
                </div>
              )}
              <div className={styles.formGroup}>
                <label>
                  Nombre del Polígono *
                  <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="name"
                    helpTextData={getHelpText('SurfacePolygon', 'name')}
                    defaultBriefText="Identificador del polígono"
                    defaultExtendedText="Nombre descriptivo que identifica el polígono de superficie. Ejemplos: Sala de estar, Cocina, Dormitorio principal, Estacionamiento."
                    position="right"
                  />
                </label>
                <input
                  type="text"
                  value={newPolygonName}
                  onChange={(e) => {
                    setNewPolygonName(e.target.value);
                    clearFieldError('name');
                  }}
                  placeholder="ej: Sala principal"
                  className={validationErrors.name ? styles.inputError : ''}
                />
                {validationErrors.name && (
                  <small className={styles.errorText}>{validationErrors.name}</small>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>
                  Total Manual (m²)
                  <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="manual_total"
                    helpTextData={getHelpText('SurfacePolygon', 'manual_total')}
                    defaultBriefText="Superficie ingresada manualmente"
                    defaultExtendedText="Superficie total ingresada manualmente para polígonos irregulares o cuando no se pueden medir ancho y largo por separado. Si se define este valor, se ignora width y length."
                    position="right"
                  />
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPolygonManualTotal}
                  onChange={(e) => {
                    setNewPolygonManualTotal(e.target.value);
                    clearFieldError('manual_total');
                    if (e.target.value) {
                      setNewPolygonTrianguloRectangulo(false); // Deshabilitar triángulo si hay manual
                      // Media superficie es compatible con total manual, no se deshabilita
                    }
                  }}
                  placeholder="Si se ingresa, se ignora ancho y largo"
                  className={validationErrors.manual_total ? styles.inputError : ''}
                />
                {validationErrors.manual_total && (
                  <small className={styles.errorText}>{validationErrors.manual_total}</small>
                )}
                <small className={styles.helpText}>
                  Si ingresa un total manual, se ignorarán ancho y largo
                </small>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>
                    Ancho (m)
                    <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="width"
                    helpTextData={getHelpText('SurfacePolygon', 'width')}
                    defaultBriefText="Ancho del polígono en metros"
                      defaultExtendedText="Ancho del polígono en metros. Se usa junto con length para calcular la superficie automáticamente. Opcional si se define manual_total para polígonos irregulares."
                      position="right"
                    />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPolygonWidth}
                  onChange={(e) => {
                    setNewPolygonWidth(e.target.value);
                    clearFieldError('width');
                  }}
                  placeholder="Ancho"
                  disabled={!!newPolygonManualTotal}
                  className={validationErrors.width ? styles.inputError : ''}
                />
                {validationErrors.width && (
                  <small className={styles.errorText}>{validationErrors.width}</small>
                )}
                </div>
                <div className={styles.formGroup}>
                  <label>
                    Largo (m)
                    <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="length"
                    helpTextData={getHelpText('SurfacePolygon', 'length')}
                    defaultBriefText="Largo del polígono en metros"
                      defaultExtendedText="Largo del polígono en metros. Se usa junto con width para calcular la superficie automáticamente. Opcional si se define manual_total para polígonos irregulares."
                      position="right"
                    />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPolygonLength}
                  onChange={(e) => {
                    setNewPolygonLength(e.target.value);
                    clearFieldError('length');
                  }}
                  placeholder="Largo"
                  disabled={!!newPolygonManualTotal}
                  className={validationErrors.length ? styles.inputError : ''}
                />
                {validationErrors.length && (
                  <small className={styles.errorText}>{validationErrors.length}</small>
                )}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={newPolygonTrianguloRectangulo}
                    onChange={(e) => {
                      setNewPolygonTrianguloRectangulo(e.target.checked);
                      if (e.target.checked) {
                        setNewPolygonManualTotal(''); // Deshabilitar manual_total si se selecciona triángulo
                      }
                    }}
                    disabled={!!newPolygonManualTotal}
                  />
                  Triángulo Rectángulo
                  <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="triangulo_rectangulo"
                    helpTextData={getHelpText('SurfacePolygon', 'triangulo_rectangulo')}
                    defaultBriefText="Triángulo rectángulo (triangulo_rectangulo)"
                    defaultExtendedText="Calcula el área como triángulo rectángulo usando la fórmula: (ancho × largo) / 2. Requiere ingresar ancho y largo. Este concepto es diferente a media superficie normativa (count_as_half), que se aplica a espacios sin muros por todas sus caras según normativa."
                    position="right"
                  />
                </label>
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={newPolygonCountAsHalf}
                    onChange={(e) => {
                      setNewPolygonCountAsHalf(e.target.checked);
                    }}
                    // Media superficie es compatible con total manual y triángulo rectángulo
                    // Solo deshabilitar si no hay datos para calcular
                    disabled={!newPolygonManualTotal && (!newPolygonWidth || !newPolygonLength)}
                  />
                  Media Superficie, según Art. 5.1.11. de la O.G.U.C.
                  <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="count_as_half"
                    helpTextData={getHelpText('SurfacePolygon', 'count_as_half')}
                    defaultBriefText="Media superficie (count_as_half)"
                    defaultExtendedText="Indica que la superficie calculada debe dividirse por 2. Este concepto es distinto a medir la superficie de un triángulo rectángulo. La media superficie identifica aquellas superficies que normativamente no tienen muros por todas sus caras, es decir, espacios abiertos o semiabiertos que deben contabilizarse al 50% según la normativa aplicable."
                    position="right"
                  />
                </label>
              </div>
              <div className={styles.formGroup}>
                <label>
                  <strong>Total Calculado (m²)</strong>
                </label>
                <div className={styles.totalDisplay}>
                  {calculateLiveTotal() !== null ? (
                    <span className={styles.totalValue}>{formatNumber(calculateLiveTotal())}</span>
                  ) : (
                    <span className={styles.totalPlaceholder}>Ingrese los datos para calcular</span>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowAddPolygonModal(null);
                  setNewPolygonName('');
                  setNewPolygonWidth('');
                  setNewPolygonLength('');
                  setNewPolygonTrianguloRectangulo(false);
                  setNewPolygonCountAsHalf(false);
                  setNewPolygonManualTotal('');
                  setValidationErrors({});
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleAddPolygon}
                disabled={!newPolygonName.trim() || Object.keys(validationErrors).filter(key => key !== 'general').length > 0}
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
              {validationErrors.general && (
                <div className={styles.errorText} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                  {validationErrors.general}
                </div>
              )}
              <div className={styles.formGroup}>
                <label>
                  Nombre del Polígono *
                  <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="name"
                    helpTextData={getHelpText('SurfacePolygon', 'name')}
                    defaultBriefText="Identificador del polígono"
                    defaultExtendedText="Nombre descriptivo que identifica el polígono de superficie. Ejemplos: Sala de estar, Cocina, Dormitorio principal, Estacionamiento."
                    position="right"
                  />
                </label>
                <input
                  type="text"
                  value={newPolygonName}
                  onChange={(e) => {
                    setNewPolygonName(e.target.value);
                    clearFieldError('name');
                  }}
                  placeholder="ej: Sala principal"
                  className={validationErrors.name ? styles.inputError : ''}
                />
                {validationErrors.name && (
                  <small className={styles.errorText}>{validationErrors.name}</small>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>
                  Total Manual (m²)
                  <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="manual_total"
                    helpTextData={getHelpText('SurfacePolygon', 'manual_total')}
                    defaultBriefText="Superficie ingresada manualmente"
                    defaultExtendedText="Superficie total ingresada manualmente para polígonos irregulares o cuando no se pueden medir ancho y largo por separado. Si se define este valor, se ignora width y length."
                    position="right"
                  />
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPolygonManualTotal}
                  onChange={(e) => {
                    setNewPolygonManualTotal(e.target.value);
                    clearFieldError('manual_total');
                    if (e.target.value) {
                      setNewPolygonTrianguloRectangulo(false); // Deshabilitar triángulo si hay manual
                      // Media superficie es compatible con total manual, no se deshabilita
                    }
                  }}
                  placeholder="Si se ingresa, se ignora ancho y largo"
                  className={validationErrors.manual_total ? styles.inputError : ''}
                />
                {validationErrors.manual_total && (
                  <small className={styles.errorText}>{validationErrors.manual_total}</small>
                )}
                <small className={styles.helpText}>
                  Si ingresa un total manual, se ignorarán ancho y largo
                </small>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>
                    Ancho (m)
                    <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="width"
                    helpTextData={getHelpText('SurfacePolygon', 'width')}
                    defaultBriefText="Ancho del polígono en metros"
                      defaultExtendedText="Ancho del polígono en metros. Se usa junto con length para calcular la superficie automáticamente. Opcional si se define manual_total para polígonos irregulares."
                      position="right"
                    />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPolygonWidth}
                  onChange={(e) => {
                    setNewPolygonWidth(e.target.value);
                    clearFieldError('width');
                  }}
                  placeholder="Ancho"
                  disabled={!!newPolygonManualTotal}
                  className={validationErrors.width ? styles.inputError : ''}
                />
                {validationErrors.width && (
                  <small className={styles.errorText}>{validationErrors.width}</small>
                )}
                </div>
                <div className={styles.formGroup}>
                  <label>
                    Largo (m)
                    <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="length"
                    helpTextData={getHelpText('SurfacePolygon', 'length')}
                    defaultBriefText="Largo del polígono en metros"
                      defaultExtendedText="Largo del polígono en metros. Se usa junto con width para calcular la superficie automáticamente. Opcional si se define manual_total para polígonos irregulares."
                      position="right"
                    />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPolygonLength}
                  onChange={(e) => {
                    setNewPolygonLength(e.target.value);
                    clearFieldError('length');
                  }}
                  placeholder="Largo"
                  disabled={!!newPolygonManualTotal}
                  className={validationErrors.length ? styles.inputError : ''}
                />
                {validationErrors.length && (
                  <small className={styles.errorText}>{validationErrors.length}</small>
                )}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={newPolygonTrianguloRectangulo}
                    onChange={(e) => {
                      setNewPolygonTrianguloRectangulo(e.target.checked);
                      if (e.target.checked) {
                        setNewPolygonManualTotal(''); // Deshabilitar manual_total si se selecciona triángulo
                      }
                    }}
                    disabled={!!newPolygonManualTotal}
                  />
                  Triángulo Rectángulo (dividir por 2)
                  <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="triangulo_rectangulo"
                    helpTextData={getHelpText('SurfacePolygon', 'triangulo_rectangulo')}
                    defaultBriefText="Triángulo rectángulo (triangulo_rectangulo)"
                    defaultExtendedText="Calcula el área como triángulo rectángulo usando la fórmula: (ancho × largo) / 2. Requiere ingresar ancho y largo. Este concepto es diferente a media superficie normativa (count_as_half), que se aplica a espacios sin muros por todas sus caras según normativa."
                    position="right"
                  />
                </label>
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={newPolygonCountAsHalf}
                    onChange={(e) => {
                      setNewPolygonCountAsHalf(e.target.checked);
                    }}
                    // Media superficie es compatible con total manual y triángulo rectángulo
                    // Solo deshabilitar si no hay datos para calcular
                    disabled={!newPolygonManualTotal && (!newPolygonWidth || !newPolygonLength)}
                  />
                  Media Superficie (dividir por 2)
                  <HelpTooltip
                    modelName="SurfacePolygon"
                    fieldName="count_as_half"
                    helpTextData={getHelpText('SurfacePolygon', 'count_as_half')}
                    defaultBriefText="Media superficie (count_as_half)"
                    defaultExtendedText="Indica que la superficie calculada debe dividirse por 2. Este concepto es distinto a medir la superficie de un triángulo rectángulo. La media superficie identifica aquellas superficies que normativamente no tienen muros por todas sus caras, es decir, espacios abiertos o semiabiertos que deben contabilizarse al 50% según la normativa aplicable."
                    position="right"
                  />
                </label>
              </div>
              <div className={styles.formGroup}>
                <label>
                  <strong>Total Calculado (m²)</strong>
                </label>
                <div className={styles.totalDisplay}>
                  {calculateLiveTotal() !== null ? (
                    <span className={styles.totalValue}>{formatNumber(calculateLiveTotal())}</span>
                  ) : (
                    <span className={styles.totalPlaceholder}>Ingrese los datos para calcular</span>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setEditingPolygon(null);
                  setNewPolygonName('');
                  setNewPolygonWidth('');
                  setNewPolygonLength('');
                  setNewPolygonTrianguloRectangulo(false);
                  setNewPolygonCountAsHalf(false);
                  setNewPolygonManualTotal('');
                  setValidationErrors({});
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleUpdatePolygon}
                disabled={!newPolygonName.trim() || Object.keys(validationErrors).filter(key => key !== 'general').length > 0}
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

