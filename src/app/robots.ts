import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/checkout/',
        '/checkout/success',
        '/api/',
        '/account/',
        '/admin/',
      ],
    },
  };
}
