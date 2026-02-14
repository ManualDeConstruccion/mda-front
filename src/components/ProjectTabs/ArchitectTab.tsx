// src/components/ProjectTabs/ArchitectTab.tsx

import React, { useState } from 'react';
import styles from './ProjectTabs.module.scss';

export interface ArchitectData {
  // Información del arquitecto
  nombre: string;
  rut: string;
  email: string;
  telefono: string;
  celular: string;
  patente: string;
  aa_patente_arq: string;
  
  // Oficina de arquitectura
  razon_social: string;
  rut_oficina: string;
  direccion: string;
  direccion_numero: string;
  direccion_depto: string;
  comuna: string;
}

interface ArchitectTabProps {
  data?: ArchitectData;
  onSave?: (data: ArchitectData) => void;
  isEditing?: boolean;
  onEditChange?: (editing: boolean) => void;
}

const ArchitectTab: React.FC<ArchitectTabProps> = ({
  data,
  onSave,
  isEditing = false,
  onEditChange
}) => {
  const [formData, setFormData] = useState<ArchitectData>({
    nombre: data?.nombre || '',
    rut: data?.rut || '',
    email: data?.email || '',
    telefono: data?.telefono || '',
    celular: data?.celular || '',
    patente: data?.patente || '',
    aa_patente_arq: data?.aa_patente_arq || '',
    razon_social: data?.razon_social || '',
    rut_oficina: data?.rut_oficina || '',
    direccion: data?.direccion || '',
    direccion_numero: data?.direccion_numero || '',
    direccion_depto: data?.direccion_depto || '',
    comuna: data?.comuna || '',
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
      nombre: '',
      rut: '',
      email: '',
      telefono: '',
      celular: '',
      patente: '',
      aa_patente_arq: '',
      razon_social: '',
      rut_oficina: '',
      direccion: '',
      direccion_numero: '',
      direccion_depto: '',
      comuna: '',
    });
    onEditChange?.(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h3>Información del Arquitecto</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre Completo</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Carlos Mendoza Silva"
                />
              </div>
              <div className={styles.formGroup}>
                <label>RUT</label>
                <input
                  type="text"
                  name="rut"
                  value={formData.rut}
                  onChange={handleInputChange}
                  placeholder="Ej: 12.345.678-9"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ej: carlos.mendoza@arquitectos.cl"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Ej: +56 2 2345 6789"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Celular</label>
                <input
                  type="tel"
                  name="celular"
                  value={formData.celular}
                  onChange={handleInputChange}
                  placeholder="Ej: +56 9 8765 4321"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Patente</label>
                <input
                  type="text"
                  name="patente"
                  value={formData.patente}
                  onChange={handleInputChange}
                  placeholder="Ej: 12345"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Patente AA</label>
                <input
                  type="text"
                  name="aa_patente_arq"
                  value={formData.aa_patente_arq}
                  onChange={handleInputChange}
                  placeholder="Ej: AA-12345"
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Oficina de Arquitectura</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Razón Social</label>
                <input
                  type="text"
                  name="razon_social"
                  value={formData.razon_social}
                  onChange={handleInputChange}
                  placeholder="Ej: Estudio Mendoza Arquitectos Ltda."
                />
              </div>
              <div className={styles.formGroup}>
                <label>RUT Oficina</label>
                <input
                  type="text"
                  name="rut_oficina"
                  value={formData.rut_oficina}
                  onChange={handleInputChange}
                  placeholder="Ej: 76.123.456-7"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Calle</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="Ej: Av. Providencia"
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
                  name="direccion_depto"
                  value={formData.direccion_depto}
                  onChange={handleInputChange}
                  placeholder="Ej: 45 (opcional)"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Comuna</label>
                <input
                  type="text"
                  name="comuna"
                  value={formData.comuna}
                  onChange={handleInputChange}
                  placeholder="Ej: Providencia"
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
    );
  }

  return (
    <>
      <div className={styles.header}>
        <button 
          onClick={() => onEditChange?.(true)}
          className={styles.editButton}
        >
          Editar Información
        </button>
      </div>

      <h4>Información del Arquitecto</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Nombre:</span>
              <span className={styles.value}>{data?.nombre || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>RUT:</span>
              <span className={styles.value}>{data?.rut || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{data?.email || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Teléfono:</span>
              <span className={styles.value}>{data?.telefono || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Celular:</span>
              <span className={styles.value}>{data?.celular || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Patente:</span>
              <span className={styles.value}>{data?.patente || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Patente AA:</span>
              <span className={styles.value}>{data?.aa_patente_arq || 'No especificado'}</span>
            </div>
          </div>

      <h4>Oficina de Arquitectura</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Razón Social:</span>
              <span className={styles.value}>{data?.razon_social || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>RUT Oficina:</span>
              <span className={styles.value}>{data?.rut_oficina || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Calle:</span>
              <span className={styles.value}>{data?.direccion || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Número:</span>
              <span className={styles.value}>{data?.direccion_numero || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Depto:</span>
              <span className={styles.value}>{data?.direccion_depto || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Comuna:</span>
              <span className={styles.value}>{data?.comuna || 'No especificado'}</span>
            </div>
          </div>
    </>
  );
};

export default ArchitectTab;
