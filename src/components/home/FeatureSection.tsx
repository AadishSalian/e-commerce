'use client';

import { motion } from 'framer-motion';

interface FeatureProps {
  title: string;
  description: string;
  imageAlt: string;
  reverse?: boolean;
  matteVariant?: 'default' | 'elevated' | 'deep';
}

export default function FeatureSection({ 
  title, 
  description, 
  imageAlt, 
  reverse = false,
  matteVariant = 'default' 
}: FeatureProps) {
  
  const getBgClass = () => {
    switch(matteVariant) {
      case 'elevated': return 'bg-surface';
      case 'deep': return 'bg-[#0a0a0a]';
      default: return 'bg-background';
    }
  };

  return (
    <section className={`w-full py-24 md:py-32 ${getBgClass()} transition-colors duration-500`}>
      <div className="container mx-auto px-4 md:px-8">
        <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-20`}>
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 space-y-6"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-lg text-text-muted leading-relaxed">
              {description}
            </p>
          </motion.div>

          {/* Image Placeholder */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full aspect-square md:aspect-[4/3] bg-surface-hover rounded-xl flex items-center justify-center relative overflow-hidden"
          >
            {/* Soft matte placeholder without shadows */}
            <div className="absolute inset-0 bg-surface-active opacity-50" />
            <span className="relative z-10 text-text-muted text-sm font-medium tracking-widest uppercase">
              {imageAlt}
            </span>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
