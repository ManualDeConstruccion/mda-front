// Tipos para los datos de destino
export interface UsoSuelo {
  pk: number;
  nombre: string;
}

export interface Destino {
  pk: number;
  nombre: string;
  tipo: string;
  uso_suelo_id_id: string;
}

export interface DProyecto {
  pk: number;
  nombre: string;
  destino_id_id: number;
}

// Datos hardcodeados desde los JSONs
const USO_SUELO_DATA: UsoSuelo[] = [
  { pk: 1, nombre: 'Residencial' },
  { pk: 2, nombre: 'Equipamento' },
  { pk: 3, nombre: 'Actividades productivas' },
  { pk: 4, nombre: 'Infraestructura' },
  { pk: 5, nombre: 'Espacio público y/o área verde' }
];

const DESTINO_DATA: Destino[] = [
  { pk: 1, nombre: 'Vivienda', tipo: 'destino', uso_suelo_id_id: '1' },
  { pk: 2, nombre: 'Hogares de acogida', tipo: 'destino', uso_suelo_id_id: '1' },
  { pk: 3, nombre: 'Hospedaje', tipo: 'destino', uso_suelo_id_id: '1' },
  { pk: 4, nombre: 'Científico', tipo: 'clase', uso_suelo_id_id: '2' },
  { pk: 5, nombre: 'Comercio', tipo: 'clase', uso_suelo_id_id: '2' },
  { pk: 6, nombre: 'Culto y cultura', tipo: 'clase', uso_suelo_id_id: '2' },
  { pk: 7, nombre: 'Deporte', tipo: 'clase', uso_suelo_id_id: '2' },
  { pk: 8, nombre: 'Educación', tipo: 'clase', uso_suelo_id_id: '2' },
  { pk: 9, nombre: 'Esparcimiento', tipo: 'clase', uso_suelo_id_id: '2' },
  { pk: 10, nombre: 'Salud', tipo: 'clase', uso_suelo_id_id: '2' },
  { pk: 11, nombre: 'Seguridad', tipo: 'clase', uso_suelo_id_id: '2' },
  { pk: 12, nombre: 'Servicios', tipo: 'clase', uso_suelo_id_id: '2' },
  { pk: 13, nombre: 'Social', tipo: 'clase', uso_suelo_id_id: '2' },
  { pk: 14, nombre: 'SIN_DESTINO', tipo: 'SIN_DESTINO', uso_suelo_id_id: '3' },
  { pk: 15, nombre: 'SIN_DESTINO', tipo: 'SIN_DESTINO', uso_suelo_id_id: '4' },
  { pk: 16, nombre: 'SIN_DESTINO', tipo: 'SIN_DESTINO', uso_suelo_id_id: '5' }
];

// Función para obtener destinos por uso de suelo
export const getDestinosByUsoSuelo = (usoSueloId: number): Destino[] => {
  return DESTINO_DATA.filter(d => d.uso_suelo_id_id === String(usoSueloId));
};

// Función para verificar si un destino es SIN_DESTINO
export const isSinDestino = (destino: Destino): boolean => {
  return destino.tipo === 'SIN_DESTINO' && destino.nombre === 'SIN_DESTINO';
};

// Función para verificar si un uso de suelo solo tiene destinos SIN_DESTINO
export const hasOnlySinDestino = (usoSueloId: number): boolean => {
  const destinos = getDestinosByUsoSuelo(usoSueloId);
  return destinos.length > 0 && destinos.every(d => isSinDestino(d));
};

// Función para obtener el destino SIN_DESTINO de un uso de suelo
export const getSinDestinoForUsoSuelo = (usoSueloId: number): Destino | null => {
  const destinos = getDestinosByUsoSuelo(usoSueloId);
  const sinDestino = destinos.find(d => isSinDestino(d));
  return sinDestino || null;
};

// Función para obtener dproyectos por destino
export const getDProyectosByDestino = (destinoId: number, dproyectoData: DProyecto[]): DProyecto[] => {
  return dproyectoData.filter(dp => dp.destino_id_id === destinoId);
};

