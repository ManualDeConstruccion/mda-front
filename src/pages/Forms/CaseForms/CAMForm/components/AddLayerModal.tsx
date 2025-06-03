import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

export interface AddLayerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (layer: any) => void;
  position?: number | 'anterior' | 'posterior';
  initialData?: any;
  solutionId?: number;
}

const MATERIAL_OPTIONS = [
  { value: 'PYC', label: 'Placas de yeso‑cartón' },
  { value: 'PYF', label: 'Placas de yeso‑fibra' },
  { value: 'MAD', label: 'Madera aserrada, madera contralaminada, LVL' },
  { value: 'TAB', label: 'Tableros de partículas, Tableros de fibra' },
  { value: 'OSB', label: 'OSB, contrachapados' },
  { value: 'LDR', label: 'Aislación de lana de roca con ρ ≥ 26 kg/m³' },
  { value: 'LDV', label: 'Aislación de lana de vidrio con ρ ≥ 11 kg/m³' },
  { value: 'FBC', label: 'Fibrocemento' },
  { value: 'FBS', label: 'Tipo Fibrosilicato' },
];

export const AddLayerModal: React.FC<AddLayerModalProps> = ({ open, onClose, onSave, position, initialData }) => {
  const [formData, setFormData] = React.useState<any>(initialData || {
    material: '',
    thickness: '',
    apparent_density: '',
    carbonization_rate: '',
    joint_coefficient: '',
    is_protection_layer: false,
    is_insulation: false,
  });

  React.useEffect(() => {
    setFormData(initialData || {
      material: '',
      thickness: '',
      apparent_density: '',
      carbonization_rate: '',
      joint_coefficient: '',
      is_protection_layer: false,
      is_insulation: false,
    });
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setFormData((prev: any) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<{ value: unknown; name?: string }>) => {
    const name = e.target.name || 'material';
    setFormData((prev: any) => ({ ...prev, [name]: e.target.value }));
  };

  const handleSubmit = () => {
    onSave({ ...formData, position });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Editar Capa' : 'Agregar Capa'}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>Material</InputLabel>
          <Select
            name="material"
            value={formData.material}
            onChange={handleSelectChange as any}
            label="Material"
          >
            {MATERIAL_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          margin="normal"
          label="Espesor (mm)"
          name="thickness"
          type="number"
          value={formData.thickness}
          onChange={handleChange}
          fullWidth
        />
        {(formData.material === 'lana_mineral' || formData.material === 'lana_vidrio') && (
          <TextField
            margin="normal"
            label="Densidad aparente (kg/m³)"
            name="apparent_density"
            type="number"
            value={formData.apparent_density}
            onChange={handleChange}
            fullWidth
          />
        )}
        <TextField
          margin="normal"
          label="Tasa de carbonización (mm/min)"
          name="carbonization_rate"
          type="number"
          value={formData.carbonization_rate}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          margin="normal"
          label="Coeficiente de junta"
          name="joint_coefficient"
          type="number"
          value={formData.joint_coefficient}
          onChange={handleChange}
          fullWidth
        />
        <FormControlLabel
          control={<Checkbox checked={formData.is_protection_layer} onChange={handleChange} name="is_protection_layer" />}
          label="Capa de protección"
        />
        <FormControlLabel
          control={<Checkbox checked={formData.is_insulation} onChange={handleChange} name="is_insulation" />}
          label="Material aislante"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">{initialData ? 'Guardar Cambios' : 'Agregar'}</Button>
      </DialogActions>
    </Dialog>
  );
}; 