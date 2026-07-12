'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Mock processing delay
    setTimeout(() => {
      router.push('/checkout/success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pt-12 pb-32">
      <div className="container mx-auto px-4 max-w-4xl flex flex-col lg:flex-row gap-12">
        
        {/* Main Checkout Area */}
        <div className="w-full lg:w-3/5 flex flex-col">
          
          <div className="mb-10">
            <Link href="/cart" className="text-text-muted hover:text-foreground text-sm flex items-center gap-2 transition-colors mb-8">
              Back to Bag
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Checkout
            </h1>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-4 mb-12 text-sm">
            <span className={`font-medium ${step >= 1 ? 'text-foreground' : 'text-text-muted'}`}>Shipping</span>
            <ChevronRight className="w-4 h-4 text-border" />
            <span className={`font-medium ${step >= 2 ? 'text-foreground' : 'text-text-muted'}`}>Payment</span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleNext}
                className="flex flex-col gap-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="First Name" required className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                  <input type="text" placeholder="Last Name" required className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                </div>
                <input type="email" placeholder="Email Address" required className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                <input type="text" placeholder="Address" required className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                <div className="grid grid-cols-3 gap-4">
                  <input type="text" placeholder="City" required className="col-span-2 bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                  <input type="text" placeholder="Zip" required className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                </div>
                
                <button type="submit" className="mt-4 w-full py-4 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200">
                  Continue to Payment
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handlePayment}
                className="flex flex-col gap-6"
              >
                <div className="p-4 bg-surface rounded-md border border-border mb-4">
                  <p className="text-sm text-text-muted mb-1">Contact</p>
                  <p className="text-sm text-foreground">user@example.com</p>
                  <div className="w-full h-px bg-border my-4" />
                  <p className="text-sm text-text-muted mb-1">Ship to</p>
                  <p className="text-sm text-foreground">123 Engineered St, City, 12345</p>
                </div>

                <h2 className="text-xl font-semibold mt-4 mb-2">Payment Details</h2>
                
                {/* Mock Card Input */}
                <input type="text" placeholder="Card Number" required className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="MM / YY" required className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                  <input type="text" placeholder="CVC" required className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                </div>

                {/* Apple Pay mock button */}
                <div className="w-full py-3 bg-[#1a1a1a] border border-[#2a2a2a] text-foreground font-medium rounded-full flex items-center justify-center mt-2 cursor-pointer hover:bg-[#232323] transition-colors">
                  Pay with Apple Pay
                </div>

                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="mt-4 w-full py-4 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200 disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center h-[56px]"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Pay $448.00'
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-2/5 mt-12 lg:mt-24">
          <div className="bg-surface rounded-xl border border-border p-6 flex flex-col gap-6 sticky top-24">
            <h3 className="text-lg font-medium text-foreground">Order Summary</h3>
            
            <div className="flex gap-4">
               <div className="w-16 h-16 bg-surface-hover rounded flex-shrink-0 flex items-center justify-center border border-border relative">
                  <span className="absolute -top-2 -right-2 bg-text-muted text-background text-[10px] w-5 h-5 rounded-full flex items-center justify-center">1</span>
               </div>
               <div className="flex-grow flex justify-between">
                 <div>
                   <p className="text-sm text-foreground">Matte Keyboard 1</p>
                   <p className="text-xs text-text-muted">Matte Black</p>
                 </div>
                 <p className="text-sm font-medium">$249.00</p>
               </div>
            </div>

            <div className="flex gap-4">
               <div className="w-16 h-16 bg-surface-hover rounded flex-shrink-0 flex items-center justify-center border border-border relative">
                  <span className="absolute -top-2 -right-2 bg-text-muted text-background text-[10px] w-5 h-5 rounded-full flex items-center justify-center">2</span>
               </div>
               <div className="flex-grow flex justify-between">
                 <div>
                   <p className="text-sm text-foreground">Ceramic Earbuds</p>
                   <p className="text-xs text-text-muted">Sage</p>
                 </div>
                 <p className="text-sm font-medium">$199.00</p>
               </div>
            </div>
            
            <div className="w-full h-px bg-border" />
            
            <div className="flex justify-between text-text-muted text-sm">
              <span>Subtotal</span>
              <span>$448.00</span>
            </div>
            <div className="flex justify-between text-text-muted text-sm">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between text-foreground text-lg font-medium pt-2 border-t border-border">
              <span>Total</span>
              <span>$448.00</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
