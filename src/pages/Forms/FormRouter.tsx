import { useParams } from 'react-router-dom';
import CAMForm from './CaseForms/CAMForm';

export default function ConstructionSolutionFormRouter() {
  const { formType, nodeId } = useParams();

  switch (formType) {
    case 'cam':
      return <CAMForm nodeId={nodeId} />;
    // Aquí puedes agregar más formularios según el formType
    default:
      return <div>Formulario no encontrado</div>;
  }
} 