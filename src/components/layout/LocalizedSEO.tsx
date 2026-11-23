'use client';

import React from 'react';
import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
import { generateHreflangTags } from '@/lib/i18n/seo';

export function LocalizedSEO() {
  const pathname = usePathname() || '/';
  const { locale } = useLocale();
  const { canonical, alternates } = generateHreflangTags(pathname, locale);

  return (
    <>
      <link rel="canonical" href={canonical} />
      {alternates.map((alt) => (
        <link key={alt.hrefLang} rel="alternate" hrefLang={alt.hrefLang} href={alt.href} />
      ))}
    </>
  );
}
