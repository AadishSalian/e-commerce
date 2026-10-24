import { EngravingZone, ValidationResult, ValidationIssue } from './types';
import { CURATED_SYMBOLS } from './data';

// Standard allowed charsets
// Latin letters (uppercase, lowercase, accents), numbers, basic punctuation and curated symbols
export const ALLOWED_LATIN_PATTERN = /^[A-Za-z0-9\s.,'’"/\-_•♥✦◆∞🍃⚓╱+&!?:;()\-]+$/;

// Forbidden complex / unsupported script ranges (Arabic, Devanagari, Cyrillic, Hebrew, Thai, etc.)
export const COMPLEX_SCRIPT_REGEXES: { name: string; regex: RegExp }[] = [
  { name: 'Arabic', regex: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/ },
  { name: 'Devanagari', regex: /[\u0900-\u097F]/ },
  { name: 'Cyrillic', regex: /[\u0400-\u04FF]/ },
  { name: 'Hebrew', regex: /[\u0590-\u05FF]/ },
  { name: 'CJK', regex: /[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/ },
  { name: 'Thai', regex: /[\u0E00-\u0E7F]/ },
  { name: 'Tamil', regex: /[\u0B80-\u0BFF]/ }
];

// Emoji regex
export const EMOJI_REGEX = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;

// Zero-width and control characters to strip / reject
export const ZERO_WIDTH_CONTROL_REGEX = /[\u200B-\u200D\uFEFF\u0000-\u001F\u007F-\u009F]/g;

// HTML tag / markup pattern
export const HTML_TAG_REGEX = /<[^>]*>?/gm;

// Moderation word blocklist (profanity, hate speech, slurs)
const BLOCKED_WORDS = new Set([
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'cock', 'pussy',
  'nigger', 'nigga', 'faggot', 'fag', 'kike', 'spic', 'chink', 'retard',
  'nazi', 'hitler', 'whitepower', 'whitetrash', 'killall', 'murder', 'terrorist'
]);

/**
 * Clean and normalize text using Unicode NFC, stripping control/zero-width chars
 */
export function sanitizePersonalizationText(raw: string): string {
  if (!raw) return '';
  return raw
    .normalize('NFC')
    .replace(ZERO_WIDTH_CONTROL_REGEX, '')
    .replace(HTML_TAG_REGEX, '')
    .trimStart(); // Allow spaces between words, trim leading whitespace
}

/**
 * Character-by-character validation for real-time keystroke typing
 */
export function validateCharInput(
  char: string,
  zone: EngravingZone
): { isAllowed: boolean; errorMessage?: string } {
  // Check for emoji
  if (EMOJI_REGEX.test(char)) {
    return {
      isAllowed: false,
      errorMessage: 'Emojis cannot be engraved on this item. Please use text or curated symbols.'
    };
  }

  // Check for complex scripts not supported by engraving machine
  for (const script of COMPLEX_SCRIPT_REGEXES) {
    if (script.regex.test(char)) {
      return {
        isAllowed: false,
        errorMessage: `${script.name} script is not supported by our laser engraving head for this material.`
      };
    }
  }

  // Check against zone's allowed charset
  const allowedCuratedGlyphs = (zone.allowed_symbols || CURATED_SYMBOLS).map((s) => s.glyph);
  if (allowedCuratedGlyphs.includes(char)) {
    return { isAllowed: true };
  }

  if (ALLOWED_LATIN_PATTERN.test(char)) {
    return { isAllowed: true };
  }

  return {
    isAllowed: false,
    errorMessage: `Character "${char}" is not supported by the engraving process.`
  };
}

/**
 * Screen text against policy and hate speech blocklists
 */
export function checkContentModeration(text: string): { isSafe: boolean; flaggedWord?: string } {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  for (const word of words) {
    if (BLOCKED_WORDS.has(word)) {
      return { isSafe: false, flaggedWord: word };
    }
  }

  // Check concatenated words
  const compressed = normalized.replace(/\s+/g, '');
  for (const blocked of BLOCKED_WORDS) {
    if (blocked.length >= 4 && compressed.includes(blocked)) {
      return { isSafe: false, flaggedWord: blocked };
    }
  }

  return { isSafe: true };
}

/**
 * Full line and zone validation (used both in real-time and server-side)
 */
export function validatePersonalization(
  lines: string[],
  zone: EngravingZone
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const sanitizedLines: string[] = [];

  // Check line count limit
  if (lines.length > zone.max_lines) {
    issues.push({
      field: 'lines',
      message: `Maximum ${zone.max_lines} line${zone.max_lines > 1 ? 's' : ''} allowed.`,
      severity: 'error'
    });
  }

  lines.slice(0, zone.max_lines).forEach((line, index) => {
    const sanitized = sanitizePersonalizationText(line);
    sanitizedLines.push(sanitized);

    // Max character limit
    if (sanitized.length > zone.max_chars_per_line) {
      issues.push({
        field: 'length',
        lineIndex: index,
        message: `Line ${index + 1} exceeds ${zone.max_chars_per_line} character limit (${sanitized.length}/${zone.max_chars_per_line}).`,
        severity: 'error'
      });
    }

    // Check individual characters
    for (const char of sanitized) {
      const charCheck = validateCharInput(char, zone);
      if (!charCheck.isAllowed) {
        issues.push({
          field: 'charset',
          lineIndex: index,
          blockedChar: char,
          message: charCheck.errorMessage || `Unsupported character: "${char}"`,
          severity: 'error'
        });
        break; // One error per line is sufficient
      }
    }

    // Moderation screening
    const moderation = checkContentModeration(sanitized);
    if (!moderation.isSafe) {
      issues.push({
        field: 'moderation',
        lineIndex: index,
        message: 'This text can’t be engraved. Please try something else.',
        severity: 'error'
      });
    }
  });

  return {
    isValid: issues.filter((i) => i.severity === 'error').length === 0,
    sanitizedLines,
    issues
  };
}

/**
 * Detect potentially ambiguous characters to avoid spelling mistakes
 * e.g. '0' (zero) vs 'O' (oh), '1' (one) vs 'l' (el) vs 'I' (eye)
 */
export interface AmbiguityMatch {
  char: string;
  index: number;
  explanation: string;
}

export function detectAmbiguousCharacters(text: string): AmbiguityMatch[] {
  const matches: AmbiguityMatch[] = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '0') {
      matches.push({ char, index: i, explanation: 'Digit Zero (0)' });
    } else if (char === 'O') {
      matches.push({ char, index: i, explanation: 'Capital Letter O' });
    } else if (char === '1') {
      matches.push({ char, index: i, explanation: 'Digit One (1)' });
    } else if (char === 'l') {
      matches.push({ char, index: i, explanation: 'Lowercase L (l)' });
    } else if (char === 'I') {
      matches.push({ char, index: i, explanation: 'Capital I (eye)' });
    } else if (char === '5') {
      matches.push({ char, index: i, explanation: 'Digit Five (5)' });
    } else if (char === 'S') {
      matches.push({ char, index: i, explanation: 'Capital Letter S' });
    }
  }
  return matches;
}

/**
 * Format text spelled out for spelling confirmation (e.g. "A - N - Y - A")
 */
export function formatSpelledOutText(text: string): string {
  if (!text) return '';
  return text
    .split('')
    .map((c) => (c === ' ' ? '␣' : c))
    .join(' - ');
}
