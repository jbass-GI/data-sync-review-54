import { Deal } from '@/types/dashboard';
import { startOfMonth, endOfMonth, differenceInDays, differenceInBusinessDays } from 'date-fns';

export interface MTDMetrics {
  // Current performance
  mtdFunded: number;
  mtdDeals: number;
  mtdAvgTicket: number;
  
  // Target tracking
  monthlyTarget: number;
  targetProgress: number;
  remainingToTarget: number;
  
  // Time metrics
  daysElapsed: number;
  daysRemaining: number;
  businessDaysElapsed: number;
  businessDaysRemaining: number;
  monthProgress: number;
  
  // Projections
  projectedMonthEnd: number;
  projectedVsTarget: number;
  projectionConfidence: 'High' | 'Medium' | 'Low';
  
  // Burn rate
  dailyBurnRate: number;
  businessDailyBurnRate: number;
  targetDailyBurnRate: number;
  burnRateStatus: 'Ahead' | 'On Track' | 'Behind';
  
  // Pace metrics
  requiredDailyPace: number;
  currentPaceVsRequired: number;
  paceStatus: 'Ahead' | 'On Track' | 'Behind';
}

/**
 * Calculate MTD metrics and projections
 */
export function calculateMTDMetrics(deals: Deal[], annualTarget: number = 360000000): MTDMetrics {
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  const lastDayOfMonth = endOfMonth(today);
  
  // Filter deals for MTD
  const mtdDeals = deals.filter(deal => {
    const dealDate = deal.fundingDate;
    return dealDate >= firstDayOfMonth && dealDate <= today;
  });
  
  // Current MTD performance
  const mtdFunded = mtdDeals.reduce((sum, deal) => sum + deal.fundedAmount, 0);
  const mtdDealsCount = mtdDeals.length;
  const mtdAvgTicket = mtdDealsCount > 0 ? mtdFunded / mtdDealsCount : 0;
  
  // Target calculations
  const monthlyTarget = annualTarget / 12;
  const targetProgress = (mtdFunded / monthlyTarget) * 100;
  const remainingToTarget = Math.max(0, monthlyTarget - mtdFunded);
  
  // Time metrics
  const daysElapsed = differenceInDays(today, firstDayOfMonth) + 1; // +1 to include today
  const daysRemaining = differenceInDays(lastDayOfMonth, today);
  const totalDaysInMonth = differenceInDays(lastDayOfMonth, firstDayOfMonth) + 1;
  const monthProgress = (daysElapsed / totalDaysInMonth) * 100;
  
  // Business days (Mon-Fri)
  const businessDaysElapsed = differenceInBusinessDays(today, firstDayOfMonth) + 1;
  const businessDaysRemaining = differenceInBusinessDays(lastDayOfMonth, today);
  
  // Burn rate calculations
  const dailyBurnRate = daysElapsed > 0 ? mtdFunded / daysElapsed : 0;
  const businessDailyBurnRate = businessDaysElapsed > 0 ? mtdFunded / businessDaysElapsed : 0;
  const targetDailyBurnRate = monthlyTarget / totalDaysInMonth;
  
  // Determine burn rate status
  let burnRateStatus: 'Ahead' | 'On Track' | 'Behind';
  const burnRateDiff = ((dailyBurnRate - targetDailyBurnRate) / targetDailyBurnRate) * 100;
  if (burnRateDiff > 10) {
    burnRateStatus = 'Ahead';
  } else if (burnRateDiff < -10) {
    burnRateStatus = 'Behind';
  } else {
    burnRateStatus = 'On Track';
  }
  
  // Projection calculations
  const projectedMonthEnd = daysElapsed >= 3 
    ? dailyBurnRate * totalDaysInMonth // Project based on current pace
    : monthlyTarget * (monthProgress / 100); // Early month: use linear projection
  
  const projectedVsTarget = projectedMonthEnd - monthlyTarget;
  
  // Projection confidence (more data = higher confidence)
  let projectionConfidence: 'High' | 'Medium' | 'Low';
  if (daysElapsed >= 15) {
    projectionConfidence = 'High';
  } else if (daysElapsed >= 7) {
    projectionConfidence = 'Medium';
  } else {
    projectionConfidence = 'Low';
  }
  
  // Required pace to hit target
  const requiredDailyPace = daysRemaining > 0 
    ? remainingToTarget / daysRemaining 
    : 0;
  
  const currentPaceVsRequired = requiredDailyPace > 0 
    ? ((dailyBurnRate - requiredDailyPace) / requiredDailyPace) * 100 
    : 0;
  
  // Determine pace status
  let paceStatus: 'Ahead' | 'On Track' | 'Behind';
  if (targetProgress >= monthProgress + 5) {
    paceStatus = 'Ahead';
  } else if (targetProgress < monthProgress - 5) {
    paceStatus = 'Behind';
  } else {
    paceStatus = 'On Track';
  }
  
  return {
    // Current performance
    mtdFunded,
    mtdDeals: mtdDealsCount,
    mtdAvgTicket,
    
    // Target tracking
    monthlyTarget,
    targetProgress,
    remainingToTarget,
    
    // Time metrics
    daysElapsed,
    daysRemaining,
    businessDaysElapsed,
    businessDaysRemaining,
    monthProgress,
    
    // Projections
    projectedMonthEnd,
    projectedVsTarget,
    projectionConfidence,
    
    // Burn rate
    dailyBurnRate,
    businessDailyBurnRate,
    targetDailyBurnRate,
    burnRateStatus,
    
    // Pace metrics
    requiredDailyPace,
    currentPaceVsRequired,
    paceStatus
  };
}

/**
 * Format number as compact currency (e.g., $2.5M)
 */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}
