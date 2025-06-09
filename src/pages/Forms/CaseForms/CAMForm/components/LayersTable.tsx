import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export interface LayersTableProps {
  layers: any[];
  onEdit: (layer: any) => void;
  onDelete: (layer: any) => void;
  readOnlyBaseLayers?: boolean;
}

const MATERIAL_LABELS: Record<string, string> = {
  PYC: 'Placas de yeso‑cartón',
  PYF: 'Placas de yeso‑fibra',
  MAD: 'Madera aserrada, madera contralaminada, LVL',
  TAB: 'Tableros de partículas, Tableros de fibra',
  OSB: 'OSB, contrachapados',
  LDR: 'Aislación de lana de roca con ρ ≥ 26 kg/m³',
  LDV: 'Aislación de lana de vidrio con ρ ≥ 11 kg/m³',
  FBC: 'Fibrocemento',
  FBS: 'Tipo Fibrosilicato',
};

export const LayersTable: React.FC<LayersTableProps> = ({ layers, onEdit, onDelete, readOnlyBaseLayers }) => (
  <TableContainer component={Paper} sx={{ mt: 2 }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Posición</TableCell>
          <TableCell>Material</TableCell>
          <TableCell>Tipo</TableCell>
          <TableCell>Espesor (mm)</TableCell>
          <TableCell>Densidad (kg/m³)</TableCell>
          <TableCell>Tasa Carb. (mm/min)</TableCell>
          <TableCell>Coef. Junta</TableCell>
          <TableCell>Tiempo Base (min)</TableCell>
          <TableCell>kₚₒₛ,ₑₓₚ</TableCell>
          <TableCell>kₚₒₛ,ₙₒₑₓₚ</TableCell>
          <TableCell>Tiempo Total (min)</TableCell>
          <TableCell>Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {layers.map((layer, idx) => {
          const isReadOnly = readOnlyBaseLayers && layer.is_base_layer;
          return (
            <TableRow key={layer.id || idx}>
              <TableCell>{layer.position ?? idx + 1}</TableCell>
              <TableCell>{MATERIAL_LABELS[layer.material] || layer.material}</TableCell>
              <TableCell>{layer.is_protection_layer ? 'Protección' : 'Aislación'}</TableCell>
              <TableCell>{layer.thickness?.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</TableCell>
              <TableCell>{layer.apparent_density?.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '-'}</TableCell>
              <TableCell>{layer.carbonization_rate?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</TableCell>
              <TableCell>{layer.joint_coefficient?.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</TableCell>
              <TableCell>{layer.base_time?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>{layer.position_coefficient_exp?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</TableCell>
              <TableCell>{layer.position_coefficient_noexp?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</TableCell>
              <TableCell>{layer.total_calculated_time?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</TableCell>
              <TableCell>
                <Box display="flex" gap={1}>
                  <IconButton onClick={() => onEdit(layer)} size="small" color="primary" disabled={isReadOnly}><EditIcon /></IconButton>
                  <IconButton onClick={() => onDelete(layer.id)} size="small" color="error" disabled={isReadOnly}><DeleteIcon /></IconButton>
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
); 