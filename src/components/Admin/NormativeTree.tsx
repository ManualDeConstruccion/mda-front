import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Button,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ListIcon from '@mui/icons-material/List';

export interface RegulationTypeItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  order: number;
  is_active: boolean;
  publications: OfficialPublicationItem[];
}

export interface OfficialPublicationItem {
  id: number;
  code: string;
  name: string;
  short_name: string;
  regulation_type: number;
  release_version?: string;
  last_release?: string | null;
  is_active: boolean;
}

interface NormativeTreeProps {
  regulationType: RegulationTypeItem;
  level?: number;
  onAddPublication: (regulationTypeId: number) => void;
  onEditType: (item: RegulationTypeItem) => void;
  onEditPublicationMetadata: (pub: OfficialPublicationItem) => void;
  onOpenPublicationList: (pub: OfficialPublicationItem) => void;
}

const NormativeTree: React.FC<NormativeTreeProps> = ({
  regulationType,
  level = 0,
  onAddPublication,
  onEditType,
  onEditPublicationMetadata,
  onOpenPublicationList,
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasPublications = regulationType.publications && regulationType.publications.length > 0;
  const hasContent = hasPublications;

  const handleToggle = () => {
    if (hasContent) setIsExpanded(!isExpanded);
  };

  return (
    <Box
      sx={{
        ml: level * 3,
        mb: 1,
        borderLeft: level > 0 ? '2px solid' : 'none',
        borderColor: 'divider',
        pl: level > 0 ? 2 : 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'background-color 0.2s ease',
          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
        }}
      >
        {hasContent ? (
          <IconButton size="small" onClick={handleToggle} sx={{ mr: 1 }}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        ) : (
          <Box sx={{ width: 40, mr: 1 }} />
        )}
        <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" fontWeight="medium">
            {regulationType.name}
          </Typography>
          {regulationType.description && (
            <Typography variant="caption" color="text.secondary">
              {regulationType.description}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
          {hasPublications && (
            <Chip
              label={`${regulationType.publications.length} publicación${regulationType.publications.length !== 1 ? 'es' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Editar tipo">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEditType(regulationType);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Nueva publicación">
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onAddPublication(regulationType.id);
              }}
            >
              Publicación
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ mt: 1 }}>
          {hasPublications && (
            <Box sx={{ ml: 2, mt: 1 }}>
              {regulationType.publications.map((pub) => (
                <Box
                  key={pub.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    mb: 0.5,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'background-color 0.2s ease',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                  }}
                >
                  <MenuBookIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Box
                    sx={{ flex: 1, cursor: 'pointer' }}
                    onClick={() => onOpenPublicationList(pub)}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {pub.short_name}
                    </Typography>
                    {pub.name && pub.name !== pub.short_name && (
                      <Typography variant="caption" color="text.secondary">
                        {pub.name}
                      </Typography>
                    )}
                  </Box>
                  <Chip label={pub.code} size="small" variant="outlined" sx={{ mr: 1 }} />
                  <Tooltip title="Editar publicación">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPublicationMetadata(pub);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ver secciones y artículos">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPublicationList(pub);
                      }}
                    >
                      <ListIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default NormativeTree;
