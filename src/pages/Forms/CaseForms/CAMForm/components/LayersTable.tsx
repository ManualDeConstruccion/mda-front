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
  CAV: 'Cavidad vacía',
};

export const LayersTable: React.FC<LayersTableProps> = ({ layers, onEdit, onDelete, readOnlyBaseLayers }) => {
  // Ordenar por relative_position para coincidir con LayerVisualization
  const sortedLayers = [...layers].sort((a, b) => (a.relative_position ?? 0) - (b.relative_position ?? 0));
  // Precalcular labels: letra para CAV, número para el resto
  let cavLetter = 0;
  const labels = sortedLayers.map(layer => {
    if (layer.material === 'CAV') {
      return String.fromCharCode(97 + cavLetter++); // 'a', 'b', ...
    } else {
      return layer.position;
    }
  });

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Posición</TableCell>
            <TableCell>Material</TableCell>
            <TableCell>Protección RF</TableCell>
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
          {sortedLayers.map((layer, idx) => {
            const isReadOnly = readOnlyBaseLayers && layer.is_base_layer;
            return (
              <TableRow key={layer.id || idx}>
                <TableCell>{labels[idx]}</TableCell>
                <TableCell>{MATERIAL_LABELS[layer.material] || layer.material}</TableCell>
                <TableCell>{layer.material === 'CAV' ? '-' : (layer.has_rf_plaster ? 'Si' : 'No')}</TableCell>
                <TableCell>{layer.material === 'CAV' ? 'Cavidad' : (layer.is_protection_layer ? 'Protección' : 'Aislación')}</TableCell>
                <TableCell>{layer.thickness?.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</TableCell>
                <TableCell>{layer.material === 'CAV' ? '-' : (layer.apparent_density?.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '-')}</TableCell>
                <TableCell>{layer.material === 'CAV' ? '-' : (layer.carbonization_rate?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-')}</TableCell>
                <TableCell>{layer.material === 'CAV' ? '-' : (layer.joint_coefficient?.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }))}</TableCell>
                <TableCell>{layer.material === 'CAV' ? '-' : (layer.base_time?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</TableCell>
                <TableCell>{layer.material === 'CAV' ? '-' : (layer.position_coefficient_exp?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-')}</TableCell>
                <TableCell>{layer.material === 'CAV' ? '-' : (layer.position_coefficient_noexp?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-')}</TableCell>
                <TableCell>{layer.material === 'CAV' ? '-' : (layer.total_calculated_time?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-')}</TableCell>
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
}; 