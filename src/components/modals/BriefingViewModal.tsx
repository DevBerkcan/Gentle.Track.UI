// src/components/modals/BriefingViewModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import Notification from '../common/Notification';
import { briefingService } from '../../api/services/briefingService';
import BriefingWizardForm from '../briefing/BriefingWizardForm';
import BriefingFullView from '../briefing/BriefingFullView';
import type { Briefing, UpsertBriefingDto } from '../../types';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, ClipboardList, Mail, Pencil, Save, Send, Eye, ArrowLeft } from 'lucide-react';

interface BriefingViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number | null;
  projectName?: string;
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-sm text-foreground mt-0.5">{value || '–'}</p>
  </div>
);

const emptyForm: UpsertBriefingDto = {
  companyName: '', businessDescription: '', hasLogo: '', hasExistingWebsite: '', existingUrl: '',
  goals: '', audience: '', region: '',
  style: '', colors: '', references: '', animations: '',
  pages: '', features: '', needsCms: '',
  hasTexts: '', hasImages: '', seoImportant: '', hasDomain: '',
  deadline: '', budget: '', notes: '', contactName: '', contactEmail: '',
};

const formFromBriefing = (b: Briefing): UpsertBriefingDto => ({
  companyName: b.companyName || '', businessDescription: b.businessDescription || '',
  hasLogo: b.hasLogo || '', hasExistingWebsite: b.hasExistingWebsite || '', existingUrl: b.existingUrl || '',
  goals: b.goals || '', audience: b.audience || '', region: b.region || '',
  style: b.style || '', colors: b.colors || '', references: b.references || '', animations: b.animations || '',
  pages: b.pages || '', features: b.features || '', needsCms: b.needsCms || '',
  hasTexts: b.hasTexts || '', hasImages: b.hasImages || '', seoImportant: b.seoImportant || '', hasDomain: b.hasDomain || '',
  deadline: b.deadline || '', budget: b.budget || '', notes: b.notes || '', contactName: b.contactName || '', contactEmail: b.contactEmail || '',
});

export const BriefingViewModal: React.FC<BriefingViewModalProps> = ({ isOpen, onClose, projectId, projectName }) => {
  const { t } = useTranslation('briefing');
  const { t: tc } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [viewingFull, setViewingFull] = useState(false);
  const [step, setStep] = useState(1);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [form, setForm] = useState<UpsertBriefingDto>(emptyForm);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: 'info', message: '' });

  const notify = (type: NotificationState['type'], message: string) => setNotification({ show: true, type, message });

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      setNotFound(false);
      setBriefing(null);
      setEditing(false);
      setViewingFull(false);
      briefingService.getByProjectId(projectId)
        .then(setBriefing)
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    }
  }, [isOpen, projectId]);

  const handleCopy = () => {
    if (!briefing?.generatedPrompt) return;
    navigator.clipboard.writeText(briefing.generatedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFieldChange = (field: keyof UpsertBriefingDto, value: string) => setForm(f => ({ ...f, [field]: value }));

  const startEditing = () => {
    setForm(briefing ? formFromBriefing(briefing) : emptyForm);
    setStep(1);
    setEditing(true);
    setViewingFull(false);
  };

  const persist = async () => {
    if (!projectId) return;
    try {
      setSaving(true);
      const result = await briefingService.updateByProjectId(projectId, form);
      setBriefing(result);
      setNotFound(false);
    } catch {
      notify('error', t('viewModal.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    await persist();
    setEditing(false);
    notify('success', t('viewModal.saveSuccess'));
  };

  const handleSubmit = async () => {
    if (!projectId) return;
    try {
      setSaving(true);
      const result = await briefingService.submitByProjectId(projectId, form);
      setBriefing(result);
      setNotFound(false);
      setEditing(false);
      notify('success', t('viewModal.submitSuccess'));
    } catch {
      notify('error', t('viewModal.submitError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('viewModal.title', { projectName: projectName ?? '' })} size={viewingFull ? 'xl' : 'lg'}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">{tc('status.loading')}</p>
        </div>
      ) : editing ? (
        <BriefingWizardForm
          formData={form}
          onFieldChange={handleFieldChange}
          step={step}
          onStepChange={setStep}
          saving={saving}
          onPersist={persist}
          onFinish={handleSave}
          finishLabel={tc('actions.save')}
          finishIcon={<Save className="w-4 h-4 mr-1.5" />}
          onCancel={() => setEditing(false)}
          secondaryFinish={{ label: tc('actions.submit'), icon: <Send className="w-4 h-4 mr-1.5" />, onClick: handleSubmit }}
        />
      ) : viewingFull && briefing ? (
        <div className="space-y-5">
          <div className="flex justify-between">
            <Button type="button" size="sm" variant="ghost" onClick={() => setViewingFull(false)}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />{tc('actions.back')}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={startEditing}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />{tc('actions.edit')}
            </Button>
          </div>
          <BriefingFullView formData={formFromBriefing(briefing)} />
        </div>
      ) : notFound || !briefing || (!briefing.isSubmitted && !briefing.companyName) ? (
        <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
          <ClipboardList className="w-8 h-8 opacity-30" />
          <p className="text-sm font-medium">{t('viewModal.emptyTitle')}</p>
          <p className="text-xs text-center max-w-xs">{t('viewModal.emptyDescription')}</p>
          <Button type="button" size="sm" variant="outline" onClick={startEditing}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />{t('viewModal.fillSelf')}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {!briefing.isSubmitted && (
            <div className="flex items-center gap-2 text-xs bg-warning-bg border border-warning/25 text-[#9A6510] rounded-lg px-3 py-2">
              {t('viewModal.draftNotice')}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setViewingFull(true)}>
              <Eye className="w-3.5 h-3.5 mr-1.5" />{tc('actions.view')}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={startEditing}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />{tc('actions.edit')}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('summary.companyName')} value={briefing.companyName} />
            <Field label={t('summary.contactName')} value={briefing.contactName} />
            <Field label={t('summary.businessDescription')} value={briefing.businessDescription} />
            <Field label={t('summary.contactEmail')} value={briefing.contactEmail} />
            <Field label={t('summary.goals')} value={briefing.goals} />
            <Field label={t('summary.audience')} value={briefing.audience} />
            <Field label={t('summary.style')} value={briefing.style} />
            <Field label={t('summary.colors')} value={briefing.colors} />
            <Field label={t('summary.pages')} value={briefing.pages} />
            <Field label={t('summary.features')} value={briefing.features} />
            <Field label={t('summary.deadline')} value={briefing.deadline} />
            <Field label={t('summary.budget')} value={briefing.budget} />
          </div>
          {briefing.notes && <Field label={t('summary.notes')} value={briefing.notes} />}

          {briefing.generatedPrompt && (
            <div className="rounded-xl border border-border bg-secondary p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">{t('viewModal.aiPromptTitle')}</p>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-success" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                  {copied ? tc('actions.copied') : tc('actions.copy')}
                </Button>
              </div>
              <pre className="text-xs leading-relaxed text-foreground whitespace-pre-wrap max-h-80 overflow-y-auto font-mono">
                {briefing.generatedPrompt}
              </pre>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-primary">
            <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{t('viewModal.aiPromptNote')}</span>
          </div>
        </div>
      )}
      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
    </Modal>
  );
};
