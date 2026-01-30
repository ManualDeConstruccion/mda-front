import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { FormType } from '../../../types/formParameters.types';

interface SectionTypeSelectorProps {
  formTypes: FormType[];
  onSelectType: (formTypeId: number) => Promise<void>;
}

export const SectionTypeSelector: React.FC<SectionTypeSelectorProps> = ({ formTypes, onSelectType }) => (
  <Box sx={{ mt: 2, ml: 0 }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Esta sección está vacía. Elige cómo configurarla:
      </Typography>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Seleccionar Tipo de Categoría</InputLabel>
        <Select
          value=""
          label="Seleccionar Tipo de Categoría"
          onChange={async (e) => {
            const formTypeId = Number(e.target.value);
            if (formTypeId) {
              await onSelectType(formTypeId);
            }
          }}
        >
          {formTypes.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  </Box>
);
