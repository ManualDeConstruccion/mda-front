import React, { useState } from 'react';
import { useProjectNodeTree } from '../../hooks/useProjectNodes';
import { NodeType, ProjectNode } from '../../types/project_nodes.types';
import { Button, Popover, MenuItem, TextField, Typography, IconButton, Box, } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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

interface ListadoDeAntecedentesProps {
  stageId: number;
  projectId: number;
  architectureProjectId: number;
}

// Agregar función para extraer el error del backend
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

// Restaurar la interfaz para el tipado de generateTableRowsWithAccordion
interface GenerateTableRowsProps {
  nodes: any[];
  depth?: number;
  setAnchorEl: React.Dispatch<React.SetStateAction<null | HTMLElement>>;
  setSelectedListId: React.Dispatch<React.SetStateAction<number | null>>;
  setCreatingList: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setDeleteTarget: React.Dispatch<React.SetStateAction<any | null>>;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingListNode: React.Dispatch<React.SetStateAction<ProjectNode | null>>;
  setEditingNode: React.Dispatch<React.SetStateAction<ProjectNode | null>>;
  setNodeData: (data: any) => void;
  setSelectedForm: (form: any) => void;
  navigate: (path: string) => void;
  stageId: number;
}

// Generar filas de la tabla mezclando documentos y listados hijos, con indentación y controles y acordeón
function generateTableRowsWithAccordion({
  nodes,
  depth = 0,
  openAccordions,
  handleAccordionToggle,
  setAnchorEl,
  setSelectedListId,
  setCreatingList,
  setError,
  setDeleteTarget,
  setShowDeleteModal,
  setEditingListNode,
  setEditingNode,
  setNodeData,
  setSelectedForm,
  navigate,
  stageId,
}: GenerateTableRowsProps & {
  openAccordions: { [key: number]: boolean };
  handleAccordionToggle: (listId: number) => void;
}): React.ReactNode[] {
  let rows: React.ReactNode[] = [];
  nodes.forEach((node: any) => {
    if (node.type_code === 'list') {
      rows.push(
        <React.Fragment key={node.id}>
          <tr className={styles.listadoRow}>
            <td className={styles.listadoCellNombre + ' ' + (depth > 0 ? styles.listadoCellNombreIndent : '')} onClick={() => handleAccordionToggle(node.id)}>
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton size="small" onClick={e => { e.stopPropagation(); handleAccordionToggle(node.id); }}>
                  {openAccordions[node.id] ? <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} /> : <ExpandMoreIcon />}
                </IconButton>
                <Typography className={styles.textNombre}>{node.name}</Typography>
              </Box>
            </td>
            <td className={styles.listadoCell}></td>
            <td className={styles.listadoCell}></td>
            <td className={styles.listadoCell}></td>
            <td className={styles.listadoCell}>{node.status || '-'}</td>
            <td className={styles.listadoCell}>{node.progress_percent ?? 0}%</td>
            <td className={styles.acciones}>
              <IconButton size="small" onClick={e => { e.stopPropagation(); setEditingListNode(node); }}>
                <EditIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={e => { e.stopPropagation(); setAnchorEl(e.currentTarget); setSelectedListId(node.id); setCreatingList(false); setError(null); }}
                className={styles.botonAzul}
              >
                <AddIcon />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={e => {
                  e.stopPropagation();
                  setDeleteTarget(node);
                  setShowDeleteModal(true);
                }}
                className={styles.botonRojo}
              >
                <DeleteIcon />
              </IconButton>
            </td>
          </tr>
          {/* Fila para la descripción del listado */}
          <tr className={styles.listadoRow}>
            <td colSpan={7} className={styles.listadoCellDescripcionIndent}>
              {node.description && (
                <Typography variant="body2" className={styles.textDescripcion}>
                  {node.description}
                </Typography>
              )}
            </td>
          </tr>
          {openAccordions[node.id] && (
            <>
              {/* Primero renderiza los listados hijos recursivamente */}
              {generateTableRowsWithAccordion({
                nodes: (node.children || []).filter((n: any) => n.type_code === 'list'),
                depth: depth + 1,
                openAccordions,
                handleAccordionToggle,
                setAnchorEl,
                setSelectedListId,
                setCreatingList,
                setError,
                setDeleteTarget,
                setShowDeleteModal,
                setEditingListNode,
                setEditingNode,
                setNodeData,
                setSelectedForm,
                navigate,
                stageId,
              })}
              {/* Luego renderiza los documentos hijos de este listado */}
              {(node.children || []).filter((n: any) => n.type_code !== 'list').map((doc: any) => {
                return (
                  <tr key={doc.id}>
                    <td className={`${styles.tableCellIndent} ${styles[`indent-${depth + 2}`]}`}>
                      {doc.file_url ? (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className={styles.textDocument}>
                          {doc.name}
                        </a>
                      ) : (
                        <Typography className={styles.textDocument}>{doc.name}</Typography>
                      )}
                    </td>
                    <td className={styles.tableCell}>{doc.type_display}</td>
                    <td className={styles.tableCell}>{doc.start_date ? new Date(doc.start_date).toLocaleDateString() : '-'}</td>
                    <td className={styles.tableCell}>{doc.end_date ? new Date(doc.end_date).toLocaleDateString() : '-'}</td>
                    <td className={styles.tableCell}>{doc.status || '-'}</td>
                    <td className={styles.tableCell}>{doc.progress_percent ?? 0}%</td>
                    <td className={styles.tableCellRight}>
                      <IconButton size="small" onClick={e => {
                        e.stopPropagation();
                        if (doc.type_code === 'construction_solution') {
                          if (typeof setNodeData === 'function' && typeof setSelectedForm === 'function' && typeof navigate === 'function') {
                            setNodeData({
                              ...doc,
                              stageId: stageId,
                              isEditing: true
                            });
                            setSelectedForm({ 
                              id: doc.form_id, 
                              name: doc.form_name,
                              isEditing: true
                            });
                            navigate('/constructive/create');
                          }
                        } else {
                          setEditingNode(doc);
                        }
                      }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteTarget(doc);
                          setShowDeleteModal(true);
                        }}
                        className={styles.tableCellRightButton}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </td>
                  </tr>
                );
              })}
            </>
          )}
        </React.Fragment>
      );
    } else {
      // Fila para documento
      // Solo renderizar documentos en el nivel raíz (si es necesario, pero normalmente no)
    }
  });
  return rows;
}

