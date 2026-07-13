// src/components/common/LanguageToggle.tsx
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const LANGS = ['de', 'en'] as const;

const LanguageToggle = () => {
  const { i18n, t } = useTranslation('common');
  const current = i18n.language?.startsWith('en') ? 'en' : 'de';

  return (
    <div className="flex items-center rounded-lg border border-border overflow-hidden shrink-0" aria-label={t('language.switchLabel')}>
      {LANGS.map(lang => (
        <button
          key={lang}
          type="button"
          onClick={() => i18n.changeLanguage(lang)}
          title={t(`language.${lang}`)}
          className={cn(
            'px-2 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
            current === lang
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
