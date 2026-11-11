'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  Lock,
  Check,
  Zap,
  Shield,
  Tag,
  Package,
  Layers,
  Sparkles,
  Sliders,
  Moon,
  Clock,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationPreferences } from '@/lib/notifications/types';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function NotificationPreferencesPage() {
  const { user } = useAuth();
  const userId = user?.id || 'usr-demo-1';
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);

  // Load preferences
  useEffect(() => {
    fetch(`/api/notifications/preferences?userId=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => {
        setPrefs(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [userId]);

  const savePreferences = async (updated: NotificationPreferences) => {
    setPrefs(updated);
    setSaveStatus('Saving…');

    try {
      const res = await fetch(`/api/notifications/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setSaveStatus('Saved');
        fetchUnreadCount(userId);
        setTimeout(() => setSaveStatus(null), 2500);
      } else {
        setSaveStatus('Failed to save');
      }
    } catch (e) {
      setSaveStatus('Failed to save');
    }
  };

  const handleToggleCategory = (cat: 'orders' | 'price' | 'stock') => {
    if (!prefs) return;
    const nextVal = !prefs.categories[cat];
    const updated = {
      ...prefs,
      categories: {
        ...prefs.categories,
        [cat]: nextVal,
      },
    };
    savePreferences(updated);
  };

  const handleToggleChannel = (
    channel: 'in_app' | 'email' | 'push',
    category: 'orders' | 'price' | 'stock'
  ) => {
    if (!prefs) return;
    const currentVal = prefs.channels[category][channel];
    const updated = {
      ...prefs,
      channels: {
        ...prefs.channels,
        [category]: {
          ...prefs.channels[category],
          [channel]: !currentVal,
        },
      },
    };
    savePreferences(updated);
  };

  const handleTurnOffOptional = () => {
    if (!prefs) return;
    const updated: NotificationPreferences = {
      ...prefs,
      categories: {
        orders: true,
        price: false,
        stock: false,
        account: true,
      },
      channels: {
        orders: { in_app: true, email: true, push: false },
        price: { in_app: false, email: false, push: false },
        stock: { in_app: false, email: false, push: false },
        account: { in_app: true, email: true, push: false },
      },
    };
    savePreferences(updated);
  };

  const handleSimulate = async (action: string) => {
    setSimulating(action);
    try {
      await fetch('/api/notifications/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      fetchUnreadCount(userId);
    } catch (e) {
    } finally {
      setTimeout(() => setSimulating(null), 600);
    }
  };

  if (isLoading || !prefs) {
    return (
      <div className="min-h-screen bg-background pt-28 flex items-center justify-center text-text-muted">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading notification preferences…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Account</span>
          </Link>

          <AnimatePresence>
            {saveStatus && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent border border-accent/30"
              >
                <Check className="w-3 h-3" />
                <span>{saveStatus}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Header */}
        <div className="rounded-2xl bg-surface border border-border p-6 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Notification Preferences
              </h1>
              <p className="text-sm text-text-muted mt-1 max-w-xl leading-relaxed">
                You control what reaches you. Every alert corresponds to a real event in our system. We never invent items to drive engagement.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTurnOffOptional}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-active hover:bg-surface-hover border border-border text-text-muted hover:text-foreground transition-colors shrink-0 cursor-pointer"
            >
              Turn off all optional
            </button>
          </div>
        </div>

        {/* Section 1: Categories by Channel Matrix */}
        <div className="rounded-2xl bg-surface border border-border overflow-hidden mb-8 shadow-xs">
          <div className="px-6 py-4 border-b border-border bg-surface/50">
            <h2 className="text-sm font-semibold text-foreground">Categories & Delivery Channels</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Choose how you want to be notified for each type of update.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-surface-active/20 text-text-muted">
                  <th className="py-3 px-6 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-center w-24">
                    <span className="inline-flex items-center gap-1">
                      <Bell className="w-3 h-3" /> In-App
                    </span>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center w-24">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </span>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center w-24">
                    <span className="inline-flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> Push
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {/* Orders Row */}
                <tr className="hover:bg-surface-hover/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-surface-active text-foreground flex items-center justify-center shrink-0 border border-border">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Orders & Deliveries</div>
                        <div className="text-text-muted text-[11px] mt-0.5">
                          Order confirmation, dispatch milestones, delays, and tracking.
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={prefs.channels.orders.in_app}
                      onChange={() => handleToggleChannel('in_app', 'orders')}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                      aria-label="In-app order notifications"
                    />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted cursor-not-allowed" title="Essential order receipts cannot be disabled">
                      <Lock className="w-3 h-3" /> On
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={prefs.channels.orders.push}
                      onChange={() => handleToggleChannel('push', 'orders')}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                      aria-label="Push order notifications"
                    />
                  </td>
                </tr>

                {/* Price Drops Row */}
                <tr className="hover:bg-surface-hover/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Price Drops</div>
                        <div className="text-text-muted text-[11px] mt-0.5">
                          When wishlisted items drop by at least {prefs.priceDropThresholdPercent}%.
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={prefs.channels.price.in_app && prefs.categories.price}
                      onChange={() => {
                        handleToggleCategory('price');
                        handleToggleChannel('in_app', 'price');
                      }}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                      aria-label="In-app price drop notifications"
                    />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={prefs.channels.price.email}
                      onChange={() => handleToggleChannel('email', 'price')}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                      aria-label="Email price drop notifications"
                    />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={prefs.channels.price.push}
                      onChange={() => handleToggleChannel('push', 'price')}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                      aria-label="Push price drop notifications"
                    />
                  </td>
                </tr>

                {/* Restocks Row */}
                <tr className="hover:bg-surface-hover/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Restocks</div>
                        <div className="text-text-muted text-[11px] mt-0.5">
                          When unavailable watched items return in stock with your variant.
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={prefs.channels.stock.in_app && prefs.categories.stock}
                      onChange={() => {
                        handleToggleCategory('stock');
                        handleToggleChannel('in_app', 'stock');
                      }}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                      aria-label="In-app restock notifications"
                    />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={prefs.channels.stock.email}
                      onChange={() => handleToggleChannel('email', 'stock')}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                      aria-label="Email restock notifications"
                    />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={prefs.channels.stock.push}
                      onChange={() => handleToggleChannel('push', 'stock')}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                      aria-label="Push restock notifications"
                    />
                  </td>
                </tr>

                {/* Account & Security Row */}
                <tr className="bg-surface-active/15">
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <span>Account & Security</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">
                            REQUIRED
                          </span>
                        </div>
                        <div className="text-text-muted text-[11px] mt-0.5">
                          New logins, password modifications, and security verification.
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted" title="Essential security warnings cannot be muted">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted" title="Essential security emails cannot be muted">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={prefs.channels.account.push}
                      onChange={(e) => {
                        const updated = {
                          ...prefs,
                          channels: {
                            ...prefs.channels,
                            account: {
                              ...prefs.channels.account,
                              push: e.target.checked,
                            },
                          },
                        };
                        savePreferences(updated);
                      }}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                      aria-label="Push security notifications"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Smart Thresholds & Quiet Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Price Drop Threshold */}
          <div className="rounded-2xl bg-surface border border-border p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Price Drop Threshold</h3>
            </div>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Ignore trivial price dips. Only notify when the price falls by at least this amount.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => {
                    const updated = { ...prefs, priceDropThresholdPercent: percent };
                    savePreferences(updated);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    prefs.priceDropThresholdPercent === percent
                      ? 'bg-accent text-background border-accent'
                      : 'bg-surface-active text-text-muted border-border hover:text-foreground'
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Email Digest Frequency */}
          <div className="rounded-2xl bg-surface border border-border p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Email Digest Frequency</h3>
            </div>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Consolidate price drops and restocks instead of sending individual emails per item.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['instant', 'daily', 'weekly'] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => {
                    const updated = { ...prefs, digestFrequency: freq };
                    savePreferences(updated);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-colors cursor-pointer ${
                    prefs.digestFrequency === freq
                      ? 'bg-accent text-background border-accent'
                      : 'bg-surface-active text-text-muted border-border hover:text-foreground'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Lock Screen Privacy */}
          <div className="rounded-2xl bg-surface border border-border p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Lock Screen Privacy</h3>
              </div>
              <input
                type="checkbox"
                checked={!prefs.pushDetailedPreviews}
                onChange={(e) => {
                  const updated = { ...prefs, pushDetailedPreviews: !e.target.checked };
                  savePreferences(updated);
                }}
                className="w-4 h-4 accent-accent rounded cursor-pointer"
                id="toggle-lock-privacy"
              />
            </div>
            <label htmlFor="toggle-lock-privacy" className="text-xs text-text-muted block cursor-pointer leading-relaxed">
              Generic lock screen preview (e.g. &ldquo;Order update&rdquo; instead of naming specific products or wishlists) to prevent eavesdropping on shared devices.
            </label>
          </div>

          {/* Quiet Hours */}
          <div className="rounded-2xl bg-surface border border-border p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Quiet Hours</h3>
              </div>
              <input
                type="checkbox"
                checked={prefs.quietHours.enabled}
                onChange={(e) => {
                  const updated = {
                    ...prefs,
                    quietHours: { ...prefs.quietHours, enabled: e.target.checked },
                  };
                  savePreferences(updated);
                }}
                className="w-4 h-4 accent-accent rounded cursor-pointer"
                id="toggle-quiet"
              />
            </div>
            <label htmlFor="toggle-quiet" className="text-xs text-text-muted block cursor-pointer mb-3 leading-relaxed">
              Mute push and instant email delivery during sleep hours (10:00 PM – 7:00 AM).
            </label>
            {prefs.quietHours.enabled && (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>From</span>
                <input
                  type="time"
                  value={prefs.quietHours.start}
                  onChange={(e) => {
                    const updated = {
                      ...prefs,
                      quietHours: { ...prefs.quietHours, start: e.target.value },
                    };
                    savePreferences(updated);
                  }}
                  className="px-2 py-1 bg-surface-active rounded border border-border text-foreground"
                />
                <span>to</span>
                <input
                  type="time"
                  value={prefs.quietHours.end}
                  onChange={(e) => {
                    const updated = {
                      ...prefs,
                      quietHours: { ...prefs.quietHours, end: e.target.value },
                    };
                    savePreferences(updated);
                  }}
                  className="px-2 py-1 bg-surface-active rounded border border-border text-foreground"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Live Event Simulator (Interactive Verification) */}
        <div className="rounded-2xl bg-surface border border-border p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Real-Time Event Simulator</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 leading-relaxed">
            Trigger a real server-side event below to see the navbar bell, badge counter, and dropdown update live via Server-Sent Events.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              disabled={simulating !== null}
              onClick={() => handleSimulate('order_update')}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-surface-active hover:bg-surface-hover border border-border text-foreground transition-colors disabled:opacity-50 cursor-pointer text-center"
            >
              {simulating === 'order_update' ? 'Firing…' : '📦 Order Out for Delivery'}
            </button>

            <button
              type="button"
              disabled={simulating !== null}
              onClick={() => handleSimulate('price_drop')}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-surface-active hover:bg-surface-hover border border-border text-foreground transition-colors disabled:opacity-50 cursor-pointer text-center"
            >
              {simulating === 'price_drop' ? 'Firing…' : '🏷️ Keyboard Price Drop'}
            </button>

            <button
              type="button"
              disabled={simulating !== null}
              onClick={() => handleSimulate('restock')}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-surface-active hover:bg-surface-hover border border-border text-foreground transition-colors disabled:opacity-50 cursor-pointer text-center"
            >
              {simulating === 'restock' ? 'Firing…' : '✨ Earbuds Restocked'}
            </button>

            <button
              type="button"
              disabled={simulating !== null}
              onClick={() => handleSimulate('security_alert')}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-surface-active hover:bg-surface-hover border border-border text-foreground transition-colors disabled:opacity-50 cursor-pointer text-center"
            >
              {simulating === 'security_alert' ? 'Firing…' : '🛡️ New Sign-in Alert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
