// src/components/admin/PhaseManagement.tsx
import { useState, useEffect } from 'react';
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
import { Plus, Save, ArrowUp, ArrowDown, Trash2, Settings, Loader2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationState { show: boolean; type: 'success' | 'error' | 'warning' | 'info'; message: string; }
interface ConfirmState { show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'info'; }

const statusColors: Record<string, string> = {
  'Abgeschlossen':        'border-l-emerald-500 bg-emerald-50/50',
  'In Bearbeitung':       'border-l-blue-500 bg-blue-50/50',
  'Warten auf Feedback':  'border-l-amber-500 bg-amber-50/50',
  'Noch nicht gestartet': 'border-l-zinc-300 bg-zinc-50/50',
};

const dotColors: Record<string, string> = {
  'Abgeschlossen':        'bg-emerald-500 border-emerald-200',
  'In Bearbeitung':       'bg-blue-500 border-blue-200',
  'Warten auf Feedback':  'bg-amber-500 border-amber-200',
  'Noch nicht gestartet': 'bg-zinc-300 border-zinc-200',
};

const PhaseManagement = () => {
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
      showNotification('error', 'Fehler beim Laden der Projekte');
    }
  };

  const loadPhases = async () => {
    if (!selectedProjectId) { setPhases([]); return; }
    try {
      setLoading(true);
      const data = await phaseService.getByProjectId(parseInt(selectedProjectId));
      setPhases(data);
    } catch {
      showNotification('error', 'Fehler beim Laden der Phasen');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhase = async () => {
    if (!newPhaseName.trim()) { showNotification('warning', 'Bitte geben Sie einen Namen für die Phase ein'); return; }
    try {
      await phaseService.create({ projectID: parseInt(selectedProjectId), phaseName: newPhaseName, description: newPhaseDescription, status: 'Noch nicht gestartet', phaseOrder: 0 });
      showNotification('success', 'Phase erfolgreich hinzugefügt!');
      setNewPhaseName(''); setNewPhaseDescription(''); setShowPhaseInput(false);
      loadPhases();
    } catch { showNotification('error', 'Fehler beim Hinzufügen der Phase'); }
  };

  const updateStatus = async (phaseId: number, status: string) => {
    try { await phaseService.updateStatus(phaseId, status); showNotification('success', 'Status aktualisiert!'); loadPhases(); }
    catch { showNotification('error', 'Fehler beim Aktualisieren des Status'); }
  };

  const deletePhase = (phaseId: number, phaseName: string) => {
    showConfirm('Phase löschen', `Möchten Sie die Phase "${phaseName}" wirklich löschen?`, async () => {
      try { await phaseService.delete(phaseId); showNotification('success', 'Phase gelöscht!'); loadPhases(); }
      catch { showNotification('error', 'Fehler beim Löschen der Phase'); }
      setConfirm(c => ({ ...c, show: false }));
    }, 'danger');
  };

  const movePhaseUp = async (id: number) => {
    try { await phaseService.moveUp(id); loadPhases(); } catch { showNotification('error', 'Verschieben nicht möglich'); }
  };
  const movePhaseDown = async (id: number) => {
    try { await phaseService.moveDown(id); loadPhases(); } catch { showNotification('error', 'Verschieben nicht möglich'); }
  };

  const projectOptions = projects.map(p => ({ id: p.projectID.toString(), label: p.projectName, sublabel: p.trackingNumber }));
  const statusOptions = [
    { value: 'Noch nicht gestartet', label: 'Noch nicht gestartet' },
    { value: 'In Bearbeitung', label: 'In Bearbeitung' },
    { value: 'Warten auf Feedback', label: 'Warten auf Feedback' },
    { value: 'Abgeschlossen', label: 'Abgeschlossen' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Projekt-Phasen verwalten</h1>
        </div>
        <p className="text-sm text-muted-foreground">Phasen für Projekte anlegen, sortieren und verwalten</p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-5">
          <div className="mb-5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Projekt auswählen</Label>
            <SearchableDropdown options={projectOptions} value={selectedProjectId} onChange={setSelectedProjectId} placeholder="Projekt auswählen…" searchPlaceholder="Projekt suchen…" noResultsText="Kein Projekt gefunden" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">Phasen werden geladen…</span>
            </div>
          ) : selectedProjectId ? (
            <div className="space-y-4">
              {!showPhaseInput && (
                <Button onClick={() => setShowPhaseInput(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />Neue Phase hinzufügen
                </Button>
              )}

              {showPhaseInput && (
                <Card className="border border-primary/20 bg-primary/5">
                  <CardContent className="p-5 space-y-4">
                    <h4 className="font-semibold text-foreground">Neue Phase hinzufügen</h4>
                    <div className="space-y-1.5">
                      <Label>Phasenname *</Label>
                      <Input value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} placeholder="z.B. Design, Entwicklung, Testing" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Beschreibung</Label>
                      <Textarea value={newPhaseDescription} onChange={e => setNewPhaseDescription(e.target.value)} placeholder="Optionale Beschreibung…" rows={3} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSavePhase}><Save className="w-4 h-4 mr-1.5" />Speichern</Button>
                      <Button variant="secondary" onClick={() => { setNewPhaseName(''); setNewPhaseDescription(''); setShowPhaseInput(false); }}>Abbrechen</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {phases.length === 0 && !showPhaseInput ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Layers className="w-10 h-10 opacity-30" />
                  <p className="text-sm font-medium">Noch keine Phasen vorhanden</p>
                  <p className="text-xs">Erstellen Sie die erste Phase für dieses Projekt</p>
                </div>
              ) : (
                <div className="relative space-y-3">
                  {phases.map((phase, index) => (
                    <div key={phase.phaseID} className="relative pl-8">
                      {/* Timeline dot */}
                      <div className={cn('absolute left-0 top-5 w-4 h-4 rounded-full border-2 bg-white', dotColors[phase.status] ?? 'bg-zinc-300 border-zinc-200')} />
                      {/* Timeline line */}
                      {index < phases.length - 1 && (
                        <div className="absolute left-[7px] top-9 w-0.5 h-[calc(100%+0.75rem)] bg-border" />
                      )}
                      <Card className={cn('border-l-4', statusColors[phase.status] ?? 'border-l-zinc-300')}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                                <span>{getPhaseIcon(phase.status)}</span>
                                <span>{phase.phaseName}</span>
                                <span className="text-xs text-muted-foreground font-normal">#{phase.phaseOrder}</span>
                              </h4>
                              {phase.description && <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>}
                              {phase.completedAt && <p className="text-xs text-muted-foreground mt-1">Abgeschlossen am {formatDate(phase.completedAt)}</p>}
                              {phase.startedAt && !phase.completedAt && <p className="text-xs text-muted-foreground mt-1">Gestartet am {formatDate(phase.startedAt)}</p>}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button size="sm" variant="ghost" className="px-2 h-7" onClick={() => movePhaseUp(phase.phaseID)} disabled={index === 0} title="Nach oben">
                                <ArrowUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="px-2 h-7" onClick={() => movePhaseDown(phase.phaseID)} disabled={index === phases.length - 1} title="Nach unten">
                                <ArrowDown className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <CustomSelect value={phase.status} onChange={status => updateStatus(phase.phaseID, status)} options={statusOptions} className="min-w-[200px]" />
                            <Button size="sm" variant="destructive" onClick={() => deletePhase(phase.phaseID, phase.phaseName)}>
                              <Trash2 className="w-3.5 h-3.5 mr-1" />Löschen
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
              <p className="text-sm font-medium">Bitte wählen Sie ein Projekt aus</p>
            </div>
          )}
        </CardContent>
      </Card>

      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
      <ConfirmDialog isOpen={confirm.show} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, show: false }))} type={confirm.type} confirmText={confirm.type === 'danger' ? 'Löschen' : 'Bestätigen'} />
    </div>
  );
};

export default PhaseManagement;
