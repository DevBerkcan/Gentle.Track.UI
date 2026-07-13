// src/components/modals/AdminModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../api/services/adminService';
import { projectService } from '../../api/services/projectService';
import Modal from '../common/Modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserPlus, X, Loader2 } from 'lucide-react';
import type { Project } from '../../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onSaveSuccess }) => {
  const { t } = useTranslation('admins');
  const { t: tc } = useTranslation('common');
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
      setError(t('createModal.errors.requiredFields')); return;
    }
    if (formData.role === 'Admin' && formData.projectAccess === 'Zugewiesene Projekte' && formData.assignedProjectIDs.length === 0) {
      setError(t('createModal.errors.selectProject')); return;
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
      setError(err.response?.data?.message || err.response?.data?.title || err.message || t('createModal.errors.createFailed'));
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
    <Modal isOpen={isOpen} onClose={onClose} title={t('createModal.title')}>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t('createModal.nameLabel')}</Label>
          <Input placeholder={t('createModal.namePlaceholder')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t('createModal.emailLabel')}</Label>
          <Input type="email" placeholder={t('createModal.emailPlaceholder')} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t('createModal.passwordLabel')}</Label>
          <Input type="password" placeholder={t('createModal.passwordPlaceholder')} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t('createModal.roleLabel')}</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={formData.role}
            onChange={e => handleRoleChange(e.target.value as 'Owner' | 'Admin')}
          >
            <option value="Admin">Admin</option>
            <option value="Owner">Owner</option>
          </select>
          <p className="text-xs text-muted-foreground">
            {formData.role === 'Owner' ? t('createModal.roleHint.owner') : t('createModal.roleHint.admin')}
          </p>
        </div>
        {formData.role === 'Admin' && (
          <div className="space-y-1.5">
            <Label>{t('createModal.projectAccessLabel')}</Label>
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
              {formData.projectAccess === 'Alle Projekte' ? t('createModal.projectAccessHint.all') : t('createModal.projectAccessHint.assigned')}
            </p>
          </div>
        )}
        {showProjectSelection && (
          <div className="space-y-1.5">
            <Label>{t('createModal.assignProjectsLabel', { count: formData.assignedProjectIDs.length })}</Label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-input p-2 space-y-1">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('createModal.noProjectsAvailable')}</p>
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
            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1.5" />}
            {loading ? t('createModal.submitting') : t('createModal.submit')}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-1.5" />{tc('actions.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminModal;
