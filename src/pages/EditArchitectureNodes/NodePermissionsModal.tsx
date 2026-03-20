import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableHead, TableRow, TableCell, TableBody,
  Checkbox, Typography, Box, CircularProgress, Alert,
} from '@mui/material';
import { useAssignProjectNodePermission, useRemoveProjectNodePermission, useProjectNodeUserPermissions } from '../../hooks/useProjectNodePermissions';
import { useProjectCollaborators } from '../../hooks/useProjectCollaborators';
import { NodeCollaborator } from '../../types/project_collaborators.types';

interface NodePermissionsModalProps {
  open: boolean;
  onClose: () => void;
  nodeId: number | undefined;
}

const PERMISSIONS = [
  { key: 'view_projectnode', label: 'Puede ver' },
  { key: 'change_projectnode', label: 'Puede editar' },
  { key: 'delete_projectnode', label: 'Puede eliminar' },
];

// Fila de la tabla: muestra permisos actuales de un colaborador
const CollaboratorPermissionRow: React.FC<{
  collab: NodeCollaborator;
  nodeId: number | undefined;
  onClick: () => void;
}> = ({ collab, nodeId, onClick }) => {
  const userId = collab.collaborator?.id;
  const permsQuery = useProjectNodeUserPermissions(nodeId, userId);
  const perms = permsQuery.data ?? [];
  const displayName = collab.collaborator
    ? `${collab.collaborator.first_name} ${collab.collaborator.last_name}`.trim() || collab.collaborator.email
    : '—';

  return (
    <TableRow hover style={{ cursor: 'pointer' }} onClick={onClick}>
      <TableCell>{collab.collaborator?.email ?? '—'}</TableCell>
      <TableCell>{displayName}</TableCell>
      {PERMISSIONS.map(p => (
        <TableCell key={p.key} align="center">
          <Checkbox checked={perms.includes(p.key)} disabled size="small" />
        </TableCell>
      ))}
    </TableRow>
  );
};

// Editor de permisos para un colaborador específico
const CollaboratorPermissionEditor: React.FC<{
  collab: NodeCollaborator;
  nodeId: number;
  onBack: () => void;
}> = ({ collab, nodeId, onBack }) => {
  const assignPermission = useAssignProjectNodePermission();
  const removePermission = useRemoveProjectNodePermission();
  const userId = collab.collaborator?.id;
  const permsQuery = useProjectNodeUserPermissions(nodeId, userId);
  const perms = permsQuery.data ?? [];
  const isLoading = permsQuery.isLoading || assignPermission.isPending || removePermission.isPending;
  const displayName = collab.collaborator
    ? `${collab.collaborator.first_name} ${collab.collaborator.last_name}`.trim() || collab.collaborator.email
    : '—';

  const handleToggle = (permission: string, checked: boolean) => {
    if (!userId) return;
    if (checked) {
      assignPermission.mutate({ nodeId, user_id: userId, permission });
    } else {
      removePermission.mutate({ nodeId, user_id: userId, permission });
    }
  };

  return (
    <>
      <DialogTitle>Permisos de {displayName}</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="subtitle1"><b>Email:</b> {collab.collaborator?.email ?? '—'}</Typography>
          <Typography variant="subtitle1"><b>Rol:</b> {collab.role?.role ?? '—'}</Typography>
          {collab.company && (
            <Typography variant="subtitle1"><b>Empresa:</b> {collab.company.name}</Typography>
          )}
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              {PERMISSIONS.map(p => (
                <TableCell key={p.key} align="center">{p.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {PERMISSIONS.map(p => (
                <TableCell key={p.key} align="center">
                  <Checkbox
                    checked={perms.includes(p.key)}
                    onChange={e => handleToggle(p.key, e.target.checked)}
                    disabled={isLoading || !userId}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onBack} disabled={isLoading}>Volver al listado</Button>
      </DialogActions>
    </>
  );
};

const NodePermissionsModal: React.FC<NodePermissionsModalProps> = ({ open, onClose, nodeId }) => {
  const [selectedCollab, setSelectedCollab] = useState<NodeCollaborator | null>(null);
  const { collaborators, isLoading, isError } = useProjectCollaborators(nodeId);

  // Agrupar colaboradores por rol
  const byRole: Record<string, NodeCollaborator[]> = {};
  collaborators.forEach(c => {
    const key = c.role?.role ?? 'Sin rol';
    if (!byRole[key]) byRole[key] = [];
    byRole[key].push(c);
  });

  const renderList = () => (
    <>
      <DialogTitle>Permisos por colaborador</DialogTitle>
      <DialogContent>
        {isLoading && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={32} />
          </Box>
        )}
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            No se pudieron cargar los colaboradores.
          </Alert>
        )}
        {!isLoading && !isError && collaborators.length === 0 && (
          <Typography color="text.secondary" py={2}>
            Este nodo no tiene colaboradores asignados.
          </Typography>
        )}
        {Object.entries(byRole).map(([roleName, collabs]) => (
          <Box key={roleName} mb={3}>
            <Typography variant="h6" gutterBottom>{roleName}</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Nombre</TableCell>
                  {PERMISSIONS.map(p => (
                    <TableCell key={p.key} align="center">{p.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {collabs.map(c => (
                  <CollaboratorPermissionRow
                    key={c.id}
                    collab={c}
                    nodeId={nodeId}
                    onClick={() => setSelectedCollab(c)}
                  />
                ))}
              </TableBody>
            </Table>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {selectedCollab && nodeId ? (
        <CollaboratorPermissionEditor
          collab={selectedCollab}
          nodeId={nodeId}
          onBack={() => setSelectedCollab(null)}
        />
      ) : (
        renderList()
      )}
    </Dialog>
  );
};

export default NodePermissionsModal;
