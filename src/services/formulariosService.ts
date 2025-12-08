// front/src/services/formulariosService.ts

import { FormulariosData, TipoFormulario, TipoObra, FormularioItem } from '../types/formularios.types';

/**
 * Parsea el JSON de formularios a una estructura tipada
 */
export const parseFormulariosData = (jsonData: any): FormulariosData => {
  const rootKey = Object.keys(jsonData)[0]; // "Formularios de Trámites..."
  const rootData = jsonData[rootKey];
  
  const tiposFormulario: TipoFormulario[] = Object.entries(rootData).map(([key, value]: [string, any]) => {
    // Extraer código del nombre (ej: "2 – Formularios..." → "2")
    const codeMatch = key.match(/^(\d+)/);
    const code = codeMatch ? codeMatch[1] : key;
    
    const tiposObra: TipoObra[] = Object.entries(value).map(([obraName, formularios]: [string, any]) => {
      const formulariosList: FormularioItem[] = (formularios as string[]).map((formName: string) => {
        // Extraer código del nombre (ej: "2-1.1 Solicitud..." → "2-1.1")
        // También manejar casos como "1-1.1." o "2-1.1" sin punto
        const codeMatch = formName.match(/^(\d+-\d+\.\d+)/);
        const code = codeMatch ? codeMatch[1] : formName;
        
        return {
          code,
          name: formName
        };
      });
      
      return {
        name: obraName,
        formularios: formulariosList
      };
    });
    
    return {
      code,
      name: key,
      tiposObra
    };
  });
  
  return {
    root: rootKey,
    tiposFormulario
  };
};

/**
 * Simula la llamada al backend (fácil de reemplazar después)
 */
export const fetchFormulariosData = async (): Promise<FormulariosData> => {
  // TODO: Cuando el backend esté listo, cambiar a:
  // const response = await axios.get('/api/formularios/');
  // return response.data;
  
  // Por ahora, cargar desde JSON local
  try {
    const response = await fetch('/tiposformularios.json');
    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo de formularios');
    }
    const jsonData = await response.json();
    return parseFormulariosData(jsonData);
  } catch (error) {
    console.error('Error cargando formularios:', error);
    throw error;
  }
};

