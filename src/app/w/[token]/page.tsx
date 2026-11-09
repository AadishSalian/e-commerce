import { Metadata } from 'next';
import Link from 'next/link';
import { getWishlistByShareToken, enrichWishlist } from '@/lib/wishlist/service';
import { SharedWishlistClient } from '@/components/wishlist/SharedWishlistClient';
import { FolderX, ArrowRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const data = getWishlistByShareToken(token);

  if (!data) {
    return {
      title: 'Wishlist Not Available | MATTE',
      robots: { index: false, follow: false },
    };
  }

  const { wishlist, items } = data;
  const ownerPart = wishlist.shareOptions?.showOwnerName && wishlist.shareOptions.ownerDisplayName
    ? ` by ${wishlist.shareOptions.ownerDisplayName}`
    : '';

  const title = `${wishlist.name}${ownerPart} | MATTE`;
  // Safe preview: Never include prices or personal notes in Open Graph previews
  const description = wishlist.description || `Explore ${items.length} curated objects on MATTE.`;

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      // Safe preview images only
      images: [
        {
          url: '/og-wishlist.png',
          width: 1200,
          height: 630,
          alt: wishlist.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SharedWishlistPage({ params }: PageProps) {
  const { token } = await params;
  const data = getWishlistByShareToken(token);

  if (!data) {
    // Respond identically for invalid, expired, or revoked tokens
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center space-y-6 bg-surface border border-border rounded-2xl p-8 md:p-10">
          <div className="w-14 h-14 rounded-full bg-surface-active border border-border/80 text-text-muted flex items-center justify-center mx-auto">
            <FolderX className="w-6 h-6 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              This list isn’t available
            </h1>
            <p className="text-sm text-text-muted leading-relaxed">
              The link may have expired, been revoked by the owner, or is no longer shared.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-background font-semibold px-6 py-3 rounded-xl text-sm transition-colors min-h-[44px]"
            >
              <span>Explore collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Enrich items for visitor (isSharedView = true strips owner's personal "since you saved it" drop badges)
  const enriched = await enrichWishlist(data.wishlist, data.items, {
    isSharedView: true,
    claims: data.claims,
  });

  const clientData = {
    id: enriched.id,
    name: enriched.name,
    description: enriched.description,
    ownerDisplayName: enriched.shareOptions?.showOwnerName
      ? enriched.shareOptions.ownerDisplayName || 'A shopper'
      : null,
    isGiftList: enriched.isGiftList,
    occasionDate: enriched.occasionDate,
    itemCount: enriched.itemCount,
    items: enriched.items,
    createdAt: enriched.createdAt,
  };

  return (
    <div className="min-h-screen pt-4 md:pt-8 pb-32 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <SharedWishlistClient token={token} initialData={clientData} />
    </div>
  );
}
