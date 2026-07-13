// src/components/briefing/BriefingWizardForm.tsx
import type { UpsertBriefingDto } from '../../types';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ProgressBar from '../common/ProgressBar';
import { Loader2, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TOTAL_STEPS = 6;

// Canonical option values are stored as-is in the database (German), independent of UI language.
// Only the rendered label is translated via briefing:options.<value>.
export const GOAL_OPTIONS = ['Kunden gewinnen', 'Online verkaufen', 'Marke aufbauen', 'Informieren', 'Termine buchen', 'Portfolio zeigen'];
export const AUDIENCE_OPTIONS = ['Privatkunden (B2C)', 'Unternehmen (B2B)', 'Beide'];
export const REGION_OPTIONS = ['Lokal / Regional', 'Deutschlandweit', 'International'];
export const STYLE_OPTIONS = ['Modern & minimalistisch', 'Luxuriös & premium', 'Verspielt & kreativ', 'Klassisch & seriös', 'Tech & digital', 'Natürlich & organisch'];
export const ANIM_OPTIONS = ['Subtil & dezent', 'Ausgeprägt & beeindruckend', 'Keine'];
export const PAGE_OPTIONS = ['Startseite', 'Über uns', 'Leistungen', 'Referenzen / Portfolio', 'Blog / News', 'Kontakt', 'Online-Shop', 'FAQ'];
export const FEATURE_OPTIONS = ['Kontaktformular', 'Bewerbungsformular', 'Terminbuchung', 'Online-Shop / Bezahlung', 'Newsletter', 'Login-Bereich', 'Live-Chat', 'Mehrsprachigkeit', 'Bewertungen / Reviews'];
export const DEADLINE_OPTIONS = ['So schnell wie möglich', 'In 1–2 Monaten', 'In 3–6 Monaten', 'Kein fester Termin'];
export const BUDGET_OPTIONS = ['Unter 1.000 €', '1.000 – 3.000 €', '3.000 – 8.000 €', 'Über 8.000 €', 'Noch unklar'];

export const toList = (value?: string) => (value ? value.split(', ').filter(Boolean) : []);

const OTHER_LABEL = 'Sonstiges';
const OTHER_PREFIX = `${OTHER_LABEL}: `;
const isOtherValue = (raw: string) => raw === OTHER_LABEL || raw.startsWith(OTHER_PREFIX);
const parseOtherText = (raw: string) => (raw.startsWith(OTHER_PREFIX) ? raw.slice(OTHER_PREFIX.length) : '');

export const YesNoGroup = ({ value, onChange, options = ['Ja', 'Nein'] }: { value?: string; onChange: (v: string) => void; options?: string[] }) => {
  const { t } = useTranslation('briefing');
  const allOptions = [...options, OTHER_LABEL];
  const otherActive = !!value && isOtherValue(value);
  const otherText = otherActive ? parseOtherText(value!) : '';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {allOptions.map(opt => {
          const active = opt === OTHER_LABEL ? otherActive : value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => { if (opt !== OTHER_LABEL || !otherActive) onChange(opt); }}
              className={cn(
                'flex-1 min-w-[100px] px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                active ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {opt === OTHER_LABEL ? t('other') : t(`options.${opt}`, { defaultValue: opt })}
            </button>
          );
        })}
      </div>
      {otherActive && (
        <Input
          value={otherText}
          onChange={e => onChange(e.target.value ? `${OTHER_PREFIX}${e.target.value}` : OTHER_LABEL)}
          placeholder={t('otherPlaceholder')}
          autoFocus
        />
      )}
    </div>
  );
};

export const MultiGroup = ({
  value, onToggle, onOtherChange, options,
}: { value?: string; onToggle: (opt: string) => void; onOtherChange: (text: string) => void; options: string[] }) => {
  const { t } = useTranslation('briefing');
  const selected = toList(value);
  const allOptions = [...options, OTHER_LABEL];
  const otherEntry = selected.find(isOtherValue);
  const otherActive = !!otherEntry;
  const otherText = otherEntry ? parseOtherText(otherEntry) : '';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {allOptions.map(opt => {
          const active = opt === OTHER_LABEL ? otherActive : selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                active ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {opt === OTHER_LABEL ? t('other') : t(`options.${opt}`, { defaultValue: opt })}
            </button>
          );
        })}
      </div>
      {otherActive && (
        <Input
          value={otherText}
          onChange={e => onOtherChange(e.target.value)}
          placeholder={t('otherPlaceholder')}
          autoFocus
        />
      )}
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

