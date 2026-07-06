// src/components/modals/BriefingViewModal.tsx
import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Notification from '../common/Notification';
import { briefingService } from '../../api/services/briefingService';
import type { Briefing, UpsertBriefingDto } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check, ClipboardList, Mail, Pencil, Save, X } from 'lucide-react';

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

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
    {children}
  </div>
);

export const BriefingViewModal: React.FC<BriefingViewModalProps> = ({ isOpen, onClose, projectId, projectName }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
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

  const set = (field: keyof UpsertBriefingDto, value: string) => setForm(f => ({ ...f, [field]: value }));

  const startEditing = () => {
    setForm(briefing ? formFromBriefing(briefing) : emptyForm);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!projectId) return;
    try {
      setSaving(true);
      const result = await briefingService.updateByProjectId(projectId, form);
      setBriefing(result);
      setNotFound(false);
      setEditing(false);
      notify('success', 'Briefing gespeichert.');
    } catch {
      notify('error', 'Briefing konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Website-Briefing – ${projectName ?? ''}`}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">Briefing wird geladen…</p>
        </div>
      ) : editing ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <F label="Firmenname"><Input value={form.companyName} onChange={e => set('companyName', e.target.value)} /></F>
            <F label="Kontaktperson"><Input value={form.contactName} onChange={e => set('contactName', e.target.value)} /></F>
            <F label="E-Mail"><Input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} /></F>
            <F label="Logo vorhanden"><Input value={form.hasLogo} onChange={e => set('hasLogo', e.target.value)} /></F>
            <F label="Bestehende Website"><Input value={form.hasExistingWebsite} onChange={e => set('hasExistingWebsite', e.target.value)} /></F>
            <F label="Website-URL"><Input value={form.existingUrl} onChange={e => set('existingUrl', e.target.value)} /></F>
            <F label="Ziel"><Input value={form.goals} onChange={e => set('goals', e.target.value)} /></F>
            <F label="Zielgruppe"><Input value={form.audience} onChange={e => set('audience', e.target.value)} /></F>
            <F label="Region"><Input value={form.region} onChange={e => set('region', e.target.value)} /></F>
            <F label="Stil"><Input value={form.style} onChange={e => set('style', e.target.value)} /></F>
            <F label="Farben"><Input value={form.colors} onChange={e => set('colors', e.target.value)} /></F>
            <F label="Animationsgrad"><Input value={form.animations} onChange={e => set('animations', e.target.value)} /></F>
            <F label="Seiten"><Input value={form.pages} onChange={e => set('pages', e.target.value)} /></F>
            <F label="Funktionen"><Input value={form.features} onChange={e => set('features', e.target.value)} /></F>
            <F label="CMS gewünscht"><Input value={form.needsCms} onChange={e => set('needsCms', e.target.value)} /></F>
            <F label="Texte vorhanden"><Input value={form.hasTexts} onChange={e => set('hasTexts', e.target.value)} /></F>
            <F label="Bilder vorhanden"><Input value={form.hasImages} onChange={e => set('hasImages', e.target.value)} /></F>
            <F label="SEO wichtig"><Input value={form.seoImportant} onChange={e => set('seoImportant', e.target.value)} /></F>
            <F label="Domain/Hosting vorhanden"><Input value={form.hasDomain} onChange={e => set('hasDomain', e.target.value)} /></F>
            <F label="Deadline"><Input value={form.deadline} onChange={e => set('deadline', e.target.value)} /></F>
            <F label="Budget"><Input value={form.budget} onChange={e => set('budget', e.target.value)} /></F>
          </div>
          <F label="Beschreibung"><Textarea rows={3} value={form.businessDescription} onChange={e => set('businessDescription', e.target.value)} /></F>
          <F label="Referenzen / Inspirationen"><Textarea rows={2} value={form.references} onChange={e => set('references', e.target.value)} /></F>
          <F label="Anmerkungen"><Textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} /></F>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
              <X className="w-3.5 h-3.5 mr-1.5" />Abbrechen
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              Speichern
            </Button>
          </div>
        </div>
      ) : notFound || !briefing || (!briefing.isSubmitted && !briefing.companyName) ? (
        <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
          <ClipboardList className="w-8 h-8 opacity-30" />
          <p className="text-sm font-medium">Noch kein Briefing vorhanden</p>
          <p className="text-xs text-center max-w-xs">Der Kunde hat das Website-Briefing über seinen Tracking-Link noch nicht ausgefüllt oder abgeschickt.</p>
          <Button type="button" size="sm" variant="outline" onClick={startEditing}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />Briefing selbst ausfüllen
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {!briefing.isSubmitted && (
            <div className="flex items-center gap-2 text-xs bg-warning-bg border border-warning/25 text-[#9A6510] rounded-lg px-3 py-2">
              Entwurf – der Kunde hat das Briefing noch nicht final abgeschickt.
            </div>
          )}

          <div className="flex justify-end">
            <Button type="button" size="sm" variant="outline" onClick={startEditing}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />Bearbeiten
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Firmenname" value={briefing.companyName} />
            <Field label="Kontakt" value={briefing.contactName} />
            <Field label="Beschreibung" value={briefing.businessDescription} />
            <Field label="E-Mail" value={briefing.contactEmail} />
            <Field label="Ziel" value={briefing.goals} />
            <Field label="Zielgruppe" value={briefing.audience} />
            <Field label="Stil" value={briefing.style} />
            <Field label="Farben" value={briefing.colors} />
            <Field label="Seiten" value={briefing.pages} />
            <Field label="Funktionen" value={briefing.features} />
            <Field label="Deadline" value={briefing.deadline} />
            <Field label="Budget" value={briefing.budget} />
          </div>
          {briefing.notes && <Field label="Anmerkungen" value={briefing.notes} />}

          {briefing.generatedPrompt && (
            <div className="rounded-xl border border-border bg-secondary p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">KI-Prompt für die Website-Erstellung</p>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-success" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                  {copied ? 'Kopiert!' : 'Kopieren'}
                </Button>
              </div>
              <pre className="text-xs leading-relaxed text-foreground whitespace-pre-wrap max-h-80 overflow-y-auto font-mono">
                {briefing.generatedPrompt}
              </pre>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-primary">
            <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Diesen Prompt kannst du direkt an ein KI-Coding-Tool übergeben, um das React + TypeScript Projekt zu erzeugen.</span>
          </div>
        </div>
      )}
      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
    </Modal>
  );
};
