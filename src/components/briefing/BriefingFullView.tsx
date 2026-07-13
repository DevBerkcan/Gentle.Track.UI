// src/components/briefing/BriefingFullView.tsx
import type { UpsertBriefingDto } from '../../types';
import { Card, CardContent } from '@/components/ui/card';
import { QCard, STEP_META, toList } from './BriefingWizardForm';

interface BriefingFullViewProps {
  formData: UpsertBriefingDto;
}

const ReadOnlyText = ({ value }: { value?: string }) => (
  <p className="text-sm text-foreground whitespace-pre-wrap">
    {value?.trim() ? value : <span className="text-muted-foreground">–</span>}
  </p>
);

const ReadOnlyChips = ({ value }: { value?: string }) => {
  const items = toList(value);
  if (items.length === 0) return <p className="text-sm text-muted-foreground">–</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <span key={item} className="px-3 py-1.5 rounded-lg border border-primary bg-primary/10 text-primary text-xs font-medium">
          {item}
        </span>
      ))}
    </div>
  );
};

const BriefingFullView: React.FC<BriefingFullViewProps> = ({ formData }) => {
  return (
    <div className="space-y-5">
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{STEP_META[0].title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{STEP_META[0].subtitle}</p>
          </div>
          <div className="space-y-3">
            <QCard label="Wie heißt dein Unternehmen?"><ReadOnlyText value={formData.companyName} /></QCard>
            <QCard label="Was machst du?" hint="in einem Satz"><ReadOnlyText value={formData.businessDescription} /></QCard>
            <QCard label="Hast du bereits ein Logo?"><ReadOnlyChips value={formData.hasLogo} /></QCard>
            <QCard label="Gibt es bereits eine Website?"><ReadOnlyChips value={formData.hasExistingWebsite} /></QCard>
            {formData.hasExistingWebsite === 'Ja' && (
              <QCard label="Wie lautet die aktuelle Website-URL?"><ReadOnlyText value={formData.existingUrl} /></QCard>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{STEP_META[1].title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{STEP_META[1].subtitle}</p>
          </div>
          <div className="space-y-3">
            <QCard label="Was ist das Hauptziel?"><ReadOnlyChips value={formData.goals} /></QCard>
            <QCard label="Wer ist deine Zielgruppe?"><ReadOnlyChips value={formData.audience} /></QCard>
            <QCard label="In welcher Region bist du tätig?"><ReadOnlyChips value={formData.region} /></QCard>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{STEP_META[2].title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{STEP_META[2].subtitle}</p>
          </div>
          <div className="space-y-3">
            <QCard label="Welchen Stil magst du?"><ReadOnlyChips value={formData.style} /></QCard>
            <QCard label="Welche Farben gefallen dir?" hint="optional"><ReadOnlyText value={formData.colors} /></QCard>
            <QCard label="Hast du Website-Beispiele, die dir gefallen?"><ReadOnlyText value={formData.references} /></QCard>
            <QCard label="Animationen & Effekte?"><ReadOnlyChips value={formData.animations} /></QCard>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{STEP_META[3].title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{STEP_META[3].subtitle}</p>
          </div>
          <div className="space-y-3">
            <QCard label="Welche Seiten brauchst du?"><ReadOnlyChips value={formData.pages} /></QCard>
            <QCard label="Welche Funktionen brauchst du?"><ReadOnlyChips value={formData.features} /></QCard>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{STEP_META[4].title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{STEP_META[4].subtitle}</p>
          </div>
          <div className="space-y-3">
            <QCard label="Hast du bereits Texte für die Website?"><ReadOnlyChips value={formData.hasTexts} /></QCard>
            <QCard label="Hast du eigene Bilder / Fotos?"><ReadOnlyChips value={formData.hasImages} /></QCard>
            <QCard label="Ist SEO (Google-Optimierung) wichtig für dich?"><ReadOnlyChips value={formData.seoImportant} /></QCard>
            <QCard label="Hast du bereits eine Domain / Hosting?"><ReadOnlyChips value={formData.hasDomain} /></QCard>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{STEP_META[5].title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{STEP_META[5].subtitle}</p>
          </div>
          <div className="space-y-3">
            <QCard label="Wann soll die Website live gehen?"><ReadOnlyChips value={formData.deadline} /></QCard>
            <QCard label="Budget-Rahmen (ca.)?"><ReadOnlyChips value={formData.budget} /></QCard>
            <QCard label="Sonstige Wünsche oder Anmerkungen?"><ReadOnlyText value={formData.notes} /></QCard>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BriefingFullView;
