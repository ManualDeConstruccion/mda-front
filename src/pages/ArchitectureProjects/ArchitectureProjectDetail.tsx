import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { ProjectNode, TypeCode } from '../../types/project_nodes.types';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
import styles from './ArchitectureProjectDetail.module.scss';
import ListadoDeAntecedentes from './ListadoDeAntecedentes';
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
import PropertyTab from '../../components/ProjectTabs/PropertyTab';
import CIPTab from '../../components/ProjectTabs/CIPTab';
import OwnerTab from '../../components/ProjectTabs/OwnerTab';
import ArchitectTab from '../../components/ProjectTabs/ArchitectTab';
import ProfessionalsTab from '../../components/ProjectTabs/ProfessionalsTab';
import SurfacesTab from '../../components/SurfacesTab/SurfacesTab';
import { PropertyData, CIPData, OwnerData, ArchitectData, ProfessionalsData } from '../../types/property.types';
import { ProjectProvider } from '../../context/ProjectContext';
import ProjectVersionSelector from '../../components/ProjectVersionSelector/ProjectVersionSelector';
import { useFormParameters } from '../../hooks/useFormParameters';
import { DynamicFormSection } from '../../components/DynamicFormSection/DynamicFormSection';

type TabType = 'propiedad' | 'cip' | 'propietario' | 'arquitecto' | 'profesionales' | 'superficies' | 'formulario';