export const STEP_META = [
  { titleKey: 'steps.company.title', subtitleKey: 'steps.company.subtitle' },
  { titleKey: 'steps.goal.title', subtitleKey: 'steps.goal.subtitle' },
  { titleKey: 'steps.design.title', subtitleKey: 'steps.design.subtitle' },
  { titleKey: 'steps.pagesFeatures.title', subtitleKey: 'steps.pagesFeatures.subtitle' },
  { titleKey: 'steps.contentTech.title', subtitleKey: 'steps.contentTech.subtitle' },
  { titleKey: 'steps.budgetTimeline.title', subtitleKey: 'steps.budgetTimeline.subtitle' },
] as const;

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
  secondaryFinish?: { label: string; icon: React.ReactNode; onClick: () => Promise<void> };
}

const BriefingWizardForm: React.FC<BriefingWizardFormProps> = ({
  formData, onFieldChange, step, onStepChange, saving, onPersist, onFinish, finishLabel, finishIcon, onCancel, secondaryFinish,
}) => {
  const { t } = useTranslation('briefing');
  const { t: tc } = useTranslation('common');
  const set = (field: keyof UpsertBriefingDto, value: string) => onFieldChange(field, value);

  // Multi-select fields: add/remove a chip from the comma-joined list.
  // "Sonstiges" is matched by prefix rather than exact string, since once the
  // customer types custom text the stored entry becomes "Sonstiges: <text>".
  const toggle = (field: keyof UpsertBriefingDto, option: string) => {
    const current = toList(formData[field]);
    if (option === OTHER_LABEL) {
      const hasOther = current.some(isOtherValue);
      const next = hasOther ? current.filter(o => !isOtherValue(o)) : [...current, OTHER_LABEL];
      onFieldChange(field, next.join(', '));
      return;
    }
    const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
    onFieldChange(field, next.join(', '));
  };

  // Multi-select fields: replace the "Sonstiges" entry's free text, keeping the rest of the list intact.
  const setOtherText = (field: keyof UpsertBriefingDto, text: string) => {
    const current = toList(formData[field]);
    const withoutOther = current.filter(o => !isOtherValue(o));
    const nextOther = text ? `${OTHER_PREFIX}${text}` : OTHER_LABEL;
    onFieldChange(field, [...withoutOther, nextOther].join(', '));
  };

  // Single-select fields rendered with the MultiGroup chip UI (Deadline, Budget):
  // "Sonstiges" free text simply replaces the whole field value.
  const setSingleOtherText = (field: keyof UpsertBriefingDto, text: string) => {
    onFieldChange(field, text ? `${OTHER_PREFIX}${text}` : OTHER_LABEL);
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
        <p className="text-xs text-muted-foreground">{tc('status.step', { defaultValue: 'Schritt {{step}} von {{total}}', step, total: TOTAL_STEPS })}</p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{t(stepMeta.titleKey)}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t(stepMeta.subtitleKey)}</p>
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <QCard label={t('questions.companyName.label')}>
                <Input value={formData.companyName} onChange={e => set('companyName', e.target.value)} placeholder={t('questions.companyName.placeholder')} />
              </QCard>
              <QCard label={t('questions.businessDescription.label')} hint={t('questions.businessDescription.hint')}>
                <Textarea rows={3} value={formData.businessDescription} onChange={e => set('businessDescription', e.target.value)} placeholder={t('questions.businessDescription.placeholder')} />
              </QCard>
              <QCard label={t('questions.hasLogo.label')}>
                <YesNoGroup value={formData.hasLogo} onChange={v => set('hasLogo', v)} />
              </QCard>
              <QCard label={t('questions.hasExistingWebsite.label')}>
                <YesNoGroup value={formData.hasExistingWebsite} onChange={v => set('hasExistingWebsite', v)} options={['Ja', 'Nein, komplett neu']} />
              </QCard>
              {formData.hasExistingWebsite === 'Ja' && (
                <QCard label={t('questions.existingUrl.label')}>
                  <Input type="url" value={formData.existingUrl} onChange={e => set('existingUrl', e.target.value)} placeholder={t('questions.existingUrl.placeholder')} />
                </QCard>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <QCard label={t('questions.goals.label')}>
                <MultiGroup value={formData.goals} onToggle={o => toggle('goals', o)} onOtherChange={t2 => setOtherText('goals', t2)} options={GOAL_OPTIONS} />
              </QCard>
              <QCard label={t('questions.audience.label')}>
                <MultiGroup value={formData.audience} onToggle={o => toggle('audience', o)} onOtherChange={t2 => setOtherText('audience', t2)} options={AUDIENCE_OPTIONS} />
              </QCard>
              <QCard label={t('questions.region.label')}>
                <MultiGroup value={formData.region} onToggle={o => toggle('region', o)} onOtherChange={t2 => setOtherText('region', t2)} options={REGION_OPTIONS} />
              </QCard>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <QCard label={t('questions.style.label')}>
                <MultiGroup value={formData.style} onToggle={o => toggle('style', o)} onOtherChange={t2 => setOtherText('style', t2)} options={STYLE_OPTIONS} />
              </QCard>
              <QCard label={t('questions.colors.label')} hint={t('questions.colors.hint')}>
                <Input value={formData.colors} onChange={e => set('colors', e.target.value)} placeholder={t('questions.colors.placeholder')} />
              </QCard>
              <QCard label={t('questions.references.label')}>
                <Textarea rows={3} value={formData.references} onChange={e => set('references', e.target.value)} placeholder={t('questions.references.placeholder')} />
              </QCard>
              <QCard label={t('questions.animations.label')}>
                <MultiGroup value={formData.animations} onToggle={o => toggle('animations', o)} onOtherChange={t2 => setOtherText('animations', t2)} options={ANIM_OPTIONS} />
              </QCard>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <QCard label={t('questions.pages.label')}>
                <MultiGroup value={formData.pages} onToggle={o => toggle('pages', o)} onOtherChange={t2 => setOtherText('pages', t2)} options={PAGE_OPTIONS} />
              </QCard>
              <QCard label={t('questions.features.label')}>
                <MultiGroup value={formData.features} onToggle={o => toggle('features', o)} onOtherChange={t2 => setOtherText('features', t2)} options={FEATURE_OPTIONS} />
              </QCard>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <QCard label={t('questions.hasTexts.label')}>
                <YesNoGroup value={formData.hasTexts} onChange={v => set('hasTexts', v)} options={['Ja, vorhanden', 'Teilweise', 'Nein, bitte erstellen']} />
              </QCard>
              <QCard label={t('questions.hasImages.label')}>
                <YesNoGroup value={formData.hasImages} onChange={v => set('hasImages', v)} options={['Ja', 'Teilweise', 'Nein – Stock-Bilder']} />
              </QCard>
              <QCard label={t('questions.seoImportant.label')}>
                <YesNoGroup value={formData.seoImportant} onChange={v => set('seoImportant', v)} options={['Ja, sehr wichtig', 'Etwas', 'Nein']} />
              </QCard>
              <QCard label={t('questions.hasDomain.label')}>
                <YesNoGroup value={formData.hasDomain} onChange={v => set('hasDomain', v)} />
              </QCard>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <QCard label={t('questions.deadline.label')}>
                <MultiGroup value={formData.deadline} onToggle={o => set('deadline', o)} onOtherChange={t2 => setSingleOtherText('deadline', t2)} options={DEADLINE_OPTIONS} />
              </QCard>
              <QCard label={t('questions.budget.label')}>
                <MultiGroup value={formData.budget} onToggle={o => set('budget', o)} onOtherChange={t2 => setSingleOtherText('budget', t2)} options={BUDGET_OPTIONS} />
              </QCard>
              <QCard label={t('questions.notes.label')}>
                <Textarea rows={4} value={formData.notes} onChange={e => set('notes', e.target.value)} placeholder={t('questions.notes.placeholder')} />
              </QCard>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
                  <X className="w-4 h-4 mr-1.5" />{tc('actions.cancel')}
                </Button>
              )}
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={goBack} disabled={saving}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" />{tc('actions.back')}
                </Button>
              )}
            </div>

            {step < TOTAL_STEPS ? (
              <Button type="button" className="ml-auto" onClick={goNext} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                {tc('actions.next')}<ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <Button type="button" onClick={onFinish} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : finishIcon}
                  {finishLabel}
                </Button>
                {secondaryFinish && (
                  <Button type="button" variant="outline" onClick={secondaryFinish.onClick} disabled={saving}>
                    {secondaryFinish.icon}{secondaryFinish.label}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BriefingWizardForm;
