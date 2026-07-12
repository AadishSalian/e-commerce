'use client';

import { MOCK_PRODUCTS } from '@/lib/mockData';
import Link from 'next/link';
import { Minus, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Mock Cart Items
const initialCart = [
  { ...MOCK_PRODUCTS[0], cartId: 'c1', quantity: 1, selectedVariant: 'Matte Black' },
  { ...MOCK_PRODUCTS[1], cartId: 'c2', quantity: 2, selectedVariant: 'Sage' },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState(initialCart);

  const removeItem = (cartId: string) => {
    setCartItems(cartItems.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCartItems(cartItems.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 0 : 0; // Free shipping for premium brand
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-4 max-w-3xl">
        
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-12">
          Your Bag.
        </h1>

        <div className="flex flex-col gap-8">
          
          {/* Cart Items List */}
          <div className="flex flex-col border-t border-border">
            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.div 
                  key={item.cartId}
                  layout
                  initial={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3 }}
                  className="flex py-8 border-b border-border gap-6 relative"
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-surface rounded-lg flex-shrink-0 flex items-center justify-center border border-border">
                    <span className="text-[10px] text-text-muted uppercase">Image</span>
                  </div>
                  
                  <div className="flex flex-col flex-grow justify-between">
                    <div className="flex justify-between items-start pr-8">
                      <div>
                        <Link href={`/products/${item.id}`} className="text-lg font-medium text-foreground hover:text-accent transition-colors">
                          {item.name}
                        </Link>
                        {item.selectedVariant && (
                          <p className="text-sm text-text-muted mt-1">{item.selectedVariant}</p>
                        )}
                      </div>
                      <p className="text-foreground font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-6 mt-4">
                      {/* Quantity Editor */}
                      <div className="flex items-center gap-4 bg-surface rounded-full px-3 py-1 border border-border">
                        <button 
                          onClick={() => updateQuantity(item.cartId, -1)}
                          className="text-text-muted hover:text-foreground transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.cartId, 1)}
                          className="text-text-muted hover:text-foreground transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => removeItem(item.cartId)}
                    className="absolute top-8 right-0 text-text-muted hover:text-foreground transition-colors p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {cartItems.length === 0 && (
              <div className="py-12 text-center text-text-muted">
                Your bag is empty.
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="w-full pt-8 flex flex-col items-end">
              <div className="w-full md:w-1/2 flex flex-col gap-4 mb-8">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-foreground text-xl font-medium pt-4 border-t border-border">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Link 
                href="/checkout"
                className="w-full md:w-1/2 py-4 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200 text-center"
              >
                Proceed to Checkout
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
