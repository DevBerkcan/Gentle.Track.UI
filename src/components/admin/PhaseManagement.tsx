// src/components/admin/PhaseManagement.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { projectService } from '../../api/services/projectService';
import { phaseService } from '../../api/services/phaseService';
import Notification from '../common/Notification';
import ConfirmDialog from '../common/ConfirmDialog';
import CustomSelect from '../common/CustomSelect';
import SearchableDropdown from '../common/SearchableDropdown';
import { formatDate, getPhaseIcon } from '../../utils/dateFormatter';
import type { Project, ProjectPhase } from '../../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Save, ArrowUp, ArrowDown, Trash2, Settings, Loader2, Layers, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationState { show: boolean; type: 'success' | 'error' | 'warning' | 'info'; message: string; }
interface ConfirmState { show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'info'; }

const statusColors: Record<string, string> = {
  'Abgeschlossen':        'border-l-success bg-success-bg/60',
  'In Bearbeitung':       'border-l-info bg-info-bg/60',
  'Warten auf Feedback':  'border-l-warning bg-warning-bg/60',
  'Noch nicht gestartet': 'border-l-border bg-secondary/60',
};

const dotColors: Record<string, string> = {
  'Abgeschlossen':        'bg-success border-success/25',
  'In Bearbeitung':       'bg-info border-info/25',
  'Warten auf Feedback':  'bg-warning border-warning/25',
  'Noch nicht gestartet': 'bg-border border-border',
};

