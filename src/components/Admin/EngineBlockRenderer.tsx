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
  onMotorAppliedChange?: () => void | Promise<void>;
}

const EngineBlockRenderer: React.FC<EngineBlockRendererProps> = ({
  block,
  mode,
  subprojectId,
  onEdit,
  onDelete,
  onMotorAppliedChange,
}) => {
  const engineCode = block.section_engine?.code;
  const Component = engineCode ? ENGINE_COMPONENTS[engineCode] : undefined;

  if (Component && subprojectId != null && mode !== 'admin') {
    const engineLabel = block.name || block.section_engine?.name || engineCode || 'Motor';
    const content = <Component subprojectId={subprojectId} onMotorAppliedChange={onMotorAppliedChange} />;
    const userBlockSx = {
      mt: 0.5,
      ml: 0,
      bgcolor: 'rgba(129, 199, 132, 0.18)',
      borderRadius: 1,
      border: '1px solid rgba(129, 199, 132, 0.4)',
      overflow: 'hidden',
    };
    const titleSx = { fontWeight: 700, fontSize: '0.875rem' };
    if (block.is_collapsible) {
      return (
        <Accordion
          sx={{
            ...userBlockSx,
            '&:before': { display: 'none' },
            boxShadow: 'none',
          }}
          defaultExpanded={false}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 0.75, minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.75 } }}>
            <Typography variant="body2" sx={titleSx}>
              {engineLabel}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 2 }}>{content}</AccordionDetails>
        </Accordion>
      );
    }
    return (
      <Box sx={userBlockSx}>
        <Box sx={{ px: 2, py: 0.75, borderBottom: '1px solid rgba(129, 199, 132, 0.3)' }}>
          <Typography variant="body2" sx={titleSx}>
            {engineLabel}
          </Typography>
        </Box>
        <Box sx={{ px: 2, py: 1.5 }}>{content}</Box>
      </Box>
    );
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
