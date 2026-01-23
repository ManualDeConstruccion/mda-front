// src/hooks/useFormParameters.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

// ============================================================================
// TYPES
// ============================================================================

export interface ParameterDefinition {
  id: number;
  code: string;
  name: string;
  data_type: 'decimal' | 'integer' | 'boolean' | 'text' | 'date';
  unit?: string;
  help_text?: string;
  form_pdf_code?: string;
}

export interface FormParameter {
  id: number;
  parameter_definition: ParameterDefinition;
  order: number;
  is_required: boolean;
  is_visible: boolean;
  grid_row?: number;
  grid_column?: number;
  grid_span?: number;
  display_config?: Record<string, any>;
}

export interface FormSection {
  id: number;
  code: string;
  number: string;
  name: string;
  description?: string;
  parent?: number;
  order: number;
  is_active: boolean;
  display_config?: Record<string, any>;
  form_type?: number;
  form_type_name?: string;
  form_parameters: FormParameter[];
  grid_cells?: any[];
  subcategories?: FormSection[];
}

export interface FormStructure {
  project_type: {
    id: number;
    code: string;
    name: string;
    description: string;
    category?: {
      id: number;
      code: string;
      name: string;
      full_path: string;
    };
  };
  sections: FormSection[];
}

export interface NodeParameter {
  id: number;
  node: number;
  definition: string; // code del ParameterDefinition
  value_decimal?: number | string;
  value_integer?: number;
  value_boolean?: boolean;
  value_text?: string;
  value_date?: string;
  source: 'manual' | 'calculated' | 'imported' | 'snapshot';
  calculated_at?: string;
}

// ============================================================================
// HOOK
// ============================================================================

interface UseFormParametersOptions {
  architectureProjectTypeId?: number;
  projectNodeId?: number;
  enabled?: boolean;
}

export const useFormParameters = (options: UseFormParametersOptions) => {
  const { architectureProjectTypeId, projectNodeId, enabled = true } = options;
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  // ============================================================================
  // 1. OBTENER ESTRUCTURA DEL FORMULARIO
  // ============================================================================

  const {
    data: formStructure,
    isLoading: isLoadingStructure,
    error: structureError,
  } = useQuery<FormStructure>({
    queryKey: ['form-structure', architectureProjectTypeId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/architecture/architecture-project-types/${architectureProjectTypeId}/form_structure/`,
        axiosConfig
      );
      return response.data;
    },
    enabled: enabled && !!accessToken && !!architectureProjectTypeId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // ============================================================================
  // 2. OBTENER VALORES DE PARÁMETROS
  // ============================================================================

  const {
    data: parameterValues,
    isLoading: isLoadingValues,
    error: valuesError,
    refetch: refetchValues,
  } = useQuery<NodeParameter[]>({
    queryKey: ['node-parameters', projectNodeId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/parameters/node-parameters/?node_id=${projectNodeId}`,
        axiosConfig
      );
      return response.data;
    },
    enabled: enabled && !!accessToken && !!projectNodeId,
    staleTime: 1000 * 60 * 2, // 2 minutos (los valores cambian más seguido)
  });

  // ============================================================================
  // 3. CREAR/ACTUALIZAR PARÁMETRO
  // ============================================================================

  const saveParameter = useMutation({
    mutationFn: async (data: {
      definition: string;
      value: any;
      dataType: 'decimal' | 'integer' | 'boolean' | 'text' | 'date';
    }) => {
      const { definition, value, dataType } = data;

      // Buscar si ya existe el parámetro
      const existing = parameterValues?.find(p => p.definition === definition);

      const payload: any = {
        node: projectNodeId,
        definition: definition,
        source: 'manual',
      };

      // Asignar valor según tipo de dato
      switch (dataType) {
        case 'decimal':
          payload.value_decimal = value;
          break;
        case 'integer':
          payload.value_integer = value;
          break;
        case 'boolean':
          payload.value_boolean = value;
          break;
        case 'text':
          payload.value_text = value;
          break;
        case 'date':
          payload.value_date = value;
          break;
      }

      if (existing) {
        // Actualizar existente
        const response = await axios.patch(
          `${API_URL}/api/parameters/node-parameters/${existing.id}/`,
          payload,
          axiosConfig
        );
        return response.data;
      } else {
        // Crear nuevo
        const response = await axios.post(
          `${API_URL}/api/parameters/node-parameters/`,
          payload,
          axiosConfig
        );
        return response.data;
      }
    },
    onSuccess: () => {
      // Invalidar cache para recargar valores
      queryClient.invalidateQueries({ queryKey: ['node-parameters', projectNodeId] });
    },
  });

  // ============================================================================
  // 4. HELPERS
  // ============================================================================

  /**
   * Obtiene el valor de un parámetro por su código
   */
  const getParameterValue = (parameterCode: string): any => {
    const param = parameterValues?.find(p => p.definition === parameterCode);
    if (!param) return null;

    // Retornar el valor según el tipo de dato
    if (param.value_decimal !== undefined && param.value_decimal !== null) return param.value_decimal;
    if (param.value_integer !== undefined && param.value_integer !== null) return param.value_integer;
    if (param.value_boolean !== undefined && param.value_boolean !== null) return param.value_boolean;
    if (param.value_text !== undefined && param.value_text !== null) return param.value_text;
    if (param.value_date !== undefined && param.value_date !== null) return param.value_date;

    return null;
  };

  /**
   * Verifica si un parámetro tiene valor
   */
  const hasValue = (parameterCode: string): boolean => {
    const value = getParameterValue(parameterCode);
    return value !== null && value !== undefined && value !== '';
  };

  /**
   * Obtiene todos los parámetros de una sección
   */
  const getSectionParameters = (sectionId: number): FormParameter[] => {
    if (!formStructure) return [];

    const findSection = (sections: FormSection[]): FormSection | null => {
      for (const section of sections) {
        if (section.id === sectionId) return section;
        if (section.subcategories) {
          const found = findSection(section.subcategories);
          if (found) return found;
        }
      }
      return null;
    };

    const section = findSection(formStructure.sections);
    return section?.form_parameters || [];
  };

  /**
   * Obtiene estadísticas de completitud de una sección
   */
  const getSectionCompleteness = (sectionId: number): { total: number; filled: number; percentage: number } => {
    const parameters = getSectionParameters(sectionId);
    const total = parameters.filter(p => p.is_visible).length;
    const filled = parameters.filter(p => p.is_visible && hasValue(p.parameter_definition.code)).length;

    return {
      total,
      filled,
      percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
    };
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Datos
    formStructure,
    parameterValues,
    
    // Estados de carga
    isLoading: isLoadingStructure || isLoadingValues,
    isLoadingStructure,
    isLoadingValues,
    
    // Errores
    error: structureError || valuesError,
    structureError,
    valuesError,
    
    // Mutaciones
    saveParameter: saveParameter.mutate,
    isSaving: saveParameter.isPending,
    saveError: saveParameter.error,
    
    // Helpers
    getParameterValue,
    hasValue,
    getSectionParameters,
    getSectionCompleteness,
    refetchValues,
  };
};
