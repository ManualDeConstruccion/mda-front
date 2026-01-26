import React from 'react';
import { Dialog, DialogContent } from '@mui/material';
import PublicationEditor from './PublicationEditor';
import type { OfficialPublicationItem } from './NormativeTree';

interface PublicationEditorModalProps {
  open: boolean;
  onClose: () => void;
  publication: OfficialPublicationItem | null;
}

const PublicationEditorModal: React.FC<PublicationEditorModalProps> = ({
  open,
  onClose,
  publication,
}) => {
  if (!publication) return null;

  return (
    <Dialog
      open={!!open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '60vh' } }}
    >
      <DialogContent>
        <PublicationEditor publicationId={publication.id} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default PublicationEditorModal;
