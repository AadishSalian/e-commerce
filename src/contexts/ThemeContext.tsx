'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const isTransitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const applyTheme = (newTheme: Theme, save: boolean = true) => {
    if (isTransitioningRef.current) return;
    
    isTransitioningRef.current = true;
    document.documentElement.classList.add('theme-transitioning');
    
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    if (save) {
      localStorage.setItem('theme', newTheme);
    }
    
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      isTransitioningRef.current = false;
    }, 300);
  };

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') as Theme | null;
    if (currentTheme === 'light' || currentTheme === 'dark') {
      setThemeState(currentTheme);
    }
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue as Theme;
        if (newTheme === 'dark' || newTheme === 'light') {
          applyTheme(newTheme, false);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setTheme = (newTheme: Theme) => applyTheme(newTheme, true);
  const toggleTheme = () => applyTheme(theme === 'dark' ? 'light' : 'dark', true);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
