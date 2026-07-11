// src/components/modals/EditAdminModal.tsx
import { useState, useEffect } from 'react';
import { adminService } from '../../api/services/adminService';
import { projectService } from '../../api/services/projectService';
import Modal from '../common/Modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import type { Admin, Project } from '../../types';

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  onDeleteSuccess?: () => void;
  admin: Admin | null;
}

const EditAdminModal: React.FC<EditAdminModalProps> = ({ isOpen, onClose, onSaveSuccess, onDeleteSuccess, admin }) => {
  const [formData, setFormData] = useState({
    name: '', email: '',
    role: 'Admin' as 'Owner' | 'Admin',
    projectAccess: 'Alle Projekte',
    status: 'Aktiv' as 'Aktiv' | 'Inaktiv',
    assignedProjectIDs: [] as number[],
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && admin) {
      loadProjects();
      setFormData({
        name: admin.name, email: admin.email,
        role: admin.role as 'Owner' | 'Admin',
        projectAccess: admin.projectAccess,
        status: admin.status as 'Aktiv' | 'Inaktiv',
        assignedProjectIDs: admin.assignedProjectIDs || [],
      });
      setShowDeleteConfirm(false);
    }
    setError('');
  }, [isOpen, admin]);

  const loadProjects = async () => {
    try { const data = await projectService.getAll(); setProjects(data); }
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    if (!formData.name || !formData.email) { setError('Bitte füllen Sie alle Pflichtfelder aus'); return; }
    if (formData.role === 'Admin' && formData.projectAccess === 'Zugewiesene Projekte' && formData.assignedProjectIDs.length === 0) {
      setError('Bitte wählen Sie mindestens ein Projekt aus'); return;
    }
    try {
      setLoading(true); setError('');
      await adminService.update(admin.adminID, {
        ...formData,
        assignedProjectIDs: formData.role === 'Admin' && formData.projectAccess === 'Zugewiesene Projekte'
          ? formData.assignedProjectIDs : [],
      });
      onSaveSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.title || err.message || 'Fehler beim Aktualisieren');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!admin) return;
    try {
      setLoading(true); setError('');
      await adminService.deletePermanently(admin.adminID);
      setShowDeleteConfirm(false);
      onDeleteSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Löschen');
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
  const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Administrator bearbeiten">
      {showDeleteConfirm ? (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold text-destructive">Administrator unwiderruflich löschen?</h3>
            <p className="text-sm text-muted-foreground">
              Der Administrator „{admin?.name}" ({admin?.email}) wird permanent gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden!
            </p>
          </div>
          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
              {loading ? 'Löschen...' : 'Ja, endgültig löschen'}
            </Button>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={loading} className="flex-1">
              <X className="w-4 h-4 mr-1.5" />Abbrechen
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>E-Mail *</Label>
            <Input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Rolle *</Label>
            <select className={selectClass} value={formData.role} onChange={e => handleRoleChange(e.target.value as 'Owner' | 'Admin')}>
              <option value="Admin">Admin</option>
              <option value="Owner">Owner</option>
            </select>
            <p className="text-xs text-muted-foreground">
              {formData.role === 'Owner' ? '🔑 Vollzugriff auf alle Funktionen und Projekte' : '👤 Eingeschränkter Zugriff basierend auf Projektzuweisung'}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Status *</Label>
            <select className={selectClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as 'Aktiv' | 'Inaktiv' })}>
              <option value="Aktiv">Aktiv</option>
              <option value="Inaktiv">Inaktiv</option>
            </select>
          </div>
          {formData.role === 'Admin' && (
            <div className="space-y-1.5">
              <Label>Projektzugriff *</Label>
              <select
                className={selectClass}
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
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
            <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={loading}>
              <Trash2 className="w-4 h-4 mr-1.5" />Löschen
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4 mr-1.5" />Abbrechen
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditAdminModal;
