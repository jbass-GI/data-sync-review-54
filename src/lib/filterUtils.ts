import { Deal } from '@/types/dashboard';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, subDays, subMonths, subQuarters } from 'date-fns';

export interface DashboardFilters {
  datePreset: string;
  customDateRange?: { from: Date; to?: Date };
  dealType: 'all' | 'new' | 'renewal'; // Simple deal type filter
  partners: string[];
  channelTypes: string[];
  lifecycleTypes: string[];
  ticketSizeBuckets: string[];
  months: string[];
  quarters: string[];
}

export const DATE_PRESETS = [
  { value: 'mtd', label: 'MTD (Month-to-Date)' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'qtd', label: 'QTD (Quarter-to-Date)' },
  { value: 'ytd', label: 'YTD (Year-to-Date)' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'lastQuarter', label: 'Last Quarter' },
  { value: 'custom', label: 'Custom Range' }
];

export const CHANNEL_TYPES = ['Direct', 'ISO'];

export const LIFECYCLE_TYPES = ['New', 'Renewal', 'New - Add On', 'New - PIF', 'Other'];

export const TICKET_SIZE_BUCKETS = [
  { value: '<50k', label: '<$50k', min: 0, max: 50000 },
  { value: '50k-250k', label: '$50k-$250k', min: 50000, max: 250000 },
  { value: '250k-500k', label: '$250k-$500k', min: 250000, max: 500000 },
  { value: '500k-1m', label: '$500k-$1M', min: 500000, max: 1000000 },
  { value: '1m+', label: '$1M+', min: 1000000, max: Infinity }
];

/**
 * Get date range based on preset
 */
export function getDateRangeFromPreset(preset: string): { from: Date; to: Date } {
  const today = new Date();
  
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    
    case 'yesterday':
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: yesterday };
    
    case 'mtd':
      return { from: startOfMonth(today), to: today };
    
    case 'last7':
      return { from: subDays(today, 7), to: today };
    
    case 'last30':
      return { from: subDays(today, 30), to: today };
    
    case 'qtd':
      return { from: startOfQuarter(today), to: today };
    
    case 'ytd':
      return { from: startOfYear(today), to: today };
    
    case 'lastMonth':
      const lastMonth = subMonths(today, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    
    case 'lastQuarter':
      const lastQuarter = subQuarters(today, 1);
      return { from: startOfQuarter(lastQuarter), to: endOfQuarter(lastQuarter) };
    
    default:
      return { from: startOfMonth(today), to: today };
  }
}

/**
 * Normalize lifecycle/deal type for consistent filtering
 */
export function normalizeLifecycle(dealType: string): string {
  const normalized = dealType.toUpperCase().trim();
  
  if (normalized.includes('NEW') && normalized.includes('PIF')) return 'New - PIF';
  if (normalized.includes('ADD') && normalized.includes('ON')) return 'New - Add On';
  if (normalized.includes('RENEW')) return 'Renewal';
  if (normalized.includes('NEW')) return 'New';
  
  return 'Other';
}

/**
 * Get ticket size bucket for an amount
 */
export function getTicketSizeBucket(amount: number): string {
  if (amount < 50000) return '<50k';
  if (amount < 250000) return '50k-250k';
  if (amount < 500000) return '250k-500k';
  if (amount < 1000000) return '500k-1m';
  return '1m+';
}

/**
 * Get month-year string from date
 */
export function getMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

/**
 * Get quarter string from date
 */
export function getQuarter(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

/**
 * Apply all filters to deals
 */
export function applyFilters(deals: Deal[], filters: DashboardFilters): Deal[] {
  let filtered = [...deals];
  
  // Date filter
  if (filters.datePreset === 'custom' && filters.customDateRange?.from) {
    const { from, to } = filters.customDateRange;
    filtered = filtered.filter(deal => {
      const dealDate = deal.fundingDate;
      const isAfterStart = dealDate >= from;
      const isBeforeEnd = !to || dealDate <= to;
      return isAfterStart && isBeforeEnd;
    });
  } else if (filters.datePreset !== 'all') {
    const dateRange = getDateRangeFromPreset(filters.datePreset);
    filtered = filtered.filter(deal => {
      const dealDate = deal.fundingDate;
      return dealDate >= dateRange.from && dealDate <= dateRange.to;
    });
  }
  
  // Deal type filter (simple new/renewal)
  if (filters.dealType !== 'all') {
    filtered = filtered.filter(deal => {
      const lifecycle = normalizeLifecycle(deal.dealType);
      if (filters.dealType === 'new') {
        return lifecycle.includes('New');
      } else {
        return lifecycle === 'Renewal';
      }
    });
  }
  
  // Partner filter
  if (filters.partners.length > 0) {
    filtered = filtered.filter(deal => 
      filters.partners.includes(deal.partnerNormalized)
    );
  }
  
  // Channel type filter
  if (filters.channelTypes.length > 0) {
    filtered = filtered.filter(deal => {
      const channelType = deal.partnerNormalized === 'DIRECT' ? 'Direct' : 'ISO';
      return filters.channelTypes.includes(channelType);
    });
  }
  
  // Lifecycle filter
  if (filters.lifecycleTypes.length > 0) {
    filtered = filtered.filter(deal => {
      const lifecycle = normalizeLifecycle(deal.dealType);
      return filters.lifecycleTypes.includes(lifecycle);
    });
  }
  
  // Ticket size filter
  if (filters.ticketSizeBuckets.length > 0) {
    filtered = filtered.filter(deal => {
      const bucket = getTicketSizeBucket(deal.fundedAmount);
      return filters.ticketSizeBuckets.includes(bucket);
    });
  }
  
  // Month filter
  if (filters.months.length > 0) {
    filtered = filtered.filter(deal => {
      const monthYear = getMonthYear(deal.fundingDate);
      return filters.months.includes(monthYear);
    });
  }
  
  // Quarter filter
  if (filters.quarters.length > 0) {
    filtered = filtered.filter(deal => {
      const quarter = getQuarter(deal.fundingDate);
      return filters.quarters.includes(quarter);
    });
  }
  
  return filtered;
}

/**
 * Get unique values from deals for filter options
 */
export function getFilterOptions(deals: Deal[]) {
  const partners = Array.from(new Set(deals.map(d => d.partnerNormalized))).sort();
  const months = Array.from(new Set(deals.map(d => getMonthYear(d.fundingDate)))).sort();
  const quarters = Array.from(new Set(deals.map(d => getQuarter(d.fundingDate)))).sort();
  
  return { partners, months, quarters };
}
