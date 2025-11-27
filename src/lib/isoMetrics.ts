import { Submission, ISOMetrics } from '@/types/submission';

/**
 * Calculate aggregated metrics for each ISO
 */
export function calculateISOMetrics(submissions: Submission[]): ISOMetrics[] {
  // Group submissions by normalized ISO
  const isoGroups = submissions.reduce((acc, sub) => {
    const iso = sub.isoNormalized;
    if (!acc[iso]) {
      acc[iso] = [];
    }
    acc[iso].push(sub);
    return acc;
  }, {} as Record<string, Submission[]>);
  
  // Calculate metrics for each ISO
  const metrics: ISOMetrics[] = [];
  
  for (const [iso, subs] of Object.entries(isoGroups)) {
    if (iso === 'UNKNOWN') continue; // Skip unknown ISOs
    
    const totalSubmissions = subs.length;
    const offerAmounts = subs.map(s => s.offerAmount).filter(a => a > 0);
    const avgOfferAmount = offerAmounts.length > 0 
      ? offerAmounts.reduce((sum, amt) => sum + amt, 0) / offerAmounts.length 
      : 0;
    const minOffer = offerAmounts.length > 0 ? Math.min(...offerAmounts) : 0;
    const maxOffer = offerAmounts.length > 0 ? Math.max(...offerAmounts) : 0;
    
    const offersMade = subs.filter(s => s.stageCategory === 'Offered' || s.stageCategory === 'Funded').length;
    
    const daysInPipeline = subs.map(s => s.daysInPipeline);
    const avgDaysInPipeline = daysInPipeline.length > 0
      ? daysInPipeline.reduce((sum, days) => sum + days, 0) / daysInPipeline.length
      : 0;
    
    const uniqueRepsSet = new Set(subs.map(s => s.rep).filter(r => r));
    const reps = Array.from(uniqueRepsSet);
    
    // Submissions by month for trend analysis
    const submissionsByMonth = subs.reduce((acc, sub) => {
      const month = sub.submissionMonth;
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    metrics.push({
      iso,
      totalSubmissions,
      avgOfferAmount,
      minOffer,
      maxOffer,
      offersMade,
      avgDaysInPipeline,
      uniqueReps: uniqueRepsSet.size,
      reps,
      submissionsByMonth
    });
  }
  
  // Sort by total submissions descending
  return metrics.sort((a, b) => b.totalSubmissions - a.totalSubmissions);
}

/**
 * Get top N ISOs by submission volume
 */
export function getTopISOsByVolume(metrics: ISOMetrics[], n: number = 5): ISOMetrics[] {
  return metrics.slice(0, n);
}

/**
 * Get submission timeline data for chart
 */
export function getSubmissionTimeline(
  submissions: Submission[],
  topISOs: string[]
): { month: string; [key: string]: number | string }[] {
  // Get all unique months
  const monthsSet = new Set(submissions.map(s => s.submissionMonth));
  const months = Array.from(monthsSet).sort();
  
  // Build timeline data
  const timeline = months.map(month => {
    const data: { month: string; [key: string]: number | string } = { month };
    
    topISOs.forEach(iso => {
      const count = submissions.filter(
        s => s.submissionMonth === month && s.isoNormalized === iso
      ).length;
      data[iso] = count;
    });
    
    return data;
  });
  
  return timeline;
}
