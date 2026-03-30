'use client';

import { useLanguage } from './LanguageProvider';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, Languages } from 'lucide-react';

export default function ThemeLanguageToggles() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const cycleLanguage = () => {
    if (language === 'zh-TW') setLanguage('en');
    else if (language === 'en') setLanguage('ja');
    else setLanguage('zh-TW');
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={cycleLanguage}
        className="p-2 rounded-full hover:bg-white/10 transition-colors text-[var(--text)]/70"
        title={t('lang.toggle')}
      >
        <Languages size={18} />
      </button>
      <button 
        onClick={toggleTheme}
        className="p-2 rounded-full hover:bg-white/10 transition-colors text-[var(--text)]/70"
        title={t('theme.toggle')}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
