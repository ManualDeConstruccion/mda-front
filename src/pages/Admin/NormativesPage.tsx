import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import NormativeTree, {
  type RegulationTypeItem,
  type OfficialPublicationItem,
} from '../../components/Admin/NormativeTree';
import CreateRegulationTypeModal from '../../components/Admin/CreateRegulationTypeModal';
import EditRegulationTypeModal from '../../components/Admin/EditRegulationTypeModal';
import CreateOfficialPublicationModal from '../../components/Admin/CreateOfficialPublicationModal';
import EditOfficialPublicationModal from '../../components/Admin/EditOfficialPublicationModal';

const NormativesPage: React.FC = () => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createTypeOpen, setCreateTypeOpen] = useState(false);
  const [editTypeOpen, setEditTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RegulationTypeItem | null>(null);
  const [createPublicationOpen, setCreatePublicationOpen] = useState(false);
  const [regulationTypeIdForPublication, setRegulationTypeIdForPublication] = useState<number | null>(null);
  const [editPublicationModalOpen, setEditPublicationModalOpen] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<OfficialPublicationItem | null>(null);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const headers = {
    withCredentials: true,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} as Record<string, string>,
  };

  const { data: tree, isLoading, error } = useQuery<RegulationTypeItem[]>({
    queryKey: ['normative-admin-tree'],
    queryFn: async () => {
      const res = await axios.get(
        `${API_URL}/api/normative/regulation-types/admin_tree/`,
        headers
      );
      return res.data;
    },
    enabled: !!accessToken,
  });

  const handleCreateType = () => {
    setSelectedType(null);
    setCreateTypeOpen(true);
  };

  const handleEditType = (item: RegulationTypeItem) => {
    setSelectedType(item);
    setEditTypeOpen(true);
  };

  const handleAddPublication = (regulationTypeId: number) => {
    setRegulationTypeIdForPublication(regulationTypeId);
    setCreatePublicationOpen(true);
  };

  const handleEditPublicationMetadata = (pub: OfficialPublicationItem) => {
    setSelectedPublication(pub);
    setEditPublicationModalOpen(true);
  };

  const handleOpenPublicationList = (pub: OfficialPublicationItem) => {
    navigate(`/admin/normativas/publicacion/${pub.id}`);
  };

  const onTreeSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['normative-admin-tree'] });
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            Error al cargar la normativa. Revisa que la API /api/normative/ esté disponible.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Administración de Normativas
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gestiona tipos de documento, publicaciones oficiales, secciones y artículos.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateType}
          >
            Nuevo tipo
          </Button>
        </Box>

        {tree && tree.length > 0 ? (
          <Box>
            {tree.map((rt) => (
              <NormativeTree
                key={rt.id}
                regulationType={rt}
                onAddPublication={handleAddPublication}
                onEditType={handleEditType}
                onEditPublicationMetadata={handleEditPublicationMetadata}
                onOpenPublicationList={handleOpenPublicationList}
              />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No hay tipos de documento. Crea uno para empezar.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateType}
              sx={{ mt: 2 }}
            >
              Crear primer tipo
            </Button>
          </Box>
        )}
      </Box>

      <CreateRegulationTypeModal
        open={createTypeOpen}
        onClose={() => setCreateTypeOpen(false)}
        onSuccess={() => {
          onTreeSuccess();
          setCreateTypeOpen(false);
        }}
      />

      <EditRegulationTypeModal
        open={editTypeOpen}
        onClose={() => {
          setEditTypeOpen(false);
          setSelectedType(null);
        }}
        onSuccess={() => {
          onTreeSuccess();
          setEditTypeOpen(false);
          setSelectedType(null);
        }}
        regulationType={selectedType}
      />

      <CreateOfficialPublicationModal
        open={createPublicationOpen}
        onClose={() => {
          setCreatePublicationOpen(false);
          setRegulationTypeIdForPublication(null);
        }}
        onSuccess={() => {
          onTreeSuccess();
          setCreatePublicationOpen(false);
          setRegulationTypeIdForPublication(null);
        }}
        regulationTypeId={regulationTypeIdForPublication}
      />

      <EditOfficialPublicationModal
        open={editPublicationModalOpen}
        onClose={() => {
          setEditPublicationModalOpen(false);
          setSelectedPublication(null);
        }}
        onSuccess={() => {
          onTreeSuccess();
          setEditPublicationModalOpen(false);
          setSelectedPublication(null);
        }}
        publication={selectedPublication}
      />
    </Container>
  );
};

export default NormativesPage;
