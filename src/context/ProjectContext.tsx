import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProjectContextType {
  projectNodeId: number | null;
  setProjectNodeId: (id: number | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
  projectNodeId: number;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ 
  children, 
  projectNodeId: initialProjectNodeId 
}) => {
  const [projectNodeId, setProjectNodeId] = useState<number | null>(initialProjectNodeId);

  return (
    <ProjectContext.Provider value={{ projectNodeId, setProjectNodeId }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};

