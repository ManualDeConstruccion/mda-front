import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

export interface LayerVisualizationProps {
  layers: any[];
}

export const LayerVisualization: React.FC<LayerVisualizationProps> = ({ layers }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = 3; // Escala visual: 1mm = 3px

  // Siempre trabajar con el array ordenado por absolute_position
  const sortedLayers = [...layers].sort((a, b) => (a.absolute_position ?? 0) - (b.absolute_position ?? 0));

  // Calcular el ancho total usando sortedLayers
  const totalWidth = sortedLayers.reduce((acc, layer) => {
    const t = typeof layer.thickness === 'number' ? layer.thickness : Number(layer.thickness) || 0;
    return acc + t;
  }, 0);

  // Precalcular los labels (letra para CAV, número para el resto)
  let cavLetter = 0;
  const labels = sortedLayers.map(layer => {
    if (layer.material === 'CAV') {
      return String.fromCharCode(97 + cavLetter++); // 'a', 'b', ...
    } else {
      return layer.position;
    }
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const wallLayers = containerRef.current;
    const lines = wallLayers.querySelectorAll('.layer-line');
    const numbers = wallLayers.querySelectorAll('.layer-number');
    const fills = wallLayers.querySelectorAll('.layer-fill');
    let accumulatedWidth = 0;

    // Posicionar líneas y capas usando sortedLayers
    sortedLayers.forEach((layer, index) => {
      // Línea de inicio de la capa
      if (lines[index]) {
        (lines[index] as HTMLElement).style.left = accumulatedWidth + 'px';
      }
      // Capa de fondo (achurado)
      if (fills[index]) {
        const thicknessRaw = layer.thickness;
        const thickness = typeof thicknessRaw === 'number' ? thicknessRaw : Number(thicknessRaw) || 0;
        const scaledThickness = thickness * scale;
        (fills[index] as HTMLElement).style.left = accumulatedWidth + 'px';
        (fills[index] as HTMLElement).style.width = scaledThickness + 'px';
        accumulatedWidth += scaledThickness;
      }
    });

    // Posicionar la última línea al final
    if (lines[sortedLayers.length]) {
      (lines[sortedLayers.length] as HTMLElement).style.left = accumulatedWidth + 'px';
    }

    // Centrar los números entre líneas
    numbers.forEach((number, index) => {
      const left = parseInt((lines[index] as HTMLElement).style.left) || 0;
      const right = parseInt((lines[index + 1] as HTMLElement)?.style.left) || 0;
      const center = left + (right - left) / 2;
      (number as HTMLElement).style.left = center + 'px';
    });

    // Ajustar ancho del contenedor
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      const totalWidthPx = parseFloat((lastLine as HTMLElement).style.left) + 50;
      wallLayers.style.width = totalWidthPx + 'px';
    }
  }, [sortedLayers]);

  return (
    <Box sx={{ width: '100%', padding: 2, display: 'flex', justifyContent: 'center', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ mr: 4, display: 'flex', alignItems: 'center', height: 200 }}>
          <Typography sx={{ fontWeight: 'bold' }}>
            Ancho total de la solución: {totalWidth}mm
          </Typography>
        </Box>
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            height: 200,
            minWidth: 200,
            paddingBottom: 5,
          }}
        >
          {/* Primera línea siempre al inicio */}
          <Box className="layer-line" sx={{
            position: 'absolute',
            top: 0,
            width: 2,
            height: '100%',
            bgcolor: 'black',
          }} />

          {sortedLayers.map((layer, index) => (
            <React.Fragment key={layer.id || index}>
              {/* Capa con achurado */}
              <Box
                className={`layer-fill material-${layer.material}`}
                data-thickness={layer.thickness}
                sx={{
                  position: 'absolute',
                  top: 0,
                  height: '100%',
                  zIndex: 1,
                  ...getMaterialStyle(layer.material),
                }}
              />

              {/* Número en círculo */}
              <Box
                className="layer-number"
                data-thickness={layer.thickness}
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  transform: 'translateX(-50%)',
                  width: 25,
                  height: 25,
                  bgcolor: 'grey.300',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 'bold',
                  zIndex: 2,
                }}
              >
                {labels[index]}
              </Box>

              {/* Línea al final de la capa */}
              <Box className="layer-line" sx={{
                position: 'absolute',
                top: 0,
                width: 2,
                height: '100%',
                bgcolor: 'black',
              }} />
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// Función auxiliar para obtener los estilos de material
const getMaterialStyle = (material: string) => {
  const styles: { [key: string]: any } = {
    PYC: {
      backgroundImage: 'repeating-linear-gradient(45deg, #999 0px, #999 1px, transparent 1px, transparent 4px)',
    },
    PYF: {
      backgroundImage: 'repeating-linear-gradient(-45deg, #bbb 0px, #bbb 2px, transparent 2px, transparent 6px)',
    },
    MAD: {
      backgroundImage: 'repeating-linear-gradient(90deg, #886644 0px, #886644 3px, transparent 3px, transparent 6px)',
    },
    TAB: {
      backgroundImage: 'repeating-linear-gradient(0deg, #c96 0px, #c96 1px, transparent 1px, transparent 4px)',
    },
    OSB: {
      backgroundImage: `
        repeating-linear-gradient(45deg, #555 0px, #555 1px, transparent 1px, transparent 5px),
        repeating-linear-gradient(-45deg, #555 0px, #555 1px, transparent 1px, transparent 5px)
      `,
    },
    LDR: {
      backgroundImage: 'repeating-linear-gradient(0deg, #f88 0px, #f88 2px, transparent 2px, transparent 6px)',
    },
    LDV: {
      backgroundImage: 'repeating-linear-gradient(0deg, #8af 0px, #8af 2px, transparent 2px, transparent 6px)',
    },
    FBC: {
      backgroundImage: 'repeating-linear-gradient(0deg, #999 0px, #999 1px, transparent 1px, transparent 3px)',
    },
    FBS: {
      backgroundImage: `
        repeating-linear-gradient(0deg, #333 0px, #333 1px, transparent 1px, transparent 4px),
        repeating-linear-gradient(90deg, #333 0px, #333 1px, transparent 1px, transparent 4px)
      `,
    },
    CAV: {
      background: 'repeating-linear-gradient(135deg, #fff 0px, #fff 6px, #eee 6px, #eee 12px)',
      border: '2px dashed #aaa',
    },
  };
  return styles[material] || {};
}; 