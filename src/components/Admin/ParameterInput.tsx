import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  Box,
  InputAdornment,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export type ParameterDataType = 'decimal' | 'integer' | 'boolean' | 'text' | 'date';

/** Configuración de un origen de opciones (desde API option-sources) */
interface OptionSourceConfig {
  code: string;
  endpoint_path: string;
  filter_query_param: string;
  name: string;
}

/** Opción genérica con id y label (region, comuna, etc.) */
interface OptionItem {
  id: number;
  [key: string]: unknown;
}


interface ParameterInputProps {
  dataType: ParameterDataType;
  value: any;
  /** Se puede pasar opción seleccionada (objeto completo) para que el padre aplique form_rules (ej. value_source "region"). */
  onChange: (value: any, selectedOption?: any) => void;
  label?: string;
  unit?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  /** Si es true, solo se llama onChange al perder foco (onBlur), no en cada tecla */
  persistOnBlur?: boolean;
  /** Origen de opciones para selector (ej. 'region', 'comuna'). Si está definido y dataType es 'text', se muestra Autocomplete. */
  optionsSource?: string | null;
  /** Códigos de parámetros que filtran las opciones (ej. ['propiedad_region'] para comuna). */
  optionsFilterBy?: string[];
  /** Valores actuales del formulario por código de parámetro; se usan para filtrar (ej. región seleccionada). */
  filterValues?: Record<string, unknown>;
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
  optionsSource,
  optionsFilterBy = [],
  filterValues = {},
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const displayValue = persistOnBlur ? localValue : value;
  const handleChange = (newValue: any, selectedOption?: any) => {
    if (persistOnBlur) {
      setLocalValue(newValue);
    } else {
      onChange(newValue, selectedOption);
    }
  };
  const handleBlur = () => {
    if (persistOnBlur) {
      const option = isSelector && localValue != null ? valueToOption(localValue) ?? undefined : undefined;
      onChange(localValue, option);
    }
  };

  const filterParamCode = optionsFilterBy[0];
  const filterParamValue = filterParamCode != null ? filterValues[filterParamCode] : undefined;
  const filterValue = filterParamValue !== undefined && filterParamValue !== null && filterParamValue !== ''
    ? Number(filterParamValue)
    : null;

  const hasOptionsSource = !!(dataType === 'text' && optionsSource && optionsSource.trim());

  const { data: optionSourcesList } = useQuery<OptionSourceConfig[]>({
    queryKey: ['option-sources'],
    queryFn: async () => {
      const res = await api.get<OptionSourceConfig[]>('parameters/option-sources/');
      return res.data;
    },
    enabled: hasOptionsSource,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const sourceConfig = hasOptionsSource && optionSourcesList
    ? optionSourcesList.find((s) => s.code === optionsSource?.trim())
    : null;

  const optionsQuery = useQuery<OptionItem[]>({
    queryKey: ['option-source-data', optionsSource, sourceConfig?.endpoint_path, filterValue],
    queryFn: async () => {
      if (!sourceConfig) return [];
      const params: Record<string, number> = {};
      if (sourceConfig.filter_query_param && filterValue != null) {
        params[sourceConfig.filter_query_param] = filterValue;
      }
      const path = sourceConfig.endpoint_path.replace(/^\/+/, '');
      const res = await api.get<OptionItem[]>(path, {
        params: Object.keys(params).length ? params : undefined,
      });
      return res.data;
    },
    enabled: hasOptionsSource && !!sourceConfig,
    staleTime: 10 * 60 * 1000,
  });

  const isSelector = hasOptionsSource && !!sourceConfig;
  const options = (optionsQuery.data ?? []) as OptionItem[];
  const loading = optionsQuery.isLoading;

  const labelKey = optionsSource === 'region' ? 'region' : optionsSource === 'comuna' ? 'comuna' : 'name';
  const getOptionLabel = (opt: OptionItem) => {
    const label = opt[labelKey];
    return typeof label === 'string' ? label : String(opt.id);
  };
  const getOptionKey = (opt: OptionItem) => String(opt.id);
  const valueToOption = (val: unknown): OptionItem | null => {
    if (val === null || val === undefined || val === '') return null;
    const id = typeof val === 'number' ? val : Number(val);
    if (Number.isNaN(id)) return null;
    const found = options.find((o) => o.id === id);
    return found ?? null;
  };
  const selectedOption = valueToOption(displayValue);

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

    case 'boolean': {
      const boolValue = persistOnBlur ? localValue : value;
      const selected = boolValue === null || boolValue === undefined ? 'na' : boolValue ? 'yes' : 'no';
      return (
        <Box>
          <FormControl component="fieldset" disabled={disabled} error={error}>
            {label && (
              <Box component="span" sx={{ display: 'block', mb: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>
                {label}
                {required && ' *'}
              </Box>
            )}
            <RadioGroup
              row
              value={selected}
              onChange={(e) => {
                const v = e.target.value as 'na' | 'yes' | 'no';
                const newValue: boolean | null = v === 'na' ? null : v === 'yes';
                if (persistOnBlur) {
                  setLocalValue(newValue);
                  onChange(newValue);
                } else {
                  onChange(newValue);
                }
              }}
              onBlur={persistOnBlur ? handleBlur : undefined}
            >
              <FormControlLabel value="na" control={<Radio size="small" />} label="No aplica" />
              <FormControlLabel value="yes" control={<Radio size="small" />} label="Sí" />
              <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
            </RadioGroup>
          </FormControl>
          {helperText && (
            <Box
              sx={{
                mt: 0.5,
                fontSize: '0.75rem',
                color: error ? 'error.main' : 'text.secondary',
              }}
            >
              {helperText}
            </Box>
          )}
        </Box>
      );
    }

    case 'text':
      if (isSelector) {
        return (
          <Autocomplete<OptionItem, false, false>
            fullWidth
            options={options}
            getOptionLabel={getOptionLabel}
            value={selectedOption}
            onChange={(_, newValue) => {
              handleChange(newValue?.id ?? null, newValue ?? undefined);
            }}
            onBlur={handleBlur}
            loading={loading}
            disabled={disabled}
            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
            renderOption={(props, option) => (
              <li {...props} key={getOptionKey(option)}>
                {getOptionLabel(option)}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                required={required}
                error={error}
                helperText={helperText}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        );
      }
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