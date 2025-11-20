import * as yup from 'yup';

/**
 * Esquema de validación para crear/editar un polígono de superficie
 */
export const createPolygonSchema = (
  existingPolygons: Array<{ name: string; level: number | null; id?: number }>,
  currentLevelId: number | null,
  excludeId?: number
) => {
  return yup.object().shape({
    name: yup
      .string()
      .required('Debe ingresar un nombre para el polígono')
      .trim()
      .test(
        'unique-name-per-level',
        (value) => `Ya existe un polígono con el nombre "${value}" en este nivel`,
        function (value) {
          if (!value || !currentLevelId) return true;
          const trimmedValue = value.trim().toLowerCase();
          return !existingPolygons.some(
            (p) =>
              p.name.toLowerCase() === trimmedValue &&
              p.level === currentLevelId &&
              (!excludeId || p.id !== excludeId)
          );
        }
      ),
    width: yup
      .number()
      .nullable()
      .transform((value, originalValue) => {
        if (originalValue === '' || originalValue === null || originalValue === undefined) {
          return null;
        }
        const num = typeof originalValue === 'string' ? parseFloat(originalValue) : originalValue;
        return isNaN(num) ? null : num;
      })
      .when(['manual_total', 'triangulo_rectangulo'], {
        is: (manualTotal: number | null, trianguloRectangulo: boolean) => 
          !manualTotal && trianguloRectangulo,
        then: (schema) => schema.required('El ancho es requerido para calcular un triángulo rectángulo').positive('El ancho debe ser mayor a 0'),
        otherwise: (schema) => schema.when('manual_total', {
          is: (manualTotal: number | null) => !manualTotal,
          then: (schema) => schema.required('Debe ingresar ancho y largo, o un total manual').min(0.01, 'El ancho debe ser mayor a 0'),
        }),
      }),
    length: yup
      .number()
      .nullable()
      .transform((value, originalValue) => {
        if (originalValue === '' || originalValue === null || originalValue === undefined) {
          return null;
        }
        const num = typeof originalValue === 'string' ? parseFloat(originalValue) : originalValue;
        return isNaN(num) ? null : num;
      })
      .when(['manual_total', 'triangulo_rectangulo'], {
        is: (manualTotal: number | null, trianguloRectangulo: boolean) => 
          !manualTotal && trianguloRectangulo,
        then: (schema) => schema.required('El largo es requerido para calcular un triángulo rectángulo').positive('El largo debe ser mayor a 0'),
        otherwise: (schema) => schema.when('manual_total', {
          is: (manualTotal: number | null) => !manualTotal,
          then: (schema) => schema.required('Debe ingresar ancho y largo, o un total manual').min(0.01, 'El largo debe ser mayor a 0'),
        }),
      }),
    manual_total: yup
      .number()
      .nullable()
      .transform((value, originalValue) => {
        if (originalValue === '' || originalValue === null || originalValue === undefined) {
          return null;
        }
        const num = typeof originalValue === 'string' ? parseFloat(originalValue) : originalValue;
        return isNaN(num) ? null : num;
      })
      .when(['width', 'length'], {
        is: (width: number | null, length: number | null) => !width || !length,
        then: (schema) => schema.required('Debe ingresar ancho y largo, o un total manual').positive('El total manual debe ser mayor a 0'),
        otherwise: (schema) => schema.positive('El total manual debe ser mayor a 0'),
      })
      .test(
        'not-with-triangulo-rectangulo',
        'No puedes usar triangulo_rectangulo con total manual. Usa ancho y largo para calcular el triángulo rectángulo.',
        function (value) {
          const trianguloRectangulo = this.parent.triangulo_rectangulo;
          return !(value && trianguloRectangulo);
        }
      ),
    triangulo_rectangulo: yup.boolean(),
    count_as_half: yup.boolean(),
  });
};

/**
 * Valida los datos de un polígono antes de enviarlos
 */
export const validatePolygonData = async (
  data: {
    name: string;
    width?: string | number | null;
    length?: string | number | null;
    manual_total?: string | number | null;
    triangulo_rectangulo?: boolean;
    count_as_half?: boolean;
  },
  existingPolygons: Array<{ name: string; level: number | null; id?: number }>,
  currentLevelId: number | null,
  excludeId?: number
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    // Preparar datos para validación
    const validationData = {
      name: data.name,
      width: typeof data.width === 'string' ? (data.width ? parseFloat(data.width) : null) : data.width,
      length: typeof data.length === 'string' ? (data.length ? parseFloat(data.length) : null) : data.length,
      manual_total: typeof data.manual_total === 'string' ? (data.manual_total ? parseFloat(data.manual_total) : null) : data.manual_total,
      triangulo_rectangulo: data.triangulo_rectangulo || false,
      count_as_half: data.count_as_half || false,
    };

    const schema = createPolygonSchema(existingPolygons, currentLevelId, excludeId);
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

