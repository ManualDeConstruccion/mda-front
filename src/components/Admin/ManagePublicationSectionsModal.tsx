import React, { useState, useEffect, useMemo } from 'react';
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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Divider,
  Stack,
  Collapse,
  Chip,
  Paper,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';

interface PublicationSection {
  id: number;
  code: string;
  name: string;
  description?: string;
  section_number?: string;
  parent?: number | null;
  is_active: boolean;
  official_publication: number;
  subsections?: PublicationSection[];
}

interface ManagePublicationSectionsModalProps {
  open: boolean;
  onClose: () => void;
  publicationId: number;
}

const ManagePublicationSectionsModal: React.FC<ManagePublicationSectionsModalProps> = ({
  open,
  onClose,
  publicationId,
}) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<PublicationSection | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sectionNumber, setSectionNumber] = useState('');
  const [parent, setParent] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  const { data: sections = [] } = useQuery<PublicationSection[]>({
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

  // Construir árbol jerárquico de secciones
  const sectionTree = useMemo(() => {
    const sectionMap = new Map<number, PublicationSection & { subsections: PublicationSection[] }>();
    const rootSections: (PublicationSection & { subsections: PublicationSection[] })[] = [];

    // Crear mapa de todas las secciones
    sections.forEach((section) => {
      sectionMap.set(section.id, { ...section, subsections: [] });
    });

    // Construir árbol
    sections.forEach((section) => {
      const sectionWithSubs = sectionMap.get(section.id)!;
      if (section.parent && sectionMap.has(section.parent)) {
        const parentSection = sectionMap.get(section.parent)!;
        parentSection.subsections.push(sectionWithSubs);
      } else {
        rootSections.push(sectionWithSubs);
      }
    });

    // Función para ordenar por section_number de forma jerárquica
    const sectionNumberSortKey = (sectionNumber: string | undefined): (number | string)[] => {
      if (!sectionNumber) return [999999];
      const parts = sectionNumber.trim().split('.');
      try {
        // Si todos los partes son números, retornar tupla de enteros
        return parts.map(p => parseInt(p.trim()));
      } catch {
        // Si hay partes no numéricas, usar ordenamiento alfabético al final
        return [999999, sectionNumber];
      }
    };

    // Ordenar por section_number jerárquico
    const sortSections = (sections: (PublicationSection & { subsections: PublicationSection[] })[]) => {
      sections.sort((a, b) => {
        const keyA = sectionNumberSortKey(a.section_number);
        const keyB = sectionNumberSortKey(b.section_number);
        
        // Comparar tuplas elemento por elemento
        for (let i = 0; i < Math.max(keyA.length, keyB.length); i++) {
          const valA = keyA[i] ?? 0;
          const valB = keyB[i] ?? 0;
          if (valA < valB) return -1;
          if (valA > valB) return 1;
        }
        
        // Si los section_number son iguales, ordenar por nombre
        return a.name.localeCompare(b.name);
      });
      sections.forEach((s) => {
        if (s.subsections.length > 0) {
          sortSections(s.subsections);
        }
      });
    };

    sortSections(rootSections);
    return rootSections;
  }, [sections]);

  useEffect(() => {
    if (open && !editingSection) {
      setCode('');
      setName('');
      setDescription('');
      setSectionNumber('');
      setParent('');
      setIsActive(true);
    }
  }, [open, editingSection]);

  useEffect(() => {
    if (editingSection) {
      setCode(editingSection.code);
      setName(editingSection.name);
      setDescription(editingSection.description || '');
      setSectionNumber(editingSection.section_number || '');
      setParent(editingSection.parent ?? '');
      setIsActive(editingSection.is_active);
    }
  }, [editingSection]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      description?: string;
      section_number?: string;
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
      queryClient.invalidateQueries({ queryKey: ['normative-publication-sections', publicationId] });
      setEditingSection(null);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      description?: string;
      section_number?: string;
      parent?: number | null;
      is_active: boolean;
    }) => {
      if (!editingSection?.id) throw new Error('No section to update');
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await axios.patch(
        `${API_URL}/api/normative/publication-sections/${editingSection.id}/`,
        data,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['normative-publication-sections', publicationId] });
      setEditingSection(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setSectionNumber('');
    setParent('');
    setIsActive(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      code,
      name,
      description: description || undefined,
      section_number: sectionNumber || undefined,
      official_publication: publicationId,
      parent: parent ? Number(parent) : null,
      is_active: isActive,
    };

    if (editingSection) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (section: PublicationSection) => {
    setEditingSection(section);
  };

  const handleNew = () => {
    setEditingSection(null);
    resetForm();
  };

  const toggleExpand = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderSection = (section: PublicationSection & { subsections: PublicationSection[] }, level: number = 0) => {
    const hasSubsections = section.subsections.length > 0;
    const isExpanded = expandedSections.has(section.id);
    const indent = level * 24;

    return (
      <React.Fragment key={section.id}>
        <ListItem
          sx={{
            pl: `${indent + 2}px`,
            borderLeft: level > 0 ? '2px solid' : 'none',
            borderColor: 'divider',
            bgcolor: editingSection?.id === section.id ? 'action.selected' : 'transparent',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            {hasSubsections && (
              <IconButton size="small" onClick={() => toggleExpand(section.id)}>
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
            {!hasSubsections && <Box sx={{ width: 40 }} />}
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight="medium">
                    {section.section_number && `${section.section_number}. `}
                    {section.name}
                  </Typography>
                  {!section.is_active && (
                    <Chip label="Inactiva" size="small" color="default" variant="outlined" />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {section.code}
                  </Typography>
                  {section.description && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {section.description}
                    </Typography>
                  )}
                </Box>
              }
            />
          </Box>
          <ListItemSecondaryAction>
            <IconButton edge="end" size="small" onClick={() => handleEdit(section)} color="primary">
              <EditIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
        {hasSubsections && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {section.subsections.map((sub) => renderSection(sub, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const getAvailableParents = (excludeId?: number): PublicationSection[] => {
    const flatten = (sections: (PublicationSection & { subsections: PublicationSection[] })[]): PublicationSection[] => {
      const result: PublicationSection[] = [];
      sections.forEach((section) => {
        if (section.id !== excludeId) {
          result.push(section);
          if (section.subsections.length > 0) {
            result.push(...flatten(section.subsections));
          }
        }
      });
      return result;
    };
    return flatten(sectionTree);
  };

  const pending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.isError || updateMutation.isError;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Gestionar Secciones</Typography>
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
              size="small"
              disabled={pending}
            >
              Nueva Sección
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          {/* Lista de secciones */}
          <Box sx={{ flex: 1, minWidth: 400 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Secciones ({sectionTree.length})
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
              <List>
                {sectionTree.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="No hay secciones"
                      secondary="Crea una nueva sección para comenzar"
                    />
                  </ListItem>
                ) : (
                  sectionTree.map((section) => renderSection(section))
                )}
              </List>
            </Paper>
          </Box>

          {/* Formulario de edición/creación */}
          <Box sx={{ flex: 1, minWidth: 400 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {editingSection ? 'Editar Sección' : 'Nueva Sección'}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {(error || (!editingSection && sectionTree.length === 0)) && (
                <Alert severity={error ? 'error' : 'info'} sx={{ mb: 2 }}>
                  {error ? 'Error al guardar la sección.' : 'Crea la primera sección para comenzar'}
                </Alert>
              )}

              <Stack spacing={2}>
                  <TextField
                    label="Código"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    fullWidth
                    helperText="Ej: OGUC_CAP_4"
                    disabled={!!editingSection}
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
                      {getAvailableParents(editingSection?.id).map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.section_number ? `${s.section_number}. ` : ''}
                          {s.name} ({s.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                    label="Activa"
                  />
              </Stack>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose} disabled={pending}>
            Cerrar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={pending || !code.trim() || !name.trim()}
          >
            {pending ? 'Guardando...' : editingSection ? 'Guardar Cambios' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ManagePublicationSectionsModal;
