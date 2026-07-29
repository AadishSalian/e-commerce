'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Truck, CheckCircle2, Clock, ChevronRight, CornerDownLeft, X } from 'lucide-react';
import { MOCK_ORDERS, Order, OrderItem } from '@/lib/mockOrders';
import { PrimaryButton } from '../ui';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

export default function OrderHistory() {
  const [orders] = useState<Order[]>(MOCK_ORDERS);
  const [returnOrder, setReturnOrder] = useState<{order: Order, item: OrderItem} | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const { success } = useToast();

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'placed': return <Clock className="w-5 h-5" />;
      case 'processing': return <Package className="w-5 h-5" />;
      case 'shipped': return <Truck className="w-5 h-5" />;
      case 'delivered': return <CheckCircle2 className="w-5 h-5 text-[#8ed500]" />;
    }
  };

  const getStatusIndex = (status: Order['status']) => {
    return ['placed', 'processing', 'shipped', 'delivered'].indexOf(status);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    success(`Return label generated for ${returnOrder?.item.name}. Check your email.`);
    setReturnOrder(null);
    setReturnReason('');
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 border-b border-border">
          <h3 className="text-xl font-bold text-foreground mb-1">Order History</h3>
          <p className="text-sm text-text-muted">Track, return, or exchange your recent purchases.</p>
        </div>

        <div className="p-0">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.map(order => {
                const statusIdx = getStatusIndex(order.status);
                
                return (
                  <div key={order.id} className="p-6 md:p-8 flex flex-col gap-6">
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-foreground text-lg">{order.id}</h4>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-active rounded-md text-xs font-semibold uppercase tracking-wider">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted">
                          Placed on {new Date(order.date).toLocaleDateString()} • Total: ${order.total.toFixed(2)}
                        </p>
                      </div>
                      
                      {order.trackingNumber && (
                        <a 
                          href={`https://example.com/track/${order.trackingNumber}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-active transition-colors"
                        >
                          <Truck className="w-4 h-4" /> Track Package
                        </a>
                      )}
                    </div>

                    {/* Visual Tracking Timeline */}
                    <div className="py-6 px-4 bg-background/50 rounded-xl border border-border mt-2">
                      <div className="relative flex justify-between items-center max-w-2xl mx-auto">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border rounded-full -z-10" />
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent rounded-full -z-10 transition-all duration-1000"
                          style={{ width: `${(statusIdx / 3) * 100}%` }}
                        />
                        
                        {['Placed', 'Processing', 'Shipped', 'Delivered'].map((step, i) => {
                          const isActive = i <= statusIdx;
                          return (
                            <div key={step} className="flex flex-col items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                                isActive ? 'bg-accent border-accent text-background' : 'bg-surface border-border text-text-muted'
                              }`}>
                                {i === 0 && <Clock className="w-4 h-4" />}
                                {i === 1 && <Package className="w-4 h-4" />}
                                {i === 2 && <Truck className="w-4 h-4" />}
                                {i === 3 && <CheckCircle2 className="w-4 h-4" />}
                              </div>
                              <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-text-muted'}`}>
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {order.estimatedDelivery && order.status !== 'delivered' && (
                        <p className="text-center text-sm text-text-muted mt-6 font-medium">
                          Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="flex flex-col gap-4 mt-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-surface-active/30 rounded-xl border border-border/50">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-surface border border-border overflow-hidden shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <Link href={`/products/${item.productId}`} className="font-semibold text-foreground hover:underline">
                                {item.name}
                              </Link>
                              <p className="text-sm text-text-muted">
                                {item.variant ? `${item.variant} • ` : ''}Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="font-semibold">${item.price.toFixed(2)}</span>
                            
                            {/* Return Button (Only if delivered) */}
                            {order.status === 'delivered' && (
                              <button 
                                onClick={() => setReturnOrder({ order, item })}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-background border border-border rounded-md hover:bg-surface-hover hover:border-text-muted transition-all"
                              >
                                <CornerDownLeft className="w-3.5 h-3.5" /> Return / Exchange
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Return Modal Overlay */}
      <AnimatePresence>
        {returnOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface border border-border p-6 md:p-8 rounded-2xl max-w-md w-full relative shadow-2xl"
            >
              <button 
                onClick={() => setReturnOrder(null)} 
                className="absolute top-4 right-4 p-2 text-text-muted hover:text-foreground hover:bg-surface-hover rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold mb-2">Initiate Return</h3>
              <p className="text-sm text-text-muted mb-6">You are returning <strong>{returnOrder.item.name}</strong> from order #{returnOrder.order.id}.</p>
              
              <form onSubmit={handleReturnSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Reason for return</label>
                  <select 
                    required
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="" disabled>Select a reason...</option>
                    <option value="wrong_size">Wrong size or fit</option>
                    <option value="not_as_expected">Item not as expected</option>
                    <option value="defective">Item is defective / damaged</option>
                    <option value="changed_mind">Changed my mind</option>
                  </select>
                </div>
                
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl mt-2">
                  <p className="text-xs text-text-muted leading-relaxed">
                    By confirming, we will instantly generate a printable return label. 
                    Drop off the package at any UPS location within 14 days. 
                    Refunds are processed within 3-5 business days after receipt.
                  </p>
                </div>
                
                <PrimaryButton type="submit" className="w-full py-3 mt-2">
                  Generate Return Label
                </PrimaryButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
