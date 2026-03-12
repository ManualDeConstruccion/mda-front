import React, { useState, useEffect, useMemo } from 'react';
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
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FormCategoryBlock {
  id: number;
  order: number;
  block_type: 'grid' | 'engine';
  section_engine?: { id: number; code: string; name: string } | null;
  name?: string;
  is_collapsible?: boolean;
}

interface CategoryValidatorOption {
  id: number;
  code: string;
  name: string;
}

interface FormParameterCategory {
  id: number;
  code: string;
  number: string;
  name: string;
  description?: string;
  parent?: number | null;
  is_active: boolean;
  project_type?: number;
  project_type_name?: string | null;
  blocks?: FormCategoryBlock[];
  validators?: CategoryValidatorOption[];
}

interface EditFormParameterCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: FormParameterCategory | null;
  projectTypeId: number;
  parentCategories?: FormParameterCategory[];
  defaultParentId?: number;
}

function SortableBlockRow({
  block,
  displayOrder,
  blockEngineEdits,
  setBlockEngineEdits,
  onDelete,
  isDeleting,
}: {
  block: FormCategoryBlock;
  displayOrder: number;
  blockEngineEdits: Record<number, { name: string; is_collapsible: boolean }>;
  setBlockEngineEdits: React.Dispatch<React.SetStateAction<Record<number, { name: string; is_collapsible: boolean }>>>;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        bgcolor: 'background.paper',
        '&:last-of-type': { mb: 0 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
        <Box
          sx={{
            flexShrink: 0,
            width: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: '0.875rem',
          }}
        >
          {displayOrder}
        </Box>
        <Box
          {...attributes}
          {...listeners}
          sx={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none', pt: 0.5, color: 'action.active' }}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {block.block_type === 'grid' ? (
            <ListItemText primary="Grilla" secondary={`Orden ${displayOrder}`} />
          ) : (
            <>
              <ListItemText secondary={`Orden ${displayOrder} · Motor`} />
              <TextField
                size="small"
                label="Nombre (se muestra al colapsar)"
                value={blockEngineEdits[block.id]?.name ?? ''}
                onChange={(e) =>
                  setBlockEngineEdits((prev) => ({
                    ...prev,
                    [block.id]: {
                      ...(prev[block.id] ?? { name: '', is_collapsible: false }),
                      name: e.target.value,
                    },
                  }))
                }
                fullWidth
                placeholder={block.section_engine?.name ?? block.section_engine?.code ?? ''}
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={blockEngineEdits[block.id]?.is_collapsible ?? false}
                    onChange={(e) =>
                      setBlockEngineEdits((prev) => ({
                        ...prev,
                        [block.id]: {
                          ...(prev[block.id] ?? { name: '', is_collapsible: false }),
                          is_collapsible: e.target.checked,
                        },
                      }))
                    }
                  />
                }
                label="Colapsable en vista de usuario final"
              />
            </>
          )}
        </Box>
        <IconButton
          edge="end"
          size="small"
          onClick={() => window.confirm('¿Eliminar este bloque?') && onDelete()}
          disabled={isDeleting}
          sx={{ flexShrink: 0 }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </ListItem>
  );
}

