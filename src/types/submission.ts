export interface Submission {
  // Raw fields from Monday.com
  name: string;
  iso: string;
  isoNormalized: string;
  rep: string;
  stage: string;
  offerAmount: number;
  leadReceived: Date | null;
  leadSubmitted: Date;
  daysSinceSub: number;
  
  // Calculated fields
  submissionMonth: string;      // "2025-01"
  submissionQuarter: string;    // "Q1 2025"
  daysInPipeline: number;
  pipelineAgeBucket: string;    // "Fresh <30d", "Warm 30-60d", etc.
  offerSizeBucket: string;      // "<$100K", "$100-250K", etc.
  stageCategory: string;        // "Submitted", "In Review", "Offered", "Funded", "Other"
}

export interface ISOMetrics {
  iso: string;
  totalSubmissions: number;
  avgOfferAmount: number;
  minOffer: number;
  maxOffer: number;
  offersMade: number;
  avgDaysInPipeline: number;
  uniqueReps: number;
  reps: string[];
  submissionsByMonth: Record<string, number>;
}

export interface DataQualityMetrics {
  totalRecords: number;
  validISOCount: number;
  validISOPercent: number;
  missingOfferAmount: number;
  earliestDate: Date | null;
  latestDate: Date | null;
  uniqueISOs: number;
  isoList: string[];
  normalizationsApplied: number;
}

export interface ColumnMapping {
  name: string;           // Business name column
  iso: string;            // ISO column
  rep: string;            // Rep column
  stage: string;          // Stage column
  offerAmount: string;    // Offer amount column
  leadReceived: string;   // Lead received date column
  leadSubmitted: string;  // Lead submitted date column
  daysSinceSub?: string;  // Optional days since sub column
}
