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
