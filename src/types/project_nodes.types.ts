export interface NodeType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
}

export type TypeCode = 
  | 'list' 
  | 'document' 
  | 'form' 
  | 'certificate' 
  | 'external_link' 
  | 'construction_solution'
  | 'project'
  | 'architecture_subproject'
  | 'stage';

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

export type NodeStatus = 'en_estudio' | 'pendiente' | 'finalizado';

export interface ProjectNode {
  id: number;
  name: string;
  description: string | null;
  type?: TypeCode;
  node_type?: NodeType;
  type_name?: string;
  file_type: FileType | null;
  parent: number | null;
  children: ProjectNode[];
  properties: number[];
  is_active: boolean;
  architecture_project: number | null;
  file: string | null;
  cover_image: string | null;
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
  file_url?: string | null;
  cover_image_url?: string | null;
  object_id: number | null;
  form_type?: {
    id: number;
    app_label: string;
    model: string;
    name: string;
  };
}

export interface CreateProjectNodeDto {
  name: string;
  description?: string;
  type?: TypeCode;
  node_type?: NodeType;
  file_type?: number;
  parent?: number | null;
  properties?: number[];
  is_active?: boolean;
  architecture_project?: number;
  file?: File;
  cover_image?: File;
  external_url?: string;
  external_file_name?: string;
  external_file_id?: string;
  metadata?: Record<string, any>;
  start_date?: string | null;
  end_date?: string | null;
  status?: NodeStatus;
  progress_percent?: number;
  content_type?: number;
  object_id?: number | null;
}

export type UpdateProjectNodeDto = Partial<CreateProjectNodeDto>;
