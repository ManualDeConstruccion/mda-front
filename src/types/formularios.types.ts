// front/src/types/formularios.types.ts

export interface FormularioItem {
  code: string;  // "2-1.1"
  name: string;  // "Solicitud de Aprobación de Anteproyecto..."
}

export interface TipoObra {
  name: string;  // "Obra nueva"
  formularios: FormularioItem[];
}

export interface TipoFormulario {
  code: string;  // "2"
  name: string;  // "2 – Formularios de Permisos de Edificación"
  tiposObra: TipoObra[];
}

export interface FormulariosData {
  root: string;  // "Formularios de Trámites Direcciones de Obras Municipales - DOM"
  tiposFormulario: TipoFormulario[];
}