const EditFormParameterCategoryModal: React.FC<EditFormParameterCategoryModalProps> = ({
  open,
  onClose,
  onSuccess,
  category,
  projectTypeId,
  parentCategories = [],
  defaultParentId,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type ModalMode = 'create' | 'copy';
  const [mode, setMode] = useState<ModalMode>('create');
  const [selectedSourceCategory, setSelectedSourceCategory] = useState<FormParameterCategory | null>(null);
  const [targetParentId, setTargetParentId] = useState<number | null>(null);

  const isNewSection = !category && !defaultParentId;
  const isSubsection = selectedSourceCategory?.parent != null;
  const initialSortedBlocks = useMemo(
    () => (category?.blocks ?? []).slice().sort((a, b) => a.order - b.order),
    [category?.blocks]
  );

  const [orderedBlocks, setOrderedBlocks] = useState<FormCategoryBlock[]>([]);
  useEffect(() => {
    if (category?.blocks && open) {
      setOrderedBlocks(initialSortedBlocks);
    }
  }, [category?.id, open, initialSortedBlocks]);

  const [assignedValidators, setAssignedValidators] = useState<CategoryValidatorOption[]>([]);
  const [validatorSearch, setValidatorSearch] = useState('');
  // Sincronizar validadores con la categoría al abrir o al cambiar de categoría (persistencia al reabrir)
  useEffect(() => {
    if (!open) return;
    const raw = category?.validators;
    const list = Array.isArray(raw)
      ? raw
          .filter((v): v is CategoryValidatorOption => v != null && typeof v === 'object' && 'id' in v)
          .map((v) => ({ id: v.id, code: v.code ?? '', name: v.name ?? v.code ?? '' }))
      : [];
    setAssignedValidators(list);
  }, [open, category?.id, category?.validators]);

  const [blockEngineEdits, setBlockEngineEdits] = useState<Record<number, { name: string; is_collapsible: boolean }>>({});
  useEffect(() => {
    if (!category?.blocks) {
      setBlockEngineEdits({});
      return;
    }
    const edits: Record<number, { name: string; is_collapsible: boolean }> = {};
    category.blocks.forEach((b) => {
      if (b.block_type === 'engine') {
        edits[b.id] = { name: b.name ?? '', is_collapsible: b.is_collapsible ?? false };
      }
    });
    setBlockEngineEdits(edits);
  }, [category?.id, open, category?.blocks]);

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

  const { data: validatorOptions = [], isLoading: loadingValidators } = useQuery({
    queryKey: ['category-validators', validatorSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (validatorSearch.trim()) params.set('search', validatorSearch.trim());
      const url = params.toString()
        ? `${API_URL}/api/parameters/category-validators/?${params.toString()}`
        : `${API_URL}/api/parameters/category-validators/`;
      const res = await axios.get(url, {
        headers: { Authorization: accessToken ? `Bearer ${accessToken}` : undefined },
        withCredentials: true,
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      return list as CategoryValidatorOption[];
    },
    enabled: open,
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
    setValidatorSearch('');
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
    } else {
      setCode('');
      setNumber('');
      setName('');
      setDescription('');
      setParent(defaultParentId || null);
      setIsActive(true);
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
    onError: (err: any) => {
      setError(err.response?.data?.code?.[0] || err.response?.data?.detail || 'Error al guardar');
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: number) => {
      await axios.delete(`${API_URL}/api/parameters/form-category-blocks/${blockId}/`, {
        withCredentials: true,
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Error al eliminar bloque');
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleBlocksDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && orderedBlocks.length > 0) {
      const oldIndex = orderedBlocks.findIndex((b) => b.id === active.id);
      const newIndex = orderedBlocks.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setOrderedBlocks((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSubmit = async () => {
    setError(null);
    if (!code.trim() || !number.trim() || !name.trim()) {
      setError('Código, número y nombre son requeridos');
      return;
    }

    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        code: code.trim(),
        number: number.trim(),
        name: name.trim(),
        description: description.trim() || '',
        parent: parent || null,
        is_active: isActive,
        validators: assignedValidators.map((v) => v.id),
      });
      for (const [blockIdStr, data] of Object.entries(blockEngineEdits)) {
        await axios.patch(
          `${API_URL}/api/parameters/form-category-blocks/${blockIdStr}/`,
          { name: data.name, is_collapsible: data.is_collapsible },
          { withCredentials: true, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` } }
        );
      }
      if (orderedBlocks.length > 0) {
        const blockIds = orderedBlocks.map((b) => b.id);
        await axios.post(
          `${API_URL}/api/parameters/form-category-blocks/reorder/`,
          { block_ids: blockIds },
          { withCredentials: true, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` } }
        );
      }
      queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.code?.[0] || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
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
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                native: true,
                sx: {
                  '& select': {
                    minHeight: 48,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                },
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

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Validadores</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Asignados a esta sección. Quita con la X del chip; agrega buscando abajo. Se guardan al pulsar Guardar.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {assignedValidators.map((v) => (
                <Chip
                  key={v.id}
                  label={v.name || v.code}
                  size="small"
                  onDelete={() =>
                    setAssignedValidators((prev) => prev.filter((x) => x.id !== v.id))
                  }
                />
              ))}
            </Box>
            <Autocomplete
              options={validatorOptions.filter(
                (opt) => !assignedValidators.some((a) => a.id === opt.id)
              )}
              getOptionLabel={(opt) => opt.name || opt.code || ''}
              value={null}
              onChange={(_, newValue: CategoryValidatorOption | null) => {
                if (newValue && !assignedValidators.some((a) => a.id === newValue.id)) {
                  setAssignedValidators((prev) => [...prev, newValue]);
                }
              }}
              inputValue={validatorSearch}
              onInputChange={(_, value) => setValidatorSearch(value)}
              loading={loadingValidators}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="Buscar y agregar validador..."
                  label="Agregar validador"
                />
              )}
            />
          </Box>

          {category && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Bloques de la sección</Typography>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleBlocksDragEnd}
              >
                <SortableContext
                  items={orderedBlocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <List dense disablePadding sx={{ mb: 1 }}>
                    {orderedBlocks.map((b, index) => (
                      <SortableBlockRow
                        key={b.id}
                        block={b}
                        displayOrder={index + 1}
                        blockEngineEdits={blockEngineEdits}
                        setBlockEngineEdits={setBlockEngineEdits}
                        onDelete={() => deleteBlockMutation.mutate(b.id)}
                        isDeleting={deleteBlockMutation.isPending}
                      />
                    ))}
                  </List>
                </SortableContext>
              </DndContext>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Arrastra los bloques para cambiar el orden. Para agregar bloques (grilla o motor), usa el botón «Agregar bloque debajo» bajo cada bloque en el árbol de secciones.
              </Typography>
            </Box>
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
              disabled={isSaving || updateMutation.isPending}
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EditFormParameterCategoryModal;
