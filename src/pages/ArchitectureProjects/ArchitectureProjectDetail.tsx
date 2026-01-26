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
import PropertyTab from '../../components/ProjectTabs/PropertyTab';
import CIPTab from '../../components/ProjectTabs/CIPTab';
import OwnerTab from '../../components/ProjectTabs/OwnerTab';
import ArchitectTab from '../../components/ProjectTabs/ArchitectTab';
import ProfessionalsTab from '../../components/ProjectTabs/ProfessionalsTab';
import SurfacesTab from '../../components/SurfacesTab/SurfacesTab';
import { PropertyData, CIPData, OwnerData, ArchitectData, ProfessionalsData } from '../../types/property.types';
import { ProjectProvider } from '../../context/ProjectContext';
import ProjectVersionSelector from '../../components/ProjectVersionSelector/ProjectVersionSelector';
import SectionTreeWithModes from '../../components/Admin/SectionTreeWithModes';
import type { FormParameterCategory } from '../../components/Admin/SectionTreeWithModes';
import { api } from '../../services/api';
import styles from './ArchitectureProjectDetail.module.scss';
import ListadoDeAntecedentes from './ListadoDeAntecedentes';

type TabType = 'propiedad' | 'cip' | 'propietario' | 'arquitecto' | 'profesionales' | 'superficies' ;

const ArchitectureProjectDetail: React.FC = () => {
  const { projectId, architectureId } = useParams<{ projectId: string; architectureId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [activeStageId, setActiveStageId] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('propiedad');
  
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

  // Estados para formulario dinámico
  const [formValues, setFormValues] = useState<Record<string, Record<string, any>>>({}); // { categoryId: { paramCode: value } }
  // Modo por sección: { sectionId: 'view' | 'editable' }
  const [sectionModes, setSectionModes] = useState<Record<number, 'view' | 'editable'>>({});
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Debug: verificar cuando cambia sectionModes
  useEffect(() => {
    console.log(`[ArchitectureProjectDetail] sectionModes changed:`, sectionModes);
  }, [sectionModes]);

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
    console.log(`Changing section ${sectionId} (type: ${typeof sectionId}) mode to ${mode}`);
    setSectionModes(prev => {
      // Si el modo es 'view', eliminarlo del estado (para usar el modo base)
      // Si el modo es 'editable', agregarlo al estado
      // Asegurar que usamos el mismo tipo de clave (number) siempre
      const newModes = mode === 'view' 
        ? (() => {
            const updated = { ...prev };
            delete updated[sectionId];
            // También eliminar si está como string (por si acaso)
            const updatedAny = updated as Record<string | number, 'view' | 'editable'>;
            delete updatedAny[String(sectionId)];
            return updated;
          })()
        : {
            ...prev,
            [sectionId]: mode, // Asegurar que siempre usamos number como clave
          };
      console.log(`New sectionModes:`, newModes);
      console.log(`New sectionModes keys:`, Object.keys(newModes));
      console.log(`Section ${sectionId} mode in newModes[${sectionId}]:`, newModes[sectionId]);
      const newModesAny = newModes as Record<string | number, 'view' | 'editable'>;
      console.log(`Section ${sectionId} mode in newModes['${sectionId}']:`, newModesAny[String(sectionId)]);
      return newModes;
    });
  }, []);

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
      setFormValues(prev => ({
        ...prev,
        [categoryId]: values,
      }));
      return values;
    } catch (error) {
      console.error(`Error loading values for category ${categoryId}:`, error);
      return {};
    }
  }, [architectureId, accessToken]);

  // Mutation para actualizar un valor
  const updateValueMutation = useMutation({
    mutationFn: async ({ parameterCode, value }: { parameterCode: string; value: any }) => {
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
    onSuccess: () => {
      // Los valores se actualizan localmente, no necesitamos invalidar queries
    },
  });

  // Handler para cambios de valores
  const handleParameterChange = useCallback((categoryId: number, parameterCode: string, value: any) => {
    // Actualizar estado local inmediatamente
    setFormValues(prev => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || {}),
        [parameterCode]: value,
      },
    }));

    // Guardar en el backend
    updateValueMutation.mutate({ parameterCode, value });
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
                        {(() => {
                          console.log(`[ArchitectureProjectDetail] Total sections to render:`, formStructure.sections.length);
                          console.log(`[ArchitectureProjectDetail] Section IDs:`, formStructure.sections.map(s => s.id));
                          return null;
                        })()}
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
                          
                          // Debug: verificar qué secciones existen y cuál tiene parámetros
                          const hasParams = section.form_parameters && section.form_parameters.length > 0;
                          console.log(`[ArchitectureProjectDetail] Rendering Section ${sectionId} (hasParams: ${hasParams}): sectionModes keys=`, Object.keys(sectionModes), `sectionModes['${String(sectionId)}']=`, sectionModesAny[String(sectionId)], `sectionModes[${sectionId}]=`, sectionModesAny[sectionId], `currentSectionMode=`, currentSectionMode);
                          
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
                              onChange={(code: string, value: any) => {
                                handleParameterChange(section.id, code, value);
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
                                // Función para obtener el modo de cualquier sección (para subcategorías)
                                const sectionModesAny = sectionModes as Record<string | number, 'view' | 'editable'>;
                                return sectionModesAny[String(sectionId)] || sectionModesAny[sectionId];
                              }}
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
