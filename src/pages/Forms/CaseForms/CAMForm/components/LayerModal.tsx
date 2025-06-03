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

export const LayerModal: React.FC<LayerModalProps> = ({ open, onClose, onSave, initialData, mode, position }) => {
  const [formData, setFormData] = useState<any>(initialData || {
    material: '',
    thickness: '',
    apparent_density: '',
    carbonization_rate: '',
    joint_coefficient: '',
    is_protection_layer: false,
    is_insulation: false,
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
      is_protection_layer: false,
      is_insulation: false,
    });
  }, [initialData, open]);

  // Lógica dinámica de campos y valores forzados
  useEffect(() => {
    // MATERIALS_DENSITY: is_insulation true, is_protection_layer false, no carbonization_rate
    if (MATERIALS_DENSITY.includes(formData.material)) {
      setFormData((prev: any) => ({
        ...prev,
        is_insulation: true,
        is_protection_layer: false,
        carbonization_rate: '',
      }));
    }
    // MATERIALS_CARB: carbonization_rate obligatorio, default 0.65, is_insulation false
    if (MATERIALS_CARB.includes(formData.material)) {
      setFormData((prev: any) => ({
        ...prev,
        carbonization_rate: prev.carbonization_rate || 0.65,
        is_insulation: false,
      }));
    }
    // MATERIALS_THICKNESS: no carbonization_rate, no is_insulation
    if (MATERIALS_THICKNESS.includes(formData.material)) {
      setFormData((prev: any) => ({
        ...prev,
        carbonization_rate: '',
        is_insulation: false,
      }));
    }
    // Si cambia a material que no es density, limpiar apparent_density
    if (!MATERIALS_DENSITY.includes(formData.material)) {
      setFormData((prev: any) => ({ ...prev, apparent_density: '' }));
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
    let data = { ...formData, position };
    if (MATERIALS_DENSITY.includes(formData.material)) {
      data.is_insulation = true;
      data.is_protection_layer = false;
      data.carbonization_rate = '';
    }
    if (MATERIALS_CARB.includes(formData.material)) {
      data.is_insulation = false;
      data.carbonization_rate = data.carbonization_rate || 0.65;
    }
    if (MATERIALS_THICKNESS.includes(formData.material)) {
      data.is_insulation = false;
      data.carbonization_rate = '';
    }
    if (!MATERIALS_DENSITY.includes(formData.material)) {
      data.apparent_density = '';
    }
    // --- AJUSTE: Enviar null en vez de '' para campos no requeridos ---
    if (data.apparent_density === '' || data.apparent_density === undefined) {
      data.apparent_density = null;
    }
    if (data.carbonization_rate === '' || data.carbonization_rate === undefined) {
      data.carbonization_rate = null;
    }
    // ---------------------------------------------------------------
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
        {/* is_protection_layer solo para materiales que no sean density */}
        {!MATERIALS_DENSITY.includes(formData.material) && (
          <FormControlLabel
            control={<Checkbox checked={formData.is_protection_layer} onChange={handleChange} name="is_protection_layer" />}
            label="Capa de protección"
          />
        )}
        {/* is_insulation solo para density, pero forzado a true y deshabilitado */}
        {MATERIALS_DENSITY.includes(formData.material) && (
          <FormControlLabel
            control={<Checkbox checked={true} disabled name="is_insulation" />}
            label="Material aislante"
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