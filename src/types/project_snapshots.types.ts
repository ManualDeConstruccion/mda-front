export interface ProjectSnapshot {
  id: number;
  project_node: number; // ID del ProjectNode
  version: number;
  name: string;
  created_at: string;
  created_by: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
  reason: string; // Se mantiene "reason" por ahora, pero se mostrará como "descripción"
  snapshot_data: Record<string, any>;
  data_hash: string;
  metadata: Record<string, any>;
  is_active: boolean;
}

export interface CreateProjectSnapshotDto {
  project_node: number;
  name: string;
  reason?: string;
}

export interface UpdateProjectSnapshotDto {
  name?: string;
  reason?: string;
  is_active?: boolean;
}

export interface RestoreSnapshotDto {
  reason?: string;
  exact_restore?: boolean;
}

