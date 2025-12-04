import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { ProjectNode, TypeCode } from '../../types/project_nodes.types';
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
  Add as AddIcon
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

type TabType = 'propiedad' | 'cip' | 'propietario' | 'arquitecto' | 'profesionales' | 'superficies';

const ArchitectureProjectDetail: React.FC = () => {
  const { projectId, architectureId } = useParams<{ projectId: string; architectureId: string }>();
  const navigate = useNavigate();

  const [activeStageId, setActiveStageId] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('propiedad');
  
  // Etapa fija para la maqueta
  const fixedStage = {
    id: 'fixed-2-1-1',
    name: '2-1.1 Obra Nueva'
  };
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isPropertyEditing, setIsPropertyEditing] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData | undefined>(undefined);
  const [isCIPEditing, setIsCIPEditing] = useState(false);
  const [cipData, setCipData] = useState<CIPData | undefined>(undefined);
  const [isOwnerEditing, setIsOwnerEditing] = useState(false);
  const [ownerData, setOwnerData] = useState<OwnerData | undefined>(undefined);
  const [isArchitectEditing, setIsArchitectEditing] = useState(false);
  const [architectData, setArchitectData] = useState<ArchitectData | undefined>(undefined);
  const [isProfessionalsEditing, setIsProfessionalsEditing] = useState(false);
  const [professionalsData, setProfessionalsData] = useState<ProfessionalsData | undefined>(undefined);
  
  // Estados para las secciones del formulario 2-1.1
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    caracteristicas: false,
    superficies: false,
    normas: false
  });

  // Get all stages for the selector
  const { projects: stages, reorderNodes, createProject, updateProject } = useProjectNodes<ProjectNode>({ parent: Number(architectureId), type: 'stage' });

  // Ordenar los stages por el campo order
  const sortedStages = stages ? [...stages].sort((a, b) => a.order - b.order) : [];



  const { projects: architectureProjects, deleteProject } = useProjectNodes<ProjectNode>({ type: 'architecture_subproject' });
  const architectureProject = architectureProjects?.find(p => p.id === Number(architectureId));

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
                      className={`${styles.tab} ${activeTab === 'superficies' ? styles.active : ''}`}
                      onClick={() => setActiveTab('superficies')}
                    >
                      Superficies
                    </button>
                    <button
                      className={`${styles.tab} ${activeTab === 'pisos' ? styles.active : ''}`}
                      onClick={() => navigate(`/proyectos/${projectId}/arquitectura/${architectureId}/pisos`)}
                    >
                      Pisos
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

                {/* Botón de guardar */}
                <div className={styles.formActions}>
                  <button className={styles.saveButton}>
                    Guardar Formulario
                  </button>
                </div>
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
