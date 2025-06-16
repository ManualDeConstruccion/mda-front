import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

interface FireProtectionSolution {
  id: number;
  codigo: string;
  titulo: string;
  instrucciones: string;
  institucion?: string;
  informe_ensayo_numero?: string;
  laboratorio?: string;
  fecha_ensayo?: string;
  resistencia?: string;
  vigencia_inscripcion?: string;
  estructura?: string;
  cara_expuesta_al_fuego?: string;
  cara_no_expuesta_al_fuego?: string;
  aislacion?: string;
  otros_materiales?: string;
  materiales_genericos?: string;
  created_at: string;
  updated_at: string;
}

interface FireProtectionSolutionFilters {
  search?: string;
  institucion?: string;
  laboratorio?: string;
  resistencia?: string;
  fecha_ensayo?: string;
  ordering?: string;
}

export const useFireProtectionSolutions = (filters?: FireProtectionSolutionFilters) => {
  const { accessToken } = useAuth();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  // Construir query params
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });
  }

  // Query para obtener las soluciones
  const { data: solutions, isLoading, isError, error } = useQuery({
    queryKey: ['fireProtectionSolutions', filters],
    queryFn: async () => {
      const url = `${API_URL}/fire-protection-solutions/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axios.get<FireProtectionSolution[]>(url, axiosConfig);
      return response.data;
    },
    enabled: !!accessToken
  });

  // Transformar las soluciones para el selector
  const solutionOptions = solutions || [];

  return {
    solutions,
    solutionOptions,
    isLoading,
    isError,
    error
  };
}; 