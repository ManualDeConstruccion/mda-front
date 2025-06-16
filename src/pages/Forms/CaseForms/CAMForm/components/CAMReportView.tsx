import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Divider } from '@mui/material';
import { useCAMApi } from '../../../../../hooks/FormHooks/useCAMApi';
import { PrintPreviewLayout } from '../../../../../components/common/PrintPreviewLayout/PrintPreviewLayout';
import { formRegistry } from '../../../formRegistry';
import { useFormNode } from '../../../../../context/FormNodeContext';
import { useAuth } from '../../../../../context/AuthContext';
import { useReportConfigurations } from '../../../../../hooks/useReportConfigurations';

const CAMReportView: React.FC = () => {
  const { formTypeModel, nodeId } = useParams<{ formTypeModel: string, nodeId: string }>();
  const registry = formRegistry[formTypeModel || 'analyzedsolution'];
  const { data: analyzedSolution, isLoading } = useCAMApi().useRetrieve(Number(nodeId));
  const { nodeData } = useFormNode();
  const { user } = useAuth();
  const nodoCorrecto = nodeData.nodoCorrecto || nodeData.id || nodeData.node;

  // Primer intento: configuración por nodo
  const {
    configuration: nodeConfig,
    isLoading: isNodeConfigLoading,
    isError: isNodeConfigError,
    error: nodeConfigError
  } = useReportConfigurations({ nodeId: nodoCorrecto });

  // Segundo intento: configuración por usuario (si no hay config por nodo)
  const userId = nodeData.owner || user?.id;
  const {
    configuration: userConfig,
    isLoading: isUserConfigLoading,
    isError: isUserConfigError,
    error: userConfigError
  } = useReportConfigurations({ userId });

  // Decide cuál usar
  const reportConfig = nodeConfig || userConfig;
  console.log('Configuración usada en reporte:', reportConfig);

  const navigate = useNavigate();
  // Por ahora solo CAM, pero podrías condicionar por formTypeModel

  if (isLoading) return <Typography>Cargando informe...</Typography>;
  if (!analyzedSolution) return <Typography>No se encontró la solución.</Typography>;

  return (
    <PrintPreviewLayout config={reportConfig}>
    <Box sx={{ p: 4, bgcolor: '#fff' }}>
      
      <Typography variant="h4" gutterBottom>
        Informe de Resistencia al Fuego (CAM)
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {/* Explicación del cálculo de tiempo de aislación */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" gutterBottom>
          <span style={{ fontFamily: 'serif', fontSize: '1.2em' }}>
            t<sub>ais</sub> = <span style={{ fontSize: '1.1em', verticalAlign: 'middle' }}>
              <span style={{ display: 'inline-block', textAlign: 'center' }}>
                <span style={{ borderBottom: '1px solid #000', display: 'block' }}>
                  n-1
                </span>
                <span style={{ fontSize: '0.8em' }}>∑</span>
                <span style={{ display: 'block' }}>i=1</span>
              </span>
            </span>
            t<sub>prot,i</sub> + t<sub>ais,n</sub>
          </span>
        </Typography>
        <Typography variant="body2" gutterBottom>
          <i>en que:</i>
        </Typography>
        <Typography variant="body2">
          t<sub>ais</sub> = tiempo de aislación total de la estructura ensamblada (min)
        </Typography>
        <Typography variant="body2">
          <span style={{ fontFamily: 'serif' }}>
            <span style={{ fontSize: '1.1em', verticalAlign: 'middle' }}>
              <span style={{ display: 'inline-block', textAlign: 'center' }}>
                <span style={{ borderBottom: '1px solid #000', display: 'block' }}>
                  n-1
                </span>
                <span style={{ fontSize: '0.8em' }}>∑</span>
                <span style={{ display: 'block' }}>i=1</span>
              </span>
            </span>
            t<sub>prot,i</sub>
          </span>
          = sumatoria de los tiempos de protección t<sub>prot,i</sub> de las capas (en la dirección del flujo de calor) que preceden a la última capa en la cara no expuesta al fuego, en minutos
        </Typography>
        <Typography variant="body2">
          t<sub>ais,n</sub> = tiempo de aislación asociado solamente a la última capa de la solución constructiva
        </Typography>
      </Box>
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
    </PrintPreviewLayout>
  );
};

export default CAMReportView; 