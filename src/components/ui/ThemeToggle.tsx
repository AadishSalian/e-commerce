'use client';

import React, { useEffect, useState, useRef } from 'react';
import './ThemeToggle.css';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);
  const isTransitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
    if (currentTheme === 'light' || currentTheme === 'dark') {
      setTheme(currentTheme);
    }
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue as 'dark' | 'light';
        if (newTheme === 'dark' || newTheme === 'light') {
          applyTheme(newTheme, false); 
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const applyTheme = (newTheme: 'dark' | 'light', save: boolean = true) => {
    if (isTransitioningRef.current) return;
    
    isTransitioningRef.current = true;
    document.documentElement.classList.add('theme-transitioning');
    
    setTheme(newTheme);
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

  const toggleTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyTheme(e.target.checked ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <div className="theme-toggle-switch" style={{ opacity: 0 }} aria-hidden="true">
        <div className="theme-switch-label"></div>
      </div>
    );
  }

  return (
    <div className="theme-toggle-switch">
      <label className="theme-switch-label" aria-label="Toggle dark and light mode">
        <input 
          type="checkbox" 
          className="theme-checkbox" 
          checked={theme === 'light'} 
          onChange={toggleTheme}
          aria-label="Toggle dark and light mode"
        />
        <span className="theme-slider"></span>
      </label>
    </div>
  );
};
