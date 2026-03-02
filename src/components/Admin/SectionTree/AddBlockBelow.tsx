import React, { useState } from 'react';
import { Box, Button, Menu, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { SectionEngine } from '../../../types/formParameters.types';

interface AddBlockControlProps {
  /** Etiqueta del botón (ej. "Agregar bloque arriba" o "Agregar bloque debajo"). */
  label: string;
  sectionEngines: SectionEngine[];
  onAdd: (blockType: 'grid' | 'engine', sectionEngineId?: number) => Promise<void>;
}

/**
 * Control compacto para agregar un bloque (grilla o motor) arriba o debajo de la sección.
 * Solo se muestra arriba del primer bloque o debajo del último; no entre bloques.
 * Botón centrado en el eje horizontal.
 */
export const AddBlockBelow: React.FC<AddBlockControlProps> = ({
  label,
  sectionEngines,
  onAdd,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (blockType: 'grid' | 'engine', sectionEngineId?: number) => {
    setLoading(true);
    setAnchorEl(null);
    try {
      await onAdd(blockType, sectionEngineId);
    } catch (e) {
      console.error('Error al crear bloque:', e);
      alert('Error al crear el bloque.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 1, mb: 1, display: 'flex', justifyContent: 'center' }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={loading}
      >
        {label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MenuItem onClick={() => handleSelect('grid')}>Grilla (parámetros y celdas)</MenuItem>
        {sectionEngines.map((eng) => (
          <MenuItem key={eng.id} onClick={() => handleSelect('engine', eng.id)}>
            {eng.name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
