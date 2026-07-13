// src/components/modals/ProjectModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { projectService } from '../../api/services/projectService';
import { customerService } from '../../api/services/customerService';
import CustomSelect from '../common/CustomSelect';
import Modal from '../common/Modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Plus, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
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
  const { t } = useTranslation('projects');
  const { t: tc } = useTranslation('common');
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
      setError(err.response?.data?.message || t('modal.errors.saveFailed'));
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
      setError(err.response?.data?.message || t('modal.errors.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = [
    { value: '0', label: t('modal.fields.selectCustomerPlaceholder') },
    ...customers.map(c => ({ value: c.customerID.toString(), label: c.companyName }))
  ];

  const statusOptions = [
    { value: 'Planung', label: tc('statusValues.Planung') },
    { value: 'In Bearbeitung', label: tc('statusValues.In Bearbeitung') },
    { value: 'Warten auf Feedback', label: tc('statusValues.Warten auf Feedback') },
    { value: 'Abgeschlossen', label: tc('statusValues.Abgeschlossen') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project ? t('modal.title.edit') : t('modal.title.create')}>
      {showDeleteConfirm ? (
        <div className="space-y-6">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}
          <div className="text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold text-destructive">{t('modal.deleteConfirm.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('modal.deleteConfirm.message', { name: project?.projectName })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
              {loading ? t('modal.deleteConfirm.deletingLabel') : t('modal.deleteConfirm.confirmLabel')}
            </Button>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={loading} className="flex-1">
              <X className="w-4 h-4 mr-1.5" />{tc('actions.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}
          <div className="space-y-1.5">
            <Label>{t('modal.fields.trackingNumber')}</Label>
            <Input value={trackingNumber} readOnly className="bg-muted text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <Label>{t('modal.fields.projectName')}</Label>
            <Input required value={formData.projectName} onChange={e => setFormData({ ...formData, projectName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('modal.fields.customer')}</Label>
            <CustomSelect
              value={formData.customerID.toString()}
              onChange={value => setFormData({ ...formData, customerID: parseInt(value) })}
              options={customerOptions}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('modal.fields.status')}</Label>
            <CustomSelect
              value={formData.status}
              onChange={value => setFormData({ ...formData, status: value })}
              options={statusOptions}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('modal.fields.progress', { progress: formData.progress })}</Label>
            <input
              type="range" min="0" max="100"
              value={formData.progress}
              onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="text-center text-2xl font-bold text-primary">{formData.progress}%</div>
          </div>
          <div className="space-y-1.5">
            <Label>{t('modal.fields.description')}</Label>
            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('modal.fields.startDate')}</Label>
              <Input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('modal.fields.endDate')}</Label>
              <Input type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : project ? <Save className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
              {loading ? t('modal.savingButton') : (project ? tc('actions.save') : t('modal.createButton'))}
            </Button>
            {project && (
              <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={loading}>
                <Trash2 className="w-4 h-4 mr-1.5" />{tc('actions.delete')}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4 mr-1.5" />{tc('actions.cancel')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
