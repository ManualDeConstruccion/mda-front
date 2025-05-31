import React from 'react';
import { useParams } from 'react-router-dom';
import { formRegistry } from './formRegistry';

const Step3FormPage: React.FC = () => {
  const { formTypeModel, nodeId: instanceId } = useParams();
  const nodeId = window.history.state && window.history.state.usr && window.history.state.usr.nodeId;

  console.log('Step3FormPage params:', { formTypeModel, nodeId, instanceId });
  console.log('formRegistry keys:', Object.keys(formRegistry));

  if (!formTypeModel) {
    return <div>Falta el tipo de formulario en la URL.</div>;
  }

  const registry = formRegistry[formTypeModel];
  if (!registry) {
    console.error('Formulario no encontrado:', formTypeModel);
    return <div>Formulario no encontrado: {formTypeModel}</div>;
  }

  const FormComponent = registry.FormComponent;
  return <FormComponent nodeId={nodeId} instanceId={instanceId} />;
};

export default Step3FormPage; 