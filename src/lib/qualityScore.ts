import { ConversionMetrics } from '@/types/funding';
import { MonthlyTrend, calculateConversionStdDev } from './trendAnalysisISO';

export interface ISOQualityScore {
  iso: string;
  totalScore: number; // 0-100
  breakdown: {
    conversionScore: number;    // 40 points max
    volumeScore: number;        // 15 points max
    revenueScore: number;       // 20 points max
    speedScore: number;         // 15 points max
    consistencyScore: number;   // 10 points max
  };
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  tier: 1 | 2 | 3 | 4;
  strengths: string[];
  weaknesses: string[];
}

/**
 * Calculate percentile rank of a value in a dataset
 */
function calculatePercentile(value: number, dataset: number[]): number {
  const sorted = [...dataset].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  return index === -1 ? 1 : (index + 1) / sorted.length;
}

/**
 * Calculate comprehensive ISO quality score
 */
export function calculateQualityScore(
  isoMetric: ConversionMetrics,
  monthlyTrends: MonthlyTrend[],
  allMetrics: ConversionMetrics[]
): ISOQualityScore {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // 1. CONVERSION SCORE (40 points max)
  let conversionScore = 0;
  if (isoMetric.overallConversionRate >= 25) {
    conversionScore = 40;
    strengths.push('Excellent conversion rate');
  } else if (isoMetric.overallConversionRate >= 20) {
    conversionScore = 35;
    strengths.push('Strong conversion rate');
  } else if (isoMetric.overallConversionRate >= 15) {
    conversionScore = 30;
  } else if (isoMetric.overallConversionRate >= 12) {
    conversionScore = 25;
  } else if (isoMetric.overallConversionRate >= 10) {
    conversionScore = 20;
    weaknesses.push('Below-average conversion rate');
  } else {
    conversionScore = Math.max(0, isoMetric.overallConversionRate * 2);
    weaknesses.push('Poor conversion rate');
  }
  
  // 2. VOLUME SCORE (15 points max)
  const volumePercentile = calculatePercentile(
    isoMetric.totalSubmissions,
    allMetrics.map(m => m.totalSubmissions)
  );
  const volumeScore = volumePercentile * 15;
  
  if (volumePercentile >= 0.75) {
    strengths.push('High submission volume');
  } else if (volumePercentile < 0.25) {
    weaknesses.push('Low submission volume');
  }
  
  // 3. REVENUE SCORE (20 points max)
  const revenuePercentile = calculatePercentile(
    isoMetric.totalRevenue,
    allMetrics.map(m => m.totalRevenue)
  );
  const revenueScore = revenuePercentile * 20;
  
  if (revenuePercentile >= 0.75) {
    strengths.push('Top revenue generator');
  } else if (revenuePercentile < 0.25) {
    weaknesses.push('Low revenue contribution');
  }
  
  // 4. SPEED SCORE (15 points max)
  let speedScore = 0;
  if (isoMetric.avgDaysToFund <= 30) {
    speedScore = 15;
    strengths.push('Fast funding time');
  } else if (isoMetric.avgDaysToFund <= 45) {
    speedScore = 12;
  } else if (isoMetric.avgDaysToFund <= 60) {
    speedScore = 8;
  } else {
    speedScore = Math.max(0, 15 - (isoMetric.avgDaysToFund - 30) * 0.3);
    weaknesses.push('Slow funding time');
  }
  
  // 5. CONSISTENCY SCORE (10 points max)
  const isoTrends = monthlyTrends.filter(t => t.iso === isoMetric.iso);
  let consistencyScore = 0;
  
  if (isoTrends.length >= 3) {
    const stdDev = calculateConversionStdDev(monthlyTrends, isoMetric.iso);
    
    // Lower stdDev = higher consistency
    if (stdDev <= 5) {
      consistencyScore = 10;
      strengths.push('Consistent performance');
    } else if (stdDev <= 10) {
      consistencyScore = 7;
    } else if (stdDev <= 15) {
      consistencyScore = 4;
    } else {
      consistencyScore = 2;
      weaknesses.push('Inconsistent performance');
    }
  } else {
    consistencyScore = 5; // Default for insufficient data
  }
  
  // Calculate total score
  const totalScore = Math.round(
    conversionScore + volumeScore + revenueScore + speedScore + consistencyScore
  );
  
  // Assign grade
  let grade: ISOQualityScore['grade'];
  if (totalScore >= 90) grade = 'A+';
  else if (totalScore >= 80) grade = 'A';
  else if (totalScore >= 70) grade = 'B';
  else if (totalScore >= 60) grade = 'C';
  else if (totalScore >= 50) grade = 'D';
  else grade = 'F';
  
  // Assign tier
  let tier: ISOQualityScore['tier'];
  if (totalScore >= 80) tier = 1;
  else if (totalScore >= 65) tier = 2;
  else if (totalScore >= 50) tier = 3;
  else tier = 4;
  
  return {
    iso: isoMetric.iso,
    totalScore,
    breakdown: {
      conversionScore: Math.round(conversionScore),
      volumeScore: Math.round(volumeScore),
      revenueScore: Math.round(revenueScore),
      speedScore: Math.round(speedScore),
      consistencyScore: Math.round(consistencyScore)
    },
    grade,
    tier,
    strengths,
    weaknesses
  };
}

/**
 * Calculate quality scores for all ISOs
 */
export function calculateAllQualityScores(
  metrics: ConversionMetrics[],
  monthlyTrends: MonthlyTrend[]
): ISOQualityScore[] {
  return metrics.map(metric => 
    calculateQualityScore(metric, monthlyTrends, metrics)
  );
}

/**
 * Generate alerts for poor-performing ISOs
 */
export interface PerformanceAlert {
  iso: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  metric: string;
  value: number | string;
}

export function generatePerformanceAlerts(
  metrics: ConversionMetrics[],
  qualityScores: ISOQualityScore[],
  monthlyTrends: MonthlyTrend[]
): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];
  
  metrics.forEach(metric => {
    const score = qualityScores.find(s => s.iso === metric.iso);
    
    // Critical: Conversion rate < 10%
    if (metric.overallConversionRate < 10) {
      alerts.push({
        iso: metric.iso,
        severity: 'critical',
        message: 'Critically low conversion rate - consider immediate review',
        metric: 'Overall Conversion Rate',
        value: `${metric.overallConversionRate.toFixed(1)}%`
      });
    }
    
    // Warning: Conversion rate 10-12%
    else if (metric.overallConversionRate < 12) {
      alerts.push({
        iso: metric.iso,
        severity: 'warning',
        message: 'Below-target conversion rate',
        metric: 'Overall Conversion Rate',
        value: `${metric.overallConversionRate.toFixed(1)}%`
      });
    }
    
    // Warning: Slow funding (>60 days)
    if (metric.avgDaysToFund > 60) {
      alerts.push({
        iso: metric.iso,
        severity: 'warning',
        message: 'Slow funding time impacting efficiency',
        metric: 'Avg Days to Fund',
        value: `${Math.round(metric.avgDaysToFund)} days`
      });
    }
    
    // Critical: Low quality score
    if (score && score.totalScore < 50) {
      alerts.push({
        iso: metric.iso,
        severity: 'critical',
        message: 'Overall poor performance across multiple metrics',
        metric: 'Quality Score',
        value: `${score.totalScore}/100`
      });
    }
    
    // Info: High performer
    if (score && score.totalScore >= 85) {
      alerts.push({
        iso: metric.iso,
        severity: 'info',
        message: 'Top performer - consider increased allocation',
        metric: 'Quality Score',
        value: `${score.totalScore}/100`
      });
    }
  });
  
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
