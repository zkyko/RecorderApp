import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/theme-store';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-sm gap-2"
      title={theme === 'qa-studio-dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {theme === 'qa-studio-dark' ? (
        <>
          <Sun size={16} />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon size={16} />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;

