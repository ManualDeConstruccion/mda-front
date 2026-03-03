import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

interface CreatePropertyModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (property: { id: number }) => void;
  initialRol?: string;
  initialRegionId?: number | null;
  initialComunaId?: number | null;
  regiones: { id: number; region: string }[];
  createProperty: (data: any) => Promise<any>;
  isCreating: boolean;
}

interface ComunaItem {
  id: number;
  comuna: string;
}

const CreatePropertyModal: React.FC<CreatePropertyModalProps> = ({
  open, onClose, onCreated,
  initialRol, initialRegionId, initialComunaId,
  regiones,
  createProperty, isCreating,
}) => {
  const [form, setForm] = useState({
    name: '',
    rol: initialRol ?? '',
    description: '',
    address: '',
    region: (initialRegionId != null ? String(initialRegionId) : '') as string,
    comuna: (initialComunaId != null ? String(initialComunaId) : '') as string,
    localidad: '',
    neighborhood: '',
    allotment: '',
    block: '',
    subdivision_plan: '',
  });

  useEffect(() => {
    if (!open) return;
    setForm(prev => ({
      ...prev,
      rol: initialRol ?? prev.rol,
      region: initialRegionId != null ? String(initialRegionId) : prev.region,
      comuna: initialComunaId != null ? String(initialComunaId) : (initialRegionId != null ? '' : prev.comuna),
    }));
  }, [open, initialRol, initialRegionId, initialComunaId]);

  const regionIdForComunas = form.region ? Number(form.region) : null;
  const comunasQuery = useQuery<ComunaItem[]>({
    queryKey: ['comuna', 'v1', regionIdForComunas],
    queryFn: async () => {
      const res = await api.get<ComunaItem[]>('comuna/v1/', {
        params: { region: regionIdForComunas },
      });
      return res.data;
    },
    enabled: !!regionIdForComunas && open,
    staleTime: 5 * 60 * 1000,
  });
  const comunas = comunasQuery.data ?? [];

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'region') {
        next.comuna = '';
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      region: form.region ? Number(form.region) : null,
      comuna: form.comuna ? Number(form.comuna) : null,
    };
    const created = await createProperty(payload);
    onCreated(created);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crear nueva propiedad</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}>
            <TextField label="Rol" value={form.rol} onChange={handleChange('rol')} fullWidth required size="small" />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Nombre" value={form.name} onChange={handleChange('name')} fullWidth required size="small" />
          </Grid>
          <Grid item xs={8}>
            <TextField label="Dirección" value={form.address} onChange={handleChange('address')} fullWidth size="small" />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Región"
              select
              value={form.region}
              onChange={handleChange('region')}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                native: true,
                sx: { '& select': { minHeight: 40, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
              }}
            >
              <option value="">Seleccionar región...</option>
              {regiones.map(r => <option key={r.id} value={r.id}>{r.region}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Comuna"
              select
              value={form.comuna}
              onChange={handleChange('comuna')}
              fullWidth
              size="small"
              disabled={!form.region}
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                native: true,
                sx: { '& select': { minHeight: 40, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
              }}
            >
              <option value="">{form.region ? 'Seleccionar comuna...' : 'Primero elija región'}</option>
              {comunas.map(c => <option key={c.id} value={c.id}>{c.comuna}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={4}>
            <TextField label="Localidad" value={form.localidad} onChange={handleChange('localidad')} fullWidth size="small" />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Población / Villa" value={form.neighborhood} onChange={handleChange('neighborhood')} fullWidth size="small" />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Manzana" value={form.block} onChange={handleChange('block')} fullWidth size="small" />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Lote" value={form.allotment} onChange={handleChange('allotment')} fullWidth size="small" />
          </Grid>
          <Grid item xs={4}>
            <TextField label="N° Plano loteo" value={form.subdivision_plan} onChange={handleChange('subdivision_plan')} fullWidth size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Descripción" value={form.description} onChange={handleChange('description')} fullWidth multiline rows={2} size="small" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isCreating || !form.rol || !form.name}>
          {isCreating ? <CircularProgress size={20} /> : 'Crear propiedad'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePropertyModal;
