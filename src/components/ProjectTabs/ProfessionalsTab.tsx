// src/components/ProjectTabs/ProfessionalsTab.tsx

import React, { useState } from 'react';
import styles from './ProjectTabs.module.scss';

export interface ProfessionalsData {
  // Oficina de Arquitectura
  of_arquitectura_razon_social: string;
  of_arquitectura_rut: string;
  
  // Arquitecto
  arquitecto_nombre: string;
  arquitecto_rut: string;
  arquitecto_email: string;
  arquitecto_telefono: string;
  arquitecto_celular: string;
  arquitecto_patente: string;
}

interface ProfessionalsTabProps {
  data?: ProfessionalsData;
  onSave?: (data: ProfessionalsData) => void;
  isEditing?: boolean;
  onEditChange?: (editing: boolean) => void;
}

const ProfessionalsTab: React.FC<ProfessionalsTabProps> = ({
  data,
  onSave,
  isEditing = false,
  onEditChange
}) => {
  const [formData, setFormData] = useState<ProfessionalsData>({
    of_arquitectura_razon_social: data?.of_arquitectura_razon_social || '',
    of_arquitectura_rut: data?.of_arquitectura_rut || '',
    arquitecto_nombre: data?.arquitecto_nombre || '',
    arquitecto_rut: data?.arquitecto_rut || '',
    arquitecto_email: data?.arquitecto_email || '',
    arquitecto_telefono: data?.arquitecto_telefono || '',
    arquitecto_celular: data?.arquitecto_celular || '',
    arquitecto_patente: data?.arquitecto_patente || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    onSave?.(formData);
    onEditChange?.(false);
  };

  const handleCancel = () => {
    setFormData(data || {
      of_arquitectura_razon_social: '',
      of_arquitectura_rut: '',
      arquitecto_nombre: '',
      arquitecto_rut: '',
      arquitecto_email: '',
      arquitecto_telefono: '',
      arquitecto_celular: '',
      arquitecto_patente: '',
    });
    onEditChange?.(false);
  };

  return (
    <>
      <div className={styles.header}>
        <p>Información del arquitecto responsable y su oficina de arquitectura</p>
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
        {/* Oficina de Arquitectura */}
        <div className={styles.infoItem}>
          <span className={styles.label}>Razón Social Oficina:</span>
          {isEditing ? (
            <input
              type="text"
              name="of_arquitectura_razon_social"
              value={formData.of_arquitectura_razon_social}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: Estudio García Arquitectos Ltda."
            />
          ) : (
            <span className={styles.value}>{data?.of_arquitectura_razon_social || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>RUT Oficina:</span>
          {isEditing ? (
            <input
              type="text"
              name="of_arquitectura_rut"
              value={formData.of_arquitectura_rut}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: 76.123.456-7"
            />
          ) : (
            <span className={styles.value}>{data?.of_arquitectura_rut || 'No especificado'}</span>
          )}
        </div>
        {/* Arquitecto */}
        <div className={styles.infoItem}>
          <span className={styles.label}>Nombre Arquitecto:</span>
          {isEditing ? (
            <input
              type="text"
              name="arquitecto_nombre"
              value={formData.arquitecto_nombre}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: Ana García López"
            />
          ) : (
            <span className={styles.value}>{data?.arquitecto_nombre || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>RUT Arquitecto:</span>
          {isEditing ? (
            <input
              type="text"
              name="arquitecto_rut"
              value={formData.arquitecto_rut}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: 12.345.678-9"
            />
          ) : (
            <span className={styles.value}>{data?.arquitecto_rut || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Email:</span>
          {isEditing ? (
            <input
              type="email"
              name="arquitecto_email"
              value={formData.arquitecto_email}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: ana.garcia@arquitectura.cl"
            />
          ) : (
            <span className={styles.value}>{data?.arquitecto_email || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Teléfono:</span>
          {isEditing ? (
            <input
              type="tel"
              name="arquitecto_telefono"
              value={formData.arquitecto_telefono}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: +56 2 2345 6789"
            />
          ) : (
            <span className={styles.value}>{data?.arquitecto_telefono || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Celular:</span>
          {isEditing ? (
            <input
              type="tel"
              name="arquitecto_celular"
              value={formData.arquitecto_celular}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: +56 9 8765 4321"
            />
          ) : (
            <span className={styles.value}>{data?.arquitecto_celular || 'No especificado'}</span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Patente:</span>
          {isEditing ? (
            <input
              type="text"
              name="arquitecto_patente"
              value={formData.arquitecto_patente}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Ej: 12345"
            />
          ) : (
            <span className={styles.value}>{data?.arquitecto_patente || 'No especificado'}</span>
          )}
        </div>        

        
      </div>
    </>
  );
};

export default ProfessionalsTab;
