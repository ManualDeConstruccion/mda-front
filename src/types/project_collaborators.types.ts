/**
 * Tipos para colaboradores de nodo (profesionales intervinientes).
 * Coincide con ProjectCollaboratorSerializer en el backend:
 *   fields = ['id', 'collaborator', 'role', 'company']
 */

export interface NodeCollaboratorUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  rut: string | null;
}

export interface NodeCollaboratorRole {
  id: number;
  role:
    | 'Propietario/a'
    | 'Arquitecto'
    | 'Constructor'
    | 'Revisor independiente'
    | 'Calculista'
    | 'Revisor de Cálculo'
    | 'Coordinador';
}

export interface NodeCollaboratorCompany {
  id: number;
  name: string;
}

/** Respuesta de GET /api/projects/project-nodes/{id}/node-collaborators/ */
export interface NodeCollaborator {
  id: number;
  collaborator: NodeCollaboratorUser | null;
  role: NodeCollaboratorRole | null;
  company: NodeCollaboratorCompany | null;
}

/** Payload para POST /node-collaborators/ */
export interface AddCollaboratorDto {
  user_id: number;
  role_id: number;
  company_id?: number | null;
}

// ── Tipos legacy (conservados para compatibilidad) ──────────────────────────

/** @deprecated Usar NodeCollaborator */
export interface ProjectCollaborator {
  id: number;
  collaborator: NodeCollaboratorUser | null;
  role: NodeCollaboratorRole | null;
  company: NodeCollaboratorCompany | null;
}

/** @deprecated */
export interface CreateProjectCollaboratorDto {
  project: number;
  collaborator: number;
  role?: number | null;
  can_edit?: boolean;
  company?: number | null;
  is_legal_rep?: boolean;
  is_owner?: boolean;
}

/** @deprecated */
export interface UpdateProjectCollaboratorDto {
  role?: number | null;
  can_edit?: boolean;
  company?: number | null;
  is_legal_rep?: boolean;
  is_owner?: boolean;
}
