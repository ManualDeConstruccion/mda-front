import React from 'react';
import {
  TextField,
  FormControlLabel,
  Switch,
  Box,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

export type ParameterDataType = 'decimal' | 'integer' | 'boolean' | 'text' | 'date';

interface ParameterInputProps {
  dataType: ParameterDataType;
  value: any;
  onChange: (value: any) => void;
  label?: string;
  unit?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const ParameterInput: React.FC<ParameterInputProps> = ({
  dataType,
  value,
  onChange,
  label,
  unit,
  required = false,
  error = false,
  helperText,
  disabled = false,
}) => {
  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  switch (dataType) {
    case 'decimal':
      return (
        <TextField
          type="number"
          label={label}
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : parseFloat(e.target.value);
            handleChange(val);
          }}
          required={required}
          error={error}
          helperText={helperText}
          disabled={disabled}
          fullWidth
          inputProps={{
            step: '0.01',
          }}
          InputProps={{
            endAdornment: unit ? (
              <InputAdornment position="end">{unit}</InputAdornment>
            ) : undefined,
          }}
        />
      );

    case 'integer':
      return (
        <TextField
          type="number"
          label={label}
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
            handleChange(val);
          }}
          required={required}
          error={error}
          helperText={helperText}
          disabled={disabled}
          fullWidth
          inputProps={{
            step: 1,
          }}
          InputProps={{
            endAdornment: unit ? (
              <InputAdornment position="end">{unit}</InputAdornment>
            ) : undefined,
          }}
        />
      );

    case 'boolean':
      return (
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={value ?? false}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={disabled}
              />
            }
            label={label}
            required={required}
          />
          {helperText && (
            <Box
              sx={{
                mt: 0.5,
                ml: 1.5,
                fontSize: '0.75rem',
                color: error ? 'error.main' : 'text.secondary',
              }}
            >
              {helperText}
            </Box>
          )}
        </Box>
      );

    case 'text':
      return (
        <TextField
          type="text"
          label={label}
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          required={required}
          error={error}
          helperText={helperText}
          disabled={disabled}
          fullWidth
          multiline
          rows={2}
        />
      );

    case 'date':
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <DatePicker
            label={label}
            value={value ? new Date(value) : null}
            onChange={(newValue) => {
              handleChange(newValue ? newValue.toISOString().split('T')[0] : null);
            }}
            disabled={disabled}
            slotProps={{
              textField: {
                required,
                error,
                helperText,
                fullWidth: true,
              },
            }}
          />
        </LocalizationProvider>
      );

    default:
      return (
        <TextField
          label={label}
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          required={required}
          error={error}
          helperText={helperText || `Tipo de dato no soportado: ${dataType}`}
          disabled={disabled}
          fullWidth
        />
      );
  }
};

export default ParameterInput;