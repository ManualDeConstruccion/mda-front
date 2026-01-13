import React from 'react';
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import CategoryTreeFormularios from '../../components/Admin/CategoryTreeFormularios';

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

const FormulariosPage: React.FC = () => {
  const { accessToken } = useAuth();
  
  // Fetch categorías SOLO con aquellas que contienen tipos de proyecto
  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories-formularios-tree'],
    queryFn: async () => {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.get(`${API_URL}/api/architecture/categories/formularios_tree/`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
        },
      });
      return response.data;
    },
    enabled: !!accessToken,
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
            Error al cargar los tipos de proyecto. Por favor, intenta nuevamente.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Administración de Formularios
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Selecciona un tipo de proyecto para editar su formulario.
        </Typography>

        {categories && categories.length > 0 ? (
          <Box>
            {categories.map((category) => (
              <CategoryTreeFormularios
                key={category.id}
                category={category}
              />
            ))}
          </Box>
        ) : (
          <Alert severity="info">
            No hay tipos de proyecto disponibles. Crea tipos de proyecto en la página de Permisos.
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default FormulariosPage;
