import { useState, useEffect } from 'react';

// API URL configuration
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

interface Group {
  id: number;
  code: string;
  name: string;
  description: string;
  project_types_count: number;
}

interface Subgroup {
  id: number;
  code: string;
  name: string;
  description: string;
  project_types_count: number;
  parent: {
    id: number;
    name: string;
  };
}

interface RelatedProjectType {
  id: number;
  code: string;
  name: string;
  description: string;
}

interface ProjectType {
  id: number;
  code: string;
  name: string;
  description: string;
  parameter_count: number;
  has_parameters: boolean;
  category: {
    id: number;
    name: string;
    full_path: string;
  };
  regulation_articles: string[];
  related_project_types: RelatedProjectType[];
}

export const useProjectTypeSelectors = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState<number | null>(null);
  const [selectedProjectType, setSelectedProjectType] = useState<number | null>(null);
  
  const [loading, setLoading] = useState({
    groups: false,
    subgroups: false,
    projectTypes: false,
  });

  // Cargar grupos al montar el componente
  useEffect(() => {
    loadGroups();
  }, []);

  // Cargar subgrupos cuando se selecciona un grupo
  useEffect(() => {
    if (selectedGroup) {
      loadSubgroups(selectedGroup);
    } else {
      setSubgroups([]);
      setSelectedSubgroup(null);
      setProjectTypes([]);
      setSelectedProjectType(null);
    }
  }, [selectedGroup]);

  // Cargar tipos de proyecto cuando se selecciona un subgrupo
  useEffect(() => {
    if (selectedSubgroup) {
      loadProjectTypes(selectedSubgroup);
    } else {
      setProjectTypes([]);
      setSelectedProjectType(null);
    }
  }, [selectedSubgroup]);

  const loadGroups = async () => {
    setLoading(prev => ({ ...prev, groups: true }));
    try {
      const response = await fetch(`${API_URL}/api/architecture/architecture-project-types/groups/`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        console.error('Error loading groups:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  const loadSubgroups = async (groupId: number) => {
    setLoading(prev => ({ ...prev, subgroups: true }));
    try {
      const response = await fetch(`${API_URL}/api/architecture/architecture-project-types/subgroups/?group_id=${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setSubgroups(data);
      } else {
        console.error('Error loading subgroups:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading subgroups:', error);
    } finally {
      setLoading(prev => ({ ...prev, subgroups: false }));
    }
  };

  const loadProjectTypes = async (subgroupId: number) => {
    setLoading(prev => ({ ...prev, projectTypes: true }));
    try {
      const response = await fetch(`${API_URL}/api/architecture/architecture-project-types/project_types/?subgroup_id=${subgroupId}`);
      if (response.ok) {
        const data = await response.json();
        setProjectTypes(data);
      } else {
        console.error('Error loading project types:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading project types:', error);
    } finally {
      setLoading(prev => ({ ...prev, projectTypes: false }));
    }
  };

  const handleGroupChange = (groupId: number | null) => {
    setSelectedGroup(groupId);
    setSelectedSubgroup(null);
    setSelectedProjectType(null);
  };

  const handleSubgroupChange = (subgroupId: number | null) => {
    setSelectedSubgroup(subgroupId);
    setSelectedProjectType(null);
  };

  const handleProjectTypeChange = (projectTypeId: number | null) => {
    setSelectedProjectType(projectTypeId);
  };

  const getSelectedProjectType = (): ProjectType | null => {
    if (!selectedProjectType) return null;
    return projectTypes.find(pt => pt.id === selectedProjectType) || null;
  };

  const reset = () => {
    setSelectedGroup(null);
    setSelectedSubgroup(null);
    setSelectedProjectType(null);
    setSubgroups([]);
    setProjectTypes([]);
  };

  return {
    // Data
    groups,
    subgroups,
    projectTypes,
    
    // Selected values
    selectedGroup,
    selectedSubgroup,
    selectedProjectType,
    
    // Loading states
    loading,
    
    // Handlers
    handleGroupChange,
    handleSubgroupChange,
    handleProjectTypeChange,
    
    // Utilities
    getSelectedProjectType,
    reset,
  };
};
