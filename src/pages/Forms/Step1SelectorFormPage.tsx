import React, { useState } from 'react';
import { useFormNode } from '../../context/FormNodeContext';
import { useNavigate } from 'react-router-dom';
import { 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Typography, 
  TextField, 
  Box, 
  List, 
  ListItem, 
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useFormCategoriesTree, NodeTypeCategoryGroup } from '../../hooks/useFormCategoriesTree';

function FormCategoryAccordion({ category, depth = 0, onSelectForm }: any) {
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
          <FormCategoryAccordion key={sub.id} category={sub} depth={depth + 1} onSelectForm={onSelectForm} />
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

export default function SelectorFormPage() {
  const { setSelectedForm } = useFormNode();
  const [search, setSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const navigate = useNavigate();
  const { categories, isLoading } = useFormCategoriesTree(search, selectedTypes.length === 1 ? selectedTypes[0] : undefined);

  console.log('categories', categories);

  const handleSelectForm = (form: any) => {
    setSelectedForm({
      ...form,
      node_type: form.node_type,
      type: form.type,
      content_type: form.content_type,
    });
    navigate('/form/node/create');
  };

  const handleTypeFilter = (typeName: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeName) 
        ? prev.filter(t => t !== typeName)
        : [...prev, typeName]
    );
  };

  const filteredCategories = categories;

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

      {/* Filtros de tipo */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {(categories as NodeTypeCategoryGroup[] | undefined)?.map((cat) => (
          <Chip
            key={cat.node_type_name}
            label={cat.node_type_name}
            onClick={() => handleTypeFilter(cat.node_type_name)}
            color={selectedTypes.includes(cat.node_type_name) ? "primary" : "default"}
            variant={selectedTypes.includes(cat.node_type_name) ? "filled" : "outlined"}
          />
        ))}
      </Stack>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <Box>
          {filteredCategories?.map((nodeType) => (
            <Box key={nodeType.node_type_name} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {nodeType.node_type_name}
              </Typography>
              {nodeType.categories?.map((cat) => (
                <FormCategoryAccordion 
                  key={cat.id} 
                  category={cat} 
                  onSelectForm={handleSelectForm} 
                />
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
} 