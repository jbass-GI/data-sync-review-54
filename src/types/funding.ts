export interface FundingRecord {
  dealName: string;
  fundingDate: Date;
  fundedAmount: number;
  managementFee: number;
  partner: string;
  partnerNormalized: string;
  dealType?: string; // 'New' | 'Renewal'
}

export interface FundingMatch {
  submissionId: string;
  fundingRecordId: string;
  matchType: 'exact' | 'starts-with' | 'contains' | 'fuzzy' | 'manual';
  confidence: number;
}

export interface UnmatchedSubmission {
  submission: any;
  potentialMatches: FundingRecord[];
}

export interface ConversionMetrics {
  iso: string;
  totalSubmissions: number;
  fundedCount: number;
  offeredCount: number;
  overallConversionRate: number;
  submissionToOfferRate: number;
  offerToFundedRate: number;
  totalRevenue: number;
  avgDaysToFund: number;
  avgOfferToFundedRatio: number;
  avgOfferAmount: number;
  avgFundedAmount: number;
  minDaysToFund?: number;
  maxDaysToFund?: number;
}

export interface FundingColumnMapping {
  dealName: string;
  fundingDate: string;
  fundedAmount: string;
  managementFee: string;
  partner: string;
  dealType?: string;
}
