import { EnrichedSubmission } from './conversionMetrics';
import { format, startOfMonth } from 'date-fns';

export interface MonthlyTrend {
  month: string; // "2025-01"
  iso: string;
  submissions: number;
  funded: number;
  offers: number;
  conversionRate: number;
  revenue: number;
}

/**
 * Calculate monthly trends for each ISO
 */
export function calculateMonthlyTrends(submissions: EnrichedSubmission[]): MonthlyTrend[] {
  // Group by ISO and month
  const byISOMonth = submissions.reduce((acc, sub) => {
    const key = `${sub.isoNormalized}|${sub.submissionMonth}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(sub);
    return acc;
  }, {} as Record<string, EnrichedSubmission[]>);
  
  const trends: MonthlyTrend[] = [];
  
  for (const [key, monthRecords] of Object.entries(byISOMonth)) {
    const [iso, month] = key.split('|');
    const funded = monthRecords.filter(r => r.isFunded);
    const offered = monthRecords.filter(r => 
      r.fundingStatus === 'Offered' || r.isFunded
    );
    
    trends.push({
      month,
      iso,
      submissions: monthRecords.length,
      funded: funded.length,
      offers: offered.length,
      conversionRate: monthRecords.length > 0 
        ? (funded.length / monthRecords.length) * 100 
        : 0,
      revenue: funded.reduce((sum, r) => sum + (r.managementFee || 0), 0)
    });
  }
  
  return trends.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate trend direction for an ISO (positive = improving, negative = declining)
 */
export function calculateTrendDirection(
  trends: MonthlyTrend[],
  iso: string,
  months: number = 3
): number {
  const isoTrends = trends
    .filter(t => t.iso === iso)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, months);
  
  if (isoTrends.length < 2) return 0;
  
  const recent = isoTrends[0].conversionRate;
  const older = isoTrends[isoTrends.length - 1].conversionRate;
  
  return recent - older;
}

/**
 * Get timeline data formatted for multi-line chart
 */
export function getConversionTrendData(
  trends: MonthlyTrend[],
  selectedISOs: string[]
): Array<{ month: string; [key: string]: string | number }> {
  const allMonths = [...new Set(trends.map(t => t.month))].sort();
  
  return allMonths.map(month => {
    const data: { month: string; [key: string]: string | number } = { month };
    
    selectedISOs.forEach(iso => {
      const trend = trends.find(t => t.month === month && t.iso === iso);
      data[iso] = trend ? trend.conversionRate : 0;
    });
    
    return data;
  });
}

/**
 * Calculate standard deviation of conversion rates (for consistency scoring)
 */
export function calculateConversionStdDev(trends: MonthlyTrend[], iso: string): number {
  const isoTrends = trends.filter(t => t.iso === iso);
  
  if (isoTrends.length < 2) return 0;
  
  const rates = isoTrends.map(t => t.conversionRate);
  const mean = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  const squaredDiffs = rates.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / rates.length;
  
  return Math.sqrt(variance);
}
