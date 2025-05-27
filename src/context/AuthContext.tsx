// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

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

  // Configurar el interceptor de axios
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);

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
    setAccessToken(null);
    setUser(null);
    navigate('/login');
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

  return (
    <AuthContext.Provider
      value={{ 
        user: user ?? null, 
        accessToken, 
        loginWithGoogle, 
        logout 
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
