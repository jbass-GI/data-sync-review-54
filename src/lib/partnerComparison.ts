import { Deal } from '@/types/dashboard';
import { PartnerMetrics } from '@/types/dashboard';

export interface PartnerRanking extends PartnerMetrics {
  rank: number;
  percentileRank: number;
  fundedRank: number;
  feeRank: number;
  dealCountRank: number;
  avgTicketRank: number;
}

export interface ComparisonMetric {
  label: string;
  partner1Value: number;
  partner2Value: number;
  partner1Display: string;
  partner2Display: string;
  winner: 'partner1' | 'partner2' | 'tie';
  difference: number;
  differencePercent: number;
}

/**
 * Calculate partner rankings across multiple dimensions
 */
export function calculatePartnerRankings(partners: PartnerMetrics[]): PartnerRanking[] {
  if (partners.length === 0) return [];

  // Sort and rank by different metrics
  const sortedByFunded = [...partners].sort((a, b) => b.totalFunded - a.totalFunded);
  const sortedByFees = [...partners].sort((a, b) => b.totalFees - a.totalFees);
  const sortedByDealCount = [...partners].sort((a, b) => b.dealCount - a.dealCount);
  const sortedByAvgTicket = [...partners].sort((a, b) => b.avgTicketSize - a.avgTicketSize);

  return sortedByFunded.map((partner, index) => {
    const fundedRank = index + 1;
    const feeRank = sortedByFees.findIndex(p => p.partner === partner.partner) + 1;
    const dealCountRank = sortedByDealCount.findIndex(p => p.partner === partner.partner) + 1;
    const avgTicketRank = sortedByAvgTicket.findIndex(p => p.partner === partner.partner) + 1;

    // Overall rank is based on total funded (primary metric)
    const rank = fundedRank;
    const percentileRank = ((partners.length - rank + 1) / partners.length) * 100;

    return {
      ...partner,
      rank,
      percentileRank,
      fundedRank,
      feeRank,
      dealCountRank,
      avgTicketRank
    };
  });
}

/**
 * Compare two partners head-to-head
 */
