import { ApiError } from '../types/common';

// Format error messages from API responses
export const formatApiError = (error: unknown): ApiError => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response: { data: any; status: number } }).response;
    return {
      message: response.data.message || 'An error occurred',
      status: response.status,
      errors: response.data.errors,
    };
  }
  return {
    message: 'An unexpected error occurred',
    status: 500,
  };
};

// Format date to local string
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

/**
 * URL que el navegador puede cargar para una foto de perfil.
 * Usa la base del API del front para evitar hosts inaccesibles (ej. en Docker).
 */
export function getProfilePhotoUrl(profilePhoto: string | null | undefined): string | undefined {
  if (!profilePhoto) return undefined;
  try {
    if (profilePhoto.startsWith('http://') || profilePhoto.startsWith('https://')) {
      const path = new URL(profilePhoto).pathname;
      return `${API_BASE_URL}${path}`;
    }
    const path = profilePhoto.startsWith('/') ? profilePhoto : `/${profilePhoto}`;
    return `${API_BASE_URL}${path}`;
  } catch {
    return undefined;
  }
}

/**
 * Formato de número: separador de miles ".", decimal ",".
 * Ej: 1234567.89 → "1.234.567,89"; 1500 → "1.500,00" (decimals=2).
 */
export const formatNumberLocale = (num: number, decimals = 2): string => {
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart != null ? `${withThousands},${decPart}` : withThousands;
}; 