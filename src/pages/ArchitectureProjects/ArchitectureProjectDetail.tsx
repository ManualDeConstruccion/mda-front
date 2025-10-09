import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { ProjectNode } from '../../types/project_nodes.types';
import styles from './ArchitectureProjectDetail.module.scss';
import ListadoDeAntecedentes from './ListadoDeAntecedentes';
import {
  Home as HomeIcon,
  AttachMoney as BudgetIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import PropertyTab from '../../components/ProjectTabs/PropertyTab';
import CIPTab from '../../components/ProjectTabs/CIPTab';
import OwnerTab from '../../components/ProjectTabs/OwnerTab';
import ArchitectTab from '../../components/ProjectTabs/ArchitectTab';
import ProfessionalsTab from '../../components/ProjectTabs/ProfessionalsTab';
import { PropertyData, CIPData, OwnerData, ArchitectData, ProfessionalsData } from '../../types/property.types';

type TabType = 'propiedad' | 'cip' | 'propietario' | 'arquitecto' | 'profesionales';

const ArchitectureProjectDetail: React.FC = () => {
  const { projectId, architectureId } = useParams<{ projectId: string; architectureId: string }>();
  const navigate = useNavigate();

  const [activeStageId, setActiveStageId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('propiedad');
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

  // Get all stages for the selector
  const { projects: stages } = useProjectNodes<ProjectNode>({ parent: Number(architectureId), type: 'stage' });

  const { projects: architectureProjects, deleteProject } = useProjectNodes<ProjectNode>({ type: 'architecture_subproject' });
  const architectureProject = architectureProjects?.find(p => p.id === Number(architectureId));

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (stages && stages.length > 0 && !activeStageId) {
      setActiveStageId(stages[0].id);
    }
  }, [stages, activeStageId]);

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
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>{architectureProject.name}</h1>
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
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      <section className={styles.antecedentesSection}>
        <div className={styles.stagesNavigation}>
          <div className={styles.stagesContainer}>
            {(stages || []).map(stage => (
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
          <ListadoDeAntecedentes 
            stageId={activeStageId}
            projectId={Number(projectId)}
            architectureProjectId={Number(architectureId)}
          />
        )}
      </section>

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
  );
};

export default ArchitectureProjectDetail;
