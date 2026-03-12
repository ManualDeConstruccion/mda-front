import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Paper, Button } from '@mui/material';
import styles from './ActivityAlert.module.scss';

/**
 * Componente de prueba para avisos de bitácora/actividad.
 * Se muestra al montar y se cierra con "Aceptar".
 * Se renderiza en document.body vía Portal para que position:fixed sea respecto al viewport (esquina inferior derecha).
 * Luego se conectará con GET /api/activity/project-activity-logs/?status=pending
 */
const ActivityAlert: React.FC = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const content = (
    <div className={styles.wrapper} role="dialog" aria-label="Aviso de actividad">
      <Paper className={styles.paper} elevation={4}>
        <p className={styles.message}>
          Prueba de aviso — luego conectaremos con la API de actividad.
        </p>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setVisible(false)}
          className={styles.acceptButton}
        >
          Aceptar
        </Button>
      </Paper>
    </div>
  );

  return createPortal(content, document.body);
};

export default ActivityAlert;
