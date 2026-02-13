// src/components/admin/PhaseManagement.tsx
import { useState, useEffect } from 'react';
import { projectService } from '../../api/services/projectService';
import { phaseService } from '../../api/services/phaseService';
import Notification from '../common/Notification';
import ConfirmDialog from '../common/ConfirmDialog';
import CustomSelect from '../common/CustomSelect';
import SearchableDropdown from '../common/SearchableDropdown';
import { formatDate, getPhaseIcon, getPhaseClass } from '../../utils/dateFormatter';
import type { Project, ProjectPhase } from '../../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Save, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ConfirmState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const PhaseManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPhaseInput, setShowPhaseInput] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseDescription, setNewPhaseDescription] = useState('');

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    message: ''
  });

  const [confirm, setConfirm] = useState<ConfirmState>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const showNotification = (type: NotificationState['type'], message: string) => {
    setNotification({ show: true, type, message });
  };

  const hideNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, type: ConfirmState['type'] = 'warning') => {
    setConfirm({ show: true, title, message, onConfirm, type });
  };

  const hideConfirm = () => {
    setConfirm({ ...confirm, show: false });
  };

  const loadProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data.filter((p) => !p.isArchived));
    } catch (error) {
      console.error('Error loading projects:', error);
      showNotification('error', 'Fehler beim Laden der Projekte');
    }
  };

  const loadPhases = async () => {
    if (!selectedProjectId) {
      setPhases([]);
      return;
    }

    try {
      setLoading(true);
      const data = await phaseService.getByProjectId(parseInt(selectedProjectId));
      setPhases(data);
    } catch (error) {
      console.error('Error loading phases:', error);
      showNotification('error', 'Fehler beim Laden der Phasen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhases();
    setShowPhaseInput(false);
  }, [selectedProjectId]);

  const handleAddPhase = () => {
    setShowPhaseInput(true);
  };

  const handleSavePhase = async () => {
    if (!newPhaseName.trim()) {
      showNotification('warning', 'Bitte geben Sie einen Namen für die Phase ein');
      return;
    }

    try {
      await phaseService.create({
        projectID: parseInt(selectedProjectId),
        phaseName: newPhaseName,
        description: newPhaseDescription,
        status: 'Noch nicht gestartet',
        phaseOrder: 0, // Will be auto-assigned by backend
      });
      showNotification('success', 'Phase erfolgreich hinzugefügt!');
      setNewPhaseName('');
      setNewPhaseDescription('');
      setShowPhaseInput(false);
      loadPhases();
    } catch (error) {
      showNotification('error', 'Fehler beim Hinzufügen der Phase');
    }
  };

  const handleCancelPhase = () => {
    setNewPhaseName('');
    setNewPhaseDescription('');
    setShowPhaseInput(false);
  };

  const updateStatus = async (phaseId: number, status: string) => {
    try {
      await phaseService.updateStatus(phaseId, status);
      showNotification('success', 'Status erfolgreich aktualisiert!');
      loadPhases();
    } catch (error) {
      showNotification('error', 'Fehler beim Aktualisieren des Status');
    }
  };

  const deletePhase = (phaseId: number, phaseName: string) => {
    showConfirm(
      'Phase löschen',
      `Möchten Sie die Phase "${phaseName}" wirklich löschen?`,
      async () => {
        try {
          await phaseService.delete(phaseId);
          showNotification('success', 'Phase erfolgreich gelöscht!');
          loadPhases();
        } catch (error) {
          showNotification('error', 'Fehler beim Löschen der Phase');
        }
        hideConfirm();
      },
      'danger'
    );
  };

  const movePhaseUp = async (phaseId: number) => {
    try {
      await phaseService.moveUp(phaseId);
      showNotification('success', 'Phase nach oben verschoben!');
      loadPhases();
    } catch (error) {
      showNotification('error', 'Phase kann nicht nach oben verschoben werden');
    }
  };

  const movePhaseDown = async (phaseId: number) => {
    try {
      await phaseService.moveDown(phaseId);
      showNotification('success', 'Phase nach unten verschoben!');
      loadPhases();
    } catch (error) {
      showNotification('error', 'Phase kann nicht nach unten verschoben werden');
    }
  };

  // Convert projects to dropdown options
  const projectOptions = projects.map(project => ({
    id: project.projectID.toString(),
    label: project.projectName,
    sublabel: project.trackingNumber
  }));

  const statusOptions = [
    { value: 'Noch nicht gestartet', label: 'Noch nicht gestartet' },
    { value: 'In Bearbeitung', label: 'In Bearbeitung' },
    { value: 'Warten auf Feedback', label: 'Warten auf Feedback' },
    { value: 'Abgeschlossen', label: 'Abgeschlossen' }
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-5">Projekt-Phasen verwalten</h2>

      <Card className="mt-5">
        <CardContent className="p-6">
          <div className="mb-5">
            <SearchableDropdown
              options={projectOptions}
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              placeholder="Projekt auswählen..."
              searchPlaceholder="Projekt suchen..."
              noResultsText="Kein Projekt gefunden"
            />
          </div>

          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Lade Phasen...</div>
          ) : selectedProjectId ? (
            <>
              {!showPhaseInput && (
                <Button
                  className="bg-sky-500 hover:bg-sky-600 text-white mb-5"
                  onClick={handleAddPhase}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Neue Phase hinzufügen
                </Button>
              )}

              {showPhaseInput && (
                <Card className="mb-5 bg-slate-50">
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-foreground mb-4">Neue Phase hinzufügen</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Phasenname *</Label>
                        <Input
                          type="text"
                          value={newPhaseName}
                          onChange={(e) => setNewPhaseName(e.target.value)}
                          placeholder="z.B. Design, Entwicklung, Testing"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Beschreibung</Label>
                        <Textarea
                          value={newPhaseDescription}
                          onChange={(e) => setNewPhaseDescription(e.target.value)}
                          placeholder="Optionale Beschreibung..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="bg-sky-500 hover:bg-sky-600 text-white"
                          onClick={handleSavePhase}
                        >
                          <Save className="w-4 h-4 mr-1.5" />
                          Speichern
                        </Button>
                        <Button variant="secondary" onClick={handleCancelPhase}>
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {phases.length === 0 && !showPhaseInput ? (
                <p className="text-center text-muted-foreground py-5">
                  Keine Phasen vorhanden. Erstellen Sie die erste Phase für dieses Projekt.
                </p>
              ) : (
                <div className="space-y-4">
                  {phases.map((phase, index) => (
                    <div
                      key={phase.phaseID}
                      className={`relative pl-8 ${getPhaseClass(phase.status)}`}
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-4 w-4 h-4 rounded-full border-2 border-sky-500 bg-white" />
                      {/* Timeline line */}
                      {index < phases.length - 1 && (
                        <div className="absolute left-[7px] top-8 w-0.5 h-[calc(100%+1rem)] bg-border" />
                      )}

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-foreground">
                              {getPhaseIcon(phase.status)} {phase.phaseName}
                              <span className="ml-2.5 text-xs text-muted-foreground font-normal">
                                #{phase.phaseOrder}
                              </span>
                            </h4>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => movePhaseUp(phase.phaseID)}
                                disabled={index === 0}
                                className="px-2 py-1"
                                title="Nach oben verschieben"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => movePhaseDown(phase.phaseID)}
                                disabled={index === phases.length - 1}
                                className="px-2 py-1"
                                title="Nach unten verschieben"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {phase.description || 'Keine Beschreibung'}
                          </p>
                          {phase.completedAt && (
                            <small className="text-muted-foreground">
                              Abgeschlossen am {formatDate(phase.completedAt)}
                            </small>
                          )}
                          {phase.startedAt && !phase.completedAt && (
                            <small className="text-muted-foreground">
                              Gestartet am {formatDate(phase.startedAt)}
                            </small>
                          )}
                          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <CustomSelect
                              value={phase.status}
                              onChange={(status) => updateStatus(phase.phaseID, status)}
                              options={statusOptions}
                              className="min-w-[200px]"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deletePhase(phase.phaseID, phase.phaseName)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Löschen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-5">
              Bitte wählen Sie ein Projekt aus
            </p>
          )}
        </CardContent>
      </Card>

      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      <ConfirmDialog
        isOpen={confirm.show}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={hideConfirm}
        type={confirm.type}
        confirmText={confirm.type === 'danger' ? 'Löschen' : 'Bestätigen'}
      />
    </div>
  );
};

export default PhaseManagement;
