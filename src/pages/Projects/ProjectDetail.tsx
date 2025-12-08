// src/pages/Projects/ProjectDetail.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { ProjectNode } from '../../types/project_nodes.types';
import { TypeCode } from '../../types/project_nodes.types';
import styles from './ProjectDetail.module.scss';
import {
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import { getCamposSteps, getMockFieldValue, CampoStep, CampoField } from '../../utils/camposData';
import { useFormulariosFlow } from '../../hooks/useFormulariosFlow';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { TipoFormulario, TipoObra, FormularioItem } from '../../types/formularios.types';
import { useRegions, useComunas } from '../../hooks/useRegionsComunas';
import { useProjectFormData } from '../../hooks/useProjectFormData';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // Obtener el proyecto principal
  const { projects, updateProject, deleteProject } = useProjectNodes<ProjectNode>({
    type: 'project' as TypeCode
  });
  const project = projects?.find(p => p.id === Number(projectId));

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingProjectInfo, setIsEditingProjectInfo] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [tramites, setTramites] = useState<Array<{ id: string; flowType: string; attachments: Record<string, boolean> }>>([]);
  const [activeTab, setActiveTab] = useState<string>('datos');
  const [showFlowTypeSelection, setShowFlowTypeSelection] = useState(false);
  const [isGeneralProject, setIsGeneralProject] = useState(false);

  // Hook para manejar el flujo de formularios
  const { 
    data: formulariosData, 
    loading: loadingFormularios, 
    error: formulariosError,
    flowState, 
    selectTipoFormulario, 
    selectTipoObra, 
    selectFormulario, 
    goBack,
    reset: resetFormulariosFlow
  } = useFormulariosFlow();
  
  // Estado para la información del proyecto (sección de estado)
  const [projectInfoData, setProjectInfoData] = useState({
    description: project?.description || '',
    status: project?.status || 'en_estudio',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    cover_image: null as File | null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(project?.cover_image_url || null);

  // Estado para los datos del formulario de campos
  const [formFieldsData, setFormFieldsData] = useState<Record<string, any>>({});
  // Estado de edición por sección (key: sectionId, value: boolean)
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  
  // Hook para manejar el guardado de datos del formulario
  const { saveSectionData } = useProjectFormData(project?.id || 0);

  // Opciones de estado humanizadas
  const statusOptions = [
    { value: 'en_estudio', label: 'En estudio' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'finalizado', label: 'Finalizado' }
  ];

  // Función para humanizar el estado
  const getStatusLabel = (status: string): string => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  // Hook para regiones y comunas (DEBE estar antes de cualquier return condicional)
  const { regions } = useRegions();
  const selectedRegionId = formFieldsData['proyecto_region'] ? Number(formFieldsData['proyecto_region']) : undefined;
  const { comunas } = useComunas(selectedRegionId);

  // Actualizar projectInfoData cuando cambie el proyecto
  useEffect(() => {
    if (project) {
      setProjectInfoData({
        description: project.description || '',
        status: project.status || 'en_estudio',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        cover_image: null,
      });
      setPreviewUrl(project.cover_image_url || null);
    }
  }, [project]);

  // Opción de proyecto general (siempre primera)
  const proyectoGeneralOption = {
    value: 'proyecto_general',
    label: 'Iniciar un proyecto general sin asociar a un permiso',
    description: 'Proyecto general sin trámite específico'
  };

  // Lista de adjuntos según el tipo de trámite
  const getAttachmentsList = (flowType: string): string[] => {
    return getAttachmentsListForFlowType(flowType);
  };

  const handleProyectoGeneralSelect = () => {
    setIsGeneralProject(true);
    setShowFlowTypeSelection(false);
    setActiveTab('datos');
    resetFormulariosFlow();
  };

  const handleTipoFormularioSelect = (tipoFormulario: TipoFormulario) => {
    selectTipoFormulario(tipoFormulario);
  };

  const handleTipoObraSelect = (tipoObra: TipoObra) => {
    selectTipoObra(tipoObra);
  };

  const handleFormularioSelect = (formulario: FormularioItem) => {
    selectFormulario(formulario);
    
    // Crear nuevo trámite con el formulario seleccionado
    const newTramiteId = `tramite_${Date.now()}`;
    const attachmentsList = ['Formulario municipal']; // Base attachments
    const initialAttachments: Record<string, boolean> = {};
    attachmentsList.forEach(att => {
      initialAttachments[att.toLowerCase().replace(/\s+/g, '_')] = false;
    });
    
    const newTramite = {
      id: newTramiteId,
      flowType: formulario.code, // Usar el código del formulario como identificador
      formName: formulario.name,
      tipoFormulario: flowState.selectedTipoFormulario?.name,
      tipoObra: flowState.selectedTipoObra?.name,
      attachments: initialAttachments
    };
    
    setTramites(prev => [...prev, newTramite]);
    // Si es el primer trámite, ir a la pestaña de datos, sino a la del nuevo trámite
    if (tramites.length === 0) {
      setActiveTab('datos');
    } else {
      setActiveTab(newTramiteId);
    }
    setShowFlowTypeSelection(false);
    resetFormulariosFlow();
  };

  const handleAddNewTramite = () => {
    setShowFlowTypeSelection(true);
    resetFormulariosFlow();
  };

  const toggleAttachment = (tramiteId: string, attachmentName: string) => {
    setTramites(prev => prev.map(tramite => 
      tramite.id === tramiteId
        ? {
            ...tramite,
            attachments: {
              ...tramite.attachments,
              [attachmentName]: !tramite.attachments[attachmentName]
            }
          }
        : tramite
    ));
  };

  const getFlowTypeLabel = (flowType: string): string => {
    // Buscar en los trámites el nombre del formulario
    const tramite = tramites.find(t => t.id === flowType || t.flowType === flowType);
    if (tramite && (tramite as any).formName) {
      return (tramite as any).formName;
    }
    return flowType;
  };

  const getAttachmentsListForFlowType = (flowType: string): string[] => {
    const baseAttachments = ['Formulario municipal'];
    
    switch (flowType) {
      case 'anteproyecto':
        return [...baseAttachments, 'Planos de arquitectura'];
      case 'permiso_edificacion':
        return [...baseAttachments, 'Planos de arquitectura', 'Memoria de cálculo estructural'];
      case 'modificacion_proyecto':
        return [...baseAttachments, 'Planos modificados', 'Listado / memoria de modificaciones'];
      case 'recepcion_definitiva':
        return [...baseAttachments, 'Libro de obras', 'Informe del ITO', 'Certificados de servicios'];
      default:
        return baseAttachments;
    }
  };

  if (!project) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>Proyecto no encontrado.</p>
        <button onClick={() => navigate('/proyectos')}>Volver a Proyectos</button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProjectInfoData(prev => ({ ...prev, cover_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProjectInfoChange = (name: string, value: string | File) => {
    setProjectInfoData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProjectInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Comparar con los valores originales del proyecto
      if (projectInfoData.description !== (project?.description || '')) {
        formDataToSend.append('description', projectInfoData.description);
      }
      
      if (projectInfoData.status !== (project?.status || 'en_estudio')) {
        formDataToSend.append('status', projectInfoData.status);
      }
      
      if (projectInfoData.start_date !== (project?.start_date || '')) {
        if (projectInfoData.start_date) {
          formDataToSend.append('start_date', projectInfoData.start_date);
        }
      }
      
      if (projectInfoData.end_date !== (project?.end_date || '')) {
        if (projectInfoData.end_date) {
          formDataToSend.append('end_date', projectInfoData.end_date);
        }
      }
      
      // Si hay una nueva imagen, siempre se envía
      if (projectInfoData.cover_image instanceof File) {
        formDataToSend.append('cover_image', projectInfoData.cover_image);
      }
      
      // Solo enviar si hay cambios
      if (Array.from(formDataToSend.keys()).length > 0) {
        await updateProject.mutateAsync({ id: project.id, data: formDataToSend });
      }
      
      setIsEditingProjectInfo(false);
    } catch (error) {
      console.error('Error al actualizar la información del proyecto:', error);
    }
  };

  const handleDelete = () => setDeleteModalOpen(true);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormFieldsData(prev => {
      const newData = {
        ...prev,
        [fieldName]: value
      };
      
      // Si cambia la región, limpiar la comuna seleccionada
      if (fieldName === 'proyecto_region') {
        newData.proyecto_comuna = '';
      }
      
      return newData;
    });
  };

  const handleFileFieldChange = (fieldName: string, file: File | null) => {
    setFormFieldsData(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const renderFieldInput = (field: CampoField) => {
    const value = formFieldsData[field.name] ?? '';
    const fieldId = `field_${field.name}`;

    switch (field.type) {
      case 'text':
        return (
          <input
            id={fieldId}
            type="text"
            className={styles.fieldInput}
            value={value as string}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            id={fieldId}
            type="number"
            className={styles.fieldInput}
            value={value as number || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value ? Number(e.target.value) : '')}
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            id={fieldId}
            type="date"
            className={styles.fieldInput}
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );

      case 'year':
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
        return (
          <select
            id={fieldId}
            className={styles.fieldSelect}
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          >
            <option value="">Seleccione un año</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <label className={styles.checkboxLabel}>
            <input
              id={fieldId}
              type="checkbox"
              checked={value as boolean || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              required={field.required}
            />
            <span>{value ? 'Sí' : 'No'}</span>
          </label>
        );

      case 'select':
        return (
          <select
            id={fieldId}
            className={styles.fieldSelect}
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          >
            <option value="">Seleccione una opción</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multi-select':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className={styles.multiSelectContainer}>
            {field.options?.map(option => (
              <label key={option.value} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value);
                    handleFieldChange(field.name, newValues);
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'region-select':
        return (
          <select
            id={fieldId}
            className={styles.fieldSelect}
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          >
            <option value="">Seleccione una región</option>
            {regions.map(region => (
              <option key={region.id} value={region.id}>
                {region.region}
              </option>
            ))}
          </select>
        );

      case 'comuna-select':
        const regionId = field.dependsOn ? Number(formFieldsData[field.dependsOn]) : undefined;
        const availableComunas = regionId ? comunas : [];
        return (
          <select
            id={fieldId}
            className={styles.fieldSelect}
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            disabled={!regionId}
          >
            <option value="">
              {!regionId ? 'Seleccione primero una región' : 'Seleccione una comuna'}
            </option>
            {availableComunas.map(comuna => (
              <option key={comuna.id} value={comuna.id}>
                {comuna.comuna}
              </option>
            ))}
          </select>
        );

      case 'file':
        return (
          <div className={styles.fileInputContainer}>
            <label className={styles.fileInputLabel}>
              {value ? (value as File).name : 'Seleccionar archivo'}
              <input
                id={fieldId}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileFieldChange(field.name, e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                required={field.required && !value}
              />
            </label>
            {value && (
              <button
                type="button"
                className={styles.removeFileButton}
                onClick={() => handleFileFieldChange(field.name, null)}
              >
                Eliminar
              </button>
            )}
          </div>
        );

      default:
        return (
          <input
            id={fieldId}
            type="text"
            className={styles.fieldInput}
            value={value as string || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  const handleSaveSectionFields = async (sectionId: string) => {
    if (!project) return;
    
    try {
      // Filtrar solo los campos que pertenecen a esta sección
      const sectionFields = getCamposSteps().find(step => step.id === sectionId)?.fields || [];
      const sectionData: Record<string, any> = {};
      
      sectionFields.forEach(field => {
        if (field.type !== 'spacer' && formFieldsData.hasOwnProperty(field.name)) {
          sectionData[field.name] = formFieldsData[field.name];
        }
      });
      
      // Guardar los datos usando el hook
      await saveSectionData.mutateAsync({
        sectionId,
        data: sectionData
      });
      
      // Desactivar modo edición
      setEditingSections(prev => ({
        ...prev,
        [sectionId]: false
      }));
    } catch (error) {
      console.error('Error al guardar los datos del formulario:', error);
      // TODO: Mostrar mensaje de error al usuario
    }
  };

  const handleCancelSectionFields = (sectionId: string) => {
    // Restaurar valores de la sección (por ahora no hay valores guardados, así que solo desactivamos edición)
    setEditingSections(prev => ({
      ...prev,
      [sectionId]: false
    }));
  };

  const handleEditSection = (sectionId: string) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionId]: true
    }));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>{project.name}</h1>
          <div className={styles.status}>
            Estado: {project.is_active ? 'Activo' : 'Inactivo'}
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.deleteButton} onClick={handleDelete}>
            Eliminar
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <main className={styles.mainInfo}>
          <section className={styles.infoSection}>
            <div className={styles.sectionHeader}>
              <h2>Estado del Proyecto</h2>
              {!isEditingProjectInfo && (
                <button 
                  className={styles.editInfoButton}
                  onClick={() => setIsEditingProjectInfo(true)}
                >
                  <SettingsIcon /> Editar
                </button>
              )}
            </div>
            
            {isEditingProjectInfo ? (
              <form onSubmit={handleProjectInfoSubmit} className={styles.projectInfoForm}>
                <div className={styles.projectDetails}>
                  <div className={styles.coverImage}>
                    <label className={styles.imageUploadLabel}>
                      {previewUrl ? (
                        <div className={styles.imagePreviewContainer}>
                          <img src={previewUrl} alt="Portada del proyecto" />
                          <div className={styles.imageOverlay}>
                            <span>Cambiar imagen</span>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.noImage}>
                          <span>Haz clic para subir imagen</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  <div className={styles.info}>
                    <div className={styles.infoField}>
                      <label className={styles.infoLabel}>Descripción</label>
                      <textarea
                        className={styles.infoInput}
                        value={projectInfoData.description}
                        onChange={(e) => handleProjectInfoChange('description', e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className={styles.infoField}>
                      <label className={styles.infoLabel}>Estado</label>
                      <select
                        className={styles.infoSelect}
                        value={projectInfoData.status}
                        onChange={(e) => handleProjectInfoChange('status', e.target.value)}
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.infoField}>
                      <label className={styles.infoLabel}>Progreso</label>
                      <p>{project.progress_percent}% completado</p>
                    </div>

                    <div className={styles.infoField}>
                      <label className={styles.infoLabel}>Fecha de inicio</label>
                      <input
                        type="date"
                        className={styles.infoInput}
                        value={projectInfoData.start_date}
                        onChange={(e) => handleProjectInfoChange('start_date', e.target.value)}
                      />
                    </div>

                    <div className={styles.infoField}>
                      <label className={styles.infoLabel}>Fecha de fin</label>
                      <input
                        type="date"
                        className={styles.infoInput}
                        value={projectInfoData.end_date}
                        onChange={(e) => handleProjectInfoChange('end_date', e.target.value)}
                      />
                    </div>

                    <div className={styles.infoField}>
                      <label className={styles.infoLabel}>Creado</label>
                      <p>{new Date(project.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className={styles.infoField}>
                      <label className={styles.infoLabel}>Última actualización</label>
                      <p>{new Date(project.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {isEditingProjectInfo && (
                  <div className={styles.projectInfoActions}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => {
                        setIsEditingProjectInfo(false);
                        // Restaurar valores originales
                        setProjectInfoData({
                          description: project?.description || '',
                          status: project?.status || 'en_estudio',
                          start_date: project?.start_date || '',
                          end_date: project?.end_date || '',
                          cover_image: null,
                        });
                        setPreviewUrl(project?.cover_image_url || null);
                      }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className={styles.saveButton}>
                      Guardar Cambios
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <div className={styles.projectDetails}>
                <div className={styles.coverImage}>
                  {project.cover_image_url ? (
                    <img src={project.cover_image_url} alt="Portada del proyecto" />
                  ) : (
                    <div className={styles.noImage}>Sin imagen de portada</div>
                  )}
                </div>

                <div className={styles.info}>
                  <div className={styles.infoField}>
                    <label className={styles.infoLabel}>Descripción</label>
                    <p>{project.description || 'Sin descripción'}</p>
                  </div>

                  <div className={styles.infoField}>
                    <label className={styles.infoLabel}>Estado</label>
                    <p>{getStatusLabel(project.status)}</p>
                  </div>

                  <div className={styles.infoField}>
                    <label className={styles.infoLabel}>Progreso</label>
                    <p>{project.progress_percent}% completado</p>
                  </div>

                  <div className={styles.infoField}>
                    <label className={styles.infoLabel}>Fecha de inicio</label>
                    <p>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No definida'}</p>
                  </div>

                  <div className={styles.infoField}>
                    <label className={styles.infoLabel}>Fecha de fin</label>
                    <p>{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No definida'}</p>
                  </div>

                  <div className={styles.infoField}>
                    <label className={styles.infoLabel}>Creado</label>
                    <p>{new Date(project.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className={styles.infoField}>
                    <label className={styles.infoLabel}>Última actualización</label>
                    <p>{new Date(project.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Selección de tipo de trámite (si no hay trámites/proyecto general y se está agregando uno nuevo) */}
          {((tramites.length === 0 && !isGeneralProject) || showFlowTypeSelection) ? (
            <section className={styles.flowTypeSelection}>
              {loadingFormularios ? (
                <div className={styles.loadingContainer}>
                  <p>Cargando formularios...</p>
                </div>
              ) : formulariosError ? (
                <div className={styles.errorContainer}>
                  <p>{formulariosError}</p>
                </div>
              ) : (
                <>
                  <div className={styles.flowTypeHeader}>
                    {flowState.step !== 'initial' && (
                      <button
                        type="button"
                        className={styles.backButton}
                        onClick={goBack}
                      >
                        <ArrowBackIcon /> Volver
                      </button>
                    )}
                    <h2 className={styles.flowTypeTitle}>
                      {flowState.step === 'initial' && '¿Qué necesitas hacer?'}
                      {flowState.step === 'tipo_obra' && `Selecciona el tipo de obra - ${flowState.selectedTipoFormulario?.name}`}
                      {flowState.step === 'formulario_especifico' && `Selecciona el formulario - ${flowState.selectedTipoObra?.name}`}
                    </h2>
                    <p className={styles.flowTypeDescription}>
                      {flowState.step === 'initial' && 'Selecciona el tipo de trámite por el cual te gustaría partir.'}
                      {flowState.step === 'tipo_obra' && 'Elige el tipo específico de obra para tu proyecto.'}
                      {flowState.step === 'formulario_especifico' && 'Elige el formulario específico que necesitas.'}
                    </p>
                  </div>
                  
                  <div className={styles.flowTypeGrid}>
                    {/* Paso inicial: Proyecto general + Tipos de formulario */}
                    {flowState.step === 'initial' && (
                      <>
                        {/* Opción de proyecto general */}
                        <button
                          key={proyectoGeneralOption.value}
                          type="button"
                          className={styles.flowTypeCard}
                          onClick={handleProyectoGeneralSelect}
                        >
                          <div className={styles.flowTypeCardContent}>
                            <h3 className={styles.flowTypeCardTitle}>{proyectoGeneralOption.label}</h3>
                            <p className={styles.flowTypeCardDescription}>{proyectoGeneralOption.description}</p>
                          </div>
                          <div className={styles.flowTypeCardArrow}>→</div>
                        </button>
                        
                        {/* Tipos de formulario del JSON */}
                        {formulariosData?.tiposFormulario.map((tipoFormulario: TipoFormulario) => (
                          <button
                            key={tipoFormulario.code}
                            type="button"
                            className={styles.flowTypeCard}
                            onClick={() => handleTipoFormularioSelect(tipoFormulario)}
                          >
                            <div className={styles.flowTypeCardContent}>
                              <h3 className={styles.flowTypeCardTitle}>{tipoFormulario.name}</h3>
                              <p className={styles.flowTypeCardDescription}>
                                {tipoFormulario.tiposObra.length} tipo(s) de obra disponible(s)
                              </p>
                            </div>
                            <div className={styles.flowTypeCardArrow}>→</div>
                          </button>
                        ))}
                      </>
                    )}

                    {/* Paso 2: Tipos de obra */}
                    {flowState.step === 'tipo_obra' && flowState.selectedTipoFormulario && (
                      <>
                        {flowState.selectedTipoFormulario.tiposObra.map((tipoObra: TipoObra) => (
                          <button
                            key={tipoObra.name}
                            type="button"
                            className={styles.flowTypeCard}
                            onClick={() => handleTipoObraSelect(tipoObra)}
                          >
                            <div className={styles.flowTypeCardContent}>
                              <h3 className={styles.flowTypeCardTitle}>{tipoObra.name}</h3>
                              <p className={styles.flowTypeCardDescription}>
                                {tipoObra.formularios.length} formulario(s) disponible(s)
                              </p>
                            </div>
                            <div className={styles.flowTypeCardArrow}>→</div>
                          </button>
                        ))}
                      </>
                    )}

                    {/* Paso 3: Formularios específicos */}
                    {flowState.step === 'formulario_especifico' && flowState.selectedTipoObra && (
                      <>
                        {flowState.selectedTipoObra.formularios.map((formulario: FormularioItem) => (
                          <button
                            key={formulario.code}
                            type="button"
                            className={styles.flowTypeCard}
                            onClick={() => handleFormularioSelect(formulario)}
                          >
                            <div className={styles.flowTypeCardContent}>
                              <h3 className={styles.flowTypeCardTitle}>{formulario.code}</h3>
                              <p className={styles.flowTypeCardDescription}>{formulario.name}</p>
                            </div>
                            <div className={styles.flowTypeCardArrow}>→</div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </>
              )}
            </section>
          ) : (
            /* Sistema de pestañas cuando hay trámites o proyecto general */
            <section className={styles.tabsSection}>
              <div className={styles.tabsHeader}>
                <div className={styles.tabsContainer}>
                  {/* Pestaña de Datos del Proyecto (siempre primera) */}
                  <button
                    className={`${styles.tabButton} ${activeTab === 'datos' ? styles.active : ''}`}
                    onClick={() => setActiveTab('datos')}
                  >
                    Gestión del Proyecto
                  </button>
                  
                  {/* Pestañas de cada trámite */}
                  {tramites.map((tramite) => (
                    <button
                      key={tramite.id}
                      className={`${styles.tabButton} ${activeTab === tramite.id ? styles.active : ''}`}
                      onClick={() => setActiveTab(tramite.id)}
                    >
                      {getFlowTypeLabel(tramite.flowType)}
                    </button>
                  ))}
                </div>
                
                {/* Botón para agregar nuevo trámite */}
                <button
                  className={styles.addTramiteButton}
                  onClick={handleAddNewTramite}
                >
                  + Agregar nuevo trámite
                </button>
              </div>

              <div className={styles.tabContent}>
                {/* Contenido de pestaña Datos del Proyecto */}
                {activeTab === 'datos' && (
                  <div className={styles.datosTab}>
                    <div className={styles.datosTabHeader}>
                      <h2>Datos del Proyecto</h2>
                    </div>
                    
                    <div className={styles.dataSectionsList}>
                        {getCamposSteps().map((step: CampoStep) => (
                          <div key={step.id} className={styles.dataSectionCard}>
                            <div 
                              className={styles.dataSectionHeader}
                              onClick={() => toggleSection(step.id)}
                            >
                              <div className={styles.dataSectionHeaderContent}>
                                <h3 className={styles.dataSectionTitle}>{step.label}</h3>
                                {step.description && (
                                  <p className={styles.dataSectionDescription}>{step.description}</p>
                                )}
                              </div>
                              <button 
                                className={styles.dataSectionToggle}
                                aria-label={expandedSections[step.id] ? 'Colapsar' : 'Expandir'}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSection(step.id);
                                }}
                              >
                                {expandedSections[step.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </button>
                            </div>

                            {expandedSections[step.id] && (
                              <form 
                                className={styles.dataSectionContent}
                                onSubmit={(e) => { 
                                  e.preventDefault(); 
                                  handleSaveSectionFields(step.id); 
                                }}
                              >
                                {!editingSections[step.id] && (
                                  <div className={styles.sectionEditHeader}>
                                    <button
                                      className={styles.editSectionButton}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleEditSection(step.id);
                                      }}
                                      type="button"
                                    >
                                      <SettingsIcon /> Editar
                                    </button>
                                  </div>
                                )}
                                
                                <div className={styles.fieldsGrid}>
                                  {step.fields.map((field: CampoField) => {
                                    // Si es un spacer, renderizar solo un div vacío
                                    if (field.type === 'spacer') {
                                      return (
                                        <div 
                                          key={field.name} 
                                          className={styles.fieldSpacer}
                                          style={{
                                            gridColumn: `span ${field.span || 1}`
                                          }}
                                        />
                                      );
                                    }
                                    
                                    return (
                                      <div 
                                        key={field.name} 
                                        className={styles.fieldItem}
                                        style={{
                                          gridColumn: `span ${field.span || 1}`
                                        }}
                                      >
                                        <label htmlFor={`field_${field.name}`} className={styles.fieldLabel}>
                                          {field.label}
                                          {field.required && <span className={styles.required}>*</span>}
                                        </label>
                                        <div className={styles.fieldInputWrapper}>
                                          {editingSections[step.id] ? (
                                            renderFieldInput(field)
                                          ) : (
                                            <div className={styles.fieldValue}>
                                              {(() => {
                                                const fieldValue = formFieldsData[field.name];
                                                
                                                if (!fieldValue) {
                                                  return '';
                                                }
                                                
                                                switch (field.type) {
                                                  case 'file':
                                                    return (fieldValue as File)?.name || 'Archivo seleccionado';
                                                  case 'boolean':
                                                    return fieldValue ? 'Sí' : 'No';
                                                  case 'multi-select':
                                                    if (Array.isArray(fieldValue)) {
                                                      return fieldValue.length > 0 
                                                        ? fieldValue.join(', ')
                                                        : 'No seleccionado';
                                                    }
                                                    return 'No seleccionado';
                                                  case 'region-select':
                                                    const region = regions.find(r => r.id === Number(fieldValue));
                                                    return region?.region || 'No seleccionado';
                                                  case 'comuna-select':
                                                    const comuna = comunas.find(c => c.id === Number(fieldValue));
                                                    return comuna?.comuna || 'No seleccionado';
                                                  case 'date':
                                                    return new Date(fieldValue as string).toLocaleDateString();
                                                  case 'year':
                                                    return String(fieldValue);
                                                  default:
                                                    return String(fieldValue);
                                                }
                                              })()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {editingSections[step.id] && (
                                  <div className={styles.sectionFieldsActions}>
                                    <button
                                      type="button"
                                      className={styles.cancelButton}
                                      onClick={() => handleCancelSectionFields(step.id)}
                                      disabled={saveSectionData.isPending}
                                    >
                                      Cancelar
                                    </button>
                                    <button 
                                      type="submit" 
                                      className={styles.saveButton}
                                      disabled={saveSectionData.isPending}
                                    >
                                      {saveSectionData.isPending ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                    {saveSectionData.isError && (
                                      <span className={styles.errorMessage}>
                                        Error al guardar. Por favor, intenta nuevamente.
                                      </span>
                                    )}
                                  </div>
                                )}
                              </form>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Contenido de cada pestaña de trámite */}
                {tramites.map((tramite) => (
                  activeTab === tramite.id && (
                    <div key={tramite.id} className={styles.tramiteTab}>
                      <div className={styles.selectedFlowType}>
                        <h3>Tipo de trámite</h3>
                        <p className={styles.selectedFlowTypeLabel}>
                          {getFlowTypeLabel(tramite.flowType)}
                        </p>
                      </div>

                      <div className={styles.attachmentsSection}>
                        <div className={styles.attachmentsHeader}>
                          <div>
                            <h3>Documentos adjuntos</h3>
                            <p className={styles.attachmentsDescription}>
                              Marca los documentos que ya has preparado para este trámite
                            </p>
                          </div>
                          {(() => {
                            const attachmentsList = getAttachmentsList(tramite.flowType);
                            const total = attachmentsList.length;
                            const completed = attachmentsList.filter(att => {
                              const key = att.toLowerCase().replace(/\s+/g, '_');
                              return tramite.attachments[key];
                            }).length;
                            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                            
                            return (
                              <div className={styles.progressContainer}>
                                <div className={styles.progressInfo}>
                                  <span className={styles.progressLabel}>Progreso</span>
                                  <span className={styles.progressPercentage}>{percentage}%</span>
                                </div>
                                <div className={styles.progressBar}>
                                  <div 
                                    className={styles.progressFill}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <p className={styles.progressText}>
                                  {completed} de {total} documentos completados
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                        <div className={styles.attachmentsList}>
                          {getAttachmentsList(tramite.flowType).map((attachment) => {
                            const attachmentKey = attachment.toLowerCase().replace(/\s+/g, '_');
                            return (
                              <div
                                key={attachment}
                                className={styles.attachmentItem}
                                onClick={() => toggleAttachment(tramite.id, attachmentKey)}
                              >
                                <div className={styles.attachmentCheckbox}>
                                  {tramite.attachments[attachmentKey] ? (
                                    <CheckCircleIcon className={styles.checkIcon} />
                                  ) : (
                                    <RadioButtonUncheckedIcon className={styles.uncheckIcon} />
                                  )}
                                </div>
                                <span className={styles.attachmentLabel}>{attachment}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        title="Eliminar proyecto"
        message="¿Estás seguro de que deseas eliminar este proyecto? Esta acción es irreversible."
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          try {
            await deleteProject.mutateAsync(project.id);
            setDeleteModalOpen(false);
            navigate('/proyectos');
          } catch (error) {
            console.error('Error al eliminar el proyecto:', error);
            setDeleteModalOpen(false);
          }
        }}
      />
    </div>
  );
};

export default ProjectDetail;
