import React, { useState, useEffect, useCallback } from 'react';
import {
  Avatar,
  Button,
  CircularProgress,
  TextField,
  Select,
  MenuItem as MuiMenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CancelIcon,
  Star as StarIcon,
  CalendarMonth as CalendarIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../context/AuthContext';
import styles from './Profile.module.scss';

interface RegionOption {
  id: number;
  region: string;
}

interface ComunaOption {
  id: number;
  comuna: string;
}

interface ProfessionDetail {
  id: number;
  profession: string;
  university: {
    id: number;
    name: string;
    type: string;
    region_name: string;
  };
}

interface ProfileData {
  id: number;
  identifier: string;
  email: string;
  first_name: string;
  last_name: string;
  rut: string | null;
  phone: number | null;
  address: string | null;
  address_number: string | null;
  region: number | null;
  region_detail: RegionOption | null;
  comuna: number | null;
  comuna_detail: ComunaOption | null;
  profession: ProfessionDetail[];
  score: number;
  is_staff: boolean;
  created_at: string;
}

interface FormFields {
  first_name: string;
  last_name: string;
  rut: string;
  phone: string;
  address: string;
  address_number: string;
  region: number | '';
  comuna: number | '';
}

const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<FormFields>({
    first_name: '',
    last_name: '',
    rut: '',
    phone: '',
    address: '',
    address_number: '',
    region: '',
    comuna: '',
  });

  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [comunas, setComunas] = useState<ComunaOption[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/social/user/profile/');
      setProfile(res.data);
      setError(null);
    } catch {
      setError('No se pudo cargar el perfil. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRegions = useCallback(async () => {
    try {
      const res = await api.get('/api/region/v1/');
      setRegions(res.data);
    } catch {
      // Regions will remain empty; selects show placeholder
    }
  }, []);

  const fetchComunas = useCallback(async (regionId: number) => {
    try {
      const res = await api.get('/api/comuna/v1/', {
        params: { region: regionId },
      });
      setComunas(res.data);
    } catch {
      setComunas([]);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const populateForm = useCallback((data: ProfileData) => {
    setForm({
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      rut: data.rut || '',
      phone: data.phone != null ? String(data.phone) : '',
      address: data.address || '',
      address_number: data.address_number || '',
      region: data.region_detail?.id ?? '',
      comuna: data.comuna_detail?.id ?? '',
    });
  }, []);

  const handleEdit = async () => {
    if (!profile) return;
    await fetchRegions();
    if (profile.region_detail?.id) {
      await fetchComunas(profile.region_detail.id);
    }
    populateForm(profile);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) populateForm(profile);
  };

  const handleFieldChange = (field: keyof FormFields, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegionChange = (regionId: number | '') => {
    setForm((prev) => ({ ...prev, region: regionId, comuna: '' }));
    setComunas([]);
    if (regionId !== '') {
      fetchComunas(regionId);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        first_name: form.first_name,
        last_name: form.last_name,
        rut: form.rut || null,
        phone: form.phone ? Number(form.phone) : null,
        address: form.address || null,
        address_number: form.address_number || null,
        region: form.region || null,
        comuna: form.comuna || null,
      };
      const res = await api.patch('/api/auth/social/user/profile/', payload);
      setProfile(res.data);
      setEditing(false);

      // Invalidate the auth user query so Navbar reflects updated name
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch {
      setError('No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <CircularProgress />
        <span>Cargando perfil...</span>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className={styles.errorContainer}>
        <span>{error}</span>
        <Button variant="outlined" onClick={fetchProfile}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Avatar className={styles.headerAvatar}>
          {profile.first_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
        </Avatar>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerName}>
            {profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile.email}
          </h1>
          <p className={styles.headerEmail}>{profile.email}</p>
          <div className={styles.headerMeta}>
            <span className={styles.chip}>
              <StarIcon sx={{ fontSize: 14 }} />
              Puntaje: {profile.score}
            </span>
            {profile.created_at && (
              <span className={styles.chip}>
                <CalendarIcon sx={{ fontSize: 14 }} />
                Miembro desde {formatDate(profile.created_at)}
              </span>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          {editing ? (
            <>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Editar
            </Button>
          )}
        </div>
      </div>

      {error && profile && (
        <div className={styles.errorContainer} style={{ padding: '8px 16px', marginBottom: 16 }}>
          <span>{error}</span>
        </div>
      )}

      {/* Personal info */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Información Personal</h2>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label>Nombre</label>
            {editing ? (
              <TextField
                fullWidth
                size="small"
                value={form.first_name}
                onChange={(e) => handleFieldChange('first_name', e.target.value)}
              />
            ) : (
              <div className={styles.fieldValue}>
                {profile.first_name || <span className={styles.emptyValue}>Sin especificar</span>}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Apellido</label>
            {editing ? (
              <TextField
                fullWidth
                size="small"
                value={form.last_name}
                onChange={(e) => handleFieldChange('last_name', e.target.value)}
              />
            ) : (
              <div className={styles.fieldValue}>
                {profile.last_name || <span className={styles.emptyValue}>Sin especificar</span>}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Correo electrónico</label>
            <div className={styles.fieldValue}>{profile.email}</div>
          </div>

          <div className={styles.field}>
            <label>RUT</label>
            {editing ? (
              <TextField
                fullWidth
                size="small"
                value={form.rut}
                onChange={(e) => handleFieldChange('rut', e.target.value)}
                placeholder="12.345.678-9"
              />
            ) : (
              <div className={styles.fieldValue}>
                {profile.rut || <span className={styles.emptyValue}>Sin especificar</span>}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Teléfono</label>
            {editing ? (
              <TextField
                fullWidth
                size="small"
                type="tel"
                value={form.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            ) : (
              <div className={styles.fieldValue}>
                {profile.phone != null ? profile.phone : (
                  <span className={styles.emptyValue}>Sin especificar</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Dirección</h2>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label>Región</label>
            {editing ? (
              <FormControl fullWidth size="small">
                <InputLabel>Región</InputLabel>
                <Select
                  value={form.region}
                  label="Región"
                  onChange={(e) => handleRegionChange(e.target.value as number | '')}
                >
                  <MuiMenuItem value="">
                    <em>Seleccionar</em>
                  </MuiMenuItem>
                  {regions.map((r) => (
                    <MuiMenuItem key={r.id} value={r.id}>
                      {r.region}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <div className={styles.fieldValue}>
                {profile.region_detail?.region || (
                  <span className={styles.emptyValue}>Sin especificar</span>
                )}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Comuna</label>
            {editing ? (
              <FormControl fullWidth size="small">
                <InputLabel>Comuna</InputLabel>
                <Select
                  value={form.comuna}
                  label="Comuna"
                  onChange={(e) => handleFieldChange('comuna', e.target.value as number)}
                  disabled={!form.region}
                >
                  <MuiMenuItem value="">
                    <em>Seleccionar</em>
                  </MuiMenuItem>
                  {comunas.map((c) => (
                    <MuiMenuItem key={c.id} value={c.id}>
                      {c.comuna}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <div className={styles.fieldValue}>
                {profile.comuna_detail?.comuna || (
                  <span className={styles.emptyValue}>Sin especificar</span>
                )}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Dirección</label>
            {editing ? (
              <TextField
                fullWidth
                size="small"
                value={form.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="Av. Ejemplo"
              />
            ) : (
              <div className={styles.fieldValue}>
                {profile.address || <span className={styles.emptyValue}>Sin especificar</span>}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Número</label>
            {editing ? (
              <TextField
                fullWidth
                size="small"
                value={form.address_number}
                onChange={(e) => handleFieldChange('address_number', e.target.value)}
                placeholder="1234"
              />
            ) : (
              <div className={styles.fieldValue}>
                {profile.address_number || (
                  <span className={styles.emptyValue}>Sin especificar</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Professions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Información Profesional</h2>
        {profile.profession.length > 0 ? (
          <div className={styles.professionList}>
            {profile.profession.map((p) => (
              <div key={p.id} className={styles.professionItem}>
                <SchoolIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <div>
                  <div className={styles.professionName}>{p.profession}</div>
                  <div className={styles.professionUniversity}>
                    {p.university.name} ({p.university.type === 'publica' ? 'Pública' : 'Privada'})
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyProfessions}>
            No hay profesiones registradas.
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
