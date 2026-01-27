// src/components/FloorEditor/FloorsSummaryTab.tsx
// Resumen de superficies en grilla estilo SectionTreeWithModes: cada piso (subterráneos / sobre terreno),
// columnas Útil, Común, Total, sin desplegables. Subtotales por grupo calculados en frontend.

import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useFloors, Floor } from '../../hooks/useFloors';
import styles from './FloorsTab.module.scss';

const HEADER_BG = 'rgba(135, 206, 250, 0.35)';
const DATA_BG = 'background.paper';
const SUBTOTAL_BG = 'rgba(135, 206, 250, 0.2)';

interface FloorsSummaryTabProps {
  projectNodeId: number;
}

const formatNumber = (num: number): string => num.toFixed(2);

interface GridCellProps {
  children: React.ReactNode;
  header?: boolean;
  subtotal?: boolean;
  align?: 'left' | 'center' | 'right';
}

const GridCell: React.FC<GridCellProps> = ({ children, header, subtotal, align = 'left' }) => {
  const justifyContent =
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  return (
    <Box
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: header ? HEADER_BG : subtotal ? SUBTOTAL_BG : DATA_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent,
        minHeight: 44,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: header || subtotal ? 700 : 400,
          color: subtotal ? 'primary.main' : 'text.primary',
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

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
  <div className={styles.section}>
    <h4 className={styles.sectionTitle}>
      <span style={{ fontWeight: 700 }}>{title}</span>
      <span className={styles.sectionSubtitle}>{subtitle}</span>
    </h4>
    <Box
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 2,
          width: '100%',
        }}
      >
        {/* Cabecera */}
        <GridCell header>Piso</GridCell>
        <GridCell header align="center">Útil (m²)</GridCell>
        <GridCell header align="center">Común (m²)</GridCell>
        <GridCell header align="center">Total (m²)</GridCell>

        {/* Filas por piso (sin desplegables) */}
        {floors.map((f) => (
          <React.Fragment key={f.id}>
            <GridCell>{f.name}</GridCell>
            <GridCell align="center">{fmt(f.surface_util ?? 0)}</GridCell>
            <GridCell align="center">{fmt(f.surface_comun ?? 0)}</GridCell>
            <GridCell align="center">{fmt(f.surface_total ?? 0)}</GridCell>
          </React.Fragment>
        ))}

        {/* Subtotal */}
        <GridCell subtotal>{subtotalLabel}</GridCell>
        <GridCell subtotal align="center">{fmt(subtotal.util)}</GridCell>
        <GridCell subtotal align="center">{fmt(subtotal.comun)}</GridCell>
        <GridCell subtotal align="center">{fmt(subtotal.total)}</GridCell>
      </Box>
    </Box>
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

      <div className={styles.section}>
        <h4 className={styles.sectionTitle} style={{ fontWeight: 700 }}>TOTAL GENERAL DEL PROYECTO</h4>
        <Box
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 2,
              width: '100%',
            }}
          >
            <GridCell subtotal>TOTAL GENERAL</GridCell>
            <GridCell subtotal align="center">{formatNumber(totals.general.util)}</GridCell>
            <GridCell subtotal align="center">{formatNumber(totals.general.comun)}</GridCell>
            <GridCell subtotal align="center">{formatNumber(totals.general.total)}</GridCell>
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default FloorsSummaryTab;
