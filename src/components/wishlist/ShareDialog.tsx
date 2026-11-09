'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Link2,
  Lock,
  Copy,
  Check,
  Share2,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  MessageCircle,
  Mail,
  UserCheck,
} from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { LinkExpirationDays } from '@/lib/wishlist/types';
import Link from 'next/link';

export function ShareDialog() {
  const isShareOpen = useWishlistStore((state) => state.isShareOpen);
  const closeShareDialog = useWishlistStore((state) => state.closeShareDialog);
  const targetWishlist = useWishlistStore((state) => state.shareTargetWishlist);
  const shareBoard = useWishlistStore((state) => state.shareBoard);
  const revokeShare = useWishlistStore((state) => state.revokeShare);
  const rotateShare = useWishlistStore((state) => state.rotateShare);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);

  const [isShared, setIsShared] = useState(false);
  const [showOwnerName, setShowOwnerName] = useState(false);
  const [ownerDisplayName, setOwnerDisplayName] = useState('');
  const [expirationOption, setExpirationOption] = useState<LinkExpirationDays>('never');
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [firstShareConfirmed, setFirstShareConfirmed] = useState(false);
  const [showFirstShareNotice, setShowFirstShareNotice] = useState(false);
  const [liveCopiedAnnouncement, setLiveCopiedAnnouncement] = useState('');

  useEffect(() => {
    if (targetWishlist) {
      const active = targetWishlist.visibility === 'link' && !!targetWishlist.shareToken;
      setIsShared(active);
      setShowOwnerName(!!targetWishlist.shareOptions?.showOwnerName);
      setOwnerDisplayName(
        targetWishlist.shareOptions?.ownerDisplayName || user?.name || ''
      );
      setExpirationOption(targetWishlist.shareOptions?.expirationDays || 'never');

      if (targetWishlist.shareToken) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        setShareUrl(`${origin}/w/${targetWishlist.shareToken}`);
      } else {
        setShareUrl('');
      }

      // Check if this is the default list
      setShowFirstShareNotice(false);
    }
  }, [targetWishlist, user?.name]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isShareOpen) {
        closeShareDialog();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShareOpen, closeShareDialog]);

  if (!isShareOpen || !targetWishlist) return null;

  // Guest must sign in to share
  if (!isLoggedIn) {
    return (
      <div
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
        onClick={closeShareDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-guest-title"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 id="share-guest-title" className="text-lg font-bold text-foreground">
              Sign In to Share
            </h2>
            <button
              onClick={closeShareDialog}
              className="p-2 text-text-muted hover:text-foreground rounded-full"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="py-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center mx-auto">
              <Link2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-text-muted">
              Sharing a wishlist requires an account so your private link can be securely managed and revoked at any time.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login?redirect=/wishlist"
                className="w-full bg-accent hover:bg-accent-hover text-background font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
              >
                Sign In or Create Account
              </Link>
              <button
                type="button"
                onClick={closeShareDialog}
                className="w-full bg-surface-hover hover:bg-surface-active text-foreground font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const isDefaultListName =
    targetWishlist.isDefault ||
    targetWishlist.name.toLowerCase() === 'my wishlist' ||
    targetWishlist.name.toLowerCase() === 'default';

  const handleToggleVisibility = async (newVal: boolean) => {
    if (!newVal) {
      // Stop sharing
      await revokeShare(targetWishlist.id);
      setIsShared(false);
      setShareUrl('');
      useUIStore.getState().addToast('Share link revoked. This list is now private.', 'info');
      return;
    }

    // If enabling share for the first time or on default list, show confirmation warning first
    if (!firstShareConfirmed) {
      setShowFirstShareNotice(true);
      return;
    }

    try {
      const res = await shareBoard(targetWishlist.id, {
        showOwnerName,
        ownerDisplayName: showOwnerName ? ownerDisplayName.trim() || user?.name || undefined : undefined,
        expirationDays: expirationOption,
      });
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setShareUrl(`${origin}${res.shareUrl}`);
      setIsShared(true);
      useUIStore.getState().success('Share link generated');
    } catch (err: any) {
      useUIStore.getState().error(err.message || 'Failed to share');
    }
  };

  const handleConfirmFirstShare = async () => {
    setFirstShareConfirmed(true);
    setShowFirstShareNotice(false);
    try {
      const res = await shareBoard(targetWishlist.id, {
        showOwnerName,
        ownerDisplayName: showOwnerName ? ownerDisplayName.trim() || user?.name || undefined : undefined,
        expirationDays: expirationOption,
      });
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setShareUrl(`${origin}${res.shareUrl}`);
      setIsShared(true);
      useUIStore.getState().success('Share link created');
    } catch (err: any) {
      useUIStore.getState().error(err.message || 'Failed to share');
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setLiveCopiedAnnouncement('Link copied to clipboard');
      setTimeout(() => {
        setIsCopied(false);
        setLiveCopiedAnnouncement('');
      }, 2000);
    } catch {
      useUIStore.getState().error('Could not copy link');
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${targetWishlist.name} | MATTE Wishlist`,
          text: `Check out my "${targetWishlist.name}" wishlist board on MATTE`,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleRotate = async () => {
    setIsRotating(true);
    try {
      const res = await rotateShare(targetWishlist.id, {
        showOwnerName,
        ownerDisplayName: showOwnerName ? ownerDisplayName.trim() || user?.name || undefined : undefined,
        expirationDays: expirationOption,
      });
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setShareUrl(`${origin}${res.shareUrl}`);
      useUIStore.getState().success('Created a new link. Previous link invalidated.');
    } catch (err: any) {
      useUIStore.getState().error(err.message || 'Failed to rotate link');
    } finally {
      setIsRotating(false);
    }
  };

  const whatsAppUrl = shareUrl
    ? `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `Here is my "${targetWishlist.name}" wishlist: ${shareUrl}`
      )}`
    : '#';

  const emailUrl = shareUrl
    ? `mailto:?subject=${encodeURIComponent(
        `Wishlist: ${targetWishlist.name}`
      )}&body=${encodeURIComponent(
        `Hi,\n\nI wanted to share my "${targetWishlist.name}" wishlist board with you:\n${shareUrl}\n\nNotes and live prices are included. Enjoy!`
      )}`
    : '#';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={closeShareDialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
    >
      <div className="sr-only" aria-live="polite">
        {liveCopiedAnnouncement}
      </div>

      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full sm:max-w-lg bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Mobile handle */}
        <div className="sm:hidden w-12 h-1 bg-border rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 id="share-dialog-title" className="text-lg font-bold text-foreground">
              Share “{targetWishlist.name}”
            </h2>
          </div>
          <button
            onClick={closeShareDialog}
            className="p-2 text-text-muted hover:text-foreground rounded-full hover:bg-surface-hover transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close share dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-6 hide-scrollbar">
          {/* Part 1: Visibility Switch */}
          <div className="bg-surface-hover/70 rounded-xl p-4 border border-border/60">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-surface border border-border text-foreground shrink-0 mt-0.5">
                  {isShared ? <Link2 className="w-4 h-4 text-accent" /> : <Lock className="w-4 h-4 text-text-muted" />}
                </div>
                <div>
                  <label htmlFor="visibility-toggle" className="text-sm font-semibold text-foreground cursor-pointer block">
                    {isShared ? 'Anyone with the link' : 'Only me (Private)'}
                  </label>
                  <p className="text-xs text-text-muted mt-0.5">
                    {isShared
                      ? 'Anyone with this unguessable link can view the items. No sign-in required.'
                      : 'This wishlist is completely private. Only you can view it.'}
                  </p>
                </div>
              </div>
              <button
                id="visibility-toggle"
                type="button"
                role="switch"
                aria-checked={isShared}
                onClick={() => handleToggleVisibility(!isShared)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isShared ? 'bg-accent' : 'bg-surface-active border border-border'
                }`}
                aria-label="Toggle link sharing"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isShared ? 'translate-x-5 !bg-background' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Warning for default list */}
            {isDefaultListName && (
              <div className="mt-3.5 p-3 rounded-lg bg-surface border border-yellow-500/30 text-yellow-500 flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> This is your main wishlist board. Be sure it contains only items you intend to share.
                </span>
              </div>
            )}
          </div>

          {/* Part 2: What People Will See (Privacy Guarantee) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              What visitors will see
            </h3>
            <div className="p-3.5 rounded-xl border border-border/70 bg-background/50 space-y-2 text-xs text-text-muted">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                <span>Privacy-first sharing</span>
              </div>
              <p>
                Visitors see list name, items, notes, and live store prices.
                <strong className="text-foreground"> Your email, shipping address, order history, and other lists are NEVER shown.</strong>
              </p>

              {/* Show owner name toggle */}
              <div className="pt-2 border-t border-border/40 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-foreground">
                  <input
                    type="checkbox"
                    checked={showOwnerName}
                    onChange={(e) => {
                      setShowOwnerName(e.target.checked);
                      if (isShared) {
                        shareBoard(targetWishlist.id, {
                          showOwnerName: e.target.checked,
                          ownerDisplayName: ownerDisplayName.trim() || user?.name || undefined,
                          expirationDays: expirationOption,
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-border accent-accent"
                  />
                  <span>Show my display name on the shared board</span>
                </label>

                {showOwnerName && (
                  <div className="mt-2 pl-6">
                    <input
                      type="text"
                      value={ownerDisplayName}
                      onChange={(e) => {
                        setOwnerDisplayName(e.target.value);
                      }}
                      onBlur={() => {
                        if (isShared) {
                          shareBoard(targetWishlist.id, {
                            showOwnerName: true,
                            ownerDisplayName: ownerDisplayName.trim() || user?.name || undefined,
                            expirationDays: expirationOption,
                          });
                        }
                      }}
                      placeholder="Your first name or nickname"
                      maxLength={30}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-text-muted focus:border-accent outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Expiration setting */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Calendar className="w-3.5 h-3.5" />
                  Link expiration
                </span>
                <select
                  value={expirationOption}
                  onChange={(e) => {
                    const opt = e.target.value as LinkExpirationDays;
                    setExpirationOption(opt);
                    if (isShared) {
                      shareBoard(targetWishlist.id, {
                        showOwnerName,
                        ownerDisplayName,
                        expirationDays: opt,
                      });
                    }
                  }}
                  className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:border-accent outline-none"
                >
                  <option value="never">Never expires</option>
                  <option value="30">Expires in 30 days</option>
                  <option value="90">Expires in 90 days</option>
                </select>
              </div>

              <p className="text-[11px] text-text-muted/80 italic pt-1">
                Changes you make to this wishlist appear automatically for visitors with the link.
              </p>
            </div>
          </div>

          {/* Part 3: The Link & Actions */}
          {isShared && shareUrl && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Share Link
              </h3>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground font-mono truncate select-all outline-none"
                  aria-label="Share URL"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-accent text-background hover:bg-accent-hover font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0 min-h-[44px]"
                >
                  {isCopied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Share Channels */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {typeof navigator !== 'undefined' && (navigator as any).share && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-surface-hover hover:bg-surface-active border border-border text-xs text-foreground font-medium transition-colors min-h-[44px]"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share…</span>
                  </button>
                )}

                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-surface-hover hover:bg-surface-active border border-border text-xs text-foreground font-medium transition-colors min-h-[44px]"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={emailUrl}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-surface-hover hover:bg-surface-active border border-border text-xs text-foreground font-medium transition-colors min-h-[44px]"
                >
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>Email</span>
                </a>
              </div>

              {/* Revocation & Rotation Controls */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleRotate}
                  disabled={isRotating}
                  className="text-text-muted hover:text-foreground flex items-center gap-1.5 transition-colors py-1 min-h-[44px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                  <span>Create new link (invalidates old)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleVisibility(false)}
                  className="text-red-400 hover:text-red-300 font-medium transition-colors py-1 min-h-[44px]"
                >
                  Stop sharing
                </button>
              </div>
            </div>
          )}
        </div>

        {/* First Share Notice Modal */}
        <AnimatePresence>
          {showFirstShareNotice && (
            <div
              className="absolute inset-0 z-20 bg-surface/95 backdrop-blur-md p-6 flex flex-col justify-between"
              role="alertdialog"
              aria-labelledby="confirm-share-title"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 id="confirm-share-title" className="text-lg font-bold text-foreground">
                  Confirm What Visitors Will See
                </h3>
                <div className="space-y-2 text-xs text-text-muted leading-relaxed">
                  <p>Before you create a public link, here is our strict privacy guarantee:</p>
                  <ul className="list-disc pl-5 space-y-1 text-foreground">
                    <li>List name, items, notes, and live catalog prices will be visible to anyone with the link.</li>
                    <li>Your personal email, home address, and other lists are NEVER exposed.</li>
                    <li>You can revoke or invalidate this link at any time with one click.</li>
                  </ul>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleConfirmFirstShare}
                  className="flex-1 bg-accent hover:bg-accent-hover text-background font-semibold py-3 rounded-xl text-sm transition-colors min-h-[44px]"
                >
                  I Understand, Share Link
                </button>
                <button
                  type="button"
                  onClick={() => setShowFirstShareNotice(false)}
                  className="px-4 py-3 rounded-xl bg-surface-hover text-foreground text-sm font-medium hover:bg-surface-active transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
