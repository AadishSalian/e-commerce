'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { PrimaryButton, SecondaryButton, PromoButton, SalesCard } from '@/components/ui';
import SpinningBrandCard from './SpinningBrandCard';

export default function Hero() {
  const router = useRouter();
  
  // Set target date for 12 hours from now for the demo
  const targetDate = new Date();
  targetDate.setHours(targetDate.getHours() + 12);

  return (
    <section className="relative h-[90vh] w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Background layer */}
      <div className="absolute inset-0 z-0" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between text-center md:text-left px-4 max-w-6xl w-full gap-12 md:gap-8 pt-16 md:pt-20">
        
        {/* Mobile: Spinning Card Above Text */}
        <div className="block md:hidden mt-8">
          <SpinningBrandCard size={150} />
        </div>

        {/* Left side: Text & CTAs */}
        <div className="flex flex-col items-center md:items-start flex-1 max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6"
          >
            Engineered for the Obsessive.
          </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-text-muted mb-10 max-w-2xl"
        >
          Tactile, restrained, and strictly matte. Experience a new standard of premium hardware designed without compromise.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col items-center md:items-start"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 mb-12">
            <PrimaryButton 
              onClick={() => router.push('/products?category=new')}
            >
              Shop the Collection
            </PrimaryButton>
            <SecondaryButton 
              onClick={() => router.push('/about')}
            >
              Discover the Story
            </SecondaryButton>
          </div>

          <div className="flex flex-col items-center md:items-start gap-6 w-full max-w-[320px]">
            <PromoButton 
              label="Claim Launch Deal"
              topText="expires in..."
              targetDate={targetDate}
              onClick={() => router.push('/products')}
            />
            <div className="w-full">
              <SalesCard />
            </div>
          </div>
        </motion.div>
        </div>

        {/* Right side: Desktop Spinning Card */}
        <div className="hidden md:flex flex-shrink-0 items-center justify-center pl-8">
          <SpinningBrandCard size={260} />
        </div>

      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-text-muted uppercase tracking-widest">Scroll</span>
        <div className="w-[1px] h-12 bg-border overflow-hidden">
          <motion.div 
            animate={{ y: [0, 48, 48] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-full h-1/2 bg-text-muted"
          />
        </div>
      </motion.div>

    </section>
  );
}
