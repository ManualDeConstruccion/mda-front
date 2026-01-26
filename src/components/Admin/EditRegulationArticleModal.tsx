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
  Tabs,
  Tab,
  Typography,
  Divider,
  Autocomplete,
  Chip,
  Stack,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface ArticleDraft {
  id?: number;
  code: string;
  article_number: string;
  title?: string;
  content: string;
  effective_from: string;
  effective_to?: string | null;
  is_active: boolean;
  official_publication: number | null;
  section: number | null;
  keywords?: string[] | unknown;
  related_articles?: string[] | unknown;
  parsed_tables?: Record<string, unknown> | unknown;
  parsed_rules?: Record<string, unknown> | unknown;
  parent_article?: number | null;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface EditRegulationArticleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  article: ArticleDraft | null;
  officialPublicationId?: number;
  defaultSectionId?: number | null;
}

const jsonArrayToString = (v: unknown): string => {
  if (v == null) return '';
  if (Array.isArray(v)) return JSON.stringify(v, null, 2);
  if (typeof v === 'string') {
    try {
      return JSON.stringify(JSON.parse(v), null, 2);
    } catch {
      return v;
    }
  }
  return JSON.stringify(v, null, 2);
};

const jsonObjectToString = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'object' && !Array.isArray(v)) return JSON.stringify(v, null, 2);
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return typeof p === 'object' && p !== null ? JSON.stringify(p, null, 2) : '{}';
    } catch {
      return v || '{}';
    }
  }
  return '';
};

