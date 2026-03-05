import type { ComponentType } from 'react';
import SuperficiesSectionContent from './SuperficiesSectionContent';
import OcupacionSectionContent from './OcupacionSectionContent';
import PropiedadSectionContent from './PropiedadSectionContent';
import UsuariosSectionContent from './UsuariosSectionContent';
import CAMSectionContent from './CAMSectionContent';

interface EngineComponentProps {
  subprojectId: number;
  /** Llamar cuando el motor aplica cambios (vincular/desvincular/guardar propiedad, etc.) para recargar el resto de formularios. */
  onMotorAppliedChange?: () => void | Promise<void>;
}

/**
 * Registro de componentes de motores de sección.
 * Para agregar un nuevo motor: importar el componente y agregar una entrada por code.
 *
 * Motores MINVU (regulatorios): propiedad, usuarios, superficies, ocupacion
 * Motores complementarios:      cam
 */
const ENGINE_COMPONENTS: Record<string, ComponentType<EngineComponentProps>> = {
  superficies: SuperficiesSectionContent,
  ocupacion: OcupacionSectionContent,
  propiedad: PropiedadSectionContent,
  usuarios: UsuariosSectionContent,
  cam: CAMSectionContent,
};

export type { EngineComponentProps };
export default ENGINE_COMPONENTS;
