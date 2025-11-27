import { useState } from 'react';
import { Filter, X, ChevronDown, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DashboardFilters, 
  getDatePresets,
  CHANNEL_TYPES, 
  LIFECYCLE_TYPES, 
  TICKET_SIZE_BUCKETS 
} from '@/lib/filterUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangeFilter } from './DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { Deal } from '@/types/dashboard';

interface FilterBarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  availablePartners: string[];
  availableMonths: string[];
  availableQuarters: string[];
  deals: Deal[];
  onComparisonToggle?: () => void;
  isComparisonActive?: boolean;
}

export function FilterBar({ 
  filters, 
  onFiltersChange, 
  availablePartners,
  availableMonths,
  availableQuarters,
  deals,
  onComparisonToggle,
  isComparisonActive = false
}: FilterBarProps) {
  const [partnerSearch, setPartnerSearch] = useState('');
  
  const datePresets = getDatePresets(deals);
  
  const filteredPartners = availablePartners.filter(p => 
    p.toLowerCase().includes(partnerSearch.toLowerCase())
  );

  const handleDatePresetChange = (preset: string) => {
    onFiltersChange({ ...filters, datePreset: preset, customDateRange: undefined });
  };

  const handleCustomDateChange = (range: DateRange | undefined) => {
    onFiltersChange({ 
      ...filters, 
      datePreset: 'custom', 
      customDateRange: range 
    });
  };

  const togglePartner = (partner: string) => {
    const newPartners = filters.partners.includes(partner)
      ? filters.partners.filter(p => p !== partner)
      : [...filters.partners, partner];
    onFiltersChange({ ...filters, partners: newPartners });
  };

  const toggleChannelType = (type: string) => {
    const newTypes = filters.channelTypes.includes(type)
      ? filters.channelTypes.filter(t => t !== type)
      : [...filters.channelTypes, type];
    onFiltersChange({ ...filters, channelTypes: newTypes });
  };

  const toggleLifecycleType = (type: string) => {
    const newTypes = filters.lifecycleTypes.includes(type)
      ? filters.lifecycleTypes.filter(t => t !== type)
      : [...filters.lifecycleTypes, type];
    onFiltersChange({ ...filters, lifecycleTypes: newTypes });
  };

  const toggleTicketBucket = (bucket: string) => {
    const newBuckets = filters.ticketSizeBuckets.includes(bucket)
      ? filters.ticketSizeBuckets.filter(b => b !== bucket)
      : [...filters.ticketSizeBuckets, bucket];
    onFiltersChange({ ...filters, ticketSizeBuckets: newBuckets });
  };

  const toggleMonth = (month: string) => {
    const newMonths = filters.months.includes(month)
      ? filters.months.filter(m => m !== month)
      : [...filters.months, month];
    onFiltersChange({ ...filters, months: newMonths });
  };

  const toggleQuarter = (quarter: string) => {
    const newQuarters = filters.quarters.includes(quarter)
      ? filters.quarters.filter(q => q !== quarter)
      : [...filters.quarters, quarter];
    onFiltersChange({ ...filters, quarters: newQuarters });
  };

  const resetFilters = () => {
    onFiltersChange({
      datePreset: 'mtd',
      dealType: 'all',
      partners: [],
      channelTypes: [],
      lifecycleTypes: [],
      ticketSizeBuckets: [],
      months: [],
      quarters: []
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      datePreset: 'all',
      dealType: 'all',
      partners: [],
      channelTypes: [],
      lifecycleTypes: [],
      ticketSizeBuckets: [],
      months: [],
      quarters: []
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.datePreset !== 'mtd' && filters.datePreset !== 'all') count++;
    if (filters.dealType !== 'all') count++;
    if (filters.partners.length > 0) count += filters.partners.length;
    if (filters.channelTypes.length > 0) count += filters.channelTypes.length;
    if (filters.lifecycleTypes.length > 0) count += filters.lifecycleTypes.length;
    if (filters.ticketSizeBuckets.length > 0) count += filters.ticketSizeBuckets.length;
    if (filters.months.length > 0) count += filters.months.length;
    if (filters.quarters.length > 0) count += filters.quarters.length;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className="bg-card/50 backdrop-blur border-b border-border/50 p-4">
      <div className="container mx-auto space-y-4">
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>

          {/* Date Range */}
          {filters.datePreset === 'custom' ? (
            <DateRangeFilter
              dateRange={filters.customDateRange}
              onDateRangeChange={handleCustomDateChange}
            />
          ) : (
            <Select value={filters.datePreset} onValueChange={handleDatePresetChange}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {datePresets.map(preset => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Deal Type Filter */}
          <Select 
            value={filters.dealType} 
            onValueChange={(value: 'all' | 'new' | 'renewal') => 
              onFiltersChange({ ...filters, dealType: value })
            }
          >
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Deal Type" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Deals</SelectItem>
              <SelectItem value="new">New Only</SelectItem>
              <SelectItem value="renewal">Renewal Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Partner/ISO Multi-Select */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-background">
                Partner/ISO {filters.partners.length > 0 && `(${filters.partners.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-background z-50" align="start">
              <div className="space-y-4">
                <Input
                  placeholder="Search partners..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  className="bg-background"
                />
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {filteredPartners.map(partner => (
                      <div key={partner} className="flex items-center space-x-2">
                        <Checkbox
                          id={`partner-${partner}`}
                          checked={filters.partners.includes(partner)}
                          onCheckedChange={() => togglePartner(partner)}
                        />
                        <Label htmlFor={`partner-${partner}`} className="cursor-pointer flex-1">
                          {partner}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>

          {/* Channel Type */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-background">
                Channel {filters.channelTypes.length > 0 && `(${filters.channelTypes.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 bg-background z-50" align="start">
              <div className="space-y-2">
                {CHANNEL_TYPES.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`channel-${type}`}
                      checked={filters.channelTypes.includes(type)}
                      onCheckedChange={() => toggleChannelType(type)}
                    />
                    <Label htmlFor={`channel-${type}`} className="cursor-pointer flex-1">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* New/Renewal */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-background">
                Lifecycle {filters.lifecycleTypes.length > 0 && `(${filters.lifecycleTypes.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 bg-background z-50" align="start">
              <div className="space-y-2">
                {LIFECYCLE_TYPES.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lifecycle-${type}`}
                      checked={filters.lifecycleTypes.includes(type)}
                      onCheckedChange={() => toggleLifecycleType(type)}
                    />
                    <Label htmlFor={`lifecycle-${type}`} className="cursor-pointer flex-1">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Ticket Size */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-background">
                Ticket Size {filters.ticketSizeBuckets.length > 0 && `(${filters.ticketSizeBuckets.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 bg-background z-50" align="start">
              <div className="space-y-2">
                {TICKET_SIZE_BUCKETS.map(bucket => (
                  <div key={bucket.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bucket-${bucket.value}`}
                      checked={filters.ticketSizeBuckets.includes(bucket.value)}
                      onCheckedChange={() => toggleTicketBucket(bucket.value)}
                    />
                    <Label htmlFor={`bucket-${bucket.value}`} className="cursor-pointer flex-1">
                      {bucket.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Month */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-background">
                Month {filters.months.length > 0 && `(${filters.months.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 bg-background z-50" align="start">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {availableMonths.map(month => (
                    <div key={month} className="flex items-center space-x-2">
                      <Checkbox
                        id={`month-${month}`}
                        checked={filters.months.includes(month)}
                        onCheckedChange={() => toggleMonth(month)}
                      />
                      <Label htmlFor={`month-${month}`} className="cursor-pointer flex-1">
                        {month}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Quarter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-background">
                Quarter {filters.quarters.length > 0 && `(${filters.quarters.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 bg-background z-50" align="start">
              <div className="space-y-2">
                {availableQuarters.map(quarter => (
                  <div key={quarter} className="flex items-center space-x-2">
                    <Checkbox
                      id={`quarter-${quarter}`}
                      checked={filters.quarters.includes(quarter)}
                      onCheckedChange={() => toggleQuarter(quarter)}
                    />
                    <Label htmlFor={`quarter-${quarter}`} className="cursor-pointer flex-1">
                      {quarter}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex-1" />

          {/* Comparison Toggle */}
          {onComparisonToggle && (
            <Button 
              variant={isComparisonActive ? "default" : "outline"} 
              size="sm" 
              onClick={onComparisonToggle}
              className="gap-2"
            >
              <GitCompare className="h-4 w-4" />
              {isComparisonActive ? 'Comparing' : 'Compare Periods'}
            </Button>
          )}

          {/* Reset/Clear Buttons */}
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset to MTD
          </Button>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active Filters ({activeCount}):</span>
            
            {filters.datePreset !== 'mtd' && filters.datePreset !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {datePresets.find(p => p.value === filters.datePreset)?.label || 'Custom'}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleDatePresetChange('mtd')}
                />
              </Badge>
            )}

            {filters.dealType !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {filters.dealType === 'new' ? 'New Only' : 'Renewal Only'}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onFiltersChange({ ...filters, dealType: 'all' })}
                />
              </Badge>
            )}
            
            {filters.partners.map(partner => (
              <Badge key={partner} variant="secondary" className="gap-1">
                {partner}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => togglePartner(partner)}
                />
              </Badge>
            ))}
            
            {filters.channelTypes.map(type => (
              <Badge key={type} variant="secondary" className="gap-1">
                {type}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleChannelType(type)}
                />
              </Badge>
            ))}
            
            {filters.lifecycleTypes.map(type => (
              <Badge key={type} variant="secondary" className="gap-1">
                {type}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleLifecycleType(type)}
                />
              </Badge>
            ))}
            
            {filters.ticketSizeBuckets.map(bucket => (
              <Badge key={bucket} variant="secondary" className="gap-1">
                {TICKET_SIZE_BUCKETS.find(b => b.value === bucket)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleTicketBucket(bucket)}
                />
              </Badge>
            ))}
            
            {filters.months.map(month => (
              <Badge key={month} variant="secondary" className="gap-1">
                {month}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleMonth(month)}
                />
              </Badge>
            ))}
            
            {filters.quarters.map(quarter => (
              <Badge key={quarter} variant="secondary" className="gap-1">
                {quarter}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleQuarter(quarter)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
