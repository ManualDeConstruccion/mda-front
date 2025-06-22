// Utilidades de validación para caracteres
export const CHARACTER_LIMITS = {
  PROJECT_TITLE: 100,
  PROJECT_DESCRIPTION: 500,
  NODE_TITLE: 100,
  NODE_DESCRIPTION: 500,
  GENERAL_TITLE: 100,
  GENERAL_DESCRIPTION: 500,
} as const;

export const validateCharacterLimit = (value: string, limit: number): boolean => {
  return value.length <= limit;
};

export const getRemainingCharacters = (value: string, limit: number): number => {
  return Math.max(0, limit - value.length);
};

export const truncateText = (value: string, limit: number): string => {
  return value.length > limit ? value.substring(0, limit) : value;
}; 