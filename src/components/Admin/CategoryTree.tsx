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
import DescriptionIcon from '@mui/icons-material/Description';
import styles from './CategoryTree.module.scss';

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

interface CategoryTreeProps {
  category: Category;
  level?: number;
  onAddCategory: (parentId: number | null) => void;
  onAddProjectType: (categoryId: number) => void;
  onEditCategory?: (category: Category) => void;
  onEditProjectType?: (projectType: ArchitectureProjectType) => void;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({
  category,
  level = 0,
  onAddCategory,
  onAddProjectType,
  onEditCategory,
  onEditProjectType,
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0); // Expandir raíz por defecto
  const hasChildren = category.children && category.children.length > 0;
  const hasProjectTypes = category.project_types && category.project_types.length > 0;
  const hasContent = hasChildren || hasProjectTypes;

  const handleToggle = () => {
    if (hasContent) {
      setIsExpanded(!isExpanded);
    }
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

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onEditCategory && (
            <Tooltip title="Editar categoría">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCategory(category);
                }}
                sx={{
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Agregar subcategoría">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onAddCategory(category.id);
              }}
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Agregar tipo de proyecto">
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onAddProjectType(category.id);
              }}
            >
              Tipo
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Contenido colapsable */}
      <Collapse in={isExpanded}>
        <Box sx={{ mt: 1 }}>
          {/* Subcategorías */}
          {hasChildren &&
            category.children?.map((child) => (
              <CategoryTree
                key={child.id}
                category={child}
                level={level + 1}
                onAddCategory={onAddCategory}
                onAddProjectType={onAddProjectType}
                onEditCategory={onEditCategory}
                onEditProjectType={onEditProjectType}
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
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
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
                  {onEditProjectType && (
                    <Tooltip title="Editar tipo de proyecto">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProjectType(projectType);
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
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default CategoryTree;