const ListadoDeAntecedentes: React.FC<ListadoDeAntecedentesProps> = ({ stageId, projectId, architectureProjectId }) => {
  const queryClient = useQueryClient();
  // Usar el árbol completo del stage
  const { data: tree, isLoading } = useProjectNodeTree(stageId);
  // State for which accordions are open
  const [openAccordions, setOpenAccordions] = useState<{ [key: number]: boolean }>({});
  // State for add antecedent menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [newListName, setNewListName] = useState('');
  const [creatingList, setCreatingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingListNode, setEditingListNode] = useState<ProjectNode | null>(null);
  // Estado para eliminar
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingNode, setEditingNode] = useState<ProjectNode | null>(null);

  const { setSelectedForm, setNodeData } = useFormNode();
  const navigate = useNavigate();

  // For creating lists and antecedentes, fallback to useProjectNodes for mutations
  const { createProject: createList, deleteProject } = require('../../hooks/useProjectNodes').useProjectNodes();

  if (isLoading) return <Typography>Cargando...</Typography>;
  if (!tree) return <Typography>No hay datos.</Typography>;

  // Obtener los lists hijos del stage
  const lists = (tree.children || [])
    .filter((n: any) => n.type_code === 'list')
    .sort((a: any, b: any) => a.name.localeCompare(b.name));

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
      const result = await createList.mutateAsync({
        parent: stageId,
        name: newListName,
        description: '',
        is_active: true,
        type: 'list' as NodeType,
      });
      setSelectedListId(result.id);
      setCreatingList(false);
      setNewListName('');
      queryClient.invalidateQueries({ queryKey: ['projectNodeTree', stageId] });
    } catch (err: any) {
      setError(extractBackendError(err));
    }
  };

  const handleCreateAntecedent = async (type: NodeType) => {
    if (!selectedListId) {
      setError('Selecciona un listado');
      return;
    }
    setError(null);

    if (type === 'construction_solution') {
      setNodeData({
        parent: selectedListId,
        name: '',
        description: '',
        is_active: true,
        type: 'construction_solution',
        project_id: projectId,
        architecture_project_id: architectureProjectId,
      });
      setSelectedForm(undefined);
      handleMenuClose();
      navigate('/constructive/select');
      return;
    }
    // ... resto para otros tipos (document, etc)
    try {
      // Crear un nodo temporal con el tipo seleccionado
      const tempNode: ProjectNode = {
        id: -1, // ID temporal
        parent: selectedListId,
        name: '',
        description: '',
        is_active: true,
        type,
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
        cover_image_url: null
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
        {/* Tabla raíz de documentos y listados hijos con acordeón */}
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
              {generateTableRowsWithAccordion({
                nodes: lists,
                depth: 0,
                openAccordions,
                handleAccordionToggle,
                setAnchorEl,
                setSelectedListId,
                setCreatingList,
                setError,
                setDeleteTarget,
                setShowDeleteModal,
                setEditingListNode,
                setEditingNode,
                setNodeData,
                setSelectedForm,
                navigate,
                stageId,
              })}
            </tbody>
          </table>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedListId(null); setCreatingList(true); setError(null); }} 
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
        <Box className={styles.popoverContent}>
          {/* Si estamos creando un listado y no hay listado seleccionado */}
          {creatingList && !selectedListId && (
            <Box className={styles.popoverSection}>
              <TextField
                label="Nombre del listado"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                size="small"
                fullWidth
              />
              <Button onClick={handleCreateList} variant="contained" color="primary" size="small" className={styles.popoverButton}>
                Crear Listado
              </Button>
            </Box>
          )}
          {/* Si hay un listado seleccionado, mostrar opciones para agregar antecedentes o crear listado contenedor */}
          {selectedListId && !creatingList && (
            <>
              <MenuItem disabled>Selecciona el tipo de antecedente a crear:</MenuItem>
              <MenuItem onClick={() => handleCreateAntecedent('document')}>Documento</MenuItem>
              <MenuItem onClick={() => handleCreateAntecedent('form')}>Formulario</MenuItem>
              <MenuItem onClick={() => handleCreateAntecedent('certificate')}>Certificado</MenuItem>
              <MenuItem onClick={() => handleCreateAntecedent('construction_solution')}>Solución Constructiva</MenuItem>
              <MenuItem onClick={() => handleCreateAntecedent('external_link')}>Enlace Externo</MenuItem>
              <MenuItem divider />
              <MenuItem onClick={() => { setCreatingList(true); setNewListName(''); }}>+ Agregar Listado Contenedor</MenuItem>
            </>
          )}
          {/* Si estamos creando un listado contenedor dentro de otro listado */}
          {creatingList && selectedListId && (
            <Box className={styles.popoverSection}>
              <TextField
                label="Nombre del listado contenedor"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                size="small"
                fullWidth
              />
              <Button onClick={async () => {
                if (!newListName.trim()) {
                  setError('El nombre del listado es obligatorio');
                  return;
                }
                setError(null);
                try {
                  await createList.mutateAsync({
                    parent: selectedListId,
                    name: newListName,
                    description: '',
                    is_active: true,
                    type: 'list' as NodeType,
                  });
                  setCreatingList(false);
                  setNewListName('');
                  setSelectedListId(null);
                  setAnchorEl(null);
                  queryClient.invalidateQueries({ queryKey: ['projectNodeTree', stageId] });
                } catch (err: any) {
                  setError(extractBackendError(err));
                }
              }} variant="contained" color="primary" size="small" className={styles.popoverButton}>
                Crear Listado Contenedor
              </Button>
            </Box>
          )}
          {error && <MenuItem disabled className={styles.errorText}>{error}</MenuItem>}
        </Box>
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
      <ModalDocumentNode
        open={!!editingNode}
        onClose={() => setEditingNode(null)}
        node={editingNode}
        stageId={stageId}
      />
      <EditListNode
        open={!!editingListNode}
        onClose={() => setEditingListNode(null)}
        node={editingListNode}
        stageId={stageId}
      />
    </div>
  );
};

export default ListadoDeAntecedentes; 