'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingBag,
  Gift,
  Check,
  X,
  ShieldCheck,
  Flag,
  Calendar,
  AlertCircle,
  TrendingDown,
  Info,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { EnrichedWishlistItem } from '@/lib/wishlist/types';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useUIStore } from '@/store/useUIStore';
import { toMajorUnits } from '@/lib/price-history/currency';
import { MOCK_PRODUCTS } from '@/lib/mockData';

interface SharedWishlistData {
  id: string;
  name: string;
  description?: string;
  ownerDisplayName?: string | null;
  isGiftList: boolean;
  occasionDate?: string | null;
  itemCount: number;
  items: EnrichedWishlistItem[];
  createdAt: string;
}

interface SharedWishlistClientProps {
  token: string;
  initialData: SharedWishlistData;
}

export function SharedWishlistClient({ token, initialData }: SharedWishlistClientProps) {
  const [data, setData] = useState<SharedWishlistData>(initialData);
  const [visitorName, setVisitorName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('matte_visitor_name') || '';
    }
    return '';
  });
  const [visitorEmail, setVisitorEmail] = useState('');

  // Claim modal state
  const [claimingItem, setClaimingItem] = useState<EnrichedWishlistItem | null>(null);
  const [isClaimSubmitting, setIsClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Unclaim confirmation
  const [unclaimingItem, setUnclaimingItem] = useState<EnrichedWishlistItem | null>(null);

  // Report modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);
  const openCart = useUIStore((state) => state.openCart);
  const toggleQuickSave = useWishlistStore((state) => state.toggleQuickSave);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingItem) return;
    setClaimError(null);

    const trimmed = visitorName.trim();
    if (!trimmed) {
      setClaimError('Please enter your name so friends know who is gifting this.');
      return;
    }

    setIsClaimSubmitting(true);
    try {
      const res = await fetch(`/api/wishlists/shared/${token}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: claimingItem.id,
          name: trimmed,
          email: visitorEmail.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to claim item');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('matte_visitor_name', trimmed);
      }

      // Optimistically update
      setData((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === claimingItem.id
            ? { ...it, isClaimed: true, isClaimedByCurrentVisitor: true, claimedByName: trimmed }
            : it
        ),
      }));

      useUIStore
        .getState()
        .success(`Claimed "${claimingItem.productName}". The owner will not see this to preserve surprise!`);
      setClaimingItem(null);
    } catch (err: any) {
      setClaimError(err.message || 'Could not claim item');
    } finally {
      setIsClaimSubmitting(false);
    }
  };

  const handleUnclaim = async (item: EnrichedWishlistItem) => {
    try {
      const res = await fetch(`/api/wishlists/shared/${token}/unclaim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          claimantIdentifier: visitorName || item.claimedByName,
        }),
      });

      if (res.ok) {
        setData((prev) => ({
          ...prev,
          items: prev.items.map((it) =>
            it.id === item.id
              ? { ...it, isClaimed: false, isClaimedByCurrentVisitor: false, claimedByName: undefined }
              : it
          ),
        }));
        useUIStore.getState().addToast(`Released claim on "${item.productName}"`, 'info');
      }
    } catch (e) {
      useUIStore.getState().error('Could not release claim');
    }
    setUnclaimingItem(null);
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/wishlists/shared/${token}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSubmitted(false);
        setReportReason('');
      }, 2000);
    } catch {
      useUIStore.getState().error('Could not submit report');
    }
  };

  return (
    <div className="space-y-12">
      {/* Board Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-10 space-y-4 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              {data.name}
            </h1>

            {data.description && (
              <p className="text-text-muted text-base md:text-lg">{data.description}</p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2 text-xs text-text-muted">
              {data.ownerDisplayName && (
                <span className="text-foreground font-medium">
                  Curated by {data.ownerDisplayName}
                </span>
              )}

              {data.ownerDisplayName && <span className="text-border">•</span>}

              <span>
                {data.itemCount} {data.itemCount === 1 ? 'item' : 'items'}
              </span>

              {data.isGiftList && data.occasionDate && (
                <>
                  <span className="text-border">•</span>
                  <span className="inline-flex items-center gap-1 text-accent font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Occasion on {data.occasionDate}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Gift List Visitor Banner */}
          {data.isGiftList && (
            <div className="p-4 rounded-xl bg-surface-hover/80 border border-border/80 text-xs text-text-muted max-w-xs space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-accent font-semibold">
                <Gift className="w-4 h-4 shrink-0" />
                <span>Gift Coordination Active</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                You can claim an item by tapping <em>“I’ll get this”</em>. Claims are kept secret from the owner to protect the surprise!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Item Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.items.map((item, idx) => {
          const currentMajor = toMajorUnits(item.currentPriceMinor);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Product Image */}
                <Link
                  href={`/products/${item.productId}`}
                  className="relative w-full aspect-square rounded-xl overflow-hidden bg-background border border-border/80 block mb-4 group/img"
                >
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover/img:scale-105"
                  />

                  {/* Universally true badges only (no personal "since you saved it") */}
                  {item.isLowestIn30Days && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-background text-[11px] font-bold shadow-md">
                      <span>Lowest in 30 days</span>
                    </div>
                  )}

                  {/* Gift Claim Badge */}
                  {item.isClaimed && (
                    <div className="absolute bottom-3 left-3 right-3 z-10 p-2 rounded-xl bg-black/85 backdrop-blur-md border border-border text-center text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-xl">
                      <Gift className="w-3.5 h-3.5 text-accent" />
                      <span>
                        {item.isClaimedByCurrentVisitor
                          ? 'Claimed by you'
                          : `Claimed${item.claimedByName ? ` by ${item.claimedByName}` : ''}`}
                      </span>
                    </div>
                  )}
                </Link>

                {/* Info */}
                <h3 className="font-bold text-foreground text-base truncate">
                  <Link href={`/products/${item.productId}`} className="hover:text-accent transition-colors">
                    {item.productName}
                  </Link>
                </h3>

                <div className="flex items-center justify-between mt-1 text-sm">
                  <p className="font-semibold text-foreground tabular-nums">
                    ${currentMajor.toFixed(2)}
                    {item.variantValue && (
                      <span className="text-xs text-text-muted font-normal ml-1">
                        • {item.variantValue}
                      </span>
                    )}
                  </p>

                  {!item.isInStock && (
                    <span className="text-xs text-text-muted font-medium">Out of stock</span>
                  )}
                </div>

                {/* Owner's note if provided */}
                {item.note && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-background/50 border border-border/50 text-xs text-text-muted">
                    <span className="font-semibold text-foreground">Note:</span> {item.note}
                  </div>
                )}
              </div>

              {/* Visitor Actions */}
              <div className="space-y-2 pt-2 border-t border-border/80">
                {/* Gift mode claim button */}
                {data.isGiftList && (
                  <div>
                    {item.isClaimed ? (
                      item.isClaimedByCurrentVisitor ? (
                        <button
                          type="button"
                          onClick={() => setUnclaimingItem(item)}
                          className="w-full py-2 px-3 rounded-xl bg-surface-hover hover:bg-surface-active border border-border text-xs text-text-muted hover:text-foreground font-medium transition-colors min-h-[44px]"
                        >
                          Release your claim
                        </button>
                      ) : (
                        <div className="w-full py-2 text-center text-xs text-text-muted/70 italic">
                          Someone intends to buy this
                        </div>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => setClaimingItem(item)}
                        className="w-full py-2.5 px-3 rounded-xl bg-surface-hover hover:bg-surface-active border border-border text-xs font-semibold text-accent flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>I’ll get this</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Add to Bag and Save to my Wishlist */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!item.isInStock || item.isDiscontinued}
                    onClick={() => {
                      const prod = MOCK_PRODUCTS.find((p) => p.id === item.productId);
                      if (prod) {
                        addToCart(prod, 1, item.variantValue || undefined);
                        useUIStore.getState().success(`Added ${item.productName} to your bag`);
                        openCart();
                      }
                    }}
                    className="flex-1 bg-accent hover:bg-accent-hover text-background font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30 min-h-[44px]"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to bag</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const prod = MOCK_PRODUCTS.find((p) => p.id === item.productId);
                      if (prod) {
                        toggleQuickSave(prod, item.variantId, item.variantValue);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-text-muted hover:text-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Save to my wishlist"
                    aria-label={`Save ${item.productName} to my wishlist`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer / Report Link */}
      <div className="pt-16 pb-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
        <p>Curated with MATTE. Precision engineered products for work & home.</p>
        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="text-text-muted hover:text-red-400 flex items-center gap-1.5 transition-colors py-2 min-h-[44px]"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Report this list</span>
        </button>
      </div>

      {/* Claim Modal */}
      <AnimatePresence>
        {claimingItem && (
          <div
            className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setClaimingItem(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="claim-modal-title"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              className="w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-accent" />
                  <h3 id="claim-modal-title" className="text-base font-bold text-foreground">
                    I’ll Get This
                  </h3>
                </div>
                <button
                  onClick={() => setClaimingItem(null)}
                  className="p-1.5 text-text-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-foreground font-medium">{claimingItem.productName}</p>
                <p className="text-xs text-text-muted">
                  Let other visitors know you intend to buy this item so they don’t get duplicate gifts.
                </p>
              </div>

              <form onSubmit={handleClaim} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label htmlFor="claim-name-input" className="text-xs text-text-muted block">
                    Your name <span className="text-accent">*</span>
                  </label>
                  <input
                    id="claim-name-input"
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Maya"
                    className="w-full bg-background border border-border focus:border-accent rounded-xl px-3 py-2 text-xs text-foreground outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="claim-email-input" className="text-xs text-text-muted block">
                    Your email (optional, allows you to undo later)
                  </label>
                  <input
                    id="claim-email-input"
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="maya@example.com"
                    className="w-full bg-background border border-border focus:border-accent rounded-xl px-3 py-2 text-xs text-foreground outline-none"
                  />
                </div>

                {claimError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{claimError}</span>
                  </p>
                )}

                <div className="p-3 rounded-xl bg-background/60 border border-border/50 text-[11px] text-text-muted space-y-1">
                  <div className="flex items-center gap-1.5 text-accent font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Surprise Guarantee</span>
                  </div>
                  <p>
                    The list owner will NOT see who claimed this item or that it has been claimed. Other visitors with the link will see it as claimed. Claims expire automatically in 30 days.
                  </p>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setClaimingItem(null)}
                    className="px-4 py-2 text-xs text-text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isClaimSubmitting}
                    className="bg-accent hover:bg-accent-hover text-background px-5 py-2.5 rounded-xl text-xs font-semibold"
                  >
                    {isClaimSubmitting ? 'Saving…' : 'Confirm Claim'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unclaim Confirmation Modal */}
      <AnimatePresence>
        {unclaimingItem && (
          <div
            className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setUnclaimingItem(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              className="w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-foreground">Release Claim?</h3>
              <p className="text-xs text-text-muted">
                Are you sure you want to release your claim on &ldquo;{unclaimingItem.productName}&rdquo;? Other visitors will be able to claim it again.
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setUnclaimingItem(null)}
                  className="px-4 py-2 text-xs text-text-muted hover:text-foreground"
                >
                  Keep Claim
                </button>
                <button
                  type="button"
                  onClick={() => handleUnclaim(unclaimingItem)}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Yes, Release Claim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {isReportOpen && (
          <div
            className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsReportOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              className="w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <h3 id="report-modal-title" className="text-base font-bold text-foreground">
                Report This List
              </h3>
              {reportSubmitted ? (
                <div className="py-6 text-center space-y-2">
                  <Check className="w-8 h-8 text-accent mx-auto" />
                  <p className="text-xs text-foreground font-semibold">Thank you for letting us know.</p>
                  <p className="text-xs text-text-muted">Our safety team will review this list promptly.</p>
                </div>
              ) : (
                <form onSubmit={handleReport} className="space-y-3">
                  <p className="text-xs text-text-muted">
                    If this wishlist contains inappropriate content, spam, or violates our terms, please describe below:
                  </p>
                  <textarea
                    rows={3}
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Describe the issue…"
                    className="w-full bg-background border border-border focus:border-accent rounded-xl p-3 text-xs text-foreground outline-none resize-none"
                  />
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setIsReportOpen(false)}
                      className="px-4 py-2 text-xs text-text-muted hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-accent text-background px-4 py-2 rounded-xl text-xs font-semibold"
                    >
                      Submit Report
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
