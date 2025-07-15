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
  Add as AddIcon
} from '@mui/icons-material';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import { Popover, Button, Typography, Box } from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableStageButtonProps {
  stage: ProjectNode;
  isActive: boolean;
  onClick: () => void;
  isDragging: boolean;
  isOver: boolean;
  onDelete: (stage: ProjectNode) => void;
  onEdit: (stage: ProjectNode) => void;
}

const SortableStageButton: React.FC<SortableStageButtonProps> = ({ 
  stage, 
  isActive, 
  onClick, 
  isDragging, 
  isOver,
  onDelete,
  onEdit
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${styles.stageButton} ${isActive ? styles.active : ''} ${
        isDragging ? styles.dragging : ''
      } ${isOver ? styles.over : ''}`}
      onClick={(e) => {
        // Prevenir el clic durante el arrastre
        if (!isDragging) {
          onClick();
        }
      }}
    >
      <span className={styles.stageName}>{stage.name}</span>
      {isDragging && <span className={styles.dragIndicator}>↔</span>}
      
      {/* Botones de acción que aparecen al hacer hover */}
      <div className={styles.stageActions}>
        <button
          className={styles.editStageButton}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(stage);
          }}
          title="Editar etapa"
        >
          <EditIcon fontSize="small" />
        </button>
        <button
          className={styles.deleteStageButton}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(stage);
          }}
          title="Eliminar etapa"
        >
          <DeleteIcon fontSize="small" />
        </button>
      </div>
    </button>
  );
};

const ArchitectureProjectDetail: React.FC = () => {
  const { projectId, architectureId } = useParams<{ projectId: string; architectureId: string }>();
  const navigate = useNavigate();

  const [activeStageId, setActiveStageId] = useState<number | null>(null);

  // Get all stages for the selector
  const { projects: stages, reorderNodes, createProject, updateProject } = useProjectNodes<ProjectNode>({ parent: Number(architectureId), type: 'stage' });

  // Ordenar los stages por el campo order
  const sortedStages = stages ? [...stages].sort((a, b) => a.order - b.order) : [];



  const { projects: architectureProjects, deleteProject } = useProjectNodes<ProjectNode>({ type: 'architecture_subproject' });
  const architectureProject = architectureProjects?.find(p => p.id === Number(architectureId));

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  
  // Estados para crear/eliminar/editar etapas
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [newStageName, setNewStageName] = useState('');
  const [creatingStage, setCreatingStage] = useState(false);
  const [editingStage, setEditingStage] = useState<ProjectNode | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);
  const [deleteStageTarget, setDeleteStageTarget] = useState<ProjectNode | null>(null);
  const [showDeleteStageModal, setShowDeleteStageModal] = useState(false);
  const [deletingStage, setDeletingStage] = useState(false);

  // Configuración de sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requiere 5px de movimiento para activar el drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Función para manejar el inicio del drag
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  // Función para manejar el drag over
  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as number || null);
  };

  // Función para manejar el final del drag and drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (active.id !== over?.id && sortedStages) {
      const oldIndex = sortedStages.findIndex(stage => stage.id === active.id);
      const newIndex = sortedStages.findIndex(stage => stage.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newStages = arrayMove(sortedStages, oldIndex, newIndex);
        
        // Preparar los datos para enviar al backend
        const nodeOrders = newStages.map((stage, index) => ({
          id: stage.id,
          order: index
        }));

        try {
          await reorderNodes(Number(architectureId), nodeOrders);
          console.log('Stages reordenados exitosamente');
        } catch (error) {
          console.error('Error al reordenar los stages:', error);
          alert('Error al reordenar los stages. Por favor, intenta de nuevo.');
        }
      }
    }
  };

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

  // Manejadores para crear etapas
  const handleCreateStage = async () => {
    if (!newStageName.trim()) {
      setStageError('El nombre de la etapa es obligatorio');
      return;
    }
    setStageError(null);
    try {
      await createProject.mutateAsync({
        parent: Number(architectureId),
        name: newStageName,
        description: '',
        is_active: true,
        type: 'stage' as TypeCode,
      });
      setCreatingStage(false);
      setNewStageName('');
      setAnchorEl(null);
    } catch (err: any) {
      setStageError(extractBackendError(err));
    }
  };

  // Manejadores para editar etapas
  const handleEditStage = async () => {
    if (!editingStage || !newStageName.trim()) {
      setStageError('El nombre de la etapa es obligatorio');
      return;
    }
    setStageError(null);
    try {
      await updateProject.mutateAsync({
        id: editingStage.id,
        data: {
          name: newStageName,
        }
      });
      setEditingStage(null);
      setNewStageName('');
      setAnchorEl(null);
    } catch (err: any) {
      setStageError(extractBackendError(err));
    }
  };

  // Manejadores para eliminar etapas
  const handleDeleteStage = async () => {
    if (!deleteStageTarget) return;
    setDeletingStage(true);
    try {
      await deleteProject.mutateAsync(deleteStageTarget.id);
      setShowDeleteStageModal(false);
      setDeleteStageTarget(null);
    } catch (err: any) {
      setStageError(extractBackendError(err));
    } finally {
      setDeletingStage(false);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNewStageName('');
    setCreatingStage(false);
    setEditingStage(null);
    setStageError(null);
  };

  useEffect(() => {
    if (sortedStages && sortedStages.length > 0 && !activeStageId) {
      setActiveStageId(sortedStages[0].id);
    }
  }, [sortedStages, activeStageId]);

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
          <section className={styles.infoSection}>
            <h2>Detalles del Proyecto</h2>
            <p><strong>Descripción:</strong> {architectureProject.description}</p>
          </section>
        </main>

        <aside className={styles.sideMenu}>
          <div className={styles.menuSection}>
            <Link to={`/proyectos/${projectId}/arquitectura/${architectureId}/propiedad`} className={styles.menuButton}><HomeIcon className={styles.icon} />Propiedad</Link>
            <Link to={`/proyectos/${projectId}/arquitectura/${architectureId}/presupuestos`} className={styles.menuButton}><BudgetIcon className={styles.icon} />Presupuestos</Link>
            <Link to={`/proyectos/${projectId}/arquitectura/${architectureId}/profesionales`} className={styles.menuButton}><PeopleIcon className={styles.icon} />Propietario / Profesionales</Link>
          </div>
        </aside>
      </div>

      <section className={styles.antecedentesSection}>
        <div className={styles.stagesNavigation}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >

            <SortableContext
              items={sortedStages?.map(stage => stage.id) || []}
              strategy={horizontalListSortingStrategy}
            >
              <div className={styles.stagesContainer}>
                {(sortedStages || []).map(stage => (
                  <SortableStageButton
                    key={stage.id}
                    stage={stage}
                    isActive={activeStageId === stage.id}
                    onClick={() => setActiveStageId(stage.id)}
                    isDragging={activeId === stage.id}
                    isOver={overId === stage.id}
                    onDelete={(stage) => {
                      setDeleteStageTarget(stage);
                      setShowDeleteStageModal(true);
                    }}
                    onEdit={(stage) => {
                      setEditingStage(stage);
                      setNewStageName(stage.name);
                      setAnchorEl(document.activeElement as HTMLElement);
                      setCreatingStage(false);
                      setStageError(null);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button
            className={styles.addStageButton}
            onClick={(e) => {
              setAnchorEl(e.currentTarget);
              setCreatingStage(true);
              setNewStageName('');
              setStageError(null);
            }}
            title="Agregar etapa"
          >
            <AddIcon />
            <span>Agregar Etapa</span>
          </button>
        </div>

        {activeStageId && (
          <ListadoDeAntecedentes 
            stageId={activeStageId}
            projectId={Number(projectId)}
            architectureProjectId={Number(architectureId)}
          />
        )}
      </section>

      {/* Popover para crear/editar etapas */}
      <Popover
        open={!!anchorEl && (creatingStage || !!editingStage)}
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            {editingStage ? 'Editar Etapa' : 'Crear Nueva Etapa'}
          </Typography>
          <input
            type="text"
            placeholder="Nombre de la etapa"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                if (editingStage) {
                  handleEditStage();
                } else {
                  handleCreateStage();
                }
              }
            }}
          />
          {stageError && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>
              {stageError}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={editingStage ? handleEditStage : handleCreateStage}
              disabled={!newStageName.trim()}
            >
              {editingStage ? 'Guardar Cambios' : 'Crear Etapa'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleMenuClose}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Modal de confirmación para eliminar etapas */}
      <DeleteConfirmationModal
        open={showDeleteStageModal}
        title="Eliminar etapa"
        message={`¿Estás seguro de que deseas eliminar la etapa "${deleteStageTarget?.name}"? Esta acción es irreversible.`}
        onCancel={() => setShowDeleteStageModal(false)}
        onConfirm={handleDeleteStage}
      />

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
