// src/components/ProjectTabs/PropertyTab.tsx

import React, { useState, useEffect } from 'react';
import styles from './ProjectTabs.module.scss';
import { useRegionComuna } from '../../hooks/useRegionComuna';

export interface PropertyData {
  direccion_calle: string;
  direccion_numero: string;
  numero_depto: string;
  region_id: number | null;
  region: string;
  comuna_id: number | null;
  comuna: string;
  rol: string;
}

interface PropertyTabProps {
  data?: PropertyData;
  onSave?: (data: PropertyData) => void;
  isEditing?: boolean;
  onEditChange?: (editing: boolean) => void;
}

const PropertyTab: React.FC<PropertyTabProps> = ({
  data,
  onSave,
  isEditing = false,
  onEditChange
}) => {
  const [formData, setFormData] = useState<PropertyData>({
    direccion_calle: data?.direccion_calle || '',
    direccion_numero: data?.direccion_numero || '',
    numero_depto: data?.numero_depto || '',
    region_id: data?.region_id || null,
    region: data?.region || '',
    comuna_id: data?.comuna_id || null,
    comuna: data?.comuna || '',
    rol: data?.rol || '',
  });

  const { regiones, comunas, loadingRegiones, loadingComunas } = useRegionComuna(formData.region_id || undefined);

  // Actualizar nombre de región cuando cambia el ID
  useEffect(() => {
    if (formData.region_id) {
      const region = regiones.find(r => r.id === formData.region_id);
      if (region) {
        setFormData(prev => ({
          ...prev,
          region: region.region
        }));
      }
    }
  }, [formData.region_id, regiones]);

  // Actualizar nombre de comuna cuando cambia el ID
  useEffect(() => {
    if (formData.comuna_id) {
      const comuna = comunas.find(c => c.id === formData.comuna_id);
      if (comuna) {
        setFormData(prev => ({
          ...prev,
          comuna: comuna.comuna
        }));
      }
    }
  }, [formData.comuna_id, comunas]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si es cambio de región, resetear la comuna
    if (name === 'region_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : null,
        comuna_id: null,
        comuna: '',
      }));
    } else if (name === 'comuna_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : null,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = () => {
    onSave?.(formData);
    onEditChange?.(false);
  };

  const handleCancel = () => {
    setFormData(data || {
      direccion_calle: '',
      direccion_numero: '',
      numero_depto: '',
      region_id: null,
      region: '',
      comuna_id: null,
      comuna: '',
      rol: '',
    });
    onEditChange?.(false);
  };

  return (
    <>
      <div className={styles.header}>
        <p>Información de la propiedad</p>
        {!isEditing ? (
          <button 
            onClick={() => onEditChange?.(true)}
            className={styles.editButton}
          >
            Editar Información
          </button>
        ) : (
          <div className={styles.actionButtons}>
            <button 
              onClick={handleCancel}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className={styles.saveButton}
            >
              Guardar
            </button>
          </div>
        )}
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.label}>Calle:</span>
          {isEditing ? (
            <input
              type="text"
              name="direccion_calle"
              value={formData.direccion_calle}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: Av. Apoquindo"
            />
          ) : (
            <span className={styles.value}>{data?.direccion_calle || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Número:</span>
          {isEditing ? (
            <input
              type="text"
              name="direccion_numero"
              value={formData.direccion_numero}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: 1234"
            />
          ) : (
            <span className={styles.value}>{data?.direccion_numero || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Depto:</span>
          {isEditing ? (
            <input
              type="text"
              name="numero_depto"
              value={formData.numero_depto}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: 45"
            />
          ) : (
            <span className={styles.value}>{data?.numero_depto || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Región:</span>
          {isEditing ? (
            <select
              name="region_id"
              value={formData.region_id || ''}
              onChange={handleInputChange}
              className={styles.input}
              disabled={loadingRegiones}
            >
              <option value="">Seleccione una región</option>
              {regiones.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region}
                </option>
              ))}
            </select>
          ) : (
            <span className={styles.value}>{data?.region || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Comuna:</span>
          {isEditing ? (
            <select
              name="comuna_id"
              value={formData.comuna_id || ''}
              onChange={handleInputChange}
              className={styles.input}
              disabled={loadingComunas || !formData.region_id}
            >
              <option value="">
                {!formData.region_id 
                  ? 'Primero seleccione una región' 
                  : 'Seleccione una comuna'
                }
              </option>
              {comunas.map((comuna) => (
                <option key={comuna.id} value={comuna.id}>
                  {comuna.comuna}
                </option>
              ))}
            </select>
          ) : (
            <span className={styles.value}>{data?.comuna || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Rol:</span>
          {isEditing ? (
            <input
              type="text"
              name="rol"
              value={formData.rol}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: 12345-6"
            />
          ) : (
            <span className={styles.value}>{data?.rol || 'No especificado'}</span>
          )}
        </div>
      </div>
    </>
  );
};

export default PropertyTab;
