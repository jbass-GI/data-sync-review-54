import { Deal, PartnerMetrics, DashboardMetrics } from '@/types/dashboard';
import { getChannelType, isDealTypeNew } from './parseExcel';
import { differenceInDays } from 'date-fns';

export function calculateDashboardMetrics(deals: Deal[], dateRange?: { from: Date; to?: Date }): DashboardMetrics {
  const totalFunded = deals.reduce((sum, deal) => sum + deal.fundedAmount, 0);
  const totalFees = deals.reduce((sum, deal) => sum + deal.mgmtFeeTotal, 0);
  const dealCount = deals.length;
  const avgTicketSize = dealCount > 0 ? totalFunded / dealCount : 0;
  const avgFeePercent = totalFunded > 0 ? (totalFees / totalFunded) * 100 : 0;
  
  // Calculate prorated target based on date range
  const baseMonthlyTarget = 30000000; // $30M monthly target
  const dailyTarget = baseMonthlyTarget / 30; // Assuming 30 days per month
  
  let monthlyTarget = baseMonthlyTarget;
  if (dateRange?.from) {
    const endDate = dateRange.to || new Date();
    const daysInRange = differenceInDays(endDate, dateRange.from) + 1; // +1 to include both start and end dates
    monthlyTarget = dailyTarget * daysInRange;
  }
  
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
  
  deals.forEach(deal => {
    const existing = partnerMap.get(deal.partner) || [];
    partnerMap.set(deal.partner, [...existing, deal]);
  });
  
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
    
    metrics.push({
      partner,
      channelType,
      totalFunded,
      totalFees,
      dealCount,
      avgTicketSize,
      avgFeePercent,
      newDealsCount,
      renewalDealsCount
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
