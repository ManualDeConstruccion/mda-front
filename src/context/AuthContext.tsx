// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
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

  // Configurar los interceptores de axios
  useEffect(() => {
    // Interceptor de solicitud
    const requestInterceptor = api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          // Verificar si el token está por expirar
          if (isTokenExpiringSoon(token)) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              config.headers.Authorization = `Bearer ${newToken}`;
            }
          } else {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor de respuesta
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && 
            originalRequest?.url !== '/api/auth/token/refresh/') {
          console.log('Error 401 detectado, intentando refresh token...');
          try {
            const newToken = await refreshAccessToken();
            if (newToken && originalRequest) {
              console.log('Token refrescado, reintentando petición original');
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            console.error('Error en el proceso de refresh:', refreshError);
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
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
    navigate('/login');
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
