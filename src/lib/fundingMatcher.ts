import { Submission } from '@/types/submission';
import { FundingRecord, FundingMatch, UnmatchedSubmission } from '@/types/funding';

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Clean business name for matching
 */
function cleanName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

/**
 * Find best funding match for a submission
 */
export function findFundingMatch(
  submissionName: string,
  fundingRecords: FundingRecord[]
): { record: FundingRecord | null; matchType: FundingMatch['matchType']; confidence: number } {
  const cleanSubmission = cleanName(submissionName);
  
  // Step 1: Exact match
  let match = fundingRecords.find(f => 
    cleanName(f.dealName) === cleanSubmission
  );
  if (match) return { record: match, matchType: 'exact', confidence: 100 };
  
  // Step 2: Starts with match (handles "Deal Name 1.75%" format)
  match = fundingRecords.find(f => {
    const cleanFunding = cleanName(f.dealName);
    return cleanFunding.startsWith(cleanSubmission) || 
           cleanSubmission.startsWith(cleanFunding);
  });
  if (match) return { record: match, matchType: 'starts-with', confidence: 90 };
  
  // Step 3: Contains match
  match = fundingRecords.find(f => {
    const cleanFunding = cleanName(f.dealName);
    return cleanFunding.includes(cleanSubmission) ||
           cleanSubmission.includes(cleanFunding);
  });
  if (match) return { record: match, matchType: 'contains', confidence: 75 };
  
  // Step 4: Fuzzy match using Levenshtein distance
  const fuzzyMatches = fundingRecords
    .map(f => ({
      record: f,
      distance: levenshteinDistance(cleanSubmission, cleanName(f.dealName))
    }))
    .filter(m => m.distance <= 5) // Within 5 character edits
    .sort((a, b) => a.distance - b.distance);
  
  if (fuzzyMatches.length > 0) {
    const bestMatch = fuzzyMatches[0];
    const confidence = Math.max(50, 100 - (bestMatch.distance * 10));
    return { 
      record: bestMatch.record, 
      matchType: 'fuzzy', 
      confidence 
    };
  }
  
  return { record: null, matchType: 'exact', confidence: 0 };
}

/**
 * Match submissions to funding records
 */
export function matchSubmissionsToFunding(
  submissions: Submission[],
  fundingRecords: FundingRecord[]
): {
  matched: Array<{ submission: Submission; funding: FundingRecord; matchType: FundingMatch['matchType']; confidence: number }>;
  unmatched: Submission[];
} {
  const matched: Array<{ 
    submission: Submission; 
    funding: FundingRecord; 
    matchType: FundingMatch['matchType']; 
    confidence: number 
  }> = [];
  const unmatched: Submission[] = [];
  const usedFundingIds = new Set<string>();
  
  submissions.forEach(submission => {
    // Only try to match if submission is in a stage that could have been funded
    const couldBeFunded = ['Offered', 'Funded'].includes(submission.stageCategory);
    
    if (!couldBeFunded) {
      // Don't try to match early-stage submissions
      return;
    }
    
    const availableFunding = fundingRecords.filter(
      f => !usedFundingIds.has(f.dealName)
    );
    
    const matchResult = findFundingMatch(submission.name, availableFunding);
    
    if (matchResult.record && matchResult.confidence >= 50) {
      matched.push({
        submission,
        funding: matchResult.record,
        matchType: matchResult.matchType,
        confidence: matchResult.confidence
      });
      usedFundingIds.add(matchResult.record.dealName);
    } else if (couldBeFunded) {
      unmatched.push(submission);
    }
  });
  
  return { matched, unmatched };
}

/**
 * Get potential matches for manual review
 */
export function getPotentialMatches(
  submissionName: string,
  fundingRecords: FundingRecord[],
  limit: number = 5
): Array<{ record: FundingRecord; score: number }> {
  const cleanSubmission = cleanName(submissionName);
  
  const scored = fundingRecords.map(f => {
    const cleanFunding = cleanName(f.dealName);
    let score = 0;
    
    // Exact match
    if (cleanFunding === cleanSubmission) score = 100;
    // Starts with
    else if (cleanFunding.startsWith(cleanSubmission) || cleanSubmission.startsWith(cleanFunding)) score = 90;
    // Contains
    else if (cleanFunding.includes(cleanSubmission) || cleanSubmission.includes(cleanFunding)) score = 75;
    // Fuzzy match
    else {
      const distance = levenshteinDistance(cleanSubmission, cleanFunding);
      if (distance <= 10) {
        score = Math.max(20, 70 - (distance * 5));
      }
    }
    
    return { record: f, score };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
