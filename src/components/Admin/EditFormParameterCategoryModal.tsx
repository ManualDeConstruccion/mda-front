import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Autocomplete,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useFormTypes } from '../../hooks/useFormTypes';
import type { FormType } from '../../types/formParameters.types';

interface FormParameterCategory {
  id: number;
  code: string;
  number: string;
  name: string;
  description?: string;
  parent?: number | null;
  is_active: boolean;
  form_type?: number | FormType | null;
  form_type_name?: string | null;
  project_type?: number;
  project_type_name?: string | null;
}

interface EditFormParameterCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: FormParameterCategory | null;
  projectTypeId: number;
  parentCategories?: FormParameterCategory[];
  defaultParentId?: number; // ID de la categoría padre por defecto (para crear subcategorías)
  blockFormTypeChange?: boolean; // Bloquear cambio de form_type si ya tiene uno
}

const EditFormParameterCategoryModal: React.FC<EditFormParameterCategoryModalProps> = ({
  open,
  onClose,
  onSuccess,
  category,
  projectTypeId,
  parentCategories = [],
  defaultParentId,
  blockFormTypeChange = false,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [formType, setFormType] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { formTypes } = useFormTypes({ enabled: open });
  type ModalMode = 'create' | 'copy';
  const [mode, setMode] = useState<ModalMode>('create');
  const [selectedSourceCategory, setSelectedSourceCategory] = useState<FormParameterCategory | null>(null);
  const [targetParentId, setTargetParentId] = useState<number | null>(null);

  const isNewSection = !category && !defaultParentId;
  const isSubsection = selectedSourceCategory?.parent != null;

  // Categorías de otros tipos de proyecto para copiar (solo cuando modo copia y modal abierto)
  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const { data: categoriesForCopy = [], isLoading: loadingCategoriesForCopy } = useQuery({
    queryKey: ['form-parameter-categories-for-copy', projectTypeId],
    queryFn: async () => {
      const res = await axios.get(
        `${API_URL}/api/parameters/form-parameter-categories/?exclude_project_type=${projectTypeId}`,
        {
          headers: { Authorization: accessToken ? `Bearer ${accessToken}` : undefined },
          withCredentials: true,
        }
      );
      const list = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      return list;
    },
    enabled: open && mode === 'copy' && isNewSection && !!projectTypeId,
  });

  const copyMutation = useMutation({
    mutationFn: async (payload: { sourceId: number; targetParentId: number | null; isSub: boolean }) => {
      const body: { target_project_type_id: number; target_parent_id?: number | null } = {
        target_project_type_id: projectTypeId,
      };
      if (payload.isSub) body.target_parent_id = payload.targetParentId ?? null;
      const res = await axios.post(
        `${API_URL}/api/parameters/form-parameter-categories/${payload.sourceId}/copy/`,
        body,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
      onSuccess();
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Error al copiar la sección.');
    },
  });

  const handleCopySelect = () => {
    if (!selectedSourceCategory) return;
    setError(null);
    copyMutation.mutate({
      sourceId: selectedSourceCategory.id,
      targetParentId: isSubsection ? targetParentId : null,
      isSub: isSubsection,
    });
  };

  const handleClose = () => {
    setMode('create');
    setSelectedSourceCategory(null);
    setTargetParentId(null);
    setError(null);
    copyMutation.reset();
    onClose();
  };

  useEffect(() => {
    if (category) {
      setCode(category.code);
      setNumber(category.number);
      setName(category.name);
      setDescription(category.description || '');
      setParent(category.parent || null);
      setIsActive(category.is_active);
      // Establecer form_type
      if (category.form_type) {
        const formTypeId = typeof category.form_type === 'object' ? category.form_type.id : category.form_type;
        setFormType(formTypeId);
      } else {
        setFormType(null);
      }
    } else {
      // Reset para crear nuevo
      setCode('');
      setNumber('');
      setName('');
      setDescription('');
      setParent(defaultParentId || null); // Usar defaultParentId si está disponible
      setIsActive(true);
      setFormType(null);
    }
  }, [category, open, defaultParentId]);

  useEffect(() => {
    if (open && isNewSection) setMode('create');
  }, [open, isNewSection]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (category) {
        const response = await axios.patch(
          `${API_URL}/api/parameters/form-parameter-categories/${category.id}/`,
          data,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
        return response.data;
      } else {
        const response = await axios.post(
          `${API_URL}/api/parameters/form-parameter-categories/`,
          { ...data, project_type: projectTypeId },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
      onSuccess();
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.code?.[0] || err.response?.data?.detail || 'Error al guardar');
    },
  });

  const handleSubmit = () => {
    setError(null);
    if (!code.trim() || !number.trim() || !name.trim()) {
      setError('Código, número y nombre son requeridos');
      return;
    }

    const mutationData: any = {
      code: code.trim(),
      number: number.trim(),
      name: name.trim(),
      description: description.trim() || '',
      parent: parent || null,
      is_active: isActive,
    };
    
    // Solo incluir form_type si no está bloqueado o si es una nueva categoría
    if (!blockFormTypeChange || !category) {
      if (formType) {
        mutationData.form_type = formType;
      }
    }

    updateMutation.mutate(mutationData);
  };

  // Filtrar categorías padre válidas (excluir la actual y sus descendientes)
  const validParents = parentCategories.filter(
    (cat) => cat.id !== category?.id
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <span>
          {category ? 'Editar Sección' : defaultParentId ? 'Nueva Subsección' : mode === 'copy' ? 'Copiar sección' : 'Nueva Sección'}
        </span>
        {isNewSection && mode === 'create' && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={() => setMode('copy')}
          >
            Copiar sección
          </Button>
        )}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {mode === 'copy' && isNewSection ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Elige una sección o subsección de otro tipo de proyecto. Se copiará completa (parámetros, grillas, subsecciones) en el tipo actual.
            </Typography>
            <Autocomplete
              options={categoriesForCopy}
              getOptionLabel={(opt) => {
                const pt = opt.project_type_name || `Tipo #${opt.project_type}`;
                const sub = opt.parent != null ? ' — subsección' : '';
                return `${opt.number} - ${opt.name} (${pt})${sub}`;
              }}
              value={selectedSourceCategory}
              onChange={(_, v) => { setSelectedSourceCategory(v); setTargetParentId(null); setError(null); }}
              loading={loadingCategoriesForCopy}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sección a copiar"
                  placeholder="Buscar por número, nombre o tipo..."
                  helperText="Secciones y subsecciones de otros tipos de proyecto"
                />
              )}
            />
            {isSubsection && (
              <FormControl fullWidth size="small">
                <InputLabel>Copiar como subsección de</InputLabel>
                <Select
                  value={targetParentId ?? ''}
                  label="Copiar como subsección de"
                  onChange={(e) => setTargetParentId(e.target.value === '' ? null : Number(e.target.value))}
                >
                  <MenuItem value="">
                    <em>Como sección raíz</em>
                  </MenuItem>
                  {parentCategories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.number} - {cat.name}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Elige dónde colocar la subsección en el tipo actual, o como raíz.
                </Typography>
              </FormControl>
            )}
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => { setMode('create'); setSelectedSourceCategory(null); setTargetParentId(null); setError(null); }}
              sx={{ alignSelf: 'flex-start' }}
            >
              Volver a crear desde cero
            </Button>
          </Box>
        ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            fullWidth
            helperText="Código único dentro del tipo de proyecto"
          />

          <TextField
            label="Número"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
            fullWidth
            helperText="Numeración según formulario MINVU (ej: '5', '6.1', '7.1')"
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
            multiline
            rows={3}
            fullWidth
          />

          {validParents.length > 0 && (
            <TextField
              select
              label="Sección Padre"
              value={parent || ''}
              onChange={(e) => setParent(e.target.value ? Number(e.target.value) : null)}
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Ninguna (Sección raíz)</option>
              {validParents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.number} - {cat.name}
                </option>
              ))}
            </TextField>
          )}

          {/* Selector de tipo de formulario (solo si no está bloqueado o es nueva categoría) */}
          {(!blockFormTypeChange || !category) && (
            <FormControl fullWidth>
              <InputLabel>Tipo de Formulario</InputLabel>
              <Select
                value={formType || ''}
                label="Tipo de Formulario"
                onChange={(e) => setFormType(e.target.value ? Number(e.target.value) : null)}
                disabled={blockFormTypeChange && !!category}
              >
                <MenuItem value="">
                  <em>Ninguno (usar grilla por defecto)</em>
                </MenuItem>
                {formTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
              {blockFormTypeChange && category && (
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    El tipo no puede cambiarse una vez establecido
                  </Typography>
                </Box>
              )}
            </FormControl>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            }
            label="Activa"
          />
        </Box>
        )}
      </DialogContent>
      <DialogActions>
        {mode === 'copy' && isNewSection ? (
          <>
            <Button onClick={() => { setMode('create'); setSelectedSourceCategory(null); setTargetParentId(null); setError(null); }}>
              Volver
            </Button>
            <Button
              variant="contained"
              onClick={handleCopySelect}
              disabled={!selectedSourceCategory || copyMutation.isPending}
              startIcon={<ContentCopyIcon />}
            >
              {copyMutation.isPending ? 'Copiando...' : 'Copiar sección'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EditFormParameterCategoryModal;
