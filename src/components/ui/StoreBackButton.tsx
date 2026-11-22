'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getLastListing, navigateBackToResults, LastListingRecord } from '@/lib/scroll-restoration';

export function StoreBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [lastListing, setLastListing] = useState<LastListingRecord | null>(null);

  useEffect(() => {
    setLastListing(getLastListing());
  }, [pathname]);

  // Don't show the back button on the home page
  if (pathname === '/') return null;

  const isProductPage = pathname.startsWith('/products/');

  if (isProductPage && lastListing?.url) {
    return (
      <div className="fixed top-36 md:top-28 left-4 md:left-8 z-[40]">
        <button
          onClick={() => navigateBackToResults(router, lastListing.url)}
          className="inline-flex items-center gap-2 text-text-muted hover:text-foreground transition-colors font-medium text-xs tracking-[0.2em] uppercase cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Results
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-36 md:top-28 left-4 md:left-8 z-[40]">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-text-muted hover:text-foreground transition-colors font-medium text-xs tracking-[0.2em] uppercase"
      >
        <ArrowLeft className="w-4 h-4" /> Store
      </Link>
    </div>
  );
}

