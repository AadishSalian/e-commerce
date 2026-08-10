'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { PrimaryButton } from '@/components/ui';

type SizeFitQuizProps = {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
};

export default function SizeFitQuiz({ isOpen, onClose, productName }: SizeFitQuizProps) {
  const [step, setStep] = useState(1);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fitPreference, setFitPreference] = useState('');
  
  const handleNext = () => setStep(s => s + 1);
  const handleReset = () => {
    setStep(1);
    setHeight('');
    setWeight('');
    setFitPreference('');
    onClose();
  };

  const getRecommendation = () => {
    if (!height || !weight || !fitPreference) return 'Medium'; // default fallback
    const h = parseInt(height);
    const w = parseInt(weight);
    
    if (h > 180 && w > 80) return fitPreference === 'Oversized' ? 'X-Large' : 'Large';
    if (h > 170 && w > 70) return fitPreference === 'Tight' ? 'Medium' : 'Large';
    if (h < 160) return fitPreference === 'Oversized' ? 'Medium' : 'Small';
    
    return fitPreference === 'Oversized' ? 'Large' : 'Medium';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="relative bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col min-h-[400px]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-foreground z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8 flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Step 1 of 3</p>
                  <h3 className="text-2xl font-bold text-foreground">Tell us about your build.</h3>
                  <p className="text-sm text-text-muted mt-2">This helps us calculate your baseline size.</p>
                </div>
                
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Height (cm)</label>
                    <input 
                      type="number" 
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 175"
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 70"
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                
                <PrimaryButton 
                  onClick={handleNext} 
                  disabled={!height || !weight}
                  className="w-full mt-6"
                >
                  Next
                </PrimaryButton>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Step 2 of 3</p>
                  <h3 className="text-2xl font-bold text-foreground">How do you like it to fit?</h3>
                </div>
                
                <div className="space-y-3 flex-1">
                  {['Tight', 'Regular', 'Oversized'].map(fit => (
                    <button
                      key={fit}
                      onClick={() => setFitPreference(fit)}
                      className={`w-full text-left px-5 py-4 rounded-xl border flex items-center justify-between transition-all ${
                        fitPreference === fit 
                          ? 'border-accent bg-accent/5 text-foreground' 
                          : 'border-border text-text-muted hover:border-foreground/30 hover:text-foreground'
                      }`}
                    >
                      <span className="font-medium">{fit}</span>
                      {fitPreference === fit && <Check className="w-5 h-5 text-accent" />}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setStep(1)}
                    className="px-6 py-3 rounded-full border border-border text-sm font-medium hover:bg-surface-hover transition-colors"
                  >
                    Back
                  </button>
                  <PrimaryButton 
                    onClick={handleNext} 
                    disabled={!fitPreference}
                    className="flex-1"
                  >
                    Find My Size
                  </PrimaryButton>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-6"
              >
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                  <Check className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">We found your fit.</h3>
                <p className="text-text-muted mb-8">
                  Based on your build and preference, we recommend taking a size:
                </p>
                <div className="text-4xl font-bold text-foreground mb-8 py-4 px-12 border-2 border-foreground rounded-2xl">
                  {getRecommendation()}
                </div>
                
                <PrimaryButton 
                  onClick={handleReset}
                  className="w-full"
                >
                  Done
                </PrimaryButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
