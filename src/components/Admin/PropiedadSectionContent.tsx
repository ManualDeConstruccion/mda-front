import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, Paper,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
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

interface RegionItem {
  id: number;
  region: string;
}
interface ComunaItem {
  id: number;
  comuna: string;
}

function PropertySummary({
  property,
  comunaName,
  onCambiarPropiedad,
  isUnlinking,
}: {
  property: PropertyData;
  comunaName: string | null;
  onCambiarPropiedad: () => void;
  isUnlinking: boolean;
}) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary">Rol</Typography>
        <Typography variant="body1" fontWeight={500}>{property.rol}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary">Dirección</Typography>
        <Typography variant="body1">{property.address || '—'}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary">Comuna</Typography>
        <Typography variant="body1">{comunaName ?? '—'}</Typography>
      </Grid>
      <Grid item xs={12} sx={{ pt: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={onCambiarPropiedad}
          disabled={isUnlinking}
        >
          {isUnlinking ? <CircularProgress size={18} /> : 'Cambiar propiedad'}
        </Button>
      </Grid>
    </Grid>
  );
}

const CONFIRM_SAVE_MESSAGE =
  'La propiedad tendrá cambios permanentes en su información y podría afectar a otros proyectos. ¿Desea continuar?';

function PropertyEditForm({
  property,
  regiones,
  onSaved,
}: {
  property: PropertyData;
  regiones: RegionItem[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    ...property,
    region: (property.region != null ? String(property.region) : '') as string,
    comuna: (property.comuna != null ? String(property.comuna) : '') as string,
  });
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const regionIdForComunas = form.region ? Number(form.region) : null;
  const comunasQuery = useQuery<ComunaItem[]>({
    queryKey: ['comuna', 'v1', regionIdForComunas],
    queryFn: async () => {
      const res = await api.get<ComunaItem[]>('comuna/v1/', {
        params: { region: regionIdForComunas },
      });
      return res.data;
    },
    enabled: !!regionIdForComunas,
    staleTime: 5 * 60 * 1000,
  });
  const comunas = comunasQuery.data ?? [];

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'region') next.comuna = '';
      return next;
    });
  };

  const handleGuardarClick = () => setConfirmOpen(true);

  const handleConfirmCancel = () => setConfirmOpen(false);

  const handleConfirmSave = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      await api.patch(`properties/${property.id}/`, {
        name: form.name,
        address: form.address,
        region: form.region ? Number(form.region) : null,
        comuna: form.comuna ? Number(form.comuna) : null,
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
    <>
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
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Button variant="contained" onClick={handleGuardarClick} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={handleConfirmCancel}>
        <DialogTitle>Confirmar cambios</DialogTitle>
        <DialogContent>
          <Typography>{CONFIRM_SAVE_MESSAGE}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={handleConfirmCancel}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const PropiedadSectionContent: React.FC<PropiedadSectionContentProps> = ({ subprojectId }) => {
  const [activeTab, setActiveTab] = useState<PropiedadTabType>('resumen');
  const [regionId, setRegionId] = useState<number | null>(null);
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [rol, setRol] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [candidatePropertyForLink, setCandidatePropertyForLink] = useState<PropertyData | null>(null);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  const {
    searchResults, isSearching, searchProperty,
    linkedProperty, isLoadingLinked,
    createProperty, isCreating,
    linkProperty, isLinking,
    unlinkProperty,
    isUnlinking,
    invalidateLinkedProperty,
  } = usePropertyEngine(subprojectId);

  const regionesQuery = useQuery<RegionItem[]>({
    queryKey: ['region', 'v1'],
    queryFn: async () => {
      const res = await api.get<RegionItem[]>('region/v1/');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const comunasQuery = useQuery<ComunaItem[]>({
    queryKey: ['comuna', 'v1', regionId],
    queryFn: async () => {
      const res = await api.get<ComunaItem[]>('comuna/v1/', {
        params: { region: regionId },
      });
      return res.data;
    },
    enabled: !!regionId,
    staleTime: 5 * 60 * 1000,
  });

  const regiones = regionesQuery.data ?? [];
  const comunas = comunasQuery.data ?? [];

  const allComunasQuery = useQuery<ComunaItem[]>({
    queryKey: ['comuna', 'v1', 'all'],
    queryFn: async () => {
      const res = await api.get<ComunaItem[]>('comuna/v1/');
      return res.data;
    },
    enabled: !!linkedProperty,
    staleTime: 5 * 60 * 1000,
  });
  const allComunas = allComunasQuery.data ?? [];

  const candidateComunasQuery = useQuery<ComunaItem[]>({
    queryKey: ['comuna', 'v1', candidatePropertyForLink?.region],
    queryFn: async () => {
      const res = await api.get<ComunaItem[]>('comuna/v1/', {
        params: { region: candidatePropertyForLink!.region },
      });
      return res.data;
    },
    enabled: !!candidatePropertyForLink?.region,
    staleTime: 5 * 60 * 1000,
  });
  const candidateComunas = candidateComunasQuery.data ?? [];
  const candidateRegionName =
    candidatePropertyForLink?.region != null
      ? (regiones.find(r => r.id === candidatePropertyForLink.region)?.region ?? null)
      : null;
  const candidateComunaName =
    candidatePropertyForLink?.comuna != null
      ? (candidateComunas.find(c => c.id === candidatePropertyForLink.comuna)?.comuna ?? null)
      : null;

  const comunaNameForSummary =
    linkedProperty && linkedProperty.comuna != null
      ? (allComunas.find(c => c.id === linkedProperty.comuna)?.comuna ?? null)
      : null;

  const handleRegionChange = (newRegionId: number | null) => {
    setRegionId(newRegionId);
    setComunaId(null);
  };

  const handleSearch = () => {
    if (rol.trim() && comunaId) searchProperty(rol, comunaId);
  };

  const handleSelectProperty = (prop: PropertyData) => {
    setCandidatePropertyForLink(prop);
  };

  const handleConfirmLinkAccept = async () => {
    if (!candidatePropertyForLink) return;
    await linkProperty(candidatePropertyForLink.id);
    setCandidatePropertyForLink(null);
  };

  const handleConfirmLinkCancel = () => setCandidatePropertyForLink(null);

  const handleCambiarPropiedadClick = () => setShowUnlinkConfirm(true);

  const handleUnlinkAccept = async () => {
    await unlinkProperty();
    setShowUnlinkConfirm(false);
  };

  const handleUnlinkCancel = () => setShowUnlinkConfirm(false);

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
          <Grid item xs={3}>
            <TextField
              label="Región"
              select
              value={regionId ?? ''}
              onChange={e => handleRegionChange(Number(e.target.value) || null)}
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
          <Grid item xs={3}>
            <TextField
              label="Comuna"
              select
              value={comunaId ?? ''}
              onChange={e => setComunaId(Number(e.target.value) || null)}
              fullWidth
              size="small"
              disabled={!regionId}
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                native: true,
                sx: { '& select': { minHeight: 40, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
              }}
            >
              <option value="">{regionId ? 'Seleccionar comuna...' : 'Primero elija región'}</option>
              {comunas.map(c => <option key={c.id} value={c.id}>{c.comuna}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={2}>
            <TextField label="Rol" value={rol} onChange={e => setRol(e.target.value)} fullWidth size="small" placeholder="Ej: 123-4" />
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

        {/* Modal: preview de parámetros al elegir propiedad */}
        <Dialog open={!!candidatePropertyForLink} onClose={handleConfirmLinkCancel} maxWidth="sm" fullWidth>
          <DialogTitle>Asociar propiedad</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Al asociar esta propiedad se cargarán los siguientes datos en el proyecto. Revise el listado y acepte o cancele.
            </Typography>
            {candidatePropertyForLink && (
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {[
                  { label: 'Rol', value: candidatePropertyForLink.rol },
                  { label: 'Dirección', value: candidatePropertyForLink.address },
                  { label: 'Región', value: candidateRegionName ?? '' },
                  { label: 'Comuna', value: candidateComunaName ?? '' },
                  { label: 'Localidad', value: candidatePropertyForLink.localidad },
                  { label: 'Población / Villa', value: candidatePropertyForLink.neighborhood },
                  { label: 'Manzana', value: candidatePropertyForLink.block },
                  { label: 'Lote', value: candidatePropertyForLink.allotment },
                  { label: 'N° Plano loteo', value: candidatePropertyForLink.subdivision_plan },
                ]
                  .filter(row => row.value != null && String(row.value).trim() !== '')
                  .map((row, idx) => (
                    <Typography component="li" key={idx} variant="body2" sx={{ mb: 0.5 }}>
                      <strong>{row.label}:</strong> {row.value}
                    </Typography>
                  ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button onClick={handleConfirmLinkCancel}>Cancelar</Button>
            <Button variant="contained" color="primary" onClick={handleConfirmLinkAccept} disabled={isLinking}>
              {isLinking ? <CircularProgress size={20} /> : 'Aceptar'}
            </Button>
          </DialogActions>
        </Dialog>

        <CreatePropertyModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={handlePropertyCreated}
          initialRol={rol}
          initialRegionId={regionId}
          initialComunaId={comunaId}
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
            <PropertySummary
              property={linkedProperty}
              comunaName={comunaNameForSummary}
              onCambiarPropiedad={handleCambiarPropiedadClick}
              isUnlinking={isUnlinking}
            />
          </div>
        )}
        {activeTab === 'editar' && (
          <div className={styles.tabPane}>
            <PropertyEditForm
              property={linkedProperty}
              regiones={regiones}
              onSaved={invalidateLinkedProperty}
            />
          </div>
        )}
      </div>

      {/* Modal: confirmar desvincular propiedad */}
      <Dialog open={showUnlinkConfirm} onClose={handleUnlinkCancel}>
        <DialogTitle>Cambiar propiedad</DialogTitle>
        <DialogContent>
          <Typography>
            Se desvinculará la propiedad actual del proyecto. Los parámetros del proyecto que dependían de ella podrían quedar desactualizados. ¿Desea continuar?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={handleUnlinkCancel}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleUnlinkAccept} disabled={isUnlinking}>
            {isUnlinking ? <CircularProgress size={20} /> : 'Aceptar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PropiedadSectionContent;
