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
 * Calculate the longest consecutive business days streak with deals during the period
 */
function calculateConsecutiveBusinessDays(dealDays: DealDay[]): number {
  if (dealDays.length === 0) return 0;
  
  // Create a map of dates with deals for fast lookup
  const dealDateMap = new Map<string, DealDay>();
  dealDays.forEach(dd => {
    dealDateMap.set(dd.date, dd);
  });
  
  // Find the date range
  const dates = dealDays.map(dd => new Date(dd.date)).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  
  // Generate all business days in the range
  const businessDays: string[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (!isWeekend(currentDate) && !isUSBankHoliday(currentDate)) {
      businessDays.push(format(currentDate, 'yyyy-MM-dd'));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Find longest consecutive streak of business days with deals
  let maxStreak = 0;
  let currentStreak = 0;
  
  for (const businessDay of businessDays) {
    const dealDay = dealDateMap.get(businessDay);
    if (dealDay && dealDay.deals.length > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return maxStreak;
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
  
  // Calculate consecutive business days with deals (longest streak in period)
  const consecutiveBusinessDaysWithDeals = calculateConsecutiveBusinessDays(dealDays);
  
  // Calculate longest consecutive new deals streak in the period
  let consecutiveNewDeals = 0;
  let currentNewStreak = 0;
  const chronologicalDeals = [...deals].sort((a, b) => 
    a.fundingDate.getTime() - b.fundingDate.getTime()
  );
  
  for (const deal of chronologicalDeals) {
    const isNew = deal.dealType.toUpperCase().includes('NEW');
    if (isNew) {
      currentNewStreak++;
      consecutiveNewDeals = Math.max(consecutiveNewDeals, currentNewStreak);
    } else {
      currentNewStreak = 0;
    }
  }
  
  // Calculate longest consecutive renewal deals streak in the period
  let consecutiveRenewalDeals = 0;
  let currentRenewalStreak = 0;
  
  for (const deal of chronologicalDeals) {
    const isRenewal = deal.dealType.toUpperCase().includes('RENEW');
    if (isRenewal) {
      currentRenewalStreak++;
      consecutiveRenewalDeals = Math.max(consecutiveRenewalDeals, currentRenewalStreak);
    } else {
      currentRenewalStreak = 0;
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
