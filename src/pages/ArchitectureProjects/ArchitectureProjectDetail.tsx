import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { ProjectNode, TypeCode } from '../../types/project_nodes.types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Home as HomeIcon,
  AttachMoney as BudgetIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import ProjectDetailsSection, { GeneralData } from '../../components/ProjectDetailsSection/ProjectDetailsSection';
import Breadcrumb from '../../components/Breadcrumb/Breadcrumb';
import SurfacesTab from '../../components/SurfacesTab/SurfacesTab';
import { PropertyData, CIPData, OwnerData, ProfessionalsData } from '../../types/property.types';
import { ProjectProvider } from '../../context/ProjectContext';
import ProjectVersionSelector from '../../components/ProjectVersionSelector/ProjectVersionSelector';
import SectionTreeWithModes from '../../components/Admin/SectionTreeWithModes';
import type { FormParameterCategory, UIAlert } from '../../components/Admin/SectionTreeWithModes';
import { api } from '../../services/api';
import styles from './ArchitectureProjectDetail.module.scss';
import ListadoDeAntecedentes from './ListadoDeAntecedentes';

const ArchitectureProjectDetail: React.FC = () => {
  const { projectId, architectureId } = useParams<{ projectId: string; architectureId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [activeStageId, setActiveStageId] = useState<number | string | null>(null);
  
  // Hook para generación asíncrona de PDFs
  const {
    generatePDF,
    status: pdfStatus,
    progress: pdfProgress,
    error: pdfError,
    isGenerating: generatingPDF,
  } = usePDFGeneration();
  
  // Etapa fija para la maqueta
  const fixedStage = {
    id: 'fixed-2-1-1',
    name: '2-1.1 Obra Nueva'
  };
  const [generalData, setGeneralData] = useState<GeneralData | undefined>(undefined);
  const [propertyData, setPropertyData] = useState<PropertyData | undefined>(undefined);
  const [cipData, setCipData] = useState<CIPData | undefined>(undefined);
  const [ownerData, setOwnerData] = useState<OwnerData | undefined>(undefined);
  const [professionalsData, setProfessionalsData] = useState<ProfessionalsData | undefined>(undefined);

  // Estados para formulario dinámico
  const [formValues, setFormValues] = useState<Record<string, Record<string, any>>>({}); // { categoryId: { paramCode: value } }
  const [categoryAlerts, setCategoryAlerts] = useState<Record<number, UIAlert[]>>({}); // Alertas de validación por categoría
  // Modo por sección: { sectionId: 'view' | 'editable' }
  const [sectionModes, setSectionModes] = useState<Record<number, 'view' | 'editable'>>({});
  const queryClient = useQueryClient();
  const location = useLocation();

  // Estado para mantener la sección activa (expandida)
  const [activeSectionId, setActiveSectionId] = useState<number | undefined>(undefined);

  // Obtener activeSectionId del hash de la URL si existe (ej: #section-1)
  useEffect(() => {
    if (location.hash) {
      const sectionIdFromHash = parseInt(location.hash.replace('#section-', ''), 10);
      if (!isNaN(sectionIdFromHash)) {
        setActiveSectionId(sectionIdFromHash);
      }
    }
  }, [location.hash]);
  
  // Handler para cambiar el modo de una sección específica
  const handleSectionModeChange = useCallback((sectionId: number, mode: 'view' | 'editable') => {
    setSectionModes(prev => {
      const newModes = mode === 'view'
        ? (() => {
            const updated = { ...prev };
            delete updated[sectionId];
            const updatedAny = updated as Record<string | number, 'view' | 'editable'>;
            delete updatedAny[String(sectionId)];
            return updated;
          })()
        : {
            ...prev,
            [sectionId]: mode,
          };
      return newModes;
    });
  }, []);

  // Obtener el proyecto principal para el breadcrumb
  const { projects: mainProjects } = useProjectNodes<ProjectNode>({ type: 'project' as TypeCode });
  const mainProject = mainProjects?.find(p => p.id === Number(projectId));

  const { projects: architectureProjects, deleteProject } = useProjectNodes<ProjectNode>({ type: 'architecture_subproject' });
  const architectureProject = architectureProjects?.find(p => p.id === Number(architectureId));
  
  // Obtener project_type_id del architectureProject
  // Necesitamos hacer fetch del nodo completo para obtener architecture_project_type
  const { data: fullArchitectureProject, error: projectError, isLoading: isLoadingProject } = useQuery<ProjectNode & { architecture_project_type?: number }>({
    queryKey: ['architecture-project', architectureId],
    queryFn: async () => {
      if (!architectureId) return null;
      const response = await api.get(`projects/project-nodes/${architectureId}/`);
      return response.data;
    },
    enabled: !!architectureId && !!accessToken,
  });
  
  // Log errores cuando ocurran
  useEffect(() => {
    if (projectError) {
      console.error('Error loading architecture project:', projectError);
    }
  }, [projectError]);
  
  // Obtener el project_type_id - puede venir como número (ID) o como objeto con id
  const projectTypeId = 
    typeof (fullArchitectureProject as any)?.architecture_project_type === 'number'
      ? (fullArchitectureProject as any)?.architecture_project_type
      : typeof (fullArchitectureProject as any)?.architecture_project_type === 'object' && (fullArchitectureProject as any)?.architecture_project_type?.id
      ? (fullArchitectureProject as any)?.architecture_project_type.id
      : (fullArchitectureProject as any)?.architecture_project_type || null;

  // Función para obtener todas las secciones de forma plana
  const getAllSections = useCallback((sections: FormParameterCategory[]): FormParameterCategory[] => {
    let result: FormParameterCategory[] = [];
    sections.forEach((section) => {
      result.push(section);
      if (section.subcategories) {
        result = result.concat(getAllSections(section.subcategories));
      }
    });
    return result;
  }, []);

  // Interface para la estructura del formulario
  interface FormStructure {
    project_type: {
      id: number;
      code: string;
      name: string;
      description?: string;
      category?: {
        id: number;
        code: string;
        name: string;
        full_path: string;
      };
    };
    sections: FormParameterCategory[];
  }

  // Cargar estructura del formulario
  const { data: formStructure, isLoading: isLoadingForm, error: formStructureError } = useQuery<FormStructure>({
    queryKey: ['form-structure', projectTypeId],
    queryFn: async () => {
      if (!projectTypeId) throw new Error('No project type ID');
      const response = await api.get(`architecture/architecture-project-types/${projectTypeId}/form_structure/`);
      return response.data;
    },
    enabled: !!projectTypeId && !!accessToken && !!architectureId,
  });
  
  // Log errores cuando ocurran
  useEffect(() => {
    if (formStructureError) {
      console.error('Error loading form structure:', formStructureError);
      console.error('Project Type ID:', projectTypeId);
      console.error('Architecture ID:', architectureId);
    }
  }, [formStructureError, projectTypeId, architectureId]);

  // Cargar valores de una categoría (lazy loading cuando se expande)
  const loadCategoryValues = useCallback(async (categoryId: number) => {
    if (!architectureId) return;
    
    // Si ya tenemos los valores en el estado, no cargar de nuevo
    if (formValues[categoryId]) {
      return formValues[categoryId];
    }

    try {
      const response = await api.get(
        `parameters/node-parameters/by-category/${categoryId}/?subproject_id=${architectureId}`
      );
      
      const values = response.data.values || {};
      const alerts = (response.data.alerts || []) as UIAlert[];
      setFormValues(prev => ({
        ...prev,
        [categoryId]: values,
      }));
      setCategoryAlerts(prev => ({
        ...prev,
        [categoryId]: alerts,
      }));
      return values;
    } catch (error) {
      console.error(`Error loading values for category ${categoryId}:`, error);
      return {};
    }
  }, [architectureId, accessToken]);

  // Refetch de datos de una categoría (valores + alertas) tras actualizar un valor
  const refetchCategoryData = useCallback(async (categoryId: number) => {
    if (!architectureId) return;
    try {
      const response = await api.get(
        `parameters/node-parameters/by-category/${categoryId}/?subproject_id=${architectureId}`
      );
      const values = response.data.values || {};
      const alerts = (response.data.alerts || []) as UIAlert[];
      setFormValues(prev => ({ ...prev, [categoryId]: values }));
      setCategoryAlerts(prev => ({ ...prev, [categoryId]: alerts }));
    } catch (e) {
      console.error(`Error refetching category ${categoryId}:`, e);
    }
  }, [architectureId]);

  // Mutation para actualizar un valor
  const updateValueMutation = useMutation({
    mutationFn: async ({ categoryId, parameterCode, value }: { categoryId: number; parameterCode: string; value: any }) => {
      if (!architectureId) throw new Error('No architecture ID');
      const response = await api.post(
        `parameters/node-parameters/update-value/`,
        {
          subproject_id: Number(architectureId),
          parameter_code: parameterCode,
          value: value,
        }
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      refetchCategoryData(variables.categoryId);
    },
  });

  // Handler para cambios de valores
  const handleParameterChange = useCallback((categoryId: number, parameterCode: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || {}),
        [parameterCode]: value,
      },
    }));
    updateValueMutation.mutate({ categoryId, parameterCode, value });
  }, [updateValueMutation]);

  // Get all stages for the selector
  const { projects: stages, reorderNodes, createProject, updateProject } = useProjectNodes<ProjectNode>({ parent: Number(architectureId), type: 'stage' });

  // Ordenar los stages por el campo order
  const sortedStages = stages ? [...stages].sort((a, b) => a.order - b.order) : [];

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  // Estados para crear/eliminar/editar etapas
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [creatingStage, setCreatingStage] = useState(false);
  const [editingStage, setEditingStage] = useState<ProjectNode | null>(null);
  const [deleteStageTarget, setDeleteStageTarget] = useState<ProjectNode | null>(null);
  const [showDeleteStageModal, setShowDeleteStageModal] = useState(false);
  const [deletingStage, setDeletingStage] = useState(false);

  // Función para extraer el error del backend
  const extractBackendError = (err: any): string => {
    if (err?.response?.data && typeof err.response.data === 'object') {
      const values = Object.values(err.response.data);
      if (Array.isArray(values[0])) {
        return (values as any[]).flat().join(' ');
      }
      return values.join(' ');
    }
    return err?.response?.data?.detail || err?.message || 'Error desconocido';
  };

  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [stageError, setStageError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar con la etapa fija para la maqueta
    if (!activeStageId) {
      setActiveStageId('fixed-2-1-1');
    }
  }, [activeStageId]);

  // Inicializar generalData cuando architectureProject esté disponible
  useEffect(() => {
    if (architectureProject) {
      setGeneralData({
        description: architectureProject.description,
        status: architectureProject.status,
        progress_percent: architectureProject.progress_percent,
        start_date: architectureProject.start_date,
        end_date: architectureProject.end_date,
        created_at: architectureProject.created_at,
        updated_at: architectureProject.updated_at,
      });
    }
  }, [architectureProject]);

  const handleGeneralSave = (data: GeneralData) => {
    setGeneralData(data);
    // Aquí se enviaría al backend cuando esté disponible
  };

  const handlePropertySave = (data: PropertyData) => {
    setPropertyData(data);
    // Aquí se enviaría al backend cuando esté disponible
  };

  const handleCIPSave = (data: CIPData) => {
    setCipData(data);
    // Aquí se enviaría al backend cuando esté disponible
  };

  const handleOwnerSave = (data: OwnerData) => {
    setOwnerData(data);
    // Aquí se enviaría al backend cuando esté disponible
  };

  const handleProfessionalsSave = (data: ProfessionalsData) => {
    setProfessionalsData(data);
    // Aquí se enviaría al backend cuando esté disponible
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) {
      setStageError('El nombre de la etapa no puede estar vacío');
      return;
    }

    try {
      setStageError(null);
      await createProject.mutateAsync({
        parent: Number(architectureId),
        name: newStageName,
        description: '',
        is_active: true,
        type: 'stage',
      });
      setNewStageName('');
      setIsAddStageModalOpen(false);
    } catch (err: any) {
      setStageError(err.response?.data?.detail || 'Error al crear la etapa');
    }
  };

  const handleCloseAddStageModal = () => {
    setIsAddStageModalOpen(false);
    setNewStageName('');
    setStageError(null);
  };

  /**
   * Maneja la generación asíncrona de PDF.
   * 
   * Usa el hook usePDFGeneration que:
   * 1. Inicia la generación (POST /api/formpdf/templates/generate/{id}/)
   * 2. Hace polling del estado (GET /api/formpdf/templates/tasks/status/{task_id}/)
   * 3. Descarga automáticamente cuando está listo
   */
  const handleGeneratePDF = async () => {
    if (!architectureId) {
      console.error('No architecture ID available');
      return;
    }

    try {
      await generatePDF(parseInt(architectureId));
    } catch (error) {
      console.error('Error en handleGeneratePDF:', error);
    }
  };

  if (!architectureId || !architectureProject) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>Proyecto de arquitectura no encontrado.</p>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }


  return (
    <ProjectProvider projectNodeId={Number(architectureId)}>
      <div className={styles.container}>
        <header className={styles.header}>
          {/* Primera fila: Breadcrumb (izquierda) + Botón Volver (derecha) */}
          <Breadcrumb
            items={[
              { label: 'Proyectos', path: '/proyectos/list' },
              { label: mainProject?.name || 'Proyecto', path: `/proyectos/${projectId}` },
              { label: architectureProject?.name || 'Proyecto de Arquitectura' },
            ]}
            backButton={{
              label: 'Volver al Proyecto',
              onClick: () => navigate(`/proyectos/${projectId}`),
            }}
          />

          {/* Segunda fila: Nombre (izquierda) + Botones (derecha) */}
          <div className={styles.titleRow}>
            <h1>{architectureProject?.name || 'Proyecto de Arquitectura'}</h1>
            <div className={styles.headerActions}>
              <button 
                className={styles.editButton}
                onClick={() => navigate(`/proyectos/${projectId}/arquitectura/${architectureId}/editar`)}
              >
                <EditIcon /> Editar Trámite
              </button>
              <button 
                className={styles.deleteButton}
                onClick={() => setDeleteModalOpen(true)}
              >
                <DeleteIcon /> Eliminar Trámite
              </button>
            </div>
          </div>

          {/* Tercera fila: Selector de versiones + Texto descriptivo */}
          <div className={styles.versionRow}>
            <ProjectVersionSelector />
            <p className={styles.versionNote}>
              Puedes crear versiones de tus trámites para comparar posibles resultados y mantener un historial de cambios.
            </p>
          </div>
        </header>

      <div className={styles.content}>
        <main className={styles.mainInfo}>
          <ProjectDetailsSection
            coverImageUrl={architectureProject.cover_image_url}
            generalData={generalData}
            ownerData={ownerData}
            propertyData={propertyData}
            cipData={cipData}
            professionalsData={professionalsData}
            onGeneralSave={handleGeneralSave}
            onOwnerSave={handleOwnerSave}
            onPropertySave={handlePropertySave}
            onCIPSave={handleCIPSave}
            onProfessionalsSave={handleProfessionalsSave}
          />
        </main>
      </div>

      <section className={styles.antecedentesSection}>
        <div className={styles.sectionHeader}>
          <h2>Etapas del Proyecto</h2>
          <button 
            className={styles.addStageButton}
            onClick={() => setIsAddStageModalOpen(true)}
          >
            <AddIcon /> Añadir Etapa
          </button>
        </div>
        
        <div className={styles.stagesNavigation}>
          <div className={styles.stagesContainer}>
            {/* Etapa fija para la maqueta */}
            <button
              key={fixedStage.id}
              className={`${styles.stageButton} ${activeStageId === fixedStage.id ? styles.active : ''}`}
              onClick={() => setActiveStageId(fixedStage.id)}
            >
              {fixedStage.name}
            </button>
            
            {/* Etapas dinámicas del backend (cuando estén disponibles) */}
            {(stages || []).map((stage: ProjectNode) => (
              <button
                key={stage.id}
                className={`${styles.stageButton} ${activeStageId === stage.id ? styles.active : ''}`}
                onClick={() => setActiveStageId(stage.id)}
              >
                {stage.name}
              </button>
            ))}
          </div>
        </div>

        {activeStageId && (
          <>
            {activeStageId === 'fixed-2-1-1' ? (
              <div className={styles.fixedStageContent}>
                {isLoadingProject || isLoadingForm ? (
                  <div>Cargando formulario...</div>
                ) : projectError ? (
                  <div style={{ color: 'red', padding: '1rem' }}>
                    <strong>Error al cargar el proyecto:</strong>
                    <pre style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      {projectError instanceof Error ? projectError.message : JSON.stringify(projectError, null, 2)}
                    </pre>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      Architecture ID: {architectureId}<br />
                      Project Type ID: {projectTypeId || 'No disponible'}
                    </p>
                  </div>
                ) : !projectTypeId ? (
                  <div style={{ padding: '1rem' }}>
                    <p>Este proyecto no tiene un tipo de proyecto arquitectónico configurado.</p>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                      Architecture ID: {architectureId}
                    </p>
                  </div>
                ) : formStructureError ? (
                  <div style={{ color: 'red', padding: '1rem' }}>
                    <strong>Error al cargar la estructura del formulario:</strong>
                    <pre style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      {formStructureError instanceof Error ? formStructureError.message : JSON.stringify(formStructureError, null, 2)}
                    </pre>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      Project Type ID: {projectTypeId}
                    </p>
                  </div>
                ) : formStructure && projectTypeId ? (
                  <>
                    {/* Formulario dinámico */}
                    {formStructure?.sections && formStructure.sections.length > 0 ? (
                      <div>
                        {formStructure.sections.map((section: FormParameterCategory) => {
                          // Función recursiva para obtener todos los valores de una sección y sus subcategorías
                          const getAllSectionValues = (sec: FormParameterCategory): Record<string, any> => {
                            const values: Record<string, any> = {};
                            
                            // Agregar valores de esta sección
                            if (formValues[sec.id]) {
                              Object.assign(values, formValues[sec.id]);
                            }
                            
                            // Agregar valores de subcategorías recursivamente
                            if (sec.subcategories) {
                              sec.subcategories.forEach(sub => {
                                Object.assign(values, getAllSectionValues(sub));
                              });
                            }
                            
                            return values;
                          };
                          
                          const sectionValues = getAllSectionValues(section);
                          // Leer el modo actual directamente de sectionModes cada vez que se renderiza
                          // IMPORTANTE: Las keys de objetos en JavaScript son siempre strings cuando usas Object.keys()
                          // pero puedes acceder con números también. Intentar primero con string.
                          const sectionId = section.id;
                          const sectionModesAny = sectionModes as Record<string | number, 'view' | 'editable'>;
                          // Intentar primero con string (como aparece en Object.keys), luego con número
                          const currentSectionMode = sectionModesAny[String(sectionId)] || sectionModesAny[sectionId];

                          return (
                            <SectionTreeWithModes
                              key={`section-${section.id}`} // Usar solo el ID, no el modo (para mantener el estado del componente)
                              section={section}
                              level={0}
                              projectTypeId={projectTypeId!}
                              allSections={getAllSections(formStructure?.sections || [])}
                              onSectionUpdated={() => {
                                // Recargar estructura si es necesario
                                queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
                              }}
                              mode="view" // Modo base, cada sección tiene su propio modo
                              subprojectId={Number(architectureId)}
                              values={sectionValues}
                              onChange={(categoryId: number, code: string, value: any) => {
                                handleParameterChange(categoryId, code, value);
                              }}
                              onSectionExpand={async (sectionId: number) => {
                                // Cargar valores cuando se expande una sección
                                await loadCategoryValues(sectionId);
                                // También cargar valores de subcategorías
                                const getAllSubcategoryIds = (sec: FormParameterCategory): number[] => {
                                  const ids = [sec.id];
                                  if (sec.subcategories) {
                                    sec.subcategories.forEach(sub => {
                                      ids.push(...getAllSubcategoryIds(sub));
                                    });
                                  }
                                  return ids;
                                };
                                const allIds = getAllSubcategoryIds(section);
                                await Promise.all(allIds.map(id => loadCategoryValues(id)));
                              }}
                              activeSectionId={activeSectionId}
                              sectionMode={currentSectionMode} // Modo específico de esta sección (undefined = usar modo base)
                              onSectionModeChange={handleSectionModeChange} // Callback para cambiar el modo
                              getSectionMode={(sectionId: number) => {
                                const sectionModesAny = sectionModes as Record<string | number, 'view' | 'editable'>;
                                return sectionModesAny[String(sectionId)] || sectionModesAny[sectionId];
                              }}
                              categoryAlerts={categoryAlerts}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div>No hay secciones configuradas para este tipo de proyecto.</div>
                    )}

                    {/* Botones de acción */}
                    <div className={styles.formActions}>
                      <button 
                        className={styles.saveButton}
                        onClick={() => {}}
                      >
                        Guardar Formulario
                      </button>
                      
                      <button 
                        className={styles.pdfButton}
                        onClick={handleGeneratePDF}
                        disabled={generatingPDF}
                      >
                        <PdfIcon style={{ marginRight: '8px' }} />
                        {pdfStatus === 'pending' && 'Iniciando generación...'}
                        {pdfStatus === 'processing' && `Generando PDF... ${pdfProgress}%`}
                        {pdfStatus === 'success' && 'PDF Generado ✓'}
                        {pdfStatus === 'failed' && 'Error - Reintentar'}
                        {pdfStatus === 'idle' && 'Generar Formulario en PDF'}
                      </button>
                    </div>
                    
                    {/* Barra de progreso del PDF */}
                    {generatingPDF && (
                      <div className={styles.pdfProgress}>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill}
                            style={{ width: `${pdfProgress}%` }}
                          />
                        </div>
                        <p className={styles.progressText}>
                          {pdfStatus === 'pending' && 'Enviando datos al formulario...'}
                          {pdfStatus === 'processing' && 'Rellenando formulario PDF...'}
                        </p>
                      </div>
                    )}
                    
                    {/* Mensaje de error del PDF */}
                    {pdfError && (
                      <div className={styles.pdfError}>
                        ❌ {pdfError}
                      </div>
                    )}
                    
                    {/* Mensaje de éxito */}
                    {pdfStatus === 'success' && !generatingPDF && (
                      <div className={styles.pdfSuccess}>
                        ✓ PDF generado exitosamente. La descarga debería iniciarse automáticamente.
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '1rem' }}>
                    <p>No se pudo cargar la estructura del formulario.</p>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                      Architecture ID: {architectureId}<br />
                      Project Type ID: {projectTypeId || 'No disponible'}<br />
                      Loading Project: {isLoadingProject ? 'Sí' : 'No'}<br />
                      Loading Form: {isLoadingForm ? 'Sí' : 'No'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <ListadoDeAntecedentes 
                stageId={typeof activeStageId === 'number' ? activeStageId : 0}
                projectId={Number(projectId)}
                architectureProjectId={Number(architectureId)}
              />
            )}
          </>
        )}
      </section>

      {/* Modal para añadir etapas */}
      {isAddStageModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Añadir Nueva Etapa</h3>
              <button 
                className={styles.closeButton}
                onClick={handleCloseAddStageModal}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalContent}>
              {stageError && <div className={styles.error}>{stageError}</div>}
              
              <div className={styles.formGroup}>
                <label htmlFor="stageName">Nombre de la Etapa</label>
                <input
                  type="text"
                  id="stageName"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Ingrese el nombre de la nueva etapa"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStage()}
                />
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={handleCloseAddStageModal}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleAddStage}
                disabled={!newStageName.trim()}
              >
                Crear Etapa
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        title="Eliminar proyecto de arquitectura"
        message="¿Estás seguro de que deseas eliminar este proyecto de arquitectura? Esta acción es irreversible."
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          try {
            await deleteProject.mutateAsync(Number(architectureId));
            setDeleteModalOpen(false);
            navigate(`/proyectos/${projectId}`);
          } catch (error) {
            console.error('Error al eliminar el proyecto de arquitectura:', error);
            setDeleteModalOpen(false);
          }
        }}
      />
      </div>
    </ProjectProvider>
  );
};

export default ArchitectureProjectDetail;
