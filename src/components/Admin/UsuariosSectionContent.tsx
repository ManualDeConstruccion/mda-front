import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  useUserEngine,
  UserSearchResult,
  CollaboratorItem,
} from '../../hooks/useUserEngine';

export interface UsuariosSectionContentProps {
  subprojectId: number;
  onMotorAppliedChange?: () => void | Promise<void>;
}

interface RoleOption {
  id: number;
  role: string;
}

export default function UsuariosSectionContent({
  subprojectId,
  onMotorAppliedChange,
}: UsuariosSectionContentProps) {
  const {
    collaborators,
    isLoadingCollaborators,
    searchByRut,
    searchResults,
    isSearching,
    assignCollaborator,
    isAssigning,
    unassignRole,
    isUnassigning,
  } = useUserEngine(subprojectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [rutInput, setRutInput] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  const rolesQuery = useQuery<RoleOption[]>({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const res = await api.get<RoleOption[]>('users/roles/');
      return res.data;
    },
  });
  const roles = rolesQuery.data ?? [];

  const handleOpenAssign = (roleId: number) => {
    setSelectedRoleId(roleId);
    setRutInput('');
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleSearch = () => {
    searchByRut(rutInput);
  };

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedUser || selectedRoleId == null) return;
    try {
      await assignCollaborator({ userId: selectedUser.id, roleId: selectedRoleId });
      setConfirmOpen(false);
      setDialogOpen(false);
      setSelectedUser(null);
      setSelectedRoleId(null);
      onMotorAppliedChange?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnassign = async (roleId: number) => {
    try {
      await unassignRole(roleId);
      onMotorAppliedChange?.();
    } catch (e) {
      console.error(e);
    }
  };

  const getCollaboratorByRoleId = (roleId: number): CollaboratorItem | undefined =>
    collaborators.find((c) => c.role?.id === roleId);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Profesionales intervinientes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Asigne profesionales por rol. Los datos se cargarán en el formulario.
      </Typography>

      {isLoadingCollaborators ? (
        <CircularProgress size={24} />
      ) : (
        <>
          <List component={Paper} variant="outlined" sx={{ mb: 2 }}>
            {roles.map((role) => {
              const collab = getCollaboratorByRoleId(role.id);
              return (
                <ListItem key={role.id} divider>
                  <ListItemText
                    primary={role.role}
                    secondary={
                      collab
                        ? `${collab.collaborator.first_name} ${collab.collaborator.last_name} · ${collab.collaborator.rut ?? collab.collaborator.email}`
                        : 'Sin asignar'
                    }
                  />
                  <ListItemSecondaryAction>
                    {collab ? (
                      <>
                        <Button
                          size="small"
                          sx={{ mr: 1 }}
                          onClick={() => handleOpenAssign(role.id)}
                          disabled={isAssigning}
                        >
                          Cambiar
                        </Button>
                        <Button
                          size="small"
                          color="secondary"
                          onClick={() => handleUnassign(role.id)}
                          disabled={isUnassigning}
                        >
                          Quitar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="small"
                        startIcon={<PersonAddIcon />}
                        onClick={() => handleOpenAssign(role.id)}
                        disabled={isAssigning}
                      >
                        Asignar
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedRoleId != null ? `Asignar ${roles.find((r) => r.id === selectedRoleId)?.role ?? 'rol'}` : 'Asignar profesional'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Buscar por RUT (con o sin puntos/guion)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="12.345.678-9 o 12345678-9"
              value={rutInput}
              onChange={(e) => setRutInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="contained" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <CircularProgress size={24} /> : <SearchIcon />}
            </Button>
          </Box>
          {searchResults.length > 0 && (
            <List dense>
              {searchResults.map((u) => (
                <ListItem
                  key={u.id}
                  button
                  onClick={() => handleSelectUser(u)}
                  secondaryAction={
                    <Typography variant="caption">{u.rut ?? u.email}</Typography>
                  }
                >
                  <ListItemText
                    primary={`${u.first_name} ${u.last_name}`.trim() || u.email}
                    secondary={u.email}
                  />
                </ListItem>
              ))}
            </List>
          )}
          {rutInput.trim() && !isSearching && searchResults.length === 0 && (
            <Alert severity="info">No se encontraron usuarios con ese RUT.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar asignación</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2">
                <strong>Nombre:</strong> {selectedUser.first_name} {selectedUser.last_name}
              </Typography>
              <Typography variant="body2">
                <strong>RUT:</strong> {selectedUser.rut ?? '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {selectedUser.email}
              </Typography>
              <Typography variant="body2">
                <strong>Teléfono:</strong> {selectedUser.phone ?? '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Se cargarán los datos de este profesional en el formulario para el rol seleccionado.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmAssign} disabled={isAssigning}>
            {isAssigning ? <CircularProgress size={24} /> : 'Aceptar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
