'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-foreground mb-3">
          {t('errorPage.title') || 'Something went wrong'}
        </h2>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          {t('errorPage.desc') || 'An unexpected error occurred while rendering this page.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            {t('errorPage.retry') || 'Try Again'}
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold hover:bg-surface-hover transition-colors"
          >
            {t('nav.home') || 'Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}
