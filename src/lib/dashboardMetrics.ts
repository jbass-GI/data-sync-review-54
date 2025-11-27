import { Deal, PartnerMetrics, DashboardMetrics } from '@/types/dashboard';
import { getChannelType, isDealTypeNew } from './parseExcel';
import { differenceInDays } from 'date-fns';
import { calculateAllPartnerConsistency } from './streakAnalysis';

export function calculateDashboardMetrics(deals: Deal[], dateRange?: { from: Date; to?: Date }): DashboardMetrics {
  const totalFunded = deals.reduce((sum, deal) => sum + deal.fundedAmount, 0);
  const totalFees = deals.reduce((sum, deal) => sum + deal.mgmtFeeTotal, 0);
  const dealCount = deals.length;
  const avgTicketSize = dealCount > 0 ? totalFunded / dealCount : 0;
  const avgFeePercent = totalFunded > 0 ? (totalFees / totalFunded) * 100 : 0;
  
  // Fixed monthly target - always $30M regardless of date range
  const annualTarget = 360000000; // $360M annual target
  const monthlyTarget = annualTarget / 12; // Fixed $30M monthly target
  
  const targetProgress = monthlyTarget > 0 ? (totalFunded / monthlyTarget) * 100 : 0;
  
  const newDeals = deals.filter(d => isDealTypeNew(d.dealType));
  const renewalDeals = deals.filter(d => !isDealTypeNew(d.dealType));
  
  const newDealsFunded = newDeals.reduce((sum, deal) => sum + deal.fundedAmount, 0);
  const renewalDealsFunded = renewalDeals.reduce((sum, deal) => sum + deal.fundedAmount, 0);
  
  return {
    totalFunded,
    totalFees,
    dealCount,
    avgTicketSize,
    avgFeePercent,
    monthlyTarget,
    targetProgress,
    newDealsFunded,
    renewalDealsFunded
  };
}

export function calculatePartnerMetrics(deals: Deal[]): PartnerMetrics[] {
  const partnerMap = new Map<string, Deal[]>();
  
  // Group by normalized partner name for consistent reporting
  deals.forEach(deal => {
    const partnerKey = deal.partnerNormalized;
    const existing = partnerMap.get(partnerKey) || [];
    partnerMap.set(partnerKey, [...existing, deal]);
  });
  
  // Calculate consistency metrics for all partners
  const consistencyMetrics = calculateAllPartnerConsistency(deals);
  
  const metrics: PartnerMetrics[] = [];
  
  partnerMap.forEach((partnerDeals, partner) => {
    const totalFunded = partnerDeals.reduce((sum, d) => sum + d.fundedAmount, 0);
    const totalFees = partnerDeals.reduce((sum, d) => sum + d.mgmtFeeTotal, 0);
    const dealCount = partnerDeals.length;
    const avgTicketSize = totalFunded / dealCount;
    const avgFeePercent = (totalFees / totalFunded) * 100;
    const channelType = getChannelType(partner);
    
    const newDealsCount = partnerDeals.filter(d => isDealTypeNew(d.dealType)).length;
    const renewalDealsCount = dealCount - newDealsCount;
    
    const consistency = consistencyMetrics.get(partner);
    
    metrics.push({
      partner,
      channelType,
      totalFunded,
      totalFees,
      dealCount,
      avgTicketSize,
      avgFeePercent,
      newDealsCount,
      renewalDealsCount,
      consistencyScore: consistency?.consistencyScore || 0,
      consecutiveBusinessDays: consistency?.consecutiveBusinessDaysWithDeals || 0,
      consecutiveNewDeals: consistency?.consecutiveNewDeals || 0,
      consecutiveRenewalDeals: consistency?.consecutiveRenewalDeals || 0,
      daysWithMultipleDeals: consistency?.daysWithMultipleDeals || 0
    });
  });
  
  return metrics.sort((a, b) => b.totalFunded - a.totalFunded);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
