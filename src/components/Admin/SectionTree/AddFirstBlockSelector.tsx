import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SectionEngine } from '../../../types/formParameters.types';

interface AddFirstBlockSelectorProps {
  sectionEngines: SectionEngine[];
  onSelectGrid: () => Promise<void>;
  onSelectEngine: (sectionEngineId: number) => Promise<void>;
}

export const AddFirstBlockSelector: React.FC<AddFirstBlockSelectorProps> = ({
  sectionEngines,
  onSelectGrid,
  onSelectEngine,
}) => (
  <Box sx={{ mt: 2, ml: 0 }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Esta sección está vacía. Agrega el primer bloque:
      </Typography>
      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel>Tipo de bloque</InputLabel>
        <Select
          value=""
          label="Tipo de bloque"
          onChange={async (e) => {
            const value = e.target.value as string;
            if (value === 'grid') {
              await onSelectGrid();
            } else if (value) {
              const id = Number(value);
              if (id) await onSelectEngine(id);
            }
          }}
        >
          <MenuItem value="grid">Grilla (parámetros y celdas)</MenuItem>
          {sectionEngines.map((engine) => (
            <MenuItem key={engine.id} value={engine.id}>
              {engine.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  </Box>
);
