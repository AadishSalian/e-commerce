'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HandwrittenAnnotationProps {
  text: string;
  className?: string;
  rotation?: number;
  lineDirection?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  delay?: number;
}

export function HandwrittenAnnotation({ 
  text, 
  className = "", 
  rotation = -5, 
  lineDirection = 'bottom-left',
  delay = 0.5
}: HandwrittenAnnotationProps) {
  
  const renderLine = () => {
    switch(lineDirection) {
      case 'bottom-left':
        return (
          <svg className="absolute -bottom-8 -left-8 w-12 h-12 text-accent" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              d="M45 5 Q 25 15 5 45" 
              stroke="currentColor" 
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: delay + 0.3 }}
            />
          </svg>
        );
      case 'top-right':
        return (
          <svg className="absolute -top-10 -right-10 w-16 h-16 text-accent" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              d="M5 55 Q 35 45 55 5" 
              stroke="currentColor" 
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: delay + 0.3 }}
            />
          </svg>
        );
      case 'bottom-right':
        return (
          <svg className="absolute -bottom-12 -right-8 w-16 h-16 text-accent" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              d="M5 5 Q 35 25 55 55" 
              stroke="currentColor" 
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: delay + 0.3 }}
            />
          </svg>
        );
      case 'top-left':
      default:
        return (
          <svg className="absolute -top-10 -left-12 w-16 h-16 text-accent" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              d="M55 55 Q 25 35 5 5" 
              stroke="currentColor" 
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: delay + 0.3 }}
            />
          </svg>
        );
    }
  };

  return (
    <motion.div 
      className={`absolute ${className}`}
      initial={{ opacity: 0, scale: 0.9, rotate: 0 }}
      whileInView={{ opacity: 1, scale: 1, rotate: rotation }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      style={{ zIndex: 50 }}
    >
      <span 
        className="font-serif italic text-accent opacity-80 whitespace-nowrap block bg-background/40 backdrop-blur-sm px-2 py-1 rounded-sm"
        style={{ fontSize: 'clamp(0.8rem, 1.2vw, 1rem)', letterSpacing: '0.05em' }}
      >
        {text}
      </span>
      {renderLine()}
    </motion.div>
  );
}
