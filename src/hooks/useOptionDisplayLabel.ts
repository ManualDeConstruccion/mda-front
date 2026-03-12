import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface OptionSourceConfig {
  code: string;
  endpoint_path: string;
  filter_query_param: string;
  name: string;
}

interface OptionItem {
  id: number;
  [key: string]: unknown;
}

/**
 * Resuelve un valor (id) a la etiqueta de visualización para parámetros con options_source.
 * Usado en modo vista para mostrar el nombre (ej. comuna, región) en lugar del id.
 */
export function useOptionDisplayLabel(
  optionsSource: string | null | undefined,
  optionsFilterBy: string[],
  filterValues: Record<string, unknown>,
  value: unknown
): { displayLabel: string; isLoading: boolean } {
  const shouldResolve =
    !!optionsSource?.trim() &&
    value !== null &&
    value !== undefined &&
    value !== '' &&
    !Number.isNaN(Number(value));

  const { data: optionSourcesList } = useQuery<OptionSourceConfig[]>({
    queryKey: ['option-sources'],
    queryFn: async () => {
      const res = await api.get<OptionSourceConfig[]>('parameters/option-sources/');
      return res.data;
    },
    enabled: shouldResolve,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const sourceConfig = shouldResolve && optionSourcesList
    ? optionSourcesList.find((s) => s.code === optionsSource?.trim())
    : null;

  const filterParamCode = optionsFilterBy[0];
  const filterParamValue = filterParamCode != null ? filterValues[filterParamCode] : undefined;
  const filterValue =
    filterParamValue !== undefined && filterParamValue !== null && filterParamValue !== ''
      ? Number(filterParamValue)
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
    enabled: shouldResolve && !!sourceConfig,
    staleTime: 10 * 60 * 1000,
  });

  if (!shouldResolve) {
    return {
      displayLabel: value === null || value === undefined ? '' : String(value),
      isLoading: false,
    };
  }

  const options = (optionsQuery.data ?? []) as OptionItem[];
  const id = typeof value === 'number' ? value : Number(value);
  const option = options.find((o) => o.id === id);
  const labelKey =
    optionsSource === 'region' ? 'region' : optionsSource === 'comuna' ? 'comuna' : 'name';
  const displayLabel = option
    ? (typeof option[labelKey] === 'string' ? option[labelKey] : String(option.id))
    : String(value);

  return {
    displayLabel,
    isLoading: optionsQuery.isLoading,
  };
}
