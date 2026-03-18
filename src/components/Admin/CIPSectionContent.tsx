import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, Paper,
  CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Divider,
  FormControlLabel, Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useCIPEngine } from '../../hooks/useCIPEngine';
import type { CIPData, CIPStreetFrontageData, GroupingSystem, AreaType, UrbanizationStatus } from '../../types/cip.types';
import styles from './SurfacesSectionTabs.module.scss';

type CIPTabType = 'resumen' | 'identificacion' | 'normas' | 'frentes' | 'afectaciones';

interface RegionItem { id: number; region: string }

// ─── helpers ───────────────────────────────────────────────────────────────

function decVal(v: string | null | undefined) {
  return v != null && v !== '' ? v : '—';
}
function boolLabel(v: boolean | null | undefined) {
  if (v === null || v === undefined) return '—';
  return v ? 'Sí' : 'No';
}

// ─── CIP Summary (pestaña Resumen) ─────────────────────────────────────────

function CIPSummary({
  cip,
  onDesvinculer,
  isUnlinking,
}: {
  cip: CIPData;
  onDesvinculer: () => void;
  isUnlinking: boolean;
}) {
  return (
    <Box>
      {cip.has_restrictions && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
          Este CIP tiene afectaciones o restricciones relevantes. Revisa la pestaña Afectaciones.
        </Alert>
      )}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4}>
          <Typography variant="caption" color="text.secondary">Certificado N°</Typography>
          <Typography variant="body1" fontWeight={600}>{cip.certificate_number}</Typography>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Typography variant="caption" color="text.secondary">Fecha de emisión</Typography>
          <Typography variant="body1">{cip.issue_date}</Typography>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Typography variant="caption" color="text.secondary">Municipalidad</Typography>
          <Typography variant="body1">{cip.municipalidad || '—'}</Typography>
        </Grid>
        <Grid item xs={12}><Divider /></Grid>

        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Zona</Typography>
          <Typography variant="body1" fontWeight={500}>{cip.zone_name || '—'}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Agrupamiento</Typography>
          <Typography variant="body1">{cip.grouping_system || '—'}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">COS máx.</Typography>
          <Typography variant="body1">{decVal(cip.cos_max)}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">CUS máx.</Typography>
          <Typography variant="body1">{decVal(cip.cus_max)}</Typography>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Altura máx. (m)</Typography>
          <Typography variant="body1">{decVal(cip.max_height)}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Pisos máx.</Typography>
          <Typography variant="body1">{cip.max_floors ?? '—'}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Rasante (°)</Typography>
          <Typography variant="body1">{decVal(cip.rasante)}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Antejardín mín. (m)</Typography>
          <Typography variant="body1">{decVal(cip.antejadin_min)}</Typography>
        </Grid>

        {cip.destination && (
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Destino solicitado</Typography>
            <Typography variant="body1">{cip.destination}</Typography>
          </Grid>
        )}

        <Grid item xs={12} sx={{ pt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {cip.has_restrictions && (
            <Chip label="Con afectaciones" color="warning" size="small" icon={<WarningAmberIcon />} />
          )}
          {cip.expiration_date && (
            <Chip label={`Vence: ${cip.expiration_date}`} size="small" color="info" />
          )}
        </Grid>

        <Grid item xs={12} sx={{ pt: 1 }}>
          <Button variant="outlined" color="warning" size="small" onClick={onDesvinculer} disabled={isUnlinking}>
            {isUnlinking ? <CircularProgress size={18} /> : 'Desvincular CIP'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Identificación (Bloque 1 + IPT) ───────────────────────────────────────

const AREA_TYPE_OPTIONS: { value: AreaType; label: string }[] = [
  { value: '', label: 'No especificado' },
  { value: 'urbana', label: 'Urbana' },
  { value: 'extension_urbana', label: 'Extensión Urbana' },
  { value: 'rural', label: 'Rural' },
];

function IdentificacionTab({
  cip,
  regiones,
  onSave,
  isSaving,
}: {
  cip: CIPData;
  regiones: RegionItem[];
  onSave: (data: Partial<CIPData>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    certificate_number: cip.certificate_number,
    issue_date: cip.issue_date,
    request_number: cip.request_number,
    request_date: cip.request_date ?? '',
    expiration_date: cip.expiration_date ?? '',
    municipalidad: cip.municipalidad,
    region: cip.region != null ? String(cip.region) : '',
    destination: cip.destination,
    area_type: cip.area_type,
    ipt_intercomunal: cip.ipt_intercomunal,
    ipt_intercomunal_date: cip.ipt_intercomunal_date ?? '',
    ipt_comunal: cip.ipt_comunal,
    ipt_comunal_date: cip.ipt_comunal_date ?? '',
    ipt_seccional: cip.ipt_seccional,
    ipt_seccional_date: cip.ipt_seccional_date ?? '',
    ipt_plano_seccional: cip.ipt_plano_seccional,
    ipt_plano_seccional_date: cip.ipt_plano_seccional_date ?? '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    onSave({
      ...form,
      region: form.region ? Number(form.region) : null,
      request_date: form.request_date || null,
      expiration_date: form.expiration_date || null,
      ipt_intercomunal_date: form.ipt_intercomunal_date || null,
      ipt_comunal_date: form.ipt_comunal_date || null,
      ipt_seccional_date: form.ipt_seccional_date || null,
      ipt_plano_seccional_date: form.ipt_plano_seccional_date || null,
    } as Partial<CIPData>);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Bloque 1 — Encabezado</Typography></Grid>
      <Grid item xs={6} sm={3}>
        <TextField label="Certificado N°" value={form.certificate_number} onChange={set('certificate_number')} fullWidth size="small" required />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField label="Fecha de emisión" type="date" value={form.issue_date} onChange={set('issue_date')} fullWidth size="small" required InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField label="Solicitud N°" value={form.request_number} onChange={set('request_number')} fullWidth size="small" />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField label="Fecha solicitud" type="date" value={form.request_date} onChange={set('request_date')} fullWidth size="small" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField label="Fecha vencimiento" type="date" value={form.expiration_date} onChange={set('expiration_date')} fullWidth size="small" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={6} sm={4}>
        <TextField label="I. Municipalidad" value={form.municipalidad} onChange={set('municipalidad')} fullWidth size="small" />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField
          label="Región"
          select
          value={form.region}
          onChange={set('region')}
          fullWidth size="small"
          InputLabelProps={{ shrink: true }}
          SelectProps={{ native: true }}
        >
          <option value="">Seleccionar...</option>
          {regiones.map(r => <option key={r.id} value={r.id}>{r.region}</option>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Destino solicitado" value={form.destination} onChange={set('destination')} fullWidth size="small" placeholder="Ej: Vivienda unifamiliar" />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}><Divider /><Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Bloque 2 — Instrumentos de Planificación Territorial</Typography></Grid>
      <Grid item xs={6} sm={3}>
        <TextField
          label="Área del terreno"
          select
          value={form.area_type}
          onChange={set('area_type')}
          fullWidth size="small"
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}
        >
          {AREA_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </TextField>
      </Grid>

      {([
        ['ipt_intercomunal', 'ipt_intercomunal_date', 'Plan Regulador Intercomunal o Metropolitano'],
        ['ipt_comunal', 'ipt_comunal_date', 'Plan Regulador Comunal'],
        ['ipt_seccional', 'ipt_seccional_date', 'Plan Seccional'],
        ['ipt_plano_seccional', 'ipt_plano_seccional_date', 'Plano Seccional'],
      ] as const).map(([nameField, dateField, label]) => (
        <React.Fragment key={nameField}>
          <Grid item xs={8}>
            <TextField label={label} value={(form as any)[nameField]} onChange={set(nameField)} fullWidth size="small" />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Fecha" type="date" value={(form as any)[dateField]} onChange={set(dateField)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
        </React.Fragment>
      ))}

      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <CircularProgress size={20} /> : 'Guardar'}
        </Button>
      </Grid>
    </Grid>
  );
}

// ─── Normas Urbanísticas (Bloque 5.1) ──────────────────────────────────────

const GROUPING_OPTIONS: { value: GroupingSystem; label: string }[] = [
  { value: '', label: 'No especificado' },
  { value: 'aislado', label: 'Aislado' },
  { value: 'pareado', label: 'Pareado' },
  { value: 'continuo', label: 'Continuo' },
  { value: 'mixto', label: 'Mixto' },
];

function NormasTab({
  cip,
  onSave,
  isSaving,
}: {
  cip: CIPData;
  onSave: (data: Partial<CIPData>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    zone_name: cip.zone_name,
    allowed_uses: cip.allowed_uses,
    min_lot_area: cip.min_lot_area ?? '',
    max_density: cip.max_density ?? '',
    max_height: cip.max_height ?? '',
    max_floors: cip.max_floors != null ? String(cip.max_floors) : '',
    grouping_system: cip.grouping_system,
    adosamiento: cip.adosamiento,
    cos_max: cip.cos_max ?? '',
    cus_max: cip.cus_max ?? '',
    upper_floors_cos: cip.upper_floors_cos ?? '',
    rasante: cip.rasante ?? '',
    rasante_application_level: cip.rasante_application_level,
    antejadin_min: cip.antejadin_min ?? '',
    side_setback_min: cip.side_setback_min ?? '',
    rear_setback_min: cip.rear_setback_min ?? '',
    fence_max_height: cip.fence_max_height ?? '',
    fence_transparency_pct: cip.fence_transparency_pct ?? '',
    ochavo: cip.ochavo,
    cesiones: cip.cesiones,
    parking_notes: cip.parking_notes,
    postponement_term: cip.postponement_term,
    postponement_decree: cip.postponement_decree,
    postponement_date: cip.postponement_date ?? '',
    requires_subsoil_report: cip.requires_subsoil_report,
    urbanization_status: cip.urbanization_status,
    additional_notes: cip.additional_notes,
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const decField = (label: string, field: string, unit?: string) => (
    <Grid item xs={6} sm={4} md={3}>
      <TextField
        label={unit ? `${label} (${unit})` : label}
        type="number"
        inputProps={{ step: 'any' }}
        value={(form as any)[field]}
        onChange={set(field)}
        fullWidth size="small"
      />
    </Grid>
  );

  const handleSave = () => {
    const toDecOrNull = (v: string) => (v !== '' ? v : null);
    onSave({
      zone_name: form.zone_name,
      allowed_uses: form.allowed_uses,
      min_lot_area: toDecOrNull(form.min_lot_area as string),
      max_density: toDecOrNull(form.max_density as string),
      max_height: toDecOrNull(form.max_height as string),
      max_floors: form.max_floors !== '' ? Number(form.max_floors) : null,
      grouping_system: form.grouping_system,
      adosamiento: form.adosamiento,
      cos_max: toDecOrNull(form.cos_max as string),
      cus_max: toDecOrNull(form.cus_max as string),
      upper_floors_cos: toDecOrNull(form.upper_floors_cos as string),
      rasante: toDecOrNull(form.rasante as string),
      rasante_application_level: form.rasante_application_level,
      antejadin_min: toDecOrNull(form.antejadin_min as string),
      side_setback_min: toDecOrNull(form.side_setback_min as string),
      rear_setback_min: toDecOrNull(form.rear_setback_min as string),
      fence_max_height: toDecOrNull(form.fence_max_height as string),
      fence_transparency_pct: toDecOrNull(form.fence_transparency_pct as string),
      ochavo: form.ochavo,
      cesiones: form.cesiones,
      parking_notes: form.parking_notes,
      postponement_term: form.postponement_term,
      postponement_decree: form.postponement_decree,
      postponement_date: form.postponement_date || null,
      requires_subsoil_report: form.requires_subsoil_report,
      urbanization_status: form.urbanization_status,
      additional_notes: form.additional_notes,
    } as Partial<CIPData>);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Bloque 5.1 — Normas Urbanísticas</Typography></Grid>

      <Grid item xs={6} sm={4}>
        <TextField label="Zona / Subzona" value={form.zone_name} onChange={set('zone_name')} fullWidth size="small" placeholder="Ej: R2, ZMix-1" />
      </Grid>
      <Grid item xs={6} sm={4}>
        <TextField
          label="Sistema de agrupamiento"
          select
          value={form.grouping_system}
          onChange={set('grouping_system')}
          fullWidth size="small"
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}
        >
          {GROUPING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </TextField>
      </Grid>
      <Grid item xs={12}>
        <TextField label="Usos de suelo permitidos" value={form.allowed_uses} onChange={set('allowed_uses')} fullWidth size="small" multiline rows={3} />
      </Grid>

      <Grid item xs={12} sx={{ mt: 0.5 }}><Typography variant="caption" color="text.secondary">Coeficientes</Typography></Grid>
      {decField('COS máx.', 'cos_max')}
      {decField('CUS máx.', 'cus_max')}
      {decField('COS pisos sup.', 'upper_floors_cos')}

      <Grid item xs={12} sx={{ mt: 0.5 }}><Typography variant="caption" color="text.secondary">Altura y densidad</Typography></Grid>
      {decField('Altura máx.', 'max_height', 'm')}
      <Grid item xs={6} sm={4} md={3}>
        <TextField label="Pisos máx." type="number" inputProps={{ step: 1, min: 0 }} value={form.max_floors} onChange={set('max_floors')} fullWidth size="small" />
      </Grid>
      {decField('Sup. predial mín.', 'min_lot_area', 'm²')}
      {decField('Densidad máx.', 'max_density', 'hab/ha')}

      <Grid item xs={12} sx={{ mt: 0.5 }}><Typography variant="caption" color="text.secondary">Rasante y distanciamientos</Typography></Grid>
      {decField('Rasante', 'rasante', '°')}
      <Grid item xs={6} sm={4}>
        <TextField label="Nivel de aplicación de rasante" value={form.rasante_application_level} onChange={set('rasante_application_level')} fullWidth size="small" />
      </Grid>
      {decField('Antejardín mín.', 'antejadin_min', 'm')}
      {decField('Distanciamiento costados', 'side_setback_min', 'm')}
      {decField('Distanciamiento fondo', 'rear_setback_min', 'm')}

      <Grid item xs={12} sx={{ mt: 0.5 }}><Typography variant="caption" color="text.secondary">Cierros y otros</Typography></Grid>
      {decField('Altura máx. cierros', 'fence_max_height', 'm')}
      {decField('Transparencia cierros', 'fence_transparency_pct', '%')}
      <Grid item xs={6} sm={4}>
        <TextField label="Ochavos" value={form.ochavo} onChange={set('ochavo')} fullWidth size="small" />
      </Grid>
      <Grid item xs={12} sm={8}>
        <TextField label="Cesiones áreas verdes (Art. 2.2.5)" value={form.cesiones} onChange={set('cesiones')} fullWidth size="small" />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Adosamientos" value={form.adosamiento} onChange={set('adosamiento')} fullWidth size="small" multiline rows={2} />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Estacionamientos (texto del certificado)" value={form.parking_notes} onChange={set('parking_notes')} fullWidth size="small" multiline rows={3} />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}><Divider /><Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Bloque 3 — Postergación (Art. 117 LGUC)</Typography></Grid>
      <Grid item xs={6} sm={4}>
        <TextField label="Decreto / Resolución N°" value={form.postponement_decree} onChange={set('postponement_decree')} fullWidth size="small" />
      </Grid>
      <Grid item xs={6} sm={4}>
        <TextField label="Fecha" type="date" value={form.postponement_date} onChange={set('postponement_date')} fullWidth size="small" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sm={8}>
        <TextField label="Plazo de vigencia" value={form.postponement_term} onChange={set('postponement_term')} fullWidth size="small" />
      </Grid>

      <Grid item xs={12} sx={{ mt: 1 }}><Divider /><Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Bloque 4 y 6</Typography></Grid>
      <Grid item xs={6} sm={4}>
        <TextField
          label="Estado urbanización (Bloque 6)"
          select
          value={form.urbanization_status}
          onChange={set('urbanization_status')}
          fullWidth size="small"
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}
        >
          <option value="">No especificado</option>
          <option value="ejecutada">Ejecutada</option>
          <option value="recibida">Recibida</option>
          <option value="garantizada">Garantizada</option>
        </TextField>
      </Grid>
      <Grid item xs={6} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={form.requires_subsoil_report === true}
              indeterminate={form.requires_subsoil_report === null}
              onChange={(e) =>
                setForm(prev => ({
                  ...prev,
                  requires_subsoil_report: e.target.checked ? true : (form.requires_subsoil_report === true ? false : null),
                }))
              }
            />
          }
          label={<Typography variant="body2">Requiere informe subsuelo (Bloque 4)</Typography>}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Normas adicionales (hoja anexa)" value={form.additional_notes} onChange={set('additional_notes')} fullWidth size="small" multiline rows={4} />
      </Grid>

      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <CircularProgress size={20} /> : 'Guardar'}
        </Button>
      </Grid>
    </Grid>
  );
}

// ─── Frentes de calle (Bloque 5.2) ─────────────────────────────────────────

function FrontesTab({
  cipId,
  frontages,
  onCreateFrontage,
  onUpdateFrontage,
  onDeleteFrontage,
  isLoading,
}: {
  cipId: number;
  frontages: CIPStreetFrontageData[];
  onCreateFrontage: (data: Omit<CIPStreetFrontageData, 'id'>) => Promise<any>;
  onUpdateFrontage: (args: { id: number; data: Partial<CIPStreetFrontageData> }) => Promise<any>;
  onDeleteFrontage: (id: number) => Promise<any>;
  isLoading: boolean;
}) {
  const emptyFrontage = (): Omit<CIPStreetFrontageData, 'id'> => ({
    cip: cipId,
    order: frontages.length,
    street_name: '',
    road_type: '',
    distance_between_lo: null,
    distance_lo_to_axis: null,
    roadway_width: null,
    antejadin: null,
  });

  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState(emptyFrontage);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Partial<CIPStreetFrontageData>>({});

  const setNew = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNewRow(prev => ({ ...prev, [field]: e.target.value || null }));
  const setEdit = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditRow(prev => ({ ...prev, [field]: e.target.value || null }));

  const handleAdd = async () => {
    await onCreateFrontage(newRow);
    setAdding(false);
    setNewRow(emptyFrontage());
  };

  const handleSaveEdit = async (id: number) => {
    await onUpdateFrontage({ id, data: editRow });
    setEditingId(null);
    setEditRow({});
  };

  const startEdit = (f: CIPStreetFrontageData) => {
    setEditingId(f.id!);
    setEditRow({ ...f });
  };

  const FrontageFields = ({
    vals,
    setFn,
    isEdit,
    id,
  }: {
    vals: any;
    setFn: (f: string) => any;
    isEdit: boolean;
    id?: number;
  }) => (
    <Grid container spacing={1.5} alignItems="flex-end">
      <Grid item xs={12} sm={4}>
        <TextField label="Por calle" value={vals.street_name ?? ''} onChange={setFn('street_name')} fullWidth size="small" required />
      </Grid>
      <Grid item xs={6} sm={2}>
        <TextField label="Tipo vía" value={vals.road_type ?? ''} onChange={setFn('road_type')} fullWidth size="small" placeholder="Local, Colectora…" />
      </Grid>
      <Grid item xs={6} sm={2}>
        <TextField label="Dist. entre L.O. (m)" type="number" inputProps={{ step: 'any' }} value={vals.distance_between_lo ?? ''} onChange={setFn('distance_between_lo')} fullWidth size="small" />
      </Grid>
      <Grid item xs={6} sm={2}>
        <TextField label="L.O. a eje calzada (m)" type="number" inputProps={{ step: 'any' }} value={vals.distance_lo_to_axis ?? ''} onChange={setFn('distance_lo_to_axis')} fullWidth size="small" />
      </Grid>
      <Grid item xs={6} sm={2}>
        <TextField label="Calzada (m)" type="number" inputProps={{ step: 'any' }} value={vals.roadway_width ?? ''} onChange={setFn('roadway_width')} fullWidth size="small" />
      </Grid>
      <Grid item xs={6} sm={2}>
        <TextField label="Antejardín (m)" type="number" inputProps={{ step: 'any' }} value={vals.antejadin ?? ''} onChange={setFn('antejadin')} fullWidth size="small" />
      </Grid>
      <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        {isEdit && id != null ? (
          <>
            <Button size="small" onClick={() => setEditingId(null)}>Cancelar</Button>
            <Button size="small" variant="contained" onClick={() => handleSaveEdit(id)} disabled={isLoading}>
              {isLoading ? <CircularProgress size={16} /> : 'Guardar'}
            </Button>
          </>
        ) : (
          <>
            <Button size="small" onClick={() => setAdding(false)}>Cancelar</Button>
            <Button size="small" variant="contained" onClick={handleAdd} disabled={isLoading || !newRow.street_name}>
              {isLoading ? <CircularProgress size={16} /> : 'Agregar'}
            </Button>
          </>
        )}
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        Bloque 5.2 — Líneas Oficiales por frente de calle
      </Typography>

      {frontages.length === 0 && !adding && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No hay frentes de calle registrados.
        </Typography>
      )}

      {frontages.map((f, idx) => (
        <Paper key={f.id} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
          {editingId === f.id ? (
            <FrontageFields vals={editRow} setFn={setEdit} isEdit id={f.id} />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{idx + 1}. {f.street_name} {f.road_type ? `(${f.road_type})` : ''}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Dist. entre L.O.: {decVal(f.distance_between_lo)} m | L.O.–eje: {decVal(f.distance_lo_to_axis)} m | Calzada: {decVal(f.roadway_width)} m | Antejardín: {decVal(f.antejadin)} m
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                <Button size="small" onClick={() => startEdit(f)}>Editar</Button>
                <Button size="small" color="error" onClick={() => onDeleteFrontage(f.id!)} disabled={isLoading}>Eliminar</Button>
              </Box>
            </Box>
          )}
        </Paper>
      ))}

      {adding ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <FrontageFields vals={newRow} setFn={setNew} isEdit={false} />
        </Paper>
      ) : (
        <Button startIcon={<AddIcon />} onClick={() => setAdding(true)} size="small" variant="outlined" sx={{ mt: 1 }}>
          Agregar frente de calle
        </Button>
      )}
    </Box>
  );
}

