import React, { useState, useEffect } from 'react';
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
  /** Si es true, solo se llama onChange al perder foco (onBlur), no en cada tecla */
  persistOnBlur?: boolean;
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
  persistOnBlur = false,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const displayValue = persistOnBlur ? localValue : value;
  const handleChange = (newValue: any) => {
    if (persistOnBlur) {
      setLocalValue(newValue);
    } else {
      onChange(newValue);
    }
  };
  const handleBlur = () => {
    if (persistOnBlur) {
      onChange(localValue);
    }
  };

  switch (dataType) {
    case 'decimal':
      return (
        <TextField
          type="number"
          label={label}
          value={displayValue ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : parseFloat(e.target.value);
            handleChange(val);
          }}
          onBlur={handleBlur}
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
          value={displayValue ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
            handleChange(val);
          }}
          onBlur={handleBlur}
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
                checked={(persistOnBlur ? localValue : value) ?? false}
                onChange={(e) => {
                  const v = e.target.checked;
                  if (persistOnBlur) {
                    setLocalValue(v);
                    onChange(v);
                  } else {
                    onChange(v);
                  }
                }}
                onBlur={persistOnBlur ? handleBlur : undefined}
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
          value={displayValue ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
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
            value={(displayValue ? new Date(displayValue) : null) as any}
            onChange={(newValue) => {
              handleChange(newValue ? newValue.toISOString().split('T')[0] : null);
            }}
            onClose={persistOnBlur ? () => onChange(localValue) : undefined}
            disabled={disabled}
            slotProps={{
              textField: {
                required,
                error,
                helperText,
                fullWidth: true,
                onBlur: persistOnBlur ? handleBlur : undefined,
              },
            }}
          />
        </LocalizationProvider>
      );

    default:
      return (
        <TextField
          label={label}
          value={displayValue ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
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