import * as yup from 'yup';

/**
 * Esquema de validación para crear/editar un edificio
 */
export const createBuildingSchema = (
  existingBuildings: Array<{ code: string; name: string; project_node: number; id?: number }>,
  currentProjectNodeId: number,
  excludeId?: number
) => {
  return yup.object().shape({
    code: yup
      .string()
      .required('Debe ingresar un código para el edificio')
      .trim()
      .test({
        name: 'unique-code-per-project-node',
        message: 'Ya existe un edificio con este código en este proyecto',
        test: function (value) {
          if (!value || !currentProjectNodeId) return true;
          const trimmedValue = typeof value === 'string' ? value.trim().toLowerCase() : String(value).trim().toLowerCase();
          const isDuplicate = existingBuildings.some(
            (b) =>
              b.code.toLowerCase() === trimmedValue &&
              b.project_node === currentProjectNodeId &&
              (!excludeId || b.id !== excludeId)
          );
          if (isDuplicate) {
            return this.createError({
              message: `Ya existe un edificio con el código "${value}" en este proyecto`,
            });
          }
          return true;
        },
      }),
    name: yup
      .string()
      .required('Debe ingresar un nombre para el edificio')
      .trim()
      .test({
        name: 'unique-name-per-project-node',
        message: 'Ya existe un edificio con este nombre en este proyecto',
        test: function (value) {
          if (!value || !currentProjectNodeId) return true;
          const trimmedValue = typeof value === 'string' ? value.trim().toLowerCase() : String(value).trim().toLowerCase();
          const isDuplicate = existingBuildings.some(
            (b) =>
              b.name.toLowerCase() === trimmedValue &&
              b.project_node === currentProjectNodeId &&
              (!excludeId || b.id !== excludeId)
          );
          if (isDuplicate) {
            return this.createError({
              message: `Ya existe un edificio con el nombre "${value}" en este proyecto`,
            });
          }
          return true;
        },
      }),
    project_node: yup.number().required(),
    order: yup.number().nullable(),
    is_active: yup.boolean(),
  });
};

/**
 * Valida los datos de un edificio antes de enviarlos
 */
export const validateBuildingData = async (
  data: {
    code: string;
    name: string;
    project_node: number;
    order?: number;
    is_active?: boolean;
  },
  existingBuildings: Array<{ code: string; name: string; project_node: number; id?: number }>,
  currentProjectNodeId: number,
  excludeId?: number
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    // Preparar datos para validación
    const validationData = {
      code: data.code,
      name: data.name,
      project_node: data.project_node,
      order: data.order || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
    };

    const schema = createBuildingSchema(existingBuildings, currentProjectNodeId, excludeId);
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