export function comparePartners(
  partner1: PartnerMetrics,
  partner2: PartnerMetrics
): ComparisonMetric[] {
  const metrics: ComparisonMetric[] = [];

  // Total Funded
  const fundedDiff = partner1.totalFunded - partner2.totalFunded;
  const fundedLoserValue = fundedDiff > 0 ? partner2.totalFunded : partner1.totalFunded;
  metrics.push({
    label: 'Total Funded',
    partner1Value: partner1.totalFunded,
    partner2Value: partner2.totalFunded,
    partner1Display: formatCurrency(partner1.totalFunded),
    partner2Display: formatCurrency(partner2.totalFunded),
    winner: fundedDiff > 0 ? 'partner1' : fundedDiff < 0 ? 'partner2' : 'tie',
    difference: Math.abs(fundedDiff),
    differencePercent: fundedLoserValue > 0 
      ? (Math.abs(fundedDiff) / fundedLoserValue) * 100 
      : 0
  });

  // Total Fees
  const feesDiff = partner1.totalFees - partner2.totalFees;
  const feesLoserValue = feesDiff > 0 ? partner2.totalFees : partner1.totalFees;
  metrics.push({
    label: 'Total Fees',
    partner1Value: partner1.totalFees,
    partner2Value: partner2.totalFees,
    partner1Display: formatCurrency(partner1.totalFees),
    partner2Display: formatCurrency(partner2.totalFees),
    winner: feesDiff > 0 ? 'partner1' : feesDiff < 0 ? 'partner2' : 'tie',
    difference: Math.abs(feesDiff),
    differencePercent: feesLoserValue > 0 
      ? (Math.abs(feesDiff) / feesLoserValue) * 100 
      : 0
  });

  // Deal Count
  const dealCountDiff = partner1.dealCount - partner2.dealCount;
  const dealCountLoserValue = dealCountDiff > 0 ? partner2.dealCount : partner1.dealCount;
  metrics.push({
    label: 'Deal Count',
    partner1Value: partner1.dealCount,
    partner2Value: partner2.dealCount,
    partner1Display: partner1.dealCount.toString(),
    partner2Display: partner2.dealCount.toString(),
    winner: dealCountDiff > 0 ? 'partner1' : dealCountDiff < 0 ? 'partner2' : 'tie',
    difference: Math.abs(dealCountDiff),
    differencePercent: dealCountLoserValue > 0 
      ? (Math.abs(dealCountDiff) / dealCountLoserValue) * 100 
      : 0
  });

  // Average Ticket Size
  const avgTicketDiff = partner1.avgTicketSize - partner2.avgTicketSize;
  const avgTicketLoserValue = avgTicketDiff > 0 ? partner2.avgTicketSize : partner1.avgTicketSize;
  metrics.push({
    label: 'Avg Ticket Size',
    partner1Value: partner1.avgTicketSize,
    partner2Value: partner2.avgTicketSize,
    partner1Display: formatCurrency(partner1.avgTicketSize),
    partner2Display: formatCurrency(partner2.avgTicketSize),
    winner: avgTicketDiff > 0 ? 'partner1' : avgTicketDiff < 0 ? 'partner2' : 'tie',
    difference: Math.abs(avgTicketDiff),
    differencePercent: avgTicketLoserValue > 0 
      ? (Math.abs(avgTicketDiff) / avgTicketLoserValue) * 100 
      : 0
  });

  // Average Fee Percent
  const avgFeeDiff = partner1.avgFeePercent - partner2.avgFeePercent;
  const avgFeeLoserValue = avgFeeDiff > 0 ? partner2.avgFeePercent : partner1.avgFeePercent;
  metrics.push({
    label: 'Avg Fee %',
    partner1Value: partner1.avgFeePercent,
    partner2Value: partner2.avgFeePercent,
    partner1Display: `${partner1.avgFeePercent.toFixed(2)}%`,
    partner2Display: `${partner2.avgFeePercent.toFixed(2)}%`,
    winner: avgFeeDiff > 0 ? 'partner1' : avgFeeDiff < 0 ? 'partner2' : 'tie',
    difference: Math.abs(avgFeeDiff),
    differencePercent: avgFeeLoserValue > 0 
      ? (Math.abs(avgFeeDiff) / avgFeeLoserValue) * 100 
      : 0
  });

  // New Deals Count
  const newDealsDiff = partner1.newDealsCount - partner2.newDealsCount;
  const newDealsLoserValue = newDealsDiff > 0 ? partner2.newDealsCount : partner1.newDealsCount;
  metrics.push({
    label: 'New Deals',
    partner1Value: partner1.newDealsCount,
    partner2Value: partner2.newDealsCount,
    partner1Display: partner1.newDealsCount.toString(),
    partner2Display: partner2.newDealsCount.toString(),
    winner: newDealsDiff > 0 ? 'partner1' : newDealsDiff < 0 ? 'partner2' : 'tie',
    difference: Math.abs(newDealsDiff),
    differencePercent: newDealsLoserValue > 0 
      ? (Math.abs(newDealsDiff) / newDealsLoserValue) * 100 
      : 0
  });

  // Renewal Deals Count
  const renewalDealsDiff = partner1.renewalDealsCount - partner2.renewalDealsCount;
  const renewalDealsLoserValue = renewalDealsDiff > 0 ? partner2.renewalDealsCount : partner1.renewalDealsCount;
  metrics.push({
    label: 'Renewals',
    partner1Value: partner1.renewalDealsCount,
    partner2Value: partner2.renewalDealsCount,
    partner1Display: partner1.renewalDealsCount.toString(),
    partner2Display: partner2.renewalDealsCount.toString(),
    winner: renewalDealsDiff > 0 ? 'partner1' : renewalDealsDiff < 0 ? 'partner2' : 'tie',
    difference: Math.abs(renewalDealsDiff),
    differencePercent: renewalDealsLoserValue > 0 
      ? (Math.abs(renewalDealsDiff) / renewalDealsLoserValue) * 100 
      : 0
  });

  return metrics;
}

/**
 * Get performance radar chart data for a partner
 */
export function getPartnerRadarData(partner: PartnerMetrics, allPartners: PartnerMetrics[]) {
  const maxFunded = Math.max(...allPartners.map(p => p.totalFunded));
  const maxFees = Math.max(...allPartners.map(p => p.totalFees));
  const maxDeals = Math.max(...allPartners.map(p => p.dealCount));
  const maxAvgTicket = Math.max(...allPartners.map(p => p.avgTicketSize));
  const maxFeePercent = Math.max(...allPartners.map(p => p.avgFeePercent));

  return [
    {
      metric: 'Volume',
      value: maxFunded > 0 ? (partner.totalFunded / maxFunded) * 100 : 0,
      fullMark: 100
    },
    {
      metric: 'Fees',
      value: maxFees > 0 ? (partner.totalFees / maxFees) * 100 : 0,
      fullMark: 100
    },
    {
      metric: 'Deal Count',
      value: maxDeals > 0 ? (partner.dealCount / maxDeals) * 100 : 0,
      fullMark: 100
    },
    {
      metric: 'Avg Ticket',
      value: maxAvgTicket > 0 ? (partner.avgTicketSize / maxAvgTicket) * 100 : 0,
      fullMark: 100
    },
    {
      metric: 'Fee %',
      value: maxFeePercent > 0 ? (partner.avgFeePercent / maxFeePercent) * 100 : 0,
      fullMark: 100
    }
  ];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
