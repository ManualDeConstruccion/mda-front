import React from 'react';
import { useParams } from 'react-router-dom';
import CAMForm from './CaseForms/CAMForm';

const FormPage: React.FC = () => {
  const { formType, nodeId } = useParams();

  switch (formType) {
    case 'CAM':
      return <CAMForm nodeId={nodeId} />;
    default:
      return <div>Formulario no encontrado: {formType}</div>;
  }
};

export default FormPage; 