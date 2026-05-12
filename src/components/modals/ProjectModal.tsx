// src/components/modals/ProjectModal.tsx
import { useState, useEffect } from 'react';
import { projectService } from '../../api/services/projectService';
import { customerService } from '../../api/services/customerService';
import CustomSelect from '../common/CustomSelect';
import Modal from '../common/Modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Project, CreateProjectDto, Customer } from '../../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSaveSuccess: () => void;
  onDeleteSuccess?: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen, onClose, project, onSaveSuccess, onDeleteSuccess,
}) => {
  const [formData, setFormData] = useState<CreateProjectDto>({
    projectName: '', customerID: 0, status: 'Planung',
    progress: 0, description: '', startDate: '', endDate: '',
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      if (project) {
        setFormData({
          projectName: project.projectName,
          customerID: project.customerID,
          status: project.status,
          progress: project.progress,
          description: project.description || '',
          startDate: project.startDate.split('T')[0],
          endDate: project.endDate.split('T')[0],
        });
        setTrackingNumber(project.trackingNumber);
      } else {
        generateTrackingNumber();
        setFormData({ projectName: '', customerID: 0, status: 'Planung', progress: 0, description: '', startDate: '', endDate: '' });
      }
      setShowDeleteConfirm(false);
    }
    setError('');
  }, [project, isOpen]);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (err) { console.error(err); }
  };

  const generateTrackingNumber = async () => {
    try {
      const data = await projectService.generateTrackingNumber();
      setTrackingNumber(data.trackingNumber);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      if (project) {
        await projectService.update(project.projectID, formData);
      } else {
        await projectService.create(formData);
      }
      onSaveSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    try {
      setLoading(true);
      setError('');
      await projectService.delete(project.projectID);
      setShowDeleteConfirm(false);
      onDeleteSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Löschen des Projekts');
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = [
    { value: '0', label: '-- Kunde wählen --' },
    ...customers.map(c => ({ value: c.customerID.toString(), label: c.companyName }))
  ];

  const statusOptions = [
    { value: 'Planung', label: 'Planung' },
    { value: 'In Bearbeitung', label: 'In Bearbeitung' },
    { value: 'Warten auf Feedback', label: 'Warten auf Feedback' },
    { value: 'Abgeschlossen', label: 'Abgeschlossen' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project ? 'Projekt bearbeiten' : 'Neues Projekt anlegen'}>
      {showDeleteConfirm ? (
        <div className="space-y-6">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}
          <div className="text-center space-y-3">
            <div className="text-5xl">⚠️</div>
            <h3 className="text-lg font-semibold text-destructive">Projekt unwiderruflich löschen?</h3>
            <p className="text-sm text-muted-foreground">
              Das Projekt „{project?.projectName}" und alle zugehörigen Daten werden permanent gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden!
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="flex-1">
              {loading ? 'Löschen...' : '🗑️ Ja, endgültig löschen'}
            </Button>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={loading} className="flex-1">
              Abbrechen
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}
          <div className="space-y-1.5">
            <Label>Tracking-Nummer</Label>
            <Input value={trackingNumber} readOnly className="bg-muted text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <Label>Projektname *</Label>
            <Input required value={formData.projectName} onChange={e => setFormData({ ...formData, projectName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Kunde *</Label>
            <CustomSelect
              value={formData.customerID.toString()}
              onChange={value => setFormData({ ...formData, customerID: parseInt(value) })}
              options={customerOptions}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <CustomSelect
              value={formData.status}
              onChange={value => setFormData({ ...formData, status: value })}
              options={statusOptions}
            />
          </div>
          <div className="space-y-2">
            <Label>Fortschritt ({formData.progress}%)</Label>
            <input
              type="range" min="0" max="100"
              value={formData.progress}
              onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="text-center text-2xl font-bold text-primary">{formData.progress}%</div>
          </div>
          <div className="space-y-1.5">
            <Label>Beschreibung</Label>
            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Startdatum *</Label>
              <Input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Enddatum *</Label>
              <Input type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : (project ? '✓ Speichern' : '✓ Projekt anlegen')}
            </Button>
            {project && (
              <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={loading}>
                🗑️ Löschen
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
