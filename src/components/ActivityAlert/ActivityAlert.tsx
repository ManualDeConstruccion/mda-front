import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Paper, Button } from '@mui/material';
import { api } from '../../services/api';
import styles from './ActivityAlert.module.scss';

export interface ActivityLog {
  id: number;
  description: string;
  display_type: string;
  action_buttons: Array<{ code: string; label: string; color?: string }>;
  status: string;
}

const ACTIVITY_LOGS_QUERY_KEY = 'activity-logs-pending';

async function fetchPendingLogs(projectNodeId: number): Promise<ActivityLog[]> {
  const { data } = await api.get<{ results?: ActivityLog[] }>(
    `activity/project-activity-logs/`,
    { params: { project_node: projectNodeId, status: 'pending' } }
  );
  return Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
}

async function resolveLog(logId: number, action: string): Promise<{ status: string }> {
  const { data } = await api.post<{ status: string }>(
    `activity/project-activity-logs/${logId}/resolve/`,
    { action }
  );
  return data;
}

export interface ActivityAlertProps {
  /** ID del nodo raíz del proyecto (project_node en el log). Si no se pasa, no se hace fetch. */
  projectNodeId?: number;
  /** Se llama al resolver la alerta (cualquier botón). Con action='cancel' el backend revierte el valor; el padre puede refrescar el formulario aquí para que la UI muestre el valor anterior. */
  onResolveSuccess?: (action: string) => void;
}

/**
 * Muestra avisos de bitácora pendientes (banner/modal).
 * Obtiene logs con status=pending y permite resolver con Aceptar Cambios / Aceptar sin cambios / Cancelar.
 */
const ActivityAlert: React.FC<ActivityAlertProps> = ({ projectNodeId, onResolveSuccess }) => {
  const queryClient = useQueryClient();

  const { data: pendingLogs = [], refetch } = useQuery({
    queryKey: [ACTIVITY_LOGS_QUERY_KEY, projectNodeId],
    queryFn: () => fetchPendingLogs(projectNodeId!),
    enabled: !!projectNodeId,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ logId, action }: { logId: number; action: string }) =>
      resolveLog(logId, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITY_LOGS_QUERY_KEY, projectNodeId] });
      onResolveSuccess?.(variables.action);
    },
  });

  const log = pendingLogs[0];
  if (!log) return null;

  const handleAction = (actionCode: string) => {
    resolveMutation.mutate({ logId: log.id, action: actionCode });
  };

  /** Convierte líneas que empiezan con "- " en lista con viñetas; el resto como texto. */
  const renderMessage = (text: string) => {
    const lines = text.split(/\n/);
    const nodes: React.ReactNode[] = [];
    let listItems: string[] = [];
    const flushList = () => {
      if (listItems.length > 0) {
        nodes.push(
          <ul key={nodes.length} className={styles.messageList}>
            {listItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };
    lines.forEach((line) => {
      const match = line.match(/^\s*-\s+(.+)$/);
      if (match) {
        listItems.push(match[1].trim());
      } else {
        flushList();
        if (line.trim()) {
          nodes.push(
            <span key={nodes.length} className={styles.messageLine}>
              {line}
            </span>
          );
        }
      }
    });
    flushList();
    return <div className={styles.message}>{nodes}</div>;
  };

  const content = (
    <div className={styles.wrapper} role="dialog" aria-label="Aviso de actividad">
      <Paper className={styles.paper} elevation={4}>
        {renderMessage(log.description)}
        <div className={styles.actions}>
          {(log.action_buttons || []).map((btn) => (
            <Button
              key={btn.code}
              variant={btn.code === 'accept_changes' ? 'contained' : 'outlined'}
              color={
                btn.color === 'primary'
                  ? 'primary'
                  : btn.color === 'secondary'
                    ? 'secondary'
                    : 'inherit'
              }
              size="small"
              onClick={() => handleAction(btn.code)}
              disabled={resolveMutation.isPending}
              className={styles.actionButton}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </Paper>
    </div>
  );

  return createPortal(content, document.body);
};

export default ActivityAlert;
