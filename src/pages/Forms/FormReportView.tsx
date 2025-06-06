import React from 'react';
import { useParams } from 'react-router-dom';
import { formRegistry } from './formRegistry';
import { Typography } from '@mui/material';

const FormReportView: React.FC = () => {
  const { formTypeModel, nodeId } = useParams<{ formTypeModel: string, nodeId: string }>();
  if (!formTypeModel || !nodeId) return <Typography>Parámetros inválidos</Typography>;

  const registry = formRegistry[formTypeModel.toLowerCase()];
  if (!registry || !registry.ReportComponent) {
    return <Typography>No hay informe disponible para este tipo de formulario.</Typography>;
  }

  const ReportComponent = registry.ReportComponent;
  return <ReportComponent nodeId={nodeId} />;
};

export default FormReportView; 