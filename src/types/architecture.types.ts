import { ProjectNode } from './project_nodes.types';

export interface ArchitectureData {
  id: number;
  node: number;
  is_active: boolean;
  start_date: string | null;
  created_at: string;
  updated_at: string;
}

// Extendemos ProjectNode para incluir los datos de arquitectura cuando corresponda
export interface ArchitectureProjectNode extends ProjectNode {
  architecture_data: ArchitectureData | null;
}

// Tipos para los permisos
export interface PermitSubTypeItem {
  id: number;
  permit_sub_type: string;
}

export interface PermitTypeSubtypes {
  [group: string]: PermitSubTypeItem[];
}

export interface PermitType {
  id: number;
  permit_type: string;
  subtypes: PermitTypeSubtypes;
}

export interface PermitSubType {
  id: number;
  permit_sub_type: string;
} 