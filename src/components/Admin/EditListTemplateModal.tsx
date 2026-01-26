import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminListTemplateEditor from './AdminListTemplateEditor';
import CreateEditTemplateModal from './CreateEditTemplateModal';

interface ArchitectureProjectType {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: number;
  order: number;
  is_active: boolean;
}

interface ListTemplate {
  id?: number;
  architecture_project_type: number;
  architecture_project_type_name?: string;
  name: string;
  description?: string;
  code: string;
  node_type: number;
  node_type_name?: string;
  node_type_code?: string;
  parent_code?: string | null;
  order: number;
}

interface EditListTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectType: ArchitectureProjectType | null;
}

const EditListTemplateModal: React.FC<EditListTemplateModalProps> = ({
  open,
  onClose,
  onSuccess,
  projectType,
}) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  
  // Obtener token con fallback
  const getAuthToken = () => {
    return accessToken || localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  };

  // Obtener todos los templates para este tipo de proyecto
  const { data: allTemplates = [], isLoading: loadingTemplates } = useQuery<ListTemplate[]>({
    queryKey: ['list-templates-all', projectType?.id],
    queryFn: async () => {
      if (!projectType) return [];
      try {
        const response = await axios.get(
          `${API_URL}/api/architecture/list-templates/all-by-project-type/${projectType.id}/`,
          {
          withCredentials: true,
          headers: {
            'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
          },
          }
        );
        return response.data || [];
      } catch (error: any) {
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: open && !!projectType,
  });

  // Si hay templates, usar el editor admin; si no, mostrar modal para crear el primero
  const hasTemplates = allTemplates.length > 0;

  // Abrir automáticamente el modal de creación cuando se abre este modal y no hay templates
  // IMPORTANTE: Este useEffect debe estar antes de cualquier return condicional
  useEffect(() => {
    if (open && projectType && !hasTemplates && !createModalOpen) {
      setCreateModalOpen(true);
    }
  }, [open, projectType, hasTemplates, createModalOpen]);

  const handleEditorClose = () => {
    onSuccess(); // Invalidar queries y cerrar
    onClose();
  };

  const handleCreateModalClose = () => {
    setCreateModalOpen(false);
    // Si se creó el primer template, abrir el editor admin
    queryClient.invalidateQueries({ queryKey: ['list-templates-all', projectType?.id] });
  };

  const handleCreateModalSuccess = () => {
    setCreateModalOpen(false);
    // Invalidar y abrir el editor admin automáticamente
    queryClient.invalidateQueries({ queryKey: ['list-templates-all', projectType?.id] });
    onSuccess();
  };

  if (!projectType) {
    return null;
  }

  // Si hay templates, mostrar el editor admin
  if (hasTemplates) {
    return (
      <AdminListTemplateEditor
        open={open}
        onClose={handleEditorClose}
        projectType={projectType}
      />
    );
  }

  return (
    <>
      <CreateEditTemplateModal
        open={createModalOpen}
        onClose={handleCreateModalClose}
        onSuccess={handleCreateModalSuccess}
        projectType={projectType}
        template={null}
        availableParentCodes={[]}
      />
    </>
  );
};

export default EditListTemplateModal;
