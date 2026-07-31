import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  actionText = 'Continue Shopping',
  actionHref = '/products'
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [-5, 5, -5] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-24 h-24 rounded-full bg-surface-hover border border-border flex items-center justify-center text-text-muted mb-8 shadow-inner"
      >
        {/* We can clone the element to add consistent styling or just wrap it */}
        <div className="scale-150 opacity-50">
          {icon}
        </div>
      </motion.div>
      
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-2xl font-bold tracking-tight text-foreground mb-3"
      >
        {title}
      </motion.h3>
      
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-text-muted mb-8 max-w-sm mx-auto"
        >
          {description}
        </motion.p>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link 
          href={actionHref}
          className="inline-flex items-center justify-center px-8 py-3 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200"
        >
          {actionText}
        </Link>
      </motion.div>
    </div>
  );
};
