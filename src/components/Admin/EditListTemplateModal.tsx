import React from 'react';
import AdminListTemplateEditor from './AdminListTemplateEditor';

interface ArchitectureProjectType {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: number;
  order: number;
  is_active: boolean;
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
  const handleEditorClose = () => {
    onSuccess(); // Invalidar queries y cerrar
    onClose();
  };

  if (!projectType) {
    return null;
  }

  // Siempre mostrar AdminListTemplateEditor, que incluye EditProjectTypeList
  // y maneja el caso cuando no hay templates
  return (
    <AdminListTemplateEditor
      open={open}
      onClose={handleEditorClose}
      projectType={projectType}
    />
  );
};

export default EditListTemplateModal;
