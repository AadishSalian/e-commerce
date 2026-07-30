'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CreditCard, MapPin, UserCheck, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSavedInfo, setUseSavedInfo] = useState(true);
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal; // Assuming free shipping

  useEffect(() => {
    // If logged in, skip straight to payment (express checkout)
    if (isLoggedIn && useSavedInfo) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [isLoggedIn, useSavedInfo]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Mock processing delay
    setTimeout(() => {
      clearCart();
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Checkout
              {isLoggedIn && <span className="text-xs font-semibold px-2.5 py-1 bg-[#8ed500]/10 text-[#8ed500] rounded-full flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5"/> Secure Express</span>}
            </h1>
          </div>

          {/* Progress Indicator */}
          {!isLoggedIn && (
            <div className="flex items-center gap-4 mb-12 text-sm">
              <span className={`font-medium ${step >= 1 ? 'text-foreground' : 'text-text-muted'}`}>Shipping</span>
              <ChevronRight className="w-4 h-4 text-border" />
              <span className={`font-medium ${step >= 2 ? 'text-foreground' : 'text-text-muted'}`}>Payment</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && !isLoggedIn && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-8"
              >
                {/* Account Notice */}
                <div className="p-4 bg-surface-active rounded-xl border border-border flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-sm">Already have an account?</h3>
                    <p className="text-xs text-text-muted mt-1">Log in for faster checkout with saved details.</p>
                  </div>
                  <Link href="/login?redirect=/checkout" className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors">
                    Log in
                  </Link>
                </div>

                <form onSubmit={handleNext} className="flex flex-col gap-6">
                  <h2 className="text-xl font-semibold">Guest Checkout</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="First Name" required className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
                    <input type="text" placeholder="Last Name" required className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
                  </div>
                  <input type="email" placeholder="Email Address" required className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
                  <input type="text" placeholder="Address" required className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
                  <div className="grid grid-cols-3 gap-4">
                    <input type="text" placeholder="City" required className="col-span-2 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
                    <input type="text" placeholder="Zip" required className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
                  </div>
                  
                  <label className="flex items-center gap-3 mt-2 cursor-pointer group w-fit">
                    <input type="checkbox" className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent" />
                    <span className="text-sm text-text-muted group-hover:text-foreground transition-colors">Save this information for next time</span>
                  </label>

                  <button type="submit" className="mt-4 w-full py-4 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200">
                    Continue to Payment
                  </button>
                </form>
              </motion.div>
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
                {isLoggedIn && useSavedInfo ? (
                  <div className="flex flex-col gap-4 mb-4">
                    <h2 className="text-xl font-semibold mb-2">Express Checkout</h2>
                    
                    <div className="p-5 bg-surface rounded-xl border border-border flex items-start gap-4 hover:border-accent/50 transition-colors cursor-pointer">
                      <div className="p-2 bg-surface-active rounded-full shrink-0">
                        <MapPin className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-semibold text-sm">Saved Address</p>
                          <span className="text-xs text-accent">Default</span>
                        </div>
                        <p className="text-sm text-text-muted">{user?.name}</p>
                        <p className="text-sm text-text-muted">123 Design Avenue, Apt 4B</p>
                        <p className="text-sm text-text-muted">New York, NY 10001</p>
                      </div>
                    </div>

                    <div className="p-5 bg-surface rounded-xl border border-border flex items-start gap-4 hover:border-accent/50 transition-colors cursor-pointer">
                      <div className="p-2 bg-surface-active rounded-full shrink-0">
                        <CreditCard className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-semibold text-sm">Saved Payment</p>
                          <span className="text-xs text-accent">Default</span>
                        </div>
                        <p className="text-sm text-text-muted">Visa ending in 4242</p>
                        <p className="text-xs text-text-muted mt-1">Expires 12/28</p>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => setUseSavedInfo(false)}
                      className="text-sm text-text-muted hover:text-foreground text-left mt-2 underline underline-offset-4"
                    >
                      Use a different address or payment method
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-5 bg-surface rounded-xl border border-border mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-text-muted">Contact</p>
                        <p className="text-sm text-foreground font-medium">{isLoggedIn ? user?.email : 'user@example.com'}</p>
                        {!isLoggedIn && <button type="button" onClick={() => setStep(1)} className="text-xs text-accent">Change</button>}
                      </div>
                      <div className="w-full h-px bg-border mb-4" />
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-text-muted">Ship to</p>
                        <p className="text-sm text-foreground font-medium truncate max-w-[200px]">123 Engineered St, City, 12345</p>
                        {!isLoggedIn && <button type="button" onClick={() => setStep(1)} className="text-xs text-accent">Change</button>}
                      </div>
                    </div>

                    <h2 className="text-xl font-semibold mt-4 mb-2">Payment Details</h2>
                    
                    {/* Mock Card Input */}
                    <input type="text" placeholder="Card Number" required className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="MM / YY" required className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
                      <input type="text" placeholder="CVC" required className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
                    </div>

                    {isLoggedIn && !useSavedInfo && (
                      <button 
                        type="button" 
                        onClick={() => setUseSavedInfo(true)}
                        className="text-sm text-text-muted hover:text-foreground text-left mt-2 underline underline-offset-4"
                      >
                        Back to Express Checkout
                      </button>
                    )}
                  </>
                )}

                {/* Apple Pay mock button */}
                {!isLoggedIn && (
                  <div className="w-full py-3 bg-[#1a1a1a] border border-[#2a2a2a] text-foreground font-medium rounded-full flex items-center justify-center mt-2 cursor-pointer hover:bg-[#232323] transition-colors">
                    Pay with Apple Pay
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="mt-6 w-full py-4 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200 disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center h-[56px] shadow-lg shadow-foreground/10"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  ) : (
                    `Place Order • $${total.toFixed(2)}`
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
            
            {cartItems.map(item => (
              <div key={item.cartId} className="flex gap-4">
                 <div className="w-16 h-16 bg-surface-hover rounded flex-shrink-0 flex items-center justify-center border border-border relative overflow-hidden">
                    <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 bg-text-muted text-background text-[10px] w-5 h-5 rounded-full flex items-center justify-center z-10">{item.quantity}</span>
                 </div>
                 <div className="flex-grow flex justify-between">
                   <div>
                     <p className="text-sm text-foreground font-medium">{item.name}</p>
                     {item.selectedVariant && <p className="text-xs text-text-muted mt-0.5">{item.selectedVariant}</p>}
                   </div>
                   <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                 </div>
              </div>
            ))}
            
            <div className="w-full h-px bg-border" />
            
            <div className="flex justify-between text-text-muted text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-muted text-sm">
              <span>Shipping</span>
              <span className="text-foreground font-medium">Free</span>
            </div>
            <div className="flex justify-between text-foreground text-lg font-bold pt-4 border-t border-border mt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
