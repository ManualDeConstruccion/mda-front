import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import CategoryTree from '../../components/Admin/CategoryTree';
import CreateCategoryModal from '../../components/Admin/CreateCategoryModal';
import CreateProjectTypeModal from '../../components/Admin/CreateProjectTypeModal';
import EditCategoryModal from '../../components/Admin/EditCategoryModal';
import EditProjectTypeModal from '../../components/Admin/EditProjectTypeModal';
import EditListTemplateModal from '../../components/Admin/EditListTemplateModal';

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

const PermisosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [createProjectTypeModalOpen, setCreateProjectTypeModalOpen] = useState(false);
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [editProjectTypeModalOpen, setEditProjectTypeModalOpen] = useState(false);
  const [editListTemplateModalOpen, setEditListTemplateModalOpen] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProjectType, setSelectedProjectType] = useState<ArchitectureProjectType | null>(null);
  const [selectedProjectTypeForList, setSelectedProjectTypeForList] = useState<ArchitectureProjectType | null>(null);

  // Fetch categorías raíz con sus hijos y tipos de proyecto
  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      // El backend no usa prefijo v1, así que construimos la URL manualmente
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.get(`${API_URL}/api/architecture/categories/admin_tree/`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      return response.data;
    },
  });

  const handleCreateCategory = (parentId: number | null = null) => {
    setSelectedParentCategory(parentId);
    setCreateCategoryModalOpen(true);
  };

  const handleCreateProjectType = (categoryId: number) => {
    setSelectedParentCategory(categoryId);
    setCreateProjectTypeModalOpen(true);
  };

  const handleCategoryCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
    setCreateCategoryModalOpen(false);
    setSelectedParentCategory(null);
  };

  const handleProjectTypeCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
    setCreateProjectTypeModalOpen(false);
    setSelectedParentCategory(null);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setEditCategoryModalOpen(true);
  };

  const handleEditProjectType = (projectType: ArchitectureProjectType) => {
    setSelectedProjectType(projectType);
    setEditProjectTypeModalOpen(true);
  };

  const handleCategoryUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
    setEditCategoryModalOpen(false);
    setSelectedCategory(null);
  };

  const handleProjectTypeUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
    setEditProjectTypeModalOpen(false);
    setSelectedProjectType(null);
  };

  const handleEditListTemplate = (projectType: ArchitectureProjectType) => {
    setSelectedProjectTypeForList(projectType);
    setEditListTemplateModalOpen(true);
  };

  const handleListTemplateUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
    setEditListTemplateModalOpen(false);
    setSelectedProjectTypeForList(null);
  };

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
            Error al cargar las categorías. Por favor, intenta nuevamente.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Administración de Permisos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleCreateCategory(null)}
          >
            Nueva Categoría
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Gestiona las categorías y tipos de permisos. Las categorías pueden tener subcategorías
          y tipos de proyecto asociados.
        </Typography>

        {categories && categories.length > 0 ? (
          <Box>
            {categories.map((category) => (
              <CategoryTree
                key={category.id}
                category={category}
                onAddCategory={handleCreateCategory}
                onAddProjectType={handleCreateProjectType}
                onEditCategory={handleEditCategory}
                onEditProjectType={handleEditProjectType}
                onEditListTemplate={handleEditListTemplate}
              />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No hay categorías creadas aún.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleCreateCategory(null)}
              sx={{ mt: 2 }}
            >
              Crear Primera Categoría
            </Button>
          </Box>
        )}
      </Box>

      {/* Modal para crear categoría */}
      <CreateCategoryModal
        open={createCategoryModalOpen}
        onClose={() => {
          setCreateCategoryModalOpen(false);
          setSelectedParentCategory(null);
        }}
        onSuccess={handleCategoryCreated}
        parentId={selectedParentCategory}
      />

      {/* Modal para crear tipo de proyecto */}
      <CreateProjectTypeModal
        open={createProjectTypeModalOpen}
        onClose={() => {
          setCreateProjectTypeModalOpen(false);
          setSelectedParentCategory(null);
        }}
        onSuccess={handleProjectTypeCreated}
        categoryId={selectedParentCategory}
      />

      {/* Modal para editar categoría */}
      <EditCategoryModal
        open={editCategoryModalOpen}
        onClose={() => {
          setEditCategoryModalOpen(false);
          setSelectedCategory(null);
        }}
        onSuccess={handleCategoryUpdated}
        category={selectedCategory}
      />

      {/* Modal para editar tipo de proyecto */}
      <EditProjectTypeModal
        open={editProjectTypeModalOpen}
        onClose={() => {
          setEditProjectTypeModalOpen(false);
          setSelectedProjectType(null);
        }}
        onSuccess={handleProjectTypeUpdated}
        projectType={selectedProjectType}
      />

      {/* Modal para editar/crear listado */}
      <EditListTemplateModal
        open={editListTemplateModalOpen}
        onClose={() => {
          setEditListTemplateModalOpen(false);
          setSelectedProjectTypeForList(null);
        }}
        onSuccess={handleListTemplateUpdated}
        projectType={selectedProjectTypeForList}
      />
    </Container>
  );
};

export default PermisosPage;
