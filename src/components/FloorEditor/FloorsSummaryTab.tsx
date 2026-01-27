// src/components/FloorEditor/FloorsSummaryTab.tsx
// Resumen de superficies en grilla estándar: cada piso (subterráneos / sobre terreno),
// columnas Útil, Común, Total, sin desplegables. Subtotales por grupo calculados en frontend.
// Usa estilos centralizados de grid-standard.

import React, { useMemo } from 'react';
import { useFloors, Floor } from '../../hooks/useFloors';
import { formatNumberLocale } from '../../utils/helpers';
import styles from './FloorsTab.module.scss';
import gridStyles from '../../styles/grid-standard.module.scss';

interface FloorsSummaryTabProps {
  projectNodeId: number;
}

const formatNumber = (num: number): string => formatNumberLocale(num, 2);

function cellClass(
  g: Record<string, string>,
  opts: { header?: boolean; subtotal?: boolean; align?: 'left' | 'center' | 'right' }
): string {
  const { header, subtotal, align = 'left' } = opts;
  const c = [g.gridCell];
  if (header) c.push(g.gridCellHeader);
  else if (subtotal) c.push(g.gridCellSubtotal);
  else c.push(g.gridCellData);
  if (align === 'center') c.push(g.gridCellCenter);
  else if (align === 'right') c.push(g.gridCellRight);
  else c.push(g.gridCellLeft);
  return c.join(' ');
}

interface FloorGroupGridProps {
  title: string;
  subtitle: string;
  floors: Floor[];
  subtotalLabel: string;
  subtotal: { util: number; comun: number; total: number };
  formatNumber: (n: number) => string;
}

const FloorGroupGrid: React.FC<FloorGroupGridProps> = ({
  title,
  subtitle,
  floors,
  subtotalLabel,
  subtotal,
  formatNumber: fmt,
}) => (
  <div className={gridStyles.gridSection}>
    <h4 className={gridStyles.gridSectionTitle}>
      <span style={{ fontWeight: 700 }}>{title}</span>
      <span className={gridStyles.gridSectionSubtitle}>{subtitle}</span>
    </h4>
    <div className={gridStyles.gridContainer}>
      <div className={`${gridStyles.grid} ${gridStyles.gridColumns4}`}>
        <div className={cellClass(gridStyles, { header: true })}>Piso</div>
        <div className={cellClass(gridStyles, { header: true, align: 'center' })}>Útil (m²)</div>
        <div className={cellClass(gridStyles, { header: true, align: 'center' })}>Común (m²)</div>
        <div className={cellClass(gridStyles, { header: true, align: 'center' })}>Total (m²)</div>
        {floors.map((f) => (
          <React.Fragment key={f.id}>
            <div className={cellClass(gridStyles, {})}>{f.name}</div>
            <div className={cellClass(gridStyles, { align: 'center' })}>
              {fmt(f.surface_util ?? 0)}
            </div>
            <div className={cellClass(gridStyles, { align: 'center' })}>
              {fmt(f.surface_comun ?? 0)}
            </div>
            <div className={cellClass(gridStyles, { align: 'center' })}>
              {fmt(f.surface_total ?? 0)}
            </div>
          </React.Fragment>
        ))}
        <div className={cellClass(gridStyles, { subtotal: true })}>{subtotalLabel}</div>
        <div className={cellClass(gridStyles, { subtotal: true, align: 'center' })}>
          {fmt(subtotal.util)}
        </div>
        <div className={cellClass(gridStyles, { subtotal: true, align: 'center' })}>
          {fmt(subtotal.comun)}
        </div>
        <div className={cellClass(gridStyles, { subtotal: true, align: 'center' })}>
          {fmt(subtotal.total)}
        </div>
      </div>
    </div>
  </div>
);

const FloorsSummaryTab: React.FC<FloorsSummaryTabProps> = ({ projectNodeId }) => {
  const { floors, isLoadingFloors } = useFloors({ project_node: projectNodeId });

  const { floorsByType, totals } = useMemo(() => {
    const below = floors.filter((f) => f.floor_type === 'below').sort((a, b) => b.order - a.order);
    const above = floors.filter((f) => f.floor_type === 'above').sort((a, b) => a.order - b.order);

    const calc = (list: Floor[]) =>
      list.reduce(
        (acc, f) => ({
          util: acc.util + (f.surface_util ?? 0),
          comun: acc.comun + (f.surface_comun ?? 0),
          total: acc.total + (f.surface_total ?? 0),
        }),
        { util: 0, comun: 0, total: 0 }
      );

    const subterraneo = calc(below);
    const sobreTerreno = calc(above);
    return {
      floorsByType: { below, above },
      totals: {
        subterraneo,
        sobreTerreno,
        general: {
          util: subterraneo.util + sobreTerreno.util,
          comun: subterraneo.comun + sobreTerreno.comun,
          total: subterraneo.total + sobreTerreno.total,
        },
      },
    };
  }, [floors]);

  if (isLoadingFloors) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando resumen...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 style={{ fontWeight: 700 }}>Resumen de Superficies</h3>
      </div>

      <FloorGroupGrid
        title="S. EDIFICADA SUBTERRÁNEO (S)"
        subtitle="S. Edificada por nivel"
        floors={floorsByType.below}
        subtotalLabel="TOTAL SUBTERRÁNEO"
        subtotal={totals.subterraneo}
        formatNumber={formatNumber}
      />

      <FloorGroupGrid
        title="S. EDIFICADA SOBRE TERRENO"
        subtitle="S. Edificada por nivel"
        floors={floorsByType.above}
        subtotalLabel="TOTAL SOBRE TERRENO"
        subtotal={totals.sobreTerreno}
        formatNumber={formatNumber}
      />

      <div className={gridStyles.gridSection}>
        <h4 className={gridStyles.gridSectionTitle} style={{ fontWeight: 700 }}>
          TOTAL GENERAL DEL PROYECTO
        </h4>
        <div className={gridStyles.gridContainer}>
          <div className={`${gridStyles.grid} ${gridStyles.gridColumns4}`}>
            <div className={cellClass(gridStyles, { subtotal: true })}>TOTAL GENERAL</div>
            <div className={cellClass(gridStyles, { subtotal: true, align: 'center' })}>
              {formatNumber(totals.general.util)}
            </div>
            <div className={cellClass(gridStyles, { subtotal: true, align: 'center' })}>
              {formatNumber(totals.general.comun)}
            </div>
            <div className={cellClass(gridStyles, { subtotal: true, align: 'center' })}>
              {formatNumber(totals.general.total)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorsSummaryTab;
