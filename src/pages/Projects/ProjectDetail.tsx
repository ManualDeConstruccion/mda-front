// src/pages/Projects/ProjectDetail.tsx

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { ArchitectureProjectNode } from '../../types/architecture.types';
import { NodeType } from '../../types/project_nodes.types';
import styles from './ProjectDetail.module.scss';
import {
  Add as AddIcon,
  Architecture as ArchitectureIcon,
  Description as DocumentIcon,
  Build as BuildIcon,
  People as PeopleIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // Obtener el proyecto principal
  const { projects, updateProject, deleteProject } = useProjectNodes<ArchitectureProjectNode>({
    type: 'project' as NodeType
  });
  const project = projects?.find(p => p.id === Number(projectId));

  // Obtener los proyectos de arquitectura asociados
  const { projects: architectureProjects } = useProjectNodes<ArchitectureProjectNode>({
    parent: Number(projectId),
    type: 'architecture_subproject' as NodeType
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    is_active: project?.is_active || true,
    status: project?.status || 'en_estudio',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    cover_image: null as File | null,
    type: 'project' as const,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(project?.cover_image_url || null);

  const handleCreateArchitectureProject = () => {
    navigate(`/proyectos/${projectId}/arquitectura/crear`);
  };

  if (!project) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>Proyecto no encontrado.</p>
        <button onClick={() => navigate('/proyectos')}>Volver a Proyectos</button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, cover_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          if (typeof value === 'boolean') {
            formDataToSend.append(key, value.toString());
          } else if (value instanceof File) {
            formDataToSend.append(key, value);
          } else {
            formDataToSend.append(key, value as string);
          }
        }
      });

      await updateProject.mutateAsync({ id: project.id, data: formDataToSend });
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar el proyecto:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      try {
        await deleteProject.mutateAsync(project.id);
        navigate('/proyectos');
      } catch (error) {
        console.error('Error al eliminar el proyecto:', error);
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>{project.name}</h1>
          <div className={styles.status}>
            Estado: {project.is_active ? 'Activo' : 'Inactivo'}
          </div>
        </div>
        <div className={styles.actions}>
          {!isEditing ? (
            <>
              <button className={styles.editButton} onClick={() => setIsEditing(true)}>
                <SettingsIcon /> Editar
              </button>
              <button className={styles.deleteButton} onClick={handleDelete}>
                Eliminar
              </button>
            </>
          ) : (
            <button className={styles.cancelButton} onClick={() => setIsEditing(false)}>
              Cancelar
            </button>
          )}
        </div>
      </header>

      <div className={styles.content}>
        <main className={styles.mainInfo}>
          {isEditing ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nombre del Proyecto</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Estado</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="en_estudio">En Estudio</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Fecha de inicio</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    value={formData.start_date} 
                    onChange={handleInputChange} 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Fecha de fin</label>
                  <input 
                    type="date" 
                    name="end_date" 
                    value={formData.end_date} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>
                  <input 
                    type="checkbox" 
                    name="is_active" 
                    checked={formData.is_active} 
                    onChange={handleInputChange} 
                  />
                  Proyecto Activo
                </label>
              </div>

              <div className={styles.formGroup}>
                <label>Imagen de portada</label>
                <input 
                  type="file" 
                  name="cover_image" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                {previewUrl && (
                  <div className={styles.imagePreview}>
                    <img src={previewUrl} alt="Vista previa" />
                  </div>
                )}
              </div>

              <button type="submit" className={styles.submitButton}>
                Guardar Cambios
              </button>
            </form>
          ) : (
            <section className={styles.infoSection}>
              <h2>Detalles del Proyecto</h2>
              <div className={styles.projectDetails}>
                <div className={styles.coverImage}>
                  {project.cover_image_url ? (
                    <img src={project.cover_image_url} alt="Portada del proyecto" />
                  ) : (
                    <div className={styles.noImage}>Sin imagen de portada</div>
                  )}
                </div>

                <div className={styles.info}>
                  <p><strong>Descripción:</strong> {project.description || 'Sin descripción'}</p>
                  <p><strong>Estado:</strong> {project.status}</p>
                  <p><strong>Progreso:</strong> {project.progress_percent}% completado</p>
                  <p><strong>Fecha de inicio:</strong> {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No definida'}</p>
                  <p><strong>Fecha de fin:</strong> {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No definida'}</p>
                  <p><strong>Creado:</strong> {new Date(project.created_at).toLocaleDateString()}</p>
                  <p><strong>Última actualización:</strong> {new Date(project.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </section>
          )}

          <section className={styles.architectureSection}>
            <div className={styles.sectionHeader}>
              <h2>Proyectos de Arquitectura</h2>
              <button 
                className={styles.addButton}
                onClick={handleCreateArchitectureProject}
              >
                <AddIcon /> Nuevo Proyecto de Arquitectura
              </button>
            </div>

            {architectureProjects && architectureProjects.length > 0 ? (
              <div className={styles.architectureGrid}>
                {architectureProjects.map((arch) => (
                  <Link
                    key={arch.id}
                    to={`/proyectos/${projectId}/arquitectura/${arch.id}`}
                    className={styles.architectureCard}
                  >
                    <div className={styles.cardIcon}>
                      <ArchitectureIcon />
                    </div>
                    <div className={styles.cardContent}>
                      <h3>{arch.name}</h3>
                      <p>{arch.description || 'Sin descripción'}</p>
                      <span className={styles.cardStatus}>
                        {arch.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.noProjects}>No hay proyectos de arquitectura creados</p>
            )}
          </section>
        </main>

        <aside className={styles.sideMenu}>
          <div className={styles.menuSection}>
            <Link 
              to={`/proyectos/${projectId}/documentos`}
              className={styles.menuButton}
            >
              <DocumentIcon className={styles.icon} />
              Documentos
            </Link>
            <Link 
              to={`/proyectos/${projectId}/construccion`}
              className={styles.menuButton}
            >
              <BuildIcon className={styles.icon} />
              Construcción
            </Link>
            <Link 
              to={`/proyectos/${projectId}/profesionales`}
              className={styles.menuButton}
            >
              <PeopleIcon className={styles.icon} />
              Profesionales
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProjectDetail;
