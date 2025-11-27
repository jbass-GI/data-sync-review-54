// Partner Normalization System
// Handles misspellings, spacing variations, slash-separated partnerships, and case insensitivity

// Master list of known partners for fuzzy matching
export const MASTER_PARTNERS = [
  "CAPITAL GURUS",
  "AFN",
  "LENDFLOW",
  "GLAZER/SAMSON",
  "PLATFORM",
  "DIRECT"
] as const;

// Normalization mappings for common variations
const PARTNER_MAPPINGS: Record<string, string> = {
  // Capital Gurus variations
  "CAPTIAL GURUS": "CAPITAL GURUS",
  "CAPITALGURUS": "CAPITAL GURUS",
  "CAPITAL GURU": "CAPITAL GURUS",
  "CAP GURUS": "CAPITAL GURUS",
  "CAPITAL GUROS": "CAPITAL GURUS",
  "CAPITAL GRUS": "CAPITAL GURUS",
  
  // AFN variations
  "A.F.N.": "AFN",
  "A.F.N": "AFN",
  "A F N": "AFN",
  "ALTERNATIVE FUNDING NETWORK": "AFN",
  "ALT FUNDING NETWORK": "AFN",
  "ALTFUNDING": "AFN",
  
  // Lendflow variations
  "LEND FLOW": "LENDFLOW",
  "LENFLOW": "LENDFLOW",
  "LEND-FLOW": "LENDFLOW",
  "LANDFLOW": "LENDFLOW",
  
  // Glazer/Samson variations (after slash normalization)
  "GLAZERSAMSON": "GLAZER/SAMSON",
  "SAMSONGLAZ": "GLAZER/SAMSON",
  "GLAZER SAMSON": "GLAZER/SAMSON",
  "SAMSON GLAZER": "GLAZER/SAMSON",
  
  // Platform variations
  "PLATFROM": "PLATFORM",
  "PLAT FORM": "PLATFORM",
  
  // Direct variations
  "DIREC": "DIRECT",
  "DRECT": "DIRECT",
  "IN-HOUSE": "DIRECT",
  "INHOUSE": "DIRECT"
};

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to catch typos
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calculate distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Advanced fuzzy matching using Levenshtein distance
 * Finds the closest matching partner from the master list
 */
function advancedFuzzyMatch(inputText: string, knownPartners: readonly string[]): string {
  // If exact match exists, return it
  if (knownPartners.includes(inputText)) {
    return inputText;
  }

  // Find closest match using edit distance
  let minDistance = 999;
  let bestMatch = inputText;

  for (const knownPartner of knownPartners) {
    const distance = levenshteinDistance(inputText, knownPartner);
    
    // If very similar (1-2 character difference), use known partner
    if (distance <= 2 && distance < minDistance) {
      minDistance = distance;
      bestMatch = knownPartner;
    }
  }

  return bestMatch;
}

/**
 * Apply fuzzy matching dictionary for known misspellings
 */
function applyFuzzyMatch(text: string): string {
  return PARTNER_MAPPINGS[text] || text;
}

/**
 * Main normalization function
 * Standardizes ALL partner entries to handle:
 * - Misspellings
 * - Spacing variations
 * - Slash-separated partnerships in ANY order
 * - Case insensitivity
 */
export function normalizePartner(rawPartnerText: string): string {
  if (!rawPartnerText) return "UNKNOWN";

  // Step 1: Basic cleanup
  let text = rawPartnerText.trim();
  text = text.toUpperCase();
  // Replace multiple spaces with single space
  text = text.replace(/\s+/g, ' ');

  // Step 2: Handle slash-separated partnerships
  if (text.includes('/')) {
    // Remove spaces around slash
    text = text.replace(/\s*\/\s*/g, '/');
    
    const partners = text.split('/');
    if (partners.length === 2) {
      const partner1 = partners[0].trim();
      const partner2 = partners[1].trim();
      
      // Sort alphabetically to ensure consistent order
      // This makes "Glazer/Samson" = "Samson/Glazer"
      if (partner1 < partner2) {
        text = `${partner1}/${partner2}`;
      } else {
        text = `${partner2}/${partner1}`;
      }
    }
  }

  // Step 3: Apply fuzzy matching dictionary for known misspellings
  text = applyFuzzyMatch(text);

  // Step 4: Apply advanced fuzzy matching if still not in master list
  text = advancedFuzzyMatch(text, MASTER_PARTNERS);

  return text;
}

/**
 * Get channel type based on normalized partner name
 * Note: Platform is treated as ISO per business requirements
 */
export function getChannelTypeFromNormalized(normalizedPartner: string): 'Direct' | 'ISO' {
  if (normalizedPartner === 'DIRECT') return 'Direct';
  return 'ISO'; // Platform and all other partners are ISOs
}
