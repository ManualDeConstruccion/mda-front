// src/components/ProjectTabs/OwnerTab.tsx

import React, { useState, useEffect } from 'react';
import styles from './ProjectTabs.module.scss';
import { useRegionComuna } from '../../hooks/useRegionComuna';

export interface OwnerData {
  // Información personal
  nombre: string;
  rut: string;
  email: string;
  telefono: string;
  celular: string;
  
  // Dirección
  direccion: string;
  direccion_numero: string;
  direccion_depto: string;
  direccion_region_id: number | null;
  direccion_region: string;
  direccion_comuna_id: number | null;
  direccion_comuna: string;
}

interface OwnerTabProps {
  data?: OwnerData;
  onSave?: (data: OwnerData) => void;
  isEditing?: boolean;
  onEditChange?: (editing: boolean) => void;
}

const OwnerTab: React.FC<OwnerTabProps> = ({
  data,
  onSave,
  isEditing = false,
  onEditChange
}) => {
  const [formData, setFormData] = useState<OwnerData>({
    nombre: data?.nombre || '',
    rut: data?.rut || '',
    email: data?.email || '',
    telefono: data?.telefono || '',
    celular: data?.celular || '',
    direccion: data?.direccion || '',
    direccion_numero: data?.direccion_numero || '',
    direccion_depto: data?.direccion_depto || '',
    direccion_region_id: data?.direccion_region_id || null,
    direccion_region: data?.direccion_region || '',
    direccion_comuna_id: data?.direccion_comuna_id || null,
    direccion_comuna: data?.direccion_comuna || '',
  });

  const { regiones, comunas, loadingRegiones, loadingComunas } = useRegionComuna(formData.direccion_region_id || undefined);

  // Actualizar nombre de región cuando cambia el ID
  useEffect(() => {
    if (formData.direccion_region_id) {
      const region = regiones.find(r => r.id === formData.direccion_region_id);
      if (region) {
        setFormData(prev => ({
          ...prev,
          direccion_region: region.region
        }));
      }
    }
  }, [formData.direccion_region_id, regiones]);

  // Actualizar nombre de comuna cuando cambia el ID
  useEffect(() => {
    if (formData.direccion_comuna_id) {
      const comuna = comunas.find(c => c.id === formData.direccion_comuna_id);
      if (comuna) {
        setFormData(prev => ({
          ...prev,
          direccion_comuna: comuna.comuna
        }));
      }
    }
  }, [formData.direccion_comuna_id, comunas]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si es cambio de región, resetear la comuna
    if (name === 'direccion_region_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : null,
        direccion_comuna_id: null,
        direccion_comuna: '',
      }));
    } else if (name === 'direccion_comuna_id') {
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
      nombre: '',
      rut: '',
      email: '',
      telefono: '',
      celular: '',
      direccion: '',
      direccion_numero: '',
      direccion_depto: '',
      direccion_region_id: null,
      direccion_region: '',
      direccion_comuna_id: null,
      direccion_comuna: '',
    });
    onEditChange?.(false);
  };

  return (
    <>
      <div className={styles.header}>
        <p>Información personal del propietario y/o mandante del proyecto</p>
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
          <span className={styles.label}>Nombre:</span>
          {isEditing ? (
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: Juan Pérez González"
            />
          ) : (
            <span className={styles.value}>{data?.nombre || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>RUT:</span>
          {isEditing ? (
            <input
              type="text"
              name="rut"
              value={formData.rut}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: 12.345.678-9"
            />
          ) : (
            <span className={styles.value}>{data?.rut || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Email:</span>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: juan.perez@email.com"
            />
          ) : (
            <span className={styles.value}>{data?.email || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Teléfono:</span>
          {isEditing ? (
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: +56 2 2345 6789"
            />
          ) : (
            <span className={styles.value}>{data?.telefono || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Dirección:</span>
          {isEditing ? (
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: Av. Principal"
            />
          ) : (
            <span className={styles.value}>{data?.direccion || 'No especificado'}</span>
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
              placeholder="Ej: 123"
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
              name="direccion_depto"
              value={formData.direccion_depto}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: 45"
            />
          ) : (
            <span className={styles.value}>{data?.direccion_depto || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Región:</span>
          {isEditing ? (
            <select
              name="direccion_region_id"
              value={formData.direccion_region_id || ''}
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
            <span className={styles.value}>{data?.direccion_region || 'No especificado'}</span>
          )}
        </div>
          
        <div className={styles.infoItem}>
          <span className={styles.label}>Comuna:</span>
          {isEditing ? (
            <select
              name="direccion_comuna_id"
              value={formData.direccion_comuna_id || ''}
              onChange={handleInputChange}
              className={styles.input}
              disabled={loadingComunas || !formData.direccion_region_id}
            >
              <option value="">
                {!formData.direccion_region_id 
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
            <span className={styles.value}>{data?.direccion_comuna || 'No especificado'}</span>
          )}
        </div>
      </div>
    </>
  );
};

export default OwnerTab;
