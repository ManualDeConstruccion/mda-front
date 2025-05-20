import React from 'react';
import { Box, Typography } from '@mui/material';

interface DynamicFormRendererProps {
  modelName: string;
  formData?: any;
  onChange?: (data: any) => void;
}

// Component mapping for different form types
const formComponents: { [key: string]: React.ComponentType<any> } = {
  // Add your form components here as they are created
  // Example:
  // 'AnalyzedSolution': AnalyzedSolutionForm,
  // 'StructuralSolution': StructuralSolutionForm,
};

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  modelName,
  formData,
  onChange,
}) => {
  const FormComponent = formComponents[modelName];

  if (!FormComponent) {
    return (
      <Box p={2}>
        <Typography color="error">
          No se encontró un componente de formulario para el modelo: {modelName}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <FormComponent
        initialData={formData}
        onChange={onChange}
      />
    </Box>
  );
};

export default DynamicFormRenderer; 