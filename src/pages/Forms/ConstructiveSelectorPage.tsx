import React, { useState } from 'react';
import { useFormNode } from '../../context/FormNodeContext';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionSummary, AccordionDetails, Typography, TextField, Box, List, ListItem, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useFormCategoriesTree } from '../../hooks/useFormCategoriesTree';

function ConstructiveCategoryAccordion({ category, depth = 0, onSelectForm }: any) {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ ml: depth * 2 }}>
          <Typography>{category.name}</Typography>
          {category.description && (
            <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
              {category.description}
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {/* Subcategorías */}
        {category.children?.map((sub: any) => (
          <ConstructiveCategoryAccordion key={sub.id} category={sub} depth={depth + 1} onSelectForm={onSelectForm} />
        ))}
        {/* Formularios */}
        <List>
          {category.form_types?.map((form: any) => (
            <ListItem button key={form.id} sx={{ pl: (depth + 1) * 2 }} onClick={() => onSelectForm(form)}>
              {form.name}
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}

export default function ConstructiveSelectorPage() {
  const { setSelectedForm } = useFormNode();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { categories, isLoading } = useFormCategoriesTree(search);

  console.log(categories);

  const handleSelectForm = (form: any) => {
    setSelectedForm({
      ...form,
      node_type: form.node_type,
      model_name: form.model_name
    });
    navigate('/constructive/create');
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Selecciona el tipo de formulario</Typography>
      <TextField
        label="Buscar formulario"
        value={search}
        onChange={e => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      {isLoading ? (
        <CircularProgress />
      ) : (
        <Box>
          {categories?.map((cat: any) => (
            <ConstructiveCategoryAccordion key={cat.id} category={cat} onSelectForm={handleSelectForm} />
          ))}
        </Box>
      )}
    </Box>
  );
} 