import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';

interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
  parent?: number | null;
  order: number;
  is_active: boolean;
  children?: Category[];
  project_types?: ArchitectureProjectType[];
}

interface ArchitectureProjectType {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: number;
  order: number;
  is_active: boolean;
}

interface CategoryTreeFormulariosProps {
  category: Category;
  level?: number;
}

const CategoryTreeFormularios: React.FC<CategoryTreeFormulariosProps> = ({
  category,
  level = 0,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = category.children && category.children.length > 0;
  const hasProjectTypes = category.project_types && category.project_types.length > 0;
  const hasContent = hasChildren || hasProjectTypes;

  const handleToggle = () => {
    if (hasContent) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleProjectTypeClick = (projectType: ArchitectureProjectType) => {
    navigate(`/admin/formularios/${projectType.id}`);
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
      {/* Header de la categoría */}
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
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        {/* Icono de expandir/colapsar */}
        {hasContent ? (
          <IconButton
            size="small"
            onClick={handleToggle}
            sx={{ mr: 1 }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        ) : (
          <Box sx={{ width: 40, mr: 1 }} />
        )}

        {/* Icono de carpeta */}
        <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />

        {/* Nombre y descripción */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" fontWeight="medium">
            {category.name}
          </Typography>
          {category.description && (
            <Typography variant="caption" color="text.secondary">
              {category.description}
            </Typography>
          )}
        </Box>

        {/* Chips de información */}
        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
          {hasChildren && (
            <Chip
              label={`${category.children?.length} subcategorías`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {hasProjectTypes && (
            <Chip
              label={`${category.project_types?.length} tipos`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Contenido colapsable */}
      <Collapse in={isExpanded}>
        <Box sx={{ mt: 1 }}>
          {/* Subcategorías */}
          {hasChildren &&
            category.children?.map((child) => (
              <CategoryTreeFormularios
                key={child.id}
                category={child}
                level={level + 1}
              />
            ))}

          {/* Tipos de proyecto */}
          {hasProjectTypes && (
            <Box sx={{ ml: 2, mt: 1 }}>
              {category.project_types?.map((projectType) => (
                <Box
                  key={projectType.id}
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
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                  onClick={() => handleProjectTypeClick(projectType)}
                >
                  <DescriptionIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {projectType.name}
                    </Typography>
                    {projectType.description && (
                      <Typography variant="caption" color="text.secondary">
                        {projectType.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={projectType.code}
                    size="small"
                    variant="outlined"
                  />
                  <Tooltip title="Editar formulario">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProjectTypeClick(projectType);
                      }}
                      sx={{
                        ml: 1,
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
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

export default CategoryTreeFormularios;
