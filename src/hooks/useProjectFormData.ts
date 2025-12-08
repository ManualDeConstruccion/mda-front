// front/src/hooks/useProjectFormData.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { saveProjectFormData, getProjectFormData } from '../services/projectFormDataService';

/**
 * Hook para manejar el guardado y carga de datos del formulario del proyecto
 */
export const useProjectFormData = (projectId: number) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Guarda los datos de una sección del formulario
   */
  const saveSectionData = useMutation({
    mutationFn: async ({ sectionId, data }: { sectionId: string; data: Record<string, any> }) => {
      if (!accessToken) {
        throw new Error('No hay token de autenticación');
      }
      
      // TODO: Cuando el backend esté listo, descomentar esta línea y eliminar el console.log
      // return await saveProjectFormData(projectId, sectionId, data, accessToken);
      
      // Por ahora, simular el guardado
      console.log('Guardando datos del formulario:', {
        projectId,
        sectionId,
        data,
        endpoint: `/api/projects/${projectId}/form-data/${sectionId}/`
      });
      
      // Simular respuesta exitosa
      return { success: true, sectionId, data };
    },
    onSuccess: (_, variables) => {
      // Invalidar la query de los datos de esta sección para recargar
      queryClient.invalidateQueries({ 
        queryKey: ['projectFormData', projectId, variables.sectionId] 
      });
    },
  });

  /**
   * Obtiene los datos de una sección del formulario
   */
  const getSectionData = (sectionId: string) => {
    return useQuery({
      queryKey: ['projectFormData', projectId, sectionId],
      queryFn: async () => {
        if (!accessToken) {
          throw new Error('No hay token de autenticación');
        }
        
        // TODO: Cuando el backend esté listo, descomentar esta línea y eliminar el return
        // return await getProjectFormData(projectId, sectionId, accessToken);
        
        // Por ahora, retornar datos vacíos
        console.log('Cargando datos del formulario:', {
          projectId,
          sectionId,
          endpoint: `/api/projects/${projectId}/form-data/${sectionId}/`
        });
        
        return {};
      },
      enabled: !!accessToken && !!projectId && !!sectionId,
    });
  };

  return {
    saveSectionData,
    getSectionData,
  };
};

