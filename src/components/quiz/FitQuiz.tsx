'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';

type QuizStep = {
  question: string;
  options: { label: string; value: string }[];
};

const QUIZ_STEPS: QuizStep[] = [
  {
    question: "What are you looking for today?",
    options: [
      { label: "Tops & Shirts", value: "tops" },
      { label: "Bottoms & Pants", value: "bottoms" },
      { label: "Outerwear & Jackets", value: "outerwear" },
      { label: "Accessories", value: "accessories" }
    ]
  },
  {
    question: "How do you prefer your fit?",
    options: [
      { label: "Slim & Tailored", value: "slim" },
      { label: "Regular & Classic", value: "regular" },
      { label: "Oversized & Relaxed", value: "oversized" }
    ]
  },
  {
    question: "What is your typical size?",
    options: [
      { label: "Small (S)", value: "s" },
      { label: "Medium (M)", value: "m" },
      { label: "Large (L)", value: "l" },
      { label: "Extra Large (XL)", value: "xl" }
    ]
  }
];

export function FitQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  const handleSelect = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentStep]: value }));
    
    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentStep < QUIZ_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 400);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setIsFinished(false);
  };

  // Mock recommendation logic based on answers
  const getRecommendations = () => {
    const categoryFilter = answers[0]; // tops, bottoms, outerwear, accessories
    // Just returning some mock products for the demo
    let recommended = MOCK_PRODUCTS.filter(p => p.category === 'Fashion' || p.category === 'Accessories');
    
    // Add some pseudo-filtering just to make it look like it's working
    if (categoryFilter === 'tops') {
      recommended = recommended.filter(p => p.name.toLowerCase().includes('shirt') || p.name.toLowerCase().includes('knit'));
    } else if (categoryFilter === 'bottoms') {
      recommended = recommended.filter(p => p.name.toLowerCase().includes('trouser') || p.name.toLowerCase().includes('pant'));
    } else if (categoryFilter === 'outerwear') {
      recommended = recommended.filter(p => p.name.toLowerCase().includes('jacket') || p.name.toLowerCase().includes('coat') || p.name.toLowerCase().includes('blazer'));
    }

    return recommended.slice(0, 3);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface rounded-[2rem] border border-border p-8 md:p-12 shadow-sm min-h-[400px] flex flex-col relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-8">
              <span className="text-sm font-bold uppercase tracking-widest text-text-muted mb-2 block">
                Step {currentStep + 1} of {QUIZ_STEPS.length}
              </span>
              <h2 className="text-3xl font-bold text-foreground">
                {QUIZ_STEPS[currentStep].question}
              </h2>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              {QUIZ_STEPS[currentStep].options.map((option) => {
                const isSelected = answers[currentStep] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`px-6 py-4 rounded-xl text-left font-medium transition-all duration-200 border ${
                      isSelected 
                        ? 'bg-foreground text-background border-foreground scale-[0.98]' 
                        : 'bg-background text-foreground border-border hover:border-foreground/30 hover:bg-surface-hover'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-1 bg-background rounded-full mt-8 overflow-hidden">
              <div 
                className="h-full bg-foreground transition-all duration-500 ease-out"
                style={{ width: `${((currentStep) / QUIZ_STEPS.length) * 100}%` }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col h-full"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-4">Your Perfect Fits</h2>
              <p className="text-text-muted">
                Based on your preferences, we think you'll love these pieces.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {getRecommendations().map(product => (
                <Link href={`/products/${product.id}`} key={product.id} className="group flex flex-col">
                  <div className="w-full aspect-[4/5] bg-muted rounded-xl mb-3 overflow-hidden relative">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-foreground truncate">{product.name}</h3>
                  <p className="text-sm text-text-muted">${product.price.toFixed(2)}</p>
                </Link>
              ))}
            </div>

            <div className="flex justify-center gap-4 mt-auto">
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-border text-foreground font-medium hover:bg-surface-hover transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Retake Quiz
              </button>
              <Link 
                href="/fashion"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
              >
                Shop All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
