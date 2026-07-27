'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

export function CustomSelect({ value, options, onChange, variant = 'pill', className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];
  const isUnderline = variant === 'underline';

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-40'} ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full transition-all ${
          isUnderline 
            ? 'bg-transparent border-b border-border text-foreground text-sm font-bold uppercase tracking-wider px-2 py-2 focus:border-accent hover:border-accent'
            : 'bg-surface border border-border text-foreground text-sm font-medium px-4 py-3 rounded-full focus:border-accent focus:ring-1 focus:ring-accent hover:border-accent'
        } ${isOpen && isUnderline ? 'border-accent' : ''}`}
      >
        <span className="truncate pr-4">{selectedOption?.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-full z-50 mt-2 w-max min-w-[calc(100%+1rem)] rounded-2xl border border-border/50 bg-background/90 backdrop-blur-xl shadow-2xl overflow-hidden ${
              isUnderline ? 'left-0' : '-left-2'
            }`}
          >
            <div className="py-2 max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                    value === option.value
                      ? 'bg-accent/10 text-accent font-semibold'
                      : 'text-foreground hover:bg-surface hover:text-accent'
                  } ${isUnderline ? 'uppercase tracking-wider font-bold text-xs' : ''}`}
                >
                  {option.label}
                  {value === option.value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