// ─── Afectaciones (Bloque 5.3) ─────────────────────────────────────────────

function AfectacionesTab({
  cip,
  onSave,
  isSaving,
}: {
  cip: CIPData;
  onSave: (data: Partial<CIPData>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    affected_public_utility: cip.affected_public_utility,
    affected_park: cip.affected_park,
    affected_road: cip.affected_road,
    affected_road_type: cip.affected_road_type,
    affected_public_utility_roads: cip.affected_public_utility_roads,
    affected_public_utility_description: cip.affected_public_utility_description,
    affected_risk_area: cip.affected_risk_area,
    affected_risk_area_detail: cip.affected_risk_area_detail,
    affected_protection_area: cip.affected_protection_area,
    affected_protection_area_detail: cip.affected_protection_area_detail,
    affected_historic: cip.affected_historic,
    affected_historic_detail: cip.affected_historic_detail,
    affected_monument: cip.affected_monument,
    affected_monument_detail: cip.affected_monument_detail,
  });

  const setBool = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.checked }));

  const setText = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const BoolRow = ({
    label,
    field,
    detailField,
    showDetail,
  }: {
    label: string;
    field: keyof typeof form;
    detailField?: keyof typeof form;
    showDetail?: boolean;
  }) => (
    <>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={(form[field] as boolean | null) === true}
              indeterminate={form[field] === null}
              onChange={setBool(field)}
            />
          }
          label={<Typography variant="body2">{label}</Typography>}
        />
      </Grid>
      {detailField && showDetail && (form[field] as boolean | null) === true && (
        <Grid item xs={12} sm={6}>
          <TextField
            label="Detalle"
            value={(form[detailField] as string) ?? ''}
            onChange={setText(detailField)}
            fullWidth size="small"
          />
        </Grid>
      )}
    </>
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Bloque 5.3 — Afectación a Utilidad Pública (Art. 59)</Typography></Grid>

      <BoolRow label="Afecta a declaratoria de utilidad pública" field="affected_public_utility" />
      <BoolRow label="Afecta a parque" field="affected_park" />
      <BoolRow
        label="Afecta a vialidad"
        field="affected_road"
        detailField="affected_road_type"
        showDetail
      />
      {form.affected_road && (
        <Grid item xs={12} sm={4}>
          <TextField
            label="Tipo de afectación vial"
            select
            value={form.affected_road_type ?? ''}
            onChange={setText('affected_road_type')}
            fullWidth size="small"
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
          >
            <option value="">No especificado</option>
            <option value="ensanche">Ensanche</option>
            <option value="apertura">Apertura</option>
          </TextField>
        </Grid>
      )}
      {form.affected_public_utility && (
        <>
          <Grid item xs={12}>
            <TextField
              label="Vías afectas a utilidad pública"
              value={form.affected_public_utility_roads}
              onChange={setText('affected_public_utility_roads')}
              fullWidth size="small" multiline rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Graficación del área afecta (superficie y dimensiones)"
              value={form.affected_public_utility_description}
              onChange={setText('affected_public_utility_description')}
              fullWidth size="small" multiline rows={2}
            />
          </Grid>
        </>
      )}

      <Grid item xs={12} sx={{ mt: 1 }}><Divider /></Grid>

      <BoolRow label="Área de riesgo" field="affected_risk_area" detailField="affected_risk_area_detail" showDetail />
      {form.affected_risk_area && (
        <Grid item xs={12} sm={8}>
          <TextField label="Detalle área de riesgo" value={form.affected_risk_area_detail} onChange={setText('affected_risk_area_detail')} fullWidth size="small" />
        </Grid>
      )}

      <BoolRow label="Área de protección" field="affected_protection_area" detailField="affected_protection_area_detail" showDetail />
      {form.affected_protection_area && (
        <Grid item xs={12} sm={8}>
          <TextField label="Detalle área de protección" value={form.affected_protection_area_detail} onChange={setText('affected_protection_area_detail')} fullWidth size="small" />
        </Grid>
      )}

      <BoolRow label="Zona o inmueble de Conservación Histórica" field="affected_historic" />
      {form.affected_historic && (
        <Grid item xs={12} sm={8}>
          <TextField label="Detalle Conservación Histórica" value={form.affected_historic_detail} onChange={setText('affected_historic_detail')} fullWidth size="small" />
        </Grid>
      )}

      <BoolRow label="Zona Típica o Monumento Nacional" field="affected_monument" />
      {form.affected_monument && (
        <Grid item xs={12} sm={8}>
          <TextField label="Detalle Monumento Nacional" value={form.affected_monument_detail} onChange={setText('affected_monument_detail')} fullWidth size="small" />
        </Grid>
      )}

      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
        <Button variant="contained" onClick={() => onSave(form as Partial<CIPData>)} disabled={isSaving}>
          {isSaving ? <CircularProgress size={20} /> : 'Guardar'}
        </Button>
      </Grid>
    </Grid>
  );
}

