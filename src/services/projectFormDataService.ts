// front/src/services/projectFormDataService.ts

import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Prepara los datos del formulario para enviar al backend
 * Convierte los datos a FormData si hay archivos, o a JSON si no los hay
 */
export const prepareFormData = (data: Record<string, any>): FormData | Record<string, any> => {
  const hasFiles = Object.values(data).some(value => value instanceof File);
  
  if (hasFiles) {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          // Para arrays, enviar como JSON string o múltiples valores
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    return formData;
  } else {
    // Si no hay archivos, preparar como objeto JSON
    const jsonData: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        jsonData[key] = value;
      }
    });
    
    return jsonData;
  }
};

/**
 * Envía los datos del formulario de una sección al backend
 * @param projectId ID del proyecto
 * @param sectionId ID de la sección (ej: 'project_basic', 'property')
 * @param data Datos del formulario
 * @param accessToken Token de autenticación
 */
export const saveProjectFormData = async (
  projectId: number,
  sectionId: string,
  data: Record<string, any>,
  accessToken: string
): Promise<any> => {
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const preparedData = prepareFormData(data);
  const isFormData = preparedData instanceof FormData;

  // Endpoint genérico que se puede ajustar cuando el backend esté listo
  // Por ahora: /api/projects/{projectId}/form-data/{sectionId}/
  const endpoint = `${API_URL}/api/projects/${projectId}/form-data/${sectionId}/`;

  if (isFormData) {
    const response = await axios.post(endpoint, preparedData, {
      ...axiosConfig,
      headers: {
        ...axiosConfig.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } else {
    const response = await axios.post(endpoint, preparedData, {
      ...axiosConfig,
      headers: {
        ...axiosConfig.headers,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }
};

/**
 * Obtiene los datos del formulario de una sección desde el backend
 * @param projectId ID del proyecto
 * @param sectionId ID de la sección
 * @param accessToken Token de autenticación
 */
export const getProjectFormData = async (
  projectId: number,
  sectionId: string,
  accessToken: string
): Promise<any> => {
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  // Endpoint genérico que se puede ajustar cuando el backend esté listo
  const endpoint = `${API_URL}/api/projects/${projectId}/form-data/${sectionId}/`;

  const response = await axios.get(endpoint, axiosConfig);
  return response.data;
};

