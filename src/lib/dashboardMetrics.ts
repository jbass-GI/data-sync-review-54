import { Deal, PartnerMetrics, DashboardMetrics } from '@/types/dashboard';
import { getChannelType, isDealTypeNew } from './parseExcel';

export function calculateDashboardMetrics(deals: Deal[]): DashboardMetrics {
  const totalFunded = deals.reduce((sum, deal) => sum + deal.fundedAmount, 0);
  const totalFees = deals.reduce((sum, deal) => sum + deal.mgmtFeeTotal, 0);
  const dealCount = deals.length;
  const avgTicketSize = dealCount > 0 ? totalFunded / dealCount : 0;
  const avgFeePercent = totalFunded > 0 ? (totalFees / totalFunded) * 100 : 0;
  
  const monthlyTarget = 30000000; // $30M target
  const targetProgress = (totalFunded / monthlyTarget) * 100;
  
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
