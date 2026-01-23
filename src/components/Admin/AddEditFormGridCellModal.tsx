import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface FormGridCellStyle {
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: 'lightblue' | 'transparent';
  fontWeight?: 'normal' | 'bold';
  cellType?: 'normal' | 'title';
}

interface FormGridCell {
  id: number;
  category: number;
  grid_row: number;
  grid_column: number;
  grid_span: number;
  content: string;
  style?: FormGridCellStyle | any;
  is_active: boolean;
}

interface AddEditFormGridCellModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryId: number;
  maxRow: number;
  initialData?: {
    row: number;
    column: number;
    span: number;
    content: string;
  } | null;
  editingCell?: FormGridCell | null;
}

const AddEditFormGridCellModal: React.FC<AddEditFormGridCellModalProps> = ({
  open,
  onClose,
  onSuccess,
  categoryId,
  maxRow,
  initialData,
  editingCell,
}) => {
  const { accessToken } = useAuth();
  const [row, setRow] = useState(initialData?.row || 1);
  const [column, setColumn] = useState(initialData?.column || 1);
  const [span, setSpan] = useState(initialData?.span || 1);
  const [content, setContent] = useState(initialData?.content || '');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [hasLightBlueBackground, setHasLightBlueBackground] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [cellType, setCellType] = useState<'normal' | 'title'>('normal');
  const [error, setError] = useState<string | null>(null);

  // Resetear valores cuando cambia el modal o los datos iniciales
  useEffect(() => {
    if (editingCell) {
      setRow(editingCell.grid_row);
      setColumn(editingCell.grid_column);
      setSpan(editingCell.grid_span);
      setContent(editingCell.content);
      // Cargar estilos del objeto style
      const style = editingCell.style || {};
      setTextAlign(style.textAlign || 'left');
      setHasLightBlueBackground(style.backgroundColor === 'lightblue');
      setIsBold(style.fontWeight === 'bold');
      setCellType(style.cellType || 'normal');
    } else if (initialData) {
      setRow(initialData.row);
      setColumn(initialData.column);
      setSpan(initialData.span);
      setContent(initialData.content);
      // Valores por defecto para nuevos elementos
      setTextAlign('left');
      setHasLightBlueBackground(false);
      setIsBold(false);
      setCellType('normal');
    } else {
      setRow(1);
      setColumn(1);
      setSpan(1);
      setContent('');
      // Valores por defecto
      setTextAlign('left');
      setHasLightBlueBackground(false);
      setIsBold(false);
      setCellType('normal');
    }
    setError(null);
  }, [open, editingCell, initialData]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);

    if (!content.trim()) {
      setError('El contenido no puede estar vacío');
      return;
    }

    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

      // Construir objeto de estilo
      const style: FormGridCellStyle = {
        textAlign: textAlign,
        backgroundColor: hasLightBlueBackground ? 'lightblue' : 'transparent',
        fontWeight: isBold ? 'bold' : 'normal',
        cellType: cellType,
      };

      if (editingCell) {
        // Actualizar celda existente
        await axios.patch(
          `${API_URL}/api/parameters/form-grid-cells/${editingCell.id}/`,
          {
            grid_row: row,
            grid_column: column,
            grid_span: span,
            content: content.trim(),
            style: style,
          },
          {
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
            withCredentials: true,
          }
        );
      } else {
        // Crear nueva celda
        await axios.post(
          `${API_URL}/api/parameters/form-grid-cells/`,
          {
            category: categoryId,
            grid_row: row,
            grid_column: column,
            grid_span: span,
            content: content.trim(),
            style: style,
            is_active: true,
          },
          {
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : undefined,
            },
            withCredentials: true,
          }
        );
      }

      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error al guardar celda de texto:', error);
      setError(
        error.response?.data?.detail ||
        error.response?.data?.content?.[0] ||
        'Error al guardar la celda de texto'
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {editingCell ? 'Editar Celda de Texto' : 'Agregar Celda de Texto'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'error.light',
                color: 'error.contrastText',
                borderRadius: 1,
                fontSize: '0.875rem',
              }}
            >
              {error}
            </Box>
          )}
          <TextField
            label="Fila"
            type="number"
            value={row}
            onChange={(e) => setRow(Number(e.target.value))}
            inputProps={{ min: 1, max: maxRow + 10 }}
            fullWidth
            required
          />
          <TextField
            label="Columna"
            type="number"
            value={column}
            onChange={(e) => setColumn(Number(e.target.value))}
            inputProps={{ min: 1, max: 8 }}
            fullWidth
            required
          />
          <TextField
            label="Ancho (columnas)"
            type="number"
            value={span}
            onChange={(e) => setSpan(Number(e.target.value))}
            inputProps={{ min: 1, max: 8 }}
            fullWidth
            required
          />
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="subtitle2" fontWeight="bold">
            Estilo del Texto
          </Typography>
          
          <FormControl fullWidth>
            <InputLabel>Tipo de Celda</InputLabel>
            <Select
              value={cellType}
              label="Tipo de Celda"
              onChange={(e) => setCellType(e.target.value as 'normal' | 'title')}
            >
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="title">Título</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Alineación</InputLabel>
            <Select
              value={textAlign}
              label="Alineación"
              onChange={(e) => setTextAlign(e.target.value as 'left' | 'center' | 'right')}
            >
              <MenuItem value="left">Izquierda</MenuItem>
              <MenuItem value="center">Centro</MenuItem>
              <MenuItem value="right">Derecha</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={hasLightBlueBackground}
                onChange={(e) => setHasLightBlueBackground(e.target.checked)}
              />
            }
            label="Fondo celeste"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={isBold}
                onChange={(e) => setIsBold(e.target.checked)}
              />
            }
            label="Negrita"
          />
          
          <Divider sx={{ my: 1 }} />
          
          <TextField
            label="Contenido"
            multiline
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            required
            error={!!error && !content.trim()}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!content.trim()}
        >
          {editingCell ? 'Guardar' : 'Agregar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditFormGridCellModal;
