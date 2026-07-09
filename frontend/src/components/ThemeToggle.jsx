import React from 'react';
import { Sun, Moon, Eye } from 'lucide-react';

export default function ThemeToggle({ theme, onChangeTheme }) {
  // We manage the theme by applying the matching class to the document tag
  const applyTheme = (t) => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'high-contrast');
    
    if (t === 'dark') {
      root.classList.add('dark');
    } else if (t === 'high-contrast') {
      root.classList.add('high-contrast');
    }
    onChangeTheme(t);
  };

  return (
    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg shadow-inner gap-0.5 border border-zinc-200 dark:border-zinc-700">
      <button
        onClick={() => applyTheme('light')}
        className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
          theme === 'light'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => applyTheme('dark')}
        className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
          theme === 'dark'
            ? 'bg-zinc-900 text-yellow-400 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => applyTheme('high-contrast')}
        className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
          theme === 'high-contrast'
            ? 'bg-black text-yellow-300 border border-yellow-300 shadow-sm'
            : 'text-zinc-500 hover:text-yellow-500'
        }`}
        title="High Contrast Mode"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );
}
