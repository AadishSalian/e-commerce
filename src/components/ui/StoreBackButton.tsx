'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function StoreBackButton() {
  const pathname = usePathname();

  // Don't show the back button on the home page
  if (pathname === '/') return null;

  return (
    <div className="fixed top-8 left-4 md:left-8 z-[60]">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-text-muted hover:text-foreground transition-colors font-medium text-xs tracking-[0.2em] uppercase"
      >
        <ArrowLeft className="w-4 h-4" /> Store
      </Link>
    </div>
  );
}