// Datos completos de dproyecto desde dproyecto.json
const DPROYECTO_DATA_RAW = [
  { pk: 1, destino_id_id: 1, nombre: 'Casa' },
  { pk: 2, destino_id_id: 1, nombre: 'Departamento' },
  { pk: 3, destino_id_id: 2, nombre: 'Centro residencial del sistema de atención a la niñez y adolescencia' },
  { pk: 4, destino_id_id: 2, nombre: 'Hogar estudiantil (residencias y albergues estudiantiles)' },
  { pk: 5, destino_id_id: 2, nombre: 'Establecimiento de larga estadía para adultos mayores' },
  { pk: 6, destino_id_id: 3, nombre: 'Establecimiento de alojamiento turístico' },
  { pk: 7, destino_id_id: 4, nombre: 'Centro de investigación científica' },
  { pk: 8, destino_id_id: 4, nombre: 'Centro de desarrollo y transferencia tecnológica' },
  { pk: 9, destino_id_id: 4, nombre: 'Centro de innovación técnica' },
  { pk: 10, destino_id_id: 5, nombre: 'Centro comercial' },
  { pk: 11, destino_id_id: 5, nombre: 'Tienda por departamentos' },
  { pk: 12, destino_id_id: 5, nombre: 'Supermercado' },
  { pk: 13, destino_id_id: 5, nombre: 'Local comercial' },
  { pk: 14, destino_id_id: 5, nombre: 'Restaurant' },
  { pk: 15, destino_id_id: 5, nombre: 'Fuente de soda' },
  { pk: 16, destino_id_id: 5, nombre: 'Bar' },
  { pk: 17, destino_id_id: 5, nombre: 'Discoteca' },
  { pk: 18, destino_id_id: 5, nombre: 'Estación de servicio' },
  { pk: 19, destino_id_id: 5, nombre: 'Centro de servicio automotor' },
  { pk: 20, destino_id_id: 5, nombre: 'Otro equipamiento de clase comercio' },
  { pk: 21, destino_id_id: 6, nombre: 'Templo' },
  { pk: 22, destino_id_id: 6, nombre: 'Centro cultural' },
  { pk: 23, destino_id_id: 6, nombre: 'Museo' },
  { pk: 24, destino_id_id: 6, nombre: 'Biblioteca' },
  { pk: 25, destino_id_id: 6, nombre: 'Galería de arte' },
  { pk: 26, destino_id_id: 6, nombre: 'Centro de convenciones' },
  { pk: 27, destino_id_id: 6, nombre: 'Sala de concierto o espectáculos' },
  { pk: 28, destino_id_id: 6, nombre: 'Cine' },
  { pk: 29, destino_id_id: 6, nombre: 'Teatro' },
  { pk: 30, destino_id_id: 6, nombre: 'Auditorio' },
  { pk: 31, destino_id_id: 6, nombre: 'Otro equipamiento de clase culto y cultura' },
  { pk: 32, destino_id_id: 7, nombre: 'Estadio' },
  { pk: 33, destino_id_id: 7, nombre: 'Centro o club deportivo' },
  { pk: 34, destino_id_id: 7, nombre: 'Gimnasio' },
  { pk: 35, destino_id_id: 7, nombre: 'Multicancha' },
  { pk: 36, destino_id_id: 7, nombre: 'Otro equipamiento de deporte o actividad física' },
  { pk: 37, destino_id_id: 8, nombre: 'Establecimiento de educación parvularia (sala cuna, jardínes infantiles) y pre-básica' },
  { pk: 38, destino_id_id: 8, nombre: 'Establecimiento de educación básica, media, especial o técnico-profesional' },
  { pk: 39, destino_id_id: 8, nombre: 'Establecimiento de educación superior (universidad, instituto profesional o centro de formación técnica)' },
  { pk: 40, destino_id_id: 8, nombre: 'Otro equipamiento educacional' },
  { pk: 41, destino_id_id: 9, nombre: 'Parque de entretenciones' },
  { pk: 42, destino_id_id: 9, nombre: 'Local de juegos electrónicos o mecánicos' },
  { pk: 43, destino_id_id: 9, nombre: 'Zoológico' },
  { pk: 44, destino_id_id: 9, nombre: 'Casino de juegos' },
  { pk: 45, destino_id_id: 9, nombre: 'Otro equipamiento de esparcimiento' },
  { pk: 46, destino_id_id: 10, nombre: 'Servicio de atención primaria de urgencia' },
  { pk: 47, destino_id_id: 10, nombre: 'Centro de salud familiar' },
  { pk: 48, destino_id_id: 10, nombre: 'Otro establecimiento de atención primaria' },
  { pk: 49, destino_id_id: 10, nombre: 'Centro de referencia de salud' },
  { pk: 50, destino_id_id: 10, nombre: 'Centro de rehabilitación' },
  { pk: 51, destino_id_id: 10, nombre: 'Otro establecimiento de atención secundaria' },
  { pk: 52, destino_id_id: 10, nombre: 'Hospital de alta, mediana o baja complejidad' },
  { pk: 53, destino_id_id: 10, nombre: 'Clínica privada' },
  { pk: 54, destino_id_id: 10, nombre: 'Otro establecimiento de atención terciaria' },
  { pk: 55, destino_id_id: 10, nombre: 'Cementerio' },
  { pk: 56, destino_id_id: 10, nombre: 'Crematorio' },
  { pk: 59, destino_id_id: 12, nombre: 'Oficina de servicios públicos o privados' },
  { pk: 60, destino_id_id: 12, nombre: 'Centros médicos o dentales' },
  { pk: 61, destino_id_id: 12, nombre: 'Servicios artesanales y de reparación de objetos diversos' },
  { pk: 62, destino_id_id: 12, nombre: 'Edificios o playas de estacionamientos' },
  { pk: 63, destino_id_id: 13, nombre: 'Sede junta de vecinos' },
  { pk: 64, destino_id_id: 13, nombre: 'Club social' },
  { pk: 65, destino_id_id: 13, nombre: 'Otro equipamiento destinado a actividades comunitarias' },
  { pk: 66, destino_id_id: 14, nombre: 'Industrias' },
  { pk: 67, destino_id_id: 14, nombre: 'Grandes depósitos' },
  { pk: 68, destino_id_id: 14, nombre: 'Bodegas industriales' },
  { pk: 69, destino_id_id: 14, nombre: 'Talleres' },
  { pk: 70, destino_id_id: 14, nombre: 'Planta de revisión técnica' },
  { pk: 71, destino_id_id: 15, nombre: 'Terminal de servicios de transporte público urbano, interurbano o rural, con movimiento de pasajeros' },
  { pk: 72, destino_id_id: 15, nombre: 'Terminal de servicios de locomoción colectiva urbana, sin movimiento de pasajeros' },
  { pk: 73, destino_id_id: 15, nombre: 'Puertos con carga contenedores' },
  { pk: 74, destino_id_id: 15, nombre: 'Puertos con carga a granel' },
  { pk: 75, destino_id_id: 15, nombre: 'Aeródromo o aeropuerto transporte privado' },
  { pk: 76, destino_id_id: 15, nombre: 'Relleno sanitario' },
  { pk: 77, destino_id_id: 15, nombre: 'Estación exclusiva de transferencia de residuos' },
  { pk: 82, destino_id_id: 11, nombre: 'Vivienda - Casa' },
  { pk: 83, destino_id_id: 11, nombre: 'Vivienda - Departamento' },
  { pk: 84, destino_id_id: 11, nombre: 'Servicio - Oficina de servicios públicos o privados' },
  { pk: 85, destino_id_id: 11, nombre: 'Salud - Hospital de alta, mediana o baja complejidad (*)' },
  { pk: 86, destino_id_id: 16, nombre: 'Científico - Centro de investigación científica' },
  { pk: 87, destino_id_id: 16, nombre: 'Científico - Centro de desarrollo y transferencia tecnológica' },
  { pk: 88, destino_id_id: 16, nombre: 'Científico - Centro de innovación técnica' },
  { pk: 100, destino_id_id: 16, nombre: 'Culto y cultura - Templo' },
  { pk: 101, destino_id_id: 16, nombre: 'Culto y cultura - Centro cultural' },
  { pk: 102, destino_id_id: 16, nombre: 'Culto y cultura - Museo' },
  { pk: 103, destino_id_id: 16, nombre: 'Culto y cultura - Biblioteca' },
  { pk: 104, destino_id_id: 16, nombre: 'Culto y cultura - Galería de arte' },
  { pk: 105, destino_id_id: 16, nombre: 'Culto y cultura - Centro de convenciones' },
  { pk: 106, destino_id_id: 16, nombre: 'Culto y cultura - Sala de concierto o espectáculos' },
  { pk: 107, destino_id_id: 16, nombre: 'Culto y cultura - Cine' },
  { pk: 108, destino_id_id: 16, nombre: 'Culto y cultura - Teatro' },
  { pk: 109, destino_id_id: 16, nombre: 'Culto y cultura - Auditorio' },
  { pk: 110, destino_id_id: 16, nombre: 'Culto y cultura - Otro equipamiento de clase culto y cultura' },
  { pk: 111, destino_id_id: 16, nombre: 'Deporte - Estadio' },
  { pk: 112, destino_id_id: 16, nombre: 'Deporte - Centro o club deportivo' },
  { pk: 113, destino_id_id: 16, nombre: 'Deporte - Gimnasio' },
  { pk: 114, destino_id_id: 16, nombre: 'Deporte - Multicancha' },
  { pk: 115, destino_id_id: 16, nombre: 'Deporte - Otro equipamiento de deporte o actividad física' },
  { pk: 120, destino_id_id: 16, nombre: 'Esparcimiento - Parque de entretenciones' },
  { pk: 121, destino_id_id: 16, nombre: 'Esparcimiento - Local de juegos electrónicos o mecánicos' },
  { pk: 122, destino_id_id: 16, nombre: 'Esparcimiento - Zoológico' },
  { pk: 123, destino_id_id: 16, nombre: 'Esparcimiento - Casino de juegos' },
  { pk: 124, destino_id_id: 16, nombre: 'Esparcimiento - Otro equipamiento de esparcimiento' },
  { pk: 125, destino_id_id: 6, nombre: 'Establecimiento destinado a actividades de desarrollo espiritual o religioso' },
  { pk: 126, destino_id_id: 16, nombre: 'Culto y cultura - Establecimiento destinado a actividades de desarrollo espiritual o religioso' },
  { pk: 127, destino_id_id: 15, nombre: 'Infraestuctura sanitaria' },
  { pk: 128, destino_id_id: 15, nombre: 'Infraestuctura energética' }
];

// Función para cargar dproyecto data
export const loadDProyectoData = async (): Promise<DProyecto[]> => {
  // Por ahora retornamos datos hardcodeados, pero esto se puede cambiar a fetch
  // cuando los JSONs estén en el servidor
  try {
    const response = await fetch('/dproyecto.json');
    if (response.ok) {
      const data = await response.json();
      return data.map((item: any) => ({
        pk: item.pk,
        nombre: item.fields.nombre,
        destino_id_id: item.fields.destino_id_id
      }));
    }
  } catch (error) {
    console.warn('No se pudo cargar dproyecto.json, usando datos hardcodeados', error);
  }
  
  // Datos hardcodeados como fallback
  return DPROYECTO_DATA_RAW.map(item => ({
    pk: item.pk,
    nombre: item.nombre,
    destino_id_id: item.destino_id_id
  }));
};

export const getUsoSueloOptions = (): UsoSuelo[] => {
  return USO_SUELO_DATA;
};

