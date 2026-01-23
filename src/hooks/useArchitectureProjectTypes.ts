// src/hooks/useArchitectureProjectTypes.ts

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Normalize API_URL to remove trailing slash
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export interface ArchitectureProjectType {
  id: number;
  code: string;
  name: string;
  description: string;
  category?: {
    id: number;
    name: string;
    full_path: string;
  };
  parameter_count?: number;
  has_parameters?: boolean;
  regulation_articles?: string[];
  is_active: boolean;
}

/**
 * Hook para obtener todos los tipos de proyecto de arquitectura disponibles.
 * Utiliza React Query para cache y sincronización.
 */
export const useArchitectureProjectTypes = () => {
  const { accessToken } = useAuth();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  const {
    data: projectTypes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ArchitectureProjectType[]>({
    queryKey: ['architectureProjectTypes'],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/architecture/architecture-project-types/`,
          axiosConfig
        );
        
        // Filtrar solo los activos
        const activeTypes = response.data.filter((type: ArchitectureProjectType) => type.is_active);
        
        // Ordenar por nombre
        return activeTypes.sort((a: ArchitectureProjectType, b: ArchitectureProjectType) => 
          a.name.localeCompare(b.name)
        );
      } catch (error) {
        console.error('Error fetching architecture project types:', error);
        throw error;
      }
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos (anteriormente cacheTime)
  });

  /**
   * Obtiene un tipo de proyecto por su ID
   */
  const getProjectTypeById = (id: number): ArchitectureProjectType | undefined => {
    return projectTypes.find(type => type.id === id);
  };

  /**
   * Obtiene un tipo de proyecto por su código
   */
  const getProjectTypeByCode = (code: string): ArchitectureProjectType | undefined => {
    return projectTypes.find(type => type.code === code);
  };

  /**
   * Agrupa los tipos de proyecto por categoría
   */
  const groupedByCategory = (): Record<string, ArchitectureProjectType[]> => {
    return projectTypes.reduce((acc, type) => {
      const categoryName = type.category?.name || 'Sin categoría';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(type);
      return acc;
    }, {} as Record<string, ArchitectureProjectType[]>);
  };

  return {
    projectTypes,
    isLoading,
    isError,
    error,
    refetch,
    getProjectTypeById,
    getProjectTypeByCode,
    groupedByCategory,
  };
};
