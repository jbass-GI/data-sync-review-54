import { Deal } from '@/types/dashboard';
import { startOfMonth, format } from 'date-fns';

interface MonthlyPartnerPerformance {
  month: string;
  partner: string;
  totalFunded: number;
  monthlyTarget: number;
  metTarget: boolean;
}

/**
 * Calculate monthly performance for each partner
 */
export function calculateMonthlyPartnerPerformance(deals: Deal[]): MonthlyPartnerPerformance[] {
  if (deals.length === 0) return [];

  // Group deals by partner and month
  const partnerMonthMap = new Map<string, Map<string, Deal[]>>();

  deals.forEach(deal => {
    const monthKey = format(startOfMonth(deal.fundingDate), 'yyyy-MM');
    const partner = deal.partnerNormalized;

    if (!partnerMonthMap.has(partner)) {
      partnerMonthMap.set(partner, new Map());
    }

    const monthMap = partnerMonthMap.get(partner)!;
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }

    monthMap.get(monthKey)!.push(deal);
  });

  // Calculate performance for each partner-month combination
  const performances: MonthlyPartnerPerformance[] = [];

  partnerMonthMap.forEach((monthMap, partner) => {
    monthMap.forEach((monthDeals, monthKey) => {
      const totalFunded = monthDeals.reduce((sum, deal) => sum + deal.fundedAmount, 0);
      
      // Calculate partner's proportional target based on their overall contribution
      // For simplicity, we'll use a baseline target and compare against it
      // In a real scenario, you might have partner-specific targets
      const monthlyTarget = 30000000; // $30M monthly target
      const totalPartners = partnerMonthMap.size;
      const partnerTarget = monthlyTarget / totalPartners; // Distribute evenly for now
      
      performances.push({
        month: monthKey,
        partner,
        totalFunded,
        monthlyTarget: partnerTarget,
        metTarget: totalFunded >= partnerTarget
      });
    });
  });

  // Sort by partner and month
  return performances.sort((a, b) => {
    if (a.partner !== b.partner) {
      return a.partner.localeCompare(b.partner);
    }
    return a.month.localeCompare(b.month);
  });
}

/**
 * Calculate current streak for a partner
 * Returns positive number for win streaks, negative for loss streaks
 */
export function calculatePartnerStreak(
  performances: MonthlyPartnerPerformance[],
  partner: string
): { currentStreak: number; streakType: 'win' | 'loss' | 'none' } {
  const partnerPerformances = performances
    .filter(p => p.partner === partner)
    .sort((a, b) => b.month.localeCompare(a.month)); // Most recent first

  if (partnerPerformances.length === 0) {
    return { currentStreak: 0, streakType: 'none' };
  }

  const mostRecent = partnerPerformances[0];
  const streakType = mostRecent.metTarget ? 'win' : 'loss';
  let streakCount = 0;

  // Count consecutive months with same result
  for (const performance of partnerPerformances) {
    if (performance.metTarget === mostRecent.metTarget) {
      streakCount++;
    } else {
      break;
    }
  }

  return {
    currentStreak: streakType === 'win' ? streakCount : -streakCount,
    streakType
  };
}

/**
 * Get all partner streaks
 */
export function calculateAllPartnerStreaks(
  deals: Deal[]
): Map<string, { currentStreak: number; streakType: 'win' | 'loss' | 'none' }> {
  const performances = calculateMonthlyPartnerPerformance(deals);
  const streaks = new Map<string, { currentStreak: number; streakType: 'win' | 'loss' | 'none' }>();

  // Get unique partners
  const partners = Array.from(new Set(performances.map(p => p.partner)));

  partners.forEach(partner => {
    const streak = calculatePartnerStreak(performances, partner);
    streaks.set(partner, streak);
  });

  return streaks;
}
