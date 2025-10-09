// src/pages/ArchitectureProjects/CreateArchitectureProject.tsx

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { TypeCode } from '../../types/project_nodes.types';
import CharacterCounter from '../../components/common/CharacterCounter/CharacterCounter';
import { CHARACTER_LIMITS } from '../../utils/validation';
import styles from './CreateArchitectureProject.module.scss';

const CreateArchitectureProject: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { createProject } = useProjectNodes();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    type: 'architecture_subproject' as TypeCode,
    status: 'en_estudio' as const,
    start_date: '',
    parent: Number(projectId) || null,
    tipo_tramite: '',
    tipo_tramite_otro: '',
  });

  const [showOtroTramite, setShowOtroTramite] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    
    // Si se cambia el tipo de trámite, verificar si es "otro"
    if (name === 'tipo_tramite') {
      setShowOtroTramite(value === 'otro');
      if (value !== 'otro') {
        // Limpiar el campo "otro" si no se seleccionó "otro"
        setFormData(prev => ({
          ...prev,
          tipo_tramite: value,
          tipo_tramite_otro: '',
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCharacterCounterChange = (name: string, value: string) => {
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar nombre (obligatorio)
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proyecto es obligatorio';
    }

    // Validar tipo de trámite (obligatorio)
    if (!formData.tipo_tramite) {
      newErrors.tipo_tramite = 'Debe seleccionar un tipo de trámite';
    }

    // Validar tipo de trámite "otro" (obligatorio si se selecciona "otro")
    if (formData.tipo_tramite === 'otro' && !formData.tipo_tramite_otro.trim()) {
      newErrors.tipo_tramite_otro = 'Debe especificar el tipo de trámite personalizado';
    }

    // Validar estado (obligatorio)
    if (!formData.status) {
      newErrors.status = 'Debe seleccionar un estado inicial';
    }

    // Validar fecha de inicio (obligatorio)
    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    // Validar formulario antes de enviar
    if (!validateForm()) {
      return;
    }

    try {
      await createProject.mutateAsync({
        ...formData,
        parent: Number(projectId),
        type: 'architecture_subproject', // aseguramos el tipo correcto
      });
      navigate(`/proyectos/${projectId}`);
    } catch (error) {
      console.error('Error al crear el proyecto de arquitectura:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Crear Nuevo Proyecto de Arquitectura</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <CharacterCounter
            name="name"
            label="Nombre del Proyecto"
            value={formData.name}
            onChange={(value) => handleCharacterCounterChange('name', value)}
            maxLength={CHARACTER_LIMITS.PROJECT_TITLE}
            required={true}
          />
          {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
        </div>

        <div className={styles.formGroup}>
          <CharacterCounter
            name="description"
            label="Descripción"
            value={formData.description}
            onChange={(value) => handleCharacterCounterChange('description', value)}
            maxLength={CHARACTER_LIMITS.PROJECT_DESCRIPTION}
            multiline={true}
            required={false}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tipo_tramite">
            Tipo de Trámite
            <span className={styles.requiredLabel}>(obligatorio)</span>
          </label>
          <select
            id="tipo_tramite"
            name="tipo_tramite"
            value={formData.tipo_tramite}
            onChange={handleInputChange}
            required
          >
            <option value="">Seleccione un tipo de trámite</option>
            <option value="2-1.1">2-1.1 - Obra Nueva: Aprobación de Anteproyecto de Obras de Edificación</option>
            <option value="2-3.1">2-3.1 - Obra Nueva: Solicitud Permiso de Edificación</option>
            <option value="2-5.1">2-5.1 - Obra Nueva: Solicitud Modificación de Proyecto de Edificación</option>
            <option value="2-7.1">2-7.1 - Obra Nueva: Solicitud Recepción Definitiva de Obras de Edificación</option>
            <option value="otro">Otro</option>
          </select>
          {errors.tipo_tramite && <span className={styles.errorMessage}>{errors.tipo_tramite}</span>}
        </div>

        {showOtroTramite && (
          <div className={styles.formGroup}>
            <label htmlFor="tipo_tramite_otro">
              Especifique el tipo de trámite
              <span className={styles.requiredLabel}>(obligatorio)</span>
            </label>
            <input
              type="text"
              id="tipo_tramite_otro"
              name="tipo_tramite_otro"
              value={formData.tipo_tramite_otro}
              onChange={handleInputChange}
              placeholder="Ingrese el tipo de trámite personalizado"
              required
            />
            {errors.tipo_tramite_otro && <span className={styles.errorMessage}>{errors.tipo_tramite_otro}</span>}
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="status">
            Estado Inicial
            <span className={styles.requiredLabel}>(obligatorio)</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
          >
            <option value="en_estudio">En Estudio</option>
            <option value="pendiente">Pendiente</option>
            <option value="finalizado">Finalizado</option>
          </select>
          {errors.status && <span className={styles.errorMessage}>{errors.status}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="start_date">
            Fecha de Inicio
            <span className={styles.requiredLabel}>(obligatorio)</span>
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleInputChange}
            required
          />
          {errors.start_date && <span className={styles.errorMessage}>{errors.start_date}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
            />
            Proyecto Activo
          </label>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => navigate(`/proyectos/${projectId}`)}
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button type="submit" className={styles.saveButton}>
            Crear Proyecto de Arquitectura
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateArchitectureProject;
