import CAMForm from './CaseForms/CAMForm';
import { useCAMApi } from '../../hooks/FormHooks/useCAMApi';

export const formRegistry: Record<string, {
  FormComponent: React.ComponentType<any>,
  useApi: () => any,
  contentType: string
}> = {
  analyzedsolution: {
    FormComponent: CAMForm,
    useApi: useCAMApi,
    contentType: 'fire_protection.analyzedsolution',
  },
  // Agrega aquí otros modelos en el futuro
}; 