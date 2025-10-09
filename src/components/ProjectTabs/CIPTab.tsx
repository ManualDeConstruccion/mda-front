// src/components/ProjectTabs/CIPTab.tsx

import React, { useState } from 'react';
import styles from './CIPTab.module.scss';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  if (isEditing) {
    return (
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <h3>Certificado de Informaciones Previas</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Archivo CIP (PDF)</label>
                <div className={styles.fileUploadContainer}>
                  <label className={styles.fileInputLabel}>
                    Seleccionar archivo PDF
                    <input
                      type="file"
                      name="proyecto_cip"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                  {formData.proyecto_cip && (
                    <div className={styles.fileInfo}>
                      <div className={styles.fileName}>
                        {formData.proyecto_cip.name}
                      </div>
                      <div className={styles.fileSize}>
                        {formatFileSize(formData.proyecto_cip.size)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Fecha del CIP</label>
                <input
                  type="date"
                  name="proyecto_cip_fecha"
                  value={formData.proyecto_cip_fecha}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {previewUrl && (
              <div className={styles.previewContainer}>
                <h4>Vista previa del documento</h4>
                <div className={styles.pdfPreview}>
                  <iframe
                    src={previewUrl}
                    width="100%"
                    height="400px"
                    title="Vista previa del CIP"
                  />
                </div>
              </div>
            )}
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
          <h4>Certificado de Informaciones Previas</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Archivo CIP:</span>
              <div className={styles.value}>
                {data?.proyecto_cip ? (
                  <div className={styles.fileDisplay}>
                    <span className={styles.fileName}>
                      {data.proyecto_cip instanceof File ? data.proyecto_cip.name : 'CIP.pdf'}
                    </span>
                    <span className={styles.fileSize}>
                      {data.proyecto_cip instanceof File ? formatFileSize(data.proyecto_cip.size) : ''}
                    </span>
                  </div>
                ) : (
                  <span className={styles.noFile}>No hay archivo cargado</span>
                )}
              </div>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.label}>Fecha del CIP:</span>
              <span className={styles.value}>
                {data?.proyecto_cip_fecha 
                  ? new Date(data.proyecto_cip_fecha).toLocaleDateString('es-CL')
                  : 'No especificado'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CIPTab;
