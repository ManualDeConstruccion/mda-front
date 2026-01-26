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
import type { RegulationTypeItem } from './NormativeTree';

interface EditRegulationTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  regulationType: RegulationTypeItem | null;
}

const EditRegulationTypeModal: React.FC<EditRegulationTypeModalProps> = ({
  open,
  onClose,
  onSuccess,
  regulationType,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open && regulationType) {
      setCode(regulationType.code);
      setName(regulationType.name);
      setDescription(regulationType.description || '');
      setOrder(regulationType.order);
      setIsActive(regulationType.is_active);
    }
  }, [open, regulationType]);

  const updateMutation = useMutation({
    mutationFn: async (data: { code: string; name: string; description?: string; order: number; is_active: boolean }) => {
      if (!regulationType) throw new Error('No type');
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await axios.patch(
        `${API_URL}/api/normative/regulation-types/${regulationType.id}/`,
        data,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['normative-admin-tree'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ code, name, description: description || undefined, order, is_active: isActive });
  };

  const handleClose = () => {
    if (!updateMutation.isPending) onClose();
  };

  if (!regulationType) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Editar tipo de documento</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {updateMutation.isError && (
              <Alert severity="error">Error al actualizar. Intenta de nuevo.</Alert>
            )}
            <TextField
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
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
          <Button onClick={handleClose} disabled={updateMutation.isPending}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditRegulationTypeModal;