const ArchitectureProjectDetail: React.FC = () => {
  const { projectId, architectureId } = useParams<{ projectId: string; architectureId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [activeStageId, setActiveStageId] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('propiedad');
  
  // Etapa fija para la maqueta
  const fixedStage = {
    id: 'fixed-2-1-1',
    name: '2-1.1 Obra Nueva'
  };
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [isPropertyEditing, setIsPropertyEditing] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData | undefined>({
    manzana: '12',
    numero_plano_loteo: 'PL-2024-0789',
    lote: '5',
    conservador_comuna: 'Conservador de Bienes Raíces de Rancagua',
    localidad: 'Rancagua',
    poblacion: 'Centro',
    rol: '23456-7',
    numero_depto: '',
    comuna: 'Rancagua',
    direccion_calle: 'Av. Cachapoal',
    fojas_numero: '1850',
    region: 'Región del Libertador General Bernardo O\'Higgins',
    direccion_numero: '850',
    fojas: '1850',
    fojas_ano: '2021',
    sector: 'Residencial',
    prc: 'PRC-2024-045',
    zona: 'ZR-2'
  });
  const [isCIPEditing, setIsCIPEditing] = useState(false);
  const [cipData, setCipData] = useState<CIPData | undefined>({
    proyecto_cip: null,
    proyecto_cip_fecha: '2024-03-15'
  });
  const [isOwnerEditing, setIsOwnerEditing] = useState(false);
  const [ownerData, setOwnerData] = useState<OwnerData | undefined>({
    nombre: 'Inversiones Inmobiliarias Cachapoal S.A.',
    rut: '76.234.567-8',
    email: 'contacto@inversiones-cachapoal.cl',
    telefono: '+56 72 2345 678',
    celular: '+56 9 8765 4321',
    responsabilidad: 'Propietario',
    direccion: 'Av. Cachapoal',
    direccion_comuna: 'Rancagua',
    direccion_depto: 'Oficina 301',
    direccion_localidad: 'Rancagua',
    direccion_numero: '450',
    rep_legal: 'Juan Carlos Pérez González',
    rep_legal_rut: '12.345.678-9',
    escritura_representante: '12345',
    escritura_representante_2: '',
    escritura_representante_fecha: '2020-05-20',
    escritura_representante_fecha_2: '',
    escritura_representante_notario: 'Notaría de Rancagua',
    otro_instrumento_1: '',
    otro_instrumento_2: '',
    otro_instrumento_3: '',
    otro_instrumento_fecha: '',
    otro_instrumento_mediante: ''
  });
  const [isArchitectEditing, setIsArchitectEditing] = useState(false);
  const [architectData, setArchitectData] = useState<ArchitectData | undefined>({
    nombre: 'María Elena Rodríguez Silva',
    rut: '13.456.789-0',
    email: 'maria.rodriguez@arquitectos-ohiggins.cl',
    telefono: '+56 72 2456 789',
    celular: '+56 9 7654 3210',
    patente: 'PAT-ARQ-2024-123',
    aa_patente_arq: 'AA-2024-456',
    razon_social: 'Arquitectura y Diseño O\'Higgins Ltda.',
    rut_oficina: '76.789.012-3',
    direccion: 'Av. Cachapoal',
    direccion_numero: '680',
    direccion_depto: 'Oficina 502',
    comuna: 'Rancagua'
  });
  const [isProfessionalsEditing, setIsProfessionalsEditing] = useState(false);
  const [professionalsData, setProfessionalsData] = useState<ProfessionalsData | undefined>({
    calculista_nombre: 'Roberto Andrés Martínez López',
    calculista_rut: '14.567.890-1',
    calculista_email: 'roberto.martinez@calculos-estructurales.cl',
    calculista_telefono: '+56 72 2567 890',
    calculista_celular: '+56 9 6543 2109',
    calculista_patente: 'PAT-CALC-2024-789',
    of_calculo_razon_social: 'Ingeniería Estructural O\'Higgins S.A.',
    of_calculo_rut: '76.890.123-4',
    of_calculo_direccion: 'Av. Millán',
    of_calculo_direccion_numero: '1250',
    of_calculo_direccion_depto: 'Oficina 201',
    rev_independiente_nombre: 'Patricia Alejandra Fernández Torres',
    rev_independiente_rut: '15.678.901-2',
    rev_independiente_email: 'patricia.fernandez@revisiones-independientes.cl',
    rev_independiente_telefono: '+56 72 2678 901',
    rev_independiente_celular: '+56 9 5432 1098',
    rev_independiente_categoria: 'Categoría A',
    rev_independiente_registro: 'REG-REV-2024-012',
    rev_independiente_numero: 'REV-2024-345',
    rev_independiente_fecha: '2024-01-15',
    rev_independiente_direccion: 'Av. Cachapoal',
    rev_independiente_dir_numero: '920',
    rev_independiente_dir_depto: 'Oficina 401',
    rev_independiente_comuna: 'Rancagua',
    rev_independiente_si: 'Sí',
    rev_independiente_no: '',
    ito_nombre: 'Carlos Eduardo Soto Ramírez',
    ito_rut: '16.789.012-3',
    ito_email: 'carlos.soto@ito-constructora.cl',
    ito_telefono: '+56 72 2789 012',
    ito_celular: '+56 9 4321 0987',
    ito_categoria: 'Categoría B',
    ito_registro_numero: 'REG-ITO-2024-234',
    ito_razon_social: 'Inspección Técnica de Obras O\'Higgins Ltda.',
    ito_razon_social_rut: '76.901.234-5',
    ito_informe_numero: 'ITO-2024-567',
    ito_informe_fecha: '2024-02-20',
    ito_direccion: 'Av. Millán',
    ito_direccion_numero: '1850',
    ito_direccion_depto: 'Oficina 301',
    ito_si: 'Sí',
    ito_no: '',
    rev_calculo_nombre: 'Ana Isabel Morales Contreras',
    rev_calculo_rut: '17.890.123-4',
    rev_calculo_email: 'ana.morales@revision-calculos.cl',
    rev_calculo_telefono: '+56 72 2890 123',
    rev_calculo_celular: '+56 9 3210 9876',
    rev_calculo_categoria: 'Categoría A',
    rev_calculo_registro: 'REG-REV-CALC-2024-345',
    rev_calculo_numero: 'REV-CALC-2024-678',
    rev_calculo_fecha: '2024-03-10',
    rev_calculo_razon_social: 'Revisión de Cálculos Estructurales O\'Higgins S.A.',
    rev_calculo_razon_social_rut: '77.012.345-6',
    rev_calculo_direccion: 'Av. Cachapoal',
    rev_calculo_dir_numero: '1250',
    rev_calculo_dir_depto: 'Oficina 601',
    rev_calculo_si: 'Sí',
    rev_calculo_no: '',
    constructor_nombre: 'Luis Fernando Gutiérrez Herrera',
    constructor_rut: '18.901.234-5',
    constructor_email: 'luis.gutierrez@constructora-ohiggins.cl',
    constructor_telefono: '+56 72 2901 234',
    constructor_celular: '+56 9 2109 8765',
    constructor_patente: 'PAT-CONST-2024-901',
    constructora_razon_social: 'Constructora Cachapoal S.A.',
    constructora_rut: '77.123.456-7',
    constructora_direccion: 'Av. Millán',
    constructora_direccion_numero: '2100',
    constructora_direccion_depto: 'Oficina 101',
    constructora_comuna: 'Machalí'
  });
  
  // Estados para las secciones del formulario 2-1.1
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    caracteristicas: false,
    superficies: false,
    normas: false
  });

  // Estados para generación de PDF
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Get all stages for the selector
  const { projects: stages, reorderNodes, createProject, updateProject } = useProjectNodes<ProjectNode>({ parent: Number(architectureId), type: 'stage' });

  // Ordenar los stages por el campo order
  const sortedStages = stages ? [...stages].sort((a, b) => a.order - b.order) : [];



  const { projects: architectureProjects, deleteProject } = useProjectNodes<ProjectNode>({ type: 'architecture_subproject' });
  const architectureProject = architectureProjects?.find(p => p.id === Number(architectureId));

  // Hook para parámetros del formulario dinámico
  const {
    formStructure,
    isLoading: isLoadingFormData,
    saveParameter,
    isSaving: isSavingParameter,
    getParameterValue,
    getSectionCompleteness,
  } = useFormParameters({
    architectureProjectTypeId: architectureProject?.architecture_project_type as number | undefined,
    projectNodeId: Number(projectId), // El nodo padre "project" donde viven los parámetros
    enabled: !!architectureProject && !!projectId,
  });

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

  const handlePropertySave = (data: PropertyData) => {
    setPropertyData(data);
    // Aquí se enviaría al backend cuando esté disponible
    console.log('Property data saved:', data);
  };

  const handleCIPSave = (data: CIPData) => {
    setCipData(data);
    // Aquí se enviaría al backend cuando esté disponible
    console.log('CIP data saved:', data);
  };

  const handleOwnerSave = (data: OwnerData) => {
    setOwnerData(data);
    // Aquí se enviaría al backend cuando esté disponible
    console.log('Owner data saved:', data);
  };

  const handleArchitectSave = (data: ArchitectData) => {
    setArchitectData(data);
    // Aquí se enviaría al backend cuando esté disponible
    console.log('Architect data saved:', data);
  };

  const handleProfessionalsSave = (data: ProfessionalsData) => {
    setProfessionalsData(data);
    // Aquí se enviaría al backend cuando esté disponible
    console.log('Professionals data saved:', data);
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
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

  const handleGeneratePDF = async () => {
    if (!architectureId) {
      setPdfError('No se ha especificado un proyecto de arquitectura');
      return;
    }

    setGeneratingPDF(true);
    setPdfError(null);

    try {
      // Llamar al endpoint de generación de PDF
      const response = await axios.post(
        `${API_URL}/api/formpdf/templates/generate/${architectureId}/`,
        {},
        {
          responseType: 'blob', // Importante para recibir el PDF
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      // Crear blob del PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Crear link temporal y hacer click para descargar
      const link = document.createElement('a');
      link.href = url;
      link.download = `formulario_${architectureProject?.name || 'proyecto'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('PDF generado y descargado exitosamente');
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error al generar el PDF. Por favor intente nuevamente.';
      
      if (error.response?.data) {
        // Si el error viene como blob, necesitamos parsearlo
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorData.detail || errorMessage;
          } catch {
            errorMessage = 'Error al procesar la respuesta del servidor';
          }
        } else if (typeof error.response.data === 'object') {
          errorMessage = error.response.data.error || error.response.data.detail || errorMessage;
        }
      }
      
      setPdfError(errorMessage);
      
      // Mostrar alerta al usuario
      alert(`Error: ${errorMessage}`);
    } finally {
      setGeneratingPDF(false);
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
          <div className={styles.headerContent}>
            <h1>{architectureProject.name}</h1>
            <ProjectVersionSelector />
          </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.editButton}
            onClick={() => navigate(`/proyectos/${projectId}/arquitectura/${architectureId}/editar`)}
          >
            <EditIcon /> Editar Proyecto
          </button>
          <button 
            className={styles.deleteButton}
            onClick={() => setDeleteModalOpen(true)}
          >
            <DeleteIcon /> Eliminar Proyecto
          </button>
          <button 
            className={styles.backButton}
            onClick={() => navigate(`/proyectos/${projectId}`)}
          >
            Volver al Proyecto
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <main className={styles.mainInfo}>
          {/* Sección colapsable: Detalles de Proyectos */}
          <section className={styles.collapsibleSection}>
            <div 
              className={styles.collapsibleHeader}
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            >
              <h2>Detalles de Proyectos</h2>
              <p><strong>Descripción:</strong> {architectureProject.description}</p>
              <button className={styles.toggleButton}>
                {isDetailsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </button>
            </div>

            {isDetailsExpanded && (
              <div className={styles.collapsibleContent}>
                {/* Pestañas de navegación */}
                <div className={styles.tabsContainer}>
                  <div className={styles.tabs}>
                    <button
                      className={`${styles.tab} ${activeTab === 'propiedad' ? styles.active : ''}`}
                      onClick={() => setActiveTab('propiedad')}
                    >
                      Propiedad
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'cip' ? styles.active : ''}`}
                      onClick={() => setActiveTab('cip')}
                    >
                      CIP
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'propietario' ? styles.active : ''}`}
                      onClick={() => setActiveTab('propietario')}
                    >
                      Propietario
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'arquitecto' ? styles.active : ''}`}
                      onClick={() => setActiveTab('arquitecto')}
                    >
                      Arquitecto
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'profesionales' ? styles.active : ''}`}
                      onClick={() => setActiveTab('profesionales')}
                    >
                      Profesionales
                    </button>
                    <button
                      className={styles.tab}
                      onClick={() => navigate(`/proyectos/${projectId}/arquitectura/${architectureId}/pisos`)}
                    >
                      Pisos
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'superficies' ? styles.active : ''}`}
                      onClick={() => setActiveTab('superficies')}
                    >
                      Superficies
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'formulario' ? styles.active : ''}`}
                      onClick={() => setActiveTab('formulario')}
                    >
                      Formulario
                    </button>
              
                  </div>

                  <div className={styles.tabContent}>
                    {activeTab === 'propiedad' && (
                      <div className={styles.tabPane}>
                        <PropertyTab
                          data={propertyData}
                          onSave={handlePropertySave}
                          isEditing={isPropertyEditing}
                          onEditChange={setIsPropertyEditing}
                        />
                      </div>
                    )}
                    {activeTab === 'cip' && (
                      <div className={styles.tabPane}>
                        <CIPTab
                          data={cipData}
                          onSave={handleCIPSave}
                          isEditing={isCIPEditing}
                          onEditChange={setIsCIPEditing}
                        />
                      </div>
                    )}
                    {activeTab === 'propietario' && (
                      <div className={styles.tabPane}>
                        <OwnerTab
                          data={ownerData}
                          onSave={handleOwnerSave}
                          isEditing={isOwnerEditing}
                          onEditChange={setIsOwnerEditing}
                        />
                      </div>
                    )}
                    {activeTab === 'arquitecto' && (
                      <div className={styles.tabPane}>
                        <ArchitectTab
                          data={architectData}
                          onSave={handleArchitectSave}
                          isEditing={isArchitectEditing}
                          onEditChange={setIsArchitectEditing}
                        />
                      </div>
                    )}
                    {activeTab === 'profesionales' && (
                      <div className={styles.tabPane}>
                        <ProfessionalsTab
                          data={professionalsData}
                          onSave={handleProfessionalsSave}
                          isEditing={isProfessionalsEditing}
                          onEditChange={setIsProfessionalsEditing}
                        />
                      </div>
                    )}
                    {activeTab === 'superficies' && (
                      <div className={styles.tabPane}>
                        <SurfacesTab projectNodeId={Number(architectureId)} />
                      </div>
                    )}
                    {activeTab === 'formulario' && (
                      <div className={styles.tabPane}>
                        {isLoadingFormData ? (
                          <div className={styles.loading}>
                            <p>Cargando formulario...</p>
                          </div>
                        ) : formStructure ? (
                          <div className={styles.formStructureContainer}>
                            <div className={styles.formHeader}>
                              <h3>Formulario de Parámetros</h3>
                              <p className={styles.formDescription}>
                                Complete los siguientes campos para el proyecto <strong>{architectureProject.name}</strong>
                              </p>
                              {/* DEBUG: Mostrar información de la estructura */}
                              <div style={{ background: '#f0f0f0', padding: '10px', marginTop: '10px', fontSize: '12px' }}>
                                <strong>Debug Info:</strong>
                                <div>Total secciones: {formStructure.sections?.length || 0}</div>
                                <div>Tipo de proyecto: {formStructure.project_type?.name}</div>
                                {formStructure.sections?.map(s => (
                                  <div key={s.id} style={{ marginLeft: '10px' }}>
                                    <div>- {s.name}: {s.form_parameters?.length || 0} parámetros (visible: {s.is_active ? 'sí' : 'no'})</div>
                                    {s.subcategories && s.subcategories.length > 0 && (
                                      <div style={{ marginLeft: '20px' }}>
                                        <strong>Subsecciones:</strong>
                                        {s.subcategories.map((sub: any) => (
                                          <div key={sub.id}>
                                            * {sub.name}: {sub.form_parameters?.length || 0} parámetros
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {formStructure.sections.map((section) => (
                              <DynamicFormSection
                                key={section.id}
                                section={section}
                                getParameterValue={getParameterValue}
                                onParameterChange={(code, value, dataType) => {
                                  saveParameter({
                                    definition: code,
                                    value,
                                    dataType: dataType as 'decimal' | 'integer' | 'boolean' | 'text' | 'date',
                                  });
                                }}
                                isSaving={isSavingParameter}
                                disabled={false}
                                showCompleteness={true}
                                completeness={getSectionCompleteness(section.id)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className={styles.noFormData}>
                            <p>No hay estructura de formulario disponible para este tipo de proyecto.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
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
                <h3>Formulario 2-1.1 - Obra Nueva: Aprobación de Anteproyecto de Obras de Edificación</h3>
                
                {/* Sección: Características del Proyecto */}
                <div className={styles.formSection}>
                  <div 
                    className={styles.sectionHeader}
                    onClick={() => toggleSection('caracteristicas')}
                  >
                    <h4>Características del Proyecto</h4>
                    <button className={styles.toggleButton}>
                      {expandedSections.caracteristicas ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </button>
                  </div>
                  
                  {expandedSections.caracteristicas && (
                    <div className={styles.sectionContent}>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label>Carga Ocupacional</label>
                          <input type="text" placeholder="Ingrese carga ocupacional" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Densidad de Ocupación</label>
                          <input type="text" placeholder="Ingrese densidad de ocupación" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Crecimiento Urbano</label>
                          <select>
                            <option value="">Seleccione</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Densificación/Extensión</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Uso Público</label>
                          <select>
                            <option value="">Seleccione</option>
                            <option value="todo">Todo</option>
                            <option value="parte">Parte</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Etapas Art. 9</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Etapas Ejecutadas</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Etapas por Ejecutar</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Loteo DFL 2</label>
                          <select>
                            <option value="">Seleccione</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Proyecto Cantidad de Etapas</label>
                          <input type="number" placeholder="Ingrese cantidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Proyecto Etapa</label>
                          <select>
                            <option value="">Seleccione</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Proyecto Mitigación IMIV</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sección: Superficies */}
                <div className={styles.formSection}>
                  <div 
                    className={styles.sectionHeader}
                    onClick={() => toggleSection('superficies')}
                  >
                    <h4>Superficies</h4>
                    <button className={styles.toggleButton}>
                      {expandedSections.superficies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </button>
                  </div>
                  
                  {expandedSections.superficies && (
                    <div className={styles.sectionContent}>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label>Superficie Edificada Sobre Común</label>
                          <input type="number" placeholder="m²" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Superficie Edificada Sobre Total</label>
                          <input type="number" placeholder="m²" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Superficie Edificada Sobre Útil</label>
                          <input type="number" placeholder="m²" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Superficie Edificada Sub Común</label>
                          <input type="number" placeholder="m²" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Superficie Edificada Sub Total</label>
                          <input type="number" placeholder="m²" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Superficie Edificada Sub Útil</label>
                          <input type="number" placeholder="m²" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Superficie Edificada Total Común</label>
                          <input type="number" placeholder="m²" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Superficie Edificada Total Total</label>
                          <input type="number" placeholder="m²" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Superficie Edificada Total Útil</label>
                          <input type="number" placeholder="m²" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Actividad</label>
                          <input type="text" placeholder="Ingrese actividad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Aumenta Superficie</label>
                          <select>
                            <option value="">Seleccione</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Aumenta Superficie (metros)</label>
                          <input type="number" placeholder="m²" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Disminuye Superficie</label>
                          <select>
                            <option value="">Seleccione</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Disminuye Superficie (metros)</label>
                          <input type="number" placeholder="m²" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Mantiene Superficie</label>
                          <select>
                            <option value="">Seleccione</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sección: Normas Urbanísticas */}
                <div className={styles.formSection}>
                  <div 
                    className={styles.sectionHeader}
                    onClick={() => toggleSection('normas')}
                  >
                    <h4>Normas Urbanísticas</h4>
                    <button className={styles.toggleButton}>
                      {expandedSections.normas ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </button>
                  </div>
                  
                  {expandedSections.normas && (
                    <div className={styles.sectionContent}>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label>Adosamiento Permitido</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Adosamiento Proyectado</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Altura Permitida</label>
                          <input type="text" placeholder="Ingrese altura" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Altura Proyectada</label>
                          <input type="text" placeholder="Ingrese altura" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Antejardín Permitido</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Antejardín Proyectado</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Cantidad Descontada Estacionamiento</label>
                          <input type="number" placeholder="Ingrese cantidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Coeficiente Constructivo Permitido</label>
                          <input type="number" placeholder="Ingrese coeficiente" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Coeficiente Constructivo Proyectado</label>
                          <input type="number" placeholder="Ingrese coeficiente" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Coeficiente Ocupación Pisos Sup. Permitido</label>
                          <input type="number" placeholder="Ingrese coeficiente" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Coeficiente Ocupación Pisos Sup. Proyectado</label>
                          <input type="number" placeholder="Ingrese coeficiente" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Coeficiente Ocupación Suelo Permitido</label>
                          <input type="number" placeholder="Ingrese coeficiente" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Coeficiente Ocupación Suelo Proyectado</label>
                          <input type="number" placeholder="Ingrese coeficiente" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Densidad Permitida</label>
                          <input type="number" placeholder="Ingrese densidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Densidad Proyectada</label>
                          <input type="number" placeholder="Ingrese densidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Desc. Estacionamiento</label>
                          <select>
                            <option value="">Seleccione</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Distanciamiento Permitido</label>
                          <input type="text" placeholder="Ingrese distanciamiento" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Distanciamiento Proyectado</label>
                          <input type="text" placeholder="Ingrese distanciamiento" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Estacionamiento Auto Permitido</label>
                          <input type="number" placeholder="Ingrese cantidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Estacionamiento Auto Proyectado</label>
                          <input type="number" placeholder="Ingrese cantidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Estacionamiento Bicicleta Permitido</label>
                          <input type="number" placeholder="Ingrese cantidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Estacionamiento Bicicleta Proyectado</label>
                          <input type="number" placeholder="Ingrese cantidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Estacionamiento Discapacitados Permitido</label>
                          <input type="number" placeholder="Ingrese cantidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Estacionamiento Discapacitados Proyectado</label>
                          <input type="number" placeholder="Ingrese cantidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Estacionamiento Otros</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Estacionamiento Otros Permitido</label>
                          <input type="number" placeholder="Ingrese cantidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Estacionamiento Otros Proyectado</label>
                          <input type="number" placeholder="Ingrese cantidad" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Nuevas Normas</label>
                          <select>
                            <option value="">Seleccione</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Predio Área Riesgo</label>
                          <select>
                            <option value="">Seleccione</option>
                            <option value="si">Sí</option>
                            <option value="parcial">Parcial</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Rasante Permitida</label>
                          <input type="text" placeholder="Ingrese rasante" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Rasante Proyectada</label>
                          <input type="text" placeholder="Ingrese rasante" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Sistema Agrupación Permitido</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Sistema Agrupación Proyectado</label>
                          <input type="text" placeholder="Ingrese información" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className={styles.formActions}>
                  <button 
                    className={styles.saveButton}
                    onClick={() => console.log('Guardar formulario - funcionalidad pendiente')}
                  >
                    Guardar Formulario
                  </button>
                  
                  <button 
                    className={styles.pdfButton}
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF}
                  >
                    <PdfIcon style={{ marginRight: '8px' }} />
                    {generatingPDF ? 'Generando PDF...' : 'Generar Formulario en PDF'}
                  </button>
                </div>
                
                {/* Mensaje de error del PDF */}
                {pdfError && (
                  <div className={styles.pdfError}>
                    {pdfError}
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
