export interface Deal {
  dealName: string;
  feePercent: number;
  fundingDate: Date;
  fundedAmount: number;
  mgmtFeeTotal: number;
  partner: string;
  partnerNormalized: string; // Normalized partner name for consistent grouping
  dealType: string;
  notes?: string;
}

export interface PartnerMetrics {
  partner: string;
  channelType: 'Direct' | 'ISO';
  totalFunded: number;
  totalFees: number;
  dealCount: number;
  avgTicketSize: number;
  avgFeePercent: number;
  newDealsCount: number;
  renewalDealsCount: number;
  consistencyScore?: number; // 0-100 score based on deal patterns
  consecutiveBusinessDays?: number; // Consecutive business days with deals
  consecutiveNewDeals?: number; // Consecutive new deals streak
  consecutiveRenewalDeals?: number; // Consecutive renewal deals streak
  daysWithMultipleDeals?: number; // Days with 2+ deals
}

export interface DashboardMetrics {
  totalFunded: number;
  totalFees: number;
  dealCount: number;
  avgTicketSize: number;
  avgFeePercent: number;
  monthlyTarget: number;
  targetProgress: number;
  newDealsFunded: number;
  renewalDealsFunded: number;
}
