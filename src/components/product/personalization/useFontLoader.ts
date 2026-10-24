import { useState, useEffect } from 'react';
import { EngravingFont } from '@/lib/personalization/types';

interface FontLoadState {
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

const loadedFontFamilies = new Set<string>();

/**
 * Hook to dynamically load Google fonts and track readiness via document.fonts.load
 * Prevents layout shift and avoids misleading font substitutions.
 */
export function useFontLoader(font: EngravingFont | undefined) {
  const [state, setState] = useState<FontLoadState>({
    isLoaded: false,
    isLoading: true,
    hasError: false
  });

  useEffect(() => {
    if (!font) {
      setState({ isLoaded: true, isLoading: false, hasError: false });
      return;
    }

    const fontFamilyName = font.font_family.split(',')[0].replace(/['"]/g, '').trim();

    // Already loaded in this document
    if (loadedFontFamilies.has(fontFamilyName)) {
      setState({ isLoaded: true, isLoading: false, hasError: false });
      return;
    }

    let isCancelled = false;
    setState({ isLoaded: false, isLoading: true, hasError: false });

    // Inject Google Font link tag if specified
    if (font.google_font) {
      const linkId = `gfont-${font.id}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${font.google_font}&display=swap`;
        document.head.appendChild(link);
      }
    }

    // Check with FontFaceSet API
    if (typeof document !== 'undefined' && 'fonts' in document) {
      const fontCheckSpec = `16px "${fontFamilyName}"`;
      document.fonts
        .load(fontCheckSpec)
        .then((loadedFonts) => {
          if (isCancelled) return;
          if (loadedFonts && loadedFonts.length > 0) {
            loadedFontFamilies.add(fontFamilyName);
            setState({ isLoaded: true, isLoading: false, hasError: false });
          } else {
            // Check document.fonts.check
            if (document.fonts.check(fontCheckSpec)) {
              loadedFontFamilies.add(fontFamilyName);
              setState({ isLoaded: true, isLoading: false, hasError: false });
            } else {
              // Give 350ms grace for network font to register
              setTimeout(() => {
                if (isCancelled) return;
                loadedFontFamilies.add(fontFamilyName);
                setState({ isLoaded: true, isLoading: false, hasError: false });
              }, 350);
            }
          }
        })
        .catch((err) => {
          if (isCancelled) return;
          console.warn(`Font load failed for ${font.label}:`, err);
          setState({
            isLoaded: false,
            isLoading: false,
            hasError: true,
            errorMessage: `Unable to load "${font.label}". Please select another style.`
          });
        });
    } else {
      setState({ isLoaded: true, isLoading: false, hasError: false });
    }

    return () => {
      isCancelled = true;
    };
  }, [font?.id, font?.google_font, font?.font_family]);

  return state;
}
