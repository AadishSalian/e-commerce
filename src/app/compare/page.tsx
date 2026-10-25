'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MOCK_PRODUCTS, Product } from '@/lib/mockData';
import { useCompare } from '@/contexts/CompareContext';
import { ComparisonView } from '@/components/compare/ComparisonView';

function CompareContent() {
  const searchParams = useSearchParams();
  const { compareQueue, items } = useCompare();

  const [urlProducts, setUrlProducts] = useState<Product[] | null>(null);

  // Parse `ids` from query string if present
  const idsQuery = searchParams.get('ids');

  useEffect(() => {
    if (!idsQuery) {
      setUrlProducts(null);
      return;
    }

    const ids = idsQuery.split(',').map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      setUrlProducts(null);
      return;
    }

    // Attempt to hydrate from MOCK_PRODUCTS first
    const matched = ids
      .map((id) => MOCK_PRODUCTS.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));

    if (matched.length > 0) {
      setUrlProducts(matched);
    } else {
      // Or fetch from batch API
      fetch(`/api/products/batch?ids=${ids.join(',')}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.products) {
            setUrlProducts(data.products);
          }
        })
        .catch((err) => {
          console.warn('Failed to load shared comparison:', err);
        });
    }
  }, [idsQuery]);

  // If URL has specific products, prioritize those; otherwise use the shopper's active queue
  const displayProducts = useMemo(() => {
    if (urlProducts && urlProducts.length > 0) {
      return urlProducts;
    }
    return compareQueue;
  }, [urlProducts, compareQueue]);

  return <ComparisonView products={displayProducts} />;
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-24 text-center text-text-muted">
          Loading comparison...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
