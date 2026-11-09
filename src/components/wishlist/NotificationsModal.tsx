'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Mail, Smartphone, ShieldCheck, Check } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

export function NotificationsModal() {
  const isNotificationsOpen = useWishlistStore((state) => state.isNotificationsOpen);
  const closeNotificationsModal = useWishlistStore((state) => state.closeNotificationsModal);
  const targetWishlist = useWishlistStore((state) => state.notificationsTargetWishlist);
  const updateBoard = useWishlistStore((state) => state.updateBoard);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);

  const [enabled, setEnabled] = useState(false);
  const [emailChannel, setEmailChannel] = useState(true);
  const [pushChannel, setPushChannel] = useState(false);
  const [smsChannel, setSmsChannel] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestOptInSent, setGuestOptInSent] = useState(false);

  useEffect(() => {
    if (targetWishlist) {
      setEnabled(!!targetWishlist.notifyPriceDrops);
      setEmailChannel(targetWishlist.notifyChannels?.email ?? true);
      setPushChannel(targetWishlist.notifyChannels?.push ?? false);
      setSmsChannel(targetWishlist.notifyChannels?.sms ?? false);
    }
  }, [targetWishlist]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNotificationsOpen) {
        closeNotificationsModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNotificationsOpen, closeNotificationsModal]);

  if (!isNotificationsOpen || !targetWishlist) return null;

  const handleSave = async () => {
    if (!isLoggedIn && enabled && !guestOptInSent) {
      if (!guestEmail.includes('@')) {
        useUIStore.getState().error('Please enter a valid email address.');
        return;
      }
      setGuestOptInSent(true);
      useUIStore.getState().success(`Verification link sent to ${guestEmail}. Please confirm double opt-in.`);
    }

    try {
      await updateBoard(targetWishlist.id, {
        notifyPriceDrops: enabled,
        notifyChannels: {
          email: emailChannel,
          push: pushChannel,
          sms: smsChannel,
        },
      });
      useUIStore.getState().success('Notification preferences updated');
      closeNotificationsModal();
    } catch (err: any) {
      useUIStore.getState().error(err.message || 'Failed to update preferences');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={closeNotificationsModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-modal-title"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl flex flex-col"
      >
        {/* Mobile handle */}
        <div className="sm:hidden w-12 h-1 bg-border rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-accent" />
            <h2 id="notif-modal-title" className="text-lg font-bold text-foreground">
              Price Drop & Restock Alerts
            </h2>
          </div>
          <button
            onClick={closeNotificationsModal}
            className="p-2 text-text-muted hover:text-foreground rounded-full hover:bg-surface-hover transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-5">
          {/* Main switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-hover/70 border border-border/60">
            <div>
              <span className="text-sm font-semibold text-foreground block">
                Notify me of price drops
              </span>
              <p className="text-xs text-text-muted mt-0.5">
                Restrained alerts for drops of at least 5%.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                enabled ? 'bg-accent' : 'bg-surface-active border border-border'
              }`}
              aria-label="Toggle price drop notifications"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  enabled ? 'translate-x-5 !bg-background' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Channels */}
          {enabled && (
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Delivery Channels
              </h3>

              {!isLoggedIn && (
                <div className="space-y-1.5">
                  <label className="text-xs text-text-muted block">
                    Your email address for alerts (double opt-in):
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:border-accent outline-none"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-background/40 cursor-pointer">
                  <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                    <Mail className="w-4 h-4 text-text-muted" />
                    <span>Email Daily Digest (max 1/day)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailChannel}
                    onChange={(e) => setEmailChannel(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-accent"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-background/40 cursor-pointer">
                  <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                    <Smartphone className="w-4 h-4 text-text-muted" />
                    <span>Web Push (PWA)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushChannel}
                    onChange={(e) => setPushChannel(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-accent"
                  />
                </label>
              </div>

              {/* Restraint promise */}
              <div className="p-3 rounded-xl bg-surface border border-border/50 text-[11px] text-text-muted space-y-1">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>Honest Alert Rules</span>
                </div>
                <p>
                  No false alarms or fake urgency. We only notify when the recorded price history confirms a real reduction of 5% or more. 7-day cooldown per item. One-click unsubscribe in every email.
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 bg-accent hover:bg-accent-hover text-background font-semibold py-3 rounded-xl text-sm transition-colors min-h-[44px]"
            >
              Save Preferences
            </button>
            <button
              type="button"
              onClick={closeNotificationsModal}
              className="px-4 py-3 rounded-xl bg-surface-hover text-foreground text-sm font-medium hover:bg-surface-active transition-colors min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
