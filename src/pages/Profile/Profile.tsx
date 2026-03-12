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
  Tabs,
  Tab,
  Box,
  Autocomplete,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CancelIcon,
  CalendarMonth as CalendarIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../context/AuthContext';
import { getProfilePhotoUrl } from '../../utils/helpers';
import styles from './Profile.module.scss';

const PROFESSION_CHOICES = [
  'Arquitecto',
  'Ingeniero Civil en Obras Civiles',
  'Ingeniero Eléctrico',
  'Ingeniero Hidráulico',
  'Constructor Civil',
  'Topógrafo',
  'Otros',
] as const;

interface RegionOption {
  id: number;
  region: string;
}

interface ComunaOption {
  id: number;
  comuna: string;
}

interface UniversityOption {
  id: number;
  name: string;
  type: string;
  region_name: string;
}

const OTRAS_UNIVERSIDAD_OPTION: UniversityOption & { __crearNueva?: boolean } = {
  id: -1,
  name: 'Otras (crear nueva universidad)',
  type: '',
  region_name: '',
  __crearNueva: true,
};

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

interface PatentDetail {
  id: number;
  name: string;
  description: string | null;
  profession: number;
  profession_name: string;
  number: number;
  category: string;
  validity_date: string | null;
  comuna_detail: ComunaOption | null;
  document: string | null;
}

interface CompanyDetail {
  id: number;
  name: string;
  mail: string | null;
  rut: string | null;
  address: string | null;
  address_number: string | null;
  region_detail: RegionOption | null;
  comuna_detail: ComunaOption | null;
  phone: number | null;
  profile_photo: string | null;
}

interface RoleOption {
  id: number;
  role: string;
}

