import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useProjectSnapshots } from '../../hooks/useProjectSnapshots';
import { Edit as EditIcon } from '@mui/icons-material';
import VersionManagementModal from './VersionManagementModal';
import styles from './ProjectVersionSelector.module.scss';

const ProjectVersionSelector: React.FC = () => {
  const { projectNodeId } = useProject();
  const { 
    snapshots, 
    isLoadingSnapshots, 
    activeSnapshot,
    restoreSnapshot 
  } = useProjectSnapshots(projectNodeId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  if (!projectNodeId) {
    return null;
  }

  const handleVersionChange = async (snapshotId: string) => {
    if (!projectNodeId) return;

    const selectedId = parseInt(snapshotId);
    const selectedSnapshot = snapshots.find(s => s.id === selectedId);

    if (!selectedSnapshot || selectedSnapshot.is_active) {
      return; // No hacer nada si es la misma versión activa
    }

    try {
      setIsChanging(true);
      await restoreSnapshot.mutateAsync({
        projectNodeId,
        snapshotId: selectedId,
        data: {
          exact_restore: true,
        },
      });
      // La invalidación de queries y refresh de página ya se hace en el hook
    } catch (error: any) {
      alert(error.response?.data?.detail || error.response?.data?.message || 'Error al cambiar de versión');
    } finally {
      setIsChanging(false);
    }
  };

  if (isLoadingSnapshots) {
    return (
      <div className={styles.container}>
        <span className={styles.loading}>Cargando versiones...</span>
      </div>
    );
  }

  const sortedSnapshots = [...snapshots].sort((a, b) => b.version - a.version);

  return (
    <>
      <div className={styles.container}>
        <label className={styles.label}>Versión:</label>
        <select
          className={styles.select}
          value={activeSnapshot?.id ?? ''}
          onChange={(e) => handleVersionChange(e.target.value)}
          disabled={isChanging || sortedSnapshots.length === 0}
        >
          {sortedSnapshots.length === 0 ? (
            <option value="">Sin versiones</option>
          ) : (
            sortedSnapshots.map((snapshot) => (
              <option key={snapshot.id} value={snapshot.id}>
                {snapshot.name} (v{snapshot.version})
                {snapshot.is_active ? ' ✓' : ''}
              </option>
            ))
          )}
        </select>
        {isChanging && (
          <span className={styles.changing}>Cambiando...</span>
        )}
        <button
          className={styles.editButton}
          onClick={() => setIsModalOpen(true)}
          aria-label="Gestionar versiones"
          disabled={isChanging}
        >
          <EditIcon fontSize="small" />
        </button>
      </div>

      {isModalOpen && (
        <VersionManagementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default ProjectVersionSelector;

