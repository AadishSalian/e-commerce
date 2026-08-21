'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';

export function CartDrawer() {
  const { isCartOpen, closeCart, cartItems, updateQuantity, removeFromCart } = useCart();
  
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface border-l border-border z-[60] flex flex-col shadow-2xl pt-safe pb-safe"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Your Bag
              </h2>
              <button 
                onClick={closeCart}
                className="w-11 h-11 flex items-center justify-center hover:bg-surface-hover rounded-full transition-colors text-text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-muted gap-4">
                  <ShoppingBag className="w-12 h-12 opacity-20" />
                  <p>Your bag is empty.</p>
                  <button onClick={closeCart} className="text-foreground hover:text-accent underline underline-offset-4 mt-4">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.cartId} className="relative overflow-hidden rounded-lg group">
                    {/* Background Delete Button */}
                    <div className="absolute inset-0 bg-red-500 rounded-lg flex items-center justify-end pr-4">
                      <button 
                        onClick={() => removeFromCart(item.cartId)} 
                        className="text-white w-11 h-11 flex items-center justify-center bg-transparent"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <motion.div 
                      drag="x"
                      dragConstraints={{ left: -80, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(e, info) => {
                        if (info.offset.x < -60) {
                          removeFromCart(item.cartId);
                        }
                      }}
                      className="flex gap-4 relative z-10 bg-surface touch-pan-y h-full"
                    >
                      <div className="w-20 h-20 bg-surface-hover rounded-lg flex-shrink-0 border border-border relative overflow-hidden">
                        <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex flex-col flex-grow justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            {item.selectedVariant && (
                              <p className="text-xs text-text-muted mt-0.5">{item.selectedVariant}</p>
                            )}
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.cartId)}
                            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 hidden md:flex"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-end mt-2">
                          <div className="flex items-center bg-background rounded-full border border-border overflow-hidden h-11">
                            <button 
                              onClick={() => updateQuantity(item.cartId, -1)}
                              className="w-11 h-11 flex items-center justify-center text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.cartId, 1)}
                              className="w-11 h-11 flex items-center justify-center text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-border bg-background">
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <Link 
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full flex justify-center py-4 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200"
                >
                  Checkout
                </Link>
                <Link 
                  href="/cart"
                  onClick={closeCart}
                  className="w-full flex justify-center py-4 mt-2 bg-transparent text-foreground font-medium rounded-full hover:bg-surface transition-colors duration-200"
                >
                  View Full Bag
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
