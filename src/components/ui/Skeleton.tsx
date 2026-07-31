"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 0.4 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
      className={`bg-surface-hover border border-border rounded-xl ${className}`}
    />
  );
};
