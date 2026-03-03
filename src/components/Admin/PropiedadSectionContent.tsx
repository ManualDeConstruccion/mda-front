import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Grid, Paper,
  CircularProgress, Alert, Chip, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { usePropertyEngine, PropertyData } from '../../hooks/usePropertyEngine';
import CreatePropertyModal from './CreatePropertyModal';
import styles from './SurfacesSectionTabs.module.scss';

export type PropiedadTabType = 'resumen' | 'editar';

export interface PropiedadSectionContentProps {
  subprojectId: number;
}

interface RegionComuna {
  regiones: { id: number; region: string }[];
  comunas: { id: number; comuna: string }[];
}

const FIELD_LABELS: Record<string, string> = {
  rol: 'Rol',
  address: 'Dirección',
  localidad: 'Localidad',
  neighborhood: 'Población / Villa',
  block: 'Manzana',
  allotment: 'Lote',
  subdivision_plan: 'N° Plano de loteo',
};

function PropertySummary({ property }: { property: PropertyData }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={600}>{property.name}</Typography>
        <Chip label={`Rol: ${property.rol}`} size="small" sx={{ mr: 1, mt: 0.5 }} />
      </Grid>
      <Grid item xs={12}><Divider /></Grid>
      {Object.entries(FIELD_LABELS).map(([key, label]) => {
        const value = (property as any)[key];
        if (!value) return null;
        return (
          <Grid item xs={6} sm={4} key={key}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body2">{value}</Typography>
          </Grid>
        );
      })}
    </Grid>
  );
}

function PropertyEditForm({
  property, onSaved,
}: { property: PropertyData; onSaved: () => void }) {
  const [form, setForm] = useState({ ...property });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`properties/${property.id}/`, {
        name: form.name,
        address: form.address,
        localidad: form.localidad,
        neighborhood: form.neighborhood,
        block: form.block,
        allotment: form.allotment,
        subdivision_plan: form.subdivision_plan,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField label="Nombre" value={form.name ?? ''} onChange={handleChange('name')} fullWidth size="small" />
      </Grid>
      <Grid item xs={6}>
        <TextField label="Rol" value={form.rol ?? ''} disabled fullWidth size="small" />
      </Grid>
      <Grid item xs={8}>
        <TextField label="Dirección" value={form.address ?? ''} onChange={handleChange('address')} fullWidth size="small" />
      </Grid>
      <Grid item xs={4}>
        <TextField label="Localidad" value={form.localidad ?? ''} onChange={handleChange('localidad')} fullWidth size="small" />
      </Grid>
      <Grid item xs={4}>
        <TextField label="Población / Villa" value={form.neighborhood ?? ''} onChange={handleChange('neighborhood')} fullWidth size="small" />
      </Grid>
      <Grid item xs={4}>
        <TextField label="Manzana" value={form.block ?? ''} onChange={handleChange('block')} fullWidth size="small" />
      </Grid>
      <Grid item xs={4}>
        <TextField label="Lote" value={form.allotment ?? ''} onChange={handleChange('allotment')} fullWidth size="small" />
      </Grid>
      <Grid item xs={4}>
        <TextField label="N° Plano loteo" value={form.subdivision_plan ?? ''} onChange={handleChange('subdivision_plan')} fullWidth size="small" />
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : 'Guardar cambios'}
        </Button>
      </Grid>
    </Grid>
  );
}

const PropiedadSectionContent: React.FC<PropiedadSectionContentProps> = ({ subprojectId }) => {
  const [activeTab, setActiveTab] = useState<PropiedadTabType>('resumen');
  const [rol, setRol] = useState('');
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const {
    searchResults, isSearching, searchProperty,
    linkedProperty, isLoadingLinked,
    createProperty, isCreating,
    linkProperty, isLinking,
  } = usePropertyEngine(subprojectId);

  const regionComunaQuery = useQuery<RegionComuna>({
    queryKey: ['regiones-comunas-list'],
    queryFn: async () => {
      const [regRes, comRes] = await Promise.all([
        api.get('region/v1/'),
        api.get('comuna/v1/'),
      ]);
      return { regiones: regRes.data, comunas: comRes.data };
    },
    staleTime: 5 * 60 * 1000,
  });

  const regiones = regionComunaQuery.data?.regiones ?? [];
  const comunas = regionComunaQuery.data?.comunas ?? [];

  const handleSearch = () => {
    if (rol.trim() && comunaId) searchProperty(rol, comunaId);
  };

  const handleSelectProperty = async (prop: PropertyData) => {
    await linkProperty(prop.id);
  };

  const handlePropertyCreated = async (created: { id: number }) => {
    setCreateModalOpen(false);
    await linkProperty(created.id);
  };

  if (isLoadingLinked) {
    return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  if (!linkedProperty) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight={600}>
          Asociar propiedad
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Busca una propiedad existente por Rol y Comuna, o crea una nueva.
        </Typography>

        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={4}>
            <TextField label="Rol" value={rol} onChange={e => setRol(e.target.value)} fullWidth size="small" placeholder="Ej: 123-4" />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Comuna"
              select
              value={comunaId ?? ''}
              onChange={e => setComunaId(Number(e.target.value) || null)}
              fullWidth
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="">Seleccionar comuna...</option>
              {comunas.map(c => <option key={c.id} value={c.id}>{c.comuna}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={2}>
            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch} disabled={!rol.trim() || !comunaId || isSearching} fullWidth>
              Buscar
            </Button>
          </Grid>
          <Grid item xs={2}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)} fullWidth>
              Nueva
            </Button>
          </Grid>
        </Grid>

        {isSearching && <Box sx={{ mt: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>}

        {!isSearching && searchResults.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {searchResults.map(prop => (
              <Paper key={prop.id} variant="outlined" sx={{ p: 2, mb: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => handleSelectProperty(prop)}
              >
                <Typography variant="body2" fontWeight={600}>{prop.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Rol: {prop.rol} — {prop.address}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {!isSearching && searchResults.length === 0 && rol.trim() && comunaId && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No se encontró propiedad con ese Rol y Comuna. Puedes crear una nueva.
          </Alert>
        )}

        {isLinking && <Box sx={{ mt: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>}

        <CreatePropertyModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={handlePropertyCreated}
          initialRol={rol}
          initialComunaId={comunaId}
          comunas={comunas}
          regiones={regiones}
          createProperty={createProperty}
          isCreating={isCreating}
        />
      </Paper>
    );
  }

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'resumen' ? styles.active : ''}`} onClick={() => setActiveTab('resumen')}>
          Resumen
        </button>
        <button className={`${styles.tab} ${activeTab === 'editar' ? styles.active : ''}`} onClick={() => setActiveTab('editar')}>
          <EditIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
          Editar datos
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'resumen' && (
          <div className={styles.tabPane}>
            <PropertySummary property={linkedProperty} />
          </div>
        )}
        {activeTab === 'editar' && (
          <div className={styles.tabPane}>
            <PropertyEditForm
              property={linkedProperty}
              onSaved={() => {
                /* refetch se maneja por invalidación en el hook */
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PropiedadSectionContent;
