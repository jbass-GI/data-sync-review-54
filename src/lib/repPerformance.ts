import { EnrichedSubmission } from './conversionMetrics';

export interface RepPerformance {
  repName: string;
  iso: string;
  isoNormalized: string;
  
  // Volume metrics
  totalSubmissions: number;
  fundedDeals: number;
  offeredDeals: number;
  
  // Conversion rates
  overallConversionRate: number;
  submissionToOfferRate: number;
  offerToFundedRate: number;
  
  // Financial metrics
  totalRevenue: number;
  avgOfferAmount: number;
  avgFundedAmount: number;
  
  // Efficiency metrics
  avgDaysToFund: number;
  offerAccuracyRate: number; // fundedAmount / offerAmount avg
  
  // Ranking within ISO
  rankWithinISO: number;
  totalRepsInISO: number;
}

/**
 * Calculate performance metrics for each rep within their ISO
 */
export function calculateRepPerformance(submissions: EnrichedSubmission[]): RepPerformance[] {
  // Group by ISO and Rep
  const byRep = submissions
    .filter(s => s.rep && s.rep.trim() !== '')
    .reduce((acc, sub) => {
      const key = `${sub.isoNormalized}|${sub.rep}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(sub);
      return acc;
    }, {} as Record<string, EnrichedSubmission[]>);
  
  const repStats: RepPerformance[] = [];
  
  for (const [key, repRecords] of Object.entries(byRep)) {
    const [iso, rep] = key.split('|');
    const funded = repRecords.filter(r => r.isFunded);
    const offered = repRecords.filter(r => 
      r.fundingStatus === 'Offered' || r.isFunded
    );
    
    const offerAccuracyRatios = funded
      .filter(r => r.offerAmount > 0 && r.fundedAmount)
      .map(r => (r.fundedAmount! / r.offerAmount));
    
    repStats.push({
      repName: rep,
      iso: iso,
      isoNormalized: iso,
      totalSubmissions: repRecords.length,
      fundedDeals: funded.length,
      offeredDeals: offered.length,
      overallConversionRate: repRecords.length > 0 
        ? (funded.length / repRecords.length) * 100 
        : 0,
      submissionToOfferRate: repRecords.length > 0
        ? (offered.length / repRecords.length) * 100
        : 0,
      offerToFundedRate: offered.length > 0 
        ? (funded.length / offered.length) * 100 
        : 0,
      totalRevenue: funded.reduce((sum, r) => sum + (r.managementFee || 0), 0),
      avgOfferAmount: repRecords.reduce((sum, r) => sum + r.offerAmount, 0) / repRecords.length,
      avgFundedAmount: funded.length > 0
        ? funded.reduce((sum, r) => sum + (r.fundedAmount || 0), 0) / funded.length
        : 0,
      avgDaysToFund: funded.length > 0
        ? funded.reduce((sum, r) => sum + (r.daysToFund || 0), 0) / funded.length
        : 0,
      offerAccuracyRate: offerAccuracyRatios.length > 0
        ? (offerAccuracyRatios.reduce((sum, r) => sum + r, 0) / offerAccuracyRatios.length) * 100
        : 0,
      rankWithinISO: 0,
      totalRepsInISO: 0
    });
  }
  
  // Calculate rankings within each ISO
  const byISO = repStats.reduce((acc, rep) => {
    if (!acc[rep.isoNormalized]) {
      acc[rep.isoNormalized] = [];
    }
    acc[rep.isoNormalized].push(rep);
    return acc;
  }, {} as Record<string, RepPerformance[]>);
  
  // Sort and rank reps within each ISO
  for (const iso in byISO) {
    const reps = byISO[iso].sort((a, b) => b.overallConversionRate - a.overallConversionRate);
    reps.forEach((rep, index) => {
      rep.rankWithinISO = index + 1;
      rep.totalRepsInISO = reps.length;
    });
  }
  
  return repStats;
}

/**
 * Get rep performance by ISO
 */
export function getRepsByISO(repPerformance: RepPerformance[], iso: string): RepPerformance[] {
  return repPerformance
    .filter(r => r.isoNormalized === iso)
    .sort((a, b) => b.overallConversionRate - a.overallConversionRate);
}

/**
 * Get leaderboard sorted by different criteria
 */
export function getRepLeaderboard(
  repPerformance: RepPerformance[],
  sortBy: 'conversion' | 'revenue' | 'volume',
  minSubmissions: number = 5
): RepPerformance[] {
  const qualified = repPerformance.filter(r => r.totalSubmissions >= minSubmissions);
  
  switch (sortBy) {
    case 'conversion':
      return qualified.sort((a, b) => b.overallConversionRate - a.overallConversionRate);
    case 'revenue':
      return qualified.sort((a, b) => b.totalRevenue - a.totalRevenue);
    case 'volume':
      return qualified.sort((a, b) => b.totalSubmissions - a.totalSubmissions);
    default:
      return qualified;
  }
}
