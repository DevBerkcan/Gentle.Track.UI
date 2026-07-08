// src/components/briefing/BriefingWizardForm.tsx
import type { UpsertBriefingDto } from '../../types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ProgressBar from '../common/ProgressBar';
import { Loader2, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TOTAL_STEPS = 6;

export const GOAL_OPTIONS = ['Kunden gewinnen', 'Online verkaufen', 'Marke aufbauen', 'Informieren', 'Termine buchen', 'Portfolio zeigen'];
export const AUDIENCE_OPTIONS = ['Privatkunden (B2C)', 'Unternehmen (B2B)', 'Beide'];
export const REGION_OPTIONS = ['Lokal / Regional', 'Deutschlandweit', 'International'];
export const STYLE_OPTIONS = ['Modern & minimalistisch', 'Luxuriös & premium', 'Verspielt & kreativ', 'Klassisch & seriös', 'Tech & digital', 'Natürlich & organisch'];
export const ANIM_OPTIONS = ['Subtil & dezent', 'Ausgeprägt & beeindruckend', 'Keine'];
export const PAGE_OPTIONS = ['Startseite', 'Über uns', 'Leistungen', 'Referenzen / Portfolio', 'Blog / News', 'Kontakt', 'Online-Shop', 'FAQ'];
export const FEATURE_OPTIONS = ['Kontaktformular', 'Terminbuchung', 'Online-Shop / Bezahlung', 'Newsletter', 'Login-Bereich', 'Live-Chat', 'Mehrsprachigkeit', 'Bewertungen / Reviews'];
export const DEADLINE_OPTIONS = ['So schnell wie möglich', 'In 1–2 Monaten', 'In 3–6 Monaten', 'Kein fester Termin'];
export const BUDGET_OPTIONS = ['Unter 1.000 €', '1.000 – 3.000 €', '3.000 – 8.000 €', 'Über 8.000 €', 'Noch unklar'];

export const toList = (value?: string) => (value ? value.split(', ').filter(Boolean) : []);

export const YesNoGroup = ({ value, onChange, options = ['Ja', 'Nein'] }: { value?: string; onChange: (v: string) => void; options?: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={cn(
          'flex-1 min-w-[100px] px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
          value === opt ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
        )}
      >
        {opt}
      </button>
    ))}
  </div>
);

