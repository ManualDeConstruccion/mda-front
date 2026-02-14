// src/components/ProjectTabs/CIPTab.tsx

import React, { useState } from 'react';
import styles from './ProjectTabs.module.scss';

export interface CIPData {
  proyecto_cip: File | null;
  proyecto_cip_fecha: string;
}

interface CIPTabProps {
  data?: CIPData;
  onSave?: (data: CIPData) => void;
  isEditing?: boolean;
  onEditChange?: (editing: boolean) => void;
}

const CIPTab: React.FC<CIPTabProps> = ({
  data,
  onSave,
  isEditing = false,
  onEditChange
}) => {
  const [formData, setFormData] = useState<CIPData>({
    proyecto_cip: data?.proyecto_cip || null,
    proyecto_cip_fecha: data?.proyecto_cip_fecha || '',
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, proyecto_cip: file }));
      
      // Crear preview para PDF
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSave = () => {
    onSave?.(formData);
    onEditChange?.(false);
  };

  const handleCancel = () => {
    setFormData(data || {
      proyecto_cip: null,
      proyecto_cip_fecha: '',
    });
    setPreviewUrl(null);
    onEditChange?.(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <div className={styles.header}>
        <p>Subir el Certificado de Informaciones Previas</p>
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
          <span className={styles.label}>Archivo CIP:</span>
          {isEditing ? (
            <input
              type="file"
              name="proyecto_cip"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className={styles.input}
            />
          ) : (
            <span className={styles.value}>
              {data?.proyecto_cip ? (
                typeof data.proyecto_cip === 'string' 
                  ? data.proyecto_cip 
                  : data.proyecto_cip.name
              ) : (
                'No hay archivo cargado'
              )}
            </span>
          )}
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>Fecha del CIP:</span>
          {isEditing ? (
            <input
              type="date"
              name="proyecto_cip_fecha"
              value={formData.proyecto_cip_fecha}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span className={styles.value}>
              {data?.proyecto_cip_fecha 
                ? new Date(data.proyecto_cip_fecha).toLocaleDateString('es-CL')
                : 'No especificado'
              }
            </span>
          )}
        </div>
      </div>

      {isEditing && formData.proyecto_cip && (
        <div className={styles.infoItem}>
          <span className={styles.label}>Archivo seleccionado:</span>
          <span className={styles.value}>
            {formData.proyecto_cip.name} ({formatFileSize(formData.proyecto_cip.size)})
          </span>
        </div>
      )}

      {isEditing && previewUrl && (
        <div style={{ marginTop: '1rem' }}>
          <iframe
            src={previewUrl}
            width="100%"
            height="400px"
            title="Vista previa del CIP"
            style={{ border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      )}
    </>
  );
};

export default CIPTab;
