'use client';

import { MOCK_PRODUCTS } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Package, User, Heart, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-4 lg:px-8 flex flex-col lg:flex-row gap-12">
        
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-1/4 flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Account</h1>
            <p className="text-text-muted">user@example.com</p>
          </div>

          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === 'orders' ? 'bg-surface text-foreground font-medium' : 'text-text-muted hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <Package className="w-5 h-5" /> Orders
            </button>
            <button 
              onClick={() => setActiveTab('wishlist')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === 'wishlist' ? 'bg-surface text-foreground font-medium' : 'text-text-muted hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <Heart className="w-5 h-5" /> Wishlist
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === 'profile' ? 'bg-surface text-foreground font-medium' : 'text-text-muted hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <User className="w-5 h-5" /> Profile Settings
            </button>
            <button 
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors text-left mt-8"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="w-full lg:w-3/4">
          
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Order History</h2>
              
              {/* Mock Order Card */}
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:gap-8">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Order Placed</p>
                      <p className="text-sm font-medium text-foreground">Oct 12, 2026</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total</p>
                      <p className="text-sm font-medium text-foreground">$448.00</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Order #</p>
                    <p className="text-sm font-medium text-foreground">ORD-938271</p>
                  </div>
                </div>

                {/* Tracking Bar */}
                <div className="px-6 pt-6">
                  <p className="text-sm font-medium text-foreground mb-4">Arriving Thursday</p>
                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-2/3 rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs text-text-muted mt-2">
                    <span>Ordered</span>
                    <span>Shipped</span>
                    <span>Delivered</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col sm:flex-row gap-6">
                  <div className="w-24 h-24 bg-surface-hover rounded-lg flex items-center justify-center border border-border shrink-0">
                    <span className="text-[10px] text-text-muted uppercase">Image</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <Link href={`/products/p-1`} className="text-lg font-medium text-foreground hover:text-accent transition-colors">Matte Keyboard 1</Link>
                    <p className="text-sm text-text-muted">Matte Black</p>
                  </div>
                  <div className="flex items-center">
                    <button className="px-4 py-2 border border-border bg-background text-foreground rounded-full text-sm font-medium hover:bg-surface-hover transition-colors">
                      View Item
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-8">Your Wishlist</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_PRODUCTS.slice(0, 3).map((product) => (
                  <Link href={`/products/${product.id}`} key={product.id} className="group block">
                    <div className="w-full aspect-[4/5] bg-surface rounded-xl border border-transparent group-hover:border-border transition-colors duration-300 mb-4 flex flex-col p-6 relative overflow-hidden">
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border z-10">
                        <Heart className="w-4 h-4 text-foreground fill-foreground" />
                      </div>
                      <div className="flex-1 w-full bg-surface-hover rounded-lg flex items-center justify-center">
                        <span className="text-xs text-text-muted uppercase tracking-widest">{product.name}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-foreground font-medium mb-1">{product.name}</h3>
                      <p className="text-foreground font-medium">${product.price.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <h2 className="text-2xl font-bold text-foreground mb-8">Profile Settings</h2>
              
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">First Name</label>
                    <input type="text" defaultValue="John" className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Last Name</label>
                    <input type="text" defaultValue="Doe" className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" defaultValue="user@example.com" className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors" />
                </div>

                <div className="pt-6">
                  <button className="px-8 py-3 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200">
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
