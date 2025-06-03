export type FireResistance = 15 | 30 | 60 | 90 | 120 | 150 | 180;

export type MaterialType = 
  | 'hormigon' // Hormigón
  | 'mortero' // Mortero
  | 'yeso' // Yeso
  | 'ladrillo' // Ladrillo
  | 'ceramica' // Cerámica
  | 'madera' // Madera
  | 'acero' // Acero
  | 'aluminio' // Aluminio
  | 'vidrio' // Vidrio
  | 'poliestireno' // Poliestireno
  | 'lana_mineral' // Lana Mineral
  | 'lana_vidrio' // Lana de Vidrio
  | 'poliuretano' // Poliuretano
  | 'cortafuego' // Cortafuego
  | 'otro'; // Otro

export interface Layer {
  id?: number;
  material: MaterialType;
  position?: number;
  is_protection_layer: boolean;
  is_insulation_layer: boolean;
  thickness: number;
  apparent_density?: number;
  carbonization_rate: number;
  joint_coefficient: number;
  base_time: number;
  position_coefficients: number[];
  total_calculated_time: number;
}

export interface AnalyzedSolution {
  id?: number;
  node: number[];
  name: string;
  base_solution?: number;
  created_by?: number;
  is_symmetric: boolean;
  has_rf_plaster: boolean;
  description?: string;
  calculated_time?: number;
  fire_resistance?: FireResistance;
  created_at?: string;
  updated_at?: string;
  layers?: Layer[];
}

export interface ProposedLayer extends Layer {
  solution: number;
}

export interface ProposedSolution {
  id?: number;
  base_solution: number;
  description?: string;
  calculated_time?: number;
  fire_resistance?: FireResistance;
  created_at?: string;
  updated_at?: string;
  layers?: ProposedLayer[];
}

// API Response types
export interface AnalyzedSolutionResponse extends AnalyzedSolution {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface ProposedSolutionResponse extends ProposedSolution {
  id: number;
  created_at: string;
  updated_at: string;
}

// API Request types
export interface CreateAnalyzedSolutionRequest {
  name: string;
  node: number[];
  base_solution?: number;
  is_symmetric: boolean;
  has_rf_plaster: boolean;
  description?: string;
  layers?: Omit<Layer, 'id'>[];
}

export interface UpdateAnalyzedSolutionRequest extends Partial<CreateAnalyzedSolutionRequest> {
  id: number;
}

export interface CreateProposedSolutionRequest {
  base_solution: number;
  description?: string;
  layers?: Omit<ProposedLayer, 'id'>[];
}

export interface UpdateProposedSolutionRequest extends Partial<CreateProposedSolutionRequest> {
  id: number;
} 