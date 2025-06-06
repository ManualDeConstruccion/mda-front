import CAMForm from './CaseForms/CAMForm/CAMindex';
import CAMReportView from './CaseForms/CAMForm/components/CAMReportView';
import { useCAMApi } from '../../hooks/FormHooks/useCAMApi';

export const formRegistry: Record<string, {
  FormComponent: React.ComponentType<any>,
  useApi: () => any,
  contentType: string,
  ReportComponent?: React.ComponentType<{ nodeId: string }>
}> = {
  analyzedsolution: {
    FormComponent: CAMForm,
    useApi: useCAMApi,
    contentType: 'fire_protection.analyzedsolution',
    ReportComponent: CAMReportView,
  },
  // Agrega aquí otros modelos en el futuro
}; 