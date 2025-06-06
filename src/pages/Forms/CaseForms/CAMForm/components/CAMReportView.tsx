import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Divider } from '@mui/material';
import { useCAMApi } from '../../../../../hooks/FormHooks/useCAMApi';

const CAMReportView: React.FC = () => {
  const { formTypeModel, nodeId } = useParams<{ formTypeModel: string, nodeId: string }>();
  const navigate = useNavigate();
  // Por ahora solo CAM, pero podrías condicionar por formTypeModel
  const { data: analyzedSolution, isLoading } = useCAMApi().useRetrieve(Number(nodeId));

  if (isLoading) return <Typography>Cargando informe...</Typography>;
  if (!analyzedSolution) return <Typography>No se encontró la solución.</Typography>;

  return (
    <Box sx={{ p: 4, bgcolor: '#fff' }}>
      <Typography variant="h4" gutterBottom>
        Informe de Resistencia al Fuego (CAM)
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Ejemplo de adición de una capa de yeso-cartón tipo ST de 15 mm, por la cara no expuesta al fuego, a una solución base de clasificación F-30
      </Typography>
      <Typography variant="body2" gutterBottom>
        <b>NOTA:</b> para simplificación del cálculo de este ejemplo, se considera el análisis sólo en una dirección de flujo de calor.
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">Detalles de la Solución Base</Typography>
        <Typography><b>Nombre:</b> {analyzedSolution.name}</Typography>
        <Typography><b>Descripción:</b> {analyzedSolution.description}</Typography>
      </Box>
      <Box sx={{ mt: 4 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </Box>
    </Box>
  );
};

export default CAMReportView; 