const EditRegulationArticleModal: React.FC<EditRegulationArticleModalProps> = ({
  open,
  onClose,
  onSuccess,
  article,
  officialPublicationId = 0,
  defaultSectionId,
}) => {
  const { accessToken } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [code, setCode] = useState('');
  const [articleNumber, setArticleNumber] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [officialPublication, setOfficialPublication] = useState<number | ''>(officialPublicationId || '');
  const [section, setSection] = useState<number | ''>(defaultSectionId ?? '');
  const [parentArticle, setParentArticle] = useState<number | ''>('');
  const [keywords, setKeywords] = useState('');
  const [selectedRelatedCodes, setSelectedRelatedCodes] = useState<string[]>([]);
  const [manualRelatedCode, setManualRelatedCode] = useState('');
  const [parsedTables, setParsedTables] = useState('');
  const [parsedRules, setParsedRules] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const isEdit = !!article?.id;

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

  const { data: articlesForParent = [] } = useQuery<{ id: number; code: string; article_number: string }[]>({
    queryKey: ['normative-articles-for-parent', pubIdForSections],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      if (!pubIdForSections) return [];
      const res = await axios.get(
        `${API_URL}/api/normative/regulation-articles/?official_publication=${pubIdForSections}`,
        { withCredentials: true, headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
      );
      const raw = res.data?.results ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: open && !!pubIdForSections && !!accessToken,
  });

  const { data: allArticlesForRelated = [] } = useQuery<
    { id: number; code: string; article_number: string; title?: string }[]
  >({
    queryKey: ['normative-articles-all-related'],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const res = await axios.get(`${API_URL}/api/normative/regulation-articles/`, {
        withCredentials: true,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const raw = res.data?.results ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: open && !!accessToken,
  });

  useEffect(() => {
    if (open) {
      const src = isEdit && fullArticle ? fullArticle : article;
      if (src) {
        setCode(src.code ?? '');
        setArticleNumber(src.article_number ?? '');
        setTitle(src.title ?? '');
        setContent(src.content ?? '');
        setEffectiveFrom(src.effective_from?.slice(0, 10) ?? '');
        setEffectiveTo(src.effective_to?.slice(0, 10) ?? '');
        setOfficialPublication(src.official_publication ?? '');
        setSection(src.section ?? '');
        setParentArticle(src.parent_article ?? '');
        setKeywords(jsonArrayToString(src.keywords));
        const ra = src.related_articles;
        const codes = Array.isArray(ra)
          ? (ra as unknown[]).map((x) => (typeof x === 'string' ? x : String(x)))
          : [];
        setSelectedRelatedCodes(codes);
        setManualRelatedCode('');
        setParsedTables(jsonObjectToString(src.parsed_tables));
        setParsedRules(jsonObjectToString(src.parsed_rules));
        setIsActive(src.is_active ?? true);
      } else {
        setCode('');
        setArticleNumber('');
        setTitle('');
        setContent('');
        setEffectiveFrom('');
        setEffectiveTo('');
        setOfficialPublication(officialPublicationId || '');
        setSection(defaultSectionId ?? '');
        setParentArticle('');
        setKeywords('');
        setSelectedRelatedCodes([]);
        setManualRelatedCode('');
        setParsedTables('{}');
        setParsedRules('{}');
        setIsActive(true);
      }
      setJsonError(null);
      setTabValue(0);
    }
  }, [open, article, fullArticle, isEdit, officialPublicationId, defaultSectionId]);

  const parseJsonArray = (s: string): unknown[] | null => {
    if (!s.trim()) return [];
    try {
      const v = JSON.parse(s);
      return Array.isArray(v) ? v : null;
    } catch {
      return null;
    }
  };

  const parseJsonObject = (s: string): Record<string, unknown> | null => {
    if (!s.trim()) return {};
    try {
      const v = JSON.parse(s);
      return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null;
    } catch {
      return null;
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
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
    onSuccess: () => onSuccess(),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (!article?.id) throw new Error('No article');
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
    onSuccess: () => onSuccess(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError(null);

    const kw = parseJsonArray(keywords);
    const pt = parseJsonObject(parsedTables);
    const pr = parseJsonObject(parsedRules);

    if (keywords.trim() && kw === null) {
      setJsonError('Palabras clave: JSON debe ser un array válido (ej. ["a", "b"])');
      setTabValue(2);
      return;
    }
    if (parsedTables.trim() && pt === null) {
      setJsonError('Tablas parseadas: JSON debe ser un objeto válido (ej. {"nombre_tabla": []})');
      setTabValue(3);
      return;
    }
    if (parsedRules.trim() && pr === null) {
      setJsonError('Reglas de cálculo: JSON debe ser un objeto válido');
      setTabValue(3);
      return;
    }

    const payload: Record<string, unknown> = {
      code,
      article_number: articleNumber,
      title: title || undefined,
      content,
      effective_from: effectiveFrom,
      effective_to: effectiveTo || null,
      is_active: isActive,
      official_publication: officialPublication ? Number(officialPublication) : null,
      section: section ? Number(section) : null,
      parent_article: parentArticle ? Number(parentArticle) : null,
      keywords: kw ?? [],
      related_articles: selectedRelatedCodes,
      parsed_tables: pt ?? {},
      parsed_rules: pr ?? {},
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
  const parentOptions = articlesForParent.filter((a) => a.id !== article?.id);

  const relatedArticleOptions = allArticlesForRelated.filter(
    (a) => a.code !== code && !selectedRelatedCodes.includes(a.code)
  );

  const addRelatedByCode = (newCode: string) => {
    const c = newCode.trim();
    if (c && !selectedRelatedCodes.includes(c)) {
      setSelectedRelatedCodes([...selectedRelatedCodes, c]);
    }
  };

  const removeRelatedCode = (c: string) => {
    setSelectedRelatedCodes(selectedRelatedCodes.filter((x) => x !== c));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Editar artículo' : 'Nuevo artículo'}</DialogTitle>
        <DialogContent sx={{ minHeight: 480 }}>
          {(err || jsonError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {jsonError || 'Error al guardar el artículo.'}
            </Alert>
          )}

          <Tabs value={tabValue} onChange={(_, v) => { setTabValue(v); setJsonError(null); }} sx={{ mb: 2 }}>
            <Tab label="Información básica" />
            <Tab label="Vigencia" />
            <Tab label="Búsqueda y relaciones" />
            <Tab label="Tablas y reglas" />
          </Tabs>

          {/* Tab 1: Información básica */}
          {tabValue === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                helperText="Título opcional del artículo"
              />
              <TextField
                label="Contenido"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                fullWidth
                multiline
                rows={6}
                helperText="Texto completo del artículo"
              />
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
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                  Capítulo o sección del documento donde se encuentra este artículo
                </Typography>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Artículo padre</InputLabel>
                <Select
                  value={parentArticle}
                  label="Artículo padre"
                  onChange={(e) => setParentArticle(e.target.value === '' ? '' : Number(e.target.value))}
                >
                  <MenuItem value="">Ninguno</MenuItem>
                  {parentOptions.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.code} — Art. {a.article_number}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                  Para sub-secciones o artículos jerárquicos
                </Typography>
              </FormControl>
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                label="Activo"
              />
              {isEdit && fullArticle && (fullArticle.created_at || fullArticle.updated_at) && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    {fullArticle.updated_at && `Actualizado: ${fullArticle.updated_at.slice(0, 19).replace('T', ' ')}`}
                    {fullArticle.created_at && fullArticle.updated_at !== fullArticle.created_at && (
                      <> · Creado: {fullArticle.created_at.slice(0, 19).replace('T', ' ')}</>
                    )}
                  </Typography>
                </>
              )}
            </Box>
          )}

          {/* Tab 2: Vigencia */}
          {tabValue === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Periodo de vigencia</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Fechas entre las cuales este artículo está o estuvo vigente.
              </Typography>
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
                helperText="Dejar vacío si sigue vigente"
              />
            </Box>
          )}

          {/* Tab 3: Búsqueda y relaciones */}
          {tabValue === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Palabras clave</Typography>
              <TextField
                label="Keywords (JSON array)"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder='["carga_ocupacion", "resistencia_fuego"]'
                helperText='Lista de keywords para búsqueda. Formato: ["a", "b"]'
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>Artículos relacionados</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Busca y agrega artículos relacionados por código, número o título. También puedes añadir un código manualmente si no figura en el listado.
              </Typography>
              <Autocomplete
                options={relatedArticleOptions}
                getOptionLabel={(opt) =>
                  `${opt.code} — Art. ${opt.article_number}${opt.title ? ` · ${opt.title.slice(0, 40)}${opt.title.length > 40 ? '…' : ''}` : ''}`
                }
                filterOptions={(opts, { inputValue }) => {
                  const q = inputValue.trim().toLowerCase();
                  if (!q) return opts;
                  return opts.filter(
                    (o) =>
                      o.code.toLowerCase().includes(q) ||
                      (o.article_number && o.article_number.toLowerCase().includes(q)) ||
                      (o.title && o.title.toLowerCase().includes(q))
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar artículo"
                    placeholder="Código, número o título..."
                  />
                )}
                onChange={(_, val) => {
                  if (val?.code) addRelatedByCode(val.code);
                }}
                value={null}
                isOptionEqualToValue={() => false}
                fullWidth
                size="small"
              />
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  placeholder="Código manual (ej. OGUC_4.2.5)"
                  value={manualRelatedCode}
                  onChange={(e) => setManualRelatedCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRelatedByCode(manualRelatedCode);
                      setManualRelatedCode('');
                    }
                  }}
                  sx={{ width: 260 }}
                />
                <Button
                  type="button"
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    addRelatedByCode(manualRelatedCode);
                    setManualRelatedCode('');
                  }}
                >
                  Añadir código
                </Button>
              </Stack>
              {selectedRelatedCodes.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Relacionados ({selectedRelatedCodes.length}):
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {selectedRelatedCodes.map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        onDelete={() => removeRelatedCode(c)}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          )}

          {/* Tab 4: Tablas y reglas */}
          {tabValue === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Tablas parseadas</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tablas extraídas del artículo para motores de cálculo.
              </Typography>
              <TextField
                label="parsed_tables (JSON object)"
                value={parsedTables}
                onChange={(e) => setParsedTables(e.target.value)}
                fullWidth
                multiline
                rows={5}
                placeholder='{"nombre_tabla": [{"columna": "valor"}]}'
                helperText='Formato: {"nombre_tabla": [{"columna": "valor"}]}'
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>Reglas de cálculo</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Reglas estructuradas para motor de cálculos (no para IA).
              </Typography>
              <TextField
                label="parsed_rules (JSON object)"
                value={parsedRules}
                onChange={(e) => setParsedRules(e.target.value)}
                fullWidth
                multiline
                rows={5}
                placeholder='{"regla": "condicion", "formula": "..."}'
                helperText='Formato: {"regla": "condicion", "formula": "..."}'
              />
            </Box>
          )}
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
