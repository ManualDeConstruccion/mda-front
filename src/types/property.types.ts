// src/types/property.types.ts

export interface PropertyData {
  // Información básica de la propiedad
  manzana: string;
  numero_plano_loteo: string;
  lote: string;
  conservador_comuna: string;
  localidad: string;
  poblacion: string;
  rol: string;
  numero_depto: string;
  comuna: string;
  direccion_calle: string;
  fojas_numero: string;
  region: string;
  direccion_numero: string;
  fojas: string;
  fojas_ano: string;
  sector: string;
  prc: string;
  zona: string;
}

export interface CIPData {
  // Datos CIP (Certificado de Información Previo)
  proyecto_cip: File | null;
  proyecto_cip_fecha: string;
}

export interface OwnerData {
  // Información personal
  nombre: string;
  rut: string;
  email: string;
  telefono: string;
  celular: string;
  responsabilidad: string;
  
  // Dirección
  direccion: string;
  direccion_comuna: string;
  direccion_depto: string;
  direccion_localidad: string;
  direccion_numero: string;
  
  // Representante legal
  rep_legal: string;
  rep_legal_rut: string;
  
  // Escritura representante
  escritura_representante: string;
  escritura_representante_2: string;
  escritura_representante_fecha: string;
  escritura_representante_fecha_2: string;
  escritura_representante_notario: string;
  
  // Otros instrumentos
  otro_instrumento_1: string;
  otro_instrumento_2: string;
  otro_instrumento_3: string;
  otro_instrumento_fecha: string;
  otro_instrumento_mediante: string;
}

export interface ArchitectData {
  // Información del arquitecto
  nombre: string;
  rut: string;
  email: string;
  telefono: string;
  celular: string;
  patente: string;
  aa_patente_arq: string;
  
  // Oficina de arquitectura
  razon_social: string;
  rut_oficina: string;
  direccion: string;
  direccion_numero: string;
  direccion_depto: string;
  comuna: string;
}

export interface ProfessionalsData {
  // Calculista
  calculista_nombre: string;
  calculista_rut: string;
  calculista_email: string;
  calculista_telefono: string;
  calculista_celular: string;
  calculista_patente: string;
  
  // Oficina de Cálculo
  of_calculo_razon_social: string;
  of_calculo_rut: string;
  of_calculo_direccion: string;
  of_calculo_direccion_numero: string;
  of_calculo_direccion_depto: string;
  
  // Revisor Independiente
  rev_independiente_nombre: string;
  rev_independiente_rut: string;
  rev_independiente_email: string;
  rev_independiente_telefono: string;
  rev_independiente_celular: string;
  rev_independiente_categoria: string;
  rev_independiente_registro: string;
  rev_independiente_numero: string;
  rev_independiente_fecha: string;
  rev_independiente_direccion: string;
  rev_independiente_dir_numero: string;
  rev_independiente_dir_depto: string;
  rev_independiente_comuna: string;
  rev_independiente_si: string;
  rev_independiente_no: string;
  
  // ITO
  ito_nombre: string;
  ito_rut: string;
  ito_email: string;
  ito_telefono: string;
  ito_celular: string;
  ito_categoria: string;
  ito_registro_numero: string;
  ito_razon_social: string;
  ito_razon_social_rut: string;
  ito_informe_numero: string;
  ito_informe_fecha: string;
  ito_direccion: string;
  ito_direccion_numero: string;
  ito_direccion_depto: string;
  ito_si: string;
  ito_no: string;
  
  // Revisor de Cálculo
  rev_calculo_nombre: string;
  rev_calculo_rut: string;
  rev_calculo_email: string;
  rev_calculo_telefono: string;
  rev_calculo_celular: string;
  rev_calculo_categoria: string;
  rev_calculo_registro: string;
  rev_calculo_numero: string;
  rev_calculo_fecha: string;
  rev_calculo_razon_social: string;
  rev_calculo_razon_social_rut: string;
  rev_calculo_direccion: string;
  rev_calculo_dir_numero: string;
  rev_calculo_dir_depto: string;
  rev_calculo_si: string;
  rev_calculo_no: string;
  
  // Constructor
  constructor_nombre: string;
  constructor_rut: string;
  constructor_email: string;
  constructor_telefono: string;
  constructor_celular: string;
  constructor_patente: string;
  
  // Constructora
  constructora_razon_social: string;
  constructora_rut: string;
  constructora_direccion: string;
  constructora_direccion_numero: string;
  constructora_direccion_depto: string;
  constructora_comuna: string;
}