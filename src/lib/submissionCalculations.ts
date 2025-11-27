import { format } from "date-fns";

/**
 * Calculate pipeline age bucket based on days in pipeline
 */
export function getPipelineAgeBucket(days: number): string {
  if (days < 30) return "Fresh <30d";
  if (days < 60) return "Warm 30-60d";
  if (days < 90) return "Cooling 60-90d";
  return "Stale 90+d";
}

/**
 * Calculate offer size bucket (different from deal ticket sizes)
 */
export function getOfferSizeBucket(amount: number): string {
  if (amount < 100000) return "<$100K";
  if (amount < 250000) return "$100-250K";
  if (amount < 500000) return "$250-500K";
  if (amount < 1000000) return "$500K-$1M";
  return "$1M+";
}

/**
 * Normalize stage to simplified category
 */
export function getStageCategory(stage: string): string {
  const s = stage.toLowerCase();
  if (s.includes('submission') || s.includes('queue')) return "Submitted";
  if (s.includes('pending') || s.includes('review')) return "In Review";
  if (s.includes('offer out') || s.includes('offered')) return "Offered";
  if (s.includes('fund')) return "Funded";
  return "Other";
}

/**
 * Format submission month as "YYYY-MM"
 */
export function getSubmissionMonth(date: Date): string {
  return format(date, "yyyy-MM");
}

/**
 * Format submission quarter as "Q# YYYY"
 */
export function getSubmissionQuarter(date: Date): string {
  const q = Math.ceil((date.getMonth() + 1) / 3);
  return `Q${q} ${date.getFullYear()}`;
}

/**
 * Calculate days in pipeline from submission date to today
 */
export function getDaysInPipeline(submittedDate: Date): number {
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - submittedDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
