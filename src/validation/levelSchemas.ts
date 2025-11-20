import * as yup from 'yup';

/**
 * Esquema de validación para crear/editar un nivel de proyecto
 */
export const createLevelSchema = (
  existingLevels: Array<{ code: string; name: string; altura: number | null; building: number; id?: number }>,
  currentBuildingId: number,
  excludeId?: number
) => {
  return yup.object().shape({
    code: yup
      .string()
      .required('Debe ingresar un código para el nivel')
      .trim()
      .test({
        name: 'unique-code-per-building',
        message: 'Ya existe un nivel con este código en este edificio',
        test: function (value) {
          if (!value || !currentBuildingId) return true;
          const trimmedValue = typeof value === 'string' ? value.trim().toLowerCase() : String(value).trim().toLowerCase();
          const isDuplicate = existingLevels.some(
            (l) =>
              l.code.toLowerCase() === trimmedValue &&
              l.building === currentBuildingId &&
              (!excludeId || l.id !== excludeId)
          );
          if (isDuplicate) {
            return this.createError({
              message: `Ya existe un nivel con el código "${value}" en este edificio`,
            });
          }
          return true;
        },
      }),
    name: yup
      .string()
      .required('Debe ingresar un nombre para el nivel')
      .trim()
      .test({
        name: 'unique-name-per-building',
        message: 'Ya existe un nivel con este nombre en este edificio',
        test: function (value) {
          if (!value || !currentBuildingId) return true;
          const trimmedValue = typeof value === 'string' ? value.trim().toLowerCase() : String(value).trim().toLowerCase();
          const isDuplicate = existingLevels.some(
            (l) =>
              l.name.toLowerCase() === trimmedValue &&
              l.building === currentBuildingId &&
              (!excludeId || l.id !== excludeId)
          );
          if (isDuplicate) {
            return this.createError({
              message: `Ya existe un nivel con el nombre "${value}" en este edificio`,
            });
          }
          return true;
        },
      }),
    altura: yup
      .number()
      .nullable()
      .typeError('La altura debe ser un número válido')
      .transform((value, originalValue) => {
        if (originalValue === '' || originalValue === null || originalValue === undefined) {
          return null;
        }
        const num = typeof originalValue === 'string' ? parseFloat(originalValue) : originalValue;
        return isNaN(num) ? null : num;
      })
      .test({
        name: 'unique-altura-per-building',
        message: 'Ya existe un nivel con esta altura en este edificio',
        test: function (value) {
          if (value === null || value === undefined || !currentBuildingId) return true;
          const isDuplicate = existingLevels.some(
            (l) =>
              l.altura !== null &&
              l.altura !== undefined &&
              Math.abs(l.altura - value) < 0.001 && // Comparar con tolerancia para decimales
              l.building === currentBuildingId &&
              (!excludeId || l.id !== excludeId)
          );
          if (isDuplicate) {
            return this.createError({
              message: `Ya existe un nivel con la altura ${value}m en este edificio`,
            });
          }
          return true;
        },
      }),
    level_type: yup.string().oneOf(['below', 'above', 'roof'], 'Tipo de nivel inválido').required(),
    building: yup.number().required(),
    order: yup.number().nullable(),
    is_active: yup.boolean(),
  });
};

/**
 * Valida los datos de un nivel antes de enviarlos
 */
export const validateLevelData = async (
  data: {
    code: string;
    name: string;
    altura?: string | number | null;
    level_type: 'below' | 'above' | 'roof';
    building: number;
    order?: number;
    is_active?: boolean;
  },
  existingLevels: Array<{ code: string; name: string; altura: number | null; building: number; id?: number }>,
  currentBuildingId: number,
  excludeId?: number
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    // Preparar datos para validación
    const validationData = {
      code: data.code,
      name: data.name,
      altura: typeof data.altura === 'string' ? (data.altura ? parseFloat(data.altura) : null) : data.altura,
      level_type: data.level_type,
      building: data.building,
      order: data.order || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
    };

    const schema = createLevelSchema(existingLevels, currentBuildingId, excludeId);
    await schema.validate(validationData, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error: any) {
    if (error.inner) {
      const errors: Record<string, string> = {};
      error.inner.forEach((err: any) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: error.message || 'Error de validación' } };
  }
};

