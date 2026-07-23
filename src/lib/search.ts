import { MOCK_PRODUCTS } from './mockData';

// Helper to calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => 
    Array.from({ length: b.length + 1 }, () => 0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[a.length][b.length];
}

// Check if query is a fuzzy substring of target
function isFuzzySubstring(query: string, target: string, maxDistance: number = 2): boolean {
  if (query.length === 0) return true;
  if (target.length === 0) return false;
  
  // If query is small, exact match is better or 1 typo
  const allowedDistance = query.length <= 4 ? 1 : maxDistance;

  // Split target into words and check distance against query
  const targetWords = target.split(/\s+/);
  for (const word of targetWords) {
    if (Math.abs(word.length - query.length) > allowedDistance) continue;
    if (levenshteinDistance(query, word) <= allowedDistance) {
      return true;
    }
  }
  
  // Also check if query is a prefix of any word with typos
  for (const word of targetWords) {
    const prefix = word.substring(0, query.length);
    if (levenshteinDistance(query, prefix) <= allowedDistance) {
      return true;
    }
  }

  return false;
}

export interface SearchResult {
  product: typeof MOCK_PRODUCTS[0];
  score: number;
}

export function searchProducts(query: string): SearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results: SearchResult[] = [];

  for (const product of MOCK_PRODUCTS) {
    let score = 0;
    const name = product.name.toLowerCase();
    const description = product.description.toLowerCase();
    const category = product.category.toLowerCase();
    
    // Extract attributes for tagging
    const tags: string[] = [];
    if (product.attributes) {
      Object.values(product.attributes).forEach(val => {
        if (Array.isArray(val)) {
          tags.push(...val.map(v => v.toLowerCase()));
        } else if (typeof val === 'string') {
          tags.push(val.toLowerCase());
        }
      });
    }

    // 1. Exact name match
    if (name === normalizedQuery) {
      score += 100;
    } 
    // 2. Partial name match (substring)
    else if (name.includes(normalizedQuery)) {
      score += 50;
    }
    // Fuzzy name match
    else if (isFuzzySubstring(normalizedQuery, name)) {
      score += 30;
    }

    // 3. Category / Tag match
    if (category.includes(normalizedQuery) || isFuzzySubstring(normalizedQuery, category, 1)) {
      score += 40;
    }

    let tagMatch = false;
    for (const tag of tags) {
      if (tag.includes(normalizedQuery) || isFuzzySubstring(normalizedQuery, tag, 1)) {
        tagMatch = true;
        break;
      }
    }
    if (tagMatch) {
      score += 35;
    }

    // 4. Description match
    if (description.includes(normalizedQuery)) {
      score += 20;
    } else if (isFuzzySubstring(normalizedQuery, description)) {
      score += 10;
    }

    if (score > 0) {
      results.push({ product, score });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}
