import React, { useState } from 'react';
import {
  Box, Typography, Button, Grid, Paper, Chip,
  CircularProgress, Alert, TextField, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { useCAMEngine, CAMSolutionSummary } from '../../hooks/useCAMEngine';
import styles from './SurfacesSectionTabs.module.scss';

export type CAMTabType = 'resumen' | 'editor';

export interface CAMSectionContentProps {
  subprojectId: number;
}

function fireResistanceLabel(fr: number | null): string {
  if (fr == null) return '—';
  return `F-${fr}`;
}

function SolutionCard({ solution, onOpen, onDelete }: {
  solution: CAMSolutionSummary;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
      <Grid container alignItems="center" spacing={1}>
        <Grid item xs>
          <Typography variant="body1" fontWeight={600}>{solution.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {solution.description || 'Sin descripción'}
          </Typography>
        </Grid>
        <Grid item>
          <Chip
            label={fireResistanceLabel(solution.fire_resistance)}
            color={solution.fire_resistance ? 'primary' : 'default'}
            size="small"
          />
        </Grid>
        <Grid item>
          {solution.calculated_time != null && (
            <Typography variant="caption" color="text.secondary">
              {solution.calculated_time.toFixed(1)} min
            </Typography>
          )}
        </Grid>
        <Grid item>
          <Chip label={solution.is_symmetric ? 'Simétrica' : 'Asimétrica'} size="small" variant="outlined" />
        </Grid>
        <Grid item>
          <IconButton size="small" title="Abrir editor completo" onClick={onOpen}>
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Grid>
        <Grid item>
          <IconButton size="small" color="error" title="Eliminar" onClick={onDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Grid>
      </Grid>
      {solution.layers && solution.layers.length > 0 && (
        <Table size="small" sx={{ mt: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Pos</TableCell>
              <TableCell>Material</TableCell>
              <TableCell align="right">Espesor (mm)</TableCell>
              <TableCell align="right">Tiempo (min)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {solution.layers.slice(0, 5).map((layer: any) => (
              <TableRow key={layer.id}>
                <TableCell>{layer.position}</TableCell>
                <TableCell>{layer.material}</TableCell>
                <TableCell align="right">{layer.thickness}</TableCell>
                <TableCell align="right">{layer.total_calculated_time?.toFixed(2) ?? '—'}</TableCell>
              </TableRow>
            ))}
            {solution.layers.length > 5 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="caption" color="text.secondary">
                    +{solution.layers.length - 5} capas más...
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}

function CreateSolutionDialog({ open, onClose, onCreate, isCreating }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string }) => void;
  isCreating: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    onCreate({ name, description });
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva solución CAM</DialogTitle>
      <DialogContent>
        <TextField label="Nombre" value={name} onChange={e => setName(e.target.value)} fullWidth sx={{ mt: 1 }} size="small" required />
        <TextField label="Descripción" value={description} onChange={e => setDescription(e.target.value)} fullWidth sx={{ mt: 2 }} size="small" multiline rows={2} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleCreate} disabled={isCreating || !name.trim()}>
          {isCreating ? <CircularProgress size={20} /> : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const CAMSectionContent: React.FC<CAMSectionContentProps> = ({ subprojectId }) => {
  const [activeTab, setActiveTab] = useState<CAMTabType>('resumen');
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const { solutions, isLoading, createSolution, isCreating, deleteSolution } = useCAMEngine(subprojectId);

  const handleOpenEditor = (solutionId: number) => {
    navigate(`/form/analyzedsolution/${solutionId}`, { state: { nodeId: subprojectId } });
  };

  const handleDelete = async (solutionId: number) => {
    if (window.confirm('¿Eliminar esta solución? Esta acción no se puede deshacer.')) {
      await deleteSolution(solutionId);
    }
  };

  const handleCreate = async (data: { name: string; description: string }) => {
    await createSolution(data);
    setCreateOpen(false);
  };

  if (isLoading) {
    return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'resumen' ? styles.active : ''}`} onClick={() => setActiveTab('resumen')}>
          Resumen ({solutions.length})
        </button>
        <button className={`${styles.tab} ${activeTab === 'editor' ? styles.active : ''}`} onClick={() => setActiveTab('editor')}>
          Gestionar soluciones
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'resumen' && (
          <div className={styles.tabPane}>
            {solutions.length === 0 ? (
              <Alert severity="info">
                No hay soluciones CAM vinculadas a este subproyecto. Ve a "Gestionar soluciones" para crear o vincular una.
              </Alert>
            ) : (
              solutions.map(sol => (
                <SolutionCard
                  key={sol.id}
                  solution={sol}
                  onOpen={() => handleOpenEditor(sol.id)}
                  onDelete={() => handleDelete(sol.id)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'editor' && (
          <div className={styles.tabPane}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                Nueva solución CAM
              </Button>
            </Box>

            {solutions.length === 0 ? (
              <Alert severity="info">
                Crea una nueva solución para comenzar el análisis de resistencia al fuego.
              </Alert>
            ) : (
              solutions.map(sol => (
                <SolutionCard
                  key={sol.id}
                  solution={sol}
                  onOpen={() => handleOpenEditor(sol.id)}
                  onDelete={() => handleDelete(sol.id)}
                />
              ))
            )}

            <CreateSolutionDialog
              open={createOpen}
              onClose={() => setCreateOpen(false)}
              onCreate={handleCreate}
              isCreating={isCreating}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CAMSectionContent;
