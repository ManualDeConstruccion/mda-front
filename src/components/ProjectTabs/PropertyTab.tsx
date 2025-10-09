// src/components/ProjectTabs/PropertyTab.tsx

import React, { useState } from 'react';
import styles from './PropertyTab.module.scss';

export interface PropertyData {
  // Información básica de la propiedad
  manzana: string;
  numero_plano_loteo: string;
  lote: string;
  conservador_comuna: string;
  localidad: string;
  poblacion: string;
  rol: string;
  numero_depto: string;
  comuna: string;
  direccion_calle: string;
  fojas_numero: string;
  region: string;
  direccion_numero: string;
  fojas: string;
  fojas_ano: string;
  sector: string;
  prc: string;
  zona: string;
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
    manzana: data?.manzana || '',
    numero_plano_loteo: data?.numero_plano_loteo || '',
    lote: data?.lote || '',
    conservador_comuna: data?.conservador_comuna || '',
    localidad: data?.localidad || '',
    poblacion: data?.poblacion || '',
    rol: data?.rol || '',
    numero_depto: data?.numero_depto || '',
    comuna: data?.comuna || '',
    direccion_calle: data?.direccion_calle || '',
    fojas_numero: data?.fojas_numero || '',
    region: data?.region || '',
    direccion_numero: data?.direccion_numero || '',
    fojas: data?.fojas || '',
    fojas_ano: data?.fojas_ano || '',
    sector: data?.sector || '',
    prc: data?.prc || '',
    zona: data?.zona || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    onEditChange?.(false);
  };

  const handleCancel = () => {
    setFormData(data || {
      manzana: '',
      numero_plano_loteo: '',
      lote: '',
      conservador_comuna: '',
      localidad: '',
      poblacion: '',
      rol: '',
      numero_depto: '',
      comuna: '',
      direccion_calle: '',
      fojas_numero: '',
      region: '',
      direccion_numero: '',
      fojas: '',
      fojas_ano: '',
      sector: '',
      prc: '',
      zona: '',
    });
    onEditChange?.(false);
  };

  if (isEditing) {
    return (
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h3>Ubicación</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Región</label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  placeholder="Ej: Región Metropolitana"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Comuna</label>
                <input
                  type="text"
                  name="comuna"
                  value={formData.comuna}
                  onChange={handleInputChange}
                  placeholder="Ej: Las Condes"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Localidad</label>
                <input
                  type="text"
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleInputChange}
                  placeholder="Ej: San Carlos de Apoquindo"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Población</label>
                <input
                  type="text"
                  name="poblacion"
                  value={formData.poblacion}
                  onChange={handleInputChange}
                  placeholder="Ej: Las Condes Centro"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Sector</label>
                <input
                  type="text"
                  name="sector"
                  value={formData.sector}
                  onChange={handleInputChange}
                  placeholder="Ej: Sector Comercial"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Zona</label>
                <input
                  type="text"
                  name="zona"
                  value={formData.zona}
                  onChange={handleInputChange}
                  placeholder="Ej: Zona Urbana"
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Dirección</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Calle</label>
                <input
                  type="text"
                  name="direccion_calle"
                  value={formData.direccion_calle}
                  onChange={handleInputChange}
                  placeholder="Ej: Av. Apoquindo"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Número</label>
                <input
                  type="text"
                  name="direccion_numero"
                  value={formData.direccion_numero}
                  onChange={handleInputChange}
                  placeholder="Ej: 1234"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Depto</label>
                <input
                  type="text"
                  name="numero_depto"
                  value={formData.numero_depto}
                  onChange={handleInputChange}
                  placeholder="Ej: 45 (opcional)"
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Información Catastral</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Rol</label>
                <input
                  type="text"
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                  placeholder="Ej: 12345-6"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Manzana</label>
                <input
                  type="text"
                  name="manzana"
                  value={formData.manzana}
                  onChange={handleInputChange}
                  placeholder="Ej: 15"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Lote</label>
                <input
                  type="text"
                  name="lote"
                  value={formData.lote}
                  onChange={handleInputChange}
                  placeholder="Ej: 8"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Número Plano Loteo</label>
                <input
                  type="text"
                  name="numero_plano_loteo"
                  value={formData.numero_plano_loteo}
                  onChange={handleInputChange}
                  placeholder="Ej: 1234"
                />
              </div>
              <div className={styles.formGroup}>
                <label>PRC</label>
                <input
                  type="text"
                  name="prc"
                  value={formData.prc}
                  onChange={handleInputChange}
                  placeholder="Ej: 12345"
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Información Conservador de Bienes Raíces</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Conservador Comuna</label>
                <input
                  type="text"
                  name="conservador_comuna"
                  value={formData.conservador_comuna}
                  onChange={handleInputChange}
                  placeholder="Ej: Las Condes"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fojas</label>
                <input
                  type="text"
                  name="fojas"
                  value={formData.fojas}
                  onChange={handleInputChange}
                  placeholder="Ej: 123"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Número Fojas</label>
                <input
                  type="text"
                  name="fojas_numero"
                  value={formData.fojas_numero}
                  onChange={handleInputChange}
                  placeholder="Ej: 456"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Año Fojas</label>
                <input
                  type="text"
                  name="fojas_ano"
                  value={formData.fojas_ano}
                  onChange={handleInputChange}
                  placeholder="Ej: 2023"
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={handleCancel} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          onClick={() => onEditChange?.(true)}
          className={styles.editButton}
        >
          Editar Información
        </button>
      </div>

      <div className={styles.content}>        
        <div className={styles.section}>
          <h4>Dirección</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Calle:</span>
              <span className={styles.value}>{data?.direccion_calle || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Número:</span>
              <span className={styles.value}>{data?.direccion_numero || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Depto:</span>
              <span className={styles.value}>{data?.numero_depto || 'No especificado'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4>Ubicación</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Región:</span>
              <span className={styles.value}>{data?.region || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Comuna:</span>
              <span className={styles.value}>{data?.comuna || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Localidad:</span>
              <span className={styles.value}>{data?.localidad || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Población:</span>
              <span className={styles.value}>{data?.poblacion || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Sector:</span>
              <span className={styles.value}>{data?.sector || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Zona:</span>
              <span className={styles.value}>{data?.zona || 'No especificado'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4>Información Catastral</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Rol:</span>
              <span className={styles.value}>{data?.rol || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Manzana:</span>
              <span className={styles.value}>{data?.manzana || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Lote:</span>
              <span className={styles.value}>{data?.lote || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Número Plano Loteo:</span>
              <span className={styles.value}>{data?.numero_plano_loteo || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>PRC:</span>
              <span className={styles.value}>{data?.prc || 'No especificado'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4>Información Conservador</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Conservador Comuna:</span>
              <span className={styles.value}>{data?.conservador_comuna || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Fojas:</span>
              <span className={styles.value}>{data?.fojas || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Número Fojas:</span>
              <span className={styles.value}>{data?.fojas_numero || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Año Fojas:</span>
              <span className={styles.value}>{data?.fojas_ano || 'No especificado'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyTab;
