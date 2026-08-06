'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-surface-active rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 flex flex-col items-center text-center px-4"
      >
        <motion.h1 
          className="text-8xl md:text-[150px] font-bold tracking-tighter text-foreground mb-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          404
        </motion.h1>
        
        <motion.div 
          className="w-16 h-[1px] bg-border mb-8"
          initial={{ width: 0 }}
          animate={{ width: 64 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        />

        <motion.h2 
          className="text-2xl md:text-3xl font-medium tracking-tight text-foreground mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          Page Not Found
        </motion.h2>

        <motion.p 
          className="text-text-muted max-w-md mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          The page you're looking for doesn't exist or has been moved. Let's get you back to our collection.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          <Link 
            href="/" 
            className="px-8 py-4 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200"
          >
            Return to Homepage
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
