'use client';

import { useRecentlyViewed } from '@/contexts/RecentlyViewedContext';
import Link from 'next/link';

export function RecentlyViewed() {
  const { recentProducts } = useRecentlyViewed();

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-16 border-t border-border">
      <div className="container mx-auto px-4 md:px-8">
        <h3 className="text-2xl font-bold tracking-tight mb-8 text-foreground">Recently Viewed</h3>
        
        <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-4">
          {recentProducts.map(product => (
            <Link 
              key={`recent-${product.id}`} 
              href={`/products/${product.id}`}
              className="group block w-48 shrink-0"
            >
              <div className="w-full aspect-square bg-muted rounded-xl mb-4 overflow-hidden relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h4 className="font-semibold text-foreground text-sm truncate">{product.name}</h4>
              <p className="text-text-muted text-sm">${product.price.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