export const MultiGroup = ({ value, onToggle, options }: { value?: string; onToggle: (opt: string) => void; options: string[] }) => {
  const selected = toList(value);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={cn(
            'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
            selected.includes(opt) ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

export const QCard = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
    {children}
  </div>
);

const STEP_META = [
  { title: 'Dein Unternehmen', subtitle: 'Erzähl uns kurz, wer du bist.' },
  { title: 'Ziel der Website', subtitle: 'Was soll deine neue Website für dich tun?' },
  { title: 'Design & Stil', subtitle: 'Wie soll deine Website wirken?' },
  { title: 'Seiten & Funktionen', subtitle: 'Was soll deine Website können?' },
  { title: 'Content & Technik', subtitle: 'Was hast du bereits – was brauchen wir noch?' },
  { title: 'Projekt & Kontakt', subtitle: 'Fast geschafft! Noch ein paar letzte Details.' },
];

interface BriefingWizardFormProps {
  formData: UpsertBriefingDto;
  onFieldChange: (field: keyof UpsertBriefingDto, value: string) => void;
  step: number;
  onStepChange: (step: number) => void;
  saving: boolean;
  onPersist: () => Promise<void>;
  onFinish: () => Promise<void>;
  finishLabel: string;
  finishIcon: React.ReactNode;
  onCancel?: () => void;
  requireContact?: boolean;
}

const BriefingWizardForm: React.FC<BriefingWizardFormProps> = ({
  formData, onFieldChange, step, onStepChange, saving, onPersist, onFinish, finishLabel, finishIcon, onCancel, requireContact = true,
}) => {
  const set = (field: keyof UpsertBriefingDto, value: string) => onFieldChange(field, value);
  const toggle = (field: keyof UpsertBriefingDto, option: string) => {
    const current = toList(formData[field]);
    const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
    onFieldChange(field, next.join(', '));
  };

  const goNext = async () => {
    await onPersist();
    onStepChange(Math.min(TOTAL_STEPS, step + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    onStepChange(Math.max(1, step - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stepMeta = STEP_META[step - 1];

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <ProgressBar progress={Math.round(((step - 1) / TOTAL_STEPS) * 100)} showLabel={false} />
        <p className="text-xs text-muted-foreground">Schritt {step} von {TOTAL_STEPS}</p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{stepMeta.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{stepMeta.subtitle}</p>
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <QCard label="Wie heißt dein Unternehmen?">
                <Input value={formData.companyName} onChange={e => set('companyName', e.target.value)} placeholder="z.B. Müller GmbH" />
              </QCard>
              <QCard label="Was machst du?" hint="in einem Satz">
                <Textarea rows={3} value={formData.businessDescription} onChange={e => set('businessDescription', e.target.value)} placeholder="z.B. Wir sind ein Elektrobetrieb aus München und bieten Installationen für Privat- und Gewerbekunden an." />
              </QCard>
              <QCard label="Hast du bereits ein Logo?">
                <YesNoGroup value={formData.hasLogo} onChange={v => set('hasLogo', v)} />
              </QCard>
              <QCard label="Gibt es bereits eine Website?">
                <YesNoGroup value={formData.hasExistingWebsite} onChange={v => set('hasExistingWebsite', v)} options={['Ja', 'Nein, komplett neu']} />
              </QCard>
              {formData.hasExistingWebsite === 'Ja' && (
                <QCard label="Wie lautet die aktuelle Website-URL?">
                  <Input type="url" value={formData.existingUrl} onChange={e => set('existingUrl', e.target.value)} placeholder="https://www.beispiel.de" />
                </QCard>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <QCard label="Was ist das Hauptziel?">
                <MultiGroup value={formData.goals} onToggle={o => toggle('goals', o)} options={GOAL_OPTIONS} />
              </QCard>
              <QCard label="Wer ist deine Zielgruppe?">
                <MultiGroup value={formData.audience} onToggle={o => toggle('audience', o)} options={AUDIENCE_OPTIONS} />
              </QCard>
              <QCard label="In welcher Region bist du tätig?">
                <MultiGroup value={formData.region} onToggle={o => toggle('region', o)} options={REGION_OPTIONS} />
              </QCard>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <QCard label="Welchen Stil magst du?">
                <MultiGroup value={formData.style} onToggle={o => toggle('style', o)} options={STYLE_OPTIONS} />
              </QCard>
              <QCard label="Welche Farben gefallen dir?" hint="optional">
                <Input value={formData.colors} onChange={e => set('colors', e.target.value)} placeholder="z.B. Schwarz, Gold, Dunkelblau – oder Hex-Codes" />
              </QCard>
              <QCard label="Hast du Website-Beispiele, die dir gefallen?">
                <Textarea rows={3} value={formData.references} onChange={e => set('references', e.target.value)} placeholder="z.B. www.apple.com, www.notion.so – einfach die Links einfügen" />
              </QCard>
              <QCard label="Animationen & Effekte?">
                <MultiGroup value={formData.animations} onToggle={o => toggle('animations', o)} options={ANIM_OPTIONS} />
              </QCard>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <QCard label="Welche Seiten brauchst du?">
                <MultiGroup value={formData.pages} onToggle={o => toggle('pages', o)} options={PAGE_OPTIONS} />
              </QCard>
              <QCard label="Welche Funktionen brauchst du?">
                <MultiGroup value={formData.features} onToggle={o => toggle('features', o)} options={FEATURE_OPTIONS} />
              </QCard>
              <QCard label="Brauchst du ein CMS, um Inhalte selbst zu pflegen?">
                <YesNoGroup value={formData.needsCms} onChange={v => set('needsCms', v)} options={['Ja', 'Nein', 'Egal']} />
              </QCard>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <QCard label="Hast du bereits Texte für die Website?">
                <YesNoGroup value={formData.hasTexts} onChange={v => set('hasTexts', v)} options={['Ja, vorhanden', 'Teilweise', 'Nein, bitte erstellen']} />
              </QCard>
              <QCard label="Hast du eigene Bilder / Fotos?">
                <YesNoGroup value={formData.hasImages} onChange={v => set('hasImages', v)} options={['Ja', 'Teilweise', 'Nein – Stock-Bilder']} />
              </QCard>
              <QCard label="Ist SEO (Google-Optimierung) wichtig für dich?">
                <YesNoGroup value={formData.seoImportant} onChange={v => set('seoImportant', v)} options={['Ja, sehr wichtig', 'Etwas', 'Nein']} />
              </QCard>
              <QCard label="Hast du bereits eine Domain / Hosting?">
                <YesNoGroup value={formData.hasDomain} onChange={v => set('hasDomain', v)} />
              </QCard>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <QCard label="Wann soll die Website live gehen?">
                <MultiGroup value={formData.deadline} onToggle={o => set('deadline', o)} options={DEADLINE_OPTIONS} />
              </QCard>
              <QCard label="Budget-Rahmen (ca.)?">
                <MultiGroup value={formData.budget} onToggle={o => set('budget', o)} options={BUDGET_OPTIONS} />
              </QCard>
              <QCard label="Sonstige Wünsche oder Anmerkungen?">
                <Textarea rows={4} value={formData.notes} onChange={e => set('notes', e.target.value)} placeholder="Was ist dir noch wichtig? Besondere Anforderungen, Ideen, Fragen..." />
              </QCard>
              <QCard label={requireContact ? 'Name & E-Mail' : 'Name & E-Mail (optional)'}>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Name {requireContact && '*'}</Label>
                  <Input value={formData.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Name" />
                  <Label className="text-xs font-medium">E-Mail {requireContact && '*'}</Label>
                  <Input type="email" value={formData.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="email@beispiel.de" />
                </div>
              </QCard>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
                  <X className="w-4 h-4 mr-1.5" />Abbrechen
                </Button>
              )}
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={goBack} disabled={saving}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" />Zurück
                </Button>
              )}
            </div>

            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={goNext} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                Weiter<ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button type="button" onClick={onFinish} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : finishIcon}
                {finishLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BriefingWizardForm;
