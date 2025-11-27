import { Deal } from '@/types/dashboard';
import { eachDayOfInterval, isWeekend, format } from 'date-fns';

interface DealDay {
  date: string;
  deals: Deal[];
  isBusinessDay: boolean;
}

interface ConsistencyMetrics {
  consecutiveBusinessDaysWithDeals: number;
  consecutiveNewDeals: number;
  consecutiveRenewalDeals: number;
  daysWithMultipleDeals: number;
  consistencyScore: number;
}

/**
 * Check if a date is a US bank holiday
 */
function isUSBankHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Simple check for major holidays - can be expanded
  const holidays = [
    `${year}-01-01`, // New Year's Day
    `${year}-07-04`, // Independence Day
    `${year}-12-25`, // Christmas
  ];
  
  const dateStr = format(date, 'yyyy-MM-dd');
  return holidays.includes(dateStr);
}

/**
 * Calculate consecutive business days with deals
 */
function calculateConsecutiveBusinessDays(dealDays: DealDay[]): number {
  if (dealDays.length === 0) return 0;
  
  // Create a map of dates with deals for fast lookup
  const dealDateMap = new Map<string, DealDay>();
  dealDays.forEach(dd => {
    dealDateMap.set(dd.date, dd);
  });
  
  // Find the most recent deal date
  const mostRecentDate = [...dealDays]
    .sort((a, b) => b.date.localeCompare(a.date))[0].date;
  
  let consecutiveDays = 0;
  let currentDate = new Date(mostRecentDate);
  
  // Walk backwards from most recent date, checking each business day
  while (true) {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    
    // Skip weekends and holidays
    if (isWeekend(currentDate) || isUSBankHoliday(currentDate)) {
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }
    
    // Check if this business day has deals
    const dealDay = dealDateMap.get(dateKey);
    if (dealDay && dealDay.deals.length > 0) {
      consecutiveDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // Found a business day with no deals - streak ends
      break;
    }
  }
  
  return consecutiveDays;
}

/**
 * Calculate consistency metrics for a partner
 */
export function calculateConsistencyMetrics(deals: Deal[]): ConsistencyMetrics {
  if (deals.length === 0) {
    return {
      consecutiveBusinessDaysWithDeals: 0,
      consecutiveNewDeals: 0,
      consecutiveRenewalDeals: 0,
      daysWithMultipleDeals: 0,
      consistencyScore: 0
    };
  }
  
  // Sort deals by date (most recent first)
  const sortedDeals = [...deals].sort((a, b) => 
    b.fundingDate.getTime() - a.fundingDate.getTime()
  );
  
  // Group deals by day
  const dealsByDay = new Map<string, Deal[]>();
  sortedDeals.forEach(deal => {
    const dateKey = format(deal.fundingDate, 'yyyy-MM-dd');
    if (!dealsByDay.has(dateKey)) {
      dealsByDay.set(dateKey, []);
    }
    dealsByDay.get(dateKey)!.push(deal);
  });
  
  // Create DealDay objects
  const dealDays: DealDay[] = Array.from(dealsByDay.entries()).map(([date, deals]) => ({
    date,
    deals,
    isBusinessDay: !isWeekend(new Date(date)) && !isUSBankHoliday(new Date(date))
  }));
  
  // Calculate consecutive business days with deals
  const consecutiveBusinessDaysWithDeals = calculateConsecutiveBusinessDays(dealDays);
  
  // Calculate consecutive new deals (most recent streak)
  let consecutiveNewDeals = 0;
  for (const deal of sortedDeals) {
    const isNew = deal.dealType.toUpperCase().includes('NEW');
    if (isNew) {
      consecutiveNewDeals++;
    } else {
      break;
    }
  }
  
  // Calculate consecutive renewal deals (most recent streak)
  let consecutiveRenewalDeals = 0;
  for (const deal of sortedDeals) {
    const isRenewal = deal.dealType.toUpperCase().includes('RENEW');
    if (isRenewal) {
      consecutiveRenewalDeals++;
    } else {
      break;
    }
  }
  
  // Count days with multiple deals
  const daysWithMultipleDeals = Array.from(dealsByDay.values())
    .filter(deals => deals.length >= 2).length;
  
  // Calculate consistency score (0-100)
  // Weighted scoring: business day streak (40%), multiple deals days (30%), deal type streaks (30%)
  const maxBusinessDayStreak = 20; // Assume max streak of 20 days for scoring
  const maxMultipleDealDays = 10; // Assume max of 10 days for scoring
  const maxDealTypeStreak = 10; // Assume max of 10 consecutive deals
  
  const businessDayScore = Math.min(consecutiveBusinessDaysWithDeals / maxBusinessDayStreak, 1) * 40;
  const multipleDealScore = Math.min(daysWithMultipleDeals / maxMultipleDealDays, 1) * 30;
  const dealTypeScore = Math.min(
    Math.max(consecutiveNewDeals, consecutiveRenewalDeals) / maxDealTypeStreak, 
    1
  ) * 30;
  
  const consistencyScore = Math.round(businessDayScore + multipleDealScore + dealTypeScore);
  
  return {
    consecutiveBusinessDaysWithDeals,
    consecutiveNewDeals,
    consecutiveRenewalDeals,
    daysWithMultipleDeals,
    consistencyScore
  };
}

/**
 * Calculate consistency metrics for all partners
 */
export function calculateAllPartnerConsistency(
  deals: Deal[]
): Map<string, ConsistencyMetrics> {
  const partnerMap = new Map<string, Deal[]>();
  
  // Group deals by partner
  deals.forEach(deal => {
    const partner = deal.partnerNormalized;
    if (!partnerMap.has(partner)) {
      partnerMap.set(partner, []);
    }
    partnerMap.get(partner)!.push(deal);
  });
  
  // Calculate metrics for each partner
  const metricsMap = new Map<string, ConsistencyMetrics>();
  partnerMap.forEach((partnerDeals, partner) => {
    const metrics = calculateConsistencyMetrics(partnerDeals);
    metricsMap.set(partner, metrics);
  });
  
  return metricsMap;
}
