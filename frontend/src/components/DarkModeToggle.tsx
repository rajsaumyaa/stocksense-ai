import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

export const DarkModeToggle: React.FC = () => {
  const [isDark, toggleDarkMode] = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-xl bg-white/50 dark:bg-zinc-900/50 hover:bg-white/80 dark:hover:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all duration-200"
      aria-label="Toggle Dark Mode"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-500 animate-pulse" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-600" />
      )}
    </button>
  );
};

export default DarkModeToggle;
