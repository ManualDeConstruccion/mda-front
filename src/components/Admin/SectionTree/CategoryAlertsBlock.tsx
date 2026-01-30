import React from 'react';
import { Box, Alert } from '@mui/material';
import type { UIAlert } from '../../../types/formParameters.types';

interface CategoryAlertsBlockProps {
  alerts: UIAlert[];
}

const severityMap = {
  error: 'error' as const,
  warning: 'warning' as const,
  info: 'info' as const,
  success: 'success' as const,
};

export const CategoryAlertsBlock: React.FC<CategoryAlertsBlockProps> = ({ alerts }) => {
  if (!alerts?.length) return null;
  return (
    <Box sx={{ mb: 2, ml: 6 }}>
      {alerts.map((a, idx) => (
        <Alert
          key={a.code + String(idx)}
          severity={severityMap[a.level] ?? 'info'}
          sx={{ mb: 1 }}
        >
          {a.message}
        </Alert>
      ))}
    </Box>
  );
};
