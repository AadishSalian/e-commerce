'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function WelcomeBanner() {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn || !user) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white px-4 py-3 text-sm flex items-center justify-center gap-2 border-b border-white/5">
      <Sparkles className="w-4 h-4 text-accent" />
      <span className="font-medium">Welcome back, {user.name}!</span>
      <span className="text-neutral-400 hidden sm:inline">|</span>
      <span className="text-neutral-300">Ready to discover your next favorite item?</span>
      <Link href="/products" className="underline underline-offset-2 hover:text-neutral-300 transition-colors ml-1">
        See recommendations
      </Link>
    </div>
  );
}