const PhaseManagement = () => {
  const { t } = useTranslation('phases');
  const { t: tc } = useTranslation('common');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPhaseInput, setShowPhaseInput] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseDescription, setNewPhaseDescription] = useState('');
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: 'info', message: '' });
  const [confirm, setConfirm] = useState<ConfirmState>({ show: false, title: '', message: '', onConfirm: () => {}, type: 'warning' });

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { loadPhases(); setShowPhaseInput(false); }, [selectedProjectId]);

  const showNotification = (type: NotificationState['type'], message: string) => setNotification({ show: true, type, message });
  const showConfirm = (title: string, message: string, onConfirm: () => void, type: ConfirmState['type'] = 'warning') => setConfirm({ show: true, title, message, onConfirm, type });

  const loadProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data.filter(p => !p.isArchived));
    } catch {
      showNotification('error', t('errors.loadProjectsFailed'));
    }
  };

  const loadPhases = async () => {
    if (!selectedProjectId) { setPhases([]); return; }
    try {
      setLoading(true);
      const data = await phaseService.getByProjectId(parseInt(selectedProjectId));
      setPhases(data);
    } catch {
      showNotification('error', t('errors.loadPhasesFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhase = async () => {
    if (!newPhaseName.trim()) { showNotification('warning', t('validation.nameRequired')); return; }
    try {
      await phaseService.create({ projectID: parseInt(selectedProjectId), phaseName: newPhaseName, description: newPhaseDescription, status: 'Noch nicht gestartet', phaseOrder: 0 });
      showNotification('success', t('notifications.added'));
      setNewPhaseName(''); setNewPhaseDescription(''); setShowPhaseInput(false);
      loadPhases();
    } catch { showNotification('error', t('errors.addFailed')); }
  };

  const updateStatus = async (phaseId: number, status: string) => {
    try { await phaseService.updateStatus(phaseId, status); showNotification('success', t('notifications.statusUpdated')); loadPhases(); }
    catch { showNotification('error', t('errors.statusUpdateFailed')); }
  };

  const deletePhase = (phaseId: number, phaseName: string) => {
    showConfirm(t('confirm.deleteTitle'), t('confirm.deleteMessage', { name: phaseName }), async () => {
      try { await phaseService.delete(phaseId); showNotification('success', t('notifications.deleted')); loadPhases(); }
      catch { showNotification('error', t('errors.deleteFailed')); }
      setConfirm(c => ({ ...c, show: false }));
    }, 'danger');
  };

  const movePhaseUp = async (id: number) => {
    try { await phaseService.moveUp(id); loadPhases(); } catch { showNotification('error', t('errors.moveFailed')); }
  };
  const movePhaseDown = async (id: number) => {
    try { await phaseService.moveDown(id); loadPhases(); } catch { showNotification('error', t('errors.moveFailed')); }
  };

  const projectOptions = projects.map(p => ({ id: p.projectID.toString(), label: p.projectName, sublabel: p.trackingNumber }));
  const statusOptions = [
    { value: 'Noch nicht gestartet', label: tc('statusValues.Noch nicht gestartet') },
    { value: 'In Bearbeitung', label: tc('statusValues.In Bearbeitung') },
    { value: 'Warten auf Feedback', label: tc('statusValues.Warten auf Feedback') },
    { value: 'Abgeschlossen', label: tc('statusValues.Abgeschlossen') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">{t('title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-5">
          <div className="mb-5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('fields.selectProject')}</Label>
            <SearchableDropdown options={projectOptions} value={selectedProjectId} onChange={setSelectedProjectId} placeholder={t('dropdown.placeholder')} searchPlaceholder={t('dropdown.searchPlaceholder')} noResultsText={t('dropdown.noResults')} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">{t('loading')}</span>
            </div>
          ) : selectedProjectId ? (
            <div className="space-y-4">
              {!showPhaseInput && (
                <Button onClick={() => setShowPhaseInput(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />{t('actions.addPhase')}
                </Button>
              )}

              {showPhaseInput && (
                <Card className="border border-primary/20 bg-primary/5">
                  <CardContent className="p-5 space-y-4">
                    <h4 className="font-semibold text-foreground">{t('actions.addPhase')}</h4>
                    <div className="space-y-1.5">
                      <Label>{t('fields.phaseName')}</Label>
                      <Input value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} placeholder={t('fields.phaseNamePlaceholder')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t('fields.description')}</Label>
                      <Textarea value={newPhaseDescription} onChange={e => setNewPhaseDescription(e.target.value)} placeholder={t('fields.descriptionPlaceholder')} rows={3} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleSavePhase}><Save className="w-4 h-4 mr-1.5" />{tc('actions.save')}</Button>
                      <Button variant="secondary" onClick={() => { setNewPhaseName(''); setNewPhaseDescription(''); setShowPhaseInput(false); }}><X className="w-4 h-4 mr-1.5" />{tc('actions.cancel')}</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {phases.length === 0 && !showPhaseInput ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Layers className="w-10 h-10 opacity-30" />
                  <p className="text-sm font-medium">{t('empty.title')}</p>
                  <p className="text-xs">{t('empty.hint')}</p>
                </div>
              ) : (
                <div className="relative space-y-3">
                  {phases.map((phase, index) => (
                    <div key={phase.phaseID} className="relative pl-8">
                      {/* Timeline dot */}
                      <div className={cn('absolute left-0 top-5 w-4 h-4 rounded-full border-2 bg-white', dotColors[phase.status] ?? 'bg-border border-border')} />
                      {/* Timeline line */}
                      {index < phases.length - 1 && (
                        <div className="absolute left-[7px] top-9 w-0.5 h-[calc(100%+0.75rem)] bg-border" />
                      )}
                      <Card className={cn('border-l-4', statusColors[phase.status] ?? 'border-l-border')}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                                <span>{getPhaseIcon(phase.status)}</span>
                                <span>{phase.phaseName}</span>
                                <span className="text-xs text-muted-foreground font-normal">#{phase.phaseOrder}</span>
                              </h4>
                              {phase.description && <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>}
                              {phase.completedAt && <p className="text-xs text-muted-foreground mt-1">{t('phase.completedAt', { date: formatDate(phase.completedAt) })}</p>}
                              {phase.startedAt && !phase.completedAt && <p className="text-xs text-muted-foreground mt-1">{t('phase.startedAt', { date: formatDate(phase.startedAt) })}</p>}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button size="sm" variant="ghost" className="px-2 h-7" onClick={() => movePhaseUp(phase.phaseID)} disabled={index === 0} title={t('actions.moveUp')}>
                                <ArrowUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="px-2 h-7" onClick={() => movePhaseDown(phase.phaseID)} disabled={index === phases.length - 1} title={t('actions.moveDown')}>
                                <ArrowDown className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <CustomSelect value={phase.status} onChange={status => updateStatus(phase.phaseID, status)} options={statusOptions} className="min-w-[200px]" />
                            <Button size="sm" variant="destructive" onClick={() => deletePhase(phase.phaseID, phase.phaseName)}>
                              <Trash2 className="w-3.5 h-3.5 mr-1" />{tc('actions.delete')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Settings className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">{t('selectProjectPrompt')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
      <ConfirmDialog isOpen={confirm.show} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, show: false }))} type={confirm.type} confirmText={confirm.type === 'danger' ? tc('actions.delete') : tc('actions.confirm')} />
    </div>
  );
};

export default PhaseManagement;
