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
  // groups contiene los subgrupos de "formularios_minvu" (mostrados en el selector de Grupo)
  const [groups, setGroups] = useState<Subgroup[]>([]);
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  
  // selectedGroup es realmente un subgrupo de formularios_minvu
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState<number | null>(null);
  const [selectedProjectType, setSelectedProjectType] = useState<number | null>(null);
  
  const [loading, setLoading] = useState({
    groups: false,
    subgroups: false,
    projectTypes: false,
  });

  // Cargar subgrupos de "formularios_minvu" al montar y mostrarlos como "groups"
  useEffect(() => {
    loadFormulariosMinvuSubgroups();
  }, []);

  // Cargar subgrupos cuando se selecciona un grupo (que es un subgrupo de formularios_minvu)
  useEffect(() => {
    if (selectedGroup) {
      // Cargar los subgrupos del grupo seleccionado (ej: subgrupos de "Permisos de Obra Menor")
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

  // Cargar directamente los subgrupos de "formularios_minvu" y mostrarlos como "groups"
  const loadFormulariosMinvuSubgroups = async () => {
    setLoading(prev => ({ ...prev, groups: true }));
    try {
      // Primero obtener todos los grupos para encontrar "formularios_minvu"
      const groupsResponse = await fetch(`${API_URL}/api/architecture/architecture-project-types/groups/`);
      
      if (!groupsResponse.ok) {
        console.error('Error loading groups:', groupsResponse.statusText);
        return;
      }
      
      const groupsData = await groupsResponse.json();
      const formulariosMinvuGroup = groupsData.find((g: Group) => g.code === 'formularios_minvu');
      
      if (!formulariosMinvuGroup) {
        console.error('Formularios MINVU group not found');
        return;
      }
      
      // Cargar los subgrupos de "formularios_minvu"
      const subgroupsResponse = await fetch(`${API_URL}/api/architecture/architecture-project-types/subgroups/?group_id=${formulariosMinvuGroup.id}`);
      
      if (!subgroupsResponse.ok) {
        console.error('Error loading subgroups:', subgroupsResponse.statusText);
        return;
      }
      
      const subgroupsData = await subgroupsResponse.json();
      
      // Los subgrupos se muestran como "groups" en el selector de Grupo
      setGroups(subgroupsData);
      setSubgroups(subgroupsData);
    } catch (error) {
      console.error('Error loading formularios minvu subgroups:', error);
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  const loadSubgroups = async (groupId: number) => {
    setLoading(prev => ({ ...prev, subgroups: true }));
    try {
      // Cargar los subgrupos del grupo seleccionado (ej: subgrupos de "Permisos de Obra Menor")
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
    // groupId es un subgrupo de formularios_minvu (ej: "Permisos de Obra Menor")
    setSelectedGroup(groupId);
    setSelectedSubgroup(null); // Limpiar subgrupo seleccionado
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
    setGroups([]);
    setSubgroups([]);
    setProjectTypes([]);
    // Recargar los subgrupos de formularios_minvu
    loadFormulariosMinvuSubgroups();
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
