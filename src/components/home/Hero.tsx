'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button, WeightHeadline, RotatingBadge } from '@/components/ui';
import SpinningBrandCard from './SpinningBrandCard';

export default function Hero() {
  const router = useRouter();
  const [entranceComplete, setEntranceComplete] = useState(false);
  
  // Set target date for 12 hours from now for the demo
  const targetDate = new Date();
  targetDate.setHours(targetDate.getHours() + 12);

  return (
    <section className="relative min-h-[calc(100vh-140px)] py-8 md:py-12 w-full flex flex-col justify-center items-center bg-background">
      {/* Background layer */}
      <div className="absolute inset-0 z-0" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 items-center text-center md:text-left px-6 max-w-6xl w-full gap-8 lg:gap-12 pb-14 pt-2">
        
        {/* Left side: Text & CTAs */}
        <div className="flex flex-col items-center md:items-start md:col-span-7 lg:col-span-8 w-full max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() => setEntranceComplete(true)}
            className="mb-6 flex flex-col items-center md:items-start w-full"
          >
            <WeightHeadline
              as="h1"
              entranceComplete={entranceComplete}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08]"
            >
              Engineered for the Obsessive.
            </WeightHeadline>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-text-muted mb-8 max-w-xl font-light leading-relaxed"
          >
            Tactile, restrained, and strictly matte. Experience a new standard of premium hardware designed without compromise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center md:items-start gap-5"
          >
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <Button 
                variant="primary" 
                onClick={() => router.push('/products?category=new')}
              >
                Shop the Collection
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => router.push('/about')}
              >
                Discover the Story
              </Button>
            </div>

            <div className="flex items-center justify-center md:justify-start pt-1">
              <Button 
                variant="promo" 
                promoTextTop="expires in..."
                targetDate={targetDate}
                onClick={() => router.push('/products?sale=true')}
              >
                Claim Launch Deal
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Right side: 3D Spinning Brand Card */}
        <div className="flex items-center justify-center md:col-span-5 lg:col-span-4 w-full mt-6 md:mt-0">
          <SpinningBrandCard size={210} />
        </div>

      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
      >
        <span className="text-[10px] text-text-muted uppercase tracking-widest font-medium">Scroll</span>
        <div className="w-[1px] h-8 bg-border overflow-hidden">
          <motion.div 
            animate={{ y: [0, 32, 32] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-full h-1/2 bg-text-muted"
          />
        </div>
      </motion.div>

      {/* Rotating Circular Trust Seal (Positioned bottom-right safely clearing the floating chat widget) */}
      <RotatingBadge
        preset="returns-30"
        entranceComplete={entranceComplete}
        corner="bottom-right"
      />

    </section>
  );
}
