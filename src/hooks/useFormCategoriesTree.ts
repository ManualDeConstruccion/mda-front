import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL;

export interface FormType {
  id: number;
  name: string;
  description: string | null;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  children: Category[];
  form_types: FormType[];
  parent_name?: string;
}

// NUEVO: Agrupación por node_type_name
export interface NodeTypeCategoryGroup {
  node_type_name: string;
  categories: Category[];
}

export const useFormCategoriesTree = (search?: string, node_type_name?: string) => {
  const { accessToken } = useAuth();
  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  const query = useQuery({
    queryKey: ['formCategoriesTree', search, node_type_name, accessToken],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (node_type_name) params.append('node_type_name', node_type_name);
      const url = `${API_URL}/categories/tree/${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axios.get<NodeTypeCategoryGroup[]>(url, axiosConfig);
      return response.data;
    },
    enabled: !!accessToken,
  });

  return {
    categories: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}; 