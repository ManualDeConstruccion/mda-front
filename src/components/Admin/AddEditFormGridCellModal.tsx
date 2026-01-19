import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface FormGridCell {
  id: number;
  category: number;
  grid_row: number;
  grid_column: number;
  grid_span: number;
  content: string;
  style?: any;
  order: number;
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
  const [error, setError] = useState<string | null>(null);

  // Resetear valores cuando cambia el modal o los datos iniciales
  useEffect(() => {
    if (editingCell) {
      setRow(editingCell.grid_row);
      setColumn(editingCell.grid_column);
      setSpan(editingCell.grid_span);
      setContent(editingCell.content);
    } else if (initialData) {
      setRow(initialData.row);
      setColumn(initialData.column);
      setSpan(initialData.span);
      setContent(initialData.content);
    } else {
      setRow(1);
      setColumn(1);
      setSpan(1);
      setContent('');
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

      if (editingCell) {
        // Actualizar celda existente
        await axios.patch(
          `${API_URL}/api/parameters/form-grid-cells/${editingCell.id}/`,
          {
            grid_row: row,
            grid_column: column,
            grid_span: span,
            content: content.trim(),
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
            order: 0,
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
            inputProps={{ min: 1, max: 5 }}
            fullWidth
            required
          />
          <TextField
            label="Ancho (columnas)"
            type="number"
            value={span}
            onChange={(e) => setSpan(Number(e.target.value))}
            inputProps={{ min: 1, max: 5 }}
            fullWidth
            required
          />
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