// ─── Empty state: sin CIP vinculado ────────────────────────────────────────

const INITIAL_CIP: Partial<CIPData> = {
  certificate_number: '',
  issue_date: new Date().toISOString().slice(0, 10),
  municipalidad: '',
  zone_name: '',
  area_type: 'urbana',
  cos_max: null,
  cus_max: null,
  max_height: null,
  rasante: null,
};

function NoCIPState({
  subprojectId,
  onLinked,
}: {
  subprojectId: number;
  onLinked: () => void;
}) {
  const { searchCIPs, searchResults, isSearching, createCIP, isCreating, linkCIP, isLinking } = useCIPEngine(subprojectId);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newCIP, setNewCIP] = useState<Partial<CIPData>>(INITIAL_CIP);
  const [candidateCIP, setCandidateCIP] = useState<CIPData | null>(null);

  const regiones = useQuery<RegionItem[]>({
    queryKey: ['region', 'v1'],
    queryFn: async () => (await api.get<RegionItem[]>('region/v1/')).data,
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = async () => {
    if (!search.trim()) return;
    await searchCIPs({ search: search.trim() });
  };

  const handleLinkConfirm = async () => {
    if (!candidateCIP) return;
    await linkCIP(candidateCIP.id);
    setCandidateCIP(null);
    onLinked();
  };

  const handleCreate = async () => {
    const created = await createCIP(newCIP);
    await linkCIP(created.id);
    setCreateOpen(false);
    onLinked();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Vincular Certificado de Informaciones Previas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Busca un CIP existente por número o municipalidad, o crea uno nuevo.
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Buscar por N° o municipalidad"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 240 }}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch} disabled={!search.trim() || isSearching}>
          Buscar
        </Button>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Nuevo CIP
        </Button>
      </Box>

      {isSearching && <CircularProgress size={24} />}

      {!isSearching && searchResults.length > 0 && (
        <Box>
          {searchResults.map(cip => (
            <Paper
              key={cip.id}
              variant="outlined"
              sx={{ p: 1.5, mb: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => setCandidateCIP(cip)}
            >
              <Typography variant="body2" fontWeight={600}>
                CIP {cip.certificate_number} — {cip.issue_date}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {cip.municipalidad} {cip.zone_name ? `· Zona ${cip.zone_name}` : ''}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Confirmar vinculación */}
      <Dialog open={!!candidateCIP} onClose={() => setCandidateCIP(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Vincular CIP</DialogTitle>
        <DialogContent>
          {candidateCIP && (
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {[
                { label: 'N°', value: candidateCIP.certificate_number },
                { label: 'Fecha', value: candidateCIP.issue_date },
                { label: 'Municipalidad', value: candidateCIP.municipalidad },
                { label: 'Zona', value: candidateCIP.zone_name },
                { label: 'COS máx.', value: decVal(candidateCIP.cos_max) },
                { label: 'Altura máx.', value: decVal(candidateCIP.max_height) && `${candidateCIP.max_height} m` },
              ]
                .filter(r => r.value)
                .map((r, i) => (
                  <Typography component="li" key={i} variant="body2" sx={{ mb: 0.5 }}>
                    <strong>{r.label}:</strong> {r.value}
                  </Typography>
                ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setCandidateCIP(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleLinkConfirm} disabled={isLinking}>
            {isLinking ? <CircularProgress size={20} /> : 'Vincular'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal crear nuevo CIP */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Certificado de Informaciones Previas</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Certificado N°" value={newCIP.certificate_number ?? ''} onChange={e => setNewCIP(p => ({ ...p, certificate_number: e.target.value }))} fullWidth size="small" required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Fecha de emisión" type="date" value={newCIP.issue_date ?? ''} onChange={e => setNewCIP(p => ({ ...p, issue_date: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12}>
              <TextField label="I. Municipalidad" value={newCIP.municipalidad ?? ''} onChange={e => setNewCIP(p => ({ ...p, municipalidad: e.target.value }))} fullWidth size="small" />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Región"
                select
                value={newCIP.region != null ? String(newCIP.region) : ''}
                onChange={e => setNewCIP(p => ({ ...p, region: e.target.value ? Number(e.target.value) : null }))}
                fullWidth size="small"
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
              >
                <option value="">Seleccionar...</option>
                {(regiones.data ?? []).map(r => <option key={r.id} value={r.id}>{r.region}</option>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Zona / Subzona" value={newCIP.zone_name ?? ''} onChange={e => setNewCIP(p => ({ ...p, zone_name: e.target.value }))} fullWidth size="small" placeholder="Ej: R2" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Destino solicitado" value={newCIP.destination ?? ''} onChange={e => setNewCIP(p => ({ ...p, destination: e.target.value }))} fullWidth size="small" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={isCreating || !newCIP.certificate_number || !newCIP.issue_date}>
            {isCreating ? <CircularProgress size={20} /> : 'Crear y vincular'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export interface CIPSectionContentProps {
  subprojectId: number;
  onMotorAppliedChange?: () => void | Promise<void>;
}

const CIPSectionContent: React.FC<CIPSectionContentProps> = ({ subprojectId, onMotorAppliedChange }) => {
  const [activeTab, setActiveTab] = useState<CIPTabType>('resumen');
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);

  const {
    cip, isLoadingCIP,
    updateCIP, isUpdating,
    unlinkCIP, isUnlinking,
    createFrontage, updateFrontage, deleteFrontage, isFrontageLoading,
    invalidateCIP,
  } = useCIPEngine(subprojectId);

  const regionesQuery = useQuery<RegionItem[]>({
    queryKey: ['region', 'v1'],
    queryFn: async () => (await api.get<RegionItem[]>('region/v1/')).data,
    staleTime: 5 * 60 * 1000,
  });
  const regiones = regionesQuery.data ?? [];

  if (isLoadingCIP) {
    return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  if (!cip) {
    return (
      <NoCIPState
        subprojectId={subprojectId}
        onLinked={async () => {
          invalidateCIP();
          await onMotorAppliedChange?.();
        }}
      />
    );
  }

  const handleSave = async (data: Partial<CIPData>) => {
    await updateCIP({ id: cip.id, data });
    invalidateCIP();
    await onMotorAppliedChange?.();
  };

  const handleUnlinkConfirm = async () => {
    await unlinkCIP();
    setUnlinkConfirmOpen(false);
    await onMotorAppliedChange?.();
  };

  const tabs: { key: CIPTabType; label: string }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'identificacion', label: 'Identificación' },
    { key: 'normas', label: 'Normas Urbanísticas' },
    { key: 'frentes', label: 'Frentes de Calle' },
    { key: 'afectaciones', label: 'Afectaciones' },
  ];

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabs}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeTab === t.key ? styles.active : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            {t.key === 'afectaciones' && cip.has_restrictions && (
              <WarningAmberIcon sx={{ fontSize: 14, ml: 0.5, color: 'warning.main', verticalAlign: 'middle' }} />
            )}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        <div className={styles.tabPane}>
          {activeTab === 'resumen' && (
            <CIPSummary
              cip={cip}
              onDesvinculer={() => setUnlinkConfirmOpen(true)}
              isUnlinking={isUnlinking}
            />
          )}
          {activeTab === 'identificacion' && (
            <IdentificacionTab cip={cip} regiones={regiones} onSave={handleSave} isSaving={isUpdating} />
          )}
          {activeTab === 'normas' && (
            <NormasTab cip={cip} onSave={handleSave} isSaving={isUpdating} />
          )}
          {activeTab === 'frentes' && (
            <FrontesTab
              cipId={cip.id}
              frontages={cip.street_frontages}
              onCreateFrontage={createFrontage}
              onUpdateFrontage={updateFrontage}
              onDeleteFrontage={deleteFrontage}
              isLoading={isFrontageLoading}
            />
          )}
          {activeTab === 'afectaciones' && (
            <AfectacionesTab cip={cip} onSave={handleSave} isSaving={isUpdating} />
          )}
        </div>
      </div>

      <Dialog open={unlinkConfirmOpen} onClose={() => setUnlinkConfirmOpen(false)}>
        <DialogTitle>Desvincular CIP</DialogTitle>
        <DialogContent>
          <Typography>
            Se desvinculará el CIP <strong>{cip.certificate_number}</strong> de este subproyecto. Los parámetros normativos sincronizados desde el CIP quedarán en el formulario pero ya no estarán vinculados a este certificado. ¿Continuar?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setUnlinkConfirmOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="warning" onClick={handleUnlinkConfirm} disabled={isUnlinking}>
            {isUnlinking ? <CircularProgress size={20} /> : 'Desvincular'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CIPSectionContent;
