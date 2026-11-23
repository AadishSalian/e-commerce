/**
 * ICU MessageFormat Parser and Renderer
 * Supports:
 * - Variable interpolation: {name}
 * - Plurals with Intl.PluralRules (all CLDR categories: zero, one, two, few, many, other, plus exact =0, =1)
 * - Hash (#) replacement with localized number
 * - Selects: {gender, select, male {He} female {She} other {They}}
 * - Pseudo-localization for en-XA (+40% expansion) and ar-XB (pseudo-RTL)
 */

const ACCENT_MAP: Record<string, string> = {
  a: 'ȧ', b: 'ɓ', c: 'ƈ', d: 'ḋ', e: 'ė', f: 'ƒ', g: 'ɠ', h: 'ħ', i: 'î', j: 'ĵ',
  k: 'ƙ', l: 'ł', m: 'ɱ', n: 'ñ', o: 'ǿ', p: 'ƥ', q: 'q', r: 'ř', s: 'š', t: 'ţ',
  u: 'û', v: 'ṽ', w: 'ŵ', x: 'ҳ', y: 'ý', z: 'ž',
  A: 'Ȧ', B: 'Ɓ', C: 'Ƈ', D: 'Ḋ', E: 'Ė', F: 'Ƒ', G: 'Ɠ', H: 'Ħ', I: 'Î', J: 'Ĵ',
  K: 'Ƙ', L: 'Ł', M: 'Ṁ', N: 'Ñ', O: 'Ǿ', P: 'Ƥ', Q: 'Q', R: 'Ř', S: 'Š', T: 'Ţ',
  U: 'Û', V: 'Ṽ', W: 'Ŵ', X: 'Ҳ', Y: 'Ý', Z: 'Ž',
};

/**
 * Transforms string to pseudo-localized string:
 * - Accents Latin glyphs
 * - Expands length by ~40%
 * - Encloses in [!!! ... !!!] markers
 */
export function pseudoLocalize(str: string): string {
  if (!str) return str;
  // Preserve placeholder tokens like {count} or HTML tags
  const tokens = str.split(/(\{[^}]+\}|<[^>]+>)/g);

  const transformed = tokens.map((part) => {
    if (part.startsWith('{') || part.startsWith('<')) {
      return part;
    }
    const accented = part
      .split('')
      .map((ch) => ACCENT_MAP[ch] || ch)
      .join('');
    // Add ~40% expansion text
    const extraLen = Math.max(1, Math.round(part.length * 0.4));
    const padding = ' ' + '▪'.repeat(Math.min(extraLen, 8));
    return accented + (part.trim().length > 3 ? padding : '');
  }).join('');

  return `[!!! ${transformed} !!!]`;
}

export function pseudoLocalizeRTL(str: string): string {
  if (!str) return str;
  const pseudo = pseudoLocalize(str);
  // Prepend right-to-left mark and pseudo-Arabic indicator
  return `\u200F[RTL: ${pseudo}]\u200F`;
}

/**
 * Memoized Intl.PluralRules cache to avoid recreating expensive Intl formatters
 */
const pluralRulesCache = new Map<string, Intl.PluralRules>();

function getPluralRules(locale: string): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    try {
      rules = new Intl.PluralRules(locale);
    } catch {
      rules = new Intl.PluralRules('en-IN');
    }
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

/**
 * Parses nested ICU block: "{var, plural, one {# item} other {# items}}"
 */
interface ParsedBranch {
  key: string;
  template: string;
}

function parseIcuBranches(content: string): ParsedBranch[] {
  const branches: ParsedBranch[] = [];
  let index = 0;
  const len = content.length;

  while (index < len) {
    // Skip whitespace
    while (index < len && /\s/.test(content[index])) index++;
    if (index >= len) break;

    // Read branch key (e.g. "one", "=0", "other")
    let key = '';
    while (index < len && !/\s|\{/.test(content[index])) {
      key += content[index++];
    }

    // Skip to opening brace
    while (index < len && content[index] !== '{') index++;
    if (index >= len) break;
    index++; // skip '{'

    // Read until matching closing brace
    let depth = 1;
    let template = '';
    while (index < len && depth > 0) {
      const ch = content[index++];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth > 0) template += ch;
    }

    if (key) {
      branches.push({ key: key.trim(), template });
    }
  }

  return branches;
}

/**
 * Evaluates ICU message string with provided parameters
 */
export function formatIcuMessage(
  template: string,
  values: Record<string, any> = {},
  locale: string = 'en-IN'
): string {
  if (!template) return '';

  // Scan for top-level {variable, ...} blocks
  let result = '';
  let i = 0;
  const len = template.length;

  while (i < len) {
    if (template[i] === '{') {
      let depth = 1;
      let block = '';
      i++; // skip '{'

      while (i < len && depth > 0) {
        const ch = template[i++];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        if (depth > 0) block += ch;
      }

      // Check if block has type: {var, plural, ...} or {var, select, ...}
      const firstComma = block.indexOf(',');
      if (firstComma === -1) {
        // Simple variable substitution: {name}
        const varName = block.trim();
        const val = values[varName];
        result += val !== undefined ? String(val) : '';
      } else {
        const varName = block.slice(0, firstComma).trim();
        const rest = block.slice(firstComma + 1).trim();
        const secondComma = rest.indexOf(',');
        const type = secondComma === -1 ? rest : rest.slice(0, secondComma).trim().toLowerCase();
        const branchContent = secondComma === -1 ? '' : rest.slice(secondComma + 1).trim();

        const rawVal = values[varName];
        const branches = parseIcuBranches(branchContent);

        if (type === 'plural') {
          const numVal = Number(rawVal) || 0;
          const exactKey = `=${numVal}`;
          let selectedTemplate = '';

          // 1. Check exact match like =0 or =1
          const exactMatch = branches.find((b) => b.key === exactKey);
          if (exactMatch) {
            selectedTemplate = exactMatch.template;
          } else {
            // 2. Query CLDR plural category
            const pluralCategory = getPluralRules(locale).select(numVal);
            const categoryMatch = branches.find((b) => b.key === pluralCategory);
            if (categoryMatch) {
              selectedTemplate = categoryMatch.template;
            } else {
              // 3. Fallback to 'other'
              const otherMatch = branches.find((b) => b.key === 'other');
              selectedTemplate = otherMatch ? otherMatch.template : '';
            }
          }

          // Replace '#' with formatted number
          const formattedNumber = new Intl.NumberFormat(locale).format(numVal);
          const replaced = selectedTemplate.replace(/#/g, formattedNumber);
          // Recursively evaluate any inner variables
          result += formatIcuMessage(replaced, values, locale);
        } else if (type === 'select') {
          const stringVal = String(rawVal);
          const match = branches.find((b) => b.key === stringVal) || branches.find((b) => b.key === 'other');
          if (match) {
            result += formatIcuMessage(match.template, values, locale);
          }
        } else {
          // Unsupported or fallback
          result += String(rawVal ?? '');
        }
      }
    } else {
      result += template[i++];
    }
  }

  return result;
}
