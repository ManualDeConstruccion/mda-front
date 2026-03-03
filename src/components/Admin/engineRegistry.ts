import type { ComponentType } from 'react';
import SuperficiesSectionContent from './SuperficiesSectionContent';
import OcupacionSectionContent from './OcupacionSectionContent';
import PropiedadSectionContent from './PropiedadSectionContent';

interface EngineComponentProps {
  subprojectId: number;
}

/**
 * Registro de componentes de motores de sección.
 * Para agregar un nuevo motor: importar el componente y agregar una entrada por code.
 */
const ENGINE_COMPONENTS: Record<string, ComponentType<EngineComponentProps>> = {
  superficies: SuperficiesSectionContent,
  ocupacion: OcupacionSectionContent,
  propiedad: PropiedadSectionContent,
};

export type { EngineComponentProps };
export default ENGINE_COMPONENTS;
