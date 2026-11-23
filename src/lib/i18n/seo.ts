import { LOCALES, DEFAULT_LOCALE, BASE_SETTLEMENT_CURRENCY } from './config';
import { formatHonestPrice } from './currencyEngine';
import { getLocalizedProduct } from './catalogLocalization';

export interface HreflangLink {
  hrefLang: string;
  href: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://matte.design';

/**
 * Generates canonical link and hreflang alternates (including x-default) for any route path
 */
export function generateHreflangTags(currentPath: string, activeLocale: string = DEFAULT_LOCALE): {
  canonical: string;
  alternates: HreflangLink[];
} {
  // Strip existing locale prefix if path contains it (e.g. /hi/products -> /products)
  const segments = currentPath.split('/').filter(Boolean);
  const firstSegment = segments[0];
  const isPrefixed = LOCALES.some((l) => l.code.toLowerCase() === firstSegment?.toLowerCase() || l.code.split('-')[0].toLowerCase() === firstSegment?.toLowerCase());
  const cleanPath = isPrefixed ? '/' + segments.slice(1).join('/') : currentPath || '/';

  // Self-referencing canonical
  const canonical = `${SITE_URL}/${activeLocale}${cleanPath === '/' ? '' : cleanPath}`;

  // Hreflang alternates for all enabled locales
  const enabledLocales = LOCALES.filter((l) => l.enabled && !l.isPseudo);
  const alternates: HreflangLink[] = enabledLocales.map((loc) => ({
    hrefLang: loc.code,
    href: `${SITE_URL}/${loc.code}${cleanPath === '/' ? '' : cleanPath}`,
  }));

  // Append x-default pointing to default locale en-IN
  alternates.push({
    hrefLang: 'x-default',
    href: `${SITE_URL}/${DEFAULT_LOCALE}${cleanPath === '/' ? '' : cleanPath}`,
  });

  return {
    canonical,
    alternates,
  };
}

/**
 * Generates localized Product schema structured data (Schema.org / JSON-LD)
 * with localized name, description, and currency
 */
export function generateProductJsonLd({
  product,
  locale = DEFAULT_LOCALE,
  currency = BASE_SETTLEMENT_CURRENCY,
}: {
  product: { id: string; name: string; description: string; price: number; category: string; image: string };
  locale?: string;
  currency?: string;
}) {
  const localized = getLocalizedProduct(product.id, product, locale);
  const priceInfo = formatHonestPrice({
    baseAmountINR: product.price,
    targetCurrency: currency,
    locale,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: localized.name,
    description: localized.description,
    image: product.image,
    category: localized.category,
    offers: {
      '@type': 'Offer',
      price: priceInfo.targetMajor.toFixed(2),
      priceCurrency: priceInfo.currency,
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2028-12-31',
      seller: {
        '@type': 'Organization',
        name: 'MATTE.',
      },
    },
  };
}
