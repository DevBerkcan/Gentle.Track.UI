// src/components/modals/AdminModal.tsx
import { useState, useEffect } from 'react';
import { adminService } from '../../api/services/adminService';
import { projectService } from '../../api/services/projectService';
import Modal from '../common/Modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Project } from '../../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    role: 'Admin' as 'Owner' | 'Admin',
    projectAccess: 'Alle Projekte',
    assignedProjectIDs: [] as number[],
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) loadProjects();
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Bitte füllen Sie alle Pflichtfelder aus'); return;
    }
    if (formData.role === 'Admin' && formData.projectAccess === 'Zugewiesene Projekte' && formData.assignedProjectIDs.length === 0) {
      setError('Bitte wählen Sie mindestens ein Projekt aus'); return;
    }
    try {
      setLoading(true); setError('');
      await adminService.create({
        ...formData,
        assignedProjectIDs: formData.role === 'Admin' && formData.projectAccess === 'Zugewiesene Projekte'
          ? formData.assignedProjectIDs : [],
      });
      setFormData({ name: '', email: '', password: '', role: 'Admin', projectAccess: 'Alle Projekte', assignedProjectIDs: [] });
      onSaveSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.title || err.message || 'Fehler beim Erstellen');
    } finally { setLoading(false); }
  };

  const handleProjectToggle = (id: number) => {
    setFormData(prev => ({
      ...prev,
      assignedProjectIDs: prev.assignedProjectIDs.includes(id)
        ? prev.assignedProjectIDs.filter(x => x !== id)
        : [...prev.assignedProjectIDs, id],
    }));
  };

  const handleRoleChange = (role: 'Owner' | 'Admin') => {
    setFormData(prev => ({
      ...prev, role,
      projectAccess: role === 'Owner' ? 'Alle Projekte' : prev.projectAccess,
      assignedProjectIDs: role === 'Owner' ? [] : prev.assignedProjectIDs,
    }));
  };

  const showProjectSelection = formData.role === 'Admin' && formData.projectAccess === 'Zugewiesene Projekte';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Neuer Administrator">
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input placeholder="z.B. Max Mustermann" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>E-Mail *</Label>
          <Input type="email" placeholder="z.B. max@beispiel.de" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Passwort *</Label>
          <Input type="password" placeholder="Mindestens 8 Zeichen" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Rolle *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={formData.role}
            onChange={e => handleRoleChange(e.target.value as 'Owner' | 'Admin')}
          >
            <option value="Admin">Admin</option>
            <option value="Owner">Owner</option>
          </select>
          <p className="text-xs text-muted-foreground">
            {formData.role === 'Owner' ? '🔑 Vollzugriff auf alle Funktionen und Projekte' : '👤 Eingeschränkter Zugriff basierend auf Projektzuweisung'}
          </p>
        </div>
        {formData.role === 'Admin' && (
          <div className="space-y-1.5">
            <Label>Projektzugriff *</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={formData.projectAccess}
              onChange={e => setFormData(prev => ({
                ...prev, projectAccess: e.target.value,
                assignedProjectIDs: e.target.value === 'Alle Projekte' ? [] : prev.assignedProjectIDs,
              }))}
            >
              <option value="Alle Projekte">Alle Projekte</option>
              <option value="Zugewiesene Projekte">Zugewiesene Projekte</option>
            </select>
            <p className="text-xs text-muted-foreground">
              {formData.projectAccess === 'Alle Projekte' ? '📂 Zugriff auf alle Projekte und Kunden' : '📁 Nur Zugriff auf ausgewählte Projekte'}
            </p>
          </div>
        )}
        {showProjectSelection && (
          <div className="space-y-1.5">
            <Label>Projekte zuweisen * ({formData.assignedProjectIDs.length} ausgewählt)</Label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-input p-2 space-y-1">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Keine Projekte verfügbar</p>
              ) : projects.map(project => (
                <label
                  key={project.projectID}
                  className={`flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors border-2 ${
                    formData.assignedProjectIDs.includes(project.projectID)
                      ? 'bg-primary/5 border-primary/30'
                      : 'border-transparent hover:bg-accent'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-primary"
                    checked={formData.assignedProjectIDs.includes(project.projectID)}
                    onChange={() => handleProjectToggle(project.projectID)}
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">{project.projectName}</div>
                    <div className="text-xs text-muted-foreground">{project.customerName} · {project.trackingNumber}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Speichern...' : '✓ Administrator erstellen'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminModal;
