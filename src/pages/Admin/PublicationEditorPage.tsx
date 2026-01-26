import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
  Divider,
  Stack,
  Link,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import EditRegulationArticleModal from '../../components/Admin/EditRegulationArticleModal';

interface RegulationArticleRow {
  id: number;
  code: string;
  article_number: string;
  title?: string;
  effective_from: string;
  effective_to?: string | null;
  is_active: boolean;
  section: number | null;
  section_name?: string | null;
  official_publication: number | null;
}

interface PublicationSectionRow {
  id: number;
  code: string;
  name: string;
  section_number?: string;
  order: number;
}

interface PublicationDetail {
  id: number;
  code: string;
  name: string;
  short_name: string;
  regulation_type_name?: string | null;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const PublicationEditorPage: React.FC = () => {
  const { publicationId } = useParams<{ publicationId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSection, setFilterSection] = useState<number | ''>('');
  const [filterIsActive, setFilterIsActive] = useState<boolean | ''>('');
  const [page, setPage] = useState(1);
  const [editingArticle, setEditingArticle] = useState<RegulationArticleRow | null>(null);
  const [createArticleOpen, setCreateArticleOpen] = useState(false);

  const itemsPerPage = 50;
  const headers = {
    withCredentials: true,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  };

  const { data: publication, isLoading: loadingPub, error: errorPub } = useQuery<PublicationDetail>({
    queryKey: ['normative-publication-detail', publicationId],
    queryFn: async () => {
      const res = await axios.get(
        `${API_URL}/api/normative/official-publications/${publicationId}/`,
        headers
      );
      return res.data;
    },
    enabled: !!publicationId && !!accessToken,
  });

  const { data: sections = [] } = useQuery<PublicationSectionRow[]>({
    queryKey: ['normative-publication-sections', publicationId],
    queryFn: async () => {
      const res = await axios.get(
        `${API_URL}/api/normative/publication-sections/?official_publication=${publicationId}`,
        headers
      );
      const raw = res.data?.results ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: !!publicationId && !!accessToken,
  });

  const { data: articles = [], isLoading: loadingArticles } = useQuery<RegulationArticleRow[]>({
    queryKey: ['normative-articles-by-pub', publicationId],
    queryFn: async () => {
      const res = await axios.get(
        `${API_URL}/api/normative/regulation-articles/?official_publication=${publicationId}`,
        headers
      );
      const raw = res.data?.results ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: !!publicationId && !!accessToken,
  });

  const { groupedArticles, totalCount } = useMemo(() => {
    if (!articles.length) return { groupedArticles: {} as Record<string, { sectionName: string; articles: RegulationArticleRow[] }>, totalCount: 0 };

    const filtered = articles.filter((a) => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (
          !a.code?.toLowerCase().includes(s) &&
          !a.article_number?.toLowerCase().includes(s) &&
          !a.title?.toLowerCase().includes(s)
        )
          return false;
      }
      if (filterSection !== '' && a.section !== filterSection) return false;
      if (filterIsActive !== '' && a.is_active !== filterIsActive) return false;
      return true;
    });

    const grouped: Record<string, { sectionName: string; articles: RegulationArticleRow[] }> = {};
    filtered.forEach((a) => {
      const key = a.section != null ? `s${a.section}` : 'nosection';
      const sectionName = a.section_name ?? 'Sin sección';
      if (!grouped[key]) grouped[key] = { sectionName, articles: [] };
      grouped[key].articles.push(a);
    });

    return { groupedArticles: grouped, totalCount: filtered.length };
  }, [articles, searchTerm, filterSection, filterIsActive]);

  const paginatedEntries = useMemo(() => {
    const flat: { key: string; sectionName: string; article: RegulationArticleRow }[] = [];
    Object.entries(groupedArticles).forEach(([key, g]) => {
      g.articles.forEach((a) => flat.push({ key, sectionName: g.sectionName, article: a }));
    });
    const start = (page - 1) * itemsPerPage;
    return flat.slice(start, start + itemsPerPage);
  }, [groupedArticles, page, itemsPerPage]);

  const { paginatedBySection, orderedSectionKeys } = useMemo(() => {
    const map: Record<string, { sectionName: string; articles: RegulationArticleRow[] }> = {};
    paginatedEntries.forEach(({ key, sectionName, article }) => {
      if (!map[key]) map[key] = { sectionName, articles: [] };
      map[key].articles.push(article);
    });
    const order = ['nosection', ...sections.map((s) => `s${s.id}`)];
    const ordered = order.filter((k) => k in map);
    return { paginatedBySection: map, orderedSectionKeys: ordered };
  }, [paginatedEntries, sections]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, filterSection, filterIsActive]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['normative-articles-by-pub', publicationId] });
    queryClient.invalidateQueries({ queryKey: ['normative-publication-detail', publicationId] });
    queryClient.invalidateQueries({ queryKey: ['normative-admin-tree'] });
  };

  if (loadingPub || !publication) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (errorPub) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">Error al cargar la publicación.</Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/normativas')} sx={{ mt: 2 }}>
            Volver a Normativas
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/admin/normativas')}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 1 }}
            >
              <ArrowBackIcon fontSize="small" /> Volver a Normativas
            </Link>
            <Typography variant="h4" gutterBottom>
              {publication.short_name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {publication.name}
            </Typography>
            {publication.regulation_type_name && (
              <Chip label={publication.regulation_type_name} size="small" sx={{ mt: 0.5 }} />
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingArticle(null);
              setCreateArticleOpen(true);
            }}
          >
            Nuevo artículo
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar"
                placeholder="Código, número, título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sección</InputLabel>
                <Select
                  value={filterSection}
                  label="Sección"
                  onChange={(e) => setFilterSection(e.target.value === '' ? '' : Number(e.target.value))}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {sections.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.section_number ? `${s.section_number}. ` : ''}{s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filterIsActive}
                  label="Estado"
                  onChange={(e) =>
                    setFilterIsActive(e.target.value === '' ? '' : e.target.value === 'true')
                  }
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Activos</MenuItem>
                  <MenuItem value="false">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Artículo</strong></TableCell>
                  <TableCell><strong>Título</strong></TableCell>
                  <TableCell><strong>Vigente desde</strong></TableCell>
                  <TableCell><strong>Vigente hasta</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="right"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingArticles ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : Object.keys(paginatedBySection).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No hay artículos con los filtros seleccionados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orderedSectionKeys.map((sectionKey, groupIdx) => {
                    const group = paginatedBySection[sectionKey];
                    if (!group) return null;
                    return (
                    <React.Fragment key={sectionKey}>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ bgcolor: 'grey.100', py: 1.5 }}>
                          <Typography variant="subtitle1" fontWeight="bold" color="primary">
                            {group.sectionName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {group.articles.length} artículo{group.articles.length !== 1 ? 's' : ''}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {group.articles.map((art) => (
                        <TableRow key={art.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {art.code}
                            </Typography>
                          </TableCell>
                          <TableCell>{art.article_number}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {art.title ? art.title.slice(0, 60) + (art.title.length > 60 ? '…' : '') : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>{art.effective_from ? art.effective_from.slice(0, 10) : '—'}</TableCell>
                          <TableCell>
                            {art.effective_to ? art.effective_to.slice(0, 10) : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={art.is_active ? 'Activo' : 'Inactivo'}
                              color={art.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => setEditingArticle(art)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {groupIdx < orderedSectionKeys.length - 1 && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 1 }}>
                            <Divider />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalCount > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Stack spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {(page - 1) * itemsPerPage + 1}–{Math.min(page * itemsPerPage, totalCount)} de {totalCount}
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, v) => setPage(v)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>

      <EditRegulationArticleModal
        open={!!editingArticle || createArticleOpen}
        onClose={() => {
          setEditingArticle(null);
          setCreateArticleOpen(false);
        }}
        onSuccess={() => {
          invalidate();
          setEditingArticle(null);
          setCreateArticleOpen(false);
        }}
        article={editingArticle}
        officialPublicationId={publication?.id ? Number(publication.id) : 0}
        defaultSectionId={undefined}
      />
    </Container>
  );
};

export default PublicationEditorPage;
