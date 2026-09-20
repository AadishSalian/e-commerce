'use client';

import React, { useEffect } from 'react';
import { useThemeStore, Theme } from '@/store/useThemeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const setThemeState = useThemeStore(state => state.setThemeState);
  const setTheme = useThemeStore(state => state.setTheme);

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') as Theme | null;
    if (currentTheme === 'light' || currentTheme === 'dark') {
      setThemeState(currentTheme);
    }
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue as Theme;
        if (newTheme === 'dark' || newTheme === 'light') {
          // pass false equivalent to not save in local storage twice, but our store expects simple call
          // To mimic applyTheme(newTheme, false), we just set state and attribute
          setThemeState(newTheme);
          document.documentElement.setAttribute('data-theme', newTheme);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [setThemeState]);

  return <>{children}</>;
}

export const useTheme = () => {
  return useThemeStore();
};
