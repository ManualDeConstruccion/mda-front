// src/pages/Projects/ProjectDetail.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectNodes } from '../../hooks/useProjectNodes';
import { ProjectNode } from '../../types/project_nodes.types';
import { TypeCode } from '../../types/project_nodes.types';
import styles from './ProjectDetail.module.scss';
import {
  Add as AddIcon,
  Architecture as ArchitectureIcon,
  Description as DocumentIcon,
  Build as BuildIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import ProjectDetailsSection, { GeneralData } from '../../components/ProjectDetailsSection/ProjectDetailsSection';
import Breadcrumb from '../../components/Breadcrumb/Breadcrumb';
import { PropertyData, CIPData, OwnerData, ArchitectData, ProfessionalsData } from '../../types/property.types';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // Obtener el proyecto principal
  const { projects, updateProject, deleteProject } = useProjectNodes<ProjectNode>({
    type: 'project' as TypeCode
  });
  const project = projects?.find(p => p.id === Number(projectId));

  // Obtener los proyectos de arquitectura asociados
  const { projects: architectureProjects } = useProjectNodes<ProjectNode>({
    parent: Number(projectId),
    type: 'architecture_subproject' as TypeCode
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [generalData, setGeneralData] = useState<GeneralData | undefined>(undefined);
  const [propertyData, setPropertyData] = useState<PropertyData | undefined>(undefined);
  const [cipData, setCipData] = useState<CIPData | undefined>(undefined);
  const [ownerData, setOwnerData] = useState<OwnerData | undefined>(undefined);
  const [professionalsData, setProfessionalsData] = useState<ProfessionalsData | undefined>(undefined);
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
      
      // Compara el estado actual del formulario con los datos originales del proyecto
      // y añade solo los campos que han cambiado.
      Object.entries(formData).forEach(([key, value]) => {
        const originalValue = project ? project[key as keyof typeof project] : undefined;

        // Si el valor es un archivo, siempre se adjunta si existe.
        if (value instanceof File) {
          formDataToSend.append(key, value);
          return;
        }

        // Si el valor ha cambiado con respecto al original, lo añadimos.
        if (value !== originalValue) {
          if (value !== null && value !== undefined) {
             if (typeof value === 'boolean') {
              formDataToSend.append(key, value.toString());
            } else {
              formDataToSend.append(key, value as string);
            }
          }
        }
      });
      
      // No enviar un formulario vacío si no hay cambios
      if (Array.from(formDataToSend.keys()).length === 0) {
        setIsEditing(false);
        return;
      }
      
      await updateProject.mutateAsync({ id: project.id, data: formDataToSend });
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar el proyecto:', error);
    }
  };

  // Inicializar generalData cuando project esté disponible
  useEffect(() => {
    if (project) {
      setGeneralData({
        description: project.description,
        status: project.status,
        progress_percent: project.progress_percent,
        start_date: project.start_date,
        end_date: project.end_date,
        created_at: project.created_at,
        updated_at: project.updated_at,
      });
    }
  }, [project]);

  const handleDelete = () => setDeleteModalOpen(true);

  const handleGeneralSave = (data: GeneralData) => {
    setGeneralData(data);
    // Aquí se enviaría al backend cuando esté disponible
    console.log('General data saved:', data);
  };

  const handlePropertySave = (data: PropertyData) => {
    setPropertyData(data);
    // Aquí se enviaría al backend cuando esté disponible
    console.log('Property data saved:', data);
  };

  const handleCIPSave = (data: CIPData) => {
    setCipData(data);
    // Aquí se enviaría al backend cuando esté disponible
    console.log('CIP data saved:', data);
  };

  const handleOwnerSave = (data: OwnerData) => {
    setOwnerData(data);
    // Aquí se enviaría al backend cuando esté disponible
    console.log('Owner data saved:', data);
  };

  const handleProfessionalsSave = (data: ProfessionalsData) => {
    setProfessionalsData(data);
    // Aquí se enviaría al backend cuando esté disponible
    console.log('Professionals data saved:', data);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {/* Primera fila: Breadcrumb (izquierda) + Botón Volver (derecha) */}
        <Breadcrumb
          items={[
            { label: 'Proyectos', path: '/proyectos/lista' },
            { label: project.name },
          ]}
          backButton={{
            label: 'Volver a Proyectos',
            onClick: () => navigate('/proyectos/lista'),
          }}
        />

        {/* Segunda fila: Nombre (izquierda) + Botones (derecha) */}
        <div className={styles.titleRow}>
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
                <label className={styles.checkboxLabel}>
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
                <label className={styles.fileInputLabel}>
                  Subir imagen
                  <input
                    type="file"
                    name="cover_image"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                {previewUrl && (
                  <div className={styles.imagePreview}>
                    <img src={previewUrl} alt="Vista previa" />
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          ) : (
            <ProjectDetailsSection
              coverImageUrl={project.cover_image_url}
              generalData={generalData}
              ownerData={ownerData}
              propertyData={propertyData}
              cipData={cipData}
              professionalsData={professionalsData}
              onGeneralSave={handleGeneralSave}
              onOwnerSave={handleOwnerSave}
              onPropertySave={handlePropertySave}
              onCIPSave={handleCIPSave}
              onProfessionalsSave={handleProfessionalsSave}
            />
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
      </div>

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        title="Eliminar proyecto"
        message="¿Estás seguro de que deseas eliminar este proyecto? Esta acción es irreversible."
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          try {
            await deleteProject.mutateAsync(project.id);
            setDeleteModalOpen(false);
            navigate('/proyectos');
          } catch (error) {
            console.error('Error al eliminar el proyecto:', error);
            setDeleteModalOpen(false);
          }
        }}
      />
    </div>
  );
};

export default ProjectDetail;
