import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Collapse,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArticleIcon from '@mui/icons-material/Article';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import EditRegulationArticleModal from './EditRegulationArticleModal';
import CreatePublicationSectionModal from './CreatePublicationSectionModal';

export interface PublicationSectionWithArticles {
  id: number;
  code: string;
  name: string;
  description?: string;
  official_publication: number;
  parent: number | null;
  parent_name?: string | null;
  section_number?: string;
  order: number;
  is_active: boolean;
  articles: Array<{
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
  }>;
  subsections: PublicationSectionWithArticles[];
}

export interface OfficialPublicationTree {
  id: number;
  code: string;
  name: string;
  short_name: string;
  regulation_type: number | null;
  regulation_type_name?: string | null;
  publication_date?: string | null;
  last_release?: string | null;
  release_version?: string;
  official_url?: string;
  description?: string;
  is_active: boolean;
  sections: PublicationSectionWithArticles[];
  articles_without_section: Array<{
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
  }>;
}

interface PublicationEditorProps {
  publicationId: number;
  onClose: () => void;
}

const SectionBlock: React.FC<{
  section: PublicationSectionWithArticles;
  level: number;
  onAddSection: (parentId: number | null, publicationId: number) => void;
  onAddArticle: (officialPublicationId: number, sectionId: number | null) => void;
  onEditArticle: (article: any) => void;
  publicationId: number;
}> = ({ section, level, onAddSection, onAddArticle, onEditArticle, publicationId }) => {
  const [open, setOpen] = useState(level < 2);
  const hasChildren = section.subsections?.length > 0 || section.articles?.length > 0;

  return (
    <Box sx={{ ml: level * 2, mb: 1 }}>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: level === 0 ? 'grey.50' : 'background.paper',
        }}
      >
        {hasChildren ? (
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        ) : (
          <Box sx={{ width: 32 }} />
        )}
        <MenuBookIcon fontSize="small" color="action" />
        <Typography variant="body2" fontWeight="medium">
          {section.section_number ? `${section.section_number}. ` : ''}{section.name}
        </Typography>
        <Chip label={section.code} size="small" variant="outlined" />
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => onAddSection(section.id, publicationId)}
        >
          Sección
        </Button>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => onAddArticle(publicationId, section.id)}
        >
          Artículo
        </Button>
      </Paper>
      <Collapse in={open}>
        <Box sx={{ ml: 2, mt: 0.5 }}>
          {(section.subsections || []).map((sub) => (
            <SectionBlock
              key={sub.id}
              section={sub}
              level={level + 1}
              onAddSection={onAddSection}
              onAddArticle={onAddArticle}
              onEditArticle={onEditArticle}
              publicationId={publicationId}
            />
          ))}
          {(section.articles || []).map((art) => (
            <Box
              key={art.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <ArticleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                Art. {art.article_number}
                {art.title ? ` – ${art.title.slice(0, 50)}${art.title.length > 50 ? '…' : ''}` : ''}
              </Typography>
              <Chip label={art.code} size="small" variant="outlined" sx={{ mr: 1 }} />
              <IconButton size="small" onClick={() => onEditArticle(art)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

const PublicationEditor: React.FC<PublicationEditorProps> = ({ publicationId, onClose }) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [articleModal, setArticleModal] = useState<any>(null);
  const [sectionModal, setSectionModal] = useState<{ parentId: number | null; publicationId: number } | null>(null);
  const [createArticle, setCreateArticle] = useState<{
    officialPublicationId: number;
    sectionId: number | null;
  } | null>(null);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const headers = {
    withCredentials: true,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  };

  const { data: pub, isLoading, error } = useQuery<OfficialPublicationTree>({
    queryKey: ['normative-publication', publicationId],
    queryFn: async () => {
      const res = await axios.get(
        `${API_URL}/api/normative/official-publications/${publicationId}/`,
        headers
      );
      return res.data;
    },
    enabled: !!publicationId && !!accessToken,
  });

  const handleAddSection = (parentId: number | null, publicationId: number) => {
    setSectionModal({ parentId, publicationId });
  };

  const handleAddArticle = (officialPublicationId: number, sectionId: number | null) => {
    setArticleModal(null);
    setCreateArticle({ officialPublicationId, sectionId });
  };

  const handleEditArticle = (article: any) => {
    setCreateArticle(null);
    setArticleModal(article);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['normative-publication', publicationId] });
    queryClient.invalidateQueries({ queryKey: ['normative-admin-tree'] });
  };

  if (isLoading || !pub) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error al cargar la publicación.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6">{pub.short_name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {pub.name}
          </Typography>
          {pub.regulation_type_name && (
            <Chip label={pub.regulation_type_name} size="small" sx={{ mt: 0.5 }} />
          )}
        </Box>
        <Button variant="outlined" onClick={onClose}>
          Cerrar
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleAddSection(null, pub.id)}
        >
          Nueva sección
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleAddArticle(pub.id, null)}
        >
          Nuevo artículo (sin sección)
        </Button>
      </Box>

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Secciones
      </Typography>
      {(pub.sections || []).map((sec) => (
        <SectionBlock
          key={sec.id}
          section={sec}
          level={0}
          onAddSection={handleAddSection}
          onAddArticle={handleAddArticle}
          onEditArticle={handleEditArticle}
          publicationId={pub.id}
        />
      ))}

      {(pub.articles_without_section || []).length > 0 && (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            Artículos sin sección
          </Typography>
          {(pub.articles_without_section || []).map((art) => (
            <Box
              key={art.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <ArticleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                Art. {art.article_number}
                {art.title ? ` – ${art.title.slice(0, 50)}${art.title.length > 50 ? '…' : ''}` : ''}
              </Typography>
              <Chip label={art.code} size="small" variant="outlined" sx={{ mr: 1 }} />
              <IconButton size="small" onClick={() => handleEditArticle(art)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </>
      )}

      <EditRegulationArticleModal
        open={!!articleModal || !!createArticle}
        onClose={() => {
          setArticleModal(null);
          setCreateArticle(null);
        }}
        onSuccess={() => {
          invalidate();
          setArticleModal(null);
          setCreateArticle(null);
        }}
        article={articleModal}
        officialPublicationId={createArticle?.officialPublicationId ?? pub.id}
        defaultSectionId={createArticle?.sectionId ?? undefined}
      />

      <CreatePublicationSectionModal
        open={!!sectionModal}
        onClose={() => setSectionModal(null)}
        onSuccess={() => {
          invalidate();
          setSectionModal(null);
        }}
        publicationId={sectionModal?.publicationId ?? 0}
        parentSectionId={sectionModal?.parentId ?? undefined}
      />
    </Box>
  );
};

export default PublicationEditor;
