import React, { useEffect, useState } from 'react';
import { setTheme, getTheme } from '@/lib/theme';

const ThemeToggle: React.FC = () => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(getTheme());

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  const handleToggle = () => {
    setThemeState(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="ml-4 px-2 py-1 rounded bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-900 transition-colors"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle; 