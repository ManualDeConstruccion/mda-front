// src/components/ProjectDetailsSection/ProjectDetailsSection.tsx

import React, { useState } from 'react';
import OwnerTab from '../ProjectTabs/OwnerTab';
import PropertyTab from '../ProjectTabs/PropertyTab';
import CIPTab from '../ProjectTabs/CIPTab';
import ProfessionalsTab from '../ProjectTabs/ProfessionalsTab';
import { OwnerData, PropertyData, CIPData, ProfessionalsData } from '../../types/property.types';
import styles from './ProjectDetailsSection.module.scss';

type TabType = 'general' | 'avance' | 'propietario' | 'propiedad' | 'cip' | 'profesional';

export interface GeneralData {
  description?: string | null;
  status?: string | null;
  progress_percent?: number;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectDetailsSectionProps {
  coverImageUrl?: string | null;
  generalData?: GeneralData;
  ownerData?: OwnerData;
  propertyData?: PropertyData;
  cipData?: CIPData;
  professionalsData?: ProfessionalsData;
  onGeneralSave?: (data: GeneralData) => void;
  onOwnerSave?: (data: OwnerData) => void;
  onPropertySave?: (data: PropertyData) => void;
  onCIPSave?: (data: CIPData) => void;
  onProfessionalsSave?: (data: ProfessionalsData) => void;
}

const ProjectDetailsSection: React.FC<ProjectDetailsSectionProps> = ({
  coverImageUrl,
  generalData,
  ownerData,
  propertyData,
  cipData,
  professionalsData,
  onGeneralSave,
  onOwnerSave,
  onPropertySave,
  onCIPSave,
  onProfessionalsSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isGeneralEditing, setIsGeneralEditing] = useState(false);
  const [isOwnerEditing, setIsOwnerEditing] = useState(false);
  const [isPropertyEditing, setIsPropertyEditing] = useState(false);
  const [isCIPEditing, setIsCIPEditing] = useState(false);
  const [isProfessionalsEditing, setIsProfessionalsEditing] = useState(false);

  return (
    <section className={styles.infoSection}>
      <div className={styles.projectDetailsGrid}>
        {/* Imagen de portada - Izquierda */}
        <div className={styles.coverImage}>
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="Portada del proyecto" />
          ) : (
            <div className={styles.noImage}>Sin imagen de portada</div>
          )}
        </div>

        {/* Sistema de pestañas - Derecha */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'general' ? styles.active : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'avance' ? styles.active : ''}`}
              onClick={() => setActiveTab('avance')}
            >
              Avance
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'propietario' ? styles.active : ''}`}
              onClick={() => setActiveTab('propietario')}
            >
              Propietario
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'propiedad' ? styles.active : ''}`}
              onClick={() => setActiveTab('propiedad')}
            >
              Propiedad
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'cip' ? styles.active : ''}`}
              onClick={() => setActiveTab('cip')}
            >
              CIP
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'profesional' ? styles.active : ''}`}
              onClick={() => setActiveTab('profesional')}
            >
              Profesional
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'general' && (
              <div className={styles.tabPane}>
                <div className={styles.info}>
                  <p><strong>Descripción:</strong> {generalData?.description || 'Sin descripción'}</p>
                  {generalData?.status && <p><strong>Estado:</strong> {generalData.status}</p>}
                  {generalData?.progress_percent !== undefined && (
                    <p><strong>Progreso:</strong> {generalData.progress_percent}% completado</p>
                  )}
                  {generalData?.start_date && (
                    <p><strong>Fecha de inicio:</strong> {new Date(generalData.start_date).toLocaleDateString()}</p>
                  )}
                  {generalData?.end_date && (
                    <p><strong>Fecha de fin:</strong> {new Date(generalData.end_date).toLocaleDateString()}</p>
                  )}
                  <p><strong>Creado:</strong> {new Date(generalData?.created_at || '').toLocaleDateString()}</p>
                  <p><strong>Última actualización:</strong> {new Date(generalData?.updated_at || '').toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {activeTab === 'avance' && (
              <div className={styles.tabPane}>
                <p>Contenido de Avance - Próximamente</p>
              </div>
            )}

            {activeTab === 'propietario' && (
              <div className={styles.tabPane}>
                <OwnerTab
                  data={ownerData as any}
                  onSave={onOwnerSave as any}
                  isEditing={isOwnerEditing}
                  onEditChange={setIsOwnerEditing}
                />
              </div>
            )}

            {activeTab === 'propiedad' && (
              <div className={styles.tabPane}>
                <PropertyTab
                  data={propertyData as any}
                  onSave={onPropertySave as any}
                  isEditing={isPropertyEditing}
                  onEditChange={setIsPropertyEditing}
                />
              </div>
            )}

            {activeTab === 'cip' && (
              <div className={styles.tabPane}>
                <CIPTab
                  data={cipData}
                  onSave={onCIPSave}
                  isEditing={isCIPEditing}
                  onEditChange={setIsCIPEditing}
                />
              </div>
            )}

            {activeTab === 'profesional' && (
              <div className={styles.tabPane}>
                <ProfessionalsTab
                  data={professionalsData as any}
                  onSave={onProfessionalsSave as any}
                  isEditing={isProfessionalsEditing}
                  onEditChange={setIsProfessionalsEditing}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectDetailsSection;
