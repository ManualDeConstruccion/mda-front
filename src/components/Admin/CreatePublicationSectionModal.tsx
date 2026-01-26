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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface CreatePublicationSectionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  publicationId: number;
  parentSectionId?: number | null;
}

const CreatePublicationSectionModal: React.FC<CreatePublicationSectionModalProps> = ({
  open,
  onClose,
  onSuccess,
  publicationId,
  parentSectionId,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sectionNumber, setSectionNumber] = useState('');
  const [order, setOrder] = useState(0);
  const [parent, setParent] = useState<number | ''>(parentSectionId ?? '');
  const [isActive, setIsActive] = useState(true);

  const { data: sections } = useQuery<{ id: number; code: string; name: string; official_publication: number }[]>({
    queryKey: ['normative-publication-sections', publicationId],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await axios.get(
        `${API_URL}/api/normative/publication-sections/?official_publication=${publicationId}`,
        { withCredentials: true, headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
      );
      const raw = res.data?.results ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: open && !!publicationId && !!accessToken,
  });

  useEffect(() => {
    if (open) {
      setCode('');
      setName('');
      setDescription('');
      setSectionNumber('');
      setOrder(0);
      setParent(parentSectionId ?? '');
      setIsActive(true);
    }
  }, [open, publicationId, parentSectionId]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      description?: string;
      section_number?: string;
      order: number;
      official_publication: number;
      parent?: number | null;
      is_active: boolean;
    }) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await axios.post(`${API_URL}/api/normative/publication-sections/`, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      return res.data;
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      code,
      name,
      description: description || undefined,
      section_number: sectionNumber || undefined,
      order,
      official_publication: publicationId,
      parent: parent ? Number(parent) : null,
      is_active: isActive,
    });
  };

  const handleClose = () => {
    if (!createMutation.isPending) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Nueva sección</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {createMutation.isError && (
              <Alert severity="error">Error al crear la sección.</Alert>
            )}
            <TextField
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
              helperText="Ej: OGUC_CAP_4"
            />
            <TextField
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Número de sección"
              value={sectionNumber}
              onChange={(e) => setSectionNumber(e.target.value)}
              fullWidth
              helperText="Ej: 4, 4.2, III"
            />
            <TextField
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Sección padre</InputLabel>
              <Select
                value={parent}
                label="Sección padre"
                onChange={(e) => setParent(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <MenuItem value="">Ninguna (raíz)</MenuItem>
                {sections?.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              label="Activa"
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

export default CreatePublicationSectionModal;
