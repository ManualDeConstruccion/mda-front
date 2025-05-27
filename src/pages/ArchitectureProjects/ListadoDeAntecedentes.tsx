import React, { useState } from 'react';
import { useProjectNodeTree } from '../../hooks/useProjectNodes';
import { TypeCode, ProjectNode } from '../../types/project_nodes.types';
import { Button, Popover, Typography, Box, } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { useQueryClient } from '@tanstack/react-query';
import styles from './ListadoDeAntecedentes.module.scss';
import ModalDocumentNode from '../EditArchitectureNodes/EditDocumentNode';
import EditListNode from '../EditArchitectureNodes/EditListNode';
import { useFormNode } from '../../context/FormNodeContext';
import { useNavigate } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';

// Importar componentes refactorizados
import NodeTree from './components/NodeTree';
import NodeTypeMenu from './components/NodeTypeMenu';

interface ListadoDeAntecedentesProps {
  stageId: number;
  projectId: number;
  architectureProjectId: number;
}

// Función para extraer el error del backend
function extractBackendError(err: any): string {
  if (err?.response?.data && typeof err.response.data === 'object') {
    const values = Object.values(err.response.data);
    if (Array.isArray(values[0])) {
      return (values as any[]).flat().join(' ');
    }
    return values.join(' ');
  }
  return err?.response?.data?.detail || err?.message || 'Error desconocido';
}

