// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosInstance } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { clearAccordionStates } from '../pages/ArchitectureProjects/ListadoDeAntecedentes';
import { jwtDecode } from 'jwt-decode';

// API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean; // ⚡ NUEVO: Para verificar permisos de administrador
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loginWithGoogle: (token: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

interface DecodedToken {
  exp: number;
  user_id: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Crear una instancia de axios con la configuración base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// ==== NEW SHARED REFRESH STATE (add near the top, after api instance) ====
let refreshPromise: Promise<string | null> | null = null;

// Función para verificar si el token está por expirar (5 minutos antes)
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const expirationTime = decoded.exp * 1000; // Convertir a milisegundos
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos
    
    const isExpiring = expirationTime - currentTime < fiveMinutes;
    if (isExpiring) {
      console.log('Token expirando pronto:', {
        expiraEn: Math.round((expirationTime - currentTime) / 1000 / 60) + ' minutos'
      });
    }
    return isExpiring;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

// Función para obtener el token CSRF
const getCsrfToken = async () => {
  try {
    const response = await api.get('/api/auth/social/csrf/');
    return response.data.csrfToken;
  } catch (error) {
    console.error('Error obteniendo CSRF token:', error);
    throw error;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('access_token')
  );
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      console.log('Iniciando refresh del token...');
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.error('No hay refresh token disponible');
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/auth/token/refresh/', {
        refresh: refreshToken
      });

      const newAccessToken = response.data.access;
      console.log('Token refrescado exitosamente');
      localStorage.setItem('access_token', newAccessToken);
      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Error durante el refresh del token:', error);
      logout();
      return null;
    }
  }, []);

  // Configurar los interceptores de axios (instancia local y global)
  useEffect(() => {
    /**
     * Adjunta los interceptores a la instancia indicada y devuelve
     * una función de limpieza para eyectarlos al desmontar.
     */
    const attachInterceptors = (axiosInstance: AxiosInstance) => {
      // 1. Interceptor de solicitud → añade/actualiza el header `Authorization`
      const requestInterceptor = axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          const token = localStorage.getItem('access_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // 2. Interceptor de respuesta → refresca o hace logout
      const responseInterceptor = axiosInstance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
          const originalRequest: any = error.config;
          const status = error.response?.status;

          const accessTokenExists = !!localStorage.getItem('access_token');
          const refreshTokenExists = !!localStorage.getItem('refresh_token');

          // Evitar intentar refrescar si la request fallida ES la de refresh
          const isRefreshRequest = originalRequest?.url?.includes('/api/auth/token/refresh');

          const shouldAttemptRefresh =
            status === 401 &&
            !isRefreshRequest &&
            accessTokenExists &&
            refreshTokenExists &&
            !originalRequest?._retry;

          // Si el refresh token ya falló ➜ cerrar sesión directamente
          if (status === 401 && isRefreshRequest) {
            logout();
            return Promise.reject(error);
          }

          if (!shouldAttemptRefresh) {
            return Promise.reject(error);
          }

          // Evitar bucles infinitos
          originalRequest._retry = true;

          // Si ya hay un refresh en curso, espera a que finalice
          if (refreshPromise) {
            const newToken = await refreshPromise;
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axiosInstance(originalRequest);
            }
            return Promise.reject(error);
          }

          // Ejecutar refresh solo una vez
          refreshPromise = refreshAccessToken()
            .catch((refreshError) => {
              refreshPromise = null;
              throw refreshError;
            })
            .then((newToken) => {
              refreshPromise = null;
              return newToken;
            });

          try {
            const newToken = await refreshPromise;
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axiosInstance(originalRequest);
            }
          } catch (_ignored) {
            /* El logout ya fue gestionado dentro de refreshAccessToken */
          }

          return Promise.reject(error);
        }
      );

      // Función de limpieza
      return () => {
        axiosInstance.interceptors.request.eject(requestInterceptor);
        axiosInstance.interceptors.response.eject(responseInterceptor);
      };
    };

    // Adjuntar a la instancia personalizada `api` y a la instancia global `axios`
    const detachApi = attachInterceptors(api);
    const detachGlobal = attachInterceptors(axios);

    return () => {
      detachApi();
      detachGlobal();
    };
  }, [refreshAccessToken]);

  const fetchUser = async (): Promise<User> => {
    try {
      const res = await api.get('/api/auth/social/user/');
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logout();
      }
      throw error;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    clearAccordionStates();
    // Primero navega fuera de las rutas protegidas
    navigate('/');
    // Luego limpia el contexto (en el siguiente tick)
    setTimeout(() => {
      setAccessToken(null);
      setUser(null);
    }, 0);
  }, [navigate]);

  const queryOptions: UseQueryOptions<User, Error> = {
    queryKey: ['me'],
    queryFn: fetchUser,
    enabled: !!accessToken,
    retry: false,
  };

  const { data: userData } = useQuery(queryOptions);

  useEffect(() => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }, [userData]);

  const handleGoogleLogin = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/google/login/`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.authorization_url) {
        // Abrir la ventana de Google en una nueva pestaña
        const googleWindow = window.open(
          response.data.authorization_url,
          'Google Login',
          'width=500,height=600,left=200,top=200'
        );

        // Configurar el listener para el mensaje de Google
        window.addEventListener('message', async (event) => {
          // Verificar el origen del mensaje
          if (event.origin !== window.location.origin) {
            console.log('Ignoring message from unauthorized origin:', event.origin);
            return;
          }

          if (event.data.type === 'google-auth-success') {
            try {
              const userResponse = await axios.get(`${API_URL}/api/auth/user/`, {
                withCredentials: true,
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                }
              });
              
              if (userResponse.data) {
                setUser(userResponse.data);
                setAuthenticated(true);
                navigate('/');
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
              setError('Error al obtener datos del usuario');
            }
          }
        }, { once: true });

        // Verificar si la ventana se cerró
        const checkWindow = setInterval(() => {
          if (googleWindow?.closed) {
            clearInterval(checkWindow);
            // Verificar el estado de la autenticación
            checkAuthStatus();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error during Google login:', error);
      setError('Error al iniciar sesión con Google');
    }
  };

  const loginWithGoogle = async (googleToken: string) => {
    try {
      // 1. Obtener el token CSRF
      const csrfToken = await getCsrfToken();

      // 2. Hacer el POST de login social con el token CSRF
      const response = await api.post('/api/auth/social/google/', 
        { access_token: googleToken },
        {
          headers: {
            'X-CSRFToken': csrfToken,
          }
        }
      );
      
      const { token, user } = response.data;
      
      // Guardar tokens y usuario
      localStorage.setItem('access_token', token.access);
      localStorage.setItem('refresh_token', token.refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      setAccessToken(token.access);
      setUser(user);
      navigate('/');
    } catch (error) {
      console.error('Error during Google login:', error);
      logout();
    }
  };

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/user/`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data) {
        setUser(response.data);
        setAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      setAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ 
        user: user ?? null, 
        accessToken, 
        loginWithGoogle, 
        logout,
        refreshAccessToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
