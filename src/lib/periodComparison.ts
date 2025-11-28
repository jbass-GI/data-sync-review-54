import { Deal } from '@/types/dashboard';
import { startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth, differenceInDays, addDays, isBefore, isAfter, subYears, subQuarters, subMonths, format } from 'date-fns';

export type ComparisonType = 'none' | 'month-vs-month' | 'quarter-vs-quarter' | 'year-vs-year' | 'ytd-vs-ytd' | 'custom';

export interface ComparisonPeriod {
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface PeriodOption {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface ComparisonConfig {
  type: ComparisonType;
  currentPeriod: ComparisonPeriod;
  comparisonPeriod: ComparisonPeriod;
}

export interface PeriodMetrics {
  totalFunded: number;
  totalFees: number;
  dealCount: number;
  avgTicketSize: number;
  avgFeePercent: number;
  newDealsFunded: number;
  renewalDealsFunded: number;
  deals: Deal[];
}

export interface ComparisonResult {
  current: PeriodMetrics;
  comparison: PeriodMetrics;
  forecast?: ForecastData;
  percentChanges: {
    totalFunded: number;
    totalFees: number;
    dealCount: number;
    avgTicketSize: number;
  };
}

export interface ForecastData {
  projectedTotal: number;
  forecastPoints: ForecastPoint[];
  growthRate: number;
  momentumFactor: number;
}

export interface ForecastPoint {
  date: Date;
  value: number;
  label: string;
  isActual: boolean;
  isForecast: boolean;
}

/**
 * Get available periods from data for comparison selection
 */
export function getAvailablePeriodsFromData(deals: Deal[]): {
  months: PeriodOption[];
  quarters: PeriodOption[];
  years: PeriodOption[];
} {
  if (deals.length === 0) {
    return { months: [], quarters: [], years: [] };
  }

  const months: PeriodOption[] = [];
  const quarters: PeriodOption[] = [];
  const years: PeriodOption[] = [];
  
  const monthsSet = new Set<string>();
  const quartersSet = new Set<string>();
  const yearsSet = new Set<string>();

  deals.forEach(deal => {
    const date = deal.fundingDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;

    // Month key
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    if (!monthsSet.has(monthKey)) {
      monthsSet.add(monthKey);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      months.push({
        value: monthKey,
        label: format(monthStart, 'MMMM yyyy'),
        startDate: monthStart,
        endDate: monthEnd
      });
    }

    // Quarter key
    const quarterKey = `${year}-Q${quarter}`;
    if (!quartersSet.has(quarterKey)) {
      quartersSet.add(quarterKey);
      const quarterStart = startOfQuarter(date);
      const quarterEnd = endOfQuarter(date);
      quarters.push({
        value: quarterKey,
        label: `Q${quarter} ${year}`,
        startDate: quarterStart,
        endDate: quarterEnd
      });
    }

    // Year key
    const yearKey = `${year}`;
    if (!yearsSet.has(yearKey)) {
      yearsSet.add(yearKey);
      const yearStart = startOfYear(date);
      const yearEnd = endOfYear(date);
      years.push({
        value: yearKey,
        label: `${year}`,
        startDate: yearStart,
        endDate: yearEnd
      });
    }
  });

  // Sort descending (most recent first)
  months.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  quarters.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  years.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  return { months, quarters, years };
}

/**
 * Get comparison periods based on type, reference date, and optional custom selection
 */
export function getComparisonPeriods(
  type: ComparisonType, 
  referenceDate: Date = new Date(),
  customCurrentPeriod?: PeriodOption,
  customComparisonPeriod?: PeriodOption
): ComparisonConfig | null {
  if (type === 'none') return null;

  // Handle custom period selection
  if (type === 'custom' && customCurrentPeriod && customComparisonPeriod) {
    return {
      type,
      currentPeriod: {
        label: customCurrentPeriod.label,
        startDate: customCurrentPeriod.startDate,
        endDate: customCurrentPeriod.endDate
      },
      comparisonPeriod: {
        label: customComparisonPeriod.label,
        startDate: customComparisonPeriod.startDate,
        endDate: customComparisonPeriod.endDate
      }
    };
  }

  let currentPeriod: ComparisonPeriod;
  let comparisonPeriod: ComparisonPeriod;

  switch (type) {
    case 'month-vs-month': {
      const currentStart = startOfMonth(referenceDate);
      const currentEnd = endOfMonth(referenceDate);
      const compStart = startOfMonth(subMonths(referenceDate, 1));
      const compEnd = endOfMonth(subMonths(referenceDate, 1));
      
      currentPeriod = {
        label: currentStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        startDate: currentStart,
        endDate: currentEnd
      };
      
      comparisonPeriod = {
        label: compStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        startDate: compStart,
        endDate: compEnd
      };
      break;
    }

    case 'quarter-vs-quarter': {
      const currentStart = startOfQuarter(referenceDate);
      const currentEnd = endOfQuarter(referenceDate);
      const compStart = startOfQuarter(subQuarters(referenceDate, 1));
      const compEnd = endOfQuarter(subQuarters(referenceDate, 1));
      
      const getQuarter = (date: Date) => Math.floor(date.getMonth() / 3) + 1;
      
      currentPeriod = {
        label: `Q${getQuarter(currentStart)} ${currentStart.getFullYear()}`,
        startDate: currentStart,
        endDate: currentEnd
      };
      
      comparisonPeriod = {
        label: `Q${getQuarter(compStart)} ${compStart.getFullYear()}`,
        startDate: compStart,
        endDate: compEnd
      };
      break;
    }

    case 'year-vs-year': {
      const currentStart = startOfYear(referenceDate);
      const currentEnd = endOfYear(referenceDate);
      const compStart = startOfYear(subYears(referenceDate, 1));
      const compEnd = endOfYear(subYears(referenceDate, 1));
      
      currentPeriod = {
        label: `${currentStart.getFullYear()}`,
        startDate: currentStart,
        endDate: currentEnd
      };
      
      comparisonPeriod = {
        label: `${compStart.getFullYear()}`,
        startDate: compStart,
        endDate: compEnd
      };
      break;
    }

    case 'ytd-vs-ytd': {
      const currentStart = startOfYear(referenceDate);
      const currentEnd = referenceDate;
      const compStart = startOfYear(subYears(referenceDate, 1));
      // Same day of year in previous year
      const compEnd = addDays(compStart, differenceInDays(currentEnd, currentStart));
      
      currentPeriod = {
        label: `YTD ${currentStart.getFullYear()}`,
        startDate: currentStart,
        endDate: currentEnd
      };
      
      comparisonPeriod = {
        label: `YTD ${compStart.getFullYear()}`,
        startDate: compStart,
        endDate: compEnd
      };
      break;
    }

    default:
      return null;
  }

  return {
    type,
    currentPeriod,
    comparisonPeriod
  };
}

/**
 * Filter deals by date range
 */
function filterDealsByPeriod(deals: Deal[], startDate: Date, endDate: Date): Deal[] {
  return deals.filter(deal => {
    const dealDate = deal.fundingDate;
    return !isBefore(dealDate, startDate) && !isAfter(dealDate, endDate);
  });
}

/**
 * Calculate metrics for a period
 */
function calculatePeriodMetrics(deals: Deal[]): PeriodMetrics {
  const totalFunded = deals.reduce((sum, d) => sum + d.fundedAmount, 0);
  const totalFees = deals.reduce((sum, d) => sum + d.mgmtFeeTotal, 0);
  const dealCount = deals.length;
  const avgTicketSize = dealCount > 0 ? totalFunded / dealCount : 0;
  const avgFeePercent = totalFunded > 0 ? (totalFees / totalFunded) * 100 : 0;
  
  // More flexible detection - anything not "new" is a renewal
  const isNew = (dealType: string) => {
    const normalized = dealType.toLowerCase().trim();
    return normalized.includes('new') || normalized === 'n';
  };
  
  const newDealsFunded = deals
    .filter(d => isNew(d.dealType))
    .reduce((sum, d) => sum + d.fundedAmount, 0);
  
  const renewalDealsFunded = deals
    .filter(d => !isNew(d.dealType))
    .reduce((sum, d) => sum + d.fundedAmount, 0);

  return {
    totalFunded,
    totalFees,
    dealCount,
    avgTicketSize,
    avgFeePercent,
    newDealsFunded,
    renewalDealsFunded,
    deals
  };
}

/**
 * Calculate growth rate and momentum factor
 */
function calculateMomentum(currentDeals: Deal[], periodStart: Date, periodEnd: Date): { growthRate: number; momentumFactor: number } {
  if (currentDeals.length < 2) {
    return { growthRate: 0, momentumFactor: 1 };
  }

  const totalDays = differenceInDays(periodEnd, periodStart) || 1;
  const halfwayPoint = addDays(periodStart, Math.floor(totalDays / 2));

  // Split into first half and second half
  const firstHalf = currentDeals.filter(d => isBefore(d.fundingDate, halfwayPoint));
  const secondHalf = currentDeals.filter(d => !isBefore(d.fundingDate, halfwayPoint));

  const firstHalfTotal = firstHalf.reduce((sum, d) => sum + d.fundedAmount, 0);
  const secondHalfTotal = secondHalf.reduce((sum, d) => sum + d.fundedAmount, 0);

  // Calculate daily averages
  const firstHalfDays = Math.floor(totalDays / 2) || 1;
  const secondHalfDays = totalDays - firstHalfDays || 1;
  
  const firstHalfDaily = firstHalfTotal / firstHalfDays;
  const secondHalfDaily = secondHalfTotal / secondHalfDays;

  // Growth rate (percentage change)
  const growthRate = firstHalfDaily > 0 ? ((secondHalfDaily - firstHalfDaily) / firstHalfDaily) : 0;

  // Momentum factor: 1 = neutral, >1 = accelerating, <1 = decelerating
  const momentumFactor = 1 + (growthRate * 0.3); // Weight at 30% of growth rate

  return { growthRate, momentumFactor };
}

/**
 * Generate forecast based on comparison period's remaining data and current momentum
 */
function generateForecast(
  currentPeriod: ComparisonPeriod,
  comparisonPeriod: ComparisonPeriod,
  currentMetrics: PeriodMetrics,
  comparisonDeals: Deal[],
  allDeals: Deal[]
): ForecastData | undefined {
  const now = new Date();
  
  // Only generate forecast if we're not at the end of the period
  if (!isBefore(now, currentPeriod.endDate)) {
    return undefined;
  }

  // Calculate momentum from current period
  const { growthRate, momentumFactor } = calculateMomentum(
    currentMetrics.deals,
    currentPeriod.startDate,
    now
  );

  // Get the remaining days in the comparison period (what happened after this point last year)
  const daysElapsed = differenceInDays(now, currentPeriod.startDate);
  const remainingComparisonStart = addDays(comparisonPeriod.startDate, daysElapsed);
  const remainingComparisonDeals = comparisonDeals.filter(d => 
    !isBefore(d.fundingDate, remainingComparisonStart) && !isAfter(d.fundingDate, comparisonPeriod.endDate)
  );

  // Calculate what happened in the remaining period last year
  const remainingComparisonTotal = remainingComparisonDeals.reduce((sum, d) => sum + d.fundedAmount, 0);

  // Apply momentum factor to the comparison period's remaining total
  const forecastedRemaining = remainingComparisonTotal * momentumFactor;
  const projectedTotal = currentMetrics.totalFunded + forecastedRemaining;

  // Generate weekly forecast points
  const forecastPoints: ForecastPoint[] = [];
  const remainingDays = differenceInDays(currentPeriod.endDate, now);
  const weeksRemaining = Math.ceil(remainingDays / 7);

  // Calculate weekly distribution based on comparison period
  for (let week = 0; week <= weeksRemaining; week++) {
    const weekDate = addDays(now, week * 7);
    if (isAfter(weekDate, currentPeriod.endDate)) {
      break;
    }

    const progressRatio = week / weeksRemaining;
    const forecastValue = currentMetrics.totalFunded + (forecastedRemaining * progressRatio);

    forecastPoints.push({
      date: weekDate,
      value: forecastValue,
      label: weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isActual: false,
      isForecast: true
    });
  }

  return {
    projectedTotal,
    forecastPoints,
    growthRate,
    momentumFactor
  };
}

/**
 * Compare two periods and generate comparison result
 */
export function comparePeriods(
  deals: Deal[],
  config: ComparisonConfig
): ComparisonResult {
  const currentDeals = filterDealsByPeriod(
    deals,
    config.currentPeriod.startDate,
    config.currentPeriod.endDate
  );

  const comparisonDeals = filterDealsByPeriod(
    deals,
    config.comparisonPeriod.startDate,
    config.comparisonPeriod.endDate
  );

  const current = calculatePeriodMetrics(currentDeals);
  const comparison = calculatePeriodMetrics(comparisonDeals);

  // Generate forecast for YTD comparisons
  const forecast = (config.type === 'ytd-vs-ytd' || config.type === 'year-vs-year')
    ? generateForecast(config.currentPeriod, config.comparisonPeriod, current, comparisonDeals, deals)
    : undefined;

  // Calculate percentage changes
  const percentChanges = {
    totalFunded: comparison.totalFunded > 0
      ? ((current.totalFunded - comparison.totalFunded) / comparison.totalFunded) * 100
      : 0,
    totalFees: comparison.totalFees > 0
      ? ((current.totalFees - comparison.totalFees) / comparison.totalFees) * 100
      : 0,
    dealCount: comparison.dealCount > 0
      ? ((current.dealCount - comparison.dealCount) / comparison.dealCount) * 100
      : 0,
    avgTicketSize: comparison.avgTicketSize > 0
      ? ((current.avgTicketSize - comparison.avgTicketSize) / comparison.avgTicketSize) * 100
      : 0
  };

  return {
    current,
    comparison,
    forecast,
    percentChanges
  };
}
