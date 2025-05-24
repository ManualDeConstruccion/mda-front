import React from 'react';
import { useParams } from 'react-router-dom';
import { formRegistry } from './formRegistry';

const Step3FormPage: React.FC = () => {
  const { formType, nodeId } = useParams();

  if (!formType) {
    return <div>Falta el tipo de formulario en la URL.</div>;
  }

  const registry = formRegistry[formType];
  if (!registry) {
    return <div>Formulario no encontrado: {formType}</div>;
  }

  const FormComponent = registry.FormComponent;
  return <FormComponent nodeId={nodeId} />;
};

export default Step3FormPage; 