const ListadoDeAntecedentes: React.FC<ListadoDeAntecedentesProps> = ({ stageId, projectId, architectureProjectId }) => {
  const queryClient = useQueryClient();
  const { data: tree, isLoading } = useProjectNodeTree(stageId);

  // Estados para el manejo de acordeones
  const [openAccordions, setOpenAccordions] = useState<{ [key: number]: boolean }>({});

  // Estados para el menú de tipos de nodos
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [newListName, setNewListName] = useState('');
  const [creatingList, setCreatingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para edición y eliminación
  const [editingListNode, setEditingListNode] = useState<ProjectNode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingNode, setEditingNode] = useState<ProjectNode | null>(null);

  const { setSelectedForm, setNodeData, setProjectId, setArchitectureProjectId } = useFormNode();
  const navigate = useNavigate();

  // For creating lists and antecedentes, fallback to useProjectNodes for mutations
  const { createProject: createList, deleteProject } = useProjectNodes();

  if (isLoading) return <Typography>Cargando...</Typography>;
  if (!tree) return <Typography>No hay datos.</Typography>;

  // Obtener los lists hijos del stage
  const lists = (tree.children || [])
    .filter((n: any) => n.type === 'list')
    .sort((a: any, b: any) => a.name.localeCompare(b.name));

  // Manejadores de eventos
  const handleAccordionToggle = (listId: number) => {
    setOpenAccordions(prev => ({ ...prev, [listId]: !prev[listId] }));
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedListId(null);
    setNewListName('');
    setCreatingList(false);
    setError(null);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setError('El nombre del listado es obligatorio');
      return;
    }
    setError(null);
    try {
      await createList.mutateAsync({
        parent: selectedListId || stageId,
        name: newListName,
        description: '',
        is_active: true,
        type: 'list' as TypeCode,
      });
      setCreatingList(false);
      setNewListName('');
      handleMenuClose();
      queryClient.invalidateQueries({ queryKey: ['projectNodeTree', stageId] });
    } catch (err: any) {
      setError(extractBackendError(err));
    }
  };

  // --- Handler para editar nodos según su tipo ---
  const handleEditNode = (node: ProjectNode) => {
    switch (node.type) {
      case 'list':
        setEditingListNode(node);
        break;
      case 'document':
        setEditingNode(node); // Modal para documentos
        break;
      case 'construction_solution':
        setNodeData(node);
        setProjectId(projectId);
        setArchitectureProjectId(architectureProjectId);
        navigate(`/form/node/edit/${node.id}`);
        break;
      default:
        // Aquí puedes manejar otros tipos en el futuro
        break;
    }
  };

  const handleCreateAntecedent = async (type: TypeCode) => {
    if (!selectedListId) {
      setError('Selecciona un listado');
      return;
    }
    setError(null);

    switch (type) {
      case 'form':
        setNodeData({
          parent: selectedListId,
          name: '',
          description: '',
          is_active: true,
          type: 'form',
          project_id: projectId,
          architecture_project_id: architectureProjectId,
        });
        setProjectId(projectId);
        setArchitectureProjectId(architectureProjectId);
        setSelectedForm(undefined);
        handleMenuClose();
        navigate('/form/select');
        return;
      case 'document':
        // Lógica para crear documento
        break;
      case 'certificate':
        // Lógica para crear certificado
        break;
      case 'external_link':
        // Lógica para crear enlace externo
        break;
      default:
        break;
    }

    try {
      const tempNode: ProjectNode = {
        id: -1,
        parent: selectedListId,
        name: '',
        description: '',
        is_active: true,
        type: type,
        type_name: '',
        children: [],
        file_type: null,
        properties: [],
        architecture_project: null,
        file: null,
        cover_image: null,
        external_url: null,
        external_file_name: null,
        external_file_id: null,
        metadata: {},
        start_date: null,
        end_date: null,
        status: 'en_estudio',
        progress_percent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        file_url: null,
        cover_image_url: null,
        object_id: null
      };
      setEditingNode(tempNode);
      handleMenuClose();
    } catch (err: any) {
      setError(extractBackendError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject.mutateAsync(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['projectNodeTree', stageId] });
    } catch (err: any) {
      setError(extractBackendError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>Listado de antecedentes</Typography>
      <div className={styles.container}>
        <Box className={styles.tableContainer}>
          <table className={styles.listadoTable}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>Nombre</th>
                <th className={styles.tableHeader}>Tipo</th>
                <th className={styles.tableHeader}>Fecha inicio</th>
                <th className={styles.tableHeader}>Fecha fin</th>
                <th className={styles.tableHeader}>Estado</th>
                <th className={styles.tableHeader}>Progreso</th>
                <th className={styles.tableHeader}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <NodeTree
                nodes={lists}
                openAccordions={openAccordions}
                onToggleAccordion={handleAccordionToggle}
                onAddNode={(nodeId) => {
                  setAnchorEl(document.activeElement as HTMLElement);
                  setSelectedListId(nodeId);
                  setCreatingList(false);
                  setError(null);
                }}
                onEditNode={handleEditNode}
                onDeleteNode={(node) => {
                  setDeleteTarget(node);
                  setShowDeleteModal(true);
                }}
              />
            </tbody>
          </table>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={(e) => {
            setAnchorEl(e.currentTarget);
            setSelectedListId(null);
            setCreatingList(true);
            setError(null);
          }}
          className={styles.addButton}
        >
          Agregar Listado
        </Button>
      </div>

      {/* Popover para agregar listado o antecedentes */}
      <Popover
        open={!!anchorEl && Boolean(creatingList || selectedListId)}
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <NodeTypeMenu
          isCreatingList={creatingList}
          selectedListId={selectedListId}
          newListName={newListName}
          onNewListNameChange={setNewListName}
          onCreateList={handleCreateList}
          onCreateAntecedent={handleCreateAntecedent}
          onStartCreatingList={() => { setCreatingList(true); setNewListName(''); }}
          error={error}
        />
      </Popover>

      {/* Modal de confirmación para eliminar */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <DialogTitle>Eliminar {deleteTarget?.type === 'list' ? 'Listado' : 'Documento'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget?.type === 'list' && deleteTarget?.children && deleteTarget.children.length > 0 ? (
              <>¿Estás seguro de que deseas eliminar este listado? <b>Se eliminarán también todos los antecedentes y listados hijos asociados.</b></>
            ) : (
              <>¿Estás seguro de que deseas eliminar este {deleteTarget?.type === 'list' ? 'listado' : 'documento'}?</>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" disabled={deleting} variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* --- Modales de edición según tipo de nodo --- */}
      {/* Modal para editar nodos tipo 'document' */}
      <ModalDocumentNode
        open={!!editingNode && editingNode.type === 'document'}
        onClose={() => setEditingNode(null)}
        node={editingNode}
        stageId={stageId}
      />
      {/* Modal para editar nodos tipo 'list' */}
      <EditListNode
        open={!!editingListNode && editingListNode.type === 'list'}
        onClose={() => setEditingListNode(null)}
        node={editingListNode}
        stageId={stageId}
      />
      {/* Aquí puedes agregar el modal para 'construction_solution' en el futuro */}
      {/* <EditConstructionSolutionNode
        open={!!editingConstructionSolutionNode}
        onClose={() => setEditingConstructionSolutionNode(null)}
        node={editingConstructionSolutionNode}
        stageId={stageId}
      /> */}
    </div>
  );
};

export default ListadoDeAntecedentes; 