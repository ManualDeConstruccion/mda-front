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
      .test({
        name: 'unique-name-per-level',
        message: 'Ya existe un polígono con este nombre en este nivel',
        test: function (value) {
          if (!value || !currentLevelId) return true;
          const trimmedValue = typeof value === 'string' ? value.trim().toLowerCase() : String(value).trim().toLowerCase();
          const isDuplicate = existingPolygons.some(
            (p) =>
              p.name.toLowerCase() === trimmedValue &&
              p.level === currentLevelId &&
              (!excludeId || p.id !== excludeId)
          );
          if (isDuplicate) {
            // Crear un mensaje personalizado con el nombre del polígono
            return this.createError({
              message: `Ya existe un polígono con el nombre "${value}" en este nivel`,
            });
          }
          return true;
        },
      }),
    width: yup
      .number()
      .nullable()
      .typeError('El ancho debe ser un número válido')
      .transform((value, originalValue) => {
        if (originalValue === '' || originalValue === null || originalValue === undefined) {
          return null;
        }
        const num = typeof originalValue === 'string' ? parseFloat(originalValue) : originalValue;
        return isNaN(num) ? null : num;
      })
      .test(
        'width-positive',
        'El ancho debe ser mayor a 0',
        function (value) {
          // Si hay manual_total, width no es requerido
          if (this.parent.manual_total) return true;
          // Si no hay valor, la validación de requerido se hace en el nivel del objeto
          if (value === null || value === undefined) return true;
          return value > 0;
        }
      )
      .test(
        'width-not-negative',
        'El ancho no puede ser negativo',
        function (value) {
          if (value === null || value === undefined) return true;
          return value >= 0;
        }
      ),
    length: yup
      .number()
      .nullable()
      .typeError('El largo debe ser un número válido')
      .transform((value, originalValue) => {
        if (originalValue === '' || originalValue === null || originalValue === undefined) {
          return null;
        }
        const num = typeof originalValue === 'string' ? parseFloat(originalValue) : originalValue;
        return isNaN(num) ? null : num;
      })
      .test(
        'length-positive',
        'El largo debe ser mayor a 0',
        function (value) {
          // Si hay manual_total, length no es requerido
          if (this.parent.manual_total) return true;
          // Si no hay valor, la validación de requerido se hace en el nivel del objeto
          if (value === null || value === undefined) return true;
          return value > 0;
        }
      )
      .test(
        'length-not-negative',
        'El largo no puede ser negativo',
        function (value) {
          if (value === null || value === undefined) return true;
          return value >= 0;
        }
      ),
    manual_total: yup
      .number()
      .nullable()
      .typeError('El total manual debe ser un número válido')
      .transform((value, originalValue) => {
        if (originalValue === '' || originalValue === null || originalValue === undefined) {
          return null;
        }
        const num = typeof originalValue === 'string' ? parseFloat(originalValue) : originalValue;
        return isNaN(num) ? null : num;
      })
      .test(
        'manual-total-positive',
        'El total manual debe ser mayor a 0',
        function (value) {
          // Si hay width y length, manual_total no es requerido
          if (this.parent.width && this.parent.length) {
            if (value === null || value === undefined) return true;
            return value > 0;
          }
          // Si no hay width o length, manual_total es requerido
          if (value === null || value === undefined) return false;
          return value > 0;
        }
      )
      .test(
        'manual-total-not-negative',
        'El total manual no puede ser negativo',
        function (value) {
          if (value === null || value === undefined) return true;
          return value >= 0;
        }
      )
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
  }).test(
    'require-width-length-or-manual',
    'Debe ingresar ancho y largo, o un total manual',
    function (value): boolean {
      const hasWidthAndLength = (value.width != null && value.width !== 0) && (value.length != null && value.length !== 0);
      const hasManualTotal = value.manual_total != null && value.manual_total !== 0;
      return Boolean(hasWidthAndLength || hasManualTotal);
    }
  ).test(
    'require-width-length-for-triangulo',
    'Para calcular un triángulo rectángulo debe ingresar ancho y largo',
    function (value) {
      if (!value.triangulo_rectangulo) return true;
      return !!(value.width && value.length);
    }
  );
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

