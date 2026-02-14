// src/hooks/useRegionComuna.ts

import { useState, useEffect } from 'react';

export interface Region {
  id: number;
  region: string;
}

export interface Comuna {
  id: number;
  comuna: string;
  region?: string;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

// Función para obtener headers de autenticación
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const useRegionComuna = (selectedRegionId?: number) => {
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loadingRegiones, setLoadingRegiones] = useState(false);
  const [loadingComunas, setLoadingComunas] = useState(false);

  // Cargar regiones al montar
  useEffect(() => {
    const fetchRegiones = async () => {
      setLoadingRegiones(true);
      try {
        const response = await fetch(`${API_URL}/region/v1/`, {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setRegiones(data);
        }
      } catch (error) {
        console.error('Error fetching regiones:', error);
      } finally {
        setLoadingRegiones(false);
      }
    };

    fetchRegiones();
  }, []);

  // Cargar comunas cuando cambia la región seleccionada
  useEffect(() => {
    const fetchComunas = async () => {
      if (!selectedRegionId) {
        setComunas([]);
        return;
      }

      setLoadingComunas(true);
      try {
        const response = await fetch(`${API_URL}/comuna/v1/?region=${selectedRegionId}`, {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setComunas(data);
        }
      } catch (error) {
        console.error('Error fetching comunas:', error);
      } finally {
        setLoadingComunas(false);
      }
    };

    fetchComunas();
  }, [selectedRegionId]);

  return {
    regiones,
    comunas,
    loadingRegiones,
    loadingComunas,
  };
};
