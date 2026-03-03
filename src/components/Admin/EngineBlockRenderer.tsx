import React from 'react';
import { Box, Typography, IconButton, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ENGINE_COMPONENTS from './engineRegistry';
import type { FormCategoryBlock, SectionTreeMode } from '../../types/formParameters.types';

interface EngineBlockRendererProps {
  block: FormCategoryBlock;
  mode: SectionTreeMode;
  subprojectId?: number;
  onEdit: (block: FormCategoryBlock) => void;
  onDelete: (blockId: number) => void;
}

const EngineBlockRenderer: React.FC<EngineBlockRendererProps> = ({
  block,
  mode,
  subprojectId,
  onEdit,
  onDelete,
}) => {
  const engineCode = block.section_engine?.code;
  const Component = engineCode ? ENGINE_COMPONENTS[engineCode] : undefined;

  if (Component && subprojectId != null && mode !== 'admin') {
    const content = <Component subprojectId={subprojectId} />;
    if (block.is_collapsible) {
      return (
        <Accordion
          sx={{
            mt: 2, ml: 0, '&:before': { display: 'none' },
            boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 1,
          }}
          defaultExpanded={false}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">
              {block.name || block.section_engine?.name || engineCode || 'Motor'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>{content}</AccordionDetails>
        </Accordion>
      );
    }
    return <Box sx={{ mt: 2, ml: 0 }}>{content}</Box>;
  }

  if (mode === 'admin') {
    return (
      <Box sx={{ mt: 2, ml: 0, p: 2, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Motor: {block.name || (block.section_engine?.name ?? block.section_engine?.code ?? '—')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" title="Editar nombre y colapsable" onClick={() => onEdit(block)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            title="Eliminar bloque"
            onClick={() => {
              if (window.confirm('¿Eliminar este bloque de motor?')) {
                onDelete(block.id);
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return null;
};

export default EngineBlockRenderer;
