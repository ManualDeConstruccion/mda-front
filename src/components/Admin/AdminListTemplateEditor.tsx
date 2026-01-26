import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from '../../pages/ArchitectureProjects/ListadoDeAntecedentes.module.scss';
import CreateEditTemplateModal from './CreateEditTemplateModal';
import EditProjectTypeList from './EditProjectTypeList';

interface NodeType {
  id: number;
  code: string;
  name: string;
}

interface ListTemplate {
  id: number;
  architecture_project_type: number;
  architecture_project_type_name?: string;
  name: string;
  description?: string;
  code: string;
  node_type: number;
  node_type_name?: string;
  node_type_code?: string;
  parent_code?: string | null;
  order: number;
}

interface ArchitectureProjectType {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: number;
  order: number;
  is_active: boolean;
}

interface AdminListTemplateEditorProps {
  open: boolean;
  onClose: () => void;
  projectType: ArchitectureProjectType | null;
}

// Componente para una fila de template sortable
const SortableTemplateRow: React.FC<{
  template: ListTemplate;
  depth: number;
  isDragging?: boolean;
  onEdit?: (template: ListTemplate) => void;
  onDelete?: (template: ListTemplate) => void;
}> = ({ template, depth, isDragging = false, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const indentStyle = {
    paddingLeft: `${depth * 30 + 10}px`,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={styles.listadoRow}
    >
      <td style={indentStyle} className={styles.listadoCellNombreIndent}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            {...attributes}
            {...listeners}
            sx={{
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <Typography variant="body2" sx={{ userSelect: 'none' }}>
              ⋮⋮
            </Typography>
          </Box>
          <Typography variant="body2" fontWeight="medium">
            {template.name}
          </Typography>
        </Box>
        {template.description && (
          <Typography variant="caption" color="text.secondary" className={styles.textDescripcion}>
            {template.description}
          </Typography>
        )}
      </td>
      <td className={styles.listadoCellDescripcionIndent}>
        <Typography variant="body2">
          {template.node_type_name || template.node_type_code || 'N/A'}
        </Typography>
      </td>
      <td className={styles.listadoCellDescripcionIndent}>
        <Typography variant="body2" color="text.secondary">
          {template.code}
        </Typography>
      </td>
      <td className={styles.listadoCellDescripcionIndent}>
        <Typography variant="body2" color="text.secondary">
          {template.parent_code || '-'}
        </Typography>
      </td>
      <td className={styles.listadoCellDescripcionIndent}>
        <Typography variant="body2" fontWeight="medium">
          {template.order}
        </Typography>
      </td>
      <td className={styles.acciones}>
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          {onEdit && (
            <Tooltip title="Editar elemento">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(template);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Eliminar elemento">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(template);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </td>
    </tr>
  );
};

// Componente para una fila de template no-sortable (hijos)
const TemplateRow: React.FC<{
  template: ListTemplate;
  depth: number;
  onEdit?: (template: ListTemplate) => void;
  onDelete?: (template: ListTemplate) => void;
}> = ({ template, depth, onEdit, onDelete }) => {
  const indentStyle = {
    paddingLeft: `${depth * 30 + 10}px`,
  };

  return (
    <tr className={styles.listadoRow}>
      <td style={indentStyle} className={styles.listadoCellNombreIndent}>
        <Typography variant="body2" fontWeight="medium">
          {template.name}
        </Typography>
        {template.description && (
          <Typography variant="caption" color="text.secondary" className={styles.textDescripcion}>
            {template.description}
          </Typography>
        )}
      </td>
      <td className={styles.listadoCellDescripcionIndent}>
        <Typography variant="body2">
          {template.node_type_name || template.node_type_code || 'N/A'}
        </Typography>
      </td>
      <td className={styles.listadoCellDescripcionIndent}>
        <Typography variant="body2" color="text.secondary">
          {template.code}
        </Typography>
      </td>
      <td className={styles.listadoCellDescripcionIndent}>
        <Typography variant="body2" color="text.secondary">
          {template.parent_code || '-'}
        </Typography>
      </td>
      <td className={styles.listadoCellDescripcionIndent}>
        <Typography variant="body2" fontWeight="medium">
          {template.order}
        </Typography>
      </td>
      <td className={styles.acciones}>
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          {onEdit && (
            <Tooltip title="Editar template">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(template);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Eliminar template">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(template);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </td>
    </tr>
  );
};

// Componente para construir el árbol jerárquico
const TemplateTree: React.FC<{
  templates: ListTemplate[];
  depth?: number;
  parentCode?: string | null;
  onEdit?: (template: ListTemplate) => void;
  onDelete?: (template: ListTemplate) => void;
}> = ({ templates, depth = 0, parentCode = null, onEdit, onDelete }) => {
  // Filtrar templates por parent_code
  const children = templates.filter(
    (t) => (t.parent_code || null) === parentCode
  ).sort((a, b) => a.order - b.order);

  if (children.length === 0) {
    return null;
  }

  return (
    <>
      {children.map((template) => (
        <React.Fragment key={template.id}>
          <TemplateRow template={template} depth={depth} onEdit={onEdit} onDelete={onDelete} />
          <TemplateTree
            templates={templates}
            depth={depth + 1}
            parentCode={template.code}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </React.Fragment>
      ))}
    </>
  );
};

const AdminListTemplateEditor: React.FC<AdminListTemplateEditorProps> = ({
  open,
  onClose,
  projectType,
}) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [templates, setTemplates] = useState<ListTemplate[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ListTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ListTemplate | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  
  // Obtener token con fallback
  const getAuthToken = () => {
    return accessToken || localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  };

  // Obtener todos los templates del project type
  const { data: templatesData, isLoading } = useQuery<ListTemplate[]>({
    queryKey: ['list-templates-all', projectType?.id],
    queryFn: async () => {
      if (!projectType) return [];
      const response = await axios.get(
        `${API_URL}/api/architecture/list-templates/all-by-project-type/${projectType.id}/`,
        {
          withCredentials: true,
          headers: {
            'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
          },
        }
      );
      return response.data || [];
    },
    enabled: open && !!projectType,
  });

  // Actualizar estado local cuando cambian los datos
  useEffect(() => {
    if (templatesData) {
      setTemplates(templatesData);
    }
  }, [templatesData]);

  // Mutation para actualizar el orden
  const updateOrderMutation = useMutation({
    mutationFn: async (templateOrders: { id: number; order: number }[]) => {
      if (!projectType) return;
      const response = await axios.post(
        `${API_URL}/api/architecture/list-templates/update-order/`,
        {
          project_type_id: projectType.id,
          template_orders: templateOrders,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-templates-all', projectType?.id] });
      queryClient.invalidateQueries({ queryKey: ['list-template', projectType?.id] });
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
    },
  });

  // Mutation para eliminar template
  const deleteMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await axios.delete(
        `${API_URL}/api/architecture/list-templates/${templateId}/`,
        {
          withCredentials: true,
          headers: {
            'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-templates-all', projectType?.id] });
      queryClient.invalidateQueries({ queryKey: ['list-template', projectType?.id] });
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    },
  });

  // Handlers
  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    // Calcular orden por defecto: máximo orden + 1
    const maxOrder = templates.length > 0 
      ? Math.max(...templates.map(t => t.order)) 
      : -1;
    setEditModalOpen(true);
  };

  const handleEditTemplate = (template: ListTemplate) => {
    setSelectedTemplate(template);
    setEditModalOpen(true);
  };

  const handleDeleteTemplate = (template: ListTemplate) => {
    setDeleteTarget(template);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const handleTemplateSaved = () => {
    setEditModalOpen(false);
    setSelectedTemplate(null);
  };

  // Obtener códigos disponibles para parent_code (excluyendo el template actual si está editando)
  const availableParentCodes = templates
    .filter((t) => !selectedTemplate || t.id !== selectedTemplate.id)
    .map((t) => t.code);

  // Configuración de sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Obtener templates raíz (sin parent_code) ordenados
  const rootTemplates = templates
    .filter((t) => !t.parent_code)
    .sort((a, b) => a.order - b.order);

  // Función para manejar el final del drag and drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id && rootTemplates.length > 0) {
      const oldIndex = rootTemplates.findIndex((t) => t.id === active.id);
      const newIndex = rootTemplates.findIndex((t) => t.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newRootTemplates = arrayMove(rootTemplates, oldIndex, newIndex);

        // Preparar los datos para enviar al backend
        const templateOrders = newRootTemplates.map((template, index) => ({
          id: template.id,
          order: index,
        }));

        try {
          await updateOrderMutation.mutateAsync(templateOrders);
        } catch (error) {
          console.error('Error al reordenar templates:', error);
        }
      }
    }
  };

  const handleClose = () => {
    if (!updateOrderMutation.isPending) {
      onClose();
    }
  };

  if (!projectType) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Editar Listado: {projectType.name}</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTemplate}
              size="small"
            >
              Agregar Elemento
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Componente para editar ProjectTypeList */}
            <EditProjectTypeList projectType={projectType} />
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : templates.length === 0 ? (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  No hay templates definidos para este tipo de proyecto.
                </Alert>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddTemplate}
                >
                  Crear Primer Elemento
                </Button>
              </Box>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Arrastra y suelta los elementos para reordenar. Solo puedes reordenar los templates de nivel raíz.
                </Alert>

                <Box className={styles.tableContainer}>
                  <table className={styles.listadoTable}>
                    <thead>
                      <tr>
                        <th className={styles.tableHeader}>Nombre</th>
                        <th className={styles.tableHeader}>Tipo</th>
                        <th className={styles.tableHeader}>Código</th>
                        <th className={styles.tableHeader}>Padre</th>
                        <th className={styles.tableHeader}>Orden</th>
                        <th className={styles.tableHeader}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        onDragStart={(event) => {
                          setActiveId(event.active.id as number);
                        }}
                      >
                        <SortableContext
                          items={rootTemplates.map((t) => t.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {rootTemplates.map((template) => (
                            <React.Fragment key={template.id}>
                              <SortableTemplateRow
                                template={template}
                                depth={0}
                                isDragging={activeId === template.id}
                                onEdit={handleEditTemplate}
                                onDelete={handleDeleteTemplate}
                              />
                              <TemplateTree
                                templates={templates}
                                depth={1}
                                parentCode={template.code}
                                onEdit={handleEditTemplate}
                                onDelete={handleDeleteTemplate}
                              />
                            </React.Fragment>
                          ))}
                        </SortableContext>
                      </DndContext>
                    </tbody>
                  </table>
                </Box>

              {updateOrderMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Error al actualizar el orden. Por favor, intenta nuevamente.
                </Alert>
              )}

              {updateOrderMutation.isSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Orden actualizado correctamente.
                </Alert>
              )}
            </>
              )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateOrderMutation.isPending || deleteMutation.isPending}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>

    {/* Modal para crear/editar template */}
    <CreateEditTemplateModal
      open={editModalOpen}
      onClose={() => {
        setEditModalOpen(false);
        setSelectedTemplate(null);
      }}
      onSuccess={handleTemplateSaved}
      projectType={projectType}
      template={selectedTemplate}
      availableParentCodes={availableParentCodes}
      defaultOrder={
        selectedTemplate 
          ? undefined 
          : templates.length > 0 
            ? Math.max(...templates.map(t => t.order)) + 1 
            : 0
      }
    />

    {/* Modal de confirmación para eliminar */}
    <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
      <DialogTitle>Eliminar Template</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Estás seguro de que deseas eliminar el template <strong>"{deleteTarget?.name}"</strong>?
          {templates.some((t) => t.parent_code === deleteTarget?.code) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Este template tiene hijos. Se eliminarán también todos los templates hijos asociados.
            </Alert>
          )}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteModalOpen(false)} disabled={deleteMutation.isPending}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmDelete}
          color="error"
          variant="contained"
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  </>
  );
};

export default AdminListTemplateEditor;
