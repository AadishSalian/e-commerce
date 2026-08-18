'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type Section = {
  id: string;
  label: string;
};

const SECTIONS: Section[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Details' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'qna', label: 'Q&A' },
  { id: 'related', label: 'Related' }
];

export default function InPageNavigation() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      // Offset for sticky header
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-4">
      {SECTIONS.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className="group relative flex items-center"
            aria-label={`Jump to ${section.label}`}
          >
            <div className="flex items-center">
              <span 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive ? 'bg-accent scale-150' : 'bg-border group-hover:bg-text-muted group-hover:scale-125'}`}
              />
              <span 
                className={`absolute left-6 text-xs font-medium whitespace-nowrap transition-all duration-300 ${isActive ? 'text-foreground opacity-100 translate-x-0 font-bold' : 'text-text-muted opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}
              >
                {section.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
