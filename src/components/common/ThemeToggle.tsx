// src/components/common/ThemeToggle.tsx
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation('common');
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 shrink-0"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};

export default ThemeToggle;
