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

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="w-full aspect-[4/5] bg-surface rounded-xl border border-transparent mb-6 flex flex-col p-2 relative overflow-hidden">
      <Skeleton className="flex-1 w-full rounded-lg mb-4" />
      <div className="flex justify-between items-start mt-4">
        <div className="w-2/3">
          <Skeleton className="w-full h-5 mb-2" />
          <Skeleton className="w-1/2 h-4" />
        </div>
        <Skeleton className="w-1/4 h-6" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};
