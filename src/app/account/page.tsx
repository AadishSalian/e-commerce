'use client';

import { MOCK_PRODUCTS } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Package, User, Heart, LogOut, Bell } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { WishlistButton, EmptyState } from '@/components/ui';

import Image from 'next/image';

export default function AccountPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const { wishlistItems } = useWishlist();

  return (
    <div className="min-h-screen bg-background pt-8 md:pt-4 pb-32">
      <div className="container mx-auto px-4 lg:px-8 flex flex-col lg:flex-row gap-12">
        
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-1/4 flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Account</h1>
            <p className="text-text-muted">{user?.email || 'aadishsalian@gmail.com'}</p>
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
            <Link 
              href="/account/notifications"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors text-left"
            >
              <Bell className="w-5 h-5" /> Notification Preferences
            </Link>
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
              <h2 className="text-xl font-semibold text-foreground">Order History</h2>
              
              <div className="flex flex-col gap-4">
                {/* Order Item */}
                <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-foreground">Order #ORD-948271</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        Shipped
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">Placed on Nov 8, 2026 • 1 Item • ₹15,470</p>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <div className="w-16 h-16 rounded-lg bg-surface-active overflow-hidden relative border border-border">
                        <Image 
                          src="https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=400&auto=format&fit=crop" 
                          alt="Matte Keyboard 1" 
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Matte Keyboard 1</h4>
                        <p className="text-xs text-text-muted">Obsidian Black • Laser Engraved</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-border">
                    <span className="text-lg font-bold text-foreground">₹15,470</span>
                    <Link
                      href="/checkout/success?orderId=ORD-948271&token=7f9a8b1c4d2e3f4a5b6c7d8e9f0a1b2c"
                      className="px-4 py-2 border border-border bg-background text-foreground rounded-full text-sm font-medium hover:bg-surface-hover transition-colors inline-block"
                    >
                      Track Order & Receipt
                    </Link>
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
              className="flex flex-col gap-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground">Your Wishlist</h2>
                <Link href="/wishlist" className="text-xs font-semibold text-accent hover:underline">
                  View Wishlist Boards &rarr;
                </Link>
              </div>

              {wishlistItems.length === 0 ? (
                <EmptyState 
                  title="Your wishlist is empty"
                  description="Save items you love by clicking the heart icon on any product."
                  actionText="Discover Products"
                  actionHref="/products"
                  icon={<Heart className="w-8 h-8 text-text-muted" />}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-surface border border-border flex gap-4 relative group">
                      <div className="w-20 h-20 rounded-lg bg-surface-active overflow-hidden relative shrink-0">
                        <Image src={item.image} alt={item.name} width={80} height={80} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex flex-col justify-between flex-1 min-w-0">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground truncate">{item.name}</h4>
                          <p className="text-xs text-text-muted mt-0.5">₹{item.price}</p>
                        </div>
                        <div className="flex items-center">
                          <Link href={`/products/${item.id}`} className="px-4 py-1.5 border border-border bg-background text-foreground rounded-full text-xs font-medium hover:bg-surface-hover transition-colors">
                            View Item
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Profile Settings Tab */}
          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8 max-w-xl"
            >
              <h2 className="text-xl font-semibold text-foreground">Profile Settings</h2>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={user?.name || "Aadish Balakrishna Salian"}
                    className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground focus:outline-hidden focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={user?.email || "aadishsalian@gmail.com"}
                    disabled
                    className="w-full px-4 py-3 rounded-lg bg-surface/50 border border-border text-text-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-text-muted mt-1">Contact support to update your registered email address.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    defaultValue="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground focus:outline-hidden focus:border-accent"
                  />
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
