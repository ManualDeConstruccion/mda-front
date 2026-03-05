import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import CAMReportView from './CaseForms/CAMForm/components/CAMReportView';

const REPORT_COMPONENTS: Record<string, React.ComponentType<{ nodeId: string }>> = {
  analyzedsolution: CAMReportView,
};

const FormReportView: React.FC = () => {
  const { formTypeModel, nodeId } = useParams<{ formTypeModel: string; nodeId: string }>();
  if (!formTypeModel || !nodeId) return <Typography>Parámetros inválidos</Typography>;

  const ReportComponent = REPORT_COMPONENTS[formTypeModel.toLowerCase()];
  if (!ReportComponent) {
    return <Typography>No hay informe disponible para este tipo de formulario.</Typography>;
  }

  return <ReportComponent nodeId={nodeId} />;
};

export default FormReportView;
