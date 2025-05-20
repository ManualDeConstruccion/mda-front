export interface NodeTypeObject {
  id: number;
  name: string;
  code: string;
}

export type NodeType = string;

export type NodeStatus = 'en_estudio' | 'pendiente' | 'finalizado';

export interface FileType {
  id: number;
  name: string;
  code: string;
  mime_types: string[];
  icon: string | null;
  is_active: boolean;
  metadata_schema: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectNode {
  id: number;
  name: string;
  description: string | null;
  type: NodeTypeObject;
  type_code: string;
  file_type: FileType | null;
  parent: number | null;
  children: ProjectNode[];
  properties: number[];
  is_active: boolean;
  architecture_project: number | null;
  file: string | null; // backend file path or URL
  cover_image: string | null; // backend image path or URL
  external_url: string | null;
  external_file_name: string | null;
  external_file_id: string | null;
  metadata: Record<string, any>;
  start_date: string | null;
  end_date: string | null;
  status: NodeStatus;
  progress_percent: number;
  created_at: string;
  updated_at: string;
  file_url?: string | null; // full URL computed in backend
  cover_image_url?: string | null; // full URL computed in backend
}

export interface CreateProjectNodeDto {
  name: string;
  description?: string;
  type: NodeType;
  file_type?: number;
  parent?: number | null;
  properties?: number[];
  is_active?: boolean;
  architecture_project?: number;
  file?: File; // only in requests
  cover_image?: File; // only in requests
  external_url?: string;
  external_file_name?: string;
  external_file_id?: string;
  metadata?: Record<string, any>;
  start_date?: string | null;
  end_date?: string | null;
  status?: NodeStatus;
  progress_percent?: number;
  model_name?: string; // Nombre del modelo de formulario asociado
}

export interface UpdateProjectNodeDto extends Partial<CreateProjectNodeDto> {}
