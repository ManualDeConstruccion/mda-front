import React from 'react';
import { Box, Button, Typography } from '@mui/material';

interface ZoomControlsProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  min: number;
  max: number;
  step?: number;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, setZoom, min, max, step = 0.1 }) => {
  const handleZoomOut = () => setZoom((z: number) => Math.max(min, +(z - step).toFixed(2)));
  const handleZoomIn = () => setZoom((z: number) => Math.min(max, +(z + step).toFixed(2)));

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
      <Button variant="outlined" onClick={handleZoomOut}>-</Button>
      <Typography>Zoom: {(zoom * 100).toFixed(0)}%</Typography>
      <Button variant="outlined" onClick={handleZoomIn}>+</Button>
    </Box>
  );
};

export default ZoomControls; 