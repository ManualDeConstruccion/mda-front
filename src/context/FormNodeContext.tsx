import React, { createContext, useContext, useState } from 'react';

interface FormNodeContextType {
  selectedForm: any;
  setSelectedForm: (form: any) => void;
  nodeData: any;
  setNodeData: (data: any) => void;
  projectId: number | null;
  setProjectId: (id: number | null) => void;
  architectureProjectId: number | null;
  setArchitectureProjectId: (id: number | null) => void;
}

const FormNodeContext = createContext<FormNodeContextType | undefined>(undefined);

export const FormNodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [nodeData, setNodeData] = useState<any>({});
  const [projectId, setProjectId] = useState<number | null>(null);
  const [architectureProjectId, setArchitectureProjectId] = useState<number | null>(null);

  return (
    <FormNodeContext.Provider value={{
      selectedForm,
      setSelectedForm,
      nodeData,
      setNodeData,
      projectId,
      setProjectId,
      architectureProjectId,
      setArchitectureProjectId,
    }}>
      {children}
    </FormNodeContext.Provider>
  );
};

export const useFormNode = () => {
  const context = useContext(FormNodeContext);
  if (context === undefined) {
    throw new Error('useFormNode must be used within a FormNodeProvider');
  }
  return context;
}; 