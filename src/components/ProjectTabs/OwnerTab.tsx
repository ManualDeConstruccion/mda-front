// src/components/ProjectTabs/OwnerTab.tsx

import React, { useState } from 'react';
import styles from './OwnerTab.module.scss';

export interface OwnerData {
  // Información personal
  nombre: string;
  rut: string;
  email: string;
  telefono: string;
  celular: string;
  responsabilidad: string;
  
  // Dirección
  direccion: string;
  direccion_comuna: string;
  direccion_depto: string;
  direccion_localidad: string;
  direccion_numero: string;
  
  // Representante legal
  rep_legal: string;
  rep_legal_rut: string;
  
  // Escritura representante
  escritura_representante: string;
  escritura_representante_2: string;
  escritura_representante_fecha: string;
  escritura_representante_fecha_2: string;
  escritura_representante_notario: string;
  
  // Otros instrumentos
  otro_instrumento_1: string;
  otro_instrumento_2: string;
  otro_instrumento_3: string;
  otro_instrumento_fecha: string;
  otro_instrumento_mediante: string;
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
    responsabilidad: data?.responsabilidad || '',
    direccion: data?.direccion || '',
    direccion_comuna: data?.direccion_comuna || '',
    direccion_depto: data?.direccion_depto || '',
    direccion_localidad: data?.direccion_localidad || '',
    direccion_numero: data?.direccion_numero || '',
    rep_legal: data?.rep_legal || '',
    rep_legal_rut: data?.rep_legal_rut || '',
    escritura_representante: data?.escritura_representante || '',
    escritura_representante_2: data?.escritura_representante_2 || '',
    escritura_representante_fecha: data?.escritura_representante_fecha || '',
    escritura_representante_fecha_2: data?.escritura_representante_fecha_2 || '',
    escritura_representante_notario: data?.escritura_representante_notario || '',
    otro_instrumento_1: data?.otro_instrumento_1 || '',
    otro_instrumento_2: data?.otro_instrumento_2 || '',
    otro_instrumento_3: data?.otro_instrumento_3 || '',
    otro_instrumento_fecha: data?.otro_instrumento_fecha || '',
    otro_instrumento_mediante: data?.otro_instrumento_mediante || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      responsabilidad: '',
      direccion: '',
      direccion_comuna: '',
      direccion_depto: '',
      direccion_localidad: '',
      direccion_numero: '',
      rep_legal: '',
      rep_legal_rut: '',
      escritura_representante: '',
      escritura_representante_2: '',
      escritura_representante_fecha: '',
      escritura_representante_fecha_2: '',
      escritura_representante_notario: '',
      otro_instrumento_1: '',
      otro_instrumento_2: '',
      otro_instrumento_3: '',
      otro_instrumento_fecha: '',
      otro_instrumento_mediante: '',
    });
    onEditChange?.(false);
  };

  if (isEditing) {
    return (
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h3>Información Personal</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre Completo</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan Pérez González"
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
                  placeholder="Ej: juan.perez@email.com"
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
                <label>Responsabilidad</label>
                <input
                  type="text"
                  name="responsabilidad"
                  value={formData.responsabilidad}
                  onChange={handleInputChange}
                  placeholder="Ej: Propietario"
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
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="Ej: Av. Principal"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Número</label>
                <input
                  type="text"
                  name="direccion_numero"
                  value={formData.direccion_numero}
                  onChange={handleInputChange}
                  placeholder="Ej: 123"
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
                  name="direccion_comuna"
                  value={formData.direccion_comuna}
                  onChange={handleInputChange}
                  placeholder="Ej: Las Condes"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Localidad</label>
                <input
                  type="text"
                  name="direccion_localidad"
                  value={formData.direccion_localidad}
                  onChange={handleInputChange}
                  placeholder="Ej: San Carlos de Apoquindo"
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Representante Legal</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre Representante Legal</label>
                <input
                  type="text"
                  name="rep_legal"
                  value={formData.rep_legal}
                  onChange={handleInputChange}
                  placeholder="Ej: María González López"
                />
              </div>
              <div className={styles.formGroup}>
                <label>RUT Representante Legal</label>
                <input
                  type="text"
                  name="rep_legal_rut"
                  value={formData.rep_legal_rut}
                  onChange={handleInputChange}
                  placeholder="Ej: 98.765.432-1"
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Escritura Representante</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Escritura Representante</label>
                <input
                  type="text"
                  name="escritura_representante"
                  value={formData.escritura_representante}
                  onChange={handleInputChange}
                  placeholder="Ej: Escritura N° 1234"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Escritura Representante 2</label>
                <input
                  type="text"
                  name="escritura_representante_2"
                  value={formData.escritura_representante_2}
                  onChange={handleInputChange}
                  placeholder="Ej: Escritura N° 5678 (opcional)"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha Escritura</label>
                <input
                  type="date"
                  name="escritura_representante_fecha"
                  value={formData.escritura_representante_fecha}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha Escritura 2</label>
                <input
                  type="date"
                  name="escritura_representante_fecha_2"
                  value={formData.escritura_representante_fecha_2}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Notario</label>
                <input
                  type="text"
                  name="escritura_representante_notario"
                  value={formData.escritura_representante_notario}
                  onChange={handleInputChange}
                  placeholder="Ej: Notario Juan Silva"
                />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Otros Instrumentos</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Otro Instrumento 1</label>
                <input
                  type="text"
                  name="otro_instrumento_1"
                  value={formData.otro_instrumento_1}
                  onChange={handleInputChange}
                  placeholder="Ej: Contrato de compraventa"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Otro Instrumento 2</label>
                <input
                  type="text"
                  name="otro_instrumento_2"
                  value={formData.otro_instrumento_2}
                  onChange={handleInputChange}
                  placeholder="Ej: Poder notarial"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Otro Instrumento 3</label>
                <input
                  type="text"
                  name="otro_instrumento_3"
                  value={formData.otro_instrumento_3}
                  onChange={handleInputChange}
                  placeholder="Ej: Testamento"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha Otro Instrumento</label>
                <input
                  type="date"
                  name="otro_instrumento_fecha"
                  value={formData.otro_instrumento_fecha}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Mediante</label>
                <input
                  type="text"
                  name="otro_instrumento_mediante"
                  value={formData.otro_instrumento_mediante}
                  onChange={handleInputChange}
                  placeholder="Ej: Mediante escritura pública"
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
          <h4>Información Personal</h4>
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
              <span className={styles.label}>Responsabilidad:</span>
              <span className={styles.value}>{data?.responsabilidad || 'No especificado'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4>Dirección</h4>
          <div className={styles.infoGrid}>
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
              <span className={styles.value}>{data?.direccion_comuna || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Localidad:</span>
              <span className={styles.value}>{data?.direccion_localidad || 'No especificado'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4>Representante Legal</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Nombre:</span>
              <span className={styles.value}>{data?.rep_legal || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>RUT:</span>
              <span className={styles.value}>{data?.rep_legal_rut || 'No especificado'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4>Escritura Representante</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Escritura:</span>
              <span className={styles.value}>{data?.escritura_representante || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Escritura 2:</span>
              <span className={styles.value}>{data?.escritura_representante_2 || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Fecha:</span>
              <span className={styles.value}>
                {data?.escritura_representante_fecha 
                  ? new Date(data.escritura_representante_fecha).toLocaleDateString('es-CL')
                  : 'No especificado'
                }
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Fecha 2:</span>
              <span className={styles.value}>
                {data?.escritura_representante_fecha_2 
                  ? new Date(data.escritura_representante_fecha_2).toLocaleDateString('es-CL')
                  : 'No especificado'
                }
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Notario:</span>
              <span className={styles.value}>{data?.escritura_representante_notario || 'No especificado'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4>Otros Instrumentos</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Instrumento 1:</span>
              <span className={styles.value}>{data?.otro_instrumento_1 || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Instrumento 2:</span>
              <span className={styles.value}>{data?.otro_instrumento_2 || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Instrumento 3:</span>
              <span className={styles.value}>{data?.otro_instrumento_3 || 'No especificado'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Fecha:</span>
              <span className={styles.value}>
                {data?.otro_instrumento_fecha 
                  ? new Date(data.otro_instrumento_fecha).toLocaleDateString('es-CL')
                  : 'No especificado'
                }
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Mediante:</span>
              <span className={styles.value}>{data?.otro_instrumento_mediante || 'No especificado'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerTab;
