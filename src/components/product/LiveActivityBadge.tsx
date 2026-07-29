'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ShoppingBag } from 'lucide-react';
import { getLiveActivityMetrics } from '@/lib/mockSocialProof';

interface Props {
  productId: string;
}

export default function LiveActivityBadge({ productId }: Props) {
  const [metrics, setMetrics] = useState<{ viewers: number; purchasedToday: number } | null>(null);
  const [displayMode, setDisplayMode] = useState<'viewers' | 'purchases'>('viewers');

  useEffect(() => {
    // Load metrics
    setMetrics(getLiveActivityMetrics(productId));
    
    // Periodically swap between "viewers" and "purchases" if purchasedToday > 0
    const interval = setInterval(() => {
      setDisplayMode(prev => prev === 'viewers' ? 'purchases' : 'viewers');
    }, 8000);
    
    return () => clearInterval(interval);
  }, [productId]);

  if (!metrics) return null;

  // If no purchases today, always show viewers
  const showPurchases = displayMode === 'purchases' && metrics.purchasedToday > 0;

  return (
    <div className="h-8 flex items-center overflow-hidden my-4">
      <AnimatePresence mode="wait">
        {showPurchases ? (
          <motion.div
            key="purchases"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-full text-xs font-medium"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Purchased {metrics.purchasedToday} times in the last 24 hours
          </motion.div>
        ) : (
          <motion.div
            key="viewers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-text-muted text-sm font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <Eye className="w-4 h-4" />
            {metrics.viewers} people are viewing this right now
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
