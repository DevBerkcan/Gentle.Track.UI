// src/components/customer/ProjectBriefingForm.tsx
import { useState, useEffect } from 'react';
import { briefingService } from '../../api/services/briefingService';
import Notification from '../common/Notification';
import BriefingWizardForm from '../briefing/BriefingWizardForm';
import type { Briefing, UpsertBriefingDto } from '../../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Pencil, Send } from 'lucide-react';

interface ProjectBriefingFormProps {
  trackingNumber: string;
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const emptyForm: UpsertBriefingDto = {
  companyName: '', businessDescription: '', hasLogo: '', hasExistingWebsite: '', existingUrl: '',
  goals: '', audience: '', region: '',
  style: '', colors: '', references: '', animations: '',
  pages: '', features: '', needsCms: '',
  hasTexts: '', hasImages: '', seoImportant: '', hasDomain: '',
  deadline: '', budget: '', notes: '', contactName: '', contactEmail: '',
};

const ProjectBriefingForm: React.FC<ProjectBriefingFormProps> = ({ trackingNumber }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UpsertBriefingDto>(emptyForm);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: 'info', message: '' });

  const notify = (type: NotificationState['type'], message: string) => setNotification({ show: true, type, message });

  const fillFromBriefing = (b: Briefing) => {
    setFormData({
      companyName: b.companyName || '', businessDescription: b.businessDescription || '',
      hasLogo: b.hasLogo || '', hasExistingWebsite: b.hasExistingWebsite || '', existingUrl: b.existingUrl || '',
      goals: b.goals || '', audience: b.audience || '', region: b.region || '',
      style: b.style || '', colors: b.colors || '', references: b.references || '', animations: b.animations || '',
      pages: b.pages || '', features: b.features || '', needsCms: b.needsCms || '',
      hasTexts: b.hasTexts || '', hasImages: b.hasImages || '', seoImportant: b.seoImportant || '', hasDomain: b.hasDomain || '',
      deadline: b.deadline || '', budget: b.budget || '', notes: b.notes || '', contactName: b.contactName || '', contactEmail: b.contactEmail || '',
    });
    setWasSubmitted(b.isSubmitted);
    setShowThankYou(b.isSubmitted);
  };

  useEffect(() => {
    (async () => {
      try {
        const b = await briefingService.getByTrackingNumber(trackingNumber);
        fillFromBriefing(b);
      } catch {
        // no briefing yet – start with a blank form
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingNumber]);

  const handleFieldChange = (field: keyof UpsertBriefingDto, value: string) => setFormData(f => ({ ...f, [field]: value }));

  const persistDraft = async () => {
    try {
      setSaving(true);
      await briefingService.saveDraft(trackingNumber, formData);
    } catch {
      notify('error', 'Zwischenspeichern fehlgeschlagen. Ihre Eingaben bleiben aber im Formular erhalten.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const result = await briefingService.submit(trackingNumber, formData);
      setWasSubmitted(true);
      setShowThankYou(true);
      fillFromBriefing(result);
      notify('success', 'Briefing erfolgreich übermittelt!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      notify('error', 'Das Briefing konnte nicht übermittelt werden. Bitte versuchen Sie es erneut.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Briefing wird geladen…</p>
      </div>
    );
  }

  if (showThankYou) {
    return (
      <Card className="border border-border shadow-sm max-w-2xl">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-success-bg border-2 border-success flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Vielen Dank für Ihr Briefing!</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Wir haben Ihre Angaben erhalten und melden uns in Kürze bei Ihnen. Sie können Ihre Antworten
            über diesen Link jederzeit ändern, solange die Arbeit an Ihrer Website noch nicht begonnen hat.
          </p>
          <Button variant="outline" onClick={() => setShowThankYou(false)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />Angaben bearbeiten
          </Button>
          {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl">
      {wasSubmitted && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary border border-border rounded-lg px-3 py-2 mb-5">
          <Pencil className="w-3.5 h-3.5 shrink-0" />
          Sie bearbeiten ein bereits übermitteltes Briefing. Speichern Sie erneut, um Ihre Änderungen zu übernehmen.
        </div>
      )}

      <BriefingWizardForm
        formData={formData}
        onFieldChange={handleFieldChange}
        step={step}
        onStepChange={setStep}
        saving={saving}
        onPersist={persistDraft}
        onFinish={handleSubmit}
        finishLabel="Briefing abschicken"
        finishIcon={<Send className="w-4 h-4 mr-1.5" />}
      />

      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
    </div>
  );
};

export default ProjectBriefingForm;
