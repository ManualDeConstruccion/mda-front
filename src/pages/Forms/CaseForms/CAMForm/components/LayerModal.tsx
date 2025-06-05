import React, { useState, useEffect } from 'react';
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
  IconButton,
  Modal,
  Box as MuiBox,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ayuda_coeficientes_de_junta from '../assets/ayuda_coeficientes_de_junta.png';

export interface LayerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (layer: any) => void;
  initialData?: any;
  mode: 'add' | 'edit';
  position?: number | 'anterior' | 'posterior';
  isFirstLayer?: boolean;
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

const MATERIALS_CARB = ['MAD', 'TAB', 'OSB'];
const MATERIALS_DENSITY = ['LDR', 'LDV'];
const MATERIALS_THICKNESS = ['PYC', 'PYF', 'FBC', 'FBS'];

export const LayerModal: React.FC<LayerModalProps> = ({ open, onClose, onSave, initialData, mode, position, isFirstLayer }) => {
  const [formData, setFormData] = useState<any>(initialData || {
    material: '',
    thickness: '',
    apparent_density: '',
    carbonization_rate: '',
    joint_coefficient: '',
    has_rf_plaster: false,
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    setFormData(initialData || {
      material: '',
      thickness: '',
      apparent_density: '',
      carbonization_rate: '',
      joint_coefficient: '',
      has_rf_plaster: false,
    });
  }, [initialData, open]);

  // Lógica dinámica de campos y valores forzados
  useEffect(() => {
    // MATERIALS_DENSITY: no carbonization_rate
    if (MATERIALS_DENSITY.includes(formData.material)) {
      setFormData((prev: any) => ({
        ...prev,
        carbonization_rate: '',
      }));
    }
    // MATERIALS_CARB: carbonization_rate obligatorio, default 0.65
    if (MATERIALS_CARB.includes(formData.material)) {
      setFormData((prev: any) => ({
        ...prev,
        carbonization_rate: prev.carbonization_rate || 0.65,
      }));
    }
    // MATERIALS_THICKNESS: no carbonization_rate
    if (MATERIALS_THICKNESS.includes(formData.material)) {
      setFormData((prev: any) => ({
        ...prev,
        carbonization_rate: '',
      }));
    }
    // Si cambia a material que no es density, limpiar apparent_density
    if (!MATERIALS_DENSITY.includes(formData.material)) {
      setFormData((prev: any) => ({ ...prev, apparent_density: '' }));
    }
    // Si cambia a material que no es PYC, limpiar has_rf_plaster
    if (formData.material !== 'PYC') {
      setFormData((prev: any) => ({ ...prev, has_rf_plaster: false }));
    }
  }, [formData.material]);

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

  // Validación antes de guardar
  const validate = () => {
    const newErrors: any = {};
    if (!formData.material) newErrors.material = 'Seleccione un material';
    if (!formData.thickness || isNaN(Number(formData.thickness)) || Number(formData.thickness) <= 0) newErrors.thickness = 'Espesor requerido';
    if (MATERIALS_CARB.includes(formData.material) && (!formData.carbonization_rate || isNaN(Number(formData.carbonization_rate)))) newErrors.carbonization_rate = 'Tasa de carbonización requerida';
    if (MATERIALS_DENSITY.includes(formData.material) && (!formData.apparent_density || isNaN(Number(formData.apparent_density)))) newErrors.apparent_density = 'Densidad requerida';
    if (!formData.joint_coefficient || isNaN(Number(formData.joint_coefficient))) newErrors.joint_coefficient = 'Coeficiente requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    // Forzar valores según reglas antes de guardar
    let data = { ...formData };
    
    // Si es la primera capa, forzar posición 'anterior'
    if (isFirstLayer) {
      data.position = 'anterior';
    } else {
      data.position = position;
    }

    // Manejar campos específicos según el material
    if (MATERIALS_DENSITY.includes(formData.material)) {
      // Para materiales aislantes, asegurarse de que apparent_density tenga un valor
      data.apparent_density = formData.apparent_density || null;
      data.carbonization_rate = null;
    } else if (MATERIALS_CARB.includes(formData.material)) {
      data.carbonization_rate = data.carbonization_rate || 0.65;
      data.apparent_density = null;
    } else if (MATERIALS_THICKNESS.includes(formData.material)) {
      data.carbonization_rate = null;
      data.apparent_density = null;
    } else {
      data.carbonization_rate = null;
      data.apparent_density = null;
    }

    // Remover campos calculados que no deben enviarse
    delete data.total_calculated_time;
    delete data.base_time;
    delete data.position_coefficient_exp;
    delete data.position_coefficient_noexp;
    delete data.is_insulation; // Este campo se calcula en el backend
    delete data.is_protection_layer; // Este campo se calcula en el backend

    console.log('Datos finales enviados:', data);
    onSave(data);
    onClose();
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'add' ? 'Agregar Capa' : 'Editar Capa'}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>Material</InputLabel>
          <Select
            name="material"
            value={formData.material}
            onChange={handleSelectChange as any}
            label="Material"
            error={!!errors.material}
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
          error={!!errors.thickness}
          helperText={errors.thickness}
        />
        {/* carbonization_rate solo para MAD, TAB, OSB */}
        {MATERIALS_CARB.includes(formData.material) && (
          <TextField
            margin="normal"
            label="Tasa de carbonización (mm/min)"
            name="carbonization_rate"
            type="number"
            value={formData.carbonization_rate}
            onChange={handleChange}
            fullWidth
            error={!!errors.carbonization_rate}
            helperText={errors.carbonization_rate}
          />
        )}
        {/* apparent_density solo para LDR, LDV */}
        {MATERIALS_DENSITY.includes(formData.material) && (
          <TextField
            margin="normal"
            label="Densidad aparente (kg/m³)"
            name="apparent_density"
            type="number"
            value={formData.apparent_density}
            onChange={handleChange}
            fullWidth
            error={!!errors.apparent_density}
            helperText={errors.apparent_density}
          />
        )}
        <MuiBox display="flex" alignItems="center">
          <TextField
            margin="normal"
            label="Coeficiente de junta"
            name="joint_coefficient"
            type="number"
            value={formData.joint_coefficient}
            onChange={handleChange}
            fullWidth
            error={!!errors.joint_coefficient}
            helperText={errors.joint_coefficient}
          />
          <IconButton onClick={() => setHelpOpen(true)} sx={{ ml: 1 }}>
            <HelpOutlineIcon />
          </IconButton>
        </MuiBox>
        {/* has_rf_plaster solo para PYC */}
        {formData.material === 'PYC' && (
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.has_rf_plaster}
                onChange={handleChange}
                name="has_rf_plaster"
              />
            }
            label="Placa de yeso cartón RF"
          />
        )}
        {/* Modal de ayuda para coeficiente de junta */}
        <Modal open={helpOpen} onClose={() => setHelpOpen(false)}>
          <MuiBox sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', boxShadow: 24, p: 2 }}>
            <img src={ayuda_coeficientes_de_junta} alt="Ayuda coeficiente de junta" style={{ maxWidth: 500, width: '100%' }} />
          </MuiBox>
        </Modal>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">{mode === 'add' ? 'Agregar' : 'Guardar Cambios'}</Button>
      </DialogActions>
    </Dialog>
  );
}; 