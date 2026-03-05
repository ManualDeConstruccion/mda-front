import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useSectionEngines } from '../../hooks/useSectionEngines';
import type { FormCategoryBlock } from '../../types/formParameters.types';

interface EditEngineBlockModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  block: FormCategoryBlock | null;
  projectTypeId: number;
}

export default function EditEngineBlockModal({
  open,
  onClose,
  onSuccess,
  block,
  projectTypeId,
}: EditEngineBlockModalProps) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const { sectionEngines } = useSectionEngines({ enabled: open && !!block });
  const [sectionEngineId, setSectionEngineId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [isCollapsible, setIsCollapsible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

  useEffect(() => {
    if (block && open) {
      setSectionEngineId(block.section_engine?.id ?? null);
      setName(block.name ?? '');
      setIsCollapsible(block.is_collapsible ?? false);
      setError(null);
    }
  }, [block, open]);

  const handleSubmit = async () => {
    if (!block) return;
    setSaving(true);
    setError(null);
    try {
      await axios.patch(
        `${API_URL}/api/parameters/form-category-blocks/${block.id}/`,
        {
          name,
          is_collapsible: isCollapsible,
          section_engine_id: sectionEngineId ?? block.section_engine?.id ?? null,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      queryClient.invalidateQueries({ queryKey: ['form-structure', projectTypeId] });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Incluir el motor actual del bloque si no está en la lista (ej. es_formulario_minvu=false)
  const enginesForSelect = useMemo(() => {
    if (!block?.section_engine) return sectionEngines;
    const exists = sectionEngines.some((e) => e.id === block.section_engine?.id);
    return exists ? sectionEngines : [...sectionEngines, block.section_engine];
  }, [sectionEngines, block?.section_engine]);

  const selectedEngine = enginesForSelect.find((e) => e.id === sectionEngineId);
  const motorLabel = selectedEngine?.name ?? selectedEngine?.code ?? block?.section_engine?.name ?? block?.section_engine?.code ?? 'Motor';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar bloque de motor</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {block && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de motor</InputLabel>
              <Select
                value={sectionEngineId ?? ''}
                label="Tipo de motor"
                onChange={(e) => setSectionEngineId(e.target.value === '' ? null : Number(e.target.value))}
              >
                {enginesForSelect.map((eng) => (
                  <MenuItem key={eng.id} value={eng.id}>
                    {eng.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Nombre"
              helperText="Se muestra cuando el bloque está colapsado en la vista de usuario final"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={motorLabel}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isCollapsible}
                  onChange={(e) => setIsCollapsible(e.target.checked)}
                />
              }
              label="Colapsable en vista de usuario final"
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
