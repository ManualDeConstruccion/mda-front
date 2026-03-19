import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { useTemplateRebuild } from '../../hooks/useTemplateRebuild';

interface TemplateRebuildDialogProps {
  open: boolean;
  onClose: () => void;
}

const TemplateRebuildDialog: React.FC<TemplateRebuildDialogProps> = ({ open, onClose }) => {
  const [jobId, setJobId] = useState<number | undefined>();
  const { previewQuery, applyMutation, statusQuery, resultQuery, retryFailedMutation } = useTemplateRebuild(open);
  const status = statusQuery(jobId);
  const result = resultQuery(jobId);

  useEffect(() => {
    if (open) {
      previewQuery.refetch();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = async () => {
    const response = await applyMutation.mutateAsync();
    setJobId(response.job_id);
  };

  const isRunning = status.data?.status === 'pending' || status.data?.status === 'processing';
  const canRetry = status.data?.status === 'failed' && !!jobId;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Actualizar formularios</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Revisa los cambios pendientes de `form_pdf_code`. El rebuild se ejecuta solo cuando confirmes.
        </Typography>

        {previewQuery.isLoading && <CircularProgress size={20} />}
        {previewQuery.data && (
          <>
            <Alert severity={previewQuery.data.pending_count > 0 ? 'warning' : 'info'} sx={{ mb: 2 }}>
              Pendientes: {previewQuery.data.pending_count} | Templates afectados: {previewQuery.data.affected_templates.length}
            </Alert>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Comparación de cambios
            </Typography>
            <List dense sx={{ maxHeight: 220, overflow: 'auto', border: '1px solid', borderColor: 'divider', mb: 2 }}>
              {previewQuery.data.pending_changes.map((change) => (
                <ListItem key={change.id}>
                  <ListItemText
                    primary={`${change.parameter_code}: ${change.old_form_pdf_code || '(vacío)'} -> ${change.new_form_pdf_code || '(vacío)'}`}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {jobId && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Job #{jobId}</Typography>
            <Typography variant="body2" color="text.secondary">
              Estado: {status.data?.status || '...'}
            </Typography>
            {isRunning && <CircularProgress size={18} sx={{ mt: 1 }} />}
            {result.data?.items && (
              <List dense sx={{ maxHeight: 180, overflow: 'auto', mt: 1 }}>
                {result.data.items.map((item: any) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={`${item.template_name} - ${item.status}`}
                      secondary={item.error_message || `renamed=${item.renamed_count} missing=${item.missing_count}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            {canRetry && (
              <Button
                variant="outlined"
                sx={{ mt: 1 }}
                onClick={async () => {
                  if (!jobId) return;
                  const retry = await retryFailedMutation.mutateAsync(jobId);
                  setJobId(retry.job_id);
                }}
              >
                Reintentar fallidos
              </Button>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={applyMutation.isPending || !previewQuery.data || previewQuery.data.pending_count === 0}
        >
          Aplicar cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateRebuildDialog;
