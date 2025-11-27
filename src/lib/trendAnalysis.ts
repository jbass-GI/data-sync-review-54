import { Deal } from '@/types/dashboard';
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, format, eachWeekOfInterval, eachMonthOfInterval, isWithinInterval } from 'date-fns';

export interface WeeklyTrend {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  totalFunded: number;
  dealCount: number;
  avgTicket: number;
  newDealsFunded: number;
  renewalDealsFunded: number;
  fees: number;
}

export interface MonthlyTrend {
  month: Date;
  monthLabel: string;
  totalFunded: number;
  dealCount: number;
  avgTicket: number;
  newDealsFunded: number;
  renewalDealsFunded: number;
  fees: number;
  targetAmount: number;
  targetProgress: number;
}

/**
 * Check if deal type is "New"
 */
function isDealNew(dealType: string): boolean {
  const normalized = dealType.toLowerCase();
  return normalized.includes('new') && !normalized.includes('renew');
}

/**
 * Calculate weekly trends from deals
 */
export function calculateWeeklyTrends(deals: Deal[]): WeeklyTrend[] {
  if (deals.length === 0) return [];

  // Get date range from deals
  const dates = deals.map(d => d.fundingDate);
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Get all weeks in the range
  const weeks = eachWeekOfInterval(
    { start: minDate, end: maxDate },
    { weekStartsOn: 1 } // Monday
  );

  return weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    // Filter deals for this week
    const weekDeals = deals.filter(deal =>
      isWithinInterval(deal.fundingDate, { start: weekStart, end: weekEnd })
    );

    const totalFunded = weekDeals.reduce((sum, d) => sum + d.fundedAmount, 0);
    const dealCount = weekDeals.length;
    const fees = weekDeals.reduce((sum, d) => sum + d.mgmtFeeTotal, 0);

    const newDeals = weekDeals.filter(d => isDealNew(d.dealType));
    const renewalDeals = weekDeals.filter(d => !isDealNew(d.dealType));

    const newDealsFunded = newDeals.reduce((sum, d) => sum + d.fundedAmount, 0);
    const renewalDealsFunded = renewalDeals.reduce((sum, d) => sum + d.fundedAmount, 0);

    return {
      weekStart,
      weekEnd,
      weekLabel: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
      totalFunded,
      dealCount,
      avgTicket: dealCount > 0 ? totalFunded / dealCount : 0,
      newDealsFunded,
      renewalDealsFunded,
      fees
    };
  }).filter(week => week.dealCount > 0); // Only include weeks with deals
}

/**
 * Calculate monthly trends from deals
 */
export function calculateMonthlyTrends(deals: Deal[], annualTarget: number = 360000000): MonthlyTrend[] {
  if (deals.length === 0) return [];

  // Get date range from deals
  const dates = deals.map(d => d.fundingDate);
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Get all months in the range
  const months = eachMonthOfInterval({ start: minDate, end: maxDate });

  const monthlyTarget = annualTarget / 12;

  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    // Filter deals for this month
    const monthDeals = deals.filter(deal =>
      isWithinInterval(deal.fundingDate, { start: monthStart, end: monthEnd })
    );

    const totalFunded = monthDeals.reduce((sum, d) => sum + d.fundedAmount, 0);
    const dealCount = monthDeals.length;
    const fees = monthDeals.reduce((sum, d) => sum + d.mgmtFeeTotal, 0);

    const newDeals = monthDeals.filter(d => isDealNew(d.dealType));
    const renewalDeals = monthDeals.filter(d => !isDealNew(d.dealType));

    const newDealsFunded = newDeals.reduce((sum, d) => sum + d.fundedAmount, 0);
    const renewalDealsFunded = renewalDeals.reduce((sum, d) => sum + d.fundedAmount, 0);

    return {
      month,
      monthLabel: format(month, 'MMM yyyy'),
      totalFunded,
      dealCount,
      avgTicket: dealCount > 0 ? totalFunded / dealCount : 0,
      newDealsFunded,
      renewalDealsFunded,
      fees,
      targetAmount: monthlyTarget,
      targetProgress: (totalFunded / monthlyTarget) * 100
    };
  }).filter(month => month.dealCount > 0); // Only include months with deals
}

/**
 * Calculate cumulative totals for trend visualization
 */
export function calculateCumulativeTrends(monthlyTrends: MonthlyTrend[]): MonthlyTrend[] {
  let cumulative = 0;
  
  return monthlyTrends.map(month => {
    cumulative += month.totalFunded;
    return {
      ...month,
      totalFunded: cumulative
    };
  });
}
