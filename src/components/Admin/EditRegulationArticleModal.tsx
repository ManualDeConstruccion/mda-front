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
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface ArticleDraft {
  id: number;
  code: string;
  article_number: string;
  title?: string;
  content: string;
  effective_from: string;
  effective_to?: string | null;
  is_active: boolean;
  official_publication: number | null;
  section: number | null;
  keywords?: string[];
  related_articles?: string[];
}

interface EditRegulationArticleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  article: ArticleDraft | null;
  officialPublicationId?: number;
  defaultSectionId?: number | null;
}

const EditRegulationArticleModal: React.FC<EditRegulationArticleModalProps> = ({
  open,
  onClose,
  onSuccess,
  article,
  officialPublicationId = 0,
  defaultSectionId,
}) => {
  const { accessToken } = useAuth();
  const [code, setCode] = useState('');
  const [articleNumber, setArticleNumber] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [officialPublication, setOfficialPublication] = useState<number | ''>(officialPublicationId || '');
  const [section, setSection] = useState<number | ''>(defaultSectionId ?? '');

  const isEdit = !!article;

  const { data: fullArticle } = useQuery<ArticleDraft | null>({
    queryKey: ['normative-article', article?.id],
    queryFn: async () => {
      if (!article?.id) return null;
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await axios.get(
        `${API_URL}/api/normative/regulation-articles/${article.id}/`,
        { withCredentials: true, headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
      );
      return res.data;
    },
    enabled: open && !!article?.id && !!accessToken,
  });

  const pubIdForSections = officialPublication || article?.official_publication || officialPublicationId || null;
  const { data: sections = [] } = useQuery<{ id: number; code: string; name: string }[]>({
    queryKey: ['normative-publication-sections', pubIdForSections],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      if (!pubIdForSections) return [];
      const res = await axios.get(
        `${API_URL}/api/normative/publication-sections/?official_publication=${pubIdForSections}`,
        { withCredentials: true, headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
      );
      const raw = res.data?.results ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: open && !!pubIdForSections && !!accessToken,
  });

  useEffect(() => {
    if (open) {
      const src = isEdit && fullArticle ? fullArticle : article;
      if (src) {
        setCode(src.code);
        setArticleNumber(src.article_number);
        setTitle(src.title || '');
        setContent(src.content || '');
        setEffectiveFrom(src.effective_from?.slice(0, 10) || '');
        setEffectiveTo(src.effective_to?.slice(0, 10) || '');
        setOfficialPublication(src.official_publication ?? '');
        setSection(src.section ?? '');
        setIsActive(src.is_active);
      } else {
        setCode('');
        setArticleNumber('');
        setTitle('');
        setContent('');
        setEffectiveFrom('');
        setEffectiveTo('');
        setOfficialPublication(officialPublicationId || '');
        setSection(defaultSectionId ?? '');
        setIsActive(true);
      }
    }
  }, [open, article, fullArticle, isEdit, officialPublicationId, defaultSectionId]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      article_number: string;
      title?: string;
      content: string;
      effective_from: string;
      effective_to?: string | null;
      is_active: boolean;
      official_publication: number | null;
      section?: number | null;
    }) => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await axios.post(`${API_URL}/api/normative/regulation-articles/`, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      return res.data;
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      code?: string;
      article_number?: string;
      title?: string;
      content?: string;
      effective_from?: string;
      effective_to?: string | null;
      is_active?: boolean;
      official_publication?: number | null;
      section?: number | null;
    }) => {
      if (!article) throw new Error('No article');
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await axios.patch(
        `${API_URL}/api/normative/regulation-articles/${article.id}/`,
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
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code,
      article_number: articleNumber,
      title: title || undefined,
      content,
      effective_from: effectiveFrom,
      effective_to: effectiveTo || null,
      is_active: isActive,
      official_publication: officialPublication ? Number(officialPublication) : null,
      section: section ? Number(section) : null,
    };
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending && !updateMutation.isPending) onClose();
  };

  const pending = createMutation.isPending || updateMutation.isPending;
  const err = createMutation.isError || updateMutation.isError;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Editar artículo' : 'Nuevo artículo'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {err && (
              <Alert severity="error">Error al guardar el artículo.</Alert>
            )}
            <TextField
              label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              fullWidth
              helperText="Ej: OGUC_4.2.4_V2024"
              disabled={isEdit}
            />
            <TextField
              label="Número de artículo"
              value={articleNumber}
              onChange={(e) => setArticleNumber(e.target.value)}
              required
              fullWidth
              helperText="Ej: 4.2.4, 116"
            />
            <TextField
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
            <TextField
              label="Contenido"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              fullWidth
              multiline
              rows={6}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Vigente desde"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Vigente hasta"
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Sección</InputLabel>
              <Select
                value={section}
                label="Sección"
                onChange={(e) => setSection(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <MenuItem value="">Sin sección</MenuItem>
                {sections.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
              label="Activo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={pending}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditRegulationArticleModal;
