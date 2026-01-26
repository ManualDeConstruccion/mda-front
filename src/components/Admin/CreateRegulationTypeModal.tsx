import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface CreateRegulationTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateRegulationTypeModal: React.FC<CreateRegulationTypeModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      setCode('');
      setName('');
      setDescription('');
      setOrder(0);
      setIsActive(true);
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async (data: { code: string; name: string; description?: string; order: number; is_active: boolean }) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await axios.post(`${API_URL}/api/normative/regulation-types/`, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['normative-admin-tree'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ code, name, description: description || undefined, order, is_active: isActive });
  };

  const handleClose = () => {
    if (!createMutation.isPending) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Nuevo tipo de documento oficial</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {createMutation.isError && (
              <Alert severity="error">Error al crear el tipo. Intenta de nuevo.</Alert>
            )}
            <TextField
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
              helperText="Ej: ds, ddu, ley"
            />
            <TextField
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              helperText="Ej: Decreto Supremo"
            />
            <TextField
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Orden"
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 0)}
              fullWidth
              inputProps={{ min: 0 }}
            />
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
              label="Activo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={createMutation.isPending}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={createMutation.isPending}>
            Crear
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateRegulationTypeModal;
