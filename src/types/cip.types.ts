export interface CIPStreetFrontageData {
  id?: number;
  cip?: number;
  order: number;
  street_name: string;
  road_type: string;
  distance_between_lo: string | null;
  distance_lo_to_axis: string | null;
  roadway_width: string | null;
  antejadin: string | null;
}

export type AreaType = 'urbana' | 'extension_urbana' | 'rural' | '';
export type GroupingSystem = 'aislado' | 'pareado' | 'continuo' | 'mixto' | '';
export type UrbanizationStatus = 'ejecutada' | 'recibida' | 'garantizada' | '';
export type AffectedRoadType = 'ensanche' | 'apertura' | '';

export interface CIPData {
  id: number;
  created_at: string;
  updated_at: string;
  has_restrictions: boolean;

  // Bloque 1 — Identificación
  certificate_number: string;
  issue_date: string;
  request_number: string;
  request_date: string | null;
  expiration_date: string | null;
  municipalidad: string;
  region: number | null;
  destination: string;

  // Propiedades y zona PRC
  properties: number[];
  prc_zone: number | null;

  // Bloque 2 — IPT
  area_type: AreaType;
  ipt_intercomunal: string;
  ipt_intercomunal_date: string | null;
  ipt_comunal: string;
  ipt_comunal_date: string | null;
  ipt_seccional: string;
  ipt_seccional_date: string | null;
  ipt_plano_seccional: string;
  ipt_plano_seccional_date: string | null;

  // Bloque 3 — Postergación
  postponement_term: string;
  postponement_decree: string;
  postponement_date: string | null;

  // Bloque 4 — Subsuelo
  requires_subsoil_report: boolean | null;

  // Bloque 5.1 — Normas Urbanísticas
  zone_name: string;
  allowed_uses: string;
  min_lot_area: string | null;
  max_density: string | null;
  max_height: string | null;
  max_floors: number | null;
  grouping_system: GroupingSystem;
  adosamiento: string;
  cos_max: string | null;
  cus_max: string | null;
  upper_floors_cos: string | null;
  rasante: string | null;
  rasante_application_level: string;
  antejadin_min: string | null;
  side_setback_min: string | null;
  rear_setback_min: string | null;
  fence_max_height: string | null;
  fence_transparency_pct: string | null;
  ochavo: string;
  cesiones: string;
  parking_notes: string;

  // Bloque 5.2 — Frentes de calle (read-only nested)
  street_frontages: CIPStreetFrontageData[];

  // Bloque 5.3 — Afectaciones
  affected_public_utility: boolean | null;
  affected_park: boolean | null;
  affected_road: boolean | null;
  affected_road_type: AffectedRoadType;
  affected_public_utility_roads: string;
  affected_public_utility_description: string;
  affected_risk_area: boolean | null;
  affected_risk_area_detail: string;
  affected_protection_area: boolean | null;
  affected_protection_area_detail: string;
  affected_historic: boolean | null;
  affected_historic_detail: string;
  affected_monument: boolean | null;
  affected_monument_detail: string;

  // Bloque 6 — Urbanización
  urbanization_status: UrbanizationStatus;

  // Archivo y notas
  additional_notes: string;
  file: string | null;
}

export type CIPFormData = Omit<CIPData, 'id' | 'created_at' | 'updated_at' | 'has_restrictions' | 'street_frontages'>;
