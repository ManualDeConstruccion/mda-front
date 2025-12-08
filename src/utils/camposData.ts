// Tipos para los datos de campos.json
export interface CampoField {
  name: string;
  label: string;
  type: string; // 'text' | 'number' | 'date' | 'year' | 'boolean' | 'select' | 'multi-select' | 'file' | 'region-select' | 'comuna-select' | 'spacer'
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  mapsTo?: string[];
  visibleWhen?: { field: string; equals: any };
  readOnly?: boolean;
  dependsOn?: string; // Para comuna-select que depende de region
  span?: number; // Número de columnas que debe ocupar en la grilla (1, 2, o 3). Por defecto: 1
}

export interface CampoStep {
  id: string;
  label: string;
  description: string;
  fields: CampoField[];
}

export interface CamposData {
  steps: Record<string, CampoStep>;
}

// Datos hardcodeados desde campos.json (solo las categorías principales que queremos mostrar)
// Por ahora usaremos datos mock, pero esto se puede cambiar a fetch más adelante
export const getCamposSteps = (): CampoStep[] => {
  // Retornamos las categorías principales que queremos mostrar en el detalle del proyecto
  // Excluimos: intent, summary, y las variantes específicas (solo mostramos las principales)
  return [
    {
      id: 'project_basic',
      label: 'Datos del proyecto',
      description: 'Nombre, ubicación general, CIP',
      fields: [
        { name: 'proyecto_nombre', label: 'Nombre del proyecto', type: 'text', required: true },
        { name: 'proyecto_cip', label: 'CIP (archivo PDF)', type: 'file', required: false },
        { name: 'proyecto_cip_fecha', label: 'Fecha de CIP', type: 'date', required: false }
      ]
    },
    {
      id: 'property',
      label: 'Propiedad',
      description: 'Identificación del predio',
      fields: [
        { name: 'proyecto_region', label: 'Región', type: 'region-select', required: true, span: 1 },
        { name: 'proyecto_comuna', label: 'Comuna', type: 'comuna-select', required: true, dependsOn: 'proyecto_region', span: 1 },
        { name: 'spacer_1', label: '', type: 'spacer', span: 1 },
        { name: 'proyecto_direccion_calle', label: 'Dirección (calle)', type: 'text', required: false, span: 1 },
        { name: 'proyecto_direccion_numero', label: 'Dirección (número)', type: 'text', required: false, span: 1 },
        { name: 'propiedad_numero_depto', label: 'Número de departamento', type: 'text', required: false, span: 1 },
        { name: 'propiedad_rol', label: 'Rol de avalúo', type: 'text', required: true, span: 1 },
        { name: 'spacer_2', label: '', type: 'spacer', span: 2 },
        { name: 'propiedad_manzana', label: 'Manzana', type: 'text', required: false, span: 1 },
        { name: 'propiedad_lote', label: 'Lote', type: 'text', required: false, span: 1 },
        { name: 'propiedad_poblacion', label: 'Población', type: 'text', required: false, span: 1 },
        { name: 'propiedad_localidad', label: 'Localidad', type: 'text', required: false, span: 1 },
        { name: 'propiedad_numero_plano_loteo', label: 'Número de plano de loteo', type: 'text', required: false, span: 1 },
        { name: 'propiedad_sector', label: 'Sector', type: 'text', required: false, span: 1 },        
        { name: 'propiedad_zona', label: 'Zona', type: 'text', required: false, span: 1 },
        { name: 'propiedad_prc', label: 'PRC', type: 'text', required: false, span: 1 },
        { name: 'spacer_1', label: '', type: 'spacer', span: 1 },
        { name: 'propiedad_fojas', label: 'Inscrito a fojas', type: 'text', required: false, span: 1 },
        { name: 'propiedad_fojas_numero', label: 'Número de fojas', type: 'text', required: false, span: 1 },
        { name: 'propiedad_fojas_ano', label: 'Año de fojas', type: 'year', required: false, span: 1 },
        { name: 'propiedad_concervador_comuna', label: 'Comuna del conservador de bienes raíces', type: 'comuna-select', required: false, span: 1 }
      ]
    },
    {
      id: 'owner_and_mandate',
      label: 'Propietario / Mandante',
      description: 'Datos del propietario y representante',
      fields: [
        { name: 'owner_type', label: 'Tipo de propietario', type: 'select', required: true },
        { name: 'owner_rut', label: 'RUT propietario / mandante', type: 'text', required: true },
        { name: 'owner_name', label: 'Nombre / Razón social', type: 'text', required: true },
        { name: 'owner_email', label: 'Correo electrónico', type: 'text', required: false },
        { name: 'owner_phone', label: 'Teléfono', type: 'text', required: false }
      ]
    },
    {
      id: 'professionals',
      label: 'Profesionales responsables',
      description: 'Arquitecto, calculista, constructor, ITO',
      fields: [
        { name: 'architect_rut', label: 'RUT arquitecto', type: 'text', required: true },
        { name: 'architect_name', label: 'Nombre arquitecto', type: 'text', required: true },
        { name: 'structural_engineer_rut', label: 'RUT calculista', type: 'text', required: false },
        { name: 'builder_rut', label: 'RUT constructor', type: 'text', required: false },
        { name: 'ito_rut', label: 'RUT ITO', type: 'text', required: false }
      ]
    },
    {
      id: 'destinations_and_units',
      label: 'Destinos y número de unidades',
      description: 'Viviendas, oficinas, bodegas, estacionamientos, etc.',
      fields: [
        { name: 'main_destinations', label: 'Destinos principales', type: 'multi-select', required: true },
        { name: 'num_dwellings', label: 'Número de viviendas', type: 'number', required: false },
        { name: 'num_offices', label: 'Número de oficinas', type: 'number', required: false },
        { name: 'num_parking', label: 'Número de estacionamientos', type: 'number', required: false }
      ]
    },
    {
      id: 'surfaces',
      label: 'Superficies',
      description: 'Superficies prediales y edificadas',
      fields: [
        { name: 'site_area', label: 'Superficie predial (m²)', type: 'number', required: true },
        { name: 'built_area_above', label: 'Sup. edificada sobre terreno (m²)', type: 'number', required: true },
        { name: 'built_area_below', label: 'Sup. edificada bajo terreno (m²)', type: 'number', required: false },
        { name: 'total_built_area', label: 'Sup. edificada total (m²)', type: 'number', required: false }
      ]
    },
    {
      id: 'planning_rules',
      label: 'Normas urbanísticas',
      description: 'Densidad, constructibilidad, altura, incentivos',
      fields: [
        { name: 'density', label: 'Densidad propuesta (hab/ha)', type: 'number', required: false },
        { name: 'floor_area_ratio', label: 'Coeficiente de constructibilidad', type: 'number', required: false },
        { name: 'height_m', label: 'Altura máxima propuesta (m)', type: 'number', required: false },
        { name: 'art70_applies', label: '¿Aplica Art. 70 LGUC (densificación / aportes)?', type: 'boolean', required: false }
      ]
    },
    {
      id: 'attachments',
      label: 'Documentos adjuntos',
      description: 'Planos, cálculos, proyectos de especialidades',
      fields: [
        { name: 'drawings_architecture', label: 'Planos de arquitectura', type: 'file', required: true },
        { name: 'structural_calculations', label: 'Memoria de cálculo estructural', type: 'file', required: false }
      ]
    }
  ];
};

// Función para obtener datos mock de un campo (para mostrar en modo lectura)
export const getMockFieldValue = (field: CampoField): string | number | boolean | string[] => {
  // Retorna valores mock según el tipo de campo
  switch (field.type) {
    case 'text':
      return `Valor de ${field.label}`;
    case 'number':
      return 0;
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'year':
      return new Date().getFullYear();
    case 'boolean':
      return false;
    case 'select':
      return field.options?.[0]?.value || '';
    case 'multi-select':
      return [];
    case 'file':
      return 'archivo.pdf';
    case 'region-select':
      return 'Región Metropolitana';
    case 'comuna-select':
      return 'Santiago';
    default:
      return '';
  }
};


