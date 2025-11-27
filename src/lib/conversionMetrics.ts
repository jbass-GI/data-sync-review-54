import { Submission } from '@/types/submission';
import { FundingRecord, ConversionMetrics } from '@/types/funding';

export interface EnrichedSubmission extends Submission {
  // Funding data
  fundingDate?: Date;
  fundedAmount?: number;
  managementFee?: number;
  fundingISO?: string;
  
  // Calculated
  isFunded: boolean;
  daysToFund?: number;
  offerToFundedRatio?: number;
  fundingStatus: 'Funded' | 'Offered' | 'In Review' | 'Submitted';
}

/**
 * Enrich submissions with funding data
 */
export function enrichSubmissionsWithFunding(
  submissions: Submission[],
  matched: Array<{ submission: Submission; funding: FundingRecord }>
): EnrichedSubmission[] {
  const fundingMap = new Map(
    matched.map(m => [m.submission.name, m.funding])
  );
  
  return submissions.map(submission => {
    const funding = fundingMap.get(submission.name);
    
    const enriched: EnrichedSubmission = {
      ...submission,
      fundingDate: funding?.fundingDate,
      fundedAmount: funding?.fundedAmount,
      managementFee: funding?.managementFee,
      fundingISO: funding?.partnerNormalized,
      isFunded: !!funding,
      daysToFund: funding ? 
        Math.floor((funding.fundingDate.getTime() - submission.leadSubmitted.getTime()) / (1000 * 60 * 60 * 24)) : 
        undefined,
      offerToFundedRatio: funding && submission.offerAmount ? 
        funding.fundedAmount / submission.offerAmount : 
        undefined,
      fundingStatus: funding ? 'Funded' :
        submission.stageCategory === 'Offered' ? 'Offered' :
        submission.stageCategory === 'In Review' ? 'In Review' : 'Submitted'
    };
    
    return enriched;
  });
}

/**
 * Calculate conversion metrics by ISO
 */
export function calculateConversionMetrics(submissions: EnrichedSubmission[]): ConversionMetrics[] {
  // Group by ISO
  const isoGroups = submissions.reduce((acc, sub) => {
    const iso = sub.isoNormalized;
    if (!acc[iso]) {
      acc[iso] = [];
    }
    acc[iso].push(sub);
    return acc;
  }, {} as Record<string, EnrichedSubmission[]>);
  
  const metrics: ConversionMetrics[] = [];
  
  for (const [iso, subs] of Object.entries(isoGroups)) {
    if (iso === 'UNKNOWN') continue;
    
    const totalSubmissions = subs.length;
    const fundedSubs = subs.filter(s => s.isFunded);
    const fundedCount = fundedSubs.length;
    const offeredCount = subs.filter(s => 
      s.fundingStatus === 'Offered' || s.isFunded
    ).length;
    
    const overallConversionRate = totalSubmissions > 0 ? (fundedCount / totalSubmissions) * 100 : 0;
    const submissionToOfferRate = totalSubmissions > 0 ? (offeredCount / totalSubmissions) * 100 : 0;
    const offerToFundedRate = offeredCount > 0 ? (fundedCount / offeredCount) * 100 : 0;
    
    const totalRevenue = fundedSubs.reduce((sum, s) => sum + (s.managementFee || 0), 0);
    
    const daysToFundValues = fundedSubs
      .map(s => s.daysToFund)
      .filter((d): d is number => d !== undefined);
    const avgDaysToFund = daysToFundValues.length > 0
      ? daysToFundValues.reduce((sum, d) => sum + d, 0) / daysToFundValues.length
      : 0;
    
    const offerRatios = fundedSubs
      .map(s => s.offerToFundedRatio)
      .filter((r): r is number => r !== undefined);
    const avgOfferToFundedRatio = offerRatios.length > 0
      ? offerRatios.reduce((sum, r) => sum + r, 0) / offerRatios.length
      : 0;
    
    const offerAmounts = subs.map(s => s.offerAmount).filter(a => a > 0);
    const avgOfferAmount = offerAmounts.length > 0
      ? offerAmounts.reduce((sum, a) => sum + a, 0) / offerAmounts.length
      : 0;
    
    const fundedAmounts = fundedSubs.map(s => s.fundedAmount).filter((a): a is number => a !== undefined && a > 0);
    const avgFundedAmount = fundedAmounts.length > 0
      ? fundedAmounts.reduce((sum, a) => sum + a, 0) / fundedAmounts.length
      : 0;
    
    metrics.push({
      iso,
      totalSubmissions,
      fundedCount,
      offeredCount,
      overallConversionRate,
      submissionToOfferRate,
      offerToFundedRate,
      totalRevenue,
      avgDaysToFund,
      avgOfferToFundedRatio,
      avgOfferAmount,
      avgFundedAmount,
      minDaysToFund: daysToFundValues.length > 0 ? Math.min(...daysToFundValues) : undefined,
      maxDaysToFund: daysToFundValues.length > 0 ? Math.max(...daysToFundValues) : undefined
    });
  }
  
  return metrics.sort((a, b) => b.totalSubmissions - a.totalSubmissions);
}

/**
 * Calculate overall conversion stats
 */
export function calculateOverallStats(submissions: EnrichedSubmission[]) {
  const funded = submissions.filter(s => s.isFunded);
  const offered = submissions.filter(s => s.fundingStatus === 'Offered' || s.isFunded);
  
  return {
    totalSubmissions: submissions.length,
    fundedCount: funded.length,
    offeredCount: offered.length,
    overallConversionRate: submissions.length > 0 ? (funded.length / submissions.length) * 100 : 0,
    submissionToOfferRate: submissions.length > 0 ? (offered.length / submissions.length) * 100 : 0,
    offerToFundedRate: offered.length > 0 ? (funded.length / offered.length) * 100 : 0,
    totalRevenue: funded.reduce((sum, s) => sum + (s.managementFee || 0), 0),
    avgDaysToFund: funded.length > 0
      ? funded.reduce((sum, s) => sum + (s.daysToFund || 0), 0) / funded.length
      : 0
  };
}