interface ProfileData {
  id: number;
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
  role: number | null;
  role_detail: RoleOption | null;
  patents: PatentDetail[];
  companies: CompanyDetail[];
  profile_photo: string | null;
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
  profession: number[];
  role: number | '';
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
    profession: [],
    role: '',
  });

  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [comunas, setComunas] = useState<ComunaOption[]>([]);
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [patentComunas, setPatentComunas] = useState<ComunaOption[]>([]);
  const [rolesList, setRolesList] = useState<RoleOption[]>([]);
  const [showProfessionForm, setShowProfessionForm] = useState(false);
  const [showPatentForm, setShowPatentForm] = useState(false);
  const [professionForm, setProfessionForm] = useState({
    profession: '' as string,
    professionOther: '',
    universityId: null as number | null,
    createNew: false,
    universityName: '',
    universityRegion: null as number | null,
    universityType: '',
  });
  const [patentForm, setPatentForm] = useState({
    name: '',
    number: '',
    category: '',
    description: '',
    validity_date: '',
    profession: null as number | null,
    region: null as number | null,
    comuna: null as number | null,
  });
  const [submittingProfession, setSubmittingProfession] = useState(false);
  const [submittingPatent, setSubmittingPatent] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleFormValue, setRoleFormValue] = useState<number | ''>('');
  const [submittingRole, setSubmittingRole] = useState(false);
  const [showOfficeForm, setShowOfficeForm] = useState(false);
  const [officeForm, setOfficeForm] = useState({
    name: '',
    mail: '',
    rut: '',
    address: '',
    address_number: '',
    region: null as number | null,
    comuna: null as number | null,
    phone: '',
  });
  const [officeComunas, setOfficeComunas] = useState<ComunaOption[]>([]);
  const [submittingOffice, setSubmittingOffice] = useState(false);
  const [officePhotoFile, setOfficePhotoFile] = useState<File | null>(null);
  const [officePhotoPreviewUrl, setOfficePhotoPreviewUrl] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const officeFileInputRef = React.useRef<HTMLInputElement>(null);

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

  const fetchUniversities = useCallback(async () => {
    try {
      const res = await api.get<UniversityOption[]>('/api/users/universities/');
      setUniversities(res.data ?? []);
    } catch {
      setUniversities([]);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get<RoleOption[]>('/api/users/roles/');
      setRolesList(res.data ?? []);
    } catch {
      setRolesList([]);
    }
  }, []);

  const fetchPatentComunas = useCallback(async (regionId: number) => {
    try {
      const res = await api.get<ComunaOption[]>('/api/comuna/v1/', {
        params: { region: regionId },
      });
      setPatentComunas(res.data ?? []);
    } catch {
      setPatentComunas([]);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!profilePhotoFile) {
      setProfilePhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(profilePhotoFile);
    setProfilePhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePhotoFile]);

  useEffect(() => {
    if (!officePhotoFile) {
      setOfficePhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(officePhotoFile);
    setOfficePhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [officePhotoFile]);

  useEffect(() => {
    if (tabValue === 1) {
      fetchUniversities();
      fetchRegions();
      fetchRoles();
    }
    if (tabValue === 2) {
      fetchRegions();
    }
  }, [tabValue, fetchUniversities, fetchRegions, fetchRoles]);

  const fetchOfficeComunas = useCallback(async (regionId: number) => {
    try {
      const res = await api.get<ComunaOption[]>('/api/comuna/v1/', {
        params: { region: regionId },
      });
      setOfficeComunas(res.data ?? []);
    } catch {
      setOfficeComunas([]);
    }
  }, []);

  const handleCreateProfession = async () => {
    if (!profile) return;
    const { profession, professionOther, universityId, createNew, universityName, universityRegion, universityType } = professionForm;
    if (!profession) return;
    if (profession === 'Otros' && !professionOther.trim()) return;
    if (!createNew && !universityId) return;
    if (createNew && (!universityName.trim() || !universityRegion || !universityType)) return;
    try {
      setSubmittingProfession(true);
      const basePayload: Record<string, unknown> = {
        profession,
        ...(profession === 'Otros' ? { profession_other: professionOther.trim() } : {}),
      };
      const payload = createNew
        ? { ...basePayload, university_name: universityName.trim(), university_region: universityRegion, university_type: universityType }
        : { ...basePayload, university_id: universityId };
      const res = await api.post<ProfessionDetail>('/api/users/professions/', payload);
      setProfile((prev) => prev ? { ...prev, profession: [...(prev.profession ?? []), res.data] } : null);
      setShowProfessionForm(false);
      setProfessionForm({
        profession: '',
        professionOther: '',
        universityId: null,
        createNew: false,
        universityName: '',
        universityRegion: null,
        universityType: '',
      });
    } catch {
      setError('No se pudo agregar la profesión.');
    } finally {
      setSubmittingProfession(false);
    }
  };

  const handleDeleteProfession = async (id: number) => {
    try {
      await api.delete(`/api/users/professions/${id}/`);
      setProfile((prev) => prev ? { ...prev, profession: (prev.profession ?? []).filter((p) => p.id !== id) } : null);
    } catch {
      setError('No se pudo eliminar la profesión.');
    }
  };

  const handleCreatePatent = async () => {
    if (!profile) return;
    const { name, number, category, profession, comuna } = patentForm;
    if (!name.trim() || !number || !category || !profession || !comuna) return;
    try {
      setSubmittingPatent(true);
      const payload = {
        name: name.trim(),
        number: Number(number),
        category: category.trim(),
        profession,
        comuna,
        description: patentForm.description?.trim() || null,
        validity_date: patentForm.validity_date || null,
      };
      const res = await api.post<PatentDetail>('/api/users/patents/', payload);
      setProfile((prev) => prev ? { ...prev, patents: [...(prev.patents ?? []), res.data] } : null);
      setShowPatentForm(false);
      setPatentForm({ name: '', number: '', category: '', description: '', validity_date: '', profession: null, region: null, comuna: null });
    } catch {
      setError('No se pudo agregar la patente.');
    } finally {
      setSubmittingPatent(false);
    }
  };

  const handleDeletePatent = async (id: number) => {
    try {
      await api.delete(`/api/users/patents/${id}/`);
      setProfile((prev) => prev ? { ...prev, patents: (prev.patents ?? []).filter((p) => p.id !== id) } : null);
    } catch {
      setError('No se pudo eliminar la patente.');
    }
  };

  const handleSaveRole = async () => {
    if (!profile) return;
    try {
      setSubmittingRole(true);
      const payload = { role: roleFormValue === '' ? null : roleFormValue };
      const res = await api.patch('/api/auth/social/user/profile/', payload);
      setProfile(res.data);
      setShowRoleForm(false);
      setRoleFormValue('');
    } catch {
      setError('No se pudo guardar el rol.');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!profile) return;
    try {
      setSubmittingRole(true);
      const res = await api.patch('/api/auth/social/user/profile/', { role: null });
      setProfile(res.data);
    } catch {
      setError('No se pudo eliminar el rol.');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleDeleteCompany = async (id: number) => {
    try {
      await api.delete(`/api/users/companies/${id}/`);
      setProfile((prev) => prev ? { ...prev, companies: (prev.companies ?? []).filter((c) => c.id !== id) } : null);
    } catch {
      setError('No se pudo eliminar la oficina.');
    }
  };

  const handleCreateOffice = async () => {
    if (!profile) return;
    if (!officeForm.name.trim()) return;
    try {
      setSubmittingOffice(true);
      if (officePhotoFile) {
        const formData = new FormData();
        formData.append('name', officeForm.name.trim());
        if (officeForm.mail.trim()) formData.append('mail', officeForm.mail.trim());
        if (officeForm.rut.trim()) formData.append('rut', officeForm.rut.trim());
        if (officeForm.address.trim()) formData.append('address', officeForm.address.trim());
        if (officeForm.address_number.trim()) formData.append('address_number', officeForm.address_number.trim());
        if (officeForm.region != null) formData.append('region', String(officeForm.region));
        if (officeForm.comuna != null) formData.append('comuna', String(officeForm.comuna));
        if (officeForm.phone) formData.append('phone', officeForm.phone);
        formData.append('profile_photo', officePhotoFile);
        const res = await api.post<CompanyDetail>('/api/users/companies/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setProfile((prev) => prev ? { ...prev, companies: [...(prev.companies ?? []), res.data] } : null);
        setOfficePhotoFile(null);
        setOfficePhotoPreviewUrl(null);
      } else {
        const payload = {
          name: officeForm.name.trim(),
          mail: officeForm.mail.trim() || null,
          rut: officeForm.rut.trim() || null,
          address: officeForm.address.trim() || null,
          address_number: officeForm.address_number.trim() || null,
          region: officeForm.region,
          comuna: officeForm.comuna,
          phone: officeForm.phone ? Number(officeForm.phone) : null,
        };
        const res = await api.post<CompanyDetail>('/api/users/companies/', payload);
        setProfile((prev) => prev ? { ...prev, companies: [...(prev.companies ?? []), res.data] } : null);
      }
      setShowOfficeForm(false);
      setOfficeForm({
        name: '',
        mail: '',
        rut: '',
        address: '',
        address_number: '',
        region: null,
        comuna: null,
        phone: '',
      });
      setOfficeComunas([]);
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: Record<string, unknown> } }).response?.data : null;
      let detail = '';
      if (res && typeof res === 'object')
        for (const v of Object.values(res))
          if (Array.isArray(v) && v[0]) {
            detail = String(v[0]);
            break;
          }
      setError(detail || 'No se pudo agregar la oficina.');
    } finally {
      setSubmittingOffice(false);
    }
  };

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
      profession: (data.profession ?? []).map((p) => p.id),
      role: data.role_detail?.id ?? '',
    });
  }, []);

  const handleEdit = async () => {
    if (!profile) return;
    await Promise.all([
      fetchRegions(),
      fetchRoles(),
    ]);
    if (profile.region_detail?.id) {
      await fetchComunas(profile.region_detail.id);
    }
    populateForm(profile);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profilePhotoPreviewUrl) URL.revokeObjectURL(profilePhotoPreviewUrl);
    setProfilePhotoFile(null);
    setProfilePhotoPreviewUrl(null);
    if (profile) populateForm(profile);
  };

  const handleFieldChange = (field: keyof FormFields, value: string | number | number[]) => {
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
    if (!profile) return;
    try {
      setSaving(true);
      if (profilePhotoFile) {
        const formData = new FormData();
        formData.append('first_name', form.first_name);
        formData.append('last_name', form.last_name);
        formData.append('rut', form.rut || '');
        formData.append('phone', form.phone ? form.phone : '');
        formData.append('address', form.address || '');
        formData.append('address_number', form.address_number || '');
        formData.append('region', form.region === '' ? '' : String(form.region));
        formData.append('comuna', form.comuna === '' ? '' : String(form.comuna));
        (profile.profession ?? []).forEach((p) => formData.append('profession', String(p.id)));
        const currentRoleId = profile.role_detail?.id ?? form.role;
        if (currentRoleId !== '') formData.append('role', String(currentRoleId));
        formData.append('profile_photo', profilePhotoFile);
        const res = await api.patch('/api/auth/social/user/profile/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setProfile(res.data);
        setProfilePhotoFile(null);
        setProfilePhotoPreviewUrl(null);
      } else {
        const payload: Record<string, unknown> = {
          first_name: form.first_name,
          last_name: form.last_name,
          rut: form.rut || null,
          phone: form.phone ? Number(form.phone) : null,
          address: form.address || null,
          address_number: form.address_number || null,
          region: form.region || null,
          comuna: form.comuna || null,
          profession: (profile.profession ?? []).map((p) => p.id),
          role: (profile.role_detail?.id ?? form.role) === '' ? null : (profile.role_detail?.id ?? form.role),
        };
        const res = await api.patch('/api/auth/social/user/profile/', payload);
        setProfile(res.data);
      }
      setEditing(false);
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
        <Avatar
          className={styles.headerAvatar}
          src={
            profilePhotoPreviewUrl ||
            getProfilePhotoUrl(profile.profile_photo) ||
            undefined
          }
          imgProps={{ loading: 'eager', decoding: 'async' }}
          sx={{
            width: 80,
            height: 80,
            fontSize: '3rem',
            '& img': { objectFit: 'cover' },
          }}
        >
          {!profilePhotoPreviewUrl && !profile.profile_photo &&
            (profile.first_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase())}
        </Avatar>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerName}>
            {profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile.email}
          </h1>
          <p className={styles.headerEmail}>{profile.email}</p>
          {editing && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setProfilePhotoFile(file);
                }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                sx={{ mt: 0.5 }}
              >
                {profile.profile_photo || profilePhotoFile ? 'Cambiar foto' : 'Subir foto'}
              </Button>
            </>
          )}
          <div className={styles.headerMeta}>
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

      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Información Personal" icon={<CalendarIcon />} iconPosition="start" />
        <Tab label="Perfil Profesional" icon={<WorkIcon />} iconPosition="start" />
        <Tab label="Oficina" icon={<BusinessIcon />} iconPosition="start" />
      </Tabs>

      {tabValue === 0 && (
        <>
      {/* Información Personal + Dirección */}
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
        </>
      )}

      {tabValue === 1 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Perfil Profesional</h2>

          <h3 className={styles.subsectionTitle}>
            <SchoolIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />
            Profesiones
          </h3>
          {(profile.profession ?? []).length > 0 ? (
            <div className={styles.professionList}>
              {profile.profession.map((p) => (
                <div key={p.id} className={styles.professionItem}>
                  <SchoolIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <div style={{ flex: 1 }}>
                    <div className={styles.professionName}>{p.profession}</div>
                    <div className={styles.professionUniversity}>
                      {p.university.name} ({p.university.type === 'publica' ? 'Pública' : 'Privada'})
                    </div>
                  </div>
                  {editing && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteProfession(p.id)}
                      className={styles.deleteBtn}
                      title="Eliminar profesión"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyProfessions}>No hay profesiones registradas.</div>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowProfessionForm((v) => !v)}
            sx={{ mt: 1 }}
          >
            {showProfessionForm ? 'Cancelar' : 'Agregar Profesión'}
          </Button>
          <Collapse in={showProfessionForm}>
            <Box className={styles.inlineFormCard} sx={{ mt: 2, p: 2 }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Profesión</InputLabel>
                <Select
                  value={professionForm.profession}
                  label="Profesión"
                  onChange={(e) => setProfessionForm((p) => ({ ...p, profession: e.target.value }))}
                >
                  {PROFESSION_CHOICES.map((opt) => (
                    <MuiMenuItem key={opt} value={opt}>{opt}</MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
              {professionForm.profession === 'Otros' && (
                <TextField
                  fullWidth
                  size="small"
                  label="Especifique la profesión"
                  value={professionForm.professionOther}
                  onChange={(e) => setProfessionForm((p) => ({ ...p, professionOther: e.target.value }))}
                  placeholder="Ej: Ingeniero en Sonido"
                  sx={{ mb: 2 }}
                />
              )}
              <Box sx={{ mb: 2 }}>
                <Autocomplete
                  options={[OTRAS_UNIVERSIDAD_OPTION, ...universities]}
                  getOptionLabel={(opt) =>
                    (opt as UniversityOption & { __crearNueva?: boolean }).__crearNueva
                      ? opt.name
                      : `${opt.name} (${opt.region_name})`
                  }
                  value={
                    professionForm.createNew
                      ? OTRAS_UNIVERSIDAD_OPTION
                      : universities.find((u) => u.id === professionForm.universityId) ?? null
                  }
                  onChange={(_, val) => {
                    const isCrearNueva = val && (val as UniversityOption & { __crearNueva?: boolean }).__crearNueva;
                    setProfessionForm((p) => ({
                      ...p,
                      createNew: !!isCrearNueva,
                      universityId: isCrearNueva ? null : (val?.id ?? null),
                    }));
                  }}
                  renderInput={(params) => <TextField {...params} size="small" label="Universidad" />}
                />
                {professionForm.createNew && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nombre universidad"
                      value={professionForm.universityName}
                      onChange={(e) => setProfessionForm((p) => ({ ...p, universityName: e.target.value }))}
                    />
                    <FormControl fullWidth size="small">
                      <InputLabel>Región</InputLabel>
                      <Select
                        value={professionForm.universityRegion ?? ''}
                        label="Región"
                        onChange={(e) => {
                          const v = e.target.value as number;
                          setProfessionForm((p) => ({ ...p, universityRegion: v || null }));
                        }}
                      >
                        {regions.map((r) => (
                          <MuiMenuItem key={r.id} value={r.id}>{r.region}</MuiMenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo</InputLabel>
                      <Select
                        value={professionForm.universityType}
                        label="Tipo"
                        onChange={(e) => setProfessionForm((p) => ({ ...p, universityType: e.target.value }))}
                      >
                        <MuiMenuItem value="publica">Pública</MuiMenuItem>
                        <MuiMenuItem value="privada">Privada</MuiMenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowProfessionForm(false);
                    setProfessionForm({
                      profession: '',
                      professionOther: '',
                      universityId: null,
                      createNew: false,
                      universityName: '',
                      universityRegion: null,
                      universityType: '',
                    });
                  }}
                  disabled={submittingProfession}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCreateProfession}
                  disabled={submittingProfession}
                >
                  {submittingProfession ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Box>
          </Collapse>

          <h3 className={styles.subsectionTitle} style={{ marginTop: 24 }}>
            <BadgeIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />
            Rol
          </h3>
          {profile.role_detail ? (
            <div className={styles.professionList}>
              <div className={styles.professionItem}>
                <BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <div style={{ flex: 1 }}>
                  <div className={styles.professionName}>{profile.role_detail.role}</div>
                </div>
                {editing && (
                  <IconButton
                    size="small"
                    onClick={handleDeleteRole}
                    className={styles.deleteBtn}
                    title="Eliminar rol"
                    disabled={submittingRole}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyProfessions}>No hay rol asignado.</div>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setShowRoleForm((v) => !v);
              if (!showRoleForm) setRoleFormValue(profile.role_detail?.id ?? '');
            }}
            sx={{ mt: 1 }}
          >
            {showRoleForm ? 'Cancelar' : 'Agregar rol'}
          </Button>
          <Collapse in={showRoleForm}>
            <Box className={styles.inlineFormCard} sx={{ mt: 2, p: 2 }}>
              <FormControl fullWidth size="small" sx={{ maxWidth: 320, mb: 2 }}>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={roleFormValue}
                  label="Rol"
                  onChange={(e) => setRoleFormValue(e.target.value as number | '')}
                >
                  <MuiMenuItem value="">
                    <em>Ninguno</em>
                  </MuiMenuItem>
                  {rolesList.map((r) => (
                    <MuiMenuItem key={r.id} value={r.id}>
                      {r.role}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowRoleForm(false);
                    setRoleFormValue('');
                  }}
                  disabled={submittingRole}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveRole}
                  disabled={submittingRole}
                >
                  {submittingRole ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Box>
          </Collapse>

          <h3 className={styles.subsectionTitle} style={{ marginTop: 24 }}>
            <BadgeIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />
            Patentes
          </h3>
          {(profile.patents ?? []).length > 0 ? (
            <div className={styles.professionList}>
              {profile.patents.map((patent) => (
                <div key={patent.id} className={styles.professionItem}>
                  <div style={{ flex: 1 }}>
                    <div className={styles.professionName}>{patent.name}</div>
                    <div className={styles.professionUniversity}>
                      Nº {patent.number} · {patent.category}
                      {patent.profession_name && ` · ${patent.profession_name}`}
                    </div>
                    {patent.validity_date && (
                      <div className={styles.professionUniversity}>
                        Vigencia: {new Date(patent.validity_date).toLocaleDateString('es-CL')}
                      </div>
                    )}
                    {patent.document && (
                      <a href={getProfilePhotoUrl(patent.document) ?? patent.document} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
                        Ver documento
                      </a>
                    )}
                  </div>
                  {editing && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeletePatent(patent.id)}
                      className={styles.deleteBtn}
                      title="Eliminar patente"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyProfessions}>No hay patentes registradas.</div>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowPatentForm((v) => !v)}
            sx={{ mt: 1 }}
          >
            {showPatentForm ? 'Cancelar' : 'Agregar Patente'}
          </Button>
          <Collapse in={showPatentForm}>
            <Box className={styles.inlineFormCard} sx={{ mt: 2, p: 2 }}>
              <div className={styles.fieldGrid}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nombre"
                  value={patentForm.name}
                  onChange={(e) => setPatentForm((p) => ({ ...p, name: e.target.value }))}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Número"
                  type="number"
                  value={patentForm.number}
                  onChange={(e) => setPatentForm((p) => ({ ...p, number: e.target.value }))}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Categoría"
                  value={patentForm.category}
                  onChange={(e) => setPatentForm((p) => ({ ...p, category: e.target.value }))}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Descripción"
                  value={patentForm.description}
                  onChange={(e) => setPatentForm((p) => ({ ...p, description: e.target.value }))}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Vigencia"
                  type="date"
                  value={patentForm.validity_date}
                  onChange={(e) => setPatentForm((p) => ({ ...p, validity_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Profesión</InputLabel>
                  <Select
                    value={patentForm.profession ?? ''}
                    label="Profesión"
                    onChange={(e) => setPatentForm((p) => ({ ...p, profession: (e.target.value as number) || null }))}
                  >
                    <MuiMenuItem value="">
                      <em>Seleccionar</em>
                    </MuiMenuItem>
                    {(profile.profession ?? []).map((p) => (
                      <MuiMenuItem key={p.id} value={p.id}>
                        {p.profession} – {p.university.name}
                      </MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Región</InputLabel>
                  <Select
                    value={patentForm.region ?? ''}
                    label="Región"
                    onChange={(e) => {
                      const v = e.target.value as number;
                      setPatentForm((p) => ({ ...p, region: v || null, comuna: null }));
                      setPatentComunas([]);
                      if (v) fetchPatentComunas(v);
                    }}
                  >
                    <MuiMenuItem value="">
                      <em>Seleccionar</em>
                    </MuiMenuItem>
                    {regions.map((r) => (
                      <MuiMenuItem key={r.id} value={r.id}>{r.region}</MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Comuna</InputLabel>
                  <Select
                    value={patentForm.comuna ?? ''}
                    label="Comuna"
                    onChange={(e) => setPatentForm((p) => ({ ...p, comuna: (e.target.value as number) || null }))}
                    disabled={!patentForm.region}
                  >
                    <MuiMenuItem value="">
                      <em>Seleccionar</em>
                    </MuiMenuItem>
                    {patentComunas.map((c) => (
                      <MuiMenuItem key={c.id} value={c.id}>{c.comuna}</MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowPatentForm(false);
                    setPatentForm({
                      name: '',
                      number: '',
                      category: '',
                      description: '',
                      validity_date: '',
                      profession: null,
                      region: null,
                      comuna: null,
                    });
                  }}
                  disabled={submittingPatent}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCreatePatent}
                  disabled={submittingPatent}
                >
                  {submittingPatent ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Box>
          </Collapse>
        </div>
      )}

      {tabValue === 2 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Oficina</h2>
          {(profile.companies ?? []).length > 0 ? (
            (profile.companies ?? []).map((company) => (
              <Box key={company.id} className={styles.companyCardHorizontal}>
                <Avatar
                  className={styles.companyCardAvatar}
                  src={getProfilePhotoUrl(company.profile_photo) ?? undefined}
                  imgProps={{ loading: 'eager', decoding: 'async' }}
                  sx={{
                    width: 56,
                    height: 56,
                    fontSize: '1.5rem',
                    flexShrink: 0,
                    '& img': { objectFit: 'cover' },
                  }}
                >
                  {!company.profile_photo && (company.name?.[0]?.toUpperCase() ?? 'O')}
                </Avatar>
                <div className={styles.companyCardBody}>
                  <h3 className={styles.companyCardName}>{company.name}</h3>
                  <div className={styles.companyCardInlineGrid}>
                    <span className={styles.companyCardInlineLabel}>Correo:</span>
                    <span className={styles.companyCardInlineValue}>{company.mail || <span className={styles.emptyValue}>—</span>}</span>
                    <span className={styles.companyCardInlineLabel}>Teléfono:</span>
                    <span className={styles.companyCardInlineValue}>{company.phone != null ? company.phone : <span className={styles.emptyValue}>—</span>}</span>
                    <span className={styles.companyCardInlineLabel}>RUT:</span>
                    <span className={styles.companyCardInlineValue}>{company.rut || <span className={styles.emptyValue}>—</span>}</span>
                    <span className={styles.companyCardInlineLabel}>Dirección:</span>
                    <span className={styles.companyCardInlineValue}>{company.address || <span className={styles.emptyValue}>—</span>}</span>
                    <span className={styles.companyCardInlineLabel}>Número:</span>
                    <span className={styles.companyCardInlineValue}>{company.address_number || <span className={styles.emptyValue}>—</span>}</span>
                    <span className={styles.companyCardInlineLabel}>Región:</span>
                    <span className={styles.companyCardInlineValue}>{company.region_detail?.region || <span className={styles.emptyValue}>—</span>}</span>
                    <span className={styles.companyCardInlineLabel}>Comuna:</span>
                    <span className={styles.companyCardInlineValue}>{company.comuna_detail?.comuna || <span className={styles.emptyValue}>—</span>}</span>
                  </div>
                </div>
                {editing && (
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteCompany(company.id)}
                    className={styles.deleteBtn}
                    title="Eliminar oficina"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))
          ) : (
            <div className={styles.emptyProfessions}>No hay oficina registrada.</div>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowOfficeForm((v) => !v)}
            sx={{ mt: 1 }}
          >
            {showOfficeForm ? 'Cancelar' : 'Agregar oficina'}
          </Button>
          <Collapse in={showOfficeForm}>
            <Box className={styles.inlineFormCard} sx={{ mt: 2, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={officePhotoPreviewUrl ?? undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    fontSize: '2rem',
                    flexShrink: 0,
                    '& img': { objectFit: 'cover' },
                  }}
                >
                  {!officePhotoPreviewUrl && (officeForm.name?.[0]?.toUpperCase() ?? 'O')}
                </Avatar>
                <div>
                  <input
                    type="file"
                    ref={officeFileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setOfficePhotoFile(file);
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => officeFileInputRef.current?.click()}
                  >
                    {officePhotoPreviewUrl ? 'Cambiar imagen' : 'Subir logo / imagen'}
                  </Button>
                </div>
              </Box>
              <div className={styles.fieldGrid}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nombre"
                  value={officeForm.name}
                  onChange={(e) => setOfficeForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Correo"
                  type="email"
                  value={officeForm.mail}
                  onChange={(e) => setOfficeForm((p) => ({ ...p, mail: e.target.value }))}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="RUT"
                  value={officeForm.rut}
                  onChange={(e) => setOfficeForm((p) => ({ ...p, rut: e.target.value }))}
                  placeholder="12.345.678-9"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Teléfono"
                  value={officeForm.phone}
                  onChange={(e) => setOfficeForm((p) => ({ ...p, phone: e.target.value }))}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Dirección"
                  value={officeForm.address}
                  onChange={(e) => setOfficeForm((p) => ({ ...p, address: e.target.value }))}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Número"
                  value={officeForm.address_number}
                  onChange={(e) => setOfficeForm((p) => ({ ...p, address_number: e.target.value }))}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Región</InputLabel>
                  <Select
                    value={officeForm.region ?? ''}
                    label="Región"
                    onChange={(e) => {
                      const v = e.target.value as number;
                      setOfficeForm((p) => ({ ...p, region: v || null, comuna: null }));
                      setOfficeComunas([]);
                      if (v) fetchOfficeComunas(v);
                    }}
                  >
                    <MuiMenuItem value="">
                      <em>Seleccionar</em>
                    </MuiMenuItem>
                    {regions.map((r) => (
                      <MuiMenuItem key={r.id} value={r.id}>{r.region}</MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Comuna</InputLabel>
                  <Select
                    value={officeForm.comuna ?? ''}
                    label="Comuna"
                    onChange={(e) => setOfficeForm((p) => ({ ...p, comuna: (e.target.value as number) || null }))}
                    disabled={!officeForm.region}
                  >
                    <MuiMenuItem value="">
                      <em>Seleccionar</em>
                    </MuiMenuItem>
                    {officeComunas.map((c) => (
                      <MuiMenuItem key={c.id} value={c.id}>{c.comuna}</MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowOfficeForm(false);
                    setOfficeForm({
                      name: '',
                      mail: '',
                      rut: '',
                      address: '',
                      address_number: '',
                      region: null,
                      comuna: null,
                      phone: '',
                    });
                    setOfficeComunas([]);
                    setOfficePhotoFile(null);
                    setOfficePhotoPreviewUrl(null);
                  }}
                  disabled={submittingOffice}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCreateOffice}
                  disabled={submittingOffice}
                >
                  {submittingOffice ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Box>
          </Collapse>
        </div>
      )}
    </div>
  );
};

export default Profile;
