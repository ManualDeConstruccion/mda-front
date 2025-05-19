import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { NodeType } from '../types/project_nodes.types';

const API_URL = process.env.REACT_APP_API_URL;

export const useNodeTypes = () => {
  return useQuery({
    queryKey: ['nodeTypes'],
    queryFn: async () => {
      const response = await axios.get<NodeType[]>(`${API_URL}/node-types/`);
      return response.data;
    }
  });
}; 