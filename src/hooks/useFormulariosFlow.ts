// front/src/hooks/useFormulariosFlow.ts

import { useState, useEffect } from 'react';
import { fetchFormulariosData, FormulariosData, TipoFormulario, TipoObra, FormularioItem } from '../services/formulariosService';

export type FlowStep = 'initial' | 'tipo_formulario' | 'tipo_obra' | 'formulario_especifico';

export interface FlowState {
  step: FlowStep;
  selectedTipoFormulario: TipoFormulario | null;
  selectedTipoObra: TipoObra | null;
  selectedFormulario: FormularioItem | null;
}

export const useFormulariosFlow = () => {
  const [data, setData] = useState<FormulariosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flowState, setFlowState] = useState<FlowState>({
    step: 'initial',
    selectedTipoFormulario: null,
    selectedTipoObra: null,
    selectedFormulario: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const formulariosData = await fetchFormulariosData();
        setData(formulariosData);
      } catch (err) {
        console.error('Error cargando formularios:', err);
        setError('No se pudieron cargar los formularios. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const selectTipoFormulario = (tipoFormulario: TipoFormulario) => {
    setFlowState({
      step: 'tipo_obra',
      selectedTipoFormulario: tipoFormulario,
      selectedTipoObra: null,
      selectedFormulario: null
    });
  };

  const selectTipoObra = (tipoObra: TipoObra) => {
    setFlowState(prev => ({
      ...prev,
      step: 'formulario_especifico',
      selectedTipoObra: tipoObra,
      selectedFormulario: null
    }));
  };

  const selectFormulario = (formulario: FormularioItem) => {
    setFlowState(prev => ({
      ...prev,
      selectedFormulario: formulario
    }));
  };

  const goBack = () => {
    setFlowState(prev => {
      if (prev.step === 'formulario_especifico') {
        return { ...prev, step: 'tipo_obra', selectedFormulario: null };
      }
      if (prev.step === 'tipo_obra') {
        return { ...prev, step: 'initial', selectedTipoFormulario: null, selectedTipoObra: null };
      }
      return prev;
    });
  };

  const reset = () => {
    setFlowState({
      step: 'initial',
      selectedTipoFormulario: null,
      selectedTipoObra: null,
      selectedFormulario: null
    });
  };

  return {
    data,
    loading,
    error,
    flowState,
    selectTipoFormulario,
    selectTipoObra,
    selectFormulario,
    goBack,
    reset
  };
};

