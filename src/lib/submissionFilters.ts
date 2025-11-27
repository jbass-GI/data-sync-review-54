import { Submission } from '@/types/submission';
import { startOfMonth, startOfQuarter, startOfYear, subDays, isWithinInterval } from 'date-fns';

export interface SubmissionFilters {
  datePreset: string;
  customDateRange?: { from: Date; to?: Date };
  isos: string[];
  stages: string[];
  offerSizeBuckets: string[];
  pipelineAgeBuckets: string[];
  reps: string[];
}

export const SUBMISSION_DATE_PRESETS = [
  { value: 'mtd', label: 'MTD' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last60', label: 'Last 60 Days' },
  { value: 'qtd', label: 'QTD' },
  { value: 'ytd', label: 'YTD' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom' }
];

export const OFFER_SIZE_BUCKETS = [
  '<$100K',
  '$100-250K',
  '$250-500K',
  '$500K-$1M',
  '$1M+'
];

export const PIPELINE_AGE_BUCKETS = [
  'Fresh <30d',
  'Warm 30-60d',
  'Cooling 60-90d',
  'Stale 90+d'
];

export const STAGE_CATEGORIES = [
  'Submitted',
  'In Review',
  'Offered',
  'Funded',
  'Other'
];

/**
 * Get date range from preset
 */
export function getDateRangeFromPreset(preset: string): { from: Date; to: Date } {
  const today = new Date();
  const to = today;
  let from = today;
  
  switch (preset) {
    case 'mtd':
      from = startOfMonth(today);
      break;
    case 'last30':
      from = subDays(today, 30);
      break;
    case 'last60':
      from = subDays(today, 60);
      break;
    case 'qtd':
      from = startOfQuarter(today);
      break;
    case 'ytd':
      from = startOfYear(today);
      break;
    case 'all':
      from = new Date(2020, 0, 1); // Far past date
      break;
    default:
      from = today;
  }
  
  return { from, to };
}

/**
 * Apply all filters to submissions
 */
export function applySubmissionFilters(
  submissions: Submission[],
  filters: SubmissionFilters
): Submission[] {
  let filtered = [...submissions];
  
  // Date filter
  if (filters.datePreset !== 'all') {
    const dateRange = filters.datePreset === 'custom' && filters.customDateRange
      ? filters.customDateRange
      : getDateRangeFromPreset(filters.datePreset);
    
    filtered = filtered.filter(sub => {
      const date = sub.leadSubmitted;
      return isWithinInterval(date, {
        start: dateRange.from,
        end: dateRange.to || new Date()
      });
    });
  }
  
  // ISO filter
  if (filters.isos.length > 0) {
    filtered = filtered.filter(sub => filters.isos.includes(sub.isoNormalized));
  }
  
  // Stage filter
  if (filters.stages.length > 0) {
    filtered = filtered.filter(sub => filters.stages.includes(sub.stageCategory));
  }
  
  // Offer size bucket filter
  if (filters.offerSizeBuckets.length > 0) {
    filtered = filtered.filter(sub => filters.offerSizeBuckets.includes(sub.offerSizeBucket));
  }
  
  // Pipeline age bucket filter
  if (filters.pipelineAgeBuckets.length > 0) {
    filtered = filtered.filter(sub => filters.pipelineAgeBuckets.includes(sub.pipelineAgeBucket));
  }
  
  // Rep filter
  if (filters.reps.length > 0) {
    filtered = filtered.filter(sub => filters.reps.includes(sub.rep));
  }
  
  return filtered;
}

/**
 * Get filter options from submissions
 */
export function getFilterOptions(submissions: Submission[]) {
  const isos = [...new Set(submissions.map(s => s.isoNormalized))]
    .filter(iso => iso !== 'UNKNOWN')
    .sort();
  
  const reps = [...new Set(submissions.map(s => s.rep))]
    .filter(rep => rep)
    .sort();
  
  return { isos, reps };
}
