import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Button,
  Breadcrumbs,
  Link,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface FormParameterCategory {
  id: number;
  code: string;
  number: string;
  name: string;
  description?: string;
  parent?: number | null;
  order: number;
  is_active: boolean;
  form_parameters?: FormParameter[];
  subcategories?: FormParameterCategory[];
}

interface FormParameter {
  id: number;
  category: number;
  parameter_definition: {
    id: number;
    code: string;
    name: string;
    data_type: string;
    unit?: string;
  };
  order: number;
  is_required: boolean;
  is_visible: boolean;
}

interface ArchitectureProjectType {
  id: number;
  code: string;
  name: string;
  description?: string;
  category?: {
    id: number;
    code: string;
    name: string;
    full_path?: string;
  };
}

interface FormStructure {
  project_type: ArchitectureProjectType;
  sections: FormParameterCategory[];
}

// Componente recursivo para mostrar secciones con subcategorías
const SectionTree: React.FC<{ section: FormParameterCategory; level: number }> = ({ section, level }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasSubcategories = section.subcategories && section.subcategories.length > 0;
  const hasParameters = section.form_parameters && section.form_parameters.length > 0;

  return (
    <Box
      sx={{
        ml: level * 3,
        mb: 2,
        borderLeft: level > 0 ? '2px solid' : 'none',
        borderColor: 'divider',
        pl: level > 0 ? 2 : 0,
      }}
    >
      <Box
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {(hasSubcategories || hasParameters) && (
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ mr: 1 }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
          {!(hasSubcategories || hasParameters) && <Box sx={{ width: 40, mr: 1 }} />}
          
          <Typography variant="h6" sx={{ flex: 1 }}>
            {section.number} - {section.name}
          </Typography>
          
          {hasParameters && (
            <Chip
              label={`${section.form_parameters?.length} parámetros`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {section.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 6 }}>
            {section.description}
          </Typography>
        )}

        <Collapse in={isExpanded}>
          {/* Parámetros de la sección */}
          {hasParameters && (
            <Box sx={{ mt: 2, ml: 6 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 1,
                }}
              >
                {section.form_parameters.map((param) => (
                  <Box
                    key={param.id}
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {param.parameter_definition.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Código: {param.parameter_definition.code}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      {param.is_required && (
                        <Chip label="Requerido" size="small" color="error" />
                      )}
                      {!param.is_visible && (
                        <Chip label="Oculto" size="small" variant="outlined" />
                      )}
                      {param.parameter_definition.unit && (
                        <Typography variant="caption" color="text.secondary">
                          {param.parameter_definition.unit}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Tipo: {param.parameter_definition.data_type}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Subcategorías */}
          {hasSubcategories && (
            <Box sx={{ mt: 2 }}>
              {section.subcategories.map((subcategory) => (
                <SectionTree
                  key={subcategory.id}
                  section={subcategory}
                  level={level + 1}
                />
              ))}
            </Box>
          )}

          {!hasParameters && !hasSubcategories && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 6 }}>
              Esta sección no tiene parámetros configurados.
            </Typography>
          )}
        </Collapse>
      </Box>
    </Box>
  );
};

const FormularioEditPage: React.FC = () => {
  const { projectTypeId } = useParams<{ projectTypeId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  // Fetch estructura del formulario
  const { data: formStructure, isLoading, error } = useQuery<FormStructure>({
    queryKey: ['form-structure', projectTypeId],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.get(
        `${API_URL}/api/architecture/architecture-project-types/${projectTypeId}/form_structure/`,
        {
          withCredentials: true,
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );
      return response.data;
    },
    enabled: !!projectTypeId && !!accessToken,
  });

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            Error al cargar la estructura del formulario. Por favor, intenta nuevamente.
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!formStructure) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="info">
            No se encontró la estructura del formulario para este tipo de proyecto.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Breadcrumbs con árbol completo de categorías */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/admin/formularios')}
            sx={{ cursor: 'pointer' }}
          >
            Formularios
          </Link>
          {formStructure.project_type.category?.full_path && (
            <>
              {formStructure.project_type.category.full_path.split(' > ').map((pathSegment, index) => (
                <Typography key={index} color="text.secondary">
                  {pathSegment}
                </Typography>
              ))}
            </>
          )}
          <Typography color="text.primary" fontWeight="medium">
            {formStructure.project_type.name}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {formStructure.project_type.name}
            </Typography>
            {formStructure.project_type.description && (
              <Typography variant="body2" color="text.secondary">
                {formStructure.project_type.description}
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/formularios')}
          >
            Volver
          </Button>
        </Box>

        {/* Secciones del formulario */}
        {formStructure.sections && formStructure.sections.length > 0 ? (
          <Box>
            {formStructure.sections.map((section) => (
              <SectionTree
                key={section.id}
                section={section}
                level={0}
              />
            ))}
          </Box>
        ) : (
          <Alert severity="info">
            Este tipo de proyecto no tiene secciones configuradas. Agrega secciones desde el Excel o Django Admin.
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default FormularioEditPage;
