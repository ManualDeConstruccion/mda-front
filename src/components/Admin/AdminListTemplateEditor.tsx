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
} from '@mui/material';
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
}> = ({ template, depth, isDragging = false }) => {
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
    </tr>
  );
};

// Componente para una fila de template no-sortable (hijos)
const TemplateRow: React.FC<{
  template: ListTemplate;
  depth: number;
}> = ({ template, depth }) => {
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
    </tr>
  );
};

// Componente para construir el árbol jerárquico
const TemplateTree: React.FC<{
  templates: ListTemplate[];
  depth?: number;
  parentCode?: string | null;
}> = ({ templates, depth = 0, parentCode = null }) => {
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
          <TemplateRow template={template} depth={depth} />
          <TemplateTree
            templates={templates}
            depth={depth + 1}
            parentCode={template.code}
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

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

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
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
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
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Editar Listado: {projectType.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : templates.length === 0 ? (
            <Alert severity="info">
              No hay templates definidos para este tipo de proyecto.
            </Alert>
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
                            />
                            <TemplateTree
                              templates={templates}
                              depth={1}
                              parentCode={template.code}
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
        <Button onClick={handleClose} disabled={updateOrderMutation.isPending}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminListTemplateEditor;
