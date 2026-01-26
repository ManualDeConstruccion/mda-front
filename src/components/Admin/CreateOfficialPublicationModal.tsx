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

interface CreateOfficialPublicationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  regulationTypeId: number | null;
}

const CreateOfficialPublicationModal: React.FC<CreateOfficialPublicationModalProps> = ({
  open,
  onClose,
  onSuccess,
  regulationTypeId,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [regulationType, setRegulationType] = useState<number | ''>(regulationTypeId || '');
  const [releaseVersion, setReleaseVersion] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: types } = useQuery<{ id: number; code: string; name: string }[]>({
    queryKey: ['normative-regulation-types'],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await axios.get(`${API_URL}/api/normative/regulation-types/`, {
        withCredentials: true,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const d = res.data;
      return Array.isArray(d) ? d : (d?.results ?? []);
    },
    enabled: open && !!accessToken,
  });

  useEffect(() => {
    if (open) {
      setCode('');
      setName('');
      setShortName('');
      setRegulationType(regulationTypeId || '');
      setReleaseVersion('');
      setOfficialUrl('');
      setDescription('');
      setIsActive(true);
    }
  }, [open, regulationTypeId]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      short_name: string;
      regulation_type: number | null;
      release_version?: string;
      official_url?: string;
      description?: string;
      is_active: boolean;
    }) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await axios.post(`${API_URL}/api/normative/official-publications/`, data, {
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
    createMutation.mutate({
      code,
      name,
      short_name: shortName,
      regulation_type: regulationType ? Number(regulationType) : null,
      release_version: releaseVersion || undefined,
      official_url: officialUrl || undefined,
      description: description || undefined,
      is_active: isActive,
    });
  };

  const handleClose = () => {
    if (!createMutation.isPending) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Nueva publicación oficial</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {createMutation.isError && (
              <Alert severity="error">Error al crear la publicación. Intenta de nuevo.</Alert>
            )}
            <TextField
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
              helperText="Ej: DS_47_OGUC, LEY_20958_LGUC"
            />
            <TextField
              label="Nombre oficial"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Nombre corto"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              required
              fullWidth
              helperText="Ej: OGUC, D.S. N°47"
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de documento</InputLabel>
              <Select
                value={regulationType}
                label="Tipo de documento"
                onChange={(e) => setRegulationType(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <MenuItem value="">Sin tipo</MenuItem>
                {types?.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Versión"
              value={releaseVersion}
              onChange={(e) => setReleaseVersion(e.target.value)}
              fullWidth
              helperText="Ej: E17, V2024"
            />
            <TextField
              label="URL oficial"
              value={officialUrl}
              onChange={(e) => setOfficialUrl(e.target.value)}
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

export default CreateOfficialPublicationModal;
