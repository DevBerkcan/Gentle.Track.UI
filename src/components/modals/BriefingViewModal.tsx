// src/components/modals/BriefingViewModal.tsx
import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { briefingService } from '../../api/services/briefingService';
import type { Briefing } from '../../types';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, ClipboardList, Mail } from 'lucide-react';

interface BriefingViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number | null;
  projectName?: string;
}

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-sm text-foreground mt-0.5">{value || '–'}</p>
  </div>
);

export const BriefingViewModal: React.FC<BriefingViewModalProps> = ({ isOpen, onClose, projectId, projectName }) => {
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      setNotFound(false);
      setBriefing(null);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Website-Briefing – ${projectName ?? ''}`}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">Briefing wird geladen…</p>
        </div>
      ) : notFound || !briefing || (!briefing.isSubmitted && !briefing.companyName) ? (
        <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground">
          <ClipboardList className="w-8 h-8 opacity-30" />
          <p className="text-sm font-medium">Noch kein Briefing vorhanden</p>
          <p className="text-xs text-center max-w-xs">Der Kunde hat das Website-Briefing über seinen Tracking-Link noch nicht ausgefüllt oder abgeschickt.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {!briefing.isSubmitted && (
            <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2">
              Entwurf – der Kunde hat das Briefing noch nicht final abgeschickt.
            </div>
          )}

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
            <div className="rounded-xl border border-border bg-zinc-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">KI-Prompt für die Website-Erstellung</p>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
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
    </Modal>
  );
};
