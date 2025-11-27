import { Deal } from '@/types/dashboard';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subMonths, subQuarters } from 'date-fns';

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
  { value: 'lastYear', label: 'Last Year' },
  { value: 'last12months', label: 'Last 12 Months' },
  { value: 'custom', label: 'Custom Range' }
];

/**
 * Get available years from deals
 */
export function getAvailableYears(deals: Deal[]): number[] {
  if (deals.length === 0) return [];
  
  const years = new Set<number>();
  deals.forEach(deal => {
    years.add(deal.fundingDate.getFullYear());
  });
  
  return Array.from(years).sort((a, b) => b - a); // Most recent first
}

/**
 * Get date presets dynamically based on available data
 */
export function getDatePresets(deals: Deal[]): typeof DATE_PRESETS {
  const basePresets = [...DATE_PRESETS];
  const years = getAvailableYears(deals);
  
  // If data spans multiple years, add year options
  if (years.length > 1) {
    const yearPresets = years.map(year => ({
      value: `year-${year}`,
      label: `${year}`
    }));
    
    // Insert year presets before "custom"
    const customIndex = basePresets.findIndex(p => p.value === 'custom');
    basePresets.splice(customIndex, 0, ...yearPresets);
  }
  
  return basePresets;
}

/**
 * Get display labels based on filter preset
 */
export function getFilterDisplayLabels(preset: string) {
  // Handle year presets
  if (preset.startsWith('year-')) {
    const year = preset.replace('year-', '');
    return {
      fundedLabel: `Total Funded (${year})`,
      dealsLabel: `Closed in ${year}`,
      targetLabel: `${year} Annual Target Progress`
    };
  }
  
  switch (preset) {
    case 'mtd':
      return {
        fundedLabel: 'Total Funded (MTD)',
        dealsLabel: 'Closed this month',
        targetLabel: 'Monthly Target Progress'
      };
    case 'qtd':
      return {
        fundedLabel: 'Total Funded (QTD)',
        dealsLabel: 'Closed this quarter',
        targetLabel: 'Quarterly Target Progress'
      };
    case 'ytd':
      return {
        fundedLabel: 'Total Funded (YTD)',
        dealsLabel: 'Closed this year',
        targetLabel: 'Annual Target Progress'
      };
    case 'lastMonth':
      return {
        fundedLabel: 'Total Funded (Last Month)',
        dealsLabel: 'Closed last month',
        targetLabel: 'Monthly Target Progress'
      };
    case 'lastQuarter':
      return {
        fundedLabel: 'Total Funded (Last Quarter)',
        dealsLabel: 'Closed last quarter',
        targetLabel: 'Quarterly Target Progress'
      };
    case 'lastYear':
      return {
        fundedLabel: 'Total Funded (Last Year)',
        dealsLabel: 'Closed last year',
        targetLabel: 'Annual Target Progress'
      };
    case 'last12months':
      return {
        fundedLabel: 'Total Funded (Last 12 Months)',
        dealsLabel: 'Closed in last 12 months',
        targetLabel: 'Annual Target Progress'
      };
    case 'today':
      return {
        fundedLabel: 'Total Funded (Today)',
        dealsLabel: 'Closed today',
        targetLabel: 'Daily Target Progress'
      };
    case 'yesterday':
      return {
        fundedLabel: 'Total Funded (Yesterday)',
        dealsLabel: 'Closed yesterday',
        targetLabel: 'Daily Target Progress'
      };
    case 'last7':
      return {
        fundedLabel: 'Total Funded (Last 7 Days)',
        dealsLabel: 'Closed in period',
        targetLabel: 'Period Target Progress'
      };
    case 'last30':
      return {
        fundedLabel: 'Total Funded (Last 30 Days)',
        dealsLabel: 'Closed in period',
        targetLabel: 'Period Target Progress'
      };
    case 'custom':
      return {
        fundedLabel: 'Total Funded (Custom Range)',
        dealsLabel: 'Closed in period',
        targetLabel: 'Period Target Progress'
      };
    case 'all':
      return {
        fundedLabel: 'Total Funded (All Time)',
        dealsLabel: 'Total deals closed',
        targetLabel: 'Target Progress'
      };
    default:
      return {
        fundedLabel: 'Total Funded',
        dealsLabel: 'Deals closed',
        targetLabel: 'Target Progress'
      };
  }
}

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
 * Get date range based on preset and actual data
 */
export function getDateRangeFromPreset(preset: string, deals?: Deal[]): { from: Date; to: Date } {
  // Use the most recent deal date as "today" if data exists, otherwise use actual today
  let referenceDate = new Date();
  if (deals && deals.length > 0) {
    const dealDates = deals.map(d => d.fundingDate);
    referenceDate = new Date(Math.max(...dealDates.map(d => d.getTime())));
  }
  
  // Handle year presets (e.g., "year-2024")
  if (preset.startsWith('year-')) {
    const year = parseInt(preset.replace('year-', ''));
    return {
      from: new Date(year, 0, 1), // January 1st
      to: new Date(year, 11, 31, 23, 59, 59) // December 31st
    };
  }
  
  switch (preset) {
    case 'today':
      return { from: referenceDate, to: referenceDate };
    
    case 'yesterday':
      const yesterday = subDays(referenceDate, 1);
      return { from: yesterday, to: yesterday };
    
    case 'mtd':
      return { from: startOfMonth(referenceDate), to: referenceDate };
    
    case 'last7':
      return { from: subDays(referenceDate, 7), to: referenceDate };
    
    case 'last30':
      return { from: subDays(referenceDate, 30), to: referenceDate };
    
    case 'qtd':
      return { from: startOfQuarter(referenceDate), to: referenceDate };
    
    case 'ytd':
      return { from: startOfYear(referenceDate), to: referenceDate };
    
    case 'lastMonth':
      const lastMonth = subMonths(referenceDate, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    
    case 'lastQuarter':
      const lastQuarter = subQuarters(referenceDate, 1);
      return { from: startOfQuarter(lastQuarter), to: endOfQuarter(lastQuarter) };
    
    case 'lastYear':
      const lastYearDate = new Date(referenceDate.getFullYear() - 1, 0, 1);
      return { from: startOfYear(lastYearDate), to: endOfYear(lastYearDate) };
    
    case 'last12months':
      return { from: subMonths(referenceDate, 12), to: referenceDate };
    
    default:
      return { from: startOfMonth(referenceDate), to: referenceDate };
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
    // Pass all deals to get proper reference date
    const dateRange = getDateRangeFromPreset(filters.datePreset, deals);
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
