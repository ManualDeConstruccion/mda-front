import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Configuración de la API
// Si no se define VITE_API_URL, usar http://localhost:8000 por defecto
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

// Función para obtener el token CSRF
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Configuración global de axios
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'mdc_csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for API calls
// IMPORTANTE: usar 'access_token' (mismo key que AuthContext) para que las peticiones vayan autenticadas
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    const csrfToken = getCookie('mdc_csrftoken');
    
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor: no hacer logout/redirect aquí; AuthContext ya tiene interceptores
// que manejan 401 (refresh + logout). Rechazar el error para que llegue al caller o al AuthContext.
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(error)
); 