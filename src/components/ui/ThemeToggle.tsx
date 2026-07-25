'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import './ThemeToggle.css';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          onChange={() => toggleTheme()}
          aria-label="Toggle dark and light mode"
        />
        <span className="theme-slider"></span>
      </label>
    </div>
  );
};
