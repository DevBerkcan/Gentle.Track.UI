// src/components/briefing/BriefingFullView.tsx
import type { UpsertBriefingDto } from '../../types';
import { useTranslation } from 'react-i18next';
import { toList, STEP_META } from './BriefingWizardForm';

interface BriefingFullViewProps {
  formData: UpsertBriefingDto;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="col-span-full text-xs font-bold text-primary uppercase tracking-wide pt-3 border-t border-border first:pt-0 first:border-t-0">
    {children}
  </h3>
);

const Field = ({ label, value, full }: { label: string; value?: string; full?: boolean }) => (
  <div className={full ? 'col-span-full min-w-0' : 'min-w-0'}>
    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-xs text-foreground mt-0.5 leading-snug break-words whitespace-pre-wrap">
      {value?.trim() ? value : '–'}
    </p>
  </div>
);

const ChipField = ({ label, value }: { label: string; value?: string }) => {
  const { t } = useTranslation('briefing');
  const items = toList(value);
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      {items.length === 0 ? (
        <p className="text-xs text-foreground mt-0.5">–</p>
      ) : (
        <div className="flex flex-wrap gap-1 mt-1">
          {items.map(item => (
            <span key={item} className="px-1.5 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary text-[10px] font-medium leading-none">
              {t(`options.${item}`, { defaultValue: item })}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const BriefingFullView: React.FC<BriefingFullViewProps> = ({ formData }) => {
  const { t } = useTranslation('briefing');
  const f = (key: string) => t(`fullView.fields.${key}`);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
      <SectionTitle>{t(STEP_META[0].titleKey)}</SectionTitle>
      <Field label={f('companyName')} value={formData.companyName} />
      <Field label={f('contactName')} value={formData.contactName} />
      <Field label={f('contactEmail')} value={formData.contactEmail} />
      <Field label={f('businessDescription')} value={formData.businessDescription} full />
      <ChipField label={f('hasLogo')} value={formData.hasLogo} />
      <ChipField label={f('hasExistingWebsite')} value={formData.hasExistingWebsite} />
      {formData.hasExistingWebsite === 'Ja' && <Field label={f('existingUrl')} value={formData.existingUrl} />}

      <SectionTitle>{t(STEP_META[1].titleKey)}</SectionTitle>
      <ChipField label={f('goals')} value={formData.goals} />
      <ChipField label={f('audience')} value={formData.audience} />
      <ChipField label={f('region')} value={formData.region} />

      <SectionTitle>{t(STEP_META[2].titleKey)}</SectionTitle>
      <ChipField label={f('style')} value={formData.style} />
      <Field label={f('colors')} value={formData.colors} />
      <ChipField label={f('animations')} value={formData.animations} />
      <Field label={f('references')} value={formData.references} full />

      <SectionTitle>{t(STEP_META[3].titleKey)}</SectionTitle>
      <ChipField label={f('pages')} value={formData.pages} />
      <ChipField label={f('features')} value={formData.features} />

      <SectionTitle>{t(STEP_META[4].titleKey)}</SectionTitle>
      <ChipField label={f('hasTexts')} value={formData.hasTexts} />
      <ChipField label={f('hasImages')} value={formData.hasImages} />
      <ChipField label={f('seoImportant')} value={formData.seoImportant} />
      <ChipField label={f('hasDomain')} value={formData.hasDomain} />

      <SectionTitle>{t(STEP_META[5].titleKey)}</SectionTitle>
      <ChipField label={f('deadline')} value={formData.deadline} />
      <ChipField label={f('budget')} value={formData.budget} />
      <Field label={f('notes')} value={formData.notes} full />
    </div>
  );
};

export default BriefingFullView;
