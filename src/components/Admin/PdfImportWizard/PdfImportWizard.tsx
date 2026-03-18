import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import styles from './PdfImportWizard.module.scss';

import { usePdfImport, PdfImportProposals } from '../../../hooks/usePdfImport';

type PdfTemplateLite = {
  id: number;
  name: string;
  minvu_form_code?: string;
  version?: string;
  is_active: boolean;
};

type PdfImportWizardProps = {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
  projectTypeId: number;
  pdfTemplates: PdfTemplateLite[];
};

type ProposalRow = {
  fieldId: string;
  action: string;
  code: string;
  confidence?: string;
  evidence?: string;
  scope?: string;
  data_type?: string;
  suggested_name?: string;
  pdf_meta?: {
    page?: number;
    type?: string;
    rect?: number[];
  };
};

const steps = ['Upload + Form Code', 'Análisis con IA', 'Revisión de mapeos', 'Confirmar e importar'];

function deepCloneProposals(p: PdfImportProposals): PdfImportProposals {
  return JSON.parse(JSON.stringify(p)) as PdfImportProposals;
}

/**
 * Wizard de 4 pasos para importar una estructura desde un PDF:
 * upload -> análisis IA (polling) -> revisión editable de mapeos -> aplicar import.
 */
export default function PdfImportWizard({
  open,
  onClose,
  onImported,
  projectTypeId,
  pdfTemplates,
}: PdfImportWizardProps) {
  const {
    jobId,
    statusQuery,
    proposalsQuery,
    startMutation,
    applyMutation,
    reset,
    sections,
    proposalsBySection,
    sectionFieldCounts,
  } = usePdfImport();
  const [step, setStep] = useState(1);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [formCode, setFormCode] = useState<string>('');
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);

  const [draftProposals, setDraftProposals] = useState<PdfImportProposals>({});
  const [createSections, setCreateSections] = useState(true);

  const status = statusQuery.data?.status;
  const progress = statusQuery.data?.progress ?? 0;
  const progressMessage = statusQuery.data?.progress_message ?? '';

  const proposalsObj = proposalsQuery?.data?.proposals;

  useEffect(() => {
    if (!open) {
      reset();
      setStep(1);
      setPdfFile(null);
      setDraftProposals({});
      setFormCode('');
      setActiveTemplateId(null);
      setCreateSections(true);
      return;
    }

    const activeTemplates = pdfTemplates.filter((t) => t.is_active);
    const active =
      activeTemplates.length > 0
        ? [...activeTemplates].sort((a, b) => {
            const ta = Date.parse(a.uploaded_at ?? '');
            const tb = Date.parse(b.uploaded_at ?? '');
            // fallback por id si las fechas no parsean
            if (Number.isNaN(ta) || Number.isNaN(tb)) return (b.id ?? 0) - (a.id ?? 0);
            return tb - ta || (b.id ?? 0) - (a.id ?? 0);
          })[0]
        : null;
    if (active) {
      setActiveTemplateId(active.id);
      setFormCode(active.minvu_form_code ?? '');
      // Si hay template activo, saltamos UI de Paso 1: solo queda iniciar el análisis con un botón.
      setStep(2);
    } else {
      setActiveTemplateId(null);
      setFormCode('');
      setStep(1);
    }
  }, [open, pdfTemplates, reset]);

  useEffect(() => {
    if (open && proposalsObj) {
      setDraftProposals(deepCloneProposals(proposalsObj));
    }
  }, [open, proposalsObj]);

  useEffect(() => {
    if (!open) return;
    if (status === 'review' && step < 3) setStep(3);
    if (status === 'done' && step < 4) setStep(4);
  }, [open, status, step]);

  const proposalRows: ProposalRow[] = useMemo(() => {
    const obj = draftProposals || {};
    const entries = Object.entries(obj);
    const rows = entries.map(([fieldId, p]) => ({
      fieldId,
      action: (p as any).action ?? 'create_new',
      code: (p as any).code ?? '',
      confidence: (p as any).confidence,
      evidence: (p as any).evidence,
      scope: (p as any).scope,
      data_type: (p as any).data_type,
      suggested_name: (p as any).suggested_name,
      pdf_meta: (p as any)._pdf_meta,
    }));

    rows.sort((a, b) => {
      const pa = a.pdf_meta?.page ?? 0;
      const pb = b.pdf_meta?.page ?? 0;
      if (pa !== pb) return pa - pb;
      return a.fieldId.localeCompare(b.fieldId);
    });
    return rows;
  }, [draftProposals]);

  const proposalRowById = useMemo(() => {
    const m: Record<string, ProposalRow> = {};
    for (const r of proposalRows) {
      m[r.fieldId] = r;
    }
    return m;
  }, [proposalRows]);

  const startAnalyze = async () => {
    if (!pdfFile) throw new Error('Debes subir un PDF.');
    if (!formCode) throw new Error('Debes seleccionar form_code.');

    await startMutation.mutateAsync({
      pdf: pdfFile,
      project_type: projectTypeId,
      form_code: formCode,
    });

    setStep(2);
  };

  const startAnalyzeFromActiveTemplate = async () => {
    if (!activeTemplateId) throw new Error('No hay template activo para analizar.');
    await startMutation.mutateAsync({
      project_type: projectTypeId,
      template_id: activeTemplateId,
    });
    setStep(2);
  };

  const applyImport = async () => {
    await applyMutation.mutateAsync({
      proposals: draftProposals,
      create_sections: createSections,
    });
    onImported?.();
    onClose();
  };

  const isAnalyzing = statusQuery.isLoading || status === 'analyzing' || status === 'pending' || status === 'applying';
  const isInReview = status === 'review' || status === 'done';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadFileIcon />
          <Box>
            <Typography variant="h6">Importar desde PDF</Typography>
            <Typography variant="caption" color="text.secondary">
              Wizard de 4 pasos (AI + revisión + aplicación)
            </Typography>
          </Box>
        </Box>
        <Box />
      </DialogTitle>

      <DialogContent>
        <Box className={styles.wizard}>
          <Box sx={{ p: 2 }}>
            <Stepper activeStep={step - 1}>
              {steps.map((s) => (
                <Step key={s}>
                  <StepLabel>{s}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Box className={styles.wizardBody}>
            {step === 1 && (
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Paso 1: PDF + código de formulario
                  </Typography>
                  <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
                    Subir PDF
                    <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setPdfFile(file);
                    }}
                    />
                  </Button>
                  {pdfFile && (
                    <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                      Archivo: {pdfFile.name}
                    </Typography>
                  )}
                </Box>

                {activeTemplateId ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>Form code</InputLabel>
                    <Select
                      value={formCode}
                      label="Form code"
                      onChange={(e) => setFormCode(String(e.target.value))}
                    >
                      {pdfTemplates.map((t) => (
                        <MenuItem key={t.id} value={t.minvu_form_code ?? ''}>
                          {t.minvu_form_code} {t.version ? `(${t.version})` : ''} - {t.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label="Form code"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    helperText="No hay templates activos para este tipo. Ingresa el código MINVU (ej: 2-1.1)."
                  />
                )}

                <DialogActions sx={{ px: 0 }}>
                  <Button onClick={onClose} variant="outlined">
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!pdfFile || !formCode || startMutation.isPending}
                    onClick={() => startAnalyze()}
                  >
                    Analizar con IA
                  </Button>
                </DialogActions>
              </Box>
            )}

            {step === 2 && (
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Typography variant="subtitle1">Paso 2: Análisis con IA</Typography>

                {!jobId && activeTemplateId && (
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Usando template activo para este tipo de proyecto.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip size="small" label={`form_code: ${formCode || '-'}`} variant="outlined" />
                      <Chip
                        size="small"
                        label={`template_id: ${activeTemplateId}`}
                        variant="outlined"
                      />
                    </Box>
                    <DialogActions sx={{ px: 0 }}>
                      <Button onClick={onClose} variant="outlined" disabled={startMutation.isPending}>
                        Cancelar
                      </Button>
                      <Button
                        variant="contained"
                        disabled={startMutation.isPending}
                        onClick={() => startAnalyzeFromActiveTemplate()}
                      >
                        Analizar con IA
                      </Button>
                    </DialogActions>
                  </Box>
                )}

                {jobId && (
                  <>
                    <LinearProgress variant="determinate" value={progress} />
                    <Typography variant="body2" color="text.secondary">
                      {progressMessage}
                    </Typography>
                    {status === 'error' && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        {statusQuery.data?.error_message ?? 'Error'}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Se recomienda dejar esta ventana abierta hasta terminar.
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            )}

            {step === 3 && (
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="subtitle1">Paso 3: Revisión de mapeos</Typography>
                  <Chip
                    size="small"
                    icon={<CheckCircleIcon fontSize="small" />}
                    label={draftProposals ? `${proposalRows.length} campos` : '0 campos'}
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Acción final</InputLabel>
                    <Select
                      value={createSections ? 'yes' : 'no'}
                      label="Acción final"
                      onChange={(e) => setCreateSections(String(e.target.value) === 'yes')}
                    >
                      <MenuItem value="yes">Crear secciones MDA</MenuItem>
                      <MenuItem value="no">Solo PDF semántico + parámetros</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box className={styles.proposalsSectionsWrapper}>
                  {(sections?.length ? sections : [{ number: '0', name: 'Datos Generales' }]).map((section) => {
                    const fieldIds = proposalsBySection?.[section.name] ?? [];
                    if (fieldIds.length === 0) return null;

                    const rowsForSection = fieldIds
                      .map((fid) => proposalRowById[fid])
                      .filter((x): x is ProposalRow => !!x)
                      .sort((a, b) => {
                        const pa = a.pdf_meta?.page ?? 0;
                        const pb = b.pdf_meta?.page ?? 0;
                        if (pa !== pb) return pa - pb;
                        return a.fieldId.localeCompare(b.fieldId);
                      });

                    if (rowsForSection.length === 0) return null;

                    const count = sectionFieldCounts?.[section.name] ?? rowsForSection.length;

                    return (
                      <div key={section.name} className={styles.proposalsSectionGroup}>
                        <div className={styles.sectionGroupHeader}>
                          <span className={styles.sectionNumber}>{section.number}</span>
                          <span className={styles.sectionName}>{section.name}</span>
                          <span className={styles.sectionCount}>
                            {count} campo{count !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <Box sx={{ overflowX: 'auto' }}>
                          <Table size="small" className={styles.table}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Campo</TableCell>
                                <TableCell>Acción</TableCell>
                                <TableCell>Code</TableCell>
                                <TableCell>Conf.</TableCell>
                                <TableCell>Evidence</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {rowsForSection.map((r) => {
                                const confidence = (r.confidence ?? '').toLowerCase();
                                const rowClass = confidence === 'low' || confidence === 'medium' ? styles.rowWarning : '';
                                const isPending = r.code?.startsWith('PENDING_') || r.action === 'ignore';
                                const rowClass2 = r.action === 'ignore' ? styles.rowError : rowClass;
                                return (
                                  <TableRow key={r.fieldId} className={`${rowClass2}`}>
                                    <TableCell className={styles.cell}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {r.fieldId}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        page: {r.pdf_meta?.page ?? '-'} type: {r.pdf_meta?.type ?? '-'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell className={styles.cell} sx={{ width: 160 }}>
                                      <FormControl size="small" fullWidth>
                                        <Select
                                          value={r.action}
                                          onChange={(e) => {
                                            const newAction = String(e.target.value);
                                            setDraftProposals((prev) => ({
                                              ...prev,
                                              [r.fieldId]: { ...prev[r.fieldId], action: newAction },
                                            }));
                                          }}
                                        >
                                          <MenuItem value="assign_existing">assign_existing</MenuItem>
                                          <MenuItem value="create_new">create_new</MenuItem>
                                          <MenuItem value="ignore">ignore</MenuItem>
                                        </Select>
                                      </FormControl>
                                    </TableCell>
                                    <TableCell className={styles.cell} sx={{ width: 220 }}>
                                      <TextField
                                        size="small"
                                        fullWidth
                                        value={r.code ?? ''}
                                        onChange={(e) => {
                                          const newCode = e.target.value;
                                          setDraftProposals((prev) => ({
                                            ...prev,
                                            [r.fieldId]: { ...prev[r.fieldId], code: newCode },
                                          }));
                                        }}
                                      />
                                      {isPending && (
                                        <Typography variant="caption" color="text.secondary">
                                          Se omitirá si el code queda con prefijo PENDING_
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell className={styles.cell} sx={{ width: 110 }}>
                                      <Typography variant="body2">{r.confidence ?? '-'}</Typography>
                                    </TableCell>
                                    <TableCell className={styles.cell}>
                                      <Typography variant="body2" className={styles.smallMuted}>
                                        {r.evidence ?? ''}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                      </div>
                    );
                  })}
                </Box>

                <DialogActions sx={{ px: 0 }}>
                  <Button variant="outlined" onClick={() => setStep(2)}>
                    Volver
                  </Button>
                  <Button
                    variant="contained"
                    disabled={applyMutation.isPending || statusQuery.data?.status !== 'review'}
                    onClick={() => applyImport()}
                  >
                    Confirmar e importar
                  </Button>
                </DialogActions>
              </Box>
            )}

            {step === 4 && (
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Typography variant="subtitle1">Paso 4: Resultado</Typography>
                {status === 'done' ? (
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Typography variant="body2">
                      Importación completada correctamente.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        onClose();
                      }}
                    >
                      Cerrar
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Estado actual: {status ?? 'pending'}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

